const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("bridge", {
  test: () => ipcRenderer.invoke("test"),
  openExternal: (url) => ipcRenderer.send("open:external", { url })
});