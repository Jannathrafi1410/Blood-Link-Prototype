import crypto from 'crypto';

// ---------------------------------------------------------------------------
// 1. Authenticated Encryption at Rest (AES-256-GCM)
// Protects sensitive donor identifiers and private medical disclosures.
// Key is retrieved from environment (in production: AWS KMS / GCP Cloud KMS / Vault).
// ---------------------------------------------------------------------------

const RAW_KEY = process.env.BAN_ENCRYPTION_KEY || process.env.FERNET_ENCRYPTION_KEY || 'ban_master_secure_demo_key_32bytes!';
const ENCRYPTION_KEY = crypto.createHash('sha256').update(RAW_KEY).digest(); // 32 bytes

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  authTag: string;
}

export function encryptSensitiveField(plainText: string): string {
  if (!plainText) return plainText;
  const iv = crypto.randomBytes(12); // Standard 96-bit IV for AES-GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  // Serialized as iv:authTag:ciphertext
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptSensitiveField(payload: string): string {
  if (!payload || !payload.includes(':')) return payload;
  try {
    const parts = payload.split(':');
    if (parts.length !== 3) return payload;
    const [ivHex, authTagHex, encryptedHex] = parts;
    const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    // Return masked fallback on error
    return '***[ENCRYPTED DATA]***';
  }
}

// ---------------------------------------------------------------------------
// 2. Cryptographic Session Token Generation & Verification
// Generates HMAC-SHA256 signed session tokens with lifetime tracking.
// ---------------------------------------------------------------------------

const SESSION_SECRET = process.env.JWT_SECRET || 'ban_session_hmac_secret_key_prod_demo';
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

export interface SessionData {
  userId: string;
  role: string;
  issuedAt: number;
  expiresAt: number;
}

export function generateSessionToken(userId: string, role: string): { token: string; expiresAt: string } {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + SESSION_TTL_MS;
  const payload = `${userId}.${role}.${issuedAt}.${expiresAt}`;
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  const token = `ban_sess_${Buffer.from(payload).toString('base64url')}.${signature}`;
  return {
    token,
    expiresAt: new Date(expiresAt).toISOString()
  };
}

export function verifySessionToken(token: string): SessionData | null {
  if (!token || !token.startsWith('ban_sess_')) return null;
  try {
    const parts = token.slice('ban_sess_'.length).split('.');
    if (parts.length !== 2) return null;
    const [payloadB64, signature] = parts;
    const payload = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');

    // Constant-time comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSig, 'hex'))) {
      return null;
    }

    const [userId, role, issuedAtStr, expiresAtStr] = payload.split('.');
    const expiresAt = parseInt(expiresAtStr);
    if (Date.now() > expiresAt) {
      return null; // Expired session
    }

    return {
      userId,
      role,
      issuedAt: parseInt(issuedAtStr),
      expiresAt
    };
  } catch (e) {
    return null;
  }
}

// ---------------------------------------------------------------------------
// 3. Simulated OTP & Verification Challenge Manager
// Enforces 5-minute expiry, max 3 attempts, cooldown rate limiting,
// and hashed storage.
// ---------------------------------------------------------------------------

interface OtpChallenge {
  emailOrPhone: string;
  hashedOtp: string;
  createdAt: number;
  expiresAt: number;
  attemptsLeft: number;
  isSimulatedDemo: boolean;
  demoOtpValue?: string; // Stored only in demo development mode for UI display
}

const otpChallenges = new Map<string, OtpChallenge>();
const lastRequestTimestamps = new Map<string, number>();

export function issueOtpChallenge(emailOrPhone: string, isDemoMode = true): {
  success: boolean;
  message: string;
  expiresInSeconds: number;
  simulatedDevOtp?: string;
  cooldownSeconds?: number;
} {
  const cleanId = emailOrPhone.trim().toLowerCase();
  const now = Date.now();

  // Rate limiting: 30 seconds cooldown between OTP generation
  const lastReq = lastRequestTimestamps.get(cleanId);
  if (lastReq && now - lastReq < 30000) {
    const remaining = Math.ceil((30000 - (now - lastReq)) / 1000);
    return {
      success: false,
      message: `Rate limit: Please wait ${remaining} seconds before requesting a new OTP.`,
      expiresInSeconds: 0,
      cooldownSeconds: remaining
    };
  }

  // Generate 6-digit cryptographically secure numerical OTP
  const rawOtp = isDemoMode ? '749210' : crypto.randomInt(100000, 999999).toString();
  const hashedOtp = crypto.createHash('sha256').update(rawOtp).digest('hex');

  const challenge: OtpChallenge = {
    emailOrPhone: cleanId,
    hashedOtp,
    createdAt: now,
    expiresAt: now + 5 * 60 * 1000, // 5 minutes
    attemptsLeft: 3,
    isSimulatedDemo: isDemoMode,
    demoOtpValue: isDemoMode ? rawOtp : undefined
  };

  otpChallenges.set(cleanId, challenge);
  lastRequestTimestamps.set(cleanId, now);

  return {
    success: true,
    message: isDemoMode
      ? 'Demo simulation OTP issued. (Never accept simulated OTP in production).'
      : 'Verification OTP dispatched to registered destination.',
    expiresInSeconds: 300,
    simulatedDevOtp: isDemoMode ? rawOtp : undefined
  };
}

export function verifyOtpChallenge(emailOrPhone: string, enteredOtp: string): {
  verified: boolean;
  error?: string;
  attemptsLeft?: number;
} {
  const cleanId = emailOrPhone.trim().toLowerCase();
  const challenge = otpChallenges.get(cleanId);

  if (!challenge) {
    return { verified: false, error: 'No active verification challenge found. Please request a new OTP.' };
  }

  if (Date.now() > challenge.expiresAt) {
    otpChallenges.delete(cleanId);
    return { verified: false, error: 'Verification code has expired (5-minute window exceeded).' };
  }

  if (challenge.attemptsLeft <= 0) {
    otpChallenges.delete(cleanId);
    return { verified: false, error: 'Maximum attempts exceeded. This verification challenge has been invalidated.' };
  }

  const enteredHash = crypto.createHash('sha256').update(enteredOtp.trim()).digest('hex');
  if (challenge.hashedOtp !== enteredHash) {
    challenge.attemptsLeft -= 1;
    if (challenge.attemptsLeft <= 0) {
      otpChallenges.delete(cleanId);
      return { verified: false, error: 'Incorrect code. Maximum attempts exceeded. Please request a new OTP.', attemptsLeft: 0 };
    }
    return {
      verified: false,
      error: `Incorrect code. ${challenge.attemptsLeft} attempt(s) remaining.`,
      attemptsLeft: challenge.attemptsLeft
    };
  }

  // Success: consume challenge immediately
  otpChallenges.delete(cleanId);
  return { verified: true };
}

// ---------------------------------------------------------------------------
// 4. Production Identity Provider Interface (e.g. DigiLocker / Aadhaar eKYC)
// Integration boundary abstraction; does not invent credentials.
// ---------------------------------------------------------------------------

export interface IdentityVerificationResult {
  provider: 'DIGILOCKER' | 'SIMULATED_DEV_PROVIDER';
  isVerified: boolean;
  providerReferenceId: string;
  verificationTimestamp: string;
  disclaimer: string;
}

export interface IdentityVerificationProvider {
  initiateConsentVerification(nationalIdMasked: string, returnUrl: string): Promise<{ consentUrl: string; txnId: string }>;
  verifyCallbackResult(txnId: string, authArtifact: string): Promise<IdentityVerificationResult>;
}

export class SimulatedDevIdentityProvider implements IdentityVerificationProvider {
  async initiateConsentVerification(nationalIdMasked: string, returnUrl: string) {
    return {
      consentUrl: `${returnUrl}?simulated_txn=${Date.now()}`,
      txnId: `SIM-TXN-${Date.now()}`
    };
  }

  async verifyCallbackResult(txnId: string, authArtifact: string): Promise<IdentityVerificationResult> {
    return {
      provider: 'SIMULATED_DEV_PROVIDER',
      isVerified: true,
      providerReferenceId: `SIM-VERIF-${Date.now().toString(36)}`,
      verificationTimestamp: new Date().toISOString(),
      disclaimer: 'DEMO ONLY: This verification is a simulated development test. In production, this boundary requires authorized DigiLocker / UIDAI consent API gateway credentials.'
    };
  }
}
