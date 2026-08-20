import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();


const HELP_CATEGORIES = [
  { id: 'start', title: 'Jak začít s aplikací', description: 'Základní průvodce nastavením účtu a prvními kroky.', iconType: 'play' },
  { id: 'cases', title: 'Spis a dokumenty', description: 'Návody k nahrávání a správě právních dokumentů.', iconType: 'file' },
  { id: 'ai', title: 'AI Právní asistent', description: 'Využití AI pro analýzu případu a generování podání.', iconType: 'shield' },
  { id: 'support', title: 'Podpora a SOS', description: 'Co dělat v krizové situaci a jak kontaktovat podporu.', iconType: 'lifebuoy' }
];

router.get('/', async (req, res) => {
  try {
    const articles = await prisma.article.findMany({
      where: { published: true, categoryName: { startsWith: 'help-' } }
    });
    
    const sections = HELP_CATEGORIES.map(cat => ({
      id: cat.id,
      title: cat.title,
      description: cat.description,
      iconType: cat.iconType,
      articles: articles
        .filter(a => a.categoryName === `help-${cat.id}`)
        .map(a => ({ id: a.id, title: a.title, link: `/clanky/${a.slug}`, type: 'text' }))
    }));

    res.json(sections);
  } catch (error) {
    console.error('Error fetching help sections:', error);
    res.status(500).json({ error: 'Failed to fetch help sections' });
  }
});

export default router;
