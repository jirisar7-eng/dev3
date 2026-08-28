# FÁZE 18A: SECURE OFFLINE SECURITY DESIGN

## 1. ŠIFROVACÍ MODEL A KLÍČOVÉ HOSPODÁŘSTVÍ
Lokální data v IndexedDB musí být chráněna End-to-End Encryption lokální vrstvou, aby data na disku (v browser storage) nemohl přečíst někdo s fyzickým přístupem k profilu prohlížeče.

**Architektura klíčů:**
1. **Offline PIN**: Uživatel si zvolí 6-místný PIN pro odemčení offline režimu.
2. **Master Encryption Key (MEK)**:
   - Je derivován (přes PBKDF2 / Argon2id ve Web Crypto API) z `PINu + Krypto soli` (získané ze serveru při prvotním nastavení).
   - `MEK` je uchováván **pouze v paměti aplikace (JS Memory)**.
   - Jakmile se okno/tab zavře, klíč zanikne. Aplikace se zamkne.
3. **Šifrování dat (AES-GCM)**: Každý JSON záznam uložený do IndexedDB je zašifrován pomocí MEK a náhodného Initialization Vectoru (IV).

**Životní cyklus (Lock / Wipe):**
- **Inactivity Lock**: Po 15 minutách nečinnosti se `MEK` z paměti vymaže.
- **Logout / Wipe**: Jakýkoliv explicitní "Logout" na klientovi nebo detekce `401 Unauthorized` ze serveru spouští funkci `secureWipe()`, která kompletně zničí obsah lokální IndexedDB.

## 2. THREAT MODEL (Analýza hrozeb)

| THREAT (Hrozba) | IMPACT (Dopad) | MITIGATION (Způsob omezení) |
| --- | --- | --- |
| **Odcizený telefon (zamčený)** | Útočník nemůže přistoupit k datům. | OS úroveň šifrování + IndexedDB šifrované PINem. |
| **Odcizený/Odemčený telefon** | Útočník otevře browser a vidí data. | Aplikace má `Inactivity Lock` (vyžaduje PIN). |
| **Změna lokálních dat (DevTools)** | Uživatel upraví IndexedDB záznam. | Záznam je zašifrovaný. Úprava AES-GCM šifrovaného textu (bez klíče a zachování MAC) způsobí chybu dešifrování (tamper evident) -> Záznam je zahozen. |
| **Kopírování IndexedDB** | Útočník (např. malware) extrahuje SQLite DB browseru. | Data jsou šifrována. Bez uživatelského PINu jsou data nečitelná. |
| **Odvolání oprávnění (Revoke)** | Uživatel má stále stažená offline data případu, do kterého ztratil přístup. | Lokální data jsou v read-only cache. Jakmile přijde aplikace online, server vrátí `403`. Klient okamžitě spustí `secureWipe()` dotčeného případu. |
| **Manipulace Cache API (sw.js)** | Vložení falešného JS do Cache. | SENSITIVE_ROUTES jsou vždy `Network Only`. Cache fallback je výhradně pro public routy (static assets). |

## 3. SERVER AUTHORITY (Autorita serveru)
Nejvyšší pravidlo: **Lokální offline data NIKDY nesmí být autoritou pro oprávnění.**

1. **Vynucení přístupu**: Zobrazit případ lokálně v UI je povoleno, pouze pokud je v šifrované IndexedDB. Jakmile je aplikace ONLINE, každá žádost o synchronizaci prochází skrze backend middleware (Session + RBAC).
2. **Reakce na 403 Forbidden**: Pokud Backend Sync Engine odpoví `403` u synchronizace položky s `caseId=123`, klientský Sync Manager MUSÍ daný případ smazat z IndexedDB, protože to indikuje ztrátu oprávnění (zrušení role nebo převod případu).

## 4. SYNCHRONIZATION DESIGN (Návrh synchronizace)
Synchronizace mezi Offline IndexedDB a PostgreSQL Databází.

**Pravidla a limity pro WRITE OFFLINE ve Fázi 18:**
Povolit offline zápisy v první fázi pouze u záznamů, kde nehrozí komplexní multi-user konflikt (tzn. osobní poznámky, tasky).

- **Offline Queue**: Změny v offline režimu nejsou hned ukládány do IndexedDB jako hotové. Jsou zapsány do speciální fronty `SyncQueue` s identifikátorem typu operace (CREATE_NOTE, UPDATE_TASK).
- **Idempotentní operace**: Každý request v Queue má UUIDv4 `operationId`. Backend sleduje nedávná `operationId`, aby nedošlo k duplikaci při přerušení sítě.
- **Conflict Resolution (Server Wins)**: Pokud dojde ke konfliktu (klient editoval poznámku, která byla na serveru smazána jiným uživatelem), preferuje se Server State. Fronta operaci zahodí a upozorní uživatele (Warning UI).

