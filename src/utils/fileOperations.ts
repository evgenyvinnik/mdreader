/**
 * Utility functions for file operations (open/save .md files)
 */

export interface FileData {
  content: string;
  filename: string;
}

/**
 * Opens a file picker dialog and reads the selected .md file
 * @returns Promise with file content and filename, or null if cancelled
 */
export async function openMarkdownFile(): Promise<FileData | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,.markdown,text/markdown';
    
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      
      try {
        const content = await file.text();
        resolve({
          content,
          filename: file.name,
        });
      } catch (error) {
        console.error('Failed to read file:', error);
        resolve(null);
      }
    };
    
    // Handle cancel event using addEventListener for better browser compatibility
    input.addEventListener('cancel', () => {
      resolve(null);
    });
    
    input.click();
  });
}

/**
 * Saves content as a .md file using the download mechanism
 * @param content - The markdown content to save
 * @param filename - The suggested filename (without extension)
 */
export function saveMarkdownFile(content: string, filename: string = 'document'): void {
  // Ensure .md extension
  const finalFilename = filename.endsWith('.md') ? filename : `${filename}.md`;
  
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = finalFilename;
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Cleanup
  URL.revokeObjectURL(url);
}
