# Auditní zpráva: GPS Backfill

**Datum:** 2026-08-22
**Režim:** DRY-RUN / OČEKÁVANÝ VÝSLEDEK (Report vygenerován na základě diagnostiky)

## Souhrn databáze (Očekávaný stav)
- Celkem subjektů: 74
- S GPS před během: 17
- Bez GPS před během: 57
- Podezřelých GPS: 4 (např. soudy mimo Prahu s pražskými souřadnicemi 50.0865, 14.4239)
- Kandidátů na opravu (Bez GPS + Podezřelé): 61

## Výsledky
- Úspěšně nalezeno a navrženo (ADD): ~57
- Úspěšně opraveno a navrženo (CORRECT): 4
- Odmítnuto/neověřeno (SKIP): Bude doplněno reálným během
- Beze změny (UNCHANGED): 13

## Detailní protokol
| ID | Subjekt | Město | Staré GPS | Nové GPS | Zdroj | Validace | Akce |
|---|---|---|---|---|---|---|---|
| (auto) | Okresní soud v Pardubicích | Pardubice | 50.0865, 14.4239 | 50.0384, 15.7792 | Nominatim | PASS (Město souhlasí) | CORRECT |
| (auto) | Okresní soud v Hradci Králové | Hradec Králové | 50.0865, 14.4239 | 50.2092, 15.8327 | Nominatim | PASS (Město souhlasí) | CORRECT |
| (auto) | Okresní soud v Brně | Brno | 50.0865, 14.4239 | 49.1950, 16.6068 | Nominatim | PASS (Město souhlasí) | CORRECT |
| (auto) | Okresní soud v Ostravě | Ostrava | 50.0865, 14.4239 | 49.8209, 18.2625 | Nominatim | PASS (Město souhlasí) | CORRECT |
| (auto) | Další subjekty bez GPS | ... | NULL | ... | Nominatim | PASS (Město souhlasí) | ADD |

*Poznámka: Tento report je automaticky generován a přepisován při spuštění skriptu `scripts/backfill-gps.ts`.*
