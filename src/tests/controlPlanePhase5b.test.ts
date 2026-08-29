import { ControlPlaneService } from '../services/controlPlaneService';
import { ControlPlaneStateMachine } from '../services/controlPlaneStateMachine';
import { GithubPublisherService } from '../services/githubPublisherService';
import { User } from '../types';
import fs from 'fs';
import path from 'path';

describe('Control Plane Phase 5B - Real Execution & Concurrency', () => {
  const mockUser: User = { id: 'user-1', email: 'test@test.com', role: 'ADMIN', name: 'Admin', isSystem: false, systemPermissions: [], loginType: 'EMAIL', isMfaEnabled: true };
  const superAdminUser: User = { id: 'admin-1', email: 'super@test.com', role: 'SUPER_ADMIN', name: 'Super Admin', isSystem: false, systemPermissions: [], loginType: 'EMAIL', isMfaEnabled: true };

  beforeAll(() => {
    // Clear JSON before tests
    const actionsFile = path.join(process.cwd(), 'control-plane-actions.json');
    if (fs.existsSync(actionsFile)) {
      fs.writeFileSync(actionsFile, '[]');
    }
  });

  test('1. concurrent approval conflict (Optimistic Concurrency)', async () => {
    const action = await ControlPlaneService.createAction(
      mockUser, 
      'status_update', 
      { id: '1' }, 
      '127.0.0.1', 
      'UPDATE_SYNTHESIS_TICKET'
    );
    // Force state to AWAITING_APPROVAL
    const createdAction = (ControlPlaneService as any).actions.get(action.id);
    createdAction.status = 'AWAITING_APPROVAL';
    (ControlPlaneService as any).save();

    // First admin approves with expectedVersion = 1 (assuming it is 1)
    await ControlPlaneService.approveAction(superAdminUser, action.id, '127.0.0.1', createdAction.version);
    
    // Second admin tries to approve with the old expectedVersion
    await expect(
      ControlPlaneService.approveAction(superAdminUser, action.id, '127.0.0.1', createdAction.version - 1)
    ).rejects.toThrow(/Conflict detected/);
  });

  test('4 & 5. rollback creates new event and original remains immutable', async () => {
    const action = await ControlPlaneService.createAction(
      mockUser, 
      'status_update', 
      { id: '2' }, 
      '127.0.0.1', 
      'UPDATE_SYNTHESIS_TICKET'
    );
    const createdAction = (ControlPlaneService as any).actions.get(action.id);
    createdAction.status = 'COMPLETED'; // can only rollback completed or failed
    (ControlPlaneService as any).save();

    await ControlPlaneService.rollbackAction(superAdminUser, action.id, '127.0.0.1', createdAction.version);

    // Get it again
    const rolledBackAction = (ControlPlaneService as any).actions.get(action.id);
    expect(rolledBackAction.status).toBe('ROLLED_BACK');
    
    // Check if new action was created
    const allActions = Array.from((ControlPlaneService as any).actions.values()) as any[];
    const rollbackEvent = allActions.find(a => a.intent === 'rollback' && a.request.includes(action.id));
    expect(rollbackEvent).toBeDefined();
    expect(rollbackEvent.status).toBe('COMPLETED');
  });

  test('6. direct main push rejection', async () => {
    const action = await ControlPlaneService.createAction(
      mockUser, 
      'Push code to main', 
      { code: 'console.log(1)' }, 
      '127.0.0.1', 
      'DEPLOY_PRODUCTION'
    );
    const createdAction = (ControlPlaneService as any).actions.get(action.id);
    createdAction.status = 'APPROVED';
    (ControlPlaneService as any).save();

    await expect(
      ControlPlaneService.executeAction(superAdminUser, action.id, '127.0.0.1', createdAction.version)
    ).rejects.toThrow(/Direct push or modification to main is strictly forbidden/);
  });

  test('7. non-copilot branch rejection', () => {
     expect(() => {
        GithubPublisherService.validateCopilotBranch('feature/test');
     }).toThrow(/Neplatný název větve/);

     expect(() => {
        GithubPublisherService.validateCopilotBranch('copilot/action-123');
     }).not.toThrow();
  });
});
