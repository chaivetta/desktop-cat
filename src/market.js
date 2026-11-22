// 🛒 The market: food and furniture for coins, your things (with how worn they are), and how to earn.
(() => {
  const STR = {
    tr: {
      title: "Market", food: "Mama", furniture: "Eşyalar", mine: "Eşyalarım", earn: "Kazan",
      coins: (n) => `🪙 ${n}`, stars: (n) => `⭐ ${n}`, buy: (n) => `🪙 ${n}`, inStock: (n) => `Dolapta: ${n}`, owned: (n) => `${n} tane var`,
      foods: {
        dry: ["Kuru mama", "İki öğünlük bir paket. Karnı doyar, büyümeye devam eder."],
        wet: ["Yaş mama", "Tek öğün ama çok sever: biraz da sevgi kazandırır."],
        fish: ["Balık ziyafeti", "Özel gün yemeği: bol sevgi ve biraz büyüme."],
        treat: ["Ödül maması", "Üç tane. Numara öğretirken kullanılır, öğrenmesi kolaylaşır."],
        catnip: ["Kedi otu", "Bir kullanımlık. Kediler çılgına döner."],
      },
      put: "Ortaya koy", store: "Kaldır", repair: (n) => `Tamir 🪙 ${n}`, sell: (n) => `Sat 🪙 ${n}`, out: "Ortada", stored: "Depoda", worn: "Eskimiş", broken: "Kırık",
      noItems: "Henüz eşyan yok. Eşyalar sekmesinden alabilirsin.", cond: "Durumu",
      wearNote: "Eşyalar kullandıkça ve zamanla eskir. Kırılan eşyayı kediler kullanmaz; tamir edebilir ya da satabilirsin.",
      needMore: (n) => `${n} altın daha lazım`,
      ways: [
        ["🎯", "Görevler", "Her görev 2🪙, bir kedinin üç görevi de bitince +5🪙 ve 1⭐."],
        ["🔴", "Lazer avı", "Yakalanan her yıldız 1🪙 (günde en çok 40🪙). 20 ve üstü skor 1⭐ (günde bir kez)."],
        ["💻", "Bilgisayar başında", "Sen bilgisayarı kullandıkça her 10 dakikada 1🪙 (günde en çok 30🪙)."],
        ["⭐", "Yıldızlar", "Yıldızlar sadece kedi kartındaki dolapta: şapka, tasma ve kıyafetler."],
      ],
      today: (pc, g) => `Bugün: bilgisayardan ${pc}/30🪙 · oyundan ${g}/40🪙`,
      pantry: "Dolap", empty: "Mama bitti! Buradan alabilirsin 🥣",
    },
    en: {
      title: "Market", food: "Food", furniture: "Furniture", mine: "My things", earn: "Earn",
      coins: (n) => `🪙 ${n}`, stars: (n) => `⭐ ${n}`, buy: (n) => `🪙 ${n}`, inStock: (n) => `In the cupboard: ${n}`, owned: (n) => `you own ${n}`,
      foods: {
        dry: ["Dry food", "A bag with two meals. Keeps them full so they keep growing."],
        wet: ["Wet food", "One meal they love: a little extra love too."],
        fish: ["Fish feast", "A special dinner: lots of love and a bit of growing."],
        treat: ["Treats", "Three of them. Used while teaching tricks, they learn faster."],
        catnip: ["Catnip", "One go. The cats go wild."],
      },
      put: "Place", store: "Put away", repair: (n) => `Repair 🪙 ${n}`, sell: (n) => `Sell 🪙 ${n}`, out: "Out", stored: "Stored", worn: "Worn", broken: "Broken",
      noItems: "You don't own anything yet. Have a look under Furniture.", cond: "Condition",
      wearNote: "Things wear out with use and over time. Cats won't use something broken; repair it or sell it.",
      needMore: (n) => `${n} more coins needed`,
      ways: [
        ["🎯", "Tasks", "2🪙 per task, +5🪙 and 1⭐ when all three of a cat's tasks are done."],
        ["🔴", "Laser hunt", "1🪙 for every star caught (up to 40🪙 a day). A score of 20+ earns 1⭐ (once a day)."],
        ["💻", "At your computer", "1🪙 every 10 minutes while you're using your computer (up to 30🪙 a day)."],
        ["⭐", "Stars", "Stars are only for the wardrobe on the cat card: hats, collars and outfits."],
      ],
      today: (pc, g) => `Today: ${pc}/30🪙 from the computer · ${g}/40🪙 from the game`,
      pantry: "Cupboard", empty: "Out of food! You can buy some here 🥣",
    },
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function create(o) {
    const { world } = o, L = window.CatLife, DC = window.DesktopCat;
    const fab = document.createElement("button");
    fab.className = "ui st-fab mk-fab"; fab.type = "button"; fab.textContent = "🛒";
    const root = document.createElement("div");
    root.className = "ui mk"; root.hidden = true;
    document.body.append(fab, root);
    let tab = "food", note = "", key = "";
    const t = () => STR[L.lang] || STR.en;

    const repairCost = (it) => Math.ceil(DC.FURN[it.k].price * 0.5 * (1 - it.cond / 100));
    const sellPrice = (it) => Math.floor(DC.FURN[it.k].price * 0.3 * Math.max(0.2, it.cond / 100));
    const condLabel = (it, s) => it.cond <= 0 ? s.broken : it.cond < 40 ? s.worn : "";

    function render() {
      const s = t(), H = L.home, E = L.econToday();
      const k = [L.lang, tab, note, L.wallet.coins, L.wallet.stars, JSON.stringify(L.pantry), H.items.map((i) => `${i.id}${Math.round(i.cond)}${i.x != null}`).join()].join("|");
      if (k === key) return; key = k;
      const tabs = [["food", "🍗", s.food], ["furniture", "🛋️", s.furniture], ["mine", "🎒", s.mine], ["earn", "🪙", s.earn]];
      let body = "";
      if (tab === "food") {
        body = `<div class="mk-pantry"><b>🧺 ${esc(s.pantry)}</b>${Object.keys(L.FOOD).map((f) => `<span title="${esc(s.foods[f][0])}">${L.FOOD[f].e} ${L.pantry[f] || 0}</span>`).join("")}</div>`
          + `<div class="mk-grid">${Object.entries(L.FOOD).map(([f, d]) => card(`<div class="mk-emo">${d.e}</div>`, s.foods[f][0], s.foods[f][1], s.inStock(L.pantry[f] || 0), `<button type="button" class="mk-buy" data-food="${f}"${L.wallet.coins < d.price ? " disabled" : ""}>${s.buy(d.price)}</button>`, d.n > 1 ? `×${d.n}` : "")).join("")}</div>`;
      } else if (tab === "furniture") {
        body = `<div class="mk-grid">${Object.entries(DC.FURN).map(([f, d]) => { const n = H.items.filter((i) => i.k === f).length, [nm, ds] = L.t("furn")[f];
          return card(`<canvas width="96" height="72" data-f="${f}"></canvas>`, nm, ds, n ? s.owned(n) : "", `<button type="button" class="mk-buy" data-furn="${f}"${L.wallet.coins < d.price ? " disabled" : ""}>${s.buy(d.price)}</button>`); }).join("")}</div>`;
      } else if (tab === "mine") {
        body = H.items.length ? `<p class="mk-note">${esc(s.wearNote)}</p><div class="mk-list">${H.items.map((it) => {
          const [nm] = L.t("furn")[it.k], c = Math.round(it.cond), lab = condLabel(it, s), rc = repairCost(it);
          return `<div class="mk-row${it.cond <= 0 ? " broken" : ""}" data-id="${it.id}"><canvas width="64" height="48" data-f="${it.k}"></canvas>
            <div class="mk-info"><b>${esc(nm)}</b><small>${esc(it.x != null ? s.out : s.stored)}${lab ? ` · <em>${esc(lab)}</em>` : ""}</small>
              <span class="mk-cond" title="${esc(s.cond)} ${c}%"><i style="--c:${c}%;--h:${Math.round(c * 1.2)}"></i></span></div>
            <div class="mk-acts"><button type="button" data-it="${it.x != null ? "store" : "put"}">${esc(it.x != null ? s.store : s.put)}</button>
              ${it.cond < 90 ? `<button type="button" class="gold" data-it="repair"${L.wallet.coins < rc ? " disabled" : ""}>${esc(s.repair(rc))}</button>` : ""}
              <button type="button" class="ghost" data-it="sell">${esc(s.sell(sellPrice(it)))}</button></div></div>`; }).join("")}</div>` : `<p class="mk-empty">🪑<br>${esc(s.noItems)}</p>`;
      } else {
        body = `<div class="mk-ways">${s.ways.map(([e, h, d]) => `<div class="mk-way"><span>${e}</span><div><b>${esc(h)}</b><small>${esc(d)}</small></div></div>`).join("")}</div><p class="mk-today">${esc(s.today(E.pc, E.game))}</p>`;
      }
      root.innerHTML = `
        <div class="mk-head"><b>🛒 ${esc(s.title)}</b><span class="mk-wal"><span class="coin">${s.coins(L.wallet.coins)}</span><span class="star">${s.stars(L.wallet.stars)}</span></span><button type="button" class="st-x" data-a="close">×</button></div>
        <div class="mk-tabs">${tabs.map(([id, e, l]) => `<button type="button" data-tab="${id}" class="${tab === id ? "on" : ""}">${e} ${esc(l)}</button>`).join("")}</div>
        ${note ? `<div class="mk-flash">${esc(note)}</div>` : ""}
        <div class="mk-body">${body}</div>`;
      root.querySelectorAll("canvas[data-f]").forEach((c) => DC.furnitureThumb(c.dataset.f, c.getContext("2d")));
    }
    function card(pic, name, desc, sub, btn, badge = "") {
      return `<div class="mk-card"><div class="mk-pic">${pic}${badge ? `<span class="mk-badge">${badge}</span>` : ""}</div><b>${esc(name)}</b><small>${esc(desc)}</small><div class="mk-foot"><em>${esc(sub)}</em>${btn}</div></div>`;
    }
    function pop(el, txt) {
      const r = el.getBoundingClientRect(), f = document.createElement("div");
      f.className = "ui mk-pop"; f.textContent = txt; f.style.left = `${r.left + r.width / 2}px`; f.style.top = `${r.top}px`;
      document.body.appendChild(f); setTimeout(() => f.remove(), 900);
    }

    function place() {
      const bottom = Math.max(12, innerHeight - world.floor + 10);
      fab.style.bottom = `${bottom}px`; root.style.bottom = `${bottom + 52}px`;
      root.style.setProperty("--maxh", `${Math.max(260, innerHeight - bottom - 80)}px`);
    }
    function open(which, msg) { if (which) tab = which; note = msg || ""; root.hidden = false; key = ""; render(); place(); o.onOpen && o.onOpen(); }
    function close() { root.hidden = true; note = ""; o.onClose && o.onClose(); }
    fab.onclick = () => (root.hidden ? open() : close());

    root.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b || b.disabled) return;
      if (b.dataset.a === "close") return close();
      if (b.dataset.tab) { tab = b.dataset.tab; note = ""; return render(); }
      if (b.dataset.food) { if (L.buyFood(b.dataset.food)) { pop(b, `+${L.FOOD[b.dataset.food].n} ${L.FOOD[b.dataset.food].e}`); note = ""; } }
      else if (b.dataset.furn) {
        const k = b.dataset.furn, price = DC.FURN[k].price; if (L.wallet.coins < price) return;
        L.wallet.coins -= price; const it = { id: Math.random().toString(36).slice(2, 9), k, cond: 100, x: null };
        L.home.items.push(it); o.placeItem(it); pop(b, "🎉"); L.changed();
      } else if (b.dataset.it) {
        const it = L.home.items.find((i) => i.id === b.closest("[data-id]").dataset.id); if (!it) return;
        const a = b.dataset.it;
        if (a === "put") o.placeItem(it);
        else if (a === "store") o.storeItem(it);
        else if (a === "repair") { const c = repairCost(it); if (L.wallet.coins >= c) { L.wallet.coins -= c; it.cond = 100; pop(b, "🔧✨"); } }
        else if (a === "sell") { o.storeItem(it); L.home.items = L.home.items.filter((i) => i !== it); L.wallet.coins += sellPrice(it); pop(b, `+🪙${sellPrice(it)}`); }
        L.changed();
      }
      key = ""; render();
    });
    addEventListener("keydown", (e) => { if (e.key === "Escape" && !root.hidden) close(); });
    addEventListener("resize", place);
    place();
    setInterval(() => { place(); if (!root.hidden) render(); }, 1000);
    return { open, close, render: () => { key = ""; if (!root.hidden) render(); }, get isOpen() { return !root.hidden; }, t };
  }
  window.CatMarket = { create };
})();
