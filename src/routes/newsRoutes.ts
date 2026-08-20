import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();


router.get('/', async (req, res) => {
  try {
    const news = await prisma.newsItem.findMany({
      where: { published: true },
      orderBy: { date: 'desc' }
    });
    res.json(news);
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const newsItem = await prisma.newsItem.findUnique({
      where: { id: req.params.id }
    });
    if (!newsItem) return res.status(404).json({ error: 'News not found' });
    res.json(newsItem);
  } catch (error) {
    console.error('Error fetching news detail:', error);
    res.status(500).json({ error: 'Failed to fetch news detail' });
  }
});

export default router;
