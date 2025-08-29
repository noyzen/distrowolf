const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  listContainers: () => ipcRenderer.invoke('list-containers'),
  startContainer: (containerName) => ipcRenderer.invoke('start-container', containerName),
  stopContainer: (containerName) => ipcRenderer.invoke('stop-container', containerName),
  deleteContainer: (containerName) => ipcRenderer.invoke('delete-container', containerName),
});
