import { NormalizedLegalAct, NormalizedLegalSection } from './validationTypes';
import { ChangeDetectionResult, ActChangeType } from './syncTypes';

export interface ExistingActSnapshot {
  actCode: string;
  contentHash: string;
  versionNumber?: string | null;
  sections?: Array<{
    sectionNumber: string;
    sectionOrder?: number;
    title?: string | null;
    content: string;
  }>;
}

/**
 * Deterministic Change Detector for e-Sbírka Legal Acts.
 * 
 * Rules:
 * - NEW: Legal act does not exist in local database.
 * - UNCHANGED: Existing contentHash exactly matches incoming normalized contentHash.
 * - CHANGED: Existing contentHash differs from incoming normalized contentHash.
 * 
 * Preserves historical version auditability without altering normative legal text.
 */
export class EsbirkaChangeDetector {
  /**
   * Evaluates changes between an existing database legal act record and the newly normalized act.
   */
  public static detectChange(
    normalizedAct: NormalizedLegalAct,
    existingAct: ExistingActSnapshot | null
  ): ChangeDetectionResult {
    const currentHash = normalizedAct.contentHash;

    // 1. If no existing act in database -> NEW
    if (!existingAct) {
      return {
        changeType: 'NEW',
        isNew: true,
        isChanged: false,
        isUnchanged: false,
        previousHash: null,
        currentHash,
        summary: `První načtení předpisu č. ${normalizedAct.actCode} (${normalizedAct.title}) do databáze. Počet paragrafů: ${normalizedAct.sections.length}.`,
        sectionsAdded: normalizedAct.sections.length,
        sectionsUpdated: 0,
        sectionsRemoved: 0,
      };
    }

    const previousHash = existingAct.contentHash;

    // 2. If content hashes are identical -> UNCHANGED
    if (previousHash === currentHash) {
      return {
        changeType: 'UNCHANGED',
        isNew: false,
        isChanged: false,
        isUnchanged: true,
        previousHash,
        currentHash,
        summary: `Předpis č. ${normalizedAct.actCode} je beze změn (SHA-256 hash odpovídá aktuálnímu znění).`,
        sectionsAdded: 0,
        sectionsUpdated: 0,
        sectionsRemoved: 0,
      };
    }

    // 3. Content hash differs -> CHANGED (Novela / Aktualizace znění)
    let sectionsAdded = 0;
    let sectionsUpdated = 0;
    let sectionsRemoved = 0;

    if (existingAct.sections && Array.isArray(existingAct.sections)) {
      const existingSectionsMap = new Map<string, string>();
      for (const sec of existingAct.sections) {
        existingSectionsMap.set(sec.sectionNumber.trim().toLowerCase(), sec.content);
      }

      const currentSectionsMap = new Map<string, string>();
      for (const sec of normalizedAct.sections) {
        const key = sec.sectionNumber.trim().toLowerCase();
        currentSectionsMap.set(key, sec.content);

        const existingContent = existingSectionsMap.get(key);
        if (existingContent === undefined) {
          sectionsAdded++;
        } else if (existingContent !== sec.content) {
          sectionsUpdated++;
        }
      }

      for (const [key] of existingSectionsMap) {
        if (!currentSectionsMap.has(key)) {
          sectionsRemoved++;
        }
      }
    } else {
      sectionsUpdated = normalizedAct.sections.length;
    }

    const summary = `Zjištěna novela / změna znění předpisu č. ${normalizedAct.actCode}. Změněných/přidaných paragrafů: ${sectionsAdded + sectionsUpdated}, odebraných: ${sectionsRemoved}.`;

    return {
      changeType: 'CHANGED',
      isNew: false,
      isChanged: true,
      isUnchanged: false,
      previousHash,
      currentHash,
      summary,
      sectionsAdded,
      sectionsUpdated,
      sectionsRemoved,
    };
  }
}
