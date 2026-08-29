import { describe, test, expect, beforeAll } from 'vitest';
import { ControlPlaneService } from '../services/controlPlaneService';
import { ControlPlaneStateMachine } from '../services/controlPlaneStateMachine';
import { GithubPublisherService } from '../services/githubPublisherService';
import { User } from '../types';
import fs from 'fs';
import path from 'path';

describe('Control Plane Phase 5B - Real Execution & Concurrency', () => {
  // mockUser DOES NOT have isSystem
  const mockUser = { id: 'user-1', email: 'test@test.com', role: 'ADMIN', name: 'Admin' } as User;
  const superAdminUser = { id: 'admin-1', email: 'super@test.com', role: 'SUPER_ADMIN', name: 'Super Admin' } as User;
  const regularUser = { id: 'regular-1', email: 'reg@test.com', role: 'USER', name: 'Regular' } as User;

  beforeAll(() => {
    const actionsFile = path.join(process.cwd(), 'control-plane-actions.json');
    if (fs.existsSync(actionsFile)) {
      fs.writeFileSync(actionsFile, '[]');
    }
  });

  test('1. concurrent approval conflict (Optimistic Concurrency)', async () => {
    // Uses valid ControlPlaneOperationId: TICKET_UPDATE
    const action = await ControlPlaneService.createAction(
      mockUser, 
      'status_update', 
      { id: '1' }, 
      '127.0.0.1', 
      'TICKET_UPDATE'
    );

    const createdAction = (ControlPlaneService as any).actions.get(action.id);
    createdAction.status = 'AWAITING_APPROVAL';
    (ControlPlaneService as any).save();

    await ControlPlaneService.approveAction(superAdminUser, action.id, '127.0.0.1', createdAction.version);
    
    await expect(
      ControlPlaneService.approveAction(superAdminUser, action.id, '127.0.0.1', createdAction.version - 1)
    ).rejects.toThrow(/Conflict detected/);
  });

  test('4 & 5. rollback changes status to ROLLED_BACK', async () => {
    const action = await ControlPlaneService.createAction(
      mockUser, 
      'status_update', 
      { id: '2' }, 
      '127.0.0.1', 
      'TICKET_UPDATE'
    );
    
    await ControlPlaneService.createSnapshot(superAdminUser, action.id, { foo: "bar" });
    
    const createdAction = (ControlPlaneService as any).actions.get(action.id);
    createdAction.status = 'COMPLETED';
    (ControlPlaneService as any).save();

    await ControlPlaneService.rollbackAction(superAdminUser, action.id, '127.0.0.1');

    const rolledBackAction = (ControlPlaneService as any).actions.get(action.id);
    expect(rolledBackAction.status).toBe('ROLLED_BACK');
  });

  test('6. direct main push rejection', async () => {
    // Uses valid ControlPlaneOperationId: GIT_PUSH_FEATURE
    await expect(ControlPlaneService.createAction(
      mockUser, 
      'Push code to main', 
      { code: 'console.log(1)' }, 
      '127.0.0.1', 
      'GIT_PUSH_FEATURE'
    )).rejects.toThrow(/FAIL CLOSED/);
  });

  test('7. publishToGithub RBAC and message validation', async () => {
     await expect(
        GithubPublisherService.publishToGithub(regularUser, 'Valid message', '127.0.0.1')
     ).rejects.toThrow(/PŘÍSTUP ODEPŘEN/);

     await expect(
        GithubPublisherService.publishToGithub(superAdminUser, '   ', '127.0.0.1')
     ).rejects.toThrow(/Zadejte prosím zprávu k commitu/);
  });

  test('8. executeAction signature check', async () => {
    const action = await ControlPlaneService.createAction(
      mockUser, 
      'status_update', 
      { id: '3' }, 
      '127.0.0.1', 
      'TICKET_UPDATE'
    );

    const createdAction = (ControlPlaneService as any).actions.get(action.id);
    createdAction.status = 'AWAITING_APPROVAL';
    (ControlPlaneService as any).save();

    await ControlPlaneService.approveAction(superAdminUser, action.id, '127.0.0.1', createdAction.version);
    // executeAction signature matches production: (user: User, actionId: string, ipAddress?: string, expectedVersion?: number)
    await expect(ControlPlaneService.executeAction(superAdminUser, action.id, '127.0.0.1', createdAction.version + 1)).rejects.toThrow();
  });
});
