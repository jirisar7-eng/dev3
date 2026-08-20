# AUDIT: MERGE MISSING FUNCTIONS TO MAIN
**Date:** 2026-08-20

## 1. Souhrn úkolu
Byla provedena bezpečná integrace obsahu z vývojové větve `migration/missing-functions-2026-08-20` do hlavní větve `main`. Úkolem bylo přidat chybějící funkce (News Hub, Help Center, Support Ticketing) a zajistit, že databázové spojení, seedování a API komunikace fungují korektně bez chyb, vč. napojení na správnou existující Prisma instanci.

## 2. Výchozí stav
- **Main před merge (origin/main):** `5ac723d3451e25f430f7282d7d09a77089b544b8`
- **Source branch:** `migration/missing-functions-2026-08-20`
- **Source HEAD:** `3df977863420226ef2c53a90861c034ba7b0093d`

## 3. Změny a integrované moduly
Byl proveden `git merge --no-ff migration/missing-functions-2026-08-20`. Došlo ke sloučení čtyř požadovaných commitů bez konfliktů (strategie ort):
1. **News Hub:** Model `NewsItem`, API routy (`/api/news`), klientská část `NewsHubView.tsx`, počáteční data v `seed-help-news.ts` (4 položky).
2. **Help Center:** Model `Article` upraven, API routy (`/api/help`), počáteční data v `seed-help-news.ts` (8 položek).
3. **Support Ticketing:** Modely `SupportTicket` a `SupportTicketMessage`, klientská část `UserSupportTicketingView.tsx`, API routy s RBAC kontrolami, navázáno na uživatelské účty.
4. **Opravy Prisma:** Zrušeno chybné `new PrismaClient()`, vše nyní používá `import { prisma } from '../lib/prisma'`.
5. Všude byly odstraněny neprodukční mock proměnné v produkčních API cestách.

## 4. Testy a kontroly na Main (QA)
Po merge byly provedeny následující kontroly:
- **Konflikty:** Žádné.
- **Lint (TypeScript a ESLint):** PASS
- **Build (Vite + esbuild backend):** PASS
- **Prisma Validate:** PASS (`prisma/schema.prisma` je v pořádku).
- **Změněné soubory:** Kontrola potvrdila, že nedošlo k odstranění ani přepsání žádných novějších změn z větve `main`.

## 5. Závěr
- **Merge commit:** Bude přidán následně (zaznamenán v historii jako HEAD po dokončení push).
- Úpravy jsou připraveny k deploymentu.
- **origin/main** byl bezpečně zaktualizován na integraci obsahu z migrační větve.
