'use client';

import { useEffect, useRef, useState } from 'react';

// Easing halus — cepat di awal, melambat di akhir (easeOutExpo).
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

interface UseCountUpOptions {
  /** Durasi animasi dalam ms. Default 600. */
  duration?: number;
  /** Nonaktifkan animasi (mis. saat pertama render / skeleton). */
  disabled?: boolean;
}

/**
 * Animasikan transisi angka dari nilai sebelumnya ke nilai baru
 * (count-up ATAU count-down tergantung arah perubahan).
 * Dipakai untuk nominal saldo supaya perubahan kerasa "hidup".
 */
export function useCountUp(value: number, options: UseCountUpOptions = {}): number {
  const { duration = 600, disabled = false } = options;
  const [displayValue, setDisplayValue] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number | null>(null);
  const isFirstRun = useRef(true);

  useEffect(() => {
    // Render pertama — langsung set tanpa animasi supaya tidak
    // count-up dari 0 saat halaman baru dibuka.
    if (isFirstRun.current) {
      isFirstRun.current = false;
      fromRef.current = value;
      setDisplayValue(value);
      return;
    }

    if (disabled || fromRef.current === value) {
      fromRef.current = value;
      setDisplayValue(value);
      return;
    }

    const startValue = fromRef.current;
    const delta = value - startValue;
    const startTime = performance.now();

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutExpo(progress);
      const current = Math.round(startValue + delta * eased);
      setDisplayValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration, disabled]);

  return displayValue;
}
