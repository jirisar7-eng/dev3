import { describe, it, expect, vi } from 'vitest';
import { safeJsonResponse } from '../src/utils/apiClient';

describe('src/utils/apiClient.ts - safeJsonResponse', () => {
  it('1. Parses valid JSON when Content-Type is application/json', async () => {
    const mockResponse = new Response(JSON.stringify({ success: true, count: 42 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

    const result = await safeJsonResponse<{ success: boolean; count: number }>(mockResponse);
    expect(result).toEqual({ success: true, count: 42 });
  });

  it('2. Parses valid JSON when Content-Type includes charset (application/json; charset=utf-8)', async () => {
    const mockResponse = new Response(JSON.stringify({ message: 'Ahoj světe' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });

    const result = await safeJsonResponse<{ message: string }>(mockResponse);
    expect(result).toEqual({ message: 'Ahoj světe' });
  });

  it('3. Parses valid JSON when Content-Type is case-insensitive (APPLICATION/JSON)', async () => {
    const mockResponse = new Response(JSON.stringify({ status: 'ok' }), {
      status: 200,
      headers: { 'Content-Type': 'APPLICATION/JSON' },
    });

    const result = await safeJsonResponse<{ status: string }>(mockResponse);
    expect(result).toEqual({ status: 'ok' });
  });

  it('4. Returns null when Content-Type is text/html', async () => {
    const mockResponse = new Response('<html><body>Error 500</body></html>', {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });

    const result = await safeJsonResponse(mockResponse);
    expect(result).toBeNull();
  });

  it('5. Returns null when Content-Type is text/plain', async () => {
    const mockResponse = new Response('Internal Server Error', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });

    const result = await safeJsonResponse(mockResponse);
    expect(result).toBeNull();
  });

  it('6. Returns null when Content-Type header is missing', async () => {
    const mockResponse = new Response(JSON.stringify({ ok: true }), {
      status: 200,
    });

    const result = await safeJsonResponse(mockResponse);
    expect(result).toBeNull();
  });

  it('7. Returns null when JSON parsing fails on malformed body', async () => {
    const mockResponse = new Response('{ invalid json: true, ', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

    const result = await safeJsonResponse(mockResponse);
    expect(result).toBeNull();
  });

  it('8. Returns null when response.json() throws an unexpected error', async () => {
    const mockResponse = {
      headers: {
        get: (header: string) => (header.toLowerCase() === 'content-type' ? 'application/json' : null),
      },
      json: vi.fn().mockRejectedValue(new Error('Stream closed unexpectedly')),
    } as unknown as Response;

    const result = await safeJsonResponse(mockResponse);
    expect(result).toBeNull();
  });
});
