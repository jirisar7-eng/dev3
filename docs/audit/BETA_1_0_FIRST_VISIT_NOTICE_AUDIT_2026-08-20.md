# BETA 1.0 FIRST-VISIT NOTICE AUDIT

## ZÁKLADNÍ INFORMACE
- **Datum:** 2026-08-20
- **Úkol:** Přidat úvodní oznámení „BETA 1.0“ při prvním vstupu na portál
- **Výchozí HEAD:** 944e5c4
- **Cíl:** Zobrazit oznámení novému uživateli, zachovat persistenci do budoucna, neomezit auth flow, dodržet responsivitu a přístupnost.

## IMPLEMENTACE
- **Použité komponenty:** Vytvořena nová komponenta `BetaNoticeModal.tsx` vycházející ze zavedených standardů (Tailwind dialog styling jako má `ComplianceModal.tsx`).
- **Změněné soubory:**
  - `src/components/public/BetaNoticeModal.tsx` (nový soubor)
  - `src/App.tsx` (import a render modal dialogu na nejvyšší úrovni aplikace)
- **Mechanismus zapamatování potvrzení:** Použito klientské úložiště `localStorage` s verzovaným klíčem `tatovacesta_beta_notice_1_0_acknowledged`. Pokud hodnota není přítomna, dialog se po mountnutí zobrazí.

## VÝSLEDKY TESTŮ

### Funkční testy
- **Test prvního vstupu (Nový návštěvník):** PASS (Dialog se zobrazí automaticky z důvodu absence klíče v localStorage)
- **Potvrzení („Pokračovat na hlavní stránku“):** PASS (Uloží do local storage klíč `tatovacesta_beta_notice_1_0_acknowledged` s hodnotou `true` a skryje okno)
- **Persistence (Reload stránky):** PASS (Dialog se nezobrazí, přečten klíč a `isVisible` je `false`)
- **Nové anonymní okno:** PASS (Absence klíče zobrazí dialog)
- **Přihlášený uživatel:** PASS (Pokud se smaže localStorage, zobrazí se překryvný modal i přihlášenému uživateli, po odkliknutí okna lze běžně pokračovat, auth state zůstane nedotčen)
- **Rychlé odkazy:** PASS (Zkontrolvána navigace na `Sponzoři -> /partneri`, `Mapa stránek -> /mapa-stranek`, `Podmínky užívání -> /podminky`)

### Responzivní design a UX
- **Mobil portrait:** PASS (Dialog zabírá dostupnou šířku, bez overflow, má vnitřní overflow-y auto pro delší obsah)
- **Mobil landscape:** PASS (Vynucen overflow-y: auto pro menší výšku viewportu)
- **Tablet portrait:** PASS (Zobrazí se čitelně s dostatečným polstrováním, bez overlay překrytí)
- **Tablet landscape:** PASS (Nezasahuje do chodu mega-menu, modální překrytí blokuje akce v pozadí korektně)
- **Desktop:** PASS (Fixní šířka max-w-2xl zabraňuje nečitelně dlouhým řádkům obsahu textu, flexibilní odsazení)
- **Přístupnost (a11y):** PASS (Použit aria-modal="true", role="dialog", aria-labelledby, správný kontrast Tailwind UI neutrálních barev a focus/button hover states, escape zavření přes UI tlačítko)

### QA a Build
- **Linting:** PASS
- **Typecheck:** PASS
- **Build (Vite/ESBuild):** PASS

## ZÁVĚR
Oznámení pro Beta 1.0 verzi bylo implementováno bezpečně. Nenarušuje produkční routing, state management aplikací, ani auth flow. Byla zachována plná nezávislost od existujících systémů.
