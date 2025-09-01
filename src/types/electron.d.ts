export interface ElectronAPI {
  createTerminal: (options: {
    tabId: string;
    cols: number;
    rows: number;
    shellPath: string;
    cwd: string;
  }) => void;
  
  terminalInput: (tabId: string, data: string) => void;
  
  resizeTerminal: (tabId: string, cols: number, rows: number) => void;
  
  closeTerminal: (tabId: string) => void;
  
  onTerminalData: (callback: (tabId: string, data: string) => void) => void;
  
  onTerminalExit: (callback: (tabId: string, code?: number) => void) => void;
  
  openExternal: (url: string) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};