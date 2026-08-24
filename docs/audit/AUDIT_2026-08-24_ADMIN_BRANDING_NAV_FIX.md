# Audit Report: Zviditelnění Branding/Logo editoru v administraci
Datum: 2026-08-24
Úkol: OPRAVA ADMIN UI – ZVIDITELNĚNÍ EDITORU LOGA

## 1. Původní stav a zjištění
- Komponenta `BrandingManager.tsx` existovala a byla vykreslována v `AdminDashboard.tsx` podmínkou `{activeTab === 'branding' && <BrandingManager />}`.
- V levé navigaci administrace nicméně chybělo tlačítko, které by nastavilo `activeTab` na hodnotu `branding`. 
- Uživatelé tak neměli standardní způsob, jak se do správy brandingu / loga dostat.

## 2. Provedené změny
- **`src/components/admin/AdminDashboard.tsx`**:
  - Přidáno nové navigační tlačítko "Branding / Logo".
  - Tlačítko volá `setActiveTab('branding')`.
  - Využita existující ikona `ImageIcon` (importovaná jako `Image as ImageIcon` z `lucide-react`).
  - Tlačítko bylo vizuálně sladěno se zbytkem administrace (stejné třídy jako má "Theme & Colors" vč. activního stavu).
  - Tlačítko bylo zařazeno logicky ihned pod položku "Theme & Colors".

## 3. Omezení a nedotčené části
- Žádné změny v backend API.
- Žádné změny ve schématu databáze.
- Žádné změny v logice `BrandingManager` komponenty.
- Žádné změny v SVG sanitizaci (`svgSanitizer.ts`).
- Bylo striktně dbáno na to, aby se změna dotkla pouze UI navigace v administraci.

## 4. Testy a ověření
- `npm run lint`: Prošlo (žádné TypeScript/ESLint chyby novým tlačítkem nevznikly).
- `npx tsc --noEmit`: Prošlo (typová bezpečnost zachována).
- `npm run build`: Prošlo (Vite i Esbuild kompilace proběhly úspěšně).
- `npx prisma validate`: Prošlo (databázové schéma zůstalo beze změny a validní).
- `npm run test`: Regression testy prošly úspěšně (včetně testů na SVG sanitizaci a branding endpointy).

## 5. Bezpečnostní a regresní rizika
- Změna nemění oprávnění – sekce je přístupná jen uživatelům, kteří mají právo prohlížet `AdminDashboard` a následně volat API.
- Žádná hardcoded hesla ani API klíče nebyly přidány (čistá UI změna).

## 6. Závěr a Git stav
- Změny byly omezeny pouze na `AdminDashboard.tsx`.
- Commit obsahuje pouze čistou implementaci navigace v administraci.
- Všechny kontrolní systémy projektu zůstávají zelené (PASS).
