# Audit — Orion Effective Permission Resolver & Dynamic Capability Discovery

- **Datum:** 2026-09-07
- **Projekt:** Táta má právo / Synthesis Hub
- **Větev:** feat/ai-policy-council-integration-20260907
- **Typ:** Architektonický, bezpečnostní a testovací audit server-side resolveru oprávnění
- **Stav:** SCHVÁLENO A OVERENO (ALL 24 TESTS PASSED, LINT & BUILD GREEN)

---

## 1. Účel a Rozsah

Tento audit verifikuje implementaci centrálního server-side resolveru **`OrionPermissionResolver`** pro globálního asistenta Orion v ekosystému Synthesis Hub.

### Hlavní cíle:
1. **Server-Side Authorization Boundary**: Výpočet Effective Permissions probíhá výhradně na serveru z autentizované relace (`authReq.user`). Klientské požadavky v těle těla requestu (`role`, `customRole`, `specialization`, `requestedCapability`, `permissions`) jsou striktně ignorovány a považovány za nedůvěryhodné.
2. **Capability Discovery ("Orione, s čím mi můžeš pomoct?")**: Dynamické generování strukturovaného výpisu dostupných funkcí a schopností (Effective Capabilities) bez vyzrazení nepovolených administrátorských nebo systémových nástrojů.
3. **Přímo zohledněné RBAC prvky**:
   - Primární systémová role (`USER`, `VOLUNTEER`, `VERIFIED_CONTRIBUTOR`, `CONTENT_MANAGER`, `MODERATOR`, `ADMIN`, `SUPER_ADMIN`).
   - Dynamické uživatelské permissions (např. custom role připojené k účtu bez nutnosti restartu serveru).
   - Server-side specializace účtu (`legal_advokat`, `moderation`, `dev_qa`).
   - Stav účtu (`SUSPENDED` / `BANNED` vrací prázdné oprávnění).
   - Filtrace skrze AI Policy Engine (`evaluatePolicy`).

---

## 2. Architektura a Bezpečnostní Záruky

```
[ Client Request ] (Payload body role/specialization IGNORED)
        │
        ▼
[ Server Session / Auth Middleware ] ──► Authentic User Object
        │
        ▼
[ OrionPermissionResolver ]
  ├── 1. Primary Role Capabilities (getUserCapabilities)
  ├── 2. Custom Role & Direct Permissions Mapping (mapPermissionToCapability)
  ├── 3. Server Specialization Evaluation (specializationCapabilities)
  └── 4. AI Policy Engine Filter (evaluatePolicy)
        │
        ▼
[ Effective Capabilities (Intersection) ]
        │
        ├──► Discovery Query ("s čím pomůžeš") ──► Czech Capability Response
        └──► Action Request (processQuery)    ──► Server-side Re-authorization Check
```

### Bezpečnostní principy:
- **Zero-Trust Client Identity**: Nikdy nepřebírá roli ani oprávnění z klientského vstupu.
- **Fail-Closed Default**: Není-li uživatel autentizován nebo chybí-li capability v průniku, vrací se `DENY`.
- **SUPER_ADMIN Constraints**: SUPER_ADMIN sice disponuje širokou množinou capabilities, ale destruktivní akce stále vyžadují `HUMAN_APPROVAL_REQUIRED` a podléhají auditování.
- **Public / Anonymous Safety**: Anonymní návštěvníci získají pouze obecné průvodcovské a konverzační schopnosti.

---

## 3. Výsledky Testování (Vitest Verification)

Všechny unit i integrační testy v `tests/orion-global-control-plane.test.ts` úspěšně prošly:

```text
✓ tests/orion-global-control-plane.test.ts (24 tests)
  ✓ 1. Unauthenticated public request: Returns safe AI_RECOMMENDATION
  ✓ 2. Unauthenticated protected request: Denies capability requests (Fail-Closed)
  ✓ 3. USER allowed capability: Allows recognized base capability (content.read)
  ✓ 4. USER forbidden capability: Denies higher privileged capability (audit.run)
  ✓ 5. EDITOR allowed capability: Allows editor capability (content.write)
  ✓ 6. ADMIN allowed capability: Allows admin audit.run capability within Orion
  ✓ 7. SUPER_ADMIN privileged capability: Identifies destructive mutations (HUMAN_APPROVAL_REQUIRED)
  ✓ 8. Unknown capability: Rejects unmapped capability with DENY
  ✓ 9. Authorization error: Fails closed with DENY
  ✓ 10. Policy Engine DENY: Blocks capability if AI Policy Engine disallows it
  ✓ 11. Privilege escalation DENY: Anonymous visitor asking for internal tokens gets denied
  ✓ 12. CorrelationId propagation: Generates or preserves correlationId
  ✓ 13. CurrentPath propagation: Correctly reflects currentRoute
  ✓ 14. Universal Assistant: Conversational intent does not force legal guide templates
  ✓ 15. Universal Assistant: Technical explanation queries return informational responses
  ✓ 16. Universal Assistant: Legal inquiries classify as guidance with disclaimer
  ✓ 17. Universal Assistant: Operational request from unauthenticated user fails closed
  ✓ 18. Universal Assistant: Operational request from regular user fails closed
  ✓ Resolves anonymous user permissions safely without leaks
  ✓ Resolves authenticated user base capabilities correctly
  ✓ Dynamically evaluates custom role permissions attached on user object
  ✓ Evaluates specializations from authentic server user object only
  ✓ Returns empty capabilities for SUSPENDED or BANNED users
  ✓ Handles Capability Discovery query ("Orione, s čím mi můžeš pomoct?") dynamically
```

---

## 4. Soubory Dotčené Změnou

1. **`src/services/orion/orionPermissionResolver.ts`** (*Nové*):
   - Obsahuje `OrionPermissionResolver` s metodami `resolveEffectivePermissions`, `mapPermissionToCapability` a `generateCapabilityDiscoveryResponse`.
2. **`src/services/orion/orionControlPlane.ts`**:
   - Aktualizován import a napojení `resolveContext` i `processQuery` na serverový resolver.
   - Přidáno automatické odbavování Capability Discovery dotazů.
3. **`src/services/controlPlaneAuthorization.ts`**:
   - Rozšířeno `ORION_BASE_CAPABILITIES` a doplněno mapování pro `legal.read`, `legal.research`, `judikatura.read`, `ai.chat`, `ai.generate`, `users.manage`, `rbac.manage`.
4. **`src/services/ai/aiPolicyEngine.ts`**:
   - Přidána metoda `evaluatePolicy(user, capability)`.
5. **`tests/orion-global-control-plane.test.ts`**:
   - Přidána nová testovací sada pro verifikaci resolveru a Capability Discovery.
6. **`CHANGELOG.md`**:
   - Záznam o přidání `OrionPermissionResolver`.

---

## 5. Definition of Done Checklist

- [x] Zadání a architektonické požadavky vymezeny a dodrženy.
- [x] Zero-Trust klientská izolace garantována.
- [x] Práva z Custom Roles a Specializací dynamicky mapována na serveru.
- [x] Dotaz "S čím mi můžeš pomoct?" vrácen s přehledem schválených schopností podle role.
- [x] BANNED / SUSPENDED účty vracejí prázdnou množinu schopností.
- [x] Spuštěn `npm run lint` (0 chybných hlášení).
- [x] Spuštěn `compile_applet` / `npm run build` (Úspěšně sestaveno).
- [x] Spuštěny testy Vitest (24/24 PASS).
- [x] Vytvořen technický auditní záznam.
