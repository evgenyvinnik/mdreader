/**
 * Critical smoke tests - must pass for deployment
 * These tests cover the essential functionality and should complete quickly.
 * Run with: npm run test:critical
 */
import { test, expect, MDReaderPage } from './helpers/fixtures';

test.describe('Critical Smoke Tests @critical', () => {
  let mdreader: MDReaderPage;

  test.beforeEach(async ({ page }) => {
    mdreader = new MDReaderPage(page);
  });

  test('app loads successfully', async ({ page }) => {
    await mdreader.goto();
    await expect(mdreader.appTitle).toBeVisible();
    await expect(mdreader.monacoEditor).toBeVisible();
  });

  test('editor accepts input', async ({ page }) => {
    await mdreader.goto();
    // Ensure preview pane is visible
    await expect(mdreader.previewPane).toBeVisible();
    
    await mdreader.setEditorContent('# Test Heading\n\nTest paragraph.');
    await page.waitForTimeout(500);
    await expect(mdreader.previewContent).toContainText('Test Heading');
  });

  test('preview renders markdown', async ({ page }) => {
    await mdreader.goto();
    await expect(mdreader.previewPane).toBeVisible();
    
    await mdreader.setEditorContent('**bold** and *italic*');
    await page.waitForTimeout(500);
    await expect(page.locator('.markdown-body strong')).toBeVisible();
    await expect(page.locator('.markdown-body em')).toBeVisible();
  });

  test('view modes work', async ({ page }) => {
    await mdreader.goto();
    
    // Editor only
    await mdreader.setViewMode('editor');
    await page.waitForTimeout(200);
    await expect(mdreader.editorPane).toBeVisible();
    await expect(mdreader.previewPane).toBeHidden();
    
    // Preview only
    await mdreader.setViewMode('preview');
    await page.waitForTimeout(200);
    await expect(mdreader.editorPane).toBeHidden();
    await expect(mdreader.previewPane).toBeVisible();
    
    // Split view
    await mdreader.setViewMode('both');
    await page.waitForTimeout(200);
    await expect(mdreader.editorPane).toBeVisible();
    await expect(mdreader.previewPane).toBeVisible();
  });

  test('theme toggle works', async ({ page }) => {
    await mdreader.goto();
    const initialTheme = await mdreader.getTheme();
    await mdreader.toggleTheme();
    await page.waitForTimeout(200);
    const newTheme = await mdreader.getTheme();
    expect(newTheme).not.toBe(initialTheme);
  });

  test('new document works', async ({ page }) => {
    await mdreader.goto();
    await expect(mdreader.previewPane).toBeVisible();
    
    await mdreader.setEditorContent('Initial content for test');
    await page.waitForTimeout(500);
    await expect(mdreader.previewContent).toContainText('Initial content');
    
    await mdreader.createNewDocument();
    await page.waitForTimeout(500);
    
    const content = await mdreader.getPreviewText();
    expect(content).not.toContain('Initial content for test');
  });

  test('toolbar buttons visible', async ({ page }) => {
    await mdreader.goto();
    await expect(mdreader.newButton).toBeVisible();
    await expect(mdreader.openButton).toBeVisible();
    await expect(mdreader.saveButton).toBeVisible();
    await expect(mdreader.lockButton).toBeVisible();
    await expect(mdreader.themeButton).toBeVisible();
  });

  test('code blocks render with syntax highlighting', async ({ page }) => {
    await mdreader.goto();
    await expect(mdreader.previewPane).toBeVisible();
    
    await mdreader.setEditorContent('```javascript\nconst x = 1;\n```');
    
    const codeBlock = page.locator('.markdown-body pre code');
    await expect(codeBlock).toBeVisible({ timeout: 15000 });
  });

  test('links render correctly', async ({ page }) => {
    await mdreader.goto();
    await expect(mdreader.previewPane).toBeVisible();
    
    await mdreader.setEditorContent('[Example](https://example.com)');
    
    const link = page.locator('.markdown-body a').filter({ hasText: 'Example' });
    await expect(link).toBeVisible({ timeout: 15000 });
    await expect(link).toHaveAttribute('href', 'https://example.com');
  });

  test('lists render correctly', async ({ page }) => {
    await mdreader.goto();
    await expect(mdreader.previewPane).toBeVisible();
    
    await mdreader.setEditorContent('- Item 1\n- Item 2\n\n1. First\n2. Second');
    
    await expect(page.locator('.markdown-body ul')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.markdown-body ol')).toBeVisible({ timeout: 15000 });
  });
});
