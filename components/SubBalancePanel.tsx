'use client';

import { useState, type CSSProperties } from 'react';
import { useWallet } from '@/context/WalletContext';
import { haptics } from '@/lib/haptics';
import { formatRupiah } from '@/lib/utils';
import { WalletType, SubBalance } from '@/lib/types';
import { usePlatformColor } from '@/hooks/usePlatformColor';
import PlatformIcon from './PlatformIcon';
import AddSubCardSheet from './AddSubCardSheet';
import SubCardTransferSheet from './SubCardTransferSheet';

interface Props {
  wallet: WalletType;
}

interface TileProps {
  sub: SubBalance;
  onOpen: () => void;
  onDelete: () => void;
}

function SubCardTile({ sub, onOpen, onDelete }: TileProps) {
  const brand = usePlatformColor(sub.platformSlug);
  const removable = sub.platformSlug !== 'cash' && sub.amount === 0;

  return (
    <button
      type="button"
      className={`subcard-tile${brand ? ' is-branded' : ''}${brand?.light ? ' is-light' : ''}`}
      style={brand ? ({ '--tile-c': brand.hex } as CSSProperties) : undefined}
      onClick={onOpen}
      onContextMenu={(e) => { e.preventDefault(); onDelete(); }}
    >
      <span className="card-orb card-orb-1" />
      <span className="card-orb card-orb-2" />
      <span className="subcard-tile-top">
        <PlatformIcon platformSlug={sub.platformSlug} size={34} />
        {removable && (
          <span
            className="subcard-tile-remove"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >
            <i className="fa-solid fa-xmark" />
          </span>
        )}
      </span>
      <span className="subcard-tile-label">{sub.label}</span>
      <span className="subcard-tile-amount">{formatRupiah(sub.amount)}</span>
    </button>
  );
}

export default function SubBalancePanel({ wallet }: Props) {
  const { subBalancesOf, deleteSubCard } = useWallet();
  const [showAdd, setShowAdd] = useState(false);
  const [transferFrom, setTransferFrom] = useState<string | null>(null);

  const subCards = subBalancesOf(wallet);

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
      <p className="subbalance-panel-subtitle">Rincian saldo kamu tersimpan di mana saja</p>

      {subCards.length === 0 ? (
        <div className="empty-state" style={{ padding: '24px 0' }}>
          <div className="empty-state-text">Belum ada rincian</div>
        </div>
      ) : (
        <div className="subcard-grid">
          {subCards.map((sub) => (
            <SubCardTile
              key={sub.id}
              sub={sub}
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