import { test, expect, MDReaderPage } from './helpers/fixtures';
import type { Page } from '@playwright/test';

interface LaunchFile {
  readonly name: string;
  readonly content: string;
}

/**
 * Simulates the OS opening files with the installed PWA ("Open with MD Reader",
 * double-clicking a .md file) by replacing window.launchQueue before the app boots.
 * The files are handed to the consumer as soon as it is registered, which is
 * what Chrome does for a cold launch.
 */
async function installFakeLaunchQueue(
  page: Page,
  files: readonly LaunchFile[]
): Promise<void> {
  await page.addInitScript((launchFiles) => {
    Object.defineProperty(window, 'launchQueue', {
      configurable: true,
      value: {
        setConsumer(consumer: (params: unknown) => void): void {
          consumer({
            files: launchFiles.map(({ name, content }) => {
              const file = new File([content], name, { type: 'text/markdown' });
              return {
                kind: 'file',
                name,
                getFile: () => Promise.resolve(file),
              };
            }),
          });
        },
      },
    });
  }, files);
}

test.describe('Opening files from the OS (PWA file handler)', () => {
  let mdreader: MDReaderPage;

  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(
      !testInfo.project.name.toLowerCase().includes('chrom'),
      'File Handling API is Chromium-only'
    );
    mdreader = new MDReaderPage(page);

    // Leave a previously edited document behind, like a real returning user
    await mdreader.goto();
    await mdreader.setEditorContent('# Previous Document\n\nOld content.');
    await page.waitForTimeout(800);
  });

  test('shows the launched file instead of the last document', async ({
    page,
  }) => {
    await installFakeLaunchQueue(page, [
      { name: 'launched-notes.md', content: '# Launched File\n\nFrom Finder.' },
    ]);
    await page.reload();
    await mdreader.waitForAppLoad();

    await expect(mdreader.previewContent).toContainText('Launched File');
    // The startup restore must not overwrite it once IndexedDB answers
    await page.waitForTimeout(1000);
    await expect(mdreader.previewContent).toContainText('Launched File');
    await expect(mdreader.previewContent).not.toContainText(
      'Previous Document'
    );
    expect(await mdreader.getCurrentDocumentTitle()).toContain(
      'launched-notes'
    );
  });

  test('saves every launched file and keeps it after reload', async ({
    page,
  }) => {
    await installFakeLaunchQueue(page, [
      { name: 'first.md', content: '# First Launched' },
      { name: 'second.markdown', content: '# Second Launched' },
    ]);
    await page.reload();
    await mdreader.waitForAppLoad();
    await expect(mdreader.previewContent).toContainText('Second Launched');
    await page.waitForTimeout(800);

    await mdreader.openFileDropdown();
    const titles = await page
      .locator('.file-dropdown-item-title')
      .allTextContents();
    expect(titles).toEqual(expect.arrayContaining(['first', 'second']));
    await mdreader.closeFileDropdown();

    // A plain reload (no launch) reopens the last launched file
    await page.addInitScript(() => {
      Object.defineProperty(window, 'launchQueue', {
        configurable: true,
        value: { setConsumer: (): void => undefined },
      });
    });
    await page.reload();
    await mdreader.waitForAppLoad();
    await expect(mdreader.previewContent).toContainText('Second Launched');
  });
});
