import React, { useState } from 'react';
import { TopSite } from '../../shared/ipc';
import { buildSearchUrl } from '../utils/search';

interface NewTabProps {
  topSites: TopSite[];
  settings: any;
  onNavigate: (url: string) => void;
}

export const NewTab: React.FC<NewTabProps> = ({ topSites, settings, onNavigate }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;
    const url = buildSearchUrl(query.trim(), settings);
    onNavigate(url);
  };

  return (
    <div className="page newtab">
      <div className="newtab__hero">
        <h1>UMA</h1>
        <p>Ваш быстрый и безопасный браузер</p>
        <form onSubmit={handleSubmit} className="newtab__search">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ищите в сети"
          />
          <button type="submit">Поиск</button>
        </form>
      </div>
      <div className="newtab__topsites">
        <h2>Часто посещаемые</h2>
        <div className="topsites-grid">
          {topSites.map((site) => (
            <button key={site.url} onClick={() => onNavigate(site.url)}>
              <span>{site.title}</span>
              <small>{site.url}</small>
            </button>
          ))}
        </div>
      </div>
      <div className="newtab__widgets">
        <h2>Виджеты</h2>
        <div className="widget-placeholder">
          Здесь можно будет добавить обои, новости, погоду и другие виджеты.
        </div>
      </div>
    </div>
  );
};
