export type Theme = 'light' | 'dark';
export type ViewMode = 'editor' | 'preview' | 'both';

const THEME_KEY = 'mdreader-theme';
const SCROLL_LOCK_KEY = 'mdreader-scroll-lock';
const VIEW_MODE_KEY = 'mdreader-view-mode';

// Detect mobile devices using user agent and touch capability
export function isMobileDevice(): boolean {
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i.test(navigator.userAgent)
    || (window.innerWidth <= 768 && 'ontouchstart' in window);
}

export function getInitialTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  // Check system preference
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export function getInitialViewMode(): ViewMode {
  const stored = localStorage.getItem(VIEW_MODE_KEY);
  if (stored === 'editor' || stored === 'preview' || stored === 'both') return stored;
  // Default to preview on mobile devices, both on desktop
  if (isMobileDevice()) return 'preview';
  return 'both';
}

export function getInitialScrollLock(): boolean {
  const stored = localStorage.getItem(SCROLL_LOCK_KEY);
  if (stored === 'false') return false;
  return true; // Default to locked
}

export { THEME_KEY, SCROLL_LOCK_KEY, VIEW_MODE_KEY };
