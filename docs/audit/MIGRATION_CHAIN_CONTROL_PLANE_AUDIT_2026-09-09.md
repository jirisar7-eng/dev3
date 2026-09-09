# Migrační řetězec — Control Plane audit

Datum: 2026-09-09
Větev: `audit/migration-chain-control-plane-20260909`
Base SHA: `b99014bd59ef76aab41be0d102f41a9a46fb3fe5`

## Rozsah

Read-only audit migrační historie, fyzických databázových objektů
a kontrolních součtů migrací.

Nebyla změněna aplikace, Prisma schéma, migrace, DEV3 ani PROD3.
Nebyl použit `prisma db push`, `migrate resolve` ani deploy.

## Hlavní příčina

Čistý `prisma migrate deploy` není reprodukovatelný.

Migrace `20260829_add_audit_finding_model` vytváří cizí klíč
na tabulku `ControlPlaneAction`. Tato tabulka vzniká až v následující
migraci `20260829_add_control_plane_models`.

Čistá databáze proto skončí v první z těchto migrací chybou:

- Prisma: `P3018`
- PostgreSQL: `42P01`
- Chybějící relace: `ControlPlaneAction`

Pořadí adresářů neodpovídá skutečnému historickému pořadí nasazení.

## Historické pořadí

Control Plane migrace vznikla v commitu `ab6d018` dne 2026-08-29
ve 12:23 UTC.

Audit Finding migrace byla následně přidána v commitu `3bc57da`
dne 2026-08-29 v 16:31 UTC.

DEV3 skutečně aplikoval Control Plane 2026-08-29 a Audit Finding
až 2026-09-03. Funkční DEV3 proto nepotvrzuje správnost čistého
řazení migrací podle názvů adresářů.

Kontrolní součty obou migrací v repozitáři přesně odpovídají
úspěšně aplikovaným záznamům v DEV3.

## Nahrazené historické migrace

DEV3 eviduje dvě starší migrace, které již nejsou v repozitáři:

- `20260816_care_hub_hardening`
- `20260817_esbirka_database_layer`

Jejich přesné aplikované verze byly dohledány v historii Gitu
a jejich SHA-256 odpovídá záznamům DEV3.

Jejich obsah byl později zahrnut do migrace
`20260821_initial_production`.

e-Sbírka migrace se s baseline překrývá v pěti tabulkách
a dvou enum typech. Care Hub změny se překrývají ve sloupcích,
indexech a vazbách tabulky `CaseEvent`.

Tyto odstraněné migrace se proto nesmí jednoduše vrátit před baseline.
Čistý deploy by následně narazil na duplicitní objekty.

## DEV3

DEV3 obsahuje funkční tabulky Audit Center, Control Plane,
Synthesis a ověřených profilů subjektů.

Brand Asset Studio migrace zatím aplikována nebyla.

DEV3 navíc eviduje migrace a fyzické objekty z neintegrované větve:

- `20260906_ai_model_registry`
- `20260907_add_orion_approval`
- tabulky `AiProvider`, `AiModel` a `OrionApproval`
- enumy `AiProviderStatus` a `AiModelLifecycleStatus`

V `AiProvider` jsou 4 záznamy a v `AiModel` 5 záznamů.
Aktuální `origin/main` tyto modely, migrace ani runtime reference
neobsahuje. Jde o samostatný drift, který se nesmí přimíchat
do opravy pořadí Control Plane migrací.

## PROD3

PROD3 eviduje jako úspěšně aplikované pouze:

- `20260821_initial_production`
- `20260822_phase_b_multimedia_education`
- `20260822_subject_moderation`

Fyzicky však obsahuje také tabulky Audit Finding, Control Plane
a Synthesis, aniž by odpovídající migrace byly v ledgeru označené
jako aplikované.

Sedm těchto tabulek má mezi DEV3 a PROD3 shodnou sémantickou
signaturu sloupců, constraintů a indexů. Liší se pouze fyzické
pořadí sloupců tabulky `AuditFinding`.

PROD3 neobsahuje ověřené profily subjektů, AI registry,
Orion Approval ani Brand Asset Studio.

## Zakázané rychlé opravy

Nesmí se:

- měnit obsah již aplikovaných migračních souborů,
- přejmenovat nebo pouze prohodit existující adresáře,
- vrátit odstraněné Care Hub a e-Sbírka migrace před baseline,
- ručně měnit `_prisma_migrations` bez úplného schema diffu,
- použít `prisma db push`,
- použít stejný opravný postup bez rozlišení DEV3 a PROD3.

Tyto zásahy by porušily kontrolní součty, vytvořily duplicity
nebo zakryly skutečný rozdíl mezi ledgerem a fyzickým schématem.

## Doporučený postup opravy

1. Vytvořit úplné zálohy DEV3 a PROD3 včetně migračního ledgeru.
2. Vytvořit kanonickou baseline z aktuálního `origin/main`.
3. Ověřit baseline od prázdné PostgreSQL databáze.
4. Vytvořit samostatný reconciliation plán pro DEV3.
5. Vytvořit samostatný reconciliation plán pro PROD3.
6. Před každým `migrate resolve` ověřit úplný schema diff.
7. AI registry a Orion Approval řešit v samostatném PR.
8. Opravu nejprve zopakovat na izolovaných kopiích databází.
9. Teprve potom povolit migrace na DEV3.
10. PROD3 řešit až po úspěšném DEV3 release gate.

Kanonická baseline se na existujících databázích nesmí vykonat.
Lze ji pouze evidovat jako aplikovanou po prokázání odpovídajícího
fyzického schématu a po samostatně schválené reconciliaci.

## Dopad na Brand Asset Studio

Kód a schéma Brand Asset Studia mohou zůstat v `main`.

Migrace `20260909_brand_asset_studio_foundation` je sama o sobě
validní a byla úspěšně ověřena proti baseline schématu.

Její nasazení na DEV3 i PROD3 však zůstává zablokované,
dokud nebude opraven a reprodukovatelně ověřen celý řetězec.

## Verdikt

`BLOCKED_FOR_MIGRATION_DEPLOY`

`PASS_FOR_REPAIR_PLANNING`

Současný řetězec nesmí být použit pro nový ani produkční deploy.
Audit neprovedl žádnou změnu databází ani infrastruktury.
