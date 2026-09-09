# LEGAL PACK 2.0 — PRACOVNÍ NÁVRHY PRÁVNÍ A COMPLIANCE DOKUMENTACE
**Projekt:** Táta má právo / Synthesis OS  
**Status:** `STATUS: WORKING LEGAL DRAFTS — NOT FOR PUBLICATION`  
**Datum vyhotovení:** 2026-09-09  
**Verze balíčku:** 2.0.0-DRAFT  
**Prostředí vzniku:** DEV3 (výhradně výzkumný a dokumentační režim)  

---

## ⚠️ DŮLEŽITÉ PRÁVNÍ A BEZPEČNOSTNÍ UPOZORNĚNÍ

Tato složka obsahuje ucelený pracovní návrh nové generace právní a compliance dokumentace projektu **Táta má právo** v rámci platformy **Synthesis OS**.

Dokumenty v této složce:
1. **NEJSOU IMPLEMENTOVANÉ** v produkčním ani vývojovém běhu aplikace.
2. **NEJSOU PUBLIKOVANÉ (STATUS: DRAFT ONLY)** – současné platné verze dokumentů (`PUBLISHED` v1.0.0 / v1.1.0) v databázi a rozhraní zůstávají zcela nedotčeny.
3. **NEJSOU PRÁVNĚ SCHVÁLENÉ** – jedná se o technicko-právní architektonický koncept připravený pro finální revizi kvalifikovaným českým advokátem specializovaným na IT, rodinné a spotřebitelské právo a GDPR.
4. **NESMÍ BÝT AUTOMATICKY INFORMOVÁNY ANI IMPORTOVÁNY DO PRODUKCE** – přechod do Compliance Document Versioning systému smí proběhnout až po dokončení procedury `PRE-PUBLICATION LEGAL REVIEW`.
5. **VYŽADUJÍ FACT VERIFICATION** – doplnění reálných identifikačních údajů provozovatele, IČO, sídla, kontaktních osob a reálných smluvních procesorů.
6. **VYŽADUJÍ CONSISTENCY REVIEW** – kontrolu křížových vazeb dle matice `09-CROSS-DOCUMENT-CONSISTENCY-MATRIX.md`.

---

## 1. STRUKTURA SOUBORŮ LEGAL PACK 2.0

| Soubor | Název / Účel dokumentu | Kanonický ID klíč |
| :--- | :--- | :--- |
| **`00-LEGAL-FACTS-INVENTORY.md`** | Technická a procesní inventura faktů zjištěných z kódu DEV3 | `FACTS_INVENTORY` |
| **`01-LEGAL-PACK-ARCHITECTURE.md`** | Architektura balíčku, kanonická terminologie, sazba a lifecycle | `PACK_ARCHITECTURE` |
| **`02-TERMS-OF-USE-DRAFT.md`** | Podmínky užívání portálu (Terms of Service / ToS) | `TERMS_V2` (`terms`) |
| **`03-PRIVACY-NOTICE-DRAFT.md`** | Zásady ochrany osobních údajů (Privacy Notice / GDPR) | `PRIVACY_V2` (`gdpr`) |
| **`04-COOKIE-POLICY-DRAFT.md`** | Pravidla používání cookies a úložišť prohlížeče | `COOKIES_V2` (`cookies`) |
| **`05-LEGAL-DISCLAIMER-DRAFT.md`** | Právní výhrada a vymezení charakteru informací | `DISCLAIMER_V2` (`legal`) |
| **`06-VOLUNTEER-CODE-DRAFT.md`** | Etický kodex dobrovolníka (14 sekcí + rozšíření) | `VOLUNTEER_CODE_V2` (`volunteer_code`) |
| **`07-AI-TRANSPARENCY-DRAFT.md`** | AI deklarace, transparentnost dle EU AI Act a Orion AI | `AI_TRANSPARENCY_V2` (`ai_statement`) |
| **`08-VOLUNTEER-COOPERATION-AGREEMENT-DRAFT.md`** | Rámcová smlouva o dobrovolné spolupráci | `VOLUNTEER_AGREEMENT_V2` (`dohoda-o-spolupraci`) |
| **`09-CROSS-DOCUMENT-CONSISTENCY-MATRIX.md`** | Křížová matice konzistence a eliminace rozporů | `CONSISTENCY_MATRIX` |
| **`10-PRE-PUBLICATION-LEGAL-REVIEW.md`** | Kontrolní checklist před publikací (P0–P3) | `PRE_PUB_REVIEW` |
| **`README.md`** | Tento úvodní manifest a metodický manuál | `README` |

---

## 2. PRAVIDLA ZNAČENÍ FAKTŮ A PLACEHOLDERŮ

V celém balíčku je striktně dodržováno pravidlo pravdivosti (*Synthesis Truth Protocol*). Každé tvrzení o technické či právní povaze je explicitně označeno:

- `[VERIFIED FROM CODE]` – ověřeno přímou inspekcí zdrojového kódu a služeb DEV3.
- `[VERIFIED FROM CONFIG]` – ověřeno z konfiguračních souborů a schématu databáze.
- `[EXISTING LEGAL TEXT]` – převzato ze stávajícího schváleného znění dokumentů v1.0.0 / v1.1.0.
- `[PRODUCT INTENT]` – deklarovaný záměr architektury platformy Synthesis / Táta má právo.
- `[LEGAL RESEARCH REQUIRED]` – otázka vyžadující formální posouzení advokátní kanceláří či regulatorním orgánem (např. ÚOOÚ, ČOI).
- `[TO VERIFY BEFORE PUBLICATION]` – hodnota, kterou je nutné před ostrým nasazením doplnit nebo zkontrolovat.
- `[PROPOSED CLAUSE]` – navržená smluvní formulace určená k revizi.

Pokud hodnota není v repozitáři pevně daná, je použit explicitní placeholder:
- `[TO VERIFY: identita budoucího provozovatele]`
- `[TO VERIFY: IČO]`
- `[TO VERIFY: sídlo]`
- `[TO VERIFY: konkrétní procesor]`
- `[TO VERIFY: retention period]`
- `[TO VERIFY: international transfer mechanism]`

Nikdy není hodnota doplňována odhadem.

---

## 3. POKYNY PRO PRÁVNÍ REVIZI (LEGAL COUNSEL)

Předložený balíček je navržen tak, aby:
1. **Odpovídal českému právnímu řádu** (zák. č. 89/2012 Sb., občanský zákoník; zák. č. 121/2000 Sb., autorský zákon; zák. č. 85/1996 Sb., o advokacii; zák. č. 127/2005 Sb., o elektronických komunikacích; zák. č. 634/1992 Sb., o ochraně spotřebitele).
2. **Plně respektoval právo EU** (Nařízení (EU) 2016/679 - GDPR; Nařízení (EU) 2024/1689 - EU AI Act; směrnice o digitálním obsahu a službách).
3. **Neobsahoval zakázaná absolutní tvrzení** (např. paušální zřeknutí se veškeré odpovědnosti, nepravdivá tvrzení o kvalifikovaném elektronickém podpisu, lživé deklarace o „0-PII“ či nepodloženém kryptografickém auditu).
4. **Respektoval skutečný data flow a bezpečnostní hranice** implementované v backendu (MinIO S3 storage, ClamAV antivirus, Mailcow SMTP, Google Gemini / Grok / Groq AI resilience, deterministický a regexový PrivacyFilter).
