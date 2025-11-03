// components/ClientAppShell.tsx
'use client';
import AppShell from '@/components/app-shell';

export default function ClientAppShell({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>; // AppShell (and its children) can use useUser()
}
