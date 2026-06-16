'use client';

import '@/styles/sheet.css';
import '@/styles/export.css';
import { useState } from 'react';
import { useWallet } from '@/context/WalletContext';
import { getUserName } from '@/lib/storage';
import { exportFinanceReportPDF } from '@/lib/pdfExport';
import { getTodayDateStr, getMonthDateRange } from '@/lib/utils';

interface ExportSheetProps {
  onClose: () => void;
}

type RangePreset = 'this_month' | 'last_month' | 'all_time' | 'custom';

function getLastMonthRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
  const end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
  return { start, end };
}

export default function ExportSheet({ onClose }: ExportSheetProps) {
  const wallet = useWallet();
  const [preset, setPreset] = useState<RangePreset>('this_month');
  const [customStart, setCustomStart] = useState(getMonthDateRange().start);
  const [customEnd, setCustomEnd] = useState(getTodayDateStr());
  const [status, setStatus] = useState<'idle' | 'generating' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const earliestTxDate = wallet.transactions.length > 0
    ? wallet.transactions.reduce((min, t) => (t.date < min ? t.date : min), wallet.transactions[0].date)
    : getTodayDateStr();

  function resolveRange(): { start: string; end: string } {
    if (preset === 'this_month') return getMonthDateRange();
    if (preset === 'last_month') return getLastMonthRange();
    if (preset === 'all_time') return { start: earliestTxDate, end: getTodayDateStr() };
    return { start: customStart, end: customEnd };
  }

  const range = resolveRange();
  const isRangeInvalid = range.start > range.end;

  const txCountInRange = wallet.transactions.filter(
    t => t.date >= range.start && t.date <= range.end
  ).length;

  async function handleExport() {
    if (isRangeInvalid) return;
    setStatus('generating');
    setErrorMsg('');
    try {
      // Beri kesempatan UI update status "Membuat..." sebelum kerja berat sinkron
      await new Promise(resolve => setTimeout(resolve, 50));

      const state = {
        saldoPegangan: wallet.saldoPegangan,
        saldoTabungan: wallet.saldoTabungan,
        transactions: wallet.transactions,
        recurringExpenses: wallet.recurringExpenses,
        savingsGoals: wallet.savingsGoals,
      };

      exportFinanceReportPDF(state, range, getUserName());
      setStatus('done');
      setTimeout(() => setStatus('idle'), 1800);
    } catch (err) {
      console.error('Export PDF gagal:', err);
      setErrorMsg('Gagal membuat PDF. Coba lagi.');
      setStatus('error');
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-body">
          <div className="sheet-header">
            <span className="sheet-title">Export Laporan PDF</span>
            <button className="sheet-close" onClick={onClose} aria-label="Tutup">
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <p className="sheet-subtitle">
            Unduh laporan saldo, pemasukan, pengeluaran, goals, dan tagihan dalam bentuk PDF.
          </p>

          {/* PRESET RANGE */}
          <div className="form-group">
            <label className="form-label">Periode</label>
            <div className="export-preset-grid">
              <button
                className={`export-preset-btn ${preset === 'this_month' ? 'active' : ''}`}
                onClick={() => setPreset('this_month')}
              >
                Bulan Ini
              </button>
              <button
                className={`export-preset-btn ${preset === 'last_month' ? 'active' : ''}`}
                onClick={() => setPreset('last_month')}
              >
                Bulan Lalu
              </button>
              <button
                className={`export-preset-btn ${preset === 'all_time' ? 'active' : ''}`}
                onClick={() => setPreset('all_time')}
              >
                Semua Waktu
              </button>
              <button
                className={`export-preset-btn ${preset === 'custom' ? 'active' : ''}`}
                onClick={() => setPreset('custom')}
              >
                Pilih Sendiri
              </button>
            </div>
          </div>

          {/* CUSTOM RANGE PICKER */}
          {preset === 'custom' && (
            <div className="export-date-row">
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label">Dari Tanggal</label>
                <input
                  type="date"
                  className="text-input"
                  value={customStart}
                  max={customEnd}
                  onChange={(e) => setCustomStart(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label">Sampai Tanggal</label>
                <input
                  type="date"
                  className="text-input"
                  value={customEnd}
                  min={customStart}
                  max={getTodayDateStr()}
                  onChange={(e) => setCustomEnd(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* SUMMARY PREVIEW */}
          <div className={`export-range-preview ${isRangeInvalid ? 'export-range-preview-error' : ''}`}>
            {isRangeInvalid ? (
              <>
                <i className="fa-solid fa-triangle-exclamation" />
                <span>Tanggal akhir tidak boleh sebelum tanggal mulai.</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-file-pdf" />
                <span>
                  Laporan <strong>{txCountInRange}</strong> transaksi akan dibuat untuk periode{' '}
                  <strong>{formatRangeLabel(range.start)} – {formatRangeLabel(range.end)}</strong>.
                </span>
              </>
            )}
          </div>

          {/* WHAT'S INCLUDED */}
          <div className="export-included">
            <div className="export-included-title">Termasuk dalam laporan:</div>
            <ul className="export-included-list">
              <li><i className="fa-solid fa-check" /> Saldo Pegangan, Tabungan &amp; Total</li>
              <li><i className="fa-solid fa-check" /> Rincian Data Pemasukan</li>
              <li><i className="fa-solid fa-check" /> Rincian Data Pengeluaran</li>
              <li><i className="fa-solid fa-check" /> Riwayat Transfer Antar Saldo</li>
              <li><i className="fa-solid fa-check" /> Target Tabungan (Goals)</li>
              <li><i className="fa-solid fa-check" /> Tagihan &amp; Pengeluaran Rutin</li>
            </ul>
          </div>

          {status === 'error' && (
            <div className="export-error-msg">{errorMsg}</div>
          )}

          <button
            className="btn-primary"
            style={{ marginTop: 4 }}
            disabled={isRangeInvalid || status === 'generating'}
            onClick={handleExport}
          >
            {status === 'generating' && (<><i className="fa-solid fa-circle-notch fa-spin" /> Membuat PDF...</>)}
            {status === 'done' && (<><i className="fa-solid fa-check" /> PDF Terunduh</>)}
            {(status === 'idle' || status === 'error') && (<><i className="fa-solid fa-file-export" /> Export ke PDF</>)}
          </button>

          <button className="btn-ghost" onClick={onClose}>Batal</button>
        </div>
      </div>
    </div>
  );
}

function formatRangeLabel(dateStr: string): string {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    .format(new Date(dateStr + 'T00:00:00'));
}
