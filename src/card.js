/* Desktop Cat — the cat card: who they are, how they're doing, what they're wearing and what they've been up to. */
(() => {
  "use strict";
  const L = window.CatLife, DC = window.DesktopCat, W = DC.WARDROBE;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const tint = (hex, t) => `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).map((v) => Math.round(v + (255 - v) * t)).join(",")})`;
  const CHIP = ["#ffe1ea", "#d8f3e6", "#e4dcff", "#fff1b8", "#dcefff"];
  const POSE_OF = { sleep: "sleep", knead: "knead", groom: "groom", washFace: "washFace", lickFlank: "lickFlank", legUp: "legUp", roll: "roll", nip: "roll", eat: "eat", yawn: "yawn", stretch: "stretch", happy: "sit" };
  const DX = { sleep: -1, roll: -3, eat: -1, stretch: -2, legUp: 3, knead: 2 };
  const SIZES = [0.56, 0.66, 0.78, 0.9, 1];
  const KINDS = { hat: "🎩", collar: "🎀", outfit: "👕" };
  // where to look when showing a thumbnail of each kind of thing: the head, the neck, the whole cat
  const THUMB = { hat: { scale: 2, dx: -5, dy: 9 }, collar: { scale: 2, dx: -4, dy: 1 }, outfit: { scale: 1, dx: 4, dy: 2 } };

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
    root.innerHTML = `<div class="cc-z">
      <div class="cc-tabs"></div>
      <div class="cc-card" role="dialog">
        <button class="cc-x" type="button" data-title="close">×</button>
        <div class="cc-head">
          <div class="cc-portrait"><canvas width="100" height="100"></canvas></div>
          <div class="cc-id">
            <div class="cc-namebox"><span class="cc-name"></span><button class="cc-mini cc-edit" type="button" data-title="rename">✎</button></div>
            <form class="cc-rename" hidden><input maxlength="14" spellcheck="false" autocomplete="off"><button class="cc-mini cc-dice" type="button" data-title="dice">🎲</button><button class="cc-mini" type="submit" data-title="ok">✓</button></form>
            <div class="cc-sub"></div>
            <div class="cc-badges"><span class="cc-stage"></span><span class="cc-bday" hidden>🎂</span></div>
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
            <button class="cc-btn" type="button" data-a="photo" style="--b:#dcefff"></button>
          </section>
          <section class="cc-sec cc-ward">
            <div class="cc-label"><span data-l="wardrobe"></span><small class="cc-wearing"></small></div>
            <div class="cc-kinds"></div>
            <div class="cc-designs"></div>
            <div class="cc-swatches"></div>
            <div class="cc-wbtns"><button class="cc-pill" type="button" data-w="surprise"></button><button class="cc-pill" type="button" data-w="undress"></button></div>
          </section>
          <section class="cc-sec cc-log"><div class="cc-label"><span data-l="diary"></span></div><ol></ol></section>
          <section class="cc-sec cc-danger">
            <button class="cc-link" type="button" data-r="ask"></button>
            <div class="cc-confirm" hidden><span></span><button class="cc-pill red" type="button" data-r="yes"></button><button class="cc-pill" type="button" data-r="no"></button></div>
          </section>
        </div>
        <div class="cc-foot">
          <span class="cc-born"></span>
          <span class="cc-tools"><button class="cc-pin" type="button" data-title="pin" hidden>📍</button><button class="cc-snd" type="button" data-title="sound" hidden>🔊</button><span class="cc-sizer" title=""><button type="button" data-z="-1">−</button><b>🔍</b><button type="button" data-z="1">+</button></span>
          <span class="cc-lang"><button type="button" data-lang="tr">TR</button>·<button type="button" data-lang="en">EN</button></span></span>
        </div>
        <div class="cc-flash"></div>
      </div></div>`;
    document.body.appendChild(root);
    const q = (s) => root.querySelector(s);
    const cv = q(".cc-portrait canvas"), pg = cv.getContext("2d");
    const form = q(".cc-rename"), input = form.querySelector("input");

    let cat = null, raf = 0, last = 0, pt = 0, blinkT = 2, blink = false, lastLove = null, logKey = "", tabKey = "", tickT = 0;
    let kind = "hat", design = null, wardKey = "", size = SIZES.includes(opts.size) ? opts.size : 0.66;
    // where you've put the card: null = follow the cat; { x, y, up } = left edge, and the top (or bottom when "up") edge
    let pinned = opts.pos && Number.isFinite(opts.pos.x) ? opts.pos : null;
    const T = () => L.STR[L.lang];
    const setSize = (z) => { size = z; root.style.setProperty("--z", z); };
    setSize(size);

    // ------------------------------------------------ drawing
    function drawPortrait(now) {
      const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now; pt += dt;
      blinkT -= dt; if (blinkT <= 0) { blink = !blink; blinkT = blink ? 0.14 : 2 + Math.random() * 3; }
      if (cat) {
        const pose = POSE_OF[cat.state] || "sit";
        pg.clearRect(0, 0, cv.width, cv.height);
        DC.portrait(pg, cat.coat, { pose, t: pt, blink, eyes: cat.state === "happy" ? "happy" : null, scale: 2, dx: DX[pose] ?? 4, dy: 3, acc: cat.wearing() });
        tickT += dt; if (tickT > 1) { tickT = 0; update(); }
      }
      raf = requestAnimationFrame(drawPortrait);
    }
    function renderTabs() {
      const key = world.cats.map((c) => c.profile && c.profile.id + JSON.stringify(c.profile.acc || {})).join() + (cat && cat.profile.id);
      if (key === tabKey) return; tabKey = key;
      const box = q(".cc-tabs"); box.innerHTML = "";
      world.cats.filter((c) => c.profile).forEach((c) => {
        const b = document.createElement("button"); b.type = "button"; b.className = "cc-tab" + (c === cat ? " on" : ""); b.title = c.profile.name;
        const k = document.createElement("canvas"); k.width = 46; k.height = 46; b.appendChild(k);
        DC.portrait(k.getContext("2d"), c.coat, { scale: 1, dx: 4, dy: 2, acc: c.wearing() });
        b.onclick = () => api.open(c);
        box.appendChild(b);
      });
      const add = document.createElement("button"); add.type = "button"; add.className = "cc-tab add"; add.textContent = "+"; add.title = T().adopt;
      add.onclick = () => { if (opts.onAdopt) opts.onAdopt(); };
      box.appendChild(add);
    }
    // ------------------------------------------------ the wardrobe: pick a kind, a design, then a colour
    const worn = (k) => (cat.profile.acc || {})[k] || null;
    function renderWardrobe() {
      const t = T(), lang = L.lang, cur = worn(kind), curD = cur ? cur.split(":")[0] : null, curS = cur ? cur.split(":")[1] : null;
      if (!design) design = curD || Object.keys(W[kind])[0];
      const key = [lang, kind, design, cat.coat, JSON.stringify(cat.profile.acc || {})].join("|");
      if (key === wardKey) return; wardKey = key;
      q(".cc-kinds").innerHTML = Object.keys(KINDS).map((k) => `<button type="button" class="cc-kind${k === kind ? " on" : ""}" data-k="${k}">${KINDS[k]} ${esc(t[k])} <small>100</small></button>`).join("");
      // design thumbnails: the cat wearing each one (in the colour it has on, or the first colour)
      const box = q(".cc-designs"); box.innerHTML = "";
      const none = document.createElement("button"); none.type = "button"; none.className = "cc-design none" + (!cur ? " on" : ""); none.title = t.none; none.textContent = "⦸";
      none.onclick = () => wear(null); box.appendChild(none);
      Object.keys(W[kind]).forEach((d) => {
        const b = document.createElement("button"); b.type = "button";
        b.className = "cc-design" + (d === curD ? " on" : "") + (d === design && d !== curD ? " pick" : ""); b.title = W[kind][d][lang];
        const k = document.createElement("canvas"); k.width = 44; k.height = 44; b.appendChild(k);
        const acc = { ...(cat.profile.acc || {}) }; acc[kind] = `${d}:${d === curD && curS ? curS : "cherry"}`;
        if (kind !== "outfit") delete acc.outfit;
        DC.portrait(k.getContext("2d"), cat.coat, { ...THUMB[kind], acc });
        b.onclick = () => { design = d; wear(`${d}:${d === curD && curS ? curS : (curS || "cherry")}`); };
        box.appendChild(b);
      });
      q(".cc-swatches").innerHTML = Object.entries(W.schemes).map(([k, sc]) =>
        `<button type="button" class="cc-swatch${design === curD && k === curS ? " on" : ""}" data-s="${k}" title="${esc(sc[lang])}" style="--a:${sc.c[0]};--b:${sc.c[1]};--c:${sc.c[2]}"></button>`).join("");
      const a = cat.profile.acc || {}, names = ["hat", "collar", "outfit"].map((k) => a[k] && L.itemName(k, a[k])).filter(Boolean);
      q(".cc-wearing").textContent = names.length ? names.join(" · ") : t.nothingOn;
    }
    function wear(id, k = kind) {
      const p = cat.profile; p.acc = { ...(p.acc || {}) };
      if (id) p.acc[k] = id; else delete p.acc[k];
      if (id) L.care(cat, "dress", { kind: k, item: id });
      wardKey = ""; tabKey = ""; L.changed(); update();
    }

    function update() {
      if (!cat || !cat.profile) return;
      if (!world.cats.includes(cat)) { const next = world.cats.find((c) => c.profile); return next ? api.open(next) : api.close(); }
      const p = cat.profile, t = T(), now = Date.now(), lang = L.lang;
      root.style.setProperty("--tint", tint(DC.COATS[p.coat].body, 0.72));
      root.querySelectorAll("[data-t]").forEach((el) => { el.textContent = t[el.dataset.t]; });
      root.querySelectorAll("[data-title]").forEach((el) => { el.title = t[el.dataset.title]; });
      const snd = q(".cc-snd"); snd.hidden = !opts.sound;
      if (opts.sound) { const on = opts.sound(); snd.textContent = on ? "🔊" : "🔇"; snd.classList.toggle("off", !on); snd.title = on ? t.soundOff : t.soundOn; }
      const icons = { love: "💗", growth: "🌱", traits: "✨", diary: "📖", wardrobe: "👗" };
      root.querySelectorAll("[data-l]").forEach((el) => { el.textContent = `${icons[el.dataset.l]} ${t[el.dataset.l]}`; });
      q(".cc-name").textContent = p.name;
      const days = Math.floor((now - p.born) / 864e5);
      q(".cc-sub").textContent = `${L.COAT_NAMES[p.coat] ? L.COAT_NAMES[p.coat][lang] : p.coat} · ${t.age(days)}`;
      const st = L.stage(p.xp); q(".cc-stage").textContent = `${st.e} ${st[lang]}`;
      const bd = q(".cc-bday"); bd.hidden = !L.isBirthday(p); bd.title = t.birthdayToday;
      const hearts = Array.from({ length: 10 }, (_, i) => { const f = clamp((p.love - i * 10) / 10, 0, 1); return heart(f >= 0.9 ? 1 : f >= 0.4 ? 0.5 : 0); }).join("");
      const hb = q(".cc-hearts"); if (hb.dataset.v !== hearts) { hb.innerHTML = hearts; hb.dataset.v = hearts; }
      if (lastLove != null && p.love > lastLove + 0.5) { hb.classList.remove("bump"); void hb.offsetWidth; hb.classList.add("bump"); }
      lastLove = p.love;
      q(".cc-mood").textContent = t.mood(p.love);
      q(".cc-grow > i").style.width = `${clamp(p.xp / L.ADULT * 100, 3, 100)}%`;
      const nx = L.nextStage(p.xp); q(".cc-next").textContent = nx ? t.toNext(Math.ceil(nx.min - p.xp)) : t.grownUp;
      q(".cc-steps").innerHTML = L.STAGES.map((s) => `<span class="${p.xp >= s.min ? "on" : ""}" style="left:${s.min / L.ADULT * 100}%" title="${esc(s[lang])}">${s.e}</span>`).join("");
      q(".cc-chips").innerHTML = p.traits.map((k, i) => `<span class="cc-chip" style="--c:${CHIP[(i * 2 + p.id.charCodeAt(0)) % CHIP.length]}">${L.TRAITS[k].e} ${esc(L.TRAITS[k][lang])}</span>`).join("")
        + `<span class="cc-chip fav">${L.TOYS[p.fav].e} ${esc(t.fav)}: ${esc(L.TOYS[p.fav][lang])}</span>`;
      q(".cc-toggle input").checked = !!p.showName;
      q('[data-a="pet"]').textContent = `💗 ${t.pet}`; q('[data-a="feed"]').textContent = `🍗 ${t.feed}`;
      q('[data-a="play"]').textContent = `🧶 ${t.play}`; q('[data-a="photo"]').textContent = `📸 ${t.photo}`;
      q('[data-w="surprise"]').textContent = `🎲 ${t.surprise}`; q('[data-w="undress"]').textContent = `✖ ${t.undress}`;
      renderWardrobe();
      const key = lang + p.log.length + (p.log[0] ? p.log[0].t : 0) + Math.floor(now / 60e3);
      if (key !== logKey) {
        const fresh = logKey && p.log[0] && now - p.log[0].t < 3000;
        logKey = key;
        q(".cc-log ol").innerHTML = p.log.length
          ? p.log.slice(0, 40).map((e, i) => `<li class="${fresh && i === 0 ? "new" : ""}"><span class="ico">${L.icon(e)}</span><span>${esc(L.text(e))}</span><time>${esc(t.ago(now - e.t))}</time></li>`).join("")
          : `<li class="empty">${esc(t.empty)}</li>`;
      }
      q('[data-r="ask"]').textContent = `🧳 ${t.remove}`;
      q(".cc-confirm span").textContent = t.removeQ(p.name); q('[data-r="yes"]').textContent = t.yes; q('[data-r="no"]').textContent = t.no;
      q(".cc-born").textContent = t.born(new Date(p.born).toLocaleDateString(lang === "tr" ? "tr-TR" : "en-GB", { day: "numeric", month: "long", year: "numeric" }));
      q(".cc-sizer").title = t.size;
      root.querySelectorAll("[data-lang]").forEach((b) => b.classList.toggle("on", b.dataset.lang === lang));
      renderTabs();
    }
    // Either right above the cat (until you move it), or wherever you dragged it. Put it in the lower half of
    // the screen and it hangs from its bottom edge: the avatars go underneath and the card opens upwards.
    function place() {
      const card = q(".cc-card"), tabsH = () => q(".cc-tabs").getBoundingClientRect().height;
      card.style.removeProperty("--maxh");
      root.classList.toggle("up", !!(pinned && pinned.up));
      q(".cc-pin").hidden = !pinned;
      if (pinned) {
        const room = pinned.up ? pinned.y - 12 : innerHeight - pinned.y - 12;
        let r = root.getBoundingClientRect();
        if (r.height > room && room > 140) { card.style.setProperty("--maxh", `${Math.floor((room - tabsH()) / size)}px`); r = root.getBoundingClientRect(); }
        root.style.left = `${Math.round(clamp(pinned.x, 6, innerWidth - r.width - 6))}px`;
        if (pinned.up) { root.style.top = "auto"; root.style.bottom = `${Math.round(clamp(innerHeight - pinned.y, 6, innerHeight - r.height - 6))}px`; }
        else { root.style.bottom = "auto"; root.style.top = `${Math.round(clamp(pinned.y, 6, Math.max(6, innerHeight - r.height - 6)))}px`; }
        return;
      }
      root.style.bottom = "auto";
      let r = root.getBoundingClientRect();
      const head = cat.y - 44 * cat.s, room = head - 14 - 12;
      if (r.height > room && room > 160) { card.style.setProperty("--maxh", `${Math.floor((room - tabsH()) / size)}px`); r = root.getBoundingClientRect(); }
      root.style.left = `${Math.round(clamp(cat.x - r.width / 2, 12, innerWidth - r.width - 12))}px`;
      root.style.top = `${Math.round(clamp(head - 14 - r.height, 12, Math.max(12, innerHeight - r.height - 12)))}px`;
    }
    // drag the card by its avatar strip or its header
    let drag = null, swallowClick = false;
    root.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      const onTabs = e.target.closest(".cc-tabs"), onHead = e.target.closest(".cc-head") && !e.target.closest("button, input, form, .cc-name");
      if (!onTabs && !onHead) return;
      const r = root.getBoundingClientRect();
      drag = { sx: e.clientX, sy: e.clientY, l: r.left, t: r.top, moved: false, id: e.pointerId };
    });
    addEventListener("pointermove", (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
      if (!drag.moved && Math.hypot(dx, dy) < 5) return;
      if (!drag.moved) { drag.moved = true; root.classList.add("dragging"); root.style.bottom = "auto"; root.classList.remove("up"); try { root.setPointerCapture(drag.id); } catch {} }
      const r = root.getBoundingClientRect();
      root.style.left = `${Math.round(clamp(drag.l + dx, 6 - r.width * 0.6, innerWidth - r.width * 0.4))}px`;
      root.style.top = `${Math.round(clamp(drag.t + dy, 0, innerHeight - 40))}px`;
    });
    addEventListener("pointerup", () => {
      if (!drag) return;
      const d = drag; drag = null;
      if (!d.moved) return;
      root.classList.remove("dragging"); swallowClick = true; setTimeout(() => { swallowClick = false; }, 0);
      const r = root.getBoundingClientRect(), up = r.top + r.height / 2 > innerHeight / 2;
      pinned = { x: Math.round(r.left), y: Math.round(up ? Math.min(r.bottom, innerHeight - 6) : Math.max(r.top, 6)), up };
      place(); if (opts.onPos) opts.onPos(pinned);
    });
    root.addEventListener("click", (e) => { if (swallowClick) { e.stopPropagation(); e.preventDefault(); swallowClick = false; } }, true);
    q(".cc-snd").onclick = () => { if (opts.onSound) opts.onSound(); };
    q(".cc-pin").onclick = () => { pinned = null; place(); if (opts.onPos) opts.onPos(null); };
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

    // a polaroid of the cat, saved as a PNG
    async function photo() {
      const p = cat.profile, t = T(), lang = L.lang;
      try { await Promise.all([document.fonts.load('700 40px "Pixelify Sans"'), document.fonts.load('800 22px "Nunito"')]); } catch {}
      const c = document.createElement("canvas"); c.width = 600; c.height = 740; const g = c.getContext("2d");
      g.fillStyle = "#fffdf8"; g.fillRect(0, 0, 600, 740);
      g.fillStyle = tint(DC.COATS[p.coat].body, 0.7); g.fillRect(30, 30, 540, 540);
      g.fillStyle = "rgba(255,255,255,.5)";
      for (let y = 40; y < 570; y += 28) for (let x = 40 + ((y / 28) % 2) * 14; x < 570; x += 28) { g.beginPath(); g.arc(x, y, 4, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = "rgba(91,58,41,.12)"; g.fillRect(30, 470, 540, 100);
      g.fillStyle = "rgba(0,0,0,.18)"; g.beginPath(); g.ellipse(300, 478, 170, 18, 0, 0, Math.PI * 2); g.fill();
      const k = document.createElement("canvas"); k.width = 540; k.height = 540; const kg = k.getContext("2d");
      const pose = POSE_OF[cat.state] || "sit";
      DC.portrait(kg, cat.coat, { pose, t: pt, eyes: cat.state === "sleep" ? null : "happy", scale: 10, dx: DX[pose] ?? 4, dy: 3, acc: cat.wearing() });
      g.drawImage(k, 30, 20);
      g.strokeStyle = "#5b3a29"; g.lineWidth = 4; g.strokeRect(30, 30, 540, 540);
      g.fillStyle = "#5b3a29"; g.textAlign = "center";
      g.font = '700 46px "Pixelify Sans", monospace'; g.fillText(p.name, 300, 640);
      const date = new Date().toLocaleDateString(lang === "tr" ? "tr-TR" : "en-GB", { day: "numeric", month: "long", year: "numeric" });
      g.font = '800 22px "Nunito", sans-serif'; g.globalAlpha = 0.75; g.fillText(`${date} · ${L.stage(p.xp)[lang]}`, 300, 684); g.globalAlpha = 1;
      g.fillStyle = "#ff6f91"; GLYPH.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === "1") { g.fillRect(520 + x * 4, 690 + y * 4, 4, 4); g.fillRect(48 + x * 4, 690 + y * 4, 4, 4); } }));
      const flash = q(".cc-flash"); flash.classList.remove("go"); void flash.offsetWidth; flash.classList.add("go");
      c.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
        a.download = `${p.name}-${new Date().toISOString().slice(0, 10)}.png`; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      }, "image/png");
      L.care(cat, "photo"); update();
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
    q('[data-a="photo"]').onclick = (e) => { floatUp("📸", e.currentTarget); photo(); };
    q(".cc-kinds").onclick = (e) => { const b = e.target.closest("[data-k]"); if (!b) return; kind = b.dataset.k; const cur = worn(kind); design = cur ? cur.split(":")[0] : null; wardKey = ""; renderWardrobe(); };
    q(".cc-swatches").onclick = (e) => { const b = e.target.closest("[data-s]"); if (b) wear(`${design}:${b.dataset.s}`); };
    q('[data-w="surprise"]').onclick = (e) => {
      const p = cat.profile, pickK = (o) => { const ks = Object.keys(o); return ks[Math.floor(Math.random() * ks.length)]; };
      p.acc = {};
      for (const k of ["hat", "collar", "outfit"]) if (Math.random() < 0.75) p.acc[k] = `${pickK(W[k])}:${pickK(W.schemes)}`;
      if (!Object.keys(p.acc).length) p.acc.hat = `${pickK(W.hat)}:${pickK(W.schemes)}`;
      L.care(cat, "dress", { kind: Object.keys(p.acc)[0], item: Object.values(p.acc)[0] });
      design = p.acc[kind] ? p.acc[kind].split(":")[0] : null; wardKey = ""; tabKey = ""; L.changed(); update(); floatUp("✨", e.currentTarget);
    };
    q('[data-w="undress"]').onclick = () => { cat.profile.acc = {}; design = null; wardKey = ""; tabKey = ""; L.changed(); update(); };
    q('[data-r="ask"]').onclick = () => { q(".cc-confirm").hidden = false; q('[data-r="ask"]').hidden = true; };
    q('[data-r="no"]').onclick = () => { q(".cc-confirm").hidden = true; q('[data-r="ask"]').hidden = false; };
    q('[data-r="yes"]').onclick = () => { const c = cat; q(".cc-confirm").hidden = true; q('[data-r="ask"]').hidden = false; if (opts.onRemove) opts.onRemove(c); };
    root.querySelectorAll("[data-z]").forEach((b) => b.onclick = () => {
      const i = clamp(SIZES.indexOf(size) + Number(b.dataset.z), 0, SIZES.length - 1); setSize(SIZES[i]); if (opts.onSize) opts.onSize(size);
      requestAnimationFrame(place);
    });
    addEventListener("resize", () => { if (!root.hidden) place(); });
    root.querySelectorAll("[data-lang]").forEach((b) => b.onclick = () => { L.lang = b.dataset.lang; logKey = ""; tabKey = ""; wardKey = ""; update(); if (opts.onLang) opts.onLang(L.lang); });
    addEventListener("keydown", (e) => { if (e.key === "Escape" && !root.hidden) api.close(); });

    const api = {
      el: root,
      get cat() { return cat; },
      get isOpen() { return !root.hidden; },
      open(c, o = {}) {
        if (!c || !c.profile) return;
        const wasOpen = !root.hidden, same = c === cat;
        cat = c; lastLove = null; logKey = ""; tabKey = ""; wardKey = "";
        if (!same) { const cur = worn(kind); design = cur ? cur.split(":")[0] : null; }
        root.hidden = false; form.hidden = true; q(".cc-namebox").hidden = false; q(".cc-banner").hidden = true;
        q(".cc-confirm").hidden = true; q('[data-r="ask"]').hidden = false;
        update();
        if (!wasOpen || !same) { if (!wasOpen) { const card = q(".cc-card"); card.style.animation = "none"; void card.offsetWidth; card.style.animation = ""; } requestAnimationFrame(place); }
        if (o.naming) startRename(true);
        if (!raf) { last = performance.now(); raf = requestAnimationFrame(drawPortrait); }
      },
      close() { root.hidden = true; cancelAnimationFrame(raf); raf = 0; if (opts.onClose) opts.onClose(); },
      refresh() { if (!root.hidden) update(); },
      get size() { return size; },
    };
    return api;
  }

  window.CatCard = { create };
})();
