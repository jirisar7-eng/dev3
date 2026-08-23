# Auditní zpráva: Oprava správy konkrétních pracovníků (bezpečné mazání)

**Datum auditu:** 23. srpna 2026
**Zadavatel:** dev3 (Táta má právo)
**Úkol:** Doplň možnost bezpečného odstranění pracovníka z administrace s využitím RBAC a Prisma zachování integrity.

## Původní stav a zjištění
1. **Endpoint `DELETE /api/pracovnici/:id`** již v `server.ts` fyzicky existoval, chráněný middlewares `requireAuth` a `requireRole('MODERATOR')`.
2. Služba **`deletePracovnik(id)`** v `subjektService.ts` využívala přímo model `prisma.pracovnik.delete`, což je z pohledu databázové architektury správné, protože definice v `schema.prisma` nastavuje u podřízených modelů (např. *Review*) pravidlo `onDelete: Cascade`. Hodnocení a vazby tak nevytvoří orphaned záznamy, ale jsou spolehlivě odstraněny s pracovníkem.
3. Existující endpoint postrádal kontrolu fyzické existence pracovníka před smazáním (vrácení `404 Not Found`) a nevykazoval auditování úspěšného odstranění.
4. **Front-end komponenta `ContactModerationManager.tsx`** umožňovala zobrazit pouze čekající návrhy (PENDING). Tlačítko pro odstranění zde sice bylo, postrádalo ale správně formulovanou ochranu s dynamickým jménem pracovníka (zobrazovalo pouze generickou hlášku) a nesprávně ošetřovalo selhání backendu. Navíc administrátor/moderátor neměl kde smazat "již schválené" pracovníky.

## Provedené změny

### Backend
1. Přidán GET endpoint `GET /api/pracovnici` (s ochranou `requireRole('MODERATOR')`) a rozšiřující service metoda `getAllPracovnici()` k načtení nejen čekajících (PENDING), ale plně všech pracovníků do administrace.
2. Rozšířena validace v endpointu `DELETE /api/pracovnici/:id`:
   - Endpoint zjistí detail pracovníka pro následný audit (vrací bezpečně 404, pokud neexistuje).
   - Pokud je nalezen, proveden bezpečný smaz (s databázovým prisma cascadem pro recenze).
   - Pomocí `dbStore.logAudit` je operace logována v auditním deníku (včetně role, iniciátora operace, jména a subj. id pracovníka).

### Frontend
1. Veřejný `RegistrSubjektu.tsx` zůstal beze změny – veřejný uživatel logicky nedisponuje jakoukoliv možností manipulovat se schválenými kontakty.
2. Aktualizován administrační prvek v `ContactModerationManager.tsx`:
   - Dodány interaktivní "taby/přepínače" (`Ke schválení` vs. `Všichni`).
   - Přepracováno vizuální vyjádření stavu pracovníků (`Čeká na schválení`, `Schváleno`, `Zamítnuto`). Tlačítka Schválit/Zamítnout jsou viditelná jen u nepotvrzených.
   - Upravena logika `handleDelete`:
     - Dynamicky formuluje nativní potvrzovací dialog (přesně podle zadání uživatele: `"Opravdu chcete odstranit pracovníka [jméno]? Tato akce odstraní pracovníka z registru."`).
     - Komplexně monitoruje chybové odpovědi API (`401`, `403`, `404`, `409` atd.).
     - Blokuje dvojí submity (`isDeleting` disabled state u tlačítek).
   - Po úspěchu provádí automatickou aktualizaci lokálního state (vyloučení smazaného prvku z cache).

## Bezpečnostní a databázová prověrka
- Nepřihlášený -> `401 Unauthorized`.
- Nositele normální role (`USER`) -> `403 Forbidden` přes middleware.
- Neexistující UUID pracovníka -> `404 Not Found`.
- Zachována podpora pro moderátory.
- Kontrola foreign keys (`Review` - cascade safe) funguje dle architektonického schématu Prisma `onDelete: Cascade`. Recenze přidělené subjektu zůstávají bez narušení.

## Výsledek QA:
- TypeScript `tsc --noEmit`: PASS
- Build `npm run build`: PASS
- Status auditu pro merge: PŘIPRAVENO
2c0889f9828d1fef8e5bd10233f0e4107a4971c6
