import { AiService } from './AiService';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

export interface JudgmentExtractedData {
  childName: string | null;
  childBirthDate: string | null;
  custodyType: "SHARED" | "SOLE_FATHER" | "SOLE_MOTHER" | "CUSTOM" | null;
  scheduleType: "WEEK_A_B" | "EVERY_OTHER_WEEKEND" | "CUSTOM" | null;
  handoverDay: string | null; // např. "NEDELE" nebo "PONDELI"
  handoverTime: string | null; // např. "18:00"
  handoverLocation: string | null;
  alimonyAmount: number | null;
  alimonyDueDate: number | null; // den v měsíci
  holidaysRule: string | null;
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
        // Not a PDF, maybe docx or text, just use buffer as string if it's text
        // Or if it's an image, we should use vision, but let's stick to text or base64
        documentContent = file.buffer.toString('utf-8');
      }
    }

    if (!documentContent || documentContent.trim().length < 50) {
       // If still no text, we might try vision, but Groq fallback won't work with images.
       // The prompt says: "Pokud je extrahovaný text kratší než 50 znaků (jedná se o naskenované PDF nebo obrázek), pošli přímo bajty souboru (base64) do Gemini API s podporou Multimodal Vision."
       if (file) {
         return await this.parseWithVision(file);
       } else {
         throw new Error("Z dokumentu nelze přečíst text. Zkontrolujte, zda je PDF čitelné.");
       }
    }

    return await this.parseWithText(documentContent);
  }

  private static getPrompt(): string {
    return `
Extrahuj ze zadaného rozsudku přesná fakta: jméno dítěte, datum narození, typ péče, den a čas předání (ve formátu HH:MM), místo a výživné. Pokud údaj v dokumentu CHYBÍ, vrať u daného pole NULL. NIKDY si nevymýšlej fiktivní jména ani neplatné časy.

Požadované JSON schéma:
{
  "childName": "Jméno a příjmení dítěte (string) nebo null",
  "childBirthDate": "Datum narození ve formátu YYYY-MM-DD nebo null",
  "custodyType": "SHARED" (střídavá), "SOLE_FATHER" (výhradní otec), "SOLE_MOTHER" (výhradní matka) nebo "CUSTOM",
  "scheduleType": "WEEK_A_B" (týden A / týden B), "EVERY_OTHER_WEEKEND" (lichý víkend) nebo "CUSTOM",
  "handoverDay": "Den předání, např. NEDELE, PONDELI, PATEK nebo null",
  "handoverTime": "Čas předání, např. 17:00 nebo 18:00 nebo null",
  "handoverLocation": "Místo předání nebo null",
  "alimonyAmount": Částka výživného jako číslo (např. 4000) nebo null,
  "alimonyDueDate": Den v měsíci splatnosti výživného (např. 15) nebo null,
  "holidaysRule": "Pravidla pro prázdniny a svátky nebo null"
}

Vrať POUZE platný JSON odpovídající schématu, žádný další text!
`;
  }

  private static parseResponse(responseText: string): JudgmentExtractedData {
    const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      childName: parsed.childName || null,
      childBirthDate: parsed.childBirthDate || null,
      custodyType: parsed.custodyType || null,
      scheduleType: parsed.scheduleType || null,
      handoverDay: parsed.handoverDay || null,
      handoverTime: parsed.handoverTime || null,
      handoverLocation: parsed.handoverLocation || null,
      alimonyAmount: typeof parsed.alimonyAmount === 'number' ? parsed.alimonyAmount : null,
      alimonyDueDate: typeof parsed.alimonyDueDate === 'number' ? parsed.alimonyDueDate : null,
      holidaysRule: parsed.holidaysRule || null
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
