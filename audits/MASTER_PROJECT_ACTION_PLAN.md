# MASTER PROJECT ACTION PLAN

| ID | Úkol | Důvod | Soubor | Priorita | Závislosti | Odhad | Stav |
|---|---|---|---|---|---|---|---|
| 01 | Secure Offline Case Data | Krizová data nejsou v PWA šifrována lokálně (IndexDB). | `clientCaseService.ts` | P0 | PWA Foundation | L | NEZAČATO |
| 02 | B.I.F.F. Komunikátor | Funkce CoParent hubu je pouze placeholder. | `coparentService.ts` | P0 | CoParent Space | M | ROZPRACOVÁNO |
| 03 | Generátor Podání PDF/DOCX | Generování reálných dokumentů pro soudní účely. | `documentExportService.ts` | P0 | Case Data | M | ČÁSTEČNĚ |
| 04 | Kalkulátor výživného | Backend existuje (test), UI napojení chybí nebo je rozbité. | `alimonyCalculator.ts` | P1 | - | S | ČÁSTEČNĚ |
| 05 | End-to-End E2E Testy | Potřeba simulovat user-journey před vydáním Beta 1.0. | `tests/` | P1 | - | L | NEZAČATO |
| 06 | Odstranění mrtvých modelů | V Prisma jsou nepoužité analytické/staré tabulky. | `schema.prisma` | P2 | - | S | NEZAČATO |
| 07 | UX/UI Sjednocení Formulářů | Formuláře v administraci nemají jednotný vzhled. | `components/` | P2 | Design System | M | ROZPRACOVÁNO |
| 08 | PWA Push Notifikace | Notifikace o soudu pro uživatele. | `ServiceWorker` | P2 | PWA | M | NEZAČATO |
| 09 | Plná CMS (Puck) migrace | Publikování na frontend kompletně z Puck CMS. | `cmsService.ts` | P3 | Puck Integrace | L | ČÁSTEČNĚ |
| 10 | Promazání starých Auditů | Složka `docs/audit` obsahuje přes 100 duplicitních zpráv. | `docs/audit/` | Tech Debt | - | S | NEZAČATO |
