import {
  AddBookmarkPayload,
  CreateFolderPayload,
  FindInPagePayload,
  MoveTabPayload,
  NavigatePayload,
  SetOmniboxHeightPayload,
  UpdateBookmarkPayload
} from '../shared/ipc';

export {};

declare global {
  interface Window {
    uma: {
      getState: () => Promise<any>;
      createTab: (url?: string) => void;
      newWindow: (options?: { incognito?: boolean }) => void;
      closeTab: (tabId: string) => void;
      activateTab: (tabId: string) => void;
      duplicateTab: (tabId: string) => void;
      pinTab: (tabId: string, pinned: boolean) => void;
      moveTab: (payload: MoveTabPayload) => void;
      navigate: (payload: NavigatePayload) => void;
      reload: (ignoreCache?: boolean) => void;
      stop: () => void;
      back: () => void;
      forward: () => void;
      restoreClosedTab: () => void;
      openDevTools: () => void;
      updateSettings: (settings: Record<string, unknown>) => void;
      addBookmark: (payload: AddBookmarkPayload) => void;
      createBookmarkFolder: (payload: CreateFolderPayload) => void;
      updateBookmark: (payload: UpdateBookmarkPayload) => void;
      removeBookmark: (id: string) => void;
      clearHistory: () => void;
      zoom: (payload: { delta?: number; reset?: boolean }) => void;
      findInPage: (payload: FindInPagePayload) => void;
      showDownload: (id: string) => void;
      pauseDownload: (id: string) => void;
      resumeDownload: (id: string) => void;
      cancelDownload: (id: string) => void;
      setOmniboxHeight: (payload: SetOmniboxHeightPayload) => void;
      onState: (callback: (payload: any) => void) => void;
      onNavState: (callback: (payload: any) => void) => void;
      onHistoryUpdated: (callback: (payload: any) => void) => void;
      onBookmarksUpdated: (callback: (payload: any) => void) => void;
      onSettingsUpdated: (callback: (payload: any) => void) => void;
      onDownloadsUpdated: (callback: (payload: any) => void) => void;
      onTopSitesUpdated: (callback: (payload: any) => void) => void;
    };
  }
}
