// 🏅 Your own progress as a cat-sitter: a level that grows with everything you do, a skill tree to spend points in,
// and an album of every bird, coat and piece of furniture you've come across. Slow on purpose: months, not days.
(() => {
  const L = window.CatLife;
  // XP for the next level: 80 × level^1.8 (level 2 at 80, level 10 at about 5,000, level 20 at about 17,500)
  const need = (l) => Math.round(80 * Math.pow(l, 1.8));
  // the skill tree: three branches; a skill opens once you've spent enough points in its branch (2 per row)
  const SKILLS = {
    hotel: [
      { id: "h1", e: "😊", max: 3 }, { id: "h2", e: "🛏️", max: 2 }, { id: "h3", e: "📣", max: 2 }, { id: "h4", e: "💎", max: 1 },
    ],
    care: [
      { id: "c1", e: "🍲", max: 3 }, { id: "c2", e: "🩺", max: 3 }, { id: "c3", e: "💗", max: 3 }, { id: "c4", e: "🎓", max: 2 },
    ],
    craft: [
      { id: "k1", e: "🔧", max: 3 }, { id: "k2", e: "🧱", max: 3 }, { id: "k3", e: "💰", max: 2 }, { id: "k4", e: "🖥️", max: 2 },
    ],
  };
  const STR = {
    tr: {
      title: "Gelişim", lvl: (n) => `Seviye ${n}`, xp: (a, b) => `${a} / ${b} XP`, tabs: { level: "Seviye", skills: "Yetenekler", album: "Albüm" },
      pts: (n) => `🌟 ${n} yetenek puanı`, up: (n) => `🎉 Seviye ${n}! +1 yetenek puanı`,
      how: "Sevmek, mama vermek, oynamak, görevler, numaralar, misafir bakmak ve mini oyunlar XP verir. Albüme yeni bir şey girince de XP gelir.",
      perLvl: "Her seviye: +1 yetenek puanı ve 10🪙 × seviye. Her 5 seviyede bir +1⭐.",
      unlocks: "Seviyeyle açılanlar", catsAt: (n, l) => `🐱 ${n} kedi yeri (seviye ${l})`, furnAt: (p, l) => `🛋️ ${p}🪙 ve üstü eşyalar (seviye ${l})`,
      now: "şimdi", got: "✓",
      branches: { hotel: "🏨 Otelcilik", care: "🍗 Bakım", craft: "🛠️ Zanaat" },
      sk: {
        h1: ["Güler yüz", "Misafir ücretleri +%8 / kademe"], h2: ["Ek oda", "Aynı anda +1 misafir / kademe"], h3: ["İyi nam", "Ün daha hızlı artar, daha yavaş düşer"], h4: ["VIP müşteri", "Uzun kalan, iyi ödeyen misafirler daha sık gelir (+%40 ücret)"],
        c1: ["Doyurucu tarif", "Kediler +%10 / kademe daha uzun tok kalır"], c2: ["Sağlıklı yaşam", "Hastalanma şansı -%15 / kademe"], c3: ["Sevgi dolu", "Kazanılan sevgi +%10 / kademe"], c4: ["Usta eğitmen", "Numara öğretme şansı +%5 / kademe"],
        k1: ["Tamirci", "Tamir -%15 / kademe ucuz"], k2: ["Sağlam yapı", "Eşya ve oyuncaklar -%12 / kademe yavaş eskir"], k3: ["Hurdacı", "Satış fiyatı +%20 / kademe"], k4: ["Altın parmak", "Bilgisayar başında kazanılan altın sınırı +5 / kademe"],
      },
      learn: "Öğren", locked: (n) => `🔒 Bu dalda ${n} puan harca`, full: "Tamam", noPts: "Puan yok",
      pages: { birds: "🐦 Kuşlar", coats: "🐱 Kedi cinsleri", furn: "🛋️ Eşyalar" },
      birdN: { sparrow: "Serçe", pigeon: "Güvercin", bluebird: "Mavi kuş", robin: "Kızılgerdan", canary: "Kanarya", cardinal: "Kardinal", crow: "Karga", magpie: "Saksağan", parrot: "Papağan", owl: "Baykuş" },
      claim: (r) => `🎁 Ödülü al: ${r}`, claimed: "✓ Ödül alındı", reward: (st, c) => `⭐${st} + ${c}🪙`, albumHint: "Bir sayfayı tamamlayınca ödülünü alırsın. Nadir kuşlar: papağan, gece de baykuş.",
      newEntry: (n) => `📖 Albüme eklendi: ${n}`,
    },
    en: {
      title: "Progress", lvl: (n) => `Level ${n}`, xp: (a, b) => `${a} / ${b} XP`, tabs: { level: "Level", skills: "Skills", album: "Album" },
      pts: (n) => `🌟 ${n} skill point${n === 1 ? "" : "s"}`, up: (n) => `🎉 Level ${n}! +1 skill point`,
      how: "Petting, feeding, playing, tasks, tricks, looking after guests and mini games all give XP. So does every new album entry.",
      perLvl: "Every level: +1 skill point and 10🪙 × level. Every 5 levels: +1⭐.",
      unlocks: "Unlocked by level", catsAt: (n, l) => `🐱 Room for ${n} cats (level ${l})`, furnAt: (p, l) => `🛋️ Furniture from ${p}🪙 up (level ${l})`,
      now: "now", got: "✓",
      branches: { hotel: "🏨 Hotel", care: "🍗 Care", craft: "🛠️ Craft" },
      sk: {
        h1: ["Warm welcome", "Guest pay +8% per rank"], h2: ["Spare room", "+1 guest at a time per rank"], h3: ["Good name", "Rating rises faster, falls slower"], h4: ["VIP guests", "Long, well-paying stays come more often (+40% pay)"],
        c1: ["Hearty recipes", "Cats stay full 10% longer per rank"], c2: ["Healthy living", "15% less chance of falling ill per rank"], c3: ["Full of love", "+10% love gained per rank"], c4: ["Master trainer", "+5% trick success per rank"],
        k1: ["Handy", "Repairs 15% cheaper per rank"], k2: ["Built to last", "Things and toys wear 12% slower per rank"], k3: ["Haggler", "Sell for 20% more per rank"], k4: ["Golden touch", "+5 to the daily coins from computer time per rank"],
      },
      learn: "Learn", locked: (n) => `🔒 Spend ${n} points in this branch`, full: "Maxed", noPts: "No points",
      pages: { birds: "🐦 Birds", coats: "🐱 Cat coats", furn: "🛋️ Furniture" },
      birdN: { sparrow: "Sparrow", pigeon: "Pigeon", bluebird: "Bluebird", robin: "Robin", canary: "Canary", cardinal: "Cardinal", crow: "Crow", magpie: "Magpie", parrot: "Parrot", owl: "Owl" },
      claim: (r) => `🎁 Claim: ${r}`, claimed: "✓ Claimed", reward: (st, c) => `⭐${st} + ${c}🪙`, albumHint: "Finish a page to claim its reward. Rare birds: the parrot, and the owl at night.",
      newEntry: (n) => `📖 New in the album: ${n}`,
    },
  };
  const PAGE_REWARD = { birds: [3, 150], coats: [2, 100], furn: [5, 500] };
  const BIRD_IDS = ["sparrow", "pigeon", "bluebird", "robin", "canary", "cardinal", "crow", "magpie", "parrot", "owl"];
  // how many cats you can have, and which furniture you may buy, grow with your level
  const CAT_SLOTS = [[1, 4], [4, 5], [7, 6], [10, 7], [13, 8]];
  const FURN_LVL = [[100, 1], [150, 2], [200, 3], [250, 5], [300, 7], [Infinity, 9]];

  L.prog = { xp: 0, lvl: 1, pts: 0, skills: {}, album: { birds: [], coats: [], furn: [] }, claimed: {} };
  L.sk = (id) => (L.prog.skills[id] || 0);
  L.needXP = need;
  L.furnLevel = (price) => { for (const [p, l] of FURN_LVL) if (price < p) return l; return 9; };
  L.catSlots = () => { let n = 4; for (const [l, k] of CAT_SLOTS) if (L.prog.lvl >= l) n = k; return n; };
  L.gainPXP = (n) => {
    n = Math.max(0, n); if (!n) return; const P = L.prog; P.xp += n;
    while (P.xp >= need(P.lvl)) {
      P.xp -= need(P.lvl); P.lvl++; P.pts++;
      L.earn(10 * P.lvl); if (P.lvl % 5 === 0) L.wallet.stars++;
      if (L.onLevelUp) L.onLevelUp(P.lvl);
    }
    L.changed();
  };
  // album entries: the first time you see / own something
  L.albumAdd = (page, id) => {
    const A = L.prog.album; A[page] = A[page] || [];
    if (!id || A[page].includes(id)) return false;
    A[page].push(id); L.gainPXP(page === "furn" ? 5 : 15);
    if (L.onAlbum) L.onAlbum(page, id);
    return true;
  };

  function create(o) {
    const { world } = o, DC = window.DesktopCat;
    const root = document.createElement("div"); root.className = "ui mk pg"; root.hidden = true; document.body.appendChild(root);
    let tab = "level", key = "", placeT = 0;
    const t = () => STR[L.lang] || STR.en;
    const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
    const spentIn = (b) => SKILLS[b].reduce((a, k) => a + L.sk(k.id), 0);
    const pageList = (pg) => (pg === "birds" ? BIRD_IDS : pg === "coats" ? DC.COAT_KEYS : Object.keys(DC.FURN));
    const pageName = (pg, id) => (pg === "birds" ? t().birdN[id] : pg === "coats" ? L.COAT_NAMES[id][L.lang] : (L.t("furn")[id] || [id])[0]);

    function render() {
      const P = L.prog, s = t(), k = [L.lang, tab, P.xp | 0, P.lvl, P.pts, JSON.stringify(P.skills), JSON.stringify(P.album), JSON.stringify(P.claimed), L.wallet.coins, L.wallet.stars].join("|");
      if (k === key) return; key = k;
      const pct = Math.min(100, (P.xp / need(P.lvl)) * 100);
      let body = "";
      if (tab === "level") {
        const nextCats = CAT_SLOTS.find(([l]) => l > P.lvl), nextFurn = FURN_LVL.find(([, l]) => l > P.lvl);
        body = `<div class="pg-lvl"><div class="pg-badge">${P.lvl}</div><div class="pg-bar"><b>${esc(s.lvl(P.lvl))}</b><span class="pg-track"><i style="width:${pct}%"></i></span><small>${esc(s.xp(Math.floor(P.xp), need(P.lvl)))}</small></div></div>
          <p class="pg-pts">${esc(s.pts(P.pts))}</p>
          <p class="mk-note">${esc(s.how)}</p><p class="mk-note">${esc(s.perLvl)}</p>
          <h4 class="mk-h">🔓 ${esc(s.unlocks)}</h4>
          <ul class="pg-ul">${CAT_SLOTS.map(([l, n]) => `<li class="${P.lvl >= l ? "ok" : ""}">${esc(s.catsAt(n, l))}</li>`).join("")}
          ${FURN_LVL.slice(1).map(([, l], i) => `<li class="${P.lvl >= l ? "ok" : ""}">${esc(s.furnAt(FURN_LVL[i][0], l))}</li>`).join("")}</ul>`;
        void nextCats; void nextFurn;
      } else if (tab === "skills") {
        body = `<p class="pg-pts">${esc(s.pts(P.pts))}</p>` + Object.entries(SKILLS).map(([b, list]) => {
          const spent = spentIn(b);
          return `<h4 class="mk-h">${esc(s.branches[b])} <small>${spent}</small></h4><div class="pg-sk">${list.map((k, i) => {
            const r = L.sk(k.id), [nm, ds] = s.sk[k.id], gate = i * 2, open = spent >= gate || r > 0;
            const btn = r >= k.max ? `<span class="pg-full">${esc(s.full)}</span>` : !open ? `<span class="pg-lock">${esc(s.locked(gate))}</span>`
              : `<button type="button" data-learn="${k.id}"${P.pts < 1 ? " disabled" : ""}>${esc(P.pts < 1 ? s.noPts : s.learn)}</button>`;
            return `<div class="pg-skill${open ? "" : " off"}"><span class="pg-ic">${k.e}</span><div><b>${esc(nm)}</b><small>${esc(ds)}</small><span class="pg-dots">${"●".repeat(r)}${"○".repeat(k.max - r)}</span></div>${btn}</div>`;
          }).join("")}</div>`;
        }).join("");
      } else {
        body = `<p class="mk-note">${esc(s.albumHint)}</p>` + ["birds", "coats", "furn"].map((pg) => {
          const all = pageList(pg), have = P.album[pg] || [], n = all.filter((x) => have.includes(x)).length, done = n >= all.length, [st, c] = PAGE_REWARD[pg];
          const foot = P.claimed[pg] ? `<p class="pg-claimed">${esc(s.claimed)}</p>` : `<button type="button" class="mk-wide" data-claim="${pg}"${done ? "" : " disabled"}>${esc(s.claim(s.reward(st, c)))}</button>`;
          return `<h4 class="mk-h">${esc(s.pages[pg])} <small>${n} / ${all.length}</small></h4><div class="pg-album">${all.map((id) => {
            const got = have.includes(id);
            return `<div class="pg-ent${got ? "" : " no"}" title="${got ? esc(pageName(pg, id)) : "?"}">${pg === "furn" ? `<canvas width="48" height="36" data-f="${id}"></canvas>` : `<canvas width="40" height="36" data-${pg === "birds" ? "b" : "c"}="${id}"></canvas>`}${got ? "" : "<i>?</i>"}</div>`;
          }).join("")}</div>${foot}`;
        }).join("");
      }
      root.innerHTML = `<div class="mk-head"><b>🏅 ${esc(s.title)}</b><span class="mk-wal"><span class="coin">🪙 ${L.wallet.coins}</span><span class="star">⭐ ${L.wallet.stars}</span></span><button type="button" class="st-x" data-a="close">×</button></div>
        <div class="mk-tabs">${["level", "skills", "album"].map((id) => `<button type="button" data-tab="${id}" class="${tab === id ? "on" : ""}"><span>${{ level: "⭐", skills: "🌳", album: "📖" }[id]}</span>${esc(s.tabs[id])}</button>`).join("")}</div>
        <div class="mk-body">${body}</div>`;
      // pictures in the album (silhouettes for what you haven't found yet)
      root.querySelectorAll("canvas[data-f]").forEach((cv) => { DC.furnitureThumb(cv.dataset.f, cv.getContext("2d")); });
      root.querySelectorAll("canvas[data-c]").forEach((cv) => { DC.portrait(cv.getContext("2d"), cv.dataset.c, { scale: 0.75, dx: 1, dy: 2 }); });
      root.querySelectorAll("canvas[data-b]").forEach((cv) => { if (DC.birdThumb) DC.birdThumb(cv.getContext("2d"), cv.dataset.b, cv.width, cv.height); });
    }
    root.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.a === "close") return close();
      if (b.dataset.tab) { tab = b.dataset.tab; key = ""; return render(); }
      if (b.dataset.learn) {
        const id = b.dataset.learn, def = Object.values(SKILLS).flat().find((k) => k.id === id);
        if (L.prog.pts > 0 && L.sk(id) < def.max) { L.prog.pts--; L.prog.skills[id] = L.sk(id) + 1; world.confetti(innerWidth / 2, 140, 16); L.changed(); }
        key = ""; return render();
      }
      if (b.dataset.claim) {
        const pg = b.dataset.claim, all = pageList(pg), have = L.prog.album[pg] || [];
        if (!L.prog.claimed[pg] && all.every((x) => have.includes(x))) { const [st, c] = PAGE_REWARD[pg]; L.prog.claimed[pg] = true; L.wallet.stars += st; L.earn(c); world.confetti(innerWidth / 2, 140, 60); L.changed(); }
        key = ""; return render();
      }
    });
    function place() {
      if (window.CatCard.beside(root)) return;
      root.style.height = ""; root.style.left = `${Math.max(8, innerWidth - root.offsetWidth - 14)}px`; root.style.top = "60px";
      root.style.right = "auto"; root.style.bottom = "auto"; root.style.setProperty("--maxh", `${innerHeight - 120}px`);
    }
    function open(which) { if (which) tab = which; key = ""; root.hidden = false; render(); place(); clearInterval(placeT); placeT = setInterval(() => { place(); render(); }, 500); o.onOpen && o.onOpen(); }
    function close() { root.hidden = true; clearInterval(placeT); o.onClose && o.onClose(); }
    addEventListener("keydown", (e) => { if (e.key === "Escape" && !root.hidden) close(); });
    return { open, close, render: () => { key = ""; if (!root.hidden) render(); }, get isOpen() { return !root.hidden; }, t };
  }
  window.CatProgress = { create, SKILLS, need };
})();
