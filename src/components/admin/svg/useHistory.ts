import { useState, useCallback } from 'react';

export function useHistory<T>(initialState: T, maxHistory: number = 50) {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [pointer, setPointer] = useState<number>(0);

  const pushState = useCallback((newState: T) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, pointer + 1);
      newHistory.push(newState);
      if (newHistory.length > maxHistory) {
        newHistory.shift();
      }
      return newHistory;
    });
    setPointer(prev => Math.min(prev + 1, maxHistory));
  }, [pointer, maxHistory]);

  const undo = useCallback(() => {
    setPointer(prev => Math.max(0, prev - 1));
  }, []);

  const redo = useCallback(() => {
    setHistory(prev => {
      setPointer(p => Math.min(prev.length - 1, p + 1));
      return prev;
    });
  }, []);

  return {
    state: history[pointer],
    pushState,
    undo,
    redo,
    canUndo: pointer > 0,
    canRedo: pointer < history.length - 1,
  };
}
