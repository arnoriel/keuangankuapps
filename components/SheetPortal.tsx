'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  children: ReactNode;
}

/**
 * Render children into document.body, bypassing any ancestor with `transform`
 * (e.g. saldo carousel's scroll-driven 3D animation), which would otherwise
 * create a new containing block and break `position: fixed` on sheets/overlays.
 * Also locks body scroll while mounted so the page behind can't scroll.
 */
let lockCount = 0;

function lockBodyScroll() {
  if (lockCount === 0) document.body.style.overflow = 'hidden';
  lockCount += 1;
}

function unlockBodyScroll() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) document.body.style.overflow = '';
}

export default function SheetPortal({ children }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    lockBodyScroll();
    return unlockBodyScroll;
  }, []);

  if (!mounted) return null;
  return createPortal(children, document.body);
}
