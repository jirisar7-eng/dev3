import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';

export class TotpService {
  /**
   * Hashes a backup code using SHA-256 for secure comparison.
   */
  static hashBackupCode(code: string): string {
    return crypto.createHash('sha256').update(code.trim().toUpperCase()).digest('hex');
  }

  /**
   * Generates a TOTP secret and 8 cryptographically secure backup codes.
   */
  static generateSecret(email: string) {
    const secret = speakeasy.generateSecret({
      name: `TataMaPravo:${email}`,
      issuer: 'TataMaPravo',
    });

    // Generate 8 cryptographically secure 8-character backup codes using crypto
    const backupCodes: string[] = [];
    for (let i = 0; i < 8; i++) {
      const buf = crypto.randomBytes(5).toString('hex').substring(0, 8).toUpperCase();
      backupCodes.push(buf);
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

