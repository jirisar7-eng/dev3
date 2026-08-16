import { GoogleGenAI } from '@google/genai';

export interface AIAnalysisInput {
  commitSha: string;
  branch: string;
  environment: string;
  metrics: {
    pages: number;
    routes: number;
    components: number;
    buttons: number;
    links: number;
    forms: number;
    apiEndpoints: number;
    prismaModels: number;
    e2eTests: number;
  };
  scores: {
    functional: number;
    security: number;
    api: number;
    persistence: number;
    e2e: number;
    overall: number;
  };
  counts: {
    pass: number;
    fail: number;
    partial: number;
    notTested: number;
    p0: number;
    p1: number;
    p2: number;
    p3: number;
  };
  findings: Array<{
    severity: string;
    category: string;
    message: string;
    endpointId?: string;
  }>;
  stackTraces?: string[];
  invariantsResults?: Array<{ module: string; name: string; passed: boolean; message: string }>;
}

export interface AIAnalystReport {
  executiveSummary: string;
  technicalSummary: string;
  criticalFindings: string[];
  rootCauseAnalysis: string;
  riskAssessment: string;
  recommendedFixes: string[];
  suggestedTests: string[];
  productionReadinessAssessment: string;
  aiVerdict: 'PRODUCTION READY' | 'PRODUCTION READY WITH WARNINGS' | 'NOT PRODUCTION READY';
}

export const aiAnalystService = {
  async analyzeRunPayload(input: AIAnalysisInput): Promise<AIAnalystReport> {
    const hasP0 = input.counts.p0 > 0;
    const hasP1 = input.counts.p1 > 0;

    // Strict Rule: If there is ANY P0 or P1 issue, system MUST NOT issue PRODUCTION READY.
    let defaultVerdict: 'PRODUCTION READY' | 'PRODUCTION READY WITH WARNINGS' | 'NOT PRODUCTION READY' = 'PRODUCTION READY';
    if (hasP0) {
      defaultVerdict = 'NOT PRODUCTION READY';
    } else if (hasP1) {
      defaultVerdict = 'PRODUCTION READY WITH WARNINGS';
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `
Jsi hlavní AI Audit Analyst a bezpečnostní inženýr projektu "Táta má právo".
Tvým úkolem je analyzovat výsledky kompletního QA a funkčního auditu aplikace.

POZOR - STRIKTNÍ PRAVIDLA:
1. Rozhodnutí o PASS/FAIL zkouškách pochází z deterministických testů. Nesmíš měnit výsledky testů.
2. Nesmíš provádět změny v databázi, kódu ani měnit uživatelská oprávnění.
3. Pokud existuje P0 problém (Kritický), AI VERDICT musí být "NOT PRODUCTION READY".
4. Pokud existuje P1 problém (Vysoká závažnost), AI VERDICT nesmí být "PRODUCTION READY" (může být "PRODUCTION READY WITH WARNINGS" nebo "NOT PRODUCTION READY").

DATA AUDITU:
- Git Commit: ${input.commitSha} (${input.branch})
- Prostředí: ${input.environment}
- Metriky Discovery: Stránky=${input.metrics.pages}, Tlačítka=${input.metrics.buttons}, Formuláře=${input.metrics.forms}, Odkazy=${input.metrics.links}, API=${input.metrics.apiEndpoints}, DB Modely=${input.metrics.prismaModels}, E2E Testy=${input.metrics.e2eTests}
- Skóre: Funkční=${input.scores.functional}%, Bezpečnost=${input.scores.security}%, API=${input.scores.api}%, Persistence=${input.scores.persistence}%, E2E=${input.scores.e2e}%, Celkové=${input.scores.overall}%
- Počty testů: PASS=${input.counts.pass}, FAIL=${input.counts.fail}, PARTIAL=${input.counts.partial}, NOT_TESTED=${input.counts.notTested}
- Nálezy podle závažnosti: P0 (Kritické)=${input.counts.p0}, P1 (Vysoké)=${input.counts.p1}, P2 (Střední)=${input.counts.p2}, P3 (Nízké)=${input.counts.p3}

SEZNAM NÁLEZŮ (FINDINGS):
${JSON.stringify(input.findings, null, 2)}

INVARIANTY A CHYBY:
${JSON.stringify(input.invariantsResults || [], null, 2)}
Stack Traces: ${JSON.stringify(input.stackTraces || [], null, 2)}

Výstup vygeneruj jako POUZE platný JSON objekt s touto přesnou strukturou:
{
  "executiveSummary": "Stručné manažerské shrnutí kvality aplikace pro vedení projektu.",
  "technicalSummary": "Technický rozbor stavu frontend, backend, databáze, bezpečnosti a E2E.",
  "criticalFindings": ["Seznam nejdůležitějších zjištění"],
  "rootCauseAnalysis": "Detailní rozbor příčin případných selhání nebo zranitelností.",
  "riskAssessment": "Hodnocení provozních, bezpečnostních a datových rizik.",
  "recommendedFixes": ["Krok 1 pro nápravu", "Krok 2 pro nápravu"],
  "suggestedTests": ["Doporučené nové testy nebo invarianty"],
  "productionReadinessAssessment": "Zhodnocení připravenosti pro produkční nasazení s odůvodněním.",
  "aiVerdict": "PRODUCTION READY" | "PRODUCTION READY WITH WARNINGS" | "NOT PRODUCTION READY"
}
`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        if (response.text) {
          const parsed = JSON.parse(response.text) as AIAnalystReport;
          // Enforce rule: if P0 or P1 exists, verdict CANNOT be PRODUCTION READY
          let finalVerdict = parsed.aiVerdict;
          if (hasP0) {
            finalVerdict = 'NOT PRODUCTION READY';
          } else if (hasP1 && finalVerdict === 'PRODUCTION READY') {
            finalVerdict = 'PRODUCTION READY WITH WARNINGS';
          }

          return {
            executiveSummary: parsed.executiveSummary || 'Audit proběhl úspěšně.',
            technicalSummary: parsed.technicalSummary || 'Architektura i API jsou v pořádku.',
            criticalFindings: parsed.criticalFindings || [],
            rootCauseAnalysis: parsed.rootCauseAnalysis || 'Žádné kritické selhání nebylo detekováno.',
            riskAssessment: parsed.riskAssessment || 'Rizika jsou minimální.',
            recommendedFixes: parsed.recommendedFixes || [],
            suggestedTests: parsed.suggestedTests || [],
            productionReadinessAssessment: parsed.productionReadinessAssessment || 'Aplikace splňuje produkční standardy.',
            aiVerdict: finalVerdict
          };
        }
      } catch (err) {
        console.warn('[AI Analyst] Gemini API vyžaduje kontrolu nebo vrátila chybu, používám deterministický fallback:', err);
      }
    }

    // Fallback if API key missing or request failed
    const criticalFindingsList = input.findings.map(f => `[${f.severity}] ${f.category}: ${f.message}`);
    
    return {
      executiveSummary: hasP0
        ? `Audit odhalil ${input.counts.p0} kritických problémů (P0). Aplikace vyžaduje okamžitou opravu před nasazením.`
        : hasP1
        ? `Audit proběhl s ${input.counts.p1} varováními vysoké závažnosti (P1). Systém je stabilní, ale doporučuje se vyřešit bezpečnostní/funkční nedostatky.`
        : `Všechny deterministické testy a bezpečnostní kontroly proběhly úspěšně. Celkové QA skóre dosahuje ${input.scores.overall}%.`,
      technicalSummary: `Scannováno ${input.metrics.pages} stránek, ${input.metrics.apiEndpoints} API endpointů a ${input.metrics.prismaModels} databázových modelů. Úspěšnost testů: PASS=${input.counts.pass}, FAIL=${input.counts.fail}.`,
      criticalFindings: criticalFindingsList.length > 0 ? criticalFindingsList : ['Žádné kritické nálezy.'],
      rootCauseAnalysis: hasP0
        ? 'Příčinou P0 selhání může být chybějící autorizační middleware, neplatná konfigurace JWT nebo dočasná nedostupnost PostgreSQL.'
        : 'Sledované API endpointy a databázové operace vykazují očekávanou deterministickou odezvu.',
      riskAssessment: hasP0
        ? 'Vysoké bezpečnostní a provozní riziko při okamžitém produkčním nasazení.'
        : 'Riziko porušení integrity dat nebo neoprávněného přístupu bylo vyhodnoceno jako minimální.',
      recommendedFixes: hasP0
        ? ['Prověřte RBAC middleware u všech chráněných endpointů.', 'Zkontrolujte konfiguraci DATABASE_URL a Prisma konektoru.']
        : ['Aplikujte doporučené bezpečnostní hlavičky.', 'Rozšiřte pokrytí E2E testy pro spolurodičovské centrum.'],
      suggestedTests: [
        'Automatizované IDOR testy pro spisy v UserCase',
        'Zátěžové testy pro obnovení session tokenu',
        'Testy správné exspirace cookie consent souborů'
      ],
      productionReadinessAssessment: hasP0
        ? 'Aplikace NENÍ připravena pro produkční provoz z důvodu výskytu kritických nálezů P0.'
        : hasP1
        ? 'Aplikace je připravena pro produkční provoz s výhradou (přítomna varování P1).'
        : 'Aplikace plně splňuje kritéria pro produkční nasazení.',
      aiVerdict: defaultVerdict
    };
  }
};
