CHANGELOG
Datum: 2026-09-06
Typ: FIX
Změna: Implementován HTTP regresní test pro Synthesis API přes supertest
Důvod: Test prokazující autorizaci mutací přes ControlPlaneAuthorization.
Výsledek: PREVIEW_ACTOR je 403 zablokován, ADMIN povolen, services nejsou volány.
Ověření: TEST (node:test, supertest) / BUILD
