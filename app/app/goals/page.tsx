'use client';

import '@/styles/goals.css';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/context/WalletContext';
import {
  formatRupiah, formatRupiahShort, parseAmountInput,
  getExpenseCategory, EXPENSE_CATEGORIES,
  getNextDueDate, getDaysUntil, recurringFrequencyLabel,
} from '@/lib/utils';
import { ExpenseCategory, RecurringExpense, SavingsGoal } from '@/lib/types';

const GOAL_EMOJIS = ['🎯', '🏠', '🚗', '📱', '✈️', '💊', '📈', '💍', '🎓', '💰'];

// ─── Goal Progress Bar ────────────────────────────────────────────────────
function GoalCard({
  goal, onUpdateAmount, onDelete,
}: { goal: SavingsGoal; onUpdateAmount: (id: string, amt: number) => void; onDelete: (id: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [rawAmt, setRawAmt] = useState('');
  const pct = Math.min(100, goal.targetAmount > 0 ? Math.round(goal.currentAmount / goal.targetAmount * 100) : 0);
  const remaining = goal.targetAmount - goal.currentAmount;

  function handleAmtChange(e: React.ChangeEvent<HTMLInputElement>) {
    const cleaned = e.target.value.replace(/[^\d]/g, '');
    if (!cleaned) { setRawAmt(''); return; }
    setRawAmt(parseInt(cleaned, 10).toLocaleString('id-ID'));
  }

  function handleSave() {
    const amt = parseAmountInput(rawAmt);
    if (amt >= 0) onUpdateAmount(goal.id, amt);
    setEditing(false);
    setRawAmt('');
  }

  const isComplete = pct >= 100;

  return (
    <div className={`goal-card ${isComplete ? 'goal-card--complete' : ''}`}>
      <div className="goal-card-top">
        <div className="goal-emoji">{goal.emoji}</div>
        <div className="goal-info">
          <div className="goal-label">{goal.label}</div>
          {goal.deadline ? (
            <div className="goal-deadline">
              <i className="fa-regular fa-calendar" /> {new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(goal.deadline + 'T00:00:00'))}
            </div>
          ) : (
            <div className="goal-deadline goal-deadline-muted">
              <i className="fa-regular fa-clock" /> Tanpa deadline
            </div>
          )}
        </div>
        {isComplete && (
          <div className="goal-complete-badge"><i className="fa-solid fa-check" /></div>
        )}
        <button className="goal-delete-btn" onClick={() => onDelete(goal.id)}><i className="fa-solid fa-trash" /></button>
      </div>

      <div className="goal-progress-track">
        <div className="goal-progress-bar" style={{ width: `${pct}%`, background: isComplete ? 'linear-gradient(90deg, var(--green-light), var(--green))' : 'linear-gradient(90deg, var(--brand-light), var(--brand))' }} />
      </div>

      <div className="goal-progress-labels">
        <span className="goal-current">{formatRupiahShort(goal.currentAmount)}</span>
        <span className="goal-pct" style={{ color: isComplete ? 'var(--green-light)' : 'var(--text-3)' }}>{pct}%</span>
        <span className="goal-target">{formatRupiahShort(goal.targetAmount)}</span>
      </div>

      {!isComplete ? (
        <div className="goal-remaining">
          Sisa <strong>{formatRupiahShort(remaining)}</strong> lagi
        </div>
      ) : (
        <div className="goal-remaining goal-remaining--done">
          🎉 Goal tercapai!
        </div>
      )}

      {editing ? (
        <div className="goal-edit-row">
          <div className="amount-input-wrapper" style={{ flex: 1 }}>
            <span className="amount-prefix" style={{ fontSize: 14 }}>Rp</span>
            <input type="text" inputMode="numeric" className="amount-input" style={{ fontSize: 14 }}
              placeholder="0" value={rawAmt} onChange={handleAmtChange} autoFocus />
          </div>
          <button className="goal-save-btn" onClick={handleSave}>Simpan</button>
          <button className="goal-cancel-btn" onClick={() => setEditing(false)}>Batal</button>
        </div>
      ) : (
        <button className="goal-update-btn" onClick={() => { setEditing(true); setRawAmt(goal.currentAmount.toLocaleString('id-ID')); }}>
          <i className="fa-solid fa-pen" /> Update Progres
        </button>
      )}
    </div>
  );
}

// ─── Recurring Item ───────────────────────────────────────────────────────
function RecurringItem({
  rec, onToggle, onDelete,
}: { rec: RecurringExpense; onToggle: (id: string) => void; onDelete: (id: string) => void }) {
  const cat = getExpenseCategory(rec.category);
  const nextDue = getNextDueDate(rec);
  const daysUntil = getDaysUntil(nextDue);
  const urgency = daysUntil === 0 ? 'now' : daysUntil <= 3 ? 'soon' : 'normal';
  const urgencyLabel = daysUntil === 0 ? '⚡ Hari ini' : daysUntil === 1 ? '⚠️ Besok' : `${daysUntil} hari lagi`;

  return (
    <div className={`recurring-item ${!rec.active ? 'recurring-inactive' : ''}`}>
      <div className="recurring-icon" style={{ background: cat.color + '1A', color: cat.color }}>
        <i className={`fa-solid ${cat.icon}`} />
      </div>
      <div className="recurring-info">
        <div className="recurring-label">{rec.label}</div>
        <div className="recurring-meta">
          <span className="recurring-freq">{recurringFrequencyLabel(rec)}</span>
          <span className={`urgency-badge urgency-${urgency}`}>{urgencyLabel}</span>
        </div>
      </div>
      <div className="recurring-right">
        <div className="recurring-amount">{formatRupiahShort(rec.amount)}</div>
        <div className="recurring-actions">
          <button className={`rec-toggle-btn ${rec.active ? 'active' : ''}`} onClick={() => onToggle(rec.id)}>
            {rec.active ? 'Aktif' : 'Nonaktif'}
          </button>
          <button className="rec-delete-btn" onClick={() => onDelete(rec.id)}><i className="fa-solid fa-xmark" /></button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Goal Sheet ───────────────────────────────────────────────────────
function AddGoalSheet({ onClose, onAdd }: { onClose: () => void; onAdd: (data: Omit<SavingsGoal, 'id' | 'createdAt'>) => void }) {
  const [label, setLabel] = useState('');
  const [rawTarget, setRawTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [emoji, setEmoji] = useState('🎯');

  function handleTargetChange(e: React.ChangeEvent<HTMLInputElement>) {
    const cleaned = e.target.value.replace(/[^\d]/g, '');
    if (!cleaned) { setRawTarget(''); return; }
    setRawTarget(parseInt(cleaned, 10).toLocaleString('id-ID'));
  }

  function handleSubmit() {
    if (!label.trim() || !rawTarget) return;
    onAdd({ label: label.trim(), targetAmount: parseAmountInput(rawTarget), currentAmount: 0, deadline: deadline || undefined, emoji });
    onClose();
  }

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-handle" />
        <div className="sheet-body">
          <div className="sheet-header">
            <button className="sheet-close" onClick={onClose}><i className="fa-solid fa-xmark" /></button>
            <h2 className="sheet-title">Tambah Goal</h2>
            <div style={{ width: 36 }} />
          </div>

          <div className="form-group">
            <label className="form-label">Pilih Emoji</label>
            <div className="emoji-grid">
              {GOAL_EMOJIS.map(e => (
                <button key={e} type="button" className={`emoji-btn ${emoji === e ? 'emoji-btn-active' : ''}`} onClick={() => setEmoji(e)}>{e}</button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nama Goal</label>
            <input type="text" className="text-input" placeholder="Contoh: Dana Darurat, ETF, dll"
              value={label} onChange={e => setLabel(e.target.value)} maxLength={40} />
          </div>

          <div className="form-group">
            <label className="form-label">Target Nominal</label>
            <div className="amount-input-wrapper">
              <span className="amount-prefix">Rp</span>
              <input type="text" inputMode="numeric" className="amount-input"
                placeholder="0" value={rawTarget} onChange={handleTargetChange} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Deadline <span className="label-optional">(opsional)</span></label>
            <input type="date" className="text-input" value={deadline} onChange={e => setDeadline(e.target.value)} />
          </div>

          <button className="btn-primary" onClick={handleSubmit} disabled={!label.trim() || !rawTarget}>Simpan Goal</button>
          <button className="btn-ghost" onClick={onClose}>Batal</button>
        </div>
      </div>
    </>
  );
}

// ─── Add Recurring Sheet ──────────────────────────────────────────────────
function AddRecurringSheet({ onClose, onAdd }: { onClose: () => void; onAdd: (data: Omit<RecurringExpense, 'id' | 'createdAt'>) => void }) {
  const [label, setLabel] = useState('');
  const [rawAmount, setRawAmount] = useState('');
  const [frequency, setFrequency] = useState<'weekly' | 'monthly'>('monthly');
  const [dueDay, setDueDay] = useState(1);
  const [category, setCategory] = useState<ExpenseCategory>('lainnya');

  function handleAmtChange(e: React.ChangeEvent<HTMLInputElement>) {
    const cleaned = e.target.value.replace(/[^\d]/g, '');
    if (!cleaned) { setRawAmount(''); return; }
    setRawAmount(parseInt(cleaned, 10).toLocaleString('id-ID'));
  }

  function handleSubmit() {
    if (!label.trim() || !rawAmount) return;
    onAdd({ label: label.trim(), amount: parseAmountInput(rawAmount), frequency, dueDay, category, active: true });
    onClose();
  }

  const dayOptions = frequency === 'monthly'
    ? Array.from({ length: 28 }, (_, i) => ({ value: i + 1, label: `Tanggal ${i + 1}` }))
    : [
        { value: 1, label: 'Senin' }, { value: 2, label: 'Selasa' }, { value: 3, label: 'Rabu' },
        { value: 4, label: 'Kamis' }, { value: 5, label: "Jum'at" }, { value: 6, label: 'Sabtu' }, { value: 7, label: 'Minggu' },
      ];

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-handle" />
        <div className="sheet-body">
          <div className="sheet-header">
            <button className="sheet-close" onClick={onClose}><i className="fa-solid fa-xmark" /></button>
            <h2 className="sheet-title">Tagihan Rutin</h2>
            <div style={{ width: 36 }} />
          </div>

          <div className="form-group">
            <label className="form-label">Nama Tagihan</label>
            <input type="text" className="text-input" placeholder="Contoh: Bensin, Utang, dll"
              value={label} onChange={e => setLabel(e.target.value)} maxLength={40} />
          </div>

          <div className="form-group">
            <label className="form-label">Nominal</label>
            <div className="amount-input-wrapper">
              <span className="amount-prefix">Rp</span>
              <input type="text" inputMode="numeric" className="amount-input"
                placeholder="0" value={rawAmount} onChange={handleAmtChange} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Kategori</label>
            <div className="cat-grid">
              {EXPENSE_CATEGORIES.map(cat => (
                <button key={cat.key} type="button"
                  className={`cat-chip ${category === cat.key ? 'cat-chip-active' : ''}`}
                  style={category === cat.key ? { '--chip-color': cat.color } as React.CSSProperties : {}}
                  onClick={() => setCategory(cat.key as ExpenseCategory)}>
                  <i className={`fa-solid ${cat.icon}`} style={{ color: category === cat.key ? '#fff' : cat.color }} />
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Frekuensi</label>
            <div className="period-tabs">
              <button className={`period-tab ${frequency === 'monthly' ? 'active' : ''}`} type="button"
                onClick={() => { setFrequency('monthly'); setDueDay(1); }}>
                <i className="fa-regular fa-calendar" /> Bulanan
              </button>
              <button className={`period-tab ${frequency === 'weekly' ? 'active' : ''}`} type="button"
                onClick={() => { setFrequency('weekly'); setDueDay(1); }}>
                <i className="fa-solid fa-rotate" /> Mingguan
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Jatuh Tempo</label>
            <select className="text-input" value={dueDay} onChange={e => setDueDay(Number(e.target.value))}>
              {dayOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <button className="btn-primary" onClick={handleSubmit} disabled={!label.trim() || !rawAmount}>Simpan Tagihan</button>
          <button className="btn-ghost" onClick={onClose}>Batal</button>
        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────
export default function GoalsPage() {
  const { savingsGoals, recurringExpenses, saldoPegangan, addGoal, updateGoalAmount, deleteGoal, addRecurring, toggleRecurring, deleteRecurring } = useWallet();
  const router = useRouter();
  const [showGoalSheet, setShowGoalSheet] = useState(false);
  const [showRecurringSheet, setShowRecurringSheet] = useState(false);

  const activeRecurring = recurringExpenses.filter(r => r.active);
  const totalMonthlyObligation = recurringExpenses
    .filter(r => r.active && r.frequency === 'monthly')
    .reduce((s, r) => s + r.amount, 0);
  const totalWeeklyObligation = recurringExpenses
    .filter(r => r.active && r.frequency === 'weekly')
    .reduce((s, r) => s + r.amount, 0);

  // Sort recurring by next due date
  const sortedRecurring = [...recurringExpenses].sort((a, b) => {
    const da = getNextDueDate(a);
    const db = getNextDueDate(b);
    return da < db ? -1 : da > db ? 1 : 0;
  });

  const totalSaved = savingsGoals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = savingsGoals.reduce((s, g) => s + g.targetAmount, 0);
  const overallPct = totalTarget > 0 ? Math.min(100, Math.round(totalSaved / totalTarget * 100)) : 0;

  return (
    <>
      {/* Header with back button */}
      <header className="page-header goals-header">
        <button className="goals-back-btn" onClick={() => router.push('/app/analytics')}>
          <i className="fa-solid fa-chevron-left" />
        </button>
        <div>
          <div className="header-greeting">Pantau</div>
          <div className="header-name"><span className="header-name-brand">Goals & Tagihan</span></div>
        </div>
        <div style={{ width: 36 }} />
      </header>

      {/* Overall savings summary */}
      {savingsGoals.length > 0 && (
        <section style={{ padding: '0 16px 16px' }}>
          <div className="goals-summary-card">
            <div className="goals-summary-text">
              <div className="goals-summary-label">Total Terkumpul</div>
              <div className="goals-summary-amount">{formatRupiahShort(totalSaved)}</div>
              <div className="goals-summary-target">dari target {formatRupiahShort(totalTarget)}</div>
            </div>
            <div className="goals-summary-ring">
              <svg viewBox="0 0 64 64" className="goals-summary-ring-svg">
                <circle cx="32" cy="32" r="28" className="goals-summary-ring-track" />
                <circle cx="32" cy="32" r="28" className="goals-summary-ring-fill"
                  strokeDasharray={`${overallPct * 1.759} 1000`} />
              </svg>
              <div className="goals-summary-ring-label">{overallPct}%</div>
            </div>
          </div>
        </section>
      )}

      {/* Obligation overview */}
      {activeRecurring.length > 0 && (
        <section style={{ padding: '0 16px 16px' }}>
          <div className="obligation-card">
            <div className="obligation-title"><i className="fa-solid fa-file-invoice-dollar" /> Kewajiban Rutin</div>
            <div className="obligation-grid">
              {totalMonthlyObligation > 0 && (
                <div className="obligation-item">
                  <div className="obligation-label">Per Bulan</div>
                  <div className="obligation-amount">{formatRupiahShort(totalMonthlyObligation)}</div>
                </div>
              )}
              {totalWeeklyObligation > 0 && (
                <div className="obligation-item">
                  <div className="obligation-label">Per Minggu</div>
                  <div className="obligation-amount">{formatRupiahShort(totalWeeklyObligation)}</div>
                </div>
              )}
              <div className="obligation-item">
                <div className="obligation-label">Saldo Pegangan</div>
                <div className="obligation-amount" style={{ color: saldoPegangan >= totalMonthlyObligation ? 'var(--green-light)' : 'var(--red)' }}>
                  {formatRupiahShort(saldoPegangan)}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Savings Goals */}
      <section className="analytics-section">
        <div className="section-header" style={{ justifyContent: 'space-between' }}>
          <span className="section-label"><i className="fa-solid fa-bullseye" style={{ color: 'var(--orange)', marginRight: 6 }} />Savings Goals</span>
          <button className="add-section-btn" onClick={() => setShowGoalSheet(true)}>
            <i className="fa-solid fa-plus" /> Tambah
          </button>
        </div>

        {savingsGoals.length === 0 ? (
          <div className="empty-state" style={{ margin: '16px 0' }}>
            <div className="empty-state-icon"><i className="fa-solid fa-bullseye" /></div>
            <div className="empty-state-text">Belum ada goal</div>
            <div className="empty-state-sub">Set target biar makin termotivasi!</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {savingsGoals.map(goal => (
              <GoalCard key={goal.id} goal={goal} onUpdateAmount={updateGoalAmount} onDelete={deleteGoal} />
            ))}
          </div>
        )}
      </section>

      {/* Recurring Expenses */}
      <section className="analytics-section">
        <div className="section-header" style={{ justifyContent: 'space-between' }}>
          <span className="section-label"><i className="fa-solid fa-rotate" style={{ color: 'var(--blue-from)', marginRight: 6 }} />Tagihan Rutin</span>
          <button className="add-section-btn" onClick={() => setShowRecurringSheet(true)}>
            <i className="fa-solid fa-plus" /> Tambah
          </button>
        </div>

        {recurringExpenses.length === 0 ? (
          <div className="empty-state" style={{ margin: '16px 0' }}>
            <div className="empty-state-icon"><i className="fa-solid fa-file-invoice" /></div>
            <div className="empty-state-text">Belum ada tagihan rutin</div>
            <div className="empty-state-sub">Tambahkan bensin, utang, dll biar ga lupa</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sortedRecurring.map(rec => (
              <RecurringItem key={rec.id} rec={rec} onToggle={toggleRecurring} onDelete={deleteRecurring} />
            ))}
          </div>
        )}
      </section>

      <div style={{ height: 24 }} />

      {showGoalSheet && <AddGoalSheet onClose={() => setShowGoalSheet(false)} onAdd={addGoal} />}
      {showRecurringSheet && <AddRecurringSheet onClose={() => setShowRecurringSheet(false)} onAdd={addRecurring} />}
    </>
  );
}