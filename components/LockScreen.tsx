'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { isOnboardingComplete, saveOnboarding } from '@/lib/storage';
import {
  PIN_LENGTH, isPinSet, savePin, verifyPin,
  tryCapacitorBiometric, webAuthnSupported, registerWebAuthn, verifyWebAuthn,
  detectBiometricMode, type BiometricMode,
} from '@/lib/security';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Capacitor?: any;
  }
}

interface LockScreenProps {
  onUnlocked: () => void;
}

// ─── Format Rupiah helper ─────────────────────────────────────────────────────

function formatRupiah(value: string): string {
  const num = value.replace(/\D/g, '');
  if (!num) return '';
  return Number(num).toLocaleString('id-ID');
}

function parseRupiah(value: string): number {
  return parseInt(value.replace(/\./g, '').replace(/,/g, ''), 10) || 0;
}

// ─── Mode ─────────────────────────────────────────────────────────────────────

type Mode =
  | 'onboarding_name'
  | 'onboarding_saldo_pegangan'
  | 'onboarding_saldo_tabungan'
  | 'unlock'
  | 'setup'
  | 'confirm';

// ─── Komponen utama ───────────────────────────────────────────────────────────

export default function LockScreen({ onUnlocked }: LockScreenProps) {
  const [pin, setPin]               = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [mode, setMode]             = useState<Mode>('unlock');
  const [error, setError]           = useState('');
  const [shake, setShake]           = useState(false);
  const [biometricMode, setBiometricMode] = useState<BiometricMode>('none');
  const [webAuthnPrompt, setWebAuthnPrompt] = useState(false);

  // Onboarding state
  const [userName, setUserName]           = useState('');
  const [saldoPegangan, setSaldoPegangan] = useState('');
  const [saldoTabungan, setSaldoTabungan] = useState('');
  const [nameError, setNameError]         = useState('');

  const initialized = useRef(false);

  const triggerShake = useCallback(() => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  }, []);

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

    const onboardingDone = isOnboardingComplete();
    if (!onboardingDone) {
      setMode('onboarding_name');
      return;
    }

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

  useEffect(() => {
    if (mode === 'unlock' && biometricMode !== 'none') {
      setTimeout(() => attemptBiometric(), 400);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biometricMode]);

  // ── PIN Input handler ──
  const handleDigit = useCallback(async (digit: string) => {
    setError('');

    if (mode === 'setup') {
      const next = pin + digit;
      if (next.length < PIN_LENGTH) { setPin(next); return; }
      sessionStorage.setItem('_pin_temp', next);
      setPin('');
      setMode('confirm');
      return;
    }

    if (mode === 'confirm') {
      const next = confirmPin + digit;
      if (next.length < PIN_LENGTH) { setConfirmPin(next); return; }
      const storedTemp = sessionStorage.getItem('_pin_temp');
      if (storedTemp === next) {
        await savePin(next);
        sessionStorage.removeItem('_pin_temp');
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
    if (mode === 'setup')         setPin(p => p.slice(0, -1));
    else if (mode === 'confirm')  setConfirmPin(p => p.slice(0, -1));
    else                          setPin(p => p.slice(0, -1));
  }, [mode]);

  // ── WebAuthn registration ──
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

  // ── Onboarding handlers ──
  const handleNameSubmit = useCallback(() => {
    const trimmed = userName.trim();
    if (!trimmed) { setNameError('Nama tidak boleh kosong'); return; }
    setNameError('');
    setMode('onboarding_saldo_pegangan');
  }, [userName]);

  const handleSaldoPeganganSubmit = useCallback(() => {
    setMode('onboarding_saldo_tabungan');
  }, []);

  const handleSaldoTabunganSubmit = useCallback(() => {
    const pegangan = parseRupiah(saldoPegangan);
    const tabungan = parseRupiah(saldoTabungan);
    saveOnboarding(userName.trim(), pegangan, tabungan);
    setMode('setup');
  }, [userName, saldoPegangan, saldoTabungan]);

  // ─── Render: Onboarding — Nama ────────────────────────────────────────────
  if (mode === 'onboarding_name') {
    return (
      <div style={styles.overlay}>
        <div style={styles.container}>
          <div style={styles.logoArea}>
            <div style={styles.logoIcon}>💰</div>
            <h1 style={styles.appName}>Keuanganku</h1>
          </div>

          <div style={styles.onboardingCard}>
            <div style={styles.stepIndicator}>
              <span style={styles.stepDotActive} />
              <span style={styles.stepDot} />
              <span style={styles.stepDot} />
            </div>
            <p style={styles.onboardingTitle}>Halo! Siapa namamu? 👋</p>
            <p style={styles.onboardingSubtitle}>
              Kami akan menyapa kamu dengan nama ini di dashboard
            </p>

            <input
              style={{ ...styles.textInput, ...(nameError ? styles.textInputError : {}) }}
              type="text"
              placeholder="Masukkan namamu"
              value={userName}
              onChange={e => { setUserName(e.target.value); setNameError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleNameSubmit()}
              autoFocus
              maxLength={30}
            />
            {nameError && <p style={styles.inputErrorMsg}>{nameError}</p>}

            <button style={styles.primaryBtn} onClick={handleNameSubmit}>
              Lanjut →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: Onboarding — Saldo Pegangan ──────────────────────────────────
  if (mode === 'onboarding_saldo_pegangan') {
    return (
      <div style={styles.overlay}>
        <div style={styles.container}>
          <div style={styles.logoArea}>
            <div style={styles.logoIcon}>💰</div>
            <h1 style={styles.appName}>Keuanganku</h1>
          </div>

          <div style={styles.onboardingCard}>
            <div style={styles.stepIndicator}>
              <span style={styles.stepDot} />
              <span style={styles.stepDotActive} />
              <span style={styles.stepDot} />
            </div>
            <p style={styles.onboardingTitle}>Saldo pegangan kamu 💵</p>
            <p style={styles.onboardingSubtitle}>
              Berapa uang yang kamu pegang sekarang?
              Bisa dikosongkan jika belum tahu.
            </p>

            <div style={styles.rupiahInputWrapper}>
              <span style={styles.rupiahPrefix}>Rp</span>
              <input
                style={styles.rupiahInput}
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={saldoPegangan}
                onChange={e => setSaldoPegangan(formatRupiah(e.target.value))}
                onKeyDown={e => e.key === 'Enter' && handleSaldoPeganganSubmit()}
                autoFocus
              />
            </div>

            <div style={styles.btnRow}>
              <button style={styles.secondaryBtn} onClick={() => setMode('onboarding_name')}>
                ← Kembali
              </button>
              <button style={styles.primaryBtnFlex} onClick={handleSaldoPeganganSubmit}>
                Lanjut →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: Onboarding — Saldo Tabungan ──────────────────────────────────
  if (mode === 'onboarding_saldo_tabungan') {
    return (
      <div style={styles.overlay}>
        <div style={styles.container}>
          <div style={styles.logoArea}>
            <div style={styles.logoIcon}>💰</div>
            <h1 style={styles.appName}>Keuanganku</h1>
          </div>

          <div style={styles.onboardingCard}>
            <div style={styles.stepIndicator}>
              <span style={styles.stepDot} />
              <span style={styles.stepDot} />
              <span style={styles.stepDotActive} />
            </div>
            <p style={styles.onboardingTitle}>Saldo tabungan kamu 🏦</p>
            <p style={styles.onboardingSubtitle}>
              Berapa total tabungan yang kamu simpan?
              Bisa dikosongkan jika belum ada.
            </p>

            <div style={styles.rupiahInputWrapper}>
              <span style={styles.rupiahPrefix}>Rp</span>
              <input
                style={styles.rupiahInput}
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={saldoTabungan}
                onChange={e => setSaldoTabungan(formatRupiah(e.target.value))}
                onKeyDown={e => e.key === 'Enter' && handleSaldoTabunganSubmit()}
                autoFocus
              />
            </div>

            <div style={styles.btnRow}>
              <button style={styles.secondaryBtn} onClick={() => setMode('onboarding_saldo_pegangan')}>
                ← Kembali
              </button>
              <button style={styles.primaryBtnFlex} onClick={handleSaldoTabunganSubmit}>
                Buat PIN →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

  // ─── Render: Lock screen (PIN setup / confirm / unlock) ───────────────────
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

  // ── Onboarding card ──
  onboardingCard: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    padding: '28px 24px 24px',
    width: '100%',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  stepIndicator: {
    display: 'flex', gap: '8px', marginBottom: '20px',
  },
  stepDot: {
    width: '8px', height: '8px', borderRadius: '50%',
    backgroundColor: '#E0DCF8',
  },
  stepDotActive: {
    width: '24px', height: '8px', borderRadius: '4px',
    backgroundColor: '#7C5CFC',
  },
  onboardingTitle: {
    fontSize: '18px', fontWeight: '700', color: '#1A1A2E',
    margin: '0 0 8px', textAlign: 'center',
  },
  onboardingSubtitle: {
    fontSize: '13px', color: '#888', lineHeight: 1.5,
    margin: '0 0 24px', textAlign: 'center',
  },
  textInput: {
    width: '100%', padding: '14px 16px',
    border: '2px solid #E8E8F0', borderRadius: '12px',
    fontSize: '16px', fontFamily: "'Plus Jakarta Sans', sans-serif",
    color: '#1A1A2E', backgroundColor: '#F6F7FB',
    outline: 'none', boxSizing: 'border-box',
    marginBottom: '8px',
  },
  textInputError: {
    borderColor: '#EF4444',
  },
  inputErrorMsg: {
    color: '#EF4444', fontSize: '12px', fontWeight: '600',
    margin: '0 0 12px', alignSelf: 'flex-start',
  },
  primaryBtn: {
    width: '100%', padding: '14px',
    backgroundColor: '#7C5CFC', color: '#fff',
    border: 'none', borderRadius: '14px',
    fontSize: '15px', fontWeight: '700',
    cursor: 'pointer', fontFamily: 'inherit',
    marginTop: '8px',
  },
  btnRow: {
    display: 'flex', gap: '10px', width: '100%', marginTop: '8px',
  },
  secondaryBtn: {
    flex: '0 0 auto', padding: '14px 16px',
    backgroundColor: '#F0EDF8', color: '#7C5CFC',
    border: 'none', borderRadius: '14px',
    fontSize: '14px', fontWeight: '600',
    cursor: 'pointer', fontFamily: 'inherit',
  },
  primaryBtnFlex: {
    flex: 1, padding: '14px',
    backgroundColor: '#7C5CFC', color: '#fff',
    border: 'none', borderRadius: '14px',
    fontSize: '15px', fontWeight: '700',
    cursor: 'pointer', fontFamily: 'inherit',
  },
  rupiahInputWrapper: {
    display: 'flex', alignItems: 'center',
    width: '100%',
    border: '2px solid #E8E8F0', borderRadius: '12px',
    backgroundColor: '#F6F7FB',
    marginBottom: '8px', overflow: 'hidden',
  },
  rupiahPrefix: {
    padding: '14px 0 14px 16px',
    fontSize: '16px', fontWeight: '700', color: '#7C5CFC',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    whiteSpace: 'nowrap',
  },
  rupiahInput: {
    flex: 1, padding: '14px 16px',
    border: 'none', outline: 'none',
    fontSize: '16px', fontFamily: "'Plus Jakarta Sans', sans-serif",
    color: '#1A1A2E', backgroundColor: 'transparent',
  },

  // ── PIN screen ──
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