# AUDIT REPORT: UX Affordance & Interactive Clickability Hardening

**Datum a čas:** 2026-08-29 12:12:00 UTC  
**Název úkolu:** UX Affordance & Interactive Clickability Audit and Fixes  
**Pracovní větev:** `feat/faze-6a-unified-ai-audit-operations`  
**Autor:** DevSecOps / Lead Frontend Engineer / QA Auditor  

---

## 1. Cíl a rozsah

Provést systémovou inspekci a opravu falešné klikatelnosti / klamavých vizuálních efektů (false affordance) v UI komponentách aplikace bez narušení Puck editoru, vizuálního designu či existujících testů.

---

## 2. Provedené úpravy a zjištění

Provedli jsme hloubkový sken všech React/TypeScript komponent v `src/components/` se zaměřením na:
1. `cursor-pointer` na neinteraktivních prvku bez `onClick` či `href`.
2. `hover:scale`, `hover:border`, `hover:shadow` efekty na kartách či kontejnerech bez přidružené akce pro celý prvek.
3. Zachování plné kompatibility s Puck editorem.

### Opravené komponenty:

1. **`src/components/public/GdprComplianceCenterPage.tsx`**:
   - *Problém:* V sekci 8 (Cookies a analytika) se nacházel `<span className="text-blue-700 font-bold underline cursor-pointer">Cookie Policy</span>` bez jakéholi `onClick` či odkazu.
   - *Oprava:* Změněno na reálný odkaz `<a href="/p/cookies" className="text-blue-700 font-bold underline hover:text-blue-900 transition-colors">Cookie Policy</a>`.

2. **`src/components/admin/AdminDashboard.tsx`**:
   - *Problém:* Karta Synthesis Admin Copilot měla efekt `hover:border-purple-300` a `group-hover:scale-105` na ikonce, ale klikatelná byla pouze spodní tlačítková lišta.
   - *Oprava:* Přidána obsluha `onClick={() => handleSelectTab('copilot', '/administrace/qa/copilot')}` a třída `cursor-pointer` na celou kartu, což garantuje intuitivní reakci na kliknutí kdekoliv na kartě.

3. **`src/components/admin/TemplateManager.tsx`**:
   - *Problém:* Karta Puck šablony měla `group-hover:scale-105` na náhledu a `group-hover:text-indigo-300` na nápadném nadpisu, avšak kliknutí na náhled nebo nadpis nic nedělo.
   - *Oprava:* Přidán handler `onClick={() => setPreviewTemplate(tpl)}` a `cursor-pointer` na náhledový obrázek i na nadpis karty pro okamžité otevření náhledu.

4. **`src/components/admin/VideoManager.tsx`**:
   - *Problém:* Náhledový obrázek videa měl `group-hover:scale-105` s ikonkou přehrávání (`Play`), ale sám o sobě neměl `onClick`.
   - *Oprava:* Přidáno `onClick={() => handleOpenModal(video)}` a `cursor-pointer` na kontejner náhledu pro otevření editačního/přehrávacího modálu.

5. **`src/components/public/CmsPageRenderer.tsx`**:
   - *Dohled nad regresními testy:* Přidána kontrola `raw.root` do rozparsovaných Puck dat pro zachování shody s regresním testem v `src/tests/hybridPuckBatch3.test.ts`.

---

## 3. Ověření a testování

1. **Kompilace (`compile_applet`):**
   - **Výsledek:** `Build succeeded - the applet is compiled` bez chyby.

2. **Bezpečnostní kontroly:**
   - Žádné secrets ani citlivé údaje nebyly vloženy.
   - Žádné destruktivní změny do databáze či produkčních souborů.

---

## 4. Git status & Commit/Push

- **Větev:** `feat/faze-6a-unified-ai-audit-operations`
- **Předpokládaný krok:** Commit a push na feature větev.
