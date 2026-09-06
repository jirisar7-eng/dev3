import { apiFetch } from '../utils/apiClient';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { subjektService, toPublicSubjektDto } from '../services/subjektService';
import { SubjectVerifiedInfoService } from '../services/subjectVerifiedInfoService';
import { requireAuth, requireRole } from '../middleware/authMiddleware';

const router = Router();

// Rate limiter for geocode: ~20 requests per 60 seconds per client/IP (GAP-03)
export const geocodeRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: { error: 'Příliš mnoho požadavků na geokódování. Zkuste to prosím za minutu.' },
});

// GET /api/subjekty - Get all subjekty with optional filtering
// P1: Public endpoint strictly enforces status = 'VERIFIED' for unprivileged callers.

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

    const user = (req as any).user;
    const isModeratorOrAdmin = user && (user.role === 'MODERATOR' || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN');

    // P1: Only authenticated moderators/admins can query statuses other than VERIFIED
    const requestedStatus = (isModeratorOrAdmin && typeof status === 'string') ? status : 'VERIFIED';

    const items = await subjektService.getSubjekty({
      type: type as string,
      region: filterRegion,
      kraj: filterRegion,
      city: city as string,
      search: search as string,
      status: requestedStatus,
      minRating: minRating ? Number(minRating) : undefined,
    });

    const sanitized = items.map(item => toPublicSubjektDto(item, isModeratorOrAdmin));
    return res.json(sanitized);
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




// POST /api/subjekty/geocode - Geocode address securely (Rate-limited, GAP-03)
router.post('/geocode', geocodeRateLimiter, requireAuth as any, async (req: any, res) => {
  try {
    const { address, city } = req.body;
    if (!address && !city) {
      return res.status(400).json({ error: 'Nebylo zadáno město nebo adresa' });
    }

    const query = `${address ? address + ', ' : ''}${city || ''}`.trim();

    // Mapy.cz API
    const apiKey = process.env.MAPY_API_KEY;
    if (apiKey) {
      const resp = await apiFetch(`https://api.mapy.cz/v1/geocode?query=${encodeURIComponent(query)}&apikey=${apiKey}`);
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
    const nomResp = await apiFetch(nomUrl, { headers: { 'User-Agent': 'dev3-app' } });
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


// ============================================================================
// REVIEW MODERATION ROUTES (Must precede /:id to avoid route parameter collision)
// ============================================================================

// GET /api/subjekty/reviews/pending - List pending reviews (Requires MODERATOR or ADMIN)
router.get('/reviews/pending', requireAuth as any, requireRole('MODERATOR') as any, async (req, res) => {
  try {
    const pending = await subjektService.getPendingReviews();
    return res.json(pending);
  } catch (error) {
    console.error('Error fetching pending reviews:', error);
    return res.status(500).json({ error: 'Chyba při načítání recenzí ke schválení' });
  }
});

// PATCH /api/subjekty/reviews/:id/status - Approve or reject review (Requires MODERATOR or ADMIN)
router.patch('/reviews/:id/status', requireAuth as any, requireRole('MODERATOR') as any, async (req, res) => {
  try {
    const { status } = req.body;
    if (status !== 'APPROVED' && status !== 'REJECTED') {
      return res.status(400).json({ error: 'Neplatný stav recenze (povoleno: APPROVED, REJECTED)' });
    }
    const updated = await subjektService.updateReviewStatus(req.params.id, status);
    return res.json(updated);
  } catch (error: any) {
    console.error('Error updating review status:', error);
    if (error?.message?.includes('Recenze nenalezena')) {
      return res.status(404).json({ error: 'Recenze nenalezena' });
    }
    return res.status(500).json({ error: 'Chyba při aktualizaci stavu recenze' });
  }
});

// DELETE /api/subjekty/reviews/:id - Delete review (Requires MODERATOR or ADMIN)
router.delete('/reviews/:id', requireAuth as any, requireRole('MODERATOR') as any, async (req, res) => {
  try {
    const result = await subjektService.deleteReview(req.params.id);
    if (!result.success) {
      return res.status(404).json({ error: result.error || 'Recenze nenalezena' });
    }
    return res.json({ success: true, message: 'Recenze byla smazána' });
  } catch (error) {
    console.error('Error deleting review:', error);
    return res.status(500).json({ error: 'Chyba při mazání recenze' });
  }
});

// ============================================================================
// FAZE P1 — ENDPOINTY PRO OVĚŘENÉ INFORMACE A MODERACI NÁVRHŮ ZDROJŮ
// ============================================================================

// PUT /api/subjekty/sources/:sourceId/review - Moderator/Admin reviews proposed source
router.put('/sources/:sourceId/review', requireAuth as any, requireRole('MODERATOR') as any, async (req: any, res) => {
  try {
    const { sourceId } = req.params;
    const { action, rejectionReason, subjektId } = req.body;

    if (action !== 'APPROVE' && action !== 'REJECT') {
      return res.status(400).json({ error: 'Neplatná akce. Povolené hodnoty: APPROVE, REJECT.' });
    }

    if (action === 'REJECT') {
      if (!rejectionReason || typeof rejectionReason !== 'string' || rejectionReason.trim().length < 5 || rejectionReason.trim().length > 500) {
        return res.status(400).json({ error: 'Důvod zamítnutí musí mít délku mezi 5 a 500 znaky.' });
      }
    }

    // Optional BOLA/IDOR check if subjektId is supplied in body
    if (subjektId) {
      const parentSubjekt = await subjektService.getSubjektById(subjektId);
      if (!parentSubjekt) {
        return res.status(404).json({ error: 'Subjekt nebo návrh nebyl nalezen.' });
      }
    }

    const result = await SubjectVerifiedInfoService.reviewSourceProposal(
      sourceId,
      {
        decision: action,
        rejectionReason: action === 'REJECT' ? rejectionReason.trim() : undefined,
      },
      req.user
    );

    return res.json(result);
  } catch (error: any) {
    if (error?.statusCode === 409 || error?.code === 'CONFLICT' || error?.message?.includes('již zpracován')) {
      return res.status(409).json({ error: error.message || 'Tento návrh byl již zpracován jiným moderátorem.' });
    }
    if (error?.statusCode === 403 || error?.code === 'FORBIDDEN' || error?.message?.includes('Nemůžete moderovat') || error?.message?.includes('oprávnění')) {
      return res.status(403).json({ error: error.message || 'Nemáte oprávnění k této akci.' });
    }
    if (error?.statusCode === 404 || error?.message?.includes('nebyl nalezen')) {
      return res.status(404).json({ error: error.message || 'Subjekt nebo návrh nebyl nalezen.' });
    }
    if (error?.statusCode === 400 || error?.message?.includes('Neplatné') || error?.message?.includes('povinné')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error reviewing source proposal:', error);
    return res.status(500).json({ error: 'Chyba při moderaci návrhu zdroje' });
  }
});

// GET /api/subjekty/:id/verified-profile - Public safe DTO for verified profile
router.get('/:id/verified-profile', async (req, res) => {
  try {
    const { id } = req.params;
    const subjekt = await subjektService.getSubjektById(id);
    if (!subjekt) {
      return res.status(404).json({ error: 'Subjekt nebo návrh nebyl nalezen.' });
    }

    const user = (req as any).user;
    const isModeratorOrAdmin = user && (user.role === 'MODERATOR' || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN');

    const profile = await SubjectVerifiedInfoService.getVerifiedProfile(id);
    if (!profile) {
      return res.json(null);
    }

    // Public DTO separation: strip internal audit metadata for unprivileged users
    if (!isModeratorOrAdmin) {
      if (profile.status !== 'VERIFIED' && profile.status !== 'STALE') {
        return res.json(null);
      }
      const {
        verifiedById: _vId,
        createdById: _cId,
        reviewedById: _rId,
        rejectionReason: _rReason,
        informationSources: _iSources,
        ...safeProfile
      } = profile as any;
      return res.json(safeProfile);
    }

    return res.json(profile);
  } catch (error) {
    console.error('Error fetching verified profile:', error);
    return res.status(500).json({ error: 'Chyba při načítání ověřeného profilu' });
  }
});

// GET /api/subjekty/:id/information-sources - Moderation list of sources for a subject
router.get('/:id/information-sources', requireAuth as any, requireRole('MODERATOR') as any, async (req, res) => {
  try {
    const { id } = req.params;
    const subjekt = await subjektService.getSubjektById(id);
    if (!subjekt) {
      return res.status(404).json({ error: 'Subjekt nebo návrh nebyl nalezen.' });
    }

    const status = req.query.status as any;
    const sources = await SubjectVerifiedInfoService.getInformationSources(id, status);
    return res.json(sources);
  } catch (error) {
    console.error('Error fetching information sources:', error);
    return res.status(500).json({ error: 'Chyba při načítání zdrojů informací' });
  }
});

// PUT /api/subjekty/:id/verified-profile - Direct admin update of verified profile
router.put('/:id/verified-profile', requireAuth as any, requireRole('ADMIN') as any, async (req: any, res) => {
  try {
    const { id } = req.params;
    const subjekt = await subjektService.getSubjektById(id);
    if (!subjekt) {
      return res.status(404).json({ error: 'Subjekt nebo návrh nebyl nalezen.' });
    }

    // Whitelist only allowed fields to prevent mass assignment
    const {
      officialWebsite,
      officialPhone,
      officialEmail,
      openingHours,
      appointmentRequired,
      bookingUrl,
      accessibility,
      dataBoxId,
      submissionMethods,
      staleAfterDays,
    } = req.body;

    const safeUpdateData = {
      officialWebsite,
      officialPhone,
      officialEmail,
      openingHours,
      appointmentRequired,
      bookingUrl,
      accessibility,
      dataBoxId,
      submissionMethods,
      staleAfterDays,
    };

    const updatedProfile = await SubjectVerifiedInfoService.updateVerifiedProfileDirect(
      id,
      safeUpdateData,
      req.user
    );

    return res.json(updatedProfile);
  } catch (error: any) {
    if (error?.statusCode === 403 || error?.message?.includes('oprávnění') || error?.message?.includes('Neautorizovaný')) {
      return res.status(403).json({ error: error.message || 'Nemáte oprávnění k této akci.' });
    }
    if (error?.statusCode === 400 || error?.message?.includes('Neplatn') || error?.message?.includes('Nevalidní') || error?.message?.includes('povinné')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error directly updating verified profile:', error);
    return res.status(500).json({ error: 'Chyba při přímé úpravě ověřeného profilu' });
  }
});

// GET /api/subjekty/:id - Get single Subjekt detail
// P1: Restricts unverified/rejected subjects to moderators, admins, or resource owners.
router.get('/:id', async (req, res) => {
  try {
    const item = await subjektService.getSubjektById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Subjekt nenalezen' });
    }

    const user = (req as any).user;
    const isModeratorOrAdmin = user && (user.role === 'MODERATOR' || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN');
    const isOwner = user && (item as any).createdById && (item as any).createdById === user.id;

    // Unverified/rejected subjects are not visible to the public
    if (item.status !== 'VERIFIED' && !isModeratorOrAdmin && !isOwner) {
      return res.status(404).json({ error: 'Subjekt nenalezen' });
    }

    const sanitized = toPublicSubjektDto(item, isModeratorOrAdmin || isOwner);
    return res.json(sanitized);
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
// P0: Always creates review with status 'PENDING'.
// P1: Validates numerical ratings (1-5), comment length, strips dangerous markup, prevents duplicates.
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

    // Validate rating
    const numRating = Number(rating);
    if (isNaN(numRating) || !Number.isFinite(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ error: 'Celkové hodnocení musí být v rozsahu 1 až 5 hvězdiček.' });
    }

    // Validate comment
    if (!comment || typeof comment !== 'string') {
      return res.status(400).json({ error: 'Slovní komentář je povinný.' });
    }
    const cleanComment = comment.trim().replace(/<[^>]*>?/gm, ''); // Strip HTML tags
    if (cleanComment.length < 5) {
      return res.status(400).json({ error: 'Slovní komentář je příliš krátký (minimum je 5 znaků).' });
    }
    if (cleanComment.length > 2000) {
      return res.status(400).json({ error: 'Slovní komentář přesahuje maximální povolenou délku 2000 znaků.' });
    }

    const validateCriterion = (val: any, label: string) => {
      if (val === undefined || val === null) return undefined;
      const n = Number(val);
      if (isNaN(n) || n < 1 || n > 5) {
        throw new Error(`Dílčí hodnocení "${label}" musí být v rozsahu 1 až 5.`);
      }
      return Math.round(n);
    };

    let parsedSupport: number | undefined;
    let parsedProf: number | undefined;
    let parsedSpeed: number | undefined;
    let parsedObj: number | undefined;
    let parsedKom: number | undefined;
    let parsedRych: number | undefined;

    try {
      if (pracovnikId) {
        parsedObj = validateCriterion(objektivita, 'objektivita');
        parsedKom = validateCriterion(komunikace, 'komunikace');
        parsedRych = validateCriterion(rychlost, 'rychlost');
        if (parsedObj === undefined || parsedKom === undefined || parsedRych === undefined) {
          return res.status(400).json({ error: 'Chybí hodnocení některého z dílčích kritérií pracovníka (objektivita, komunikace, rychlost).' });
        }
      } else {
        parsedSupport = validateCriterion(supportSharedCare, 'podpora střídavé péče');
        parsedProf = validateCriterion(professionalism, 'věcnost a profesionalita');
        parsedSpeed = validateCriterion(speedAndDeadlines, 'dodržování lhůt');
        if (parsedSupport === undefined || parsedProf === undefined || parsedSpeed === undefined) {
          return res.status(400).json({ error: 'Chybí hodnocení některého z dílčích kritérií instituce (podpora střídavé péče, věcnost, rychlost).' });
        }
      }
    } catch (valErr: any) {
      return res.status(400).json({ error: valErr.message });
    }

    const review = await subjektService.addReview({
      subjektId,
      pracovnikId,
      userId,
      rating: Math.round(numRating),
      supportSharedCare: parsedSupport,
      professionalism: parsedProf,
      speedAndDeadlines: parsedSpeed,
      objektivita: parsedObj,
      komunikace: parsedKom,
      rychlost: parsedRych,
      comment: cleanComment,
      isAnonymous: isAnonymous !== undefined ? Boolean(isAnonymous) : true,
    });

    return res.status(201).json({
      ...review,
      message: 'Hodnocení bylo uloženo a čeká na schválení moderátorem.',
    });
  } catch (error: any) {
    if (error?.message?.includes('DUPLICATE_REVIEW')) {
      return res.status(409).json({ error: 'Pro tento záznam jste již vložil(a) hodnocení.' });
    }
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
