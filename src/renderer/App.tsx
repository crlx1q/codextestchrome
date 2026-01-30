import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TabStrip } from './components/TabStrip';
import { Toolbar } from './components/Toolbar';
import { Omnibox } from './components/Omnibox';
import { BookmarksBar } from './components/BookmarksBar';
import { useUmaState } from './state/useUmaState';
import { NewTab } from './pages/NewTab';
import { Settings } from './pages/Settings';
import { History } from './pages/History';
import { Bookmarks } from './pages/Bookmarks';
import { Downloads } from './pages/Downloads';
import { buildSearchUrl, isProbablyUrl } from './utils/search';

const internalPages = new Set([
  'uma://newtab',
  'uma://settings',
  'uma://history',
  'uma://bookmarks',
  'uma://downloads'
]);

export const App: React.FC = () => {
  const { state, activeTab, navState } = useUmaState();
  const headerRef = useRef<HTMLDivElement>(null);
  const [omniboxValue, setOmniboxValue] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!headerRef.current) return;
    const height = headerRef.current.getBoundingClientRect().height;
    window.uma.setOmniboxHeight({ height });
  }, [state.tabs.length, state.settings.showBookmarksBar]);

  useEffect(() => {
    if (activeTab?.url) {
      setOmniboxValue(activeTab.url);
    }
  }, [activeTab?.url]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 't') {
        event.preventDefault();
        window.uma.createTab('uma://newtab');
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'w') {
        event.preventDefault();
        if (state.activeTabId) window.uma.closeTab(state.activeTabId);
      }
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 't') {
        event.preventDefault();
        window.uma.restoreClosedTab();
      }
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'i') {
        event.preventDefault();
        window.uma.openDevTools();
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'Tab') {
        event.preventDefault();
        const index = state.tabs.findIndex((tab) => tab.id === state.activeTabId);
        const direction = event.shiftKey ? -1 : 1;
        const nextIndex = (index + direction + state.tabs.length) % state.tabs.length;
        const next = state.tabs[nextIndex];
        if (next) window.uma.activateTab(next.id);
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'r') {
        event.preventDefault();
        window.uma.reload(event.shiftKey);
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        const query = prompt('Найти на странице');
        if (query) window.uma.findInPage({ text: query });
      }
      if ((event.ctrlKey || event.metaKey) && event.key === '+') {
        event.preventDefault();
        window.uma.zoom({ delta: 0.5 });
      }
      if ((event.ctrlKey || event.metaKey) && event.key === '-') {
        event.preventDefault();
        window.uma.zoom({ delta: -0.5 });
      }
      if ((event.ctrlKey || event.metaKey) && event.key === '0') {
        event.preventDefault();
        window.uma.zoom({ reset: true });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [state.activeTabId, state.tabs]);

  const handleNavigate = (value: string) => {
    if (!state.activeTabId) return;
    if (internalPages.has(value)) {
      window.uma.navigate({ tabId: state.activeTabId, url: value });
      return;
    }
    if (isProbablyUrl(value)) {
      window.uma.navigate({ tabId: state.activeTabId, url: value });
      return;
    }
    const searchUrl = buildSearchUrl(value, state.settings);
    window.uma.navigate({ tabId: state.activeTabId, url: searchUrl });
  };

  const internalPage = useMemo(() => {
    if (!activeTab?.url || !internalPages.has(activeTab.url)) return null;
    switch (activeTab.url) {
      case 'uma://newtab':
        return (
          <NewTab
            topSites={state.topSites}
            settings={state.settings}
            onNavigate={handleNavigate}
          />
        );
      case 'uma://settings':
        return (
          <Settings
            settings={state.settings}
            onUpdate={(next) => window.uma.updateSettings(next)}
          />
        );
      case 'uma://history':
        return <History history={state.history} onNavigate={handleNavigate} />;
      case 'uma://bookmarks':
        return <Bookmarks bookmarks={state.bookmarks} onNavigate={handleNavigate} />;
      case 'uma://downloads':
        return <Downloads downloads={state.downloads} />;
      default:
        return null;
    }
  }, [activeTab?.url, state]);

  return (
    <div className={`app theme-${state.settings.theme}`}>
      <div className="window-header" ref={headerRef}>
        <TabStrip
          tabs={state.tabs}
          activeTabId={state.activeTabId}
          onNewTab={() => window.uma.createTab('uma://newtab')}
        />
        <div className="toolbar-row">
          <Toolbar
            canGoBack={navState.canGoBack}
            canGoForward={navState.canGoForward}
            isLoading={navState.isLoading}
            onBack={() => window.uma.back()}
            onForward={() => window.uma.forward()}
            onReload={() => window.uma.reload(false)}
            onStop={() => window.uma.stop()}
            onHome={() => handleNavigate('uma://newtab')}
            onDevTools={() => window.uma.openDevTools()}
          />
          <Omnibox
            value={omniboxValue}
            onNavigate={handleNavigate}
            bookmarks={state.bookmarks}
            history={state.history}
            topSites={state.topSites}
            settings={state.settings}
          />
          <div className="menu-actions">
            <button
              className="bookmark-action"
              onClick={() => {
                if (!activeTab?.url || activeTab.url.startsWith('uma://')) return;
                window.uma.addBookmark({
                  title: activeTab.title || activeTab.url,
                  url: activeTab.url
                });
              }}
              title="Добавить в закладки"
            >
              ★
            </button>
            <button onClick={() => setMenuOpen((open) => !open)}>≡</button>
            {menuOpen && (
              <div className="menu-dropdown">
                <button onClick={() => handleNavigate('uma://newtab')}>Новая вкладка</button>
                <button onClick={() => window.uma.newWindow({ incognito: true })}>
                  Окно инкогнито
                </button>
                <button onClick={() => handleNavigate('uma://history')}>История</button>
                <button onClick={() => handleNavigate('uma://bookmarks')}>Закладки</button>
                <button onClick={() => handleNavigate('uma://downloads')}>Загрузки</button>
                <button onClick={() => handleNavigate('uma://settings')}>Настройки</button>
              </div>
            )}
          </div>
        </div>
        {state.settings.showBookmarksBar && (
          <BookmarksBar bookmarks={state.bookmarks} onNavigate={handleNavigate} />
        )}
      </div>
      <div className="content-shell">
        {internalPage ? (
          <div className="internal-page">{internalPage}</div>
        ) : (
          <div className="content-placeholder">
            {activeTab?.url ? null : 'Создайте новую вкладку'}
          </div>
        )}
      </div>
    </div>
  );
};
