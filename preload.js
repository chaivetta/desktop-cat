const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("deskcat", {
  setIgnore: (ignore) => ipcRenderer.send("ignore", !!ignore),
  setCoats: (list) => ipcRenderer.send("coats", list),
  setLaser: (on) => ipcRenderer.send("laser", !!on),
  setWand: (on) => ipcRenderer.send("wand", !!on),
  onCommand: (cb) => ipcRenderer.on("cmd", (_e, cmd) => cb(cmd)),
});
