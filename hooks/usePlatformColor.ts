'use client';

import { useEffect, useState } from 'react';
import { getPlatformBrandColor, type BrandColor } from '@/lib/platformCatalog';

export function usePlatformColor(slug: string): BrandColor | null {
  const [color, setColor] = useState<BrandColor | null>(null);

  useEffect(() => {
    let cancelled = false;
    setColor(null);
    getPlatformBrandColor(slug).then((c) => {
      if (!cancelled) setColor(c);
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return color;
}