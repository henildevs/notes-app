import React from 'react';
import { motion } from 'framer-motion';
import { 
  Pin, 
  Lock, 
  Tag, 
  MoreVertical, 
  Edit,
  Trash2,
  Copy,
  Unlock,
  Sparkles
} from 'lucide-react';
import { Note } from '../../types';

interface NoteCardProps {
  note: Note;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  onToggleEncrypt: () => void;
  isSelected?: boolean;
  index?: number;
}

const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onClick,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleEncrypt,
  isSelected = false,
  index = 0,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);

  // Format date
  const formatDate = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - d.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  // Truncate text for preview
  const truncateText = (text: string, maxLength: number = 120) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  // Get preview text
  const getPreviewText = () => {
    if (note.isEncrypted && !note.content) {
      return '🔐 This note is encrypted. Click to unlock.';
    }
    return truncateText(note.plainTextContent || 'Start writing something amazing...');
  };

  // Get display title
  const getDisplayTitle = () => {
    if (note.isEncrypted && note.title === '🔒 Encrypted Note') {
      return '🔒 Encrypted Note';
    }
    return note.title || 'Untitled Note';
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ 
        duration: 0.15,
        delay: index * 0.02
      }}
      className="relative group">
      <div
        className={`
          relative cursor-pointer
          bg-white dark:bg-dark-surface
          rounded-lg shadow-sm hover:shadow-md
          border border-gray-200 dark:border-gray-700
          transition-all duration-200
          ${note.isPinned ? 'border-l-4 border-l-primary-500' : ''}
          ${isSelected ? 'ring-2 ring-primary-500' : ''}
        `}
        onClick={onClick}
      >

        {/* Status badges - Odoo style */}
        <div className="absolute top-3 right-12 flex items-center gap-2">
          {note.isPinned && (
            <div className="p-1.5 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded">
              <Pin size={14} className="fill-current" />
            </div>
          )}
          {note.isEncrypted && (
            <div className="p-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded">
              <Lock size={14} />
            </div>
          )}
        </div>

        {/* Card Content - Odoo style */}
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-white text-base line-clamp-1 flex-1 pr-20">
              {getDisplayTitle()}
            </h3>
            
            {/* Menu Button - Odoo style */}
            <div className="relative ml-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              >
                <MoreVertical size={16} className="text-gray-500 dark:text-gray-400" />
              </button>

              {/* Dropdown Menu - Odoo style */}
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute right-0 top-full mt-1 bg-white dark:bg-dark-surface rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50 min-w-[160px] py-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      onEdit();
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-left text-sm transition-colors"
                  >
                    <Edit size={14} className="text-gray-600 dark:text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">Edit</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      onTogglePin();
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-left text-sm transition-colors"
                  >
                    <Pin size={14} className="text-gray-600 dark:text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">{note.isPinned ? 'Unpin' : 'Pin'}</span>
                  </button>

                  <button
                    onClick={() => {
                      onToggleEncrypt();
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-left text-sm transition-colors"
                  >
                    {note.isEncrypted ? (
                      <>
                        <Unlock size={14} className="text-gray-600 dark:text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300">Decrypt</span>
                      </>
                    ) : (
                      <>
                        <Lock size={14} className="text-gray-600 dark:text-gray-400" />
                        <span className="text-gray-700 dark:text-gray-300">Encrypt</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(note.plainTextContent || '');
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-left text-sm transition-colors"
                  >
                    <Copy size={14} className="text-gray-600 dark:text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">Copy</span>
                  </button>

                  <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

                  <button
                    onClick={() => {
                      onDelete();
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-left text-sm transition-colors"
                  >
                    <Trash2 size={14} className="text-red-600 dark:text-red-400" />
                    <span className="text-red-600 dark:text-red-400">Delete</span>
                  </button>
                </motion.div>
              )}
            </div>
          </div>

          {/* AI Summary - Odoo style */}
          {note.aiMetadata?.summary && (
            <div className="mb-2 p-2 bg-secondary-50 dark:bg-secondary-900/20 rounded border border-secondary-200 dark:border-secondary-800">
              <div className="flex items-start gap-2">
                <Sparkles className="text-secondary-400 mt-0.5" size={14} />
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  {note.aiMetadata.summary}
                </p>
              </div>
            </div>
          )}

          {/* Content Preview - Odoo style */}
          <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
            {getPreviewText()}
          </p>

          {/* Tags - Odoo style */}
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {note.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-xs"
                >
                  <Tag size={10} />
                  {tag}
                </span>
              ))}
              {note.tags.length > 3 && (
                <span className="px-2 py-0.5 text-gray-500 dark:text-gray-500 text-xs">
                  +{note.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Footer - Odoo style */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
            <div className="flex items-center gap-3">
              <span>{formatDate(note.updatedAt)}</span>
              {note.content && (
                <span>{note.plainTextContent?.split(/\s+/).filter(w => w).length || 0} words</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default NoteCard;
