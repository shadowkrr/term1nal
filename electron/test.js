const { app, BrowserWindow } = require('electron');

console.log("Starting Electron test...");

app.whenReady().then(() => {
  console.log("App ready, creating window...");
  
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    show: false, // 最初は非表示
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  console.log("Loading content...");
  win.loadURL('data:text/html,<h1>Electron is working!</h1>');
  
  // ウィンドウを表示してフォーカス
  win.once('ready-to-show', () => {
    console.log("Window ready, showing and focusing...");
    win.show();
    win.focus();
    win.moveTop();
    
    // アプリケーションをアクティブ化
    app.dock.show();
    app.focus({ steal: true });
  });
  
  win.on('closed', () => {
    console.log("Window closed");
  });

  // 5秒後に自動で閉じる
  setTimeout(() => {
    console.log("Auto closing window after 5 seconds");
    app.quit();
  }, 5000);
});

app.on('window-all-closed', () => {
  console.log("All windows closed");
  app.quit();
});