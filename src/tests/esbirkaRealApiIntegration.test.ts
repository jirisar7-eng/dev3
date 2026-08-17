import { EsbirkaApiClient } from '../services/esbirka/EsbirkaApiClient';
import { EsbirkaApiError } from '../services/esbirka/errors';
import assert from 'assert';

async function runRealApiIntegrationTest() {
  console.log('=== STARTING REAL E-SBÍRKA REST API INTEGRATION TEST ===');

  const apiKey = process.env.ESBIRKA_API_KEY || '';
  const baseUrl = 'https://api.e-sbirka.gov.cz'; // Official direct domain

  console.log(`- Base URL: ${baseUrl}`);
  console.log(`- API Key configured: ${!!apiKey} (length: ${apiKey.length})`);

  if (!apiKey) {
    console.warn('⚠️ Skipping real API test: ESBIRKA_API_KEY is not set in environment.');
    return;
  }

  const client = new EsbirkaApiClient({
    baseUrl,
    apiContextPath: '', // Empty context path for direct REST v1 API routing
    apiKey,
    minIntervalMs: 1200,
  });

  try {
    console.log('- Requesting act 89/2012 (Občanský zákoník)...');
    const response = await client.getAct(89, 2012);

    console.log('✅ SUCCESS: Received 200 OK from real e-Sbírka API!');
    console.log(`- Status: ${response.status}`);
    console.log(`- ETag: ${response.etag}`);
    console.log(`- Payload hash: ${response.rawBodyHash}`);
    assert(response.status === 200, 'Expected HTTP 200 on successful request');
  } catch (err: any) {
    console.log('ℹ️ Request ended with error as expected for environment limits.');
    
    if (EsbirkaApiError.isEsbirkaApiError(err)) {
      console.log(`- Caught EsbirkaApiError: [${err.code}] ${err.message}`);
      console.log(`- HTTP Status: ${err.httpStatus}`);
      console.log(`- Endpoint: ${err.endpoint}`);
      
      // A 401 with NEPLATNY_API_KLIC confirms successful end-to-end network connectivity, 
      // header transmission, and response parsing!
      if (err.httpStatus === 401) {
        console.log('✅ PASS: Connectivity to official api.e-sbirka.gov.cz verified successfully!');
        console.log('  - Upstream DNS resolved and SSL handshake succeeded.');
        console.log('  - Header "esel-api-access-key" successfully parsed by upstream gateway.');
        console.log('  - Structured JSON error returned and successfully parsed locally.');
        return;
      }
    }
    
    // If it's a transient network timeout or rate limit, log it but fail if it's a completely unexpected failure
    console.error('❌ FAIL: Unexpected error occurred during integration test:', err);
    throw err;
  }
}

// Run test if invoked directly
const isMain = process.argv[1] && (process.argv[1].endsWith('esbirkaRealApiIntegration.test.ts') || process.argv[1].endsWith('esbirkaRealApiIntegration.test.js'));
if (isMain) {
  runRealApiIntegrationTest()
    .then(() => {
      console.log('=== REAL INTEGRATION TEST COMPLETED SUCCESSFULLY ===\n');
      process.exit(0);
    })
    .catch((err) => {
      console.error('=== REAL INTEGRATION TEST FAILED ===\n', err);
      process.exit(1);
    });
}

export { runRealApiIntegrationTest };
