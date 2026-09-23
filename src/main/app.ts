import { app, BrowserWindow, ipcMain, shell, nativeTheme } from 'electron';
import path from 'path';
import { Database } from './database/connection';
import { registerIpcHandlers } from './ipc';

let mainWindow: BrowserWindow | null = null;
let db: Database;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'BacklinkForge',
    icon: path.join(__dirname, '../../assets/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#09090b',
      symbolColor: '#a1a1aa',
      height: 40,
    },
    show: false,
    backgroundColor: '#09090b',
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Load the app
  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Graceful shutdown on window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function initialize() {
  try {
    // Initialize database
    db = Database.getInstance();
    db.runMigrations();

    // Register IPC handlers
    registerIpcHandlers(db);

    // Create window
    createWindow();
  } catch (error) {
    console.error('Failed to initialize application:', error);
    app.quit();
  }
}

app.whenReady().then(initialize);

app.on('window-all-closed', () => {
  try {
    db?.close();
  } catch (err) {
    console.error('Error closing database:', err);
  }
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
