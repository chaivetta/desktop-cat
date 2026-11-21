// Desktop Cat — Electron shell.
// A transparent, click-through window spans the screen above the taskbar.
// The page tells us when the pointer is over a cat or the yarn, and only then
// do we let the window catch the mouse, so the rest of the desktop keeps working.
const { app, BrowserWindow, screen, ipcMain, Tray, Menu, nativeImage } = require("electron");
const path = require("path");

if (process.platform === "linux") app.commandLine.appendSwitch("enable-transparent-visuals");
if (!app.requestSingleInstanceLock()) app.quit();

let win = null, tray = null, coats = [], paused = false, laser = false;

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
    acceptFirstMouse: true,                 // macOS: the first click pets the cat instead of just focusing the window
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
    { label: "Toys", submenu: [
      { label: "Ball of yarn", click: () => send({ type: "yarn" }) },
      { label: "Wind-up mouse", click: () => send({ type: "mouse" }) },
      { label: "Cardboard box", click: () => send({ type: "box" }) },
      { label: "Laser pointer", type: "checkbox", checked: laser, click: (item) => { laser = item.checked; send({ type: "laser", on: laser }); } },
      { type: "separator" },
      { label: "Put the toys away", click: () => send({ type: "clear" }) },
    ] },
    { label: "Feed the cats", click: () => send({ type: "feed" }) },
    { label: "Remove a cat", click: () => send({ type: "remove" }) },
    { type: "separator" },
    { label: "Cat size", submenu: [
      { label: "Bigger", click: () => send({ type: "bigger" }) },
      { label: "Smaller", click: () => send({ type: "smaller" }) },
    ] },
    { label: "Toy size", submenu: [
      { label: "Bigger", click: () => send({ type: "toysBigger" }) },
      { label: "Smaller", click: () => send({ type: "toysSmaller" }) },
    ] },
    { label: paused ? "Show cats" : "Hide cats", click: () => { paused = !paused; paused ? win.hide() : win.showInactive(); tray.setContextMenu(buildMenu()); } },
    { type: "separator" },
    { label: "Start with my computer", type: "checkbox", checked: app.getLoginItemSettings().openAtLogin,
      click: (item) => app.setLoginItemSettings({ openAtLogin: item.checked }) },
    { label: "Quit", click: () => app.quit() },
  ]);
}

function createTray() {
  // 16 px icons with @2x versions next to them; on macOS a "Template" image adapts to the light/dark menu bar
  const icon = nativeImage.createFromPath(path.join(__dirname, "assets", process.platform === "darwin" ? "trayTemplate.png" : "tray.png"));
  if (process.platform === "darwin") icon.setTemplateImage(true);
  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);
  tray.setToolTip("Desktop Cat");
  tray.setContextMenu(buildMenu());
  if (process.platform !== "darwin") tray.on("click", () => send({ type: "yarn" }));   // on macOS a click just opens the menu
}

ipcMain.on("ignore", (_e, ignore) => { if (win) win.setIgnoreMouseEvents(!!ignore, { forward: true }); });
ipcMain.on("laser", (_e, on) => { laser = !!on; if (tray) tray.setContextMenu(buildMenu()); });
ipcMain.on("coats", (_e, list) => { coats = Array.isArray(list) ? list : []; if (tray) tray.setContextMenu(buildMenu()); });

app.whenReady().then(() => {
  if (process.platform === "darwin" && app.dock) app.dock.hide();
  createWindow();
  createTray();
});
app.on("second-instance", () => send({ type: "add" }));
app.on("window-all-closed", () => app.quit());
