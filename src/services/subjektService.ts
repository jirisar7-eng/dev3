import { EntityType } from '@prisma/client';
import { Subjekt, Review } from '../types';
import { prisma } from '../db/prisma';
import { AresApiClient, AresVerifyResult } from './ares';

export class SubjektService {
  /**
   * Get filtered subjekty with optional type, region, or search term
   */
  async getSubjekty(params?: { type?: string; region?: string; kraj?: string; city?: string; search?: string; minRating?: number; status?: string; createdById?: string }) {
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
  }

  /**
   * Get single Subjekt detail
   */
  async getSubjektById(id: string) {
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
    return item;
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
   * Update Subjekt
   */
  async updateSubjekt(id: string, data: any) {
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
  }

  /**
   * Delete Subjekt
   */
  async deleteSubjekt(id: string) {
    await prisma.subjekt.delete({ where: { id } });
    return true;
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
