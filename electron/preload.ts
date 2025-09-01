import { contextBridge, ipcRenderer } from 'electron'

// Terminal API
const terminalAPI = {
  create: (options?: { cols?: number; rows?: number; cwd?: string }) => 
    ipcRenderer.invoke('terminal:create', options),
  
  write: (terminalId: string, data: string) => 
    ipcRenderer.invoke('terminal:write', terminalId, data),
  
  resize: (terminalId: string, cols: number, rows: number) => 
    ipcRenderer.invoke('terminal:resize', terminalId, cols, rows),
  
  kill: (terminalId: string) => 
    ipcRenderer.invoke('terminal:kill', terminalId),
  
  onData: (callback: (data: { terminalId: string; data: string }) => void) => {
    const listener = (_event: any, data: { terminalId: string; data: string }) => callback(data)
    ipcRenderer.on('terminal:data', listener)
    return () => ipcRenderer.removeListener('terminal:data', listener)
  },
  
  onExit: (callback: (data: { terminalId: string }) => void) => {
    const listener = (_event: any, data: { terminalId: string }) => callback(data)
    ipcRenderer.on('terminal:exit', listener)
    return () => ipcRenderer.removeListener('terminal:exit', listener)
  }
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  terminal: terminalAPI,
  
  // General purpose IPC
  send: (channel: string, data: any) => {
    ipcRenderer.send(channel, data)
  },
  
  receive: (channel: string, func: (...args: any[]) => void) => {
    const listener = (_event: any, ...args: any[]) => func(...args)
    ipcRenderer.on(channel, listener)
    return () => ipcRenderer.removeListener(channel, listener)
  },
  
  invoke: (channel: string, ...args: any[]) => {
    return ipcRenderer.invoke(channel, ...args)
  }
})

// Type definitions for the exposed API
export interface ElectronAPI {
  terminal: {
    create: (options?: { cols?: number; rows?: number; cwd?: string }) => Promise<string>
    write: (terminalId: string, data: string) => Promise<void>
    resize: (terminalId: string, cols: number, rows: number) => Promise<void>
    kill: (terminalId: string) => Promise<boolean>
    onData: (callback: (data: { terminalId: string; data: string }) => void) => () => void
    onExit: (callback: (data: { terminalId: string }) => void) => () => void
  }
  send: (channel: string, data: any) => void
  receive: (channel: string, func: (...args: any[]) => void) => () => void
  invoke: (channel: string, ...args: any[]) => Promise<any>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}