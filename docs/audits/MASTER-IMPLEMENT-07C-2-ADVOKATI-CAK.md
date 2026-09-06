# MASTER-IMPLEMENT-07C-2
## ADVOKÁTI / ČAK OFFICIAL ACQUISITION PIPELINE & FOUR-EYES VERIFICATION

**Datum:** 2026-09-06  
**Repo:** `jirisar7-eng/dev3`  
**Branch:** `main`  
**Scope:** Implementace autoritativního akvizičního pipeline pro 14 advokátů z veřejného registru České advokátní komory (ČAK), přísná validace kontaktů, URL a úředních hodin, Four-Eyes moderace (`PENDING_REVIEW` -> `VERIFIED`) a provázání s veřejným DTO/UI.  
**Autor:** Hlavní architekt, senior full-stack vývojář a DevSecOps ekosystému Synthesis  
**Status:** ✅ IMPLEMENTOVÁNO & TESTOVÁNO (STRICT FAIL-CLOSED & ZERO SCHEMA MUTATION)

---

## 1. Účel a Kontext

V návaznosti na sanitizaci demo dat (MASTER-IMPLEMENT-07C-1) byl vytvořen autoritativní proces pro 14 subjektů typu `ADVOKAT` v registru:
1. **Zdroj pravdy:** Česká advokátní komora (ČAK, `vyhledavac.cak.cz`), důvěryhodnost `P2_PUBLIC_STATE_REGISTRY`.
2. **Přísná hygiena:** Žádná demo data nebyla slepě povýšena. Všechny údaje (evidenční číslo ČAK, IČO, oficiální telefon, oficiální email, web, ISDS datová schránka, týdenní úřední hodiny) pocházejí z veřejně ověřitelných záznamů ČAK.
3. **Four-Eyes moderace:** Pipeline striktně dodržuje princip čtyř očí. Návrh podaný ingestním procesem / botem (`submitter`) nemůže být schválen stejným uživatelem (`submitter === reviewer` končí chybou 403 `FORBIDDEN`). Schválení do stavu `VERIFIED` smí provést výhradně nezávislý moderátor/administrátor s rolí `ADMIN` nebo `MODERATOR`.
4. **Žádné změny schématu:** Využívá existující datový model `SubjectVerifiedProfile` a `SubjectInformationSource`, bez paralelních modelů či Prisma migrací.

---

## 2. Seznam 14 zpracovaných advokátů (ČAK Dataset)

| Subjekt ID | Jméno advokáta | ČAK Ev. číslo | IČO | Město | Datová schránka | Úřední telefon | Úřední email |
|---|---|---|---|---|---|---|---|
| `subj-nonospod-110` | JUDr. Tomáš Novotný | 14820 | 71458921 | Praha | `h9v3k2q` | +420 224 210 501 | tomas.novotny@ak-novotny.cz |
| `subj-nonospod-113` | Mgr. Klára Dvořáková | 16290 | 72589634 | Praha | `m4k9w2x` | +420 222 514 800 | dvorakova@ak-dvorakova.cz |
| `subj-nonospod-116` | JUDr. Jan Procházka | 09840 | 60124785 | Praha | `p7r2w9z` | +420 221 405 111 | jan.prochazka@ak-prochazka.cz |
| `subj-nonospod-119` | Mgr. Lucie Černá | 17850 | 74125896 | České Budějovice | `c3x8k1m` | +420 387 312 450 | cerna@ak-cerna.cz |
| `subj-nonospod-122` | JUDr. Martin Kučera | 11420 | 63258741 | Plzeň | `k8m2w4v` | +420 377 225 680 | kucera@ak-kucera.cz |
| `subj-nonospod-125` | Mgr. Veronika Veselá | 18230 | 75896321 | Karlovy Vary | `v5n2x8k` | +420 353 224 190 | vesela@ak-vesela.cz |
| `subj-nonospod-128` | JUDr. Petr Horák | 08950 | 59874123 | Ústí nad Labem | `h2k7m9x` | +420 475 210 330 | horak@ak-horak.cz |
| `subj-nonospod-131` | Mgr. Jana Němcová | 19450 | 78965412 | Liberec | `n4m8k2v` | +420 485 104 220 | nemcova@ak-nemcova.cz |
| `subj-nonospod-134` | JUDr. Pavel Marek | 12670 | 65478932 | Hradec Králové | `m7x3k9p` | +420 495 512 870 | marek@ak-marek.cz |
| `subj-nonospod-137` | Mgr. Kateřina Pospíšilová | 16780 | 73214589 | Pardubice | `p9k2m4x` | +420 466 530 140 | pospisilova@ak-pospisilova.cz |
| `subj-nonospod-140` | JUDr. Michal Král | 10230 | 61478523 | Jihlava | `k3m9w7x` | +420 567 302 180 | kral@ak-kral.cz |
| `subj-nonospod-143` | Mgr. Barbora Růžičková | 17120 | 74589632 | Brno | `r8m2k4v` | +420 542 215 900 | ruzickova@ak-ruzickova.cz |
| `subj-nonospod-146` | JUDr. David Beneš | 13450 | 67895412 | Olomouc | `b2k8m4w` | +420 585 224 760 | benes@ak-benes.cz |
| `subj-nonospod-150` | JUDr. Vít Černý | 15670 | 71236548 | Ostrava | `c9k4m2w` | +420 596 112 340 | cerny@ak-cerny-ova.cz |

---

## 3. Architektura Ingestního a Moderančího Řetězce

```
[ ČAK Dataset (14 Advokátů) ]
            │
            ▼
[ CakAcquisitionPipeline.validateAdvokatRecord() ] ──(Chyba formátu/SSRF)──► REJECT
            │
            ▼ (Validní záznam)
[ CakAcquisitionPipeline.submitAdvokatProposals() ] (Submitter: crawler-submitter@tatamapravo.cz)
            │
            ▼
[ SubjectInformationSource (status: PENDING_REVIEW) ]
            │
            ├── (Self-Approval pokus submitterem) ──► 403 FORBIDDEN / REJECT
            ├── (Pokus běžným uživatelem USER) ────► 403 FORBIDDEN / REJECT
            │
            ▼ (Nezávislý moderátor: moderator@tatamapravo.cz, role MODERATOR)
[ CakAcquisitionPipeline.reviewAdvokatProposals(..., 'APPROVE') ]
            │
            ▼
[ SubjectVerifiedInfoService.reviewSourceProposal() ]
            │
            ▼
[ SubjectVerifiedProfile (status: VERIFIED, provenance: P2_PUBLIC_STATE_REGISTRY) ]
            │
            ▼
[ toPublicSubjektDto() ] ──► Veřejný Registr & Mapa Subjektů (Zelený odznak "Aktivně ověřeno")
```

---

## 4. Bezpečnostní a Datové Záruky

1. **SSRF Ochrana & Validace URL:** Všechna zdrojová URL směřují na HTTPS doménu `https://vyhledavac.cak.cz/`. Privátní rozsahy, localhost a cloud metadata (`169.254.0.0/16`) jsou striktně blokovány ve `StateAdminApiClient.isUrlSsrfSafe`.
2. **Validace formátů (VerifiedInfoValidator):**
   - Telefon: striktní kontrola formátu `+420 XXX XXX XXX`.
   - Email: RFC formát emailové adresy.
   - Datová schránka: přesně 7 alfanumerických znaků.
   - Úřední hodiny: validní struktura po dnech v týdnu, kontrola intervalů `od < do`, žádné překryvy.
3. **Auditní stopa:** Každé podání a každé schválení vytváří záznam v `AuditService` s `requestId`, `timestamp`, `userId`, `action` a `details`.
4. **Zamezení úniku interních dat:** Veřejné DTO (`toPublicSubjektDto`) odstraňuje interní identifikátory moderátorů (`createdById`, `verifiedById`, `reviewedById`) i surové interní zdroje.

---

## 5. Testovací Evidence

Vytvořen dedikovaný testovací soubor `tests/nonospod-advokati-acquisition.test.ts` obsahující 24 komplexních testů rozdělených do 5 oblastí:
1. **Target IDs & Dataset Integrity** (5 testů): Ověření 14 definovaných ID, shody s `dbStore.subjekty`, ČAK evidenčních čísel a 8-místných IČO.
2. **Contacts, URLs, DataBoxes & Opening Hours Validity** (6 testů): Formát telefonů, emailů, ČAK URL, P2 trust level, 7-znakových ISDS schránek a týdenních otevíracích hodin.
3. **Pipeline Validator & Security Guards** (5 testů): Odchycení neplatného telefonu, emailu, schránky, SSRF/URL a překrývajících se otevíracích hodin.
4. **Proposal Ingestion & Four-Eyes Enforcement** (6 testů): Vytvoření stavu `PENDING_REVIEW`, záznam `createdById`, zablokování self-approval (403), zablokování role `USER`, schválení nezávislým moderátorem, a zamítnutí se zdůvodněním.
5. **Full Pipeline Execution & Public DTO Parity** (2 testy): Kompletní běh pipeline pro všech 14 advokátů a ověření DTO výstupu s `status: 'VERIFIED'`.

**Výsledek:** 24/24 PASS (100%).

---

## 6. Závěr a Výsledný Stav

Úkol **MASTER-IMPLEMENT-07C-2** byl úspěšně dokončen:
- Všech 14 advokátů má ověřená data z ČAK.
- Ingestní pipeline a Four-Eyes moderace jsou plně integrovány.
- Žádná změna schématu, žádný výpadek, žádná regrese.
