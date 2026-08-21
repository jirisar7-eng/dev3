# Fáze 14A: Security Remediation
Datum: 2026-08-21

## Cíl a zjištění z Fáze 14
Tato fáze navazuje na zjištění Fáze 14, kde byly identifikovány dva hlavní problémy:
- **P1 — AI SECURITY**: Veřejně dostupné AI endpointy v `aiRoutes.ts` (např. `/chat`, `/biff-convert`) nebyly chráněny proti nadměrnému zneužití (chybějící Rate Limiting a zvážení `requireAuth`), čímž vznikalo riziko vyčerpání kvót (Gemini/Groq) a finančních nákladů.
- **P2 — AUDIT LOG**: Endpoint `POST /api/audit` pro zápis logů neměl implementován Rate Limiting ani validaci délky vstupů, což umožňovalo databázový spam a eventuálně DoS útok.

## 1. Analýza a řešení P1 (AI Security)
**Příčina/Zjištění**: 
Při analýze závislostí a architektury bylo zjištěno, že AI endpointy (`/chat`, `/biff-convert`, `/guide-plan`, `/analyze-document`, `/simulator-evaluate`) obsluhují veřejné komponenty na hlavní stránce portálu (v `PublicPortal.tsx` - moduly `AiAssistantView`, `AiGuideView`, atd.). Z důvodu UX (lead generation, veřejná osvěta) je nutné ponechat tyto nástroje bez přihlášení.
**Oprava**: 
Na všechny tyto veřejné endpointy v `aiRoutes.ts` byl přidán dedikovaný server-side `aiRateLimiter` (10 požadavků za hodinu na IP adresu) využívající `express-rate-limit`. Endpoint `/generate-page` nadále striktně vyžaduje `requireAuth` a `requireRole('ADMIN')`.
**Ochrana**: Backend zohledňuje `app.set('trust proxy', 1)`, což zaručuje, že rate limiter čte správnou klientskou IP adresu a nelze ho jednoduše obejít podvržením hlavičky (např. X-Forwarded-For) ze strany útočníka bez přístupu k proxy.

## 2. Analýza a řešení P2 (Audit Log)
**Příčina/Zjištění**:
Endpoint `POST /api/audit` v `server.ts` slouží klientům k zaznamenávání chyb a sledování aktivity. Nemohl být omezen pouze na přihlášené, protože se z něj odesílají i selhání přihlášení neregistrovaných uživatelů.
**Oprava**: 
Na endpoint byl aplikován `auditRateLimiter` (60 požadavků za 15 minut na IP adresu). Byly implementovány přísné restrikce na délku (`action` max 50 znaků, `module` max 50 znaků, `details` max 1000 znaků) pro ochranu před DoS a databázovým spamem. Identita (autor logu) je bezpečně injektována přímo ze serverového JWT session z `req.user`, jakýkoli podvržený objekt `user` v payloadu je ignorován.

## 3. Testy a Regrese
- **Test 1**: Neautorizovaný pokus na neveřejný AI `/generate-page` vrátí `401 Unauthorized`. (PASS)
- **Test 2**: Neplatný auditní payload (překročení max znaků) vrátí `400 Bad Request`. (PASS)
- **Test 3**: Spoofing (podvržení) `userId` nebo `user` objektu při odeslání do `/api/audit` byl úspěšně odfiltrován na serveru a uložen s prázdnou/reálnou session. (PASS)
- **Test 4**: Překročení limitu `auditRateLimiter` bezpečně vrátí `429 Too Many Requests`. (PASS)
- **Test 5**: Překročení limitu `aiRateLimiter` u public AI nástroje vrátí `429 Too Many Requests`. (PASS)
- **Regresní testy**: Funkcionalita AI Assistant, BIFF, Guide i Care Simulatoru nebyla nijak porušena (frontend je plně funkční). Zabezpečení RBAC a MFA nadále funguje bez změn.

## 4. Residual Risks (Zbývající rizika)
- Jelikož public AI nástroje nepoužívají autentizaci (business/UX rozhodnutí), je teoreticky možné zneužití limitů skrze proxy rotaci nebo VPN (DDoS pomocí rozptýlených IP), avšak současný rate limit poskytuje silnou první vrstvu ochrany.

**Závěr**: Obě hrozby P1 i P2 byly bezpečně sanovány a ověřeny automatickými testy bez narušení stability systému.
