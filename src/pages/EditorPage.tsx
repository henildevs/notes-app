import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  Languages,
  BookOpen,
  Wand2,
  Hash,
  FileText,
  Zap,
} from 'lucide-react';
import RichTextEditor from '../components/Editor/RichTextEditor';
import { Note, GlossaryTerm, GrammarError } from '../types';
import { noteService } from '../services/noteService';
import { groqAIService } from '../services/groqAI';

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
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null);

  // Load note on mount
  useEffect(() => {
    if (id) {
      loadNote();
    } else {
      // Create new note
      createNewNote();
    }
  }, [id]);

  const loadNote = async () => {
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
  };

  const createNewNote = async () => {
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
                {/* AI Features Button */}
                {groqAIService.isReady() && (
                  <motion.button
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAIPanel(!showAIPanel)}
                    className={`p-3 rounded-xl transition-all shadow-lg ${
                      showAIPanel
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-purple-500/30'
                        : 'glass dark:glass-dark hover:bg-purple-50 dark:hover:bg-purple-900/20'
                    }`}
                    title="AI Features"
                  >
                    <Sparkles size={18} className={showAIPanel ? 'animate-pulse' : ''} />
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
                  className="btn-premium flex items-center gap-2 text-white disabled:opacity-50"
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
                        className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl"
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
                    className="flex-1 px-4 py-2 glass dark:glass-dark border border-white/20 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:border-primary-400 transition-all"
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

              {/* AI Panel */}
              {showAIPanel && groqAIService.isReady() && (
                <motion.div
                  initial={{ opacity: 0, x: 20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ delay: 0.4, type: "spring" }}
                  className="glass dark:glass-dark rounded-2xl shadow-xl border border-white/20 dark:border-white/10 p-6 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-900/10 dark:to-pink-900/10"
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
                      className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/30"
                    >
                      <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                        ✨ {note.aiMetadata.summary}
                      </p>
                    </motion.div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleGenerateSummary}
                      disabled={aiLoading}
                      className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 transition-all text-sm font-semibold shadow-lg flex items-center justify-center gap-2"
                    >
                      {aiLoading && aiLoadingFeature === 'summary' ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <FileText size={16} />
                      )}
                      <span>Summary</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleGenerateTags}
                      disabled={aiLoading}
                      className="px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 transition-all text-sm font-semibold shadow-lg flex items-center justify-center gap-2"
                    >
                      {aiLoading && aiLoadingFeature === 'tags' ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Hash size={16} />
                      )}
                      <span>Tags</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleFindGlossaryTerms}
                      disabled={aiLoading}
                      className="px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 transition-all text-sm font-semibold shadow-lg flex items-center justify-center gap-2"
                    >
                      {aiLoading && aiLoadingFeature === 'glossary' ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <BookOpen size={16} />
                      )}
                      <span>Glossary</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCheckGrammar}
                      disabled={aiLoading}
                      className="px-4 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl hover:from-red-600 hover:to-orange-600 disabled:opacity-50 transition-all text-sm font-semibold shadow-lg flex items-center justify-center gap-2"
                    >
                      {aiLoading && aiLoadingFeature === 'grammar' ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Wand2 size={16} />
                      )}
                      <span>Grammar</span>
                    </motion.button>
                  </div>

                  <div className="mt-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl">
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
                      <Zap size={14} />
                      AI features powered by Groq
                    </p>
                  </div>
                </motion.div>
              )}

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
    </div>
  );
};

export default EditorPage;
