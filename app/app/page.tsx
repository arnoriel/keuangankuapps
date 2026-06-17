'use client';

import '@/styles/home.css';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/context/WalletContext';
import TransactionItem from '@/components/TransactionItem';
import TransferModal from '@/components/TransferModal';
import EditTransactionSheet from '@/components/EditTransactionSheet';
import { Transaction } from '@/lib/types';
import { formatRupiah, formatRupiahShort, getGreeting, formatFullDate, getTodayDateStr } from '@/lib/utils';

type CardKey = 'pegangan' | 'tabungan';

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

  return (
    <>
      {/* HEADER */}
      <header className="page-header">
        <div>
          <div className="header-greeting">{greeting}</div>
          <div className="header-name">
            <span className="header-name-brand">Keuanganku</span>
          </div>
          <div className="header-date">{today}</div>
        </div>
      </header>

      {/* TOTAL SALDO HERO CARD */}
      <section className="total-section">
        <div className="total-card">
          <div className="total-card-top">
            <div>
              <div className="total-card-label">
                <i className="fa-solid fa-layer-group" />
                Total Saldo
              </div>
              <div className="total-card-amount">{maskTotal(wallet.totalSaldo)}</div>
            </div>
            <button
              className="card-eye-btn"
              onClick={() => setHideTotal((h) => !h)}
              aria-label={hideTotal ? 'Tampilkan total saldo' : 'Sembunyikan total saldo'}
            >
              <i className={hideTotal ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'} />
            </button>
          </div>

          <div className="total-divider" />

          <div className="quick-stats">
            <div className="quick-stat">
              <div className="quick-stat-label">
                <i className="fa-solid fa-arrow-trend-up" />
                Masuk Bulan Ini
              </div>
              <div className="quick-stat-value stat-income">
                +{maskMonthIncome(wallet.monthIncome)}
              </div>
            </div>
            <div className="quick-stat">
              <div className="quick-stat-label">
                <i className="fa-solid fa-arrow-trend-down" />
                Keluar Bulan Ini
              </div>
              <div className="quick-stat-value stat-expense">
                -{maskMonthExpense(wallet.monthExpense)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div style={{ height: 14 }} />

      {/* WALLET CARDS */}
      <section className="wallet-section">

        {/* SALDO PEGANGAN */}
        <div className="wallet-card wallet-card-green">
          <div className="card-deco" />
          <div className="card-shine" />

          <div className="card-menu-wrap" ref={peganganMenuRef}>
            <button
              className="card-menu-btn"
              onClick={() => setOpenMenu((m) => (m === 'pegangan' ? null : 'pegangan'))}
              aria-label="Opsi saldo pegangan"
            >
              <i className="fa-solid fa-ellipsis-vertical" />
            </button>
            {openMenu === 'pegangan' && (
              <div className="card-menu-dropdown">
                <button
                  className="card-menu-item"
                  onClick={() => startEdit('pegangan')}
                >
                  <i className="fa-solid fa-pen" />
                  Edit Nominal
                </button>
              </div>
            )}
          </div>

          <div className="card-content">
            <div className="card-label">
              <i className="fa-solid fa-wallet" />
              Saldo Pegangan
            </div>

            {editingCard === 'pegangan' ? (
              <div className="card-amount-edit-wrap">
                <input
                  ref={editInputRef}
                  className="card-amount-input"
                  type="text"
                  inputMode="numeric"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value.replace(/[^0-9]/g, ''))}
                  onBlur={commitEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') editInputRef.current?.blur();
                  }}
                />
              </div>
            ) : (
              <div className="card-amount">{maskPegangan(wallet.saldoPegangan)}</div>
            )}

            <div className="card-footer">
              <span className="card-badge">
                <i className="fa-solid fa-plus" style={{ fontSize: 9 }} />
                {maskPeganganShort(wallet.todayIncome)} hari ini
              </span>
              <button
                className="card-eye-btn"
                onClick={() => setHidePegangan((h) => !h)}
                aria-label={hidePegangan ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
              >
                <i className={hidePegangan ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'} />
              </button>
            </div>
          </div>
        </div>

        {/* TRANSFER BUTTON */}
        <div className="transfer-btn-wrapper">
          <div className="transfer-line" />
          <button
            className="transfer-btn"
            onClick={() => setShowTransfer(true)}
            aria-label="Transfer dana"
          >
            <i className="fa-solid fa-arrow-right-arrow-left" />
          </button>
          <div className="transfer-line" />
        </div>

        {/* SALDO TABUNGAN */}
        <div className="wallet-card wallet-card-blue">
          <div className="card-deco" />
          <div className="card-shine" />

          <div className="card-menu-wrap" ref={tabunganMenuRef}>
            <button
              className="card-menu-btn"
              onClick={() => setOpenMenu((m) => (m === 'tabungan' ? null : 'tabungan'))}
              aria-label="Opsi saldo tabungan"
            >
              <i className="fa-solid fa-ellipsis-vertical" />
            </button>
            {openMenu === 'tabungan' && (
              <div className="card-menu-dropdown">
                <button
                  className="card-menu-item"
                  onClick={() => startEdit('tabungan')}
                >
                  <i className="fa-solid fa-pen" />
                  Edit Nominal
                </button>
              </div>
            )}
          </div>

          <div className="card-content">
            <div className="card-label">
              <i className="fa-solid fa-piggy-bank" />
              Saldo Tabungan
            </div>

            {editingCard === 'tabungan' ? (
              <div className="card-amount-edit-wrap">
                <input
                  ref={editInputRef}
                  className="card-amount-input"
                  type="text"
                  inputMode="numeric"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value.replace(/[^0-9]/g, ''))}
                  onBlur={commitEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') editInputRef.current?.blur();
                  }}
                />
              </div>
            ) : (
              <div className="card-amount">{maskTabungan(wallet.saldoTabungan)}</div>
            )}

            <div className="card-footer">
              <span className="card-badge">
                <i className="fa-solid fa-lock" style={{ fontSize: 9 }} />
                Total tersimpan
              </span>
              <button
                className="card-eye-btn"
                onClick={() => setHideTabungan((h) => !h)}
                aria-label={hideTabungan ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
              >
                <i className={hideTabungan ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'} />
              </button>
            </div>
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

      {showTransfer && (
        <TransferModal onClose={() => setShowTransfer(false)} />
      )}

      {editingTx && (
        <EditTransactionSheet tx={editingTx} onClose={() => setEditingTx(null)} />
      )}
    </>
  );
}