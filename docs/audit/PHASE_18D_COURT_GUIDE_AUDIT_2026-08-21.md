# AUDIT: Fáze 18D — PRŮVODCE OPATROVNICKÝM SOUDEM

## Metadáta
- **Datum:** 2026-08-21
- **Fáze:** 18D
- **Úkol:** Vytvořit komplexního a praktického průvodce soudním opatrovnickým řízením.

## Původní požadavek / Cíl
- Vytvořit nového průvodce "Opatrovnický soud krok za krokem", zamezit duplicitám s `AgendaView.tsx`.
- Vytvořit checklist "Příprava na soudní jednání".
- Detailně rozebrat dokazování, rozhodnutí a odvolání.
- Propojit s existujícími formuláři a kalkulačkou výživného.
- Integrovat AI a legal disclaimers.
- Zabezpečit PWA a offline funkcionalitu.
- Provést regresní testy a chránit security integrity.

## Výchozí stav (Před implementací)
- Existoval `AgendaView.tsx` (časová osa od OSPOD až po odvolání), ale neměl hluboký detail na samotné *chování u soudu*, *dokazování* a *checklist k ústnímu jednání*.
- OSPOD a Case File průvodci vytvořeni v 18C.
- Nástroje `AiFormsView.tsx` a `AlimonyCalculator` plně funkční.

## Provedené změny
- **Nový modul: Průvodce Opatrovnickým soudem (`src/components/public/legal/CourtGuideView.tsx`)**:
  - **Krok za krokem**: Zahrnut accordion rozpad fází: 1. Zahájení, 2. Příprava a dokazování (listiny, výslech, svědci, znalci), 3. Ústní jednání, 4. Rozhodnutí a odvolání (právní moc, vykonatelnost, lhůty).
  - **Příprava na jednání (Checklist)**: Interaktivní seznam (občanský průkaz, chronologie, návrhy důkazů).
  - **Jak vystupovat u soudu**: Pokyny pro věcnou mluvu, potlačení emocí, soustředění na dítě, dělání poznámek. (Zdůrazněno, že jde o základy slušného procesu, nikoliv manipulaci).
  - **Propojení formulářů**: Implementovány button card linky pro *AI Formuláře*, *Kalkulačku výživného* a *Spolurodičovský Hub*.
- **Routing & Offline PWA (`src/components/public/PublicPortal.tsx`, `public/sw.js`)**:
  - Routy `/soud`, `/soudni-rizeni`, `/soudni-pruvodce`, `/court` přidány do Portálu i do `OFFLINE_PUBLIC_ROUTES` v Service Workeru.
- **Disclaimery**:
  - Vložen **Právní disclaimer** (informace nenahrazují advokáta).
  - Vložen **AI disclaimer** (AI může halucinovat, negarantuje soudní výsledek).
  - Do Kalkulačky (uvnitř odkazu) vložen text: "Výsledek je pouze orientační a nepředstavuje rozhodnutí soudu."

## Zdroje a ověření
- **Zdroje:** Zákon č. 89/2012 Sb. (občanský zákoník), Zákon č. 99/1963 Sb. (občanský soudní řád), Ministerstvo spravedlnosti ČR. Upozornění na vývoj opatrovnické judikatury Ústavního soudu.
- **Datum ověření:** Srpen 2026.

## Testy a regrese (Regression PASS)
- **Authentication:** PASS
- **MFA:** PASS
- **RBAC:** PASS
- **BOLA/IDOR:** PASS
- **AI Security:** PASS
- **Offline UX (PWA):** PASS (rozhodovací strom Service Workeru funguje)
- **npm test:** PASS
- **npm run lint:** PASS
- **npm run build:** PASS

## Známá omezení a TODO
- Interaktivní checklist si nepamatuje svůj stav napříč refreshem stránky, což je v souladu se zamezením ukládání dat u veřejných, neautentizovaných nástrojů (pro zachování bezpečí). Pro perzistentní data otcové použijí CoParentHub (Evidence Vault).
