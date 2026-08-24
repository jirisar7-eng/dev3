# Audit Report: Dev3 ClamAV Network & Port Fix
Datum: 2026-08-24

## 1. Původní problém
Dev3 prostředí (tatovacesta_dev3) sdílelo název kontejneru `clamav_scanner` a mapování hostitelského portu `3310:3310` s produkčním prostředím. To způsobovalo kolizi při spouštění `docker compose up -d` na serveru, protože port 3310 byl již obsazen běžícím produkčním ClamAV kontejnerem a Caddy následně vracel HTTP 502, protože aplikace nenastartovala.

## 2. Provedená změna
- Přejmenován kontejner v `docker-compose.yml` pro Dev3 na `clamav_scanner_dev3`.
- Aktualizována proměnná prostředí pro aplikaci `CLAMAV_HOST=${CLAMAV_HOST:-clamav_scanner_dev3}`.
- Odstraněno publikování portu na hostitele (`ports: - "3310:3310"`) a nahrazeno za `expose: - "3310"`.

## 3. Proč Dev3 ClamAV nepotřebuje hostitelský port
Aplikace komunikuje s ClamAV kontejnerem výhradně v rámci interní Docker sítě (přes DNS název kontejneru). Publikování portu na hostitele (bind na 0.0.0.0 nebo 127.0.0.1) není pro funkčnost aplikace vyžadováno a vede jen ke zbytečnému konfliktu na VPS.

## 4. Bezpečnostní dopad
Změna zvyšuje bezpečnost, protože odstraňuje zbytečně vystavený port na hostiteli. ClamAV je nyní dostupný pouze v izolované Docker bridge síti, do které má přístup pouze aplikace (Dev3 kontejner).

## 5. Testy provedené v AI Studio
- Kontrola `docker-compose.yml` diffu (statická analýza YAML).
- TypeScript Typecheck, Lint a Build aplikace.
- Docker daemon testy byly přeskočeny, protože AI Studio k němu nemá přístup (izolovaný sandbox).

## 6. Co musí být následně ověřeno přímo na VPS
- Sestavení a spuštění pomocí `docker compose build app && docker compose up -d`.
- Verifikace stavu kontejnerů přes `docker compose ps` (clamav_scanner_dev3 musí běžet bez bindu na localhost:3310).
- Kontrola Caddy (HTTPS dev3.tatovacesta.cz musí vracet HTTP 200 OK, nikoli 502).
