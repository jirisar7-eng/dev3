import { AiService } from './AiService';
import { ClamAvService } from './clamAvService';
import mammoth from 'mammoth';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

export interface FieldMeta {
  value: any;
  confidence: number;
  status: 'VERIFIED' | 'NEEDS_REVIEW' | 'NOT_FOUND';
  sourceText?: string;
}

export interface JudgmentExtractedData {
  sourceDocumentId: string;
  extractionMethod: 'AI_TEXT' | 'AI_VISION' | 'MAMMOTH_DOCX' | 'PDF_PARSE';
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
    notFoundCount: number;
    fields: Record<string, FieldMeta>;
  };
}

export class JudgmentParserService {
  public static async parseJudgmentFile(file?: Express.Multer.File, text?: string): Promise<JudgmentExtractedData> {
    let documentContent = text || '';
    let extractionMethod: 'AI_TEXT' | 'AI_VISION' | 'MAMMOTH_DOCX' | 'PDF_PARSE' = 'AI_TEXT';
    const sourceDocumentId = file ? `${file.originalname}_${Date.now()}` : `text_input_${Date.now()}`;

    if (file) {
      // 1. Upload Security Checks: Size limit (25MB), MIME type check, ClamAV scan
      if (file.buffer.length > 25 * 1024 * 1024) {
        throw new Error('Soubor přesahuje maximální povolenou velikost 25 MB.');
      }

      const allowedMimes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain',
        'image/png',
        'image/jpeg'
      ];

      if (file.mimetype && !allowedMimes.includes(file.mimetype)) {
        throw new Error(`Nepodporovaný formát souboru: ${file.mimetype}. Použijte PDF, DOCX, TXT nebo obrázek.`);
      }

      // ClamAV security scan
      try {
        await ClamAvService.scanBuffer(file.buffer);
      } catch (scanErr: any) {
        throw new Error(`Antivirová kontrola (ClamAV) zamítla soubor: ${scanErr.message}`);
      }

      // 2. Format specific parsing
      if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
        try {
          const pdfData = await pdfParse(file.buffer);
          documentContent = pdfData.text;
          extractionMethod = 'PDF_PARSE';
        } catch (err) {
          console.warn('[JudgmentParserService] PDF parse text failed, falling back to Vision:', err);
        }
      } else if (
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.originalname.endsWith('.docx')
      ) {
        try {
          const result = await mammoth.extractRawText({ buffer: file.buffer });
          documentContent = result.value;
          extractionMethod = 'MAMMOTH_DOCX';
        } catch (err) {
          console.error('[JudgmentParserService] DOCX parse error:', err);
          throw new Error('Nepodařilo se přečíst obsah dokumentu Word (DOCX).');
        }
      } else if (file.mimetype.startsWith('image/') || file.originalname.match(/\.(png|jpg|jpeg)$/i)) {
        // Image / Scanned file -> Vision API
        return await this.parseWithVision(file, sourceDocumentId);
      } else {
        documentContent = file.buffer.toString('utf-8');
        extractionMethod = 'AI_TEXT';
      }
    }

    if (!documentContent || documentContent.trim().length < 30) {
       if (file) {
         return await this.parseWithVision(file, sourceDocumentId);
       } else {
         throw new Error("Z dokumentu nelze přečíst text. Zkontrolujte, zda je čitelný.");
       }
    }

    return await this.parseWithText(documentContent, sourceDocumentId, extractionMethod);
  }

  private static getPrompt(): string {
    return `
Extrahuj ze zadaného soudního rozsudku nebo dohody o péči kompletní strukturovaná fakta pro opatrovnický spis a plán péče. 
DŮLEŽITÉ: Nikdy si nevymýšlej chybějící údaje! Pokud údaj v textu prokazatelně není, vrať u něj value: null, confidence: 0.0, status: "NOT_FOUND".
Pro každý extrahovaný údaj uveď:
- value: zjištěná hodnota (nebo null)
- confidence: číslo od 0.0 do 1.0 vyjadřující skutečnou jistotu extrakce
- status: "VERIFIED" (pokud confidence >= 0.8), "NEEDS_REVIEW" (pokud 0 < confidence < 0.8), nebo "NOT_FOUND" (pokud hodnota chybí)
- sourceText: přesný výňatek (citace) z textu dokumentu, ze kterého byl údaj odvozen

Požadované JSON schéma (vracej POUZE tento JSON, žádný jiný text):
{
  "caseNumber": { "value": "string | null", "confidence": number, "status": "VERIFIED|NEEDS_REVIEW|NOT_FOUND", "sourceText": "string | null" },
  "court": { "value": "string | null", "confidence": number, "status": "VERIFIED|NEEDS_REVIEW|NOT_FOUND", "sourceText": "string | null" },
  "judgmentDate": { "value": "YYYY-MM-DD | null", "confidence": number, "status": "VERIFIED|NEEDS_REVIEW|NOT_FOUND", "sourceText": "string | null" },
  "effectiveDate": { "value": "YYYY-MM-DD | null", "confidence": number, "status": "VERIFIED|NEEDS_REVIEW|NOT_FOUND", "sourceText": "string | null" },
  "participants": { "value": ["string"], "confidence": number, "status": "VERIFIED|NEEDS_REVIEW|NOT_FOUND", "sourceText": "string | null" },
  "childName": { "value": "string | null", "confidence": number, "status": "VERIFIED|NEEDS_REVIEW|NOT_FOUND", "sourceText": "string | null" },
  "childBirthDate": { "value": "YYYY-MM-DD | null", "confidence": number, "status": "VERIFIED|NEEDS_REVIEW|NOT_FOUND", "sourceText": "string | null" },
  "custodyType": { "value": "SHARED | SOLE_FATHER | SOLE_MOTHER | CUSTOM | null", "confidence": number, "status": "VERIFIED|NEEDS_REVIEW|NOT_FOUND", "sourceText": "string | null" },
  "scheduleType": { "value": "EVEN_ODD_WEEKS | WEEK_A_B | EVERY_OTHER_WEEKEND | STANDARD | CUSTOM | null", "confidence": number, "status": "VERIFIED|NEEDS_REVIEW|NOT_FOUND", "sourceText": "string | null" },
  "evenWeek": { "value": { "days": ["string"], "summary": "string" } | null, "confidence": number, "status": "VERIFIED|NEEDS_REVIEW|NOT_FOUND", "sourceText": "string | null" },
  "oddWeek": { "value": { "days": ["string"], "summary": "string" } | null, "confidence": number, "status": "VERIFIED|NEEDS_REVIEW|NOT_FOUND", "sourceText": "string | null" },
  "handoverDay": { "value": "string | null", "confidence": number, "status": "VERIFIED|NEEDS_REVIEW|NOT_FOUND", "sourceText": "string | null" },
  "handoverTime": { "value": "string | null", "confidence": number, "status": "VERIFIED|NEEDS_REVIEW|NOT_FOUND", "sourceText": "string | null" },
  "handoverLocation": { "value": "string | null", "confidence": number, "status": "VERIFIED|NEEDS_REVIEW|NOT_FOUND", "sourceText": "string | null" },
  "holidaysRule": { "value": "string | null", "confidence": number, "status": "VERIFIED|NEEDS_REVIEW|NOT_FOUND", "sourceText": "string | null" },
  "christmasRule": { "value": "string | null", "confidence": number, "status": "VERIFIED|NEEDS_REVIEW|NOT_FOUND", "sourceText": "string | null" },
  "easterRule": { "value": "string | null", "confidence": number, "status": "VERIFIED|NEEDS_REVIEW|NOT_FOUND", "sourceText": "string | null" },
  "summerRule": { "value": "string | null", "confidence": number, "status": "VERIFIED|NEEDS_REVIEW|NOT_FOUND", "sourceText": "string | null" },
  "alimonyAmount": { "value": number | null, "confidence": number, "status": "VERIFIED|NEEDS_REVIEW|NOT_FOUND", "sourceText": "string | null" },
  "alimonyDueDate": { "value": number | null, "confidence": number, "status": "VERIFIED|NEEDS_REVIEW|NOT_FOUND", "sourceText": "string | null" },
  "alimonyPaymentMethod": { "value": "string | null", "confidence": number, "status": "VERIFIED|NEEDS_REVIEW|NOT_FOUND", "sourceText": "string | null" },
  "otherDuties": { "value": "string | null", "confidence": number, "status": "VERIFIED|NEEDS_REVIEW|NOT_FOUND", "sourceText": "string | null" }
}
`;
  }

  private static parseResponse(responseText: string, sourceDocumentId: string, extractionMethod: 'AI_TEXT' | 'AI_VISION' | 'MAMMOTH_DOCX' | 'PDF_PARSE'): JudgmentExtractedData {
    const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const fields: Record<string, FieldMeta> = {};
    let totalFound = 0;
    let needsReviewCount = 0;
    let notFoundCount = 0;

    const keys = [
      'caseNumber', 'court', 'judgmentDate', 'effectiveDate', 'participants',
      'childName', 'childBirthDate', 'custodyType', 'scheduleType',
      'evenWeek', 'oddWeek', 'handoverDay', 'handoverTime', 'handoverLocation',
      'holidaysRule', 'christmasRule', 'easterRule', 'summerRule',
      'alimonyAmount', 'alimonyDueDate', 'alimonyPaymentMethod', 'otherDuties'
    ];

    keys.forEach((k) => {
      const item = parsed[k] || { value: null, confidence: 0.0, status: 'NOT_FOUND', sourceText: null };
      const val = item.value;
      const confidence = typeof item.confidence === 'number' ? item.confidence : 0.0;
      let status: 'VERIFIED' | 'NEEDS_REVIEW' | 'NOT_FOUND' = item.status || 'NOT_FOUND';

      const hasValue = val !== null && val !== undefined && (Array.isArray(val) ? val.length > 0 : true);

      if (!hasValue) {
        status = 'NOT_FOUND';
        notFoundCount++;
      } else if (confidence >= 0.8) {
        status = 'VERIFIED';
        totalFound++;
      } else {
        status = 'NEEDS_REVIEW';
        needsReviewCount++;
        totalFound++;
      }

      fields[k] = {
        value: val,
        confidence,
        status,
        sourceText: item.sourceText || null
      };
    });

    return {
      sourceDocumentId,
      extractionMethod,
      caseNumber: fields.caseNumber.value,
      court: fields.court.value,
      judgmentDate: fields.judgmentDate.value,
      effectiveDate: fields.effectiveDate.value,
      participants: Array.isArray(fields.participants.value) ? fields.participants.value : [],
      childName: fields.childName.value,
      childBirthDate: fields.childBirthDate.value,
      custodyType: fields.custodyType.value,
      scheduleType: fields.scheduleType.value,
      evenWeek: fields.evenWeek.value,
      oddWeek: fields.oddWeek.value,
      handoverDay: fields.handoverDay.value,
      handoverTime: fields.handoverTime.value,
      handoverLocation: fields.handoverLocation.value,
      holidaysRule: fields.holidaysRule.value,
      christmasRule: fields.christmasRule.value,
      easterRule: fields.easterRule.value,
      summerRule: fields.summerRule.value,
      evenOddYearsRule: null,
      alimonyAmount: fields.alimonyAmount.value,
      alimonyDueDate: fields.alimonyDueDate.value,
      alimonyPaymentMethod: fields.alimonyPaymentMethod.value,
      otherDuties: fields.otherDuties.value,
      metadata: {
        totalFound,
        needsReviewCount,
        notFoundCount,
        fields
      }
    };
  }

  private static async parseWithText(documentContent: string, sourceDocumentId: string, extractionMethod: 'AI_TEXT' | 'MAMMOTH_DOCX' | 'PDF_PARSE'): Promise<JudgmentExtractedData> {
    const prompt = this.getPrompt() + "\n\nZde je text dokumentu k analýze:\n" + documentContent;
    try {
      const responseText = await AiService.generateContent(prompt);
      return this.parseResponse(responseText, sourceDocumentId, extractionMethod);
    } catch (err: any) {
      console.error('[JudgmentParserService] Text parse failed:', err?.message);
      throw new Error("Z dokumentu nelze přečíst text nebo AI selhala.");
    }
  }

  private static async parseWithVision(file: Express.Multer.File, sourceDocumentId: string): Promise<JudgmentExtractedData> {
    const { GoogleGenAI } = await import('@google/genai');
    const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_2;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is required for image/PDF vision processing.");
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = this.getPrompt();

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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
      return this.parseResponse(response.text, sourceDocumentId, 'AI_VISION');
    } catch (err: any) {
      console.error('[JudgmentParserService] Vision parse failed:', err?.message);
      throw new Error("Z dokumentu nelze přečíst text. Zkontrolujte, zda je dokument čitelný.");
    }
  }
}

