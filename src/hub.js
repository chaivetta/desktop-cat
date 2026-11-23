// ☰ One menu for everything: a strip of tabs sitting on top of whichever panel is open (market, inventory, games, park, events,
// progress, settings). The cat card has a single menu button; the tabs switch between the panels.
(() => {
  const L = window.CatLife;
  const NAV_H = 54;
  const TABS = [
    ["market", "🛒", "Market", "Market"], ["inventory", "🎒", "Envanter", "Inventory"], ["games", "🎮", "Oyunlar", "Games"],
    ["park", "🌳", "Park", "Park"], ["events", "🎪", "Etkinlik", "Events"], ["progress", "🏅", "Gelişim", "Progress"], ["settings", "⚙️", "Ayarlar", "Settings"],
  ];
  function create(o) {
    const PP = o.panels; let P = {};                   // name -> { open(), close(), isOpen }, filled in once they all exist
    const ready = () => { if (!Object.keys(P).length) { const x = typeof PP === "function" ? PP() : PP; if (Object.values(x).every(Boolean)) P = x; } return Object.keys(P).length > 0; };
    const nav = document.createElement("div"); nav.className = "ui hub"; nav.hidden = true; document.body.appendChild(nav);
    let cur = null, last = "market", key = "";
    const isOpen = (n) => { const p = P[n]; if (!p) return false; if (n === "park") return p.isOpen && p.tab === "park"; if (n === "events") return p.isOpen && p.tab !== "park"; return p.isOpen; };
    const all = () => [...new Set(Object.values(P))];
    function render() {
      const k = [L.lang, cur, o.badge ? JSON.stringify(o.badge()) : ""].join("|"); if (k === key) return; key = k;
      const b = o.badge ? o.badge() : {};
      nav.innerHTML = TABS.filter(([n]) => P[n]).map(([n, e, tr, en]) => `<button type="button" data-hub="${n}" class="${cur === n ? "on" : ""}"${b[n] ? ` data-dot="${b[n]}"` : ""}><span>${e}</span><small>${L.lang === "tr" ? tr : en}</small></button>`).join("")
        + `<button type="button" class="hub-x" data-hub="x">✕</button>`;
    }
    function open(n) {
      if (!ready()) return; n = n || last; all().forEach((p) => p.isOpen && p.close());
      cur = n; last = n;
      if (n === "park") P.park.open("park"); else if (n === "events") P.events.open(P.events.tab && P.events.tab !== "park" ? P.events.tab : "contest"); else P[n].open();
      key = ""; render(); nav.hidden = false; place();
    }
    function close() { if (!ready()) return; all().forEach((p) => p.isOpen && p.close()); cur = null; nav.hidden = true; }
    const toggle = (n) => (cur && (!n || cur === n) && !nav.hidden ? close() : open(n));
    // sit on top of the open panel, with the same width and zoom
    function place() {
      if (nav.hidden) return;
      const el = [...document.querySelectorAll(".mk:not([hidden]):not(.mk-pop), .st:not([hidden])")].find((x) => !x.classList.contains("hub"));
      if (!el) return;
      const r = el.getBoundingClientRect(), z = parseFloat(getComputedStyle(document.querySelector(".cc") || document.body).getPropertyValue("--z")) || 1;
      nav.style.transformOrigin = "0 0"; nav.style.transform = `scale(${z})`; nav.style.width = `${r.width / z}px`;
      nav.style.left = `${r.left}px`; nav.style.top = `${r.top - NAV_H * z}px`;
    }
    nav.addEventListener("click", (e) => { const b = e.target.closest("[data-hub]"); if (!b) return; if (b.dataset.hub === "x") close(); else open(b.dataset.hub); });
    // a panel closed by its own × (or opened from somewhere else) keeps the strip in step
    setInterval(() => {
      if (!ready()) return;
      const open = TABS.map(([n]) => n).find(isOpen);
      if (!open) { if (!nav.hidden) { nav.hidden = true; cur = null; } return; }
      if (open !== cur) { cur = open; last = open; key = ""; }
      nav.hidden = false; render(); place();
    }, 250);
    addEventListener("resize", place);
    return { open, close, toggle, get cur() { return cur; }, NAV_H, get shown() { return !nav.hidden; } };
  }
  window.CatHub = { create, NAV_H };
})();
