// 🌍 The world: a pixel map with every capital on it. Cities open with your level; fly there (coins), get a passport stamp,
// shop its market for things you can't get anywhere else, and take your cats to its park (a beach, the pole, the jungle…).
(() => {
  const L = window.CatLife, DC = window.DesktopCat, WD = window.CatWorldData, A = window.CatWorldArt, WI = window.CatWorldItems;
  const HOME = "ankara", MW = 360, MH = 150, LAT0 = 80, LAT1 = -60;
  // ---- the land mask
  const land = new Uint8Array(MW * MH);
  window.CatWorldMask.split("|").forEach((row, y) => { let x = 0, v = 0; for (const r of row.split(".")) { const n = parseInt(r, 36); if (v) land.fill(1, y * MW + x, y * MW + x + n); x += n; v ^= 1; } });
  const isLand = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH && land[y * MW + x];
  // what colour the land is: ice, desert, rainforest, taiga or green
  function landCol(x, y) {
    const lon = -180 + (x + 0.5), lat = LAT0 - (y + 0.5) * (LAT0 - LAT1) / MH, n = A.hash(x * 131 + y * 7) * 0.08;
    if (lat > 68 || lat < -58 || (lon < -20 && lon > -75 && lat > 60)) return n > 0.04 ? "#f4f8ff" : "#e4ecf8";
    const desert = (lat > 14 && lat < 34 && lon > -17 && lon < 60) || (lat > 36 && lat < 48 && lon > 52 && lon < 112) || (lat < -19 && lat > -32 && lon > 118 && lon < 145) || (lat < -18 && lat > -30 && lon > 12 && lon < 26) || (lat > 25 && lat < 38 && lon > -118 && lon < -103) || (lat > 15 && lat < 30 && lon > 62 && lon < 75);
    if (desert) return n > 0.04 ? "#ecd38c" : "#e0c47a";
    const rain = Math.abs(lat) < 11 && ((lon > -78 && lon < -45) || (lon > 9 && lon < 31) || (lon > 95 && lon < 152));
    if (rain) return n > 0.04 ? "#3f8a3a" : "#357a32";
    if (lat > 50) return n > 0.04 ? "#5f9a5a" : "#548e50";
    return n > 0.04 ? "#8fd36b" : "#82c860";
  }
  const VIEWS = { all: [-170, 180, 80, -60], europe: [-26, 46, 71, 33], asia: [24, 150, 58, -12], africa: [-26, 60, 38, -37], americas: [-128, -30, 64, -57], oceania: [100, 182, 12, -48] };
  const STR = {
    tr: {
      title: "Dünya", views: { all: "🌍 Tümü", europe: "Avrupa", asia: "Asya", africa: "Afrika", americas: "Amerika", oceania: "Okyanusya" },
      lv: (n) => `🐾 Seviye ${n}`, here: "📍 Buradasın", fly: (c) => `✈️ Uç · ${c}🪙`, flyHome: "🏠 Eve uç · ücretsiz", locked: (n) => `🔒 Seviye ${n} olunca açılır`, enter: "🏙️ Şehre gir",
      park: (b) => `🌳 Park: ${b}`, famous: (d) => `🍽️ Meşhur: ${d}`, animal: (a) => `🐾 Hayvanı: ${a}`, items: (n) => `🛍️ ${n} şehre özel ürün`, stamps: (a, b) => `🛂 ${a} / ${b} damga`,
      landed: (f, n) => `✈️ ${f} ${n}'e vardın!`, first: (n) => `🛂 Pasaportuna yeni damga: ${n}! +10🪙`, home: "Ev", pick: "Haritada bir şehre dokun.",
      b: { shop: "🛒 Pazar", park: "🌳 Park", square: "🎪 Meydan", airport: "✈️ Havalimanı", map: "🌍 Harita", home: "🏠 Eve dön" }, tapBld: "Bir binanın tabelasına dokun, içeri gir.",
      shopH: "Şehre özel pazar", shopNote: "Bu eşyalar sadece bu şehrin pazarında satılır.", bought: (n) => `🛍️ ${n} alındı!`, have: (n) => `Sende: ${n}`, cityPark: (c, b) => `${c} parkı · ${b}`,
      search: "Şehir ara…", none: "Bulunamadı", parkFirst: "🌳 Önce kedilerin parktan dönsün, sonra uçalım.", flying: (n) => `${n} yolundayız`, left: (t2) => `⏳ İnişe ${t2} kaldı`, cabin: "Kedilerin uçakta, ekranın altındaki kabinde: koltuklarda kıvrılıyor, pencereden bulutları izliyorlar.",
    },
    en: {
      title: "World", views: { all: "🌍 All", europe: "Europe", asia: "Asia", africa: "Africa", americas: "Americas", oceania: "Oceania" },
      lv: (n) => `🐾 Level ${n}`, here: "📍 You are here", fly: (c) => `✈️ Fly · ${c}🪙`, flyHome: "🏠 Fly home · free", locked: (n) => `🔒 Opens at level ${n}`, enter: "🏙️ Enter the city",
      park: (b) => `🌳 Park: ${b}`, famous: (d) => `🍽️ Famous for: ${d}`, animal: (a) => `🐾 Its animal: ${a}`, items: (n) => `🛍️ ${n} things sold only here`, stamps: (a, b) => `🛂 ${a} / ${b} stamps`,
      landed: (f, n) => `✈️ ${f} You've landed in ${n}!`, first: (n) => `🛂 A new passport stamp: ${n}! +10🪙`, home: "Home", pick: "Tap a city on the map.",
      b: { shop: "🛒 Market", park: "🌳 Park", square: "🎪 Square", airport: "✈️ Airport", map: "🌍 Map", home: "🏠 Go home" }, tapBld: "Tap a building's sign to go in.",
      shopH: "This city's market", shopNote: "These are sold only in this city's market.", bought: (n) => `🛍️ Bought: ${n}`, have: (n) => `You have ${n}`, cityPark: (c, b) => `${c} park · ${b}`,
      search: "Find a city…", none: "Not found", parkFirst: "🌳 Let the cats come back from the park first, then we'll fly.", flying: (n) => `On our way to ${n}`, left: (t2) => `⏳ Landing in ${t2}`, cabin: "Your cats are on the plane, in the cabin at the bottom of the screen: curled up in the seats, watching the clouds go by.",
    },
  };
  const t = () => STR[L.lang] || STR.en;
  const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const flagCss = (c) => `linear-gradient(180deg, ${c.flag.map((col, i, a) => `${col} ${(i / a.length) * 100}% ${((i + 1) / a.length) * 100}%`).join(",")})`;
  const km = (a, b) => { const r = Math.PI / 180, d = Math.sin((b.lat - a.lat) * r / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin((b.lon - a.lon) * r / 2) ** 2; return 12742 * Math.asin(Math.sqrt(d)); };

  function create(o) {
    const { world, save, toast } = o;
    const X = () => { const x = (L.extra.world = L.extra.world || {}); x.at = x.at || HOME; x.visited = x.visited || [HOME]; return x; };
    const here = () => WD.byId[X().at] || WD.byId[HOME];
    const lvl = () => (L.prog ? L.prog.lvl : 1);
    const open = (c) => lvl() >= c.lv;
    const cost = (c) => (c.id === HOME ? 0 : Math.min(90, 8 + Math.round(km(here(), c) / 450)));

    // ---- flying: it takes a while (30 seconds to 3 minutes, by distance); the cats ride in the cabin at the bottom of the screen
    const flightSecs = (a, b) => Math.round(Math.min(180, Math.max(30, 30 + km(a, b) / 20000 * 150)));
    function fly(c) {
      if (!open(c) || c.id === X().at || X().flight) return; const price = cost(c); if (L.wallet.coins < price) return;
      if (world.park) { toast(t().parkFirst); return; }
      L.wallet.coins -= price;
      const now = Date.now(); X().flight = { to: c.id, from: X().at, start: now, until: now + flightSecs(here(), c) * 1000 };
      board(); // take-off: a drawn airliner climbs slowly across the top of the screen
      const k = 3, plane = document.createElement("canvas"); plane.width = 70 * k + 40 * k; plane.height = 30 * k; plane.className = "wm-plane";
      let pt = 0; const draw = () => { const g = plane.getContext("2d"); g.clearRect(0, 0, plane.width, plane.height); window.CatWorldArt.drawPlane(g, 34 * k, 2 * k, k, pt); pt += 0.1; };
      draw(); const pi = setInterval(draw, 100); document.body.appendChild(plane); setTimeout(() => { clearInterval(pi); plane.remove(); }, 14200);
      L.changed(); save(); sel = c.id; mode = "flight"; key = ""; render();
    }
    function board() { const F = X().flight; if (!F || world.park) return; const ids = world.cats.filter((k) => k.profile && !k.profile.guest && !k.jobOff).map((k) => k.profile.id); world.enterPark(ids, 0, { biome: "plane", city: WD.byId[F.to] }); world.park.flight = F; }
    function land() {
      const F = X().flight; if (!F) return; const c = WD.byId[F.to]; X().flight = null; X().at = c.id;
      if (world.park && world.park.biome === "plane") world.exitPark();
      const s = t(); toast(s.landed(flagEmoji(c), c.name[L.lang]));
      if (!X().visited.includes(c.id)) { X().visited.push(c.id); L.earn(10); setTimeout(() => toast(s.first(c.name[L.lang])), 900); }
      if (L.albumAdd) L.albumAdd("cities", c.id); if (L.gainPXP) L.gainPXP(5);
      L.changed(); save(); mode = "city"; key = ""; if (!root.hidden) render();
    }
    setInterval(() => { const F = X().flight; if (!F) return; if (Date.now() >= F.until) land(); else if (!world.park) board(); if (!root.hidden && mode === "flight") { key = ""; render(); } }, 1000);
    const flagEmoji = () => "🛬";

    // ---- the panel
    const root = document.createElement("div"); root.className = "ui mk wm"; root.hidden = true; document.body.appendChild(root);
    let view = "all", sel = null, mode = "map", key = "", placeT = 0, q = "";
    const mapCv = document.createElement("canvas"); mapCv.width = 1040; mapCv.height = 520;
    function drawMap() {
      const [lo0, lo1, la0, la1] = VIEWS[view], g = mapCv.getContext("2d"), W = mapCv.width, H = mapCv.height;
      g.fillStyle = "#7cc6e8"; g.fillRect(0, 0, W, H);
      const x0 = Math.floor(lo0 + 180), x1 = Math.ceil(lo1 + 180), y0 = Math.floor((LAT0 - la0) / (LAT0 - LAT1) * MH), y1 = Math.ceil((LAT0 - la1) / (LAT0 - LAT1) * MH);
      const cw = W / (x1 - x0), ch = H / (y1 - y0);
      for (let i = 0; i < 260; i++) { g.fillStyle = "#8fd0ef"; g.fillRect(A.hash(i + 1) * W, A.hash(i + 99) * H, cw * 2, Math.max(1, ch / 3)); }
      for (let y = y0; y < y1; y++) for (let xx = x0; xx < x1; xx++) { const x = ((xx % MW) + MW) % MW; if (!isLand(x, y)) continue;
        const px = Math.floor((xx - x0) * cw), py = Math.floor((y - y0) * ch), pw = Math.ceil(cw), ph = Math.ceil(ch);
        if (!isLand(x, y - 1)) { g.fillStyle = "#5fae54"; g.fillRect(px, py - Math.max(1, ch / 4), pw, Math.max(1, ch / 4)); }
        g.fillStyle = landCol(x, y); g.fillRect(px, py, pw, ph);
        if (!isLand(x, y + 1)) { g.fillStyle = "rgba(60,90,50,.5)"; g.fillRect(px, py + ph - Math.max(1, ch / 4), pw, Math.max(1, ch / 4)); } }
      return { proj: (c) => [((c.lon + 180 - x0) / (x1 - x0)) * 100, ((LAT0 - c.lat) / (LAT0 - LAT1) * MH - y0) / (y1 - y0) * 100] };
    }
    function render() {
      const s = t(), x = X(), cur = here();
      const k = [L.lang, mode, view, sel, x.at, x.flight ? Math.floor(Date.now() / 1000) : 0, x.visited.length, lvl(), L.wallet.coins, q, mode !== "map" ? JSON.stringify(L.pantry) + L.home.items.length : ""].join("|"); if (k === key) return; key = k;
      const sc = root.querySelector(".mk-body"), keep = sc ? sc.scrollTop : 0;
      const head = `<div class="mk-head"><b>🌍 ${esc(s.title)}</b><span class="mk-wal"><span class="coin">🪙 ${L.wallet.coins}</span><span class="star">${esc(s.lv(lvl()))}</span></span><button type="button" class="st-x" data-a="close">×</button></div>`;
      if (x.flight) { const F = x.flight, to = WD.byId[F.to], from = WD.byId[F.from] || cur, left = Math.max(0, Math.ceil((F.until - Date.now()) / 1000)), q = Math.min(1, (Date.now() - F.start) / (F.until - F.start));
        root.innerHTML = head + `<div class="mk-body"><div class="wm-flight"><b>✈️ ${esc(s.flying(to.name[L.lang]))}</b><div class="wm-route"><span>${esc(from.name[L.lang])}</span><div class="wm-track"><i style="width:${q * 100}%"></i><em style="left:${q * 100}%">✈️</em></div><span>${esc(to.name[L.lang])}</span></div>
          <p class="wm-left">${esc(s.left(`${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`))}</p><p class="mk-note">${esc(s.cabin)}</p></div></div>`; return; }
      if (mode === "city" || mode === "shop") { root.innerHTML = head + `<div class="mk-body">${mode === "shop" ? shopHtml(cur, s) : cityHtml(cur, s)}</div>`; afterCity(cur); }
      else {
        const { proj } = drawMap(), [lo0, lo1, la0, la1] = VIEWS[view];
        const vis = WD.CITIES.filter((c) => c.lon >= lo0 - 1 && c.lon <= lo1 + 1 && c.lat <= la0 + 1 && c.lat >= la1 - 1);
        const c = sel && WD.byId[sel];
        const found = q ? WD.CITIES.filter((c2) => (c2.name.tr + " " + c2.name.en + " " + c2.country.tr + " " + c2.country.en).toLocaleLowerCase("tr").includes(q.toLocaleLowerCase("tr"))).slice(0, 6) : [];
        root.innerHTML = head + `<div class="mk-body">
          <div class="wm-views">${Object.keys(VIEWS).map((v) => `<button type="button" data-view="${v}" class="${v === view ? "on" : ""}">${esc(s.views[v])}</button>`).join("")}</div>
          <div class="wm-map v-${view}"><img alt="" src="${mapCv.toDataURL()}">${vis.map((c2) => { const [px, py] = proj(c2), on = open(c2), vis2 = x.visited.includes(c2.id);
            return `<button type="button" class="wm-pin${on ? "" : " lock"}${vis2 ? " been" : ""}${c2.id === x.at ? " at" : ""}${c2.id === sel ? " sel" : ""}" data-city="${c2.id}" style="left:${px}%;top:${py}%;--fl:${flagCss(c2)}" title="${esc(c2.name[L.lang])} · ${esc(c2.country[L.lang])}${on ? "" : ` · 🔒 ${c2.lv}`}"><i></i></button>`; }).join("")}
            ${(() => { const [px, py] = proj(cur); return `<span class="wm-me" style="left:${px}%;top:${py}%">🐱</span>`; })()}</div>
          <div class="wm-find"><input type="search" placeholder="${esc(s.search)}" value="${esc(q)}">${q ? `<div class="wm-found">${found.length ? found.map((c2) => `<button type="button" data-city="${c2.id}">${esc(c2.name[L.lang])} · <small>${esc(c2.country[L.lang])}</small></button>`).join("") : `<small>${esc(s.none)}</small>`}</div>` : ""}</div>
          <p class="wm-stamps">${esc(s.stamps(x.visited.length, WD.CITIES.length))} · 📍 ${esc(cur.name[L.lang])}</p>
          ${c ? cardHtml(c, s) : `<p class="mk-note">${esc(s.pick)}</p>`}</div>`;
        const inp = root.querySelector(".wm-find input"); if (inp && q) { inp.focus(); inp.setSelectionRange(q.length, q.length); }
        root.querySelectorAll("canvas[data-an]").forEach((cv) => cv.getContext("2d").drawImage(A.animalThumb(cv.dataset.an), 0, 0));
      }
      const nb = root.querySelector(".mk-body"); if (nb && keep) nb.scrollTop = keep;
    }
    function cardHtml(c, s) {
      const B = A.BIOMES[c.biome] || A.BIOMES.city, an = A.ANIMALS[c.animal], x = X(), on = open(c), atHere = c.id === x.at, price = cost(c);
      return `<div class="wm-card"><span class="wm-flag" style="background:${flagCss(c)}"></span><div class="wm-ci"><b>${esc(c.name[L.lang])}</b><small>${esc(c.country[L.lang])} · ${esc(WD.REGION[c.region][L.lang])}</small></div>
        ${an ? `<canvas width="48" height="40" data-an="${c.animal}"></canvas>` : ""}</div>
        <ul class="wm-facts"><li>${esc(s.park(B[L.lang]))}</li><li>${esc(s.famous(`${c.dishE} ${c.dish[L.lang]}`))}</li>${an ? `<li>${esc(s.animal(an[L.lang]))}</li>` : ""}<li>${esc(s.items(WI.itemsOf(c.id).length))}</li></ul>
        ${!on ? `<button type="button" class="mk-wide" disabled>${esc(s.locked(c.lv))}</button>`
          : atHere ? `<button type="button" class="mk-wide gold" data-enter="1">${esc(s.enter)}</button>`
          : `<button type="button" class="mk-wide gold" data-fly="${c.id}"${L.wallet.coins < price ? " disabled" : ""}>${esc(c.id === HOME ? s.flyHome : s.fly(price))}</button>`}`;
    }
    // ---- the city: a pixel street with its buildings; each building has a sign you tap to go in
    const BLD = [["shop", 6, 66, 68], ["park", 148, 50, 84], ["airport", 204, 52, 60]];      // id, x, width, where its sign hangs
    function cityHtml(c, s) {
      return `<div class="wm-street"><canvas width="260" height="170" data-street="${c.id}"></canvas>
        ${BLD.map(([b, x, w, y]) => `<button type="button" class="wm-bld" data-b="${b}" style="left:${(x / 260) * 100}%;width:${(w / 260) * 100}%;--sy:${(y / 170) * 100}%"><span>${esc(s.b[b])}</span></button>`).join("")}
        <span class="wm-cityname"><i style="background:${flagCss(c)}"></i>${esc(c.name[L.lang])}</span>
        ${c.id !== HOME ? `<button type="button" class="wm-homebtn" data-b="home" title="${esc(s.b.home)}">🏠</button>` : ""}</div>
        <p class="mk-note">${esc(s.tapBld)}</p>
        <ul class="wm-facts"><li>${esc(s.park((A.BIOMES[c.biome] || A.BIOMES.city)[L.lang]))}</li><li>${esc(s.famous(`${c.dishE} ${c.dish[L.lang]}`))}</li></ul>`;
    }
    function shopHtml(c, s) {
      const items = WI.itemsOf(c.id).map((id) => {
        const f = DC.FURN[id], food = L.FOOD[id], names = food ? window.CatMarketSTR[L.lang].foods[id] : L.t("furn")[id], price = f ? f.price : food.price;
        const have = food ? L.pantry[id] || 0 : L.home.items.filter((i) => i.k === id).length;
        return `<div class="mk-card"><div class="mk-pic">${food ? `<div class="mk-emo">${food.e}</div>` : `<canvas width="96" height="72" data-f="${id}"></canvas>`}</div><b>${esc(names[0])}</b><small>${esc(names[1])}</small>
          <div class="mk-foot"><em>${have ? esc(s.have(have)) : ""}</em><button type="button" class="mk-buy" data-buy="${id}"${L.wallet.coins < price ? " disabled" : ""}>🪙 ${price}</button></div></div>`;
      }).join("");
      return `<div class="wm-shophead"><button type="button" data-b="back">← ${esc(c.name[L.lang])}</button><b>🛒 ${esc(s.shopH)}</b></div>
        <div class="wm-shopsign"><canvas width="260" height="60" data-shopsign="${c.id}"></canvas></div>
        <p class="mk-note">${esc(s.shopNote)}</p><div class="mk-grid">${items}</div>`;
    }
    // building styles by the part of the world
    const STYLE = {
      desert: { wall: "#e8cf98", dk: "#c8a868", roof: "dome", rc: "#e0b866" }, savanna: { wall: "#d8a870", dk: "#b8884a", roof: "thatch", rc: "#c8a050" },
      jungle: { wall: "#c8a070", dk: "#a8804a", roof: "thatch", rc: "#a88a3a" }, island: { wall: "#f4e4c4", dk: "#d8c49a", roof: "thatch", rc: "#c8a050" },
      polar: { wall: "#c8463a", dk: "#9a3228", roof: "snow", rc: "#4a3a3a" }, taiga: { wall: "#8a5a32", dk: "#6a4426", roof: "snow", rc: "#4a2e1e" }, fjord: { wall: "#b8342a", dk: "#8a2420", roof: "snow", rc: "#3a3a3a" },
      sakura: { wall: "#f4ece0", dk: "#d8cbb8", roof: "pagoda", rc: "#3a4a5a" }, bamboo: { wall: "#f4ece0", dk: "#d8cbb8", roof: "pagoda", rc: "#2a6a5a" },
      med: { wall: "#fbfbfd", dk: "#d8dce4", roof: "flat", rc: "#2a6ad8" }, mountain: { wall: "#f0e6d4", dk: "#c8b898", roof: "chalet", rc: "#6a4426" },
      steppe: { wall: "#f4ece0", dk: "#d8c8b0", roof: "yurt", rc: "#c8402a" }, pampas: { wall: "#f0e0c8", dk: "#d0b890", roof: "tile", rc: "#c86a3a" },
      outback: { wall: "#e8d4b8", dk: "#c8a888", roof: "tin", rc: "#9aa2b0" }, city: { wall: "#e8b088", dk: "#c88a62", roof: "tile", rc: "#a8483a" },
    };
    function drawStreet(cv, c) {
      const g = cv.getContext("2d"), W = 260, H = 170, f = 128, B = A.BIOMES[c.biome], st = STYLE[c.biome] || STYLE.city;
      const p = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.ceil(w), Math.ceil(h)); };
      g.fillStyle = "#bfe6ff"; g.fillRect(0, 0, W, H);
      if (B && B.bg) B.bg(g, W, H, f + 2, 1, p, c); else { p(0, 0, W, f, "#cdeefe"); for (let i = 0; i < 5; i++) p(20 + i * 52, 20 + (i % 2) * 10, 22, 4, "#fff"); }
      // the city's landmark behind the buildings (its first souvenir, drawn big), or a flag on a tall pole
      const sv = WI.itemsOf(c.id).find((id) => id.startsWith("sv_") && DC.FURN[id].draw && DC.FURN[id].h >= 26);
      if (sv) { const img = DC.FURN[sv].draw(), sc = Math.min(1.6, 80 / img.height); g.imageSmoothingEnabled = false; g.drawImage(img, Math.round(140 - img.width * sc / 2), Math.round(f - img.height * sc - 26), Math.round(img.width * sc), Math.round(img.height * sc)); }
      // a building in the local style
      const bld = (x, w, h, kind) => {
        const y = f - h; p(x, y, w, h, st.wall); p(x, y + h - 3, w, 3, st.dk); for (let i = x + 4; i < x + w - 4; i += 10) { p(i, y + 8, 6, 7, "#9ad4f4"); p(i, y + 8, 6, 1, "#ffffff"); p(i, y + 15, 6, 1, st.dk); }
        p(x + w / 2 - 5, f - 14, 10, 14, "#6a4426"); p(x + w / 2 - 4, f - 13, 8, 13, "#8a5a32"); p(x + w / 2 + 2, f - 7, 1, 1, "#ffd34d");
        if (st.roof === "dome") { for (let i = 0; i < 12; i++) { const ww = Math.round(Math.sqrt(144 - (12 - i) * (12 - i)) * 1.6); p(x + w / 2 - ww / 2, y - 12 + i, ww, 1, st.rc); } p(x + w / 2, y - 15, 1, 3, "#ffd34d"); }
        else if (st.roof === "thatch") { for (let i = 0; i < 10; i++) p(x - 4 + i, y - 10 + i, w + 8 - i * 2, 1, i % 2 ? st.rc : "#d8b868"); }
        else if (st.roof === "snow") { for (let i = 0; i < 12; i++) p(x + w / 2 - (i * w / 22) - 2, y - 12 + i, (i * w / 11) + 4, 1, st.rc); p(x + w / 2 - 6, y - 13, 12, 2, "#f4f8ff"); for (let i = 0; i < 12; i += 3) p(x + w / 2 - (i * w / 22) - 3, y - 12 + i, 3, 1, "#f4f8ff"); }
        else if (st.roof === "pagoda") { p(x - 6, y - 4, w + 12, 4, st.rc); p(x - 8, y - 5, 4, 2, st.rc); p(x + w + 4, y - 5, 4, 2, st.rc); p(x + 4, y - 9, w - 8, 5, "#c8323c"); p(x, y - 12, w, 3, st.rc); }
        else if (st.roof === "chalet") { for (let i = 0; i < 14; i++) p(x + w / 2 - i * (w / 26) - 3, y - 14 + i, i * (w / 13) + 6, 1, st.rc); p(x + w / 2 - 4, y - 10, 8, 6, "#ffe9a0"); }
        else if (st.roof === "yurt") { for (let i = 0; i < 10; i++) p(x + 4 - i * 0.4, y - 10 + i, w - 8 + i * 0.8, 1, i % 3 ? "#f4ece0" : st.rc); }
        else if (st.roof === "flat") { p(x - 2, y - 3, w + 4, 3, st.rc); }
        else if (st.roof === "tin") { p(x - 3, y - 6, w + 6, 6, st.rc); for (let i = x - 3; i < x + w + 3; i += 3) p(i, y - 6, 1, 6, "#c8ced8"); }
        else { for (let i = 0; i < 10; i++) p(x + w / 2 - i * (w / 18) - 2, y - 10 + i, i * (w / 9) + 4, 1, i % 2 ? st.rc : "#c85a48"); }
      };
      // 🛒 the market: an awning, crates of fruit
      bld(6, 66, 40); for (let i = 0; i < 66; i += 6) p(6 + i, f - 46, 6, 6, (i / 6) % 2 ? "#ffffff" : "#e2414e"); for (let i = 0; i < 66; i += 6) p(7 + i, f - 40, 4, 2, (i / 6) % 2 ? "#ffffff" : "#e2414e");
      for (const [cx, col] of [[10, "#ff6a3a"], [52, "#ffd34d"], [60, "#7cc46a"]]) { p(cx, f - 8, 8, 8, "#a8743a"); p(cx + 1, f - 10, 6, 3, col); }
      // the street is the square: a house in the local style, bunting, a fountain and the country's flag
      p(80, f - 3, 60, 3, "#d8c8b0"); bld(96, 34, 30);
      for (let x = 80; x < 140; x += 5) { p(x, f - 42 + Math.round(Math.sin(x / 7) * 2), 3, 3, ["#e2414e", "#ffd34d", "#3aa6e0", "#7cc46a"][(x / 5) % 4]); }
      p(132, f - 50, 1, 50, "#6a6a72"); c.flag.forEach((col, i) => p(133, f - 50 + i * (10 / c.flag.length), 14, Math.ceil(10 / c.flag.length), col));
      p(82, f - 10, 12, 7, "#c8ced8"); p(84, f - 12, 8, 2, "#7ac0f0"); p(87, f - 17, 2, 5, "#bfe6ff");
      // 🌳 the park gate with trees behind
      for (const tx of [152, 166, 186]) { p(tx + 2, f - 16, 3, 16, "#6a4a2a"); p(tx - 4, f - 30, 16, 14, "#4f9a45"); p(tx - 2, f - 34, 12, 5, "#6fb855"); }
      p(148, f - 26, 4, 26, "#8a5a32"); p(194, f - 26, 4, 26, "#8a5a32"); p(146, f - 30, 54, 5, "#8a5a32"); p(150, f - 29, 46, 3, "#a8743a"); for (let x = 152; x < 194; x += 4) p(x, f - 10, 2, 10, "#e8d6b8"); p(150, f - 8, 44, 2, "#e8d6b8");
      // ✈️ the airport: a control tower, a hangar and a plane
      p(206, f - 18, 34, 18, "#c8ced8"); for (let i = 0; i < 6; i++) p(206 + i * 2, f - 24 + i, 34 - i * 4 + 0, 1, "#9aa2b0"); p(212, f - 12, 22, 12, "#5a6474");
      p(242, f - 46, 8, 46, "#e8ecf2"); p(239, f - 54, 14, 8, "#3a4a6a"); p(240, f - 53, 12, 5, "#9ad4f4"); p(245, f - 58, 2, 4, "#e2414e");
      p(212, f - 34, 22, 4, "#fbfbfd"); p(220, f - 40, 4, 16, "#fbfbfd"); p(212, f - 37, 3, 4, "#fbfbfd"); p(231, f - 34, 3, 2, "#3aa6e0");
      // the street
      p(0, f, W, 5, "#d8d0c4"); p(0, f + 5, W, 22, "#6a6e78"); for (let x = 4; x < W; x += 14) p(x, f + 15, 7, 2, "#f4f0e6"); p(0, f + 27, W, H - f - 27, "#d8d0c4");
      // the city's animal and a couple of cats out for a walk
      const mine = world.cats.filter((k) => k.profile).slice(0, 2);
      mine.forEach((k, i) => { const t2 = document.createElement("canvas"); t2.width = 48; t2.height = 42; DC.portrait(t2.getContext("2d"), k.coat, { scale: 1, dx: 0, dy: 0, acc: k.profile.acc || {}, genes: k.profile.genes, pose: i ? "sit" : "walk", phase: 0.3, t: 1 }); g.imageSmoothingEnabled = false; g.drawImage(t2, 0, 0, 48, 42, 40 + i * 56, f + 40 - 26, 30, 26); });
    }
    function drawShopSign(cv, c) {
      const g = cv.getContext("2d"), st = STYLE[c.biome] || STYLE.city, p = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
      p(0, 0, 260, 60, st.wall); for (let i = 0; i < 260; i += 10) p(i, 0, 10, 10, (i / 10) % 2 ? "#ffffff" : "#e2414e"); for (let i = 0; i < 260; i += 10) p(i + 2, 10, 6, 3, (i / 10) % 2 ? "#ffffff" : "#e2414e");
      p(0, 52, 260, 8, st.dk); const ids = WI.itemsOf(c.id).filter((id) => DC.FURN[id]).slice(0, 6);
      ids.forEach((id, i) => { const img = DC.FURN[id].draw ? DC.FURN[id].draw() : null; if (!img) return; const sc = Math.min(1, 36 / img.height, 38 / img.width); g.imageSmoothingEnabled = false; g.drawImage(img, Math.round(14 + i * 42 + (38 - img.width * sc) / 2), Math.round(52 - img.height * sc), Math.round(img.width * sc), Math.round(img.height * sc)); });
    }
    function afterCity(c) {
      const cv = root.querySelector("canvas[data-street]"); if (cv) drawStreet(cv, c);
      const sg = root.querySelector("canvas[data-shopsign]"); if (sg) drawShopSign(sg, c);
      root.querySelectorAll("canvas[data-f]").forEach((cv2) => DC.furnitureThumb(cv2.dataset.f, cv2.getContext("2d")));
    }
    root.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return; const d = b.dataset;
      if (d.a === "close") return close();
      if (X().flight && !d.a) return;
      if (d.view) { view = d.view; sel = null; }
      else if (d.city) { sel = d.city; q = ""; }
      else if (d.fly) { fly(WD.byId[d.fly]); return; }
      else if (d.enter) mode = "city";
      else if (d.b === "map" || d.b === "airport") mode = "map";
      else if (d.b === "back") mode = "city";
      else if (d.b === "home") { fly(WD.byId[HOME]); mode = "map"; return; }
      else if (d.b === "shop") { mode = "shop"; const nb = root.querySelector(".mk-body"); if (nb) nb.scrollTop = 0; }
      else if (d.b === "park") { if (window.CatHub.now) window.CatHub.now.open("park"); return; }
      else if (d.b === "square") { if (window.CatHub.now) window.CatHub.now.open("events"); return; }
      else if (d.buy) { buy(d.buy, b); }
      key = ""; render();
    });
    root.addEventListener("input", (e) => { if (e.target.matches(".wm-find input")) { q = e.target.value; key = ""; render(); } });
    function buy(id, btn) {
      const f = DC.FURN[id], food = L.FOOD[id], price = f ? f.price : food.price; if (L.wallet.coins < price) return;
      L.wallet.coins -= price;
      if (food) L.pantry[id] = (L.pantry[id] || 0) + (food.n || 1);
      else { const it = { id: Math.random().toString(36).slice(2, 9), k: id, cond: 100, x: null }; L.home.items.push(it); if (o.placeItem) o.placeItem(it); }
      const nm = food ? window.CatMarketSTR[L.lang].foods[id][0] : L.t("furn")[id][0]; toast(t().bought(nm)); if (L.gainPXP) L.gainPXP(3);
      L.changed(); save();
    }
    function place() {
      if (window.CatCard.beside(root)) return;
      const bottom = Math.max(12, innerHeight - world.floor + 10);
      root.style.height = ""; root.style.left = "auto"; root.style.right = "14px"; root.style.top = "auto"; root.style.bottom = `${bottom + 52}px`;
      root.style.setProperty("--maxh", `${Math.max(300, innerHeight - bottom - 80)}px`);
    }
    function openP() { root.hidden = false; key = ""; if (X().flight) mode = "flight"; else if (mode === "flight") mode = "city"; if (mode === "map" && !sel) sel = X().at; render(); place(); clearInterval(placeT); placeT = setInterval(() => { place(); render(); }, 600); o.onOpen && o.onOpen(); }
    function close() { root.hidden = true; clearInterval(placeT); o.onClose && o.onClose(); }
    addEventListener("keydown", (e) => { if (e.key === "Escape" && !root.hidden) close(); });
    // where the park is today: the city you're in
    const parkWhere = () => { const c = here(); return { biome: c.biome, city: c }; };
    world.onAnimalSeen = (id) => L.albumAdd && L.albumAdd("animals", id);
    setTimeout(() => { if (L.albumAdd) L.albumAdd("cities", X().at); const F = X().flight; if (F) { if (Date.now() >= F.until) land(); else board(); } }, 2500);
    return { open: openP, close, get isOpen() { return !root.hidden; }, here, parkWhere, fly, t };
  }
  window.CatWorld = { create };
})();
