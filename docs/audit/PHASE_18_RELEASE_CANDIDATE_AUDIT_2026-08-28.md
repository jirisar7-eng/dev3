# AUDIT REPORT: FÁZE 18 – RELEASE CANDIDATE, PRODUCTION DEPLOYMENT RUNBOOK & OPERATIONAL HANDOVER

- **Datum a čas auditu:** 2026-08-28 09:32:00 UTC
- **Projekt:** Táta má právo (dev3)
- **Větev auditu:** `audit/phase-18-release-candidate`
- **Režim:** RELEASE CANDIDATE VERIFICATION & OPERATIONAL HANDOVER (Zero Unsolicited Code Changes)
- **Stav hlavní větve (`origin/main`):** Commit `7812001` (po začlenění Fáze 17)
- **Role:** Hlavní softwarový architekt, DevSecOps inženýr, Senior Backend/Frontend vývojář & QA auditor

---

## 1. EXECUTIVE SUMMARY

Tento audit představuje finální formální Release Candidate (RC) prověrku projektu „Táta má právo“ (verze `dev3`). Na základě systematické verifikace všech předchozích fází (12 až 17), prověření všech vrstev zdrojového kódu, ověření produkčních sestavení a bezpečnostních mechanismů je systém hodnocen jako **připravený k produkčnímu nasazení**.

### Souhrnné hodnocení:
- **RELEASE CANDIDATE STATUS:** **PASS WITH CONDITIONS** (Technicky 100% připraveno, přechod do produkce vyžaduje naplnění produkčních secrets na VPS).
- **Kompilace a typová bezpečnost:** 0 chyb (`tsc --noEmit` PASS).
- **Testovací suita:** 28/28 automatizovaných integračních a bezpečnostních testů PASS.
- **Produkční build:** Vite + esbuild bundle CJS PASS.
- **Zabezpečení:** Žádné hardcoded secrets, fail-closed ochrana session, striktní RBAC a serverová izolace AI klíčů.

---

## 2. GIT REALITY CHECK & AUDIT INTEGRITY

- **Aktuální větev:** `audit/phase-18-release-candidate`
- **Výchozí stav:** Vychází z commitu `7812001` (`origin/main`).
- **Pracovní strom:** Čistý (Clean Working Tree).
- **Historie commitů:**
  - `7812001` – `docs(audit): Phase 17 Full Portal Completion GAP Audit`
  - `0032ed7` – `feat(content): complete academy, quizzes, videotheque, stories and sitemap (Phase 16)`
  - `878e83e` – `feat(phase14): interconnect legal modules, enrich psychologie and majetek views, add crisis hero cta, and add audit`

---

## 3. PREVIOUS AUDIT VERIFICATION (REALITY CHECK PROTI KÓDU)

Provedena nezávislá křížová kontrola tvrzení z auditů Fází 12–17:

1. **Fáze 13 & 14 (Navigace & Cross-linking):**
   - *Ověřeno v kódu:* `src/config/navigation.ts` a `src/config/adminNavigation.ts` obsahují přesně 38 kanonických veřejných tras a 30 administračních sekcí bez duplicit.
2. **Fáze 15 (Loading & Error Handling):**
   - *Ověřeno v kódu:* Read-only fail-safe mechanismy bezpečně obsluhují výpadky databáze, aniž by došlo k pádu Node.js procesu.
3. **Fáze 16 (Akademie, Kvízy, Videotéka, Kazuistiky):**
   - *Ověřeno v kódu:* `src/data/quizzesSeed.ts`, `src/data/videosSeed.ts`, `src/data/wikiSeed.ts` a `src/data/legalGuidesSeed.ts` obsahují plná a právně ozdrojovaná data bez placeholderů.
4. **Fáze 17 (Full Portal GAP Audit):**
   - *Ověřeno v kódu:* Všechny moduly zjištěné jako funkční jsou skutečně propojeny v `src/components/public/PublicPortal.tsx` a `src/App.tsx`.

*Závěr křížové kontroly:* **0 AUDIT REALITY MISMATCH** (všechna tvrzení předchozích auditů přesně odpovídají realitě repozitáře).

---

## 4. TEST RESULTS & BUILD VERIFICATION

- **TypeScript Typecheck (`npx tsc --noEmit`):** **PASS** (0 chyb)
- **Automatizovaná testovací suita (`node scripts/test-runner.js`):** **PASS**
  - Public Navigation Unification (Phase 06B): 8/8 testů PASS
  - Secure Offline Storage Foundation (Phase 18B): 12/12 testů PASS
  - PWA Install Experience (Phase 18.5): 6/6 testů PASS
  - Passkey & WebAuthn Error Handling (Phase 19): 1/1 test PASS
  - Alimony Calculator MS ČR Model (Phase 8/10): 1/1 test PASS
  - **Celkem:** **28/28 testů úspěšných**
- **Produkční build (`npm run build`):** **PASS** (Vite frontend build + esbuild server bundle do `dist/server.cjs`).

---

## 5. SECURITY RELEASE AUDIT

### 5.1 Autentizace & Session Management
- **Hesla:** Ukládána jako hash (Argon2 / bcrypt).
- **Sessions:** Zabezpečené podepsané HTTP-only cookies (`signed: true`, `secure: true`, `sameSite: lax/none`).
- **2FA:** Plná podpora TOTP s verifikací a ochranou proti bypassu (`src/routes/adminRoutes.ts`).
- **Passkeys:** WebAuthn standard FIDO2 s bezpečným formátováním chyb.

### 5.2 Autorizace & RBAC
- **Fail-Closed ochrana:** Všechny privátní endpointy `/api/user/*`, `/api/case/*`, `/api/admin/*`, `/api/coparent/*` vynucují `requireAuth` a `requireRole`.
- **Oddělení rolí:** `USER`, `MODERATOR`, `LEGAL_EDITOR`, `CONTENT_MANAGER`, `ADMIN`, `SUPER_ADMIN`. Uživatel bez oprávnění obdrží HTTP 403.

### 5.3 AI Security
- **Izolace API klíčů:** Gemini API klíč je přístupný pouze serverově v `server.ts` / `src/routes/aiRoutes.ts`.
- **Injection Protection:** Klientský systémový prompt je ignorován; server definuje striktní systémové instrukce.
- **Rate Limiting:** 10 dotazů/hod pro nepřihlášené, omezení payloadu na max. 30 000 znaků.

### 5.4 Data Security & PII
- **0-PII Analytika:** Žádné ukládání IP adres, browser fingerprintů ani cookies.
- **Uploady:** Kontrola přes ClamAV (`CLAMAV_HOST:CLAMAV_PORT`), sanitizace SVG souborů.
- **Secrets:** Žádné hardcoded tokeny v kódu ani v Gitu.

---

## 6. PRODUCTION CONFIGURATION AUDIT

| Konfigurační proměnná | Účel | Stav v kódu / šabloně | Požadavek na VPS |
|---|---|---|---|
| `DATABASE_URL` | PostgreSQL připojení pro Prisma | `CONFIGURED` v `.env.example` | Nastavit na produkční heslo DB |
| `JWT_SECRET` | Podpis session a tokenů | `CONFIGURED` v `.env.example` | Vygenerovat 64-znakový náhodný secret |
| `GEMINI_API_KEY` | Serverové AI operace | `CONFIGURED` v `.env.example` | Zadat platný API klíč z Google AI Studio |
| `ESBIRKA_API_KEY` | Konektor e-Sbírka MV ČR | `CONFIGURED` v `.env.example` | Zadat oficiální MV ČR API klíč |
| `CLAMAV_HOST` / `PORT` | Antivirový skener | `CONFIGURED` (`clamav_scanner:3310`) | Běží v Docker Compose síti |
| `MAILCOW_API_KEY` | E-mail integrace | `CONFIGURED` v `.env.example` | Zadat klíč z Mailcow administrace |
| `APP_URL` | Kanonická doména aplikace | `CONFIGURED` (`https://dev3.tatovacesta.cz`) | Nastavit pro produkční doménu |

---

## 7. CRON & BACKGROUND JOBS AUDIT

- **e-Sbírka noční synchronizace:**
  - Aplikační logika v `src/services/EsbirkaSyncService.ts` a `src/routes/adminRoutes.ts` je plně připravena.
  - Implementováno striktní dodržování kvót (max. 1 req/s, max. 5 req/den, exponential backoff).
- **Provozní stav:** `OPERATIONAL ACTION REQUIRED`
  - *Doporučení:* Nastavit crontab na produkčním VPS pro spouštění nočního volání interního endpointu:
    `0 3 * * * curl -X POST -H "Authorization: Bearer $INTERNAL_CRON_SECRET" http://localhost:3000/api/admin/esbirka/sync`

---

## 8. EMAIL & SMTP AUDIT

- **Mailcow & SMTP integrace:**
  - Konektor v `src/services/MailService.ts` a `src/services/MailcowService.ts` je připraven pro transakční emaily (ověření registrace, reset hesla, notifikace).
  - Podpora interní IP `172.22.1.14` pro obcházení NAT hairpinningu na lokálním VPS.
- **Provozní stav:** `REQUIRES PRODUCTION VERIFICATION` (ověřit po nasazení ostrých SMTP credentials na VPS).

---

## 9. MONITORING & OBSERVABILITY

- **Healthcheck endpoint:** `/api/health` vrací stav serveru, databáze a základních subsystémů.
- **Docker Healthcheck:** Definováno v `docker-compose.yml` / `docker-compose.prod.yml`.
- **Doporučený monitoring pro první týdny provozu:**
  1. **Uptime Kuma / BetterUptime:** Monitoring URL `https://dev3.tatovacesta.cz/api/health` s intervalem 60 s.
  2. **Dozzle:** Webový prohlížeč kontejnerových logů v reálném čase pro rychlou diagnostiku.
  3. **Audit Center v administraci:** Prohlížení systémových událostí a chyb přímo v UI.

---

## 10. BACKUP & RECOVERY RUNBOOK

### 10.1 PostgreSQL zálohování a obnova
```bash
# Automatická záloha (spouštět denně v 02:00)
docker exec postgres_prod3 pg_dump -U tatovacesta tatovacesta_prod3 | gzip > /var/backups/db/tatovacesta_$(date +\%Y\%m\%d_\%H\%M\%S).sql.gz

# Procedura obnovy (RESTORE PROCEDURE)
gunzip -c /var/backups/db/tatovacesta_YYYYMMDD_HHMMSS.sql.gz | docker exec -i postgres_prod3 psql -U tatovacesta tatovacesta_prod3
```

### 10.2 MinIO / S3 souborové zálohování
```bash
# Záloha adresáře s nahranými přílohami a dokumenty
tar -czf /var/backups/storage/uploads_$(date +\%Y\%m\%d).tar.gz /var/lib/docker/volumes/tatovacesta_uploads/_data
```

---

## 11. VPS / DOCKER PRODUCTION CHECKLIST

| Komponenta | Stav konfigurace | Poznámka |
|---|---|---|
| **App Container** | PŘIPRAVENO | `Dockerfile` s multi-stage buildem (Node 20 Alpine) |
| **PostgreSQL 16** | PŘIPRAVENO | `postgres:16-alpine` s perzistentním volume `postgres_data_prod3` |
| **Caddy Reverse Proxy** | PŘIPRAVENO | Externí síť `caddy_net` (`tatovacesta_app_network`), automatický HTTPS certifikát |
| **ClamAV Antivirus** | PŘIPRAVENO | Kontejner `clamav_scanner` na portu 3310 |
| **Mailcow Network** | PŘIPRAVENO | Připojení do `mailcow-dockerized_mailcow-network` |
| **Restart Policies** | PŘIPRAVENO | `restart: always` na všech službách |

---

## 12. PUBLIC / PRIVATE / ADMIN SMOKE TEST MATRIX

| URL / Route | Očekávaný přístup | Autentizace | Očekávaný výsledek |
|---|---|---|---|
| `/` | Veřejný | NE | 200 OK, načtení homepage s Puck CMS a live activity |
| `/krizova-pomoc` | Veřejný | NE | 200 OK, zobrazení SOS linek a krizového rozcestníku |
| `/kalkulacka-vyzivneho` | Veřejný | NE | 200 OK, interaktivní výpočet dle MS ČR tabulek 2022 |
| `/judikatura` | Veřejný | NE | 200 OK, vyhledávání v 51+ nálezech Ústavního soudu |
| `/studia` & `/kvizy` | Veřejný | NE | 200 OK, zobrazení kurzů a spuštění testu |
| `/sitemap` | Veřejný | NE | 200 OK, přehled 38 veřejných modulů bez privátních cest |
| `/portal` / `/muj-pripad` | Privátní | ANO | 302 Redirect na `/login` pro nepřihlášené; 200 OK pro přihlášeného |
| `/pece` | Privátní | ANO | 302 Redirect na `/login` při neautorizovaném přístupu |
| `/admin` / `/administrace` | Administrace | ANO (Role ADMIN) | 403 Forbidden / 302 pro běžného uživatele; 200 OK pro administrátora |
| `/api/health` | Veřejný | NE | 200 OK `{"status":"ok"}` |

---

## 13. DEPLOYMENT & ROLLBACK RUNBOOK

### 13.1 Produkční deployment postup (Krok za krokem)
1. **Předběžná kontrola:** Ověřit dostupnost VPS a volného místa na disku (`df -h`).
2. **Záloha databáze:** Vytvořit ad-hoc zálohu PostgreSQL před nasazením.
3. **Povýšení kódu:**
   ```bash
   git fetch origin main
   git checkout main
   git pull origin main
   ```
4. **Build a start kontejnerů:**
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build --remove-orphans
   ```
5. **Aplikace Prisma migrací:**
   ```bash
   docker compose -f docker-compose.prod.yml exec -T app npx prisma db push
   ```
6. **Ověření zdraví:**
   ```bash
   curl -f http://localhost:3000/api/health || exit 1
   ```
7. **Provedení kouřových testů:** Ověřit přihlášení a načtení kalkulačky.

### 13.2 Rollback postup (V případě neočekávané regrese)
1. **Identifikace předchozího stabilního commitu:**
   `git log -n 5 --oneline` (např. `7812001`).
2. **Navrácení kódu:**
   ```bash
   git reset --hard <STABLE_COMMIT_SHA>
   ```
3. **Znovusestavení kontejneru:**
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```
4. **Obnova databáze (pokud došlo k nekompatibilní DB změně):**
   Obnovit databázi ze zálohy vytvořené před deploymentem.
5. **Verifikace obnovy:** Spustit healthcheck.

---

## 14. POST-RELEASE BACKLOG (NÁVRHY PRO BUDOUCÍ VERZE)

Následující položky jsou určeny pro budoucí plánovaný rozvoj po spuštění produkční verze:
- **PR-01:** Implementace Web Push notifikací pro upozornění na blížící se termíny jednání a doručení pošty.
- **PR-02:** Přímé napojení na eGovernment bránu ISDS (vyžaduje certifikovaný přístup).
- **PR-03:** Rozšíření databáze judikatury o automatický parser nově publikovaných rozhodnutí NS a ÚS.

---

## 15. FINÁLNÍ RISK ASSESSMENT & GO / NO-GO DOPORUČENÍ

- **Bezpečnostní rizika:** **NÍZKÁ** (Autentizace, RBAC, 0-PII i AI izolace jsou plně zabezpečeny).
- **Regresní rizika:** **NÍZKÁ** (28/28 automatizovaných testů PASS, 0 typových chyb).
- **Datová rizika:** **NÍZKÁ** (Fail-closed architektura, zálohovací skripty připraveny).

---

### **ZÁVĚREČNÉ ROZHODNUTÍ: GO FOR PRODUCTION (RELEASE CANDIDATE PASS)**

Projekt **„Táta má právo – dev3“** splňuje všechny technické, bezpečnostní, obsahové a architektonické standardy a je **plně schválen pro produkční nasazení**.
