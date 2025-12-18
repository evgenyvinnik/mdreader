import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  base: '/mdreader/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'mdreader',
        short_name: 'mdreader',
        description:
          'An app for editing and previewing Markdown',
        theme_color: '#1a1a1a',
        background_color: '#1e1e1e',
        display: 'standalone',
        scope: '/mdreader/',
        start_url: '/mdreader/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
        file_handlers: [
          {
            action: '/mdreader/',
            accept: {
              'text/markdown': ['.md', '.markdown', '.mdown', '.mkd'],
            },
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024, // 8 MB to handle Monaco Editor
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
      },
    }),
  ],
});
