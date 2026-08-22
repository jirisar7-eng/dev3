import { EntityType } from '@prisma/client';
import { dbStore } from './dbStore';
import { Subjekt, Review } from '../types';
import { prisma } from '../db/prisma';
import { AresApiClient, AresVerifyResult } from './ares';

export class SubjektService {
  /**
   * Get filtered subjekty with optional type, region, or search term
   */
  async getSubjekty(params?: { type?: string; region?: string; kraj?: string; city?: string; search?: string; minRating?: number; status?: string; createdById?: string }) {
    try {
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
        },
        orderBy: [{ avgRating: 'desc' }, { reviewCount: 'desc' }, { name: 'asc' }],
      });

      return subjekty;
    } catch (error) {
      console.warn('Prisma getSubjekty error, fallback to dbStore:', error);
      let list = [...dbStore.subjekty];
            if (params?.status && params.status !== 'ALL') {
        list = list.filter(s => (s as any).status === params.status);
      } else if (!params?.createdById && params?.status !== 'ALL') {
        list = list.filter(s => !(s as any).status || (s as any).status === 'VERIFIED');
      }
      if (params?.createdById) {
        list = list.filter(s => (s as any).createdById === params.createdById);
      }

      if (params?.type && params.type !== 'ALL') {
        list = list.filter((s) => s.type === params.type);
      }
      const targetRegion = params?.region || params?.kraj;
      if (targetRegion && targetRegion !== 'Všechny kraje' && targetRegion !== 'ALL') {
        const regNorm = targetRegion.trim().toLowerCase();
        list = list.filter((s) => {
          const sRegion = (s.region || '').trim().toLowerCase();
          return sRegion === regNorm || sRegion.includes(regNorm);
        });
      }
      if (params?.city) {
        list = list.filter((s) => s.city.toLowerCase().includes(params.city!.toLowerCase()));
      }
      if (params?.minRating) {
        list = list.filter((s) => s.avgRating >= Number(params.minRating));
      }
      if (params?.search) {
        const q = params.search.toLowerCase();
        list = list.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.city.toLowerCase().includes(q) ||
            (s.institution && s.institution.toLowerCase().includes(q)) ||
            (s.position && s.position.toLowerCase().includes(q))
        );
      }

      // Attach reviews and approved pracovnici
      return list.map((s) => ({
        ...s,
        reviews: dbStore.reviews.filter((r) => r.subjektId === s.id && r.status === 'APPROVED' && !r.pracovnikId),
        pracovnici: ((s as any).pracovnici || [])
          .filter((p: any) => !p.status || p.status === 'APPROVED')
          .map((p: any) => ({
            ...p,
            reviews: dbStore.reviews.filter((r) => r.pracovnikId === p.id && r.status === 'APPROVED'),
          })),
      }));
    }
  }

  /**
   * Get single Subjekt detail
   */
  async getSubjektById(id: string) {
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
        },
      });
      if (item) return item;
    } catch (error) {
      console.warn('Prisma getSubjektById error:', error);
    }

    const memoryItem = dbStore.subjekty.find((s) => s.id === id);
    if (!memoryItem) return null;

    return {
      ...memoryItem,
      reviews: dbStore.reviews.filter((r) => r.subjektId === id && r.status === 'APPROVED' && !r.pracovnikId),
      pracovnici: ((memoryItem as any).pracovnici || [])
        .filter((p: any) => !p.status || p.status === 'APPROVED')
        .map((p: any) => ({
          ...p,
          reviews: dbStore.reviews.filter((r) => r.pracovnikId === p.id && r.status === 'APPROVED'),
        })),
    };
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
    try {
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
    } catch (error) {
      console.warn('Prisma addPracovnik error, fallback to memory:', error);
      const sub = dbStore.subjekty.find((s) => s.id === data.subjektId);
      const newPrac = {
        id: 'prac-' + Date.now(),
        subjektId: data.subjektId,
        jmeno: data.jmeno,
        pozice: data.pozice || null,
        telefon: data.telefon || null,
        email: data.email || null,
        kancelar: data.kancelar || null,
        status: data.status || 'APPROVED',
        createdById: data.createdById || null,
        createdAt: new Date(),
      };
      if (sub) {
        if (!(sub as any).pracovnici) (sub as any).pracovnici = [];
        (sub as any).pracovnici.unshift(newPrac);
      }
      return newPrac;
    }
  }

  /**
   * Get all pending workers for moderation
   */
  async getPendingPracovnici() {
    try {
      const list = await prisma.pracovnik.findMany({
        where: { status: 'PENDING' },
        include: { subjekt: true },
        orderBy: { createdAt: 'desc' },
      });
      return list.map((p) => ({
        ...p,
        subjektName: p.subjekt?.name,
      }));
    } catch (error) {
      console.warn('Prisma getPendingPracovnici error, fallback:', error);
      const pending: any[] = [];
      for (const s of dbStore.subjekty) {
        if ((s as any).pracovnici) {
          for (const p of (s as any).pracovnici) {
            if (p.status === 'PENDING') {
              pending.push({ ...p, subjektName: s.name });
            }
          }
        }
      }
      return pending;
    }
  }

  /**
   * Update worker status (APPROVED / REJECTED)
   */
  async updatePracovnikStatus(id: string, status: 'APPROVED' | 'REJECTED') {
    try {
      const updated = await prisma.pracovnik.update({
        where: { id },
        data: { status },
      });
      return updated;
    } catch (error) {
      console.warn('Prisma updatePracovnikStatus error, fallback:', error);
      for (const s of dbStore.subjekty) {
        if ((s as any).pracovnici) {
          const p = (s as any).pracovnici.find((item: any) => item.id === id);
          if (p) {
            p.status = status;
            return p;
          }
        }
      }
      throw new Error('Pracovník nenalezen');
    }
  }

  /**
   * Delete worker
   */
  async deletePracovnik(id: string) {
    try {
      await prisma.pracovnik.delete({ where: { id } });
      return { success: true };
    } catch (error) {
      console.warn('Prisma deletePracovnik error, fallback:', error);
      for (const s of dbStore.subjekty) {
        if ((s as any).pracovnici) {
          (s as any).pracovnici = (s as any).pracovnici.filter((item: any) => item.id !== id);
        }
      }
      return { success: true };
    }
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
    try {
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
        },
      });
      return created;
    } catch (error) {
      console.warn('Prisma createSubjekt error, fallback to dbStore:', error);
      const newSubjekt: Subjekt = {
        id: 'subj-' + Date.now(),
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
        lat: data.lat !== undefined ? data.lat : undefined,
        lng: data.lng !== undefined ? data.lng : undefined,
        avgRating: 0.0,
        reviewCount: 0,
        isVerified: data.isVerified ?? true,
        createdAt: new Date(),
        reviews: [],
      };
      dbStore.subjekty.unshift(newSubjekt);
      return newSubjekt;
    }
  }

  /**
   * Update Subjekt
   */
  async updateSubjekt(id: string, data: any) {
    try {
      const updated = await prisma.subjekt.update({
        where: { id },
        data: {
          type: data.type ? (data.type as EntityType) : undefined,
          name: data.name,
          titleBefore: data.titleBefore,
          position: data.position,
          institution: data.institution,
          city: data.city,
          region: data.region,
          address: data.address,
          email: data.email,
          phone: data.phone,
          website: data.website,
          lat: data.lat !== undefined ? data.lat : undefined,
          lng: data.lng !== undefined ? data.lng : undefined,
          isVerified: data.isVerified,
          status: data.status as any,
          verifiedById: data.verifiedById,
          verifiedAt: data.verifiedAt,
          rejectedById: data.rejectedById,
          rejectedAt: data.rejectedAt,
          rejectionReason: data.rejectionReason,
        },
      });
      return updated;
    } catch (error) {
      console.warn('Prisma updateSubjekt error, fallback to dbStore:', error);
      const idx = dbStore.subjekty.findIndex((s) => s.id === id);
      if (idx !== -1) {
        dbStore.subjekty[idx] = { ...dbStore.subjekty[idx], ...data };
        return dbStore.subjekty[idx];
      }
      throw new Error('Subjekt nenalezen');
    }
  }

  /**
   * Delete Subjekt
   */
  async deleteSubjekt(id: string) {
    try {
      await prisma.subjekt.delete({ where: { id } });
      return true;
    } catch (error) {
      console.warn('Prisma deleteSubjekt error, fallback to dbStore:', error);
      dbStore.subjekty = dbStore.subjekty.filter((s) => s.id !== id);
      dbStore.reviews = dbStore.reviews.filter((r) => r.subjektId !== id);
      return true;
    }
  }

  /**
   * Add Review for a Subjekt or a specific Pracovnik
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
    try {
      const created = await prisma.review.create({
        data: {
          subjektId: data.subjektId,
          pracovnikId: data.pracovnikId || null,
          userId: data.userId || null,
          rating: Number(data.rating),
          supportSharedCare: Number(data.supportSharedCare || data.rating),
          professionalism: Number(data.professionalism || data.rating),
          speedAndDeadlines: Number(data.speedAndDeadlines || data.rating),
          objektivita: data.objektivita ? Number(data.objektivita) : null,
          komunikace: data.komunikace ? Number(data.komunikace) : null,
          rychlost: data.rychlost ? Number(data.rychlost) : null,
          status: data.status || 'APPROVED',
          comment: data.comment,
          isAnonymous: data.isAnonymous ?? true,
        },
      });

      // Recalculate average rating for Subjekt only if it is not a worker-specific review
      if (!data.pracovnikId) {
        await this.recalculateRating(data.subjektId);
      }

      return created;
    } catch (error) {
      console.warn('Prisma addReview error, fallback to dbStore:', error);
      const newReview: Review = {
        id: 'rev-' + Date.now(),
        subjektId: data.subjektId,
        pracovnikId: data.pracovnikId || null,
        userId: data.userId || null,
        rating: Number(data.rating),
        supportSharedCare: Number(data.supportSharedCare || data.rating),
        professionalism: Number(data.professionalism || data.rating),
        speedAndDeadlines: Number(data.speedAndDeadlines || data.rating),
        objektivita: data.objektivita ? Number(data.objektivita) : null,
        komunikace: data.komunikace ? Number(data.komunikace) : null,
        rychlost: data.rychlost ? Number(data.rychlost) : null,
        status: data.status || 'APPROVED',
        comment: data.comment,
        isAnonymous: data.isAnonymous ?? true,
        createdAt: new Date(),
      };
      dbStore.reviews.unshift(newReview);

      // Recalculate rating in memory only if it is not a worker-specific review
      if (!data.pracovnikId) {
        const subj = dbStore.subjekty.find((s) => s.id === data.subjektId);
        if (subj) {
          const approvedRev = dbStore.reviews.filter((r) => r.subjektId === data.subjektId && r.status === 'APPROVED' && !r.pracovnikId);
          subj.reviewCount = approvedRev.length;
          if (approvedRev.length > 0) {
            const sum = approvedRev.reduce((acc, curr) => acc + curr.rating, 0);
            subj.avgRating = Number((sum / approvedRev.length).toFixed(1));
          }
        }
      }

      return newReview;
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
   * Recalculate rating in Prisma
   */
  private async recalculateRating(subjektId: string) {
    try {
      const reviews = await prisma.review.findMany({
        where: { subjektId, status: 'APPROVED' },
      });
      const reviewCount = reviews.length;
      let avgRating = 0;
      if (reviewCount > 0) {
        const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
        avgRating = Number((sum / reviewCount).toFixed(1));
      }

      await prisma.subjekt.update({
        where: { id: subjektId },
        data: { avgRating, reviewCount },
      });
    } catch (err) {
      console.warn('Error recalculating rating:', err);
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
