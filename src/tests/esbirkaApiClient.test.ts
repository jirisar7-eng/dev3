import { EsbirkaApiClient } from '../services/esbirka/EsbirkaApiClient';
import { EsbirkaApiError } from '../services/esbirka/errors';

/**
 * UNIT TEST SUITE FOR ÚKOL 4/10: BEZPEČNÝ REST API KLIENT e-SBÍRKA / e-LEGISLATIVA
 * 
 * STRICT INVARIANT: All HTTP responses are 100% mocked locally in-memory.
 * ZERO external network calls. ZERO live API key usage.
 */
export async function runEsbirkaApiClientTests() {
  console.log('--- STARTING ÚKOL 4/10: e-SBÍRKA API CLIENT UNIT TEST SUITE ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // --------------------------------------------------------------------------
  // TEST 1: Missing API Key -> Fail Closed
  // --------------------------------------------------------------------------
  try {
    const client = new EsbirkaApiClient({
      baseUrl: 'https://api.e-sbirka.gov.cz',
      apiKey: '', // Empty key
      customFetch: async () => {
        throw new Error('Should never reach network');
      },
    });

    await client.get({ endpoint: '/predpisy/2012/89' });
    assert(false, 'TEST 1: Missing API key should throw error');
  } catch (err: any) {
    assert(
      EsbirkaApiError.isEsbirkaApiError(err) && err.code === 'AUTHENTICATION_ERROR',
      'TEST 1: Missing API key fails closed with AUTHENTICATION_ERROR'
    );
  }

  // --------------------------------------------------------------------------
  // TEST 2: URL Validation & SSRF Protection
  // --------------------------------------------------------------------------
  const invalidUrls = [
    { url: 'http://api.e-sbirka.gov.cz/api', reason: 'Non-HTTPS protocol' },
    { url: 'http://localhost:3000', reason: 'Localhost rejection' },
    { url: 'https://127.0.0.1/api', reason: 'Loopback IPv4 rejection' },
    { url: 'https://0.0.0.0/api', reason: 'Wildcard address rejection' },
    { url: 'ftp://api.e-sbirka.gov.cz/api', reason: 'FTP protocol rejection' },
    { url: 'javascript:alert(1)', reason: 'Javascript pseudo-protocol rejection' },
    { url: 'https://192.168.1.1/api', reason: 'Private network CIDR rejection' },
  ];

  for (const { url, reason } of invalidUrls) {
    try {
      EsbirkaApiClient.validateAndNormalizeUrl(url);
      assert(false, `TEST 2: URL validation failed to reject ${reason} (${url})`);
    } catch (err: any) {
      assert(
        EsbirkaApiError.isEsbirkaApiError(err) && err.code === 'CONFIGURATION_ERROR',
        `TEST 2: Correctly rejected ${reason}: ${url}`
      );
    }
  }

  // Valid HTTPS URL validation
  const validUrl = EsbirkaApiClient.validateAndNormalizeUrl('https://api.e-sbirka.gov.cz/');
  assert(validUrl === 'https://api.e-sbirka.gov.cz', 'TEST 2: Valid HTTPS URL correctly normalized');

  // --------------------------------------------------------------------------
  // TEST 3: HTTP 200 Success with Valid JSON Payload
  // --------------------------------------------------------------------------
  let interceptedHeaders: any = null;
  const mockPayload = {
    predpis: {
      cislo: 89,
      rok: 2012,
      nazev: 'Zákon č. 89/2012 Sb., občanský zákoník',
      paragrafy: [
        { cislo: '888', text: 'Rodičovská odpovědnost náleží oběma rodičům.' }
      ]
    }
  };

  const clientSuccess = new EsbirkaApiClient({
    baseUrl: 'https://api.e-sbirka.gov.cz',
    apiKey: 'test-secure-api-key-12345',
    minIntervalMs: 0,
    customFetch: async (url: string, init: any) => {
      interceptedHeaders = init.headers;
      return {
        status: 200,
        statusText: 'OK',
        headers: new Map([
          ['content-type', 'application/json; charset=utf-8'],
          ['etag', 'W/"etag-hash-89-2012"'],
        ]),
        text: async () => JSON.stringify(mockPayload),
      };
    },
  });

  const resSuccess = await clientSuccess.get({ endpoint: '/predpisy/2012/89' });
  assert(resSuccess.status === 200, 'TEST 3: Returns HTTP 200');
  assert(resSuccess.data.predpis.cislo === 89, 'TEST 3: Successfully parsed data payload');
  assert(resSuccess.etag === 'W/"etag-hash-89-2012"', 'TEST 3: Extracts ETag correctly');
  assert(resSuccess.rawBodyHash.length === 64, 'TEST 3: Generates valid SHA-256 payload hash');
  assert(interceptedHeaders['esel-api-access-key'] === 'test-secure-api-key-12345', 'TEST 3: esel-api-access-key header sent to upstream');

  // --------------------------------------------------------------------------
  // TEST 4: HTTP 500 Server Error -> Fail Closed
  // --------------------------------------------------------------------------
  const client500 = new EsbirkaApiClient({
    baseUrl: 'https://api.e-sbirka.gov.cz',
    apiKey: 'test-key',
    minIntervalMs: 0,
    customFetch: async () => ({
      status: 500,
      statusText: 'Internal Server Error',
      headers: new Map([['content-type', 'application/json']]),
      text: async () => JSON.stringify({ error: 'Server crashed' }),
    }),
  });

  try {
    await client500.get({ endpoint: '/predpisy/2012/89' });
    assert(false, 'TEST 4: HTTP 500 should throw error');
  } catch (err: any) {
    assert(
      EsbirkaApiError.isEsbirkaApiError(err) && err.code === 'HTTP_ERROR' && err.httpStatus === 500,
      'TEST 4: HTTP 500 throws HTTP_ERROR with status 500 (Fail-Closed, 0 DB write)'
    );
  }

  // --------------------------------------------------------------------------
  // TEST 5: HTML Error Page (502 / 503 Bad Gateway) -> Reject non-JSON
  // --------------------------------------------------------------------------
  const clientHtml = new EsbirkaApiClient({
    baseUrl: 'https://api.e-sbirka.gov.cz',
    apiKey: 'test-key',
    minIntervalMs: 0,
    customFetch: async () => ({
      status: 200, // Even if 200, HTML is rejected
      statusText: 'OK',
      headers: new Map([['content-type', 'text/html; charset=utf-8']]),
      text: async () => '<!DOCTYPE html><html><body>Error 502 Bad Gateway</body></html>',
    }),
  });

  try {
    await clientHtml.get({ endpoint: '/predpisy/2012/89' });
    assert(false, 'TEST 5: HTML response should throw error');
  } catch (err: any) {
    assert(
      EsbirkaApiError.isEsbirkaApiError(err) && err.code === 'INVALID_CONTENT_TYPE',
      'TEST 5: HTML response rejected with INVALID_CONTENT_TYPE'
    );
  }

  // --------------------------------------------------------------------------
  // TEST 6: Invalid / Malformed JSON Body
  // --------------------------------------------------------------------------
  const clientBadJson = new EsbirkaApiClient({
    baseUrl: 'https://api.e-sbirka.gov.cz',
    apiKey: 'test-key',
    minIntervalMs: 0,
    customFetch: async () => ({
      status: 200,
      statusText: 'OK',
      headers: new Map([['content-type', 'application/json']]),
      text: async () => '{"broken_json": true, incomplete...',
    }),
  });

  try {
    await clientBadJson.get({ endpoint: '/predpisy/2012/89' });
    assert(false, 'TEST 6: Broken JSON should throw error');
  } catch (err: any) {
    assert(
      EsbirkaApiError.isEsbirkaApiError(err) && err.code === 'INVALID_JSON',
      'TEST 6: Broken JSON rejected with INVALID_JSON'
    );
  }

  // --------------------------------------------------------------------------
  // TEST 7: Response Size Limit Exceeded (> 10MB)
  // --------------------------------------------------------------------------
  const clientHuge = new EsbirkaApiClient({
    baseUrl: 'https://api.e-sbirka.gov.cz',
    apiKey: 'test-key',
    minIntervalMs: 0,
    maxResponseSizeBytes: 100, // Small limit for testing
    customFetch: async () => ({
      status: 200,
      statusText: 'OK',
      headers: new Map([['content-type', 'application/json']]),
      text: async () => JSON.stringify({ data: 'A'.repeat(500) }),
    }),
  });

  try {
    await clientHuge.get({ endpoint: '/predpisy/2012/89' });
    assert(false, 'TEST 7: Payload exceeding limit should throw error');
  } catch (err: any) {
    assert(
      EsbirkaApiError.isEsbirkaApiError(err) && err.code === 'RESPONSE_TOO_LARGE',
      'TEST 7: Payload exceeding limit rejected with RESPONSE_TOO_LARGE'
    );
  }

  // --------------------------------------------------------------------------
  // TEST 8: Timeout Handling
  // --------------------------------------------------------------------------
  const clientTimeout = new EsbirkaApiClient({
    baseUrl: 'https://api.e-sbirka.gov.cz',
    apiKey: 'test-key',
    timeoutMs: 50, // 50ms
    minIntervalMs: 0,
    customFetch: async (url: string, init: any) => {
      return new Promise((resolve, reject) => {
        const checkSignal = () => {
          if (init.signal?.aborted) {
            const err: any = new Error('The operation was aborted');
            err.name = 'AbortError';
            reject(err);
          }
        };
        init.signal?.addEventListener('abort', checkSignal);
        setTimeout(() => {
          resolve({
            status: 200,
            headers: new Map([['content-type', 'application/json']]),
            text: async () => '{}',
          });
        }, 200);
      });
    },
  });

  try {
    await clientTimeout.get({ endpoint: '/predpisy/2012/89' });
    assert(false, 'TEST 8: Request exceeding timeout should throw error');
  } catch (err: any) {
    assert(
      EsbirkaApiError.isEsbirkaApiError(err) && err.code === 'TIMEOUT',
      'TEST 8: Timeout triggers TIMEOUT error code'
    );
  }

  // --------------------------------------------------------------------------
  // TEST 9: HTTP 429 Rate Limited from Upstream
  // --------------------------------------------------------------------------
  const client429 = new EsbirkaApiClient({
    baseUrl: 'https://api.e-sbirka.gov.cz',
    apiKey: 'test-key',
    minIntervalMs: 0,
    customFetch: async () => ({
      status: 429,
      statusText: 'Too Many Requests',
      headers: new Map([['content-type', 'application/json']]),
      text: async () => JSON.stringify({ message: 'Rate limit exceeded' }),
    }),
  });

  try {
    await client429.get({ endpoint: '/predpisy/2012/89' });
    assert(false, 'TEST 9: HTTP 429 should throw error');
  } catch (err: any) {
    assert(
      EsbirkaApiError.isEsbirkaApiError(err) && err.code === 'RATE_LIMITED',
      'TEST 9: HTTP 429 produces RATE_LIMITED error'
    );
  }

  // --------------------------------------------------------------------------
  // TEST 10: Concurrency Serialization (Mutex Queue)
  // --------------------------------------------------------------------------
  let concurrentExecutions = 0;
  let maxConcurrentObserved = 0;

  const clientConcurrent = new EsbirkaApiClient({
    baseUrl: 'https://api.e-sbirka.gov.cz',
    apiKey: 'test-key',
    minIntervalMs: 10,
    customFetch: async () => {
      concurrentExecutions++;
      if (concurrentExecutions > maxConcurrentObserved) {
        maxConcurrentObserved = concurrentExecutions;
      }
      await new Promise((r) => setTimeout(r, 20));
      concurrentExecutions--;
      return {
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/json']]),
        text: async () => JSON.stringify({ ok: true }),
      };
    },
  });

  // Launch 3 requests concurrently
  const reqs = [
    clientConcurrent.get({ endpoint: '/test1' }),
    clientConcurrent.get({ endpoint: '/test2' }),
    clientConcurrent.get({ endpoint: '/test3' }),
  ];

  await Promise.all(reqs);
  assert(
    maxConcurrentObserved === 1,
    `TEST 10: Mutex queue strictly serializes calls (Max concurrent observed: ${maxConcurrentObserved}, expected: 1)`
  );

  // --------------------------------------------------------------------------
  // TEST 11: Error Sanitization (No API keys or headers leaked in error message)
  // --------------------------------------------------------------------------
  const sensitiveError = new EsbirkaApiError({
    message: 'Failed with Bearer secret-token-abc and apiKey: 12345',
    code: 'HTTP_ERROR',
    requestId: 'req-123',
    endpoint: '/predpisy/89/2012',
  });

  assert(
    !sensitiveError.message.includes('secret-token-abc') &&
      !sensitiveError.message.includes('12345') &&
      sensitiveError.message.includes('[REDACTED]'),
    'TEST 11: Error messages automatically sanitize and redact secret tokens'
  );

  console.log('\n=== ÚKOL 4/10 TEST RESULTS ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`VERDICT: ${failed === 0 ? 'ALL TESTS PASSED - API CLIENT TRANSPORT LAYER VERIFIED' : 'TESTS FAILED'}`);

  return { passed, failed };
}

// Execute tests when run via CLI
runEsbirkaApiClientTests().then((res) => {
  if (res.failed > 0) process.exit(1);
}).catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
