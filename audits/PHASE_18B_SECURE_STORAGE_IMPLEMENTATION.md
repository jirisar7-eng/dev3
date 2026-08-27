# FÁZE 18B: SECURE STORAGE IMPLEMENTATION

Tento audit zachycuje architektonické řešení implementace "Secure Storage Foundation" postavené v souladu s návrhem z Fáze 18A.

## Změněné a nové soubory
**Nové soubory:**
- `src/services/offline/CryptoService.ts`: Zodpovídá za nízkoúrovňové kryptografické operace (AES-GCM, derivace klíče, random IV).
- `src/services/offline/SecureDB.ts`: Objektově orientovaná abstrakce nad IndexedDB. Zajišťuje memory-only uchování MEK a automatické šifrování na pozadí.
- `tests/offline-security.test.ts`: Integrační testy a Fail-Closed scénáře pro zabezpečené úložiště.

**Změněné soubory:**
- `package.json`: Přidání lightweight IndexedDB wrapperu `idb` a testovací knihovny `fake-indexeddb`.
- `scripts/test-runner.js`: Zařazení nových testů do hlavního QA cyklu.

## Encryption Model (Šifrovací vrstva)
Rozhodli jsme se používat nativní **Web Crypto API**:
- **Derivace klíče**: Master Encryption Key (MEK) je odvozen z uživatelského `PINu` a `Salt` pomocí **PBKDF2**. Iterations count = 100 000 (SHA-256). Klíč (CryptoKey) má nastaven `extractable: false`, což znemožňuje jeho export zpět do plain-text podoby ani přes DevTools console.
- **Šifrování dat**: Symetrické blokové šifrování **AES-GCM** s klíčem délky 256 bitů. Zajišťuje jak důvěrnost, tak integritu zprávy pomocí Auth Tagu, díky čemuž je šifrovaný text *tamper-evident*.
- **IV Management**: 96-bit (12 bajtů) Initialization Vector (IV) je pro každou uložení generován zcela náhodně přes `crypto.getRandomValues`.

## Key Handling a Session Lock
1. **Volatile MEK**: Odvozený `MEK` je uchováván výhradně v nestatické instanci třídy `SecureDB` (v RAM). Nedotýká se `localStorage`, `sessionStorage` ani diskového cache.
2. **Inactivity Lock**: `SecureDB` používá `setTimeout` na 15 minut, který klíč automaticky vymaže (`this.mek = null`), pokud nedojde k aktivitě (čtení/zápis).
3. **Locking**: Explicitní volání metody `lock()` ihned zahodí MEK.

## Mitigation hrozeb
- **Kopírování IndexedDB**: Zkopírovaná IndexedDB je útočníkovi bez PINu a Saltu k ničemu. Obsahuje pouze Base64 encoded AES-GCM data.
- **DevTools Modification**: Pokus útočníka o úpravu Base64 v DevTools selže díky GCM authentication tag mismatchi (výjimka `DECRYPT_FAILED`).

## Co ještě NEBYLO implementováno
- Neexistuje UI pro zadávání PINu (čeká na fázi Offline Case Mode).
- Nebyly vytvořeny API endpointy pro Snapshot synchronizaci.
- Zatím se do SecureDB neukládají žádná reálná produkční data (byl implementován pouze driver).
