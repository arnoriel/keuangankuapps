'use client';

import {
  createContext, useContext, useState, useEffect, useCallback, type ReactNode,
} from 'react';
import {
  AppState, IncomePeriod, IncomeCategory, ExpenseCategory, WalletType, RecurringExpense, SavingsGoal,
} from '@/lib/types';
import * as storage from '@/lib/storage';
import { toLocalDateStr } from '@/lib/utils';
import type { TransactionEditData } from '@/lib/storage';

interface WalletContextType extends AppState {
  totalSaldo: number;
  todayIncome: number;
  monthIncome: number;
  monthExpense: number;
  refreshState: () => void;
  addIncome: (amount: number, period: IncomePeriod, category?: IncomeCategory, note?: string) => void;
  addExpense: (amount: number, note: string, category?: ExpenseCategory, wallet?: WalletType) => void;
  transfer: (amount: number, from: 'pegangan' | 'tabungan', to: 'pegangan' | 'tabungan') => void;
  editSaldo: (wallet: 'pegangan' | 'tabungan', newAmount: number) => void;
  updateTransaction: (id: string, data: TransactionEditData) => void;
  deleteTransaction: (id: string) => void;
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

  useEffect(() => { setWalletState(storage.getState()); }, []);

  // Dipanggil setelah onboarding selesai supaya saldo langsung ter-sync
  const refreshState = useCallback(() => {
    setWalletState(storage.getState());
  }, []);

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

  return (
    <WalletContext.Provider value={{
      ...walletState,
      totalSaldo: walletState.saldoPegangan + walletState.saldoTabungan,
      ...stats,
      refreshState,
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