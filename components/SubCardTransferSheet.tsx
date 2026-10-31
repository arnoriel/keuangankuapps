'use client';

import { useRef, useState, useEffect } from 'react';
import { useWallet } from '@/context/WalletContext';
import { haptics } from '@/lib/haptics';
import { formatRupiah, parseAmountInput } from '@/lib/utils';
import { WalletType } from '@/lib/types';
import PlatformIcon from './PlatformIcon';
import SheetPortal from './SheetPortal';

interface Props {
  wallet: WalletType;
  fromSubCardId: string;
  onClose: () => void;
}

const OTHER_WALLET: Record<WalletType, WalletType> = { pegangan: 'tabungan', tabungan: 'pegangan' };
const WALLET_LABEL: Record<WalletType, string> = { pegangan: 'Pegangan', tabungan: 'Tabungan' };

export default function SubCardTransferSheet({ wallet, fromSubCardId, onClose }: Props) {
  const { subBalancesOf, reallocateSubCard } = useWallet();
  const [scope, setScope] = useState<'same' | 'cross'>('same');
  const [toSubCardId, setToSubCardId] = useState('');
  const [rawAmount, setRawAmount] = useState('');
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const from = subBalancesOf(wallet).find((s) => s.id === fromSubCardId);
  const sameWalletTargets = subBalancesOf(wallet).filter((s) => s.id !== fromSubCardId);
  const crossWalletTargets = subBalancesOf(OTHER_WALLET[wallet]);
  const targets = scope === 'same' ? sameWalletTargets : crossWalletTargets;

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 150);
  }, []);

  useEffect(() => {
    setToSubCardId(targets[0]?.id ?? '');
  }, [scope]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!from) return null;

  const amount = parseAmountInput(rawAmount);
  const toCard = targets.find((t) => t.id === toSubCardId);
  const isInsufficient = amount > from.amount;
  const canSubmit = amount > 0 && amount <= from.amount && !!toCard;

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const cleaned = e.target.value.replace(/[^\d]/g, '');
    if (cleaned === '') { setRawAmount(''); return; }
    const num = parseInt(cleaned, 10);
    if (!isNaN(num)) setRawAmount(num.toLocaleString('id-ID'));
  }

  function handleSetMax() {
    setRawAmount(from!.amount.toLocaleString('id-ID'));
  }

  function handleSubmit() {
    if (!canSubmit || !toCard) {
      if (isInsufficient) haptics.warning();
      return;
    }
    reallocateSubCard(fromSubCardId, toCard.id, amount);
    haptics.success();
    setDone(true);
    setTimeout(() => onClose(), 1600);
  }

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
              <h2 className="sheet-title">Pindahkan Saldo</h2>
              <div style={{ width: 36 }} />
            </div>
            <p className="sheet-subtitle">Dari {from.label} ({WALLET_LABEL[wallet]})</p>

            <div className="period-tabs" style={{ marginBottom: 16 }}>
              <button
                type="button"
                className={`period-tab ${scope === 'same' ? 'active' : ''}`}
                onClick={() => setScope('same')}
              >
                Sesama {WALLET_LABEL[wallet]}
              </button>
              <button
                type="button"
                className={`period-tab ${scope === 'cross' ? 'active' : ''}`}
                onClick={() => setScope('cross')}
              >
                Ke {WALLET_LABEL[OTHER_WALLET[wallet]]}
              </button>
            </div>

            <div className="transfer-flow">
              <div className="transfer-wallet-mini mini-green">
                <PlatformIcon platformSlug={from.platformSlug} size={28} />
                <div className="transfer-wallet-info">
                  <div className="transfer-wallet-role">DARI</div>
                  <div className="transfer-wallet-name">{from.label}</div>
                  <div className="transfer-wallet-bal">{formatRupiah(from.amount)}</div>
                </div>
              </div>

              <div className="transfer-mid">
                <div className="transfer-arrow-line">
                  <i className="fa-solid fa-arrow-down" />
                </div>
              </div>

              {targets.length === 0 ? (
                <div className="empty-state" style={{ padding: '20px 0' }}>
                  <div className="empty-state-text">
                    Belum ada card tujuan di {WALLET_LABEL[scope === 'same' ? wallet : OTHER_WALLET[wallet]]}
                  </div>
                </div>
              ) : (
                <div className="subcard-target-list">
                  {targets.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`subcard-target-item ${toSubCardId === t.id ? 'active' : ''}`}
                      onClick={() => setToSubCardId(t.id)}
                    >
                      <PlatformIcon platformSlug={t.platformSlug} size={24} />
                      <span>{t.label}</span>
                      <span className="subcard-target-bal">{formatRupiah(t.amount)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group">
              <div className="transfer-amount-header">
                <label className="form-label" style={{ margin: 0 }}>Jumlah Pindah</label>
                <button className="transfer-max-btn" onClick={handleSetMax} type="button">
                  <i className="fa-solid fa-bolt" />
                  Maks {formatRupiah(from.amount)}
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
                  Saldo tidak cukup. Tersedia {formatRupiah(from.amount)}
                </div>
              )}
            </div>

            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              Konfirmasi Pindah
            </button>
            <button className="btn-ghost" onClick={onClose}>Batal</button>
          </div>
        ) : (
          <div className="sheet-body sheet-success">
            <div className="success-icon" style={{ background: 'var(--brand-subtle)', color: 'var(--brand)' }}>
              <i className="fa-solid fa-circle-check" />
            </div>
            <h2 className="success-title">Berhasil Dipindahkan!</h2>
            <p className="success-msg">
              {formatRupiah(amount)} dari {from.label} ke {toCard?.label}
            </p>
          </div>
        )}
      </div>
    </SheetPortal>
  );
}
