
import type { Container, LocalImage, SystemInfo, SharedApp, SearchableApp } from './types';

type CreateContainerOptions = {
  name: string;
  image: string;
  home: string;
  init: boolean;
  nvidia: boolean;
  volumes: string[];
}

type SearchAppsOptions = {
  containerName: string;
  packageManager: string;
  query: string;
}

type AppActionOptions = {
    containerName: string;
    appName: string;
    type: 'app' | 'binary';
}

type ImageActionResult = {
  success: boolean;
  cancelled: boolean;
  path?: string;
  error?: string;
}

declare global {
  interface Window {
    electron: {
      checkDependencies: () => Promise<{ distroboxInstalled: boolean, podmanInstalled: boolean }>;
      getSystemInfo: () => Promise<SystemInfo>;
      
      listContainers: () => Promise<Container[]>;
      createContainer: (options: CreateContainerOptions) => Promise<{ success: boolean }>;
      startContainer: (containerName: string) => Promise<{ success: boolean }>;
      stopContainer: (containerName: string) => Promise<{ success: boolean }>;
      deleteContainer: (containerName: string) => Promise<{ success: boolean }>;
      enterContainer: (containerName: string) => Promise<{ success: boolean, message?: string }>;
      infoContainer: (containerName: string) => Promise<{ success: boolean, message?: string }>;
      saveContainerAsImage: (containerName: string) => Promise<{ success: boolean, imageName?: string, error?: string }>;
      toggleAutostart: (containerName: string, autostart: boolean) => Promise<{ success: boolean }>;
      copyToClipboard: (text: string) => Promise<{ success: boolean }>;
      
      listLocalImages: () => Promise<LocalImage[]>;
      pullImage: (imageName: string) => Promise<{ success: boolean }>;
      deleteImage: (imageId: string) => Promise<{ success: boolean }>;
      importImage: () => Promise<ImageActionResult>;
      exportImage: (image: LocalImage) => Promise<ImageActionResult>;

      listSharedApps: (containerName: string) => Promise<SharedApp[]>;
      searchContainerApps: (options: SearchAppsOptions) => Promise<SearchableApp[]>;
      exportApp: (options: AppActionOptions) => Promise<{ success: boolean }>;
      unshareApp: (options: AppActionOptions) => Promise<{ success: boolean }>;
    }
  }
}

export async function checkDependencies() {
    if (window.electron) return window.electron.checkDependencies();
    console.warn("Electron API not available.");
    return { distroboxInstalled: false, podmanInstalled: false };
}

export async function getSystemInfo(): Promise<SystemInfo> {
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

export async function pullImage(imageName: string): Promise<{ success: boolean }> {
  if (window.electron) return window.electron.pullImage(imageName);
  console.warn("Electron API not available.");
  return { success: false };
}

export async function deleteImage(imageId: string): Promise<{ success: boolean }> {
  if (window.electron) return window.electron.deleteImage(imageId);
  console.warn("Electron API not available.");
  return { success: false };
}

export async function importImage(): Promise<ImageActionResult> {
    if (window.electron) return window.electron.importImage();
    console.warn("Electron API not available.");
    return { success: false, cancelled: true, error: "Electron API not available." };
}

export async function exportImage(image: LocalImage): Promise<ImageActionResult> {
    if (window.electron) return window.electron.exportImage(image);
    console.warn("Electron API not available.");
    return { success: false, cancelled: true, error: "Electron API not available." };
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

export async function enterContainer(containerName: string): Promise<{ success: boolean, message?: string }> {
    if (window.electron) return window.electron.enterContainer(containerName);
    console.warn("Electron API not available.");
    return { success: false, message: "Electron API not available." };
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

export async function toggleAutostart(containerName: string, autostart: boolean): Promise<{ success: boolean }> {
    if (window.electron) return window.electron.toggleAutostart(containerName, autostart);
    console.warn("Electron API not available.");
    return { success: false };
}

export async function copyToClipboard(text: string): Promise<{ success: boolean }> {
    if (window.electron) return window.electron.copyToClipboard(text);
    console.warn("Electron API not available.");
    return { success: false };
}

export async function listSharedApps(containerName: string): Promise<SharedApp[]> {
    if (window.electron) return window.electron.listSharedApps(containerName);
    console.warn("Electron API not available.");
    return [];
}

export async function searchContainerApps(options: SearchAppsOptions): Promise<SearchableApp[]> {
    if (window.electron) return window.electron.searchContainerApps(options);
    console.warn("Electron API not available.");
    return [];
}

export async function exportApp(options: AppActionOptions): Promise<{ success: boolean }> {
    if (window.electron) return window.electron.exportApp(options);
    console.warn("Electron API not available.");
    return { success: false };
}

export async function unshareApp(options: AppActionOptions): Promise<{ success: boolean }> {
    if (window.electron) return window.electron.unshareApp(options);
    console.warn("Electron API not available.");
    return { success: false };
}

    