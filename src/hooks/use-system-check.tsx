
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { DependencyInfo } from '@/lib/types';
import { checkDependencies, installAlacritty as apiInstallAlacritty } from '@/lib/distrobox';
import { useToast } from './use-toast';

interface SystemCheckContextType {
  dependencies: DependencyInfo | null;
  dependenciesReady: boolean;
  checkingDependencies: boolean;
  checkSystemDependencies: () => Promise<void>;
  skipped: boolean;
  setSkipped: (skipped: boolean) => void;
  installAlacritty: () => Promise<void>;
  isInstallingAlacritty: boolean;
}

const SystemCheckContext = createContext<SystemCheckContextType | undefined>(undefined);

export function SystemCheckProvider({ children }: { children: ReactNode }) {
  const [dependencies, setDependencies] = useState<DependencyInfo | null>(null);
  const [checkingDependencies, setCheckingDependencies] = useState(true);
  const [skipped, setSkipped] = useState(false);
  const [isInstallingAlacritty, setIsInstallingAlacritty] = useState(false);
  const { toast } = useToast();

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

  const installAlacritty = useCallback(async () => {
    setIsInstallingAlacritty(true);
    toast({
        title: "Installing Alacritty...",
        description: "Attempting to install Alacritty using the system package manager. This might require a password."
    });
    try {
        await apiInstallAlacritty();
        toast({
            title: "Alacritty Installation Complete!",
            description: "Please restart DistroWolf to use the new terminal."
        });
        await checkSystemDependencies();
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Alacritty Installation Failed",
            description: error.message
        });
    } finally {
        setIsInstallingAlacritty(false);
    }
  }, [checkSystemDependencies, toast]);

  useEffect(() => {
    checkSystemDependencies();
  }, [checkSystemDependencies]);
  
  const dependenciesReady = !!dependencies && dependencies.distroboxInstalled && dependencies.podmanInstalled;

  return (
    <SystemCheckContext.Provider value={{ 
        dependencies, 
        dependenciesReady, 
        checkingDependencies, 
        checkSystemDependencies, 
        skipped, 
        setSkipped,
        installAlacritty,
        isInstallingAlacritty,
    }}>
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
