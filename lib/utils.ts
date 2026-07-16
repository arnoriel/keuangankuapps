/**
 * Returns YYYY-MM-DD using the browser's LOCAL date components.
 * IMPORTANT: never use `date.toISOString().split('T')[0]` for local dates —
 * toISOString() converts to UTC first, which shifts the date by a day
 * whenever local time is behind/ahead of UTC (e.g. WIB/GMT+7 at night).
 */
export function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatRupiahShort(amount: number): string {
  if (amount >= 1_000_000_000) return `Rp ${(amount / 1_000_000_000).toFixed(1)}M`;
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)}jt`;
  if (amount >= 1_000) return `Rp ${(amount / 1_000).toFixed(0)}rb`;
  return formatRupiah(amount);
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

export function formatDateAndTime(iso: string): string {
  const date = new Date(iso);
  const dateStr = toLocalDateStr(date);
  const today = toLocalDateStr(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toLocalDateStr(yesterday);

  let dateLabel = '';
  if (dateStr === today) dateLabel = 'Hari Ini';
  else if (dateStr === yesterdayStr) dateLabel = 'Kemarin';
  else {
    dateLabel = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric', month: 'short', year: '2-digit',
    }).format(date);
  }

  const time = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit', minute: '2-digit',
  }).format(date);
  return `${dateLabel}, ${time}`;
}

export function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const t = toLocalDateStr(today);
  const y = toLocalDateStr(yesterday);

  if (dateStr === t) return 'Hari Ini';
  if (dateStr === y) return 'Kemarin';

  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(date);
}

export function getTodayDateStr(): string {
  return toLocalDateStr(new Date());
}

export function getMonthDateRange(): { start: string; end: string } {
  const now = new Date();
  const start = toLocalDateStr(new Date(now.getFullYear(), now.getMonth(), 1));
  const end = toLocalDateStr(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  return { start, end };
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Selamat Malam';
  if (h < 11) return 'Selamat Pagi';
  if (h < 15) return 'Selamat Siang';
  if (h < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

export function formatFullDate(dateStr: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(dateStr + 'T00:00:00'));
}

export function parseAmountInput(raw: string): number {
  const cleaned = raw.replace(/[^\d]/g, '');
  return parseInt(cleaned, 10) || 0;
}

// ─── INCOME CATEGORY HELPERS ──────────────────────────────────────────────
export const INCOME_CATEGORIES = [
  { key: 'gaji',      label: 'Gaji',      icon: 'fa-briefcase',              color: '#10b981' },
  { key: 'freelance', label: 'Freelance', icon: 'fa-laptop',                 color: '#6366f1' },
  { key: 'driver',    label: 'Driver',    icon: 'fa-motorcycle',             color: '#22c55e' },
  { key: 'jualan',    label: 'Jualan',    icon: 'fa-store',                  color: '#f59e0b' },
  { key: 'tunjangan', label: 'Tunjangan', icon: 'fa-hand-holding-dollar',    color: '#3b82f6' },
  { key: 'pasif',     label: 'Pasif',     icon: 'fa-chart-line',             color: '#a855f7' },
  { key: 'lainnya',   label: 'Lainnya',   icon: 'fa-ellipsis',               color: '#6b7280' },
] as const;

export const EXPENSE_CATEGORIES = [
  { key: 'bensin',   label: 'Bensin',       icon: 'fa-gas-pump',             color: '#f97316' },
  { key: 'makan',    label: 'Makan',        icon: 'fa-utensils',             color: '#eab308' },
  { key: 'utang',    label: 'Utang',        icon: 'fa-hand-holding-dollar',  color: '#ef4444' },
  { key: 'belanja',  label: 'Belanja',      icon: 'fa-bag-shopping',         color: '#ec4899' },
  { key: 'hiburan',  label: 'Hiburan',      icon: 'fa-gamepad',              color: '#8b5cf6' },
  { key: 'lainnya',  label: 'Lainnya',      icon: 'fa-ellipsis',             color: '#6b7280' },
] as const;

export function getIncomeCategory(key?: string) {
  return INCOME_CATEGORIES.find(c => c.key === key) ?? INCOME_CATEGORIES[6];
}

export function getExpenseCategory(key?: string) {
  return EXPENSE_CATEGORIES.find(c => c.key === key) ?? EXPENSE_CATEGORIES[5];
}

// ─── RECURRING HELPERS ───────────────────────────────────────────────────
const DOW_LABELS = ['', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export function getNextDueDate(rec: { frequency: 'weekly' | 'monthly'; dueDay: number }): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (rec.frequency === 'monthly') {
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), rec.dueDay);
    if (thisMonth >= today) return toLocalDateStr(thisMonth);
    return toLocalDateStr(new Date(today.getFullYear(), today.getMonth() + 1, rec.dueDay));
  } else {
    // dueDay 1=Mon..7=Sun → JS getDay 0=Sun..6=Sat
    const targetDow = rec.dueDay === 7 ? 0 : rec.dueDay;
    let diff = targetDow - today.getDay();
    if (diff <= 0) diff += 7;
    const next = new Date(today);
    next.setDate(today.getDate() + diff);
    return toLocalDateStr(next);
  }
}

export function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function recurringFrequencyLabel(rec: { frequency: 'weekly' | 'monthly'; dueDay: number }): string {
  if (rec.frequency === 'monthly') return `Setiap tgl ${rec.dueDay}`;
  return `Setiap ${DOW_LABELS[rec.dueDay]}`;
}

// ─── MONTH HELPERS ────────────────────────────────────────────────────────
export function getMonthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' })
    .format(new Date(year, month, 1));
}

export function getMonthRange(year: number, month: number): { start: string; end: string } {
  const start = toLocalDateStr(new Date(year, month, 1));
  const end = toLocalDateStr(new Date(year, month + 1, 0));
  return { start, end };
}