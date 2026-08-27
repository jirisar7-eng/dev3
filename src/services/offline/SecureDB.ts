import { openDB, IDBPDatabase } from 'idb';
import { CryptoService } from './CryptoService';

export interface EncryptedRecord {
  id: string;
  iv: string;
  ciphertext: string;
}

export class SecureDB {
  private static readonly DB_NAME = 'tata_ma_pravo_secure_db';
  private static readonly STORE_NAME = 'encrypted_records';
  private static readonly DB_VERSION = 1;

  // In-memory Master Encryption Key. Never stored on disk.
  private mek: any | null = null;
  private dbPromise: Promise<IDBPDatabase> | null = null;
  private inactivityTimer: any = null;
  private readonly LOCK_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

  constructor() {
    this.initDB();
  }

  private initDB() {
    this.dbPromise = openDB(SecureDB.DB_NAME, SecureDB.DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(SecureDB.STORE_NAME)) {
          db.createObjectStore(SecureDB.STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  }

  /**
   * Unlocks the database by deriving the MEK from the provided PIN and Salt.
   */
  async unlock(pin: string, saltBase64: string): Promise<void> {
    try {
      const salt = CryptoService.base64ToBuffer(saltBase64);
      this.mek = await CryptoService.deriveKey(pin, salt);
      this.resetInactivityTimer();
    } catch (e) {
      throw new Error('UNLOCK_FAILED: Could not derive key');
    }
  }

  /**
   * Locks the database by immediately discarding the MEK from memory.
   */
  lock(): void {
    this.mek = null;
    this.clearInactivityTimer();
  }

  /**
   * Returns true if the MEK is available in memory.
   */
  isLocked(): boolean {
    return this.mek === null;
  }

  /**
   * Encrypts and stores a JSON string under the given ID.
   */
  async setItem(id: string, plaintext: string): Promise<void> {
    this.assertUnlocked();
    this.resetInactivityTimer();
    
    try {
      const { iv, ciphertext } = await CryptoService.encrypt(this.mek, plaintext);
      const record: EncryptedRecord = { id, iv, ciphertext };
      
      const db = await this.dbPromise!;
      await db.put(SecureDB.STORE_NAME, record);
    } catch (e: any) {
      // Fail closed
      throw new Error(`STORE_FAILED: ${e.message}`);
    }
  }

  /**
   * Retrieves and decrypts a JSON string by ID.
   */
  async getItem(id: string): Promise<string | null> {
    this.assertUnlocked();
    this.resetInactivityTimer();

    const db = await this.dbPromise!;
    const record: EncryptedRecord | undefined = await db.get(SecureDB.STORE_NAME, id);
    
    if (!record) {
      return null;
    }

    try {
      return await CryptoService.decrypt(this.mek, record.iv, record.ciphertext);
    } catch (e: any) {
      // Tamper evident / Decryption failure
      // To prevent a corrupted entry from permanently blocking the app, we throw a specific error,
      // but we do NOT return plaintext. Fail closed.
      throw new Error(`DECRYPT_FAILED: Record ${id} is corrupted or key is invalid`);
    }
  }

  /**
   * Removes a record by ID.
   */
  async removeItem(id: string): Promise<void> {
    const db = await this.dbPromise!;
    await db.delete(SecureDB.STORE_NAME, id);
  }

  /**
   * Securely wipes the entire database and locks the session.
   */
  async secureWipe(): Promise<void> {
    this.lock();
    const db = await this.dbPromise!;
    await db.clear(SecureDB.STORE_NAME);
  }

  private assertUnlocked() {
    if (this.isLocked()) {
      throw new Error('ACCESS_DENIED: Database is locked');
    }
  }

  private resetInactivityTimer() {
    this.clearInactivityTimer();
    if (typeof window !== 'undefined' || typeof global !== 'undefined') {
      const setTimeoutFn = typeof window !== 'undefined' ? window.setTimeout : setTimeout;
      this.inactivityTimer = setTimeoutFn(() => {
        this.lock();
      }, this.LOCK_TIMEOUT_MS);
    }
  }

  private clearInactivityTimer() {
    if (this.inactivityTimer) {
      const clearTimeoutFn = typeof window !== 'undefined' ? window.clearTimeout : clearTimeout;
      clearTimeoutFn(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }
}
