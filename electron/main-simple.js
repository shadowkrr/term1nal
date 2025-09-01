const { app, BrowserWindow, ipcMain, shell: osShell } = require("electron");
const path = require("path");

let win;

function createWindow() {
  console.log("Creating window...");
  
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    x: 100,
    y: 100,
    backgroundColor: "#0b0b14",
    title: "term1nal",
    autoHideMenuBar: true,
    show: false, // 最初は非表示
    webPreferences: {
      preload: path.join(__dirname, "preload-simple.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  console.log("Window created, loading URL...");

  // dev（Vite）を表示
  const devURL = "http://localhost:5173";
  
  win.loadURL(devURL).then(() => {
    console.log("URL loaded successfully");
  }).catch(err => {
    console.error("Failed to load URL:", err);
  });
  
  // 開発時はDevToolsを開く
  win.webContents.openDevTools();

  // ウィンドウのイベントログ
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

  win.on('close', (e) => {
    console.log("Window close event");
    // 一時的にウィンドウが閉じるのを防ぐ
    // e.preventDefault();
  });
  
  win.on('closed', () => {
    console.log("Window closed");
    win = null;
  });
}

app.whenReady().then(() => {
  console.log("App is ready");
  createWindow();
});

app.on("window-all-closed", () => {
  console.log("All windows closed");
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// 簡単なテスト用IPC
ipcMain.handle("test", () => {
  return "Electron IPC is working!";
});

ipcMain.on("open:external", (_e, { url }) => osShell.openExternal(url));