
import type { Container, LocalImage } from './types';

type CreateContainerOptions = {
  name: string;
  image: string;
  sharedHome: boolean;
  init: boolean;
  nvidia: boolean;
  volumes: string[];
}

declare global {
  interface Window {
    electron: {
      checkDependencies: () => Promise<{ distroboxInstalled: boolean, podmanInstalled: boolean }>;
      getSystemInfo: () => Promise<{ distro: string, distroboxVersion: string, podmanVersion: string }>;
      
      listContainers: () => Promise<Container[]>;
      createContainer: (options: CreateContainerOptions) => Promise<{ success: boolean }>;
      startContainer: (containerName: string) => Promise<{ success: boolean }>;
      stopContainer: (containerName: string) => Promise<{ success: boolean }>;
      deleteContainer: (containerName: string) => Promise<{ success: boolean }>;
      enterContainer: (containerName: string) => Promise<{ success: boolean }>;
      infoContainer: (containerName: string) => Promise<{ success: boolean, message?: string }>;
      saveContainerAsImage: (containerName: string) => Promise<{ success: boolean, imageName?: string, error?: string }>;
      
      listLocalImages: () => Promise<LocalImage[]>;
    }
  }
}

export async function checkDependencies() {
    if (window.electron) return window.electron.checkDependencies();
    console.warn("Electron API not available.");
    return { distroboxInstalled: false, podmanInstalled: false };
}

export async function getSystemInfo() {
    if (window.electron) return window.electron.getSystemInfo();
    console.warn("Electron API not available.");
    return { distro: 'N/A', distroboxVersion: 'N/A', podmanVersion: 'N/A' };
}

export async function listContainers(): Promise<Container[]> {
  if (window.electron) return window.electron.listContainers();
  console.warn("Electron API not available. Falling back to empty container list.");
  return [];
}

export async function listLocalImages(): Promise<LocalImage[]> {
  if (window.electron) return window.electron.listLocalImages();
  console.warn("Electron API not available.");
  return [];
}

export async function createContainer(options: CreateContainerOptions): Promise<{ success: boolean }> {
  if (window.electron) return window.electron.createContainer(options);
  console.warn("Electron API not available.");
  return { success: false };
}

export async function startContainer(containerName: string): Promise<{ success: boolean }> {
  if (window.electron) return window.electron.startContainer(containerName);
  console.warn("Electron API not available.");
  return { success: false };
}

export async function stopContainer(containerName: string): Promise<{ success:boolean }> {
  if (window.electron) return window.electron.stopContainer(containerName);
  console.warn("Electron API not available.");
  return { success: false };
}

export async function deleteContainer(containerName: string): Promise<{ success: boolean }> {
  if (window.electron) return window.electron.deleteContainer(containerName);
  console.warn("Electron API not available.");
  return { success: false };
}

export async function enterContainer(containerName: string): Promise<{ success: boolean }> {
    if (window.electron) return window.electron.enterContainer(containerName);
    console.warn("Electron API not available.");
    return { success: false };
}

export async function infoContainer(containerName: string): Promise<{ success: boolean, message?: string }> {
    if (window.electron) return window.electron.infoContainer(containerName);
    console.warn("Electron API not available.");
    return { success: false, message: "Electron API not available." };
}

export async function saveContainerAsImage(containerName: string): Promise<{ success: boolean, imageName?: string, error?: string }> {
    if (window.electron) return window.electron.saveContainerAsImage(containerName);
    console.warn("Electron API not available.");
    return { success: false, error: "Electron API not available." };
}


export async function toggleAutostart(containerName: string): Promise<{ success: boolean }> {
    console.warn(`Autostart toggle for ${containerName} is not implemented in the backend yet.`);
    return { success: true };
}
