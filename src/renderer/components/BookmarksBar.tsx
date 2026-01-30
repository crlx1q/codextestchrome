import React, { useState } from 'react';
import { BookmarkItem } from '../../shared/ipc';

interface BookmarksBarProps {
  bookmarks: BookmarkItem[];
  onNavigate: (url: string) => void;
}

export const BookmarksBar: React.FC<BookmarksBarProps> = ({ bookmarks, onNavigate }) => {
  const [openFolder, setOpenFolder] = useState<string | null>(null);
  const folders = bookmarks.filter((item) => item.isFolder);
  const rootItems = bookmarks.filter((item) => !item.isFolder && !item.folderId);

  const renderFolder = (folder: BookmarkItem) => {
    const items = bookmarks.filter((item) => item.folderId === folder.id && !item.isFolder);
    return (
      <div key={folder.id} className="bookmark-folder">
        <button
          onClick={() => setOpenFolder(openFolder === folder.id ? null : folder.id)}
          className={openFolder === folder.id ? 'is-open' : ''}
        >
          📁 {folder.title}
        </button>
        {openFolder === folder.id && (
          <div className="bookmark-folder__menu">
            {items.map((item) => (
              <button key={item.id} onClick={() => onNavigate(item.url || '')}>
                {item.title}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bookmarks-bar">
      <div className="bookmarks-bar__items">
        {rootItems.map((item) => (
          <button key={item.id} onClick={() => onNavigate(item.url || '')}>
            {item.title}
          </button>
        ))}
        {folders.map(renderFolder)}
      </div>
      <button
        className="bookmarks-bar__add"
        onClick={() =>
          window.uma.addBookmark({ title: 'Новая закладка', url: 'https://www.example.com' })
        }
      >
        +
      </button>
    </div>
  );
};
