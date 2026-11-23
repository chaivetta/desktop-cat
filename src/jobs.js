// 💼 Jobs: send a grown cat out for a while (a mouse hunt, a visit to the neighbours, a trip to the rubbish tip).
// It walks off the screen, is away for real hours (even with the app shut) and comes back with coins, food, sometimes a find.
(() => {
  const L = window.CatLife;
  const JOBS = [
    { id: "hunt", e: "🐭", h: 1, coins: [5, 12], xp: 10 },
    { id: "visit", e: "🏡", h: 3, coins: [14, 28], xp: 25, food: 0.5 },
    { id: "explore", e: "🗺️", h: 8, coins: [35, 75], xp: 60, food: 0.6, find: 0.35, star: 0.06 },
  ];
  const STR = {
    tr: {
      title: "💼 İşe gönder", jobs: { hunt: "Fare avı", visit: "Komşu ziyareti", explore: "Çöplük keşfi" }, hrs: (h) => `${h} sa`,
      away: (j, m) => `💼 ${j}: ${m >= 60 ? `${Math.floor(m / 60)} sa ${m % 60} dk` : `${m} dk`} sonra döner`,
      cant: { kitten: "Yavrular işe gidemez", sick: "Hasta kedi işe gidemez", hungry: "Aç kedi işe gidemez" },
      back: (n, j, what) => `🎒 ${n} ${j} dönüşü: ${what}`, gone: (n) => `👋 ${n} işe gitti`,
      found: (x) => `buldu: ${x}`, star: "⭐ bir yıldız!",
      hint: "Kedin ekrandan çıkar, süre dolunca (uygulama kapalı olsa bile) ödülle döner. Uzun işler daha iyi ödül getirir.",
    },
    en: {
      title: "💼 Send to work", jobs: { hunt: "Mouse hunt", visit: "Visit the neighbours", explore: "Explore the tip" }, hrs: (h) => `${h} h`,
      away: (j, m) => `💼 ${j}: back in ${m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`}`,
      cant: { kitten: "Kittens can't go to work", sick: "A sick cat can't go", hungry: "A hungry cat can't go" },
      back: (n, j, what) => `🎒 ${n} is back from the ${j.toLowerCase()}: ${what}`, gone: (n) => `👋 ${n} went to work`,
      found: (x) => `found ${x}`, star: "⭐ a star!",
      hint: "Your cat walks off the screen and comes back with a reward when the time's up (even if the app is closed). Longer jobs bring better rewards.",
    },
  };
  const t = () => STR[L.lang] || STR.en;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  function create(o) {
    const { world, save, toast } = o, DC = window.DesktopCat;
    const why = (p) => (L.growth(p) < 0.6 ? "kitten" : p.sick ? "sick" : L.isHungry(p) ? "hungry" : "");
    function send(cat, id) {
      const p = cat.profile, j = JOBS.find((x) => x.id === id); if (!p || !j || p.job || p.guest || why(p)) return;
      p.job = { id, at: Date.now(), until: Date.now() + j.h * 3.6e6 };
      cat.jobOff = false; cat.set("walk", 60, { target: cat.x < world.W / 2 ? -120 : world.W + 120 });
      toast(t().gone(p.name)); L.changed(); save();
    }
    function back(cat) {
      const p = cat.profile, j = JOBS.find((x) => x.id === p.job.id) || JOBS[0], s = t(), got = [];
      p.job = null; cat.jobOff = false; p.jobs = (p.jobs || 0) + 1; L.stats.jobs = (L.stats.jobs || 0) + 1;
      const c = L.earn(Math.round(rnd(j.coins[0], j.coins[1]) * (L.hasBuff(p, "lucky") ? 1.5 : 1)), cat); got.push(`+${c}🪙`);
      if (j.food && Math.random() < j.food) { const f = Math.random() < 0.3 ? "fish" : Math.random() < 0.5 ? "wet" : "dry"; L.pantry[f] = (L.pantry[f] || 0) + 1; got.push(L.FOOD[f].e); }
      if (j.find && Math.random() < j.find) {
        const cheap = Object.keys(DC.FURN).filter((k) => DC.FURN[k].price <= 90 && !DC.FURN[k].event);
        const k = cheap[Math.floor(Math.random() * cheap.length)], id = "f" + Date.now().toString(36);
        L.home.items.push({ id, k, cond: rnd(40, 80), x: null }); got.push(s.found((L.t("furn")[k] || [k])[0]));
      }
      if (j.star && Math.random() < j.star) { L.wallet.stars++; got.push(s.star); }
      p.fedAt = Date.now(); L.addLove(cat, 5); if (L.gainPXP) L.gainPXP(j.xp);
      // walk back in from the edge
      cat.x = Math.random() < 0.5 ? -60 : world.W + 60; cat.y = world.floor; cat.set("walk", 6, { target: rnd(world.W * 0.2, world.W * 0.8) });
      world.confetti(Math.max(40, Math.min(world.W - 40, cat.x)), world.floor - 60, 20);
      toast(s.back(p.name, s.jobs[j.id], got.join(" · "))); L.changed(); save();
    }
    setInterval(() => { for (const c of world.cats) if (c.profile && c.profile.job && Date.now() >= c.profile.job.until) back(c); }, 5000);

    // the card's job section
    let lastKey = "";
    function fill(el, cat) {
      const p = cat && cat.profile; if (!el || !p) return;
      el.hidden = !!p.guest; if (p.guest) return;
      const s = t(), j = p.job && JOBS.find((x) => x.id === p.job.id), w = why(p);
      const key = [L.lang, p.id, j ? j.id : "", j ? Math.ceil((p.job.until - Date.now()) / 60e3) : "", w].join("|"); if (key === lastKey && el.dataset.k === key) return; lastKey = key; el.dataset.k = key;
      el.innerHTML = `<div class="cc-label"><span>${esc(s.title)}</span></div>` + (j
        ? `<p class="cc-jobaway">${esc(s.away(s.jobs[j.id], Math.max(1, Math.ceil((p.job.until - Date.now()) / 60e3))))}</p>`
        : `<div class="cc-jobs">${JOBS.map((x) => `<button type="button" class="cc-pill" data-job="${x.id}"${w ? " disabled" : ""}>${x.e} ${esc(s.jobs[x.id])}<small> · ${esc(s.hrs(x.h))}</small></button>`).join("")}</div>
           <small class="cc-jobhint">${esc(w ? s.cant[w] : s.hint)}</small>`);
      el.onclick = (e) => { const b = e.target.closest("[data-job]"); if (b && !b.disabled) { send(cat, b.dataset.job); lastKey = ""; } };
    }
    return { send, fill, JOBS };
  }
  window.CatJobs = { create };
})();
