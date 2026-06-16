'use client';

import '@/styles/landing.css';
import { useState, useEffect, useCallback } from 'react';

// Tipe event beforeinstallprompt (belum ada di TS lib bawaan)
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // @ts-expect-error - properti khusus iOS Safari
    window.navigator.standalone === true
  );
}

const FEATURES = [
  { icon: '📊', title: 'Catat Transaksi', desc: 'Pemasukan & pengeluaran harian, simpel' },
  { icon: '🎯', title: 'Target Tabungan', desc: 'Tetapkan goals dan pantau progresnya' },
  { icon: '🧮', title: 'Kalkulator Bawaan', desc: 'Hitung cepat tanpa pindah aplikasi' },
  { icon: '🔒', title: 'PIN & Biometrik', desc: 'Data keuanganmu aman dan privat' },
];

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Capacitor?: any;
  }
}

export default function LandingPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  // Saat dijalankan sebagai APK/IPA Capacitor native, langsung loncat ke /app
  // — landing page hanya relevan untuk konteks web/PWA discovery.
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()) {
      window.location.replace('/app');
    }
  }, []);

  useEffect(() => {
    if (isInStandaloneMode()) {
      setInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    const handleInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstalled(true);
      }
      setDeferredPrompt(null);
      return;
    }

    if (isIos()) {
      setShowIosGuide(true);
      return;
    }

    // Browser tidak support beforeinstallprompt & bukan iOS (mis. Firefox)
    setShowIosGuide(true);
  }, [deferredPrompt]);

  return (
    <div className="landing-root">
      <div className="landing-hero">
        <div className="landing-logo">💰</div>
        <h1 className="landing-title">Keuanganku</h1>
        <p className="landing-subtitle">
          Kelola pemasukan, pengeluaran, dan target tabunganmu
          langsung dari ponsel — cepat, privat, tanpa ribet.
        </p>
      </div>

      <div className="landing-features">
        {FEATURES.map((f) => (
          <div className="landing-feature-item" key={f.title}>
            <div className="landing-feature-icon">{f.icon}</div>
            <div className="landing-feature-text">
              <span className="landing-feature-title">{f.title}</span>
              <span className="landing-feature-desc">{f.desc}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="landing-cta-area">
        {installed ? (
          <div className="landing-installed-badge">
            ✅ Sudah terpasang — buka dari layar utama
          </div>
        ) : (
          <button className="landing-install-btn" onClick={handleInstallClick}>
            <i className="fa-solid fa-circle-down" />
            Tambahkan Aplikasi ke Smartphone
          </button>
        )}

        {showIosGuide && !installed && (
          <div className="landing-ios-card">
            <p className="landing-ios-card-title">📲 Cara pasang manual</p>
            <ol className="landing-ios-steps">
              <li className="landing-ios-step">
                <span className="landing-ios-step-num">1</span>
                Tap ikon <strong>Share</strong> (kotak dengan tanda panah ke atas) di Safari
              </li>
              <li className="landing-ios-step">
                <span className="landing-ios-step-num">2</span>
                Pilih <strong>&quot;Add to Home Screen&quot;</strong>
              </li>
              <li className="landing-ios-step">
                <span className="landing-ios-step-num">3</span>
                Tap <strong>Add</strong> — Keuanganku siap dibuka dari layar utama
              </li>
            </ol>
          </div>
        )}

        <a className="landing-open-link" href="/app">
          Atau buka langsung di browser →
        </a>
      </div>

      <p className="landing-footer">Keuanganku — dibuat untuk pengelolaan keuangan pribadi</p>
    </div>
  );
}
