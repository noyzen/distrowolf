
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

  // Image Management
  listLocalImages: () => ipcRenderer.invoke('list-local-images'),
});
