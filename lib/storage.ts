import {
  AppState, Transaction, IncomePeriod, WalletType,
  IncomeCategory, ExpenseCategory, RecurringExpense, SavingsGoal,
  Account, AccountView,
} from './types';
import { toLocalDateStr } from './utils';

// Key data akun utama dipertahankan agar data lama tetap terbaca (tanpa migrasi).
// Akun tambahan memakai key `${KEY}__<accountId>`.
const KEY = 'rider_wallet_v1';
export const ACCOUNT_DATA_PREFIX = `${KEY}__`;
export const ACCOUNTS_KEY        = 'keuanganku_accounts';
export const ACTIVE_ACCOUNT_KEY  = 'keuanganku_active_account';
export const MAIN_ACCOUNT_ID     = 'main';
export const MAX_ACCOUNTS        = 10; // termasuk akun utama


// ─── ONBOARDING ────────────────────────────────────────────────────────────
const ONBOARDING_DONE_KEY = 'keuanganku_onboarding_done';
const USER_NAME_KEY       = 'keuanganku_user_name';

export function isOnboardingComplete(): boolean {
  try { return localStorage.getItem(ONBOARDING_DONE_KEY) === 'true'; }
  catch { return false; }
}

/** Nama akun yang sedang aktif (akun utama → nama profil, akun lain → nama akun). */
export function getUserName(): string {
  try {
    const id = getActiveAccountId();
    if (id === MAIN_ACCOUNT_ID) return localStorage.getItem(USER_NAME_KEY) ?? '';
    return readSubAccounts().find(a => a.id === id)?.name ?? '';
  } catch { return ''; }
}

/** Ubah nama akun yang sedang aktif. */
export function setUserName(name: string): void {
  try {
    const trimmed = name.trim();
    const id = getActiveAccountId();
    if (id === MAIN_ACCOUNT_ID) { localStorage.setItem(USER_NAME_KEY, trimmed); return; }
    writeSubAccounts(readSubAccounts().map(a => (a.id === id ? { ...a, name: trimmed } : a)));
  } catch { /* noop */ }
}

// ─── MULTI ACCOUNT ─────────────────────────────────────────────────────────

function readSubAccounts(): Account[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? '[]');
    return Array.isArray(parsed)
      ? parsed.filter((a): a is Account => !!a && typeof a.id === 'string' && typeof a.name === 'string')
      : [];
  } catch { return []; }
}

function writeSubAccounts(accounts: Account[]): void {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function walletKey(accountId: string): string {
  return accountId === MAIN_ACCOUNT_ID ? KEY : `${ACCOUNT_DATA_PREFIX}${accountId}`;
}

/** ID akun aktif. Jika akun yang tersimpan sudah tidak ada, otomatis kembali ke akun utama. */
export function getActiveAccountId(): string {
  if (typeof window === 'undefined') return MAIN_ACCOUNT_ID;
  try {
    const id = localStorage.getItem(ACTIVE_ACCOUNT_KEY);
    if (id && id !== MAIN_ACCOUNT_ID && readSubAccounts().some(a => a.id === id)) return id;
  } catch { /* noop */ }
  return MAIN_ACCOUNT_ID;
}

/** Semua akun — akun utama selalu pertama. */
export function listAccounts(): AccountView[] {
  const main: AccountView = {
    id: MAIN_ACCOUNT_ID,
    name: (typeof window !== 'undefined' && localStorage.getItem(USER_NAME_KEY)) || 'Akun Utama',
    createdAt: '',
    isMain: true,
  };
  if (typeof window === 'undefined') return [main];
  return [main, ...readSubAccounts().map(a => ({ ...a, isMain: false }))];
}

export function switchAccount(id: string): void {
  if (!listAccounts().some(a => a.id === id)) return;
  localStorage.setItem(ACTIVE_ACCOUNT_KEY, id);
}

export type AccountNameError = 'empty' | 'duplicate' | 'limit' | null;

export function validateAccountName(name: string): AccountNameError {
  const trimmed = name.trim();
  if (!trimmed) return 'empty';
  if (listAccounts().length >= MAX_ACCOUNTS) return 'limit';
  const lower = trimmed.toLowerCase();
  if (listAccounts().some(a => a.name.trim().toLowerCase() === lower)) return 'duplicate';
  return null;
}

/** Buat akun baru + saldo awal, lalu langsung aktifkan. Mengembalikan null jika nama tidak valid. */
export function createAccount(name: string, saldoPegangan: number, saldoTabungan: number): Account | null {
  if (validateAccountName(name)) return null;
  const account: Account = {
    id: `acc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: name.trim(),
    createdAt: new Date().toISOString(),
  };
  writeSubAccounts([...readSubAccounts(), account]);
  localStorage.setItem(
    walletKey(account.id),
    JSON.stringify({ ...defaultState, saldoPegangan, saldoTabungan }),
  );
  localStorage.setItem(ACTIVE_ACCOUNT_KEY, account.id);
  return account;
}

/** Hapus akun tambahan beserta seluruh datanya. Akun utama tidak bisa dihapus. */
export function deleteAccount(id: string): void {
  if (id === MAIN_ACCOUNT_ID) return;
  const wasActive = getActiveAccountId() === id;
  writeSubAccounts(readSubAccounts().filter(a => a.id !== id));
  localStorage.removeItem(walletKey(id));
  if (wasActive) localStorage.setItem(ACTIVE_ACCOUNT_KEY, MAIN_ACCOUNT_ID);
}

/** Total saldo (pegangan + tabungan) sebuah akun — untuk ringkasan di daftar akun. */
export function getAccountTotal(id: string): number {
  const st = readState(id);
  return st.saldoPegangan + st.saldoTabungan;
}

export function saveOnboarding(
  name: string,
  saldoPegangan: number,
  saldoTabungan: number,
): AppState {
  localStorage.setItem(USER_NAME_KEY, name.trim());
  localStorage.setItem(ONBOARDING_DONE_KEY, 'true');
  localStorage.setItem(ACTIVE_ACCOUNT_KEY, MAIN_ACCOUNT_ID); // onboarding selalu untuk akun utama

  // Tulis saldo awal ke AppState
  const state = getState();
  const next: AppState = {
    ...state,
    saldoPegangan,
    saldoTabungan,
  };
  setState(next);
  return next;
}

// ─── STATE ─────────────────────────────────────────────────────────────────

const defaultState: AppState = {
  saldoPegangan: 0,
  saldoTabungan: 0,
  transactions: [],
  recurringExpenses: [],
  savingsGoals: [],
};

function readState(accountId: string): AppState {
  if (typeof window === 'undefined') return defaultState;
  try {
    const raw = localStorage.getItem(walletKey(accountId));
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

/** State akun yang sedang aktif. */
export function getState(): AppState {
  return readState(getActiveAccountId());
}

export function setState(state: AppState): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(walletKey(getActiveAccountId()), JSON.stringify(state));
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
    date: toLocalDateStr(now),
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
  wallet: WalletType = 'pegangan',
): AppState {
  const state = getState();
  const now = new Date();
  const tx: Transaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type: 'expense',
    amount,
    wallet,
    note: note.trim() || 'Pengeluaran',
    category,
    date: toLocalDateStr(now),
    createdAt: now.toISOString(),
  };
  const next: AppState = {
    ...state,
    saldoPegangan: wallet === 'pegangan' ? Math.max(0, state.saldoPegangan - amount) : state.saldoPegangan,
    saldoTabungan: wallet === 'tabungan' ? Math.max(0, state.saldoTabungan - amount) : state.saldoTabungan,
    transactions: [tx, ...state.transactions],
  };
  setState(next);
  return next;
}

// ─── EDIT SALDO (KOREKSI NOMINAL MANUAL) ───────────────────────────────────
// Dipakai saat user salah input saldo pegangan/tabungan dan ingin
// mengoreksi nominalnya secara langsung, tanpa membuat transaksi baru.
export function editSaldo(wallet: WalletType, newAmount: number): AppState {
  const state = getState();
  const safeAmount = Math.max(0, Math.round(newAmount));
  const oldAmount = wallet === 'pegangan' ? state.saldoPegangan : state.saldoTabungan;
  const delta = safeAmount - oldAmount;
  const now = new Date();

  // Record the correction as a transaction (amount can be negative) so the
  // portfolio history chart can account for manual balance edits instead of
  // silently absorbing them into the series' starting point.
  const txs = delta !== 0
    ? [{
        id: `tx_${Date.now()}_adj`,
        type: 'adjustment' as const,
        amount: delta,
        wallet,
        note: 'Koreksi saldo manual',
        date: toLocalDateStr(now),
        createdAt: now.toISOString(),
      }, ...state.transactions]
    : state.transactions;

  const next: AppState = {
    ...state,
    saldoPegangan: wallet === 'pegangan' ? safeAmount : state.saldoPegangan,
    saldoTabungan: wallet === 'tabungan' ? safeAmount : state.saldoTabungan,
    transactions: txs,
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
    date: toLocalDateStr(now),
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

function reverseTransactionEffect(state: AppState, tx: Transaction): AppState {
  switch (tx.type) {
    case 'income':
      return { ...state, saldoPegangan: state.saldoPegangan - tx.amount };
    case 'expense':
      return {
        ...state,
        saldoPegangan: tx.wallet === 'pegangan' ? state.saldoPegangan + tx.amount : state.saldoPegangan,
        saldoTabungan: tx.wallet === 'tabungan' ? state.saldoTabungan + tx.amount : state.saldoTabungan,
      };
    case 'transfer_in': {
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
      return reverseTransactionEffect(state, { ...tx, type: 'transfer_in' });
    default:
      return state;
  }
}

function applyTransactionEffect(state: AppState, tx: Transaction): AppState {
  switch (tx.type) {
    case 'income':
      return { ...state, saldoPegangan: state.saldoPegangan + tx.amount };
    case 'expense':
      return {
        ...state,
        saldoPegangan: tx.wallet === 'pegangan' ? state.saldoPegangan - tx.amount : state.saldoPegangan,
        saldoTabungan: tx.wallet === 'tabungan' ? state.saldoTabungan - tx.amount : state.saldoTabungan,
      };
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
  wallet?: WalletType;
  date: string;
}

export function updateTransaction(id: string, data: TransactionEditData): AppState {
  const state = getState();
  const txIndex = state.transactions.findIndex(t => t.id === id);
  if (txIndex === -1) return state;

  const oldTx = state.transactions[txIndex];
  let next = reverseTransactionEffect(state, oldTx);
  const updatedTx: Transaction = {
    ...oldTx,
    amount: data.amount,
    note: data.note?.trim() || oldTx.note,
    category: data.category ?? oldTx.category,
    period: data.period ?? oldTx.period,
    wallet: oldTx.type === 'expense' ? (data.wallet ?? oldTx.wallet) : oldTx.wallet,
    date: data.date,
  };
  next = applyTransactionEffect(next, updatedTx);
  next = {
    ...next,
    transactions: next.transactions.map((t, i) => (i === txIndex ? updatedTx : t)),
  };
  setState(next);
  return next;
}

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