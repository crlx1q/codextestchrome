import { BrowserView, BrowserWindow, Menu, WebContents } from 'electron';
import { nanoid } from 'nanoid';
import { ClosedTabSnapshot, TabState } from '../shared/ipc';
import { normalizeUrl, parseUrlInput } from './utils/url';
import { getStore, saveStore } from './data/store';

export interface TabManagerOptions {
  window: BrowserWindow;
  topInset: number;
  contentInsets: { top: number; left: number; right: number; bottom: number };
  partition?: string;
  onTabStateChanged: (state: TabState[], activeTabId: string | null) => void;
  onNavigationState: (canGoBack: boolean, canGoForward: boolean, isLoading: boolean) => void;
  onHistoryUpdated: () => void;
  onTopSitesUpdated: () => void;
}

interface TabContext {
  id: string;
  view: BrowserView;
  state: TabState;
}

export class TabManager {
  private window: BrowserWindow;
  private tabs: TabContext[] = [];
  private activeTabId: string | null = null;
  private closedTabs: ClosedTabSnapshot[] = [];
  private topInset = 88;
  private contentInsets = { top: 88, left: 0, right: 0, bottom: 0 };
  private options: TabManagerOptions;
  private partition?: string;

  constructor(options: TabManagerOptions) {
    this.options = options;
    this.window = options.window;
    this.topInset = options.topInset;
    this.contentInsets = options.contentInsets;
    this.partition = options.partition;
  }

  setTopInset(height: number) {
    this.topInset = height;
    this.contentInsets.top = height;
    this.resize();
  }

  getTabs() {
    return this.tabs.map((tab) => tab.state);
  }

  getActiveTabId() {
    return this.activeTabId;
  }

  getActiveView() {
    const tab = this.tabs.find((item) => item.id === this.activeTabId);
    return tab?.view ?? null;
  }

  async createTab(url: string, { activate = true, pinned = false } = {}) {
    const tabId = nanoid();
    const view = new BrowserView({
      webPreferences: {
        contextIsolation: true,
        sandbox: true,
        nodeIntegration: false,
        devTools: true,
        partition: this.partition
      }
    });

    const titleMap: Record<string, string> = {
      'uma://newtab': 'Новая вкладка',
      'uma://settings': 'Настройки',
      'uma://history': 'История',
      'uma://bookmarks': 'Закладки',
      'uma://downloads': 'Загрузки'
    };

    const state: TabState = {
      id: tabId,
      title: titleMap[url] ?? 'Новая вкладка',
      url,
      favicon: null,
      isLoading: false,
      isPinned: pinned,
      isMuted: false
    };

    const tab: TabContext = { id: tabId, view, state };
    this.tabs.push(tab);
    this.attachView(tab);

    const target = url.startsWith('uma://') ? 'about:blank' : url;
    await view.webContents.loadURL(target);

    this.attachEvents(tab);

    if (activate) {
      this.activateTab(tabId);
    }

    this.emitTabState();
  }

  activateTab(tabId: string) {
    if (this.activeTabId === tabId) return;
    const tab = this.tabs.find((item) => item.id === tabId);
    if (!tab) return;
    this.detachAllViews();
    if (!tab.state.url.startsWith('uma://')) {
      this.window.addBrowserView(tab.view);
    }
    this.activeTabId = tabId;
    this.resize();
    this.updateNavigationState(tab.view.webContents);
    this.emitTabState();
  }

  closeTab(tabId: string) {
    const index = this.tabs.findIndex((item) => item.id === tabId);
    if (index === -1) return;
    const [tab] = this.tabs.splice(index, 1);
    if (tab) {
      if (!tab.view.webContents.isDestroyed()) {
        tab.view.webContents.destroy();
      }
    }
    this.closedTabs.push({
      url: tab.state.url,
      title: tab.state.title,
      isPinned: tab.state.isPinned
    });
    if (this.closedTabs.length > 20) {
      this.closedTabs.shift();
    }
    if (this.activeTabId === tabId) {
      const next = this.tabs[index] ?? this.tabs[index - 1];
      this.activeTabId = null;
      if (next) {
        this.activateTab(next.id);
      }
    }
    this.emitTabState();
  }

  restoreClosedTab() {
    const snapshot = this.closedTabs.pop();
    if (!snapshot) return;
    void this.createTab(snapshot.url, { activate: true, pinned: snapshot.isPinned });
  }

  duplicateTab(tabId: string) {
    const tab = this.tabs.find((item) => item.id === tabId);
    if (!tab) return;
    void this.createTab(tab.state.url, { activate: true, pinned: tab.state.isPinned });
  }

  pinTab(tabId: string, pinned: boolean) {
    const tab = this.tabs.find((item) => item.id === tabId);
    if (!tab) return;
    tab.state.isPinned = pinned;
    this.emitTabState();
  }

  moveTab(tabId: string, toIndex: number) {
    const fromIndex = this.tabs.findIndex((item) => item.id === tabId);
    if (fromIndex === -1 || toIndex < 0 || toIndex >= this.tabs.length) return;
    const [tab] = this.tabs.splice(fromIndex, 1);
    this.tabs.splice(toIndex, 0, tab);
    this.emitTabState();
  }

  navigate(tabId: string, urlInput: string) {
    const tab = this.tabs.find((item) => item.id === tabId);
    if (!tab) return;
    const normalized = normalizeUrl(parseUrlInput(urlInput));
    tab.state.url = normalized;
    if (normalized.startsWith('uma://')) {
      const titleMap: Record<string, string> = {
        'uma://newtab': 'Новая вкладка',
        'uma://settings': 'Настройки',
        'uma://history': 'История',
        'uma://bookmarks': 'Закладки',
        'uma://downloads': 'Загрузки'
      };
      tab.state.title = titleMap[normalized] ?? 'UMA';
      tab.state.favicon = null;
    }
    const target = normalized.startsWith('uma://') ? 'about:blank' : normalized;
    if (this.activeTabId === tabId) {
      if (normalized.startsWith('uma://')) {
        this.window.removeBrowserView(tab.view);
      } else {
        this.window.addBrowserView(tab.view);
      }
    }
    void tab.view.webContents.loadURL(target);
    this.emitTabState();
  }

  reload(activeOnly = true, ignoreCache = false) {
    const view = activeOnly ? this.getActiveView() : null;
    if (!view) return;
    if (ignoreCache) {
      view.webContents.reloadIgnoringCache();
    } else {
      view.webContents.reload();
    }
  }

  stopLoading() {
    const view = this.getActiveView();
    view?.webContents.stop();
  }

  goBack() {
    const view = this.getActiveView();
    if (view?.webContents.canGoBack()) {
      view.webContents.goBack();
    }
  }

  goForward() {
    const view = this.getActiveView();
    if (view?.webContents.canGoForward()) {
      view.webContents.goForward();
    }
  }

  openDevTools() {
    const view = this.getActiveView();
    if (!view) return;
    view.webContents.openDevTools({ mode: 'detach' });
  }

  resize() {
    const bounds = this.window.getContentBounds();
    const view = this.getActiveView();
    if (!view) return;
    view.setBounds({
      x: this.contentInsets.left,
      y: this.contentInsets.top,
      width: bounds.width - this.contentInsets.left - this.contentInsets.right,
      height: bounds.height - this.contentInsets.top - this.contentInsets.bottom
    });
  }

  private attachView(tab: TabContext) {
    this.window.addBrowserView(tab.view);
    tab.view.setAutoResize({ width: true, height: true });
    tab.view.setBounds({
      x: this.contentInsets.left,
      y: this.contentInsets.top,
      width: this.window.getContentBounds().width,
      height: this.window.getContentBounds().height - this.contentInsets.top
    });
    this.window.removeBrowserView(tab.view);
  }

  private detachAllViews() {
    this.tabs.forEach((tab) => {
      this.window.removeBrowserView(tab.view);
    });
  }

  private attachEvents(tab: TabContext) {
    const contents = tab.view.webContents;
    contents.on('will-navigate', (event, url) => {
      if (url.startsWith('uma://')) {
        event.preventDefault();
        tab.state.url = url;
        const titleMap: Record<string, string> = {
          'uma://newtab': 'Новая вкладка',
          'uma://settings': 'Настройки',
          'uma://history': 'История',
          'uma://bookmarks': 'Закладки',
          'uma://downloads': 'Загрузки'
        };
        tab.state.title = titleMap[url] ?? 'UMA';
        tab.state.favicon = null;
        if (this.activeTabId === tab.id) {
          this.window.removeBrowserView(tab.view);
        }
        this.emitTabState();
      }
    });
    contents.setWindowOpenHandler(({ url }) => {
      void this.createTab(url, { activate: true });
      return { action: 'deny' };
    });
    contents.on('page-title-updated', (_, title) => {
      tab.state.title = title || tab.state.url;
      this.emitTabState();
    });

    contents.on('page-favicon-updated', (_, favicons) => {
      tab.state.favicon = favicons[0] ?? null;
      this.emitTabState();
    });

    contents.on('did-start-loading', () => {
      tab.state.isLoading = true;
      this.emitTabState();
      this.updateNavigationState(contents);
    });

    contents.on('did-stop-loading', () => {
      tab.state.isLoading = false;
      this.emitTabState();
      this.updateNavigationState(contents);
    });

    contents.on('did-navigate', (_, url) => {
      if (url === 'about:blank' && tab.state.url.startsWith('uma://')) {
        this.emitTabState();
        return;
      }
      tab.state.url = url;
      this.updateHistory(contents);
      this.emitTabState();
    });

    contents.on('did-navigate-in-page', (_, url) => {
      if (url === 'about:blank' && tab.state.url.startsWith('uma://')) {
        this.emitTabState();
        return;
      }
      tab.state.url = url;
      this.updateHistory(contents, true);
      this.emitTabState();
    });

    contents.on('context-menu', (event, params) => {
      event.preventDefault();
      const template: Electron.MenuItemConstructorOptions[] = [
        {
          label: 'Назад',
          enabled: contents.canGoBack(),
          click: () => contents.goBack()
        },
        {
          label: 'Вперед',
          enabled: contents.canGoForward(),
          click: () => contents.goForward()
        },
        { type: 'separator' },
        {
          label: 'Перезагрузить',
          click: () => contents.reload()
        },
        { type: 'separator' },
        {
          label: 'Копировать',
          role: 'copy',
          enabled: params.selectionText.length > 0
        },
        {
          label: 'Вставить',
          role: 'paste'
        }
      ];

      if (params.linkURL) {
        template.push({ type: 'separator' });
        template.push({
          label: 'Открыть ссылку в новой вкладке',
          click: () => void this.createTab(params.linkURL, { activate: true })
        });
      }

      if (params.mediaType === 'image' && params.srcURL) {
        template.push({
          label: 'Сохранить изображение как…',
          click: () => void contents.downloadURL(params.srcURL)
        });
      }

      const menu = Menu.buildFromTemplate(template);
      menu.popup({ window: this.window });
    });
  }

  private updateNavigationState(contents: WebContents) {
    if (this.activeTabId !== this.tabs.find((item) => item.view.webContents === contents)?.id) {
      return;
    }
    this.options.onNavigationState(contents.canGoBack(), contents.canGoForward(), contents.isLoading());
  }

  private async updateHistory(contents: WebContents, inPage = false) {
    if (!contents.getURL()) return;
    const store = await getStore();
    const entry = {
      id: nanoid(),
      title: contents.getTitle() || contents.getURL(),
      url: contents.getURL(),
      visitedAt: Date.now()
    };
    store.data.history.unshift(entry);
    store.data.history = store.data.history.slice(0, 500);
    if (!inPage) {
      this.updateTopSites(contents.getURL(), contents.getTitle());
    }
    await saveStore();
    this.options.onHistoryUpdated();
  }

  private async updateTopSites(url: string, title: string) {
    const store = await getStore();
    const existing = store.data.topSites.find((site) => site.url === url);
    if (existing) {
      existing.visits += 1;
      existing.title = title || existing.title;
    } else {
      store.data.topSites.push({ url, title: title || url, visits: 1 });
    }
    store.data.topSites.sort((a, b) => b.visits - a.visits);
    store.data.topSites = store.data.topSites.slice(0, 12);
    await saveStore();
    this.options.onTopSitesUpdated();
  }

  private emitTabState() {
    this.options.onTabStateChanged(this.getTabs(), this.activeTabId);
  }
}
