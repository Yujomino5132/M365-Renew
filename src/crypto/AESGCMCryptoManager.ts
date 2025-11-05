import {ICryptoManager} from '@/crypto/ICryptoManager'

export class AESGCMCryptoManager extends ICryptoManager {
  private key: CryptoKey;

  static importKeyFromB64(b64Key: string): Promise<CryptoKey> {
    const jwk = JSON.parse(atob(b64Key));
    return crypto.subtle.importKey(
      "jwk",
      jwk,
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"]
    );
  }

  private constructor(key: CryptoKey) {
    super();
    this.key = key;
  }

  static async create(key?: CryptoKey, b64Key?: string): Promise<AESGCMCryptoManager> {
    console.log('AESGCMCryptoManager.create called');
    let cryptoKey: CryptoKey;
    if (key) {
      cryptoKey = key;
    } else if (b64Key) {
      cryptoKey = await AESGCMCryptoManager.importKeyFromB64(b64Key);
    } else {
      cryptoKey = await crypto.subtle.generateKey(
        {
          name: "AES-GCM",
          length: 256,
        },
        true,
        ["encrypt", "decrypt"]
      );
    }
    return new AESGCMCryptoManager(cryptoKey);
  }

  async encryptData(data: ArrayBuffer): Promise<{ iv: ArrayBuffer, encryptedData: ArrayBuffer }> {
    const iv = crypto.getRandomValues(new Uint8Array(12)); // AES-GCM recommends 12-byte IV
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      this.key,
      data
    );
    return { iv: iv.buffer, encryptedData };
  }

  async decryptData(encryptedData: ArrayBuffer, iv: ArrayBuffer): Promise<ArrayBuffer> {
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      this.key,
      encryptedData
    );
    return decryptedData;
  }

  async exportKey(): Promise<string> {
    const jwk = await crypto.subtle.exportKey("jwk", this.key);
    return btoa(JSON.stringify(jwk));
  }



}
