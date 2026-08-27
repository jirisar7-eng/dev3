# FÁZE 18B: SECURE STORAGE TEST REPORT

## Test Results
Všechny automatizované testy zabezpečeného úložiště (`offline-security.test.ts`) proběhly úspěšně (100% Pass Rate). 

**Testované scénáře:**
1. **CryptoService - Encrypt/Decrypt**: Ověřeno, že šifrování funguje symetricky a že generovaný ciphertext vůbec neodpovídá plain-textu.
2. **CryptoService - Wrong Key**: Pokus o dešifrování dat klíčem vytvořeným z odlišného PINu bezpečně odmítnuto s výjimkou (Fail-Closed).
3. **CryptoService - Tamper Evident**: Pokus o manipulaci ciphertextu v IndexedDB a jeho zpětné přečtení narazil na narušení integrity AES-GCM (odmítnuto s chybou `DECRYPT_FAILED`).
4. **SecureDB - Initialization**: Po startu je databáze vždy bezpečně v Locked stavu.
5. **SecureDB - Lock Guard**: Pokus o čtení či zápis do DB v Locked stavu vyhazuje výjimku `ACCESS_DENIED`.
6. **SecureDB - Plaintext Leak Prevention**: Exaktní ověření provedené přímým dotazem na SQLite level (`idb`), nezávisle na třídě `SecureDB`. Hledání "SUPER_SECRET_PLAINTEXT" v DB vrátilo negativní výsledek. V DB je výhradně ciphertext.
7. **SecureDB - Secure Wipe**: Úspěšně prověřeno, že volání `secureWipe()` jednak celou databázi vyčistí, jednak vymaže i paměťový master-key (`mek = null`).

## Fail-Closed Mechanismy
Na implementaci bylo důsledně aplikováno pravidlo Fail-Closed:
- Jestliže není v paměti klíč a je zavoláno `getItem`, operace nevyhazuje varování, ale kritickou výjimku `ACCESS_DENIED`. Aplikace nesmí zpracovávat žádnou null/mock data vrstvu.
- Pokud je uložený záznam poškozen (corruption, malware, chybějící IV), vyhodí výjimku `DECRYPT_FAILED`. Neexistuje žádný "plaintext fallback". Operace je blokována a data nevstoupí do aplikační logiky.

## Závislosti
- **idb (v8)**: Zvolen díky standardizaci, je to Promise wrapper přes `window.indexedDB` bez jakéhokoliv magického caching layeru, což nám dává absolutní kontrolu nad tím, co jde na disk.
- **fake-indexeddb**: Slouží pouze pro běh Node.js testovací sady v GitHub Actions a pipeline bez headless prohlížeče.

## Známá omezení
- Timeout v Node.js prostředí používá `setTimeout` namísto `window.setTimeout`, což může při agresivním tree-shakingu vyžadovat globální ošetření. (Bylo ošetřeno robustními typovými kontrolami).
