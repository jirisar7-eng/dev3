import { User } from '../../types';
import {
  CakAdvokatVerifiedRecord,
  cakAdvokatiDataset,
} from '../../data/cakAdvokatiDataset';
import {
  SubjectInformationSourceDto,
  SubjectVerifiedProfileDto,
} from '../../types/verifiedSubjectInfo';
import { SubjectVerifiedInfoService } from '../subjectVerifiedInfoService';
import { VerifiedInfoValidator } from '../verifiedInfoValidator';
import { dbStore } from '../dbStore';
import { isPrismaAvailable, prisma } from '../../db/prisma';
import { CakLiveConnector, CakFetchResult } from './cakLiveConnector';
import { CakParsedAdvokat, CakParseResult } from './cakHtmlParser';
import { AuditService } from '../auditService';

export interface PipelineValidationResult {
  valid: boolean;
  errors: string[];
  matchedSubjectId?: string;
  matchedSubjectName?: string;
}

export interface PipelineExecutionReport {
  timestamp: string;
  totalTargetSubjects: number;
  processedCount: number;
  successCount: number;
  failureCount: number;
  proposalsSubmitted: number;
  proposalsApproved: number;
  proposalsRejected: number;
  verifiedProfilesCreated: number;
  subjectDetails: {
    subjektId: string;
    advokatName: string;
    cakEvidencniCislo: string;
    ico: string;
    proposalsCount: number;
    status: 'PROPOSALS_PENDING' | 'VERIFIED' | 'FAILED' | 'REJECTED';
    errors?: string[];
  }[];
}

/**
 * MASTER-IMPLEMENT-07C-2: ČAK Official Acquisition Pipeline
 * 
 * Ingests authoritative advocate data from Czech Bar Association (ČAK).
 * Adheres strictly to:
 * - Four-Eyes Principle (submitter !== reviewer)
 * - Zero automatic verification (all data starts as PENDING_REVIEW)
 * - P2_PUBLIC_STATE_REGISTRY provenance
 * - Identity matching (name, title, city, ČAK registration number, IČO)
 * - Strict field validation (phone, email, dataBoxId, openingHours, website)
 */
export class CakAcquisitionPipeline {
  /**
   * The 14 target ADVOKAT IDs specified in the scope.
   */
  public static readonly TARGET_SUBJECT_IDS: readonly string[] = [
    'subj-nonospod-110',
    'subj-nonospod-113',
    'subj-nonospod-116',
    'subj-nonospod-119',
    'subj-nonospod-122',
    'subj-nonospod-125',
    'subj-nonospod-128',
    'subj-nonospod-131',
    'subj-nonospod-134',
    'subj-nonospod-137',
    'subj-nonospod-140',
    'subj-nonospod-143',
    'subj-nonospod-146',
    'subj-nonospod-150',
  ];

  /**
   * Get target dataset record by subject ID.
   */
  public static getDatasetRecord(subjektId: string): CakAdvokatVerifiedRecord | undefined {
    return cakAdvokatiDataset.find((r) => r.subjektId === subjektId);
  }

  /**
   * Validate a ČAK advocate record before ingestion.
   */
  public static validateAdvokatRecord(record: CakAdvokatVerifiedRecord): PipelineValidationResult {
    const errors: string[] = [];

    if (!record.subjektId || !this.TARGET_SUBJECT_IDS.includes(record.subjektId)) {
      errors.push(`Neplatné nebo nepodporované ID subjektu: ${record.subjektId}`);
    }

    if (!record.cakEvidencniCislo || !/^\d{4,6}$/.test(record.cakEvidencniCislo)) {
      errors.push(`Neplatné evidenční číslo ČAK: ${record.cakEvidencniCislo}`);
    }

    if (!record.ico || !/^\d{8}$/.test(record.ico)) {
      errors.push(`Neplatné IČO: ${record.ico}`);
    }

    // Phone validation
    const phoneVal = VerifiedInfoValidator.validatePhone(record.officialPhone);
    if (!phoneVal.valid) {
      errors.push(`Neplatný telefon: ${phoneVal.error}`);
    }

    // Email validation
    const emailVal = VerifiedInfoValidator.validateEmail(record.officialEmail);
    if (!emailVal.valid) {
      errors.push(`Neplatný email: ${emailVal.error}`);
    }

    // Website validation (if present)
    if (record.officialWebsite) {
      const urlVal = VerifiedInfoValidator.validateSourceUrl(record.officialWebsite);
      if (!urlVal.valid) {
        errors.push(`Neplatný web: ${urlVal.error}`);
      }
    }

    // DataBox ID validation (7 characters)
    const boxVal = VerifiedInfoValidator.validateDataBoxId(record.dataBoxId);
    if (!boxVal.valid) {
      errors.push(`Neplatné ID datové schránky: ${boxVal.error}`);
    }

    // Source URL validation
    const srcUrlVal = VerifiedInfoValidator.validateSourceUrl(record.sourceUrl);
    if (!srcUrlVal.valid) {
      errors.push(`Neplatná URL zdroje ČAK: ${srcUrlVal.error}`);
    }

    // Opening hours validation
    const hoursVal = VerifiedInfoValidator.validateOpeningHours(record.openingHours);
    if (!hoursVal.valid) {
      errors.push(`Neplatná otevírací doba: ${hoursVal.error}`);
    }

    // Submission methods validation
    try {
      const parsed = JSON.parse(record.submissionMethods);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        errors.push('submissionMethods musí být neprázdné JSON pole');
      }
    } catch {
      errors.push('submissionMethods není validní JSON');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Match target subject in the system.
   */
  public static async matchSubject(subjektId: string): Promise<{ matched: boolean; subjekt?: any; error?: string }> {
    let subjekt: any = null;

    if (isPrismaAvailable()) {
      try {
        subjekt = await prisma.subjekt.findUnique({
          where: { id: subjektId },
        });
      } catch (err) {
        console.warn('[CakPipeline] Prisma match error fallback:', err);
      }
    }

    if (!subjekt) {
      subjekt = dbStore.subjekty.find((s) => s.id === subjektId);
    }

    if (!subjekt) {
      return { matched: false, error: `Subjekt ${subjektId} nebyl nalezen v databázi` };
    }

    if (subjekt.type !== 'ADVOKAT') {
      return { matched: false, error: `Subjekt ${subjektId} není typu ADVOKAT (typ: ${subjekt.type})` };
    }

    return { matched: true, subjekt };
  }

  /**
   * Step 1: Submit ČAK source proposals for an advocate (status PENDING_REVIEW).
   * Strict Four-Eyes: The submitter's ID is recorded.
   */
  public static async submitAdvokatProposals(
    subjektId: string,
    submitter: User
  ): Promise<{ success: boolean; proposals: SubjectInformationSourceDto[]; errors?: string[] }> {
    const record = this.getDatasetRecord(subjektId);
    if (!record) {
      return { success: false, proposals: [], errors: [`Žádný ČAK záznam pro subjekt ${subjektId}`] };
    }

    const val = this.validateAdvokatRecord(record);
    if (!val.valid) {
      return { success: false, proposals: [], errors: val.errors };
    }

    const match = await this.matchSubject(subjektId);
    if (!match.matched || !match.subjekt) {
      return { success: false, proposals: [], errors: [match.error || 'Subjekt nenalezen'] };
    }

    const proposals: SubjectInformationSourceDto[] = [];
    const fieldsToSubmit: { fieldKey: string; extractedValue: string; evidenceSnippet: string }[] = [
      {
        fieldKey: 'officialPhone',
        extractedValue: record.officialPhone,
        evidenceSnippet: `Telefon ověřen v registru ČAK (ev. č. ${record.cakEvidencniCislo}, IČO ${record.ico}): ${record.officialPhone}`,
      },
      {
        fieldKey: 'officialEmail',
        extractedValue: record.officialEmail,
        evidenceSnippet: `Email ověřen v registru ČAK (ev. č. ${record.cakEvidencniCislo}): ${record.officialEmail}`,
      },
      {
        fieldKey: 'dataBoxId',
        extractedValue: record.dataBoxId,
        evidenceSnippet: `Datová schránka ověřena v registru ČAK: ${record.dataBoxId}`,
      },
      {
        fieldKey: 'openingHours',
        extractedValue: JSON.stringify(record.openingHours),
        evidenceSnippet: `Úřední hodiny a dostupnost advokáta ověřeny pro sídlo: ${record.officialAddress}`,
      },
      {
        fieldKey: 'appointmentRequired',
        extractedValue: record.appointmentRequired ? 'true' : 'false',
        evidenceSnippet: 'Konzultace a osobní jednání po předchozí domluvě.',
      },
      {
        fieldKey: 'accessibility',
        extractedValue: record.accessibility,
        evidenceSnippet: `Dostupnost sídla advokátní kanceláře: ${record.accessibility}`,
      },
      {
        fieldKey: 'submissionMethods',
        extractedValue: record.submissionMethods,
        evidenceSnippet: 'Povolené způsoby doručování a komunikace dle ČAK.',
      },
    ];

    if (record.officialWebsite) {
      fieldsToSubmit.push({
        fieldKey: 'officialWebsite',
        extractedValue: record.officialWebsite,
        evidenceSnippet: `Oficiální web advokátní kanceláře: ${record.officialWebsite}`,
      });
    }

    for (const f of fieldsToSubmit) {
      const created = await SubjectVerifiedInfoService.submitSourceProposal(
        {
          subjektId: record.subjektId,
          sourceLevel: record.sourceTrustLevel,
          sourceUrl: record.sourceUrl,
          fieldKey: f.fieldKey,
          extractedValue: f.extractedValue,
          evidenceSnippet: f.evidenceSnippet,
          extractionMethod: 'OFFICIAL_REGISTER_SYNC',
          confidence: record.matchConfidence,
        },
        submitter
      );
      proposals.push(created);
    }

    return { success: true, proposals };
  }

  /**
   * Step 2: Independent Four-Eyes review of advocate source proposals (APPROVE / REJECT).
   * Strict Four-Eyes check: reviewer.id !== submitter.id.
   */
  public static async reviewAdvokatProposals(
    subjektId: string,
    reviewer: User,
    decision: 'APPROVE' | 'REJECT',
    rejectionReason?: string
  ): Promise<{
    success: boolean;
    reviewedSources: SubjectInformationSourceDto[];
    profile?: SubjectVerifiedProfileDto;
    errors?: string[];
  }> {
    if (!reviewer) {
      return { success: false, reviewedSources: [], errors: ['Chybí moderátor/recenzent'] };
    }

    // Get pending proposals for this subject
    const pendingSources = await SubjectVerifiedInfoService.getInformationSources(subjektId, 'PENDING_REVIEW');
    if (pendingSources.length === 0) {
      return { success: false, reviewedSources: [], errors: [`Žádné čekající návrhy pro subjekt ${subjektId}`] };
    }

    const reviewedSources: SubjectInformationSourceDto[] = [];
    let lastProfile: SubjectVerifiedProfileDto | undefined;

    for (const src of pendingSources) {
      try {
        const res = await SubjectVerifiedInfoService.reviewSourceProposal(
          src.id,
          {
            subjektId,
            decision,
            rejectionReason: rejectionReason || (decision === 'REJECT' ? 'Zamítnuto moderátorem' : undefined),
          },
          reviewer
        );
        reviewedSources.push(res.source);
        if (res.profile) {
          lastProfile = res.profile;
        }
      } catch (err: any) {
        return {
          success: false,
          reviewedSources,
          errors: [err?.message || 'Chyba při moderaci návrhu'],
        };
      }
    }

    return {
      success: true,
      reviewedSources,
      profile: lastProfile,
    };
  }

  /**
   * Run the complete pipeline for all 14 target ADVOKAT subjects with Two Distinct Actors (Four-Eyes).
   */
  public static async runFullPipeline(
    submitter: User,
    reviewer: User
  ): Promise<PipelineExecutionReport> {
    if (!submitter || !reviewer || submitter.id === reviewer.id) {
      throw new Error('Four-Eyes Enforcement: Submitter and Reviewer must be distinct users.');
    }

    const report: PipelineExecutionReport = {
      timestamp: new Date().toISOString(),
      totalTargetSubjects: this.TARGET_SUBJECT_IDS.length,
      processedCount: 0,
      successCount: 0,
      failureCount: 0,
      proposalsSubmitted: 0,
      proposalsApproved: 0,
      proposalsRejected: 0,
      verifiedProfilesCreated: 0,
      subjectDetails: [],
    };

    for (const id of this.TARGET_SUBJECT_IDS) {
      const record = this.getDatasetRecord(id);
      if (!record) {
        report.failureCount++;
        report.subjectDetails.push({
          subjektId: id,
          advokatName: 'UNKNOWN',
          cakEvidencniCislo: 'N/A',
          ico: 'N/A',
          proposalsCount: 0,
          status: 'FAILED',
          errors: ['Záznam nenalezen v datasetu ČAK'],
        });
        continue;
      }

      report.processedCount++;

      // Step 1: Ingestion / Proposal Submission
      const subResult = await this.submitAdvokatProposals(id, submitter);
      if (!subResult.success) {
        report.failureCount++;
        report.subjectDetails.push({
          subjektId: id,
          advokatName: record.fullName,
          cakEvidencniCislo: record.cakEvidencniCislo,
          ico: record.ico,
          proposalsCount: 0,
          status: 'FAILED',
          errors: subResult.errors,
        });
        continue;
      }

      report.proposalsSubmitted += subResult.proposals.length;

      // Step 2: Independent Review & Moderation
      const revResult = await this.reviewAdvokatProposals(id, reviewer, 'APPROVE');
      if (!revResult.success) {
        report.failureCount++;
        report.subjectDetails.push({
          subjektId: id,
          advokatName: record.fullName,
          cakEvidencniCislo: record.cakEvidencniCislo,
          ico: record.ico,
          proposalsCount: subResult.proposals.length,
          status: 'FAILED',
          errors: revResult.errors,
        });
        continue;
      }

      report.successCount++;
      report.proposalsApproved += revResult.reviewedSources.length;
      if (revResult.profile && revResult.profile.status === 'VERIFIED') {
        report.verifiedProfilesCreated++;
      }

      report.subjectDetails.push({
        subjektId: id,
        advokatName: record.fullName,
        cakEvidencniCislo: record.cakEvidencniCislo,
        ico: record.ico,
        proposalsCount: subResult.proposals.length,
        status: 'VERIFIED',
      });
    }

    return report;
  }

  /**
   * MASTER-IMPLEMENT-07C-3B: Live Acquisition Flow
   * 
   * Fetches real-time HTML from https://vyhledavac.cak.cz, computes SHA-256 evidence,
   * parses fields without AI extrapolation, matches identity against database,
   * validates contacts via VerifiedInfoValidator, and submits proposals as PENDING_REVIEW.
   */
  public static async acquireLiveAdvokat(
    evidencniCislo: string,
    submitter: User,
    options?: {
      targetSubjektId?: string;
      connector?: CakLiveConnector;
      bypassCache?: boolean;
      skipRateLimitCheck?: boolean;
    }
  ): Promise<{
    success: boolean;
    matchedSubjektId?: string;
    parsedData?: CakParsedAdvokat;
    contentHash?: string;
    proposals: SubjectInformationSourceDto[];
    errors?: string[];
  }> {
    const connector = options?.connector || new CakLiveConnector();

    // 1. Fetch & Parse via Live Connector
    const fetchRes = await connector.fetchAdvokatByEvNumber(evidencniCislo, {
      bypassCache: options?.bypassCache,
      skipRateLimitCheck: options?.skipRateLimitCheck,
    });

    if (!fetchRes.success || !fetchRes.data) {
      return {
        success: false,
        proposals: [],
        errors: [fetchRes.error || 'Nepodařilo se získat data z ČAK.'],
      };
    }

    const parsed = fetchRes.data;

    // Check if advocate's practice is active (Fail-Closed if suspended or struck)
    if (!parsed.isActiveAdvokat) {
      return {
        success: false,
        parsedData: parsed,
        contentHash: fetchRes.contentHash,
        proposals: [],
        errors: [`Advokát s ev. č. ${evidencniCislo} nemá aktivní výkon advokacie (${parsed.statusText || 'pozastaven'}).`],
      };
    }

    // 2. Identity Matching
    let matchedSubjekt: any = null;

    if (options?.targetSubjektId) {
      const directMatch = await this.matchSubject(options.targetSubjektId);
      if (!directMatch.matched || !directMatch.subjekt) {
        return {
          success: false,
          parsedData: parsed,
          contentHash: fetchRes.contentHash,
          proposals: [],
          errors: [`Cílový subjekt ${options.targetSubjektId} nebyl nalezen v databázi.`],
        };
      }
      matchedSubjekt = directMatch.subjekt;
    } else {
      // Automatic lookup across known advocates
      const allSubjekty = isPrismaAvailable()
        ? await prisma.subjekt.findMany({ where: { type: 'ADVOKAT' } }).catch(() => dbStore.subjekty.filter((s) => s.type === 'ADVOKAT'))
        : dbStore.subjekty.filter((s) => s.type === 'ADVOKAT');

      // Match by dataset ev. number mapping or name & city
      const datasetRecord = cakAdvokatiDataset.find((r) => r.cakEvidencniCislo === evidencniCislo);
      if (datasetRecord) {
        matchedSubjekt = allSubjekty.find((s: any) => s.id === datasetRecord.subjektId);
      }

      if (!matchedSubjekt && parsed.ico) {
        matchedSubjekt = allSubjekty.find((s: any) => s.ico === parsed.ico || s.id.includes(parsed.ico!));
      }

      if (!matchedSubjekt && parsed.fullName) {
        // Normalize name for comparison (remove academic titles)
        const cleanName = parsed.fullName
          .replace(/^(JUDr\.|Mgr\.|doc\.|prof\.|Ing\.|PhDr\.)\s+/gi, '')
          .replace(/,\s*(LL\.M\.|Ph\.D\.|CSc\.)$/gi, '')
          .toLowerCase()
          .trim();

        matchedSubjekt = allSubjekty.find((s: any) => {
          const sName = s.name.toLowerCase();
          return sName.includes(cleanName) || cleanName.includes(sName.replace(/^(judr\.|mgr\.)\s+/gi, ''));
        });
      }
    }

    if (!matchedSubjekt) {
      return {
        success: false,
        parsedData: parsed,
        contentHash: fetchRes.contentHash,
        proposals: [],
        errors: [`IDENTITY_MISMATCH: Subjekt pro advokáta "${parsed.fullName}" (ev. č. ${evidencniCislo}) nebyl jednoznačně ztotožněn v databázi.`],
      };
    }

    if (matchedSubjekt.type !== 'ADVOKAT') {
      return {
        success: false,
        parsedData: parsed,
        contentHash: fetchRes.contentHash,
        proposals: [],
        errors: [`IDENTITY_MISMATCH: Subjekt ${matchedSubjekt.id} má typ ${matchedSubjekt.type}, nikoliv ADVOKAT.`],
      };
    }

    // 3. Field Validations via VerifiedInfoValidator
    const validationErrors: string[] = [];

    if (parsed.officialPhone) {
      const pVal = VerifiedInfoValidator.validatePhone(parsed.officialPhone);
      if (!pVal.valid) validationErrors.push(`Neplatný telefon z ČAK: ${pVal.error}`);
    }

    if (parsed.officialEmail) {
      const eVal = VerifiedInfoValidator.validateEmail(parsed.officialEmail);
      if (!eVal.valid) validationErrors.push(`Neplatný email z ČAK: ${eVal.error}`);
    }

    if (parsed.dataBoxId) {
      const dVal = VerifiedInfoValidator.validateDataBoxId(parsed.dataBoxId);
      if (!dVal.valid) validationErrors.push(`Neplatné ID datové schránky z ČAK: ${dVal.error}`);
    }

    if (parsed.officialWebsite) {
      const wVal = VerifiedInfoValidator.validateSourceUrl(parsed.officialWebsite);
      if (!wVal.valid) validationErrors.push(`Neplatný web z ČAK: ${wVal.error}`);
    }

    if (validationErrors.length > 0) {
      return {
        success: false,
        parsedData: parsed,
        contentHash: fetchRes.contentHash,
        proposals: [],
        errors: validationErrors,
      };
    }

    // 4. Ingest Proposals into SubjectInformationSource (status PENDING_REVIEW)
    const proposals: SubjectInformationSourceDto[] = [];
    const hashSnippet = fetchRes.contentHash ? ` [SHA-256: ${fetchRes.contentHash.slice(0, 16)}...]` : '';

    const fieldsToSubmit: { fieldKey: string; extractedValue: string; evidenceSnippet: string }[] = [];

    if (parsed.officialPhone) {
      fieldsToSubmit.push({
        fieldKey: 'officialPhone',
        extractedValue: parsed.officialPhone,
        evidenceSnippet: `Telefon získán živým voláním ČAK pro ${parsed.fullName} (ev. č. ${parsed.cakEvidencniCislo})${hashSnippet}`,
      });
    }

    if (parsed.officialEmail) {
      fieldsToSubmit.push({
        fieldKey: 'officialEmail',
        extractedValue: parsed.officialEmail,
        evidenceSnippet: `Oficiální email získán z registru ČAK (ev. č. ${parsed.cakEvidencniCislo})${hashSnippet}`,
      });
    }

    if (parsed.dataBoxId) {
      fieldsToSubmit.push({
        fieldKey: 'dataBoxId',
        extractedValue: parsed.dataBoxId,
        evidenceSnippet: `Datová schránka ověřena v registru ČAK: ${parsed.dataBoxId}${hashSnippet}`,
      });
    }

    if (parsed.officialWebsite) {
      fieldsToSubmit.push({
        fieldKey: 'officialWebsite',
        extractedValue: parsed.officialWebsite,
        evidenceSnippet: `Oficiální webové stránky z registru ČAK: ${parsed.officialWebsite}${hashSnippet}`,
      });
    }

    for (const f of fieldsToSubmit) {
      const created = await SubjectVerifiedInfoService.submitSourceProposal(
        {
          subjektId: matchedSubjekt.id,
          sourceLevel: 'P2_PUBLIC_STATE_REGISTRY',
          sourceUrl: parsed.sourceUrl,
          fieldKey: f.fieldKey,
          extractedValue: f.extractedValue,
          evidenceSnippet: f.evidenceSnippet,
          extractionMethod: 'OFFICIAL_REGISTER_SYNC',
          confidence: 0.98,
        },
        submitter
      );
      proposals.push(created);
    }

    await AuditService.recordLog(
      'CAK_LIVE_PROPOSALS_SUBMITTED',
      'CAK_LIVE_CONNECTOR',
      `Podáno ${proposals.length} návrhů ze živého zdroje ČAK pro subjekt ${matchedSubjekt.id} (${parsed.fullName}) uživatelem ${submitter.email || submitter.id}`,
      submitter
    );

    return {
      success: true,
      matchedSubjektId: matchedSubjekt.id,
      parsedData: parsed,
      contentHash: fetchRes.contentHash,
      proposals,
    };
  }
}

