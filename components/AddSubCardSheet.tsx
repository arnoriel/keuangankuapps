'use client';

import { useMemo, useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { haptics } from '@/lib/haptics';
import { searchPlatformOptions } from '@/lib/platformCatalog';
import { WalletType } from '@/lib/types';
import PlatformIcon from './PlatformIcon';
import SheetPortal from './SheetPortal';

interface Props {
  wallet: WalletType;
  existingSlugs: string[];
  onClose: () => void;
}

export default function AddSubCardSheet({ wallet, existingSlugs, onClose }: Props) {
  const { addSubCard } = useWallet();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const existing = new Set(existingSlugs);
    return searchPlatformOptions(query).filter((p) => !existing.has(p.slug));
  }, [query, existingSlugs]);

  function handlePick(slug: string) {
    haptics.success();
    addSubCard(wallet, slug);
    onClose();
  }

  return (
    <SheetPortal>
      <div className="overlay" onClick={onClose} />
      <div className="sheet sheet-platform-picker">
        <div className="sheet-handle" />
        <div className="sheet-body">
          <div className="sheet-header">
            <button className="sheet-close" onClick={onClose}>
              <i className="fa-solid fa-xmark" />
            </button>
            <h2 className="sheet-title">Tambah Platform</h2>
            <div style={{ width: 36 }} />
          </div>

          <div className="form-group">
            <div className="search-input-wrapper">
              <i className="fa-solid fa-magnifying-glass search-input-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Cari e-wallet atau bank..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className="platform-picker-list">
            {results.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-text">Platform tidak ditemukan</div>
              </div>
            ) : (
              results.map((p) => (
                <button
                  key={p.slug}
                  type="button"
                  className="platform-picker-item"
                  onClick={() => handlePick(p.slug)}
                >
                  <PlatformIcon platformSlug={p.slug} size={30} />
                  <span className="platform-picker-item-label">{p.name}</span>
                  <i className="fa-solid fa-chevron-right" style={{ fontSize: 11, color: 'var(--text-4)' }} />
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </SheetPortal>
  );
}
