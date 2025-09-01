const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("bridge", {
  create: (args) => ipcRenderer.invoke("terminal:create", args),
  write: (args) => ipcRenderer.send("terminal:input", args),
  resize: (args) => ipcRenderer.send("terminal:resize", args),
  close: (args) => ipcRenderer.send("terminal:close", args),
  onData: (cb) => ipcRenderer.on("terminal:data", (_e, d) => cb(d)),
  onExit: (cb) => ipcRenderer.on("terminal:exit", (_e, d) => cb(d)),
  openExternal: (url) => ipcRenderer.send("open:external", { url })
});