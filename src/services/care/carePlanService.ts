import { prisma, isPrismaAvailable } from '../../db/prisma';
import { AuditService } from '../auditService';
import {
  CarePlan,
  CarePlanStatus,
  CarePlanType,
  CarePlanSource,
  CareDay,
  CareLocation,
  CareHolidayRule,
  CareSimulationVariant,
  CareSimulationComparison,
  User,
  CareMetrics,
} from '../../types';
import { CareMetricsEngine } from './careMetricsEngine';
import { GeoRoutingService } from './geoRoutingService';

export interface GenerateDaysOptions {
  startDate: string; // YYYY-MM-DD
  daysCount?: number; // default 28 or 90
  rotationPattern: '7/7' | '2-2-3' | '3-4-4-3' | 'ALTERNATING_WEEKENDS' | 'EXTENDED_WEEKENDS' | 'CUSTOM' | string;
  startParent?: 'PARENT_A' | 'PARENT_B';
  defaultHandoverTime?: string;
  handoverDistanceKm?: number;
  handoverDurationMin?: number;
  holidayRules?: CareHolidayRule[];
}

export class CarePlanService {
  /**
   * Helper to ensure database is available; fail-closed with 503-compatible error
   */
  private static checkDatabaseAvailable(): void {
    if (!isPrismaAvailable()) {
      throw new Error('DATABASE_UNAVAILABLE: Databázový server PostgreSQL není momentálně dostupný.');
    }
  }

  /**
   * Validates server-side schema for CarePlan input
   */
  public static validatePlanInput(data: Partial<CarePlan>): void {
    if (data.title !== undefined) {
      if (typeof data.title !== 'string' || data.title.trim().length === 0) {
        throw new Error('Název plánu péče nesmí být prázdný.');
      }
      if (data.title.length > 255) {
        throw new Error('Název plánu péče nesmí překročit 255 znaků.');
      }
    }

    if (data.startDate) {
      const parsed = new Date(data.startDate);
      if (isNaN(parsed.getTime())) {
        throw new Error('Datum začátku plánu má neplatný formát.');
      }
    }

    if (data.endDate) {
      const parsedEnd = new Date(data.endDate);
      if (isNaN(parsedEnd.getTime())) {
        throw new Error('Datum konce plánu má neplatný formát.');
      }
      if (data.startDate && parsedEnd < new Date(data.startDate)) {
        throw new Error('Datum konce plánu nemůže předcházet datu začátku.');
      }
    }

    if (data.defaultHandoverTime) {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(data.defaultHandoverTime)) {
        throw new Error('Čas předání musí mít validní formát HH:mm (např. 16:00).');
      }
    }

    if (data.parentALat !== undefined && data.parentALat !== null) {
      if (typeof data.parentALat !== 'number' || isNaN(data.parentALat) || data.parentALat < -90 || data.parentALat > 90) {
        throw new Error('Zeměpisná šířka (latitude) rodiče A musí být v rozsahu -90 až +90.');
      }
    }

    if (data.parentALng !== undefined && data.parentALng !== null) {
      if (typeof data.parentALng !== 'number' || isNaN(data.parentALng) || data.parentALng < -180 || data.parentALng > 180) {
        throw new Error('Zeměpisná délka (longitude) rodiče A musí být v rozsahu -180 až +180.');
      }
    }

    if (data.parentBLat !== undefined && data.parentBLat !== null) {
      if (typeof data.parentBLat !== 'number' || isNaN(data.parentBLat) || data.parentBLat < -90 || data.parentBLat > 90) {
        throw new Error('Zeměpisná šířka (latitude) rodiče B musí být v rozsahu -90 až +90.');
      }
    }

    if (data.parentBLng !== undefined && data.parentBLng !== null) {
      if (typeof data.parentBLng !== 'number' || isNaN(data.parentBLng) || data.parentBLng < -180 || data.parentBLng > 180) {
        throw new Error('Zeměpisná délka (longitude) rodiče B musí být v rozsahu -180 až +180.');
      }
    }

    if (data.rotationIntervalDays !== undefined) {
      if (typeof data.rotationIntervalDays !== 'number' || isNaN(data.rotationIntervalDays) || data.rotationIntervalDays < 1) {
        throw new Error('Délka rotačního intervalu musí být kladné celé číslo.');
      }
    }

    if (data.days && Array.isArray(data.days)) {
      for (const day of data.days) {
        if (day.travelDistanceKm !== undefined && day.travelDistanceKm !== null) {
          if (typeof day.travelDistanceKm !== 'number' || isNaN(day.travelDistanceKm) || !isFinite(day.travelDistanceKm) || day.travelDistanceKm < 0) {
            throw new Error('Vzdálenost předání (travelDistanceKm) musí být nezáporné číslo.');
          }
        }
        if (day.travelDurationMin !== undefined && day.travelDurationMin !== null) {
          if (typeof day.travelDurationMin !== 'number' || isNaN(day.travelDurationMin) || !isFinite(day.travelDurationMin) || day.travelDurationMin < 0) {
            throw new Error('Doba cesty (travelDurationMin) musí být nezáporné číslo.');
          }
        }
      }
    }

    if (data.locations && Array.isArray(data.locations)) {
      for (const loc of data.locations) {
        if (loc.latitude !== undefined && loc.latitude !== null) {
          if (typeof loc.latitude !== 'number' || isNaN(loc.latitude) || loc.latitude < -90 || loc.latitude > 90) {
            throw new Error('Zeměpisná šířka místa předání musí být v rozsahu -90 až +90.');
          }
        }
        if (loc.longitude !== undefined && loc.longitude !== null) {
          if (typeof loc.longitude !== 'number' || isNaN(loc.longitude) || loc.longitude < -180 || loc.longitude > 180) {
            throw new Error('Zeměpisná délka místa předání musí být v rozsahu -180 až +180.');
          }
        }
      }
    }
  }

  /**
   * Defense-in-depth: Verifies all children belong to the target Case
   */
  public static async validateChildCaseOwnership(caseId: string, childIds: string[]): Promise<void> {
    if (!childIds || childIds.length === 0) return;
    this.checkDatabaseAvailable();

    const children = await prisma!.child.findMany({
      where: {
        id: { in: childIds },
        caseId,
      },
      select: { id: true },
    });

    if (children.length !== childIds.length) {
      throw new Error('Přístup odepřen: Jedno nebo více vybraných dětí nepatří k tomuto případu.');
    }
  }

  /**
   * Generates day sequence from standard rotating care patterns
   */
  public static generateDaysSequence(options: GenerateDaysOptions): CareDay[] {
    const daysCount = options.daysCount || 28;
    const startDate = new Date(options.startDate);
    const startParent = options.startParent || 'PARENT_A';
    const otherParent = startParent === 'PARENT_A' ? 'PARENT_B' : 'PARENT_A';
    const defaultTime = options.defaultHandoverTime || '16:00';
    const distKm = options.handoverDistanceKm || 0;
    const durMin = options.handoverDurationMin || 0;

    const pattern = options.rotationPattern || '7/7';
    const days: CareDay[] = [];

    // Define pattern lengths
    let patternSequence: ('PARENT_A' | 'PARENT_B')[] = [];

    if (pattern === '7/7') {
      // 7 days A, 7 days B
      for (let i = 0; i < 7; i++) patternSequence.push(startParent);
      for (let i = 0; i < 7; i++) patternSequence.push(otherParent);
    } else if (pattern === '2-2-3') {
      // 2 days A, 2 days B, 3 days A, 2 days B, 2 days A, 3 days B (14 day cycle)
      patternSequence = [
        startParent, startParent,
        otherParent, otherParent,
        startParent, startParent, startParent,
        otherParent, otherParent,
        startParent, startParent,
        otherParent, otherParent, otherParent,
      ];
    } else if (pattern === '3-4-4-3') {
      // 3 days A, 4 days B, 4 days A, 3 days B (14 day cycle)
      patternSequence = [
        startParent, startParent, startParent,
        otherParent, otherParent, otherParent, otherParent,
        startParent, startParent, startParent, startParent,
        otherParent, otherParent, otherParent,
      ];
    } else if (pattern === 'ALTERNATING_WEEKENDS') {
      // Mon-Thu Always Primary (startParent), Fri-Sun Alternating (14 day cycle)
      patternSequence = [
        startParent, startParent, startParent, startParent, // Mon-Thu A
        otherParent, otherParent, otherParent,             // Fri-Sun B
        startParent, startParent, startParent, startParent, // Mon-Thu A
        startParent, startParent, startParent,             // Fri-Sun A
      ];
    } else if (pattern === 'EXTENDED_WEEKENDS') {
      // Extended weekend: Thu 16:00 - Mon 08:00 every 2nd week (14 day cycle)
      patternSequence = [
        startParent, startParent, startParent,             // Mon-Wed A
        otherParent, otherParent, otherParent, otherParent, // Thu-Sun B
        startParent, startParent, startParent, startParent, // Mon-Thu A
        startParent, startParent, startParent,             // Fri-Sun A
      ];
    } else {
      // Default 7/7
      for (let i = 0; i < 7; i++) patternSequence.push(startParent);
      for (let i = 0; i < 7; i++) patternSequence.push(otherParent);
    }

    const cycleLen = patternSequence.length;

    for (let i = 0; i < daysCount; i++) {
      const curDate = new Date(startDate);
      curDate.setDate(startDate.getDate() + i);

      const dateIso = curDate.toISOString().split('T')[0];
      const dayOfWeek = curDate.getDay(); // 0 = Sunday, 1 = Monday, ...

      const parentIndex = i % cycleLen;
      const assignedParent = patternSequence[parentIndex];
      const prevParent = i > 0 ? patternSequence[(i - 1) % cycleLen] : assignedParent;

      // Initial handover check
      const isHandover = i > 0 && assignedParent !== prevParent;

      days.push({
        date: dateIso,
        dayOfWeek,
        assignedParent,
        isOvernight: true,
        overnightParent: assignedParent,
        isHandover,
        handoverTime: isHandover ? defaultTime : undefined,
        travelDistanceKm: isHandover ? distKm : 0,
        travelDurationMin: isHandover ? durMin : 0,
        isHoliday: false,
      });
    }

    // Apply holiday rules if provided and recompute handovers
    if (options.holidayRules && options.holidayRules.length > 0) {
      this.applyHolidayRulesToDays(days, options.holidayRules, defaultTime, distKm, durMin);
    }

    return days;
  }

  /**
   * Applies holiday rules to modify standard rotating days and guarantees handover consistency
   */
  public static applyHolidayRulesToDays(
    days: CareDay[],
    holidayRules: CareHolidayRule[],
    defaultHandoverTime = '16:00',
    distKm = 0,
    durMin = 0
  ): void {
    if (!days || days.length === 0 || !holidayRules || holidayRules.length === 0) return;

    for (const rule of holidayRules) {
      if (!rule.startDate || !rule.endDate) continue;

      const ruleStart = new Date(rule.startDate).toISOString().split('T')[0];
      const ruleEnd = new Date(rule.endDate).toISOString().split('T')[0];

      for (let i = 0; i < days.length; i++) {
        const d = days[i];
        if (d.date >= ruleStart && d.date <= ruleEnd) {
          d.isHoliday = true;
          d.holidayName = rule.name;

          const dayYear = new Date(d.date).getFullYear();
          const isEvenYear = dayYear % 2 === 0;

          let designatedParent: 'PARENT_A' | 'PARENT_B' =
            rule.allocationModel === 'ALWAYS_PARENT_A' ? 'PARENT_A' : 'PARENT_B';

          if (rule.allocationModel === 'ALTERNATING_YEARS') {
            designatedParent = isEvenYear
              ? (rule.evenYearParent as any) || 'PARENT_A'
              : (rule.oddYearParent as any) || 'PARENT_B';
          } else if (rule.allocationModel === 'SPLIT_HALF') {
            const totalHolidayDays =
              Math.ceil((new Date(ruleEnd).getTime() - new Date(ruleStart).getTime()) / (1000 * 60 * 60 * 24)) + 1;
            const currentDayIndex =
              Math.floor((new Date(d.date).getTime() - new Date(ruleStart).getTime()) / (1000 * 60 * 60 * 24));
            const isFirstHalf = currentDayIndex < totalHolidayDays / 2;
            designatedParent = isFirstHalf ? 'PARENT_A' : 'PARENT_B';
          }

          d.assignedParent = designatedParent;
          d.overnightParent = designatedParent;
        }
      }
    }

    // CRITICAL: Recompute handovers between adjacent days to guarantee 100% consistency
    for (let i = 0; i < days.length; i++) {
      const cur = days[i];
      const prev = i > 0 ? days[i - 1] : null;

      if (prev && cur.assignedParent !== prev.assignedParent) {
        cur.isHandover = true;
        cur.handoverTime = cur.handoverTime || defaultHandoverTime;
        cur.travelDistanceKm = cur.travelDistanceKm || distKm;
        cur.travelDurationMin = cur.travelDurationMin || durMin;
      } else if (prev && cur.assignedParent === prev.assignedParent) {
        cur.isHandover = false;
        cur.handoverTime = undefined;
        cur.travelDistanceKm = 0;
        cur.travelDurationMin = 0;
      }
    }
  }

  /**
   * Get all care plans for a case
   */
  public static async getPlansForCase(caseId: string, user: User): Promise<CarePlan[]> {
    this.checkDatabaseAvailable();

    const plans = await prisma!.carePlan.findMany({
      where: { caseId },
      include: {
        children: {
          include: {
            child: true,
          },
        },
        locations: true,
        holidayRules: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return plans.map(p => {
      let metrics: CareMetrics | undefined;
      if (p.metricsJson) {
        try {
          metrics = JSON.parse(p.metricsJson);
        } catch {
          // ignore
        }
      }
      return {
        ...p,
        startDate: p.startDate ? p.startDate.toISOString().split('T')[0] : undefined,
        endDate: p.endDate ? p.endDate.toISOString().split('T')[0] : undefined,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        metrics,
        children: p.children.map(c => ({
          childId: c.childId,
          child: c.child
            ? {
                id: c.child.id,
                caseId: c.child.caseId,
                firstName: c.child.firstName,
                lastName: c.child.lastName,
                dateOfBirth: c.child.dateOfBirth || undefined,
                schoolName: c.child.schoolName || undefined,
                pediatrician: c.child.pediatrician || undefined,
                notes: c.child.notes || undefined,
                createdAt: c.child.createdAt.toISOString(),
                updatedAt: c.child.updatedAt.toISOString(),
              }
            : undefined,
        })),
        locations: p.locations.map(l => ({
          id: l.id,
          carePlanId: l.carePlanId,
          name: l.name,
          address: l.address || undefined,
          latitude: l.latitude || undefined,
          longitude: l.longitude || undefined,
          type: l.type as any,
          notes: l.notes || undefined,
        })),
        holidayRules: p.holidayRules.map(h => ({
          id: h.id,
          carePlanId: h.carePlanId,
          holidayType: h.holidayType,
          name: h.name,
          startDate: h.startDate ? h.startDate.toISOString().split('T')[0] : undefined,
          endDate: h.endDate ? h.endDate.toISOString().split('T')[0] : undefined,
          allocationModel: h.allocationModel as any,
          evenYearParent: (h.evenYearParent as any) || undefined,
          oddYearParent: (h.oddYearParent as any) || undefined,
          notes: h.notes || undefined,
        })),
      };
    });
  }

  /**
   * Get care plan by ID with full days and calculations
   */
  public static async getPlanById(planId: string, caseId: string): Promise<CarePlan | null> {
    this.checkDatabaseAvailable();

    const p = await prisma!.carePlan.findUnique({
      where: { id: planId },
      include: {
        children: {
          include: {
            child: true,
          },
        },
        locations: true,
        days: {
          orderBy: { date: 'asc' },
          include: {
            handoverLocation: true,
          },
        },
        holidayRules: true,
      },
    });

    if (!p || p.caseId !== caseId) return null;

    const days: CareDay[] = p.days.map(d => ({
      id: d.id,
      carePlanId: d.carePlanId,
      date: d.date.toISOString().split('T')[0],
      dayOfWeek: d.dayOfWeek,
      assignedParent: d.assignedParent as any,
      isOvernight: d.isOvernight,
      overnightParent: (d.overnightParent as any) || d.assignedParent,
      schoolParent: d.schoolParent || undefined,
      isHandover: d.isHandover,
      handoverTime: d.handoverTime || undefined,
      handoverLocationId: d.handoverLocationId || undefined,
      travelDistanceKm: d.travelDistanceKm || 0,
      travelDurationMin: d.travelDurationMin || 0,
      isHoliday: d.isHoliday,
      holidayName: d.holidayName || undefined,
      notes: d.notes || undefined,
    }));

    const metrics = CareMetricsEngine.calculateMetrics(days);

    return {
      ...p,
      startDate: p.startDate ? p.startDate.toISOString().split('T')[0] : undefined,
      endDate: p.endDate ? p.endDate.toISOString().split('T')[0] : undefined,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      metrics,
      days,
      children: p.children.map(c => ({
        childId: c.childId,
        child: c.child
          ? {
              id: c.child.id,
              caseId: c.child.caseId,
              firstName: c.child.firstName,
              lastName: c.child.lastName,
              dateOfBirth: c.child.dateOfBirth || undefined,
              schoolName: c.child.schoolName || undefined,
              pediatrician: c.child.pediatrician || undefined,
              notes: c.child.notes || undefined,
              createdAt: c.child.createdAt.toISOString(),
              updatedAt: c.child.updatedAt.toISOString(),
            }
          : undefined,
      })),
      locations: p.locations.map(l => ({
        id: l.id,
        carePlanId: l.carePlanId,
        name: l.name,
        address: l.address || undefined,
        latitude: l.latitude || undefined,
        longitude: l.longitude || undefined,
        type: l.type as any,
        notes: l.notes || undefined,
      })),
      holidayRules: p.holidayRules.map(h => ({
        id: h.id,
        carePlanId: h.carePlanId,
        holidayType: h.holidayType,
        name: h.name,
        startDate: h.startDate ? h.startDate.toISOString().split('T')[0] : undefined,
        endDate: h.endDate ? h.endDate.toISOString().split('T')[0] : undefined,
        allocationModel: h.allocationModel as any,
        evenYearParent: (h.evenYearParent as any) || undefined,
        oddYearParent: (h.oddYearParent as any) || undefined,
        notes: h.notes || undefined,
      })),
    };
  }

  /**
   * Create a new CarePlan with generated days and metrics in an atomic transaction
   */
  public static async createPlan(caseId: string, data: Partial<CarePlan>, user: User): Promise<CarePlan> {
    this.checkDatabaseAvailable();
    this.validatePlanInput(data);

    // Validate child case ownership
    const requestedChildIds = (data.children || []).map(c => c.childId).filter(Boolean);
    if (requestedChildIds.length > 0) {
      await this.validateChildCaseOwnership(caseId, requestedChildIds);
    }

    const title = data.title || 'Nový návrh péče';
    const status: CarePlanStatus = (data.status as CarePlanStatus) || 'DRAFT';
    const source: CarePlanSource = (data.source as CarePlanSource) || 'MANUAL';
    const rawType = data.type;
    const type: CarePlanType = (rawType === 'CURRENT' || rawType === 'PROPOSED' || rawType === 'SIMULATION') ? rawType : 'PROPOSED';
    const pattern = data.rotationPattern || '7/7';
    const startDateStr = data.startDate || new Date().toISOString().split('T')[0];

    // Distance calculation if addresses provided
    let distKm = 0;
    let durMin = 0;
    let parentALat = data.parentALat;
    let parentALng = data.parentALng;
    let parentBLat = data.parentBLat;
    let parentBLng = data.parentBLng;

    if (data.parentAAddress && (!parentALat || !parentALng)) {
      const geoA = await GeoRoutingService.geocodeAddress(data.parentAAddress);
      if (geoA) {
        parentALat = geoA.latitude;
        parentALng = geoA.longitude;
      }
    }

    if (data.parentBAddress && (!parentBLat || !parentBLng)) {
      const geoB = await GeoRoutingService.geocodeAddress(data.parentBAddress);
      if (geoB) {
        parentBLat = geoB.latitude;
        parentBLng = geoB.longitude;
      }
    }

    if (parentALat && parentALng && parentBLat && parentBLng) {
      const route = await GeoRoutingService.calculateRoute(
        { lat: parentALat, lng: parentALng },
        { lat: parentBLat, lng: parentBLng }
      );
      distKm = route.distanceKm;
      durMin = route.durationMinutes;
    }

    // Generate days
    const generatedDays =
      data.days && data.days.length > 0
        ? data.days
        : this.generateDaysSequence({
            startDate: startDateStr,
            daysCount: 28,
            rotationPattern: pattern,
            defaultHandoverTime: data.defaultHandoverTime || '16:00',
            handoverDistanceKm: distKm,
            handoverDurationMin: durMin,
            holidayRules: data.holidayRules,
          });

    const metrics = CareMetricsEngine.calculateMetrics(generatedDays);

    const created = await prisma!.$transaction(async tx => {
      // If plan is created as ACTIVE, deactivate any other active plan for this case
      if (status === 'ACTIVE') {
        await tx.carePlan.updateMany({
          where: { caseId, status: 'ACTIVE' },
          data: { status: 'DRAFT' },
        });
      }

      const planType: CarePlanType = status === 'ACTIVE' ? 'CURRENT' : (type as CarePlanType);

      return await tx.carePlan.create({
        data: {
          caseId,
          title,
          description: data.description,
          status: status as CarePlanStatus,
          type: planType,
          source: source as CarePlanSource,
          startDate: new Date(startDateStr),
          endDate: data.endDate ? new Date(data.endDate) : undefined,
          rotationPattern: pattern,
          rotationIntervalDays: pattern === '7/7' ? 7 : pattern === '2-2-3' || pattern === '3-4-4-3' ? 14 : 7,
          createdBy: user.name || user.email,
          parentAName: data.parentAName || 'Otec',
          parentBName: data.parentBName || 'Matka',
          parentAAddress: data.parentAAddress,
          parentBAddress: data.parentBAddress,
          parentALat,
          parentALng,
          parentBLat,
          parentBLng,
          parentAPreferences: data.parentAPreferences,
          parentBPreferences: data.parentBPreferences,
          defaultHandoverTime: data.defaultHandoverTime || '16:00',
          metricsJson: JSON.stringify(metrics),
          notes: data.notes,
          children:
            requestedChildIds.length > 0
              ? {
                  create: requestedChildIds.map(childId => ({
                    childId,
                  })),
                }
              : undefined,
          locations:
            data.locations && data.locations.length > 0
              ? {
                  create: data.locations.map(l => ({
                    name: l.name,
                    address: l.address,
                    latitude: l.latitude,
                    longitude: l.longitude,
                    type: (l.type as any) || 'NEUTRAL',
                    notes: l.notes,
                  })),
                }
              : undefined,
          holidayRules:
            data.holidayRules && data.holidayRules.length > 0
              ? {
                  create: data.holidayRules.map(h => ({
                    holidayType: h.holidayType,
                    name: h.name,
                    startDate: h.startDate ? new Date(h.startDate) : undefined,
                    endDate: h.endDate ? new Date(h.endDate) : undefined,
                    allocationModel: h.allocationModel || 'ALTERNATING_YEARS',
                    evenYearParent: h.evenYearParent || 'PARENT_A',
                    oddYearParent: h.oddYearParent || 'PARENT_B',
                    notes: h.notes,
                  })),
                }
              : undefined,
          days: {
            create: generatedDays.map(d => ({
              date: new Date(d.date),
              dayOfWeek: d.dayOfWeek,
              assignedParent: d.assignedParent,
              isOvernight: d.isOvernight,
              overnightParent: d.overnightParent || d.assignedParent,
              schoolParent: d.schoolParent,
              isHandover: d.isHandover,
              handoverTime: d.handoverTime,
              travelDistanceKm: d.travelDistanceKm || 0,
              travelDurationMin: d.travelDurationMin || 0,
              isHoliday: d.isHoliday || false,
              holidayName: d.holidayName,
              notes: d.notes,
            })),
          },
        },
      });
    });

    await AuditService.recordLog(
      'CARE_PLAN_CREATED',
      'CARE_HUB',
      `Vytvořen plán péče '${created.title}' (typ: ${created.type}, režim: ${created.rotationPattern}) pro spis ${caseId}`,
      user
    );

    const fullPlan = await this.getPlanById(created.id, caseId);
    if (!fullPlan) throw new Error('Nepodařilo se načíst nově vytvořený plán.');
    return fullPlan;
  }

  /**
   * Update plan details or override specific days in an atomic transaction
   */
  public static async updatePlan(
    planId: string,
    caseId: string,
    data: Partial<CarePlan>,
    user: User
  ): Promise<CarePlan> {
    this.checkDatabaseAvailable();
    this.validatePlanInput(data);

    const existing = await prisma!.carePlan.findUnique({
      where: { id: planId },
    });
    if (!existing || existing.caseId !== caseId) {
      throw new Error('Plán péče nebyl nalezen.');
    }

    // Validate child ownership if children array is supplied
    if (data.children) {
      const requestedChildIds = data.children.map(c => c.childId).filter(Boolean);
      await this.validateChildCaseOwnership(caseId, requestedChildIds);
    }

    // Atomic transaction for all plan and day updates
    await prisma!.$transaction(async tx => {
      // Re-calculate metrics if days were provided
      let metricsJson = data.metricsJson;
      if (data.days && data.days.length > 0) {
        const metrics = CareMetricsEngine.calculateMetrics(data.days);
        metricsJson = JSON.stringify(metrics);

        // Replace days in transaction
        await tx.careDay.deleteMany({ where: { carePlanId: planId } });
        await tx.careDay.createMany({
          data: data.days.map(d => ({
            carePlanId: planId,
            date: new Date(d.date),
            dayOfWeek: d.dayOfWeek,
            assignedParent: d.assignedParent,
            isOvernight: d.isOvernight,
            overnightParent: d.overnightParent || d.assignedParent,
            schoolParent: d.schoolParent,
            isHandover: d.isHandover,
            handoverTime: d.handoverTime,
            travelDistanceKm: d.travelDistanceKm || 0,
            travelDurationMin: d.travelDurationMin || 0,
            isHoliday: d.isHoliday || false,
            holidayName: d.holidayName,
            notes: d.notes,
          })),
        });
      }

      // Update children relations if provided
      if (data.children) {
        await tx.carePlanChild.deleteMany({ where: { carePlanId: planId } });
        if (data.children.length > 0) {
          await tx.carePlanChild.createMany({
            data: data.children.map(c => ({
              carePlanId: planId,
              childId: c.childId,
            })),
          });
        }
      }

      // Update locations if provided
      if (data.locations) {
        await tx.careLocation.deleteMany({ where: { carePlanId: planId } });
        if (data.locations.length > 0) {
          await tx.careLocation.createMany({
            data: data.locations.map(l => ({
              carePlanId: planId,
              name: l.name,
              address: l.address,
              latitude: l.latitude,
              longitude: l.longitude,
              type: (l.type as any) || 'NEUTRAL',
              notes: l.notes,
            })),
          });
        }
      }

      const sanitizedStatus = data.status && ['DRAFT', 'ACTIVE', 'ARCHIVED', 'PROPOSED'].includes(data.status) ? (data.status as CarePlanStatus) : undefined;
      const sanitizedType = data.type && ['CURRENT', 'PROPOSED', 'SIMULATION'].includes(data.type) ? (data.type as CarePlanType) : undefined;

      // Update plan entity
      await tx.carePlan.update({
        where: { id: planId },
        data: {
          title: data.title,
          description: data.description,
          status: sanitizedStatus,
          type: sanitizedType,
          rotationPattern: data.rotationPattern,
          parentAName: data.parentAName,
          parentBName: data.parentBName,
          parentAAddress: data.parentAAddress,
          parentBAddress: data.parentBAddress,
          parentALat: data.parentALat,
          parentALng: data.parentALng,
          parentBLat: data.parentBLat,
          parentBLng: data.parentBLng,
          parentAPreferences: data.parentAPreferences,
          parentBPreferences: data.parentBPreferences,
          defaultHandoverTime: data.defaultHandoverTime,
          metricsJson,
          notes: data.notes,
          isSharedWithCoParent: data.isSharedWithCoParent,
          version: { increment: 1 },
        },
      });
    });

    await AuditService.recordLog(
      'CARE_PLAN_UPDATED',
      'CARE_HUB',
      `Upraven plán péče ${planId} pro spis ${caseId}`,
      user
    );

    const updated = await this.getPlanById(planId, caseId);
    if (!updated) throw new Error('Nepodařilo se načíst upravený plán.');
    return updated;
  }

  /**
   * Delete plan safely
   */
  public static async deletePlan(planId: string, caseId: string, user: User): Promise<boolean> {
    this.checkDatabaseAvailable();

    const existing = await prisma!.carePlan.findUnique({
      where: { id: planId },
    });
    if (!existing || existing.caseId !== caseId) {
      throw new Error('Plán péče nebyl nalezen.');
    }

    await prisma!.carePlan.delete({
      where: { id: planId },
    });

    await AuditService.recordLog(
      'CARE_PLAN_DELETED',
      'CARE_HUB',
      `Smazán plán péče '${existing.title}' (${planId}) pro spis ${caseId}`,
      user
    );

    return true;
  }

  /**
   * Simulation execution without immediate persistence
   */
  public static simulate(options: GenerateDaysOptions & { parentAAddress?: string; parentBAddress?: string }): {
    pattern: string;
    days: CareDay[];
    metrics: CareMetrics;
  } {
    const days = this.generateDaysSequence(options);
    const metrics = CareMetricsEngine.calculateMetrics(days);
    return {
      pattern: options.rotationPattern,
      days,
      metrics,
    };
  }

  /**
   * Multi-variant comparison generator
   */
  public static compareVariants(
    patterns: string[],
    options: Omit<GenerateDaysOptions, 'rotationPattern'>
  ): CareSimulationVariant[] {
    const variants: CareSimulationVariant[] = [];

    const defaultNames: Record<string, string> = {
      '7/7': 'Týdenní střídání (7/7)',
      '2-2-3': 'Rovnoměrné střídání (2-2-3)',
      '3-4-4-3': 'Stabilní bloky (3-4-4-3)',
      'ALTERNATING_WEEKENDS': 'Každý druhý víkend',
      'EXTENDED_WEEKENDS': 'Rozšířený víkend (Čt-Po)',
      'CUSTOM': 'Individuální režim',
    };

    for (const pattern of patterns) {
      const days = this.generateDaysSequence({
        ...options,
        rotationPattern: pattern,
      });
      const metrics = CareMetricsEngine.calculateMetrics(days);

      variants.push({
        id: `variant_${pattern}`,
        name: defaultNames[pattern] || pattern,
        pattern,
        metrics,
        plan: {
          id: `sim_${pattern}`,
          caseId: '',
          title: defaultNames[pattern] || pattern,
          status: 'DRAFT',
          type: 'SIMULATION',
          source: 'SIMULATION_TEMPLATE',
          rotationPattern: pattern,
          rotationIntervalDays: pattern === '7/7' ? 7 : 14,
          version: 1,
          isSharedWithCoParent: false,
          days,
          metrics,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    }

    return variants;
  }

  /**
   * Save Simulation Comparison to PostgreSQL database
   */
  public static async saveSimulationComparison(
    caseId: string,
    title: string,
    variants: CareSimulationVariant[],
    notes?: string,
    user?: User
  ): Promise<CareSimulationComparison> {
    this.checkDatabaseAvailable();

    const created = await prisma!.careSimulationComparison.create({
      data: {
        caseId,
        title: title || 'Srovnání modelů péče',
        variantsJson: JSON.stringify(variants),
        notes: notes || undefined,
        createdBy: user?.name || user?.email || 'Uživatel',
      },
    });

    if (user) {
      await AuditService.recordLog(
        'CARE_PLAN_SIMULATION_SAVED',
        'CARE_HUB',
        `Uloženo srovnání modelů péče '${created.title}' (${created.id}) pro spis ${caseId}`,
        user
      );
    }

    return {
      id: created.id,
      caseId: created.caseId,
      title: created.title,
      variantsJson: created.variantsJson,
      notes: created.notes || undefined,
      createdBy: created.createdBy || undefined,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  /**
   * Get all saved simulation comparisons for a case
   */
  public static async getSimulationComparisons(caseId: string): Promise<CareSimulationComparison[]> {
    this.checkDatabaseAvailable();

    const found = await prisma!.careSimulationComparison.findMany({
      where: { caseId },
      orderBy: { createdAt: 'desc' },
    });

    return found.map(c => ({
      id: c.id,
      caseId: c.caseId,
      title: c.title,
      variantsJson: c.variantsJson,
      notes: c.notes || undefined,
      createdBy: c.createdBy || undefined,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));
  }

  /**
   * Delete a saved simulation comparison
   */
  public static async deleteSimulationComparison(
    comparisonId: string,
    caseId: string,
    user?: User
  ): Promise<boolean> {
    this.checkDatabaseAvailable();

    const existing = await prisma!.careSimulationComparison.findUnique({
      where: { id: comparisonId },
    });

    if (!existing || existing.caseId !== caseId) {
      throw new Error('Uložené srovnání nebylo nalezeno.');
    }

    await prisma!.careSimulationComparison.delete({
      where: { id: comparisonId },
    });

    if (user) {
      await AuditService.recordLog(
        'CARE_PLAN_COMPARISON_DELETED',
        'CARE_HUB',
        `Smazáno srovnání modelů péče '${existing.title}' (${comparisonId}) pro spis ${caseId}`,
        user
      );
    }

    return true;
  }

  /**
   * Controlled atomic sync from approved CarePlan to Case Calendar (CaseEvent)
   * 1. Authorize & validate
   * 2. Single transaction: deactivate previous, activate new, update Case, purge old CARE_PLAN events, insert new CaseEvents
   * 3. Record audit log
   * 4. Commit or full rollback on any failure
   */
  public static async syncPlanToCaseCalendar(
    planId: string,
    caseId: string,
    user: User
  ): Promise<{ syncedEventsCount: number }> {
    this.checkDatabaseAvailable();

    const plan = await this.getPlanById(planId, caseId);
    if (!plan) {
      throw new Error('Plán péče nebyl nalezen.');
    }
    if (!plan.days || plan.days.length === 0) {
      throw new Error('Plán nemá žádné definované dny k synchronizaci.');
    }

    const handoverDays = plan.days.filter(d => d.isHandover);

    // ATOMIC TRANSACTION
    const result = await prisma!.$transaction(async tx => {
      // 1. Deactivate other active plans for this case
      await tx.carePlan.updateMany({
        where: { caseId, status: 'ACTIVE' },
        data: { status: 'DRAFT' },
      });

      // 2. Mark this plan as ACTIVE and CURRENT
      await tx.carePlan.update({
        where: { id: planId },
        data: { status: 'ACTIVE', type: 'CURRENT' },
      });

      // 3. Update case currentCareType
      await tx.case.update({
        where: { id: caseId },
        data: { currentCareType: plan.rotationPattern || 'STRIDAVA' },
      });

      // 4. Delete previously generated care plan events for this case (NEVER touch MANUAL events!)
      await tx.caseEvent.deleteMany({
        where: {
          caseId,
          sourceType: 'CARE_PLAN',
        },
      });

      // 5. Create new CaseEvent entries for every handover day
      let count = 0;
      for (const hd of handoverDays) {
        const eventDate = new Date(`${hd.date}T${hd.handoverTime || '16:00'}:00`);
        const parentName = hd.assignedParent === 'PARENT_A' ? plan.parentAName || 'Otec' : plan.parentBName || 'Matka';

        await tx.caseEvent.create({
          data: {
            caseId,
            createdBy: user.name || user.email || 'Systém',
            title: `Předání dítěte: ${parentName}`,
            description: `Pravidelné předání dle plánu péče '${plan.title}'. Převzetí do péče: ${parentName}.${
              hd.travelDistanceKm ? ` Vzdálenost: ${hd.travelDistanceKm} km.` : ''
            }`,
            category: 'CHILD_HANDOVER',
            sourceType: 'CARE_PLAN',
            carePlanId: planId,
            careDayId: hd.id,
            eventDate,
            location: hd.handoverLocation?.name || hd.handoverLocation?.address || 'Místo předání dle dohody',
          },
        });
        count++;
      }

      return count;
    });

    // 6. Record audit log
    await AuditService.recordLog(
      'CARE_PLAN_CALENDAR_SYNC',
      'CARE_HUB',
      `Synchronizován plán péče '${plan.title}' (${planId}) do kalendáře spisu ${caseId}. Vytvořeno ${result} událostí předání.`,
      user
    );

    return { syncedEventsCount: result };
  }
}
