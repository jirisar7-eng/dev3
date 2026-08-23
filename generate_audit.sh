cat << 'MD_EOF' > docs/audit/MAP_MARKERS_ENTITY_CONFIG_IMPLEMENTATION_2026-08-23.md
# AUDIT: Implementace mapových markerů a sjednocení konfigurace subjektů

**Datum:** 2026-08-23
**Projekt:** Táta má právo (dev3)

## 1. Co bylo změněno
Byla vytvořena centrální konfigurace pro typy subjektů (Single Source of Truth), která nyní obsahuje společné definice názvů, ikon, barev, Tailwind badge tříd a SVG cest pro mapové markery. Byla odstraněna předchozí hard-coded SVG ikona `MapPin` v Leaflet markerech a nahrazena dynamicky vykreslovanou ikonou na základě typu subjektu z této konfigurace. Z formulářů pro administraci byly odstraněny natvrdo zadané možnosti a nově se generují podle naší centrální konfigurace. Byla též opravena ikona u filtru "Všechny subjekty".

## 2. Které soubory byly změněny
- `src/config/entityConfig.ts` (nový soubor)
- `src/components/public/SubjektyMap.tsx`
- `src/components/public/RegistrSubjektu.tsx`
- `src/components/public/MapaSubjektuView.tsx`
- `src/components/admin/SubjektManager.tsx`

## 3. Jak byla odstraněna duplicita
Duplicitní konstanty `ENTITY_CONFIG` z `RegistrSubjektu.tsx` a `MapaSubjektuView.tsx` byly kompletně odstraněny. Nově tyto komponenty importují `ENTITY_CONFIG` z `src/config/entityConfig.ts`. V `SubjektyMap.tsx` byly odebrány lokální funkce jako `getEntityPinColor` a `formatEntityType`, a vše je nyní řízeno centrální konfigurací. 

## 4. Jak fungují nové markery
Komponenta `SubjektMarker` nyní využívá funkci `createCustomPinIcon`, která si z `ENTITY_CONFIG` vytáhne jak specifickou HEX barvu (pomocí `pinColorHex`), tak vlastní cestu v SVG (pomocí `svgPath`). Tato funkce dynamicky sestavuje HTML string pro `L.divIcon`, čímž se docílilo toho, že každý marker má vlastní a odpovídající ikonu v jednotném kruhovém podkladu. Pokud není zadán typ (např. Všechny subjekty), použije se fallback univerzální `MapPin` ikony definovaný v konfiguraci.

## 5. Jaké typy mají jaké ikony
- **Soud:** váhy (Lucide: `Scale`)
- **OSPOD:** budova (Lucide: `Building2`)
- **Znalec:** odznak (Lucide: `Award`)
- **Advokát:** aktovka (Lucide: `Briefcase`)
- **Poradna / Mediace:** podání ruky a srdce (Lucide: `HeartHandshake`)
- **Všechny subjekty:** neutrální mapový špendlík (Lucide: `MapPin`)

## 6. Accessibility změny
Do `L.divIcon` markeru byly přidány atributy `aria-label` a `title`, které na základě centrální konfigurace (badge text) a samotného názvu subjektu vytvoří jasný popisek.
Příklad: `aria-label="Soud - Okresní soud v Pardubicích"`. Nyní mohou čtečky obrazovky přečíst jasnou identifikaci subjektu bez nutnosti jeho manuálního prokliku a zobrazení popupu.

## 7. Testy
Nebyly smazány stávající testy. Komponenty se načtou korektně, mapové filtry v obou Views fungují. Mapové zobrazení bezchybně zobrazuje nové marker SVG s rozdílnými tvary a správnými barvami, responzivní design filtru a detailu na mobilních zařízeních se nezměnil (prošlo vizuální i build kontrolou).

## 8. TypeScript výsledek
- **TSC:** PASS (bez chyb vztahujících se k provedené modifikaci komponent)

## 9. Build výsledek
- **BUILD:** PASS (`npm run build` kompilace zkompletována úspěšně a vytvořila odpovídající bundle pro klientskou / serverovou část).

## 10. Potvrzení DB Schema
- **DB SCHEMA:** UNCHANGED (Migrace a databázové struktury včetně Prismy zůstaly absolutně beze změn)

## 11. Potvrzení produkční infrastruktury
- **PRODUCTION INFRASTRUCTURE:** UNCHANGED (Docker file, síťování ani CI/CD deploy pipeline nebyly upraveny).

## 12. Případné problémy a odložené úkoly
Během integrace Leaflet komponent byly použity statické HTML/SVG stringy. Toto řešení je nejbezpečnější pro React-Leaflet most, nicméně při budoucím přepisu renderovacího jádra mapy na modernější stack může být zváženo nativní vyrenderování Reactových komponent uvnitř portálů, aby se mohly ikony Lucide-react importovat přímo i do custom markeru (Leaflet však toto v 1.x verzi neumožňuje snadno bez performance penalizace).

## 13. Doporučení pro budoucí clustering
Jelikož v budoucnu může počet zobrazených subjektů přerůst stovky objektů, doporučuji zařadit knihovnu jako `react-leaflet-cluster` (nebo `supercluster`). V takovém případě bude nutné zajistit, aby `iconCreateFunction` na clusteru zohlednil `ENTITY_CONFIG` – například rozdělením clusteru na koláčový graf procentuálního zastoupení subjektů v něm obsažených (Donut marker s barvami typů). Dnes by zavedení clusteringu zásadně zasáhlo logiku detail popupu a nebylo doporučeno tímto zadáním.
MD_EOF
echo "Audit file created at docs/audit/MAP_MARKERS_ENTITY_CONFIG_IMPLEMENTATION_2026-08-23.md"
