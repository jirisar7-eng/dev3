import { getPrismaClient, markPrismaUnavailable, isFallbackAllowed } from '../db/prisma';
import { dbStore } from './dbStore';
import { Study, User } from '../types';

export class StudyService {
  static async getStudies(filter?: { status?: string; category?: string; search?: string }): Promise<Study[]> {
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        const where: any = {};
        if (filter?.status) {
          where.status = filter.status;
        }
        if (filter?.category) {
          where.category = filter.category;
        }
        if (filter?.search) {
          where.OR = [
            { title: { contains: filter.search, mode: 'insensitive' } },
            { authors: { contains: filter.search, mode: 'insensitive' } },
            { keywords: { contains: filter.search, mode: 'insensitive' } },
            { abstract: { contains: filter.search, mode: 'insensitive' } },
          ];
        }

        const studies = await prisma.study.findMany({
          where,
          orderBy: { createdAt: 'desc' },
        });

        return studies.map((s) => ({
          id: s.id,
          slug: s.slug,
          title: s.title,
          originalTitle: s.originalTitle || undefined,
          authors: s.authors,
          publicationYear: s.publicationYear || undefined,
          publisher: s.publisher || undefined,
          doi: s.doi || undefined,
          sourceUrl: s.sourceUrl || undefined,
          abstract: s.abstract || undefined,
          summary: s.summary || undefined,
          methodology: s.methodology || undefined,
          findings: s.findings || undefined,
          limitations: s.limitations || undefined,
          relevance: s.relevance || undefined,
          keywords: s.keywords || undefined,
          category: s.category,
          status: s.status as any,
          featured: s.featured,
          pdfUrl: s.pdfUrl || undefined,
          pdfMediaId: s.pdfMediaId || undefined,
          pdfSize: s.pdfSize || undefined,
          s3Bucket: s.s3Bucket || undefined,
          s3ObjectKey: s.s3ObjectKey || undefined,
          storageProvider: s.storageProvider || 'MinIO',
          mimeType: s.mimeType || 'application/pdf',
          fileHash: s.fileHash || undefined,
          createdBy: s.createdBy || undefined,
          updatedBy: s.updatedBy || undefined,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
        }));
      } catch (err) {
        markPrismaUnavailable(err);
      }
    }

    if (!isFallbackAllowed()) {
      throw new Error('Database is unavailable and in-memory fallback is disabled in production.');
    }

    let result = [...dbStore.studies];
    if (filter?.status) {
      result = result.filter((s) => s.status === filter.status);
    }
    if (filter?.category) {
      result = result.filter((s) => s.category === filter.category);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.authors.toLowerCase().includes(q) ||
          (s.keywords && s.keywords.toLowerCase().includes(q)) ||
          (s.abstract && s.abstract.toLowerCase().includes(q))
      );
    }
    return result;
  }

  static async getStudyBySlug(slug: string): Promise<Study | null> {
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        const s = await prisma.study.findUnique({
          where: { slug },
        });
        if (!s) return null;
        return {
          id: s.id,
          slug: s.slug,
          title: s.title,
          originalTitle: s.originalTitle || undefined,
          authors: s.authors,
          publicationYear: s.publicationYear || undefined,
          publisher: s.publisher || undefined,
          doi: s.doi || undefined,
          sourceUrl: s.sourceUrl || undefined,
          abstract: s.abstract || undefined,
          summary: s.summary || undefined,
          methodology: s.methodology || undefined,
          findings: s.findings || undefined,
          limitations: s.limitations || undefined,
          relevance: s.relevance || undefined,
          keywords: s.keywords || undefined,
          category: s.category,
          status: s.status as any,
          featured: s.featured,
          pdfUrl: s.pdfUrl || undefined,
          pdfMediaId: s.pdfMediaId || undefined,
          pdfSize: s.pdfSize || undefined,
          s3Bucket: s.s3Bucket || undefined,
          s3ObjectKey: s.s3ObjectKey || undefined,
          storageProvider: s.storageProvider || 'MinIO',
          mimeType: s.mimeType || 'application/pdf',
          fileHash: s.fileHash || undefined,
          createdBy: s.createdBy || undefined,
          updatedBy: s.updatedBy || undefined,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
        };
      } catch (err) {
        markPrismaUnavailable(err);
      }
    }

    if (!isFallbackAllowed()) {
      throw new Error('Database is unavailable and in-memory fallback is disabled in production.');
    }

    return dbStore.studies.find((s) => s.slug === slug) || null;
  }

  static async getStudyById(id: string): Promise<Study | null> {
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        const s = await prisma.study.findUnique({
          where: { id },
        });
        if (!s) return null;
        return {
          id: s.id,
          slug: s.slug,
          title: s.title,
          originalTitle: s.originalTitle || undefined,
          authors: s.authors,
          publicationYear: s.publicationYear || undefined,
          publisher: s.publisher || undefined,
          doi: s.doi || undefined,
          sourceUrl: s.sourceUrl || undefined,
          abstract: s.abstract || undefined,
          summary: s.summary || undefined,
          methodology: s.methodology || undefined,
          findings: s.findings || undefined,
          limitations: s.limitations || undefined,
          relevance: s.relevance || undefined,
          keywords: s.keywords || undefined,
          category: s.category,
          status: s.status as any,
          featured: s.featured,
          pdfUrl: s.pdfUrl || undefined,
          pdfMediaId: s.pdfMediaId || undefined,
          pdfSize: s.pdfSize || undefined,
          s3Bucket: s.s3Bucket || undefined,
          s3ObjectKey: s.s3ObjectKey || undefined,
          storageProvider: s.storageProvider || 'MinIO',
          mimeType: s.mimeType || 'application/pdf',
          fileHash: s.fileHash || undefined,
          createdBy: s.createdBy || undefined,
          updatedBy: s.updatedBy || undefined,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
        };
      } catch (err) {
        markPrismaUnavailable(err);
      }
    }

    if (!isFallbackAllowed()) {
      throw new Error('Database is unavailable and in-memory fallback is disabled in production.');
    }

    return dbStore.studies.find((s) => s.id === id) || null;
  }

  static async createStudy(data: Omit<Study, 'id' | 'createdAt' | 'updatedAt'>, user?: User | null): Promise<Study> {
    const prisma = getPrismaClient();
    const createdByEmail = user?.email || 'system@tatovacesta.cz';

    if (prisma) {
      try {
        const created = await prisma.study.create({
          data: {
            slug: data.slug,
            title: data.title,
            originalTitle: data.originalTitle,
            authors: data.authors,
            publicationYear: data.publicationYear,
            publisher: data.publisher,
            doi: data.doi,
            sourceUrl: data.sourceUrl,
            abstract: data.abstract,
            summary: data.summary,
            methodology: data.methodology,
            findings: data.findings,
            limitations: data.limitations,
            relevance: data.relevance,
            keywords: data.keywords,
            category: data.category || 'stridava_pece',
            status: data.status || 'DRAFT',
            featured: data.featured || false,
            pdfUrl: data.pdfUrl,
            pdfMediaId: data.pdfMediaId,
            pdfSize: data.pdfSize || 0,
            s3Bucket: data.s3Bucket,
            s3ObjectKey: data.s3ObjectKey,
            storageProvider: data.storageProvider || 'MinIO',
            mimeType: data.mimeType || 'application/pdf',
            fileHash: data.fileHash,
            createdBy: createdByEmail,
            updatedBy: createdByEmail,
          },
        });

        await prisma.auditLog.create({
          data: {
            userId: user?.id,
            userEmail: createdByEmail,
            action: 'STUDY_CREATE',
            module: 'CMS_STUDIES',
            details: `Vytvořena vědecká studie '${created.title}' (${created.slug}) se stavem ${created.status}.`,
          },
        });

        return {
          id: created.id,
          slug: created.slug,
          title: created.title,
          originalTitle: created.originalTitle || undefined,
          authors: created.authors,
          publicationYear: created.publicationYear || undefined,
          publisher: created.publisher || undefined,
          doi: created.doi || undefined,
          sourceUrl: created.sourceUrl || undefined,
          abstract: created.abstract || undefined,
          summary: created.summary || undefined,
          methodology: created.methodology || undefined,
          findings: created.findings || undefined,
          limitations: created.limitations || undefined,
          relevance: created.relevance || undefined,
          keywords: created.keywords || undefined,
          category: created.category,
          status: created.status as any,
          featured: created.featured,
          pdfUrl: created.pdfUrl || undefined,
          pdfMediaId: created.pdfMediaId || undefined,
          pdfSize: created.pdfSize || undefined,
          s3Bucket: created.s3Bucket || undefined,
          s3ObjectKey: created.s3ObjectKey || undefined,
          storageProvider: created.storageProvider || 'MinIO',
          mimeType: created.mimeType || 'application/pdf',
          fileHash: created.fileHash || undefined,
          createdBy: created.createdBy || undefined,
          updatedBy: created.updatedBy || undefined,
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
        };
      } catch (err) {
        markPrismaUnavailable(err);
      }
    }

    if (!isFallbackAllowed()) {
      throw new Error('Database is unavailable and in-memory fallback is disabled in production.');
    }

    const newStudy: Study = {
      ...data,
      id: 'study-' + Date.now(),
      createdBy: createdByEmail,
      updatedBy: createdByEmail,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dbStore.studies.unshift(newStudy);
    dbStore.logAudit('STUDY_CREATE', 'CMS_STUDIES', `Vytvořena vědecká studie '${newStudy.title}' (${newStudy.slug}) se stavem ${newStudy.status}.`, user);
    return newStudy;
  }

  static async updateStudy(id: string, data: Partial<Study>, user?: User | null): Promise<Study> {
    const prisma = getPrismaClient();
    const updatedByEmail = user?.email || 'system@tatovacesta.cz';

    if (prisma) {
      try {
        const updated = await prisma.study.update({
          where: { id },
          data: {
            title: data.title,
            slug: data.slug,
            originalTitle: data.originalTitle,
            authors: data.authors,
            publicationYear: data.publicationYear,
            publisher: data.publisher,
            doi: data.doi,
            sourceUrl: data.sourceUrl,
            abstract: data.abstract,
            summary: data.summary,
            methodology: data.methodology,
            findings: data.findings,
            limitations: data.limitations,
            relevance: data.relevance,
            keywords: data.keywords,
            category: data.category,
            status: data.status,
            featured: data.featured,
            pdfUrl: data.pdfUrl,
            pdfMediaId: data.pdfMediaId,
            pdfSize: data.pdfSize,
            s3Bucket: data.s3Bucket,
            s3ObjectKey: data.s3ObjectKey,
            storageProvider: data.storageProvider,
            mimeType: data.mimeType,
            fileHash: data.fileHash,
            updatedBy: updatedByEmail,
          },
        });

        await prisma.auditLog.create({
          data: {
            userId: user?.id,
            userEmail: updatedByEmail,
            action: data.status ? `STUDY_STATUS_${data.status}` : 'STUDY_UPDATE',
            module: 'CMS_STUDIES',
            details: `Aktualizována vědecká studie '${updated.title}' (ID: ${id}).`,
          },
        });

        return {
          id: updated.id,
          slug: updated.slug,
          title: updated.title,
          originalTitle: updated.originalTitle || undefined,
          authors: updated.authors,
          publicationYear: updated.publicationYear || undefined,
          publisher: updated.publisher || undefined,
          doi: updated.doi || undefined,
          sourceUrl: updated.sourceUrl || undefined,
          abstract: updated.abstract || undefined,
          summary: updated.summary || undefined,
          methodology: updated.methodology || undefined,
          findings: updated.findings || undefined,
          limitations: updated.limitations || undefined,
          relevance: updated.relevance || undefined,
          keywords: updated.keywords || undefined,
          category: updated.category,
          status: updated.status as any,
          featured: updated.featured,
          pdfUrl: updated.pdfUrl || undefined,
          pdfMediaId: updated.pdfMediaId || undefined,
          pdfSize: updated.pdfSize || undefined,
          s3Bucket: updated.s3Bucket || undefined,
          s3ObjectKey: updated.s3ObjectKey || undefined,
          storageProvider: updated.storageProvider || 'MinIO',
          mimeType: updated.mimeType || 'application/pdf',
          fileHash: updated.fileHash || undefined,
          createdBy: updated.createdBy || undefined,
          updatedBy: updated.updatedBy || undefined,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        };
      } catch (err) {
        markPrismaUnavailable(err);
      }
    }

    if (!isFallbackAllowed()) {
      throw new Error('Database is unavailable and in-memory fallback is disabled in production.');
    }

    const study = dbStore.studies.find((s) => s.id === id);
    if (!study) throw new Error('Vědecká studie nenalezena.');

    Object.assign(study, data, { updatedBy: updatedByEmail, updatedAt: new Date().toISOString() });
    dbStore.logAudit(
      data.status ? `STUDY_STATUS_${data.status}` : 'STUDY_UPDATE',
      'CMS_STUDIES',
      `Aktualizována vědecká studie '${study.title}' (ID: ${id}).`,
      user
    );
    return study;
  }

  static async deleteStudy(id: string, user?: User | null): Promise<void> {
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        const study = await prisma.study.findUnique({ where: { id } });
        if (study) {
          await prisma.study.delete({ where: { id } });
          await prisma.auditLog.create({
            data: {
              userId: user?.id,
              userEmail: user?.email || 'system@tatovacesta.cz',
              action: 'STUDY_DELETE',
              module: 'CMS_STUDIES',
              details: `Odstraněna vědecká studie '${study.title}' (ID: ${id}).`,
            },
          });
        }
        return;
      } catch (err) {
        markPrismaUnavailable(err);
      }
    }

    if (!isFallbackAllowed()) {
      throw new Error('Database is unavailable and in-memory fallback is disabled in production.');
    }

    const idx = dbStore.studies.findIndex((s) => s.id === id);
    if (idx !== -1) {
      const title = dbStore.studies[idx].title;
      dbStore.studies.splice(idx, 1);
      dbStore.logAudit('STUDY_DELETE', 'CMS_STUDIES', `Odstraněna vědecká studie '${title}' (ID: ${id}).`, user);
    }
  }
}
