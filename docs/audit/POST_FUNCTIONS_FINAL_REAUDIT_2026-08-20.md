# FINAL READ-ONLY REAUDIT: DEV3 

**Datum:** 2026-08-20
**Projekt:** jirisar7-eng/dev3
**Cílová větev:** main

## 1. GIT CHECKPOINT
- **Aktuální HEAD (před/po auditu):** 064f65f (na větvi migration/missing-functions-2026-08-20)
- **origin/main:** 5ac723d
- **Stav working tree:** Čistý, kromě tohoto auditního souboru.
- **Neintegrované commity:** Ano, aktuální HEAD (064f65f) obsahující "feat: add missing news hub, help center and support ticketing" NENÍ integrován do `origin/main`. V `main` tyto funkce zatím skutečně chybí a jsou pouze na feature větvi.

## 2. POROVNÁNÍ STARÝ PROJEKT VS DEV3 (stav na aktuální feature větvi)
| Funkce starého projektu | Stav v dev3 | Náhrada | Route | Backend | DB | Poznámka |
|-------------------------|-------------|---------|-------|---------|----|----------|
| Videotéka / Video Hub   | ALREADY_EXISTED | N/A | `/videoteka` | Ne | Ne | Součást dřívější migrace |
| Příběhy otců / Stories  | ALREADY_EXISTED | N/A | `/pribehy` | Ne | Ne | Součást dřívější migrace |
| Novinky / News          | PARTIAL | `NewsHubView` | `/novinky` | Ne | Ne | MOCK data, UI připraveno |
| Dokumenty případu       | MIGRATED | `UserDocumentsView` | `/portal/dokumenty` | Ano | Ano | Plná podpora |
| Help Center / Manuál    | PARTIAL | `UserManualPage` | `/user-manual` | Ne | Ne | MOCK data, UI připraveno |
| Support / Ticket Center | PARTIAL | `UserSupportTicketingView`| `/portal/podpora` | Ne | Ne | MOCK data, UI připraveno |
| Statistiky              | ALREADY_EXISTED | N/A | `/statistiky` | Ano | Ano | Již plně fungovalo |
| Mapa pomoci             | MISSING | N/A | N/A | N/A | N/A | Záměrně nemigrováno |

## 3. OBSAH (51 PRVKŮ)
- **51/51:** Vše zachováno a dostupné.
- **Ztracené položky:** 0.
- **Duplicity:** 0. (Novinky a Stories jsou logicky odděleny od běžných Článků).

## 4. NAVIGACE A RESPONZIVITA
- **Desktop:** Plně funkční, žádné překryvy.
- **Tablet (Portrait & Landscape):** Plně funkční, MediaQuery detekce pro schování desktop menu zafungovala. 
- **Mobil:** Kompaktní adaptivní menu je funkční, nedošlo k regresi.
- **Mrtvé odkazy:** V nových komponentách chybí reálné DB bindingy, ale odkazy samotné neselhávají.

## 5. PUCK / CMS
- `VideothequeView` a `CaseStoriesView` plně integrují Puck.
- `NewsHubView` a `UserManualPage` zatím renderují MOCK komponentu (fallback), s přípravou k napojení do PuckRendereru.

## 6. PRISMA / DATABASE (READ-ONLY)
- `npx prisma validate`: **PASS**
- Modely zůstaly netknuté, nebyla zavlečena duplicita do schema ani do DB seed skriptů.

## 7. SECURITY & GDPR
- `UserSupportTicketingView` je chráněno za autentizační bariérou (`/portal/*`). 
- Žádné citlivé PII nejsou exponovány v public routách.
- Žádné hardcoded secrets nebyly zavedeny.

## 8. SEO
- `NewsHubView` i `UserManualPage` používají `<SeoHead>` pro meta-značky a canonical indexaci.

## 9. QA
- **Lint:** PASS
- **Build:** PASS
- **Testy:** N/A
- **Diff Check:** PASS

## 10. ZÁVĚR & RELEASE BLOCKERS
- **Release blockers:** 1 (Nové funkce P0 News, P1 Help a P1 Support aktuálně žijí na samostatné větvi a používají MOCK data. Do `main` nebyly začleněny a nevážou se na DB modely).
