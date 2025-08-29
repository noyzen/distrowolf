import type { Container } from './types';

declare global {
  interface Window {
    electron: {
      listContainers: () => Promise<Container[]>;
      startContainer: (containerName: string) => Promise<{ success: boolean }>;
      stopContainer: (containerName: string) => Promise<{ success: boolean }>;
      deleteContainer: (containerName: string) => Promise<{ success: boolean }>;
      enterContainer: (containerName: string) => Promise<{ success: boolean }>;
      infoContainer: (containerName: string) => Promise<{ success: boolean, message?: string }>;
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

export async function enterContainer(containerName: string): Promise<{ success: boolean }> {
    if (window.electron) {
        return window.electron.enterContainer(containerName);
    }
    console.warn("Electron API not available.");
    return { success: false };
}

export async function infoContainer(containerName: string): Promise<{ success: boolean, message?: string }> {
    if (window.electron) {
        return window.electron.infoContainer(containerName);
    }
    console.warn("Electron API not available.");
    return { success: false, message: "Electron API not available." };
}

export async function toggleAutostart(containerName: string): Promise<{ success: boolean }> {
    // This is a placeholder. Real implementation requires `distrobox-generate-entry` and managing systemd services.
    console.warn(`Autostart toggle for ${containerName} is not implemented in the backend yet.`);
    return { success: true };
}
