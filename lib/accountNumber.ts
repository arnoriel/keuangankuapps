import type { PlatformCategory } from './types';

export type AccountKind = Exclude<PlatformCategory, 'cash'>;

interface AccountField {
  label: string;
  placeholder: string;
  icon: string;
  min: number;
  max: number;
  hint: string;
}

export const ACCOUNT_FIELDS: Record<AccountKind, AccountField> = {
  'e-wallet': {
    label: 'Nomor HP',
    placeholder: '0812 3456 7890',
    icon: 'fa-mobile-screen',
    min: 9,
    max: 14,
    hint: 'Nomor yang terdaftar di aplikasi',
  },
  bank: {
    label: 'Nomor Rekening',
    placeholder: '1234567890',
    icon: 'fa-credit-card',
    min: 5,
    max: 20,
    hint: 'Hanya tersimpan di perangkat ini',
  },
};

export const KIND_LABEL: Record<PlatformCategory, string> = {
  cash: 'Tunai',
  'e-wallet': 'E-Wallet',
  bank: 'Bank',
};

export function sanitizeAccountNumber(raw: string, kind: AccountKind): string {
  return raw.replace(/\D/g, '').slice(0, ACCOUNT_FIELDS[kind].max);
}

/** Kosong = valid (opsional). */
export function validateAccountNumber(kind: AccountKind, value: string): string | null {
  const { label, min } = ACCOUNT_FIELDS[kind];
  return value && value.length < min ? `${label} minimal ${min} digit` : null;
}

export function formatAccountNumber(value: string): string {
  return value.replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function maskAccountNumber(kind: AccountKind, value: string): string {
  return kind === 'bank'
    ? `•••• ${value.slice(-4)}`
    : `${value.slice(0, 4)} •••• ${value.slice(-3)}`;
}
