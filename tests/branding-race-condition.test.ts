import test from 'node:test';
import assert from 'node:assert';
import { BrandingService } from '../src/services/brandingService';
import { prisma } from '../src/db/prisma';

test('Branding Race Condition and DB Invariant Test Suite', async (t) => {
  let isDbAvailable = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    isDbAvailable = true;
  } catch (err) {
    console.log('Database not reachable, skipping race condition tests');
  }

  if (isDbAvailable) {
    await t.test('saveNewVersion prevents duplicate active versions under concurrent load', async () => {
      // Clear all
      await prisma.brandingVersion.deleteMany();

      // Fire 5 concurrent requests
      const promises = Array.from({ length: 5 }).map((_, i) =>
        BrandingService.saveNewVersion({ logoAlt: `Concurrent ${i}` }, `user${i}`)
      );

      await Promise.allSettled(promises);

      const activeCount = await prisma.brandingVersion.count({
        where: { isActive: true }
      });
      
      assert.strictEqual(activeCount, 1, 'Only one BrandingVersion must be active after concurrent saves');

      const all = await prisma.brandingVersion.findMany({ orderBy: { version: 'asc' } });
      const versions = all.map(v => v.version);
      const uniqueVersions = new Set(versions);
      assert.strictEqual(versions.length, uniqueVersions.size, 'All versions must be unique');
      
      const totalCount = await prisma.brandingVersion.count();
      assert.strictEqual(totalCount, 5, 'All 5 saves should have succeeded sequentially due to advisory lock');
    });
  }
});
