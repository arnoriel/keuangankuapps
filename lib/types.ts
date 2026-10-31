export type TransactionType = 'income' | 'expense' | 'transfer_out' | 'transfer_in' | 'adjustment' | 'realloc';
export type WalletType = 'pegangan' | 'tabungan';
export type PlatformCategory = 'cash' | 'e-wallet' | 'bank';
export type IncomePeriod = 'harian' | 'bulanan';
export type IncomeCategory = 'gaji' | 'freelance' | 'driver' | 'jualan' | 'tunjangan' | 'pasif' | 'lainnya';
export type ExpenseCategory = 'bensin' | 'makan' | 'utang' | 'belanja' | 'hiburan' | 'lainnya';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  wallet: WalletType;
  note?: string;
  period?: IncomePeriod;
  category?: IncomeCategory | ExpenseCategory;
  date: string;       // YYYY-MM-DD
  createdAt: string;  // ISO datetime
  /** Sub-card asal/tujuan untuk transaksi yang menyentuh breakdown saldo (expense, realloc). */
  subCardId?: string;
  toSubCardId?: string;
}

/** Breakdown saldo pegangan/tabungan per platform (Tunai, GoPay, BCA, dst). */
export interface SubBalance {
  id: string;
  walletType: WalletType;
  platformSlug: string;   // 'cash' | slug dari platformCatalog
  platformCategory: PlatformCategory;
  label: string;
  amount: number;
  createdAt: string;
}

export interface RecurringExpense {
  id: string;
  label: string;
  amount: number;
  frequency: 'weekly' | 'monthly';
  dueDay: number;  // 1-7 for weekly (1=Mon..7=Sun), 1-31 for monthly
  category: ExpenseCategory;
  active: boolean;
  createdAt: string;
}

export interface SavingsGoal {
  id: string;
  label: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string; // YYYY-MM-DD
  emoji: string;
  createdAt: string;
}

export interface AppState {
  saldoPegangan: number;
  saldoTabungan: number;
  transactions: Transaction[];
  recurringExpenses: RecurringExpense[];
  savingsGoals: SavingsGoal[];
  subBalances: SubBalance[];
}

/** Akun tambahan (mis. akun anak/adik). Akun utama bersifat implisit (id 'main'). */
export interface Account {
  id: string;
  name: string;
  createdAt: string;
}

/** Akun untuk ditampilkan di UI — termasuk akun utama. */
export interface AccountView extends Account {
  isMain: boolean;
}
