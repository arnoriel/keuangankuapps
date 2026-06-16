// ─── Shared PIN & Biometric helpers ───────────────────────────────────────
// Dipakai oleh LockScreen.tsx (lock saat buka app) dan Menu page
// (ubah PIN / kelola biometrik dari halaman Menu).

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Capacitor?: any;
  }
}

export const PIN_LENGTH = 6;
export const STORAGE_PIN_KEY      = 'keuanganku_pin_hash';
export const STORAGE_PIN_SET_KEY  = 'keuanganku_pin_set';
export const WEBAUTHN_CRED_KEY    = 'keuanganku_webauthn_cred_id';
export const WEBAUTHN_USER_ID_KEY = 'keuanganku_webauthn_user_id';

// ─── PIN ────────────────────────────────────────────────────────────────

export async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(pin + 'keuanganku_salt_v1');
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function isPinSet(): boolean {
  try { return localStorage.getItem(STORAGE_PIN_SET_KEY) === 'true'; }
  catch { return false; }
}

export async function savePin(pin: string): Promise<void> {
  const hash = await hashPin(pin);
  localStorage.setItem(STORAGE_PIN_KEY, hash);
  localStorage.setItem(STORAGE_PIN_SET_KEY, 'true');
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = localStorage.getItem(STORAGE_PIN_KEY);
  if (!stored) return false;
  return (await hashPin(pin)) === stored;
}

// ─── Capacitor Biometric ───────────────────────────────────────────────────

export async function capacitorBiometricAvailable(): Promise<boolean> {
  try {
    if (!window.Capacitor) return false;
    const { BiometricAuth } = await import('@aparajita/capacitor-biometric-auth');
    const result = await BiometricAuth.checkBiometry();
    return result.isAvailable;
  } catch { return false; }
}

export async function tryCapacitorBiometric(): Promise<boolean> {
  try {
    if (!window.Capacitor) return false;
    const { BiometricAuth } = await import('@aparajita/capacitor-biometric-auth');
    await BiometricAuth.authenticate({
      reason: 'Verifikasi untuk membuka Keuanganku',
      cancelTitle: 'Batalkan',
      allowDeviceCredential: true,
    });
    return true;
  } catch { return false; }
}

// ─── WebAuthn (PWA / Browser) ───────────────────────────────────────────────

export function webAuthnSupported(): boolean {
  return typeof window !== 'undefined' &&
    !!window.PublicKeyCredential &&
    typeof navigator.credentials?.create === 'function';
}

export function isWebAuthnRegistered(): boolean {
  try { return !!localStorage.getItem(WEBAUTHN_CRED_KEY); }
  catch { return false; }
}

export async function registerWebAuthn(): Promise<boolean> {
  try {
    if (!webAuthnSupported()) return false;

    let userId = localStorage.getItem(WEBAUTHN_USER_ID_KEY);
    if (!userId) {
      const arr = new Uint8Array(16);
      crypto.getRandomValues(arr);
      userId = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
      localStorage.setItem(WEBAUTHN_USER_ID_KEY, userId);
    }

    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'Keuanganku', id: window.location.hostname },
        user: {
          id: new TextEncoder().encode(userId),
          name: 'keuanganku-user',
          displayName: 'Keuanganku User',
        },
        pubKeyCredParams: [
          { alg: -7,   type: 'public-key' },
          { alg: -257, type: 'public-key' },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
      },
    }) as PublicKeyCredential | null;

    if (!credential) return false;

    const credId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    localStorage.setItem(WEBAUTHN_CRED_KEY, credId);
    return true;
  } catch (e) {
    console.warn('WebAuthn register failed:', e);
    return false;
  }
}

export async function verifyWebAuthn(): Promise<boolean> {
  try {
    if (!webAuthnSupported()) return false;
    const credIdStr = localStorage.getItem(WEBAUTHN_CRED_KEY);
    if (!credIdStr) return false;

    const base64 = credIdStr.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const credId = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) credId[i] = binary.charCodeAt(i);

    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        rpId: window.location.hostname,
        allowCredentials: [{ id: credId, type: 'public-key' }],
        userVerification: 'required',
        timeout: 60000,
      },
    });

    return !!assertion;
  } catch (e) {
    console.warn('WebAuthn verify failed:', e);
    return false;
  }
}

export function removeWebAuthn(): void {
  try {
    localStorage.removeItem(WEBAUTHN_CRED_KEY);
  } catch { /* noop */ }
}

// ─── Deteksi mode biometrik ──────────────────────────────────────────────

export type BiometricMode = 'capacitor' | 'webauthn' | 'none';

export async function detectBiometricMode(): Promise<BiometricMode> {
  if (await capacitorBiometricAvailable()) return 'capacitor';
  if (webAuthnSupported() && isWebAuthnRegistered()) return 'webauthn';
  return 'none';
}

/** Apakah biometrik sudah AKTIF (terdaftar) di device ini. */
export async function isBiometricActive(): Promise<boolean> {
  if (await capacitorBiometricAvailable()) return true;
  return webAuthnSupported() && isWebAuthnRegistered();
}

/** Apakah device/browser ini punya kapabilitas biometrik (terlepas dari sudah didaftarkan atau belum). */
export async function isBiometricCapable(): Promise<boolean> {
  if (await capacitorBiometricAvailable()) return true;
  return webAuthnSupported();
}