'use client';

import { useEffect, useState } from 'react';
import { getPlatformIconMarkup, peekPlatformIconMarkup } from '@/lib/platformCatalog';

interface Props {
  platformSlug: string;
  size?: number;
}

const FALLBACK_ICON = 'fa-mobile-screen-button';

export default function PlatformIcon({ platformSlug, size = 28 }: Props) {
  const isCash = platformSlug === 'cash';
  const [svg, setSvg] = useState<string | null>(() => (isCash ? null : peekPlatformIconMarkup(platformSlug) ?? null));

  useEffect(() => {
    if (isCash) return;
    const cached = peekPlatformIconMarkup(platformSlug);
    if (cached !== undefined) {
      setSvg(cached);
      return;
    }
    let cancelled = false;
    getPlatformIconMarkup(platformSlug).then((markup) => {
      if (!cancelled) setSvg(markup);
    });
    return () => {
      cancelled = true;
    };
  }, [platformSlug, isCash]);

  const style = { width: size, height: size };

  if (isCash) {
    return (
      <span className="platform-icon platform-icon-cash" style={style}>
        <i className="fa-solid fa-money-bill-wave" />
      </span>
    );
  }

  if (!svg) {
    return (
      <span className="platform-icon platform-icon-fallback" style={style}>
        <i className={`fa-solid ${FALLBACK_ICON}`} />
      </span>
    );
  }

  return <span className="platform-icon" style={style} dangerouslySetInnerHTML={{ __html: svg }} />;
}
