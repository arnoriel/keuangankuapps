'use client';

import '@/styles/sheet.css';
import '@/styles/menu.css';

interface HelpSheetProps {
  onClose: () => void;
}

const HELP_ITEMS: { icon: string; title: string; desc: string }[] = [
  {
    icon: 'fa-plus',
    title: 'Mencatat Transaksi',
    desc: 'Tekan tombol + di tengah menu bawah untuk mencatat pemasukan atau pengeluaran baru.',
  },
  {
    icon: 'fa-arrow-right-arrow-left',
    title: 'Transfer Saldo',
    desc: 'Tekan ikon transfer di antara kartu Saldo Pegangan dan Saldo Tabungan di Beranda untuk memindahkan dana.',
  },
  {
    icon: 'fa-clock-rotate-left',
    title: 'Riwayat Transaksi',
    desc: 'Tekan "Lihat Semua" di bagian Transaksi Terbaru pada Beranda untuk membuka riwayat lengkap, lengkap dengan pencarian dan filter.',
  },
  {
    icon: 'fa-chart-pie',
    title: 'Analitik',
    desc: 'Buka tab Analitik untuk melihat ringkasan pemasukan dan pengeluaran kamu dalam bentuk grafik.',
  },
  {
    icon: 'fa-calculator',
    title: 'Kalkulator',
    desc: 'Gunakan tab Kalkulator untuk menghitung cepat tanpa harus keluar dari aplikasi.',
  },
  {
    icon: 'fa-pen',
    title: 'Edit Profil',
    desc: 'Di halaman Menu, tekan nama kamu di bagian atas untuk mengubahnya. Perubahan tersimpan otomatis.',
  },
  {
    icon: 'fa-lock',
    title: 'PIN & Biometrik',
    desc: 'Atur ulang PIN keamanan atau aktifkan sidik jari / Face ID melalui halaman Menu agar buka aplikasi lebih cepat dan aman.',
  },
  {
    icon: 'fa-eye-slash',
    title: 'Sembunyikan Saldo',
    desc: 'Tekan ikon mata pada kartu saldo di Beranda untuk menyembunyikan jumlahnya dari pandangan orang lain.',
  },
];

export default function HelpSheet({ onClose }: HelpSheetProps) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-body">
          <div className="sheet-header">
            <span className="sheet-title">Bantuan</span>
            <button className="sheet-close" onClick={onClose} aria-label="Tutup">
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <p className="sheet-subtitle">Panduan singkat menggunakan Keuanganku</p>

          <div className="help-list">
            {HELP_ITEMS.map((item) => (
              <div key={item.title} className="help-item">
                <div className="help-item-icon">
                  <i className={`fa-solid ${item.icon}`} />
                </div>
                <div className="help-item-body">
                  <div className="help-item-title">{item.title}</div>
                  <div className="help-item-desc">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <button className="btn-primary" style={{ marginTop: 22 }} onClick={onClose}>
            Mengerti
          </button>
        </div>
      </div>
    </div>
  );
}