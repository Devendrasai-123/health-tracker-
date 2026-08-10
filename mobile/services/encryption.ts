import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import CryptoJS from 'crypto-js';

const SALT_BYTES = 16;
const IV_BYTES = 16;
const KEY_BYTES = 32;
export const PBKDF2_ITERATIONS = 60_000;

const KEY_SALT = 'lifos.salt';
const KEY_VERIFIER = 'lifos.verifier';

function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (const b of bytes) hex += b.toString(16).padStart(2, '0');
  return hex;
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function wordArrayFromBytes(bytes: Uint8Array): CryptoJS.lib.WordArray {
  return CryptoJS.enc.Hex.parse(bytesToHex(bytes));
}

function randomBytes(count: number): Uint8Array {
  return Crypto.getRandomBytes(count);
}

async function deriveKeyHex(password: string, salt: Uint8Array): Promise<string> {
  const key = CryptoJS.PBKDF2(password, wordArrayFromBytes(salt), {
    keySize: KEY_BYTES / 4,
    iterations: PBKDF2_ITERATIONS,
    hasher: CryptoJS.algo.SHA256,
  });
  return key.toString(CryptoJS.enc.Hex);
}

type Reencryptor = (oldKeyHex: string, newKeyHex: string) => Promise<void>;

class EncryptionService {
  private key: string | null = null;
  private reencryptor: Reencryptor | null = null;

  isUnlocked(): boolean {
    return this.key != null;
  }

  setReencryptor(fn: Reencryptor | null): void {
    this.reencryptor = fn;
  }

  async isInitialized(): Promise<boolean> {
    const salt = await SecureStore.getItemAsync(KEY_SALT);
    const verifier = await SecureStore.getItemAsync(KEY_VERIFIER);
    return !!(salt && verifier);
  }

  async setup(password: string): Promise<void> {
    const salt = randomBytes(SALT_BYTES);
    const keyHex = await deriveKeyHex(password, salt);
    const verifier = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, keyHex);
    await SecureStore.setItemAsync(KEY_SALT, bytesToHex(salt));
    await SecureStore.setItemAsync(KEY_VERIFIER, verifier);
    this.key = keyHex;
  }

  async unlock(password: string): Promise<boolean> {
    const saltHex = await SecureStore.getItemAsync(KEY_SALT);
    const storedVerifier = await SecureStore.getItemAsync(KEY_VERIFIER);
    if (!saltHex || !storedVerifier) return false;
    const salt = hexToBytes(saltHex);
    const keyHex = await deriveKeyHex(password, salt);
    const verifier = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, keyHex);
    if (verifier === storedVerifier) {
      this.key = keyHex;
      return true;
    }
    return false;
  }

  lock(): void {
    this.key = null;
  }

  async reset(): Promise<void> {
    this.key = null;
    await SecureStore.deleteItemAsync(KEY_SALT);
    await SecureStore.deleteItemAsync(KEY_VERIFIER);
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    const saltHex = await SecureStore.getItemAsync(KEY_SALT);
    const storedVerifier = await SecureStore.getItemAsync(KEY_VERIFIER);
    if (!saltHex || !storedVerifier) return false;
    const salt = hexToBytes(saltHex);
    const oldKeyHex = await deriveKeyHex(currentPassword, salt);
    const verifier = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, oldKeyHex);
    if (verifier !== storedVerifier) return false;

    const newSalt = randomBytes(SALT_BYTES);
    const newKeyHex = await deriveKeyHex(newPassword, newSalt);
    const newVerifier = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, newKeyHex);

    if (this.reencryptor) {
      await this.reencryptor(oldKeyHex, newKeyHex);
    }

    await SecureStore.setItemAsync(KEY_SALT, bytesToHex(newSalt));
    await SecureStore.setItemAsync(KEY_VERIFIER, newVerifier);
    this.key = newKeyHex;
    return true;
  }

  encrypt(plaintext: string): string {
    if (!this.key) throw new Error('App is locked. Unlock before writing data.');
    const iv = randomBytes(IV_BYTES);
    const ivWord = wordArrayFromBytes(iv);
    const keyWord = CryptoJS.enc.Hex.parse(this.key);
    const cipher = CryptoJS.AES.encrypt(plaintext, keyWord, { iv: ivWord });
    const ciphertext = cipher.ciphertext.toString(CryptoJS.enc.Base64);
    return `${bytesToHex(iv)}:${ciphertext}`;
  }

  decrypt(payload: string): string {
    if (!this.key) throw new Error('App is locked.');
    const [ivHex, ctBase64] = payload.split(':');
    if (!ivHex || !ctBase64) throw new Error('Malformed encrypted payload.');
    const iv = CryptoJS.enc.Hex.parse(ivHex);
    const keyWord = CryptoJS.enc.Hex.parse(this.key);
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Base64.parse(ctBase64),
    });
    const bytes = CryptoJS.AES.decrypt(cipherParams, keyWord, { iv });
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  decryptWithKey(payload: string, keyHex: string): string {
    const [ivHex, ctBase64] = payload.split(':');
    if (!ivHex || !ctBase64) throw new Error('Malformed encrypted payload.');
    const iv = CryptoJS.enc.Hex.parse(ivHex);
    const keyWord = CryptoJS.enc.Hex.parse(keyHex);
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Base64.parse(ctBase64),
    });
    const bytes = CryptoJS.AES.decrypt(cipherParams, keyWord, { iv });
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  encryptWithKey(plaintext: string, keyHex: string): string {
    const iv = randomBytes(IV_BYTES);
    const ivWord = wordArrayFromBytes(iv);
    const keyWord = CryptoJS.enc.Hex.parse(keyHex);
    const cipher = CryptoJS.AES.encrypt(plaintext, keyWord, { iv: ivWord });
    const ciphertext = cipher.ciphertext.toString(CryptoJS.enc.Base64);
    return `${bytesToHex(iv)}:${ciphertext}`;
  }
}

export const encryptionService = new EncryptionService();

/** Convenience wrappers matching the prompt API. */
export function encryptValue(value: string, keyHex?: string): string {
  if (keyHex) return encryptionService.encryptWithKey(value, keyHex);
  return encryptionService.encrypt(value);
}

export function decryptValue(encrypted: string, keyHex?: string): string {
  if (keyHex) return encryptionService.decryptWithKey(encrypted, keyHex);
  return encryptionService.decrypt(encrypted);
}
