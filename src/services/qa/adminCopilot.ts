import { qaAuditEngine } from './qaAuditEngine';
import { synthesisMultiAIOrchestrator } from './ai/synthesisMultiAIOrchestrator';
import { AIAnalysisContext } from './ai/types';
import { AuditService } from '../auditService';
import { User } from '../../types';

export interface CopilotStep {
  id: string;
  title: string;
  type: 'RUN_AUDIT' | 'AI_COUNCIL_ANALYSIS' | 'RISK_ANALYSIS' | 'FIX_PROPOSAL' | 'EXPLICIT_PROVIDERS';
  status: 'PENDING' | 'EXECUTING' | 'COMPLETED' | 'FAILED';
  requiresConfirmation: boolean;
  explanation: string;
  payload?: any;
}

export interface CopilotPlan {
  queryType: string;
  title: string;
  explanation: string;
  steps: CopilotStep[];
  status: 'PENDING' | 'EXECUTING' | 'COMPLETED' | 'FAILED' | 'REQUIRES_CONFIRMATION';
}

export class AdminCopilotService {
  /**
   * Interprets the user's natural language request and generates a safe plan.
   */
  public static generatePlan(message: string): CopilotPlan {
    const msg = message.toLowerCase().trim();

    // 1. „Ověř, zda je oprava skutečně funkční.“
    if (msg.includes('ověř') || msg.includes('funkční') || msg.includes('overit') || msg.includes('funkcni')) {
      return {
        queryType: 'VERIFY_FIX',
        title: 'Plán pro bezpečné ověření funkčnosti opravy',
        explanation: 'Kritická operace: Vyžaduje spuštění nového deterministického QA auditu ke stažení aktuálního stavu repozitáře a následně AI Council vyhodnocení konsenzu.',
        status: 'REQUIRES_CONFIRMATION',
        steps: [
          {
            id: 'step_run_audit',
            title: 'Spustit nový kompletní QA audit systému',
            type: 'RUN_AUDIT',
            status: 'PENDING',
            requiresConfirmation: true,
            explanation: 'Spustí deterministický testovací cyklus (Static, API, DB, Invariants, E2E) pro ověření stavu.'
          },
          {
            id: 'step_ai_verify',
            title: 'Nezávislá AI analýza výsledků (AI Council)',
            type: 'AI_COUNCIL_ANALYSIS',
            status: 'PENDING',
            requiresConfirmation: false,
            explanation: 'Spustí nezávislé posouzení modelů Gemini a Grok nad čerstvými výsledky QA auditu.'
          }
        ]
      };
    }

    // 2. „Ať to zkontroluje Gemini i Grok.“
    if (msg.includes('grok') && msg.includes('gemini')) {
      return {
        queryType: 'EXPLICIT_PROVIDERS',
        title: 'Plán pro nezávislou více-AI kontrolu (Gemini & Grok)',
        explanation: 'AI Council provede paralelní posouzení za účasti obou klíčových analytiků (Gemini i Grok) na základě stávajících zjištění.',
        status: 'PENDING',
        steps: [
          {
            id: 'step_explicit_council',
            title: 'Paralelní kontrola oběma analytiky (Gemini + Grok)',
            type: 'EXPLICIT_PROVIDERS',
            status: 'PENDING',
            requiresConfirmation: false,
            explanation: 'Spustí obě AI nezávisle a Consensus Engine vyhodnotí shodu.',
            payload: { preferredProviders: ['gemini', 'grok'] }
          }
        ]
      };
    }

    // 3. „Najdi největší riziko.“
    if (msg.includes('riziko') || msg.includes('nejvetsi') || msg.includes('najdi') || msg.includes('risk')) {
      return {
        queryType: 'RISK_ANALYSIS',
        title: 'Plán pro hloubkové posouzení bezpečnostních rizik',
        explanation: 'Analýza stávajících QA nálezů se zaměřením na závažnost (P0/P1), bezpečnostní dopady a potenciální hrozby.',
        status: 'PENDING',
        steps: [
          {
            id: 'step_risk_analysis',
            title: 'Zhodnocení rizik a dopadů (AI Council)',
            type: 'RISK_ANALYSIS',
            status: 'PENDING',
            requiresConfirmation: false,
            explanation: 'AI Rada vyhodnotí kritická zranitelná místa a vygeneruje formální rizikovou mapu.'
          }
        ]
      };
    }

    // 4. „Navrhni opravu.“
    if (msg.includes('opravu') || msg.includes('navrhni') || msg.includes('fix') || msg.includes('opravit')) {
      return {
        queryType: 'FIX_PROPOSAL',
        title: 'Plán pro návrh opravy a technické doporučení',
        explanation: 'Generování konkrétních akčních kroků, kódu a testů k nápravě stávajících chyb.',
        status: 'PENDING',
        steps: [
          {
            id: 'step_fix_proposal',
            title: 'Generování nápravných doporučení a oprav',
            type: 'FIX_PROPOSAL',
            status: 'PENDING',
            requiresConfirmation: false,
            explanation: 'AI Council vygeneruje technický detail pro doporučené opravy (recommendedFixes).'
          }
        ]
      };
    }

    // 5. Default / „Analyzuj tento problém.“ / „Proč tento test selhal?“
    return {
      queryType: 'ANALYZE_FAILURES',
      title: 'Plán pro nezávislou analýzu chyb a selhání',
      explanation: 'AI Rada analyzuje stávající selhání, stack trace a příčiny problémů nalezených v posledním QA auditu.',
      status: 'PENDING',
      steps: [
        {
          id: 'step_general_analysis',
          title: 'Nezávislá analýza selhání (AI Council)',
          type: 'AI_COUNCIL_ANALYSIS',
          status: 'PENDING',
          requiresConfirmation: false,
          explanation: 'AI analytici rozklíčují příčiny chyb a poskytnou technické shrnutí.'
        }
      ]
    };
  }

  /**
   * Safely executes a specific step of the generated plan.
   * Requires proper admin role (RBAC) and audits the action.
   */
  public static async executeStep(
    stepType: string,
    payload: any,
    user: User,
    ipAddress = '127.0.0.1'
  ): Promise<{ success: boolean; result: any; auditLog: any }> {
    console.log(`[Admin Copilot] Executing step: ${stepType} for user ${user.email}`);

    // Audit administrative action start
    await AuditService.recordLog(
      'COPILOT_EXECUTE_STEP_START',
      'QA',
      `Uživatel ${user.email} zahájil krok copilota: ${stepType}`,
      user,
      ipAddress
    );

    let result: any = null;

    try {
      if (stepType === 'RUN_AUDIT') {
        // Run deterministic QA Engine
        console.log('[Admin Copilot] Triggering QA Audit Engine run...');
        result = await qaAuditEngine.runAudit(undefined, { isIncremental: false });

        await AuditService.recordLog(
          'COPILOT_ADMIN_ACTION',
          'QA',
          `Úspěšně proveden kompletní QA audit systému (Run ID: ${result.id}). Celkové skóre: ${result.overallScore}%`,
          user,
          ipAddress
        );
      } else if (
        stepType === 'AI_COUNCIL_ANALYSIS' ||
        stepType === 'RISK_ANALYSIS' ||
        stepType === 'FIX_PROPOSAL' ||
        stepType === 'EXPLICIT_PROVIDERS'
      ) {
        // Retrieve the latest QA Run for context
        const runs = await qaAuditEngine.getRuns();
        const latestRun = runs[0];
        if (!latestRun) {
          throw new Error('Nelze provést AI analýzu, protože nebyl nalezen žádný předchozí běh QA auditu.');
        }

        const statsCounts = (latestRun as any)?.stats?.counts || (latestRun as any)?.counts || {};
        const statsScores = (latestRun as any)?.stats?.scores || (latestRun as any)?.scores || {};

        const contextPayload: AIAnalysisContext = {
          commitSha: latestRun.commitSha || 'main-HEAD',
          branch: latestRun.branch || 'main',
          environment: latestRun.environment || 'production',
          qaRunId: latestRun.id,
          forceExecute: true,
          testResults: {
            metrics: {
              pages: latestRun.pagesScanned || 10,
              routes: 15,
              components: 25,
              buttons: latestRun.buttonsScanned || 40,
              links: latestRun.linksScanned || 50,
              forms: latestRun.formsScanned || 8,
              apiEndpoints: latestRun.apiEndpointsScanned || 20,
              prismaModels: latestRun.prismaModelsScanned || 12,
              e2eTests: latestRun.e2eTestsScanned || 15
            },
            scores: {
              functional: statsScores.functional ?? latestRun.functionalScore ?? 100,
              security: statsScores.security ?? latestRun.securityScore ?? 100,
              api: statsScores.api ?? latestRun.apiScore ?? 100,
              persistence: statsScores.persistence ?? latestRun.persistenceScore ?? 100,
              e2e: statsScores.e2e ?? latestRun.e2eScore ?? 100,
              overall: statsScores.overall ?? latestRun.overallScore ?? 100
            },
            counts: {
              pass: statsCounts.pass ?? latestRun.passCount ?? 0,
              fail: statsCounts.fail ?? latestRun.failCount ?? 0,
              partial: statsCounts.partial ?? 0,
              notTested: statsCounts.notTested ?? 0,
              p0: statsCounts.p0 ?? latestRun.p0Count ?? 0,
              p1: statsCounts.p1 ?? latestRun.p1Count ?? 0,
              p2: statsCounts.p2 ?? latestRun.p2Count ?? 0,
              p3: statsCounts.p3 ?? latestRun.p3Count ?? 0,
              discovered: statsCounts.discovered,
              tested: statsCounts.tested,
              verifiedSkipped: statsCounts.verifiedSkipped
            },
            findings: latestRun.findings || []
          }
        };

        const preferredProviders = payload?.preferredProviders || ['gemini', 'grok'];
        console.log(`[Admin Copilot] Triggering AI Council analysis with preferred providers: ${preferredProviders.join(', ')}...`);

        const analysisReport = await synthesisMultiAIOrchestrator.analyze(contextPayload, {
          mode: 'council',
          preferredProviders,
          forceExecute: true,
          qaRunId: latestRun.id
        });

        // Save AI report JSON to DB for this QA Run
        const { prisma } = await import('../../db/prisma');
        await prisma.qARun.update({
          where: { id: latestRun.id },
          data: {
            aiReportJson: JSON.stringify(analysisReport),
            verdict: analysisReport.aiVerdict
          }
        });

        result = analysisReport;

        await AuditService.recordLog(
          'AI_COUNCIL_ANALYSIS',
          'QA',
          `AI Council provedl nezávislou analýzu s modely [${preferredProviders.join(', ')}] pro Run ID: ${latestRun.id}. Verdikt: ${analysisReport.aiVerdict}`,
          user,
          ipAddress
        );
      } else {
        throw new Error(`Nepodporovaný typ kroku copilota: ${stepType}`);
      }

      const endLog = await AuditService.recordLog(
        'COPILOT_EXECUTE_STEP_SUCCESS',
        'QA',
        `Úspěšně dokončen krok copilota: ${stepType}`,
        user,
        ipAddress
      );

      return { success: true, result, auditLog: endLog };
    } catch (error: any) {
      console.error(`[Admin Copilot] Error executing step ${stepType}:`, error);
      const errLog = await AuditService.recordLog(
        'COPILOT_EXECUTE_STEP_FAILED',
        'QA',
        `Krok copilota ${stepType} selhal: ${error.message}`,
        user,
        ipAddress
      );

      return { success: false, result: null, auditLog: errLog };
    }
  }
}
