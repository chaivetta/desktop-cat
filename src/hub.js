// ☰ One menu for everything: a strip of tabs sitting on top of whichever panel is open (market, inventory, games, park, events,
// progress, settings). The cat card has a single menu button; the tabs switch between the panels.
(() => {
  const L = window.CatLife;
  const NAV_H = 84;
  // five groups on top, the pages of the open group underneath
  const GROUPS = [
    ["shop", "🛒", "Alışveriş", "Shopping", ["market", "inventory"]], ["world", "🌍", "Dünya", "World", ["world", "park"]],
    ["rewards", "🏆", "Ödüller", "Rewards", ["pass", "cards", "progress"]], ["fun", "🎉", "Eğlence", "Fun", ["games", "events"]], ["settings", "⚙️", "Ayarlar", "Settings", ["settings"]],
  ];
  const groupOf = (n) => GROUPS.find((g) => g[4].includes(n));
  const TABS = [
    ["market", "🛒", "Market", "Market"], ["inventory", "🎒", "Envanter", "Inventory"], ["world", "🌍", "Dünya", "World"], ["pass", "🐾", "Pati Yolu", "Paw Path"], ["cards", "🃏", "Kartlar", "Cards"], ["games", "🎮", "Oyunlar", "Games"],
    ["park", "🌳", "Park", "Park"], ["events", "🎪", "Etkinlik", "Events"], ["progress", "🏅", "Gelişim", "Progress"], ["settings", "⚙️", "Ayarlar", "Settings"],
  ];
  const X = () => (L.extra.hub = L.extra.hub || {});
  function create(o) {
    const PP = o.panels; let P = {};                   // name -> { open(), close(), isOpen }, filled in once they all exist
    const ready = () => { if (!Object.keys(P).length) { const x = typeof PP === "function" ? PP() : PP; if (Object.values(x).every(Boolean)) P = x; } return Object.keys(P).length > 0; };
    const nav = document.createElement("div"); nav.className = "ui hub"; nav.hidden = true; document.body.appendChild(nav);
    let cur = null, last = "market", key = "", swapT = 0;
    const isOpen = (n) => { const p = P[n]; if (!p) return false; if (n === "park") return p.isOpen && p.tab === "park"; if (n === "events") return p.isOpen && p.tab !== "park"; return p.isOpen; };
    const all = () => [...new Set(Object.values(P))];
    function render() {
      const k = [L.lang, cur, o.badge ? JSON.stringify(o.badge()) : ""].join("|"); if (k === key) return; key = k;
      const b = o.badge ? o.badge() : {};
      const tr = L.lang === "tr", g = groupOf(cur) || GROUPS[0], lastIn = (gr) => (gr[4].includes(last) ? last : gr === g ? cur : X().gl && X().gl[gr[0]]) || gr[4][0];
      const dot = (gr) => gr[4].reduce((a, n) => a + (+b[n] || 0), 0);
      nav.innerHTML = `<div class="hub-row">${GROUPS.filter((gr) => gr[4].some((n) => P[n])).map((gr) => `<button type="button" data-hub="${gr === g ? cur : lastIn(gr)}" data-grp="${gr[0]}" title="${tr ? gr[2] : gr[3]}" class="${gr === g ? "on" : ""}"${dot(gr) ? ` data-dot="${dot(gr)}"` : ""}><span>${gr[1]}</span></button>`).join("")}</div>`
        + `<div class="hub-sub">${g[4].filter((n) => P[n]).map((n) => { const t = TABS.find((x) => x[0] === n); return `<button type="button" data-hub="${n}" class="${cur === n ? "on" : ""}"${b[n] ? ` data-dot="${b[n]}"` : ""}>${t[1]} ${tr ? t[2] : t[3]}</button>`; }).join("")}</div>`;
    }
    function open(n) {
      if (!ready()) return; n = n || last;
      // switching tabs: the new panel just appears in place (no pop-in, no jump in size)
      // (the class stays on while the menu is open: taking it off would replay the animation)
      const swap = all().some((p) => p.isOpen) || !nav.hidden; clearTimeout(swapT);
      if (swap) document.body.classList.add("hub-swap"); else swapT = setTimeout(() => { if (!nav.hidden) document.body.classList.add("hub-swap"); }, 300);
      all().forEach((p) => p.isOpen && p.close());
      cur = n; last = n; const gr = groupOf(n); if (gr) (X().gl = X().gl || {})[gr[0]] = n;
      if (n === "park") P.park.open("park"); else if (n === "events") P.events.open(P.events.tab && P.events.tab !== "park" ? P.events.tab : "contest"); else P[n].open();
      key = ""; render(); nav.hidden = false; place();
    }
    function close() { if (!ready()) return; all().forEach((p) => p.isOpen && p.close()); cur = null; nav.hidden = true; document.body.classList.remove("hub-swap"); }
    const toggle = (n) => (cur && (!n || cur === n) && !nav.hidden ? close() : open(n));
    // sit on top of the open panel, with the same width and zoom
    function place() {
      if (nav.hidden) return;
      const el = [...document.querySelectorAll(".mk:not([hidden]):not(.mk-pop), .st:not([hidden])")].find((x) => !x.classList.contains("hub"));
      if (!el) return;
      let r = el.getBoundingClientRect(); const z = parseFloat(getComputedStyle(document.querySelector(".cc") || document.body).getPropertyValue("--z")) || 1;
      if (r.top < NAV_H * z + 4) { el.style.top = `${NAV_H * z + 8}px`; el.style.bottom = "auto"; el.style.maxHeight = `${innerHeight - NAV_H * z - 16}px`; r = el.getBoundingClientRect(); }      // no room on top: move the panel down a little
      nav.style.transformOrigin = "0 0"; nav.style.transform = `scale(${z})`; nav.style.width = `${r.width / z}px`;
      nav.style.left = `${r.left}px`; nav.style.top = `${r.top - NAV_H * z}px`;
    }
    nav.addEventListener("click", (e) => { const b = e.target.closest("[data-hub]"); if (!b) return; if (b.dataset.hub === "x") close(); else open(b.dataset.hub); });
    // a panel closed by its own × (or opened from somewhere else) keeps the strip in step
    setInterval(() => {
      if (!ready()) return;
      const open = TABS.map(([n]) => n).find(isOpen);
      if (!open) { if (!nav.hidden) { nav.hidden = true; cur = null; document.body.classList.remove("hub-swap"); } return; }
      if (open !== cur) { cur = open; last = open; key = ""; }
      nav.hidden = false; render(); place();
    }, 250);
    addEventListener("resize", place);
    return { open, close, toggle, get cur() { return cur; }, NAV_H, get shown() { return !nav.hidden; } };
  }
  window.CatHub = { create, NAV_H };
})();
