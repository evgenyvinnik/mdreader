import { test as base } from '@playwright/test';
import { MDReaderPage } from './mdreader-page';

/**
 * Extended test fixture that provides MDReaderPage instance
 */
export const test = base.extend<{ mdreader: MDReaderPage }>({
  mdreader: async ({ page }, use) => {
    const mdreader = new MDReaderPage(page);
    await use(mdreader);
  },
});

export { expect } from '@playwright/test';
export { MDReaderPage, TestContent } from './mdreader-page';
