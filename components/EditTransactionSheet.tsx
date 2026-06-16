'use client';

import '@/styles/sheet.css';
import '@/styles/edit-sheet.css';
import { useState, useRef, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import { Transaction, IncomeCategory, ExpenseCategory, IncomePeriod } from '@/lib/types';
import { formatRupiah, parseAmountInput, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@/lib/utils';

interface Props {
  tx: Transaction;
  onClose: () => void;
}

type Step = 'edit' | 'confirmDelete' | 'success';

export default function EditTransactionSheet({ tx, onClose }: Props) {
  const { updateTransaction, deleteTransaction } = useWallet();
  const [step, setStep] = useState<Step>('edit');
  const [rawAmount, setRawAmount] = useState(tx.amount.toLocaleString('id-ID'));
  const [note, setNote] = useState(tx.note ?? '');
  const [category, setCategory] = useState<string>(tx.category ?? 'lainnya');
  const [period, setPeriod] = useState<IncomePeriod>(tx.period ?? 'harian');
  const [date, setDate] = useState(tx.date);
  const [successMsg, setSuccessMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const amount = parseAmountInput(rawAmount);
  const isTransfer = tx.type === 'transfer_in' || tx.type === 'transfer_out';
  const isIncome = tx.type === 'income';
  const isExpense = tx.type === 'expense';

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const cleaned = e.target.value.replace(/[^\d]/g, '');
    if (cleaned === '') { setRawAmount(''); return; }
    const num = parseInt(cleaned, 10);
    if (!isNaN(num)) setRawAmount(num.toLocaleString('id-ID'));
  }

  function handleSave() {
    if (amount <= 0) return;
    updateTransaction(tx.id, {
      amount,
      note: note.trim() || undefined,
      category: (isIncome || isExpense) ? (category as IncomeCategory | ExpenseCategory) : undefined,
      period: isIncome ? period : undefined,
      date,
    });
    setSuccessMsg('Transaksi berhasil diperbarui');
    setStep('success');
    setTimeout(() => onClose(), 1500);
  }

  function handleDelete() {
    deleteTransaction(tx.id);
    setSuccessMsg('Transaksi berhasil dihapus');
    setStep('success');
    setTimeout(() => onClose(), 1500);
  }

  let typeLabel = '';
  if (isIncome) typeLabel = 'Pemasukkan';
  else if (isExpense) typeLabel = 'Pengeluaran';
  else if (tx.type === 'transfer_in') typeLabel = 'Transfer Masuk';
  else typeLabel = 'Transfer Keluar';

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-handle" />

        {/* EDIT */}
        {step === 'edit' && (
          <div className="sheet-body">
            <div className="sheet-header">
              <button className="sheet-close" onClick={onClose}><i className="fa-solid fa-xmark" /></button>
              <h2 className="sheet-title">Edit Transaksi</h2>
              <div style={{ width: 36 }} />
            </div>
            <p className="sheet-subtitle">{typeLabel}</p>

            <div className="form-group">
              <label className="form-label">Jumlah</label>
              <div className="amount-input-wrapper">
                <span className="amount-prefix">Rp</span>
                <input ref={inputRef} type="text" inputMode="numeric" className="amount-input"
                  placeholder="0" value={rawAmount} onChange={handleAmountChange} />
              </div>
            </div>

            {isIncome && (
              <div className="form-group">
                <label className="form-label">Sumber Income</label>
                <div className="cat-grid">
                  {INCOME_CATEGORIES.map(cat => (
                    <button key={cat.key} type="button"
                      className={`cat-chip ${category === cat.key ? 'cat-chip-active' : ''}`}
                      style={category === cat.key ? { '--chip-color': cat.color } as React.CSSProperties : {}}
                      onClick={() => setCategory(cat.key)}>
                      <i className={`fa-solid ${cat.icon}`} style={{ color: category === cat.key ? '#fff' : cat.color }} />
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isExpense && (
              <div className="form-group">
                <label className="form-label">Kategori</label>
                <div className="cat-grid">
                  {EXPENSE_CATEGORIES.map(cat => (
                    <button key={cat.key} type="button"
                      className={`cat-chip ${category === cat.key ? 'cat-chip-active' : ''}`}
                      style={category === cat.key ? { '--chip-color': cat.color } as React.CSSProperties : {}}
                      onClick={() => setCategory(cat.key)}>
                      <i className={`fa-solid ${cat.icon}`} style={{ color: category === cat.key ? '#fff' : cat.color }} />
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isIncome && (
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
            )}

            {(isIncome || isExpense) && (
              <div className="form-group">
                <label className="form-label">Keterangan <span className="label-optional">(opsional)</span></label>
                <input type="text" className="text-input"
                  placeholder="Keterangan transaksi..."
                  value={note} onChange={(e) => setNote(e.target.value)} maxLength={60} />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Tanggal</label>
              <input type="date" className="text-input"
                value={date} onChange={(e) => setDate(e.target.value)} />
            </div>

            {isTransfer && (
              <div className="edit-transfer-note">
                <i className="fa-solid fa-circle-info" />
                Mengubah nominal transfer akan menyesuaikan ulang saldo kedua dompet.
              </div>
            )}

            <div className="amount-preview" style={{ background: 'var(--brand-subtle)', borderColor: 'rgba(91, 106, 240, 0.20)' }}>
              <span className="preview-label"><i className="fa-solid fa-coins" /> Nominal baru</span>
              <span className="preview-amount">{formatRupiah(amount)}</span>
            </div>

            <button className="btn-primary" onClick={handleSave} disabled={amount <= 0}>
              Simpan Perubahan
            </button>
            <button className="btn-danger-outline" onClick={() => setStep('confirmDelete')}>
              <i className="fa-solid fa-trash" /> Hapus Transaksi
            </button>
            <button className="btn-ghost" onClick={onClose}>Batal</button>
          </div>
        )}

        {/* CONFIRM DELETE */}
        {step === 'confirmDelete' && (
          <div className="sheet-body">
            <div className="sheet-header">
              <button className="sheet-close" onClick={() => setStep('edit')}><i className="fa-solid fa-chevron-left" /></button>
              <h2 className="sheet-title">Hapus Transaksi</h2>
              <div style={{ width: 36 }} />
            </div>

            <div className="delete-confirm-icon"><i className="fa-solid fa-triangle-exclamation" /></div>
            <p className="delete-confirm-text">
              Yakin ingin menghapus transaksi <strong>{typeLabel.toLowerCase()}</strong> sebesar <strong>{formatRupiah(tx.amount)}</strong> ini?
            </p>
            <p className="delete-confirm-sub">
              Saldo akan otomatis disesuaikan kembali. Tindakan ini tidak bisa dibatalkan.
            </p>

            <button className="btn-primary btn-danger" onClick={handleDelete}>
              Ya, Hapus Transaksi
            </button>
            <button className="btn-ghost" onClick={() => setStep('edit')}>Batal</button>
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
