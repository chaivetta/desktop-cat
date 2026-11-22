// Desktop Cat — Electron shell.
// A transparent, click-through window spans the screen above the taskbar.
// The page tells us when the pointer is over a cat or the yarn, and only then
// do we let the window catch the mouse, so the rest of the desktop keeps working.
const { app, BrowserWindow, screen, ipcMain, Tray, Menu, nativeImage, dialog, session, systemPreferences } = require("electron");
const path = require("path");

if (process.platform === "linux") app.commandLine.appendSwitch("enable-transparent-visuals");
if (!app.requestSingleInstanceLock()) app.quit();

let win = null, tray = null, coats = [], paused = false, laser = false, wand = false;
let purrOn = true, meowOn = true, tasksOn = true, breedOn = true, seasonsOn = true, nightMode = "auto", lang = app.getLocale().toLowerCase().startsWith("tr") ? "tr" : "en";

// the tray menu in both languages; the page tells us which one the cats speak
const T = {
  en: { add: "Add a cat", surprise: "Surprise me", toys: "Toys", yarn: "Ball of yarn", mouse: "Wind-up mouse", box: "Cardboard box", wand: "Feather wand",
    laser: "Laser pointer", catnip: "Catnip", butterfly: "Butterfly", bed: "Cat bed", post: "Scratching post", shelf: "Wall shelf", clear: "Put the toys away",
    cards: "Cat cards…", feed: "Feed the cats", remove: "Remove a cat", removeAll: "Remove all cats…", sounds: "Sounds", purr: "Purring", meow: "Meowing",
    night: "Day & night", auto: "Follow the clock", day: "Always day", nightOn: "Always night", catSize: "Cat size", toySize: "Toy size", bigger: "Bigger",
    smaller: "Smaller", tasks: "Daily tasks", breed: "Kittens", seasons: "Seasons (snow, leaves…)", show: "Show cats", hide: "Hide cats", language: "Language", login: "Start with my computer", quit: "Quit",
    raYes: "Remove all", raNo: "Cancel", raQ: "Remove all your cats?", raD: "Their names, diaries and wardrobes will be gone. This can't be undone." },
  tr: { add: "Kedi ekle", surprise: "Sürpriz yap", toys: "Oyuncaklar", yarn: "Yün yumağı", mouse: "Kurmalı fare", box: "Karton kutu", wand: "Tüylü olta",
    laser: "Lazer", catnip: "Kedi otu", butterfly: "Kelebek", bed: "Kedi yatağı", post: "Tırmalama direği", shelf: "Duvar rafı", clear: "Oyuncakları topla",
    cards: "Kedi kartları…", feed: "Kedileri besle", remove: "Bir kediyi kaldır", removeAll: "Tüm kedileri kaldır…", sounds: "Sesler", purr: "Mırlama", meow: "Miyavlama",
    night: "Gece ve gündüz", auto: "Saate göre", day: "Hep gündüz", nightOn: "Hep gece", catSize: "Kedi boyu", toySize: "Oyuncak boyu", bigger: "Büyüt",
    smaller: "Küçült", tasks: "Günlük görevler", breed: "Yavrulama", seasons: "Mevsimler (kar, yaprak…)", show: "Kedileri göster", hide: "Kedileri gizle", language: "Dil", login: "Bilgisayarla birlikte başlat", quit: "Çıkış",
    raYes: "Hepsini kaldır", raNo: "Vazgeç", raQ: "Tüm kedilerin kaldırılsın mı?", raD: "İsimleri, günlükleri ve gardıropları silinecek. Bu geri alınamaz." },
};
const t = (k) => T[lang][k];
const refreshMenu = () => { if (tray) tray.setContextMenu(buildMenu()); };

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
    { label: t("add"), submenu: [
      { label: t("surprise"), click: () => send({ type: "add" }) },
      { type: "separator" },
      ...coats.map((c) => ({ label: c.name, click: () => send({ type: "add", coat: c.key }) })),
    ] },
    { label: t("toys"), submenu: [
      { label: t("yarn"), click: () => send({ type: "yarn" }) },
      { label: t("mouse"), click: () => send({ type: "mouse" }) },
      { label: t("box"), click: () => send({ type: "box" }) },
      { label: t("wand"), type: "checkbox", checked: wand, click: (item) => { wand = item.checked; send({ type: "wand", on: wand }); } },
      { label: t("laser"), type: "checkbox", checked: laser, click: (item) => { laser = item.checked; send({ type: "laser", on: laser }); } },
      { label: t("catnip"), click: () => send({ type: "catnip" }) },
      { label: t("butterfly"), click: () => send({ type: "butterfly" }) },
      { type: "separator" },
      { label: t("bed"), click: () => send({ type: "bed" }) },
      { label: t("post"), click: () => send({ type: "post" }) },
      { label: t("shelf"), click: () => send({ type: "shelf" }) },
      { type: "separator" },
      { label: t("clear"), click: () => send({ type: "clear" }) },
    ] },
    { label: t("cards"), click: () => { win.showInactive(); send({ type: "cards" }); } },
    { label: t("feed"), click: () => send({ type: "feed" }) },
    { label: t("remove"), click: () => send({ type: "remove" }) },
    { label: t("removeAll"), click: async () => {
      const r = await dialog.showMessageBox({ type: "question", buttons: [t("raYes"), t("raNo")], defaultId: 1, cancelId: 1, message: t("raQ"), detail: t("raD") });
      if (r.response === 0) send({ type: "removeAll" });
    } },
    { type: "separator" },
    { label: t("sounds"), submenu: [
      { label: t("purr"), type: "checkbox", checked: purrOn, click: (item) => { purrOn = item.checked; send({ type: "purr", on: purrOn }); } },
      { label: t("meow"), type: "checkbox", checked: meowOn, click: (item) => { meowOn = item.checked; send({ type: "meow", on: meowOn }); } },
    ] },
    { label: t("tasks"), type: "checkbox", checked: tasksOn, click: (item) => { tasksOn = item.checked; send({ type: "tasks", on: tasksOn }); } },
    { label: t("breed"), type: "checkbox", checked: breedOn, click: (item) => { breedOn = item.checked; send({ type: "breed", on: breedOn }); } },
    { label: t("seasons"), type: "checkbox", checked: seasonsOn, click: (item) => { seasonsOn = item.checked; send({ type: "seasons", on: seasonsOn }); } },
    { label: t("night"), submenu: ["auto", "day", "night"].map((m) => ({
      label: t({ auto: "auto", day: "day", night: "nightOn" }[m]), type: "radio", checked: nightMode === m,
      click: () => { nightMode = m; send({ type: "night", mode: m }); } })) },
    { label: t("language"), submenu: [["tr", "Türkçe"], ["en", "English"]].map(([k, name]) => ({
      label: name, type: "radio", checked: lang === k, click: () => { lang = k; refreshMenu(); send({ type: "lang", lang: k }); } })) },
    { type: "separator" },
    { label: t("catSize"), submenu: [
      { label: t("bigger"), click: () => send({ type: "bigger" }) },
      { label: t("smaller"), click: () => send({ type: "smaller" }) },
    ] },
    { label: t("toySize"), submenu: [
      { label: t("bigger"), click: () => send({ type: "toysBigger" }) },
      { label: t("smaller"), click: () => send({ type: "toysSmaller" }) },
    ] },
    { label: paused ? t("show") : t("hide"), click: () => { paused = !paused; paused ? win.hide() : win.showInactive(); refreshMenu(); } },
    { type: "separator" },
    { label: t("login"), type: "checkbox", checked: app.getLoginItemSettings().openAtLogin,
      click: (item) => app.setLoginItemSettings({ openAtLogin: item.checked }) },
    { label: t("quit"), click: () => app.quit() },
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
ipcMain.on("wand", (_e, on) => { wand = !!on; if (tray) tray.setContextMenu(buildMenu()); });
ipcMain.on("settings", (_e, o) => {
  if (o) { purrOn = o.purrOn !== false; meowOn = o.meowOn !== false; nightMode = o.nightMode || "auto"; if (T[o.lang]) lang = o.lang; tasksOn = o.tasksOn !== false; breedOn = o.breedOn !== false; seasonsOn = o.seasonsOn !== false; }
  refreshMenu();
});
ipcMain.on("coats", (_e, list) => { coats = Array.isArray(list) ? list : []; if (tray) tray.setContextMenu(buildMenu()); });

app.whenReady().then(() => {
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
