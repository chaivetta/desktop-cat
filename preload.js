const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("deskcat", {
  setIgnore: (ignore) => ipcRenderer.send("ignore", !!ignore),
  setCoats: (list) => ipcRenderer.send("coats", list),
  onCommand: (cb) => ipcRenderer.on("cmd", (_e, cmd) => cb(cmd)),
});
