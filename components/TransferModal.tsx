'use client';

import { useState, useRef, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import { haptics } from '@/lib/haptics';
import { formatRupiah, parseAmountInput } from '@/lib/utils';
import { WalletType, SubBalance } from '@/lib/types';
import PlatformIcon from './PlatformIcon';
import SheetPortal from './SheetPortal';

interface Props {
  onClose: () => void;
}

type Direction = 'to-tabungan' | 'to-pegangan';

const WALLET_LABEL: Record<WalletType, string> = { pegangan: 'Saldo Pegangan', tabungan: 'Saldo Tabungan' };
const WALLET_COLOR: Record<WalletType, string> = { pegangan: 'mini-green', tabungan: 'mini-blue' };

interface PickerProps {
  cards: SubBalance[];
  value: string;
  onChange: (id: string) => void;
}

function SubCardPicker({ cards, value, onChange }: PickerProps) {
  return (
    <div className="subcard-target-list">
      {cards.map((c) => (
        <button
          key={c.id}
          type="button"
          className={`subcard-target-item ${value === c.id ? 'active' : ''}`}
          onClick={() => { haptics.light(); onChange(c.id); }}
        >
          <PlatformIcon platformSlug={c.platformSlug} size={24} />
          <span>{c.label}</span>
          <span className="subcard-target-bal">{formatRupiah(c.amount)}</span>
        </button>
      ))}
    </div>
  );
}

export default function TransferModal({ onClose }: Props) {
  const { subBalancesOf, transfer } = useWallet();
  const [direction, setDirection] = useState<Direction>('to-tabungan');
  const [fromSubId, setFromSubId] = useState('cash-pegangan');
  const [toSubId, setToSubId] = useState('cash-tabungan');
  const [rawAmount, setRawAmount] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 150);
  }, []);

  const fromWallet: WalletType = direction === 'to-tabungan' ? 'pegangan' : 'tabungan';
  const toWallet: WalletType = direction === 'to-tabungan' ? 'tabungan' : 'pegangan';
  const fromCards = subBalancesOf(fromWallet);
  const toCards = subBalancesOf(toWallet);
  const fromCard = fromCards.find((c) => c.id === fromSubId);
  const toCard = toCards.find((c) => c.id === toSubId);
  const fromBalance = fromCard?.amount ?? 0;

  const amount = parseAmountInput(rawAmount);
  const isInsufficient = amount > fromBalance;
  const canSubmit = amount > 0 && amount <= fromBalance && !!fromCard && !!toCard;

  function handleSwap() {
    haptics.light();
    setIsSwapping(true);
    setTimeout(() => {
      setDirection((d) => (d === 'to-tabungan' ? 'to-pegangan' : 'to-tabungan'));
      setFromSubId(`cash-${toWallet}`);
      setToSubId(`cash-${fromWallet}`);
      setRawAmount('');
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
    if (!canSubmit) {
      if (isInsufficient) haptics.warning();
      return;
    }
    transfer(amount, fromWallet, toWallet, fromSubId, toSubId);
    haptics.success();
    setDone(true);
    setTimeout(() => onClose(), 1800);
  }

  const fromLabel = `${fromCard?.label ?? ''} (${WALLET_LABEL[fromWallet]})`;
  const toLabel = `${toCard?.label ?? ''} (${WALLET_LABEL[toWallet]})`;

  return (
    <SheetPortal>
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
            <p className="sheet-subtitle">Pilih sumber dan tujuan dana</p>

            <div className={`transfer-flow ${isSwapping ? 'swapping' : ''}`}>
              <div className={`transfer-wallet-mini ${WALLET_COLOR[fromWallet]}`}>
                <div className="transfer-wallet-dot" />
                <div className="transfer-wallet-info">
                  <div className="transfer-wallet-role">DARI</div>
                  <div className="transfer-wallet-name">{WALLET_LABEL[fromWallet]}</div>
                </div>
              </div>
              <SubCardPicker cards={fromCards} value={fromSubId} onChange={setFromSubId} />

              <div className="transfer-mid">
                <div className="transfer-arrow-line">
                  <i className="fa-solid fa-arrow-down" />
                </div>
                <button className="swap-btn" onClick={handleSwap} type="button">
                  <i className="fa-solid fa-arrow-right-arrow-left" />
                  <span>Tukar</span>
                </button>
              </div>

              <div className={`transfer-wallet-mini ${WALLET_COLOR[toWallet]}`}>
                <div className="transfer-wallet-dot" />
                <div className="transfer-wallet-info">
                  <div className="transfer-wallet-role">KE</div>
                  <div className="transfer-wallet-name">{WALLET_LABEL[toWallet]}</div>
                </div>
              </div>
              <SubCardPicker cards={toCards} value={toSubId} onChange={setToSubId} />
            </div>

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
                  Saldo {fromCard?.label} tidak cukup. Tersedia {formatRupiah(fromBalance)}
                </div>
              )}
            </div>

            {canSubmit && (
              <div className="amount-preview transfer-preview">
                <span className="preview-label">
                  <i className="fa-solid fa-rotate" />
                  {fromCard?.label} &rarr; {toCard?.label}
                </span>
                <span className="preview-amount" style={{ color: 'var(--brand)' }}>
                  {formatRupiah(amount)}
                </span>
              </div>
            )}

            <button className="btn-primary" onClick={handleSubmit} disabled={!canSubmit}>
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
    </SheetPortal>
  );
}