# FÁZE 18.5: PWA INSTALL EXPERIENCE

Tento audit zachycuje architektonické a vizuální řešení funkce instalace PWA na webu, odděleně od logiky backendu a bezpečného úložiště.

## Změněné a nové soubory
- `src/hooks/usePWAInstall.ts`: Nový custom hook obsahující logiku zjišťování standalone režimu, iOS detekci, cooldown tracker a listenery na událost `beforeinstallprompt`.
- `src/components/common/PWAInstallPrompt.tsx`: Prezentační komponenta (banner v dolní části obrazovky), která uživatele vyzývá k instalaci na základě dat z hooku.
- `src/App.tsx`: Zapojení `<PWAInstallPrompt />` do globálního layoutu na úrovni `MainApp`.
- `tests/pwa-install-prompt.test.ts`: Nové logické testy pokrývající iOS detekci, cooldown mechanismus (14 dní), detekci standalone režimu a beforeinstallprompt event.
- `scripts/test-runner.js`: Přidání testu do hlavní pipeline.

## PWA Install Mechanism & UX
- **Event Listeners**: Zachytává `beforeinstallprompt` a vyvolává standardní nativní dialog `prompt()`. Po úspěšné instalaci, událost `appinstalled` zajistí bezprostřední skrytí nabídky.
- **Odložení (Cooldown)**: Tlačítko "Později" skryje prompt a uloží do `localStorage` (bez citlivých údajů) timestamp. Systém čeká 14 dní (`daysSinceDismissed < 14`), než se prompt ukáže znovu, čímž brání agresivnímu obtěžování uživatele.
- **Design Systém**: Prompt využívá Tailwind CSS s vizuálem spodního popup dialogu, který neblokuje používání aplikace. Obsahuje `Lucide React` ikony, má `z-50` vrstvu (ne modal), čímž nepřekrývá kritické právní funkce.
- **Standalone Check**: Aplikace se sama ujišťuje (`display-mode: standalone`), zda již neběží mimo prohlížeč. Pokud ano, prompt se nikdy nevykresluje.

## iOS Fallback
- Apple zařízení plně nepodporují událost `beforeinstallprompt`. Pro iOS je připraven informační fallback:
- Zobrazuje krátký text s ikonou Sdílet a pokyny ("Přidat na plochu").
- Detekce je zajištěna přes kontrolu `userAgent` a nepřítomnost `.MSStream`.

## Accessibility (A11y)
- **Klávesnice**: Dialog lze zavřít pomocí klávesy `Escape`. Tlačítka i "X" prvek mají `focus:outline-none focus:ring-2` s odpovídající barvou.
- **Screen Readery**: `aria-labelledby`, `aria-describedby` pro spojení nadpisu a popisu s rolí `dialog`. Ikony mají `aria-hidden="true"`. Tlačítka obsahují jasné `aria-label`.

## Bezpečnost (Security)
- PWA instalace nevyužívá ani neukládá žádná uživatelská data, session tokeny či jakýkoli kryptografický materiál.
- Zcela nezávislé na existujícím `SecureDB` / `CryptoService`.
- Hodnota v `localStorage` (`pwa_install_dismissed_date`) je pouze nesenzitivní časové razítko (timestamp v milisekundách).
