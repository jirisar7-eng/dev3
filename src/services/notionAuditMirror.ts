import { OrionTraceRecord } from './audit/orionTraceTypes';
import { sanitizeText } from './qa/ai/sanitizer';

export interface NotionMirrorStatus {
  enabled: boolean;
  databaseConfigured: boolean;
  message: string;
}

export class NotionAuditMirrorService {
  private static get apiKey(): string | undefined {
    return process.env.NOTION_API_KEY || process.env.NOTION_TOKEN;
  }

  private static get databaseId(): string | undefined {
    return process.env.NOTION_DATABASE_ID;
  }

  /**
   * Returns current Notion mirror configuration status.
   */
  public static getStatus(): NotionMirrorStatus {
    const hasKey = Boolean(this.apiKey);
    const hasDb = Boolean(this.databaseId);

    if (hasKey && hasDb) {
      return {
        enabled: true,
        databaseConfigured: true,
        message: 'Notion Audit Mirror je aktivní a propojen s databází Notion.',
      };
    }

    return {
      enabled: false,
      databaseConfigured: false,
      message: 'Notion Audit Mirror běží v izolovaném lokálním režimu (NOTION_API_KEY nebo NOTION_DATABASE_ID není nastaven).',
    };
  }

  /**
   * Mirrors a 0-PII sanitized Orion Trace Record to Notion as a Read-Only Knowledge / Audit item.
   * Never stores raw prompts, secrets, or unmasked user data.
   */
  public static async mirrorTrace(trace: OrionTraceRecord): Promise<{ success: boolean; message: string }> {
    const status = this.getStatus();
    if (!status.enabled) {
      console.log('[NotionAuditMirror] Mirror skipped (not configured):', trace.id);
      return {
        success: true,
        message: 'Mirror přeskočen: Notion API klíč nebo ID databáze není nastaveno.',
      };
    }

    try {
      // Ensure strict 0-PII sanitization
      const sanitizedActor = sanitizeText(trace.actor.email);
      const sanitizedSummary = sanitizeText(trace.recommendationSummary || 'Bez souhrnu');
      const sanitizedScope = sanitizeText(trace.scope);

      const payload = {
        parent: { database_id: this.databaseId },
        properties: {
          'Trace ID': {
            title: [{ text: { content: trace.id } }],
          },
          'Agent ID': {
            rich_text: [{ text: { content: trace.agentId } }],
          },
          'Trust Level': {
            select: { name: trace.trustLevel },
          },
          'Status': {
            select: { name: trace.status },
          },
          'Scope': {
            rich_text: [{ text: { content: sanitizedScope } }],
          },
          'Actor': {
            rich_text: [{ text: { content: sanitizedActor } }],
          },
          'Latency (ms)': {
            number: trace.totalLatencyMs,
          },
          'Tokens': {
            number: trace.telemetry.totalTokens,
          },
          'Timestamp': {
            date: { start: trace.timestamp },
          },
        },
        children: [
          {
            object: 'block',
            type: 'heading_3',
            heading_3: {
              rich_text: [{ text: { content: 'AI_RECOMMENDATION Summary' } }],
            },
          },
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [{ text: { content: sanitizedSummary } }],
            },
          },
          {
            object: 'block',
            type: 'heading_3',
            heading_3: {
              rich_text: [{ text: { content: 'Process Trace Steps' } }],
            },
          },
          ...trace.steps.map(step => ({
            object: 'block',
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [
                { text: { content: `[${step.status}] ${step.title}: ${step.subtitle} (${step.latencyMs || 0}ms)` } },
              ],
            },
          })),
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
        const errText = await response.text();
        console.warn('[NotionAuditMirror] Failed to post trace to Notion:', errText);
        return {
          success: false,
          message: `Notion API vrátil chybu ${response.status}: ${sanitizeText(errText.slice(0, 150))}`,
        };
      }

      console.log('[NotionAuditMirror] Trace successfully mirrored to Notion:', trace.id);
      return {
        success: true,
        message: 'Trace byl úspěšně zrcadlen do Notion Audit databáze.',
      };
    } catch (err: any) {
      console.warn('[NotionAuditMirror] Exception during Notion mirror:', err?.message);
      return {
        success: false,
        message: `Chyba při zrcadlení do Notion: ${sanitizeText(err?.message || String(err))}`,
      };
    }
  }
}
