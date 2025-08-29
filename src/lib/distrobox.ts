import type { Container } from './types';

// This function will now call the method exposed by the preload script
export async function listContainers(): Promise<Container[]> {
  // @ts-ignore
  if (window.electron) {
    // @ts-ignore
    return window.electron.listContainers();
  }

  // Provide a fallback for running in a pure web environment (without Electron)
  console.warn("Electron API not available. Falling back to empty container list.");
  return [];
}
