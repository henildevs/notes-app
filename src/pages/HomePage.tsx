import React, { useState, useEffect, useCallback } from 'react';
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
  Sparkles,
  StickyNote,
  X,
  Tag,
  Moon,
  Sun,
  Settings,
  Key,
  Zap,
  TrendingUp
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
      // Decrypt
      const password = prompt('Enter password to decrypt:');
      if (password) {
        try {
          await noteService.decryptNote(id, password);
          await loadNotes();
        } catch (error) {
          alert('Invalid password!');
        }
      }
    } else {
      // Encrypt
      const password = prompt('Enter a password to encrypt this note:');
      if (password) {
        const confirmPassword = prompt('Confirm password:');
        if (password === confirmPassword) {
          try {
            await noteService.encryptNote(id, password);
            await loadNotes();
          } catch (error) {
            console.error('Failed to encrypt note:', error);
          }
        } else {
          alert('Passwords do not match!');
        }
      }
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-dark-bg dark:via-dark-surface dark:to-dark-elevated transition-colors duration-500">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float animation-delay-200" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float animation-delay-400" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <motion.h1 
                className="text-5xl font-black gradient-text-premium flex items-center gap-4"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <StickyNote size={48} className="text-primary-500" />
                My Beautiful Notes
              </motion.h1>
              <motion.p 
                className="text-gray-600 dark:text-gray-400 mt-3 text-lg flex items-center gap-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <span className="flex items-center gap-2">
                  <TrendingUp size={18} className="text-primary-500" />
                  <span className="font-semibold text-primary-600 dark:text-primary-400">{stats.totalNotes}</span> notes
                </span>
                <span className="text-gray-400">•</span>
                <span className="flex items-center gap-2">
                  <span className="font-semibold text-yellow-600 dark:text-yellow-400">{stats.pinnedNotes}</span> pinned
                </span>
                <span className="text-gray-400">•</span>
                <span className="flex items-center gap-2">
                  <span className="font-semibold text-red-600 dark:text-red-400">{stats.encryptedNotes}</span> encrypted
                </span>
              </motion.p>
            </div>

            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleDarkMode}
                className="p-3 glass dark:glass-dark rounded-xl hover:shadow-lg transition-all"
              >
                {darkMode ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-gray-600" />}
              </motion.button>

              {/* API Key Settings */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowApiKeyDialog(true)}
                className={`p-3 glass dark:glass-dark rounded-xl hover:shadow-lg transition-all ${
                  groqAIService.isReady() ? 'text-green-600' : 'text-gray-600'
                }`}
              >
                <Key size={20} />
              </motion.button>

              {/* Import/Export */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExport}
                className="p-3 glass dark:glass-dark rounded-xl hover:shadow-lg transition-all"
                title="Export notes"
              >
                <Download size={20} className="text-gray-600 dark:text-gray-400" />
              </motion.button>
              
              <motion.label 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 glass dark:glass-dark rounded-xl hover:shadow-lg transition-all cursor-pointer"
              >
                <Upload size={20} className="text-gray-600 dark:text-gray-400" />
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </motion.label>

              {/* View Mode Toggle */}
              <div className="flex glass dark:glass-dark rounded-xl p-1 shadow-lg">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 rounded-lg transition-all ${
                    viewMode === 'grid'
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <Grid size={18} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 rounded-lg transition-all ${
                    viewMode === 'list'
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <List size={18} />
                </motion.button>
              </div>

              {/* Create Note Button */}
              <motion.button
                whileHover={{ scale: 1.05, rotate: 1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCreateNote}
                className="btn-premium flex items-center gap-2 text-white"
              >
                <Plus size={20} className="drop-shadow" />
                <span className="hidden sm:inline font-bold">New Note</span>
              </motion.button>
            </div>
          </div>

          {/* Search and Filters */}
          <motion.div 
            className="flex gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-primary-500" size={20} />
              <input
                type="text"
                placeholder="Search your notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 glass dark:glass-dark rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all placeholder-gray-500 dark:placeholder-gray-400 text-gray-700 dark:text-gray-200 shadow-lg"
              />
              {searchQuery && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X size={18} className="text-gray-500" />
                </motion.button>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3.5 glass dark:glass-dark rounded-xl transition-all shadow-lg ${
                showFilters || selectedTags.length > 0
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white'
                  : 'hover:bg-gray-50 dark:hover:bg-dark-elevated'
              }`}
            >
              <Filter size={20} />
            </motion.button>
          </motion.div>

          {/* Tag Filters */}
          <AnimatePresence>
            {showFilters && allTags.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 overflow-hidden"
              >
                <div className="p-4 glass dark:glass-dark rounded-xl shadow-lg">
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">Filter by tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((tag, index) => (
                      <motion.button
                        key={tag}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => {
                          setSelectedTags(prev =>
                            prev.includes(tag)
                              ? prev.filter(t => t !== tag)
                              : [...prev, tag]
                          );
                        }}
                        className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all transform hover:scale-105 ${
                          selectedTags.includes(tag)
                            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                            : 'glass dark:glass-dark hover:bg-white/70 dark:hover:bg-white/20'
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          <Tag size={12} />
                          {tag}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

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
              <p className="text-gray-600 dark:text-gray-400 text-lg">Loading your beautiful notes...</p>
            </motion.div>
          </div>
        ) : filteredNotes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              <Sparkles className="w-24 h-24 mx-auto mb-6 text-primary-400" />
            </motion.div>
            <h3 className="text-3xl font-bold gradient-text mb-3">
              {searchQuery || selectedTags.length > 0
                ? 'No notes found'
                : 'Your canvas awaits!'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg max-w-md mx-auto">
              {searchQuery || selectedTags.length > 0
                ? 'Try adjusting your search or filters'
                : 'Create your first note and start capturing your brilliant ideas'}
            </p>
            {!(searchQuery || selectedTags.length > 0) && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCreateNote}
                className="btn-premium text-white font-bold text-lg px-8 py-4"
              >
                <span className="flex items-center gap-2">
                  <Zap size={20} />
                  Create Your First Note
                </span>
              </motion.button>
            )}
          </motion.div>
        ) : (
          <motion.div
            layout
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
            }
          >
            <AnimatePresence mode="popLayout">
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
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* API Key Dialog */}
      <AnimatePresence>
        {showApiKeyDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowApiKeyDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass dark:glass-dark rounded-2xl p-8 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold gradient-text mb-4">Configure AI Features</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Enter your Groq API key to enable AI-powered features like smart summaries, tag suggestions, and grammar checking.
              </p>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="gsk_..."
                className="w-full px-4 py-3 glass dark:glass-dark rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 mb-6"
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowApiKeyDialog(false)}
                  className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveApiKey}
                  className="px-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:shadow-lg transition-all"
                >
                  Save API Key
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HomePage;
