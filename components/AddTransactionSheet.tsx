'use client';

import '@/styles/sheet.css';
import { useState, useRef, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import { IncomePeriod, IncomeCategory, ExpenseCategory, WalletType } from '@/lib/types';
import { formatRupiah, parseAmountInput, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@/lib/utils';

type Step = 'choose' | 'income' | 'expense' | 'success';

interface Props { onClose: () => void; }

export default function AddTransactionSheet({ onClose }: Props) {
  const { addIncome, addExpense, saldoPegangan, saldoTabungan } = useWallet();
  const [step, setStep] = useState<Step>('choose');
  const [rawAmount, setRawAmount] = useState('');
  const [period, setPeriod] = useState<IncomePeriod>('harian');
  const [incomeCategory, setIncomeCategory] = useState<IncomeCategory>('lainnya');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('lainnya');
  const [expenseWallet, setExpenseWallet] = useState<WalletType>('pegangan');
  const [note, setNote] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 'income' || step === 'expense') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [step]);

  const amount = parseAmountInput(rawAmount);

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const cleaned = e.target.value.replace(/[^\d]/g, '');
    if (cleaned === '') { setRawAmount(''); return; }
    const num = parseInt(cleaned, 10);
    if (!isNaN(num)) setRawAmount(num.toLocaleString('id-ID'));
  }

  function handleSubmit() {
    if (amount <= 0) return;
    if (step === 'income') {
      addIncome(amount, period, incomeCategory);
      setSuccessMsg(`${formatRupiah(amount)} ditambahkan ke Saldo Pegangan`);
    } else if (step === 'expense') {
      const noteText = note.trim() || EXPENSE_CATEGORIES.find(c => c.key === expenseCategory)?.label || 'Pengeluaran';
      addExpense(amount, noteText, expenseCategory, expenseWallet);
      const walletLabel = expenseWallet === 'tabungan' ? 'Saldo Tabungan' : 'Saldo Pegangan';
      setSuccessMsg(`${formatRupiah(amount)} dikurangi dari ${walletLabel}`);
    }
    setStep('success');
    setTimeout(() => onClose(), 1800);
  }

  function handleBack() {
    setRawAmount(''); setNote(''); setExpenseWallet('pegangan');
    setStep('choose');
  }

  const insufficientBalance =
    step === 'expense' && amount > 0 &&
    amount > (expenseWallet === 'tabungan' ? saldoTabungan : saldoPegangan);

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-handle" />

        {/* CHOOSE */}
        {step === 'choose' && (
          <div className="sheet-body">
            <div className="sheet-header">
              <button className="sheet-close" onClick={onClose}><i className="fa-solid fa-xmark" /></button>
              <h2 className="sheet-title">Catat Transaksi</h2>
              <div style={{ width: 36 }} />
            </div>
            <p className="sheet-subtitle">Mau catat apa hari ini?</p>
            <div className="type-grid">
              <button className="type-card type-card-income" onClick={() => setStep('income')}>
                <div className="type-card-icon type-icon-income"><i className="fa-solid fa-arrow-trend-up" /></div>
                <div>
                  <div className="type-card-label">Pemasukkan</div>
                  <div className="type-card-sub">Hasil narik hari ini</div>
                </div>
              </button>
              <button className="type-card type-card-expense" onClick={() => setStep('expense')}>
                <div className="type-card-icon type-icon-expense"><i className="fa-solid fa-arrow-trend-down" /></div>
                <div>
                  <div className="type-card-label">Pengeluaran</div>
                  <div className="type-card-sub">Bensin, makan, dll</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* INCOME */}
        {step === 'income' && (
          <div className="sheet-body">
            <div className="sheet-header">
              <button className="sheet-close" onClick={handleBack}><i className="fa-solid fa-chevron-left" /></button>
              <h2 className="sheet-title">Pemasukkan</h2>
              <div style={{ width: 36 }} />
            </div>
            <p className="sheet-subtitle">Masukkan pendapatan kamu</p>

            <div className="form-group">
              <label className="form-label">Jumlah</label>
              <div className="amount-input-wrapper">
                <span className="amount-prefix">Rp</span>
                <input ref={inputRef} type="text" inputMode="numeric" className="amount-input"
                  placeholder="0" value={rawAmount} onChange={handleAmountChange} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Sumber Income</label>
              <div className="cat-grid">
                {INCOME_CATEGORIES.map(cat => (
                  <button key={cat.key} type="button"
                    className={`cat-chip ${incomeCategory === cat.key ? 'cat-chip-active' : ''}`}
                    style={incomeCategory === cat.key ? { '--chip-color': cat.color } as React.CSSProperties : {}}
                    onClick={() => setIncomeCategory(cat.key as IncomeCategory)}>
                    <i className={`fa-solid ${cat.icon}`} style={{ color: incomeCategory === cat.key ? '#fff' : cat.color }} />
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Periode</label>
              <div className="period-tabs">
                <button className={`period-tab ${period === 'harian' ? 'active' : ''}`}
                  onClick={() => setPeriod('harian')} type="button">
                  <i className="fa-solid fa-motorcycle" /> Harian
                </button>
                <button className={`period-tab ${period === 'bulanan' ? 'active' : ''}`}
                  onClick={() => setPeriod('bulanan')} type="button">
                  <i className="fa-regular fa-calendar" /> Bulanan
                </button>
              </div>
            </div>

            {amount > 0 && (
              <div className="amount-preview income-preview">
                <span className="preview-label"><i className="fa-solid fa-location-dot" /> {period === 'harian' ? 'Pemasukkan hari ini' : 'Pemasukkan bulan ini'}</span>
                <span className="preview-amount">+{formatRupiah(amount)}</span>
              </div>
            )}
            <button className="btn-primary" onClick={handleSubmit} disabled={amount <= 0}>Simpan Pemasukkan</button>
            <button className="btn-ghost" onClick={handleBack}>Batal</button>
          </div>
        )}

        {/* EXPENSE */}
        {step === 'expense' && (
          <div className="sheet-body">
            <div className="sheet-header">
              <button className="sheet-close" onClick={handleBack}><i className="fa-solid fa-chevron-left" /></button>
              <h2 className="sheet-title">Pengeluaran</h2>
              <div style={{ width: 36 }} />
            </div>
            <p className="sheet-subtitle">Catat pengeluaran kamu</p>

            <div className="form-group">
              <label className="form-label">Jumlah</label>
              <div className="amount-input-wrapper">
                <span className="amount-prefix">Rp</span>
                <input ref={inputRef} type="text" inputMode="numeric" className="amount-input"
                  placeholder="0" value={rawAmount} onChange={handleAmountChange} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Kategori</label>
              <div className="cat-grid">
                {EXPENSE_CATEGORIES.map(cat => (
                  <button key={cat.key} type="button"
                    className={`cat-chip ${expenseCategory === cat.key ? 'cat-chip-active' : ''}`}
                    style={expenseCategory === cat.key ? { '--chip-color': cat.color } as React.CSSProperties : {}}
                    onClick={() => setExpenseCategory(cat.key as ExpenseCategory)}>
                    <i className={`fa-solid ${cat.icon}`} style={{ color: expenseCategory === cat.key ? '#fff' : cat.color }} />
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Ambil dari Saldo</label>
              <div className="period-tabs">
                <button className={`period-tab ${expenseWallet === 'pegangan' ? 'active' : ''}`}
                  onClick={() => setExpenseWallet('pegangan')} type="button">
                  <i className="fa-solid fa-wallet" /> Pegangan
                </button>
                <button className={`period-tab ${expenseWallet === 'tabungan' ? 'active' : ''}`}
                  onClick={() => setExpenseWallet('tabungan')} type="button">
                  <i className="fa-solid fa-piggy-bank" /> Tabungan
                </button>
              </div>
              <p className="sheet-subtitle" style={{ margin: '6px 2px 0' }}>
                Saldo tersedia: {formatRupiah(expenseWallet === 'tabungan' ? saldoTabungan : saldoPegangan)}
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Keterangan <span className="label-optional">(opsional)</span></label>
              <input type="text" className="text-input"
                placeholder={`Contoh: ${EXPENSE_CATEGORIES.find(c => c.key === expenseCategory)?.label ?? 'Pengeluaran'}...`}
                value={note} onChange={(e) => setNote(e.target.value)} maxLength={60} />
            </div>

            {amount > 0 && (
              <div className="amount-preview expense-preview">
                <span className="preview-label">
                  <i className="fa-solid fa-money-bill-wave" />
                  Keluar dari Saldo {expenseWallet === 'tabungan' ? 'Tabungan' : 'Pegangan'}
                </span>
                <span className="preview-amount">-{formatRupiah(amount)}</span>
              </div>
            )}
            {insufficientBalance && (
              <p className="sheet-subtitle" style={{ color: 'var(--danger, #e5484d)', margin: '6px 2px 0' }}>
                <i className="fa-solid fa-triangle-exclamation" /> Saldo tidak mencukupi
              </p>
            )}
            <button className="btn-primary btn-danger" onClick={handleSubmit} disabled={amount <= 0}>Simpan Pengeluaran</button>
            <button className="btn-ghost" onClick={handleBack}>Batal</button>
          </div>
        )}

        {/* SUCCESS */}
        {step === 'success' && (
          <div className="sheet-body sheet-success">
            <div className="success-icon"><i className="fa-solid fa-circle-check" /></div>
            <h2 className="success-title">Berhasil!</h2>
            <p className="success-msg">{successMsg}</p>
          </div>
        )}
      </div>
    </>
  );
}