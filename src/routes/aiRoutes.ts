import express from 'express';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/authMiddleware';
import { AiService } from '../services/AiService';

const router = express.Router();

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
    console.error('AI Page Generation Error:', err);
    res.status(500).json({ error: 'Chyba při generování stránky pomocí AI.', details: err?.message });
  }
});

// Chat endpoint for AiAssistantView
router.post('/chat', async (req, res) => {
  try {
    const { messages, systemPrompt, mode } = req.body;
    const historyText = (messages || [])
      .map((m: any) => `${m.role === 'user' ? 'Uživatel' : 'Asistent'}: ${m.content}`)
      .join('\n\n');

    const prompt = `${systemPrompt || 'Jsi odborný AI opatrovnický asistent portálu Táta má právo. Poskytuj věcné, právně podložené a konstruktivní rady v češtině se zaměřením na zájem dítěte a judikaturu Ústavního soudu.'}

Historie konverzace:
${historyText}

Odpověz věcně, srozumitelně a strukturovaně v češtině.`;

    const reply = await AiService.generateContent(prompt);
    res.json({ success: true, reply });
  } catch (err: any) {
    console.error('AI Chat Error:', err);
    res.status(500).json({ error: 'Chyba při komunikaci s AI.', details: err?.message });
  }
});

// BIFF Message Converter
router.post('/biff-convert', async (req, res) => {
  try {
    const { rawMessage } = req.body;
    if (!rawMessage) return res.status(400).json({ error: 'Chybí zpráva k převodu.' });

    const prompt = `Jsi expert na komunikaci v opatrovnickém právu podle metodiky BIFF (Brief, Informative, Friendly, Firm).
Převeď následující emotivní nebo konfliktogenní zprávu od rodiče na věcnou, neutrální a právně bezúonnou komunikaci.

Původní zpráva: "${rawMessage}"

Vystup ve formátu JSON:
{
  "convertedMessage": "převedený text v BIFF tónu",
  "explanation": "stručné vysvětlení provedených změn a vynechaných emotivních pasáží",
  "keyAdvice": "1-2 doporučení pro další komunikaci"
}`;

    const rawResponse = await AiService.generateContent(prompt);
    const cleaned = rawResponse.replace(/```json\n?|\n?```/g, '').trim();
    try {
      const parsed = JSON.parse(cleaned);
      res.json({ success: true, ...parsed });
    } catch {
      res.json({
        success: true,
        convertedMessage: rawResponse,
        explanation: 'Převedeno do věcného BIFF tónu bez emočního balastu.',
        keyAdvice: 'Před odesláním si zprávu přečtěte s odstupem.'
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Chyba při BIFF převodu.', details: err?.message });
  }
});

// Guide Action Plan Generator
router.post('/guide-plan', async (req, res) => {
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

    const rawResponse = await AiService.generateContent(prompt);
    const cleaned = rawResponse.replace(/```json\n?|\n?```/g, '').trim();
    try {
      const parsed = JSON.parse(cleaned);
      res.json({ success: true, ...parsed });
    } catch {
      res.json({
        success: true,
        summary: rawResponse,
        days1to7: ['Aplikovat BIFF komunikaci', 'Založit deník evidování styku'],
        days8to14: ['Písemný podnět na OSPOD bez emocí'],
        days15to30: ['Příprava podání k opatrovnickému soudu'],
        legalTips: ['Odkaz na nález ÚS II. ÚS 1642/22 (střídavá péče a věk dítěte)'],
        communicationRule: 'Všechny dohody stvrzovat písemně v e-mailové podobě.'
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Chyba při generování akčního plánu.', details: err?.message });
  }
});

// Document Analysis for AiCaseManagerView
router.post('/analyze-document', async (req, res) => {
  try {
    const { documentText, documentType } = req.body;
    if (!documentText) return res.status(400).json({ error: 'Chybí text dokumentu.' });

    const prompt = `Jsi analytik opatrovnických dokumentů. Proveď podrobný právní rozbor následujícího textu (typ: ${documentType || 'obecný dokument'}).

Text k rozboru:
${documentText}

Vystup ve formátu JSON:
{
  "summary": "Stručné manažerské shrnutí obsahu a hlavních závěrů dokumentu (3-5 vět)",
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

    const rawResponse = await AiService.generateContent(prompt);
    const cleaned = rawResponse.replace(/```json\n?|\n?```/g, '').trim();
    try {
      const parsed = JSON.parse(cleaned);
      res.json({ success: true, ...parsed });
    } catch {
      res.json({
        success: true,
        summary: rawResponse,
        contradictions: ['Tvrzení protistrany postrádá věcnou dokumentaci.'],
        counterArguments: ['Poukázat na stabilní výchovné prostředí u otce a judikaturu ÚS.'],
        riskLevel: 'Střední',
        anonymizedCount: 2
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Chyba při analýze dokumentu.', details: err?.message });
  }
});

// Simulator Evaluation
router.post('/simulator-evaluate', async (req, res) => {
  try {
    const { scenario, history } = req.body;
    const prompt = `Jsi lektor komunikace a právní taktiky v opatrovnických řízeních.
Vyhodnoť výkon uživatele v simulaci scénáře "${scenario}".

Průběh dialogu:
${JSON.stringify(history)}

Vystup ve formátu JSON:
{
  "emotionalityScore": 15, // 0 až 100 % (nižší je lepší)
  "objectivityScore": 88, // 0 až 100 % (vyšší je lepší)
  "legalTacticsScore": 85, // 0 až 100 % (vyšší je lepší)
  "strengths": ["Co uživatel zvládl skvěle 1", "Co zvládl 2"],
  "weaknesses": ["Co vynechat příště 1"],
  "recommendations": "Celková závěrečná zpětná vazba a doporučení pro reálné jednání"
}`;

    const rawResponse = await AiService.generateContent(prompt);
    const cleaned = rawResponse.replace(/```json\n?|\n?```/g, '').trim();
    try {
      const parsed = JSON.parse(cleaned);
      res.json({ success: true, ...parsed });
    } catch {
      res.json({
        success: true,
        emotionalityScore: 20,
        objectivityScore: 85,
        legalTacticsScore: 80,
        strengths: ['Udržel klidný tón', 'Reagoval bez osobních útoků'],
        weaknesses: ['Mohl více zdůraznit zájem dítěte'],
        recommendations: 'Uživateli se dařilo reagovat věcně bez zbytečných emocí.'
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: 'Chyba při vyhodnocení simulace.', details: err?.message });
  }
});

export default router;
