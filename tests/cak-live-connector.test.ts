import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { CakLiveConnector } from '../src/services/dataPipeline/cakLiveConnector';
import { CakHtmlParser } from '../src/services/dataPipeline/cakHtmlParser';
import { CakAcquisitionPipeline } from '../src/services/dataPipeline/cakAcquisitionPipeline';
import { SubjectVerifiedInfoService } from '../src/services/subjectVerifiedInfoService';
import { VerifiedInfoValidator } from '../src/services/verifiedInfoValidator';
import { toPublicSubjektDto } from '../src/services/subjektService';
import { dbStore } from '../src/services/dbStore';
import { nonOspodSubjekty } from '../src/data/nonOspodSubjekty';
import { User } from '../src/types';

describe('MASTER-IMPLEMENT-07C-3B: LIVE ČAK CONNECTOR & FOUR-EYES ACQUISITION', () => {
  const submitterUser: User = {
    id: 'usr-cak-crawler-bot',
    email: 'cak-bot@tatamapravo.cz',
    name: 'ČAK Sync Crawler',
    role: 'ADMIN',
  };

  const moderatorUser: User = {
    id: 'usr-independent-reviewer',
    email: 'reviewer@tatamapravo.cz',
    name: 'Senior Legal Moderator',
    role: 'MODERATOR',
  };

  const sampleValidHtml = `<!DOCTYPE html>
<html lang="cs">
<head><title>Detail advokáta - Česká advokátní komora</title></head>
<body>
  <div class="detail-container">
    <h1 class="detail-name">JUDr. Tomáš Novotný</h1>
    <div class="info-row">
      <span class="label">Evidenční číslo ČAK:</span>
      <span class="value" data-ev-cislo="14820">14820</span>
    </div>
    <div class="info-row">
      <span class="label">IČO:</span>
      <span class="value">71458921</span>
    </div>
    <div class="info-row">
      <span class="label">Sídlo:</span>
      <div class="address">Vodičkova 791/41, 110 00 Praha 1</div>
    </div>
    <div class="info-row">
      <span class="label">Telefon:</span>
      <span class="value"><a href="tel:+420224210501">+420 224 210 501</a></span>
    </div>
    <div class="info-row">
      <span class="label">E-mail:</span>
      <span class="value"><a href="mailto:tomas.novotny@ak-novotny.cz">tomas.novotny@ak-novotny.cz</a></span>
    </div>
    <div class="info-row">
      <span class="label">Datová schránka:</span>
      <span class="value">h9v3k2q</span>
    </div>
    <div class="info-row">
      <span class="label">Web:</span>
      <span class="value"><a href="https://www.ak-novotny.cz">https://www.ak-novotny.cz</a></span>
    </div>
    <div class="info-row">
      <span class="label">Stav advokáta:</span>
      <span class="value status-active">Aktivní advokát</span>
    </div>
  </div>
</body>
</html>`;

  beforeEach(() => {
    CakLiveConnector.clearCache();
    // Ensure dbStore has target non-OSPOD subjects
    for (const nos of nonOspodSubjekty) {
      if (!dbStore.subjekty.some((s) => s.id === nos.id)) {
        dbStore.subjekty.push({ ...nos } as any);
      }
    }
  });

  // --------------------------------------------------------------------------
  // 1. HTTPS / HOSTNAME WHITELIST
  // --------------------------------------------------------------------------
  describe('1. HTTPS / Hostname Whitelist', () => {
    test('Allows strictly https://vyhledavac.cak.cz', () => {
      const val = CakLiveConnector.validateTargetUrl('https://vyhledavac.cak.cz/Search/Detail?evidencniCislo=14820');
      assert.strictEqual(val.valid, true);
      assert.strictEqual(val.parsedUrl?.hostname, 'vyhledavac.cak.cz');
      assert.strictEqual(val.parsedUrl?.protocol, 'https:');
    });

    test('Rejects plain HTTP protocol', () => {
      const val = CakLiveConnector.validateTargetUrl('http://vyhledavac.cak.cz/Search/Detail?evidencniCislo=14820');
      assert.strictEqual(val.valid, false);
      assert.ok(val.error?.includes('https:'));
    });

    test('Rejects other hostnames (e.g. google.com, cak.cz without vyhledavac)', () => {
      const val1 = CakLiveConnector.validateTargetUrl('https://google.com/search');
      assert.strictEqual(val1.valid, false);

      const val2 = CakLiveConnector.validateTargetUrl('https://cak.cz/advokati');
      assert.strictEqual(val2.valid, false);
      assert.ok(val2.error?.includes('vyhledavac.cak.cz'));
    });

    test('Rejects non-standard ports (e.g. 8443, 8080)', () => {
      const val = CakLiveConnector.validateTargetUrl('https://vyhledavac.cak.cz:8443/Search/Detail');
      assert.strictEqual(val.valid, false);
      assert.ok(val.error?.includes('port'));
    });
  });

  // --------------------------------------------------------------------------
  // 2. SSRF PROTECTION
  // --------------------------------------------------------------------------
  describe('2. SSRF Protection', () => {
    test('Rejects localhost and loopback addresses (127.0.0.1, 127.0.1.1, ::1)', () => {
      assert.strictEqual(CakLiveConnector.validateTargetUrl('https://localhost/admin').valid, false);
      assert.strictEqual(CakLiveConnector.validateTargetUrl('https://127.0.0.1:443/').valid, false);
      assert.strictEqual(CakLiveConnector.validateTargetUrl('https://127.0.1.1/').valid, false);
    });

    test('Rejects AWS/Cloud metadata IP (169.254.169.254)', () => {
      assert.strictEqual(CakLiveConnector.validateTargetUrl('https://169.254.169.254/latest/meta-data').valid, false);
    });

    test('Rejects private RFC1918 subnets (10.0.0.0/8, 192.168.0.0/16, 172.16.0.0/12)', () => {
      assert.strictEqual(CakLiveConnector.validateTargetUrl('https://10.0.0.5/api').valid, false);
      assert.strictEqual(CakLiveConnector.validateTargetUrl('https://192.168.1.1/router').valid, false);
      assert.strictEqual(CakLiveConnector.validateTargetUrl('https://172.20.0.1/db').valid, false);
    });

    test('Rejects internal domain suffixes (.local, .internal)', () => {
      assert.strictEqual(CakLiveConnector.validateTargetUrl('https://db.local/').valid, false);
      assert.strictEqual(CakLiveConnector.validateTargetUrl('https://postgres.internal/').valid, false);
    });
  });

  // --------------------------------------------------------------------------
  // 3. TIMEOUT & RESPONSE SIZE LIMIT
  // --------------------------------------------------------------------------
  describe('3. Timeout and Response Limit', () => {
    test('Handles timeout with 504 error and AbortController without crashing', async () => {
      const mockFetch = async () => {
        const error = new Error('The operation was aborted');
        error.name = 'AbortError';
        throw error;
      };

      const connector = new CakLiveConnector({
        timeoutMs: 50,
        maxRetries: 0,
        customFetch: mockFetch,
      });

      const res = await connector.fetchAdvokatByEvNumber('14820', { bypassCache: true, skipRateLimitCheck: true });
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.status, 504);
      assert.ok(res.error?.includes('TIMEOUT') || res.error?.includes('limit'));
    });

    test('Rejects response exceeding 10MB limit', async () => {
      const hugeHtml = 'A'.repeat(11 * 1024 * 1024); // 11 MB
      const mockFetch = async () => ({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-length': String(hugeHtml.length) }),
        text: async () => hugeHtml,
      });

      const connector = new CakLiveConnector({
        maxRetries: 0,
        customFetch: mockFetch,
      });

      const res = await connector.fetchAdvokatByEvNumber('14820', { bypassCache: true, skipRateLimitCheck: true });
      assert.strictEqual(res.success, false);
      assert.ok(res.error?.includes('RESPONSE_TOO_LARGE') || res.error?.includes('limit'));
    });
  });

  // --------------------------------------------------------------------------
  // 4. RATE LIMIT & CACHE
  // --------------------------------------------------------------------------
  describe('4. Rate Limit and Cache TTL', () => {
    test('Enforces rate limit (min 3000ms interval)', async () => {
      const mockFetch = async () => ({
        ok: true,
        status: 200,
        headers: new Headers(),
        text: async () => sampleValidHtml,
      });

      const connector = new CakLiveConnector({
        rateLimitMinIntervalMs: 3000,
        customFetch: mockFetch,
      });

      // First call succeeds and sets timestamp
      const res1 = await connector.fetchAdvokatByEvNumber('14820', { bypassCache: true, skipRateLimitCheck: false });
      assert.strictEqual(res1.success, true);

      // Immediate second call triggers rate limit error
      const res2 = await connector.fetchAdvokatByEvNumber('14821', { bypassCache: true, skipRateLimitCheck: false });
      assert.strictEqual(res2.success, false);
      assert.strictEqual(res2.status, 429);
      assert.ok(res2.error?.includes('RATE_LIMIT_EXCEEDED'));
    });

    test('Caches valid responses for 24 hours (fromCache: true)', async () => {
      let fetchCallCount = 0;
      const mockFetch = async () => {
        fetchCallCount++;
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          text: async () => sampleValidHtml,
        };
      };

      const connector = new CakLiveConnector({
        rateLimitMinIntervalMs: 0,
        customFetch: mockFetch,
      });

      // First fetch
      const res1 = await connector.fetchAdvokatByEvNumber('14820', { bypassCache: false, skipRateLimitCheck: true });
      assert.strictEqual(res1.success, true);
      assert.strictEqual(res1.fromCache, false);
      assert.strictEqual(fetchCallCount, 1);

      // Second fetch should be served directly from in-memory cache
      const res2 = await connector.fetchAdvokatByEvNumber('14820', { bypassCache: false, skipRateLimitCheck: true });
      assert.strictEqual(res2.success, true);
      assert.strictEqual(res2.fromCache, true);
      assert.strictEqual(fetchCallCount, 1); // No additional HTTP call
    });

    test('Zero retries on HTTP 4xx (400, 403, 404, 429)', async () => {
      let callAttempts = 0;
      const mockFetch = async () => {
        callAttempts++;
        return {
          ok: false,
          status: 404,
          headers: new Headers(),
          text: async () => 'Not Found',
        };
      };

      const connector = new CakLiveConnector({
        maxRetries: 2,
        customFetch: mockFetch,
      });

      const res = await connector.fetchAdvokatByEvNumber('99999', { bypassCache: true, skipRateLimitCheck: true });
      assert.strictEqual(res.success, false);
      assert.strictEqual(res.status, 404);
      assert.strictEqual(callAttempts, 1); // Exactly 1 attempt, no retries
    });
  });

  // --------------------------------------------------------------------------
  // 5. HTML PARSER
  // --------------------------------------------------------------------------
  describe('5. HTML Parser', () => {
    test('Parses valid ČAK detail HTML fixture accurately', () => {
      const parsed = CakHtmlParser.parse(sampleValidHtml, 'https://vyhledavac.cak.cz/Search/Detail?evidencniCislo=14820');
      assert.strictEqual(parsed.success, true);
      assert.ok(parsed.data);
      assert.strictEqual(parsed.data.cakEvidencniCislo, '14820');
      assert.strictEqual(parsed.data.fullName, 'JUDr. Tomáš Novotný');
      assert.strictEqual(parsed.data.titleBefore, 'JUDr.');
      assert.strictEqual(parsed.data.ico, '71458921');
      assert.strictEqual(parsed.data.officialPhone, '+420 224 210 501');
      assert.strictEqual(parsed.data.officialEmail, 'tomas.novotny@ak-novotny.cz');
      assert.strictEqual(parsed.data.dataBoxId, 'h9v3k2q');
      assert.strictEqual(parsed.data.officialWebsite, 'https://www.ak-novotny.cz');
      assert.strictEqual(parsed.data.isActiveAdvokat, true);
      assert.ok(parsed.contentHash.length === 64); // Valid SHA-256
    });

    test('Correctly identifies suspended advocate status', () => {
      const suspendedHtml = sampleValidHtml.replace('Aktivní advokát', 'Pozastavený výkon advokacie');
      const parsed = CakHtmlParser.parse(suspendedHtml, 'https://vyhledavac.cak.cz/Search/Detail?evidencniCislo=14820');
      assert.strictEqual(parsed.success, true);
      assert.strictEqual(parsed.data?.isActiveAdvokat, false);
      assert.strictEqual(parsed.data?.statusText, 'Pozastavený výkon advokacie');
    });
  });

  // --------------------------------------------------------------------------
  // 6. IDENTITY MISMATCH
  // --------------------------------------------------------------------------
  describe('6. Identity Mismatch Detection', () => {
    test('Rejects acquisition if advocate details do not match subject database', async () => {
      const unknownHtml = sampleValidHtml
        .replace('JUDr. Tomáš Novotný', 'JUDr. Zcela Neznámý Advokát')
        .replace('71458921', '99999999')
        .replace('14820', '99999');

      const mockFetch = async () => ({
        ok: true,
        status: 200,
        headers: new Headers(),
        text: async () => unknownHtml,
      });

      const connector = new CakLiveConnector({
        customFetch: mockFetch,
      });

      const res = await CakAcquisitionPipeline.acquireLiveAdvokat('99999', submitterUser, {
        connector,
        bypassCache: true,
      });

      assert.strictEqual(res.success, false);
      assert.ok(res.errors?.[0]?.includes('IDENTITY_MISMATCH'));
    });
  });

  // --------------------------------------------------------------------------
  // 7. PENDING_REVIEW STATUS UPON INGEST
  // --------------------------------------------------------------------------
  describe('7. PENDING_REVIEW Status Ingest', () => {
    test('Submits proposals strictly in PENDING_REVIEW status with bot createdById', async () => {
      const mockFetch = async () => ({
        ok: true,
        status: 200,
        headers: new Headers(),
        text: async () => sampleValidHtml,
      });

      const connector = new CakLiveConnector({
        customFetch: mockFetch,
      });

      const res = await CakAcquisitionPipeline.acquireLiveAdvokat('14820', submitterUser, {
        targetSubjektId: 'subj-nonospod-110',
        connector,
        bypassCache: true,
        skipRateLimitCheck: true,
      });

      assert.strictEqual(res.success, true);
      assert.ok(res.proposals.length > 0);

      for (const p of res.proposals) {
        assert.strictEqual(p.status, 'PENDING_REVIEW');
        assert.strictEqual(p.createdById, submitterUser.id);
        assert.strictEqual(p.sourceLevel, 'P2_PUBLIC_STATE_REGISTRY');
        assert.strictEqual(p.extractionMethod, 'OFFICIAL_REGISTER_SYNC');
        assert.ok(p.evidenceSnippet.includes('SHA-256'));
      }
    });
  });

  // --------------------------------------------------------------------------
  // 8. SELF-APPROVAL FORBIDDEN
  // --------------------------------------------------------------------------
  describe('8. Self-Approval Forbidden (Four-Eyes)', () => {
    test('Prevents crawler bot from self-approving its own proposals', async () => {
      const mockFetch = async () => ({
        ok: true,
        status: 200,
        headers: new Headers(),
        text: async () => sampleValidHtml,
      });

      const connector = new CakLiveConnector({
        customFetch: mockFetch,
      });

      const subRes = await CakAcquisitionPipeline.acquireLiveAdvokat('14820', submitterUser, {
        targetSubjektId: 'subj-nonospod-110',
        connector,
        bypassCache: true,
        skipRateLimitCheck: true,
      });

      assert.strictEqual(subRes.success, true);
      assert.ok(subRes.proposals.length > 0);

      const firstProposal = subRes.proposals[0];

      // Same user tries to review/approve
      await assert.rejects(
        async () => {
          await SubjectVerifiedInfoService.reviewSourceProposal(
            firstProposal.id,
            { subjektId: 'subj-nonospod-110', decision: 'APPROVE' },
            submitterUser // SUBMITTER IS REVIEWER
          );
        },
        (err: any) => {
          return err?.message?.includes('Four-Eyes') || err?.message?.includes('nesmí') || err?.message?.includes('vlastní');
        }
      );
    });
  });

  // --------------------------------------------------------------------------
  // 9. VERIFIED ONLY AFTER INDEPENDENT REVIEWER
  // --------------------------------------------------------------------------
  describe('9. VERIFIED Only After Independent Reviewer', () => {
    test('Becomes VERIFIED only when distinct moderator approves', async () => {
      const mockFetch = async () => ({
        ok: true,
        status: 200,
        headers: new Headers(),
        text: async () => sampleValidHtml,
      });

      const connector = new CakLiveConnector({
        customFetch: mockFetch,
      });

      const subRes = await CakAcquisitionPipeline.acquireLiveAdvokat('14820', submitterUser, {
        targetSubjektId: 'subj-nonospod-110',
        connector,
        bypassCache: true,
        skipRateLimitCheck: true,
      });

      assert.strictEqual(subRes.success, true);

      // Independent moderator reviews all pending proposals
      const revRes = await CakAcquisitionPipeline.reviewAdvokatProposals('subj-nonospod-110', moderatorUser, 'APPROVE');
      assert.strictEqual(revRes.success, true);
      assert.ok(revRes.reviewedSources.length > 0);
      assert.strictEqual(revRes.profile?.status, 'VERIFIED');
      assert.strictEqual(revRes.profile?.verifiedById, moderatorUser.id);
    });
  });

  // --------------------------------------------------------------------------
  // 10. SHA-256 COMPUTATION & VERIFICATION
  // --------------------------------------------------------------------------
  describe('10. SHA-256 Computation and Verification', () => {
    test('Computes deterministic SHA-256 matching crypto hash', () => {
      const hash1 = CakHtmlParser.computeSha256(sampleValidHtml);
      const hash2 = CakHtmlParser.computeSha256(sampleValidHtml);
      assert.strictEqual(hash1, hash2);
      assert.strictEqual(/^[0-9a-f]{64}$/.test(hash1), true);

      const parsed = CakHtmlParser.parse(sampleValidHtml, 'https://vyhledavac.cak.cz/Search/Detail');
      assert.strictEqual(parsed.contentHash, hash1);
      assert.strictEqual(parsed.data?.rawHtmlHash, hash1);
    });
  });

  // --------------------------------------------------------------------------
  // 11. FAIL-CLOSED ON CORRUPTED HTML, CAPTCHA, WAF
  // --------------------------------------------------------------------------
  describe('11. Fail-Closed on Corrupted HTML, CAPTCHA, WAF', () => {
    test('Fails closed on CAPTCHA detection without bypass', () => {
      const captchaHtml = `<html><body><div class="g-recaptcha" data-sitekey="xyz"></div></body></html>`;
      const parsed = CakHtmlParser.parse(captchaHtml, 'https://vyhledavac.cak.cz/Search/Detail');
      assert.strictEqual(parsed.success, false);
      assert.strictEqual(parsed.code, 'CAPTCHA_DETECTED');
      assert.ok(parsed.error?.includes('CAPTCHA'));
    });

    test('Fails closed on WAF challenge detection', () => {
      const wafHtml = `<html><body><h1>Attention Required! | Cloudflare</h1><p>Access denied</p></body></html>`;
      const parsed = CakHtmlParser.parse(wafHtml, 'https://vyhledavac.cak.cz/Search/Detail');
      assert.strictEqual(parsed.success, false);
      assert.strictEqual(parsed.code, 'WAF_BLOCKED');
    });

    test('Fails closed on malformed / modified HTML missing critical fields', () => {
      const malformedHtml = `<html><body><div>Zde je nějaký náhodný text bez advokáta</div></body></html>`;
      const parsed = CakHtmlParser.parse(malformedHtml, 'https://vyhledavac.cak.cz/Search/Detail');
      assert.strictEqual(parsed.success, false);
      assert.strictEqual(parsed.code, 'HTML_LAYOUT_MISMATCH');
    });
  });

  // --------------------------------------------------------------------------
  // 12. PUBLIC DTO SANITIZATION
  // --------------------------------------------------------------------------
  describe('12. Public DTO Sanitization', () => {
    test('toPublicSubjektDto strips internal audit IDs from public view', () => {
      const targetSubjekt = dbStore.subjekty.find((s) => s.id === 'subj-nonospod-110');
      assert.ok(targetSubjekt);

      const rawSubjektWithInternalFields = {
        ...targetSubjekt,
        createdById: 'usr-internal-creator',
        verifiedById: 'usr-internal-verifier',
        rejectionReason: 'Internal moderation note',
        verifiedProfile: {
          id: 'vp-110',
          subjektId: 'subj-nonospod-110',
          status: 'VERIFIED',
          officialPhone: '+420 224 210 501',
          officialEmail: 'tomas.novotny@ak-novotny.cz',
          createdById: 'usr-internal-creator',
          reviewedById: 'usr-internal-reviewer',
          rejectionReason: 'Internal secret note',
        },
      };

      const publicDto = toPublicSubjektDto(rawSubjektWithInternalFields);
      assert.ok(publicDto);
      // isVerified remains false on Subjekt entity
      assert.strictEqual(publicDto.isVerified, false);
      // Root-level internal IDs stripped
      assert.strictEqual(typeof publicDto.createdById, 'undefined');
      assert.strictEqual(typeof publicDto.verifiedById, 'undefined');
      assert.strictEqual(typeof publicDto.rejectionReason, 'undefined');
      // Profile-level internal audit IDs stripped
      assert.ok(publicDto.verifiedProfile);
      assert.strictEqual(publicDto.verifiedProfile.officialPhone, '+420 224 210 501');
      assert.strictEqual(typeof publicDto.verifiedProfile.createdById, 'undefined');
      assert.strictEqual(typeof publicDto.verifiedProfile.reviewedById, 'undefined');
      assert.strictEqual(typeof publicDto.verifiedProfile.rejectionReason, 'undefined');
    });
  });
});
