import { app, BrowserWindow, ipcMain, nativeTheme } from 'electron';
import { IPC } from '../../shared/ipc-channels';

export function registerAppHandlers() {
  ipcMain.handle(IPC.APP.GET_VERSION, () => {
    return app.getVersion();
  });

  ipcMain.handle(IPC.APP.GET_PLATFORM, () => {
    return process.platform;
  });

  ipcMain.handle(IPC.APP.GET_THEME, () => {
    return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
  });

  ipcMain.handle(IPC.APP.SET_THEME, (_event, theme: 'light' | 'dark' | 'system') => {
    nativeTheme.themeSource = theme;
    return true;
  });

  ipcMain.handle(IPC.APP.MINIMIZE, (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    window?.minimize();
  });

  ipcMain.handle(IPC.APP.MAXIMIZE, (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window?.isMaximized()) {
      window.unmaximize();
    } else {
      window?.maximize();
    }
  });

  ipcMain.handle(IPC.APP.CLOSE, (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    window?.close();
  });

  ipcMain.handle(IPC.APP.IS_MAXIMIZED, (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    return window?.isMaximized() ?? false;
  });
}
