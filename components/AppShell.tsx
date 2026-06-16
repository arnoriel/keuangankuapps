'use client';

import { useState, type ReactNode } from 'react';
import BottomNav from './BottomNav';
import AddTransactionSheet from './AddTransactionSheet';
import SplashScreen from './SplashScreen';
import LockScreen from './LockScreen';
import { useLockState } from '@/hooks/useLockState';
import { useWallet } from '@/context/WalletContext';

export default function AppShell({ children }: { children: ReactNode }) {
  const [showAddSheet, setShowAddSheet] = useState(false);
  const { isLocked, handleUnlocked } = useLockState();
  const { refreshState } = useWallet();

  if (isLocked === null) {
    return null;
  }

  if (isLocked) {
    const handleUnlockedWithRefresh = () => {
      refreshState(); // sync saldo dari localStorage sebelum tampil
      handleUnlocked();
    };
    return <LockScreen onUnlocked={handleUnlockedWithRefresh} />;
  }

  return (
    <div className="app-root">
      <SplashScreen />
      <div className="page">
        {children}
      </div>
      <BottomNav onFabClick={() => setShowAddSheet(true)} />
      {showAddSheet && (
        <AddTransactionSheet onClose={() => setShowAddSheet(false)} />
      )}
    </div>
  );
}