import { JudgmentExtractedData, FieldMeta, JudgmentSentenceData } from './judgmentParserService';

export interface ParseMatch<T> {
  value: T;
  confidence: number;
  sourceText: string;
}

export class DeterministicJudgmentParser {
  /**
   * Sentence-level segmenter and classifier for legal judgment texts
   */
  public static extractSentences(text: string): JudgmentSentenceData[] {
    if (!text || !text.trim()) return [];

    const lines = text.replace(/\r\n/g, '\n').split('\n');
    const sentences: JudgmentSentenceData[] = [];
    let sentenceIndex = 1;
    let paragraphNumber = 1;
    let pageNumber = 1;
    let currentSection: 'HEADER' | 'VYROK' | 'ODUVODNENI' | 'POUCENI' | 'PARTICIPANTS' = 'HEADER';

    let currentParagraphText = '';

    const processParagraph = (paraText: string) => {
      if (!paraText.trim()) return;

      const trimmedPara = paraText.trim();

      // Check section transitions
      if (/\b(?:ODŮVODNĚNÍ|Odůvodnění|O d ů v o d n ě n í)\b/i.test(trimmedPara)) {
        currentSection = 'ODUVODNENI';
      } else if (/\b(?:POUČENÍ|Poučení|P o u č e n í)\b/i.test(trimmedPara)) {
        currentSection = 'POUCENI';
      } else if (/\b(?:ÚČASTNÍCI|Účastníci|za účasti|ve věci péče|matka:|otec:)\b/i.test(trimmedPara) && currentSection === 'HEADER') {
        currentSection = 'PARTICIPANTS';
      } else if (/\b(?:ROZSUDEK|USNESENÍ|PŘEDBĚŽNÉ OPATŘENÍ|rozhodl takto:|soud schvaluje tuto dohodu:|svěřuje se|I\.|A\.)\b/i.test(trimmedPara) && (currentSection === 'HEADER' || currentSection === 'PARTICIPANTS')) {
        currentSection = 'VYROK';
      }

      // Sentence splitting regex for Czech text
      const rawSentences = trimmedPara.match(/[^.!?\n]+[.!?]+(?:\s+|$)|[^.!?\n]+(?:\s+|$)/g) || [trimmedPara];

      for (const rawSentence of rawSentences) {
        const cleanSentence = rawSentence.trim().replace(/\s+/g, ' ');
        if (cleanSentence.length > 0) {
          sentences.push({
            sentenceIndex: sentenceIndex++,
            pageNumber,
            paragraphNumber,
            section: currentSection,
            text: cleanSentence,
            confidence: 1.0,
            source: 'LOCAL_PDF'
          });
        }
      }
      paragraphNumber++;
    };

    for (const line of lines) {
      const pageMarkerMatch = line.match(/(?:---|Strana|Page)\s*(\d+)/i);
      if (pageMarkerMatch && pageMarkerMatch[1]) {
        pageNumber = parseInt(pageMarkerMatch[1], 10) || pageNumber;
      }

      if (line.trim() === '') {
        if (currentParagraphText) {
          processParagraph(currentParagraphText);
          currentParagraphText = '';
        }
      } else {
        currentParagraphText += (currentParagraphText ? ' ' : '') + line.trim();
      }
    }

    if (currentParagraphText) {
      processParagraph(currentParagraphText);
    }

    return sentences;
  }
  /**
   * Normalizes Czech date string (e.g. "15. května 2024", "15. 5. 2024", "15.05.2024") to ISO YYYY-MM-DD
   */
  public static normalizeCzechDate(rawDate: string): string | null {
    if (!rawDate) return null;
    const trimmed = rawDate.trim().replace(/\s+/g, ' ');

    const monthMap: Record<string, string> = {
      'ledna': '01', 'leden': '01', 'lednu': '01',
      'února': '02', 'únor': '02', 'únoru': '02',
      'března': '03', 'březen': '03', 'březnu': '03',
      'dubna': '04', 'duben': '04', 'dubnu': '04',
      'května': '05', 'květen': '05', 'květnu': '05',
      'června': '06', 'červen': '06', 'červnu': '06',
      'července': '07', 'červenec': '07', 'červenci': '07',
      'srpna': '08', 'srpen': '08', 'srpnu': '08',
      'září': '09',
      'října': '10', 'říjen': '10', 'říjnu': '10',
      'listopadu': '11', 'listopad': '11',
      'prosince': '12', 'prosinec': '12', 'prosinci': '12'
    };

    // 1. Numeric format: DD. MM. YYYY or DD.MM.YYYY
    const numMatch = trimmed.match(/(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/);
    if (numMatch) {
      const day = numMatch[1].padStart(2, '0');
      const month = numMatch[2].padStart(2, '0');
      const year = numMatch[3];
      const mNum = parseInt(month, 10);
      const dNum = parseInt(day, 10);
      if (mNum >= 1 && mNum <= 12 && dNum >= 1 && dNum <= 31) {
        return `${year}-${month}-${day}`;
      }
    }

    // 2. Word format: DD. [měsíc] YYYY
    const wordMatch = trimmed.match(/(\d{1,2})\.\s*([a-záčďéěíňóřšťúůýž]+)\s*(\d{4})/i);
    if (wordMatch) {
      const day = wordMatch[1].padStart(2, '0');
      const monthWord = wordMatch[2].toLowerCase();
      const year = wordMatch[3];
      const month = monthMap[monthWord];
      if (month) {
        return `${year}-${month}-${day}`;
      }
    }

    return null;
  }

  /**
   * Normalizes Czech currency amount strings ("1 500 Kč", "1.500 Kč", "1500,- Kč", "4 500,00 Kč") to number
   */
  public static normalizeAmount(rawAmount: string | number): number | null {
    if (rawAmount === null || rawAmount === undefined) return null;
    if (typeof rawAmount === 'number') {
      return isNaN(rawAmount) ? null : Math.round(rawAmount * 100) / 100;
    }
    const str = String(rawAmount).trim().replace(/\s+/g, '').replace(/Kč|CZK|,-/gi, '');
    let clean = str;
    if (clean.includes(',') && !clean.includes('.')) {
      clean = clean.replace(',', '.');
    } else if (clean.includes('.') && clean.includes(',')) {
      // E.g. 1.500,00 -> remove thousand dot, convert comma to dot
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else if (clean.match(/\.\d{3}$/)) {
      // E.g. 1.500 -> 1500
      clean = clean.replace('.', '');
    }
    const num = parseFloat(clean.replace(/[^0-9.-]/g, ''));
    return isNaN(num) ? null : Math.round(num * 100) / 100;
  }

  /**
   * Main deterministic parser for Czech legal judgments
   */
  public static parseText(
    text: string,
    sourceDocumentId: string,
    extractionMethod: 'PDF_PARSE' | 'MAMMOTH_DOCX' | 'AI_TEXT' = 'PDF_PARSE'
  ): JudgmentExtractedData {
    const raw = text || '';
    const normalized = raw.replace(/\r\n/g, '\n').replace(/\t/g, ' ');

    const fields: Record<string, FieldMeta> = {};

    const registerField = <T>(
      key: string,
      match: ParseMatch<T> | null,
      fallbackValue: T | null = null,
      defaultStatus: 'VERIFIED' | 'NEEDS_REVIEW' | 'NOT_FOUND' = 'VERIFIED'
    ) => {
      if (match && match.value !== null && match.value !== undefined) {
        const conf = match.confidence;
        const status = conf >= 0.8 ? 'VERIFIED' : 'NEEDS_REVIEW';
        fields[key] = {
          value: match.value,
          confidence: conf,
          status,
          source: 'LOCAL_PDF',
          sourceText: match.sourceText || null
        };
      } else {
        fields[key] = {
          value: fallbackValue,
          confidence: 0.0,
          status: 'NOT_FOUND',
          sourceText: null
        };
      }
    };

    // 1. COURT (Soud)
    const courtMatch = this.extractCourt(normalized);
    registerField('court', courtMatch);

    // 2. CASE NUMBER (Spisová značka)
    const caseNumberMatch = this.extractCaseNumber(normalized);
    registerField('caseNumber', caseNumberMatch);

    // 3. DECISION DATE (Datum rozhodnutí)
    const judgmentDateMatch = this.extractJudgmentDate(normalized);
    registerField('judgmentDate', judgmentDateMatch);

    // 4. EFFECTIVE DATE (Právní moc) - NEVER guess! Only if explicitly in text
    const effectiveDateMatch = this.extractEffectiveDate(normalized);
    registerField('effectiveDate', effectiveDateMatch, null, 'NOT_FOUND');

    // 5. PARTICIPANTS (Účastníci: Otec, Matka, OSPOD)
    const participantsMatch = this.extractParticipants(normalized);
    registerField('participants', participantsMatch, []);

    // 6. CHILD (Nezletilé dítě a datum narození)
    const childMatch = this.extractChild(normalized);
    registerField('childName', childMatch ? { value: childMatch.value.name, confidence: childMatch.confidence, sourceText: childMatch.sourceText } : null);
    registerField('childBirthDate', childMatch && childMatch.value.birthDate ? { value: childMatch.value.birthDate, confidence: childMatch.confidence, sourceText: childMatch.sourceText } : null);

    // 7. CUSTODY & SCHEDULE TYPE
    const custodyMatch = this.extractCustodyType(normalized);
    registerField('custodyType', custodyMatch);

    const scheduleMatch = this.extractScheduleType(normalized);
    registerField('scheduleType', scheduleMatch);

    // 8. ASYMMETRIC / EVEN / ODD WEEKS CARE RULES
    const evenOddMatch = this.extractEvenOddWeeks(normalized);
    registerField('evenWeek', evenOddMatch.even);
    registerField('oddWeek', evenOddMatch.odd);

    // 9. HANDOVER DETAILS (Den, Čas, Místo)
    const handoverMatch = this.extractHandover(normalized, evenOddMatch);
    registerField('handoverDay', handoverMatch.day);
    registerField('handoverTime', handoverMatch.time);
    registerField('handoverStartTime', handoverMatch.startTime);
    registerField('handoverEndTime', handoverMatch.endTime);
    registerField('handoverLocation', handoverMatch.location);

    // 10. HOLIDAYS & VACATIONS (Prázdniny, Vánoce, Velikonoce, Léto)
    const holidaysMatch = this.extractHolidays(normalized);
    registerField('holidaysRule', holidaysMatch.general);
    registerField('christmasRule', holidaysMatch.christmas);
    registerField('easterRule', holidaysMatch.easter);
    registerField('summerRule', holidaysMatch.summer);

    // 11. FINANCIALS: REGULAR ALIMONY & ALIMONY DEBT
    const alimonyMatch = this.extractAlimony(normalized);
    registerField('alimonyAmount', alimonyMatch.amount);
    registerField('alimonyDueDate', alimonyMatch.dueDate);
    registerField('alimonyPaymentMethod', alimonyMatch.paymentMethod);
    registerField('alimonyRecipient', alimonyMatch.recipient);

    const alimonyDebtMatch = this.extractAlimonyDebt(normalized);
    registerField('alimonyDebtAmount', alimonyDebtMatch.amount);
    registerField('alimonyDebtPeriod', alimonyDebtMatch.period);
    registerField('alimonyDebtDueDate', alimonyDebtMatch.dueDate);

    // 12. INFORMATION & OTHER DUTIES
    const infoDutyMatch = this.extractInformationDuty(normalized);
    registerField('informationDuty', infoDutyMatch);

    const otherDutiesMatch = this.extractOtherDuties(normalized);
    registerField('otherDuties', otherDutiesMatch);

    // Metadata tally
    let totalFound = 0;
    let needsReviewCount = 0;
    let notFoundCount = 0;

    for (const k of Object.keys(fields)) {
      if (fields[k].status === 'VERIFIED') totalFound++;
      else if (fields[k].status === 'NEEDS_REVIEW') {
        needsReviewCount++;
        totalFound++;
      } else {
        notFoundCount++;
      }
    }

    return {
      sourceDocumentId,
      extractionMethod,
      rawText: raw,
      sentences: this.extractSentences(raw),
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
      handoverStartTime: fields.handoverStartTime.value,
      handoverEndTime: fields.handoverEndTime.value,
      handoverLocation: fields.handoverLocation.value,
      holidaysRule: fields.holidaysRule.value,
      christmasRule: fields.christmasRule.value,
      easterRule: fields.easterRule.value,
      summerRule: fields.summerRule.value,
      evenOddYearsRule: null,
      alimonyAmount: fields.alimonyAmount.value,
      alimonyDueDate: fields.alimonyDueDate.value,
      alimonyPaymentMethod: fields.alimonyPaymentMethod.value,
      alimonyRecipient: fields.alimonyRecipient?.value || null,
      alimonyDebtAmount: fields.alimonyDebtAmount?.value || null,
      alimonyDebtPeriod: fields.alimonyDebtPeriod?.value || null,
      alimonyDebtDueDate: fields.alimonyDebtDueDate?.value || null,
      informationDuty: fields.informationDuty?.value || null,
      otherDuties: fields.otherDuties.value,
      metadata: {
        totalFound,
        needsReviewCount,
        notFoundCount,
        fields
      }
    };
  }

  // ----------------------------------------------------
  // INDIVIDUAL FIELD EXTRACTION ENGINES
  // ----------------------------------------------------

  private static extractCourt(text: string): ParseMatch<string> | null {
    const courtRegexes = [
      /(Okresní\s+soud\s+v\s+[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][a-záčďéěíňóřšťúůýž]+(?:\s+-\s+pobočka\s+v\s+[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][a-záčďéěíňóřšťúůýž]+)?)/i,
      /(Okresní\s+soud\s+(?:Plzeň-město|Brno-město|Brno-venkov|Ostrava-město|Praha-[a-záčďéěíňóřšťúůýž]+))/i,
      /(Obvodní\s+soud\s+pro\s+Prahu\s+[0-9]+)/i,
      /(Městský\s+soud\s+v\s+(?:Praze|Brně|[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][a-záčďéěíňóřšťúůýž]+))/i,
      /(Krajský\s+soud\s+v\s+[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][a-záčďéěíňóřšťúůýž]+(?:\s+-\s+pobočka\s+v\s+[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][a-záčďéěíňóřšťúůýž]+)?)/i,
      /(Vrchní\s+soud\s+v\s+[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][a-záčďéěíňóřšťúůýž]+)/i,
      /(Nejvyšší\s+soud(?:\s+České\s+republiky|\s+v\s+Brně)?)/i
    ];

    for (const r of courtRegexes) {
      const match = text.match(r);
      if (match && match[1]) {
        const val = match[1].trim().replace(/\s+/g, ' ');
        return {
          value: val,
          confidence: 0.95,
          sourceText: match[0]
        };
      }
    }
    return null;
  }

  private static extractCaseNumber(text: string): ParseMatch<string> | null {
    // 1. Explicit prefixes: č. j., sp. zn., spisová značka
    const explicitRegex = /(?:č\.\s*j\.|sp\.\s*zn\.|spisová\s+značka:?)\s*([0-9]+\s*(?:P|Nc|P\s*a\s*Nc|C|Cd|Co)\s*[0-9]+\s*\/\s*[0-9]{2,4}(?:-[0-9]+)?)/i;
    const expMatch = text.match(explicitRegex);
    if (expMatch && expMatch[1]) {
      const cleaned = expMatch[1].replace(/\s+/g, ' ').trim();
      return {
        value: cleaned,
        confidence: 0.98,
        sourceText: expMatch[0]
      };
    }

    // 2. Generic boundary pattern: 12 P 45/2023 or 0 P 123/2024-56
    const genericRegex = /\b([0-9]+\s+(?:P|Nc|P\s*a\s*Nc|C|Cd|Co)\s+[0-9]+\s*\/\s*[0-9]{2,4}(?:-[0-9]+)?)\b/i;
    const genMatch = text.match(genericRegex);
    if (genMatch && genMatch[1]) {
      const cleaned = genMatch[1].replace(/\s+/g, ' ').trim();
      return {
        value: cleaned,
        confidence: 0.88,
        sourceText: genMatch[0]
      };
    }

    return null;
  }

  private static extractJudgmentDate(text: string): ParseMatch<string> | null {
    const dateRegexes = [
      /(?:dne|ze\s+dne|vyhlášeno\s+dne|v\s+[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][a-záčďéěíňóřšťúůýž]+\s+dne)\s+([0-9]{1,2}\.\s*(?:[0-9]{1,2}\.|[a-záčďéěíňóřšťúůýž]+)\s*[0-9]{4})/i,
      /(?:rozsudek\s+ze\s+dne)\s+([0-9]{1,2}\.\s*(?:[0-9]{1,2}\.|[a-záčďéěíňóřšťúůýž]+)\s*[0-9]{4})/i
    ];

    for (const r of dateRegexes) {
      const m = text.match(r);
      if (m && m[1]) {
        const iso = this.normalizeCzechDate(m[1]);
        if (iso) {
          return {
            value: iso,
            confidence: 0.92,
            sourceText: m[0]
          };
        }
      }
    }

    return null;
  }

  private static extractEffectiveDate(text: string): ParseMatch<string> | null {
    // Only extract if explicitly marked with legal force clause (doložka právní moci)
    const effectiveRegexes = [
      /(?:nabyl\s+právní\s+moci\s+dne|nabyl\s+PM\s+dne|doložka\s+právní\s+moci\s*[:\-–]?\s*dne)\s+([0-9]{1,2}\.\s*(?:[0-9]{1,2}\.|[a-záčďéěíňóřšťúůýž]+)\s*[0-9]{4})/i,
      /(?:právní\s+moc\s+nastala\s+dne)\s+([0-9]{1,2}\.\s*(?:[0-9]{1,2}\.|[a-záčďéěíňóřšťúůýž]+)\s*[0-9]{4})/i
    ];

    for (const r of effectiveRegexes) {
      const m = text.match(r);
      if (m && m[1]) {
        const iso = this.normalizeCzechDate(m[1]);
        if (iso) {
          return {
            value: iso,
            confidence: 0.95,
            sourceText: m[0]
          };
        }
      }
    }

    return null;
  }

  private static extractParticipants(text: string): ParseMatch<string[]> | null {
    const list: string[] = [];
    const sourceTexts: string[] = [];

    // Otec
    const fatherMatch = text.match(/(?:žalobce\s*\/\s*otce|žalovaný\s*\/\s*otec|otec|otce|navrhovatel|odpůrce):\s*([A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][a-záčďéěíňóřšťúůýž]+(?:\s+[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][a-záčďéěíňóřšťúůýž]+)+)/i);
    if (fatherMatch && fatherMatch[1]) {
      const clean = fatherMatch[1].trim().replace(/\s+/g, ' ');
      list.push(clean);
      sourceTexts.push(fatherMatch[0]);
    }

    // Matka
    const motherMatch = text.match(/(?:žalované\s*\/\s*matky|žalobkyně\s*\/\s*matka|matka|matky|navrhovatelka|odpůrkyně):\s*([A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][a-záčďéěíňóřšťúůýž]+(?:\s+[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][a-záčďéěíňóřšťúůýž]+)+)/i);
    if (motherMatch && motherMatch[1]) {
      const clean = motherMatch[1].trim().replace(/\s+/g, ' ');
      list.push(clean);
      sourceTexts.push(motherMatch[0]);
    }

    // Opatrovník / OSPOD
    const ospodMatch = text.match(/(?:opatrovník|za\s+účasti\s+opatrovníka):\s*([^,\n]+)/i);
    if (ospodMatch && ospodMatch[1]) {
      const clean = ospodMatch[1].trim().replace(/\s+/g, ' ');
      list.push(clean);
      sourceTexts.push(ospodMatch[0]);
    }

    if (list.length > 0) {
      return {
        value: list,
        confidence: 0.9,
        sourceText: sourceTexts.join('; ')
      };
    }
    return null;
  }

  private static extractChild(text: string): ParseMatch<{ name: string; birthDate: string | null }> | null {
    const childRegexes = [
      /(?:nezl\.|nezletil(?:ého|ou|ý|á|é)?:?|péče\s+o\s+nezletil(?:ého|ou|é)?)\s+([A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][a-záčďéěíňóřšťúůýž]+(?:\s+[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][a-záčďéěíňóřšťúůýž]+)*)(?:[,\s]+nar(?:ozen[a-y]?)?(?:\s+dne)?\.?\s*([0-9]{1,2}\.\s*(?:[0-9]{1,2}\.|[a-záčďéěíňóřšťúůýž]+)\s*[0-9]{4}))?/gi,
      /(?:zastupující\s+nezl\.|ve\s+věci\s+nezl\.)\s+([A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][a-záčďéěíňóřšťúůýž]+(?:\s+[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][a-záčďéěíňóřšťúůýž]+)*)/gi
    ];

    const invalidNames = ['dítě', 'dítěte', 'rodiče', 'rodičů', 'obou', 'všech', 'syna', 'dceru', 'nezletilého', 'nezletilou', 'nezletilé'];

    for (const r of childRegexes) {
      const matches = Array.from(text.matchAll(r));
      for (const m of matches) {
        if (m && m[1]) {
          let name = m[1].trim().replace(/\s+/g, ' ');
          name = name.replace(/\s+(?:se\s+sv[eěřr]+uje|nar\.?|dne|bytem|zastoupený|zastoupená|v\s+péči).*/i, '').trim();
          if (!name || name.length < 2 || invalidNames.includes(name.toLowerCase())) continue;

          let birthDate: string | null = null;
          if (m[2]) {
            birthDate = this.normalizeCzechDate(m[2]);
          } else {
            // Look for birth date near child mention in the source text
            const nearbyBirth = m[0].match(/nar(?:ozen[a-y]?)?(?:\s+dne)?\.?\s*([0-9]{1,2}\.\s*(?:[0-9]{1,2}\.|[a-záčďéěíňóřšťúůýž]+)\s*[0-9]{4})/i) ||
                                text.match(new RegExp(name + `[\\s\\S]{0,60}?nar(?:ozen[a-y]?)?(?:\\s+dne)?\\.?\\s*([0-9]{1,2}\\.\\s*(?:[0-9]{1,2}\\.|[a-záčďéěíňóřšťúůýž]+)\\s*[0-9]{4})`, 'i'));
            if (nearbyBirth && nearbyBirth[1]) {
              birthDate = this.normalizeCzechDate(nearbyBirth[1]);
            }
          }

          return {
            value: { name, birthDate },
            confidence: 0.92,
            sourceText: m[0]
          };
        }
      }
    }

    return null;
  }

  private static extractCustodyType(text: string): ParseMatch<'SHARED' | 'SOLE_FATHER' | 'SOLE_MOTHER' | 'CUSTOM'> | null {
    if (/(?:střídav[áé]\s+péč[ei]|péč[ei]\s+obou\s+rodičů|společn[áé]\s+péč[ei]|střídavě\s+do\s+péče)/i.test(text)) {
      return {
        value: 'SHARED',
        confidence: 0.95,
        sourceText: 'svěřuje se do střídavé péče rodičů'
      };
    }

    if (/(?:do\s+výlučné\s+péče\s+otce|do\s+péče\s+otce|svěřuje\s+se\s+otci)/i.test(text)) {
      return {
        value: 'SOLE_FATHER',
        confidence: 0.95,
        sourceText: 'svěřuje se do péče otce'
      };
    }

    if (/(?:do\s+výlučné\s+péče\s+matky|do\s+péče\s+matky|svěřuje\s+se\s+matce)/i.test(text)) {
      return {
        value: 'SOLE_MOTHER',
        confidence: 0.95,
        sourceText: 'svěřuje se do péče matky'
      };
    }

    return null;
  }

  private static extractScheduleType(text: string): ParseMatch<'EVEN_ODD_WEEKS' | 'WEEK_A_B' | 'EVERY_OTHER_WEEKEND' | 'CUSTOM' | 'STANDARD'> | null {
    if (/(?:sud[ýéáých]+\s+(?:a\s+lich[ýéáých]+\s+)?(?:kalendářní(?:ch)?\s+)?týdn[euåůych]+|sudých\s+a\s+lichých\s+(?:kalendářních\s+)?týdn[ůech]+|v\s+sudém\s+týdnu|v\s+lichém\s+týdnu)/i.test(text)) {
      return {
        value: 'EVEN_ODD_WEEKS',
        confidence: 0.95,
        sourceText: 'rozvrh podle sudých a lichých kalendářních týdnů'
      };
    }

    if (/(?:každý\s+druhý\s+víkend|každém\s+druhém\s+týdnu\s+o\s+víkendu|každý\s+sudý\s+víkend|každý\s+lichý\s+víkend)/i.test(text)) {
      return {
        value: 'EVERY_OTHER_WEEKEND',
        confidence: 0.9,
        sourceText: 'rozvrh každý druhý víkend'
      };
    }

    if (/(?:střídavě\s+po\s+týdnu|v\s+intervalu\s+jednoho\s+týdne|7\s*\/\s*7)/i.test(text)) {
      return {
        value: 'EVEN_ODD_WEEKS',
        confidence: 0.9,
        sourceText: 'střídání po týdnu (7/7)'
      };
    }

    return null;
  }

  private static parseDaysAndTimesFromSection(sectionText: string): { days: string[]; summary: string; start: string | null; end: string | null } {
    const days: string[] = [];
    const dayMap: Array<{ regex: RegExp; code: string; label: string }> = [
      { regex: /pondělí|po\b/i, code: 'MON', label: 'Pondělí' },
      { regex: /úterý|út\b/i, code: 'TUE', label: 'Úterý' },
      { regex: /střed[au]|st\b/i, code: 'WED', label: 'Středa' },
      { regex: /čtvrtek|čt\b/i, code: 'THU', label: 'Čtvrtek' },
      { regex: /pátek|pá\b/i, code: 'FRI', label: 'Pátek' },
      { regex: /sobot[au]|so\b/i, code: 'SAT', label: 'Sobota' },
      { regex: /neděl[ei]|ne\b/i, code: 'SUN', label: 'Neděle' }
    ];

    const foundLabels: string[] = [];
    for (const d of dayMap) {
      if (d.regex.test(sectionText)) {
        if (!days.includes(d.code)) {
          days.push(d.code);
          foundLabels.push(d.label);
        }
      }
    }

    // Time regex: od 08:45 do 15:30 or od 8:00 do 18:00
    const timeMatch = sectionText.match(/od\s*(\d{1,2}[:.]\d{2})\s*(?:hodin|hod\.)?\s*do\s*(\d{1,2}[:.]\d{2})\s*(?:hodin|hod\.)?/i);
    let start: string | null = null;
    let end: string | null = null;

    if (timeMatch) {
      start = timeMatch[1].replace('.', ':').padStart(5, '0');
      end = timeMatch[2].replace('.', ':').padStart(5, '0');
    }

    let summary = foundLabels.join(', ');
    if (start && end) {
      summary += ` ${start}-${end}`;
    }

    return { days, summary, start, end };
  }

  private static extractEvenOddWeeks(text: string): {
    even: ParseMatch<{ days: string[]; summary: string }> | null;
    odd: ParseMatch<{ days: string[]; summary: string }> | null;
    startTime: string | null;
    endTime: string | null;
  } {
    let even: ParseMatch<{ days: string[]; summary: string }> | null = null;
    let odd: ParseMatch<{ days: string[]; summary: string }> | null = null;
    let startTime: string | null = null;
    let endTime: string | null = null;

    // Search for even week specification
    const evenMatch = text.match(/(?:v\s+sud[eé]m\s+t[yý]dnu|sud[eé]\s+t[yý]dny?|sud[ýé]\s+kalendářní\s+týden)[^.;\n]+(?:od[^.;\n]+do[^.;\n]+)?/i);
    if (evenMatch) {
      const parsed = this.parseDaysAndTimesFromSection(evenMatch[0]);
      if (parsed.days.length > 0) {
        even = {
          value: { days: parsed.days, summary: parsed.summary },
          confidence: 0.92,
          sourceText: evenMatch[0]
        };
        if (parsed.start) startTime = parsed.start;
        if (parsed.end) endTime = parsed.end;
      }
    }

    // Search for odd week specification
    const oddMatch = text.match(/(?:v\s+lich[eé]m\s+t[yý]dnu|lich[eé]\s+t[yý]dny?|lich[ýé]\s+kalendářní\s+týden)[^.;\n]+(?:od[^.;\n]+do[^.;\n]+)?/i);
    if (oddMatch) {
      const parsed = this.parseDaysAndTimesFromSection(oddMatch[0]);
      if (parsed.days.length > 0) {
        odd = {
          value: { days: parsed.days, summary: parsed.summary },
          confidence: 0.92,
          sourceText: oddMatch[0]
        };
        if (!startTime && parsed.start) startTime = parsed.start;
        if (!endTime && parsed.end) endTime = parsed.end;
      }
    }

    // Fallback for full 7/7 alternating without explicit even/odd day breakdown:
    if (!even && !odd && /(?:střídavě\s+po\s+týdnu|7\s*\/\s*7)/i.test(text)) {
      const allDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
      even = {
        value: { days: allDays, summary: 'Celý týden (7/7)' },
        confidence: 0.85,
        sourceText: 'střídavě po týdnu'
      };
      odd = {
        value: { days: allDays, summary: 'Celý týden (7/7)' },
        confidence: 0.85,
        sourceText: 'střídavě po týdnu'
      };
    }

    return { even, odd, startTime, endTime };
  }

  private static extractHandover(
    text: string,
    evenOdd: { even: any; odd: any; startTime: string | null; endTime: string | null }
  ): {
    day: ParseMatch<string> | null;
    time: ParseMatch<string> | null;
    startTime: ParseMatch<string> | null;
    endTime: ParseMatch<string> | null;
    location: ParseMatch<string> | null;
  } {
    let day: ParseMatch<string> | null = null;
    let time: ParseMatch<string> | null = null;
    let startTime: ParseMatch<string> | null = null;
    let endTime: ParseMatch<string> | null = null;
    let location: ParseMatch<string> | null = null;

    // Day of handover
    const dayMatch = text.match(/(?:každé\s+|vždy\s+v\s+|předání\s+v\s+)(pondělí|úterý|středu|čtvrtek|pátek|sobotu|neděli)/i);
    if (dayMatch && dayMatch[1]) {
      const d = dayMatch[1].toLowerCase();
      const cap = d.charAt(0).toUpperCase() + d.slice(1);
      day = {
        value: cap,
        confidence: 0.9,
        sourceText: dayMatch[0]
      };
    } else if (evenOdd.even?.value?.days?.length > 0) {
      // First day of even week
      const first = evenOdd.even.value.days[0];
      const map: Record<string, string> = { MON: 'Pondělí', TUE: 'Úterý', WED: 'Středa', THU: 'Čtvrtek', FRI: 'Pátek', SAT: 'Sobota', SUN: 'Neděle' };
      day = {
        value: map[first] || 'Pondělí',
        confidence: 0.85,
        sourceText: evenOdd.even.sourceText
      };
    }

    // Handover Start & End Times
    if (evenOdd.startTime) {
      startTime = {
        value: evenOdd.startTime,
        confidence: 0.95,
        sourceText: `čas od ${evenOdd.startTime}`
      };
      time = {
        value: evenOdd.startTime,
        confidence: 0.95,
        sourceText: `čas od ${evenOdd.startTime}`
      };
    }
    if (evenOdd.endTime) {
      endTime = {
        value: evenOdd.endTime,
        confidence: 0.95,
        sourceText: `čas do ${evenOdd.endTime}`
      };
    }

    if (!time) {
      const genericTimeMatch = text.match(/(?:v\s*|od\s*)(\d{1,2}[:.]\d{2})\s*(?:hodin|hod\.)/i);
      if (genericTimeMatch && genericTimeMatch[1]) {
        const t = genericTimeMatch[1].replace('.', ':').padStart(5, '0');
        time = {
          value: t,
          confidence: 0.85,
          sourceText: genericTimeMatch[0]
        };
        startTime = time;
      }
    }

    // Location
    const locRegexes = [
      /(?:předání\s+(?:dítěte|nezletilého)?\s*(?:se\s+uskuteční|proběhne)?\s*(?:v|ve|u)\s+)([^,.;\n]+)/i,
      /(?:v\s+místě\s+bydliště\s+(?:matky|otce|dítěte))/i,
      /(?:v\s+předškolním\s+zařízení|ve\s+škole|v\s+MŠ|v\s+ZŠ)/i
    ];

    for (const r of locRegexes) {
      const m = text.match(r);
      if (m) {
        const val = (m[1] ? m[1] : m[0]).trim().replace(/\s+/g, ' ');
        location = {
          value: val,
          confidence: 0.88,
          sourceText: m[0]
        };
        break;
      }
    }

    return { day, time, startTime, endTime, location };
  }

  private static extractHolidays(text: string): {
    general: ParseMatch<string> | null;
    christmas: ParseMatch<string> | null;
    easter: ParseMatch<string> | null;
    summer: ParseMatch<string> | null;
  } {
    let general: ParseMatch<string> | null = null;
    let christmas: ParseMatch<string> | null = null;
    let easter: ParseMatch<string> | null = null;
    let summer: ParseMatch<string> | null = null;

    // Summer holidays
    const summerMatch = text.match(/(?:letní\s+prázdnin\w*|během\s+letních\s+prázdnin|v\s+červenci\s+a\s+srpnu)[^.;\n]+/i);
    if (summerMatch) {
      summer = {
        value: summerMatch[0].trim().replace(/\s+/g, ' '),
        confidence: 0.9,
        sourceText: summerMatch[0]
      };
    }

    // Christmas
    const christmasMatch = text.match(/(?:vánočn[íích]+\s+svát\w*|vánočn[íích]+\s+prázdnin\w*|štědrý\s+den|24\.\s*12\.)[^.;\n]*/i);
    if (christmasMatch) {
      christmas = {
        value: christmasMatch[0].trim().replace(/\s+/g, ' '),
        confidence: 0.9,
        sourceText: christmasMatch[0]
      };
    }

    // Easter
    const easterMatch = text.match(/(?:velikonočn[íích]+\s+svát\w*|velikonočn[íích]+\s+prázdnin\w*|velikonoce)[^.;\n]*/i);
    if (easterMatch) {
      easter = {
        value: easterMatch[0].trim().replace(/\s+/g, ' '),
        confidence: 0.9,
        sourceText: easterMatch[0]
      };
    }

    // General rule summary
    if (summer || christmas || easter) {
      const summaryParts = [
        summer ? `Léto: ${summer.value}` : null,
        christmas ? `Vánoce: ${christmas.value}` : null,
        easter ? `Velikonoce: ${easter.value}` : null
      ].filter(Boolean);
      general = {
        value: summaryParts.join('; '),
        confidence: 0.9,
        sourceText: [summer?.sourceText, christmas?.sourceText, easter?.sourceText].filter(Boolean).join('; ')
      };
    }

    return { general, christmas, easter, summer };
  }

  private static extractAlimony(text: string): {
    amount: ParseMatch<number> | null;
    dueDate: ParseMatch<number> | null;
    paymentMethod: ParseMatch<string> | null;
    recipient: ParseMatch<string> | null;
  } {
    let amount: ParseMatch<number> | null = null;
    let dueDate: ParseMatch<number> | null = null;
    let paymentMethod: ParseMatch<string> | null = null;
    let recipient: ParseMatch<string> | null = null;

    // Alimony amount: "výživné ve výši 1 500 Kč měsíčně", "1.500 Kč", "1500,- Kč", "částkou ve výši 6 500 Kč"
    const alimonyRegexes = [
      /(?:výživn[ée]\s+(?:pro\s+nezletil[ého\s]+)?(?:ve\s+výši\s+|částkou\s+(?:ve\s+výši\s+)?|sumu\s+)?)([0-9\s.,]+)\s*(?:,-)?\s*(?:Kč|CZK)\s*(?:měsíčně|každý\s+měsíc)?/i,
      /(?:přispívat\s+na\s+výživu\s+(?:nezletil[ého\s]+)?(?:částkou\s+(?:ve\s+výši\s+)?|ve\s+výši\s+)?)([0-9\s.,]+)\s*(?:,-)?\s*(?:Kč|CZK)/i,
      /(?:výživné\s+činí\s+)([0-9\s.,]+)\s*(?:,-)?\s*(?:Kč|CZK)/i
    ];

    for (const r of alimonyRegexes) {
      const m = text.match(r);
      if (m && m[1]) {
        const num = this.normalizeAmount(m[1]);
        if (num && num > 0) {
          amount = {
            value: num,
            confidence: 0.95,
            sourceText: m[0]
          };
          break;
        }
      }
    }

    // Due date: "vždy do 15. dne v měsíci", "do 20. dne v každém měsíci", "splatnou vždy do každého 15. dne v měsíci"
    const dueMatch = text.match(/(?:splatn[ouéy]+\s+)?(?:vždy\s+)?do\s+(?:každého\s+)?([0-9]{1,2})\.\s*dne\s+(?:v\s+měsíci|každého\s+měsíce|předem)?/i);
    if (dueMatch && dueMatch[1]) {
      const dayNum = parseInt(dueMatch[1], 10);
      if (dayNum >= 1 && dayNum <= 31) {
        dueDate = {
          value: dayNum,
          confidence: 0.92,
          sourceText: dueMatch[0]
        };
      }
    }

    // Recipient: "k rukám matky", "k rukám otce"
    const recMatch = text.match(/k\s+rukám\s+(matky|otce)/i);
    if (recMatch && recMatch[1]) {
      const rec = recMatch[1].toLowerCase() === 'matky' ? 'matka' : 'otec';
      recipient = {
        value: rec,
        confidence: 0.95,
        sourceText: recMatch[0]
      };
    }

    // Payment method
    if (/(?:na\s+účet|bankovním\s+převodem|převodem\s+z\s+účtu)/i.test(text)) {
      paymentMethod = {
        value: 'BANK_TRANSFER',
        confidence: 0.9,
        sourceText: 'bankovním převodem na účet'
      };
    } else {
      paymentMethod = {
        value: 'BANK_TRANSFER',
        confidence: 0.8,
        sourceText: 'standardní bezhotovostní převod'
      };
    }

    return { amount, dueDate, paymentMethod, recipient };
  }

  private static extractAlimonyDebt(text: string): {
    amount: ParseMatch<number> | null;
    period: ParseMatch<string> | null;
    dueDate: ParseMatch<string> | null;
  } {
    let amount: ParseMatch<number> | null = null;
    let period: ParseMatch<string> | null = null;
    let dueDate: ParseMatch<string> | null = null;

    // Alimony Debt: "dlužné výživné za období od ... do ... ve výši 18 000 Kč" or "dlužné výživné ve výši 200 Kč za květen 2026"
    const debtRegexes = [
      /(?:dlužn[ée]\s+výživn[ée])(?:\s+za\s+období\s+(?:od\s+([0-9.\s]+)\s+do\s+([0-9.\s]+)|([^,.;\n]+)))?\s*(?:ve\s+výši\s+|činí\s+)?([0-9\s.,]+)\s*(?:,-)?\s*(?:Kč|CZK)/i,
      /(?:dlužn[ée]\s+výživn[ée]\s+(?:ve\s+výši\s+|činí\s+)?)([0-9\s.,]+)\s*(?:,-)?\s*(?:Kč|CZK)(?:\s+za\s+období\s+([^,.;\n]+)|\s+za\s+([a-záčďéěíňóřšťúůýž\s0-9]+))?/i
    ];

    for (const r of debtRegexes) {
      const m = text.match(r);
      if (m) {
        const numStr = m[4] || m[1];
        if (numStr) {
          const num = this.normalizeAmount(numStr);
          if (num && num > 0) {
            amount = {
              value: num,
              confidence: 0.95,
              sourceText: m[0]
            };

            const rawPeriod = (m[1] && m[2]) ? `od ${m[1].trim()} do ${m[2].trim()}` : (m[3] || '').trim();
            if (rawPeriod) {
              period = {
                value: rawPeriod,
                confidence: 0.9,
                sourceText: rawPeriod
              };
            }
            break;
          }
        }
      }
    }

    // Repayment term / due date for debt: e.g. "ve lhátě do 31. 12. 2024" or "do 1 měsíce od právní moci"
    const debtLines = text.split('\n').filter(l => /dlužn[ée]\s+výživn[ée]/i.test(l));
    const debtScope = debtLines.length > 0 ? debtLines.join(' ') : text;

    // Scan after the debt amount / period for repayment deadline
    const debtDateMatch = debtScope.match(/(?:uhradit|zaplatit|splatit|splatn[ée]|uhradit\s+ve\s+lhátě|ve\s+lhátě)\s+(?:do|nejpozději\s+do)\s+([0-9]{1,2}\.\s*[0-9]{1,2}\.\s*[0-9]{4})/i);
    if (debtDateMatch && debtDateMatch[1]) {
      const iso = this.normalizeCzechDate(debtDateMatch[1]);
      if (iso) {
        dueDate = {
          value: iso,
          confidence: 0.95,
          sourceText: debtDateMatch[0]
        };
      }
    } else {
      const termMatch = debtScope.match(/(?:zaplatit\s+do|splatné\s+do|ve\s+lhátě\s+do|uhradit\s+do)\s+([0-9]+\s+(?:měsíců|měsíce|dnů))\s+od\s+právní\s+moci/i);
      if (termMatch && termMatch[1]) {
        dueDate = {
          value: `do ${termMatch[1]} od právní moci`,
          confidence: 0.9,
          sourceText: termMatch[0]
        };
      }
    }

    return { amount, period, dueDate };
  }

  private static extractInformationDuty(text: string): ParseMatch<string> | null {
    const infoMatch = text.match(/(?:informační\s+povinnost|rodiče\s+jsou\s+povinni\s+se\s+(?:vzájemně\s+)?informovat|povinnost\s+informovat)[^.;\n]+(?:[.;][^.;\n]+)?/i);
    if (infoMatch) {
      return {
        value: infoMatch[0].trim().replace(/\s+/g, ' '),
        confidence: 0.9,
        sourceText: infoMatch[0]
      };
    }
    return null;
  }

  private static extractOtherDuties(text: string): ParseMatch<string> | null {
    const dutiesMatch = text.match(/(?:mimořádn[éí]\s+výdaj\w*|lékařsk[éí]\s+zpráv\w*|kroužk\w*|cestovní\s+doklad\w*)[^.;\n]+/i);
    if (dutiesMatch) {
      return {
        value: dutiesMatch[0].trim().replace(/\s+/g, ' '),
        confidence: 0.85,
        sourceText: dutiesMatch[0]
      };
    }
    return null;
  }
}
