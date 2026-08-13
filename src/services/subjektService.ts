import { EntityType } from '@prisma/client';
import { dbStore } from './dbStore';
import { Subjekt, Review } from '../types';
import { prisma } from '../db/prisma';

export class SubjektService {
  /**
   * Get filtered subjekty with optional type, region, or search term
   */
  async getSubjekty(params?: { type?: string; region?: string; kraj?: string; city?: string; search?: string; minRating?: number }) {
    try {
      const whereClause: any = {};

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
            where: { status: 'APPROVED' },
            orderBy: { createdAt: 'desc' },
          },
          pracovnici: {
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: [{ avgRating: 'desc' }, { reviewCount: 'desc' }, { name: 'asc' }],
      });

      return subjekty;
    } catch (error) {
      console.warn('Prisma getSubjekty error, fallback to dbStore:', error);
      let list = [...dbStore.subjekty];

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

      // Attach reviews and pracovnici
      return list.map((s) => ({
        ...s,
        reviews: dbStore.reviews.filter((r) => r.subjektId === s.id && r.status === 'APPROVED'),
        pracovnici: (s as any).pracovnici || [],
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
            where: { status: 'APPROVED' },
            orderBy: { createdAt: 'desc' },
          },
          pracovnici: {
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
      reviews: dbStore.reviews.filter((r) => r.subjektId === id && r.status === 'APPROVED'),
      pracovnici: (memoryItem as any).pracovnici || [],
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
  async updateSubjekt(id: string, data: Partial<Subjekt>) {
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
          isVerified: data.isVerified,
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
   * Add Review for a Subjekt
   */
  async addReview(data: {
    subjektId: string;
    userId?: string;
    rating: number;
    supportSharedCare: number;
    professionalism: number;
    speedAndDeadlines: number;
    comment: string;
    isAnonymous?: boolean;
  }) {
    try {
      const created = await prisma.review.create({
        data: {
          subjektId: data.subjektId,
          userId: data.userId || null,
          rating: Number(data.rating),
          supportSharedCare: Number(data.supportSharedCare),
          professionalism: Number(data.professionalism),
          speedAndDeadlines: Number(data.speedAndDeadlines),
          status: 'APPROVED', // Default to approved or PENDING for admin moderation
          comment: data.comment,
          isAnonymous: data.isAnonymous ?? true,
        },
      });

      // Recalculate average rating for Subjekt
      await this.recalculateRating(data.subjektId);

      return created;
    } catch (error) {
      console.warn('Prisma addReview error, fallback to dbStore:', error);
      const newReview: Review = {
        id: 'rev-' + Date.now(),
        subjektId: data.subjektId,
        userId: data.userId || null,
        rating: Number(data.rating),
        supportSharedCare: Number(data.supportSharedCare),
        professionalism: Number(data.professionalism),
        speedAndDeadlines: Number(data.speedAndDeadlines),
        status: 'APPROVED',
        comment: data.comment,
        isAnonymous: data.isAnonymous ?? true,
        createdAt: new Date(),
      };
      dbStore.reviews.unshift(newReview);

      // Recalculate rating in memory
      const subj = dbStore.subjekty.find((s) => s.id === data.subjektId);
      if (subj) {
        const approvedRev = dbStore.reviews.filter((r) => r.subjektId === data.subjektId && r.status === 'APPROVED');
        subj.reviewCount = approvedRev.length;
        if (approvedRev.length > 0) {
          const sum = approvedRev.reduce((acc, curr) => acc + curr.rating, 0);
          subj.avgRating = Number((sum / approvedRev.length).toFixed(1));
        }
      }

      return newReview;
    }
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
