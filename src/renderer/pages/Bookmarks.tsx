import React, { useMemo, useState } from 'react';
import { BookmarkItem } from '../../shared/ipc';

interface BookmarksProps {
  bookmarks: BookmarkItem[];
  onNavigate: (url: string) => void;
}

export const Bookmarks: React.FC<BookmarksProps> = ({ bookmarks, onNavigate }) => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return bookmarks;
    return bookmarks.filter(
      (item) => !item.isFolder && item.title.toLowerCase().includes(value)
    );
  }, [bookmarks, query]);

  const folders = useMemo(() => bookmarks.filter((item) => item.isFolder), [bookmarks]);

  return (
    <div className="page bookmarks">
      <h1>Закладки</h1>
      <div className="bookmarks__toolbar">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск по закладкам"
        />
        <button
          onClick={() =>
            window.uma.addBookmark({
              title: 'Новая закладка',
              url: 'https://www.example.com'
            })
          }
        >
          Добавить
        </button>
        <button
          onClick={() =>
            window.uma.createBookmarkFolder({
              title: `Папка ${folders.length + 1}`
            })
          }
        >
          Папка
        </button>
      </div>
      {folders.length > 0 && (
        <div className="bookmarks__folders">
          {folders.map((folder) => (
            <div key={folder.id} className="bookmark-folder-card">
              <strong>{folder.title}</strong>
              <button onClick={() => window.uma.removeBookmark(folder.id)}>Удалить</button>
            </div>
          ))}
        </div>
      )}
      <div className="bookmarks__list">
        {filtered
          .filter((item) => !item.isFolder)
          .map((item) => (
            <div key={item.id} className="bookmark-card">
              <div>
                <strong>{item.title}</strong>
                <small>{item.url}</small>
              </div>
              <div className="bookmark-card__actions">
                <button onClick={() => onNavigate(item.url || '')}>Открыть</button>
                <button onClick={() => window.uma.removeBookmark(item.id)}>Удалить</button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};
