# MD Reader

A Progressive Web App (PWA) for editing and previewing Markdown in your browser.

![MD Reader Light Theme](https://github.com/user-attachments/assets/150bb96b-6a8c-4833-a6ca-c262d8358b21)

## Features

### Editor
- **Monaco Editor** - VS Code's powerful editor with full Markdown syntax highlighting
- **Line Numbers** - Easy navigation through your document
- **Word Wrap** - Automatic line wrapping for better readability
- **Code Folding** - Collapse sections for easier navigation

### Preview
- **Live Preview** - Real-time Markdown rendering as you type
- **GitHub Flavored Markdown** - Full support for tables, task lists, code fences, and more
- **Syntax Highlighting** - Code blocks with language-specific highlighting via highlight.js
- **Emoji Support** - :smile: emoji shortcodes rendered as emojis
- **Anchor Links** - Auto-generated clickable header anchors

### UI Functionality

#### Toolbar Controls
| Button | Description |
|--------|-------------|
| **New** | Create a new blank document |
| **Open** | Open a `.md` file from your device |
| **Save** | Download your document as a `.md` file (with timestamp) |
| **Locked/Unlocked** | Toggle synchronized scrolling between editor and preview |
| **View Toggle** | Switch between Editor only, Split view, or Preview only |
| **Light/Dark** | Toggle between light and dark themes |

#### Document Management
- **Document Dropdown** - Quick access to all saved documents with search filtering
- **Document Search** - Filter documents by title in the dropdown
- **Delete Documents** - Remove documents from local storage
- **Auto-generated Titles** - Document titles created from first 5 words of content

#### View Modes
- **Editor Only** - Focus on writing with full-width editor
- **Split View** - Side-by-side editor and preview (default)
- **Preview Only** - Read mode with full-width rendered Markdown

#### Scroll Synchronization
- **Locked Mode** - Editor and preview scroll together proportionally
- **Unlocked Mode** - Independent scrolling for each pane

### Storage & Persistence
- **Auto-save** - Documents automatically save to IndexedDB as you type
- **Last Document Memory** - Reopens your last edited document on launch
- **LocalStorage Fallback** - Falls back to localStorage if IndexedDB unavailable
- **Preference Persistence** - Theme, view mode, and scroll lock settings remembered

### PWA Capabilities
- **Offline Support** - Works without internet connection
- **Installable** - Can be installed as a standalone app on desktop/mobile
- **Service Worker** - Caches assets for instant loading

## Tech Stack

- **React 19** + **TypeScript** (strict mode)
- **Vite** with Rolldown bundler
- **Monaco Editor** - VS Code's editor component
- **markdown-it** - Flexible Markdown parser with plugins:
  - `markdown-it-anchor` - Header anchor links
  - `markdown-it-task-lists` - GitHub-style task lists
  - `markdown-it-emoji` - Emoji shortcode support
- **highlight.js** - Syntax highlighting for code blocks
- **DOMPurify** - HTML sanitization for security
- **IndexedDB** (via idb) - Persistent local storage
- **Workbox** - Service worker for PWA offline support

## Getting Started

### Install dependencies

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

### Linting

```bash
npm run lint
```

## Deployment

The app is configured for GitHub Pages deployment with the base path `/mdreader/`.

## Security

- HTML sanitization with DOMPurify
- Raw HTML disabled in Markdown by default
- No remote script execution
- Content Security Policy ready

## License

MIT
