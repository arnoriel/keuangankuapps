'use client';

import '@/styles/calculator.css';
import { useState, useCallback } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────
type CalcMode = 'basic' | 'category';
type CatOperation = '+' | '-' | '×' | '÷';

interface CategoryItem {
  id: string;
  label: string;
  operation: CatOperation;
  value: string; // string so user can type freely
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatNumber(n: number): string {
  if (!isFinite(n)) return 'Error';
  // Up to 10 sig figs, strip trailing zeros
  const s = parseFloat(n.toPrecision(10)).toString();
  // Add thousand separators for the integer part
  const [int, dec] = s.split('.');
  const intFormatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return dec ? `${intFormatted},${dec}` : intFormatted;
}

function parseLocale(s: string): number {
  // Convert localized "1.000,5" → 1000.5
  return parseFloat(s.replace(/\./g, '').replace(',', '.'));
}

// ── BASIC CALCULATOR ───────────────────────────────────────────────────────────
function BasicCalc() {
  const [display, setDisplay] = useState('0');
  const [expr, setExpr] = useState('');      // expression shown above
  const [waitNext, setWaitNext] = useState(false); // after operator, next digit resets display
  const [lastOp, setLastOp] = useState('');
  const [lastVal, setLastVal] = useState(0);

  const pushDigit = (d: string) => {
    if (waitNext) {
      setDisplay(d === ',' ? '0,' : d);
      setWaitNext(false);
    } else {
      if (d === ',' && display.includes(',')) return;
      setDisplay(prev => prev === '0' && d !== ',' ? d : prev + d);
    }
  };

  const pushOp = (op: string) => {
    const cur = parseLocale(display);
    let result = cur;
    if (lastOp && !waitNext) {
      result = applyOp(lastVal, cur, lastOp);
    }
    setLastVal(result);
    setLastOp(op);
    setExpr(formatNumber(result) + ' ' + op);
    setWaitNext(true);
  };

  const applyOp = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '×': return a * b;
      case '÷': return b === 0 ? NaN : a / b;
      default: return b;
    }
  };

  const equals = () => {
    if (!lastOp) return;
    const cur = parseLocale(display);
    const result = applyOp(lastVal, cur, lastOp);
    setExpr(formatNumber(lastVal) + ' ' + lastOp + ' ' + formatNumber(cur) + ' =');
    setDisplay(formatNumber(result));
    setLastOp('');
    setLastVal(result);
    setWaitNext(true);
  };

  const clear = () => {
    setDisplay('0');
    setExpr('');
    setWaitNext(false);
    setLastOp('');
    setLastVal(0);
  };

  const toggleSign = () => {
    const n = parseLocale(display);
    setDisplay(formatNumber(-n));
  };

  const percent = () => {
    const n = parseLocale(display);
    setDisplay(formatNumber(lastVal ? (lastVal * n) / 100 : n / 100));
  };

  const backspace = () => {
    if (waitNext) return;
    setDisplay(prev => (prev.length <= 1 ? '0' : prev.slice(0, -1)));
  };

  const BUTTONS = [
    ['AC', '+/-', '%', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['⌫', '0', ',', '='],
  ];

  const handleBtn = (b: string) => {
    if ('0123456789'.includes(b)) pushDigit(b);
    else if (b === ',') pushDigit(',');
    else if (['+', '-', '×', '÷'].includes(b)) pushOp(b);
    else if (b === '=') equals();
    else if (b === 'AC') clear();
    else if (b === '+/-') toggleSign();
    else if (b === '%') percent();
    else if (b === '⌫') backspace();
  };

  const isOp = (b: string) => ['+', '-', '×', '÷', '='].includes(b);
  const isFn = (b: string) => ['AC', '+/-', '%'].includes(b);

  return (
    <div className="calc-basic">
      {/* Display */}
      <div className="calc-display">
        <div className="calc-expr">{expr || '\u00A0'}</div>
        <div className="calc-result" style={{ fontSize: display.length > 9 ? '2rem' : display.length > 6 ? '2.6rem' : '3.2rem' }}>
          {display}
        </div>
      </div>

      {/* Buttons */}
      <div className="calc-grid">
        {BUTTONS.map(row =>
          row.map(b => (
            <button
              key={b}
              className={`calc-btn ${isOp(b) ? 'calc-btn--op' : isFn(b) ? 'calc-btn--fn' : 'calc-btn--num'} ${b === '0' ? 'calc-btn--wide' : ''}`}
              onClick={() => handleBtn(b)}
            >
              {b}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ── CATEGORY CALCULATOR ────────────────────────────────────────────────────────
const OP_COLORS: Record<CatOperation, string> = {
  '+': 'var(--green-light)',
  '-': 'var(--red)',
  '×': 'var(--blue-light)',
  '÷': 'var(--orange)',
};
const OP_BG: Record<CatOperation, string> = {
  '+': 'rgba(0,201,128,0.10)',
  '-': 'rgba(224,59,59,0.10)',
  '×': 'rgba(75,123,245,0.10)',
  '÷': 'rgba(255,107,53,0.10)',
};

function CategoryCalc() {
  const [items, setItems] = useState<CategoryItem[]>([
    { id: crypto.randomUUID(), label: 'Pemasukan', operation: '+', value: '' },
    { id: crypto.randomUUID(), label: 'Pengeluaran', operation: '-', value: '' },
  ]);
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Live result
  const total = items.reduce((acc, item) => {
    const v = parseFloat(item.value.replace(/\./g, '').replace(',', '.')) || 0;
    switch (item.operation) {
      case '+': return acc + v;
      case '-': return acc - v;
      case '×': return acc * v;
      case '÷': return v === 0 ? acc : acc / v;
    }
  }, 0);

  const updateItem = (id: string, patch: Partial<CategoryItem>) =>
    setItems(prev => prev.map(it => (it.id === id ? { ...it, ...patch } : it)));

  const removeItem = (id: string) =>
    setItems(prev => prev.filter(it => it.id !== id));

  const addItem = (op: CatOperation) => {
    const labels: Record<CatOperation, string> = {
      '+': 'Pemasukan',
      '-': 'Pengeluaran',
      '×': 'Pengali',
      '÷': 'Pembagi',
    };
    setItems(prev => [...prev, { id: crypto.randomUUID(), label: labels[op], operation: op, value: '' }]);
    setShowAddMenu(false);
  };

  const formatInput = (raw: string): string => {
    // Strip non-numeric except comma
    const cleaned = raw.replace(/[^0-9,]/g, '');
    // Only one comma
    const parts = cleaned.split(',');
    const intPart = parts[0].replace(/\./g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return parts.length > 1 ? `${intPart},${parts[1]}` : intPart;
  };

  const isPositive = total >= 0;

  return (
    <div className="calc-category">
      {/* Live Result Banner */}
      <div className={`cat-result-banner ${isPositive ? 'cat-result--pos' : 'cat-result--neg'}`}>
        <div className="cat-result-label">Total Saat Ini</div>
        <div className="cat-result-value">
          {isPositive ? '+' : ''}{formatNumber(total)}
        </div>
        <div className="cat-result-sub">Dihitung secara real-time</div>
      </div>

      {/* Items */}
      <div className="cat-items">
        {items.map((item, idx) => (
          <div key={item.id} className="cat-item" style={{ '--op-color': OP_COLORS[item.operation], '--op-bg': OP_BG[item.operation] } as React.CSSProperties}>
            <div className="cat-item-header">
              <div className="cat-op-badge">{item.operation}</div>
              <input
                className="cat-label-input"
                value={item.label}
                onChange={e => updateItem(item.id, { label: e.target.value })}
                placeholder="Nama kategori"
              />
              <div className="cat-op-selector">
                {(['+', '-', '×', '÷'] as CatOperation[]).map(op => (
                  <button
                    key={op}
                    className={`cat-op-btn ${item.operation === op ? 'active' : ''}`}
                    onClick={() => updateItem(item.id, { operation: op })}
                    style={{ '--op-c': OP_COLORS[op] } as React.CSSProperties}
                  >
                    {op}
                  </button>
                ))}
              </div>
              {items.length > 1 && (
                <button className="cat-remove-btn" onClick={() => removeItem(item.id)}>
                  <i className="fa-solid fa-xmark" />
                </button>
              )}
            </div>

            <div className="cat-item-value-row">
              <span className="cat-value-prefix" style={{ color: OP_COLORS[item.operation] }}>
                {item.operation}
              </span>
              <input
                className="cat-value-input"
                type="text"
                inputMode="decimal"
                value={item.value}
                onChange={e => updateItem(item.id, { value: formatInput(e.target.value) })}
                placeholder="0"
              />
            </div>

            {/* Running subtotal hint */}
            {idx > 0 && (
              <div className="cat-running">
                {(() => {
                  const sub = items.slice(0, idx + 1).reduce((acc, it) => {
                    const v = parseFloat(it.value.replace(/\./g, '').replace(',', '.')) || 0;
                    switch (it.operation) {
                      case '+': return acc + v;
                      case '-': return acc - v;
                      case '×': return acc * v;
                      case '÷': return v === 0 ? acc : acc / v;
                    }
                  }, 0);
                  return `Subtotal: ${formatNumber(sub)}`;
                })()}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add button */}
      <div className="cat-add-wrapper">
        {showAddMenu ? (
          <div className="cat-add-menu">
            <div className="cat-add-menu-title">Tambah operasi</div>
            <div className="cat-add-menu-ops">
              {(['+', '-', '×', '÷'] as CatOperation[]).map(op => (
                <button
                  key={op}
                  className="cat-add-op-btn"
                  style={{ background: OP_BG[op], color: OP_COLORS[op], borderColor: OP_COLORS[op] }}
                  onClick={() => addItem(op)}
                >
                  <span className="cat-add-op-sym">{op}</span>
                  <span className="cat-add-op-lbl">
                    {op === '+' ? 'Tambah' : op === '-' ? 'Kurang' : op === '×' ? 'Kali' : 'Bagi'}
                  </span>
                </button>
              ))}
            </div>
            <button className="cat-add-cancel" onClick={() => setShowAddMenu(false)}>Batal</button>
          </div>
        ) : (
          <button className="cat-add-btn" onClick={() => setShowAddMenu(true)}>
            <i className="fa-solid fa-plus" />
            <span>Tambah Baris</span>
          </button>
        )}
      </div>

      {/* Reset */}
      {items.some(i => i.value !== '') && (
        <button className="cat-reset-btn" onClick={() => setItems(prev => prev.map(i => ({ ...i, value: '' })))}>
          <i className="fa-solid fa-rotate-left" /> Reset Nilai
        </button>
      )}
    </div>
  );
}

// ── PAGE ───────────────────────────────────────────────────────────────────────
export default function CalculatorPage() {
  const [mode, setMode] = useState<CalcMode>('basic');

  return (
    <div className="page calc-page">
      {/* Header */}
      <div className="calc-header">
        <h1 className="calc-title">Kalkulator</h1>
        <p className="calc-subtitle">Hitung cepat & terstruktur</p>

        {/* Mode Toggle */}
        <div className="calc-mode-toggle">
          <button
            className={`calc-mode-btn ${mode === 'basic' ? 'active' : ''}`}
            onClick={() => setMode('basic')}
          >
            <i className="fa-solid fa-calculator" />
            <span>Basic</span>
          </button>
          <button
            className={`calc-mode-btn ${mode === 'category' ? 'active' : ''}`}
            onClick={() => setMode('category')}
          >
            <i className="fa-solid fa-list-check" />
            <span>Kategori</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="calc-content">
        {mode === 'basic' ? <BasicCalc /> : <CategoryCalc />}
      </div>
    </div>
  );
}