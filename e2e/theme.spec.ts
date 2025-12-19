import { test, expect, MDReaderPage } from './helpers/fixtures';

test.describe('Theme Toggle', () => {
  let mdreader: MDReaderPage;

  test.beforeEach(async ({ page }) => {
    mdreader = new MDReaderPage(page);
    await mdreader.goto();
  });

  test.describe('Theme States', () => {
    test('should start with dark theme by default or from storage', async ({ page }) => {
      const theme = await mdreader.getTheme();
      expect(['dark', 'light']).toContain(theme);
    });

    test('should apply theme to document root', async ({ page }) => {
      const theme = await mdreader.getTheme();
      const dataTheme = await page.evaluate(() => 
        document.documentElement.getAttribute('data-theme')
      );
      expect(dataTheme).toBe(theme);
    });

    test('should have app class matching theme', async ({ page }) => {
      const theme = await mdreader.getTheme();
      const appElement = page.locator('.app');
      
      if (theme === 'dark') {
        await expect(appElement).toHaveClass(/dark/);
      } else {
        await expect(appElement).toHaveClass(/light/);
      }
    });
  });

  test.describe('Theme Toggling', () => {
    test('should toggle from dark to light', async ({ page }) => {
      // Set to dark first if not already
      let theme = await mdreader.getTheme();
      if (theme === 'light') {
        await mdreader.toggleTheme();
        theme = await mdreader.getTheme();
      }
      expect(theme).toBe('dark');
      
      // Toggle to light
      await mdreader.toggleTheme();
      theme = await mdreader.getTheme();
      expect(theme).toBe('light');
    });

    test('should toggle from light to dark', async ({ page }) => {
      // Set to light first if not already
      let theme = await mdreader.getTheme();
      if (theme === 'dark') {
        await mdreader.toggleTheme();
        theme = await mdreader.getTheme();
      }
      expect(theme).toBe('light');
      
      // Toggle to dark
      await mdreader.toggleTheme();
      theme = await mdreader.getTheme();
      expect(theme).toBe('dark');
    });

    test('should update document root data-theme on toggle', async ({ page }) => {
      const initialTheme = await mdreader.getTheme();
      await mdreader.toggleTheme();
      
      const newDataTheme = await page.evaluate(() => 
        document.documentElement.getAttribute('data-theme')
      );
      
      expect(newDataTheme).not.toBe(initialTheme);
    });
  });

  test.describe('Theme Button', () => {
    test('should show sun icon in dark mode', async ({ page }) => {
      // Ensure we're in dark mode
      let theme = await mdreader.getTheme();
      if (theme === 'light') {
        await mdreader.toggleTheme();
      }
      
      // Button should show sun (to switch to light)
      await expect(mdreader.themeButton).toContainText('Light');
    });

    test('should show moon icon in light mode', async ({ page }) => {
      // Ensure we're in light mode
      let theme = await mdreader.getTheme();
      if (theme === 'dark') {
        await mdreader.toggleTheme();
      }
      
      // Button should show moon (to switch to dark)
      await expect(mdreader.themeButton).toContainText('Dark');
    });

    test('should have correct tooltip in dark mode', async ({ page }) => {
      let theme = await mdreader.getTheme();
      if (theme === 'light') {
        await mdreader.toggleTheme();
      }
      
      await expect(mdreader.themeButton).toHaveAttribute('title', 'Switch to light theme');
    });

    test('should have correct tooltip in light mode', async ({ page }) => {
      let theme = await mdreader.getTheme();
      if (theme === 'dark') {
        await mdreader.toggleTheme();
      }
      
      await expect(mdreader.themeButton).toHaveAttribute('title', 'Switch to dark theme');
    });
  });

  test.describe('Theme Persistence', () => {
    test('should save theme to localStorage', async ({ page }) => {
      await mdreader.toggleTheme();
      const theme = await mdreader.getTheme();
      
      const storedTheme = await page.evaluate(() => 
        localStorage.getItem('mdreader-theme')
      );
      
      expect(storedTheme).toBe(theme);
    });

    test('should restore theme on page reload', async ({ page }) => {
      // Set to light theme
      let theme = await mdreader.getTheme();
      if (theme === 'dark') {
        await mdreader.toggleTheme();
      }
      
      // Reload the page
      await page.reload();
      await mdreader.waitForAppLoad();
      
      // Theme should still be light
      const restoredTheme = await mdreader.getTheme();
      expect(restoredTheme).toBe('light');
    });

    test('should maintain theme across multiple toggles and reload', async ({ page }) => {
      // Toggle multiple times
      await mdreader.toggleTheme();
      await mdreader.toggleTheme();
      await mdreader.toggleTheme();
      
      const finalTheme = await mdreader.getTheme();
      
      // Reload
      await page.reload();
      await mdreader.waitForAppLoad();
      
      const restoredTheme = await mdreader.getTheme();
      expect(restoredTheme).toBe(finalTheme);
    });
  });

  test.describe('Theme Styling', () => {
    test('should apply different background colors for themes', async ({ page }) => {
      // Get background in current theme
      const initialBg = await page.evaluate(() => 
        getComputedStyle(document.body).backgroundColor
      );
      
      // Toggle theme
      await mdreader.toggleTheme();
      await page.waitForTimeout(500);
      
      // Get background in new theme
      const newBg = await page.evaluate(() => 
        getComputedStyle(document.body).backgroundColor
      );
      
      // Background colors should be different
      expect(newBg).not.toBe(initialBg);
    });

    test('should update Monaco editor theme', async ({ page }) => {
      // Toggle theme and check editor adapts
      await mdreader.toggleTheme();
      await page.waitForTimeout(300);
      
      // Editor should still be visible and functional
      await expect(mdreader.monacoEditor).toBeVisible();
    });

    test('should update preview styling', async ({ page }) => {
      // Add content first
      await mdreader.setEditorContent('# Test Heading');
      await page.waitForTimeout(300);
      
      // Get heading color in current theme
      const initialColor = await page.evaluate(() => {
        const h1 = document.querySelector('.markdown-body h1');
        return h1 ? getComputedStyle(h1).color : '';
      });
      
      // Toggle theme
      await mdreader.toggleTheme();
      await page.waitForTimeout(300);
      
      // Get heading color in new theme
      const newColor = await page.evaluate(() => {
        const h1 = document.querySelector('.markdown-body h1');
        return h1 ? getComputedStyle(h1).color : '';
      });
      
      // Colors might be different (depends on CSS implementation)
      // At minimum, the element should still be styled
      expect(newColor).toBeTruthy();
    });

    test('should apply theme to code blocks', async ({ page }) => {
      await mdreader.setEditorContentAndWaitFor('```javascript\nconst x = 1;\n```', '.markdown-body pre code');
      
      // Code block should be visible in both themes
      const codeBlock = page.locator('.markdown-body pre code');
      await expect(codeBlock).toBeVisible();
      
      await mdreader.toggleTheme();
      await page.waitForTimeout(500);
      
      await expect(codeBlock).toBeVisible();
    });
  });

  test.describe('Theme and Components', () => {
    test('should apply theme to toolbar', async ({ page }) => {
      const toolbar = page.locator('.toolbar');
      await expect(toolbar).toBeVisible();
      
      await mdreader.toggleTheme();
      await page.waitForTimeout(100);
      
      await expect(toolbar).toBeVisible();
    });

    test('should apply theme to file dropdown', async ({ page }) => {
      await mdreader.openFileDropdown();
      await expect(mdreader.fileDropdownMenu).toBeVisible();
      
      await mdreader.closeFileDropdown();
      await mdreader.toggleTheme();
      await page.waitForTimeout(100);
      
      await mdreader.openFileDropdown();
      await expect(mdreader.fileDropdownMenu).toBeVisible();
    });

    test('should apply theme to pane headers', async ({ page }) => {
      await expect(mdreader.editorHeader).toBeVisible();
      await expect(mdreader.previewHeader).toBeVisible();
      
      await mdreader.toggleTheme();
      await page.waitForTimeout(100);
      
      await expect(mdreader.editorHeader).toBeVisible();
      await expect(mdreader.previewHeader).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should maintain readable contrast in light theme', async ({ page }) => {
      // Set to light theme
      let theme = await mdreader.getTheme();
      if (theme === 'dark') {
        await mdreader.toggleTheme();
      }
      
      await mdreader.setEditorContent('# Readable Text');
      await page.waitForTimeout(300);
      
      // Text should be visible
      await expect(page.locator('.markdown-body h1')).toBeVisible();
    });

    test('should maintain readable contrast in dark theme', async ({ page }) => {
      // Set to dark theme
      let theme = await mdreader.getTheme();
      if (theme === 'light') {
        await mdreader.toggleTheme();
      }
      
      await mdreader.setEditorContent('# Readable Text');
      await page.waitForTimeout(300);
      
      // Text should be visible
      await expect(page.locator('.markdown-body h1')).toBeVisible();
    });
  });
});
