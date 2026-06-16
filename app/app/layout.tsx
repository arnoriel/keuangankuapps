import { WalletProvider } from '@/context/WalletContext';
import AppShell from '@/components/AppShell';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <AppShell>{children}</AppShell>
    </WalletProvider>
  );
}
