'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Capacitor?: any;
  }
}

interface LockScreenProps {
  onUnlocked: () => void;
}

const PIN_LENGTH = 6;
const STORAGE_PIN_KEY      = 'keuanganku_pin_hash';
const STORAGE_PIN_SET_KEY  = 'keuanganku_pin_set';
const WEBAUTHN_CRED_KEY    = 'keuanganku_webauthn_cred_id';
const WEBAUTHN_USER_ID_KEY = 'keuanganku_webauthn_user_id';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function hashPin(pin: string): Promise<string> {
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

async function verifyPin(pin: string): Promise<boolean> {
  const stored = localStorage.getItem(STORAGE_PIN_KEY);
  if (!stored) return false;
  return (await hashPin(pin)) === stored;
}

// ─── Capacitor Biometric ──────────────────────────────────────────────────────

async function capacitorBiometricAvailable(): Promise<boolean> {
  try {
    if (!window.Capacitor) return false;
    const { BiometricAuth } = await import('@aparajita/capacitor-biometric-auth');
    const result = await BiometricAuth.checkBiometry();
    return result.isAvailable;
  } catch { return false; }
}

async function tryCapacitorBiometric(): Promise<boolean> {
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

// ─── WebAuthn (PWA / Browser) ─────────────────────────────────────────────────

function webAuthnSupported(): boolean {
  return typeof window !== 'undefined' &&
    !!window.PublicKeyCredential &&
    typeof navigator.credentials?.create === 'function';
}

function isWebAuthnRegistered(): boolean {
  return !!localStorage.getItem(WEBAUTHN_CRED_ID_KEY());
}

function WEBAUTHN_CRED_ID_KEY() { return WEBAUTHN_CRED_KEY; }

/** Daftarkan biometrik WebAuthn (sekali, saat PIN pertama kali dibuat) */
async function registerWebAuthn(): Promise<boolean> {
  try {
    if (!webAuthnSupported()) return false;

    // Generate user id baru atau pakai yang ada
    let userId = localStorage.getItem(WEBAUTHN_USER_ID_KEY);
    if (!userId) {
      const arr = new Uint8Array(16);
      crypto.getRandomValues(arr);
      userId = Array.from(arr).map(b => b.toString(16).padStart(2,'0')).join('');
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
          { alg: -7,   type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // pakai sensor di device (fingerprint/face)
          userVerification: 'required',
        },
        timeout: 60000,
      },
    }) as PublicKeyCredential | null;

    if (!credential) return false;

    // Simpan credential id (base64url) untuk verifikasi nanti
    const credId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    localStorage.setItem(WEBAUTHN_CRED_KEY, credId);
    return true;
  } catch (e) {
    console.warn('WebAuthn register failed:', e);
    return false;
  }
}

/** Verifikasi biometrik WebAuthn */
async function verifyWebAuthn(): Promise<boolean> {
  try {
    if (!webAuthnSupported()) return false;
    const credIdStr = localStorage.getItem(WEBAUTHN_CRED_KEY);
    if (!credIdStr) return false;

    // Decode base64url → Uint8Array
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

// ─── Deteksi mode biometrik yang tersedia ─────────────────────────────────────

type BiometricMode = 'capacitor' | 'webauthn' | 'none';

async function detectBiometricMode(): Promise<BiometricMode> {
  if (await capacitorBiometricAvailable()) return 'capacitor';
  if (webAuthnSupported() && isWebAuthnRegistered()) return 'webauthn';
  return 'none';
}

// ─── Komponen utama ───────────────────────────────────────────────────────────

type Mode = 'unlock' | 'setup' | 'confirm';

export default function LockScreen({ onUnlocked }: LockScreenProps) {
  const [pin, setPin]               = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [mode, setMode]             = useState<Mode>('unlock');
  const [error, setError]           = useState('');
  const [shake, setShake]           = useState(false);
  const [biometricMode, setBiometricMode] = useState<BiometricMode>('none');
  const [webAuthnPrompt, setWebAuthnPrompt] = useState(false); // tawaran daftar WebAuthn
  const initialized = useRef(false);

  const triggerShake = useCallback(() => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  }, []);

  // ── Attempt biometric (dispatch ke mode yang tepat) ──
  const attemptBiometric = useCallback(async () => {
    if (biometricMode === 'capacitor') {
      const ok = await tryCapacitorBiometric();
      if (ok) onUnlocked();
    } else if (biometricMode === 'webauthn') {
      const ok = await verifyWebAuthn();
      if (ok) onUnlocked();
      else setError('Biometrik gagal, coba PIN');
    }
  }, [biometricMode, onUnlocked]);

  // ── Init ──
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const pinSet = isPinSet();
    if (!pinSet) {
      setMode('setup');
      return;
    }

    setMode('unlock');
    detectBiometricMode().then((m) => {
      setBiometricMode(m);
      if (m !== 'none') {
        setTimeout(() => attemptBiometric(), 400);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-trigger biometric setelah mode terdeteksi
  useEffect(() => {
    if (mode === 'unlock' && biometricMode !== 'none') {
      setTimeout(() => attemptBiometric(), 400);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biometricMode]);

  // ── Input handler ──
  const handleDigit = useCallback(async (digit: string) => {
    setError('');

    if (mode === 'setup') {
      const next = pin + digit;
      if (next.length < PIN_LENGTH) { setPin(next); return; }
      // Digit terakhir setup → pindah ke confirm
      sessionStorage.setItem('_pin_temp', next);
      setPin('');
      setMode('confirm');
      return;
    }

    if (mode === 'confirm') {
      const next = confirmPin + digit;
      if (next.length < PIN_LENGTH) { setConfirmPin(next); return; }
      // Digit terakhir confirm
      const storedTemp = sessionStorage.getItem('_pin_temp');
      if (storedTemp === next) {
        await savePin(next);
        sessionStorage.removeItem('_pin_temp');
        // Tawaran daftar WebAuthn (hanya di browser, bukan Capacitor)
        if (!window.Capacitor && webAuthnSupported()) {
          setConfirmPin('');
          setWebAuthnPrompt(true);
        } else {
          onUnlocked();
        }
      } else {
        setError('PIN tidak cocok, ulangi dari awal');
        triggerShake();
        setMode('setup');
        setPin('');
        setConfirmPin('');
        sessionStorage.removeItem('_pin_temp');
      }
      return;
    }

    // Mode unlock
    const next = pin + digit;
    if (next.length < PIN_LENGTH) { setPin(next); return; }
    const ok = await verifyPin(next);
    if (ok) {
      onUnlocked();
    } else {
      setError('PIN salah');
      triggerShake();
      setPin('');
    }
  }, [mode, pin, confirmPin, onUnlocked, triggerShake]);

  const handleDelete = useCallback(() => {
    setError('');
    if (mode === 'setup')   setPin(p => p.slice(0, -1));
    else if (mode === 'confirm') setConfirmPin(p => p.slice(0, -1));
    else setPin(p => p.slice(0, -1));
  }, [mode]);

  // ── WebAuthn registration prompt handler ──
  const handleWebAuthnYes = useCallback(async () => {
    const ok = await registerWebAuthn();
    if (ok) setBiometricMode('webauthn');
    setWebAuthnPrompt(false);
    onUnlocked();
  }, [onUnlocked]);

  const handleWebAuthnSkip = useCallback(() => {
    setWebAuthnPrompt(false);
    onUnlocked();
  }, [onUnlocked]);

  // ─── Render: WebAuthn prompt ──────────────────────────────────────────────
  if (webAuthnPrompt) {
    return (
      <div style={styles.overlay}>
        <div style={styles.container}>
          <div style={styles.logoArea}>
            <div style={styles.logoIcon}>💰</div>
            <h1 style={styles.appName}>Keuanganku</h1>
          </div>
          <div style={styles.promptCard}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>👆</div>
            <p style={styles.promptTitle}>Aktifkan Biometrik?</p>
            <p style={styles.promptSubtitle}>
              Buka Keuanganku lebih cepat dengan sidik jari atau wajah,
              tanpa perlu ketik PIN setiap saat.
            </p>
            <button style={styles.promptBtnPrimary} onClick={handleWebAuthnYes}>
              Ya, aktifkan
            </button>
            <button style={styles.promptBtnSecondary} onClick={handleWebAuthnSkip}>
              Nanti saja
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: Lock screen ──────────────────────────────────────────────────
  const currentLength = mode === 'confirm' ? confirmPin.length : pin.length;

  const title =
    mode === 'setup'   ? 'Buat PIN' :
    mode === 'confirm' ? 'Konfirmasi PIN' : 'Masukkan PIN';

  const subtitle =
    mode === 'setup'   ? 'Buat PIN 6 digit untuk mengamankan Keuanganku' :
    mode === 'confirm' ? 'Masukkan PIN yang sama sekali lagi' :
    'Verifikasi untuk melanjutkan';

  const biometricIcon =
    biometricMode === 'capacitor' ? '👆' :
    biometricMode === 'webauthn'  ? '🔐' : null;

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>

        <div style={styles.logoArea}>
          <div style={styles.logoIcon}>💰</div>
          <h1 style={styles.appName}>Keuanganku</h1>
        </div>

        <p style={styles.title}>{title}</p>
        <p style={styles.subtitle}>{subtitle}</p>

        {/* PIN dots */}
        <div style={{ ...styles.dotsRow, ...(shake ? styles.shakeAnim : {}) }}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <div key={i} style={{ ...styles.dot, ...(i < currentLength ? styles.dotFilled : {}) }} />
          ))}
        </div>

        {error
          ? <p style={styles.error}>{error}</p>
          : <p style={{ minHeight: '20px', margin: '0 0 20px' }}>&nbsp;</p>
        }

        {/* Numpad */}
        <div style={styles.numpad}>
          {['1','2','3','4','5','6','7','8','9'].map(d => (
            <button key={d} style={styles.numBtn} onClick={() => handleDigit(d)}>{d}</button>
          ))}

          {/* Biometric slot (kiri bawah) */}
          <div style={styles.numBtnEmpty}>
            {mode === 'unlock' && biometricIcon && (
              <button style={styles.biometricBtn} onClick={attemptBiometric} title="Gunakan Biometrik">
                <span style={{ fontSize: '28px' }}>{biometricIcon}</span>
              </button>
            )}
          </div>

          <button style={styles.numBtn} onClick={() => handleDigit('0')}>0</button>
          <button style={styles.numBtnDelete} onClick={handleDelete}>⌫</button>
        </div>

        {mode === 'unlock' && biometricIcon && (
          <button style={styles.biometricTextBtn} onClick={attemptBiometric}>
            {biometricMode === 'webauthn'
              ? 'Gunakan Sidik Jari / Face ID'
              : 'Gunakan Biometrik / Sidik Jari'}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0,
    backgroundColor: '#F6F7FB',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  container: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    width: '100%', maxWidth: '360px',
    padding: '24px 16px 40px',
  },
  logoArea: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    marginBottom: '32px', gap: '8px',
  },
  logoIcon:  { fontSize: '48px', lineHeight: 1 },
  appName:   { fontSize: '22px', fontWeight: '800', color: '#1A1A2E', margin: 0 },
  title:     { fontSize: '20px', fontWeight: '700', color: '#1A1A2E', margin: '0 0 6px' },
  subtitle:  { fontSize: '14px', color: '#888', margin: '0 0 28px', textAlign: 'center', lineHeight: 1.4 },
  dotsRow:   { display: 'flex', gap: '16px', marginBottom: '12px' },
  dot: {
    width: '16px', height: '16px', borderRadius: '50%',
    borderWidth: '2px', borderStyle: 'solid', borderColor: '#C5B9F5',
    backgroundColor: 'transparent',
    transition: 'background-color 0.15s ease',
  },
  dotFilled: { backgroundColor: '#7C5CFC', borderColor: '#7C5CFC' },
  shakeAnim: { animation: 'shake 0.5s ease' },
  error: { color: '#EF4444', fontSize: '13px', fontWeight: '600', margin: '0 0 20px', minHeight: '20px' },
  numpad: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 80px)',
    gap: '12px', marginBottom: '24px',
  },
  numBtn: {
    width: '80px', height: '80px', borderRadius: '50%',
    border: '1px solid #E8E8F0', backgroundColor: '#fff',
    fontSize: '24px', fontWeight: '600', color: '#1A1A2E',
    cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    transition: 'background-color 0.1s', fontFamily: 'inherit',
  },
  numBtnEmpty: {
    width: '80px', height: '80px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  numBtnDelete: {
    width: '80px', height: '80px', borderRadius: '50%',
    border: 'none', backgroundColor: 'transparent',
    fontSize: '24px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#1A1A2E', fontFamily: 'inherit',
  },
  biometricBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '8px', borderRadius: '50%',
  },
  biometricTextBtn: {
    background: 'none', border: 'none',
    color: '#7C5CFC', fontSize: '14px', fontWeight: '600',
    cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit',
  },
  // WebAuthn prompt
  promptCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: '20px',
    padding: '32px 24px', textAlign: 'center',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    width: '100%',
  },
  promptTitle: { fontSize: '18px', fontWeight: '700', color: '#1A1A2E', margin: '0 0 10px' },
  promptSubtitle: { fontSize: '14px', color: '#666', lineHeight: 1.5, margin: '0 0 28px' },
  promptBtnPrimary: {
    width: '100%', padding: '14px',
    backgroundColor: '#7C5CFC', color: '#fff',
    border: 'none', borderRadius: '14px',
    fontSize: '15px', fontWeight: '700',
    cursor: 'pointer', marginBottom: '10px', fontFamily: 'inherit',
  },
  promptBtnSecondary: {
    width: '100%', padding: '14px',
    backgroundColor: 'transparent', color: '#888',
    border: 'none', borderRadius: '14px',
    fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit',
  },
};
