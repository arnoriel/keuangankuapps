'use client';

import '@/styles/sheet.css';
import '@/styles/backup.css';
import { useRef, useState } from 'react';
import {
  exportBackup, readBackupFile, restoreBackup,
  InvalidBackupError, type BackupPreview,
} from '@/lib/backup';

interface BackupSheetProps {
  onClose: () => void;
  onRestored: () => void;
}

type Stage = 'menu' | 'confirm_restore' | 'restoring' | 'done';

export default function BackupSheet({ onClose, onRestored }: BackupSheetProps) {
  const [stage, setStage] = useState<Stage>('menu');
  const [error, setError] = useState('');
  const [exportedMsg, setExportedMsg] = useState(false);
  const [preview, setPreview] = useState<BackupPreview | null>(null);
  const [pendingBackup, setPendingBackup] = useState<Parameters<typeof restoreBackup>[0] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleExport() {
    try {
      exportBackup();
      setExportedMsg(true);
      setTimeout(() => setExportedMsg(false), 2000);
    } catch {
      setError('Gagal membuat file backup.');
    }
  }

  function handlePickFile() {
    setError('');
    fileInputRef.current?.click();
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // reset supaya bisa pilih file yang sama lagi
    if (!file) return;

    try {
      const { backup, preview } = await readBackupFile(file);
      setPreview(preview);
      setPendingBackup(backup);
      setStage('confirm_restore');
    } catch (err) {
      setError(err instanceof InvalidBackupError ? err.message : 'Gagal membaca file backup.');
    }
  }

  function handleConfirmRestore() {
    if (!pendingBackup) return;
    setStage('restoring');
    try {
      restoreBackup(pendingBackup);
      setStage('done');
    } catch {
      setError('Gagal memulihkan data.');
      setStage('menu');
    }
  }

  function handleFinishRestore() {
    onRestored();
  }

  return (
    <div className="overlay" onClick={stage === 'restoring' ? undefined : onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-body">
          <div className="sheet-header">
            <span className="sheet-title">
              {stage === 'confirm_restore' ? 'Konfirmasi Pulihkan Data' : 'Backup & Restore Data'}
            </span>
            {stage === 'menu' && (
              <button className="sheet-close" onClick={onClose} aria-label="Tutup">
                <i className="fa-solid fa-xmark" />
              </button>
            )}
          </div>

          {stage === 'menu' && (
            <>
              <p className="sheet-subtitle">
                Simpan seluruh data aplikasi (saldo, transaksi, goals, tagihan, pengaturan) ke file backup,
                atau pulihkan dari file backup sebelumnya.
              </p>

              {error && (
                <div className="backup-error-msg">
                  <i className="fa-solid fa-circle-exclamation" /> {error}
                </div>
              )}

              {exportedMsg && (
                <div className="backup-success-msg">
                  <i className="fa-solid fa-check" /> File backup berhasil diunduh.
                </div>
              )}

              <button className="backup-action-row" onClick={handleExport} style={{ width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <div className="backup-action-icon backup-action-icon-export">
                  <i className="fa-solid fa-download" />
                </div>
                <div className="backup-action-body">
                  <div className="backup-action-title">Export Data (Backup)</div>
                  <div className="backup-action-sub">Unduh semua data sebagai file .json</div>
                </div>
                <i className="fa-solid fa-chevron-right menu-item-chevron" />
              </button>

              <button className="backup-action-row" onClick={handlePickFile} style={{ width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <div className="backup-action-icon backup-action-icon-import">
                  <i className="fa-solid fa-upload" />
                </div>
                <div className="backup-action-body">
                  <div className="backup-action-title">Import Data (Restore)</div>
                  <div className="backup-action-sub">Pulihkan data dari file backup .json</div>
                </div>
                <i className="fa-solid fa-chevron-right menu-item-chevron" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                style={{ display: 'none' }}
                onChange={handleFileSelected}
              />

              <button className="btn-ghost" onClick={onClose}>Tutup</button>
            </>
          )}

          {stage === 'confirm_restore' && preview && (
            <>
              <div className="backup-warning">
                <i className="fa-solid fa-triangle-exclamation" />
                <span>Semua data saat ini akan ditimpa oleh data dari file backup ini. Tindakan ini tidak bisa dibatalkan.</span>
              </div>

              <div className="backup-preview">
                <div className="backup-preview-row">
                  <span>Tanggal backup</span>
                  <span>{formatDate(preview.exportedAt)}</span>
                </div>
                <div className="backup-preview-row">
                  <span>Nama pengguna</span>
                  <span>{preview.userName || '-'}</span>
                </div>
                <div className="backup-preview-row">
                  <span>Jumlah transaksi</span>
                  <span>{preview.transactionCount}</span>
                </div>
              </div>

              {error && (
                <div className="backup-error-msg">
                  <i className="fa-solid fa-circle-exclamation" /> {error}
                </div>
              )}

              <button className="btn-primary" onClick={handleConfirmRestore}>
                <i className="fa-solid fa-rotate" /> Ya, Pulihkan Data
              </button>
              <button className="btn-ghost" onClick={() => setStage('menu')}>Batal</button>
            </>
          )}

          {stage === 'restoring' && (
            <div className="backup-preview" style={{ textAlign: 'center', padding: 24 }}>
              <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: 20 }} />
              <div style={{ marginTop: 8 }}>Memulihkan data...</div>
            </div>
          )}

          {stage === 'done' && (
            <>
              <div className="backup-success-msg" style={{ fontSize: 14 }}>
                <i className="fa-solid fa-circle-check" /> Data berhasil dipulihkan.
              </div>
              <p className="sheet-subtitle">Aplikasi perlu dimuat ulang agar data terbaru tampil.</p>
              <button className="btn-primary" onClick={handleFinishRestore}>
                <i className="fa-solid fa-arrow-rotate-right" /> Muat Ulang Aplikasi
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
