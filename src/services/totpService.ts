import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export class TotpService {
  /**
   * Generates a TOTP secret and 8 alphanumeric backup codes.
   */
  static generateSecret(email: string) {
    const secret = speakeasy.generateSecret({
      name: `TataMaPravo:${email}`,
      issuer: 'TataMaPravo',
    });

    // Generate 8-character backup codes
    const backupCodes: string[] = [];
    for (let i = 0; i < 8; i++) {
      backupCodes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }

    return {
      otpauthUrl: secret.otpauth_url,
      base32: secret.base32,
      backupCodes,
    };
  }

  /**
   * Generates a QR code image as a data URL for scanning in the authenticator app.
   */
  static async generateQrCodeDataUrl(otpauthUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      QRCode.toDataURL(otpauthUrl, (err, imageUrl) => {
        if (err) reject(err);
        else resolve(imageUrl);
      });
    });
  }

  /**
   * Verifies the given 6-digit TOTP token against the secret key.
   */
  static verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow a tolerance window of 2 steps (60s) before/after
    });
  }
}
