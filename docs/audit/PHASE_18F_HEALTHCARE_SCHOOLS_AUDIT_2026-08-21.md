# AUDIT: Fáze 18F — ZDRAVOTNICTVÍ A ŠKOLSTVÍ

## Metadáta
- **Datum:** 2026-08-21
- **Fáze:** 18F
- **Úkol:** Doplnit chybějící právně-informační funkce do veřejného portálu ohledně zdravotní péče o děti, komunikace se školou/školkou a příslušné vzory.

## Původní požadavek / Cíl
- Vytvořit obsah řešící práva rodičů ve zdravotnictví (nahlížení do dokumentace, právo na informace, OČR, psychologická péče) a ve školství (informace o prospěchu, EduPage/Bakaláři, omluvenky, třídní schůzky, výdaje).
- Vytvořit související vzory pro žádosti řediteli školy a poskytovateli zdravotních služeb (pediatrovi).
- Zabezpečit PWA a offline funkcionalitu.
- Neimplementovat žádné nové backendové či diagnostické nástroje.

## Výchozí stav (Před implementací)
- Proběhl audit. Zjistili jsme, že zdravotnictví a školství nebyly ve veřejné části `legal` či `ai` podrobněji specifikovány, vzory chyběly. Architektura formulářů (AiFormsView) a portálu ale umožňovala snadné přidání nových komponent a šablon.

## Provedené změny
- **Nový obsah (React Komponenty v `src/components/public/legal/`):**
  - **`HealthcareGuideView.tsx`:** Vysvětluje práva rodičů ve zdravotní péči, postup při získávání zdravotnické dokumentace, upozorňuje na rizika diagnostikování druhého rodiče ("PAS" atp.) a vysvětluje nárok otců na OČR.
  - **`SchoolsGuideView.tsx`:** Věnuje se právu obou rodičů na informace o vzdělávání, jak postupovat při získávání přístupu do školních IS (Bakaláři/EduPage), jak řešit případnou snahu jednoho rodiče o jednostrannou změnu školy a jak postupovat ohledně mimořádných školních nákladů.
- **Nové vzory (V `AiFormsView.tsx`):**
  - Zařazena kategorie "Zdravotnictví & Škola".
  - Šablona: "Žádost lékaři o informace o zdravotním stavu dítěte" (s právní oporou § 31 ZZS a o.z.).
  - Šablona: "Žádost řediteli o přístup do školního systému (Bakaláři/EduPage)" (s právní oporou § 21 školského zákona).
- **Aktualizace `PublicPortal.tsx`:** 
  - Vytvořeny cesty: `/zdravotni-pece`, `/zdravotni-dokumentace`, `/ocr`, `/skola`, `/skolka`, `/skolni-informace`, `/zmena-skoly`.
- **PWA a Offline:** 
  - Všechny nové trasy úspěšně a bezpečně přidány do `OFFLINE_PUBLIC_ROUTES` v souboru `public/sw.js`.
- **Právní a zdravotní disclaimery:** 
  - Zakomponována veškerá varování o nemožnosti nahradit lékařskou péči či individuální právní poradenství.

## Testy a regrese (Regression PASS)
- **Authentication / MFA / RBAC:** Beze změny (PASS)
- **AI Security & BOLA/IDOR:** Beze změny (PASS)
- **Rate limiting & Audit logging:** Beze změny (PASS)
- **Calculator:** Beze změny (PASS)
- **PWA / Offline:** Rozšířeno o nové routy, bezpečné (PASS)
- **npm test, lint, build:** PASS (Test Runner potvrdil úspěch)

## Zdroje
- **Zdravotnictví:** Zákon č. 372/2011 Sb. (o zdravotních službách), Zákon č. 187/2006 Sb. (o nemocenském pojištění), Z.č. 89/2012 Sb., ČSSZ. (Aktuálnost srpen 2026).
- **Školství:** Zákon č. 561/2004 Sb. (školský zákon), Z.č. 89/2012 Sb. MŠMT. (Aktuálnost srpen 2026).

## Známá omezení
- Systém nyní funguje primárně staticky (plus generování do prohlížeče). Citlivé údaje (zdravotní dokumenty apod.) se u veřejných formulářů neukládají, uživatel je upozorněn v rámci disclaimers.
