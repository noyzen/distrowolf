
"use client";

import { type ReactNode } from 'react';
import { useSystemCheck } from '@/hooks/use-system-check';
import { AppShell } from '@/components/app-shell';
import SetupWizard from '@/components/setup-wizard';
import { Loader, Shield } from 'lucide-react';

export function AppInitializer({ children }: { children: ReactNode }) {
  const { dependenciesReady, checkingDependencies, skipped } = useSystemCheck();

  if (checkingDependencies) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <Shield className="h-12 w-12 text-primary animate-pulse" />
          <h1 className="text-xl font-headline">DistroWolf</h1>
          <p className="text-muted-foreground">Checking system dependencies...</p>
          <Loader className="animate-spin" />
        </div>
      </div>
    );
  }

  if (!dependenciesReady && !skipped) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <SetupWizard />
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
