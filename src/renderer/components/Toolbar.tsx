import React from 'react';

interface ToolbarProps {
  canGoBack: boolean;
  canGoForward: boolean;
  isLoading: boolean;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  onStop: () => void;
  onHome: () => void;
  onDevTools: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  canGoBack,
  canGoForward,
  isLoading,
  onBack,
  onForward,
  onReload,
  onStop,
  onHome,
  onDevTools
}) => {
  return (
    <div className="toolbar">
      <button disabled={!canGoBack} onClick={onBack} aria-label="Назад">
        ←
      </button>
      <button disabled={!canGoForward} onClick={onForward} aria-label="Вперед">
        →
      </button>
      <button onClick={isLoading ? onStop : onReload} aria-label="Обновить">
        {isLoading ? '✕' : '⟳'}
      </button>
      <button onClick={onHome} aria-label="Домой">
        ⌂
      </button>
      <button onClick={onDevTools} aria-label="DevTools">
        ⚙
      </button>
    </div>
  );
};
