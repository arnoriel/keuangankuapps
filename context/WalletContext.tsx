'use client';

import {
  createContext, useContext, useState, useEffect, useCallback, type ReactNode,
} from 'react';
import {
  AppState, AccountView, IncomePeriod, IncomeCategory, ExpenseCategory, WalletType, RecurringExpense, SavingsGoal,
} from '@/lib/types';
import * as storage from '@/lib/storage';
import { toLocalDateStr } from '@/lib/utils';
import type { TransactionEditData } from '@/lib/storage';

interface WalletContextType extends AppState {
  totalSaldo: number;
  todayIncome: number;
  monthIncome: number;
  monthExpense: number;
  /** false selagi state awal belum selesai dibaca dari localStorage */
  isReady: boolean;
  /** Multi account */
  accounts: AccountView[];
  activeAccountId: string;
  activeAccountName: string;
  /** Pemicu animasi "Selamat Datang" saat pindah/buat akun (key berubah tiap kejadian). */
  welcome: { name: string; key: number } | null;
  switchAccount: (id: string) => void;
  /** Buat akun baru lalu langsung aktif. Return false jika nama tidak valid. */
  addAccount: (name: string, saldoPegangan: number, saldoTabungan: number) => boolean;
  removeAccount: (id: string) => void;
  refreshState: () => void;
  addIncome: (amount: number, period: IncomePeriod, category?: IncomeCategory, note?: string) => void;
  addExpense: (amount: number, note: string, category?: ExpenseCategory, wallet?: WalletType) => void;
  transfer: (amount: number, from: 'pegangan' | 'tabungan', to: 'pegangan' | 'tabungan') => void;
  editSaldo: (wallet: 'pegangan' | 'tabungan', newAmount: number) => void;
  updateTransaction: (id: string, data: TransactionEditData) => void;
  deleteTransaction: (id: string) => void;
  /** Re-read state dari localStorage — dipakai pull-to-refresh */
  hardRefresh: () => Promise<void>;
  addRecurring: (data: Omit<RecurringExpense, 'id' | 'createdAt'>) => void;
  toggleRecurring: (id: string) => void;
  deleteRecurring: (id: string) => void;
  addGoal: (data: Omit<SavingsGoal, 'id' | 'createdAt'>) => void;
  updateGoalAmount: (id: string, currentAmount: number) => void;
  deleteGoal: (id: string) => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

function computeStats(state: AppState) {
  const now = new Date();
  const today = toLocalDateStr(now);
  const monthStart = toLocalDateStr(new Date(now.getFullYear(), now.getMonth(), 1));

  let todayIncome = 0, monthIncome = 0, monthExpense = 0;
  for (const tx of state.transactions) {
    if (tx.type === 'income') {
      if (tx.date === today) todayIncome += tx.amount;
      if (tx.date >= monthStart) monthIncome += tx.amount;
    }
    if (tx.type === 'expense' && tx.date >= monthStart) monthExpense += tx.amount;
  }
  return { todayIncome, monthIncome, monthExpense };
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletState, setWalletState] = useState<AppState>({
    saldoPegangan: 0, saldoTabungan: 0,
    transactions: [], recurringExpenses: [], savingsGoals: [],
  });
  const [isReady, setIsReady] = useState(false);
  const [accounts, setAccounts] = useState<AccountView[]>([]);
  const [activeAccountId, setActiveAccountId] = useState(storage.MAIN_ACCOUNT_ID);

  // Sinkronkan wallet + daftar akun + akun aktif dari localStorage
  const syncAll = useCallback(() => {
    setWalletState(storage.getState());
    setAccounts(storage.listAccounts());
    setActiveAccountId(storage.getActiveAccountId());
  }, []);

  useEffect(() => {
    syncAll();
    setIsReady(true);
  }, [syncAll]);

  // Dipanggil setelah onboarding selesai supaya saldo langsung ter-sync
  const refreshState = syncAll;

  const [welcome, setWelcome] = useState<{ name: string; key: number } | null>(null);
  const showWelcome = useCallback((name: string) => {
    setWelcome({ name, key: Date.now() });
  }, []);

  const switchAccount = useCallback((id: string) => {
    storage.switchAccount(id);
    syncAll();
    showWelcome(storage.listAccounts().find(a => a.id === id)?.name ?? '');
  }, [syncAll, showWelcome]);

  const addAccount = useCallback((name: string, saldoPegangan: number, saldoTabungan: number) => {
    const created = storage.createAccount(name, saldoPegangan, saldoTabungan);
    if (created) { syncAll(); showWelcome(created.name); }
    return !!created;
  }, [syncAll, showWelcome]);

  const removeAccount = useCallback((id: string) => {
    storage.deleteAccount(id);
    syncAll();
  }, [syncAll]);

  // Dipanggil oleh pull-to-refresh — re-read dari localStorage dengan
  // delay minimum kecil supaya animasi refresh kerasa natural, bukan
  // instan (yang malah kerasa "tidak ngapa-ngapain").
  const hardRefresh = useCallback(async () => {
    await new Promise((res) => setTimeout(res, 550));
    syncAll();
  }, [syncAll]);

  const addIncome = useCallback((amount: number, period: IncomePeriod, category?: IncomeCategory, note?: string) => {
    setWalletState(storage.addIncome(amount, period, category ?? 'lainnya', note));
  }, []);

  const addExpense = useCallback((amount: number, note: string, category?: ExpenseCategory, wallet?: WalletType) => {
    setWalletState(storage.addExpense(amount, note, category ?? 'lainnya', wallet ?? 'pegangan'));
  }, []);

  const transfer = useCallback((amount: number, from: 'pegangan' | 'tabungan', to: 'pegangan' | 'tabungan') => {
    setWalletState(storage.transferFunds(amount, from, to));
  }, []);

  const editSaldo = useCallback((wallet: 'pegangan' | 'tabungan', newAmount: number) => {
    setWalletState(storage.editSaldo(wallet, newAmount));
  }, []);

  const updateTransaction = useCallback((id: string, data: TransactionEditData) => {
    setWalletState(storage.updateTransaction(id, data));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setWalletState(storage.deleteTransaction(id));
  }, []);

  const addRecurring = useCallback((data: Omit<RecurringExpense, 'id' | 'createdAt'>) => {
    setWalletState(storage.addRecurring(data));
  }, []);

  const toggleRecurring = useCallback((id: string) => {
    setWalletState(storage.toggleRecurring(id));
  }, []);

  const deleteRecurring = useCallback((id: string) => {
    setWalletState(storage.deleteRecurring(id));
  }, []);

  const addGoal = useCallback((data: Omit<SavingsGoal, 'id' | 'createdAt'>) => {
    setWalletState(storage.addGoal(data));
  }, []);

  const updateGoalAmount = useCallback((id: string, currentAmount: number) => {
    setWalletState(storage.updateGoalAmount(id, currentAmount));
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setWalletState(storage.deleteGoal(id));
  }, []);

  const stats = computeStats(walletState);
  const activeAccountName = accounts.find(a => a.id === activeAccountId)?.name ?? '';

  return (
    <WalletContext.Provider value={{
      ...walletState,
      totalSaldo: walletState.saldoPegangan + walletState.saldoTabungan,
      ...stats,
      isReady,
      accounts, activeAccountId, activeAccountName, welcome,
      switchAccount, addAccount, removeAccount,
      refreshState,
      hardRefresh,
      addIncome, addExpense, transfer, editSaldo,
      updateTransaction, deleteTransaction,
      addRecurring, toggleRecurring, deleteRecurring,
      addGoal, updateGoalAmount, deleteGoal,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextType {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}