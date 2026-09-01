import { prisma } from '../db/prisma';
import { sanitizeText } from './qa/ai/sanitizer';

export interface SlackSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  status: 'DELIVERED' | 'DISABLED' | 'FAILED';
}

export class SlackNotificationService {
  private static get botToken(): string | undefined {
    return process.env.SLACK_BOT_TOKEN;
  }

  private static get defaultChannelId(): string | undefined {
    return process.env.SLACK_DEFAULT_CHANNEL_ID;
  }

  /**
   * Safe check if Slack notifications are active and configured.
   */
  public static isConfigured(): boolean {
    return Boolean(this.botToken) && Boolean(this.defaultChannelId);
  }

  /**
   * Processes a local outbox event and posts a formatted alert to Slack.
   * This is entirely non-blocking to the main caller flow.
   */
  public static async processEvent(event: {
    eventId: string;
    eventType: string;
    aggregateType: string;
    aggregateId: string;
    payload: any;
  }): Promise<SlackSendResult> {
    if (!this.isConfigured()) {
      console.log(`[SlackNotificationService] Slack is not configured or disabled. Skipped processing for event ${event.eventId}.`);
      return {
        success: true,
        status: 'DISABLED',
        error: 'Slack not configured',
      };
    }

    try {
      const messageText = await this.formatMessage(event);
      if (!messageText) {
        console.log(`[SlackNotificationService] Event ${event.eventId} (${event.eventType}) is not mapped or skipped for Slack.`);
        return {
          success: true,
          status: 'DISABLED',
          error: 'Event not mapped',
        };
      }

      // Safe, sanitized payload check (PII & Secret Sanitization)
      const sanitizedMessage = sanitizeText(messageText);

      const payload = {
        channel: this.defaultChannelId,
        text: sanitizedMessage,
      };

      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.botToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[SlackNotificationService] Slack API error: HTTP ${response.status} - ${errorText}`);
        return {
          success: false,
          status: 'FAILED',
          error: `HTTP ${response.status} - ${errorText}`,
        };
      }

      const resJson = await response.json() as any;
      if (!resJson.ok) {
        console.error(`[SlackNotificationService] Slack API returned ok: false. Error: ${resJson.error}`);
        // Handle explicit 4xx style Slack payload errors or invalid auth safely without infinite retries if it's client error
        const isClientError = ['invalid_auth', 'channel_not_found', 'not_in_channel', 'invalid_payload'].includes(resJson.error);
        return {
          success: isClientError, // Do not infinite retry clear client configuration errors! Let it pass as "processed" to prevent blockages
          status: 'FAILED',
          error: resJson.error,
        };
      }

      console.log(`[SlackNotificationService] Successfully delivered message for event ${event.eventId} to Slack.`);
      return {
        success: true,
        status: 'DELIVERED',
        messageId: resJson.ts,
      };
    } catch (err: any) {
      console.error(`[SlackNotificationService] Crash sending event ${event.eventId} to Slack:`, err);
      return {
        success: false,
        status: 'FAILED',
        error: err?.message || 'Unknown network error',
      };
    }
  }

  /**
   * Sanitizes text fields and formats them according to our exact operations design guidelines.
   */
  private static async formatMessage(event: {
    eventType: string;
    aggregateType: string;
    aggregateId: string;
    payload: any;
  }): Promise<string | null> {
    const p = event.payload || {};
    const timestampStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

    switch (event.eventType) {
      case 'AUDIT_CREATED': {
        const publicId = p.publicId || 'N/A';
        const title = p.title || 'N/A';
        const scope = p.scope || 'N/A';
        const source = p.source || 'N/A';

        return `*SYNTHESIS OPERATIONS*\n\n🟢 *Audit Created*\n• *Audit ID:* ${publicId}\n• *Title:* ${title}\n• *Scope:* ${scope}\n• *Source:* ${source}\n• *Time:* ${timestampStr}`;
      }

      case 'FINDING_CREATED': {
        const publicId = p.publicId || 'N/A';
        const code = p.code || 'N/A';
        const title = p.title || 'N/A';
        const severity = p.severity || 'N/A';
        const severityEmoji = severity === 'P0' || severity === 'P1' ? '🔴' : '🟡';

        return `*SYNTHESIS OPERATIONS*\n\n${severityEmoji} *${severity} Finding*\n• *Finding ID:* ${publicId}\n• *Code:* ${code}\n• *Title:* ${title}\n• *Time:* ${timestampStr}`;
      }

      case 'TICKET_CREATED': {
        const publicId = p.publicId || 'N/A';
        const title = p.title || 'N/A';
        
        // Fetch severity from ticket or finding if available
        let severity = 'N/A';
        try {
          const t = await prisma.synthesisTicket.findUnique({
            where: { id: event.aggregateId },
            select: { severity: true }
          });
          if (t) {
            severity = t.severity;
          }
        } catch (e) {}

        const severityEmoji = severity === 'CRITICAL' || severity === 'HIGH' ? '🔴' : '🟡';

        return `*SYNTHESIS OPERATIONS*\n\n${severityEmoji} *Ticket Created*\n• *Ticket ID:* ${publicId}\n• *Title:* ${title}\n• *Severity:* ${severity}\n• *Status:* NEW\n• *Time:* ${timestampStr}`;
      }

      case 'TICKET_STATUS_CHANGED':
      case 'TICKET_IMPLEMENTED':
      case 'TICKET_REOPENED': {
        const ticketId = event.aggregateId;
        let publicId = 'N/A';
        let title = 'N/A';
        let severity = 'N/A';

        try {
          const t = await prisma.synthesisTicket.findUnique({
            where: { id: ticketId },
            select: { publicId: true, title: true, severity: true }
          });
          if (t) {
            publicId = t.publicId || 'N/A';
            title = t.title;
            severity = t.severity;
          }
        } catch (e) {}

        const fromStatus = p.fromStatus || 'N/A';
        const toStatus = p.toStatus || 'N/A';
        const statusEmoji = toStatus === 'CLOSED' ? '🟢' : toStatus === 'REOPENED' ? '🔴' : '🔵';

        return `*SYNTHESIS OPERATIONS*\n\n${statusEmoji} *Ticket Status Changed*\n• *Ticket ID:* ${publicId}\n• *Title:* ${title}\n• *Severity:* ${severity}\n• *Transition:* ${fromStatus} ➔ ${toStatus}\n• *Time:* ${timestampStr}`;
      }

      case 'VERIFICATION_PASSED': {
        const ticketId = p.ticketId || 'N/A';
        let publicId = 'N/A';
        let title = 'N/A';

        try {
          const t = await prisma.synthesisTicket.findUnique({
            where: { id: ticketId },
            select: { publicId: true, title: true }
          });
          if (t) {
            publicId = t.publicId || 'N/A';
            title = t.title;
          }
        } catch (e) {}

        const verifiedBy = p.verifiedBy || 'QA Agent';
        // Sanitize evidence, truncate for brevity
        const shortEvidence = p.evidence ? p.evidence.slice(0, 100) + (p.evidence.length > 100 ? '...' : '') : 'None';

        return `*SYNTHESIS OPERATIONS*\n\n🟢 *Verification Passed (Ticket CLOSED)*\n• *Ticket ID:* ${publicId}\n• *Title:* ${title}\n• *Verified By:* ${verifiedBy}\n• *Evidence:* ${shortEvidence}\n• *Time:* ${timestampStr}`;
      }

      case 'VERIFICATION_FAILED': {
        const ticketId = p.ticketId || 'N/A';
        let publicId = 'N/A';
        let title = 'N/A';

        try {
          const t = await prisma.synthesisTicket.findUnique({
            where: { id: ticketId },
            select: { publicId: true, title: true }
          });
          if (t) {
            publicId = t.publicId || 'N/A';
            title = t.title;
          }
        } catch (e) {}

        const verifiedBy = p.verifiedBy || 'QA Agent';
        const shortEvidence = p.evidence ? p.evidence.slice(0, 100) + (p.evidence.length > 100 ? '...' : '') : 'None';

        return `*SYNTHESIS OPERATIONS*\n\n🔴 *Verification Failed (Ticket REOPENED)*\n• *Ticket ID:* ${publicId}\n• *Title:* ${title}\n• *Verified By:* ${verifiedBy}\n• *Failure Reason:* ${shortEvidence}\n• *Time:* ${timestampStr}`;
      }

      default:
        return null; // Ignore non-mapped operations
    }
  }
}
