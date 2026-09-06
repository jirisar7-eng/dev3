import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { toPublicSubjektDto } from '../src/services/subjektService';
import { geocodeRateLimiter } from '../src/routes/subjektRoutes';
import { parseAuthToken, requireAuth } from '../src/middleware/authMiddleware';

describe('MASTER-IMPLEMENT-05A: Mapa Subjektů Verified Profile & Geocode Security', () => {

  const JWT_SECRET = process.env.JWT_SECRET || 'test-only-not-a-production-secret';
  process.env.JWT_SECRET = JWT_SECRET;

  // --------------------------------------------------------------------------
  // 1. PUBLIC DTO & METADATA LEAK PREVENTION
  // --------------------------------------------------------------------------
  describe('1. Public DTO Security & Metadata Leak Prevention', () => {
    test('public DTO strips all internal audit IDs and sensitive reviewer metadata from verifiedProfile', () => {
      const internalSubjekt: any = {
        id: 'subj-ostrava-01',
        nazev: 'Okresní soud v Ostravě',
        typ: 'SOUD',
        adresa: 'U Soudu 6187',
        mesto: 'Ostrava',
        kraj: 'Moravskoslezský kraj',
        createdById: 'usr-creator',
        verifiedById: 'usr-verifier',
        verifiedAt: new Date('2026-01-15T10:00:00.000Z'),
        reviews: [
          { id: 'rev-1', userId: 'usr-reviewer-private', hodnoceni: 5, text: 'V pořádku' }
        ],
        verifiedProfile: {
          id: 'vp-ostrava-01',
          subjektId: 'subj-ostrava-01',
          status: 'VERIFIED',
          officialName: 'Okresní soud v Ostravě',
          officialEmail: 'podatelna@osoud.ostrava.justice.cz',
          officialPhone: '+420 596 972 111',
          dataBoxId: 'c8rab3k',
          bookingUrl: 'https://rezervace.justice.cz',
          appointmentRequired: true,
          accessibility: 'Bezbariérový vstup bočním vchodem, výtah k dispozici',
          submissionMethods: '["DATA_BOX","POST","IN_PERSON"]',
          openingHours: JSON.stringify({
            monday: { isOpen: true, intervals: [{ from: '08:00', to: '15:30', type: 'STANDARD' }] },
            tuesday: { isOpen: false, intervals: [] }
          }),
          verifiedById: 'usr-admin-top-secret',
          createdById: 'usr-auto-crawler',
          reviewedById: 'usr-moderator-private',
          rejectionReason: 'Internal reviewer note: previously rejected due to bad phone',
          informationSources: [
            { id: 'src-1', sourceUrl: 'https://justice.cz', reviewerNotes: 'Internal verify check' }
          ],
          verifiedAt: new Date('2026-02-10T12:00:00.000Z'),
          lastCheckedAt: new Date('2026-02-10T12:00:00.000Z'),
          staleAfterDays: 180,
        }
      };

      const publicDto = toPublicSubjektDto(internalSubjekt);

      // Root subject level checks
      assert.strictEqual(publicDto.createdById, undefined, 'createdById must be stripped');
      assert.strictEqual(publicDto.verifiedById, undefined, 'verifiedById must be stripped');
      assert.strictEqual(publicDto.reviews[0].userId, undefined, 'Reviewer userId must be stripped');

      // Verified Profile presence & security checks
      assert.ok(publicDto.verifiedProfile, 'verifiedProfile must be present for VERIFIED status');
      assert.strictEqual(publicDto.verifiedProfile.status, 'VERIFIED');
      assert.strictEqual(publicDto.verifiedProfile.dataBoxId, 'c8rab3k');
      assert.strictEqual(publicDto.verifiedProfile.bookingUrl, 'https://rezervace.justice.cz');
      assert.strictEqual(publicDto.verifiedProfile.appointmentRequired, true);
      assert.strictEqual(publicDto.verifiedProfile.accessibility, 'Bezbariérový vstup bočním vchodem, výtah k dispozici');

      // CRITICAL: Internal metadata MUST BE stripped
      assert.strictEqual((publicDto.verifiedProfile as any).verifiedById, undefined, 'verifiedById must be stripped');
      assert.strictEqual((publicDto.verifiedProfile as any).createdById, undefined, 'createdById must be stripped');
      assert.strictEqual((publicDto.verifiedProfile as any).reviewedById, undefined, 'reviewedById must be stripped');
      assert.strictEqual((publicDto.verifiedProfile as any).rejectionReason, undefined, 'rejectionReason must be stripped');
      assert.strictEqual((publicDto.verifiedProfile as any).informationSources, undefined, 'informationSources array must be stripped');

      // Opening hours parsing verification
      assert.strictEqual(typeof publicDto.verifiedProfile.openingHours, 'object', 'openingHours must be parsed as object');
      assert.strictEqual((publicDto.verifiedProfile.openingHours as any).monday.isOpen, true);
      assert.ok(publicDto.verifiedProfile.openingHoursRaw, 'openingHoursRaw must be preserved');
    });

    test('public DTO strips PENDING_REVIEW and REJECTED profiles completely', () => {
      const pendingSubjekt: any = {
        id: 'subj-02',
        nazev: 'Neprověřený subjekt',
        verifiedProfile: {
          id: 'vp-02',
          status: 'PENDING_REVIEW',
          dataBoxId: 'unverified-box',
          appointmentRequired: true
        }
      };
      assert.strictEqual(toPublicSubjektDto(pendingSubjekt).verifiedProfile, null, 'PENDING_REVIEW profile must be null in public DTO');

      const rejectedSubjekt: any = {
        id: 'subj-03',
        nazev: 'Odmítnutý subjekt',
        verifiedProfile: {
          id: 'vp-03',
          status: 'REJECTED',
          dataBoxId: 'rejected-box',
          appointmentRequired: true
        }
      };
      assert.strictEqual(toPublicSubjektDto(rejectedSubjekt).verifiedProfile, null, 'REJECTED profile must be null in public DTO');
    });

    test('public DTO allows STALE profile with warning status and sanitized metadata', () => {
      const staleSubjekt: any = {
        id: 'subj-05',
        nazev: 'Starší subjekt',
        verifiedProfile: {
          id: 'vp-05',
          status: 'STALE',
          dataBoxId: 'stale-box',
          verifiedById: 'usr-admin-private',
          informationSources: [{ id: 'src-1' }]
        }
      };

      const publicDto = toPublicSubjektDto(staleSubjekt);
      assert.ok(publicDto.verifiedProfile, 'STALE profile should be present');
      assert.strictEqual(publicDto.verifiedProfile.status, 'STALE');
      assert.strictEqual(publicDto.verifiedProfile.dataBoxId, 'stale-box');
      assert.strictEqual((publicDto.verifiedProfile as any).verifiedById, undefined, 'verifiedById must be stripped on STALE profile');
    });
  });

  // --------------------------------------------------------------------------
  // 2. UI CONTRACT & MAP DETAIL COMPONENT VALIDATION
  // --------------------------------------------------------------------------
  describe('2. UI Contract & Map Detail Component (MapaSubjektuView)', () => {
    test('MapaSubjektuView contains verified profile block with strict status check and all required fields', () => {
      const filePath = path.join(process.cwd(), 'src/components/public/MapaSubjektuView.tsx');
      const content = fs.readFileSync(filePath, 'utf8');

      // Strict status gating: only VERIFIED or STALE
      assert.ok(
        content.includes("detailSubjekt.verifiedProfile.status === 'VERIFIED' || detailSubjekt.verifiedProfile.status === 'STALE'"),
        'Must strictly check for VERIFIED or STALE status before rendering verified block'
      );

      // Header and badges
      assert.ok(content.includes('Ověřené úřední informace'), 'Must display "Ověřené úřední informace" header');
      assert.ok(content.includes('Aktivně ověřeno'), 'Must display "Aktivně ověřeno" badge for VERIFIED');
      assert.ok(content.includes('K přezkoumání'), 'Must display "K přezkoumání" badge for STALE');
      assert.ok(content.includes('Naposledy ověřeno:'), 'Must display date of last verification');

      // Datová schránka with copy button
      assert.ok(content.includes('ID datové schránky'), 'Must display ID datové schránky');
      assert.ok(content.includes('detailSubjekt.verifiedProfile.dataBoxId'), 'Must bind dataBoxId');
      assert.ok(content.includes('copiedDataBox'), 'Must support copy to clipboard state');

      // Nutnost objednání & bookingUrl
      assert.ok(content.includes('Objednání předem'), 'Must display "Objednání předem" label');
      assert.ok(content.includes('detailSubjekt.verifiedProfile.appointmentRequired'), 'Must check appointmentRequired');
      assert.ok(content.includes('safeBookingUrl'), 'Must validate bookingUrl safely');
      assert.ok(content.includes('Online rezervace'), 'Must render Online rezervace button for bookingUrl');

      // Bezbariérovost
      assert.ok(content.includes('Bezbariérový přístup'), 'Must display Bezbariérový přístup');
      assert.ok(content.includes('detailSubjekt.verifiedProfile.accessibility'), 'Must bind accessibility text');

      // Způsoby podání
      assert.ok(content.includes('Akceptované způsoby podání'), 'Must display Akceptované způsoby podání');
      assert.ok(content.includes('formattedSubmissionMethods'), 'Must format submission methods');

      // Úřední a otevírací hodiny
      assert.ok(content.includes('Úřední / otevírací hodiny'), 'Must display Úřední / otevírací hodiny');
      assert.ok(content.includes('renderedOpeningHours'), 'Must render structured weekly opening hours');

      // Security: no dangerous inner HTML
      assert.ok(!content.includes('dangerouslySetInnerHTML'), 'Must NEVER use dangerouslySetInnerHTML');
    });
  });

  // --------------------------------------------------------------------------
  // 3. GEOCODE RATE LIMITING & SECURITY (GAP-03)
  // --------------------------------------------------------------------------
  describe('3. Geocode Rate Limiting & Security (GAP-03)', () => {
    // Create an isolated Express app with rate-limited geocode endpoint
    const app = express();
    app.set('trust proxy', 1);
    app.use(express.json());
    app.use(parseAuthToken as any);

    // Mount geocode route with real geocodeRateLimiter and requireAuth
    app.post('/api/subjekty/geocode', geocodeRateLimiter, requireAuth as any, async (req: any, res: any) => {
      const { address, city } = req.body;
      if (!address && !city) {
        return res.status(400).json({ error: 'Nebylo zadáno město nebo adresa' });
      }
      return res.json({ lat: 50.087, lng: 14.421, name: `${address}, ${city}` });
    });

    // Valid test auth token for existing active user in dbStore
    const validToken = jwt.sign(
      { sub: 'usr-user', email: 'tata@tatovacesta.cz', role: 'USER', mfaVerified: true },
      JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '1h' }
    );

    test('unauthenticated request without token returns 401 and does not bypass requireAuth', async () => {
      const res = await request(app)
        .post('/api/subjekty/geocode')
        .send({ address: 'Václavské náměstí 1', city: 'Praha' });

      assert.strictEqual(res.status, 401, 'Must require authentication with 401');
    });

    test('authenticated request with valid token functions properly within rate limit', async () => {
      const res = await request(app)
        .post('/api/subjekty/geocode')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ address: 'Nádražní 10', city: 'Brno' });

      assert.strictEqual(res.status, 200, 'Authenticated request within limit should return 200');
      assert.strictEqual(res.body.lat, 50.087);
    });

    test('exceeding 20 requests per minute returns HTTP 429 Too Many Requests (Fail-Closed)', async () => {
      // Rapidly fire requests up to rate limit threshold (20 max)
      // Note: we already made 2 requests in tests above with the same IP
      let hit429 = false;
      let statusCode = 200;

      for (let i = 0; i < 25; i++) {
        const res = await request(app)
          .post('/api/subjekty/geocode')
          .set('Authorization', `Bearer ${validToken}`)
          .send({ address: `Ulice ${i}`, city: 'Praha' });

        statusCode = res.status;
        if (res.status === 429) {
          hit429 = true;
          assert.strictEqual(res.body.error, 'Příliš mnoho požadavků na geokódování. Zkuste to prosím za minutu.');
          break;
        }
      }

      assert.ok(hit429, 'Must hit HTTP 429 when rate limit of 20 req/min is exceeded');
    });
  });

  // --------------------------------------------------------------------------
  // 4. AUTHORITATIVE VERIFICATION STATUS & DEMO DATA SANITIZATION (MASTER-IMPLEMENT-07C-1)
  // --------------------------------------------------------------------------
  describe('4. Authoritative Verification Status & Demo Data Sanitization (MASTER-IMPLEMENT-07C-1)', () => {
    // 1. isVerified=true + no verifiedProfile -> no verified badge / verifiedProfile is undefined
    test('Case 1: isVerified=true + no verifiedProfile -> public DTO has undefined verifiedProfile (no badge)', () => {
      const subject: any = {
        id: 'legacy-01',
        nazev: 'Legacy Advokát',
        isVerified: true
      };
      const dto = toPublicSubjektDto(subject);
      assert.strictEqual(dto.verifiedProfile, undefined, 'verifiedProfile must be undefined despite isVerified=true');
    });

    // 2. isVerified=false + no verifiedProfile -> no verified badge / verifiedProfile is undefined
    test('Case 2: isVerified=false + no verifiedProfile -> public DTO has undefined verifiedProfile (no badge)', () => {
      const subject: any = {
        id: 'legacy-02',
        nazev: 'Unverified Subject',
        isVerified: false
      };
      const dto = toPublicSubjektDto(subject);
      assert.strictEqual(dto.verifiedProfile, undefined, 'verifiedProfile must be undefined');
    });

    // 3. isVerified=true + verifiedProfile.status=PENDING_REVIEW -> stripped in public DTO
    test('Case 3: isVerified=true + PENDING_REVIEW profile -> stripped in public DTO (no badge)', () => {
      const subject: any = {
        id: 'legacy-03',
        nazev: 'Pending Review Subject',
        isVerified: true,
        verifiedProfile: {
          id: 'vp-pending',
          status: 'PENDING_REVIEW',
          officialName: 'Pending Name'
        }
      };
      const dto = toPublicSubjektDto(subject);
      assert.strictEqual(dto.verifiedProfile, null, 'PENDING_REVIEW profile must be stripped (null) in public DTO');
    });

    // 4. isVerified=true + verifiedProfile.status=REJECTED -> stripped in public DTO
    test('Case 4: isVerified=true + REJECTED profile -> stripped in public DTO (no badge)', () => {
      const subject: any = {
        id: 'legacy-04',
        nazev: 'Rejected Subject',
        isVerified: true,
        verifiedProfile: {
          id: 'vp-rejected',
          status: 'REJECTED',
          officialName: 'Rejected Name'
        }
      };
      const dto = toPublicSubjektDto(subject);
      assert.strictEqual(dto.verifiedProfile, null, 'REJECTED profile must be stripped (null) in public DTO');
    });

    // 5. isVerified=true + verifiedProfile.status=STALE -> included as STALE, not actively VERIFIED
    test('Case 5: isVerified=true + STALE profile -> public DTO has status STALE (not actively verified)', () => {
      const subject: any = {
        id: 'legacy-05',
        nazev: 'Stale Subject',
        isVerified: true,
        verifiedProfile: {
          id: 'vp-stale',
          status: 'STALE',
          officialName: 'Stale Court',
          verifiedById: 'usr-internal-123'
        }
      };
      const dto = toPublicSubjektDto(subject);
      assert.ok(dto.verifiedProfile, 'STALE profile should be present');
      assert.strictEqual(dto.verifiedProfile.status, 'STALE');
      assert.notStrictEqual(dto.verifiedProfile.status, 'VERIFIED');
      assert.strictEqual((dto.verifiedProfile as any).verifiedById, undefined, 'Internal ID must be stripped');
    });

    // 6. isVerified=false + verifiedProfile.status=VERIFIED -> authoritative VERIFIED badge displayed
    test('Case 6: isVerified=false + VERIFIED profile -> public DTO has status VERIFIED (authoritative badge)', () => {
      const subject: any = {
        id: 'modern-06',
        nazev: 'Authoritative Verified Court',
        isVerified: false,
        verifiedProfile: {
          id: 'vp-verified',
          status: 'VERIFIED',
          officialName: 'Authoritative Court',
          verifiedAt: new Date('2026-02-01')
        }
      };
      const dto = toPublicSubjektDto(subject);
      assert.ok(dto.verifiedProfile, 'VERIFIED profile should be present');
      assert.strictEqual(dto.verifiedProfile.status, 'VERIFIED');
    });

    // 7. VERIFIED profile + internal metadata -> stripped in public DTO
    test('Case 7: VERIFIED profile with internal metadata -> verifiedById, createdById, reviewer IDs stripped', () => {
      const subject: any = {
        id: 'subj-07',
        nazev: 'Soud s interními audit daty',
        createdById: 'admin-private-1',
        verifiedById: 'admin-private-2',
        verifiedProfile: {
          id: 'vp-07',
          status: 'VERIFIED',
          createdById: 'admin-private-3',
          verifiedById: 'admin-private-4',
          informationSources: [
            {
              id: 'src-01',
              verifiedById: 'admin-private-5'
            }
          ]
        }
      };
      const dto = toPublicSubjektDto(subject);
      assert.strictEqual((dto as any).createdById, undefined, 'Subjekt.createdById must be stripped');
      assert.strictEqual((dto as any).verifiedById, undefined, 'Subjekt.verifiedById must be stripped');
      assert.strictEqual((dto.verifiedProfile as any).createdById, undefined, 'verifiedProfile.createdById must be stripped');
      assert.strictEqual((dto.verifiedProfile as any).verifiedById, undefined, 'verifiedProfile.verifiedById must be stripped');
      assert.strictEqual((dto.verifiedProfile as any).informationSources, undefined, 'raw internal informationSources must not leak');
    });

    // 8. 44 non-court subjects in nonOspodSubjekty -> isVerified === false, no verifiedProfile
    test('Case 8: All 44 non-court demo subjects in nonOspodSubjekty have isVerified === false and no verifiedProfile', async () => {
      const nonOspodPath = path.join(process.cwd(), 'src/data/nonOspodSubjekty.ts');
      const content = fs.readFileSync(nonOspodPath, 'utf8');

      // Check nonOspodSubjekty exported module dynamically or via require
      const { nonOspodSubjekty } = await import('../src/data/nonOspodSubjekty');
      const nonCourtSubjects = nonOspodSubjekty.filter(
        (s: any) => s.type === 'ZNALEC' || s.type === 'ADVOKAT' || s.type === 'PORADNA_CHARITA'
      );

      assert.strictEqual(nonCourtSubjects.length, 44, 'Must have exactly 44 non-court subjects');
      for (const item of nonCourtSubjects) {
        assert.strictEqual(item.isVerified, false, `Subject ${item.name} (${item.type}) must have isVerified: false`);
        assert.strictEqual((item as any).verifiedProfile, undefined, `Subject ${item.name} must not have verifiedProfile`);
      }
    });

    // 9. UI static assertion: MapaSubjektuView uses verifiedProfile.status === 'VERIFIED'
    test('Case 9: MapaSubjektuView verification badge uses verifiedProfile.status === "VERIFIED"', () => {
      const filePath = path.join(process.cwd(), 'src/components/public/MapaSubjektuView.tsx');
      const content = fs.readFileSync(filePath, 'utf8');

      assert.ok(
        content.includes("detailSubjekt.verifiedProfile?.status === 'VERIFIED'"),
        "MapaSubjektuView must gate verification badge strictly on verifiedProfile?.status === 'VERIFIED'"
      );
      assert.ok(
        !content.includes('{detailSubjekt.isVerified && ('),
        'MapaSubjektuView must NOT use detailSubjekt.isVerified for verification badge'
      );
    });

    // 10. UI static assertion: RegistrSubjektu uses verifiedProfile.status === 'VERIFIED'
    test('Case 10: RegistrSubjektu verification badge uses verifiedProfile.status === "VERIFIED"', () => {
      const filePath = path.join(process.cwd(), 'src/components/public/RegistrSubjektu.tsx');
      const content = fs.readFileSync(filePath, 'utf8');

      assert.ok(
        content.includes("item.verifiedProfile.status === 'VERIFIED'"),
        "RegistrSubjektu must check item.verifiedProfile.status === 'VERIFIED'"
      );
      assert.ok(
        !content.includes('item.isVerified ? ('),
        'RegistrSubjektu must NOT use item.isVerified for public verification badge'
      );
    });
  });
});
