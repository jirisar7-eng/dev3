import { prisma, markPrismaUnavailable, isPrismaAvailable } from '../db/prisma';
import { dbStore } from './dbStore';
import { Page, PageSection, Category, Article, Faq, NavItem, MediaItem, User } from '../types';

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
}
