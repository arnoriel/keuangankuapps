'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { haptics } from '@/lib/haptics';

// ===================================================
// useInfiniteCarousel
// Carousel scroll-snap native yang berputar (loop) + auto-play.
//
// Kontrak DOM: children container = [clone-terakhir, ...slide asli, clone-pertama]
// (total count + 2). Setelah scroll berhenti di clone, posisi
// di-teleport (tanpa animasi) ke slide asli kembarannya → loop mulus
// ke dua arah (kanan dari terakhir → pertama, kiri dari pertama → terakhir).
//
// Auto-play pause otomatis saat: disentuh / hover, tab tidak terlihat,
// carousel di luar layar, prefers-reduced-motion, atau `paused` dari luar.
// ===================================================

interface Options {
  count: number;
  interval?: number;
  enabled?: boolean;
  paused?: boolean;
}

const SETTLE_MS = 90;

export function useInfiniteCarousel({
  count,
  interval = 5000,
  enabled = true,
  paused = false,
}: Options) {
  const ref = useRef<HTMLDivElement>(null);
  const posRef = useRef(1); // posisi DOM saat ini (1 = slide asli pertama)
  const touchingRef = useRef(false);
  const programmaticRef = useRef(false);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [active, setActive] = useState(0);
  const [hold, setHold] = useState(false); // touch / hover
  const [pageVisible, setPageVisible] = useState(true);
  const [inView, setInView] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  const running = enabled && !paused && !hold && pageVisible && inView && !reducedMotion;

  const getPitch = useCallback(() => {
    const el = ref.current;
    if (!el) return 0;
    const [a, b] = [el.children[0], el.children[1]] as (HTMLElement | undefined)[];
    return a && b ? b.offsetLeft - a.offsetLeft : el.clientWidth;
  }, []);

  // Teleport instan tanpa memicu snap animasi
  const jumpTo = useCallback((pos: number) => {
    const el = ref.current;
    if (!el) return;
    el.style.scrollSnapType = 'none';
    el.scrollLeft = pos * getPitch();
    posRef.current = pos;
    requestAnimationFrame(() => {
      if (ref.current) ref.current.style.scrollSnapType = '';
    });
  }, [getPitch]);

  const toActive = useCallback(
    (pos: number) => (pos <= 0 ? count - 1 : pos >= count + 1 ? 0 : pos - 1),
    [count],
  );

  const scrollToPos = useCallback((pos: number) => {
    const el = ref.current;
    if (!el) return;
    programmaticRef.current = true;
    el.scrollTo({ left: pos * getPitch(), behavior: 'smooth' });
  }, [getPitch]);

  const settle = useCallback(() => {
    const el = ref.current;
    if (!el || touchingRef.current) return;
    programmaticRef.current = false;
    const pos = Math.round(el.scrollLeft / (getPitch() || 1));
    if (pos <= 0) jumpTo(count);
    else if (pos >= count + 1) jumpTo(1);
    else posRef.current = pos;
  }, [count, getPitch, jumpTo]);

  const onScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const pos = Math.round(el.scrollLeft / (getPitch() || 1));
    const next = toActive(pos);
    setActive((prev) => {
      if (prev !== next && !programmaticRef.current) haptics.selection();
      return next;
    });
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(settle, SETTLE_MS);
  }, [getPitch, settle, toActive]);

  const goTo = useCallback((index: number) => {
    scrollToPos(Math.min(Math.max(index, 0), count - 1) + 1);
  }, [count, scrollToPos]);

  // Posisi awal: lompat ke slide asli pertama (hindari flash clone)
  useLayoutEffect(() => {
    if (enabled) jumpTo(1);
  }, [enabled, jumpTo]);

  // Re-align saat ukuran berubah (rotate layar / keyboard)
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => jumpTo(posRef.current));
    ro.observe(el);
    return () => ro.disconnect();
  }, [enabled, jumpTo]);

  // Visibility tab, reduced-motion, viewport
  useEffect(() => {
    const onVis = () => setPageVisible(!document.hidden);
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMq = () => setReducedMotion(mq.matches);
    onVis();
    onMq();
    document.addEventListener('visibilitychange', onVis);
    mq.addEventListener('change', onMq);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      mq.removeEventListener('change', onMq);
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.4,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [enabled]);

  // Auto-play — timer di-reset tiap `active` / `running` berubah
  useEffect(() => {
    if (!running) return;
    const id = setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const pos = Math.round(el.scrollLeft / (getPitch() || 1));
      if (pos > count) return; // sedang di clone, tunggu settle
      scrollToPos(pos + 1);
    }, interval);
    return () => clearTimeout(id);
  }, [running, active, interval, count, getPitch, scrollToPos]);

  useEffect(() => () => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
  }, []);

  const handlers = {
    onScroll,
    onTouchStart: () => {
      touchingRef.current = true;
      programmaticRef.current = false;
      setHold(true);
    },
    onTouchEnd: () => {
      touchingRef.current = false;
      setHold(false);
      if (settleTimer.current) clearTimeout(settleTimer.current);
      settleTimer.current = setTimeout(settle, SETTLE_MS);
    },
    onMouseEnter: () => setHold(true),
    onMouseLeave: () => setHold(false),
  };

  return {
    ref,
    active,
    running,
    goTo,
    handlers: { ...handlers, onTouchCancel: handlers.onTouchEnd },
  };
}
