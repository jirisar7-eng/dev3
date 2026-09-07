# TECHNICKÝ BEZPEČNOSTNÍ AUDIT – ORION ACTION CATALOG & AUTHORIZATION BRIDGE

**Command ID:** `CMD-ORION-20260907-002`  
**Datum:** 2026-09-07  
**Předmět:** Orion Action/Capability Catalog & Zero-Trust Authorization Bridge  
**Systém:** Synthesis Hub / Táta má právo – Orion AI Subsystem  
**Autor:** Senior Full-Stack Security & Architecture Auditor  
**Stav:** ✅ DOKONČENO & SCHVÁLENO (`42/42 PASSED`)

---

## 1. PŘEHLED A ARCHITEKTONICKÝ CÍL

Na základě předchozího úkolu `CMD-ORION-20260907-001` (Effective Permission Resolver) byl v úkolu `CMD-ORION-20260907-002` navržen a implementován **jednotný deklarativní Orion Action/Capability Catalog** (`OrionActionCatalog`) spolu se server-side **Authorization Bridge** (`authorizeAndBridgeAction`).

### Klíčové bezpečnostní a architektonické principy:
1. **Catalog NENÍ druhý RBAC systém:**
   - **RBAC (ControlPlaneAuthorization):** Určuje, zda uživatelská identita vůbec drží danou capability.
   - **Policy Engine (aiPolicyEngine):** Určuje, zda je akce přípustná v daném kontextu a konfiguraci prostředí.
   - **Orion Action Catalog:** Poskytuje strukturovaná metadata o riziku, mutačním charakteru, požadavcích na lidské schválení (HITL), auditování a trasování.
   - **Authorization Bridge (`authorizeAndBridgeAction`):** Zabezpečuje server-side re-autorizaci bez jakékoliv důvěry v klientská data.

2. **NULOVÁ DŮVĚRA V KLIENTSKÁ DATA (Zero-Trust):**
   - Všechna rozhodnutí probíhají výhradně server-side z autentizovaného `User` objektu.
   - Žádná možnost spoofingu role (`role`, `customRole`, `specialization`, `capability` v request body).

3. **NULOVÝ BYPASS PRO SUPER_ADMIN:**
   - Uživatelé s rolí `SUPER_ADMIN` mají maximální dostupný permission set, ale podléhají plné kontrole:
     - Policy Engine evaluation
     - Audit logging (`AuditService.recordLog`)
     - Process tracing (`OrionTraceStore`)
     - Human-in-the-Loop schvalování (`HUMAN_APPROVAL_REQUIRED`) pro mutující, destruktivní nebo vysokorizikové akce (`HIGH`, `CRITICAL`, `P0`, `P1`).

---

## 2. DATOVÁ STRUKTURA AKČNÍHO KATALOGU

Každá položka v katalogu (`OrionCapabilityDefinition`) obsahuje povinné atributy:

```typescript
export interface OrionCapabilityDefinition {
  capabilityId: ControlPlaneCapability;
  name: string;
  description: string;
  requiredPermission: string;
  riskLevel: OrionRiskLevel; // 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'P0' | 'P1' | 'P2' | 'P3'
  requiresHumanApproval: boolean;
  isReadOnly: boolean;
  canMutate: boolean;
  policyEngineCheck: boolean;
  auditRequired: boolean;
  traceRequired: boolean;
}
```

---

## 3. SEZNAM A KLASIFIKACE DEKLAROVANÝCH CAPABILITIES

Všechny capabilities registrované v `ORION_ACTION_CATALOG`:

| Capability ID | Název | Riziko | Čtení/Mutace | Vyžaduje HITL | Audit | Trace |
|---|---|---|---|---|---|---|
| `content.read` | Čtení veřejného obsahu | `LOW` | Read-Only | ❌ Ne | ❌ Ne | ✅ Ano |
| `content.create` | Tvorba nového obsahu | `MEDIUM` | Mutující | ❌ Ne | ✅ Ano | ✅ Ano |
| `content.write` | Úprava obsahu | `MEDIUM` | Mutující | ✅ Ano | ✅ Ano | ✅ Ano |
| `content.publish` | Publikace obsahu | `HIGH` | Mutující | ✅ Ano | ✅ Ano | ✅ Ano |
| `legal.read` | Čtení právních textů | `LOW` | Read-Only | ❌ Ne | ❌ Ne | ✅ Ano |
| `legal.research` | Právní výzkum a výklady | `LOW` | Read-Only | ❌ Ne | ✅ Ano | ✅ Ano |
| `judikatura.read` | Čtení judikatury | `LOW` | Read-Only | ❌ Ne | ❌ Ne | ✅ Ano |
| `ai.chat` | AI konverzace | `LOW` | Read-Only | ❌ Ne | ❌ Ne | ✅ Ano |
| `ai.generate` | AI generování textů | `MEDIUM` | Mutující | ❌ Ne | ✅ Ano | ✅ Ano |
| `cms.write` | Správa CMS stránek | `HIGH` | Mutující | ✅ Ano | ✅ Ano | ✅ Ano |
| `settings.read` | Zobrazení nastavení | `LOW` | Read-Only | ❌ Ne | ❌ Ne | ✅ Ano |
| `settings.write` | Úprava nastavení | `CRITICAL` | Mutující | ✅ Ano | ✅ Ano | ✅ Ano |
| `users.read` | Zobrazení uživatelů | `MEDIUM` | Read-Only | ❌ Ne | ✅ Ano | ✅ Ano |
| `users.write` | Úprava profilů | `HIGH` | Mutující | ✅ Ano | ✅ Ano | ✅ Ano |
| `users.manage` | Správa účtů | `CRITICAL` | Mutující | ✅ Ano | ✅ Ano | ✅ Ano |
| `rbac.manage` | Správa rolí/práv | `CRITICAL` | Mutující | ✅ Ano | ✅ Ano | ✅ Ano |
| `qa.run` | QA testovací sada | `MEDIUM` | Read-Only | ❌ Ne | ✅ Ano | ✅ Ano |
| `audit.run` | Systémový audit | `MEDIUM` | Read-Only | ❌ Ne | ✅ Ano | ✅ Ano |
| `github.read` | Čtení GitHubu | `LOW` | Read-Only | ❌ Ne | ❌ Ne | ✅ Ano |
| `github.branch.create` | Vytvoření Git větvě | `MEDIUM` | Mutující | ❌ Ne | ✅ Ano | ✅ Ano |
| `github.commit` | Git commit | `HIGH` | Mutující | ✅ Ano | ✅ Ano | ✅ Ano |
| `github.push.feature` | Git push feature | `HIGH` | Mutující | ✅ Ano | ✅ Ano | ✅ Ano |
| `github.pr.create` | Vytvoření Pull Requestu | `MEDIUM` | Mutující | ❌ Ne | ✅ Ano | ✅ Ano |
| `database.read` | Čtení databáze | `MEDIUM` | Read-Only | ❌ Ne | ✅ Ano | ✅ Ano |
| `database.migrate` | Databázové migrace | `CRITICAL` | Mutující | ✅ Ano | ✅ Ano | ✅ Ano |
| `vps.read` | Čtení stavu VPS | `MEDIUM` | Read-Only | ❌ Ne | ✅ Ano | ✅ Ano |
| `vps.write` | Správa VPS | `CRITICAL` | Mutující | ✅ Ano | ✅ Ano | ✅ Ano |
| `deploy.production` | Produkční nasazení | `CRITICAL` | Mutující | ✅ Ano | ✅ Ano | ✅ Ano |
| `security.policy.write` | Bezpečnostní politiky | `CRITICAL` | Mutující | ✅ Ano | ✅ Ano | ✅ Ano |
| `project.manage` | Správa projektů | `HIGH` | Mutující | ✅ Ano | ✅ Ano | ✅ Ano |
| `moderation.read` | Čtení moderační fronty | `LOW` | Read-Only | ❌ Ne | ❌ Ne | ✅ Ano |
| `moderation.write` | Schvalování a moderace | `MEDIUM` | Mutující | ❌ Ne | ✅ Ano | ✅ Ano |

---

## 4. ACTION FLOW & AUTHORIZATION BRIDGE

Při požadavku na akci přes Orion probíhá následující sekvenční řízení:

```
[User Request]
       │
       ▼
[Server-side Re-authorization] ──► OrionPermissionResolver.resolveEffectivePermissions(user)
       │
       ├─► (Pokud neautentizován nebo neoprávněn) ──► DENY (Fail Closed) + Audit Log
       │
       ▼
[Catalog Metadata Verification] ──► OrionActionCatalog.getCapabilityDefinition(capabilityId)
       │
       ▼
[Policy Engine Check] ──► aiPolicyEngine.evaluatePolicy(user, capabilityId)
       │
       ├─► (Pokud zamítnuto politikou) ──► DENY (Policy Engine) + Audit Log
       │
       ▼
[Risk & HITL Gate] ──► Mutating / High / Critical / P0 / P1
       │
       ├─► (Pokud mutující/vyšší riziko) ──► HUMAN_APPROVAL_REQUIRED + Audit Log + Trace
       │
       ▼
[Safe Execution / Bridge] ──► ALLOW + Audit Log + Complete Trace
```

---

## 5. VÝSLEDKY TESTOVACÍ SADY

Všechny testovací sady byly ověřeny pomocí `vitest`:

```bash
npx vitest run tests/orion-global-control-plane.test.ts tests/orion-action-catalog.test.ts
```

### Přehled spuštěných testů:
- `tests/orion-global-control-plane.test.ts`: **24/24 PASSED**
- `tests/orion-action-catalog.test.ts`: **18/18 PASSED**
- **Celkem:** **42/42 PASSED** (`100%`)

### Ověření klíčových bezpečnostních případů:
1. `Capability Catalog Integrity`: Všechny capabilities mají kompletní metadata.
2. `USER Role Filtering`: `USER` role má přístup pouze k základním ne-admin akcím.
3. `EDITOR Role Filtering`: `CONTENT_MANAGER`/`EDITOR` má přístup k tvorbě a edici obsahu.
4. `Legal Specialization`: `specialization: 'legal_advokat'` správně rozšiřuje přístup o právní rešerši.
5. `Custom Role Permissions`: Vlastní oprávnění uživatele jsou zohledněna v katalogu.
6. `Unauthorized Request`: Neautorizovaný požadavek vrací `DENY` (Fail Closed).
7. `Capability Spoofing`: Falešné atributy v těle požadavku jsou ignorovány, přístup zamítnut.
8. `Policy Engine Denial`: Při blokaci v Policy Enginu vrací `DENY`.
9. `Read-Only Execution`: Bezpečné akce ke čtení vrací `ALLOW`.
10. `Mutating Action`: Mutující akce správně vyžadují schválení nebo elevaci.
11. `Destructive Action`: Kritické akce (`database.migrate`, `vps.write`) klasifikovány jako `CRITICAL`.
12. `HUMAN_APPROVAL_REQUIRED`: Navržená mutace vrací stav vyžadující schválení člověkem.
13. `SUPER_ADMIN without bypass`: `SUPER_ADMIN` podléhá Policy Enginu, auditu, trasování a HITL.
14. `Anonymous Visitor`: Anonymní návštěvník nedostává chráněné capabilities (`DENY`).
15. `Dynamic Capability Discovery`: "Orione, s čím mi můžeš pomoct?" dynamicky vypisuje katalogové názvy a popisy.
16. `Re-authorization Before Execution`: Server-side ověření oprávnění probíhá bezprostředně před provedením.
17. `Audit Evidence`: Záznamy do `AuditService.recordLog` jsou vytvářeny.
18. `Trace Evidence`: Záznamy do `OrionTraceStore` jsou trasovány.

---

## 6. STATISTIKA PROVĚŘENÍ KÓDU & ZÁVĚR

- **TypeScript Compilation (`tsc --noEmit`):** ✅ `PASS` (0 chybných typů)
- **Applet Build (`compile_applet`):** ✅ `PASS` (Build succeeded)
- **Changelog / Security Protocol:** ✅ V souladu s SKP (Synthesis Knowledge Protocol)

Všechny požadované artefakty a verifikační kritéria pro `CMD-ORION-20260907-002` byly úspěšně dokončeny a ověřeny.
