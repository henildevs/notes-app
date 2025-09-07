import Dexie, { Table } from 'dexie';
import { Note, UserPreferences } from '../types';

class NotesDatabase extends Dexie {
  notes!: Table<Note>;
  preferences!: Table<UserPreferences>;

  constructor() {
    super('NotesAppDatabase');
    
    this.version(1).stores({
      notes: 'id, title, isPinned, isEncrypted, createdAt, updatedAt, *tags',
      preferences: 'id',
    });
  }
}

class DatabaseService {
  private db: NotesDatabase;
  private notesCache = new Map<string, Note>();
  private allNotesCache: Note[] | null = null;
  private cacheTimestamp = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.db = new NotesDatabase();
    this.initializeDatabase();
  }

  private async initializeDatabase() {
    try {
      await this.db.open();
      
      // Initialize default preferences if not exists
      const prefs = await this.db.preferences.get('default');
      if (!prefs) {
        await this.db.preferences.add({
          id: 'default' as any,
          theme: 'system',
          defaultFontSize: 16,
          autoSaveInterval: 2000,
          language: 'en',
        } as any);
      }
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }

  // Optimized notes operations with caching
  async getAllNotes(): Promise<Note[]> {
    const now = Date.now();
    
    // Return cached data if still valid
    if (this.allNotesCache && (now - this.cacheTimestamp) < this.CACHE_TTL) {
      return this.allNotesCache;
    }

    try {
      const notes = await this.db.notes.toArray();
      // Sort by pinned first, then by updated date
      const sortedNotes = notes.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });

      // Update cache
      this.allNotesCache = sortedNotes;
      this.cacheTimestamp = now;
      
      return sortedNotes;
    } catch (error) {
      console.error('Failed to get all notes:', error);
      return [];
    }
  }

  async getNote(id: string): Promise<Note | null> {
    // Check cache first
    if (this.notesCache.has(id)) {
      return this.notesCache.get(id)!;
    }

    try {
      const note = await this.db.notes.get(id);
      if (note) {
        // Cache the note
        this.notesCache.set(id, note);
      }
      return note || null;
    } catch (error) {
      console.error('Failed to get note:', error);
      return null;
    }
  }

  async saveNote(note: Note): Promise<void> {
    try {
      await this.db.notes.put(note);
      
      // Update caches
      this.notesCache.set(note.id, note);
      this.invalidateAllNotesCache();
    } catch (error) {
      console.error('Failed to save note:', error);
      throw error;
    }
  }

  async deleteNote(id: string): Promise<void> {
    try {
      await this.db.notes.delete(id);
      
      // Remove from caches
      this.notesCache.delete(id);
      this.invalidateAllNotesCache();
    } catch (error) {
      console.error('Failed to delete note:', error);
      throw error;
    }
  }

  // Preferences operations
  async getPreferences(): Promise<UserPreferences> {
    try {
      const prefs = await this.db.preferences.get('default');
      return prefs || {
        theme: 'system',
        defaultFontSize: 16,
        autoSaveInterval: 2000,
        language: 'en',
      };
    } catch (error) {
      console.error('Failed to get preferences:', error);
      return {
        theme: 'system',
        defaultFontSize: 16,
        autoSaveInterval: 2000,
        language: 'en',
      };
    }
  }

  async savePreferences(preferences: Partial<UserPreferences>): Promise<void> {
    try {
      const existingPrefs = await this.getPreferences();
      const updatedPrefs = { ...existingPrefs, ...preferences };
      await this.db.preferences.put({ id: 'default', ...updatedPrefs } as any);
    } catch (error) {
      console.error('Failed to save preferences:', error);
      throw error;
    }
  }

  // Cache management
  private invalidateAllNotesCache(): void {
    this.allNotesCache = null;
    this.cacheTimestamp = 0;
  }

  clearCache(): void {
    this.notesCache.clear();
    this.invalidateAllNotesCache();
  }

  // Batch operations for better performance
  async batchSaveNotes(notes: Note[]): Promise<void> {
    try {
      await this.db.notes.bulkPut(notes);
      
      // Update caches
      notes.forEach(note => this.notesCache.set(note.id, note));
      this.invalidateAllNotesCache();
    } catch (error) {
      console.error('Failed to batch save notes:', error);
      throw error;
    }
  }

  async batchDeleteNotes(ids: string[]): Promise<void> {
    try {
      await this.db.notes.bulkDelete(ids);
      
      // Remove from caches
      ids.forEach(id => this.notesCache.delete(id));
      this.invalidateAllNotesCache();
    } catch (error) {
      console.error('Failed to batch delete notes:', error);
      throw error;
    }
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    try {
      await this.db.notes.clear();
      await this.db.preferences.clear();
      this.clearCache();
    } catch (error) {
      console.error('Failed to clear all data:', error);
      throw error;
    }
  }

  // Search with indexing
  async searchNotes(query: string): Promise<Note[]> {
    const queryLower = query.toLowerCase();
    
    try {
      // Use database indexes for better performance
      const notes = await this.db.notes
        .filter(note => 
          note.title.toLowerCase().includes(queryLower) ||
          note.plainTextContent?.toLowerCase().includes(queryLower) ||
          note.tags.some(tag => tag.toLowerCase().includes(queryLower))
        )
        .toArray();

      return notes.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
    } catch (error) {
      console.error('Failed to search notes:', error);
      return [];
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();
