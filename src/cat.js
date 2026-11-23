/* Desktop Cat — pixel cats that live on the bottom edge of your screen.
 * Each cat is rasterised every frame into a tiny material buffer, then lit
 * (top edges lighter, under-sides darker, far limbs in shadow) and outlined,
 * which gives the chunky "pixel 3D" look. Runs in Electron or a plain browser. */
(() => {
  "use strict";

  // ---------------------------------------------------------------- palettes
  const COATS = {
    ginger:  { name: "Ginger tabby", body: "#e08a3c", belly: "#f6dcb4", accent: "#b5561f", eye: "#9ccf4a", pattern: "stripes" },
    black:   { name: "Black",        body: "#2c2a33", belly: "#2c2a33", accent: "#1c1b22", eye: "#e8c547", pattern: "solid", outline: "#0d0c10" },
    white:   { name: "White",        body: "#f1eee8", belly: "#ffffff", accent: "#e2ddd4", eye: "#6fb3e8", pattern: "solid" },
    grey:    { name: "Grey tabby",   body: "#8d939c", belly: "#d3d6da", accent: "#5f656e", eye: "#e2b23c", pattern: "stripes" },
    calico:  { name: "Calico",       body: "#f4efe6", belly: "#ffffff", accent: "#d9823b", accent2: "#3a3433", eye: "#c9a23a", pattern: "calico" },
    siamese: { name: "Siamese",      body: "#efe2c8", belly: "#f7efdf", accent: "#5b4033", eye: "#5aa7e6", pattern: "points" },
    tuxedo:  { name: "Tuxedo",       body: "#2a2a2e", belly: "#f4f1ea", accent: "#1a1a1e", eye: "#a7d34b", pattern: "tuxedo", outline: "#0b0b0e" },
    // more house cats
    cream:   { name: "Cream tabby",  body: "#ecc993", belly: "#fbeedb", accent: "#c8955a", eye: "#d9a54a", pattern: "stripes" },
    chocolate:{ name: "Chocolate",   body: "#6b4430", belly: "#6b4430", accent: "#4f3022", eye: "#e8b64a", pattern: "solid" },
    russian: { name: "Russian blue", body: "#7f90a6", belly: "#7f90a6", accent: "#65758a", eye: "#6fd08c", pattern: "solid" },
    tortie:  { name: "Tortoiseshell",body: "#3a2c28", belly: "#3a2c28", accent: "#d27a35", accent2: "#8a4a22", eye: "#d9a23a", pattern: "calico", outline: "#160f0d" },
    bengal:  { name: "Bengal",       body: "#dba45e", belly: "#f6e2c0", accent: "#4a2e1c", accent2: "#8a5a30", eye: "#9ccf4a", pattern: "spots" },
    sphynx:  { name: "Sphynx",       body: "#e9c2b4", belly: "#f3d6cc", accent: "#d6a597", eye: "#7cc3e8", pattern: "solid", outline: "#8a5a50" },
    maine:   { name: "Maine coon",   body: "#8a6a4c", belly: "#e6d6c0", accent: "#3e2c1e", eye: "#c9a23a", pattern: "stripes", big: 1.15 },
    bicolor: { name: "Orange & white",body: "#e08a3c", belly: "#fbf6ee", accent: "#b5561f", eye: "#9ccf4a", pattern: "tuxedo" },
    silver:  { name: "Silver tabby", body: "#c9ced6", belly: "#eef0f3", accent: "#3c4048", eye: "#7cc94a", pattern: "stripes" },
    ragdoll: { name: "Ragdoll",      body: "#f2ebe0", belly: "#ffffff", accent: "#7a6a62", eye: "#4f8fe0", pattern: "points" },
    // 👑 the big cats: rare, pricey, and a good deal bigger than a house cat
    cheetah: { name: "Cheetah",      body: "#e2b25e", belly: "#f8ecd2", accent: "#2a2018", accent2: "#2a2018", eye: "#d9a23a", pattern: "spots", big: 1.3, wild: true, morph: "lean" },
    puma:    { name: "Puma",         body: "#c49564", belly: "#f1e3cc", accent: "#3a2a20", eye: "#c9b04a", pattern: "puma", big: 1.35, wild: true, morph: "big" },
    leopard: { name: "Leopard",      body: "#e0a94e", belly: "#f8ead0", accent: "#2a1e16", accent2: "#a8682c", eye: "#b8d04a", pattern: "rosette", big: 1.35, wild: true, morph: "big" },
    snowleo: { name: "Snow leopard", body: "#dcdcd8", belly: "#f6f6f2", accent: "#3e4248", accent2: "#a9aeb4", eye: "#8fc8d8", pattern: "rosette", big: 1.35, wild: true, morph: "big" },
    panther: { name: "Black panther",body: "#24232b", belly: "#24232b", accent: "#18171d", eye: "#9bd84a", pattern: "solid", outline: "#08080b", big: 1.4, wild: true, morph: "big" },
    tiger:   { name: "Tiger",        body: "#ea8a2e", belly: "#fbf3e6", accent: "#1d1714", eye: "#e8c547", pattern: "tiger", big: 1.45, wild: true, morph: "big" },
    lion:    { name: "Lion",         body: "#d9a75e", belly: "#f3dfbd", accent: "#6a3e1c", accent2: "#a5622a", eye: "#d9a23a", pattern: "lion", big: 1.5, wild: true, mane: true, morph: "big" },
  };
  const COAT_KEYS = Object.keys(COATS);

  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const lighten = (c, t) => mix(c, [255, 255, 255], t);
  const darken = (c, t) => mix(c, [0, 0, 0], t);

  // 🧬 genes change the colours: "tone" makes them vivid or washed-out, "pattern" makes the markings crisp or faded,
  // "shine" brightens the highlights, "eyes" makes them glow or go dull
  const L_GENES = (g) => [g.shine, g.tone, g.pattern, g.eyes].join(",");
  const lum = (c) => 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];
  const vivid = (c, v) => { const l = lum(c); return v >= 0 ? c.map((x) => Math.round(Math.max(0, Math.min(255, x + (x - l) * v * 0.45)))) : mix(c, mix([l, l, l].map(Math.round), [236, 232, 228], 0.35), -v * 0.6); };
  function buildPalette(key, genes) {
    const c = COATS[key] || COATS.ginger, G = genes || null;
    let body = hex(c.body), belly = hex(c.belly), acc = hex(c.accent), acc2 = hex(c.accent2 || c.accent);
    if (G) {
      const v = ((G.tone ?? 50) - 50) / 50, pt = (G.pattern ?? 50) / 100;
      body = vivid(body, v); belly = vivid(belly, v * 0.5); acc = vivid(acc, v); acc2 = vivid(acc2, v);
      if (pt < 0.5) { acc = mix(acc, body, (0.5 - pt) * 1.1); acc2 = mix(acc2, body, (0.5 - pt) * 1.1); }      // faded markings
    }
    const shine = G ? ((G.shine ?? 50) - 50) / 50 : 0;
    const P = {};
    const set = (m, base) => { P[m] = { base, light: lighten(base, 0.22 + shine * 0.14), shade: darken(base, 0.24 - shine * 0.05), deep: darken(base, 0.42) }; };
    set(M.BODY, body); set(M.BELLY, belly); set(M.ACCENT, acc); set(M.ACCENT2, acc2);
    P.outline = c.outline ? hex(c.outline) : darken(mix(body, acc, 0.5), 0.62);
    P.eye = G ? vivid(hex(c.eye), ((G.eyes ?? 50) - 50) / 40) : hex(c.eye); P.shine = shine; P.pupil = [20, 18, 22]; P.nose = [222, 120, 140]; P.ear = [232, 150, 160]; P.closed = darken(mix(body, acc, 0.5), 0.6);
    P.tongue = [236, 98, 120];
    P.pattern = c.pattern; P.key = key; P.mane = !!c.mane; P.morph = c.morph || null;
    // drawn a touch longer (big cats) or long and leggy (the cheetah)
    P.kx = c.morph === "lean" ? 1.14 : c.morph === "big" ? 1.07 : 1; P.ky = c.morph === "lean" ? 1.08 : 1;
    return P;
  }

  // ---------------------------------------------------------------- tiny rasteriser
  const SW = 48, SH = 42, GROUND = 38;            // sprite size and the row the feet stand on
  const M = { EMPTY: 0, BODY: 1, FAR: 2, BELLY: 3, ACCENT: 4, ACCENT2: 5, EYE: 6, NOSE: 7, EAR: 8, CLOSED: 9, TONGUE: 10, PUPIL: 11, FORCE_BELLY: 12,
    H1: 13, H2: 14, H3: 15, C1: 16, C2: 17, C3: 18, O1: 19, O2: 20, O3: 21 };

  class Raster {
    constructor(w = SW, h = SH) { this.w = w; this.h = h; this.m = new Uint8Array(w * h); this.part = new Uint8Array(w * h); }
    clear() { this.m.fill(0); this.part.fill(0); this.head = null; this.outfit = null; this.cc = null; }
    partAt(x, y) { x |= 0; y |= 0; return (x < 0 || y < 0 || x >= this.w || y >= this.h) ? 0 : this.part[y * this.w + x]; }
    put(x, y, mat, part = 0) {
      x |= 0; y |= 0;
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
      const i = y * this.w + x; this.m[i] = mat; this.part[i] = part;
    }
    get(x, y) { return (x < 0 || y < 0 || x >= this.w || y >= this.h) ? 0 : this.m[y * this.w + x]; }
    ellipse(cx, cy, rx, ry, mat, part) {
      for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++)
        for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
          const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
          if (dx * dx + dy * dy <= 1) this.put(x, y, mat, part);
        }
    }
    circle(cx, cy, r, mat, part) { this.ellipse(cx, cy, r, r, mat, part); }
    rect(x, y, w, h, mat, part) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.put(x + i, y + j, mat, part); }
    tri(ax, ay, bx, by, cx, cy, mat, part) {
      const minX = Math.floor(Math.min(ax, bx, cx)), maxX = Math.ceil(Math.max(ax, bx, cx));
      const minY = Math.floor(Math.min(ay, by, cy)), maxY = Math.ceil(Math.max(ay, by, cy));
      const s = (px, py, x1, y1, x2, y2) => (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2);
      for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
        const px = x + 0.5, py = y + 0.5;
        const d1 = s(px, py, ax, ay, bx, by), d2 = s(px, py, bx, by, cx, cy), d3 = s(px, py, cx, cy, ax, ay);
        const neg = d1 < 0 || d2 < 0 || d3 < 0, pos = d1 > 0 || d2 > 0 || d3 > 0;
        if (!(neg && pos)) this.put(x, y, mat, part);
      }
    }
    // a limb: a thick line from (x1,y1) to (x2,y2)
    limb(x1, y1, x2, y2, w, mat, part) {
      const n = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) * 1.5));
      for (let k = 0; k <= n; k++) { const t = k / n; this.circle(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, w / 2, mat, part); }
    }
    // a tail: thick quadratic curve
    curve(x0, y0, x1, y1, x2, y2, w0, w1, mat, part) {
      for (let k = 0; k <= 28; k++) {
        const t = k / 28, u = 1 - t;
        const x = u * u * x0 + 2 * u * t * x1 + t * t * x2, y = u * u * y0 + 2 * u * t * y1 + t * t * y2;
        this.circle(x, y, (w0 + (w1 - w0) * t) / 2, mat, part);
      }
    }
  }
  const PART = { NONE: 0, HEAD: 1, BODY: 2, LEG: 3, TAIL: 4, EAR: 5, CHEST: 6, HAT: 7, COLLAR: 8 };

  // ---------------------------------------------------------------- body parts
  function headSide(R, cx, cy, o = {}) {
    const d = o.dir || 1, X = (dx) => cx + d * dx;
    R.head = { x: cx, y: cy, d, front: false };
    // ears first so the head overlaps their base
    R.tri(X(-4.5), cy - 2.5, X(-2.5), cy - 8.5, X(-0.2), cy - 3.5, M.BODY, PART.EAR);
    R.tri(X(-0.5), cy - 3.6, X(2.2), cy - 8.8, X(4), cy - 2.6, M.BODY, PART.EAR);
    R.put(X(-2.5), cy - 5.5, M.EAR, PART.EAR); R.put(X(1.8), cy - 5.8, M.EAR, PART.EAR); R.put(X(1.8), cy - 4.8, M.EAR, PART.EAR);
    R.ellipse(cx, cy, 5.8, 5.2, M.BODY, PART.HEAD);
    R.ellipse(X(4.2), cy + 1.6, 2.8, 2.2, M.BELLY, PART.HEAD);        // muzzle
    R.put(X(6.4), cy + 0.4, M.NOSE, PART.HEAD);
    const ex = X(2.2), ey = cy - 1, e = (k) => ex + d * k;
    if (o.eyes === "closed") { R.put(e(-1), ey + 1, M.CLOSED); R.put(ex, ey + 1, M.CLOSED); R.put(e(1), ey + 1, M.CLOSED); }
    else if (o.eyes === "happy") { R.put(e(-1), ey + 1, M.CLOSED); R.put(ex, ey, M.CLOSED); R.put(e(1), ey + 1, M.CLOSED); }
    else if (o.eyes === "blink") { R.put(ex, ey + 1, M.CLOSED); R.put(e(1), ey + 1, M.CLOSED); }
    else {
      const lk = o.look || { x: 0.5, y: 0 };
      const px = lk.x < -0.3 ? ex : e(1), rows = lk.y < -0.4 ? [ey] : lk.y > 0.4 ? [ey + 1] : [ey, ey + 1];
      for (const yy of [ey, ey + 1]) for (const xx of [ex, e(1)]) R.put(xx, yy, xx === px && rows.includes(yy) ? M.PUPIL : M.EYE);
    }
    if (o.tongue) R.put(X(5.6), cy + 3.4, M.TONGUE);
    if (o.yawn) {                                    // wide-open mouth
      R.put(X(3), cy + 2.6, M.PUPIL); R.put(X(4), cy + 2.6, M.PUPIL); R.put(X(5), cy + 2.6, M.PUPIL);
      R.put(X(3), cy + 3.6, M.TONGUE); R.put(X(4), cy + 3.6, M.TONGUE); R.put(X(5), cy + 3.6, M.PUPIL);
      R.put(X(4), cy + 4.6, M.BELLY, PART.HEAD); R.put(X(3), cy + 4.6, M.BELLY, PART.HEAD);
    }
  }
  function headFront(R, cx, cy, o = {}) {
    R.head = { x: cx, y: cy, d: 1, front: true };
    R.tri(cx - 6, cy - 1, cx - 5, cy - 9, cx - 1.5, cy - 4.5, M.BODY, PART.EAR);
    R.tri(cx + 6, cy - 1, cx + 5, cy - 9, cx + 1.5, cy - 4.5, M.BODY, PART.EAR);
    R.put(cx - 4.5, cy - 5.5, M.EAR, PART.EAR); R.put(cx + 4, cy - 5.5, M.EAR, PART.EAR);
    R.ellipse(cx, cy, 6.4, 5.4, M.BODY, PART.HEAD);
    R.ellipse(cx, cy + 2.4, 3.2, 2.2, M.BELLY, PART.HEAD);
    R.put(cx - 0.5, cy + 1.2, M.NOSE, PART.HEAD);
    for (const sx of [-2.6, 2]) {
      if (o.eyes === "closed" || o.eyes === "happy") { R.put(cx + sx, cy - 0.6, M.CLOSED); R.put(cx + sx + 1, cy - 0.6, M.CLOSED); }
      else { R.put(cx + sx, cy - 1, M.EYE); R.put(cx + sx, cy, M.PUPIL); R.put(cx + sx + 1, cy - 1, M.EYE); R.put(cx + sx + 1, cy, M.PUPIL); }
    }
  }
  const leg = (R, x, top, bottom, mat, fwd = 0) => {
    R.limb(x, top, x + fwd, bottom - 1, 2.8, mat, PART.LEG);
    R.rect(Math.round(x + fwd - 1), bottom - 1, 3 + (fwd > 0 ? 1 : 0), 1, mat, PART.LEG);   // paw
  };

  // ---------------------------------------------------------------- poses (sprite faces right)
  const lerp = (a, b, t) => a + (b - a) * t;
  const POSES = {
    walk(R, a) {
      const p = a.phase * Math.PI * 2, bob = Math.sin(p * 2) > 0.3 ? 1 : 0;
      const sw = (o) => Math.sin(p + o) * 2.6;
      const tailSway = Math.sin(a.t * 2.2) * 2;
      // far legs in shadow, drawn first
      leg(R, 16, 29 + bob, GROUND, M.FAR, sw(Math.PI));
      leg(R, 30, 29 + bob, GROUND, M.FAR, sw(0));
      R.curve(12, 25 + bob, 6 + tailSway, 22, 6 + tailSway * 1.5, 12, 3, 2.4, M.BODY, PART.TAIL);
      R.ellipse(22, 27 + bob, 10.5, 5.4, M.BODY, PART.BODY);
      R.ellipse(29.5, 26.5 + bob, 5.6, 5.6, M.BODY, PART.CHEST);
      leg(R, 14, 29 + bob, GROUND, M.BODY, sw(0));
      leg(R, 28, 29 + bob, GROUND, M.BODY, sw(Math.PI));
      headSide(R, 35, 20 + bob, { eyes: a.blink ? "blink" : null });
    },
    run(R, a) {
      const p = a.phase * Math.PI * 2, s = Math.sin(p), c = Math.cos(p), lift = s > 0 ? 1 : 0;
      leg(R, 17, 28 - lift, GROUND - lift * 2, M.FAR, -3 * c);
      leg(R, 31, 28 - lift, GROUND - lift * 2, M.FAR, 3 * c + 1);
      R.curve(12, 25, 6, 22 - s, 3, 20, 3, 2.4, M.BODY, PART.TAIL);
      R.ellipse(22, 26 - lift, 11.5, 5, M.BODY, PART.BODY);
      R.ellipse(30, 25.5 - lift, 5.6, 5.4, M.BODY, PART.CHEST);
      leg(R, 14, 28 - lift, GROUND - lift * 2, M.BODY, 3 * c);
      leg(R, 29, 28 - lift, GROUND - lift * 2, M.BODY, -3 * c + 1);
      headSide(R, 36, 20 - lift, {});
    },
    sit(R, a) {
      const tail = Math.sin(a.t * 1.6) * 1.2;
      R.curve(15, 35, 6, 38, 4 + tail, 31, 3, 2.4, M.BODY, PART.TAIL);
      leg(R, 30, 28, GROUND, M.FAR, 0);
      R.ellipse(20, 31, 8.2, 7, M.BODY, PART.BODY);                // haunch
      R.ellipse(26.5, 25, 6, 9, M.BODY, PART.CHEST);             // upright chest
      R.ellipse(20, GROUND - 1, 4.5, 1.6, M.BODY, PART.LEG);        // hind paw
      leg(R, 28, 28, GROUND, M.BODY, 0);
      const lk = a.look;
      headSide(R, 29 + (lk ? Math.round(lk.x * 0.8) : 0), 14 + (lk ? Math.round(lk.y * 1.6) : 0), { eyes: a.eyes || (a.blink ? "blink" : null), look: lk });
    },
    groom(R, a) {
      const lick = Math.sin(a.t * 9) > 0;
      R.curve(15, 35, 6, 38, 4, 32, 3, 2.4, M.BODY, PART.TAIL);
      leg(R, 30, 28, GROUND, M.FAR, 0);
      R.ellipse(20, 31, 8.2, 7, M.BODY, PART.BODY);
      R.ellipse(26.5, 25.5, 6, 8.6, M.BODY, PART.CHEST);
      R.ellipse(20, GROUND - 1, 4.5, 1.6, M.BODY, PART.LEG);
      const py = lick ? 18 : 19.5;
      R.limb(27, 27, 33, py + 1, 2.8, M.BODY, PART.LEG);              // raised front paw
      R.ellipse(33.6, py, 1.8, 1.5, M.BODY, PART.LEG);
      headSide(R, 29.5, 15.5 + (lick ? 0.8 : 0), { eyes: "closed", tongue: lick });
    },
    sleep(R, a) {
      const breathe = Math.sin(a.t * 1.7) * 0.45;
      R.ellipse(23, 32 - breathe / 2, 12.2, 6 + breathe, M.BODY, PART.BODY);
      R.curve(12, 35, 20, 40, 34, 37, 3, 2.4, M.BODY, PART.TAIL);   // tail wrapped round the front
      // head resting on the paws, ears relaxed
      R.tri(28, 28, 29.5, 23.5, 31.5, 27.5, M.BODY, PART.EAR);
      R.tri(31.5, 27, 34.5, 23, 35.5, 28, M.BODY, PART.EAR);
      R.put(29.5, 26, M.EAR); R.put(34, 25.5, M.EAR);
      R.ellipse(32.5, 31, 5.6, 4.8, M.BODY, PART.HEAD);
      R.ellipse(36, 33, 2.4, 1.8, M.BELLY, PART.HEAD);
      R.put(38, 32, M.NOSE);
      R.put(33, 31, M.CLOSED); R.put(34, 31, M.CLOSED); R.put(35, 31, M.CLOSED);
      R.ellipse(37, 36, 3, 1.5, M.BODY, PART.LEG);                   // paw under chin
      R.head = { x: 32.5, y: 31, d: 1, low: true };
    },
    roll(R, a) {
      const w = Math.sin(a.t * 6), w2 = Math.sin(a.t * 6 + 1.7), tilt = Math.round(Math.sin(a.t * 2.4) * 1.5);
      R.curve(13, 34, 7, 36 + w, 3, 33, 3, 2.4, M.BODY, PART.TAIL);
      R.ellipse(23, 33 + tilt * 0.3, 11, 5, M.BODY, PART.BODY);
      R.ellipse(23, 30.5, 8, 2.4, M.FORCE_BELLY, PART.BODY);           // belly up!
      // paws in the air
      R.limb(17, 30, 15 + w * 2, 22, 2.8, M.BODY, PART.LEG);
      R.limb(21, 30, 21 + w2 * 2, 22.5, 2.8, M.FAR, PART.LEG);
      R.limb(27, 30, 27 - w * 2, 22, 2.8, M.BODY, PART.LEG);
      R.limb(30, 30.5, 31 - w2 * 2, 23, 2.8, M.FAR, PART.LEG);
      // head upside-down on the floor
      R.tri(32, 35, 33.5, 40.5, 36, 36, M.BODY, PART.EAR);
      R.tri(36.5, 36, 39, 40.5, 40, 35.5, M.BODY, PART.EAR);
      R.ellipse(36, 32.5, 5.6, 4.8, M.BODY, PART.HEAD);
      R.ellipse(39.5, 31, 2.4, 1.8, M.BELLY, PART.HEAD);
      R.put(41.5, 31.5, M.NOSE);
      R.put(37, 33, M.CLOSED); R.put(38, 34, M.CLOSED); R.put(39, 33, M.CLOSED);
      R.head = { x: 36, y: 32.5, d: 1, flip: true };
    },
    // ---- newer moves
    chatter(R, a) {                                   // staring up at a bird, jaw chattering
      const tail = Math.sin(a.t * 7) * 1.6;
      R.curve(15, 35, 6, 38, 4 + tail, 30, 3, 2.4, M.BODY, PART.TAIL);
      leg(R, 30, 28, GROUND, M.FAR, 0);
      R.ellipse(20, 31, 8.2, 7, M.BODY, PART.BODY); R.ellipse(26.5, 25, 6, 9, M.BODY, PART.CHEST);
      R.ellipse(20, GROUND - 1, 4.5, 1.6, M.BODY, PART.LEG); leg(R, 28, 28, GROUND, M.BODY, 0);
      headSide(R, 29, 13, { look: { x: 1, y: -1 }, yawn: Math.sin(a.t * 26) > 0.2 });
    },
    nod(R, a) {                                       // dozing off sitting up: the head sinks, jerks back, sinks again
      const k = (a.st % 3.2) / 3.2, drop = Math.round(Math.min(1, k * 1.4) * 4);
      R.curve(15, 35, 6, 38, 4, 32, 3, 2.4, M.BODY, PART.TAIL);
      leg(R, 30, 28, GROUND, M.FAR, 0);
      R.ellipse(20, 31, 8.2, 7, M.BODY, PART.BODY); R.ellipse(26.5, 25.5, 6, 8.6, M.BODY, PART.CHEST);
      R.ellipse(20, GROUND - 1, 4.5, 1.6, M.BODY, PART.LEG); leg(R, 28, 28, GROUND, M.BODY, 0);
      headSide(R, 29 + drop * 0.4, 14 + drop, { eyes: drop > 1 ? "closed" : "blink" });
    },
    wave(R, a) {                                      // sitting up, one paw raised and waving at you
      const wv = Math.sin(a.t * 9) * 2.2;
      R.curve(15, 35, 6, 38, 4, 31, 3, 2.4, M.BODY, PART.TAIL);
      leg(R, 30, 28, GROUND, M.FAR, 0);
      R.ellipse(20, 31, 8.2, 7, M.BODY, PART.BODY); R.ellipse(26.5, 25, 6, 9, M.BODY, PART.CHEST);
      R.ellipse(20, GROUND - 1, 4.5, 1.6, M.BODY, PART.LEG);
      headSide(R, 28, 14, { eyes: "happy" });
      R.limb(29, 28, 36, 22 + wv * 0.6, 2.6, M.BODY, PART.LEG); R.circle(36.4, 21.6 + wv * 0.6, 1.7, M.BELLY, PART.LEG);     // the waving paw, in front
    },
    playBow(R, a) {                                   // front down, bottom up, tail wagging: "play with me!"
      const wag = Math.sin(a.t * 12) * 2.4, bob = Math.sin(a.t * 6) > 0.6 ? 1 : 0;
      R.curve(12, 22, 8 + wag * 0.5, 13, 6 + wag, 7, 3, 2.2, M.BODY, PART.TAIL);
      leg(R, 17, 25, GROUND, M.FAR, -1); leg(R, 32, 33, GROUND, M.FAR, 3);
      R.ellipse(17, 24 - bob, 6.4, 6.2, M.BODY, PART.BODY); R.ellipse(23, 28 - bob, 7, 5, M.BODY, PART.BODY);
      R.ellipse(29, 32, 5.6, 4.2, M.BODY, PART.CHEST);
      leg(R, 14, 25, GROUND, M.BODY, -1); R.limb(29, 34, 37, GROUND - 1, 2.6, M.BODY, PART.LEG);
      headSide(R, 36, 29, { eyes: "happy" });
    },
    crouch(R, a) {
      const wig = Math.sin(a.t * 18) * 0.9;
      R.curve(12, 30, 6, 33 + wig, 2, 34, 3, 2.4, M.BODY, PART.TAIL);
      leg(R, 17, 31, GROUND, M.FAR, -1);
      leg(R, 31, 32, GROUND, M.FAR, 2);
      R.ellipse(22 + wig * 0.4, 30.5 - wig * 0.4, 10.5, 4.6, M.BODY, PART.BODY);
      R.ellipse(30, 32, 5.2, 4.2, M.BODY, PART.CHEST);
      leg(R, 14 + wig, 31, GROUND, M.BODY, -1);
      leg(R, 29, 32, GROUND, M.BODY, 2);
      headSide(R, 35, 28.5, {});
    },
    leap(R, a) {
      R.curve(12, 26, 5, 24, 1, 22, 3, 2.4, M.BODY, PART.TAIL);
      R.limb(15, 28, 9, 33, 2.8, M.FAR, PART.LEG);
      R.limb(32, 26, 39, 28, 2.8, M.FAR, PART.LEG);
      R.ellipse(22, 25, 11.5, 4.6, M.BODY, PART.BODY);
      R.ellipse(30, 24.5, 5.4, 5, M.BODY, PART.CHEST);
      R.limb(13, 28, 7, 32, 2.8, M.BODY, PART.LEG);
      R.limb(31, 27, 39, 25, 2.8, M.BODY, PART.LEG);
      headSide(R, 36, 19, {});
    },
    bat(R, a) {
      const up = Math.sin(a.t * 14) > 0;
      R.curve(15, 35, 6, 38, 4, 31, 3, 2.4, M.BODY, PART.TAIL);
      leg(R, 30, 28, GROUND, M.FAR, 0);
      R.ellipse(20, 31, 8.2, 7, M.BODY, PART.BODY);
      R.ellipse(26.5, 25.5, 6, 8.6, M.BODY, PART.CHEST);
      R.ellipse(20, GROUND - 1, 4.5, 1.6, M.BODY, PART.LEG);
      R.limb(28, 28, up ? 37 : 35, up ? 27 : 33, 2.8, M.BODY, PART.LEG);
      headSide(R, 30, 15.5, {});
    },
    held(R, a) {
      const sway = Math.sin(a.t * 3) * 1.2;
      R.curve(24, 28, 24 + sway * 2, 36, 22 + sway * 3, 40, 3, 2.4, M.BODY, PART.TAIL);
      R.limb(21, 25, 20 + sway, 35, 2.8, M.FAR, PART.LEG);
      R.limb(27, 25, 28 + sway, 35, 2.8, M.FAR, PART.LEG);
      R.ellipse(24, 20, 5.8, 9, M.BODY, PART.BODY);
      R.limb(20, 14, 17 + sway, 22, 2.8, M.BODY, PART.LEG);
      R.limb(28, 14, 31 + sway, 22, 2.8, M.BODY, PART.LEG);
      headFront(R, 24, 9, { eyes: a.blink ? "closed" : null });
    },
    fall(R, a) { POSES.held(R, a); },
    // big morning stretch: front paws forward, bottom in the air
    stretch(R, a) {
      const k = Math.min(1, a.st / 0.4);                       // ease into the stretch
      R.curve(13, 22, 9, 14 - k * 2, 11, 8 - k * 2, 3, 2.2, M.BODY, PART.TAIL);
      R.limb(16, 24, 15, GROUND - 1, 2.8, M.FAR, PART.LEG);
      R.limb(33, 34, 41, GROUND - 1, 2.8, M.FAR, PART.LEG);
      R.limb(15, 25, 31, 32 + k, 9, M.BODY, PART.BODY);        // sloping back
      R.ellipse(31, 33, 5, 3.6, M.BODY, PART.CHEST);
      R.limb(13, 25, 13, GROUND - 1, 2.8, M.BODY, PART.LEG);
      R.limb(31, 35, 40, GROUND - 1, 2.8, M.BODY, PART.LEG);
      R.rect(39, GROUND - 1, 4, 1, M.BODY, PART.LEG);
      headSide(R, 36, 29 + k, { eyes: "closed" });
    },
    yawn(R, a) {
      R.curve(15, 35, 6, 38, 4, 32, 3, 2.4, M.BODY, PART.TAIL);
      leg(R, 30, 28, GROUND, M.FAR, 0);
      R.ellipse(20, 31, 8.2, 7, M.BODY, PART.BODY);
      R.ellipse(26.5, 25, 6, 9, M.BODY, PART.CHEST);
      R.ellipse(20, GROUND - 1, 4.5, 1.6, M.BODY, PART.LEG);
      leg(R, 28, 28, GROUND, M.BODY, 0);
      headSide(R, 29, 13, { eyes: "closed", yawn: true });
    },
    // up on the hind legs, swatting at something above
    stand(R, a) {
      const sw = Math.sin(a.t * 11), up = sw > 0;
      R.curve(15, 36, 8, 38, 5, 33, 3, 2.4, M.BODY, PART.TAIL);
      R.limb(19, 31, 18, GROUND - 1, 3, M.FAR, PART.LEG);
      R.limb(25, 20, up ? 33 : 31, up ? 6 : 10, 2.8, M.FAR, PART.LEG);   // far paw reaching up
      R.ellipse(up ? 33 : 31, up ? 5.5 : 9.5, 1.8, 1.6, M.FAR, PART.LEG);
      R.ellipse(20, 33, 6.5, 4.8, M.BODY, PART.BODY);                     // haunches
      R.limb(21, 31, 24, 20, 10, M.BODY, PART.CHEST);                     // upright torso
      R.limb(22, 33, 23, GROUND - 1, 3, M.BODY, PART.LEG);
      R.rect(21, GROUND - 1, 5, 1, M.BODY, PART.LEG);
      headSide(R, 26, 13, {});
      R.limb(27, 21, up ? 32 : 35, up ? 12 : 7, 2.8, M.BODY, PART.LEG);   // near paw swatting
      R.ellipse(up ? 32.5 : 35.5, up ? 11.5 : 6.5, 1.8, 1.6, M.BODY, PART.LEG);
    },
    eat(R, a) {
      const chomp = Math.sin(a.t * 10) > 0 ? 1 : 0;
      R.curve(12, 26, 8, 20, 9, 13 + chomp, 3, 2.4, M.BODY, PART.TAIL);
      leg(R, 16, 29, GROUND, M.FAR, 0);
      leg(R, 30, 30, GROUND, M.FAR, 0);
      R.ellipse(21, 27, 10, 5.2, M.BODY, PART.BODY);
      R.ellipse(28.5, 29, 5.2, 5, M.BODY, PART.CHEST);
      leg(R, 14, 29, GROUND, M.BODY, 0);
      leg(R, 28, 30, GROUND, M.BODY, 0);
      headSide(R, 34, 31 + chomp, { eyes: "closed" });
    },
    // kneading: paws pressing the blanket in turn before a nap
    knead(R, a) {
      const k = Math.sin(a.t * 7) > 0, tail = Math.sin(a.t * 1.3) * 1;
      R.curve(15, 35, 6, 38, 4 + tail, 32, 3, 2.4, M.BODY, PART.TAIL);
      R.limb(29, 29, k ? 31 : 32, k ? GROUND - 3 : GROUND - 1, 2.8, M.FAR, PART.LEG);
      R.rect(k ? 30 : 31, k ? GROUND - 3 : GROUND - 1, 3, 1, M.FAR, PART.LEG);
      R.ellipse(20, 31.5, 8.2, 6.5, M.BODY, PART.BODY);
      R.ellipse(26.5, 27, 6, 7.5, M.BODY, PART.CHEST);
      R.ellipse(20, GROUND - 1, 4.5, 1.6, M.BODY, PART.LEG);
      R.limb(27, 29, k ? 29 : 28, k ? GROUND - 1 : GROUND - 3, 2.8, M.BODY, PART.LEG);
      R.rect(k ? 28 : 27, k ? GROUND - 1 : GROUND - 3, 3, 1, M.BODY, PART.LEG);
      headSide(R, 30, 18, { eyes: "happy" });
    },
    // play-fighting stances
    spar(R, a) { POSES.crouch(R, { ...a, t: a.t * 0.4 }); },
    swipe(R, a) { POSES.bat(R, a); },
    // a real gallop: legs gather under the body, then the whole cat stretches out and flies
    gallop(R, a) {
      const p = a.phase * Math.PI * 2, e = 0.5 + 0.5 * Math.cos(p), e2 = 0.5 + 0.5 * Math.cos(p + 0.7);
      const by = 27 - 3 * e;
      R.limb(13, by + 1, lerp(19, 3, e2), lerp(GROUND - 1, by + 6, e2), 2.6, M.FAR, PART.LEG);
      R.limb(31, by, lerp(25, 41, e2), lerp(GROUND - 1, by + 5, e2), 2.6, M.FAR, PART.LEG);
      R.curve(11, by - 1, 5, by - 3 - e, 1, by - 4 + 2 * e, 3, 2.2, M.BODY, PART.TAIL);
      R.ellipse(22, by - (1 - e) * 1.5, 9 + 3 * e, 5 - 0.6 * e, M.BODY, PART.BODY);
      R.ellipse(30 + e, by - 0.5, 5.4, 5, M.BODY, PART.CHEST);
      R.limb(14, by + 1, lerp(21, 3, e), lerp(GROUND - 1, by + 5, e), 2.8, M.BODY, PART.LEG);
      R.limb(30 + e, by + 1, lerp(23, 42, e), lerp(GROUND - 1, by + 4, e), 2.8, M.BODY, PART.LEG);
      headSide(R, 36 + 2 * e, by - 7, {});
    },
    // brakes on! haunches down, front paws braced
    skid(R, a) {
      R.curve(13, 29, 7, 23, 6, 16, 3, 2.4, M.BODY, PART.TAIL);
      R.limb(30, 30, 39, GROUND - 1, 2.8, M.FAR, PART.LEG);
      R.ellipse(21, 31, 9.5, 5.2, M.BODY, PART.BODY);
      R.ellipse(28, 29, 5.2, 5.2, M.BODY, PART.CHEST);
      R.ellipse(17, GROUND - 1.5, 5, 2, M.BODY, PART.LEG);
      R.limb(28, 30, 37, GROUND - 1, 2.8, M.BODY, PART.LEG);
      R.rect(36, GROUND - 1, 4, 1, M.BODY, PART.LEG);
      headSide(R, 32, 22, {});
    },
    // grooming, three ways
    lickFlank(R, a) {
      const lick = Math.sin(a.t * 8) > 0;
      R.curve(15, 35, 6, 38, 4, 32, 3, 2.4, M.BODY, PART.TAIL);
      leg(R, 30, 28, GROUND, M.FAR, 0);
      R.ellipse(20, 31, 8.2, 7, M.BODY, PART.BODY);
      R.ellipse(26, 26, 6, 8, M.BODY, PART.CHEST);
      R.ellipse(20, GROUND - 1, 4.5, 1.6, M.BODY, PART.LEG);
      leg(R, 28, 28, GROUND, M.BODY, 0);
      headSide(R, 21, 22 + (lick ? 1 : 0), { dir: -1, eyes: "closed", tongue: lick });
    },
    washFace(R, a) {
      const k = (Math.sin(a.t * 5) + 1) / 2;
      R.curve(15, 35, 6, 38, 4, 32, 3, 2.4, M.BODY, PART.TAIL);
      leg(R, 30, 28, GROUND, M.FAR, 0);
      R.ellipse(20, 31, 8.2, 7, M.BODY, PART.BODY);
      R.ellipse(26.5, 25.5, 6, 8.6, M.BODY, PART.CHEST);
      R.ellipse(20, GROUND - 1, 4.5, 1.6, M.BODY, PART.LEG);
      headSide(R, 29, 16 + k, { eyes: "closed" });
      const px = 31 + 2 * k, py = 9 + 7 * k;
      R.limb(27, 26, px, py + 1, 2.8, M.BODY, PART.LEG);
      R.ellipse(px, py, 1.9, 1.6, M.BODY, PART.LEG);
    },
    legUp(R, a) {
      const lick = Math.sin(a.t * 8) > 0;
      R.curve(13, 36, 6, 38, 1, 37, 3, 2.2, M.BODY, PART.TAIL);
      leg(R, 31, 29, GROUND, M.FAR, 1);
      R.ellipse(19, 32, 8, 6, M.BODY, PART.BODY);
      R.ellipse(26, 29, 6, 6.5, M.BODY, PART.CHEST);
      R.limb(18, 30, 24, 8, 3.2, M.BODY, PART.LEG);
      R.ellipse(24.5, 6.5, 2.2, 1.8, M.BODY, PART.LEG);
      headSide(R, 22, 25 + (lick ? 1 : 0), { dir: -1, eyes: "closed", tongue: lick });
      leg(R, 29, 30, GROUND, M.BODY, 1);
    },
    // up against the scratching post, raking with both paws
    scratch(R, a) {
      const k = Math.sin(a.t * 9), k2 = Math.sin(a.t * 9 + Math.PI);
      R.curve(15, 34, 8, 30, 5, 22, 3, 2.4, M.BODY, PART.TAIL);
      R.limb(19, 31, 17, GROUND - 1, 3, M.FAR, PART.LEG);
      R.limb(30, 21, 38, 16 + k2 * 3, 2.8, M.FAR, PART.LEG);
      R.ellipse(20, 32, 6.5, 5, M.BODY, PART.BODY);
      R.limb(21, 30, 29, 21, 10, M.BODY, PART.CHEST);
      R.limb(22, 33, 22, GROUND - 1, 3, M.BODY, PART.LEG);
      R.rect(20, GROUND - 1, 5, 1, M.BODY, PART.LEG);
      headSide(R, 31, 14, { eyes: "happy" });
      R.limb(30, 22, 39, 18 + k * 3, 2.8, M.BODY, PART.LEG);
      R.ellipse(39.5, 18 + k * 3, 1.6, 1.8, M.BODY, PART.LEG);
    },
    zoom(R, a) { POSES.run(R, a); },
    // spooked: back arched high, tail puffed up, standing tall and sideways
    arch(R, a) {
      const puff = Math.sin(a.t * 18) > 0 ? 1 : 0;
      R.curve(13, 22, 8, 12, 13, 5, 3, 3.4, M.BODY, PART.TAIL);
      R.limb(17, 28, 16, GROUND - 1, 2.8, M.FAR, PART.LEG); R.limb(29, 28, 30, GROUND - 1, 2.8, M.FAR, PART.LEG);
      R.ellipse(22, 22.5, 9.5, 5.2, M.BODY, PART.BODY); R.ellipse(16.5, 26, 4.5, 4, M.BODY, PART.BODY); R.ellipse(28, 26, 5, 4.4, M.BODY, PART.CHEST);
      for (let x = 15; x <= 29; x += 2) R.put(x, 16.5 + Math.abs(x - 22) / 3 - puff, M.BODY, PART.BODY);   // fur standing on end
      R.limb(15, 29, 14, GROUND - 1, 2.8, M.BODY, PART.LEG); R.limb(27, 29, 28, GROUND - 1, 2.8, M.BODY, PART.LEG);
      headSide(R, 33, 24, { look: { x: 1, y: 0 } });
    },
    // fast asleep on its back, paws in the air: a cat that feels completely safe
    bellyUp(R, a) { POSES.roll(R, { ...a, t: 0.26, blink: true, eyes: "closed" }); },
    // "loaf": paws tucked away under a round body, like a little bread
    loaf(R, a) {
      const tail = Math.sin(a.t * 0.9) * 0.6;
      R.ellipse(22, 31.5, 11, 6.3, M.BODY, PART.BODY);
      R.ellipse(29, 30.5, 5.6, 6.2, M.BODY, PART.CHEST);
      R.ellipse(32.5, GROUND - 1, 3, 1.3, M.BODY, PART.LEG);
      R.curve(12, 35, 17, 39 + tail, 27, 38, 3, 2.4, M.BODY, PART.TAIL);      // tail wrapped round the front
      headSide(R, 33, 21.5, { eyes: a.eyes || (a.blink ? "blink" : null), look: a.look });
    },
    // "sploot": flat on the floor, back legs stretched out behind like a frog
    sploot(R, a) {
      const sway = Math.sin(a.t * 1.3) * 1.5;
      R.limb(15, 34, 4, 36.5, 2.8, M.FAR, PART.LEG);
      R.limb(31, 35, 39, 36.5, 2.6, M.FAR, PART.LEG);
      R.curve(13, 32, 9, 28 + sway, 6, 25, 3, 2.4, M.BODY, PART.TAIL);
      R.ellipse(22, 33.5, 11, 4.4, M.BODY, PART.BODY);
      R.ellipse(30, 33, 5.4, 4.4, M.BODY, PART.CHEST);
      R.limb(16, 35, 4, GROUND - 0.5, 2.8, M.BODY, PART.LEG);
      R.limb(32, 36, 40, GROUND - 0.5, 2.6, M.BODY, PART.LEG);
      headSide(R, 35, 28.5, { eyes: a.eyes || (a.blink ? "blink" : null), look: a.look });
    },
    // up on the hind legs like a meerkat, looking this way and that
    meerkat(R, a) {
      const back = Math.sin(a.st * 1.6 + 0.5) > 0.55;
      R.curve(15, 36, 8, 38, 5, 33, 3, 2.4, M.BODY, PART.TAIL);
      R.limb(19, 31, 18, GROUND - 1, 3, M.FAR, PART.LEG);
      R.ellipse(20, 33, 6.5, 4.8, M.BODY, PART.BODY);
      R.limb(21, 31, 24, 19, 10, M.BODY, PART.CHEST);
      R.limb(22, 33, 23, GROUND - 1, 3, M.BODY, PART.LEG);
      R.rect(21, GROUND - 1, 5, 1, M.BODY, PART.LEG);
      headSide(R, 25.5, 11, { dir: back ? -1 : 1, look: back ? { x: 0.5, y: -0.6 } : { x: 0.5, y: -0.6 }, eyes: a.blink ? "blink" : null });
      R.limb(27, 19, 29, 22.5, 2.6, M.BODY, PART.LEG);                       // paws held up at the chest
      R.ellipse(29.5, 23, 1.7, 1.4, M.BODY, PART.LEG);
    },
    // spinning round after its own tail
    tailChase(R, a) {
      const p = a.t * 14, c = Math.cos(p), hop = Math.sin(p) > 0 ? 1 : 0;
      leg(R, 17, 30 - hop, GROUND - hop, M.FAR, -2 * c);
      leg(R, 30, 30 - hop, GROUND - hop, M.FAR, 2 * c);
      R.ellipse(23, 29 - hop, 10, 5.4, M.BODY, PART.BODY);
      R.ellipse(29, 28.5 - hop, 5.4, 5.2, M.BODY, PART.CHEST);
      leg(R, 15, 30 - hop, GROUND - hop, M.BODY, 2 * c);
      leg(R, 28, 30 - hop, GROUND - hop, M.BODY, -2 * c);
      R.curve(13, 27 - hop, 11, 15, 19 + Math.sin(p) * 1.5, 13, 3, 2.4, M.BODY, PART.TAIL);   // tail flicking just out of reach
      headSide(R, 30, 20 - hop, { dir: -1, look: { x: 0.5, y: -0.5 } });
    },
    // a happy bounce: all four legs straight, back arched
    pronk(R, a) {
      R.curve(12, 25, 8, 17, 11, 11, 3, 2.4, M.BODY, PART.TAIL);
      R.limb(17, 29, 16, GROUND - 2, 2.8, M.FAR, PART.LEG);
      R.limb(29, 29, 30, GROUND - 2, 2.8, M.FAR, PART.LEG);
      R.ellipse(22, 26, 10.5, 5.6, M.BODY, PART.BODY);
      R.ellipse(29.5, 25.5, 5.6, 5.4, M.BODY, PART.CHEST);
      R.limb(14, 29, 13, GROUND - 1, 2.8, M.BODY, PART.LEG);
      R.limb(27, 29, 28, GROUND - 1, 2.8, M.BODY, PART.LEG);
      headSide(R, 35, 19, { eyes: "happy" });
    },
    // a slow blink at you: cat for "I love you"
    slowBlink(R, a) {
      const k = a.st, shut = (k > 0.7 && k < 1.6) || (k > 2.2 && k < 3.1);
      POSES.sit(R, { ...a, eyes: shut ? "closed" : null, look: null });
    },
    boop(R, a) { POSES.sit(R, { ...a, eyes: "happy" }); },
    inbox(R, a) { POSES.sit(R, { ...a, eyes: a.peekEyes }); },
    hunt(R, a) { POSES.crouch(R, a); },
  };

  // ---------------------------------------------------------------- the wardrobe: 10 designs x 10 colour schemes, three times over
  const SCHEMES = {
    cherry:    { tr: "Kiraz", en: "Cherry", c: ["#d94b4b", "#fff3e0", "#ffd34d"] },
    ocean:     { tr: "Okyanus", en: "Ocean", c: ["#3f7fd6", "#e8f4ff", "#ffd34d"] },
    mint:      { tr: "Nane", en: "Mint", c: ["#5fc7a4", "#ffffff", "#ff8fab"] },
    lavender:  { tr: "Lavanta", en: "Lavender", c: ["#a98be0", "#5b3f91", "#ffe08a"] },
    candy:     { tr: "Pamuk şeker", en: "Candy floss", c: ["#ff9ec0", "#ffffff", "#ff5a8a"] },
    lemon:     { tr: "Limon", en: "Lemon", c: ["#f5d547", "#f08a2e", "#ffffff"] },
    tangerine: { tr: "Mandalina", en: "Tangerine", c: ["#f28a3c", "#7a4524", "#ffe7b0"] },
    midnight:  { tr: "Gece", en: "Midnight", c: ["#2f3b73", "#e0b84a", "#ffffff"] },
    forest:    { tr: "Orman", en: "Forest", c: ["#4f8f45", "#7a5230", "#ffd34d"] },
    charcoal:  { tr: "Kömür", en: "Charcoal", c: ["#3a3a40", "#d94b4b", "#e8e8e8"] },
  };
  const HATS = {
    beanie: { tr: "örgü bere", en: "beanie" }, tophat: { tr: "silindir şapka", en: "top hat" }, party: { tr: "parti şapkası", en: "party hat" },
    crown: { tr: "taç", en: "crown" }, cap: { tr: "kasket", en: "cap" }, witch: { tr: "cadı şapkası", en: "witch hat" },
    chef: { tr: "aşçı şapkası", en: "chef's hat" }, beret: { tr: "ressam beresi", en: "beret" }, santa: { tr: "Noel şapkası", en: "Santa hat" },
    flowers: { tr: "çiçek taç", en: "flower crown" },
    cowboy: { tr: "kovboy şapkası", en: "cowboy hat" }, viking: { tr: "Viking miğferi", en: "viking helmet" }, halo: { tr: "melek halesi", en: "halo" },
    propeller: { tr: "pervaneli kep", en: "propeller cap" }, grad: { tr: "mezuniyet kepi", en: "graduation cap" }, bucket: { tr: "balıkçı şapkası", en: "bucket hat" },
    hairbow: { tr: "saç fiyongu", en: "hair bow" }, pirate: { tr: "korsan şapkası", en: "pirate hat" }, sunhat: { tr: "hasır şapka", en: "sun hat" },
    wizard: { tr: "büyücü külahı", en: "wizard hat" },
  };
  const COLLARS = {
    plain: { tr: "tasma", en: "collar" }, bell: { tr: "zilli tasma", en: "bell collar" }, bowtie: { tr: "papyon", en: "bow tie" },
    bigbow: { tr: "kocaman fiyonk", en: "big bow" }, bandana: { tr: "bandana", en: "bandana" }, pearls: { tr: "inci kolye", en: "pearl necklace" },
    scarf: { tr: "atkı", en: "scarf" }, tag: { tr: "kalpli künye", en: "heart tag" }, studs: { tr: "çivili tasma", en: "studded collar" },
    lei: { tr: "çiçek kolye", en: "flower lei" },
    tie: { tr: "kravat", en: "necktie" }, medal: { tr: "madalya", en: "medal" }, sailor: { tr: "denizci yakası", en: "sailor collar" },
    ruff: { tr: "fırfırlı yaka", en: "ruff" }, gem: { tr: "taşlı gerdanlık", en: "gem choker" }, chain: { tr: "altın zincir", en: "gold chain" },
    daisy: { tr: "papatya", en: "daisy" }, ribbon: { tr: "uzun kurdele", en: "long ribbon" }, cowl: { tr: "örgü boyunluk", en: "knit cowl" },
    star: { tr: "yıldız kolye", en: "star pendant" },
  };
  const OUTFITS = {
    sweater: { tr: "kazak", en: "sweater" }, stripes: { tr: "çizgili tişört", en: "striped tee" }, dots: { tr: "puantiyeli elbise", en: "polka-dot dress" },
    plaid: { tr: "ekose gömlek", en: "plaid shirt" }, zigzag: { tr: "zikzak hırka", en: "zigzag cardigan" }, raincoat: { tr: "yağmurluk", en: "raincoat" },
    stars: { tr: "yıldızlı pijama", en: "starry pyjamas" }, diagonal: { tr: "çapraz çizgili forma", en: "sash jersey" },
    vertical: { tr: "dikey çizgili yelek", en: "pinstripe vest" }, overalls: { tr: "salopet", en: "dungarees" },
    checker: { tr: "dama desenli kazak", en: "checkerboard jumper" }, hearts: { tr: "kalpli tişört", en: "heart tee" }, waves: { tr: "dalgalı mayo", en: "wave swimsuit" },
    camo: { tr: "kamuflaj ceket", en: "camo jacket" }, argyle: { tr: "baklava desenli yelek", en: "argyle vest" }, hoodie: { tr: "kapüşonlu", en: "hoodie" },
    floral: { tr: "çiçekli elbise", en: "floral dress" }, bold: { tr: "kalın çizgili forma", en: "rugby shirt" }, dash: { tr: "kesik çizgili pijama", en: "dashed pyjamas" },
    pocket: { tr: "cepli tişört", en: "pocket tee" },
    // costumes: their own fixed colours (the colour you pick doesn't change them)
    nurse: { tr: "hemşire kıyafeti", en: "nurse uniform", fixed: ["#fbfbfd", "#e2414e", "#e2414e"] },
    pirate: { tr: "korsan kıyafeti", en: "pirate outfit", fixed: ["#f6f1e6", "#c8323c", "#2a2420"] },
    chef: { tr: "aşçı ceketi", en: "chef's jacket", fixed: ["#fbfbfd", "#e2414e", "#2a2a30"] },
    police: { tr: "polis üniforması", en: "police uniform", fixed: ["#2b3b6a", "#1a1a22", "#ffd34d"] },
    firefighter: { tr: "itfaiyeci kıyafeti", en: "firefighter suit", fixed: ["#b88a3e", "#ffe14d", "#c9ced6"] },
    astronaut: { tr: "astronot kıyafeti", en: "astronaut suit", fixed: ["#f4f4f6", "#a9aeb8", "#3a6fd8"] },
    doctor: { tr: "doktor önlüğü", en: "doctor's coat", fixed: ["#fbfbfd", "#5ab6c9", "#8a8f98"] },
    knight: { tr: "şövalye zırhı", en: "knight's armour", fixed: ["#c3c8d0", "#868c96", "#e8b84a"] },
    ninja: { tr: "ninja kıyafeti", en: "ninja suit", fixed: ["#26262e", "#3a3a46", "#d8323c"] },
    royal: { tr: "kraliyet pelerini", en: "royal robe", fixed: ["#6a2c9a", "#fbfbfd", "#ffd34d"] },
    pawhero: { tr: "Pati Kahraman kostümü", en: "Paw Hero suit", fixed: ["#1fa3a0", "#e2414e", "#ffd34d"] },
    moonclaw: { tr: "Ay Pençesi kostümü", en: "Moon Claw suit", fixed: ["#4a2f7a", "#1c1530", "#dfe6f2"] },
  };
  const WARDROBE = { schemes: SCHEMES, hat: HATS, collar: COLLARS, outfit: OUTFITS };
  const toneCache = {};
  const toneOf = (h) => toneCache[h] || (toneCache[h] = (() => { const b = hex(h); return { base: b, light: lighten(b, 0.25), shade: darken(b, 0.22), deep: darken(b, 0.4) }; })());
  const split = (id) => { const [d, s] = String(id || "").split(":"); return { d, s: SCHEMES[s] ? s : "cherry" }; };
  const accCache = {};
  function accTones(acc) {
    if (!acc) return null;
    const key = `${acc.hat}|${acc.collar}|${acc.outfit}`;
    if (accCache[key]) return accCache[key];
    const A = {}, put = (id, mats) => { if (!id) return; const c = SCHEMES[split(id).s].c; mats.forEach((m, i) => { if (m) A[m] = toneOf(c[i]); }); };
    put(acc.hat, [M.H1, M.H2, M.H3]); put(acc.collar, [M.C1, M.C2, M.C3]); put(acc.outfit, [M.O1, M.O2, M.O3]);
    const fx = acc.outfit && OUTFITS[split(acc.outfit).d] && OUTFITS[split(acc.outfit).d].fixed;      // a costume keeps its own colours
    if (fx) fx.forEach((h, i) => { A[[M.O1, M.O2, M.O3][i]] = toneOf(h); });
    return (accCache[key] = A);
  }

  const isTorso = (R, x, y) => {
    const p = R.partAt(x, y), m = R.get(x, y);
    return (p === PART.BODY || p === PART.CHEST) && (m === M.BODY || m === M.FAR || m === M.BELLY || m === M.FORCE_BELLY || m === M.ACCENT || m === M.ACCENT2);
  };
  // the middle of the chest, for badges and emblems (worked out once per frame)
  function nearChest(R, x, y, r) {
    if (!R.cc) { let sx = 0, sy = 0, n = 0; for (let j = 0; j < R.h; j++) for (let i = 0; i < R.w; i++) if (R.part[j * R.w + i] === PART.CHEST && R.m[j * R.w + i]) { sx += i; sy += j; n++; } R.cc = n ? { x: sx / n + 0.5, y: sy / n + 0.5 - 1 } : { x: -99, y: -99 }; }
    return Math.hypot(x + 0.5 - R.cc.x, y + 0.5 - R.cc.y) <= r;
  }
  // 1 = main colour, 2 = second colour, by pattern
  function outfitMat(R, x, y) {
    const t = (xx, yy) => isTorso(R, xx, yy);
    switch (R.outfit) {
      case "sweater": return !t(x, y + 1) || (R.partAt(x, y - 1) === PART.HEAD) ? 2 : 1;
      case "stripes": return (y >> 1) % 2 ? 2 : 1;
      case "dots": return (x % 4 === 1 && y % 4 === 1) || (x % 4 === 3 && y % 4 === 3) ? 2 : 1;
      case "plaid": return x % 4 === 0 || y % 4 === 0 ? 2 : 1;
      case "zigzag": return (y + Math.abs((x % 6) - 3)) % 4 === 0 ? 2 : 1;
      case "raincoat": return !t(x, y - 1) || !t(x, y + 1) || (x % 6 === 3 && y % 3 === 1) ? 2 : 1;
      case "stars": { const k = (x * 7 + y * 13) % 19; return k === 0 || k === 7 ? 2 : 1; }
      case "diagonal": return (x + y) % 6 < 2 ? 2 : 1;
      case "vertical": return x % 3 === 0 ? 2 : 1;
      case "overalls": return y >= 29 || (y >= 22 && (x % 8 === 3)) ? 2 : 1;
      case "checker": return ((x >> 1) + (y >> 1)) % 2 ? 2 : 1;
      case "hearts": { const u = x % 6, v = y % 6; return (v === 1 && (u === 1 || u === 3)) || (v === 2 && u >= 1 && u <= 3) || (v === 3 && u === 2) ? 2 : 1; }
      case "waves": return (y + Math.round(Math.sin(x * 0.9) * 1.2)) % 4 === 0 ? 2 : 1;
      case "camo": { const k = Math.sin(x * 0.7) + Math.cos(y * 0.9) + Math.sin((x + y) * 0.4); return k > 0.7 ? 2 : 1; }
      case "argyle": { const u = x % 8, v = y % 8; return Math.abs(u - 4) + Math.abs(v - 4) <= 2 ? 2 : (u === v || u + v === 8) ? 2 : 1; }
      case "hoodie": return !t(x, y - 2) || (y >= 27 && y <= 29 && x % 10 >= 3 && x % 10 <= 7) ? 2 : 1;
      case "floral": { const u = x % 5, v = (y + (x / 5 | 0) * 2) % 5; return (u === 2 && v !== 2 && (v === 1 || v === 3)) || (v === 2 && (u === 1 || u === 3)) ? 2 : 1; }
      case "bold": return (y >> 2) % 2 ? 2 : 1;
      case "dash": return y % 3 === 0 && x % 4 < 2 ? 2 : 1;
      // costumes (1, 2 or 3: the costume's own three colours)
      case "nurse": if (!t(x, y + 1)) return 2; if (nearChest(R, x, y, 2.2) && (Math.abs(x + 0.5 - R.cc.x) < 0.8 || Math.abs(y + 0.5 - R.cc.y) < 0.8)) return 3; return 1;
      case "pirate": if (!t(x, y + 2) && t(x, y + 1)) return 3; return (y >> 1) % 2 ? 2 : 1;
      case "chef": if (!t(x, y - 1)) return 2; if (R.partAt(x, y) === PART.CHEST && x % 3 === 1 && y % 3 === 0) return 3; return 1;
      case "police": if (!t(x, y + 1) || !t(x, y + 2)) return 2; if (nearChest(R, x, y, 1.3)) return 3; return R.partAt(x, y) === PART.CHEST && x % 4 === 2 && y % 3 === 1 ? 3 : 1;
      case "firefighter": if (y % 6 === 2) return 2; if (y % 6 === 3) return 3; return 1;
      case "astronaut": if (nearChest(R, x, y, 1.8)) return 3; return x % 6 === 0 && y % 2 === 0 ? 2 : 1;
      case "doctor": if (R.partAt(x, y) === PART.CHEST && t(x, y - 1)) return (x + y) % 9 === 0 ? 3 : 2; return 1;
      case "knight": if (!t(x, y - 1)) return 3; return y % 3 === 0 ? 2 : 1;
      case "ninja": if (!t(x, y + 1) || !t(x, y + 2)) return 3; return (x + y) % 5 === 0 ? 2 : 1;
      case "royal": if (!t(x, y + 1)) return 2; if (!t(x, y + 2) || !t(x, y - 1)) return 3; return 1;
      case "pawhero": if (!t(x, y + 1) || !t(x, y + 2)) return 2; if (nearChest(R, x, y, 2.4)) { const dx = x + 0.5 - R.cc.x, dy = y + 0.5 - R.cc.y; return (dy > -0.4 && Math.hypot(dx, dy) < 1.6) || (dy < -0.6 && Math.abs(dx) > 0.6 && Math.abs(dx) < 2.2) ? 3 : 1; } return 1;
      case "moonclaw": if (y % 5 === 0) return 2; if (nearChest(R, x, y, 2.3)) { const dx = x + 0.5 - R.cc.x, dy = y + 0.5 - R.cc.y; return Math.hypot(dx, dy) < 2.1 && Math.hypot(dx - 1, dy - 0.6) > 1.5 ? 3 : 1; } return 1;
      case "pocket": return !t(x, y + 1) || ((x % 12 >= 4 && x % 12 <= 7) && (y >= 25 && y <= 28) && (x % 12 === 4 || x % 12 === 7 || y === 28)) ? 2 : 1;
    }
    return 1;
  }

  function drawHat(R, h, design) {
    const d = h.d, top = h.y - (h.low ? 3.6 : h.front ? 4.8 : 4.4), cx = h.x + (h.front ? 0 : 0.4 * d);
    const P = (u, v, m) => R.put(cx + d * u, top - v, m, PART.HAT);
    const Rc = (u0, v0, w, hh, m) => { for (let v = 0; v < hh; v++) for (let u = 0; u < w; u++) P(u0 + u, v0 + v, m); };
    const E = (u, v, ru, rv, m, vmin = -99) => {
      for (let vv = Math.floor(v - rv - 1); vv <= Math.ceil(v + rv + 1); vv++) for (let uu = Math.floor(u - ru - 1); uu <= Math.ceil(u + ru + 1); uu++) {
        const a = (uu + 0.5 - u) / ru, b = (vv + 0.5 - v) / rv; if (a * a + b * b <= 1 && vv >= vmin) P(uu, vv, m);
      }
    };
    const T = (au, av, bu, bv, cu, cv, m) => R.tri(cx + d * au, top - av, cx + d * bu, top - bv, cx + d * cu, top - cv, m, PART.HAT);
    switch (design) {
      case "beanie": E(0, 0.5, 5.6, 4.6, M.H1, 0); for (let u = -5; u <= 5; u++) { P(u, 0, M.H2); P(u, 1, u % 2 ? M.H2 : M.H1); } E(0, 5.6, 1.8, 1.8, M.H3); break;
      case "tophat": Rc(-6, 0, 13, 1, M.H1); Rc(-4, 1, 8, 7, M.H1); Rc(-4, 2, 8, 1, M.H2); P(2, 2, M.H3); break;
      case "party": T(-4.5, 0, 4.5, 0, 0.5, 10, M.H1); for (const v of [2, 5, 8]) { const w = 4.5 * (1 - v / 10); for (let u = Math.floor(-w); u <= Math.ceil(w) - 1; u++) P(u + 0.5, v, M.H2); } E(0.5, 10.6, 1.5, 1.5, M.H3); break;
      case "crown": Rc(-5, 0, 10, 2, M.H1); T(-5, 1.5, -2.5, 1.5, -4, 5.5, M.H1); T(-1.4, 1.5, 1.4, 1.5, 0, 6.5, M.H1); T(2.5, 1.5, 5, 1.5, 4, 5.5, M.H1);
        P(-3.5, 0.6, M.H3); P(0, 0.6, M.H2); P(3, 0.6, M.H3); P(-4, 5, M.H3); P(0, 6, M.H3); P(4, 5, M.H3); break;
      case "cap": E(-0.5, 0.6, 4.9, 3.4, M.H1, 0); Rc(h.front ? -4 : 3, 0, h.front ? 9 : 5, 1, M.H2); P(-0.5, 3.6, M.H2); break;
      case "witch": Rc(-7, 0, 15, 1, M.H1); T(-3.8, 1, 3.8, 1, -1.5, 9, M.H1); T(-2.4, 7.5, -0.6, 7.5, -5, 10.5, M.H1); Rc(-3, 1, 7, 1, M.H2); P(0, 1, M.H3); break;
      case "chef": Rc(-4, 0, 8, 2, M.H2); E(-2.6, 4, 2.7, 2.5, M.H1); E(0.4, 5, 2.9, 2.9, M.H1); E(3, 3.8, 2.4, 2.3, M.H1); break;
      case "beret": E(-0.5, 1.2, 6, 1.9, M.H1); P(-0.5, 3.4, M.H1); P(0.5, 3.4, M.H2); for (let u = -5; u <= 4; u++) P(u, 0, M.H2); break;
      case "santa": T(-4.6, 1, 4.6, 1, -3.5, 8.5, M.H1); T(-4.4, 8, -1.2, 6.2, -7.5, 4.5, M.H1); Rc(-5, 0, 11, 2, M.H2); E(-7.5, 4, 1.7, 1.7, M.H2); break;
      case "cowboy": Rc(-8, 0, 17, 1, M.H1); P(-8, 1, M.H1); P(8, 1, M.H1); Rc(-4, 1, 9, 4, M.H1); Rc(-4, 1, 9, 1, M.H2); P(0, 5, M.H1); P(-1, 4, M.H3); break;
      case "viking": E(0, 0.8, 5, 3.6, M.H2, 0); for (let u = -5; u <= 5; u++) P(u, 0, M.H3);
        R.limb(cx - d * 5, top - 1.5, cx - d * 8, top - 6, 1.3, M.H1, PART.HAT); R.limb(cx + d * 5, top - 1.5, cx + d * 8, top - 6, 1.3, M.H1, PART.HAT); break;
      case "halo": for (let u = -4; u <= 4; u++) { P(u, 4.5 + (Math.abs(u) > 3 ? 0.6 : 0), M.H1); } P(-4.5, 5.2, M.H3); P(4.5, 5.2, M.H3); break;
      case "propeller": E(0, 0.6, 5, 3.2, M.H1, 0); for (let u = -5; u <= 5; u++) P(u, 0, M.H2); P(0, 4, M.H3); P(0, 5, M.H3);
        { const sp = Math.sin(performance.now() / 70); Rc(-Math.round(4 * Math.abs(sp)) - 1, 6, Math.round(8 * Math.abs(sp)) + 2, 1, M.H2); } break;
      case "grad": Rc(-4, 0, 9, 3, M.H1); Rc(-7, 3, 15, 1, M.H1); Rc(-6, 4, 13, 1, M.H1); P(0, 5, M.H3); R.limb(cx, top - 5, cx + d * 5, top - 2, 0.8, M.H3, PART.HAT); P(5, 1, M.H3); P(5, 0, M.H3); break;
      case "bucket": Rc(-7, 0, 15, 1, M.H1); Rc(-6, 1, 13, 1, M.H1); E(0, 2, 4.6, 3.4, M.H1, 1.5); Rc(-4, 2, 9, 1, M.H2); break;
      case "hairbow": { const bu = h.front ? 2.5 : -1.5; E(bu - 2.4, 1.6, 2.2, 1.8, M.H1); E(bu + 2.4, 1.6, 2.2, 1.8, M.H1); E(bu, 1.6, 1, 1.1, M.H2); P(bu - 2.6, 1.6, M.H3); P(bu + 2.6, 1.6, M.H3); break; }
      case "pirate": Rc(-6, 0, 13, 2, M.H1); T(-6.5, 1.5, 6.5, 1.5, 0, 6.5, M.H1); T(-7, 0, -5, 2, -8, 4, M.H1); T(7, 0, 5, 2, 8, 4, M.H1); E(0, 3.2, 1.2, 1.2, M.H2); P(-0.5, 3.4, M.H3); P(0.5, 3.4, M.H3); break;
      case "sunhat": Rc(-9, 0, 19, 1, M.H1); Rc(-8, 1, 17, 1, M.H1); E(0, 2.3, 4.5, 2.8, M.H1, 1.5); Rc(-4.5, 2, 9, 1, M.H2); E(3.5, 3, 1.3, 1.3, M.H3); break;
      case "wizard": Rc(-6, 0, 13, 1, M.H1); T(-4, 1, 4, 1, 1.5, 12, M.H1); P(-1, 3, M.H3); P(1, 6, M.H3); P(0, 9, M.H3); P(-2, 4, M.H2); P(2, 3, M.H2); P(1, 9.5, M.H2); break;
      case "flowers": for (let u = -5; u <= 5; u++) P(u, 0, M.H2); [[-4.2, M.H1], [-1.5, M.H3], [1.2, M.H1], [3.8, M.H3]].forEach(([u, m]) => { E(u, 1.4, 1.5, 1.4, m); P(u, 1.2, m === M.H1 ? M.H3 : M.H1); }); break;
    }
  }

  function drawCollar(R, h, design) {
    const d = h.d, onBody = (x, y) => { const p = R.partAt(x, y); return R.get(x, y) && (p === PART.BODY || p === PART.CHEST || p === PART.COLLAR); };
    const B = (x, y, m) => { if (onBody(x, y)) R.put(x, y, m, PART.COLLAR); };
    const D = (x, y, m) => R.put(x, y, m, PART.COLLAR);
    const bandMat = (i, row) => {
      switch (design) {
        case "studs": return i % 2 === 0 && row === 0 ? M.C3 : M.C1;
        case "pearls": return i % 2 ? M.C2 : M.C3;
        case "lei": return [M.C1, M.C3, M.C2][i % 3];
        case "scarf": return i % 3 === 0 ? M.C2 : M.C1;
        case "chain": return i % 2 ? M.C3 : M.C1;
        case "cowl": return (i + row) % 2 ? M.C2 : M.C1;
        case "ruff": return row === 0 ? M.C2 : i % 2 ? M.C1 : M.C2;
        case "sailor": return row === 1 ? M.C2 : M.C1;
        case "gem": return M.C2;
        default: return M.C1;
      }
    };
    const rows = design === "scarf" || design === "cowl" || design === "ruff" ? 3 : design === "pearls" || design === "chain" || design === "gem" || design === "ribbon" ? 1 : 2;
    if (h.flip) return;
    if (h.low) {                                     // sleeping: the collar shows behind the head as a little stripe
      for (let y = Math.round(h.y - 3); y <= Math.round(h.y + 3); y++) for (let k = 0; k < Math.min(rows, 2); k++) B(Math.round(h.x - 6 - k), y, bandMat(y, k));
      return;
    }
    const ny = Math.round(h.y + 5.5), uMin = h.front ? -6 : -5, uMax = h.front ? 6 : 4;
    for (let r = 0; r < rows; r++) for (let u = uMin, i = 0; u <= uMax; u++, i++) B(Math.round(h.x + d * u), ny + r, bandMat(i, r));
    const fx = h.x + (h.front ? 0 : d * 2.5), fy = ny + 1;
    switch (design) {
      case "plain": D(fx, fy, M.C3); break;
      case "bell": R.ellipse(fx + 0.5, fy + 2, 1.5, 1.5, M.C3, PART.COLLAR); D(fx, fy + 2.6, M.C2); break;
      case "bowtie": R.tri(fx + 0.5, fy + 0.5, fx - 3, fy - 1.3, fx - 3, fy + 2.3, M.C1, PART.COLLAR); R.tri(fx + 0.5, fy + 0.5, fx + 4, fy - 1.3, fx + 4, fy + 2.3, M.C1, PART.COLLAR); D(fx, fy, M.C2); D(fx + 1, fy, M.C2); break;
      case "bigbow": { const bx = h.x - (h.front ? -4 : d * 4), by = ny - 0.5;
        R.ellipse(bx - 2.6, by, 2.5, 2, M.C1, PART.COLLAR); R.ellipse(bx + 2.8, by, 2.5, 2, M.C1, PART.COLLAR);
        R.limb(bx - 0.5, by + 1, bx - 2, by + 5, 1.4, M.C1, PART.COLLAR); R.limb(bx + 0.5, by + 1, bx + 2, by + 5, 1.4, M.C1, PART.COLLAR); R.ellipse(bx + 0.2, by, 1.2, 1.3, M.C2, PART.COLLAR); break; }
      case "bandana": R.tri(h.x - d * 4, ny, h.x + d * 3.5, ny, h.x + d * 1.2, ny + 6, M.C1, PART.COLLAR); D(h.x + d * 0.5, ny + 2, M.C2); D(h.x + d * 2, ny + 1, M.C2); D(h.x + d * 1, ny + 4, M.C2); break;
      case "scarf": if (!h.front) for (let k = 0; k < 6; k++) { D(h.x - d * 4, ny + 2 + k, k % 2 ? M.C2 : M.C1); D(h.x - d * 3, ny + 2 + k, M.C1); } break;
      case "tag": D(fx - 1, fy + 1, M.C3); D(fx + 1, fy + 1, M.C3); D(fx - 1, fy + 2, M.C3); D(fx, fy + 2, M.C3); D(fx + 1, fy + 2, M.C3); D(fx, fy + 3, M.C3); break;
      case "lei": R.ellipse(fx, fy + 1, 1.3, 1.3, M.C1, PART.COLLAR); D(fx, fy + 1, M.C3); break;
      case "tie": D(fx, fy, M.C2); D(fx + 1, fy, M.C2); for (let k = 1; k < 7; k++) { D(fx, fy + k, M.C2); if (k > 1 && k < 6) D(fx + 1, fy + k, M.C2); } D(fx, fy + 2, M.C3); D(fx + 1, fy + 4, M.C3); break;
      case "medal": D(fx, fy, M.C1); D(fx, fy + 1, M.C1); R.ellipse(fx + 0.5, fy + 3, 1.8, 1.8, M.C3, PART.COLLAR); D(fx, fy + 3, M.C2); break;
      case "sailor": R.tri(fx - 3, fy - 1, fx + 4, fy - 1, fx + 0.5, fy + 4, M.C1, PART.COLLAR); D(fx, fy + 1, M.C3); D(fx + 1, fy + 1, M.C3); D(fx, fy + 2, M.C3); break;
      case "ruff": break;
      case "gem": D(fx, fy, M.C3); D(fx + 1, fy, M.C3); D(fx, fy + 1, M.C3); D(fx + 1, fy + 1, M.C1); break;
      case "chain": R.ellipse(fx + 0.5, fy + 2, 1.2, 1.4, M.C3, PART.COLLAR); break;
      case "daisy": for (const [u, v] of [[0, -1.6], [1.6, 0], [0, 1.6], [-1.6, 0]]) R.ellipse(fx + 0.5 + u, fy + 1 + v, 1, 1, M.C2, PART.COLLAR); D(fx, fy + 1, M.C3); D(fx + 1, fy + 1, M.C3); break;
      case "ribbon": R.limb(fx, fy, fx - 1.5, fy + 7, 1.1, M.C1, PART.COLLAR); R.limb(fx + 1, fy, fx + 3, fy + 6.5, 1.1, M.C1, PART.COLLAR); D(fx, fy, M.C2); break;
      case "cowl": break;
      case "star": D(fx, fy, M.C1); D(fx, fy + 1, M.C3); D(fx - 1, fy + 2, M.C3); D(fx, fy + 2, M.C3); D(fx + 1, fy + 2, M.C3); D(fx, fy + 3, M.C3); D(fx - 1, fy + 4, M.C3); D(fx + 1, fy + 4, M.C3); break;
    }
  }

  // body shape for the big cats, worked on the drawn pose: heavy legs, a deep chest and small round ears for the
  // tiger, lion, leopards, puma and panther; thin legs, a tucked-in belly and dark "tear lines" for the cheetah
  function morph(R, P) {
    const mk = P.morph; if (!mk) return;
    const W = R.w, H = R.h, m0 = R.m.slice(), p0 = R.part.slice(), at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? -1 : y * W + x);
    const torso = (p) => p === PART.BODY || p === PART.CHEST;
    if (mk === "big") {
      for (let y = 0; y < GROUND; y++) for (let x = 0; x < W; x++) {
        const i = at(x, y); if (m0[i]) continue;
        for (const dx of [-1, 1]) { const j = at(x + dx, y); if (j >= 0 && m0[j] && p0[j] === PART.LEG) { R.m[i] = m0[j]; R.part[i] = PART.LEG; break; } }
        if (!R.m[i]) { const j = at(x, y - 1); if (j >= 0 && m0[j] && torso(p0[j])) { R.m[i] = m0[j]; R.part[i] = p0[j]; } }
      }
      if (R.head) for (let i = 0; i < W * H; i++) if (R.part[i] === PART.EAR && Math.floor(i / W) < R.head.y - 6) { R.m[i] = 0; R.part[i] = 0; }
    } else if (mk === "lean") {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = at(x, y); if (!m0[i]) continue;
        if (p0[i] === PART.LEG) { const j = at(x + 1, y); if (j < 0 || !m0[j]) { R.m[i] = 0; R.part[i] = 0; } }
        else if (torso(p0[i]) && y < GROUND - 1) { const j = at(x, y + 1); if (j < 0 || !m0[j]) { R.m[i] = 0; R.part[i] = 0; } }
      }
      const h = R.head;
      if (h && !h.front && !h.flip) { const ex = Math.round(h.x + h.d * 2.2), ey = Math.round(h.y - 1); for (let k = 2; k <= 4; k++) { const x = ex + (k > 3 ? h.d : 0), i = at(x, ey + k); if (i >= 0 && R.part[i] === PART.HEAD && (R.m[i] === M.BODY || R.m[i] === M.BELLY)) R.m[i] = M.ACCENT; } }
    }
  }
  // a lion's mane: a big shaggy ruff round the head that spills down over the neck and chest, darker at its tufted edge
  function mane(R, P) {
    if (!P.mane || !R.head || R.head.flip) return;
    const h = R.head, cx = h.front ? h.x : h.x - h.d * 1.6, cy = h.y + 2.6, rx = 11.5, ry = 11;
    for (let y = Math.floor(cy - ry - 2); y <= cy + ry + 2; y++) for (let x = Math.floor(cx - rx - 2); x <= cx + rx + 2; x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, k = Math.sqrt(dx * dx + dy * dy), ang = Math.atan2(dy, dx);
      const edge = 1 + 0.14 * Math.cos(ang * 11) + 0.06 * Math.cos(ang * 5 + 1);        // tufts all round
      if (k > edge || y >= GROUND - 1) continue;
      const m = R.get(x, y), part = R.partAt(x, y);
      if (m && !(part === PART.BODY || part === PART.CHEST)) continue;                 // never over the face, ears, legs or tail
      R.put(x, y, k > edge - 0.2 || (k > 0.55 && (x + 2 * y) % 5 === 0) ? M.ACCENT : M.ACCENT2, PART.BODY);
    }
  }
  function dress(R, acc) {
    if (!acc) return;
    R.outfit = acc.outfit ? split(acc.outfit).d : null;
    if (!R.head) return;
    if (acc.collar) drawCollar(R, R.head, split(acc.collar).d);
    if (acc.hat && !R.head.flip) drawHat(R, R.head, split(acc.hat).d);
  }

  // ---------------------------------------------------------------- coat patterns + lighting
  function patternMaterial(P, mat, part, x, y) {
    if (mat !== M.BODY && mat !== M.FAR && mat !== M.BELLY) return mat;
    const pat = P.pattern;
    if (mat === M.BELLY && pat === "solid") return M.BODY;
    if (pat === "stripes") {
      if ((part === PART.BODY || part === PART.CHEST) && mat !== M.BELLY && ((x + (y >> 1)) % 5 === 0) && y < 30) return M.ACCENT;
      if (part === PART.HEAD && mat !== M.BELLY && (x % 3 === 0) && y < 20 && y > 11) return M.ACCENT;
      if (part === PART.TAIL && (x + y) % 4 === 0) return M.ACCENT;
      if (part === PART.LEG && y % 3 === 0 && y < GROUND - 1) return M.ACCENT;
    }
    if (pat === "calico" && mat !== M.BELLY) {
      const n = Math.sin(x * 0.55 + 1.3) + Math.cos(y * 0.6 - 0.4) + Math.sin((x + y) * 0.3);
      if (part === PART.EAR || part === PART.TAIL) return n > 0 ? M.ACCENT : M.ACCENT2;
      if (n > 1.15) return M.ACCENT; if (n < -1.35) return M.ACCENT2;
    }
    if (pat === "spots" && mat !== M.BELLY && part !== PART.EAR) {             // little dark spots (bengal, cheetah)
      const u = (x + ((y >> 1) % 2) * 2) % 4, v = y % 3;
      if (u === 0 && v === 1 && y < GROUND - 1) return M.ACCENT;
      if (part === PART.TAIL && x % 3 === 0) return M.ACCENT;
    }
    if (pat === "rosette" && mat !== M.BELLY && part !== PART.EAR) {           // leopard rosettes: a dark ring round a warmer middle
      const u = (x + ((y / 5 | 0) % 2) * 3) % 6, v = y % 5;
      if ((u === 1 || u === 3) && (v === 1 || v === 3) || (u === 2 && (v === 0 || v === 4))) return M.ACCENT;
      if (u === 2 && v >= 1 && v <= 3) return M.ACCENT2;
      if (part === PART.TAIL && (x + y) % 4 === 0) return M.ACCENT;
    }
    if (pat === "tiger" && mat !== M.BELLY) {                                     // bold black stripes
      if ((part === PART.BODY || part === PART.CHEST) && ((x + (y >> 2)) % 4 === 0) && y < 31) return M.ACCENT;
      if (part === PART.HEAD && (x % 3 === 0) && y < 19 && y > 8) return M.ACCENT;
      if (part === PART.TAIL && (x + y) % 3 === 0) return M.ACCENT;
      if (part === PART.LEG && y % 3 === 0 && y < GROUND - 1) return M.ACCENT;
    }
    if (pat === "puma" || pat === "lion") {                                       // plain coat, dark tail tip and ear backs, pale muzzle
      if (part === PART.EAR) return M.ACCENT;
      if (part === PART.TAIL && y < 24 && x < 12) return M.ACCENT;
      if (part === PART.HEAD && mat === M.BELLY) return M.BELLY;
      if (mat === M.BELLY) return part === PART.CHEST ? M.BELLY : M.BODY;
    }
    if (pat === "points") {
      if (part === PART.EAR || part === PART.TAIL) return M.ACCENT;
      if (part === PART.LEG && y > GROUND - 5) return M.ACCENT;
      if (part === PART.HEAD && mat === M.BELLY) return M.ACCENT;
    }
    if (pat === "tuxedo") {
      if (part === PART.CHEST && y > 24) return M.BELLY;
      if (part === PART.LEG && y > GROUND - 4) return M.BELLY;
      if (part === PART.HEAD && mat === M.BELLY) return M.BELLY;
      if (mat === M.BELLY) return M.BODY;
    }
    if (mat === M.BELLY && part !== PART.HEAD) return M.BODY;
    return mat;
  }

  function shade(R, P, out, A) {
    const d = out.data; d.fill(0);
    const tone = (m) => (A && A[m]) || P[m] || P[M.BODY];
    for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) {
      const i = y * SW + x; let m = R.m[i]; if (!m) continue;
      let rgb;
      if (m === M.EYE) rgb = P.eye; else if (m === M.PUPIL) rgb = P.pupil; else if (m === M.NOSE) rgb = P.nose;
      else if (m === M.EAR) rgb = P.ear; else if (m === M.CLOSED) rgb = P.closed; else if (m === M.TONGUE) rgb = P.tongue;
      else {
        const far = m === M.FAR;
        let mm = m === M.FORCE_BELLY ? M.BELLY : patternMaterial(P, far ? M.BODY : m, R.part[i], x, y);
        if (R.outfit && isTorso(R, x, y)) { const o = outfitMat(R, x, y); mm = o === 3 ? M.O3 : o === 2 ? M.O2 : M.O1; }
        if (far && mm === M.BODY) mm = M.BODY;
        const t = tone(mm);
        const above = R.get(x, y - 1), below = R.get(x, y + 1), right = R.get(x + 1, y);
        if (far) rgb = t.deep;
        else if (!above) rgb = t.light;                              // top edge catches the light
        else if (!below || y >= GROUND - 1) rgb = t.shade;           // underside in shadow
        else if (!right && (x + y) % 2 === 0) rgb = t.shade;         // dithered rim on the back
        else rgb = t.base;
      }
      if (R.grey && R.head && !R.head.flip && R.part[i] === PART.HEAD && m !== M.EYE && m !== M.PUPIL && m !== M.NOSE && m !== M.CLOSED) {
        const h = R.head, mx = h.front ? h.x : h.x + h.d * 4, my = h.y + (h.front ? 2.4 : 1.6);
        const ex = (x + 0.5 - mx) / 4, ey = (y + 0.5 - my) / 3;
        if (ex * ex + ey * ey <= 1) rgb = mix(rgb, [222, 220, 226], 0.6);          // a wise old cat's grey muzzle
      }
      const o = i * 4; d[o] = rgb[0]; d[o + 1] = rgb[1]; d[o + 2] = rgb[2]; d[o + 3] = 255;
    }
    // outline
    const ol = P.outline;
    for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) {
      if (R.m[y * SW + x]) continue;
      if (R.get(x - 1, y) || R.get(x + 1, y) || R.get(x, y - 1) || R.get(x, y + 1)) {
        const o = (y * SW + x) * 4; d[o] = ol[0]; d[o + 1] = ol[1]; d[o + 2] = ol[2]; d[o + 3] = 255;
      }
    }
  }

  // ---------------------------------------------------------------- portraits (for the cat card)
  const portraitCache = { pal: {} };
  function portrait(ctx, coat, o = {}) {
    const R = portraitCache.R || (portraitCache.R = new Raster()); R.clear();
    const c = portraitCache.c || (portraitCache.c = Object.assign(document.createElement("canvas"), { width: SW, height: SH }));
    const g = c.getContext("2d"), img = portraitCache.img || (portraitCache.img = g.createImageData(SW, SH));
    R.grey = !!o.grey;
    (POSES[o.pose] || POSES.sit)(R, { t: o.t || 0, st: 1, phase: o.phase || 0, blink: !!o.blink, eyes: o.eyes || null, look: o.look || null });
    const pk = coat + (o.genes ? "|" + L_GENES(o.genes) : ""), pal = portraitCache.pal[pk] || (portraitCache.pal[pk] = buildPalette(coat, o.genes));
    morph(R, pal); mane(R, pal); dress(R, o.acc); shade(R, pal, img, accTones(o.acc)); g.putImageData(img, 0, 0);
    const k = o.scale || 2, W = ctx.canvas.width, H = ctx.canvas.height;
    ctx.imageSmoothingEnabled = false;
    const kx = pal.kx || 1, ky = pal.ky || 1;
    ctx.drawImage(c, Math.round((W - SW * k * kx) / 2 + (o.dx ?? 4) * k), Math.round((H - SH * k * ky) / 2 + (o.dy || 0) * k), SW * k * kx, SH * k * ky);
  }

  // ---------------------------------------------------------------- toy sprites (same lit + outlined look)
  function toyImage(R, pal, outline, ctx, img) {
    const d = img.data; d.fill(0); const W = R.w, H = R.h;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const m = R.m[y * W + x]; if (!m) continue;
      const p = pal[m]; let c = p.c;
      if (p.lit) { if (!R.get(x, y - 1)) c = lighten(c, 0.22); else if (!R.get(x, y + 1)) c = darken(c, 0.25); }
      const o = (y * W + x) * 4; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (R.m[y * W + x]) continue;
      if (R.get(x - 1, y) || R.get(x + 1, y) || R.get(x, y - 1) || R.get(x, y + 1)) {
        const o = (y * W + x) * 4; d[o] = outline[0]; d[o + 1] = outline[1]; d[o + 2] = outline[2]; d[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }
  class Sprite {
    constructor(w, h) { this.R = new Raster(w, h); this.c = document.createElement("canvas"); this.c.width = w; this.c.height = h; this.g = this.c.getContext("2d"); this.img = this.g.createImageData(w, h); }
    paint(pal, outline) { toyImage(this.R, pal, outline, this.g, this.img); return this.c; }
  }

  // ---------------------------------------------------------------- the world
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pick = (weights) => { let s = 0; for (const k in weights) s += weights[k]; let r = Math.random() * s; for (const k in weights) { r -= weights[k]; if (r <= 0) return k; } return Object.keys(weights)[0]; };
  const G = 1500;                                   // gravity, px/s²

  const PERCH_OK = ["arch", "loaf", "slowBlink", "birdWatch", "meerkat", "sit", "groom", "lickFlank", "washFace", "legUp", "sleep", "knead", "stretch", "yawn", "happy", "boop", "roll", "prep"];
  class Cat {
    constructor(world, coat, x) {
      this.world = world; this.coat = coat; this.P = buildPalette(coat);
      this.x = x; this.y = 0; this.vx = 0; this.vy = 0; this.facing = Math.random() < 0.5 ? 1 : -1;
      this.R = new Raster(); this.canvas = document.createElement("canvas"); this.canvas.width = SW; this.canvas.height = SH;
      this.ctx = this.canvas.getContext("2d"); this.img = this.ctx.createImageData(SW, SH);
      this.t = rnd(0, 10); this.phase = 0; this.blinkT = rnd(2, 5); this.blink = false;
      this.boopCool = rnd(5, 15); this.fightCool = rnd(20, 40); this.peek = 0; this.peekTo = 0; this.fed = -1; this.look = null;
      this.profile = null; this.mods = null; this.size = 1; this.tagY = null;
      this.set("sit", rnd(1, 3));
    }
    // kittens are drawn smaller; they grow as they're looked after
    get s() { return this.profile ? Math.max(1, Math.round(this.world.scale * this.size * 2) / 2) : this.world.scale; }
    get name() { return this.profile ? this.profile.name : "?"; }
    // what the cat has on right now (a party hat goes on for birthdays if there's no other hat)
    wearing() {
      const a = this.profile && this.profile.acc;
      if (this.partyT > 0) return { ...(a || {}), hat: a && a.hat ? a.hat : "party:candy" };
      return a && (a.hat || a.collar || a.outfit) ? a : null;
    }
    get pid() { return this.profile && this.profile.id; }
    care(kind, arg) { if (window.CatLife && this.profile) window.CatLife.care(this, kind, arg); }
    set(state, dur = 3, extra = {}) {
      if (this.stray && ["chase", "hunt", "stand", "bat", "prep", "dangle"].includes(state) && !(state === "chase" && extra.goal === "bowl")) return;
      if (state !== "sleep") this.belly = false;
      if (this.state === "inbox" && state !== "inbox" && this.box) { this.box.occupant = null; this.box = null; }
      if (this.bed && !["knead", "sleep", "stretch", "yawn"].includes(state)) { this.bed.occupant = null; this.bed = null; }
      if (this.cushion && !(this.cushion.f.hide ? ["sleep", "knead"] : ["knead", "sleep", "stretch", "yawn", "loaf", "sit", "groom", "slowBlink", "happy"]).includes(state)) {
        if (this.cushion.f.hide) this.facing = Math.random() < 0.5 ? -1 : 1;    // pops out of the door
        this.cushion.occupant = null; this.cushion = null;
      }
      if (this.perch && (state === "held" || state === "fall")) this.perch = null;
      if (this.perch && !PERCH_OK.includes(state) && state !== "leap") {
        // asked to do something that needs the floor: hop down first, then carry on from there
        this.perch = null; Object.assign(this, extra); extra = {};
        this.vy = -170; this.vx = this.facing * 80; state = "leap"; dur = 3;
      }
      this.state = state; this.stateT = 0; this.dur = dur; Object.assign(this, extra);
      const w = this.world;
      if (w.post && w.post.user === this && !(state === "scratch" || (state === "chase" && this.goal === "post"))) w.post.user = null;
      if (this.bedRef && this.bedRef.claimed === this && !(state === "chase" && this.goal === "bed")) this.bedRef.claimed = null;
    }
    bounds() { const s = this.s; return { x: this.x - SW * s / 2, y: this.y - GROUND * s, w: SW * s, h: (GROUND + 2) * s }; }
    hit(px, py) {
      if (this.hidden || this.jobOff || this.parkAway) return false;     // inside the cat house: knock on the house instead
      const b = this.bounds(), s = this.s;
      if (this.state === "inbox") return px >= b.x + 12 * s && px <= b.x + b.w - 12 * s && py >= b.y + (4 + this.peek * 14) * s && py <= this.world.floor - 14 * s;
      return px >= b.x + 6 * s && px <= b.x + b.w - 6 * s && py >= b.y + 4 * s && py <= b.y + b.h;
    }

    // ------------------------------------------------ deciding what to do next
    // a shy stray: keeps its distance, comes for food, leaves after a while unless it learns to trust you
    strayThink() {
      const w = this.world, st = this.stray, m = SW * this.s;
      if (st.leaving) return this.set("walk", 30, { target: st.side < 0 ? m : w.W - m });
      if (w.bowl && w.bowl.food > 0.05 && this.fed !== w.bowl.refill && !w.bowl.held) return this.set("chase", 12, { goal: "bowl" });
      const n = pick({ sit: 3, groom: 2, loaf: 1.5, walk: 1.2 });
      if (n === "walk") this.set("walk", 10, { target: clamp(st.home + rnd(-120, 120), m, w.W - m) });
      else if (n === "groom") this.set(pick({ groom: 3, washFace: 2, lickFlank: 1 }), rnd(3, 5));
      else this.set(n, rnd(3, 8));
    }
    think() {
      const w = this.world;
      if (this.stray) return this.strayThink();
      if (this.leaving) return this.set("walk", 60, { target: this.leaving });
      if (w.laser) return this.set("chase", 30, { goal: "laser" });
      if (w.wand) return this.set("chase", 30, { goal: "feather" });
      // 👑 the big cats' own moves: the lion roars, the cheetah sprints the length of the screen, the others stretch and yawn hugely
      const C = COATS[this.coat];
      if (C && C.wild && this.profile && !this.perch && this.profile.g >= 0.6 && Math.random() < 0.06) {
        if (this.coat === "lion") return this.roar();
        if (this.coat === "cheetah" && (this.zoomCool || 0) <= 0) { const m = SW * this.s; this.zoomCool = rnd(90, 200); return this.set("zoom", rnd(4, 6), { target: this.x < w.W / 2 ? w.W - m : m, laps: 0 }); }
        return this.set("stretch", rnd(2.2, 3));
      }
      if (this.perch) {                                // up on a shelf: lounge about, or hop down
        const pw = { sit: 3, groom: 2, loaf: 2, sleep: w.isNight() ? 4 : 1.3, down: 1.5 };
        if (this.mods) for (const k in pw) if (this.mods[k]) pw[k] *= this.mods[k];
        const n = pick(pw);
        if (n === "down") return this.hopDown();
        if (n === "sleep") return this.set("knead", rnd(2, 3));
        if (n === "loaf") return this.set("loaf", rnd(6, 14));
        if (n === "groom") return this.set(pick({ groom: 3, lickFlank: 2, washFace: 2, legUp: 1.4 }), rnd(3, 6));
        return this.set("sit", rnd(4, 9));
      }
      if (Math.random() < 0.015 && !w.isNight()) w.meow(this);
      const wt = { walk: 3, sit: 2, groom: 1.8, sleep: 1.1, roll: 1, zoom: this.zoomCool > 0 ? 0 : 0.12,
        loaf: 1.2, sploot: 0.6, meerkat: 0.5, tailChase: this.size < 0.85 ? 0.45 : 0.2,      // kittens chase their tails more
        nod: w.isNight() ? 0.8 : 0.25, wave: 0.25, playBow: this.size < 0.85 ? 0.5 : 0.25, stalk: 0.35, chatter: w.birds.length ? 3 : 0 };
      const love = this.profile ? this.profile.love : 50, pt = w.pointer;
      if (love >= 70) wt.pronk = 0.3;
      if (love >= 45 && pt && pt.seen && Math.abs(pt.x - this.x) < 450) wt.blink = 0.6;
      const y = w.yarn;
      if (y) { if (y.held) wt.dangle = 6; else if (Math.abs(y.x - this.x) < w.W * 0.7) wt.yarn = 5; }
      if (w.mouse && w.mouse.running()) wt.mouse = 6;
      if (w.bowl && w.bowl.food > 0.05 && this.fed !== w.bowl.refill) wt.bowl = 9;
      const box = w.boxes.find((b) => !b.occupant && !b.held && !b.claimed);
      if (box) wt.box = 2.4;
      if (w.butterfly) wt.butterfly = 5;
      if (w.catnip && this.nipped !== w.catnip.id) wt.catnip = 8;
      if (w.post && !w.post.user) wt.post = 0.9;
      const bed = w.bed && !w.bed.occupant && !w.bed.claimed ? w.bed : null;
      if (bed) wt.sleep += 0.6;                       // a comfy bed makes a nap more tempting
      const shelf = w.shelves.find((sh) => sh.cats().length < sh.cap() && w.floor - sh.top < 220 * this.s);
      if (shelf) wt.shelf = 1.1;
      const L_ = window.CatLife, P_ = this.profile;
      if (L_ && P_) {                                    // what they ate, and how they feel
        if (L_.hasBuff(P_, "energy")) { wt.zoom = (wt.zoom || 0) + 0.3; wt.tailChase = (wt.tailChase || 0) * 2; wt.pronk = (wt.pronk || 0) + 0.3; wt.sleep *= 0.5; }
        if (L_.hasBuff(P_, "sleepy")) { wt.sleep *= 2; wt.loaf = (wt.loaf || 0) * 1.5; }
        if (P_.sick) { wt.sleep *= 2; wt.loaf = (wt.loaf || 0) * 2; wt.walk *= 0.5; wt.zoom = 0; wt.pronk = 0; wt.tailChase = 0; }
      }
      if (w.weather && ["rain", "storm", "snow", "drizzle"].includes(w.weather.kind)) { wt.sleep *= 1.6; wt.loaf = (wt.loaf || 0) * 1.6; wt.zoom = 0; }
      if (w.isNight()) { wt.sleep *= 3; wt.walk *= 0.4; wt.zoom = 0; wt.loaf *= 2; wt.tailChase = 0; wt.meerkat = 0; wt.pronk = 0; if (wt.fight) wt.fight *= 0.2; if (wt.shelf) wt.shelf *= 0.5; }
      const foe = this.fightCool <= 0 && w.cats.find((o) => o !== this && o.fightCool <= 0 && ["walk", "sit", "groom", "roll"].includes(o.state) && Math.abs(o.x - this.x) < 260 * this.s / 3 * 3);
      if (foe) wt.fight = 0.6;
      if (wt.yarn || wt.mouse || wt.dangle || wt.butterfly) { wt.sleep = 0.2; wt.walk = 1.5; wt.fight = 0; wt.loaf = wt.sploot = 0.2; }
      if (this.mods) for (const k in wt) if (this.mods[k]) wt[k] *= this.mods[k];      // personality
      if (this.profile && window.CatLife && window.CatLife.isElder(this.profile)) {                              // wise old cats take it easy
        wt.sleep *= 1.6; wt.walk *= 0.7; wt.zoom = 0; wt.tailChase *= 0.3; wt.loaf *= 1.6; if (wt.pronk) wt.pronk *= 0.4; if (wt.fight) wt.fight *= 0.4;
      }
      const F = (k) => { const l = w.furniture.filter((f) => f.kind === k && f.usable); return l.length ? l[Math.floor(Math.random() * l.length)] : null; };
      if (w.landedBird()) wt.bird = 7;
      const rug = F("rug"), plant = F("plant"), aq = F("aquarium");
      const naps = w.furniture.filter((f) => f.f.nap != null && f.usable && !f.occupant && (!f.claimed || f.claimed === this)), nap = naps.length ? naps[Math.floor(Math.random() * naps.length)] : null;
      if (rug) wt.rug = 1.1;
      if (plant) wt.plant = 0.35;
      if (nap) wt.cushion = (w.isNight() ? 2.5 : 1) * (nap.f.hide ? 1.3 : 1);
      if (aq) wt.fish = 0.8;
      const spots = w.furniture.filter((f) => f.usable && ["watch", "play", "nibble"].includes(f.f.role)), spot = spots.length ? spots[Math.floor(Math.random() * spots.length)] : null;
      if (spot) wt.spot = 0.9;
      const tun = F("tunnel"), fnt = F("fountain"), lit = w.furniture.filter((f) => f.kind === "litter" && (f.item.dirty || 0) < 5);
      if (tun && !w.isNight()) wt.tunnel = this.size < 0.85 ? 1.2 : 0.6;
      if (fnt) wt.drink = Date.now() - (this.drankAt || 0) > 20 * 60e3 ? 1.2 : 0.2;
      const litBox = lit.length ? lit[Math.floor(Math.random() * lit.length)] : null; if (litBox && Date.now() - (this.litterAt || 0) > 30 * 60e3) wt.litter = 0.5;
      if (w.furniture.some((f) => f.f.perch && f.usable) && shelf) wt.shelf = (wt.shelf || 0) + 0.8;
      // you've been away from the mouse for a while: come and curl up next to where you left it
      if (w.idleFor() > 480 && pt && pt.x > 0 && !wt.yarn && !wt.mouse && !wt.bowl) wt.you = 6;
      const known = this.profile && this.profile.tricks ? Object.keys(this.profile.tricks).filter((k) => this.profile.tricks[k] >= 5) : [];
      if (known.length && !w.isNight()) wt.showOff = 0.15;                              // practising a trick it knows
      const n = pick(wt);
      if (n === "walk") { const m = SW * this.s; this.set("walk", 12, { target: clamp(this.x + rnd(-420, 420), m, w.W - m) }); }
      else if (n === "sit") this.set("sit", rnd(3, 8));
      else if (n === "groom") this.set(pick({ groom: 3, lickFlank: 2, washFace: 2, legUp: 1.4 }), rnd(3, 6));
      else if (n === "sleep") { if (bed) { bed.claimed = this; this.set("chase", 14, { goal: "bed", bedRef: bed }); } else this.set("knead", rnd(2.5, 4)); }
      else if (n === "post") { w.post.user = this; this.set("chase", 12, { goal: "post" }); }
      else if (n === "shelf") this.set("chase", 12, { goal: "shelf", shelfRef: shelf });
      else if (n === "fight") {
        const d = rnd(4, 6.5);
        this.fightCool = foe.fightCool = rnd(40, 80);
        this.set("spar", d, { foe, act: "stance", actT: rnd(0.2, 0.6) }); foe.set("spar", d, { foe: this, act: "stance", actT: rnd(0.3, 0.8) });
        this.care("fight", { o: foe.name, oid: foe.pid }); foe.care("fight", { o: this.name, oid: this.pid });
        w.burst((this.x + foe.x) / 2, this.y - 30 * this.s, "spark", "#f7e48c", 1);
      }
      else if (n === "roll") this.set("roll", rnd(3, 5.5));
      else if (n === "loaf") this.set("loaf", rnd(6, 16));
      else if (n === "sploot") this.set("sploot", rnd(5, 11));
      else if (n === "meerkat") this.set("meerkat", rnd(2.2, 3.6));
      else if (n === "chatter") { const b = w.birds.find((b) => Math.abs(b.x - this.x) < 400); if (b) this.facing = Math.sign(b.x - this.x) || this.facing; this.set("chatter", rnd(2, 3.5)); if (Math.random() < 0.5) w.meow(this); }
      else if (n === "nod") this.set("nod", rnd(5, 9));
      else if (n === "wave") { if (pt && pt.seen) this.facing = Math.sign(pt.x - this.x) || this.facing; this.set("wave", rnd(1.6, 2.4)); }
      else if (n === "playBow") this.set("playBow", rnd(1.4, 2.2), { then: "zoom" });
      else if (n === "stalk") { const m = SW * this.s; this.set("stalk", rnd(3, 5), { target: clamp(this.x + this.facing * rnd(120, 260), m, w.W - m) }); }
      else if (n === "tailChase") this.set("tailChase", rnd(2.2, 3.8), { spinT: 0 });
      else if (n === "pronk") this.pronk(rnd(2, 4) | 0);
      else if (n === "rug") { this.rugOff = rnd(-18, 18) * w.toyScale; this.set("chase", 14, { goal: "rug", fRef: rug }); }
      else if (n === "plant" || n === "fish") this.set("chase", 14, { goal: n, fRef: n === "plant" ? plant : aq });
      else if (n === "bird") this.set("chase", 10, { goal: "bird" });
      else if (n === "spot") this.set("chase", 14, { goal: "spot", fRef: spot });
      else if (n === "tunnel") { this.tunSide = this.x < tun.x ? -1 : 1; this.set("chase", 12, { goal: "tunnel", fRef: tun }); }
      else if (n === "drink") this.set("chase", 14, { goal: "drink", fRef: fnt });
      else if (n === "litter") this.set("chase", 14, { goal: "litter", fRef: litBox });
      else if (n === "cushion") { nap.claimed = this; this.set("chase", 14, { goal: "cushion", fRef: nap }); }
      else if (n === "you") { this.napOff = rnd(-70, 70) * this.s / 3; this.set("chase", 20, { goal: "you" }); }
      else if (n === "showOff") this.doTrick(known[Math.floor(Math.random() * known.length)]);
      else if (n === "blink") { this.facing = Math.sign(pt.x - this.x) || this.facing; this.set("slowBlink", 3.4); }
      else if (n === "zoom") this.startZoom();
      else if (n === "box") { box.claimed = this; this.set("chase", 12, { goal: "box", boxRef: box }); }
      else this.set("chase", n === "dangle" ? 12 : 9, { goal: n });
    }
    goalX() {
      const w = this.world, s = this.s;
      switch (this.goal) {
        case "yarn": return w.yarn && !w.yarn.held ? w.yarn.x : null;
        case "dangle": return w.yarn && w.yarn.held ? w.yarn.x - this.facing * 6 * s : null;
        case "mouse": return w.mouse && w.mouse.running() ? w.mouse.x : null;
        case "laser": return w.laser && w.pointer.seen ? w.pointer.x : null;
        case "bowl": {
          if (!w.bowl || w.bowl.food <= 0.02 || w.bowl.held || w.bowl.y < w.floor - 2) return w.bowl && w.bowl.food > 0.02 ? this.x : null;
          const side = this.x < w.bowl.x ? -1 : 1; return w.bowl.x + side * 15 * s;
        }
        case "box": return this.boxRef && w.boxes.includes(this.boxRef) && !this.boxRef.occupant ? this.boxRef.x : null;
        case "feather": return w.wand && w.pointer.seen ? w.wand.x : null;
        case "bird": { const b = w.landedBird(); return b ? b.x - Math.sign(b.x - this.x || 1) * 40 * this.s : null; }
        case "rug": { const f = this.fRef; return f && w.furniture.includes(f) ? clamp(f.x + (this.rugOff || 0), 20, w.W - 20) : null; }
        case "plant": { const f = this.fRef; return f && w.furniture.includes(f) ? f.x - (this.x < f.x ? 1 : -1) * 12 * w.toyScale : null; }
        case "tunnel": { const f = this.fRef; return f && w.furniture.includes(f) ? f.x + this.tunSide * 27 * w.toyScale : null; }
        case "spot": { const f = this.fRef; if (!f || !w.furniture.includes(f)) return null; return f.f.act === "roll" || f.f.act === "knead" || f.f.on ? f.x : f.x - (this.x < f.x ? 1 : -1) * (f.f.w / 2 * w.toyScale + 10 * this.s); }
        case "drink": { const f = this.fRef; return f && w.furniture.includes(f) ? f.x - (this.x < f.x ? 1 : -1) * (10 * w.toyScale + 12 * this.s) : null; }
        case "litter": { const f = this.fRef; return f && w.furniture.includes(f) ? f.x : null; }
        case "cushion": { const f = this.fRef; return f && w.furniture.includes(f) && (!f.occupant || f.occupant === this) ? f.x : null; }
        case "fish": { const f = this.fRef; return f && w.furniture.includes(f) ? f.x - (this.x < f.x ? 1 : -1) * (16 * w.toyScale + 12 * this.s) : null; }
        case "you": return w.pointer.x > 0 ? clamp(w.pointer.x + (this.napOff || 0), 20, w.W - 20) : null;
        case "butterfly": return w.butterfly ? w.butterfly.x : null;
        case "catnip": return w.catnip && !w.catnip.held ? w.catnip.x : null;
        case "bed": return this.bedRef && w.bed === this.bedRef && !this.bedRef.occupant ? this.bedRef.x : null;
        case "shelf": {
          const sh = this.shelfRef; if (!sh || !w.shelves.includes(sh) || sh.cats().length >= sh.cap()) return null;
          return sh.x - (this.x < sh.x ? 1 : -1) * (sh.hw + 14 * s);
        }
        case "post": {
          if (!w.post) return null;
          const side = this.x < w.post.x ? -1 : 1; return w.post.x + side * (3 * w.toyScale + 15 * s);
        }
      }
      return null;
    }
    // the point the cat is trying to get its paws on
    aim() {
      const w = this.world;
      switch (this.goal) {
        case "laser": return { x: w.pointer.x, y: w.pointer.y };
        case "feather": return w.wand ? { x: w.wand.x, y: w.wand.cy } : null;
        case "butterfly": return w.butterfly ? { x: w.butterfly.x, y: w.butterfly.y } : null;
        case "mouse": return w.mouse ? { x: w.mouse.x + w.mouse.dir * w.mouse.speed * 0.4, y: w.mouse.y } : null;
        case "bird": { const b = w.landedBird(); return b ? { x: b.x, y: b.y } : null; }
        default: return w.yarn ? { x: w.yarn.x, y: w.yarn.y } : null;
      }
    }
    roar() {
      const w = this.world, s = this.s;
      this.set("yawn", 1.8); w.shout(this.x + this.facing * 20 * s, this.y - 50 * s, "ROAAR!");
      w.cats.forEach((c) => { if (c !== this && c.profile && !c.profile.job && Math.abs(c.x - this.x) < 320 && ["sit", "walk", "groom", "loaf", "sploot"].includes(c.state)) { c.facing = Math.sign(this.x - c.x) || c.facing; c.set("arch", rnd(1.2, 1.8)); } });
      w.birds.forEach((b) => b.scare && b.scare());
    }
    startZoom(race = true) {
      const w = this.world, m = SW * this.s, target = this.x < w.W / 2 ? w.W - m : m, d = rnd(2.4, 4);
      this.set("zoom", d, { target, laps: 0 }); this.care("zoom"); this.zoomCool = rnd(240, 480);
      if (!race) return;
      const buddy = w.cats.find((o) => o !== this && ["sit", "walk", "groom"].includes(o.state) && Math.abs(o.x - this.x) < 110 * this.s);
      if (buddy && Math.random() < 0.25) { buddy.zoomCool = rnd(240, 480); buddy.set("zoom", d, { target, laps: 0 }); this.care("race", { o: buddy.name, oid: buddy.pid }); buddy.care("race", { o: this.name, oid: this.pid }); }   // a race!
    }

    // ------------------------------------------------ physics + behaviour
    update(dt) {
      const w = this.world, s = this.s, floor = w.floor;
      this.t += dt; this.stateT += dt; this.boopCool -= dt; this.fightCool -= dt; this.zoomCool = (this.zoomCool || 0) - dt;
      // 💼 away at work: walk off the screen, then nothing until it comes back (its needs wait too)
      if (this.parkAway) return;                        // stayed home while the others are at the park
      if (this.profile && this.profile.job) {
        if (this.jobOff) return;
        if (this.x < -80 || this.x > w.W + 80) { this.jobOff = true; return; }
        if (this.state !== "walk") this.set("walk", 60, { target: this.x < w.W / 2 ? -120 : w.W + 120 });
      }
      if (this.profile && window.CatLife && !this.profile.job) window.CatLife.tick(this, dt);
      if (this.P.shine > 0.55 && Math.random() < dt * (this.P.shine - 0.4) * 0.8) w.burst(this.x + rnd(-14, 14) * s, this.y - rnd(10, 34) * s, "spark", "#fff6c0", 1);     // great genes: a glossy coat that glints
      if (!this.stray && this.profile) {
        const st = w.stray();
        if (st && st !== this.hissedAt && Math.abs(st.x - this.x) < 110 * s && ["sit", "walk", "groom", "loaf", "sploot"].includes(this.state)) {
          this.hissedAt = st; this.facing = Math.sign(st.x - this.x) || this.facing; this.set("arch", rnd(1.4, 2.2));
        }
      }
      if (this.leaving && this.profile && !this.profile.guest && this.profile.love >= 30) {             // you won it back
        this.leaving = false; this.set("happy", 2.5, { eyes: null }); w.burst(this.x, this.y - 34 * s, "heart", "#e2557a", 4);
      }
      if (this.stray) {
        const st = this.stray; st.life -= dt;
        if (st.life <= 0 && !st.leaving && !["eat", "held", "fall"].includes(this.state)) { st.leaving = true; this.set("walk", 30, { target: st.side < 0 ? SW * s / 2 : w.W - SW * s / 2 }); }
        const p = w.pointer;
        if (st.trust < 2 && p.seen && Math.abs(p.x - this.x) < 80 && Math.abs(p.y - (this.y - 15 * s)) < 90 && !["walk", "eat", "held", "fall", "chase"].includes(this.state)) {
          this.set("walk", 3, { target: clamp(this.x + Math.sign(this.x - p.x || 1) * 160, SW * s / 2, w.W - SW * s / 2) });   // too close! backs off
        }
      }
      this.blinkT -= dt; if (this.blinkT <= 0) { this.blink = !this.blink; this.blinkT = this.blink ? 0.14 : rnd(2, 6); }
      if ((w.laser || w.wand) && !["chase", "leap", "stand", "held", "fall", "hunt"].includes(this.state)) this.think();
      if (this.bed && w.bed !== this.bed) this.bed = null;

      switch (this.state) {
        case "walk": {
          const dx = this.target - this.x;
          if (((this.stray && this.stray.leaving) || this.leaving) && Math.abs(dx) < 6) { const gone = this.leaving; w.removeCat(this); if (gone && w.onCatLeft) w.onCatLeft(this); return; }
          if (Math.abs(dx) < 4) { this.think(); break; }
          this.facing = Math.sign(dx); this.x += this.facing * 34 * s * dt; this.phase = (this.phase + dt * 1.4) % 1;
          this.tryBoop();
          if (this.stateT > this.dur) this.think();
          break;
        }
        case "zoom": {
          const dx = this.target - this.x;
          this.facing = Math.sign(dx) || this.facing; this.x += this.facing * 175 * s * dt * (this.coat === "cheetah" ? 2.4 : 1);       // nothing outruns a cheetah this.phase = (this.phase + dt * 4.5) % 1;
          if (Math.random() < dt * 8) w.burst(this.x - this.facing * 14 * s, floor - 2 * s, "dust", "rgba(140,120,100,.55)", 1);
          if (Math.abs(dx) < 12 * s) { this.laps++; const m = SW * s; this.target = this.facing > 0 ? m : w.W - m; if (this.laps >= 2 || this.stateT > this.dur) this.set("skid", 0.8, { slide: 170 * s }); }
          break;
        }
        case "chase": this.updateChase(dt); break;
        case "hunt": {                                    // crouched, bottom wiggling, about to pounce
          const am = this.aim(), tx = am ? am.x : this.x;
          this.facing = Math.sign(tx - this.x) || this.facing;
          if (this.stateT > this.dur) {
            // aim so the front paws, not the tummy, come down on the toy
            const lead = ["yarn", "mouse", "butterfly"].includes(this.goal) ? this.facing * 11 * s : 0;
            const air = 0.42; this.vx = clamp((tx - lead - this.x) / air, -320 * s / 3 * 3, 320 * s / 3 * 3); this.vy = -G * air / 2;
            this.set("leap", 3);
          }
          break;
        }
        case "prep": {                                     // gathering itself for the jump up onto a shelf
          const sh = this.shelfRef;
          if (!sh || !w.shelves.includes(sh) || sh.cats().length >= sh.cap()) { this.set("sit", 2); break; }
          this.facing = Math.sign(sh.x - this.x) || this.facing;
          if (this.stateT > this.dur) {
            const h = floor - sh.top, tx = sh.x + rnd(-0.35, 0.35) * sh.hw;
            this.vy = -Math.sqrt(2 * G * (h + 14 * s));
            const T = (-this.vy + Math.sqrt(this.vy * this.vy - 2 * G * h)) / G;
            this.vx = (tx - this.x) / T; this.set("leap", 3, { goal: null });
          }
          break;
        }
        case "leap": {
          const py = this.y;
          this.vy += G * dt; this.x += this.vx * dt; this.y += this.vy * dt;
          if (this.vy > 0 && this.tryPerch(py)) break;
          this.paws((tx, ty) => this.contact(tx, ty));
          if (this.y >= floor) {
            this.y = floor; this.vy = 0; w.burst(this.x, floor, "dust", "rgba(140,120,100,.7)", 3);
            this.landOnToy();
            if (this.goalX() != null && Math.random() < 0.8) this.set("chase", ["laser", "feather"].includes(this.goal) ? 30 : 6);
            else this.set("sit", 2.5);
          }
          break;
        }
        case "stand": {                                   // up on hind legs under a dangling toy
          const am = this.aim(), tx = am ? am.x : this.x;
          this.facing = Math.sign(tx - this.x) || this.facing;
          this.x += clamp(tx - this.facing * 8 * s - this.x, -40 * s * dt, 40 * s * dt);
          this.paws((px, py) => this.contact(px, py));
          if (this.goalX() == null) { this.set("sit", 2); break; }
          if (this.stateT > this.dur) this.set("chase", ["laser", "feather"].includes(this.goal) ? 30 : 8);
          break;
        }
        case "bat": {
          const y = w.yarn;
          if (y && !this.swatted && this.stateT > 0.18 && Math.abs(y.x - this.x) < 26 * s) {
            this.swatted = true; y.vx += this.facing * rnd(260, 520); y.vy -= rnd(160, 380); y.spin += this.facing * 8; this.care("play", { toyKey: "yarn" });
            w.burst(y.x, y.y, "spark", "#f7e48c", 2);
          }
          if (this.stateT > this.dur) this.set("chase", 6, { goal: "yarn" });
          break;
        }
        case "eat": {
          const b = w.bowl;
          if (!b) { this.set("sit", 2); break; }
          if (b.held || b.y < floor - 2 || Math.abs(b.x - this.x) > 26 * s) { this.set("chase", 10, { goal: "bowl" }); break; }   // the bowl moved: follow it
          this.facing = Math.sign(b.x - this.x) || this.facing;
          b.food = Math.max(0, b.food - 0.045 * dt);
          if (Math.random() < dt * 1.2) w.burst(b.x, floor - 6 * s, "crumb", "#8a5a2b", 1);
          if (this.stateT > this.dur || b.food <= 0) { if (this.stray && this.fed !== b.refill) w.strayFed(this); this.fed = b.refill; this.set("groom", rnd(2.5, 4)); w.burst(this.x, this.y - 30 * s, "heart", "#e2557a", 1); }
          break;
        }
        case "inbox": {
          const b = this.box;
          if (!b || !w.boxes.includes(b)) { this.box = null; this.set("sit", 2); break; }
          this.x = b.x; this.y = b.held ? b.y : floor;
          this.peekT -= dt;
          if (this.peekT <= 0) { this.peekTo = pick({ 0: 4, 0.55: 2, 1: 1.5 }) * 1; this.peekT = rnd(1.2, 3.5); }
          this.peek += (this.peekTo - this.peek) * Math.min(1, dt * 7);
          if (this.stateT > this.dur && !b.held) this.hopOut();
          break;
        }
        case "knead": {
          if (Math.random() < dt * 0.8) w.burst(this.x + this.facing * 8 * s, this.y - 26 * s, "heart", "#e2557a", 1);
          if (this.stateT > this.dur) {
            this.set("sleep", rnd(12, 30)); this.dream = pick(this.dreams());
            this.belly = !this.bed && !this.cushion && !this.perch && this.profile && this.profile.love >= 80 && Math.random() < 0.4;
          }
          break;
        }
        case "spar": this.updateSpar(dt); break;
        case "skid": {
          this.x += this.facing * this.slide * dt; this.slide *= Math.pow(0.03, dt);
          if (this.stateT < 0.4 && Math.random() < dt * 22) w.burst(this.x + this.facing * 12 * s, floor - 2 * s, "dust", "rgba(140,120,100,.6)", 1);
          if (this.stateT > this.dur) this.set("sit", rnd(2, 4));
          break;
        }
        case "sniff": {
          if (!w.catnip) { this.set("sit", 1.5); break; }
          if (this.stateT > this.dur) { this.set("nip", rnd(4, 6.5)); this.care("catnip"); }
          break;
        }
        case "nip": {                                     // blissed out on catnip
          if (Math.random() < dt * 5) w.burst(this.x + rnd(-10, 10) * s, this.y - 20 * s, "spark", Math.random() < 0.5 ? "#8bd36b" : "#c58ae8", 1);
          if (Math.random() < dt * 1.2) w.burst(this.x, this.y - 28 * s, "heart", "#e2557a", 1);
          if (this.stateT > this.dur) { if (Math.random() < 0.2 && !(this.zoomCool > 0)) this.startZoom(false); else this.set("sit", rnd(2, 4)); }
          break;
        }
        case "scratch": {
          const p = w.post; if (!p) { this.set("sit", 1.5); break; }
          this.facing = Math.sign(p.x - this.x) || this.facing;
          this.x += clamp(p.x - this.facing * (3 * w.toyScale + 15 * s) - this.x, -80 * s * dt, 80 * s * dt);
          if (Math.random() < dt * 4) w.burst(p.x - this.facing * 3 * w.toyScale, floor - rnd(14, 24) * s, "crumb", "#d8c08a", 1);
          if (this.stateT > this.dur) this.set(Math.random() < 0.5 ? "sit" : "washFace", rnd(2, 4));
          break;
        }
        case "flee": case "pursue": {
          const f = this.foe;
          if (this.state === "pursue") {
            if (!f || f.state !== "flee") { this.set("sit", rnd(1.5, 3)); break; }
            const tx = f.x - f.facing * 20 * s; this.facing = Math.sign(tx - this.x) || this.facing;
            this.x += clamp(tx - this.x, -128 * s * dt, 128 * s * dt);
          } else {
            const m = SW * s; if (Math.abs(this.target - this.x) < 10 * s) this.target = this.target < w.W / 2 ? w.W - m : m;
            this.facing = Math.sign(this.target - this.x) || this.facing; this.x += this.facing * 135 * s * dt;
          }
          this.phase = (this.phase + dt * 3.2) % 1;
          if (Math.random() < dt * 6) w.burst(this.x - this.facing * 14 * s, floor - 2 * s, "dust", "rgba(140,120,100,.5)", 1);
          if (this.stateT > this.dur) {
            if (this.state === "flee") { this.set("roll", rnd(2.5, 4)); if (f && f.state === "pursue") f.set("groom", rnd(2, 3.5)); }
            else this.set("sit", 2);
          }
          break;
        }
        case "boop": {
          if (this.stateT > this.dur) this.set("sit", rnd(1.5, 3));
          break;
        }
        case "held": {
          this.x += (w.pointer.x - this.x) * Math.min(1, dt * 18);
          this.y += (w.pointer.y + (GROUND - 4) * s - this.y) * Math.min(1, dt * 18);
          break;
        }
        case "fall": {
          const py = this.y;
          this.vy += 1700 * dt; this.x += this.vx * dt; this.y += this.vy * dt; this.vx *= 0.995;
          if (this.vy > 0 && this.tryPerch(py)) break;
          if (this.y >= floor) { this.y = floor; this.vy = 0; this.vx = 0; w.burst(this.x, floor, "dust", "rgba(140,120,100,.7)", 4); this.set("sit", rnd(2, 4)); }
          break;
        }
        case "happy": {
          if (Math.random() < dt * 3) w.burst(this.x + this.facing * 8 * s, this.y - 30 * s, "heart", "#e2557a", 1);
          if (this.stateT > this.dur) this.set(Math.random() < 0.4 ? "roll" : "sit", rnd(2.5, 5));
          break;
        }
        case "sleep": {
          if (Math.random() < dt * 0.9) w.burst(this.x + this.facing * 10 * s, this.y - 18 * s, "z", "rgba(120,130,170,.95)", 1, { rise: true });
          if (this.stateT > this.dur) { this.set("stretch", 1.4); if (Math.random() < 0.4) w.meow(this); }
          break;
        }
        case "tunnel": {                                  // dashing through, out of sight
          const f = this.fRef; if (!f || !w.furniture.includes(f)) { this.set("sit", 1); break; }
          const d = this.tunTo - this.x; this.x += Math.sign(d) * Math.min(Math.abs(d), 120 * s * dt);
          if (Math.random() < dt * 4) w.burst(f.x + rnd(-20, 20) * w.toyScale, floor - 8 * w.toyScale, "dust", "rgba(140,120,100,.5)", 1);
          if (Math.abs(d) < 2) {
            this.care("play", { toyKey: "tunnel" });
            if (Math.random() < 0.35) { this.tunSide = -this.tunSide; this.set("chase", 6, { goal: "tunnel", fRef: f }); }   // again!
            else this.set(Math.random() < 0.5 ? "pronk" : "happy", 1.6, Math.random() < 0.5 ? {} : { eyes: null });
            if (this.state === "pronk") this.pronk(1);
          }
          break;
        }
        case "drink": { if (Math.random() < dt * 3) w.burst(this.x + this.facing * 14 * s, this.y - 6 * s, "spark", "#7cc6f2", 1); if (this.stateT > this.dur) this.set("sit", rnd(1.5, 3)); break; }
        case "litter": {
          if (Math.random() < dt * 5) w.burst(this.x - this.facing * 10 * s, this.y - 2 * s, "dust", "rgba(220,200,150,.8)", 1);
          if (this.stateT > this.dur) { const f = this.fRef; if (f && w.furniture.includes(f)) f.item.dirty = Math.min(6, (f.item.dirty || 0) + 1); this.care("litter"); this.set("walk", 4, { target: clamp(this.x + rnd(-80, 80), 30, w.W - 30) }); }
          break;
        }
        case "arch": { if (Math.random() < dt * 3) w.burst(this.x + this.facing * 14 * s, this.y - 26 * s, "spark", "#ffffff", 1); if (this.stateT > this.dur) this.set("sit", rnd(1, 2)); break; }
        case "nibble": {
          if (Math.random() < dt * 2) w.burst(this.x + this.facing * 14 * s, this.y - 8 * s, "spark", "#62a85e", 1);
          if (this.stateT > this.dur) this.set("sit", rnd(1.5, 3));
          break;
        }
        case "fishWatch": case "birdWatch": {
          const f = this.state === "fishWatch" && this.fRef && w.furniture.includes(this.fRef);
          if (this.state === "fishWatch" && !f) { this.set("sit", 1); break; }
          if (this.stateT > this.dur) { const bw = this.state === "birdWatch"; this.set("sit", rnd(1.5, 3)); if (bw && Math.random() < 0.3) this.set("meerkat", 1.5); }
          break;
        }
        case "stalk": {                                   // creeping low towards something, bottom wiggling, then a pounce
          const dx = this.target - this.x; this.facing = Math.sign(dx) || this.facing; this.x += this.facing * 22 * s * dt;
          if (Math.abs(dx) < 8 * s || this.stateT > this.dur) this.set("leap", 3, { vx: this.facing * 160 * s, vy: -230 * s, goal: null });
          break;
        }
        case "playBow": if (this.stateT > this.dur) { if (Math.random() < 0.6) this.startZoom(false); else this.set("pronk", 1.2); } break;
        case "tailChase": {
          this.spinT -= dt;
          if (this.spinT <= 0) { this.facing = -this.facing; this.spinT = rnd(0.16, 0.28); this.x += this.facing * 3 * s; }
          if (Math.random() < dt * 3) w.burst(this.x, floor, "dust", "rgba(140,120,100,.6)", 1);
          if (this.stateT > this.dur) { this.set("sit", rnd(1.5, 3), { eyes: null }); if (Math.random() < 0.4) this.set("yawn", 1); }
          break;
        }
        case "pronk": {
          this.vy += 1700 * dt; this.y += this.vy * dt; this.x += this.vx * dt;
          if (this.y >= floor && this.vy > 0) {
            this.y = floor; w.burst(this.x, floor, "dust", "rgba(140,120,100,.6)", 2);
            if (--this.hops > 0) { this.vy = -rnd(230, 300) * Math.sqrt(s / 3); this.vx = rnd(-30, 30) * s; w.burst(this.x + this.facing * 8 * s, this.y - 30 * s, "heart", "#e2557a", 1); }
            else { this.vy = 0; this.vx = 0; this.set("sit", rnd(2, 4), { eyes: null }); }
          }
          break;
        }
        case "slowBlink": {
          if (w.pointer.seen) this.facing = Math.sign(w.pointer.x - this.x) || this.facing;
          if (this.stateT > this.dur) { w.burst(this.x + this.facing * 8 * s, this.y - 32 * s, "heart", "#e2557a", 2); this.care("blink"); this.set("sit", rnd(2, 4)); }
          break;
        }
        case "stretch": if (this.stateT > this.dur) this.set("yawn", 1.1); break;
        case "yawn": if (this.stateT > this.dur) this.set("sit", rnd(1.5, 3), { eyes: null }); break;
        default:
          if (this.stateT > this.dur) this.think();
      }
      const m = SW * s / 2; this.x = clamp(this.x, m, w.W - m);
      if (this.perch && !w.shelves.includes(this.perch)) { this.perch = null; this.set("fall", 5); this.vx = 0; this.vy = 0; }
      this.partyT = (this.partyT || 0) - dt;
      if (this.cushion && !w.furniture.includes(this.cushion)) this.cushion = null;
      if (this.bed) { this.x = this.bed.x; this.y = floor - 4 * w.toyScale; }
      else if (this.cushion) { this.x = this.cushion.x; this.y = floor - (this.cushion.f.nap || 0) * w.toyScale; }
      else if (this.perch && !["held", "fall", "leap"].includes(this.state)) { this.x = this.perch.x + this.perchDx; this.y = this.perch.top; }
      else if (!["held", "fall", "leap", "inbox", "pronk"].includes(this.state) && !(this.state === "spar" && this.vy)) this.y = floor;
      this.watchPointer(dt);
    }

    updateChase(dt) {
      const w = this.world, s = this.s, floor = w.floor;
      const tx = this.goalX();
      if (tx == null) { if (this.boxRef && this.boxRef.claimed === this) this.boxRef.claimed = null; this.set("sit", 1.5); return; }
      const dx = tx - this.x, g = this.goal;
      const reach = { yarn: 16, dangle: 9, mouse: 46, laser: 22, bowl: 3, box: 4, feather: 9, butterfly: 10, catnip: 6, bed: 4, post: 3, shelf: 4,
        you: 6, rug: 5, plant: 4, cushion: 3, fish: 4, bird: 44, tunnel: 5, drink: 4, litter: 3, spot: 4 }[g] * s;
      if (Math.abs(dx) > reach) {
        this.facing = Math.sign(dx);
        const sp = ["bowl", "box", "bed", "post", "shelf", "you", "rug", "plant", "cushion", "fish"].includes(g) ? 60 : g === "bird" ? 70 : g === "laser" ? 135 : g === "feather" ? 125 : g === "catnip" ? 80 : 105;
        this.x += this.facing * Math.min(sp * s * dt, Math.abs(dx)); this.phase = (this.phase + dt * (sp > 120 ? 3.4 : sp > 70 ? 2.6 : 1.8)) % 1;
      } else {
        if (g === "yarn") {
          const y = w.yarn;
          if (y.y > floor - 30 * s) { if (Math.abs(y.vx) < 220 && Math.random() < 0.55) this.set("hunt", rnd(0.5, 1.1)); else this.set("bat", 0.7, { swatted: false }); }
        } else if (g === "mouse") this.set("hunt", rnd(0.25, 0.6));
        else if (g === "bird") { this.set("hunt", rnd(0.8, 1.6)); }
        else if (["dangle", "laser", "feather", "butterfly"].includes(g)) {
          const am = this.aim(), h = floor - am.y;
          if ((g === "laser" || (g === "butterfly" && w.butterfly.resting)) && h < 34 * s) this.set("hunt", rnd(0.3, 0.8));
          else if (h < 46 * s) this.set("stand", rnd(0.9, 1.6));
          else if (h < 150 * s && Math.random() < (g === "butterfly" ? 0.08 : 0.035)) { this.vx = this.facing * 20; this.vy = -Math.sqrt(2 * G * Math.min(h - 8 * s, 120 * s)); this.set("leap", 3); }
          else this.set("stand", 0.6);
        }
        else if (g === "catnip") { this.nipped = w.catnip.id; this.facing = Math.sign(w.catnip.x - this.x) || this.facing; this.set("sniff", rnd(1, 1.6)); }
        else if (g === "bed") {
          const b = this.bedRef; b.claimed = null;
          if (!b.occupant) { b.occupant = this; this.bed = b; this.x = b.x; this.set("knead", rnd(2.5, 4)); this.care("bed"); } else this.think();
        }
        else if (g === "shelf") { this.facing = Math.sign(this.shelfRef.x - this.x) || this.facing; this.set("prep", rnd(0.4, 0.8)); }
        else if (g === "post") { this.facing = Math.sign(w.post.x - this.x) || this.facing; this.set("scratch", rnd(2.5, 4.5)); this.care("scratch"); }
        else if (g === "spot") {
          const f = this.fRef; f.use(); this.facing = Math.sign(f.x - this.x) || this.facing;
          if (f.f.role === "watch") this.set("fishWatch", rnd(4, 9));
          else if (f.f.role === "nibble") { this.set("nibble", rnd(2, 3)); this.care("catnip"); }
          else { this.set(f.f.act === "knead" ? "knead" : f.f.act, rnd(2, 4), f.f.act === "bat" ? { swatted: true } : {}); this.care("play", { toyKey: f.kind }); if (f.kind === "piano") for (let i = 0; i < 4; i++) setTimeout(() => w.burst(f.x + rnd(-10, 10) * w.toyScale, w.floor - 18 * w.toyScale, "note", "#5b3a29", 1, { rise: true }), i * 400); }
        }
        else if (g === "tunnel") { const f = this.fRef; f.use(); this.facing = -this.tunSide; this.set("tunnel", 3, { tunTo: f.x - this.tunSide * 27 * w.toyScale }); w.burst(this.x, this.y - 6 * s, "dust", "rgba(140,120,100,.6)", 2); }
        else if (g === "drink") { const f = this.fRef; this.facing = Math.sign(f.x - this.x) || this.facing; this.drankAt = Date.now(); this.set("drink", rnd(2.5, 4)); this.care("drink"); }
        else if (g === "litter") { this.litterAt = Date.now(); this.set("litter", rnd(2.5, 4)); }
        else if (g === "rug" && this.fRef && (this.fRef.use(), true)) this.set(pick({ loaf: 3, sploot: 2, roll: 2, knead: 1.2, groom: 1 }), rnd(4, 10));
        else if (g === "plant") { const f = this.fRef; f.use(); this.facing = Math.sign(f.x - this.x) || this.facing; this.set("nibble", rnd(1.5, 2.6)); }
        else if (g === "fish") { const f = this.fRef; f.use(); this.facing = Math.sign(f.x - this.x) || this.facing; this.set("fishWatch", rnd(4, 8)); }
        else if (g === "cushion") {
          const f = this.fRef;
          if (f && !f.occupant) {
            f.occupant = this; f.claimed = null; this.cushion = f; this.x = f.x; f.use();
            if (f.f.hide) this.set("sleep", rnd(25, 60)); else this.set(Math.random() < 0.5 ? "loaf" : "knead", rnd(4, 9));
            this.care("bed");
          } else this.think();
        }
        else if (g === "you") { this.set("knead", rnd(1.5, 2.5)); this.care("napNear"); }
        else if (g === "bowl") { this.facing = Math.sign(w.bowl.x - this.x) || this.facing; this.set("eat", rnd(4, 7) * ((this.mods && this.mods._eat) || 1)); this.care("fed", { food: w.bowl.foodKind }); }
        else if (g === "box") {
          const b = this.boxRef; b.claimed = null;
          if (!b.occupant) { b.occupant = this; this.box = b; this.x = b.x; this.set("inbox", rnd(8, 22), { peek: 1, peekTo: 0, peekT: rnd(1, 2), box: b }); w.burst(b.x, floor - 22 * s, "note", "#b08d57", 1); this.care("box"); }
          else this.think();
        }
      }
      if (!["laser", "feather"].includes(g) && this.state === "chase" && this.stateT > this.dur) this.think();
    }

    // where the front paws are, in screen space
    // coming down from a pounce: whatever is under the paws or the tummy gets pinned, then squirts away
    landOnToy() {
      const w = this.world, s = this.s, f = this.facing, y = w.yarn;
      if (y && !y.held) {
        const d = (y.x - this.x) * f;                          // how far ahead of the cat's middle
        if (d > -16 * s && d < 24 * s && y.y > this.y - 30 * s) {
          y.x = clamp(y.x, 0, w.W); y.vx = f * rnd(140, 300) + (d < 4 * s ? f * 80 : 0); y.vy = -rnd(200, 360); y.spin += f * 12;
          if (y.squash != null) y.squash = 1;
          w.burst(y.x, y.y, "spark", "#f7e48c", 4); this.care("play", { toyKey: "yarn" }); this.touchedRecently = 0.25;
          if (Math.random() < 0.5) setTimeout(() => w.meow(this), 120);
        }
      }
      const bd = w.landedBird(); if (bd && Math.abs(bd.x - this.x) < 50 * s) { bd.scare(); this.care("play", { toyKey: "bird" }); }
      const m = w.mouse;
      if (m && !m.held && m.airT <= 0 && Math.abs(m.x - (this.x + f * 8 * s)) < 22 * s) { m.kick(f); w.burst(m.x, m.y - 6 * s, "spark", "#f7e48c", 3); this.care("play", { toyKey: "mouse" }); }
    }
    paws(fn) {
      const s = this.s, f = this.facing;
      if (this.state === "stand") fn(this.x + f * 8 * s, this.y - 34 * s);
      else fn(this.x + f * 14 * s, this.y - 16 * s);
    }
    contact(px, py) {
      const w = this.world, s = this.s, y = w.yarn;
      if (y && Math.hypot(y.x - px, y.y - py) < y.r + 7 * s && !this.touchedRecently) {
        this.touchedRecently = 0.25;
        y.vx += this.facing * rnd(220, 420); y.vy -= rnd(150, 320); y.spin += this.facing * 10; w.burst(y.x, y.y, "spark", "#f7e48c", 2); this.care("play", { toyKey: "yarn" });
      }
      const m = w.mouse;
      if (m && !m.held && Math.abs(m.x - px) < 14 * s && Math.abs(m.y - 4 * s - py) < 22 * s && m.airT <= 0) { m.kick(this.facing); w.burst(m.x, m.y - 6 * s, "spark", "#f7e48c", 3); this.care("play", { toyKey: "mouse" }); }
      if (w.laser && Math.hypot(w.pointer.x - px, w.pointer.y - py) < 12 * s) { this.care("play", { toyKey: "laser" }); if (Math.random() < 0.06) w.burst(w.pointer.x, w.pointer.y, "spark", "#ff5a5a", 1); }
      const f = w.wand;
      if (f && w.pointer.seen && Math.hypot(f.x - px, f.cy - py) < 9 * s + 4 * w.toyScale && !this.touchedF) {
        this.touchedF = 0.3; f.vx += this.facing * rnd(260, 460); f.vy -= rnd(140, 300); w.burst(f.x, f.cy, "spark", "#f7e48c", 2); this.care("play", { toyKey: "feather" });
      }
      const bf = w.butterfly;
      if (bf && Math.hypot(bf.x - px, bf.y - py) < 14 * s) { bf.scare(this.facing); this.care("play", { toyKey: "butterfly" }); }
      if (this.touchedRecently) this.touchedRecently = Math.max(0, this.touchedRecently - 1 / 60) || 0;
      if (this.touchedF) this.touchedF = Math.max(0, this.touchedF - 1 / 60) || 0;
    }
    // turn the head (and if needed the whole cat) towards the mouse pointer
    watchPointer(dt) {
      const w = this.world, s = this.s, p = w.pointer;
      const dx = p.x - this.x, dy = p.y - (this.y - 26 * s);
      const near = p.seen && !w.laser && !w.wand && Math.abs(dx) < 75 * s && p.y < w.floor + 4 && p.y > w.floor - 120 * s;
      if (near && this.state === "walk" && performance.now() - (p.movedAt || 0) < 400 && Math.random() < dt * 0.9) this.set("sit", rnd(2.5, 5));
      if (near && ["sit", "happy", "boop", "inbox"].includes(this.state)) {
        if (Math.abs(dx) > 6 * s && Math.sign(dx) !== this.facing && this.state !== "boop") this.facing = Math.sign(dx);
        const tx = clamp(Math.abs(dx) / (24 * s), 0, 1) * (Math.sign(dx) === this.facing ? 1 : -1), ty = clamp(dy / (26 * s), -1, 1);
        this.look = this.look ? { x: this.look.x + (tx - this.look.x) * Math.min(1, dt * 10), y: this.look.y + (ty - this.look.y) * Math.min(1, dt * 10) } : { x: tx, y: ty };
      } else this.look = null;
    }
    // a play-fight: circle, swat, hop, then one runs off and the other gives chase
    updateSpar(dt) {
      const w = this.world, s = this.s, f = this.foe, floor = w.floor;
      if (!f || f.foe !== this || f.state !== "spar") { this.vy = 0; this.y = floor; this.set("sit", rnd(1.5, 3)); return; }
      const dx = f.x - this.x, dist = Math.abs(dx);
      if (this.vy || this.y < floor) {                       // mid-hop
        this.vy += G * dt; this.x += this.vx * dt; this.y += this.vy * dt;
        if (this.y >= floor) { this.y = floor; this.vy = 0; this.vx = 0; w.burst(this.x, floor, "dust", "rgba(140,120,100,.6)", 2); }
        return;
      }
      this.facing = Math.sign(dx) || this.facing;
      this.actT -= dt;
      if (this.act === "swipe" && !this.swatted && this.actT < 0.25) {
        this.swatted = true;
        if (dist < 28 * s && !f.vy) { f.vy = -200; f.vx = this.facing * 110; w.burst((this.x + f.x) / 2, this.y - 18 * s, "spark", "#f7e48c", 2); }
      }
      if (dist > 30 * s && this.act !== "swipe") this.x += Math.sign(dx) * 55 * s * dt;
      if (this.actT <= 0) {
        if (this.stateT > this.dur) {                        // time to run! one flees, the other chases
          const runner = Math.random() < 0.5 ? this : f, chaser = runner === this ? f : this, m = SW * s;
          runner.set("flee", rnd(2.4, 3.4), { foe: chaser, target: runner.x < chaser.x ? m : w.W - m });
          chaser.set("pursue", 9, { foe: runner });
          return;
        }
        const a = dist < 14 * s ? "back" : pick({ swipe: 5, hop: 2, back: 1, stance: 2 });
        this.act = a === "swipe" ? "swipe" : "stance"; this.swatted = false;
        if (a === "swipe") this.actT = 0.45;
        else if (a === "hop") { this.vy = -300; this.vx = this.facing * 150; this.actT = 0.5; }
        else if (a === "back") { this.vy = -220; this.vx = -this.facing * 130; this.actT = 0.5; }
        else this.actT = rnd(0.35, 0.8);
      }
    }
    tryPerch(py) {
      const w = this.world, s = this.s;
      for (const sh of w.shelves) {
        if (py <= sh.top + 0.5 && this.y >= sh.top && Math.abs(this.x - sh.x) < sh.hw - 4 * s && sh.cats().length < sh.cap()) {
          this.y = sh.top; this.vy = 0; this.vx = 0; this.perch = sh; if (sh.isPlatform) sh.tree.use(); this.perchDx = clamp(this.x - sh.x, -sh.hw + 10 * s, sh.hw - 10 * s);
          w.burst(this.x, sh.top, "dust", "rgba(140,120,100,.6)", 2);
          this.set("sit", rnd(3, 6), { goal: null }); this.care("shelf");
          return true;
        }
      }
      return false;
    }
    hopDown() { this.perch = null; this.vx = this.facing * rnd(70, 130); this.vy = -180; this.set("leap", 3, { goal: null }); }
    tryBoop() {
      if (this.boopCool > 0) return;
      for (const o of this.world.cats) {
        if (o === this || o.boopCool > 0 || !["walk", "sit"].includes(o.state)) continue;
        const dx = o.x - this.x;
        if (Math.abs(dx) < 22 * this.s && Math.sign(dx) === this.facing) {
          this.facing = Math.sign(dx); o.facing = -this.facing;
          this.set("boop", 1.6); o.set("boop", 1.6); this.boopCool = o.boopCool = rnd(25, 45);
          this.care("boop", { o: o.name, oid: o.pid }); o.care("boop", { o: this.name, oid: this.pid });
          this.world.burst((this.x + o.x) / 2, this.y - 28 * this.s, "heart", "#e2557a", 2);
          return;
        }
      }
    }
    // what it dreams about: its favourite toy, dinner, butterflies… and you
    dreams() {
      const fav = this.profile && window.CatLife ? window.CatLife.TOYS[this.profile.fav] : null;
      return { [fav ? fav.e : "🧶"]: 3, "🐟": 2, "🦋": 1, "🐭": 1, "💗": this.profile && this.profile.love > 60 ? 2.5 : 0.5, "🌙": 0.6 };
    }
    drawDream(ctx) {
      if (this.state !== "sleep" || !this.dream || this.stateT < 2.5) return;
      const cyc = (this.stateT - 2.5) % 9; if (cyc > 4.2) return;
      const s = this.s, w = this.world, a = Math.min(1, cyc * 2, (4.2 - cyc) * 2);
      const hx = this.x + this.facing * 10 * s, hy = this.y - 18 * s * (this.bed ? 1.2 : 1);
      const bx = hx + this.facing * 16 * s, by = hy - 26 * s, r = 9 * Math.max(2, s) / 2;
      ctx.save(); ctx.globalAlpha = 0.92 * a; ctx.fillStyle = "#fff"; ctx.strokeStyle = "#5b3a29"; ctx.lineWidth = Math.max(1.5, s / 2);
      for (const [k, rr] of [[0.25, 0.18], [0.5, 0.28]]) { ctx.beginPath(); ctx.arc(hx + (bx - hx) * k, hy + (by - hy) * k + 6 * s * k, r * rr, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
      ctx.beginPath(); ctx.ellipse(bx, by, r * 1.25, r, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.font = `${Math.round(r * 1.15)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(this.dream, bx, by + r * 0.08 + Math.sin(this.t * 2) * s * 0.4);
      ctx.restore();
    }
    // do a trick on cue (or try to, while it's still learning)
    doTrick(id, fail = false) {
      const w = this.world, s = this.s;
      if (["held", "fall", "leap", "inbox"].includes(this.state) || this.bed) return;
      if (w.pointer.seen) this.facing = Math.sign(w.pointer.x - this.x) || this.facing;
      if (fail) { this.set(Math.random() < 0.5 ? "sit" : "yawn", 1.4, { eyes: null }); w.burst(this.x + this.facing * 6 * s, this.y - 40 * s, "what", "#8a6b55", 1); return; }
      const tr = { paw: () => this.set("bat", 1.4, { swatted: true }), spin: () => this.set("tailChase", 1.7, { spinT: 0 }), beg: () => this.set("meerkat", 2),
        roll: () => this.set("roll", 2.2), jump: () => this.pronk(2) }[id];
      if (tr) { tr(); w.burst(this.x + this.facing * 8 * s, this.y - 36 * s, "spark", "#ffd34d", 2); }
    }
    pronk(n) { this.set("pronk", 9); this.hops = Math.max(1, n); this.vy = -rnd(230, 300) * Math.sqrt(this.s / 3); this.vx = 0; this.y = this.world.floor - 1; }
    hopOut() {
      const b = this.box; if (b) b.occupant = null; this.box = null;
      this.state = "leap"; this.stateT = 0; this.dur = 3; this.goal = null;
      this.y = this.world.floor - 14 * this.s; this.vy = -360; this.vx = (Math.random() < 0.5 ? -1 : 1) * 140; this.facing = Math.sign(this.vx);
    }

    pose() {
      switch (this.state) {
        case "walk": return "walk";
        case "chase": return ["bowl", "box", "bed", "post", "shelf", "rug", "plant", "cushion", "fish", "you", "drink", "litter", "spot"].includes(this.goal) ? "walk" : "run";
        case "prep": return "crouch";
        case "stalk": return "crouch";
        case "spar": return (this.vy || this.y < this.world.floor) ? "leap" : this.act === "swipe" ? "swipe" : "spar";
        case "flee": case "pursue": return "run";
        case "sniff": return "eat";
        case "drink": return "eat";
        case "litter": return "crouch";
        case "arch": return "arch";
        case "sleep": return this.belly ? "bellyUp" : "sleep";
        case "nibble": return "eat";
        case "fishWatch": return Math.sin(this.stateT * 2.3) > 0.72 ? "bat" : "sit";
        case "birdWatch": return "meerkat";
        case "nip": return "roll";
        case "happy": return "sit";
        default: return this.state in POSES ? this.state : "sit";
      }
    }

    get hidden() { return !!(this.cushion && this.cushion.f.hide) || this.state === "tunnel"; }
    render(ctx) {
      const R = this.R; R.clear();
      if (this.hidden || this.jobOff || this.parkAway) return;   // asleep in the cat house, away at work, or not at the park
      R.grey = !!(this.profile && window.CatLife && window.CatLife.isElder(this.profile));
      const a = { t: this.t, st: this.stateT, phase: this.phase, blink: this.blink, eyes: this.state === "happy" ? "happy" : this.eyes, peekEyes: null, look: this.look };
      POSES[this.pose()](R, a);
      const acc = this.wearing();
      morph(R, this.P); mane(R, this.P); dress(R, acc);
      shade(R, this.P, this.img, accTones(acc));
      this.ctx.putImageData(this.img, 0, 0);
      const s = this.s, w = this.world, inbox = this.state === "inbox";
      const ground = this.perch ? this.perch.top : w.floor, lift = Math.max(0, ground - this.y);
      if (!inbox && !this.bed) {
        ctx.save(); ctx.globalAlpha = Math.max(0.08, 0.28 - lift / 900); ctx.fillStyle = "#000";
        ctx.beginPath(); ctx.ellipse(this.x, ground + s, 13 * s * (1 - Math.min(lift, 300) / 600), 2.2 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      const dy = inbox ? Math.round((4 + this.peek * 14) * s) : 0;
      if (inbox) { const rim = this.box ? this.box.y - 15 * w.toyScale : this.y - 6 * s; ctx.beginPath(); ctx.rect(0, 0, w.W, rim); ctx.clip(); }
      const kx = this.P.kx || 1, ky = this.P.ky || 1;
      ctx.translate(Math.round(this.x), Math.round(this.y - GROUND * s * ky + dy));
      if (this.facing < 0) ctx.scale(-1, 1);
      ctx.drawImage(this.canvas, Math.round(-SW * s * kx / 2), 0, SW * s * kx, SH * s * ky);
      ctx.restore();
      if ((this.profile && this.profile.showName || this.stray) && w.showNames !== false) this.drawTag(ctx, R, dy);
      this.drawDream(ctx);
      if (this.profile && this.profile.wish && !this.hidden) this.drawWish(ctx, R, dy);
    }
    // 💭 a thought bubble with what the cat wishes for, bobbing beside its head
    drawWish(ctx, R, dy) {
      const s = this.s, w = this.world, wish = this.profile.wish;
      let top = 0; find: for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) if (R.m[y * SW + x]) { top = y; break find; }
      const named = this.profile.showName && w.showNames !== false, fs = Math.round(clamp(8 + w.scale * 2.4, 11, 20));
      const r = Math.round(clamp(9 + w.scale * 2.6, 13, 24)), bob = Math.sin(performance.now() / 500) * 2;
      const cx = clamp(this.x + (this.facing > 0 ? 1 : -1) * (SW * s * 0.22 + r), r + 4, w.W - r - 4), cy = this.y - GROUND * s + dy + top * s - (named ? fs * 1.5 + 14 : 6) - r + bob;
      ctx.save(); ctx.fillStyle = "rgba(255,255,255,.96)"; ctx.strokeStyle = "#5b3a29"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill(); ctx.stroke();
      const tx = this.x + (this.facing > 0 ? 1 : -1) * SW * s * 0.12, ty = cy + r + 6;
      for (const [k, rr] of [[0.35, 3.2], [0.75, 2.2]]) { ctx.beginPath(); ctx.arc(cx + (tx - cx) * k, ty + (k - 0.35) * 10, rr, 0, 7); ctx.fill(); ctx.stroke(); }
      ctx.font = `${Math.round(r * 1.1)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(wish.e || "💭", cx, cy + 1);
      if (wish.k === "pet" && wish.n > 1) { ctx.font = `700 ${Math.round(r * 0.6)}px "Pixelify Sans", monospace`; ctx.fillStyle = "#e2557a"; ctx.fillText(`${wish.got || 0}/${wish.n}`, cx + r * 0.9, cy + r * 0.85); }
      ctx.restore();
    }

    // a little speech-bubble name tag floating above the cat
    drawTag(ctx, R, dy) {
      const s = this.s, w = this.world;
      let top = 0;
      find: for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) if (R.m[y * SW + x]) { top = y; break find; }
      const target = this.y - GROUND * s + dy + top * s - 4;
      this.tagY = this.tagY == null || Math.abs(this.tagY - target) > 80 ? target : this.tagY + (target - this.tagY) * 0.18;
      const L = window.CatLife, name = this.profile ? `${this.profile.name} ${this.profile.sex === "f" ? "♀" : this.profile.sex === "m" ? "♂" : ""}`.trim() : L ? L.t("strayTag")(this.stray.trust) : "?";
      const fs = Math.round(clamp(8 + w.scale * 2.4, 11, 20)), love = !!this.profile && this.profile.love >= 80;
      ctx.save();
      ctx.font = `700 ${fs}px "Pixelify Sans", ui-monospace, monospace`;
      const hp = Math.max(1, Math.round(fs / 9)), hw = love ? 8 * hp + 4 : 0, padX = Math.round(fs * 0.55), h = Math.round(fs * 1.5);
      const bw = Math.round(ctx.measureText(name).width + padX * 2 + hw);
      const x0 = Math.round(clamp(this.x - bw / 2, 2, w.W - bw - 2)), y0 = Math.round(this.tagY - h - 6), cx = Math.round(clamp(this.x, x0 + 8, x0 + bw - 8));
      ctx.fillStyle = "rgba(255,247,236,.95)"; ctx.strokeStyle = "#5b3a29"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(x0 + 0.5, y0 + 0.5, bw, h, h / 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - 5, y0 + h - 1); ctx.lineTo(cx, y0 + h + 5); ctx.lineTo(cx + 5, y0 + h - 1); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx - 5, y0 + h + 0.5); ctx.lineTo(cx, y0 + h + 5.5); ctx.lineTo(cx + 5, y0 + h + 0.5); ctx.stroke();
      if (love) {
        ctx.fillStyle = "#e2557a"; const g = GLYPH.heart, hx = x0 + padX, hy = Math.round(y0 + h / 2 - 3 * hp);
        for (let yy = 0; yy < g.length; yy++) for (let xx = 0; xx < g[yy].length; xx++) if (g[yy][xx] === "1") ctx.fillRect(hx + xx * hp, hy + yy * hp, hp, hp);
      }
      ctx.fillStyle = "#5b3a29"; ctx.textBaseline = "middle";
      ctx.fillText(name, x0 + padX + hw, y0 + h / 2 + 1);
      ctx.restore();
    }

    pet() {
      const w = this.world, s = this.s;
      if (this.stray && this.stray.trust < 2) {            // not ready for that yet
        w.burst(this.x, this.y - 40 * s, "what", "#8a6b55", 1);
        return this.set("walk", 3, { target: clamp(this.x + (Math.random() < 0.5 ? -1 : 1) * 160, SW * s / 2, w.W - SW * s / 2) });
      }
      this.care("pet"); if (Math.random() < 0.35) setTimeout(() => w.meow(this), 300);
      if (this.state === "inbox") { this.peekTo = 0; this.peekT = 2.5; w.burst(this.x, this.y - 40 * s, "heart", "#e2557a", 2); w.purr(); return; }
      if (this.state === "sleep") { this.set("stretch", 1.4); w.burst(this.x, this.y - 30 * s, "note", "#b08d57", 1); return; }
      this.set("happy", 2.6, { eyes: null });
      w.burst(this.x, this.y - 34 * s, "heart", "#e2557a", 3);
      w.purr();
    }
  }

  // ------------------------------------------------ toys
  class Yarn {
    constructor(world, x, y) {
      this.world = world; this.x = x; this.y = y; this.vx = rnd(-200, 200); this.vy = 0; this.rot = 0; this.spin = 0;
      this.held = false; this.trail = []; this.color = ["#c8453c", "#3c7ac8", "#3ca068", "#c89a3c", "#8a4ac8"][Math.floor(Math.random() * 5)];
      this.canvas = document.createElement("canvas"); this.canvas.width = this.canvas.height = 15; this.ctx = this.canvas.getContext("2d");
    }
    get r() { return 7 * this.world.toyScale; }
    hit(px, py) { return Math.hypot(px - this.x, py - this.y) < Math.max(22, this.r * 2.2); }
    grab() { this.held = true; this.cats("dangle"); }
    release(v = { x: 0, y: 0 }) { this.held = false; this.vx = clamp(v.x * 0.9 + this.vx * 0.35, -2200, 2200); this.vy = clamp(v.y * 0.9 + this.vy * 0.35, -2200, 2200); this.spin = this.vx / 60; this.cats("yarn"); }
    click() { this.vy = -420; this.vx = rnd(-300, 300); this.cats("yarn"); }
    cats(goal) { this.world.cats.forEach((c) => { if (!["sleep", "held", "fall", "inbox", "eat"].includes(c.state)) c.set("chase", 9, { goal }); }); }
    update(dt) {
      const w = this.world, floor = w.floor - this.r;
      if (this.held) {                     // held by the ball itself, right under your pointer; the loose end swings below
        const nx = clamp(w.pointer.x, this.r, w.W - this.r), ny = Math.min(w.pointer.y, floor), k = 1 / Math.max(dt, 1 / 120);
        this.vx = (nx - this.x) * k; this.vy = (ny - this.y) * k; this.x = nx; this.y = ny;
        this.rot += this.vx * dt / this.r * 0.5; this.swing = (this.swing || 0) + (this.vx * 0.0015 - (this.swing || 0)) * Math.min(1, dt * 6);
        this.trail.push([this.x, this.y + this.r * 0.6]); if (this.trail.length > 26) this.trail.shift();
        return;
      }
      this.vy += 1800 * dt; this.x += this.vx * dt; this.y += this.vy * dt;
      if (this.y > floor) { this.y = floor; if (Math.abs(this.vy) > 90) this.vy *= -0.45; else this.vy = 0; this.vx *= Math.pow(0.18, dt); }
      if (this.x < this.r) { this.x = this.r; this.vx = Math.abs(this.vx) * 0.6; }
      if (this.x > w.W - this.r) { this.x = w.W - this.r; this.vx = -Math.abs(this.vx) * 0.6; }
      if (!this.held && this.y < this.r) { this.y = this.r; this.vy = Math.abs(this.vy) * 0.4; }
      this.rot += (this.vx / this.r) * dt + this.spin * dt; this.spin *= Math.pow(0.2, dt);
      this.trail.push([this.x, this.y + this.r * 0.6]); if (this.trail.length > 26) this.trail.shift();
    }
    render(ctx) {
      const w = this.world, s = w.toyScale, g = this.ctx, c = hex(this.color), L = lighten(c, 0.3), D = darken(c, 0.35), O = darken(c, 0.6);
      const img = g.createImageData(15, 15), d = img.data;
      for (let y = 0; y < 15; y++) for (let x = 0; x < 15; x++) {
        const dx = x - 7, dy = y - 7, r = Math.hypot(dx, dy); if (r > 7.2) continue;
        let col;
        if (r > 6.3) col = O;
        else {
          const a = Math.atan2(dy, dx) + this.rot, band = Math.floor((dx * Math.cos(this.rot) + dy * Math.sin(this.rot) + 20) / 2) % 2;
          col = band ? c : D; if (dy < -3 && dx < 1) col = L; if (Math.sin(a * 3) > 0.92) col = L;
        }
        const o = (y * 15 + x) * 4; d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255;
      }
      g.putImageData(img, 0, 0);
      ctx.save(); ctx.strokeStyle = this.color; ctx.lineWidth = Math.max(2, s * 0.9); ctx.lineCap = "round"; ctx.globalAlpha = 0.9;
      ctx.beginPath();
      if (this.held) {                     // a loose end of yarn dangling from the ball
        const t = performance.now() / 1000, sw = -(this.swing || 0) * 40 * s + Math.sin(t * 3) * 2 * s;
        ctx.moveTo(this.x, this.y + this.r * 0.7); ctx.quadraticCurveTo(this.x + sw * 0.4, this.y + 16 * s, this.x + sw, this.y + 30 * s);
      }
      else this.trail.forEach(([x, y], i) => { const wob = Math.sin(i * 0.9) * s; i ? ctx.lineTo(x + wob, Math.min(y + wob, w.floor)) : ctx.moveTo(x, y); });
      ctx.stroke(); ctx.restore();
      ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = "#000"; ctx.beginPath(); ctx.ellipse(this.x, w.floor + s, this.r * 1.1, 2 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(this.canvas, Math.round(this.x - 7.5 * s), Math.round(this.y - 7.5 * s), 15 * s, 15 * s); ctx.restore();
    }
  }

  class WindupMouse {
    constructor(world, x) {
      this.world = world; this.x = x; this.y = world.floor; this.vx = 0; this.vy = 0; this.dir = Math.random() < 0.5 ? -1 : 1;
      this.speed = 110; this.wound = 25; this.turnT = rnd(1, 2.5); this.airT = 0; this.rot = 0; this.held = false; this.leg = 0;
      this.sp = new Sprite(18, 11);
      this.pal = { 1: { c: [150, 152, 160], lit: true }, 2: { c: [232, 150, 160] }, 3: { c: [20, 18, 22] }, 4: { c: [216, 176, 74], lit: true }, 5: { c: [110, 112, 120] } };
    }
    running() { return this.wound > 0 && !this.held; }
    hit(px, py) { const s = this.world.toyScale; return Math.abs(px - this.x) < 11 * s && py > this.y - 12 * s && py < this.y + 3 * s; }
    grab() { this.held = true; }
    release(v = { x: 0, y: 0 }) { this.held = false; this.airT = 1; this.vx = clamp(v.x * 0.8, -1800, 1800); this.vy = clamp(v.y * 0.8, -1800, 1800); }
    click() { this.wound = 25; this.speed = 110; this.world.burst(this.x, this.y - 12 * this.world.toyScale, "note", "#b08d57", 1); this.world.cats.forEach((c) => { if (!["sleep", "held", "fall", "inbox", "eat"].includes(c.state)) c.set("chase", 10, { goal: "mouse" }); }); }
    kick(dir) { this.vx = dir * rnd(180, 320); this.vy = -rnd(320, 520); this.airT = 1; this.dir = dir; this.wound = Math.max(this.wound, 8); this.speed = 170; }
    update(dt) {
      const w = this.world, s = w.toyScale, floor = w.floor;
      if (this.held) {
        const nx = w.pointer.x, ny = w.pointer.y + 6 * s;
        this.vx = (nx - this.x) / Math.max(dt, 1 / 120); this.vy = (ny - this.y) / Math.max(dt, 1 / 120); this.x = nx; this.y = ny; this.rot = Math.sin(performance.now() / 120) * 0.3; return;
      }
      if (this.airT > 0 || this.y < floor) {
        this.vy += G * dt; this.x += this.vx * dt; this.y += this.vy * dt; this.rot += this.vx * dt * 0.03;
        if (this.y >= floor) { this.y = floor; this.vy = 0; this.vx = 0; this.airT = 0; this.rot = 0; this.dir = Math.random() < 0.5 ? -1 : 1; w.burst(this.x, floor, "dust", "rgba(140,120,100,.6)", 2); }
      } else if (this.wound > 0) {
        this.wound -= dt; this.turnT -= dt;
        if (this.turnT <= 0) { this.dir = Math.random() < 0.65 ? -this.dir : this.dir; this.turnT = rnd(0.8, 2.6); }
        const sp = this.speed * (s / 3) * 3 * (this.wound < 4 ? this.wound / 4 : 1) * (0.85 + Math.sin(performance.now() / 90) * 0.15);
        this.x += this.dir * sp * dt; this.leg += dt * 18; this.speed += (110 - this.speed) * dt * 0.5;
      }
      const m = 12 * s; if (this.x < m) { this.x = m; this.dir = 1; this.vx = Math.abs(this.vx); } if (this.x > w.W - m) { this.x = w.W - m; this.dir = -1; this.vx = -Math.abs(this.vx); }
    }
    render(ctx) {
      const w = this.world, s = w.toyScale, R = this.sp.R; R.clear();
      const step = this.wound > 0 && this.airT <= 0 && !this.held ? (Math.sin(this.leg) > 0 ? 1 : 0) : 0;
      R.curve(4, 6, 1.5, 4, 0, 2 + step, 1.2, 1, 5);                // tail
      R.ellipse(9, 6.5, 5.6, 3.4, 1);                               // body
      R.ellipse(14, 7, 2.6, 2.2, 1);                                // head
      R.circle(11.5, 3.2, 1.8, 1); R.put(11, 3, 2); R.put(12, 3, 2); // ear
      R.put(14, 6, 3); R.put(17, 7, 2);                             // eye, nose
      R.rect(7, 1 + step, 1, 2, 4); R.rect(6, 0 + step, 3, 1, 4);   // wind-up key
      R.rect(6 + step, 9, 2, 1, 5); R.rect(11 - step, 9, 2, 1, 5);  // little feet
      const img = this.sp.paint(this.pal, [60, 58, 64]);
      ctx.save(); ctx.globalAlpha = 0.2; ctx.fillStyle = "#000"; ctx.beginPath(); ctx.ellipse(this.x, w.floor + s, 8 * s, 1.6 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.save(); ctx.imageSmoothingEnabled = false; ctx.translate(Math.round(this.x), Math.round(this.y - 5.5 * s)); ctx.rotate(this.rot);
      if (this.dir < 0) ctx.scale(-1, 1); if (this.held) ctx.scale(1, -1);
      ctx.drawImage(img, -9 * s, -5.5 * s, 18 * s, 11 * s); ctx.restore();
    }
  }

  class Box {
    constructor(world, x) {
      this.world = world; this.x = x; this.y = world.floor; this.occupant = null; this.claimed = null; this.held = false;
      this.sp = new Sprite(34, 22);
      this.pal = { 1: { c: [200, 155, 98], lit: true }, 2: { c: [150, 108, 62] }, 3: { c: [92, 64, 36] }, 4: { c: [176, 132, 80], lit: true }, 5: { c: [228, 214, 186] } };
    }
    hit(px, py) { const s = this.world.toyScale; return Math.abs(px - this.x) < 16 * s && py > this.y - 22 * s && py < this.y + 2; }
    grab() { this.held = true; }
    release() { this.held = false; }
    click() { if (this.occupant) this.occupant.hopOut(); }
    update(dt) {
      const w = this.world;
      if (this.held) { this.x += (clamp(w.pointer.x, 16 * w.toyScale, w.W - 16 * w.toyScale) - this.x) * Math.min(1, dt * 14); this.y = Math.min(w.floor, w.pointer.y + 16 * w.toyScale); }
      else this.y += (w.floor - this.y) * Math.min(1, dt * 12);
    }
    render(ctx) {
      const w = this.world, s = w.toyScale, R = this.sp.R; R.clear();
      R.rect(2, 6, 30, 16, 1);                                        // front face
      R.rect(2, 6, 30, 2, 3);                                         // dark opening
      R.tri(2, 7, -1, 0, 9, 6, 4); R.tri(32, 7, 35, 0, 25, 6, 4);      // open flaps
      R.rect(15, 8, 4, 14, 5);                                        // tape
      R.rect(5, 18, 6, 1, 2); R.rect(23, 13, 5, 1, 2);                // printed lines
      const img = this.sp.paint(this.pal, [70, 48, 26]);
      ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = "#000"; ctx.beginPath(); ctx.ellipse(this.x, w.floor + s, 17 * s, 2 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(img, Math.round(this.x - 17 * s), Math.round(this.y - 22 * s), 34 * s, 22 * s); ctx.restore();
    }
  }

  class Bowl {
    constructor(world, x) {
      this.world = world; this.x = x; this.y = world.floor; this.vy = 0; this.food = world.onFeed ? 0 : 1; this.refill = 1; this.held = false; this.foodKind = null;
      this.sp = new Sprite(20, 9);
      this.pal = { 1: { c: [72, 120, 170], lit: true }, 2: { c: [140, 88, 44], lit: true }, 3: { c: [240, 236, 228] }, 4: { c: [104, 64, 30] } };
    }
    hit(px, py) { const s = this.world.toyScale; return Math.abs(px - this.x) < 12 * s && py > this.y - 12 * s && py < this.y + 2; }
    grab() { this.held = true; }
    release() { this.held = false; this.vy = 0; }
    // clicking the bowl fills it from your cupboard; with nothing in the cupboard it just says it's empty (you can still move it)
    click() {
      if (this.food > 0.05) { this.world.burst(this.x, this.y - 14 * this.world.toyScale, "note", "#b08d57", 1); return; }
      this.fill(true);
    }
    fill(fromBowl) {
      // the food comes out of your cupboard: no food bought, no dinner
      if (this.world.onFeed) { const k = this.world.onFeed(fromBowl); if (!k) { this.emptyT = 3; this.world.burst(this.x, this.y - 16 * this.world.toyScale, "what", "#8a6b55", 1); return; } this.foodKind = k; }
      this.food = 1; this.refill++; this.world.burst(this.x, this.world.floor - 14 * this.world.toyScale, "note", "#b08d57", 2);
      this.world.cats.forEach((c, i) => { if (!["held", "fall", "inbox"].includes(c.state)) { c.set("chase", 10, { goal: "bowl" }); if (i < 2) setTimeout(() => this.world.meow(c), 150 + i * 450 + Math.random() * 300); } });
    }
    // pick it up and carry it anywhere; let go and it drops back to the floor (spilling a little if you shake it)
    update(dt) {
      const w = this.world, s = w.toyScale;
      if (this.held) {
        const nx = clamp(w.pointer.x, 12 * s, w.W - 12 * s), ny = clamp(w.pointer.y + 6 * s, 40, w.floor), vx = (nx - this.x) / Math.max(dt, 1 / 120);
        this.x = nx; this.y = ny;
        if (Math.abs(vx) > 700 && this.food > 0.05 && Math.random() < dt * 8) { this.food -= 0.02; w.burst(this.x, this.y - 6 * s, "crumb", "#8a5a2b", 1); }
        return;
      }
      if (this.y < w.floor) { this.vy += G * dt; this.y += this.vy * dt; if (this.y >= w.floor) { this.y = w.floor; this.vy = 0; w.burst(this.x, w.floor, "dust", "rgba(140,120,100,.6)", 2); } }
      else this.y = w.floor;
    }
    render(ctx) {
      const w = this.world, s = w.toyScale, R = this.sp.R; R.clear();
      if (this.food > 0.02) {                                         // the kibble pile
        R.ellipse(10, 4.2, 2 + this.food * 5.5, 0.8 + this.food * 2.4, 2);
        for (let i = 0; i < 9; i++) { const kx = 10 + Math.round(Math.sin(i * 2.4) * (1 + this.food * 4.5)), ky = 4 - Math.round(Math.abs(Math.cos(i * 1.7)) * this.food * 2); if (R.get(kx, ky)) R.put(kx, ky, 4); }
      }
      R.rect(1, 4, 18, 1, 1);                                          // rim
      for (let y = 5; y <= 8; y++) R.rect(1 + (y - 4), y, 18 - 2 * (y - 4), 1, 1);
      R.rect(4, 6, 12, 1, 3);                                          // painted band
      const img = this.sp.paint(this.pal, [40, 52, 70]);
      ctx.save(); ctx.globalAlpha = 0.2 * (1 - Math.min(0.8, (w.floor - this.y) / 400)); ctx.fillStyle = "#000"; ctx.beginPath(); ctx.ellipse(this.x, w.floor + s, 10 * s, 1.6 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(img, Math.round(this.x - 10 * s), Math.round(this.y - 9 * s), 20 * s, 9 * s); ctx.restore();
      // an empty bowl says so, in a little tag above it
      if (this.food <= 0.02 && this.world.onFeed) {
        const L = window.CatLife, txt = L && L.lang === "en" ? "Empty" : "Boş", fs = Math.max(10, Math.round(4.5 * s)), bob = this.emptyT > 0 ? Math.sin(performance.now() / 70) * 2 : 0;
        this.emptyT = Math.max(0, (this.emptyT || 0) - 1 / 60);
        ctx.save(); ctx.font = `700 ${fs}px "Pixelify Sans", monospace`; const tw = ctx.measureText(txt).width + fs * 0.9, th = fs * 1.45, tx = Math.round(this.x - tw / 2 + bob), ty = Math.round(this.y - 9 * s - th - 3 * s);
        ctx.fillStyle = "#5b3a29"; ctx.beginPath(); ctx.roundRect(tx - 2, ty - 2, tw + 4, th + 4, th / 2 + 2); ctx.fill();
        ctx.fillStyle = this.emptyT > 0 ? "#ffd0d7" : "#fff7ec"; ctx.beginPath(); ctx.roundRect(tx, ty, tw, th, th / 2); ctx.fill();
        ctx.fillStyle = "#5b3a29"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(txt, tx + tw / 2, ty + th / 2 + 1); ctx.restore();
      }
    }
  }

  // A feather on a string at the end of a little stick, held by your pointer.
  class Wand {
    constructor(world) {
      this.world = world; const p = world.pointer; this.x = p.x; this.y = p.y + this.len; this.vx = 0; this.vy = 0; this.t = 0;
      this.sp = new Sprite(9, 15);
      this.pal = { 1: { c: [236, 112, 150], lit: true }, 2: { c: [70, 170, 170], lit: true }, 3: { c: [250, 236, 210] }, 4: { c: [246, 200, 80], lit: true } };
    }
    get len() { return 36 * this.world.toyScale; }
    get cy() { return this.y + 6 * this.world.toyScale; }
    update(dt) {
      const w = this.world, p = w.pointer; this.t += dt;
      this.vy += 900 * dt; this.vx += Math.sin(this.t * 7) * 60 * dt;            // feathers flutter
      this.x += this.vx * dt; this.y += this.vy * dt;
      const dx = this.x - p.x, dy = this.y - p.y, d = Math.hypot(dx, dy) || 1;
      if (d > this.len) {
        const nx = dx / d, ny = dy / d; this.x = p.x + nx * this.len; this.y = p.y + ny * this.len;
        const vr = this.vx * nx + this.vy * ny; if (vr > 0) { this.vx -= vr * nx; this.vy -= vr * ny; }
      }
      this.vx *= Math.pow(0.35, dt); this.vy *= Math.pow(0.35, dt);
      const fl = w.floor - 13 * w.toyScale;
      if (this.y > fl) { this.y = fl; this.vy = Math.min(0, this.vy); this.vx *= Math.pow(0.05, dt); }
    }
    render(ctx) {
      const w = this.world, s = w.toyScale, p = w.pointer; if (!p.seen) return;
      ctx.save(); ctx.lineCap = "round";
      ctx.strokeStyle = "#6b4a2b"; ctx.lineWidth = Math.max(2, 1.6 * s);
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 22 * s, p.y - 26 * s); ctx.stroke();
      ctx.strokeStyle = "#c69a62"; ctx.lineWidth = Math.max(1, 0.5 * s);
      ctx.beginPath(); ctx.moveTo(p.x - 1, p.y - 1); ctx.lineTo(p.x - 22 * s - 1, p.y - 26 * s - 1); ctx.stroke();
      ctx.strokeStyle = "rgba(60,50,40,.8)"; ctx.lineWidth = Math.max(1, 0.45 * s);
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.quadraticCurveTo((p.x + this.x) / 2 - this.vx * 0.03, (p.y + this.y) / 2 + 6 * s, this.x, this.y); ctx.stroke();
      ctx.restore();
      const R = this.sp.R; R.clear();
      R.ellipse(4.5, 6, 3.4, 4.6, 1); R.ellipse(4.5, 11, 2.6, 2.6, 2); R.put(4, 1, 4); R.put(4, 0, 4);
      for (let y = 1; y < 15; y++) R.put(4, y, 3);                           // quill
      R.put(2, 4, 3); R.put(6, 6, 3); R.put(2, 8, 3);                          // barbs
      const img = this.sp.paint(this.pal, [80, 40, 60]), ang = clamp(this.vx / 900, -0.9, 0.9);
      ctx.save(); ctx.imageSmoothingEnabled = false; ctx.translate(Math.round(this.x), Math.round(this.y)); ctx.rotate(-ang);
      ctx.drawImage(img, Math.round(-4.5 * s), 0, 9 * s, 15 * s); ctx.restore();
    }
  }

  // A butterfly that drifts about, lands on the floor or on a napping cat, and always escapes.
  class Butterfly {
    constructor(world) {
      this.world = world; this.x = Math.random() < 0.5 ? 10 : world.W - 10; this.y = world.floor - 110 * world.scale;
      this.vx = 0; this.vy = 0; this.t = rnd(0, 9); this.pickT = 0; this.restT = 0; this.resting = false; this.perch = null; this.scaredT = 0; this.facing = 1;
      const c = [[240, 150, 50], [90, 150, 230], [240, 205, 70], [200, 110, 200], [120, 200, 230]][Math.floor(Math.random() * 5)];
      this.sp = new Sprite(15, 11);
      this.pal = { 1: { c, lit: true }, 2: { c: darken(c, 0.3) }, 3: { c: [40, 32, 32] }, 4: { c: [250, 246, 236] } };
      this.newTarget();
    }
    newTarget() {
      const w = this.world, s = w.scale, r = Math.random();
      const sleeper = w.cats.find((c) => c.state === "sleep");
      if (r < 0.18 && sleeper) { this.perch = sleeper; this.tx = sleeper.x; this.ty = sleeper.y - 15 * s; }
      else if (r < 0.36) { this.perch = "floor"; this.tx = w.spot(); this.ty = w.floor - 3; }
      else { this.perch = null; this.tx = clamp(this.x + rnd(-380, 380), 30, w.W - 30); this.ty = Math.max(30, w.floor - rnd(20, 110) * s); }
      this.pickT = rnd(1.4, 3);
    }
    scare(dir) {
      if (this.scaredT > 0) return;
      const w = this.world; this.scaredT = 0.6; this.resting = false; this.perch = null;
      this.vx = dir * rnd(150, 260); this.vy = -rnd(260, 380);
      this.tx = clamp(this.x + dir * 220, 30, w.W - 30); this.ty = Math.max(30, w.floor - rnd(110, 160) * w.scale); this.pickT = rnd(1.2, 2);
      w.burst(this.x, this.y, "spark", "#f7e48c", 1);
    }
    click() { this.scare(Math.random() < 0.5 ? -1 : 1); }
    hit(px, py) { const s = this.world.toyScale; return Math.hypot(px - this.x, py - this.y) < Math.max(16, 9 * s); }
    grab() {} release() {}
    update(dt) {
      const w = this.world, s = w.scale; this.t += dt; this.scaredT -= dt;
      if (this.resting) {
        this.restT -= dt;
        if (this.perch && this.perch !== "floor") {
          if (this.perch.state !== "sleep" || !w.cats.includes(this.perch)) { this.scare(Math.random() < 0.5 ? -1 : 1); return; }
          this.x = this.perch.x; this.y = this.perch.y - 15 * s;
        }
        if (this.restT <= 0) { this.resting = false; this.perch = null; this.vy = -200; this.newTarget(); }
        return;
      }
      this.pickT -= dt; if (this.pickT <= 0) this.newTarget();
      if (this.perch && this.perch !== "floor") { this.tx = this.perch.x; this.ty = this.perch.y - 15 * s; }
      this.vx += clamp((this.tx - this.x) * 3, -600, 600) * dt;
      this.vy += clamp((this.ty - this.y) * 3, -600, 600) * dt + Math.sin(this.t * 9) * 520 * dt;   // fluttery bobbing
      this.vx *= Math.pow(0.3, dt); this.vy *= Math.pow(0.3, dt);
      this.x = clamp(this.x + this.vx * dt, 6, w.W - 6); this.y = Math.min(this.y + this.vy * dt, w.floor - 3);
      if (Math.abs(this.vx) > 8) this.facing = this.vx > 0 ? 1 : -1;
      if (this.perch && Math.hypot(this.tx - this.x, this.ty - this.y) < 6 * s) {
        this.resting = true; this.restT = this.perch === "floor" ? rnd(1.5, 3.5) : rnd(4, 9); this.vx = this.vy = 0;
        this.x = this.tx; this.y = this.ty;
      }
    }
    render(ctx) {
      const w = this.world, s = w.toyScale, R = this.sp.R; R.clear();
      const flap = this.resting ? 0.55 + 0.45 * Math.sin(this.t * 2) : Math.abs(Math.sin(this.t * 16));
      const ww = 1 + 5.5 * flap;
      for (const d of [-1, 1]) {
        R.ellipse(7.5 + d * (ww / 2 + 0.6), 4, ww / 2 + 0.4, 3, 1);             // upper wings
        R.ellipse(7.5 + d * (ww * 0.35 + 0.6), 7.5, ww * 0.35 + 0.4, 2, 2);    // lower wings
        if (ww > 3) R.put(7.5 + d * (ww / 2 + 0.6), 3.5, 4);                   // white spots
      }
      R.rect(7, 2, 1, 7, 3); R.put(6, 0, 3); R.put(8, 0, 3); R.put(6.5, 1, 3); R.put(8, 1, 3);  // body + antennae
      const img = this.sp.paint(this.pal, [50, 36, 36]);
      ctx.save(); ctx.globalAlpha = 0.16; ctx.fillStyle = "#000"; ctx.beginPath();
      ctx.ellipse(this.x, w.floor + s, 5 * s * (1 - Math.min(1, (w.floor - this.y) / 400)), 1.2 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.save(); ctx.imageSmoothingEnabled = false; ctx.translate(Math.round(this.x), Math.round(this.y));
      ctx.rotate(clamp(this.vx / 1200, -0.35, 0.35)); ctx.drawImage(img, Math.round(-7.5 * s), Math.round(-5.5 * s), 15 * s, 11 * s); ctx.restore();
    }
  }

  // A little pouch of catnip. Each cat gets one blissful roll per pouch; click it to freshen it up.
  class Catnip {
    constructor(world, x, id) {
      this.world = world; this.x = x; this.y = world.floor - 180; this.vy = 0; this.id = id; this.life = 40; this.held = false;
      this.sp = new Sprite(13, 10);
      this.pal = { 1: { c: [112, 170, 80], lit: true }, 2: { c: [74, 122, 54] }, 3: { c: [226, 206, 156], lit: true }, 4: { c: [150, 206, 110], lit: true } };
    }
    hit(px, py) { const s = this.world.toyScale; return Math.abs(px - this.x) < Math.max(12, 8 * s) && py > this.y - 12 * s && py < this.y + 3; }
    grab() { this.held = true; }
    release() { this.held = false; this.vy = 0; }
    click() { this.life = 40; this.id = ++this.world.catnipId; this.world.burst(this.x, this.y - 10 * this.world.toyScale, "spark", "#8bd36b", 3); }
    update(dt) {
      const w = this.world, s = w.toyScale;
      if (this.held) { this.x = clamp(w.pointer.x, 10, w.W - 10); this.y = Math.min(w.floor, w.pointer.y + 6 * s); return; }
      if (this.y < w.floor) { this.vy += G * dt; this.y += this.vy * dt; if (this.y >= w.floor) { this.y = w.floor; this.vy = 0; w.burst(this.x, w.floor - 4 * s, "spark", "#8bd36b", 3); } }
      this.life -= dt;
      if (Math.random() < dt * 1.5) w.burst(this.x + rnd(-4, 4) * s, this.y - 9 * s, "spark", "rgba(139,211,107,.8)", 1);
      if (this.life <= 0) w.catnip = null;
    }
    render(ctx) {
      const w = this.world, s = w.toyScale, R = this.sp.R; R.clear();
      R.ellipse(6.5, 6.8, 5.6, 3.4, 1);                                         // pouch
      R.rect(4, 3, 5, 2, 1); R.rect(5, 3, 3, 1, 3);                              // gathered neck + string tie
      R.put(4, 1, 4); R.put(5, 2, 4); R.put(8, 1, 4); R.put(9, 0, 4); R.put(7, 2, 4);   // leaves poking out
      R.put(4, 7, 2); R.put(8, 6, 2); R.put(6, 8, 2);                            // printed dots
      const img = this.sp.paint(this.pal, [44, 74, 34]);
      ctx.save(); ctx.globalAlpha = Math.min(1, this.life / 3);
      ctx.save(); ctx.globalAlpha *= 0.2; ctx.fillStyle = "#000"; ctx.beginPath(); ctx.ellipse(this.x, w.floor + s, 6 * s, 1.4 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.imageSmoothingEnabled = false; ctx.drawImage(img, Math.round(this.x - 6.5 * s), Math.round(this.y - 10 * s), 13 * s, 10 * s); ctx.restore();
    }
  }

  // A round cushion bed. Sleepy cats walk over, knead it and curl up inside.
  class Bed {
    constructor(world, x) {
      this.world = world; this.x = x; this.held = false; this.occupant = null; this.claimed = null;
      this.back = new Sprite(36, 13); this.front = new Sprite(36, 13);
      this.pal = { 1: { c: [176, 78, 72], lit: true }, 2: { c: [238, 218, 196], lit: true }, 3: { c: [146, 58, 54] } };
    }
    hit(px, py) { const s = this.world.toyScale; return Math.abs(px - this.x) < 17 * s && py > this.world.floor - 12 * s && py < this.world.floor + 2; }
    grab() { this.held = true; }
    release() { this.held = false; }
    click() {
      if (this.occupant) { this.occupant.pet(); return; }
      const c = this.world.cats.find((c) => ["sit", "walk", "groom", "lickFlank", "washFace", "legUp", "roll"].includes(c.state));
      if (c && !this.claimed) { this.claimed = c; c.set("chase", 14, { goal: "bed", bedRef: this }); }
    }
    update(dt) { const w = this.world; if (this.held) this.x += (clamp(w.pointer.x, 18 * w.toyScale, w.W - 18 * w.toyScale) - this.x) * Math.min(1, dt * 14); }
    paint(spr, front) {
      const R = spr.R; R.clear();
      R.ellipse(18, 7.5, 17, 5.2, 1);                                            // cushion rim
      R.ellipse(18, 6.3, 12.5, 3, 2);                                            // soft pad
      for (let x = 3; x < 33; x += 4) R.put(x, 10, 3);                           // stitching
      if (front) for (let y = 0; y < 13; y++) for (let x = 0; x < 36; x++) if (y < 7 || R.get(x, y) === 2) R.put(x, y, 0);
      return spr.paint(this.pal, [96, 38, 36]);
    }
    renderBack(ctx) {
      const w = this.world, s = w.toyScale;
      ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = "#000"; ctx.beginPath(); ctx.ellipse(this.x, w.floor + s, 18 * s, 2 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(this.paint(this.back, false), Math.round(this.x - 18 * s), Math.round(w.floor - 13 * s), 36 * s, 13 * s); ctx.restore();
    }
    renderFront(ctx) {
      const w = this.world, s = w.toyScale;
      ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(this.paint(this.front, true), Math.round(this.x - 18 * s), Math.round(w.floor - 13 * s), 36 * s, 13 * s); ctx.restore();
    }
  }

  // A sisal scratching post with a pom-pom dangling from the top.
  class Post {
    constructor(world, x) {
      this.world = world; this.x = x; this.held = false; this.user = null; this.t = 0;
      this.sp = new Sprite(17, 46);
      this.pal = { 1: { c: [214, 190, 140], lit: true }, 2: { c: [178, 150, 100] }, 3: { c: [120, 96, 146], lit: true }, 4: { c: [238, 124, 146], lit: true }, 5: { c: [96, 74, 54] } };
    }
    hit(px, py) { const s = this.world.toyScale; return Math.abs(px - this.x) < 8 * s && py > this.world.floor - 46 * s && py < this.world.floor + 2; }
    grab() { this.held = true; }
    release() { this.held = false; }
    click() {
      const c = this.world.cats.find((c) => ["sit", "walk", "groom"].includes(c.state));
      if (c && !this.user) { this.user = c; c.set("chase", 12, { goal: "post" }); }
    }
    update(dt) { const w = this.world; this.t += dt; if (this.held) this.x += (clamp(w.pointer.x, 8 * w.toyScale, w.W - 8 * w.toyScale) - this.x) * Math.min(1, dt * 14); }
    render(ctx) {
      const w = this.world, s = w.toyScale, R = this.sp.R; R.clear();
      const busy = this.user && this.user.state === "scratch", sway = Math.sin(this.t * (busy ? 9 : 2.5)) * (busy ? 1.6 : 0.6);
      R.rect(0, 42, 17, 4, 3);                                                   // carpeted base
      R.rect(5, 6, 7, 36, 1);                                                    // sisal post
      for (let y = 7; y < 42; y += 2) R.rect(5, y, 7, 1, 2);                     // rope wraps
      R.rect(1, 3, 15, 3, 3);                                                    // top platform
      R.limb(14, 6, 14 + sway, 11, 0.6, 5); R.circle(14 + sway, 12.5, 1.7, 4);   // string + pom-pom
      const img = this.sp.paint(this.pal, [70, 52, 40]);
      ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = "#000"; ctx.beginPath(); ctx.ellipse(this.x, w.floor + s, 10 * s, 1.8 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(img, Math.round(this.x - 8.5 * s), Math.round(w.floor - 46 * s), 17 * s, 46 * s); ctx.restore();
    }
  }

  // A little wall shelf you can put anywhere on screen. Cats leap up onto it and lounge about.
  // ---------------------------------------------------------------- birds: now and then one flies past; some land for a peck
  // bird species: sparrows mostly, now and then something brighter; a parrot is rare, owls only come at night
  const BIRDS = [
    { id: "sparrow", w: 30, body: [124, 104, 88], belly: [222, 204, 176], wing: [96, 78, 62] },
    { id: "pigeon", w: 14, body: [150, 154, 166], belly: [196, 198, 206], wing: [120, 124, 138], neck: [110, 160, 140], big: 1.2 },
    { id: "bluebird", w: 10, body: [86, 140, 214], belly: [240, 150, 90], wing: [60, 104, 180] },
    { id: "robin", w: 10, body: [128, 110, 96], belly: [226, 98, 64], wing: [100, 84, 72] },
    { id: "canary", w: 8, body: [250, 214, 70], belly: [255, 236, 140], wing: [222, 180, 40] },
    { id: "cardinal", w: 6, body: [212, 50, 56], belly: [232, 80, 80], wing: [170, 36, 44], crest: true, mask: true },
    { id: "crow", w: 8, body: [44, 44, 54], belly: [64, 64, 76], wing: [30, 30, 38], big: 1.25, beak: [50, 50, 56] },
    { id: "magpie", w: 6, body: [36, 38, 50], belly: [244, 244, 248], wing: [60, 90, 150], tail: 2 },
    { id: "parrot", w: 2, body: [70, 190, 90], belly: [120, 220, 110], wing: [40, 120, 220], head: [230, 60, 60], tail: 3, beak: [240, 220, 120] },
    { id: "owl", w: 0, night: true, body: [150, 110, 76], belly: [226, 204, 170], wing: [120, 86, 58], big: 1.3, owl: true, beak: [200, 160, 60] },
  ];
  function pickBird(world) {
    const night = world.isNight && world.isNight(), list = night ? BIRDS.filter((b) => b.night) : BIRDS.filter((b) => !b.night && b.w > 0);
    let x = Math.random() * list.reduce((a, b) => a + (b.w || 1), 0); for (const b of list) { x -= b.w || 1; if (x <= 0) return b; } return list[0];
  }
  class Bird {
    constructor(world, dir, y, land) {
      this.world = world; this.dir = dir; const ts = world.toyScale;
      this.x = dir > 0 ? -20 : world.W + 20; this.base = y; this.y = y; this.vx = dir * rnd(110, 160) * ts / 3; this.vy = 0;
      this.t = rnd(0, 6); this.state = "fly"; this.landX = land ? rnd(world.W * 0.15, world.W * 0.85) : null; this.peckT = 0; this.seen = new Set();
      this.sp_ = pickBird(world); this.col = this.sp_.body; this.kind = this.sp_.id; if (world.onBirdSeen) world.onBirdSeen(this.kind);
      this.sp = new Sprite(16, 13);
    }
    scare() {
      if (this.state === "away") return;
      this.state = "away"; this.vy = -rnd(220, 300); this.dir = Math.random() < 0.5 ? -1 : 1; this.vx = this.dir * rnd(170, 230) * this.world.toyScale / 3;
      this.world.burst(this.x, this.y - 6, "spark", "#c9b8a4", 2);
    }
    update(dt) {
      const w = this.world, ts = w.toyScale; this.t += dt;
      if (this.state === "fly") {
        this.x += this.vx * dt; this.y = this.base + Math.sin(this.t * 2.6) * 7 * ts / 3;
        if (this.landX != null && Math.abs(this.x - this.landX) < 30) this.state = "land";
      } else if (this.state === "land") {
        this.x += this.vx * 0.4 * dt; this.y += Math.max(90, (w.floor - this.y) * 1.6) * dt;
        if (this.y >= w.floor) { this.y = w.floor; this.state = "peck"; this.peckT = rnd(6, 12); }
      } else if (this.state === "peck") {
        this.peckT -= dt;
        if (Math.random() < dt * 0.8) { this.dir = Math.random() < 0.5 ? -1 : 1; this.x += this.dir * 6 * ts; }   // little hops
        const p = w.pointer, near = w.cats.some((c) => Math.abs(c.x - this.x) < (["hunt", "leap", "chase"].includes(c.state) && c.goal === "bird" ? 22 : 60) * c.s && !["sleep", "loaf"].includes(c.state));
        if (this.peckT <= 0 || near || (p.seen && Math.hypot(p.x - this.x, p.y - this.y) < 50)) this.scare();
      } else { this.x += this.vx * dt; this.vy -= 60 * dt; this.y += this.vy * dt; }
      // cats notice it going over
      if (this.state !== "peck") for (const c of w.cats) {
        if (this.seen.has(c) || Math.abs(c.x - this.x) > 240) continue; this.seen.add(c);
        if (["sit", "walk", "groom", "loaf", "sploot", "roll", "lickFlank", "washFace"].includes(c.state) && Math.random() < 0.7) {
          c.facing = Math.sign(this.x + this.vx - c.x) || c.facing; c.set("birdWatch", rnd(2, 3.5));
          if (Math.random() < 0.4) w.meow(c);
        }
      }
    }
    gone() { return this.x < -60 || this.x > this.world.W + 60 || this.y < -60; }
    render(ctx) {
      const w = this.world, s = w.toyScale, R = this.sp.R; R.clear();
      const flap = this.state === "peck" ? 0 : Math.sin(this.t * 22) > 0 ? 1 : 2, peck = this.state === "peck" && Math.sin(this.t * 7) > 0.6;
      const B = this.sp_, oy = 2, tl = B.tail || 0;
      R.tri(1 - tl, 5 + oy, 4, 5 + oy, 0 - tl, 8 + oy + tl * 0.4, 1);                       // tail (long on magpies and parrots)
      if (B.owl) { R.ellipse(7, 6.5 + oy, 4.4, 3.6, 1); R.ellipse(7.4, 7.4 + oy, 2.8, 2.4, 2); }
      else { R.ellipse(6.5, 6.5 + oy, 4, 2.6, 1); R.ellipse(6.8, 7.6 + oy, 2.8, 1.2, 2); }   // body, belly
      const hy = (peck ? 7 : B.owl ? 3 : 4.2) + oy;
      R.circle(10.2, hy, B.owl ? 2.6 : 2, B.head ? 6 : 1); R.put(12.4, hy + (B.owl ? 0.6 : 0), 3);                // head, beak
      if (B.neck) { R.put(9, hy + 1.5, 7); R.put(10, hy + 1.8, 7); }
      if (B.mask) R.put(11.4, hy + 0.3, 4);
      if (B.crest) { R.put(9.6, hy - 2.4, 1); R.put(9, hy - 3.2, 1); }
      if (B.owl) { R.put(9.6, hy - 0.4, 8); R.put(11.2, hy - 0.4, 8); R.put(9.6, hy - 0.4, 8); R.put(8.4, hy - 2.6, 1); R.put(11.6, hy - 2.6, 1); }
      else R.put(10.6, hy - 0.6, 4);                                                                               // eye
      if (flap === 1) R.tri(4, 5 + oy, 8, 5 + oy, 5, 0 + oy, 5); else if (flap === 2) R.tri(4, 6 + oy, 8, 6 + oy, 6, 10.5 + oy, 5); else R.ellipse(6, 5.6 + oy, 2.6, 1.2, 5);
      if (this.state === "peck") { R.put(6, 10 + oy, 3); R.put(8, 10 + oy, 3); }
      const c = B.body, img = this.sp.paint({ 1: { c, lit: true }, 2: { c: B.belly }, 3: { c: B.beak || [232, 170, 64] }, 4: { c: [20, 18, 22] }, 5: { c: B.wing }, 6: { c: B.head || c, lit: true }, 7: { c: B.neck || c }, 8: { c: [255, 214, 60] } }, darken(c, 0.6));
      const k = (B.big || 1) * s;
      ctx.save(); ctx.imageSmoothingEnabled = false; ctx.translate(Math.round(this.x), Math.round(this.y - 12 * k)); if (this.dir < 0) ctx.scale(-1, 1);
      ctx.drawImage(img, -8 * k, 0, 16 * k, 13 * k); ctx.restore();
    }
  }

  // ---------------------------------------------------------------- furniture you buy with stars
  // rug, potted plant, cushion, cat tree and a little aquarium; drag them anywhere along the floor
  // nap: a spot one cat can sleep in (the cat house hides it inside)
  const FURN = {
    plant:   { w: 18, h: 30, price: 40, durable: true },   // prices in coins 🪙; durable things never wear out
    rug:     { w: 60, h: 6, price: 60 },
    cushion: { w: 30, h: 9, price: 50, nap: 5 },
    bed:     { w: 30, h: 13, price: 70, nap: 4 },
    aquarium:{ w: 30, h: 26, price: 120, durable: true },
    house:   { w: 36, h: 34, price: 150, nap: 0, hide: true, durable: true },
    tree:    { w: 44, h: 80, price: 200, perch: [[-5, 35, 13], [6, 61, 14]] },
    // role: watch (sit and stare, now and then a paw), play (act: the pose they do on it), nibble; decor just looks nice
    basket:  { w: 28, h: 12, price: 40, nap: 3 },
    heatpad: { w: 28, h: 6, price: 70, nap: 2 },
    hammock: { w: 44, h: 30, price: 90, nap: 11 },
    igloo:   { w: 30, h: 22, price: 110, nap: 0, hide: true },
    armchair:{ w: 32, h: 26, price: 180, nap: 12 },
    sofa:    { w: 56, h: 24, price: 220, nap: 11 },
    stool:   { w: 18, h: 22, price: 35, perch: [[0, 22, 8]] },
    bookshelf:{ w: 30, h: 62, price: 160, perch: [[0, 62, 14]], durable: true },
    catgrass:{ w: 16, h: 16, price: 25, role: "nibble" },
    track:   { w: 40, h: 10, price: 50, role: "play", act: "bat" },
    dispenser:{ w: 14, h: 14, price: 45, role: "play", act: "bat" },
    ballpit: { w: 44, h: 16, price: 120, role: "play", act: "roll" },
    piano:   { w: 34, h: 16, price: 130, role: "play", act: "knead" },
    mirror:  { w: 20, h: 40, price: 65, role: "watch", durable: true },
    fan:     { w: 20, h: 34, price: 55, role: "watch", durable: true },
    clock:   { w: 16, h: 52, price: 140, role: "watch", durable: true },
    tv:      { w: 36, h: 30, price: 250, role: "watch", durable: true },
    lamp:    { w: 14, h: 50, price: 60, role: "decor", durable: true },
    radio:   { w: 24, h: 16, price: 85, role: "decor", durable: true },
    statue:  { w: 20, h: 36, price: 300, role: "decor", durable: true },
    // round 3: more places to run, hide, nap and stare
    wheel:   { w: 42, h: 44, price: 260, role: "play", act: "gallop", on: true },
    castle:  { w: 40, h: 46, price: 240, nap: 0, hide: true, perch: [[0, 46, 16]] },
    teepee:  { w: 34, h: 36, price: 95, nap: 0, hide: true },
    beanbag: { w: 32, h: 14, price: 75, nap: 8 },
    scratcher:{ w: 36, h: 10, price: 40, nap: 6 },
    rocker:  { w: 30, h: 34, price: 160, nap: 13 },
    fireplace:{ w: 44, h: 38, price: 320, nap: 0, durable: true },
    window:  { w: 38, h: 46, price: 210, role: "watch", durable: true },
    lavalamp:{ w: 12, h: 30, price: 70, role: "watch", durable: true },
    xmastree:{ w: 34, h: 58, price: 180, role: "play", act: "bat", durable: true },
    cactus:  { w: 16, h: 30, price: 55, role: "play", act: "swipe" },
    feeder:  { w: 22, h: 30, price: 400, role: "decor", durable: true },
    // festival things: only sold while their festival is on (see extras.js)
    snowman: { w: 26, h: 38, price: 90, durable: true, event: "winter" },
    giftbox: { w: 24, h: 22, price: 70, nap: 0, hide: true, event: "winter" },
    candycane:{ w: 12, h: 34, price: 40, durable: true, event: "winter" },
    tulips:  { w: 24, h: 22, price: 45, role: "nibble", event: "spring" },
    birdhouse:{ w: 18, h: 40, price: 80, role: "watch", durable: true, event: "spring" },
    parasol: { w: 40, h: 44, price: 95, nap: 0, event: "summer" },
    beachball:{ w: 16, h: 16, price: 35, role: "play", act: "roll", event: "summer" },
    ghost:   { w: 20, h: 28, price: 60, role: "watch", durable: true, event: "halloween" },
    cauldron:{ w: 28, h: 22, price: 85, role: "watch", event: "halloween" },
    // round 4
    pumpkin: { w: 32, h: 28, price: 120, nap: 0, hide: true },
    bathtub: { w: 44, h: 22, price: 170, nap: 9 },
    tower:   { w: 46, h: 92, price: 340, perch: [[-9, 32, 11], [8, 60, 11], [-2, 90, 13]] },
    pillow:  { w: 26, h: 7, price: 30, nap: 4 },
    drum:    { w: 20, h: 16, price: 60, role: "play", act: "bat" },
    arcade:  { w: 24, h: 46, price: 360, role: "watch", durable: true },
    globe:   { w: 18, h: 30, price: 95, role: "watch", durable: true },
    monstera:{ w: 26, h: 40, price: 70, durable: true },
    tunnel:  { w: 52, h: 16, price: 45 },
    fountain:{ w: 20, h: 24, price: 90, durable: true },
    litter:  { w: 30, h: 12, price: 35, durable: true },
  };
  function paintFurniture(kind, R) {
    R.clear();
    if (kind === "rug") { R.ellipse(30, 3, 29.5, 2.8, 1); R.ellipse(30, 3, 23, 1.9, 2); R.ellipse(30, 3, 14, 1.1, 3); for (let x = 9; x < 52; x += 6) R.put(x, 3, 2); }
    else if (kind === "plant") {
      R.tri(9, 1, 6, 13, 12, 13, 3); R.tri(2, 7, 9, 17, 6, 19, 4); R.tri(16, 6, 9, 17, 12, 19, 4); R.tri(4, 3, 9, 15, 7, 17, 3); R.tri(14, 2, 9, 16, 11, 17, 3);
      R.rect(2, 19, 14, 2, 2); for (let y = 21; y < 30; y++) R.rect(3 + Math.floor((y - 21) / 4), y, 12 - 2 * Math.floor((y - 21) / 4), 1, 1);
    }
    else if (kind === "cushion") { R.ellipse(15, 5, 14.5, 3.8, 1); R.ellipse(15, 4.2, 10, 1.6, 2); for (const x of [7, 15, 23]) R.put(x, 5, 3); R.put(0, 7, 3); R.put(29, 7, 3); }
    else if (kind === "tree") {
      R.rect(4, 75, 36, 5, 1);                                                      // carpeted base
      for (let y = 18; y < 75; y++) R.rect(19, y, 6, 1, y % 3 ? 2 : 3);             // sisal-rope trunk
      R.rect(3, 40, 28, 5, 1); R.rect(13, 14, 30, 5, 1);                            // two platforms
      for (let y = 19; y < 27; y++) R.put(39, y, 4); R.circle(39, 28, 2.2, 5);      // a pom-pom on a string
    }
    else if (kind === "tunnel") {
      R.rect(4, 2, 44, 13, 1); R.ellipse(4, 8.5, 4, 6.5, 3); R.ellipse(48, 8.5, 3.6, 6.5, 2);
      for (let x = 10; x < 44; x += 8) R.rect(x, 2, 2, 13, 2);
      R.rect(4, 2, 44, 1, 4);
    }
    else if (kind === "fountain") { R.ellipse(10, 20, 9.5, 3.6, 1); R.ellipse(10, 19, 7, 1.6, 3); R.rect(8, 8, 4, 11, 2); R.ellipse(10, 8, 6, 2, 1); R.ellipse(10, 7.6, 4, 0.9, 3); }
    else if (kind === "litter") { R.rect(0, 3, 30, 2, 2); R.rect(1, 5, 28, 7, 1); R.rect(3, 5, 24, 2, 3); }
    else if (kind === "basket") { R.ellipse(14, 8, 13.5, 4, 1); R.ellipse(14, 5, 12, 1.6, 2); for (let x = 3; x < 26; x += 3) { R.put(x, 8, 2); R.put(x + 1, 10, 2); } }
    else if (kind === "heatpad") { R.rect(1, 1, 26, 5, 1); R.rect(3, 2, 22, 1, 2); R.rect(3, 4, 22, 1, 2); R.put(27, 4, 3); R.put(28, 5, 3); }
    else if (kind === "hammock") {
      R.rect(1, 4, 3, 24, 1); R.rect(40, 4, 3, 24, 1); R.rect(0, 28, 6, 2, 1); R.rect(38, 28, 6, 2, 1);
      for (let x = 5; x < 40; x++) { const y = 8 + Math.round(Math.sin(Math.PI * (x - 5) / 34) * 9); R.rect(x, y, 1, 3, x % 4 ? 2 : 3); }
      R.put(4, 6, 3); R.put(39, 6, 3);
    }
    else if (kind === "igloo") { R.ellipse(15, 22, 15, 20, 1); for (const y of [8, 14]) R.rect(2, y, 26, 1, 2); for (const x of [8, 22]) R.rect(x, 3, 1, 5, 2); R.ellipse(15, 21, 5, 7, 3); }
    else if (kind === "armchair") { R.rect(4, 0, 24, 13, 1); R.rect(3, 13, 26, 7, 2); R.rect(0, 8, 6, 13, 1); R.rect(26, 8, 6, 13, 1); R.rect(2, 21, 2, 5, 3); R.rect(28, 21, 2, 5, 3); R.rect(10, 4, 1, 6, 2); R.rect(21, 4, 1, 6, 2); }
    else if (kind === "sofa") { R.rect(4, 0, 48, 12, 1); R.rect(2, 12, 52, 7, 2); R.rect(0, 6, 7, 14, 1); R.rect(49, 6, 7, 14, 1); R.rect(27, 12, 1, 7, 1); for (const x of [2, 27, 52]) R.rect(x, 20, 2, 4, 3); }
    else if (kind === "stool") { R.rect(0, 0, 18, 4, 1); R.rect(2, 4, 2, 18, 2); R.rect(14, 4, 2, 18, 2); R.rect(2, 14, 14, 1, 2); }
    else if (kind === "bookshelf") {
      R.rect(0, 0, 30, 62, 1); R.rect(2, 2, 26, 58, 4); R.rect(2, 20, 26, 2, 1); R.rect(2, 40, 26, 2, 1);
      [[3, 8], [8, 10], [14, 9], [21, 7]].forEach(([x, h], i) => { R.rect(x, 20 - h, 4, h, 5 + (i % 3)); R.rect(x + 1, 40 - h + 1, 3, h - 1, 5 + ((i + 1) % 3)); R.rect(x, 60 - h, 4, h, 5 + ((i + 2) % 3)); });
    }
    else if (kind === "catgrass") { R.rect(3, 10, 10, 6, 1); R.rect(2, 9, 12, 2, 1); for (const [x, h] of [[4, 7], [6, 9], [8, 8], [10, 9], [12, 6], [5, 5], [9, 6]]) R.tri(x - 1, 9, x + 1, 9, x + (x % 3) - 1, 9 - h, x % 2 ? 3 : 4); }
    else if (kind === "track") { R.ellipse(20, 6, 19.5, 4, 1); R.ellipse(20, 5.6, 15, 2, 2); R.rect(2, 7, 36, 3, 1); }
    else if (kind === "dispenser") { R.circle(7, 7, 6.5, 1); R.ellipse(5, 5, 2, 1.5, 2); R.put(8, 9, 3); R.put(10, 6, 3); R.put(4, 9, 3); }
    else if (kind === "ballpit") { R.rect(0, 5, 44, 11, 1); R.rect(0, 5, 44, 2, 2); for (let i = 0; i < 26; i++) R.circle(3 + (i * 37) % 39, 4 + (i * 11) % 4, 1.8, 3 + (i % 4)); }
    else if (kind === "piano") { R.rect(0, 0, 34, 10, 1); R.rect(1, 10, 32, 5, 2); for (let x = 3; x < 32; x += 4) if (x % 12 !== 11) R.rect(x, 10, 2, 3, 1); R.rect(1, 15, 2, 1, 1); R.rect(31, 15, 2, 1, 1); }
    else if (kind === "mirror") { R.rect(0, 0, 20, 38, 1); R.rect(2, 2, 16, 34, 2); for (let k = 0; k < 6; k++) { R.put(5 + k, 10 - k, 3); R.put(8 + k, 18 - k, 3); } R.rect(4, 38, 12, 2, 1); }
    else if (kind === "fan") { R.circle(10, 9, 8.5, 1); R.circle(10, 9, 7, 3); R.circle(10, 9, 1.6, 1); R.rect(9, 17, 2, 15, 2); R.ellipse(10, 32, 7, 2, 2); }
    else if (kind === "clock") { R.rect(1, 0, 14, 52, 1); R.tri(1, 0, 15, 0, 8, -3, 1); R.circle(8, 9, 5, 2); R.put(8, 7, 3); R.put(8, 8, 3); R.put(9, 9, 3); R.rect(4, 19, 8, 26, 3); R.rect(0, 50, 16, 2, 1); }
    else if (kind === "tv") { R.rect(0, 0, 36, 24, 1); R.rect(2, 2, 32, 20, 3); R.rect(14, 24, 8, 3, 1); R.rect(10, 27, 16, 3, 1); R.put(33, 23, 2); }
    else if (kind === "lamp") { R.tri(4, 0, 10, 0, 7, 0, 1); R.rect(3, 0, 8, 2, 1); R.rect(2, 2, 10, 4, 1); R.rect(1, 6, 12, 5, 1); R.rect(6, 11, 2, 36, 2); R.ellipse(7, 48, 6, 2, 2); }
    else if (kind === "radio") { R.rect(0, 3, 24, 13, 1); R.rect(2, 5, 11, 9, 2); for (let y = 6; y < 14; y += 2) for (let x = 3; x < 12; x += 2) R.put(x, y, 1); R.circle(18, 8, 2.2, 3); R.circle(18, 13, 1.4, 3); for (let k = 0; k < 4; k++) R.put(20 + k, 2 - k * 0.6, 2); }
    else if (kind === "statue") {
      R.rect(2, 26, 16, 10, 1); R.rect(1, 25, 18, 2, 1);
      R.ellipse(10, 19, 6, 6.5, 2); R.circle(10, 9, 4.6, 2); R.tri(6, 7, 8, 6, 6.5, 2, 2); R.tri(12, 6, 14, 7, 13.5, 2, 2); R.limb(15, 22, 18, 12, 1.4, 2); R.put(9, 9, 3); R.put(11, 9, 3);
    }
    else if (kind === "snowman") {
      R.circle(13, 29, 9, 1); R.circle(13, 15, 7, 1); R.circle(13, 15, 7, 1); R.rect(6, 4, 14, 2, 2); R.rect(9, -2, 8, 6, 2);
      R.put(11, 13, 3); R.put(15, 13, 3); R.rect(13, 15, 4, 1, 4); R.rect(8, 20, 10, 2, 5); R.rect(15, 21, 2, 5, 5); for (const y of [26, 30, 34]) R.put(13, y, 3);
    }
    else if (kind === "giftbox") { R.rect(1, 8, 22, 14, 1); R.rect(0, 5, 24, 4, 2); R.rect(10, 5, 4, 17, 3); R.ellipse(8, 3, 4, 2.4, 3); R.ellipse(16, 3, 4, 2.4, 3); R.ellipse(12, 15, 3, 3.5, 4); R.rect(9, 15, 6, 7, 4); }
    else if (kind === "candycane") { for (let y = 8; y < 34; y++) R.rect(4, y, 4, 1, ((y >> 1) % 2) + 1); for (let a = 0; a < 20; a++) { const t = Math.PI * a / 19; R.rect(Math.round(8 - Math.cos(t) * 4 - 2), Math.round(8 - Math.sin(t) * 6), 4, 2, (a >> 2) % 2 + 1); } }
    else if (kind === "tulips") { R.rect(3, 15, 18, 7, 1); R.rect(2, 14, 20, 2, 1); for (const [x, c] of [[6, 2], [12, 3], [18, 4]]) { R.rect(x, 5, 1, 10, 5); R.ellipse(x + 0.5, 4, 2.4, 3, c); R.put(x, 1, c); R.put(x + 2, 1, c); } }
    else if (kind === "birdhouse") { R.rect(8, 18, 2, 22, 1); R.rect(2, 8, 14, 12, 2); R.tri(0, 9, 9, 1, 18, 9, 3); R.circle(9, 13, 2.2, 4); R.rect(8, 16, 2, 1, 1); }
    else if (kind === "parasol") { R.rect(19, 10, 2, 34, 1); for (let x = 0; x < 40; x++) { const top = 2 + Math.round(((x - 20) / 20) ** 2 * 8); R.rect(x, top, 1, 12 - top + 2, (x >> 2) % 2 ? 2 : 3); } R.rect(14, 42, 12, 2, 1); }
    else if (kind === "beachball") { R.circle(8, 8, 7.5, 1); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const a = Math.atan2(y - 8, x - 8); if (R.get(x, y)) R.put(x, y, 1 + (Math.floor((a + Math.PI) / (Math.PI / 3)) % 3)); } R.circle(8, 8, 1.6, 4); }
    else if (kind === "ghost") { R.ellipse(10, 10, 9, 10, 1); R.rect(1, 10, 18, 14, 1); for (const x of [1, 7, 13]) R.tri(x, 24, x + 6, 24, x + 3, 28, 1); R.rect(6, 9, 2, 3, 2); R.rect(12, 9, 2, 3, 2); R.ellipse(10, 15, 2, 1.6, 2); }
    else if (kind === "cauldron") { R.ellipse(14, 14, 13, 8, 1); R.rect(2, 5, 24, 3, 2); R.ellipse(14, 6, 11, 2, 3); R.rect(4, 20, 3, 2, 1); R.rect(21, 20, 3, 2, 1); for (const [x, y] of [[9, 4], [15, 3], [19, 4]]) R.circle(x, y, 1.5, 4); }
    else if (kind === "pumpkin") {
      R.ellipse(16, 17, 15.5, 11, 1); for (const x of [8, 16, 24]) R.rect(x, 7, 1, 20, 2); R.rect(14, 1, 4, 6, 3); R.ellipse(21, 3, 4, 1.6, 4);
      R.ellipse(16, 22, 5, 6, 5); R.rect(11, 22, 10, 6, 5); R.tri(8, 13, 11, 13, 9.5, 10, 5); R.tri(21, 13, 24, 13, 22.5, 10, 5);
    }
    else if (kind === "bathtub") {
      R.rect(2, 4, 40, 12, 1); R.ellipse(22, 4, 20, 2.4, 1); R.ellipse(22, 4, 18, 1.6, 2); R.rect(4, 6, 36, 2, 3);
      R.rect(4, 16, 3, 5, 4); R.rect(37, 16, 3, 5, 4); R.rect(38, -6, 2, 10, 4); R.rect(34, -6, 5, 2, 4);
      for (const [x, y] of [[10, 1], [16, 0], [27, 1], [31, 0]]) R.circle(x, y, 1.6, 5);
    }
    else if (kind === "tower") {
      R.rect(4, 86, 38, 6, 1); R.rect(20, 8, 6, 78, 2); for (let y = 12; y < 86; y += 4) R.rect(20, y, 6, 1, 3);
      R.rect(4, 58, 20, 5, 4); R.rect(22, 30, 20, 5, 4); R.rect(10, 0, 26, 5, 4); R.rect(8, 63, 3, 23, 2); R.rect(38, 35, 3, 51, 2);
      R.limb(36, 5, 38, 16, 0.6, 5); R.circle(38, 17, 2, 6);
    }
    else if (kind === "pillow") { R.ellipse(13, 4, 12.5, 3.4, 1); R.ellipse(13, 3, 9, 1.8, 2); R.put(1, 4, 3); R.put(25, 4, 3); R.put(13, 3, 3); }
    else if (kind === "drum") { R.rect(1, 4, 18, 11, 1); R.ellipse(10, 4, 9, 2.4, 2); for (let x = 2; x < 19; x += 3) R.limb(x, 5, x + 2, 13, 0.4, 3); R.rect(1, 14, 18, 2, 4); R.limb(13, -4, 9, 2, 0.5, 4); }
    else if (kind === "arcade") {
      R.rect(1, 0, 22, 46, 1); R.rect(3, 2, 18, 5, 2); R.rect(3, 9, 18, 14, 3); R.rect(1, 25, 22, 6, 4);
      R.circle(7, 27, 1.6, 5); R.put(14, 27, 6); R.put(17, 27, 2); R.rect(4, 33, 16, 11, 4);
    }
    else if (kind === "globe") { R.rect(5, 26, 8, 4, 1); R.rect(8, 20, 2, 6, 1); R.circle(9, 11, 8, 2); R.limb(2, 4, 3, 19, 0.6, 1); R.limb(2, 4, 9, 2, 0.6, 1); for (const [x, y] of [[6, 8], [7, 9], [11, 13], [12, 12], [10, 6], [5, 13]]) R.rect(x, y, 2, 2, 3); }
    else if (kind === "monstera") {
      R.rect(7, 30, 12, 10, 1); R.rect(6, 29, 14, 3, 1); R.limb(13, 30, 6, 14, 0.5, 2); R.limb(13, 30, 20, 10, 0.5, 2); R.limb(13, 30, 13, 4, 0.5, 2);
      for (const [x, y, r] of [[5, 12, 5], [21, 9, 5.5], [13, 4, 5], [8, 22, 4], [19, 21, 4]]) { R.ellipse(x, y, r, r * 0.8, 3); R.put(x, y, 4); R.put(x - 1, y - 1, 4); }
    }
    else if (kind === "wheel") {
      R.rect(4, 40, 34, 4, 1); R.rect(19, 22, 4, 18, 1);                                   // stand
      for (let a = 0; a < 64; a++) { const t = a / 64 * Math.PI * 2; R.rect(21 + Math.cos(t) * 19, 21 + Math.sin(t) * 19, 2, 2, 2); }   // the rim
      R.circle(21, 21, 2.5, 3);
    }
    else if (kind === "castle") {
      R.rect(4, 14, 32, 32, 1); for (let y = 18; y < 46; y += 5) R.rect(4, y, 32, 1, 2);
      for (const x of [4, 12, 20, 28]) R.rect(x, 10, 5, 4, 1);                             // battlements
      R.rect(0, 6, 8, 40, 3); R.rect(32, 6, 8, 40, 3); R.tri(0, 6, 8, 6, 4, -2, 4); R.tri(32, 6, 40, 6, 36, -2, 4);   // towers
      R.ellipse(20, 40, 6, 9, 5); R.rect(14, 40, 12, 6, 5); R.rect(3, 20, 2, 4, 5); R.rect(35, 20, 2, 4, 5);
    }
    else if (kind === "teepee") {
      R.tri(17, 2, 0, 36, 34, 36, 1); for (let y = 10; y < 36; y += 7) for (let x = 0; x < 34; x += 4) if (Math.abs(x + 2 - 17) < (y - 2) / 2) R.put(x + 2, y, 2);
      R.tri(17, 14, 10, 36, 24, 36, 3); R.limb(13, 0, 17, 4, 0.8, 4); R.limb(21, 0, 17, 4, 0.8, 4);
    }
    else if (kind === "beanbag") { R.ellipse(16, 9, 15.5, 5, 1); R.ellipse(16, 6, 10, 3.6, 2); R.ellipse(12, 5, 3, 1.2, 3); }
    else if (kind === "scratcher") { for (let x = 0; x < 36; x++) { const y = 2 + Math.round(Math.sin(Math.PI * x / 35) * -2 + 2); R.rect(x, y, 1, 10 - y, x % 3 ? 1 : 2); } R.rect(0, 8, 36, 2, 3); }
    else if (kind === "rocker") {
      R.rect(3, 0, 4, 22, 1); R.rect(3, 2, 2, 18, 2); R.rect(3, 12, 24, 4, 1); R.rect(6, 10, 20, 2, 3);       // back and seat with a cushion
      R.rect(5, 16, 2, 14, 1); R.rect(23, 16, 2, 14, 1); R.rect(24, 8, 2, 8, 1);
      for (let x = 0; x < 30; x++) R.put(x, 31 + Math.round(((x - 15) / 15) ** 2 * 2), 1);
    }
    else if (kind === "fireplace") {
      R.rect(0, 0, 44, 5, 1); R.rect(2, 5, 40, 33, 2); for (let y = 8; y < 38; y += 5) for (let x = (y % 10 ? 2 : 6); x < 42; x += 8) R.rect(x, y, 1, 4, 3);
      R.rect(10, 14, 24, 24, 4); R.ellipse(22, 14, 12, 4, 4); R.rect(12, 33, 20, 3, 5);
    }
    else if (kind === "window") {
      R.rect(0, 0, 38, 42, 1); R.rect(2, 2, 34, 36, 2); R.rect(18, 2, 2, 36, 1); R.rect(2, 19, 34, 2, 1);
      R.rect(-1, 38, 40, 4, 3); R.rect(1, 42, 2, 4, 3); R.rect(35, 42, 2, 4, 3);
    }
    else if (kind === "lavalamp") { R.tri(6, 0, 2, 4, 10, 4, 1); R.rect(2, 4, 8, 3, 1); R.ellipse(6, 15, 4, 9, 2); R.tri(1, 24, 11, 24, 6, 20, 1); R.rect(1, 24, 10, 6, 1); }
    else if (kind === "xmastree") {
      for (let i = 0; i < 3; i++) R.tri(17, 2 + i * 14, 4 - i * 2, 22 + i * 14, 30 + i * 2, 22 + i * 14, 1);
      R.rect(14, 50, 6, 4, 2); R.rect(10, 53, 14, 5, 3);
      R.tri(17, -3, 14, 3, 20, 3, 4);
    }
    else if (kind === "cactus") { R.rect(5, 2, 6, 22, 1); R.ellipse(8, 2, 3, 2, 1); R.rect(1, 8, 3, 7, 1); R.rect(1, 14, 5, 2, 1); R.rect(12, 6, 3, 8, 1); R.rect(10, 12, 5, 2, 1); for (let y = 4; y < 22; y += 3) R.put(7 + (y % 2), y, 2); R.rect(2, 24, 12, 6, 3); R.rect(1, 23, 14, 2, 3); }
    else if (kind === "feeder") {
      R.rect(3, 0, 16, 3, 1); R.rect(4, 3, 14, 16, 2); R.rect(6, 5, 10, 10, 3); for (let y = 9; y < 15; y++) for (let x = 7; x < 15; x += 2) R.put(x + (y % 2), y, 4);
      R.rect(2, 19, 18, 6, 1); R.ellipse(11, 26, 10, 3, 1); R.ellipse(11, 25, 7, 1.2, 4); R.put(16, 21, 5);
    }
    else if (kind === "bed") { R.ellipse(15, 8, 14.5, 4.6, 1); R.ellipse(15, 7, 11, 2.6, 2); R.ellipse(15, 7.6, 9, 1.8, 3); R.rect(1, 9, 28, 3, 1); }
    else if (kind === "house") {
      R.tri(18, 0, 0, 13, 36, 13, 1); R.tri(18, 3, 4, 12, 32, 12, 2);                       // roof
      R.rect(3, 12, 30, 21, 3); for (let y = 15; y < 33; y += 4) R.rect(3, y, 30, 1, 4);      // wooden walls
      R.ellipse(18, 27, 7, 8, 5); R.rect(11, 27, 14, 6, 5);                                    // round door
      R.circle(18, 7.5, 1.6, 6);                                                              // a little heart window
    }
    else if (kind === "aquarium") {
      R.rect(0, 2, 30, 2, 4); R.rect(1, 4, 28, 16, 1); R.rect(2, 6, 26, 12, 2); R.rect(2, 17, 26, 3, 3); R.rect(0, 20, 30, 6, 4);
      for (const [x, h] of [[6, 6], [9, 4], [22, 7]]) for (let y = 17 - h; y < 17; y++) R.put(x + (y % 2), y, 5);
    }
  }
  const FURN_PAL = {
    rug: { 1: { c: [178, 70, 78], lit: true }, 2: { c: [236, 200, 128] }, 3: { c: [96, 128, 176] } },
    plant: { 1: { c: [198, 106, 66], lit: true }, 2: { c: [168, 86, 52], lit: true }, 3: { c: [98, 172, 92], lit: true }, 4: { c: [62, 128, 66], lit: true } },
    cushion: { 1: { c: [128, 104, 206], lit: true }, 2: { c: [160, 138, 228] }, 3: { c: [236, 196, 92] } },
    basket: { 1: { c: [196, 150, 96], lit: true }, 2: { c: [150, 108, 64] } },
    heatpad: { 1: { c: [240, 160, 120], lit: true }, 2: { c: [255, 110, 80] }, 3: { c: [70, 60, 60] } },
    hammock: { 1: { c: [150, 110, 76], lit: true }, 2: { c: [86, 180, 200], lit: true }, 3: { c: [250, 236, 200] } },
    igloo: { 1: { c: [236, 244, 255], lit: true }, 2: { c: [190, 210, 236] }, 3: { c: [60, 80, 110] } },
    armchair: { 1: { c: [92, 160, 120], lit: true }, 2: { c: [120, 190, 146], lit: true }, 3: { c: [90, 64, 44] } },
    sofa: { 1: { c: [200, 98, 110], lit: true }, 2: { c: [226, 128, 138], lit: true }, 3: { c: [90, 64, 44] } },
    stool: { 1: { c: [214, 160, 100], lit: true }, 2: { c: [176, 124, 72] } },
    bookshelf: { 1: { c: [176, 120, 76], lit: true }, 4: { c: [92, 60, 40] }, 5: { c: [210, 80, 80], lit: true }, 6: { c: [80, 130, 200], lit: true }, 7: { c: [240, 200, 90], lit: true } },
    catgrass: { 1: { c: [210, 120, 80], lit: true }, 3: { c: [120, 200, 90], lit: true }, 4: { c: [80, 160, 70] } },
    track: { 1: { c: [250, 180, 60], lit: true }, 2: { c: [220, 140, 40] } },
    dispenser: { 1: { c: [120, 200, 230], lit: true }, 2: { c: [220, 245, 255] }, 3: { c: [60, 90, 120] } },
    ballpit: { 1: { c: [90, 170, 230], lit: true }, 2: { c: [60, 130, 200] }, 3: { c: [240, 90, 90], lit: true }, 4: { c: [250, 210, 70], lit: true }, 5: { c: [110, 200, 120], lit: true }, 6: { c: [180, 120, 230], lit: true } },
    piano: { 1: { c: [60, 50, 60], lit: true }, 2: { c: [250, 248, 240] } },
    mirror: { 1: { c: [210, 170, 90], lit: true }, 2: { c: [196, 226, 240], lit: true }, 3: { c: [250, 252, 255] } },
    fan: { 1: { c: [190, 200, 210], lit: true }, 2: { c: [150, 160, 175] }, 3: { c: [236, 242, 248] } },
    clock: { 1: { c: [140, 90, 56], lit: true }, 2: { c: [250, 244, 226] }, 3: { c: [60, 40, 30] } },
    tv: { 1: { c: [70, 70, 80], lit: true }, 2: { c: [240, 90, 90] }, 3: { c: [30, 34, 44] } },
    lamp: { 1: { c: [250, 220, 150], lit: true }, 2: { c: [110, 90, 70] } },
    radio: { 1: { c: [200, 90, 70], lit: true }, 2: { c: [240, 220, 190] }, 3: { c: [80, 60, 50] } },
    statue: { 1: { c: [200, 200, 205], lit: true }, 2: { c: [236, 190, 70], lit: true }, 3: { c: [120, 80, 20] } },
    tunnel: { 1: { c: [236, 140, 72], lit: true }, 2: { c: [200, 100, 52] }, 3: { c: [70, 40, 30] }, 4: { c: [255, 186, 120] } },
    fountain: { 1: { c: [236, 240, 246], lit: true }, 2: { c: [200, 214, 230], lit: true }, 3: { c: [96, 176, 232] } },
    litter: { 1: { c: [120, 190, 160], lit: true }, 2: { c: [86, 150, 124] }, 3: { c: [236, 214, 160] } },
    bed: { 1: { c: [92, 156, 214], lit: true }, 2: { c: [244, 226, 200] }, 3: { c: [255, 240, 222] } },
    house: { 1: { c: [214, 86, 86], lit: true }, 2: { c: [184, 64, 70] }, 3: { c: [222, 176, 120], lit: true }, 4: { c: [196, 148, 96] }, 5: { c: [58, 40, 34] }, 6: { c: [255, 210, 120] } },
    tree: { 1: { c: [218, 200, 176], lit: true }, 2: { c: [196, 166, 116] }, 3: { c: [166, 136, 92] }, 4: { c: [90, 70, 60] }, 5: { c: [255, 120, 160], lit: true } },
    snowman: { 1: { c: [250, 252, 255], lit: true }, 2: { c: [50, 50, 60] }, 3: { c: [30, 30, 40] }, 4: { c: [240, 140, 60] }, 5: { c: [220, 60, 70] } },
    giftbox: { 1: { c: [220, 60, 80], lit: true }, 2: { c: [240, 90, 110], lit: true }, 3: { c: [255, 214, 80], lit: true }, 4: { c: [255, 214, 80] } },
    candycane: { 1: { c: [250, 250, 250], lit: true }, 2: { c: [220, 50, 60], lit: true } },
    tulips: { 1: { c: [200, 140, 100], lit: true }, 2: { c: [255, 110, 140], lit: true }, 3: { c: [255, 214, 80], lit: true }, 4: { c: [180, 120, 255], lit: true }, 5: { c: [80, 160, 80] } },
    birdhouse: { 1: { c: [150, 110, 80] }, 2: { c: [120, 190, 230], lit: true }, 3: { c: [220, 80, 80], lit: true }, 4: { c: [50, 40, 40] } },
    parasol: { 1: { c: [200, 180, 150] }, 2: { c: [255, 110, 120], lit: true }, 3: { c: [255, 250, 240], lit: true } },
    beachball: { 1: { c: [255, 90, 90], lit: true }, 2: { c: [80, 160, 255], lit: true }, 3: { c: [255, 220, 70], lit: true }, 4: { c: [255, 255, 255] } },
    ghost: { 1: { c: [245, 245, 255], lit: true }, 2: { c: [40, 40, 60] } },
    cauldron: { 1: { c: [50, 50, 60], lit: true }, 2: { c: [80, 80, 90] }, 3: { c: [120, 220, 100], lit: true }, 4: { c: [170, 250, 140] } },
    pumpkin: { 1: { c: [245, 150, 50], lit: true }, 2: { c: [210, 110, 30] }, 3: { c: [110, 90, 50] }, 4: { c: [90, 170, 70] }, 5: { c: [60, 36, 24] } },
    bathtub: { 1: { c: [250, 250, 252], lit: true }, 2: { c: [140, 200, 240] }, 3: { c: [180, 220, 245] }, 4: { c: [220, 180, 80], lit: true }, 5: { c: [255, 255, 255] } },
    tower: { 1: { c: [170, 120, 80] }, 2: { c: [210, 180, 130], lit: true }, 3: { c: [180, 150, 100] }, 4: { c: [150, 120, 200], lit: true }, 5: { c: [90, 70, 60] }, 6: { c: [255, 120, 150] } },
    pillow: { 1: { c: [255, 180, 200], lit: true }, 2: { c: [255, 210, 222] }, 3: { c: [220, 120, 150] } },
    drum: { 1: { c: [220, 70, 80], lit: true }, 2: { c: [250, 244, 230] }, 3: { c: [255, 210, 80] }, 4: { c: [150, 100, 60] } },
    arcade: { 1: { c: [90, 70, 170], lit: true }, 2: { c: [255, 210, 80] }, 3: { c: [30, 30, 50] }, 4: { c: [60, 46, 120] }, 5: { c: [230, 60, 70] }, 6: { c: [80, 200, 255] } },
    globe: { 1: { c: [190, 150, 80], lit: true }, 2: { c: [90, 160, 230], lit: true }, 3: { c: [100, 190, 110] } },
    monstera: { 1: { c: [220, 120, 90], lit: true }, 2: { c: [80, 130, 60] }, 3: { c: [70, 170, 90], lit: true }, 4: { c: [40, 110, 60] } },
    wheel: { 1: { c: [140, 110, 90], lit: true }, 2: { c: [120, 200, 230], lit: true }, 3: { c: [250, 230, 160] } },
    castle: { 1: { c: [210, 180, 140], lit: true }, 2: { c: [180, 150, 110] }, 3: { c: [196, 166, 126], lit: true }, 4: { c: [220, 80, 100], lit: true }, 5: { c: [70, 50, 40] } },
    teepee: { 1: { c: [250, 236, 210], lit: true }, 2: { c: [240, 120, 120] }, 3: { c: [80, 60, 50] }, 4: { c: [150, 110, 70] } },
    beanbag: { 1: { c: [250, 170, 70], lit: true }, 2: { c: [255, 196, 110], lit: true }, 3: { c: [255, 230, 180] } },
    scratcher: { 1: { c: [212, 170, 120], lit: true }, 2: { c: [180, 136, 90] }, 3: { c: [160, 120, 80] } },
    rocker: { 1: { c: [170, 110, 70], lit: true }, 2: { c: [140, 90, 56] }, 3: { c: [120, 180, 220], lit: true } },
    fireplace: { 1: { c: [150, 100, 70], lit: true }, 2: { c: [196, 100, 80], lit: true }, 3: { c: [160, 76, 60] }, 4: { c: [40, 30, 28] }, 5: { c: [110, 70, 40] } },
    window: { 1: { c: [250, 248, 240], lit: true }, 2: { c: [150, 200, 240] }, 3: { c: [200, 160, 110], lit: true } },
    lavalamp: { 1: { c: [190, 190, 200], lit: true }, 2: { c: [140, 80, 200] } },
    xmastree: { 1: { c: [60, 150, 80], lit: true }, 2: { c: [120, 80, 50] }, 3: { c: [210, 60, 70], lit: true }, 4: { c: [255, 210, 70], lit: true } },
    cactus: { 1: { c: [100, 170, 90], lit: true }, 2: { c: [240, 240, 210] }, 3: { c: [210, 120, 80], lit: true } },
    feeder: { 1: { c: [240, 240, 245], lit: true }, 2: { c: [200, 210, 220] }, 3: { c: [180, 220, 240] }, 4: { c: [160, 100, 60] }, 5: { c: [80, 220, 120] } },
    aquarium: { 1: { c: [198, 228, 240], lit: true }, 2: { c: [110, 176, 222] }, 3: { c: [232, 206, 146] }, 4: { c: [70, 78, 98], lit: true }, 5: { c: [70, 150, 90] } },
  };
  const FURN_OUTLINE = { rug: [96, 40, 44], plant: [70, 50, 34], cushion: [70, 50, 110], bed: [44, 74, 110], basket: [96, 64, 36], heatpad: [120, 60, 50], hammock: [80, 60, 44], igloo: [90, 110, 140], armchair: [44, 90, 64], sofa: [110, 50, 60], stool: [100, 70, 40],
    bookshelf: [80, 50, 30], catgrass: [80, 60, 40], track: [140, 90, 30], dispenser: [50, 90, 120], ballpit: [40, 80, 130], piano: [30, 26, 30], mirror: [120, 90, 40], fan: [90, 100, 110],
    clock: [70, 44, 26], tv: [30, 30, 36], lamp: [100, 80, 60], radio: [110, 50, 40], statue: [120, 90, 30], tunnel: [110, 60, 30], fountain: [60, 90, 120], litter: [50, 90, 70], house: [92, 52, 40], tree: [96, 74, 52], aquarium: [44, 52, 70],
    wheel: [70, 56, 46], castle: [110, 84, 60], teepee: [110, 80, 60], beanbag: [150, 90, 30], scratcher: [110, 80, 50], rocker: [90, 56, 34], fireplace: [80, 50, 36], window: [110, 86, 60],
    lavalamp: [80, 80, 90], xmastree: [30, 80, 40], cactus: [50, 90, 50], feeder: [90, 100, 110],
    snowman: [120, 140, 170], giftbox: [110, 30, 40], candycane: [140, 40, 50], tulips: [90, 70, 50], birdhouse: [80, 56, 40], parasol: [120, 70, 70], beachball: [110, 70, 70], ghost: [120, 120, 150], cauldron: [20, 20, 26],
    pumpkin: [120, 60, 20], bathtub: [110, 120, 140], tower: [90, 64, 44], pillow: [150, 80, 100], drum: [100, 40, 40], arcade: [40, 30, 80], globe: [80, 60, 40], monstera: [40, 70, 40] };
  function furnitureThumb(kind, ctx) {
    const f = FURN[kind], sp = new Sprite(f.w, f.h); paintFurniture(kind, sp.R);
    const img = sp.paint(FURN_PAL[kind], FURN_OUTLINE[kind]), W = ctx.canvas.width, H = ctx.canvas.height, k = Math.min((W - 4) / f.w, (H - 4) / f.h);
    ctx.imageSmoothingEnabled = false; ctx.drawImage(img, Math.round((W - f.w * k) / 2), Math.round(H - f.h * k - 2), f.w * k, f.h * k);
  }
  // a platform on the cat tree: cats perch on it just like on a wall shelf
  class Platform {
    constructor(tree, dx, dy, hw) { this.tree = tree; this.dx = dx; this.dy = dy; this.w2 = hw; this.isPlatform = true; this.world = tree.world; }
    get x() { return this.tree.x + this.dx * this.world.toyScale; }
    get top() { return this.tree.y - this.dy * this.world.toyScale; }
    get hw() { return this.w2 * this.world.toyScale; }
    cap() { return this.tree.usable ? 1 : 0; }
    cats() { return this.world.cats.filter((c) => c.perch === this); }
    hit() { return false; }
    update() {} render() {}
  }
  const dt0 = (f) => f.dt || 0.016;
  const wearK = () => 1 - 0.12 * (window.CatLife && window.CatLife.sk ? window.CatLife.sk("k2") : 0);     // the "Built to last" skill
  class Furniture {
    constructor(world, kind, x, item) {
      this.world = world; this.kind = kind; this.x = x; this.y = world.floor; this.held = false; this.occupant = null; this.f = FURN[kind];
      this.item = item || { k: kind, cond: 100 };
      if (this.f.durable) this.item.cond = 100;
      this.sp = new Sprite(this.f.w, this.f.h); this.dirty = true; this.t = 0;
      if (this.f.perch) this.platforms = this.f.perch.map(([dx, dy, hw]) => new Platform(this, dx, dy, hw));
      if (kind === "aquarium") this.fish = [{ x: 8, y: 9, d: 1, c: "#ff8a3d" }, { x: 20, y: 13, d: -1, c: "#ffd34d" }];
    }
    hit(px, py) { const s = this.world.toyScale, hw = this.f.w * s / 2; return Math.abs(px - this.x) < hw && py > this.y - this.f.h * s && py < this.y + 2; }
    // things wear out: a little with every use, a little every day; at 0 they're broken until you repair them
    get cond() { return this.item.cond; }
    get usable() { return this.item.cond > 0; }
    use() { if (!this.f.durable) this.item.cond = Math.max(0, this.item.cond - 1.5 * wearK()); }
    grab() { this.held = true; } release() { this.held = false; }
    click() {
      if (this.kind === "litter" && this.item.dirty) { if (this.world.onCleanLitter) this.world.onCleanLitter(this); return; }
      const o = this.occupant; if (o && this.world.cats.includes(o)) { o.set("stretch", 1.4); return; }      // knock knock: whoever's napping wakes up
      this.world.burst(this.x, this.y - this.f.h * this.world.toyScale, "note", "#b08d57", 1);
    }
    update(dt) {
      const w = this.world, s = w.toyScale; this.t += dt; this.dt = dt; this.y = w.floor;
      if (!this.f.durable) this.item.cond = Math.max(0, this.item.cond - dt * 2 / 86400 * wearK());   // two points a day
      if (!this.usable && this.occupant) { const o = this.occupant; this.occupant = null; if (o.cushion === this) { o.cushion = null; o.set("stretch", 1.4); } }
      if (this.held) this.x += (clamp(w.pointer.x, this.f.w * s / 2, w.W - this.f.w * s / 2) - this.x) * Math.min(1, dt * 14);
      if (this.occupant && (!w.cats.includes(this.occupant) || this.occupant.cushion !== this)) this.occupant = null;
      if (this.f.hide && this.occupant && Math.random() < dt * 0.5) w.burst(this.x + 3 * s, this.y - 16 * s, "z", "#8a6b55", 1, { rise: true });
      if (this.fish) for (const f of this.fish) { f.x += f.d * dt * 4; if (f.x < 4 || f.x > 25) f.d *= -1; f.y += Math.sin(this.t * 2 + f.x) * dt * 1.5; f.y = clamp(f.y, 7, 15); }
    }
    render(ctx) {
      const w = this.world, s = w.toyScale, f = this.f;
      if (this.dirty) { paintFurniture(this.kind, this.sp.R); this.img = this.sp.paint(FURN_PAL[this.kind], FURN_OUTLINE[this.kind]); this.dirty = false; }
      const x0 = Math.round(this.x - f.w * s / 2), y0 = Math.round(this.y - f.h * s + (this.kind === "rug" ? 2 * s : 0));
      if (this.kind !== "rug") { ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = "#000"; ctx.beginPath(); ctx.ellipse(this.x, w.floor + s, f.w * s * 0.45, 1.8 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
      ctx.save(); ctx.imageSmoothingEnabled = false;
      const c = this.cond; if (c < 40) ctx.filter = c <= 0 ? "grayscale(.9) brightness(.8)" : `saturate(${0.5 + c / 80}) brightness(${0.85 + c / 270})`;   // faded, then broken
      ctx.drawImage(this.img, x0, y0, f.w * s, f.h * s); ctx.filter = "none";
      if (c < 40) {                                     // worn patches and, once broken, a crack
        ctx.fillStyle = c <= 0 ? "rgba(40,30,25,.75)" : "rgba(90,70,55,.45)";
        const seed = this.kind.length * 7 + Math.round(this.x) % 5;
        for (let i = 0; i < (c <= 0 ? 7 : 4); i++) ctx.fillRect(x0 + ((seed * (i + 3) * 13) % Math.max(1, f.w - 3)) * s, y0 + ((seed * (i + 5) * 7) % Math.max(1, f.h - 2)) * s, s * (c <= 0 ? 2 : 1), s);
      }
      if (this.kind === "tv" && c > 0) {                // the telly flickers
        const ph = Math.floor(this.t * 3); const cols = ["#7fc8f8", "#ffd34d", "#ff8fab", "#9be59b"];
        for (let i = 0; i < 4; i++) { ctx.fillStyle = cols[(ph + i) % 4]; ctx.fillRect(x0 + (3 + (i % 2) * 15) * s, y0 + (3 + (i >> 1) * 9) * s, 15 * s, 9 * s); }
      }
      if (this.kind === "clock") { const a = Math.sin(this.t * 2.2) * 0.5; ctx.strokeStyle = "#e0b84a"; ctx.lineWidth = s; ctx.beginPath(); ctx.moveTo(x0 + 8 * s, y0 + 20 * s); ctx.lineTo(x0 + (8 + Math.sin(a) * 14) * s, y0 + (20 + Math.cos(a) * 20) * s); ctx.stroke(); ctx.fillStyle = "#e0b84a"; ctx.beginPath(); ctx.arc(x0 + (8 + Math.sin(a) * 14) * s, y0 + (20 + Math.cos(a) * 20) * s, 2 * s, 0, 7); ctx.fill(); }
      if (this.kind === "fan") { ctx.strokeStyle = "#8a96a6"; ctx.lineWidth = 2 * s; for (let i = 0; i < 3; i++) { const a = this.t * 14 + i * 2.1; ctx.beginPath(); ctx.moveTo(x0 + 10 * s, y0 + 9 * s); ctx.lineTo(x0 + (10 + Math.cos(a) * 6) * s, y0 + (9 + Math.sin(a) * 6) * s); ctx.stroke(); } }
      if (this.kind === "track") { const a = this.t * 3; ctx.fillStyle = "#ff5a8a"; ctx.beginPath(); ctx.arc(x0 + (20 + Math.cos(a) * 17) * s, y0 + (5.5 + Math.sin(a) * 3) * s, 2 * s, 0, 7); ctx.fill(); }
      if ((this.kind === "lamp" || this.kind === "heatpad") && w.isNight()) {
        const lx = this.x, ly = this.kind === "lamp" ? y0 + 8 * s : this.y - 3 * s, r = (this.kind === "lamp" ? 90 : 30) * s / 3 * 2;
        const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, r); g.addColorStop(0, this.kind === "lamp" ? "rgba(255,220,140,.45)" : "rgba(255,140,90,.35)"); g.addColorStop(1, "rgba(255,220,140,0)");
        ctx.fillStyle = g; ctx.fillRect(lx - r, ly - r, r * 2, r * 2);
      }
      if (this.kind === "wheel") {                     // spokes turn, fast when someone's running in it
        const run = w.cats.some((k) => k.state === "gallop" && k.fRef === this); this.spin = (this.spin || 0) + dt0(this) * (run ? 9 : 0.4);
        ctx.strokeStyle = "#5aa9c9"; ctx.lineWidth = s; for (let i = 0; i < 4; i++) { const a = this.spin + i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(x0 + (21 - Math.cos(a) * 18) * s, y0 + (21 - Math.sin(a) * 18) * s); ctx.lineTo(x0 + (21 + Math.cos(a) * 18) * s, y0 + (21 + Math.sin(a) * 18) * s); ctx.stroke(); }
      }
      if (this.kind === "fireplace") {                 // a crackling fire, warm glow
        const ph = this.t * 9; const cols = ["#ff6a2a", "#ffb02e", "#ffe27a"];
        for (let i = 0; i < 7; i++) { const h = 6 + Math.abs(Math.sin(ph + i * 1.7)) * 9, x = x0 + (13 + i * 2.8) * s; ctx.fillStyle = cols[i % 3]; ctx.fillRect(Math.round(x), Math.round(y0 + (33 - h) * s), Math.round(2 * s), Math.round(h * s)); }
        const g = ctx.createRadialGradient(this.x, y0 + 28 * s, 0, this.x, y0 + 28 * s, 60 * s); g.addColorStop(0, `rgba(255,150,60,${w.isNight() ? 0.32 : 0.14})`); g.addColorStop(1, "rgba(255,150,60,0)");
        ctx.fillStyle = g; ctx.fillRect(this.x - 60 * s, y0 - 32 * s, 120 * s, 100 * s);
        if (Math.random() < 0.03) w.burst(this.x + rnd(-6, 6) * s, y0 + 16 * s, "spark", "#ffb02e", 1, { rise: true });
      }
      if (this.kind === "window") {                     // what's outside: day or night sky, a drifting cloud
        const night = w.isNight(), wx = w.weather && w.weather.kind;
        for (const [px, py] of [[2, 2], [20, 2], [2, 21], [20, 21]]) { ctx.fillStyle = night ? "#2a3560" : wx === "rain" || wx === "storm" ? "#9fb1c4" : "#a9dcf5"; ctx.fillRect(x0 + px * s, y0 + py * s, 16 * s, 17 * s); }
        if (night) { ctx.fillStyle = "#fff3b0"; ctx.beginPath(); ctx.arc(x0 + 28 * s, y0 + 9 * s, 3 * s, 0, 7); ctx.fill(); ctx.fillStyle = "#fff"; for (const [a, b] of [[6, 6], [12, 12], [25, 27], [8, 30]]) ctx.fillRect(x0 + a * s, y0 + b * s, s, s); }
        else { const cx = ((this.t * 2) % 40) - 6; ctx.fillStyle = "#fff"; ctx.fillRect(x0 + Math.max(2, cx) * s, y0 + 7 * s, Math.max(0, Math.min(8, 36 - cx)) * s, 3 * s); ctx.fillRect(x0 + Math.max(2, cx + 2) * s, y0 + 5 * s, Math.max(0, Math.min(4, 34 - cx)) * s, 2 * s); }
        ctx.fillStyle = "#fff"; ctx.fillRect(x0 + 18 * s, y0 + 2 * s, 2 * s, 36 * s); ctx.fillRect(x0 + 2 * s, y0 + 19 * s, 34 * s, 2 * s);
      }
      if (this.kind === "lavalamp") {                   // slow blobs going up and down
        ctx.fillStyle = "#ff7bc0"; for (let i = 0; i < 3; i++) { const yy = 15 + Math.sin(this.t * 0.6 + i * 2.1) * 6; ctx.beginPath(); ctx.arc(x0 + (5 + (i % 2) * 2) * s, y0 + yy * s, (1.6 + i * 0.4) * s, 0, 7); ctx.fill(); }
        if (w.isNight()) { const g = ctx.createRadialGradient(this.x, y0 + 15 * s, 0, this.x, y0 + 15 * s, 40 * s); g.addColorStop(0, "rgba(200,110,255,.3)"); g.addColorStop(1, "rgba(200,110,255,0)"); ctx.fillStyle = g; ctx.fillRect(this.x - 40 * s, y0 - 25 * s, 80 * s, 80 * s); }
      }
      if (this.kind === "xmastree") {                   // twinkling lights
        const cols = ["#ff5a6a", "#ffd34d", "#6ad0ff", "#9be59b"], ph = Math.floor(this.t * 2.5);
        [[12, 14], [21, 18], [9, 28], [25, 31], [14, 38], [6, 45], [20, 44], [28, 47], [17, 24]].forEach(([a, b], i) => { ctx.fillStyle = cols[(i + ph) % 4]; ctx.fillRect(x0 + a * s, y0 + b * s, 2 * s, 2 * s); });
      }
      if (this.kind === "arcade") {                    // a little game playing on the screen
        const ph = Math.floor(this.t * 6); ctx.fillStyle = "#1e1e34"; ctx.fillRect(x0 + 3 * s, y0 + 9 * s, 18 * s, 14 * s);
        ctx.fillStyle = "#ffd34d"; ctx.fillRect(x0 + (4 + (ph % 14)) * s, y0 + 18 * s, 2 * s, 2 * s);
        ctx.fillStyle = "#ff6b81"; for (let i = 0; i < 4; i++) ctx.fillRect(x0 + (5 + i * 4) * s, y0 + (11 + ((ph + i) % 2)) * s, 2 * s, s);
        ctx.fillStyle = "#6ad0ff"; ctx.fillRect(x0 + (4 + ((ph * 3) % 15)) * s, y0 + 14 * s, s, s);
      }
      if (this.kind === "feeder" && c > 0) { ctx.fillStyle = Math.sin(this.t * 3) > 0 ? "#4be07a" : "#1f7a3c"; ctx.fillRect(x0 + 16 * s, y0 + 21 * s, s, s); }
      if (this.kind === "radio" && Math.random() < 0.012) w.burst(this.x + 4 * s, this.y - 16 * s, "note", "#b08d57", 1, { rise: true });
      if (this.kind === "fountain") {                   // a little arc of water
        ctx.fillStyle = "#7cc6f2"; const ph = (this.t * 6) % 1;
        for (let i = 0; i < 4; i++) { const k = (i / 4 + ph) % 1, dx = Math.round((k * 7) * s), dy = Math.round((-Math.sin(k * Math.PI) * 4 + k * 9) * s); ctx.fillRect(x0 + 12 * s + dx, y0 + 5 * s + dy, s, s); ctx.fillRect(x0 + 8 * s - dx - s, y0 + 5 * s + dy, s, s); }
      }
      if (this.kind === "litter" && this.item.dirty) {   // needs cleaning
        ctx.fillStyle = "#7a5230"; for (let i = 0; i < Math.min(6, this.item.dirty * 1.5); i++) ctx.fillRect(x0 + (4 + (i * 7) % 22) * s, y0 + (5 + (i % 2)) * s, s * 1.5, s);
        if (this.item.dirty >= 4 && Math.random() < 0.02) w.burst(this.x, this.y - 14 * s, "what", "#7a5230", 1);
      }
      if (this.fish && c > 0) for (const fi of this.fish) {                    // two little fish swimming about
        ctx.fillStyle = fi.c; const fx = x0 + Math.round(fi.x) * s, fy = y0 + Math.round(fi.y) * s;
        ctx.fillRect(fx, fy, 3 * s, 2 * s); ctx.fillRect(fx + (fi.d > 0 ? -s : 3 * s), fy - (Math.sin(this.t * 9) > 0 ? 0 : s / 2), s, 2 * s);
        ctx.fillStyle = "#222"; ctx.fillRect(fx + (fi.d > 0 ? 2 * s : 0), fy, s, s);
      }
      ctx.restore();
    }
  }

  class Shelf {
    constructor(world, x, top) {
      this.world = world; this.x = x; this.top = top; this.held = false;
      this.sp = new Sprite(52, 12);
      this.pal = { 1: { c: [184, 132, 84], lit: true }, 2: { c: [150, 102, 62] }, 3: { c: [126, 86, 52], lit: true } };
    }
    get hw() { return 26 * this.world.toyScale; }
    cap() { return 2; }
    cats() { return this.world.cats.filter((c) => c.perch === this); }
    hit(px, py) { const s = this.world.toyScale; return Math.abs(px - this.x) < this.hw && py > this.top - 2 && py < this.top + 12 * s; }
    grab() { this.held = true; }
    release() { this.held = false; }
    click() {
      const c = this.world.cats.find((c) => !c.perch && ["sit", "walk", "groom"].includes(c.state));
      if (c && this.cats().length < this.cap()) c.set("chase", 12, { goal: "shelf", shelfRef: this });
    }
    update() {
      const w = this.world;
      if (this.held) { this.x = clamp(w.pointer.x, this.hw + 4, w.W - this.hw - 4); this.top = clamp(w.pointer.y - 4, 60, w.floor - 34 * w.toyScale); }
    }
    render(ctx) {
      const w = this.world, s = w.toyScale, R = this.sp.R; R.clear();
      R.rect(0, 0, 52, 4, 1); R.rect(3, 2, 14, 1, 2); R.rect(26, 1, 18, 1, 2);       // plank with grain
      R.tri(7, 4, 13, 4, 7, 11, 3); R.tri(39, 4, 45, 4, 45, 11, 3);                    // brackets
      const img = this.sp.paint(this.pal, [86, 56, 34]);
      ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(img, Math.round(this.x - 26 * s), Math.round(this.top), 52 * s, 12 * s); ctx.restore();
    }
  }

  // A birthday cake with a flickering candle. Click it for more confetti.
  class Cake {
    constructor(world, x, cat) {
      this.world = world; this.x = x; this.cat = cat; this.life = 45; this.t = 0;
      this.sp = new Sprite(22, 20);
      this.pal = { 1: { c: [255, 214, 226], lit: true }, 2: { c: [196, 120, 74], lit: true }, 3: { c: [255, 255, 255], lit: true }, 4: { c: [255, 120, 150] },
        5: { c: [120, 190, 240], lit: true }, 6: { c: [255, 210, 80] }, 7: { c: [255, 150, 60] }, 8: { c: [236, 236, 240], lit: true } };
    }
    hit(px, py) { const s = this.world.toyScale; return Math.abs(px - this.x) < 11 * s && py > this.world.floor - 20 * s && py < this.world.floor + 2; }
    grab() {} release() {}
    click() { this.world.confetti(this.x, this.world.floor - 20 * this.world.toyScale, 24); if (this.cat) this.world.meow(this.cat); }
    update(dt) { this.t += dt; this.life -= dt; if (this.life <= 0) this.world.cakes = this.world.cakes.filter((c) => c !== this); }
    render(ctx) {
      const w = this.world, s = w.toyScale, R = this.sp.R; R.clear();
      R.rect(0, 18, 22, 2, 8);                                                     // plate
      R.rect(3, 11, 16, 7, 2); R.rect(3, 13, 16, 1, 4);                            // sponge with jam
      R.rect(3, 9, 16, 3, 1); for (const x of [5, 9, 13, 16]) R.rect(x, 12, 1, 1 + (x % 3), 1);   // pink icing + drips
      for (const x of [5, 8, 11, 14, 17]) R.put(x, 9, 3);                          // white piping
      R.rect(10, 3, 2, 6, 5); R.put(10, 4, 3); R.put(11, 6, 3);                    // striped candle
      const fl = Math.sin(this.t * 22) > 0;
      R.put(10.5, 1, 6); R.put(10.5, 2, 7); if (fl) R.put(10.5, 0, 6); else R.put(11.5, 1, 6);
      const img = this.sp.paint(this.pal, [110, 62, 50]);
      ctx.save(); ctx.globalAlpha = Math.min(1, this.life / 2);
      ctx.save(); ctx.globalAlpha *= 0.2; ctx.fillStyle = "#000"; ctx.beginPath(); ctx.ellipse(this.x, w.floor + s, 12 * s, 1.6 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      const glow = ctx.createRadialGradient(this.x, w.floor - 19 * s, 0, this.x, w.floor - 19 * s, 8 * s);
      glow.addColorStop(0, "rgba(255,210,80,.45)"); glow.addColorStop(1, "rgba(255,210,80,0)"); ctx.fillStyle = glow; ctx.fillRect(this.x - 8 * s, w.floor - 27 * s, 16 * s, 16 * s);
      ctx.imageSmoothingEnabled = false; ctx.drawImage(img, Math.round(this.x - 11 * s), Math.round(w.floor - 20 * s), 22 * s, 20 * s); ctx.restore();
    }
  }

  // ---------------------------------------------------------------- pixel glyphs for particles
  const GLYPH = {
    heart: ["01100110", "11111111", "11111111", "01111110", "00111100", "00011000"],
    what: ["0110", "1001", "0001", "0010", "0100", "0000", "0100"],
    sick: ["0110", "1111", "1011", "1111", "0110"],
    sad: ["01100110", "11101111", "11011111", "01101110", "00110100", "00011000"],
    z: ["11111", "00010", "00100", "01000", "11111"],
    spark: ["00100", "00100", "11011", "00100", "00100"],
    dust: ["0110", "1111", "0110"],
    note: ["00110", "00101", "00100", "11100", "11100"],
    crumb: ["11", "11"],
    confetti: ["11", "11"],
  };

  class World {
    constructor(canvas, opts = {}) {
      World.current = this;                         // handy for poking at the cats from the devtools console
      this.canvas = canvas; this.ctx = canvas.getContext("2d");
      this.scale = opts.scale || 3; this.toyScale = opts.toyScale || this.scale; this.cats = []; this.yarn = null; this.mouse = null; this.boxes = []; this.bowl = null; this.laser = false; this.parts = [];
      this.wand = null; this.butterfly = null; this.catnip = null; this.catnipId = 0; this.bed = null; this.post = null;
      this.shelves = []; this.cakes = []; this.purrOn = opts.purrOn ?? true; this.meowOn = opts.meowOn ?? true; this.nightMode = opts.nightMode || "auto"; this.seasonsOn = opts.seasonsOn ?? true;
      this.birds = []; this.birdT = rnd(40, 120); this.critters = []; this.critterT = rnd(120, 400); this.shouts = []; this.sky = []; this.cloudT = rnd(25, 70); this.starT = rnd(20, 60); this.cloudImgs = new Map(); this.birdsOn = opts.birdsOn ?? true; this.furniture = [];
      this.strayOn = opts.strayOn ?? true; this.strayT = rnd(600, 1500); this.game = null;
      this.pointer = { x: -1e4, y: -1e4, seen: false }; this.drag = null; this.onHover = opts.onHover || (() => {});
      this.floorInset = opts.floorInset ?? 6; this.audio = null; this.last = performance.now();
      this.resize(); addEventListener("resize", () => this.resize());
      this.bindInput();
      requestAnimationFrame((t) => this.frame(t));
    }
    stray() { return this.cats.find((c) => c.stray); }
    // a lonely cat packs up: it walks slowly to the nearest edge and is gone (unless you win it back on the way)
    catLeaves(c) {
      if (c.leaving) return;
      const m = SW * c.s / 2; c.leaving = c.x < this.W / 2 ? m : this.W - m;
      if (c.perch) c.hopDown && c.hopDown();
      c.set("walk", 60, { target: c.leaving }); this.burst(c.x, c.y - 34 * c.s, "sad", "#7d8fb3", 2);
    }
    addStray() {
      if (this.stray()) return this.stray();
      const side = Math.random() < 0.5 ? -1 : 1, coat = COAT_KEYS[Math.floor(Math.random() * COAT_KEYS.length)];
      const c = new Cat(this, coat, side < 0 ? 30 : this.W - 30);
      c.stray = { trust: 0, life: rnd(420, 600), side, home: rnd(this.W * 0.2, this.W * 0.8) }; c.size = 0.8;
      c.y = this.floor; c.set("walk", 20, { target: c.stray.home }); this.cats.push(c);
      return c;
    }
    // fed three times and it's yours
    strayFed(c) {
      const st = c.stray; st.trust++; st.life = Math.max(st.life, 360); st.leaving = false;
      this.burst(c.x, c.y - 34 * c.s, "heart", "#e2557a", 2 + st.trust);
      if (st.trust >= 3) { c.stray = null; c.size = 1; this.confetti(c.x, c.y - 30 * c.s, 30); this.meow(c); if (this.onAdoptStray) this.onAdoptStray(c); }
    }
    // ---------------- laser mini game: lead the cats onto the twinkling stars with the laser, 30 seconds
    startGame() {
      if (this.game) return;
      this.game = { t: 30, score: 0, targets: [], spawnT: 0 }; this.setLaser(true); this.setWand(false);
    }
    stopGame(silent) {
      const g = this.game; if (!g) return; this.game = null; this.setLaser(false);
      if (!silent && this.onGameEnd) this.onGameEnd(g.score);
    }
    updateGame(dt) {
      const g = this.game; if (!g) return;
      const ts = this.toyScale; g.t -= dt; g.spawnT -= dt;
      if (g.t <= 0) return this.stopGame();
      g.targets.forEach((t) => (t.life -= dt)); g.targets = g.targets.filter((t) => t.life > 0);
      if (g.targets.length < (g.t < 15 ? 2 : 1) && g.spawnT <= 0) { g.targets.push({ x: this.spot(), life: rnd(5, 8), ph: rnd(0, 6) }); g.spawnT = 0.6; }
      for (const c of this.cats) {
        if (!["chase", "leap", "hunt", "stand"].includes(c.state)) continue;
        const px = c.x + c.facing * 12 * c.s;
        const hit = g.targets.find((t) => Math.abs(t.x - px) < 16 * ts && c.y > this.floor - 40 * c.s);
        if (hit) {
          g.score++; g.targets = g.targets.filter((t) => t !== hit);
          this.burst(hit.x, this.floor - 10 * ts, "spark", "#ffd34d", 5); this.burst(c.x, c.y - 34 * c.s, "heart", "#e2557a", 1);
          if (c.profile) c.care("play", { toyKey: "laser" });
        }
      }
    }
    renderGame(ctx, now) {
      const g = this.game; if (!g) return;
      const ts = this.toyScale, L = window.CatLife;
      for (const t of g.targets) {                              // twinkling stars on the floor
        const k = Math.max(2, Math.round(ts)), pulse = 1 + Math.sin(now / 160 + t.ph) * 0.25, x = Math.round(t.x), y = Math.round(this.floor - 10 * ts);
        ctx.save(); ctx.globalAlpha = Math.min(1, t.life * 2); ctx.fillStyle = "#ffd34d";
        const r = Math.round(3 * pulse); ctx.fillRect(x - k / 2, y - r * k, k, (2 * r + 1) * k); ctx.fillRect(x - r * k, y - k / 2, (2 * r + 1) * k, k);
        ctx.fillStyle = "#fff6c8"; ctx.fillRect(x - k / 2, y - k / 2, k, k); ctx.restore();
      }
      const label = L ? L.t("gameHud")(Math.ceil(g.t), g.score) : `🔴 ${Math.ceil(g.t)}s · ⭐ ${g.score}`;
      ctx.save(); ctx.font = '700 20px "Pixelify Sans", ui-monospace, monospace'; const wd = ctx.measureText(label).width + 36, x0 = Math.round(this.W / 2 - wd / 2), y0 = 18;
      ctx.fillStyle = "rgba(255,247,236,.96)"; ctx.strokeStyle = "#5b3a29"; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(x0, y0, wd, 40, 20); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#5b3a29"; ctx.textBaseline = "middle"; ctx.textAlign = "center"; ctx.fillText(label, this.W / 2, y0 + 21); ctx.restore();
    }
    landedBird() { return this.birds.find((b) => b.state === "peck"); }
    // ---------------- 🌳 the cat park: the home things are put away, a park appears along the floor, strange cats wander about
    enterPark(ids, nStrangers = 4) {
      if (this.park) return;
      const going = new Set(ids);
      this.park = { stash: { furniture: this.furniture, platforms: this.shelves.filter((s) => s.isPlatform), bowl: this.bowl }, npcs: [], img: null, socialT: 3 };
      this.furniture = []; this.shelves = this.shelves.filter((s) => !s.isPlatform); this.bowl = null;
      this.cats.forEach((c) => { c.cushion = null; c.perch = null; if (c.profile && !going.has(c.profile.id)) c.parkAway = true; else if (c.profile) { c.y = this.floor; c.set("walk", 4, { target: rnd(this.W * 0.15, this.W * 0.85) }); } });
      for (let i = 0; i < nStrangers; i++) { const c = this.addCat(COAT_KEYS[Math.floor(Math.random() * 17)]); c.npc = true; c.x = Math.random() < 0.5 ? -60 : this.W + 60; c.set("walk", 8, { target: rnd(this.W * 0.1, this.W * 0.9) }); this.park.npcs.push(c); }
    }
    exitPark() {
      const P = this.park; if (!P) return;
      P.npcs.forEach((c) => this.removeCat(c));
      this.furniture = P.stash.furniture; this.shelves.push(...P.stash.platforms); this.bowl = P.stash.bowl;
      this.cats.forEach((c) => { c.parkAway = false; c.perch = null; c.y = this.floor; if (c.state !== "held") c.set("sit", 1); });
      this.park = null;
    }
    // now and then two cats in the park meet: a sniff, a boop, a little play
    parkSocial(dt) {
      const P = this.park; if (!P) return; P.socialT -= dt; if (P.socialT > 0) return; P.socialT = rnd(4, 9);
      const here = this.cats.filter((c) => !c.parkAway && !["held", "fall", "leap", "zoom"].includes(c.state));
      if (here.length < 2) return;
      const a = here[Math.floor(Math.random() * here.length)], b = here.filter((c) => c !== a).sort((x, y) => Math.abs(x.x - a.x) - Math.abs(y.x - a.x))[0];
      const mid = (a.x + b.x) / 2, gap = 16 * a.s;
      a.set("walk", 3, { target: mid - gap }); b.set("walk", 3, { target: mid + gap });
      setTimeout(() => { if (!this.park) return; a.facing = 1; b.facing = -1; const play = Math.random() < 0.35; a.set(play ? "playBow" : "boop", 1.6); b.set(play ? "pronk" : "boop", 1.6); this.burst(mid, this.floor - 34 * a.s, "heart", "#e2557a", 3); if (this.onSocial) this.onSocial(a, b); }, 2600);
    }
    renderPark(ctx) {
      const P = this.park, W = this.W, H = this.H, k = Math.max(2, Math.round(this.toyScale)), f = this.floor;
      if (!P.img || P.img.width !== W || P.imgF !== f) {
        const c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d"); P.img = c; P.imgF = f;
        const px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
        // a soft green glow behind, then the fence, trees, bench, lamp, pond and flowers
        const gr = g.createLinearGradient(0, f - 260, 0, f); gr.addColorStop(0, "rgba(170,225,160,0)"); gr.addColorStop(1, "rgba(150,210,130,.55)"); g.fillStyle = gr; g.fillRect(0, f - 260, W, 260);
        for (let x = 0; x < W; x += 14 * k) { px(x, f - 26 * k, 3 * k, 24 * k, "#e8d6b8"); px(x, f - 28 * k, 3 * k, 2 * k, "#c9b08a"); }
        px(0, f - 20 * k, W, 2 * k, "#d9c29c"); px(0, f - 12 * k, W, 2 * k, "#d9c29c");
        // pixel-art trees: a lumpy canopy lit from the top left, a dark outline, a few leaf clusters, a trunk with bark and roots
        const tree = (x, sz, seed) => { const t = parkTree(seed), m = Math.max(2, Math.round(k * sz)); g.imageSmoothingEnabled = false; g.drawImage(t, Math.round(x - (t.width * m) / 2), Math.round(f - t.height * m + m), t.width * m, t.height * m); };
        for (const [x, sz, seed] of [[0.06, 1.25, 1], [0.27, 0.95, 2], [0.52, 1.35, 3], [0.76, 1.05, 4], [0.95, 1.2, 5]]) tree(W * x, sz, seed);
        const bx = W * 0.38; px(bx, f - 14 * k, 34 * k, 3 * k, "#b07a48"); px(bx, f - 22 * k, 34 * k, 3 * k, "#b07a48"); px(bx + 2 * k, f - 11 * k, 2 * k, 11 * k, "#5b3a29"); px(bx + 30 * k, f - 11 * k, 2 * k, 11 * k, "#5b3a29");
        const lx = W * 0.64; px(lx, f - 60 * k, 2 * k, 60 * k, "#3d4256"); px(lx - 3 * k, f - 66 * k, 8 * k, 6 * k, "#3d4256"); px(lx - 2 * k, f - 65 * k, 6 * k, 4 * k, "#ffe9a0");
        const pdx = W * 0.85; g.fillStyle = "#7cc8ec"; g.beginPath(); g.ellipse(pdx, f - 2 * k, 30 * k, 5 * k, 0, 0, 7); g.fill(); g.fillStyle = "#b8e6f8"; g.fillRect(pdx - 12 * k, f - 4 * k, 8 * k, k);
        for (let i = 0; i < W / (9 * k); i++) { const x = i * 9 * k + ((i * 37) % 7) * k, col = ["#ff8fab", "#ffd34d", "#ffffff", "#c8a0ff"][i % 4]; if (Math.abs(x - pdx) < 34 * k) continue; px(x, f - 6 * k, k, 5 * k, "#4f9a45"); px(x - k, f - 8 * k, 3 * k, 2 * k, col); }
        px(0, f - 2 * k, W, H - f + 2 * k, "#8fcf6b"); for (let x = 0; x < W; x += 5 * k) px(x + ((x / k) % 3) * k, f - 3 * k, k, 2 * k, "#6fb855");
      }
      ctx.drawImage(P.img, 0, 0);
    }
    shout(x, y, txt) { this.shouts.push({ x: clamp(x, 60, this.W - 60), y, txt, t: 0 }); }
    addCritter(kind) {
      const night = this.isNight(), k = kind || (night ? "hedgehog" : Math.random() < 0.55 ? "squirrel" : "butterflies");
      const c = new Critter(this, k, Math.random() < 0.5 ? 1 : -1); this.critters.push(c); if (this.onCritterSeen) this.onCritterSeen(k); return c;
    }
    addBird(o = {}) {
      const dir = Math.random() < 0.5 ? 1 : -1, n = o.n || (Math.random() < 0.35 ? rnd(2, 4) | 0 : 1), y = this.floor - rnd(200, Math.min(520, this.floor - 60));
      for (let i = 0; i < n; i++) { const b = new Bird(this, dir, y + rnd(-30, 30), i === 0 && (o.land ?? Math.random() < 0.3)); b.x -= dir * i * rnd(30, 60); this.birds.push(b); }
    }
    placeFurniture(kind, x, item) {
      const f = new Furniture(this, kind, x ?? this.spot(), item); this.furniture.push(f);
      if (f.platforms) this.shelves.push(...f.platforms);
      this.furniture.sort((a, b) => (a.kind === "rug" ? -1 : 0) - (b.kind === "rug" ? -1 : 0));
      return f;
    }
    removeFurniture(kind) {
      const f = typeof kind === "string" ? [...this.furniture].reverse().find((f) => f.kind === kind) : kind; if (!f) return;
      if (f.platforms) { this.shelves = this.shelves.filter((s) => !f.platforms.includes(s)); this.cats.forEach((c) => { if (f.platforms.includes(c.perch)) { c.perch = null; c.set("fall", 5); } }); }
      this.cats.forEach((c) => { if (c.cushion === f) { c.cushion = null; c.set("sit", 2); } });
      this.furniture = this.furniture.filter((x) => x !== f);
    }
    idleFor() { return this.pointer.movedAt ? (performance.now() - this.pointer.movedAt) / 1000 : 0; }
    // back at the computer after a while (or the app just opened after hours away): the cats come to say hello
    greet(long = false, kind = "greet") {
      const p = this.pointer, tx = p.x > 0 ? p.x : this.W / 2;
      this.cats.forEach((c, i) => {
        if (["held", "fall", "inbox"].includes(c.state)) return;
        setTimeout(() => {
          if (!this.cats.includes(c)) return;
          if (c.state === "sleep" || c.state === "knead") c.set("stretch", 1.4);
          else { c.napOff = (i - (this.cats.length - 1) / 2) * 40 * c.s / 3 * 2; c.goal = null; c.set("chase", 8, { goal: "you" }); }
          setTimeout(() => { if (this.cats.includes(c) && !["held", "fall", "inbox", "leap", "pronk"].includes(c.state)) { c.facing = Math.sign(tx - c.x) || c.facing; c.set(long ? "happy" : "slowBlink", long ? 3 : 3.4); } }, 1800 + i * 300);
          c.care(kind, { long });
        }, i * 350);
      });
      if (this.cats[0]) setTimeout(() => this.meow(this.cats[0]), 900);
    }
    resize() { this.W = innerWidth; this.H = innerHeight; this.canvas.width = this.W; this.canvas.height = this.H; this.canvas.style.width = this.W + "px"; this.canvas.style.height = this.H + "px"; this.floor = this.H - this.floorInset; }
    spot() { return rnd(this.W * 0.15, this.W * 0.85); }
    addCat(coat, profile) {
      coat = profile ? profile.coat : coat && COATS[coat] ? coat : COAT_KEYS[Math.floor(Math.random() * COAT_KEYS.length)];
      const c = new Cat(this, coat, this.spot());
      if (profile) {
        c.profile = profile;
        if (window.CatLife) { if (!profile.genes) profile.genes = window.CatLife.rollGenes([30, 70]); c.mods = window.CatLife.mods(profile); c.size = window.CatLife.size(profile); }
        if (profile.genes) c.P = buildPalette(c.coat, profile.genes);
      }
      c.y = -60; c.set("fall", 5); c.vx = 0; this.cats.push(c); return c;
    }
    removeCat(cat) {
      const i = cat ? this.cats.indexOf(cat) : this.cats.length - 1; if (i < 0) return;
      const c = this.cats.splice(i, 1)[0]; if (c && c.box) c.box.occupant = null; if (c && c.bed) c.bed.occupant = null; if (this.post && this.post.user === c) this.post.user = null; }
    throwYarn(x, y) {
      if (this.yarn && this.yarn.held) return;          // never snatch the yarn out of your hand
      this.yarn = new Yarn(this, x ?? this.spot(), y ?? this.floor - 260);
      this.yarn.vy = -200; this.yarn.vx = rnd(-360, 360); this.yarn.cats("yarn");
    }
    addMouse() { this.mouse = new WindupMouse(this, this.spot()); this.mouse.click(); }
    addBox() { if (this.boxes.length >= 3) this.boxes.shift(); const b = new Box(this, this.spot()); b.y = this.floor - 200; this.boxes.push(b); }
    // the bowl lives in your inventory: take it out first, then fill it; put it away and it's gone from the floor
    feed() { if (!this.bowl) { if (this.onNoBowl) { this.onNoBowl(); return false; } this.bowl = new Bowl(this, this.spot()); } this.bowl.fill(false); return true; }
    placeBowl(x, food) { if (!this.bowl) { this.bowl = new Bowl(this, x ?? this.spot()); this.bowl.food = food || 0; this.burst(this.bowl.x, this.floor - 10 * this.toyScale, "dust", "rgba(140,120,100,.6)", 3); } return this.bowl; }
    storeBowl() { const b = this.bowl; if (!b) return 0; this.bowl = null; this.cats.forEach((c) => { if (c.state === "eat" || c.goal === "bowl") c.set("sit", 1.5); }); return b.food; }
    setLaser(on) {
      this.laser = on ?? !this.laser;
      if (this.laser && this.wand) this.setWand(false);
      if (!this.laser) this.cats.forEach((c) => { if (c.goal === "laser") c.set("sit", 2, { goal: null }); });
      return this.laser;
    }
    setWand(on) {
      const v = on ?? !this.wand;
      if (v && !this.wand) { this.wand = new Wand(this); if (this.laser) this.setLaser(false); }
      if (!v && this.wand) { this.wand = null; this.cats.forEach((c) => { if (c.goal === "feather") c.set("sit", 2, { goal: null }); }); }
      return !!this.wand;
    }
    addButterfly() { this.butterfly = new Butterfly(this); }
    addShelf() { const real = this.shelves.filter((s) => !s.isPlatform); if (real.length >= 3) this.shelves = this.shelves.filter((s) => s !== real[0]); this.shelves.push(new Shelf(this, this.spot(), this.floor - rnd(110, 170) * this.toyScale)); }
    removeAllCats() { [...this.cats].forEach((c) => this.removeCat(c)); }
    // "auto" follows the clock: from 22:00 to 07:00 it's night and the cats get sleepy
    isNight() { if (this.nightMode === "night") return true; if (this.nightMode === "day") return false; const h = new Date().getHours(); return h >= 22 || h < 7; }
    confetti(x, y, n = 36) {
      const cols = ["#ff6f91", "#ffd34d", "#6fd3a8", "#7fb6ff", "#c58ae8", "#ff9f5a"];
      for (let i = 0; i < n; i++) this.parts.push({ x, y, vx: rnd(-170, 170), vy: rnd(-380, -150), life: rnd(1.6, 2.4), age: 0, kind: "confetti", color: cols[i % cols.length] });
    }
    celebrate(cat) {
      const s = cat.s, x = clamp(cat.x + (cat.facing || 1) * 26 * s, 30, this.W - 30);
      this.cakes.push(new Cake(this, x, cat));
      cat.partyT = 45; cat.facing = Math.sign(x - cat.x) || cat.facing;
      if (!["held", "fall", "leap", "inbox"].includes(cat.state) && !cat.bed && !cat.perch) cat.set("happy", 4, { eyes: null });
      this.confetti(cat.x, cat.y - 30 * s); setTimeout(() => this.confetti(x, this.floor - 20 * this.toyScale, 20), 700);
      this.meow(cat); setTimeout(() => this.meow(cat), 900);
    }
    dropCatnip() { this.catnip = new Catnip(this, this.spot(), ++this.catnipId); }
    addBed() { if (!this.bed) this.bed = new Bed(this, this.spot()); else this.bed.click(); }
    addPost() { if (!this.post) this.post = new Post(this, this.spot()); else this.post.click(); }
    clearToys() {
      this.yarn = null; this.mouse = null; this.bowl = null; this.setLaser(false); this.setWand(false);
      this.butterfly = null; this.catnip = null;
      if (this.bed && this.bed.occupant) this.bed.occupant.set("sit", 2); this.bed = null;
      if (this.post && this.post.user) this.post.user.set("sit", 2); this.post = null;
      this.shelves = this.shelves.filter((s) => s.isPlatform); this.cakes = [];
      this.boxes.forEach((b) => { if (b.occupant) b.occupant.hopOut(); }); this.boxes = [];
    }
    burst(x, y, kind, color, n = 1, o = {}) {
      for (let i = 0; i < n; i++) this.parts.push({ x: x + rnd(-8, 8) * this.scale, y, vx: rnd(-30, 30), vy: o.rise ? -28 : rnd(-90, -40), life: kind === "z" ? 2.2 : 1.1, age: 0, kind, color });
    }
    // a soft synthesised meow: a buzzy voice with a little vibrato, shaped by three "mouth" formants
    // sliding from "mee" through "aa" to "ow", plus a breath of air. Kittens are higher and shorter.
    // real recordings, if you've added some: one set for kittens, one for grown-ups, one for wise old cats
    async setVoices(group, files) {
      this.audio = this.audio || new (window.AudioContext || window.webkitAudioContext)();
      const out = [];
      for (const f of files) { try { out.push(await this.audio.decodeAudioData(f.slice(0))); } catch {} }
      this.voices = this.voices || {}; this.voices[group] = out;
      return out.length;
    }
    voiceGroup(cat) {
      const L = window.CatLife, p = cat && cat.profile;
      if (L && p) { const st = L.stage(p).id; return st === "kitten" ? "kitten" : st === "elder" ? "elder" : "adult"; }
      return cat && cat.size < 0.6 ? "kitten" : "adult";
    }
    playVoice(cat) {
      const V = this.voices || {}, g = this.voiceGroup(cat);
      // missing a set? borrow a neighbour's and shift the pitch: kittens higher, old cats a little lower
      const order = { kitten: [["kitten", 1], ["adult", 1.3], ["elder", 1.45]], adult: [["adult", 1], ["kitten", 0.8], ["elder", 1.12]], elder: [["elder", 1], ["adult", 0.88], ["kitten", 0.7]] }[g];
      const hit = order.find(([k]) => V[k] && V[k].length); if (!hit) return false;
      const ac = this.audio, list = V[hit[0]], buf = list[Math.floor(Math.random() * list.length)];
      const src = ac.createBufferSource(), gain = ac.createGain();
      src.buffer = buf; src.playbackRate.value = hit[1] * rnd(0.95, 1.06);       // every meow a little different
      gain.gain.value = 0.55; src.connect(gain); gain.connect(ac.destination); src.start();
      return true;
    }
    meow(cat) {
      if (!this.meowOn) return;
      try { if (this.playVoice(cat)) return; } catch {}
      try {
        this.audio = this.audio || new (window.AudioContext || window.webkitAudioContext)();
        const ac = this.audio, t0 = ac.currentTime + 0.02, kit = cat && cat.size < 0.8;
        const dur = rnd(0.5, 0.78) * (kit ? 0.78 : 1), base = (kit ? 800 : 540) * rnd(0.9, 1.12), end = t0 + dur;
        const out = ac.createGain(); out.gain.value = 0.0001;
        const o1 = ac.createOscillator(), o2 = ac.createOscillator(); o1.type = "sawtooth"; o2.type = "triangle";
        const lfo = ac.createOscillator(), lfoG = ac.createGain(); lfo.frequency.value = rnd(5, 7); lfoG.gain.value = base * 0.018;
        lfo.connect(lfoG); lfoG.connect(o1.frequency); lfoG.connect(o2.frequency);
        for (const o of [o1, o2]) {
          o.frequency.setValueAtTime(base * 0.82, t0);
          o.frequency.exponentialRampToValueAtTime(base * 1.14, t0 + dur * 0.32);
          o.frequency.exponentialRampToValueAtTime(base * 1.02, t0 + dur * 0.58);
          o.frequency.exponentialRampToValueAtTime(base * 0.6, end);
        }
        const src = ac.createGain(), g2 = ac.createGain(); g2.gain.value = 0.7; o1.connect(src); o2.connect(g2).connect(src);
        const soft = ac.createBiquadFilter(); soft.type = "lowpass"; soft.frequency.value = 3600; soft.Q.value = 0.4; src.connect(soft);
        [[380, 980, 540, 8, 1], [2300, 1600, 950, 10, 0.5], [3200, 2750, 2450, 12, 0.22]].forEach(([a, b, c, Q, gain]) => {
          const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = Q;
          bp.frequency.setValueAtTime(a, t0); bp.frequency.linearRampToValueAtTime(b, t0 + dur * 0.42); bp.frequency.linearRampToValueAtTime(c, end);
          const g = ac.createGain(); g.gain.value = gain * 2.6; soft.connect(bp).connect(g).connect(out);
        });
        const nb = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate), nd = nb.getChannelData(0);
        for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
        const ns = ac.createBufferSource(), nf = ac.createBiquadFilter(), ng = ac.createGain();
        ns.buffer = nb; nf.type = "bandpass"; nf.frequency.value = 2600; nf.Q.value = 0.8; ng.gain.value = 0.05; ns.connect(nf).connect(ng).connect(out);
        const hp = ac.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 260;
        out.connect(hp).connect(ac.destination);
        const peak = (kit ? 0.07 : 0.1) * (this.volume ?? 1);          // gentle: about as present as the purr
        out.gain.setValueAtTime(0.0001, t0); out.gain.exponentialRampToValueAtTime(peak, t0 + 0.08);
        out.gain.setValueAtTime(peak, t0 + dur * 0.45); out.gain.exponentialRampToValueAtTime(0.0001, end);
        for (const o of [o1, o2, lfo]) { o.start(t0); o.stop(end + 0.05); }
        ns.start(t0); ns.stop(end);
        if (cat) this.burst(cat.x + cat.facing * 12 * cat.s, cat.y - 30 * cat.s, "note", "#b08d57", 1);
      } catch {}
    }
    purr() {
      if (!this.purrOn) return;
      // your own purr recordings, if there are any
      const V = (this.voices || {}).purr;
      if (V && V.length) { try { const ac = this.audio, src = ac.createBufferSource(), g = ac.createGain(); src.buffer = V[Math.floor(Math.random() * V.length)]; src.playbackRate.value = rnd(0.96, 1.04); g.gain.value = 0.6; src.connect(g); g.connect(ac.destination); src.start(); return; } catch {} }
      try {
        this.audio = this.audio || new (window.AudioContext || window.webkitAudioContext)();
        const ac = this.audio, t0 = ac.currentTime, len = 1.4;
        const buf = ac.createBuffer(1, ac.sampleRate * len, ac.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) { const t = i / ac.sampleRate; d[i] = (Math.random() * 2 - 1) * (0.5 + 0.5 * Math.sin(t * 2 * Math.PI * 24)) * Math.sin(Math.PI * t / len); }
        const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
        src.buffer = buf; f.type = "lowpass"; f.frequency.value = 220; g.gain.value = 0.35;
        src.connect(f).connect(g).connect(ac.destination); src.start(t0);
      } catch {}
    }
    hitTest(x, y) {
      if (this.yarn && this.yarn.hit(x, y)) return { toy: this.yarn };
      if (this.mouse && this.mouse.hit(x, y)) return { toy: this.mouse };
      if (this.butterfly && this.butterfly.hit(x, y)) return { toy: this.butterfly };
      if (this.bowl && this.bowl.hit(x, y)) return { toy: this.bowl };              // before the cats crowding round it
      for (let i = this.cats.length - 1; i >= 0; i--) if (this.cats[i].hit(x, y)) return { cat: this.cats[i] };
      for (let i = this.boxes.length - 1; i >= 0; i--) if (this.boxes[i].hit(x, y)) return { toy: this.boxes[i] };
      if (this.bowl && this.bowl.hit(x, y)) return { toy: this.bowl };
      if (this.catnip && this.catnip.hit(x, y)) return { toy: this.catnip };
      if (this.bed && this.bed.hit(x, y)) return { toy: this.bed };
      if (this.post && this.post.hit(x, y)) return { toy: this.post };
      for (const c of this.cakes) if (c.hit(x, y)) return { toy: c };
      for (let i = this.shelves.length - 1; i >= 0; i--) if (this.shelves[i].hit(x, y)) return { toy: this.shelves[i] };
      for (let i = this.furniture.length - 1; i >= 0; i--) if (this.furniture[i].hit(x, y)) return { toy: this.furniture[i] };
      return null;
    }
    bindInput() {
      this.trace = [];
      const pos = (e) => {
        const now = performance.now();
        this.pointer.x = e.clientX; this.pointer.y = e.clientY; this.pointer.seen = true; this.pointer.movedAt = now;
        this.trace.push([now, e.clientX, e.clientY]); while (this.trace.length && now - this.trace[0][0] > 120) this.trace.shift();
      };
      // how fast the pointer was moving just before it let go (px/s)
      this.pointerVel = () => {
        const now = performance.now(), t = this.trace.filter((p) => now - p[0] < 120);
        if (t.length < 2 || now - t[t.length - 1][0] > 80) return { x: 0, y: 0 };
        const a = t[0], b = t[t.length - 1], dt = Math.max(0.016, (b[0] - a[0]) / 1000);
        return { x: (b[1] - a[1]) / dt, y: (b[2] - a[2]) / dt };
      };
      addEventListener("pointermove", (e) => {
        const away = this.idleFor();
        pos(e); const d = this.drag;
        if (away > 480 && this.cats.length) this.greet(away > 3600);
        if (d && !d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 6) {
          d.moved = true;
          if (d.cat) { d.cat.set("held", 1e9); d.cat.care("held"); if (Math.random() < 0.5) this.meow(d.cat); }
          if (d.toy && d.toy !== this.yarn) d.toy.grab();
        }
        this.onHover(!!d || !!this.hitTest(e.clientX, e.clientY));
      });
      addEventListener("pointerdown", (e) => {
        pos(e); if (e.button !== 0) return;
        const h = this.hitTest(e.clientX, e.clientY); if (!h) return;
        this.drag = { ...h, sx: e.clientX, sy: e.clientY, moved: false };
        if (h.toy === this.yarn) this.yarn.grab();               // the yarn sticks to the pointer straight away
        try { e.target.setPointerCapture?.(e.pointerId); } catch {}
      });
      addEventListener("pointerup", (e) => {
        pos(e); const d = this.drag; this.drag = null; if (!d) return;
        const v = this.pointerVel();
        if (d.cat) { if (!d.moved) d.cat.pet(); else { d.cat.set("fall", 5); d.cat.vx = clamp(v.x * 0.35, -500, 500); d.cat.vy = clamp(v.y * 0.35, -500, 300); } }
        if (d.toy) {
          if (d.toy === this.yarn) { if (d.moved) d.toy.release(v); else { d.toy.held = false; d.toy.click(); } }
          else if (d.moved) d.toy.release(v); else d.toy.click();
        }
        this.onHover(!!this.hitTest(e.clientX, e.clientY));
      });
      addEventListener("pointerleave", () => { this.pointer.seen = false; });
      addEventListener("blur", () => { const d = this.drag; if (!d) return; if (d.cat) d.cat.set("fall", 5); if (d.toy && d.toy.release) d.toy.release(); this.drag = null; });
    }
    frame(now) {
      const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
      const ctx = this.ctx; ctx.clearRect(0, 0, this.W, this.H);
      if (this.yarn) this.yarn.update(dt);
      if (this.mouse) this.mouse.update(dt);
      if (this.bowl) this.bowl.update(dt);
      this.boxes.forEach((b) => b.update(dt));
      for (const t of [this.wand, this.butterfly, this.catnip, this.bed, this.post, ...this.shelves, ...this.cakes, ...this.furniture]) if (t) t.update(dt);
      if (this.birdsOn && !(this.weather && ["rain", "storm", "snow"].includes(this.weather.kind))) { this.birdT -= dt; if (this.birdT <= 0) { this.addBird(); this.birdT = this.isNight() ? rnd(500, 1200) : rnd(150, 420); } }
      this.birds.forEach((b) => b.update(dt)); this.birds = this.birds.filter((b) => !b.gone());
      // 🐿️ visitors: a squirrel, a hedgehog (at night) or a few butterflies wander past now and then
      if (this.birdsOn) { this.critterT -= dt; if (this.critterT <= 0) { this.critterT = rnd(360, 900); this.addCritter(); } }
      this.critters.forEach((c) => c.update(dt)); this.critters = this.critters.filter((c) => !c.gone());
      this.shouts = this.shouts.filter((x) => (x.t += dt) < 1.6);
      if (this.park) this.parkSocial(dt);
      this.updateGame(dt);
      if (this.strayOn && !this.isNight() && !this.stray()) { this.strayT -= dt; if (this.strayT <= 0) { this.strayT = rnd(1200, 2700); if (this.cats.filter((c) => c.profile).length < 8) this.addStray(); } }
      this.cats.forEach((c) => c.update(dt));
      if (this.isNight()) this.renderNight(ctx, now);
      this.renderSky(ctx, dt);
      if (this.seasonsOn !== false) this.renderSeason(ctx, dt, now); else if (this.renderWeather(ctx, dt, now) === false && this.seasonOverride === "winter") this.seasonOverride = null;   // real weather shows even with the seasons off
      if (this.park) this.renderPark(ctx);
      this.furniture.forEach((f) => f.render(ctx));
      if (this.post) this.post.render(ctx);
      this.shelves.forEach((sh) => sh.render(ctx));
      this.cakes.forEach((c) => c.render(ctx));
      if (this.bowl) this.bowl.render(ctx);
      if (this.bed) { this.bed.renderBack(ctx); if (this.bed.occupant) this.bed.occupant.render(ctx); this.bed.renderFront(ctx); }
      this.boxes.forEach((b) => { if (b.occupant) b.occupant.render(ctx); b.render(ctx); });
      if (this.catnip) this.catnip.render(ctx);
      if (this.mouse) this.mouse.render(ctx);
      if (this.yarn && !this.yarn.held) this.yarn.render(ctx);
      [...this.cats].filter((c) => c.state !== "inbox" && !c.bed).sort((a, b) => (a.state === "held") - (b.state === "held")).forEach((c) => c.render(ctx));
      if (this.yarn && this.yarn.held) this.yarn.render(ctx);
      if (this.butterfly) this.butterfly.render(ctx);
      this.birds.forEach((b) => b.render(ctx));
      this.critters.forEach((c) => c.render(ctx));
      for (const x of this.shouts) {                     // a roar, in big bouncy letters
        const a = Math.min(1, 1.6 - x.t), k = 1 + Math.sin(Math.min(1, x.t * 4) * Math.PI) * 0.25, fs = Math.round(clamp(14 + this.scale * 5, 18, 40) * k);
        ctx.save(); ctx.globalAlpha = a; ctx.font = `700 ${fs}px "Pixelify Sans", monospace`; ctx.textAlign = "center"; ctx.lineWidth = 5; ctx.strokeStyle = "#5b3a29"; ctx.fillStyle = "#ffd34d";
        const y = x.y - x.t * 30, dx = Math.sin(x.t * 40) * 2 * (1 - x.t / 1.6); ctx.strokeText(x.txt, x.x + dx, y); ctx.fillText(x.txt, x.x + dx, y); ctx.restore();
      }
      if (this.wand) this.wand.render(ctx);
      if (this.laser && this.pointer.seen) this.renderLaser(ctx, now);
      this.renderGame(ctx, now);
      this.renderParticles(ctx, dt);
      requestAnimationFrame((t) => this.frame(t));
    }
    // the time of year, outside the cats' window: snow in winter, blossom in spring, fireflies on summer nights, leaves in autumn
    season() { const m = new Date().getMonth(); return m === 11 || m <= 1 ? "winter" : m <= 4 ? "spring" : m <= 7 ? "summer" : "autumn"; }
    isDayish() { return !this.isNight(); }
    // one kawaii pixel cloud, about twice a bird's size: puffs on a flat bottom, a navy outline, white body with a pale blue belly,
    // shiny eyes, pink cheeks and a little smile; some trail a rainbow underneath, some sit in front of a rainbow arch
    cloudSprite(c, grey) {
      const key = c.seed + (grey ? "g" : "w") + c.deco; let img = this.cloudImgs.get(key); if (img) return img;
      let r = c.seed; const rr = () => { r = (r * 9301 + 49297) % 233280 / 233280; return r; };
      const w = Math.round(c.w), h = Math.round(w * 0.62), bandW = Math.max(1.5, w / 14), R = Math.round(w * 0.5 + bandW * 4);
      const arc = c.deco === "arc", Wd = arc ? Math.max(w + 2, 2 * R + 2) : w + 2, ox = Math.round((Wd - w - 2) / 2) + 1;
      const oy = arc ? Math.max(1, R - h + 2) : 1, padB = c.deco === "drip" ? 11 : 1, W = Wd, H = oy + h + padB + 1;
      // the shape: a big round puff in the middle, two smaller ones either side, on a rounded flat bottom
      // four bumps along the top (the middle two biggest), so it reads as a cartoon cloud and not a hill
      const rb = h * 0.3, j = (rr() - 0.5) * 0.06;
      const puffs = [[ox + w * (0.2 + j), oy + h * 0.6, h * 0.3], [ox + w * 0.41, oy + h * 0.36, h * 0.34], [ox + w * (0.64 - j), oy + h * 0.33, h * 0.36], [ox + w * 0.84, oy + h * 0.58, h * 0.28]];
      const inside = (x, y) => { const px = x + 0.5, py = y + 0.5;
        if (py > oy + h) return false;
        if (py >= oy + h - 2 * rb && px >= ox + rb && px <= ox + w - rb) return true;
        if ((px - ox - rb) ** 2 + (py - oy - h + rb) ** 2 <= rb * rb || (px - ox - w + rb) ** 2 + (py - oy - h + rb) ** 2 <= rb * rb) return true;
        return puffs.some(([cx, cy, pr]) => (px - cx) ** 2 + (py - cy) ** 2 <= pr * pr); };
      const cv = document.createElement("canvas"); cv.width = W; cv.height = H; const g = cv.getContext("2d");
      const px = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
      const OUT = grey ? "#3d4256" : "#2b4a8c", BODY = grey ? "#c3c8d4" : "#ffffff", HI = grey ? "#dde1ea" : "#ffffff", SH = grey ? "#a3a9b8" : "#cfe9fb", SH2 = grey ? "#8d93a3" : "#a9d6f5";
      // a rainbow arch behind the cloud, its feet tucked in at the bottom
      if (arc) {
        const cols = ["#ff6b81", "#ffa94d", "#ffe066", "#69db7c", "#4dabf7", "#9775fa"], cx = W / 2, cy = oy + h - 1;
        for (let y = 0; y < cy; y++) for (let x = 0; x < W; x++) { const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy), band = Math.floor((R - d) / bandW);
          if (band >= 0 && band < 6) px(x, y, cols[band]); else if (d > R - 0.01 && d < R + 1) px(x, y, OUT); else if (band === 6 && (R - d) < 6 * bandW + 1) px(x, y, OUT); }
      }
      // rainbow stripes dripping down from the belly, frayed into dots at the end
      if (c.deco === "drip") {
        const cols = ["#ff6b81", "#ffa94d", "#ffe066", "#69db7c", "#4dabf7", "#9775fa"], x0 = Math.round(W / 2 - 6), y0 = oy + h - 1;
        cols.forEach((col, i) => { const len = 7 + ((i * 7 + Math.round(c.seed * 10)) % 3); for (let y = 0; y < len; y++) { px(x0 + i * 2, y0 + y, col); px(x0 + i * 2 + 1, y0 + y, col); } if ((i + 1) % 2) px(x0 + i * 2, y0 + len + 1, col); else px(x0 + i * 2 + 1, y0 + len + 1, col); });
      }
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (inside(x, y)) {
          const top = !inside(x, y - 1), low = !inside(x, y + 2), lower = !inside(x, y + 1);
          px(x, y, lower ? SH2 : low ? SH : top || !inside(x, y - 2) ? HI : BODY);
        } else if (inside(x - 1, y) || inside(x + 1, y) || inside(x, y - 1) || inside(x, y + 1)) px(x, y, OUT);
      }
      if (!grey) for (const [cx, cy, pr] of puffs) if (pr > 4) px(Math.round(cx - pr * 0.45), Math.round(cy - pr * 0.45), "#e6f4ff");   // a tiny shine on the big puffs
      // the face
      const fx = Math.round(W / 2), fy = Math.round(oy + h * 0.6), e = w >= 24 ? 4 : 3, INK = grey ? "#2c3040" : "#1f2a4a";
      if (c.mood === "sleepy" || grey) { for (const sx of [-1, 1]) { px(fx + sx * e - (sx < 0 ? 2 : 0), fy, INK); px(fx + sx * e - (sx < 0 ? 1 : -1), fy, INK); } }
      else for (const sx of [-1, 1]) { const ex = fx + sx * e - (sx < 0 ? 2 : 0); g.fillStyle = INK; g.fillRect(ex, fy - 1, 2, 2); px(ex, fy - 1, "#ffffff"); }
      if (grey) { px(fx - 1, fy + 3, INK); px(fx, fy + 2, INK); px(fx + 1, fy + 3, INK); }                                       // a little frown on rainy days
      else { px(fx - 1, fy + 2, INK); px(fx, fy + 3, INK); px(fx + 1, fy + 2, INK); }                                           // a smile
      if (!grey) { g.fillStyle = "#ff9fb4"; g.fillRect(fx - e - 3, fy + 2, 2, 1); g.fillRect(fx + e + 1, fy + 2, 2, 1); }        // pink cheeks
      this.cloudImgs.set(key, cv); return cv;
    }
    // ---------------- real weather (set by the page from a weather service): rain, storms, snow, fog, clouds, wind
    // kinds: clear, cloud, fog, drizzle, rain, storm, snow
    // ---------------- the sky along the very top of the screen: a cloud drifts past now and then (like the birds),
    // more often and greyer when the real weather is cloudy or wet; on clear nights, once in a while, a shooting star
    renderSky(ctx, dt) {
      const wx = this.weather, kind = wx ? wx.kind : "", k = Math.max(1, Math.round(this.toyScale));
      const wind = wx ? Math.max(-1, Math.min(1, (wx.wind || 0) / 40)) * (wx.windDir || 1) : 0.3, dir = wind < 0 ? -1 : 1;
      const grey = kind === "rain" || kind === "storm", night = this.isNight();
      this.cloudT -= dt;
      if (this.cloudT <= 0) {
        // how long until the next one: rare on clear days, often when it's cloudy, rainy or stormy
        const gap = { clear: [300, 720], "": [240, 600], cloud: [45, 140], drizzle: [40, 110], rain: [25, 80], storm: [18, 55], snow: [50, 150], fog: [120, 300] }[kind] || [240, 600];
        this.cloudT = rnd(gap[0], gap[1]);
        const q = Math.random(), bow = !grey && !night && kind !== "fog" && kind !== "snow";
        const c = { w: Math.round(rnd(18, 27)), seed: Math.random(), bob: rnd(0, 6), mood: night || Math.random() < 0.25 ? "sleepy" : "happy", deco: bow && q < 0.2 ? "drip" : bow && q < 0.32 ? "arc" : "", grey };
        c.x = dir > 0 ? -(c.w + 40) * k : this.W + 10 * k; c.y = rnd(4, 60); c.v = (12 + 24 * Math.abs(wind) + rnd(0, 8)) * dir;
        if (this.sky.length < 6) this.sky.push(c);
        if (this.cloudImgs.size > 40) this.cloudImgs.clear();
      }
      for (const c of this.sky) {
        c.x += c.v * dt; c.t = (c.t || 0) + dt;
        const img = this.cloudSprite(c, c.grey), y = c.y + Math.sin(c.t * 0.9 + c.bob) * k;
        ctx.save(); ctx.imageSmoothingEnabled = false; if (night) ctx.filter = "brightness(.8)";
        ctx.drawImage(img, Math.round(c.x / k) * k, Math.round(y / k) * k, img.width * k, img.height * k); ctx.restore();
        // a grey cloud lets a few drops fall right under it
        if (c.grey && Math.random() < dt * 6) this.burst(c.x + rnd(0.3, 0.7) * img.width * k, y + img.height * k, "dust", "rgba(110,140,200,.8)", 1);
      }
      this.sky = this.sky.filter((c) => (c.v > 0 ? c.x < this.W + 20 : c.x > -(c.w + 60) * k));
      // shooting stars: only at night and when the sky isn't overcast
      if (night && !["cloud", "rain", "storm", "drizzle", "fog", "snow"].includes(kind)) {
        this.starT -= dt;
        if (this.starT <= 0) { this.starT = rnd(45, 160); const d = Math.random() < 0.5 ? -1 : 1; this.stars = this.stars || []; this.stars.push({ x: rnd(this.W * 0.15, this.W * 0.85), y: rnd(10, 90), vx: d * rnd(380, 520), vy: rnd(120, 190), life: 1.1, trail: [] }); }
      }
      if (this.stars && this.stars.length) {
        ctx.save();
        for (const st of this.stars) {
          st.life -= dt; st.trail.unshift([st.x, st.y]); st.trail.length = Math.min(st.trail.length, 16); if (Math.random() < dt * 20) this.burst(st.x, st.y, "spark", "#fff3a0", 1); st.x += st.vx * dt; st.y += st.vy * dt;
          const a = Math.max(0, Math.min(1, st.life * 2));
          ctx.lineCap = "round";
          for (let i = 1; i < st.trail.length; i++) { const [x0, y0] = st.trail[i - 1], [x1, y1] = st.trail[i]; ctx.globalAlpha = a * (1 - i / 16); ctx.strokeStyle = i < 4 ? "#fffbe0" : "#ffd84d"; ctx.lineWidth = Math.max(1, k * 1.4 * (1 - i / 18)); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
          ctx.globalAlpha = a; ctx.fillStyle = "#fff"; ctx.fillRect(Math.round(st.x / k) * k - k, Math.round(st.y / k) * k, k * 3, k); ctx.fillRect(Math.round(st.x / k) * k, Math.round(st.y / k) * k - k, k, k * 3);
        }
        ctx.restore(); this.stars = this.stars.filter((st) => st.life > 0);
      }
    }
    renderWeather(ctx, dt, now) {
      const wx = this.weather; if (!wx) return false;
      const k = Math.max(2, Math.round(this.scale * 0.7)), wind = Math.max(-1, Math.min(1, (wx.wind || 0) / 40)) * (wx.windDir || 1);
      if (wx.kind === "fog") {
        const g = ctx.createLinearGradient(0, this.floor - 260, 0, this.floor); g.addColorStop(0, "rgba(235,238,242,0)"); g.addColorStop(1, "rgba(235,238,242,.55)");
        ctx.fillStyle = g; ctx.fillRect(0, this.floor - 260, this.W, 262); return true;
      }
      if (wx.kind === "snow") { this.seasonOverride = "winter"; return false; }        // the winter snow, as heavy as the real thing
      if (!["drizzle", "rain", "storm"].includes(wx.kind)) return false;
      // rain: streaks slanted by the wind, little splashes on the floor
      const max = wx.kind === "drizzle" ? 70 : wx.kind === "rain" ? 190 : 260, drops = this.drops = (this.drops || []).filter((d) => d.y < this.floor);
      while (drops.length < max) drops.push({ x: Math.random() * (this.W + 200) - 100, y: -Math.random() * this.floor, v: 520 + Math.random() * 260 });
      ctx.save(); ctx.strokeStyle = "rgba(84,118,178,.72)"; ctx.lineWidth = Math.max(1.5, k * 0.6); ctx.beginPath();
      for (const d of drops) {
        d.y += d.v * dt; d.x += wind * 160 * dt; const len = wx.kind === "drizzle" ? 4 * k : 7 * k;
        ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - wind * len * 0.5, d.y - len);
        if (d.y >= this.floor - 2 && Math.random() < 0.08 && this.parts.length < 160) this.burst(d.x, this.floor, "dust", "rgba(140,170,215,.6)", 1);
      }
      ctx.stroke(); ctx.restore();
      // storms: now and then the room lights up, thunder rumbles and the cats jump
      if (wx.kind === "storm") {
        this.flashT = (this.flashT ?? 6) - dt;
        if (this.flashT <= 0) {
          this.flashT = 8 + Math.random() * 14; this.flash = 1; this.thunder();
          this.cats.forEach((c) => { if (c.profile && ["sit", "walk", "groom", "loaf"].includes(c.state) && Math.random() < 0.5) c.set("arch", 1.2); });
        }
        if (this.flash > 0) { ctx.save(); ctx.fillStyle = `rgba(255,255,255,${this.flash * 0.35})`; ctx.fillRect(0, 0, this.W, this.floor); ctx.restore(); this.flash -= dt * 3; }
      }
      return true;
    }
    thunder() {
      if (!this.purrOn && !this.meowOn) return;
      try {
        this.audio = this.audio || new (window.AudioContext || window.webkitAudioContext)();
        const ac = this.audio, t0 = ac.currentTime + 0.4 + Math.random(), len = 2.6, buf = ac.createBuffer(1, ac.sampleRate * len, ac.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
        const src = ac.createBufferSource(), lp = ac.createBiquadFilter(), g = ac.createGain();
        src.buffer = buf; lp.type = "lowpass"; lp.frequency.value = 160; g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.18, t0 + 0.15); g.gain.exponentialRampToValueAtTime(0.001, t0 + len);
        src.connect(lp); lp.connect(g); g.connect(ac.destination); src.start(t0);
      } catch {}
    }
    renderSeason(ctx, dt, now) {
      if (this.weather && this.weather.kind !== "snow" && this.seasonOverride === "winter" && !this.weatherWinter) this.seasonOverride = null;
      if (this.renderWeather(ctx, dt, now)) { this.flakes = []; return; }
      const se = this.seasonOverride || this.season(), night = this.isNight();
      if (se === "summer" && !night) { this.flakes = []; return; }
      const max = Math.round({ winter: 34, spring: 14, summer: 10, autumn: 16 }[se] * (this.weather && this.weather.kind === "snow" ? 2.2 : 1)), k = Math.max(2, Math.round(this.scale * 0.7));
      const fl = this.flakes = (this.flakes || []).filter((f) => f.y < this.floor + 4 && f.x > -20 && f.x < this.W + 20 && f.se === se);
      const heavy = this.weather && this.weather.kind === "snow";
      if (heavy && !fl.length) for (let i = 0; i < max * 0.7; i++) fl.push({ se, x: Math.random() * this.W, y: Math.random() * this.floor, ph: Math.random() * 6, c: "#ffffff", vy: 22 * (0.6 + Math.random() * 0.8), big: Math.random() < 0.3 });
      if (fl.length < max && Math.random() < dt * max / (heavy ? 1.5 : 6)) {
        const cols = { winter: ["#ffffff", "#eef5ff", "#dfeaff"], spring: ["#ffc7d9", "#ffb0c8", "#fff0f4"], summer: ["#fff3a0"], autumn: ["#e8873a", "#c9622a", "#e0a13c", "#a8502a"] }[se];
        fl.push({ se, x: Math.random() * this.W, y: se === "summer" ? this.floor - Math.random() * 260 : -10, ph: Math.random() * 6, c: cols[Math.floor(Math.random() * cols.length)],
          vy: { winter: 22, spring: 26, summer: -4, autumn: 34 }[se] * (0.6 + Math.random() * 0.8), big: Math.random() < 0.3 });
      }
      ctx.save();
      for (const f of fl) {
        f.ph += dt; f.y += f.vy * dt; f.x += Math.sin(f.ph * (se === "autumn" ? 1.6 : 1.1)) * (se === "autumn" ? 34 : se === "summer" ? 14 : 12) * dt;
        if (se === "summer") { f.y += Math.cos(f.ph * 0.7) * 8 * dt; if (f.ph > 14) f.y = 1e5; }
        ctx.globalAlpha = se === "summer" ? 0.35 + 0.65 * (Math.sin(f.ph * 3) + 1) / 2 : 0.9; ctx.fillStyle = f.c;
        const x = Math.round(f.x), y = Math.round(f.y), z = f.big ? k * 1.5 : k;
        if (se === "autumn") { ctx.fillRect(x, y, z * 2, z); ctx.fillRect(x + z / 2, y - z / 2, z, z * 2); }
        else if (se === "spring") { ctx.fillRect(x, y, z * 1.5, z); }
        else { if (se === "winter") { ctx.fillStyle = "rgba(110,130,165,.45)"; ctx.fillRect(x + 1, y + 1, z, z); ctx.fillStyle = f.c; } ctx.fillRect(x, y, z, z); }
      }
      if (se === "winter") {                            // a thin line of snow settles on the floor
        ctx.globalAlpha = 0.85; ctx.fillStyle = "#ffffff";
        for (let x = 0; x < this.W; x += k * 3) { const h = k * (1 + ((x * 7919) % 3 === 0 ? 1 : 0)); ctx.fillRect(x, this.floor - h + k, k * 3, h); }
      }
      ctx.restore();
    }
    // a small crescent moon and a few twinkling stars, only at night
    renderNight(ctx, now) {
      const s = Math.max(2, this.toyScale), x = this.W - 22 * s - 30, y = Math.max(24, this.floor - 90 * s);
      ctx.save(); ctx.imageSmoothingEnabled = false;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 16 * s); g.addColorStop(0, "rgba(255,240,180,.35)"); g.addColorStop(1, "rgba(255,240,180,0)");
      ctx.fillStyle = g; ctx.fillRect(x - 16 * s, y - 16 * s, 32 * s, 32 * s);
      for (let yy = -6; yy <= 6; yy++) for (let xx = -6; xx <= 6; xx++) {
        const a = xx * xx + yy * yy, b = (xx - 3) * (xx - 3) + (yy + 2) * (yy + 2);
        if (a <= 36 && b > 22) { ctx.fillStyle = a > 25 || b < 30 ? "#f2d77a" : "#fff1b5"; ctx.fillRect(Math.round(x + xx * s), Math.round(y + yy * s), s, s); }
      }
      [[-34, -10, 0], [-20, 14, 1.3], [-48, 8, 2.1], [10, -18, 0.7], [-60, -14, 3.1]].forEach(([dx, dy, ph]) => {
        const tw = (Math.sin(now / 420 + ph * 2) + 1) / 2; ctx.globalAlpha = 0.35 + 0.65 * tw; ctx.fillStyle = "#fff6c8";
        const sx = Math.round(x + dx * s / 2), sy = Math.round(y + dy * s / 2), k = Math.max(1, Math.round(s / 2));
        ctx.fillRect(sx, sy - k, k, 3 * k); ctx.fillRect(sx - k, sy, 3 * k, k);
      });
      ctx.restore();
    }
    renderLaser(ctx, now) {
      const s = this.toyScale, p = this.pointer, j = Math.sin(now / 37) * 0.6;
      ctx.save();
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 7 * s); g.addColorStop(0, "rgba(255,60,60,.55)"); g.addColorStop(1, "rgba(255,60,60,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, 7 * s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ff2b2b"; ctx.fillRect(Math.round(p.x - s + j), Math.round(p.y - s), 2 * s, 2 * s);
      ctx.fillStyle = "#ffd0d0"; ctx.fillRect(Math.round(p.x - s / 2 + j), Math.round(p.y - s / 2), Math.max(1, s), Math.max(1, s));
      ctx.restore();
    }
    renderParticles(ctx, dt) {
      const s = Math.max(2, Math.round(this.scale * 0.8));
      this.parts = this.parts.filter((p) => (p.age += dt) < p.life);
      for (const p of this.parts) {
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.kind === "confetti") { p.vy += 420 * dt; p.vx *= Math.pow(0.4, dt); }
        else if (p.kind !== "z") p.vy += 60 * dt; else p.x += Math.sin(p.age * 3) * 0.6;
        const g = GLYPH[p.kind]; ctx.globalAlpha = 1 - p.age / p.life; ctx.fillStyle = p.color;
        const sc = p.kind === "z" ? s * (0.6 + p.age * 0.35) : s;
        for (let y = 0; y < g.length; y++) for (let x = 0; x < g[y].length; x++) if (g[y][x] === "1") ctx.fillRect(Math.round(p.x + x * sc), Math.round(p.y + y * sc), Math.ceil(sc), Math.ceil(sc));
      }
      ctx.globalAlpha = 1;
    }
  }

  // ---------------------------------------------------------------- a pixel-art park tree (drawn once per seed, then scaled up crisp)
  const treeCache = {};
  function parkTree(seed) {
    if (treeCache[seed]) return treeCache[seed];
    let r = seed * 9301 + 17; const rr = () => { r = (r * 9301 + 49297) % 233280; return r / 233280; };
    const W = 40, H = 62, cv = document.createElement("canvas"); cv.width = W; cv.height = H; const g = cv.getContext("2d");
    const put = (x, y, c) => { g.fillStyle = c; g.fillRect(x, y, 1, 1); };
    // the canopy: a few overlapping blobs
    const blobs = [[20, 18, 13], [11, 24, 9], [29, 24, 9], [15, 12, 8], [26, 12, 8], [20, 28, 10]].map(([x, y, rad]) => [x + (rr() - 0.5) * 3, y + (rr() - 0.5) * 2, rad * (0.9 + rr() * 0.2)]);
    const leaf = (x, y) => blobs.some(([cx, cy, rad]) => (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= rad * rad);
    // the trunk and roots
    const trunk = (x, y) => (y >= 30 && y < H - 2 && Math.abs(x + 0.5 - 20) <= 3 + (y > H - 8 ? (y - (H - 8)) * 0.8 : 0)) || (y >= 34 && y <= 38 && ((x >= 23 && x <= 27 && y - 34 <= x - 23 && y - 34 >= x - 25)));
    const OUT = "#2f4a2a", L1 = "#9be07c", L2 = "#6fc25a", L3 = "#4f9f45", L4 = "#3b7d39", T1 = "#a8784a", T2 = "#8a5a36", T3 = "#64402a", TO = "#3e2a1e";
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (leaf(x, y)) {
        const up = !leaf(x, y - 1), lf = !leaf(x - 1, y), dn = !leaf(x, y + 1), rt = !leaf(x + 1, y);
        const lightness = (x - 20) * 0.6 + (y - 18);                                  // light from the top left
        let c = lightness < -10 ? L1 : lightness < 2 ? L2 : lightness < 12 ? L3 : L4;
        if (up || lf) c = c === L4 ? L3 : L1;                                         // a lit rim
        if (dn || rt) c = L4;                                                         // shadowed underside
        if ((x * 7 + y * 13) % 17 === 0 && c !== L4) c = L1;                          // little glints in the leaves
        if ((x * 5 + y * 11) % 23 === 0 && c === L2) c = L3;
        put(x, y, c);
      } else if (trunk(x, y)) {
        const edgeL = !trunk(x - 1, y), edgeR = !trunk(x + 1, y);
        put(x, y, edgeL ? T1 : edgeR ? T3 : (y + x * 3) % 7 === 0 ? T3 : T2);       // bark lines
      }
    }
    // a dark outline round everything
    const solid = (x, y) => x >= 0 && y >= 0 && x < W && y < H && (leaf(x, y) || trunk(x, y));
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!solid(x, y) && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) put(x, y, leaf(x - 1, y) || leaf(x + 1, y) || leaf(x, y - 1) || leaf(x, y + 1) ? OUT : TO);
    // a few round fruit or blossom dots on some trees
    if (seed % 2) for (let i = 0; i < 6; i++) { const x = Math.round(10 + rr() * 20), y = Math.round(8 + rr() * 20); if (leaf(x, y) && leaf(x + 1, y + 1)) { put(x, y, seed % 4 === 1 ? "#ff8fab" : "#ffd34d"); put(x + 1, y, seed % 4 === 1 ? "#ffc2d1" : "#fff1a0"); } }
    return (treeCache[seed] = cv);
  }

  // ---------------------------------------------------------------- visitors: a squirrel, a hedgehog, a little cloud of butterflies
  class Critter {
    constructor(world, kind, dir) {
      this.world = world; this.kind = kind; this.dir = dir; this.t = rnd(0, 5); this.seen = new Set();
      const s = world.toyScale; this.x = dir > 0 ? -30 : world.W + 30; this.y = world.floor; this.pause = 0;
      this.v = (kind === "squirrel" ? rnd(90, 130) : kind === "hedgehog" ? rnd(18, 26) : rnd(40, 60)) * s / 3;
      this.sp = new Sprite(18, 14);
      if (kind === "butterflies") this.flock = [0, 1, 2].map((i) => ({ dx: i * 14 - 14, dy: rnd(-20, 20), ph: rnd(0, 6), c: ["#ff8fab", "#ffd34d", "#8fd0ff"][i] }));
    }
    update(dt) {
      const w = this.world; this.t += dt;
      if (this.kind === "squirrel") {                    // dash, stop, look about, dash again
        if (this.pause > 0) this.pause -= dt; else { this.x += this.dir * this.v * dt; if (Math.random() < dt * 0.6) this.pause = rnd(0.6, 1.6); }
      } else this.x += this.dir * this.v * dt;
      if (this.kind === "butterflies") this.y = w.floor - 90 * w.toyScale / 3 + Math.sin(this.t * 1.3) * 30;
      for (const c of w.cats) {                          // cats turn to stare (and kittens give chase)
        if (this.seen.has(c) || !c.profile || Math.abs(c.x - this.x) > 220) continue; this.seen.add(c);
        if (["sit", "walk", "groom", "loaf", "sploot"].includes(c.state) && Math.random() < 0.8) { c.facing = Math.sign(this.x - c.x) || c.facing; c.set(c.size < 0.7 && this.kind !== "hedgehog" ? "hunt" : "birdWatch", rnd(1.5, 3), c.size < 0.7 ? { goal: "bird" } : {}); }
      }
    }
    gone() { return this.x < -60 || this.x > this.world.W + 60; }
    render(ctx) {
      const w = this.world, s = w.toyScale;
      if (this.kind === "butterflies") {
        for (const b of this.flock) { const f = Math.abs(Math.sin(this.t * 14 + b.ph)), x = this.x + b.dx * s, y = this.y + b.dy + Math.sin(this.t * 3 + b.ph) * 8;
          ctx.fillStyle = b.c; ctx.fillRect(Math.round(x - (1 + 2 * f) * s), Math.round(y - 2 * s), Math.round((1 + 2 * f) * s), Math.round(3 * s)); ctx.fillRect(Math.round(x + s), Math.round(y - 2 * s), Math.round((1 + 2 * f) * s), Math.round(3 * s));
          ctx.fillStyle = "#5b3a29"; ctx.fillRect(Math.round(x), Math.round(y - 2 * s), Math.round(s), Math.round(4 * s)); }
        return;
      }
      const R = this.sp.R; R.clear(); const run = this.kind === "squirrel" && this.pause <= 0, hop = run ? Math.abs(Math.sin(this.t * 14)) * 2 : 0;
      if (this.kind === "squirrel") {
        R.curve(5, 11 - hop, 0, 4 - hop, 3, 0, 3.2, 2.2, 3);                         // the big bushy tail
        R.ellipse(9, 10 - hop, 4, 3, 1); R.circle(13, 7 - hop, 2.6, 1); R.put(14, 6 - hop, 4); R.put(12, 4 - hop, 1); R.put(15.5, 7.5 - hop, 5);
        R.rect(7, 12 - hop, 2, 2, 1); R.rect(11, 12 - hop, 2, 2, 1); R.ellipse(10, 10.5 - hop, 2, 1.2, 2);
      } else {
        for (let i = 0; i < 9; i++) R.limb(4 + i, 6, 3 + i + (i % 2), 2 + (i % 3), 0.8, 3);   // spines
        R.ellipse(8, 9, 6, 3.6, 3); R.ellipse(13, 10, 2.6, 2, 2); R.put(15.5, 10, 5); R.put(13, 9, 4); R.rect(6, 12, 1, 1, 2); R.rect(10, 12, 1, 1, 2);
      }
      const pal = this.kind === "squirrel" ? { 1: { c: [176, 96, 52], lit: true }, 2: { c: [236, 200, 160] }, 3: { c: [196, 110, 60], lit: true }, 4: { c: [20, 18, 22] }, 5: { c: [60, 40, 30] } }
        : { 1: { c: [160, 140, 120] }, 2: { c: [220, 190, 160], lit: true }, 3: { c: [110, 90, 74], lit: true }, 4: { c: [20, 18, 22] }, 5: { c: [40, 30, 30] } };
      const img = this.sp.paint(pal, [70, 46, 30]);
      ctx.save(); ctx.imageSmoothingEnabled = false; ctx.translate(Math.round(this.x), Math.round(this.y - 14 * s)); if (this.dir < 0) ctx.scale(-1, 1);
      ctx.drawImage(img, -9 * s, 0, 18 * s, 14 * s); ctx.restore();
    }
  }
  function critterThumb(ctx, kind) {
    const W = ctx.canvas.width, H = ctx.canvas.height, fake = { world: { toyScale: 2, W: 999, floor: H - 2 }, kind, dir: 1, t: 1, pause: 1, x: W / 2, y: H - 2, sp: new Sprite(18, 14),
      flock: [0, 1, 2].map((i) => ({ dx: i * 7 - 7, dy: i * 4 - 4, ph: i, c: ["#ff8fab", "#ffd34d", "#8fd0ff"][i] })) };
    if (kind === "butterflies") fake.y = H / 2 + 4;
    Critter.prototype.render.call(fake, ctx);
  }
  // a bird for the album
  function birdThumb(ctx, id) {
    const B = BIRDS.find((b) => b.id === id) || BIRDS[0], W = ctx.canvas.width, H = ctx.canvas.height, k = 2 / (B.big || 1);
    const fake = { sp_: B, sp: new Sprite(16, 13), state: "peck", t: 0, x: W / 2, y: H - 3, dir: 1, world: { toyScale: k } };
    Bird.prototype.render.call(fake, ctx);
  }
  window.DesktopCat = { buildPalette, BIRDS, birdThumb, critterThumb, World, COATS, COAT_KEYS, SCALE_MIN: 1, SCALE_MAX: 6, portrait, WARDROBE, FURN, furnitureThumb };
})();
