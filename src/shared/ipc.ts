export type ThemeMode = 'purple' | 'light' | 'dark';

export type SearchProviderId = 'google' | 'bing' | 'duckduckgo' | 'custom';

export interface SearchProvider {
  id: SearchProviderId;
  name: string;
  searchUrl: string;
}

export interface SettingsState {
  theme: ThemeMode;
  searchProvider: SearchProviderId;
  customSearchUrl: string;
  startPage: 'newtab' | 'last-session' | 'custom';
  startUrl: string;
  showBookmarksBar: boolean;
  blockTrackers: boolean;
  permissions: Record<string, SitePermissions>;
}

export interface SitePermissions {
  camera: 'allow' | 'block' | 'ask';
  microphone: 'allow' | 'block' | 'ask';
  notifications: 'allow' | 'block' | 'ask';
  geolocation: 'allow' | 'block' | 'ask';
}

export interface TabState {
  id: string;
  title: string;
  url: string;
  favicon: string | null;
  isLoading: boolean;
  isPinned: boolean;
  isMuted: boolean;
}

export interface BookmarkItem {
  id: string;
  title: string;
  url?: string;
  folderId?: string | null;
  isFolder: boolean;
  createdAt: number;
}

export interface HistoryItem {
  id: string;
  title: string;
  url: string;
  visitedAt: number;
}

export interface DownloadItem {
  id: string;
  url: string;
  filePath: string;
  filename: string;
  receivedBytes: number;
  totalBytes: number;
  state: 'progressing' | 'completed' | 'cancelled' | 'interrupted';
  startedAt: number;
}

export interface TopSite {
  url: string;
  title: string;
  visits: number;
}

export interface ClosedTabSnapshot {
  url: string;
  title: string;
  isPinned: boolean;
}

export interface UiState {
  tabs: TabState[];
  activeTabId: string | null;
  canGoBack: boolean;
  canGoForward: boolean;
  isLoading: boolean;
  downloads: DownloadItem[];
  settings: SettingsState;
  bookmarks: BookmarkItem[];
  history: HistoryItem[];
  topSites: TopSite[];
}

export type RendererToMainChannels =
  | 'uma:create-tab'
  | 'uma:close-tab'
  | 'uma:activate-tab'
  | 'uma:duplicate-tab'
  | 'uma:pin-tab'
  | 'uma:move-tab'
  | 'uma:navigate'
  | 'uma:reload'
  | 'uma:stop'
  | 'uma:back'
  | 'uma:forward'
  | 'uma:new-window'
  | 'uma:restore-closed-tab'
  | 'uma:zoom'
  | 'uma:update-settings'
  | 'uma:add-bookmark'
  | 'uma:remove-bookmark'
  | 'uma:create-bookmark-folder'
  | 'uma:delete-bookmark-folder'
  | 'uma:update-bookmark'
  | 'uma:search-bookmarks'
  | 'uma:clear-history'
  | 'uma:find-in-page'
  | 'uma:show-download'
  | 'uma:pause-download'
  | 'uma:resume-download'
  | 'uma:cancel-download'
  | 'uma:focus-omnibox'
  | 'uma:set-omnibox-height';

export type MainToRendererChannels =
  | 'uma:state'
  | 'uma:tab-updated'
  | 'uma:tab-closed'
  | 'uma:downloads-updated'
  | 'uma:history-updated'
  | 'uma:bookmarks-updated'
  | 'uma:settings-updated'
  | 'uma:top-sites-updated'
  | 'uma:omnibox-focus'
  | 'uma:find-in-page-result';

export interface FindInPagePayload {
  text: string;
  forward?: boolean;
  findNext?: boolean;
}

export interface MoveTabPayload {
  tabId: string;
  toIndex: number;
}

export interface NavigatePayload {
  tabId: string;
  url: string;
}

export interface AddBookmarkPayload {
  title: string;
  url: string;
  folderId?: string | null;
}

export interface UpdateBookmarkPayload {
  id: string;
  title?: string;
  url?: string;
  folderId?: string | null;
}

export interface CreateFolderPayload {
  title: string;
  parentId?: string | null;
}

export interface SetOmniboxHeightPayload {
  height: number;
}

export interface ZoomPayload {
  delta?: number;
  reset?: boolean;
}
