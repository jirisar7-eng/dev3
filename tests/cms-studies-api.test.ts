import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import express from 'express';
import { StudyService } from '../src/services/studyService';

test('CMS Studies API - GET /api/cms/studies', async (t) => {
  const app = express();
  app.use(express.json());

  app.get('/api/cms/studies', async (req, res) => {
    try {
      const { status, category, search } = req.query;
      const studies = await StudyService.getStudies({
        status: status as string,
        category: category as string,
        search: search as string,
      });
      res.json(studies);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/cms/studies/slug/:slug', async (req, res) => {
    try {
      const study = await StudyService.getStudyBySlug(req.params.slug);
      if (!study) {
        return res.status(404).json({ error: 'Study not found' });
      }
      res.json(study);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  await t.test('1. GET /api/cms/studies?status=PUBLISHED returns all studies', async () => {
    const res = await request(app).get('/api/cms/studies?status=PUBLISHED');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(Array.isArray(res.body), true);
    assert.ok(res.body.length >= 19, 'Should return at least 19 published studies');

    const slugs = res.body.map((s: any) => s.slug);
    assert.ok(slugs.includes('fabricius-suh-2017-prespavani-kojencu-batolat-otcove'));
    assert.ok(slugs.includes('warshak-2018-nocni-pece-prespavani-deti-odmitnuti-pausalnich-omezeni'));
  });

  await t.test('2. GET /api/cms/studies/slug/:slug returns single study', async () => {
    const res = await request(app).get('/api/cms/studies/slug/warshak-2018-nocni-pece-prespavani-deti-odmitnuti-pausalnich-omezeni');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.authors, 'Richard A. Warshak');
    assert.strictEqual(res.body.doi, '10.1080/10502556.2018.1454193');
  });
});
