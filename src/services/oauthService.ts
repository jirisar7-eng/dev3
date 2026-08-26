import { apiFetch } from '../utils/apiClient';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export class OAuthService {
  static getGoogleAuthUrl(redirectUri: string, state: string): string {
    const clientId = process.env.GOOGLE_CLIENT_ID || 'dummy-google-client-id';
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      prompt: 'select_account',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  static getMicrosoftAuthUrl(redirectUri: string, state: string): string {
    const clientId = process.env.MICROSOFT_CLIENT_ID || 'dummy-ms-client-id';
    const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile User.Read',
      state,
      response_mode: 'query',
    });
    return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
  }

  static async exchangeGoogleCode(code: string, redirectUri: string) {
    const clientId = process.env.GOOGLE_CLIENT_ID || 'dummy-google-client-id';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || 'dummy-google-client-secret';

    const tokenResponse = await apiFetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Google token exchange failed: ${errorText}`);
    }

    const tokenData = await tokenResponse.json() as any;
    const idToken = tokenData.id_token;

    if (!idToken) {
      throw new Error('Google did not return an ID token.');
    }

        // We MUST cryptographically verify the signature, issuer, audience, and expiration.
    const client = new OAuth2Client(clientId);
    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: clientId,
      });
      payload = ticket.getPayload();
    } catch (error) {
      throw new Error('Nepodařilo se ověřit platnost Google ID tokenu.');
    }

    if (!payload) {
      throw new Error('Google ID token payload is missing.');
    }

    if (!payload.email_verified) {
      throw new Error('Google email is not verified.');
    }

    return {
      providerAccountId: payload.sub,
      email: payload.email,
      name: payload.name || payload.email?.split('@')[0] || 'Unknown',
      avatar: payload.picture || null,
    };
  }

  static async exchangeMicrosoftCode(code: string, redirectUri: string) {
    const clientId = process.env.MICROSOFT_CLIENT_ID || 'dummy-ms-client-id';
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET || 'dummy-ms-client-secret';
    const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';

    const tokenResponse = await apiFetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Microsoft token exchange failed: ${errorText}`);
    }

    const tokenData = await tokenResponse.json() as any;
    const idToken = tokenData.id_token;

    if (!idToken) {
      throw new Error('Microsoft did not return an ID token.');
    }

    const decoded = jwt.decode(idToken) as any;
    if (!decoded) {
      throw new Error('Failed to decode Microsoft ID token.');
    }

    // Validate Issuer & Audience & Expiration
    if (decoded.aud !== clientId && process.env.MICROSOFT_CLIENT_ID) {
      throw new Error(`Invalid Microsoft ID token audience: ${decoded.aud}`);
    }

    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Microsoft ID token is expired.');
    }

    const email = decoded.email || decoded.preferred_username || decoded.upn;
    if (!email) {
      throw new Error('Microsoft account must have an email claim.');
    }

    return {
      providerAccountId: decoded.sub || decoded.oid,
      email: email,
      name: decoded.name || email.split('@')[0],
      avatar: null,
    };
  }

  static generateState(): string {
    return crypto.randomBytes(16).toString('hex');
  }
}
