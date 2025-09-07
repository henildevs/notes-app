import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Languages,
  ChevronDown,
  Check,
  X,
  RefreshCw,
  Copy,
  Eye,
  EyeOff,
} from 'lucide-react';
import { groqAIService } from '../../services/groqAI';
import { noteService } from '../../services/noteService';

interface TranslationPanelProps {
  noteId: string;
  originalContent: string;
  onClose: () => void;
}

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

const TranslationPanel: React.FC<TranslationPanelProps> = ({
  noteId,
  originalContent,
  onClose,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [translatedContent, setTranslatedContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const supportedLanguages = groqAIService.getSupportedLanguages();

  // Check for cached translation when language changes
  useEffect(() => {
    const checkCachedTranslation = async () => {
      try {
        const cached = await noteService.getCachedTranslation(noteId, selectedLanguage);
        if (cached) {
          setTranslatedContent(cached);
        }
      } catch (error) {
        console.error('Failed to check cached translation:', error);
      }
    };

    if (selectedLanguage) {
      checkCachedTranslation();
    }
  }, [selectedLanguage, noteId]);

  const handleTranslate = async () => {
    if (!selectedLanguage || !groqAIService.isReady()) {
      setError('Please select a language and ensure AI service is configured');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const translation = await noteService.translateNote(noteId, selectedLanguage);
      if (translation) {
        setTranslatedContent(translation);
      }
    } catch (error) {
      console.error('Translation failed:', error);
      setError('Translation failed. Please check your API key and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyTranslation = async () => {
    try {
      await navigator.clipboard.writeText(translatedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleLanguageSelect = (language: Language) => {
    setSelectedLanguage(language.code);
    setShowLanguageDropdown(false);
    setTranslatedContent(''); // Clear previous translation
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showLanguageDropdown) {
        const target = event.target as Element;
        if (!target.closest('.language-dropdown-container')) {
          setShowLanguageDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLanguageDropdown]);

  const getLanguageName = (code: string) => {
    const lang = supportedLanguages.find(l => l.code === code);
    return lang ? `${lang.name} (${lang.nativeName})` : code;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-dark-surface rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-visible"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
              <Languages size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                AI Translation
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Translate your note using AI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Language Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Target Language
            </label>
             <div className="relative language-dropdown-container">
               <button
                 onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                 className="w-full px-4 py-3 bg-white dark:bg-dark-surface border border-gray-300 dark:border-gray-600 rounded-xl text-left flex items-center justify-between hover:border-primary-500 transition-colors"
               >
                <span className="text-gray-900 dark:text-white">
                  {selectedLanguage ? getLanguageName(selectedLanguage) : 'Choose a language...'}
                </span>
                <ChevronDown 
                  size={20} 
                  className={`text-gray-400 transition-transform ${
                    showLanguageDropdown ? 'rotate-180' : ''
                  }`} 
                />
              </button>

               <AnimatePresence>
                 {showLanguageDropdown && (
                   <motion.div
                     initial={{ opacity: 0, scale: 0.95 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.95 }}
                     className="fixed inset-0 bg-black/20 flex items-center justify-center z-[200]"
                     onClick={() => setShowLanguageDropdown(false)}
                   >
                     <motion.div
                       initial={{ opacity: 0, y: -20 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0, y: -20 }}
                       className="bg-white dark:bg-dark-surface border border-gray-300 dark:border-gray-600 rounded-xl shadow-xl max-h-80 w-80 overflow-y-auto"
                       onClick={(e) => e.stopPropagation()}
                     >
                       <div className="p-2">
                         {supportedLanguages.map((language) => (
                           <button
                             key={language.code}
                             onClick={() => handleLanguageSelect(language)}
                             className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between transition-colors rounded-lg"
                           >
                             <div>
                               <div className="font-medium text-gray-900 dark:text-white">
                                 {language.name}
                               </div>
                               <div className="text-sm text-gray-600 dark:text-gray-400">
                                 {language.nativeName}
                               </div>
                             </div>
                             {selectedLanguage === language.code && (
                               <Check size={16} className="text-primary-500" />
                             )}
                           </button>
                         ))}
                       </div>
                     </motion.div>
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mb-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleTranslate}
              disabled={isLoading || !selectedLanguage}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span>Translating...</span>
                </>
              ) : (
                <>
                  <Languages size={18} />
                  <span>Translate</span>
                </>
              )}
            </motion.button>

            {translatedContent && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCopyTranslation}
                className="px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check size={18} className="text-green-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={18} />
                    <span>Copy</span>
                  </>
                )}
              </motion.button>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
            >
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </motion.div>
          )}

          {/* Content Display */}
          {translatedContent && (
            <div className="space-y-4">
              {/* Toggle Button */}
              <div className="flex justify-center">
                <button
                  onClick={() => setShowOriginal(!showOriginal)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium flex items-center gap-2"
                >
                  {showOriginal ? (
                    <>
                      <EyeOff size={16} />
                      <span>Show Translation</span>
                    </>
                  ) : (
                    <>
                      <Eye size={16} />
                      <span>Show Original</span>
                    </>
                  )}
                </button>
              </div>

              {/* Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 max-h-96 overflow-y-auto"
              >
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: showOriginal ? originalContent : translatedContent,
                    }}
                  />
                </div>
              </motion.div>
            </div>
          )}

        </div>
      </motion.div>
    </motion.div>
  );
};

export default TranslationPanel;
