import test from 'node:test';
import assert from 'node:assert';
import { prisma, markPrismaUnavailable } from '../src/db/prisma';

test('PRISMA FAIL-CLOSED SECURITY & READ-ONLY FALLBACK TEST SUITE', async (t) => {
  // Ensure database is marked unavailable for these test cases
  markPrismaUnavailable('Simulated DB outage in unit tests');

  await t.test('A) DB unavailable + page.findFirst() => safe READ fallback', async () => {
    const res = await prisma.page.findFirst();
    assert.strictEqual(res, null, 'findFirst should return safe fallback (null)');
  });

  await t.test('B) DB unavailable + page.findMany() => safe READ fallback', async () => {
    const res = await prisma.page.findMany();
    assert.deepStrictEqual(res, [], 'findMany should return safe empty array');
  });

  await t.test('C) DB unavailable + page.create() => THROW (no fake write success)', async () => {
    await assert.rejects(
      async () => {
        await prisma.page.create({ data: { title: 'Test', slug: 'test' } });
      },
      /Databáze je momentálně nedostupná/
    );
  });

  await t.test('D) DB unavailable + page.update() => THROW (no fake write success)', async () => {
    await assert.rejects(
      async () => {
        await prisma.page.update({ where: { id: 'test-id' }, data: { title: 'Updated' } });
      },
      /Databáze je momentálně nedostupná/
    );
  });

  await t.test('E) DB unavailable + page.upsert() => THROW (no fake write success)', async () => {
    await assert.rejects(
      async () => {
        await prisma.page.upsert({
          where: { id: 'test-id' },
          create: { title: 'Test' },
          update: { title: 'Updated' },
        });
      },
      /Databáze je momentálně nedostupná/
    );
  });

  await t.test('F) DB unavailable + page.delete() => THROW (no fake write success)', async () => {
    await assert.rejects(
      async () => {
        await prisma.page.delete({ where: { id: 'test-id' } });
      },
      /Databáze je momentálně nedostupná/
    );
  });

  await t.test('G) DB unavailable + rolePermission.findFirst() => THROW (fail-closed security model)', async () => {
    await assert.rejects(
      async () => {
        await prisma.rolePermission.findFirst({ where: { role: 'ADMIN', permission: 'SYSTEM_SETTINGS' } });
      },
      /Databáze je momentálně nedostupná/
    );
  });

  await t.test('H) DB unavailable + consent.create() => THROW (fail-closed domain/compliance model)', async () => {
    await assert.rejects(
      async () => {
        await prisma.consent.create({ data: { userId: 'u1', docKey: 'terms', docVersion: '1.0' } });
      },
      /Databáze je momentálně nedostupná/
    );
  });

  await t.test('I) DB unavailable + legalAct.upsert() => THROW (fail-closed legal model)', async () => {
    await assert.rejects(
      async () => {
        await prisma.legalAct.upsert({
          where: { actId: 'act-1' },
          create: { actId: 'act-1' },
          update: {},
        });
      },
      /Databáze je momentálně nedostupná/
    );
  });

  await t.test('J) DB unavailable + $transaction() => THROW and callback MUST NOT execute', async () => {
    let callbackExecuted = false;
    await assert.rejects(
      async () => {
        await prisma.$transaction(async () => {
          callbackExecuted = true;
          return 'ok';
        });
      },
      /Databáze je momentálně nedostupná/
    );
    assert.strictEqual(callbackExecuted, false, '$transaction callback MUST NOT execute when DB is unavailable');
  });

  await t.test('K) DB unavailable + $queryRaw() => THROW', async () => {
    await assert.rejects(
      async () => {
        await prisma.$queryRaw`SELECT 1`;
      },
      /Databáze je momentálně nedostupná/
    );
  });

  await t.test('L) DB unavailable + $executeRaw() => THROW', async () => {
    await assert.rejects(
      async () => {
        await prisma.$executeRaw`DELETE FROM "User"`;
      },
      /Databáze je momentálně nedostupná/
    );
  });
});
