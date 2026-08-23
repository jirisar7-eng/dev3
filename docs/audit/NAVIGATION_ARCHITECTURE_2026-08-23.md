# ZÁVAZNÝ AUDIT A ARCHITEKTURA NAVIGACE – DEV3

**Datum a čas:** 2026-08-23 05:55 PST (12:55 UTC)

## 1. Původní stav navigace
Původní stav navigace byl zjištěn z fallback hodnot `src/config/navigation.ts` a výpisu `/api/cms/nav` (databáze). Původní struktura obsahovala 10 základních kategorií, některé se překrývaly a měly historické struktury (např. "O nás" i "O projektu").

## 2. Nové závazné menu & Mapování na funkce
Níže je strukturovaný pohled nového závazného menu, včetně mapování na routy a stav jejich implementace:

### 🏠 Domů & Veřejnost (cat-home)
- **Domů**: `/` -> EXISTUJE A JE FUNKČNÍ (nav-1)
- **O projektu & Vize**: `/o-projektu` -> EXISTUJE A JE FUNKČNÍ (přesměrováno/přejmenováno ze sub-8-1)
- **Veřejný portál**: `/verejny-portal` (redirect na `/`) -> VYŽADUJE NOVÝ MODUL/ROUTU
- **Přihlásit / Registrace**: `/login` -> EXISTUJE A JE FUNKČNÍ (Auth modální / page)

### 🚨 Pomoc & Komunita (cat-1)
- **SOS krizový plán**: `/sos-plan` -> EXISTUJE A JE FUNKČNÍ
- **Krizový rozcestník**: `/krizova-pomoc` -> EXISTUJE A JE FUNKČNÍ (sloučeno s "Krizový rozcestník pro otce")
- **Právní poradna**: `/pravni-poradna` -> EXISTUJE A JE FUNKČNÍ
- **Fórum / Komunitní podpora**: `/forum` -> EXISTUJE A JE FUNKČNÍ
- **Memento otců**: `/memento` -> EXISTUJE A JE FUNKČNÍ
- **Registr subjektů**: `/registr-subjektu` -> EXISTUJE A JE FUNKČNÍ
- **Mapa subjektů**: `/mapa-subjektu` -> EXISTUJE A JE FUNKČNÍ

### ⚖️ Právo & Opatrovnictví (cat-2)
- **Agenda opatrovnického řízení**: `/agenda` -> EXISTUJE A JE FUNKČNÍ
- **Práva otců & rodičovská odpovědnost**: `/prava` -> EXISTUJE A JE FUNKČNÍ
- **Judikatura**: `/judikatura` -> EXISTUJE A JE FUNKČNÍ
- **Vzory dokumentů & podání**: `/dokumenty` -> EXISTUJE A JE FUNKČNÍ
- **Odborné články & analýzy**: `/clanky` -> EXISTUJE A JE FUNKČNÍ
- **Zákony / e-Sbírka**: `/state-laws` -> EXISTUJE A JE FUNKČNÍ (přejmenováno ze Zákony / e-Legislativa)
- **Průvodce OSPOD**: `/ospod` -> EXISTUJE A JE FUNKČNÍ
- **Průvodce soudním řízením**: `/soud` -> EXISTUJE A JE FUNKČNÍ
- **Finanční a majetkové vypořádání**: `/majetek` -> VYŽADUJE NOVÝ MODUL/ROUTU (bude vytvořeno)

### 👨‍👧 Péče & Spolurodičovství (cat-3)
- **Péče o dítě / Care Hub / simulátor péče**: `/pece` -> EXISTUJE A JE FUNKČNÍ
- **CoParent Hub**: `/portal/coparent` -> EXISTUJE A JE FUNKČNÍ
- **Kalkulačka výživného a nákladů**: `/kalkulacka-vyzivneho` -> EXISTUJE A JE FUNKČNÍ
- **Psychologická podpora dětí**: `/psychologie` -> VYŽADUJE NOVÝ MODUL/ROUTU (bude vytvořeno)

### 💼 Můj případ & Dokumenty (cat-4)
- **Osobní spis otce**: `/muj-pripad` -> EXISTUJE A JE FUNKČNÍ
- **Dokumenty případu & důkazy**: `/portal/dokumenty` -> EXISTUJE A JE FUNKČNÍ
- **AI Case Manager**: `/ai-case-manager` -> EXISTUJE A JE FUNKČNÍ
- **Kalendář a důležité lhůty**: `/kalendar` -> VYŽADUJE NOVÝ MODUL/ROUTU (bude vytvořeno)

### 🤖 AI Nástroje (cat-5)
- **AI Právní Asistent**: `/ai-asistent` -> EXISTUJE A JE FUNKČNÍ
- **AI Průvodce řízením**: `/ai-pruvodce` -> EXISTUJE A JE FUNKČNÍ
- **Generátor formulářů & podání**: `/ai-formulare` -> EXISTUJE A JE FUNKČNÍ
- **Simulátor modelů péče**: `/ai-simulator` -> EXISTUJE A JE FUNKČNÍ

### 🎓 Akademie & Vzdělávání (cat-6)
- **Kurzy pro rodiče**: `/studia` -> EXISTUJE A JE FUNKČNÍ
- **Videotéka & Webináře**: `/videoteka` -> EXISTUJE A JE FUNKČNÍ
- **Kvízy**: `/kvizy` -> EXISTUJE A JE FUNKČNÍ
- **Encyklopedie & Wiki pojmů**: `/wiki` -> EXISTUJE A JE FUNKČNÍ
- **Katalog odborných studií a výzkumů**: `/studie` -> EXISTUJE A JE FUNKČNÍ
- **Statistiky a data**: `/state-statistics` -> EXISTUJE A JE FUNKČNÍ
- **Uživatelský manuál portálu**: `/user-manual` -> EXISTUJE A JE FUNKČNÍ

### 📰 Aktuality & Příběhy (cat-7)
- **Novinky & Zprávy**: `/novinky` -> EXISTUJE A JE FUNKČNÍ
- **Příběhy otců**: `/pribehy` -> EXISTUJE A JE FUNKČNÍ

### 🏛️ O projektu & Podpora (cat-8)
- **O nás & Tvůrci**: `/o-nas` -> EXISTUJE A JE FUNKČNÍ
- **Moje cesta zakladatele**: `/moje-cesta-zakladatele` -> EXISTUJE A JE FUNKČNÍ
- **Podpořte nás / Sponzoři & Partneři**: `/podpora` -> EXISTUJE JAKO DUPLICITA (sloučeno /podporte-nas a /partneri)
- **Kontakt**: `/kontakt` -> EXISTUJE A JE FUNKČNÍ
- **Hledáme dobrovolníky**: `/dobrovolnici` -> EXISTUJE A JE FUNKČNÍ
- **Kodex dobrovolníka**: `/kodex-dobrovolnika` -> EXISTUJE A JE FUNKČNÍ
- **Mapa stránek**: `/sitemap` -> EXISTUJE A JE FUNKČNÍ

### 👤 Můj účet (cat-9)
- **Můj Profil & Nastavení**: `/portal/profil` -> EXISTUJE A JE FUNKČNÍ
- **Zabezpečení**: `/portal/zabezpeceni` -> VYŽADUJE NOVÝ MODUL/ROUTU (odkázáno do sekce profilu / nová routa)
- **Administrace**: `/admin` -> EXISTUJE A JE FUNKČNÍ (Chráněno)
- **Uživatelská podpora & Tickety**: `/portal/tikety` -> EXISTUJE A JE FUNKČNÍ
- **Odhlásit se**: `/logout` -> VYŽADUJE NOVÝ MODUL/ROUTU (odkázáno na sign-out flow)

## 3. Akční kroky
1. Aktualizovat soubor `src/config/navigation.ts` tak, aby plně zrcadlil novou 10-položkovou strukturu (Parent -> Children) dle bodu 2.
2. Vytvořit prázdné placeholder komponenty a routy pro chybějící prvky (`/verejny-portal`, `/majetek`, `/psychologie`, `/kalendar`, `/logout`, `/portal/zabezpeceni`).
3. Nasadit sync script (`sync-nav.js`), který bezpečně v DB provede UPSERT položek. Skript nepomaže uživatelská data.
4. Ověřit RBAC chování: Administrace je a zůstane v render logice omezena výhradně na `ADMIN/SUPER_ADMIN` apod.
5. Provést kompilaci a spuštění end-to-end integrace.


**Git Commit SHA:** `224ba8ac5f8848dea34c9a58f4e51c695c8d6c83`
