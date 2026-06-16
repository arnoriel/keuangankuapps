'use client';

import { useState, type ReactNode } from 'react';
import BottomNav from './BottomNav';
import AddTransactionSheet from './AddTransactionSheet';
import SplashScreen from './SplashScreen';
import LockScreen from './LockScreen';
import { useLockState } from '@/hooks/useLockState';

export default function AppShell({ children }: { children: ReactNode }) {
  const [showAddSheet, setShowAddSheet] = useState(false);
  const { isLocked, handleUnlocked } = useLockState();

  // isLocked null = masih loading / cek sessionStorage
  if (isLocked === null) {
    return null;
  }

  if (isLocked) {
    return <LockScreen onUnlocked={handleUnlocked} />;
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
