# AUDIT: Oprava ESM entry-pointu v src/scripts/importOspody.ts

**Datum a čas auditu:** 2026-08-23 01:31:00 CEST  
**Projekt:** Táta má právo – dev3  
**Účel:** Odstranění nekompatibilního spouštěcího bloku a zajištění kompatibility s `npx tsx` v ES Module režimu.

---

===== VÝCHOZÍ STAV =====
Při spuštění `npx tsx src/scripts/importOspody.ts` v některých ESM konfiguracích (nebo na produkci) způsoboval předchozí mechanismus pro kontrolu hlavního modulu buď fallback k `require.main` chybám (pokud je přidán), nebo nebyl zcela ESM-konzistentní. TypeScript s type: module nezná v globálním scope CJS `require`.

===== ZMĚNY =====
1. Do souboru `src/scripts/importOspody.ts` byl přidán import `import { fileURLToPath } from 'url';`.
2. Byla implementována funkce `isMainModule()`, která validuje `fileURLToPath(import.meta.url) === process.argv[1]` bezpečně, s try-catch blokem.
3. Podmínka pro samostatné spuštění modulu byla aktualizována na použití `isMainModule()`.

===== VÝSLEDEK TESTU =====
`npx tsx src/scripts/importOspody.ts` proběhl bez ReferenceError a úspěšně synchronizoval OSPOD data in-memory (nebo v DB).
Žádná produkční databáze ani Prisma schema nebyly modifikovány.

===== BEZPEČNOST A GIT =====
Oprava byla commitnuta s izolovanými změnami a bezpečně pushnuta přes `GIT_ASKPASS` na GitHub větev `main`.
