const { app, BrowserWindow, ipcMain, shell: osShell } = require("electron");
const path = require("path");
const os = require("os");
const { spawn } = require("child_process");

let win;
const tabs = new Map(); // tabId -> child_process

function createWindow() {
  const preloadPath = path.join(__dirname, "preload.js");
  console.log("Preload path:", preloadPath);
  console.log("Preload exists:", require('fs').existsSync(preloadPath));
  
  win = new BrowserWindow({
    width: 1440,
    height: 900,
    backgroundColor: "#0b0b14",
    title: "term1nal",
    autoHideMenuBar: true,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false
    },
    show: false // ウィンドウ表示の問題を防ぐ
  });

  // dev（Vite）を表示。ビルド後は dist/index.html に切り替え。
  const devURL = "http://localhost:5173";
  win.loadURL(devURL);

  // ウィンドウを表示
  win.once('ready-to-show', () => {
    console.log("Window ready to show");
    win.show();
    win.focus();
    win.moveTop();
    
    // macOSでアプリケーションをアクティブ化
    if (process.platform === 'darwin') {
      app.dock.show();
      app.focus({ steal: true });
    }
  });

  // 開発時はDevToolsを開く
  win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

/** IPC — タブ作成 */
ipcMain.handle("terminal:create", async (_e, { tabId, shellPath, cols, rows }) => {
  try {
    const sh = process.platform === "win32"
      ? "cmd.exe"
      : "/bin/bash";

    console.log(`Creating terminal with shell: ${sh} for tab: ${tabId}`);

    // Use child_process with interactive shell
    const p = spawn(sh, process.platform === "win32" ? [] : ["-i"], {
      cwd: os.homedir(),
      env: { 
        ...process.env, 
        TERM: 'xterm-256color',
        PS1: 'shadowkrr:$PWD$ ',
        COLUMNS: cols || 120,
        LINES: rows || 35
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Handle stdout data
    p.stdout.on('data', (data) => {
      const chunk = data.toString();
      console.log(`stdout from ${tabId}:`, chunk);
      if (win && win.webContents) {
        win.webContents.send("terminal:data", { tabId, chunk });
      }
    });

    // Handle stderr data  
    p.stderr.on('data', (data) => {
      const chunk = data.toString();
      console.log(`stderr from ${tabId}:`, chunk);
      if (win && win.webContents) {
        win.webContents.send("terminal:data", { tabId, chunk });
      }
    });

    // Handle process exit
    p.on('close', (code) => {
      console.log(`Process ${tabId} exited with code: ${code}`);
      if (win && win.webContents) {
        win.webContents.send("terminal:exit", { tabId, code });
      }
      tabs.delete(tabId);
    });

    // Handle errors
    p.on('error', (err) => {
      console.error(`Process error for ${tabId}:`, err);
      if (win && win.webContents) {
        win.webContents.send("terminal:data", { tabId, chunk: `Error: ${err.message}\r\n` });
      }
    });

    tabs.set(tabId, p);
    
    // Send initial prompt after a short delay
    setTimeout(() => {
      if (win && win.webContents) {
        win.webContents.send("terminal:data", { tabId, chunk: 'shadowkrr:' + os.homedir() + '$ ' });
      }
    }, 100);

    return { success: true };
  } catch (error) {
    console.error(`Failed to create terminal ${tabId}:`, error);
    return { success: false, error: error.message };
  }
});

/** 入力 / リサイズ / クローズ */
ipcMain.on("terminal:input", (_e, { tabId, data }) => {
  const p = tabs.get(tabId); 
  if (p && p.stdin && !p.stdin.destroyed) {
    console.log(`Writing to ${tabId}:`, JSON.stringify(data));
    try {
      p.stdin.write(data);
    } catch (err) {
      console.error(`Error writing to ${tabId}:`, err);
    }
  }
});

ipcMain.on("terminal:resize", (_e, { tabId, cols, rows }) => {
  // child_process doesn't support direct resize, but we can ignore this for now
});

ipcMain.on("terminal:close", (_e, { tabId }) => {
  const p = tabs.get(tabId); 
  if (p) { 
    try { 
      p.kill('SIGTERM'); 
    } catch {} 
    tabs.delete(tabId); 
  }
});

ipcMain.on("open:external", (_e, { url }) => osShell.openExternal(url));