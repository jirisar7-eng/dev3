# Fáze 16: Content, Function & Offline Gap Analysis
Datum: 2026-08-21
Branch: feature/phase-12-reintegrated
Aktuální HEAD: e691870a979bdfc64db3099bdfc65834faa915bc

Tento audit představuje ucelenou analýzu existujících funkcí, chybějícího obsahu (Content Gap), funkčních mezer (Functional Gap) a připravenosti aplikace pro offline režim (PWA).

## 1. Současná inventura (Current Portal Inventory)
Aplikace běží na vlastním klient-side routeru nad Next/Vite (PublicPortal, UserDashboard, AdminDashboard).

- **Hlavní UI Moduly**: RegistrSubjektu, AiAssistantView, AiFormsView, AiGuideView, AiCaseManagerView, AiSimulatorView, SosPlanView, ForumView, CaseStoriesView, NewsHubView, CaseLawView, AgendaView.
- **Privátní UI Moduly**: MyCasePage, CoParentHubPage (s taby: Přehled, Děti, Kalendář, Dohody, Zprávy, Předávání, Výdaje, Dokumenty, Věci).
- **Prisma Databázové modely**: Přes 75 modelů, mimo jiné pro obsah (Article, FAQ), případy (UserCase, Child), subjekty (Subjekt), komunitu (ForumThread), coparenting (CoParentSpace, CoParentHandover, CoParentMessage, CoParentExpense) a audity (AuditLog).
- **Stav API**: Endpointy pro Ai (s rate limitingem), Subjekty, Audit, VPS management, a Auth (včetně WebAuthn / Passkeys a 2FA).

## 2. Content & Functional Gap Analysis

### A. KRIZOVÁ INTERVENCE
| ID | Název | Kategorie | Typ práce | Priorita | Složitost | Stav / Existující Modul |
|---|---|---|---|---|---|---|
| 1 | Checklist prvních 48 hodin | Krizová intervence | EXISTUJE (částečně) | P0 | S | **PARTIAL**: `SosPlanView` má UI a LocalStorage, chybí DB sync. |
| 2 | Krizové linky a pomoc | Krizová intervence | EXISTUJE (částečně) | P0 | S | **PARTIAL**: `SupportView`, `RegistrSubjektu`. |
| 3 | Krizové ubytování | Krizová intervence | ROZŠÍŘIT OBSAH | P1 | S | **CONTENT ONLY** (chybí specifické entity). |
| 4 | MOP a sociální dávky | Krizová intervence | ROZŠÍŘIT OBSAH | P1 | S | **CONTENT ONLY**. |
| 5 | Falešná obvinění | Krizová intervence | ROZŠÍŘIT OBSAH | P1 | M | **CONTENT ONLY**. |

### B. PRÁVNÍ RÁMEC
| ID | Název | Kategorie | Typ práce | Priorita | Složitost | Stav / Existující Modul |
|---|---|---|---|---|---|---|
| 6 | Generátor soudních podání | Právní rámec | EXISTUJE | P0 | M | **IMPLEMENTED**: `AiFormsView` s generátory. |
| 7 | Kalkulačka výživného | Právní rámec | NOVÁ FUNKCE | P1 | L | **NOT IMPLEMENTED**: Požaduje výpočetní modul. |
| 8 | Průvodce soudem | Právní rámec | EXISTUJE | P0 | M | **IMPLEMENTED**: `AiGuideView`, `CaseLawView`. |
| 9 | Znalecké posudky | Právní rámec | ROZŠÍŘIT OBSAH | P2 | S | **CONTENT ONLY**. |
| 10 | Výkon rozhodnutí | Právní rámec | ROZŠÍŘIT OBSAH | P1 | S | **CONTENT ONLY**. |
| 11 | Advokáti a mediátoři | Právní rámec | EXISTUJE | P0 | M | **IMPLEMENTED**: `RegistrSubjektu`. |
| 12 | Odvolání a stížnosti | Právní rámec | ROZŠÍŘIT OBSAH | P2 | S | **CONTENT ONLY**. |

### C. ÚŘADY
| ID | Název | Kategorie | Typ práce | Priorita | Složitost | Stav / Existující Modul |
|---|---|---|---|---|---|---|
| 13 | Manuál OSPOD | Úřady | EXISTUJE (částečně) | P1 | M | **PARTIAL**: Ošetřeno přes `AgendaView` a `AiGuideView`. |
| 14 | Nahlížení do spisu | Úřady | ROZŠÍŘIT OBSAH | P2 | S | **CONTENT ONLY**. |
| 15 | ÚP a finance | Úřady | ROZŠÍŘIT OBSAH | P2 | S | **CONTENT ONLY**. |
| 16 | ÚMPOD / únosy | Úřady | ROZŠÍŘIT OBSAH | P2 | S | **CONTENT ONLY**. |
| 17 | Oddlužení / dluhy | Úřady | ROZŠÍŘIT OBSAH | P2 | S | **CONTENT ONLY**. |

### D. ZDRAVOTNICTVÍ
| ID | Název | Kategorie | Typ práce | Priorita | Složitost | Stav / Existující Modul |
|---|---|---|---|---|---|---|
| 18 | Práva ve zdravotnictví | Zdravotnictví | ROZŠÍŘIT OBSAH | P2 | S | **CONTENT ONLY**. |
| 19 | Obstrukce u pediatrů | Zdravotnictví | ROZŠÍŘIT OBSAH | P2 | S | **CONTENT ONLY**. |
| 20 | Dětská psychologie | Zdravotnictví | ROZŠÍŘIT OBSAH | P2 | S | **CONTENT ONLY**. |
| 21 | OČR a pracovní neschop. | Zdravotnictví | ROZŠÍŘIT OBSAH | P2 | S | **CONTENT ONLY**. |

### E. ŠKOLY
| ID | Název | Kategorie | Typ práce | Priorita | Složitost | Stav / Existující Modul |
|---|---|---|---|---|---|---|
| 22 | Práva vůči ZŠ/MŠ | Školy | ROZŠÍŘIT OBSAH | P2 | S | **CONTENT ONLY**. |
| 23 | Změna školy | Školy | ROZŠÍŘIT OBSAH | P2 | S | **CONTENT ONLY**. |
| 24 | Školní náklady | Školy | ROZŠÍŘIT OBSAH | P2 | S | **CONTENT ONLY**. |
| 25 | Dopisy ředitelům | Školy | EXISTUJE (částečně) | P2 | S | **PARTIAL**: Zvládne `AiFormsView` přes prompt. |

### F. SAMOSTATNÉ RODIČOVSTVÍ
| ID | Název | Kategorie | Typ práce | Priorita | Složitost | Stav / Existující Modul |
|---|---|---|---|---|---|---|
| 26 | Vybavení domácnosti | Sam. rodičovství | ROZŠÍŘIT OBSAH | P2 | S | **CONTENT ONLY**. |
| 27 | Aplikace sdíleného rod. | Sam. rodičovství | EXISTUJE | P0 | XL | **IMPLEMENTED**: `CoParentHubPage` plně funkční vč. DB (CoParentSpace). |
| 28 | Pracovněprávní ochrana | Sam. rodičovství | ROZŠÍŘIT OBSAH | P2 | S | **CONTENT ONLY**. |
| 29 | Předávání dětí | Sam. rodičovství | EXISTUJE | P1 | M | **IMPLEMENTED**: Tab `handovers` uvnitř `CoParentHubPage`. |

### G. VZTAHY A PSYCHOHYGIENA
| ID | Název | Kategorie | Typ práce | Priorita | Složitost | Stav / Existující Modul |
|---|---|---|---|---|---|---|
| 30 | Rodičovské odcizení (PAS) | Psychohygiena | EXISTUJE (částečně) | P1 | M | **PARTIAL**: Podporováno v `CaseStoriesView` a `ForumView`. |
| 31 | B.I.F.F. komunikace | Psychohygiena | EXISTUJE | P0 | M | **IMPLEMENTED**: Nástroj na konverzi a AI Assistant. |
| 32 | Tátové tátům | Psychohygiena | EXISTUJE | P1 | M | **IMPLEMENTED**: `ForumView` a mentorský systém. |
| 33 | Asistovaný styk | Psychohygiena | ROZŠÍŘIT OBSAH | P2 | S | **CONTENT ONLY**. |
| 34 | Nový partner | Psychohygiena | ROZŠÍŘIT OBSAH | P2 | S | **CONTENT ONLY**. |
| 35 | Prevence vyhoření | Psychohygiena | ROZŠÍŘIT OBSAH | P2 | S | **CONTENT ONLY**. |

## 3. Duplicity
- Nebyly nalezeny hrubé duplicity; naopak, požadavek "Dopisy ředitelům" lze integrovat do stávajícího `AiFormsView` a nemusí vznikat nový modul. "Generátor soudních podání" a "Advokáti" jsou plně integrovány do `AiFormsView` a `RegistrSubjektu`.

## 4. Offline / PWA Gap Analysis
- **Service Worker / Manifest**: Chybí (`NOT READY`).
- **Caching**: Statické a frontend assety se nesyncují offline (`NOT READY`).
- **Data storage**: Aplikace využívá 39x `localStorage` (většinou na tokeny, cookies a stav `SosPlanView`). `IndexedDB` pro ukládání strukturálních dat (např. formuláře a off-grid zprávy) chybí úplně (`NOT READY`).
- **Celkový stav**: `NOT READY`. Aplikace je silně závislá na síťovém připojení a databázi PostgreSQL.

## 5. Návrh Offline Architektury (Pro budoucí implementaci)
- **16A — PWA foundation**: Instalace `vite-plugin-pwa`, generování webového manifestu a Service Worker kostry. Priorita: P1.
- **16B — Offline content**: Do precache přidat UI assety a kritické krizové stránky (SOS Plan, základní formáty B.I.F.F.). K využití Workbox `NetworkFirst` pro články. Priorita: P1.
- **16C — Offline tools**: Migrace dat SOS plánu z LocalStorage na unifikované stavové úložiště. Nástroje jako B.I.F.F konvertor bez sítě fungovat nebudou (závislost na LLM API), tyto budou hlásit "Requires Network". Priorita: P2.
- **16D — Secure offline case data**: Pro offline čtení opatrovnických spisů zavedení asymetricky šifrované IndexedDB databáze (např. RxDB / localforage). Priorita: P2.
- **16E — Synchronization**: Fronta (Sync Queue) při odesílání CoParent komunikace v metru/vlaku přes Background Sync API. Conflict resolution řešeno Last-Write-Wins (Timestamp) na entitách. Priorita: P2.

## 6. Beta 1.0 Priority (Backlog)
- **P0 (Kritické pro spuštění)**: Registr Subjektů, B.I.F.F. nástroj, SOS Krizový plán, Generátor návrhů (základní set) a Shared Parenting (kalendář).
- **P1 (Velmi důležité)**: Kalkulačka výživného, Základní PWA (aby šlo nainstalovat na plochu), Průvodce opatrovnickým soudem.
- **P2 (Doplnění po launchi)**: RxDB/offline šifrovaná data, pokročilé vzdělávací články, Mezinárodní únosy, Oddlužení.
