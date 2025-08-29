import type { Container } from './types';

declare global {
  interface Window {
    electron: {
      listContainers: () => Promise<Container[]>;
      startContainer: (containerName: string) => Promise<{ success: boolean }>;
      stopContainer: (containerName: string) => Promise<{ success: boolean }>;
      deleteContainer: (containerName: string) => Promise<{ success: boolean }>;
    }
  }
}

// This function will now call the method exposed by the preload script
export async function listContainers(): Promise<Container[]> {
  if (window.electron) {
    try {
      return await window.electron.listContainers();
    } catch (error) {
      console.error("Error calling listContainers via Electron API:", error);
      // It's better to re-throw or handle the error in the component
      throw error;
    }
  }

  // Provide a fallback for running in a pure web environment (without Electron)
  console.warn("Electron API not available. Falling back to empty container list.");
  return [];
}

export async function startContainer(containerName: string): Promise<{ success: boolean }> {
  if (window.electron) {
    return window.electron.startContainer(containerName);
  }
  console.warn("Electron API not available.");
  return { success: false };
}

export async function stopContainer(containerName: string): Promise<{ success:boolean }> {
  if (window.electron) {
    return window.electron.stopContainer(containerName);
  }
  console.warn("Electron API not available.");
  return { success: false };
}

export async function deleteContainer(containerName: string): Promise<{ success: boolean }> {
  if (window.electron) {
    return window.electron.deleteContainer(containerName);
  }
  console.warn("Electron API not available.");
  return { success: false };
}
