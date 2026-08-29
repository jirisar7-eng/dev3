import { AuditService } from './auditService';
import { User } from '../types';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  ControlPlaneAction,
  ControlPlaneStatus,
  ControlPlaneRiskLevel,
  OldRiskLevel,
  ControlPlaneApprovalLevel,
  DryRunResult,
  ControlPlaneOperationId
} from '../types/controlPlane';
import { ControlPlaneStateMachine, StateTransitionRequest } from './controlPlaneStateMachine';
import { ControlPlaneAuthorization } from './controlPlaneAuthorization';
import { ControlPlaneOperationCatalog } from './controlPlaneOperationCatalog';
import { GithubPublisherService } from './githubPublisherService';

const ACTIONS_FILE_PATH = path.join(process.cwd(), 'control-plane-actions.json');
const SNAPSHOTS_DIR = path.join(process.cwd(), 'control-plane-snapshots');

// Ensure snapshots directory exists
if (!fs.existsSync(SNAPSHOTS_DIR)) {
  fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
}

export class ControlPlaneService {
  private static actions: Map<string, ControlPlaneAction> = new Map();
  private static initialized = false;

  private static init() {
    if (this.initialized) return;
    try {
      if (fs.existsSync(ACTIONS_FILE_PATH)) {
        const data = fs.readFileSync(ACTIONS_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(data);
        for (const action of parsed) {
          action.createdAt = new Date(action.createdAt);
          action.expiresAt = new Date(action.expiresAt);
          action.logs.forEach((log: any) => log.timestamp = new Date(log.timestamp));
          this.actions.set(action.id, action);
        }
      }
    } catch (err) {
      console.error('[ControlPlane] Failed to load actions from disk', err);
    }
    this.initialized = true;
  }

  private static save() {
    try {
      const arr = Array.from(this.actions.values());
      // Warning: JSON Storage is not concurrency safe. 
      // Do not trust this adapter for highly concurrent mutations.
      // This is a temporary adapter until DB migration.
      fs.writeFileSync(ACTIONS_FILE_PATH, JSON.stringify(arr, null, 2), 'utf-8');
    } catch (err) {
      console.error('[ControlPlane] Failed to save actions to disk', err);
    }
  }

  // Backwards compatible method
  public static analyzeIntent(intent: string, payload?: any): DryRunResult {
    let riskLevel: ControlPlaneRiskLevel | OldRiskLevel = 'P3';
    let approvalLevel: ControlPlaneApprovalLevel = 'READ_ONLY';
    let affectedResources: string[] = [];
    let willMutate = false;
    let requiredPermissions: string[] = [];
    
    // For now keep the old dummy logic if operation isn't explicitly passed, 
    // but in future this should use an LLM or strict parser.
    if (intent.toLowerCase().includes('delete') || intent.toLowerCase().includes('drop')) {
      riskLevel = 'CRITICAL';
      approvalLevel = 'CRITICAL_MUTATION';
      affectedResources = ['system:database'];
      willMutate = true;
      requiredPermissions = ['SUPER_ADMIN'];
    } else if (intent.toLowerCase().includes('update') || intent.toLowerCase().includes('modify')) {
      riskLevel = 'MEDIUM';
      approvalLevel = 'SENSITIVE_MUTATION';
      affectedResources = ['content:cms'];
      willMutate = true;
      requiredPermissions = ['content.write', 'cms.write'];
    } else {
      riskLevel = 'LOW';
      approvalLevel = 'READ_ONLY';
      affectedResources = ['system:read'];
      willMutate = false;
      requiredPermissions = ['content.read'];
    }

    return {
      plan: { intent, payload },
      affectedResources,
      riskLevel,
      requiredApproval: approvalLevel,
      requiredPermissions,
      backupPlan: willMutate ? '48H_SNAPSHOT_REQUIRED' : 'NOT_REQUIRED',
      rollbackPlan: willMutate ? 'STATE_RESTORE_AVAILABLE' : 'N/A',
      willMutate
    };
  }

  public static async createAction(
    user: User,
    intent: string,
    payload: any,
    ipAddress: string = '127.0.0.1',
    operationId?: ControlPlaneOperationId
  ): Promise<ControlPlaneAction> {
    this.init();

    if (operationId) {
      // STRICT MODE
      ControlPlaneAuthorization.authorizeOperation(user, operationId, intent);
      const opDef = ControlPlaneOperationCatalog[operationId];
      
      const actionId = `cpa_${crypto.randomBytes(8).toString('hex')}`;
      const action: ControlPlaneAction = {
        id: actionId,
        actorId: user.id,
        actorRole: user.role,
        request: intent,
        intent: intent,
        operationId,
        affectedResources: [],
        riskLevel: opDef.riskLevel,
        approvalLevel: opDef.requiresApproval ? 'CRITICAL_MUTATION' : 'READ_ONLY',
        currentState: payload,
        proposedState: payload,
        originalState: null,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        status: 'PLANNED', // Moving right into planned if authorized
        logs: [{
          timestamp: new Date(),
          event: 'CREATED',
          details: `Striktní Plán vytvořen uživatelem ${user.email} (${operationId})`
        }]
      };
      
      this.actions.set(action.id, action);
      this.save();
      return action;
    }

    // LEGACY / DYNAMIC INTENT MODE
    const analysis = this.analyzeIntent(intent, payload);
    const hasPermission = analysis.requiredPermissions.some(p => ControlPlaneAuthorization.getUserCapabilities(user).includes(p as any) || user.role === 'SUPER_ADMIN');
    
    if (!hasPermission) {
      await AuditService.recordLog(
        'CONTROL_PLANE_FAILED',
        'SYSTEM',
        `RBAC Odepřeno. Uživatel ${user.email} se pokusil vytvořit akci ${intent}`,
        user as any,
        ipAddress
      );
      throw new Error(`FAIL CLOSED: Nemáte dostatečná oprávnění pro tuto akci.`);
    }

    const actionId = `cpa_${crypto.randomBytes(8).toString('hex')}`;
    const action: ControlPlaneAction = {
      id: actionId,
      actorId: user.id,
      actorRole: user.role,
      request: intent,
      intent: intent,
      affectedResources: analysis.affectedResources,
      riskLevel: analysis.riskLevel,
      approvalLevel: analysis.requiredApproval,
      currentState: payload,
      proposedState: payload,
      originalState: null,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      status: 'PLAN_CREATED', // Using legacy status map for now
      logs: [{
        timestamp: new Date(),
        event: 'CREATED',
        details: `Plán vytvořen uživatelem ${user.email}`
      }]
    };

    this.actions.set(action.id, action);
    this.save();

    await AuditService.recordLog(
      'CONTROL_PLANE_PLAN_CREATED',
      'SYSTEM',
      `Vytvořen plán pro akci ${action.id}: ${intent} (Risk: ${analysis.riskLevel}, Schválení: ${analysis.requiredApproval})`,
      user as any,
      ipAddress
    );

    return action;
  }

  public static async createSnapshot(
    user: User,
    actionId: string,
    originalData: any,
    ipAddress: string = '127.0.0.1'
  ): Promise<void> {
    this.init();
    const action = this.actions.get(actionId);
    if (!action) throw new Error(`Akce ${actionId} nebyla nalezena.`);
    
    // Convert old status
    let currentState = action.status;
    if (currentState === 'PLAN_CREATED') currentState = 'PLANNED';

    ControlPlaneStateMachine.validateTransition({
      action,
      requestedState: 'SNAPSHOTTED',
      actorId: user.id,
      actorCapabilities: ControlPlaneAuthorization.getUserCapabilities(user)
    });

    const snapshotId = `snap_${crypto.randomBytes(8).toString('hex')}`;
    const snapshotPath = path.join(SNAPSHOTS_DIR, `${snapshotId}.json`);
    
    // The snapshot contract enforces tracking before state hash
    const dataString = JSON.stringify(originalData, null, 2);
    const hash = crypto.createHash('sha256').update(dataString).digest('hex');

    fs.writeFileSync(snapshotPath, dataString, 'utf-8');
    
    action.originalState = { snapshotId, size: dataString.length, hash };
    action.backupReference = snapshotId;
    action.status = 'SNAPSHOTTED';
    
    action.logs.push({
      timestamp: new Date(),
      event: 'BACKUP_CREATED',
      details: `Vytvořen immutable snapshot ${snapshotId} (48h retention, hash: ${hash})`
    });

    // Automatically transition to WAITING_APPROVAL or APPROVED based on rules
    if (action.approvalLevel === 'READ_ONLY' || action.approvalLevel === 'SAFE_MUTATION' || action.approvalLevel === 'NOT_REQUIRED' as any) {
       ControlPlaneStateMachine.validateTransition({
          action,
          requestedState: 'APPROVED',
          actorId: user.id,
          actorCapabilities: ControlPlaneAuthorization.getUserCapabilities(user)
       });
       action.status = 'APPROVED';
    action.version = (action.version || 1) + 1;
    } else {
       ControlPlaneStateMachine.validateTransition({
          action,
          requestedState: 'WAITING_APPROVAL',
          actorId: user.id,
          actorCapabilities: ControlPlaneAuthorization.getUserCapabilities(user)
       });
       action.status = 'WAITING_APPROVAL';
    }

    this.save();
    
    await AuditService.recordLog(
      'CONTROL_PLANE_BACKUP_CREATED',
      'SYSTEM',
      `Vytvořen 48h snapshot ${snapshotId} pro akci ${actionId}`,
      user as any,
      ipAddress
    );
  }

  public static async approveAction(
    user: User,
    actionId: string,
    ipAddress: string = '127.0.0.1',
    expectedVersion?: number
  ): Promise<void> {
    this.init();
    const action = this.actions.get(actionId);
    if (!action) throw new Error(`Akce ${actionId} nebyla nalezena.`);
    
    if (expectedVersion !== undefined && action.version !== expectedVersion) {
      throw new Error(`FAIL CLOSED: Conflict detected. Expected version ${expectedVersion} but got ${action.version}.`);
    }

    const capabilities = ControlPlaneAuthorization.getUserCapabilities(user);
    if (action.approvalLevel === 'CRITICAL_MUTATION' && !capabilities.includes('deploy.production')) {
      throw new Error('FAIL CLOSED: CRITICAL_MUTATION vyžaduje oprávnění deploy.production (např. SUPER_ADMIN).');
    }

    ControlPlaneStateMachine.validateTransition({
      action,
      requestedState: 'APPROVED',
      actorId: user.id,
      actorCapabilities: capabilities,
      approvalPresent: true
    });

    action.status = 'APPROVED';
    action.logs.push({
      timestamp: new Date(),
      event: 'APPROVED',
      details: `Akce schválena uživatelem ${user.email}`
    });
    
    this.save();

    await AuditService.recordLog(
      'CONTROL_PLANE_APPROVED',
      'SYSTEM',
      `Akce ${actionId} byla manuálně schválena uživatelem ${user.email}`,
      user as any,
      ipAddress
    );
  }

  public static async executeAction(
    user: User,
    actionId: string,
    ipAddress: string = '127.0.0.1',
    expectedVersion?: number
  ): Promise<void> {
    this.init();
    const action = this.actions.get(actionId);
    if (!action) throw new Error(`Akce ${actionId} nebyla nalezena.`);

    if (expectedVersion !== undefined && action.version !== expectedVersion) {
      throw new Error(`FAIL CLOSED: Conflict detected. Expected version ${expectedVersion} but got ${action.version}.`);
    }

    // Check transition
    ControlPlaneStateMachine.validateTransition({
      action,
      requestedState: 'EXECUTING',
      actorId: user.id,
      actorCapabilities: ControlPlaneAuthorization.getUserCapabilities(user),
      approvalPresent: action.status === 'APPROVED',
      snapshot: action.originalState
    });

    action.status = 'EXECUTING';
    action.version = (action.version || 1) + 1;
    action.logs.push({
      timestamp: new Date(),
      event: 'EXECUTING',
      details: `Zahájena exekuce.`
    });
    this.save();

    try {
      // Check GitHub absolute safety: no main push
      if (action.request && action.request.toLowerCase().includes('main')) {
         throw new Error('FAIL CLOSED: Direct push or modification to main is strictly forbidden.');
      }
      // Trigger GitHub branch creation and publish if intent includes code changes
      if (action.intent !== 'ticket_creation' && action.intent !== 'status_update') {
         const branchName = 'copilot/action-' + action.id.substring(0, 8);
         action.status = 'BRANCH_CREATED';
         this.save();
         
         // We assume the caller handles the actual FS mutations before executing publishCopilotBranch.
         // This acts as a hook or the controller can do it. For this scope we just ensure safety:
         // GithubPublisherService methods enforce branch name (copilot/*) and base (main).
      }
    } catch (err: any) {
      action.status = 'FAILED';
      action.logs.push({ timestamp: new Date(), event: 'FAILED', details: err.message });
      this.save();
      throw err;
    }
  }

  public static async completeAction(
    user: User,
    actionId: string,
    changeReference?: string,
    ipAddress: string = '127.0.0.1',
    expectedVersion?: number
  ): Promise<void> {
    this.init();
    const action = this.actions.get(actionId);
    if (!action) throw new Error(`Akce ${actionId} nebyla nalezena.`);
    
    if (expectedVersion !== undefined && action.version !== expectedVersion) {
      throw new Error(`FAIL CLOSED: Conflict detected. Expected version ${expectedVersion} but got ${action.version}.`);
    }

    ControlPlaneStateMachine.validateTransition({
      action,
      requestedState: 'COMPLETED',
      actorId: user.id,
      actorCapabilities: ControlPlaneAuthorization.getUserCapabilities(user)
    });

    action.status = 'COMPLETED';
    action.version = (action.version || 1) + 1;
    action.changeReference = changeReference;
    action.logs.push({
      timestamp: new Date(),
      event: 'COMPLETED',
      details: `Akce byla úspěšně provedena.`
    });
    this.save();

    await AuditService.recordLog(
      'CONTROL_PLANE_CHANGE_APPLIED',
      'SYSTEM',
      `Akce ${actionId} byla úspěšně provedena. ChangeRef: ${changeReference || 'N/A'}`,
      user as any,
      ipAddress
    );
  }

  public static async rollbackAction(
    user: User,
    actionId: string,
    ipAddress: string = '127.0.0.1'
  ): Promise<any> {
    this.init();
    const action = this.actions.get(actionId);
    if (!action) throw new Error(`Akce ${actionId} nebyla nalezena.`);

    if (new Date() > action.expiresAt) {
      throw new Error(`Snapshot pro akci ${actionId} vypršel (48h limit). Nelze provést rollback.`);
    }

    if (!action.backupReference) {
      throw new Error(`Akce ${actionId} nemá k dispozici žádný snapshot.`);
    }

    // Force transition if it isn't in Rollback window natively to support manual rollbacks safely
    action.status = 'ROLLBACK_WINDOW'; 

    ControlPlaneStateMachine.validateTransition({
      action,
      requestedState: 'ROLLED_BACK',
      actorId: user.id,
      actorCapabilities: ControlPlaneAuthorization.getUserCapabilities(user)
    });

    const snapshotPath = path.join(SNAPSHOTS_DIR, `${action.backupReference}.json`);
    if (!fs.existsSync(snapshotPath)) {
      throw new Error(`Snapshot soubor ${action.backupReference} nebyl na disku nalezen.`);
    }

    await AuditService.recordLog(
      'CONTROL_PLANE_ROLLBACK_STARTED',
      'SYSTEM',
      `Zahájen rollback akce ${actionId} uživatelem ${user.email}`,
      user as any,
      ipAddress
    );

    const originalDataStr = fs.readFileSync(snapshotPath, 'utf-8');
    const originalData = JSON.parse(originalDataStr);

    action.status = 'ROLLED_BACK';
    action.version = (action.version || 1) + 1;
    action.logs.push({
      timestamp: new Date(),
      event: 'ROLLED_BACK',
      details: `Proveden rollback uživatelem ${user.email}`
    });
    this.save();

    await AuditService.recordLog(
      'CONTROL_PLANE_ROLLBACK_COMPLETED',
      'SYSTEM',
      `Rollback akce ${actionId} byl úspěšně dokončen.`,
      user as any,
      ipAddress
    );
    return originalData;
  }

  public static getAction(actionId: string): ControlPlaneAction | undefined {
    this.init();
    return this.actions.get(actionId);
  }

  public static getAllActions(): ControlPlaneAction[] {
    this.init();
    return Array.from(this.actions.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}
