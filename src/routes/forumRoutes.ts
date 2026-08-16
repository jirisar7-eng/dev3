import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { dbStore } from '../services/dbStore';
import { ForumThread, ForumPost } from '../types';

const router = Router();

/**
/ * GET /api/forum/threads
 * Načtení diskusních vláken z DB (s fallbackem na dbStore).
 * Podporuje filtrování podle kategorie (?category=care | gospod | court | experience | all)
 */
router.get('/threads', async (req: Request, res: Response) => {
  const categoryFilter = (req.query.category as string) || 'all';

  try {
    const whereCondition = categoryFilter !== 'all' ? { category: categoryFilter } : {};

    const dbThreads = await prisma.forumThread.findMany({
      where: whereCondition,
      include: {
        posts: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform parameters into consistent structure
    const threads = dbThreads.map((t: any) => ({
      id: t.id,
      category: t.category,
      title: t.title,
      author: t.author || 'Anonymní Otec',
      userId: t.userId,
      content: t.content,
      createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: t.updatedAt ? new Date(t.updatedAt).toISOString() : new Date().toISOString(),
      repliesCount: t.posts ? t.posts.length : 0,
      posts: (t.posts || []).map((p: any) => ({
        id: p.id,
        threadId: p.threadId,
        author: p.author || 'Anonymní Otec',
        userId: p.userId,
        text: p.content,
        content: p.content,
        createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
      })),
    }));

    return res.json(threads);
  } catch (error: any) {
    console.warn('[Forum API Warning] Nelze načíst vlákna z DB, používám dbStore:', error?.message);

    let filtered = dbStore.forumThreads;
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((t) => t.category === categoryFilter);
    }

    const threads = filtered.map((t) => {
      const postsForThread = dbStore.forumPosts.filter((p) => p.threadId === t.id);
      return {
        ...t,
        repliesCount: postsForThread.length,
        posts: postsForThread,
      };
    });

    return res.json(threads);
  }
});

/**
 * GET /api/forum/threads/:id
 * Detail konkrétního vlákna včetně všech odpovědí.
 */
router.get('/threads/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const dbThread = await prisma.forumThread.findUnique({
      where: { id },
      include: {
        posts: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!dbThread) {
      return res.status(404).json({ error: 'Diskuse nebyla nalezena.' });
    }

    const thread = {
      id: dbThread.id,
      category: dbThread.category,
      title: dbThread.title,
      author: dbThread.author || 'Anonymní Otec',
      userId: dbThread.userId,
      content: dbThread.content,
      createdAt: dbThread.createdAt ? new Date(dbThread.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: dbThread.updatedAt ? new Date(dbThread.updatedAt).toISOString() : new Date().toISOString(),
      repliesCount: dbThread.posts ? dbThread.posts.length : 0,
      posts: (dbThread.posts || []).map((p: any) => ({
        id: p.id,
        threadId: p.threadId,
        author: p.author || 'Anonymní Otec',
        userId: p.userId,
        text: p.content,
        content: p.content,
        createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
      })),
    };

    return res.json(thread);
  } catch (error: any) {
    console.warn('[Forum API Warning] Chyba při načítání detailu z DB, hledám v dbStore:', error?.message);

    const localThread = dbStore.forumThreads.find((t) => t.id === id);
    if (!localThread) {
      return res.status(404).json({ error: 'Diskuse nebyla nalezena.' });
    }

    const postsForThread = dbStore.forumPosts.filter((p) => p.threadId === id);
    return res.json({
      ...localThread,
      repliesCount: postsForThread.length,
      posts: postsForThread,
    });
  }
});

/**
 * POST /api/forum/threads
 * Založení nové diskuse v databázi.
 */
router.post('/threads', async (req: Request, res: Response) => {
  const { title, category, content, author } = req.body;

  if (!title || !title.trim() || !content || !content.trim()) {
    return res.status(400).json({ error: 'Název diskuse a obsah jsou povinné údaje.' });
  }

  const threadCategory = category || 'care';
  const threadAuthor = (author && author.trim()) ? author.trim() : 'Anonymní Otec';

  try {
    const newDbThread = await prisma.forumThread.create({
      data: {
        title: title.trim(),
        category: threadCategory,
        content: content.trim(),
        author: threadAuthor,
      },
      include: {
        posts: true,
      },
    });

    const createdThread = {
      id: newDbThread.id,
      category: newDbThread.category,
      title: newDbThread.title,
      author: newDbThread.author,
      content: newDbThread.content,
      createdAt: newDbThread.createdAt.toISOString(),
      updatedAt: newDbThread.updatedAt.toISOString(),
      repliesCount: 0,
      posts: [],
    };

    // Synchronize to dbStore
    dbStore.forumThreads.unshift(createdThread as ForumThread);

    return res.status(201).json(createdThread);
  } catch (error: any) {
    console.warn('[Forum API Error] Chyba při zápisu do DB, ukládám do in-memory dbStore:', error?.message);

    const newLocalThread: ForumThread = {
      id: 'thread-' + Date.now(),
      category: threadCategory,
      title: title.trim(),
      author: threadAuthor,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      repliesCount: 0,
      posts: [],
    };

    dbStore.forumThreads.unshift(newLocalThread);

    return res.status(201).json(newLocalThread);
  }
});

/**
 * POST /api/forum/threads/:id/posts (a alias /api/forum/threads/:id/replies)
 * Přidání odpovědi do diskuse.
 */
const handleAddPost = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { content, text, author } = req.body;

  const postText = (content || text || '').trim();
  if (!postText) {
    return res.status(400).json({ error: 'Obsah odpovědi nemůže být prázdný.' });
  }

  const postAuthor = (author && author.trim()) ? author.trim() : 'Anonymní Otec';

  try {
    // Check if thread exists
    const threadExists = await prisma.forumThread.findUnique({
      where: { id },
    });

    if (!threadExists) {
      // Check in local store
      const localExists = dbStore.forumThreads.find((t) => t.id === id);
      if (!localExists) {
        return res.status(404).json({ error: 'Diskuse nebyla nalezena.' });
      }
    }

    let createdPostObj: any = null;

    if (threadExists) {
      const newDbPost = await prisma.forumPost.create({
        data: {
          threadId: id,
          content: postText,
          author: postAuthor,
        },
      });

      createdPostObj = {
        id: newDbPost.id,
        threadId: newDbPost.threadId,
        author: newDbPost.author,
        text: newDbPost.content,
        content: newDbPost.content,
        createdAt: newDbPost.createdAt.toISOString(),
      };
    } else {
      createdPostObj = {
        id: 'post-' + Date.now(),
        threadId: id,
        author: postAuthor,
        text: postText,
        content: postText,
        createdAt: new Date().toISOString(),
      };
    }

    // Sync to dbStore
    dbStore.forumPosts.push(createdPostObj);

    return res.status(201).json(createdPostObj);
  } catch (error: any) {
    console.warn('[Forum API Error] Chyba při vytváření odpovědi v DB, ukládám do dbStore:', error?.message);

    const createdPostObj: ForumPost = {
      id: 'post-' + Date.now(),
      threadId: id,
      author: postAuthor,
      text: postText,
      content: postText,
      createdAt: new Date().toISOString(),
    };

    dbStore.forumPosts.push(createdPostObj);

    return res.status(201).json(createdPostObj);
  }
};

router.post('/threads/:id/posts', handleAddPost);
router.post('/threads/:id/replies', handleAddPost);

export default router;
