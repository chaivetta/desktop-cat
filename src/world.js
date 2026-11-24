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
      b: { shop: "🛒 Pazar", park: "🌳 Park", square: "🎪 Meydan", map: "🌍 Harita", home: "🏠 Eve dön" },
      shopH: "Şehre özel pazar", shopNote: "Bu eşyalar sadece bu şehrin pazarında satılır.", bought: (n) => `🛍️ ${n} alındı!`, have: (n) => `Sende: ${n}`, cityPark: (c, b) => `${c} parkı · ${b}`,
      search: "Şehir ara…", none: "Bulunamadı",
    },
    en: {
      title: "World", views: { all: "🌍 All", europe: "Europe", asia: "Asia", africa: "Africa", americas: "Americas", oceania: "Oceania" },
      lv: (n) => `🐾 Level ${n}`, here: "📍 You are here", fly: (c) => `✈️ Fly · ${c}🪙`, flyHome: "🏠 Fly home · free", locked: (n) => `🔒 Opens at level ${n}`, enter: "🏙️ Enter the city",
      park: (b) => `🌳 Park: ${b}`, famous: (d) => `🍽️ Famous for: ${d}`, animal: (a) => `🐾 Its animal: ${a}`, items: (n) => `🛍️ ${n} things sold only here`, stamps: (a, b) => `🛂 ${a} / ${b} stamps`,
      landed: (f, n) => `✈️ ${f} You've landed in ${n}!`, first: (n) => `🛂 A new passport stamp: ${n}! +10🪙`, home: "Home", pick: "Tap a city on the map.",
      b: { shop: "🛒 Market", park: "🌳 Park", square: "🎪 Square", map: "🌍 Map", home: "🏠 Go home" },
      shopH: "This city's market", shopNote: "These are sold only in this city's market.", bought: (n) => `🛍️ Bought: ${n}`, have: (n) => `You have ${n}`, cityPark: (c, b) => `${c} park · ${b}`,
      search: "Find a city…", none: "Not found",
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

    // ---- flying
    function fly(c) {
      if (!open(c) || c.id === X().at) return; const price = cost(c); if (L.wallet.coins < price) return;
      L.wallet.coins -= price; X().at = c.id;
      const plane = document.createElement("div"); plane.className = "wm-plane"; plane.textContent = "✈️"; document.body.appendChild(plane); setTimeout(() => plane.remove(), 4200);
      setTimeout(() => {
        const s = t(); toast(s.landed(flagEmoji(c), c.name[L.lang]));
        if (!X().visited.includes(c.id)) { X().visited.push(c.id); L.earn(10); setTimeout(() => toast(s.first(c.name[L.lang])), 900); }
        if (L.albumAdd) L.albumAdd("cities", c.id);
        L.changed(); save(); mode = "city"; key = ""; render();
      }, 2600);
      L.changed(); save(); sel = c.id; key = ""; render();
    }
    const flagEmoji = (c) => "🛬";

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
      const k = [L.lang, mode, view, sel, x.at, x.visited.length, lvl(), L.wallet.coins, q, mode === "city" ? JSON.stringify(L.pantry) + L.home.items.length : ""].join("|"); if (k === key) return; key = k;
      const sc = root.querySelector(".mk-body"), keep = sc ? sc.scrollTop : 0;
      const head = `<div class="mk-head"><b>🌍 ${esc(s.title)}</b><span class="mk-wal"><span class="coin">🪙 ${L.wallet.coins}</span><span class="star">${esc(s.lv(lvl()))}</span></span><button type="button" class="st-x" data-a="close">×</button></div>`;
      if (mode === "city") { root.innerHTML = head + `<div class="mk-body">${cityHtml(cur, s)}</div>`; afterCity(cur); }
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
    function cityHtml(c, s) {
      const B = A.BIOMES[c.biome] || A.BIOMES.city;
      const items = WI.itemsOf(c.id).map((id) => {
        const f = DC.FURN[id], food = L.FOOD[id], names = food ? window.CatMarketSTR[L.lang].foods[id] : L.t("furn")[id], price = f ? f.price : food.price;
        const have = food ? L.pantry[id] || 0 : L.home.items.filter((i) => i.k === id).length;
        return `<div class="mk-card"><div class="mk-pic">${food ? `<div class="mk-emo">${food.e}</div>` : `<canvas width="96" height="72" data-f="${id}"></canvas>`}</div><b>${esc(names[0])}</b><small>${esc(names[1])}</small>
          <div class="mk-foot"><em>${have ? esc(s.have(have)) : ""}</em><button type="button" class="mk-buy" data-buy="${id}"${L.wallet.coins < price ? " disabled" : ""}>🪙 ${price}</button></div></div>`;
      }).join("");
      return `<div class="wm-sky"><canvas width="520" height="150" data-sky="${c.id}"></canvas><span class="wm-cityname"><i style="background:${flagCss(c)}"></i>${esc(c.name[L.lang])}</span></div>
        <div class="wm-builds">${["shop", "park", "square", "map", ...(c.id !== HOME ? ["home"] : [])].map((b) => `<button type="button" data-b="${b}">${esc(s.b[b])}</button>`).join("")}</div>
        <p class="mk-note">${esc(s.cityPark(c.name[L.lang], B[L.lang]))}</p>
        <h4 class="mk-h" id="wm-shop">🛒 ${esc(s.shopH)}</h4><p class="mk-note">${esc(s.shopNote)}</p><div class="mk-grid">${items}</div>`;
    }
    function afterCity(c) {
      const cv = root.querySelector("canvas[data-sky]"); if (cv) { const g = cv.getContext("2d"), B = A.BIOMES[c.biome]; g.fillStyle = "#bfe6ff"; g.fillRect(0, 0, 520, 150);
        if (B && B.bg) B.bg(g, 520, 150, 140, 2, (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.ceil(w), Math.ceil(h)); }, c);
        else { g.fillStyle = "#8fcf6b"; g.fillRect(0, 120, 520, 30); for (let i = 0; i < 8; i++) { const h = 30 + A.hash(i + 3) * 60; g.fillStyle = ["#f4ece0", "#e8dcc8", "#d8c8b0"][i % 3]; g.fillRect(i * 66 + 6, 120 - h, 50, h); g.fillStyle = "#7cc6e8"; for (let y = 120 - h + 6; y < 114; y += 12) g.fillRect(i * 66 + 14, y, 8, 6), g.fillRect(i * 66 + 34, y, 8, 6); } }
        // a few of the region's animals in the picture
        const list = [c.animal, ...(B ? B.animals : [])].filter((id) => A.ANIMALS[id] && !A.ANIMALS[id].swim).slice(0, 3);
        list.forEach((id, i) => A.drawAnimal(g, id, 90 + i * 150, A.ANIMALS[id].fly ? 40 : 140, 2, 0.4 + i, i % 2 ? -1 : 1, "idle")); }
      root.querySelectorAll("canvas[data-f]").forEach((cv) => DC.furnitureThumb(cv.dataset.f, cv.getContext("2d")));
    }
    root.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return; const d = b.dataset;
      if (d.a === "close") return close();
      if (d.view) { view = d.view; sel = null; }
      else if (d.city) { sel = d.city; q = ""; }
      else if (d.fly) { fly(WD.byId[d.fly]); return; }
      else if (d.enter) mode = "city";
      else if (d.b === "map") mode = "map";
      else if (d.b === "home") { fly(WD.byId[HOME]); mode = "map"; return; }
      else if (d.b === "shop") { const h = root.querySelector("#wm-shop"); if (h) h.scrollIntoView({ behavior: "smooth" }); return; }
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
    function openP() { root.hidden = false; key = ""; if (mode === "map" && !sel) sel = X().at; render(); place(); clearInterval(placeT); placeT = setInterval(() => { place(); render(); }, 600); o.onOpen && o.onOpen(); }
    function close() { root.hidden = true; clearInterval(placeT); o.onClose && o.onClose(); }
    addEventListener("keydown", (e) => { if (e.key === "Escape" && !root.hidden) close(); });
    // where the park is today: the city you're in
    const parkWhere = () => { const c = here(); return { biome: c.biome, city: c }; };
    world.onAnimalSeen = (id) => L.albumAdd && L.albumAdd("animals", id);
    setTimeout(() => { if (L.albumAdd) L.albumAdd("cities", X().at); }, 2000);
    return { open: openP, close, get isOpen() { return !root.hidden; }, here, parkWhere, fly, t };
  }
  window.CatWorld = { create };
})();
