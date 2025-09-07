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

  // Notes operations
  async getAllNotes(): Promise<Note[]> {
    try {
      const notes = await this.db.notes.toArray();
      // Sort by pinned first, then by updated date
      return notes.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
    } catch (error) {
      console.error('Failed to get all notes:', error);
      return [];
    }
  }

  async getNote(id: string): Promise<Note | null> {
    try {
      const note = await this.db.notes.get(id);
      return note || null;
    } catch (error) {
      console.error('Failed to get note:', error);
      return null;
    }
  }

  async saveNote(note: Note): Promise<void> {
    try {
      await this.db.notes.put(note);
    } catch (error) {
      console.error('Failed to save note:', error);
      throw error;
    }
  }

  async deleteNote(id: string): Promise<void> {
    try {
      await this.db.notes.delete(id);
    } catch (error) {
      console.error('Failed to delete note:', error);
      throw error;
    }
  }

  async bulkDelete(ids: string[]): Promise<void> {
    try {
      await this.db.notes.bulkDelete(ids);
    } catch (error) {
      console.error('Failed to bulk delete notes:', error);
      throw error;
    }
  }

  async searchNotes(query: string): Promise<Note[]> {
    try {
      const lowerQuery = query.toLowerCase();
      const notes = await this.db.notes.toArray();
      
      return notes.filter(note => {
        const titleMatch = note.title.toLowerCase().includes(lowerQuery);
        const contentMatch = note.plainTextContent?.toLowerCase().includes(lowerQuery) || false;
        const tagMatch = note.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
        
        return titleMatch || contentMatch || tagMatch;
      });
    } catch (error) {
      console.error('Failed to search notes:', error);
      return [];
    }
  }

  async getNotesByTag(tag: string): Promise<Note[]> {
    try {
      return await this.db.notes.where('tags').equals(tag).toArray();
    } catch (error) {
      console.error('Failed to get notes by tag:', error);
      return [];
    }
  }

  async getPinnedNotes(): Promise<Note[]> {
    try {
      return await this.db.notes.where('isPinned').equals(1 as any).toArray();
    } catch (error) {
      console.error('Failed to get pinned notes:', error);
      return [];
    }
  }

  async getEncryptedNotes(): Promise<Note[]> {
    try {
      return await this.db.notes.where('isEncrypted').equals(1 as any).toArray();
    } catch (error) {
      console.error('Failed to get encrypted notes:', error);
      return [];
    }
  }

  async getRecentNotes(limit: number = 10): Promise<Note[]> {
    try {
      const notes = await this.db.notes.orderBy('updatedAt').reverse().limit(limit).toArray();
      return notes;
    } catch (error) {
      console.error('Failed to get recent notes:', error);
      return [];
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
      const current = await this.getPreferences();
      await this.db.preferences.put({
        ...current,
        ...preferences,
        id: 'default' as any,
      } as any);
    } catch (error) {
      console.error('Failed to save preferences:', error);
      throw error;
    }
  }

  // Export/Import operations
  async exportNotes(): Promise<string> {
    try {
      const notes = await this.getAllNotes();
      const preferences = await this.getPreferences();
      
      const exportData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        notes,
        preferences,
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to export notes:', error);
      throw error;
    }
  }

  async importNotes(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      
      if (!data.notes || !Array.isArray(data.notes)) {
        throw new Error('Invalid import data format');
      }
      
      // Clear existing notes (optional - could merge instead)
      await this.db.notes.clear();
      
      // Import notes
      for (const note of data.notes) {
        // Ensure dates are Date objects
        note.createdAt = new Date(note.createdAt);
        note.updatedAt = new Date(note.updatedAt);
        if (note.lastAccessedAt) {
          note.lastAccessedAt = new Date(note.lastAccessedAt);
        }
        
        await this.db.notes.add(note);
      }
      
      // Import preferences if present
      if (data.preferences) {
        await this.savePreferences(data.preferences);
      }
    } catch (error) {
      console.error('Failed to import notes:', error);
      throw error;
    }
  }

  // Statistics
  async getStatistics() {
    try {
      const notes = await this.getAllNotes();
      const pinnedCount = notes.filter(n => n.isPinned).length;
      const encryptedCount = notes.filter(n => n.isEncrypted).length;
      
      const allTags = new Set<string>();
      notes.forEach(note => {
        note.tags.forEach(tag => allTags.add(tag));
      });
      
      return {
        totalNotes: notes.length,
        pinnedNotes: pinnedCount,
        encryptedNotes: encryptedCount,
        totalTags: allTags.size,
        tags: Array.from(allTags),
      };
    } catch (error) {
      console.error('Failed to get statistics:', error);
      return {
        totalNotes: 0,
        pinnedNotes: 0,
        encryptedNotes: 0,
        totalTags: 0,
        tags: [],
      };
    }
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    try {
      await this.db.notes.clear();
      await this.db.preferences.clear();
      await this.initializeDatabase(); // Re-initialize with defaults
    } catch (error) {
      console.error('Failed to clear all data:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();
