import { app } from 'electron';
import { join } from 'node:path';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { BookmarkItem, HistoryItem, SettingsState, TopSite, DownloadItem } from '../../shared/ipc';

export interface UmaDatabase {
  settings: SettingsState;
  bookmarks: BookmarkItem[];
  history: HistoryItem[];
  topSites: TopSite[];
  downloads: DownloadItem[];
}

const defaultSettings: SettingsState = {
  theme: 'purple',
  searchProvider: 'google',
  customSearchUrl: 'https://www.google.com/search?q=%s',
  startPage: 'newtab',
  startUrl: 'uma://newtab',
  showBookmarksBar: true,
  blockTrackers: false,
  permissions: {}
};

const defaultData: UmaDatabase = {
  settings: defaultSettings,
  bookmarks: [],
  history: [],
  topSites: [],
  downloads: []
};

let db: Low<UmaDatabase> | null = null;

export const getDbPath = () => join(app.getPath('userData'), 'uma-db.json');

export const initStore = async () => {
  if (db) return db;
  const adapter = new JSONFile<UmaDatabase>(getDbPath());
  db = new Low(adapter, defaultData);
  await db.read();
  db.data ||= defaultData;
  await db.write();
  return db;
};

export const getStore = async () => {
  if (!db) {
    await initStore();
  }
  return db as Low<UmaDatabase>;
};

export const saveStore = async () => {
  if (!db) return;
  await db.write();
};
