# 🎨 Beautiful Notes App

A stunning, feature-rich notes application with AI-powered enhancements, custom rich text editor, and secure note management.

## ✨ Features

### Core Features (All Implemented ✅)

#### 📝 Custom Rich Text Editor
- Built from scratch without pre-made libraries
- **Formatting options:**
  - Bold, Italic, Underline
  - Text alignment (left, center, right)
  - Font size variations (12px to 48px)
  - Text colors (20 color palette)
  - Lists (ordered and unordered)
  - Quotes and code blocks
  - Links and images
- Undo/Redo functionality
- Keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+U, etc.)
- Beautiful formatting toolbar with tooltips

#### 📋 Note Management
- Create, edit, delete, and list notes
- Pin important notes to the top with visual indicators
- Real-time auto-save with debouncing
- Search notes by title, content, or tags
- Export/Import notes as JSON backups
- Word and character count statistics

#### 💾 Data Persistence
- IndexedDB for storing notes locally
- User preferences storage
- Works offline - no server required
- Automatic data recovery

#### 🤖 AI Features (Powered by Groq)
- **AI Summarization**: Generate 1-2 line summaries
- **Smart Tag Suggestions**: AI suggests 3-5 relevant tags
- **Glossary Terms**: Identifies and defines key terms
- **Grammar Check**: Detects spelling and grammar errors with suggestions
- All AI features are optional and require a Groq API key

#### 🔐 Note Encryption
- Password-protect individual notes
- AES encryption with PBKDF2 key derivation
- Session password storage for convenience
- Visual indicators for encrypted notes

### 🎁 Bonus Features

#### 📱 Responsive Design
- Fully responsive layout
- Works on desktop, tablet, and mobile
- Touch-optimized interactions
- Adaptive grid/list views

#### 🌙 Dark Mode
- Beautiful dark theme
- System preference detection
- Smooth theme transitions
- Persistent theme preference

#### 🎨 Stunning UI/UX
- Glassmorphism effects
- Smooth animations with Framer Motion
- Gradient backgrounds and text
- Floating animations
- Shimmer effects on hover
- Custom scrollbars
- Beautiful loading states

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

The app will open at `http://localhost:3000`

### Production Build

```bash
npm run build
```

## 🔑 API Configuration

To enable AI features, you need a Groq API key:

1. Get your API key from [Groq Console](https://console.groq.com)
2. Click the key icon (🔑) in the app header
3. Enter your API key and save
4. AI features will be automatically enabled

## 🛠 Technology Stack

- **Frontend Framework**: React with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Rich Text Editor**: Custom implementation (no external libraries)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Database**: IndexedDB with Dexie
- **Encryption**: CryptoJS
- **AI Integration**: Groq SDK
- **Routing**: React Router DOM
- **Build Tool**: Create React App with Craco

## 📦 Deployment

### Deploy to Netlify

1. Build the project:
```bash
npm run build
```

2. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

3. Deploy:
```bash
netlify deploy --prod --dir=build
```

Or simply drag and drop the `build` folder to [Netlify Drop](https://app.netlify.com/drop)

### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel --prod
```

## 🎯 Features Breakdown

### Rich Text Editor
- Custom ContentEditable implementation
- Real-time formatting preview
- History management for undo/redo
- Keyboard shortcuts support
- Image and link insertion
- Color picker with 20 colors
- Font size selector (10 sizes)

### Note Organization
- Pin/Unpin notes
- Tag system with auto-suggestions
- Advanced search with filters
- Grid and list view modes
- Sort by date, title, or relevance

### Security Features
- Client-side encryption
- PBKDF2 key derivation (10,000 iterations)
- AES-256 encryption
- No data leaves your device (except for AI features)

### AI Capabilities
- Summarization in 1-2 lines
- Intelligent tag generation
- Technical term glossary
- Grammar and spelling check
- All processing via Groq's Mixtral model

## 🎨 Design Features

- **Glassmorphism**: Frosted glass effects throughout
- **Gradients**: Beautiful color transitions
- **Animations**: Smooth transitions and micro-interactions
- **Dark Mode**: Eye-friendly dark theme
- **Responsive**: Adapts to all screen sizes
- **Accessibility**: WCAG compliant with semantic HTML

## 📱 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🔒 Privacy

- All notes are stored locally in your browser
- No server or cloud storage (except optional AI features)
- Encryption happens client-side
- Export your data anytime

---

Built with ❤️ and attention to detail
