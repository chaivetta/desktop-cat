// Desktop Cat — Electron shell.
// A transparent, click-through window spans the screen above the taskbar.
// The page tells us when the pointer is over a cat or the yarn, and only then
// do we let the window catch the mouse, so the rest of the desktop keeps working.
const { app, BrowserWindow, screen, ipcMain, Tray, Menu, nativeImage } = require("electron");
const path = require("path");

if (process.platform === "linux") app.commandLine.appendSwitch("enable-transparent-visuals");
if (!app.requestSingleInstanceLock()) app.quit();

let win = null, tray = null, coats = [], paused = false;

function fitToScreen() {
  if (!win) return;
  const { x, y, width, height } = screen.getPrimaryDisplay().workArea;
  win.setBounds({ x, y, width, height });
}

function createWindow() {
  const { x, y, width, height } = screen.getPrimaryDisplay().workArea;
  win = new BrowserWindow({
    x, y, width, height,
    transparent: true, frame: false, resizable: false, movable: false, hasShadow: false,
    alwaysOnTop: true, skipTaskbar: true, fullscreenable: false, show: false,
    backgroundColor: "#00000000",
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false, backgroundThrottling: false },
  });
  win.setAlwaysOnTop(true, "screen-saver");
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.setIgnoreMouseEvents(true, { forward: true });
  win.loadFile(path.join(__dirname, "src", "index.html"));
  win.once("ready-to-show", () => win.showInactive());
  screen.on("display-metrics-changed", fitToScreen);
  screen.on("display-added", fitToScreen);
  screen.on("display-removed", fitToScreen);
}

const send = (cmd) => win && win.webContents.send("cmd", cmd);

function buildMenu() {
  return Menu.buildFromTemplate([
    { label: "Add a cat", submenu: [
      { label: "Surprise me", click: () => send({ type: "add" }) },
      { type: "separator" },
      ...coats.map((c) => ({ label: c.name, click: () => send({ type: "add", coat: c.key }) })),
    ] },
    { label: "Throw yarn", click: () => send({ type: "yarn" }) },
    { label: "Remove a cat", click: () => send({ type: "remove" }) },
    { type: "separator" },
    { label: "Bigger", click: () => send({ type: "bigger" }) },
    { label: "Smaller", click: () => send({ type: "smaller" }) },
    { label: paused ? "Show cats" : "Hide cats", click: () => { paused = !paused; paused ? win.hide() : win.showInactive(); tray.setContextMenu(buildMenu()); } },
    { type: "separator" },
    { label: "Start with my computer", type: "checkbox", checked: app.getLoginItemSettings().openAtLogin,
      click: (item) => app.setLoginItemSettings({ openAtLogin: item.checked }) },
    { label: "Quit", click: () => app.quit() },
  ]);
}

function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, "assets", process.platform === "darwin" ? "trayTemplate.png" : "tray.png"));
  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);
  tray.setToolTip("Desktop Cat");
  tray.setContextMenu(buildMenu());
  tray.on("click", () => send({ type: "yarn" }));
}

ipcMain.on("ignore", (_e, ignore) => { if (win) win.setIgnoreMouseEvents(!!ignore, { forward: true }); });
ipcMain.on("coats", (_e, list) => { coats = Array.isArray(list) ? list : []; if (tray) tray.setContextMenu(buildMenu()); });

app.whenReady().then(() => {
  if (process.platform === "darwin" && app.dock) app.dock.hide();
  createWindow();
  createTray();
});
app.on("second-instance", () => send({ type: "add" }));
app.on("window-all-closed", () => app.quit());
