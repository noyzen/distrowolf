const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  listContainers: () => ipcRenderer.invoke('list-containers'),
});
