// Pawsport — Electron shell.
// A transparent, click-through window spans the screen above the taskbar.
// The page tells us when the pointer is over a cat or the yarn, and only then
// do we let the window catch the mouse, so the rest of the desktop keeps working.
const { app, BrowserWindow, screen, ipcMain, Tray, Menu, nativeImage, dialog, session, systemPreferences } = require("electron");
const path = require("path");
const fs = require("fs");

if (process.platform === "linux") app.commandLine.appendSwitch("enable-transparent-visuals");
if (!app.requestSingleInstanceLock()) app.quit();

let win = null, tray = null, paused = false;
let lang = app.getLocale().toLowerCase().startsWith("tr") ? "tr" : "en";

// Everything else lives in the ⚙️ settings panel on screen; the tray only opens it, hides the cats, or quits.
const T = {
  en: { settings: "Settings…", show: "Show cats", hide: "Hide cats", quit: "Quit" },
  tr: { settings: "Ayarlar…", show: "Kedileri göster", hide: "Kedileri gizle", quit: "Çıkış" },
};
const t = (k) => T[lang][k];
const refreshMenu = () => { if (tray) tray.setContextMenu(buildMenu()); };
function setPaused(p) { paused = p; if (win) paused ? win.hide() : win.showInactive(); refreshMenu(); }

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
    { label: t("settings"), click: () => { setPaused(false); send({ type: "settings" }); } },
    { label: paused ? t("show") : t("hide"), click: () => setPaused(!paused) },
    { type: "separator" },
    { label: t("quit"), click: () => app.quit() },
  ]);
}

function createTray() {
  // 16 px icons with @2x versions next to them; on macOS a "Template" image adapts to the light/dark menu bar
  const icon = nativeImage.createFromPath(path.join(__dirname, "assets", process.platform === "darwin" ? "trayTemplate.png" : "tray.png"));
  if (process.platform === "darwin") icon.setTemplateImage(true);
  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);
  tray.setToolTip("Pawsport");
  tray.setContextMenu(buildMenu());
  if (process.platform !== "darwin") tray.on("click", () => { setPaused(false); send({ type: "settings" }); });   // on macOS a click just opens the menu
}

// ---- the save file: <userData>/save.json, written to a temp file first and then swapped in, with the last good one kept as save.bak.json
const saveFile = () => path.join(app.getPath("userData"), "save.json");
ipcMain.on("save:load", (e) => {
  for (const f of [saveFile(), saveFile().replace("save.json", "save.bak.json")]) {
    try { const s = fs.readFileSync(f, "utf8"); JSON.parse(s); e.returnValue = s; return; } catch {}
  }
  e.returnValue = null;
});
let lastSave = "";
ipcMain.on("save:write", (_e, json) => {
  if (typeof json !== "string" || json === lastSave || json.length > 20e6) return; lastSave = json;
  try {
    const f = saveFile(), tmp = f + ".tmp";
    fs.writeFileSync(tmp, json);
    if (fs.existsSync(f)) fs.copyFileSync(f, f.replace("save.json", "save.bak.json"));
    fs.renameSync(tmp, f);
  } catch {}
});

// ---- Steam (only when started from Steam and steamworks.js is installed: `npm i steamworks.js`, app id in STEAM_APP_ID or steam_appid.txt)
let steam = null;
function initSteam() {
  try {
    let id = +process.env.STEAM_APP_ID || 0;
    if (!id) for (const d of [process.cwd(), path.dirname(process.execPath), __dirname]) { try { id = +fs.readFileSync(path.join(d, "steam_appid.txt"), "utf8").trim(); if (id) break; } catch {} }
    if (!id) return;
    steam = require("steamworks.js").init(id);
  } catch { steam = null; }
}
const steamDone = new Set();
ipcMain.on("steam:ach", (_e, id) => {
  if (!steam || typeof id !== "string" || steamDone.has(id)) return;
  try { const api = "ACH_" + id.toUpperCase(); if (!steam.achievement.isActivated(api)) steam.achievement.activate(api); steamDone.add(id); } catch {}
});
ipcMain.on("steam:on", (e) => { e.returnValue = !!steam; });

ipcMain.on("ignore", (_e, ignore) => { if (win) win.setIgnoreMouseEvents(!!ignore, { forward: true }); });
ipcMain.on("settings", (_e, o) => { if (o && T[o.lang]) lang = o.lang; refreshMenu(); });
ipcMain.on("hide", () => setPaused(true));
ipcMain.on("quit", () => app.quit());
ipcMain.handle("login", (_e, on) => {
  if (typeof on === "boolean") app.setLoginItemSettings({ openAtLogin: on });
  return app.getLoginItemSettings().openAtLogin;
});

app.whenReady().then(() => {
  initSteam();
  // the microphone is only used when you press 🎤 to record a meow on a cat card
  session.defaultSession.setPermissionRequestHandler((_wc, perm, cb) => {
    if (perm !== "media") return cb(false);
    if (process.platform === "darwin") systemPreferences.askForMediaAccess("microphone").then(cb, () => cb(false)); else cb(true);
  });
  session.defaultSession.setPermissionCheckHandler((_wc, perm) => perm === "media");
  if (process.platform === "darwin" && app.dock) app.dock.hide();
  createWindow();
  createTray();
});
app.on("second-instance", () => send({ type: "add" }));
app.on("window-all-closed", () => app.quit());
