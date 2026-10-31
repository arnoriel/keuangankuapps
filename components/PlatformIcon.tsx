'use client';

import { useEffect, useState } from 'react';
import { getPlatformIconMarkup } from '@/lib/platformCatalog';

interface Props {
  platformSlug: string;
  size?: number;
}

const FALLBACK_ICON: Record<string, string> = {
  cash: 'fa-money-bill-wave',
  'e-wallet': 'fa-mobile-screen-button',
  bank: 'fa-building-columns',
};

export default function PlatformIcon({ platformSlug, size = 28 }: Props) {
  const [svg, setSvg] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setSvg(null);
    if (platformSlug === 'cash') return;

    let cancelled = false;
    getPlatformIconMarkup(platformSlug).then((markup) => {
      if (cancelled) return;
      setSvg(markup);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [platformSlug]);

  if (platformSlug === 'cash') {
    return (
      <span className="platform-icon platform-icon-cash" style={{ width: size, height: size }}>
        <i className={`fa-solid ${FALLBACK_ICON.cash}`} />
      </span>
    );
  }

  if (!loaded || !svg) {
    return (
      <span className="platform-icon platform-icon-fallback" style={{ width: size, height: size }}>
        <i className={`fa-solid ${FALLBACK_ICON['e-wallet']}`} />
      </span>
    );
  }

  return (
    <span
      className="platform-icon"
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
