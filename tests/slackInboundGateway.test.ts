import test from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';
import { Request, Response } from 'express';
import { verifySlackSignature } from '../src/middleware/slackAuthMiddleware';
import { SlackIdentityService } from '../src/services/slackIdentityService';

test('SLACK INBOUND GATEWAY (PHASE B4) TEST SUITE', async (t) => {
  const originalEnv = { ...process.env };
  const signingSecret = '8f742231b10e8888abcd99yyyzzz85a5';

  t.afterEach(() => {
    process.env = { ...originalEnv };
  });

  await t.test('1. Signature Verification: Should reject missing headers', (t) => {
    const req = { headers: {} } as any;
    let status = 0;
    let message = '';
    const res = {
      status: (s: number) => { status = s; return res; },
      send: (m: string) => { message = m; }
    } as any;

    verifySlackSignature(req, res, () => {});
    assert.strictEqual(status, 401);
    assert.strictEqual(message, 'Missing Slack signature headers');
  });

  await t.test('2. Signature Verification: Should reject expired timestamp (Replay Attack)', (t) => {
    const req = {
      headers: {
        'x-slack-signature': 'v0=abc',
        'x-slack-request-timestamp': '1000000000' // Year 2001
      }
    } as any;
    let status = 0;
    let message = '';
    const res = {
      status: (s: number) => { status = s; return res; },
      send: (m: string) => { message = m; }
    } as any;

    verifySlackSignature(req, res, () => {});
    assert.strictEqual(status, 401);
    assert.strictEqual(message, 'Replay attack detected');
  });

  await t.test('3. Signature Verification: Should validate correct signature', (t) => {
    process.env.SLACK_SIGNING_SECRET = signingSecret;
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const rawBody = 'payload=%7B%22type%22%3A%22block_actions%22%7D';
    
    const sigBaseString = `v0:${timestamp}:${rawBody}`;
    const mySignature = 'v0=' + crypto.createHmac('sha256', signingSecret).update(sigBaseString, 'utf8').digest('hex');

    const req = {
      headers: {
        'x-slack-signature': mySignature,
        'x-slack-request-timestamp': timestamp
      },
      rawBody
    } as any;

    let called = false;
    const next = () => { called = true; };
    const res = {
      status: () => res,
      send: () => {}
    } as any;

    verifySlackSignature(req, res, next);
    assert.strictEqual(called, true);
  });

  await t.test('4. Signature Verification: Should reject invalid signature', (t) => {
    process.env.SLACK_SIGNING_SECRET = signingSecret;
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const rawBody = 'payload=%7B%22type%22%3A%22block_actions%22%7D';
    
    const req = {
      headers: {
        'x-slack-signature': 'v0=invalid_signature_here',
        'x-slack-request-timestamp': timestamp
      },
      rawBody
    } as any;

    let status = 0;
    let message = '';
    const res = {
      status: (s: number) => { status = s; return res; },
      send: (m: string) => { message = m; }
    } as any;

    verifySlackSignature(req, res, () => {});
    assert.strictEqual(status, 401);
    assert.strictEqual(message, 'Invalid signature');
  });
});
