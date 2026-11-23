// 🃏 Cat cards: a collection of 32 cards to complete. Every coat has a card, plus eight "moment" cards (Miss Cat, the Moon Cat,
// the lion's roar…). Cards come in packs of three: a free one every week, one on some steps of the Paw Path, or bought for coins.
// Doubles turn into ✨ sparkle, and sparkle makes any card you're still missing. Finishing a rarity row pays out.
(() => {
  const L = window.CatLife;
  const RAR = ["common", "rare", "epic", "legend"];
  const ODDS = [0.62, 0.27, 0.09, 0.02], DUST = [5, 12, 30, 80], CRAFT = [40, 100, 240, 600], PACK = 80;
  const MOMENTS = [
    { id: "m_miss", r: 3, coat: "white", pose: "sit", acc: { hat: "crown:lemon", outfit: "royal:cherry" }, bg: ["#ffe08a", "#ff9fb5"] },
    { id: "m_moon", r: 3, coat: "white", pose: "walk", glow: true, bg: ["#2b3b78", "#0e1430"] },
    { id: "m_roar", r: 3, coat: "lion", pose: "yawn", bg: ["#ffcf7a", "#c8641e"] },
    { id: "m_dream", r: 2, coat: "grey", pose: "curl", bubble: "🐟", bg: ["#cfe6ff", "#8fb2e6"] },
    { id: "m_snow", r: 2, coat: "black", pose: "stand", snow: true, bg: ["#e8f1ff", "#a9c2e6"] },
    { id: "m_zoom", r: 2, coat: "ginger", pose: "run", bg: ["#fff1b8", "#ffb36b"] },
    { id: "m_garden", r: 2, coat: "calico", pose: "sit", acc: { hat: "flowers:cherry" }, bg: ["#d9f5c9", "#7cc46a"] },
    { id: "m_cuddle", r: 2, coat: "tuxedo", pose: "sleepSide", bg: ["#ffe1ea", "#ff9fb5"] },
  ];
  const STR = {
    tr: {
      title: "Kedi Kartları", rar: { common: "Sıradan", rare: "Nadir", epic: "Destansı", legend: "Efsanevi" }, dust: (n) => `✨ ${n} parıltı`,
      free: "🎁 Haftalık ücretsiz paket", freeIn: (d) => `🎁 Yeni ücretsiz paket: ${d} gün sonra`, packs: (n) => `📦 ${n} açılmamış paket`, open: "Paketi aç!", buy: `🪙 ${PACK} · paket al`,
      hint: "Her paket 3 kart. İkinci kez çıkan kart ✨ parıltıya dönüşür; parıltıyla eksik kartları yapabilirsin. Bir nadirlik sırasını bitirince ödül!",
      craft: (n) => `✨ ${n} ile yap`, have: (n) => `×${n}`, newC: "YENİ!", got: (n, e) => `🃏 ${n} kartı koleksiyonuna eklendi ${e}`, dupe: (n) => `+${n} ✨`,
      row: (r, w) => `🎉 ${r} kartların hepsi tamam! ${w}`, done: (a, b) => `${a} / ${b} kart`, tap: "Kartlara dokun",
      m: { m_miss: "Miss Kedi", m_moon: "Ay Kedisi", m_roar: "Kükreyen Aslan", m_dream: "Tatlı Rüyalar", m_snow: "Kar Avcısı", m_zoom: "Zoomies", m_garden: "Bahçıvan", m_cuddle: "Sarılma Vakti" },
    },
    en: {
      title: "Cat Cards", rar: { common: "Common", rare: "Rare", epic: "Epic", legend: "Legendary" }, dust: (n) => `✨ ${n} sparkle`,
      free: "🎁 Free weekly pack", freeIn: (d) => `🎁 Next free pack in ${d} day${d > 1 ? "s" : ""}`, packs: (n) => `📦 ${n} unopened pack${n > 1 ? "s" : ""}`, open: "Open the pack!", buy: `🪙 ${PACK} · buy a pack`,
      hint: "Three cards a pack. A card you already have turns into ✨ sparkle; use sparkle to make the cards you're missing. Finish a rarity row for a prize!",
      craft: (n) => `Make for ✨ ${n}`, have: (n) => `×${n}`, newC: "NEW!", got: (n, e) => `🃏 ${n} added to your collection ${e}`, dupe: (n) => `+${n} ✨`,
      row: (r, w) => `🎉 All your ${r} cards are done! ${w}`, done: (a, b) => `${a} / ${b} cards`, tap: "Tap the cards",
      m: { m_miss: "Miss Cat", m_moon: "Moon Cat", m_roar: "The Roar", m_dream: "Sweet Dreams", m_snow: "Snow Catcher", m_zoom: "Zoomies", m_garden: "Gardener", m_cuddle: "Snuggle Time" },
    },
  };
  const t = () => STR[L.lang] || STR.en;
  const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const weekKey = () => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.toDateString(); };

  function create(o) {
    const { world, save, toast } = o, DC = window.DesktopCat;
    // the cards: every coat (big cats are epic, the fancier house cats rare), then the moments
    const CARDS = [...DC.COAT_KEYS.map((k, i) => ({ id: "c_" + k, coat: k, r: DC.COATS[k].wild ? 2 : i < 9 ? 0 : 1, pose: "sit" })), ...MOMENTS];
    const byId = Object.fromEntries(CARDS.map((c) => [c.id, c]));
    const C = () => { const x = (L.extra.cards = L.extra.cards || { own: {}, dust: 0, packs: 1, week: "", rows: [] }); if (x.week !== weekKey()) { if (x.week) x.packs++; x.week = weekKey(); } return x; };
    const nameOf = (c) => (c.coat && c.id.startsWith("c_") ? L.COAT_NAMES[c.coat][L.lang] : t().m[c.id]);
    const owned = () => Object.keys(C().own).filter((k) => C().own[k] > 0).length;

    function drawCard(cv, c, have) {
      const g = cv.getContext("2d"), W = cv.width, H = cv.height, bg = c.bg || [["#fff7ec", "#f1e1cf"], ["#e4f1ff", "#a9c8f0"], ["#f1e4ff", "#b996e6"], ["#fff1b8", "#f0b84a"]][c.r];
      const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, bg[0]); gr.addColorStop(1, bg[1]); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      if (c.snow) { g.fillStyle = "#fff"; for (let i = 0; i < 26; i++) g.fillRect((i * 37) % W, (i * 53) % (H - 10), 2, 2); }
      if (c.glow) { g.fillStyle = "#fff6c8"; g.beginPath(); g.arc(W * 0.78, H * 0.2, 9, 0, Math.PI * 2); g.fill(); for (let i = 0; i < 14; i++) g.fillRect((i * 29) % W, (i * 17) % (H / 2), 1, 1); }
      const p = document.createElement("canvas"); p.width = 96; p.height = 84;
      DC.portrait(p.getContext("2d"), c.coat, { scale: 2, dx: 0, dy: 4, pose: c.pose, acc: c.acc || {}, eyes: c.pose === "sit" ? "happy" : null, t: 1.2, phase: 0.3, st: 1 });
      g.save(); if (!have) g.filter = "brightness(0) opacity(.25)"; if (c.glow && have) { g.shadowColor = "#bcd4ff"; g.shadowBlur = 14; g.filter = "hue-rotate(190deg) saturate(1.5) brightness(1.15)"; }
      g.imageSmoothingEnabled = false; g.drawImage(p, (W - 96) / 2, H - 84 - 14, 96, 84); g.restore();
      if (c.bubble && have) { g.strokeStyle = "rgba(90,130,200,.9)"; g.fillStyle = "rgba(255,255,255,.4)"; g.lineWidth = 1.5; g.beginPath(); g.arc(W * 0.72, H * 0.28, 12, 0, Math.PI * 2); g.fill(); g.stroke(); g.font = "13px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(c.bubble, W * 0.72, H * 0.29); }
    }

    // ---- packs
    function roll() { let x = Math.random(), r = 0; for (; r < 3; r++) { if (x < ODDS[r]) break; x -= ODDS[r]; } const pool = CARDS.filter((c) => c.r === r); return pool[Math.floor(Math.random() * pool.length)]; }
    function add(c) {
      const X = C(), isNew = !X.own[c.id]; X.own[c.id] = (X.own[c.id] || 0) + 1;
      if (!isNew) X.dust += DUST[c.r];
      checkRows(); return isNew;
    }
    function checkRows() {
      const X = C();
      RAR.forEach((rn, r) => {
        if (X.rows.includes(rn) || !CARDS.filter((c) => c.r === r).every((c) => X.own[c.id])) return;
        X.rows.push(rn); const w = [() => `+${L.earn(150)}🪙`, () => { L.wallet.stars += 3; return "+3⭐"; }, () => { L.wallet.stars += 5; return "+5⭐"; }, () => { L.wallet.stars += 8; return "+8⭐"; }][r]();
        setTimeout(() => { toast(t().row(t().rar[rn], w)); world.confetti(innerWidth / 2, 160, 70); }, 2600);
      });
      if (!X.rows.includes("all") && CARDS.every((c) => X.own[c.id])) { X.rows.push("all"); L.wallet.stars += 10; setTimeout(() => toast("🃏👑 +10⭐"), 4000); }
    }
    function openPack(forced) {
      const X = C(); if (!forced && X.packs <= 0) return; if (!forced) X.packs--;
      const got = [roll(), roll(), forced ? forced : roll()].map((c) => ({ c, isNew: add(c) }));
      if (L.gainPXP) L.gainPXP(8); L.stats.packs = (L.stats.packs || 0) + 1; L.changed(); save();
      // the reveal: three cards face down, tap (or wait) to flip each
      const box = document.createElement("div"); box.className = "ui cd-open"; const s = t();
      box.innerHTML = `<div class="cd-row">${got.map((g, i) => `<button type="button" class="cd-flip r${g.c.r}" style="--d:${i * 0.15}s"><span class="cd-back">🐾</span><span class="cd-front"><canvas width="96" height="124"></canvas><b>${esc(nameOf(g.c))}</b><small>${esc(s.rar[RAR[g.c.r]])}</small>${g.isNew ? `<em>${esc(s.newC)}</em>` : `<em class="dup">${esc(s.dupe(DUST[g.c.r]))}</em>`}</span></button>`).join("")}</div><p>${esc(s.tap)}</p><button type="button" class="cd-ok" hidden>OK</button>`;
      document.body.appendChild(box); o.onOpen && o.onOpen();
      box.querySelectorAll(".cd-front canvas").forEach((cv, i) => drawCard(cv, got[i].c, true));
      let flipped = 0;
      const flip = (b) => { if (b.classList.contains("on")) return; b.classList.add("on"); flipped++; const g = got[[...box.querySelectorAll(".cd-flip")].indexOf(b)];
        if (g.c.r >= 2) { const r = b.getBoundingClientRect(); world.confetti(r.left + r.width / 2, r.top + r.height / 2, g.c.r === 3 ? 60 : 30); }
        if (flipped === 3) box.querySelector(".cd-ok").hidden = false; };
      box.querySelectorAll(".cd-flip").forEach((b, i) => { b.onclick = () => flip(b); setTimeout(() => flip(b), 2500 + i * 700); });
      box.querySelector(".cd-ok").onclick = () => { box.remove(); o.onClose && o.onClose(); key = ""; render(); };
      return got;
    }
    L.giveCardPack = (n = 1) => { C().packs += n; L.changed(); };
    // the Moon Cat leaves its own card (and a star) when you catch it
    world.onMoonCat = () => {
      const X = C(), c = byId.m_moon, isNew = add(c); L.wallet.stars++; L.earn(20); if (L.addPawPoints) L.addPawPoints(60); if (L.gainPXP) L.gainPXP(25);
      toast(isNew ? t().got(nameOf(c), "🌙 +1⭐ +20🪙") : `🌙 +1⭐ +20🪙 ${t().dupe(DUST[3])}`); L.changed(); save();
    };

    // ---- the panel
    const root = document.createElement("div"); root.className = "ui mk cd"; root.hidden = true; document.body.appendChild(root);
    let key = "", placeT = 0, sel = null;
    function render() {
      const X = C(), s = t(); const k = [L.lang, X.packs, X.dust, JSON.stringify(X.own), sel, L.wallet.coins, L.wallet.stars].join("|"); if (k === key) return; key = k;
      const sc = root.querySelector(".mk-body"), keep = sc ? sc.scrollTop : 0;
      const d = new Date(), toMon = 7 - ((d.getDay() + 6) % 7);
      root.innerHTML = `<div class="mk-head"><b>🃏 ${esc(s.title)}</b><span class="mk-wal"><span class="coin">🪙 ${L.wallet.coins}</span><span class="star">⭐ ${L.wallet.stars}</span></span><button type="button" class="st-x" data-a="close">×</button></div>
        <div class="mk-body">
          <div class="cd-top"><b>${esc(s.done(owned(), CARDS.length))}</b><span>${esc(s.dust(X.dust))}</span></div>
          ${X.packs > 0 ? `<button type="button" class="mk-wide gold cd-pack" data-open="1">📦 ${esc(s.open)} <small>(${esc(s.packs(X.packs))})</small></button>` : `<p class="pg-pts">${esc(s.freeIn(toMon))}</p>`}
          <button type="button" class="mk-wide" data-buy="1"${L.wallet.coins < PACK ? " disabled" : ""}>${esc(s.buy)}</button>
          <p class="mk-note">${esc(s.hint)}</p>
          ${RAR.map((rn, r) => `<h4 class="mk-h">${["⚪", "🔵", "🟣", "🟡"][r]} ${esc(s.rar[rn])} <small>${CARDS.filter((c) => c.r === r && X.own[c.id]).length}/${CARDS.filter((c) => c.r === r).length}${X.rows.includes(rn) ? " ✓" : ""}</small></h4>
            <div class="cd-grid">${CARDS.filter((c) => c.r === r).map((c) => { const n = X.own[c.id] || 0; return `<button type="button" class="cd-card r${r}${n ? "" : " no"}${sel === c.id ? " sel" : ""}" data-c="${c.id}"><canvas width="96" height="124" data-cv="${c.id}"></canvas><b>${n ? esc(nameOf(c)) : "?"}</b>${n > 1 ? `<i>${esc(s.have(n))}</i>` : ""}${!n && sel === c.id ? `<span class="cd-craft${X.dust < CRAFT[r] ? " off" : ""}" data-craft="${c.id}">${esc(s.craft(CRAFT[r]))}</span>` : ""}</button>`; }).join("")}</div>`).join("")}
        </div>`;
      root.querySelectorAll("canvas[data-cv]").forEach((cv) => drawCard(cv, byId[cv.dataset.cv], !!X.own[cv.dataset.cv]));
      const nb = root.querySelector(".mk-body"); if (nb && keep) nb.scrollTop = keep;
    }
    root.addEventListener("click", (e) => {
      const b = e.target.closest("[data-a], [data-open], [data-buy], [data-craft], [data-c]"); if (!b) return; const X = C();
      if (b.dataset.a === "close") return close();
      if (b.dataset.open) { openPack(); }
      else if (b.dataset.buy) { if (L.wallet.coins >= PACK) { L.wallet.coins -= PACK; X.packs++; openPack(); } }
      else if (b.dataset.craft) { const c = byId[b.dataset.craft]; if (X.dust >= CRAFT[c.r] && !X.own[c.id]) { X.dust -= CRAFT[c.r]; add(c); toast(t().got(nameOf(c), "✨")); sel = null; L.changed(); save(); } }
      else if (b.dataset.c) sel = sel === b.dataset.c ? null : b.dataset.c;
      key = ""; render();
    });
    function place() {
      const bottom = Math.max(12, innerHeight - world.floor + 10);
      if (window.CatCard.beside(root)) return;
      root.style.height = ""; root.style.left = "auto"; root.style.right = "14px"; root.style.top = "auto"; root.style.bottom = `${bottom + 52}px`;
      root.style.setProperty("--maxh", `${Math.max(260, innerHeight - bottom - 80)}px`);
    }
    function open() { root.hidden = false; key = ""; render(); place(); clearInterval(placeT); placeT = setInterval(() => { place(); render(); }, 500); o.onOpen && o.onOpen(); }
    function close() { root.hidden = true; clearInterval(placeT); o.onClose && o.onClose(); }
    addEventListener("keydown", (e) => { if (e.key === "Escape" && !root.hidden) close(); });
    setTimeout(() => { C(); }, 1000);
    return { open, close, get isOpen() { return !root.hidden; }, packs: () => C().packs, openPack, CARDS, t };
  }
  window.CatCards = { create };
})();
