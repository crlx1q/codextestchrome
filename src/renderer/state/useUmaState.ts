import { useEffect, useMemo, useState } from 'react';
import { UiState } from '../../shared/ipc';

const emptyState: UiState = {
  tabs: [],
  activeTabId: null,
  canGoBack: false,
  canGoForward: false,
  isLoading: false,
  downloads: [],
  settings: {
    theme: 'purple',
    searchProvider: 'google',
    customSearchUrl: 'https://www.google.com/search?q=%s',
    startPage: 'newtab',
    startUrl: 'uma://newtab',
    showBookmarksBar: true,
    blockTrackers: false,
    permissions: {}
  },
  bookmarks: [],
  history: [],
  topSites: []
};

export const useUmaState = () => {
  const [state, setState] = useState<UiState>(emptyState);
  const [navState, setNavState] = useState({
    canGoBack: false,
    canGoForward: false,
    isLoading: false
  });

  useEffect(() => {
    void window.uma.getState().then((payload) => {
      setState((prev) => ({ ...prev, ...payload }));
    });

    window.uma.onState((payload) => {
      setState((prev) => ({ ...prev, ...payload }));
    });

    window.uma.onNavState((payload) => {
      setNavState(payload);
    });

    window.uma.onHistoryUpdated((payload) => {
      setState((prev) => ({ ...prev, history: payload }));
    });

    window.uma.onBookmarksUpdated((payload) => {
      setState((prev) => ({ ...prev, bookmarks: payload }));
    });

    window.uma.onSettingsUpdated((payload) => {
      setState((prev) => ({ ...prev, settings: payload }));
    });

    window.uma.onDownloadsUpdated((payload) => {
      setState((prev) => ({ ...prev, downloads: payload }));
    });

    window.uma.onTopSitesUpdated((payload) => {
      setState((prev) => ({ ...prev, topSites: payload }));
    });
  }, []);

  const activeTab = useMemo(
    () => state.tabs.find((tab) => tab.id === state.activeTabId) ?? null,
    [state.tabs, state.activeTabId]
  );

  return { state, setState, activeTab, navState };
};
