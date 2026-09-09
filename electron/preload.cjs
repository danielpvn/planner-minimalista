const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,
  openExternal: (url) => ipcRenderer.send('open-external', url),
  startOAuthServer: () => ipcRenderer.invoke('start-local-oauth-server'),
  onOAuthTokens: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('oauth-token-received', handler);
    return () => ipcRenderer.removeListener('oauth-token-received', handler);
  },
});


