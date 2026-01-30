import { SearchProviderId, SettingsState } from '../../shared/ipc';

export const searchProviders = {
  google: {
    id: 'google',
    name: 'Google',
    searchUrl: 'https://www.google.com/search?q=%s'
  },
  bing: {
    id: 'bing',
    name: 'Bing',
    searchUrl: 'https://www.bing.com/search?q=%s'
  },
  duckduckgo: {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    searchUrl: 'https://duckduckgo.com/?q=%s'
  },
  custom: {
    id: 'custom',
    name: 'Custom',
    searchUrl: 'https://www.google.com/search?q=%s'
  }
} satisfies Record<SearchProviderId, { id: SearchProviderId; name: string; searchUrl: string }>;

export const buildSearchUrl = (query: string, settings: SettingsState) => {
  const provider = settings.searchProvider;
  const template =
    provider === 'custom' ? settings.customSearchUrl : searchProviders[provider].searchUrl;
  return template.replace('%s', encodeURIComponent(query));
};

export const isProbablyUrl = (value: string) => {
  try {
    const input = value.trim();
    if (input.includes(' ') || input.length === 0) return false;
    const url = new URL(input.includes('://') ? input : `https://${input}`);
    return Boolean(url.hostname.includes('.')) || url.hostname === 'localhost';
  } catch {
    return false;
  }
};
