/* Desktop Cat — the cat card: who they are, how they're doing, and what they've been up to. */
(() => {
  "use strict";
  const L = window.CatLife, DC = window.DesktopCat;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const tint = (hex, t) => `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).map((v) => Math.round(v + (255 - v) * t)).join(",")})`;
  const CHIP = ["#ffe1ea", "#d8f3e6", "#e4dcff", "#fff1b8", "#dcefff"];
  const POSE_OF = { sleep: "sleep", knead: "knead", groom: "groom", washFace: "washFace", lickFlank: "lickFlank", legUp: "legUp", roll: "roll", nip: "roll", eat: "eat", yawn: "yawn", stretch: "stretch", happy: "sit" };
  const DX = { sleep: -1, roll: -3, eat: -1, stretch: -2, legUp: 3, knead: 2 };

  // a pixel heart with an outline; fill is 0, 0.5 or 1
  const GLYPH = ["01100110", "11111111", "11111111", "01111110", "00111100", "00011000"];
  function heart(fill) {
    const on = (x, y) => y >= 0 && y < 6 && x >= 0 && x < 8 && GLYPH[y][x] === "1";
    let r = "";
    for (let y = -1; y <= 6; y++) for (let x = -1; x <= 8; x++) {
      if (on(x, y)) {
        const lit = fill >= 1 || (fill >= 0.5 && x < 4), hi = lit && y === 1 && (x === 1 || x === 2);
        r += `<rect x="${x + 1}" y="${y + 1}" width="1" height="1" class="${hi ? "hi" : lit ? "on" : "off"}"/>`;
      } else if (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1)) r += `<rect x="${x + 1}" y="${y + 1}" width="1" height="1" class="ol"/>`;
    }
    return `<svg class="px-heart" viewBox="0 0 10 8" aria-hidden="true">${r}</svg>`;
  }

  function create(world, opts = {}) {
    const root = document.createElement("div");
    root.className = "cc ui"; root.hidden = true;
    root.innerHTML = `
      <div class="cc-tabs"></div>
      <div class="cc-card" role="dialog">
        <button class="cc-x" type="button" data-title="close">×</button>
        <div class="cc-head">
          <div class="cc-portrait"><canvas width="100" height="100"></canvas></div>
          <div class="cc-id">
            <div class="cc-namebox"><span class="cc-name"></span><button class="cc-mini cc-edit" type="button" data-title="rename">✎</button></div>
            <form class="cc-rename" hidden><input maxlength="14" spellcheck="false" autocomplete="off"><button class="cc-mini cc-dice" type="button" data-title="dice">🎲</button><button class="cc-mini" type="submit" data-title="ok">✓</button></form>
            <div class="cc-sub"></div>
            <div class="cc-stage"></div>
          </div>
        </div>
        <div class="cc-banner" hidden></div>
        <div class="cc-body">
          <section class="cc-sec"><div class="cc-label"><span data-l="love"></span><small class="cc-mood"></small></div><div class="cc-hearts"></div></section>
          <section class="cc-sec"><div class="cc-label"><span data-l="growth"></span><small class="cc-next"></small></div><div class="cc-grow"><i></i></div><div class="cc-steps"></div></section>
          <section class="cc-sec"><div class="cc-label"><span data-l="traits"></span></div><div class="cc-chips"></div></section>
          <section class="cc-sec"><label class="cc-toggle"><input type="checkbox"><span class="cc-switch"></span><span data-t="showName"></span></label></section>
          <section class="cc-sec cc-actions">
            <button class="cc-btn" type="button" data-a="pet" style="--b:#ffe1ea"></button>
            <button class="cc-btn" type="button" data-a="feed" style="--b:#fff1b8"></button>
            <button class="cc-btn" type="button" data-a="play" style="--b:#d8f3e6"></button>
          </section>
          <section class="cc-sec cc-log"><div class="cc-label"><span data-l="diary"></span></div><ol></ol></section>
        </div>
        <div class="cc-foot"><span class="cc-born"></span><span class="cc-lang"><button type="button" data-lang="tr">TR</button>·<button type="button" data-lang="en">EN</button></span></div>
      </div>`;
    document.body.appendChild(root);
    const q = (s) => root.querySelector(s);
    const cv = q(".cc-portrait canvas"), pg = cv.getContext("2d");
    const form = q(".cc-rename"), input = form.querySelector("input");

    let cat = null, raf = 0, last = 0, pt = 0, blinkT = 2, blink = false, lastLove = null, logKey = "", tabKey = "", tickT = 0;
    const T = () => L.STR[L.lang];

    // ------------------------------------------------ drawing
    function drawPortrait(now) {
      const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now; pt += dt;
      blinkT -= dt; if (blinkT <= 0) { blink = !blink; blinkT = blink ? 0.14 : 2 + Math.random() * 3; }
      if (cat) {
        const pose = POSE_OF[cat.state] || "sit";
        pg.clearRect(0, 0, cv.width, cv.height);
        DC.portrait(pg, cat.coat, { pose, t: pt, blink, eyes: cat.state === "happy" ? "happy" : null, scale: 2, dx: DX[pose] ?? 4, dy: 3 });
        tickT += dt; if (tickT > 1) { tickT = 0; update(); }
      }
      raf = requestAnimationFrame(drawPortrait);
    }
    function renderTabs() {
      const key = world.cats.map((c) => c.profile && c.profile.id + c.coat).join() + (cat && cat.profile.id);
      if (key === tabKey) return; tabKey = key;
      const box = q(".cc-tabs"); box.innerHTML = "";
      world.cats.filter((c) => c.profile).forEach((c) => {
        const b = document.createElement("button"); b.type = "button"; b.className = "cc-tab" + (c === cat ? " on" : ""); b.title = c.profile.name;
        const k = document.createElement("canvas"); k.width = 46; k.height = 46; b.appendChild(k);
        DC.portrait(k.getContext("2d"), c.coat, { scale: 1, dx: 4, dy: 2 });
        b.onclick = () => api.open(c);
        box.appendChild(b);
      });
      const add = document.createElement("button"); add.type = "button"; add.className = "cc-tab add"; add.textContent = "+"; add.title = T().adopt;
      add.onclick = () => { if (opts.onAdopt) opts.onAdopt(); };
      box.appendChild(add);
    }
    function update() {
      if (!cat || !cat.profile) return;
      if (!world.cats.includes(cat)) { const next = world.cats.find((c) => c.profile); return next ? api.open(next) : api.close(); }
      const p = cat.profile, t = T(), now = Date.now(), lang = L.lang;
      root.style.setProperty("--tint", tint(DC.COATS[p.coat].body, 0.72));
      root.querySelectorAll("[data-t]").forEach((el) => { el.textContent = t[el.dataset.t]; });
      root.querySelectorAll("[data-title]").forEach((el) => { el.title = t[el.dataset.title]; });
      const icons = { love: "💗", growth: "🌱", traits: "✨", diary: "📖" };
      root.querySelectorAll("[data-l]").forEach((el) => { el.textContent = `${icons[el.dataset.l]} ${t[el.dataset.l]}`; });
      q(".cc-name").textContent = p.name;
      const days = Math.floor((now - p.born) / 864e5);
      q(".cc-sub").textContent = `${L.COAT_NAMES[p.coat] ? L.COAT_NAMES[p.coat][lang] : p.coat} · ${t.age(days)}`;
      const st = L.stage(p.xp); q(".cc-stage").textContent = `${st.e} ${st[lang]}`;
      // love
      const hearts = Array.from({ length: 10 }, (_, i) => { const f = clamp((p.love - i * 10) / 10, 0, 1); return heart(f >= 0.9 ? 1 : f >= 0.4 ? 0.5 : 0); }).join("");
      const hb = q(".cc-hearts"); if (hb.dataset.v !== hearts) { hb.innerHTML = hearts; hb.dataset.v = hearts; }
      if (lastLove != null && p.love > lastLove + 0.5) { hb.classList.remove("bump"); void hb.offsetWidth; hb.classList.add("bump"); }
      lastLove = p.love;
      q(".cc-mood").textContent = t.mood(p.love);
      // growing up
      q(".cc-grow > i").style.width = `${clamp(p.xp / L.ADULT * 100, 3, 100)}%`;
      const nx = L.nextStage(p.xp); q(".cc-next").textContent = nx ? t.toNext(Math.ceil(nx.min - p.xp)) : t.grownUp;
      q(".cc-steps").innerHTML = L.STAGES.map((s) => `<span class="${p.xp >= s.min ? "on" : ""}" style="left:${s.min / L.ADULT * 100}%" title="${esc(s[lang])}">${s.e}</span>`).join("");
      // personality
      q(".cc-chips").innerHTML = p.traits.map((k, i) => `<span class="cc-chip" style="--c:${CHIP[(i * 2 + p.id.charCodeAt(0)) % CHIP.length]}">${L.TRAITS[k].e} ${esc(L.TRAITS[k][lang])}</span>`).join("")
        + `<span class="cc-chip fav">${L.TOYS[p.fav].e} ${esc(t.fav)}: ${esc(L.TOYS[p.fav][lang])}</span>`;
      q(".cc-toggle input").checked = !!p.showName;
      q('[data-a="pet"]').textContent = `💗 ${t.pet}`; q('[data-a="feed"]').textContent = `🍗 ${t.feed}`; q('[data-a="play"]').textContent = `🧶 ${t.play}`;
      // diary (only rebuilt when something changed, so scrolling isn't disturbed)
      const key = lang + p.log.length + (p.log[0] ? p.log[0].t : 0) + Math.floor(now / 60e3);
      if (key !== logKey) {
        const fresh = logKey && p.log[0] && now - p.log[0].t < 3000;
        logKey = key;
        q(".cc-log ol").innerHTML = p.log.length
          ? p.log.slice(0, 40).map((e, i) => `<li class="${fresh && i === 0 ? "new" : ""}"><span class="ico">${L.icon(e)}</span><span>${esc(L.text(e))}</span><time>${esc(t.ago(now - e.t))}</time></li>`).join("")
          : `<li class="empty">${esc(t.empty)}</li>`;
      }
      q(".cc-born").textContent = t.born(new Date(p.born).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-GB", { day: "numeric", month: "long", year: "numeric" }));
      root.querySelectorAll("[data-lang]").forEach((b) => b.classList.toggle("on", b.dataset.lang === lang));
      renderTabs();
    }
    function place() {
      const cw = root.offsetWidth || 356, ch = root.offsetHeight || 620;
      const head = cat.y - 46 * cat.s;
      let left, top;
      if (head - ch - 14 >= 12) { left = cat.x - cw / 2; top = head - ch - 14; }
      else {
        // not enough room above the cat: sit beside it instead
        left = cat.x + 70 + cw < innerWidth - 12 ? cat.x + 70 : cat.x - 70 - cw;
        top = Math.max(12, Math.min(innerHeight - ch - 12, head - ch * 0.6));
      }
      root.style.left = `${Math.round(clamp(left, 12, innerWidth - cw - 12))}px`;
      root.style.top = `${Math.round(clamp(top, 12, Math.max(12, innerHeight - root.offsetHeight - 12)))}px`;
    }
    function floatUp(emoji, el) {
      const r = el.getBoundingClientRect(), rr = root.getBoundingClientRect();
      for (let i = 0; i < 4; i++) {
        const f = document.createElement("span"); f.className = "cc-float"; f.textContent = emoji;
        f.style.left = `${r.left - rr.left + r.width / 2 - 10 + (Math.random() - 0.5) * 30}px`; f.style.top = `${r.top - rr.top - 6}px`;
        f.style.setProperty("--dx", `${(Math.random() - 0.5) * 40}px`); f.style.setProperty("--r", `${(Math.random() - 0.5) * 40}deg`);
        f.style.animationDelay = `${i * 0.08}s`; root.appendChild(f); setTimeout(() => f.remove(), 1400);
      }
    }
    function startRename(naming) {
      form.hidden = false; q(".cc-namebox").hidden = true; input.value = cat.profile.name;
      const b = q(".cc-banner"); b.hidden = !naming; if (naming) b.textContent = `🐣 ${T().newKitten}`;
      setTimeout(() => { input.focus(); input.select(); }, 30);
    }
    function endRename(saveIt) {
      if (saveIt) L.rename(cat, input.value);
      form.hidden = true; q(".cc-namebox").hidden = false; q(".cc-banner").hidden = true; tabKey = ""; update();
    }

    // ------------------------------------------------ wiring
    q(".cc-x").onclick = () => api.close();
    q(".cc-edit").onclick = () => startRename(false);
    q(".cc-name").onclick = () => startRename(false);
    q(".cc-dice").onclick = () => { input.value = L.randomName(world.cats.map((c) => c.profile && c.profile.name)); input.focus(); };
    form.onsubmit = (e) => { e.preventDefault(); endRename(true); };
    input.onkeydown = (e) => { if (e.key === "Escape") { e.stopPropagation(); endRename(false); } };
    q(".cc-toggle input").onchange = (e) => { cat.profile.showName = e.target.checked; L.changed(); };
    q('[data-a="pet"]').onclick = (e) => { cat.pet(); floatUp("💗", e.currentTarget); q(".cc-portrait").classList.remove("bounce"); void cv.offsetWidth; q(".cc-portrait").classList.add("bounce"); update(); };
    q('[data-a="feed"]').onclick = (e) => { world.feed(); floatUp("🍗", e.currentTarget); };
    q('[data-a="play"]').onclick = (e) => { world.throwYarn(clamp(cat.x + (Math.random() - 0.5) * 300, 40, world.W - 40), world.floor - 220); floatUp("🧶", e.currentTarget); };
    root.querySelectorAll("[data-lang]").forEach((b) => b.onclick = () => { L.lang = b.dataset.lang; logKey = ""; tabKey = ""; update(); if (opts.onLang) opts.onLang(L.lang); });
    addEventListener("keydown", (e) => { if (e.key === "Escape" && !root.hidden) api.close(); });

    const api = {
      el: root,
      get cat() { return cat; },
      get isOpen() { return !root.hidden; },
      open(c, o = {}) {
        if (!c || !c.profile) return;
        const wasOpen = !root.hidden, same = c === cat;
        cat = c; lastLove = null; logKey = ""; tabKey = "";
        root.hidden = false; form.hidden = true; q(".cc-namebox").hidden = false; q(".cc-banner").hidden = true;
        update();
        if (!wasOpen || !same) { if (!wasOpen) { const card = q(".cc-card"); card.style.animation = "none"; void card.offsetWidth; card.style.animation = ""; } place(); }
        if (o.naming) startRename(true);
        if (!raf) { last = performance.now(); raf = requestAnimationFrame(drawPortrait); }
      },
      close() { root.hidden = true; cancelAnimationFrame(raf); raf = 0; if (opts.onClose) opts.onClose(); },
      refresh() { if (!root.hidden) update(); },
    };
    return api;
  }

  window.CatCard = { create };
})();
