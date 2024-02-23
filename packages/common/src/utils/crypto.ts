import crypto from 'node:crypto';

export class CryptoUtils {
  private readonly key: Buffer;

  constructor(
    b64key: string,
    public readonly algorithm = 'aes-256-cbc',
    public readonly keyBytes = 16,
  ) {
    this.key = Buffer.from(b64key, 'base64');
  }

  public encrypt(
    plain: string,
  ): { success: true; cipher: string } | { success: false; error: unknown } {
    try {
      const iv = crypto.randomBytes(this.keyBytes); // (this.keyBytes * 8)-bit IV
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
      let encrypted = cipher.update(plain, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      return {
        success: true,
        cipher: Buffer.concat([iv, Buffer.from(encrypted, 'base64')]).toString('base64'),
      };
    } catch (error) {
      // Failed to encrypt
      return { success: false, error };
    }
  }

  public decrypt(
    b64cipher: string,
  ): { success: true; plain: string } | { success: false; error: unknown } {
    try {
      const cipher = Buffer.from(b64cipher, 'base64');
      const iv = cipher.subarray(0, this.keyBytes);
      const encrypted = cipher.subarray(this.keyBytes).toString('base64');
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      let decrypted = decipher.update(encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return { success: true, plain: decrypted };
    } catch (error) {
      // Failed to decrypt
      return { success: false, error };
    }
  }
}
