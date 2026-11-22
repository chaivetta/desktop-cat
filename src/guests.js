// 🧳 Guest cats: now and then a neighbour asks you to look after their cat for a day.
// Look after it well (fed, loved, clean, healthy) and they pay you; a nicer home pays more, and a good name brings better offers.
// If the guest gets ill, or is left alone and unloved, they take it back and pay nothing.
(() => {
  const STAY = 24 * 3.6e6, OFFER_LIFE = 15 * 60e3, COOL = 6 * 3.6e6;
  const OWNERS = {
    tr: ["Ayşe teyze", "Mehmet abi", "Zeynep", "Can", "Elif", "Burak", "Selin", "Emre", "Deniz", "Hatice teyze", "Kerem", "Ece"],
    en: ["Mrs. Rose", "Tom", "Lily", "Sam", "Nora", "Ben", "Ivy", "Jack", "Mia", "Mr. Park", "Leo", "Ava"],
  };
  const WHY = {
    tr: ["tatile gidiyor", "şehir dışına çıkıyor", "evini boyatıyor", "düğüne gidiyor", "iş seyahatinde", "taşınıyor"],
    en: ["is going on holiday", "is out of town", "is having the flat painted", "is off to a wedding", "is on a work trip", "is moving house"],
  };
  const STR = {
    tr: {
      ask: (o, why, n, pay) => `🧳 ${o} ${why}. Kedisi ${n} bir gün sende kalabilir mi? Yaklaşık ${pay}🪙`,
      yes: "Kabul et", no: "Hayır", full: "Evin dolu, misafire yer yok",
      paid: (o, n, c, st) => `💌 ${o} geldi, ${n} evine döndü: ${"⭐".repeat(st)} +${c}🪙. Teşekkürler!`,
      angry: (o, n, why) => `😾 ${o} kedisi ${n} için para vermedi: ${why}`,
      whySick: "kedi hastalanmış", whyLove: "kedi çok ilgisiz kalmış", whyHungry: "kedi uzun süre aç kalmış",
      early: (o, n) => `😿 ${o} erken geldi: ${n} çok mutsuzdu. Para yok.`,
      tag: (o, h) => `🧳 Misafir · sahibi ${o} · ${h} sa kaldı`,
    },
    en: {
      ask: (o, why, n, pay) => `🧳 ${o} ${why}: could you look after ${n} for a day? About ${pay}🪙`,
      yes: "Accept", no: "No", full: "Your home is full, no room for a guest",
      paid: (o, n, c, st) => `💌 ${o} picked up ${n}: ${"⭐".repeat(st)} +${c}🪙. Thank you!`,
      angry: (o, n, why) => `😾 ${o} took ${n} back and didn't pay: ${why}`,
      whySick: "the cat got ill", whyLove: "the cat was left alone too much", whyHungry: "the cat went hungry for too long",
      early: (o, n) => `😿 ${o} came early: ${n} was too unhappy. No pay.`,
      tag: (o, h) => `🧳 Guest · owner ${o} · ${h} h left`,
    },
  };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  function create(o) {
    const { world, save } = o, L = window.CatLife, DC = window.DesktopCat;
    const t = () => STR[L.lang] || STR.en;
    L.guests = Object.assign({ rep: 0, at: 0, done: 0, offer: null }, L.guests || {});
    const box = document.createElement("div"); box.className = "ui gs-box"; box.hidden = true; document.body.appendChild(box);
    let msgT = 0;

    // what your home is worth to a guest: things they can use, kept in good shape
    function homeBonus() {
      const items = world.furniture.filter((f) => f.usable && f.f.role !== "decor");
      const kinds = new Set(items.map((f) => f.kind)).size;
      const cond = items.length ? items.reduce((a, f) => a + f.cond, 0) / items.length / 100 : 0;
      return Math.min(40, Math.round(kinds * 3 * cond));
    }
    const repK = () => 1 + Math.max(-0.5, Math.min(10, L.guests.rep)) * 0.06;
    const guestCats = () => world.cats.filter((c) => c.profile && c.profile.guest);
    const show = (html, ms) => { box.innerHTML = html; box.hidden = false; place(); clearTimeout(msgT); if (ms) msgT = setTimeout(() => { box.hidden = true; }, ms); };
    function place() { box.style.bottom = `${Math.max(12, innerHeight - world.floor + 70)}px`; }

    function makeOffer() {
      const lang = L.lang, coat = pick(DC.COAT_KEYS), name = L.randomName(world.cats.map((c) => c.profile && c.profile.name));
      const base = 25 + Math.floor(Math.random() * 16);
      L.guests.offer = { coat, name, owner: Math.floor(Math.random() * 12), why: Math.floor(Math.random() * 6), base, until: Date.now() + OFFER_LIFE, sex: Math.random() < 0.5 ? "f" : "m" };
      L.guests.at = Date.now(); save(); showOffer(); world.meow && world.meow(world.cats.find((c) => c.profile));
      void lang;
    }
    function showOffer() {
      const of = L.guests.offer; if (!of) return;
      const s = t(), est = Math.round((of.base + homeBonus()) * repK());
      show(`<canvas width="44" height="44"></canvas><p>${s.ask(OWNERS[L.lang][of.owner] || OWNERS.en[of.owner], WHY[L.lang][of.why], of.name, est)}</p>
        <div><button type="button" class="gold" data-g="yes">${s.yes}</button><button type="button" data-g="no">${s.no}</button></div>`);
      DC.portrait(box.querySelector("canvas").getContext("2d"), of.coat, { scale: 1, dx: 2, dy: 1 });
    }
    function accept() {
      const of = L.guests.offer; L.guests.offer = null; box.hidden = true; if (!of) return;
      if (world.cats.filter((c) => c.profile).length >= (L.MAX_CATS || 8)) return show(`<p>${t().full}</p>`, 4000);
      const p = L.make(of.coat, { name: of.name, g0: 0.7 + Math.random() * 0.3, love: 50, quiet: true, sex: of.sex });
      p.born = Date.now() - (60 + Math.random() * 400) * 864e5; p.stageId = L.stage(p).id;
      p.guest = { owner: of.owner, base: of.base, until: Date.now() + STAY, hungry: 0, sick: 0 };
      const c = world.addCat(null, p); world.confetti(c.x, world.floor - 30, 14); save();
    }
    // the owner comes back: pay depends on how the stay went, how nice your home is and your name as a cat-sitter
    function settle(c, early) {
      const p = c.profile, g = p.guest, s = t(), owner = OWNERS[L.lang][g.owner] || OWNERS.en[g.owner];
      g.done = true; L.guests.done++;
      let why = g.sick || p.sick ? s.whySick : p.love < 20 ? s.whyLove : g.hungry > 5 * 3600 ? s.whyHungry : "";
      if (early) { L.guests.rep -= 2; show(`<p>${s.early(owner, p.name)}</p>`, 9000); }
      else if (why) { L.guests.rep -= 2; show(`<p>${s.angry(owner, p.name, why)}</p>`, 9000); }
      else {
        const care = Math.max(0.3, p.love / 100) * (L.clean(p) < 25 ? 0.7 : 1) * (g.hungry > 2 * 3600 ? 0.75 : 1);
        const coins = Math.max(1, Math.round((g.base + homeBonus()) * care * repK()));
        const stars = care > 0.85 ? 3 : care > 0.55 ? 2 : 1; L.guests.rep += stars === 3 ? 1 : stars === 2 ? 0.3 : -0.5;
        L.earn(coins); if (stars === 3 && Math.random() < 0.15) { L.wallet.stars++; }
        world.confetti(c.x, world.floor - 30, stars * 12);
        show(`<p>${s.paid(owner, p.name, coins, stars)}</p>`, 9000);
      }
      L.guests.rep = Math.max(-5, Math.min(10, L.guests.rep));
      if (world.catLeaves) world.catLeaves(c); else world.removeCat(c);
      L.changed(); save();
    }
    function check() {
      const now = Date.now(), G = L.guests;
      for (const c of guestCats()) {
        const p = c.profile, g = p.guest; if (g.done) continue;
        if (L.isHungry(p)) g.hungry += 10;
        if (p.sick) g.sick = 1;
        if (now > g.until) settle(c, false);
        else if (p.love < 8) settle(c, true);
      }
      if (G.offer && now > G.offer.until) { G.offer = null; box.hidden = true; save(); }
      if (!G.offer && !guestCats().length && world.cats.some((c) => c.profile) && now - G.at > COOL && Math.random() < 10 / 1800) makeOffer();
    }
    box.addEventListener("click", (e) => {
      const b = e.target.closest("[data-g]"); if (!b) { if (!L.guests.offer) box.hidden = true; return; }
      if (b.dataset.g === "yes") accept(); else { L.guests.offer = null; box.hidden = true; save(); }
    });
    setInterval(check, 10e3); setTimeout(() => { check(); if (L.guests.offer) showOffer(); }, 6000);
    addEventListener("resize", place);
    return { offer: makeOffer, check, settle, tag: (p) => { if (!p.guest) return ""; const h = Math.max(0, Math.ceil((p.guest.until - Date.now()) / 3.6e6)); return t().tag(OWNERS[L.lang][p.guest.owner] || "?", h); }, homeBonus };
  }
  window.CatGuests = { create };
})();
