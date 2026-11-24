// 🌍 Art for the world: the animals of every region (drawn in pixels from a few simple body plans), and the park scenes
// (beach and ocean, polar snow, jungle river, desert dunes, savanna, mountains, taiga, fjord, steppe, pampas, sakura, bamboo, outback, med coast, city park).
(() => {
  // ------------------------------------------------------------------ animals
  // every animal is drawn facing right with its feet at (0,0); p(dx, dy, w, h, colour) puts a block of pixels
  const shade = (hex, f) => { const n = parseInt(hex.slice(1), 16); const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(f < 1 ? v * f : v + (255 - v) * (f - 1))))); return `rgb(${c})`; };

  // a four-legged animal
  function quad(o) {
    return (p, t, st) => {
      const L = o.len || 14, H = o.h || 6, lg = o.leg || 5, col = o.col, dk = o.dk || shade(col, 0.7), sw = st === "walk" ? Math.round(Math.sin(t * 9) * 1.2) : 0, legc = o.sock || col;
      const top = -lg - H, graze = st === "graze" ? 1 : 0;
      p(-L / 2 + 1 + sw, -lg, 2, lg, dk); p(L / 2 - 3 - sw, -lg, 2, lg, dk);                                          // far legs
      // tail
      const tx = -L / 2, ty = top + 1;
      if (o.tail === "bushy") { p(tx - 4, ty, 4, 3, col); p(tx - 5, ty + 1, 2, 3, col); if (o.tip) p(tx - 6, ty + 3, 2, 2, o.tip); }
      else if (o.tail === "tuft") { p(tx - 3, ty, 3, 1, col); p(tx - 3, ty, 1, 4, col); p(tx - 4, ty + 4, 2, 2, o.tuftc || dk); }
      else if (o.tail === "short") p(tx - 1, ty - 1, 2, 2, col);
      else if (o.tail === "flat") p(tx - 5, -lg - 2, 6, 2, dk);
      else if (o.tail === "long") { for (let i = 0; i < 7; i++) p(tx - 1 - i, ty + Math.round(Math.sin(i / 2 + t * 2) * 0.8) + (i > 4 ? i - 4 : 0), 1, 1, i % 2 && o.ring ? o.ring : col); }
      else if (o.tail === "horse") { p(tx - 2, ty, 2, 2, o.mane || dk); p(tx - 3, ty + 1, 2, 6, o.mane || dk); }
      else if (o.tail !== "none") { p(tx - 3, ty, 3, 1, col); p(tx - 3, ty, 1, 3, col); }
      // body
      p(-L / 2, top, L, H, col); p(-L / 2 + 1, top - 1, L - 2, 1, col);
      if (o.hump) p(-3, top - o.hump, 6, o.hump, col);
      if (o.hump2) p(-L / 2 + 2, top - o.hump2, 4, o.hump2, col);
      if (o.belly) p(-L / 2 + 2, -lg - 2, L - 4, 2, o.belly);
      if (o.stripes) for (let x = -L / 2 + 1; x < L / 2 - 1; x += 3) p(x, top, 1, H - 1, o.stripes);
      if (o.spots) for (let i = 0; i < L * H / 8; i++) { const x = -L / 2 + 1 + ((i * 7) % (L - 2)), y = top + ((i * 5) % (H - 1)); p(x, y, o.big ? 2 : 1, 1, o.spots); }
      if (o.patch) p(-L / 2 + 3, top + 1, 4, H - 2, o.patch);
      if (o.saddle) p(-2, top - 1, 5, 2, o.saddle);
      if (o.hair) for (let x = -L / 2; x < L / 2; x += 2) p(x, -lg - 1, 1, 2, o.hair);
      // near legs
      p(-L / 2 + 2 - sw, -lg, 2, lg, legc); p(L / 2 - 2 + sw, -lg, 2, lg, legc);
      if (o.hoof) { p(-L / 2 + 2 - sw, -1, 2, 1, o.hoof); p(L / 2 - 2 + sw, -1, 2, 1, o.hoof); }
      // neck and head
      const nk = o.neck || 0, hw = (o.head || [4, 4])[0], hh = (o.head || [4, 4])[1];
      let hx = L / 2 - 2, hy = top + 2;                                                     // hy = bottom of the head
      if (nk) { const nx = L / 2 - 3; p(nx, top - nk + graze * nk, 3, nk + 1, col); if (o.mane) p(nx - 1, top - nk + graze * nk, 1, nk, o.mane); hx = nx; hy = top - nk + 3 + graze * nk; }
      if (graze && !nk) hy = -lg - 1 + hh;
      if (o.lmane) p(hx - 3, hy - hh - 2, hw + 3, hh + 4, o.lmane);                       // a big lion's mane behind the head
      if (o.ear === "flap") p(hx - 1, hy - hh, 3, hh + 2, dk);
      p(hx, hy - hh, hw, hh, o.headc || col);
      const sn = o.snout || 0; if (sn) p(hx + hw, hy - 2 - (o.snup || 0), sn, 2, o.snc || o.headc || col);
      p(hx + hw + sn - 1, hy - 2 - (o.snup || 0), 1, 1, o.nose || "#2a2024");
      p(hx + hw - 2, hy - hh + 1, 1, 1, "#141018");
      if (o.mask) p(hx + hw - 2, hy - hh + 1, 2, 2, o.mask);
      const ec = o.earc || dk;
      if (o.ear === "pt") { p(hx, hy - hh - 2, 1, 2, ec); p(hx + 2, hy - hh - 2, 1, 2, ec); }
      else if (o.ear === "rd") { p(hx, hy - hh - 1, 2, 1, ec); p(hx + hw - 2, hy - hh - 1, 2, 1, ec); }
      else if (o.ear === "big") { p(hx - 1, hy - hh - 4, 2, 4, ec); p(hx + 2, hy - hh - 4, 2, 4, ec); }
      else if (o.ear === "long") { p(hx + 1, hy - hh - 3, 1, 3, ec); p(hx + 3, hy - hh - 3, 1, 3, ec); }
      const hc = o.hornc || "#e8dcc0";
      if (o.horn === "curve") { p(hx, hy - hh - 1, 3, 1, hc); p(hx - 2, hy - hh - 2, 2, 1, hc); p(hx - 3, hy - hh - 1, 1, 3, hc); }
      else if (o.horn === "up") { p(hx + 1, hy - hh - 3, 1, 3, hc); p(hx + 3, hy - hh - 3, 1, 3, hc); }
      else if (o.horn === "cow") { p(hx - 1, hy - hh - 1, 1, 1, hc); p(hx + hw, hy - hh - 1, 1, 1, hc); p(hx - 2, hy - hh - 2, 1, 1, hc); p(hx + hw + 1, hy - hh - 2, 1, 1, hc); }
      else if (o.horn === "long") { for (let i = 0; i < 7; i++) p(hx + 1 - Math.round(i * 0.6), hy - hh - 1 - i, 1, 1, hc); }
      else if (o.horn === "spiral") { for (let i = 0; i < 6; i++) p(hx + 1 + (i % 2), hy - hh - 1 - i, 1, 1, hc); }
      else if (o.horn === "antler") { p(hx, hy - hh - 3, 1, 3, hc); p(hx - 2, hy - hh - 3, 2, 1, hc); p(hx - 2, hy - hh - 5, 1, 2, hc); p(hx + 2, hy - hh - 4, 1, 4, hc); p(hx + 3, hy - hh - 5, 2, 1, hc); }
      else if (o.horn === "palm") { p(hx - 3, hy - hh - 3, 8, 2, hc); p(hx - 3, hy - hh - 5, 1, 2, hc); p(hx, hy - hh - 5, 1, 2, hc); p(hx + 3, hy - hh - 5, 1, 2, hc); }
      else if (o.horn === "ossi") { p(hx + 1, hy - hh - 2, 1, 2, dk); p(hx + 3, hy - hh - 2, 1, 2, dk); }
      if (o.nosehorn) { p(hx + hw + sn - 2, hy - 4, 1, 2, hc); p(hx + hw + sn - 3, hy - 5, 1, 1, hc); }
      if (o.trunk) { p(hx + hw, hy - 3, 2, 3, col); p(hx + hw + 1, hy, 2, lg - 1 + (st === "graze" ? 1 : 0), col); if (o.tusk) p(hx + hw, hy - 1, 2, 1, "#fbf6ea"); }
      if (o.beard) p(hx + hw - 1, hy, 2, 2, o.beard);
    };
  }
  // an animal that walks on two legs and has wings: birds that live on the ground
  function gbird(o) {
    return (p, t, st) => {
      const lg = o.leg || 3, bw = o.bw || 6, bh = o.bh || 4, col = o.col, wing = o.wing || shade(col, 0.75), sw = st === "walk" ? Math.round(Math.sin(t * 10)) : 0;
      p(-1 + sw, -lg, 1, lg, o.legc || "#e0a040"); p(1 - sw, -lg, 1, lg, o.legc || "#e0a040");
      const by = -lg - bh;
      if (o.tailc) p(-bw / 2 - 2, by, 3, o.tailLong ? 2 : 2, o.tailc);
      if (o.fan) { for (let i = 0; i < 9; i++) p(-bw / 2 - 2 - Math.round(Math.cos(i / 3) * 4), by - 5 + i, 3, 1, i % 2 ? o.fan : "#2a8a8a"); }
      p(-bw / 2, by, bw, bh, col); p(-bw / 2 + 1, by - 1, bw - 2, 1, col);
      if (o.belly) p(0, by + 1, bw / 2, bh - 1, o.belly);
      p(-bw / 2 + 1, by + 1, bw - 3, 2, wing);
      const nk = o.neck || 1, graze = st === "graze" ? Math.max(0, nk - 1) : 0, hx = bw / 2 - 2, hy = by - nk + graze;
      p(hx, hy, 2, nk + 1, o.neckc || col);
      const hs = o.hs || 3; p(hx - 1, hy - hs + 1, hs, hs, o.headc || col);
      p(hx + hs - 2, hy - hs + 2, 1, 1, "#141018");
      const bl = o.beak || [2, "#f0a030"]; p(hx + hs - 1, hy - hs + 2 + (o.beakDown || 0), bl[0], o.beakH || 1, bl[1]);
      if (o.beakDown2) p(hx + hs - 1 + bl[0] - 1, hy - hs + 3, 1, 2, bl[1]);
      if (o.crest) { p(hx - 1, hy - hs - 1, 1, 2, o.crest); p(hx, hy - hs - 2, 1, 2, o.crest); p(hx + 1, hy - hs - 1, 1, 1, o.crest); }
      if (o.comb) { p(hx, hy - hs, 2, 1, o.comb); p(hx + hs - 1, hy - hs + 3, 1, 2, o.comb); }
      if (o.cheek) p(hx, hy - hs + 2, 1, 1, o.cheek);
    };
  }
  // a bird in the air (the flap is in t)
  function fbird(o) {
    return (p, t) => {
      const col = o.col, s = o.s || 1, f = Math.sin(t * (o.slow ? 6 : 14)), up = f > 0;
      const bw = Math.round(6 * s), wl = Math.round(5 * s);
      if (o.tailc || o.tailLong) p(-bw / 2 - (o.tailLong ? 4 : 2), -1, o.tailLong ? 5 : 2, 1, o.tailc || col);
      p(-bw / 2, -2, bw, 3, col); if (o.belly) p(-bw / 2 + 1, 0, bw - 2, 1, o.belly);
      p(bw / 2 - 1, -3, 3, 3, o.headc || col); p(bw / 2 + 1, -2, 1, 1, "#141018");
      const bk = o.beak || [1, "#f0a030"]; p(bw / 2 + 2, -2, bk[0], o.beakH || 1, bk[1]);
      const wc = o.wing || shade(col, 0.75);
      if (up) { p(-1, -2 - wl, 3, wl, wc); p(-2, -2 - wl, 1, 2, wc); } else { p(-1, 1, 3, wl - 1, wc); }
      if (o.throat) p(bw / 2, 0, 2, 1, o.throat);
    };
  }
  // reptiles: low and long (crocodile, komodo, iguana), or in a shell (turtle, tortoise)
  function rept(o) {
    return (p, t, st) => {
      const L = o.len || 14, col = o.col, dk = o.dk || shade(col, 0.7), sw = st === "walk" ? Math.round(Math.sin(t * 7)) : 0;
      if (o.shell) {
        p(-L / 2 + 1 + sw, -2, 2, 2, col); p(L / 2 - 3 - sw, -2, 2, 2, col);
        p(-L / 2, -2 - o.shell, L, o.shell, o.shellc); p(-L / 2 + 1, -3 - o.shell, L - 2, 1, o.shellc);
        for (let x = -L / 2 + 2; x < L / 2 - 1; x += 3) p(x, -1 - o.shell, 1, o.shell - 1, shade(o.shellc, 0.75));
        p(L / 2, -4, 3, 3, col); p(L / 2 + 2, -4, 1, 1, "#141018"); p(-L / 2 - 1, -2, 1, 1, col);
        return;
      }
      for (let i = 0; i < (o.tail || 8); i++) p(-L / 2 - i, -2 + Math.min(1, Math.round(i / 4)), 1, Math.max(1, 2 - Math.floor(i / 4)), i % 2 ? dk : col);
      p(-L / 2 + 1 + sw, -2, 2, 2, dk); p(L / 2 - 3 - sw, -2, 2, 2, dk);
      p(-L / 2, -4, L, 3, col); if (o.ridge) for (let x = -L / 2; x < L / 2; x += 2) p(x, -5, 1, 1, o.ridge);
      if (o.belly) p(-L / 2 + 1, -2, L - 2, 1, o.belly);
      p(-L / 2 + 2 - sw, -2, 2, 2, col); p(L / 2 - 2 + sw, -2, 2, 2, col);
      const sn = o.snout || 4; p(L / 2, -4, sn, 2, col); p(L / 2, -2, sn, 1, o.jaw || dk); p(L / 2 + 1, -5, 1, 1, "#ffe066"); p(L / 2 + 2, -5, 1, 1, "#141018");
      if (o.teeth) for (let x = 1; x < sn; x += 2) p(L / 2 + x, -2, 1, 1, "#fff");
      if (o.crestc) for (let x = -L / 2 + 2; x < L / 2; x += 2) p(x, -6, 1, 2, o.crestc);
    };
  }
  // monkeys and apes: sit or knuckle-walk
  function prim(o) {
    return (p, t, st) => {
      const col = o.col, dk = o.dk || shade(col, 0.7), face = o.face || "#e8c0a0", s = o.s || 1, sw = st === "walk" ? Math.round(Math.sin(t * 8)) : 0, bw = Math.round(6 * s), bh = Math.round(7 * s);
      if (o.tail === "ring") for (let i = 0; i < 9; i++) p(-bw / 2 - 1 - (i > 3 ? i - 3 : 0), -3 - Math.min(i, 3) * 2, 1, 2, i % 2 ? "#2a2024" : "#f4f0ea");
      else if (o.tail === "long") for (let i = 0; i < 8; i++) p(-bw / 2 - 1 - Math.round(i * 0.7), -2 - Math.round(Math.sin(i / 2.2) * 4), 1, 1, col);
      p(-bw / 2 + sw, -2, 2, 2, dk); p(bw / 2 - 2 - sw, -2, 2, 2, dk);
      p(-bw / 2, -2 - bh, bw, bh, col); if (o.belly) p(-bw / 2 + 2, -bh, bw - 3, bh - 3, o.belly);
      p(bw / 2 - 1, -bh + 1, 2, Math.round(bh * (o.longArms ? 1 : 0.6)), dk);                       // an arm
      const hs = Math.round(5 * s); p(bw / 2 - 2, -2 - bh - hs + 2, hs, hs, col); p(bw / 2 - 1, -bh - hs + 2 + 1, hs - 2, hs - 2, face);
      p(bw / 2 + hs - 4, -bh - hs + 3 + 1, 1, 1, "#141018"); p(bw / 2 - 2, -bh - hs + 3, 1, 1, o.earc || face);
      if (o.nose) p(bw / 2 + hs - 2, -bh - hs + 5, 2, 2, o.nose);
      if (o.big) p(bw / 2 + hs - 3, -bh - hs + 2, 2, 3, "#ffd34d");                                // a tarsier's huge eyes
    };
  }
  // sea creatures: fish, dolphins, whales, jellyfish, seals and crabs
  function sea(kind, o = {}) {
    return (p, t) => {
      if (kind === "fish") { const c = o.col || "#ff8a3d"; p(-3, -2, 6, 3, c); p(-5, -3 + Math.round(Math.sin(t * 9)), 2, 5, o.fin || shade(c, 0.75)); p(2, -2, 1, 1, "#141018"); if (o.stripe) p(-1, -2, 1, 3, o.stripe); }
      else if (kind === "dolphin") { const c = o.col || "#7c94b4"; p(-8, -3, 15, 4, c); p(-8, 0, 13, 1, "#dfe8f2"); p(6, -2, 3, 2, c); p(-1, -6, 3, 3, c); p(-11, -5, 3, 2, c); p(-11, -1, 3, 2, c); p(5, -3, 1, 1, "#141018"); }
      else if (kind === "whale") { const c = o.col || "#3a4a66"; p(-14, -4, 26, 6, c); p(-12, 1, 22, 1, "#c8d4e4"); p(-18, -7, 4, 3, c); p(-18, -2, 4, 3, c); p(9, -3, 1, 1, "#fff"); }
      else if (kind === "jelly") { const c = o.col || "#ff9fd0", b = Math.round(Math.sin(t * 3)); p(-3, -6 + b, 7, 4, c); for (let i = 0; i < 4; i++) p(-2 + i * 2, -2 + b, 1, 3 + ((i + Math.round(t * 4)) % 2), shade(c, 0.8)); }
      else if (kind === "seal") { const c = o.col || "#8a8a96"; p(-7, -4, 13, 4, c); p(5, -6, 4, 4, c); p(8, -5, 2, 1, "#2a2024"); p(7, -5, 1, 1, "#141018"); p(-9, -2, 3, 2, c); p(1, -1, 3, 1, shade(c, 0.7)); }
      else if (kind === "crab") { const c = o.col || "#e2414e", sw = Math.round(Math.sin(t * 12)); p(-3, -3, 7, 3, c); p(-4, -1 + sw, 1, 1, c); p(4, -1 - sw, 1, 1, c); p(-5, -5, 2, 2, c); p(4, -5, 2, 2, c); p(-1, -4, 1, 1, "#141018"); p(1, -4, 1, 1, "#141018"); }
      else if (kind === "axolotl") { const c = o.col || "#ffb3c6"; p(-6, -3, 10, 3, c); p(4, -4, 4, 4, c); p(6, -3, 1, 1, "#141018"); for (const y of [-6, -4]) { p(4, y, 1, 2, "#ff6f9a"); p(7, y, 1, 2, "#ff6f9a"); } p(-9, -2, 3, 1, c); }
    };
  }
  // the kangaroo hops; the panda, koala and sloth are their own shapes
  function kangaroo(o) {
    return (p, t, st) => {
      const c = o.col || "#c47a46", hop = st === "walk" ? Math.max(0, Math.sin(t * 6)) * 5 : 0, y = -Math.round(hop);
      for (let i = 0; i < 7; i++) p(-5 - i, y - 3 + Math.round(i * 0.5), 1, 2, c);
      p(-3, y - 3, 8, 3, c); p(-4, y - 10, 6, 8, c); p(-2, y - 8, 4, 5, o.belly || "#e8c8a0"); p(1, y - 7, 2, 2, shade(c, 0.7));
      p(0, y - 15, 4, 5, c); p(4, y - 13, 3, 2, c); p(6, y - 13, 1, 1, "#2a2024"); p(2, y - 14, 1, 1, "#141018"); p(0, y - 18, 1, 3, c); p(2, y - 18, 1, 3, c);
    };
  }
  function panda() { return quad({ len: 13, h: 7, leg: 4, col: "#f4f4f0", dk: "#1c1c22", sock: "#1c1c22", head: [5, 5], snout: 1, ear: "rd", earc: "#1c1c22", tail: "short", mask: "#1c1c22", patch: "#1c1c22" }); }
  function koala() { return (p) => { p(-3, -9, 6, 8, "#9a9aa6"); p(-2, -6, 3, 4, "#d8d8e0"); p(1, -14, 6, 5, "#9a9aa6"); p(0, -15, 2, 2, "#c8c8d4"); p(6, -15, 2, 2, "#c8c8d4"); p(5, -12, 2, 2, "#2a2024"); p(3, -13, 1, 1, "#141018"); p(-4, -4, 2, 3, "#8a8a96"); }; }
  function sloth() { return (p, t) => { const s = Math.round(Math.sin(t) * 1); p(-4, -9 + s, 9, 5, "#a88a6a"); p(4, -10 + s, 4, 4, "#c8a884"); p(5, -9 + s, 2, 1, "#5a3a26"); p(-4, -4 + s, 1, 4, "#8a6a4a"); p(4, -5 + s, 1, 5, "#8a6a4a"); }; }
  function platy() { return (p) => { p(-5, -3, 10, 3, "#8a5a3a"); p(5, -3, 4, 2, "#3a3a44"); p(-8, -2, 3, 2, "#6a4a2a"); p(3, -3, 1, 1, "#141018"); }; }

  const g = (hex) => hex;
  const ANIMALS = {
    // ---- the cat family and dogs
    wolf: { tr: "Kurt", en: "Wolf", d: quad({ len: 14, h: 5, leg: 5, col: "#8a8e9c", belly: "#c8ccd6", head: [4, 4], snout: 3, ear: "pt", tail: "bushy" }) },
    fox: { tr: "Tilki", en: "Fox", d: quad({ len: 12, h: 4, leg: 4, col: "#e07a36", belly: "#f4ece0", head: [4, 3], snout: 3, ear: "pt", tail: "bushy", tip: "#f4ece0", sock: "#3a2a22" }) },
    fennec: { tr: "Çöl tilkisi", en: "Fennec fox", d: quad({ len: 10, h: 4, leg: 4, col: "#ecc890", belly: "#fbf0dc", head: [4, 3], snout: 2, ear: "big", earc: "#e0b070", tail: "bushy", tip: "#5a3a26" }) },
    lynx: { tr: "Vaşak", en: "Lynx", d: quad({ len: 13, h: 5, leg: 5, col: "#c8a070", spots: "#8a6040", head: [4, 4], snout: 1, ear: "pt", earc: "#2a2024", tail: "short" }) },
    lion: { tr: "Aslan", en: "Lion", d: quad({ len: 16, h: 6, leg: 5, col: "#d8a85c", head: [5, 5], snout: 2, ear: "rd", tail: "tuft", tuftc: "#7a4a22", lmane: "#9a5a26" }) },
    cheetah: { tr: "Çita", en: "Cheetah", d: quad({ len: 16, h: 4, leg: 6, col: "#e8c070", spots: "#3a2a22", head: [4, 3], snout: 1, ear: "rd", tail: "long", ring: "#3a2a22" }) },
    leopard: { tr: "Leopar", en: "Leopard", d: quad({ len: 15, h: 5, leg: 5, col: "#e0b060", spots: "#5a3a22", big: true, head: [4, 4], snout: 1, ear: "rd", tail: "long" }) },
    jaguar: { tr: "Jaguar", en: "Jaguar", d: quad({ len: 15, h: 6, leg: 5, col: "#d8a050", spots: "#3a2a22", big: true, head: [5, 4], snout: 1, ear: "rd", tail: "long" }) },
    snowleo: { tr: "Kar leoparı", en: "Snow leopard", d: quad({ len: 15, h: 5, leg: 5, col: "#e4e4e8", spots: "#6a6a74", big: true, head: [4, 4], snout: 1, ear: "rd", tail: "long", ring: "#6a6a74" }) },
    tiger: { tr: "Kaplan", en: "Tiger", d: quad({ len: 16, h: 6, leg: 5, col: "#f08a30", stripes: "#2a2024", belly: "#f8eedc", head: [5, 4], snout: 1, ear: "rd", tail: "long", ring: "#2a2024" }) },
    marten: { tr: "Sansar", en: "Marten", d: quad({ len: 12, h: 3, leg: 3, col: "#7a4a2a", belly: "#f0d090", head: [3, 3], snout: 2, ear: "rd", tail: "bushy" }) },
    // ---- bears and their friends
    bear: { tr: "Boz ayı", en: "Brown bear", d: quad({ len: 16, h: 8, leg: 4, col: "#7a5236", head: [5, 5], snout: 2, snc: "#a8805a", ear: "rd", tail: "short" }) },
    polarbear: { tr: "Kutup ayısı", en: "Polar bear", d: quad({ len: 17, h: 8, leg: 4, col: "#f4f4ee", dk: "#d0d4dc", head: [5, 4], snout: 3, ear: "rd", tail: "short" }) },
    panda: { tr: "Panda", en: "Panda", d: panda() },
    raccoon: { tr: "Rakun", en: "Raccoon", d: quad({ len: 11, h: 4, leg: 3, col: "#8a8a96", head: [4, 3], snout: 2, ear: "pt", tail: "long", ring: "#2a2024", mask: "#2a2024" }) },
    beaver: { tr: "Kunduz", en: "Beaver", d: quad({ len: 12, h: 5, leg: 2, col: "#8a5a32", head: [4, 4], snout: 1, ear: "rd", tail: "flat" }) },
    capybara: { tr: "Kapibara", en: "Capybara", d: quad({ len: 13, h: 6, leg: 3, col: "#a87a4e", head: [5, 4], snout: 1, ear: "rd", tail: "none" }) },
    tapir: { tr: "Tapir", en: "Tapir", d: quad({ len: 15, h: 6, leg: 4, col: "#3a3a44", patch: "#e8e8e8", head: [4, 4], snout: 3, snup: -1, ear: "rd", tail: "short" }) },
    boar: { tr: "Yaban domuzu", en: "Wild boar", d: quad({ len: 13, h: 6, leg: 3, col: "#5a4a3a", head: [4, 4], snout: 2, ear: "pt", tail: "thin", tusk: true }) },
    // ---- hooves
    horse: { tr: "At", en: "Horse", d: quad({ len: 16, h: 6, leg: 7, col: "#8a5230", neck: 5, mane: "#3a2418", head: [5, 3], snout: 2, ear: "pt", tail: "horse", hoof: "#2a2024" }) },
    cow: { tr: "İnek", en: "Cow", d: quad({ len: 16, h: 7, leg: 5, col: "#f4f4ee", spots: "#2a2024", big: true, head: [4, 4], snout: 2, snc: "#f0b0b0", ear: "rd", horn: "cow", tail: "tuft" }) },
    bull: { tr: "Boğa", en: "Bull", d: quad({ len: 16, h: 8, leg: 5, col: "#3a2a22", head: [5, 4], snout: 2, ear: "rd", horn: "cow", hornc: "#f4ece0", tail: "tuft" }) },
    bison: { tr: "Bizon", en: "Bison", d: quad({ len: 17, h: 8, leg: 4, col: "#5a3a22", hump: 3, head: [5, 5], snout: 1, ear: "rd", horn: "cow", hornc: "#2a2024", beard: "#3a2418", tail: "tuft" }) },
    aurochs: { tr: "Yaban öküzü", en: "Aurochs", d: quad({ len: 17, h: 8, leg: 5, col: "#2a2020", saddle: "#c8a070", head: [5, 4], snout: 2, ear: "rd", horn: "curve", tail: "tuft" }) },
    buffalo: { tr: "Manda", en: "Water buffalo", d: quad({ len: 17, h: 7, leg: 4, col: "#4a4a54", head: [5, 4], snout: 2, ear: "rd", horn: "curve", hornc: "#8a8a8a", tail: "tuft" }) },
    kouprey: { tr: "Kouprey", en: "Kouprey", d: quad({ len: 16, h: 7, leg: 5, col: "#5a5a5a", sock: "#e8e8e8", head: [5, 4], snout: 2, ear: "rd", horn: "up", tail: "tuft" }) },
    yak: { tr: "Yak", en: "Yak", d: quad({ len: 16, h: 8, leg: 3, col: "#3a2a22", hair: "#2a1e18", hump: 2, head: [5, 4], snout: 1, ear: "rd", horn: "curve", hornc: "#e8e0d0", tail: "bushy" }) },
    takin: { tr: "Takin", en: "Takin", d: quad({ len: 15, h: 8, leg: 4, col: "#d8b060", head: [6, 5], snout: 2, snc: "#3a2a22", ear: "rd", horn: "curve", hornc: "#3a2a22", tail: "short" }) },
    camel: { tr: "Deve", en: "Camel", d: quad({ len: 16, h: 6, leg: 8, col: "#d8aa6a", hump: 4, neck: 6, head: [4, 3], snout: 2, ear: "rd", tail: "tuft" }) },
    llama: { tr: "Lama", en: "Llama", d: quad({ len: 12, h: 6, leg: 7, col: "#f0e6d4", hair: "#e0d4c0", neck: 8, head: [4, 3], snout: 2, ear: "long", tail: "short" }) },
    giraffe: { tr: "Zürafa", en: "Giraffe", d: quad({ len: 14, h: 6, leg: 11, col: "#f0c060", spots: "#a8682a", big: true, neck: 14, mane: "#a8682a", head: [4, 3], snout: 2, ear: "rd", horn: "ossi", tail: "tuft" }) },
    okapi: { tr: "Okapi", en: "Okapi", d: quad({ len: 15, h: 6, leg: 7, col: "#5a2a22", sock: "#f4ece0", neck: 5, head: [4, 3], snout: 2, ear: "big", horn: "ossi", tail: "tuft" }) },
    zebra: { tr: "Zebra", en: "Zebra", d: quad({ len: 15, h: 6, leg: 7, col: "#f8f8f4", stripes: "#1c1c22", neck: 5, mane: "#1c1c22", head: [5, 3], snout: 2, ear: "pt", tail: "horse", hoof: "#1c1c22" }) },
    deer: { tr: "Geyik", en: "Deer", d: quad({ len: 13, h: 5, leg: 7, col: "#b07a46", belly: "#f4e6d0", neck: 4, head: [4, 3], snout: 2, ear: "pt", horn: "antler", hornc: "#d8c8a8", tail: "short" }) },
    reindeer: { tr: "Ren geyiği", en: "Reindeer", d: quad({ len: 14, h: 6, leg: 6, col: "#8a6a4a", belly: "#f4ece0", neck: 4, head: [4, 3], snout: 2, ear: "pt", horn: "antler", hornc: "#e8dcc0", tail: "short" }) },
    moose: { tr: "Mus geyiği", en: "Moose", d: quad({ len: 17, h: 7, leg: 8, col: "#4a3426", hump: 2, neck: 3, head: [5, 4], snout: 3, ear: "pt", horn: "palm", hornc: "#d8c8a8", beard: "#3a2418", tail: "short" }) },
    gazelle: { tr: "Ceylan", en: "Gazelle", d: quad({ len: 12, h: 4, leg: 7, col: "#d8a060", belly: "#fbf0dc", stripes: null, neck: 3, head: [3, 3], snout: 2, ear: "pt", horn: "up", hornc: "#3a2a22", tail: "short" }) },
    springbok: { tr: "Springbok", en: "Springbok", d: quad({ len: 12, h: 4, leg: 7, col: "#c88a4a", belly: "#fbf6ea", neck: 3, head: [3, 3], snout: 2, ear: "pt", horn: "spiral", hornc: "#2a2024", tail: "short" }) },
    antelope: { tr: "Antilop", en: "Antelope", d: quad({ len: 14, h: 5, leg: 7, col: "#a86a3a", belly: "#f4e6d0", neck: 3, head: [4, 3], snout: 2, ear: "pt", horn: "spiral", hornc: "#2a2024", tail: "short" }) },
    oryx: { tr: "Oryx", en: "Oryx", d: quad({ len: 14, h: 5, leg: 7, col: "#f0ece4", sock: "#e8e0d4", saddle: "#c8a070", neck: 3, head: [4, 3], snout: 2, ear: "pt", horn: "long", hornc: "#2a2024", mask: "#2a2024", tail: "tuft" }) },
    ibex: { tr: "Dağ keçisi", en: "Ibex", d: quad({ len: 13, h: 5, leg: 6, col: "#a8865a", neck: 2, head: [4, 3], snout: 2, ear: "pt", horn: "curve", hornc: "#5a4a3a", beard: "#5a4a3a", tail: "short" }) },
    markhor: { tr: "Markhor", en: "Markhor", d: quad({ len: 13, h: 5, leg: 6, col: "#c8b090", hair: "#e8dcc8", neck: 2, head: [4, 3], snout: 2, ear: "pt", horn: "spiral", hornc: "#6a5a4a", beard: "#e8dcc8", tail: "short" }) },
    mouflon: { tr: "Muflon", en: "Mouflon", d: quad({ len: 13, h: 5, leg: 6, col: "#8a4a2a", saddle: "#f0e0c8", neck: 2, head: [4, 3], snout: 2, ear: "pt", horn: "curve", hornc: "#c8b890", tail: "short" }) },
    goat: { tr: "Keçi", en: "Goat", d: quad({ len: 12, h: 5, leg: 5, col: "#f0ece4", neck: 2, head: [4, 3], snout: 2, ear: "long", horn: "up", beard: "#e0d8c8", tail: "short" }) },
    sheep: { tr: "Koyun", en: "Sheep", d: quad({ len: 12, h: 6, leg: 4, col: "#f4f0e6", headc: "#2a2024", head: [3, 3], snout: 1, ear: "rd", tail: "short" }) },
    elephant: { tr: "Fil", en: "Elephant", d: quad({ len: 20, h: 10, leg: 7, col: "#9a9aa6", head: [6, 6], ear: "flap", trunk: true, tusk: true, tail: "thin" }) },
    rhino: { tr: "Gergedan", en: "Rhino", d: quad({ len: 19, h: 8, leg: 4, col: "#8a8e96", head: [5, 4], snout: 3, ear: "pt", nosehorn: true, hornc: "#c8c0b0", tail: "thin" }) },
    hippo: { tr: "Su aygırı", en: "Hippo", d: quad({ len: 19, h: 8, leg: 3, col: "#8a7684", belly: "#d8a8b0", head: [6, 5], snout: 2, ear: "rd", tail: "short" }) },
    pygmyhippo: { tr: "Cüce su aygırı", en: "Pygmy hippo", d: quad({ len: 13, h: 6, leg: 3, col: "#6a5a66", belly: "#c898a0", head: [5, 4], snout: 1, ear: "rd", tail: "short" }) },
    kangaroo: { tr: "Kanguru", en: "Kangaroo", d: kangaroo({}) },
    koala: { tr: "Koala", en: "Koala", d: koala() },
    sloth: { tr: "Tembel hayvan", en: "Sloth", d: sloth() },
    platypus: { tr: "Ornitorenk", en: "Platypus", d: platy() },
    // ---- primates
    macaque: { tr: "Japon makağı", en: "Snow monkey", d: prim({ col: "#b0a090", face: "#ff8a8a", tail: "none" }) },
    chimp: { tr: "Şempanze", en: "Chimpanzee", d: prim({ col: "#2a2024", face: "#c8a080", longArms: true, tail: "none" }) },
    gorilla: { tr: "Goril", en: "Gorilla", d: prim({ col: "#2a2830", face: "#4a4048", s: 1.4, longArms: true, tail: "none", belly: "#4a4650" }) },
    orangutan: { tr: "Orangutan", en: "Orangutan", d: prim({ col: "#c0602a", face: "#a87060", s: 1.2, longArms: true, tail: "none" }) },
    proboscis: { tr: "Hortumlu maymun", en: "Proboscis monkey", d: prim({ col: "#d0905a", face: "#f0c0a0", nose: "#e8906a", tail: "long" }) },
    tarsier: { tr: "Tarsier", en: "Tarsier", d: prim({ col: "#b08a6a", face: "#c8a080", s: 0.8, big: true, tail: "long" }) },
    lemur: { tr: "Lemur", en: "Lemur", d: prim({ col: "#9a9aa6", face: "#f4f0ea", tail: "ring" }) },
    monkey: { tr: "Maymun", en: "Monkey", d: prim({ col: "#8a5a32", face: "#e8c0a0", tail: "long" }) },
    // ---- reptiles and friends
    crocodile: { tr: "Timsah", en: "Crocodile", d: rept({ len: 18, col: "#4f7a3a", ridge: "#3a5a2a", snout: 6, teeth: true, tail: 10 }) },
    komodo: { tr: "Komodo ejderi", en: "Komodo dragon", d: rept({ len: 16, col: "#7a7262", snout: 4, tail: 9 }) },
    iguana: { tr: "İguana", en: "Iguana", d: rept({ len: 11, col: "#5fae54", crestc: "#3f8a3a", snout: 2, tail: 9 }) },
    turtle: { tr: "Deniz kaplumbağası", en: "Sea turtle", d: rept({ len: 12, col: "#8ab070", shell: 3, shellc: "#6a8a3a" }) },
    tortoise: { tr: "Dev kaplumbağa", en: "Giant tortoise", d: rept({ len: 16, col: "#8a8070", shell: 6, shellc: "#5a5040" }) },
    axolotl: { tr: "Aksolotl", en: "Axolotl", d: sea("axolotl") },
    // ---- birds on the ground
    rooster: { tr: "Horoz", en: "Rooster", d: gbird({ col: "#c8402a", wing: "#3a5a8a", tailc: "#1c3a2a", comb: "#ff3030", neck: 2, beak: [1, "#f0c030"] }) },
    ostrich: { tr: "Devekuşu", en: "Ostrich", d: gbird({ col: "#2a2024", wing: "#f4f0ea", leg: 9, bw: 9, bh: 6, neck: 9, neckc: "#e8b0a0", headc: "#e8b0a0", legc: "#e8b0a0", beak: [2, "#e8c0a0"] }) },
    rhea: { tr: "Nandu", en: "Rhea", d: gbird({ col: "#9a9086", leg: 8, bw: 8, bh: 6, neck: 7, beak: [2, "#c8b0a0"], legc: "#b0a090" }) },
    emu: { tr: "Emu", en: "Emu", d: gbird({ col: "#6a5a4a", leg: 8, bw: 8, bh: 6, neck: 7, headc: "#5a7a9a", beak: [2, "#3a3a3a"], legc: "#5a5a5a" }) },
    flamingo: { tr: "Flamingo", en: "Flamingo", d: gbird({ col: "#ff9ab0", wing: "#ff6f8f", leg: 10, bw: 6, bh: 4, neck: 8, beak: [2, "#2a2024"], beakDown2: true, legc: "#ff8aa0" }) },
    stork: { tr: "Leylek", en: "Stork", d: gbird({ col: "#f6f6fa", wing: "#1c1c22", leg: 9, bw: 7, bh: 4, neck: 4, beak: [4, "#e2414e"], legc: "#e2414e" }) },
    craneb: { tr: "Taçlı turna", en: "Crowned crane", d: gbird({ col: "#6a6a7a", wing: "#f4f0ea", leg: 9, bw: 7, bh: 4, neck: 5, crest: "#f0c040", cheek: "#ff4040", beak: [2, "#2a2024"], legc: "#2a2024" }) },
    shoebill: { tr: "Pabuçgagalı", en: "Shoebill", d: gbird({ col: "#8a96a6", leg: 9, bw: 8, bh: 6, neck: 3, hs: 4, beak: [4, "#c8b080"], beakH: 2, legc: "#3a3a44" }) },
    ibis: { tr: "Kırmızı ibis", en: "Scarlet ibis", d: gbird({ col: "#ff4a3a", leg: 7, bw: 6, bh: 4, neck: 3, beak: [4, "#c83a2a"], beakDown2: true, legc: "#ff4a3a" }) },
    pelican: { tr: "Pelikan", en: "Pelican", d: gbird({ col: "#f4f4f0", wing: "#c8c8d0", leg: 4, bw: 9, bh: 6, neck: 3, hs: 3, beak: [5, "#f0b040"], beakH: 2, legc: "#e0a040" }) },
    penguin: { tr: "Penguen", en: "Penguin", d: gbird({ col: "#1c1c22", belly: "#f8f8f4", wing: "#1c1c22", leg: 1, bw: 6, bh: 8, neck: 0, hs: 4, beak: [2, "#f0a030"], legc: "#f0a030" }) },
    puffin: { tr: "Deniz papağanı", en: "Puffin", d: gbird({ col: "#1c1c22", belly: "#f8f8f4", leg: 2, bw: 5, bh: 5, neck: 0, hs: 4, headc: "#f4f4f0", beak: [2, "#ff7a30"], beakH: 2, legc: "#ff7a30" }) },
    kiwi: { tr: "Kivi", en: "Kiwi", d: gbird({ col: "#8a6a4a", leg: 2, bw: 8, bh: 6, neck: 0, hs: 3, beak: [5, "#e8d8b0"], legc: "#c8a878" }) },
    dodo: { tr: "Dodo", en: "Dodo", d: gbird({ col: "#9a9aa6", wing: "#7a7a86", leg: 3, bw: 9, bh: 7, neck: 1, hs: 5, beak: [3, "#e8d080"], beakH: 2, tailc: "#f4f0ea", legc: "#e8d080" }) },
    peacock: { tr: "Tavus kuşu", en: "Peacock", d: gbird({ col: "#1a6aa8", wing: "#2a8a6a", leg: 4, bw: 6, bh: 4, neck: 4, crest: "#1a6aa8", fan: "#3faa6a", beak: [1, "#c8c0a0"] }) },
    hoopoe: { tr: "İbibik", en: "Hoopoe", d: gbird({ col: "#d89a5a", wing: "#2a2024", leg: 2, bw: 5, bh: 3, neck: 1, crest: "#d89a5a", beak: [3, "#2a2024"], legc: "#5a5a5a" }) },
    swan: { tr: "Kuğu", en: "Swan", d: gbird({ col: "#fbfbfd", leg: 1, bw: 9, bh: 4, neck: 6, beak: [2, "#ff8a30"], legc: "#2a2024" }) },
    dove: { tr: "Güvercin", en: "Dove", d: gbird({ col: "#e8e8f0", wing: "#c8c8d8", leg: 2, bw: 5, bh: 3, neck: 1, beak: [1, "#e8a0a0"], legc: "#ff8a8a" }) },
    // ---- birds in the air
    eagle: { tr: "Kartal", en: "Eagle", fly: true, d: fbird({ col: "#6a4a2a", headc: "#f4f4f0", beak: [2, "#f0c030"], s: 1.6, slow: true }) },
    falcon: { tr: "Şahin", en: "Falcon", fly: true, d: fbird({ col: "#7a6a5a", belly: "#e8dcc8", beak: [1, "#f0c030"], s: 1.2 }) },
    condor: { tr: "And kondoru", en: "Andean condor", fly: true, d: fbird({ col: "#1c1c22", wing: "#f4f0ea", headc: "#e8a090", beak: [2, "#c8b090"], s: 2, slow: true }) },
    frigatebird: { tr: "Firkateyn kuşu", en: "Frigatebird", fly: true, d: fbird({ col: "#1c1c22", throat: "#ff3030", beak: [2, "#8a8a8a"], s: 1.6, slow: true }) },
    parrot: { tr: "Papağan", en: "Parrot", fly: true, d: fbird({ col: "#3faa4a", wing: "#2a6ad8", headc: "#ffd34d", beak: [1, "#f4f0ea"] }) },
    macaw: { tr: "Ara papağanı", en: "Macaw", fly: true, d: fbird({ col: "#e2414e", wing: "#2a6ad8", headc: "#e2414e", tailLong: true, tailc: "#e2414e", beak: [2, "#f4f0ea"], s: 1.2 }) },
    toucan: { tr: "Tukan", en: "Toucan", fly: true, d: fbird({ col: "#1c1c22", throat: "#ffd34d", beak: [4, "#ff8a2e"], beakH: 2 }) },
    quetzal: { tr: "Ketzal", en: "Quetzal", fly: true, d: fbird({ col: "#2aaa6a", belly: "#e2414e", tailLong: true, tailc: "#2aaa6a", beak: [1, "#f0c030"] }) },
    hummingbird: { tr: "Sinek kuşu", en: "Hummingbird", fly: true, d: fbird({ col: "#2aaa8a", throat: "#ff3a8a", beak: [3, "#2a2024"], s: 0.7 }) },
    motmot: { tr: "Motmot", en: "Motmot", fly: true, d: fbird({ col: "#3aaa8a", headc: "#2a6ad8", tailLong: true, beak: [1, "#2a2024"] }) },
    trogon: { tr: "Trogon", en: "Trogon", fly: true, d: fbird({ col: "#2a6ad8", belly: "#e2414e", beak: [1, "#f0c030"] }) },
    troupial: { tr: "Turpiyal", en: "Troupial", fly: true, d: fbird({ col: "#ff9a2a", headc: "#1c1c22", wing: "#1c1c22", beak: [1, "#c8c8c8"] }) },
    palmchat: { tr: "Palmiye kuşu", en: "Palmchat", fly: true, d: fbird({ col: "#8a7a4a", belly: "#f0e0b0", beak: [1, "#f0c030"] }) },
    sunbird: { tr: "Güneş kuşu", en: "Sunbird", fly: true, d: fbird({ col: "#2a8aa8", belly: "#ffcf40", beak: [2, "#2a2024"], s: 0.8 }) },
    paradise: { tr: "Cennet kuşu", en: "Bird of paradise", fly: true, d: fbird({ col: "#ffcf40", headc: "#2aaa6a", tailLong: true, tailc: "#ff9a2a", beak: [1, "#c8c8c8"] }) },
    gull: { tr: "Martı", en: "Seagull", fly: true, d: fbird({ col: "#f4f4f8", wing: "#9aa6b4", beak: [2, "#f0c030"], s: 1.3, slow: true }) },
    // ---- sea
    dolphin: { tr: "Yunus", en: "Dolphin", swim: "jump", d: sea("dolphin") },
    whale: { tr: "Balina", en: "Whale", swim: "far", d: sea("whale") },
    jellyfish: { tr: "Denizanası", en: "Jellyfish", swim: "drift", d: sea("jelly") },
    seal: { tr: "Fok", en: "Seal", beach: true, d: sea("seal") },
    crab: { tr: "Yengeç", en: "Crab", beach: true, d: sea("crab") },
    fish: { tr: "Tropik balık", en: "Tropical fish", swim: "fish", d: sea("fish", { col: "#ff8a3d", stripe: "#fff" }) },
    bluefish: { tr: "Mavi balık", en: "Blue tang", swim: "fish", d: sea("fish", { col: "#3a7ad8", fin: "#ffd34d" }) },
    salmon: { tr: "Somon balığı", en: "Salmon", swim: "jump", d: sea("fish", { col: "#e88a7a", fin: "#c86a5a" }) },
    koi: { tr: "Koi balığı", en: "Koi", swim: "fish", d: sea("fish", { col: "#fbfbfd", stripe: "#ff6a3a" }) },
  };

  // draw an animal at (x, y = its feet), facing dir, with pixels k big
  function drawAnimal(ctx, id, x, y, k, t, dir = 1, st = "walk") {
    const A = ANIMALS[id]; if (!A) return;
    const p = (dx, dy, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x + (dir > 0 ? dx : -dx - w) * k), Math.round(y + dy * k), Math.ceil(w * k), Math.ceil(h * k)); };
    A.d(p, t, st);
  }
  // a small picture of an animal (for the album, the shop and plush toys); returns a canvas
  const thumbs = new Map();
  function animalThumb(id, size = 40) {
    const key = id + size; if (thumbs.has(key)) return thumbs.get(key);
    const c = document.createElement("canvas"); c.width = 48; c.height = 40; const g2 = c.getContext("2d");
    const A = ANIMALS[id]; if (A) { if (A.fly) drawAnimal(g2, id, 24, 22, 2, 0.3, 1); else if (A.swim) drawAnimal(g2, id, 24, 26, 2, 0.3, 1); else drawAnimal(g2, id, 24, 38, id === "giraffe" ? 1.1 : id === "elephant" ? 1.5 : 1.7, 0, 1, "idle"); }
    // a dark outline around it, like everything else in the game
    try { const d = g2.getImageData(0, 0, 48, 40), a = d.data, s = new Uint8Array(48 * 40); for (let i = 0; i < s.length; i++) s[i] = a[i * 4 + 3] > 0 ? 1 : 0;
      for (let y = 0; y < 40; y++) for (let x = 0; x < 48; x++) { const i = y * 48 + x; if (s[i]) continue; if ((x && s[i - 1]) || (x < 47 && s[i + 1]) || (y && s[i - 48]) || (y < 39 && s[i + 48])) { a[i * 4] = 70; a[i * 4 + 1] = 46; a[i * 4 + 2] = 34; a[i * 4 + 3] = 220; } }
      g2.putImageData(d, 0, 0); } catch (e) { /* keep it plain */ }
    thumbs.set(key, c); return c;
  }

  // ------------------------------------------------------------------ the park scenes
  // bg(g, W, H, f, k, city) draws the still picture once; front(ctx, world, dt, S) draws what moves; S holds the scene's own state.
  // water: where the sea is (fraction of the width, from the right); animals: who lives here (plus the city's own animal)
  const rnd = (a, b) => a + Math.random() * (b - a);
  const hash = (n) => { n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3); n = n ^ (n >>> 4); n = Math.imul(n, 0x27d4eb2d); return ((n ^ (n >>> 15)) >>> 0) / 4294967296; };
  function sky(g, W, f, top, bot) { const gr = g.createLinearGradient(0, f - 320, 0, f); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(0, f - 320, W, 320); }
  const fade = (g, W, f, col) => { const gr = g.createLinearGradient(0, f - 340, 0, f - 240); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, col); g.fillStyle = gr; g.fillRect(0, f - 340, W, 100); };
  function palm(px, x, f, k, h, lean = 1) {
    for (let i = 0; i < h; i++) px(x + Math.round(Math.sin(i / h * 1.2) * 4 * lean) * k, f - i * k, 3 * k, k, i % 3 ? "#8a5a3a" : "#6a4426");
    const tx = x + Math.round(Math.sin(1.2) * 4 * lean) * k, ty = f - h * k;
    for (const [dx, dy] of [[-9, 2], [-6, -2], [0, -4], [6, -2], [9, 2], [-4, 3], [4, 3]]) { for (let i = 0; i < 6; i++) px(tx + Math.round(dx * i / 6) * k, ty + Math.round(dy * i / 6 + (i * i) / 10) * k, 2 * k, k, i % 2 ? "#3f9a4a" : "#5fbe5a"); }
    px(tx, ty + k, 2 * k, 2 * k, "#7a5a2a"); px(tx + 2 * k, ty + 2 * k, 2 * k, 2 * k, "#7a5a2a");
  }
  function pine(px, x, f, k, h, snow) { px(x - k, f - 3 * k, 2 * k, 3 * k, "#5a3a26"); for (let i = 0; i < h; i++) { const tier = i % 7, w = Math.round(((h - i) * 0.55 + 1) * (1 - tier / 12)) + 1; px(x - w * k, f - (3 + i) * k, w * 2 * k, k, tier < 2 ? "#2a5a32" : "#3a7442"); px(x - w * k, f - (3 + i) * k, k, k, "#24502c"); if (snow && tier === 6 && i > h - 16) px(x - w * k + k, f - (3 + i) * k, Math.max(1, w * 2 - 2) * k, k, "#f4f8ff"); } }
  function sun(px, x, y, k, col) { for (let i = -8; i <= 8; i++) { const w = Math.round(Math.sqrt(64 - i * i)); px(x - w * k, y + i * k, w * 2 * k, k, col); } }
  function hills(g, W, f, k, col, base, amp, seed, step = 1) { g.fillStyle = col; for (let x = 0; x < W; x += k * step) { const v = Math.sin((x / k + seed) / 23) * 0.6 + Math.sin((x / k + seed * 3) / 9) * 0.25 + Math.sin((x / k + seed * 7) / 51) * 0.5; const h = base + v * amp; g.fillRect(x, Math.round(f - h * k), k * step, Math.round(h * k) + 2); } }
  function grass(px, W, f, k, top, dark, H) { px(0, f - 2 * k, W, H - f + 2 * k, top); for (let x = 0; x < W; x += 5 * k) px(x + ((x / k) % 3) * k, f - 3 * k, k, 2 * k, dark); }
  function acacia(px, x, f, k, s = 1) { const h = Math.round(22 * s); for (let i = 0; i < h; i++) px(x + Math.round(i > h * 0.6 ? (i - h * 0.6) * 0.5 : 0) * k, f - i * k, 2 * k, k, "#6a4a2a"); const tx = x + Math.round(h * 0.2) * k, ty = f - h * k; px(tx - 14 * k, ty - 3 * k, 30 * k, 4 * k, "#5a8a3a"); px(tx - 11 * k, ty - 5 * k, 24 * k, 2 * k, "#6fa84a"); px(tx - 14 * k, ty + k, 30 * k, k, "#3f6a2a"); }
  function cloudsOf(px, W, f, k, n, col = "#ffffff") { for (let i = 0; i < n; i++) { const x = hash(i * 7 + 3) * W, y = f - 230 - hash(i * 11) * 70, w = 18 + hash(i) * 20; px(x, y, w * k, 4 * k, col); px(x + 3 * k, y - 3 * k, (w - 8) * k, 3 * k, col); } }

  const BIOMES = {
    // 🌳 a city park (the one we had: the default when a city has nothing more special)
    city: { tr: "Şehir parkı", en: "City park", animals: ["dove", "fox", "swan"], bg: null },
    // 🏝️ an island: beach on the left, the ocean on the right; cats swim, sunbathe and play with a beach ball
    island: { tr: "Ada plajı", en: "Island beach", water: 0.5, props: ["parasol", "beachball", "towel", "towel2"], animals: ["crab", "turtle", "dolphin", "fish", "bluefish", "pelican", "parrot", "gull"],
      bg(g, W, H, f, k, px) {
        sky(g, W, f, "rgba(110,200,255,0)", "rgba(140,215,255,.75)"); cloudsOf(px, W, f, k, 5);
        const sx = W * (1 - this.water);
        // the sea comes right up to the sand: its surface is just a little above the beach
        px(sx, f - 8 * k, W - sx, 8 * k + H - f, "#2a9ad8"); for (let i = 0; i < 4; i++) px(sx, f - (8 - i * 2) * k, W - sx, k, ["#4ab4ea", "#3aa6e0", "#2490cc", "#1f86c0"][i]);
        px(sx, f - 9 * k, W - sx, k, "#8ad4f4");
        // the little far island with its palm, sitting on the horizon
        px(W * 0.84, f - 12 * k, 44 * k, 4 * k, "#f0d690"); px(W * 0.84 + 4 * k, f - 14 * k, 36 * k, 2 * k, "#f4dc9a"); palm(px, W * 0.86, f - 14 * k, k, 16, 1); palm(px, W * 0.84 + 30 * k, f - 13 * k, k, 11, -1);
        px(0, f - 3 * k, sx + 30 * k, H - f + 3 * k, "#f4dc9a"); for (let x = 0; x < sx; x += 7 * k) px(x + ((x / k) % 5) * k, f - 2 * k, 2 * k, k, "#e8c880");
        for (let i = 0; i < 6; i++) { const x = hash(i + 40) * (sx - 20 * k); px(x, f - k, 2 * k, k, i % 2 ? "#ff8a6a" : "#ffd0e0"); }
        px(sx - 30 * k, f - 4 * k, 60 * k, 2 * k, "#e8d090"); for (let x = sx - 26 * k; x < sx + 30 * k; x += 6 * k) px(x, f - 4 * k, 3 * k, k, "#fff");
        palm(px, W * 0.05, f, k, 30, 1); palm(px, W * 0.18, f, k, 24, -1);
      },
      front(ctx, w, dt, S) {
        const k = Math.max(2, Math.round(w.toyScale)), f = w.floor, sx = w.W * (1 - this.water); S.t = (S.t || 0) + dt;
        ctx.fillStyle = "rgba(255,255,255,.75)"; for (let i = 0; i < 9; i++) { const x = sx + ((i * 97 + S.t * 24) % (w.W - sx)), y = f - (2 + (i % 3) * 2) * k; ctx.fillRect(Math.round(x), Math.round(y), 5 * k, k); }
        const foam = Math.sin(S.t * 1.3) * 4 * k; ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.fillRect(sx - 14 * k + foam, f - 3 * k, 22 * k, k);
      } },
    // 🧊 the poles: snowy hills, igloos, an old hut, northern lights at night; it always snows a little
    polar: { tr: "Kutup", en: "Polar", snow: true, props: ["igloo"], animals: ["polarbear", "wolf", "reindeer", "seal", "penguin", "fox"],
      bg(g, W, H, f, k, px, city) {
        sky(g, W, f, "rgba(30,50,100,0)", "rgba(80,120,190,.55)");
        for (let x = 0; x < W; x += k) { const y = f - 250 * k / 3 + Math.sin(x / 70) * 22 + Math.sin(x / 23) * 6; for (let i = 0; i < 8; i++) { g.fillStyle = `rgba(${90 + i * 10},${240 - i * 8},${170 + i * 6},${0.12 - i * 0.012})`; g.fillRect(x, y + i * 4, k, 5); } }
        hills(g, W, f, k, "#b8cce6", 70, 26, 4); hills(g, W, f, k, "#dfe9f6", 34, 12, 9);
        const ig = (x, s) => { for (let i = 0; i < s; i++) { const ww = Math.round(Math.sqrt(s * s - (s - i) * (s - i)) * 2); px(x - ww / 2 * k, f - (s - i) * k, ww * k, k, i % 4 === 0 ? "#c9d8ee" : "#ffffff"); } px(x + (s - 6) * k, f - 7 * k, 8 * k, 7 * k, "#5b6f90"); px(x + (s - 5) * k, f - 6 * k, 6 * k, 6 * k, "#1e2a40"); };
        ig(W * 0.12, 16); ig(W * 0.8, 12);
        if (!city || city.id !== "antarctica") { const hx = W * 0.5; px(hx, f - 20 * k, 26 * k, 20 * k, "#6a4a32"); for (let y = 2; y < 20; y += 3) px(hx, f - y * k, 26 * k, k, "#5a3a26"); px(hx - 3 * k, f - 26 * k, 32 * k, 6 * k, "#f4f8ff"); px(hx + 8 * k, f - 14 * k, 7 * k, 6 * k, "#ffd34d"); px(hx + 18 * k, f - 10 * k, 5 * k, 10 * k, "#4a3020"); }
        else { const bx = W * 0.5; px(bx, f - 16 * k, 40 * k, 16 * k, "#e2414e"); px(bx + 4 * k, f - 12 * k, 6 * k, 5 * k, "#bfe6ff"); px(bx + 30 * k, f - 26 * k, k, 10 * k, "#5a5a5a"); px(bx + 31 * k, f - 26 * k, 8 * k, 5 * k, "#0f4c81"); }
        px(0, f - 3 * k, W, H - f + 3 * k, "#f4f8ff"); for (let x = 0; x < W; x += 9 * k) px(x + ((x / k) % 4) * k, f - 2 * k, 3 * k, k, "#dbe6f6");
        px(W * 0.3, f - 3 * k, 20 * k, 3 * k, "#c9d8ee"); px(W * 0.3 + 2 * k, f - 2 * k, 16 * k, 2 * k, "#2c5a8a");
      } },
    // 🌴 rainforest: tall trunks, lianas, flowers, a river with a crocodile, a drizzle now and then
    jungle: { tr: "Yağmur ormanı", en: "Rainforest", props: ["hammock"], animals: ["crocodile", "parrot", "macaw", "toucan", "monkey", "sloth", "tapir", "jaguar", "capybara"],
      bg(g, W, H, f, k, px) {
        fade(g, W, f, "rgba(40,100,50,.75)"); px(0, f - 240, W, 240, "rgba(40,100,50,.75)");
        for (let i = 0; i < W / (26 * k); i++) { const x = i * 26 * k + hash(i) * 10 * k; px(x, f - 240, 5 * k, 240, "#5a3a26"); px(x + k, f - 240, 2 * k, 240, "#6a4a32"); }
        for (let i = 0; i < W / k / 2.2; i++) { const x = hash(i * 3) * W, y = f - 240 + hash(i * 5) * 150; g.fillStyle = ["#3f8a3a", "#5fae54", "#2f7a3a", "#7cc46a"][i % 4]; g.fillRect(Math.round(x), Math.round(y), 6 * k, 3 * k); }
        for (let i = 0; i < W / (18 * k); i++) { const x = i * 18 * k + 10 * k, len = 40 + hash(i + 9) * 70; for (let y = 0; y < len; y += k) px(x + Math.round(Math.sin(y / 18) * 2) * k, f - 240 + y, k, k, "#4f8a3a"); px(x - k, f - 240 + len, 3 * k, 2 * k, "#5fae54"); }
        for (let i = 0; i < 22; i++) { const x = hash(i + 77) * W, y = f - 230 + hash(i + 91) * 150; px(x, y, 3 * k, 3 * k, ["#ff4f6a", "#ffd34d", "#ff8fb5"][i % 3]); px(x + k, y + k, k, k, "#fff"); }
        const rx = W * 0.55; px(rx, f - 5 * k, W * 0.3, 5 * k + H - f, "#3a7a8a"); for (let x = rx; x < rx + W * 0.3; x += 9 * k) px(x, f - 3 * k, 5 * k, k, "#6ab0c0");
        grass(px, W, f, k, "#4f8a3a", "#3a6a2a", H); px(rx, f - 2 * k, W * 0.3, 2 * k + H - f, "#3a7a8a");
        for (let i = 0; i < W / (4 * k); i++) { const x = i * 4 * k; if (x > rx && x < rx + W * 0.3) continue; px(x, f - (5 + (i % 3)) * k, k, (5 + (i % 3)) * k, "#2f6a2a"); px(x - k, f - (6 + (i % 3)) * k, 3 * k, k, "#5fae54"); }
      },
      front(ctx, w, dt, S) { const k = Math.max(2, Math.round(w.toyScale)); S.t = (S.t || 0) + dt; ctx.fillStyle = "rgba(200,230,255,.45)"; for (let i = 0; i < 40; i++) { const x = (i * 131 + S.t * 30) % w.W, y = (i * 53 + S.t * 260) % (w.floor - 40) + 40; ctx.fillRect(Math.round(x), Math.round(y), k, 3 * k); } } },
    // 🏜️ desert: dunes, an oasis with palms (pyramids in Cairo)
    desert: { tr: "Çöl", en: "Desert", props: ["parasol"], animals: ["camel", "fennec", "oryx", "falcon", "gazelle", "iguana"],
      bg(g, W, H, f, k, px, city) {
        sky(g, W, f, "rgba(255,210,140,0)", "rgba(255,220,160,.6)"); sun(px, W * 0.82, f - 260, k, "rgba(255,240,180,.9)");
        if (city && city.id === "cairo") { const pyr = (x, s) => { for (let i = 0; i < s; i++) { px(x - i * k, f - (s - i) * k, (i * 2 + 1) * k, k, i % 3 ? "#e0b866" : "#c99a4a"); px(x, f - (s - i) * k, (i + 1) * k, k, "#c9a058"); } }; pyr(W * 0.3, 60); pyr(W * 0.5, 44); pyr(W * 0.14, 34);
          // the sphinx, lying down
          const sx = W * 0.66; px(sx, f - 12 * k, 40 * k, 12 * k, "#d8b060"); px(sx + 30 * k, f - 26 * k, 12 * k, 14 * k, "#d8b060"); px(sx + 29 * k, f - 26 * k, 14 * k, 6 * k, "#3a6ad8"); px(sx + 30 * k, f - 22 * k, 2 * k, 8 * k, "#ffd34d"); px(sx + 38 * k, f - 20 * k, k, k, "#3a2a22"); }
        hills(g, W, f, k, "#e8c878", 26, 14, 2, 1); hills(g, W, f, k, "#f0d690", 12, 8, 6);
        const ox = W * 0.08; px(ox, f - 4 * k, 46 * k, 4 * k, "#4fa6d8"); palm(px, ox + 4 * k, f - 2 * k, k, 22, 1); palm(px, ox + 40 * k, f - 2 * k, k, 18, -1);
        px(0, f - 2 * k, W, H - f + 2 * k, "#f0d690"); for (let x = 0; x < W; x += 11 * k) px(x + ((x / k) % 5) * k, f - k, 4 * k, k, "#e0c070");
        for (let i = 0; i < 5; i++) { const x = W * (0.25 + i * 0.15); px(x, f - 8 * k, 2 * k, 8 * k, "#5f9a4a"); px(x - 2 * k, f - 6 * k, 2 * k, 3 * k, "#5f9a4a"); px(x + 2 * k, f - 7 * k, 2 * k, 3 * k, "#5f9a4a"); }
      },
      front(ctx, w, dt, S) { S.tw = (S.tw ?? -60) + dt * 50; if (S.tw > w.W + 60) S.tw = -60 - Math.random() * 600; const k = Math.max(2, Math.round(w.toyScale)), x = S.tw, y = w.floor - 6 * k - Math.abs(Math.sin(S.tw / 30)) * 10 * k; ctx.strokeStyle = "#a88a5a"; ctx.lineWidth = k; ctx.beginPath(); ctx.arc(x, y, 5 * k, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(x + k, y - k, 3 * k, 0, 7); ctx.stroke(); } },
    // 🦒 savanna: golden grass, acacias, a far mountain
    savanna: { tr: "Savan", en: "Savanna", animals: ["lion", "giraffe", "zebra", "elephant", "gazelle", "ostrich", "rhino"],
      bg(g, W, H, f, k, px) {
        sky(g, W, f, "rgba(255,190,110,0)", "rgba(255,200,130,.55)"); sun(px, W * 0.2, f - 240, k, "rgba(255,220,140,.9)");
        hills(g, W, f, k, "rgba(150,140,170,.7)", 50, 26, 13, 2); hills(g, W, f, k, "#d8b860", 10, 4, 3);
        acacia(px, W * 0.15, f, k, 1.2); acacia(px, W * 0.62, f, k, 0.9); acacia(px, W * 0.9, f, k, 1.1);
        px(0, f - 2 * k, W, H - f + 2 * k, "#d8b860"); for (let x = 0; x < W; x += 3 * k) px(x, f - (3 + ((x / k) % 4)) * k, k, (3 + ((x / k) % 4)) * k, (x / k) % 2 ? "#c8a040" : "#e8c870");
      } },
    // 🏔️ mountains: snowy peaks, rocks, a wooden chalet
    mountain: { tr: "Dağ", en: "Mountains", snow: "light", animals: ["ibex", "goat", "eagle", "yak", "llama", "snowleo", "condor"],
      bg(g, W, H, f, k, px) {
        sky(g, W, f, "rgba(140,190,240,0)", "rgba(170,210,250,.6)"); cloudsOf(px, W, f, k, 3);
        for (let x = 0; x < W; x += k) { const v = Math.abs(Math.sin(x / k / 31)) * 60 + Math.abs(Math.sin(x / k / 13)) * 18; px(x, f - v * k - 10 * k, k, v * k + 10 * k, "#8a96aa"); if (v > 46) px(x, f - v * k - 10 * k, k, (v - 46) * k, "#f4f8ff"); }
        hills(g, W, f, k, "#6aa85a", 16, 8, 5);
        const cx = W * 0.72; px(cx, f - 18 * k, 30 * k, 18 * k, "#8a5a3a"); px(cx - 4 * k, f - 26 * k, 38 * k, 8 * k, "#5a3a26"); px(cx - 2 * k, f - 27 * k, 34 * k, 2 * k, "#f4f8ff"); px(cx + 6 * k, f - 12 * k, 6 * k, 5 * k, "#ffe9a0"); px(cx + 18 * k, f - 10 * k, 6 * k, 10 * k, "#4a3020");
        for (let i = 0; i < 7; i++) { const x = hash(i + 5) * W; px(x, f - 5 * k, 9 * k, 5 * k, "#9aa2b0"); px(x + k, f - 6 * k, 6 * k, k, "#b8c0cc"); }
        grass(px, W, f, k, "#7cbf5a", "#5f9f45", H); for (let i = 0; i < 20; i++) { const x = hash(i + 33) * W; px(x, f - 4 * k, k, 3 * k, "#4f9a45"); px(x - k, f - 5 * k, 3 * k, k, ["#ffffff", "#c8a0ff", "#ffd34d"][i % 3]); }
      } },
    // 🌲 taiga: deep pine forest, a log cabin, a lake
    taiga: { tr: "Tayga ormanı", en: "Taiga forest", snow: "light", animals: ["moose", "bear", "wolf", "reindeer", "lynx", "beaver", "fox"],
      bg(g, W, H, f, k, px) {
        sky(g, W, f, "rgba(150,180,210,0)", "rgba(170,200,220,.55)");
        for (let i = 0; i < W / (9 * k); i++) pine(px, i * 9 * k + hash(i) * 6 * k, f - 10 * k, Math.max(2, k - 1), 30 + hash(i + 3) * 18, true);
        for (let i = 0; i < W / (22 * k); i++) pine(px, i * 22 * k + hash(i + 50) * 10 * k, f, k, 26 + hash(i + 7) * 16, true);
        const cx = W * 0.4; for (let y = 0; y < 18; y += 3) px(cx, f - (y + 3) * k, 34 * k, 3 * k, y % 6 ? "#8a5a32" : "#7a4a28"); px(cx - 4 * k, f - 27 * k, 42 * k, 8 * k, "#4a2e1e"); px(cx - 3 * k, f - 28 * k, 40 * k, 2 * k, "#f4f8ff"); px(cx + 6 * k, f - 14 * k, 7 * k, 6 * k, "#ffd34d"); px(cx + 22 * k, f - 13 * k, 6 * k, 13 * k, "#3a2418");
        px(W * 0.68, f - 4 * k, W * 0.22, 4 * k, "#4a7aa8"); px(W * 0.7, f - 3 * k, 30 * k, k, "#8ab4dc");
        px(0, f - 2 * k, W, H - f + 2 * k, "#e8eef6"); for (let x = 0; x < W; x += 7 * k) px(x + ((x / k) % 3) * k, f - 2 * k, 2 * k, k, "#5f8a5a");
      } },
    // 🛶 a fjord: steep cliffs, deep water, salmon leaping (Oslo, Wellington)
    fjord: { tr: "Fiyort", en: "Fjord", water: 0.4, animals: ["moose", "puffin", "seal", "salmon", "gull", "whale"],
      bg(g, W, H, f, k, px) {
        sky(g, W, f, "rgba(150,190,230,0)", "rgba(170,205,235,.6)"); cloudsOf(px, W, f, k, 4);
        for (let x = 0; x < W; x += k) { const edge = Math.abs(x / W - 0.6) * 2, v = 30 + edge * 70 + Math.sin(x / k / 9) * 6; px(x, f - v * k, k, v * k, "#6a7a8a"); if (v > 75) px(x, f - v * k, k, 6 * k, "#f4f8ff"); px(x, f - v * k + 6 * k, k, 2 * k, "#5a8a5a"); }
        const sx = W * 0.6; px(sx, f - 8 * k, W - sx, 8 * k + H - f, "#2a5a7a"); for (let i = 0; i < 3; i++) px(sx, f - (8 - i * 2) * k, W - sx, k, ["#4a7aa0", "#3a6a90", "#2f6084"][i]);
        for (let i = 0; i < 6; i++) pine(px, W * 0.04 + i * 30 * k, f, k, 22 + hash(i) * 10, false);
        const bx = W * 0.4; px(bx, f - 14 * k, 22 * k, 14 * k, "#b8342a"); px(bx - 2 * k, f - 19 * k, 26 * k, 5 * k, "#3a3a3a"); px(bx + 4 * k, f - 10 * k, 5 * k, 4 * k, "#fff"); px(bx + 13 * k, f - 9 * k, 5 * k, 9 * k, "#5a2a22");
        grass(px, sx, f, k, "#6aa85a", "#4f8a45", H); px(sx - 6 * k, f - 2 * k, 10 * k, 2 * k, "#9aa2b0");
      },
      front(ctx, w, dt, S) { const k = Math.max(2, Math.round(w.toyScale)), sx = w.W * 0.6; S.t = (S.t || 0) + dt; ctx.fillStyle = "rgba(255,255,255,.4)"; for (let i = 0; i < 6; i++) ctx.fillRect(Math.round(sx + ((i * 151 + S.t * 14) % (w.W - sx))), Math.round(w.floor - (2 + (i % 3) * 2) * k), 6 * k, k); } },
    // 🐎 steppe: endless grass, a yurt, big sky
    steppe: { tr: "Bozkır", en: "Steppe", animals: ["horse", "camel", "eagle", "sheep", "wolf", "yak"],
      bg(g, W, H, f, k, px) {
        sky(g, W, f, "rgba(120,180,240,0)", "rgba(150,200,245,.6)"); cloudsOf(px, W, f, k, 6);
        hills(g, W, f, k, "#a8b878", 18, 10, 7, 2);
        const yurt = (x, s) => { for (let i = 0; i < s; i++) px(x - (s - i * 0.4) * k, f - (8 + i) * k, (s * 2 - i * 0.8) * k, k, i % 3 ? "#f4ece0" : "#e2414e"); px(x - s * k, f - 8 * k, s * 2 * k, 8 * k, "#f4ece0"); for (let y = 1; y < 8; y += 3) px(x - s * k, f - y * k, s * 2 * k, k, "#d8c8b0"); px(x - 3 * k, f - 7 * k, 6 * k, 7 * k, "#c8402a"); px(x - k, f - (8 + s) * k, 2 * k, 2 * k, "#5a3a26"); };
        yurt(W * 0.3, 14); yurt(W * 0.75, 11);
        grass(px, W, f, k, "#b8c870", "#98a850", H);
      } },
    // 🌾 pampas: tall feathery grass, a ranch fence (Buenos Aires, Montevideo, Asunción)
    pampas: { tr: "Pampa", en: "Pampas", animals: ["horse", "rhea", "capybara", "cow"],
      bg(g, W, H, f, k, px) {
        sky(g, W, f, "rgba(120,180,240,0)", "rgba(160,210,250,.6)"); cloudsOf(px, W, f, k, 5);
        for (let x = 0; x < W; x += 16 * k) { px(x, f - 16 * k, 2 * k, 16 * k, "#8a6a4a"); } px(0, f - 14 * k, W, 2 * k, "#a8865a"); px(0, f - 8 * k, W, 2 * k, "#a8865a");
        grass(px, W, f, k, "#a8c060", "#88a040", H);
        for (let i = 0; i < W / (12 * k); i++) { const x = i * 12 * k + hash(i) * 6 * k; for (let j = 0; j < 4; j++) { px(x + j * 2 * k, f - (10 + j) * k, k, (10 + j) * k, "#b8a870"); px(x + j * 2 * k - k, f - (13 + j) * k, 3 * k, 3 * k, "#f0e8d0"); } }
      } },
    // 🌸 sakura: cherry trees, a koi pond, a stone lantern, falling petals (Tokyo, Seoul, Taipei)
    sakura: { tr: "Sakura bahçesi", en: "Cherry blossom garden", animals: ["macaque", "koi", "craneb", "dove"],
      bg(g, W, H, f, k, px) {
        sky(g, W, f, "rgba(255,220,235,0)", "rgba(255,225,240,.6)");
        const tree = (x, s) => { for (let i = 0; i < 24 * s; i++) px(x + Math.round(Math.sin(i / 7) * 3) * k, f - i * k, 4 * k, k, "#5a3a3a"); for (let i = 0; i < 70 * s; i++) { const a = hash(i + x) * 6.28, r = hash(i * 3 + x) * 20 * s; px(x + Math.cos(a) * r * k * 1.3, f - 24 * s * k - 6 * k + Math.sin(a) * r * k * 0.7, 4 * k, 3 * k, ["#ffc8dc", "#ffb0cc", "#ffe0ec", "#ff9ec0"][i % 4]); } };
        tree(W * 0.12, 1.2); tree(W * 0.55, 1); tree(W * 0.92, 1.3);
        const lx = W * 0.35; px(lx, f - 6 * k, 4 * k, 6 * k, "#9a9aa0"); px(lx - 3 * k, f - 12 * k, 10 * k, 6 * k, "#b0b0b6"); px(lx - k, f - 11 * k, 6 * k, 3 * k, "#ffe9a0"); px(lx - 4 * k, f - 14 * k, 12 * k, 2 * k, "#8a8a90");
        const tx = W * 0.72; px(tx, f - 30 * k, 3 * k, 30 * k, "#d8323c"); px(tx + 24 * k, f - 30 * k, 3 * k, 30 * k, "#d8323c"); px(tx - 4 * k, f - 34 * k, 35 * k, 3 * k, "#d8323c"); px(tx - 2 * k, f - 27 * k, 31 * k, 2 * k, "#d8323c"); px(tx - 5 * k, f - 35 * k, 37 * k, k, "#2a2024");
        grass(px, W, f, k, "#8fcf6b", "#6fb855", H); px(W * 0.4, f - 3 * k, 70 * k, 3 * k, "#4fa6d8"); px(W * 0.42, f - 2 * k, 10 * k, k, "#8ad4f4");
      },
      front(ctx, w, dt, S) { const k = Math.max(2, Math.round(w.toyScale)); S.t = (S.t || 0) + dt; for (let i = 0; i < 26; i++) { const x = (i * 173 + S.t * 40 + Math.sin(S.t + i) * 30) % w.W, y = (i * 61 + S.t * 34) % (w.floor - 60) + 60; ctx.fillStyle = i % 2 ? "#ffc8dc" : "#ffe0ec"; ctx.fillRect(Math.round(x), Math.round(y), 2 * k, k); } } },
    // 🎋 bamboo grove with pandas (Beijing)
    bamboo: { tr: "Bambu ormanı", en: "Bamboo grove", animals: ["panda", "peacock", "macaque", "craneb"],
      bg(g, W, H, f, k, px) {
        sky(g, W, f, "rgba(170,220,170,0)", "rgba(190,230,190,.55)");
        for (let i = 0; i < W / (7 * k); i++) { const x = i * 7 * k + hash(i) * 4 * k, h = 60 + hash(i + 4) * 60, c = i % 3 ? "#6aa84a" : "#4f8a3a"; for (let y = 0; y < h; y += 1) px(x, f - y * k, 2 * k, k, y % 12 === 0 ? "#3f6a2a" : c); for (let j = 0; j < 4; j++) { const y = f - (20 + hash(i * 9 + j) * (h - 20)) * k; px(x + 2 * k, y, 6 * k, k, "#7cbf5a"); px(x - 5 * k, y + 3 * k, 5 * k, k, "#5fae54"); } }
        const px2 = W * 0.6; px(px2, f - 22 * k, 36 * k, 4 * k, "#c8323c"); px(px2 + 3 * k, f - 26 * k, 30 * k, 4 * k, "#2a6a5a"); px(px2 + 4 * k, f - 18 * k, 3 * k, 18 * k, "#c8323c"); px(px2 + 29 * k, f - 18 * k, 3 * k, 18 * k, "#c8323c");
        grass(px, W, f, k, "#7cbf5a", "#5f9f45", H);
      } },
    // 🦘 the outback: red earth, a big rock, gum trees with a koala
    outback: { tr: "Avustralya çölü", en: "Outback", animals: ["kangaroo", "emu", "koala", "platypus"],
      bg(g, W, H, f, k, px) {
        sky(g, W, f, "rgba(255,170,110,0)", "rgba(255,180,120,.55)");
        const rx = W * 0.6; for (let x = 0; x < 120; x++) { const h = 30 + Math.sqrt(Math.max(0, 3600 - (x - 60) * (x - 60))) * 0.4; px(rx + x * k, f - h * k, k, h * k, x % 9 < 1 ? "#a8482a" : "#c8603a"); }
        const gum = (x) => { for (let i = 0; i < 34; i++) px(x + Math.round(Math.sin(i / 8) * 2) * k, f - i * k, 3 * k, k, "#e8e0d8"); for (let i = 0; i < 40; i++) px(x + (hash(i + x) * 30 - 15) * k, f - (32 + hash(i * 2 + x) * 12) * k, 5 * k, 3 * k, i % 2 ? "#7a9a6a" : "#9ab88a"); };
        gum(W * 0.15); gum(W * 0.4);
        px(0, f - 2 * k, W, H - f + 2 * k, "#d8784a"); for (let x = 0; x < W; x += 13 * k) { px(x + ((x / k) % 7) * k, f - 4 * k, 5 * k, 3 * k, "#a8b060"); px(x + ((x / k) % 7) * k + k, f - 6 * k, k, 2 * k, "#a8b060"); }
      } },
    // 🫒 the Mediterranean: olive trees, white houses, a blue sea behind
    med: { tr: "Akdeniz sahili", en: "Mediterranean coast", water: 0.35, props: ["parasol", "beachball", "towel"], animals: ["dolphin", "gull", "goat", "turtle", "fish"],
      bg(g, W, H, f, k, px) {
        sky(g, W, f, "rgba(110,190,250,0)", "rgba(140,205,255,.6)");
        const sx = W * 0.65; px(sx, f - 8 * k, W - sx, 8 * k + H - f, "#2a7ad8"); px(sx, f - 8 * k, W - sx, k, "#5aa6ea"); px(sx, f - 9 * k, W - sx, k, "#8ac4f4");
        for (let i = 0; i < 5; i++) { const x = W * 0.04 + i * 34 * k, h = 14 + (i % 3) * 5; px(x, f - (8 + h) * k, 24 * k, h * k, "#fbfbfd"); px(x, f - (10 + h) * k, 24 * k, 2 * k, i % 2 ? "#2a6ad8" : "#d86a3a"); px(x + 4 * k, f - (4 + h) * k, 4 * k, 4 * k, "#2a6ad8"); px(x + 14 * k, f - (4 + h) * k, 4 * k, 4 * k, "#2a6ad8"); }
        hills(g, W * 0.7, f, k, "#a8b878", 10, 4, 8);
        const olive = (x) => { for (let i = 0; i < 14; i++) px(x + Math.round(Math.sin(i / 3) * 2) * k, f - i * k, 3 * k, k, "#7a6a5a"); for (let i = 0; i < 30; i++) px(x + (hash(i + x) * 24 - 12) * k, f - (14 + hash(i * 3 + x) * 8) * k, 4 * k, 2 * k, i % 2 ? "#7a9a6a" : "#9ab88a"); };
        olive(W * 0.3); olive(W * 0.5);
        px(0, f - 3 * k, sx + 20 * k, H - f + 3 * k, "#f0dcaa"); for (let x = 0; x < sx; x += 6 * k) px(x + ((x / k) % 4) * k, f - 2 * k, 2 * k, k, "#e0c890");
        px(sx - 8 * k, f - 4 * k, 30 * k, 2 * k, "#e8d090");
      },
      front(ctx, w, dt, S) { const k = Math.max(2, Math.round(w.toyScale)), sx = w.W * 0.65; S.t = (S.t || 0) + dt; ctx.fillStyle = "rgba(255,255,255,.6)"; for (let i = 0; i < 7; i++) ctx.fillRect(Math.round(sx + ((i * 131 + S.t * 18) % (w.W - sx))), Math.round(w.floor - (2 + (i % 3) * 2) * k), 5 * k, k); } },
  };

  window.CatWorldArt = { ANIMALS, BIOMES, drawAnimal, animalThumb, hash };
})();
