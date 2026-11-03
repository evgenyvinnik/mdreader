declare module 'markdown-it-task-lists' {
  import type { MarkdownIt } from 'markdown-it';
  interface TaskListOptions {
    enabled?: boolean;
    label?: boolean;
    labelAfter?: boolean;
  }
  const taskLists: (md: MarkdownIt, options?: TaskListOptions) => void;
  export default taskLists;
}

declare module 'markdown-it-emoji' {
  import type { MarkdownIt } from 'markdown-it';
  type EmojiPlugin = (md: MarkdownIt) => void;
  export const bare: EmojiPlugin;
  export const light: EmojiPlugin;
  export const full: EmojiPlugin;
}
