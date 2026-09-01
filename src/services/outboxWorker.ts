import { isPrismaAvailable, prisma } from '../db/prisma';
import { KnowledgeMirrorService } from './audit/knowledgeMirrorService';
import { SlackNotificationService } from './slackNotificationService';

export class OutboxWorker {
  private static isRunning = false;
  private static intervalId: NodeJS.Timeout | null = null;

  /**
   * Processes a single outbox event with full idempotency and error isolation.
   */
  public static async processEvent(eventId: string) {
    if (!isPrismaAvailable()) return;

    const event = await prisma.outboxEvent.findUnique({
      where: { id: eventId },
    });

    if (!event || event.status !== 'PENDING') {
      return; // Already processed or missing
    }

    // Atomic claim update to guarantee single processing under concurrency (Category 9)
    const claim = await prisma.outboxEvent.updateMany({
      where: { id: eventId, status: 'PENDING' },
      data: { status: 'PROCESSING' },
    });

    if (claim.count === 0) {
      return; // Picked up by another concurrent process
    }

    try {
      console.log(`[OutboxWorker] Processing event ${event.eventId} (${event.eventType}) on aggregate ${event.aggregateType}:${event.aggregateId}`);

      // 1. Send Slack notifications (Phase B3)
      const slackRes = await SlackNotificationService.processEvent({
        eventId: event.eventId,
        eventType: event.eventType,
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        payload: event.payload,
      });

      if (!slackRes.success) {
        throw new Error(`Slack transmission failed: ${slackRes.error}`);
      }

      // 2. Dispatch other integrations based on eventType
      switch (event.eventType) {
        case 'AUDIT_CREATED':
          console.log('[OutboxWorker] [INTEGRATION] Audit registered in outbox. Triggering KnowledgeMirrorService sync.');
          try {
            await KnowledgeMirrorService.syncToNotion({ scope: 'ALL', forceResync: false });
          } catch (notionErr) {
            console.error('[OutboxWorker] [INTEGRATION] Notion sync failed, but proceeding:', notionErr);
            // Non-blocking mirror - we do not fail the outbox event if Slack passed and Notion failed, 
            // since Notion is purely an operational mirror and we can retry sync manually or it will pick up next time.
          }
          break;
        case 'FINDING_CREATED':
          console.log('[OutboxWorker] [INTEGRATION] Finding registered in outbox.');
          break;
        case 'TICKET_CREATED':
          console.log('[OutboxWorker] [INTEGRATION] Ticket created.');
          break;
        case 'TICKET_STATUS_CHANGED':
        case 'TICKET_IMPLEMENTED':
        case 'TICKET_REOPENED':
          console.log(`[OutboxWorker] [INTEGRATION] Ticket state transitioned to ${event.payload ? (event.payload as any).toStatus : 'unknown'}.`);
          break;
        case 'VERIFICATION_PASSED':
        case 'VERIFICATION_FAILED':
          console.log('[OutboxWorker] [INTEGRATION] Verification finished.');
          break;
        default:
          console.log(`[OutboxWorker] Generic event dispatcher for ${event.eventType}`);
      }

      // Mark event as PROCESSED
      await prisma.outboxEvent.update({
        where: { id: eventId },
        data: {
          status: 'PROCESSED',
          attempts: event.attempts + 1,
          processedAt: new Date(),
          lastError: null,
        },
      });

      console.log(`[OutboxWorker] Successfully processed event ${event.eventId}`);
    } catch (err: any) {
      console.error(`[OutboxWorker] Error processing event ${event.eventId}:`, err);

      const nextAttempts = event.attempts + 1;
      const finalStatus = nextAttempts >= 3 ? 'FAILED' : 'PENDING';

      await prisma.outboxEvent.update({
        where: { id: eventId },
        data: {
          status: finalStatus,
          attempts: nextAttempts,
          lastError: err?.message || String(err),
        },
      });
    }
  }

  /**
   * Scans and processes all pending outbox events.
   */
  public static async processPendingEvents() {
    if (this.isRunning) return;
    if (!isPrismaAvailable()) return;

    this.isRunning = true;
    try {
      // 1. Recover stale PROCESSING locks (older than 5 minutes)
      const staleThreshold = new Date(Date.now() - 5 * 60 * 1000);
      const recovered = await prisma.outboxEvent.updateMany({
        where: {
          status: 'PROCESSING',
          updatedAt: { lt: staleThreshold }
        },
        data: {
          status: 'PENDING',
          lastError: 'Recovered from stale PROCESSING lock due to worker crash'
        }
      });
      if (recovered.count > 0) {
        console.warn(`[OutboxWorker] Recovered ${recovered.count} stale PROCESSING locks.`);
      }

      // 2. Process PENDING events
      const pendingEvents = await prisma.outboxEvent.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
        take: 20, // process in small chunks
      });

      if (pendingEvents.length > 0) {
        console.log(`[OutboxWorker] Found ${pendingEvents.length} pending events to process.`);
        for (const event of pendingEvents) {
          await this.processEvent(event.id);
        }
      }
    } catch (err) {
      console.error('[OutboxWorker] Error during outbox sweep:', err);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Starts the background cron/interval worker.
   */
  public static start(intervalMs = 10000) {
    if (this.intervalId) return;

    console.log(`[OutboxWorker] Starting background Transactional Outbox Worker (Interval: ${intervalMs}ms)`);
    this.intervalId = setInterval(() => {
      this.processPendingEvents().catch((err) => {
        console.error('[OutboxWorker] Background sweep error:', err);
      });
    }, intervalMs);
  }

  /**
   * Stops the background worker.
   */
  public static stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[OutboxWorker] Background Outbox Worker stopped.');
    }
  }
}
