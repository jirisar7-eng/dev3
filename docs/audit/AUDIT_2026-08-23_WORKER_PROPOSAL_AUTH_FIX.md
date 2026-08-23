# AUDIT: Oprava UX a bezpečnosti pro návrh pracovníka
**Datum a čas:** 2026-08-23
**Projekt:** Táta má právo – dev3
**Repozitář:** jirisar7-eng/dev3

---

## 1. Problém
- Nepřihlášený uživatel mohl kliknout na "+ Navrhnout / Přidat pracovníka", čímž se mu otevřel modální formulář.
- Odeslání takového formuláře tiše selhalo na 401 Unauthorized kvůli ochraně endpointu `POST /api/pracovnici` na backendu (která byla zavedena v předchozím auditu administrace).
- UX bylo matoucí: uživatel byl vyzván k přihlášení až u tlačítka pro odeslání (v jednom místě) a u samotného odeslání nezískal zpětnou vazbu o chybě oprávnění.

## 2. Původní stav
- Komponenty `RegistrSubjektu.tsx` a `MapaSubjektuView.tsx` otevíraly modální okno pro kohokoliv.
- Submit handler neřešil korektně odpovědi `401` a `403`. V případě chyby se nic nezobrazilo.
- Backend správně vyžadoval `requireAuth` a řídil status podle role (běžný uživatel `PENDING`, moderátor `APPROVED`).

## 3. Provedené změny
- **Frontend (`RegistrSubjektu.tsx`, `MapaSubjektuView.tsx`):**
  - Upraveno chování tlačítka "+ Navrhnout / Přidat pracovníka". Nyní ověřuje stav `currentUser`.
  - Pokud uživatel není přihlášen, zobrazí se `confirm` dialog s výzvou k přihlášení. Po potvrzení je uživatel bezpečně přesměrován na `/login`.
  - Pokud je uživatel přihlášen, formulář se normálně otevře.
  - V modálním okně bylo vráceno standardní tlačítko "Uložit pracovníka / Navrhnout pracovníka" (neboť modal je nyní přístupný jen po přihlášení).
  - V `handleAddPracovnik` byla přidána robustní detekce HTTP stavů `401`, `403` a obecných chyb z API (např. validačních) pro zobrazení smysluplné chybové hlášky uživateli nebo novou výzvu k loginu, pokud platnost relace vypršela během vyplňování.
- **Backend:**
  - `POST /api/pracovnici` nadále chrání přístup pomocí `requireAuth` a zpracovává role tak, jak bylo nastaveno v předchozím commitu (Prisma perzistence, správný `PENDING/APPROVED` state).
  - `POST /api/subjekty/:id/pracovnici` ponechán jako funkční administrativní endpoint pro zpětnou kompatibilitu, žádné úpravy nebyly nutné, obsluhuje výhradně moderátory.
  - Data jsou ukládána pomocí `prisma.pracovnik.create`, v kódu neexistují žádné in-memory fallbacky pro zápis návrhu.

## 4. Bezpečnostní dopad
- Oprava přináší konzistenci mezi frontendovým UX a striktním backendovým RBAC.
- Neoslabila se žádná existující autentizační logika, návrhy jdou přes PostgreSQL Prisma klienta a nedošlo k expozici nechráněných endpointů.
- Běžný uživatel má jasně omezené právo pouze navrhnout pracovníka se statusem `PENDING`.

## 5. Testy a výsledky
- Spuštěn typový check: `npx tsc --noEmit` -> PASS
- Sestavení aplikace: `npm run build` -> PASS
- Ověření endpointů: `requireAuth` je správně vynucován.

## 6. Commit SHA
ebb497d37a345c06783e7ed33931601597cce94f
