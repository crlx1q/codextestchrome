import React, { useState } from 'react';
import { SettingsState } from '../../shared/ipc';
import { searchProviders } from '../utils/search';

interface SettingsProps {
  settings: SettingsState;
  onUpdate: (next: Partial<SettingsState>) => void;
}

export const Settings: React.FC<SettingsProps> = ({ settings, onUpdate }) => {
  const [customUrl, setCustomUrl] = useState(settings.customSearchUrl);

  return (
    <div className="page settings">
      <h1>Настройки UMA</h1>
      <section>
        <h2>Поисковая система</h2>
        <select
          value={settings.searchProvider}
          onChange={(event) => onUpdate({ searchProvider: event.target.value as any })}
        >
          {Object.values(searchProviders).map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.name}
            </option>
          ))}
        </select>
        {settings.searchProvider === 'custom' && (
          <div className="settings__row">
            <input
              value={customUrl}
              onChange={(event) => setCustomUrl(event.target.value)}
              placeholder="https://search.example.com?q=%s"
            />
            <button onClick={() => onUpdate({ customSearchUrl: customUrl })}>Сохранить</button>
          </div>
        )}
      </section>

      <section>
        <h2>Тема</h2>
        <div className="settings__row">
          {(['purple', 'light', 'dark'] as const).map((theme) => (
            <button
              key={theme}
              className={settings.theme === theme ? 'is-active' : ''}
              onClick={() => onUpdate({ theme })}
            >
              {theme}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2>Стартовая страница</h2>
        <select
          value={settings.startPage}
          onChange={(event) => onUpdate({ startPage: event.target.value as any })}
        >
          <option value="newtab">Новая вкладка</option>
          <option value="last-session">Последняя сессия</option>
          <option value="custom">Пользовательский URL</option>
        </select>
        {settings.startPage === 'custom' && (
          <div className="settings__row">
            <input
              value={settings.startUrl}
              onChange={(event) => onUpdate({ startUrl: event.target.value })}
              placeholder="https://example.com"
            />
          </div>
        )}
      </section>

      <section>
        <h2>Приватность</h2>
        <div className="settings__row">
          <label>
            <input
              type="checkbox"
              checked={settings.blockTrackers}
              onChange={(event) => onUpdate({ blockTrackers: event.target.checked })}
            />
            Блокировать трекеры и рекламу
          </label>
          <button onClick={() => window.uma.clearHistory()}>Очистить историю</button>
        </div>
      </section>

      <section>
        <h2>Панель закладок</h2>
        <label>
          <input
            type="checkbox"
            checked={settings.showBookmarksBar}
            onChange={(event) => onUpdate({ showBookmarksBar: event.target.checked })}
          />
          Показывать панель закладок
        </label>
      </section>
    </div>
  );
};
