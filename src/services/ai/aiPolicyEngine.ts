import { AuditService } from '../auditService';
import { User } from '../../types';

export interface GlobalAiPolicy {
  allowedCapabilities: string[];
  sensitiveDataPolicy: 'DENY' | 'ALLOW_CONFIRMED' | 'ALLOW_SECURE';
  legalDataPolicy: 'DENY' | 'ALLOW_CONFIRMED' | 'ALLOW_SECURE';
  toolsPolicy: 'DENY' | 'ALLOW_READONLY' | 'ALLOW_ALL';
  visionPolicy: 'DENY' | 'ALLOW';
  documentPolicy: 'DENY' | 'ALLOW';
  maxTokens: number;
  timeoutMs: number;
  retryLimit: number;
  fallbackPolicy: 'STRICT_SECURITY' | 'BEST_EFFORT' | 'DISABLED';
  costBudgetUsdPerDay: number;
  tokenBudgetPerDay: number;
  delegationEnabled: boolean;
  maxDelegationDepth: number;
  maxWorkersPerTask: number;
}

export type ModelRole =
  | 'PRIMARY_ORCHESTRATOR'
  | 'SECONDARY_ORCHESTRATOR'
  | 'SPECIALIST'
  | 'WORKER'
  | 'EVALUATOR'
  | 'FALLBACK';

export interface ModelPolicyOverride {
  role?: ModelRole;
  delegationEnabled?: boolean;
  maxDelegationDepth?: number;
  maxWorkersPerTask?: number;
  allowedCapabilities?: string[];
  sensitiveDataPolicy?: 'DENY' | 'ALLOW_CONFIRMED' | 'ALLOW_SECURE';
  legalDataPolicy?: 'DENY' | 'ALLOW_CONFIRMED' | 'ALLOW_SECURE';
  toolsPolicy?: 'DENY' | 'ALLOW_READONLY' | 'ALLOW_ALL';
  maxTokens?: number;
  timeoutMs?: number;
}

export interface EffectiveAiPolicy {
  role: ModelRole;
  allowedCapabilities: string[];
  sensitiveDataPolicy: 'DENY' | 'ALLOW_CONFIRMED' | 'ALLOW_SECURE';
  legalDataPolicy: 'DENY' | 'ALLOW_CONFIRMED' | 'ALLOW_SECURE';
  toolsPolicy: 'DENY' | 'ALLOW_READONLY' | 'ALLOW_ALL';
  visionPolicy: 'DENY' | 'ALLOW';
  documentPolicy: 'DENY' | 'ALLOW';
  maxTokens: number;
  timeoutMs: number;
  retryLimit: number;
  fallbackPolicy: 'STRICT_SECURITY' | 'BEST_EFFORT' | 'DISABLED';
  costBudgetUsdPerDay: number;
  tokenBudgetPerDay: number;
  delegationEnabled: boolean;
  maxDelegationDepth: number;
  maxWorkersPerTask: number;
  inheritedFields: Record<string, boolean>;
}

export interface DelegationRequest {
  parentAgentOrModel: string;
  targetAgentOrModel: string;
  taskType: 'ANALYSIS' | 'RESEARCH' | 'CRITIQUE' | 'SYNTHESIS' | 'LEGAL_CHECK' | 'WORKER_TASK';
  currentDepth: number;
  requestedWorkersCount?: number;
  capabilitiesRequired?: string[];
  sensitiveData?: boolean;
  legalData?: boolean;
  freeOnly?: boolean;
  estimatedTokens?: number;
  estimatedCostUsd?: number;
  correlationId?: string;
}

export interface DelegationEvaluationResult {
  allowed: boolean;
  decision: 'ALLOW' | 'DENY';
  reason: string;
  correlationId: string;
  timestamp: string;
  parentModelRole?: ModelRole;
  targetModelRole?: ModelRole;
  effectivePolicySnapshot: {
    globalPolicy: GlobalAiPolicy;
    effectiveParentPolicy?: Partial<EffectiveAiPolicy>;
    effectiveTargetPolicy?: Partial<EffectiveAiPolicy>;
  };
}

// Global Policy Default Baseline
const DEFAULT_GLOBAL_POLICY: GlobalAiPolicy = {
  allowedCapabilities: ['chat', 'code', 'vision', 'tools', 'reasoning', 'legal_analysis'],
  sensitiveDataPolicy: 'ALLOW_SECURE',
  legalDataPolicy: 'ALLOW_SECURE',
  toolsPolicy: 'ALLOW_READONLY',
  visionPolicy: 'ALLOW',
  documentPolicy: 'ALLOW',
  maxTokens: 16384,
  timeoutMs: 60000,
  retryLimit: 3,
  fallbackPolicy: 'STRICT_SECURITY',
  costBudgetUsdPerDay: 15.0,
  tokenBudgetPerDay: 2000000,
  delegationEnabled: true,
  maxDelegationDepth: 3,
  maxWorkersPerTask: 5
};

// Default Model Roles & Overrides Catalog
const DEFAULT_MODEL_OVERRIDES: Record<string, ModelPolicyOverride> = {
  'gemini-1.5-pro': {
    role: 'PRIMARY_ORCHESTRATOR',
    delegationEnabled: true,
    maxDelegationDepth: 3,
    maxWorkersPerTask: 5,
    sensitiveDataPolicy: 'ALLOW_SECURE',
    legalDataPolicy: 'ALLOW_SECURE'
  },
  'grok-2-1212': {
    role: 'PRIMARY_ORCHESTRATOR',
    delegationEnabled: true,
    maxDelegationDepth: 3,
    maxWorkersPerTask: 4,
    sensitiveDataPolicy: 'ALLOW_CONFIRMED'
  },
  'gemini-1.5-flash': {
    role: 'SPECIALIST',
    delegationEnabled: true,
    maxDelegationDepth: 2,
    maxWorkersPerTask: 3
  },
  'llama-3.3-70b-versatile': {
    role: 'WORKER',
    delegationEnabled: false,
    maxDelegationDepth: 0,
    maxWorkersPerTask: 0
  },
  'openrouter/auto': {
    role: 'FALLBACK',
    delegationEnabled: false,
    maxDelegationDepth: 0,
    maxWorkersPerTask: 0
  }
};

export class AiPolicyEngineService {
  private globalPolicy: GlobalAiPolicy = { ...DEFAULT_GLOBAL_POLICY };
  private modelOverrides: Map<string, ModelPolicyOverride> = new Map(
    Object.entries(DEFAULT_MODEL_OVERRIDES)
  );

  public getGlobalPolicy(): GlobalAiPolicy {
    return { ...this.globalPolicy };
  }

  public updateGlobalPolicy(updates: Partial<GlobalAiPolicy>): GlobalAiPolicy {
    this.globalPolicy = {
      ...this.globalPolicy,
      ...updates,
      // Ensure arrays are sanitized
      allowedCapabilities: updates.allowedCapabilities 
        ? Array.from(new Set(updates.allowedCapabilities))
        : this.globalPolicy.allowedCapabilities
    };
    return this.getGlobalPolicy();
  }

  public getModelOverrides(): Record<string, ModelPolicyOverride> {
    const result: Record<string, ModelPolicyOverride> = {};
    this.modelOverrides.forEach((value, key) => {
      result[key] = { ...value };
    });
    return result;
  }

  public setModelOverride(modelKey: string, override: ModelPolicyOverride): ModelPolicyOverride {
    const existing = this.modelOverrides.get(modelKey) || {};
    const updated = { ...existing, ...override };
    this.modelOverrides.set(modelKey, updated);
    return updated;
  }

  /**
   * Computes Effective Policy: Global Baseline + Provider/Model Restrictions.
   * Local overrides can be STRICTER than Global Policy, but CANNOT bypass Global Security Limits.
   */
  public getEffectivePolicy(modelKey: string, modelMetadata?: any): EffectiveAiPolicy {
    const global = this.globalPolicy;
    const override = this.modelOverrides.get(modelKey) || {};
    const inheritedFields: Record<string, boolean> = {};

    // 1. Role
    const role: ModelRole = override.role || (
      modelMetadata?.routingPriority >= 20 ? 'PRIMARY_ORCHESTRATOR' :
      modelMetadata?.routingPriority >= 10 ? 'SPECIALIST' :
      modelMetadata?.fallbackPriority >= 50 ? 'FALLBACK' : 'WORKER'
    );
    if (!override.role) inheritedFields['role'] = true;

    // 2. Capabilities (Intersection with global allowedCapabilities)
    let allowedCapabilities = global.allowedCapabilities;
    if (override.allowedCapabilities) {
      // Local can only restrict, not add unallowed global caps
      allowedCapabilities = override.allowedCapabilities.filter(c => global.allowedCapabilities.includes(c));
    } else {
      inheritedFields['allowedCapabilities'] = true;
    }

    // 3. Sensitive & Legal Data Policies (Local can be STRICTER, but NOT looser)
    const sensitiveDataPolicy = this.stricterDataPolicy(
      global.sensitiveDataPolicy,
      override.sensitiveDataPolicy
    );
    if (!override.sensitiveDataPolicy) inheritedFields['sensitiveDataPolicy'] = true;

    const legalDataPolicy = this.stricterDataPolicy(
      global.legalDataPolicy,
      override.legalDataPolicy
    );
    if (!override.legalDataPolicy) inheritedFields['legalDataPolicy'] = true;

    // 4. Tools Policy
    const toolsPolicy = this.stricterToolsPolicy(global.toolsPolicy, override.toolsPolicy);
    if (!override.toolsPolicy) inheritedFields['toolsPolicy'] = true;

    // 5. Tokens & Timeout (Local can be LOWER, but not higher than global limits)
    const maxTokens = Math.min(global.maxTokens, override.maxTokens ?? global.maxTokens);
    if (override.maxTokens === undefined) inheritedFields['maxTokens'] = true;

    const timeoutMs = Math.min(global.timeoutMs, override.timeoutMs ?? global.timeoutMs);
    if (override.timeoutMs === undefined) inheritedFields['timeoutMs'] = true;

    // 6. Delegation
    const delegationEnabled = global.delegationEnabled && (override.delegationEnabled ?? true);
    if (override.delegationEnabled === undefined) inheritedFields['delegationEnabled'] = true;

    const maxDelegationDepth = Math.min(
      global.maxDelegationDepth,
      override.maxDelegationDepth ?? global.maxDelegationDepth
    );
    if (override.maxDelegationDepth === undefined) inheritedFields['maxDelegationDepth'] = true;

    const maxWorkersPerTask = Math.min(
      global.maxWorkersPerTask,
      override.maxWorkersPerTask ?? global.maxWorkersPerTask
    );
    if (override.maxWorkersPerTask === undefined) inheritedFields['maxWorkersPerTask'] = true;

    return {
      role,
      allowedCapabilities,
      sensitiveDataPolicy,
      legalDataPolicy,
      toolsPolicy,
      visionPolicy: global.visionPolicy,
      documentPolicy: global.documentPolicy,
      maxTokens,
      timeoutMs,
      retryLimit: global.retryLimit,
      fallbackPolicy: global.fallbackPolicy,
      costBudgetUsdPerDay: global.costBudgetUsdPerDay,
      tokenBudgetPerDay: global.tokenBudgetPerDay,
      delegationEnabled,
      maxDelegationDepth,
      maxWorkersPerTask,
      inheritedFields
    };
  }

  /**
   * Evaluates whether a user and capability pass global AI Policy Engine constraints.
   */
  public evaluatePolicy(user: User | undefined, capability: string): boolean {
    const globalPol = this.getGlobalPolicy();
    if (globalPol.toolsPolicy === 'DENY') {
      return false;
    }
    const blockedCaps = (globalPol as any).blockedCapabilities as string[] | undefined;
    if (blockedCaps && blockedCaps.includes(capability)) {
      return false;
    }
    const allowedCaps = (globalPol as any).allowedControlPlaneCapabilities as string[] | undefined;
    if (allowedCaps && !allowedCaps.includes(capability)) {
      return false;
    }
    return true;
  }

  /**
   * Server-side evaluation of delegation requests.
   */
  public async evaluateDelegationRequest(
    request: DelegationRequest,
    targetModelMetadata?: any
  ): Promise<DelegationEvaluationResult> {
    const correlationId = request.correlationId || `dlg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const timestamp = new Date().toISOString();

    const parentPolicy = this.getEffectivePolicy(request.parentAgentOrModel);
    const targetPolicy = this.getEffectivePolicy(request.targetAgentOrModel, targetModelMetadata);

    const snapshot = {
      globalPolicy: this.getGlobalPolicy(),
      effectiveParentPolicy: parentPolicy,
      effectiveTargetPolicy: targetPolicy
    };

    // 1. Is delegation globally enabled?
    if (!this.globalPolicy.delegationEnabled) {
      return {
        allowed: false,
        decision: 'DENY',
        reason: 'Delegace AI je globálně vypnuta v konfigurační politice.',
        correlationId,
        timestamp,
        parentModelRole: parentPolicy.role,
        targetModelRole: targetPolicy.role,
        effectivePolicySnapshot: snapshot
      };
    }

    // 2. Is parent allowed to delegate?
    if (!parentPolicy.delegationEnabled) {
      return {
        allowed: false,
        decision: 'DENY',
        reason: `Rodičovský model/agent '${request.parentAgentOrModel}' nemá povolenou delegaci úkolů.`,
        correlationId,
        timestamp,
        parentModelRole: parentPolicy.role,
        targetModelRole: targetPolicy.role,
        effectivePolicySnapshot: snapshot
      };
    }

    // 3. Parent role check
    const allowedDelegatorRoles: ModelRole[] = ['PRIMARY_ORCHESTRATOR', 'SECONDARY_ORCHESTRATOR', 'SPECIALIST'];
    if (!allowedDelegatorRoles.includes(parentPolicy.role)) {
      return {
        allowed: false,
        decision: 'DENY',
        reason: `Rodičovský model/agent '${request.parentAgentOrModel}' s rolí '${parentPolicy.role}' nemůže orchestrat ani delegovat.`,
        correlationId,
        timestamp,
        parentModelRole: parentPolicy.role,
        targetModelRole: targetPolicy.role,
        effectivePolicySnapshot: snapshot
      };
    }

    // 4. Depth check (Infinite delegation prevention)
    if (request.currentDepth >= parentPolicy.maxDelegationDepth) {
      return {
        allowed: false,
        decision: 'DENY',
        reason: `Překročena maximální hloubka delegace (${request.currentDepth} >= limitu ${parentPolicy.maxDelegationDepth}). Prevence nekonečné delegace.`,
        correlationId,
        timestamp,
        parentModelRole: parentPolicy.role,
        targetModelRole: targetPolicy.role,
        effectivePolicySnapshot: snapshot
      };
    }

    // 5. Worker count check
    if (request.requestedWorkersCount && request.requestedWorkersCount > parentPolicy.maxWorkersPerTask) {
      return {
        allowed: false,
        decision: 'DENY',
        reason: `Požadovaný počet paralelních workerů (${request.requestedWorkersCount}) překračuje limit ${parentPolicy.maxWorkersPerTask}.`,
        correlationId,
        timestamp,
        parentModelRole: parentPolicy.role,
        targetModelRole: targetPolicy.role,
        effectivePolicySnapshot: snapshot
      };
    }

    // 6. Target Model Verification
    if (!targetModelMetadata) {
      return {
        allowed: false,
        decision: 'DENY',
        reason: `Metadata cílového modelu '${request.targetAgentOrModel}' nejsou k dispozici (Target model metadata unavailable).`,
        correlationId,
        timestamp,
        parentModelRole: parentPolicy.role,
        targetModelRole: targetPolicy.role,
        effectivePolicySnapshot: snapshot
      };
    }

    if (!targetModelMetadata.enabled) {
        return {
          allowed: false,
          decision: 'DENY',
          reason: `Cílový model '${request.targetAgentOrModel}' je zakázán (enabled=false).`,
          correlationId,
          timestamp,
          parentModelRole: parentPolicy.role,
          targetModelRole: targetPolicy.role,
          effectivePolicySnapshot: snapshot
        };
      }

      if (targetModelMetadata.provider && !targetModelMetadata.provider.enabled) {
        return {
          allowed: false,
          decision: 'DENY',
          reason: `Provider '${targetModelMetadata.provider.name}' pro cílový model je vypnutý.`,
          correlationId,
          timestamp,
          parentModelRole: parentPolicy.role,
          targetModelRole: targetPolicy.role,
          effectivePolicySnapshot: snapshot
        };
      }

      if (['DEPRECATED', 'UNAVAILABLE'].includes(targetModelMetadata.lifecycleStatus)) {
        return {
          allowed: false,
          decision: 'DENY',
          reason: `Cílový model je ve stavu '${targetModelMetadata.lifecycleStatus}' a nelze na něj delegovat.`,
          correlationId,
          timestamp,
          parentModelRole: parentPolicy.role,
          targetModelRole: targetPolicy.role,
          effectivePolicySnapshot: snapshot
        };
      }

      // Legal & Sensitive Data
      if (request.sensitiveData || request.legalData) {
        if (!targetModelMetadata.legalDataAllowed) {
          return {
            allowed: false,
            decision: 'DENY',
            reason: `Cílový model '${request.targetAgentOrModel}' nemá povolen zpracovávat právní/citlivá data (legalDataAllowed=false).`,
            correlationId,
            timestamp,
            parentModelRole: parentPolicy.role,
            targetModelRole: targetPolicy.role,
            effectivePolicySnapshot: snapshot
          };
        }

        if (targetPolicy.sensitiveDataPolicy === 'DENY') {
          return {
            allowed: false,
            decision: 'DENY',
            reason: `Politika cílového modelu zakazuje zpracování citlivých dat (sensitiveDataPolicy=DENY).`,
            correlationId,
            timestamp,
            parentModelRole: parentPolicy.role,
            targetModelRole: targetPolicy.role,
            effectivePolicySnapshot: snapshot
          };
        }
      }

      // Free Only check
      if (request.freeOnly) {
        const isFree = targetModelMetadata.freeTier || ['FREE', 'FREE_TIER', 'OPEN_SOURCE'].includes(targetModelMetadata.lifecycleStatus);
        if (!isFree) {
          return {
            allowed: false,
            decision: 'DENY',
            reason: `Vyžadován bezplatný režim (freeOnly=true), ale cílový model '${request.targetAgentOrModel}' je placený.`,
            correlationId,
            timestamp,
            parentModelRole: parentPolicy.role,
            targetModelRole: targetPolicy.role,
            effectivePolicySnapshot: snapshot
          };
        }
      }

      // Required Capabilities Check
      if (request.capabilitiesRequired && request.capabilitiesRequired.length > 0) {
        const missingCapabilities = request.capabilitiesRequired.filter(
          cap => !targetModelMetadata.capabilities.includes(cap) || !targetPolicy.allowedCapabilities.includes(cap)
        );
        if (missingCapabilities.length > 0) {
          return {
            allowed: false,
            decision: 'DENY',
            reason: `Cílovému modelu chybí požadované nebo povolené schopnosti: ${missingCapabilities.join(', ')}.`,
            correlationId,
            timestamp,
            parentModelRole: parentPolicy.role,
            targetModelRole: targetPolicy.role,
            effectivePolicySnapshot: snapshot
          };
        }
      }

    // All policy gates passed!
    return {
      allowed: true,
      decision: 'ALLOW',
      reason: `Delegace schválena: Rodič s rolí '${parentPolicy.role}' smí delegovat úkol typu '${request.taskType}' na '${request.targetAgentOrModel}' (hloubka ${request.currentDepth}/${parentPolicy.maxDelegationDepth}).`,
      correlationId,
      timestamp,
      parentModelRole: parentPolicy.role,
      targetModelRole: targetPolicy.role,
      effectivePolicySnapshot: snapshot
    };
  }

  /**
   * Helper to log delegation audit safely WITHOUT prompts, completions, keys, or PII.
   */
  public async recordDelegationAudit(
    result: DelegationEvaluationResult,
    actorUser?: any,
    ipAddress?: string
  ): Promise<void> {
    try {
      const auditDetails = `Delegation Decision=${result.decision} | CorrelationID=${result.correlationId} | Reason=${result.reason} | ParentRole=${result.parentModelRole || 'N/A'} | TargetRole=${result.targetModelRole || 'N/A'}`;
      
      await AuditService.recordLog(
        'AI_DELEGATION_EVALUATE',
        'AI_POLICY_ENGINE',
        auditDetails,
        actorUser,
        ipAddress || '127.0.0.1'
      );
    } catch (err) {
      console.error('[AiPolicyEngineService] Failed to record delegation audit log:', err);
    }
  }

  private stricterDataPolicy(
    globalPol: 'DENY' | 'ALLOW_CONFIRMED' | 'ALLOW_SECURE',
    overridePol?: 'DENY' | 'ALLOW_CONFIRMED' | 'ALLOW_SECURE'
  ): 'DENY' | 'ALLOW_CONFIRMED' | 'ALLOW_SECURE' {
    if (globalPol === 'DENY' || overridePol === 'DENY') return 'DENY';
    if (globalPol === 'ALLOW_CONFIRMED' || overridePol === 'ALLOW_CONFIRMED') return 'ALLOW_CONFIRMED';
    return 'ALLOW_SECURE';
  }

  private stricterToolsPolicy(
    globalPol: 'DENY' | 'ALLOW_READONLY' | 'ALLOW_ALL',
    overridePol?: 'DENY' | 'ALLOW_READONLY' | 'ALLOW_ALL'
  ): 'DENY' | 'ALLOW_READONLY' | 'ALLOW_ALL' {
    if (globalPol === 'DENY' || overridePol === 'DENY') return 'DENY';
    if (globalPol === 'ALLOW_READONLY' || overridePol === 'ALLOW_READONLY') return 'ALLOW_READONLY';
    return 'ALLOW_ALL';
  }
}

export const aiPolicyEngine = new AiPolicyEngineService();
