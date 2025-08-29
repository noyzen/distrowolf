
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  // Dependency & System Info
  checkDependencies: () => ipcRenderer.invoke('check-dependencies'),
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  
  // Container Management
  listContainers: () => ipcRenderer.invoke('list-containers'),
  createContainer: (options) => ipcRenderer.invoke('create-container', options),
  startContainer: (containerName) => ipcRenderer.invoke('start-container', containerName),
  stopContainer: (containerName) => ipcRenderer.invoke('stop-container', containerName),
  deleteContainer: (containerName) => ipcRenderer.invoke('delete-container', containerName),
  enterContainer: (containerName) => ipcRenderer.invoke('enter-container', containerName),
  infoContainer: (containerName) => ipcRenderer.invoke('info-container', containerName),
  saveContainerAsImage: (containerName) => ipcRenderer.invoke('save-as-image', containerName),
  toggleAutostart: (containerName, autostart) => ipcRenderer.invoke('toggle-autostart', containerName, autostart),
  copyToClipboard: (text) => ipcRenderer.invoke('copy-to-clipboard', text),


  // Image Management
  listLocalImages: () => ipcRenderer.invoke('list-local-images'),
  pullImage: (imageName) => ipcRenderer.invoke('pull-image', imageName),
  deleteImage: (imageId) => ipcRenderer.invoke('delete-image', imageId),
  importImage: () => ipcRenderer.invoke('import-image'),
  exportImage: (image) => ipcRenderer.invoke('export-image', image),


  // App Management
  listSharedApps: (containerName) => ipcRenderer.invoke('list-shared-apps', containerName),
  searchContainerApps: (options) => ipcRenderer.invoke('search-container-apps', options),
  exportApp: (options) => ipcRenderer.invoke('export-app', options),
  unshareApp: (options) => ipcRenderer.invoke('unshare-app', options),
});

    