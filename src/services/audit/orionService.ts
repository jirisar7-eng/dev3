import { z } from 'zod';
import { User } from '../../types';
import {
  OrionAnalysisRequest,
  OrionAnalysisResponse,
  OrionProposeActionRequest,
  OrionProposeActionResponse,
  FindingSeverity,
} from './types';
import {
  AGENT_ORION_IDENTITY,
  AGENT_ORION_ROLE,
  ControlPlaneAuthorization,
} from '../controlPlaneAuthorization';
import { AiService } from '../AiService';
import { sanitizeInputData, sanitizeText } from '../qa/ai/sanitizer';
import { AuditService } from '../auditService';
import { AuditRegistryEngine } from './auditRegistryEngine';
import { RegressionEngine } from './regressionEngine';
import { ReleaseGateService } from './releaseGateService';
import { ControlPlaneService } from '../controlPlaneService';

// Zod schemas for validating LLM output
export const OrionFindingAnalysisSchema = z.object({
  code: z.string(),
  title: z.string(),
  severity: z.enum(['P0', 'P1', 'P2', 'P3']),
  riskEvaluation: z.string(),
  recommendedRemediation: z.string(),
});

export const OrionSuggestedActionSchema = z.object({
  title: z.string(),
  intent: z.string(),
  targetResource: z.string(),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'P0', 'P1', 'P2', 'P3']),
});

export const OrionLlmResponseSchema = z.object({
  summary: z.string(),
  findingsAnalysis: z.array(OrionFindingAnalysisSchema).default([]),
  regressionAnalysis: z.string().optional(),
  safetyWarnings: z.array(z.string()).default([]),
  suggestedDraftActions: z.array(OrionSuggestedActionSchema).default([]),
});

export class OrionService {
  public static readonly AGENT_ID = AGENT_ORION_IDENTITY;
  public static readonly AGENT_ROLE = AGENT_ORION_ROLE;
  public static readonly TRUST_LEVEL = 'AI_RECOMMENDATION' as const;

  /**
   * Conducts read-only AI security analysis over audit registry findings and evidence.
   * Enforces User ∩ Orion capability intersection, input sanitization, and output validation.
   */
  public static async analyze(
    user: User,
    request: OrionAnalysisRequest = {},
    customAuditDir?: string,
    ipAddress: string = '127.0.0.1'
  ): Promise<OrionAnalysisResponse> {
    const startTime = Date.now();

    // 1. Authorization: Fail-Closed User ∩ Orion Capability Check
    if (!user) {
      throw new Error('FAIL CLOSED: Uživatel neautentizován pro Orion analýzu.');
    }

    ControlPlaneAuthorization.authorizeOrionCapability(user, 'audit.run');

    const effectiveCapabilities = ControlPlaneAuthorization.getOrionEffectiveCapabilities(user);

    // 2. Audit Trail: ORION_ANALYSIS_STARTED
    await AuditService.recordLog(
      'ORION_ANALYSIS_STARTED',
      'ORION_AI',
      `Orion AI analýza spuštěna uživatelem ${user.email} (Rozsah: ${request.scope || 'REGISTRY'})`,
      user,
      ipAddress
    );

    try {
      // 3. Gather Evidence (READ-ONLY)
      const registry = AuditRegistryEngine.loadRegistry(customAuditDir);
      const regressions = RegressionEngine.analyzeAuditTimeline(registry.records);
      const gateEvaluation = await ReleaseGateService.evaluateReleaseGate(undefined, customAuditDir);
      const health = gateEvaluation.health;

      const allFindings = registry.records.flatMap(r => r.findings);
      let targetFindings = allFindings;
      if (request.targetCode) {
        targetFindings = targetFindings.filter(f => f.code.toUpperCase() === request.targetCode?.toUpperCase());
      }

      // 4. Sanitize Input Data before LLM
      const sanitizedContext = sanitizeInputData({
        scope: request.scope || 'REGISTRY',
        userQuery: request.userQuery || 'Analyzuj stav auditních zjištění a navrhni bezpečná doporučení.',
        totalAudits: registry.records.length,
        totalFindings: registry.summary.totalFindings,
        openFindingsCount: allFindings.filter(f => f.status === 'OPEN').length,
        criticalRegressionsCount: regressions.filter(r => r.currentSeverity === 'P0' || r.currentSeverity === 'P1').length,
        findingsSample: targetFindings.slice(0, 15).map(f => ({
          code: f.code,
          title: f.title,
          severity: f.severity,
          status: f.status,
          description: f.description,
        })),
        regressionsSample: regressions.slice(0, 5).map(r => ({
          code: r.code,
          title: r.title,
          changeType: r.changeType,
          currentSeverity: r.currentSeverity,
          explanation: r.explanation,
        })),
        projectHealthSummary: {
          database: health.databaseAndMigrations.status,
          security: health.securityAndRbac.status,
          controlPlane: health.controlPlane.status,
          testSuite: health.testSuiteAndBuild.status,
        },
      });

      // 5. Construct Structured AI Prompt
      const systemInstruction = `Jsi Orion (agent-orion-qa-v1), přísný a deterministický AI Security Analyst projektu Táta má právo.
Tvým úkolem je poskytovat výhradně strukturované doporučení (AI_RECOMMENDATION).
ZÁSADY:
1. Nikdy nemáš pravomoc schvalovat nasazení, merge ani exekuci (Release Gate je čistě lidská a deterministická záležitost).
2. Tvé výstupy jsou doporučující, ne autoritativní.
3. Všechny návrhy akcí musí směřovat výhradně do stavu DRAFT s nutností lidského schválení.
4. Odpověz POUZE ve formátu JSON podle následujícího schématu:
{
  "summary": "Stručné shrnutí bezpečnostního stavu",
  "findingsAnalysis": [
    {
      "code": "SEC-01",
      "title": "Název",
      "severity": "P0|P1|P2|P3",
      "riskEvaluation": "Zhodnocení rizika",
      "recommendedRemediation": "Doporučený krok nápravy"
    }
  ],
  "regressionAnalysis": "Analýza regresí",
  "safetyWarnings": ["Bezpečnostní varování"],
  "suggestedDraftActions": [
    {
      "title": "Návrh DRAFT akce",
      "intent": "Popis zamýšlené změny",
      "targetResource": "system:audit",
      "riskLevel": "P1"
    }
  ]
}`;

      const prompt = `Proveď bezpečnostní analýzu následujícího kontextu auditu:\n${JSON.stringify(sanitizedContext, null, 2)}`;

      // 6. Call AI Service (Reusable resilience cascade)
      let rawAiResponse = '';
      try {
        rawAiResponse = await AiService.generateContent(prompt, {
          systemInstruction,
          jsonMode: true,
          temperature: 0.1,
          timeoutMs: 25000,
        });
      } catch (aiErr: any) {
        // Fallback to deterministic offline analysis if AI is unavailable
        console.warn('[OrionService] AI generation unavailable, falling back to deterministic synthesis:', aiErr?.message);
        rawAiResponse = JSON.stringify({
          summary: `Deterministická syntéza Oriona: evidováno ${allFindings.filter(f => f.status === 'OPEN').length} otevřených zjištění a ${regressions.length} regresí.`,
          findingsAnalysis: targetFindings.slice(0, 5).map(f => ({
            code: f.code,
            title: f.title,
            severity: f.severity,
            riskEvaluation: `Deterministické zhodnocení pro ${f.code} se závažností ${f.severity}.`,
            recommendedRemediation: `Prověřit a opravit ${f.code} dle metodiky auditu.`,
          })),
          regressionAnalysis: regressions.length > 0 ? `Zjištěno ${regressions.length} časových změn/regresí v auditních záznamech.` : 'Nebyly detekovány žádné kritické regrese.',
          safetyWarnings: [
            'AI poskytovatelé jsou offline nebo nedostupní – výstup byl sestaven deterministickým záložním analyzátorem.',
          ],
          suggestedDraftActions: [],
        });
      }

      // 7. Parse JSON & Validate with Zod
      let parsedJson: any;
      try {
        parsedJson = JSON.parse(rawAiResponse);
      } catch {
        // Handle malformed JSON
        parsedJson = {
          summary: sanitizeText(rawAiResponse.slice(0, 500)),
          findingsAnalysis: [],
          safetyWarnings: ['Odpověď AI modelu nebyla validním JSONem a byla bezpečně zkrácena.'],
          suggestedDraftActions: [],
        };
      }

      const validated = OrionLlmResponseSchema.safeParse(parsedJson);
      const finalData = validated.success
        ? validated.data
        : {
            summary: sanitizeText(parsedJson.summary || 'Chyba validace formátu AI odpovědi.'),
            findingsAnalysis: [],
            regressionAnalysis: undefined,
            safetyWarnings: ['AI odpověď nesplnila striktní Zod validační schéma a byla sanitizována.'],
            suggestedDraftActions: [],
          };

      // 8. Re-sanitize output before returning or persisting
      const sanitizedSummary = sanitizeText(finalData.summary);
      const sanitizedFindingsAnalysis = finalData.findingsAnalysis.map(fa => ({
        code: sanitizeText(fa.code),
        title: sanitizeText(fa.title),
        severity: fa.severity as FindingSeverity,
        riskEvaluation: sanitizeText(fa.riskEvaluation),
        recommendedRemediation: sanitizeText(fa.recommendedRemediation),
      }));
      const sanitizedSafetyWarnings = finalData.safetyWarnings.map(w => sanitizeText(w));
      const sanitizedDraftActions = finalData.suggestedDraftActions.map(da => ({
        title: sanitizeText(da.title),
        intent: sanitizeText(da.intent),
        targetResource: sanitizeText(da.targetResource),
        riskLevel: da.riskLevel,
        requiresHumanApproval: true as const,
      }));

      const latencyMs = Date.now() - startTime;

      const response: OrionAnalysisResponse = {
        agentId: this.AGENT_ID,
        role: this.AGENT_ROLE,
        trustLevel: this.TRUST_LEVEL,
        timestamp: new Date().toISOString(),
        summary: sanitizedSummary,
        findingsAnalysis: sanitizedFindingsAnalysis,
        regressionAnalysis: finalData.regressionAnalysis ? sanitizeText(finalData.regressionAnalysis) : undefined,
        safetyWarnings: sanitizedSafetyWarnings,
        suggestedDraftActions: sanitizedDraftActions,
        metadata: {
          model: 'gemini-3.6-flash',
          latencyMs,
          effectiveCapabilities,
        },
      };

      // 9. Audit Trail: ORION_ANALYSIS_COMPLETED
      await AuditService.recordLog(
        'ORION_ANALYSIS_COMPLETED',
        'ORION_AI',
        `Orion AI analýza dokončena za ${latencyMs}ms. Analyzováno ${sanitizedFindingsAnalysis.length} zjištění.`,
        user,
        ipAddress
      );

      return response;
    } catch (err: any) {
      // Record failure audit
      await AuditService.recordLog(
        'ORION_ANALYSIS_FAILED',
        'ORION_AI',
        `Orion AI analýza selhala: ${sanitizeText(err?.message || String(err))}`,
        user,
        ipAddress
      );
      throw err;
    }
  }

  /**
   * Creates a ControlPlaneAction proposal strictly in DRAFT status.
   * Enforces User ∩ Orion capabilities and ensures human approval is required.
   */
  public static async proposeDraftAction(
    user: User,
    request: OrionProposeActionRequest,
    ipAddress: string = '127.0.0.1'
  ): Promise<OrionProposeActionResponse> {
    if (!user) {
      throw new Error('FAIL CLOSED: Uživatel neautentizován pro návrh akce.');
    }

    // Capability check: User must have project/audit capability
    ControlPlaneAuthorization.authorizeOrionCapability(user, 'audit.run');

    if (!request.title || !request.intent) {
      throw new Error('FAIL CLOSED: Název i záměr akce jsou povinné.');
    }

    // Sanitize input payload
    const sanitizedTitle = sanitizeText(request.title);
    const sanitizedIntent = sanitizeText(request.intent);
    const sanitizedPayload = sanitizeInputData(request.payload || {});

    // Create action strictly in draft mode through ControlPlaneService
    const action = await ControlPlaneService.createAction(
      user,
      `[ORION PROPOSAL] ${sanitizedTitle}: ${sanitizedIntent}`,
      {
        proposedBy: this.AGENT_ID,
        proposedByRole: this.AGENT_ROLE,
        trustLevel: this.TRUST_LEVEL,
        findingReference: request.findingReference ? sanitizeText(request.findingReference) : undefined,
        targetResource: request.targetResource ? sanitizeText(request.targetResource) : 'system:audit',
        details: sanitizedPayload,
      },
      ipAddress
    );

    // Audit Trail: ORION_ACTION_PROPOSED
    await AuditService.recordLog(
      'ORION_ACTION_PROPOSED',
      'ORION_AI',
      `Orion AI navrhl ControlPlaneAction ${action.id} pro uživatele ${user.email} (Stav: DRAFT/PLAN_CREATED, vyžaduje schválení).`,
      user,
      ipAddress
    );

    return {
      agentId: this.AGENT_ID,
      trustLevel: this.TRUST_LEVEL,
      actionId: action.id,
      status: 'PLAN_CREATED',
      message: 'Návrh akce byl bezpečně vytvořen ve stavu DRAFT/PLAN_CREATED. Pro exekuci je vyžadováno schválení SUPER_ADMIN.',
      requiresHumanApproval: true,
      requiredApprovalLevel: action.approvalLevel,
      action,
    };
  }
}
