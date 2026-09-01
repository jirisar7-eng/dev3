import { prisma, isPrismaAvailable } from '../src/db/prisma';
import { SynthesisOperationsCore } from '../src/services/synthesisOperationsCore';
import { OutboxWorker } from '../src/services/outboxWorker';
import { SlackNotificationService } from '../src/services/slackNotificationService';
import { KnowledgeMirrorService } from '../src/services/audit/knowledgeMirrorService';
import fs from 'fs';
import path from 'path';

async function runLiveVerification() {
  console.log('--- STARTING DEV3 LIVE VERIFICATION ---');

  if (!isPrismaAvailable()) {
    console.error('❌ ERROR: Database is not available. Ensure you are running this in DEV3 with PostgreSQL.');
    process.exit(1);
  }

  // Check Integrations before starting
  if (!SlackNotificationService.isConfigured()) {
    console.warn('⚠️ WARNING: Slack is not configured (missing SLACK_BOT_TOKEN or SLACK_DEFAULT_CHANNEL_ID). Test will run but Slack verification will fail-closed.');
  } else {
    console.log('✅ Slack Integration: Configured');
  }

  const notionStatus = KnowledgeMirrorService.getStatus();
  if (!notionStatus.enabled) {
    console.warn('⚠️ WARNING: Notion is not configured (missing NOTION_API_KEY or NOTION_DATABASE_ID). Test will run but Notion verification will run in isolated mode.');
  } else {
    console.log('✅ Notion Integration: Configured');
  }

  const timestamp = Date.now();
  const testTitle = `LIVE-E2E-TEST-${timestamp}`;
  console.log(`\n1. Creating test data isolated by prefix [${testTitle}]...`);

  // 1. Audit Created + Finding Created + Ticket Created
  const auditRes = await SynthesisOperationsCore.createAudit({
    title: `${testTitle} - Integration Verification`,
    scope: 'B5.2_LIVE_VERIFICATION',
    source: 'DEV3_OPERATOR',
    description: 'Manual operator-triggered live end-to-end test.',
    performedBy: 'OpsOperator',
    findings: [
      {
        code: `E2E-FIND-${timestamp}`,
        title: `${testTitle} - Finding`,
        severity: 'P1',
        description: 'Test finding to verify Slack delivery',
        createTicket: true,
      }
    ]
  });

  console.log(`✅ Created Audit: ${auditRes.audit.publicId}`);
  console.log(`✅ Created Finding: ${auditRes.findingsCreated[0].publicId}`);
  console.log(`✅ Created Ticket: ${auditRes.ticketsCreated[0].publicId}`);

  const ticketId = auditRes.ticketsCreated[0].id;

  // 2. Ticket Transitions
  console.log('\n2. Executing State Transitions...');
  await SynthesisOperationsCore.transitionTicketStatus(ticketId, 'TRIAGED', 'Validating');
  await SynthesisOperationsCore.transitionTicketStatus(ticketId, 'PLANNED', 'Planning');
  await SynthesisOperationsCore.transitionTicketStatus(ticketId, 'IN_PR', 'Coding');
  const implementedTicket = await SynthesisOperationsCore.transitionTicketStatus(ticketId, 'IMPLEMENTED', 'Done');
  
  console.log(`✅ Ticket State Transitioned to: ${implementedTicket.status}`);

  // 3. Ticket Verification
  const closedTicket = await SynthesisOperationsCore.verifyTicket(ticketId, 'PASS', 'Live E2E Verification Success', 'OpsOperator');
  console.log(`✅ Ticket Verified and Closed: ${closedTicket.status}`);

  // Check local markdown artifact
  const mdPath = path.join(process.cwd(), 'docs', 'audit', `AUDIT-${auditRes.audit.publicId}.md`);
  if (fs.existsSync(mdPath)) {
    console.log(`✅ GitHub Artifact generated at: docs/audit/AUDIT-${auditRes.audit.publicId}.md`);
  } else {
    console.warn(`⚠️ Warning: Artifact not found at ${mdPath}`);
  }

  // 4. Processing Outbox (No mocks!)
  console.log('\n3. Triggering OutboxWorker for isolated events (Real delivery mode)...');
  
  // Isolate outbox processing to ONLY our test events to prevent modifying real production events
  const testPendingEvents = await prisma.outboxEvent.findMany({
    where: { status: 'PENDING', aggregateId: auditRes.audit.id }
  });

  for (const event of testPendingEvents) {
    await OutboxWorker.processEvent(event.id);
  }

  // 5. Verification Check
  const pendingCount = await prisma.outboxEvent.count({
    where: { status: 'PENDING', aggregateId: auditRes.audit.id }
  });

  console.log('\n--- VERIFICATION RESULTS ---');
  if (pendingCount === 0) {
    console.log('✅ All OutboxEvents for this test audit were processed by the worker.');
    console.log('👉 ACTION REQUIRED: Check your configured Slack Channel for notification deliveries.');
    console.log('👉 ACTION REQUIRED: Check your Notion Database for the mirrored audit item.');
  } else {
    console.error(`❌ ERROR: ${pendingCount} OutboxEvents remained PENDING. Check logs for delivery errors.`);
  }

  console.log('\n--- LIVE TEST SCRIPT FINISHED ---');
  process.exit(0);
}

runLiveVerification().catch(e => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
