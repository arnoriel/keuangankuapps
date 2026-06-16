import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AppState, Transaction } from './types';
import {
  formatRupiah, getIncomeCategory, getExpenseCategory,
  recurringFrequencyLabel,
} from './utils';

export interface ExportRange {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

const BRAND = '#5B6AF0';
const GREEN = '#10b981';
const RED = '#ef4444';
const GRAY = '#6b7280';
const DARK = '#111827';

function fmtDate(d: string): string {
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date(d + 'T00:00:00'));
}

function fmtDateTimeNow(): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date());
}

function txTypeLabel(t: Transaction): string {
  switch (t.type) {
    case 'income': return 'Pemasukan';
    case 'expense': return 'Pengeluaran';
    case 'transfer_in': return 'Transfer Masuk';
    case 'transfer_out': return 'Transfer Keluar';
    default: return t.type;
  }
}

function txCategoryLabel(t: Transaction): string {
  if (t.type === 'income') return getIncomeCategory(t.category as string).label;
  if (t.type === 'expense') return getExpenseCategory(t.category as string).label;
  return '-';
}

function walletLabel(w: string): string {
  return w === 'tabungan' ? 'Tabungan' : 'Pegangan';
}

/**
 * Generate full PDF financial report for the given date range, then trigger
 * a download. All data is read from local AppState — nothing leaves the device.
 */
export function exportFinanceReportPDF(state: AppState, range: ExportRange, userName: string): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 40;
  let y = 50;

  const txInRange = state.transactions
    .filter(t => t.date >= range.start && t.date <= range.end)
    .sort((a, b) => (a.date === b.date ? a.createdAt.localeCompare(b.createdAt) : a.date.localeCompare(b.date)));

  const totalIncome = txInRange
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = txInRange
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalTransferIn = txInRange
    .filter(t => t.type === 'transfer_in')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalTransferOut = txInRange
    .filter(t => t.type === 'transfer_out')
    .reduce((sum, t) => sum + t.amount, 0);
  const netCashflow = totalIncome - totalExpense;

  // ── HEADER ──────────────────────────────────────────────────────────────
  doc.setFillColor(BRAND);
  doc.rect(0, 0, pageWidth, 86, 'F');

  doc.setTextColor('#ffffff');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Laporan Keuangan', marginX, 38);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Keuanganku', marginX, 56);

  doc.setFontSize(9);
  doc.text(`Periode: ${fmtDate(range.start)} — ${fmtDate(range.end)}`, marginX, 72);

  doc.setFontSize(9);
  const rightText = userName ? `Atas nama: ${userName}` : '';
  if (rightText) {
    doc.text(rightText, pageWidth - marginX, 56, { align: 'right' });
  }
  doc.text(`Dibuat: ${fmtDateTimeNow()}`, pageWidth - marginX, 72, { align: 'right' });

  y = 110;

  // ── SECTION: SALDO ──────────────────────────────────────────────────────
  doc.setTextColor(DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Ringkasan Saldo', marginX, y);
  y += 10;

  const cardW = (pageWidth - marginX * 2 - 16) / 3;
  const cards: { label: string; value: number; color: string }[] = [
    { label: 'Saldo Pegangan', value: state.saldoPegangan, color: GRAY },
    { label: 'Saldo Tabungan', value: state.saldoTabungan, color: GRAY },
    { label: 'Saldo Total', value: state.saldoPegangan + state.saldoTabungan, color: BRAND },
  ];

  cards.forEach((c, i) => {
    const x = marginX + i * (cardW + 8);
    doc.setDrawColor('#e5e7eb');
    doc.setFillColor('#f9fafb');
    doc.roundedRect(x, y, cardW, 50, 6, 6, 'FD');
    doc.setTextColor(GRAY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(c.label, x + 10, y + 18);
    doc.setTextColor(c.color === BRAND ? BRAND : DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.text(formatRupiah(c.value), x + 10, y + 36);
  });

  y += 68;

  // ── SECTION: RINGKASAN PERIODE ─────────────────────────────────────────
  doc.setTextColor(DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`Ringkasan Periode (${fmtDate(range.start)} - ${fmtDate(range.end)})`, marginX, y);
  y += 10;

  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX },
    theme: 'plain',
    styles: { fontSize: 9.5, cellPadding: 5 },
    head: [['Ringkasan', 'Jumlah']],
    headStyles: { fillColor: '#111827', textColor: '#ffffff', fontStyle: 'bold' },
    body: [
      ['Total Pemasukan', formatRupiah(totalIncome)],
      ['Total Pengeluaran', formatRupiah(totalExpense)],
      ['Total Transfer Masuk', formatRupiah(totalTransferIn)],
      ['Total Transfer Keluar', formatRupiah(totalTransferOut)],
      ['Selisih Kas (Pemasukan - Pengeluaran)', formatRupiah(netCashflow)],
      ['Jumlah Transaksi', `${txInRange.length} transaksi`],
    ],
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    didParseCell: (data) => {
      if (data.row.index === 4 && data.column.index === 1) {
        data.cell.styles.textColor = netCashflow >= 0 ? GREEN : RED;
      }
    },
  });

  // @ts-expect-error - lastAutoTable is attached by the plugin at runtime
  y = doc.lastAutoTable.finalY + 26;

  // ── SECTION: DATA PEMASUKAN ─────────────────────────────────────────────
  const incomeTx = txInRange.filter(t => t.type === 'income');
  y = ensureSpace(doc, y, 60);
  doc.setTextColor(DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Data Pemasukan', marginX, y);
  y += 8;

  if (incomeTx.length > 0) {
    autoTable(doc, {
      startY: y,
      margin: { left: marginX, right: marginX },
      styles: { fontSize: 8.5, cellPadding: 5 },
      headStyles: { fillColor: GREEN, textColor: '#ffffff', fontStyle: 'bold' },
      head: [['Tanggal', 'Kategori', 'Periode', 'Catatan', 'Jumlah']],
      body: incomeTx.map(t => [
        fmtDate(t.date),
        txCategoryLabel(t),
        t.period === 'harian' ? 'Harian' : t.period === 'bulanan' ? 'Bulanan' : '-',
        t.note || '-',
        formatRupiah(t.amount),
      ]),
      columnStyles: { 4: { halign: 'right' } },
      foot: [['', '', '', 'Total', formatRupiah(totalIncome)]],
      footStyles: { fillColor: '#ecfdf5', textColor: DARK, fontStyle: 'bold' },
    });
    // @ts-expect-error - lastAutoTable runtime field
    y = doc.lastAutoTable.finalY + 26;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(GRAY);
    doc.text('Tidak ada data pemasukan pada periode ini.', marginX, y + 14);
    y += 34;
  }

  // ── SECTION: DATA PENGELUARAN ────────────────────────────────────────────
  const expenseTx = txInRange.filter(t => t.type === 'expense');
  y = ensureSpace(doc, y, 60);
  doc.setTextColor(DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Data Pengeluaran', marginX, y);
  y += 8;

  if (expenseTx.length > 0) {
    autoTable(doc, {
      startY: y,
      margin: { left: marginX, right: marginX },
      styles: { fontSize: 8.5, cellPadding: 5 },
      headStyles: { fillColor: RED, textColor: '#ffffff', fontStyle: 'bold' },
      head: [['Tanggal', 'Kategori', 'Catatan', 'Jumlah']],
      body: expenseTx.map(t => [
        fmtDate(t.date),
        txCategoryLabel(t),
        t.note || '-',
        formatRupiah(t.amount),
      ]),
      columnStyles: { 3: { halign: 'right' } },
      foot: [['', '', 'Total', formatRupiah(totalExpense)]],
      footStyles: { fillColor: '#fef2f2', textColor: DARK, fontStyle: 'bold' },
    });
    // @ts-expect-error - lastAutoTable runtime field
    y = doc.lastAutoTable.finalY + 26;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(GRAY);
    doc.text('Tidak ada data pengeluaran pada periode ini.', marginX, y + 14);
    y += 34;
  }

  // ── SECTION: TRANSFER ANTAR SALDO ────────────────────────────────────────
  const transferTx = txInRange.filter(t => t.type === 'transfer_in' || t.type === 'transfer_out');
  if (transferTx.length > 0) {
    y = ensureSpace(doc, y, 60);
    doc.setTextColor(DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Riwayat Transfer Antar Saldo', marginX, y);
    y += 8;

    autoTable(doc, {
      startY: y,
      margin: { left: marginX, right: marginX },
      styles: { fontSize: 8.5, cellPadding: 5 },
      headStyles: { fillColor: BRAND, textColor: '#ffffff', fontStyle: 'bold' },
      head: [['Tanggal', 'Jenis', 'Tujuan/Sumber', 'Catatan', 'Jumlah']],
      body: transferTx.map(t => [
        fmtDate(t.date),
        txTypeLabel(t),
        walletLabel(t.wallet),
        t.note || '-',
        formatRupiah(t.amount),
      ]),
      columnStyles: { 4: { halign: 'right' } },
    });
    // @ts-expect-error - lastAutoTable runtime field
    y = doc.lastAutoTable.finalY + 26;
  }

  // ── SECTION: TARGET TABUNGAN (GOALS) ─────────────────────────────────────
  y = ensureSpace(doc, y, 60);
  doc.setTextColor(DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Target Tabungan (Goals)', marginX, y);
  y += 8;

  if (state.savingsGoals.length > 0) {
    autoTable(doc, {
      startY: y,
      margin: { left: marginX, right: marginX },
      styles: { fontSize: 8.5, cellPadding: 5 },
      headStyles: { fillColor: '#a855f7', textColor: '#ffffff', fontStyle: 'bold' },
      head: [['Goal', 'Target', 'Terkumpul', 'Progres', 'Deadline']],
      body: state.savingsGoals.map(g => {
        const pct = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0;
        return [
          `${g.emoji} ${g.label}`,
          formatRupiah(g.targetAmount),
          formatRupiah(g.currentAmount),
          `${pct}%`,
          g.deadline ? fmtDate(g.deadline) : '-',
        ];
      }),
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
    });
    // @ts-expect-error - lastAutoTable runtime field
    y = doc.lastAutoTable.finalY + 26;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(GRAY);
    doc.text('Belum ada target tabungan.', marginX, y + 14);
    y += 34;
  }

  // ── SECTION: TAGIHAN RUTIN (RECURRING) ───────────────────────────────────
  y = ensureSpace(doc, y, 60);
  doc.setTextColor(DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Tagihan & Pengeluaran Rutin', marginX, y);
  y += 8;

  if (state.recurringExpenses.length > 0) {
    autoTable(doc, {
      startY: y,
      margin: { left: marginX, right: marginX },
      styles: { fontSize: 8.5, cellPadding: 5 },
      headStyles: { fillColor: '#f59e0b', textColor: '#ffffff', fontStyle: 'bold' },
      head: [['Tagihan', 'Kategori', 'Jadwal', 'Status', 'Jumlah']],
      body: state.recurringExpenses.map(r => [
        r.label,
        getExpenseCategory(r.category).label,
        recurringFrequencyLabel(r),
        r.active ? 'Aktif' : 'Nonaktif',
        formatRupiah(r.amount),
      ]),
      columnStyles: { 4: { halign: 'right' } },
    });
    // @ts-expect-error - lastAutoTable runtime field
    y = doc.lastAutoTable.finalY + 10;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(GRAY);
    doc.text('Belum ada tagihan rutin.', marginX, y + 14);
  }

  // ── FOOTER (page numbers) ────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(GRAY);
    doc.text('Dibuat otomatis oleh aplikasi Keuanganku', marginX, pageH - 24);
    doc.text(`Halaman ${i} dari ${pageCount}`, pageWidth - marginX, pageH - 24, { align: 'right' });
  }

  const fileName = `Laporan-Keuangan_${range.start}_${range.end}.pdf`;
  doc.save(fileName);
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed > pageHeight - 50) {
    doc.addPage();
    return 50;
  }
  return y;
}
