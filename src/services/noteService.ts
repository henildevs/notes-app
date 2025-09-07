import { v4 as uuidv4 } from 'uuid';
import { Note, NoteVersion } from '../types';
import { databaseService } from './database';
import { encryptionService } from './encryption';
import { groqAIService } from './groqAI';

class NoteService {
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private pendingSaves = new Map<string, Note>();

  async createNote(title: string = 'Untitled Note', content: string = ''): Promise<Note> {
    const now = new Date();
    const note: Note = {
      id: uuidv4(),
      title,
      content,
      plainTextContent: this.extractPlainText(content),
      isPinned: false,
      isEncrypted: false,
      hasBeenEncrypted: false,
      tags: [],
      createdAt: now,
      updatedAt: now,
      lastAccessedAt: now,
    };

    await databaseService.saveNote(note);
    return note;
  }

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

  autoSaveNote(note: Note, delay: number = 2000): void {
    this.pendingSaves.set(note.id, note);

    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }
    this.autoSaveTimer = setTimeout(async () => {
      const pendingNote = this.pendingSaves.get(note.id);
      if (pendingNote) {
        await this.updateNote(pendingNote.id, pendingNote);
        this.pendingSaves.delete(note.id);
      }
    }, delay);
  }

  async deleteNote(id: string): Promise<void> {
    await databaseService.deleteNote(id);
  }

  async getAllNotes(): Promise<Note[]> {
    return await databaseService.getAllNotes();
  }

  async getNote(id: string): Promise<Note | null> {
    const note = await databaseService.getNote(id);
    if (note) {
      await this.updateNote(id, { lastAccessedAt: new Date() });
    }
    return note;
  }

  async searchNotes(query: string): Promise<Note[]> {
    return await databaseService.searchNotes(query);
  }

  async togglePin(id: string): Promise<Note | null> {
    const note = await databaseService.getNote(id);
    if (!note) return null;

    return await this.updateNote(id, { isPinned: !note.isPinned });
  }

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
      hasBeenEncrypted: true,
      encryptedData: JSON.stringify({ content: encryptedContent, title: encryptedTitle, salt }),
      content: '',
      title: note.title,
      updatedAt: new Date(),
    };

    await databaseService.saveNote(encryptedNote);
    return encryptedNote;
  }

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

      encryptionService.storeSessionPassword(id, password);

      return {
        ...note,
        isEncrypted: false,
        hasBeenEncrypted: true,
        content,
        title,
        plainTextContent: this.extractPlainText(content),
      };
    } catch (error) {
      console.error('Failed to decrypt note:', error);
      throw new Error('Invalid password');
    }
  }

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

  async translateNote(id: string, targetLanguage: string): Promise<string | null> {
    const note = await databaseService.getNote(id);
    if (!note || !note.content) return null;

    try {
      const translatedContent = await groqAIService.translateText(note.content, targetLanguage);
      
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

  async getCachedTranslation(id: string, targetLanguage: string): Promise<string | null> {
    const note = await databaseService.getNote(id);
    if (!note || !note.aiMetadata?.translations) return null;
    
    return note.aiMetadata.translations[targetLanguage] || null;
  }

  async addTag(id: string, tag: string): Promise<Note | null> {
    const note = await databaseService.getNote(id);
    if (!note) return null;

    const tags = Array.from(new Set([...note.tags, tag]));
    return await this.updateNote(id, { tags });
  }

  async removeTag(id: string, tag: string): Promise<Note | null> {
    const note = await databaseService.getNote(id);
    if (!note) return null;

    const tags = note.tags.filter(t => t !== tag);
    return await this.updateNote(id, { tags });
  }

  async bulkDelete(ids: string[]): Promise<void> {
    await databaseService.bulkDelete(ids);
  }

  async exportNotes(): Promise<string> {
    return await databaseService.exportNotes();
  }

  async importNotes(jsonData: string): Promise<void> {
    await databaseService.importNotes(jsonData);
  }

  private extractPlainText(html: string): string {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  }

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

  async createVersion(noteId: string, content: string, title: string): Promise<NoteVersion | null> {
    const note = await databaseService.getNote(noteId);
    if (!note) return null;

    const versionNumber = (note.version || 0) + 1;
    const version: NoteVersion = {
      id: uuidv4(),
      noteId,
      content,
      title,
      timestamp: new Date(),
      versionNumber,
    };

    const updatedNote: Note = {
      ...note,
      version: versionNumber,
      versions: [...(note.versions || []), version],
    };

    await databaseService.saveNote(updatedNote);
    return version;
  }

  async getNoteVersions(noteId: string): Promise<NoteVersion[]> {
    const note = await databaseService.getNote(noteId);
    return note?.versions || [];
  }

  async getVersion(noteId: string, versionId: string): Promise<NoteVersion | null> {
    const versions = await this.getNoteVersions(noteId);
    return versions.find(v => v.id === versionId) || null;
  }

  async restoreToVersion(noteId: string, versionId: string): Promise<Note | null> {
    const version = await this.getVersion(noteId, versionId);
    if (!version) return null;

    const note = await databaseService.getNote(noteId);
    if (!note) return null;

    const restoredNote: Note = {
      ...note,
      title: version.title,
      content: version.content,
      plainTextContent: this.extractPlainText(version.content),
      updatedAt: new Date(),
    };

    await databaseService.saveNote(restoredNote);
    return restoredNote;
  }

  async deleteVersion(noteId: string, versionId: string): Promise<boolean> {
    const note = await databaseService.getNote(noteId);
    if (!note || !note.versions) return false;

    const updatedVersions = note.versions.filter(v => v.id !== versionId);
    const updatedNote: Note = {
      ...note,
      versions: updatedVersions,
    };

    await databaseService.saveNote(updatedNote);
    return true;
  }

  async clearVersions(noteId: string): Promise<boolean> {
    const note = await databaseService.getNote(noteId);
    if (!note) return false;

    const updatedNote: Note = {
      ...note,
      versions: [],
      version: 0,
    };

    await databaseService.saveNote(updatedNote);
    return true;
  }

  async updateNoteWithVersion(id: string, updates: Partial<Note>): Promise<Note | null> {
    const existingNote = await databaseService.getNote(id);
    if (!existingNote) return null;

    const shouldCreateVersion = 
      (updates.content && updates.content !== existingNote.content) ||
      (updates.title && updates.title !== existingNote.title);

    if (shouldCreateVersion) {
      await this.createVersion(id, existingNote.content, existingNote.title);
    }

    return this.updateNote(id, updates);
  }

}

export const noteService = new NoteService();
