export interface Bridge {
  test: () => Promise<string>;
  openExternal: (url: string) => void;
}

declare global {
  interface Window {
    bridge?: Bridge;
  }
}

export {};