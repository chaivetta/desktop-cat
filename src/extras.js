// 🌱 The garden, the photo feed, the weekly contest and the seasonal festivals, in one panel beside the card.
// Plants grow for real hours (water them), photos collect likes for a day, contests are judged when the week ends.
(() => {
  const L = window.CatLife;
  const H = 3.6e6, DAY = 24 * H;
  const CROPS = {
    catnip: { e: "🌾", h: 1, seed: 5, xp: 3, give: { item: "catnip" } },
    mint: { e: "🌿", h: 3, seed: 10, xp: 8, give: { coins: 18 } },
    strawberry: { e: "🍓", h: 6, seed: 18, xp: 15, give: { meal: true } },
    sunflower: { e: "🌻", h: 12, seed: 30, xp: 30, give: { coins: 70, star: 0.05 } },
  };
  const PLOT_PRICE = [0, 0, 80, 200, 400, 800];          // the first two pots are free
  const WATER_FOR = 6 * H, DIES_AFTER = 12 * H;
  // festivals by date (month 1–12, day): items only sold while one is on, and a daily gift
  const EVENTS = [
    { id: "winter", e: "❄️", from: [11, 20], to: [1, 10], items: ["snowman", "giftbox", "candycane"] },
    { id: "spring", e: "🌸", from: [3, 20], to: [4, 30], items: ["tulips", "birdhouse"] },
    { id: "summer", e: "🏖️", from: [7, 1], to: [8, 31], items: ["parasol", "beachball"] },
    { id: "halloween", e: "🎃", from: [10, 10], to: [11, 5], items: ["ghost", "cauldron"] },
  ];
  const inRange = (d, [fm, fd], [tm, td]) => { const v = (d.getMonth() + 1) * 100 + d.getDate(), a = fm * 100 + fd, b = tm * 100 + td; return a <= b ? v >= a && v <= b : v >= a || v <= b; };
  const eventNow = (d = new Date()) => EVENTS.find((e) => inRange(d, e.from, e.to)) || null;
  const nextEvent = (d = new Date()) => { for (let i = 1; i < 370; i++) { const x = new Date(d.getTime() + i * DAY), e = eventNow(x); if (e) return { e, days: i }; } return null; };
  const weekKey = (d = new Date()) => { const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day); const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return `${t.getUTCFullYear()}-${Math.ceil(((t - y0) / DAY + 1) / 7)}`; };
  const CONTESTS = ["beauty", "tricks", "love"];
  const hash = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };

  const STR = {
    tr: {
      title: "Bahçe & Etkinlik", tabs: { garden: "Bahçe", feed: "Akış", contest: "Yarışma", event: "Etkinlik" },
      crops: { catnip: "Kedi otu", mint: "Nane", strawberry: "Çilek", sunflower: "Ayçiçeği" },
      give: { catnip: "1 kedi nanesi", mint: "18🪙", strawberry: "1 özel yemek", sunflower: "70🪙 (+ nadiren ⭐)" },
      plant: (n, p) => `${n} ek · ${p}🪙`, water: "💧 Sula", harvest: "🧺 Topla", dry: "Kurudu! Sula", dead: "Soldu 🥀 · Temizle", grow: (m) => `${m >= 60 ? Math.floor(m / 60) + " sa " : ""}${m % 60} dk`,
      empty: "Boş saksı", buyPlot: (p) => `🪴 Yeni saksı · ${p}🪙`, gardenHint: "Tohum ek, sula; bitki gerçek saatlerle büyür (uygulama kapalıyken de). Su 6 saat yeter; 12 saat susuz kalırsa solar.",
      harvested: (e, w) => `${e} Hasat: ${w}`,
      feedHint: "Karttaki 📸 ile çektiğin fotoğraflar buraya düşer, bir gün boyunca beğeni toplar. Kıyafetli, bakımlı ve mutlu kediler daha çok beğenilir. Günde en çok 3 paylaşım.",
      likes: (n) => `♥ ${n}`, collect: (c) => `Beğenileri topla · ${c}🪙`, collected: "✓ toplandı", noPosts: "Henüz fotoğraf yok. Kedinin kartından 📸 Fotoğraf çek!", today: (n) => `Bugün ${n}/3 paylaşım`,
      contests: { beauty: "💅 Güzellik yarışması", tricks: "🎓 Numara yarışması", love: "💗 Sevgi yarışması" },
      cHint: { beauty: "Kıyafetler, temizlik ve sevgi puan getirir.", tricks: "Bildiği numaralar puan getirir.", love: "Sevgi ve yerine getirilen istekler puan getirir." },
      enter: (n) => `Kat · 20🪙`, entered: (n) => `✓ ${n} yarışıyor`, ends: (d) => `Hafta sonunda sonuç: ${d} gün kaldı`, rank: (r) => `Şu anki tahmini sıra: ${r}.`, rivals: "Rakipler",
      trophies: "🏆 Kupaların", noTrophy: "Henüz kupa yok", pick: "Yarışacak kedini seç:", result: (n, r, w) => `🏆 Yarışma sonucu: ${n} ${r}. oldu! ${w}`,
      place: ["🥇", "🥈", "🥉"],
      evOn: (e) => `${e} şu an sürüyor!`, evNames: { winter: "Kış Şenliği", spring: "Bahar Şenliği", summer: "Yaz Festivali", halloween: "Cadılar Bayramı" },
      evLeft: (d) => `Bitmesine ${d} gün`, evNext: (n, d) => `Sıradaki etkinlik: ${n}, ${d} gün sonra`, evItems: "Sadece bu dönem satılan eşyalar (Market › Eşyalar):",
      gift: "🎁 Günlük etkinlik hediyesini al", giftTaken: "✓ Bugünün hediyesi alındı", giftGot: (w) => `🎁 Etkinlik hediyesi: ${w}`,
    },
    en: {
      title: "Garden & Events", tabs: { garden: "Garden", feed: "Feed", contest: "Contest", event: "Event" },
      crops: { catnip: "Catnip", mint: "Mint", strawberry: "Strawberry", sunflower: "Sunflower" },
      give: { catnip: "1 catnip", mint: "18🪙", strawberry: "1 special meal", sunflower: "70🪙 (+ rarely ⭐)" },
      plant: (n, p) => `Plant ${n} · ${p}🪙`, water: "💧 Water", harvest: "🧺 Harvest", dry: "Dry! Water it", dead: "Wilted 🥀 · Clear", grow: (m) => `${m >= 60 ? Math.floor(m / 60) + " h " : ""}${m % 60} min`,
      empty: "Empty pot", buyPlot: (p) => `🪴 New pot · ${p}🪙`, gardenHint: "Plant a seed and water it; it grows in real hours (even with the app closed). Water lasts 6 hours; 12 hours dry and it wilts.",
      harvested: (e, w) => `${e} Harvest: ${w}`,
      feedHint: "Photos you take with 📸 on a cat's card land here and gather likes for a day. Dressed-up, clean, happy cats get more. At most 3 posts a day.",
      likes: (n) => `♥ ${n}`, collect: (c) => `Collect likes · ${c}🪙`, collected: "✓ collected", noPosts: "No photos yet. Take one with 📸 on a cat's card!", today: (n) => `Today ${n}/3 posts`,
      contests: { beauty: "💅 Beauty contest", tricks: "🎓 Trick contest", love: "💗 Love contest" },
      cHint: { beauty: "Outfits, cleanliness and love score points.", tricks: "Tricks it knows score points.", love: "Love and granted wishes score points." },
      enter: () => "Enter · 20🪙", entered: (n) => `✓ ${n} is entered`, ends: (d) => `Judged at the end of the week: ${d} days left`, rank: (r) => `Standing right now: ${r}.`, rivals: "Rivals",
      trophies: "🏆 Your trophies", noTrophy: "No trophies yet", pick: "Pick a cat to enter:", result: (n, r, w) => `🏆 Contest result: ${n} came ${r}! ${w}`,
      place: ["🥇", "🥈", "🥉"],
      evOn: (e) => `${e} is on now!`, evNames: { winter: "Winter Fair", spring: "Spring Fair", summer: "Summer Festival", halloween: "Halloween" },
      evLeft: (d) => `${d} days to go`, evNext: (n, d) => `Next event: ${n}, in ${d} days`, evItems: "Things sold only during it (Market › Furniture):",
      gift: "🎁 Claim today's event gift", giftTaken: "✓ Today's gift claimed", giftGot: (w) => `🎁 Event gift: ${w}`,
    },
  };
  const RIVALS = ["Prens Max", "Lady Mia", "Kaptan Tom", "Bay Bıyık", "Kraliçe Luna", "Sultan Şeker", "Kont Pati", "Düşes Fifi"];
  const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  function create(o) {
    const { world, save, toast } = o, DC = window.DesktopCat;
    const root = document.createElement("div"); root.className = "ui mk ex"; root.hidden = true; document.body.appendChild(root);
    let tab = "garden", key = "", placeT = 0, picking = false;
    const t = () => STR[L.lang] || STR.en;
    L.extra = Object.assign({ plots: [null, null], posts: [], postDay: "", postN: 0, contest: null, trophies: [], giftDay: "" }, L.extra || {});
    const X = () => L.extra;

    // ---------------- garden
    const plotState = (p, now = Date.now()) => {
      if (!p) return "empty";
      if (p.dead) return "dead";
      if (p.grown >= CROPS[p.k].h * H) return "ready";
      return now - p.wateredAt > WATER_FOR ? "dry" : "growing";
    };
    function growGarden(now = Date.now()) {
      for (const p of X().plots) {
        if (!p || p.dead) continue;
        const last = p.lastT || p.at, wetUntil = p.wateredAt + WATER_FOR;
        const dt = Math.max(0, Math.min(now, wetUntil) - last); p.grown = Math.min(CROPS[p.k].h * H, (p.grown || 0) + dt); p.lastT = now;
        if (p.grown < CROPS[p.k].h * H && now - wetUntil > DIES_AFTER) p.dead = true;
      }
    }
    function plant(i, k) { const c = CROPS[k]; if (X().plots[i] || L.wallet.coins < c.seed) return; L.wallet.coins -= c.seed; const now = Date.now(); X().plots[i] = { k, at: now, wateredAt: now, grown: 0, lastT: now }; L.changed(); }
    function water(i) { const p = X().plots[i]; if (!p || p.dead) return; growGarden(); p.wateredAt = Date.now(); world.burst(innerWidth / 2, 200, "spark", "#6ad0ff", 4); L.changed(); }
    function harvest(i) {
      const p = X().plots[i]; if (plotState(p) !== "ready") return; const c = CROPS[p.k], s = t(); let what = [];
      if (c.give.item) { L.pantry[c.give.item] = (L.pantry[c.give.item] || 0) + 1; what.push(L.FOOD[c.give.item].e); }
      if (c.give.coins) what.push(`+${L.earn(c.give.coins)}🪙`);
      if (c.give.meal) { const sp = Object.keys(L.FOOD).filter((f) => L.FOOD[f].buff); const f = sp[Math.floor(Math.random() * sp.length)]; L.pantry[f] = (L.pantry[f] || 0) + 1; what.push(L.FOOD[f].e); }
      if (c.give.star && Math.random() < c.give.star) { L.wallet.stars++; what.push("⭐"); }
      X().plots[i] = null; L.stats.harvests = (L.stats.harvests || 0) + 1; if (L.gainPXP) L.gainPXP(c.xp);
      toast(s.harvested(c.e, what.join(" "))); world.confetti(innerWidth / 2, 160, 14); L.changed();
    }

    // ---------------- photo feed: hooked onto the card's 📸 button
    const care0 = L.care; L.care = (cat, kind, arg = {}) => { care0(cat, kind, arg); if (kind === "photo" && cat && cat.profile) post(cat); };
    function post(cat) {
      const p = cat.profile, today = new Date().toDateString(), E = X();
      if (E.postDay !== today) { E.postDay = today; E.postN = 0; }
      if (E.postN >= 3) return; E.postN++;
      const acc = p.acc || {}, dressed = ["hat", "collar", "outfit"].filter((k) => acc[k]).length, C = DC.COATS[p.coat] || {};
      const target = Math.round((20 + dressed * 18 + (C.wild ? 80 : 0) + p.love / 2 + (L.clean(p) > 70 ? 20 : 0)) * (0.7 + Math.random() * 0.6));
      const poses = ["sit", "loaf", "sleep", "stretch", "groom", "bellyUp"];
      E.posts.unshift({ id: Date.now().toString(36), name: p.name, coat: p.coat, acc: { ...acc }, pose: poses[Math.floor(Math.random() * poses.length)], at: Date.now(), target, got: false });
      E.posts = E.posts.slice(0, 12); L.stats.photos = (L.stats.photos || 0) + 1; L.changed();
    }
    const likesOf = (ps, now = Date.now()) => Math.round(ps.target * Math.pow(Math.min(1, (now - ps.at) / DAY), 0.7));
    const payOf = (ps) => Math.min(40, Math.floor(ps.target / 8));
    function collect(id) { const ps = X().posts.find((x) => x.id === id); if (!ps || ps.got || Date.now() - ps.at < DAY) return; ps.got = true; L.earn(payOf(ps)); if (L.gainPXP) L.gainPXP(5); L.changed(); }

    // ---------------- weekly contest: enter a cat; it's judged when the week rolls over
    const contestKind = (wk) => CONTESTS[hash(wk) % CONTESTS.length];
    function scoreOf(p, kind, wk) {
      const acc = p.acc || {}, dressed = ["hat", "collar", "outfit"].filter((k) => acc[k]).length, C = DC.COATS[p.coat] || {}, luck = hash(wk + p.id) % 30;
      if (kind === "beauty") return Math.round(dressed * 30 + L.clean(p) / 2 + p.love / 4 + (C.wild ? 40 : 0) + luck);
      if (kind === "tricks") return Math.round(Object.values(p.tricks || {}).reduce((a, n) => a + n, 0) * 6 + p.love / 5 + luck);
      return Math.round(p.love + (p.wishes || 0) * 2 + luck);
    }
    const rivals = (wk, kind) => RIVALS.map((n, i) => ({ n, sc: 55 + (hash(wk + kind + n) % 110) + i * 3 })).sort((a, b) => b.sc - a.sc).slice(0, 6);
    function standing(p, wk) { const kind = contestKind(wk), me = scoreOf(p, kind, wk); return 1 + rivals(wk, kind).filter((r) => r.sc > me).length; }
    function judge() {
      const C = X().contest, wk = weekKey(); if (!C || C.week === wk) return;
      const cat = world.cats.find((c) => c.profile && c.profile.id === C.cat), s = t();
      X().contest = null; if (!cat) return L.changed();
      const r = standing(cat.profile, C.week), reward = r === 1 ? [100, 2] : r === 2 ? [60, 1] : r === 3 ? [30, 0] : [0, 0];
      if (r <= 3) { X().trophies.unshift({ week: C.week, kind: contestKind(C.week), place: r, cat: cat.profile.name, coat: cat.profile.coat }); L.earn(reward[0]); L.wallet.stars += reward[1]; L.stats.wins = (L.stats.wins || 0) + (r === 1 ? 1 : 0); }
      if (L.gainPXP) L.gainPXP(r <= 3 ? 60 - r * 10 : 10);
      toast(s.result(cat.profile.name, r, r <= 3 ? `${s.place[r - 1]} +${reward[0]}🪙${reward[1] ? ` +${reward[1]}⭐` : ""}` : "")); L.changed();
    }
    function enter(id) { if (X().contest || L.wallet.coins < 20) return; L.wallet.coins -= 20; X().contest = { week: weekKey(), cat: id }; picking = false; L.changed(); }

    // ---------------- festival gift
    function gift() {
      const ev = eventNow(), today = new Date().toDateString(); if (!ev || X().giftDay === today) return;
      X().giftDay = today; const r = Math.random(), s = t(); let w;
      if (r < 0.6) w = `+${L.earn(8 + Math.floor(Math.random() * 12))}🪙`;
      else if (r < 0.9) { const sp = Object.keys(L.FOOD).filter((f) => L.FOOD[f].buff); const f = sp[Math.floor(Math.random() * sp.length)]; L.pantry[f] = (L.pantry[f] || 0) + 1; w = L.FOOD[f].e; }
      else { L.wallet.stars++; w = "⭐"; }
      toast(s.giftGot(w)); world.confetti(innerWidth / 2, 160, 24); L.changed();
    }

    // ---------------- the panel
    function render() {
      growGarden();
      const s = t(), E = X(), now = Date.now(), wk = weekKey();
      const k = [L.lang, tab, picking, Math.floor(now / 30e3), L.wallet.coins, L.wallet.stars, JSON.stringify(E.plots.map((p) => p && [p.k, plotState(p)])), E.posts.length, E.posts.map((p) => p.got).join(), JSON.stringify(E.contest), E.trophies.length, E.giftDay].join("|");
      if (k === key) return; key = k;
      let body = "";
      if (tab === "garden") {
        body = `<p class="mk-note">${esc(s.gardenHint)}</p><div class="gd-plots">${E.plots.map((p, i) => {
          const st = plotState(p);
          if (st === "empty") return `<div class="gd-pot empty"><div class="gd-pic">🪴</div><b>${esc(s.empty)}</b><div class="gd-seeds">${Object.entries(CROPS).map(([ck, c]) => `<button type="button" data-plant="${i}:${ck}" title="${esc(s.give[ck])}"${L.wallet.coins < c.seed ? " disabled" : ""}>${c.e}<small>${c.h}${L.lang === "tr" ? "sa" : "h"} · ${c.seed}🪙</small></button>`).join("")}</div></div>`;
          const c = CROPS[p.k], pct = Math.min(100, (p.grown / (c.h * H)) * 100), left = Math.ceil((c.h * H - p.grown) / 60e3);
          const pic = st === "dead" ? "🥀" : st === "ready" ? c.e : pct < 34 ? "🌱" : pct < 70 ? "🌿" : c.e;
          const btn = st === "ready" ? `<button type="button" class="gold" data-harvest="${i}">${esc(s.harvest)}</button>` : st === "dead" ? `<button type="button" data-clear="${i}">${esc(s.dead)}</button>` : `<button type="button" class="${st === "dry" ? "gold" : ""}" data-water="${i}">${esc(st === "dry" ? s.dry : s.water)}</button>`;
          const wet = Math.max(0, Math.ceil((p.wateredAt + WATER_FOR - now) / 60e3));
          return `<div class="gd-pot ${st}"><div class="gd-pic${st === "ready" ? " bob" : ""}">${pic}</div><b>${esc(s.crops[p.k])}</b><span class="gd-bar"><i style="width:${pct}%"></i></span><small>${st === "ready" ? "✓" : st === "dead" ? "" : `⏳ ${esc(s.grow(left))} · 💧 ${esc(s.grow(wet))}`}</small>${btn}</div>`;
        }).join("")}</div>${E.plots.length < PLOT_PRICE.length ? `<button type="button" class="mk-wide" data-plot="1"${L.wallet.coins < PLOT_PRICE[E.plots.length] ? " disabled" : ""}>${esc(s.buyPlot(PLOT_PRICE[E.plots.length]))}</button>` : ""}`;
      } else if (tab === "feed") {
        const today = new Date().toDateString(), n = E.postDay === today ? E.postN : 0;
        body = `<p class="mk-note">${esc(s.feedHint)}</p><p class="pg-pts">${esc(s.today(n))}</p>` + (E.posts.length ? `<div class="fd-grid">${E.posts.map((ps) => {
          const done = now - ps.at >= DAY;
          return `<div class="fd-post"><canvas width="120" height="110" data-post="${ps.id}"></canvas><b>${esc(ps.name)}</b><span class="fd-like">${esc(s.likes(likesOf(ps, now)))}</span>${ps.got ? `<small>${esc(s.collected)}</small>` : done ? `<button type="button" class="gold" data-collect="${ps.id}">${esc(s.collect(payOf(ps)))}</button>` : `<small>⏳ ${esc(s.grow(Math.ceil((ps.at + DAY - now) / 60e3)))}</small>`}</div>`;
        }).join("")}</div>` : `<p class="iv-empty">${esc(s.noPosts)}</p>`);
      } else if (tab === "contest") {
        const kind = contestKind(wk), C = E.contest && E.contest.week === wk ? E.contest : null, mine = C && world.cats.find((c) => c.profile && c.profile.id === C.cat);
        const d = new Date(), daysLeft = 7 - ((d.getDay() + 6) % 7);
        const own = world.cats.filter((c) => c.profile && !c.profile.guest && !c.profile.job);
        body = `<div class="ct-head"><b>${esc(s.contests[kind])}</b><small>${esc(s.cHint[kind])}</small><small>${esc(s.ends(daysLeft))}</small></div>`;
        if (mine) body += `<p class="pg-pts">${esc(s.entered(mine.profile.name))} · ${esc(s.rank(standing(mine.profile, wk)))}</p>`;
        else if (picking) body += `<p class="mk-note">${esc(s.pick)}</p><div class="ct-pick">${own.map((c) => `<button type="button" data-enter="${c.profile.id}"><canvas width="52" height="46" data-av="${c.profile.coat}"></canvas>${esc(c.profile.name)}<small>${scoreOf(c.profile, kind, wk)}</small></button>`).join("")}</div>`;
        else body += `<button type="button" class="mk-wide" data-pick="1"${L.wallet.coins < 20 ? " disabled" : ""}>${esc(s.enter())}</button>`;
        body += `<h4 class="mk-h">${esc(s.rivals)}</h4><ol class="ct-riv">${rivals(wk, kind).map((r) => `<li><span>${esc(r.n)}</span><b>${r.sc}</b></li>`).join("")}</ol>
          <h4 class="mk-h">${esc(s.trophies)}</h4>${E.trophies.length ? `<div class="ct-tro">${E.trophies.slice(0, 24).map((tr) => `<span title="${esc(tr.cat)} · ${esc(s.contests[tr.kind])}">${s.place[tr.place - 1]}</span>`).join("")}</div>` : `<p class="iv-empty">${esc(s.noTrophy)}</p>`}`;
      } else {
        const ev = eventNow(), today = new Date().toDateString();
        if (ev) {
          const end = (() => { for (let i = 0; i < 120; i++) if (!eventNow(new Date(now + i * DAY))) return i; return 0; })();
          body = `<div class="ev-head">${ev.e}<b>${esc(s.evOn(s.evNames[ev.id]))}</b><small>${esc(s.evLeft(end))}</small></div>
            ${E.giftDay === today ? `<p class="pg-claimed">${esc(s.giftTaken)}</p>` : `<button type="button" class="mk-wide gold" data-gift="1">${esc(s.gift)}</button>`}
            <h4 class="mk-h">${esc(s.evItems)}</h4><div class="ev-items">${ev.items.map((f) => `<div><canvas width="64" height="56" data-f="${f}"></canvas><small>${esc((L.t("furn")[f] || [f])[0])} · ${DC.FURN[f].price}🪙</small></div>`).join("")}</div>`;
        } else { const n = nextEvent(); body = `<div class="ev-head">📅<b>${esc(n ? s.evNext(s.evNames[n.e.id], n.days) : "")}</b></div>`; }
      }
      const _body = root.querySelector(".mk-body"), _sc = _body && root.dataset.tab === String(tab) ? _body.scrollTop : 0; root.dataset.tab = String(tab);
      root.innerHTML = `<div class="mk-head"><b>🌱 ${esc(s.title)}</b><span class="mk-wal"><span class="coin">🪙 ${L.wallet.coins}</span><span class="star">⭐ ${L.wallet.stars}</span></span><button type="button" class="st-x" data-a="close">×</button></div>
        <div class="mk-tabs">${["garden", "feed", "contest", "event"].map((id) => `<button type="button" data-tab="${id}" class="${tab === id ? "on" : ""}"><span>${{ garden: "🌱", feed: "📸", contest: "🏆", event: eventNow() ? eventNow().e : "📅" }[id]}</span>${esc(s.tabs[id])}</button>`).join("")}</div>
        <div class="mk-body">${body}</div>`;
      if (_sc) { const nb = root.querySelector(".mk-body"); if (nb) nb.scrollTop = _sc; }
      root.querySelectorAll("canvas[data-post]").forEach((cv) => { const ps = E.posts.find((x) => x.id === cv.dataset.post); if (!ps) return; const g = cv.getContext("2d"); g.fillStyle = ["#ffe1ea", "#dff3ff", "#fff1b8", "#e4f8ee", "#f1e4ff"][hash(ps.id) % 5]; g.fillRect(0, 0, 120, 110); DC.portrait(g, ps.coat, { scale: 2, dx: 0, dy: 6, pose: ps.pose, acc: ps.acc, t: 0.4 }); });
      root.querySelectorAll("canvas[data-av]").forEach((cv) => DC.portrait(cv.getContext("2d"), cv.dataset.av, { scale: 1, dx: 2, dy: 2 }));
      root.querySelectorAll("canvas[data-f]").forEach((cv) => DC.furnitureThumb(cv.dataset.f, cv.getContext("2d")));
    }
    root.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b || b.disabled) return;
      const d = b.dataset;
      if (d.a === "close") return close();
      if (d.tab) { tab = d.tab; picking = false; }
      else if (d.plant) { const [i, k] = d.plant.split(":"); plant(+i, k); }
      else if (d.water) water(+d.water);
      else if (d.harvest) harvest(+d.harvest);
      else if (d.clear) { X().plots[+d.clear] = null; L.changed(); }
      else if (d.plot) { const p = PLOT_PRICE[X().plots.length]; if (L.wallet.coins >= p) { L.wallet.coins -= p; X().plots.push(null); L.changed(); } }
      else if (d.collect) collect(d.collect);
      else if (d.pick) picking = true;
      else if (d.enter) enter(d.enter);
      else if (d.gift) gift();
      key = ""; render(); save();
    });
    function place() {
      if (window.CatCard.beside(root)) return;
      root.style.height = ""; root.style.left = `${Math.max(8, innerWidth - root.offsetWidth - 14)}px`; root.style.top = "60px";
      root.style.right = "auto"; root.style.bottom = "auto"; root.style.setProperty("--maxh", `${innerHeight - 120}px`);
    }
    function open(which) { if (which) tab = which; key = ""; root.hidden = false; render(); place(); clearInterval(placeT); placeT = setInterval(() => { place(); render(); }, 500); o.onOpen && o.onOpen(); }
    function close() { root.hidden = true; clearInterval(placeT); picking = false; o.onClose && o.onClose(); }
    addEventListener("keydown", (e) => { if (e.key === "Escape" && !root.hidden) close(); });
    // background: the garden keeps growing, contests get judged
    setInterval(() => { growGarden(); judge(); }, 60e3); setTimeout(() => { growGarden(); judge(); }, 7000);
    const readyCount = () => { growGarden(); return X().plots.filter((p) => plotState(p) === "ready").length; };
    return { open, close, get isOpen() { return !root.hidden; }, t, readyCount, eventNow, EVENTS };
  }
  window.CatExtras = { create, eventNow, EVENTS };
})();
