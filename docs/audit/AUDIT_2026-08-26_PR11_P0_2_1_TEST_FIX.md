# Auditní Zpráva: Oprava testovacích kompatibility P0.2.1

## Cíl
Opravit selhávající sub-testy (TEST 4, TEST 5, TEST 6) v sadě `tests/p0-2-1-ai-forms-source-fidelity.test.ts`.

## Původní stav
Nové fail-closed produkční ověřování v `src/routes/aiRoutes.ts` si vynucuje přítomnost polí `summaryQuotes` a `contradictions` a definovaný datový model v JSON výstupu z AI. Jelikož testovací sada obsahovala mockované AI odpovědi z doby před integrací této restriktivní fail-closed validační vrstvy, hlásila chybu `Invalid JSON schema returned from AI (Analyze Document)` a 3 subtesty havarovaly.

## Provedené změny
- **`tests/p0-2-1-ai-forms-source-fidelity.test.ts`**:
  - Aktualizována struktura mock odpovědí pro všechny dotazy na `/api/ai/analyze-document` (Testy 2 až 7).
  - Doplněna povinná prázdná pole `summaryQuotes: []` do mock objektů tak, aby odpovídala produkčnímu kontraktu.
  - V Testu 5 byla změněna struktura stringového pole `contradictions` na objektové pole podle nového schema (`{ claim: string, exactQuote: string }`). Bylo využito platného citátu z testovaného zdrojového textu, aby simulace prošla fail-closed validací přes `exactQuote`.
  - V Testu 6 přidán platný záznam do `summaryQuotes`, který fail-safe vrstva hledá a vyžaduje k nalezení ve zdrojovém textu.

## Bezpečnost a integrita
- **Žádná úprava produkční logiky**: Zásah se týká čistě sjednocení struktury v testovacích mock objektech s očekáváním produkčního routeru.
- **Fail-closed chování**: Restriktivní validační logika nebyla omezena. Mock objekty nyní simulují správné odpovědi, které nová bezpečnostní logika očekává.
- **Neměněné aserce**: Smysl všech asercí byl plně zachován, testy stále ověřují původní business pravidla.

## Výsledky
- `npx tsx --test tests/p0-2-1-ai-forms-source-fidelity.test.ts`: **PASS (8/8)**
- `npm test`: **PASS**
- `npm run lint`: **PASS**
- `npx prisma validate`: **PASS**
- `npm run build`: **PASS**

## Artefakty a Git
- Změněné soubory:
  - `tests/p0-2-1-ai-forms-source-fidelity.test.ts`
  - `docs/audit/AUDIT_2026-08-26_PR11_P0_2_1_TEST_FIX.md`
- Branches, remote: Pushed to `feat/ai-failsafe-client-prompt-hardening`. `main` remains unchanged. No merge, no deploy.
