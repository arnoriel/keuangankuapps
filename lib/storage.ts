import {
  AppState, Transaction, IncomePeriod, WalletType,
  IncomeCategory, ExpenseCategory, RecurringExpense, SavingsGoal,
} from './types';

const KEY = 'rider_wallet_v1';

const defaultState: AppState = {
  saldoPegangan: 0,
  saldoTabungan: 0,
  transactions: [],
  recurringExpenses: [],
  savingsGoals: [],
};

export function getState(): AppState {
  if (typeof window === 'undefined') return defaultState;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw);
    return {
      ...defaultState,
      ...parsed,
      recurringExpenses: parsed.recurringExpenses ?? [],
      savingsGoals: parsed.savingsGoals ?? [],
    };
  } catch {
    return defaultState;
  }
}

export function setState(state: AppState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function addIncome(
  amount: number,
  period: IncomePeriod,
  category: IncomeCategory = 'lainnya',
  note?: string,
): AppState {
  const state = getState();
  const now = new Date();
  const tx: Transaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type: 'income',
    amount,
    wallet: 'pegangan',
    period,
    category,
    note: note?.trim() || undefined,
    date: now.toISOString().split('T')[0],
    createdAt: now.toISOString(),
  };
  const next: AppState = {
    ...state,
    saldoPegangan: state.saldoPegangan + amount,
    transactions: [tx, ...state.transactions],
  };
  setState(next);
  return next;
}

export function addExpense(
  amount: number,
  note: string,
  category: ExpenseCategory = 'lainnya',
): AppState {
  const state = getState();
  const now = new Date();
  const tx: Transaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type: 'expense',
    amount,
    wallet: 'pegangan',
    note: note.trim() || 'Pengeluaran',
    category,
    date: now.toISOString().split('T')[0],
    createdAt: now.toISOString(),
  };
  const next: AppState = {
    ...state,
    saldoPegangan: Math.max(0, state.saldoPegangan - amount),
    transactions: [tx, ...state.transactions],
  };
  setState(next);
  return next;
}

export function transferFunds(amount: number, from: WalletType, to: WalletType): AppState {
  const state = getState();
  const now = new Date();
  const toLabel = to === 'tabungan' ? 'Tabungan' : 'Pegangan';
  const txIn: Transaction = {
    id: `tx_${Date.now()}_in`,
    type: 'transfer_in',
    amount,
    wallet: to,
    note: `Transfer ke Saldo ${toLabel}`,
    date: now.toISOString().split('T')[0],
    createdAt: now.toISOString(),
  };
  const next: AppState = {
    ...state,
    saldoPegangan:
      from === 'pegangan' ? state.saldoPegangan - amount : state.saldoPegangan + amount,
    saldoTabungan:
      from === 'tabungan' ? state.saldoTabungan - amount : state.saldoTabungan + amount,
    transactions: [txIn, ...state.transactions],
  };
  setState(next);
  return next;
}

// ─── EDIT & DELETE TRANSACTION ─────────────────────────────────────────────

/**
 * Reverses the balance effect of a transaction (used before edit/delete).
 */
function reverseTransactionEffect(state: AppState, tx: Transaction): AppState {
  switch (tx.type) {
    case 'income':
      return { ...state, saldoPegangan: state.saldoPegangan - tx.amount };
    case 'expense':
      return { ...state, saldoPegangan: state.saldoPegangan + tx.amount };
    case 'transfer_in': {
      // tx.wallet = destination wallet; the other wallet is the source.
      const dest = tx.wallet;
      const source: WalletType = dest === 'pegangan' ? 'tabungan' : 'pegangan';
      return {
        ...state,
        saldoPegangan:
          dest === 'pegangan' ? state.saldoPegangan - tx.amount
          : source === 'pegangan' ? state.saldoPegangan + tx.amount
          : state.saldoPegangan,
        saldoTabungan:
          dest === 'tabungan' ? state.saldoTabungan - tx.amount
          : source === 'tabungan' ? state.saldoTabungan + tx.amount
          : state.saldoTabungan,
      };
    }
    case 'transfer_out':
      // Not currently generated, but handle defensively (mirror of transfer_in).
      return reverseTransactionEffect(state, { ...tx, type: 'transfer_in' });
    default:
      return state;
  }
}

/**
 * Applies the balance effect of a transaction (used after edit/restore).
 */
function applyTransactionEffect(state: AppState, tx: Transaction): AppState {
  switch (tx.type) {
    case 'income':
      return { ...state, saldoPegangan: state.saldoPegangan + tx.amount };
    case 'expense':
      return { ...state, saldoPegangan: state.saldoPegangan - tx.amount };
    case 'transfer_in': {
      const dest = tx.wallet;
      const source: WalletType = dest === 'pegangan' ? 'tabungan' : 'pegangan';
      return {
        ...state,
        saldoPegangan:
          dest === 'pegangan' ? state.saldoPegangan + tx.amount
          : source === 'pegangan' ? state.saldoPegangan - tx.amount
          : state.saldoPegangan,
        saldoTabungan:
          dest === 'tabungan' ? state.saldoTabungan + tx.amount
          : source === 'tabungan' ? state.saldoTabungan - tx.amount
          : state.saldoTabungan,
      };
    }
    case 'transfer_out':
      return applyTransactionEffect(state, { ...tx, type: 'transfer_in' });
    default:
      return state;
  }
}

export interface TransactionEditData {
  amount: number;
  note?: string;
  category?: IncomeCategory | ExpenseCategory;
  period?: IncomePeriod;
  date: string;
}

/**
 * Updates an existing transaction's amount/note/category/date,
 * correctly recalculating saldo by reversing the old effect and
 * applying the new one. Type & wallet remain unchanged.
 */
export function updateTransaction(id: string, data: TransactionEditData): AppState {
  const state = getState();
  const txIndex = state.transactions.findIndex(t => t.id === id);
  if (txIndex === -1) return state;

  const oldTx = state.transactions[txIndex];

  // 1. Reverse old effect on saldo
  let next = reverseTransactionEffect(state, oldTx);

  // 2. Build updated transaction
  const updatedTx: Transaction = {
    ...oldTx,
    amount: data.amount,
    note: data.note?.trim() || oldTx.note,
    category: data.category ?? oldTx.category,
    period: data.period ?? oldTx.period,
    date: data.date,
  };

  // 3. Apply new effect on saldo
  next = applyTransactionEffect(next, updatedTx);

  // 4. Replace transaction in list
  next = {
    ...next,
    transactions: next.transactions.map((t, i) => (i === txIndex ? updatedTx : t)),
  };

  setState(next);
  return next;
}

/**
 * Deletes a transaction and reverses its effect on saldo.
 */
export function deleteTransaction(id: string): AppState {
  const state = getState();
  const tx = state.transactions.find(t => t.id === id);
  if (!tx) return state;

  let next = reverseTransactionEffect(state, tx);
  next = {
    ...next,
    transactions: next.transactions.filter(t => t.id !== id),
  };

  setState(next);
  return next;
}

// ─── RECURRING EXPENSES ────────────────────────────────────────────────────
export function addRecurring(data: Omit<RecurringExpense, 'id' | 'createdAt'>): AppState {
  const state = getState();
  const rec: RecurringExpense = {
    ...data,
    id: `rec_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const next = { ...state, recurringExpenses: [rec, ...state.recurringExpenses] };
  setState(next);
  return next;
}

export function toggleRecurring(id: string): AppState {
  const state = getState();
  const next = {
    ...state,
    recurringExpenses: state.recurringExpenses.map(r =>
      r.id === id ? { ...r, active: !r.active } : r
    ),
  };
  setState(next);
  return next;
}

export function deleteRecurring(id: string): AppState {
  const state = getState();
  const next = {
    ...state,
    recurringExpenses: state.recurringExpenses.filter(r => r.id !== id),
  };
  setState(next);
  return next;
}

// ─── SAVINGS GOALS ─────────────────────────────────────────────────────────
export function addGoal(data: Omit<SavingsGoal, 'id' | 'createdAt'>): AppState {
  const state = getState();
  const goal: SavingsGoal = {
    ...data,
    id: `goal_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const next = { ...state, savingsGoals: [goal, ...state.savingsGoals] };
  setState(next);
  return next;
}

export function updateGoalAmount(id: string, currentAmount: number): AppState {
  const state = getState();
  const next = {
    ...state,
    savingsGoals: state.savingsGoals.map(g =>
      g.id === id ? { ...g, currentAmount } : g
    ),
  };
  setState(next);
  return next;
}

export function deleteGoal(id: string): AppState {
  const state = getState();
  const next = {
    ...state,
    savingsGoals: state.savingsGoals.filter(g => g.id !== id),
  };
  setState(next);
  return next;
}
