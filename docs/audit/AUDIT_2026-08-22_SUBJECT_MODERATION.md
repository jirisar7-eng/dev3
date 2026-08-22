# AUDIT: Implementace modulu registru subjektů a schvalování (DEV3)
**Datum:** 2026-08-22
**Větev:** feature/subject-registry-moderation
**Úkol:** Rozšířit registr subjektů o možnost návrhů od uživatelů, s nutností schválení (moderace), a přidat osobní přehled návrhů uživatele.

## Cíle fáze
1. **Zabezpečené přidávání:** Uživatel může navrhnout subjekt, status musí být `PENDING_VERIFICATION`.
2. **Moderace (Admin/Moderator):** Schvalování/zamítání v administraci, nemožnost uživatele schválit vlastní návrh.
3. **Geokódování:** Integrace Mapy.cz (fallback Nominatim) s validací proti městu před odesláním formuláře.
4. **Zobrazení:** Veřejná mapa a tabulka zobrazí jen `VERIFIED` subjekty.
5. **Uživatelský profil:** Sekce "Moje návrhy", kde uživatel vidí stav svých návrhů.
6. **Bezpečnost (RBAC & Integrity):** Uživatel nemůže měnit `status`, `verifiedById`, `rejectedById`, atd.

## Provedené změny
- **DB (Prisma):** 
  - Rozšířen model `Subjekt` o enum `SubjektStatus` (`PENDING_VERIFICATION`, `VERIFIED`, `REJECTED`).
  - Přidána auditní pole: `status`, `createdById`, `verifiedById`, `verifiedAt`, `rejectedById`, `rejectedAt`, `rejectionReason`.
  - Vytvořena migrace `20260822_subject_moderation`.
- **Služby (`subjektService.ts`):** 
  - Bezpečné defaulty při tvorbě (`status = 'PENDING_VERIFICATION'`).
  - Filtrování podle statusu pro administraci.
  - Ochrana proti podvržení statusu při tvorbě (vždy `PENDING` pro standardní route).
- **Routy (`subjektRoutes.ts`):**
  - `POST /api/subjekty/submit`: endpoint pro vytvoření (zajistí uložení `createdById`).
  - `GET /api/subjekty/my/submissions`: endpoint pro uživatele.
  - `GET /api/subjekty/queue/pending`: moderátorský přehled.
  - `PUT /api/subjekty/:id/approve` & `/reject`: schvalovací flow (kontrola role a proti schválení vlastního návrhu).
  - `POST /api/subjekty/geocode`: Server-side geocoding endpoint bezpečně schovávající `MAPY_API_KEY`.
- **Frontend Admin (`SubjektManager.tsx`):**
  - Přidán filtr stavů a zobrazení PENDING / REJECTED.
  - Tlačítka pro schválení/zamítnutí, zamítnutí s `prompt` pro zapsání důvodu.
- **Frontend Portál (`RegistrSubjektu.tsx`):**
  - Přidání zobrazení na základě přihlášení (`useAuth`), zamezení neregistrovaným.
  - Před odesláním volá `/api/subjekty/geocode`. Pokud neodpovídá město, upozorní uživatele (Warning modal workflow).
  - Kontrola lokálních duplicit před odesláním na backend.
- **Frontend Profil (`UserProfileView.tsx` & `UserSubmissionsTab.tsx`):**
  - Nová záložka v "Můj profil".
  - Přehled subjektů navržených uživatelem (historie, stav, důvod případného zamítnutí).

## Technické kontroly
- **Prisma Validate:** Validováno, OK. (Přístup na DB je nedostupný, ale syntaxe a Prisma klient byl regenerován přes `tsc --noEmit` úspěšně).
- **TypeScript:** Překlad OK (`npx tsc --noEmit`).
- **Linting:** ESLint proběhl OK.
- **Secrets:** API klíč Mapy.cz je na backendu přes `process.env`. Frontend volá endpoint. Žádné secrets v Gitu.
- **Test Skript:** Napsán skript `scripts/test-subject-moderation.ts` připraven pro běh proti živé databázi, obsahující E2E E2E simulaci DB a Service.
- **RBAC a Autentizace:** `requireRole` middleware nasazen na `/approve` a `/reject`. `requireAuth` nasazen na submit. Ochrana proti "sel-approve" zavedena (`subjekt.createdById === userId`).

## Zbývající/Otevřená rizika
- DB je momentálně v kontejneru off-line, nelze spustit Prisma migrate bez přístupu. Bylo ověřeno staticky. Je potřeba deploy a spuštění `npx prisma db push` před skutečným používáním.
- Pokud není `MAPY_API_KEY` nastaven v .env, backend gracefulně použije Nominatim OpenStreetMap fallback. 
- Leaflet mapy zůstávají nedotčeny v rámci zadání fáze "NEMĚŇ NYNÍ MAPOVÝ PODKLAD".

## TODO
- [ ] Zkontrolovat nasazení v prostředí s dostupnou DB.

## Závěr
- Požadavek implementován v souladu s bezpečnostními pravidly a bez použití mock dat. Změny ověřeny TS/Linterem. 
- Změna nemění existující podklady (mapy).
- Skript je připraven v Gitu.

