'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { formatRupiah, formatRupiahShort, toLocalDateStr } from '@/lib/utils';
import { Transaction } from '@/lib/types';

// ─── Types ─────────────────────────────────────────────────────────────────
type RangeKey = '1M' | '1B' | '3B' | '1T' | '5T' | 'ALL';

interface PricePoint { t: number; v: number; label: string; }

const RANGES: { key: RangeKey; label: string }[] = [
  { key: '1M', label: '1M' },
  { key: '1B', label: '1B' },
  { key: '3B', label: '3B' },
  { key: '1T', label: '1T' },
  { key: '5T', label: '5T' },
  { key: 'ALL', label: 'ALL' },
];

// ─── Helpers ───────────────────────────────────────────────────────────────
function startOfDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }

// Combined-wallet (pegangan + tabungan) delta for a single transaction.
// NOTE: 'transfer_in' represents an internal move between the two wallets
// (see lib/storage.ts transferFunds/applyTransactionEffect) — it changes the
// split between wallets but NOT the combined total, so its net effect on the
// portfolio total is 0. Only 'income' and 'expense' actually move the total.
function combinedDelta(tx: Transaction): number {
  switch (tx.type) {
    case 'income': return tx.amount;
    case 'expense': return -tx.amount;
    // Manual balance correction (see editSaldo in lib/storage.ts) — amount
    // is signed (can be negative), representing the actual change applied.
    case 'adjustment': return tx.amount;
    case 'transfer_in':
    case 'transfer_out':
    default:
      return 0;
  }
}

function buildDailySeries(transactions: Transaction[], initialSaldo: number): PricePoint[] {
  const today = startOfDay(new Date());
  if (transactions.length === 0) {
    return [{ t: today.getTime(), v: initialSaldo, label: 'Hari ini' }];
  }
  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
  const firstDate = startOfDay(new Date(sorted[0].date));

  // Aggregate each day's net effect on the COMBINED total using the same
  // rules as the reducer in lib/storage.ts (transfers net to 0).
  const dailyDelta: Record<string, number> = {};
  let totalDeltaAcrossTx = 0;
  for (const tx of sorted) {
    const delta = combinedDelta(tx);
    dailyDelta[tx.date] = (dailyDelta[tx.date] ?? 0) + delta;
    totalDeltaAcrossTx += delta;
  }

  // Walk forward from the balance BEFORE the first transaction's day,
  // derived by subtracting the total known delta from the current saldo.
  // (editSaldo corrections aren't tracked as tx deltas, so this anchors
  // correctly to "today" and distributes the rest by actual daily flow.)
  const startingBalance = initialSaldo - totalDeltaAcrossTx;

  const points: PricePoint[] = [];
  let bal = startingBalance;
  const cursor = new Date(firstDate);
  const dayMs = 86400000;

  while (cursor.getTime() <= today.getTime()) {
    const key = toLocalDateStr(cursor);
    bal += dailyDelta[key] ?? 0;
    points.push({
      t: cursor.getTime(),
      v: bal,
      label: new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(cursor),
    });
    cursor.setTime(cursor.getTime() + dayMs);
  }
  if (points.length === 0 || points[points.length - 1].t !== today.getTime()) {
    points.push({ t: today.getTime(), v: initialSaldo, label: 'Hari ini' });
  } else {
    points[points.length - 1].v = initialSaldo;
  }
  return points;
}

function filterRange(series: PricePoint[], range: RangeKey): PricePoint[] {
  if (series.length === 0) return series;
  const lastT = series[series.length - 1].t;
  const dayMs = 86400000;
  let cutoff = 0;
  switch (range) {
    case '1M': cutoff = lastT - 7 * dayMs; break;
    case '1B': cutoff = lastT - 30 * dayMs; break;
    case '3B': cutoff = lastT - 90 * dayMs; break;
    case '1T': cutoff = lastT - 365 * dayMs; break;
    case '5T': cutoff = lastT - 5 * 365 * dayMs; break;
    case 'ALL': return series;
  }
  const filtered = series.filter(p => p.t >= cutoff);
  return filtered.length >= 2 ? filtered : series.slice(-2);
}

// downsample to keep SVG light on long ranges
function downsample(series: PricePoint[], maxPoints = 90): PricePoint[] {
  if (series.length <= maxPoints) return series;
  const step = Math.ceil(series.length / maxPoints);
  const out: PricePoint[] = [];
  for (let i = 0; i < series.length; i += step) out.push(series[i]);
  if (out[out.length - 1] !== series[series.length - 1]) out.push(series[series.length - 1]);
  return out;
}

// ─── Component ─────────────────────────────────────────────────────────────
export default function PortfolioCard({ transactions, totalSaldo }: {
  transactions: Transaction[];
  totalSaldo: number;
}) {
  const [range, setRange] = useState<RangeKey>('1B');
  const [scrubIndex, setScrubIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const fullSeries = useMemo(() => buildDailySeries(transactions, totalSaldo), [transactions, totalSaldo]);
  const series = useMemo(() => downsample(filterRange(fullSeries, range)), [fullSeries, range]);

  const W = 320, H = 150, PAD_X = 4, PAD_TOP = 14, PAD_BOTTOM = 8;

  const { pathD, areaD, points, minV, maxV } = useMemo(() => {
    if (series.length < 2) {
      const only = series[0]?.v ?? 0;
      return { pathD: '', areaD: '', points: [] as { x: number; y: number; p: PricePoint }[], minV: only, maxV: only };
    }
    const vals = series.map(p => p.v);
    let minV = Math.min(...vals);
    let maxV = Math.max(...vals);
    if (minV === maxV) { minV -= 1; maxV += 1; }
    const range = maxV - minV;
    const innerW = W - PAD_X * 2;
    const innerH = H - PAD_TOP - PAD_BOTTOM;

    const pts = series.map((p, i) => {
      const x = PAD_X + (i / (series.length - 1)) * innerW;
      const y = PAD_TOP + innerH - ((p.v - minV) / range) * innerH;
      return { x, y, p };
    });

    let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
    for (let i = 1; i < pts.length; i++) d += ` L ${pts[i].x.toFixed(2)} ${pts[i].y.toFixed(2)}`;

    const area = `${d} L ${pts[pts.length - 1].x.toFixed(2)} ${H} L ${pts[0].x.toFixed(2)} ${H} Z`;

    return { pathD: d, areaD: area, points: pts, minV, maxV };
  }, [series]);

  const activeIdx = scrubIndex !== null ? Math.min(scrubIndex, points.length - 1) : points.length - 1;
  const activePoint = points[activeIdx]?.p ?? series[series.length - 1];
  const baseValue = series[0]?.v ?? totalSaldo;
  const displayValue = activePoint?.v ?? totalSaldo;
  const diff = displayValue - baseValue;
  const diffPct = baseValue !== 0 ? (diff / Math.abs(baseValue)) * 100 : 0;
  const isUp = diff >= 0;

  const handleMove = useCallback((clientX: number) => {
    const svg = svgRef.current;
    if (!svg || points.length === 0) return;
    const rect = svg.getBoundingClientRect();
    const relX = ((clientX - rect.left) / rect.width) * W;
    let closest = 0, closestDist = Infinity;
    points.forEach((pt, i) => {
      const dist = Math.abs(pt.x - relX);
      if (dist < closestDist) { closestDist = dist; closest = i; }
    });
    setScrubIndex(closest);
  }, [points]);

  const clearScrub = useCallback(() => setScrubIndex(null), []);

  return (
    <section className="analytics-section">
      <div className="section-header">
        <span className="section-label">
          <i className="fa-solid fa-chart-line" style={{ color: 'var(--brand)', marginRight: 6 }} />
          Portofolioku
        </span>
      </div>

      <div className="portfolio-card">
        <div className="portfolio-header">
          <div className="portfolio-value">{formatRupiah(Math.round(displayValue))}</div>
          <div className={`portfolio-diff ${isUp ? 'up' : 'down'}`}>
            <i className={`fa-solid ${isUp ? 'fa-arrow-up' : 'fa-arrow-down'}`} />
            {formatRupiah(Math.round(Math.abs(diff)))} ({Math.abs(diffPct).toFixed(2)}%)
            <span className="portfolio-diff-period">
              {scrubIndex !== null ? activePoint?.label : RANGES.find(r => r.key === range)?.label}
            </span>
          </div>
        </div>

        <div className="portfolio-chart-wrap">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            width="100%"
            height={H}
            className="portfolio-svg"
            onMouseMove={(e) => handleMove(e.clientX)}
            onMouseLeave={clearScrub}
            onTouchStart={(e) => handleMove(e.touches[0].clientX)}
            onTouchMove={(e) => { e.preventDefault(); handleMove(e.touches[0].clientX); }}
            onTouchEnd={clearScrub}
          >
            <defs>
              <linearGradient id="pfGradientFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.35" />
                <stop offset="60%" stopColor="var(--brand)" stopOpacity="0.08" />
                <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="pfLineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--brand-light)" />
                <stop offset="100%" stopColor="var(--brand)" />
              </linearGradient>
            </defs>

            {areaD && <path d={areaD} fill="url(#pfGradientFill)" />}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke="url(#pfLineGradient)"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {scrubIndex !== null && points[activeIdx] && (
              <g>
                <line
                  x1={points[activeIdx].x} y1={PAD_TOP}
                  x2={points[activeIdx].x} y2={H - PAD_BOTTOM}
                  stroke="var(--brand)" strokeWidth={1} strokeDasharray="3 3" opacity={0.5}
                />
                <circle cx={points[activeIdx].x} cy={points[activeIdx].y} r={5} fill="var(--brand)" stroke="#fff" strokeWidth={2} />
              </g>
            )}
          </svg>
        </div>

        <div className="portfolio-range-selector">
          {RANGES.map(r => (
            <button
              key={r.key}
              className={`portfolio-range-btn ${range === r.key ? 'active' : ''}`}
              onClick={() => { setRange(r.key); setScrubIndex(null); }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}