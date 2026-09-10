import fs from 'node:fs';
import path from 'node:path';

interface DocumentDefinition {
  key: string;
  filename: string;
  canonicalId: string;
  title: string;
  type: string;
  description: string;
  version: '2.0.0-DRAFT';
  status: 'DRAFT';
  draftDate: string;
  effectiveDate: string;
  author: string;
}

export const LEGAL_DRAFT_DEFINITIONS: DocumentDefinition[] = [
  {
    key: 'terms',
    filename: '02-TERMS-OF-USE-DRAFT.md',
    canonicalId: 'DOC-TMPR-TERMS-V2',
    title: 'Podmínky užívání portálu (Draft 2.0)',
    type: 'TERMS',
    description: 'Návrh Podmínek užívání portálu Táta má právo v2.0.0-DRAFT',
    version: '2.0.0-DRAFT',
    status: 'DRAFT',
    draftDate: '2026-09-09',
    effectiveDate: '2026-09-10',
    author: 'Jiří Šár (Pracovní návrh Legal Pack 2.0)',
  },
  {
    key: 'gdpr',
    filename: '03-PRIVACY-NOTICE-DRAFT.md',
    canonicalId: 'DOC-TMPR-PRIVACY-V2',
    title: 'Zásady ochrany osobních údajů — Privacy Notice (Draft 2.0)',
    type: 'PRIVACY',
    description: 'Návrh Zásad ochrany osobních údajů dle GDPR v2.0.0-DRAFT',
    version: '2.0.0-DRAFT',
    status: 'DRAFT',
    draftDate: '2026-09-09',
    effectiveDate: '2026-09-10',
    author: 'Jiří Šár (Pracovní návrh Legal Pack 2.0)',
  },
  {
    key: 'cookies',
    filename: '04-COOKIE-POLICY-DRAFT.md',
    canonicalId: 'DOC-TMPR-COOKIES-V2',
    title: 'Zásady používání souborů cookie (Draft 2.0)',
    type: 'COOKIES',
    description: 'Návrh zásad používání souborů cookie v2.0.0-DRAFT',
    version: '2.0.0-DRAFT',
    status: 'DRAFT',
    draftDate: '2026-09-09',
    effectiveDate: '2026-09-10',
    author: 'Jiří Šár (Pracovní návrh Legal Pack 2.0)',
  },
  {
    key: 'legal',
    filename: '05-LEGAL-DISCLAIMER-DRAFT.md',
    canonicalId: 'DOC-TMPR-DISCLAIMER-V2',
    title: 'Právní výhrada a vyloučení právního poradenství (Draft 2.0)',
    type: 'LEGAL',
    description: 'Návrh právního upozornění a vyloučení poskytování právních služeb v2.0.0-DRAFT',
    version: '2.0.0-DRAFT',
    status: 'DRAFT',
    draftDate: '2026-09-09',
    effectiveDate: '2026-09-10',
    author: 'Jiří Šár (Pracovní návrh Legal Pack 2.0)',
  },
  {
    key: 'volunteer_code',
    filename: '06-VOLUNTEER-CODE-DRAFT.md',
    canonicalId: 'DOC-TMPR-VOLUNTEER-CODE-V2',
    title: 'Dobrovolnický kodex (Draft 2.0)',
    type: 'VOLUNTEER_CODE',
    description: 'Návrh Dobrovolnického kodexu komunity Táta má právo v2.0.0-DRAFT',
    version: '2.0.0-DRAFT',
    status: 'DRAFT',
    draftDate: '2026-09-09',
    effectiveDate: '2026-09-10',
    author: 'Jiří Šár (Pracovní návrh Legal Pack 2.0)',
  },
  {
    key: 'ai_statement',
    filename: '07-AI-TRANSPARENCY-DRAFT.md',
    canonicalId: 'DOC-TMPR-AI-TRANSPARENCY-V2',
    title: 'Transparentnost AI a prohlášení o využití umělé inteligence (Draft 2.0)',
    type: 'AI_STATEMENT',
    description: 'Návrh Prohlášení o asistivní AI a AI Act compliance v2.0.0-DRAFT',
    version: '2.0.0-DRAFT',
    status: 'DRAFT',
    draftDate: '2026-09-09',
    effectiveDate: '2026-09-10',
    author: 'Jiří Šár (Pracovní návrh Legal Pack 2.0)',
  },
  {
    key: 'dohoda-o-spolupraci',
    filename: '08-VOLUNTEER-COOPERATION-AGREEMENT-DRAFT.md',
    canonicalId: 'DOC-TMPR-VOLUNTEER-AGREEMENT-V2',
    title: 'Dohoda o dobrovolné spolupráci (Draft 2.0)',
    type: 'VOLUNTEER_CODE',
    description: 'Návrh Dohody o dobrovolné spolupráci, NDA, autorských právech a ochraně dat v2.0.0-DRAFT',
    version: '2.0.0-DRAFT',
    status: 'DRAFT',
    draftDate: '2026-09-09',
    effectiveDate: '2026-09-10',
    author: 'Jiří Šár (Pracovní návrh Legal Pack 2.0)',
  },
];

export const DRAFTS_DIR = path.resolve(process.cwd(), 'docs/legal-drafts/legal-pack-2.0');
export const TARGET_FILE = path.resolve(process.cwd(), 'src/data/legalDrafts20.ts');

export function generateLegalDraftsTs(): { fileCount: number; targetPath: string } {
  const contents: Record<string, string> = {};

  for (const doc of LEGAL_DRAFT_DEFINITIONS) {
    const fullPath = path.join(DRAFTS_DIR, doc.filename);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`SSOT Markdown file missing: ${fullPath}`);
    }
    const rawContent = fs.readFileSync(fullPath, 'utf-8');
    if (!rawContent || rawContent.trim().length === 0) {
      throw new Error(`SSOT Markdown file is empty: ${fullPath}`);
    }
    contents[doc.key] = rawContent;
  }

  const generatedCode = `/**
 * ============================================================================
 * AUTO-GENERATED FILE — DO NOT EDIT MANUALLY!
 * ============================================================================
 * This file is deterministically generated from the authoritative Markdown SSOT:
 * docs/legal-drafts/legal-pack-2.0/*.md
 *
 * Generator script: scripts/generateLegalDrafts20.ts
 * Command: TMPR-20260910-LEGAL-022 (REMOVE_LEGAL_PACK_2_0_DUAL_SOURCE_OF_TRUTH)
 * Status: WORKING DRAFT — NOT FOR PUBLICATION
 * ============================================================================
 */

export interface LegalDraft20Item {
  key: string;
  canonicalId: string;
  title: string;
  type: string;
  description: string;
  version: "2.0.0-DRAFT";
  status: "DRAFT";
  draftDate: string;
  effectiveDate: string;
  author: string;
  content: string;
  warningNotice: string;
}

export const LEGAL_PACK_2_0_WARNING = "PRACOVNÍ NÁVRH — NEPUBLIKOVÁNO. Tento dokument není aktuálně účinnou verzí právních podmínek projektu Táta má právo. Aktuální účinná verze je dostupná ve veřejném Centru právních dokumentů.";

export const legalDrafts20Content: Record<string, string> = ${JSON.stringify(contents, null, 2)};

export const legalDrafts20Meta: Record<string, Omit<LegalDraft20Item, "content">> = ${JSON.stringify(
    LEGAL_DRAFT_DEFINITIONS.reduce((acc, doc) => {
      acc[doc.key] = {
        key: doc.key,
        canonicalId: doc.canonicalId,
        title: doc.title,
        type: doc.type,
        description: doc.description,
        version: doc.version,
        status: doc.status,
        draftDate: doc.draftDate,
        effectiveDate: doc.effectiveDate,
        author: doc.author,
        warningNotice: 'PRACOVNÍ NÁVRH — NEPUBLIKOVÁNO. Tento dokument není aktuálně účinnou verzí právních podmínek projektu Táta má právo. Aktuální účinná verze je dostupná ve veřejném Centru právních dokumentů.',
      };
      return acc;
    }, {} as Record<string, any>),
    null,
    2
  )};

export const getLegalDraft20Item = (key: string): LegalDraft20Item | null => {
  const metaItem = legalDrafts20Meta[key];
  const content = legalDrafts20Content[key];
  if (!metaItem || !content) return null;
  return {
    ...metaItem,
    content,
  };
};
`;

  fs.writeFileSync(TARGET_FILE, generatedCode, 'utf-8');
  return { fileCount: LEGAL_DRAFT_DEFINITIONS.length, targetPath: TARGET_FILE };
}

// Execute if run directly from CLI
if (process.argv[1] && process.argv[1].endsWith('generateLegalDrafts20.ts')) {
  try {
    const result = generateLegalDraftsTs();
    console.log(`Successfully generated ${result.targetPath} from ${result.fileCount} Markdown SSOT drafts.`);
  } catch (err: any) {
    console.error(`Generator error: ${err.message}`);
    process.exit(1);
  }
}
