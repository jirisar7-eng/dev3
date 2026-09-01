import { Router, Request, Response } from 'express';
import { verifySlackSignature } from '../middleware/slackAuthMiddleware';
import { SlackIdentityService } from '../services/slackIdentityService';
import { AuthService } from '../services/authService';
import { SynthesisOperationsCore } from '../services/synthesisOperationsCore';

const router = Router();

router.post('/webhook', verifySlackSignature, async (req: Request, res: Response) => {
  try {
    const rawPayload = req.body.payload;
    if (!rawPayload) {
      res.status(400).send('Missing payload');
      return;
    }

    const payload = JSON.parse(rawPayload);

    // Only process interactive components for now (e.g., block_actions)
    if (payload.type !== 'block_actions' && payload.type !== 'interactive_message') {
      res.status(200).send();
      return;
    }

    const slackUserId = payload.user?.id;
    if (!slackUserId) {
      res.status(400).send('Missing user ID');
      return;
    }

    // IDENTITY MAPPING
    const internalUser = await SlackIdentityService.getInternalUserBySlackId(slackUserId);
    if (!internalUser) {
      // In a real Slack integration, you might respond with an ephemeral message here
      console.warn(`[SlackWebhook] Identity mapping failed for Slack User ${slackUserId}`);
      res.status(403).send('Unauthorized: Slack account not linked to an internal identity.');
      return;
    }

    // RBAC & POLICY ENGINE
    // We strictly enforce ADMIN role for synthesis operations originating from Slack
    const isAuthorized = AuthService.hasPermission(internalUser.role, 'ADMIN' as any);
    if (!isAuthorized) {
      console.warn(`[SlackWebhook] RBAC rejection for user ${internalUser.email} (Role: ${internalUser.role})`);
      res.status(403).send('Unauthorized: Insufficient permissions for Operations Core.');
      return;
    }

    // ACTION ROUTING
    const actions = payload.actions || [];
    for (const action of actions) {
      const actionId = action.action_id;
      const value = action.value;

      try {
        if (actionId === 'transition_ticket') {
          // Expected value format: "ticketId:NEW_STATUS"
          const [ticketId, newStatus] = value.split(':');
          if (ticketId && newStatus) {
            await SynthesisOperationsCore.transitionTicketStatus(
              ticketId,
              newStatus,
              internalUser.id,
              internalUser.name || internalUser.email
            );
            console.log(`[SlackWebhook] Ticket ${ticketId} transitioned to ${newStatus} by ${internalUser.email}`);
          }
        } 
        else if (actionId === 'verify_ticket_pass') {
          await SynthesisOperationsCore.verifyTicket(
            value,
            'PASS',
            'Verified implicitly via Slack Security Gateway',
            internalUser.name || internalUser.email
          );
          console.log(`[SlackWebhook] Ticket ${value} verified (PASS) by ${internalUser.email}`);
        }
        else if (actionId === 'verify_ticket_fail') {
          await SynthesisOperationsCore.verifyTicket(
            value,
            'FAIL',
            'Rejected implicitly via Slack Security Gateway',
            internalUser.name || internalUser.email
          );
          console.log(`[SlackWebhook] Ticket ${value} verified (FAIL) by ${internalUser.email}`);
        }
      } catch (err: any) {
        console.error(`[SlackWebhook] Operations execution failed for action ${actionId}:`, err.message);
        // We do not fail the whole request because Slack expects a 200 OK within 3 seconds,
        // otherwise it shows an error in the UI.
      }
    }

    res.status(200).send();
  } catch (err: any) {
    console.error('[SlackWebhook] Webhook crash:', err.message);
    res.status(500).send('Internal Server Error');
  }
});

export default router;
