import React from 'react';
import { TabState } from '../../shared/ipc';

interface TabItemProps {
  tab: TabState;
  isActive: boolean;
  onDragStart: () => void;
  onDrop: () => void;
}

export const TabItem: React.FC<TabItemProps> = ({ tab, isActive, onDragStart, onDrop }) => {
  const handleClose = (event: React.MouseEvent) => {
    event.stopPropagation();
    window.uma.closeTab(tab.id);
  };

  const handlePin = (event: React.MouseEvent) => {
    event.stopPropagation();
    window.uma.pinTab(tab.id, !tab.isPinned);
  };

  const handleDuplicate = (event: React.MouseEvent) => {
    event.stopPropagation();
    window.uma.duplicateTab(tab.id);
  };

  return (
    <div
      className={`tab-item ${isActive ? 'is-active' : ''} ${tab.isPinned ? 'is-pinned' : ''}`}
      onClick={() => window.uma.activateTab(tab.id)}
      draggable
      onDragStart={onDragStart}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
    >
      <div className="tab-item__favicon">
        {tab.favicon ? <img src={tab.favicon} alt="" /> : <span />}
        {tab.isLoading && <span className="tab-item__spinner" />}
      </div>
      <span className="tab-item__title">{tab.title || 'Новая вкладка'}</span>
      <div className="tab-item__actions">
        <button onClick={handlePin} title="Закрепить">
          📌
        </button>
        <button onClick={handleDuplicate} title="Дубликат">
          ⧉
        </button>
        <button onClick={handleClose} title="Закрыть">
          ✕
        </button>
      </div>
    </div>
  );
};
