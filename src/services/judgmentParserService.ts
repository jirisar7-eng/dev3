import { AiService } from './AiService';
import { ClamAvService } from './clamAvService';
import mammoth from 'mammoth';

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
  /**
   * Multi-strategy PDF text extractor:
   * 1. Uses PDFParse class from pdf-parse v2
   * 2. Falls back to pdfjs-dist legacy engine if PDFParse yields empty text or fails
   */
  private static async extractTextFromPdf(buffer: Buffer): Promise<{ text: string; pageCount: number; method: 'PDF_PARSE' | 'PDFJS_DIST' | 'NONE' }> {
    // Strategy A: pdf-parse v2 (PDFParse class)
    try {
      const { PDFParse } = await import('pdf-parse');
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      const text = (result?.text || '').trim();
      const pageCount = result?.total || 1;
      await parser.destroy().catch(() => {});

      if (text.length >= 30) {
        return { text, pageCount, method: 'PDF_PARSE' };
      }
    } catch (err: any) {
      console.warn('[JudgmentParserService] Primary PDFParse extractor failed or empty, trying fallback:', err?.message || err);
    }

    // Strategy B: pdfjs-dist engine fallback
    try {
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
      const uint8 = new Uint8Array(buffer);
      const loadingTask = pdfjs.getDocument({ data: uint8, disableFontFace: true });
      const doc = await loadingTask.promise;
      const pageCount = doc.numPages || 1;
      let combinedText = '';

      for (let i = 1; i <= pageCount; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item: any) => ('str' in item ? item.str : ''))
          .join(' ');
        combinedText += pageText + '\n';
      }

      if (typeof (doc as any).cleanup === 'function') {
        await (doc as any).cleanup().catch(() => {});
      }
      if (typeof (doc as any).destroy === 'function') {
        await (doc as any).destroy().catch(() => {});
      }
      const trimmed = combinedText.trim();
      if (trimmed.length >= 30) {
        return { text: trimmed, pageCount, method: 'PDFJS_DIST' };
      }
    } catch (err: any) {
      console.warn('[JudgmentParserService] Secondary pdfjs-dist extractor failed:', err?.message || err);
    }

    return { text: '', pageCount: 0, method: 'NONE' };
  }

  public static async parseJudgmentFile(file?: Express.Multer.File, text?: string): Promise<JudgmentExtractedData> {
    let documentContent = text || '';
    let extractionMethod: 'AI_TEXT' | 'AI_VISION' | 'MAMMOTH_DOCX' | 'PDF_PARSE' = 'AI_TEXT';
    const sourceDocumentId = file ? `${file.originalname}_${Date.now()}` : `text_input_${Date.now()}`;

    if (file) {
      const fileSize = file.buffer?.length || 0;
      const ext = file.originalname?.split('.').pop()?.toLowerCase() || '';

      console.log(`[JudgmentParserService] Received file upload: ${file.originalname} (${fileSize} bytes, MIME: ${file.mimetype || 'unknown'}, ext: .${ext})`);

      if (fileSize === 0) {
        throw new Error('Nahraný soubor je prázdný (0 B).');
      }

      // 1. Upload Security Checks: Size limit (25MB), MIME & format validation
      if (fileSize > 25 * 1024 * 1024) {
        throw new Error('Soubor přesahuje maximální povolenou velikost 25 MB.');
      }

      const allowedMimes = [
        'application/pdf',
        'application/x-pdf',
        'application/octet-stream',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain',
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/webp'
      ];

      const isMagicPdf = fileSize >= 4 && file.buffer.toString('utf-8', 0, 4) === '%PDF';
      const isPdf = file.mimetype === 'application/pdf' || file.mimetype === 'application/x-pdf' || ext === 'pdf' || isMagicPdf;
      const isDocx = file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || ext === 'docx' || ext === 'doc';
      const isImage = file.mimetype?.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp'].includes(ext);
      const isTxt = file.mimetype === 'text/plain' || ext === 'txt';

      if (file.mimetype && !allowedMimes.includes(file.mimetype) && !isPdf && !isDocx && !isImage && !isTxt) {
        throw new Error(`Nepodporovaný formát souboru: ${file.mimetype}. Použijte PDF, DOCX, TXT nebo obrázek.`);
      }

      // ClamAV security scan (mandatory antivirus gatekeeper)
      try {
        console.log(`[JudgmentParserService] Running ClamAV scan on ${fileSize} bytes buffer...`);
        const scanResult = await ClamAvService.scanBuffer(file.buffer);
        console.log(`[JudgmentParserService] ClamAV scan passed successfully (Status: ${scanResult.status}).`);
      } catch (scanErr: any) {
        console.error('[JudgmentParserService] ClamAV scan rejected file:', scanErr.message);
        throw new Error(`Antivirová kontrola (ClamAV) zamítla soubor: ${scanErr.message}`);
      }

      // 2. Format specific text extraction
      if (isPdf) {
        console.log(`[JudgmentParserService] Extracting text from PDF (${fileSize} bytes)...`);
        const { text: pdfText, pageCount, method } = await this.extractTextFromPdf(file.buffer);

        if (pdfText && pdfText.length >= 30) {
          console.log(`[JudgmentParserService] PDF text extracted successfully via ${method}: ${pdfText.length} chars across ${pageCount} pages.`);
          documentContent = pdfText;
          extractionMethod = 'PDF_PARSE';
        } else {
          console.log(`[JudgmentParserService] PDF contains no selectable text layer (${pdfText.length} chars). Delegating to OCR Vision analysis.`);
        }
      } else if (isDocx) {
        try {
          const result = await mammoth.extractRawText({ buffer: file.buffer });
          documentContent = result.value || '';
          extractionMethod = 'MAMMOTH_DOCX';
          console.log(`[JudgmentParserService] DOCX text extracted successfully: ${documentContent.length} chars.`);
        } catch (err: any) {
          console.error('[JudgmentParserService] DOCX parse error:', err?.message);
          throw new Error(`Nepodařilo se přečíst obsah dokumentu Word (DOCX): ${err?.message || 'Chyba formátu'}`);
        }
      } else if (isImage) {
        console.log(`[JudgmentParserService] Image file detected (.${ext}). Delegating to Vision AI parser.`);
        return await this.parseWithVision(file, sourceDocumentId);
      } else if (isTxt) {
        documentContent = file.buffer.toString('utf-8');
        extractionMethod = 'AI_TEXT';
        console.log(`[JudgmentParserService] TXT file loaded: ${documentContent.length} chars.`);
      }
    }

    // Fallback: If no text was extracted from file, attempt OCR Vision (e.g. for scanned PDFs)
    if (!documentContent || documentContent.trim().length < 30) {
      if (file) {
        console.log(`[JudgmentParserService] Text layer insufficient (${documentContent.trim().length} chars). Invoking OCR Vision analysis for scanned document.`);
        return await this.parseWithVision(file, sourceDocumentId);
      } else {
        throw new Error("Vložený text rozsudku je příliš krátký (méně než 30 znaků). Zadejte prosím celý výrok rozsudku nebo nahrajte čitelný soubor.");
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
    let cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr: any) {
      console.error('[JudgmentParserService] JSON parse error on AI response:', parseErr.message);
      throw new Error(`AI model nevrátil platný JSON formát: ${parseErr.message}`);
    }

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
      console.log(`[JudgmentParserService] Generating AI facts analysis from ${documentContent.length} chars text...`);
      const responseText = await AiService.generateContent(prompt);
      return this.parseResponse(responseText, sourceDocumentId, extractionMethod);
    } catch (err: any) {
      console.error('[JudgmentParserService] Text AI analysis failed:', err?.message);
      throw new Error(`AI analýza textu rozsudku selhala: ${err?.message || 'Služba AI není dostupná'}`);
    }
  }

  private static async parseWithVision(file: Express.Multer.File, sourceDocumentId: string): Promise<JudgmentExtractedData> {
    const { GoogleGenAI } = await import('@google/genai');

    const primaryKey = process.env.GEMINI_API_KEY;
    const secondaryKey = process.env.GEMINI_API_KEY_2;

    if (!primaryKey && !secondaryKey) {
      throw new Error("Pro analýzu naskenovaných dokumentů a obrázků (OCR) je vyžadován platný GEMINI_API_KEY. Pokud máte textové PDF, zkontrolujte, zda obsahuje vrstvu s textem, nebo vložte text ručně.");
    }

    // Determine normalized MIME type
    let mimeType = file.mimetype;
    const ext = file.originalname?.split('.').pop()?.toLowerCase() || '';
    if (!mimeType || mimeType === 'application/octet-stream') {
      if (ext === 'pdf') mimeType = 'application/pdf';
      else if (ext === 'png') mimeType = 'image/png';
      else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
      else if (ext === 'webp') mimeType = 'image/webp';
      else mimeType = 'application/pdf';
    }

    const prompt = this.getPrompt();
    const base64Data = file.buffer.toString('base64');

    // 1. Try Primary Gemini Key
    if (primaryKey) {
      try {
        console.log('[JudgmentParserService] Invoking Vision OCR with Primary GEMINI_API_KEY...');
        const ai = new GoogleGenAI({ apiKey: primaryKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            prompt,
            {
              inlineData: {
                data: base64Data,
                mimeType
              }
            }
          ]
        });

        if (response.text) {
          console.log('[JudgmentParserService] Vision OCR succeeded with Primary GEMINI_API_KEY.');
          return this.parseResponse(response.text, sourceDocumentId, 'AI_VISION');
        }
      } catch (primaryErr: any) {
        console.warn('[JudgmentParserService] Primary GEMINI_API_KEY vision OCR failed:', primaryErr?.message);
      }
    }

    // 2. Try Secondary Gemini Key if available
    if (secondaryKey) {
      try {
        console.log('[JudgmentParserService] Invoking Vision OCR with Secondary GEMINI_API_KEY_2...');
        const ai2 = new GoogleGenAI({ apiKey: secondaryKey });
        const response2 = await ai2.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            prompt,
            {
              inlineData: {
                data: base64Data,
                mimeType
              }
            }
          ]
        });

        if (response2.text) {
          console.log('[JudgmentParserService] Vision OCR succeeded with Secondary GEMINI_API_KEY_2.');
          return this.parseResponse(response2.text, sourceDocumentId, 'AI_VISION');
        }
      } catch (secErr: any) {
        console.warn('[JudgmentParserService] Secondary GEMINI_API_KEY_2 vision OCR failed:', secErr?.message);
      }
    }

    console.error('[JudgmentParserService] All Vision AI OCR attempts failed.');
    throw new Error("OCR analýza naskenovaného dokumentu selhala. Zkontrolujte, zda je dokument čitelný, nebo vložte text výrokové části ručně.");
  }
}


