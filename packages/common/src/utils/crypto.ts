import crypto from 'node:crypto';

export const SYMMETRIC_ENCRYPTION_ALGORITHM = 'aes-256-cbc';

export const symmetricEncrypt = (plain: string, b64key: string): string | null => {
  try {
    const key = Buffer.from(b64key, 'base64');
    const iv = crypto.randomBytes(16); // 128-bit IV
    const cipher = crypto.createCipheriv(SYMMETRIC_ENCRYPTION_ALGORITHM, key, iv);
    let encrypted = cipher.update(plain, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return Buffer.concat([iv, Buffer.from(encrypted, 'base64')]).toString('base64');
  } catch (error) {
    // Failed to encrypt
    console.error(error);
  }
  return null;
};

export const symmetricDecrypt = (b64cipher: string, b64key: string): string | null => {
  try {
    const cipher = Buffer.from(b64cipher, 'base64');
    const key = Buffer.from(b64key, 'base64');
    const iv = cipher.subarray(0, 16);
    const encrypted = cipher.subarray(16).toString('base64');
    const decipher = crypto.createDecipheriv(SYMMETRIC_ENCRYPTION_ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    // Failed to decrypt
    console.error(error);
  }
  return null;
};
