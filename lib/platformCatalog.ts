// ─── PLATFORM CATALOG ──────────────────────────────────────────────────────
// Sumber icon e-wallet & bank: paket `idn-finlogos` (MIT code / CC BY-NC 4.0
// asset — non-komersial, attribusi di README). Modul ini satu-satunya titik
// kontak ke paket itu, jadi kalau nanti perlu ganti sumber icon, cukup edit
// file ini saja.
import { listLogos, getLogoUrl, getLogo, type LogoMeta } from 'idn-finlogos';
import type { PlatformCategory } from './types';

export interface PlatformOption {
  slug: string;
  name: string;
  category: PlatformCategory;
}

const CASH_OPTION: PlatformOption = { slug: 'cash', name: 'Tunai', category: 'cash' };

function toOption(logo: LogoMeta, category: PlatformCategory): PlatformOption {
  return { slug: logo.slug, name: logo.name, category };
}

let cache: PlatformOption[] | null = null;

/** Semua platform yang bisa dipilih user (selain Tunai, yang selalu implisit). */
export function listPlatformOptions(): PlatformOption[] {
  if (cache) return cache;
  const wallets = listLogos({ category: 'e-wallet' }).map((l) => toOption(l, 'e-wallet'));
  const banks = listLogos({ category: 'bank-logo' }).map((l) => toOption(l, 'bank'));
  cache = [...wallets, ...banks].sort((a, b) => a.name.localeCompare(b.name, 'id'));
  return cache;
}

export function searchPlatformOptions(query: string): PlatformOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return listPlatformOptions();
  return listPlatformOptions().filter((p) => p.name.toLowerCase().includes(q));
}

export function getPlatformOption(slug: string): PlatformOption | null {
  if (slug === 'cash') return CASH_OPTION;
  return listPlatformOptions().find((p) => p.slug === slug) ?? null;
}

/** URL CDN SVG untuk slug tertentu, atau null kalau tidak ketemu (pakai fallback icon). */
export function getPlatformIconUrl(slug: string): string | null {
  if (slug === 'cash') return null;
  if (!getPlatformOption(slug)) return null;
  return getLogoUrl(slug);
}

/** Markup SVG asli (support currentColor/theming) — dipakai lewat inline render, bukan <img>. */
const markupCache = new Map<string, string | null>();

/** Baca cache sinkron: undefined = belum pernah dimuat. Dipakai supaya render pertama tanpa flicker/setState async. */
export function peekPlatformIconMarkup(slug: string): string | null | undefined {
  return markupCache.get(slug);
}

export function peekPlatformBrandColor(slug: string): BrandColor | null | undefined {
  return slug === 'cash' ? CASH_COLOR : colorCache.get(slug);
}

export async function getPlatformIconMarkup(slug: string): Promise<string | null> {
  if (slug === 'cash') return null;
  if (markupCache.has(slug)) return markupCache.get(slug) ?? null;
  if (!getPlatformOption(slug)) return null;
  try {
    const logo = await getLogo(slug);
    const svg = logo?.svg ?? null;
    markupCache.set(slug, svg);
    return svg;
  } catch {
    return null;
  }
}

/** Panaskan cache icon + warna brand di waktu idle, sebelum drawer dibuka. */
export function prefetchPlatformAssets(slugs: string[]): void {
  for (const slug of new Set(slugs)) void getPlatformBrandColor(slug);
}

export { CASH_OPTION };

// ─── BRAND COLOR (diambil dari warna dominan SVG icon) ─────────────────────
export interface BrandColor {
  hex: string;
  light: boolean;
}

const CASH_COLOR: BrandColor = { hex: '#10B981', light: false };
const colorCache = new Map<string, BrandColor | null>();

function normalizeHex(raw: string): string | null {
  let h = raw.slice(1);
  if (h.length === 3 || h.length === 4) h = h.slice(0, 3).split('').map((c) => c + c).join('');
  return h.length >= 6 ? `#${h.slice(0, 6).toLowerCase()}` : null;
}

function analyze(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return { sat: max === 0 ? 0 : (max - min) / max, lum: (0.299 * r + 0.587 * g + 0.114 * b) / 255 };
}

function dominantColor(svg: string): BrandColor | null {
  const counts = new Map<string, number>();
  for (const m of svg.matchAll(/(?:fill|stop-color)\s*[=:]\s*["']?\s*(#[0-9a-fA-F]{3,8})/g)) {
    const hex = normalizeHex(m[1]);
    if (hex) counts.set(hex, (counts.get(hex) ?? 0) + 1);
  }
  const ranked = [...counts.entries()]
    .map(([hex, n]) => ({ hex, n, ...analyze(hex) }))
    .filter((c) => c.lum < 0.93)
    .sort((a, b) => Number(b.sat > 0.25) - Number(a.sat > 0.25) || b.n - a.n);
  const top = ranked[0];
  return top ? { hex: top.hex, light: top.lum > 0.62 } : null;
}

export async function getPlatformBrandColor(slug: string): Promise<BrandColor | null> {
  if (slug === 'cash') return CASH_COLOR;
  if (colorCache.has(slug)) return colorCache.get(slug) ?? null;
  const markup = await getPlatformIconMarkup(slug);
  const color = markup ? dominantColor(markup) : null;
  colorCache.set(slug, color);
  return color;
}