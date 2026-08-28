import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import 'fake-indexeddb/auto';
import { CryptoService } from '../src/services/offline/CryptoService';
import { SecureDB } from '../src/services/offline/SecureDB';
import { openDB } from 'idb';

// Ensure global crypto is available for tests in older Node versions (if needed)
if (typeof globalThis.crypto === 'undefined' && typeof require !== 'undefined') {
  globalThis.crypto = require('crypto').webcrypto;
}

describe('Offline Security - CryptoService', () => {
  let salt: Uint8Array;
  let mek: any;
  const pin = '123456';

  before(async () => {
    salt = CryptoService.generateSalt();
    mek = await CryptoService.deriveKey(pin, salt);
  });

  it('should encrypt and decrypt data successfully', async () => {
    const plaintext = 'sensitive_case_data_123';
    const { iv, ciphertext } = await CryptoService.encrypt(mek, plaintext);
    
    assert.notStrictEqual(ciphertext, plaintext, 'Ciphertext should not match plaintext');
    assert.ok(iv, 'IV should be present');
    
    const decrypted = await CryptoService.decrypt(mek, iv, ciphertext);
    assert.strictEqual(decrypted, plaintext, 'Decrypted text should match original plaintext');
  });

  it('should fail decryption with wrong key (Fail-Closed)', async () => {
    const plaintext = 'secret_data';
    const { iv, ciphertext } = await CryptoService.encrypt(mek, plaintext);
    
    // Derive a wrong key
    const wrongSalt = CryptoService.generateSalt();
    const wrongMek = await CryptoService.deriveKey('654321', wrongSalt);
    
    await assert.rejects(
      async () => {
        await CryptoService.decrypt(wrongMek, iv, ciphertext);
      },
      (err: Error) => {
        assert.match(err.message, /DECRYPTION_FAILED/);
        return true;
      },
      'Should reject with DECRYPTION_FAILED'
    );
  });

  it('should fail decryption if ciphertext is modified (Tamper Evident)', async () => {
    const plaintext = 'immutable_data';
    const { iv, ciphertext } = await CryptoService.encrypt(mek, plaintext);
    
    // Modify ciphertext (change last character)
    const modifiedCiphertext = ciphertext.substring(0, ciphertext.length - 1) + (ciphertext.endsWith('A') ? 'B' : 'A');
    
    await assert.rejects(
      async () => {
        await CryptoService.decrypt(mek, iv, modifiedCiphertext);
      },
      (err: Error) => {
        assert.match(err.message, /DECRYPTION_FAILED/);
        return true;
      },
      'Should reject with DECRYPTION_FAILED'
    );
  });
});

describe('Offline Security - SecureDB', () => {
  let db: SecureDB;
  const pin = '123456';
  let saltBase64: string;

  beforeEach(async () => {
    // Clear fake-indexeddb for a clean slate
    const iDB = await openDB('tata_ma_pravo_secure_db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('encrypted_records')) {
          db.createObjectStore('encrypted_records', { keyPath: 'id' });
        }
      },
    });
    if (iDB.objectStoreNames.contains('encrypted_records')) {
      await iDB.clear('encrypted_records');
    }
    iDB.close();

    db = new SecureDB();
    const salt = CryptoService.generateSalt();
    saltBase64 = CryptoService.bufferToBase64(salt);
  });

  it('should initialize as locked', () => {
    assert.strictEqual(db.isLocked(), true, 'DB should start locked');
  });

  it('should prevent access when locked', async () => {
    await assert.rejects(
      async () => {
        await db.setItem('test_id', 'data');
      },
      (err: Error) => {
        assert.match(err.message, /ACCESS_DENIED/);
        return true;
      }
    );

    await assert.rejects(
      async () => {
        await db.getItem('test_id');
      },
      (err: Error) => {
        assert.match(err.message, /ACCESS_DENIED/);
        return true;
      }
    );
  });

  it('should unlock successfully with valid PIN and Salt', async () => {
    await db.unlock(pin, saltBase64);
    assert.strictEqual(db.isLocked(), false, 'DB should be unlocked');
  });

  it('should store and retrieve encrypted items', async () => {
    await db.unlock(pin, saltBase64);
    const plaintext = JSON.stringify({ caseId: 1, notes: 'Secret notes' });
    
    await db.setItem('case_1', plaintext);
    const retrieved = await db.getItem('case_1');
    
    assert.strictEqual(retrieved, plaintext, 'Retrieved item should match original');
  });

  it('should return null for empty/non-existent storage items', async () => {
    await db.unlock(pin, saltBase64);
    const item = await db.getItem('non_existent');
    assert.strictEqual(item, null, 'Should return null for non-existent items');
  });

  it('should not leak plaintext to IndexedDB', async () => {
    await db.unlock(pin, saltBase64);
    const plaintext = 'SUPER_SECRET_PLAINTEXT';
    await db.setItem('leak_test', plaintext);

    // Bypass SecureDB and read directly from IndexedDB
    const iDB = await openDB('tata_ma_pravo_secure_db', 1);
    const rawRecord = await iDB.get('encrypted_records', 'leak_test');
    
    assert.ok(rawRecord, 'Record should exist in IDB');
    assert.ok(rawRecord.ciphertext, 'Ciphertext should exist');
    assert.ok(rawRecord.iv, 'IV should exist');
    assert.doesNotMatch(rawRecord.ciphertext, /SUPER_SECRET_PLAINTEXT/, 'Ciphertext MUST NOT contain plaintext');
    assert.doesNotMatch(JSON.stringify(rawRecord), /SUPER_SECRET_PLAINTEXT/, 'Raw record MUST NOT contain plaintext');
    iDB.close();
  });

  it('should handle multiple records', async () => {
    await db.unlock(pin, saltBase64);
    await db.setItem('record1', 'data1');
    await db.setItem('record2', 'data2');

    assert.strictEqual(await db.getItem('record1'), 'data1');
    assert.strictEqual(await db.getItem('record2'), 'data2');
  });

  it('should secure wipe the database and lock session', async () => {
    await db.unlock(pin, saltBase64);
    await db.setItem('wipe_test', 'data');
    
    await db.secureWipe();
    assert.strictEqual(db.isLocked(), true, 'DB should be locked after wipe');

    // Need to unlock to verify it's empty
    await db.unlock(pin, saltBase64);
    const item = await db.getItem('wipe_test');
    assert.strictEqual(item, null, 'Item should be wiped from DB');
  });

  it('should throw DECRYPT_FAILED on corrupted IDB record', async () => {
    await db.unlock(pin, saltBase64);
    await db.setItem('corrupt_test', 'valid_data');

    // Manually corrupt the DB record
    const iDB = await openDB('tata_ma_pravo_secure_db', 1);
    const rawRecord = await iDB.get('encrypted_records', 'corrupt_test');
    rawRecord.ciphertext = 'CORRUPTED' + rawRecord.ciphertext;
    await iDB.put('encrypted_records', rawRecord);
    iDB.close();

    await assert.rejects(
      async () => {
        await db.getItem('corrupt_test');
      },
      (err: Error) => {
        assert.match(err.message, /DECRYPT_FAILED/);
        return true;
      }
    );
  });

  after(() => {
    setTimeout(() => process.exit(0), 50);
  });
});
