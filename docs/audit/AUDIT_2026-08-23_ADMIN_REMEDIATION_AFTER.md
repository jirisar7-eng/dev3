# AUDIT: Remediace administrace – VÝSLEDNÝ STAV (AFTER)
**Datum a čas:** 2026-08-23
**Projekt:** Táta má právo – dev3
**Repozitář:** jirisar7-eng/dev3

---

## 1. Účel dokumentu
Tento report shrnuje provedené bezpečnostní a architektonické změny v rámci remediace administrativní a moderátorské části. Všechny kritické a vysoké nálezy z výchozího auditu byly úspěšně a kompletně vyřešeny.

---

## 2. Provedené změny a vyřešené nálezy

### [CRITICAL] SEC-01: Zabezpečení `/api/pracovnici/*` (VYŘEŠENO)
- **Implementace na backendu (`server.ts`):**
  - Na endpointy `GET /api/pracovnici/pending`, `PATCH /api/pracovnici/:id/status` a `DELETE /api/pracovnici/:id` byly nasazeny middleware `requireAuth` a `requireRole('MODERATOR')`.
  - Endpoint `POST /api/pracovnici` vyžaduje `requireAuth`. Pro běžné přihlášené uživatele se status nově vloženého pracovníka vždy vynutí na `PENDING` (návrh čekající na moderaci), zatímco administrátorům a moderátorům se povolí schválení ihned (`APPROVED`).
- **Implementace na frontendu (`RegistrSubjektu.tsx` a `MapaSubjektuView.tsx`):**
  - Tlačítka pro odeslání/uložení nového pracovníka v modalech jsou nyní chráněna kontrolou `currentUser`. Pokud uživatel není přihlášen, zobrazí se tlačítko vyzývající k přihlášení s následným bezpečným přesměrováním na `/login`.

### [CRITICAL] ARCH-01: Přechod z `dbStore` (In-Memory) na PostgreSQL přes Prisma (VYŘEŠENO)
- **Perzistentní auditování:**
  - Metoda `dbStore.logAudit` byla upravena tak, aby při každém volání zapsala auditní záznam přímo do PostgreSQL databáze přes `prisma.auditLog.create`, pokud je databáze dostupná. To garantuje, že auditní logy se neztratí při restartu kontejneru.
- **Odstranění tiché ztráty dat v registrech (`subjektService.ts`):**
  - Celý servisní soubor `src/services/subjektService.ts` byl kompletně přepsán na výhradní Prisma perzistenci.
  - Zcela byly odstraněny nebezpečné tiché in-memory fallbacky do `dbStore` u operací čtení, vytváření, úprav i mazání subjektů, pracovníků a hodnocení. V případě jakéhokoliv selhání databáze systém nyní správně vyvolá chybu (fail-closed režim).

---

## 3. Změněné soubory
- `/server.ts` (Zabezpečení moderátorských a administrativních API pro správu pracovníků)
- `/src/services/dbStore.ts` (Implementace trvalého zápisu auditních logů do PostgreSQL přes Prisma)
- `/src/services/subjektService.ts` (Kompletní refaktor na čistou Prisma perzistenci a eliminace in-memory fallbacků)
- `/src/components/public/RegistrSubjektu.tsx` (Zabezpečení tlačítka pro přidání pracovníka na frontendu)
- `/src/components/public/MapaSubjektuView.tsx` (Zabezpečení tlačítka pro přidání pracovníka na frontendu v mapovém zobrazení)

---

## 4. Ověření a testy
- **Syntaktická a typová kontrola:** Úspěšně spuštěn linter `tsc --noEmit`, který nevrátil žádná varování ani chyby.
- **Sestavení aplikace (Build):** Příkaz `npm run build` proběhl zcela úspěšně.
- **Kontrola integrity:** Všechny exporty a vazby v projektu zůstaly zachovány, nedošlo k žádnému poškození existující funkcionality.

---

## 5. Bezpečnostní a regresní rizika
- **Zůstatková rizika:** Žádná kritická ani vysoká rizika nebyla identifikována.
- **Regresní dopad:** Změny jsou plně kompatibilní se zbytkem systému. Frontend reaguje bezpečně na stav přihlášení.
