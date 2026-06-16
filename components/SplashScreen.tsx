'use client';

import '@/styles/splash.css';
import { useEffect, useState } from 'react';

export default function SplashScreen() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show splash once per session
    const shown = sessionStorage.getItem('keuanganku_splash_shown');
    if (!shown) {
      setVisible(true);
      sessionStorage.setItem('keuanganku_splash_shown', '1');
      // Hide after animation completes (1.8s animation + 0.45s fade out)
      const t = setTimeout(() => setVisible(false), 2400);
      return () => clearTimeout(t);
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="splash-screen">
      <div className="splash-icon-ring">
        <i className="fa-solid fa-wallet" />
      </div>
      <div className="splash-app-name">
        Keuangan<span>ku</span>
      </div>
      <div className="splash-tagline">Kelola keuanganmu dengan mudah</div>
      <div className="splash-dots">
        <div className="splash-dot" />
        <div className="splash-dot" />
        <div className="splash-dot" />
      </div>
    </div>
  );
}
