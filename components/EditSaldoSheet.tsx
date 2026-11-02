'use client';

import '@/styles/sheet.css';
import { useState, useRef, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import { haptics } from '@/lib/haptics';
import { nonCashTotal } from '@/lib/subBalance';
import { WalletType } from '@/lib/types';
import { formatRupiah, parseAmountInput } from '@/lib/utils';
import SheetPortal from './SheetPortal';

interface Props {
  wallet: WalletType;
  onClose: () => void;
}

const LABEL: Record<WalletType, string> = {
  pegangan: 'Saldo Pegangan',
  tabungan: 'Saldo Tabungan',
};

export default function EditSaldoSheet({ wallet, onClose }: Props) {
  const state = useWallet();
  const { editSaldo } = state;
  const current = wallet === 'pegangan' ? state.saldoPegangan : state.saldoTabungan;
  const minAmount = nonCashTotal(state, wallet);

  const [rawAmount, setRawAmount] = useState(current > 0 ? current.toLocaleString('id-ID') : '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.select(), 100);
    return () => clearTimeout(t);
  }, []);

  const amount = parseAmountInput(rawAmount);
  const canSave = rawAmount !== '' && (amount !== current || minAmount > 0);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const cleaned = e.target.value.replace(/[^\d]/g, '');
    setRawAmount(cleaned === '' ? '' : parseInt(cleaned, 10).toLocaleString('id-ID'));
  }

  function handleSave() {
    if (!canSave) return;
    editSaldo(wallet, amount);
    haptics.success();
    onClose();
  }

  return (
    <SheetPortal>
      <div className="overlay" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-handle" />
        <div className="sheet-body">
          <div className="sheet-header">
            <button className="sheet-close" onClick={onClose}><i className="fa-solid fa-xmark" /></button>
            <h2 className="sheet-title">Edit Nominal</h2>
            <div style={{ width: 36 }} />
          </div>
          <p className="sheet-subtitle">{LABEL[wallet]} saat ini {formatRupiah(current)}</p>

          <div className="form-group">
            <label className="form-label">Nominal Baru</label>
            <div className="amount-input-wrapper">
              <span className="amount-prefix">Rp</span>
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                className="amount-input"
                placeholder="0"
                value={rawAmount}
                onChange={handleChange}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
              />
            </div>
          </div>

          {amount > 0 && (
            <div className="amount-preview income-preview">
              <span className="preview-label"><i className="fa-solid fa-money-bill-wave" /> Saldo Tunai jadi</span>
              <span className="preview-amount">{formatRupiah(amount)}</span>
            </div>
          )}
          {minAmount > 0 && (
            <p className="sheet-subtitle" style={{ margin: '6px 2px 12px' }}>
              <i className="fa-solid fa-circle-info" /> Saldo platform lain ({formatRupiah(minAmount)}) akan di-reset ke Rp0, semuanya dipusatkan di Tunai
            </p>
          )}

          <button className="btn-primary" onClick={handleSave} disabled={!canSave}>Simpan Nominal</button>
          <button className="btn-ghost" onClick={onClose}>Batal</button>
        </div>
      </div>
    </SheetPortal>
  );
}
