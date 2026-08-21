# Fáze 17: Beta 1.0 Product Backlog & Implementation Plan
Datum: 2026-08-21
Branch: feature/phase-12-reintegrated

## 1. Definition of Beta 1.0
**"BETA 1.0 READY"** znamená, že platforma je:
- **Bezpečná**: Plně integrované RBAC, MFA, Ochrana proti IDOR/BOLA a bezpečně oddělená uživatelská data.
- **Krizově použitelná**: Poskytuje okamžitou pomoc v prvních 48 hodinách, funkční B.I.F.F. nástroj a krizové kontakty.
- **Bez klamavých funkcí**: Neobsahuje žádné hardcodované placeholdery, které se tváří jako funkce (mock data).
- **Právně odpovědná**: Všudypřítomné disclaimery, že AI a kalkulačky nenahrazují advokáta ani závazné rozhodnutí soudu.
- **Mobilně přístupná a instalovatelná**: Responzivní design a základní vrstva PWA (manifest, instalace ikony na plochu).

## 2. Beta 1.0 Backlog (Prioritization)
*Rozdělení na CONTENT ONLY, UI+LOGIC, FULL STACK, AI FEATURE, INFRASTRUCTURE*

| ID | Funkce | Kategorie | Priorita | Typ | Existující modul | Beta 1.0 |
|---|---|---|---|---|---|---|
| 1 | Checklist prvních 48 h | Krizová pomoc | P0 | CONTENT+UI | `SosPlanView` | YES |
| 2 | Krizové linky a kontakty | Krizová pomoc | P0 | CONTENT | `RegistrSubjektu`, `SosPlanView` | YES |
| 3 | B.I.F.F. komunikace | Psychohygiena | P0 | AI FEATURE | `AiAssistantView` | YES (Hotovo) |
| 4 | Generátor podání | Právní funkce | P0 | FULL STACK | `AiFormsView` | YES (Hotovo) |
| 5 | CoParentHub (Základ) | Samostatné rod. | P0 | FULL STACK | `CoParentPage` | YES (Hotovo) |
| 6 | Kalkulačka výživného | Právní funkce | P1 | UI+LOGIC | **NOVÝ (P1)** | YES |
| 7 | Průvodce soudem | Právní funkce | P1 | CONTENT+UI | `AiGuideView`, Nový obsah | YES |
| 8 | PWA Foundation | Offline | P1 | INFRA | **NOVÝ** | YES |
| 9 | OSPOD Manuál | Úřady | P1 | CONTENT | N/A | YES |
| 10 | Advokáti a mediátoři | Právní funkce | P1 | FULL STACK | `RegistrSubjektu` | YES (Hotovo) |
| 11 | Oddlužení, ÚMPOD, OČR | Právní / Úřady | P2 | CONTENT | N/A | NO (Beta 1.1) |
| 12 | Mentoring (Tátové tátům)| Psychohygiena | P2 | FULL STACK | `ForumView` | NO (Beta 1.5) |
| 13 | Secure Offline Case Data| Offline | P3 | INFRA | N/A | NO (Future) |

## 3. Detailní návrh: Kalkulačka výživného (P1)
**Vstupní údaje:**
- Čistý měsíční příjem povinného rodiče (CZK).
- Počet dětí a jejich věkové kategorie (0-5, 6-9, 10-14, 15+ let).
- Počet dní péče v měsíci (pro určení podílu péče, např. střídavá 15/15, výlučná 4/26).
- Další vyživovací povinnosti (počet dalších dětí/manželek).

**Výpočetní logika:**
- Založeno na aktuální doporučující tabulce Ministerstva spravedlnosti ČR.
- Zohlednění podílu péče (snížení alimentů při rozsáhlejším styku/střídavé péči).
- Stanovení kontrolní částky (zůstatek pro povinného).

**Výstup:**
- Orientační rozpětí výživného (např. 3500 - 4500 Kč).
- **Právní disclaimer**: Zvýrazněné upozornění, že výpočet je orientační, soud vždy hodnotí celkovou životní úroveň a specifické potřeby dítěte. Kalkulačka nemá právní závaznost.

## 4. PWA / Offline Rozhodnutí
- **17A PWA Foundation (Beta 1.0 - P1)**: Přidání `manifest.json`, základní Service Worker s precachingem statických souborů (CSS, JS, logo). Účel: Aplikace jde nainstalovat na plochu.
- **17B Offline Public Content (Beta 1.1 - P2)**: Caching statických krizových článků (NetworkFirst fallback na CacheFirst).
- **17C Offline User Tools (Beta 1.5 - P2)**: Zajištění uložení checklistů (SosPlan) v unifikovaném state manageru do IndexedDB.
- **17D Secure Offline Case Data (Future - P3)**: Složitá asymetrická kryptografie pro uchování spisu v IndexedDB.
- **17E Synchronization (Future - P3)**: Background sync queue pro odesílání CoParent zpráv bez signálu.

## 5. Externí Data a AI Guardrails
**Externí Data (Advokáti, OSPOD, Soudy)**:
- Zdroj: Importováno z veřejných rejstříků / manuálně udržováno v CMS.
- Validace: Označení `Datum poslední aktualizace` na UI.
- Fallback: Pokud selže API e-Sbírky, zobrazí se cache z databáze a varování "Data nemusí být aktuální".

**AI Guardrails**:
- **B.I.F.F. Konvertor (GUARDED)**: Nesmí radit právo. Pouze analyzuje tón textu.
- **Generátor podání (HIGH RISK)**: Musí proaktivně hlásit "Vygenerovaný dokument pečlivě zkontrolujte. Jde o hrubý návrh, nikoliv finální podání." Veškeré generování je logováno na backendu a vázáno na Rate Limiting.
- **Právní dotazy (HIGH RISK)**: Systém promptů má zakázáno vytvářet absolutní právní závěry, musí navrhovat varianty a odkazovat na reálné paragrafy/advokáty.

## 6. Implementační pořadí
1. **PHASE 17A**: Kalkulačka výživného (UI + Logic, bez nové DB tabulky - pouze výpočet na klientovi).
2. **PHASE 17B**: PWA Foundation (Vite PWA plugin, manifest.json, sw.js konfigurace).
3. **PHASE 17C**: Doplnění krizového textového obsahu a právních disclaimerů (Content gap fill).

## 7. Beta 1.0 Release Gate Checklist
- [x] REQUIRED: Security, Auth, RBAC, MFA, IDOR/BOLA, Rate Limiting (Hotovo ve Fázi 14/15)
- [ ] REQUIRED: Kalkulačka výživného (chybí - P1)
- [ ] REQUIRED: PWA Foundation (manifest, ikony) (chybí - P1)
- [ ] REQUIRED: Legal disclaimers na AI a kalkulačce (chybí - P1)
- [x] REQUIRED: SOS plán a krizové linky (Hotovo / částečně)
- [ ] OPTIONAL: Offline case data, Mentoring síť (P3)

## 8. Roadmapa
- **NOW**: Dokončení Fáze 17 (Plán), 17A (Kalkulačka), 17B (PWA).
- **NEXT**: Tvorba obsahu (články OSPOD, Krizové situace).
- **BETA 1.0**: Veřejný launch s disclaimery, aktivním CoParent hubem a AI generátory.
- **BETA 1.1**: Offline Public Content (články dostupné v metru).
- **POST-BETA**: Asistovaný styk integrace, Mentoring.
- **FUTURE**: E2E šifrování, PWA Background Sync pro CoParent chat.
