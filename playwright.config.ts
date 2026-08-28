/** @type {import('@playwright/test').PlaywrightTestConfig} */
export default {
  // Izolace interních Node.js / TSX testů od Playwright E2E runneru
  testDir: './e2e',
  testIgnore: [
    '**/src/tests/**',
    '**/tests/**' // pokud by existovala samostatná složka tests
  ],
};


