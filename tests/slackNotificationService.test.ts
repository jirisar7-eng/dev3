import test from 'node:test';
import assert from 'node:assert';
import { SlackNotificationService } from '../src/services/slackNotificationService';

test('SLACK NOTIFICATION SERVICE (PHASE B3) TEST SUITE', async (t) => {
  const originalFetch = globalThis.fetch;
  const originalEnv = { ...process.env };

  t.afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env = { ...originalEnv };
  });

  await t.test('1. Should return success and status DISABLED when credentials are not configured', async () => {
    delete process.env.SLACK_BOT_TOKEN;
    delete process.env.SLACK_DEFAULT_CHANNEL_ID;

    assert.strictEqual(SlackNotificationService.isConfigured(), false);

    const result = await SlackNotificationService.processEvent({
      eventId: 'evt-123',
      eventType: 'AUDIT_CREATED',
      aggregateType: 'Audit',
      aggregateId: 'aud-123',
      payload: { publicId: 'AUD-2026-0001', title: 'Security Audit' },
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.status, 'DISABLED');
    assert.strictEqual(result.error, 'Slack not configured');
  });

  await t.test('2. Should successfully send formatted message when configured', async () => {
    process.env.SLACK_BOT_TOKEN = 'xoxb-test-token';
    process.env.SLACK_DEFAULT_CHANNEL_ID = 'C12345678';

    assert.strictEqual(SlackNotificationService.isConfigured(), true);

    let postedPayload: any = null;

    globalThis.fetch = async (url, init) => {
      if (url === 'https://slack.com/api/chat.postMessage') {
        postedPayload = JSON.parse(init?.body as string);
        return {
          ok: true,
          status: 200,
          text: async () => '{"ok": true, "ts": "123456.789"}',
          json: async () => ({ ok: true, ts: '123456.789' }),
        } as Response;
      }
      throw new Error('Unexpected fetch call');
    };

    const result = await SlackNotificationService.processEvent({
      eventId: 'evt-123',
      eventType: 'AUDIT_CREATED',
      aggregateType: 'Audit',
      aggregateId: 'aud-123',
      payload: {
        publicId: 'AUD-2026-0001',
        title: 'Security Audit',
        scope: 'Production DB',
        source: 'ADMIN_MANUAL',
      },
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.status, 'DELIVERED');
    assert.strictEqual(result.messageId, '123456.789');

    assert.ok(postedPayload);
    assert.strictEqual(postedPayload.channel, 'C12345678');
    assert.ok(postedPayload.text.includes('Audit Created'));
    assert.ok(postedPayload.text.includes('AUD-2026-0001'));
  });

  await t.test('3. Should sanitize PII and secrets before transmission', async () => {
    process.env.SLACK_BOT_TOKEN = 'xoxb-test-token';
    process.env.SLACK_DEFAULT_CHANNEL_ID = 'C12345678';

    let postedPayload: any = null;

    globalThis.fetch = async (url, init) => {
      postedPayload = JSON.parse(init?.body as string);
      return {
        ok: true,
        status: 200,
        json: async () => ({ ok: true, ts: '123456.789' }),
      } as Response;
    };

    const result = await SlackNotificationService.processEvent({
      eventId: 'evt-123',
      eventType: 'FINDING_CREATED',
      aggregateType: 'Finding',
      aggregateId: 'fnd-123',
      payload: {
        publicId: 'FND-2026-0002',
        code: 'SEC-01',
        title: 'Leak of email john.doe@example.com and rodné číslo 850101/1234',
        severity: 'P0',
      },
    });

    assert.strictEqual(result.success, true);
    assert.ok(postedPayload);
    assert.ok(!postedPayload.text.includes('john.doe@example.com'));
    assert.ok(!postedPayload.text.includes('850101/1234'));
    assert.ok(postedPayload.text.includes('[REDACTED_EMAIL]'));
    assert.ok(postedPayload.text.includes('[REDACTED_RC_PII]'));
  });

  await t.test('4. Should handle non-ok Slack API response', async () => {
    process.env.SLACK_BOT_TOKEN = 'xoxb-test-token';
    process.env.SLACK_DEFAULT_CHANNEL_ID = 'C12345678';

    globalThis.fetch = async () => {
      return {
        ok: false,
        status: 400,
        text: async () => 'Bad Request',
      } as Response;
    };

    const result = await SlackNotificationService.processEvent({
      eventId: 'evt-123',
      eventType: 'AUDIT_CREATED',
      aggregateType: 'Audit',
      aggregateId: 'aud-123',
      payload: { publicId: 'AUD-123', title: 'Audit' },
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.status, 'FAILED');
    assert.ok(result.error?.includes('HTTP 400'));
  });

  await t.test('5. Should handle ok: false Slack API business errors safely', async () => {
    process.env.SLACK_BOT_TOKEN = 'xoxb-test-token';
    process.env.SLACK_DEFAULT_CHANNEL_ID = 'C12345678';

    globalThis.fetch = async () => {
      return {
        ok: true,
        status: 200,
        json: async () => ({ ok: false, error: 'invalid_auth' }),
      } as Response;
    };

    const result = await SlackNotificationService.processEvent({
      eventId: 'evt-123',
      eventType: 'AUDIT_CREATED',
      aggregateType: 'Audit',
      aggregateId: 'aud-123',
      payload: { publicId: 'AUD-123', title: 'Audit' },
    });

    // Client/Config errors should be marked as success to prevent blocking transactional outbox retries infinitely
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.status, 'FAILED');
    assert.strictEqual(result.error, 'invalid_auth');
  });

  await t.test('6. Should handle server 5xx style errors as retriable (success: false)', async () => {
    process.env.SLACK_BOT_TOKEN = 'xoxb-test-token';
    process.env.SLACK_DEFAULT_CHANNEL_ID = 'C12345678';

    globalThis.fetch = async () => {
      return {
        ok: true,
        status: 200,
        json: async () => ({ ok: false, error: 'fatal_server_error' }),
      } as Response;
    };

    const result = await SlackNotificationService.processEvent({
      eventId: 'evt-123',
      eventType: 'AUDIT_CREATED',
      aggregateType: 'Audit',
      aggregateId: 'aud-123',
      payload: { publicId: 'AUD-123', title: 'Audit' },
    });

    // 5xx / general errors are retriable
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.status, 'FAILED');
    assert.strictEqual(result.error, 'fatal_server_error');
  });
});
