'use client';

import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { haptics } from '@/lib/haptics';

interface Props {
  label: string;
  onEdit: () => void;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Menu titik tiga di-render lewat portal ke document.body: lepas dari carousel
 * (scroll-snap, transform 3D, overflow clip) supaya tap pada item tidak kalah
 * oleh gesture/hit-test carousel. Tap di luar ditangani backdrop transparan.
 */
export default function SaldoCardMenu({ label, onEdit, onOpenChange }: Props) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

  function setOpen(next: { top: number; right: number } | null) {
    setPos(next);
    onOpenChange?.(next !== null);
  }

  function toggle() {
    if (pos) return setOpen(null);
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    haptics.light();
    setOpen({ top: rect.bottom + 6, right: Math.max(8, window.innerWidth - rect.right) });
  }

  function handleEdit() {
    setOpen(null);
    onEdit();
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className="saldo-card-icon-btn"
        onClick={toggle}
        aria-label={`Opsi ${label}`}
        aria-expanded={pos !== null}
      >
        <i className="fa-solid fa-ellipsis-vertical" />
      </button>
      {pos && createPortal(
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000 }} onClick={() => setOpen(null)} />
          <div
            className="saldo-card-menu-dropdown"
            style={{ position: 'fixed', top: pos.top, right: pos.right, zIndex: 1001 }}
          >
            <button type="button" className="saldo-card-menu-item" onClick={handleEdit}>
              <i className="fa-solid fa-pen" />
              Edit Nominal
            </button>
          </div>
        </>,
        document.body,
      )}
    </>
  );
}
