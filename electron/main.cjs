const { app, BrowserWindow, Tray, Menu, globalShortcut, nativeImage, dialog, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');

let authServer = null;

ipcMain.on('open-external', (_event, url) => {
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    shell.openExternal(url);
  }
});

ipcMain.handle('start-local-oauth-server', async () => {
  if (authServer) {
    try { authServer.close(); } catch {}
    authServer = null;
  }

  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const parsedUrl = new URL(req.url, 'http://127.0.0.1');

      if (req.method === 'OPTIONS') {
        res.writeHead(200, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        });
        res.end();
        return;
      }

      if (parsedUrl.pathname === '/callback') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Plannerm — Login Autorizado</title>
  <style>
    body {
      margin: 0; padding: 0; background: #090a0f; color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex; align-items: center; justify-content: center; min-height: 100vh;
    }
    .box {
      background: #12141d; border: 1px solid #232638; border-radius: 28px;
      padding: 48px 36px; text-align: center; max-width: 420px;
      box-shadow: 0 25px 60px rgba(0,0,0,0.6);
      animation: pop 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes pop {
      from { transform: scale(0.9); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .icon {
      width: 64px; height: 64px; border-radius: 20px;
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      display: flex; align-items: center; justify-content: center;
      font-size: 32px; margin: 0 auto 24px;
      box-shadow: 0 10px 25px rgba(99, 102, 241, 0.3);
    }
    h1 { margin: 0 0 10px; font-size: 22px; font-weight: 700; }
    p { margin: 0 0 24px; font-size: 14px; color: #94a3b8; line-height: 1.6; }
    .badge {
      display: inline-block; padding: 6px 16px; border-radius: 9999px;
      background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399; font-size: 12px; font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="box">
    <div class="icon">✨</div>
    <h1>Login Concluído!</h1>
    <p>Sua conta Google foi autorizada com sucesso. Você já pode fechar esta aba e voltar para o seu <b>Plannerm</b> no computador.</p>
    <div class="badge">✓ Autorizado com Sucesso</div>
  </div>
  <script>
    const hash = window.location.hash.substring(1);
    const search = window.location.search.substring(1);
    const params = new URLSearchParams(hash || search);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    
    if (access_token && refresh_token) {
      fetch('/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token, refresh_token })
      }).catch(() => {});
    }
  </script>
</body>
</html>`);
        return;
      }

      if (parsedUrl.pathname === '/token' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(JSON.stringify({ success: true }));

          try {
            const tokenData = JSON.parse(body);
            if (mainWindow) {
              if (mainWindow.isMinimized()) mainWindow.restore();
              mainWindow.show();
              mainWindow.focus();
              mainWindow.webContents.send('oauth-token-received', tokenData);
            }
          } catch (e) {
            console.error('Falha ao processar token:', e);
          }

          setTimeout(() => {
            if (authServer) {
              try { authServer.close(); } catch {}
              authServer = null;
            }
          }, 3000);
        });
        return;
      }

      res.writeHead(404);
      res.end();
    });

    server.listen(54321, '127.0.0.1', () => {
      authServer = server;
      resolve({ port: 54321, callbackUrl: 'http://127.0.0.1:54321/callback' });
    });

    server.on('error', () => {
      server.listen(0, '127.0.0.1', () => {
        authServer = server;
        const port = server.address().port;
        resolve({ port, callbackUrl: `http://127.0.0.1:${port}/callback` });
      });
    });
  });
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
