// 🧳 Guest cats: like a little cat hotel, a request every 1–2 hours (at most 7 a day); most stay an hour or two, a few up to a day a neighbour asks you to look after their cat, for a day up to a week.
// Look after it well (fed, loved, clean, healthy) and they pay you; a nicer home pays more, and a good name brings better offers.
// If the guest gets ill, or is left alone and unloved, they take it back and pay nothing.
(() => {
  const OFFER_LIFE = 15 * 60e3;
  const GAP = [1, 2], PER_DAY = 7;                      // like a little hotel: a new request every 1–2 hours, at most 7 a day
  // how long a guest stays, in hours: mostly an hour or two, now and then longer, at most a day (VIP skill makes long stays likelier)
  const STAYS = [[1, 34], [1.5, 22], [2, 22], [3, 8], [5, 5], [8, 4], [12, 3], [24, 2]];
  const rollHours = (vip) => { const list = STAYS.map(([h, w]) => [h, h >= 8 ? w * (1 + vip * 1.5) : w]), tot = list.reduce((a, x) => a + x[1], 0); let x = Math.random() * tot; for (const [h, w] of list) { x -= w; if (x <= 0) return h; } return 1; };
  const HOUR = 3.6e6;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const OWNERS = {
    tr: ["Ayşe teyze", "Mehmet abi", "Zeynep", "Can", "Elif", "Burak", "Selin", "Emre", "Deniz", "Hatice teyze", "Kerem", "Ece"],
    en: ["Mrs. Rose", "Tom", "Lily", "Sam", "Nora", "Ben", "Ivy", "Jack", "Mia", "Mr. Park", "Leo", "Ava"],
  };
  const WHY = {
    tr: ["alışverişe çıkıyor", "doktora gidiyor", "evini boyatıyor", "düğüne gidiyor", "işe gidiyor", "şehir dışına çıkıyor"],
    en: ["is going shopping", "has a doctor's appointment", "is having the flat painted", "is off to a wedding", "is going to work", "is out of town"],
  };
  const STR = {
    tr: {
      ask: (o, why, n, pay, h) => `🧳 ${o} ${why}. Kedisi ${n} ${h >= 24 ? "bir gün" : String(h).replace(".", ",") + " saat"} sende kalabilir mi? Yaklaşık ${pay}🪙`,
      yes: "Kabul et", no: "Hayır", full: "Evin dolu, misafire yer yok",
      paid: (o, n, c, st) => `💌 ${o} geldi, ${n} evine döndü: ${"⭐".repeat(st)} +${c}🪙. Teşekkürler!`,
      angry: (o, n, why) => `😾 ${o} kedisi ${n} için para vermedi: ${why}`,
      whySick: "kedi hastalanmış", whyLove: "kedi çok ilgisiz kalmış", whyHungry: "kedi uzun süre aç kalmış",
      early: (o, n) => `😿 ${o} erken geldi: ${n} çok mutsuzdu. Para yok.`,
      tag: (o, m) => `🧳 Misafir · sahibi ${o} · ${m >= 60 ? `${Math.floor(m / 60)} sa${m % 60 ? ` ${m % 60} dk` : ""}` : `${m} dk`} kaldı`,
    },
    en: {
      ask: (o, why, n, pay, h) => `🧳 ${o} ${why}: could you look after ${n} for ${h >= 24 ? "a day" : h === 1 ? "an hour" : h + " hours"}? About ${pay}🪙`,
      yes: "Accept", no: "No", full: "Your home is full, no room for a guest",
      paid: (o, n, c, st) => `💌 ${o} picked up ${n}: ${"⭐".repeat(st)} +${c}🪙. Thank you!`,
      angry: (o, n, why) => `😾 ${o} took ${n} back and didn't pay: ${why}`,
      whySick: "the cat got ill", whyLove: "the cat was left alone too much", whyHungry: "the cat went hungry for too long",
      early: (o, n) => `😿 ${o} came early: ${n} was too unhappy. No pay.`,
      tag: (o, m) => `🧳 Guest · owner ${o} · ${m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ""}` : `${m} min`} left`,
    },
  };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  function create(o) {
    const { world, save } = o, L = window.CatLife, DC = window.DesktopCat;
    const t = () => STR[L.lang] || STR.en;
    L.guests = Object.assign({ rep: 0, at: 0, done: 0, offer: null }, L.guests || {});
    if (!L.guests.next || L.guests.next - Date.now() > 2 * 3.6e6) L.guests.next = Date.now() + rnd(0.2, 1) * 3.6e6;      // the first offer comes within a couple of hours
    const box = document.createElement("div"); box.className = "ui gs-box"; box.hidden = true; document.body.appendChild(box);
    let msgT = 0;

    // what your home is worth to a guest: things they can use, kept in good shape
    function homeBonus() {
      const items = world.furniture.filter((f) => f.usable && f.f.role !== "decor");
      const kinds = new Set(items.map((f) => f.kind)).size;
      const cond = items.length ? items.reduce((a, f) => a + f.cond, 0) / items.length / 100 : 0;
      return Math.min(30, Math.round(kinds * 2.5 * cond));
    }
    // the pay: so much a day, plus your home (worth more the longer they stay), times how well it went and your name
    // short stays pay a little, a whole day pays well: base × hours^0.9, plus your home (more of it the longer they stay)
    const pay = (base, h, care, vip) => Math.max(1, Math.round((base * Math.pow(h, 0.9) + homeBonus() * Math.min(1, 0.3 + h / 10)) * care * repK() * (1 + 0.08 * (L.sk ? L.sk("h1") : 0)) * (vip ? 1.4 : 1)));
    const rooms = () => 1 + (L.sk ? L.sk("h2") : 0);       // guests at a time; the Spare room skill adds more
    const repK = () => 1 + Math.max(-0.5, Math.min(10, L.guests.rep)) * 0.06;
    const guestCats = () => world.cats.filter((c) => c.profile && c.profile.guest);
    const show = (html, ms) => {
      if (L.welcomeCollect && ms) { const d = document.createElement("div"); d.innerHTML = html; L.welcomeCollect.push(d.textContent.trim()); return; }   // folded into the welcome-back card
      box.innerHTML = html; box.hidden = false; place(); clearTimeout(msgT); if (ms) msgT = setTimeout(() => { box.hidden = true; }, ms); };
    function place() { box.style.bottom = `${Math.max(12, innerHeight - world.floor + 70)}px`; }

    function makeOffer() {
      const lang = L.lang, coat = pick(DC.COAT_KEYS), name = L.randomName(world.cats.map((c) => c.profile && c.profile.name));
      const vip = L.sk ? L.sk("h4") : 0, hours = rollHours(vip), base = 7 + Math.floor(Math.random() * 5);      // the pay is by the hour
      L.guests.offer = { hours, vip: vip && hours >= 8 ? 1 : 0, coat, name, owner: Math.floor(Math.random() * 12), why: Math.floor(Math.random() * 6), base, until: Date.now() + OFFER_LIFE, sex: Math.random() < 0.5 ? "f" : "m" };
      L.guests.dayN = (L.guests.dayN || 0) + 1; L.guests.at = Date.now(); L.guests.next = Date.now() + rnd(GAP[0], GAP[1]) * 3.6e6; save(); showOffer(); world.meow && world.meow(world.cats.find((c) => c.profile));
      void lang;
    }
    function showOffer() {
      const of = L.guests.offer; if (!of) return;
      const s = t(), est = pay(of.base, of.hours || 1, 1, of.vip);
      show(`<canvas width="44" height="44"></canvas><p>${s.ask(OWNERS[L.lang][of.owner] || OWNERS.en[of.owner], WHY[L.lang][of.why], of.name, est, of.hours || 1)}${of.vip ? " 💎" : ""}</p>
        <div><button type="button" class="gold" data-g="yes">${s.yes}</button><button type="button" data-g="no">${s.no}</button></div>`);
      DC.portrait(box.querySelector("canvas").getContext("2d"), of.coat, { scale: 1, dx: 2, dy: 1 });
    }
    function accept() {
      const of = L.guests.offer; L.guests.offer = null; box.hidden = true; if (!of) return;
      if (guestCats().filter((c) => !c.profile.guest.done).length >= rooms()) return show(`<p>${t().full}</p>`, 4000);
      const p = L.make(of.coat, { name: of.name, g0: 0.7 + Math.random() * 0.3, love: 50, quiet: true, sex: of.sex });
      p.born = Date.now() - (60 + Math.random() * 400) * 864e5; p.stageId = L.stage(p).id;
      p.guest = { owner: of.owner, base: of.base, hours: of.hours || 1, vip: of.vip || 0, until: Date.now() + (of.hours || 1) * HOUR, hungry: 0, sick: 0 };
      const c = world.addCat(null, p); world.confetti(c.x, world.floor - 30, 14); save();
    }
    // the owner comes back: pay depends on how the stay went, how nice your home is and your name as a cat-sitter
    function settle(c, early) {
      const p = c.profile, g = p.guest, s = t(), owner = OWNERS[L.lang][g.owner] || OWNERS.en[g.owner];
      g.done = true; L.guests.done++;
      const h = g.hours || (g.days || 1) * 24;
      let why = g.sick || p.sick ? s.whySick : p.love < 20 ? s.whyLove : g.hungry > h * 3600 * 0.4 ? s.whyHungry : "";
      const repDown = 2 * (1 - 0.25 * (L.sk ? L.sk("h3") : 0)), repUp = 1 + 0.25 * (L.sk ? L.sk("h3") : 0);
      if (early) { L.guests.rep -= repDown; show(`<p>${s.early(owner, p.name)}</p>`, 9000); }
      else if (why) { L.guests.rep -= repDown; show(`<p>${s.angry(owner, p.name, why)}</p>`, 9000); }
      else {
        const care = Math.max(0.3, p.love / 100) * (L.clean(p) < 25 ? 0.7 : 1) * (g.hungry > h * 3600 * 0.15 ? 0.75 : 1);
        const coins = pay(g.base, h, care, g.vip);
        const stars = care > 0.85 ? 3 : care > 0.55 ? 2 : 1; L.guests.rep += (stars === 3 ? 0.5 : stars === 2 ? 0.15 : -0.5) * (stars > 1 ? repUp : 1);
        if (L.gainPXP) L.gainPXP(Math.round((6 + stars * 4) * Math.min(4, Math.sqrt(h))));
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
      // the next neighbour: at a random time 4–6 hours after the last one (several guests can stay at once, if there's room)
      const today = new Date().toDateString(); if (G.day !== today) { G.day = today; G.dayN = 0; }
      if (!G.offer && now >= G.next && G.dayN < PER_DAY && world.cats.some((c) => c.profile && !c.profile.guest)) {
        if (guestCats().filter((c) => !c.profile.guest.done).length < rooms()) makeOffer(); else G.next = now + rnd(GAP[0], GAP[1]) * 3.6e6;
      }
    }
    box.addEventListener("click", (e) => {
      const b = e.target.closest("[data-g]"); if (!b) { if (!L.guests.offer) box.hidden = true; return; }
      if (b.dataset.g === "yes") accept(); else { L.guests.offer = null; box.hidden = true; save(); }
    });
    setInterval(check, 10e3); setTimeout(() => { check(); if (L.guests.offer) showOffer(); }, 6000);
    addEventListener("resize", place);
    return { offer: makeOffer, check, settle, tag: (p) => { if (!p.guest) return ""; const m = Math.max(0, Math.ceil((p.guest.until - Date.now()) / 60e3)); return t().tag(OWNERS[L.lang][p.guest.owner] || "?", m); }, homeBonus };
  }
  window.CatGuests = { create };
})();
