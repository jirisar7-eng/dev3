import { Router } from 'express';
import { subjektService } from '../services/subjektService';

const router = Router();

// GET /api/subjekty - Get all subjekty with optional filtering
router.get('/', async (req, res) => {
  try {
    const { type, region, kraj, city, search, minRating } = req.query;
    const filterRegion = (region || kraj) as string;
    const items = await subjektService.getSubjekty({
      type: type as string,
      region: filterRegion,
      kraj: filterRegion,
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

// POST /api/subjekty/:id/reviews - Add Review to Subjekt or Pracovnik
router.post('/:id/reviews', async (req, res) => {
  try {
    const subjektId = req.params.id;
    const {
      rating,
      supportSharedCare,
      professionalism,
      speedAndDeadlines,
      pracovnikId,
      objektivita,
      komunikace,
      rychlost,
      comment,
      isAnonymous,
      userId
    } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({ error: 'Chybí hodnocení nebo slovní komentář' });
    }

    if (pracovnikId) {
      if (objektivita === undefined || komunikace === undefined || rychlost === undefined) {
        return res.status(400).json({ error: 'Chybí hodnocení některého z dílčích kritérií pracovníka (objektivita, komunikace, rychlost)' });
      }
    } else {
      if (supportSharedCare === undefined || professionalism === undefined || speedAndDeadlines === undefined) {
        return res.status(400).json({ error: 'Chybí hodnocení některého z dílčích kritérií instituce (podpora střídavé péče, věcnost, rychlost)' });
      }
    }

    const review = await subjektService.addReview({
      subjektId,
      pracovnikId,
      userId,
      rating: Number(rating),
      supportSharedCare: supportSharedCare !== undefined ? Number(supportSharedCare) : undefined,
      professionalism: professionalism !== undefined ? Number(professionalism) : undefined,
      speedAndDeadlines: speedAndDeadlines !== undefined ? Number(speedAndDeadlines) : undefined,
      objektivita: objektivita !== undefined ? Number(objektivita) : undefined,
      komunikace: komunikace !== undefined ? Number(komunikace) : undefined,
      rychlost: rychlost !== undefined ? Number(rychlost) : undefined,
      comment,
      isAnonymous: isAnonymous !== undefined ? Boolean(isAnonymous) : true,
    });

    return res.status(201).json(review);
  } catch (error) {
    console.error('Error adding review:', error);
    return res.status(500).json({ error: 'Chyba při ukládání recenze' });
  }
});

// POST /api/subjekty/:id/pracovnici - Add worker to Subjekt
router.post('/:id/pracovnici', async (req, res) => {
  try {
    const subjektId = req.params.id;
    const { jmeno, pozice, telefon, email, kancelar } = req.body;

    if (!jmeno) {
      return res.status(400).json({ error: 'Chybí jméno pracovníka' });
    }

    const pracovnik = await subjektService.addPracovnik({
      subjektId,
      jmeno,
      pozice,
      telefon,
      email,
      kancelar,
    });

    return res.status(201).json(pracovnik);
  } catch (error) {
    console.error('Error adding pracovnik:', error);
    return res.status(500).json({ error: 'Chyba při přidávání pracovníka' });
  }
});

export default router;
