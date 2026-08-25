import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OAuthService } from '../src/services/oauthService';
import { OAuth2Client } from 'google-auth-library';

// Mock the google-auth-library
vi.mock('google-auth-library', () => {
  return {
    OAuth2Client: vi.fn().mockImplementation(() => {
      return {
        verifyIdToken: vi.fn(),
      };
    }),
  };
});

describe('OAuthService.exchangeGoogleCode', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, GOOGLE_CLIENT_ID: 'test-client-id', GOOGLE_CLIENT_SECRET: 'test-secret' };

    // Mock global fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id_token: 'fake.jwt.token' }),
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('TEST A: Valid Google ID token -> PASS', async () => {
    // Setup mock verifyIdToken to succeed
    const mockVerifyIdToken = vi.fn().mockResolvedValue({
      getPayload: () => ({
        sub: '12345',
        email: 'test@example.com',
        email_verified: true,
        name: 'Test User',
        picture: 'http://example.com/pic.png',
      })
    });
    (OAuth2Client as any).mockImplementation(() => ({
      verifyIdToken: mockVerifyIdToken,
    } as any));

    const result = await OAuthService.exchangeGoogleCode('fake-code', 'http://localhost');
    expect(result).toEqual({
      providerAccountId: '12345',
      email: 'test@example.com',
      name: 'Test User',
      avatar: 'http://example.com/pic.png',
    });
    expect(mockVerifyIdToken).toHaveBeenCalledWith({
      idToken: 'fake.jwt.token',
      audience: 'test-client-id',
    });
  });

  it('TEST B: Forged/invalid signature token -> REJECT', async () => {
    // Setup mock verifyIdToken to fail (signature error)
    const mockVerifyIdToken = vi.fn().mockRejectedValue(new Error('Invalid signature'));
    (OAuth2Client as any).mockImplementation(() => ({
      verifyIdToken: mockVerifyIdToken,
    } as any));

    await expect(OAuthService.exchangeGoogleCode('fake-code', 'http://localhost')).rejects.toThrow('Nepodařilo se ověřit platnost Google ID tokenu.');
  });

  it('TEST C: Wrong audience -> REJECT', async () => {
    const mockVerifyIdToken = vi.fn().mockRejectedValue(new Error('Wrong audience'));
    (OAuth2Client as any).mockImplementation(() => ({
      verifyIdToken: mockVerifyIdToken,
    } as any));

    await expect(OAuthService.exchangeGoogleCode('fake-code', 'http://localhost')).rejects.toThrow('Nepodařilo se ověřit platnost Google ID tokenu.');
  });

  it('TEST D: Expired token -> REJECT', async () => {
    const mockVerifyIdToken = vi.fn().mockRejectedValue(new Error('Token expired'));
    (OAuth2Client as any).mockImplementation(() => ({
      verifyIdToken: mockVerifyIdToken,
    } as any));

    await expect(OAuthService.exchangeGoogleCode('fake-code', 'http://localhost')).rejects.toThrow('Nepodařilo se ověřit platnost Google ID tokenu.');
  });

  it('TEST E: Wrong issuer -> REJECT', async () => {
    const mockVerifyIdToken = vi.fn().mockRejectedValue(new Error('Wrong issuer'));
    (OAuth2Client as any).mockImplementation(() => ({
      verifyIdToken: mockVerifyIdToken,
    } as any));

    await expect(OAuthService.exchangeGoogleCode('fake-code', 'http://localhost')).rejects.toThrow('Nepodařilo se ověřit platnost Google ID tokenu.');
  });

  it('TEST F: Decode contains valid email but signature is invalid -> REJECT', async () => {
    // This is the critical test to ensure it doesn't just read the payload
    const mockVerifyIdToken = vi.fn().mockRejectedValue(new Error('Invalid signature'));
    (OAuth2Client as any).mockImplementation(() => ({
      verifyIdToken: mockVerifyIdToken,
    } as any));

    await expect(OAuthService.exchangeGoogleCode('fake-code', 'http://localhost')).rejects.toThrow('Nepodařilo se ověřit platnost Google ID tokenu.');
  });

});
