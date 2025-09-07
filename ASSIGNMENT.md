# Notes Application Assignment

## Task

Your task is to create a hosted, user-friendly notes application with rich text editing, AI-powered enhancements, and secure note management.

## Core Functionalities (Mandatory Requirements)

### Custom Rich Text Editor
- Implement a basic rich text editor from scratch (do NOT use pre-made libraries like TinyMCE or Quill)
- Implement basic formatting: bold, italic, underline, alignment (left, center, right), font size changes.
- A toolbar with formatting buttons is required.

### Note Management
- Create, edit, delete, and list notes.
- Allow users to "pin" important notes to the top of their notes list. Include a visual indicator (e.g., a pin icon) to distinguish pinned notes from regular notes.
- Search notes by title or content.

### Basic User Interface with Data Persistence
- Create a clean and straightforward UI that is easy to navigate.
- Include essential elements like a toolbar for text formatting, a notes list panel, and a main editing area.
- Store notes and preferences between sessions using browser local storage or a lightweight database (e.g., IndexedDB).

### Auto Glossary Highlighting (AI Feature)
- Auto Glossary Highlighting – Identify key terms in a note and highlight them; hovering should show a definition, display a popup with an explanation of the term.
- AI Summarization – Summarize the note in 1–2 lines.
- AI Tag Suggestions – Suggest 3–5 tags for the note based on its content.
- Grammar Check: Incorporate a basic grammar checking feature that underlines grammatical errors in the text.
- AI can be implemented via any third-party API or local model (OpenAI, Groq, HuggingFace, etc.).

### Note Encryption
- Allow users to password-protect individual notes.
- Encrypted notes should require the password for viewing

### Hosting (Mandatory)
- Application must be hosted (Netlify, Vercel, GitHub Pages, or equivalent).
- Hosted link must be submitted along with ZIP of source code.

## Bonus Functionalities (Optional)

- **Responsive Design**: Ensure the application adapts to different screen sizes (desktop, tablet, smartphone). Implement touch support and optimized layouts for smaller screens.
- **AI-Driven Insights**: (AI Feature): Develop an AI-driven insights feature that provides intelligent recommendations based on the content of the notes. Implement a natural language processing (NLP) model to analyze note content and generate summaries or highlight key points automatically.
- **Multi-language AI Translation** – Translate a note to a user-selected language. Add multiple language options for users to choose from.
- **Version History** – Maintain previous versions of notes with the ability to restore.

## Technical Requirements and Guidelines

- Choose any presentational framework (Angular, React, or Vanilla JS)
- Do NOT use ready-made libraries for the rich text editor (like tinyMCE, quill, etc). You may use other external libraries that are not rich text editors
- You can use any AI tool to integrate AI features. (Suggested AI Tool: Groq), submission without AI integration will automatically be rejected
- Do not include node_modules or auto-generated build folders in ZIP

## Things We Are Interested In

- Completeness of basic functionalities along with handling of all possible edge cases
- Functionality of AI integration.
- Code quality, modularity, and reusability.
- UI/UX design clarity with attention to detail.
- Hosting correctness (must work without local setup).

## How to Submit

Upload your submissions in the Ashby portal that you received in your email.

Please include:
- Zip of your code
- Hosted URL [Netlify, Heroku, etc..]
- Screen recording of your working application (Optional) [You can use Loom to create one and send us the link]

For any clarifications contact: hiring.support@playpowerlabs.com

## Important

We condemn plagiarism. Please maintain the dignity and originality of your work. If we suspect any attempt towards copying, we will disqualify your submission.

Also, don't put your code on GitHub.

Please DO NOT submit node_modules or other auto generated packages.

---

**Remember**: While bonus features are impressive, prioritize completing the core features with high-quality, well-structured code. Demonstrate your understanding of modern web development practices and your ability to create efficient, user-friendly applications with AI integration. We thoroughly review each submission, examining both the overall functionality and the nuances of your code. Show us your best work!