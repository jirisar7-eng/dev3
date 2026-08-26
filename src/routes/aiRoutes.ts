import express from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/authMiddleware';
import { AiService } from '../services/AiService';

const router = express.Router();

// Strict rate limiter for public AI endpoints (10 requests per hour per IP)
const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { error: 'Překročen limit dotazů na umělou inteligenci. Zkuste to prosím znovu za hodinu.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware to prevent oversized payloads on public AI endpoints
const aiPayloadLimiter = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const bodyString = JSON.stringify(req.body || {});
  // Max ~30,000 characters total per request to prevent token exhaustion
  if (bodyString.length > 30000) {
    return res.status(413).json({ error: 'Požadavek je příliš velký. Zkraťte prosím text a zkuste to znovu.' });
  }
  next();
};

router.post('/generate-page', requireAuth as any, requireRole('ADMIN') as any, async (req: AuthenticatedRequest, res) => {
  try {
    const { rawText, title } = req.body;
    if (!rawText) return res.status(400).json({ error: 'Chybí vstupní text.' });

    const prompt = `Jsi odborný redaktor portálu 'Táta má právo'. Z daného textu vytvoř strukturovanou stránku. Výstup MUSÍ být pouze čistý JSON kompatibilní s Puck editorem v této struktuře:
    {
      "root": { "props": { "title": "${title || 'Nový článek'}" } },
      "content": [
        { "type": "HeroBlock", "props": { "title": "...", "subtitle": "..." } },
        { "type": "TextBlock", "props": { "content": "...", "align": "left" } },
        { "type": "CallToAction", "props": { "title": "...", "buttonText": "..." } }
      ]
    }
    Text podklad: ${rawText}`;

    const responseText = await AiService.generateContent(prompt);
    
    // Extract JSON from potential markdown code blocks
    const jsonString = responseText.replace(/```json\n?|\n?```/g, '').trim();
    const parsedData = JSON.parse(jsonString);

    res.json(parsedData);
  } catch (err: any) {
    console.error('AI Page Generation Error:', err?.message || err);
    const status = err?.status || (err?.message?.includes('429') ? 429 : err?.message?.includes('503') ? 503 : 500);
    res.status(status).json({
      error: status === 429 
        ? 'Překročen limit dotazů na AI. Zkuste to prosím znovu za chvíli.'
        : status === 503
        ? 'AI služba je dočasně nedostupná. Zkuste to prosím znovu.'
        : 'Chyba při generování stránky pomocí AI.'
    });
  }
});


const SERVER_SCENARIOS: Record<string, { title: string, counterpartName: string }> = {
  'predani-ditete': { title: 'Předávání dítěte u domu matky', counterpartName: 'Matka / Příbuzný' },
  'vyslech-u-soudu': { title: 'Výslech u opatrovnického soudu', counterpartName: 'Soudce / Advokát matky' },
  'jednani-ospod': { title: 'Jednání na OSPODu', counterpartName: 'Pracovnice OSPOD' }
};
// Chat endpoint for AiAssistantView, AiSimulatorView, AiFormsView
router.post('/chat', aiRateLimiter, aiPayloadLimiter, async (req, res) => {
  try {
    const { messages, mode, scenarioId } = req.body;

    // Output length / input limits
    if (messages && messages.length > 50) return res.status(400).json({ error: 'Příliš dlouhá historie konverzace.' });
    if (JSON.stringify(messages).length > 50000) return res.status(400).json({ error: 'Překročena maximální velikost zprávy.' });

    // Server-side system instruction resolution (Security Hardening: Never trust client systemPrompt!)
    let systemInstruction = 'Jsi odborný AI opatrovnický asistent portálu Táta má právo. Poskytuj věcné, právně podložené a konstruktivní rady v češtině se zaměřením na zájem dítěte a judikaturu Ústavního soudu.';

    if (mode === 'simulator' || scenarioId) {
      const scenarioConfig = scenarioId ? SERVER_SCENARIOS[scenarioId as string] : null;
      const cName = scenarioConfig ? scenarioConfig.counterpartName : 'protistrana';
      const sTitle = scenarioConfig ? scenarioConfig.title : 'opatrovnická komunikace';
      systemInstruction = `Simuluješ hraní rolí (roleplay) pro opatrovnický trénink otců. Tvoje role je "${cName}" ve scénáři "${sTitle}". Reaguj realisticky, provokuj mírně emočně nebo věcně tak, jak se to stává v reálné opatrovnické praxi v ČR. Odpovídaj v češtině v 2-4 větách.`;
    } else if (mode === 'forms_refine' || mode === 'forms') {
      systemInstruction = 'Jsi vysoce kvalifikovaný právní asistent pro české opatrovnické právo, znalý MS ČR formulářů, Občanského zákoníku, z.ř.s. a o.s.ř. Pomáháš uživateli zpřesnit a vylepšit text právního návrhu.';
    }

    const historyText = (messages || [])
      .map((m: any) => `${m.role === 'user' ? 'Uživatel' : 'Asistent'}: ${m.content}`)
      .join('\n\n');

    const prompt = `Historie konverzace:\n${historyText}\n\nOdpověz věcně, srozumitelně a strukturovaně v češtině.`;

    const reply = await AiService.generateContent(prompt, { systemInstruction });
    res.json({ success: true, reply });
  } catch (err: any) {
    console.error('AI Chat Error:', err?.message || err);
    const status = err?.status || (err?.message?.includes('429') ? 429 : err?.message?.includes('503') ? 503 : 500);
    res.status(status).json({
      error: status === 429
        ? 'Překročen limit dotazů na AI. Zkuste to prosím znovu za chvíli.'
        : status === 503
        ? 'AI služba je dočasně nedostupná. Zkuste to prosím znovu.'
        : 'Chyba při komunikaci s AI.'
    });
  }
});

// BIFF Message Converter
router.post('/biff-convert', aiRateLimiter, aiPayloadLimiter, async (req, res) => {
  try {
    const { rawMessage } = req.body;
    if (!rawMessage) return res.status(400).json({ error: 'Chybí zpráva k převodu.' });

    const prompt = `Jsi expert na komunikaci v opatrovnickém právu podle metodiky BIFF (Brief, Informative, Friendly, Firm).
Převeď následující emotivní nebo konfliktogenní zprávu od rodiče na věcnou, neutrální a právně bezúhonnou komunikaci.

Původní zpráva: "${rawMessage}"

Vystup ve formátu JSON:
{
  "convertedMessage": "převedený text v BIFF tónu",
  "explanation": "stručné vysvětlení provedených změn a vynechaných emotivních pasáží",
  "keyAdvice": "1-2 doporučení pro další komunikaci"
}`;

    const rawResponse = await AiService.generateContent(prompt, { jsonMode: true });
    const cleaned = rawResponse.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (!parsed.convertedMessage || typeof parsed.convertedMessage !== 'string') throw new Error('Invalid JSON schema returned from AI (missing convertedMessage)');
    res.json({ success: true, ...parsed });
  } catch (err: any) {
    console.error('BIFF Convert Error:', err?.message || err);
    const status = err?.status || (err?.message?.includes('429') ? 429 : err?.message?.includes('503') ? 503 : 500);
    res.status(status).json({
      error: status === 429 
        ? 'Překročen limit dotazů na AI. Zkuste to prosím znovu za chvíli.'
        : status === 503
        ? 'AI služba je dočasně nedostupná. Zkuste to prosím znovu.'
        : 'Chyba při BIFF převodu. Zkuste to prosím znovu.'
    });
  }
});

// Guide Action Plan Generator
router.post('/guide-plan', aiRateLimiter, aiPayloadLimiter, async (req, res) => {
  try {
    const { childAge, conflictStage, ospodStance, primaryGoal } = req.body;
    const prompt = `Jsi stratég opatrovnického práva v ČR. Na základě následujících parametrů vytvoř personalizovaný akční plán na 7-30 dní:
- Věk dítěte: ${childAge}
- Fáze konfliktu: ${conflictStage}
- Postoj OSPOD: ${ospodStance}
- Hlavní cíl: ${primaryGoal}

Vystup ve formátu JSON:
{
  "summary": "Stručné zhodnocení situace a doporučená strategie",
  "days1to7": ["krok 1", "krok 2", "krok 3"],
  "days8to14": ["krok 1", "krok 2"],
  "days15to30": ["krok 1", "krok 2"],
  "legalTips": ["tip 1 s citací judikatury ÚS", "tip 2 s varováním"],
  "communicationRule": "Základní pravidlo pro komunikaci s druhou stranou a OSPOD"
}`;

    const rawResponse = await AiService.generateContent(prompt, { jsonMode: true });
    const cleaned = rawResponse.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (!parsed.summary || !Array.isArray(parsed.days1to7)) throw new Error('Invalid JSON schema returned from AI (Guide Plan)');
    res.json({ success: true, ...parsed });
  } catch (err: any) {
    console.error('Guide Plan Error:', err?.message || err);
    const status = err?.status || (err?.message?.includes('429') ? 429 : err?.message?.includes('503') ? 503 : 500);
    res.status(status).json({
      error: status === 429 
        ? 'Překročen limit dotazů na AI. Zkuste to prosím znovu za chvíli.'
        : status === 503
        ? 'AI služba je dočasně nedostupná. Zkuste to prosím znovu.'
        : 'Chyba při generování akčního plánu. Zkuste to prosím znovu.'
    });
  }
});

// Document Analysis for AiCaseManagerView
router.post('/analyze-document', aiRateLimiter, aiPayloadLimiter, async (req, res) => {
  try {
    const { documentText, documentType } = req.body;
    if (!documentText) return res.status(400).json({ error: 'Chybí text dokumentu.' });

    const prompt = `Jsi analytik opatrovnických dokumentů. Proveď podrobný právní rozbor následujícího textu (typ: ${documentType || 'obecný dokument'}).

Text k rozboru:
${documentText}

Vystup ve formátu JSON:
{
  "summary": "Stručné manažerské shrnutí obsahu a hlavních závěrů dokumentu (3-5 vě́t)",
  "contradictions": [
    "Identifikovaný rozpor nebo tvrzení bez důkazní opory 1",
    "Identifikovaný rozpor 2"
  ],
  "counterArguments": [
    "Doporučený protiargument do vyjádření s odkazem na zákon nebo judikaturu 1",
    "Doporučený protiargument 2"
  ],
  "riskLevel": "Nízké / Střední / Vysoké",
  "anonymizedCount": 3
}`;

    const rawResponse = await AiService.generateContent(prompt, { jsonMode: true });
    const cleaned = rawResponse.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (!parsed.summary || !Array.isArray(parsed.contradictions)) throw new Error('Invalid JSON schema returned from AI (Analyze Document)');
    res.json({ success: true, ...parsed });
  } catch (err: any) {
    console.error('Analyze Document Error:', err?.message || err);
    const status = err?.status || (err?.message?.includes('429') ? 429 : err?.message?.includes('503') ? 503 : 500);
    res.status(status).json({
      error: status === 429 
        ? 'Překročen limit dotazů na AI. Zkuste to prosím znovu za chvíli.'
        : status === 503
        ? 'AI služba je dočasně nedostupná. Zkuste to prosím znovu.'
        : 'Chyba při analýze dokumentu. Zkuste to prosím znovu.'
    });
  }
});

// Simulator Evaluation
router.post('/simulator-evaluate', aiRateLimiter, aiPayloadLimiter, async (req, res) => {
  try {
    const { scenario, history } = req.body;
    const prompt = `Jsi lektor komunikace a právní taktiky v opatrovnických řízeních.
Vyhodnoť výkon uživatele v simulaci scénáře "${scenario}".

Průběh dialogu:
${JSON.stringify(history)}

Vystup ve formátu JSON:
{
  "emotionalityScore": 15,
  "objectivityScore": 88,
  "legalTacticsScore": 85,
  "strengths": ["Co uživatel zvládl skvěle 1", "Co zvládl 2"],
  "weaknesses": ["Co vynechat příště 1"],
  "recommendations": "Celková závěrečná zpětná vazba a doporučení pro reálné jednání"
}`;

    const rawResponse = await AiService.generateContent(prompt, { jsonMode: true });
    const cleaned = rawResponse.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (typeof parsed.emotionalityScore !== 'number' || !Array.isArray(parsed.strengths)) throw new Error('Invalid JSON schema returned from AI (Simulator Evaluate)');
    res.json({ success: true, ...parsed });
  } catch (err: any) {
    console.error('Simulator Evaluate Error:', err?.message || err);
    const status = err?.status || (err?.message?.includes('429') ? 429 : err?.message?.includes('503') ? 503 : 500);
    res.status(status).json({
      error: status === 429 
        ? 'Překročen limit dotazů na AI. Zkuste to prosím znovu za chvíli.'
        : status === 503
        ? 'AI služba je dočasně nedostupná. Zkuste to prosím znovu.'
        : 'Chyba při vyhodnocení simulace. Zkuste to prosím znovu.'
    });
  }
});

export default router;
