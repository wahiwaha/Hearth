import { useState, useCallback, useRef } from 'react';
import { EditorHistoryEntry, PageElement } from '../types/album';

const MAX_HISTORY = 20;

interface UseEditorHistoryOptions {
  initialElements: PageElement[];
  initialBackground: string;
  initialBackgroundImage?: string;
}

export function useEditorHistory(options: UseEditorHistoryOptions) {
  const [undoStack, setUndoStack] = useState<EditorHistoryEntry[]>([]);
  const [redoStack, setRedoStack] = useState<EditorHistoryEntry[]>([]);
  const lastSavedRef = useRef<EditorHistoryEntry>({
    elements: options.initialElements,
    backgroundColor: options.initialBackground,
    backgroundImage: options.initialBackgroundImage,
    timestamp: Date.now(),
  });

  const pushState = useCallback((elements: PageElement[], backgroundColor: string, backgroundImage?: string) => {
    const entry: EditorHistoryEntry = {
      elements: JSON.parse(JSON.stringify(lastSavedRef.current.elements)),
      backgroundColor: lastSavedRef.current.backgroundColor,
      backgroundImage: lastSavedRef.current.backgroundImage,
      timestamp: Date.now(),
    };

    setUndoStack(prev => {
      const next = [...prev, entry];
      if (next.length > MAX_HISTORY) next.shift();
      return next;
    });
    setRedoStack([]);

    lastSavedRef.current = {
      elements: JSON.parse(JSON.stringify(elements)),
      backgroundColor,
      backgroundImage,
      timestamp: Date.now(),
    };
  }, []);

  const undo = useCallback((): EditorHistoryEntry | null => {
    if (undoStack.length === 0) return null;

    const prev = undoStack[undoStack.length - 1];
    setUndoStack(s => s.slice(0, -1));
    setRedoStack(s => [...s, { ...lastSavedRef.current }]);
    lastSavedRef.current = { ...prev };
    return prev;
  }, [undoStack]);

  const redo = useCallback((): EditorHistoryEntry | null => {
    if (redoStack.length === 0) return null;

    const next = redoStack[redoStack.length - 1];
    setRedoStack(s => s.slice(0, -1));
    setUndoStack(s => [...s, { ...lastSavedRef.current }]);
    lastSavedRef.current = { ...next };
    return next;
  }, [redoStack]);

  return {
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    undoCount: undoStack.length,
    redoCount: redoStack.length,
    pushState,
    undo,
    redo,
  };
}
