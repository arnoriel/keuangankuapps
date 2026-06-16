'use client';

import '@/styles/sheet.css';
import '@/styles/menu.css';
import { useState, useCallback } from 'react';
import { PIN_LENGTH, verifyPin, savePin } from '@/lib/security';

interface ChangePinSheetProps {
  onClose: () => void;
}

type Step = 'current' | 'new' | 'confirm' | 'success';

export default function ChangePinSheet({ onClose }: ChangePinSheetProps) {
  const [step, setStep] = useState<Step>('current');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const triggerShake = useCallback(() => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }, []);

  const activePin =
    step === 'current' ? currentPin :
    step === 'new'     ? newPin     : confirmPin;

  async function handleDigit(digit: string) {
    setError('');

    if (step === 'current') {
      const next = currentPin + digit;
      if (next.length < PIN_LENGTH) { setCurrentPin(next); return; }
      const ok = await verifyPin(next);
      if (ok) {
        setCurrentPin('');
        setStep('new');
      } else {
        setError('PIN saat ini salah');
        triggerShake();
        setCurrentPin('');
      }
      return;
    }

    if (step === 'new') {
      const next = newPin + digit;
      if (next.length < PIN_LENGTH) { setNewPin(next); return; }
      setNewPin(next);
      setStep('confirm');
      return;
    }

    if (step === 'confirm') {
      const next = confirmPin + digit;
      if (next.length < PIN_LENGTH) { setConfirmPin(next); return; }
      if (next === newPin) {
        await savePin(next);
        setStep('success');
      } else {
        setError('PIN baru tidak cocok, ulangi');
        triggerShake();
        setNewPin('');
        setConfirmPin('');
        setStep('new');
      }
    }
  }

  function handleDelete() {
    setError('');
    if (step === 'current') setCurrentPin((p) => p.slice(0, -1));
    else if (step === 'new') setNewPin((p) => p.slice(0, -1));
    else setConfirmPin((p) => p.slice(0, -1));
  }

  const title =
    step === 'current' ? 'Masukkan PIN Saat Ini' :
    step === 'new'      ? 'Buat PIN Baru' :
    step === 'confirm'  ? 'Konfirmasi PIN Baru' : 'Berhasil';

  const subtitle =
    step === 'current' ? 'Verifikasi dulu sebelum mengganti PIN' :
    step === 'new'      ? 'Buat PIN 6 digit yang baru' :
    step === 'confirm'  ? 'Masukkan PIN baru sekali lagi' : '';

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-body">
          <div className="sheet-header">
            <span className="sheet-title">Ubah PIN</span>
            <button className="sheet-close" onClick={onClose} aria-label="Tutup">
              <i className="fa-solid fa-xmark" />
            </button>
          </div>

          {step === 'success' ? (
            <div className="sheet-success">
              <div className="success-icon">
                <i className="fa-solid fa-check" />
              </div>
              <div className="success-title">PIN Diperbarui</div>
              <div className="success-msg">PIN baru kamu sudah aktif digunakan.</div>
              <button className="btn-primary" style={{ marginTop: 24 }} onClick={onClose}>
                Selesai
              </button>
            </div>
          ) : (
            <div className="pin-step">
              <p className="pin-step-title">{title}</p>
              <p className="pin-step-subtitle">{subtitle}</p>

              <div className={`pin-dots-row ${shake ? 'pin-shake' : ''}`}>
                {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                  <div
                    key={i}
                    className={`pin-dot ${i < activePin.length ? 'pin-dot-filled' : ''}`}
                  />
                ))}
              </div>

              <p className="pin-error">{error || '\u00A0'}</p>

              <div className="pin-numpad">
                {['1','2','3','4','5','6','7','8','9'].map((d) => (
                  <button key={d} className="pin-numbtn" onClick={() => handleDigit(d)}>
                    {d}
                  </button>
                ))}
                <div className="pin-numbtn-empty" />
                <button className="pin-numbtn" onClick={() => handleDigit('0')}>0</button>
                <button className="pin-numbtn-delete" onClick={handleDelete} aria-label="Hapus">
                  <i className="fa-solid fa-delete-left" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}