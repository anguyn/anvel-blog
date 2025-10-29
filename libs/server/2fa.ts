// libs/2fa.ts
import { authenticator } from 'otplib';
import crypto from 'crypto';
import QRCode from 'qrcode';

// Cấu hình TOTP
authenticator.options = {
  window: 1, // Allow 1 step before/after (30s window each side)
};

export async function generate2FASecret(
  email: string,
  appName: string = process.env.NEXT_PUBLIC_DEFAULT_APP_NAME || 'Anvel',
) {
  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(email, appName, secret);

  // Generate QR code
  const qrCode = await QRCode.toDataURL(otpauthUrl);

  return { secret, qrCode, otpauthUrl };
}

export function verify2FAToken(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch (error) {
    return false;
  }
}

export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-digit codes
    const code = crypto.randomInt(10000000, 99999999).toString();
    codes.push(code);
  }
  return codes;
}

export async function hashBackupCode(code: string): Promise<string> {
  const bcrypt = require('bcryptjs');
  return bcrypt.hash(code, 10);
}

export async function verifyBackupCode(
  code: string,
  hashedCode: string,
): Promise<boolean> {
  const bcrypt = require('bcryptjs');
  return bcrypt.compare(code, hashedCode);
}

// Encrypt secret before storing (recommended)
export function encryptSecret(secret: string, key: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-gcm',
    Buffer.from(key, 'hex'),
    iv,
  );

  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decryptSecret(encryptedData: string, key: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    Buffer.from(key, 'hex'),
    Buffer.from(ivHex, 'hex'),
  );

  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
