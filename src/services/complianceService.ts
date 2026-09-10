import { prisma, isPrismaAvailable } from '../db/prisma';
import { dbStore } from './dbStore';
import { ComplianceDoc, LegalDocument, LegalDocumentVersion, UserConsent, ConsentRecord, User, LegalDocStatus } from '../types';
import { legalDrafts20Content, legalDrafts20Meta, LEGAL_PACK_2_0_WARNING } from '../data/legalDrafts20';

export function safeIsoString(val: any): string {
  if (!val) return new Date().toISOString();
  if (typeof val.toISOString === 'function') {
    return val.toISOString();
  }
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
  } catch (err) {
    // ignore
  }
  return new Date().toISOString();
}

export class ComplianceService {
  // Map public URL slugs or aliases to official document keys
  static resolveKey(slugOrKey: string): string {
    const map: Record<string, string> = {
      'podminky-uzivani': 'terms',
      'terms': 'terms',
      'gdpr': 'gdpr',
      'privacy': 'gdpr',
      'cookies': 'cookies',
      'moje-pravni-dokumenty': 'legal',
      'legal_docs': 'legal',
      'legal': 'legal',
      'dobrovolnicky-kodex': 'volunteer_code',
      'volunteer_code': 'volunteer_code',
      'dohoda-o-spolupraci': 'dohoda-o-spolupraci',
      'e-dohoda': 'dohoda-o-spolupraci',
      'volunteer-agreement': 'dohoda-o-spolupraci',
      'volunteer_agreement': 'dohoda-o-spolupraci',
      'ai-prohlaseni': 'ai_statement',
      'ai_statement': 'ai_statement',
      'ai_disclaimer': 'ai_statement',
    };
    return map[slugOrKey] || slugOrKey;
  }

  // 1. Get all documents summary for Compliance Center / Public listing
  static async getDocs(): Promise<ComplianceDoc[]> {
    if (isPrismaAvailable()) {
      try {
        const docs = await prisma.legalDocument.findMany({
          include: {
            versions: {
              orderBy: { createdAt: 'desc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        });

        if (docs.length > 0) {
          return docs.map((d) => {
            const publishedVer = d.versions.find((v) => v.status === 'PUBLISHED') || d.versions[0];
            return {
              id: d.id,
              key: d.key,
              title: d.title,
              type: d.type,
              description: d.description || undefined,
              content: publishedVer?.content || '',
              version: publishedVer?.version || '1.0.0',
              effectiveDate: publishedVer ? safeIsoString(publishedVer.effectiveDate) : safeIsoString(d.createdAt),
              updatedAt: safeIsoString(d.updatedAt),
              status: (publishedVer?.status as LegalDocStatus) || 'PUBLISHED',
              author: publishedVer?.author || 'Administrátor',
              versions: d.versions.map((v) => ({
                id: v.id,
                documentId: v.documentId,
                version: v.version,
                content: v.content,
                status: v.status as LegalDocStatus,
                effectiveDate: safeIsoString(v.effectiveDate),
                author: v.author || 'Administrátor',
                createdAt: safeIsoString(v.createdAt),
                updatedAt: safeIsoString(v.updatedAt),
              })),
            };
          });
        }
      } catch (err) {
        console.warn('Prisma getDocs error, falling back:', err);
      }
    }
    return dbStore.complianceDocs;
  }

  // 2. Get document details with full version history by key or alias
  static async getDocByKey(keyOrAlias: string): Promise<LegalDocument | null> {
    const targetKey = this.resolveKey(keyOrAlias);

    if (isPrismaAvailable()) {
      try {
        const doc = await prisma.legalDocument.findUnique({
          where: { key: targetKey },
          include: {
            versions: {
              orderBy: { createdAt: 'desc' },
            },
          },
        });

        if (doc) {
          const publishedVer = doc.versions.find((v) => v.status === 'PUBLISHED') || doc.versions[0];
          const versionsList: LegalDocumentVersion[] = doc.versions.map((v) => ({
            id: v.id,
            documentId: v.documentId,
            version: v.version,
            content: v.content,
            status: v.status as LegalDocStatus,
            effectiveDate: v.effectiveDate.toISOString(),
            author: v.author || 'Administrátor',
            createdAt: v.createdAt.toISOString(),
            updatedAt: v.updatedAt.toISOString(),
          }));

          // Ensure 2.0.0-DRAFT is visible to Admin in versions list even if not yet persisted to Prisma
          if (!versionsList.some((v) => v.version === '2.0.0-DRAFT') && legalDrafts20Content[targetKey]) {
            versionsList.unshift({
              id: `${doc.id}-v2-draft`,
              documentId: doc.id,
              version: '2.0.0-DRAFT',
              content: legalDrafts20Content[targetKey],
              status: 'DRAFT',
              effectiveDate: '2026-09-10T00:00:00.000Z',
              author: 'Jiří Šár (Pracovní návrh Legal Pack 2.0)',
              createdAt: '2026-09-09T00:00:00.000Z',
              updatedAt: '2026-09-10T00:00:00.000Z',
            });
          }

          return {
            id: doc.id,
            key: doc.key,
            title: doc.title,
            type: doc.type,
            description: doc.description || undefined,
            createdAt: doc.createdAt.toISOString(),
            updatedAt: doc.updatedAt.toISOString(),
            versions: versionsList,
            currentVersion: publishedVer
              ? {
                  id: publishedVer.id,
                  documentId: publishedVer.documentId,
                  version: publishedVer.version,
                  content: publishedVer.content,
                  status: publishedVer.status as LegalDocStatus,
                  effectiveDate: publishedVer.effectiveDate.toISOString(),
                  author: publishedVer.author || 'Administrátor',
                  createdAt: publishedVer.createdAt.toISOString(),
                  updatedAt: publishedVer.updatedAt.toISOString(),
                }
              : undefined,
          };
        }
      } catch (err) {
        console.warn('Prisma getDocByKey error, falling back:', err);
      }
    }

    const doc = dbStore.complianceDocs.find((d) => d.key === targetKey || this.resolveKey(d.key) === targetKey);
    if (!doc) return null;

    const fallbackVersions = (doc as any).versions || [
      {
        id: doc.id + '-v1',
        documentId: doc.id,
        version: doc.version,
        content: doc.content,
        status: doc.status || 'PUBLISHED',
        effectiveDate: doc.effectiveDate,
        author: doc.author || 'Administrátor',
        createdAt: doc.effectiveDate,
        updatedAt: doc.updatedAt,
      },
    ];

    if (!fallbackVersions.some((v: any) => v.version === '2.0.0-DRAFT') && legalDrafts20Content[targetKey]) {
      fallbackVersions.unshift({
        id: `${doc.id}-v2-draft`,
        documentId: doc.id,
        version: '2.0.0-DRAFT',
        content: legalDrafts20Content[targetKey],
        status: 'DRAFT',
        effectiveDate: '2026-09-10T00:00:00.000Z',
        author: 'Jiří Šár (Pracovní návrh Legal Pack 2.0)',
        createdAt: '2026-09-09T00:00:00.000Z',
        updatedAt: '2026-09-10T00:00:00.000Z',
      });
    }

    const publishedVer = fallbackVersions.find((v: any) => v.status === 'PUBLISHED') || fallbackVersions[fallbackVersions.length - 1];

    return {
      id: doc.id,
      key: doc.key,
      title: doc.title,
      type: doc.type || 'TERMS',
      description: doc.description,
      createdAt: doc.effectiveDate,
      updatedAt: doc.updatedAt,
      currentVersion: publishedVer
        ? {
            id: publishedVer.id,
            documentId: doc.id,
            version: publishedVer.version,
            content: publishedVer.content,
            status: publishedVer.status || 'PUBLISHED',
            effectiveDate: publishedVer.effectiveDate,
            author: publishedVer.author || 'Administrátor',
            createdAt: publishedVer.createdAt || doc.effectiveDate,
            updatedAt: publishedVer.updatedAt || doc.updatedAt,
          }
        : undefined,
      versions: fallbackVersions,
    };
  }

  // 3. Public version lookup (returns current PUBLISHED version ONLY)
  static async getPublishedDoc(slugOrKey: string): Promise<ComplianceDoc | null> {
    const key = this.resolveKey(slugOrKey);
    const docs = await this.getDocs();
    const doc = docs.find((d) => d.key === key) || null;
    if (!doc || doc.status !== 'PUBLISHED') {
      return null;
    }
    // Fail-Closed: Strip all non-PUBLISHED versions from public API response
    return {
      ...doc,
      versions: doc.versions ? doc.versions.filter((v) => v.status === 'PUBLISHED') : undefined,
    };
  }

  // 4. Create new legal document container
  static async createDoc(
    data: { key: string; title: string; type: string; description?: string; initialVersion?: string; initialContent?: string },
    user?: User | null
  ): Promise<ComplianceDoc> {
    const key = this.resolveKey(data.key);
    const version = data.initialVersion || '1.0.0';
    const content = data.initialContent || `Tento dokument (${data.title}) je v procesu přípravy.`;
    const authorName = user?.name || 'Administrátor';

    if (isPrismaAvailable()) {
      try {
        const doc = await prisma.legalDocument.create({
          data: {
            key,
            title: data.title,
            type: data.type || 'TERMS',
            description: data.description || null,
          },
        });

        const ver = await prisma.legalDocumentVersion.create({
          data: {
            documentId: doc.id,
            version,
            content,
            status: 'PUBLISHED',
            author: authorName,
          },
        });

        await prisma.auditLog.create({
          data: {
            userId: user?.id,
            userEmail: user?.email,
            action: 'COMPLIANCE_DOC_CREATE',
            module: 'COMPLIANCE',
            details: `Vytvořen nový compliance dokument '${doc.title}' [${doc.key}] s verzí ${version}.`,
          },
        });

        return {
          id: doc.id,
          key: doc.key,
          title: doc.title,
          type: doc.type,
          description: doc.description || undefined,
          content: ver.content,
          version: ver.version,
          status: ver.status as LegalDocStatus,
          effectiveDate: ver.effectiveDate.toISOString(),
          updatedAt: doc.updatedAt.toISOString(),
          author: authorName,
        };
      } catch (err) {
        console.warn('Prisma createDoc error, falling back:', err);
      }
    }

    const doc: ComplianceDoc = {
      id: 'cmp-' + Date.now(),
      key,
      title: data.title,
      type: data.type || 'TERMS',
      description: data.description,
      content,
      version,
      status: 'PUBLISHED',
      effectiveDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: authorName,
    };

    dbStore.complianceDocs.push(doc);
    dbStore.logAudit('COMPLIANCE_DOC_CREATE', 'COMPLIANCE', `Vytvořen nový compliance dokument '${data.title}' [${key}] s verzí ${version}.`, user);
    return doc;
  }

  // 5. Update document container metadata
  static async updateDocMetadata(
    key: string,
    data: { title?: string; type?: string; description?: string },
    user?: User | null
  ): Promise<ComplianceDoc> {
    const targetKey = this.resolveKey(key);

    if (isPrismaAvailable()) {
      try {
        const updated = await prisma.legalDocument.update({
          where: { key: targetKey },
          data: {
            ...(data.title && { title: data.title }),
            ...(data.type && { type: data.type }),
            ...(data.description !== undefined && { description: data.description }),
          },
          include: {
            versions: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        });

        await prisma.auditLog.create({
          data: {
            userId: user?.id,
            userEmail: user?.email,
            action: 'COMPLIANCE_DOC_UPDATE',
            module: 'COMPLIANCE',
            details: `Aktualizována metadata dokumentu '${updated.title}' [${targetKey}].`,
          },
        });

        const latestVer = updated.versions[0];
        return {
          id: updated.id,
          key: updated.key,
          title: updated.title,
          type: updated.type,
          description: updated.description || undefined,
          content: latestVer?.content || '',
          version: latestVer?.version || '1.0.0',
          effectiveDate: latestVer?.effectiveDate.toISOString() || updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        };
      } catch (err) {
        console.warn('Prisma updateDocMetadata error, falling back:', err);
      }
    }

    const doc = dbStore.complianceDocs.find((d) => d.key === targetKey);
    if (!doc) throw new Error(`Dokument '${targetKey}' nenalezen.`);

    if (data.title) doc.title = data.title;
    if (data.type) doc.type = data.type;
    if (data.description !== undefined) doc.description = data.description;
    doc.updatedAt = new Date().toISOString();

    dbStore.logAudit('COMPLIANCE_DOC_UPDATE', 'COMPLIANCE', `Aktualizována metadata dokumentu '${doc.title}' [${targetKey}].`, user);
    return doc;
  }

  // 6. Create a NEW VERSION for a document. Historical versions are NEVER overwritten!
  static async createVersion(
    docKey: string,
    data: { version: string; content: string; status?: LegalDocStatus; effectiveDate?: string; author?: string },
    user?: User | null
  ): Promise<LegalDocumentVersion> {
    const targetKey = this.resolveKey(docKey);
    const newStatus = data.status || 'PUBLISHED';
    const authorName = data.author || user?.name || 'Administrátor';
    const effDate = data.effectiveDate ? new Date(data.effectiveDate) : new Date();

    if (isPrismaAvailable()) {
      try {
        const doc = await prisma.legalDocument.findUnique({ where: { key: targetKey } });
        if (!doc) throw new Error(`Dokument '${targetKey}' nenalezen.`);

        // Check if this exact version number already exists
        const existingVer = await prisma.legalDocumentVersion.findUnique({
          where: { documentId_version: { documentId: doc.id, version: data.version } },
        });

        if (existingVer) {
          throw new Error(`Verze ${data.version} pro dokument '${targetKey}' již existuje. Historické verze nesmí být přepsány! Zvolte nové číslo verze (SemVer).`);
        }

        // If new version is PUBLISHED, archive all previous published versions
        if (newStatus === 'PUBLISHED') {
          await prisma.legalDocumentVersion.updateMany({
            where: { documentId: doc.id, status: 'PUBLISHED' },
            data: { status: 'ARCHIVED' },
          });
        }

        const newVer = await prisma.legalDocumentVersion.create({
          data: {
            documentId: doc.id,
            version: data.version,
            content: data.content,
            status: newStatus,
            effectiveDate: effDate,
            author: authorName,
          },
        });

        await prisma.auditLog.create({
          data: {
            userId: user?.id,
            userEmail: user?.email,
            action: 'COMPLIANCE_VERSION_CREATE',
            module: 'COMPLIANCE',
            details: `Vytvořena nová verze v${data.version} (${newStatus}) pro dokument '${doc.title}'.`,
          },
        });

        return {
          id: newVer.id,
          documentId: newVer.documentId,
          version: newVer.version,
          content: newVer.content,
          status: newVer.status as LegalDocStatus,
          effectiveDate: newVer.effectiveDate.toISOString(),
          author: newVer.author || authorName,
          createdAt: newVer.createdAt.toISOString(),
          updatedAt: newVer.updatedAt.toISOString(),
        };
      } catch (err: any) {
        if (err.message.includes('Historické verze')) throw err;
        console.warn('Prisma createVersion error, falling back:', err);
      }
    }

    // Memory Fallback
    const doc = dbStore.complianceDocs.find((d) => d.key === targetKey);
    if (!doc) throw new Error(`Dokument '${targetKey}' nenalezen.`);

    if (doc.version === data.version) {
      throw new Error(`Verze ${data.version} pro dokument '${targetKey}' již existuje. Zvolte nové číslo verze.`);
    }

    doc.version = data.version;
    doc.content = data.content;
    doc.status = newStatus;
    doc.effectiveDate = effDate.toISOString();
    doc.updatedAt = new Date().toISOString();
    doc.author = authorName;

    dbStore.logAudit('COMPLIANCE_VERSION_CREATE', 'COMPLIANCE', `Vytvořena nová verze v${data.version} (${newStatus}) pro dokument '${doc.title}'.`, user);

    return {
      id: doc.id + '-v' + Date.now(),
      documentId: doc.id,
      version: data.version,
      content: data.content,
      status: newStatus,
      effectiveDate: effDate.toISOString(),
      author: authorName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // 7. Publish a specific version ID
  static async publishVersion(versionId: string, user?: User | null): Promise<LegalDocumentVersion> {
    if (isPrismaAvailable()) {
      try {
        const ver = await prisma.legalDocumentVersion.findUnique({
          where: { id: versionId },
          include: { document: true },
        });

        if (!ver) throw new Error('Verze neexistuje.');

        // Archive all other published versions for this document
        await prisma.legalDocumentVersion.updateMany({
          where: { documentId: ver.documentId, status: 'PUBLISHED' },
          data: { status: 'ARCHIVED' },
        });

        // Set this version to PUBLISHED
        const updated = await prisma.legalDocumentVersion.update({
          where: { id: versionId },
          data: { status: 'PUBLISHED', effectiveDate: new Date() },
        });

        await prisma.auditLog.create({
          data: {
            userId: user?.id,
            userEmail: user?.email,
            action: 'COMPLIANCE_VERSION_PUBLISH',
            module: 'COMPLIANCE',
            details: `Publikována verze v${updated.version} dokumentu '${ver.document.title}'. Starší publikované verze byly archivovány.`,
          },
        });

        return {
          id: updated.id,
          documentId: updated.documentId,
          version: updated.version,
          content: updated.content,
          status: updated.status as LegalDocStatus,
          effectiveDate: updated.effectiveDate.toISOString(),
          author: updated.author || 'Administrátor',
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        };
      } catch (err: any) {
        console.warn('Prisma publishVersion error:', err);
        throw err;
      }
    }

    throw new Error('Fallback nepodporuje přímou publikaci verze podle ID.');
  }

  // 8. Deactivate / Archive a specific version ID
  static async deactivateVersion(versionId: string, user?: User | null): Promise<LegalDocumentVersion> {
    if (isPrismaAvailable()) {
      try {
        const ver = await prisma.legalDocumentVersion.findUnique({
          where: { id: versionId },
          include: { document: true },
        });

        if (!ver) throw new Error('Verze neexistuje.');

        const updated = await prisma.legalDocumentVersion.update({
          where: { id: versionId },
          data: { status: 'ARCHIVED' },
        });

        await prisma.auditLog.create({
          data: {
            userId: user?.id,
            userEmail: user?.email,
            action: 'COMPLIANCE_VERSION_DEACTIVATE',
            module: 'COMPLIANCE',
            details: `Deaktivována / archivována verze v${updated.version} dokumentu '${ver.document.title}'.`,
          },
        });

        return {
          id: updated.id,
          documentId: updated.documentId,
          version: updated.version,
          content: updated.content,
          status: updated.status as LegalDocStatus,
          effectiveDate: updated.effectiveDate.toISOString(),
          author: updated.author || 'Administrátor',
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        };
      } catch (err: any) {
        console.warn('Prisma deactivateVersion error:', err);
        throw err;
      }
    }

    throw new Error('Fallback nepodporuje přímou deaktivaci verze podle ID.');
  }

  // 9. Record User Consent
  static async recordConsent(
    userId: string,
    docKey: string,
    docVersion: string,
    status: 'ACCEPTED' | 'REVOKED' = 'ACCEPTED',
    userEmail?: string,
    ipAddress: string = '127.0.0.1'
  ): Promise<UserConsent> {
    const key = this.resolveKey(docKey);

    if (!docKey || !docVersion) {
      throw new Error('Chybí identifikátor dokumentu nebo verze.');
    }

    // STRICT FAIL-CLOSED SECURITY: DRAFT versions CANNOT be accepted, signed, or used for consent
    if (docVersion === '2.0.0-DRAFT' || docVersion.toUpperCase().includes('DRAFT')) {
      throw new Error('FAIL CLOSED: Pracovní návrh verze DRAFT (Legal Pack 2.0) nesmí být akceptován, podepsán ani použit pro souhlas.');
    }

    // SERVER-SIDE VALIDATION: Enforce EXACT version existence and PUBLISHED status
    const doc = await this.getDocByKey(key);
    if (!doc) {
      throw new Error(`Dokument '${key}' neexistuje.`);
    }

    const versionData = doc.versions.find(v => v.version === docVersion);
    if (!versionData) {
      throw new Error(`Verze '${docVersion}' pro dokument '${key}' neexistuje.`);
    }

    if (versionData.status !== 'PUBLISHED') {
      // 403 / 409 style error string that will be passed down
      throw new Error(`FAIL CLOSED: Není možné udělit souhlas s nepublikovanou verzí dokumentu (DRAFT/ARCHIVED).`);
    }


    if (isPrismaAvailable()) {
      try {
        const consent = await prisma.consent.upsert({
          where: { userId_docKey_docVersion: { userId, docKey: key, docVersion } },
          update: { status, consentedAt: new Date(), ipAddress },
          create: { userId, docKey: key, docVersion, status, ipAddress },
        });

        await prisma.auditLog.create({
          data: {
            userId,
            userEmail,
            action: status === 'ACCEPTED' ? 'USER_CONSENT_ACCEPT' : 'USER_CONSENT_REVOKE',
            module: 'COMPLIANCE',
            details: `Uživatel ${userEmail || userId} ${status === 'ACCEPTED' ? 'potvrdil souhlas s' : 'odvolal souhlas s'} '${key}' (v${docVersion}).`,
            ipAddress,
          },
        });

        return {
          id: consent.id,
          userId: consent.userId,
          userEmail,
          docKey: consent.docKey,
          docVersion: consent.docVersion,
          versionId: consent.versionId || undefined,
          status: consent.status as 'ACCEPTED' | 'REVOKED',
          ipAddress: consent.ipAddress || ipAddress,
          consentedAt: safeIsoString(consent.consentedAt),
        };
      } catch (err) {
        console.warn('Prisma recordConsent error, falling back:', err);
      }
    }

    let existing = dbStore.userConsents.find((c) => c.userId === userId && c.docKey === key && c.docVersion === docVersion);
    if (existing) {
      existing.status = status;
      existing.consentedAt = new Date().toISOString();
      return existing;
    }

    const consent: UserConsent = {
      id: 'cns-' + Date.now(),
      userId,
      userEmail,
      docKey: key,
      docVersion,
      status,
      ipAddress,
      consentedAt: new Date().toISOString(),
    };

    dbStore.userConsents.push(consent);
    dbStore.logAudit('USER_CONSENT', 'COMPLIANCE', `Uživatel ${userEmail || userId} ${status === 'ACCEPTED' ? 'potvrdil souhlas s' : 'odvolal souhlas s'} '${key}' (v${docVersion}).`);
    return consent;
  }

  // 10. Get Consents List for Admin Compliance Registry
  static async getConsents(userId?: string, docKey?: string): Promise<ConsentRecord[]> {
    if (isPrismaAvailable()) {
      try {
        const whereClause: any = {};
        if (userId) whereClause.userId = userId;
        if (docKey) whereClause.docKey = this.resolveKey(docKey);

        const consents = await prisma.consent.findMany({
          where: whereClause,
          include: {
            user: {
              select: { email: true, name: true },
            },
          },
          orderBy: { consentedAt: 'desc' },
        });

        return consents.map((c) => ({
          id: c.id,
          userId: c.userId,
          userEmail: c.user?.email || undefined,
          userName: c.user?.name || undefined,
          docKey: c.docKey,
          docVersion: c.docVersion,
          versionId: c.versionId || undefined,
          status: (c.status as 'ACCEPTED' | 'REVOKED') || 'ACCEPTED',
          ipAddress: c.ipAddress || '127.0.0.1',
          consentedAt: safeIsoString(c.consentedAt),
        }));
      } catch (err) {
        console.warn('Prisma getConsents error:', err);
      }
    }

    return dbStore.userConsents.map((c) => ({
      id: c.id,
      userId: c.userId,
      userEmail: c.userEmail,
      userName: 'Uživatel',
      docKey: c.docKey,
      docVersion: c.docVersion,
      versionId: c.versionId,
      status: c.status || 'ACCEPTED',
      ipAddress: c.ipAddress || '127.0.0.1',
      consentedAt: c.consentedAt,
    }));
  }

  // 11. Legacy support for updateDoc
  static async updateDoc(key: string, title: string, content: string, version: string, user?: User | null): Promise<ComplianceDoc> {
    const targetKey = this.resolveKey(key);
    return this.createVersion(targetKey, { version, content, status: 'PUBLISHED' }, user).then(() => {
      return this.updateDocMetadata(targetKey, { title }, user);
    });
  }

  // 12. User consents helper
  static async getUserConsents(userId: string): Promise<UserConsent[]> {
    return this.getConsents(userId);
  }

  // 13. Record Cookie Consent
  static async recordCookieConsent(
    userId: string | null,
    sessionHash: string | null,
    preferences: { essential?: boolean; functional?: boolean; analytics?: boolean; marketing?: boolean },
    ipAddress: string = '127.0.0.1'
  ): Promise<any> {
    const data = {
      userId,
      sessionHash,
      essential: preferences.essential !== false, // default true
      functional: preferences.functional || false,
      analytics: preferences.analytics || false,
      marketing: preferences.marketing || false,
      version: '1.0',
      ipAddress,
    };

    if (isPrismaAvailable()) {
      try {
        const consent = await (prisma as any).cookieConsent.create({
          data,
        });
        return consent;
      } catch (err) {
        console.warn('Prisma recordCookieConsent error, falling back:', err);
      }
    }

    const consent = {
      id: 'cc-' + Date.now(),
      ...data,
      consentAt: new Date(),
    };
    (dbStore as any).cookieConsents = (dbStore as any).cookieConsents || [];
    (dbStore as any).cookieConsents.push(consent);
    return consent;
  }

  // 14. Get Cookie Consent
  static async getCookieConsent(userIdOrSession: string): Promise<any> {
    if (isPrismaAvailable()) {
      try {
        const consent = await (prisma as any).cookieConsent.findFirst({
          where: {
            OR: [
              { userId: userIdOrSession },
              { sessionHash: userIdOrSession },
            ]
          },
          orderBy: { consentAt: 'desc' },
        });
        if (consent) return consent;
      } catch (err) {
        console.warn('Prisma getCookieConsent error, falling back:', err);
      }
    }
    const list = (dbStore as any).cookieConsents || [];
    return list.find((c: any) => c.userId === userIdOrSession || c.sessionHash === userIdOrSession) || null;
  }

  // 15. Create Legal Audit Log
  static async logLegalAudit(
    userId: string | null,
    action: string,
    entity: string,
    entityId?: string,
    metadata?: any
  ): Promise<any> {
    const metadataJson = metadata ? JSON.stringify(metadata) : null;
    const data = {
      userId,
      action,
      entity,
      entityId,
      metadataJson,
    };

    if (isPrismaAvailable()) {
      try {
        const log = await (prisma as any).legalAuditLog.create({
          data,
        });
        return log;
      } catch (err) {
        console.warn('Prisma logLegalAudit error, falling back:', err);
      }
    }

    const log = {
      id: 'al-' + Date.now(),
      ...data,
      createdAt: new Date(),
    };
    (dbStore as any).legalAuditLogs = (dbStore as any).legalAuditLogs || [];
    (dbStore as any).legalAuditLogs.push(log);
    return log;
  }

  // 16. Get Legal Audit Logs
  static async getLegalAuditLogs(): Promise<any[]> {
    if (isPrismaAvailable()) {
      try {
        const logs = await (prisma as any).legalAuditLog.findMany({
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { email: true, name: true },
            }
          }
        });
        return logs.map((l: any) => ({
          id: l.id,
          userId: l.userId,
          userEmail: l.user?.email || 'Neznámý e-mail',
          userName: l.user?.name || 'Neznámý uživatel',
          action: l.action,
          entity: l.entity,
          entityId: l.entityId,
          metadataJson: l.metadataJson,
          createdAt: l.createdAt.toISOString ? l.createdAt.toISOString() : l.createdAt,
        }));
      } catch (err) {
        console.warn('Prisma getLegalAuditLogs error, falling back:', err);
      }
    }
    const list = (dbStore as any).legalAuditLogs || [];
    return list.map((l: any) => ({
      ...l,
      userEmail: 'In-Memory',
      userName: 'In-Memory Uživatel',
      createdAt: l.createdAt.toISOString ? l.createdAt.toISOString() : l.createdAt,
    }));
  }

  // 17. Synchronize and ensure Legal Pack 2.0 Draft versions in DB and In-Memory
  static async ensureLegalPack20Drafts(): Promise<{ synced: string[]; count: number }> {
    const keys = [
      'terms',
      'gdpr',
      'cookies',
      'legal',
      'volunteer_code',
      'ai_statement',
      'dohoda-o-spolupraci'
    ];

    const synced: string[] = [];

    // 1. In-Memory dbStore sync
    for (const key of keys) {
      const draftContent = legalDrafts20Content[key];
      const meta = legalDrafts20Meta[key];
      if (!draftContent || !meta) continue;

      const storeDoc = dbStore.complianceDocs.find((d) => d.key === key || this.resolveKey(d.key) === key);
      if (storeDoc) {
        if (!storeDoc.versions) {
          storeDoc.versions = [];
        }
        const existingVer = storeDoc.versions.find((v) => v.version === '2.0.0-DRAFT');
        if (!existingVer) {
          storeDoc.versions.push({
            id: `${storeDoc.id}-v2-draft`,
            documentId: storeDoc.id,
            version: '2.0.0-DRAFT',
            content: draftContent,
            status: 'DRAFT',
            effectiveDate: '2026-09-10T00:00:00.000Z',
            author: 'Jiří Šár (Pracovní návrh Legal Pack 2.0)',
            createdAt: '2026-09-09T00:00:00.000Z',
            updatedAt: '2026-09-10T00:00:00.000Z',
          });
        } else {
          existingVer.content = draftContent;
          existingVer.status = 'DRAFT';
        }
      }
    }

    // 2. Prisma Database sync (if available)
    if (isPrismaAvailable()) {
      try {
        for (const key of keys) {
          const draftContent = legalDrafts20Content[key];
          const meta = legalDrafts20Meta[key];
          if (!draftContent || !meta) continue;

          let doc = await prisma.legalDocument.findUnique({
            where: { key },
            include: { versions: true }
          });

          if (!doc) {
            // Create container with initial v1.0.0 published version first
            doc = await prisma.legalDocument.create({
              data: {
                key,
                title: meta.title.replace(' (Draft 2.0)', ''),
                type: meta.type || 'TERMS',
                description: meta.description,
                versions: {
                  create: {
                    version: '1.0.0',
                    content: `Počáteční verze dokumentu ${meta.title}.`,
                    status: 'PUBLISHED',
                    author: 'Jiří Šár (Správce)',
                    effectiveDate: new Date('2026-01-01'),
                  }
                }
              },
              include: { versions: true }
            });
          }

          const existingDraft = doc.versions.find((v) => v.version === '2.0.0-DRAFT');
          if (existingDraft) {
            // Update DRAFT content while keeping status strictly DRAFT
            await prisma.legalDocumentVersion.update({
              where: { id: existingDraft.id },
              data: {
                content: draftContent,
                status: 'DRAFT',
                author: 'Jiří Šár (Pracovní návrh Legal Pack 2.0)',
                effectiveDate: new Date('2026-09-10'),
              }
            });
          } else {
            // Create 2.0.0-DRAFT version. Notice: PUBLISHED version remains PUBLISHED!
            await prisma.legalDocumentVersion.create({
              data: {
                documentId: doc.id,
                version: '2.0.0-DRAFT',
                content: draftContent,
                status: 'DRAFT',
                author: 'Jiří Šár (Pracovní návrh Legal Pack 2.0)',
                effectiveDate: new Date('2026-09-10'),
              }
            });
          }
          synced.push(key);
        }
      } catch (err) {
        console.warn('Prisma ensureLegalPack20Drafts warning:', err);
      }
    } else {
      synced.push(...keys);
    }

    return { synced, count: synced.length };
  }

  // 18. Admin Preview for a single Legal Pack 2.0 Draft
  static async getDraftPreview(keyOrAlias: string): Promise<any | null> {
    const key = this.resolveKey(keyOrAlias);
    const meta = legalDrafts20Meta[key];
    const content = legalDrafts20Content[key];
    if (!meta || !content) {
      return null;
    }
    return {
      key,
      canonicalId: meta.canonicalId,
      title: meta.title,
      type: meta.type,
      description: meta.description,
      version: '2.0.0-DRAFT',
      status: 'DRAFT',
      effectiveDate: meta.effectiveDate,
      draftDate: meta.draftDate,
      author: meta.author,
      warningNotice: LEGAL_PACK_2_0_WARNING,
      isDraft: true,
      canAccept: false,
      content,
    };
  }

  // 19. Admin Preview for all Legal Pack 2.0 Drafts list
  static async getAllDraftsPreview(): Promise<any[]> {
    const keys = [
      'terms',
      'gdpr',
      'cookies',
      'legal',
      'volunteer_code',
      'ai_statement',
      'dohoda-o-spolupraci'
    ];
    const drafts: any[] = [];
    for (const key of keys) {
      const item = await this.getDraftPreview(key);
      if (item) drafts.push(item);
    }
    return drafts;
  }
}
