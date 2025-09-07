import { useCallback, useRef, useEffect } from 'react';
import { Note } from '../types';
import { noteService } from '../services/noteService';

interface UseAutoSaveOptions {
  delay?: number;
  maxDelay?: number;
  onSave?: (note: Note) => void;
  onError?: (error: Error) => void;
}

export const useAutoSave = (options: UseAutoSaveOptions = {}) => {
  const { delay = 2000, maxDelay = 10000, onSave, onError } = options;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<number>(0);
  const pendingNoteRef = useRef<Note | null>(null);

  const saveNote = useCallback(async (note: Note) => {
    try {
      const savedNote = await noteService.updateNoteWithVersion(note.id, note);
      if (savedNote) {
        lastSaveRef.current = Date.now();
        onSave?.(savedNote);
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
      onError?.(error as Error);
    }
  }, [onSave, onError]);

  const scheduleSave = useCallback((note: Note) => {
    pendingNoteRef.current = note;
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Calculate delay based on time since last save
    const timeSinceLastSave = Date.now() - lastSaveRef.current;
    const actualDelay = Math.min(delay, Math.max(100, maxDelay - timeSinceLastSave));

    timeoutRef.current = setTimeout(() => {
      if (pendingNoteRef.current) {
        saveNote(pendingNoteRef.current);
        pendingNoteRef.current = null;
      }
    }, actualDelay);
  }, [delay, maxDelay, saveNote]);

  const flushSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (pendingNoteRef.current) {
      saveNote(pendingNoteRef.current);
      pendingNoteRef.current = null;
    }
  }, [saveNote]);

  const cancelSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    pendingNoteRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    scheduleSave,
    flushSave,
    cancelSave,
  };
};

export default useAutoSave;
