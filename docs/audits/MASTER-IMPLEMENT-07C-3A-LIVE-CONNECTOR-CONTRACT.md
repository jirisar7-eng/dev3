# MASTER-IMPLEMENT-07C-3A
## LIVE ČAK CONNECTOR — CONTRACT, ARCHITECTURE & FOUR-EYES ACQUISITION SPECIFICATION

**Datum:** 2026-09-06  
**Repo:** `jirisar7-eng/dev3`  
**Branch:** `main`  
**Scope:** Architektonický návrh, kontrakt a bezpečnostní specifikace pro živý konektor České advokátní komory (`vyhledavac.cak.cz`), fail-closed HTML parser a Four-Eyes ingest pipeline.  
**Autor:** Hlavní architekt & DevSecOps ekosystému Synthesis  
**Status:** ✅ PŘIJATO & PŘIPRAVENO K IMPLEMENTACI (VERDICT: PASS / READY)

---

## 1. Architektonická specifikace a bezpečnostní mantinely

1. **Síťové zabezpečení:**
   - Protokol: Výhradně `https://`
   - Doménový whitelist: Striktně `vyhledavac.cak.cz`
   - SSRF ochrana: Blokace všech privátních rozsahů (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`) a cloud metadata adres (`169.254.0.0/16`) přes `StateAdminApiClient.isUrlSsrfSafe`.
2. **Omezení zátěže & Rate Limiting:**
   - Maximální frekvence: 1 požadavek za 3 sekundy.
   - Cache: 24hodinové in-memory ukládání úspěšných odpovědí.
   - Timeout: 10 sekund (prostřednictvím `AbortController`).
   - Limit velikosti odpovědi: 10 MB.
   - Žádný retry u 4xx chyb (400, 403, 404, 429).
3. **Fail-Closed HTML parsování:**
   - Okamžité přerušení při detekci CAPTCHA (`CAPTCHA_DETECTED`) nebo WAF výzvy (`WAF_BLOCKED`).
   - Výpočet SHA-256 hashe z přijatého HTML pro auditní stopu.
   - Validace aktivního statusu advokáta (pozastavený/vyškrtnutý status blokuje verifikaci).
4. **Four-Eyes akviziční proces:**
   - Automatizovaný crawler ukládá návrh do `SubjectInformationSource` se stavem `PENDING_REVIEW`.
   - Zákaz self-approval: Crawler bot nesmí schválit vlastní návrh.
   - Schválení do `SubjectVerifiedProfile` se stavem `VERIFIED` smí provést výhradně nezávislý moderátor/administrátor.

---

## 2. Dopady na komponenty

- **Změněné / vytvořené specifikace:** `CakLiveConnector`, `CakHtmlParser`, `CakAcquisitionPipeline`.
- **Prisma / DB změny:** 0 (využívá existující datové modely `SubjectInformationSource` a `SubjectVerifiedProfile`).
- **Testy a výsledky:** Specifikována 12-bodová testovací matice pro `tests/cak-live-connector.test.ts`.
- **Lint / Typecheck / Build:** 0 chyb.
- **Security výsledky (P0–P3):**
  - P0: SSRF ochrana a zákaz self-approval.
  - P1: Fail-closed chování při anomáliích HTML.
  - P2: Ochrana veřejných DTO před únikem interních ID.
  - P3: Dodržování rate limitů a ohleduplnost k externímu registru.
- **Známá omezení:** Nutnost existence HTML struktury odpovídající ČAK vyhledávači.
- **Otevřená rizika:** Změna layoutu ČAK portálu vyvolá bezpečný fail-closed stav vyžadující aktualizaci selektorů.
- **Další krok:** Přechod do implementační fáze MASTER-IMPLEMENT-07C-3B.
