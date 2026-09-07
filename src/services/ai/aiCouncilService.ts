import { aiPolicyEngine, DelegationRequest, DelegationEvaluationResult, ModelRole } from './aiPolicyEngine';
import { aiModelRegistry } from './aiModelRegistry';
import { AuditService } from '../auditService';

export type CouncilWorkflowMode = 'SEQUENTIAL' | 'PARALLEL' | 'EVALUATION' | 'SYNTHESIS';

export interface CouncilWorkflowRequest {
  orchestratorModelKey: string; // e.g. 'gemini-1.5-pro' or 'grok-2'
  mode: CouncilWorkflowMode;
  taskTitle: string;
  taskDescriptionSummary: string; // No full prompts or PII
  sensitiveData?: boolean;
  legalData?: boolean;
  freeOnly?: boolean;
  requestedWorkers?: string[]; // Specific model keys or empty for auto-routing
  maxWorkersCount?: number;
}

export interface CouncilStepPlan {
  stepNumber: number;
  role: ModelRole;
  assignedModelKey: string;
  assignedModelName: string;
  taskType: 'ANALYSIS' | 'RESEARCH' | 'CRITIQUE' | 'SYNTHESIS' | 'LEGAL_CHECK' | 'WORKER_TASK';
  delegationEvaluation: DelegationEvaluationResult;
}

export interface CouncilWorkflowExecutionPlan {
  correlationId: string;
  orchestratorModelKey: string;
  mode: CouncilWorkflowMode;
  taskTitle: string;
  status: 'APPROVED' | 'PARTIALLY_APPROVED' | 'REJECTED';
  rejectionReason?: string;
  totalSteps: number;
  allowedStepsCount: number;
  steps: CouncilStepPlan[];
  policySummary: {
    maxDelegationDepth: number;
    maxWorkersPerTask: number;
    sensitiveDataAllowed: boolean;
  };
  timestamp: string;
}

export class AiCouncilService {

  /**
   * Evaluates and builds a Council workflow execution plan using ChatGPT / Gemini as orchestrator.
   * Enforces server-side policy and delegation limits on every step.
   */
  public async planWorkflow(
    request: CouncilWorkflowRequest,
    actorUser?: any,
    ipAddress?: string
  ): Promise<CouncilWorkflowExecutionPlan> {
    const correlationId = `cncl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const timestamp = new Date().toISOString();

    // 1. Verify Primary Orchestrator
    const orchestratorModels = await aiModelRegistry.getModelsOverview();
    const orchestratorMetadata = orchestratorModels.find(m => m.key === request.orchestratorModelKey || m.modelName === request.orchestratorModelKey);

    if (!orchestratorMetadata) {
      const plan: CouncilWorkflowExecutionPlan = {
        correlationId,
        orchestratorModelKey: request.orchestratorModelKey,
        mode: request.mode,
        taskTitle: request.taskTitle,
        status: 'REJECTED',
        rejectionReason: `Orchestrator model '${request.orchestratorModelKey}' nebyl nalezen v registru.`,
        totalSteps: 0,
        allowedStepsCount: 0,
        steps: [],
        policySummary: {
          maxDelegationDepth: 0,
          maxWorkersPerTask: 0,
          sensitiveDataAllowed: false
        },
        timestamp
      };
      
      await this.recordCouncilAudit(plan, actorUser, ipAddress);
      return plan;
    }

    const orchPolicy = aiPolicyEngine.getEffectivePolicy(orchestratorMetadata.key, orchestratorMetadata);

    if (orchPolicy.role !== 'PRIMARY_ORCHESTRATOR' && orchPolicy.role !== 'SECONDARY_ORCHESTRATOR') {
      const plan: CouncilWorkflowExecutionPlan = {
        correlationId,
        orchestratorModelKey: request.orchestratorModelKey,
        mode: request.mode,
        taskTitle: request.taskTitle,
        status: 'REJECTED',
        rejectionReason: `Model '${orchestratorMetadata.displayName}' nemá roli orchestrátora (současná role: ${orchPolicy.role}).`,
        totalSteps: 0,
        allowedStepsCount: 0,
        steps: [],
        policySummary: {
          maxDelegationDepth: orchPolicy.maxDelegationDepth,
          maxWorkersPerTask: orchPolicy.maxWorkersPerTask,
          sensitiveDataAllowed: orchPolicy.sensitiveDataPolicy !== 'DENY'
        },
        timestamp
      };

      await this.recordCouncilAudit(plan, actorUser, ipAddress);
      return plan;
    }

    // 2. Determine Workers to delegate to
    const requestedWorkerKeys = request.requestedWorkers && request.requestedWorkers.length > 0
      ? request.requestedWorkers
      : this.getDefaultWorkerKeysForMode(request.mode, orchestratorMetadata.key);

    const steps: CouncilStepPlan[] = [];
    let allowedCount = 0;

    // 3. Evaluate Delegation for each worker step
    for (let index = 0; index < requestedWorkerKeys.length; index++) {
      const workerKey = requestedWorkerKeys[index];
      const targetMetadata = orchestratorModels.find(m => m.key === workerKey || m.modelName === workerKey);

      const taskType = this.getTaskTypeForIndexAndMode(index, requestedWorkerKeys.length, request.mode);
      const delegationReq: DelegationRequest = {
        parentAgentOrModel: orchestratorMetadata.key,
        targetAgentOrModel: targetMetadata?.key || workerKey,
        taskType,
        currentDepth: 1, // Council level 1 delegation
        requestedWorkersCount: requestedWorkerKeys.length,
        sensitiveData: request.sensitiveData,
        legalData: request.legalData,
        freeOnly: request.freeOnly,
        correlationId
      };

      const evalResult = await aiPolicyEngine.evaluateDelegationRequest(delegationReq, targetMetadata);
      if (evalResult.allowed) {
        allowedCount++;
      }

      steps.push({
        stepNumber: index + 1,
        role: evalResult.targetModelRole || 'WORKER',
        assignedModelKey: workerKey,
        assignedModelName: targetMetadata?.displayName || workerKey,
        taskType,
        delegationEvaluation: evalResult
      });
    }

    let overallStatus: 'APPROVED' | 'PARTIALLY_APPROVED' | 'REJECTED' = 'APPROVED';
    let rejectionReason: string | undefined = undefined;

    if (allowedCount === 0 && steps.length > 0) {
      overallStatus = 'REJECTED';
      rejectionReason = `Všechny delegované kroky rady byly zamítnuty bezpečnostní politikou. Důvod prvního kroku: ${steps[0]?.delegationEvaluation.reason}`;
    } else if (allowedCount < steps.length) {
      overallStatus = 'PARTIALLY_APPROVED';
      rejectionReason = `${steps.length - allowedCount} z ${steps.length} kroků bylo zamítnuto bezpečnostní politikou.`;
    }

    const plan: CouncilWorkflowExecutionPlan = {
      correlationId,
      orchestratorModelKey: orchestratorMetadata.key,
      mode: request.mode,
      taskTitle: request.taskTitle,
      status: overallStatus,
      rejectionReason,
      totalSteps: steps.length,
      allowedStepsCount: allowedCount,
      steps,
      policySummary: {
        maxDelegationDepth: orchPolicy.maxDelegationDepth,
        maxWorkersPerTask: orchPolicy.maxWorkersPerTask,
        sensitiveDataAllowed: orchPolicy.sensitiveDataPolicy !== 'DENY'
      },
      timestamp
    };

    await this.recordCouncilAudit(plan, actorUser, ipAddress);
    return plan;
  }

  private getDefaultWorkerKeysForMode(mode: CouncilWorkflowMode, orchestratorKey: string): string[] {
    switch (mode) {
      case 'SEQUENTIAL':
        return ['gemini-1.5-flash', 'llama-3.3-70b-versatile'];
      case 'PARALLEL':
        return ['gemini-1.5-flash', 'grok-2', 'llama-3.3-70b-versatile'];
      case 'EVALUATION':
        return ['llama-3.3-70b-versatile', 'gemini-1.5-pro']; // Worker then Evaluator
      case 'SYNTHESIS':
        return ['gemini-1.5-flash', 'llama-3.3-70b-versatile', 'openrouter/auto'];
      default:
        return ['gemini-1.5-flash'];
    }
  }

  private getTaskTypeForIndexAndMode(
    index: number,
    total: number,
    mode: CouncilWorkflowMode
  ): 'ANALYSIS' | 'RESEARCH' | 'CRITIQUE' | 'SYNTHESIS' | 'LEGAL_CHECK' | 'WORKER_TASK' {
    if (mode === 'EVALUATION' && index === total - 1) return 'CRITIQUE';
    if (mode === 'SYNTHESIS' && index === total - 1) return 'SYNTHESIS';
    if (index === 0) return 'ANALYSIS';
    return 'WORKER_TASK';
  }

  private async recordCouncilAudit(
    plan: CouncilWorkflowExecutionPlan,
    actorUser?: any,
    ipAddress?: string
  ): Promise<void> {
    try {
      const summary = `AI Council Workflow status=${plan.status} | Mode=${plan.mode} | Orchestrator=${plan.orchestratorModelKey} | AllowedSteps=${plan.allowedStepsCount}/${plan.totalSteps} | CorrelationID=${plan.correlationId}`;
      await AuditService.recordLog(
        'AI_COUNCIL_WORKFLOW_PLAN',
        'AI_COUNCIL_ENGINE',
        summary,
        actorUser,
        ipAddress || '127.0.0.1'
      );
    } catch (err) {
      console.error('[AiCouncilService] Failed to record audit log:', err);
    }
  }
}

export const aiCouncilService = new AiCouncilService();
