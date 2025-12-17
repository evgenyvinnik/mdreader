# MD Reader

A Progressive Web App (PWA) for editing and previewing Markdown in your browser.

![MD Reader Light Theme](https://github.com/user-attachments/assets/150bb96b-6a8c-4833-a6ca-c262d8358b21)

## Features

- **Monaco Editor** - VS Code's editor for Markdown authoring with syntax highlighting
- **Live Preview** - Real-time Markdown rendering as you type
- **GitHub Flavored Markdown** - Tables, task lists, code fences, and more
- **Emoji Support** - :smile: emoji shortcodes
- **Dark/Light Themes** - Toggle between themes
- **Offline Support** - Works without internet as a PWA
- **Auto-save** - Documents automatically save to IndexedDB
- **Installable** - Can be installed as a standalone app

## Tech Stack

- **React** + **TypeScript**
- **Vite** (with Rolldown)
- **Monaco Editor** - Code editing
- **markdown-it** - Markdown parsing
- **DOMPurify** - HTML sanitization
- **IndexedDB** - Local storage
- **Workbox** - Service worker for offline support

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

## Deployment

The app is configured for GitHub Pages deployment with the base path `/mdreader/`.

## Security

- HTML sanitization with DOMPurify
- Raw HTML disabled in Markdown by default
- No remote script execution

## License

MIT
