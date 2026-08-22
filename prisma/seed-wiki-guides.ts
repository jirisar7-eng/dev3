import { prisma, isPrismaAvailable } from '../src/db/prisma';
import { DEFAULT_WIKI_TERMS } from '../src/data/wikiSeed';
import { DEFAULT_LEGAL_GUIDES } from '../src/data/legalGuidesSeed';

export async function runWikiGuidesSeed() {
  if (!isPrismaAvailable()) {
    console.log('[Prisma Seed] PostgreSQL databáze není dostupná, přeskakuji zápis WikiTermů a Průvodců.');
    return;
  }

  console.log('[Prisma Seed] Spouštím seedování Právní encyklopedie (Wiki) a Průvodců...');

  try {
    // 1. Seedování WikiTermů
    console.log(`[Prisma Seed] Importuji ${DEFAULT_WIKI_TERMS.length} pojmů do Wiki...`);
    for (const term of DEFAULT_WIKI_TERMS) {
      await (prisma as any).wikiTerm.upsert({
        where: { slug: term.slug },
        update: {
          term: term.term,
          firstLetter: term.firstLetter,
          category: term.category,
          categoryLabel: term.categoryLabel,
          citation: term.citation || null,
          definition: term.definition,
          practicalTips: term.practicalTips || [],
          relatedTerms: term.relatedTerms || [],
          order: term.order || 0,
          status: term.status || 'PUBLISHED',
          seoTitle: term.seoTitle || null,
          seoDescription: term.seoDescription || null,
          sources: term.sources || [],
        },
        create: {
          slug: term.slug,
          term: term.term,
          firstLetter: term.firstLetter,
          category: term.category,
          categoryLabel: term.categoryLabel,
          citation: term.citation || null,
          definition: term.definition,
          practicalTips: term.practicalTips || [],
          relatedTerms: term.relatedTerms || [],
          order: term.order || 0,
          status: term.status || 'PUBLISHED',
          seoTitle: term.seoTitle || null,
          seoDescription: term.seoDescription || null,
          sources: term.sources || [],
        },
      });
    }
    console.log('[Prisma Seed] WikiTerms úspěšně synchronizovány.');

    // 2. Seedování LegalGuides a jejich kapitol
    console.log(`[Prisma Seed] Importuji ${DEFAULT_LEGAL_GUIDES.length} Průvodců do DB...`);
    for (const guide of DEFAULT_LEGAL_GUIDES) {
      const guideData = {
        title: guide.title,
        subtitle: guide.subtitle || null,
        excerpt: guide.excerpt,
        category: guide.category,
        categoryLabel: guide.categoryLabel,
        order: guide.order || 0,
        status: guide.status || 'PUBLISHED',
        badgeText: guide.badgeText || null,
        badgeBg: guide.badgeBg || null,
        disclaimer: guide.disclaimer || null,
        sources: guide.sources || [],
        checklist: JSON.stringify(guide.checklist || []),
        faqs: JSON.stringify(guide.faqs || []),
        seoTitle: guide.seoTitle || null,
        seoDescription: guide.seoDescription || null,
      };

      const guideRecord = await (prisma as any).legalGuide.upsert({
        where: { slug: guide.slug },
        update: guideData,
        create: {
          id: guide.id,
          slug: guide.slug,
          ...guideData,
        },
      });

      // Smazat staré kapitoly a vytvořit nové pro zachování integrity
      await (prisma as any).legalGuideChapter.deleteMany({
        where: { guideId: guideRecord.id },
      });

      if (guide.chapters && guide.chapters.length > 0) {
        for (const chapter of guide.chapters) {
          await (prisma as any).legalGuideChapter.create({
            data: {
              id: chapter.id,
              guideId: guideRecord.id,
              title: chapter.title,
              content: chapter.content,
              order: chapter.order || 0,
              icon: chapter.icon || null,
              type: chapter.type || 'info',
              checklistItems: JSON.stringify(chapter.checklistItems || []),
              faqItems: JSON.stringify(chapter.faqItems || []),
            },
          });
        }
      }
    }
    console.log('[Prisma Seed] Právní průvodci a jejich kapitoly úspěšně synchronizováni.');
  } catch (err) {
    console.error('[Prisma Seed Error] Chyba při seedování Wiki a Průvodců:', err);
  }
}
