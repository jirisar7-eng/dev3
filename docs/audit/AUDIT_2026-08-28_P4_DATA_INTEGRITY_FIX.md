# Audit Report: P4 Legislativa Data Integrity Fix
Datum: 2026-08-28

## Účel
Oprava modulu P4 (Sněmovní tisky & Legislativní návrhy) tak, aby UI nikdy nezobrazovalo synteticky nebo chybně doplněná data jako 'Invalid Date', 'č. Sb.', aktuální datum nebo automaticky dosazeného předkladatele ('Ministerstvo spravedlnosti ČR').

## Výchozí stav
Normalizátor `ELegislativaConnector` fallbackoval na falešná data (`new Date()`, 'Ministerstvo spravedlnosti ČR'), a měl chybnou logiku pro vyhodnocení `cisloTisku` (nesprávně prioritizoval parsování z IRI a zcela ignoroval dodané hodnoty cisloTisku/kod, pokud bylo k dispozici IRI). Frontend navíc renderoval napevno `č. [undefined] Sb.`, pokud API vracelo jiný klíč (`actCodeAffected` místo `relatedActCode`), což v UI tvořilo defektní zobrazení.

## Provedené změny
1. **`src/services/stateAdmin/ELegislativaConnector.ts`**:
   - Odstraněna `new Date()` fallback logika. Nyní se používá vrácené datum nebo bezpečné 'Neuvedeno'.
   - Přidána validace (Date.parse), která efektivně brání pozdějšímu renderingu 'Invalid Date'.
   - Odstraněn automatický fallback na 'Ministerstvo spravedlnosti ČR', nastaveno 'Neuvedeno'.
   - Zásadně opravena parser logika čísla tisku: prioritně se čte `cisloTisku`, poté `kod`, a až pak se použije fallback na parsování `iri`. 
2. **`src/components/public/StateLawsView.tsx`**:
   - Rozhraní `LegislativeBill` upraveno tak, aby reflektovalo skutečný backend payload (`actCodeAffected`, `sourceUri`).
   - Přepsán rendering 'Dotčeného zákona'. Podřetězec 'č. XX Sb.' se tiskne pouze, pokud reálná hodnota kódu existuje. V opačném případě se vykreslí 'Neuvedeno'.
   - Opraven link na zobrazení detailu (nyní podporuje klíč `sourceUri` i legacy `sourceUrl`).
3. **`tests/p4-legislativa-data-integrity.test.ts`**:
   - Přidán nový deterministický unit test ověřující zero-synthetic logiku a korektní prioritu polí čísla tisku.

## Změněné soubory
- `src/services/stateAdmin/ELegislativaConnector.ts`
- `src/components/public/StateLawsView.tsx`
- `tests/p4-legislativa-data-integrity.test.ts`

## Bezpečnostní a Regresní Rizika
- **Změna Payload Klíčů**: Minimální, zajištěna zpětná kompatibilita v JSX (např. `sourceUrl || sourceUri`).
- **Nebyly odstraněny žádné bezpečnostní kontroly** a nebyly přidány žádné secrets.

## Výsledný stav
Všechny P4 fallbaky byly odstraněny. Testy, build i lint prošly úspěšně. Data získávaná z e-Legislativa API se nyní zobrazují s vysokou integritou bez syntetických zásahů.
