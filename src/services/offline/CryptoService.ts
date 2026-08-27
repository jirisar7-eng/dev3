export class CryptoService {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly SALT_LENGTH = 16;
  private static readonly IV_LENGTH = 12;
  private static readonly ITERATIONS = 100000;
  private static readonly HASH_ALGORITHM = 'SHA-256';

  /**
   * Generates a random salt
   */
  static generateSalt(): Uint8Array {
    return globalThis.crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
  }

  /**
   * Derives a Master Encryption Key (MEK) from a PIN and a Salt
   */
  static async deriveKey(pin: string, salt: Uint8Array): Promise<any> {
    const encoder = new TextEncoder();
    const keyMaterial = await globalThis.crypto.subtle.importKey(
      'raw',
      encoder.encode(pin),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    return globalThis.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this.ITERATIONS,
        hash: this.HASH_ALGORITHM
      },
      keyMaterial,
      { name: this.ALGORITHM, length: this.KEY_LENGTH },
      false, // non-extractable
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypts plaintext using the provided key
   */
  static async encrypt(mek: any, plaintext: string): Promise<{ iv: string; ciphertext: string }> {
    if (!mek) {
      throw new Error('ENCRYPTION_FAILED: Missing key');
    }
    const encoder = new TextEncoder();
    const iv = globalThis.crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
    const encodedData = encoder.encode(plaintext);

    const encryptedBuffer = await globalThis.crypto.subtle.encrypt(
      {
        name: this.ALGORITHM,
        iv: iv
      },
      mek,
      encodedData
    );

    return {
      iv: this.bufferToBase64(iv),
      ciphertext: this.bufferToBase64(new Uint8Array(encryptedBuffer))
    };
  }

  /**
   * Decrypts a ciphertext using the provided key and IV
   */
  static async decrypt(mek: any, ivBase64: string, ciphertextBase64: string): Promise<string> {
    if (!mek) {
      throw new Error('DECRYPTION_FAILED: Missing key');
    }
    const iv = this.base64ToBuffer(ivBase64);
    const ciphertext = this.base64ToBuffer(ciphertextBase64);

    try {
      const decryptedBuffer = await globalThis.crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv: iv
        },
        mek,
        ciphertext
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (e) {
      throw new Error('DECRYPTION_FAILED: Data corrupted or wrong key');
    }
  }

  static bufferToBase64(buffer: Uint8Array): string {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(buffer).toString('base64');
    }
    let binary = '';
    const len = buffer.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(buffer[i]);
    }
    return btoa(binary);
  }

  static base64ToBuffer(base64: string): Uint8Array {
    if (typeof Buffer !== 'undefined') {
      return new Uint8Array(Buffer.from(base64, 'base64'));
    }
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
}
