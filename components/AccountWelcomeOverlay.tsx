'use client';

import '@/styles/accounts.css';
import { useEffect, useState } from 'react';
import { useWallet } from '@/context/WalletContext';

const DURATION_MS = 2000; // harus sama dengan durasi animasi di accounts.css

/** Overlay "Selamat Datang, <nama>!" dengan fade in → fade out saat pindah/buat akun. */
export default function AccountWelcomeOverlay() {
  const { welcome } = useWallet();
  const [visibleKey, setVisibleKey] = useState<number | null>(null);

  useEffect(() => {
    if (!welcome) return;
    setVisibleKey(welcome.key);
    const t = setTimeout(() => setVisibleKey(null), DURATION_MS);
    return () => clearTimeout(t);
  }, [welcome]);

  if (!welcome || visibleKey !== welcome.key) return null;

  return (
    <div key={welcome.key} className="acc-welcome" role="status" aria-live="polite">
      <div className="acc-welcome-inner">
        <div className="acc-welcome-icon">👋</div>
        <div className="acc-welcome-label">Selamat Datang</div>
        <div className="acc-welcome-name">{welcome.name || 'Keuanganku'}!</div>
      </div>
    </div>
  );
}
