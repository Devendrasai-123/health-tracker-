import CryptoJS from 'crypto-js';
import { gcm } from '@noble/ciphers/aes';

import { keyValueStore } from '@/services/key-value-store';

const LEGACY_KEY_STORE = 'lifos.key';
const LEGACY_KEY_VERIFIER = 'lifos.verifier';
const AUTH_SALT = 'lifos.auth.salt';
const AUTH_HASH = 'lifos.auth.hash';
const KEY_STORE = 'lifos.key.v2';

const PBKDF2_ITERATIONS = 100_000;
const KEY_BYTES = 32;
const GCM_NONCE_BYTES = 12;
const GCM_TAG_BYTES = 16;

type Reencryptor = (oldKeyHex: string, newKeyHex: string) => Promise<void>;

export interface PasswordHash {
  salt: string;
  hash: string;
}

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  tag: string;
  algorithm: 'AES-256-GCM';
}

function wordArrayToBytes(value: CryptoJS.lib.WordArray): Uint8Array {
  const words = value.words;
  const bytes = new Uint8Array(value.sigBytes);
  for (let i = 0; i < value.sigBytes; i++) {
    bytes[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
  }
  return bytes;
}

function bytesToWordArray(bytes: Uint8Array): CryptoJS.lib.WordArray {
  const words: number[] = [];
  for (let i = 0; i < bytes.length; i++) {
    words[i >>> 2] = (words[i >>> 2] || 0) | (bytes[i] << (24 - (i % 4) * 8));
  }
  return CryptoJS.lib.WordArray.create(words, bytes.length);
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array {
  if (!/^(?:[0-9a-f]{2})+$/i.test(hex)) throw new Error('Invalid hexadecimal key or nonce.');
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  return CryptoJS.enc.Base64.stringify(bytesToWordArray(bytes));
}

function base64ToBytes(value: string): Uint8Array {
  return wordArrayToBytes(CryptoJS.enc.Base64.parse(value));
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let i = 0; i < left.length; i++) difference |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return difference === 0;
}

function randomHex(bytes: number): string {
  return bytesToHex(wordArrayToBytes(CryptoJS.lib.WordArray.random(bytes)));
}

export function hashPasswordPBKDF2(password: string, salt = randomHex(16)): PasswordHash {
  const derived = CryptoJS.PBKDF2(password, CryptoJS.enc.Hex.parse(salt), {
    keySize: KEY_BYTES / 4,
    iterations: PBKDF2_ITERATIONS,
    hasher: CryptoJS.algo.SHA256,
  });
  return { salt, hash: derived.toString(CryptoJS.enc.Hex) };
}

export function verifyPasswordPBKDF2(password: string, salt: string, storedHash: string): boolean {
  const { hash } = hashPasswordPBKDF2(password, salt);
  return constantTimeEqual(hash, storedHash);
}

function legacyKey(password: string): string {
  return CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
}

function legacyVerifier(keyHex: string): string {
  return CryptoJS.SHA256(keyHex).toString(CryptoJS.enc.Hex);
}

function encodePayload(payload: EncryptedPayload): string {
  return `v2:${payload.iv}:${payload.tag}:${payload.ciphertext}`;
}

function decodePayload(payload: string): EncryptedPayload | null {
  const [version, iv, tag, ciphertext] = payload.split(':');
  if (version !== 'v2' || !iv || !tag || !ciphertext) return null;
  if (iv.length !== GCM_NONCE_BYTES * 2 || tag.length !== GCM_TAG_BYTES * 2) {
    throw new Error('Malformed encrypted payload.');
  }
  return { algorithm: 'AES-256-GCM', iv, tag, ciphertext };
}

function encryptGcm(plaintext: string, keyHex: string): string {
  const key = hexToBytes(keyHex);
  const iv = hexToBytes(randomHex(GCM_NONCE_BYTES));
  const encrypted = gcm(key, iv).encrypt(new TextEncoder().encode(plaintext));
  const ciphertext = encrypted.slice(0, encrypted.length - GCM_TAG_BYTES);
  const tag = encrypted.slice(encrypted.length - GCM_TAG_BYTES);
  return encodePayload({
    algorithm: 'AES-256-GCM',
    iv: bytesToHex(iv),
    tag: bytesToHex(tag),
    ciphertext: bytesToBase64(ciphertext),
  });
}

function decryptGcm(payload: EncryptedPayload, keyHex: string): string {
  try {
    const key = hexToBytes(keyHex);
    const iv = hexToBytes(payload.iv);
    const ciphertext = base64ToBytes(payload.ciphertext);
    const tag = hexToBytes(payload.tag);
    const plaintext = gcm(key, iv).decrypt(new Uint8Array([...ciphertext, ...tag]));
    return new TextDecoder().decode(plaintext);
  } catch {
    throw new Error('Encrypted data failed authentication and may have been tampered with.');
  }
}

function decryptLegacy(payload: string, keyHex: string): string {
  const [ivHex, ctBase64] = payload.split(':');
  if (!ivHex || !ctBase64) throw new Error('Malformed encrypted payload.');
  const iv = CryptoJS.enc.Hex.parse(ivHex);
  const keyWord = CryptoJS.enc.Hex.parse(keyHex);
  const cipherParams = CryptoJS.lib.CipherParams.create({
    ciphertext: CryptoJS.enc.Base64.parse(ctBase64),
  });
  const bytes = CryptoJS.AES.decrypt(cipherParams, keyWord, { iv });
  const plaintext = bytes.toString(CryptoJS.enc.Utf8);
  if (!plaintext) throw new Error('Legacy encrypted data could not be decrypted.');
  return plaintext;
}

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
    const salt = await keyValueStore.getItem(AUTH_SALT);
    const hash = await keyValueStore.getItem(AUTH_HASH);
    const legacyVerifierValue = await keyValueStore.getItem(LEGACY_KEY_VERIFIER);
    return Boolean((salt && hash) || legacyVerifierValue);
  }

  async setup(password: string): Promise<void> {
    const { salt, hash } = hashPasswordPBKDF2(password);
    const keyHex = hash;
    await keyValueStore.setItem(AUTH_SALT, salt);
    await keyValueStore.setItem(AUTH_HASH, hash);
    await keyValueStore.setItem(KEY_STORE, keyHex);
    this.key = keyHex;
  }

  async unlock(password: string): Promise<boolean> {
    const salt = await keyValueStore.getItem(AUTH_SALT);
    const hash = await keyValueStore.getItem(AUTH_HASH);
    const storedKey = await keyValueStore.getItem(KEY_STORE);

    if (salt && hash && storedKey) {
      if (!verifyPasswordPBKDF2(password, salt, hash)) return false;
      this.key = storedKey;
      return true;
    }

    return this.unlockLegacy(password);
  }

  private async unlockLegacy(password: string): Promise<boolean> {
    const storedKey = await keyValueStore.getItem(LEGACY_KEY_STORE);
    const storedVerifier = await keyValueStore.getItem(LEGACY_KEY_VERIFIER);
    if (!storedKey || !storedVerifier) return false;
    if (!constantTimeEqual(legacyVerifier(legacyKey(password)), storedVerifier)) return false;

    const { salt, hash } = hashPasswordPBKDF2(password);
    await keyValueStore.setItem(AUTH_SALT, salt);
    await keyValueStore.setItem(AUTH_HASH, hash);
    await keyValueStore.setItem(KEY_STORE, hash);
    await keyValueStore.removeItem(LEGACY_KEY_STORE);
    await keyValueStore.removeItem(LEGACY_KEY_VERIFIER);
    this.key = hash;
    if (this.reencryptor) await this.reencryptor(storedKey, hash);
    return true;
  }

  lock(): void {
    this.key = null;
  }

  async reset(): Promise<void> {
    this.key = null;
    await Promise.all([
      keyValueStore.removeItem(KEY_STORE),
      keyValueStore.removeItem(AUTH_SALT),
      keyValueStore.removeItem(AUTH_HASH),
      keyValueStore.removeItem(LEGACY_KEY_STORE),
      keyValueStore.removeItem(LEGACY_KEY_VERIFIER),
    ]);
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    if (!(await this.unlock(currentPassword))) return false;
    const oldKey = this.key;
    if (!oldKey) return false;
    const { salt, hash } = hashPasswordPBKDF2(newPassword);
    if (this.reencryptor) await this.reencryptor(oldKey, hash);
    await keyValueStore.setItem(AUTH_SALT, salt);
    await keyValueStore.setItem(AUTH_HASH, hash);
    await keyValueStore.setItem(KEY_STORE, hash);
    this.key = hash;
    return true;
  }

  encrypt(plaintext: string): string {
    if (!this.key) throw new Error('App is locked. Unlock before writing data.');
    return encryptGcm(plaintext, this.key);
  }

  decrypt(payload: string): string {
    if (!this.key) throw new Error('App is locked.');
    const parsed = decodePayload(payload);
    return parsed ? decryptGcm(parsed, this.key) : decryptLegacy(payload, this.key);
  }

  decryptWithKey(payload: string, keyHex: string): string {
    const parsed = decodePayload(payload);
    return parsed ? decryptGcm(parsed, keyHex) : decryptLegacy(payload, keyHex);
  }

  encryptWithKey(plaintext: string, keyHex: string): string {
    return encryptGcm(plaintext, keyHex);
  }
}

export const encryptionService = new EncryptionService();

export function encryptValue(value: string, keyHex?: string): string {
  return keyHex ? encryptionService.encryptWithKey(value, keyHex) : encryptionService.encrypt(value);
}

export function decryptValue(encrypted: string, keyHex?: string): string {
  return keyHex ? encryptionService.decryptWithKey(encrypted, keyHex) : encryptionService.decrypt(encrypted);
}
