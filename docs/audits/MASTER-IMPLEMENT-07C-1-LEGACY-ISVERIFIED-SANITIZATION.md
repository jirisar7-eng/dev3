# MASTER-IMPLEMENT-07C-1
## LEGACY isVerified SANITIZATION & VERIFICATION BADGE FIX

**Datum:** 2026-09-06  
**Repo:** `jirisar7-eng/dev3`  
**Branch:** `main`  
**Scope:** Odstranění bezpečnostní a sémantické kolize mezi legacy polem `Subjekt.isVerified` a autoritativním stavem `SubjectVerifiedProfile.status === "VERIFIED"`. Sanitizace 44 demo non-soudních subjektů a oprava veřejného UI odznaku ověření.  
**Autor:** Hlavní architekt, senior full-stack vývojář a DevSecOps ekosystému Synthesis  
**Status:** ✅ IMPLEMENTOVÁNO & TESTOVÁNO (STRICT FAIL-CLOSED)

---

## 1. Účel a Kontext

V předchozím stavu existovala nebezpečná sémantická kolize:
1. **Legacy boolean `Subjekt.isVerified`:** Vznikl při počátečním návrhu schématu a byl nekontrolovaně nastaven na `true` v demo sadě 44 non-soudních subjektů (`ZNALEC`, `ADVOKAT`, `PORADNA_CHARITA` v `src/data/nonOspodSubjekty.ts`).
2. **Autoritativní systém `SubjectVerifiedProfile`:** Zaveden v rámci GAP-01 / MASTER-IMPLEMENT-05A/07A pro státem a justicí ověřené úřední profily s kompletní provenancí (`SubjectInformationSource`, ARES, justice.cz, ISDS) a stavem `VERIFIED` / `STALE` / `PENDING_REVIEW` / `REJECTED`.
3. **Chyba ve veřejném mapovém UI (`MapaSubjektuView.tsx`):** V hlavičce detailu subjektu byl odznak ověření (*Ověřený subjekt*) podmíněn starým booleanem `detailSubjekt.isVerified`, což vedlo k tomu, že 44 neověřených demo subjektů se na mapě mylně zobrazovalo s odznakem ověření, ačkoliv neměly žádný `SubjectVerifiedProfile` ani úřední zdrojové ověření.

Tento úkol (**MASTER-IMPLEMENT-07C-1**) tuto kolizi definitivně odstranil:
- 44 non-soudních subjektů bylo sanitizováno na `isVerified: false`.
- Veřejný odznak ověření byl striktně navázán na `verifiedProfile?.status === 'VERIFIED'`.
- Byla zachována zásada Fail-Closed: bez autoritativního profilu ve stavu `VERIFIED` se žádný veřejný odznak nezobrazí.

---

## 2. Provedené změny

### A. Sanitizace demo dat (`src/data/nonOspodSubjekty.ts`)
- Všech 44 záznamů v poli `otherSubjekty` (16 znalců, 14 advokátů, 14 poraden/charit) bylo upraveno z `"isVerified": true` na `"isVerified": false`.
- Žádný z těchto 44 subjektů nemá `SubjectVerifiedProfile` ani `SubjectInformationSource`, což přesně odpovídá jejich reálnému neověřenému demo statusu.

### B. Oprava veřejného mapového detailu (`src/components/public/MapaSubjektuView.tsx`)
- V komponentě `MapaSubjektuView` (řádek 965) byla podmínka pro vykreslení odznaku:
  ```tsx
  // PŮVODNÍ STAV (Chybný):
  {detailSubjekt.isVerified && (
    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-bold">
      <ShieldCheck className="w-3.5 h-3.5" />
      <span>Ověřený subjekt</span>
    </span>
  )}
  ```
  nahrazena autoritativním a bezpečným pravidlem:
  ```tsx
  // NOVÝ STAV (Bezpečný & autoritativní):
  {detailSubjekt.verifiedProfile?.status === 'VERIFIED' && (
    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-bold">
      <ShieldCheck className="w-3.5 h-3.5" />
      <span>Ověřený subjekt</span>
    </span>
  )}
  ```

### C. Verifikace Registru subjektů (`src/components/public/RegistrSubjektu.tsx`)
- Komponenta `RegistrSubjektu` již v předchozím kroku MASTER-IMPLEMENT-07B striktně pracovala s `item.verifiedProfile.status === 'VERIFIED'` pro odznak *Aktivně ověřeno* a `item.verifiedProfile.status === 'STALE'` pro *K přezkoumání*.
- V `RegistrSubjektu` se legacy pole `isVerified` pro veřejné odznaky vůbec nepoužívá.

### D. Ověření backend DTO sanitizace (`src/services/subjektService.ts`)
- Funkce `toPublicSubjektDto()` byla ověřena:
  - Interní auditní metadata (`createdById`, `verifiedById`, `rejectedById`, `rejectionReason`, surové `informationSources`) jsou striktně odstraňována.
  - Profily se stavem `PENDING_REVIEW` a `REJECTED` jsou sanitizovány na `verifiedProfile = null`.
  - Profily se stavem `STALE` jsou ponechány s příznakem `status: 'STALE'`.

---

## 3. Matice stavů a autoritativní pravidla (8 případů)

| # | Stav `Subjekt.isVerified` | Stav `verifiedProfile.status` | Výsledek ve veřejném API (DTO) | Veřejný odznak ověření v UI | Odůvodnění |
|---|---|---|---|---|---|
| 1 | `true` | *(žádný profil)* | `verifiedProfile: undefined` | ❌ NE | Legacy boolean ignorován; chybí autoritativní profil. |
| 2 | `false` | *(žádný profil)* | `verifiedProfile: undefined` | ❌ NE | Neověřený subjekt. |
| 3 | `true` | `PENDING_REVIEW` | `verifiedProfile: null` | ❌ NE | Návrh čekající na schválení nesmí být veřejný. |
| 4 | `true` | `REJECTED` | `verifiedProfile: null` | ❌ NE | Zamítnutý profil nesmí být veřejný. |
| 5 | `true` | `STALE` | `verifiedProfile.status = 'STALE'` | ⚠️ POUZE "K přezkoumání" | Není aktivně ověřeno, pouze varovný štítek. |
| 6 | `false` | `VERIFIED` | `verifiedProfile.status = 'VERIFIED'` | ✅ ANO (*Aktivně ověřeno*) | Autoritativní profil má přednost před legacy booleanem. |
| 7 | `false` / `true` | `VERIFIED` + interní audit IDs | `createdById`, `verifiedById` stripped | ✅ ANO | Zabezpečení proti úniku interních ID moderátorů. |
| 8 | `false` (44 non-soud) | *(žádný profil)* | `verifiedProfile: undefined` | ❌ NE | Všech 44 demo non-soudních subjektů je unverified. |

---

## 4. Testovací evidence (QA & Security)

### A. Integrační testy: `tests/mapa-subjektu-verified-profile-geocode.test.ts`
Spuštěno 17 testů ve 5 testovacích suitách — **17/17 PASS (100%)**:
1. **Public DTO Security & Metadata Leak Prevention** (3 testy) — PASS
2. **UI Contract & Map Detail Component (MapaSubjektuView)** (1 test) — PASS
3. **Geocode Rate Limiting & Security (GAP-03)** (3 testy) — PASS
4. **Authoritative Verification Status & Demo Data Sanitization (MASTER-IMPLEMENT-07C-1)** (10 testů):
   - Case 1: `isVerified=true` + no profile -> `verifiedProfile: undefined` (PASS)
   - Case 2: `isVerified=false` + no profile -> `verifiedProfile: undefined` (PASS)
   - Case 3: `isVerified=true` + `PENDING_REVIEW` -> stripped na `null` (PASS)
   - Case 4: `isVerified=true` + `REJECTED` -> stripped na `null` (PASS)
   - Case 5: `isVerified=true` + `STALE` -> zachováno se statusem `STALE` (PASS)
   - Case 6: `isVerified=false` + `VERIFIED` -> zobrazen autoritativní odznak (PASS)
   - Case 7: `VERIFIED` profile + interní IDs -> všechna interní audit data odstraněna (PASS)
   - Case 8: Všech 44 non-soudních subjektů v `nonOspodSubjekty.ts` má `isVerified: false` a žádný profil (PASS)
   - Case 9: Statická kontrola `MapaSubjektuView.tsx` na `verifiedProfile?.status === 'VERIFIED'` (PASS)
   - Case 10: Statická kontrola `RegistrSubjektu.tsx` na `verifiedProfile.status === 'VERIFIED'` (PASS)

### B. Regresní testy souvisejících komponent
- `tests/mapa-subjektu-advanced-filters.test.ts` + `tests/soudy-data-population.test.ts` — **21/21 PASS (100%)**

---

## 5. Závěr a soulad se systémovými principy

- **Fail-Closed & Zero Trust:** Žádný subjekt nemůže získat veřejné označení ověření bez platného `SubjectVerifiedProfile` se statusem `VERIFIED`.
- **Integrita dat:** Žádná fake nebo simulovaná produkční data; demo subjekty jsou transparentně označeny jako neověřené.
- **Bezpečnost (P0):** Interní moderátorské identity a auditní logy jsou striktně chráněny server-side DTO sanitizací.
- **Nenarušení schématu:** Žádná destruktivní změna DB, žádná neautorizovaná Prisma migrace, žádný deployment.
