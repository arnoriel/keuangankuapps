'use client';

import '@/styles/nav.css';
import { usePathname, useRouter } from 'next/navigation';

interface BottomNavProps {
  onFabClick: () => void;
}

export default function BottomNav({ onFabClick }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  // next.config.ts pakai trailingSlash: true, jadi pathname bisa berupa
  // '/app/' ATAU '/app' tergantung environment (dev vs static export).
  // Normalisasi dulu biar perbandingan path selalu konsisten.
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;
  const isActive = (path: string) => normalizedPath === path;

  return (
    <nav className="bottom-nav">
      <button
        className={`nav-btn ${isActive('/app') ? 'active' : ''}`}
        onClick={() => router.push('/app')}
        aria-label="Beranda"
      >
        <i className="fa-solid fa-home" />
        <span>Beranda</span>
      </button>

      <button
        className={`nav-btn ${isActive('/app/analytics') ? 'active' : ''}`}
        onClick={() => router.push('/app/analytics')}
        aria-label="Analitik"
      >
        <i className="fa-solid fa-chart-pie" />
        <span>Analitik</span>
      </button>

      <div className="nav-fab-wrapper">
        <button className="nav-fab" onClick={onFabClick} aria-label="Tambah Transaksi">
          <i className="fa-solid fa-plus" />
        </button>
      </div>

      <button
        className={`nav-btn ${isActive('/app/calculator') ? 'active' : ''}`}
        onClick={() => router.push('/app/calculator')}
        aria-label="Kalkulator"
      >
        <i className="fa-solid fa-calculator" />
        <span>Kalkulator</span>
      </button>

      <button
        className={`nav-btn ${isActive('/app/menu') ? 'active' : ''}`}
        onClick={() => router.push('/app/menu')}
        aria-label="Menu"
      >
        <i className="fa-solid fa-bars" />
        <span>Menu</span>
      </button>
    </nav>
  );
}