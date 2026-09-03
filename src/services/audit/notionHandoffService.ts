import crypto from 'crypto';
import {
  InternalHandoffNote,
  HandoffPushResult,
  HandoffFetchResult,
  HandoffValidationResult,
  HandoffSecretScanResult,
  HandoffSource,
  HandoffTarget,
  HandoffStatus,
  HandoffEnvironment,
  HandoffVerificationState,
  HandoffDatabaseSourceState,
} from '../../types/handoffTypes';
import { sanitizeText, sanitizeInputData } from '../qa/ai/sanitizer';

/**
 * Strict patterns for unredacted secrets, credentials, and sensitive PII.
 */
const UNREDACTED_SECRET_PATTERNS: Array<{ type: string; regex: RegExp }> = [
  {
    type: 'JWT_TOKEN',
    regex: /\beyJ[A-Za-z0-9-_=]{10,}\.[A-Za-z0-9-_=]{10,}\.[A-Za-z0-9-_.+/=]{10,}\b/g,
  },
  {
    type: 'GITHUB_TOKEN',
    regex: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{30,}\b/g,
  },
  {
    type: 'GOOGLE_API_KEY',
    regex: /\bAIza[0-9A-Za-z-_]{20,}\b/g,
  },
  {
    type: 'GENERIC_API_KEY',
    regex: /\b(?:sk|pk)(?:_(?:live|test)_|-(?:proj-)?[a-zA-Z0-9_-]{10,})[0-9a-zA-Z]{10,}\b/g,
  },
  {
    type: 'XAI_API_KEY',
    regex: /\bxai-[a-zA-Z0-9]{20,}\b/g,
  },
  {
    type: 'BEARER_TOKEN',
    regex: /\bBearer\s+[A-Za-z0-9._~+/-]{20,}\b/gi,
  },
  {
    type: 'DB_CONNECTION_STRING_WITH_PASSWORD',
    regex: /(?:postgres|postgresql|mysql|mongodb(?:\+srv)?):\/\/[^:\s]+:[^@\s]+@[^\s]+/gi,
  },
  {
    type: 'PRIVATE_KEY',
    regex: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/g,
  },
  {
    type: 'PASSWORD_FIELD_WITH_VALUE',
    regex: /"(?:password|passwordHash|totpSecret|mfaSecret|jwtSecret)":\s*"(?!\[REDACTED_)[^"]{4,}"/gi,
  },
  {
    type: 'ENV_SECRET_ASSIGNMENT',
    regex: /\b(?:POSTGRES_PASSWORD|ADMIN_INITIAL_PASSWORD|JWT_SECRET|GITHUB_TOKEN|MAILCOW_API_KEY|ESBIRKA_API_KEY)=(?!\[REDACTED_)[^\s]{4,}/gi,
  },
  {
    type: 'CZECH_RODNE_CISLO',
    regex: /\b\d{2}[0156]\d[0-3]\d\/?\d{3,4}\b/g,
  },
];

export class NotionHandoffService {
  private static syncedHashes: Set<string> = new Set();

  /**
   * Re-uses existing Notion credentials from environment.
   */
  public static get apiKey(): string | undefined {
    return process.env.NOTION_API_KEY || process.env.NOTION_TOKEN;
  }

  public static get databaseId(): string | undefined {
    return process.env.NOTION_HANDOFF_DATABASE_ID || process.env.NOTION_DATABASE_ID;
  }

  /**
   * Deterministic SHA-256 content hash calculation for handoff note.
   */
  public static computeContentHash(note: Omit<InternalHandoffNote, 'contentHash'>): string {
    const canonical = [
      note.handoffId,
      note.source,
      note.target,
      note.project,
      note.topic,
      note.status,
      note.environment,
      note.verificationState,
      note.databaseSourceState,
      note.gitContext.repository,
      note.gitContext.branch,
      note.gitContext.commitSha,
      note.verifiedFacts.join('|'),
      note.implementedChanges.join('|'),
      note.decisionsMade.join('|'),
      note.assumptionsAndProposals.join('|'),
      note.risksAndBlockers.map(r => `[${r.severity}]${r.description}:${r.remediation}`).join('|'),
      note.dependencies.join('|'),
      note.nextConcreteAction,
    ].join('::');

    return crypto.createHash('sha256').update(canonical).digest('hex');
  }

  /**
   * Scans text or objects for unredacted secrets and sensitive credentials.
   * Fail-closed: returns true if any unredacted credential pattern is found.
   */
  public static scanForSecrets(input: any): HandoffSecretScanResult {
    const textToScan = typeof input === 'string' ? input : JSON.stringify(input);
    const detectedTypes: string[] = [];
    const details: string[] = [];

    for (const { type, regex } of UNREDACTED_SECRET_PATTERNS) {
      regex.lastIndex = 0;
      const matches = textToScan.match(regex);
      if (matches && matches.length > 0) {
        // Filter out safe placeholder or redacted tokens
        const genuineSecrets = matches.filter(
          m => !m.includes('[REDACTED_') && !m.includes('***REDACTED***') && !m.includes('REDACTED')
        );

        if (genuineSecrets.length > 0) {
          detectedTypes.push(type);
          details.push(`Detekován potenciální secret typu ${type} (${genuineSecrets.length} výskytů)`);
        }
      }
    }

    return {
      hasSecrets: detectedTypes.length > 0,
      detectedTypes,
      details,
    };
  }

  /**
   * Validates that all required fields are present and valid in InternalHandoffNote.
   */
  public static validateHandoffNote(note: Partial<InternalHandoffNote>): HandoffValidationResult {
    const errors: string[] = [];

    if (!note.handoffId || note.handoffId.trim().length === 0) {
      errors.push('Pole handoffId je povinné.');
    }
    if (!note.timestamp || isNaN(Date.parse(note.timestamp))) {
      errors.push('Pole timestamp musí být validní ISO datum.');
    }
    if (!note.source || !['AI_STUDIO', 'CHATGPT'].includes(note.source)) {
      errors.push('Pole source musí mít hodnotu AI_STUDIO nebo CHATGPT.');
    }
    if (!note.target || !['AI_STUDIO', 'CHATGPT', 'ALL'].includes(note.target)) {
      errors.push('Pole target musí mít hodnotu AI_STUDIO, CHATGPT nebo ALL.');
    }
    if (!note.project || note.project.trim().length === 0) {
      errors.push('Pole project je povinné.');
    }
    if (!note.topic || note.topic.trim().length === 0) {
      errors.push('Pole topic je povinné.');
    }
    if (!note.status || !['IN_PROGRESS', 'HANDOFF_READY', 'ACKNOWLEDGED', 'COMPLETED', 'BLOCKED'].includes(note.status)) {
      errors.push('Pole status má neplatnou hodnotu.');
    }
    if (!note.environment || !['AI_STUDIO_SANDBOX', 'DEV3_VPS', 'LOCAL', 'PRODUCTION'].includes(note.environment)) {
      errors.push('Pole environment má neplatnou hodnotu.');
    }
    if (!note.verificationState || !['VERIFIED', 'UNVERIFIED', 'SIMULATED_FAILSAFE'].includes(note.verificationState)) {
      errors.push('Pole verificationState má neplatnou hodnotu.');
    }
    if (!note.databaseSourceState || !['UNVERIFIED', 'VERIFIED_POSTGRES', 'IN_MEMORY_FALLBACK'].includes(note.databaseSourceState)) {
      errors.push('Pole databaseSourceState má neplatnou hodnotu.');
    }
    if (!note.gitContext || !note.gitContext.repository || !note.gitContext.branch || !note.gitContext.commitSha) {
      errors.push('Pole gitContext musí obsahovat repository, branch a commitSha.');
    }
    if (!Array.isArray(note.verifiedFacts)) {
      errors.push('Pole verifiedFacts musí být pole řetězců.');
    }
    if (!Array.isArray(note.implementedChanges)) {
      errors.push('Pole implementedChanges musí být pole řetězců.');
    }
    if (!Array.isArray(note.decisionsMade)) {
      errors.push('Pole decisionsMade musí být pole řetězců.');
    }
    if (!Array.isArray(note.assumptionsAndProposals)) {
      errors.push('Pole assumptionsAndProposals musí být pole řetězců.');
    }
    if (!Array.isArray(note.risksAndBlockers)) {
      errors.push('Pole risksAndBlockers musí být pole.');
    } else {
      for (const [idx, risk] of note.risksAndBlockers.entries()) {
        if (!risk.severity || !['P0', 'P1', 'P2', 'P3'].includes(risk.severity)) {
          errors.push(`Riziko #${idx} má neplatnou severity (očekáváno P0-P3).`);
        }
        if (!risk.description || risk.description.trim().length === 0) {
          errors.push(`Riziko #${idx} postrádá popis.`);
        }
        if (!risk.remediation || risk.remediation.trim().length === 0) {
          errors.push(`Riziko #${idx} postrádá doporučenou nápravu.`);
        }
      }
    }
    if (!note.nextConcreteAction || note.nextConcreteAction.trim().length === 0) {
      errors.push('Pole nextConcreteAction je povinné a musí obsahovat 1 konkrétní krok.');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Sanitizes all fields in an InternalHandoffNote using canonical AI sanitizer.
   */
  public static sanitizeHandoffNote(note: InternalHandoffNote): InternalHandoffNote {
    const sanitizedTopic = sanitizeText(note.topic);
    const sanitizedFacts = note.verifiedFacts.map(f => sanitizeText(f));
    const sanitizedChanges = note.implementedChanges.map(c => sanitizeText(c));
    const sanitizedDecisions = note.decisionsMade.map(d => sanitizeText(d));
    const sanitizedAssumptions = note.assumptionsAndProposals.map(a => sanitizeText(a));
    const sanitizedDependencies = note.dependencies.map(dep => sanitizeText(dep));
    const sanitizedNextAction = sanitizeText(note.nextConcreteAction);

    const sanitizedRisks = note.risksAndBlockers.map(r => ({
      severity: r.severity,
      code: r.code ? sanitizeText(r.code) : undefined,
      description: sanitizeText(r.description),
      remediation: sanitizeText(r.remediation),
    }));

    const sanitizedGitContext = {
      repository: sanitizeText(note.gitContext.repository),
      branch: sanitizeText(note.gitContext.branch),
      commitSha: sanitizeText(note.gitContext.commitSha),
      verifiedOnRemote: note.gitContext.verifiedOnRemote,
    };

    const sanitizedBase = {
      handoffId: sanitizeText(note.handoffId),
      timestamp: note.timestamp,
      source: note.source,
      target: note.target,
      project: note.project,
      topic: sanitizedTopic,
      status: note.status,
      environment: note.environment,
      verificationState: note.verificationState,
      databaseSourceState: note.databaseSourceState,
      gitContext: sanitizedGitContext,
      verifiedFacts: sanitizedFacts,
      implementedChanges: sanitizedChanges,
      decisionsMade: sanitizedDecisions,
      assumptionsAndProposals: sanitizedAssumptions,
      risksAndBlockers: sanitizedRisks,
      dependencies: sanitizedDependencies,
      nextConcreteAction: sanitizedNextAction,
    };

    const newHash = this.computeContentHash(sanitizedBase);

    return {
      ...sanitizedBase,
      contentHash: newHash,
    };
  }

  /**
   * Creates a fully structured and validated InternalHandoffNote.
   */
  public static createHandoffNote(params: Omit<InternalHandoffNote, 'contentHash'>): InternalHandoffNote {
    const contentHash = this.computeContentHash(params);
    const rawNote: InternalHandoffNote = {
      ...params,
      contentHash,
    };

    const validation = this.validateHandoffNote(rawNote);
    if (!validation.valid) {
      throw new Error(`Neplatná Handoff poznámka: ${validation.errors.join(', ')}`);
    }

    return this.sanitizeHandoffNote(rawNote);
  }

  /**
   * Pushes a validated, sanitized handoff note to Notion.
   * Fail-closed: blocks sending if raw unredacted secrets are detected.
   * Graceful: returns HANDOFF_NOT_SENT_LOCAL_ONLY if Notion is not configured (no local disk clutter, no vcs changes).
   */
  public static async pushHandoff(rawNote: InternalHandoffNote): Promise<HandoffPushResult> {
    const timestamp = new Date().toISOString();

    // 1. Fail-closed secret scan on raw input
    const secretScan = this.scanForSecrets(rawNote);
    if (secretScan.hasSecrets) {
      console.error('[NotionHandoffService] BLOCKED: Detected unredacted secrets in handoff payload:', secretScan.details);
      return {
        success: false,
        status: 'FAILED_BLOCKED',
        handoffId: rawNote.handoffId,
        contentHash: rawNote.contentHash,
        message: `Zápis zablokován bezpečnostním filtrem: ${secretScan.details.join('; ')}`,
        timestamp,
      };
    }

    // 2. Validate structural integrity
    const validation = this.validateHandoffNote(rawNote);
    if (!validation.valid) {
      return {
        success: false,
        status: 'FAILED_BLOCKED',
        handoffId: rawNote.handoffId,
        contentHash: rawNote.contentHash,
        message: `Validační selhání: ${validation.errors.join('; ')}`,
        timestamp,
      };
    }

    // 3. Strict 0-PII sanitization
    const sanitizedNote = this.sanitizeHandoffNote(rawNote);

    // 4. Check Notion credentials & database
    const hasKey = Boolean(this.apiKey);
    const hasDb = Boolean(this.databaseId);

    if (!hasKey || !hasDb) {
      return {
        success: true,
        status: 'HANDOFF_NOT_SENT_LOCAL_ONLY',
        handoffId: sanitizedNote.handoffId,
        contentHash: sanitizedNote.contentHash,
        message: 'Notion API klíč nebo ID databáze není nastaveno v tomto prostředí. Handoff byl úspěšně vygenerován, validován a sanitizován v lokálním izolovaném režimu (žádný zápis do souboru ani gitu).',
        timestamp,
        sanitizedNote,
      };
    }

    // 5. Idempotency check
    if (this.syncedHashes.has(sanitizedNote.contentHash)) {
      return {
        success: true,
        status: 'SKIPPED_IDEMPOTENT',
        handoffId: sanitizedNote.handoffId,
        contentHash: sanitizedNote.contentHash,
        message: `Handoff s identickým obsahem (hash: ${sanitizedNote.contentHash.slice(0, 8)}) již byl do Notion zapsán.`,
        timestamp,
        sanitizedNote,
      };
    }

    // 6. Build Notion API Payload
    try {
      const payload = {
        parent: { database_id: this.databaseId },
        properties: {
          'Handoff ID': {
            title: [{ text: { content: sanitizedNote.handoffId } }],
          },
          'Topic': {
            rich_text: [{ text: { content: sanitizedNote.topic } }],
          },
          'Source': {
            select: { name: sanitizedNote.source },
          },
          'Target': {
            select: { name: sanitizedNote.target },
          },
          'Status': {
            select: { name: sanitizedNote.status },
          },
          'Environment': {
            select: { name: sanitizedNote.environment },
          },
          'Verification State': {
            select: { name: sanitizedNote.verificationState },
          },
          'Database Source': {
            select: { name: sanitizedNote.databaseSourceState },
          },
          'Commit SHA': {
            rich_text: [{ text: { content: sanitizedNote.gitContext.commitSha.slice(0, 8) } }],
          },
          'Branch': {
            rich_text: [{ text: { content: sanitizedNote.gitContext.branch } }],
          },
          'Content Hash': {
            rich_text: [{ text: { content: sanitizedNote.contentHash } }],
          },
          'Timestamp': {
            date: { start: sanitizedNote.timestamp },
          },
        },
        children: [
          {
            object: 'block',
            type: 'heading_2',
            heading_2: {
              rich_text: [{ text: { content: `🤝 AI HANDOFF: ${sanitizedNote.topic}` } }],
            },
          },
          {
            object: 'block',
            type: 'callout',
            callout: {
              rich_text: [
                {
                  text: {
                    content: `Směr: ${sanitizedNote.source} ➔ ${sanitizedNote.target} | Stav: ${sanitizedNote.status} | DB Source: ${sanitizedNote.databaseSourceState} | Git: ${sanitizedNote.gitContext.branch}@${sanitizedNote.gitContext.commitSha.slice(0, 8)}`,
                  },
                },
              ],
              icon: { emoji: sanitizedNote.status === 'HANDOFF_READY' ? '🚀' : '📋' },
            },
          },
          {
            object: 'block',
            type: 'heading_3',
            heading_3: {
              rich_text: [{ text: { content: '✅ Ověřená fakta (Verified Facts)' } }],
            },
          },
          ...sanitizedNote.verifiedFacts.map(fact => ({
            object: 'block',
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{ text: { content: fact } }],
            },
          })),
          {
            object: 'block',
            type: 'heading_3',
            heading_3: {
              rich_text: [{ text: { content: '🛠️ Provedené změny (Implemented Changes)' } }],
            },
          },
          ...sanitizedNote.implementedChanges.map(change => ({
            object: 'block',
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{ text: { content: change } }],
            },
          })),
          {
            object: 'block',
            type: 'heading_3',
            heading_3: {
              rich_text: [{ text: { content: '⚖️ Architektonická rozhodnutí (Decisions Made)' } }],
            },
          },
          ...sanitizedNote.decisionsMade.map(decision => ({
            object: 'block',
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{ text: { content: decision } }],
            },
          })),
          {
            object: 'block',
            type: 'heading_3',
            heading_3: {
              rich_text: [{ text: { content: '🟡 Předpoklady a návrhy (Assumptions & Proposals)' } }],
            },
          },
          ...sanitizedNote.assumptionsAndProposals.map(assumption => ({
            object: 'block',
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{ text: { content: assumption } }],
            },
          })),
          {
            object: 'block',
            type: 'heading_3',
            heading_3: {
              rich_text: [{ text: { content: '🔴 Rizika a blokátory (Risks & Blockers P0–P3)' } }],
            },
          },
          ...sanitizedNote.risksAndBlockers.map(risk => ({
            object: 'block',
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [
                {
                  text: {
                    content: `[${risk.severity}] ${risk.code ? `${risk.code}: ` : ''}${risk.description} (Náprava: ${risk.remediation})`,
                  },
                },
              ],
            },
          })),
          {
            object: 'block',
            type: 'heading_3',
            heading_3: {
              rich_text: [{ text: { content: '🎯 Následující konkrétní krok (Next Concrete Action)' } }],
            },
          },
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [{ text: { content: sanitizedNote.nextConcreteAction } }],
            },
          },
        ],
      };

      const response = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn('[NotionHandoffService] Notion API error:', errorText);
        return {
          success: false,
          status: 'FAILED_BLOCKED',
          handoffId: sanitizedNote.handoffId,
          contentHash: sanitizedNote.contentHash,
          message: `Notion API vrátil HTTP ${response.status}: ${sanitizeText(errorText.slice(0, 200))}`,
          timestamp,
        };
      }

      const responseData: any = await response.json();
      this.syncedHashes.add(sanitizedNote.contentHash);

      return {
        success: true,
        status: 'SENT_TO_NOTION',
        handoffId: sanitizedNote.handoffId,
        contentHash: sanitizedNote.contentHash,
        pageUrl: responseData?.url,
        message: 'Handoff byl úspěšně zapsán do Notion.',
        timestamp,
        sanitizedNote,
      };
    } catch (err: any) {
      console.error('[NotionHandoffService] Exception sending handoff to Notion:', err?.message);
      return {
        success: false,
        status: 'FAILED_BLOCKED',
        handoffId: sanitizedNote.handoffId,
        contentHash: sanitizedNote.contentHash,
        message: `Chyba při komunikaci s Notion: ${sanitizeText(err?.message || String(err))}`,
        timestamp,
      };
    }
  }

  /**
   * Fetches the latest Handoff Note from Notion database.
   */
  public static async fetchLatestHandoff(options?: { target?: HandoffTarget }): Promise<HandoffFetchResult> {
    const timestamp = new Date().toISOString();
    const hasKey = Boolean(this.apiKey);
    const hasDb = Boolean(this.databaseId);

    if (!hasKey || !hasDb) {
      return {
        success: true,
        status: 'NOT_CONFIGURED',
        note: null,
        message: 'Notion API klíč nebo ID databáze není nastaveno.',
        timestamp,
      };
    }

    try {
      const filter = options?.target && options.target !== 'ALL'
        ? {
            or: [
              {
                property: 'Target',
                select: { equals: options.target },
              },
              {
                property: 'Target',
                select: { equals: 'ALL' },
              },
            ],
          }
        : undefined;

      const bodyPayload: any = {
        sorts: [{ property: 'Timestamp', direction: 'descending' }],
        page_size: 1,
      };

      if (filter) {
        bodyPayload.filter = filter;
      }

      const response = await fetch(`https://api.notion.com/v1/databases/${this.databaseId}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          status: 'FAILED',
          note: null,
          message: `Notion query error: HTTP ${response.status}`,
          timestamp,
        };
      }

      const data: any = await response.json();
      if (!data.results || data.results.length === 0) {
        return {
          success: true,
          status: 'EMPTY',
          note: null,
          message: 'V Notion databázi nebyly nalezeny žádné handoff záznamy.',
          timestamp,
        };
      }

      const page = data.results[0];
      const props = page.properties || {};

      const handoffId = props['Handoff ID']?.title?.[0]?.text?.content || page.id;
      const topic = props['Topic']?.rich_text?.[0]?.text?.content || 'Bez názvu';
      const source = (props['Source']?.select?.name as HandoffSource) || 'CHATGPT';
      const target = (props['Target']?.select?.name as HandoffTarget) || 'AI_STUDIO';
      const status = (props['Status']?.select?.name as HandoffStatus) || 'HANDOFF_READY';
      const environment = (props['Environment']?.select?.name as HandoffEnvironment) || 'DEV3_VPS';
      const verificationState = (props['Verification State']?.select?.name as HandoffVerificationState) || 'UNVERIFIED';
      const databaseSourceState = (props['Database Source']?.select?.name as HandoffDatabaseSourceState) || 'UNVERIFIED';
      const commitSha = props['Commit SHA']?.rich_text?.[0]?.text?.content || '';
      const branch = props['Branch']?.rich_text?.[0]?.text?.content || 'main';
      const pageTimestamp = props['Timestamp']?.date?.start || page.created_time;

      const note: InternalHandoffNote = {
        handoffId,
        timestamp: pageTimestamp,
        source,
        target,
        project: 'TATA_MA_PRAVO',
        topic,
        status,
        environment,
        verificationState,
        databaseSourceState,
        gitContext: {
          repository: 'jirisar7-eng/dev3',
          branch,
          commitSha,
          verifiedOnRemote: true,
        },
        verifiedFacts: [],
        implementedChanges: [],
        decisionsMade: [],
        assumptionsAndProposals: [],
        risksAndBlockers: [],
        dependencies: [],
        nextConcreteAction: 'Pokračovat v dalším kroku podle handoff kontextu.',
        contentHash: props['Content Hash']?.rich_text?.[0]?.text?.content || '',
      };

      return {
        success: true,
        status: 'FETCHED',
        note: this.sanitizeHandoffNote(note),
        message: 'Nejnovější handoff byl úspěšně načten z Notion.',
        timestamp,
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'FAILED',
        note: null,
        message: `Chyba při stahování handoffu: ${sanitizeText(err?.message || String(err))}`,
        timestamp,
      };
    }
  }
}
