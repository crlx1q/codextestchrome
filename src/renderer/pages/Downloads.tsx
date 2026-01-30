import React from 'react';
import { DownloadItem } from '../../shared/ipc';

interface DownloadsProps {
  downloads: DownloadItem[];
}

export const Downloads: React.FC<DownloadsProps> = ({ downloads }) => {
  return (
    <div className="page downloads">
      <h1>Загрузки</h1>
      <div className="downloads__list">
        {downloads.map((item) => (
          <div key={item.id} className="download-card">
            <div>
              <strong>{item.filename}</strong>
              <small>{item.url}</small>
            </div>
            <div className="download-card__meta">
              <progress value={item.receivedBytes} max={item.totalBytes || 1} />
              <span>
                {Math.round((item.receivedBytes / (item.totalBytes || 1)) * 100)}% · {item.state}
              </span>
            </div>
            <div className="download-card__actions">
              <button onClick={() => window.uma.showDownload(item.id)}>Показать</button>
              {item.state === 'progressing' && (
                <button onClick={() => window.uma.pauseDownload(item.id)}>Пауза</button>
              )}
              {item.state === 'interrupted' && (
                <button onClick={() => window.uma.resumeDownload(item.id)}>Продолжить</button>
              )}
              {item.state === 'progressing' && (
                <button onClick={() => window.uma.cancelDownload(item.id)}>Отменить</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
