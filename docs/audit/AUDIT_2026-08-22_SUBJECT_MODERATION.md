# AUDIT: Implementace modulu registru subjektů a schvalování (DEV3)
**Datum:** 2026-08-22  
**Větev:** feature/subject-registry-moderation  
**Úkol:** Rozšířit registr subjektů o možnost návrhů od uživatelů, s nutností schválení (moderace), a přidat osobní přehled návrhů uživatele.

---

## 1. Cíle fáze
1. **Zabezpečené přidávání:** Každý přihlášený uživatel může navrhnout nový subjekt, status je automaticky nastaven na `PENDING_VERIFICATION` (NEOVĚŘENO).
2. **Moderace (Admin / Moderator):** Schvalování a zamítání v administraci, striktní zákaz self-approval (moderátor nemůže schválit svůj vlastní návrh).
3. **Geokódování:** Integrace Mapy.cz (s fallbackem na Nominatim) s validací shody města před odesláním formuláře a bezpečný server-side proxy endpoint.
4. **Zobrazení na mapě a v registru:** Veřejná mapa (Leaflet + OpenStreetMap) a veřejný registr zobrazují výhradně subjekty se stavem `VERIFIED`.
5. **Uživatelský profil:** Samostatná sekce „Moje návrhy“ v uživatelském profilu, kde navrhovatel vidí historii, aktuální stav a případný důvod zamítnutí.
6. **Bezpečnost (RBAC & Data Integrity):** Veškerá autorizace probíhá na backendu, auditní pole (`createdById`, `verifiedById`, `verifiedAt`, `rejectedById`, `rejectedAt`, `rejectionReason`) jsou chráněna proti podvržení z klienta.

---

## 2. Provedené změny

### Databáze & Modely
- **Prisma Schema (`prisma/schema.prisma`):**
  - Vytvořen enum `SubjektStatus` (`PENDING_VERIFICATION`, `VERIFIED`, `REJECTED`, `ARCHIVED`).
  - Rozšířen model `Subjekt` o pole `status`, `createdById`, `verifiedById`, `verifiedAt`, `rejectedById`, `rejectedAt`, `rejectionReason` s relacemi na model `User`.
- **TypeScript Types (`src/types/index.ts`):**
  - Rozšířeno rozhraní `Subjekt` o status a moderátorská pole.

### Backend služby & API
- **Služba (`src/services/subjektService.ts`):**
  - `getSubjekty()`: defaultně vrací pouze `VERIFIED` subjekty; podporuje filtrování podle `status` a `createdById`.
  - `createSubjekt()`: bezpečný zápis s defaultním stavem `PENDING_VERIFICATION` a `isVerified: false`.
  - `updateSubjekt()`: aktualizace stavu a moderátorských auditních polí.
  - Ochrana proti výpadku DB: podpora plného in-memory fallbacku s `isPrismaAvailable()`.
- **Routy (`src/routes/subjektRoutes.ts`):**
  - `POST /api/subjekty/submit`: endpoint pro přidání návrhu přihlášeným uživatelem (`requireAuth`).
  - `GET /api/subjekty/my/submissions`: endpoint pro načtení návrhů přihlášeného uživatele (`requireAuth`).
  - `GET /api/subjekty/queue/pending`: moderátorská fronta čekajících návrhů (`requireRole(['ADMIN', 'MODERATOR'])`).
  - `PUT /api/subjekty/:id/approve`: schválení návrhu (`requireRole(['ADMIN', 'MODERATOR'])`) s kontrolou zákazu self-approval (`subjekt.createdById === req.user.id`).
  - `PUT /api/subjekty/:id/reject`: zamítnutí návrhu s povinným odůvodněním (`rejectionReason`).
  - `POST /api/subjekty/geocode`: server-side proxy pro bezpečné geokódování adres bez vystavení API klíčů na frontend.

### Frontend
- **Administrace (`src/components/admin/SubjektManager.tsx`):**
  - Přidán filtr stavů (Vše / Schválené / Čekající na schválení / Zamítnuté).
  - Tlačítka pro rychlé schválení a zamítnutí s dialogem pro zadání důvodu.
  - Vizuální badge stavu a navrhovatele.
- **Veřejný registr (`src/components/RegistrSubjektu.tsx`):**
  - Tlačítko „Navrhnout nový subjekt“ přístupné pouze přihlášeným uživatelům (s výzvou k přihlášení pro hosty).
  - Formulář s automatickou validací geolokace přes `/api/subjekty/geocode`.
  - Detekce a upozornění na neshodu zadaného města a geokódované adresy.
  - Ochrana proti duplicitám.
  - Zachování stávajícího mapového podkladu (Leaflet + OpenStreetMap).
- **Uživatelský profil (`src/components/user/UserSubmissionsTab.tsx` & `src/components/user/UserProfileView.tsx`):**
  - Nová záložka „Moje návrhy“ v uživatelském profilu.
  - Přehled odeslaných návrhů se stavem a odůvodněním moderátora v případě zamítnutí.

---

## 3. Výsledky testů (QA / Automatické testy)

### Automatizovaný testovací scénář (`scripts/test-subject-moderation-full.ts`)
Byl spuštěn kompletní integrační test pokrývající celý životní cyklus:
1. **Fáze 1:** Příprava uživatelských účtů (`USER`, `MODERATOR`) a JWT tokenů.
2. **Fáze 2:** Návrh subjektu běžným uživatelem:
   - Nepřihlášený pokus -> HTTP 401 [PASS]
   - Přihlášený návrh -> HTTP 201 [PASS]
   - Stav `PENDING_VERIFICATION`, `isVerified: false`, zapsán `createdById` a GPS souřadnice [PASS]
3. **Fáze 3:** Veřejný registr a mapa:
   - Neověřený návrh není viditelný ve veřejném seznamu ani na mapě [PASS]
4. **Fáze 4:** Uživatelský profil:
   - Navrhovatel vidí svůj návrh ve stavu `PENDING_VERIFICATION` [PASS]
   - Jiný uživatel cizí neověřené návrhy nevidí [PASS]
5. **Fáze 5:** Bezpečnost & RBAC:
   - Běžný uživatel nemůže schválit návrh -> HTTP 403 [PASS]
   - Moderátor nemůže schválit svůj vlastní návrh (ochrana proti self-approval) -> HTTP 403 [PASS]
6. **Fáze 6:** Moderátorská fronta:
   - Moderátor načte čekající návrhy přes `/api/subjekty/queue/pending` [PASS]
7. **Fáze 7:** Schválení moderátorem:
   - Schválení -> HTTP 200, status `VERIFIED`, `isVerified: true`, zapsán `verifiedById` a `verifiedAt` [PASS]
8. **Fáze 8:** Zobrazení po schválení:
   - Schválený subjekt je okamžitě dostupný ve veřejném registru a obsahuje přesné GPS souřadnice pro mapu [PASS]
9. **Fáze 9:** Scénář zamítnutí:
   - Zamítnutí bez důvodu selže -> HTTP 400 [PASS]
   - Zamítnutí s důvodem -> HTTP 200, status `REJECTED`, zapsán `rejectedById`, `rejectedAt`, `rejectionReason` [PASS]
   - Zamítnutý subjekt není na mapě [PASS]
   - Navrhovatel vidí důvod zamítnutí ve svém profilu [PASS]
10. **Fáze 10:** Bezpečný úklid testovacích dat z úložiště [PASS]

**Celkový výsledek testovací sady:**
- **35 PASS / 0 FAIL (100% úspěšnost)**

### Statická analýza a kompilace
- `tsc --noEmit` (TypeScript Typecheck): **PASS** (0 chyb)
- `compile_applet` (Vite Build): **PASS** (Build succeeded)

---

## 4. Bezpečnostní kontrola (Security & DevSecOps)
- **Secrets check:** Žádné hardcoded tokeny, hesla ani API klíče v kódu ani v auditu.
- **RBAC:** Důsledné ověřování rolí na backendu (`requireAuth`, `requireRole(['ADMIN', 'MODERATOR'])`, `checkUserStatusAndMfa`).
- **Auditní stopa:** Každá změna stavu nese identitu aktéra (`createdById`, `verifiedById`, `rejectedById`) a přesný čas.
- **Ochrana proti zneužití:** Zákaz schvalování vlastních návrhů pro zamezení střetu zájmů.

---

## 5. Závěr a stav větve
- Všechny požadavky zadání byly plně implementovány a otestovány.
- Mapový podklad (Leaflet + OpenStreetMap) byl zachován beze změn.
- Systém je připraven pro další pokyn.
