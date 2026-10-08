// ===================================================
// KEUANGANKU — Theme Engine
// ===================================================

export const THEME_KEY = 'keuanganku_theme_id';
export const THEME_CUSTOM_KEY = 'keuanganku_theme_custom';

export type ThemeId =
  | 'default' | 'cobarado' | 'wobieru' | 'sofereihn'
  | 'nocturne' | 'emberlune' | 'verdantis' | 'crimzora'
  | 'custom';

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
  'border', 'border-2',
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
  { label: 'Border', keys: ['border', 'border-2'] },
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
  'border': 'Border Utama',
  'border-2': 'Border Tegas',
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
  'border': 'rgba(0, 0, 0, 0.07)', 'border-2': 'rgba(0, 0, 0, 0.11)',
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
  'border': 'rgba(74, 40, 20, 0.09)', 'border-2': 'rgba(74, 40, 20, 0.15)',
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
  'border': 'rgba(40, 30, 90, 0.08)', 'border-2': 'rgba(40, 30, 90, 0.13)',
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
  'border': 'rgba(10, 40, 35, 0.08)', 'border-2': 'rgba(10, 40, 35, 0.13)',
};

// ── DARK THEMES ─────────────────────────────────────────────────────────

// Nocturne — dark default, biru-ungu deep space
const NOCTURNE_VARS: ThemeVars = {
  'bg-page': '#0B0E1A', 'bg-card': '#141830', 'bg-card-2': '#1B2040',
  'bg-elevated': '#232A4D', 'bg-modal': '#141830', 'bg-input': '#1B2040',
  'brand': '#7C8CFF', 'brand-dark': '#5B6AF0', 'brand-light': '#9CA8FF',
  'accent': '#FF7A8A', 'accent-dark': '#E14D62',
  'green': '#34D399', 'green-dark': '#10B981', 'green-light': '#6EE7B7',
  'red': '#F87171', 'red-dark': '#EF4444',
  'orange': '#FBBF24', 'orange-dark': '#F59E0B',
  'card-green-a': '#14B88A', 'card-green-b': '#0A5C46',
  'card-blue-a': '#7C8CFF', 'card-blue-b': '#3A47C7',
  'text-1': '#F1F3FC', 'text-2': '#C7CCE6', 'text-3': '#8A90B8', 'text-4': '#565C85',
  'border': 'rgba(255, 255, 255, 0.09)', 'border-2': 'rgba(255, 255, 255, 0.16)',
};

// Emberlune — dark hangat, ember/amber di atas charcoal
const EMBERLUNE_VARS: ThemeVars = {
  'bg-page': '#181310', 'bg-card': '#241D18', 'bg-card-2': '#2C231C',
  'bg-elevated': '#382C23', 'bg-modal': '#241D18', 'bg-input': '#2C231C',
  'brand': '#F5934B', 'brand-dark': '#D9722B', 'brand-light': '#FFAC6E',
  'accent': '#FF6B5C', 'accent-dark': '#E0483A',
  'green': '#8BC98A', 'green-dark': '#65A864', 'green-light': '#AEDE9E',
  'red': '#F0665A', 'red-dark': '#D34638',
  'orange': '#FBBF24', 'orange-dark': '#E0A21A',
  'card-green-a': '#C97A2E', 'card-green-b': '#7A4713',
  'card-blue-a': '#F5934B', 'card-blue-b': '#B85E20',
  'text-1': '#FBF1E8', 'text-2': '#E2CFBE', 'text-3': '#A8937F', 'text-4': '#6E5B4C',
  'border': 'rgba(255, 220, 190, 0.09)', 'border-2': 'rgba(255, 220, 190, 0.16)',
};

// Verdantis — dark hijau-teal (emerald di kegelapan)
const VERDANTIS_VARS: ThemeVars = {
  'bg-page': '#0A1512', 'bg-card': '#0F1F1A', 'bg-card-2': '#142822',
  'bg-elevated': '#1B342B', 'bg-modal': '#0F1F1A', 'bg-input': '#142822',
  'brand': '#2DD4A7', 'brand-dark': '#14B88A', 'brand-light': '#5EE8C4',
  'accent': '#F5C452', 'accent-dark': '#D9A22E',
  'green': '#4ADE80', 'green-dark': '#22C55E', 'green-light': '#86EFAC',
  'red': '#F26D6D', 'red-dark': '#DC4646',
  'orange': '#F5A952', 'orange-dark': '#D9852E',
  'card-green-a': '#1CAE84', 'card-green-b': '#0A5C43',
  'card-blue-a': '#2DD4A7', 'card-blue-b': '#12816A',
  'text-1': '#EAFBF4', 'text-2': '#BFE3D4', 'text-3': '#7FA695', 'text-4': '#4C6A5D',
  'border': 'rgba(200, 255, 230, 0.08)', 'border-2': 'rgba(200, 255, 230, 0.15)',
};

// Crimzora — dark merah marun elegan
const CRIMZORA_VARS: ThemeVars = {
  'bg-page': '#170B0D', 'bg-card': '#230F13', 'bg-card-2': '#2B1418',
  'bg-elevated': '#391A20', 'bg-modal': '#230F13', 'bg-input': '#2B1418',
  'brand': '#E0546A', 'brand-dark': '#C0304A', 'brand-light': '#F0798C',
  'accent': '#F5A15C', 'accent-dark': '#D97F35',
  'green': '#4ADE94', 'green-dark': '#22B871', 'green-light': '#7FEBB2',
  'red': '#F2536A', 'red-dark': '#D6304A',
  'orange': '#F0A24F', 'orange-dark': '#D2812A',
  'card-green-a': '#B33A4E', 'card-green-b': '#651E29',
  'card-blue-a': '#E0546A', 'card-blue-b': '#8A2B3C',
  'text-1': '#FBEBEE', 'text-2': '#E3C3C9', 'text-3': '#A98890', 'text-4': '#6E555B',
  'border': 'rgba(255, 210, 215, 0.09)', 'border-2': 'rgba(255, 210, 215, 0.16)',
};

export interface ThemePreset {
  id: ThemeId;
  name: string;
  description: string;
  vars: ThemeVars;
  isDark: boolean;
}

export const THEME_PRESETS: ThemePreset[] = [
  // Light themes
  { id: 'default', name: 'Default', description: 'Skema warna bawaan Keuanganku', vars: DEFAULT_VARS, isDark: false },
  { id: 'cobarado', name: 'Cobarado', description: 'Nuansa hangat terracotta & sunset', vars: COBARADO_VARS, isDark: false },
  { id: 'wobieru', name: 'Wobieru', description: 'Nuansa dingin indigo & lavender', vars: WOBIERU_VARS, isDark: false },
  { id: 'sofereihn', name: 'Sofereihn', description: 'Nuansa elegan teal & slate', vars: SOFEREIHN_VARS, isDark: false },
  // Dark themes
  { id: 'nocturne', name: 'Nocturne', description: 'Dark default, biru-ungu deep space', vars: NOCTURNE_VARS, isDark: true },
  { id: 'emberlune', name: 'Emberlune', description: 'Dark hangat, ember/amber di atas charcoal', vars: EMBERLUNE_VARS, isDark: true },
  { id: 'verdantis', name: 'Verdantis', description: 'Dark hijau-teal, emerald di kegelapan', vars: VERDANTIS_VARS, isDark: true },
  { id: 'crimzora', name: 'Crimzora', description: 'Dark merah marun elegan', vars: CRIMZORA_VARS, isDark: true },
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

// ─── QUICK DARK MODE TOGGLE ──────────────────────────────────────────────
// Toggle cepat di Menu (terpisah dari full Theme Customizer). Mengingat
// preset light terakhir dipakai supaya toggle balik ke light tidak selalu
// jatuh ke "default" kalau user sebelumnya pakai preset light lain.
const LAST_LIGHT_KEY = 'keuanganku_last_light_theme';
const LAST_DARK_KEY = 'keuanganku_last_dark_theme';

export function isCurrentThemeDark(): boolean {
  const id = getActiveThemeId();
  if (id === 'custom') {
    // Custom theme dianggap dark kalau bg-page-nya gelap (heuristik luminance).
    const vars = getCustomVars();
    return isColorDark(vars['bg-page']);
  }
  return getPreset(id).isDark;
}

function isColorDark(hex: string): boolean {
  const m = hex.replace('#', '');
  if (m.length < 6) return false;
  const r = parseInt(m.substring(0, 2), 16);
  const g = parseInt(m.substring(2, 4), 16);
  const b = parseInt(m.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}

/** Toggle antara mode terang & gelap, mengingat preset terakhir tiap mode. */
export function toggleDarkMode(): ThemeId {
  const currentId = getActiveThemeId();
  const currentlyDark = isCurrentThemeDark();

  if (currentlyDark) {
    // Simpan preset dark saat ini, lalu pindah ke preset light terakhir
    try { localStorage.setItem(LAST_DARK_KEY, currentId); } catch { /* noop */ }
    const lastLight = (() => {
      try { return localStorage.getItem(LAST_LIGHT_KEY) as ThemeId | null; }
      catch { return null; }
    })();
    const nextId: ThemeId = lastLight && THEME_PRESETS.some((p) => p.id === lastLight && !p.isDark)
      ? lastLight
      : 'default';
    setActiveThemeId(nextId);
    applyActiveTheme();
    return nextId;
  } else {
    try { localStorage.setItem(LAST_LIGHT_KEY, currentId); } catch { /* noop */ }
    const lastDark = (() => {
      try { return localStorage.getItem(LAST_DARK_KEY) as ThemeId | null; }
      catch { return null; }
    })();
    const nextId: ThemeId = lastDark && THEME_PRESETS.some((p) => p.id === lastDark && p.isDark)
      ? lastDark
      : 'nocturne';
    setActiveThemeId(nextId);
    applyActiveTheme();
    return nextId;
  }
}

// Sinkronkan meta[name=theme-color] dengan bg-page tema aktif, supaya
// status bar (PWA/mobile browser) ikut berubah warna sesuai tema —
// bukan cuma konten di dalam app.
export function syncThemeColorMeta(): void {
  if (typeof document === 'undefined') return;
  const bgPage = getComputedStyle(document.documentElement).getPropertyValue('--bg-page').trim();
  if (!bgPage) return;
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', bgPage);

  // Native status bar (Capacitor APK/IPA) tidak baca meta theme-color —
  // harus di-set eksplisit lewat @capacitor/status-bar.
  syncNativeStatusBar(bgPage, isCurrentThemeDark());
}

// Update warna & style (light/dark icon) status bar native, no-op kalau
// bukan native platform (web/PWA) atau plugin belum ke-load.
function syncNativeStatusBar(bgColor: string, isDark: boolean): void {
  const w = window as any;
  const Capacitor = w?.Capacitor;
  if (!Capacitor?.isNativePlatform?.()) return;

  const StatusBar = Capacitor.Plugins?.StatusBar;
  if (!StatusBar) return;

  try {
    StatusBar.setBackgroundColor({ color: bgColor });
    // Style.Dark = teks/ikon status bar putih (dipakai saat background gelap)
    // Style.Light = teks/ikon status bar hitam (dipakai saat background terang)
    StatusBar.setStyle({ style: isDark ? 'DARK' : 'LIGHT' });
  } catch {
    /* noop — plugin belum siap / platform tidak didukung */
  }
}

// ─── APPLY TO DOM ────────────────────────────────────────────────────────
export function applyVarsToElement(el: HTMLElement, vars: ThemeVars): void {
  THEME_VARS.forEach((key) => {
    el.style.setProperty(`--${key}`, vars[key]);
  });
  // Flag mode untuk styling CSS yang beda antara light/dark (mis. bottom nav).
  el.dataset.themeMode = isColorDark(vars['bg-page']) ? 'dark' : 'light';
}

export function applyActiveTheme(): void {
  if (typeof document === 'undefined') return;
  applyVarsToElement(document.documentElement, getActiveVars());
  syncThemeColorMeta();
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
    var bg = String(vars['bg-page'] || '').replace('#', '');
    var lum = bg.length >= 6
      ? (0.299 * parseInt(bg.substr(0, 2), 16) + 0.587 * parseInt(bg.substr(2, 2), 16) + 0.114 * parseInt(bg.substr(4, 2), 16)) / 255
      : 1;
    el.setAttribute('data-theme-mode', lum < 0.5 ? 'dark' : 'light');
    var metaTag = document.querySelector('meta[name="theme-color"]');
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.setAttribute('name', 'theme-color');
      document.head.appendChild(metaTag);
    }
    metaTag.setAttribute('content', vars['bg-page']);
  } catch (e) {}
})();
`.trim();
}