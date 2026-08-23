# KOMPLEXNÍ BEZPEČNOSTNÍ, TECHNICKÝ A PRODUKČNÍ AUDIT (2026-08-23)

## 1. Souhrn (Executive Summary)
Tento dokument představuje komplexní audit projektu „Táta má právo“ v prostředí `dev3`.
Audit byl proveden metodou statické analýzy zdrojového kódu, konfigurací Docker infrastruktury, databázového schématu a API logiky. V rámci auditu nebyly prováděny žádné automatické zásahy ani modifikace s výjimkou předchozího odstranění zranitelnosti (2FA bypass).

**Základní identifikace:**
- **Repozitář**: `jirisar7-eng/dev3`
- **Větev**: `main`
- **Infrastruktura**: Node.js, Express, React, Vite, Prisma, PostgreSQL 16, Docker, Caddy, Mailcow, ClamAV
- **Aktuální HEAD commit**: `af6f377` (čistý pracovní strom)

---

## 2. Architektura a infrastruktura (Architecture & Infrastructure)
- **Kontejnerizace**: Aplikace je plně kontejnerizována (soubor `docker-compose.yml` s image pro aplikaci, db, clamav). Aplikace běží na portu 3000 (vystaveno na 3003 hostitele) a vyžaduje připojení do sítí `caddy_net` a `mailcow_network`.
- **Backend a Frontend společně**: Využívá Express vrstvu (v `server.ts`), která slouží jako API a přes `vite` funguje jako middleware pro vývoj, s tím, že produkční build se sbalí přes `esbuild` do `dist/server.js`.
- **Integrace na externí systémy**: V kódu je připraveno napojení na řadu služeb – e-Sbírka, MinIO Storage, ClamAV, Google & Microsoft (OAuth/Passkeys), Mailcow (e-mailový server), Groq a Gemini (AI).
- **Zranitelnosti / Rizika**: Databázové heslo (`secure_password_dev3`) a další systémové proměnné (např. IP adresy) jsou hardcoded v `docker-compose.yml`. Doporučeno převést všechna hesla do chráněného `.env` souboru nebo nasadit Docker Secrets pro produkční běh.

---

## 3. Frontendová vrstva (React + Vite)
- **Komponenty**: Rozsáhlá komponentová architektura za použití Tailwind CSS.
- **Formuláře a validace**: Aplikace implementuje PWA patterny, offline upozornění.
- **Stav**: Správa stavu je lokální přes React kontext, autentizační state se uchovává v `localStorage`/JWT.

---

## 4. Bezpečnost & Autentizace (Auth, RBAC & MFA)
- **JWT & Sessions**: Systém autentizuje pomocí JWT tokenů uložených ve `HttpOnly` `signed` cookies, anebo v headeru `Authorization: Bearer`.
- **Dvoufázové ověření (2FA/MFA)**: Aplikace vyžaduje MFA od rolí `SUPER_ADMIN`, `SYSTEM_ADMIN`, `CONTENT_MANAGER`, `LEGAL_EDITOR`, `MODERATOR`, a `ADMIN`. Ověření se nedávno zpevnilo opravou bypassu v `authMiddleware.ts` (`af6f377`). Nyní middleware korektně blokuje cestu do aplikace pro ty, kteří prošli heslem, ale nedokončili aktivní MFA challenge.
- **RBAC**: Implementována granulární kontrola rolí (od `USER` po `SUPER_ADMIN`). Ve zdrojích nalezen i permise systém (`requirePermission`). Autorizační vrstva neumožňuje nižším rolím (např. ADMIN) zvýšit své oprávnění nebo zranit SUPER_ADMIN účty.
- **Passkeys (WebAuthn)**: Nastaveny modely v databázi pro WebAuthn.
- **Bezpečnostní hlavičky (Security Headers)**: Backendový `server.ts` nepoužívá plošně `helmet` ani specifické bezpečnostní hlavičky (`X-Frame-Options`, `Content-Security-Policy`). Aplikace na ně pravděpodobně spoléhá na úrovni Caddy na aplikační vrstvě to chybí.

---

## 5. Zpracování dat & Databáze (Prisma + PostgreSQL)
- **Prisma Schema**: Rozsáhlé relační schéma (přes 150+ řádků, 30+ tabulek jako `User`, `Role`, `Permission`, `Passkey`, `UserProfile`, a celá architektura spisu - `Case`, `CaseEvent`, atd.). Validace schématu byla spuštěna a proběhla v pořádku bez chyb (`Prisma schema loaded... valid 🚀`).
- **Integrity (Integrita dat)**: Transakce se používají u vkládání a mazání spojených záznamů (např. `Case` a jeho děti). `deleteEvent`, `deleteNote` všechny kontrolují vlastnictví záznamu (`case.ownerId === user.id` nebo administrátorská role). IDOR/BOLA (Insecure Direct Object Reference) zranitelnosti byly analyzovány u hlavních CRUD funkcí a zdají se být spolehlivě ošetřeny přes autorizační validaci v service vrstvě a přes session middleware.
- **Test Připojení (Connection Check)**: Integrovaný systém detekce pádů (fallback mechanismy, pokud Prisma neodpovídá).

---

## 6. AI a Integrace externích API (E-Sbírka, Groq, Gemini)
- **e-Sbírka**: Komplexní `EsbirkaSyncEngine` se synchronizační logikou a `EsbirkaLockGuard`, který využívá bezpečné databázové zámky (`pg_try_advisory_lock`), chráněné hashováním (brání SQL injection). Ošetření rate limits (1 request/sec, max spojení) na e-Sbírce je ukázkové.
- **AI Integrace (`AiService.ts`)**: Kombinuje Google GenAI a fallback na Groq API (llama-3.3-70b-versatile). Endpoint `/api/ai/biff-convert` obsahuje Rate Limit přes IP adresu (10 requestů/hodina). Endpoint `/api/ai/chat` taktéž nemá specifikováno `requireAuth`, takže je zcela závislý na IP rate-limitingu. Otevřený přístup k AI zvenčí je rizikový z hlediska vyčerpání kvót, ale test suite potvrdila, že AI rate limity fungují.

---

## 7. Administrace, CMS, Logs a Souborový systém
- **Audit Center (`AuditCenterService.ts`)**: Prohledává složky a čte auditní soubory (.md). Aplikuje bezpečný filtr `path.resolve` k zabránění Path Traversal mimo kořenový adresář. K načtení verzí ze systému Git volá utilitu `execSync(git log ... "${relativeFilePath}")`. Přestože je riziko zmírněno faktem, že soubor musí reálně existovat na disku a v DB, vložení stringu přímo do shell příkazu z proměnné je považováno za Command Injection vektor, který by v produkci mohl být spuštěn přes vytvoření zlomyslného názvu souboru.
- **CMS (Puck)**: Zajišťuje bez-kódové / low-code editování stránek a navigací. Volání na úpravu (PUT/POST/DELETE) sekcí, článků, a faq jsou kompletně střeženy kontrolou `requireRole('ADMIN')`.
- **File Management**: `ClamAvService` a MinIO zajišťují bezpečné nahrávání a skenování souborů uživatelů.

---

## 8. Nalezená rizika (Findings) & Doporučení (Remediation Plan)

### Kritická rizika (P1 - P2)
Nebyla detekována zjevná kritická zranitelnost (typu SQLi, NoSQLi nebo přímý IDOR bez autorizace), která by umožňovala masivní zneužití systému, bypass přihlášení (opraveno dříve), nebo eskalaci oprávnění. Systém je robustně implementován.

### Střední a potenciální rizika (P3 - P4)
1. **Zabezpečení AI endpointů (P3)**: Endpointy v `aiRoutes.ts` (např. `/chat` a `/biff-convert`) nechrání `requireAuth` a spoléhají se výhradně na IP Rate Limit.
   - *Doporučení*: Vyžadovat přihlášení (`requireAuth`) pro `/chat`, pokud to není zamýšleno jako plně veřejný nástroj (nebo nastavit ještě přísnější limity).
2. **Command Injection rizikový kód v AuditCenter (P3)**: Konstrukce v `AuditCenterService.ts`: `execSync("git log -1 --format=\"%H|%an|%cd\" -- \"${relativeFilePath}\"")`.
   - *Doporučení*: Nahradit volání bezpečným formátem (`execFile` nebo `spawnSync`), kde se argumenty předávají v poli, namísto jednoho formátovaného stringu do shellu.
3. **Hardcoded Secrets v Docker Compose (P4)**: Soubor `docker-compose.yml` obsahuje natvrdo nastavená hesla (např. `secure_password_dev3`).
   - *Doporučení*: Nahradit tyto proměnné za `${POSTGRES_PASSWORD}` čerpané z bezpečného, verzemi ignorovaného `.env` souboru.
4. **Absence HTTP Security Headers v Node.js (P4)**: Chybí middleware `helmet` pro automatické nastavování ochranných hlaviček typu X-Content-Type-Options nebo HSTS uvnitř aplikační vrstvy.

---

## 9. Závěr auditu
Projekt `dev3` vykazuje vysokou úroveň technického a bezpečnostního zajištění, obzvláště díky silné vrstvě Middlewaru a poctivému ověřování rolí v Service vrstvě. Služby pro automatizované testy fungují (bezpečnostní a architektonické testy prošly). Jakmile budou aplikována zmíněná doporučení (zejména sanitace příkazových volání a revize AI limitů), systém bude plně připravený k produkčnímu nasazení.
