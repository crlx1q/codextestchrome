import React, { useState } from 'react';
import { TabState } from '../../shared/ipc';
import { TabItem } from './TabItem';

interface TabStripProps {
  tabs: TabState[];
  activeTabId: string | null;
  onNewTab: () => void;
}

export const TabStrip: React.FC<TabStripProps> = ({ tabs, activeTabId, onNewTab }) => {
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleDrop = (tabId: string) => {
    if (!draggedId || draggedId === tabId) return;
    const toIndex = tabs.findIndex((tab) => tab.id === tabId);
    if (toIndex === -1) return;
    window.uma.moveTab({ tabId: draggedId, toIndex });
    setDraggedId(null);
  };

  return (
    <div className="tab-strip">
      <div className="tab-strip__tabs">
        {tabs.map((tab) => (
          <TabItem
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeTabId}
            onDragStart={() => setDraggedId(tab.id)}
            onDrop={() => handleDrop(tab.id)}
          />
        ))}
      </div>
      <button className="tab-strip__new" onClick={onNewTab} aria-label="Новая вкладка">
        +
      </button>
    </div>
  );
};
