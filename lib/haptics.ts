// ===================================================
// KEUANGANKU — Haptics Wrapper
// Aman dipanggil di web (no-op) maupun native (Capacitor).
// Dynamic import supaya build tetap jalan walau plugin belum
// terpasang di lingkungan tertentu (mis. web-only dev server).
// ===================================================

type ImpactStyleName = 'Light' | 'Medium' | 'Heavy';
type NotificationTypeName = 'Success' | 'Warning' | 'Error';

let cachedHaptics: typeof import('@capacitor/haptics') | null | undefined;

async function loadHaptics() {
  if (cachedHaptics !== undefined) return cachedHaptics;
  try {
    // Hanya berguna di native (Android/iOS via Capacitor).
    if (typeof window === 'undefined' || !(window as any).Capacitor?.isNativePlatform?.()) {
      cachedHaptics = null;
      return null;
    }
    cachedHaptics = await import('@capacitor/haptics');
    return cachedHaptics;
  } catch {
    cachedHaptics = null;
    return null;
  }
}

async function impact(style: ImpactStyleName) {
  const mod = await loadHaptics();
  if (!mod) return;
  try {
    await mod.Haptics.impact({ style: mod.ImpactStyle[style] });
  } catch { /* noop — device tanpa haptic engine */ }
}

async function notification(type: NotificationTypeName) {
  const mod = await loadHaptics();
  if (!mod) return;
  try {
    await mod.Haptics.notification({ type: mod.NotificationType[type] });
  } catch { /* noop */ }
}

async function selectionChanged() {
  const mod = await loadHaptics();
  if (!mod) return;
  try {
    await mod.Haptics.selectionChanged();
  } catch { /* noop */ }
}

export const haptics = {
  /** Sentuhan ringan — tap tombol biasa, ganti slide carousel */
  light: () => impact('Light'),
  /** Sentuhan medium — konfirmasi aksi (submit, transfer) */
  medium: () => impact('Medium'),
  /** Sentuhan kuat — aksi penting/destruktif */
  heavy: () => impact('Heavy'),
  /** Feedback sukses (mis. transaksi berhasil disimpan) */
  success: () => notification('Success'),
  /** Feedback warning (mis. saldo tidak cukup) */
  warning: () => notification('Warning'),
  /** Feedback error */
  error: () => notification('Error'),
  /** Feedback halus untuk perubahan pilihan (swipe/scroll snap) */
  selection: () => selectionChanged(),
};
