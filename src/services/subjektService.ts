import { EntityType } from '@prisma/client';
import { Subjekt, Review } from '../types';
import { prisma, isPrismaAvailable, getPrismaClient, markPrismaUnavailable } from '../db/prisma';
import { AresApiClient, AresVerifyResult } from './ares';
import { dbStore } from './dbStore';

export class SubjektService {
  /**
   * Najde soud podle jména (s podporou překlepů, diakritiky, velkých/malých písmen).
   * Slouží pro AiFormsView jako Single Source of Truth přes Registr.
   */
  async findCourtByFuzzyName(courtName: string) {
    if (!courtName || courtName.trim() === '') return null;

    // Fallback if DB is not available
    if (!isPrismaAvailable()) {
      const { findCourtByName } = await import('../data/soudyDataset');
      return findCourtByName(courtName);
    }

    const prismaClient = getPrismaClient();
    if (!prismaClient) return null;

    const normalizeString = (str: string) => {
      if (!str) return '';
      return str.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, ' ')
        .replace(/ - /g, '-')
        .trim();
    };

    const normalizedSearch = normalizeString(courtName);
    const searchTrimmed = courtName.toLowerCase().trim();

    // Načteme všechny soudy do paměti (je jich cca 108, bezpečné pro full-table scan a fuzzy match v JS)
    const allCourts = await prismaClient.subjekt.findMany({
      where: { type: 'SOUD', status: 'VERIFIED' }
    });

    let found = allCourts.find(s => s.name.toLowerCase().trim() === searchTrimmed);

    if (!found) {
      found = allCourts.find(s => normalizeString(s.name) === normalizedSearch);
    }

    if (!found && normalizedSearch.length > 4) {
      found = allCourts.find(s => normalizeString(s.name).includes(normalizedSearch) || normalizedSearch.includes(normalizeString(s.name)));
    }

    if (found) {
      return {
        id: found.id,
        name: found.name,
        address: found.address || '',
        city: found.city || '',
        region: found.region || ''
      };
    }
    return null;
  }

  /**
   * Get filtered subjekty with optional type, region, or search term
   */
  async getSubjekty(params?: { type?: string; region?: string; kraj?: string; city?: string; search?: string; minRating?: number; status?: string; createdById?: string }) {
    if (!isPrismaAvailable()) {
      let list = [...dbStore.subjekty];

      if (params?.status && params.status !== 'ALL') {
        list = list.filter(item => item.status === params.status);
      } else if (!params?.createdById && params?.status !== 'ALL') {
        list = list.filter(item => item.status === 'VERIFIED');
      }

      if (params?.createdById) {
        list = list.filter(item => (item as any).createdById === params.createdById);
      }

      if (params?.type && params.type !== 'ALL') {
        list = list.filter(item => item.type === params.type);
      }

      const targetRegion = params?.region || params?.kraj;
      if (targetRegion && targetRegion !== 'Všechny kraje' && targetRegion !== 'ALL') {
        const trTrim = targetRegion.trim().toLowerCase();
        list = list.filter(item => item.region?.toLowerCase().includes(trTrim));
      }

      if (params?.city) {
        const cityLower = params.city.toLowerCase();
        list = list.filter(item => item.city?.toLowerCase().includes(cityLower));
      }

      if (params?.minRating) {
        list = list.filter(item => (item.avgRating || 0) >= Number(params.minRating));
      }

      if (params?.search) {
        const searchLower = params.search.toLowerCase();
        list = list.filter(item => 
          item.name.toLowerCase().includes(searchLower) ||
          item.city?.toLowerCase().includes(searchLower) ||
          item.institution?.toLowerCase().includes(searchLower) ||
          item.position?.toLowerCase().includes(searchLower)
        );
      }

      list = list.map(item => {
        const memProfile = dbStore.subjectVerifiedProfiles.find(p => p.subjektId === item.id) || null;
        const pendingCount = dbStore.subjectInformationSources.filter(s => s.subjektId === item.id && s.status === 'PENDING_REVIEW').length;
        return {
          ...item,
          verifiedProfile: memProfile,
          pendingSourcesCount: pendingCount,
        };
      });

      list.sort((a, b) => {
        if ((b.avgRating || 0) !== (a.avgRating || 0)) {
          return (b.avgRating || 0) - (a.avgRating || 0);
        }
        if ((b.reviewCount || 0) !== (a.reviewCount || 0)) {
          return (b.reviewCount || 0) - (a.reviewCount || 0);
        }
        return a.name.localeCompare(b.name);
      });

      return list;
    }

    const whereClause: any = {};
    if (params?.status && params.status !== 'ALL') {
      whereClause.status = params.status;
    } else if (!params?.createdById && params?.status !== 'ALL') {
      whereClause.status = 'VERIFIED';
    }
    if (params?.createdById) {
      whereClause.createdById = params.createdById;
    }

    if (params?.type && params.type !== 'ALL') {
      whereClause.type = params.type as EntityType;
    }
    const targetRegion = params?.region || params?.kraj;
    if (targetRegion && targetRegion !== 'Všechny kraje' && targetRegion !== 'ALL') {
      whereClause.region = { contains: targetRegion.trim(), mode: 'insensitive' };
    }
    if (params?.city) {
      whereClause.city = { contains: params.city, mode: 'insensitive' };
    }
    if (params?.minRating) {
      whereClause.avgRating = { gte: Number(params.minRating) };
    }
    if (params?.search) {
      whereClause.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { city: { contains: params.search, mode: 'insensitive' } },
        { institution: { contains: params.search, mode: 'insensitive' } },
        { position: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    try {
      const subjekty = await prisma.subjekt.findMany({
        where: whereClause,
        include: {
          reviews: {
            where: { status: 'APPROVED', pracovnikId: null },
            orderBy: { createdAt: 'desc' },
          },
          pracovnici: {
            where: { status: 'APPROVED' },
            include: {
              reviews: {
                where: { status: 'APPROVED' },
                orderBy: { createdAt: 'desc' },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          verifiedProfile: true,
          informationSources: {
            where: { status: 'PENDING_REVIEW' },
            select: { id: true },
          },
        },
        orderBy: [{ avgRating: 'desc' }, { reviewCount: 'desc' }, { name: 'asc' }],
      });

      return subjekty.map((item: any) => {
        const pendingCount = item.informationSources ? item.informationSources.length : 0;
        const { informationSources: _src, ...rest } = item;
        return {
          ...rest,
          pendingSourcesCount: pendingCount,
        };
      });
    } catch (error) {
      markPrismaUnavailable(error);
      return this.getSubjekty(params);
    }
  }

  /**
   * Get single Subjekt detail
   */
  async getSubjektById(id: string) {
    if (!isPrismaAvailable()) {
      const found = dbStore.subjekty.find(item => item.id === id);
      if (!found) return null;
      const memProfile = dbStore.subjectVerifiedProfiles.find(p => p.subjektId === id);
      return {
        ...found,
        verifiedProfile: memProfile || null,
      };
    }

    try {
      const item = await prisma.subjekt.findUnique({
        where: { id },
        include: {
          reviews: {
            where: { status: 'APPROVED', pracovnikId: null },
            orderBy: { createdAt: 'desc' },
          },
          pracovnici: {
            where: { status: 'APPROVED' },
            include: {
              reviews: {
                where: { status: 'APPROVED' },
                orderBy: { createdAt: 'desc' },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          verifiedProfile: true,
        },
      });
      return item;
    } catch (error) {
      markPrismaUnavailable(error);
      return this.getSubjektById(id);
    }
  }

  /**
   * Add worker (pracovnik) to subjekt
   */
  async addPracovnik(data: {
    subjektId: string;
    jmeno: string;
    pozice?: string;
    telefon?: string;
    email?: string;
    kancelar?: string;
    status?: string;
    createdById?: string;
  }) {
    if (!isPrismaAvailable()) {
      const newPrac: any = {
        id: `prac-local-${Date.now()}`,
        subjektId: data.subjektId,
        jmeno: data.jmeno,
        pozice: data.pozice || null,
        telefon: data.telefon || null,
        email: data.email || null,
        kancelar: data.kancelar || null,
        status: data.status || 'APPROVED',
        createdById: data.createdById || null,
        createdAt: new Date(),
        reviews: [],
      };
      const subj = dbStore.subjekty.find(s => s.id === data.subjektId);
      if (subj) {
        if (!subj.pracovnici) subj.pracovnici = [];
        subj.pracovnici.push(newPrac);
      }
      return newPrac;
    }

    const created = await prisma.pracovnik.create({
      data: {
        subjektId: data.subjektId,
        jmeno: data.jmeno,
        pozice: data.pozice || null,
        telefon: data.telefon || null,
        email: data.email || null,
        kancelar: data.kancelar || null,
        status: data.status || 'APPROVED',
        createdById: data.createdById || null,
      },
    });
    return created;
  }

  /**
   * Get all pending workers for moderation
   */
  async getPendingPracovnici() {
    if (!isPrismaAvailable()) {
      const list: any[] = [];
      dbStore.subjekty.forEach(subj => {
        if (subj.pracovnici) {
          subj.pracovnici.forEach(p => {
            if (p.status === 'PENDING') {
              list.push({
                ...p,
                subjekt: subj,
                subjektName: subj.name,
              });
            }
          });
        }
      });
      return list;
    }

    const list = await prisma.pracovnik.findMany({
      where: { status: 'PENDING' },
      include: { subjekt: true },
      orderBy: { createdAt: 'desc' },
    });
    return list.map((p) => ({
      ...p,
      subjektName: p.subjekt?.name,
    }));
  }

  /**
   * Get all workers for moderation/administration
   */
  async getAllPracovnici() {
    if (!isPrismaAvailable()) {
      const list: any[] = [];
      dbStore.subjekty.forEach(subj => {
        if (subj.pracovnici) {
          subj.pracovnici.forEach(p => {
            list.push({
              ...p,
              subjekt: subj,
              subjektName: subj.name,
            });
          });
        }
      });
      return list;
    }

    const list = await prisma.pracovnik.findMany({
      include: { subjekt: true },
      orderBy: { createdAt: 'desc' },
    });
    return list.map((p) => ({
      ...p,
      subjektName: p.subjekt?.name,
    }));
  }

  /**
   * Update worker status (APPROVED / REJECTED)
   */
  async updatePracovnikStatus(id: string, status: 'APPROVED' | 'REJECTED') {
    if (!isPrismaAvailable()) {
      let found: any = null;
      dbStore.subjekty.forEach(subj => {
        if (subj.pracovnici) {
          const p = subj.pracovnici.find((x: any) => x.id === id);
          if (p) {
            p.status = status;
            found = p;
          }
        }
      });
      return found || { id, status };
    }

    const updated = await prisma.pracovnik.update({
      where: { id },
      data: { status },
    });
    return updated;
  }

  /**
   * Delete worker
   */
  async deletePracovnik(id: string) {
    if (!isPrismaAvailable()) {
      dbStore.subjekty.forEach(subj => {
        if (subj.pracovnici) {
          subj.pracovnici = subj.pracovnici.filter((x: any) => x.id !== id);
        }
      });
      return { success: true };
    }

    await prisma.pracovnik.delete({ where: { id } });
    return { success: true };
  }

  /**
   * Create new Subjekt (Admin or user suggestion)
   */
  async createSubjekt(data: {
    type: EntityType | string;
    name: string;
    titleBefore?: string;
    position?: string;
    institution?: string;
    city: string;
    region: string;
    address?: string;
    email?: string;
    phone?: string;
    website?: string;
    isVerified?: boolean;
    lat?: number;
    lng?: number;
    status?: string;
    createdById?: string;
  }) {
    if (!isPrismaAvailable()) {
      const newId = `subj-local-${Date.now()}`;
      const newSubj: Subjekt = {
        id: newId,
        type: data.type as any,
        name: data.name,
        titleBefore: data.titleBefore || null,
        position: data.position || null,
        institution: data.institution || null,
        city: data.city,
        region: data.region,
        address: data.address || null,
        email: data.email || null,
        phone: data.phone || null,
        website: data.website || null,
        lat: typeof data.lat === 'number' ? data.lat : null,
        lng: typeof data.lng === 'number' ? data.lng : null,
        isVerified: data.isVerified ?? true,
        status: data.status ? (data.status as any) : (data.isVerified === false ? 'PENDING_VERIFICATION' : 'VERIFIED'),
        createdById: data.createdById || null,
        createdAt: new Date(),
        avgRating: 0.0,
        reviewCount: 0,
        pracovnici: [],
        reviews: [],
      };
      dbStore.subjekty.push(newSubj);
      return newSubj;
    }

    const created = await prisma.subjekt.create({
      data: {
        type: data.type as EntityType,
        name: data.name,
        titleBefore: data.titleBefore || null,
        position: data.position || null,
        institution: data.institution || null,
        city: data.city,
        region: data.region,
        address: data.address || null,
        email: data.email || null,
        phone: data.phone || null,
        website: data.website || null,
        lat: typeof data.lat === 'number' ? data.lat : null,
        lng: typeof data.lng === 'number' ? data.lng : null,
        isVerified: data.isVerified ?? true,
        status: data.status ? (data.status as any) : (data.isVerified === false ? 'PENDING_VERIFICATION' : 'VERIFIED'),
        createdById: data.createdById || null,
      },
    });
    return created;
  }

  /**
   * Update Subjekt (Strict whitelist to prevent Mass Assignment)
   */
  async updateSubjekt(id: string, data: any) {
    const allowedFields = {
      type: data.type ? (data.type as EntityType) : undefined,
      name: data.name !== undefined ? data.name : undefined,
      titleBefore: data.titleBefore !== undefined ? data.titleBefore : undefined,
      position: data.position !== undefined ? data.position : undefined,
      institution: data.institution !== undefined ? data.institution : undefined,
      city: data.city !== undefined ? data.city : undefined,
      region: data.region !== undefined ? data.region : undefined,
      address: data.address !== undefined ? data.address : undefined,
      email: data.email !== undefined ? data.email : undefined,
      phone: data.phone !== undefined ? data.phone : undefined,
      website: data.website !== undefined ? data.website : undefined,
      lat: data.lat !== undefined ? (typeof data.lat === 'number' && !isNaN(data.lat) ? data.lat : null) : undefined,
      lng: data.lng !== undefined ? (typeof data.lng === 'number' && !isNaN(data.lng) ? data.lng : null) : undefined,
      isVerified: data.isVerified !== undefined ? Boolean(data.isVerified) : undefined,
      status: data.status !== undefined ? (data.status as any) : undefined,
      verifiedById: data.verifiedById !== undefined ? data.verifiedById : undefined,
      verifiedAt: data.verifiedAt !== undefined ? data.verifiedAt : undefined,
      rejectedById: data.rejectedById !== undefined ? data.rejectedById : undefined,
      rejectedAt: data.rejectedAt !== undefined ? data.rejectedAt : undefined,
      rejectionReason: data.rejectionReason !== undefined ? data.rejectionReason : undefined,
    };

    if (!isPrismaAvailable()) {
      const idx = dbStore.subjekty.findIndex(item => item.id === id);
      if (idx !== -1) {
        const current = dbStore.subjekty[idx];
        const cleanedUpdate: any = {};
        for (const [key, val] of Object.entries(allowedFields)) {
          if (val !== undefined) cleanedUpdate[key] = val;
        }
        dbStore.subjekty[idx] = {
          ...current,
          ...cleanedUpdate,
          // Guard against overwriting critical system fields
          id: current.id,
          avgRating: current.avgRating,
          reviewCount: current.reviewCount,
          createdAt: current.createdAt,
          createdById: current.createdById,
        };
        return dbStore.subjekty[idx];
      }
      throw new Error('Subjekt nenalezen');
    }

    const updated = await prisma.subjekt.update({
      where: { id },
      data: allowedFields,
    });
    return updated;
  }

  /**
   * Delete Subjekt
   */
  async deleteSubjekt(id: string) {
    if (!isPrismaAvailable()) {
      dbStore.subjekty = dbStore.subjekty.filter(item => item.id !== id);
      return true;
    }

    await prisma.subjekt.delete({ where: { id } });
    return true;
  }

  /**
   * Add Review for a Subjekt or a specific Pracovnik
   * P0: Status is strictly enforced server-side as 'PENDING'.
   * P1: Duplicate submission check (1 review per authenticated user per subject/worker).
   */
  async addReview(data: {
    subjektId: string;
    pracovnikId?: string;
    userId?: string;
    rating: number;
    supportSharedCare?: number;
    professionalism?: number;
    speedAndDeadlines?: number;
    objektivita?: number;
    komunikace?: number;
    rychlost?: number;
    comment: string;
    isAnonymous?: boolean;
    status?: 'PENDING' | 'APPROVED';
  }) {
    // Rating range check: 1 to 5
    const cleanRating = Math.max(1, Math.min(5, Math.round(Number(data.rating))));
    const cleanComment = (data.comment || '').trim();

    // P0: Always enforce 'PENDING' for newly submitted reviews
    const reviewStatus = 'PENDING';

    if (!isPrismaAvailable()) {
      // Check duplicate review if user is authenticated
      if (data.userId) {
        const existing = dbStore.reviews.find(r => 
          r.userId === data.userId &&
          r.subjektId === data.subjektId &&
          (data.pracovnikId ? r.pracovnikId === data.pracovnikId : !r.pracovnikId)
        );
        if (existing) {
          throw new Error('DUPLICATE_REVIEW: Pro tento záznam jste již vložil(a) hodnocení.');
        }
      }

      const newRev: Review = {
        id: `rev-local-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        subjektId: data.subjektId,
        pracovnikId: data.pracovnikId || null,
        userId: data.userId || null,
        rating: cleanRating,
        supportSharedCare: Number(data.supportSharedCare || cleanRating),
        professionalism: Number(data.professionalism || cleanRating),
        speedAndDeadlines: Number(data.speedAndDeadlines || cleanRating),
        objektivita: data.objektivita ? Number(data.objektivita) : null,
        komunikace: data.komunikace ? Number(data.komunikace) : null,
        rychlost: data.rychlost ? Number(data.rychlost) : null,
        status: reviewStatus,
        comment: cleanComment,
        isAnonymous: data.isAnonymous ?? true,
        createdAt: new Date(),
      };
      dbStore.reviews.push(newRev);

      const subj = dbStore.subjekty.find(s => s.id === data.subjektId);
      if (subj) {
        if (!subj.reviews) subj.reviews = [];
        subj.reviews.push(newRev);
        // Note: review is PENDING, so it won't affect avgRating until approved
        await this.recalculateRating(data.subjektId);
      }
      return newRev;
    }

    try {
      if (data.userId) {
        const existing = await prisma.review.findFirst({
          where: {
            userId: data.userId,
            subjektId: data.subjektId,
            pracovnikId: data.pracovnikId || null,
          },
        });
        if (existing) {
          throw new Error('DUPLICATE_REVIEW: Pro tento záznam jste již vložil(a) hodnocení.');
        }
      }

      const created = await prisma.review.create({
        data: {
          subjektId: data.subjektId,
          pracovnikId: data.pracovnikId || null,
          userId: data.userId || null,
          rating: cleanRating,
          supportSharedCare: Number(data.supportSharedCare || cleanRating),
          professionalism: Number(data.professionalism || cleanRating),
          speedAndDeadlines: Number(data.speedAndDeadlines || cleanRating),
          objektivita: data.objektivita ? Number(data.objektivita) : null,
          komunikace: data.komunikace ? Number(data.komunikace) : null,
          rychlost: data.rychlost ? Number(data.rychlost) : null,
          status: reviewStatus,
          comment: cleanComment,
          isAnonymous: data.isAnonymous ?? true,
        },
      });

      // Rating recalculation (only counts APPROVED reviews)
      if (!data.pracovnikId) {
        await this.recalculateRating(data.subjektId);
      }

      return created;
    } catch (err: any) {
      if (err?.message?.includes('DUPLICATE_REVIEW')) {
        throw err;
      }
      const { markPrismaUnavailable } = await import('../db/prisma');
      markPrismaUnavailable(err);
      return this.addReview(data);
    }
  }

  /**
   * Get pending reviews for moderation
   */
  async getPendingReviews() {
    if (!isPrismaAvailable()) {
      return dbStore.reviews
        .filter(r => r.status === 'PENDING')
        .map(r => {
          const subj = dbStore.subjekty.find(s => s.id === r.subjektId);
          return {
            ...r,
            subjektName: subj?.name || 'Neznámý subjekt',
          };
        });
    }

    try {
      const reviews = await prisma.review.findMany({
        where: { status: 'PENDING' },
        include: {
          subjekt: true,
          pracovnik: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      return reviews.map(r => ({
        ...r,
        subjektName: r.subjekt?.name,
        pracovnikName: r.pracovnik?.jmeno,
      }));
    } catch (err) {
      const { markPrismaUnavailable } = await import('../db/prisma');
      markPrismaUnavailable(err);
      return this.getPendingReviews();
    }
  }

  /**
   * Update review status (Approve / Reject) and recalculate rating
   */
  async updateReviewStatus(id: string, status: 'APPROVED' | 'REJECTED') {
    if (!isPrismaAvailable()) {
      const rev = dbStore.reviews.find(r => r.id === id);
      if (!rev) throw new Error('Recenze nenalezena');
      rev.status = status;

      // Update in subj.reviews as well if present
      const subj = dbStore.subjekty.find(s => s.id === rev.subjektId);
      if (subj && subj.reviews) {
        const subjRev = subj.reviews.find(r => r.id === id);
        if (subjRev) subjRev.status = status;
      }

      if (!rev.pracovnikId) {
        await this.recalculateRating(rev.subjektId);
      }
      return rev;
    }

    try {
      const rev = await prisma.review.findUnique({ where: { id } });
      if (!rev) throw new Error('Recenze nenalezena');

      const updated = await prisma.review.update({
        where: { id },
        data: { status },
      });

      if (!rev.pracovnikId) {
        await this.recalculateRating(rev.subjektId);
      }

      return updated;
    } catch (err: any) {
      if (err?.message?.includes('Recenze nenalezena')) throw err;
      const { markPrismaUnavailable } = await import('../db/prisma');
      markPrismaUnavailable(err);
      return this.updateReviewStatus(id, status);
    }
  }

  /**
   * Delete review and recalculate rating
   */
  async deleteReview(id: string) {
    if (!isPrismaAvailable()) {
      const revIdx = dbStore.reviews.findIndex(r => r.id === id);
      if (revIdx === -1) return { success: false, error: 'Recenze nenalezena' };
      const [removed] = dbStore.reviews.splice(revIdx, 1);

      const subj = dbStore.subjekty.find(s => s.id === removed.subjektId);
      if (subj && subj.reviews) {
        subj.reviews = subj.reviews.filter(r => r.id !== id);
      }

      if (!removed.pracovnikId) {
        await this.recalculateRating(removed.subjektId);
      }
      return { success: true };
    }

    try {
      const rev = await prisma.review.findUnique({ where: { id } });
      if (!rev) return { success: false, error: 'Recenze nenalezena' };

      await prisma.review.delete({ where: { id } });
      if (!rev.pracovnikId) {
        await this.recalculateRating(rev.subjektId);
      }
      return { success: true };
    } catch (err: any) {
      const { markPrismaUnavailable } = await import('../db/prisma');
      markPrismaUnavailable(err);
      return this.deleteReview(id);
    }
  }

  /**
   * Verifies an economic entity by IČO using official server-side ARES REST API v3.
   * Pure read-only verification: does not modify or create unapproved database records.
   */
  async verifySubjectByIco(ico: string | number): Promise<AresVerifyResult> {
    const aresClient = new AresApiClient();
    return await aresClient.fetchSubjectByIco(ico);
  }

  /**
   * Alias for verifySubjectByIco for backward compatibility.
   */
  async verifyIcoWithAres(ico: string | number): Promise<AresVerifyResult> {
    return this.verifySubjectByIco(ico);
  }

  /**
   * Recalculate average rating and review count for a Subjekt.
   * Only APPROVED general reviews (pracovnikId = null) are included.
   */
  async recalculateRating(subjektId: string) {
    if (!isPrismaAvailable()) {
      const subj = dbStore.subjekty.find(s => s.id === subjektId);
      if (subj) {
        const approvedReviews = dbStore.reviews.filter(
          r => r.subjektId === subjektId && r.status === 'APPROVED' && !r.pracovnikId
        );
        subj.reviewCount = approvedReviews.length;
        if (subj.reviewCount > 0) {
          const sum = approvedReviews.reduce((acc, r) => acc + r.rating, 0);
          subj.avgRating = Number((sum / approvedReviews.length).toFixed(1));
        } else {
          subj.avgRating = 0.0;
        }
      }
      return;
    }

    try {
      const reviews = await prisma.review.findMany({
        where: { subjektId, status: 'APPROVED', pracovnikId: null },
      });
      const reviewCount = reviews.length;
      let avgRating = 0.0;
      if (reviewCount > 0) {
        const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
        avgRating = Number((sum / reviewCount).toFixed(1));
      }

      await prisma.subjekt.update({
        where: { id: subjektId },
        data: { avgRating, reviewCount },
      });
    } catch (err) {
      console.warn('Error recalculating rating in Prisma, falling back to dbStore:', err);
      const { markPrismaUnavailable } = await import('../db/prisma');
      markPrismaUnavailable(err);
      return this.recalculateRating(subjektId);
    }
  }
}

export const subjektService = new SubjektService();

/**
 * Standalone server-side function to verify a subject by IČO using official ARES REST API v3.
 */
export async function verifySubjectByIco(ico: string | number): Promise<AresVerifyResult> {
  return subjektService.verifySubjectByIco(ico);
}

/**
 * Transforms a raw database Subjekt model into a sanitized public DTO,
 * stripping internal moderator/audit fields (createdById, verifiedById, rejectionReason, etc.)
 */
export function toPublicSubjektDto(subjekt: any, isPrivileged: boolean = false): any {
  if (!subjekt) return null;

  if (isPrivileged) {
    return subjekt;
  }

  const {
    createdById,
    verifiedById,
    verifiedAt,
    rejectedById,
    rejectedAt,
    rejectionReason,
    informationSources,
    pendingSourcesCount,
    ...publicData
  } = subjekt;

  // Strip internal fields from workers
  if (publicData.pracovnici && Array.isArray(publicData.pracovnici)) {
    publicData.pracovnici = publicData.pracovnici.map((p: any) => {
      const { createdById: _pCreatedBy, ...publicWorker } = p;
      return publicWorker;
    });
  }

  // Strip internal user fields from reviews
  if (publicData.reviews && Array.isArray(publicData.reviews)) {
    publicData.reviews = publicData.reviews.map((r: any) => {
      const { userId: _rUserId, ...publicReview } = r;
      return publicReview;
    });
  }

  // Strip internal fields from verified profile
  if (publicData.verifiedProfile) {
    if (publicData.verifiedProfile.status === 'PENDING_REVIEW' || publicData.verifiedProfile.status === 'REJECTED') {
      publicData.verifiedProfile = null;
    } else {
      const {
        verifiedById: _vpVerifiedById,
        createdById: _vpCreatedById,
        reviewedById: _vpReviewedById,
        rejectionReason: _vpRejectionReason,
        informationSources: _vpInfoSources,
        ...publicProfile
      } = publicData.verifiedProfile;

      if (typeof publicProfile.openingHours === 'string') {
        try {
          publicProfile.openingHoursRaw = publicProfile.openingHours;
          publicProfile.openingHours = JSON.parse(publicProfile.openingHours);
        } catch {
          // keep as string
        }
      }

      publicData.verifiedProfile = publicProfile;
    }
  }

  return publicData;
}
