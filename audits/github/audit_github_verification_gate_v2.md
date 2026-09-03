# Technický Audit: GITHUB VERIFICATION GATE V2 — IMPLEMENTACE A HARDENING

**Datum:** 2. září 2026
**Oblast:** GitHub Integration / Publisher Service
**Projekt:** Táta má právo / Synthesis Hub
**Verze:** DEV3

---

## 1. Účel úkolu
Povýšení stávajícího GitHub verification mechanismu na V2. 
Hlavním cílem bylo zajistit, aby žádná vrstva systému nemohla prohlásit změnu za "VERIFIED" či "PUBLISHED", pokud to není nezávisle a stoprocentně potvrzeno skrz API GitHubu přes \`GITHUB_TOKEN\`. Bylo nutné upravit formát reportingu, zacházet s vícenásobnými commity, odstranit falešně pozitivní stavy a zajistit absolutní bezpečnost.

---

## 2. Výchozí stav (Před změnou)
Předchozí verze (V1) již obsahovala volání API pro ověření. Nicméně:
- Nepoužívala striktní kontrakt s poli jako \`remoteHeadSha\`, \`implementationCommits\`, atd.
- Mohla vést k falešné představě "finalCommitSha", a to i když byl commit zanořený v historii větve (tzv. "multiple commits").
- Neřešila konzistentně všechny stavy přes fail-closed návrh (např. v logice vracení \`VerificationResult\`).

---

## 3. Implementované změny
1. **Zavedení datového kontraktu \`VerificationResult\`:**
   V \`src/services/githubPublisherService.ts\` byly zavedeny striktní TypeScript interfacy \`CommitData\` a \`VerificationResult\`. Výsledek publikování (\`PublishResult\`) byl rozšířen o pole \`verificationResult\`.
2. **Přepis \`verifyRemoteCommitViaApi\` (Fail-Closed logika):**
   - Načítá z GitHub API nejprve cílovou větev a zjistí skutečný "Canonical Remote HEAD" (\`remoteHeadSha\`).
   - Následně zkontroluje commit, který byl aplikací vytvořen a vloží ho do \`implementationCommits\` nebo \`auditCommits\`.
   - Zkontroluje propojení commitu (přítomnost jako HEAD nebo v historii prvních 50 commitů cílové větve).
   - V případě, že chybí \`GITHUB_TOKEN\`, vrací se \`FAILED\` (s důvodem \`GITHUB_TOKEN_UNAVAILABLE\`).
3. **Úprava \`publishToGithub\` a \`forcePushToGithub\`:**
   Pokud metoda \`verifyRemoteCommitViaApi\` nevrátí stav \`VERIFIED\`, vyhodí se bezprostředně chyba. Auditní systém (\`AuditService.recordLog\`) se zavolá AŽ po úspěšné validaci, nikdy dříve. Tím nevzniknou auditní stopy u operací, které neprošly verifikační bránou.
4. **Token Security Hardening:**
   Použití \`redactToken()\` na veškeré možné cesty chyb – fail-closed i ve vnitřní struktuře chyb API.
5. **Nové Testy:**
   Implementovány v \`tests/github-verification-gate.test.ts\` ověřující mj. token absence, chybějící soubory v remote commitu a validní chování list history fallbacku.

---

## 4. Bezpečnostní dopady a zjištění (Security Findings)
Během auditu byly zkoumány tyto scénáře:
- **P1 - Únik GITHUB_TOKEN:** Bylo zajištěno, že se token z paměti nenaserializuje do chyby přes \`error.message\` v síťovém logu. Výstupy z API dotazů k němu nemají přístup.
- **P1 - Race conditions při push:** Pokud mezitím někdo přidá do větve další commit, náš commit zůstane v historii, Remote HEAD se bude lišit. Gate to korektně vyhodnotí vyhledáním v historii.

---

## 5. Výsledky testů a validace
**Testy:**
- **Unit testy (\`github-verification-gate.test.ts\`):** ÚSPĚŠNÉ.
- **Linter & Typecheck:** ÚSPĚŠNÉ (tsc --noEmit).
- **Aplikace:** Úspěšně se zkompilovala a vývojový server je schopen běžet.
- **Závěrečná validace přes skutečné API:** Bude provedena automaticky po nasazení tohoto commitu (tzv. "dogfooding").

---

## 6. Finální stav
Implementace GITHUB VERIFICATION GATE V2 byla dokončena, pokryta testy a bezpečnostními opatřeními. Všechny commity a publikační akce přes AI Studio API musí odteď nevyhnutelně projít tímto validátorem.

**Stav:** IMPLEMENTED
