const { app, BrowserWindow, Tray, Menu, globalShortcut, nativeImage, dialog, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

ipcMain.on('open-external', (_event, url) => {
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    shell.openExternal(url);
  }
});

let autoUpdater = null;
try {
  autoUpdater = require('electron-updater').autoUpdater;
} catch {
  // updater not available in dev or missing
}

// Set Windows AppUserModelId so Taskbar displays our custom icon instead of Electron atom
const APP_ID = 'com.daniel.plannerm';
app.setAppUserModelId(APP_ID);
app.setName('Plannerm');

let mainWindow = null;
let tray = null;
let isQuitting = false;

const iconPath = path.join(__dirname, '../public/icon-256.png');
const icoPath = path.join(__dirname, '../public/icon.ico');

function initUpdater() {
  if (!autoUpdater || !app.isPackaged) return;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', (info) => {
    if (mainWindow) {
      mainWindow.webContents.send('update-available', info);
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Atualização Pronta',
      message: `Uma nova versão (${info.version}) do Plannerm foi baixada!`,
      detail: 'Deseja reiniciar o aplicativo agora para aplicar a atualização?',
      buttons: ['Reiniciar e Atualizar', 'Mais tarde'],
      defaultId: 0,
      cancelId: 1,
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });

  autoUpdater.on('error', (err) => {
    console.log('Erro ao verificar atualizações:', err?.message || err);
  });

  // Check periodically (every 4 hours)
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(() => {});
  }, 10000);

  setInterval(() => {
    autoUpdater.checkForUpdates().catch(() => {});
  }, 4 * 60 * 60 * 1000);
}

function getAppIcon() {
  const ico = path.join(__dirname, '../public/icon.ico');
  const png = path.join(__dirname, '../public/icon-256.png');
  if (process.platform === 'win32' && fs.existsSync(ico)) {
    return nativeImage.createFromPath(ico);
  }
  if (fs.existsSync(png)) {
    return nativeImage.createFromPath(png);
  }
  return nativeImage.createFromPath(ico);
}

function createWindow() {
  const appIcon = getAppIcon();

  mainWindow = new BrowserWindow({
    width: 1180,
    height: 800,
    minWidth: 880,
    minHeight: 620,
    backgroundColor: '#090a0f',
    title: 'Plannerm',
    autoHideMenuBar: true,
    show: false,
    icon: appIcon,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  mainWindow.setIcon(appIcon);

  const distHtml = path.join(__dirname, '../dist/index.html');

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else if (fs.existsSync(distHtml)) {
    mainWindow.loadFile(distHtml);
  } else {
    mainWindow.loadURL('http://localhost:5173').catch(() => {
      console.log('Tentando carregar dist...');
      mainWindow.loadFile(distHtml);
    });
  }

  // Open external links and OAuth redirects in user's default browser (Chrome/Edge)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      if (!url.includes('localhost') && !url.includes('127.0.0.1')) {
        event.preventDefault();
        shell.openExternal(url);
      }
    }
  });

  // Minimize to tray on close
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  try {
    const trayIcon = getAppIcon();
    tray = new Tray(trayIcon);
    tray.setToolTip('Plannerm');

    const updateContextMenu = () => {
      const isAutoStart = app.getLoginItemSettings().openAtLogin;

      const contextMenu = Menu.buildFromTemplate([
        {
          label: 'Abrir Plannerm',
          click: () => {
            if (mainWindow) {
              mainWindow.show();
              mainWindow.focus();
            }
          },
        },
        {
          label: 'Iniciar com o Windows',
          type: 'checkbox',
          checked: isAutoStart,
          click: (menuItem) => {
            app.setLoginItemSettings({
              openAtLogin: menuItem.checked,
              path: app.getPath('exe'),
            });
            updateContextMenu();
          },
        },
        {
          label: 'Verificar atualizações...',
          click: () => {
            if (autoUpdater && app.isPackaged) {
              autoUpdater.checkForUpdates().then((result) => {
                if (!result || !result.updateInfo || result.updateInfo.version === app.getVersion()) {
                  dialog.showMessageBox({
                    type: 'info',
                    title: 'Plannerm Atualizado',
                    message: `Você já está na versão mais recente (${app.getVersion()})!`,
                  });
                }
              }).catch(() => {
                dialog.showMessageBox({
                  type: 'info',
                  title: 'Atualizações',
                  message: 'Não foi possível verificar no momento. Verifique sua conexão.',
                });
              });
            } else {
              dialog.showMessageBox({
                type: 'info',
                title: 'Plannerm',
                message: `Versão ${app.getVersion()} (Ambiente Local/Dev)`,
              });
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Sair do Plannerm',
          click: () => {
            isQuitting = true;
            app.quit();
          },
        },
      ]);

      tray.setContextMenu(contextMenu);
    };

    updateContextMenu();

    tray.on('double-click', () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    });
  } catch (err) {
    console.error('Falha ao criar System Tray:', err);
  }
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();
    createTray();
    initUpdater();

    globalShortcut.register('CommandOrControl+Alt+P', () => {
      if (mainWindow) {
        if (mainWindow.isVisible() && !mainWindow.isMinimized()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
