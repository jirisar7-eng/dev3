# AUDIT: Remediace administrace – VÝCHOZÍ STAV (BEFORE)
**Datum a čas:** 2026-08-23
**Projekt:** Táta má právo – dev3
**Repozitář:** jirisar7-eng/dev3

---

## 1. Účel dokumentu
Tento auditní report mapuje bezpečnostní a architektonický stav administrace před zahájením komplexní remediace. Dokument slouží jako referenční bod (baseline) pro ověření úspěšnosti a bezpečnosti provedených změn.

---

## 2. Výchozí stav Git
- **Pracovní větev:** `main`
- **Aktuální commit (HEAD):** `5d840e792a324e824ccf12c0fa7c6227ad371916`
- **Stav origin/main:** `5d840e792a324e824ccf12c0fa7c6227ad371916` (Up to date)
- **Změny v pracovním stromu:** Žádné necommitnuté změny ve zdrojovém kódu (přítomny jsou pouze dočasné untracked pomocné diagnostické skripty).

---

## 3. Identifikovaná rizika a bezpečnostní nálezy (CRITICAL/HIGH)

### [CRITICAL] SEC-01: Absolutní absence autentizace a autorizace u `/api/pracovnici/*`
- **Dotčené endpointy:**
  - `GET /api/pracovnici/pending` – Moderátorská fronta s osobními údaji pracovníků a navrhovatelů je veřejně přístupná.
  - `POST /api/pracovnici` – Kdokoliv může bez přihlášení vytvořit nového pracovníka.
  - `PATCH /api/pracovnici/:id/status` – Kdokoliv může schvalovat (`APPROVED`) nebo odmítat (`REJECTED`) libovolného pracovníka (BOLA/IDOR).
  - `DELETE /api/pracovnici/:id` – Kdokoliv může smazat libovolného pracovníka bez autorizace.
- **Bezpečnostní dopad:** Úplné obcházení moderace. Veřejný útočník může schválit falešné profily, smazat legitimní data a kompromitovat důvěryhodnost registru.

### [CRITICAL] ARCH-01: In-Memory perzistence v `server.ts` přes `dbStore`
- **Popis:** Autentizace, registrace (`/api/auth/register`, `/api/users/quick-create`), správa OAuth (propojení s Google a Microsoft účty) a správa passkeys se zapisují pouze do in-memory objektu `dbStore` namísto perzistentní databáze PostgreSQL přes Prisma.
- **Dopad na integritu dat (P0):** Při každém restartu kontejneru na Cloud Run (např. při nečinnosti, škálování nebo nasazení) dojde k okamžité ztrátě všech nově registrovaných uživatelů, jejich hesel, passkeys a auditních logů.

### [HIGH] SEC-02: Veřejně přístupné CMS endpointy pro čtení draftů
- **Popis:** `/api/cms/...` endpointy v `server.ts` neobsahují dostatečnou ochranu. Tyto endpointy by měly pro administraci vyžadovat oprávnění `ADMIN`.

---

## 4. Dotčené komponenty a soubory
- `server.ts` (gigantický monolitický soubor s API routes)
- `src/services/dbStore.ts` (in-memory úložiště)
- `prisma/schema.prisma` (databázové schéma, které je nyní obcházeno)
- `src/components/admin/ContactModerationManager.tsx` (frontend pro moderaci)

---

## 5. Návrh nápravných opatření (Remediation Plan)
1. **Zabezpečení moderace:** Nasadit middleware `requireAuth` a `requireRole(['MODERATOR', 'ADMIN'])` na všechny `/api/pracovnici/*` endpointy v `server.ts` (kromě veřejného vytváření, kde má být status nastaven na `PENDING`).
2. **Přechod z `dbStore` na Prisma:**
   - Přepsat registraci uživatelů tak, aby ukládala uživatele přímo do PostgreSQL přes `prisma.user.create`.
   - Přepsat autentizační a session lookupy z `dbStore.users` na `prisma.user.findUnique`.
   - Integrovat passkeys do `prisma.passkey` tabulky.
   - Nahradit in-memory audit logy v `dbStore.logAudit` trvalým zápisem do PostgreSQL přes `prisma.auditLog.create`.
3. **Validace a audit po opravě:** Spustit linter, TSC a ověřit celkovou integritu systému.
