'use client';

import '@/styles/analytics.css';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/context/WalletContext';
import {
  formatRupiah, formatRupiahShort,
  getMonthLabel, getMonthRange,
  INCOME_CATEGORIES, EXPENSE_CATEGORIES,
  getIncomeCategory, getExpenseCategory,
} from '@/lib/utils';
import { Transaction } from '@/lib/types';

// ─── Donut Chart ──────────────────────────────────────────────────────────
interface Segment { label: string; value: number; color: string; }

function DonutChart({ segments, total }: { segments: Segment[]; total: number }) {
  const r = 54;
  const strokeW = 18;
  const C = 2 * Math.PI * r;
  let cum = 0;

  if (total === 0) {
    return (
      <div style={{ width: 140, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>Belum ada data</div>
      </div>
    );
  }

  return (
    <svg viewBox="0 0 140 140" width={140} height={140} style={{ flexShrink: 0 }}>
      <circle cx={70} cy={70} r={r} fill="none" stroke="var(--bg-elevated)" strokeWidth={strokeW} />
      {segments.map((seg, i) => {
        const pct = seg.value / total;
        const len = pct * C;
        const startDeg = (cum / total) * 360;
        cum += seg.value;
        return (
          <circle key={i} cx={70} cy={70} r={r} fill="none"
            stroke={seg.color} strokeWidth={strokeW}
            strokeDasharray={`${len} ${C - len}`}
            strokeDashoffset={0}
            transform={`rotate(${startDeg - 90} 70 70)`}
            strokeLinecap="butt"
          />
        );
      })}
      <text x={70} y={66} textAnchor="middle" style={{ fontSize: 11, fill: 'var(--text-3)', fontFamily: 'var(--font)' }}>Total</text>
      <text x={70} y={82} textAnchor="middle" style={{ fontSize: 13, fontWeight: 700, fill: 'var(--text-1)', fontFamily: 'var(--font)' }}>
        {formatRupiahShort(total)}
      </text>
    </svg>
  );
}

// ─── Bar Chart (4-month trend) ────────────────────────────────────────────
interface MonthBar { label: string; income: number; expense: number; }

function BarChart({ bars }: { bars: MonthBar[] }) {
  const maxVal = Math.max(...bars.flatMap(b => [b.income, b.expense]), 1);

  return (
    <div className="bar-chart">
      {bars.map((b, i) => (
        <div key={i} className="bar-group">
          <div className="bar-pair">
            <div className="bar bar-income" style={{ height: `${(b.income / maxVal) * 100}%` }} title={formatRupiah(b.income)} />
            <div className="bar bar-expense" style={{ height: `${(b.expense / maxVal) * 100}%` }} title={formatRupiah(b.expense)} />
          </div>
          <div className="bar-label">{b.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Goals Teaser Card ────────────────────────────────────────────────────
function GoalsTeaser({ savingsGoals, recurringExpenses, onNavigate }: {
  savingsGoals: any[];
  recurringExpenses: any[];
  onNavigate: () => void;
}) {
  const activeGoals = savingsGoals.length;
  const completedGoals = savingsGoals.filter(g => g.currentAmount >= g.targetAmount).length;
  const activeRecurring = recurringExpenses.filter((r: any) => r.active).length;

  return (
    <section className="analytics-section">
      <div className="section-header">
        <span className="section-label">
          <i className="fa-solid fa-bullseye" style={{ color: 'var(--orange)', marginRight: 6 }} />
          Goals & Tagihan Rutin
        </span>
      </div>
      <button className="goals-teaser-card" onClick={onNavigate}>
        <div className="goals-teaser-stats">
          <div className="goals-teaser-stat">
            <div className="goals-teaser-num">{activeGoals}</div>
            <div className="goals-teaser-label">Savings Goals</div>
          </div>
          <div className="goals-teaser-divider" />
          <div className="goals-teaser-stat">
            <div className="goals-teaser-num" style={{ color: 'var(--green-light)' }}>{completedGoals}</div>
            <div className="goals-teaser-label">Tercapai</div>
          </div>
          <div className="goals-teaser-divider" />
          <div className="goals-teaser-stat">
            <div className="goals-teaser-num" style={{ color: 'var(--blue-light)' }}>{activeRecurring}</div>
            <div className="goals-teaser-label">Tagihan Aktif</div>
          </div>
        </div>
        <div className="goals-teaser-cta">
          <span>Lihat & kelola goals</span>
          <i className="fa-solid fa-arrow-right" />
        </div>
      </button>
    </section>
  );
}

// ─── Income Stream Teaser Card ────────────────────────────────────────────
function IncomeStreamTeaser({ monthTx, totalIncome, onNavigate }: {
  monthTx: Transaction[];
  totalIncome: number;
  onNavigate: () => void;
}) {
  const incomeTx = monthTx.filter(t => t.type === 'income');
  const streamCount = new Set(incomeTx.map(t => t.category ?? 'lainnya')).size;
  const avgPerTx = incomeTx.length > 0 ? Math.round(totalIncome / incomeTx.length) : 0;

  return (
    <section className="analytics-section">
      <div className="section-header">
        <span className="section-label">
          <i className="fa-solid fa-money-bill-trend-up" style={{ color: 'var(--green-light)', marginRight: 6 }} />
          Stream Pemasukkan
        </span>
      </div>
      <button className="goals-teaser-card" onClick={onNavigate}>
        <div className="goals-teaser-stats">
          <div className="goals-teaser-stat">
            <div className="goals-teaser-num">{incomeTx.length}</div>
            <div className="goals-teaser-label">Transaksi</div>
          </div>
          <div className="goals-teaser-divider" />
          <div className="goals-teaser-stat">
            <div className="goals-teaser-num" style={{ color: 'var(--blue-light)' }}>{streamCount}</div>
            <div className="goals-teaser-label">Sumber</div>
          </div>
          <div className="goals-teaser-divider" />
          <div className="goals-teaser-stat">
            <div className="goals-teaser-num" style={{ color: 'var(--green-light)', fontSize: 15 }}>{formatRupiahShort(avgPerTx)}</div>
            <div className="goals-teaser-label">Rata-rata</div>
          </div>
        </div>
        <div className="goals-teaser-cta">
          <span>Lihat detail stream pemasukkan</span>
          <i className="fa-solid fa-arrow-right" />
        </div>
      </button>
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const { transactions, savingsGoals, recurringExpenses } = useWallet();
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
    if (isCurrentMonth) return;
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const { start, end } = getMonthRange(year, month);
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  const monthTx = useMemo<Transaction[]>(
    () => transactions.filter(tx => tx.date >= start && tx.date <= end),
    [transactions, start, end]
  );

  const totalIncome = useMemo(() => monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), [monthTx]);
  const totalExpense = useMemo(() => monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [monthTx]);
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  // Income breakdown by category
  const incomeSegments: Segment[] = useMemo(() => {
    const map: Record<string, number> = {};
    for (const tx of monthTx) {
      if (tx.type !== 'income') continue;
      const key = tx.category ?? 'lainnya';
      map[key] = (map[key] ?? 0) + tx.amount;
    }
    return Object.entries(map).map(([key, value]) => {
      const cat = getIncomeCategory(key);
      return { label: cat.label, value, color: cat.color };
    }).sort((a, b) => b.value - a.value);
  }, [monthTx]);

  // Expense breakdown by category
  const expenseSegments: Segment[] = useMemo(() => {
    const map: Record<string, number> = {};
    for (const tx of monthTx) {
      if (tx.type !== 'expense') continue;
      const key = tx.category ?? 'lainnya';
      map[key] = (map[key] ?? 0) + tx.amount;
    }
    return Object.entries(map).map(([key, value]) => {
      const cat = getExpenseCategory(key);
      return { label: cat.label, value, color: cat.color };
    }).sort((a, b) => b.value - a.value);
  }, [monthTx]);

  // 4-month trend
  const trendBars: MonthBar[] = useMemo(() => {
    const bars: MonthBar[] = [];
    for (let i = 3; i >= 0; i--) {
      let m = month - i;
      let y = year;
      while (m < 0) { m += 12; y--; }
      const { start: s, end: e } = getMonthRange(y, m);
      const inc = transactions.filter(t => t.type === 'income' && t.date >= s && t.date <= e).reduce((sum, t) => sum + t.amount, 0);
      const exp = transactions.filter(t => t.type === 'expense' && t.date >= s && t.date <= e).reduce((sum, t) => sum + t.amount, 0);
      const shortLabel = new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(new Date(y, m, 1));
      bars.push({ label: shortLabel, income: inc, expense: exp });
    }
    return bars;
  }, [transactions, month, year]);

  return (
    <>
      <header className="page-header">
        <div>
          <div className="header-greeting">Ringkasan</div>
          <div className="header-name"><span className="header-name-brand">Analitik</span></div>
        </div>
      </header>

      {/* Month Selector */}
      <section style={{ padding: '0 16px 16px' }}>
        <div className="month-selector">
          <button className="month-nav-btn" onClick={prevMonth}><i className="fa-solid fa-chevron-left" /></button>
          <span className="month-label">{getMonthLabel(year, month)}</span>
          <button className="month-nav-btn" onClick={nextMonth} disabled={isCurrentMonth}>
            <i className="fa-solid fa-chevron-right" style={{ opacity: isCurrentMonth ? 0.3 : 1 }} />
          </button>
        </div>
      </section>

      {/* Summary Cards */}
      <section style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <div className="stat-card stat-card-income">
          <div className="stat-card-label"><i className="fa-solid fa-arrow-trend-up" /> Pemasukkan</div>
          <div className="stat-card-amount">{formatRupiahShort(totalIncome)}</div>
        </div>
        <div className="stat-card stat-card-expense">
          <div className="stat-card-label"><i className="fa-solid fa-arrow-trend-down" /> Pengeluaran</div>
          <div className="stat-card-amount">{formatRupiahShort(totalExpense)}</div>
        </div>
        <div className="stat-card stat-card-net" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="stat-card-label"><i className="fa-solid fa-piggy-bank" /> Net Savings</div>
              <div className="stat-card-amount" style={{ color: netSavings >= 0 ? 'var(--green-light)' : 'var(--red)' }}>
                {netSavings >= 0 ? '+' : ''}{formatRupiahShort(netSavings)}
              </div>
            </div>
            <div className="savings-rate-badge" style={{ background: savingsRate >= 30 ? 'rgba(0,201,128,0.15)' : savingsRate >= 0 ? 'rgba(245,158,11,0.15)' : 'rgba(220,60,60,0.15)' }}>
              <span style={{ color: savingsRate >= 30 ? 'var(--green-light)' : savingsRate >= 0 ? '#b45309' : 'var(--red)', fontWeight: 700, fontSize: 22 }}>
                {savingsRate}%
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>saving rate</span>
            </div>
          </div>
        </div>
      </section>

      {/* Income Breakdown */}
      {totalIncome > 0 && (
        <section className="analytics-section">
          <div className="section-header"><span className="section-label"><i className="fa-solid fa-arrow-trend-up" style={{ color: 'var(--green-light)', marginRight: 6 }} />Sumber Pemasukkan</span></div>
          <div className="chart-card">
            <div className="chart-row">
              <DonutChart segments={incomeSegments} total={totalIncome} />
              <div className="chart-legend">
                {incomeSegments.map(s => (
                  <div key={s.label} className="legend-item">
                    <div className="legend-dot" style={{ background: s.color }} />
                    <div className="legend-info">
                      <div className="legend-label">{s.label}</div>
                      <div className="legend-value">{formatRupiahShort(s.value)}</div>
                    </div>
                    <div className="legend-pct">{Math.round(s.value / totalIncome * 100)}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Expense Breakdown */}
      {totalExpense > 0 && (
        <section className="analytics-section">
          <div className="section-header"><span className="section-label"><i className="fa-solid fa-arrow-trend-down" style={{ color: 'var(--red)', marginRight: 6 }} />Breakdown Pengeluaran</span></div>
          <div className="chart-card">
            <div className="chart-row">
              <DonutChart segments={expenseSegments} total={totalExpense} />
              <div className="chart-legend">
                {expenseSegments.map(s => (
                  <div key={s.label} className="legend-item">
                    <div className="legend-dot" style={{ background: s.color }} />
                    <div className="legend-info">
                      <div className="legend-label">{s.label}</div>
                      <div className="legend-value">{formatRupiahShort(s.value)}</div>
                    </div>
                    <div className="legend-pct">{Math.round(s.value / totalExpense * 100)}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {totalIncome === 0 && totalExpense === 0 && (
        <div className="empty-state" style={{ margin: '32px 16px' }}>
          <div className="empty-state-icon"><i className="fa-regular fa-chart-bar" /></div>
          <div className="empty-state-text">Belum ada transaksi</div>
          <div className="empty-state-sub">Mulai catat pemasukkan & pengeluaranmu</div>
        </div>
      )}

      {/* 4-Month Trend */}
      <section className="analytics-section">
        <div className="section-header"><span className="section-label"><i className="fa-solid fa-chart-column" style={{ color: 'var(--orange)', marginRight: 6 }} />Tren 4 Bulan</span></div>
        <div className="chart-card">
          <div className="bar-legend">
            <span className="bar-legend-item"><span className="bar-dot" style={{ background: 'var(--green-light)' }} />Income</span>
            <span className="bar-legend-item"><span className="bar-dot" style={{ background: 'var(--red)' }} />Expense</span>
          </div>
          <BarChart bars={trendBars} />
        </div>
      </section>

      {/* Income Stream Teaser */}
      <IncomeStreamTeaser
        monthTx={monthTx}
        totalIncome={totalIncome}
        onNavigate={() => router.push('/app/incomes')}
      />

      {/* Goals Teaser */}
      <GoalsTeaser
        savingsGoals={savingsGoals}
        recurringExpenses={recurringExpenses}
        onNavigate={() => router.push('/app/goals')}
      />

      <div style={{ height: 24 }} />
    </>
  );
}