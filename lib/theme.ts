// ===================================================
// KEUANGANKU — Theme Engine
// ===================================================

export const THEME_KEY = 'keuanganku_theme_id';
export const THEME_CUSTOM_KEY = 'keuanganku_theme_custom';

export type ThemeId = 'default' | 'cobarado' | 'wobieru' | 'sofereihn' | 'custom';

// Vars yang bisa di-customize user (subset penting, cukup buat ganti "nuansa"
// tanpa merusak kontras/readability).
export const THEME_VARS = [
  'bg-page', 'bg-card', 'bg-card-2', 'bg-elevated', 'bg-modal', 'bg-input',
  'brand', 'brand-dark', 'brand-light',
  'accent', 'accent-dark',
  'green', 'green-dark', 'green-light',
  'red', 'red-dark',
  'orange', 'orange-dark',
  'card-green-a', 'card-green-b', 'card-blue-a', 'card-blue-b',
  'text-1', 'text-2', 'text-3', 'text-4',
] as const;

export type ThemeVarKey = typeof THEME_VARS[number];
export type ThemeVars = Record<ThemeVarKey, string>;

export interface ThemeGroup {
  label: string;
  keys: ThemeVarKey[];
}

// Grouping buat UI customizer (biar rapi, per kategori komponen/fungsi warna)
export const THEME_GROUPS: ThemeGroup[] = [
  { label: 'Latar Belakang', keys: ['bg-page', 'bg-card', 'bg-card-2', 'bg-elevated', 'bg-modal', 'bg-input'] },
  { label: 'Warna Utama (Brand)', keys: ['brand', 'brand-dark', 'brand-light'] },
  { label: 'Aksen', keys: ['accent', 'accent-dark'] },
  { label: 'Pemasukan (Hijau)', keys: ['green', 'green-dark', 'green-light'] },
  { label: 'Pengeluaran (Merah)', keys: ['red', 'red-dark'] },
  { label: 'Highlight (Oranye)', keys: ['orange', 'orange-dark'] },
  { label: 'Kartu Dompet', keys: ['card-green-a', 'card-green-b', 'card-blue-a', 'card-blue-b'] },
  { label: 'Teks', keys: ['text-1', 'text-2', 'text-3', 'text-4'] },
];

export const VAR_LABELS: Record<ThemeVarKey, string> = {
  'bg-page': 'Background Halaman',
  'bg-card': 'Background Kartu',
  'bg-card-2': 'Background Kartu Alt',
  'bg-elevated': 'Background Elevated',
  'bg-modal': 'Background Modal/Sheet',
  'bg-input': 'Background Input',
  'brand': 'Brand',
  'brand-dark': 'Brand Gelap',
  'brand-light': 'Brand Terang',
  'accent': 'Aksen',
  'accent-dark': 'Aksen Gelap',
  'green': 'Hijau',
  'green-dark': 'Hijau Gelap',
  'green-light': 'Hijau Terang',
  'red': 'Merah',
  'red-dark': 'Merah Gelap',
  'orange': 'Oranye',
  'orange-dark': 'Oranye Gelap',
  'card-green-a': 'Kartu Hijau A',
  'card-green-b': 'Kartu Hijau B',
  'card-blue-a': 'Kartu Biru A',
  'card-blue-b': 'Kartu Biru B',
  'text-1': 'Teks Utama',
  'text-2': 'Teks Sekunder',
  'text-3': 'Teks Tersier',
  'text-4': 'Teks Pudar',
};

// === PRESET DEFINITIONS ===

const DEFAULT_VARS: ThemeVars = {
  'bg-page': '#F6F7FB', 'bg-card': '#FFFFFF', 'bg-card-2': '#F1F3FA',
  'bg-elevated': '#E8ECF4', 'bg-modal': '#FFFFFF', 'bg-input': '#F1F3FA',
  'brand': '#5B6AF0', 'brand-dark': '#3A47C7', 'brand-light': '#7A87FF',
  'accent': '#FF6B6B', 'accent-dark': '#D94444',
  'green': '#10B981', 'green-dark': '#059669', 'green-light': '#34D399',
  'red': '#EF4444', 'red-dark': '#DC2626',
  'orange': '#F59E0B', 'orange-dark': '#D97706',
  'card-green-a': '#0EA070', 'card-green-b': '#065F46',
  'card-blue-a': '#5B6AF0', 'card-blue-b': '#2D3ABF',
  'text-1': '#111827', 'text-2': '#374151', 'text-3': '#6B7280', 'text-4': '#9CA3AF',
};

// Cobarado — nuansa hangat terracotta/sunset, tetap terang & jelas
const COBARADO_VARS: ThemeVars = {
  'bg-page': '#FBF7F3', 'bg-card': '#FFFFFF', 'bg-card-2': '#F7EFE7',
  'bg-elevated': '#F0E2D3', 'bg-modal': '#FFFFFF', 'bg-input': '#F7EFE7',
  'brand': '#E8703A', 'brand-dark': '#B8501F', 'brand-light': '#F28F5E',
  'accent': '#D9455F', 'accent-dark': '#A82E44',
  'green': '#3F9A6E', 'green-dark': '#2E7A54', 'green-light': '#63BB90',
  'red': '#D9455F', 'red-dark': '#A82E44',
  'orange': '#E0A32E', 'orange-dark': '#B87F1B',
  'card-green-a': '#3F9A6E', 'card-green-b': '#245B3D',
  'card-blue-a': '#E8703A', 'card-blue-b': '#B8501F',
  'text-1': '#2A1E16', 'text-2': '#4E3D30', 'text-3': '#8A7565', 'text-4': '#BBA994',
};

// Wobieru — nuansa dingin biru-ungu (indigo/lavender), kalem & elegan
const WOBIERU_VARS: ThemeVars = {
  'bg-page': '#F3F4FB', 'bg-card': '#FFFFFF', 'bg-card-2': '#EAEBF7',
  'bg-elevated': '#DEDFF2', 'bg-modal': '#FFFFFF', 'bg-input': '#EAEBF7',
  'brand': '#7C5CFF', 'brand-dark': '#5734D9', 'brand-light': '#9C82FF',
  'accent': '#3ABAD9', 'accent-dark': '#1F8FAB',
  'green': '#22B8A0', 'green-dark': '#158A78', 'green-light': '#5CD6C0',
  'red': '#E85D8A', 'red-dark': '#C13B67',
  'orange': '#C79BFF', 'orange-dark': '#9A67E0',
  'card-green-a': '#22B8A0', 'card-green-b': '#127A6A',
  'card-blue-a': '#7C5CFF', 'card-blue-b': '#4A2FBD',
  'text-1': '#1D1B2E', 'text-2': '#3D3A55', 'text-3': '#78748F', 'text-4': '#ACA9C2',
};

// Sofereihn — nuansa gelap-elegan slate/emerald, kontras kuat
const SOFEREIHN_VARS: ThemeVars = {
  'bg-page': '#F2F5F4', 'bg-card': '#FFFFFF', 'bg-card-2': '#E6EDEB',
  'bg-elevated': '#D8E3E0', 'bg-modal': '#FFFFFF', 'bg-input': '#E6EDEB',
  'brand': '#0F766E', 'brand-dark': '#0A544E', 'brand-light': '#14958A',
  'accent': '#C2410C', 'accent-dark': '#932F09',
  'green': '#16A34A', 'green-dark': '#0E7A38', 'green-light': '#4ADE80',
  'red': '#DC2626', 'red-dark': '#A81E1E',
  'orange': '#CA8A04', 'orange-dark': '#9A6903',
  'card-green-a': '#16A34A', 'card-green-b': '#0A5C2A',
  'card-blue-a': '#0F766E', 'card-blue-b': '#0A443F',
  'text-1': '#101816', 'text-2': '#2E3E3A', 'text-3': '#647A73', 'text-4': '#9BB0AA',
};

export interface ThemePreset {
  id: ThemeId;
  name: string;
  description: string;
  vars: ThemeVars;
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: 'default', name: 'Default', description: 'Skema warna bawaan Keuanganku', vars: DEFAULT_VARS },
  { id: 'cobarado', name: 'Cobarado', description: 'Nuansa hangat terracotta & sunset', vars: COBARADO_VARS },
  { id: 'wobieru', name: 'Wobieru', description: 'Nuansa dingin indigo & lavender', vars: WOBIERU_VARS },
  { id: 'sofereihn', name: 'Sofereihn', description: 'Nuansa elegan teal & slate', vars: SOFEREIHN_VARS },
];

export function getPreset(id: Exclude<ThemeId, 'custom'>): ThemePreset {
  return THEME_PRESETS.find((p) => p.id === id) ?? THEME_PRESETS[0];
}

// ─── STORAGE ─────────────────────────────────────────────────────────────
export function getActiveThemeId(): ThemeId {
  try {
    const id = localStorage.getItem(THEME_KEY) as ThemeId | null;
    if (id && THEME_PRESETS.some((p) => p.id === id)) return id;
    if (id === 'custom') return 'custom';
    return 'default';
  } catch {
    return 'default';
  }
}

export function getCustomVars(): ThemeVars {
  try {
    const raw = localStorage.getItem(THEME_CUSTOM_KEY);
    if (raw) return { ...DEFAULT_VARS, ...JSON.parse(raw) };
  } catch { /* noop */ }
  return { ...DEFAULT_VARS };
}

export function saveCustomVars(vars: ThemeVars): void {
  try { localStorage.setItem(THEME_CUSTOM_KEY, JSON.stringify(vars)); } catch { /* noop */ }
}

export function setActiveThemeId(id: ThemeId): void {
  try { localStorage.setItem(THEME_KEY, id); } catch { /* noop */ }
}

export function getActiveVars(): ThemeVars {
  const id = getActiveThemeId();
  if (id === 'custom') return getCustomVars();
  return getPreset(id).vars;
}

// ─── APPLY TO DOM ────────────────────────────────────────────────────────
export function applyVarsToElement(el: HTMLElement, vars: ThemeVars): void {
  THEME_VARS.forEach((key) => {
    el.style.setProperty(`--${key}`, vars[key]);
  });
}

export function applyActiveTheme(): void {
  if (typeof document === 'undefined') return;
  applyVarsToElement(document.documentElement, getActiveVars());
}

// Script string untuk di-inject inline di <head> agar tema langsung
// ter-apply sebelum React hydrate (no flash of default theme).
export function getInlineThemeScript(): string {
  return `
(function() {
  try {
    var THEME_KEY = ${JSON.stringify(THEME_KEY)};
    var CUSTOM_KEY = ${JSON.stringify(THEME_CUSTOM_KEY)};
    var PRESETS = ${JSON.stringify(
      THEME_PRESETS.reduce((acc, p) => ({ ...acc, [p.id]: p.vars }), {} as Record<string, ThemeVars>)
    )};
    var id = localStorage.getItem(THEME_KEY) || 'default';
    var vars;
    if (id === 'custom') {
      var raw = localStorage.getItem(CUSTOM_KEY);
      vars = raw ? Object.assign({}, PRESETS.default, JSON.parse(raw)) : PRESETS.default;
    } else {
      vars = PRESETS[id] || PRESETS.default;
    }
    var el = document.documentElement;
    for (var k in vars) { el.style.setProperty('--' + k, vars[k]); }
  } catch (e) {}
})();
`.trim();
}