// 💼 Jobs: send a grown cat out for a while (a mouse hunt, a visit to the neighbours, a trip to the rubbish tip).
// It walks off the screen, is away for real hours (even with the app shut) and comes back with coins, food, sometimes a find.
(() => {
  const L = window.CatLife;
  const JOBS = [
    { id: "hunt", e: "🐭", h: 1, coins: [5, 12], xp: 10 },
    { id: "visit", e: "🏡", h: 3, coins: [14, 28], xp: 25, food: 0.5 },
    { id: "explore", e: "🗺️", h: 8, coins: [35, 75], xp: 60, food: 0.6, find: 0.35, star: 0.06 },
  ];
  // job offers that come in now and then for one of your cats (better pay than the jobs you pick yourself)
  const OFFERS = [
    { id: "mice", e: "🐭", h: 8, coins: [55, 95], xp: 55, food: 0.4 }, { id: "scout", e: "🔭", h: 1, coins: [6, 12], xp: 10 },
    { id: "birds", e: "🐦", h: 2, coins: [14, 24], xp: 18 }, { id: "cafe", e: "☕", h: 4, coins: [28, 48], xp: 30 },
    { id: "library", e: "📚", h: 6, coins: [42, 68], xp: 42 }, { id: "model", e: "📸", h: 2, coins: [20, 36], xp: 20, genes: true },
    { id: "therapy", e: "🏥", h: 3, coins: [18, 32], xp: 40 }, { id: "fisher", e: "🎣", h: 5, coins: [30, 52], xp: 35, fish: true },
    { id: "night", e: "🌙", h: 10, coins: [75, 125], xp: 70, star: 0.08 },
  ];
  const STR = {
    tr: {
      title: "💼 İşe gönder", jobs: { hunt: "Fare avı", visit: "Komşu ziyareti", explore: "Çöplük keşfi" }, hrs: (h) => `${h} sa`,
      away: (j, m) => `💼 ${j}: ${m >= 60 ? `${Math.floor(m / 60)} sa ${m % 60} dk` : `${m} dk`} sonra döner`,
      cant: { kitten: "Yavrular işe gidemez", sick: "Hasta kedi işe gidemez", hungry: "Aç kedi işe gidemez" },
      back: (n, j, what) => `🎒 ${n} ${j} dönüşü: ${what}`, gone: (n) => `👋 ${n} işe gitti`,
      found: (x) => `buldu: ${x}`, star: "⭐ bir yıldız!",
      hint: "Kedin ekrandan çıkar, süre dolunca (uygulama kapalı olsa bile) ödülle döner. Uzun işler daha iyi ödül getirir. Ara sıra daha iyi ödeyen iş teklifleri de gelir.",
      offers: { mice: "bakkalın deposunda fare temizleyecek", scout: "mahallede kısa bir keşfe çıkacak", birds: "bostanda kuşları korkutacak", cafe: "kedi kafede müşterileri ağırlayacak", library: "kütüphanede bekçilik yapacak", model: "mama reklamı için poz verecek (genleri iyiyse daha çok kazanır)", therapy: "hastanede çocukları neşelendirecek", fisher: "balıkçıya yardım edecek", night: "fabrikada gece bekçiliği yapacak" },
      offerT: (n, h, d, pay) => `💼 İş teklifi: ${n} ${h} saat ${d}. Yaklaşık ${pay}🪙`, yes: "Gönder", no: "Hayır",
    },
    en: {
      title: "💼 Send to work", jobs: { hunt: "Mouse hunt", visit: "Visit the neighbours", explore: "Explore the tip" }, hrs: (h) => `${h} h`,
      away: (j, m) => `💼 ${j}: back in ${m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`}`,
      cant: { kitten: "Kittens can't go to work", sick: "A sick cat can't go", hungry: "A hungry cat can't go" },
      back: (n, j, what) => `🎒 ${n} is back from the ${j.toLowerCase()}: ${what}`, gone: (n) => `👋 ${n} went to work`,
      found: (x) => `found ${x}`, star: "⭐ a star!",
      hint: "Your cat walks off the screen and comes back with a reward when the time's up (even if the app is closed). Longer jobs bring better rewards. Better-paid job offers come in now and then too.",
      offers: { mice: "clear the mice out of the grocer's storeroom", scout: "go on a quick scouting trip", birds: "scare the birds off the allotment", cafe: "greet customers at the cat café", library: "guard the library", model: "pose for a cat food advert (better genes, better pay)", therapy: "cheer up children at the hospital", fisher: "help the fisherman", night: "be the factory's night watch" },
      offerT: (n, h, d, pay) => `💼 Job offer: ${n} could ${d} for ${h} hours. About ${pay}🪙`, yes: "Send", no: "No",
    },
  };
  const t = () => STR[L.lang] || STR.en;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  function create(o) {
    const { world, save, toast } = o, DC = window.DesktopCat;
    const why = (p) => (L.growth(p) < 0.6 ? "kitten" : p.sick ? "sick" : L.isHungry(p) ? "hungry" : "");
    function send(cat, id, def) {
      const p = cat.profile, j = def || JOBS.find((x) => x.id === id); if (!p || !j || p.job || p.guest || why(p)) return;
      p.job = { id: j.id, def: def || null, at: Date.now(), until: Date.now() + j.h * 3.6e6 };
      cat.jobOff = false; cat.set("walk", 60, { target: cat.x < world.W / 2 ? -120 : world.W + 120 });
      toast(t().gone(p.name)); L.changed(); save();
    }
    function back(cat) {
      const p = cat.profile, j = p.job.def || JOBS.find((x) => x.id === p.job.id) || JOBS[0], s = t(), got = [];
      p.job = null; cat.jobOff = false; p.jobs = (p.jobs || 0) + 1; L.stats.jobs = (L.stats.jobs || 0) + 1;
      const c = L.earn(Math.round(rnd(j.coins[0], j.coins[1]) * (L.hasBuff(p, "lucky") ? 1.5 : 1) * (j.genes ? 0.6 + L.geneScore(p) / 100 : 1)), cat); got.push(`+${c}🪙`);
      if (j.fish) { L.pantry.fish = (L.pantry.fish || 0) + 1; got.push("🐟"); }
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
      toast(s.back(p.name, s.jobs[j.id] || `${j.e} ${s.offers[j.id] || ""}`.trim(), got.join(" · "))); L.changed(); save();
    }
    setInterval(() => { for (const c of world.cats) if (c.profile && c.profile.job && Date.now() >= c.profile.job.until) back(c); }, 5000);

    // the card's job section
    let lastKey = "";
    function fill(el, cat) {
      const p = cat && cat.profile; if (!el || !p) return;
      el.hidden = !!p.guest; if (p.guest) return;
      const s = t(), j = p.job && (p.job.def || JOBS.find((x) => x.id === p.job.id)), w = why(p);
      const key = [L.lang, p.id, j ? j.id : "", j ? Math.ceil((p.job.until - Date.now()) / 60e3) : "", w].join("|"); if (key === lastKey && el.dataset.k === key) return; lastKey = key; el.dataset.k = key;
      el.innerHTML = `<div class="cc-label"><span>${esc(s.title)}</span></div>` + (j
        ? `<p class="cc-jobaway">${esc(s.away(s.jobs[j.id] || `${j.e} ${s.offers[j.id]}`, Math.max(1, Math.ceil((p.job.until - Date.now()) / 60e3))))}</p>`
        : `<div class="cc-jobs">${JOBS.map((x) => `<button type="button" class="cc-pill" data-job="${x.id}"${w ? " disabled" : ""}>${x.e} ${esc(s.jobs[x.id])}<small> · ${esc(s.hrs(x.h))}</small></button>`).join("")}</div>
           <small class="cc-jobhint">${esc(w ? s.cant[w] : s.hint)}</small>`);
      el.onclick = (e) => { const b = e.target.closest("[data-job]"); if (b && !b.disabled) { send(cat, b.dataset.job); lastKey = ""; } };
    }
    // ---- offers: every 1–3 hours (while the app is open, at most 6 a day) a job comes in for one of your free cats
    const box = document.createElement("div"); box.className = "ui gs-box"; box.hidden = true; document.body.appendChild(box);
    const J = () => (L.extra.jobs = L.extra.jobs || { next: Date.now() + rnd(20, 60) * 60e3, offer: null, day: "", n: 0 });
    function showOffer() {
      const of = J().offer, cat = of && world.cats.find((c) => c.profile && c.profile.id === of.cat); if (!of || !cat) { box.hidden = true; return; }
      const d = OFFERS.find((x) => x.id === of.id), s = t(), pay = Math.round((d.coins[0] + d.coins[1]) / 2 * (d.genes ? 0.6 + L.geneScore(cat.profile) / 100 : 1));
      box.innerHTML = `<canvas width="44" height="44"></canvas><p></p><div><button type="button" class="gold" data-j="yes"></button><button type="button" data-j="no"></button></div>`;
      box.querySelector("p").textContent = `${d.e} ${s.offerT(cat.profile.name, d.h, s.offers[d.id], pay)}`; box.querySelector('[data-j="yes"]').textContent = s.yes; box.querySelector('[data-j="no"]').textContent = s.no;
      DC.portrait(box.querySelector("canvas").getContext("2d"), cat.coat, { scale: 1, dx: 2, dy: 1, genes: cat.profile.genes });
      box.style.bottom = `${Math.max(12, innerHeight - world.floor + 150)}px`; box.hidden = false;
    }
    box.addEventListener("click", (e) => {
      const b = e.target.closest("[data-j]"), of = J().offer; if (!b || !of) return;
      if (b.dataset.j === "yes") { const cat = world.cats.find((c) => c.profile && c.profile.id === of.cat), d = OFFERS.find((x) => x.id === of.id); if (cat) send(cat, d.id, d); }
      J().offer = null; box.hidden = true; save();
    });
    setInterval(() => {
      const S = J(), now = Date.now(), today = new Date().toDateString();
      if (S.day !== today) { S.day = today; S.n = 0; }
      if (S.offer && now > S.offer.until) { S.offer = null; box.hidden = true; }
      if (S.offer || now < S.next || S.n >= 6) return;
      const free = world.cats.filter((c) => c.profile && !c.profile.guest && !c.profile.job && !c.leaving && !why(c.profile));
      S.next = now + rnd(60, 180) * 60e3; if (!free.length) return;
      const cat = free[Math.floor(Math.random() * free.length)], d = OFFERS[Math.floor(Math.random() * OFFERS.length)];
      S.offer = { id: d.id, cat: cat.profile.id, until: now + 20 * 60e3 }; S.n++; showOffer(); world.meow && world.meow(cat); save();
    }, 20e3);
    setTimeout(showOffer, 8000);
    return { send, fill, JOBS, OFFERS, offer: () => { J().next = 0; } };
  }
  window.CatJobs = { create };
})();
