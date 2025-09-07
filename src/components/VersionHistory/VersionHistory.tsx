import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  RotateCcw,
  Trash2,
  Eye,
  Calendar,
  Clock,
  X,
  AlertTriangle,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { NoteVersion } from '../../types';
import { noteService } from '../../services/noteService';

interface VersionHistoryProps {
  noteId: string;
  isOpen: boolean;
  onClose: () => void;
  onRestore: (version: NoteVersion) => void;
}

const VersionHistory: React.FC<VersionHistoryProps> = ({
  noteId,
  isOpen,
  onClose,
  onRestore,
}) => {
  const [versions, setVersions] = useState<NoteVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<NoteVersion | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState('');

  const loadVersions = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const noteVersions = await noteService.getNoteVersions(noteId);
      setVersions(noteVersions.sort((a, b) => b.versionNumber - a.versionNumber));
    } catch (err) {
      setError('Failed to load version history');
      console.error('Error loading versions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [noteId]);

  // Load versions when component opens
  useEffect(() => {
    if (isOpen) {
      loadVersions();
    }
  }, [isOpen, noteId, loadVersions]);

  const handleRestore = async (version: NoteVersion) => {
    if (window.confirm(`Are you sure you want to restore to version ${version.versionNumber}? This will replace the current content.`)) {
      setIsRestoring(true);
      try {
        const restoredNote = await noteService.restoreToVersion(noteId, version.id);
        if (restoredNote) {
          onRestore(version);
          onClose();
        } else {
          setError('Failed to restore version');
        }
      } catch (err) {
        setError('Failed to restore version');
        console.error('Error restoring version:', err);
      } finally {
        setIsRestoring(false);
      }
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    if (window.confirm('Are you sure you want to delete this version? This action cannot be undone.')) {
      try {
        const success = await noteService.deleteVersion(noteId, versionId);
        if (success) {
          await loadVersions();
        } else {
          setError('Failed to delete version');
        }
      } catch (err) {
        setError('Failed to delete version');
        console.error('Error deleting version:', err);
      }
    }
  };

  const handleClearAllVersions = async () => {
    if (window.confirm('Are you sure you want to clear all version history? This action cannot be undone.')) {
      try {
        const success = await noteService.clearVersions(noteId);
        if (success) {
          setVersions([]);
        } else {
          setError('Failed to clear version history');
        }
      } catch (err) {
        setError('Failed to clear version history');
        console.error('Error clearing versions:', err);
      }
    }
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffTime = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffMinutes < 60) {
      return `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (!content) return 'No content';
    const plainText = content.replace(/<[^>]*>/g, '');
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength).trim() + '...';
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-dark-surface rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <History className="text-primary-600 dark:text-primary-400" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Version History
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {versions.length} version{versions.length !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {versions.length > 0 && (
              <button
                onClick={handleClearAllVersions}
                className="px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-8 h-8 mx-auto mb-4">
                  <motion.div
                    className="w-full h-full border-4 border-primary-500 border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                </div>
                <p className="text-gray-600 dark:text-gray-400">Loading versions...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertTriangle className="text-red-500 mx-auto mb-4" size={48} />
                <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                <button
                  onClick={loadVersions}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : versions.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <FileText className="text-gray-400 mx-auto mb-4" size={48} />
                <p className="text-gray-600 dark:text-gray-400 mb-2">No version history</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Start editing your note to create versions
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[60vh]">
              <div className="p-6 space-y-4">
                {versions.map((version, index) => (
                  <motion.div
                    key={version.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 rounded-lg border transition-all ${
                      index === 0
                        ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                            index === 0
                              ? 'bg-primary-500 text-white'
                              : 'bg-gray-500 text-white'
                          }`}>
                            v{version.versionNumber}
                          </div>
                          {index === 0 && (
                            <div className="flex items-center gap-1 text-primary-600 dark:text-primary-400">
                              <CheckCircle size={14} />
                              <span className="text-xs font-medium">Current</span>
                            </div>
                          )}
                        </div>
                        
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {version.title || 'Untitled Note'}
                        </h3>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                          {truncateContent(version.content)}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar size={12} />
                            <span>{formatDate(version.timestamp)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock size={12} />
                            <span>{new Date(version.timestamp).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => {
                            setSelectedVersion(version);
                            setShowPreview(true);
                          }}
                          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          title="Preview"
                        >
                          <Eye size={16} />
                        </button>
                        
                        {index > 0 && (
                          <>
                            <button
                              onClick={() => handleRestore(version)}
                              disabled={isRestoring}
                              className="p-2 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors disabled:opacity-50"
                              title="Restore to this version"
                            >
                              <RotateCcw size={16} />
                            </button>
                            
                            <button
                              onClick={() => handleDeleteVersion(version.id)}
                              className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Delete version"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Preview Modal */}
        <AnimatePresence>
          {showPreview && selectedVersion && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
              onClick={() => setShowPreview(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-dark-surface rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[80vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Version {selectedVersion.versionNumber} Preview
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(selectedVersion.timestamp)}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                  <div className="prose dark:prose-invert max-w-none">
                    <h1 className="text-2xl font-bold mb-4">{selectedVersion.title}</h1>
                    <div dangerouslySetInnerHTML={{ __html: selectedVersion.content }} />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setShowPreview(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      handleRestore(selectedVersion);
                      setShowPreview(false);
                    }}
                    className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                  >
                    Restore This Version
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default VersionHistory;
