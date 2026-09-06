import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { subjektService, toPublicSubjektDto } from '../src/services/subjektService';
import { dbStore } from '../src/services/dbStore';

describe('REGISTR & HODNOCENÍ SUBJEKTŮ — Security, Moderation & Rating Recalculation Test Suite', () => {

  beforeEach(() => {
    // Reset dbStore test state
    dbStore.subjekty = [
      {
        id: 'subj-test-1',
        type: 'SOUD',
        name: 'Okresní soud v Testovicích',
        city: 'Testov',
        region: 'Jihomoravský kraj',
        address: 'Testovací 1',
        isVerified: true,
        status: 'VERIFIED',
        avgRating: 0.0,
        reviewCount: 0,
        createdById: 'admin-user-1',
        verifiedById: 'admin-user-1',
        verifiedAt: new Date(),
        rejectedById: null,
        rejectedAt: null,
        rejectionReason: null,
        createdAt: new Date(),
        pracovnici: [],
        reviews: [],
      } as any,
      {
        id: 'subj-test-unverified',
        type: 'OSPOD',
        name: 'OSPOD Testov (Pending)',
        city: 'Testov',
        region: 'Jihomoravský kraj',
        address: 'Náměstí 2',
        isVerified: false,
        status: 'PENDING_VERIFICATION',
        avgRating: 0.0,
        reviewCount: 0,
        createdById: 'user-submitter-9',
        verifiedById: null,
        verifiedAt: null,
        rejectedById: null,
        rejectedAt: null,
        rejectionReason: null,
        createdAt: new Date(),
        pracovnici: [],
        reviews: [],
      } as any,
    ];
    dbStore.reviews = [];
  });

  test('1. P0 Review Status: newly submitted review is forced to PENDING status regardless of input', async () => {
    const review = await subjektService.addReview({
      subjektId: 'subj-test-1',
      userId: 'user-123',
      rating: 5,
      supportSharedCare: 5,
      professionalism: 5,
      speedAndDeadlines: 5,
      comment: 'Výborný a vstřícný přístup soudce.',
      status: 'APPROVED' as any, // Client attempted to force APPROVED status
    });

    assert.strictEqual(review.status, 'PENDING', 'New review status must be forced to PENDING server-side');

    const pendingList = await subjektService.getPendingReviews();
    assert.strictEqual(pendingList.length, 1, 'Pending review must appear in moderation queue');
    assert.strictEqual(pendingList[0].id, review.id);
  });

  test('2. Rating Isolation: PENDING reviews do NOT inflate avgRating or reviewCount', async () => {
    await subjektService.addReview({
      subjektId: 'subj-test-1',
      userId: 'user-1',
      rating: 5,
      comment: 'Kvalitní rozhodování.',
    });

    const subj = await subjektService.getSubjektById('subj-test-1');
    assert.strictEqual(subj?.reviewCount, 0, 'reviewCount must remain 0 while review is PENDING');
    assert.strictEqual(subj?.avgRating, 0, 'avgRating must remain 0 while review is PENDING');
  });

  test('3. Review Approval Workflow & Rating Recalculation: approving review updates stats', async () => {
    const rev1 = await subjektService.addReview({
      subjektId: 'subj-test-1',
      userId: 'user-1',
      rating: 4,
      comment: 'Kvalitní rozhodování a dodržení lhůt.',
    });

    const rev2 = await subjektService.addReview({
      subjektId: 'subj-test-1',
      userId: 'user-2',
      rating: 2,
      comment: 'Dlouhé prodlevy mezi jednáními.',
    });

    // Approve first review
    await subjektService.updateReviewStatus(rev1.id, 'APPROVED');
    let subj = await subjektService.getSubjektById('subj-test-1');
    assert.strictEqual(subj?.reviewCount, 1, 'reviewCount should be 1 after approving 1 review');
    assert.strictEqual(subj?.avgRating, 4.0, 'avgRating should be 4.0');

    // Approve second review
    await subjektService.updateReviewStatus(rev2.id, 'APPROVED');
    subj = await subjektService.getSubjektById('subj-test-1');
    assert.strictEqual(subj?.reviewCount, 2, 'reviewCount should be 2 after approving 2 reviews');
    assert.strictEqual(subj?.avgRating, 3.0, 'avgRating should be (4+2)/2 = 3.0');

    // Reject second review
    await subjektService.updateReviewStatus(rev2.id, 'REJECTED');
    subj = await subjektService.getSubjektById('subj-test-1');
    assert.strictEqual(subj?.reviewCount, 1, 'reviewCount should drop to 1 after rejecting review');
    assert.strictEqual(subj?.avgRating, 4.0, 'avgRating should return to 4.0');
  });

  test('4. Duplicate Review Prevention: user cannot review same subject twice', async () => {
    await subjektService.addReview({
      subjektId: 'subj-test-1',
      userId: 'user-1',
      rating: 5,
      comment: 'První recenze uživatele.',
    });

    await assert.rejects(
      async () => {
        await subjektService.addReview({
          subjektId: 'subj-test-1',
          userId: 'user-1',
          rating: 1,
          comment: 'Druhá recenze stejného uživatele.',
        });
      },
      (err: any) => {
        assert.match(err.message, /DUPLICATE_REVIEW/);
        return true;
      },
      'Submitting duplicate review by same user must throw DUPLICATE_REVIEW'
    );
  });

  test('5. Mass Assignment Protection: updateSubjekt cannot overwrite sensitive audit fields', async () => {
    const maliciousPayload = {
      name: 'Aktualizovaný název',
      avgRating: 5.0, // Tampered
      reviewCount: 999, // Tampered
      createdById: 'hacker-id', // Tampered
      createdAt: new Date('2000-01-01'), // Tampered
    };

    const updated = await subjektService.updateSubjekt('subj-test-1', maliciousPayload);
    assert.strictEqual(updated.name, 'Aktualizovaný název');
    assert.strictEqual(updated.avgRating, 0.0, 'avgRating must NOT be overwritten via updateSubjekt');
    assert.strictEqual(updated.reviewCount, 0, 'reviewCount must NOT be overwritten via updateSubjekt');
    assert.strictEqual(updated.createdById, 'admin-user-1', 'createdById must NOT be overwritten via updateSubjekt');
  });

  test('6. Public DTO Data Stripping: strips createdById, verifiedById, rejectionReason, etc. for public', () => {
    const rawSubjekt = {
      id: 'subj-1',
      name: 'Okresní soud',
      type: 'SOUD',
      city: 'Brno',
      region: 'Jihomoravský kraj',
      status: 'VERIFIED',
      createdById: 'secret-author-user-id',
      verifiedById: 'secret-verifier-user-id',
      verifiedAt: new Date(),
      rejectedById: 'secret-rejector-id',
      rejectedAt: new Date(),
      rejectionReason: 'Interní důvod moderátora',
      pracovnici: [
        {
          id: 'prac-1',
          jmeno: 'Mgr. Jan Novák',
          createdById: 'secret-worker-creator',
        }
      ],
      reviews: [
        {
          id: 'rev-1',
          rating: 5,
          comment: 'Skvělá práce',
          userId: 'secret-reviewer-id',
        }
      ]
    };

    const publicDto = toPublicSubjektDto(rawSubjekt, false);

    assert.strictEqual(publicDto.createdById, undefined, 'createdById must be stripped for public');
    assert.strictEqual(publicDto.verifiedById, undefined, 'verifiedById must be stripped for public');
    assert.strictEqual(publicDto.rejectedById, undefined, 'rejectedById must be stripped for public');
    assert.strictEqual(publicDto.rejectionReason, undefined, 'rejectionReason must be stripped for public');
    assert.strictEqual(publicDto.pracovnici[0].createdById, undefined, 'Worker createdById must be stripped for public');
    assert.strictEqual(publicDto.reviews[0].userId, undefined, 'Review userId must be stripped for public');
    assert.strictEqual(publicDto.name, 'Okresní soud');

    // Privileged caller receives full audit fields
    const privilegedDto = toPublicSubjektDto(rawSubjekt, true);
    assert.strictEqual(privilegedDto.createdById, 'secret-author-user-id');
    assert.strictEqual(privilegedDto.rejectionReason, 'Interní důvod moderátora');
  });

  test('7. Public status visibility query filtering', async () => {
    // Public query: status default 'VERIFIED'
    const publicList = await subjektService.getSubjekty({ status: 'VERIFIED' });
    const hasUnverified = publicList.some(s => s.status !== 'VERIFIED');
    assert.strictEqual(hasUnverified, false, 'Public listing must not contain unverified subjects');
    assert.strictEqual(publicList.length, 1);
    assert.strictEqual(publicList[0].id, 'subj-test-1');
  });

});
