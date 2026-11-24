// 🌱 The garden, the photo feed, the weekly contest and the seasonal festivals, in one panel beside the card.
// Plants grow for real hours (water them), photos collect likes for a day, contests are judged when the week ends.
(() => {
  const L = window.CatLife;
  const H = 3.6e6, DAY = 24 * H;
  const CROPS = {
    catnip: { e: "🌾", h: 1, seed: 5, xp: 3, give: { item: "catnip" } },
    mint: { e: "🌿", h: 3, seed: 10, xp: 8, give: { coins: 15 } },
    strawberry: { e: "🍓", h: 6, seed: 18, xp: 15, give: { meal: true } },
    sunflower: { e: "🌻", h: 12, seed: 30, xp: 30, give: { coins: 52, star: 0.04 } },
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
      title: "Park & Etkinlik", evTitle: "Etkinlik", tabs: { garden: "Bahçe", park: "Park", feed: "Akış", contest: "Yarışma", event: "Etkinlik" },
      parkHint: "Kedilerini 30 dakikalığına parka götür. Eşyalar evde kalır, ekranın altı parka döner; başka kediler de gelir, koklaşıp oynarlar. Dönünce 🤝 Sosyal buff'ı alırlar: genleri iki kat hızlı iyileşir, sevgi kazanırlar. Saatte bir gidilebilir; beklemek istemezsen bilet alıp hemen girebilirsin.",
      parkHint2: "Kediler geziniyor, yeni arkadaşlar ediniyor. Ne kadar kalırsanız buff o kadar uzun olur.", parkWho: "Kimler gelsin?", parkGo: (n) => `🌳 Parka git (${n} kedi · 30 dk)`, parkNow: (m) => `Parktasınız! ${m} dk kaldı`,
      parkLeave: "🏠 Eve dön", parkSkip: (c) => `🎟️ Beklemeden gir · ${c}🪙`, parkRest: (m) => `Kediler dinleniyor; ${m} dk sonra yine gidebilirsiniz`, parkBack: (m, h) => `🌳 Parktan döndünüz (${m} dk): 🤝 Sosyal buff'ı ${h} saat, sevgi arttı`,
      crops: { catnip: "Kedi otu", mint: "Nane", strawberry: "Çilek", sunflower: "Ayçiçeği" },
      give: { catnip: "1 kedi nanesi", mint: "15🪙", strawberry: "1 özel yemek", sunflower: "52🪙 (+ nadiren ⭐)" },
      plant: (n, p) => `${n} ek · ${p}🪙`, water: "💧 Sula", harvest: "🧺 Topla", dry: "Kurudu! Sula", dead: "Soldu 🥀 · Temizle", grow: (m) => `${m >= 60 ? Math.floor(m / 60) + " sa " : ""}${m % 60} dk`,
      empty: "Boş saksı", shopGarden: (can) => can ? "🪴 Marketten yeni saksı al" : "💧 Önce marketten suluk al (1🪙), 🪴 saksılar da orada", gardenHint: "Tohum ek, suluk ile sula; bitki gerçek saatlerle büyür (uygulama kapalıyken de). Su 6 saat yeter; 12 saat susuz kalırsa solar. Yeni saksıları ve suluğu marketin Oyuncak bölümünden alırsın.",
      harvested: (e, w) => `${e} Hasat: ${w}`,
      feedHint: "Bir kedine dokun, fotoğrafı paylaşılsın (kartındaki 📸 de aynı işi yapar). Fotoğraf bir gün boyunca beğeni toplar, sonra beğenileri altına çevirirsin. Kıyafetli, bakımlı, mutlu ve genleri iyi kediler daha çok beğenilir. 2 saatte bir paylaşabilirsin.", canPost: "📸 Şimdi paylaşabilirsin!", nextPost: (m) => `Sonraki paylaşım: ${m >= 60 ? Math.floor(m / 60) + " sa " : ""}${m % 60} dk sonra`, share: "📸 Kimi paylaşalım?", posts: "🖼️ Paylaşımların",
      likes: (n) => `♥ ${n}`, collect: (c) => `Beğenileri topla · ${c}🪙`, collected: "✓ toplandı", noPosts: "Henüz fotoğraf yok. Kedinin kartından 📸 Fotoğraf çek!", today: (n) => `Bugün ${n}/3 paylaşım`,
      contests: { beauty: "💅 Güzellik yarışması", tricks: "🎓 Numara yarışması", love: "💗 Sevgi yarışması" },
      cHint: { beauty: "Kıyafetler, genler, temizlik ve sevgi puan getirir.", tricks: "Bildiği numaralar puan getirir.", love: "Sevgi ve yerine getirilen istekler puan getirir." },
      enter: (n) => `Kat · 20🪙`, entered: (n) => `✓ ${n} yarışıyor`, ends: (d) => `Hafta sonunda sonuç: ${d} gün kaldı`, rank: (r) => `Şu anki tahmini sıra: ${r}.`, rivals: "Rakipler",
      trophies: "🏆 Kupaların", noTrophy: "Henüz kupa yok", pick: "Yarışacak kedini seç:", result: (n, r, w) => `🏆 Yarışma sonucu: ${n} ${r}. oldu! ${w}`,
      place: ["🥇", "🥈", "🥉"], drum: "🥁 Ve kazananlar...", miss: "Miss Kedi", mister: "Mister Kedi", trickChamp: "Numara Şampiyonu", loveChamp: "En Sevilen Kedi", ok: "Harika! 🎉",
      evOn: (e) => `${e} şu an sürüyor!`, evNames: { winter: "Kış Şenliği", spring: "Bahar Şenliği", summer: "Yaz Festivali", halloween: "Cadılar Bayramı" },
      evLeft: (d) => `Bitmesine ${d} gün`, evNext: (n, d) => `Sıradaki etkinlik: ${n}, ${d} gün sonra`, evItems: "Sadece bu dönem satılan eşyalar (Market › Eşyalar):",
      gift: "🎁 Günlük etkinlik hediyesini al", giftTaken: "✓ Bugünün hediyesi alındı", giftGot: (w) => `🎁 Etkinlik hediyesi: ${w}`,
    },
    en: {
      title: "Park & Events", evTitle: "Events", tabs: { garden: "Garden", park: "Park", feed: "Feed", contest: "Contest", event: "Event" },
      parkHint: "Take your cats to the park for 30 minutes. Your things stay home and the bottom of the screen becomes a park; other cats come too, and they sniff and play. Back home they get the 🤝 Social buff: genes improve twice as fast and they gain love. Once an hour; or buy a ticket to go in right away.",
      parkHint2: "The cats are wandering about and making friends. The longer you stay, the longer the buff.", parkWho: "Who's coming?", parkGo: (n) => `🌳 Go to the park (${n} cats · 30 min)`, parkNow: (m) => `At the park! ${m} min left`,
      parkLeave: "🏠 Go home", parkSkip: (c) => `🎟️ Go in now · ${c}🪙`, parkRest: (m) => `The cats are resting; you can go again in ${m} min`, parkBack: (m, h) => `🌳 Back from the park (${m} min): 🤝 Social buff for ${h} h, more love`,
      crops: { catnip: "Catnip", mint: "Mint", strawberry: "Strawberry", sunflower: "Sunflower" },
      give: { catnip: "1 catnip", mint: "15🪙", strawberry: "1 special meal", sunflower: "52🪙 (+ rarely ⭐)" },
      plant: (n, p) => `Plant ${n} · ${p}🪙`, water: "💧 Water", harvest: "🧺 Harvest", dry: "Dry! Water it", dead: "Wilted 🥀 · Clear", grow: (m) => `${m >= 60 ? Math.floor(m / 60) + " h " : ""}${m % 60} min`,
      empty: "Empty pot", shopGarden: (can) => can ? "🪴 Buy another pot in the market" : "💧 Get a watering can in the market first (1🪙); the 🪴 pots are there too", gardenHint: "Plant a seed and water it with the watering can; it grows in real hours (even with the app closed). Water lasts 6 hours; 12 hours dry and it wilts. New pots and the watering can are in the market's Toys section.",
      harvested: (e, w) => `${e} Harvest: ${w}`,
      feedHint: "Tap one of your cats to post its photo (📸 on its card does the same). A photo gathers likes for a day, then you turn the likes into coins. Dressed-up, clean, happy cats with good genes get more. One post every 2 hours.", canPost: "📸 You can post now!", nextPost: (m) => `Next post in ${m >= 60 ? Math.floor(m / 60) + " h " : ""}${m % 60} min`, share: "📸 Who shall we post?", posts: "🖼️ Your posts",
      likes: (n) => `♥ ${n}`, collect: (c) => `Collect likes · ${c}🪙`, collected: "✓ collected", noPosts: "No photos yet. Take one with 📸 on a cat's card!", today: (n) => `Today ${n}/3 posts`,
      contests: { beauty: "💅 Beauty contest", tricks: "🎓 Trick contest", love: "💗 Love contest" },
      cHint: { beauty: "Outfits, genes, cleanliness and love score points.", tricks: "Tricks it knows score points.", love: "Love and granted wishes score points." },
      enter: () => "Enter · 20🪙", entered: (n) => `✓ ${n} is entered`, ends: (d) => `Judged at the end of the week: ${d} days left`, rank: (r) => `Standing right now: ${r}.`, rivals: "Rivals",
      trophies: "🏆 Your trophies", noTrophy: "No trophies yet", pick: "Pick a cat to enter:", result: (n, r, w) => `🏆 Contest result: ${n} came ${r}! ${w}`,
      place: ["🥇", "🥈", "🥉"], drum: "🥁 And the winners are...", miss: "Miss Cat", mister: "Mister Cat", trickChamp: "Trick Champion", loveChamp: "Most Loved Cat", ok: "Wonderful! 🎉",
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
    let tab = "park", key = "", placeT = 0, picking = false;
    const t = () => STR[L.lang] || STR.en;
    L.extra = Object.assign({ plots: [null], posts: [], postDay: "", postN: 0, contest: null, trophies: [], giftDay: "" }, L.extra || {});
    const X = () => L.extra;

    // ---------------- garden
    const plotState = (p, now = Date.now()) => {
      if (!p) return "empty";
      if (p.dead) return "dead";
      if (p.grown >= CROPS[p.k].h * H) return "ready";
      return now - p.wateredAt > WATER_FOR ? "dry" : "growing";
    };
    function growGarden(now = Date.now()) {
      for (const p of X().plots || []) {
        if (!p || p.dead) continue;
        const last = p.lastT || p.at, wetUntil = p.wateredAt + WATER_FOR;
        const dt = Math.max(0, Math.min(now, wetUntil) - last); p.grown = Math.min(CROPS[p.k].h * H, (p.grown || 0) + dt); p.lastT = now;
        if (p.grown < CROPS[p.k].h * H && now - wetUntil > DIES_AFTER) p.dead = true;
      }
    }
    function plant(i, k) { const c = CROPS[k]; if (X().plots[i] || L.wallet.coins < c.seed) return; L.wallet.coins -= c.seed; const now = Date.now(); X().plots[i] = { k, at: now, wateredAt: now, grown: 0, lastT: now }; L.changed(); }
    function water(i) { const p = X().plots[i]; if (!p || p.dead) return; if (!L.hasToy("can")) { o.needCan && o.needCan(); return; } growGarden(); p.wateredAt = Date.now(); world.burst(innerWidth / 2, 200, "spark", "#6ad0ff", 4); L.changed(); }
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
      // no daily limit: one post every 2 hours
      const p = cat.profile, E = X(); if (Date.now() < (E.postNext || 0)) return; E.postNext = Date.now() + 2 * H;
      const acc = p.acc || {}, dressed = ["hat", "collar", "outfit"].filter((k) => acc[k]).length, C = DC.COATS[p.coat] || {};
      const target = Math.round((20 + dressed * 18 + (C.wild ? 80 : 0) + p.love / 2 + (L.clean(p) > 70 ? 20 : 0) + (L.geneScore(p) - 40) * 1.6) * (0.7 + Math.random() * 0.6));     // good genes, more likes
      const poses = ["sit", "loaf", "sleep", "stretch", "groom", "bellyUp"];
      E.posts.unshift({ id: Date.now().toString(36), name: p.name, coat: p.coat, acc: { ...acc }, pose: poses[Math.floor(Math.random() * poses.length)], genes: p.genes, at: Date.now(), target: Math.max(5, target), got: false });
      E.posts = E.posts.slice(0, 12); L.stats.photos = (L.stats.photos || 0) + 1; L.changed();
    }
    const likesOf = (ps, now = Date.now()) => Math.round(ps.target * Math.pow(Math.min(1, (now - ps.at) / DAY), 0.7));
    const payOf = (ps) => Math.min(15, Math.max(1, Math.floor(ps.target / 14)));
    function collect(id) { const ps = X().posts.find((x) => x.id === id); if (!ps || ps.got || Date.now() - ps.at < DAY) return; ps.got = true; L.earn(payOf(ps)); if (L.gainPXP) L.gainPXP(5); L.changed(); }

    // ---------------- weekly contest: enter a cat; it's judged when the week rolls over
    const contestKind = (wk) => CONTESTS[hash(wk) % CONTESTS.length];
    function scoreOf(p, kind, wk) {
      const acc = p.acc || {}, dressed = ["hat", "collar", "outfit"].filter((k) => acc[k]).length, C = DC.COATS[p.coat] || {}, luck = hash(wk + p.id) % 30;
      if (kind === "beauty") return Math.round(dressed * 30 + L.clean(p) / 2 + p.love / 4 + (C.wild ? 40 : 0) + L.geneScore(p) * 0.9 + luck);
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
      const line = s.result(cat.profile.name, r, r <= 3 ? `${s.place[r - 1]} +${reward[0]}🪙${reward[1] ? ` +${reward[1]}⭐` : ""}` : "");
      L.changed();
      // the show: a stage, a drumroll, the places revealed one by one, the winner crowned
      const kind = contestKind(C.week), field = rivals(C.week, kind).map((x) => ({ n: x.n, sc: x.sc, coat: DC.COAT_KEYS[hash(x.n) % 17] }));
      const all = [...field, { n: cat.profile.name, sc: scoreOf(cat.profile, kind, C.week), coat: cat.coat, acc: cat.profile.acc, genes: cat.profile.genes, me: true, sex: cat.profile.sex }].sort((a, b) => b.sc - a.sc);
      const go = () => ceremony(all, kind, line);
      if (L.welcomeCollect) setTimeout(go, 11000); else setTimeout(go, 600);
    }
    function ceremony(all, kind, line) {
      const s = t(), top = all.slice(0, 3), box = document.createElement("div"); box.className = "ui cer";
      const title = kind === "beauty" ? (top[0].me && top[0].sex === "m" ? s.mister : s.miss) : kind === "tricks" ? s.trickChamp : s.loveChamp;
      box.innerHTML = `<div class="cer-stage"><div class="cer-curtain l"></div><div class="cer-curtain r"></div><div class="cer-lights"><i></i><i></i><i></i></div>
        <b class="cer-title">${esc(s.contests[kind])}</b><p class="cer-drum">${esc(s.drum)}</p>
        <div class="cer-podium">${[1, 0, 2].map((i) => top[i] ? `<div class="cer-spot p${i + 1}${top[i].me ? " me" : ""}" style="--d:${[2.4, 3.8, 1.2][i]}s"><canvas width="96" height="84"></canvas><span>${s.place[i]} ${esc(top[i].n)}</span><em>${top[i].sc}</em><div class="cer-block">${i + 1}</div></div>` : "").join("")}</div>
        <div class="cer-sash" style="--d:4.6s">👑 ${esc(title)}: ${esc(top[0].n)}</div>
        <p class="cer-me" style="--d:5.4s">${esc(line)}</p><button type="button" style="--d:5.8s">${esc(s.ok)}</button></div>`;
      document.body.appendChild(box); o.onOpen && o.onOpen();
      box.querySelectorAll(".cer-spot canvas").forEach((cv, j) => { const i = [1, 0, 2].filter((x) => top[x])[j], c = top[i]; DC.portrait(cv.getContext("2d"), c.coat, { scale: 2, dx: 4, dy: 3, acc: i === 0 ? { ...(c.acc || {}), hat: "crown:lemon" } : c.acc || {}, genes: c.genes, eyes: "happy", pose: "sit", t: 1.3 }); });
      setTimeout(() => { if (box.isConnected) { world.confetti(innerWidth / 2, innerHeight * 0.3, 90); world.confetti(innerWidth * 0.3, innerHeight * 0.4, 40); world.confetti(innerWidth * 0.7, innerHeight * 0.4, 40); } }, 4000);
      box.querySelector("button").onclick = () => { box.remove(); o.onClose && o.onClose(); };
    }
    function enter(id) { if (X().contest || L.wallet.coins < 20) return; L.wallet.coins -= 20; X().contest = { week: weekKey(), cat: id }; picking = false; L.changed(); }

    // ---------------- 🌳 the cat park: take some cats out for 30 minutes; meeting other cats gives them the "social" buff
    const PARK_MIN = 30, PARK_COOL = 1 * H;
    // don't want to wait? a ticket gets you in now: half a coin a minute still to wait (5 to 30 coins)
    const skipCost = () => { const m = Math.ceil(Math.max(0, PK().next - Date.now()) / 60e3); return Math.max(5, Math.min(30, Math.ceil(m / 2))); };
    let parkSel = null;
    const PK = () => (X().park = X().park || { until: 0, ids: [], at: 0, next: 0 });
    function goPark(ids) {
      const S = PK(), now = Date.now(); if (world.park || now < S.next || !ids.length) return;
      S.at = now; S.until = now + PARK_MIN * 60e3; S.ids = ids; const where = window.CatWorld && window.CatWorld.now ? window.CatWorld.now.parkWhere() : {}; S.biome = where.biome || null; S.city = where.city ? where.city.id : null;
      world.enterPark(ids, 3 + Math.floor(Math.random() * 3), where); if (where.biome && L.giveCard) L.giveCard("w_" + where.biome); close(); L.changed(); save();
    }
    function leavePark() {
      const S = PK(), now = Date.now(); if (!S.at) return;
      const mins = Math.max(0, Math.min(PARK_MIN, (Math.min(now, S.until) - S.at) / 60e3)), s = t();
      if (world.park) world.exitPark();
      for (const id of S.ids) { const c = world.cats.find((x) => x.profile && x.profile.id === id); if (!c) continue; if (mins >= 3) { L.addBuff(c.profile, "social", Math.min(6, mins / 5)); L.addLove(c, Math.min(15, mins / 2)); } }
      if (mins >= 3) { if (L.gainPXP) L.gainPXP(Math.round(mins)); L.stats.parks = (L.stats.parks || 0) + 1; toast(s.parkBack(Math.round(mins), Math.min(6, mins / 5).toFixed(1))); }
      S.at = 0; S.until = 0; S.ids = []; S.next = now + PARK_COOL; L.changed(); save();
    }
    world.onSocial = (a, b) => { for (const c of [a, b]) if (c.profile) { L.addLove(c, 1); if (L.gainPXP) L.gainPXP(1); } L.stats.social = (L.stats.social || 0) + 1; };
    setInterval(() => { const S = PK(); if (S.at && Date.now() >= S.until) leavePark(); }, 5000);
    // closed the app mid-visit: the visit simply ends (with whatever time was spent)
    setTimeout(() => { const S = PK(); if (S.at && !world.park) leavePark(); }, 3000);

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
      const k = [L.lang, tab, picking, Math.floor(now / 30e3), L.wallet.coins, L.wallet.stars, !!world.park, E.posts.length, E.posts.map((p) => p.got).join(), JSON.stringify(E.contest), E.trophies.length, E.giftDay].join("|");
      if (k === key) return; key = k;
      let body = "";
      if (false) {
      } else if (tab === "feed") {
        const own = world.cats.filter((c) => c.profile && !c.profile.guest && !c.profile.job), wait = Math.max(0, Math.ceil(((E.postNext || 0) - now) / 60e3));
        body = `<p class="mk-note">${esc(s.feedHint)}</p><p class="pg-pts">${esc(wait ? s.nextPost(wait) : s.canPost)}</p>`
          + (!wait ? `<h4 class="mk-h">${esc(s.share)}</h4><div class="ct-pick">${own.map((c) => `<button type="button" data-share="${c.profile.id}"><canvas width="52" height="46" data-av="${c.profile.coat}" data-g="${c.profile.id}"></canvas>${esc(c.profile.name)}</button>`).join("")}</div>` : "")
          + `<h4 class="mk-h">${esc(s.posts)}</h4>` + (E.posts.length ? `<div class="fd-grid">${E.posts.map((ps) => {
          const done = now - ps.at >= DAY;
          return `<div class="fd-post"><canvas width="120" height="110" data-post="${ps.id}"></canvas><b>${esc(ps.name)}</b><span class="fd-like">${esc(s.likes(likesOf(ps, now)))}</span>${ps.got ? `<small>${esc(s.collected)}</small>` : done ? `<button type="button" class="gold" data-collect="${ps.id}">${esc(s.collect(payOf(ps)))}</button>` : `<small>⏳ ${esc(s.grow(Math.ceil((ps.at + DAY - now) / 60e3)))}</small>`}</div>`;
        }).join("")}</div>` : `<p class="iv-empty">${esc(s.noPosts)}</p>`);
      } else if (tab === "park") {
        const S = PK(), own = world.cats.filter((c) => c.profile && !c.profile.job && !c.npc);
        const wc = window.CatWorld && window.CatWorld.now ? window.CatWorld.now.parkWhere() : null, B = wc && window.CatWorldArt.BIOMES[wc.biome];
        const where = wc ? `<div class="ev-where"><i style="background:linear-gradient(180deg,${wc.city.flag.map((c, i, a) => `${c} ${(i / a.length) * 100}% ${((i + 1) / a.length) * 100}%`).join(",")})"></i><b>📍 ${esc(wc.city.name[L.lang])}</b><small>${esc(B ? B[L.lang] : "")}</small><button type="button" data-world="1">🌍</button></div>` : "";
        if (world.park && world.park.biome === "plane") body = `<div class="ev-head">✈️<b>${esc(L.lang === "tr" ? "Kediler uçakta! İnince parka gidebiliriz." : "The cats are on the plane! We can go to the park after landing.")}</b></div>`;
        else if (world.park) body = where + `<div class="ev-head">🌳<b>${esc(s.parkNow(Math.max(1, Math.ceil((S.until - now) / 60e3))))}</b><small>${esc(s.parkHint2)}</small></div><button type="button" class="mk-wide gold" data-leave="1">${esc(s.parkLeave)}</button>`;
        else if (now < S.next) body = where + `<div class="ev-head">🌳<b>${esc(s.parkRest(Math.ceil((S.next - now) / 60e3)))}</b></div>
          <button type="button" class="mk-wide gold" data-skippark="1"${L.wallet.coins < skipCost() ? " disabled" : ""}>${esc(s.parkSkip(skipCost()))}</button><p class="mk-note">${esc(s.parkHint)}</p>`;
        else {
          if (!parkSel) parkSel = new Set(own.map((c) => c.profile.id));
          body = where + `<p class="mk-note">${esc(s.parkHint)}</p><h4 class="mk-h">${esc(s.parkWho)}</h4><div class="ct-pick">${own.map((c) => `<button type="button" class="${parkSel.has(c.profile.id) ? "on" : ""}" data-ptog="${c.profile.id}"><canvas width="52" height="46" data-av="${c.profile.coat}" data-g="${c.profile.id}"></canvas>${esc(c.profile.name)}${parkSel.has(c.profile.id) ? " ✓" : ""}</button>`).join("")}</div>
            <button type="button" class="mk-wide gold" data-gopark="1"${parkSel.size ? "" : " disabled"}>${esc(s.parkGo(parkSel.size))}</button>`;
        }
      } else if (tab === "contest") {
        const kind = contestKind(wk), C = E.contest && E.contest.week === wk ? E.contest : null, mine = C && world.cats.find((c) => c.profile && c.profile.id === C.cat);
        const d = new Date(), daysLeft = 7 - ((d.getDay() + 6) % 7);
        const own = world.cats.filter((c) => c.profile && !c.profile.guest && !c.profile.job);
        body = `<div class="ct-head"><b>${esc(s.contests[kind])}</b><small>${esc(s.cHint[kind])}</small><small>${esc(s.ends(daysLeft))}</small></div>`;
        if (mine) body += `<p class="pg-pts">${esc(s.entered(mine.profile.name))} · ${esc(s.rank(standing(mine.profile, wk)))}</p>`;
        else if (picking) body += `<p class="mk-note">${esc(s.pick)}</p><div class="ct-pick">${own.map((c) => `<button type="button" data-enter="${c.profile.id}"><canvas width="52" height="46" data-av="${c.profile.coat}" data-g="${c.profile.id}"></canvas>${esc(c.profile.name)}<small>${scoreOf(c.profile, kind, wk)}</small></button>`).join("")}</div>`;
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
      root.innerHTML = `<div class="mk-head"><b>${tab === "park" ? "🌳 " + esc(s.tabs.park) : "🎪 " + esc(s.evTitle)}</b><span class="mk-wal"><span class="coin">🪙 ${L.wallet.coins}</span><span class="star">⭐ ${L.wallet.stars}</span></span><button type="button" class="st-x" data-a="close">×</button></div>
        ${tab === "park" ? "" : `<div class="mk-tabs">${["feed", "contest", "event"].map((id) => `<button type="button" data-tab="${id}" class="${tab === id ? "on" : ""}"><span>${{ garden: "🌱", park: "🌳", feed: "📸", contest: "🏆", event: eventNow() ? eventNow().e : "📅" }[id]}</span>${esc(s.tabs[id])}</button>`).join("")}</div>`}
        <div class="mk-body">${body}</div>`;
      if (_sc) { const nb = root.querySelector(".mk-body"); if (nb) nb.scrollTop = _sc; }
      root.querySelectorAll("canvas[data-post]").forEach((cv) => { const ps = E.posts.find((x) => x.id === cv.dataset.post); if (!ps) return; const g = cv.getContext("2d"); g.fillStyle = ["#ffe1ea", "#dff3ff", "#fff1b8", "#e4f8ee", "#f1e4ff"][hash(ps.id) % 5]; g.fillRect(0, 0, 120, 110); DC.portrait(g, ps.coat, { scale: 2, dx: 0, dy: 6, pose: ps.pose, acc: ps.acc, genes: ps.genes, t: 0.4 }); });
      root.querySelectorAll("canvas[data-av]").forEach((cv) => { const c = cv.dataset.g && world.cats.find((x) => x.profile && x.profile.id === cv.dataset.g); DC.portrait(cv.getContext("2d"), cv.dataset.av, { scale: 1, dx: 2, dy: 2, genes: c && c.profile.genes, acc: c && c.wearing() }); });
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
      else if (d.shop) { close(); o.openShop && o.openShop(); return; }
      else if (d.plot) { const p = PLOT_PRICE[X().plots.length]; if (L.wallet.coins >= p) { L.wallet.coins -= p; X().plots.push(null); L.changed(); } }
      else if (d.collect) collect(d.collect);
      else if (d.pick) picking = true;
      else if (d.enter) enter(d.enter);
      else if (d.gift) gift();
      else if (d.ptog) { if (!parkSel) parkSel = new Set(); parkSel.has(d.ptog) ? parkSel.delete(d.ptog) : parkSel.add(d.ptog); }
      else if (d.skippark) { const c = skipCost(); if (L.wallet.coins >= c) { L.wallet.coins -= c; PK().next = 0; L.changed(); save(); } key = ""; return render(); }
      else if (d.world) { if (window.CatHub.now) window.CatHub.now.open("world"); return; }
      else if (d.gopark) { goPark([...(parkSel || [])]); parkSel = null; return; }
      else if (d.leave) leavePark();
      else if (d.share) { const c = world.cats.find((x) => x.profile && x.profile.id === d.share); if (c) { L.care(c, "photo"); L.remember(c.profile, "photo"); world.burst(c.x, c.y - 40 * c.s, "spark", "#fff", 6); } }
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
    const readyCount = () => (window.CatGarden && window.CatGarden.now ? window.CatGarden.now.readyCount() : 0);
    return { ceremony, open, close, get isOpen() { return !root.hidden; }, get tab() { return tab; }, t, readyCount, eventNow, EVENTS, judge, contestKind, scoreOf, standing, goPark, leavePark };
  }
  window.CatExtras = { create, eventNow, EVENTS };
})();
