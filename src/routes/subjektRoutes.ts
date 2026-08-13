import { Router } from 'express';
import { subjektService } from '../services/subjektService';

const router = Router();

// GET /api/subjekty - Get all subjekty with optional filtering
router.get('/', async (req, res) => {
  try {
    const { type, region, city, search, minRating } = req.query;
    const items = await subjektService.getSubjekty({
      type: type as string,
      region: region as string,
      city: city as string,
      search: search as string,
      minRating: minRating ? Number(minRating) : undefined,
    });
    return res.json(items);
  } catch (error) {
    console.error('Error fetching subjekty:', error);
    return res.status(500).json({ error: 'Chyba při načítání subjektů' });
  }
});

// GET /api/subjekty/:id - Get single Subjekt detail
router.get('/:id', async (req, res) => {
  try {
    const item = await subjektService.getSubjektById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Subjekt nenalezen' });
    }
    return res.json(item);
  } catch (error) {
    console.error('Error fetching subjekt detail:', error);
    return res.status(500).json({ error: 'Chyba při načítání detailu subjektu' });
  }
});

// POST /api/subjekty - Create new Subjekt
router.post('/', async (req, res) => {
  try {
    const { type, name, titleBefore, position, institution, city, region, address, email, phone, website, isVerified } = req.body;

    if (!type || !name || !city || !region) {
      return res.status(400).json({ error: 'Chybí povinné údaje (typ, název, město, kraj)' });
    }

    const created = await subjektService.createSubjekt({
      type,
      name,
      titleBefore,
      position,
      institution,
      city,
      region,
      address,
      email,
      phone,
      website,
      isVerified,
    });

    return res.status(201).json(created);
  } catch (error) {
    console.error('Error creating subjekt:', error);
    return res.status(500).json({ error: 'Chyba při vytváření subjektu' });
  }
});

// PUT /api/subjekty/:id - Update Subjekt
router.put('/:id', async (req, res) => {
  try {
    const updated = await subjektService.updateSubjekt(req.params.id, req.body);
    return res.json(updated);
  } catch (error) {
    console.error('Error updating subjekt:', error);
    return res.status(500).json({ error: 'Chyba při úpravě subjektu' });
  }
});

// DELETE /api/subjekty/:id - Delete Subjekt
router.delete('/:id', async (req, res) => {
  try {
    await subjektService.deleteSubjekt(req.params.id);
    return res.json({ success: true, message: 'Subjekt byl smažen' });
  } catch (error) {
    console.error('Error deleting subjekt:', error);
    return res.status(500).json({ error: 'Chyba při mazání subjektu' });
  }
});

// POST /api/subjekty/:id/reviews - Add Review to Subjekt
router.post('/:id/reviews', async (req, res) => {
  try {
    const subjektId = req.params.id;
    const { rating, supportSharedCare, professionalism, speedAndDeadlines, comment, isAnonymous, userId } = req.body;

    if (!rating || !supportSharedCare || !professionalism || !speedAndDeadlines || !comment) {
      return res.status(400).json({ error: 'Chybí povinná hodnocení a komentář' });
    }

    const review = await subjektService.addReview({
      subjektId,
      userId,
      rating: Number(rating),
      supportSharedCare: Number(supportSharedCare),
      professionalism: Number(professionalism),
      speedAndDeadlines: Number(speedAndDeadlines),
      comment,
      isAnonymous: Boolean(isAnonymous),
    });

    return res.status(201).json(review);
  } catch (error) {
    console.error('Error adding review:', error);
    return res.status(500).json({ error: 'Chyba při ukládání recenze' });
  }
});

export default router;
