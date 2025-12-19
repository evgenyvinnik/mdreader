/**
 * Utility functions for file operations (open/save .md files)
 */

export interface FileData {
  readonly content: string;
  readonly filename: string;
}

/**
 * Supported markdown file extensions
 */
const MARKDOWN_EXTENSIONS = ['.md', '.markdown', '.mdown', '.mkd'];

/**
 * Check if a filename has a markdown extension
 */
function isMarkdownFile(filename: string): boolean {
  const lowerName = filename.toLowerCase();
  return MARKDOWN_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
}

/**
 * Opens a file picker dialog and reads the selected .md file
 * @returns Promise with file content and filename, or null if cancelled
 */
export async function openMarkdownFile(): Promise<FileData | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,.markdown,.mdown,.mkd,text/markdown';

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
 * Generates a timestamp string in the format YYYY-MM-DD_HHMMSS
 * @returns Formatted timestamp string
 */
function generateTimestamp(): string {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}_${hours}${minutes}${seconds}`;
}

/**
 * Removes any existing timestamp suffix from a filename
 * Timestamp format: _YYYY-MM-DD_HHMMSS
 * @param filename - The filename to clean
 * @returns Filename without timestamp suffix
 */
function removeExistingTimestamp(filename: string): string {
  // Pattern matches _YYYY-MM-DD_HHMMSS at the end of the filename (before extension)
  const timestampPattern = /_\d{4}-\d{2}-\d{2}_\d{6}$/;
  return filename.replace(timestampPattern, '');
}

/**
 * Reads a dropped File object and returns its content
 * @param file - The dropped File object
 * @returns Promise with file content and filename, or null if invalid
 */
export async function readDroppedFile(file: File): Promise<FileData | null> {
  // Check if it's a markdown file
  if (!isMarkdownFile(file.name) && file.type !== 'text/markdown') {
    return null;
  }

  try {
    const content = await file.text();
    return {
      content,
      filename: file.name,
    };
  } catch (error) {
    console.error('Failed to read dropped file:', error);
    return null;
  }
}

/**
 * Saves content as a .md file using the download mechanism
 * @param content - The markdown content to save
 * @param filename - The suggested filename (without extension)
 */
export function saveMarkdownFile(content: string, filename = 'document'): void {
  // Remove .md extension if present
  let baseName = filename.endsWith('.md') ? filename.slice(0, -3) : filename;

  // Remove any existing timestamp to avoid stacking timestamps
  baseName = removeExistingTimestamp(baseName);

  // Generate new timestamp and create final filename
  const timestamp = generateTimestamp();
  const finalFilename = `${baseName}_${timestamp}.md`;

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
