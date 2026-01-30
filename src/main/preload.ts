import { contextBridge, ipcRenderer } from 'electron';
import {
  AddBookmarkPayload,
  CreateFolderPayload,
  FindInPagePayload,
  MoveTabPayload,
  NavigatePayload,
  SetOmniboxHeightPayload,
  UpdateBookmarkPayload
} from '../shared/ipc';

contextBridge.exposeInMainWorld('uma', {
  getState: () => ipcRenderer.invoke('uma:get-state'),
  createTab: (url?: string) => ipcRenderer.send('uma:create-tab', url),
  newWindow: (options?: { incognito?: boolean }) => ipcRenderer.send('uma:new-window', options),
  closeTab: (tabId: string) => ipcRenderer.send('uma:close-tab', tabId),
  activateTab: (tabId: string) => ipcRenderer.send('uma:activate-tab', tabId),
  duplicateTab: (tabId: string) => ipcRenderer.send('uma:duplicate-tab', tabId),
  pinTab: (tabId: string, pinned: boolean) => ipcRenderer.send('uma:pin-tab', tabId, pinned),
  moveTab: (payload: MoveTabPayload) => ipcRenderer.send('uma:move-tab', payload),
  navigate: (payload: NavigatePayload) => ipcRenderer.send('uma:navigate', payload),
  reload: (ignoreCache?: boolean) => ipcRenderer.send('uma:reload', ignoreCache),
  stop: () => ipcRenderer.send('uma:stop'),
  back: () => ipcRenderer.send('uma:back'),
  forward: () => ipcRenderer.send('uma:forward'),
  restoreClosedTab: () => ipcRenderer.send('uma:restore-closed-tab'),
  openDevTools: () => ipcRenderer.send('uma:open-devtools'),
  updateSettings: (settings: Record<string, unknown>) =>
    ipcRenderer.send('uma:update-settings', settings),
  addBookmark: (payload: AddBookmarkPayload) => ipcRenderer.send('uma:add-bookmark', payload),
  createBookmarkFolder: (payload: CreateFolderPayload) =>
    ipcRenderer.send('uma:create-bookmark-folder', payload),
  updateBookmark: (payload: UpdateBookmarkPayload) =>
    ipcRenderer.send('uma:update-bookmark', payload),
  removeBookmark: (id: string) => ipcRenderer.send('uma:remove-bookmark', id),
  clearHistory: () => ipcRenderer.send('uma:clear-history'),
  zoom: (payload: { delta?: number; reset?: boolean }) => ipcRenderer.send('uma:zoom', payload),
  findInPage: (payload: FindInPagePayload) => ipcRenderer.send('uma:find-in-page', payload),
  showDownload: (id: string) => ipcRenderer.send('uma:show-download', id),
  pauseDownload: (id: string) => ipcRenderer.send('uma:pause-download', id),
  resumeDownload: (id: string) => ipcRenderer.send('uma:resume-download', id),
  cancelDownload: (id: string) => ipcRenderer.send('uma:cancel-download', id),
  setOmniboxHeight: (payload: SetOmniboxHeightPayload) =>
    ipcRenderer.send('uma:set-omnibox-height', payload),
  onState: (callback: (payload: any) => void) => ipcRenderer.on('uma:state', (_, payload) => callback(payload)),
  onNavState: (callback: (payload: any) => void) =>
    ipcRenderer.on('uma:nav-state', (_, payload) => callback(payload)),
  onHistoryUpdated: (callback: (payload: any) => void) =>
    ipcRenderer.on('uma:history-updated', (_, payload) => callback(payload)),
  onBookmarksUpdated: (callback: (payload: any) => void) =>
    ipcRenderer.on('uma:bookmarks-updated', (_, payload) => callback(payload)),
  onSettingsUpdated: (callback: (payload: any) => void) =>
    ipcRenderer.on('uma:settings-updated', (_, payload) => callback(payload)),
  onDownloadsUpdated: (callback: (payload: any) => void) =>
    ipcRenderer.on('uma:downloads-updated', (_, payload) => callback(payload)),
  onTopSitesUpdated: (callback: (payload: any) => void) =>
    ipcRenderer.on('uma:top-sites-updated', (_, payload) => callback(payload))
});
