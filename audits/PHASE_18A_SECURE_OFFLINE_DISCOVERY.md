# FÁZE 18A: SECURE OFFLINE DISCOVERY

## 1. PWA AUDIT (Současný stav)
Byl proveden průzkum současné PWA implementace v repozitáři (při baseline `ef9857d`).

**Zjištění:**
- **Service Worker (`sw.js`)**: Existuje jako ručně spravovaný skript (nepoužívá se auto-generování přes Workbox/Vite plugin).
- **Cache strategie**: 
  - Aplikuje "Cache First" pro statická aktiva (JS, CSS, obrázky).
  - Používá "Network First" pro navigační požadavky na veřejné stránky, s fallbackem na App Shell (`/`) nebo `/offline.html`.
- **Offline přístup k privátním datům**: NENÍ podporován. Konfigurace obsahuje direktivu `SENSITIVE_ROUTES` (např. `/api`, `/muj-pripad`, `/coparent`), která striktně používá "Network Only" pravidlo.
- **Installability**: `manifest.json` je přítomen, avšak bez robustní podpory pro sync na pozadí (Background Sync API).

*Závěr PWA Auditu: Aplikace se instaluje a renderuje základní UI v offline stavu, ale neposkytuje žádná chráněná uživatelská data.*

## 2. STORAGE AUDIT
Aplikace momentálně spoléhá výhradně na základní webové úložiště:

- **IndexedDB**: NENÍ VŮBEC POUŽITO. Aplikace postrádá jakoukoliv lokální databázovou vrstvu.
- **localStorage**:
  - **Účel**: Ukládání Auth tokenů (`tatovacesta_auth_token`), Cookie Consent (`cookie_consent_v1`), Puck templates, a drobných UI stavů.
  - **Bezpečnostní riziko [HIGH]**: Ukládání JWT (ač s krátkou platností) do `localStorage` je náchylné na XSS útoky. Pro Fázi 18 bude nutné refaktorovat session na bezpečnější model (např. HttpOnly cookies s anti-CSRF tokeny nebo izolovaný memory state) předtím, než zpřístupníme šifrovací klíče.
- **sessionStorage**:
  - Minimální použití pro session ID analytiky a dočasný fallback pro Auth token.

*Závěr Storage Auditu: Aplikace není v současnosti připravena na uložení klientských offline dat. Lokální databáze (IndexedDB) musí být vybudována od nuly.*

## 3. DATA CLASSIFICATION (Klasifikace dat)
Pro potřeby "Secure Offline Case Data" (moje-slozka / muj-pripad) rozdělujeme modely (na základě `schema.prisma`):

### OFFLINE_ALLOWED (Povoleno pro lokální šifrované uložení)
Tato data tvoří jádro klientského offline režimu (musí být šifrována na straně klienta):
- `Case`, `CaseEvent`, `CaseTask`, `CaseNote`, `CaseDeadline`
- `CarePlan`, `CarePlanChild`, `CareArrangement`, `CareLocation`
- `UserChild`, `UserNote`, `UserCalendarEvent`
- Metadata k dokumentům (`CaseDocument`, `UserDocument`), avšak *samotné fyzické soubory/bloby* pouze u explicitně "stáhnutých" (pinned) dokumentů.

### ONLINE_ONLY (Vyžaduje síťové spojení)
Tato data se NIKDY neukládají do offline klientské databáze:
- `AuditLog`, `LegalAuditLog`, `SensitiveAccessLog`
- RBAC správa: `Role`, `Permission`, `UserRole`, `RolePermission`
- Veškerá data o ostatních uživatelích v `CoParentSpace` (vyjma těch, se kterými sdílím plán)
- Správa uživatelských profilů (`UserProfile` úpravy, platby)

### NEVER_CACHE (Zakázáno uchovávat v persistentním browser storage)
- Hesla, `Passkey` credential data.
- MFA záložní kódy, aktuální TOTP secrets.
- JWT Access tokeny a šifrovací klíče (šifrovací Master Key musí žít pouze v paměti JS (memory) a musí se derivovat při odemčení aplikace PINem, nesmí ležet staticky v `localStorage`).

