'use client';

import '@/styles/nav.css';
import { usePathname, useRouter } from 'next/navigation';
import { haptics } from '@/lib/haptics';

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
  // Halaman fitur (Stream Pemasukkan, Goals, Kalkulator) dibuka dari card
  // "Semua Fitur" di Beranda, jadi tab Beranda tetap aktif di sana.
  const HOME_CHILDREN = ['/app/incomes', '/app/goals', '/app/calculator'];
  const isActive = (path: string) =>
    path === '/app'
      ? normalizedPath === '/app' || HOME_CHILDREN.includes(normalizedPath)
      : normalizedPath === path;

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
        <button className="nav-fab" onClick={() => { haptics.medium(); onFabClick(); }} aria-label="Tambah Transaksi">
          <i className="fa-solid fa-plus" />
        </button>
      </div>

      <button
        className={`nav-btn ${isActive('/app/history') ? 'active' : ''}`}
        onClick={() => router.push('/app/history')}
        aria-label="Riwayat"
      >
        <i className="fa-solid fa-clock-rotate-left" />
        <span>Riwayat</span>
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