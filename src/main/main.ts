import { app, BrowserWindow, ipcMain, Menu, nativeTheme, session, shell } from 'electron';
import path from 'node:path';
import { TabManager } from './tabs';
import {
  AddBookmarkPayload,
  CreateFolderPayload,
  FindInPagePayload,
  MoveTabPayload,
  NavigatePayload,
  SetOmniboxHeightPayload,
  UpdateBookmarkPayload,
  ZoomPayload
} from '../shared/ipc';
import { getStore, initStore, saveStore } from './data/store';
import { nanoid } from 'nanoid';
import { normalizeUrl, parseUrlInput } from './utils/url';
import { isBlockedHost } from './utils/blocklist';

const isDev = !app.isPackaged;
let mainWindow: BrowserWindow | null = null;
let tabManager: TabManager | null = null;
const downloadItems = new Map<string, Electron.DownloadItem>();

const createWindow = async (options?: { incognito?: boolean }) => {
  await initStore();
  const partition = options?.incognito ? `uma-incognito-${nanoid()}` : undefined;

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#0f0f15',
    titleBarStyle: 'hiddenInset',
    title: options?.incognito ? 'UMA — Инкогнито' : 'UMA',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false
    }
  });

  mainWindow.on('resize', () => {
    tabManager?.resize();
  });

  const rendererUrl = isDev
    ? 'http://localhost:5173/index.html'
    : `file://${path.join(__dirname, '../renderer/index.html')}`;
  await mainWindow.loadURL(rendererUrl);

  tabManager = new TabManager({
    window: mainWindow,
    topInset: 88,
    contentInsets: { top: 88, left: 0, right: 0, bottom: 0 },
    partition,
    onTabStateChanged: (tabs, activeTabId) => {
      mainWindow?.webContents.send('uma:state', { tabs, activeTabId });
    },
    onNavigationState: (canGoBack, canGoForward, isLoading) => {
      mainWindow?.webContents.send('uma:nav-state', { canGoBack, canGoForward, isLoading });
    },
    onHistoryUpdated: async () => {
      const store = await getStore();
      mainWindow?.webContents.send('uma:history-updated', store.data.history);
    },
    onTopSitesUpdated: async () => {
      const store = await getStore();
      mainWindow?.webContents.send('uma:top-sites-updated', store.data.topSites);
    }
  });

  await createInitialTabs();
  setupDownloads(partition);
  setupPermissions(partition);
  setupBlocker(partition);
  setupIpc();
  setupAppMenu();
};

const createInitialTabs = async () => {
  const store = await getStore();
  const startPage = store.data.settings.startPage;
  if (startPage === 'last-session' && store.data.history.length > 0) {
    const last = store.data.history[0];
    await tabManager?.createTab(last.url, { activate: true });
  } else if (startPage === 'custom' && store.data.settings.startUrl) {
    await tabManager?.createTab(store.data.settings.startUrl, { activate: true });
  } else {
    await tabManager?.createTab('uma://newtab', { activate: true });
  }
};

const setupDownloads = (partition?: string) => {
  const targetSession = partition ? session.fromPartition(partition) : session.defaultSession;
  targetSession.on('will-download', async (event, item) => {
    const store = await getStore();
    const id = nanoid();
    downloadItems.set(id, item);
    const download = {
      id,
      url: item.getURL(),
      filePath: item.getSavePath() || '',
      filename: item.getFilename(),
      receivedBytes: 0,
      totalBytes: item.getTotalBytes(),
      state: 'progressing' as const,
      startedAt: Date.now()
    };

    store.data.downloads.unshift(download);
    await saveStore();
    mainWindow?.webContents.send('uma:downloads-updated', store.data.downloads);

    item.on('updated', async () => {
      download.receivedBytes = item.getReceivedBytes();
      download.totalBytes = item.getTotalBytes();
      download.state = item.isPaused() ? 'interrupted' : 'progressing';
      await saveStore();
      mainWindow?.webContents.send('uma:downloads-updated', store.data.downloads);
    });

    item.once('done', async (_, state) => {
      download.state = state;
      download.filePath = item.getSavePath() || download.filePath;
      await saveStore();
      mainWindow?.webContents.send('uma:downloads-updated', store.data.downloads);
      downloadItems.delete(id);
    });
  });
};

const setupPermissions = (partition?: string) => {
  const targetSession = partition ? session.fromPartition(partition) : session.defaultSession;
  targetSession.setPermissionRequestHandler(async (webContents, permission, callback) => {
    const store = await getStore();
    const url = new URL(webContents.getURL());
    const origin = url.origin;
    const sitePermissions = store.data.settings.permissions[origin] || {
      camera: 'ask',
      microphone: 'ask',
      notifications: 'ask',
      geolocation: 'ask'
    };

    const map: Record<string, keyof typeof sitePermissions> = {
      media: 'camera',
      microphone: 'microphone',
      notifications: 'notifications',
      geolocation: 'geolocation'
    };

    const key = map[permission];
    if (!key) {
      callback(false);
      return;
    }

    const decision = sitePermissions[key];
    callback(decision === 'allow');
  });
};

const setupBlocker = (partition?: string) => {
  const targetSession = partition ? session.fromPartition(partition) : session.defaultSession;
  targetSession.webRequest.onBeforeRequest((details, callback) => {
    void (async () => {
      const store = await getStore();
      if (!store.data.settings.blockTrackers) {
        callback({ cancel: false });
        return;
      }
      const url = new URL(details.url);
      callback({ cancel: isBlockedHost(url.hostname) });
    })();
  });
};

const setupAppMenu = () => {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'UMA',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        {
          label: 'Новое окно инкогнито',
          click: () => void createWindow({ incognito: true })
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggledevtools', accelerator: 'F12' },
        { type: 'separator' },
        { role: 'resetzoom' },
        { role: 'zoomin' },
        { role: 'zoomout' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

const setupIpc = () => {
  if (!tabManager || !mainWindow) return;

  ipcMain.handle('uma:get-state', async () => {
    const store = await getStore();
    return {
      tabs: tabManager?.getTabs() ?? [],
      activeTabId: tabManager?.getActiveTabId() ?? null,
      downloads: store.data.downloads,
      settings: store.data.settings,
      bookmarks: store.data.bookmarks,
      history: store.data.history,
      topSites: store.data.topSites
    };
  });

  ipcMain.on('uma:create-tab', (_, url?: string) => {
    void tabManager?.createTab(url || 'uma://newtab', { activate: true });
  });

  ipcMain.on('uma:new-window', (_, options?: { incognito?: boolean }) => {
    void createWindow({ incognito: options?.incognito });
  });

  ipcMain.on('uma:close-tab', (_, tabId: string) => {
    tabManager?.closeTab(tabId);
  });

  ipcMain.on('uma:activate-tab', (_, tabId: string) => {
    tabManager?.activateTab(tabId);
  });

  ipcMain.on('uma:duplicate-tab', (_, tabId: string) => {
    tabManager?.duplicateTab(tabId);
  });

  ipcMain.on('uma:pin-tab', (_, tabId: string, pinned: boolean) => {
    tabManager?.pinTab(tabId, pinned);
  });

  ipcMain.on('uma:move-tab', (_, payload: MoveTabPayload) => {
    tabManager?.moveTab(payload.tabId, payload.toIndex);
  });

  ipcMain.on('uma:navigate', (_, payload: NavigatePayload) => {
    if (!payload?.tabId) return;
    const value = parseUrlInput(payload.url);
    if (value.startsWith('uma://')) {
      tabManager?.navigate(payload.tabId, value);
      return;
    }
    tabManager?.navigate(payload.tabId, normalizeUrl(value));
  });

  ipcMain.on('uma:reload', (_, ignoreCache: boolean) => {
    tabManager?.reload(true, Boolean(ignoreCache));
  });

  ipcMain.on('uma:stop', () => {
    tabManager?.stopLoading();
  });

  ipcMain.on('uma:back', () => {
    tabManager?.goBack();
  });

  ipcMain.on('uma:forward', () => {
    tabManager?.goForward();
  });

  ipcMain.on('uma:restore-closed-tab', () => {
    tabManager?.restoreClosedTab();
  });

  ipcMain.on('uma:zoom', (_, payload: ZoomPayload) => {
    const view = tabManager?.getActiveView();
    if (!view) return;
    if (payload.reset) {
      void view.webContents.setZoomLevel(0);
      return;
    }
    const delta = payload.delta ?? 0;
    void view.webContents.getZoomLevel().then((level) => {
      void view.webContents.setZoomLevel(level + delta);
    });
  });

  ipcMain.on('uma:open-devtools', () => {
    tabManager?.openDevTools();
  });

  ipcMain.on('uma:set-omnibox-height', (_, payload: SetOmniboxHeightPayload) => {
    tabManager?.setTopInset(payload.height);
  });

  ipcMain.on('uma:update-settings', async (_, nextSettings) => {
    const store = await getStore();
    store.data.settings = { ...store.data.settings, ...nextSettings };
    await saveStore();
    nativeTheme.themeSource = store.data.settings.theme === 'dark' ? 'dark' : 'light';
    mainWindow?.webContents.send('uma:settings-updated', store.data.settings);
  });

  ipcMain.on('uma:add-bookmark', async (_, payload: AddBookmarkPayload) => {
    const store = await getStore();
    store.data.bookmarks.unshift({
      id: nanoid(),
      title: payload.title,
      url: payload.url,
      folderId: payload.folderId ?? null,
      isFolder: false,
      createdAt: Date.now()
    });
    await saveStore();
    mainWindow?.webContents.send('uma:bookmarks-updated', store.data.bookmarks);
  });

  ipcMain.on('uma:create-bookmark-folder', async (_, payload: CreateFolderPayload) => {
    const store = await getStore();
    store.data.bookmarks.unshift({
      id: nanoid(),
      title: payload.title,
      folderId: payload.parentId ?? null,
      isFolder: true,
      createdAt: Date.now()
    });
    await saveStore();
    mainWindow?.webContents.send('uma:bookmarks-updated', store.data.bookmarks);
  });

  ipcMain.on('uma:update-bookmark', async (_, payload: UpdateBookmarkPayload) => {
    const store = await getStore();
    const item = store.data.bookmarks.find((bookmark) => bookmark.id === payload.id);
    if (!item) return;
    if (payload.title !== undefined) item.title = payload.title;
    if (payload.url !== undefined) item.url = payload.url;
    if (payload.folderId !== undefined) item.folderId = payload.folderId;
    await saveStore();
    mainWindow?.webContents.send('uma:bookmarks-updated', store.data.bookmarks);
  });

  ipcMain.on('uma:remove-bookmark', async (_, id: string) => {
    const store = await getStore();
    store.data.bookmarks = store.data.bookmarks.filter((bookmark) => bookmark.id !== id);
    await saveStore();
    mainWindow?.webContents.send('uma:bookmarks-updated', store.data.bookmarks);
  });

  ipcMain.on('uma:clear-history', async () => {
    const store = await getStore();
    store.data.history = [];
    store.data.topSites = [];
    await saveStore();
    mainWindow?.webContents.send('uma:history-updated', store.data.history);
    mainWindow?.webContents.send('uma:top-sites-updated', store.data.topSites);
  });

  ipcMain.on('uma:find-in-page', (_, payload: FindInPagePayload) => {
    const view = tabManager?.getActiveView();
    if (!view) return;
    view.webContents.findInPage(payload.text, {
      forward: payload.forward ?? true,
      findNext: payload.findNext ?? false
    });
  });

  ipcMain.on('uma:show-download', async (_, id: string) => {
    const store = await getStore();
    const item = store.data.downloads.find((download) => download.id === id);
    if (!item) return;
    await shell.showItemInFolder(item.filePath);
  });

  ipcMain.on('uma:pause-download', (_, id: string) => {
    const item = downloadItems.get(id);
    if (item && !item.isPaused()) {
      item.pause();
    }
  });

  ipcMain.on('uma:resume-download', (_, id: string) => {
    const item = downloadItems.get(id);
    if (item && item.isPaused()) {
      item.resume();
    }
  });

  ipcMain.on('uma:cancel-download', (_, id: string) => {
    const item = downloadItems.get(id);
    if (item) {
      item.cancel();
    }
  });
};

app.whenReady().then(createWindow);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    void createWindow();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
