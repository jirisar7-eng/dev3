import { ChildAgeDetail } from '../../types';

export interface AgeBracketConfig {
  key: ChildAgeDetail['ageBracket'];
  minYears: number;
  maxYears: number; // exclusive
  label: string;
  careAllowed: boolean;
  developmentalNotes: string;
}

export const AGE_BRACKETS: AgeBracketConfig[] = [
  {
    key: '0_1',
    minYears: 0,
    maxYears: 1,
    label: 'Kojenec (0–1 rok)',
    careAllowed: true,
    developmentalNotes: 'Kojenecký věk vyžaduje vysokou frekvenci kratších kontaktů pro budování bezpečné vazby bez dlouhých odloučení.',
  },
  {
    key: '1_3',
    minYears: 1,
    maxYears: 3,
    label: 'Batole (1–3 roky)',
    careAllowed: true,
    developmentalNotes: 'Batolecí věk umožňuje postupné navykání na přespání a plynulé předávání ve známém prostředí.',
  },
  {
    key: '3_6',
    minYears: 3,
    maxYears: 6,
    label: 'Předškolní věk (3–6 let)',
    careAllowed: true,
    developmentalNotes: 'Předškolní věk je vhodný pro kratší rotační bloky (např. 2-2-3 nebo 3-4-4-3), usnadňující vnímání času.',
  },
  {
    key: '6_11',
    minYears: 6,
    maxYears: 11,
    label: 'Mladší školní věk (6–11 let)',
    careAllowed: true,
    developmentalNotes: 'Školní věk umožňuje stabilní týdenní režim (7/7) koordinovaný se školním rozvrhem a kroužky.',
  },
  {
    key: '11_15',
    minYears: 11,
    maxYears: 15,
    label: 'Starší školní věk (11–15 let)',
    careAllowed: true,
    developmentalNotes: 'Dítě v tomto věku vnímá režim komplexně a jeho názor má být zohledňován při plánování volného času.',
  },
  {
    key: '15_18',
    minYears: 15,
    maxYears: 18,
    label: 'Dospívající (15–18 let)',
    careAllowed: true,
    developmentalNotes: 'Dospívající vyžaduje vysokou míru flexibility a respektu k vlastním sociálním a studijním aktivitám.',
  },
  {
    key: '18_21',
    minYears: 18,
    maxYears: 21,
    label: 'Zletilé dítě – studující (18–21 let)',
    careAllowed: false,
    developmentalNotes: 'Zletilé dítě již nepodléhá opatrovnickému režimu péče. Případné nároky spadají pod výživné zletilého.',
  },
  {
    key: '21_26',
    minYears: 21,
    maxYears: 26,
    label: 'Zletilé dítě – VŠ studium (21–26 let)',
    careAllowed: false,
    developmentalNotes: 'Plně zletilé dítě připravující se na budoucí povolání. Relevantní pouze pro kalkulaci výživného.',
  },
  {
    key: '26_PLUS',
    minYears: 26,
    maxYears: 150,
    label: 'Dospělý (26+ let)',
    careAllowed: false,
    developmentalNotes: 'Mimo rozsah rodičovské péče a standardního výživného.',
  },
];

export class AgeEngine {
  /**
   * Calculate precise age from birthDate string (YYYY-MM-DD or standard parseable format)
   * relative to a given reference date (default = today).
   */
  public static calculateAge(birthDateInput: string | Date | null | undefined, referenceDate: Date = new Date()): ChildAgeDetail {
    if (!birthDateInput) {
      return {
        years: 0,
        months: 0,
        days: 0,
        totalDays: 0,
        ageBracket: '0_1',
        isAdult: false,
        ageFormatted: 'Datum narození nezadáno',
        notes: 'Doplňte datum narození dítěte ve spisu pro přesnou věkovou analýzu.',
      };
    }

    const birthDate = typeof birthDateInput === 'string' ? new Date(birthDateInput) : birthDateInput;
    if (isNaN(birthDate.getTime())) {
      return {
        years: 0,
        months: 0,
        days: 0,
        totalDays: 0,
        ageBracket: '0_1',
        isAdult: false,
        ageFormatted: 'Neplatné datum narození',
        notes: 'Formát data narození je neplatný.',
      };
    }

    const ref = new Date(referenceDate);
    if (ref < birthDate) {
      return {
        years: 0,
        months: 0,
        days: 0,
        totalDays: 0,
        ageBracket: '0_1',
        isAdult: false,
        ageFormatted: 'Nenarozené dítě',
        notes: 'Referenční datum předchází datu narození.',
      };
    }

    let years = ref.getFullYear() - birthDate.getFullYear();
    let months = ref.getMonth() - birthDate.getMonth();
    let days = ref.getDate() - birthDate.getDate();

    if (days < 0) {
      months -= 1;
      const prevMonthLastDay = new Date(ref.getFullYear(), ref.getMonth(), 0).getDate();
      days += prevMonthLastDay;
    }

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    const diffTime = Math.abs(ref.getTime() - birthDate.getTime());
    const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const isAdult = years >= 18;

    // Find bracket
    const bracket = AGE_BRACKETS.find(b => years >= b.minYears && years < b.maxYears) || AGE_BRACKETS[AGE_BRACKETS.length - 1];

    let ageFormatted = '';
    if (years === 0) {
      if (months === 0) {
        ageFormatted = `${days} ${days === 1 ? 'den' : days < 5 ? 'dny' : 'dní'}`;
      } else {
        ageFormatted = `${months} ${months === 1 ? 'měsíc' : months < 5 ? 'měsíce' : 'měsíců'} (${days} d)`;
      }
    } else {
      const yearText = years === 1 ? 'rok' : years < 5 ? 'roky' : 'let';
      ageFormatted = `${years} ${yearText}${months > 0 ? ` a ${months} m` : ''}`;
    }

    let notes = bracket.developmentalNotes;
    if (isAdult) {
      notes = 'Věk dítěte je mimo standardní rozsah simulace rodičovské péče (18+ let). Dítě je plně zletilé; pro úpravu platebních nároků využijte modul výživného.';
    }

    return {
      years,
      months,
      days,
      totalDays,
      ageBracket: bracket.key,
      isAdult,
      ageFormatted,
      notes,
    };
  }

  /**
   * Check if child is eligible for care simulation (0-18 years)
   */
  public static isEligibleForCareSimulation(birthDate: string | Date | null | undefined): { eligible: boolean; message?: string } {
    const age = this.calculateAge(birthDate);
    if (age.isAdult) {
      return {
        eligible: false,
        message: 'Věk dítěte je mimo standardní rozsah simulace rodičovské péče.',
      };
    }
    return { eligible: true };
  }
}
