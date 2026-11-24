// 🎓 A short first-run guide: a speech bubble walks you through the basics and a glowing ring shows where to look.
// Some steps wait for you to do the thing (open the card, open the menu); the rest have a "Next" button. Skip any time,
// replay it from ⚙️ Settings. A small gift at the end.
(() => {
  const L = window.CatLife;
  const STR = {
    tr: { next: "İleri ›", skip: "Geç", done: "Başlayalım! 🐾", wait: "(bunu yapınca devam ederiz)", gift: "🎁 Tanıtım hediyesi: ",
      steps: {
        hi: "Merhaba! 🐾 Sana oyunu kısaca göstereyim, bir dakika sürer.",
        pet: "Bu senin kedin. Farenle üstünde gezdir, okşa; tıklarsan sevinir 💕 Sürükleyip başka yere de taşıyabilirsin.",
        card: "Şimdi kedine <b>sağ tıkla</b>: kartı açılır. Adı, açlığı, mutluluğu, genleri hepsi orada.",
        menu: "Kartın üstündeki <b>☰</b> düğmesi büyük menüyü açar. Hadi bas!",
        groups: "Menü 5 bölüm: Alışveriş, Dünya, Ödüller, Eğlence, Ayarlar. Üstte bölümler, altında o bölümün sayfaları.",
        feed: "Kediler acıkır 🍗 <b>Alışveriş › Market › Mama</b>'dan yemek al, sonra envanterden mamayı yere sürükle.",
        world: "<b>🌍 Dünya</b>: haritadan şehirlere uç, parklarda gez. Her şehrin marketinde ona özel eşyalar var!",
        rewards: "<b>🏆 Ödüller</b>: Pati Yolu görevleri, kart koleksiyonu ve gelişim. Kırmızı nokta görürsen ödül seni bekliyor demek.",
        pot: "Saksılara <b>sağ tıkla</b>: tohum ek, sula, hasat et 🌱 Geceleri gökyüzüne de bak, bazen UFO geçer 🛸",
        end: "Hepsi bu kadar! Kedilerine iyi bak, onlar da seni çok sevecek 💛" } },
    en: { next: "Next ›", skip: "Skip", done: "Let's go! 🐾", wait: "(do it and we'll carry on)", gift: "🎁 A welcome gift: ",
      steps: {
        hi: "Hi! 🐾 Let me show you around, it only takes a minute.",
        pet: "This is your cat. Move the mouse over it to pet it; click and it's happy 💕 You can drag it somewhere else too.",
        card: "Now <b>right-click</b> your cat: its card opens. Its name, hunger, mood and genes are all there.",
        menu: "The <b>☰</b> button on top of the card opens the big menu. Go on, press it!",
        groups: "The menu has 5 parts: Shopping, World, Rewards, Fun, Settings. The parts on top, their pages underneath.",
        feed: "Cats get hungry 🍗 Buy food in <b>Shopping › Market › Food</b>, then drag it from the inventory onto the floor.",
        world: "<b>🌍 World</b>: fly to cities on the map and visit their parks. Every city's market has its own special things!",
        rewards: "<b>🏆 Rewards</b>: Paw Path tasks, the card collection and progress. A red dot means a reward is waiting.",
        pot: "<b>Right-click</b> the pots: plant, water, harvest 🌱 And look at the sky at night, sometimes a UFO flies by 🛸",
        end: "That's it! Look after your cats and they'll love you to bits 💛" } },
  };
  const t = () => STR[L.lang] || STR.en;
  // which way to point, and when a step is done by itself
  const STEPS = [
    { id: "hi" },
    { id: "pet", at: "cat" },
    { id: "card", at: "cat", until: () => { const c = document.querySelector(".cc"); return c && !c.hidden; } },
    { id: "menu", at: ".cc-top .cc-tab.menu", until: () => window.CatHub.now && window.CatHub.now.shown, skipIf: () => { const c = document.querySelector(".cc"); return !c || c.hidden; } },
    { id: "groups", at: ".hub .hub-row" },
    { id: "feed", at: ".hub [data-grp=shop]" },
    { id: "world", at: ".hub [data-grp=world]" },
    { id: "rewards", at: ".hub [data-grp=rewards]" },
    { id: "pot" },
    { id: "end" },
  ];

  function create(o) {
    const { world, save } = o;
    const X = () => (L.extra.tut = L.extra.tut || {});
    const box = document.createElement("div"); box.className = "ui tut"; box.hidden = true;
    const ring = document.createElement("div"); ring.className = "tut-ring"; ring.hidden = true;
    document.body.append(ring, box);
    let i = -1, timer = 0;

    function rectOf(at) {
      if (!at) return null;
      if (at === "cat") {
        const c = world.cats.find((c) => c.profile && !c.parkAway && !c.hidden) || world.cats[0]; if (!c) return null;
        const b = c.bounds(); return { left: b.x, top: b.y, width: b.w, height: b.h };
      }
      const el = document.querySelector(at); if (!el || el.closest("[hidden]")) return null;
      return el.getBoundingClientRect();
    }
    function place() {
      if (i < 0) return;
      const st = STEPS[i], r = rectOf(st.at);
      if (r) { const pad = 6; Object.assign(ring.style, { left: `${r.left - pad}px`, top: `${r.top - pad}px`, width: `${r.width + pad * 2}px`, height: `${r.height + pad * 2}px` }); ring.hidden = false; }
      else ring.hidden = true;
      // the bubble sits under (or over) what it points at, or in the middle of the screen
      const bw = box.offsetWidth, bh = box.offsetHeight;
      let x = innerWidth / 2 - bw / 2, y = innerHeight * 0.32;
      if (r) { x = Math.min(innerWidth - bw - 10, Math.max(10, r.left + r.width / 2 - bw / 2)); y = r.top - bh - 16 > 10 ? r.top - bh - 16 : r.top + r.height + 16;
        if (y + bh > innerHeight - 10) y = Math.max(10, innerHeight - bh - 10);
        // keep clear of an open panel on the right
        const p = document.querySelector(".mk:not([hidden]):not(.mk-pop), .st:not([hidden])"); if (p && st.at && st.at.startsWith(".hub")) { const pr = p.getBoundingClientRect(); x = Math.max(10, pr.left - bw - 16); y = Math.max(10, r.top); } }
      box.style.left = `${x}px`; box.style.top = `${y}px`;
    }
    function show() {
      const st = STEPS[i], s = t(), last = i === STEPS.length - 1;
      box.innerHTML = `<div class="tut-n">${i + 1} / ${STEPS.length}</div><p>${s.steps[st.id]}</p>${st.until ? `<small>${s.wait}</small>` : ""}
        <div class="tut-b">${last ? "" : `<button type="button" class="tut-skip">${s.skip}</button>`}${st.until ? "" : `<button type="button" class="tut-next">${last ? s.done : s.next}</button>`}</div>`;
      box.hidden = false; place();
    }
    function go(n) {
      i = n; if (i >= STEPS.length) return finish(true);
      const st = STEPS[i]; if (st.skipIf && st.skipIf()) return go(i - 1);           // e.g. the card was closed again: back a step
      show();
    }
    function finish(gift) {
      i = -1; box.hidden = true; ring.hidden = true; clearInterval(timer); timer = 0;
      const x = X(); const first = !x.done; x.done = true;
      if (gift && first) { const out = [`+${L.earn(50)}🪙`]; if (L.giveCardPack) { L.giveCardPack(1); out.push("📦"); } o.toast(t().gift + out.join(" ")); }
      L.changed && L.changed(); save();
    }
    function start() {
      if (i >= 0) return; go(0);
      clearInterval(timer); timer = setInterval(() => { if (i < 0) return; const st = STEPS[i];
        if (st.until && st.until()) return go(i + 1);
        if (st.skipIf && st.skipIf()) return go(i - 1);
        place(); }, 250);
    }
    box.addEventListener("click", (e) => {
      if (e.target.closest(".tut-skip")) return finish(false);
      if (e.target.closest(".tut-next")) go(i + 1);
    });
    // the first time: wait until the welcome box is gone
    if (!X().done) { const w = setInterval(() => { if (document.querySelector(".wb")) return; clearInterval(w); setTimeout(() => { if (!X().done) start(); }, 2500); }, 1000); }
    return { start, get on() { return i >= 0; } };
  }
  window.CatTutorial = { create };
})();
