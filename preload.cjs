const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getInitialFile: () => ipcRenderer.invoke('get-initial-file'),
  onOpenFile: (callback) => {
    const subscription = (_event, value) => callback(value);
    ipcRenderer.on('open-file', subscription);
    return () => ipcRenderer.removeListener('open-file', subscription);
  }
});
