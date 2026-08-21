const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');

test('Static Analysis - AI Disclaimers', (t) => {
  const aiForms = fs.readFileSync('src/components/public/ai/AiFormsView.tsx', 'utf8');
  assert.ok(aiForms.includes('Právní upozornění:'), 'AiFormsView lacks disclaimer');

  const aiAsst = fs.readFileSync('src/components/public/ai/AiAssistantView.tsx', 'utf8');
  assert.ok(aiAsst.includes('Právní upozornění:'), 'AiAssistantView lacks disclaimer');
});

test('Static Analysis - Nutrition (Alimony) Calculator', (t) => {
  const calc = fs.readFileSync('src/components/public/AlimonyCalculatorView.tsx', 'utf8');
  assert.ok(calc.includes('Právní upozornění'), 'AlimonyCalculatorView lacks legal warning');
});

test('Static Analysis - PWA & API Cache Protection', (t) => {
  const sw = fs.readFileSync('public/sw.js', 'utf8');
  assert.ok(sw.includes('if (event.request.method !== \'GET\')'), 'SW must ignore non-GET');
  assert.ok(sw.includes('/api'), 'SW must ignore /api');
  assert.ok(sw.includes('/auth/'), 'SW must ignore /auth/');
  assert.ok(sw.includes('/mfa'), 'SW must ignore /mfa');
});

test('Static Analysis - Authentication & RBAC', (t) => {
  const authRoutes = fs.readFileSync('server.ts', 'utf8');
  assert.ok(authRoutes.includes('requireAuth'), 'server.ts must use requireAuth middleware');
  assert.ok(authRoutes.includes('requireRole'), 'server.ts must use requireRole middleware for RBAC');
});

test('Static Analysis - AI Security & BOLA/IDOR', (t) => {
  const serverStr = fs.readFileSync('server.ts', 'utf8');
  assert.ok(serverStr.includes('req.user.id') || serverStr.includes('req.user'), 'Must use req.user for user isolation (BOLA/IDOR protection)');
});
