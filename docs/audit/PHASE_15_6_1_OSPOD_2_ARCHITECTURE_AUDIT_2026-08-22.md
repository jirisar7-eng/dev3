FÁZE 15.6.1 — OSPOD 2.0 ARCHITEKTONICKÝ AUDIT

Datum: 2026-08-22
Projekt: Táta má právo — dev3
Větev: "feature/subject-registry-moderation"

Stav po FÁZI 15.5

- 283 subjektů celkem
- 227 OSPOD
- 56 ostatních subjektů
- pokryto všech 14 krajů ČR
- OSPOD dataset: "src/data/ospodDataset.json"
- import: "src/scripts/importOspody.ts"

Existující architektura

Funkce| Stav| Soubor / routa| DB změna
OSPOD registr| ANO| "/api/subjekty", "subjektService.ts"| NE
OSPOD detail| ANO| "SubjektDetailModal.tsx"| NE
Mapa| ANO| "SubjektyMap.tsx", "MapaSubjektuView.tsx"| NE
Osobní spis| ANO| "CaseFile", "clientCaseService.ts"| NE
OSPOD timeline| ANO| "CaseTimelineItem"| NE
BIFF| ANO| "CoParentHubView.tsx", "biffEngine.ts"| NE
Wiki| ANO| "WikiView.tsx"| NE

Databázový audit

"CaseFile" již obsahuje "userId" a "metadata Json?".

"CaseTimelineItem" podporuje "type = OSPOD_CONTACT" a "metadata Json?".

"CaseDocument" podporuje kategorii "OSPOD".

Závěr: DB migrace pro OSPOD 2.0 není potřeba.

Bezpečnost

- veřejné "/api/subjekty" nesmí vracet soukromá data CaseFile,
- OSPOD kontakty uložené ve spise jsou pouze soukromé,
- přístup k CaseFile musí ověřovat "req.user.id",
- ochrana proti IDOR/BOLA je povinná,
- osobní poznámky otců nesmí být součástí veřejného registru,
- osobní údaje pracovníků OSPOD pouze z ověřených veřejných zdrojů.

Navržený tok

"Registr OSPOD → Detail → Jak komunikovat → Checklist → Kontakt → CaseFile → OSPOD_CONTACT → BIFF"

Priority

P0

- rozšířit OSPOD detail,
- přidat komunikaci s OSPOD,
- checklist přípravy,
- uložení kontaktu do Osobního spisu,
- bezpečnostní ownership kontrola.

P1

- ORP/spádovost,
- propojení Wiki a Akademie,
- BIFF pro komunikaci s OSPOD,
- přehled kontaktů v timeline.

P2

- PDF checklist,
- rozšířené analytické přehledy.

Doporučené soubory

- "src/components/public/SubjektDetailModal.tsx"
- "src/components/public/MapaSubjektuView.tsx"
- "src/components/wiki/WikiView.tsx"
- "src/components/coparent/CoParentHubView.tsx"
- "src/services/clientCaseService.ts"

Výsledek

ARCHITECTURE_AUDIT: PASS

DB_MIGRATION_REQUIRED: NO

IMPLEMENTATION_STATUS: NOT_STARTED
