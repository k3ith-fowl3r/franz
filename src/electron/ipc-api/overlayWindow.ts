import { BrowserWindow, ipcMain } from 'electron';
// eslint-disable-next-line import/no-named-default
import { isDevMode, isLinux, isMac } from '../../environment';
import { OVERLAY_OPEN } from '../../ipcChannels';

const debug = require('debug')('Franz:ipcApi:overlayWindow');

interface IArgs {
  route: string;
  width?: number;
  height?: number;
  transparent?: boolean;
  modal?: boolean;
  overrideParent?: number;
}

export const UPDATE_FULL_SCREEN_STATUS = 'set-full-screen-status';

export default ({ mainWindow, settings: { app: settings } }: { mainWindow: BrowserWindow, settings: any }) => {
  ipcMain.handle(OVERLAY_OPEN, (event, args: IArgs) => new Promise((resolve) => {
    try {
      debug('Got overlay window open request', args);

      const bounds = mainWindow.getBounds();

      let parent = args.modal ? mainWindow : null;
      if (args.overrideParent) {
        parent = BrowserWindow.fromId(args.overrideParent);
      }

      const window = new BrowserWindow({
        width: args.width ?? bounds.width - 100,
        height: args.height ?? bounds.height - 100,
        titleBarStyle: isMac ? 'hidden' : 'default',
        frame: isLinux,
        transparent: args.transparent || false,
        modal: args.modal ?? false,
        parent,
        backgroundColor: !settings.get('darkMode') ? '#3498db' : '#1E1E1E',
        webPreferences: {
          nodeIntegration: true,
          webviewTag: true,
          contextIsolation: false,
        },
      });

      // eslint-disable-next-line global-require
      require('@electron/remote/main').enable(window.webContents);

      window.once('ready-to-show', () => {
        window.show();
        window.webContents.focus();

        if (isDevMode) {
          window.webContents.openDevTools();
        }
      });

      let { route } = args;
      route = route.replace('{webContentsId}', event.sender.id.toString());

      window.loadFile('overlay.html', {
        hash: route,
      });

      window.on('close', () => resolve('closed'));
    } catch (err) {
      resolve('error');
    }
  }));
};
