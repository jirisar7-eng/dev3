# Auditní Zpráva: Oprava kritických bezpečnostních a souběžných (race-condition) vad (CodeRabbit Final)

## 1. BrandingService: Race Condition a DB Invariant
- **Problém:** Funkce `saveNewVersion` a `restoreVersion` používaly pouze standardní Prisma transakci (která na PostgreSQL standardně používá Read Committed izolaci), což mohlo vést k race condition (vícenásobné inkrementaci na stejnou verzi a více aktivních záznamům současně).
- **Root cause:** Pouhé volání transakce nebrání souběžným zápisům.
- **Řešení a Invarianty:**
  - V `prisma/schema.prisma` jsem navrhl `@unique` pro pole `version` a zapsal komentář s návrhem pro parciální unikátní index (`CREATE UNIQUE INDEX one_active_branding ON "BrandingVersion"("isActive") WHERE "isActive" = true;`).
  - Protože nemohu spustit destruktivní `prisma migrate dev` podle zadání, vynutil jsem na úrovni služby konzistenci přes **Advisory Lock** v transakci (`pg_advisory_xact_lock(20240826)`). To garantuje sekvenční provádění a naplnění invariantů i pod paralelní zátěží bez nutnosti okamžité migrace DDL.
- **Test:** Vytvořen nový test `tests/branding-race-condition.test.ts`, který pomocí `Promise.allSettled` spouští paralelní asynchronní žádosti o zápis a tvrdě asertuje, že nevzniknou žádné duplicity a že je právě jeden aktivní záznam.

## 2. AiRoutes: Fail-Closed validace (Analyze Document)
- **Problém:** CodeRabbit identifikoval slabá místa v restriktivní ochraně JSON dat, kde mohly procházet prázdné stringy místo faktických citací.
- **Root cause:** Validace nekontrolovala explicitně prázdnost polí a stringů, pouze existenci datových uzlů.
- **Řešení:** V `src/routes/aiRoutes.ts` doplněna tvrdá validace:
  - `parsed.summaryQuotes.length === 0` selže.
  - Ošetřeno iterováním nad `summaryQuotes`, kdy každé z nich nesmí být prázdné.
  - Stejně tak `contradiction.claim` a `contradiction.exactQuote` nesmějí být prázdné (`trim() === ''`).
- **Test:** Přidány 3 nové sub-testy (`TEST 9`, `TEST 10`, `TEST 11`) v `tests/p0-2-1-ai-forms-source-fidelity.test.ts`, které toto chování regresně kryjí (HTTP 500 pokud chybí summaryQuotes, nebo je některá citace prázdná).

## 3. AiAssistantView: Oprava funkce „Zkusit znovu“
- **Problém:** Retry metoda zasílala starý state neočekávaným způsobem po přepisu komponenty a mohla duplikovat odeslanou "user message".
- **Root cause:** Původní `handleSendMessage(undefined)` po odeslání do fronty vytvářel nový Message objekt, jelikož nerespektoval flag `isRetry`.
- **Řešení:** Doplněna logika `if (!isRetry) { ... } else { /* pouzij existujici frontu beze zmeny */ }` do metody `handleSendMessage` ve view `AiAssistantView.tsx`. Volání tlačítka přepsáno na `onClick={() => handleSendMessage(undefined, true)}`.

## Artefakty a Validace
- Změněné soubory:
  - `src/services/brandingService.ts`
  - `prisma/schema.prisma`
  - `src/routes/aiRoutes.ts`
  - `tests/p0-2-1-ai-forms-source-fidelity.test.ts`
  - `tests/branding-race-condition.test.ts`
  - `src/components/public/ai/AiAssistantView.tsx`
  - `docs/audit/AUDIT_2026-08-26_PR11_FINAL_CODERABBIT_FIXES.md`
- Výsledky:
  - **git diff --check:** PASS
  - **npm run lint:** PASS
  - **npx prisma validate:** PASS
  - **npm run build:** PASS
  - **npm test:** PASS
