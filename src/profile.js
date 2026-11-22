/* Desktop Cat — each cat's life: a name, a personality, growing up, love, and a little diary.
 * Everything here is plain data so it can be saved between runs. The cats call
 * CatLife.care(cat, kind) whenever something nice happens to them. */
(() => {
  "use strict";

  const NAMES = {
    tr: ["Pamuk", "Boncuk", "Tarçın", "Fındık", "Zeytin", "Lokum", "Duman", "Minnoş", "Sütlaç", "Karamel", "Mırmır", "Paşa",
         "Badem", "Kestane", "Bal", "Şeker", "Limon", "Köpük", "Pofuduk", "Cimcime", "Fıstık", "Kurabiye", "Ponçik", "Leblebi",
         "Muhallebi", "Tombik", "Bıdık", "Gece", "Kahve", "Mantı"],
    en: ["Biscuit", "Mochi", "Pumpkin", "Pickle", "Noodle", "Toffee", "Waffles", "Pepper", "Olive", "Muffin", "Peanut", "Clover",
         "Ziggy", "Luna", "Miso", "Nugget", "Sprout", "Tofu", "Bean", "Pixel", "Crumpet", "Marble", "Pudding", "Sushi"],
  };

  // personality traits nudge what a cat likes to do (multipliers on its choices)
  const TRAITS = {
    playful: { e: "🧶", tr: "Oyuncu", en: "Playful", mods: { yarn: 1.5, dangle: 1.5, mouse: 1.4, butterfly: 1.4, zoom: 2, fight: 1.4 } },
    sleepy:  { e: "💤", tr: "Uykucu", en: "Sleepy", mods: { sleep: 2.2, zoom: 0.6 } },
    cuddly:  { e: "💗", tr: "Sevgi pıtırcığı", en: "Cuddly", mods: { sleep: 1.2 }, love: 1.5 },
    curious: { e: "🔍", tr: "Meraklı", en: "Curious", mods: { walk: 1.6, box: 2 } },
    foodie:  { e: "🍗", tr: "Obur", en: "Foodie", mods: { bowl: 1.5, _eat: 1.6 } },
    tidy:    { e: "🫧", tr: "Titiz", en: "Tidy", mods: { groom: 2.2 } },
    rascal:  { e: "😼", tr: "Haylaz", en: "Rascal", mods: { fight: 2.5, zoom: 1.4, post: 1.6 } },
    hunter:  { e: "🐾", tr: "Avcı", en: "Hunter", mods: { mouse: 2, butterfly: 2, yarn: 1.3 } },
    lazy:    { e: "🛋️", tr: "Tembel", en: "Lazy", mods: { walk: 0.5, sit: 1.6, roll: 1.4, zoom: 0.5 } },
  };
  const CLASH = [["sleepy", "playful"], ["lazy", "playful"], ["lazy", "curious"], ["lazy", "rascal"], ["sleepy", "rascal"]];

  const TOYS = {
    yarn: { e: "🧶", tr: "Yumak", en: "Yarn", goals: ["yarn", "dangle"] },
    mouse: { e: "🐭", tr: "Kurmalı fare", en: "Wind-up mouse", goals: ["mouse"] },
    feather: { e: "🪶", tr: "Tüylü olta", en: "Feather wand", goals: [] },
    butterfly: { e: "🦋", tr: "Kelebek", en: "Butterfly", goals: ["butterfly"] },
    laser: { e: "🔴", tr: "Lazer", en: "Laser", goals: [] },
    box: { e: "📦", tr: "Karton kutu", en: "Box", goals: ["box"] },
    catnip: { e: "🌿", tr: "Kedi otu", en: "Catnip", goals: ["catnip"] },
    post: { e: "🪵", tr: "Tırmalama direği", en: "Scratching post", goals: ["post"] },
  };

  const STAGES = [
    { id: "kitten", min: 0, e: "🍼", tr: "Yavru", en: "Kitten" },
    { id: "young", min: 120, e: "🐱", tr: "Genç", en: "Young cat" },
    { id: "adult", min: 360, e: "👑", tr: "Yetişkin", en: "Grown-up" },
  ];
  const ADULT = 360;

  const COAT_NAMES = {
    ginger: { tr: "Sarman", en: "Ginger tabby" }, black: { tr: "Kara kedi", en: "Black" }, white: { tr: "Bembeyaz", en: "White" },
    grey: { tr: "Gri tekir", en: "Grey tabby" }, calico: { tr: "Üç renkli", en: "Calico" }, siamese: { tr: "Siyam", en: "Siamese" },
    tuxedo: { tr: "Smokin", en: "Tuxedo" },
  };

  // what happens when: xp and love rewards, how often they can be earned, how often they get written in the diary
  const RULES = {
    pet:     { xp: 3, love: 7, every: 4e3, log: 3 * 60e3 },
    fed:     { xp: 10, love: 10, every: 20e3, log: 30 * 60e3 },
    play:    { xp: 4, love: 2.5, every: 8e3, log: 5 * 60e3 },
    bed:     { xp: 6, love: 3, every: 60e3, log: 20 * 60e3 },
    scratch: { xp: 3, love: 1, every: 10e3, log: 10 * 60e3 },
    catnip:  { xp: 5, love: 6, every: 20e3, log: 10 * 60e3 },
    zoom:    { xp: 1, love: 0, every: 30e3, log: 15 * 60e3 },
    race:    { xp: 2, love: 0, every: 30e3, log: 10 * 60e3 },
    fight:   { xp: 2, love: 0, every: 30e3, log: 10 * 60e3 },
    boop:    { xp: 2, love: 1, every: 30e3, log: 10 * 60e3 },
    box:     { xp: 2, love: 1, every: 30e3, log: 15 * 60e3 },
    held:    { xp: 0, love: 0, every: 30e3, log: 10 * 60e3 },
    dress:   { xp: 1, love: 1, every: 10e3, log: 2 * 60e3 },
    photo:   { xp: 1, love: 2, every: 5e3, log: 60e3 },
    shelf:   { xp: 2, love: 1, every: 30e3, log: 10 * 60e3 },
  };

  const STR = {
    tr: {
      love: "Sevgi", growth: "Büyüme", traits: "Karakteri", fav: "En sevdiği", diary: "Günlük", showName: "İsmini başının üstünde göster",
      pet: "Sev", feed: "Mama ver", play: "Oyna", rename: "İsmini değiştir", dice: "Rastgele isim", ok: "Kaydet", close: "Kapat",
      adopt: "Yeni yavru", newKitten: "Yeni bir yavru geldi! Adını koyalım mı?", empty: "Henüz bir şey yazmadı…",
      grownUp: "Tamamen büyüdü", toNext: (n) => `${n} puan sonra büyüyecek`,
      wardrobe: "Dolap", hat: "Şapka", collar: "Tasma & papyon", outfit: "Kıyafet", none: "Hiçbiri", surprise: "Rastgele kombin", undress: "Hepsini çıkar",
      nothingOn: "Üstünde bir şey yok", photo: "Fotoğraf", remove: "Kediyi kaldır", removeQ: (n) => `${n} gitsin mi? Bu geri alınamaz.`, yes: "Evet, kaldır", no: "Vazgeç",
      size: "Kart boyutu", birthdayToday: "Bugün doğum günü!", photoOf: (n, d, st) => `${n} · ${d} · ${st}`,
      age1: (d) => d < 30 ? "1 haftalık" : d < 365 ? `${Math.round(d / 30)} aylık` : `${Math.round(d / 365)} yaşında`,
      age: (d) => d < 1 ? "yeni geldi" : `${d} günlük`, born: (d) => `Doğum günü: ${d}`,
      mood: (l) => l >= 85 ? "Sana bayılıyor" : l >= 60 ? "Çok mutlu" : l >= 35 ? "Keyfi yerinde" : l >= 15 ? "Biraz ilgi bekliyor" : "Seni çok özledi",
      ago: (ms) => { const m = Math.floor(ms / 60e3); return m < 1 ? "az önce" : m < 60 ? `${m} dk önce` : m < 1440 ? `${Math.floor(m / 60)} sa önce` : `${Math.floor(m / 1440)} gün önce`; },
      log: {
        born: (a) => `${a.n} aramıza katıldı`, named: (a) => `Adı artık ${a.n}`, fed: () => "Mamasını afiyetle yedi",
        pet: () => "Sevildi, mır mır mırladı", play: (a) => `${a.toy} ile oynadı`, bed: () => "Yatağında kıvrılıp uyudu",
        scratch: () => "Direkte tırnaklarını biledi", catnip: () => "Kedi otuyla kendinden geçti", zoom: () => "Zoomies! Odayı baştan başa koştu",
        race: (a) => `${a.o} ile yarıştı`, fight: (a) => `${a.o} ile şakadan dövüştü`, boop: (a) => `${a.o} ile burun buruna geldi`,
        box: () => "Kutuya saklandı", held: () => "Kucağa alındı", grew: (a) => `Büyüdü, artık ${a.stage}!`, lovemax: () => "Sevgi barı doldu! Sana bayılıyor",
        hello: () => "Seninle masaüstünde yaşamaya başladı",
        dress: (a) => `${a.itemName} ${a.kind === "outfit" ? "giydi" : "taktı"}`, photo: () => "Fotoğrafı çekildi", shelf: () => "Rafa zıplayıp oturdu",
        birthday: (a) => `${STR.tr.age1(a.days)} oldu! İyi ki doğdun`,
      },
    },
    en: {
      love: "Love", growth: "Growing up", traits: "Personality", fav: "Favourite", diary: "Diary", showName: "Show name above head",
      pet: "Pet", feed: "Feed", play: "Play", rename: "Rename", dice: "Random name", ok: "Save", close: "Close",
      adopt: "New kitten", newKitten: "A new kitten arrived! Want to name it?", empty: "Nothing written yet…",
      grownUp: "All grown up", toNext: (n) => `${n} more points to grow`,
      wardrobe: "Wardrobe", hat: "Hats", collar: "Collars & bows", outfit: "Outfits", none: "None", surprise: "Surprise outfit", undress: "Take it all off",
      nothingOn: "Wearing nothing", photo: "Photo", remove: "Remove cat", removeQ: (n) => `Say goodbye to ${n}? This can't be undone.`, yes: "Yes, remove", no: "Keep",
      size: "Card size", birthdayToday: "Birthday today!", photoOf: (n, d, st) => `${n} · ${d} · ${st}`,
      age1: (d) => d < 30 ? "1 week old" : d < 365 ? `${Math.round(d / 30)} months old` : `${Math.round(d / 365)} year${d >= 730 ? "s" : ""} old`,
      age: (d) => d < 1 ? "just arrived" : `${d} day${d > 1 ? "s" : ""} old`, born: (d) => `Birthday: ${d}`,
      mood: (l) => l >= 85 ? "Adores you" : l >= 60 ? "Very happy" : l >= 35 ? "Content" : l >= 15 ? "Wants some attention" : "Misses you a lot",
      ago: (ms) => { const m = Math.floor(ms / 60e3); return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.floor(m / 60)} h ago` : `${Math.floor(m / 1440)} d ago`; },
      log: {
        born: (a) => `${a.n} joined the family`, named: (a) => `Now called ${a.n}`, fed: () => "Had a lovely dinner",
        pet: () => "Got pets and purred", play: (a) => `Played with the ${a.toy.toLowerCase()}`, bed: () => "Curled up in the bed for a nap",
        scratch: () => "Sharpened claws on the post", catnip: () => "Went wild for catnip", zoom: () => "Zoomies! Sprinted across the room",
        race: (a) => `Raced ${a.o}`, fight: (a) => `Play-fought with ${a.o}`, boop: (a) => `Booped noses with ${a.o}`,
        box: () => "Hid in a box", held: () => "Got picked up", grew: (a) => `Grew up — now a ${a.stage.toLowerCase()}!`, lovemax: () => "Love bar full! Adores you",
        hello: () => "Moved in on your desktop",
        dress: (a) => `Put on the ${a.itemName}`, photo: () => "Had a photo taken", shelf: () => "Jumped up onto the shelf",
        birthday: (a) => `${STR.en.age1(a.days)} today! Happy birthday`,
      },
    },
  };
  const LOG_ICON = { born: "🐣", named: "🏷️", fed: "🍗", pet: "💗", play: "🧶", bed: "🛏️", scratch: "🪵", catnip: "🌿", zoom: "💨",
    race: "🏁", fight: "🥊", boop: "👃", box: "📦", held: "🤲", grew: "🌟", lovemax: "💖", hello: "🏠", dress: "👗", photo: "📸", shelf: "🪜", birthday: "🎂" };

  const pickOne = (a) => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const L = {
    lang: (navigator.language || "en").toLowerCase().startsWith("tr") ? "tr" : "en",
    NAMES, TRAITS, TOYS, STAGES, ADULT, STR, LOG_ICON, COAT_NAMES,
    onChange: null,                     // set by the page: called when anything worth saving happens
    t(k) { return STR[L.lang][k]; },
    randomName(taken = []) {
      const pool = NAMES[L.lang].filter((n) => !taken.includes(n));
      return pickOne(pool.length ? pool : NAMES[L.lang]);
    },
    randomTraits() {
      const keys = Object.keys(TRAITS);
      for (;;) {
        const a = pickOne(keys), b = pickOne(keys);
        if (a !== b && !CLASH.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) return [a, b];
      }
    },
    make(coat, o = {}) {
      const now = Date.now();
      const p = {
        id: Math.random().toString(36).slice(2, 10), coat, name: o.name || L.randomName(o.taken), traits: L.randomTraits(),
        fav: pickOne(Object.keys(TOYS)), born: now, xp: o.xp ?? 0, love: o.love ?? 40, showName: true, log: [], lastR: {}, lastL: {}, seen: now,
      };
      L.write(p, o.migrated ? "hello" : "born", { n: p.name });
      return p;
    },
    // bring an old save (just a list of coats) into the new world, as grown-up cats who already live here
    migrate(coats) { const taken = []; return coats.map((c) => { const p = L.make(c, { xp: ADULT, love: 60, migrated: true, taken }); taken.push(p.name); return p; }); },
    // time passes while the app is closed: love fades a little, never all the way
    welcomeBack(p) {
      const hours = Math.max(0, (Date.now() - (p.seen || Date.now())) / 3.6e6);
      p.love = Math.max(5, p.love - Math.min(40, hours * 2)); p.seen = Date.now();
      p.lastR = p.lastR || {}; p.lastL = p.lastL || {}; p.log = p.log || [];
      if (!TRAITS[p.traits?.[0]] || !TRAITS[p.traits?.[1]]) p.traits = L.randomTraits();
      if (!TOYS[p.fav]) p.fav = pickOne(Object.keys(TOYS));
      return p;
    },
    stage(xp) { let s = STAGES[0]; for (const st of STAGES) if (xp >= st.min) s = st; return s; },
    nextStage(xp) { return STAGES.find((st) => st.min > xp) || null; },
    size(xp) { return 0.58 + 0.42 * Math.min(1, xp / ADULT); },
    mods(p) {
      const m = {};
      for (const t of p.traits) for (const [k, v] of Object.entries(TRAITS[t].mods)) m[k] = (m[k] || 1) * v;
      for (const g of TOYS[p.fav].goals) m[g] = (m[g] || 1) * 1.6;
      return m;
    },
    write(p, k, a = {}) {
      p.log.unshift({ t: Date.now(), k, a });
      if (p.log.length > 80) p.log.length = 80;
    },
    text(entry) {
      const f = STR[L.lang].log[entry.k]; if (!f) return "";
      const a = { ...entry.a };
      if (a.toyKey && TOYS[a.toyKey]) a.toy = TOYS[a.toyKey][L.lang];
      if (a.stageKey) { const st = STAGES.find((s) => s.id === a.stageKey); if (st) a.stage = st[L.lang]; }
      if (a.item) a.itemName = L.itemName(a.kind, a.item);
      return f(a);
    },
    icon(entry) { return entry.k === "play" && TOYS[entry.a?.toyKey] ? TOYS[entry.a.toyKey].e : LOG_ICON[entry.k] || "🐾"; },
    // "Cherry top hat" / "Kiraz silindir şapka"
    itemName(kind, id) {
      const W = window.DesktopCat && window.DesktopCat.WARDROBE; if (!W || !id) return "";
      const [d, sc] = String(id).split(":"), des = W[kind] && W[kind][d], sch = W.schemes[sc];
      if (!des || !sch) return "";
      return L.lang === "tr" ? `${sch.tr} ${des.tr}` : `${sch.en} ${des.en.charAt(0).toLowerCase() + des.en.slice(1)}`.replace(/^./, (c) => c.toUpperCase());
    },
    // birthdays: one week, then 1, 2, 3 and 6 months, then every year
    milestones(age) { const m = [7, 30, 60, 90, 180]; for (let y = 365; y <= age + 365; y += 365) m.push(y); return m.filter((d) => d <= age); },
    birthdayDue(p) {
      const age = (Date.now() - p.born) / 864e5, done = L.milestones(age);
      if (done.length > (p.bdays || 0)) { p.bdays = done.length; p.lastBday = Date.now(); const days = done[done.length - 1]; L.write(p, "birthday", { days }); L.changed(); return days; }
      return 0;
    },
    isBirthday(p) { return p.lastBday && Date.now() - p.lastBday < 864e5; },
    rename(cat, name) {
      const p = cat.profile; name = String(name || "").trim().slice(0, 14); if (!name || name === p.name) return;
      p.name = name; L.write(p, "named", { n: name }); L.changed();
    },
    changed() { if (L.onChange) L.onChange(); },

    // ------------------------------------------------ the cats report in here
    care(cat, kind, arg = {}) {
      const p = cat.profile, r = RULES[kind]; if (!p || !r) return;
      const now = Date.now(), key = kind + (arg.toyKey ? ":" + arg.toyKey : "");
      if (now - (p.lastR[key] || 0) > r.every) {
        p.lastR[key] = now;
        let love = r.love;
        for (const t of p.traits) love *= TRAITS[t].love || 1;
        if (arg.toyKey && arg.toyKey === p.fav) love *= 1.6;
        L.addXP(cat, r.xp); L.addLove(cat, love);
      }
      if (now - (p.lastL[key] || 0) > r.log) { p.lastL[key] = now; L.write(p, kind, arg); L.changed(); }
    },
    addXP(cat, n) {
      const p = cat.profile, before = L.stage(p.xp).id;
      p.xp = Math.max(0, p.xp + n); cat.size = L.size(p.xp);
      const after = L.stage(p.xp);
      if (after.id !== before) {
        L.write(p, "grew", { stageKey: after.id }); L.changed();
        const w = cat.world, s = cat.s;
        w.burst(cat.x, cat.y - 34 * s, "spark", "#ffd34d", 5); w.burst(cat.x, cat.y - 30 * s, "heart", "#e2557a", 3);
        if (!["held", "fall", "leap", "inbox"].includes(cat.state) && !cat.bed) cat.set("happy", 2.6, { eyes: null });
      }
    },
    addLove(cat, n) {
      const p = cat.profile, before = p.love;
      p.love = clamp(p.love + n, 0, 100);
      if (before < 100 && p.love >= 100 && now() - (p.lastL.lovemax || 0) > 6 * 3.6e6) { p.lastL.lovemax = now(); L.write(p, "lovemax"); L.changed(); }
    },
    // a little every frame: growing up slowly just by being around, love fading very slowly
    tick(cat, dt) {
      const p = cat.profile; if (!p) return;
      p.seen = Date.now();
      L.addXP(cat, dt / 120);
      p.love = Math.max(0, p.love - dt * (3 / 3600));
    },
  };
  const now = () => Date.now();

  window.CatLife = L;
})();
