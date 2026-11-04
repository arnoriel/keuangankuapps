'use client';

import '@/styles/home.css';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/context/WalletContext';
import { haptics } from '@/lib/haptics';
import { useCountUp } from '@/hooks/useCountUp';
import { useInfiniteCarousel } from '@/hooks/useInfiniteCarousel';
import { useDrawerMotion } from '@/hooks/useDrawerMotion';
import { prefetchPlatformAssets } from '@/lib/platformCatalog';
import TransactionItem from '@/components/TransactionItem';
import TransferModal from '@/components/TransferModal';
import EditTransactionSheet from '@/components/EditTransactionSheet';
import EditSaldoSheet from '@/components/EditSaldoSheet';
import SaldoCardMenu from '@/components/SaldoCardMenu';
import HomeSkeleton from '@/components/HomeSkeleton';
import PullToRefresh from '@/components/PullToRefresh';
import SubBalancePanel from '@/components/SubBalancePanel';
import { Transaction, WalletType } from '@/lib/types';
import { formatRupiah, formatRupiahShort, getGreeting, formatFullDate, getTodayDateStr } from '@/lib/utils';

type CardKey = 'pegangan' | 'tabungan';
type SlideKey = 'total' | 'pegangan' | 'tabungan';
const SLIDES: SlideKey[] = ['total', 'pegangan', 'tabungan'];
const AUTO_SLIDE_MS = 5000;
// [clone terakhir, ...asli, clone pertama] → loop tanpa putus ke dua arah
const LOOP_SLIDES: SlideKey[] = [SLIDES[SLIDES.length - 1], ...SLIDES, SLIDES[0]];

const RECENT_TX_LIMIT = 5;

const FEATURES = [
  { href: '/app/incomes',    label: 'Stream Pemasukkan',     icon: 'fa-money-bill-trend-up', color: 'var(--green-light)', bg: 'var(--green-subtle)' },
  { href: '/app/goals',      label: 'Goals & Tagihan Rutin', icon: 'fa-bullseye',            color: 'var(--orange)',      bg: 'var(--orange-subtle)' },
  { href: '/app/calculator', label: 'Kalkulator',            icon: 'fa-calculator',          color: 'var(--brand)',       bg: 'var(--brand-subtle)' },
] as const;

export default function DashboardPage() {
  const wallet = useWallet();
  const router = useRouter();
  const [showTransfer, setShowTransfer] = useState(false);
  const [hideTotal, setHideTotal] = useState(false);
  const [hidePegangan, setHidePegangan] = useState(false);
  const [hideTabungan, setHideTabungan] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [subBalanceCard, setSubBalanceCard] = useState<WalletType | null>(null);
  // Drawer digerakkan lewat transform (lihat useDrawerMotion), bukan animasi layout.
  const drawer = useDrawerMotion<WalletType>(subBalanceCard);

  // Panaskan cache icon/warna di waktu idle supaya drawer tidak decode SVG saat animasi.
  useEffect(() => {
    const slugs = wallet.subBalances.map((s) => s.platformSlug);
    if (!slugs.length) return;
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 200));
    idle(() => prefetchPlatformAssets(slugs));
  }, [wallet.subBalances]);

  // Dropdown titik tiga & mode edit nominal per card
  const [menuOpen, setMenuOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CardKey | null>(null);

  // Carousel berputar + auto-geser 5 detik (pause saat ada interaksi/overlay)
  const carousel = useInfiniteCarousel({
    count: SLIDES.length,
    interval: AUTO_SLIDE_MS,
    enabled: wallet.isReady,
    paused: !!(menuOpen || editingCard || showTransfer || editingTx || subBalanceCard),
  });

  const startEdit = (card: CardKey) => {
    setEditingCard(card);
  };

  const recentTx = wallet.transactions.slice(0, RECENT_TX_LIMIT);
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

  // Config card Pegangan & Tabungan (struktur identik → DRY)
  const cardConfig = {
    pegangan: {
      label: 'Saldo Pegangan', icon: 'fa-wallet',
      amount: maskPegangan(animatedPegangan),
      hidden: hidePegangan, toggle: () => setHidePegangan((h) => !h),
      badgeIcon: 'fa-plus', badge: `${maskPeganganShort(animatedTodayIncome)} hari ini`,
    },
    tabungan: {
      label: 'Saldo Tabungan', icon: 'fa-piggy-bank',
      amount: maskTabungan(animatedTabungan),
      hidden: hideTabungan, toggle: () => setHideTabungan((h) => !h),
      badgeIcon: 'fa-lock', badge: 'Total tersimpan',
    },
  } as const;

  // `clone` = salinan visual untuk loop (inert)
  const renderSlide = (key: SlideKey, clone: boolean) => {
    if (key === 'total') {
      return (
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
      );
    }

    const cfg = cardConfig[key];
    return (
      <div className={`saldo-card saldo-card-${key}`}>
        <div className="card-orb card-orb-1" />
        <div className="card-orb card-orb-2" />

        <div className="saldo-card-top">
          <div style={{ flex: 1 }}>
            <div className="saldo-card-label">
              <i className={`fa-solid ${cfg.icon}`} />
              {cfg.label}
            </div>

            <div className="saldo-card-amount">{cfg.amount}</div>
          </div>

          <div className="saldo-card-actions">
            <button
              className="saldo-card-icon-btn"
              onClick={cfg.toggle}
              aria-label={cfg.hidden ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
            >
              <i className={cfg.hidden ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'} />
            </button>
            <SaldoCardMenu label={cfg.label} onEdit={() => startEdit(key)} onOpenChange={clone ? undefined : setMenuOpen} />
          </div>
        </div>

        <div className="saldo-card-footer">
          <span className="saldo-card-badge">
            <i className={`fa-solid ${cfg.badgeIcon}`} style={{ fontSize: 9 }} />
            {cfg.badge}
          </span>
        </div>

        {!clone && (
          <button
            type="button"
            className={`saldo-card-expand-btn ${subBalanceCard === key ? 'is-open' : ''}`}
            onClick={() => {
              haptics.light();
              setSubBalanceCard((cur) => (cur === key ? null : key));
            }}
            aria-label={`Lihat rincian ${cfg.label}`}
            aria-expanded={subBalanceCard === key}
          >
            <i className="fa-solid fa-chevron-down" />
          </button>
        )}
      </div>
    );
  };

  // ── Skeleton loading state — cegah flash konten kosong sebelum
  // localStorage selesai dibaca oleh WalletContext.
  if (!wallet.isReady) {
    return <HomeSkeleton />;
  }

  return (
    <PullToRefresh onRefresh={wallet.hardRefresh}>
      {/* HERO — fill tema di belakang header + card saldo (tinggi tetap, tidak ikut collapse) */}
      <div className="home-hero">
        <div className="home-hero-fill" aria-hidden="true" />
        {/* HEADER */}
        <header className="page-header">
          <div>
            <div className="header-greeting">{greeting}</div>
            <div className="header-name">
              <span className="header-name-brand">{wallet.activeAccountName || 'Keuanganku'}</span>
            </div>
            <div className="header-date">{today}</div>
          </div>
        </header>

        {/* SALDO CAROUSEL — Total / Pegangan / Tabungan */}
        <section className="saldo-carousel-wrap">
          <div
            className={`saldo-carousel ${subBalanceCard ? 'is-locked' : ''}`}
            ref={carousel.ref}
            {...carousel.handlers}>
            {LOOP_SLIDES.map((key, i) => {
              const clone = i === 0 || i === LOOP_SLIDES.length - 1;
              return (
                <div
                  key={`${key}-${i}`}
                  className="saldo-slide"
                  aria-hidden={clone || undefined}
                  inert={clone}
                >
                  {renderSlide(key, clone)}
                </div>
              );
            })}
          </div>
          {/* lock-overlay: cegah swipe/scroll pindah slide saat drawer rincian
              saldo terbuka, TANPA ganggu scroll-snap native (overflow/touch-action
              aslinya) yang bikin transisi antar slide kepotong/nyangkut. */}
          {subBalanceCard && <div className="saldo-carousel-lock" aria-hidden="true" />}
        </section>
      </div>

      {/* RINCIAN SALDO — drawer yang "ditarik keluar" dari belakang card saldo:
          posisi ketumpuk di bawah carousel (negative margin), card saldo tetap
          di atasnya (z-index lebih tinggi), jadi kelihatan kaya desk pull-out. */}
      <div ref={drawer.collapseRef} className={`subbalance-collapse${drawer.shown ? ' is-mounted' : ''}`}>
        <div className="subbalance-panel-outer">
          <div ref={drawer.slideRef} className="subbalance-slide">
            {drawer.shown && <SubBalancePanel wallet={drawer.shown} />}
          </div>
        </div>
      </div>

      <div ref={drawer.belowRef} className="home-below">
      <section className="saldo-meta">
        {/* Dot indicators */}
        <div className={`saldo-dots ${carousel.running ? 'is-running' : ''}`}>
          {SLIDES.map((s, i) => (
            <button
              key={s}
              className={`saldo-dot ${carousel.active === i ? 'active' : ''}`}
              onClick={() => { haptics.light(); carousel.goTo(i); }}
              aria-label={`Ke slide ${s}`}
            >
              {carousel.active === i && carousel.running && (
                <span className="saldo-dot-fill" style={{ animationDuration: `${AUTO_SLIDE_MS}ms` }} />
              )}
            </button>
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

      {/* SEMUA FITUR */}
      <section className="features-section">
        <div className="features-card">
          <div className="features-title">Semua Fitur</div>
          <div className="features-grid">
            {FEATURES.map((f) => (
              <button
                key={f.href}
                type="button"
                className="feature-tile"
                onClick={() => { haptics.light(); router.push(f.href); }}
              >
                <span className="feature-tile-icon" style={{ background: f.bg, color: f.color }}>
                  <i className={`fa-solid ${f.icon}`} />
                </span>
                <span className="feature-tile-label">{f.label}</span>
              </button>
            ))}
          </div>
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
      </div>

      {showTransfer && (
        <TransferModal onClose={() => setShowTransfer(false)} />
      )}

      {editingCard && (
        <EditSaldoSheet wallet={editingCard} onClose={() => setEditingCard(null)} />
      )}

      {editingTx && (
        <EditTransactionSheet tx={editingTx} onClose={() => setEditingTx(null)} />
      )}
    </PullToRefresh>
  );
}