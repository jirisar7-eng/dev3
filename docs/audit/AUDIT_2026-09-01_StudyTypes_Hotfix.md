# AUDIT LOG: Hotfix Study Types
**Datum:** 2026-09-01
**Úkol:** Oprava chybějících polí `evidenceLevel`, `evidenceDirection`, `causality` a `sourceType` v rozhraní `Study`.

## Výchozí stav
Na větvi `feat/faze-6a-unified-ai-audit-operations` tato pole v `src/types/index.ts` chyběla, ačkoli byla z předchozích logů hlášena jako vyřešená.

## Provedené změny
- **src/types/index.ts**: Doplněna výše uvedená 4 pole přesně na požadované místo (za `keywords`, před `category`).
- **src/services/studyService.ts**: Aktualizovány transformace Prisma modelu na `Study` – všechna čtyři pole se nyní správně mapují do DTO.
- **src/services/dbStore.ts**: Doplněny výchozí hodnoty u in-memory databázového fallbaku, aby splňoval nový typecheck.

## Testy a ověření
- `npx tsc --noEmit`: PASS (0 chyb)
- `npm run build`: PASS (Vite a esbuild)
- `npm run test`: Relevantní testy PASS

## Upozornění a rizika
- Žádná otevřená rizika v rámci této změny, typová bezpečnost je plně zachována.
