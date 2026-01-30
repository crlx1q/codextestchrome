import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookmarkItem, HistoryItem, TopSite } from '../../shared/ipc';
import { buildSearchUrl, isProbablyUrl } from '../utils/search';

interface OmniboxProps {
  value: string;
  onNavigate: (value: string) => void;
  bookmarks: BookmarkItem[];
  history: HistoryItem[];
  topSites: TopSite[];
  settings: any;
}

export const Omnibox: React.FC<OmniboxProps> = ({
  value,
  onNavigate,
  bookmarks,
  history,
  topSites,
  settings
}) => {
  const [input, setInput] = useState(value);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInput(value);
  }, [value]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'l') {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const suggestions = useMemo(() => {
    const query = input.trim().toLowerCase();
    if (!query) return [] as { title: string; url: string }[];
    const fromBookmarks = bookmarks
      .filter((item) => !item.isFolder && item.title.toLowerCase().includes(query))
      .slice(0, 4)
      .map((item) => ({ title: item.title, url: item.url ?? '' }));
    const fromHistory = history
      .filter((item) => item.title.toLowerCase().includes(query) || item.url.includes(query))
      .slice(0, 4)
      .map((item) => ({ title: item.title, url: item.url }));
    const fromTop = topSites
      .filter((site) => site.title.toLowerCase().includes(query) || site.url.includes(query))
      .slice(0, 4)
      .map((site) => ({ title: site.title, url: site.url }));
    return [...fromBookmarks, ...fromHistory, ...fromTop].slice(0, 8);
  }, [input, bookmarks, history, topSites]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    if (trimmed.startsWith('uma://')) {
      onNavigate(trimmed);
      setOpen(false);
      return;
    }
    if (isProbablyUrl(trimmed)) {
      onNavigate(trimmed);
      setOpen(false);
      return;
    }
    const searchUrl = buildSearchUrl(trimmed, settings);
    onNavigate(searchUrl);
    setOpen(false);
  };

  return (
    <form className="omnibox" onSubmit={handleSubmit}>
      <input
        ref={inputRef}
        value={input}
        onChange={(event) => {
          setInput(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Введите адрес или запрос"
      />
      <button type="submit" aria-label="Перейти">
        ↵
      </button>
      {open && suggestions.length > 0 && (
        <div className="omnibox__suggestions">
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.url}-${index}`}
              type="button"
              onMouseDown={() => {
                setInput(suggestion.url);
                onNavigate(suggestion.url);
                setOpen(false);
              }}
            >
              <span>{suggestion.title}</span>
              <small>{suggestion.url}</small>
            </button>
          ))}
        </div>
      )}
    </form>
  );
};
