'use client';

import { useEffect, useState } from 'react';
import { getPlatformBrandColor, peekPlatformBrandColor, type BrandColor } from '@/lib/platformCatalog';

export function usePlatformColor(slug: string): BrandColor | null {
  const [color, setColor] = useState<BrandColor | null>(() => peekPlatformBrandColor(slug) ?? null);

  useEffect(() => {
    const cached = peekPlatformBrandColor(slug);
    if (cached !== undefined) {
      setColor(cached);
      return;
    }
    let cancelled = false;
    getPlatformBrandColor(slug).then((c) => {
      if (!cancelled) setColor(c);
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return color;
}
