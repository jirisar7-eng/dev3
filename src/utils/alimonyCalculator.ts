export type AgeGroup = '0-5' | '6-9' | '10-14' | '15+';

export interface ChildInput {
  id: string;
  ageGroup: AgeGroup;
  careDays: number; // 0 to 30.4
}

export interface AlimonyInput {
  netIncome: number;
  children: ChildInput[];
  otherObligations: number;
}

export interface ChildResult {
  id: string;
  baseAmount: number;
  basePercentage: number;
  careReduction: number;
  finalAmount: number;
}

export interface AlimonyResult {
  childrenResults: ChildResult[];
  totalBaseAmount: number;
  totalFinalAmount: number;
  totalObligations: number;
  controlAmountWarning: boolean;
}

const MATRIX = {
  1: { '0-5': 0.14, '6-9': 0.16, '10-14': 0.18, '15+': 0.20 },
  2: { '0-5': 0.12, '6-9': 0.14, '10-14': 0.16, '15+': 0.18 },
  3: { '0-5': 0.10, '6-9': 0.12, '10-14': 0.14, '15+': 0.16 },
  4: { '0-5': 0.08, '6-9': 0.10, '10-14': 0.12, '15+': 0.14 },
  5: { '0-5': 0.06, '6-9': 0.08, '10-14': 0.10, '15+': 0.12 },
};

const AVERAGE_DAYS_IN_MONTH = 30.4;

export function calculateChildSupport(input: AlimonyInput): AlimonyResult {
  if (input.netIncome < 0) {
    throw new Error('Příjem nemůže být záporný.');
  }
  if (input.otherObligations < 0) {
    throw new Error('Počet dalších povinností nemůže být záporný.');
  }
  if (input.children.length === 0) {
    throw new Error('Zadejte alespoň jedno vyživované dítě.');
  }

  const totalObligations = input.children.length + input.otherObligations;
  const clampedObligations = Math.min(Math.max(totalObligations, 1), 5) as 1 | 2 | 3 | 4 | 5;
  const percentages = MATRIX[clampedObligations];

  const childrenResults: ChildResult[] = input.children.map(child => {
    if (child.careDays < 0 || child.careDays > AVERAGE_DAYS_IN_MONTH) {
      throw new Error(`Počet dní péče musí být mezi 0 a ${AVERAGE_DAYS_IN_MONTH}.`);
    }

    const basePercentage = percentages[child.ageGroup];
    const baseAmount = input.netIncome * basePercentage;
    
    // Sleva za styk/péči
    // Pokud rodič pečuje např. 15.2 dní (50%), sleva je 50% ze základní částky.
    const careRatio = child.careDays / AVERAGE_DAYS_IN_MONTH;
    const careReduction = baseAmount * careRatio;
    
    const finalAmount = Math.max(0, Math.round(baseAmount - careReduction));

    return {
      id: child.id,
      basePercentage,
      baseAmount: Math.round(baseAmount),
      careReduction: Math.round(careReduction),
      finalAmount
    };
  });

  const totalBaseAmount = childrenResults.reduce((sum, res) => sum + res.baseAmount, 0);
  const totalFinalAmount = childrenResults.reduce((sum, res) => sum + res.finalAmount, 0);

  // Varování na kontrolní částku (pokud mu po odečtení celkového finálního výživného nezůstane např. více než 50% příjmu u více dětí nebo pod nezabavitelné minimum)
  // MS ČR používá sofistikovanější vzorec pro kontrolní částku (např. procento + pevná částka).
  // Jako bezpečnostní pojistku na klientovi varujeme, pokud součet výživného přesáhne 50% čistého příjmu.
  const controlAmountWarning = totalFinalAmount > (input.netIncome * 0.5);

  return {
    childrenResults,
    totalBaseAmount,
    totalFinalAmount,
    totalObligations,
    controlAmountWarning
  };
}
