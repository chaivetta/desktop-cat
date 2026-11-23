// 👋 Coming back: a daily login streak (bigger gifts each day in a row, a chest on day 7), and a "while you were away"
// card that gathers everything that happened (guests who paid, cats back from work, a ripe garden, contest results).
(() => {
  const L = window.CatLife;
  const STREAK = [[10, 0], [15, 0], [20, 0], [25, 0], [35, 0], [45, 0], [80, 1]];    // coins, stars for day 1..7 (then it starts over)
  const STR = {
    tr: {
      hi: "Hoş geldin! 💛", away: (m) => `${m >= 1440 ? Math.floor(m / 1440) + " gün " : ""}${Math.floor(m / 60) % 24 ? (Math.floor(m / 60) % 24) + " saat " : ""}${m % 60} dakikadır yoktun.`,
      streak: (n, c, st) => `🔥 Giriş serisi: ${n}. gün! +${c}🪙${st ? ` +${st}⭐ 🎁` : ""}`, ripe: (n) => `🌱 Bahçende ${n} bitki hasada hazır`,
      quiet: "Sen yokken her şey sakindi, kediler seni bekledi 🐾", ok: "Tamam",
    },
    en: {
      hi: "Welcome back! 💛", away: (m) => `You were away for ${m >= 1440 ? Math.floor(m / 1440) + " d " : ""}${Math.floor(m / 60) % 24 ? (Math.floor(m / 60) % 24) + " h " : ""}${m % 60} min.`,
      streak: (n, c, st) => `🔥 Login streak: day ${n}! +${c}🪙${st ? ` +${st}⭐ 🎁` : ""}`, ripe: (n) => `🌱 ${n} plants are ready to harvest`,
      quiet: "All was quiet while you were away; the cats waited for you 🐾", ok: "OK",
    },
  };
  const t = () => STR[L.lang] || STR.en;
  const dayStr = (d) => d.toDateString();

  // the streak: call once a day (at start and when the date changes); returns the line to show, or ""
  function streak() {
    const X = L.extra; X.streak = X.streak || { last: "", n: 0 };
    const today = new Date(), y = new Date(today.getTime() - 864e5), S = X.streak;
    if (S.last === dayStr(today)) return "";
    S.n = S.last === dayStr(y) ? S.n + 1 : 1; S.last = dayStr(today);
    const [c, st] = STREAK[(S.n - 1) % 7]; L.earn(c); L.wallet.stars += st; L.stats.bestStreak = Math.max(L.stats.bestStreak || 0, S.n);
    if (L.gainPXP) L.gainPXP(5 + Math.min(30, S.n * 2));
    L.changed(); return t().streak(S.n, c, st);
  }

  function create(o) {
    const { world, awayMin, readyCount } = o;
    let lines = [];
    L.welcomeCollect = lines;                               // the page's toasts land here for the first few seconds
    const first = streak(); if (first) lines.push(first);
    setTimeout(() => {
      L.welcomeCollect = null;
      const n = readyCount ? readyCount() : 0; if (n) lines.push(t().ripe(n));
      if (awayMin < 20 && !first && lines.length === 0) return;
      if (awayMin < 20 && lines.length === 1 && first) { o.toast(first); return; }
      show(lines);
    }, 9000);
    function show(list) {
      const s = t(), box = document.createElement("div"); box.className = "ui wb";
      box.innerHTML = `<div class="wb-card"><b>${s.hi}</b>${awayMin >= 20 ? `<small>${s.away(awayMin)}</small>` : ""}<ul>${(list.length ? list : [s.quiet]).map((x) => `<li></li>`).join("")}</ul><button type="button">${s.ok}</button></div>`;
      box.querySelectorAll("li").forEach((li, i) => { li.textContent = (list.length ? list : [s.quiet])[i]; });
      document.body.appendChild(box); world.confetti(innerWidth / 2, innerHeight / 2 - 100, 40);
      box.querySelector("button").onclick = () => { box.remove(); o.onClose && o.onClose(); };
      o.onOpen && o.onOpen();
    }
    // a new day while the app is open
    let day = dayStr(new Date());
    setInterval(() => { const d = dayStr(new Date()); if (d !== day) { day = d; const l = streak(); if (l) o.toast(l); } }, 60e3);
    return { show };
  }
  window.CatWelcome = { create, STREAK };
})();
