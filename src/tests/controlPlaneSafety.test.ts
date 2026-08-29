import { describe, it, expect } from 'vitest';
import { ControlPlaneStateMachine, StateTransitionRequest } from '../services/controlPlaneStateMachine';
import { ControlPlaneAuthorization } from '../services/controlPlaneAuthorization';
import { ControlPlaneAction, ControlPlaneSnapshot } from '../types/controlPlane';

describe('Control Plane Safety Core', () => {

  describe('ControlPlaneStateMachine', () => {
    
    it('allows valid transitions', () => {
      expect(ControlPlaneStateMachine.isValidTransitionPath('PLANNED', 'SNAPSHOTTED')).toBe(true);
      expect(ControlPlaneStateMachine.isValidTransitionPath('SNAPSHOTTED', 'WAITING_APPROVAL')).toBe(true);
      expect(ControlPlaneStateMachine.isValidTransitionPath('WAITING_APPROVAL', 'APPROVED')).toBe(true);
      expect(ControlPlaneStateMachine.isValidTransitionPath('APPROVED', 'EXECUTING')).toBe(true);
    });

    it('rejects forbidden transitions (FAIL CLOSED)', () => {
      expect(ControlPlaneStateMachine.isValidTransitionPath('WAITING_APPROVAL', 'MERGED')).toBe(false);
      expect(ControlPlaneStateMachine.isValidTransitionPath('WAITING_APPROVAL', 'DEPLOYED')).toBe(false);
      expect(ControlPlaneStateMachine.isValidTransitionPath('DRAFT', 'EXECUTING')).toBe(false);
      expect(ControlPlaneStateMachine.isValidTransitionPath('CI_FAILED', 'MERGED')).toBe(false);
      expect(ControlPlaneStateMachine.isValidTransitionPath('QA_FAILED', 'MERGED')).toBe(false);
      expect(ControlPlaneStateMachine.isValidTransitionPath('BLOCKED', 'MERGED')).toBe(false);
      expect(ControlPlaneStateMachine.isValidTransitionPath('ROLLED_BACK', 'MERGED')).toBe(false);
      expect(ControlPlaneStateMachine.isValidTransitionPath('FAILED', 'MERGED')).toBe(false);
      expect(ControlPlaneStateMachine.isValidTransitionPath('FINALIZED', 'EXECUTING')).toBe(false);
    });

    it('enforces CRITICAL_MUTATION approval gate', () => {
      const req: StateTransitionRequest = {
        action: { status: 'APPROVED', approvalLevel: 'CRITICAL_MUTATION' } as ControlPlaneAction,
        requestedState: 'EXECUTING',
        actorId: 'user1',
        actorCapabilities: [],
        approvalPresent: false
      };
      expect(() => ControlPlaneStateMachine.validateTransition(req)).toThrowError(/FAIL CLOSED/);
    });
    
    it('enforces Operation Catalog approval gate', () => {
      const req: StateTransitionRequest = {
        action: { status: 'APPROVED', operationId: 'DEPLOY' } as ControlPlaneAction,
        requestedState: 'EXECUTING',
        actorId: 'user1',
        actorCapabilities: ['deploy.production'],
        approvalPresent: false
      };
      expect(() => ControlPlaneStateMachine.validateTransition(req)).toThrowError(/FAIL CLOSED/);
    });

    it('enforces Operation Catalog snapshot requirement', () => {
      const req: StateTransitionRequest = {
        action: { status: 'APPROVED', operationId: 'CONFIG_UPDATE' } as ControlPlaneAction,
        requestedState: 'EXECUTING',
        actorId: 'user1',
        actorCapabilities: ['settings.write'],
        approvalPresent: true,
        snapshot: undefined // Missing snapshot
      };
      expect(() => ControlPlaneStateMachine.validateTransition(req)).toThrowError(/FAIL CLOSED: Chybí snapshot/);
    });

    it('enforces main protection against push/commit', () => {
      const req: StateTransitionRequest = {
        action: { status: 'COMMITTED', branch: 'main' } as ControlPlaneAction,
        requestedState: 'PUSHED',
        actorId: 'user1',
        actorCapabilities: [],
        approvalPresent: true
      };
      expect(() => ControlPlaneStateMachine.validateTransition(req)).toThrowError(/FAIL CLOSED: PUSH na main větev z Copilota je absolutně zakázán/);
    });

    it('enforces explicit human approval for MERGED', () => {
      const req: StateTransitionRequest = {
        action: { status: 'WAITING_MERGE_APPROVAL' } as ControlPlaneAction,
        requestedState: 'MERGED',
        actorId: 'user1',
        actorCapabilities: [],
        approvalPresent: false
      };
      expect(() => ControlPlaneStateMachine.validateTransition(req)).toThrowError(/FAIL CLOSED: MERGE_MAIN je zakázán bez explicitního human approval/);
    });
  });

  describe('ControlPlaneAuthorization', () => {
    
    const user = { id: '1', role: 'USER', email: 'u@v.cz' } as any;
    const contentManager = { id: '2', role: 'CONTENT_MANAGER', email: 'c@v.cz' } as any;
    const admin = { id: '3', role: 'ADMIN', email: 'a@v.cz' } as any;
    const superAdmin = { id: '4', role: 'SUPER_ADMIN', email: 'sa@v.cz' } as any;

    it('resolves correct capabilities for USER', () => {
      const caps = ControlPlaneAuthorization.getUserCapabilities(user);
      expect(caps).toContain('content.read');
      expect(caps).not.toContain('content.write');
    });

    it('resolves correct capabilities for SUPER_ADMIN', () => {
      const caps = ControlPlaneAuthorization.getUserCapabilities(superAdmin);
      expect(caps).toContain('content.write');
      expect(caps).toContain('deploy.production');
      expect(caps).toContain('database.migrate');
    });

    it('rejects unknown operation', () => {
      expect(() => ControlPlaneAuthorization.authorizeOperation(admin, 'UNKNOWN' as any, 'target'))
        .toThrowError(/FAIL CLOSED/);
    });

    it('rejects operation for unauthenticated user', () => {
      expect(() => ControlPlaneAuthorization.authorizeOperation(undefined, 'CONTENT_READ', 'target'))
        .toThrowError(/FAIL CLOSED/);
    });

    it('rejects user without required capability', () => {
      expect(() => ControlPlaneAuthorization.authorizeOperation(user, 'CONFIG_UPDATE', 'target'))
        .toThrowError(/FAIL CLOSED/);
    });

    it('allows operation for authorized user', () => {
      expect(() => ControlPlaneAuthorization.authorizeOperation(superAdmin, 'DEPLOY', 'target'))
        .not.toThrow();
    });

    it('rejects forbidden targets (e.g. secrets)', () => {
      expect(() => ControlPlaneAuthorization.authorizeOperation(superAdmin, 'CONTENT_READ', 'config/secrets.json'))
        .toThrowError(/FAIL CLOSED: Cíl 'config\/secrets.json' je pro operaci CONTENT_READ zakázán/);
    });
    
    it('rejects forbidden branch targets', () => {
      expect(() => ControlPlaneAuthorization.authorizeOperation(admin, 'GIT_BRANCH_CREATE', 'main'))
        .toThrowError(/FAIL CLOSED: Cíl 'main' je pro operaci GIT_BRANCH_CREATE zakázán/);
    });

  });

});
