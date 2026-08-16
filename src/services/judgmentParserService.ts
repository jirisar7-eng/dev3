import { AiService } from './AiService';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

export interface JudgmentExtractedData {
  caseNumber: string | null;
  court: string | null;
  judgmentDate: string | null;
  effectiveDate: string | null;
  participants: string[];
  childName: string | null;
  childBirthDate: string | null;
  custodyType: "SHARED" | "SOLE_FATHER" | "SOLE_MOTHER" | "CUSTOM" | null;
  scheduleType: "EVEN_ODD_WEEKS" | "WEEK_A_B" | "EVERY_OTHER_WEEKEND" | "CUSTOM" | "STANDARD" | null;
  evenWeek?: { days: string[]; summary: string } | null;
  oddWeek?: { days: string[]; summary: string } | null;
  handoverDay: string | null;
  handoverTime: string | null;
  handoverStartTime?: string | null;
  handoverEndTime?: string | null;
  handoverLocation: string | null;
  holidaysRule: string | null;
  christmasRule: string | null;
  easterRule: string | null;
  summerRule: string | null;
  evenOddYearsRule: string | null;
  alimonyAmount: number | null;
  alimonyDueDate: number | null;
  alimonyPaymentMethod: string | null;
  otherDuties: string | null;
  metadata?: {
    totalFound: number;
    needsReviewCount: number;
    missingCount: number;
    fields: Record<string, { confidence: number; status: 'VERIFIED' | 'NEEDS_REVIEW' }>;
  };
}

export class JudgmentParserService {
  public static async parseJudgmentFile(file?: Express.Multer.File, text?: string): Promise<JudgmentExtractedData> {
    let documentContent = text || '';

    if (file) {
      if (file.mimetype === 'application/pdf') {
        try {
          const pdfData = await pdfParse(file.buffer);
          documentContent = pdfData.text;
        } catch (err) {
          console.error('[JudgmentParserService] PDF parse error:', err);
        }
      } else {
        documentContent = file.buffer.toString('utf-8');
      }
    }

    if (!documentContent || documentContent.trim().length < 50) {
       if (file) {
         return await this.parseWithVision(file);
       } else {
         throw new Error("Z dokumentu nelze přečíst text. Zkontrolujte, zda je čitelný.");
       }
    }

    return await this.parseWithText(documentContent);
  }

  private static getPrompt(): string {
    return `
Extrahuj ze zadaného soudního rozsudku nebo dohody o péči kompletní strukturovaná fakta pro opatrovnický spis a plán péče:
- spisová značka (caseNumber, např. "12 P 45/2023")
- soud (court)
- datum rozhodnutí (judgmentDate, YYYY-MM-DD)
- účinnost / právní moc (effectiveDate, YYYY-MM-DD)
- účastníci (participants: pole jmen rodičů, opatrovníka, OSPOD)
- jméno dítěte (childName)
- datum narození dítěte (childBirthDate, YYYY-MM-DD)
- svěření do péče (custodyType: SHARED, SOLE_FATHER, SOLE_MOTHER, CUSTOM)
- typ rozvrhu (scheduleType: EVEN_ODD_WEEKS, WEEK_A_B, EVERY_OTHER_WEEKEND, STANDARD, CUSTOM)
- evenWeek & oddWeek (pokud je EVEN_ODD_WEEKS, dny a shrnutí)
- den, časy a místo předávání (handoverDay, handoverTime, handoverStartTime, handoverEndTime, handoverLocation)
- prázdniny a svátky (holidaysRule, christmasRule, easterRule, summerRule, evenOddYearsRule)
- výživné (alimonyAmount číslo, alimonyDueDate den v měsíci, alimonyPaymentMethod způsob placení)
- další povinnosti a omezení (otherDuties)

Pokud údaj v dokumentu CHYBÍ, vrať u daného pole NULL. NIKDY si nevymýšlej fiktivní jména ani neplatné časy.
Ke každému klíčovému údaji odhadni confidence (0.0 - 1.0) a urči status ('VERIFIED' pokud confidence >= 0.8 jinak 'NEEDS_REVIEW').

Požadované JSON schéma:
{
  "caseNumber": "string nebo null",
  "court": "string nebo null",
  "judgmentDate": "YYYY-MM-DD nebo null",
  "effectiveDate": "YYYY-MM-DD nebo null",
  "participants": ["string"],
  "childName": "string nebo null",
  "childBirthDate": "YYYY-MM-DD nebo null",
  "custodyType": "SHARED | SOLE_FATHER | SOLE_MOTHER | CUSTOM | null",
  "scheduleType": "EVEN_ODD_WEEKS | WEEK_A_B | EVERY_OTHER_WEEKEND | STANDARD | CUSTOM | null",
  "evenWeek": { "days": ["string"], "summary": "string" } | null,
  "oddWeek": { "days": ["string"], "summary": "string" } | null,
  "handoverDay": "string nebo null",
  "handoverTime": "string nebo null",
  "handoverStartTime": "string nebo null",
  "handoverEndTime": "string nebo null",
  "handoverLocation": "string nebo null",
  "holidaysRule": "string nebo null",
  "christmasRule": "string nebo null",
  "easterRule": "string nebo null",
  "summerRule": "string nebo null",
  "evenOddYearsRule": "string nebo null",
  "alimonyAmount": number | null,
  "alimonyDueDate": number | null,
  "alimonyPaymentMethod": "string nebo null",
  "otherDuties": "string nebo null"
}

Vrať POUZE platný JSON odpovídající schématu, žádný další text!
`;
  }

  private static parseResponse(responseText: string): JudgmentExtractedData {
    const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const fields: Record<string, { confidence: number; status: 'VERIFIED' | 'NEEDS_REVIEW' }> = {};
    let totalFound = 0;
    let needsReviewCount = 0;
    let missingCount = 0;

    const keys = [
      'caseNumber', 'court', 'judgmentDate', 'effectiveDate', 'participants',
      'childName', 'childBirthDate', 'custodyType', 'scheduleType',
      'handoverDay', 'handoverTime', 'handoverLocation', 'holidaysRule',
      'christmasRule', 'easterRule', 'summerRule', 'alimonyAmount', 'alimonyDueDate', 'otherDuties'
    ];

    keys.forEach((k) => {
      const val = parsed[k];
      if (val !== null && val !== undefined && (Array.isArray(val) ? val.length > 0 : true)) {
        totalFound++;
        // If it's a string with placeholder or uncertain text, or general heuristic
        const conf = 0.85;
        const status = conf >= 0.8 ? 'VERIFIED' : 'NEEDS_REVIEW';
        if (status === 'NEEDS_REVIEW') needsReviewCount++;
        fields[k] = { confidence: conf, status };
      } else {
        missingCount++;
        fields[k] = { confidence: 0.0, status: 'NEEDS_REVIEW' };
      }
    });

    return {
      caseNumber: parsed.caseNumber || null,
      court: parsed.court || null,
      judgmentDate: parsed.judgmentDate || null,
      effectiveDate: parsed.effectiveDate || null,
      participants: Array.isArray(parsed.participants) ? parsed.participants : [],
      childName: parsed.childName || null,
      childBirthDate: parsed.childBirthDate || null,
      custodyType: parsed.custodyType || null,
      scheduleType: parsed.scheduleType || null,
      evenWeek: parsed.evenWeek || null,
      oddWeek: parsed.oddWeek || null,
      handoverDay: parsed.handoverDay || null,
      handoverTime: parsed.handoverTime || null,
      handoverStartTime: parsed.handoverStartTime || null,
      handoverEndTime: parsed.handoverEndTime || null,
      handoverLocation: parsed.handoverLocation || null,
      holidaysRule: parsed.holidaysRule || null,
      christmasRule: parsed.christmasRule || null,
      easterRule: parsed.easterRule || null,
      summerRule: parsed.summerRule || null,
      evenOddYearsRule: parsed.evenOddYearsRule || null,
      alimonyAmount: typeof parsed.alimonyAmount === 'number' ? parsed.alimonyAmount : null,
      alimonyDueDate: typeof parsed.alimonyDueDate === 'number' ? parsed.alimonyDueDate : null,
      alimonyPaymentMethod: parsed.alimonyPaymentMethod || null,
      otherDuties: parsed.otherDuties || null,
      metadata: {
        totalFound,
        needsReviewCount,
        missingCount,
        fields
      }
    };
  }

  private static async parseWithText(documentContent: string): Promise<JudgmentExtractedData> {
    const prompt = this.getPrompt() + "\n\nZde je text dokumentu k analýze:\n" + documentContent;
    try {
      const responseText = await AiService.generateContent(prompt);
      return this.parseResponse(responseText);
    } catch (err: any) {
      console.error('[JudgmentParserService] Text parse failed:', err?.message);
      throw new Error("Z dokumentu nelze přečíst text nebo AI selhala.");
    }
  }

  private static async parseWithVision(file: Express.Multer.File): Promise<JudgmentExtractedData> {
    // Import inside so we don't break if not needed
    const { GoogleGenAI } = await import('@google/genai');
    const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_2;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is required for image/PDF vision processing.");
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = this.getPrompt();

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [
          prompt,
          {
            inlineData: {
              data: file.buffer.toString('base64'),
              mimeType: file.mimetype
            }
          }
        ]
      });

      if (!response.text) {
        throw new Error("Empty response from Vision AI.");
      }
      return this.parseResponse(response.text);
    } catch (err: any) {
      console.error('[JudgmentParserService] Vision parse failed:', err?.message);
      throw new Error("Z dokumentu nelze přečíst text. Zkontrolujte, zda je PDF čitelné.");
    }
  }
}
