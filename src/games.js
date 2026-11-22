// 🎮 Mini games: scratch cards, a memory game and whack-a-mouse. Small coin prizes, capped every day.
(() => {
  const STR = {
    tr: {
      title: "Oyunlar", scratch: "Kazı kazan", memory: "Hafıza", whack: "Fare yakala", laser: "Lazer avı",
      ticket: (n) => `Bilet al 🪙 ${n}`, free: "🎁 Günün bedava bileti", scratchHint: "Bilet 25🪙. Gümüş kısmı farenle kazı, üç aynı sembol = ödül! Çoğu bilet boş çıkar.",
      scratchMe: "KAZI!", again: "Yeni bilet",
      lose: "Bu sefer olmadı 🙈", win: { coins: (n) => `Tebrikler! ${n}🪙 kazandın`, food: (e, nm) => `${e} ${nm} kazandın, dolapta`, star: "İnanılmaz! Bir ⭐ kazandın" },
      memHint: "Aynı iki kartı bul, 60 saniye. Giriş 8🪙; az hamlede bitirirsen 16🪙'ye kadar kazanırsın, çok hamle zarar ettirir.", start: "Başla", fee: (n) => `Başla 🪙 ${n}`, moves: (n) => `${n} hamle`, time: (n) => `⏱ ${n}`,
      memWin: (m, c) => `Hepsini ${m} hamlede buldun! ${c ? `+${c}🪙` : "(bugünlük ödül doldu)"}`, timeUp: "Süre doldu ⏰",
      whackHint: "Delikten çıkan farelere tıkla! 25 saniye, giriş 6🪙. Her iki fareye 1🪙.", score: (n) => `🐭 ${n}`, whackEnd: (n, c) => `${n} fare yakaladın! ${c ? `+${c}🪙` : "(bugünlük ödül doldu)"}`,
      laserHint: "30 saniye: lazerle kedileri parlayan yıldızlara götür. Lazer gerekir, giriş 10🪙.", play: "Oyna", needLaser: "Önce marketten lazer al 🔴",
      today: (a, b) => `Bugün: hafızadan ${a}/15🪙 · fareden ${b}/15🪙`,
    },
    en: {
      title: "Games", scratch: "Scratch card", memory: "Memory", whack: "Whack-a-mouse", laser: "Laser hunt",
      ticket: (n) => `Buy a ticket 🪙 ${n}`, free: "🎁 Today's free ticket", scratchHint: "A ticket is 25🪙. Scratch the silver; three of a kind wins! Most tickets lose.",
      scratchMe: "SCRATCH!", again: "New ticket",
      lose: "Not this time 🙈", win: { coins: (n) => `You won ${n}🪙!`, food: (e, nm) => `You won ${e} ${nm}, it's in the cupboard`, star: "Amazing! You won a ⭐" },
      memHint: "Find the matching pairs in 60 seconds. Entry 8🪙; finish in few moves for up to 16🪙, too many moves and you lose out.", start: "Start", fee: (n) => `Start 🪙 ${n}`, moves: (n) => `${n} moves`, time: (n) => `⏱ ${n}`,
      memWin: (m, c) => `All found in ${m} moves! ${c ? `+${c}🪙` : "(today's prizes are used up)"}`, timeUp: "Time's up ⏰",
      whackHint: "Click the mice popping out of the holes! 25 seconds, entry 6🪙. 1🪙 for every two.", score: (n) => `🐭 ${n}`, whackEnd: (n, c) => `You caught ${n} mice! ${c ? `+${c}🪙` : "(today's prizes are used up)"}`,
      laserHint: "30 seconds: lead the cats onto the twinkling stars with the laser. Needs the laser, entry 10🪙.", play: "Play", needLaser: "Buy the laser in the market first 🔴",
      today: (a, b) => `Today: ${a}/15🪙 from memory · ${b}/15🪙 from mice`,
    },
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const TICKET = 25, CAP = 15, FEE = { mem: 8, whack: 6, laser: 10 };     // nothing is free: every game costs coins to play
  // scratch card odds (the prize is decided when you buy the ticket)
  const PRIZES = [["none", 58], ["c10", 17], ["c20", 12], ["c40", 6], ["c100", 2.4], ["dry", 3.5], ["special", 0.6], ["c250", 0.4], ["star", 0.1]];
  const SYM = { c10: "🪙", c20: "💰", c40: "💎", c100: "👑", dry: "🥣", special: "🍣", c250: "🏆", star: "⭐" };
  const FILL = ["🐟", "🧶", "🐭", "🦋", "🌿", "🔔"];

  function create(o) {
    const { world } = o, L = window.CatLife;
    const root = document.createElement("div"); root.className = "ui mk gm"; root.hidden = true; document.body.appendChild(root);
    let tab = "scratch", ticket = null, mem = null, whack = null, msg = "";
    const t = () => STR[L.lang] || STR.en;
    const E = () => { const e = L.econToday(); e.mem = e.mem || 0; e.whack = e.whack || 0; e.freeTicket = e.freeTicket || 0; return e; };

    // ---------------- scratch card
    function buyTicket() {
      if (L.wallet.coins < TICKET) return; L.wallet.coins -= TICKET;
      const tot = PRIZES.reduce((a, p) => a + p[1], 0); let x = Math.random() * tot, k = "none";
      for (const [id, w] of PRIZES) { x -= w; if (x <= 0) { k = id; break; } }
      // the grid: three of the prize symbol if it won, otherwise never three of anything
      const pool = [...FILL, ...Object.values(SYM)], cells = [];
      if (k !== "none") cells.push(SYM[k], SYM[k], SYM[k]);
      while (cells.length < 9) { const s = pool[Math.floor(Math.random() * pool.length)]; if (cells.filter((c) => c === s).length < 2) cells.push(s); }
      for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [cells[i], cells[j]] = [cells[j], cells[i]]; }
      ticket = { k, cells, done: false, paid: false };
      L.changed(); render();
    }
    function payTicket() {
      if (!ticket || ticket.paid) return; ticket.paid = true; ticket.done = true;
      const k = ticket.k, s = t();
      if (k.startsWith("c")) { const n = +k.slice(1); L.earn(n); msg = s.win.coins(n); }
      else if (k === "dry") { L.pantry.dry = (L.pantry.dry || 0) + 2; msg = s.win.food("🥣", L.lang === "tr" ? "kuru mama" : "dry food"); }
      else if (k === "special") { const sp = Object.keys(L.FOOD).filter((f) => L.FOOD[f].buff); const f = sp[Math.floor(Math.random() * sp.length)]; L.pantry[f] = (L.pantry[f] || 0) + 1; msg = s.win.food(L.FOOD[f].e, f); }
      else if (k === "star") { L.wallet.stars++; msg = s.win.star; }
      else msg = s.lose;
      if (k !== "none") world.confetti(innerWidth / 2, 160, k === "star" || k === "c250" || k === "c100" ? 60 : 20);
      L.changed(); render();
    }
    function setupScratch(cv) {
      const g = cv.getContext("2d"), W = cv.width, H = cv.height;
      g.fillStyle = "#c9ccd6"; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 300; i++) { g.fillStyle = Math.random() < 0.5 ? "#b7bbc8" : "#dfe2ea"; g.fillRect(Math.random() * W, Math.random() * H, 3, 3); }
      g.fillStyle = "#8a8fa0"; g.font = '700 30px "Pixelify Sans", monospace'; g.textAlign = "center"; g.fillText(t().scratchMe, W / 2, H / 2 + 10);
      let down = false;
      const scratch = (e) => {
        if (!down || ticket.done) return; const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * H / r.height;
        g.globalCompositeOperation = "destination-out"; g.beginPath(); g.arc(x, y, 26, 0, 7); g.fill(); g.globalCompositeOperation = "source-over";
        const d = g.getImageData(0, 0, W, H).data; let clear = 0; for (let i = 3; i < d.length; i += 64) if (d[i] === 0) clear++;
        if (clear / (d.length / 64) > 0.5) { g.clearRect(0, 0, W, H); payTicket(); }
      };
      cv.addEventListener("pointerdown", (e) => { down = true; cv.setPointerCapture(e.pointerId); scratch(e); });
      cv.addEventListener("pointermove", scratch);
      cv.addEventListener("pointerup", () => { down = false; });
    }

    // ---------------- memory
    const pay = (n) => { if (L.wallet.coins < n) return false; L.wallet.coins -= n; L.changed(); return true; };
    function startMemory() {
      const faces = ["🐱", "🐟", "🧶", "🐭", "🦋", "🍗"], cards = [...faces, ...faces].sort(() => Math.random() - 0.5);
      mem = { cards, open: [], found: [], moves: 0, end: Date.now() + 60e3, over: false }; msg = ""; render();
    }
    function flip(i) {
      if (!mem || mem.over || mem.open.length >= 2 || mem.open.includes(i) || mem.found.includes(i)) return;
      mem.open.push(i);
      if (mem.open.length === 2) {
        mem.moves++;
        const [a, b] = mem.open;
        if (mem.cards[a] === mem.cards[b]) { mem.found.push(a, b); mem.open = []; if (mem.found.length === 12) finishMemory(true); }
        else setTimeout(() => { if (mem) { mem.open = []; render(); } }, 700);
      }
      render();
    }
    function finishMemory(won) {
      mem.over = true; const e = E(), s = t();
      if (won) { const c = Math.max(0, Math.min(Math.max(3, 16 - (mem.moves - 6)), CAP - e.mem)); e.mem += c; if (c) L.earn(c); msg = s.memWin(mem.moves, c); world.confetti(innerWidth / 2, 160, 16); }
      else msg = s.timeUp;
      L.changed(); render();
    }

    // ---------------- whack-a-mouse
    function startWhack() {
      whack = { score: 0, end: Date.now() + 25e3, holes: Array(9).fill(0), over: false, next: Date.now() + 500 }; msg = ""; render();
    }
    function tickWhack() {
      if (!whack || whack.over) return; const now = Date.now();
      if (now >= whack.end) {
        whack.over = true; const e = E(), c = Math.max(0, Math.min(Math.floor(whack.score / 2), CAP - e.whack)); e.whack += c; if (c) L.earn(c);
        msg = t().whackEnd(whack.score, c); L.changed(); render(); return;
      }
      whack.holes = whack.holes.map((h) => (h && h < now ? 0 : h));
      if (now >= whack.next) {
        const free = whack.holes.map((h, i) => (h ? -1 : i)).filter((i) => i >= 0), i = free[Math.floor(Math.random() * free.length)];
        const left = (whack.end - now) / 25e3;            // faster towards the end
        if (i != null) whack.holes[i] = now + 650 + 450 * left;
        whack.next = now + 350 + 450 * left;
      }
      renderWhack();
    }
    function renderWhack() {
      const box = root.querySelector(".gm-holes"); if (!box || !whack) return;
      box.querySelectorAll("button").forEach((b, i) => { b.classList.toggle("up", !!whack.holes[i]); });
      const sc = root.querySelector(".gm-score"); if (sc) sc.textContent = `${t().score(whack.score)} · ${t().time(Math.max(0, Math.ceil((whack.end - Date.now()) / 1000)))}`;
    }

    function render() {
      const s = t(), e = E();
      const tabs = [["scratch", "🎟️", s.scratch], ["memory", "🃏", s.memory], ["whack", "🐭", s.whack], ["laser", "🔴", s.laser]];
      let body = "";
      if (tab === "scratch") {
        body = `<p class="mk-note">${esc(s.scratchHint)}</p>
          ${ticket ? `<div class="gm-ticket"><div class="gm-grid">${ticket.cells.map((c) => `<span>${c}</span>`).join("")}</div>${ticket.done ? "" : `<canvas width="480" height="480"></canvas>`}</div>` : `<div class="gm-ticket empty">🎟️</div>`}
          <div class="gm-row"><button type="button" class="mk-buy big" data-g="ticket"${L.wallet.coins < TICKET || (ticket && !ticket.done) ? " disabled" : ""}>${esc(s.ticket(TICKET))}</button></div>`;
      } else if (tab === "memory") {
        body = `<p class="mk-note">${esc(s.memHint)}</p>${mem ? `<div class="gm-score">${esc(s.moves(mem.moves))} · <span class="gm-time"></span></div>
          <div class="gm-cards">${mem.cards.map((c, i) => `<button type="button" data-card="${i}" class="${mem.found.includes(i) ? "found" : mem.open.includes(i) ? "open" : ""}">${mem.found.includes(i) || mem.open.includes(i) ? c : "🐾"}</button>`).join("")}</div>` : ""}
          <div class="gm-row"><button type="button" class="mk-buy big" data-g="mem"${(mem && !mem.over) || L.wallet.coins < FEE.mem ? " disabled" : ""}>${esc(s.fee(FEE.mem))}</button></div>`;
      } else if (tab === "whack") {
        body = `<p class="mk-note">${esc(s.whackHint)}</p>${whack ? `<div class="gm-score"></div><div class="gm-holes">${Array(9).fill(0).map((_, i) => `<button type="button" data-hole="${i}"><i>🐭</i></button>`).join("")}</div>` : ""}
          <div class="gm-row"><button type="button" class="mk-buy big" data-g="whack"${(whack && !whack.over) || L.wallet.coins < FEE.whack ? " disabled" : ""}>${esc(s.fee(FEE.whack))}</button></div>`;
      } else {
        body = `<p class="mk-note">${esc(s.laserHint)}</p><div class="gm-row"><button type="button" class="mk-buy big" data-g="laser"${L.hasToy("laser") && L.wallet.coins < FEE.laser ? " disabled" : ""}>${esc(L.hasToy("laser") ? s.fee(FEE.laser) : "🔒 " + s.play)}</button></div>`;
      }
      root.innerHTML = `<div class="mk-head gm-head"><b>🎮 ${esc(s.title)}</b><span class="mk-wal"><span class="coin">🪙 ${L.wallet.coins}</span><span class="star">⭐ ${L.wallet.stars}</span></span><button type="button" class="st-x" data-a="close">×</button></div>
        <div class="mk-tabs">${tabs.map(([id, em, l]) => `<button type="button" data-tab="${id}" class="${tab === id ? "on" : ""}">${em} ${esc(l)}</button>`).join("")}</div>
        ${msg ? `<div class="mk-result">${esc(msg)}</div>` : ""}<div class="mk-body">${body}<p class="mk-today">${esc(s.today(e.mem, e.whack))}</p></div>`;
      const cv = root.querySelector(".gm-ticket canvas"); if (cv) setupScratch(cv);
      renderWhack(); tickTime();
    }
    function tickTime() { const el = root.querySelector(".gm-time"); if (el && mem) { const left = Math.max(0, Math.ceil((mem.end - Date.now()) / 1000)); el.textContent = t().time(left); if (!left && !mem.over) finishMemory(false); } }

    root.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b || b.disabled) return;
      if (b.dataset.a === "close") return close();
      if (b.dataset.tab) { tab = b.dataset.tab; msg = ""; return render(); }
      if (b.dataset.g === "ticket") { msg = ""; return buyTicket(); }
      if (b.dataset.g === "mem") { if (!pay(FEE.mem)) return; return startMemory(); }
      if (b.dataset.g === "whack") { if (!pay(FEE.whack)) return; return startWhack(); }
      if (b.dataset.g === "laser") { if (!L.hasToy("laser")) { msg = t().needLaser; return render(); } if (!pay(FEE.laser)) return; close(); o.playLaser(); return; }
      if (b.dataset.card != null) return flip(+b.dataset.card);
      if (b.dataset.hole != null && whack && !whack.over) { const i = +b.dataset.hole; if (whack.holes[i]) { whack.holes[i] = 0; whack.score++; b.classList.add("hit"); setTimeout(() => b.classList.remove("hit"), 200); renderWhack(); } }
    });
    let loop = 0, placeT = 0;
    function place() {
      if (window.CatCard.beside(root)) return;
      const w = root.offsetWidth, h = root.offsetHeight; root.style.height = "";
      root.style.left = `${Math.max(8, innerWidth - w - 14)}px`; root.style.top = `${Math.max(8, innerHeight - h - 90)}px`;
      root.style.right = "auto"; root.style.bottom = "auto"; root.style.setProperty("--maxh", `${innerHeight - 16}px`);
    }
    function open(which) { if (which) tab = which; msg = ""; root.hidden = false; render(); place(); clearInterval(loop); loop = setInterval(() => { tickWhack(); tickTime(); }, 60); clearInterval(placeT); placeT = setInterval(place, 500); o.onOpen && o.onOpen(); }
    function close() { root.hidden = true; clearInterval(loop); clearInterval(placeT); if (ticket && !ticket.done) payTicket(); o.onClose && o.onClose(); }
    addEventListener("keydown", (e) => { if (e.key === "Escape" && !root.hidden) close(); });
    return { open, close, get isOpen() { return !root.hidden; } };
  }
  window.CatGames = { create };
})();
