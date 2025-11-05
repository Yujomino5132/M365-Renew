import { describe, it, expect, beforeEach } from 'vitest';
import { AESGCMCryptoManager } from '@/crypto/AESGCMCryptoManager';

describe('AESGCMCryptoManager', () => {
  let cryptoManager: AESGCMCryptoManager;
  let testData: ArrayBuffer;

  beforeEach(async () => {
    cryptoManager = await AESGCMCryptoManager.create();
    testData = new TextEncoder().encode('test data');
  });

  describe('create', () => {
    it('should create instance with generated key', async () => {
      const manager = await AESGCMCryptoManager.create();
      expect(manager).toBeInstanceOf(AESGCMCryptoManager);
    });

    it('should create instance with provided key', async () => {
      const key = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
      const manager = await AESGCMCryptoManager.create(key);
      expect(manager).toBeInstanceOf(AESGCMCryptoManager);
    });

    it('should create instance from base64 key', async () => {
      const originalManager = await AESGCMCryptoManager.create();
      const b64Key = await originalManager.exportKey();
      const manager = await AESGCMCryptoManager.create(undefined, b64Key);
      expect(manager).toBeInstanceOf(AESGCMCryptoManager);
    });
  });

  describe('encryptData', () => {
    it('should encrypt data and return iv and encrypted data', async () => {
      const result = await cryptoManager.encryptData(testData);
      
      expect(result.iv).toBeInstanceOf(ArrayBuffer);
      expect(result.encryptedData).toBeInstanceOf(ArrayBuffer);
      expect(result.iv.byteLength).toBe(12);
      expect(result.encryptedData.byteLength).toBeGreaterThan(0);
    });

    it('should produce different iv for each encryption', async () => {
      const result1 = await cryptoManager.encryptData(testData);
      const result2 = await cryptoManager.encryptData(testData);
      
      expect(new Uint8Array(result1.iv)).not.toEqual(new Uint8Array(result2.iv));
    });
  });

  describe('decryptData', () => {
    it('should decrypt data correctly', async () => {
      const { iv, encryptedData } = await cryptoManager.encryptData(testData);
      const decryptedData = await cryptoManager.decryptData(encryptedData, iv);
      
      expect(new Uint8Array(decryptedData)).toEqual(new Uint8Array(testData));
    });

    it('should fail with wrong iv', async () => {
      const { encryptedData } = await cryptoManager.encryptData(testData);
      const wrongIv = crypto.getRandomValues(new Uint8Array(12));
      
      await expect(cryptoManager.decryptData(encryptedData, wrongIv.buffer))
        .rejects.toThrow();
    });
  });

  describe('exportKey', () => {
    it('should export key as base64 string', async () => {
      const b64Key = await cryptoManager.exportKey();
      
      expect(typeof b64Key).toBe('string');
      expect(b64Key.length).toBeGreaterThan(0);
      expect(() => atob(b64Key)).not.toThrow();
    });

    it('should export key that can be reimported', async () => {
      const b64Key = await cryptoManager.exportKey();
      const newManager = await AESGCMCryptoManager.create(undefined, b64Key);
      
      const { iv, encryptedData } = await cryptoManager.encryptData(testData);
      const decryptedData = await newManager.decryptData(encryptedData, iv);
      
      expect(new Uint8Array(decryptedData)).toEqual(new Uint8Array(testData));
    });
  });

  describe('importKeyFromB64', () => {
    it('should import key from base64 string', async () => {
      const b64Key = await cryptoManager.exportKey();
      const importedKey = await AESGCMCryptoManager.importKeyFromB64(b64Key);
      
      expect(importedKey).toBeInstanceOf(CryptoKey);
      expect(importedKey.algorithm.name).toBe('AES-GCM');
    });
  });
});
