// 🐾 The Paw Path: a monthly reward track. Paw points (🐾) come from almost everything you do (a share of all your XP),
// from three daily paw quests and from popping the dream bubbles sleeping cats blow. Every 150 🐾 is a step on the path,
// and every step has a reward to claim: coins, food, stars, and three special prizes along the way. It starts again each month.
(() => {
  const L = window.CatLife;
  const STEP = 150, STEPS = 30, DAY_ALL = 60;          // points per step, steps per month, bonus for finishing all three quests
  const QUESTS = {
    pet:     { e: "🤲", n: [20, 35], pp: 70, care: "pet" },
    fed:     { e: "🥣", n: [2, 4], pp: 70, care: "fed" },
    play:    { e: "🧶", n: [8, 15], pp: 80, care: "play" },
    dress:   { e: "👗", n: [1, 2], pp: 60, care: "dress" },
    cuddle:  { e: "🫂", n: [1, 1], pp: 110, care: "cuddle" },
    harvest: { e: "🧺", n: [1, 3], pp: 90, stat: "harvests" },
    wish:    { e: "💭", n: [1, 3], pp: 90, stat: "wishes" },
    photo:   { e: "📸", n: [1, 1], pp: 70, stat: "photos" },
    park:    { e: "🌳", n: [1, 1], pp: 100, stat: "parks" },
    dream:   { e: "🫧", n: [2, 4], pp: 90, stat: "dreams" },
    game:    { e: "🎮", n: [1, 2], pp: 70, stat: "games" },
    guest:   { e: "🧳", n: [1, 1], pp: 110, stat: "guestsPaid" },
  };
  // what each step gives; 10, 20 and 30 are the big ones
  const BIG = { 10: { outfit: "royal", alt: 3 }, 20: { hat: "halo", alt: 4 }, 30: { outfit: "moonclaw", alt: 6, stars: 3 } };
  function rewardOf(i) {
    if (BIG[i]) return { big: BIG[i] };
    if (i % 5 === 0) return { stars: 1 };
    if (i % 5 === 2) return { meal: 1 };
    if (i % 5 === 4) return { food: ["treat", 2 + (i / 10 | 0)] };
    if (i % 5 === 3) return { pack: 1 };
    return { coins: 15 + i * 3 };
  }
  const STR = {
    tr: {
      title: "Pati Yolu", month: (m, d) => `${m} yolu · ${d} gün kaldı`, pts: (a, b) => `🐾 ${a} / ${b}`, step: (n) => `${n}. adım`,
      hint: "Yaptığın her şey 🐾 pati puanı kazandırır: sevmek, beslemek, oynamak, bahçe, dilekler… Her 150 🐾 bir adım, her adımda bir ödül! Ay bitince yol yeniden başlar.",
      quests: "Bugünün pati görevleri", allDone: (n) => `Üçü de bitince +${n} 🐾 bonus`, allGot: "✨ Bugünün görevleri tamam! Yarın yenileri gelir.",
      q: { pet: (n) => `Kedilerini ${n} kez sev`, fed: (n) => `${n} kez mama ver`, play: (n) => `Oyuncaklarla ${n} kez oyna`, dress: (n) => `${n} kez bir kediyi giydir`,
        cuddle: () => "İki kedin sarılıp uyusun", harvest: (n) => `${n} hasat yap`, wish: (n) => `${n} dilek gerçekleştir`, photo: () => "Bir fotoğraf paylaş",
        park: () => "Kedilerini parka götür", dream: (n) => `${n} rüya balonu patlat`, game: (n) => `${n} mini oyun oyna`, guest: () => "Bir misafir kediyi sahibine teslim et" },
      claim: "Al", claimAll: (n) => `🎁 ${n} ödülü al`, got: (w) => `🐾 Pati Yolu ödülü: ${w}`, qDone: (e, pp) => `${e} Pati görevi tamam! +${pp} 🐾`, stepUp: (n) => `🐾 Pati Yolu: ${n}. adıma ulaştın! Ödülün seni bekliyor`,
      dreamPop: (w) => `🫧 Rüya balonu: ${w}`, legend: "🐾 Pati Efsanesi", months: ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"],
      big: { royal: "Kraliyet pelerini", halo: "Melek halesi", moonclaw: "Ay Pençesi kostümü" },
    },
    en: {
      title: "Paw Path", month: (m, d) => `${m} path · ${d} days left`, pts: (a, b) => `🐾 ${a} / ${b}`, step: (n) => `Step ${n}`,
      hint: "Everything you do earns 🐾 paw points: petting, feeding, playing, the garden, wishes… Every 150 🐾 is a step, and every step has a reward! The path starts again each month.",
      quests: "Today's paw quests", allDone: (n) => `Finish all three for a +${n} 🐾 bonus`, allGot: "✨ All done for today! New quests tomorrow.",
      q: { pet: (n) => `Pet your cats ${n} times`, fed: (n) => `Feed them ${n} times`, play: (n) => `Play with toys ${n} times`, dress: (n) => `Dress a cat up ${n} time${n > 1 ? "s" : ""}`,
        cuddle: () => "Have two cats snuggle up", harvest: (n) => `Harvest ${n} time${n > 1 ? "s" : ""}`, wish: (n) => `Grant ${n} wish${n > 1 ? "es" : ""}`, photo: () => "Post a photo",
        park: () => "Take your cats to the park", dream: (n) => `Pop ${n} dream bubbles`, game: (n) => `Play ${n} mini game${n > 1 ? "s" : ""}`, guest: () => "Hand a guest cat back to its owner" },
      claim: "Claim", claimAll: (n) => `🎁 Claim ${n} reward${n > 1 ? "s" : ""}`, got: (w) => `🐾 Paw Path reward: ${w}`, qDone: (e, pp) => `${e} Paw quest done! +${pp} 🐾`, stepUp: (n) => `🐾 Paw Path: you reached step ${n}! A reward is waiting`,
      dreamPop: (w) => `🫧 Dream bubble: ${w}`, legend: "🐾 Paw Legend", months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
      big: { royal: "Royal robe", halo: "Halo", moonclaw: "Moon Claw suit" },
    },
  };
  const t = () => STR[L.lang] || STR.en;
  const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const monthKey = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}`; };
  const dayKey = () => new Date().toDateString();
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

  function create(o) {
    const { world, save, toast } = o, DC = window.DesktopCat;
    const P = () => {
      const x = (L.extra.pass = L.extra.pass || {});
      if (x.month !== monthKey()) { x.month = monthKey(); x.pp = 0; x.claimed = []; }
      if (x.day !== dayKey()) {
        x.day = dayKey(); x.cnt = {}; x.bonus = false;
        const ids = Object.keys(QUESTS).sort(() => Math.random() - 0.5).slice(0, 3);
        x.quests = ids.map((id) => { const q = QUESTS[id]; return { id, n: rnd(q.n[0], q.n[1]), base: q.stat ? L.stats[q.stat] || 0 : 0, done: false }; });
      }
      return x;
    };
    const stepOf = (pp) => Math.min(STEPS, Math.floor(pp / STEP));
    function addPP(n) {
      if (!n) return; const x = P(), before = stepOf(x.pp); x.pp += n; const after = stepOf(x.pp);
      if (after > before) { toast(t().stepUp(after)); world.confetti(innerWidth / 2, 140, 30); }
      L.changed();
    }
    L.addPawPoints = addPP;
    // a share of every bit of XP becomes paw points
    const gain0 = L.gainPXP; L.gainPXP = (n) => { gain0(n); if (n > 0) { pend += n * 0.6; if (pend >= 1) { const k = Math.floor(pend); pend -= k; addPP(k); } } };
    let pend = 0;
    // count the care that actually counted (not the taps that were too soon)
    const care0 = L.care.bind(L);
    L.care = (cat, kind, arg = {}) => {
      const p = cat && cat.profile, key = kind + (arg.toyKey ? ":" + arg.toyKey : ""), was = p && p.lastR ? p.lastR[key] : 0;
      const r = care0(cat, kind, arg);
      if (p && !p.guest && p.lastR && p.lastR[key] !== was) { const x = P(); x.cnt[kind] = (x.cnt[kind] || 0) + 1; }
      return r;
    };
    const progOf = (q) => { const d = QUESTS[q.id], x = P(); return Math.min(q.n, d.stat ? (L.stats[d.stat] || 0) - q.base : x.cnt[d.care] || 0); };
    function check() {
      const x = P(); let changed = false;
      for (const q of x.quests) if (!q.done && progOf(q) >= q.n) { q.done = true; changed = true; const d = QUESTS[q.id]; addPP(d.pp); toast(t().qDone(d.e, d.pp)); if (L.gainPXP) gain0(15); }
      if (!x.bonus && x.quests.every((q) => q.done)) { x.bonus = true; addPP(DAY_ALL); world.confetti(innerWidth / 2, 160, 50); changed = true; }
      if (changed) { L.changed(); save(); }
    }
    setInterval(check, 2000);

    function give(i) {
      const x = P(); if (x.claimed.includes(i) || stepOf(x.pp) < i) return null;
      x.claimed.push(i); const r = rewardOf(i), out = [];
      if (r.coins) out.push(`+${L.earn(r.coins)}🪙`);
      if (r.stars) { L.wallet.stars += r.stars; out.push(`+${r.stars}⭐`); }
      if (r.meal) { const sp = Object.keys(L.FOOD).filter((f) => L.FOOD[f].buff); const f = sp[Math.floor(Math.random() * sp.length)]; L.pantry[f] = (L.pantry[f] || 0) + 1; out.push(L.FOOD[f].e); }
      if (r.pack && L.giveCardPack) { L.giveCardPack(1); out.push("🃏📦"); }
      if (r.food) { const [f, n] = r.food; if (L.FOOD[f]) { L.pantry[f] = (L.pantry[f] || 0) + n; out.push(`${L.FOOD[f].e}×${n}`); } }
      if (r.big) {
        const [kind, d] = r.big.outfit ? ["outfit", r.big.outfit] : ["hat", r.big.hat];
        if (!L.wallet.owned.includes(`${kind}:${d}`)) { L.wallet.owned.push(`${kind}:${d}`); out.push(`👑 ${t().big[d]}`); } else { L.wallet.stars += r.big.alt; out.push(`+${r.big.alt}⭐`); }
        if (r.big.stars) { L.wallet.stars += r.big.stars; out.push(`+${r.big.stars}⭐`); }
        if (i === STEPS) { L.extra.legend = (L.extra.legend || 0) + 1; out.push(t().legend); }
        world.confetti(innerWidth / 2, 140, 80);
      }
      L.changed(); save(); return out.join(" ");
    }

    // ---- 🫧 dream bubbles: sleeping cats blow them now and then; pop them for coins and paw points
    world.dreamsOn = true;
    world.onDream = (b) => {
      const out = [];
      if (b.gold) { out.push(`+${L.earn(8)}🪙`); addPP(40); out.push("+40🐾"); if (Math.random() < 0.12) { L.wallet.stars++; out.push("⭐"); } }
      else { out.push(`+${L.earn(1 + (Math.random() < 0.4 ? 1 : 0))}🪙`); addPP(12); out.push("+12🐾"); }
      L.stats.dreams = (L.stats.dreams || 0) + 1; gain0(2);
      toast(t().dreamPop(out.join(" "))); L.changed();
    };

    // ---- the panel (a tab in the menu)
    const root = document.createElement("div"); root.className = "ui mk pp"; root.hidden = true; document.body.appendChild(root);
    let key = "", placeT = 0;
    function render() {
      const x = P(), s = t(), st = stepOf(x.pp), ready = []; for (let i = 1; i <= st; i++) if (!x.claimed.includes(i)) ready.push(i);
      const k = [L.lang, x.pp, x.claimed.join(), x.quests.map((q) => progOf(q) + (q.done ? "d" : "")).join(), L.wallet.coins, L.wallet.stars].join("|"); if (k === key) return; key = k;
      const d = new Date(), left = new Date(d.getFullYear(), d.getMonth() + 1, 1) - d, days = Math.max(1, Math.ceil(left / 864e5));
      const into = st >= STEPS ? STEP : x.pp - st * STEP;
      const ico = (i) => { const r = rewardOf(i); return r.big ? (r.big.outfit === "moonclaw" ? "👑" : r.big.hat ? "😇" : "🎩") : r.stars ? "⭐" : r.pack ? "🃏" : r.meal ? "🍱" : r.food ? "🍬" : "🪙"; };
      const sc = root.querySelector(".mk-body"), keep = sc ? sc.scrollTop : 0;
      root.innerHTML = `<div class="mk-head"><b>🐾 ${esc(s.title)}</b><span class="mk-wal"><span class="coin">🪙 ${L.wallet.coins}</span><span class="star">⭐ ${L.wallet.stars}</span></span><button type="button" class="st-x" data-a="close">×</button></div>
        <div class="mk-body">
          <div class="pp-top"><b>${esc(s.month(s.months[d.getMonth()], days))}</b><span>${esc(s.step(Math.min(STEPS, st + 1 > STEPS ? STEPS : st)))}</span></div>
          <div class="pp-bar"><i style="width:${(into / STEP) * 100}%"></i><em>${esc(st >= STEPS ? "✨" : s.pts(into, STEP))}</em></div>
          <p class="mk-note">${esc(s.hint)}</p>
          <h4 class="mk-h">📜 ${esc(s.quests)}</h4>
          <div class="pp-quests">${x.quests.map((q) => { const D = QUESTS[q.id], pr = progOf(q); return `<div class="pp-q${q.done ? " done" : ""}"><span>${D.e}</span><div><b>${esc(s.q[q.id](q.n))}</b><span class="pp-mini"><i style="width:${(pr / q.n) * 100}%"></i></span></div><em>${q.done ? "✓" : `${pr}/${q.n}`}<small>+${D.pp}🐾</small></em></div>`; }).join("")}</div>
          <small class="pp-all">${esc(x.bonus ? s.allGot : s.allDone(DAY_ALL))}</small>
          ${ready.length ? `<button type="button" class="mk-wide gold pp-claimall" data-all="1">${esc(s.claimAll(ready.length))}</button>` : ""}
          <div class="pp-track">${Array.from({ length: STEPS }, (_, j) => { const i = j + 1, got = x.claimed.includes(i), can = !got && i <= st;
            return `<button type="button" class="pp-step${got ? " got" : can ? " can" : i === st + 1 ? " next" : ""}${BIG[i] ? " big" : ""}" data-step="${i}"${can ? "" : " disabled"}><small>${i}</small><span>${got ? "✓" : ico(i)}</span></button>`; }).join("")}</div>
        </div>`;
      const nb = root.querySelector(".mk-body"); if (nb && keep) nb.scrollTop = keep;
    }
    root.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.a === "close") return close();
      if (b.dataset.step) { const w = give(+b.dataset.step); if (w) { toast(t().got(w)); world.burst(innerWidth / 2, 200, "spark", "#ffd34d", 6); } key = ""; render(); }
      if (b.dataset.all) { const x = P(), out = []; for (let i = 1; i <= stepOf(x.pp); i++) { const w = give(i); if (w) out.push(w); } if (out.length) toast(t().got(out.join(" · "))); key = ""; render(); }
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
    const readyCount = () => { const x = P(); let n = 0; for (let i = 1; i <= stepOf(x.pp); i++) if (!x.claimed.includes(i)) n++; return n + x.quests.filter((q) => !q.done).length * 0; };
    setTimeout(() => { P(); check(); }, 1500);
    return { open, close, get isOpen() { return !root.hidden; }, readyCount, addPP, t };
  }
  window.CatPass = { create };
})();
