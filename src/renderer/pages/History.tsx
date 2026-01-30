import React, { useMemo, useState } from 'react';
import { HistoryItem } from '../../shared/ipc';

interface HistoryProps {
  history: HistoryItem[];
  onNavigate: (url: string) => void;
}

export const History: React.FC<HistoryProps> = ({ history, onNavigate }) => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return history;
    return history.filter(
      (item) => item.title.toLowerCase().includes(value) || item.url.toLowerCase().includes(value)
    );
  }, [history, query]);

  return (
    <div className="page history">
      <h1>История</h1>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Поиск по истории"
      />
      <div className="history__list">
        {filtered.map((item) => (
          <button key={item.id} onClick={() => onNavigate(item.url)}>
            <span>{item.title}</span>
            <small>{item.url}</small>
          </button>
        ))}
      </div>
    </div>
  );
};
