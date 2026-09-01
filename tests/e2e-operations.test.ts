import { describe, it } from 'node:test';
import assert from 'node:assert';
import { prisma, isPrismaAvailable } from '../src/db/prisma';
import { SynthesisOperationsCore } from '../src/services/synthesisOperationsCore';
import { OutboxWorker } from '../src/services/outboxWorker';
import { SlackNotificationService } from '../src/services/slackNotificationService';
import fs from 'fs';
import path from 'path';

describe('B5 E2E OPERATIONS INTEGRATION TEST', async () => {
  it('Should successfully execute full E2E flow', async () => {
    if (!isPrismaAvailable()) {
      console.log('Skipping E2E test, DB not available');
      return;
    }

    // 1. Audit Created + Finding Created + Ticket Created (via SynthesisOperationsCore)
    const auditRes = await SynthesisOperationsCore.createAudit({
      title: 'E2E Test Audit',
      scope: 'B5_E2E',
      source: 'TEST_RUNNER',
      description: 'End-to-End Test for B5 Orchestration',
      performedBy: 'Test Runner',
      findings: [
        {
          code: 'E2E-FINDING-01',
          title: 'E2E Orchestration Test',
          severity: 'P1',
          description: 'Testing the flow',
          createTicket: true,
        }
      ]
    });
    
    assert(auditRes.audit.id, 'Audit must be created');
    assert(auditRes.findingsCreated.length === 1, 'Finding must be created');
    assert(auditRes.ticketsCreated.length === 1, 'Ticket must be created');

    const ticketId = auditRes.ticketsCreated[0].id;
    
    // Check local markdown was created (Github artifact backup)
    const mdPath = path.join(process.cwd(), 'docs', 'audit', `AUDIT-${auditRes.audit.publicId}.md`);
    assert(fs.existsSync(mdPath), 'Audit Markdown file must be written to disk for GitHub backup');

    // 2. Ticket Transition (NEW -> TRIAGED)
    const transition1 = await SynthesisOperationsCore.transitionTicketStatus(ticketId, 'TRIAGED', 'Validating');
    assert.strictEqual(transition1.status, 'TRIAGED');
    
    // 3. Ticket Transition (TRIAGED -> PLANNED -> IN_PR -> IMPLEMENTED)
    await SynthesisOperationsCore.transitionTicketStatus(ticketId, 'PLANNED', 'Planning');
    await SynthesisOperationsCore.transitionTicketStatus(ticketId, 'IN_PR', 'Coding');
    const implementedTicket = await SynthesisOperationsCore.transitionTicketStatus(ticketId, 'IMPLEMENTED', 'Done');
    assert.strictEqual(implementedTicket.status, 'IMPLEMENTED');

    // 4. Verification Passed -> CLOSED
    const closedTicket = await SynthesisOperationsCore.verifyTicket(ticketId, 'PASS', 'E2E Verification Success', 'TestRunner');
    assert.strictEqual(closedTicket.status, 'CLOSED');

    // 5. Outbox Sweep 
    // This sweeps all the PENDING events
    
    let processedEvents = 0;
    
    const originalSlackProcess = SlackNotificationService.processEvent;
    SlackNotificationService.processEvent = async (e) => {
      processedEvents++;
      return { success: true, status: 'DELIVERED' };
    };

    await OutboxWorker.processPendingEvents();
    
    // Check that events were processed
    const remainingPending = await prisma.outboxEvent.count({
      where: { status: 'PENDING', aggregateId: auditRes.audit.id }
    });
    // Can't strictly check overall pending since other tests might leave them, but our specific audit should be processed.
    assert.strictEqual(remainingPending, 0, 'No pending events for this audit should remain');
    assert(processedEvents >= 6, 'Should have processed multiple outbox events (Audit, Finding, Ticket, Transitions, Verify)');
    
    // Clean up
    SlackNotificationService.processEvent = originalSlackProcess;
    
    console.log('[E2E TEST] SUCCESSFULLY PASSED!');
  });
});
