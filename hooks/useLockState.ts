import { useState, useEffect, useCallback } from 'react';

const SESSION_UNLOCKED_KEY = 'keuanganku_session_unlocked';

/**
 * Hook untuk mengatur lock state berdasarkan lifecycle app:
 * - Kalau app di-background tapi PROCESS masih jalan → tetap unlocked
 * - Kalau process dihapus (killed) → saat buka ulang harus unlock lagi
 *
 * Cara kerja:
 * - sessionStorage dipakai sebagai penanda "session ini sudah unlock"
 * - sessionStorage otomatis HAPUS ketika tab/proses ditutup (beda sama localStorage)
 * - Kalau app di-kill, sessionStorage hilang → harus unlock lagi
 * - Kalau hanya background (visibilitychange), sessionStorage masih ada → skip lock
 */
export function useLockState() {
  const [isLocked, setIsLocked] = useState<boolean | null>(null); // null = loading

  useEffect(() => {
    const sessionUnlocked = sessionStorage.getItem(SESSION_UNLOCKED_KEY) === 'true';
    if (sessionUnlocked) {
      setIsLocked(false);
    } else {
      setIsLocked(true);
    }
  }, []);

  const handleUnlocked = useCallback(() => {
    sessionStorage.setItem(SESSION_UNLOCKED_KEY, 'true');
    setIsLocked(false);
  }, []);

  return { isLocked, handleUnlocked };
}
