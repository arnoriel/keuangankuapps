import { AppState, SubBalance, WalletType } from './types';
import { CASH_OPTION, getPlatformOption } from './platformCatalog';

export function cashSubCardId(wallet: WalletType): string {
  return `cash-${wallet}`;
}

export function getSubBalances(state: AppState, wallet: WalletType): SubBalance[] {
  return state.subBalances.filter((s) => s.walletType === wallet);
}

export function sumSubBalances(state: AppState, wallet: WalletType): number {
  return getSubBalances(state, wallet).reduce((acc, s) => acc + s.amount, 0);
}

/** Pastikan tiap wallet type selalu punya Card Tunai. Dipanggil saat baca state (migrasi). */
export function ensureCashCard(state: AppState): AppState {
  const wallets: WalletType[] = ['pegangan', 'tabungan'];
  let subBalances = state.subBalances;
  let changed = false;

  for (const wallet of wallets) {
    const id = cashSubCardId(wallet);
    if (subBalances.some((s) => s.id === id)) continue;
    const total = wallet === 'pegangan' ? state.saldoPegangan : state.saldoTabungan;
    const existingTotal = sumSubBalances({ ...state, subBalances }, wallet);
    subBalances = [
      ...subBalances,
      {
        id,
        walletType: wallet,
        platformSlug: CASH_OPTION.slug,
        platformCategory: CASH_OPTION.category,
        label: CASH_OPTION.name,
        amount: Math.max(0, total - existingTotal),
        createdAt: new Date().toISOString(),
      },
    ];
    changed = true;
  }

  return changed ? { ...state, subBalances } : state;
}

export function addSubCard(
  state: AppState,
  wallet: WalletType,
  platformSlug: string,
  accountNumber?: string,
): { state: AppState; created: SubBalance | null } {
  const platform = getPlatformOption(platformSlug);
  if (!platform) return { state, created: null };

  const alreadyExists = getSubBalances(state, wallet).some((s) => s.platformSlug === platformSlug);
  if (alreadyExists) return { state, created: null };

  const sub: SubBalance = {
    id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    walletType: wallet,
    platformSlug: platform.slug,
    platformCategory: platform.category,
    label: platform.name,
    amount: 0,
    ...(accountNumber ? { accountNumber } : {}),
    createdAt: new Date().toISOString(),
  };
  return { state: { ...state, subBalances: [...state.subBalances, sub] }, created: sub };
}

/** Set/hapus nomor HP/rekening sebuah sub-card. Card Tunai tidak punya nomor. */
export function setSubCardAccount(state: AppState, subCardId: string, accountNumber: string): AppState {
  return {
    ...state,
    subBalances: state.subBalances.map((s) => {
      if (s.id !== subCardId || s.platformSlug === 'cash') return s;
      const { accountNumber: _old, ...rest } = s;
      return accountNumber ? { ...rest, accountNumber } : rest;
    }),
  };
}

export function removeSubCard(state: AppState, subCardId: string): AppState {
  const sub = state.subBalances.find((s) => s.id === subCardId);
  // Card Tunai tidak boleh dihapus; sub-card dengan saldo > 0 tidak boleh dihapus.
  if (!sub || sub.platformSlug === 'cash' || sub.amount > 0) return state;
  return { ...state, subBalances: state.subBalances.filter((s) => s.id !== subCardId) };
}

/** Pindahkan saldo antar sub-card. Lintas wallet type diperbolehkan (ikut mengubah grand total). */
export function reallocateSubBalance(
  state: AppState,
  fromSubCardId: string,
  toSubCardId: string,
  amount: number,
): AppState {
  const from = state.subBalances.find((s) => s.id === fromSubCardId);
  const to = state.subBalances.find((s) => s.id === toSubCardId);
  if (!from || !to || amount <= 0 || from.amount < amount || from.id === to.id) return state;

  const subBalances = state.subBalances.map((s) => {
    if (s.id === from.id) return { ...s, amount: s.amount - amount };
    if (s.id === to.id) return { ...s, amount: s.amount + amount };
    return s;
  });

  const crossWallet = from.walletType !== to.walletType;
  return {
    ...state,
    subBalances,
    saldoPegangan: !crossWallet
      ? state.saldoPegangan
      : to.walletType === 'pegangan'
        ? state.saldoPegangan + amount
        : state.saldoPegangan - amount,
    saldoTabungan: !crossWallet
      ? state.saldoTabungan
      : to.walletType === 'tabungan'
        ? state.saldoTabungan + amount
        : state.saldoTabungan - amount,
  };
}

/** Kurangi/tambah saldo sub-card tertentu mengikuti transaksi income/expense/adjustment di level wallet. */
export function adjustSubCardAmount(state: AppState, subCardId: string, delta: number): AppState {
  return {
    ...state,
    subBalances: state.subBalances.map((s) =>
      s.id === subCardId ? { ...s, amount: Math.max(0, s.amount + delta) } : s,
    ),
  };
}

/** Total saldo wallet yang sudah dialokasikan ke platform selain Tunai. */
export function nonCashTotal(state: AppState, wallet: WalletType): number {
  return getSubBalances(state, wallet)
    .filter((s) => s.platformSlug !== 'cash')
    .reduce((acc, s) => acc + s.amount, 0);
}

/** Kumpulkan seluruh saldo tiap wallet ke Card Tunai; card platform lain jadi Rp0 (card tetap ada). */
export function resetToCash(state: AppState): AppState {
  const cashTotals: Record<string, number> = {
    [cashSubCardId('pegangan')]: state.saldoPegangan,
    [cashSubCardId('tabungan')]: state.saldoTabungan,
  };
  return {
    ...state,
    subBalances: state.subBalances.map((s) => ({ ...s, amount: cashTotals[s.id] ?? 0 })),
  };
}
