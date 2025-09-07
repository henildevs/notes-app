# Notes Application

AI-powered notes application built for PlayPower Labs assignment.

## Live Demo
🔗 **[https://quiz-app-backend-bj8s.onrender.com/](https://quiz-app-backend-bj8s.onrender.com/)**

## Tech Stack
- React + TypeScript
- Tailwind CSS
- IndexedDB (Dexie)
- Groq AI API
- Framer Motion
- CryptoJS (encryption)

## Quick Start

```bash
npm install
npm start
```
App runs on http://localhost:3000

### Production Build
```bash
npm run build
```

## Features

### Core Features
- **Custom Rich Text Editor** - Built from scratch with formatting toolbar
- **Note Management** - Create, edit, delete, pin, search notes
- **Data Persistence** - Local storage with IndexedDB
- **AI Features** - Summarization, tag suggestions, glossary terms, grammar check
- **Note Encryption** - Password protection with AES encryption

### Bonus Features
- Fully responsive design (desktop, tablet, mobile)
- Dark/light theme with system preference detection
- Export/import notes as JSON
- Real-time auto-save
- Advanced search and filtering
- Masonry Grid Layout

## AI Configuration

To enable AI features:
1. Get Groq API key from [console.groq.com](https://console.groq.com)
2. Click the key icon in app header
3. Enter API key and save

## Rich Text Editor
- Bold, italic, underline formatting
- Text alignment (left, center, right)
- Font sizes and colors
- Lists, quotes, code blocks
- Link and image insertion
- Undo/redo with keyboard shortcuts

## Security
- Client-side AES encryption
- PBKDF2 key derivation
- Password-protected notes
- Local data storage only

## Author
Henil Patel

---
Built for PlayPower Labs
