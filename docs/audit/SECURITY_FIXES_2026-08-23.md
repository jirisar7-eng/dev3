# BEZPEČNOSTNÍ OPRAVY PO AUDITU (2026-08-23)

## 1. Původní nálezy a ověření
Na základě předchozího komplexního auditu byly identifikovány následující body k řešení:
- **P3 - Command Injection**: Bylo potvrzeno, že `AuditCenterService.ts` využíval rizikové sestavování řetězce a interpolaci přes `execSync`, čímž vznikalo potenciální riziko command injection.
- **P3 - AI Endpointy**: Potvrzeno, že AI endpointy (např. `/api/ai/biff-convert`, `/api/ai/chat`) sice měly funkční IP rate-limit (ověřeno přes integraci `run_ai_rate_limit_test.cjs`), ale postrádaly obranu proti payload abuse.
- **P4 - Hardcoded Secrets v Dockeru**: Potvrzeno, že v `docker-compose.yml` bylo fixně vepsáno heslo pro PostgreSQL, což porušuje zásady bezpečné manipulace se secrets.
- **P4 - HTTP Security Headers**: Potvrzeno, že na aplikační vrstvě Express chyběly základní doporučené HTTP hlavičky pro bezpečnost.

## 2. Provedené změny
- **Sanitace Git příkazů (Command Injection Mitigace)**:
  - **Soubor**: `src/services/auditCenterService.ts` a `src/services/qa/ai/evidenceValidator.ts`
  - **Změna**: Metoda `execSync` byla kompletně nahrazena asynchronním / lepším designem pomocí `execFileSync`. Volání shellu již nepoužívá formátovací string s interpolací, ale explicitní rozpad do pole argumentů (např. `execFileSync('git', ['log', '-1', '--format=%H|%an|%cd', '--', relativeFilePath])`). Shell parser je tímto de-aktivován a argumenty jsou předány rovnou binárce Gitu.
  
- **Ochrana AI API před Payload Abuse**:
  - **Soubor**: `src/routes/aiRoutes.ts`, `run_ai_rate_limit_test.cjs`
  - **Změna**: Vzhledem k tomu, že tyto endpointy plní i zčásti veřejnou prezentační (či simulační) funkci na portálu pro návštěvníky (dle nasazení komponent v `src/components/public/ai`), nebylo žádoucí slepě uzamknout API přes `requireAuth`, což by degradovalo veřejnou UX. Namísto toho byl zaveden specifický `aiPayloadLimiter`, který natvrdo omezuje objem příchozího JSON payloadu na rozumnou míru (~30,000 znaků), aby se znemožnil útok na vyčerpání AI tokenů. Původní `aiRateLimiter` zafunguje pro throttling.

- **Odstranění pevných Secrets**:
  - **Soubory**: `docker-compose.yml`, `.env.example`
  - **Změna**: Hardcoded přístupové heslo k PostgreSQL (`secure_password_dev3`) a další související údaje v YAML souboru byly převedeny na `${POSTGRES_PASSWORD}` variabilní proměnné. Dále byly zdokumentovány jako bezpečné referenční proměnné uvnitř `.env.example`.

- **Aplikace Security Hlaviček**:
  - **Soubor**: `server.ts`
  - **Změna**: Vložil jsem dedikovaný aplikační middleware implementující `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN` (jako minimální defenziva na zamezení Clickjackingu z cizích webů), `Referrer-Policy: strict-origin-when-cross-origin` a podmíněně i zavedení `Strict-Transport-Security` za proxy.

## 3. Testy a výsledky
- `node scripts/test-runner.js`: Testy integrací, oprávnění a mapového portálu úspěšně proběhly. (PASS)
- Do bezpečnostních testů byl implementován ověřovací test na objemný `largePayload` (30000+ znaků), který spolehlivě vrací `HTTP 413 Payload Too Large` v rámci `biff-convert`.
- Stavební fáze (Build & TSC): Projekt nevykazuje typové problémy ani nepadá na novém modulu shell execFileSync.

## 4. Doporučení pro produkci a stav
- Kompromitované heslo `secure_password_dev3` sice nebylo vystaveno aplikaci zvenčí, ale nacházelo se v Git větvi. V ostré produkci doporučuji vygenerovat nové heslo v produkčním `.env`.
- Nasazení proběhne hladce s beze změny fungujícím kontejnerovým obalem. Nejsou evidována další závažná rizika.
