import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  Pin,
  Lock,
  Sparkles,
  Tag,
  Brain,
  CheckCircle,
  AlertCircle,
  X,
  BookOpen,
  Languages,
} from 'lucide-react';
import RichTextEditor from '../components/Editor/RichTextEditor';
import TranslationPanel from '../components/Translation/TranslationPanel';
import { Note } from '../types';
import { noteService } from '../services/noteService';
import { groqAIService } from '../services/groqAI';
import { databaseService } from '../services/database';

const EditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiLoading, setAILoading] = useState(false);
  const [aiLoadingFeature, setAILoadingFeature] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showGlossaryTerms, setShowGlossaryTerms] = useState(false);
  const [showGrammarErrors, setShowGrammarErrors] = useState(false);
  const [showTranslationPanel, setShowTranslationPanel] = useState(false);
  const [password, setPassword] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState('');
  const [showLockDialog, setShowLockDialog] = useState(false);
  const [lockPassword, setLockPassword] = useState('');

  // Initialize theme and AI service on mount
  useEffect(() => {
    loadTheme();
    checkApiKey();
  }, []);

  const loadTheme = async () => {
    const prefs = await databaseService.getPreferences();
    if (prefs.theme === 'dark' || (prefs.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const checkApiKey = async () => {
    const prefs = await databaseService.getPreferences();
    if (prefs.groqApiKey) {
      groqAIService.initialize(prefs.groqApiKey);
    }
  };

  const loadNote = useCallback(async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const loadedNote = await noteService.getNote(id);
      if (loadedNote) {
        // Try to decrypt if encrypted
        if (loadedNote.isEncrypted) {
          const decrypted = await noteService.tryDecryptWithSession(id);
          setNote(decrypted || loadedNote);
        } else {
          setNote(loadedNote);
        }
      } else {
        // Note not found, redirect to home
        navigate('/');
      }
    } catch (error) {
      console.error('Failed to load note:', error);
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  const createNewNote = useCallback(async () => {
    try {
      const newNote = await noteService.createNote('Untitled Note', '');
      setNote(newNote);
      // Update URL to include the new note ID
      navigate(`/editor/${newNote.id}`, { replace: true });
    } catch (error) {
      console.error('Failed to create note:', error);
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  // Load note on mount
  useEffect(() => {
    if (id) {
      loadNote();
    } else {
      // Create new note
      createNewNote();
    }
  }, [id, loadNote, createNewNote]);

  const handleLockNote = async () => {
    if (!note || !lockPassword.trim()) return;
    
    try {
      const lockedNote = await noteService.encryptNote(note.id, lockPassword);
      
      if (lockedNote) {
        setNote(lockedNote);
        setPassword('');
        setUnlockError('');
        setLockPassword('');
        setShowLockDialog(false);
      } else {
        alert('Failed to lock note. Please try again.');
      }
    } catch (error) {
      console.error('Failed to lock note:', error);
      alert('Failed to lock note. Please try again.');
    }
  };

  const handleUnlockNote = async () => {
    if (!note || !password.trim()) return;
    
    setIsUnlocking(true);
    setUnlockError('');
    
    try {
      const decryptedNote = await noteService.decryptNote(note.id, password);
      if (decryptedNote) {
        setNote(decryptedNote);
        setPassword('');
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

  const handleContentChange = useCallback((content: string, plainText: string) => {
    if (!note) return;
    
    const updatedNote = {
      ...note,
      content,
      plainTextContent: plainText,
      updatedAt: new Date(),
    };
    
    setNote(updatedNote);
    
    // Auto-save with debouncing
    noteService.autoSaveNote(updatedNote);
  }, [note]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!note) return;
    
    const updatedNote = {
      ...note,
      title: e.target.value,
      updatedAt: new Date(),
    };
    
    setNote(updatedNote);
    noteService.autoSaveNote(updatedNote);
  };

  const handleSave = async () => {
    if (!note) return;
    
    setIsSaving(true);
    try {
      await noteService.updateNote(note.id, note);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to save note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePin = async () => {
    if (!note) return;
    
    try {
      const updated = await noteService.togglePin(note.id);
      if (updated) setNote(updated);
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    }
  };

  const handleAddTag = async () => {
    if (!note || !tagInput.trim()) return;
    
    try {
      const updated = await noteService.addTag(note.id, tagInput.trim());
      if (updated) {
        setNote(updated);
        setTagInput('');
      }
    } catch (error) {
      console.error('Failed to add tag:', error);
    }
  };

  const handleRemoveTag = async (tag: string) => {
    if (!note) return;
    
    try {
      const updated = await noteService.removeTag(note.id, tag);
      if (updated) setNote(updated);
    } catch (error) {
      console.error('Failed to remove tag:', error);
    }
  };

  const handleGenerateSummary = async () => {
    if (!note || !groqAIService.isReady()) return;
    
    setAILoading(true);
    setAILoadingFeature('summary');
    try {
      const summary = await noteService.generateSummary(note.id);
      if (summary) {
        const updatedNote = await noteService.getNote(note.id);
        if (updatedNote) setNote(updatedNote);
      }
    } catch (error) {
      console.error('Failed to generate summary:', error);
      alert('Failed to generate summary. Please check your API key.');
    } finally {
      setAILoading(false);
      setAILoadingFeature(null);
    }
  };

  const handleGenerateTags = async () => {
    if (!note || !groqAIService.isReady()) return;
    
    setAILoading(true);
    setAILoadingFeature('tags');
    try {
      const suggestedTags = await noteService.generateTagSuggestions(note.id);
      if (suggestedTags && suggestedTags.length > 0) {
        // Add suggested tags to the note
        for (const tag of suggestedTags) {
          await noteService.addTag(note.id, tag);
        }
        const updatedNote = await noteService.getNote(note.id);
        if (updatedNote) setNote(updatedNote);
      }
    } catch (error) {
      console.error('Failed to generate tags:', error);
      alert('Failed to generate tags. Please check your API key.');
    } finally {
      setAILoading(false);
      setAILoadingFeature(null);
    }
  };

  const handleFindGlossaryTerms = async () => {
    if (!note || !groqAIService.isReady()) return;
    
    setAILoading(true);
    setAILoadingFeature('glossary');
    try {
      await noteService.findGlossaryTerms(note.id);
      const updatedNote = await noteService.getNote(note.id);
      if (updatedNote) {
        setNote(updatedNote);
        setShowGlossaryTerms(true);
      }
    } catch (error) {
      console.error('Failed to find glossary terms:', error);
      alert('Failed to find glossary terms. Please check your API key.');
    } finally {
      setAILoading(false);
      setAILoadingFeature(null);
    }
  };

  const handleCheckGrammar = async () => {
    if (!note || !groqAIService.isReady()) return;
    
    setAILoading(true);
    setAILoadingFeature('grammar');
    try {
      await noteService.checkGrammar(note.id);
      const updatedNote = await noteService.getNote(note.id);
      if (updatedNote) {
        setNote(updatedNote);
        setShowGrammarErrors(true);
      }
    } catch (error) {
      console.error('Failed to check grammar:', error);
      alert('Failed to check grammar. Please check your API key.');
    } finally {
      setAILoading(false);
      setAILoadingFeature(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary/10 dark:from-dark-bg dark:to-dark-surface">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="mb-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 mx-auto border-4 border-primary-500 border-t-transparent rounded-full"
            />
          </div>
          <h2 className="text-lg font-semibold text-gray-600 dark:text-gray-400">Loading your note...</h2>
        </motion.div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary/10 dark:from-dark-bg dark:to-dark-surface">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-8 glass dark:glass-dark rounded-2xl shadow-xl"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <AlertCircle className="w-20 h-20 mx-auto mb-6 text-red-400" />
          </motion.div>
          <h2 className="text-2xl font-bold gradient-text mb-2">
            Note not found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">The note you're looking for doesn't exist.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="btn-premium text-white"
          >
            Go Back to Notes
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-mesh opacity-5 dark:opacity-[0.02] animate-gradient" />
      <div className="fixed inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-secondary/5" />
      
      <div className="relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass dark:glass-dark backdrop-blur-xl border-b border-white/20 dark:border-white/10 sticky top-0 z-50"
        >
          <div className="max-w-7xl mx-auto px-4 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/')}
                  className="p-3 glass dark:glass-dark rounded-xl hover:bg-white/50 dark:hover:bg-white/10 transition-all shadow-lg"
                >
                  <ArrowLeft size={18} className="text-gray-700 dark:text-gray-300" />
                </motion.button>
                
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={note.title}
                    onChange={handleTitleChange}
                    placeholder="Enter your note title..."
                    className="text-3xl font-black bg-transparent outline-none placeholder-gray-400 dark:placeholder-gray-500 gradient-text-premium w-full"
                  />
                  <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-secondary opacity-30" />
                </div>
                
                {note.isPinned && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl"
                  >
                    <Pin className="text-yellow-600 dark:text-yellow-400 fill-current" size={18} />
                  </motion.div>
                )}
                
                {note.isEncrypted && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl"
                  >
                    <Lock className="text-red-600 dark:text-red-400" size={18} />
                  </motion.div>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Lock Button - Show for all encrypted notes */}
                {note.isEncrypted && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowLockDialog(true)}
                    className={`p-3 rounded-xl transition-all shadow-lg ${
                      note.content 
                        ? 'glass dark:glass-dark hover:bg-red-50 dark:hover:bg-red-900/20' 
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    title={note.content ? "Lock Note" : "Note is already locked"}
                  >
                    <Lock size={18} className={`${note.content ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`} />
                  </motion.button>
                )}

                {/* Pin Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleTogglePin}
                  className={`p-3 rounded-xl transition-all shadow-lg ${
                    note.isPinned
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-yellow-400/30'
                      : 'glass dark:glass-dark hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                  }`}
                  title={note.isPinned ? 'Unpin' : 'Pin'}
                >
                  <Pin size={18} className={note.isPinned ? 'fill-current drop-shadow' : ''} />
                </motion.button>

                {/* Save Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : showSuccess ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500 }}
                    >
                      <CheckCircle size={18} />
                    </motion.div>
                  ) : (
                    <Save size={18} />
                  )}
                  <span className="font-semibold">{showSuccess ? 'Saved!' : 'Save'}</span>
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Editor */}
            <motion.div 
              className="lg:col-span-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="glass dark:glass-dark rounded-2xl shadow-xl border border-white/20 dark:border-white/10 overflow-hidden">
                {/* Encrypted Note Unlock Interface */}
                {note.isEncrypted && !note.content && (
                  <div className="p-8 text-center">
                    <div className="mb-6">
                      <Lock size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Note is Encrypted
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Enter the password to unlock this note
                      </p>
                    </div>
                    
                    <div className="max-w-md mx-auto space-y-4">
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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
                      
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleUnlockNote}
                        disabled={!password.trim() || isUnlocking}
                        className="w-full px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                )}
                
                <RichTextEditor
                  content={note.content}
                  onChange={handleContentChange}
                  readOnly={note.isEncrypted && !note.content}
                />
              </div>

              {/* Glossary Terms Display */}
              {showGlossaryTerms && note.aiMetadata?.glossaryTerms && note.aiMetadata.glossaryTerms.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 glass dark:glass-dark rounded-2xl shadow-xl border border-white/20 dark:border-white/10 p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg flex items-center gap-2 gradient-text">
                      <BookOpen size={20} className="text-purple-500" />
                      Glossary Terms
                    </h3>
                    <button onClick={() => setShowGlossaryTerms(false)}>
                      <X size={18} className="text-gray-500" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {note.aiMetadata.glossaryTerms.map((term, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-3 bg-gradient-to-r from-purple-50 to-cyan-50 dark:from-purple-900/20 dark:to-cyan-900/20 rounded-xl"
                      >
                        <div className="font-semibold text-purple-700 dark:text-purple-300 mb-1">
                          {term.term}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {term.definition}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Grammar Errors Display */}
              {showGrammarErrors && note.aiMetadata?.grammarErrors && note.aiMetadata.grammarErrors.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 glass dark:glass-dark rounded-2xl shadow-xl border border-white/20 dark:border-white/10 p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg flex items-center gap-2 gradient-text">
                      <AlertCircle size={20} className="text-red-500" />
                      Grammar Check
                    </h3>
                    <button onClick={() => setShowGrammarErrors(false)}>
                      <X size={18} className="text-gray-500" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {note.aiMetadata.grammarErrors.map((error, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-3 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl"
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-red-600 dark:text-red-400 line-through text-sm">
                            {error.text}
                          </span>
                          <span className="text-gray-500">→</span>
                          <span className="text-green-600 dark:text-green-400 font-medium text-sm">
                            {error.suggestion}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Type: {error.type}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Tags */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="glass dark:glass-dark rounded-2xl shadow-xl border border-white/20 dark:border-white/10 p-6"
              >
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 gradient-text">
                  <Tag size={20} className="text-primary-500" />
                  Tags
                </h3>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {note.tags.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">No tags yet</p>
                  ) : (
                    note.tags.map((tag, index) => (
                      <motion.span
                        key={tag}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-primary-100 to-primary-50 dark:from-primary-900/30 dark:to-primary-800/20 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium border border-primary-200/50 dark:border-primary-700/30"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 p-0.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors"
                        >
                          <X size={14} className="text-red-500" />
                        </button>
                      </motion.span>
                    ))
                  )}
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    placeholder="Add a new tag..."
                    className="flex-1 px-4 py-2 bg-white dark:bg-dark-surface border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:border-primary-400 transition-all"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all"
                  >
                    Add
                  </motion.button>
                </div>
              </motion.div>

              {/* Note Info */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="glass dark:glass-dark rounded-2xl shadow-xl border border-white/20 dark:border-white/10 p-6"
              >
                <h3 className="font-bold text-lg mb-4 gradient-text">Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-white/50 dark:bg-white/5 rounded-xl">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Words</span>
                    <span className="font-semibold text-primary-600 dark:text-primary-400">
                      {note.plainTextContent?.split(/\s+/).filter(w => w).length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/50 dark:bg-white/5 rounded-xl">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Characters</span>
                    <span className="font-semibold text-primary-600 dark:text-primary-400">
                      {note.plainTextContent?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/50 dark:bg-white/5 rounded-xl">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Created</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300 text-xs">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/50 dark:bg-white/5 rounded-xl">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Modified</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300 text-xs">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Translation Panel */}
      {showTranslationPanel && note && (
        <TranslationPanel
          noteId={note.id}
          originalContent={note.content}
          onClose={() => setShowTranslationPanel(false)}
        />
      )}

      {/* Fixed AI Assistant Button */}
      {groqAIService.isReady() && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowAIPanel(!showAIPanel)}
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-full transition-all shadow-xl ${
            showAIPanel
              ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-purple-500/30'
              : 'glass dark:glass-dark hover:bg-purple-50 dark:hover:bg-purple-900/20'
          }`}
          title="AI Assistant"
        >
          <Sparkles size={24} className={showAIPanel ? 'animate-pulse' : ''} />
        </motion.button>
      )}

      {/* Fixed AI Panel */}
      {showAIPanel && groqAIService.isReady() && note && (
        <motion.div
          initial={{ opacity: 0, x: 20, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="fixed bottom-20 right-6 z-40 w-80 max-h-96 overflow-y-auto bg-white dark:bg-dark-surface rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6"
        >
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2 gradient-text">
            <Brain size={20} className="text-purple-500" />
            AI Assistant
          </h3>

          {/* AI Summary */}
          {note.aiMetadata?.summary && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-cyan-50 dark:from-purple-900/20 dark:to-cyan-900/20 rounded-xl border border-purple-200/50 dark:border-purple-700/30"
            >
              <p className="text-sm text-purple-700 dark:text-purple-300 leading-relaxed">
                ✨ {note.aiMetadata.summary}
              </p>
            </motion.div>
          )}

          {/* AI Actions */}
          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerateSummary}
              disabled={aiLoading}
              className="w-full px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {aiLoading && aiLoadingFeature === 'summary' ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles size={16} />
              )}
              <span>{aiLoading && aiLoadingFeature === 'summary' ? 'Generating...' : 'Generate Summary'}</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerateTags}
              disabled={aiLoading}
              className="w-full px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {aiLoading && aiLoadingFeature === 'tags' ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Tag size={16} />
              )}
              <span>{aiLoading && aiLoadingFeature === 'tags' ? 'Generating...' : 'Suggest Tags'}</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleFindGlossaryTerms}
              disabled={aiLoading}
              className="w-full px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {aiLoading && aiLoadingFeature === 'glossary' ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <BookOpen size={16} />
              )}
              <span>{aiLoading && aiLoadingFeature === 'glossary' ? 'Finding...' : 'Find Glossary Terms'}</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCheckGrammar}
              disabled={aiLoading}
              className="w-full px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {aiLoading && aiLoadingFeature === 'grammar' ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle size={16} />
              )}
              <span>{aiLoading && aiLoadingFeature === 'grammar' ? 'Checking...' : 'Check Grammar'}</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowTranslationPanel(true)}
              className="w-full px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2 mt-3"
            >
              <Languages size={16} />
              <span>Translate</span>
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Lock Password Dialog */}
      {showLockDialog && (
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
              {note.content ? 'Lock Note' : 'Note Already Locked'}
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {note.content 
                ? "Enter a password to encrypt this note. You'll need this password to unlock it later."
                : "This note is already encrypted. You can unlock it by entering the correct password."
              }
            </p>
            
            <div className="space-y-4">
              {note.content && (
                <input
                  type="password"
                  value={lockPassword}
                  onChange={(e) => setLockPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLockNote()}
                  placeholder="Enter password to lock..."
                  className="w-full px-4 py-3 bg-white dark:bg-dark-surface border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:border-primary-400 transition-all"
                />
              )}
              
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
                  onClick={note.content ? handleLockNote : () => setShowLockDialog(false)}
                  disabled={note.content ? !lockPassword.trim() : false}
                  className={`flex-1 px-4 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 ${
                    note.content 
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {note.content ? 'Lock Note' : 'Close'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default EditorPage;
