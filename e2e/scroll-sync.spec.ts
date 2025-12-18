import { test, expect, MDReaderPage, TestContent } from './helpers/fixtures';

test.describe('Scroll Synchronization', () => {
  let mdreader: MDReaderPage;

  test.beforeEach(async ({ page }) => {
    mdreader = new MDReaderPage(page);
    await mdreader.goto();
    
    // Ensure we're in split view for scroll sync tests
    await mdreader.setViewMode('both');
    
    // Add long content for scrolling tests
    await mdreader.setEditorContent(TestContent.longContent);
    await page.waitForTimeout(500);
  });

  test.describe('Locked Mode (Default)', () => {
    test('should have scroll locked by default', async () => {
      const isLocked = await mdreader.isScrollLocked();
      expect(isLocked).toBe(true);
    });

    test('should sync preview when editor scrolls', async ({ page }) => {
      const initialPreviewScroll = await mdreader.getPreviewScrollTop();
      
      // Scroll the editor
      await mdreader.scrollEditor(500);
      await page.waitForTimeout(200);
      
      const newPreviewScroll = await mdreader.getPreviewScrollTop();
      expect(newPreviewScroll).toBeGreaterThan(initialPreviewScroll);
    });

    test('should sync editor when preview scrolls', async ({ page }) => {
      const initialEditorScroll = await mdreader.getEditorScrollTop();
      
      // Scroll the preview
      await mdreader.scrollPreview(500);
      await page.waitForTimeout(200);
      
      const newEditorScroll = await mdreader.getEditorScrollTop();
      expect(newEditorScroll).toBeGreaterThan(initialEditorScroll);
    });

    test('should maintain proportional scroll position', async ({ page }) => {
      // Scroll editor to roughly 50%
      await page.evaluate(() => {
        const editor = (window as unknown as { 
          monaco?: { 
            editor: { 
              getEditors: () => Array<{ 
                getScrollTop: () => number;
                getScrollHeight: () => number;
                getLayoutInfo: () => { height: number };
                setScrollTop: (top: number) => void;
              }> 
            } 
          } 
        }).monaco?.editor.getEditors()[0];
        
        if (editor) {
          const maxScroll = editor.getScrollHeight() - editor.getLayoutInfo().height;
          editor.setScrollTop(maxScroll * 0.5);
        }
      });
      
      await page.waitForTimeout(300);
      
      // Preview should be at roughly the same percentage
      const previewScrollInfo = await page.evaluate(() => {
        const preview = document.querySelector('.markdown-preview');
        if (!preview) return { percentage: 0 };
        
        const maxScroll = preview.scrollHeight - preview.clientHeight;
        return {
          percentage: maxScroll > 0 ? preview.scrollTop / maxScroll : 0
        };
      });
      
      // Should be roughly at 50% (allow some tolerance)
      expect(previewScrollInfo.percentage).toBeGreaterThan(0.3);
      expect(previewScrollInfo.percentage).toBeLessThan(0.7);
    });
  });

  test.describe('Unlocked Mode', () => {
    test.beforeEach(async ({ page }) => {
      // Unlock scroll
      await mdreader.toggleScrollLock();
      await page.waitForTimeout(100);
    });

    test('should not sync preview when editor scrolls', async ({ page }) => {
      const initialPreviewScroll = await mdreader.getPreviewScrollTop();
      
      // Scroll the editor
      await mdreader.scrollEditor(500);
      await page.waitForTimeout(200);
      
      const newPreviewScroll = await mdreader.getPreviewScrollTop();
      // Preview scroll should remain the same (or very close)
      expect(Math.abs(newPreviewScroll - initialPreviewScroll)).toBeLessThan(10);
    });

    test('should not sync editor when preview scrolls', async ({ page }) => {
      const initialEditorScroll = await mdreader.getEditorScrollTop();
      
      // Scroll the preview
      await mdreader.scrollPreview(500);
      await page.waitForTimeout(200);
      
      const newEditorScroll = await mdreader.getEditorScrollTop();
      // Editor scroll should remain the same (or very close)
      expect(Math.abs(newEditorScroll - initialEditorScroll)).toBeLessThan(10);
    });

    test('should allow independent scrolling of editor', async ({ page }) => {
      await mdreader.scrollEditor(300);
      await page.waitForTimeout(100);
      await mdreader.scrollEditor(600);
      await page.waitForTimeout(100);
      
      const editorScroll = await mdreader.getEditorScrollTop();
      const previewScroll = await mdreader.getPreviewScrollTop();
      
      // They should be different since they're independent
      expect(editorScroll).toBeGreaterThan(previewScroll);
    });

    test('should allow independent scrolling of preview', async ({ page }) => {
      await mdreader.scrollPreview(300);
      await page.waitForTimeout(100);
      
      const previewScroll = await mdreader.getPreviewScrollTop();
      const editorScroll = await mdreader.getEditorScrollTop();
      
      // Preview should be scrolled, editor should not
      expect(previewScroll).toBeGreaterThan(0);
      expect(editorScroll).toBe(0);
    });
  });

  test.describe('Toggle Behavior', () => {
    test('should switch from locked to unlocked', async ({ page }) => {
      expect(await mdreader.isScrollLocked()).toBe(true);
      
      await mdreader.toggleScrollLock();
      
      expect(await mdreader.isScrollLocked()).toBe(false);
    });

    test('should switch from unlocked to locked', async ({ page }) => {
      await mdreader.toggleScrollLock(); // Now unlocked
      expect(await mdreader.isScrollLocked()).toBe(false);
      
      await mdreader.toggleScrollLock(); // Now locked
      expect(await mdreader.isScrollLocked()).toBe(true);
    });

    test('should resume syncing after re-locking', async ({ page }) => {
      // Unlock
      await mdreader.toggleScrollLock();
      await page.waitForTimeout(100);
      
      // Scroll editor independently
      await mdreader.scrollEditor(300);
      await page.waitForTimeout(100);
      
      // Re-lock
      await mdreader.toggleScrollLock();
      await page.waitForTimeout(100);
      
      // Now scroll should sync
      await mdreader.scrollEditor(600);
      await page.waitForTimeout(300);
      
      const previewScroll = await mdreader.getPreviewScrollTop();
      expect(previewScroll).toBeGreaterThan(0);
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle scroll at top', async ({ page }) => {
      await mdreader.scrollEditor(0);
      await page.waitForTimeout(200);
      
      const previewScroll = await mdreader.getPreviewScrollTop();
      expect(previewScroll).toBe(0);
    });

    test('should handle scroll at bottom', async ({ page }) => {
      // Scroll editor to bottom
      await page.evaluate(() => {
        const editor = (window as unknown as { 
          monaco?: { 
            editor: { 
              getEditors: () => Array<{ 
                getScrollHeight: () => number;
                getLayoutInfo: () => { height: number };
                setScrollTop: (top: number) => void;
              }> 
            } 
          } 
        }).monaco?.editor.getEditors()[0];
        
        if (editor) {
          const maxScroll = editor.getScrollHeight() - editor.getLayoutInfo().height;
          editor.setScrollTop(maxScroll);
        }
      });
      
      await page.waitForTimeout(300);
      
      // Preview should also be near bottom
      const previewAtBottom = await page.evaluate(() => {
        const preview = document.querySelector('.markdown-preview');
        if (!preview) return false;
        
        const maxScroll = preview.scrollHeight - preview.clientHeight;
        return preview.scrollTop >= maxScroll - 10;
      });
      
      expect(previewAtBottom).toBe(true);
    });

    test('should handle rapid scrolling', async ({ page }) => {
      // Rapidly scroll the editor
      for (let i = 0; i < 5; i++) {
        await mdreader.scrollEditor(i * 200);
        await page.waitForTimeout(50);
      }
      
      await page.waitForTimeout(300);
      
      // Preview should have scrolled
      const previewScroll = await mdreader.getPreviewScrollTop();
      expect(previewScroll).toBeGreaterThan(0);
    });
  });

  test.describe('View Mode Interaction', () => {
    test('should not affect scroll sync in editor-only mode', async ({ page }) => {
      await mdreader.setViewMode('editor');
      
      // Should still be able to scroll editor
      await mdreader.scrollEditor(300);
      await page.waitForTimeout(100);
      
      const editorScroll = await mdreader.getEditorScrollTop();
      expect(editorScroll).toBeGreaterThan(0);
    });

    test('should not affect scroll sync in preview-only mode', async ({ page }) => {
      await mdreader.setViewMode('preview');
      
      // Should still be able to scroll preview
      await mdreader.scrollPreview(300);
      await page.waitForTimeout(100);
      
      const previewScroll = await mdreader.getPreviewScrollTop();
      expect(previewScroll).toBeGreaterThan(0);
    });

    test('should resume sync when returning to split view', async ({ page }) => {
      await mdreader.setViewMode('editor');
      await page.waitForTimeout(100);
      
      await mdreader.setViewMode('both');
      await page.waitForTimeout(100);
      
      // Scroll should still sync
      await mdreader.scrollEditor(400);
      await page.waitForTimeout(300);
      
      const previewScroll = await mdreader.getPreviewScrollTop();
      expect(previewScroll).toBeGreaterThan(0);
    });
  });

  test.describe('Persistence', () => {
    test('should persist scroll lock state to localStorage', async ({ page }) => {
      await mdreader.toggleScrollLock(); // Now unlocked
      
      const stored = await page.evaluate(() => localStorage.getItem('mdreader-scroll-lock'));
      expect(stored).toBe('false');
      
      await mdreader.toggleScrollLock(); // Now locked
      
      const storedAgain = await page.evaluate(() => localStorage.getItem('mdreader-scroll-lock'));
      expect(storedAgain).toBe('true');
    });

    test('should restore scroll lock state on reload', async ({ page }) => {
      // Unlock scroll
      await mdreader.toggleScrollLock();
      expect(await mdreader.isScrollLocked()).toBe(false);
      
      // Reload page
      await page.reload();
      await mdreader.waitForAppLoad();
      
      // Should still be unlocked
      expect(await mdreader.isScrollLocked()).toBe(false);
    });
  });
});
