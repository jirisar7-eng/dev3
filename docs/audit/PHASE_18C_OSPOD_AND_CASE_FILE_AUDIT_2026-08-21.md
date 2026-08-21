# AUDIT: Fáze 18C — OSPOD + PRÁCE SE SPISEM

## Metadáta
- **Datum:** 2026-08-21
- **Fáze:** 18C
- **Úkol:** Přidat průvodce jednáním s OSPOD a práci s opatrovnickým/souvisejícím spisem.

## Původní požadavek / Cíl
- Vytvořit nebo rozšířit průvodce "Jednání s OSPOD".
- Vytvořit praktický checklist "Sociální šetření".
- Vytvořit průvodce "Nahlížení do opatrovnického a správního spisu".
- Zkontrolovat dostupnost vzoru žádosti o nahlédnutí do spisu.
- Zahrnout AI disclaimery a právní disclaimery.
- Omezit funkcionalitu na bezpečné a veřejné postupy, zachovat PWA restrikce (není cachována soukromá/případová data).

## Výchozí stav (Před implementací)
- Byly dostupné základní veřejné právní průvodce a AI generátor vzorů (`AiFormsView.tsx`).
- OSPOD šetření a podrobná příprava na nahlížení do spisu nebyly formálně a komplexně popsány.
- Formulář pro žádost o nahlížení do spisu *již byl dostupný* v rámci `AiFormsView.tsx` pod ID `nahlednuti-spis`.

## Provedené změny
- **Nový modul: Průvodce OSPOD (`src/components/public/legal/OspodGuideView.tsx`)**:
  - Role kolizního opatrovníka, komunikace, práva a povinnosti rodiče, řešení chyb, námitka podjatosti.
  - Vložen praktický "Checklist sociálního šetření" (zajištění bezpečí, klidu a relevantních dokladů bez vytváření falešného obrazu).
  - Vloženy právní disclaimery a odkazy na zákony (z.ř.s., z. o SPOD).
  
- **Nový modul: Práce se spisem (`src/components/public/legal/CaseFileGuideView.tsx`)**:
  - Vysvětlena propast mezi správním spisem (OSPOD) a soudním spisem.
  - Vytvořen manuál pro žádost, chronologii dokumentů, separaci faktů od tvrzení, hledání rozporů, a přípravu podkladů pro advokáta.
  - Odkaz do generátoru formulářů pro podání žádosti o nahlížení.
  - Vložena důležitá "Důležité upozornění pro AI" (disclaimer).

- **Routing a PWA (`src/components/public/PublicPortal.tsx`, `public/sw.js`)**:
  - Obě komponenty exportovány z `src/components/public/legal/index.ts`.
  - Nové endpointy namapovány na existující `PublicPortal.tsx`: `/ospod`, `/socialni-setreni`, `/spis`, `/nahlizeni-do-spisu`, `/case-file`.
  - Aktualizován `sw.js` (a v rámci toho verze CACHE) tak, aby obsluhoval tyto nové statické URL v offline režimu jako App Shell fallback.

## Vzor žádosti
- Potvrzen existující vzor v sekci AI Formuláře (Kategorie "Soudní úkony", položka: "5. Žádost o nahlédnutí do opatrovnického spisu a kopie (§ 44 o.s.ř.)"). Není potřeba ho duplikovat. Vzor je propojen z `CaseFileGuideView`.

## Bezpečnostní rizika a mitigace (Security PASS)
- **AI Disclaimery:** Jasně přítomny u každé zmínky o AI, AI nesmí měnit dokumenty, nenahrazuje advokáta.
- **Právní Disclaimery:** Jasně uvedeno, že jde o nezávazný návod, doplněno konkrétními § k nahlížení (Zákon 99/1963 Sb. o.s.ř. a Zákon 359/1999 Sb.).
- **Cache Poisoning / PWA:** Nové routy zařazeny striktně mezi povolené offline cesty. Soukromá data nejsou nadále dostupná offline.

## Zdroje
- Ministerstvo práce a sociálních věcí (MPSV), Metodiky OSPOD.
- Zákon č. 99/1963 Sb. (o.s.ř.), Zákon č. 359/1999 Sb. (z. o SPOD), Instrukce Ministerstva spravedlnosti.
- Aktuálnost ověřena k: Srpen 2026.

## Testy a regrese (Regression PASS)
- **Authentication:** PASS
- **MFA:** PASS
- **RBAC:** PASS
- **BOLA/IDOR:** PASS
- **AI Security:** PASS
- **Offline UX:** PASS
- **npm test:** PASS
- **npm run lint:** PASS
- **npm run build:** PASS

## Známá omezení a TODO
- Checklist je uložen pouze ve stavu dané komponenty, nenapojuje se na persistentní databázi (dle zadání a security konvence nepoužívat zbytečně IndexedDB/Sync Queue).
