// 🌌 Things that happen in the sky now and then: a real full moon (by the actual phase of the moon) when the cats go a bit wild,
// a UFO that beams a cat up for a moment, meteor showers, a rainbow after the rain, the northern lights on winter nights.
// Click the UFO or the rainbow for a gift; the first time you see each one, its card goes into your collection.
(() => {
  const L = window.CatLife;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const NEW_MOON = Date.UTC(2000, 0, 6, 18, 14), SYN = 29.530588853 * 864e5;
  const moonAge = (t = Date.now()) => (((t - NEW_MOON) % SYN) + SYN) % SYN / 864e5;            // days since the new moon
  const isFullMoon = (t) => Math.abs(moonAge(t) - 14.77) < 1.1;
  const STR = {
    tr: { fullmoon: "🌕 Dolunay gecesi! Kediler biraz çılgın bu gece…", ufo: "🛸 Gökyüzünde bir UFO! Tıkla, yakala!", ufoGot: "👽 UFO'yu yakaladın! Bir hediye bıraktı: ", ufoGone: "🛸 UFO, kediyi nazikçe geri bırakıp uzaklaştı",
      meteor: "☄️ Meteor yağmuru! Bir dilek tut…", rainbow: "🌈 Gökkuşağı çıktı! Tıklarsan şans getirir", rainbowGot: "🌈 Gökkuşağının ucunda: ", aurora: "🌌 Kuzey ışıkları! Gökyüzü dans ediyor" },
    en: { fullmoon: "🌕 Full moon tonight! The cats are a little wild…", ufo: "🛸 A UFO in the sky! Click it, catch it!", ufoGot: "👽 You caught the UFO! It left a gift: ", ufoGone: "🛸 The UFO gently put the cat back down and flew off",
      meteor: "☄️ A meteor shower! Make a wish…", rainbow: "🌈 A rainbow! Click it for luck", rainbowGot: "🌈 At the end of the rainbow: ", aurora: "🌌 The northern lights! The sky is dancing" },
  };
  const t = () => STR[L.lang] || STR.en;

  function create(o) {
    const { world, toast, save } = o;
    const X = () => (L.extra.sky = L.extra.sky || {});
    const fx = { ufo: null, rainbow: null, aurora: null, meteorUntil: 0 };
    let checkT = 5, lastWx = null;
    const card = (id) => { if (L.giveCard) L.giveCard(id); };

    // ---- starting each one
    function startUfo() {
      if (fx.ufo) return; const cats = world.cats.filter((c) => c.profile && !c.parkAway && !c.jobOff && !c.hidden && c.state !== "held");
      const dir = Math.random() < 0.5 ? 1 : -1;
      fx.ufo = { x: dir > 0 ? -60 : world.W + 60, y: Math.max(60, world.floor - 260 * world.toyScale / 3), dir, t: 0, phase: "in", target: cats[Math.floor(Math.random() * cats.length)] || null, beam: 0 };
      toast(t().ufo);
    }
    function startRainbow() { if (fx.rainbow) return; fx.rainbow = { t: 0, life: 240, x: rnd(0.3, 0.7) * world.W, got: false }; toast(t().rainbow); card("m_rainbow");
      world.cats.forEach((c) => { if (c.profile && ["sit", "walk", "groom"].includes(c.state) && Math.random() < 0.6) c.set("birdWatch", rnd(3, 6)); }); }
    function startAurora() { if (fx.aurora) return; fx.aurora = { t: 0, life: 600 }; toast(t().aurora); card("m_aurora"); }
    function startMeteors() { fx.meteorUntil = Date.now() + 120e3; toast(t().meteor); card("m_meteor"); }
    function fullMoonNote() { const n = new Date().toDateString(); if (X().moonNight === n) return; X().moonNight = n; toast(t().fullmoon); card("m_fullmoon"); }
    // try one out now (from ⚙️ Settings)
    function trigger(kind) { if (kind === "aurora") { startAurora(); if (fx.aurora) fx.aurora.forced = true; return; } if (kind === "fullmoon") { world.moonFull = true; world.forceMoon = Date.now() + 120e3; X().moonNight = null; fullMoonNote(); } else ({ ufo: startUfo, rainbow: startRainbow, aurora: startAurora, meteor: startMeteors })[kind](); }

    // ---- once a minute: should something happen?
    function check() {
      const night = world.isNight(), wx = world.weather ? world.weather.kind : "clear", clearSky = !["rain", "storm", "snow", "fog", "drizzle"].includes(wx), mon = new Date().getMonth();
      world.moonFull = (world.forceMoon && Date.now() < world.forceMoon) || (night && isFullMoon());
      if (world.moonFull && night) fullMoonNote();
      const today = new Date().toDateString(), x = X();
      if (night && clearSky) {
        if (x.ufoDay !== today && Math.random() < 1 / 120) { x.ufoDay = today; startUfo(); }                    // about one night in three
        if (x.meteorDay !== today && Math.random() < 1 / 300) { x.meteorDay = today; startMeteors(); }
        if ((mon >= 10 || mon <= 2) && x.auroraDay !== today && Math.random() < 1 / 200) { x.auroraDay = today; startAurora(); }
      }
      // a rainbow when the rain stops in the daytime (and very rarely out of the blue)
      if (!night && ["rain", "drizzle", "storm"].includes(lastWx) && ["clear", "cloud", ""].includes(wx) && x.rainbowDay !== today) { x.rainbowDay = today; startRainbow(); }
      else if (!night && clearSky && x.rainbowDay !== today && Math.random() < 1 / 900) { x.rainbowDay = today; startRainbow(); }
      lastWx = wx;
    }

    // ---- every frame
    function update(dt) {
      checkT -= dt; if (checkT <= 0) { checkT = 60; check(); }
      if (Date.now() < fx.meteorUntil && Math.random() < dt * 2.2) { const d = Math.random() < 0.5 ? -1 : 1; world.stars = world.stars || []; world.stars.push({ x: rnd(world.W * 0.1, world.W * 0.9), y: rnd(10, 120), vx: d * rnd(380, 560), vy: rnd(120, 200), life: 1.1, trail: [] }); }
      const u = fx.ufo;
      if (u) {
        u.t += dt; const c = u.target && world.cats.includes(u.target) ? u.target : null;
        if (u.phase === "in") { const tx = c ? c.x : world.W / 2; u.x += Math.sign(tx - u.x) * Math.min(Math.abs(tx - u.x), 220 * dt); if (Math.abs(tx - u.x) < 4) { u.phase = "beam"; u.t = 0; } }
        else if (u.phase === "beam") { u.beam = Math.min(1, u.beam + dt * 2); if (c) { if (c.state !== "meerkat") c.set("meerkat", 6); c.ufoLift = Math.min(70 * world.toyScale / 3, (c.ufoLift || 0) + dt * 30); c.x = u.x; } if (u.t > 6) { u.phase = "drop"; u.t = 0; } }
        else if (u.phase === "drop") { u.beam = Math.max(0, u.beam - dt * 1.5); if (c) { c.ufoLift = Math.max(0, (c.ufoLift || 0) - dt * 60); if (c.ufoLift === 0 && c.state === "meerkat") c.set("shake", 1.8); } if (u.t > 2) { u.phase = "out"; if (!u.caught) toast(t().ufoGone); } }
        else { u.x += u.dir * 300 * dt; u.y -= 80 * dt; if (u.x < -100 || u.x > world.W + 100 || u.y < -80) { if (c) c.ufoLift = 0; fx.ufo = null; } }
      }
      if (fx.rainbow) { fx.rainbow.t += dt; if (fx.rainbow.t > fx.rainbow.life) fx.rainbow = null; }
      if (fx.aurora) { fx.aurora.t += dt; if (fx.aurora.t > fx.aurora.life || (!fx.aurora.forced && !world.isNight())) fx.aurora = null; }
    }
    function render(ctx) {
      const k = Math.max(2, Math.round(world.toyScale)), f = world.floor;
      if (fx.aurora) {                                    // the northern lights: soft green and violet curtains, swaying
        const a = Math.min(1, fx.aurora.t / 8, (fx.aurora.life - fx.aurora.t) / 8), tt = fx.aurora.t;
        ctx.save(); ctx.globalAlpha = a;
        for (let x = 0; x < world.W; x += k * 2) { const y = 30 + Math.sin(x / 140 + tt * 0.4) * 30 + Math.sin(x / 47 + tt) * 10;
          for (let i = 0; i < 14; i++) { ctx.fillStyle = `rgba(${80 + i * 8},${230 - i * 6},${160 + i * 7},${0.14 - i * 0.009})`; ctx.fillRect(x, y + i * 6, k * 2, 7); }
          if ((x / k) % 9 === 0) { ctx.fillStyle = "rgba(190,120,255,.08)"; ctx.fillRect(x, y - 20, k * 2, 30); } }
        ctx.restore();
      }
      if (fx.rainbow) {                                   // a big pixel rainbow over the desktop
        const R0 = fx.rainbow, a = Math.min(1, R0.t / 4, (R0.life - R0.t) / 6), cx = R0.x, cy = f, rr = Math.min(world.W * 0.45, f * 0.85);
        const cols = ["#ff5a5a", "#ffa040", "#ffe060", "#70d070", "#58a8f0", "#8a70e0"];
        ctx.save(); ctx.globalAlpha = 0.55 * a;
        for (let i = 0; i < cols.length; i++) { const r = rr - i * 5 * k; ctx.fillStyle = cols[i]; for (let ang = Math.PI; ang <= 2 * Math.PI; ang += 0.004) { const x = cx + Math.cos(ang) * r, y = cy + Math.sin(ang) * r * 0.9; ctx.fillRect(Math.round(x / k) * k, Math.round(y / k) * k, k, 5 * k); } }
        ctx.restore(); R0.hitR = rr;
      }
      const u = fx.ufo;
      if (u) {                                            // the UFO: a silver saucer, a glass dome, blinking lights, a beam
        const bob = Math.sin(u.t * 3) * 4, x = u.x, y = u.y + bob;
        if (u.beam > 0) { const g = ctx.createLinearGradient(0, y, 0, f); g.addColorStop(0, `rgba(180,255,200,${0.45 * u.beam})`); g.addColorStop(1, `rgba(180,255,200,${0.12 * u.beam})`); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 8 * k, y + 4 * k); ctx.lineTo(x + 8 * k, y + 4 * k); ctx.lineTo(x + 22 * k, f); ctx.lineTo(x - 22 * k, f); ctx.closePath(); ctx.fill(); }
        const p = (dx, dy, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x + dx * k), Math.round(y + dy * k), w * k, h * k); };
        p(-6, -9, 12, 5, "#9ae8c8"); p(-4, -11, 8, 2, "#bff4dc"); p(-2, -8, 2, 2, "#e8fff4");
        p(-16, -4, 32, 5, "#b8c0cc"); p(-12, -6, 24, 2, "#d8dee8"); p(-14, 1, 28, 2, "#7a8494"); p(-8, 3, 16, 2, "#5a6474");
        for (let i = 0; i < 5; i++) p(-12 + i * 6, -2, 2, 2, Math.floor(u.t * 4 + i) % 2 ? "#ffd34d" : "#ff6a8a");
        u.hx = x; u.hy = y;
      }
    }
    // clicking the UFO or the rainbow
    const giftOf = (big) => { const out = []; out.push(`+${L.earn(big ? 25 : 10)}🪙`); if (big || Math.random() < 0.3) { L.wallet.stars++; out.push("⭐"); } if (L.addPawPoints) { L.addPawPoints(big ? 60 : 25); out.push(`+${big ? 60 : 25}🐾`); } return out.join(" "); };
    const ufoHit = { grab() {}, release() {}, click() { const u = fx.ufo; if (!u || u.caught) return; u.caught = true; world.confetti(u.hx, u.hy, 50); toast(t().ufoGot + giftOf(true)); card("m_ufo"); u.phase = u.phase === "beam" ? "drop" : u.phase; L.changed(); save(); } };
    const rainHit = { grab() {}, release() {}, click() { const r = fx.rainbow; if (!r || r.got) return; r.got = true; world.confetti(r.x, world.floor - (r.hitR || 200) * 0.8, 40); toast(t().rainbowGot + giftOf(false)); L.changed(); save(); } };
    function hit(x, y) {
      const u = fx.ufo; if (u && u.hx != null && Math.abs(x - u.hx) < 18 * world.toyScale && Math.abs(y - u.hy) < 12 * world.toyScale) return ufoHit;
      const r = fx.rainbow; if (r && !r.got && r.hitR) { const dx = (x - r.x) / r.hitR, dy = (world.floor - y) / (r.hitR * 0.9), d = Math.hypot(dx, dy); if (d > 0.82 && d < 1.02 && y < world.floor) return rainHit; }
      return null;
    }
    world.skyFx = { update, render, hit };
    return { trigger, isFullMoon, moonAge };
  }
  window.CatSky = { create };
})();
