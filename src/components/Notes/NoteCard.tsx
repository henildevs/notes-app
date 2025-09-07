import React from 'react';
import { motion } from 'framer-motion';
import { 
  Pin, 
  Lock, 
  Calendar, 
  Tag, 
  MoreVertical, 
  Edit,
  Trash2,
  Copy,
  Unlock,
  Sparkles,
  Clock,
  FileText
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
  const [isHovered, setIsHovered] = React.useState(false);

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

  // Color schemes for different states
  const getCardGradient = () => {
    if (note.isPinned) {
      return 'from-yellow-50/80 via-orange-50/50 to-transparent dark:from-yellow-900/20 dark:via-orange-900/10 dark:to-transparent';
    }
    if (note.isEncrypted) {
      return 'from-red-50/80 via-pink-50/50 to-transparent dark:from-red-900/20 dark:via-pink-900/10 dark:to-transparent';
    }
    if (note.aiMetadata?.summary) {
      return 'from-purple-50/80 via-blue-50/50 to-transparent dark:from-purple-900/20 dark:via-blue-900/10 dark:to-transparent';
    }
    return 'from-white/80 via-gray-50/50 to-transparent dark:from-gray-800/80 dark:via-gray-900/50 dark:to-transparent';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ 
        duration: 0.2,
        delay: index * 0.03
      }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glow effect on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-primary-400/20 to-secondary/20 rounded-2xl blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      <div
        className={`
          relative cursor-pointer overflow-hidden
          glass dark:glass-dark
          rounded-2xl shadow-lg hover:shadow-2xl
          border border-white/30 dark:border-white/10
          transition-all duration-300
          bg-gradient-to-br ${getCardGradient()}
          ${isSelected ? 'ring-2 ring-primary-500 ring-offset-2' : ''}
        `}
        onClick={onClick}
      >
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-mesh animate-gradient" />
        </div>

        {/* Pin Indicator */}
        {note.isPinned && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            className="absolute -top-2 -right-2 z-10"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-400 rounded-full blur-md animate-pulse-glow" />
              <div className="relative bg-gradient-to-br from-yellow-400 to-orange-500 text-white p-2.5 rounded-full shadow-lg">
                <Pin size={16} className="fill-current drop-shadow" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Encryption Badge */}
        {note.isEncrypted && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-4 left-4 z-10"
          >
            <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
              <Lock size={14} />
              <span className="text-xs font-semibold">Encrypted</span>
            </div>
          </motion.div>
        )}

        {/* Card Content */}
        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <h3 className={`
              font-bold text-xl line-clamp-2 flex-1
              bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300
              bg-clip-text text-transparent
              ${note.isEncrypted ? 'ml-28' : ''}
            `}>
              {getDisplayTitle()}
            </h3>
            
            {/* Menu Button */}
            <div className="relative ml-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="opacity-0 group-hover:opacity-100 transition-all duration-300 p-2 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg"
              >
                <MoreVertical size={18} className="text-gray-600 dark:text-gray-400" />
              </motion.button>

              {/* Dropdown Menu */}
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="absolute right-0 top-full mt-2 glass dark:glass-dark rounded-xl shadow-2xl border border-white/20 dark:border-white/10 z-50 min-w-[180px] overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      onEdit();
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 hover:bg-primary-50 dark:hover:bg-primary-900/30 text-left text-sm font-medium transition-colors"
                  >
                    <Edit size={16} className="text-primary-600 dark:text-primary-400" />
                    Edit Note
                  </button>
                  
                  <button
                    onClick={() => {
                      onTogglePin();
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 text-left text-sm font-medium transition-colors"
                  >
                    <Pin size={16} className="text-yellow-600 dark:text-yellow-400" />
                    {note.isPinned ? 'Unpin' : 'Pin'} Note
                  </button>

                  <button
                    onClick={() => {
                      onToggleEncrypt();
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 hover:bg-purple-50 dark:hover:bg-purple-900/30 text-left text-sm font-medium transition-colors"
                  >
                    {note.isEncrypted ? (
                      <>
                        <Unlock size={16} className="text-purple-600 dark:text-purple-400" />
                        Decrypt Note
                      </>
                    ) : (
                      <>
                        <Lock size={16} className="text-purple-600 dark:text-purple-400" />
                        Encrypt Note
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(note.plainTextContent || '');
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-left text-sm font-medium transition-colors"
                  >
                    <Copy size={16} className="text-blue-600 dark:text-blue-400" />
                    Copy Content
                  </button>

                  <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

                  <button
                    onClick={() => {
                      onDelete();
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 text-left text-sm font-medium transition-colors"
                  >
                    <Trash2 size={16} />
                    Delete Note
                  </button>
                </motion.div>
              )}
            </div>
          </div>

          {/* AI Summary Badge */}
          {note.aiMetadata?.summary && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-3 p-3 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-xl border border-purple-200/50 dark:border-purple-700/30"
            >
              <div className="flex items-start gap-2">
                <Sparkles className="text-purple-600 dark:text-purple-400 mt-0.5" size={16} />
                <p className="text-sm text-purple-700 dark:text-purple-300 italic leading-relaxed">
                  {note.aiMetadata.summary}
                </p>
              </div>
            </motion.div>
          )}

          {/* Content Preview */}
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed line-clamp-3 mb-4">
            {getPreviewText()}
          </p>

          {/* Tags */}
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {note.tags.slice(0, 3).map((tag, index) => (
                <motion.span
                  key={tag}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-primary-100 to-primary-50 dark:from-primary-900/30 dark:to-primary-800/20 text-primary-700 dark:text-primary-300 rounded-full text-xs font-medium border border-primary-200/50 dark:border-primary-700/30"
                >
                  <Tag size={10} />
                  {tag}
                </motion.span>
              ))}
              {note.tags.length > 3 && (
                <span className="inline-flex items-center px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-xs">
                  +{note.tags.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <span>{formatDate(note.updatedAt)}</span>
              </div>
              {note.content && (
                <div className="flex items-center gap-1">
                  <FileText size={14} />
                  <span>{note.plainTextContent?.split(/\s+/).filter(w => w).length || 0} words</span>
                </div>
              )}
            </div>
            
            {/* Activity Indicator */}
            {note.lastAccessedAt && (
              <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
                <Clock size={12} />
                <span className="text-xs">Active</span>
              </div>
            )}
          </div>
        </div>

        {/* Shimmer effect on hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
          initial={{ x: '-200%' }}
          animate={{ x: isHovered ? '200%' : '-200%' }}
          transition={{ duration: 1, ease: 'easeInOut' }}
        />
      </div>
    </motion.div>
  );
};

export default NoteCard;
