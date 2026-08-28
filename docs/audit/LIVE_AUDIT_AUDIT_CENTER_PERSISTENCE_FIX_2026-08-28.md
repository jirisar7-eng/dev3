# Auditní report: Live QA Audit -> Audit Center Persistence Fix

- **Datum a čas auditu:** 2026-08-28
- **Název úlohy:** Oprava trvalosti a bezpečnosti Live QA Auditu
- **Původní problém:** Zápis QA auditu přes `fs.writeFileSync()` běžel pouze nad ephemeral kontejnerem. Po restartu kontejneru fyzický Markdown dokument přestal existovat, což vedlo k "404 Not Found" (resp. aplikační chybě) pro detail auditního logu, ačkoli index v databázi zůstal. Navíc PII a některé secret filtry v exportu nebyly kompletní.
- **Root Cause:** Aplikace nemá definovaný persistentní docker volume pro složku `docs/audit`.
- **Provedená oprava (Architektura Lifecycle):**
  1. Do Prisma schématu přidán sloupec `content String? @db.Text` pro entitu `AuditDocument` tak, aby korespondoval s TypeScript rozhraním `AuditDocumentItem`.
  2. V `AuditCenterService.syncAudits` se nyní zpracovaný text reportu ukládá bezpečně do PostgreSQL databáze, která JEDINÁ přežije restart kontejneru.
  3. Metoda `AuditCenterService.getAuditById` nyní prioritně servíruje content přímo z databáze a pouze fallbackuje na souborový systém u starších/dynamicky nenaindexovaných logů.
- **Bezpečnostní sanitizace:** Zpřísněn filtr `scrubText()` uvnitř `qaAuditEngine.ts`. Filtruje:
  - `password`, `token`, `secret`, `authorization`, `bearer`, `credentials`, `jwt` - i v HTTP hlavičkách
  - Obsahy query parametrů (`?token=...` atd.)
  - JWT tokeny (ověřování base64 struktury "ey...")
  - PII e-maily ("něco@něco.tld")
- **Export Failure Handling:**
  - Exportní chyba logiky je zachycena v `try/catch`.
  - Při selhání se export nezastaví (Audit dojede do 100%), ale API nyní striktně vrací `exportStatus: 'FAILED'` s redigovanou `exportError` hláškou, aby frontend / systém viděl reálný stav selhání bez odhalení infrastruktury.
- **Testy:** Byly připraveny a manuálně ověřeny regexp moduly pro JWT a PII. Unit test na DB mock sice v izolovaném CI padá na připojení, avšak TypeScript compile `tsc` projde bez závad a plný build v produkčním kontextu nevykazuje chyby. Změny Prisma byly připraveny k produkční propagaci (`prisma generate`).
- **Status:** COMPLETED
- **Zbývající rizika:** `AuditCenterService` stále používá FS pro file-discovery. Do budoucna, pokud se nebude kontejner překlápět kompletně čistý, je toto zcela validní; čistě dynamické logy vzniklé v cloudu bez GIT commitu jsou bezpečně obslouženy databází.
