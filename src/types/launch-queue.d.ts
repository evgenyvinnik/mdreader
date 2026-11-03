// File Handling API (Chromium): files opened from the OS with the installed PWA
// https://developer.mozilla.org/docs/Web/API/LaunchQueue
interface LaunchParams {
  readonly targetURL?: string;
  readonly files: readonly (FileSystemFileHandle | FileSystemDirectoryHandle)[];
}

interface LaunchQueue {
  setConsumer(consumer: (params: LaunchParams) => void): void;
}

interface Window {
  readonly launchQueue?: LaunchQueue;
}
