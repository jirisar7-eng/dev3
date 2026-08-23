# AUDIT: Validace počtu záznamů v registru soudů

**Datum a čas auditu:** 2026-08-23 00:55:00 CEST  
**Projekt:** Táta má právo – dev3  
**Účel:** Zjištění přesného důvodu rozdílu mezi reportovaným (108) a skutečným (107) počtem soudů v aplikaci.

---

===== COURT COUNT =====
dataset: 107 (záznamů v datovém poli)
DB DEV3: 107 (naimportovaných v Postgres)
API: 107 (vracených backendem)
UI: 107 (zobrazených v RegistrSubjektu)
expected production count: 107

===== DUPLICATE/FILTER =====
přesný důvod rozdílu: Žádný záznam nebyl vyřazen, odfiltrován ani není duplicitní. 
Předchozí reportovaný počet "108 záznamů" vznikl nesprávnou interpretací textového skenování (`grep -c 'type: "SOUD"' src/data/soudyDataset.ts`). Tento příkaz započítal 107 datových instancí a 1 navíc pocházející z hlavičky souboru, kde je definováno TypeScript rozhraní: `export interface CourtEntry { type: "SOUD"; ... }`. 
Skutečná délka pole `soudyDataset` načteného v paměti činí přesně 107 položek. Databáze DEV3, API a klientské UI tedy zobrazují stoprocentně korektní a kompletní stav. Do produkce bude po spuštění importního skriptu přidáno přesně 107 soudních institucí.
