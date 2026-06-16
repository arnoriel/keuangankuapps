'use client';

import { useState, useRef, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import { formatRupiah, parseAmountInput } from '@/lib/utils';

interface Props {
  onClose: () => void;
}

type Direction = 'to-tabungan' | 'to-pegangan';

export default function TransferModal({ onClose }: Props) {
  const { saldoPegangan, saldoTabungan, transfer } = useWallet();
  const [direction, setDirection] = useState<Direction>('to-tabungan');
  const [rawAmount, setRawAmount] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 150);
  }, []);

  const amount = parseAmountInput(rawAmount);
  const fromWallet = direction === 'to-tabungan' ? 'pegangan' : 'tabungan';
  const toWallet = direction === 'to-tabungan' ? 'tabungan' : 'pegangan';
  const fromBalance = direction === 'to-tabungan' ? saldoPegangan : saldoTabungan;
  const toBalance = direction === 'to-tabungan' ? saldoTabungan : saldoPegangan;
  const isInsufficient = amount > fromBalance;
  const canSubmit = amount > 0 && amount <= fromBalance;

  function handleSwap() {
    setIsSwapping(true);
    setTimeout(() => {
      setDirection((d) => (d === 'to-tabungan' ? 'to-pegangan' : 'to-tabungan'));
      setIsSwapping(false);
    }, 300);
  }

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const cleaned = e.target.value.replace(/[^\d]/g, '');
    if (cleaned === '') { setRawAmount(''); return; }
    const num = parseInt(cleaned, 10);
    if (!isNaN(num)) setRawAmount(num.toLocaleString('id-ID'));
  }

  function handleSetMax() {
    setRawAmount(fromBalance.toLocaleString('id-ID'));
  }

  function handleSubmit() {
    if (!canSubmit) return;
    transfer(amount, fromWallet, toWallet);
    setDone(true);
    setTimeout(() => onClose(), 1800);
  }

  const fromLabel = fromWallet === 'pegangan' ? 'Saldo Pegangan' : 'Saldo Tabungan';
  const toLabel = toWallet === 'tabungan' ? 'Saldo Tabungan' : 'Saldo Pegangan';
  const fromColor = fromWallet === 'pegangan' ? 'mini-green' : 'mini-blue';
  const toColor = toWallet === 'tabungan' ? 'mini-blue' : 'mini-green';

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="sheet sheet-transfer">
        <div className="sheet-handle" />

        {!done ? (
          <div className="sheet-body">
            <div className="sheet-header">
              <button className="sheet-close" onClick={onClose}>
                <i className="fa-solid fa-xmark" />
              </button>
              <h2 className="sheet-title">Transfer Dana</h2>
              <div style={{ width: 36 }} />
            </div>
            <p className="sheet-subtitle">Pindahkan saldo antar dompetmu</p>

            {/* Transfer Flow UI */}
            <div className={`transfer-flow ${isSwapping ? 'swapping' : ''}`}>
              <div className={`transfer-wallet-mini ${fromColor}`}>
                <div className="transfer-wallet-dot" />
                <div className="transfer-wallet-info">
                  <div className="transfer-wallet-role">DARI</div>
                  <div className="transfer-wallet-name">{fromLabel}</div>
                  <div className="transfer-wallet-bal">{formatRupiah(fromBalance)}</div>
                </div>
              </div>

              <div className="transfer-mid">
                <div className="transfer-arrow-line">
                  <i className="fa-solid fa-arrow-down" />
                </div>
                <button className="swap-btn" onClick={handleSwap} type="button">
                  <i className="fa-solid fa-arrow-right-arrow-left" />
                  <span>Tukar</span>
                </button>
              </div>

              <div className={`transfer-wallet-mini ${toColor}`}>
                <div className="transfer-wallet-dot" />
                <div className="transfer-wallet-info">
                  <div className="transfer-wallet-role">KE</div>
                  <div className="transfer-wallet-name">{toLabel}</div>
                  <div className="transfer-wallet-bal">{formatRupiah(toBalance)}</div>
                </div>
              </div>
            </div>

            {/* Amount Input */}
            <div className="form-group">
              <div className="transfer-amount-header">
                <label className="form-label" style={{ margin: 0 }}>Jumlah Transfer</label>
                <button className="transfer-max-btn" onClick={handleSetMax} type="button">
                  <i className="fa-solid fa-bolt" />
                  Maks {formatRupiah(fromBalance)}
                </button>
              </div>
              <div className={`amount-input-wrapper ${isInsufficient ? 'input-error' : ''}`}>
                <span className="amount-prefix">Rp</span>
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="numeric"
                  className="amount-input"
                  placeholder="0"
                  value={rawAmount}
                  onChange={handleAmountChange}
                />
              </div>
              {isInsufficient && (
                <div className="input-error-msg">
                  <i className="fa-solid fa-circle-exclamation" />
                  Saldo tidak cukup. Tersedia {formatRupiah(fromBalance)}
                </div>
              )}
            </div>

            {/* Preview */}
            {canSubmit && (
              <div className="amount-preview transfer-preview">
                <span className="preview-label">
                  <i className="fa-solid fa-rotate" />
                  {fromLabel} &rarr; {toLabel}
                </span>
                <span className="preview-amount" style={{ color: 'var(--brand)' }}>
                  {formatRupiah(amount)}
                </span>
              </div>
            )}

            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              Konfirmasi Transfer
            </button>
            <button className="btn-ghost" onClick={onClose}>Batal</button>
          </div>
        ) : (
          <div className="sheet-body sheet-success">
            <div className="success-icon" style={{ background: 'var(--brand-subtle)', color: 'var(--brand)' }}>
              <i className="fa-solid fa-circle-check" />
            </div>
            <h2 className="success-title">Transfer Berhasil!</h2>
            <p className="success-msg">
              {formatRupiah(amount)} dipindahkan dari {fromLabel} ke {toLabel}
            </p>
          </div>
        )}
      </div>
    </>
  );
}