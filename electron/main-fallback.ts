import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { spawn } from 'child_process';
import * as path from 'path';
import * as os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.IS_DEV === 'true';

// Store terminal processes
const terminals = new Map<string, any>();

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 20, y: 13 },
    show: false
  });

  win.once('ready-to-show', () => {
    win.show();
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  return win;
};

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  // Clean up all terminals
  terminals.forEach((terminal) => {
    if (terminal && !terminal.killed) {
      terminal.kill();
    }
  });
  terminals.clear();
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers
ipcMain.handle('terminal:create', async (event, options) => {
  const { tabId, cols, rows, shellPath, cwd } = options;
  
  try {
    let shell = shellPath;
    let args: string[] = [];
    
    // Determine shell and arguments based on platform
    if (process.platform === 'win32') {
      shell = shell || 'powershell.exe';
    } else {
      shell = shell || process.env.SHELL || '/bin/bash';
      args = ['-l']; // login shell
    }

    const terminal = spawn(shell, args, {
      cwd: cwd || os.homedir(),
      env: { ...process.env, TERM: 'xterm-256color' },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    terminals.set(tabId, terminal);

    // Handle data from terminal
    terminal.stdout?.on('data', (data) => {
      event.sender.send('terminal:data', { tabId, chunk: data.toString() });
    });

    terminal.stderr?.on('data', (data) => {
      event.sender.send('terminal:data', { tabId, chunk: data.toString() });
    });

    // Handle terminal exit
    terminal.on('exit', (code) => {
      terminals.delete(tabId);
      event.sender.send('terminal:exit', { tabId, code });
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to create terminal:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('terminal:input', async (event, tabId, data) => {
  const terminal = terminals.get(tabId);
  if (terminal && terminal.stdin) {
    terminal.stdin.write(data);
  }
});

ipcMain.handle('terminal:resize', async (event, tabId, cols, rows) => {
  // Note: child_process doesn't support resizing like node-pty
  // This is a limitation of the fallback implementation
  console.log(`Terminal resize requested for ${tabId}: ${cols}x${rows}`);
});

ipcMain.handle('terminal:close', async (event, tabId) => {
  const terminal = terminals.get(tabId);
  if (terminal && !terminal.killed) {
    terminal.kill();
  }
  terminals.delete(tabId);
});

ipcMain.handle('open:external', async (event, url) => {
  shell.openExternal(url);
});