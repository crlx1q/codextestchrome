import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';

let cachedList: Set<string> | null = null;

export const loadBlocklist = () => {
  if (cachedList) return cachedList;
  const basePath = app.isPackaged ? app.getAppPath() : process.cwd();
  const listPath = path.join(basePath, 'resources', 'blocklist.txt');
  if (!fs.existsSync(listPath)) {
    cachedList = new Set();
    return cachedList;
  }
  const content = fs.readFileSync(listPath, 'utf-8');
  cachedList = new Set(
    content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
  );
  return cachedList;
};

export const isBlockedHost = (hostname: string) => {
  const list = loadBlocklist();
  if (list.has(hostname)) return true;
  const parts = hostname.split('.');
  for (let i = 1; i < parts.length - 1; i += 1) {
    const candidate = parts.slice(i).join('.');
    if (list.has(candidate)) return true;
  }
  return false;
};
