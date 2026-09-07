import crypto from 'crypto';
import { User, UserRole } from '../../types';
import { ControlPlaneCapability } from '../../types/controlPlane';
import {
  ControlPlaneAuthorization,
  ORION_BASE_CAPABILITIES
} from '../controlPlaneAuthorization';
import { ControlPlaneService } from '../controlPlaneService';
import { aiPolicyEngine } from '../ai/aiPolicyEngine';
import { AuditService } from '../auditService';
import { OrionService } from '../audit/orionService';
import { AiService } from '../AiService';
import { sanitizeText } from '../qa/ai/sanitizer';
import { OrionPermissionResolver } from './orionPermissionResolver';
import {
  OrionContext,
  OrionIntent,
  OrionProposedAction,
  OrionQueryRequest,
  OrionQueryResponse
} from './orionTypes';

export const VALID_CONTROL_PLANE_CAPABILITIES: readonly ControlPlaneCapability[] = [
  'content.read',
  'content.write',
  'cms.write',
  'settings.read',
  'settings.write',
  'users.read',
  'users.write',
  'qa.run',
  'audit.run',
  'github.read',
  'github.branch.create',
  'github.commit',
  'github.push.feature',
  'github.pr.create',
  'database.read',
  'database.migrate',
  'vps.read',
  'vps.write',
  'deploy.production',
  'security.policy.write',
  'project.manage',
  'moderation.read',
  'moderation.write'
];

export class OrionControlPlane {
  /**
   * Classifies the operational and contextual intent of the user query.
   * CRITICAL SECURITY PRINCIPLE:
   * Intent classification NEVER acts as a security or authorization boundary.
   * Intent only determines the appropriate conversational/task workflow.
   * Permissions and capabilities are ALWAYS strictly evaluated server-side via RBAC & ControlPlaneAuthorization.
   */
  public static classifyIntent(
    message: string,
    currentRoute: string = '/',
    requestedCapability?: string
  ): OrionIntent {
    const lower = message.toLowerCase().trim();

    // 1. Operational / System Action intent
    const operationalKeywords = [
      'restart', 'restartuj', 'restartovat', 'reboot', 'vypni', 'zastav službu',
      'migrace', 'migruj', 'deploy', 'deploynout', 'nasaď', 'drop databáze',
      'smazat cache', 'vyčistit cache', 'uprav konfiguraci', 'změň nastavení',
      'přidej uživatele', 'smazat uživatele', 'vps exec', 'vps reboot'
    ];
    if (
      requestedCapability === 'vps.write' ||
      requestedCapability === 'deploy.production' ||
      requestedCapability === 'database.migrate' ||
      requestedCapability === 'settings.write' ||
      operationalKeywords.some((kw) => lower.includes(kw))
    ) {
      return 'operational';
    }

    // 2. Audit intent
    const auditKeywords = [
      'audit', 'auditu', 'auditní', 'auditovat', 'prověřit systém',
      'bezpečnostní prověrka', 'kontrola zranitelností', 'audit findings', 'spusť audit', 'proveď audit'
    ];
    if (
      requestedCapability === 'audit.run' ||
      requestedCapability === 'qa.run' ||
      auditKeywords.some((kw) => lower.includes(kw))
    ) {
      return 'audit';
    }

    // 3. Conversational intent (chit-chat, greeting, casual talk)
    const conversationalKeywords = [
      'pokec', 'pokecat', 'popovídat', 'chci si jen pokecat', 'jen tak pokecat',
      'ahoj', 'čau', 'cau', 'dobrý den', 'dobry den', 'zdravím', 'jak se máš', 'jak je',
      'kdo jsi', 'co děláš', 'děkuji', 'dík', 'díky', 'vtip', 'pověz mi vtip',
      'jak se jmenuješ', 'ahoj orione', 'čau orione'
    ];
    if (
      conversationalKeywords.some((kw) => lower.includes(kw)) ||
      lower === 'ahoj' ||
      lower === 'čau' ||
      lower === 'cau' ||
      lower === 'dobry den' ||
      lower === 'dobrý den'
    ) {
      return 'conversational';
    }

    // 4. Content generation intent
    const contentKeywords = [
      'napiš', 'sepiš', 'vytvoř text', 'navrhni text', 'předloha', 'vzor textu',
      'osnova', 'dopis pro', 'vygeneruj dopis', 'sestav zprávu', 'předlohu podání'
    ];
    if (contentKeywords.some((kw) => lower.includes(kw))) {
      return 'content_generation';
    }

    // 5. Analytical intent
    const analyticalKeywords = [
      'analyzuj', 'analýza', 'vyhodnoť', 'zhodnoť', 'statistika', 'statistiky',
      'porovnej', 'srovnej data', 'analýza dat'
    ];
    if (analyticalKeywords.some((kw) => lower.includes(kw))) {
      return 'analytical';
    }

    // 6. Guidance intent (portal navigation & procedural/legal guidance)
    const guidanceKeywords = [
      'kde najdu', 'jak se dostat', 'kde je', 'formulář', 'návod', 'průvodce',
      'střídavá péče', 'výživné', 'kalkulačka', 'biff', 'soud', 'návrh na',
      'rozsudek', 'předběžné opatření', 'ospod', 'nález soudu', 'judikatur'
    ];
    if (guidanceKeywords.some((kw) => lower.includes(kw))) {
      return 'guidance';
    }

    // 7. Informational intent (technology, architecture, general knowledge explanations)
    return 'informational';
  }
  /**
   * Resolves current Orion context based strictly on authenticated user and current route.
   */
  public static resolveContext(
    user: User | undefined,
    currentRoute: string = '/',
    pageContext?: Record<string, any>,
    existingCorrelationId?: string
  ): OrionContext {
    const correlationId =
      existingCorrelationId ||
      `orion-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    const resolvedPermissions = OrionPermissionResolver.resolveEffectivePermissions(user);
    const userRole: UserRole | 'ANONYMOUS' = resolvedPermissions.userRole;
    const effectiveCapabilities: ControlPlaneCapability[] = resolvedPermissions.orionEffectiveCapabilities;

    return {
      user,
      userRole,
      effectiveCapabilities,
      currentRoute,
      pageContext,
      correlationId
    };
  }

  /**
   * Main entrypoint for processing any Orion query across the portal.
   * Enforces:
   * 1. Identity & Zero-Trust Check
   * 2. Capability verification (existing ControlPlaneAuthorization)
   * 3. AI Policy Engine validation
   * 4. Intent analysis (mutation / destructive checks)
   * 5. Audit & Process Tracing
   */
  public static async processQuery(
    context: OrionContext,
    request: OrionQueryRequest,
    ipAddress: string = '127.0.0.1'
  ): Promise<OrionQueryResponse> {
    const correlationId =
      request.correlationId ||
      context.correlationId ||
      `orion-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    const { user, currentRoute, pageContext } = context;
    const sanitizedMessage = sanitizeText(request.message || '').trim();

    // Classify intent for workflow routing (never as an authorization boundary)
    const intent = this.classifyIntent(
      sanitizedMessage,
      currentRoute,
      request.requestedCapability
    );

    // Determine scope
    let scope: 'PUBLIC' | 'AUTHENTICATED' | 'ELEVATED' = 'PUBLIC';
    if (user) {
      scope =
        user.role === 'SUPER_ADMIN' || user.role === 'ADMIN'
          ? 'ELEVATED'
          : 'AUTHENTICATED';
    }

    // 0. CAPABILITY DISCOVERY ("Orione, s čím mi můžeš pomoct?")
    const lowerMsg = sanitizedMessage.toLowerCase();
    const isDiscoveryQuery =
      lowerMsg.includes('s čím mi můžeš pomoct') ||
      lowerMsg.includes('s čím pomůžeš') ||
      lowerMsg.includes('co umíš') ||
      lowerMsg.includes('co všechno umíš') ||
      lowerMsg.includes('jaké mám oprávnění') ||
      lowerMsg.includes('jaké máš schopnosti') ||
      lowerMsg.includes('moje oprávnění') ||
      lowerMsg.includes('moje schopnosti') ||
      lowerMsg.includes('jaké jsou tvoje schopnosti') ||
      lowerMsg.includes('co pro mě můžeš udělat') ||
      lowerMsg.includes('jaké mám možnosti');

    if (isDiscoveryQuery && !request.requestedCapability) {
      const resolved = OrionPermissionResolver.resolveEffectivePermissions(user, { ipAddress, route: currentRoute });
      const discoveryText = OrionPermissionResolver.generateCapabilityDiscoveryResponse(resolved);

      await AuditService.recordLog(
        'ORION_CAPABILITY_DISCOVERY',
        'ORION_CONTROL_PLANE',
        `Orion Capability Discovery vyžádána uživatelem ${user ? user.email : 'ANONYMOUS'} (${resolved.userRole})`,
        user,
        ipAddress
      );

      return {
        correlationId,
        timestamp: new Date().toISOString(),
        decision: 'AI_RECOMMENDATION',
        trustLevel: 'AI_RECOMMENDATION',
        message: discoveryText,
        effectiveCapabilities: resolved.orionEffectiveCapabilities,
        intent,
        scope
      };
    }

    // 1. CAPABILITY VALIDATION & RECOGNITION (FAIL-CLOSED)
    if (request.requestedCapability) {
      // Is it a recognized Control Plane Capability?
      if (!VALID_CONTROL_PLANE_CAPABILITIES.includes(request.requestedCapability)) {
        return {
          correlationId,
          timestamp: new Date().toISOString(),
          decision: 'DENY',
          trustLevel: 'DENY',
          message: `ZAMÍTNUTO (FAIL CLOSED): Neznámá capability '${request.requestedCapability}'.`,
          effectiveCapabilities: context.effectiveCapabilities,
          error: `Unknown capability: ${request.requestedCapability}`,
          intent,
          scope
        };
      }

      // If unauthenticated user requests a protected capability -> FAIL CLOSED
      if (!user) {
        return {
          correlationId,
          timestamp: new Date().toISOString(),
          decision: 'DENY',
          trustLevel: 'DENY',
          message:
            'ZAMÍTNUTO (FAIL CLOSED): Neautentizovaný uživatel nemá přístup k žádným chráněným capabilities.',
          effectiveCapabilities: [],
          error: 'Unauthenticated protected capability request denied',
          intent,
          scope: 'PUBLIC'
        };
      }

      // Check whether authenticated user has this capability in effective intersection
      try {
        ControlPlaneAuthorization.authorizeOrionCapability(
          user,
          request.requestedCapability
        );
      } catch (authErr: any) {
        return {
          correlationId,
          timestamp: new Date().toISOString(),
          decision: 'DENY',
          trustLevel: 'DENY',
          message: `ZAMÍTNUTO (FAIL CLOSED): ${authErr.message || 'Nedostatečná oprávnění.'}`,
          effectiveCapabilities: context.effectiveCapabilities,
          error: authErr.message,
          intent,
          scope
        };
      }
    }

    // 2. UNAUTHENTICATED / PUBLIC GUEST ACCESS CONTROL
    if (!user) {
      const lower = sanitizedMessage.toLowerCase();
      const attemptsPrivilegeEscalation =
        lower.includes('heslo') ||
        lower.includes('databáz') ||
        lower.includes('secret') ||
        lower.includes('token') ||
        lower.includes('uživatel') ||
        lower.includes('admin') ||
        lower.includes('vps') ||
        lower.includes('spis') ||
        lower.includes('case');

      if (
        attemptsPrivilegeEscalation &&
        !lower.includes('jak se přihlásit') &&
        !lower.includes('registrovat')
      ) {
        return {
          correlationId,
          timestamp: new Date().toISOString(),
          decision: 'DENY',
          trustLevel: 'DENY',
          message:
            'ZAMÍTNUTO: Anonymní návštěvník nemá oprávnění k interním systémovým datům, správě uživatelů ani k privátním spisům. Pro přístup k těmto funkcím se prosím přihlaste svým účtem.',
          effectiveCapabilities: [],
          error: 'Unauthorized access to protected scope by unauthenticated user',
          intent,
          scope: 'PUBLIC'
        };
      }

      // Operational actions by anonymous -> FAIL CLOSED DENY
      if (intent === 'operational') {
        return {
          correlationId,
          timestamp: new Date().toISOString(),
          decision: 'DENY',
          trustLevel: 'DENY',
          message:
            'ZAMÍTNUTO: Systémové a operativní akce vyžadují ověřenou identitu a administrátorskou roli.',
          effectiveCapabilities: [],
          error: 'Unauthorized operational capability for unauthenticated user',
          intent,
          scope: 'PUBLIC'
        };
      }

      // Audit requests by anonymous -> FAIL CLOSED DENY
      if (intent === 'audit') {
        return {
          correlationId,
          timestamp: new Date().toISOString(),
          decision: 'DENY',
          trustLevel: 'DENY',
          message:
            'ZAMÍTNUTO: Anonymní návštěvník nemá oprávnění ke spouštění auditů.',
          effectiveCapabilities: [],
          error: 'Unauthorized audit capability for unauthenticated user',
          intent,
          scope: 'PUBLIC'
        };
      }

      // Universal Public Assistant Response
      const publicResponse = await this.generateUniversalPublicResponse(
        sanitizedMessage,
        currentRoute,
        intent
      );

      return {
        correlationId,
        timestamp: new Date().toISOString(),
        decision: 'AI_RECOMMENDATION',
        trustLevel: 'AI_RECOMMENDATION',
        message: publicResponse,
        effectiveCapabilities: [],
        intent,
        scope: 'PUBLIC'
      };
    }

    // 3. AI POLICY ENGINE VERIFICATION
    const globalPolicy = aiPolicyEngine.getGlobalPolicy();

    // If toolsPolicy is strictly DENY, block any tool/capability invocation
    if (request.requestedCapability && globalPolicy.toolsPolicy === 'DENY') {
      await AuditService.recordLog(
        'ORION_POLICY_VIOLATION',
        'AI_POLICY_ENGINE',
        `Policy Engine (toolsPolicy=DENY) zamítl capability '${request.requestedCapability}' pro uživatele ${user.email} (CorrelationId: ${correlationId})`,
        user,
        ipAddress
      );

      return {
        correlationId,
        timestamp: new Date().toISOString(),
        decision: 'DENY',
        trustLevel: 'DENY',
        message: `ZAMÍTNUTO POLICY ENGINEM: Použití systémových nástrojů je globálně zakázáno (toolsPolicy=DENY).`,
        effectiveCapabilities: context.effectiveCapabilities,
        error: 'Policy Engine denied capability: toolsPolicy=DENY',
        intent,
        scope
      };
    }

    // Check if capability is explicitly blocked or restricted in policy
    const policyBlocked = (globalPolicy as any).blockedCapabilities as string[] | undefined;
    const policyRestricted = (globalPolicy as any).allowedControlPlaneCapabilities as string[] | undefined;

    if (
      request.requestedCapability &&
      ((policyBlocked && policyBlocked.includes(request.requestedCapability)) ||
       (policyRestricted && !policyRestricted.includes(request.requestedCapability)))
    ) {
      await AuditService.recordLog(
        'ORION_POLICY_VIOLATION',
        'AI_POLICY_ENGINE',
        `Policy Engine zamítl capability '${request.requestedCapability}' pro uživatele ${user.email} (CorrelationId: ${correlationId})`,
        user,
        ipAddress
      );

      return {
        correlationId,
        timestamp: new Date().toISOString(),
        decision: 'DENY',
        trustLevel: 'DENY',
        message: `ZAMÍTNUTO POLICY ENGINEM: Capability '${request.requestedCapability}' je blokována bezpečnostní konfigurací AI Policy Engine.`,
        effectiveCapabilities: context.effectiveCapabilities,
        error: 'Policy Engine denied capability',
        intent,
        scope
      };
    }

    // 4. OPERATIONAL / MUTATION INTENT & AUTHORIZATION ENFORCEMENT
    if (intent === 'operational') {
      const userCaps = ControlPlaneAuthorization.getUserCapabilities(user);
      const hasOperationalCapability =
        userCaps.includes('vps.write') ||
        userCaps.includes('deploy.production') ||
        userCaps.includes('database.migrate') ||
        userCaps.includes('settings.write') ||
        user.role === 'ADMIN' ||
        user.role === 'SUPER_ADMIN';

      if (!hasOperationalCapability) {
        return {
          correlationId,
          timestamp: new Date().toISOString(),
          decision: 'DENY',
          trustLevel: 'DENY',
          message: `ZAMÍTNUTO (FAIL CLOSED): Uživatel s rolí ${user.role} nemá oprávnění k provádění systémových či operativních akcí (vyžaduje roli ADMIN nebo SUPER_ADMIN).`,
          effectiveCapabilities: context.effectiveCapabilities,
          error: `Unauthorized operational action for role ${user.role}`,
          intent,
          scope
        };
      }
    }

    // SUPER_ADMIN also cannot perform destructive operations automatically without Human Approval
    const intentAnalysis = ControlPlaneService.analyzeIntent(sanitizedMessage);
    const isDestructive =
      intent === 'operational' ||
      intentAnalysis.willMutate ||
      intentAnalysis.riskLevel === 'CRITICAL' ||
      intentAnalysis.riskLevel === 'HIGH' ||
      intentAnalysis.riskLevel === 'P0' ||
      intentAnalysis.riskLevel === 'P1';

    if (isDestructive) {
      const proposedAction: OrionProposedAction = {
        title: `Návrh systémové akce (${intentAnalysis.riskLevel}): ${sanitizedMessage.slice(0, 50)}...`,
        intent: sanitizedMessage,
        targetResource: intentAnalysis.affectedResources[0] || 'system:core',
        riskLevel: intentAnalysis.riskLevel,
        requiresHumanApproval: true
      };

      await AuditService.recordLog(
        'ORION_HUMAN_APPROVAL_PROPOSED',
        'ORION_GLOBAL',
        `Orion navrhl citlivou akci vyžadující lidské schválení: ${sanitizedMessage.slice(0, 100)} (Riziko: ${intentAnalysis.riskLevel}, CorrelationId: ${correlationId})`,
        user,
        ipAddress
      );

      return {
        correlationId,
        timestamp: new Date().toISOString(),
        decision: 'HUMAN_APPROVAL_REQUIRED',
        trustLevel: 'AI_RECOMMENDATION',
        message: `DETEKOVÁNA POTENCIÁLNĚ DESTRUKTIVNÍ / MUTUJÍCÍ OPERACE (Riziko: ${intentAnalysis.riskLevel}). Orion má výhradně doporučující roli (AI_RECOMMENDATION) a nesmí tuto akci sám provést. Operace byla zařazena mezi navržené akce a vyžaduje explicitní schválení oprávněným administrátorem (Human-in-the-loop).`,
        effectiveCapabilities: context.effectiveCapabilities,
        proposedActions: [proposedAction],
        requiresHumanApproval: true,
        intent,
        scope
      };
    }

    // 5. AUDIT INTENT HANDLING
    let traceId: string | undefined;

    if (
      intent === 'audit' ||
      request.requestedCapability === 'audit.run' ||
      (sanitizedMessage.toLowerCase().includes('audit') &&
        context.effectiveCapabilities.includes('audit.run'))
    ) {
      if (!context.effectiveCapabilities.includes('audit.run')) {
        return {
          correlationId,
          timestamp: new Date().toISOString(),
          decision: 'DENY',
          trustLevel: 'DENY',
          message: `ZAMÍTNUTO (FAIL CLOSED): Uživatel s rolí ${user.role} nemá efektivní capability 'audit.run' pro provedení auditu.`,
          effectiveCapabilities: context.effectiveCapabilities,
          error: `Uživatel s rolí ${user.role} nemá efektivní capability 'audit.run'.`,
          intent,
          scope
        };
      }

      try {
        const auditResponse = await OrionService.analyze(
          user,
          { userQuery: sanitizedMessage, scope: 'REGISTRY' },
          undefined,
          ipAddress
        );

        traceId = (auditResponse as any).traceId;

        const proposedActions: OrionProposedAction[] = (
          auditResponse.suggestedDraftActions || []
        ).map((act) => ({
          title: act.title,
          intent: act.intent,
          targetResource: act.targetResource,
          riskLevel: act.riskLevel,
          requiresHumanApproval: true
        }));

        return {
          correlationId,
          timestamp: new Date().toISOString(),
          decision: 'AI_RECOMMENDATION',
          trustLevel: 'AI_RECOMMENDATION',
          message: auditResponse.summary,
          effectiveCapabilities: context.effectiveCapabilities,
          proposedActions,
          requiresHumanApproval: proposedActions.length > 0,
          traceId,
          intent,
          scope
        };
      } catch (err: any) {
        return {
          correlationId,
          timestamp: new Date().toISOString(),
          decision: 'DENY',
          trustLevel: 'DENY',
          message: `Chyba při provádění auditní analýzy: ${err?.message || 'Neznámá chyba'}`,
          effectiveCapabilities: context.effectiveCapabilities,
          error: err?.message,
          intent,
          scope
        };
      }
    }

    // 6. GENERAL UNIVERSAL CONTEXTUAL QUERY
    const assistantMessage = await this.generateUniversalContextualResponse(
      user,
      sanitizedMessage,
      currentRoute,
      pageContext,
      context.effectiveCapabilities,
      intent
    );

    await AuditService.recordLog(
      'ORION_QUERY_PROCESSED',
      'ORION_GLOBAL',
      `Orion zodpověděl dotaz pro uživatele ${user.email} (Role: ${user.role}, Cesta: ${currentRoute}, Intent: ${intent}, CorrelationId: ${correlationId})`,
      user,
      ipAddress
    );

    return {
      correlationId,
      timestamp: new Date().toISOString(),
      decision: request.requestedCapability ? 'ALLOW' : 'AI_RECOMMENDATION',
      trustLevel: 'AI_RECOMMENDATION',
      message: assistantMessage,
      effectiveCapabilities: context.effectiveCapabilities,
      intent,
      scope
    };
  }

  /**
   * Generates public, safe responses for unauthenticated visitors.
   * Differentiates conversational, guidance, informational, and other intents.
   */
  private static async generateUniversalPublicResponse(
    message: string,
    route: string,
    intent: OrionIntent
  ): Promise<string> {
    const deterministic = this.getDeterministicResponse(undefined, message, route, intent);

    // Exact portal guidance and calculator queries return authoritative deterministic guidance
    if (intent === 'guidance') {
      return deterministic;
    }

    // If running in live environment with AI provider configured, use generative AI
    if (process.env.NODE_ENV !== 'test' && (process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY || process.env.XAI_API_KEY)) {
      try {
        const systemInstruction = `Jsi ORION, všestranný globální asistenční pomocník ekosystému Synthesis / Táta má právo.
Uživatel je anonymní návštěvník.
Aktivní sekce/cesta: ${route}
Detekovaný záměr: ${intent}

ZÁSADY CHOVÁNÍ:
1. POKEC / NEFORMÁLNÍ KONVERZACE: Pokud si uživatel chce jen popovídat nebo zdraví (např. "Chci si jen pokecat."), reaguj přátelsky, neformálně a otevřeně (např. "Jasně 🙂 Klidně. O čem chceš pokecat?"). V ŽÁDNÉM PŘÍPADĚ mu nevnucuj právní kalkulačky ani průvodce!
2. OBECNÉ A TECHNICKÉ OTÁZKY: Odpovídej věcně a srozumitelně k jakýmkoliv tématům (Docker, technologie, obecné znalosti).
3. PORTÁLOVÁ A PRÁVNÍ ORIENTACE: Pomoz najít formuláře na portálu Táta má právo nebo vysvětli právní pojmy s disclaimerem, že jde o procesní orientaci, nikoli právní zastoupení.
4. BEZPEČNOST: Nikdy neprozrazuj interní systémová data.`;

        const prompt = `Uživatel píše: "${message}"`;
        const aiReply = await AiService.generateContent(prompt, {
          systemInstruction,
          temperature: 0.3,
          timeoutMs: 8000
        });

        if (aiReply && aiReply.trim().length > 0) {
          return sanitizeText(aiReply.trim());
        }
      } catch {
        // Fallback to high-quality deterministic response
      }
    }

    return deterministic;
  }

  /**
   * Generates contextual responses for authenticated users.
   */
  private static async generateUniversalContextualResponse(
    user: User,
    message: string,
    route: string,
    pageContext: Record<string, any> | undefined,
    capabilities: ControlPlaneCapability[],
    intent: OrionIntent
  ): Promise<string> {
    try {
      const systemInstruction = `Jsi ORION, všestranný globální asistenční a bezpečnostní pomocník ekosystému Synthesis / Táta má právo.
Uživatel: ${user.name || user.email} (Role: ${user.role})
Aktivní sekce/cesta: ${route}
Detekovaný záměr: ${intent}
Efektivní capabilities: ${capabilities.join(', ')}

ZÁSADY CHOVÁNÍ:
1. BĚŽNÝ POKEC / NEFORMÁLNÍ ROZHOVOR: Pokud uživatel zdraví nebo si chce jen tak pokecat (např. "Chci si jen pokecat."), buď přirozený, neformální, lidský a přátelský (např. "Jasně 🙂 Klidně. O čem chceš pokecat?"). Nevnucuj mu právní průvodce ani kalkulačky!
2. OBECNÉ A TECHNICKÉ OTÁZKY: Odpovídej věcně a odborně na jakákoliv témata (Docker, architektura, technologie).
3. PORTÁL A PRÁVNÍ ORIENTACE: Pomoz s navigací v portálu Táta má právo nebo vysvětli právní pojmy s odpovídajícím disclaimerem.
4. TVORBA TEXTŮ: Pomoz formulovat věcné, kultivované zprávy (metodika BIFF) a osnovy podání.
5. BEZPEČNOST: Nikdy neprozrazuj interní hesla ani privátní data jiných uživatelů.`;

      const prompt = `Uživatel píše: "${message}"\nKontext stránky: ${JSON.stringify(pageContext || {})}`;
      const response = await AiService.generateContent(prompt, {
        systemInstruction,
        temperature: 0.2,
        timeoutMs: 15000
      });

      if (response && response.trim().length > 0) {
        return sanitizeText(response.trim());
      }
    } catch {
      // Fallback if LLM is unavailable
    }

    return this.getDeterministicResponse(user, message, route, intent);
  }

  /**
   * Universal deterministic fallback matrix ensuring reliable, high-grade responses
   * across all intents even if external LLM providers are unreachable.
   */
  public static getDeterministicResponse(
    user: User | undefined,
    message: string,
    route: string,
    intent: OrionIntent
  ): string {
    const lower = message.toLowerCase();

    // 1. Conversational intent (No rigid legal templates!)
    if (intent === 'conversational') {
      if (lower.includes('pokec') || lower.includes('popovídat')) {
        return 'Jasně 🙂 Klidně. O čem chceš pokecat? Můžeme probrat běžná témata, technologie nebo fungování portálu Táta má právo.';
      }
      return 'Ahoj! Jsem Orion, všestranný pomocník pro celý ekosystém Synthesis / Táta má právo. O čem bys rád mluvil?';
    }

    // 2. Informational intent (general knowledge, technology, explanations)
    if (intent === 'informational') {
      if (lower.includes('docker')) {
        return 'Docker je kontejnerizační platforma, která umožňuje balit aplikace a jejich závislosti do izolovaných kontejnerů. Zajišťuje stejné a předvídatelné chování aplikace v lokálním vývoji i na produkčním serveru.';
      }
      return 'Jako univerzální asistent Orion vám rád vysvětlím jakékoliv technické, obecné nebo procesní téma. Zadejte prosím podrobnosti k vaší otázce.';
    }

    // 3. Guidance intent (portal navigation and procedural/legal guidance)
    if (intent === 'guidance') {
      if (lower.includes('kalkulačk') || lower.includes('výživn') || route.includes('kalkulacka')) {
        return 'Kalkulačka výživného na portálu Táta má právo počítá doporučenou výši výživného podle aktuální metodiky Ministerstva spravedlnosti ČR na základě věkových pásem dítěte, počtu vyživovacích povinností a čistého příjmu.';
      }
      if (lower.includes('ospod') || lower.includes('formulář') || lower.includes('kde najdu')) {
        return 'Vzory podání a formuláře související s OSPOD a soudním řízením naleznete v sekci Vzory podání a Průvodce řízením na portálu Táta má právo. Doporučujeme také prostudovat metodiku věcné komunikace BIFF.';
      }
      if (lower.includes('střídavá péče') || lower.includes('stridava pece')) {
        return 'Střídavá péče znamená, že oba rodiče pečují o dítě ve stanovených časových intervalech (např. po týdnu). Podle ustálené judikatury Ústavního soudu ČR (např. I. ÚS 2482/13) je střídavá péče prioritním modelem, pokud jsou oba rodiče způsobilí dítě vychovávat a mají o něj zájem.\n\n*Upozornění: Tyto informace slouží jako metodická a procesní orientace, nikoliv jako náhrada individuálního právního zastoupení advokátem.*';
      }
      if (lower.includes('biff')) {
        return 'Metoda BIFF (Brief, Informative, Friendly, Firm) slouží ke kultivaci rodičovské komunikace. Pomáhá zbavit zprávy emocí, výčitek a manipulací a soustředit se na fakta.';
      }
      if (lower.includes('judikatur') || lower.includes('nález') || lower.includes('soud')) {
        return 'V sekci Judikatura a Právo naleznete klíčová rozhodnutí Ústavního soudu ČR a Nejvyššího soudu ČR týkající se střídavé péče, styku s dětmi a nejlepšího zájmu dítěte.';
      }
      return `Nacházíte se na stránce "${route}". Mohu vám pomoci s orientací v právních průvodcích, kalkulačkách výživného nebo obecných postupech v opatrovnickém řízení.`;
    }

    // 4. Content generation intent
    if (intent === 'content_generation') {
      return 'Rád vám pomohu s formulací textu nebo podání. Pro komunikaci s druhým rodičem či úřadem se zaměřte na věcnost, stručnost a neutrální tón (zásady BIFF).';
    }

    // 5. Analytical intent
    if (intent === 'analytical') {
      return 'Analýza dat: Provedeno orientační vyhodnocení parametrů aktuální relace.';
    }

    // Default fallback
    if (user && (route.startsWith('/admin') || route.startsWith('/administrace'))) {
      return `Orion (Admin kontext, role ${user.role}): Sledujete administraci (${route}). Pro analýzu auditních zjištění nebo bezpečnostní prověrku zadejte požadavek na audit.`;
    }
    if (user && (route.startsWith('/portal') || route.startsWith('/muj-pripad'))) {
      return `Orion (Uživatelský portál): Vítejte, ${user.name || user.email}. Nacházíte se v klientské sekci (${route}). Můžete pracovat se svým případem, komunikací nebo vygenerovanými dokumenty.`;
    }

    return `Orion: Zaznamenán dotaz na cestě "${route}". Všechny operace podléhají bezpečnostním pravidlům ${user ? `vaší role (${user.role})` : 'veřejného přístupu'}.`;
  }
}
