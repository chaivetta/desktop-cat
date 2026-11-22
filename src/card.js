/* Desktop Cat — the cat card: who they are, how they're doing, what they're wearing and what they've been up to. */
(() => {
  "use strict";
  const L = window.CatLife, DC = window.DesktopCat, W = DC.WARDROBE;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const tint = (hex, t) => `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).map((v) => Math.round(v + (255 - v) * t)).join(",")})`;
  const CHIP = ["#ffe1ea", "#d8f3e6", "#e4dcff", "#fff1b8", "#dcefff"];
  const POSE_OF = { sleep: "sleep", knead: "knead", groom: "groom", washFace: "washFace", lickFlank: "lickFlank", legUp: "legUp", roll: "roll", nip: "roll", eat: "eat", yawn: "yawn", stretch: "stretch", happy: "sit", loaf: "loaf", sploot: "sploot", meerkat: "meerkat", tailChase: "tailChase", pronk: "pronk", slowBlink: "slowBlink" };
  const DX = { sploot: -2, tailChase: -1, meerkat: 3, loaf: -1, sleep: -1, roll: -3, eat: -1, stretch: -2, legUp: 3, knead: 2 };
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
        <div class="cc-panes" role="tablist">
          <button type="button" role="tab" data-p="cat"></button><button type="button" role="tab" data-p="tasks"></button><button type="button" role="tab" data-p="ward"></button><button type="button" role="tab" data-p="log"></button><button type="button" role="tab" data-p="mem"></button>
        </div>
        <div class="cc-body">
          <div class="cc-pane" data-pane="cat">
          <section class="cc-sec"><div class="cc-label"><span data-l="love"></span><small class="cc-mood"></small></div><div class="cc-hearts"></div></section>
          <section class="cc-sec"><div class="cc-label"><span data-l="growth"></span><small class="cc-next"></small></div><div class="cc-grow"><i></i></div><div class="cc-steps"></div></section>
          <p class="cc-lonely" hidden></p>
          <section class="cc-sec"><div class="cc-label"><span data-l="traits"></span></div><div class="cc-chips"></div></section>
          <section class="cc-sec cc-tricks"><div class="cc-label"><span data-l="tricks"></span><small class="cc-thint"></small></div><div class="cc-trk"></div></section>
          <section class="cc-sec"><label class="cc-toggle"><input type="checkbox"><span class="cc-switch"></span><span data-t="showName"></span></label></section>
          <section class="cc-sec cc-actions">
            <button class="cc-btn" type="button" data-a="pet" style="--b:#ffe1ea"></button>
            <button class="cc-btn" type="button" data-a="feed" style="--b:#fff1b8"></button>
            <button class="cc-btn" type="button" data-a="play" style="--b:#d8f3e6"></button>
            <button class="cc-btn" type="button" data-a="photo" style="--b:#dcefff"></button>
          </section>
          <section class="cc-sec cc-danger">
            <button class="cc-link" type="button" data-r="ask"></button>
            <div class="cc-confirm" hidden><span></span><button class="cc-pill red" type="button" data-r="yes"></button><button class="cc-pill" type="button" data-r="no"></button></div>
          </section>
          </div>
          <div class="cc-pane" data-pane="tasks" hidden>
          <section class="cc-sec cc-tasks"><div class="cc-label"><span class="cc-tt"></span><small class="cc-tnext"></small></div><ul></ul><div class="cc-tfoot"></div></section>
          </div>
          <div class="cc-pane" data-pane="ward" hidden>
          <section class="cc-sec cc-ward">
            <div class="cc-label"><span>👕 <small class="cc-wearing"></small></span><small class="cc-wallet"></small></div>
            <div class="cc-kinds"></div>
            <div class="cc-designs"></div>
            <div class="cc-swatches"></div>
            <div class="cc-unlock" hidden><span class="cc-lockname"></span><button class="cc-pill gold" type="button" data-u="buy"></button><small class="cc-need"></small></div>
            <div class="cc-wbtns"><button class="cc-pill" type="button" data-w="surprise"></button><button class="cc-pill" type="button" data-w="undress"></button></div>
          </section>
          </div>
          <div class="cc-pane" data-pane="mem" hidden>
          <div class="cc-together"></div>
          <section class="cc-sec cc-fam" hidden><div class="cc-label"><span data-l="family"></span></div><div class="cc-famrows"></div></section>
          <section class="cc-sec"><div class="cc-label"><span data-l="memories"></span><small class="cc-memn"></small></div><div class="cc-album"></div></section>
          </div>
          <div class="cc-pane" data-pane="home" hidden>
          <section class="cc-sec cc-shop"><div class="cc-label"><span class="cc-ht"></span><small class="cc-hwallet"></small></div><p class="cc-vhelp cc-hhelp"></p><div class="cc-items"></div></section>
          </div>
          <div class="cc-pane" data-pane="voice" hidden>
          <section class="cc-sec cc-voice"><div class="cc-label"><span class="cc-vt"></span><button class="cc-pill" type="button" data-v="back"></button></div><p class="cc-vhelp"></p><div class="cc-vrows"></div></section>
          </div>
          <div class="cc-pane" data-pane="log" hidden>
          <section class="cc-sec cc-log"><ol></ol></section>
          </div>
        </div>
        <div class="cc-foot">
          <span class="cc-born"></span>
          <span class="cc-tools"><button class="cc-pin" type="button" data-title="pin" hidden>📍</button><button class="cc-snd" type="button" data-title="sound" hidden>🔊</button><button class="cc-mic" type="button" data-title="voices" hidden>🎙️</button><label class="cc-sizer" title=""><b>🔍</b><input type="range" min="0.5" max="1.1" step="0.02"></label>
          <span class="cc-lang"><button type="button" data-lang="tr">TR</button>·<button type="button" data-lang="en">EN</button></span></span>
        </div>
        <div class="cc-flash"></div>
      </div></div>`;
    document.body.appendChild(root);
    const q = (s) => root.querySelector(s);
    const cv = q(".cc-portrait canvas"), pg = cv.getContext("2d");
    const form = q(".cc-rename"), input = form.querySelector("input");

    let cat = null, raf = 0, last = 0, pt = 0, blinkT = 2, blink = false, lastLove = null, logKey = "", tabKey = "", tickT = 0;
    let pane = "cat", kind = "hat", design = null, wardKey = "", size = opts.size >= 0.5 && opts.size <= 1.1 ? +opts.size : 0.66;
    // where you've put the card: null = follow the cat; { x, y, up } = left edge, and the top (or bottom when "up") edge
    let pinned = opts.pos && Number.isFinite(opts.pos.x) ? opts.pos : null;
    const T = () => L.STR[L.lang];
    const setSize = (z) => { size = Math.max(0.5, Math.min(1.1, +z)); root.style.setProperty("--z", size); const r = root.querySelector(".cc-sizer input"); if (r && document.activeElement !== r) r.value = size; };
    setSize(size);

    // ------------------------------------------------ drawing
    function drawPortrait(now) {
      const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now; pt += dt;
      blinkT -= dt; if (blinkT <= 0) { blink = !blink; blinkT = blink ? 0.14 : 2 + Math.random() * 3; }
      if (cat) {
        const pose = POSE_OF[cat.state] || "sit";
        pg.clearRect(0, 0, cv.width, cv.height);
        DC.portrait(pg, cat.coat, { pose, t: pt, blink, eyes: cat.state === "happy" ? "happy" : null, scale: 2, dx: DX[pose] ?? 4, dy: 3, acc: cat.wearing(), grey: L.isElder(cat.profile) });
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
      const tools = document.createElement("span"); tools.className = "cc-top";
      for (const [e, fn, tt] of [["🛒", opts.onMarket, T().market], ["⚙️", opts.onSettings, T().settings]]) {
        if (!fn) continue;
        const b = document.createElement("button"); b.type = "button"; b.className = "cc-tab tool"; b.textContent = e; b.title = tt || "";
        b.onclick = () => fn(); tools.appendChild(b);
      }
      box.appendChild(tools);
    }
    // ------------------------------------------------ the wardrobe: pick a kind, a design, then a colour
    const worn = (k) => (cat.profile.acc || {})[k] || null;
    function renderWardrobe() {
      const t = T(), lang = L.lang, cur = worn(kind), curD = cur ? cur.split(":")[0] : null, curS = cur ? cur.split(":")[1] : null;
      if (!design) design = curD || Object.keys(W[kind])[0];
      const key = [lang, kind, design, cat.coat, JSON.stringify(cat.profile.acc || {}), L.tasksOn, L.wallet.stars, L.wallet.owned.length].join("|");
      if (key === wardKey) return; wardKey = key;
      q(".cc-kinds").innerHTML = Object.keys(KINDS).map((k) => `<button type="button" class="cc-kind${k === kind ? " on" : ""}" data-k="${k}">${KINDS[k]} ${esc(t[k])} <small>${Object.keys(W[k]).filter((d) => !L.price(k, d)).length * 10}/100</small></button>`).join("");
      q(".cc-wallet").textContent = t.wallet(L.wallet.stars);
      // design thumbnails: the cat wearing each one (in the colour it has on, or the first colour)
      const box = q(".cc-designs"); box.innerHTML = "";
      const none = document.createElement("button"); none.type = "button"; none.className = "cc-design none" + (!cur ? " on" : ""); none.title = t.none; none.textContent = "⦸";
      none.onclick = () => wear(null); box.appendChild(none);
      Object.keys(W[kind]).forEach((d) => {
        const b = document.createElement("button"); b.type = "button";
        const cost = L.price(kind, d);
        b.className = "cc-design" + (d === curD ? " on" : "") + (d === design && d !== curD ? " pick" : "") + (cost ? " locked" : ""); b.title = W[kind][d][lang] + (cost ? ` · 🔒 ${cost}⭐` : "");
        const k = document.createElement("canvas"); k.width = 44; k.height = 44; b.appendChild(k);
        const acc = { ...(cat.profile.acc || {}) }; acc[kind] = `${d}:${d === curD && curS ? curS : "cherry"}`;
        if (kind !== "outfit") delete acc.outfit;
        DC.portrait(k.getContext("2d"), cat.coat, { ...THUMB[kind], acc });
        if (cost) { const lk = document.createElement("span"); lk.className = "cc-lk"; lk.textContent = `🔒${cost}`; b.appendChild(lk); }
        b.onclick = () => { design = d; if (L.price(kind, d)) { wardKey = ""; renderWardrobe(); return; } wear(`${d}:${d === curD && curS ? curS : (curS || "cherry")}`); };
        box.appendChild(b);
      });
      // a locked design picked: show what it costs instead of the colours
      const cost = L.price(kind, design), ub = q(".cc-unlock");
      ub.hidden = !cost; q(".cc-swatches").hidden = !!cost;
      if (cost) {
        q(".cc-lockname").textContent = `🔒 ${W[kind][design][lang]}`;
        const buy = q('[data-u="buy"]'); buy.textContent = t.unlock(cost); buy.disabled = L.wallet.stars < cost;
        q(".cc-need").textContent = L.wallet.stars >= cost ? "" : L.tasksOn ? t.need(cost - L.wallet.stars) : t.needTasks;
      }
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

    // ------------------------------------------------ tricks: tap to teach, tap again once learned to ask for it
    function renderTricks(p, t) {
      q(".cc-thint").textContent = t.learnHint;
      const html = Object.entries(L.TRICKS).map(([id, tr]) => {
        const n = (p.tricks || {})[id] || 0, done = n >= L.LESSONS;
        return `<button type="button" class="cc-trick${done ? " done" : ""}" data-tr="${id}" title="${esc(done ? tr[lang()] : t.lessons(n, L.LESSONS))}">${tr.e} ${esc(tr[lang()])}${done ? "" : `<i style="--f:${n / L.LESSONS}"></i>`}</button>`;
      }).join("");
      const box = q(".cc-trk"); if (box.dataset.v !== html) { box.innerHTML = html; box.dataset.v = html; }
    }
    const lang = () => L.lang;
    // ------------------------------------------------ memories, family, days together
    let memKey = "";
    function renderMemories(p, t) {
      const ln = L.lang, cats = world.cats.filter((c) => c.profile);
      const key = [ln, p.id, (p.mem || []).length, p.mem && p.mem[0] && p.mem[0].t, cats.map((c) => c.profile.id + c.profile.name).join(), L.togetherDays()].join("|");
      if (key === memKey) return; memKey = key;
      q(".cc-together").textContent = t.together(Math.max(1, L.togetherDays() + 1));
      // family: parents, brothers and sisters, kittens (with the ones who've left still remembered by name)
      const byId = (id) => cats.find((c) => c.profile.id === id);
      const chip = (info) => { const c = byId(info.id); return `<button type="button" class="cc-kin${c ? "" : " gone"}" data-kin="${c ? info.id : ""}"><canvas width="40" height="40" data-coat="${esc((c ? c.profile.coat : info.coat) || "ginger")}" data-acc='${esc(JSON.stringify(c ? c.profile.acc || {} : {}))}'></canvas><span>${esc(c ? c.profile.name : info.name)}${c ? "" : ` <small>(${esc(t.gone)})</small>`}</span></button>`; };
      const par = p.parentInfo || [], sibs = par.length ? cats.filter((c) => c.profile !== p && c.profile.parents && c.profile.parents.join() === (p.parents || []).join()).map((c) => ({ id: c.profile.id, name: c.profile.name, coat: c.profile.coat })) : [];
      const kids = p.kids || [];
      const rows = [[t.parentsL, par], [t.siblings, sibs], [t.kids, kids]].filter(([, l]) => l.length);
      q(".cc-fam").hidden = !rows.length;
      q(".cc-famrows").innerHTML = rows.map(([h, l]) => `<div class="cc-famrow"><small>${esc(h)}</small><div>${l.map(chip).join("")}</div></div>`).join("");
      q(".cc-famrows").querySelectorAll("canvas").forEach((k) => DC.portrait(k.getContext("2d"), k.dataset.coat, { scale: 0.85, dx: 4, dy: 2, acc: JSON.parse(k.dataset.acc || "{}") }));
      // the album: each polaroid drawn again from how the cat looked that day
      const mem = p.mem || [];
      q(".cc-memn").textContent = mem.length ? `${mem.length}` : "";
      const album = q(".cc-album");
      if (!mem.length) { album.innerHTML = `<p class="cc-empty">${esc(t.noMem)}</p>`; return; }
      album.innerHTML = mem.map((m, i) => `<figure class="cc-pol" style="--r:${((i * 37) % 7) - 3}deg"><canvas width="96" height="84" data-i="${i}"></canvas><figcaption>${esc(L.memText(m))}<time>${esc(new Date(m.t).toLocaleDateString(ln === "tr" ? "tr-TR" : "en-GB", { day: "numeric", month: "short", year: "numeric" }))}</time></figcaption></figure>`).join("");
      album.querySelectorAll("canvas").forEach((k) => {
        const m = mem[+k.dataset.i], g = k.getContext("2d");
        g.fillStyle = tint(DC.COATS[p.coat].body, 0.75); g.fillRect(0, 0, 96, 84);
        const sz = 0.3 + 0.7 * (m.g ?? 1);
        DC.portrait(g, p.coat, { pose: m.pose || "sit", scale: 1.75 * sz, dx: 4, dy: 3 + (1 - sz) * 18, acc: m.acc, grey: m.grey, eyes: m.pose === "sleep" ? null : "happy" });
        if (m.k === "kitten" && m.a && m.a.kit) DC.portrait(g, m.a.kit.coat, { pose: "sleep", scale: 0.75, dx: 26, dy: 22 });
        if (m.k === "birthday" || m.k === "together") { g.font = "18px sans-serif"; g.fillText(m.k === "birthday" ? "🎂" : "💞", 6, 22); }
        if (m.k === "trick" && L.TRICKS[m.a.id]) { g.font = "18px sans-serif"; g.fillText(L.TRICKS[m.a.id].e, 6, 22); }
      });
    }
    // ------------------------------------------------ your own meow recordings
    // ------------------------------------------------ furniture: buy with stars, place or put away
    function renderHome(t) {
      q(".cc-ht").textContent = `🏠 ${t.home}`; q(".cc-hwallet").textContent = t.wallet(L.wallet.stars); q(".cc-hhelp").textContent = t.homeHint;
      const H = L.home, html = Object.keys(DC.FURN).map((k) => {
        const own = H.owned[k] || 0, out = world.furniture.filter((f) => f.kind === k).length, price = DC.FURN[k].price, [nm, ds] = t.furn[k];
        const btns = `<button type="button" class="cc-pill gold" data-fu="buy"${L.wallet.stars < price ? " disabled" : ""}>⭐ ${price}</button>`
          + (own ? `<span class="cc-fbtns"><button type="button" class="cc-pill" data-fu="place"${out >= own ? " disabled" : ""}>${esc(t.place)}</button><button type="button" class="cc-pill" data-fu="away"${out ? "" : " disabled"}>${esc(t.putAway)}</button></span>` : "");
        return `<div class="cc-item${own ? " own" : ""}" data-k="${k}"><canvas width="64" height="56" data-f="${k}"></canvas><div><b>${esc(nm)}</b><small>${esc(ds)}</small>${own ? `<small class="cc-own">${esc(t.ownedN(own, out))}</small>` : ""}</div><div class="cc-fcol">${btns}</div></div>`;
      }).join("");
      const box = q(".cc-items"); if (box.dataset.v === html) return; box.innerHTML = html; box.dataset.v = html;
      box.querySelectorAll("canvas[data-f]").forEach((k) => DC.furnitureThumb(k.dataset.f, k.getContext("2d")));
    }
    function renderVoices(t) {
      const V = opts.voices; if (!V) return;
      q(".cc-vt").textContent = `🎙️ ${t.voices}`; q('[data-v="back"]').textContent = `← ${t.back}`; q(".cc-vhelp").textContent = t.voicesHelp;
      const counts = V.counts(), html = [["kitten", "🍼"], ["adult", "👑"], ["elder", "🦉"], ["purr", "😻"]].map(([g, e]) =>
        `<div class="cc-vrow" data-g="${g}"><b>${e} ${esc(t["voice_" + g])}</b><small>${esc(t.voiceN(counts[g] || 0))}</small>
          <button type="button" class="cc-pill rec${recG === g ? " on" : ""}" data-vt="rec" title="${esc(t.recTitle)}">${recG === g ? `⏹ ${recLeft}` : "🎤"}</button>
          <label class="cc-pill" title="${esc(t.addFiles)}">＋<input type="file" accept="audio/*" multiple hidden></label>
          <button type="button" class="cc-pill" data-vt="test"${counts[g] ? "" : " disabled"}>▶</button><button type="button" class="cc-pill" data-vt="clear"${counts[g] ? "" : " disabled"}>🗑</button></div>`).join("");
      const box = q(".cc-vrows"); if (box.dataset.v !== html) { box.innerHTML = html; box.dataset.v = html; }
    }
    function renderTasks(p, t) {
      const ts = L.tasks(p);
      q(".cc-tt").textContent = `🎯 ${t.tasksToday}`;
      q(".cc-tnext").textContent = ts.all ? "" : t.newTasks;
      const html = ts.list.map((k) => {
        const d = L.TASKS[k.id]; if (!d) return "";
        const done = k.n >= d.n, f = Math.min(1, k.n / d.n);
        return `<li class="${done ? "done" : ""}"><span class="ico">${d.e}</span><span class="txt">${esc(L.taskText(k.id))}<i style="--f:${f}"></i></span><b>${done ? "✓" : `${k.n}/${d.n}`}</b></li>`;
      }).join("") + (ts.all ? `<li class="all">${esc(t.allDone)}</li>` : "");
      const ul = q(".cc-tasks ul"); if (ul.dataset.v !== html) { ul.innerHTML = html; ul.dataset.v = html; }
      q(".cc-tfoot").innerHTML = `<b>${esc(t.wallet(L.wallet.stars))}</b><span>${esc([t.earned(p.stars || 0), p.streak > 1 ? t.streak(p.streak) : ""].filter(Boolean).join("  ·  "))}</span><small>${esc(t.howStars)}</small>`;
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
      const icons = { love: "💗", growth: "🌱", traits: "✨", diary: "📖", wardrobe: "👗", tricks: "🎓", family: "👪", memories: "📷" };
      root.querySelectorAll("[data-l]").forEach((el) => { el.textContent = `${icons[el.dataset.l]} ${t[el.dataset.l]}`; });
      if (pane === "tasks" && !L.tasksOn) pane = "cat";
      q('[data-p="tasks"]').hidden = !L.tasksOn;
      const pn = { cat: ["🐾", t.paneCat], tasks: ["🎯", t.tasks], ward: ["👗", t.wardrobe], log: ["📖", t.diary], mem: ["📷", t.memories], home: ["🏠", t.home] };
      // the open tab shows its name, the others just their icon
      root.querySelectorAll("[data-p]").forEach((b) => { const on = b.dataset.p === pane; b.textContent = on ? `${pn[b.dataset.p][0]} ${pn[b.dataset.p][1]}` : pn[b.dataset.p][0]; b.title = pn[b.dataset.p][1]; b.classList.toggle("on", on); b.setAttribute("aria-selected", on); });
      q(".cc-mic").hidden = !opts.voices; q(".cc-mic").title = t.voices || "";
      root.querySelectorAll("[data-pane]").forEach((d) => { d.hidden = d.dataset.pane !== pane; });
      q(".cc-name").textContent = p.name;
      const days = Math.floor((now - p.born) / 864e5);
      q(".cc-sub").textContent = `${L.COAT_NAMES[p.coat] ? L.COAT_NAMES[p.coat][lang] : p.coat} · ${p.sex === "f" ? t.sexF : t.sexM} · ${t.age(days)}`;
      const lone = q(".cc-lonely"), hungry = L.isHungry(p);
      lone.hidden = !L.isLonely(p) && !hungry; lone.textContent = [hungry ? t.hungry : "", L.isLonely(p) ? t.lonely : ""].filter(Boolean).join(" · ");

      const st = L.stage(p); q(".cc-stage").textContent = `${st.e} ${st[lang]}`;
      const bd = q(".cc-bday"); bd.hidden = !L.isBirthday(p); bd.title = t.birthdayToday;
      const hearts = Array.from({ length: 10 }, (_, i) => { const f = clamp((p.love - i * 10) / 10, 0, 1); return heart(f >= 0.9 ? 1 : f >= 0.4 ? 0.5 : 0); }).join("");
      const hb = q(".cc-hearts"); if (hb.dataset.v !== hearts) { hb.innerHTML = hearts; hb.dataset.v = hearts; }
      if (lastLove != null && p.love > lastLove + 0.5) { hb.classList.remove("bump"); void hb.offsetWidth; hb.classList.add("bump"); }
      lastLove = p.love;
      q(".cc-mood").textContent = t.mood(p.love);
      const gr = L.growth(p);
      q(".cc-grow > i").style.width = `${clamp(gr * 100, 3, 100)}%`;
      const nx = L.nextStage(p); q(".cc-next").textContent = `${t.height(gr)} · ${!nx ? t.grownUp : L.growing(p) ? t.toNext(L.hoursToNext(p)) : t.notGrowing}`;
      q(".cc-steps").innerHTML = L.STAGES.slice(0, 3).map((s) => `<span class="${gr >= s.min - 1e-9 ? "on" : ""}" style="left:${s.min * 100}%" title="${esc(s[lang])}">${s.e}</span>`).join("");
      q(".cc-chips").innerHTML = p.traits.map((k, i) => `<span class="cc-chip" style="--c:${CHIP[(i * 2 + p.id.charCodeAt(0)) % CHIP.length]}">${L.TRAITS[k].e} ${esc(L.TRAITS[k][lang])}</span>`).join("")
        + `<span class="cc-chip fav">${L.TOYS[p.fav].e} ${esc(t.fav)}: ${esc(L.TOYS[p.fav][lang])}</span>`;
      const bf = L.bestFriend(p, world.cats), par = (p.parents || []).map((id) => world.cats.find((c) => c.profile && c.profile.id === id));
      if (bf) q(".cc-chips").innerHTML += `<span class="cc-chip" style="--c:#ffd9e4">💞 ${esc(t.friend)}: ${esc(bf.profile.name)}</span>`;
      if (par.length === 2 && par[0] && par[1]) q(".cc-chips").innerHTML += `<span class="cc-chip" style="--c:#fff1b8">🐣 ${esc(t.parents(par[0].profile.name, par[1].profile.name))}</span>`;
      q(".cc-toggle input").checked = !!p.showName;
      if (L.tasksOn) renderTasks(p, t);
      renderTricks(p, t);
      if (pane === "mem") renderMemories(p, t);
      if (pane === "voice") renderVoices(t);

      q('[data-a="pet"]').textContent = `💗 ${t.pet}`; q('[data-a="feed"]').textContent = `🍗 ${t.feed} · ${(L.pantry.dry || 0) + (L.pantry.wet || 0) + (L.pantry.fish || 0)}`;
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
      const bday = new Date(p.born), loc = lang === "tr" ? "tr-TR" : "en-GB";
      q(".cc-born").textContent = `🎂 ${bday.toLocaleDateString(loc, { day: "numeric", month: "short" })}`;
      q(".cc-born").title = t.born(bday.toLocaleDateString(loc, { day: "numeric", month: "long", year: "numeric" }));
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
    // Status / Wardrobe / Diary: one page at a time keeps the card short
    root.querySelectorAll("[data-p]").forEach((b) => b.onclick = () => {
      if (pane === b.dataset.p) return;
      pane = b.dataset.p; update(); q(".cc-body").scrollTop = 0; place();
    });
    q(".cc-mic").onclick = () => { pane = pane === "voice" ? "cat" : "voice"; update(); place(); };
    q('[data-v="back"]').onclick = () => { stopRec(); pane = "cat"; update(); place(); };
    q(".cc-vrows").addEventListener("change", async (e) => {
      const inp = e.target.closest("input[type=file]"); if (!inp || !inp.files.length) return;
      const g = inp.closest("[data-g]").dataset.g; await opts.voices.add(g, [...inp.files]); inp.value = ""; q(".cc-vrows").dataset.v = ""; update();
      g === "purr" ? world.purr() : world.meow(fakeCat(g));
    });
    q(".cc-vrows").addEventListener("click", async (e) => {
      const b = e.target.closest("[data-vt]"); if (!b) return; const g = b.closest("[data-g]").dataset.g;
      if (b.dataset.vt === "rec") { recG === g ? stopRec() : startRec(g); return; }
      if (b.dataset.vt === "test") g === "purr" ? world.purr() : world.meow(fakeCat(g));
      else { await opts.voices.clear(g); q(".cc-vrows").dataset.v = ""; update(); }
    });
    // drop sound files straight onto the card
    root.addEventListener("dragover", (e) => { if (pane === "voice") e.preventDefault(); });
    root.addEventListener("drop", async (e) => {
      if (pane !== "voice") return; e.preventDefault();
      const row = e.target.closest && e.target.closest("[data-g]"), g = row ? row.dataset.g : "adult";
      const files = [...e.dataTransfer.files].filter((f) => f.type.startsWith("audio/")); if (!files.length) return;
      await opts.voices.add(g, files); q(".cc-vrows").dataset.v = ""; update(); world.meow(fakeCat(g));
    });
    // ------------------------------------------------ record a meow with the microphone (up to 5 seconds)
    let recG = null, recLeft = 0, recorder = null, recTimer = 0;
    async function startRec(g) {
      if (recorder) stopRec();
      let stream;
      try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: true, autoGainControl: false } }); }
      catch { q(".cc-vhelp").textContent = T().micNo; return; }
      const chunks = []; recorder = new MediaRecorder(stream); recG = g; recLeft = 5;
      recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((tr) => tr.stop()); clearInterval(recTimer);
        const group = recG; recG = null; recorder = null; q(".cc-vrows").dataset.v = ""; update();
        const wav = await tidyRecording(new Blob(chunks, { type: chunks[0] ? chunks[0].type : "audio/webm" }));
        if (!wav) { q(".cc-vhelp").textContent = T().recQuiet; return; }
        await opts.voices.add(group, [wav]); q(".cc-vrows").dataset.v = ""; update(); group === "purr" ? world.purr() : world.meow(fakeCat(group));
      };
      recorder.start();
      recTimer = setInterval(() => { recLeft--; q(".cc-vrows").dataset.v = ""; update(); if (recLeft <= 0) stopRec(); }, 1000);
      q(".cc-vrows").dataset.v = ""; update();
    }
    function stopRec() { if (recorder && recorder.state !== "inactive") recorder.stop(); clearInterval(recTimer); }
    // cut the silence off both ends, make it a good loudness, and keep it as a small WAV
    async function tidyRecording(blob) {
      try {
        world.audio = world.audio || new (window.AudioContext || window.webkitAudioContext)();
        const buf = await world.audio.decodeAudioData(await blob.arrayBuffer());
        const n = buf.length, sr = buf.sampleRate, mono = new Float32Array(n);
        for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c); for (let i = 0; i < n; i++) mono[i] += d[i] / buf.numberOfChannels; }
        let peak = 0; for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(mono[i]));
        if (peak < 0.015) return null;                                  // nothing but room noise
        const th = Math.max(0.01, peak * 0.1), pad = Math.round(sr * 0.04);
        let a = 0, b = n - 1; while (a < n && Math.abs(mono[a]) < th) a++; while (b > a && Math.abs(mono[b]) < th) b--;
        a = Math.max(0, a - pad); b = Math.min(n - 1, b + pad * 2);
        const out = mono.subarray(a, b + 1), gain = 0.9 / peak, fade = Math.min(out.length / 2, Math.round(sr * 0.01));
        const rate = Math.min(sr, 32000), step = sr / rate, len = Math.floor(out.length / step);
        const ab = new ArrayBuffer(44 + len * 2), v = new DataView(ab), w = (o, s) => [...s].forEach((ch, i) => v.setUint8(o + i, ch.charCodeAt(0)));
        w(0, "RIFF"); v.setUint32(4, 36 + len * 2, true); w(8, "WAVE"); w(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
        v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, "data"); v.setUint32(40, len * 2, true);
        for (let i = 0; i < len; i++) {
          const j = Math.floor(i * step); let x = out[j] * gain;
          if (j < fade) x *= j / fade; if (out.length - j < fade) x *= (out.length - j) / fade;
          v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, x)) * 32767, true);
        }
        return new Blob([ab], { type: "audio/wav" });
      } catch { return null; }
    }
    const fakeCat = (g) => ({ size: g === "kitten" ? 0.4 : 1, profile: { g0: g === "kitten" ? 0.1 : 1, gT: Date.now(), born: g === "elder" ? 0 : Date.now() } });
    q(".cc-items").onclick = (e) => {
      const b = e.target.closest("[data-fu]"); if (!b) return; const k = b.closest("[data-k]").dataset.k, H = L.home;
      if (b.dataset.fu === "buy") {
        const price = DC.FURN[k].price; if (L.wallet.stars < price) return;
        L.wallet.stars -= price; H.owned[k] = (H.owned[k] || 0) + 1; floatUp("⭐", b);
        const f = world.placeFurniture(k); world.confetti(f.x, world.floor - 30, 20);
      } else if (b.dataset.fu === "place") { if (world.furniture.filter((f) => f.kind === k).length < (H.owned[k] || 0)) world.placeFurniture(k); }
      else world.removeFurniture(k);
      L.changed(); q(".cc-items").dataset.v = ""; update();
    };
    q(".cc-trk").onclick = (e) => {
      const b = e.target.closest("[data-tr]"); if (!b || !cat) return;
      const r = L.teach(cat, b.dataset.tr); if (!r) return;
      cat.doTrick(b.dataset.tr, !r.ok);
      floatUp(r.ok ? (r.learned ? "🎓" : "✨") : "❔", b); update();
    };
    q(".cc-famrows").onclick = (e) => { const b = e.target.closest("[data-kin]"); if (!b || !b.dataset.kin) return; const c = world.cats.find((x) => x.profile && x.profile.id === b.dataset.kin); if (c) { pane = "mem"; memKey = ""; api.open(c); } };
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
      DC.portrait(kg, cat.coat, { pose, t: pt, eyes: cat.state === "sleep" ? null : "happy", scale: 10, dx: DX[pose] ?? 4, dy: 3, acc: cat.wearing(), grey: L.isElder(p) });
      g.drawImage(k, 30, 20);
      g.strokeStyle = "#5b3a29"; g.lineWidth = 4; g.strokeRect(30, 30, 540, 540);
      g.fillStyle = "#5b3a29"; g.textAlign = "center";
      g.font = '700 46px "Pixelify Sans", monospace'; g.fillText(p.name, 300, 640);
      const date = new Date().toLocaleDateString(lang === "tr" ? "tr-TR" : "en-GB", { day: "numeric", month: "long", year: "numeric" });
      g.font = '800 22px "Nunito", sans-serif'; g.globalAlpha = 0.75; g.fillText(`${date} · ${L.stage(p)[lang]}`, 300, 684); g.globalAlpha = 1;
      g.fillStyle = "#ff6f91"; GLYPH.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === "1") { g.fillRect(520 + x * 4, 690 + y * 4, 4, 4); g.fillRect(48 + x * 4, 690 + y * 4, 4, 4); } }));
      const flash = q(".cc-flash"); flash.classList.remove("go"); void flash.offsetWidth; flash.classList.add("go");
      c.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
        a.download = `${p.name}-${new Date().toISOString().slice(0, 10)}.png`; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      }, "image/png");
      L.care(cat, "photo"); L.remember(p, "photo"); L.changed(); memKey = ""; update();
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
      const open = (k) => Object.fromEntries(Object.entries(W[k]).filter(([d]) => !L.price(k, d)));   // only what's unlocked
      const kinds = ["hat", "collar", "outfit"].filter((k) => Object.keys(open(k)).length);
      if (!kinds.length) { kind = "hat"; design = Object.keys(W.hat)[0]; wardKey = ""; renderWardrobe(); return; }   // nothing bought yet: show what's for sale
      for (const k of kinds) if (Math.random() < 0.75) p.acc[k] = `${pickK(open(k))}:${pickK(W.schemes)}`;
      if (!Object.keys(p.acc).length) p.acc[kinds[0]] = `${pickK(open(kinds[0]))}:${pickK(W.schemes)}`;
      L.care(cat, "dress", { kind: Object.keys(p.acc)[0], item: Object.values(p.acc)[0] });
      design = p.acc[kind] ? p.acc[kind].split(":")[0] : null; wardKey = ""; tabKey = ""; L.changed(); update(); floatUp("✨", e.currentTarget);
    };
    q('[data-u="buy"]').onclick = (e) => {
      if (!L.buy(kind, design)) return;
      floatUp("⭐", e.currentTarget);
      world.confetti(cat.x, cat.y - 30 * cat.s, 18);
      wardKey = ""; wear(`${design}:cherry`);
    };
    q('[data-w="undress"]').onclick = () => { cat.profile.acc = {}; design = null; wardKey = ""; tabKey = ""; L.changed(); update(); };
    q('[data-r="ask"]').onclick = () => { q(".cc-confirm").hidden = false; q('[data-r="ask"]').hidden = true; };
    q('[data-r="no"]').onclick = () => { q(".cc-confirm").hidden = true; q('[data-r="ask"]').hidden = false; };
    q('[data-r="yes"]').onclick = () => { const c = cat; q(".cc-confirm").hidden = true; q('[data-r="ask"]').hidden = false; if (opts.onRemove) opts.onRemove(c); };
    q(".cc-sizer input").value = size;
    q(".cc-sizer input").addEventListener("change", (e) => { setSize(e.target.value); if (opts.onSize) opts.onSize(size); requestAnimationFrame(place); });
    q(".cc-sizer input").addEventListener("pointerdown", (e) => e.stopPropagation());
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
      setSize: (z) => { setSize(z); if (!root.hidden) requestAnimationFrame(place); },
    };
    return api;
  }

  window.CatCard = { create };
})();
