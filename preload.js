const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("deskcat", {
  setIgnore: (ignore) => ipcRenderer.send("ignore", !!ignore),
  setSettings: (o) => ipcRenderer.send("settings", o),
  onCommand: (cb) => ipcRenderer.on("cmd", (_e, cmd) => cb(cmd)),
  hide: () => ipcRenderer.send("hide"),
  quit: () => ipcRenderer.send("quit"),
  getLogin: () => ipcRenderer.invoke("login"),
  setLogin: (on) => ipcRenderer.invoke("login", !!on),
});
