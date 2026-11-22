// The ⚙️ settings panel: everything that used to live in the tray menu, on screen next to the cats.
(() => {
  const STR = {
    tr: {
      title: "Ayarlar", market: "Market: mama ve eşya", cats: "Kediler", adopt: "Sahiplen", surprise: "Sürpriz kedi", count: (n, m) => `${n}/${m} kedi`, cards: "Kedi kartları",
      removeAll: "Tüm kedileri kaldır", sure: "Emin misin? Tekrar dokun",
      toys: "Oyuncaklar", yarn: "Yumak", mouse: "Kurmalı fare", box: "Kutu", feed: "Mama ver", catnip: "Kedi otu", butterfly: "Kelebek",
      post: "Tırmalama direği", shelf: "Duvar rafı", bird: "Kuş çağır", stray: "Sokak kedisi çağır", laser: "Lazer", wand: "Tüylü olta", clear: "Oyuncakları topla",
      play: "Oyun", game: "🔴 Lazer avı oyna", best: (n) => `Rekor: ${n}`,
      sizes: "Boyutlar", catSize: "Kedi boyu", toySize: "Oyuncak boyu", cardSize: "Kart boyu",
      sound: "Ses", purr: "Mırlama", meow: "Miyavlama",
      world: "Dünya", night: "Gece ve gündüz", auto: "Saate göre", day: "Gündüz", nightOn: "Gece",
      seasons: "Mevsimler (kar, yaprak…)", birds: "Geçen kuşlar", strays: "Gelen sokak kedileri", breed: "Yavrulama",
      lang: "Dil", app: "Uygulama", login: "Bilgisayarla birlikte başlat", hide: "Kedileri gizle", quit: "Çıkış",
      stars: (n) => `⭐ ${n}`,
    },
    en: {
      title: "Settings", market: "Market: food and furniture", cats: "Cats", adopt: "Adopt", surprise: "Surprise cat", count: (n, m) => `${n}/${m} cats`, cards: "Cat cards",
      removeAll: "Remove all cats", sure: "Sure? Tap again",
      toys: "Toys", yarn: "Yarn", mouse: "Wind-up mouse", box: "Box", feed: "Feed", catnip: "Catnip", butterfly: "Butterfly",
      post: "Scratching post", shelf: "Wall shelf", bird: "Call a bird", stray: "Call a stray", laser: "Laser", wand: "Feather wand", clear: "Put toys away",
      play: "Game", game: "🔴 Play laser hunt", best: (n) => `Best: ${n}`,
      sizes: "Sizes", catSize: "Cat size", toySize: "Toy size", cardSize: "Card size",
      sound: "Sound", purr: "Purring", meow: "Meowing",
      world: "World", night: "Day & night", auto: "Follow the clock", day: "Day", nightOn: "Night",
      seasons: "Seasons (snow, leaves…)", birds: "Birds flying past", strays: "Stray cats visiting", breed: "Kittens",
      lang: "Language", app: "App", login: "Start with my computer", hide: "Hide the cats", quit: "Quit",
      stars: (n) => `⭐ ${n}`,
    },
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function create(o) {
    const { world, act, bridge } = o, L = window.CatLife, DC = window.DesktopCat;
    const fab = document.createElement("button");
    fab.className = "ui st-fab"; fab.type = "button"; fab.textContent = "⚙️";
    const root = document.createElement("div");
    root.className = "ui st"; root.hidden = true;
    document.body.append(fab, root);
    let lang = "", login = false, sure = 0;

    const t = () => STR[L.lang] || STR.en;
    const sw = (id, label) => `<label class="st-sw"><span>${esc(label)}</span><input type="checkbox" data-sw="${id}"><i></i></label>`;
    const range = (id, label, min, max, step) => `<label class="st-range"><span>${esc(label)}<b data-rv="${id}"></b></span><input type="range" data-r="${id}" min="${min}" max="${max}" step="${step}"></label>`;
    const btn = (id, label, cls = "") => `<button type="button" class="st-b ${cls}" data-a="${id}">${esc(label)}</button>`;

    function build() {
      const s = t(); lang = L.lang;
      root.innerHTML = `
        <div class="st-head"><b>⚙️ ${esc(s.title)}</b><span class="st-wallet"></span><button type="button" class="st-x" data-a="close">×</button></div>
        <div class="st-body">
          <section><h3>🐱 ${esc(s.cats)} <small class="st-count"></small></h3>
            <div class="st-coats">${DC.COAT_KEYS.map((k) => `<button type="button" class="st-coat" data-coat="${k}" title="${esc(L.COAT_NAMES[k][L.lang])}" style="--a:${DC.COATS[k].body};--b:${DC.COATS[k].accent}"></button>`).join("")}<button type="button" class="st-coat dice" data-coat="" title="${esc(s.surprise)}">🎲</button></div>
            <div class="st-grid">${btn("market", "🛒 " + s.market, "gold")}${btn("cards", "📇 " + s.cards, "pink")}${btn("removeAll", "🧳 " + s.removeAll, "ghost")}</div>
          </section>
          <section><h3>🧸 ${esc(s.toys)}</h3>
            <div class="st-grid three">
              ${btn("yarn", "🧶 " + s.yarn)}${btn("mouse", "🐭 " + s.mouse)}${btn("box", "📦 " + s.box)}
              ${btn("feed", "🍗 " + s.feed)}${btn("catnip", "🌿 " + s.catnip)}${btn("butterfly", "🦋 " + s.butterfly)}
              ${btn("post", "🪵 " + s.post)}${btn("shelf", "🪜 " + s.shelf)}${btn("bird", "🐦 " + s.bird)}
              ${btn("laser", "🔴 " + s.laser, "tog")}${btn("wand", "🪶 " + s.wand, "tog")}${btn("stray", "🐈 " + s.stray)}
            </div>
            <div class="st-grid">${btn("clear", "🧺 " + s.clear, "ghost")}</div>
          </section>
          <section><h3>🎮 ${esc(s.play)} <small class="st-best"></small></h3><div class="st-grid">${btn("game", s.game, "gold")}</div></section>
          <section><h3>📏 ${esc(s.sizes)}</h3>${range("scale", s.catSize, DC.SCALE_MIN, DC.SCALE_MAX, 0.25)}${range("toyScale", s.toySize, DC.SCALE_MIN, DC.SCALE_MAX, 0.25)}${range("card", s.cardSize, 0.5, 1.1, 0.02)}</section>
          <section><h3>🔊 ${esc(s.sound)}</h3>${sw("purr", s.purr)}${sw("meow", s.meow)}</section>
          <section><h3>🌍 ${esc(s.world)}</h3>
            <div class="st-seg-l">${esc(s.night)}</div>
            <div class="st-seg" data-seg="night">${["auto", "day", "night"].map((m) => `<button type="button" data-v="${m}">${esc(s[m === "night" ? "nightOn" : m])}</button>`).join("")}</div>
            ${sw("seasons", s.seasons)}${sw("birds", s.birds)}${sw("strays", s.strays)}${sw("breed", s.breed)}
          </section>
          <section><h3>🌐 ${esc(s.lang)}</h3><div class="st-seg" data-seg="lang"><button type="button" data-v="tr">Türkçe</button><button type="button" data-v="en">English</button></div></section>
          ${bridge ? `<section><h3>💻 ${esc(s.app)}</h3>${sw("login", s.login)}<div class="st-grid">${btn("hide", "🙈 " + s.hide, "ghost")}${btn("quit", "⏻ " + s.quit, "ghost")}</div></section>` : ""}
        </div>`;
      sync();
    }

    // keep every switch, slider and counter in step with the world
    function sync() {
      if (root.hidden) return;
      if (lang !== L.lang) return build();
      const s = t(), q = (x) => root.querySelector(x);
      const n = world.cats.filter((c) => c.profile).length;
      q(".st-count").textContent = s.count(n, L.MAX_CATS || 8);
      q(".st-wallet").textContent = s.stars(L.wallet.stars);
      q(".st-best").textContent = L.game && L.game.best ? s.best(L.game.best) : "";
      const vals = { purr: world.purrOn, meow: world.meowOn, seasons: world.seasonsOn !== false, birds: world.birdsOn !== false, strays: world.strayOn !== false, breed: L.breedOn, login };
      root.querySelectorAll("[data-sw]").forEach((i) => { i.checked = !!vals[i.dataset.sw]; });
      const rv = { scale: world.scale, toyScale: world.toyScale, card: o.card().size };
      root.querySelectorAll("[data-r]").forEach((i) => { if (document.activeElement !== i) i.value = rv[i.dataset.r]; });
      root.querySelectorAll("[data-rv]").forEach((b) => { const v = rv[b.dataset.rv]; b.textContent = b.dataset.rv === "card" ? `${Math.round(v * 100)}%` : `×${(+v).toFixed(2).replace(/\.?0+$/, "")}`; });
      root.querySelectorAll("[data-seg=night] button").forEach((b) => b.classList.toggle("on", b.dataset.v === world.nightMode));
      root.querySelectorAll("[data-seg=lang] button").forEach((b) => b.classList.toggle("on", b.dataset.v === L.lang));
      q('[data-a="laser"]').classList.toggle("on", !!world.laser); q('[data-a="wand"]').classList.toggle("on", !!world.wand);
      const full = n >= (L.MAX_CATS || 8); root.querySelectorAll(".st-coat").forEach((b) => { b.disabled = full; });
      const ra = q('[data-a="removeAll"]'); ra.textContent = `🧳 ${sure ? s.sure : s.removeAll}`; ra.classList.toggle("red", !!sure);
    }

    // beside the cat card when it's open; otherwise in the corner above the floor
    function place() {
      const bottom = Math.max(12, innerHeight - world.floor + 10);
      fab.hidden = world.cats.some((c) => c.profile);
      fab.style.bottom = `${bottom}px`;
      const cc = document.querySelector(".cc"), r = cc && !cc.hidden ? cc.getBoundingClientRect() : null;
      if (r && r.width && !root.hidden) {
        const w = root.offsetWidth, h = root.offsetHeight, room = innerWidth - r.right - 12;
        root.style.left = `${room >= w + 4 ? r.right + 12 : Math.max(8, r.left - 12 - w)}px`; root.style.right = "auto";
        root.style.top = `${Math.max(8, Math.min(r.top, innerHeight - h - 8))}px`; root.style.bottom = "auto";
        root.style.setProperty("--maxh", `${innerHeight - 16}px`); return;
      }
      root.style.left = "auto"; root.style.right = "14px"; root.style.top = "auto"; root.style.bottom = `${bottom + 52}px`;
      root.style.setProperty("--maxh", `${Math.max(240, innerHeight - bottom - 80)}px`);
    }
    function open() { root.hidden = false; build(); place(); if (bridge && bridge.getLogin) bridge.getLogin().then((v) => { login = !!v; sync(); }); o.onOpen && o.onOpen(); }
    function close() { root.hidden = true; sure = 0; o.onClose && o.onClose(); }
    fab.onclick = () => (root.hidden ? open() : close());

    root.addEventListener("click", (e) => {
      const c = e.target.closest("[data-coat]");
      if (c) { if (!c.disabled) act.add(c.dataset.coat || undefined); return sync(); }
      const sg = e.target.closest("[data-seg] button");
      if (sg) { const k = sg.parentElement.dataset.seg; if (k === "night") act.night(sg.dataset.v); else act.lang(sg.dataset.v); return sync(); }
      const b = e.target.closest("[data-a]"); if (!b) return;
      const a = b.dataset.a;
      if (a === "close") return close();
      if (a === "removeAll") { if (sure) { sure = 0; act.removeAll(); } else { sure = 1; setTimeout(() => { sure = 0; sync(); }, 3000); } return sync(); }
      if (a === "game" || a === "cards" || a === "market") close();
      if (a === "hide") { close(); return bridge && bridge.hide(); }
      if (a === "quit") return bridge && bridge.quit();
      if (act[a]) act[a]();
      sync();
    });
    root.addEventListener("change", (e) => {
      const i = e.target.closest("[data-sw]"); if (!i) return;
      const k = i.dataset.sw;
      if (k === "login") { login = i.checked; if (bridge && bridge.setLogin) bridge.setLogin(login); return; }
      act[k === "strays" ? "strays" : k](i.checked); sync();
    });
    root.addEventListener("input", (e) => {
      const r = e.target.closest("[data-r]"); if (!r) return;
      const v = +r.value;
      if (r.dataset.r === "card") o.setCardSize(v); else act.setScale(r.dataset.r, v);
      const b = root.querySelector(`[data-rv="${r.dataset.r}"]`); if (b) b.textContent = r.dataset.r === "card" ? `${Math.round(v * 100)}%` : `×${v}`;
    });
    addEventListener("keydown", (e) => { if (e.key === "Escape" && !root.hidden) close(); });
    addEventListener("resize", place);
    place();
    setInterval(() => { place(); sync(); }, 1000);
    return { open, close, sync, get isOpen() { return !root.hidden; } };
  }
  window.CatSettings = { create };
})();
