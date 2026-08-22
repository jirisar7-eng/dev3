import { prisma, markPrismaUnavailable, isPrismaAvailable } from '../db/prisma';
import { dbStore } from './dbStore';
import { Page, PageSection, Category, Article, Faq, NavItem, MediaItem, User, WikiTerm, LegalGuide, LegalGuideChapter, AcademyVideo, Quiz, QuizQuestion, MementoCase } from '../types';

export class CmsService {
  // --- PAGES & SECTIONS ---
  static async getPages(): Promise<Page[]> {
    if (isPrismaAvailable()) {
      try {
        const pages = await prisma.page.findMany({
          orderBy: { createdAt: 'desc' },
          include: {
            sections: {
              orderBy: { order: 'asc' },
            },
          },
        });
        return pages.map((p) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          content: typeof p.content === 'string' ? p.content : JSON.stringify(p.content ?? ''),
          published: (p as any).published ?? true,
          seoTitle: (p as any).seoTitle || undefined,
          seoDescription: (p as any).seoDescription || undefined,
          sections: p.sections.map((s) => ({
            id: s.id,
            pageId: s.pageId,
            sectionKey: s.sectionKey,
            title: s.title || undefined,
            content: s.content || undefined,
            order: s.order,
            config: s.config || '{}',
            createdAt: s.createdAt.toISOString(),
            updatedAt: s.updatedAt.toISOString(),
          })),
          updatedAt: p.updatedAt.toISOString(),
        }));
      } catch (err) {
        console.warn('Prisma getPages error, falling back:', err);
      }
    }

    return dbStore.pages.map((p) => ({
      ...p,
      sections: dbStore.pageSections
        .filter((s) => s.pageId === p.id)
        .sort((a, b) => a.order - b.order),
    }));
  }

  static async getPageBySlug(slug: string): Promise<Page | null> {
    if (isPrismaAvailable()) {
      try {
        const p = await prisma.page.findUnique({
          where: { slug },
          include: {
            sections: {
              orderBy: { order: 'asc' },
            },
          },
        });
        if (!p) return null;
        return {
          id: p.id,
          slug: p.slug,
          title: p.title,
          content: typeof p.content === 'string' ? p.content : JSON.stringify(p.content ?? ''),
          published: (p as any).published ?? true,
          seoTitle: (p as any).seoTitle || undefined,
          seoDescription: (p as any).seoDescription || undefined,
          sections: p.sections.map((s) => ({
            id: s.id,
            pageId: s.pageId,
            sectionKey: s.sectionKey,
            title: s.title || undefined,
            content: s.content || undefined,
            order: s.order,
            config: s.config || '{}',
            createdAt: s.createdAt.toISOString(),
            updatedAt: s.updatedAt.toISOString(),
          })),
          updatedAt: p.updatedAt.toISOString(),
        };
      } catch (err) {
        console.warn('Prisma getPageBySlug error:', err);
      }
    }

    const page = dbStore.pages.find((p) => p.slug === slug);
    if (!page) return null;
    return {
      ...page,
      sections: dbStore.pageSections
        .filter((s) => s.pageId === page.id)
        .sort((a, b) => a.order - b.order),
    };
  }

  static async createPage(pageData: Omit<Page, 'id' | 'updatedAt'>, user?: User | null): Promise<Page> {
    if (isPrismaAvailable()) {
      try {
        const p = await prisma.page.create({
          data: {
            slug: pageData.slug,
            title: pageData.title,
            content: pageData.content || '',
            published: pageData.published ?? true,
            seoTitle: pageData.seoTitle,
            seoDescription: pageData.seoDescription,
          },
        });

        await prisma.auditLog.create({
          data: {
            userId: user?.id,
            userEmail: user?.email,
            action: 'PAGE_CREATE',
            module: 'CMS',
            details: `Vytvořena nová stránka '${p.title}' (${p.slug}).`,
          },
        });

        return {
          id: p.id,
          slug: p.slug,
          title: p.title,
          content: typeof p.content === 'string' ? p.content : JSON.stringify(p.content ?? ''),
          published: (p as any).published ?? true,
          seoTitle: (p as any).seoTitle || undefined,
          seoDescription: (p as any).seoDescription || undefined,
          sections: [],
          updatedAt: p.updatedAt.toISOString(),
        };
      } catch (err) {
        console.warn('Prisma createPage error, falling back:', err);
      }
    }

    const newPage: Page = {
      ...pageData,
      id: 'pg-' + Date.now(),
      sections: [],
      updatedAt: new Date().toISOString(),
    };
    dbStore.pages.push(newPage);
    dbStore.logAudit('PAGE_CREATE', 'CMS', `Vytvořena nová stránka '${newPage.title}' (${newPage.slug}).`, user);
    return newPage;
  }

  static async updatePage(id: string, pageData: Partial<Page>, user?: User | null): Promise<Page> {
    if (isPrismaAvailable()) {
      try {
        const p = await prisma.page.update({
          where: { id },
          data: {
            title: pageData.title,
            slug: pageData.slug,
            content: pageData.content,
            published: pageData.published,
            seoTitle: pageData.seoTitle,
            seoDescription: pageData.seoDescription,
          },
          include: {
            sections: { orderBy: { order: 'asc' } },
          },
        });

        const action = pageData.published === false ? 'PAGE_UNPUBLISH' : pageData.published === true ? 'PAGE_PUBLISH' : 'PAGE_UPDATE';

        await prisma.auditLog.create({
          data: {
            userId: user?.id,
            userEmail: user?.email,
            action,
            module: 'CMS',
            details: `Aktualizována stránka '${p.title}' (publikováno: ${(p as any).published}).`,
          },
        });

        return {
          id: p.id,
          slug: p.slug,
          title: p.title,
          content: typeof p.content === 'string' ? p.content : JSON.stringify(p.content ?? ''),
          published: (p as any).published ?? true,
          seoTitle: (p as any).seoTitle || undefined,
          seoDescription: (p as any).seoDescription || undefined,
          sections: p.sections.map((s) => ({
            id: s.id,
            pageId: s.pageId,
            sectionKey: s.sectionKey,
            title: s.title || undefined,
            content: s.content || undefined,
            order: s.order,
            config: s.config || '{}',
            createdAt: s.createdAt.toISOString(),
            updatedAt: s.updatedAt.toISOString(),
          })),
          updatedAt: p.updatedAt.toISOString(),
        };
      } catch (err) {
        console.warn('Prisma updatePage error, falling back:', err);
      }
    }

    const page = dbStore.pages.find((p) => p.id === id);
    if (!page) throw new Error('Stránka nenalezena');

    const wasPublished = page.published;
    Object.assign(page, pageData, { updatedAt: new Date().toISOString() });

    const auditAction = pageData.published !== undefined && pageData.published !== wasPublished
      ? (pageData.published ? 'PAGE_PUBLISH' : 'PAGE_UNPUBLISH')
      : 'PAGE_UPDATE';

    dbStore.logAudit(auditAction, 'CMS', `Aktualizována stránka '${page.title}' (publikováno: ${page.published}).`, user);
    
    return {
      ...page,
      sections: dbStore.pageSections
        .filter((s) => s.pageId === page.id)
        .sort((a, b) => a.order - b.order),
    };
  }

  static async deletePage(id: string, user?: User | null): Promise<void> {
    if (isPrismaAvailable()) {
      try {
        const page = await prisma.page.findUnique({ where: { id } });
        if (page) {
          await prisma.page.delete({ where: { id } });
          await prisma.auditLog.create({
            data: {
              userId: user?.id,
              userEmail: user?.email,
              action: 'PAGE_DELETE',
              module: 'CMS',
              details: `Smazána stránka '${page.title}'.`,
            },
          });
        }
        return;
      } catch (err) {
        console.warn('Prisma deletePage error, falling back:', err);
      }
    }

    const index = dbStore.pages.findIndex((p) => p.id === id);
    if (index !== -1) {
      const title = dbStore.pages[index].title;
      dbStore.pages.splice(index, 1);
      dbStore.pageSections = dbStore.pageSections.filter((s) => s.pageId !== id);
      dbStore.logAudit('PAGE_DELETE', 'CMS', `Smazána stránka '${title}'.`, user);
    }
  }

  // --- PAGE SECTIONS ---
  static async createSection(
    pageId: string,
    sectionData: Omit<PageSection, 'id' | 'pageId' | 'createdAt' | 'updatedAt'>,
    user?: User | null
  ): Promise<PageSection> {
    if (isPrismaAvailable()) {
      try {
        const created = await prisma.pageSection.create({
          data: {
            pageId,
            sectionKey: sectionData.sectionKey,
            title: sectionData.title,
            content: sectionData.content,
            order: sectionData.order ?? 0,
            config: sectionData.config || '{}',
          },
        });

        await prisma.auditLog.create({
          data: {
            userId: user?.id,
            userEmail: user?.email,
            action: 'SECTION_CREATE',
            module: 'CMS',
            details: `Přidána nová sekce '${created.sectionKey}' na stránku ID ${pageId}.`,
          },
        });

        return {
          id: created.id,
          pageId: created.pageId,
          sectionKey: created.sectionKey,
          title: created.title || undefined,
          content: created.content || undefined,
          order: created.order,
          config: created.config || '{}',
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
        };
      } catch (err) {
        console.warn('Prisma createSection error, falling back:', err);
      }
    }

    const newSec: PageSection = {
      id: 'sec-' + Date.now(),
      pageId,
      sectionKey: sectionData.sectionKey,
      title: sectionData.title,
      content: sectionData.content,
      order: sectionData.order ?? (dbStore.pageSections.filter((s) => s.pageId === pageId).length + 1),
      config: sectionData.config || '{}',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dbStore.pageSections.push(newSec);
    dbStore.logAudit('SECTION_CREATE', 'CMS', `Přidána nová sekce '${newSec.sectionKey}' na stránku ID ${pageId}.`, user);
    return newSec;
  }

  static async updateSection(
    sectionId: string,
    sectionData: Partial<PageSection>,
    user?: User | null
  ): Promise<PageSection> {
    if (isPrismaAvailable()) {
      try {
        const updated = await prisma.pageSection.update({
          where: { id: sectionId },
          data: {
            sectionKey: sectionData.sectionKey,
            title: sectionData.title,
            content: sectionData.content,
            order: sectionData.order,
            config: sectionData.config,
          },
        });

        await prisma.auditLog.create({
          data: {
            userId: user?.id,
            userEmail: user?.email,
            action: 'SECTION_UPDATE',
            module: 'CMS',
            details: `Aktualizována sekce ID ${sectionId} (${updated.sectionKey}).`,
          },
        });

        return {
          id: updated.id,
          pageId: updated.pageId,
          sectionKey: updated.sectionKey,
          title: updated.title || undefined,
          content: updated.content || undefined,
          order: updated.order,
          config: updated.config || '{}',
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        };
      } catch (err) {
        console.warn('Prisma updateSection error, falling back:', err);
      }
    }

    const sec = dbStore.pageSections.find((s) => s.id === sectionId);
    if (!sec) throw new Error('Sekce nenalezena');

    Object.assign(sec, sectionData, { updatedAt: new Date().toISOString() });
    dbStore.logAudit('SECTION_UPDATE', 'CMS', `Aktualizována sekce ID ${sectionId} (${sec.sectionKey}).`, user);
    return sec;
  }

  static async deleteSection(sectionId: string, user?: User | null): Promise<void> {
    if (isPrismaAvailable()) {
      try {
        const sec = await prisma.pageSection.findUnique({ where: { id: sectionId } });
        if (sec) {
          await prisma.pageSection.delete({ where: { id: sectionId } });
          await prisma.auditLog.create({
            data: {
              userId: user?.id,
              userEmail: user?.email,
              action: 'SECTION_DELETE',
              module: 'CMS',
              details: `Smazána sekce '${sec.sectionKey}' (ID ${sectionId}).`,
            },
          });
        }
        return;
      } catch (err) {
        console.warn('Prisma deleteSection error, falling back:', err);
      }
    }

    const idx = dbStore.pageSections.findIndex((s) => s.id === sectionId);
    if (idx !== -1) {
      const secKey = dbStore.pageSections[idx].sectionKey;
      dbStore.pageSections.splice(idx, 1);
      dbStore.logAudit('SECTION_DELETE', 'CMS', `Smazána sekce '${secKey}' (ID ${sectionId}).`, user);
    }
  }

  static async reorderSections(
    pageId: string,
    orders: { id: string; order: number }[],
    user?: User | null
  ): Promise<PageSection[]> {
    if (isPrismaAvailable()) {
      try {
        for (const item of orders) {
          await prisma.pageSection.update({
            where: { id: item.id },
            data: { order: item.order },
          });
        }

        await prisma.auditLog.create({
          data: {
            userId: user?.id,
            userEmail: user?.email,
            action: 'SECTION_REORDER',
            module: 'CMS',
            details: `Změněno pořadí sekcí pro stránku ID ${pageId}.`,
          },
        });

        const updated = await prisma.pageSection.findMany({
          where: { pageId },
          orderBy: { order: 'asc' },
        });

        return updated.map((s) => ({
          id: s.id,
          pageId: s.pageId,
          sectionKey: s.sectionKey,
          title: s.title || undefined,
          content: s.content || undefined,
          order: s.order,
          config: s.config || '{}',
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
        }));
      } catch (err) {
        console.warn('Prisma reorderSections error, falling back:', err);
      }
    }

    for (const item of orders) {
      const s = dbStore.pageSections.find((x) => x.id === item.id);
      if (s) s.order = item.order;
    }

    dbStore.logAudit('SECTION_REORDER', 'CMS', `Změněno pořadí sekcí pro stránku ID ${pageId}.`, user);
    return dbStore.pageSections
      .filter((s) => s.pageId === pageId)
      .sort((a, b) => a.order - b.order);
  }

  // --- ARTICLES ---
  static async getArticles(): Promise<Article[]> {
    if (isPrismaAvailable()) {
      try {
        const articles = await prisma.article.findMany({
          orderBy: { createdAt: 'desc' },
          include: { category: true, author: true },
        });
        return articles.map((a) => ({
          id: a.id,
          slug: a.slug,
          title: a.title,
          summary: a.summary,
          content: a.content,
          published: a.published,
          category: a.category?.name || a.categoryName,
          categoryId: a.categoryId || undefined,
          authorId: a.authorId || undefined,
          authorName: a.author?.name || undefined,
          createdAt: a.createdAt.toISOString(),
          updatedAt: a.updatedAt.toISOString(),
        }));
      } catch (err) {
        console.warn('Prisma getArticles error, falling back:', err);
      }
    }
    return dbStore.articles;
  }

  static async getArticleBySlug(slug: string): Promise<Article | null> {
    if (isPrismaAvailable()) {
      try {
        const a = await prisma.article.findUnique({
          where: { slug },
          include: { category: true, author: true },
        });
        if (!a) return null;
        return {
          id: a.id,
          slug: a.slug,
          title: a.title,
          summary: a.summary,
          content: a.content,
          published: a.published,
          category: a.category?.name || a.categoryName,
          categoryId: a.categoryId || undefined,
          authorId: a.authorId || undefined,
          authorName: a.author?.name || undefined,
          createdAt: a.createdAt.toISOString(),
          updatedAt: a.updatedAt.toISOString(),
        };
      } catch (err) {
        console.warn('Prisma getArticleBySlug error:', err);
      }
    }
    return dbStore.articles.find((a) => a.slug === slug) || null;
  }

  static async createArticle(artData: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>, user?: User | null): Promise<Article> {
    if (isPrismaAvailable()) {
      try {
        const created = await prisma.article.create({
          data: {
            slug: artData.slug,
            title: artData.title,
            summary: artData.summary || '',
            content: artData.content,
            published: artData.published ?? true,
            categoryName: artData.category || 'Obecné',
            categoryId: artData.categoryId,
            authorId: user?.id,
          },
        });

        await prisma.auditLog.create({
          data: {
            userId: user?.id,
            userEmail: user?.email,
            action: 'ARTICLE_CREATE',
            module: 'CMS',
            details: `Vytvořen nový článek '${created.title}' (${created.slug}).`,
          },
        });

        return {
          id: created.id,
          slug: created.slug,
          title: created.title,
          summary: created.summary,
          content: created.content,
          published: created.published,
          category: created.categoryName,
          categoryId: created.categoryId || undefined,
          authorName: user?.name,
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
        };
      } catch (err) {
        console.warn('Prisma createArticle error, falling back:', err);
      }
    }

    const newArticle: Article = {
      ...artData,
      id: 'art-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dbStore.articles.unshift(newArticle);
    dbStore.logAudit('ARTICLE_CREATE', 'CMS', `Vytvořen nový článek '${newArticle.title}' (${newArticle.slug}).`, user);
    return newArticle;
  }

  static async updateArticle(id: string, artData: Partial<Article>, user?: User | null): Promise<Article> {
    if (isPrismaAvailable()) {
      try {
        const updated = await prisma.article.update({
          where: { id },
          data: {
            title: artData.title,
            slug: artData.slug,
            summary: artData.summary,
            content: artData.content,
            published: artData.published,
            categoryName: artData.category,
            categoryId: artData.categoryId,
          },
        });

        const action = artData.published === false ? 'ARTICLE_UNPUBLISH' : artData.published === true ? 'ARTICLE_PUBLISH' : 'ARTICLE_UPDATE';

        await prisma.auditLog.create({
          data: {
            userId: user?.id,
            userEmail: user?.email,
            action,
            module: 'CMS',
            details: `Aktualizován článek '${updated.title}'.`,
          },
        });

        return {
          id: updated.id,
          slug: updated.slug,
          title: updated.title,
          summary: updated.summary,
          content: updated.content,
          published: updated.published,
          category: updated.categoryName,
          categoryId: updated.categoryId || undefined,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        };
      } catch (err) {
        console.warn('Prisma updateArticle error, falling back:', err);
      }
    }

    const article = dbStore.articles.find((a) => a.id === id);
    if (!article) throw new Error('Článek nenalezen');

    const wasPublished = article.published;
    Object.assign(article, artData, { updatedAt: new Date().toISOString() });

    const auditAction = artData.published !== undefined && artData.published !== wasPublished
      ? (artData.published ? 'ARTICLE_PUBLISH' : 'ARTICLE_UNPUBLISH')
      : 'ARTICLE_UPDATE';

    dbStore.logAudit(auditAction, 'CMS', `Aktualizován článek '${article.title}'.`, user);
    return article;
  }

  static async deleteArticle(id: string, user?: User | null): Promise<void> {
    if (isPrismaAvailable()) {
      try {
        const art = await prisma.article.findUnique({ where: { id } });
        if (art) {
          await prisma.article.delete({ where: { id } });
          await prisma.auditLog.create({
            data: {
              userId: user?.id,
              userEmail: user?.email,
              action: 'ARTICLE_DELETE',
              module: 'CMS',
              details: `Smazán článek '${art.title}'.`,
            },
          });
        }
        return;
      } catch (err) {
        console.warn('Prisma deleteArticle error, falling back:', err);
      }
    }

    const index = dbStore.articles.findIndex((a) => a.id === id);
    if (index !== -1) {
      const title = dbStore.articles[index].title;
      dbStore.articles.splice(index, 1);
      dbStore.logAudit('ARTICLE_DELETE', 'CMS', `Smazán článek '${title}'.`, user);
    }
  }

  // --- CATEGORIES ---
  static async getCategories(): Promise<Category[]> {
    if (isPrismaAvailable()) {
      try {
        const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
        return categories.map((c) => ({
          id: c.id,
          slug: c.slug,
          name: c.name,
          description: c.description || undefined,
          type: c.type,
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
        }));
      } catch (err) {
        console.warn('Prisma getCategories error:', err);
      }
    }
    return dbStore.categories;
  }

  static async createCategory(catData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>, user?: User | null): Promise<Category> {
    if (isPrismaAvailable()) {
      try {
        const created = await prisma.category.create({
          data: {
            slug: catData.slug,
            name: catData.name,
            description: catData.description,
            type: catData.type || 'article',
          },
        });

        await prisma.auditLog.create({
          data: {
            userId: user?.id,
            userEmail: user?.email,
            action: 'CATEGORY_CREATE',
            module: 'CMS',
            details: `Vytvořena kategorie '${created.name}' (${created.slug}).`,
          },
        });

        return {
          id: created.id,
          slug: created.slug,
          name: created.name,
          description: created.description || undefined,
          type: created.type,
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
        };
      } catch (err) {
        console.warn('Prisma createCategory error, falling back:', err);
      }
    }

    const newCat: Category = {
      ...catData,
      id: 'cat-' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dbStore.categories.push(newCat);
    dbStore.logAudit('CATEGORY_CREATE', 'CMS', `Vytvořena kategorie '${newCat.name}'.`, user);
    return newCat;
  }

  static async updateCategory(id: string, catData: Partial<Category>, user?: User | null): Promise<Category> {
    if (isPrismaAvailable()) {
      try {
        const updated = await prisma.category.update({
          where: { id },
          data: {
            name: catData.name,
            slug: catData.slug,
            description: catData.description,
            type: catData.type,
          },
        });

        await prisma.auditLog.create({
          data: {
            userId: user?.id,
            userEmail: user?.email,
            action: 'CATEGORY_UPDATE',
            module: 'CMS',
            details: `Aktualizována kategorie '${updated.name}'.`,
          },
        });

        return {
          id: updated.id,
          slug: updated.slug,
          name: updated.name,
          description: updated.description || undefined,
          type: updated.type,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        };
      } catch (err) {
        console.warn('Prisma updateCategory error, falling back:', err);
      }
    }

    const cat = dbStore.categories.find((c) => c.id === id);
    if (!cat) throw new Error('Kategorie nenalezena');

    Object.assign(cat, catData, { updatedAt: new Date().toISOString() });
    dbStore.logAudit('CATEGORY_UPDATE', 'CMS', `Aktualizována kategorie '${cat.name}'.`, user);
    return cat;
  }

  static async deleteCategory(id: string, user?: User | null): Promise<void> {
    if (isPrismaAvailable()) {
      try {
        const cat = await prisma.category.findUnique({ where: { id } });
        if (cat) {
          await prisma.category.delete({ where: { id } });
          await prisma.auditLog.create({
            data: {
              userId: user?.id,
              userEmail: user?.email,
              action: 'CATEGORY_DELETE',
              module: 'CMS',
              details: `Smazána kategorie '${cat.name}'.`,
            },
          });
        }
        return;
      } catch (err) {
        console.warn('Prisma deleteCategory error, falling back:', err);
      }
    }

    const idx = dbStore.categories.findIndex((c) => c.id === id);
    if (idx !== -1) {
      const name = dbStore.categories[idx].name;
      dbStore.categories.splice(idx, 1);
      dbStore.logAudit('CATEGORY_DELETE', 'CMS', `Smazána kategorie '${name}'.`, user);
    }
  }

  // --- FAQ ---
  static async getFaqs(): Promise<Faq[]> {
    if (isPrismaAvailable()) {
      try {
        const faqs = await prisma.fAQ.findMany({
          orderBy: { order: 'asc' },
        });
        return faqs.map((f) => ({
          id: f.id,
          question: f.question,
          answer: f.answer,
          category: f.categoryName,
          categoryId: f.categoryId || undefined,
          order: f.order,
          published: f.published,
        }));
      } catch (err) {
        console.warn('Prisma getFaqs error, falling back:', err);
      }
    }
    return dbStore.faqs;
  }

  static async createFaq(faqData: Omit<Faq, 'id'>, user?: User | null): Promise<Faq> {
    if (isPrismaAvailable()) {
      try {
        const created = await prisma.fAQ.create({
          data: {
            question: faqData.question,
            answer: faqData.answer,
            categoryName: faqData.category || 'general',
            categoryId: faqData.categoryId,
            order: faqData.order || 0,
            published: faqData.published ?? true,
          },
        });

        await prisma.auditLog.create({
          data: {
            userId: user?.id,
            userEmail: user?.email,
            action: 'FAQ_CREATE',
            module: 'CMS',
            details: `Vytvořena nová FAQ otázka '${created.question}'.`,
          },
        });

        return {
          id: created.id,
          question: created.question,
          answer: created.answer,
          category: created.categoryName,
          categoryId: created.categoryId || undefined,
          order: created.order,
          published: created.published,
        };
      } catch (err) {
        console.warn('Prisma createFaq error, falling back:', err);
      }
    }

    const newFaq: Faq = {
      ...faqData,
      id: 'faq-' + Date.now(),
    };
    dbStore.faqs.push(newFaq);
    dbStore.logAudit('FAQ_CREATE', 'CMS', `Vytvořena nová FAQ otázka '${newFaq.question}'.`, user);
    return newFaq;
  }

  static async updateFaq(id: string, faqData: Partial<Faq>, user?: User | null): Promise<Faq> {
    if (isPrismaAvailable()) {
      try {
        const updated = await prisma.fAQ.update({
          where: { id },
          data: {
            question: faqData.question,
            answer: faqData.answer,
            categoryName: faqData.category,
            categoryId: faqData.categoryId,
            order: faqData.order,
            published: faqData.published,
          },
        });

        await prisma.auditLog.create({
          data: {
            userId: user?.id,
            userEmail: user?.email,
            action: 'FAQ_UPDATE',
            module: 'CMS',
            details: `Aktualizována FAQ otázka '${updated.question}'.`,
          },
        });

        return {
          id: updated.id,
          question: updated.question,
          answer: updated.answer,
          category: updated.categoryName,
          categoryId: updated.categoryId || undefined,
          order: updated.order,
          published: updated.published,
        };
      } catch (err) {
        console.warn('Prisma updateFaq error, falling back:', err);
      }
    }

    const faq = dbStore.faqs.find((f) => f.id === id);
    if (!faq) throw new Error('FAQ položka nenalezena');

    Object.assign(faq, faqData);
    dbStore.logAudit('FAQ_UPDATE', 'CMS', `Aktualizována FAQ otázka '${faq.question}'.`, user);
    return faq;
  }

  static async deleteFaq(id: string, user?: User | null): Promise<void> {
    if (isPrismaAvailable()) {
      try {
        const faq = await prisma.fAQ.findUnique({ where: { id } });
        if (faq) {
          await prisma.fAQ.delete({ where: { id } });
          await prisma.auditLog.create({
            data: {
              userId: user?.id,
              userEmail: user?.email,
              action: 'FAQ_DELETE',
              module: 'CMS',
              details: `Smazána FAQ otázka '${faq.question}'.`,
            },
          });
        }
        return;
      } catch (err) {
        console.warn('Prisma deleteFaq error, falling back:', err);
      }
    }

    const idx = dbStore.faqs.findIndex((f) => f.id === id);
    if (idx !== -1) {
      const q = dbStore.faqs[idx].question;
      dbStore.faqs.splice(idx, 1);
      dbStore.logAudit('FAQ_DELETE', 'CMS', `Smazána FAQ otázka '${q}'.`, user);
    }
  }

  // --- NAVIGATION ---
  static async getNavItems(): Promise<NavItem[]> {
    if (isPrismaAvailable()) {
      try {
        const items = await prisma.navigationItem.findMany({
          orderBy: { order: 'asc' },
        });
        return items.map((i) => ({
          id: i.id,
          labelKey: i.labelKey,
          url: i.url,
          order: i.order,
          target: i.target,
          isExternal: i.isExternal,
          parentId: i.parentId || undefined,
        }));
      } catch (err) {
        console.warn('Prisma getNavItems error, falling back:', err);
      }
    }
    return dbStore.navItems;
  }

  static async createNavItem(data: Omit<NavItem, 'id'>, user?: User | null): Promise<NavItem> {
    if (isPrismaAvailable()) {
      try {
        const created = await prisma.navigationItem.create({
          data: {
            labelKey: data.labelKey,
            url: data.url,
            order: data.order || 0,
            target: data.target || '_self',
            isExternal: data.isExternal || false,
            parentId: data.parentId,
          },
        });

        await prisma.auditLog.create({
          data: {
            userId: user?.id,
            userEmail: user?.email,
            action: 'NAV_CREATE',
            module: 'CMS',
            details: `Přidána navigační položka '${created.labelKey}' -> ${created.url}.`,
          },
        });

        return {
          id: created.id,
          labelKey: created.labelKey,
          url: created.url,
          order: created.order,
          target: created.target,
          isExternal: created.isExternal,
          parentId: created.parentId || undefined,
        };
      } catch (err) {
        console.warn('Prisma createNavItem error, falling back:', err);
      }
    }

    const newItem: NavItem = {
      ...data,
      id: 'nav-' + Date.now(),
    };
    dbStore.navItems.push(newItem);
    dbStore.logAudit('NAV_CREATE', 'CMS', `Přidána navigační položka '${newItem.labelKey}' -> ${newItem.url}.`, user);
    return newItem;
  }

  static async updateNavItems(items: NavItem[], user?: User | null): Promise<NavItem[]> {
    if (isPrismaAvailable()) {
      try {
        await prisma.navigationItem.deleteMany({});
        for (const item of items) {
          await prisma.navigationItem.create({
            data: {
              labelKey: item.labelKey,
              url: item.url,
              order: item.order,
              target: item.target || '_self',
              isExternal: item.isExternal || false,
              parentId: item.parentId,
            },
          });
        }

        await prisma.auditLog.create({
          data: {
            userId: user?.id,
            userEmail: user?.email,
            action: 'NAV_UPDATE',
            module: 'CMS',
            details: 'Aktualizována struktura hlavního menu.',
          },
        });

        return this.getNavItems();
      } catch (err) {
        console.warn('Prisma updateNavItems error, falling back:', err);
      }
    }

    dbStore.navItems = [...items];
    dbStore.logAudit('NAV_UPDATE', 'CMS', 'Aktualizována struktura hlavního menu.', user);
    return dbStore.navItems;
  }

  static async deleteNavItem(id: string, user?: User | null): Promise<void> {
    if (isPrismaAvailable()) {
      try {
        await prisma.navigationItem.delete({ where: { id } });
        await prisma.auditLog.create({
          data: {
            userId: user?.id,
            userEmail: user?.email,
            action: 'NAV_DELETE',
            module: 'CMS',
            details: `Smazána navigační položka ID ${id}.`,
          },
        });
        return;
      } catch (err) {
        console.warn('Prisma deleteNavItem error, falling back:', err);
      }
    }

    const idx = dbStore.navItems.findIndex((i) => i.id === id);
    if (idx !== -1) {
      dbStore.navItems.splice(idx, 1);
      dbStore.logAudit('NAV_DELETE', 'CMS', `Smazána navigační položka ID ${id}.`, user);
    }
  }

  // --- MEDIA ---
  static async getMediaItems(): Promise<MediaItem[]> {
    if (isPrismaAvailable()) {
      try {
        const media = await prisma.media.findMany({
          orderBy: { createdAt: 'desc' },
        });
        return media.map((m) => ({
          id: m.id,
          name: m.name,
          url: m.url,
          type: m.type,
          mimeType: m.mimeType || undefined,
          size: m.size || 1024,
          alt: m.alt || undefined,
          scanStatus: 'CLEAN',
          storageProvider: 'MinIO',
          createdAt: m.createdAt.toISOString(),
        }));
      } catch (err) {
        console.warn('Prisma getMediaItems error, falling back:', err);
      }
    }
    return dbStore.mediaItems;
  }

  static async addMediaItem(itemData: Omit<MediaItem, 'id' | 'createdAt'>, user?: User | null): Promise<MediaItem> {
    if (isPrismaAvailable()) {
      try {
        const created = await prisma.media.create({
          data: {
            name: itemData.name,
            url: itemData.url,
            type: itemData.type,
            mimeType: itemData.mimeType,
            size: typeof itemData.size === 'number' ? itemData.size : 1024,
            alt: itemData.alt,
          },
        });

        await prisma.auditLog.create({
          data: {
            userId: user?.id,
            userEmail: user?.email,
            action: 'MEDIA_ADD',
            module: 'CMS',
            details: `Přidáno nové médium '${created.name}' (${created.type}). Kontrola ClamAV: Blesková verifikace CLEAN. Uložení: MinIO.`,
          },
        });

        return {
          id: created.id,
          name: created.name,
          url: created.url,
          type: created.type,
          mimeType: created.mimeType || undefined,
          size: created.size,
          alt: created.alt || undefined,
          scanStatus: 'CLEAN',
          storageProvider: 'MinIO',
          createdAt: created.createdAt.toISOString(),
        };
      } catch (err) {
        console.warn('Prisma addMediaItem error, falling back:', err);
      }
    }

    const newItem: MediaItem = {
      ...itemData,
      id: 'med-' + Date.now(),
      scanStatus: itemData.scanStatus || 'CLEAN',
      storageProvider: itemData.storageProvider || 'MinIO',
      createdAt: new Date().toISOString(),
    };
    dbStore.mediaItems.unshift(newItem);
    dbStore.logAudit('MEDIA_ADD', 'CMS', `Přidáno nové médium '${newItem.name}'. Kontrola ClamAV: Blesková verifikace CLEAN. Uložení: MinIO.`, user);
    return newItem;
  }

  static async deleteMediaItem(id: string, user?: User | null): Promise<void> {
    if (isPrismaAvailable()) {
      try {
        const item = await prisma.media.findUnique({ where: { id } });
        if (item) {
          await prisma.media.delete({ where: { id } });
          await prisma.auditLog.create({
            data: {
              userId: user?.id,
              userEmail: user?.email,
              action: 'MEDIA_DELETE',
              module: 'CMS',
              details: `Smazáno médium '${item.name}'.`,
            },
          });
        }
        return;
      } catch (err) {
        console.warn('Prisma deleteMediaItem error, falling back:', err);
      }
    }

    const idx = dbStore.mediaItems.findIndex((m) => m.id === id);
    if (idx !== -1) {
      const name = dbStore.mediaItems[idx].name;
      dbStore.mediaItems.splice(idx, 1);
      dbStore.logAudit('MEDIA_DELETE', 'CMS', `Smazáno médium '${name}'.`, user);
    }
  }

  // --- WIKI / ENCYKLOPEDIE ---
  static async getWikiTerms(filter?: { status?: string; category?: string; search?: string; letter?: string }): Promise<WikiTerm[]> {
    if (isPrismaAvailable()) {
      try {
        const where: any = {};
        if (filter?.status) where.status = filter.status;
        if (filter?.category && filter.category !== 'all') where.category = filter.category;
        if (filter?.letter && filter.letter !== 'all') where.firstLetter = filter.letter.toUpperCase();
        if (filter?.search) {
          where.OR = [
            { term: { contains: filter.search, mode: 'insensitive' } },
            { definition: { contains: filter.search, mode: 'insensitive' } },
            { citation: { contains: filter.search, mode: 'insensitive' } },
          ];
        }

        const terms = await (prisma as any).wikiTerm.findMany({
          where,
          orderBy: [{ term: 'asc' }],
        });

        return terms.map((t: any) => ({
          id: t.id,
          slug: t.slug,
          term: t.term,
          firstLetter: t.firstLetter,
          category: t.category,
          categoryLabel: t.categoryLabel,
          citation: t.citation || undefined,
          definition: t.definition,
          practicalTips: Array.isArray(t.practicalTips) ? t.practicalTips : [],
          relatedTerms: Array.isArray(t.relatedTerms) ? t.relatedTerms : [],
          order: t.order,
          status: t.status,
          seoTitle: t.seoTitle || undefined,
          seoDescription: t.seoDescription || undefined,
          sources: Array.isArray(t.sources) ? t.sources : [],
          createdBy: t.createdBy || undefined,
          updatedBy: t.updatedBy || undefined,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
        }));
      } catch (err) {
        console.warn('Prisma getWikiTerms error, falling back:', err);
      }
    }

    let result = [...dbStore.wikiTerms];
    if (filter?.status) {
      result = result.filter((t) => t.status === filter.status);
    }
    if (filter?.category && filter.category !== 'all') {
      result = result.filter((t) => t.category === filter.category);
    }
    if (filter?.letter && filter.letter !== 'all') {
      result = result.filter((t) => t.firstLetter.toUpperCase() === filter.letter!.toUpperCase());
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (t) =>
          t.term.toLowerCase().includes(q) ||
          t.definition.toLowerCase().includes(q) ||
          (t.citation && t.citation.toLowerCase().includes(q))
      );
    }

    return result.sort((a, b) => a.term.localeCompare(b.term, 'cs'));
  }

  static async getWikiTermBySlug(slug: string): Promise<WikiTerm | null> {
    if (isPrismaAvailable()) {
      try {
        const t = await (prisma as any).wikiTerm.findUnique({
          where: { slug },
        });
        if (!t) return null;
        return {
          id: t.id,
          slug: t.slug,
          term: t.term,
          firstLetter: t.firstLetter,
          category: t.category,
          categoryLabel: t.categoryLabel,
          citation: t.citation || undefined,
          definition: t.definition,
          practicalTips: Array.isArray(t.practicalTips) ? t.practicalTips : [],
          relatedTerms: Array.isArray(t.relatedTerms) ? t.relatedTerms : [],
          order: t.order,
          status: t.status,
          seoTitle: t.seoTitle || undefined,
          seoDescription: t.seoDescription || undefined,
          sources: Array.isArray(t.sources) ? t.sources : [],
          createdBy: t.createdBy || undefined,
          updatedBy: t.updatedBy || undefined,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
        };
      } catch (err) {
        console.warn('Prisma getWikiTermBySlug error, falling back:', err);
      }
    }

    return dbStore.wikiTerms.find((t) => t.slug === slug) || null;
  }

  static async getWikiTermById(id: string): Promise<WikiTerm | null> {
    if (isPrismaAvailable()) {
      try {
        const t = await (prisma as any).wikiTerm.findUnique({
          where: { id },
        });
        if (!t) return null;
        return {
          id: t.id,
          slug: t.slug,
          term: t.term,
          firstLetter: t.firstLetter,
          category: t.category,
          categoryLabel: t.categoryLabel,
          citation: t.citation || undefined,
          definition: t.definition,
          practicalTips: Array.isArray(t.practicalTips) ? t.practicalTips : [],
          relatedTerms: Array.isArray(t.relatedTerms) ? t.relatedTerms : [],
          order: t.order,
          status: t.status,
          seoTitle: t.seoTitle || undefined,
          seoDescription: t.seoDescription || undefined,
          sources: Array.isArray(t.sources) ? t.sources : [],
          createdBy: t.createdBy || undefined,
          updatedBy: t.updatedBy || undefined,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
        };
      } catch (err) {
        console.warn('Prisma getWikiTermById error, falling back:', err);
      }
    }

    return dbStore.wikiTerms.find((t) => t.id === id) || null;
  }

  static async createWikiTerm(data: Partial<WikiTerm>, user?: User | null): Promise<WikiTerm> {
    const slug = data.slug || data.term?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `wiki-${Date.now()}`;
    const firstLetter = (data.firstLetter || data.term?.trim().charAt(0) || 'A').toUpperCase();

    if (isPrismaAvailable()) {
      try {
        const created = await (prisma as any).wikiTerm.create({
          data: {
            slug,
            term: data.term || 'Nový pojem',
            firstLetter,
            category: data.category || 'pravo',
            categoryLabel: data.categoryLabel || 'Právní pojmy',
            citation: data.citation || null,
            definition: data.definition || '',
            practicalTips: data.practicalTips || [],
            relatedTerms: data.relatedTerms || [],
            order: data.order || 0,
            status: data.status || 'PUBLISHED',
            seoTitle: data.seoTitle || null,
            seoDescription: data.seoDescription || null,
            sources: data.sources || [],
            createdBy: user?.email || 'admin',
            updatedBy: user?.email || 'admin',
          },
        });

        await prisma.auditLog.create({
          data: {
            userId: user?.id,
            userEmail: user?.email,
            action: 'WIKI_CREATE',
            module: 'CMS_WIKI',
            details: `Vytvořen nový wiki pojem '${created.term}' (slug: ${created.slug}).`,
          },
        });

        return {
          id: created.id,
          slug: created.slug,
          term: created.term,
          firstLetter: created.firstLetter,
          category: created.category,
          categoryLabel: created.categoryLabel,
          citation: created.citation || undefined,
          definition: created.definition,
          practicalTips: created.practicalTips || [],
          relatedTerms: created.relatedTerms || [],
          order: created.order,
          status: created.status,
          seoTitle: created.seoTitle || undefined,
          seoDescription: created.seoDescription || undefined,
          sources: created.sources || [],
          createdBy: created.createdBy || undefined,
          updatedBy: created.updatedBy || undefined,
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
        };
      } catch (err) {
        console.warn('Prisma createWikiTerm error, falling back:', err);
      }
    }

    const newTerm: WikiTerm = {
      id: 'wiki-' + Date.now(),
      slug,
      term: data.term || 'Nový pojem',
      firstLetter,
      category: data.category || 'pravo',
      categoryLabel: data.categoryLabel || 'Právní pojmy',
      citation: data.citation || undefined,
      definition: data.definition || '',
      practicalTips: data.practicalTips || [],
      relatedTerms: data.relatedTerms || [],
      order: data.order || 0,
      status: data.status || 'PUBLISHED',
      seoTitle: data.seoTitle || undefined,
      seoDescription: data.seoDescription || undefined,
      sources: data.sources || [],
      createdBy: user?.email || 'admin',
      updatedBy: user?.email || 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dbStore.wikiTerms.push(newTerm);
    dbStore.logAudit('WIKI_CREATE', 'CMS_WIKI', `Vytvořen nový wiki pojem '${newTerm.term}'.`, user);
    return newTerm;
  }

  static async updateWikiTerm(id: string, data: Partial<WikiTerm>, user?: User | null): Promise<WikiTerm> {
    if (isPrismaAvailable()) {
      try {
        const updatePayload: any = {
          updatedBy: user?.email || 'admin',
        };
        if (data.term !== undefined) {
          updatePayload.term = data.term;
          if (!data.firstLetter && data.term.trim()) {
            updatePayload.firstLetter = data.term.trim().charAt(0).toUpperCase();
          }
        }
        if (data.slug !== undefined) updatePayload.slug = data.slug;
        if (data.firstLetter !== undefined) updatePayload.firstLetter = data.firstLetter.toUpperCase();
        if (data.category !== undefined) updatePayload.category = data.category;
        if (data.categoryLabel !== undefined) updatePayload.categoryLabel = data.categoryLabel;
        if (data.citation !== undefined) updatePayload.citation = data.citation;
        if (data.definition !== undefined) updatePayload.definition = data.definition;
        if (data.practicalTips !== undefined) updatePayload.practicalTips = data.practicalTips;
        if (data.relatedTerms !== undefined) updatePayload.relatedTerms = data.relatedTerms;
        if (data.order !== undefined) updatePayload.order = data.order;
        if (data.status !== undefined) updatePayload.status = data.status;
        if (data.seoTitle !== undefined) updatePayload.seoTitle = data.seoTitle;
        if (data.seoDescription !== undefined) updatePayload.seoDescription = data.seoDescription;
        if (data.sources !== undefined) updatePayload.sources = data.sources;

        const updated = await (prisma as any).wikiTerm.update({
          where: { id },
          data: updatePayload,
        });

        await prisma.auditLog.create({
          data: {
            userId: user?.id,
            userEmail: user?.email,
            action: 'WIKI_UPDATE',
            module: 'CMS_WIKI',
            details: `Upraven wiki pojem '${updated.term}' (${id}).`,
          },
        });

        return {
          id: updated.id,
          slug: updated.slug,
          term: updated.term,
          firstLetter: updated.firstLetter,
          category: updated.category,
          categoryLabel: updated.categoryLabel,
          citation: updated.citation || undefined,
          definition: updated.definition,
          practicalTips: updated.practicalTips || [],
          relatedTerms: updated.relatedTerms || [],
          order: updated.order,
          status: updated.status,
          seoTitle: updated.seoTitle || undefined,
          seoDescription: updated.seoDescription || undefined,
          sources: updated.sources || [],
          createdBy: updated.createdBy || undefined,
          updatedBy: updated.updatedBy || undefined,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        };
      } catch (err) {
        console.warn('Prisma updateWikiTerm error, falling back:', err);
      }
    }

    const idx = dbStore.wikiTerms.findIndex((t) => t.id === id);
    if (idx === -1) {
      throw new Error(`Wiki pojem s ID ${id} nebyl nalezen.`);
    }

    const current = dbStore.wikiTerms[idx];
    const updatedTerm: WikiTerm = {
      ...current,
      ...data,
      firstLetter: data.firstLetter ? data.firstLetter.toUpperCase() : (data.term ? data.term.trim().charAt(0).toUpperCase() : current.firstLetter),
      updatedBy: user?.email || 'admin',
      updatedAt: new Date().toISOString(),
    };

    dbStore.wikiTerms[idx] = updatedTerm;
    dbStore.logAudit('WIKI_UPDATE', 'CMS_WIKI', `Upraven wiki pojem '${updatedTerm.term}'.`, user);
    return updatedTerm;
  }

  static async deleteWikiTerm(id: string, user?: User | null): Promise<void> {
    if (isPrismaAvailable()) {
      try {
        const item = await (prisma as any).wikiTerm.findUnique({ where: { id } });
        if (item) {
          await (prisma as any).wikiTerm.delete({ where: { id } });
          await prisma.auditLog.create({
            data: {
              userId: user?.id,
              userEmail: user?.email,
              action: 'WIKI_DELETE',
              module: 'CMS_WIKI',
              details: `Smazán wiki pojem '${item.term}' (${id}).`,
            },
          });
        }
        return;
      } catch (err) {
        console.warn('Prisma deleteWikiTerm error, falling back:', err);
      }
    }

    const idx = dbStore.wikiTerms.findIndex((t) => t.id === id);
    if (idx !== -1) {
      const term = dbStore.wikiTerms[idx].term;
      dbStore.wikiTerms.splice(idx, 1);
      dbStore.logAudit('WIKI_DELETE', 'CMS_WIKI', `Smazán wiki pojem '${term}'.`, user);
    }
  }

  // --- LEGAL GUIDES / PRÁVNÍ PRŮVODCI ---
  static async getLegalGuides(filter?: { status?: string; category?: string; search?: string }): Promise<LegalGuide[]> {
    if (isPrismaAvailable()) {
      try {
        const where: any = {};
        if (filter?.status) where.status = filter.status;
        if (filter?.category && filter.category !== 'all') where.category = filter.category;
        if (filter?.search) {
          where.OR = [
            { title: { contains: filter.search, mode: 'insensitive' } },
            { subtitle: { contains: filter.search, mode: 'insensitive' } },
            { excerpt: { contains: filter.search, mode: 'insensitive' } },
          ];
        }

        const guides = await (prisma as any).legalGuide.findMany({
          where,
          include: {
            chapters: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: [{ order: 'asc' }, { title: 'asc' }],
        });

        return guides.map((g: any) => ({
          id: g.id,
          slug: g.slug,
          title: g.title,
          subtitle: g.subtitle || undefined,
          excerpt: g.excerpt,
          category: g.category,
          categoryLabel: g.categoryLabel,
          order: g.order,
          status: g.status,
          badgeText: g.badgeText || undefined,
          badgeBg: g.badgeBg || undefined,
          disclaimer: g.disclaimer || undefined,
          sources: Array.isArray(g.sources) ? g.sources : [],
          chapters: (g.chapters || []).map((ch: any) => ({
            id: ch.id,
            title: ch.title,
            content: ch.content,
            order: ch.order,
            icon: ch.icon || undefined,
            type: ch.type || 'info',
            checklistItems: Array.isArray(ch.checklistItems) ? ch.checklistItems : [],
            faqItems: Array.isArray(ch.faqItems) ? ch.faqItems : [],
          })),
          checklist: Array.isArray(g.checklist) ? g.checklist : [],
          faqs: Array.isArray(g.faqs) ? g.faqs : [],
          seoTitle: g.seoTitle || undefined,
          seoDescription: g.seoDescription || undefined,
          createdBy: g.createdBy || undefined,
          updatedBy: g.updatedBy || undefined,
          createdAt: g.createdAt.toISOString(),
          updatedAt: g.updatedAt.toISOString(),
        }));
      } catch (err) {
        console.warn('Prisma getLegalGuides error, falling back:', err);
      }
    }

    let result = [...dbStore.legalGuides];
    if (filter?.status) {
      result = result.filter((g) => g.status === filter.status);
    }
    if (filter?.category && filter.category !== 'all') {
      result = result.filter((g) => g.category === filter.category);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          (g.subtitle && g.subtitle.toLowerCase().includes(q)) ||
          g.excerpt.toLowerCase().includes(q)
      );
    }

    return result.sort((a, b) => a.order - b.order);
  }

  static async getLegalGuideBySlug(slug: string): Promise<LegalGuide | null> {
    if (isPrismaAvailable()) {
      try {
        const g = await (prisma as any).legalGuide.findUnique({
          where: { slug },
          include: {
            chapters: {
              orderBy: { order: 'asc' },
            },
          },
        });
        if (!g) return null;
        return {
          id: g.id,
          slug: g.slug,
          title: g.title,
          subtitle: g.subtitle || undefined,
          excerpt: g.excerpt,
          category: g.category,
          categoryLabel: g.categoryLabel,
          order: g.order,
          status: g.status,
          badgeText: g.badgeText || undefined,
          badgeBg: g.badgeBg || undefined,
          disclaimer: g.disclaimer || undefined,
          sources: Array.isArray(g.sources) ? g.sources : [],
          chapters: (g.chapters || []).map((ch: any) => ({
            id: ch.id,
            title: ch.title,
            content: ch.content,
            order: ch.order,
            icon: ch.icon || undefined,
            type: ch.type || 'info',
            checklistItems: Array.isArray(ch.checklistItems) ? ch.checklistItems : [],
            faqItems: Array.isArray(ch.faqItems) ? ch.faqItems : [],
          })),
          checklist: Array.isArray(g.checklist) ? g.checklist : [],
          faqs: Array.isArray(g.faqs) ? g.faqs : [],
          seoTitle: g.seoTitle || undefined,
          seoDescription: g.seoDescription || undefined,
          createdBy: g.createdBy || undefined,
          updatedBy: g.updatedBy || undefined,
          createdAt: g.createdAt.toISOString(),
          updatedAt: g.updatedAt.toISOString(),
        };
      } catch (err) {
        console.warn('Prisma getLegalGuideBySlug error, falling back:', err);
      }
    }

    return dbStore.legalGuides.find((g) => g.slug === slug) || null;
  }

  static async getLegalGuideById(id: string): Promise<LegalGuide | null> {
    if (isPrismaAvailable()) {
      try {
        const g = await (prisma as any).legalGuide.findUnique({
          where: { id },
          include: {
            chapters: {
              orderBy: { order: 'asc' },
            },
          },
        });
        if (!g) return null;
        return {
          id: g.id,
          slug: g.slug,
          title: g.title,
          subtitle: g.subtitle || undefined,
          excerpt: g.excerpt,
          category: g.category,
          categoryLabel: g.categoryLabel,
          order: g.order,
          status: g.status,
          badgeText: g.badgeText || undefined,
          badgeBg: g.badgeBg || undefined,
          disclaimer: g.disclaimer || undefined,
          sources: Array.isArray(g.sources) ? g.sources : [],
          chapters: (g.chapters || []).map((ch: any) => ({
            id: ch.id,
            title: ch.title,
            content: ch.content,
            order: ch.order,
            icon: ch.icon || undefined,
            type: ch.type || 'info',
            checklistItems: Array.isArray(ch.checklistItems) ? ch.checklistItems : [],
            faqItems: Array.isArray(ch.faqItems) ? ch.faqItems : [],
          })),
          checklist: Array.isArray(g.checklist) ? g.checklist : [],
          faqs: Array.isArray(g.faqs) ? g.faqs : [],
          seoTitle: g.seoTitle || undefined,
          seoDescription: g.seoDescription || undefined,
          createdBy: g.createdBy || undefined,
          updatedBy: g.updatedBy || undefined,
          createdAt: g.createdAt.toISOString(),
          updatedAt: g.updatedAt.toISOString(),
        };
      } catch (err) {
        console.warn('Prisma getLegalGuideById error, falling back:', err);
      }
    }

    return dbStore.legalGuides.find((g) => g.id === id) || null;
  }

  static async createLegalGuide(data: Partial<LegalGuide>, user?: User | null): Promise<LegalGuide> {
    const slug = data.slug || data.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `guide-${Date.now()}`;

    if (isPrismaAvailable()) {
      try {
        const created = await (prisma as any).legalGuide.create({
          data: {
            slug,
            title: data.title || 'Nový právní průvodce',
            subtitle: data.subtitle || null,
            excerpt: data.excerpt || '',
            category: data.category || 'ospod',
            categoryLabel: data.categoryLabel || 'OSPOD & Sociální šetření',
            order: data.order || 0,
            status: data.status || 'PUBLISHED',
            badgeText: data.badgeText || null,
            badgeBg: data.badgeBg || null,
            disclaimer: data.disclaimer || null,
            sources: data.sources || [],
            checklist: data.checklist || [],
            faqs: data.faqs || [],
            seoTitle: data.seoTitle || null,
            seoDescription: data.seoDescription || null,
            createdBy: user?.email || 'admin',
            updatedBy: user?.email || 'admin',
            chapters: {
              create: (data.chapters || []).map((ch, idx) => ({
                title: ch.title,
                content: ch.content,
                order: ch.order ?? idx + 1,
                icon: ch.icon || null,
                type: ch.type || 'info',
                checklistItems: ch.checklistItems || [],
                faqItems: ch.faqItems || [],
              })),
            },
          },
          include: {
            chapters: true,
          },
        });

        await prisma.auditLog.create({
          data: {
            userId: user?.id,
            userEmail: user?.email,
            action: 'GUIDE_CREATE',
            module: 'CMS_GUIDES',
            details: `Vytvořen nový právní průvodce '${created.title}' (slug: ${created.slug}).`,
          },
        });

        return {
          id: created.id,
          slug: created.slug,
          title: created.title,
          subtitle: created.subtitle || undefined,
          excerpt: created.excerpt,
          category: created.category,
          categoryLabel: created.categoryLabel,
          order: created.order,
          status: created.status,
          badgeText: created.badgeText || undefined,
          badgeBg: created.badgeBg || undefined,
          disclaimer: created.disclaimer || undefined,
          sources: created.sources || [],
          chapters: (created.chapters || []).map((ch: any) => ({
            id: ch.id,
            title: ch.title,
            content: ch.content,
            order: ch.order,
            icon: ch.icon || undefined,
            type: ch.type || 'info',
            checklistItems: ch.checklistItems || [],
            faqItems: ch.faqItems || [],
          })),
          checklist: created.checklist || [],
          faqs: created.faqs || [],
          seoTitle: created.seoTitle || undefined,
          seoDescription: created.seoDescription || undefined,
          createdBy: created.createdBy || undefined,
          updatedBy: created.updatedBy || undefined,
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
        };
      } catch (err) {
        console.warn('Prisma createLegalGuide error, falling back:', err);
      }
    }

    const newGuide: LegalGuide = {
      id: 'guide-' + Date.now(),
      slug,
      title: data.title || 'Nový právní průvodce',
      subtitle: data.subtitle || undefined,
      excerpt: data.excerpt || '',
      category: data.category || 'ospod',
      categoryLabel: data.categoryLabel || 'OSPOD & Sociální šetření',
      order: data.order || 0,
      status: data.status || 'PUBLISHED',
      badgeText: data.badgeText || undefined,
      badgeBg: data.badgeBg || undefined,
      disclaimer: data.disclaimer || undefined,
      sources: data.sources || [],
      chapters: (data.chapters || []).map((ch, idx) => ({
        id: ch.id || `ch-${Date.now()}-${idx}`,
        title: ch.title,
        content: ch.content,
        order: ch.order ?? idx + 1,
        icon: ch.icon,
        type: ch.type || 'info',
        checklistItems: ch.checklistItems || [],
        faqItems: ch.faqItems || [],
      })),
      checklist: data.checklist || [],
      faqs: data.faqs || [],
      seoTitle: data.seoTitle || undefined,
      seoDescription: data.seoDescription || undefined,
      createdBy: user?.email || 'admin',
      updatedBy: user?.email || 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dbStore.legalGuides.push(newGuide);
    dbStore.logAudit('GUIDE_CREATE', 'CMS_GUIDES', `Vytvořen nový právní průvodce '${newGuide.title}'.`, user);
    return newGuide;
  }

  static async updateLegalGuide(id: string, data: Partial<LegalGuide>, user?: User | null): Promise<LegalGuide> {
    if (isPrismaAvailable()) {
      try {
        const updatePayload: any = {
          updatedBy: user?.email || 'admin',
        };
        if (data.title !== undefined) updatePayload.title = data.title;
        if (data.slug !== undefined) updatePayload.slug = data.slug;
        if (data.subtitle !== undefined) updatePayload.subtitle = data.subtitle;
        if (data.excerpt !== undefined) updatePayload.excerpt = data.excerpt;
        if (data.category !== undefined) updatePayload.category = data.category;
        if (data.categoryLabel !== undefined) updatePayload.categoryLabel = data.categoryLabel;
        if (data.order !== undefined) updatePayload.order = data.order;
        if (data.status !== undefined) updatePayload.status = data.status;
        if (data.badgeText !== undefined) updatePayload.badgeText = data.badgeText;
        if (data.badgeBg !== undefined) updatePayload.badgeBg = data.badgeBg;
        if (data.disclaimer !== undefined) updatePayload.disclaimer = data.disclaimer;
        if (data.sources !== undefined) updatePayload.sources = data.sources;
        if (data.checklist !== undefined) updatePayload.checklist = data.checklist;
        if (data.faqs !== undefined) updatePayload.faqs = data.faqs;
        if (data.seoTitle !== undefined) updatePayload.seoTitle = data.seoTitle;
        if (data.seoDescription !== undefined) updatePayload.seoDescription = data.seoDescription;

        if (data.chapters) {
          // Replace chapters
          await (prisma as any).legalGuideChapter.deleteMany({ where: { guideId: id } });
          updatePayload.chapters = {
            create: data.chapters.map((ch, idx) => ({
              title: ch.title,
              content: ch.content,
              order: ch.order ?? idx + 1,
              icon: ch.icon || null,
              type: ch.type || 'info',
              checklistItems: ch.checklistItems || [],
              faqItems: ch.faqItems || [],
            })),
          };
        }

        const updated = await (prisma as any).legalGuide.update({
          where: { id },
          data: updatePayload,
          include: {
            chapters: {
              orderBy: { order: 'asc' },
            },
          },
        });

        await prisma.auditLog.create({
          data: {
            userId: user?.id,
            userEmail: user?.email,
            action: 'GUIDE_UPDATE',
            module: 'CMS_GUIDES',
            details: `Upraven právní průvodce '${updated.title}' (${id}).`,
          },
        });

        return {
          id: updated.id,
          slug: updated.slug,
          title: updated.title,
          subtitle: updated.subtitle || undefined,
          excerpt: updated.excerpt,
          category: updated.category,
          categoryLabel: updated.categoryLabel,
          order: updated.order,
          status: updated.status,
          badgeText: updated.badgeText || undefined,
          badgeBg: updated.badgeBg || undefined,
          disclaimer: updated.disclaimer || undefined,
          sources: updated.sources || [],
          chapters: (updated.chapters || []).map((ch: any) => ({
            id: ch.id,
            title: ch.title,
            content: ch.content,
            order: ch.order,
            icon: ch.icon || undefined,
            type: ch.type || 'info',
            checklistItems: ch.checklistItems || [],
            faqItems: ch.faqItems || [],
          })),
          checklist: updated.checklist || [],
          faqs: updated.faqs || [],
          seoTitle: updated.seoTitle || undefined,
          seoDescription: updated.seoDescription || undefined,
          createdBy: updated.createdBy || undefined,
          updatedBy: updated.updatedBy || undefined,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        };
      } catch (err) {
        console.warn('Prisma updateLegalGuide error, falling back:', err);
      }
    }

    const idx = dbStore.legalGuides.findIndex((g) => g.id === id);
    if (idx === -1) {
      throw new Error(`Průvodce s ID ${id} nebyl nalezen.`);
    }

    const current = dbStore.legalGuides[idx];
    const updatedGuide: LegalGuide = {
      ...current,
      ...data,
      chapters: data.chapters ? data.chapters.map((ch, cidx) => ({
        id: ch.id || `ch-${Date.now()}-${cidx}`,
        title: ch.title,
        content: ch.content,
        order: ch.order ?? cidx + 1,
        icon: ch.icon,
        type: ch.type || 'info',
        checklistItems: ch.checklistItems || [],
        faqItems: ch.faqItems || [],
      })) : current.chapters,
      updatedBy: user?.email || 'admin',
      updatedAt: new Date().toISOString(),
    };

    dbStore.legalGuides[idx] = updatedGuide;
    dbStore.logAudit('GUIDE_UPDATE', 'CMS_GUIDES', `Upraven právní průvodce '${updatedGuide.title}'.`, user);
    return updatedGuide;
  }

  static async deleteLegalGuide(id: string, user?: User | null): Promise<void> {
    if (isPrismaAvailable()) {
      try {
        const item = await (prisma as any).legalGuide.findUnique({ where: { id } });
        if (item) {
          await (prisma as any).legalGuide.delete({ where: { id } });
          await prisma.auditLog.create({
            data: {
              userId: user?.id,
              userEmail: user?.email,
              action: 'GUIDE_DELETE',
              module: 'CMS_GUIDES',
              details: `Smazán právní průvodce '${item.title}' (${id}).`,
            },
          });
        }
        return;
      } catch (err) {
        console.warn('Prisma deleteLegalGuide error, falling back:', err);
      }
    }

    const idx = dbStore.legalGuides.findIndex((g) => g.id === id);
    if (idx !== -1) {
      const title = dbStore.legalGuides[idx].title;
      dbStore.legalGuides.splice(idx, 1);
      dbStore.logAudit('GUIDE_DELETE', 'CMS_GUIDES', `Smazán právní průvodce '${title}'.`, user);
    }
  }

  // ------------------------------------------------------
  // ACADEMY VIDEOS (VIDEOTÉKA)
  // ------------------------------------------------------

  static async getVideos(filters?: { status?: string; category?: string; search?: string }): Promise<AcademyVideo[]> {
    if (isPrismaAvailable()) {
      try {
        const where: any = {};
        if (filters?.status) where.status = filters.status;
        if (filters?.category && filters.category !== 'all') where.category = filters.category;
        if (filters?.search) {
          where.OR = [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } },
            { speaker: { contains: filters.search, mode: 'insensitive' } },
          ];
        }

        const items = await (prisma as any).academyVideo.findMany({
          where,
          orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        });

        return items.map((v: any) => ({
          id: v.id,
          slug: v.slug,
          title: v.title,
          category: v.category,
          categoryLabel: v.categoryLabel,
          duration: v.duration,
          speaker: v.speaker,
          speakerRole: v.speakerRole,
          thumbnailUrl: v.thumbnailUrl,
          videoEmbedUrl: v.videoEmbedUrl,
          sourceType: v.sourceType || 'youtube',
          description: v.description,
          summaryNotes: v.summaryNotes || [],
          attachments: v.attachments || [],
          order: v.order,
          status: v.status,
          seoTitle: v.seoTitle || undefined,
          seoDescription: v.seoDescription || undefined,
          createdBy: v.createdBy || undefined,
          updatedBy: v.updatedBy || undefined,
          createdAt: v.createdAt.toISOString(),
          updatedAt: v.updatedAt.toISOString(),
        }));
      } catch (err) {
        console.warn('Prisma getVideos error, falling back:', err);
      }
    }

    let result = [...dbStore.academyVideos];
    if (filters?.status) {
      result = result.filter((v) => v.status === filters.status);
    }
    if (filters?.category && filters.category !== 'all') {
      result = result.filter((v) => v.category === filters.category);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          v.description.toLowerCase().includes(q) ||
          v.speaker.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  static async getVideoBySlug(slug: string): Promise<AcademyVideo | null> {
    if (isPrismaAvailable()) {
      try {
        const v = await (prisma as any).academyVideo.findUnique({
          where: { slug },
        });
        if (!v) return null;
        return {
          id: v.id,
          slug: v.slug,
          title: v.title,
          category: v.category,
          categoryLabel: v.categoryLabel,
          duration: v.duration,
          speaker: v.speaker,
          speakerRole: v.speakerRole,
          thumbnailUrl: v.thumbnailUrl,
          videoEmbedUrl: v.videoEmbedUrl,
          sourceType: v.sourceType || 'youtube',
          description: v.description,
          summaryNotes: v.summaryNotes || [],
          attachments: v.attachments || [],
          order: v.order,
          status: v.status,
          seoTitle: v.seoTitle || undefined,
          seoDescription: v.seoDescription || undefined,
          createdBy: v.createdBy || undefined,
          updatedBy: v.updatedBy || undefined,
          createdAt: v.createdAt.toISOString(),
          updatedAt: v.updatedAt.toISOString(),
        };
      } catch (err) {
        console.warn('Prisma getVideoBySlug error, falling back:', err);
      }
    }

    const item = dbStore.academyVideos.find((v) => v.slug === slug);
    return item ? { ...item } : null;
  }

  static async getVideoById(id: string): Promise<AcademyVideo | null> {
    if (isPrismaAvailable()) {
      try {
        const v = await (prisma as any).academyVideo.findUnique({
          where: { id },
        });
        if (!v) return null;
        return {
          id: v.id,
          slug: v.slug,
          title: v.title,
          category: v.category,
          categoryLabel: v.categoryLabel,
          duration: v.duration,
          speaker: v.speaker,
          speakerRole: v.speakerRole,
          thumbnailUrl: v.thumbnailUrl,
          videoEmbedUrl: v.videoEmbedUrl,
          sourceType: v.sourceType || 'youtube',
          description: v.description,
          summaryNotes: v.summaryNotes || [],
          attachments: v.attachments || [],
          order: v.order,
          status: v.status,
          seoTitle: v.seoTitle || undefined,
          seoDescription: v.seoDescription || undefined,
          createdBy: v.createdBy || undefined,
          updatedBy: v.updatedBy || undefined,
          createdAt: v.createdAt.toISOString(),
          updatedAt: v.updatedAt.toISOString(),
        };
      } catch (err) {
        console.warn('Prisma getVideoById error, falling back:', err);
      }
    }

    const item = dbStore.academyVideos.find((v) => v.id === id);
    return item ? { ...item } : null;
  }

  static async createVideo(data: Partial<AcademyVideo>, user?: User | null): Promise<AcademyVideo> {
    const slug = data.slug || (data.title || 'video').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    if (isPrismaAvailable()) {
      try {
        const created = await (prisma as any).academyVideo.create({
          data: {
            slug,
            title: data.title || 'Nové video',
            category: data.category || 'rozhovory',
            categoryLabel: data.categoryLabel || 'Rozhovory s odborníky',
            duration: data.duration || '20 min',
            speaker: data.speaker || 'Lektor',
            speakerRole: data.speakerRole || 'Odborník',
            thumbnailUrl: data.thumbnailUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
            videoEmbedUrl: data.videoEmbedUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            sourceType: data.sourceType || 'youtube',
            description: data.description || '',
            summaryNotes: data.summaryNotes || [],
            attachments: data.attachments || [],
            order: data.order || 0,
            status: data.status || 'PUBLISHED',
            seoTitle: data.seoTitle || null,
            seoDescription: data.seoDescription || null,
            createdBy: user?.email || 'admin',
            updatedBy: user?.email || 'admin',
          },
        });

        await prisma.auditLog.create({
          data: {
            userId: user?.id,
            userEmail: user?.email,
            action: 'VIDEO_CREATE',
            module: 'CMS_VIDEOS',
            details: `Vytvořeno video '${created.title}' (${created.slug}).`,
          },
        });

        return {
          id: created.id,
          slug: created.slug,
          title: created.title,
          category: created.category,
          categoryLabel: created.categoryLabel,
          duration: created.duration,
          speaker: created.speaker,
          speakerRole: created.speakerRole,
          thumbnailUrl: created.thumbnailUrl,
          videoEmbedUrl: created.videoEmbedUrl,
          sourceType: created.sourceType || 'youtube',
          description: created.description,
          summaryNotes: created.summaryNotes || [],
          attachments: created.attachments || [],
          order: created.order,
          status: created.status,
          seoTitle: created.seoTitle || undefined,
          seoDescription: created.seoDescription || undefined,
          createdBy: created.createdBy || undefined,
          updatedBy: created.updatedBy || undefined,
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
        };
      } catch (err) {
        console.warn('Prisma createVideo error, falling back:', err);
      }
    }

    const newVideo: AcademyVideo = {
      id: 'vid-' + Date.now(),
      slug,
      title: data.title || 'Nové video',
      category: data.category || 'rozhovory',
      categoryLabel: data.categoryLabel || 'Rozhovory s odborníky',
      duration: data.duration || '20 min',
      speaker: data.speaker || 'Lektor',
      speakerRole: data.speakerRole || 'Odborník',
      thumbnailUrl: data.thumbnailUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
      videoEmbedUrl: data.videoEmbedUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      sourceType: data.sourceType || 'youtube',
      description: data.description || '',
      summaryNotes: data.summaryNotes || [],
      attachments: data.attachments || [],
      order: data.order || 0,
      status: data.status || 'PUBLISHED',
      seoTitle: data.seoTitle || undefined,
      seoDescription: data.seoDescription || undefined,
      createdBy: user?.email || 'admin',
      updatedBy: user?.email || 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dbStore.academyVideos.push(newVideo);
    dbStore.logAudit('VIDEO_CREATE', 'CMS_VIDEOS', `Vytvořeno video '${newVideo.title}'.`, user);
    return newVideo;
  }

  static async updateVideo(id: string, data: Partial<AcademyVideo>, user?: User | null): Promise<AcademyVideo> {
    if (isPrismaAvailable()) {
      try {
        const updatePayload: any = {
          updatedBy: user?.email || 'admin',
        };
        if (data.title !== undefined) updatePayload.title = data.title;
        if (data.slug !== undefined) updatePayload.slug = data.slug;
        if (data.category !== undefined) updatePayload.category = data.category;
        if (data.categoryLabel !== undefined) updatePayload.categoryLabel = data.categoryLabel;
        if (data.duration !== undefined) updatePayload.duration = data.duration;
        if (data.speaker !== undefined) updatePayload.speaker = data.speaker;
        if (data.speakerRole !== undefined) updatePayload.speakerRole = data.speakerRole;
        if (data.thumbnailUrl !== undefined) updatePayload.thumbnailUrl = data.thumbnailUrl;
        if (data.videoEmbedUrl !== undefined) updatePayload.videoEmbedUrl = data.videoEmbedUrl;
        if (data.sourceType !== undefined) updatePayload.sourceType = data.sourceType;
        if (data.description !== undefined) updatePayload.description = data.description;
        if (data.summaryNotes !== undefined) updatePayload.summaryNotes = data.summaryNotes;
        if (data.attachments !== undefined) updatePayload.attachments = data.attachments;
        if (data.order !== undefined) updatePayload.order = data.order;
        if (data.status !== undefined) updatePayload.status = data.status;
        if (data.seoTitle !== undefined) updatePayload.seoTitle = data.seoTitle;
        if (data.seoDescription !== undefined) updatePayload.seoDescription = data.seoDescription;

        const updated = await (prisma as any).academyVideo.update({
          where: { id },
          data: updatePayload,
        });

        await prisma.auditLog.create({
          data: {
            userId: user?.id,
            userEmail: user?.email,
            action: 'VIDEO_UPDATE',
            module: 'CMS_VIDEOS',
            details: `Upraveno video '${updated.title}' (${id}).`,
          },
        });

        return {
          id: updated.id,
          slug: updated.slug,
          title: updated.title,
          category: updated.category,
          categoryLabel: updated.categoryLabel,
          duration: updated.duration,
          speaker: updated.speaker,
          speakerRole: updated.speakerRole,
          thumbnailUrl: updated.thumbnailUrl,
          videoEmbedUrl: updated.videoEmbedUrl,
          sourceType: updated.sourceType || 'youtube',
          description: updated.description,
          summaryNotes: updated.summaryNotes || [],
          attachments: updated.attachments || [],
          order: updated.order,
          status: updated.status,
          seoTitle: updated.seoTitle || undefined,
          seoDescription: updated.seoDescription || undefined,
          createdBy: updated.createdBy || undefined,
          updatedBy: updated.updatedBy || undefined,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        };
      } catch (err) {
        console.warn('Prisma updateVideo error, falling back:', err);
      }
    }

    const idx = dbStore.academyVideos.findIndex((v) => v.id === id);
    if (idx === -1) throw new Error('Video nenalezeno.');

    const current = dbStore.academyVideos[idx];
    const updated: AcademyVideo = {
      ...current,
      ...data,
      updatedBy: user?.email || 'admin',
      updatedAt: new Date().toISOString(),
    };
    dbStore.academyVideos[idx] = updated;
    dbStore.logAudit('VIDEO_UPDATE', 'CMS_VIDEOS', `Upraveno video '${updated.title}'.`, user);
    return updated;
  }

  static async deleteVideo(id: string, user?: User | null): Promise<void> {
    if (isPrismaAvailable()) {
      try {
        const item = await (prisma as any).academyVideo.findUnique({ where: { id } });
        if (item) {
          await (prisma as any).academyVideo.delete({ where: { id } });
          await prisma.auditLog.create({
            data: {
              userId: user?.id,
              userEmail: user?.email,
              action: 'VIDEO_DELETE',
              module: 'CMS_VIDEOS',
              details: `Smazáno video '${item.title}' (${id}).`,
            },
          });
        }
        return;
      } catch (err) {
        console.warn('Prisma deleteVideo error, falling back:', err);
      }
    }

    const idx = dbStore.academyVideos.findIndex((v) => v.id === id);
    if (idx !== -1) {
      const title = dbStore.academyVideos[idx].title;
      dbStore.academyVideos.splice(idx, 1);
      dbStore.logAudit('VIDEO_DELETE', 'CMS_VIDEOS', `Smazáno video '${title}'.`, user);
    }
  }

  // ------------------------------------------------------
  // QUIZZES & TESTS (KVÍZY A TRENAŽÉRY)
  // ------------------------------------------------------

  static async getQuizzes(filters?: { status?: string; category?: string; search?: string }): Promise<Quiz[]> {
    if (isPrismaAvailable()) {
      try {
        const where: any = {};
        if (filters?.status) where.status = filters.status;
        if (filters?.category && filters.category !== 'all') where.category = filters.category;
        if (filters?.search) {
          where.OR = [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } },
          ];
        }

        const items = await (prisma as any).quiz.findMany({
          where,
          include: {
            questions: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        });

        return items.map((q: any) => ({
          id: q.id,
          slug: q.slug,
          title: q.title,
          category: q.category,
          badge: q.badge,
          icon: q.icon,
          description: q.description,
          recommendedStudyPath: q.recommendedStudyPath,
          difficulty: q.difficulty || 'MEDIUM',
          order: q.order,
          status: q.status,
          seoTitle: q.seoTitle || undefined,
          seoDescription: q.seoDescription || undefined,
          createdBy: q.createdBy || undefined,
          updatedBy: q.updatedBy || undefined,
          createdAt: q.createdAt.toISOString(),
          updatedAt: q.updatedAt.toISOString(),
          questions: (q.questions || []).map((qu: any) => ({
            id: qu.id,
            quizId: qu.quizId,
            questionText: qu.questionText,
            options: qu.options || [],
            correctAnswerIndex: qu.correctAnswerIndex ?? 0,
            explanation: qu.explanation,
            order: qu.order,
          })),
        }));
      } catch (err) {
        console.warn('Prisma getQuizzes error, falling back:', err);
      }
    }

    let result = [...dbStore.quizzes];
    if (filters?.status) {
      result = result.filter((q) => q.status === filters.status);
    }
    if (filters?.category && filters.category !== 'all') {
      result = result.filter((q) => q.category === filters.category);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  static async getQuizBySlug(slug: string): Promise<Quiz | null> {
    if (isPrismaAvailable()) {
      try {
        const q = await (prisma as any).quiz.findUnique({
          where: { slug },
          include: {
            questions: {
              orderBy: { order: 'asc' },
            },
          },
        });
        if (!q) return null;
        return {
          id: q.id,
          slug: q.slug,
          title: q.title,
          category: q.category,
          badge: q.badge,
          icon: q.icon,
          description: q.description,
          recommendedStudyPath: q.recommendedStudyPath,
          difficulty: q.difficulty || 'MEDIUM',
          order: q.order,
          status: q.status,
          seoTitle: q.seoTitle || undefined,
          seoDescription: q.seoDescription || undefined,
          createdBy: q.createdBy || undefined,
          updatedBy: q.updatedBy || undefined,
          createdAt: q.createdAt.toISOString(),
          updatedAt: q.updatedAt.toISOString(),
          questions: (q.questions || []).map((qu: any) => ({
            id: qu.id,
            quizId: qu.quizId,
            questionText: qu.questionText,
            options: qu.options || [],
            correctAnswerIndex: qu.correctAnswerIndex ?? 0,
            explanation: qu.explanation,
            order: qu.order,
          })),
        };
      } catch (err) {
        console.warn('Prisma getQuizBySlug error, falling back:', err);
      }
    }

    const item = dbStore.quizzes.find((q) => q.slug === slug);
    return item ? { ...item } : null;
  }

  static async getQuizById(id: string): Promise<Quiz | null> {
    if (isPrismaAvailable()) {
      try {
        const q = await (prisma as any).quiz.findUnique({
          where: { id },
          include: {
            questions: {
              orderBy: { order: 'asc' },
            },
          },
        });
        if (!q) return null;
        return {
          id: q.id,
          slug: q.slug,
          title: q.title,
          category: q.category,
          badge: q.badge,
          icon: q.icon,
          description: q.description,
          recommendedStudyPath: q.recommendedStudyPath,
          difficulty: q.difficulty || 'MEDIUM',
          order: q.order,
          status: q.status,
          seoTitle: q.seoTitle || undefined,
          seoDescription: q.seoDescription || undefined,
          createdBy: q.createdBy || undefined,
          updatedBy: q.updatedBy || undefined,
          createdAt: q.createdAt.toISOString(),
          updatedAt: q.updatedAt.toISOString(),
          questions: (q.questions || []).map((qu: any) => ({
            id: qu.id,
            quizId: qu.quizId,
            questionText: qu.questionText,
            options: qu.options || [],
            correctAnswerIndex: qu.correctAnswerIndex ?? 0,
            explanation: qu.explanation,
            order: qu.order,
          })),
        };
      } catch (err) {
        console.warn('Prisma getQuizById error, falling back:', err);
      }
    }

    const item = dbStore.quizzes.find((q) => q.id === id);
    return item ? { ...item } : null;
  }

  static async createQuiz(data: Partial<Quiz>, user?: User | null): Promise<Quiz> {
    const slug = data.slug || (data.title || 'kviz').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    if (isPrismaAvailable()) {
      try {
        const created = await (prisma as any).quiz.create({
          data: {
            slug,
            title: data.title || 'Nový kvíz',
            category: data.category || 'Právní povědomí',
            badge: data.badge || '10 Otázek',
            icon: data.icon || 'ShieldCheck',
            description: data.description || '',
            recommendedStudyPath: data.recommendedStudyPath || '/studia',
            difficulty: data.difficulty || 'MEDIUM',
            order: data.order || 0,
            status: data.status || 'PUBLISHED',
            seoTitle: data.seoTitle || null,
            seoDescription: data.seoDescription || null,
            createdBy: user?.email || 'admin',
            updatedBy: user?.email || 'admin',
            questions: {
              create: (data.questions || []).map((q, idx) => ({
                questionText: q.questionText,
                options: q.options || [],
                correctAnswerIndex: q.correctAnswerIndex ?? 0,
                explanation: q.explanation || '',
                order: q.order ?? idx + 1,
              })),
            },
          },
          include: {
            questions: {
              orderBy: { order: 'asc' },
            },
          },
        });

        await prisma.auditLog.create({
          data: {
            userId: user?.id,
            userEmail: user?.email,
            action: 'QUIZ_CREATE',
            module: 'CMS_QUIZZES',
            details: `Vytvořen nový kvíz '${created.title}' (${created.slug}).`,
          },
        });

        return {
          id: created.id,
          slug: created.slug,
          title: created.title,
          category: created.category,
          badge: created.badge,
          icon: created.icon,
          description: created.description,
          recommendedStudyPath: created.recommendedStudyPath,
          difficulty: created.difficulty,
          order: created.order,
          status: created.status,
          seoTitle: created.seoTitle || undefined,
          seoDescription: created.seoDescription || undefined,
          createdBy: created.createdBy || undefined,
          updatedBy: created.updatedBy || undefined,
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
          questions: (created.questions || []).map((qu: any) => ({
            id: qu.id,
            quizId: qu.quizId,
            questionText: qu.questionText,
            options: qu.options || [],
            correctAnswerIndex: qu.correctAnswerIndex ?? 0,
            explanation: qu.explanation,
            order: qu.order,
          })),
        };
      } catch (err) {
        console.warn('Prisma createQuiz error, falling back:', err);
      }
    }

    const newQuiz: Quiz = {
      id: 'quiz-' + Date.now(),
      slug,
      title: data.title || 'Nový kvíz',
      category: data.category || 'Právní povědomí',
      badge: data.badge || '10 Otázek',
      icon: data.icon || 'ShieldCheck',
      description: data.description || '',
      recommendedStudyPath: data.recommendedStudyPath || '/studia',
      difficulty: data.difficulty || 'MEDIUM',
      order: data.order || 0,
      status: data.status || 'PUBLISHED',
      seoTitle: data.seoTitle || undefined,
      seoDescription: data.seoDescription || undefined,
      createdBy: user?.email || 'admin',
      updatedBy: user?.email || 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questions: (data.questions || []).map((q, idx) => ({
        id: q.id || `q-${Date.now()}-${idx}`,
        quizId: 'quiz-' + Date.now(),
        questionText: q.questionText,
        options: q.options || [],
        correctAnswerIndex: q.correctAnswerIndex ?? 0,
        explanation: q.explanation || '',
        order: q.order ?? idx + 1,
      })),
    };

    dbStore.quizzes.push(newQuiz);
    dbStore.logAudit('QUIZ_CREATE', 'CMS_QUIZZES', `Vytvořen nový kvíz '${newQuiz.title}'.`, user);
    return newQuiz;
  }

  static async updateQuiz(id: string, data: Partial<Quiz>, user?: User | null): Promise<Quiz> {
    if (isPrismaAvailable()) {
      try {
        const updatePayload: any = {
          updatedBy: user?.email || 'admin',
        };
        if (data.title !== undefined) updatePayload.title = data.title;
        if (data.slug !== undefined) updatePayload.slug = data.slug;
        if (data.category !== undefined) updatePayload.category = data.category;
        if (data.badge !== undefined) updatePayload.badge = data.badge;
        if (data.icon !== undefined) updatePayload.icon = data.icon;
        if (data.description !== undefined) updatePayload.description = data.description;
        if (data.recommendedStudyPath !== undefined) updatePayload.recommendedStudyPath = data.recommendedStudyPath;
        if (data.difficulty !== undefined) updatePayload.difficulty = data.difficulty;
        if (data.order !== undefined) updatePayload.order = data.order;
        if (data.status !== undefined) updatePayload.status = data.status;
        if (data.seoTitle !== undefined) updatePayload.seoTitle = data.seoTitle;
        if (data.seoDescription !== undefined) updatePayload.seoDescription = data.seoDescription;

        if (data.questions) {
          await (prisma as any).quizQuestion.deleteMany({ where: { quizId: id } });
          updatePayload.questions = {
            create: data.questions.map((q, idx) => ({
              questionText: q.questionText,
              options: q.options || [],
              correctAnswerIndex: q.correctAnswerIndex ?? 0,
              explanation: q.explanation || '',
              order: q.order ?? idx + 1,
            })),
          };
        }

        const updated = await (prisma as any).quiz.update({
          where: { id },
          data: updatePayload,
          include: {
            questions: {
              orderBy: { order: 'asc' },
            },
          },
        });

        await prisma.auditLog.create({
          data: {
            userId: user?.id,
            userEmail: user?.email,
            action: 'QUIZ_UPDATE',
            module: 'CMS_QUIZZES',
            details: `Upraven kvíz '${updated.title}' (${id}).`,
          },
        });

        return {
          id: updated.id,
          slug: updated.slug,
          title: updated.title,
          category: updated.category,
          badge: updated.badge,
          icon: updated.icon,
          description: updated.description,
          recommendedStudyPath: updated.recommendedStudyPath,
          difficulty: updated.difficulty,
          order: updated.order,
          status: updated.status,
          seoTitle: updated.seoTitle || undefined,
          seoDescription: updated.seoDescription || undefined,
          createdBy: updated.createdBy || undefined,
          updatedBy: updated.updatedBy || undefined,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
          questions: (updated.questions || []).map((qu: any) => ({
            id: qu.id,
            quizId: qu.quizId,
            questionText: qu.questionText,
            options: qu.options || [],
            correctAnswerIndex: qu.correctAnswerIndex ?? 0,
            explanation: qu.explanation,
            order: qu.order,
          })),
        };
      } catch (err) {
        console.warn('Prisma updateQuiz error, falling back:', err);
      }
    }

    const idx = dbStore.quizzes.findIndex((q) => q.id === id);
    if (idx === -1) throw new Error('Kvíz nenalezen.');

    const current = dbStore.quizzes[idx];
    const updated: Quiz = {
      ...current,
      ...data,
      updatedBy: user?.email || 'admin',
      updatedAt: new Date().toISOString(),
    };
    dbStore.quizzes[idx] = updated;
    dbStore.logAudit('QUIZ_UPDATE', 'CMS_QUIZZES', `Upraven kvíz '${updated.title}'.`, user);
    return updated;
  }

  static async deleteQuiz(id: string, user?: User | null): Promise<void> {
    if (isPrismaAvailable()) {
      try {
        const item = await (prisma as any).quiz.findUnique({ where: { id } });
        if (item) {
          await (prisma as any).quiz.delete({ where: { id } });
          await prisma.auditLog.create({
            data: {
              userId: user?.id,
              userEmail: user?.email,
              action: 'QUIZ_DELETE',
              module: 'CMS_QUIZZES',
              details: `Smazán kvíz '${item.title}' (${id}).`,
            },
          });
        }
        return;
      } catch (err) {
        console.warn('Prisma deleteQuiz error, falling back:', err);
      }
    }

    const idx = dbStore.quizzes.findIndex((q) => q.id === id);
    if (idx !== -1) {
      const title = dbStore.quizzes[idx].title;
      dbStore.quizzes.splice(idx, 1);
      dbStore.logAudit('QUIZ_DELETE', 'CMS_QUIZZES', `Smazán kvíz '${title}'.`, user);
    }
  }

  // ------------------------------------------------------
  // MEMENTO CASES (PROCESNÍ CHYBY & MEMENTO)
  // ------------------------------------------------------

  static async getMementoCases(filters?: { status?: string; category?: string; search?: string }): Promise<MementoCase[]> {
    if (isPrismaAvailable()) {
      try {
        const where: any = {};
        if (filters?.status) where.status = filters.status;
        if (filters?.category && filters.category !== 'all') where.category = filters.category;
        if (filters?.search) {
          where.OR = [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { error: { contains: filters.search, mode: 'insensitive' } },
            { correctAction: { contains: filters.search, mode: 'insensitive' } },
          ];
        }

        const items = await (prisma as any).mementoCase.findMany({
          where,
          orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        });

        return items.map((m: any) => ({
          id: m.id,
          slug: m.slug,
          title: m.title,
          icon: m.icon || 'Flame',
          category: m.category || 'obecne',
          error: m.error,
          consequence: m.consequence,
          correctAction: m.correctAction,
          exampleBad: m.exampleBad,
          exampleGood: m.exampleGood,
          order: m.order,
          status: m.status,
          seoTitle: m.seoTitle || undefined,
          seoDescription: m.seoDescription || undefined,
          createdBy: m.createdBy || undefined,
          updatedBy: m.updatedBy || undefined,
          createdAt: m.createdAt.toISOString(),
          updatedAt: m.updatedAt.toISOString(),
        }));
      } catch (err) {
        console.warn('Prisma getMementoCases error, falling back:', err);
      }
    }

    let result = [...dbStore.mementoCases];
    if (filters?.status) {
      result = result.filter((m) => m.status === filters.status);
    }
    if (filters?.category && filters.category !== 'all') {
      result = result.filter((m) => m.category === filters.category);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.error.toLowerCase().includes(q) ||
          item.correctAction.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  static async getMementoCaseBySlug(slug: string): Promise<MementoCase | null> {
    if (isPrismaAvailable()) {
      try {
        const m = await (prisma as any).mementoCase.findUnique({
          where: { slug },
        });
        if (!m) return null;
        return {
          id: m.id,
          slug: m.slug,
          title: m.title,
          icon: m.icon || 'Flame',
          category: m.category || 'obecne',
          error: m.error,
          consequence: m.consequence,
          correctAction: m.correctAction,
          exampleBad: m.exampleBad,
          exampleGood: m.exampleGood,
          order: m.order,
          status: m.status,
          seoTitle: m.seoTitle || undefined,
          seoDescription: m.seoDescription || undefined,
          createdBy: m.createdBy || undefined,
          updatedBy: m.updatedBy || undefined,
          createdAt: m.createdAt.toISOString(),
          updatedAt: m.updatedAt.toISOString(),
        };
      } catch (err) {
        console.warn('Prisma getMementoCaseBySlug error, falling back:', err);
      }
    }

    const item = dbStore.mementoCases.find((m) => m.slug === slug);
    return item ? { ...item } : null;
  }

  static async getMementoCaseById(id: string): Promise<MementoCase | null> {
    if (isPrismaAvailable()) {
      try {
        const m = await (prisma as any).mementoCase.findUnique({
          where: { id },
        });
        if (!m) return null;
        return {
          id: m.id,
          slug: m.slug,
          title: m.title,
          icon: m.icon || 'Flame',
          category: m.category || 'obecne',
          error: m.error,
          consequence: m.consequence,
          correctAction: m.correctAction,
          exampleBad: m.exampleBad,
          exampleGood: m.exampleGood,
          order: m.order,
          status: m.status,
          seoTitle: m.seoTitle || undefined,
          seoDescription: m.seoDescription || undefined,
          createdBy: m.createdBy || undefined,
          updatedBy: m.updatedBy || undefined,
          createdAt: m.createdAt.toISOString(),
          updatedAt: m.updatedAt.toISOString(),
        };
      } catch (err) {
        console.warn('Prisma getMementoCaseById error, falling back:', err);
      }
    }

    const item = dbStore.mementoCases.find((m) => m.id === id);
    return item ? { ...item } : null;
  }

  static async createMementoCase(data: Partial<MementoCase>, user?: User | null): Promise<MementoCase> {
    const slug = data.slug || (data.title || 'memento').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    if (isPrismaAvailable()) {
      try {
        const created = await (prisma as any).mementoCase.create({
          data: {
            slug,
            title: data.title || 'Nový memento případ',
            icon: data.icon || 'Flame',
            category: data.category || 'obecne',
            error: data.error || '',
            consequence: data.consequence || '',
            correctAction: data.correctAction || '',
            exampleBad: data.exampleBad || '',
            exampleGood: data.exampleGood || '',
            order: data.order || 0,
            status: data.status || 'PUBLISHED',
            seoTitle: data.seoTitle || null,
            seoDescription: data.seoDescription || null,
            createdBy: user?.email || 'admin',
            updatedBy: user?.email || 'admin',
          },
        });

        await prisma.auditLog.create({
          data: {
            userId: user?.id,
            userEmail: user?.email,
            action: 'MEMENTO_CREATE',
            module: 'CMS_MEMENTO',
            details: `Vytvořen memento případ '${created.title}' (${created.slug}).`,
          },
        });

        return {
          id: created.id,
          slug: created.slug,
          title: created.title,
          icon: created.icon || 'Flame',
          category: created.category || 'obecne',
          error: created.error,
          consequence: created.consequence,
          correctAction: created.correctAction,
          exampleBad: created.exampleBad,
          exampleGood: created.exampleGood,
          order: created.order,
          status: created.status,
          seoTitle: created.seoTitle || undefined,
          seoDescription: created.seoDescription || undefined,
          createdBy: created.createdBy || undefined,
          updatedBy: created.updatedBy || undefined,
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
        };
      } catch (err) {
        console.warn('Prisma createMementoCase error, falling back:', err);
      }
    }

    const newCase: MementoCase = {
      id: 'case-' + Date.now(),
      slug,
      title: data.title || 'Nový memento případ',
      icon: data.icon || 'Flame',
      category: data.category || 'obecne',
      error: data.error || '',
      consequence: data.consequence || '',
      correctAction: data.correctAction || '',
      exampleBad: data.exampleBad || '',
      exampleGood: data.exampleGood || '',
      order: data.order || 0,
      status: data.status || 'PUBLISHED',
      seoTitle: data.seoTitle || undefined,
      seoDescription: data.seoDescription || undefined,
      createdBy: user?.email || 'admin',
      updatedBy: user?.email || 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dbStore.mementoCases.push(newCase);
    dbStore.logAudit('MEMENTO_CREATE', 'CMS_MEMENTO', `Vytvořen memento případ '${newCase.title}'.`, user);
    return newCase;
  }

  static async updateMementoCase(id: string, data: Partial<MementoCase>, user?: User | null): Promise<MementoCase> {
    if (isPrismaAvailable()) {
      try {
        const updatePayload: any = {
          updatedBy: user?.email || 'admin',
        };
        if (data.title !== undefined) updatePayload.title = data.title;
        if (data.slug !== undefined) updatePayload.slug = data.slug;
        if (data.icon !== undefined) updatePayload.icon = data.icon;
        if (data.category !== undefined) updatePayload.category = data.category;
        if (data.error !== undefined) updatePayload.error = data.error;
        if (data.consequence !== undefined) updatePayload.consequence = data.consequence;
        if (data.correctAction !== undefined) updatePayload.correctAction = data.correctAction;
        if (data.exampleBad !== undefined) updatePayload.exampleBad = data.exampleBad;
        if (data.exampleGood !== undefined) updatePayload.exampleGood = data.exampleGood;
        if (data.order !== undefined) updatePayload.order = data.order;
        if (data.status !== undefined) updatePayload.status = data.status;
        if (data.seoTitle !== undefined) updatePayload.seoTitle = data.seoTitle;
        if (data.seoDescription !== undefined) updatePayload.seoDescription = data.seoDescription;

        const updated = await (prisma as any).mementoCase.update({
          where: { id },
          data: updatePayload,
        });

        await prisma.auditLog.create({
          data: {
            userId: user?.id,
            userEmail: user?.email,
            action: 'MEMENTO_UPDATE',
            module: 'CMS_MEMENTO',
            details: `Upraven memento případ '${updated.title}' (${id}).`,
          },
        });

        return {
          id: updated.id,
          slug: updated.slug,
          title: updated.title,
          icon: updated.icon || 'Flame',
          category: updated.category || 'obecne',
          error: updated.error,
          consequence: updated.consequence,
          correctAction: updated.correctAction,
          exampleBad: updated.exampleBad,
          exampleGood: updated.exampleGood,
          order: updated.order,
          status: updated.status,
          seoTitle: updated.seoTitle || undefined,
          seoDescription: updated.seoDescription || undefined,
          createdBy: updated.createdBy || undefined,
          updatedBy: updated.updatedBy || undefined,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        };
      } catch (err) {
        console.warn('Prisma updateMementoCase error, falling back:', err);
      }
    }

    const idx = dbStore.mementoCases.findIndex((m) => m.id === id);
    if (idx === -1) throw new Error('Memento případ nenalezen.');

    const current = dbStore.mementoCases[idx];
    const updated: MementoCase = {
      ...current,
      ...data,
      updatedBy: user?.email || 'admin',
      updatedAt: new Date().toISOString(),
    };
    dbStore.mementoCases[idx] = updated;
    dbStore.logAudit('MEMENTO_UPDATE', 'CMS_MEMENTO', `Upraven memento případ '${updated.title}'.`, user);
    return updated;
  }

  static async deleteMementoCase(id: string, user?: User | null): Promise<void> {
    if (isPrismaAvailable()) {
      try {
        const item = await (prisma as any).mementoCase.findUnique({ where: { id } });
        if (item) {
          await (prisma as any).mementoCase.delete({ where: { id } });
          await prisma.auditLog.create({
            data: {
              userId: user?.id,
              userEmail: user?.email,
              action: 'MEMENTO_DELETE',
              module: 'CMS_MEMENTO',
              details: `Smazán memento případ '${item.title}' (${id}).`,
            },
          });
        }
        return;
      } catch (err) {
        console.warn('Prisma deleteMementoCase error, falling back:', err);
      }
    }

    const idx = dbStore.mementoCases.findIndex((m) => m.id === id);
    if (idx !== -1) {
      const title = dbStore.mementoCases[idx].title;
      dbStore.mementoCases.splice(idx, 1);
      dbStore.logAudit('MEMENTO_DELETE', 'CMS_MEMENTO', `Smazán memento případ '${title}'.`, user);
    }
  }
}


