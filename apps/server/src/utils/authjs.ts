import { hkdf } from '@panva/hkdf';
import { jwtDecrypt } from 'jose';

/** Decodes a Auth.js issued JWT. */
export async function decode(params: { token: string; secret: string; salt: string }) {
  const { token, secret, salt } = params;
  const encryptionSecret = await getDerivedEncryptionKey(secret, salt);
  const { payload } = await jwtDecrypt(token, encryptionSecret, {
    clockTolerance: 15,
  });
  return payload;
}

async function getDerivedEncryptionKey(keyMaterial: string, salt: string) {
  return await hkdf('sha256', keyMaterial, salt, `Auth.js Generated Encryption Key (${salt})`, 32);
}
