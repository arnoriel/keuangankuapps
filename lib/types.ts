export type TransactionType = 'income' | 'expense' | 'transfer_out' | 'transfer_in';
export type WalletType = 'pegangan' | 'tabungan';
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
}