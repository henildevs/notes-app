import { v4 as uuidv4 } from 'uuid';
import { Note } from '../types';
import { databaseService } from './database';
import { encryptionService } from './encryption';
import { groqAIService } from './groqAI';

class NoteService {
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private pendingSaves = new Map<string, Note>();

  // Create a new note
  async createNote(title: string = 'Untitled Note', content: string = ''): Promise<Note> {
    const now = new Date();
    const note: Note = {
      id: uuidv4(),
      title,
      content,
      plainTextContent: this.extractPlainText(content),
      isPinned: false,
      isEncrypted: false,
      hasBeenEncrypted: false, // New notes have never been encrypted
      tags: [],
      createdAt: now,
      updatedAt: now,
      lastAccessedAt: now,
    };

    await databaseService.saveNote(note);
    return note;
  }

  // Update an existing note
  async updateNote(id: string, updates: Partial<Note>): Promise<Note | null> {
    const existingNote = await databaseService.getNote(id);
    if (!existingNote) return null;

    const updatedNote: Note = {
      ...existingNote,
      ...updates,
      updatedAt: new Date(),
      plainTextContent: updates.content ? this.extractPlainText(updates.content) : existingNote.plainTextContent,
    };

    await databaseService.saveNote(updatedNote);
    return updatedNote;
  }

  // Auto-save with debouncing
  autoSaveNote(note: Note, delay: number = 2000): void {
    // Store pending save
    this.pendingSaves.set(note.id, note);

    // Clear existing timer
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }

    // Set new timer
    this.autoSaveTimer = setTimeout(async () => {
      const pendingNote = this.pendingSaves.get(note.id);
      if (pendingNote) {
        await this.updateNote(pendingNote.id, pendingNote);
        this.pendingSaves.delete(note.id);
      }
    }, delay);
  }

  // Delete a note
  async deleteNote(id: string): Promise<void> {
    await databaseService.deleteNote(id);
  }

  // Get all notes
  async getAllNotes(): Promise<Note[]> {
    return await databaseService.getAllNotes();
  }

  // Get a single note
  async getNote(id: string): Promise<Note | null> {
    const note = await databaseService.getNote(id);
    if (note) {
      // Update last accessed time
      await this.updateNote(id, { lastAccessedAt: new Date() });
    }
    return note;
  }

  // Search notes
  async searchNotes(query: string): Promise<Note[]> {
    return await databaseService.searchNotes(query);
  }

  // Toggle pin status
  async togglePin(id: string): Promise<Note | null> {
    const note = await databaseService.getNote(id);
    if (!note) return null;

    return await this.updateNote(id, { isPinned: !note.isPinned });
  }

  // Encrypt a note
  async encryptNote(id: string, password: string): Promise<Note | null> {
    const note = await databaseService.getNote(id);
    if (!note) return null;

    const { encryptedContent, encryptedTitle, salt } = encryptionService.encryptNote(
      note.content,
      note.title,
      password
    );

    const encryptedNote: Note = {
      ...note,
      isEncrypted: true,
      hasBeenEncrypted: true, // Mark as having been encrypted
      encryptedData: JSON.stringify({ content: encryptedContent, title: encryptedTitle, salt }),
      content: '', // Clear unencrypted content
      title: note.title, // Keep the original title
      updatedAt: new Date(),
    };

    await databaseService.saveNote(encryptedNote);
    return encryptedNote;
  }

  // Decrypt a note
  async decryptNote(id: string, password: string): Promise<Note | null> {
    const note = await databaseService.getNote(id);
    if (!note || !note.isEncrypted || !note.encryptedData) return null;

    try {
      const encryptedData = JSON.parse(note.encryptedData);
      const { content, title } = encryptionService.decryptNote(
        encryptedData.content,
        encryptedData.title,
        password,
        encryptedData.salt
      );

      // Store password in session for convenience
      encryptionService.storeSessionPassword(id, password);

      // Return decrypted note (not saved to DB)
      return {
        ...note,
        isEncrypted: false, // Mark as decrypted
        hasBeenEncrypted: true, // Keep the flag - note has been encrypted before
        content,
        title,
        plainTextContent: this.extractPlainText(content),
      };
    } catch (error) {
      console.error('Failed to decrypt note:', error);
      throw new Error('Invalid password');
    }
  }

  // Check if note can be decrypted with session password
  async tryDecryptWithSession(id: string): Promise<Note | null> {
    const sessionPassword = encryptionService.getSessionPassword(id);
    if (!sessionPassword) return null;

    try {
      return await this.decryptNote(id, sessionPassword);
    } catch {
      encryptionService.clearSessionPassword(id);
      return null;
    }
  }

  // Generate AI summary for a note
  async generateSummary(id: string): Promise<string | null> {
    const note = await databaseService.getNote(id);
    if (!note || !note.content) return null;

    try {
      const summary = await groqAIService.generateSummary(note.plainTextContent || note.content);
      await this.updateNote(id, {
        aiMetadata: {
          ...note.aiMetadata,
          summary,
        },
      });
      return summary;
    } catch (error) {
      console.error('Failed to generate summary:', error);
      return null;
    }
  }

  // Generate AI tag suggestions
  async generateTagSuggestions(id: string): Promise<string[]> {
    const note = await databaseService.getNote(id);
    if (!note || !note.content) return [];

    try {
      const suggestedTags = await groqAIService.suggestTags(note.plainTextContent || note.content);
      await this.updateNote(id, {
        aiMetadata: {
          ...note.aiMetadata,
          suggestedTags,
        },
      });
      return suggestedTags;
    } catch (error) {
      console.error('Failed to generate tag suggestions:', error);
      return [];
    }
  }

  // Find glossary terms in note
  async findGlossaryTerms(id: string): Promise<void> {
    const note = await databaseService.getNote(id);
    if (!note || !note.content) return;

    try {
      const glossaryTerms = await groqAIService.findGlossaryTerms(note.plainTextContent || note.content);
      await this.updateNote(id, {
        aiMetadata: {
          ...note.aiMetadata,
          glossaryTerms,
        },
      });
    } catch (error) {
      console.error('Failed to find glossary terms:', error);
    }
  }

  // Check grammar in note
  async checkGrammar(id: string): Promise<void> {
    const note = await databaseService.getNote(id);
    if (!note || !note.content) return;

    try {
      const grammarErrors = await groqAIService.checkGrammar(note.plainTextContent || note.content);
      await this.updateNote(id, {
        aiMetadata: {
          ...note.aiMetadata,
          grammarErrors,
        },
      });
    } catch (error) {
      console.error('Failed to check grammar:', error);
    }
  }

  // Translate note content
  async translateNote(id: string, targetLanguage: string): Promise<string | null> {
    const note = await databaseService.getNote(id);
    if (!note || !note.content) return null;

    try {
      const translatedContent = await groqAIService.translateText(note.content, targetLanguage);
      
      // Store translation in AI metadata
      await this.updateNote(id, {
        aiMetadata: {
          ...note.aiMetadata,
          translations: {
            ...note.aiMetadata?.translations,
            [targetLanguage]: translatedContent,
          },
        },
      });
      
      return translatedContent;
    } catch (error) {
      console.error('Failed to translate note:', error);
      throw error;
    }
  }

  // Get cached translation
  async getCachedTranslation(id: string, targetLanguage: string): Promise<string | null> {
    const note = await databaseService.getNote(id);
    if (!note || !note.aiMetadata?.translations) return null;
    
    return note.aiMetadata.translations[targetLanguage] || null;
  }

  // Add tag to note
  async addTag(id: string, tag: string): Promise<Note | null> {
    const note = await databaseService.getNote(id);
    if (!note) return null;

    const tags = Array.from(new Set([...note.tags, tag])); // Ensure unique tags
    return await this.updateNote(id, { tags });
  }

  // Remove tag from note
  async removeTag(id: string, tag: string): Promise<Note | null> {
    const note = await databaseService.getNote(id);
    if (!note) return null;

    const tags = note.tags.filter(t => t !== tag);
    return await this.updateNote(id, { tags });
  }

  // Bulk delete notes
  async bulkDelete(ids: string[]): Promise<void> {
    await databaseService.bulkDelete(ids);
  }

  // Export notes
  async exportNotes(): Promise<string> {
    return await databaseService.exportNotes();
  }

  // Import notes
  async importNotes(jsonData: string): Promise<void> {
    await databaseService.importNotes(jsonData);
  }

  // Extract plain text from HTML
  private extractPlainText(html: string): string {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  }

  // Get statistics
  async getStatistics(): Promise<{
    totalNotes: number;
    pinnedNotes: number;
    encryptedNotes: number;
    totalTags: number;
    recentNotes: Note[];
  }> {
    const notes = await this.getAllNotes();
    const allTags = new Set<string>();
    notes.forEach(note => note.tags.forEach(tag => allTags.add(tag)));

    return {
      totalNotes: notes.length,
      pinnedNotes: notes.filter(n => n.isPinned).length,
      encryptedNotes: notes.filter(n => n.isEncrypted).length,
      totalTags: allTags.size,
      recentNotes: notes.slice(0, 5),
    };
  }

}

// Export singleton instance
export const noteService = new NoteService();
