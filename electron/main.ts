import { app, BrowserWindow, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import * as pty from 'node-pty'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

let win: BrowserWindow | null
// Here, you can also use other preload
const preload = path.join(__dirname, 'preload.js')
const url = process.env.VITE_DEV_SERVER_URL
const indexHtml = path.join(process.env.DIST, 'index.html')

// Store active terminals
const terminals = new Map<string, any>()

async function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true,
    },
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    show: false
  })

  // Test active push message to Renderer-process.
  win.webContents.on('dom-ready', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (url) {
    win.loadURL(url)
    // Open devTool if the app is not packaged
    win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml)
  }

  // Show window when ready to prevent visual flash
  win.once('ready-to-show', () => {
    win?.show()
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) {
      require('electron').shell.openExternal(url)
    }
    return { action: 'deny' }
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  // Cleanup all terminals
  terminals.forEach(terminal => {
    terminal.kill()
  })
  terminals.clear()

  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Terminal IPC handlers
ipcMain.handle('terminal:create', (event, options = {}) => {
  const terminalId = Math.random().toString(36).substring(7)
  
  const shell = process.env[process.platform === 'win32' ? 'COMSPEC' : 'SHELL'] || 
    (process.platform === 'win32' ? 'powershell.exe' : '/bin/bash')

  const terminal = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: options.cols || 80,
    rows: options.rows || 30,
    cwd: options.cwd || process.env.HOME,
    env: process.env
  })

  terminals.set(terminalId, terminal)

  // Forward terminal output to renderer
  terminal.onData((data: string) => {
    win?.webContents.send('terminal:data', { terminalId, data })
  })

  terminal.onExit(() => {
    terminals.delete(terminalId)
    win?.webContents.send('terminal:exit', { terminalId })
  })

  return terminalId
})

ipcMain.handle('terminal:write', (event, terminalId: string, data: string) => {
  const terminal = terminals.get(terminalId)
  if (terminal) {
    terminal.write(data)
  }
})

ipcMain.handle('terminal:resize', (event, terminalId: string, cols: number, rows: number) => {
  const terminal = terminals.get(terminalId)
  if (terminal) {
    terminal.resize(cols, rows)
  }
})

ipcMain.handle('terminal:kill', (event, terminalId: string) => {
  const terminal = terminals.get(terminalId)
  if (terminal) {
    terminal.kill()
    terminals.delete(terminalId)
    return true
  }
  return false
})