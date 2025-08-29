
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  listContainers: () => ipcRenderer.invoke('list-containers'),
  startContainer: (containerName) => ipcRenderer.invoke('start-container', containerName),
  stopContainer: (containerName) => ipcRenderer.invoke('stop-container', containerName),
  deleteContainer: (containerName) => ipcRenderer.invoke('delete-container', containerName),
  enterContainer: (containerName) => ipcRenderer.invoke('enter-container', containerName),
  infoContainer: (containerName) => ipcRenderer.invoke('info-container', containerName),
  saveContainerAsImage: (containerName) => ipcRenderer.invoke('save-as-image', containerName),
});
