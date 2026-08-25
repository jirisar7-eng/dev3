import { Router } from 'express';
import { subjektService } from '../services/subjektService';
import { requireAuth, requireRole } from '../middleware/authMiddleware';

const router = Router();

// GET /api/subjekty - Get all subjekty with optional filtering

// GET /api/subjekty/lookup?name=...
router.get('/lookup', async (req, res) => {
  try {
    const { name } = req.query;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Missing name parameter' });
    }
    const court = await subjektService.findCourtByFuzzyName(name);
    if (!court) {
      return res.status(404).json({ error: 'Court not found' });
    }
    return res.json(court);
  } catch (error) {
    console.error('Error looking up court:', error);
    return res.status(500).json({ error: 'Server error during lookup' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { type, region, kraj, city, search, minRating, status } = req.query;
    const filterRegion = (region || kraj) as string;
    const items = await subjektService.getSubjekty({
      type: type as string,
      region: filterRegion,
      kraj: filterRegion,
      city: city as string,
      search: search as string,
      status: status as string,
      minRating: minRating ? Number(minRating) : undefined,
    });
    return res.json(items);
  } catch (error) {
    console.error('Error fetching subjekty:', error);
    return res.status(500).json({ error: 'Chyba při načítání subjektů' });
  }
});

// POST /api/subjekty/verify-ico - Verify subject by IČO via server-side ARES v3
router.post('/verify-ico', async (req, res) => {
  try {
    const { ico } = req.body;
    if (!ico) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ICO',
          message: 'Nebylo zadáno IČO k ověření.',
        },
      });
    }

    const result = await subjektService.verifySubjectByIco(ico);
    return res.json(result);
  } catch (error: any) {
    console.error('Error in /api/subjekty/verify-ico:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: error?.message || 'Interní chyba při ověřování subjektu v ARES.',
      },
    });
  }
});

// GET /api/subjekty/verify-ico/:ico - Verify subject by IČO via GET param
router.get('/verify-ico/:ico', async (req, res) => {
  try {
    const { ico } = req.params;
    if (!ico) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ICO',
          message: 'Nebylo zadáno IČO k ověření.',
        },
      });
    }

    const result = await subjektService.verifySubjectByIco(ico);
    return res.json(result);
  } catch (error: any) {
    console.error('Error in /api/subjekty/verify-ico/:ico:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: error?.message || 'Interní chyba při ověřování subjektu v ARES.',
      },
    });
  }
});




// POST /api/subjekty/geocode - Geocode address securely
router.post('/geocode', requireAuth as any, async (req: any, res) => {
  try {
    const { address, city } = req.body;
    if (!address && !city) {
      return res.status(400).json({ error: 'Nebylo zadáno město nebo adresa' });
    }

    const query = `${address ? address + ', ' : ''}${city || ''}`.trim();

    // Mapy.cz API
    const apiKey = process.env.MAPY_API_KEY;
    if (apiKey) {
      const resp = await fetch(`https://api.mapy.cz/v1/geocode?query=${encodeURIComponent(query)}&apikey=${apiKey}`);
      if (resp.ok) {
        const data = await resp.json();
        const items = data?.items || [];
        if (items.length > 0) {
           return res.json({
             lat: items[0].position.lat,
             lng: items[0].position.lon, // Mapy.cz uses lon
             name: items[0].name,
             regionalStructure: items[0].regionalStructure
           });
        }
      }
    }

    // Fallback to Nominatim if key missing or failed
    const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=1`;
    const nomResp = await fetch(nomUrl, { headers: { 'User-Agent': 'dev3-app' } });
    if (nomResp.ok) {
      const data = await nomResp.json();
      if (data && data.length > 0) {
        return res.json({
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          name: data[0].display_name,
          address: data[0].address
        });
      }
    }

    return res.status(404).json({ error: 'Lokace nenalezena' });
  } catch (error) {
    console.error('Geocode error:', error);
    return res.status(500).json({ error: 'Chyba geokódování' });
  }
});

// GET /api/subjekty/queue - Moderator queue
router.get('/queue/pending', requireAuth as any, requireRole('MODERATOR') as any, async (req, res) => {
  try {
    const items = await subjektService.getSubjekty({ status: 'PENDING_VERIFICATION' });
    return res.json(items);
  } catch (error) {
    return res.status(500).json({ error: 'Chyba při načítání fronty' });
  }
});

// GET /api/subjekty/my/submissions - User's submissions
router.get('/my/submissions', requireAuth as any, async (req: any, res) => {
  try {
    const items = await subjektService.getSubjekty({ createdById: req.user.id });
    return res.json(items);
  } catch (error) {
    return res.status(500).json({ error: 'Chyba při načítání návrhů' });
  }
});

// POST /api/subjekty/submit - User submits a subject
router.post('/submit', requireAuth as any, async (req: any, res) => {
  try {
    const { type, name, titleBefore, position, institution, city, region, address, email, phone, website, lat, lng } = req.body;
    if (!type || !name || !city || !region) {
      return res.status(400).json({ error: 'Chybí povinné údaje (typ, název, město, kraj)' });
    }
    const created = await subjektService.createSubjekt({
      type, name, titleBefore, position, institution, city, region, address, email, phone, website,
      lat: typeof lat === 'number' ? lat : (lat ? parseFloat(lat) : undefined),
      lng: typeof lng === 'number' ? lng : (lng ? parseFloat(lng) : undefined),
      isVerified: false,
      status: 'PENDING_VERIFICATION',
      createdById: req.user.id
    });
    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ error: 'Chyba při odesílání návrhu' });
  }
});

// PUT /api/subjekty/:id/approve - Approve subject
router.put('/:id/approve', requireAuth as any, requireRole('MODERATOR') as any, async (req: any, res) => {
  try {
    const subj = await subjektService.getSubjektById(req.params.id);
    if (!subj) return res.status(404).json({ error: 'Subjekt nenalezen' });
    if ((subj as any).createdById === req.user.id) {
      return res.status(403).json({ error: 'Nemůžete schválit vlastní návrh' });
    }
    const updated = await subjektService.updateSubjekt(req.params.id, {
      ...req.body, // accept updates during approval
      status: 'VERIFIED',
      isVerified: true,
      verifiedById: req.user.id,
      verifiedAt: new Date()
    });
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Chyba při schvalování' });
  }
});

// PUT /api/subjekty/:id/reject - Reject subject
router.put('/:id/reject', requireAuth as any, requireRole('MODERATOR') as any, async (req: any, res) => {
  try {
    const subj = await subjektService.getSubjektById(req.params.id);
    if (!subj) return res.status(404).json({ error: 'Subjekt nenalezen' });
    const { rejectionReason } = req.body;
    if (!rejectionReason) return res.status(400).json({ error: 'Chybí důvod zamítnutí' });

    const updated = await subjektService.updateSubjekt(req.params.id, {
      status: 'REJECTED',
      isVerified: false,
      rejectedById: req.user.id,
      rejectedAt: new Date(),
      rejectionReason
    });
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'Chyba při zamítání' });
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

// POST /api/subjekty - Create new Subjekt (Requires ADMIN or MODERATOR)
router.post('/', requireAuth as any, requireRole('MODERATOR') as any, async (req, res) => {
  try {
    const { type, name, titleBefore, position, institution, city, region, address, email, phone, website, isVerified, lat, lng } = req.body;

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
      lat: typeof lat === 'number' ? lat : (lat ? parseFloat(lat) : undefined),
      lng: typeof lng === 'number' ? lng : (lng ? parseFloat(lng) : undefined),
    });

    return res.status(201).json(created);
  } catch (error) {
    console.error('Error creating subjekt:', error);
    return res.status(500).json({ error: 'Chyba při vytváření subjektu' });
  }
});

// PUT /api/subjekty/:id - Update Subjekt (Requires ADMIN or MODERATOR)
router.put('/:id', requireAuth as any, requireRole('MODERATOR') as any, async (req, res) => {
  try {
    const updated = await subjektService.updateSubjekt(req.params.id, req.body);
    return res.json(updated);
  } catch (error) {
    console.error('Error updating subjekt:', error);
    return res.status(500).json({ error: 'Chyba při úpravě subjektu' });
  }
});

// DELETE /api/subjekty/:id - Delete Subjekt (Requires ADMIN)
router.delete('/:id', requireAuth as any, requireRole('ADMIN') as any, async (req, res) => {
  try {
    await subjektService.deleteSubjekt(req.params.id);
    return res.json({ success: true, message: 'Subjekt byl smažen' });
  } catch (error) {
    console.error('Error deleting subjekt:', error);
    return res.status(500).json({ error: 'Chyba při mazání subjektu' });
  }
});

// POST /api/subjekty/:id/reviews - Add Review to Subjekt or Pracovnik (Requires Auth)
router.post('/:id/reviews', requireAuth as any, async (req: any, res) => {
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
      isAnonymous
    } = req.body;

    // Derived from cryptographically verified session
    const userId = req.user.id;

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

// POST /api/subjekty/:id/pracovnici - Add worker to Subjekt (Requires ADMIN or MODERATOR)
router.post('/:id/pracovnici', requireAuth as any, requireRole('MODERATOR') as any, async (req, res) => {
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
