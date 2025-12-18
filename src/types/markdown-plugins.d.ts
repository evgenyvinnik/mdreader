declare module 'markdown-it-task-lists' {
  import type MarkdownIt from 'markdown-it';
  interface TaskListOptions {
    enabled?: boolean;
    label?: boolean;
    labelAfter?: boolean;
  }
  const taskLists: (md: MarkdownIt, options?: TaskListOptions) => void;
  export default taskLists;
}

declare module 'markdown-it-emoji' {
  import type MarkdownIt from 'markdown-it';
  export const bare: MarkdownIt.PluginSimple;
  export const light: MarkdownIt.PluginSimple;
  export const full: MarkdownIt.PluginSimple;
}
