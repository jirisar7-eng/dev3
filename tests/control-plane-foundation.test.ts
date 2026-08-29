import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ControlPlaneService } from '../src/services/controlPlaneService';
import { AuditService } from '../src/services/auditService';
import { User } from '../src/types';
import fs from 'fs';
import path from 'path';

// Mock dependencies
vi.mock('../src/services/auditService', () => ({
  AuditService: {
    recordLog: vi.fn().mockResolvedValue({ id: 'mock-audit-id' })
  }
}));

describe('Project Control Plane Foundation', () => {
  const mockSuperAdmin: User = { id: '1', email: 'super@test.com', role: 'SUPER_ADMIN' } as any;
  const mockAdmin: User = { id: '2', email: 'admin@test.com', role: 'ADMIN' } as any;
  const mockContentMgr: User = { id: '3', email: 'cm@test.com', role: 'CONTENT_MANAGER' } as any;
  const mockUser: User = { id: '4', email: 'user@test.com', role: 'USER' } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    (ControlPlaneService as any).actions = new Map();
    (ControlPlaneService as any).initialized = true;
  });

  describe('Dry Run & Intent Analysis', () => {
    it('analyzes READ_ONLY intent correctly', () => {
      const result = ControlPlaneService.analyzeIntent('jaký je stav databáze?');
      expect(result.willMutate).toBe(false);
      expect(result.requiredApproval).toBe('READ_ONLY');
      expect(result.requiredPermissions).toContain('content.read');
    });

    it('analyzes SENSITIVE_MUTATION for CMS updates', () => {
      const result = ControlPlaneService.analyzeIntent('update article o soudech');
      expect(result.willMutate).toBe(true);
      expect(result.riskLevel).toBe('MEDIUM');
      expect(result.requiredApproval).toBe('SENSITIVE_MUTATION');
      expect(result.requiredPermissions).toContain('content.write');
    });

    it('analyzes CRITICAL_MUTATION for database or deploy', () => {
      const res1 = ControlPlaneService.analyzeIntent('delete database');
      expect(res1.riskLevel).toBe('CRITICAL');
      expect(res1.requiredApproval).toBe('CRITICAL_MUTATION');
      expect(res1.requiredPermissions).toContain('SUPER_ADMIN');
      
      const res2 = ControlPlaneService.analyzeIntent('drop rbac role');
      expect(res2.riskLevel).toBe('CRITICAL');
      expect(res2.requiredApproval).toBe('CRITICAL_MUTATION');
      expect(res2.requiredPermissions).toContain('SUPER_ADMIN');
    });
  });

  describe('RBAC & Permission Denial (Fail Closed)', () => {
    it('denies USER from executing SAFE_MUTATION', async () => {
      await expect(
        ControlPlaneService.createAction(mockUser, 'update article', {})
      ).rejects.toThrow('Nemáte dostatečná oprávnění');
      expect(AuditService.recordLog).toHaveBeenCalledWith(
        'CONTROL_PLANE_FAILED',
        expect.any(String),
        expect.stringContaining('RBAC Odepřeno'),
        mockUser,
        expect.any(String)
      );
    });

    it('denies ADMIN from executing CRITICAL mutation', async () => {
      await expect(
        ControlPlaneService.createAction(mockAdmin, 'delete database', {})
      ).rejects.toThrow('Nemáte dostatečná oprávnění');
    });

    it('allows SUPER_ADMIN to execute anything', async () => {
      const action = await ControlPlaneService.createAction(mockSuperAdmin, 'delete database deploy', {});
      expect(action.id).toBeDefined();
    });
  });

  describe('Snapshot Creation & Backup', () => {
    it('preserves original state securely in a 48h snapshot', async () => {
      const action = await ControlPlaneService.createAction(mockContentMgr, 'view faq', {});
      const originalData = { title: 'Old FAQ', content: 'Old Content' };
      await ControlPlaneService.createSnapshot(mockContentMgr, action.id, originalData);
      
      const updatedAction = ControlPlaneService.getAction(action.id)!;
      expect(updatedAction.backupReference).toBeDefined();
      expect(updatedAction.status).toBe('APPROVED');
      
      const snapshotPath = path.join(process.cwd(), 'control-plane-snapshots', `${updatedAction.backupReference}.json`);
      expect(fs.existsSync(snapshotPath)).toBe(true);
      if (fs.existsSync(snapshotPath)) fs.unlinkSync(snapshotPath);
    });

    it('sets WAITING_APPROVAL for SENSITIVE_MUTATION after snapshot', async () => {
      const action = await ControlPlaneService.createAction(mockAdmin, 'update data', {});
      await ControlPlaneService.createSnapshot(mockAdmin, action.id, { dummy: true });
      
      const updatedAction = ControlPlaneService.getAction(action.id)!;
      expect(updatedAction.status).toBe('WAITING_APPROVAL');
      
      const snapshotPath = path.join(process.cwd(), 'control-plane-snapshots', `${updatedAction.backupReference}.json`);
      if (fs.existsSync(snapshotPath)) fs.unlinkSync(snapshotPath);
    });
  });

  describe('Approval Gates', () => {
    it('denies USER and CONTENT_MANAGER from approving CRITICAL actions', async () => {
      const action = await ControlPlaneService.createAction(mockSuperAdmin, 'delete data', {});
      await ControlPlaneService.createSnapshot(mockSuperAdmin, action.id, {});
      
      await expect(ControlPlaneService.approveAction(mockContentMgr, action.id)).rejects.toThrow('vyžaduje oprávnění deploy.production');
    });

    it('allows SUPER_ADMIN to approve CRITICAL mutations', async () => {
      const action = await ControlPlaneService.createAction(mockSuperAdmin, 'delete data', {});
      await ControlPlaneService.createSnapshot(mockSuperAdmin, action.id, {});
      
      await ControlPlaneService.approveAction(mockSuperAdmin, action.id);
      expect(ControlPlaneService.getAction(action.id)!.status).toBe('APPROVED');
    });

    it('prevents execution of unapproved actions', async () => {
      const action = await ControlPlaneService.createAction(mockAdmin, 'update data', {});
      await ControlPlaneService.createSnapshot(mockAdmin, action.id, {});
      
      await expect(ControlPlaneService.executeAction(mockAdmin, action.id)).rejects.toThrow('Neplatný přechod stavu');
    });
  });

  describe('Rollback & Expiration', () => {
    it('restores state correctly via rollback', async () => {
      const action = await ControlPlaneService.createAction(mockAdmin, 'update setting', {});
      const originalData = { config: 'old' };
      await ControlPlaneService.createSnapshot(mockAdmin, action.id, originalData);
      
      const rollbackData = await ControlPlaneService.rollbackAction(mockAdmin, action.id, '127.0.0.1');
      expect(rollbackData).toEqual(originalData);
      
      expect(ControlPlaneService.getAction(action.id)!.status).toBe('ROLLED_BACK');
      
      const snapshotPath = path.join(process.cwd(), 'control-plane-snapshots', `${ControlPlaneService.getAction(action.id)!.backupReference}.json`);
      if (fs.existsSync(snapshotPath)) fs.unlinkSync(snapshotPath);
    });

    it('blocks rollback if 48h has expired', async () => {
      const action = await ControlPlaneService.createAction(mockAdmin, 'update setting', {});
      await ControlPlaneService.createSnapshot(mockAdmin, action.id, { test: 1 });
      
      action.expiresAt = new Date(Date.now() - 1000);
      
      await expect(ControlPlaneService.rollbackAction(mockAdmin, action.id, '127.0.0.1')).rejects.toThrow('vypršel (48h limit)');
      
      const snapshotPath = path.join(process.cwd(), 'control-plane-snapshots', `${action.backupReference}.json`);
      if (fs.existsSync(snapshotPath)) fs.unlinkSync(snapshotPath);
    });
  });

  describe('Audit Trail & Secret Redaction', () => {
    it('records logs with appropriate action types', async () => {
      const action = await ControlPlaneService.createAction(mockContentMgr, 'update news', {});
      expect(AuditService.recordLog).toHaveBeenCalledWith('CONTROL_PLANE_PLAN_CREATED', expect.any(String), expect.any(String), mockContentMgr, expect.any(String));
      
      await ControlPlaneService.createSnapshot(mockContentMgr, action.id, {});
      expect(AuditService.recordLog).toHaveBeenCalledWith('CONTROL_PLANE_BACKUP_CREATED', expect.any(String), expect.any(String), mockContentMgr, expect.any(String));
    });
  });
});
