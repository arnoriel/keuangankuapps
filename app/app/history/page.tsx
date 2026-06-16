'use client';

import '@/styles/history.css';
import { useState, useMemo, useRef } from 'react';
import { useWallet } from '@/context/WalletContext';
import TransactionItem from '@/components/TransactionItem';
import EditTransactionSheet from '@/components/EditTransactionSheet';
import { Transaction, TransactionType } from '@/lib/types';
import { formatDateHeader, formatRupiah } from '@/lib/utils';

type Filter = 'all' | 'income' | 'expense' | 'transfer';

const FILTERS: { key: Filter; label: string; icon: string }[] = [
  { key: 'all',      label: 'Semua',       icon: 'fa-solid fa-list' },
  { key: 'income',   label: 'Pemasukkan',  icon: 'fa-solid fa-coins' },
  { key: 'expense',  label: 'Pengeluaran', icon: 'fa-solid fa-cart-shopping' },
  { key: 'transfer', label: 'Transfer',    icon: 'fa-solid fa-arrow-right-arrow-left' },
];

// Income & expense categories from types.ts
const INCOME_CATEGORIES = ['gaji','freelance','driver','jualan','tunjangan','pasif','lainnya'] as const;
const EXPENSE_CATEGORIES = ['bensin','makan','utang','belanja','hiburan','lainnya'] as const;

const CATEGORY_LABEL: Record<string, string> = {
  gaji: 'Gaji', freelance: 'Freelance', driver: 'Driver', jualan: 'Jualan',
  tunjangan: 'Tunjangan', pasif: 'Pasif', lainnya: 'Lainnya',
  bensin: 'Bensin', makan: 'Makan', utang: 'Utang',
  belanja: 'Belanja', hiburan: 'Hiburan',
};

function matchesFilter(tx: Transaction, filter: Filter): boolean {
  if (filter === 'all') return true;
  if (filter === 'income') return tx.type === 'income';
  if (filter === 'expense') return tx.type === 'expense';
  if (filter === 'transfer') return tx.type === 'transfer_out' || tx.type === 'transfer_in';
  return true;
}

function matchesSearch(tx: Transaction, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  const note = (tx.note || '').toLowerCase();
  const cat = (tx.category || '').toLowerCase();
  const catLabel = (CATEGORY_LABEL[tx.category || ''] || '').toLowerCase();
  return note.includes(q) || cat.includes(q) || catLabel.includes(q);
}

function matchesMonth(tx: Transaction, month: string): boolean {
  if (!month) return true;
  // month format: "YYYY-MM"
  return tx.date.startsWith(month);
}

function matchesCategory(tx: Transaction, category: string): boolean {
  if (!category) return true;
  return tx.category === category;
}

function groupByDate(txs: Transaction[]): Map<string, Transaction[]> {
  const map = new Map<string, Transaction[]>();
  for (const tx of txs) {
    const list = map.get(tx.date) || [];
    list.push(tx);
    map.set(tx.date, list);
  }
  return map;
}

function getAvailableMonths(transactions: Transaction[]): string[] {
  const months = new Set<string>();
  for (const tx of transactions) {
    months.add(tx.date.slice(0, 7)); // "YYYY-MM"
  }
  return Array.from(months).sort((a, b) => b.localeCompare(a));
}

function formatMonthLabel(ym: string): string {
  const [year, month] = ym.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date);
}

export default function HistoryPage() {
  const { transactions } = useWallet();
  const [filter, setFilter] = useState<Filter>('all');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const availableMonths = useMemo(() => getAvailableMonths(transactions), [transactions]);

  // Which categories are relevant based on current type filter
  const availableCategories = useMemo(() => {
    if (filter === 'income') return INCOME_CATEGORIES;
    if (filter === 'expense') return EXPENSE_CATEGORIES;
    return Array.from(new Set([...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES]));
  }, [filter]);

  const filtered = useMemo(
    () =>
      transactions.filter(
        (tx) =>
          matchesFilter(tx, filter) &&
          matchesSearch(tx, search) &&
          matchesMonth(tx, selectedMonth) &&
          matchesCategory(tx, selectedCategory)
      ),
    [transactions, filter, search, selectedMonth, selectedCategory]
  );

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);
  const dates = Array.from(grouped.keys()).sort((a, b) => b.localeCompare(a));

  const stats = useMemo(() => {
    const income = filtered
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
    const expense = filtered
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
    return { income, expense, count: filtered.length };
  }, [filtered]);

  const hasActiveExtraFilters = selectedMonth || selectedCategory;
  const activeFilterCount = [selectedMonth, selectedCategory].filter(Boolean).length;

  function clearAllFilters() {
    setSearch('');
    setSelectedMonth('');
    setSelectedCategory('');
    setFilter('all');
  }

  return (
    <>
      {/* HEADER */}
      <header className="page-header history-header">
        <div>
          <div className="header-greeting">Rekap</div>
          <div className="header-name">Riwayat Transaksi</div>
        </div>
      </header>

      {/* SUMMARY MINI CARDS */}
      <div className="history-summary">
        <div className="history-summary-card">
          <div className="hs-label">
            <i className="fa-solid fa-coins" />
            Total Masuk
          </div>
          <div className="hs-value hs-green">+{formatRupiah(stats.income)}</div>
        </div>
        <div className="history-summary-card">
          <div className="hs-label">
            <i className="fa-solid fa-cart-shopping" />
            Total Keluar
          </div>
          <div className="hs-value hs-red">-{formatRupiah(stats.expense)}</div>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="history-search-wrap">
        <div className="history-search-box">
          <i className="fa-solid fa-magnifying-glass search-icon" />
          <input
            ref={searchRef}
            className="history-search-input"
            type="text"
            placeholder="Cari transaksi, kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear-btn" onClick={() => setSearch('')}>
              <i className="fa-solid fa-xmark" />
            </button>
          )}
        </div>
        <button
          className={`filter-toggle-btn ${showFilters || hasActiveExtraFilters ? 'active' : ''}`}
          onClick={() => setShowFilters((v) => !v)}
          aria-label="Toggle filters"
        >
          <i className="fa-solid fa-sliders" />
          {activeFilterCount > 0 && (
            <span className="filter-badge">{activeFilterCount}</span>
          )}
        </button>
      </div>

      {/* EXPANDED FILTER PANEL */}
      {showFilters && (
        <div className="history-filter-panel">
          {/* Month filter */}
          <div className="hfp-row">
            <span className="hfp-label">
              <i className="fa-regular fa-calendar" /> Bulan
            </span>
            <div className="hfp-chips">
              <button
                className={`hfp-chip ${!selectedMonth ? 'active' : ''}`}
                onClick={() => setSelectedMonth('')}
              >
                Semua
              </button>
              {availableMonths.map((m) => (
                <button
                  key={m}
                  className={`hfp-chip ${selectedMonth === m ? 'active' : ''}`}
                  onClick={() => setSelectedMonth(selectedMonth === m ? '' : m)}
                >
                  {formatMonthLabel(m)}
                </button>
              ))}
            </div>
          </div>

          {/* Category filter */}
          <div className="hfp-row">
            <span className="hfp-label">
              <i className="fa-solid fa-tag" /> Kategori
            </span>
            <div className="hfp-chips">
              <button
                className={`hfp-chip ${!selectedCategory ? 'active' : ''}`}
                onClick={() => setSelectedCategory('')}
              >
                Semua
              </button>
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  className={`hfp-chip ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
                >
                  {CATEGORY_LABEL[cat]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FILTER TABS (type) */}
      <div className="filter-tabs">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`filter-tab ${filter === f.key ? 'active' : ''}`}
            onClick={() => {
              setFilter(f.key);
              // Reset category when switching type filter
              setSelectedCategory('');
            }}
          >
            <i className={f.icon} />
            {f.label}
          </button>
        ))}
      </div>

      {/* ACTIVE FILTERS SUMMARY + CLEAR */}
      {(search || hasActiveExtraFilters) && (
        <div className="history-active-filters">
          <span className="haf-info">
            <i className="fa-solid fa-filter" />
            {filtered.length} dari {transactions.length} transaksi
          </span>
          <button className="haf-clear" onClick={clearAllFilters}>
            Reset semua
          </button>
        </div>
      )}

      {/* TRANSACTION COUNT */}
      {!search && !hasActiveExtraFilters && filtered.length > 0 && (
        <div className="history-count">{filtered.length} transaksi</div>
      )}

      {/* GROUPED TRANSACTIONS */}
      {dates.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            {search || hasActiveExtraFilters ? (
              <i className="fa-solid fa-magnifying-glass" />
            ) : (
              <i className="fa-regular fa-folder-open" />
            )}
          </div>
          <div className="empty-state-text">
            {search || hasActiveExtraFilters ? 'Tidak ditemukan' : 'Tidak ada transaksi'}
          </div>
          <div className="empty-state-sub">
            {search
              ? `Tidak ada hasil untuk "${search}"`
              : hasActiveExtraFilters
              ? 'Coba ubah atau reset filter'
              : filter === 'all'
              ? 'Mulai catat transaksi dengan tombol +'
              : `Belum ada transaksi ${FILTERS.find((f) => f.key === filter)?.label.toLowerCase()}`}
          </div>
          {(search || hasActiveExtraFilters) && (
            <button className="empty-reset-btn" onClick={clearAllFilters}>
              <i className="fa-solid fa-rotate-left" /> Reset Filter
            </button>
          )}
        </div>
      ) : (
        <div className="history-list">
          {dates.map((date) => {
            const txs = grouped.get(date) || [];
            const dayIncome = txs
              .filter((t) => t.type === 'income')
              .reduce((s, t) => s + t.amount, 0);
            const dayExpense = txs
              .filter((t) => t.type === 'expense')
              .reduce((s, t) => s + t.amount, 0);

            return (
              <div key={date} className="history-group">
                <div className="history-date-header">
                  <span>{formatDateHeader(date)}</span>
                  <div className="history-date-summary">
                    {dayIncome > 0 && (
                      <span className="hds-income">+{formatRupiah(dayIncome)}</span>
                    )}
                    {dayExpense > 0 && (
                      <span className="hds-expense">-{formatRupiah(dayExpense)}</span>
                    )}
                  </div>
                </div>
                <div className="tx-list">
                  {txs.map((tx) => (
                    <TransactionItem key={tx.id} tx={tx} onClick={setEditingTx} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ height: 24 }} />

      {editingTx && (
        <EditTransactionSheet tx={editingTx} onClose={() => setEditingTx(null)} />
      )}
    </>
  );
}