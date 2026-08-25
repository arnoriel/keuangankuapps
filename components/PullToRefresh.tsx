'use client';

import '@/styles/pull-refresh.css';
import { useRef, useState, type ReactNode, type TouchEvent } from 'react';
import { haptics } from '@/lib/haptics';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}

const THRESHOLD = 72; // px tarikan sebelum trigger refresh
const MAX_PULL = 110; // px batas visual tarikan (resistance)

/**
 * Wrapper pull-to-refresh khas app finance/mobile: tarik dari atas saat
 * scroll sudah di posisi paling atas -> muncul indicator -> lepas untuk
 * refresh. Native touch events, tanpa dependency eksternal.
 */
export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggeredHapticRef = useRef(false);

  function handleTouchStart(e: TouchEvent<HTMLDivElement>) {
    if (isRefreshing) return;
    // Scroll container sebenarnya adalah `.page` (parent dari wrapper
    // ini, dikelola AppShell) — bukan wrapper ini sendiri. Cek posisi
    // scroll parent terdekat yang scrollable supaya gesture pull hanya
    // aktif saat benar-benar di paling atas.
    const scrollParent = containerRef.current?.closest('.page') as HTMLElement | null;
    if (scrollParent && scrollParent.scrollTop > 0) {
      startY.current = null;
      return;
    }
    startY.current = e.touches[0].clientY;
    triggeredHapticRef.current = false;
  }

  function handleTouchMove(e: TouchEvent<HTMLDivElement>) {
    if (startY.current === null || isRefreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta <= 0) {
      setPullDistance(0);
      return;
    }
    // Resistance curve — makin ditarik makin "berat"
    const resisted = Math.min(MAX_PULL, delta * 0.5);
    setPullDistance(resisted);

    if (resisted >= THRESHOLD && !triggeredHapticRef.current) {
      triggeredHapticRef.current = true;
      haptics.light();
    }
  }

  async function handleTouchEnd() {
    if (startY.current === null || isRefreshing) {
      startY.current = null;
      return;
    }
    const shouldRefresh = pullDistance >= THRESHOLD;
    startY.current = null;

    if (shouldRefresh) {
      setIsRefreshing(true);
      setPullDistance(THRESHOLD);
      haptics.medium();
      await onRefresh();
      haptics.success();
      setIsRefreshing(false);
    }
    setPullDistance(0);
  }

  const showSpinner = pullDistance > 0 || isRefreshing;
  const spinnerProgress = Math.min(1, pullDistance / THRESHOLD);

  return (
    <div
      ref={containerRef}
      className="ptr-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="ptr-indicator-wrap"
        style={{
          height: isRefreshing ? THRESHOLD : pullDistance,
          opacity: showSpinner ? 1 : 0,
        }}
      >
        <div
          className={`ptr-spinner ${isRefreshing ? 'ptr-spinner-active' : ''}`}
          style={{
            transform: `scale(${0.6 + spinnerProgress * 0.4}) rotate(${spinnerProgress * 360}deg)`,
          }}
        >
          <i className="fa-solid fa-arrows-rotate" />
        </div>
      </div>
      <div
        style={{
          transform: `translateY(${isRefreshing ? THRESHOLD : pullDistance}px)`,
          transition: startY.current === null ? 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}
