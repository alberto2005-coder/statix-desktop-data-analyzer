const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

function getFilePathFromArgs(args) {
  if (!args || args.length < 2) return null;
  // Look for file arguments
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg && !arg.startsWith('--') && !arg.startsWith('-') && fs.existsSync(arg)) {
      return arg;
    }
  }
  return null;
}

function sendFileToRenderer(filePath) {
  if (mainWindow && mainWindow.webContents) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      mainWindow.webContents.send('open-file', {
        filePath,
        fileName: path.basename(filePath),
        content
      });
    } catch (e) {
      console.error('Error al leer archivo externo:', e);
    }
  }
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, commandLine) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      const filePath = getFilePathFromArgs(commandLine);
      if (filePath) {
        sendFileToRenderer(filePath);
      }
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true
    },
    show: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0f172a',
      symbolColor: '#74b1be'
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

ipcMain.handle('get-initial-file', () => {
  const filePath = getFilePathFromArgs(process.argv);
  if (filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return {
        filePath,
        fileName: path.basename(filePath),
        content
      };
    } catch (e) {
      console.error('Error al leer archivo inicial:', e);
      return null;
    }
  }
  return null;
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
