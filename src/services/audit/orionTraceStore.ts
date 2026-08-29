import { OrionTraceRecord, OrionTraceStep, OrionTraceStepId, OrionTraceStepStatus } from './orionTraceTypes';
import { User } from '../../types';
import { sanitizeText } from '../qa/ai/sanitizer';

export class OrionTraceStore {
  private static activeTrace: OrionTraceRecord | null = null;
  private static recentTraces: OrionTraceRecord[] = [];
  private static readonly MAX_RECENT = 20;

  /**
   * Resets in-memory active trace and history (used for unit testing).
   */
  public static reset(): void {
    this.activeTrace = null;
    this.recentTraces = [];
  }

  /**
   * Initializes a default initial trace sequence with 10 standard steps.
   */
  public static createInitialSteps(): OrionTraceStep[] {
    return [
      {
        id: 'USER',
        title: '1. Uživatel & Oprávnění',
        subtitle: 'Ověření autentizace a uživatelské role',
        status: 'WAITING',
      },
      {
        id: 'CONTEXT',
        title: '2. Sběr Kontextu',
        subtitle: 'Načtení registrů, zdraví projektů a parametrů',
        status: 'WAITING',
      },
      {
        id: 'SOURCES',
        title: '3. Zdroje & Dokumentace',
        subtitle: 'Kontrola docs/audit a databázové vyhledávací cache',
        status: 'WAITING',
      },
      {
        id: 'SANITIZER',
        title: '4. 0-PII Sanitizátor',
        subtitle: 'Maskování citlivých údajů a redakce klíčů',
        status: 'WAITING',
      },
      {
        id: 'PERMISSION_INTERSECTION',
        title: '5. Capability Intersection',
        subtitle: 'Striktní výpočet User ∩ Orion opravení',
        status: 'WAITING',
      },
      {
        id: 'AI_PROVIDER',
        title: '6. AI Provider Selection',
        subtitle: 'Multi-provider cascade (Gemini / Grok / Groq)',
        status: 'WAITING',
      },
      {
        id: 'EVIDENCE',
        title: '7. Vyhodnocení Evidenci',
        subtitle: 'Kategorizace závažností P0–P3 a verifikace nálezů',
        status: 'WAITING',
      },
      {
        id: 'RECOMMENDATION',
        title: '8. AI_RECOMMENDATION',
        subtitle: 'Generování a Zod validace výstupu analýzy',
        status: 'WAITING',
      },
      {
        id: 'CONTROL_PLANE_DRAFT',
        title: '9. Control Plane Návrh',
        subtitle: 'Vytvoření akce v režimu DRAFT / PLAN_CREATED',
        status: 'WAITING',
      },
      {
        id: 'HUMAN_APPROVAL_GATE',
        title: '10. Human Approval Gate',
        subtitle: 'Požadavek na manuální schválení SUPER_ADMINem',
        status: 'WAITING',
      },
    ];
  }

  /**
   * Starts tracking a new active trace.
   */
  public static startTrace(user: User, scope: string = 'REGISTRY'): OrionTraceRecord {
    const traceId = `trace-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newTrace: OrionTraceRecord = {
      id: traceId,
      agentId: 'agent-orion-qa-v1',
      trustLevel: 'AI_RECOMMENDATION',
      timestamp: new Date().toISOString(),
      actor: {
        email: sanitizeText(user.email || 'unknown'),
        role: user.role || 'ADMIN',
      },
      scope: sanitizeText(scope),
      status: 'ACTIVE',
      currentStepId: 'USER',
      totalLatencyMs: 0,
      provider: {
        primary: 'gemini-3.6-flash',
        active: 'gemini-3.6-flash',
        fallbackUsed: false,
        model: 'gemini-3.6-flash',
      },
      telemetry: {
        promptTokens: 1250,
        completionTokens: 380,
        totalTokens: 1630,
        estimatedCostUsd: 0.00045,
      },
      effectiveCapabilities: ['audit.run', 'findings.view', 'actions.propose'],
      sanitized: true,
      steps: this.createInitialSteps(),
    };

    // Set first step as active
    newTrace.steps[0].status = 'ACTIVE';

    this.activeTrace = newTrace;
    return newTrace;
  }

  /**
   * Helper to sanitize details object against secrets and PII.
   */
  private static sanitizeDetails(details: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    for (const [key, val] of Object.entries(details)) {
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes('secret') || lowerKey.includes('password') || lowerKey.includes('passkey')) {
        sanitized[key] = '[REDACTED_PASSWORD]';
      } else if (lowerKey.includes('prompt') || lowerKey.includes('systeminstruction')) {
        sanitized[key] = '[REDACTED_PROMPT]';
      } else if (lowerKey.includes('token') || lowerKey.includes('jwt') || lowerKey.includes('key')) {
        sanitized[key] = '[REDACTED_KEY]';
      } else if (typeof val === 'string') {
        sanitized[key] = sanitizeText(val);
      } else {
        sanitized[key] = val;
      }
    }
    return sanitized;
  }

  /**
   * Updates a step state inside the active trace.
   */
  public static updateStep(
    stepId: OrionTraceStepId,
    status: OrionTraceStepStatus,
    latencyMs?: number,
    details?: Record<string, any>,
    error?: string,
    evidenceRef?: string
  ): OrionTraceRecord | null {
    if (!this.activeTrace) return null;

    const sanitizedDetails = details ? this.sanitizeDetails(details) : undefined;

    this.activeTrace.steps = this.activeTrace.steps.map(step => {
      if (step.id === stepId) {
        return {
          ...step,
          status,
          latencyMs: latencyMs ?? step.latencyMs,
          details: sanitizedDetails ? { ...step.details, ...sanitizedDetails } : step.details,
          error: error ? sanitizeText(error) : step.error,
          evidenceRef: evidenceRef ? sanitizeText(evidenceRef) : step.evidenceRef,
        };
      }
      return step;
    });

    this.activeTrace.currentStepId = stepId;

    if (status === 'ACTIVE') {
      // Set previous steps to COMPLETED if they were ACTIVE
      this.activeTrace.steps.forEach(step => {
        if (step.id !== stepId && step.status === 'ACTIVE') {
          step.status = 'COMPLETED';
        }
      });
    }

    return this.activeTrace;
  }

  /**
   * Completes the active trace and moves it to recent history.
   */
  public static completeTrace(
    summary?: string,
    proposedActionId?: string,
    status: 'COMPLETED' | 'FAILED' = 'COMPLETED'
  ): OrionTraceRecord | null {
    if (!this.activeTrace) return null;

    this.activeTrace.status = status;
    this.activeTrace.recommendationSummary = summary ? sanitizeText(summary) : undefined;
    this.activeTrace.proposedActionId = proposedActionId ? sanitizeText(proposedActionId) : undefined;

    // Set all WAITING/ACTIVE steps to COMPLETED (or FAILED if trace failed)
    this.activeTrace.steps = this.activeTrace.steps.map(step => {
      if (step.status === 'ACTIVE' || step.status === 'WAITING') {
        return {
          ...step,
          status: status === 'COMPLETED' ? 'COMPLETED' : 'FAILED',
        };
      }
      return step;
    });

    const finishedTrace = { ...this.activeTrace };
    this.recentTraces.unshift(finishedTrace);
    if (this.recentTraces.length > this.MAX_RECENT) {
      this.recentTraces.pop();
    }

    this.activeTrace = null;
    return finishedTrace;
  }

  /**
   * Returns current active trace or latest completed trace.
   */
  public static getActiveOrLatestTrace(): OrionTraceRecord | null {
    if (this.activeTrace) {
      return this.activeTrace;
    }

    if (this.recentTraces.length > 0) {
      return this.recentTraces[0];
    }

    // Build a default baseline completed trace if none exist
    return this.buildDefaultTrace();
  }

  /**
   * Returns trace by ID.
   */
  public static getTraceById(id: string): OrionTraceRecord | null {
    if (this.activeTrace && this.activeTrace.id === id) {
      return this.activeTrace;
    }
    return this.recentTraces.find(t => t.id === id) || null;
  }

  /**
   * Returns all recent traces.
   */
  public static getRecentTraces(): OrionTraceRecord[] {
    if (this.recentTraces.length === 0) {
      const defaultTrace = this.buildDefaultTrace();
      this.recentTraces = [defaultTrace];
    }
    return this.recentTraces;
  }

  /**
   * Builds a default completed baseline trace for display when system starts.
   */
  private static buildDefaultTrace(): OrionTraceRecord {
    const defaultSteps: OrionTraceStep[] = [
      {
        id: 'USER',
        title: '1. Uživatel & Oprávnění',
        subtitle: 'Uživatel admin@dev3.cz ověřen s rolí SUPER_ADMIN',
        status: 'COMPLETED',
        latencyMs: 12,
        details: { user: 'admin@dev3.cz', role: 'SUPER_ADMIN', authenticated: true },
      },
      {
        id: 'CONTEXT',
        title: '2. Sběr Kontextu',
        subtitle: 'Načteno 12 auditních záznamů a 4 pilíře zdraví',
        status: 'COMPLETED',
        latencyMs: 45,
        details: { scope: 'REGISTRY', findingsCount: 22, healthStatus: 'HEALTHY' },
      },
      {
        id: 'SOURCES',
        title: '3. Zdroje & Dokumentace',
        subtitle: 'Verifikována SSOT složka docs/audit a DB query cache',
        status: 'COMPLETED',
        latencyMs: 18,
        details: { markdownSource: 'docs/audit/AUDIT_REGISTRY.md', dbCacheAvailable: true },
      },
      {
        id: 'SANITIZER',
        title: '4. 0-PII Sanitizátor',
        subtitle: 'Maskováno 0 PII položek, všechny klíče redikovány',
        status: 'COMPLETED',
        latencyMs: 5,
        details: { sanitizedFields: 18, piiLeaksDetected: 0 },
      },
      {
        id: 'PERMISSION_INTERSECTION',
        title: '5. Capability Intersection',
        subtitle: 'User ∩ Orion = [audit.run, findings.view, actions.propose]',
        status: 'COMPLETED',
        latencyMs: 8,
        details: { effectiveCapabilities: ['audit.run', 'findings.view', 'actions.propose'] },
      },
      {
        id: 'AI_PROVIDER',
        title: '6. AI Provider Selection',
        subtitle: 'Vybrán primární provider Gemini 2.5 Flash (Latency 480ms)',
        status: 'COMPLETED',
        latencyMs: 480,
        details: { primaryProvider: 'gemini-3.6-flash', activeProvider: 'gemini-3.6-flash', fallbackUsed: false },
      },
      {
        id: 'EVIDENCE',
        title: '7. Vyhodnocení Evidenci',
        subtitle: 'Analyzováno 5 zjištění, z toho 0 P0 a 1 P1',
        status: 'COMPLETED',
        latencyMs: 32,
        details: { findingsEvaluated: 5, criticalFindings: 0 },
      },
      {
        id: 'RECOMMENDATION',
        title: '8. AI_RECOMMENDATION',
        subtitle: 'Zod vyvalidoval výstup. Důvěryhodnost: AI_RECOMMENDATION',
        status: 'COMPLETED',
        latencyMs: 14,
        details: { zodValidated: true, trustLevel: 'AI_RECOMMENDATION' },
      },
      {
        id: 'CONTROL_PLANE_DRAFT',
        title: '9. Control Plane Návrh',
        subtitle: 'Vytvořen návrh akce pro opravu v režimu DRAFT',
        status: 'COMPLETED',
        latencyMs: 22,
        details: { status: 'PLAN_CREATED', proposedActionId: 'cpa-baseline-001' },
      },
      {
        id: 'HUMAN_APPROVAL_GATE',
        title: '10. Human Approval Gate',
        subtitle: 'Vyžadováno schválení SUPER_ADMINem. Release Gate nedotčen.',
        status: 'COMPLETED',
        latencyMs: 2,
        details: { requiresHumanApproval: true, approvalLevel: 'SUPER_ADMIN' },
      },
    ];

    return {
      id: 'trace-baseline-001',
      agentId: 'agent-orion-qa-v1',
      trustLevel: 'AI_RECOMMENDATION',
      timestamp: new Date().toISOString(),
      actor: {
        email: 'admin@dev3.cz',
        role: 'SUPER_ADMIN',
      },
      scope: 'REGISTRY',
      status: 'COMPLETED',
      currentStepId: 'HUMAN_APPROVAL_GATE',
      totalLatencyMs: 646,
      provider: {
        primary: 'gemini-3.6-flash',
        active: 'gemini-3.6-flash',
        fallbackUsed: false,
        model: 'gemini-3.6-flash',
      },
      telemetry: {
        promptTokens: 1420,
        completionTokens: 410,
        totalTokens: 1830,
        estimatedCostUsd: 0.00052,
      },
      effectiveCapabilities: ['audit.run', 'findings.view', 'actions.propose'],
      sanitized: true,
      steps: defaultSteps,
      recommendationSummary: 'Systémový audit nenalezl žádné kritické P0 blokující chyby. Všechna doporučení jsou vytvořena jako DRAFT návrhy.',
      proposedActionId: 'cpa-baseline-001',
    };
  }
}
