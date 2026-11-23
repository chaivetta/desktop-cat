// 🌱 The garden lives on your desktop: buy pots (furniture) and seeds (each kind once, then plant it as often as you like) in the market,
// then click a pot to plant, water (with the watering can) and harvest. Plants grow in real hours, but only while watered.
(() => {
  const L = window.CatLife;
  const H = 3.6e6, WATER_FOR = 6 * H, DIES_AFTER = 12 * H;
  const CROPS = {
    catnip: { e: "🌾", h: 1, seed: 15, xp: 3, give: { item: "catnip" }, col: ["#8fd36b", "#c9e8a8"] },
    mint: { e: "🌿", h: 3, seed: 30, xp: 8, give: { coins: 12 }, col: ["#4fbf7a", "#9be8b8"] },
    strawberry: { e: "🍓", h: 6, seed: 60, xp: 15, give: { meal: true }, col: ["#5fae54", "#ff4f6a"] },
    sunflower: { e: "🌻", h: 12, seed: 100, xp: 30, give: { coins: 40, star: 0.04 }, col: ["#5fae54", "#ffd34d"] },
    carrot: { e: "🥕", h: 2, seed: 20, xp: 5, give: { coins: 7 }, col: ["#5fae54", "#ff8a2e"] },
    blueberry: { e: "🫐", h: 4, seed: 45, xp: 10, give: { coins: 16 }, col: ["#4f9a5a", "#4a5fc8"] },
    lavender: { e: "💜", h: 8, seed: 80, xp: 20, give: { coins: 20, love: 5 }, col: ["#6aa86a", "#a98be0"] },
    rose: { e: "🌹", h: 18, seed: 130, xp: 40, give: { coins: 65, star: 0.08 }, col: ["#3f8a3a", "#e2414e"] },
    pumpkin: { e: "🎃", h: 24, seed: 150, xp: 50, give: { food: ["pumpkin", 3] }, col: ["#4f9a4a", "#f28a2e"] },
  };
  const STR = {
    tr: {
      crops: { catnip: "Kedi otu", mint: "Nane", strawberry: "Çilek", sunflower: "Ayçiçeği", carrot: "Havuç", blueberry: "Yaban mersini", lavender: "Lavanta", rose: "Gül", pumpkin: "Bal kabağı" },
      give: { catnip: "1 kedi nanesi", mint: "12🪙", strawberry: "1 özel yemek", sunflower: "40🪙 (+ nadiren ⭐)", carrot: "7🪙", blueberry: "16🪙", lavender: "20🪙 + bütün kedilere 💗", rose: "65🪙 (+ bazen ⭐)", pumpkin: "3 balkabağı püresi 🎃" },
      empty: "Boş saksı", plant: "Ne ekelim?", noSeeds: "Hiç tohumun yok. Marketin Oyuncak bölümünden tohum al 🌱", shop: "🛒 Tohum al",
      water: "💧 Sula", needCan: "💧 Suluk lazım (marketten 1🪙)", harvest: "🧺 Hasat et", clear: "🥀 Temizle",
      growing: (m, w) => `⏳ ${m} sonra hazır · 💧 ${w}`, dry: "💧 Susadı! Sulamazsan büyümez, 12 saatte solar", dead: "🥀 Soldu", ready: "✨ Hasada hazır!",
      time: (m) => `${m >= 60 ? Math.floor(m / 60) + " sa " : ""}${m % 60} dk`, harvested: (e, w) => `${e} Hasat: ${w}`,
      seedsH: "🌱 Tohumlar (bir kere al, sınırsız ek)", seedD: (h, g) => `${h} saatte büyür · ${g}`,
    },
    en: {
      crops: { catnip: "Catnip", mint: "Mint", strawberry: "Strawberry", sunflower: "Sunflower", carrot: "Carrot", blueberry: "Blueberry", lavender: "Lavender", rose: "Rose", pumpkin: "Pumpkin" },
      give: { catnip: "1 catnip", mint: "12🪙", strawberry: "1 special meal", sunflower: "40🪙 (+ rarely ⭐)", carrot: "7🪙", blueberry: "16🪙", lavender: "20🪙 + 💗 for every cat", rose: "65🪙 (+ sometimes ⭐)", pumpkin: "3 pumpkin purées 🎃" },
      empty: "Empty pot", plant: "What shall we plant?", noSeeds: "No seeds yet. Buy some in the market's Toys section 🌱", shop: "🛒 Buy seeds",
      water: "💧 Water", needCan: "💧 Needs a watering can (1🪙 in the market)", harvest: "🧺 Harvest", clear: "🥀 Clear",
      growing: (m, w) => `⏳ ready in ${m} · 💧 ${w}`, dry: "💧 Thirsty! It won't grow until watered; it wilts after 12 hours", dead: "🥀 Wilted", ready: "✨ Ready to harvest!",
      time: (m) => `${m >= 60 ? Math.floor(m / 60) + " h " : ""}${m % 60} min`, harvested: (e, w) => `${e} Harvest: ${w}`,
      seedsH: "🌱 Seeds (buy once, plant forever)", seedD: (h, g) => `grows in ${h} h · ${g}`,
    },
  };
  const t = () => STR[L.lang] || STR.en;
  const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  L.CROPS = CROPS; L.gardenStr = t;
  L.seeds = L.seeds || [];
  L.hasSeed = (k) => (L.seeds || []).includes(k);
  L.buySeed = (k) => { const c = CROPS[k]; if (!c || L.hasSeed(k) || L.wallet.coins < c.seed) return false; L.wallet.coins -= c.seed; L.seeds.push(k); L.changed(); return true; };

  // a plant's state, and its growth (only while it has water)
  const state = (p, now = Date.now()) => !p ? "empty" : p.dead ? "dead" : p.grown >= CROPS[p.k].h * H ? "ready" : now - p.wateredAt > WATER_FOR ? "dry" : "growing";
  function grow(p, now = Date.now()) {
    if (!p || p.dead) return;
    const last = p.lastT || p.at, wetUntil = p.wateredAt + WATER_FOR;
    p.grown = Math.min(CROPS[p.k].h * H, (p.grown || 0) + Math.max(0, Math.min(now, wetUntil) - last)); p.lastT = now;
    if (p.grown < CROPS[p.k].h * H && now - wetUntil > DIES_AFTER) p.dead = true;
  }

  function create(o) {
    const { world, save, toast } = o;
    const pots = () => L.home.items.filter((it) => it.k === "pot");
    const growAll = () => pots().forEach((it) => grow(it.plant));
    const readyCount = () => { growAll(); return pots().filter((it) => state(it.plant) === "ready").length; };

    function plant(it, k) { if (it.plant || !L.hasSeed(k)) return; const now = Date.now(); it.plant = { k, at: now, wateredAt: now - WATER_FOR - 1, grown: 0, lastT: now }; L.changed(); save(); }
    function water(it) { const p = it.plant; if (!p || p.dead || !L.hasToy("can")) return; grow(p); p.wateredAt = Date.now(); L.changed(); save(); }
    function harvest(it) {
      const p = it.plant; grow(p); if (state(p) !== "ready") return; const c = CROPS[p.k], what = [];
      if (c.give.item) { L.pantry[c.give.item] = (L.pantry[c.give.item] || 0) + 1; what.push(L.FOOD[c.give.item].e); }
      if (c.give.coins) what.push(`+${L.earn(c.give.coins)}🪙`);
      if (c.give.meal) { const sp = Object.keys(L.FOOD).filter((f) => L.FOOD[f].buff); const f = sp[Math.floor(Math.random() * sp.length)]; L.pantry[f] = (L.pantry[f] || 0) + 1; what.push(L.FOOD[f].e); }
      if (c.give.food) { const [f, n] = c.give.food; L.pantry[f] = (L.pantry[f] || 0) + n; what.push(`${L.FOOD[f].e}×${n}`); }
      if (c.give.love) { world.cats.forEach((k) => { if (k.profile && !k.profile.guest) { k.profile.love = Math.min(100, k.profile.love + c.give.love); world.burst(k.x, k.y - 30 * k.s, "heart", "#a98be0", 1); } }); what.push("💜"); }
      if (c.give.star && Math.random() < c.give.star) { L.wallet.stars++; what.push("⭐"); }
      it.plant = null; L.stats.harvests = (L.stats.harvests || 0) + 1; if (L.gainPXP) L.gainPXP(c.xp);
      toast(t().harvested(c.e, what.join(" "))); L.changed(); save();
    }

    // ---- the little popup over a pot
    const pop = document.createElement("div"); pop.className = "ui gd-pop"; pop.hidden = true; document.body.appendChild(pop);
    let cur = null, popT = 0;
    function show(f) {
      cur = f; const it = f.item, p = it.plant, s = t(); grow(p); const st = state(p), now = Date.now();
      let html = "";
      if (st === "empty") {
        const own = Object.keys(CROPS).filter(L.hasSeed);
        html = `<b>🪴 ${esc(s.empty)}</b>` + (own.length ? `<small>${esc(s.plant)}</small><div class="gd-seedrow">${own.map((k) => `<button type="button" data-plant="${k}">${CROPS[k].e}<small>${esc(s.crops[k])}</small></button>`).join("")}</div>`
          : `<small>${esc(s.noSeeds)}</small><button type="button" class="gold" data-shop="1">${esc(s.shop)}</button>`);
      } else {
        const c = CROPS[p.k], left = Math.ceil((c.h * H - p.grown) / 60e3), wet = Math.max(0, Math.ceil((p.wateredAt + WATER_FOR - now) / 60e3));
        html = `<b>${c.e} ${esc(s.crops[p.k])}</b><span class="gd-bar"><i style="width:${Math.min(100, (p.grown / (c.h * H)) * 100)}%"></i></span>`
          + `<small>${esc(st === "ready" ? s.ready : st === "dead" ? s.dead : st === "dry" ? s.dry : s.growing(s.time(left), s.time(wet)))}</small>`
          + (st === "ready" ? `<button type="button" class="gold" data-harvest="1">${esc(s.harvest)}</button>`
            : st === "dead" ? `<button type="button" data-clear="1">${esc(s.clear)}</button>`
            : L.hasToy("can") ? `<button type="button" class="${st === "dry" ? "gold" : ""}" data-water="1">${esc(s.water)}</button>` : `<button type="button" data-shop="1">${esc(s.needCan)}</button>`);
      }
      pop.innerHTML = html; pop.hidden = false; place();
      clearTimeout(popT); popT = setTimeout(hide, 12000);
      o.onOpen && o.onOpen();
    }
    function hide() { if (pop.hidden) return; pop.hidden = true; cur = null; o.onClose && o.onClose(); }
    function place() { if (!cur) return; const s = world.toyScale, r = pop.getBoundingClientRect(); pop.style.left = `${Math.max(6, Math.min(innerWidth - r.width - 6, cur.x - r.width / 2))}px`; pop.style.top = `${Math.max(6, cur.y - cur.f.h * s - 50 * s / 3 - r.height)}px`; }
    pop.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b || !cur) return; const it = cur.item, d = b.dataset;
      if (d.plant) plant(it, d.plant); else if (d.water) water(it); else if (d.harvest) harvest(it); else if (d.clear) { it.plant = null; L.changed(); save(); }
      else if (d.shop) { hide(); o.openShop && o.openShop(); return; }
      if (d.water) world.burst(cur.x, cur.y - 14 * world.toyScale, "spark", "#6ad0ff", 6);
      if (d.harvest) world.confetti(cur.x, cur.y - 20 * world.toyScale, 16);
      show(cur);
    });
    addEventListener("pointerdown", (e) => { if (!pop.hidden && !pop.contains(e.target)) setTimeout(() => { if (!pop.matches(":hover")) hide(); }, 0); }, true);
    world.onPotClick = (f) => (cur === f && !pop.hidden ? hide() : show(f));

    // ---- drawing the plant on the pot (pixel art, by stage), and a little sign when it needs you
    world.drawPlant = (ctx, f, x0, y0, s) => {
      const p = f.item.plant; if (!p) return; grow(p);
      const c = CROPS[p.k], st = state(p), k = Math.min(1, p.grown / (c.h * H)), cx = x0 + 8 * s, base = y0 + s;
      const px = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(Math.round(cx + x * s), Math.round(base + y * s), Math.round(w * s), Math.round(h * s)); };
      const sway = Math.round(Math.sin(f.t * 1.6) * (k > 0.3 ? 1 : 0));
      if (st === "dead") { px(-1, -5, 1, 5, "#8a7a5a"); px(-3, -6, 2, 1, "#9a8a6a"); px(1, -4, 2, 1, "#9a8a6a"); return; }
      const leaf = st === "dry" ? "#9aae5a" : c.col[0], hi = st === "dry" ? "#b8c47a" : "#9be07c";
      const hgt = Math.round(3 + k * ({ sunflower: 17, strawberry: 8, carrot: 5, blueberry: 9, lavender: 11, rose: 13, pumpkin: 4 }[p.k] ?? 9));
      px(0 + sway * 0.5, -hgt, 1, hgt, "#3f8a3a");                                   // stem
      for (let i = 1; i <= Math.min(4, 1 + Math.floor(k * 4)); i++) { const y = -Math.round(hgt * i / 5) - 1, d = i % 2 ? -1 : 1; px(d > 0 ? 1 : -3, y, 3, 1, leaf); px(d > 0 ? 2 : -3, y - 1, 1, 1, hi); }
      if (k >= 1) {                                                                  // the crop itself
        if (p.k === "sunflower") { px(-3 + sway, -hgt - 4, 7, 6, "#ffd34d"); px(-4 + sway, -hgt - 2, 9, 2, "#ffd34d"); px(-1 + sway, -hgt - 3, 3, 3, "#7a4a22"); }
        else if (p.k === "strawberry") { for (const [x, y] of [[-3, -4], [2, -6], [-1, -8]]) { px(x, y, 2, 2, "#ff4f6a"); px(x, y - 1, 2, 1, "#5fae54"); } }
        else if (p.k === "carrot") { px(-2, -1, 4, 2, "#ff8a2e"); px(-1, 1, 2, 1, "#ff8a2e"); for (const x of [-2, 0, 2]) px(x, -hgt - 2, 1, 3, "#5fae54"); }
        else if (p.k === "blueberry") { for (const [x, y] of [[-3, -5], [2, -6], [-1, -8], [1, -3], [-3, -9]]) { px(x, y, 2, 2, "#4a5fc8"); px(x, y, 1, 1, "#7f92e6"); } }
        else if (p.k === "lavender") { for (const x of [-3, 0, 3]) { px(x, -hgt + (x ? 2 : 0), 1, hgt - 4, "#4f8a3a"); for (let y = 0; y < 5; y++) px(x - (y % 2), -hgt - 3 + y + (x ? 2 : 0), 2, 1, y % 2 ? "#a98be0" : "#8a6bd0"); } }
        else if (p.k === "rose") { px(-2 + sway, -hgt - 3, 5, 4, "#e2414e"); px(-1 + sway, -hgt - 4, 3, 1, "#c8323c"); px(0 + sway, -hgt - 2, 1, 1, "#9e1b31"); }
        else if (p.k === "pumpkin") { px(-5, -5, 11, 6, "#f28a2e"); px(-6, -4, 13, 4, "#f28a2e"); for (const x of [-3, 0, 3]) px(x, -5, 1, 6, "#c8641e"); px(0, -7, 1, 2, "#6a4a2a"); px(1, -8, 3, 1, "#5fae54"); }
        else if (p.k === "mint") { for (const [x, y] of [[-3, -hgt], [1, -hgt + 1], [-1, -hgt - 2]]) px(x, y, 3, 2, "#4fbf7a"); }
        else { for (let i = -3; i <= 3; i += 2) px(i, -hgt - 2 - (i & 1), 1, 3, "#d9c46a"); }
      } else if (k > 0.5 && p.k === "sunflower") px(-1 + sway, -hgt - 2, 3, 2, "#7cbf5a");
      // a sign above: thirsty, or ready
      if (st === "dry" || st === "ready") {
        const t2 = performance.now() / 300, y = base - (hgt + 10) * s - Math.abs(Math.sin(t2)) * 3 * s;
        ctx.save(); ctx.font = `${Math.round(7 * s)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; ctx.textAlign = "center"; ctx.fillText(st === "dry" ? "💧" : "✨", cx, y); ctx.restore();
      }
    };

    // ---- the seed cards for the market
    function seedCards(card, buyLabel) {
      const s = t();
      return Object.entries(CROPS).map(([k, c]) => card(`<div class="mk-emo">${c.e}</div>`, s.crops[k], s.seedD(c.h, s.give[k]), L.hasSeed(k) ? "✨ ∞" : "",
        L.hasSeed(k) ? `<span class="mk-have">✓</span>` : `<button type="button" class="mk-buy" data-seed="${k}"${L.wallet.coins < c.seed ? " disabled" : ""}>${buyLabel(c.seed)}</button>`)).join("");
    }
    // an older save kept its plants in the panel's pots: turn those into pots on the desktop
    setTimeout(() => {
      const old = L.extra && L.extra.plots;
      if (Array.isArray(old) && old.length && !L.extra.potsMoved) {
        old.forEach((p, i) => { const it = { id: "pot" + i + Date.now().toString(36), k: "pot", cond: 100, x: null, plant: p || null }; L.home.items.push(it); if (o.placeItem) o.placeItem(it, (0.12 + i * 0.13) % 0.9); });
        (old.filter(Boolean).map((p) => p.k)).forEach((k) => { if (!L.hasSeed(k)) L.seeds.push(k); });
        L.extra.potsMoved = true; L.extra.plots = []; L.changed(); save();
      }
    }, 2500);
    setInterval(() => { if (!pop.hidden && cur) show(cur); }, 30e3);
    return { readyCount, seedCards, show, hide, t };
  }
  window.CatGarden = { create, CROPS };
})();
