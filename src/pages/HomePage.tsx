import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Grid,
  List,
  Filter,
  Download,
  Upload,
  StickyNote,
  X,
  Tag,
  Moon,
  Sun,
  Key,
  Lock
} from 'lucide-react';
import NoteCard from '../components/Notes/NoteCard';
import { Note } from '../types';
import { noteService } from '../services/noteService';
import { groqAIService } from '../services/groqAI';
import { databaseService } from '../services/database';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [showLockDialog, setShowLockDialog] = useState(false);
  const [lockPassword, setLockPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedNoteForLock, setSelectedNoteForLock] = useState<Note | null>(null);
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [selectedNoteForUnlock, setSelectedNoteForUnlock] = useState<Note | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState('');
  const [stats, setStats] = useState({
    totalNotes: 0,
    pinnedNotes: 0,
    encryptedNotes: 0,
    totalTags: 0,
  });

  // Load notes on mount
  useEffect(() => {
    loadNotes();
    loadStats();
    checkApiKey();
    loadTheme();
  }, []);

  // Filter notes when search or filters change
  useEffect(() => {
    const filterNotes = () => {
      let filtered = [...notes];

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(note =>
          note.title.toLowerCase().includes(query) ||
          note.plainTextContent?.toLowerCase().includes(query) ||
          note.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }

      // Tag filter
      if (selectedTags.length > 0) {
        filtered = filtered.filter(note =>
          selectedTags.every(tag => note.tags.includes(tag))
        );
      }

      setFilteredNotes(filtered);
    };
    
    filterNotes();
  }, [searchQuery, selectedTags, notes]);

  const loadTheme = async () => {
    const prefs = await databaseService.getPreferences();
    if (prefs.theme === 'dark' || (prefs.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    databaseService.savePreferences({ theme: darkMode ? 'light' : 'dark' });
  };

  const checkApiKey = async () => {
    const prefs = await databaseService.getPreferences();
    if (prefs.groqApiKey) {
      groqAIService.initialize(prefs.groqApiKey);
    }
  };

  const loadNotes = async () => {
    setIsLoading(true);
    try {
      const allNotes = await noteService.getAllNotes();
      setNotes(allNotes);
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statistics = await noteService.getStatistics();
      setStats(statistics);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };


  const handleCreateNote = async () => {
    try {
      const newNote = await noteService.createNote();
      navigate(`/editor/${newNote.id}`);
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      try {
        await noteService.deleteNote(id);
        await loadNotes();
        await loadStats();
      } catch (error) {
        console.error('Failed to delete note:', error);
      }
    }
  };

  const handleTogglePin = async (id: string) => {
    try {
      await noteService.togglePin(id);
      await loadNotes();
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    }
  };

  const handleToggleEncrypt = async (id: string) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    if (note.isEncrypted) {
      // Decrypt - use modal
      setSelectedNoteForUnlock(note);
      setShowUnlockDialog(true);
    } else if (!note.hasBeenEncrypted) {
      // Encrypt - use modal (only if never been encrypted)
      setSelectedNoteForLock(note);
      setShowLockDialog(true);
    }
    // If hasBeenEncrypted is true and isEncrypted is false, do nothing
  };

  const handleLockNote = async () => {
    if (!selectedNoteForLock || !lockPassword.trim()) return;
    
    // Check password confirmation
    if (lockPassword !== confirmPassword) {
      alert('Passwords do not match. Please try again.');
      return;
    }
    
    try {
      const lockedNote = await noteService.encryptNote(selectedNoteForLock.id, lockPassword);
      
      if (lockedNote) {
        await loadNotes();
        await loadStats();
        setLockPassword('');
        setConfirmPassword('');
        setShowLockDialog(false);
        setSelectedNoteForLock(null);
      } else {
        alert('Failed to lock note. Please try again.');
      }
    } catch (error) {
      console.error('Failed to lock note:', error);
      alert('Failed to lock note. Please try again.');
    }
  };

  const handleUnlockNote = async () => {
    if (!selectedNoteForUnlock || !unlockPassword.trim()) return;
    
    setIsUnlocking(true);
    setUnlockError('');
    
    try {
      const decryptedNote = await noteService.decryptNote(selectedNoteForUnlock.id, unlockPassword);
      
      if (decryptedNote) {
        // Update the notes list with the decrypted note
        setNotes(prevNotes => 
          prevNotes.map(note => 
            note.id === selectedNoteForUnlock.id ? decryptedNote : note
          )
        );
        await loadStats();
        setUnlockPassword('');
        setShowUnlockDialog(false);
        setSelectedNoteForUnlock(null);
      } else {
        setUnlockError('Invalid password. Please try again.');
      }
    } catch (error) {
      console.error('Failed to unlock note:', error);
      setUnlockError('Failed to unlock note. Please check your password.');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleExport = async () => {
    try {
      const json = await noteService.exportNotes();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notes-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export notes:', error);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      await noteService.importNotes(text);
      await loadNotes();
      await loadStats();
    } catch (error) {
      console.error('Failed to import notes:', error);
      alert('Failed to import notes. Please check the file format.');
    }
  };

  const handleSaveApiKey = async () => {
    if (apiKey) {
      groqAIService.initialize(apiKey);
      await databaseService.savePreferences({ groqApiKey: apiKey });
      setShowApiKeyDialog(false);
    }
  };

  // Get all unique tags
  const allTags = Array.from(new Set(notes.flatMap(note => note.tags)));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-200">
      {/* Subtle gradient background - Odoo style */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-primary-50 to-transparent dark:from-primary-900/10" />
      </div>

      <div className="relative z-10">
        {/* Clean Header - Odoo style */}
        <header className="bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo and Title */}
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="flex items-center">
                  <StickyNote size={24} className="sm:w-8 sm:h-8 text-primary-500" />
                  <h1 className="ml-2 sm:ml-3 text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white">
                    Notes
                  </h1>
                </div>
                <div className="hidden lg:flex items-center space-x-6 ml-8">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium text-gray-900 dark:text-white">{stats.totalNotes}</span> notes
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium text-primary-500">{stats.pinnedNotes}</span> pinned
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium text-secondary-400">{stats.encryptedNotes}</span> secured
                  </span>
                </div>
              </div>

              {/* Header Actions - Odoo style */}
              <div className="flex items-center space-x-1 sm:space-x-2">
                {/* Mobile Stats - Show on small screens */}
                <div className="flex items-center space-x-3 lg:hidden">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    <span className="font-medium text-gray-900 dark:text-white">{stats.totalNotes}</span>
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    <span className="font-medium text-primary-500">{stats.pinnedNotes}</span>
                  </span>
                </div>

                {/* Theme Toggle */}
                <button
                  onClick={toggleDarkMode}
                  className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  title="Toggle theme"
                >
                  {darkMode ? <Sun size={18} className="sm:w-5 sm:h-5" /> : <Moon size={18} className="sm:w-5 sm:h-5" />}
                </button>

                {/* API Key - Hidden on mobile */}
                <button
                  onClick={() => setShowApiKeyDialog(true)}
                  className={`hidden sm:block p-1.5 sm:p-2 transition-colors ${
                    groqAIService.isReady() 
                      ? 'text-secondary-400 hover:text-secondary-500' 
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                  title="AI Settings"
                >
                  <Key size={18} className="sm:w-5 sm:h-5" />
                </button>

                {/* Export - Hidden on mobile */}
                <button
                  onClick={handleExport}
                  className="hidden sm:block p-1.5 sm:p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  title="Export notes"
                >
                  <Download size={18} className="sm:w-5 sm:h-5" />
                </button>
                
                {/* Import - Hidden on mobile */}
                <label className="hidden sm:block p-1.5 sm:p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors cursor-pointer">
                  <Upload size={18} className="sm:w-5 sm:h-5" />
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                </label>

                <div className="hidden sm:block h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1 sm:mx-2" />

                {/* View Mode Toggle */}
                <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-md p-0.5">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded transition-colors text-sm font-medium ${
                      viewMode === 'grid'
                        ? 'bg-white dark:bg-gray-700 text-primary-500 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <Grid size={14} className="sm:w-4 sm:h-4 inline" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded transition-colors text-sm font-medium ${
                      viewMode === 'list'
                        ? 'bg-white dark:bg-gray-700 text-primary-500 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <List size={14} className="sm:w-4 sm:h-4 inline" />
                  </button>
                </div>

                {/* Create Note Button - Odoo style */}
                <button
                  onClick={handleCreateNote}
                  className="ml-1 sm:ml-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-md font-medium transition-colors flex items-center space-x-1 sm:space-x-2"
                >
                  <Plus size={16} className="sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline text-sm sm:text-base">New Note</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Search and Filters - Odoo style */}
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-9 sm:pr-10 py-2 sm:py-2.5 bg-white dark:bg-dark-surface border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-gray-900 dark:text-gray-100 text-sm sm:text-base"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-md font-medium transition-colors flex items-center justify-center space-x-2 ${
                  showFilters || selectedTags.length > 0
                    ? 'bg-primary-500 text-white hover:bg-primary-600'
                    : 'bg-white dark:bg-dark-surface border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-elevated'
                }`}
              >
                <Filter size={16} />
                <span className="text-sm sm:text-base">Filters</span>
                {selectedTags.length > 0 && (
                  <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs">
                    {selectedTags.length}
                  </span>
                )}
              </button>
            </div>

            {/* Tag Filters - Odoo style */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-3 overflow-hidden"
                >
                  <div className="p-4 bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-700 rounded-md">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Filter by tags</p>
                    <div className="flex flex-wrap gap-2">
                      {allTags.length > 0 ? (
                        <>
                          {allTags.map((tag) => (
                            <button
                              key={tag}
                              onClick={() => {
                                setSelectedTags(prev =>
                                  prev.includes(tag)
                                    ? prev.filter(t => t !== tag)
                                    : [...prev, tag]
                                );
                              }}
                              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                                selectedTags.includes(tag)
                                  ? 'bg-primary-500 text-white hover:bg-primary-600'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                              }`}
                            >
                              <Tag size={12} className="inline mr-1" />
                              {tag}
                            </button>
                          ))}
                          {selectedTags.length > 0 && (
                            <button
                              onClick={() => setSelectedTags([])}
                              className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                              Clear all
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 italic">
                          <Tag size={16} />
                          <span className="text-sm">No tags available</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        {/* Notes Grid/List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4">
                <motion.div
                  className="w-full h-full border-4 border-primary-500 border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              </div>
              <p className="text-gray-600 dark:text-gray-400">Loading notes...</p>
            </motion.div>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 text-gray-300 dark:text-gray-600">
              <StickyNote size={80} />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {searchQuery || selectedTags.length > 0
                ? 'No notes found'
                : 'Start taking notes'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {searchQuery || selectedTags.length > 0
                ? 'Try adjusting your search or filters'
                : 'Create your first note to get started'}
            </p>
            {!(searchQuery || selectedTags.length > 0) && (
              <button
                onClick={handleCreateNote}
                className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-md font-medium transition-colors inline-flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>Create Note</span>
              </button>
            )}
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6'
                : 'space-y-3 sm:space-y-4'
            }
          >
            {filteredNotes.map((note, index) => (
              <NoteCard
                key={note.id}
                note={note}
                index={index}
                onClick={() => navigate(`/editor/${note.id}`)}
                onEdit={() => navigate(`/editor/${note.id}`)}
                onDelete={() => handleDeleteNote(note.id)}
                onTogglePin={() => handleTogglePin(note.id)}
                onToggleEncrypt={() => handleToggleEncrypt(note.id)}
              />
            ))}
          </div>
        )}
        </div>
      </div>

      {/* API Key Dialog - Odoo style */}
      <AnimatePresence>
        {showApiKeyDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
            onClick={() => setShowApiKeyDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-dark-surface rounded-lg shadow-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">AI Configuration</h3>
              </div>
              <div className="p-6">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Connect your Groq API key to enable AI-powered features.
                </p>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="gsk_..."
                  className="w-full px-3 py-2 bg-white dark:bg-dark-surface border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                <button
                  onClick={() => setShowApiKeyDialog(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveApiKey}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-md font-medium transition-colors"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lock Password Dialog */}
      {showLockDialog && selectedNoteForLock && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowLockDialog(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-dark-surface rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Lock size={20} className="text-gray-600 dark:text-gray-400" />
              Lock Note
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Enter a password to encrypt "{selectedNoteForLock.title}". You'll need this password to unlock it later.
            </p>
            
            <div className="space-y-4">
              <input
                type="password"
                value={lockPassword}
                onChange={(e) => setLockPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLockNote()}
                placeholder="Enter password to lock..."
                className="w-full px-4 py-3 bg-white dark:bg-dark-surface border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:border-primary-400 transition-all"
              />
              
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLockNote()}
                placeholder="Confirm password..."
                className="w-full px-4 py-3 bg-white dark:bg-dark-surface border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:border-primary-400 transition-all"
              />
              
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowLockDialog(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                >
                  Cancel
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLockNote}
                  disabled={!lockPassword.trim() || !confirmPassword.trim() || lockPassword !== confirmPassword}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Lock Note
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Unlock Password Dialog */}
      {showUnlockDialog && selectedNoteForUnlock && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowUnlockDialog(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-dark-surface rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Lock size={20} className="text-gray-600 dark:text-gray-400" />
              Unlock Note
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Enter the password to unlock "{selectedNoteForUnlock.title}".
            </p>
            
            <div className="space-y-4">
              <input
                type="password"
                value={unlockPassword}
                onChange={(e) => setUnlockPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleUnlockNote()}
                placeholder="Enter password..."
                className="w-full px-4 py-3 bg-white dark:bg-dark-surface border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:border-primary-400 transition-all"
                disabled={isUnlocking}
              />
              
              {unlockError && (
                <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  {unlockError}
                </div>
              )}
              
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowUnlockDialog(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                  disabled={isUnlocking}
                >
                  Cancel
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUnlockNote}
                  disabled={!unlockPassword.trim() || isUnlocking}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isUnlocking ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Unlocking...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={16} />
                      <span>Unlock Note</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default HomePage;
