declare global {
  interface Window {
    api: any; // Type with exact preload signatures later
  }
}

export function useApi() {
  return window.api;
}