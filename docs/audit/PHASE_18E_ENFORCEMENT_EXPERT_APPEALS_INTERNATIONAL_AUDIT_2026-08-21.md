# AUDIT: Fáze 18E — VÝKON ROZHODNUTÍ, ZNALECKÉ POSUDKY, OPRAVNÉ PROSTŘEDKY A MEZINÁRODNÍ SPORY

## Metadáta
- **Datum:** 2026-08-21
- **Fáze:** 18E
- **Úkol:** Doplnit chybějící právně-informační funkce do veřejného portálu.

## Původní požadavek / Cíl
- Zpracovat oblasti: výkon rozhodnutí (maření styku), znalecké posudky, opravné prostředky (odvolání, dovolání, ústavní stížnost), ÚMPOD a mezinárodní spory o dítě.
- Nevytvářet duplicitní obsah.
- Neimplementovat nové autentizační/autorizační služby, ponechat zabezpečení.
- Zabezpečit PWA a off-line režim.

## Výchozí stav (Před implementací)
- Zmapován existující obsah (`AgendaView.tsx`, `CourtGuideView.tsx`, atd.). Výkon rozhodnutí a znalecké posudky byly jen letmo zmíněny v časové ose (`AgendaView`). Detailní průvodci těmito krizovými částmi chyběli. 

## Provedené změny
- **Nový obsah (React Komponenty v `src/components/public/legal/`):**
  - **`EnforcementGuideView.tsx`:** Vymáhání práva na styk (jak dokumentovat, význam faktů, výkon rozhodnutí podle § 500 z.ř.s., ukládání pokut, role policie vs OSPOD).
  - **`ExpertReportsGuideView.tsx`:** Průvodce znaleckým zkoumáním, doporučení ke komunikaci se znalcem (neurčovat diagnózy druhým), možnost revizního posudku.
  - **`AppealsGuideView.tsx`:** Odvolání k odvolacímu soudu (15 dnů), dovolání k NS a ústavní stížnost k ÚS (upozornění na povinné advokátní zastoupení).
  - **`InternationalDisputesGuideView.tsx`:** Mezinárodní spory o dítě, role Haagské úmluvy, zdůraznění role a pomoc ÚMPOD, vymezení pojmu únos v opatrovnictví.
- **Aktualizace `PublicPortal.tsx`:** Přidáno dynamické routování k těmto novým průvodcům (pod různými klíčovými slovy jako `/vykon-rozhodnuti`, `/znalci`, `/odvolani`, `/umpod`).
- **PWA a Offline:** Nové URL adresy zařazeny do seznamu bezpečných `OFFLINE_PUBLIC_ROUTES` v souboru `public/sw.js`.
- **Právní disclaimery:** Každá komponenta obsahuje varování o nutnosti advokátního zastoupení (zejména v otázkách odvolání, únosů dětí a revizních posudků).
- **Zdroje:** Pečlivě specifikováno na úrovni jednotlivých pohledů (z.ř.s., o.s.ř., Z.M.P.S., Haagská úmluva, Ministerstvo spravedlnosti, ÚMPOD). Zdroje ověřeny k: Srpen 2026.

## Testy a regrese (Regression PASS)
- **Authentication / MFA / RBAC:** Beze změny (PASS)
- **AI Security & BOLA/IDOR:** Beze změny (PASS)
- **Rate limiting & Audit logging:** Beze změny (PASS)
- **Calculator:** Beze změny (PASS)
- **PWA / Offline:** Rozšířeno, routy se cachují (PASS)
- **npm test, lint, build:** PASS (Test Runner potvrdil úspěch)

## Známá omezení a TODO
- Tento obsah je výhradně statický a veřejný, nezpracovává formuláře (při potřebě formuláře uživatelé přejdou do stávajícího `AiFormsView`).
