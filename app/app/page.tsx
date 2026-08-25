'use client';

import '@/styles/home.css';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/context/WalletContext';
import { getUserName } from '@/lib/storage';
import { haptics } from '@/lib/haptics';
import { useCountUp } from '@/hooks/useCountUp';
import TransactionItem from '@/components/TransactionItem';
import TransferModal from '@/components/TransferModal';
import EditTransactionSheet from '@/components/EditTransactionSheet';
import HomeSkeleton from '@/components/HomeSkeleton';
import PullToRefresh from '@/components/PullToRefresh';
import { Transaction } from '@/lib/types';
import { formatRupiah, formatRupiahShort, getGreeting, formatFullDate, getTodayDateStr } from '@/lib/utils';

type CardKey = 'pegangan' | 'tabungan';
type SlideKey = 'total' | 'pegangan' | 'tabungan';
const SLIDES: SlideKey[] = ['total', 'pegangan', 'tabungan'];

export default function DashboardPage() {
  const wallet = useWallet();
  const router = useRouter();
  const [showTransfer, setShowTransfer] = useState(false);
  const [hideTotal, setHideTotal] = useState(false);
  const [hidePegangan, setHidePegangan] = useState(false);
  const [hideTabungan, setHideTabungan] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Dropdown titik tiga & mode edit nominal per card
  const [openMenu, setOpenMenu] = useState<CardKey | null>(null);
  const [editingCard, setEditingCard] = useState<CardKey | null>(null);
  const [editValue, setEditValue] = useState('');

  // Carousel active slide
  const [activeSlide, setActiveSlide] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const [userName, setUserNameState] = useState('');
  useEffect(() => { setUserNameState(getUserName()); }, []);

  const peganganMenuRef = useRef<HTMLDivElement>(null);
  const tabunganMenuRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Tutup dropdown saat tap di luar area card menu
  useEffect(() => {
    if (!openMenu) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      const ref = openMenu === 'pegangan' ? peganganMenuRef : tabunganMenuRef;
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [openMenu]);

  // Auto-focus input begitu masuk mode edit
  useEffect(() => {
    if (editingCard) editInputRef.current?.focus();
  }, [editingCard]);

  // Track slide aktif berdasarkan scroll position (untuk dot indicator)
  const handleCarouselScroll = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    const clamped = Math.min(Math.max(idx, 0), SLIDES.length - 1);
    setActiveSlide((prev) => {
      if (prev !== clamped) haptics.selection();
      return clamped;
    });
  }, []);

  const goToSlide = (idx: number) => {
    const el = carouselRef.current;
    if (!el) return;
    haptics.light();
    el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' });
  };

  const startEdit = (card: CardKey) => {
    const current = card === 'pegangan' ? wallet.saldoPegangan : wallet.saldoTabungan;
    setEditValue(String(current));
    setEditingCard(card);
    setOpenMenu(null);
  };

  const commitEdit = () => {
    if (!editingCard) return;
    const parsed = parseInt(editValue.replace(/[^0-9]/g, ''), 10);
    const finalAmount = Number.isFinite(parsed) ? parsed : 0;
    wallet.editSaldo(editingCard, finalAmount);
    setEditingCard(null);
  };

  const recentTx = wallet.transactions.slice(0, 8);
  const todayStr = getTodayDateStr();
  const today = formatFullDate(todayStr);
  const greeting = getGreeting();

  // ── Micro-interaction: animasi count-up/count-down tiap nominal
  // berubah (mis. abis nambah transaksi / transfer). Dimatikan
  // sementara data belum ready supaya tidak count-up dari 0 saat
  // pertama buka app.
  const animatedTotal = useCountUp(wallet.totalSaldo, { disabled: !wallet.isReady });
  const animatedPegangan = useCountUp(wallet.saldoPegangan, { disabled: !wallet.isReady });
  const animatedTabungan = useCountUp(wallet.saldoTabungan, { disabled: !wallet.isReady });
  const animatedMonthIncome = useCountUp(wallet.monthIncome, { disabled: !wallet.isReady });
  const animatedMonthExpense = useCountUp(wallet.monthExpense, { disabled: !wallet.isReady });
  const animatedTodayIncome = useCountUp(wallet.todayIncome, { disabled: !wallet.isReady });

  const maskTotal = (amount: number) =>
    hideTotal ? '••••••' : formatRupiah(amount);
  const maskMonthIncome = (amount: number) =>
    hideTotal ? '•••' : formatRupiahShort(amount);
  const maskMonthExpense = (amount: number) =>
    hideTotal ? '•••' : formatRupiahShort(amount);

  const maskPegangan = (amount: number) =>
    hidePegangan ? '••••••' : formatRupiah(amount);
  const maskPeganganShort = (amount: number) =>
    hidePegangan ? '•••' : formatRupiahShort(amount);
  const maskTabungan = (amount: number) =>
    hideTabungan ? '••••••' : formatRupiah(amount);

  const renderCardMenu = (card: CardKey, ref: React.RefObject<HTMLDivElement | null>) => (
    <div className="saldo-card-menu-wrap" ref={ref} style={{ position: 'relative' }}>
      <button
        className="saldo-card-icon-btn"
        onClick={() => setOpenMenu((m) => (m === card ? null : card))}
        aria-label={`Opsi saldo ${card}`}
      >
        <i className="fa-solid fa-ellipsis-vertical" />
      </button>
      {openMenu === card && (
        <div className="saldo-card-menu-dropdown">
          <button className="saldo-card-menu-item" onClick={() => startEdit(card)}>
            <i className="fa-solid fa-pen" />
            Edit Nominal
          </button>
        </div>
      )}
    </div>
  );

  // ── Skeleton loading state — cegah flash konten kosong sebelum
  // localStorage selesai dibaca oleh WalletContext.
  if (!wallet.isReady) {
    return <HomeSkeleton />;
  }

  return (
    <PullToRefresh onRefresh={wallet.hardRefresh}>
      {/* HEADER */}
      <header className="page-header">
        <div>
          <div className="header-greeting">{greeting}</div>
          <div className="header-name">
            <span className="header-name-brand">{userName || 'Keuanganku'}</span>
          </div>
          <div className="header-date">{today}</div>
        </div>
      </header>

      {/* SALDO CAROUSEL — Total / Pegangan / Tabungan */}
      <section className="saldo-carousel-wrap">
        <div
          className="saldo-carousel"
          ref={carouselRef}
          onScroll={handleCarouselScroll}
        >
          {/* SLIDE 1 — TOTAL SALDO */}
          <div className="saldo-slide">
            <div className="saldo-card saldo-card-total">
              <div className="card-orb card-orb-1" />
              <div className="card-orb card-orb-2" />

              <div className="saldo-card-top">
                <div>
                  <div className="saldo-card-label">
                    <i className="fa-solid fa-layer-group" />
                    Total Saldo
                  </div>
                  <div className="saldo-card-amount">{maskTotal(animatedTotal)}</div>
                </div>
                <button
                  className="saldo-card-icon-btn"
                  onClick={() => setHideTotal((h) => !h)}
                  aria-label={hideTotal ? 'Tampilkan total saldo' : 'Sembunyikan total saldo'}
                >
                  <i className={hideTotal ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'} />
                </button>
              </div>

              <div className="saldo-divider" />

              <div className="saldo-quick-stats">
                <div className="saldo-quick-stat">
                  <div className="saldo-quick-stat-label">
                    <i className="fa-solid fa-arrow-trend-up" />
                    Masuk Bulan Ini
                  </div>
                  <div className="saldo-quick-stat-value stat-income">
                    +{maskMonthIncome(animatedMonthIncome)}
                  </div>
                </div>
                <div className="saldo-quick-stat">
                  <div className="saldo-quick-stat-label">
                    <i className="fa-solid fa-arrow-trend-down" />
                    Keluar Bulan Ini
                  </div>
                  <div className="saldo-quick-stat-value stat-expense">
                    -{maskMonthExpense(animatedMonthExpense)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SLIDE 2 — SALDO PEGANGAN */}
          <div className="saldo-slide">
            <div className="saldo-card saldo-card-pegangan">
              <div className="card-orb card-orb-1" />
              <div className="card-orb card-orb-2" />

              <div className="saldo-card-top">
                <div style={{ flex: 1 }}>
                  <div className="saldo-card-label">
                    <i className="fa-solid fa-wallet" />
                    Saldo Pegangan
                  </div>

                  {editingCard === 'pegangan' ? (
                    <input
                      ref={editInputRef}
                      className="saldo-card-amount-edit"
                      type="text"
                      inputMode="numeric"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value.replace(/[^0-9]/g, ''))}
                      onBlur={commitEdit}
                      onKeyDown={(e) => { if (e.key === 'Enter') editInputRef.current?.blur(); }}
                    />
                  ) : (
                    <div className="saldo-card-amount">{maskPegangan(animatedPegangan)}</div>
                  )}
                </div>

                <div className="saldo-card-actions">
                  <button
                    className="saldo-card-icon-btn"
                    onClick={() => setHidePegangan((h) => !h)}
                    aria-label={hidePegangan ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
                  >
                    <i className={hidePegangan ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'} />
                  </button>
                  {renderCardMenu('pegangan', peganganMenuRef)}
                </div>
              </div>

              <div className="saldo-card-footer">
                <span className="saldo-card-badge">
                  <i className="fa-solid fa-plus" style={{ fontSize: 9 }} />
                  {maskPeganganShort(animatedTodayIncome)} hari ini
                </span>
              </div>
            </div>
          </div>

          {/* SLIDE 3 — SALDO TABUNGAN */}
          <div className="saldo-slide">
            <div className="saldo-card saldo-card-tabungan">
              <div className="card-orb card-orb-1" />
              <div className="card-orb card-orb-2" />

              <div className="saldo-card-top">
                <div style={{ flex: 1 }}>
                  <div className="saldo-card-label">
                    <i className="fa-solid fa-piggy-bank" />
                    Saldo Tabungan
                  </div>

                  {editingCard === 'tabungan' ? (
                    <input
                      ref={editInputRef}
                      className="saldo-card-amount-edit"
                      type="text"
                      inputMode="numeric"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value.replace(/[^0-9]/g, ''))}
                      onBlur={commitEdit}
                      onKeyDown={(e) => { if (e.key === 'Enter') editInputRef.current?.blur(); }}
                    />
                  ) : (
                    <div className="saldo-card-amount">{maskTabungan(animatedTabungan)}</div>
                  )}
                </div>

                <div className="saldo-card-actions">
                  <button
                    className="saldo-card-icon-btn"
                    onClick={() => setHideTabungan((h) => !h)}
                    aria-label={hideTabungan ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
                  >
                    <i className={hideTabungan ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'} />
                  </button>
                  {renderCardMenu('tabungan', tabunganMenuRef)}
                </div>
              </div>

              <div className="saldo-card-footer">
                <span className="saldo-card-badge">
                  <i className="fa-solid fa-lock" style={{ fontSize: 9 }} />
                  Total tersimpan
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dot indicators */}
        <div className="saldo-dots">
          {SLIDES.map((s, i) => (
            <button
              key={s}
              className={`saldo-dot ${activeSlide === i ? 'active' : ''}`}
              onClick={() => goToSlide(i)}
              aria-label={`Ke slide ${s}`}
            />
          ))}
        </div>

        {/* Transfer button */}
        <div className="transfer-fab-row">
          <button
            className="transfer-fab-btn"
            onClick={() => { haptics.medium(); setShowTransfer(true); }}
          >
            <i className="fa-solid fa-arrow-right-arrow-left" />
            Transfer Dana
          </button>
        </div>
      </section>

      {/* RECENT TRANSACTIONS */}
      <section className="recent-section">
        <div className="section-header">
          <span className="section-label">Transaksi Terbaru</span>
          <button
            className="section-see-all"
            onClick={() => router.push('/app/history')}
            aria-label="Lihat semua transaksi"
          >
            Lihat Semua
            <i className="fa-solid fa-chevron-right" />
          </button>
        </div>

        {recentTx.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <i className="fa-regular fa-clipboard" />
            </div>
            <div className="empty-state-text">Belum ada transaksi</div>
            <div className="empty-state-sub">
              Klik tombol + di bawah untuk catat pemasukkan pertamamu
            </div>
          </div>
        ) : (
          <div className="tx-list">
            {recentTx.map((tx) => (
              <TransactionItem key={tx.id} tx={tx} onClick={setEditingTx} />
            ))}
          </div>
        )}
      </section>

      <div style={{ height: 24 }} />

      {showTransfer && (
        <TransferModal onClose={() => setShowTransfer(false)} />
      )}

      {editingTx && (
        <EditTransactionSheet tx={editingTx} onClose={() => setEditingTx(null)} />
      )}
    </PullToRefresh>
  );
}
