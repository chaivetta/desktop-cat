// 💭 Wishes: now and then a cat wants something in particular (a fish dinner, its mouse, a cuddle, a nap in the bed).
// A thought bubble shows it over the cat and on its card. Grant it in time for love, coins and XP; let it lapse and the cat sulks a little.
(() => {
  const L = window.CatLife;
  const LIFE = 45 * 60e3, GAP = [25, 70];                // a wish lasts 45 minutes; the next comes 25–70 minutes later
  const rnd = (a, b) => a + Math.random() * (b - a);
  const STR = {
    tr: {
      pet: (n) => `biraz sevilmek istiyor (${n} kez)`, fed: { fish: "balık istiyor", wet: "yaş mama istiyor", any: "karnı acıktı, mama istiyor" },
      play: { yarn: "yumakla oynamak istiyor", mouse: "kurmalı fareyle oynamak istiyor", butterfly: "kelebek kovalamak istiyor", feather: "olta ile oynamak istiyor", laser: "lazer kovalamak istiyor" },
      bed: "yatakta uyumak istiyor", brush: "taranmak istiyor", box: "kutuya girmek istiyor",
      combo: (n) => `${n}x kombo`, line: (n, w, m) => `💭 ${n} ${w} · ${m} dk`, done: (n, c) => `💖 ${n}'ın isteği yerine geldi!${c ? ` +${c}🪙` : ""}`, miss: (n) => `😿 ${n}'ın isteği gerçekleşmedi, biraz küstü`,
    },
    en: {
      pet: (n) => `wants some cuddles (${n} times)`, fed: { fish: "wants fish", wet: "wants wet food", any: "is hungry for dinner" },
      play: { yarn: "wants to play with the yarn", mouse: "wants the wind-up mouse", butterfly: "wants to chase the butterfly", feather: "wants the feather wand", laser: "wants to chase the laser" },
      bed: "wants to nap in a bed", brush: "wants to be brushed", box: "wants to sit in a box",
      combo: (n) => `${n}x combo`, line: (n, w, m) => `💭 ${n} ${w} · ${m} min`, done: (n, c) => `💖 ${n}'s wish came true!${c ? ` +${c}🪙` : ""}`, miss: (n) => `😿 ${n}'s wish wasn't met; a little sulk`,
    },
  };
  const t = () => STR[L.lang] || STR.en;
  const TOYKEY = { yarn: "yarn", mouse: "mouse", butterfly: "butterfly", feather: "wand", laser: "laser" };

  // what this cat could wish for, given what you own
  function options(world) {
    const o = [{ k: "pet", n: 3, e: "💗", w: 3 }, { k: "fed", food: "any", e: "🍗", w: 2 }, { k: "fed", food: "fish", e: "🐟", w: 1 }, { k: "fed", food: "wet", e: "🥫", w: 1 }];
    for (const [key, toy] of Object.entries(TOYKEY)) if (L.toys.includes(toy)) o.push({ k: "play", toy: key, e: { yarn: "🧶", mouse: "🐭", butterfly: "🦋", feather: "🪶", laser: "🔴" }[key], w: 2 });
    if (L.toys.includes("brush")) o.push({ k: "brush", e: "🪮", w: 1 });
    if (L.toys.includes("box")) o.push({ k: "box", e: "📦", w: 1 });
    if (world.furniture.some((f) => f.f.nap != null && !f.f.hide)) o.push({ k: "bed", e: "💤", w: 1 });
    return o;
  }
  const pick = (list) => { let x = Math.random() * list.reduce((a, b) => a + b.w, 0); for (const it of list) { x -= it.w; if (x <= 0) return it; } return list[0]; };
  const text = (w) => { const s = t(); return w.k === "pet" ? s.pet(Math.max(1, w.n - (w.got || 0))) : w.k === "fed" ? s.fed[w.food] : w.k === "play" ? s.play[w.toy] : s[w.k]; };

  function create(o) {
    const { world, save, toast } = o;
    function grant(cat) {
      const p = cat.profile, w = p.wish; if (!w) return;
      p.wish = null; p.wishNext = Date.now() + rnd(GAP[0], GAP[1]) * 60e3; p.wishes = (p.wishes || 0) + 1;
      // a combo: wishes granted one after another (without letting one lapse) pay more, and every 5th brings a star
      const combo = L.stats.combo = (L.stats.combo || 0) + 1; L.stats.wishes = (L.stats.wishes || 0) + 1; L.stats.bestCombo = Math.max(L.stats.bestCombo || 0, combo);
      const k = 1 + 0.25 * Math.min(4, combo - 1), star = combo % 5 === 0 && (L.econToday().wishStars || 0) < 2;
      if (star) L.econToday().wishStars = (L.econToday().wishStars || 0) + 1;
      const E = L.econToday(), want = Math.round(3 * k * (L.hasBuff(p, "lucky") ? 1.5 : 1)), room = Math.max(0, 30 - (E.wish || 0)), give = Math.min(want, room); E.wish = (E.wish || 0) + give;
      const coins = give ? L.earn(give, cat) : 0; L.addLove(cat, 8); if (L.gainPXP) L.gainPXP(Math.round(12 * k)); if (star) L.wallet.stars++;
      world.confetti(cat.x, cat.y - 40 * cat.s, 14 + combo * 2); world.purr && world.purr();
      toast(t().done(p.name, coins) + (combo > 1 ? ` · 🔥 ${t().combo(combo)}` : "") + (star ? " +⭐" : "")); L.changed(); save();
    }
    // every care event checks the cat's wish
    const care0 = L.care.bind(L);
    L.care = (cat, kind, arg = {}) => {
      care0(cat, kind, arg);
      const p = cat && cat.profile, w = p && p.wish; if (!w || p.guest) return;
      if (w.k === "pet" && kind === "pet") { w.got = (w.got || 0) + 1; if (w.got >= w.n) grant(cat); else L.changed(); }
      else if (w.k === "fed" && kind === "fed" && (w.food === "any" || arg.food === w.food)) grant(cat);
      else if (w.k === "play" && kind === "play" && arg.toyKey === w.toy) grant(cat);
      else if (w.k === "bed" && kind === "bed") grant(cat);
      else if (w.k === "box" && kind === "box") grant(cat);
    };
    function tick() {
      const now = Date.now();
      for (const c of world.cats) {
        const p = c.profile; if (!p || p.guest || p.job || c.leaving || c.stray) continue;
        if (p.wish) {
          if (p.wish.k === "brush" && (p.brushedAt || 0) > p.wish.at) { grant(c); continue; }
          if (now > p.wish.until) { L.stats.combo = 0; p.wish = null; p.wishNext = now + rnd(GAP[0], GAP[1]) * 60e3; L.addLove(c, -6); world.burst(c.x, c.y - 40 * c.s, "sad", "#8a6b9a", 1); toast(t().miss(p.name)); L.changed(); save(); }
          continue;
        }
        if (!p.wishNext) { p.wishNext = now + rnd(5, 30) * 60e3; continue; }
        if (now >= p.wishNext && L.growth(p) > 0.15) {
          const w = pick(options(world)); p.wish = { ...w, at: now, until: now + LIFE, got: 0 }; delete p.wish.w;
          world.meow && world.meow(c); L.changed(); save();
        }
      }
    }
    setInterval(tick, 15e3); setTimeout(tick, 5000);
    return { text: (p) => (p.wish ? t().line(p.name, text(p.wish), Math.max(1, Math.ceil((p.wish.until - Date.now()) / 60e3))) : ""), grant };
  }
  window.CatWishes = { create };
})();
