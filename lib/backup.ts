// Backup & Restore seluruh localStorage aplikasi ke/dari file .json

const BACKUP_KEYS = [
  'rider_wallet_v1',
  'keuanganku_onboarding_done',
  'keuanganku_user_name',
  'keuanganku_pin_hash',
  'keuanganku_pin_set',
  'keuanganku_webauthn_cred_id',
  'keuanganku_webauthn_user_id',
] as const;

interface BackupFile {
  app: 'keuanganku';
  version: 1;
  exportedAt: string;
  data: Record<string, string>;
}

export function exportBackup(): void {
  const data: Record<string, string> = {};
  for (const key of BACKUP_KEYS) {
    const value = localStorage.getItem(key);
    if (value !== null) data[key] = value;
  }

  const payload: BackupFile = {
    app: 'keuanganku',
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `keuanganku-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface BackupPreview {
  exportedAt: string;
  transactionCount: number;
  userName: string;
}

export class InvalidBackupError extends Error {}

function parseBackup(raw: string): BackupFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new InvalidBackupError('File bukan format JSON yang valid.');
  }
  const p = parsed as Partial<BackupFile>;
  if (!p || p.app !== 'keuanganku' || typeof p.data !== 'object' || p.data === null) {
    throw new InvalidBackupError('File ini bukan file backup Keuanganku.');
  }
  return p as BackupFile;
}

export function readBackupFile(file: File): Promise<{ backup: BackupFile; preview: BackupPreview }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const backup = parseBackup(String(reader.result));
        let transactionCount = 0;
        try {
          const wallet = JSON.parse(backup.data['rider_wallet_v1'] ?? '{}');
          transactionCount = Array.isArray(wallet.transactions) ? wallet.transactions.length : 0;
        } catch { /* noop */ }

        resolve({
          backup,
          preview: {
            exportedAt: backup.exportedAt,
            transactionCount,
            userName: backup.data['keuanganku_user_name'] ?? '',
          },
        });
      } catch (err) {
        reject(err instanceof InvalidBackupError ? err : new InvalidBackupError('Gagal membaca file backup.'));
      }
    };
    reader.onerror = () => reject(new InvalidBackupError('Gagal membaca file.'));
    reader.readAsText(file);
  });
}

export function restoreBackup(backup: { data: Record<string, string> }): void {
  // Hapus dulu semua key lama yang dikelola aplikasi supaya tidak ada sisa data
  for (const key of BACKUP_KEYS) localStorage.removeItem(key);
  // Tulis ulang dari backup
  for (const [key, value] of Object.entries(backup.data)) {
    localStorage.setItem(key, value);
  }
}
