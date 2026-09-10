# AUDIT: INTEGRACE LEGAL PACK 2.0 DRAFT PREVIEW DO DEV3

**Command ID:** TMPR-20260910-LEGAL-021  
**Datum:** 2026-09-10  
**Autor:** Hlavní architekt & DevSecOps ekosystému Synthesis  
**Status:** DRAFT PREVIEW INTEGRATED — NOT FOR PUBLICATION  
**Environment:** DEV3  
**Parent Command:** TMPR-20260910-LEGAL-020  

---

## 1. ÚČEL A ROZSAH

Účelem této operace bylo integrovat kompletní pracovní návrh **Legal Pack 2.0 (v2.0.0-DRAFT)** do stávajícího systému správy a prohlížení právních dokumentů na prostředí **DEV3** tak, aby byl administrátorům plně dostupný k vizuální, formulační a odborné advokátní kontrole v reálném uživatelském rozhraní, **aniž by došlo k jakékoli veřejné publikaci či možnosti akceptace návrhu**.

### Rozsah dokumentů Legal Pack 2.0:
1. **Podmínky užívání (Terms of Use):** `terms` (`DOC-TMPR-TERMS-V2`, v2.0.0-DRAFT)
2. **Ochrana osobních údajů (Privacy Notice):** `gdpr` (`DOC-TMPR-PRIVACY-V2`, v2.0.0-DRAFT)
3. **Zásady cookies (Cookie Policy):** `cookies` (`DOC-TMPR-COOKIES-V2`, v2.0.0-DRAFT)
4. **Právní výhrada a vyloučení právních služeb (Legal Disclaimer):** `legal` (`DOC-TMPR-DISCLAIMER-V2`, v2.0.0-DRAFT)
5. **Etický kodex dobrovolníka a přispěvatele (Volunteer Code):** `volunteer_code` (`DOC-TMPR-VOL-CODE-V2`, v2.0.0-DRAFT)
6. **Transparentnost AI a prohlášení o využití AI (AI Transparency):** `ai_statement` (`DOC-TMPR-AI-TRANSPARENCY-V2`, v2.0.0-DRAFT)
7. **Dohoda o dobrovolné spolupráci (Volunteer Agreement):** `dohoda-o-spolupraci` (`DOC-TMPR-VOLUNTEER-AGREEMENT-V2`, v2.0.0-DRAFT)

---

## 2. EXISTUJÍCÍ ARCHITEKTURA (DISCOVERY)

Před provedením jakýchkoli změn byla detailně zmapována stávající právní a compliance infrastruktura aplikace:
- **`ComplianceService` (`src/services/complianceService.ts`):** Aplikační logika a servisní vrstva pro právní dokumenty. Metoda `getPublishedDoc(key)` striktně filtruje dokumenty se statusem `PUBLISHED`, čímž poskytuje bezpečné oddělení pro veřejné endpointy.
- **Server API (`server.ts`):**
  - Veřejný endpoint `GET /api/compliance/docs/public/:key` volá `ComplianceService.getPublishedDoc(key)` a vrací pouze účinné schválené verze.
  - Endpoint pro zaznamenání souhlasu `POST /api/compliance/consent` vyžaduje autentizaci a deleguje na `ComplianceService.recordConsent()`.
- **Prezentační vrstva:**
  - `PublicDocumentCenter.tsx`: Veřejný rozcestník 7 publikovaných právních dokumentů.
  - `LegalDocsPage.tsx`: Stránka zobrazení konkrétního dokumentu přes `LegalDocumentLayout.tsx`.
  - `ComplianceModal.tsx`: Modální okno pro vynucený souhlas přihlášených uživatelů, napojené výhradně na veřejné endpointy.
  - `ComplianceManager.tsx`: Administrátorská konzole pro správu a audit compliance dokumentů a souhlasů.
- **Data Store (`src/services/dbStore.ts` & Prisma):** Obsahuje aktuální publikované verze dokumentů (v1.0.0 / v1.1.0) a auditní logy. Žádná změna Prisma schématu nebyla vyžadována.

---

## 3. PROVEDENÉ ZMĚNY

1. **Příprava autoritativních DRAFT dat (`src/data/legalDrafts20.ts`):**
   - Vytvořen modul obsahující kompletní texty všech 7 návrhů vzešlých z `docs/legal-drafts/legal-pack-2.0/` po revizi TMPR-20260910-LEGAL-020.
   - Každý dokument je opatřen metadaty: `version: "2.0.0-DRAFT"`, `status: "DRAFT"`, `warningNotice: LEGAL_PACK_2_0_WARNING`, `author: "Jiří Šár (Pracovní návrh Legal Pack 2.0)"`.
   - Závazné varování: *"PRACOVNÍ NÁVRH — NEPUBLIKOVÁNO. Tento dokument není aktuálně účinnou verzí právních podmínek projektu Táta má právo. Aktuální účinná verze je dostupná ve veřejném Centru právních dokumentů."*

2. **Rozšíření backendu (`ComplianceService` & `server.ts`):**
   - Přidány metody `ComplianceService.getAllDraftsPreview()` a `ComplianceService.getDraftPreview(key)` pro bezpečné vyčtení návrhů.
   - V `server.ts` vystaveny chráněné endpointy:
     - `GET /api/compliance/drafts` — striktně střeženo `requireAuth` a `requireRole('ADMIN')`.
     - `GET /api/compliance/drafts/preview/:key` — striktně střeženo `requireAuth` a `requireRole('ADMIN')`.
   - **Fail-Closed ochrana akceptace v `ComplianceService.recordConsent`:**
     - Zavedena explicitní kontrola: pokud je `docVersion === '2.0.0-DRAFT'` nebo verze obsahuje `'DRAFT'`, nebo status verze není `'PUBLISHED'`, je request okamžitě odmítnut chybou: `FAIL CLOSED: Pracovní návrh verze DRAFT (Legal Pack 2.0) nesmí být akceptován, podepsán ani použit pro souhlas.`

3. **Zabezpečení prezentační vrstvy (`LegalDocumentLayout.tsx`):**
   - Implementován výrazný výstražný banner pro status `DRAFT` informující o tom, že se jedná o nepublikovaný pracovní návrh.
   - Zablokovány veškeré akceptační prvky (`disabled={isDraft}`), skryto tlačítko pro akceptaci a zobrazeno upozornění: *"Tento dokument je v režimu PRACOVNÍ NÁVRH a nelze jej akceptovat ani podepsat."*

4. **Integrace do Administrátorského rozhraní (`ComplianceManager.tsx`):**
   - Přidána dedikovaná záložka **„Legal Pack 2.0 (Draft Preview)“** s informačním přehledem všech 7 návrhů.
   - Umožněn okamžitý přechod do plného náhledu dokumentu (`openDraftPreview`).
   - Přidáno explicitní upozornění: *"Tento balíček je v režimu WORKING DRAFT — NOT FOR PUBLICATION. Publikace je zablokována do schválení advokátem."*
   - V editačním modálu zablokováno tlačítko publikace pro verze obsahující `DRAFT` (Fail-closed v UI).

---

## 4. BEZPEČNOSTNÍ ANALÝZA (DEVSECOPS)

- **Zero Trust & Least Privilege (RBAC):** Běžní uživatelé (`USER`, `VOLUNTEER`) ani anonymní návštěvníci nemají k draft endpointům přístup. Pokus o přístup bez tokenu vrací `401 Unauthorized`, s rolí nižší než `ADMIN` vrací `403 Forbidden`.
- **Strict Public Isolation:** Veřejné rozhraní `/pravni-dokumenty` a endpoint `/api/compliance/docs/public/:key` filtrují pouze dokumenty se statusem `PUBLISHED`. Návrhy v2.0.0-DRAFT se ve veřejném katalogu ani v `ComplianceModal` nezobrazují.
- **Fail-Closed Consent Protection:** Nemožnost uložit souhlas s návrhem v2.0.0-DRAFT je technicky vynucena na úrovni backendové doménové logiky (`ComplianceService.recordConsent`) i v API handleru.
- **Žádné změny v DB schématu:** Integrace proběhla bez zásahu do `schema.prisma`. Nedochází k migraci ani riziku poškození dat.
- **Ochrana produkce:** Environment zůstává DEV3 (`NODE_ENV === 'development'`). Produkční prostředí PROD3 je zcela nedotčeno.

---

## 5. TESTY A OVĚŘENÍ

Byla vytvořena a úspěšně provedena automatizovaná integrační testovací sada `tests/legal-pack-2-0-draft-preview.test.ts` pokrývající všech 12 bezpečnostních a funkčních kritérií:

| Číslo | Testovací kritérium | Výsledek |
|---|---|---|
| 1 | ADMIN může zobrazit všech 7 DRAFT dokumentů v plném znění | ✅ PASS |
| 2 | USER nemůže projít přes ADMIN autorizační kontrolu | ✅ PASS |
| 3 | Anonymní návštěvník nevidí 2.0.0-DRAFT ve veřejném API | ✅ PASS |
| 4 | `/pravni-dokumenty` stále ukazuje pouze PUBLISHED dokumenty | ✅ PASS |
| 5 | Chráněná routa vyžaduje `requireAuth` a `requireRole('ADMIN')` | ✅ PASS |
| 6 | Pokus o akceptaci DRAFT verze je server-side odmítnut (Fail-closed) | ✅ PASS |
| 7 | Současná akceptace publikované verze (v1.0.0) funguje normálně | ✅ PASS |
| 8 | V databázi neexistuje žádný záznam o akceptaci verze 2.0 | ✅ PASS |
| 9 | Aktuální publikované dokumenty a jejich obsah nebyly změněny | ✅ PASS |
| 10 | Identita provozovatele je striktně Jiří Šár — fyzická osoba | ✅ PASS |
| 11 | V textech není žádné vymyšlené IČO neexistujícího spolku | ✅ PASS |
| 12 | PROD3 zůstává nedotčeno, běží na DEV3 | ✅ PASS |

Současně proběhl plný typecheck (`npm run lint`), který prošel s kódem 0 bez chyb.

---

## 6. DEFINICE DRAFT STAVU

Dokumenty v balíčku Legal Pack 2.0 se nacházejí v právním a technickém stavu:
```
STATUS: WORKING DRAFT — NOT FOR PUBLICATION
VERSION: 2.0.0-DRAFT
LEGAL NOTICE: Neúčinný pracovní návrh určený pro interní kontrolu a advokátní revizi.
```

- Dokumenty **nejsou účinné**.
- Dokumenty **nejsou veřejně přístupné**.
- Dokumenty **nelze podepsat ani potvrdit**.
- Dokumenty **nemají vliv na stávající uživatele ani registraci**.

---

## 7. DALŠÍ KROKY K PUBLIKACI

1. **Advokátní revize (TMPR-20260910-LEGAL-022):**
   - Předání balíčku Legal Pack 2.0 advokátní kanceláři k posouzení souladu s občanským zákoníkem, zákonem o ochraně spotřebitele, GDPR a EU AI Act.
   - Vyřešení označených výzkumných bodů (`[LEGAL RESEARCH REQUIRED]`, doručovací adresa fyzické osoby).
2. **Příprava publikace (Release Gate):**
   - Změna statusu z `DRAFT` na `PUBLISHED` proběhne až po formálním schválení.
   - Nastavení data účinnosti (`effectiveAt`).
   - Příprava uživatelské notifikace o změně podmínek v souladu s 15denní předstižnou lhůtou.
