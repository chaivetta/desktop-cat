# Getting Desktop Cat onto Steam

A checklist of what is already in the code and what is still left to do.

## Already in the code

- **Save file (ready for Steam Cloud):** the game is saved to `save.json` in the app's data folder, next to the browser storage. It is written to a temporary file first and then swapped in. The previous save is kept as `save.bak.json`. If the browser storage is empty (on a new computer, or after Steam Cloud has brought a save over), the game loads from the file.
  In Steamworks → Steam Cloud → Auto-Cloud, add one root per platform:
  - Windows: `%APPDATA%/desktop-cat/save.json`
  - macOS: `~/Library/Application Support/desktop-cat/save.json`
  - Linux: `~/.config/desktop-cat/save.json`
- **Achievements:** every goal on the in-game Progress page also unlocks a Steam achievement named `ACH_<ID>`, for example `ACH_LVL5`, `ACH_GUESTS100` or `ACH_WIN1`. The full list is in `src/progress.js`. Steam is only used when the game was started from Steam and `steamworks.js` is installed. Without them nothing changes.
- **Steam build:** `npm run dist:steam` makes a plain folder build (`electron-builder --dir`). Steam ships folders, not installers or portable exes.

## To do

1. **Steamworks account:** pay the $100 Steam Direct fee, then fill in the tax and bank forms. You can't launch for 30 days after paying.
2. **Steamworks library:** run `npm i steamworks.js` and put your App ID into `steam_appid.txt` in the project root. It is copied next to the exe. Only keep it in test builds; Steam supplies the ID itself in the real release.
3. **Achievements in Steamworks:** create `ACH_<ID>` for every entry of `ACH` in `src/progress.js`, each with an icon and a name.
4. **Weather:** Open-Meteo's free API is for **non-commercial use only**. For a paid game, either buy their commercial plan, switch to another weather service, or keep weather off in the Steam build.
5. **Store page:** a capsule image, 5 or more screenshots (`docs/*.png` are a good start), a short trailer, a description, tags (Casual, Simulation, Cute, Pixel Graphics, Cats, Idle) and the age rating questionnaire.
6. **Desktop overlay notes:** say on the store page that the cats live on top of the desktop, in a click-through window, and that the tray icon opens Settings.
7. **Steam Inventory / trading (later):** making market items tradable on Steam needs items checked on a server, because anything stored locally can be edited. Random card packs bought with real money count as loot boxes in some countries, so keep paid packs out of those regions or show the drop rates.
8. **Test on all three platforms** with the Steam client running: check the save loads on a second computer through Steam Cloud, and check achievements pop.

*This is not legal advice. Read Valve's Steamworks documentation and their rules for your region.*
