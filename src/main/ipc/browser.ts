import { ipcMain } from 'electron';
import { IPC } from '../../shared/ipc-channels';
import { BrowserHub } from '../browser/browser-hub';

export function registerBrowserHandlers() {
  const hub = BrowserHub.getInstance();

  ipcMain.handle(IPC.BROWSER.CONNECT, async (_event, options?: { endpoint?: string }) => {
    return hub.connect(options?.endpoint);
  });

  ipcMain.handle(IPC.BROWSER.DISCONNECT, async () => {
    return hub.disconnect();
  });

  ipcMain.handle(IPC.BROWSER.GET_STATUS, async () => {
    return hub.getStatus();
  });

  ipcMain.handle(IPC.BROWSER.OPEN_URL, async (_event, url: string) => {
    return hub.openUrl(url);
  });

  ipcMain.handle(IPC.BROWSER.GET_PAGE_CONTENT, async () => {
    return hub.getPageContent();
  });
}
