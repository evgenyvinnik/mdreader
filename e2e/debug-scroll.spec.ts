import { test, expect, MDReaderPage, TestContent } from './helpers/fixtures';

test('debug scroll sync', async ({ page }) => {
  const mdreader = new MDReaderPage(page);
  await mdreader.goto();
  
  // Set long content
  await mdreader.setEditorContent(TestContent.longContent);
  await page.waitForTimeout(500);
  
  // Check editor scroll info
  const editorInfo = await page.evaluate(() => {
    const win = window as unknown as { monaco?: { editor: { getEditors: () => Array<{ getScrollHeight: () => number; getLayoutInfo: () => { height: number } }> } } };
    const editor = win.monaco?.editor.getEditors()[0];
    if (!editor) return { scrollHeight: 0, clientHeight: 0 };
    return {
      scrollHeight: editor.getScrollHeight(),
      clientHeight: editor.getLayoutInfo().height
    };
  });
  console.log('Editor scroll info:', editorInfo);
  
  // Check preview scroll info  
  const previewInfo = await page.evaluate(() => {
    const preview = document.querySelector('.preview-container');
    if (!preview) return { scrollHeight: 0, clientHeight: 0 };
    return {
      scrollHeight: preview.scrollHeight,
      clientHeight: preview.clientHeight
    };
  });
  console.log('Preview scroll info:', previewInfo);
  
  // Is content scrollable?
  const isScrollable = editorInfo.scrollHeight > editorInfo.clientHeight && previewInfo.scrollHeight > previewInfo.clientHeight;
  console.log('Is scrollable:', isScrollable);
  
  // Scroll the editor
  await mdreader.scrollEditor(500);
  await page.waitForTimeout(600);
  
  // Check scroll positions
  const editorScroll = await mdreader.getEditorScrollTop();
  console.log('Editor scroll top:', editorScroll);
  
  const previewScroll = await mdreader.getPreviewScrollTop();
  console.log('Preview scroll top:', previewScroll);
  
  expect(previewScroll).toBeGreaterThan(0);
});
