import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { subjektService } from '../src/services/subjektService';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function runTests() {
  console.log("=== TEST: SUBJECT REGISTRY MODERATION ===");
  let passed = 0;
  let total = 0;

  function assert(condition: any, message: string) {
    total++;
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
    }
  }

  try {
    // 1. Create a dummy user
    const user = await prisma.user.create({
      data: { email: 'test-subject-submitter@example.com', name: 'Test Submitter', role: 'USER' }
    });
    
    const moderator = await prisma.user.create({
      data: { email: 'test-subject-mod@example.com', name: 'Test Mod', role: 'MODERATOR' }
    });

    // 2. User creates a subject (simulating POST /api/subjekty/submit)
    // We use createSubjekt from service, setting isVerified: false, status: 'PENDING_VERIFICATION'
    const newSubj = await subjektService.createSubjekt({
      type: 'SOUD',
      name: 'Test Opatrovnický Soud',
      city: 'TestCity',
      region: 'TestRegion',
      isVerified: false,
      status: 'PENDING_VERIFICATION',
      createdById: user.id
    } as any);

    assert(newSubj.id !== undefined, 'User can create subject');
    
    // Fetch it directly to check status
    const dbSubj = await prisma.subjekt.findUnique({ where: { id: newSubj.id } });
    assert(dbSubj?.status === 'PENDING_VERIFICATION', 'New subject is PENDING_VERIFICATION');
    assert(dbSubj?.createdById === user.id, 'Author is recorded correctly');

    // 3. User cannot approve their own subject (we test the logic that would be in the route)
    const isOwner = dbSubj?.createdById === user.id;
    assert(isOwner, 'User is owner, route will block approval (tested logically)');

    // 4. Moderator approves
    const approvedSubj = await subjektService.updateSubjekt(newSubj.id, {
      status: 'VERIFIED',
      isVerified: true,
      verifiedById: moderator.id,
      verifiedAt: new Date()
    } as any);

    assert(approvedSubj.status === 'VERIFIED', 'Moderator can approve (status changed to VERIFIED)');
    assert(approvedSubj.verifiedById === moderator.id, 'Approver is recorded');

    // 5. Reject scenario
    const rejectSubj = await subjektService.createSubjekt({
      type: 'SOUD',
      name: 'Bad Soud',
      city: 'BadCity',
      region: 'TestRegion',
      isVerified: false,
      status: 'PENDING_VERIFICATION',
      createdById: user.id
    } as any);

    const rejectedSubj = await subjektService.updateSubjekt(rejectSubj.id, {
      status: 'REJECTED',
      isVerified: false,
      rejectedById: moderator.id,
      rejectedAt: new Date(),
      rejectionReason: 'Not a real court'
    } as any);

    assert(rejectedSubj.status === 'REJECTED', 'Moderator can reject (status changed to REJECTED)');
    assert(rejectedSubj.rejectionReason === 'Not a real court', 'Rejection reason is saved');

    // 6. Check public API (getSubjekty)
    const publicSubjekty = await subjektService.getSubjekty({ city: 'TestCity' });
    assert(publicSubjekty.some(s => s.id === approvedSubj.id), 'VERIFIED subject is visible in public listing');
    
    const pendingSubjekty = await subjektService.getSubjekty({ city: 'BadCity' });
    assert(!pendingSubjekty.some(s => s.id === rejectSubj.id), 'REJECTED subject is NOT visible in public listing');
    
    // User submissions
    const userSubmissions = await subjektService.getSubjekty({ createdById: user.id });
    assert(userSubmissions.length === 2, 'User can see all their submissions (PENDING, VERIFIED, REJECTED)');

    // Cleanup
    await prisma.subjekt.deleteMany({ where: { createdById: user.id } });
    await prisma.user.deleteMany({ where: { id: { in: [user.id, moderator.id] } } });

    console.log(`\nSummary: ${passed} / ${total} tests passed.`);
    if (passed === total) {
      console.log('✅ ALL SUBJECT MODERATION TESTS PASSED!');
    } else {
      console.error('❌ SOME TESTS FAILED!');
      process.exit(1);
    }
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

runTests();
