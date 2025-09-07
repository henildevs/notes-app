// Note types
export interface Note {
  id: string;
  title: string;
  content: string; // HTML content from rich text editor
  plainTextContent?: string; // Plain text version for search
  isPinned: boolean;
  isEncrypted: boolean;
  hasBeenEncrypted: boolean; // Track if note has ever been encrypted
  encryptedData?: string; // Encrypted content
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt?: Date;
  version?: number;
  versions?: NoteVersion[];
  aiMetadata?: AIMetadata;
}

export interface NoteVersion {
  id: string;
  noteId: string;
  content: string;
  title: string;
  timestamp: Date;
  versionNumber: number;
}

export interface AIMetadata {
  summary?: string;
  suggestedTags?: string[];
  glossaryTerms?: GlossaryTerm[];
  grammarErrors?: GrammarError[];
  lastAnalyzedAt?: Date;
  translations?: Record<string, string>; // language code -> translated content
}

export interface GlossaryTerm {
  term: string;
  definition: string;
  startIndex: number;
  endIndex: number;
}

export interface GrammarError {
  text: string;
  suggestion: string;
  startIndex: number;
  endIndex: number;
  type: 'spelling' | 'grammar' | 'punctuation';
}

// Editor types
export interface EditorCommand {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  command: string;
  isActive?: (editor: HTMLDivElement) => boolean;
  value?: string | number;
}

export interface EditorState {
  content: string;
  selection: {
    start: number;
    end: number;
  };
  format: {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    align: 'left' | 'center' | 'right' | 'justify';
    fontSize: number;
  };
}

// Database types
export interface DatabaseSchema {
  notes: Note[];
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  defaultFontSize: number;
  autoSaveInterval: number;
  language: string;
  groqApiKey?: string;
}

// Encryption types
export interface EncryptedNote {
  id: string;
  encryptedContent: string;
  encryptedTitle: string;
  salt: string;
  iv: string;
}

// API types
export interface GroqAPIResponse {
  summary?: string;
  tags?: string[];
  glossaryTerms?: GlossaryTerm[];
  grammarErrors?: GrammarError[];
  translation?: string;
}

// Search types
export interface SearchResult {
  note: Note;
  relevance: number;
  matchedFields: ('title' | 'content' | 'tags')[];
  highlights?: {
    title?: string;
    content?: string;
  };
}

// UI Component Props
export interface NoteCardProps {
  note: Note;
  onClick: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  onToggleEncrypt: () => void;
  isSelected?: boolean;
}

export interface RichTextEditorProps {
  content: string;
  onChange: (content: string, plainText: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  showToolbar?: boolean;
  className?: string;
}

export interface ToolbarButtonProps {
  icon: React.ComponentType<any>;
  onClick: () => void;
  isActive?: boolean;
  tooltip?: string;
  disabled?: boolean;
}

// Filter and sort types
export type SortBy = 'createdAt' | 'updatedAt' | 'title' | 'relevance';
export type SortOrder = 'asc' | 'desc';

export interface FilterOptions {
  searchQuery?: string;
  tags?: string[];
  isPinned?: boolean;
  isEncrypted?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
  total: number;
}
