'use client';

import { useState, useEffect, type CSSProperties } from 'react';
import { useWallet } from '@/context/WalletContext';
import { haptics } from '@/lib/haptics';
import { formatRupiah } from '@/lib/utils';
import { WalletType, SubBalance } from '@/lib/types';
import { ACCOUNT_FIELDS, KIND_LABEL, maskAccountNumber, type AccountKind } from '@/lib/accountNumber';
import { usePlatformColor } from '@/hooks/usePlatformColor';
import PlatformIcon from './PlatformIcon';
import AddSubCardSheet from './AddSubCardSheet';
import SubCardDetailSheet from './SubCardDetailSheet';
import SubCardTransferSheet from './SubCardTransferSheet';

interface Props {
  wallet: WalletType;
}

interface TileProps {
  sub: SubBalance;
  share: number;
  index: number;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function SubCardTile({ sub, share, index, onOpen, onEdit, onDelete }: TileProps) {
  const brand = usePlatformColor(sub.platformSlug);
  const [copied, setCopied] = useState(false);
  const kind = sub.platformCategory;
  const isCash = kind === 'cash';
  const removable = !isCash && sub.amount === 0;
  const fillStyle = { transform: `scaleX(${share})` };

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1400);
    return () => clearTimeout(t);
  }, [copied]);

  async function handleCopy() {
    if (!sub.accountNumber) return;
    try {
      await navigator.clipboard.writeText(sub.accountNumber);
      haptics.success();
      setCopied(true);
    } catch {
      haptics.warning();
    }
  }

  return (
    <div
      className={`subcard subcard-${kind}${brand ? ' is-branded' : ''}${brand?.light ? ' is-light' : ''}`}
      style={{ '--tile-c': brand?.hex, '--i': Math.min(index, 6) } as CSSProperties}
    >
      <button
        type="button"
        className="subcard-hit"
        aria-label={`${sub.label}, ${formatRupiah(sub.amount)}. Pindahkan saldo`}
        onClick={onOpen}
        onContextMenu={(e) => { e.preventDefault(); onDelete(); }}
      />

      <div className="subcard-row">
        <span className="subcard-logo"><PlatformIcon platformSlug={sub.platformSlug} size={30} /></span>
        <span className="subcard-title">
          <span className="subcard-kind">{KIND_LABEL[kind]}</span>
          <span className="subcard-name">{sub.label}</span>
        </span>
        {!isCash && (
          <button type="button" className="subcard-action" onClick={onEdit} aria-label={`Ubah ${ACCOUNT_FIELDS[kind].label}`}>
            <i className="fa-solid fa-pen" />
          </button>
        )}
        {removable && (
          <button type="button" className="subcard-action" onClick={onDelete} aria-label={`Hapus ${sub.label}`}>
            <i className="fa-solid fa-xmark" />
          </button>
        )}
      </div>

      <div className="subcard-row subcard-row-bottom">
        {isCash ? (
          <span className="subcard-account is-static"><i className="fa-solid fa-wallet" />Uang fisik</span>
        ) : sub.accountNumber ? (
          <button type="button" className="subcard-account" onClick={handleCopy} aria-label="Salin nomor">
            {kind === 'bank' ? <span className="subcard-chip" /> : <i className={`fa-solid ${ACCOUNT_FIELDS[kind].icon}`} />}
            <span className="subcard-account-text">{copied ? 'Tersalin' : maskAccountNumber(kind, sub.accountNumber)}</span>
            <i className={`fa-regular ${copied ? 'fa-circle-check' : 'fa-copy'}`} />
          </button>
        ) : (
          <button type="button" className="subcard-account is-empty" onClick={onEdit}>
            <i className="fa-solid fa-plus" />{ACCOUNT_FIELDS[kind].label}
          </button>
        )}
        <span className="subcard-amount">{formatRupiah(sub.amount)}</span>
      </div>

      <div className="subcard-share" aria-hidden="true">
        <span className="subcard-share-track"><span className="subcard-share-fill" style={fillStyle} /></span>
        <span className="subcard-share-pct">{Math.round(share * 100)}%</span>
      </div>
    </div>
  );
}

export default function SubBalancePanel({ wallet }: Props) {
  const { subBalancesOf, deleteSubCard, resetSubCards, updateSubCardAccount } = useWallet();
  const [showAdd, setShowAdd] = useState(false);
  const [transferFrom, setTransferFrom] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const subCards = subBalancesOf(wallet);
  const total = subCards.reduce((acc, s) => acc + s.amount, 0);
  const editing = subCards.find((s) => s.id === editingId);

  // Konfirmasi reset otomatis batal kalau tidak di-tap lagi
  useEffect(() => {
    if (!confirmReset) return;
    const t = setTimeout(() => setConfirmReset(false), 3000);
    return () => clearTimeout(t);
  }, [confirmReset]);

  function handleReset() {
    if (!confirmReset) {
      haptics.warning();
      setConfirmReset(true);
      return;
    }
    haptics.success();
    resetSubCards();
    setConfirmReset(false);
  }

  function handleDelete(id: string, amount: number) {
    if (amount > 0) {
      haptics.warning();
      return;
    }
    haptics.light();
    deleteSubCard(id);
  }

  return (
    <div className={`subbalance-panel subbalance-panel-${wallet}`}>
      <div className="subbalance-panel-head">
        <p className="subbalance-panel-subtitle">Rincian saldo kamu tersimpan di mana saja</p>
        <button
          type="button"
          className={`subbalance-reset-btn${confirmReset ? ' is-confirm' : ''}`}
          onClick={handleReset}
          aria-label="Reset semua saldo ke Tunai"
        >
          <i className={`fa-solid ${confirmReset ? 'fa-check' : 'fa-rotate-left'}`} />
          {confirmReset && 'Yakin?'}
        </button>
      </div>

      {subCards.length === 0 ? (
        <div className="empty-state" style={{ padding: '24px 0' }}>
          <div className="empty-state-text">Belum ada rincian</div>
        </div>
      ) : (
        <div className="subcard-list">
          {subCards.map((sub, i) => (
            <SubCardTile
              key={sub.id}
              sub={sub}
              share={total > 0 ? sub.amount / total : 0}
              index={i}
              onEdit={() => { haptics.light(); setEditingId(sub.id); }}
              onOpen={() => { haptics.light(); setTransferFrom(sub.id); }}
              onDelete={() => handleDelete(sub.id, sub.amount)}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        className="subcard-add-btn"
        onClick={() => { haptics.light(); setShowAdd(true); }}
      >
        <i className="fa-solid fa-plus" />
        Tambah Platform
      </button>

      {showAdd && (
        <AddSubCardSheet
          wallet={wallet}
          existingSlugs={subCards.map((s) => s.platformSlug)}
          onClose={() => setShowAdd(false)}
        />
      )}

      {editing && editing.platformCategory !== 'cash' && (
        <SubCardDetailSheet
          platformSlug={editing.platformSlug}
          name={editing.label}
          kind={editing.platformCategory as AccountKind}
          initial={editing.accountNumber}
          onSave={(accountNumber) => updateSubCardAccount(editing.id, accountNumber)}
          onClose={() => setEditingId(null)}
        />
      )}

      {transferFrom && (
        <SubCardTransferSheet
          wallet={wallet}
          fromSubCardId={transferFrom}
          onClose={() => setTransferFrom(null)}
        />
      )}
    </div>
  );
}