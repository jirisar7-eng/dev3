# AUDIT: Oprava UX hodnocení subjektů – přihlášení povinné

**Datum a čas auditu:** 2026-08-23 01:59:00 CEST
**Projekt:** Táta má právo – dev3
**Účel:** Zabránit nepřihlášeným uživatelům odesílat hodnocení (a zamezit klamnému zobrazení tlačítka "Odeslat hodnocení", které končilo tichým selháním).

---

===== PŮVODNÍ PROBLÉM =====
Formuláře pro přidání věcného hodnocení k subjektu (a pracovníkovi) umožňovaly uživateli vyplnit data a kliknout na tlačítko „Odeslat hodnocení“, i když nebyl přihlášen. Backend požadavek logicky a správně odmítal (ověření `requireAuth` na POST /reviews endpointu), avšak frontend nevydával žádnou zpětnou vazbu a tlačítko se tvářilo nečinně (silent fail).

===== NALEZENÉ KOMPONENTY A MECHANISMUS =====
Byly identifikovány tyto komponenty obsahující formuláře pro hodnocení:
1. \`src/components/public/RegistrSubjektu.tsx\`
   - Tlačítko pro hodnocení subjektu
   - Tlačítko pro hodnocení pracovníka
2. \`src/components/public/MapaSubjektuView.tsx\`
   - Tlačítko pro hodnocení subjektu na mapě

Autentizační mechanismus:
Aplikace využívá hook \`useAuth()\` poskytující \`currentUser\`. Pro přesměrování (včetně loginu) se využívá funkce \`onNavigate\`, která je předávána z parent komponenty.

===== PROVEDENÉ ZMĚNY =====
1. Do dotčených formulářů (\`RegistrSubjektu.tsx\`, \`MapaSubjektuView.tsx\`) byla vložena podmínka pro zobrazení:
   - Pokud je uživatel \`currentUser\` přihlášen, vidí standardní tlačítko "Odeslat hodnocení" (a provede se běžný \`POST /api/subjekty/:id/reviews\`).
   - Pokud není přihlášen, zobrazí se varování "Pro přidání hodnocení se musíte přihlásit." s tlačítkem "Přihlásit se pro přidání hodnocení", které uživatele přesměruje na \`/login\` pomocí \`onNavigate\` (nebo \`window.location.href\`).
2. V \`MapaSubjektuView.tsx\` byl importován \`useAuth\` a destrukturován \`currentUser\`.
3. Metody \`handleAddReview\` a \`handleAddPracovnikReview\` byly upraveny, aby explicitně reagovaly na případný návratový stav \`401\` či \`403\` (vypršení relace) a zeptaly se uživatele, zda se chce znovu přihlásit, místo předchozího "tichého" ignore/catch chování.
4. \`requireAuth\` na backendu (\`src/routes/subjektRoutes.ts\`) ZŮSTAL PLOCHOU ZACHOVÁN (není upraveno = bezpečnost zachována).

===== TESTOVÁNÍ A OCHRANA DAT =====
- Databáze nezměněna.
- Žádný OSPOD import neproběhl.
- Frontend zkontrolován přes \`npx tsc --noEmit\`.
- Oprava je implementována pomocí existujících autorizačních procesů (\`/login\` směřovač a \`AuthContext\`).

===== GIT A NASAZENÍ =====
- Změny jsou pushnuty přímo z AI Studia na \`origin/main\`.
