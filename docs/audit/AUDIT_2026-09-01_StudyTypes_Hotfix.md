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

## Fáze 2 - Forenzní oprava prisma/schema.prisma (Zjištěna nekonzistence)
Během hlubší analýzy (po čistém `npx prisma generate`) bylo zjištěno, že:
1. Pracovní adresář v předchozích krocích sice tvrdil, že pole `evidenceLevel` atd. v `prisma/schema.prisma` existují, ale ve skutečnosti chyběla v remote větvi `feat/faze-6a-unified-ai-audit-operations` a v čistém clone repozitáře.
2. Předchozí PASS výsledky byly způsobeny nacachovaným Prisma Clientem, který vznikl v jiném workspace (`/app/applet`), který tyto změny lokálně měl, ale nebyly nikdy poslány do Gitu.

**Oprava schema.prisma:**
Byly doplněny chybějící pole s odpovídajícími `@default` hodnotami do `prisma/schema.prisma` pro model `Study`:
- `evidenceLevel`
- `evidenceDirection`
- `causality`
- `sourceType`

**Testy po 2. fázi:**
- `npx prisma generate` pro čisté vygenerování Type typů: PASS
- `npx tsc --noEmit` pro ověření 100% type safety celé aplikace v izolovaném clone `tmp/dev3_fix`: PASS
- `npm run build` na `tmp/dev3_fix`: PASS

Nyní jsou všechny vrstvy (Git HEAD schema, vygenerovaný Prisma Client, TypeScript definice `Study`, mapování `studyService`) ve 100% shodě.
