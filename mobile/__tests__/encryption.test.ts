import { decryptValue, encryptValue, hashPasswordPBKDF2, verifyPasswordPBKDF2 } from '@/services/encryption';

const key = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

describe('encryption service', () => {
  it('hashes and verifies passwords with a salt', () => {
    const result = hashPasswordPBKDF2('correct horse battery staple');

    expect(result.salt).toHaveLength(32);
    expect(result.hash).toHaveLength(64);
    expect(verifyPasswordPBKDF2('correct horse battery staple', result.salt, result.hash)).toBe(true);
    expect(verifyPasswordPBKDF2('wrong password', result.salt, result.hash)).toBe(false);
  });

  it('round-trips AES-GCM data and rejects tampering', () => {
    const encrypted = encryptValue('confidential result', key);

    expect(encrypted.startsWith('v2:')).toBe(true);
    expect(decryptValue(encrypted, key)).toBe('confidential result');

    const parts = encrypted.split(':');
    const tamperedIndex = Math.floor(parts[3].length / 2);
    const replacement = parts[3][tamperedIndex] === 'A' ? 'B' : 'A';
    parts[3] = `${parts[3].slice(0, tamperedIndex)}${replacement}${parts[3].slice(tamperedIndex + 1)}`;
    expect(() => decryptValue(parts.join(':'), key)).toThrow();
  });
});
