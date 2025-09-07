import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Palette,
  Undo,
  Redo,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
  Image,
} from 'lucide-react';
import { RichTextEditorProps } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = 'Start writing your note...',
  readOnly = false,
  showToolbar = true,
  className = '',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [selectedFontSize, setSelectedFontSize] = useState('16');
  const [showFontSizeDropdown, setShowFontSizeDropdown] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [history, setHistory] = useState<string[]>([content]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const fontSizes = ['12', '14', '16', '18', '20', '24', '28', '32', '36', '48'];
  const colors = [
    '#000000', '#374151', '#DC2626', '#EA580C', '#FACC15', 
    '#16A34A', '#0EA5E9', '#2563EB', '#7C3AED', '#DB2777',
    '#6B7280', '#F87171', '#FB923C', '#FDE047', '#4ADE80',
    '#38BDF8', '#60A5FA', '#A78BFA', '#F472B6', '#FFFFFF',
  ];

  const handleContentChange = useCallback(() => {
    if (!editorRef.current) return;
    
    const htmlContent = editorRef.current.innerHTML;
    const plainText = editorRef.current.innerText || '';
    
    // Add to history for undo/redo
    if (htmlContent !== history[historyIndex]) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(htmlContent);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
    
    onChange(htmlContent, plainText);
  }, [onChange, history, historyIndex]);

  useEffect(() => {
    if (!editorRef.current) return;
    
    if (content !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  const handleFormat = useCallback((command: string, value?: string) => {
    if (readOnly) return;
    
    document.execCommand(command, false, value);
    handleContentChange();
    editorRef.current?.focus();
  }, [readOnly, handleContentChange]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      if (editorRef.current) {
        editorRef.current.innerHTML = history[newIndex];
        handleContentChange();
      }
    }
  }, [historyIndex, history, handleContentChange]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      if (editorRef.current) {
        editorRef.current.innerHTML = history[newIndex];
        handleContentChange();
      }
    }
  }, [historyIndex, history, handleContentChange]);

  const handleFontSize = (size: string) => {
    handleFormat('fontSize', size);
    setSelectedFontSize(size);
    setShowFontSizeDropdown(false);
  };

  const handleColor = (color: string) => {
    handleFormat('foreColor', color);
    setSelectedColor(color);
    setShowColorPicker(false);
  };

  const handleInsertLink = () => {
    if (linkUrl) {
      handleFormat('createLink', linkUrl);
      setLinkUrl('');
      setIsLinkDialogOpen(false);
    }
  };

  const handleInsertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      handleFormat('insertImage', url);
    }
  };

  const isFormatActive = (format: string): boolean => {
    return document.queryCommandState(format);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          handleFormat('bold');
          break;
        case 'i':
          e.preventDefault();
          handleFormat('italic');
          break;
        case 'u':
          e.preventDefault();
          handleFormat('underline');
          break;
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            handleRedo();
          } else {
            handleUndo();
          }
          break;
        case 'y':
          e.preventDefault();
          handleRedo();
          break;
      }
    }

    // Handle Tab for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      handleFormat(e.shiftKey ? 'outdent' : 'indent');
    }
  };

  const ToolbarButton = ({ 
    icon: Icon, 
    command, 
    isActive = false,
    onClick,
    tooltip
  }: {
    icon: React.ComponentType<any>;
    command?: string;
    isActive?: boolean;
    onClick?: () => void;
    tooltip: string;
  }) => (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick || (() => handleFormat(command!))}
      className={`editor-button group relative ${
        isActive || (command && isFormatActive(command)) 
          ? 'editor-button-active' 
          : ''
      }`}
      title={tooltip}
      type="button"
    >
      <Icon size={18} />
      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
        {tooltip}
      </span>
    </motion.button>
  );

  return (
    <div className={`relative ${className}`}>
      {showToolbar && !readOnly && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="editor-toolbar sticky top-0 z-40"
        >
          {/* Text Formatting */}
          <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-600 pr-2 mr-2">
            <ToolbarButton icon={Bold} command="bold" tooltip="Bold (Ctrl+B)" />
            <ToolbarButton icon={Italic} command="italic" tooltip="Italic (Ctrl+I)" />
            <ToolbarButton icon={Underline} command="underline" tooltip="Underline (Ctrl+U)" />
          </div>

          {/* Alignment */}
          <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-600 pr-2 mr-2">
            <ToolbarButton icon={AlignLeft} command="justifyLeft" tooltip="Align Left" />
            <ToolbarButton icon={AlignCenter} command="justifyCenter" tooltip="Align Center" />
            <ToolbarButton icon={AlignRight} command="justifyRight" tooltip="Align Right" />
          </div>

          {/* Font Size */}
          <div className="relative border-r border-gray-300 dark:border-gray-600 pr-2 mr-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFontSizeDropdown(!showFontSizeDropdown)}
              className="editor-button flex items-center gap-1"
              type="button"
            >
              <Type size={18} />
              <span className="text-xs">{selectedFontSize}</span>
            </motion.button>
            
            <AnimatePresence>
              {showFontSizeDropdown && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute top-full left-0 mt-1 bg-white dark:bg-dark-surface rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
                >
                  <div className="grid grid-cols-2 gap-1 p-2">
                    {fontSizes.map(size => (
                      <button
                        key={size}
                        onClick={() => handleFontSize(size)}
                        className="px-3 py-2 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded text-sm transition-colors"
                        style={{ fontSize: `${size}px` }}
                        type="button"
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Color Picker */}
          <div className="relative border-r border-gray-300 dark:border-gray-600 pr-2 mr-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="editor-button"
              type="button"
            >
              <Palette size={18} />
              <div 
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-1 rounded"
                style={{ backgroundColor: selectedColor }}
              />
            </motion.button>
            
            <AnimatePresence>
              {showColorPicker && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute top-full left-0 mt-1 bg-white dark:bg-dark-surface rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 z-50"
                >
                  <div className="grid grid-cols-5 gap-2">
                    {colors.map(color => (
                      <button
                        key={color}
                        onClick={() => handleColor(color)}
                        className="w-8 h-8 rounded-lg border-2 border-gray-300 hover:border-primary-500 transition-colors"
                        style={{ backgroundColor: color }}
                        type="button"
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Lists and Quotes */}
          <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-600 pr-2 mr-2">
            <ToolbarButton icon={List} command="insertUnorderedList" tooltip="Bullet List" />
            <ToolbarButton icon={ListOrdered} command="insertOrderedList" tooltip="Numbered List" />
            <ToolbarButton icon={Quote} command="formatBlock" tooltip="Quote" />
            <ToolbarButton icon={Code} command="formatBlock" tooltip="Code Block" />
          </div>

          {/* Insert Elements */}
          <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-600 pr-2 mr-2">
            <ToolbarButton 
              icon={Link} 
              onClick={() => setIsLinkDialogOpen(true)} 
              tooltip="Insert Link" 
            />
            <ToolbarButton 
              icon={Image} 
              onClick={handleInsertImage} 
              tooltip="Insert Image" 
            />
          </div>

          {/* History */}
          <div className="flex items-center gap-1">
            <ToolbarButton 
              icon={Undo} 
              onClick={handleUndo}
              isActive={historyIndex === 0}
              tooltip="Undo (Ctrl+Z)" 
            />
            <ToolbarButton 
              icon={Redo} 
              onClick={handleRedo}
              isActive={historyIndex === history.length - 1}
              tooltip="Redo (Ctrl+Y)" 
            />
          </div>
        </motion.div>
      )}

      {/* Editor Content Area */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="relative"
      >
        <div
          ref={editorRef}
          contentEditable={!readOnly}
          className={`
            min-h-[400px] p-6 outline-none
            bg-white dark:bg-dark-surface
            text-gray-900 dark:text-gray-100
            prose prose-lg dark:prose-invert max-w-none
            focus:ring-2 focus:ring-primary-400/50 focus:border-primary-400
            transition-all duration-200
            ${readOnly ? 'cursor-default' : 'cursor-text'}
            custom-scrollbar
          `}
          onInput={handleContentChange}
          onKeyDown={handleKeyDown}
          suppressContentEditableWarning
          style={{ 
            minHeight: '400px',
            wordBreak: 'break-word',
            overflowWrap: 'break-word'
          }}
        />
        
        {/* Placeholder */}
        {!content && !readOnly && (
          <div className="absolute top-6 left-6 text-gray-400 pointer-events-none">
            {placeholder}
          </div>
        )}
      </motion.div>

      {/* Link Dialog */}
      <AnimatePresence>
        {isLinkDialogOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setIsLinkDialogOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white dark:bg-dark-surface rounded-xl p-6 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">Insert Link</h3>
              <input
                type="url"
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
                onKeyDown={e => e.key === 'Enter' && handleInsertLink()}
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setIsLinkDialogOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInsertLink}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  Insert
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RichTextEditor;
