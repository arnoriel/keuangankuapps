'use client';

import '@/styles/incomes.css';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/context/WalletContext';
import TransactionItem from '@/components/TransactionItem';
import EditTransactionSheet from '@/components/EditTransactionSheet';
import { Transaction } from '@/lib/types';
import {
  formatRupiah, formatRupiahShort, formatDateHeader,
  getIncomeCategory, INCOME_CATEGORIES,
} from '@/lib/utils';

type Period = 'harian' | 'mingguan' | 'bulanan';

const PERIODS: { key: Period; label: string; icon: string }[] = [
  { key: 'harian',   label: 'Harian',   icon: 'fa-solid fa-sun' },
  { key: 'mingguan', label: 'Mingguan', icon: 'fa-solid fa-calendar-week' },
  { key: 'bulanan',  label: 'Bulanan',  icon: 'fa-solid fa-calendar' },
];

// ─── Date helpers ──────────────────────────────────────────────────────────
function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Monday-start week range containing `d`
function getWeekRange(d: Date): { start: Date; end: Date } {
  const day = d.getDay(); // 0=Sun..6=Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  start.setDate(d.getDate() + diffToMonday);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
}

function getMonthRange(d: Date): { start: Date; end: Date } {
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { start, end };
}

const DOW_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

// ─── Bar Chart ─────────────────────────────────────────────────────────────
interface Bar { label: string; value: number; isToday?: boolean; }

function IncomeBarChart({ bars }: { bars: Bar[] }) {
  const maxVal = Math.max(...bars.map(b => b.value), 1);

  return (
    <div className="income-bar-chart">
      {bars.map((b, i) => (
        <div key={i} className="income-bar-group">
          <div className="income-bar-value">{b.value > 0 ? formatRupiahShort(b.value) : ''}</div>
          <div className="income-bar-track">
            <div
              className={`income-bar ${b.isToday ? 'income-bar--active' : ''}`}
              style={{ height: `${(b.value / maxVal) * 100}%` }}
              title={formatRupiah(b.value)}
            />
          </div>
          <div className={`income-bar-label ${b.isToday ? 'income-bar-label--active' : ''}`}>{b.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────
export default function IncomesPage() {
  const { transactions } = useWallet();
  const router = useRouter();
  const [period, setPeriod] = useState<Period>('harian');
  const [anchor, setAnchor] = useState(new Date());
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const incomeAll = useMemo(
    () => transactions.filter(t => t.type === 'income'),
    [transactions]
  );

  // ─── Range for current view ───────────────────────────────────────────
  const range = useMemo(() => {
    if (period === 'harian') {
      const s = new Date(anchor); s.setHours(0, 0, 0, 0);
      return { start: s, end: s };
    }
    if (period === 'mingguan') return getWeekRange(anchor);
    return getMonthRange(anchor);
  }, [period, anchor]);

  const now = new Date();
  const isCurrentRange = useMemo(() => {
    if (period === 'harian') return toDateStr(anchor) === toDateStr(now);
    if (period === 'mingguan') {
      const { start } = getWeekRange(now);
      const { start: aStart } = getWeekRange(anchor);
      return toDateStr(start) === toDateStr(aStart);
    }
    return anchor.getFullYear() === now.getFullYear() && anchor.getMonth() === now.getMonth();
  }, [period, anchor]);

  function navigate(dir: -1 | 1) {
    const d = new Date(anchor);
    if (period === 'harian') d.setDate(d.getDate() + dir);
    else if (period === 'mingguan') d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setAnchor(d);
  }

  const rangeStartStr = toDateStr(range.start);
  const rangeEndStr = toDateStr(range.end);

  const rangeLabel = useMemo(() => {
    if (period === 'harian') {
      return new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(anchor);
    }
    if (period === 'mingguan') {
      const fmt = (d: Date) => new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(d);
      return `${fmt(range.start)} – ${fmt(range.end)}, ${range.end.getFullYear()}`;
    }
    return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(anchor);
  }, [period, anchor, range]);

  // ─── Transactions in current range ────────────────────────────────────
  const rangeTx = useMemo(
    () => incomeAll.filter(t => t.date >= rangeStartStr && t.date <= rangeEndStr)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [incomeAll, rangeStartStr, rangeEndStr]
  );

  const rangeTotal = useMemo(() => rangeTx.reduce((s, t) => s + t.amount, 0), [rangeTx]);

  // ─── Bars for chart ────────────────────────────────────────────────────
  const bars: Bar[] = useMemo(() => {
    if (period === 'harian') {
      // last 7 days ending at anchor
      const result: Bar[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(anchor);
        d.setDate(d.getDate() - i);
        const ds = toDateStr(d);
        const val = incomeAll.filter(t => t.date === ds).reduce((s, t) => s + t.amount, 0);
        result.push({ label: DOW_SHORT[d.getDay()], value: val, isToday: ds === toDateStr(now) });
      }
      return result;
    }
    if (period === 'mingguan') {
      // days Mon–Sun of current week
      const result: Bar[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(range.start);
        d.setDate(d.getDate() + i);
        const ds = toDateStr(d);
        const val = incomeAll.filter(t => t.date === ds).reduce((s, t) => s + t.amount, 0);
        result.push({ label: DOW_SHORT[d.getDay()], value: val, isToday: ds === toDateStr(now) });
      }
      return result;
    }
    // bulanan: last 6 months ending at anchor's month
    const result: Bar[] = [];
    for (let i = 5; i >= 0; i--) {
      let m = anchor.getMonth() - i;
      let y = anchor.getFullYear();
      while (m < 0) { m += 12; y--; }
      const { start: s, end: e } = getMonthRange(new Date(y, m, 1));
      const ss = toDateStr(s), es = toDateStr(e);
      const val = incomeAll.filter(t => t.date >= ss && t.date <= es).reduce((sum, t) => sum + t.amount, 0);
      const label = new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(new Date(y, m, 1));
      result.push({ label, value: val, isToday: y === now.getFullYear() && m === now.getMonth() });
    }
    return result;
  }, [period, anchor, incomeAll, range]);

  // ─── Breakdown by source/category ─────────────────────────────────────
  const sourceBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const tx of rangeTx) {
      const key = tx.category ?? 'lainnya';
      map[key] = (map[key] ?? 0) + tx.amount;
    }
    return Object.entries(map)
      .map(([key, value]) => ({ ...getIncomeCategory(key), value }))
      .sort((a, b) => b.value - a.value);
  }, [rangeTx]);

  // ─── Group transactions by date for list display ──────────────────────
  const groupedTx = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const tx of rangeTx) {
      const list = map.get(tx.date) || [];
      list.push(tx);
      map.set(tx.date, list);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [rangeTx]);

  return (
    <>
      <header className="page-header incomes-header">
        <button className="goals-back-btn" onClick={() => router.push('/app/analytics')}>
          <i className="fa-solid fa-chevron-left" />
        </button>
        <div>
          <div className="header-greeting">Kelola</div>
          <div className="header-name"><span className="header-name-brand">Stream Pemasukkan</span></div>
        </div>
        <div style={{ width: 36 }} />
      </header>

      {/* Period Tabs */}
      <section style={{ padding: '0 16px 12px' }}>
        <div className="incomes-period-tabs">
          {PERIODS.map(p => (
            <button
              key={p.key}
              className={`incomes-period-tab ${period === p.key ? 'active' : ''}`}
              onClick={() => setPeriod(p.key)}
            >
              <i className={p.icon} /> {p.label}
            </button>
          ))}
        </div>
      </section>

      {/* Range Navigator */}
      <section style={{ padding: '0 16px 16px' }}>
        <div className="month-selector">
          <button className="month-nav-btn" onClick={() => navigate(-1)}><i className="fa-solid fa-chevron-left" /></button>
          <span className="month-label" style={{ textTransform: 'capitalize' }}>{rangeLabel}</span>
          <button className="month-nav-btn" onClick={() => navigate(1)} disabled={isCurrentRange}>
            <i className="fa-solid fa-chevron-right" style={{ opacity: isCurrentRange ? 0.3 : 1 }} />
          </button>
        </div>
      </section>

      {/* Total Card */}
      <section style={{ padding: '0 16px 16px' }}>
        <div className="incomes-total-card">
          <div className="incomes-total-label">
            <i className="fa-solid fa-coins" /> Total Pemasukkan
          </div>
          <div className="incomes-total-amount">{formatRupiah(rangeTotal)}</div>
          <div className="incomes-total-sub">{rangeTx.length} transaksi</div>
        </div>
      </section>

      {/* Bar Chart */}
      <section className="analytics-section">
        <div className="section-header">
          <span className="section-label">
            <i className="fa-solid fa-chart-column" style={{ color: 'var(--green-light)', marginRight: 6 }} />
            {period === 'harian' ? '7 Hari Terakhir' : period === 'mingguan' ? 'Senin – Minggu' : '6 Bulan Terakhir'}
          </span>
        </div>
        <div className="chart-card">
          <IncomeBarChart bars={bars} />
        </div>
      </section>

      {/* Source Breakdown */}
      {sourceBreakdown.length > 0 && (
        <section className="analytics-section">
          <div className="section-header">
            <span className="section-label">
              <i className="fa-solid fa-layer-group" style={{ color: 'var(--blue-light)', marginRight: 6 }} />
              Per Sumber
            </span>
          </div>
          <div className="chart-card">
            <div className="incomes-source-list">
              {sourceBreakdown.map(s => (
                <div key={s.key} className="incomes-source-row">
                  <div className="incomes-source-icon" style={{ background: s.color + '22', color: s.color }}>
                    <i className={`fa-solid ${s.icon}`} />
                  </div>
                  <div className="incomes-source-info">
                    <div className="incomes-source-label">{s.label}</div>
                    <div className="incomes-source-bar-track">
                      <div
                        className="incomes-source-bar-fill"
                        style={{ width: `${rangeTotal > 0 ? (s.value / rangeTotal) * 100 : 0}%`, background: s.color }}
                      />
                    </div>
                  </div>
                  <div className="incomes-source-value">{formatRupiahShort(s.value)}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Transaction List */}
      <section className="analytics-section">
        <div className="section-header">
          <span className="section-label">
            <i className="fa-solid fa-list" style={{ color: 'var(--text-3)', marginRight: 6 }} />
            Riwayat Transaksi
          </span>
        </div>
        {groupedTx.length === 0 ? (
          <div className="empty-state" style={{ margin: '16px 0' }}>
            <div className="empty-state-icon"><i className="fa-regular fa-face-meh" /></div>
            <div className="empty-state-text">Belum ada pemasukkan</div>
            <div className="empty-state-sub">di periode ini</div>
          </div>
        ) : (
          groupedTx.map(([date, txs]) => (
            <div key={date} className="incomes-date-group">
              <div className="incomes-date-header">{formatDateHeader(date)}</div>
              <div className="incomes-date-list">
                {txs.map(tx => (
                  <TransactionItem key={tx.id} tx={tx} onClick={setEditingTx} />
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      <div style={{ height: 24 }} />

      {editingTx && (
        <EditTransactionSheet tx={editingTx} onClose={() => setEditingTx(null)} />
      )}
    </>
  );
}