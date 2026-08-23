# CODE REVIEW AUDIT: Judgment Extractor → Case Sync

**Datum:** 2026-08-23 15:10:00 UTC  
**Větev:** `feature/judgment-extractor-case-sync` (Commit `227b17d`) vs `main`  
**Předmět:** Finální bezpečnostní a technické code review před merge do `main`  
**Rozsah:** Datový tok PDF → ClamAV → AI Extractor → Prisma Transaction → Klientský spis (/muj-pripad) → CoParent Hub → Kalendář

---

## 1. Porovnání s větví `main`

### Změněné soubory:
- `src/services/judgmentParserService.ts`: Rozšíření schématu a promptu o pole `alimonyRecipient`, `alimonyDebtAmount`, `alimonyDebtPeriod`, `alimonyDebtDueDate` a `informationDuty` včetně numerické normalizace.
- `src/services/clientCaseService.ts`: Implementace atomické transakce `applyJudgmentToCase` pokrývající synchronizaci `Child`, `UserChild`, `CaseDocument`, `CaseEvidence`, `CaseDeadline`, `CaseTask`, `CarePlan`, `CareDay`, `CaseEvent`, `CoParentHub`.
- `src/routes/caseRoutes.ts`: Zabezpečení endpointů `POST /api/cases/:caseId/parse-judgment` a `POST /api/cases/:caseId/apply-judgment` autorizační bariérou a metadata hashem.
- `src/components/case/care/CareJudgmentImportModal.tsx`: Odesílání platných autorizačních hlaviček s tokenem a `credentials: 'include'`.
- `src/db/prisma.ts`: Podpora transparentního provádění `$transaction`.
- `tests/judgment-case-sync.test.ts`: Integrační testy pokrývající BOLA/IDOR ochranu, atomicitu a idempotenci.
- `scripts/test-runner.js`: Zařazení integračního testu do celkového testovacího runneru.

---

## 2. Review datového toku a provázanosti entit

Prověřena celá integrační cesta:
1. **Nahrání dokumentu & ClamAV:** Soubor projde antivirovým skenem se statusem `CLEAN`.
2. **AI Extractor:** Bezpečně rozparsuje výroky rozsudku do validovaného JSON formátu.
3. **Autorizace před transakcí:** Metoda `authorizeCaseAccess(caseId, requestingUser)` ověří vlastnictví spisu (`case.ownerId === user.id`).
4. **Prisma `$transaction`:**
   - **Case:** Aktualizace sp. zn., soudu a formy péče.
   - **Child & UserChild:** Vytvoření / aktualizace dítěte s přesným datem narození (`dateOfBirth`).
   - **CaseDocument & CaseEvidence:** Evidence dokumentu a založení právního titulu.
   - **CaseDeadline & CaseTask:** Běžné výživné (1 500 Kč k 15. dni v měsíci) + dlužné výživné (200 Kč) s bezpečnou vazbou na doložku právní moci (úkol k doplnění data PM namísto syntetického data) + úkol pro informační povinnost (1× denně).
   - **CarePlan & CareDay:** Aktivní asymetrický/střídavý plán (sudý týden: Po, Pá; lichý týden: Po, St, Pá; 08:45–15:30; Přelouč – železniční stanice).
   - **CaseEvent:** Kalendářní předávací události generované podle ISO parity týdnů.
   - **CoParent Hub:** Synchronizace do `coParentChild`, `coParentHandover`, `coParentExpense`, `coParentAgreement`.

---

## 3. Bezpečnostní audit (P0)

- **BOLA / IDOR:** PASS. Každý přístup ke spisu ověřuje `ownerId === requestingUser.id` (či admin). Test s neautorizovaným uživatelem prokazatelně vrací `403 Forbidden`.
- **ClamAV:** PASS. Soubory se statusem `INFECTED` jsou zamítnuty.
- **Fail-Closed & Zero Synthetic Data:** PASS. Systém nevymýšlí fiktivní datum právní moci ani smyšlené částky; chybějící datum právní moci vytváří úkol k doplnění.
- **Ochrana soukromí (GDPR / PII):** PASS. V aplikačních logovacích hláškách se nevyskytují rodná čísla, jména ani citlivé rodinné údaje.
- **Secrets:** PASS. Žádné API klíče ani tokeny nejsou hardcoded v kódu ani v logu.

---

## 4. Transakční integrita a idempotence

- **Atomicita transakce:** Všechny operace probíhají uvnitř `prisma.$transaction`. Pokud by selhal zápis plánu péče nebo kalendáře, celá transakce je vrácena zpět (rollback) a nevzniká nekonzistentní stav.
- **Idempotence:** Opakovaný import stejného rozsudku nevede ke vzniku duplicitních dětí, duplicitních aktivních plánů péče ani duplicitních kalendářních událostí či termínů.

---

## 5. Regresní a kompilační verifikace

- **TypeScript Typecheck (`npx tsc --noEmit`):** PASS (0 chyb)
- **Linter (`npm run lint`):** PASS (0 chyb)
- **Test Runner (`npm test`):** PASS (5/5 sad, 100 % úspěšnost)
- **Produkční build (`npm run build`):** PASS (Prisma client generován, Vite build + esbuild bundle dokončeny)
- **Prisma Databázové schéma:** `DB SCHEMA: UNCHANGED` (beze změn, plně kompatibilní se stávající databází).

---

## 6. Závěrečné hodnocení

- **CODE REVIEW:** PASS
- **SECURITY:** PASS
- **BOLA/IDOR:** PASS
- **TRANSACTION:** PASS
- **IDEMPOTENCE:** PASS
- **ZERO SYNTHETIC DATA:** PASS
- **TSC:** PASS
- **LINT:** PASS
- **TESTS:** PASS
- **BUILD:** PASS
- **DB SCHEMA:** UNCHANGED
- **MERGE STATUS:** READY
