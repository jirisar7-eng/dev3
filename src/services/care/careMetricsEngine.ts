import { CareDay, CareMetrics } from '../../types';

export class CareMetricsEngine {
  /**
   * Deterministically calculate metrics from a list of CareDays
   */
  public static calculateMetrics(days: CareDay[]): CareMetrics {
    if (!days || days.length === 0) {
      return {
        totalDays: 0,
        daysA: 0,
        daysB: 0,
        totalNights: 0,
        nightsA: 0,
        nightsB: 0,
        nightsPercentA: 50,
        nightsPercentB: 50,
        estimatedTimePercentA: null,
        estimatedTimePercentB: null,
        timeEstimateCalculable: false,
        timeEstimateNote: 'Podíl času nelze přesně určit z dostupných údajů.',
        totalHandovers: 0,
        handoversPerWeek: 0,
        totalDistanceKm: 0,
        totalTravelMinutes: 0,
        blocksCountA: 0,
        blocksCountB: 0,
        avgBlockLengthDaysA: 0,
        avgBlockLengthDaysB: 0,
        maxBlockLengthDaysA: 0,
        maxBlockLengthDaysB: 0,
        maxSeparationDaysA: 0,
        maxSeparationDaysB: 0,
        schoolHandoversCount: 0,
        weekendDaysA: 0,
        weekendDaysB: 0,
      };
    }

    const totalDays = days.length;
    let daysA = 0;
    let daysB = 0;
    let nightsA = 0;
    let nightsB = 0;
    let totalHandovers = 0;
    let totalDistanceKm = 0;
    let totalTravelMinutes = 0;
    let schoolHandoversCount = 0;
    let weekendDaysA = 0;
    let weekendDaysB = 0;

    let hasExplicitHandoverTimes = true;
    let totalHoursA = 0;
    let totalHoursB = 0;

    // Track blocks
    const blocksA: number[] = [];
    const blocksB: number[] = [];
    let currentBlockParent: string | null = null;
    let currentBlockLength = 0;

    for (let i = 0; i < days.length; i++) {
      const d = days[i];
      const parent = d.assignedParent === 'PARENT_B' ? 'PARENT_B' : 'PARENT_A';
      const overnightParent = d.overnightParent || parent;

      if (parent === 'PARENT_A') {
        daysA++;
      } else {
        daysB++;
      }

      // Overnights
      if (d.isOvernight) {
        if (overnightParent === 'PARENT_A') {
          nightsA++;
        } else {
          nightsB++;
        }
      }

      // Weekend check (5 = Saturday, 6 = Sunday or 0 = Sunday, 6 = Saturday)
      const isWeekend = d.dayOfWeek === 0 || d.dayOfWeek === 6;
      if (isWeekend) {
        if (parent === 'PARENT_A') weekendDaysA++;
        else weekendDaysB++;
      }

      // Handovers & travel
      if (d.isHandover) {
        totalHandovers++;
        totalDistanceKm += d.travelDistanceKm || 0;
        totalTravelMinutes += d.travelDurationMin || 0;

        if (d.schoolParent || d.notes?.toLowerCase().includes('škola') || d.notes?.toLowerCase().includes('skola')) {
          schoolHandoversCount++;
        }

        if (!d.handoverTime || d.handoverTime.trim() === '') {
          hasExplicitHandoverTimes = false;
        }
      }

      // Blocks calculation
      if (currentBlockParent === null) {
        currentBlockParent = parent;
        currentBlockLength = 1;
      } else if (currentBlockParent === parent) {
        currentBlockLength++;
      } else {
        if (currentBlockParent === 'PARENT_A') {
          blocksA.push(currentBlockLength);
        } else {
          blocksB.push(currentBlockLength);
        }
        currentBlockParent = parent;
        currentBlockLength = 1;
      }

      // Time estimate accumulation if handovers have times
      if (d.isHandover && d.handoverTime) {
        const parts = d.handoverTime.split(':');
        const hour = parseInt(parts[0], 10) || 16;
        const min = parseInt(parts[1], 10) || 0;
        const handoverFraction = Math.max(0, Math.min(24, hour + min / 60));

        // Prior to handover hour: child was with the other parent (or previous block parent)
        // After handover hour: child is with d.assignedParent
        const hoursAfter = 24 - handoverFraction;
        const hoursBefore = handoverFraction;

        if (parent === 'PARENT_A') {
          totalHoursA += hoursAfter;
          totalHoursB += hoursBefore;
        } else {
          totalHoursB += hoursAfter;
          totalHoursA += hoursBefore;
        }
      } else {
        if (parent === 'PARENT_A') totalHoursA += 24;
        else totalHoursB += 24;
      }
    }

    // Push last block
    if (currentBlockParent === 'PARENT_A') {
      blocksA.push(currentBlockLength);
    } else if (currentBlockParent === 'PARENT_B') {
      blocksB.push(currentBlockLength);
    }

    const totalNights = nightsA + nightsB;
    const nightsPercentA = totalNights > 0 ? Math.round((nightsA / totalNights) * 1000) / 10 : 50;
    const nightsPercentB = totalNights > 0 ? Math.round((nightsB / totalNights) * 1000) / 10 : 50;

    const weeksCount = Math.max(1, totalDays / 7);
    const handoversPerWeek = Math.round((totalHandovers / weeksCount) * 10) / 10;

    const blocksCountA = blocksA.length;
    const blocksCountB = blocksB.length;
    const avgBlockLengthDaysA =
      blocksCountA > 0 ? Math.round((blocksA.reduce((a, b) => a + b, 0) / blocksCountA) * 10) / 10 : 0;
    const avgBlockLengthDaysB =
      blocksCountB > 0 ? Math.round((blocksB.reduce((a, b) => a + b, 0) / blocksCountB) * 10) / 10 : 0;

    const maxBlockLengthDaysA = blocksA.length > 0 ? Math.max(...blocksA) : 0;
    const maxBlockLengthDaysB = blocksB.length > 0 ? Math.max(...blocksB) : 0;

    // Max separation from Parent A is max block of Parent B, and vice versa
    const maxSeparationDaysA = maxBlockLengthDaysB;
    const maxSeparationDaysB = maxBlockLengthDaysA;

    // Time estimate evaluation (Principle 15: Noc != Čas)
    let estimatedTimePercentA: number | null = null;
    let estimatedTimePercentB: number | null = null;
    let timeEstimateCalculable = false;
    let timeEstimateNote = 'Podíl času nelze přesně určit z dostupných údajů.';

    const totalCalculatedHours = totalHoursA + totalHoursB;
    const expectedTotalHours = totalDays * 24;

    if (totalCalculatedHours > 0) {
      timeEstimateCalculable = true;
      estimatedTimePercentA = Math.round((totalHoursA / expectedTotalHours) * 1000) / 10;
      estimatedTimePercentB = Math.round((totalHoursB / expectedTotalHours) * 1000) / 10;
      
      if (totalHandovers > 0 && hasExplicitHandoverTimes) {
        timeEstimateNote = `Vypočteno na základě ${totalHandovers} zaznamenaných časů předávání.`;
      } else if (daysA === totalDays) {
        timeEstimateNote = 'Výhradní péče rodiče A (100% času).';
      } else if (daysB === totalDays) {
        timeEstimateNote = 'Výhradní péče rodiče B (100% času).';
      } else {
        timeEstimateNote = 'Vypočteno z celodenních bloků péče (výchozí čas předání).';
      }
    }

    return {
      totalDays,
      daysA,
      daysB,
      totalNights,
      nightsA,
      nightsB,
      nightsPercentA,
      nightsPercentB,
      estimatedTimePercentA,
      estimatedTimePercentB,
      timeEstimateCalculable,
      timeEstimateNote,
      totalHandovers,
      handoversPerWeek,
      totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
      totalTravelMinutes,
      blocksCountA,
      blocksCountB,
      avgBlockLengthDaysA,
      avgBlockLengthDaysB,
      maxBlockLengthDaysA,
      maxBlockLengthDaysB,
      maxSeparationDaysA,
      maxSeparationDaysB,
      schoolHandoversCount,
      weekendDaysA,
      weekendDaysB,
    };
  }

  /**
   * Sibling analysis for multiple children: calculates shared days vs separated days
   */
  public static analyzeSiblingSchedules(childSchedules: { childId: string; childName: string; days: CareDay[] }[]): {
    jointDaysCount: number;
    separatedDaysCount: number;
    jointDaysPercentage: number;
    separatedDates: string[];
    notes: string;
  } {
    if (!childSchedules || childSchedules.length < 2) {
      return {
        jointDaysCount: childSchedules[0]?.days.length || 0,
        separatedDaysCount: 0,
        jointDaysPercentage: 100,
        separatedDates: [],
        notes: 'Plán eviduje jedno dítě nebo nejsou k dispozici srovnávací data.',
      };
    }

    const dateMap = new Map<string, string[]>(); // date -> [parentChild1, parentChild2, ...]

    for (const schedule of childSchedules) {
      for (const day of schedule.days) {
        if (!dateMap.has(day.date)) {
          dateMap.set(day.date, []);
        }
        dateMap.get(day.date)!.push(day.assignedParent);
      }
    }

    let jointDaysCount = 0;
    let separatedDaysCount = 0;
    const separatedDates: string[] = [];

    dateMap.forEach((parents, dateStr) => {
      const allSame = parents.every(p => p === parents[0]);
      if (allSame && parents.length === childSchedules.length) {
        jointDaysCount++;
      } else {
        separatedDaysCount++;
        separatedDates.push(dateStr);
      }
    });

    const totalCompared = jointDaysCount + separatedDaysCount;
    const jointDaysPercentage = totalCompared > 0 ? Math.round((jointDaysCount / totalCompared) * 1000) / 10 : 100;

    const notes =
      separatedDaysCount === 0
        ? 'Všechny děti jsou ve všech dnech u stejného rodiče (100% společný režim).'
        : `Děti mají oddělený režim v ${separatedDaysCount} ${separatedDaysCount === 1 ? 'dni' : separatedDaysCount < 5 ? 'dnech' : 'dnech'} (${100 - jointDaysPercentage}% období).`;

    return {
      jointDaysCount,
      separatedDaysCount,
      jointDaysPercentage,
      separatedDates,
      notes,
    };
  }
}
