# Orion AI Provider Fallback Audit

**Datum:** 2026-09-07
**Úkol:** CMD-ORION-20260907-009 — AI Provider & Fallback Configuration Reconciliation
**Rozsah:** AiService, aiStats, aiModelRegistry, providerCatalogAdapters a související moduly.

## Cíl
Provést kontrolu hardcoded API keys a obsolete fallbacků pro AI modely (např. `grok-2-1212`, `gemini-3.6-flash`), zajistit výběr modelů primárně přes `AiModelRegistry`, ověřit, že fallback chain neobchází Security/Policy modely, a potvrdit správné zacházení se secrets.

## Zjištěný stav (Před úpravou)
1. **Gemini:** `AiService` obsahoval hardcoded `gemini-3.6-flash`.
2. **Grok:** Fallback pro `xAI`/`Grok` byl natvrdo nastaven na `grok-2-1212` bez kontroly v registru.
3. **Groq:** `llama-3.3-70b-versatile` byl také hardcoded.
4. **Secrets:** Žádné hardcoded API keys nebyly nalezeny v repozitáři, logování chyb v AiService neprozrazovalo secrets. Environment proměnné jsou striktně dodržovány.
5. **Authorization:** AiService sám o sobě pouze provádí volání API na základě platných credentials. Orion Service volá AiService až *poté*, co projde kontrolou `ControlPlaneAuthorization` (User ∩ Orion capability). Tedy fallback model neobchází Orion RBAC ani Audit.

## Změny (Implementace)
- **AiService.ts:**
  - Upraveno chování tak, že fallbacks pro *Grok* a *Groq* (stejně jako *Gemini*) nyní asynchronně dotazují `aiModelRegistry.getRoute({ preferredProviderKey: '...' })`.
  - Pokud registr model nevrátí, vrací se explicitní chybový stav `PROVIDER_UNAVAILABLE: No active model found in registry`.
  - Tímto je garantováno využití platného aktivního modelu.
- **Odstranění hardcoded modelů:**
  - `grok-2-1212` nahrazeno za obecný identifikátor `grok-2` (napříč testy, adaptéry a registrem).
  - `gemini-3.6-flash` nahrazeno za standardní `gemini-1.5-flash` napříč všemi soubory, kde byl natvrdo vepsán.
- **grokProvider.ts a groqProvider.ts:**
  - Upraveny výstupní hodnoty pro propertu `model`, aby vracely dynamicky určený `activeModel` (z options) namísto staticky zadrátovaného `this.modelName`.
- **AiStats.ts:**
  - Modely pro default provider initialization vyčištěny od hardcoded historických verzí.

## Výsledek testování
- **Testy:** Úspěšně spuštěny unit/integrační testy včetně `ai-provider-consistency.test.ts`.
- **TSC / Build:** Bez typových chyb (`tsc --noEmit`), build prošel v pořádku.
- **Security Check:** `grok-2-1212` ani žádné citlivé `AIza` (mimo test/dummy data) v repozitáři nefigurují. Nejsou modifikována žádná práva, role ani DB schéma.

## Závěr a doporučení
**Výsledek:** ✅ PASS

Oprava je dokončena bez nebezpečných zásahů do RBAC či databáze, fallback mechanizmus AiService nyní zrcadlí aktuální stav `AiModelRegistry`.
