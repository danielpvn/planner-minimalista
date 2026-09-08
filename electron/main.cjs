const { app, BrowserWindow, Tray, Menu, globalShortcut, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

// Set Windows AppUserModelId so Taskbar displays our custom icon instead of Electron atom
const APP_ID = 'com.danielpvn.plannerm';
app.setAppUserModelId(APP_ID);
app.setName('Plannerm');

let mainWindow = null;
let tray = null;
let isQuitting = false;

const iconPath = path.join(__dirname, '../public/icon-256.png');
const icoPath = path.join(__dirname, '../public/icon.ico');

function createWindow() {
  const appIcon = nativeImage.createFromPath(fs.existsSync(iconPath) ? iconPath : icoPath);

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

  mainWindow.once('ready-to-show', () => {
    mainWindow.setIcon(appIcon);
    mainWindow.show();
    mainWindow.focus();
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
    const trayIcon = nativeImage.createFromPath(fs.existsSync(iconPath) ? iconPath : icoPath);
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
