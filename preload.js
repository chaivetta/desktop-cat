const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("deskcat", {
  setIgnore: (ignore) => ipcRenderer.send("ignore", !!ignore),
  setSettings: (o) => ipcRenderer.send("settings", o),
  onCommand: (cb) => ipcRenderer.on("cmd", (_e, cmd) => cb(cmd)),
  hide: () => ipcRenderer.send("hide"),
  quit: () => ipcRenderer.send("quit"),
  getLogin: () => ipcRenderer.invoke("login"),
  setLogin: (on) => ipcRenderer.invoke("login", !!on),
  // the save also goes to a file in the app's data folder (that's the folder Steam Cloud syncs)
  loadSave: () => ipcRenderer.sendSync("save:load"),
  writeSave: (json) => ipcRenderer.send("save:write", json),
  // Steam achievements (does nothing unless the game was started from Steam)
  achievement: (id) => ipcRenderer.send("steam:ach", id),
  steam: () => ipcRenderer.sendSync("steam:on"),
});
