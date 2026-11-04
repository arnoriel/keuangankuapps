'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';

/** Bagian drawer yang tertutup card saldo (harus sama dengan margin-top -64px di CSS). */
const OVERLAP = 64;
const DURATION = 340;
const EASING = 'cubic-bezier(0.32, 0.72, 0, 1)';

type Phase = 'closed' | 'open' | 'closing';

const currentOffset = (el: HTMLElement) => new DOMMatrixReadOnly(getComputedStyle(el).transform).m42;

/**
 * Drawer slide tanpa animasi layout. Layout langsung ke ukuran akhir, lalu panel
 * dan konten di bawahnya digeser bareng lewat transform (compositor, tanpa
 * reflow/repaint per frame). Edge bawah drawer selalu menempel di konten bawah.
 */
export function useDrawerMotion<T>(target: T | null) {
  const [shown, setShown] = useState<T | null>(null);
  const collapseRef = useRef<HTMLDivElement>(null);
  const slideRef = useRef<HTMLDivElement>(null);
  const belowRef = useRef<HTMLDivElement>(null);
  const phase = useRef<Phase>('closed');
  const running = useRef<Animation[]>([]);

  const stop = useCallback(() => {
    running.current.forEach((a) => a.cancel());
    running.current = [];
  }, []);

  const play = useCallback((from: number, to: number, fill: FillMode) => {
    const frames = [{ transform: `translate3d(0,${from}px,0)` }, { transform: `translate3d(0,${to}px,0)` }];
    running.current = [slideRef.current, belowRef.current].flatMap((el) =>
      el ? [el.animate(frames, { duration: DURATION, easing: EASING, fill })] : [],
    );
    return running.current[0];
  }, []);

  useLayoutEffect(() => {
    const collapse = collapseRef.current;
    const slide = slideRef.current;
    if (!collapse || !slide) return;

    const canAnimate =
      typeof slide.animate === 'function' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (target !== null) {
      if (shown !== target) {
        setShown(target);
        return;
      }
      if (phase.current === 'open') return;
      const shift = collapse.offsetHeight - OVERLAP;
      const from = phase.current === 'closing' ? currentOffset(slide) : -shift;
      stop();
      phase.current = 'open';
      if (canAnimate && shift > 0) play(from, 0, 'none');
      return;
    }

    if (shown === null) {
      stop();
      phase.current = 'closed';
      return;
    }
    if (phase.current !== 'open') return;

    const shift = collapse.offsetHeight - OVERLAP;
    const from = currentOffset(slide);
    stop();
    if (!canAnimate || shift <= 0) {
      phase.current = 'closed';
      setShown(null);
      return;
    }
    phase.current = 'closing';
    play(from, -shift, 'forwards')
      .finished.then(() => {
        if (phase.current !== 'closing') return;
        phase.current = 'closed';
        setShown(null);
      })
      .catch(() => {});
  }, [target, shown, stop, play]);

  return { shown, collapseRef, slideRef, belowRef };
}
