
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { DependencyInfo } from '@/lib/types';
import { checkDependencies } from '@/lib/distrobox';

interface SystemCheckContextType {
  dependencies: DependencyInfo | null;
  dependenciesReady: boolean;
  checkingDependencies: boolean;
  checkSystemDependencies: () => Promise<void>;
  skipped: boolean;
  setSkipped: (skipped: boolean) => void;
}

const SystemCheckContext = createContext<SystemCheckContextType | undefined>(undefined);

export function SystemCheckProvider({ children }: { children: ReactNode }) {
  const [dependencies, setDependencies] = useState<DependencyInfo | null>(null);
  const [checkingDependencies, setCheckingDependencies] = useState(true);
  const [skipped, setSkipped] = useState(false);

  const checkSystemDependencies = useCallback(async () => {
    setCheckingDependencies(true);
    try {
      const deps = await checkDependencies();
      setDependencies(deps);
    } catch (error) {
      console.error("Failed to check system dependencies:", error);
      setDependencies(null);
    } finally {
      setCheckingDependencies(false);
    }
  }, []);

  useEffect(() => {
    checkSystemDependencies();
  }, [checkSystemDependencies]);
  
  const dependenciesReady = !!dependencies && dependencies.distroboxInstalled && dependencies.podmanInstalled;

  return (
    <SystemCheckContext.Provider value={{ dependencies, dependenciesReady, checkingDependencies, checkSystemDependencies, skipped, setSkipped }}>
      {children}
    </SystemCheckContext.Provider>
  );
}

export function useSystemCheck() {
  const context = useContext(SystemCheckContext);
  if (context === undefined) {
    throw new Error('useSystemCheck must be used within a SystemCheckProvider');
  }
  return context;
}
