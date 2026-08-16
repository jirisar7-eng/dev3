import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  GenerateRegistrationOptionsOpts,
  VerifyRegistrationResponseOpts,
  GenerateAuthenticationOptionsOpts,
  VerifyAuthenticationResponseOpts,
} from '@simplewebauthn/server';

export class PasskeyService {
  static getRpId(reqHost: string): string {
    if (process.env.WEBAUTHN_RP_ID) {
      return process.env.WEBAUTHN_RP_ID;
    }
    // Extract domain from request host (e.g. ais-dev-abc.run.app or localhost:3000)
    return reqHost.split(':')[0];
  }

  static getOrigin(reqHost: string, protocol = 'https'): string {
    if (process.env.WEBAUTHN_ORIGIN) {
      return process.env.WEBAUTHN_ORIGIN;
    }
    const isLocal = reqHost.includes('localhost') || reqHost.includes('127.0.0.1');
    const prot = isLocal ? 'http' : protocol;
    return `${prot}://${reqHost}`;
  }

  static async generateRegOptions(userId: string, userEmail: string, userName: string, reqHost: string, existingCredentialIds: string[] = []) {
    const rpID = this.getRpId(reqHost);
    const opts: GenerateRegistrationOptionsOpts = {
      rpName: process.env.WEBAUTHN_RP_NAME || 'Táta má právo',
      rpID,
      userID: Buffer.from(userId),
      userName: userEmail,
      userDisplayName: userName,
      attestationType: 'none',
      excludeCredentials: existingCredentialIds.map((id) => ({
        id,
        type: 'public-key',
      })),
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'preferred',
      },
    };
    return await generateRegistrationOptions(opts);
  }

  static async verifyRegResponse(body: any, expectedChallenge: string, reqHost: string, protocol = 'https') {
    const rpID = this.getRpId(reqHost);
    const origin = this.getOrigin(reqHost, protocol);
    const opts: VerifyRegistrationResponseOpts = {
      response: body,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: false,
    };
    return await verifyRegistrationResponse(opts);
  }

  static async generateAuthOptions(reqHost: string, allowCredentialIds: string[] = []) {
    const rpID = this.getRpId(reqHost);
    const opts: GenerateAuthenticationOptionsOpts = {
      rpID,
      allowCredentials: allowCredentialIds.map((id) => ({
        id,
        type: 'public-key',
      })),
      userVerification: 'preferred',
    };
    return await generateAuthenticationOptions(opts);
  }

  static async verifyAuthResponse(
    body: any,
    expectedChallenge: string,
    publicKey: Uint8Array | Buffer | string,
    counter: number | bigint,
    reqHost: string,
    protocol = 'https'
  ) {
    const rpID = this.getRpId(reqHost);
    const origin = this.getOrigin(reqHost, protocol);
    const pubKeyBuf = typeof publicKey === 'string'
      ? Buffer.from(publicKey, 'base64')
      : Buffer.from(publicKey);

    const opts: VerifyAuthenticationResponseOpts = {
      response: body,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: body.id,
        publicKey: pubKeyBuf,
        counter: Number(counter),
      },
      requireUserVerification: false,
    };
    return await verifyAuthenticationResponse(opts);
  }
}
