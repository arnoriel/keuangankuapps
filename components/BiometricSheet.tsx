'use client';

import '@/styles/sheet.css';
import '@/styles/menu.css';
import { useState } from 'react';
import {
  capacitorBiometricAvailable, webAuthnSupported, registerWebAuthn,
} from '@/lib/security';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Capacitor?: any;
  }
}

interface BiometricSheetProps {
  onClose: () => void;
  onActivated: () => void;
}

type Status = 'idle' | 'loading' | 'error' | 'unsupported';

export default function BiometricSheet({ onClose, onActivated }: BiometricSheetProps) {
  const [status, setStatus] = useState<Status>('idle');

  async function handleActivate() {
    setStatus('loading');

    // Di Capacitor (native app), biometrik device sudah otomatis terdeteksi
    // saat checkBiometry() — tidak perlu pendaftaran kredensial terpisah.
    if (typeof window !== 'undefined' && window.Capacitor) {
      const available = await capacitorBiometricAvailable();
      if (available) {
        onActivated();
        return;
      }
      setStatus('unsupported');
      return;
    }

    // Di browser/PWA, daftarkan kredensial WebAuthn
    if (!webAuthnSupported()) {
      setStatus('unsupported');
      return;
    }

    const ok = await registerWebAuthn();
    if (ok) {
      onActivated();
    } else {
      setStatus('error');
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-body">
          <div className="sheet-header">
            <span className="sheet-title">Aktifkan Biometrik</span>
            <button className="sheet-close" onClick={onClose} aria-label="Tutup">
              <i className="fa-solid fa-xmark" />
            </button>
          </div>

          <div className="biometric-sheet-content">
            <div className="biometric-sheet-icon">
              <i className="fa-solid fa-fingerprint" />
            </div>
            <p className="sheet-subtitle" style={{ textAlign: 'center', marginBottom: 4 }}>
              Buka Keuanganku lebih cepat dengan sidik jari atau Face ID,
              tanpa perlu ketik PIN setiap saat.
            </p>

            {status === 'unsupported' && (
              <p className="biometric-sheet-error">
                Perangkat atau browser ini tidak mendukung biometrik.
              </p>
            )}
            {status === 'error' && (
              <p className="biometric-sheet-error">
                Gagal mengaktifkan biometrik. Coba lagi.
              </p>
            )}

            <button
              className="btn-primary"
              style={{ marginTop: 20 }}
              onClick={handleActivate}
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Memproses...' : 'Aktifkan Sekarang'}
            </button>
            <button className="btn-ghost" onClick={onClose}>
              Nanti Saja
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}