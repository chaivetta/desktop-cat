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
  };
  const COAT_KEYS = Object.keys(COATS);

  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const lighten = (c, t) => mix(c, [255, 255, 255], t);
  const darken = (c, t) => mix(c, [0, 0, 0], t);

  function buildPalette(key) {
    const c = COATS[key] || COATS.ginger;
    const body = hex(c.body), belly = hex(c.belly), acc = hex(c.accent), acc2 = hex(c.accent2 || c.accent);
    const P = {};
    const set = (m, base) => { P[m] = { base, light: lighten(base, 0.22), shade: darken(base, 0.24), deep: darken(base, 0.42) }; };
    set(M.BODY, body); set(M.BELLY, belly); set(M.ACCENT, acc); set(M.ACCENT2, acc2);
    P.outline = c.outline ? hex(c.outline) : darken(mix(body, acc, 0.5), 0.62);
    P.eye = hex(c.eye); P.pupil = [20, 18, 22]; P.nose = [222, 120, 140]; P.ear = [232, 150, 160]; P.closed = darken(mix(body, acc, 0.5), 0.6);
    P.tongue = [236, 98, 120];
    P.pattern = c.pattern; P.key = key;
    return P;
  }

  // ---------------------------------------------------------------- tiny rasteriser
  const SW = 48, SH = 42, GROUND = 38;            // sprite size and the row the feet stand on
  const M = { EMPTY: 0, BODY: 1, FAR: 2, BELLY: 3, ACCENT: 4, ACCENT2: 5, EYE: 6, NOSE: 7, EAR: 8, CLOSED: 9, TONGUE: 10, PUPIL: 11, FORCE_BELLY: 12,
    H1: 13, H2: 14, H3: 15, C1: 16, C2: 17, C3: 18, O1: 19, O2: 20 };

  class Raster {
    constructor(w = SW, h = SH) { this.w = w; this.h = h; this.m = new Uint8Array(w * h); this.part = new Uint8Array(w * h); }
    clear() { this.m.fill(0); this.part.fill(0); this.head = null; this.outfit = null; }
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
  };
  const COLLARS = {
    plain: { tr: "tasma", en: "collar" }, bell: { tr: "zilli tasma", en: "bell collar" }, bowtie: { tr: "papyon", en: "bow tie" },
    bigbow: { tr: "kocaman fiyonk", en: "big bow" }, bandana: { tr: "bandana", en: "bandana" }, pearls: { tr: "inci kolye", en: "pearl necklace" },
    scarf: { tr: "atkı", en: "scarf" }, tag: { tr: "kalpli künye", en: "heart tag" }, studs: { tr: "çivili tasma", en: "studded collar" },
    lei: { tr: "çiçek kolye", en: "flower lei" },
  };
  const OUTFITS = {
    sweater: { tr: "kazak", en: "sweater" }, stripes: { tr: "çizgili tişört", en: "striped tee" }, dots: { tr: "puantiyeli elbise", en: "polka-dot dress" },
    plaid: { tr: "ekose gömlek", en: "plaid shirt" }, zigzag: { tr: "zikzak hırka", en: "zigzag cardigan" }, raincoat: { tr: "yağmurluk", en: "raincoat" },
    stars: { tr: "yıldızlı pijama", en: "starry pyjamas" }, diagonal: { tr: "çapraz çizgili forma", en: "sash jersey" },
    vertical: { tr: "dikey çizgili yelek", en: "pinstripe vest" }, overalls: { tr: "salopet", en: "dungarees" },
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
    put(acc.hat, [M.H1, M.H2, M.H3]); put(acc.collar, [M.C1, M.C2, M.C3]); put(acc.outfit, [M.O1, M.O2]);
    return (accCache[key] = A);
  }

  const isTorso = (R, x, y) => {
    const p = R.partAt(x, y), m = R.get(x, y);
    return (p === PART.BODY || p === PART.CHEST) && (m === M.BODY || m === M.FAR || m === M.BELLY || m === M.FORCE_BELLY || m === M.ACCENT || m === M.ACCENT2);
  };
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
        default: return M.C1;
      }
    };
    const rows = design === "scarf" ? 3 : design === "pearls" ? 1 : 2;
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
        if (R.outfit && isTorso(R, x, y)) mm = outfitMat(R, x, y) === 2 ? M.O2 : M.O1;
        if (far && mm === M.BODY) mm = M.BODY;
        const t = tone(mm);
        const above = R.get(x, y - 1), below = R.get(x, y + 1), right = R.get(x + 1, y);
        if (far) rgb = t.deep;
        else if (!above) rgb = t.light;                              // top edge catches the light
        else if (!below || y >= GROUND - 1) rgb = t.shade;           // underside in shadow
        else if (!right && (x + y) % 2 === 0) rgb = t.shade;         // dithered rim on the back
        else rgb = t.base;
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
    (POSES[o.pose] || POSES.sit)(R, { t: o.t || 0, st: 1, phase: o.phase || 0, blink: !!o.blink, eyes: o.eyes || null, look: o.look || null });
    const pal = portraitCache.pal[coat] || (portraitCache.pal[coat] = buildPalette(coat));
    dress(R, o.acc); shade(R, pal, img, accTones(o.acc)); g.putImageData(img, 0, 0);
    const k = o.scale || 2, W = ctx.canvas.width, H = ctx.canvas.height;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(c, Math.round((W - SW * k) / 2 + (o.dx ?? 4) * k), Math.round((H - SH * k) / 2 + (o.dy || 0) * k), SW * k, SH * k);
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

  const PERCH_OK = ["sit", "groom", "lickFlank", "washFace", "legUp", "sleep", "knead", "stretch", "yawn", "happy", "boop", "roll", "prep"];
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
      if (this.state === "inbox" && state !== "inbox" && this.box) { this.box.occupant = null; this.box = null; }
      if (this.bed && !["knead", "sleep", "stretch", "yawn"].includes(state)) { this.bed.occupant = null; this.bed = null; }
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
      const b = this.bounds(), s = this.s;
      if (this.state === "inbox") return px >= b.x + 12 * s && px <= b.x + b.w - 12 * s && py >= b.y + (4 + this.peek * 14) * s && py <= this.world.floor - 14 * s;
      return px >= b.x + 6 * s && px <= b.x + b.w - 6 * s && py >= b.y + 4 * s && py <= b.y + b.h;
    }

    // ------------------------------------------------ deciding what to do next
    think() {
      const w = this.world;
      if (w.laser) return this.set("chase", 30, { goal: "laser" });
      if (w.wand) return this.set("chase", 30, { goal: "feather" });
      if (this.perch) {                                // up on a shelf: lounge about, or hop down
        const pw = { sit: 3, groom: 2, sleep: w.isNight() ? 4 : 1.3, down: 1.5 };
        if (this.mods) for (const k in pw) if (this.mods[k]) pw[k] *= this.mods[k];
        const n = pick(pw);
        if (n === "down") return this.hopDown();
        if (n === "sleep") return this.set("knead", rnd(2, 3));
        if (n === "groom") return this.set(pick({ groom: 3, lickFlank: 2, washFace: 2, legUp: 1.4 }), rnd(3, 6));
        return this.set("sit", rnd(4, 9));
      }
      if (Math.random() < 0.015 && !w.isNight()) w.meow(this);
      const wt = { walk: 3, sit: 2, groom: 1.8, sleep: 1.1, roll: 1, zoom: this.zoomCool > 0 ? 0 : 0.12 };
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
      if (w.isNight()) { wt.sleep *= 3; wt.walk *= 0.4; wt.zoom = 0; if (wt.fight) wt.fight *= 0.2; if (wt.shelf) wt.shelf *= 0.5; }
      const foe = this.fightCool <= 0 && w.cats.find((o) => o !== this && o.fightCool <= 0 && ["walk", "sit", "groom", "roll"].includes(o.state) && Math.abs(o.x - this.x) < 260 * this.s / 3 * 3);
      if (foe) wt.fight = 0.6;
      if (wt.yarn || wt.mouse || wt.dangle || wt.butterfly) { wt.sleep = 0.2; wt.walk = 1.5; wt.fight = 0; }
      if (this.mods) for (const k in wt) if (this.mods[k]) wt[k] *= this.mods[k];      // personality
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
          if (!w.bowl || w.bowl.food <= 0.02) return null;
          const side = this.x < w.bowl.x ? -1 : 1; return w.bowl.x + side * 15 * s;
        }
        case "box": return this.boxRef && w.boxes.includes(this.boxRef) && !this.boxRef.occupant ? this.boxRef.x : null;
        case "feather": return w.wand && w.pointer.seen ? w.wand.x : null;
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
        default: return w.yarn ? { x: w.yarn.x, y: w.yarn.y } : null;
      }
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
      if (this.profile && window.CatLife) window.CatLife.tick(this, dt);
      this.blinkT -= dt; if (this.blinkT <= 0) { this.blink = !this.blink; this.blinkT = this.blink ? 0.14 : rnd(2, 6); }
      if ((w.laser || w.wand) && !["chase", "leap", "stand", "held", "fall", "hunt"].includes(this.state)) this.think();
      if (this.bed && w.bed !== this.bed) this.bed = null;

      switch (this.state) {
        case "walk": {
          const dx = this.target - this.x;
          if (Math.abs(dx) < 4) { this.think(); break; }
          this.facing = Math.sign(dx); this.x += this.facing * 34 * s * dt; this.phase = (this.phase + dt * 1.4) % 1;
          this.tryBoop();
          if (this.stateT > this.dur) this.think();
          break;
        }
        case "zoom": {
          const dx = this.target - this.x;
          this.facing = Math.sign(dx) || this.facing; this.x += this.facing * 175 * s * dt; this.phase = (this.phase + dt * 4.5) % 1;
          if (Math.random() < dt * 8) w.burst(this.x - this.facing * 14 * s, floor - 2 * s, "dust", "rgba(140,120,100,.55)", 1);
          if (Math.abs(dx) < 12 * s) { this.laps++; const m = SW * s; this.target = this.facing > 0 ? m : w.W - m; if (this.laps >= 2 || this.stateT > this.dur) this.set("skid", 0.8, { slide: 170 * s }); }
          break;
        }
        case "chase": this.updateChase(dt); break;
        case "hunt": {                                    // crouched, bottom wiggling, about to pounce
          const am = this.aim(), tx = am ? am.x : this.x;
          this.facing = Math.sign(tx - this.x) || this.facing;
          if (this.stateT > this.dur) {
            const air = 0.42; this.vx = clamp((tx - this.x) / air, -320 * s / 3 * 3, 320 * s / 3 * 3); this.vy = -G * air / 2;
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
          this.facing = Math.sign(b.x - this.x) || this.facing;
          b.food = Math.max(0, b.food - 0.045 * dt);
          if (Math.random() < dt * 1.2) w.burst(b.x, floor - 6 * s, "crumb", "#8a5a2b", 1);
          if (this.stateT > this.dur || b.food <= 0) { this.fed = b.refill; this.set("groom", rnd(2.5, 4)); w.burst(this.x, this.y - 30 * s, "heart", "#e2557a", 1); }
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
          if (this.stateT > this.dur) this.set("sleep", rnd(12, 30));
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
        case "stretch": if (this.stateT > this.dur) this.set("yawn", 1.1); break;
        case "yawn": if (this.stateT > this.dur) this.set("sit", rnd(1.5, 3), { eyes: null }); break;
        default:
          if (this.stateT > this.dur) this.think();
      }
      const m = SW * s / 2; this.x = clamp(this.x, m, w.W - m);
      if (this.perch && !w.shelves.includes(this.perch)) { this.perch = null; this.set("fall", 5); this.vx = 0; this.vy = 0; }
      this.partyT = (this.partyT || 0) - dt;
      if (this.bed) { this.x = this.bed.x; this.y = floor - 4 * w.toyScale; }
      else if (this.perch && !["held", "fall", "leap"].includes(this.state)) { this.x = this.perch.x + this.perchDx; this.y = this.perch.top; }
      else if (!["held", "fall", "leap", "inbox"].includes(this.state) && !(this.state === "spar" && this.vy)) this.y = floor;
      this.watchPointer(dt);
    }

    updateChase(dt) {
      const w = this.world, s = this.s, floor = w.floor;
      const tx = this.goalX();
      if (tx == null) { if (this.boxRef && this.boxRef.claimed === this) this.boxRef.claimed = null; this.set("sit", 1.5); return; }
      const dx = tx - this.x, g = this.goal;
      const reach = { yarn: 16, dangle: 9, mouse: 46, laser: 22, bowl: 3, box: 4, feather: 9, butterfly: 10, catnip: 6, bed: 4, post: 3, shelf: 4 }[g] * s;
      if (Math.abs(dx) > reach) {
        this.facing = Math.sign(dx);
        const sp = ["bowl", "box", "bed", "post", "shelf"].includes(g) ? 60 : g === "laser" ? 135 : g === "feather" ? 125 : g === "catnip" ? 80 : 105;
        this.x += this.facing * Math.min(sp * s * dt, Math.abs(dx)); this.phase = (this.phase + dt * (sp > 120 ? 3.4 : sp > 70 ? 2.6 : 1.8)) % 1;
      } else {
        if (g === "yarn") {
          const y = w.yarn;
          if (y.y > floor - 30 * s) { if (Math.abs(y.vx) < 220 && Math.random() < 0.55) this.set("hunt", rnd(0.5, 1.1)); else this.set("bat", 0.7, { swatted: false }); }
        } else if (g === "mouse") this.set("hunt", rnd(0.25, 0.6));
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
        else if (g === "bowl") { this.facing = Math.sign(w.bowl.x - this.x) || this.facing; this.set("eat", rnd(4, 7) * ((this.mods && this.mods._eat) || 1)); this.care("fed"); }
        else if (g === "box") {
          const b = this.boxRef; b.claimed = null;
          if (!b.occupant) { b.occupant = this; this.box = b; this.x = b.x; this.set("inbox", rnd(8, 22), { peek: 1, peekTo: 0, peekT: rnd(1, 2), box: b }); w.burst(b.x, floor - 22 * s, "note", "#b08d57", 1); this.care("box"); }
          else this.think();
        }
      }
      if (!["laser", "feather"].includes(g) && this.state === "chase" && this.stateT > this.dur) this.think();
    }

    // where the front paws are, in screen space
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
          this.y = sh.top; this.vy = 0; this.vx = 0; this.perch = sh; this.perchDx = clamp(this.x - sh.x, -sh.hw + 10 * s, sh.hw - 10 * s);
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
    hopOut() {
      const b = this.box; if (b) b.occupant = null; this.box = null;
      this.state = "leap"; this.stateT = 0; this.dur = 3; this.goal = null;
      this.y = this.world.floor - 14 * this.s; this.vy = -360; this.vx = (Math.random() < 0.5 ? -1 : 1) * 140; this.facing = Math.sign(this.vx);
    }

    pose() {
      switch (this.state) {
        case "walk": return "walk";
        case "chase": return ["bowl", "box", "bed", "post", "shelf"].includes(this.goal) ? "walk" : "run";
        case "prep": return "crouch";
        case "spar": return (this.vy || this.y < this.world.floor) ? "leap" : this.act === "swipe" ? "swipe" : "spar";
        case "flee": case "pursue": return "run";
        case "sniff": return "eat";
        case "nip": return "roll";
        case "happy": return "sit";
        default: return this.state in POSES ? this.state : "sit";
      }
    }

    render(ctx) {
      const R = this.R; R.clear();
      const a = { t: this.t, st: this.stateT, phase: this.phase, blink: this.blink, eyes: this.state === "happy" ? "happy" : this.eyes, peekEyes: null, look: this.look };
      POSES[this.pose()](R, a);
      const acc = this.wearing();
      dress(R, acc);
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
      ctx.translate(Math.round(this.x), Math.round(this.y - GROUND * s + dy));
      if (this.facing < 0) ctx.scale(-1, 1);
      ctx.drawImage(this.canvas, Math.round(-SW * s / 2), 0, SW * s, SH * s);
      ctx.restore();
      if (this.profile && this.profile.showName && w.showNames !== false) this.drawTag(ctx, R, dy);
    }

    // a little speech-bubble name tag floating above the cat
    drawTag(ctx, R, dy) {
      const s = this.s, w = this.world;
      let top = 0;
      find: for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) if (R.m[y * SW + x]) { top = y; break find; }
      const target = this.y - GROUND * s + dy + top * s - 4;
      this.tagY = this.tagY == null || Math.abs(this.tagY - target) > 80 ? target : this.tagY + (target - this.tagY) * 0.18;
      const name = this.profile.name, fs = Math.round(clamp(8 + w.scale * 2.4, 11, 20)), love = this.profile.love >= 80;
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
    grab() { this.held = true; this.len = 46 * this.world.toyScale; this.cats("dangle"); }
    release(v = { x: 0, y: 0 }) { this.held = false; this.vx = clamp(v.x * 0.9 + this.vx * 0.35, -2200, 2200); this.vy = clamp(v.y * 0.9 + this.vy * 0.35, -2200, 2200); this.spin = this.vx / 60; this.cats("yarn"); }
    click() { this.vy = -420; this.vx = rnd(-300, 300); this.cats("yarn"); }
    cats(goal) { this.world.cats.forEach((c) => { if (!["sleep", "held", "fall", "inbox", "eat"].includes(c.state)) c.set("chase", 9, { goal }); }); }
    update(dt) {
      const w = this.world, floor = w.floor - this.r;
      this.vy += 1800 * dt; this.x += this.vx * dt; this.y += this.vy * dt;
      if (this.held) {                     // pendulum on a string from the pointer
        const ax = w.pointer.x, ay = w.pointer.y, dx = this.x - ax, dy = this.y - ay, d = Math.hypot(dx, dy) || 1;
        if (d > this.len) {
          const nx = dx / d, ny = dy / d; this.x = ax + nx * this.len; this.y = ay + ny * this.len;
          const vr = this.vx * nx + this.vy * ny; if (vr > 0) { this.vx -= vr * nx; this.vy -= vr * ny; }
        }
        this.vx *= Math.pow(0.55, dt); this.vy *= Math.pow(0.55, dt);
      }
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
      if (this.held) { ctx.moveTo(w.pointer.x, w.pointer.y); ctx.quadraticCurveTo((w.pointer.x + this.x) / 2 + this.vx * 0.02, (w.pointer.y + this.y) / 2, this.x, this.y - this.r * 0.8); }
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
      this.world = world; this.x = x; this.food = 1; this.refill = 1; this.held = false;
      this.sp = new Sprite(20, 9);
      this.pal = { 1: { c: [72, 120, 170], lit: true }, 2: { c: [140, 88, 44], lit: true }, 3: { c: [240, 236, 228] }, 4: { c: [104, 64, 30] } };
    }
    hit(px, py) { const s = this.world.toyScale; return Math.abs(px - this.x) < 12 * s && py > this.world.floor - 12 * s && py < this.world.floor + 2; }
    grab() { this.held = true; }
    release() { this.held = false; }
    click() {
      this.food = 1; this.refill++; this.world.burst(this.x, this.world.floor - 14 * this.world.toyScale, "note", "#b08d57", 2);
      this.world.cats.forEach((c, i) => { if (!["held", "fall", "inbox"].includes(c.state)) { c.set("chase", 10, { goal: "bowl" }); if (i < 2) setTimeout(() => this.world.meow(c), 150 + i * 450 + Math.random() * 300); } });
    }
    update(dt) { const w = this.world; if (this.held) this.x += (clamp(w.pointer.x, 12 * w.toyScale, w.W - 12 * w.toyScale) - this.x) * Math.min(1, dt * 14); }
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
      ctx.save(); ctx.globalAlpha = 0.2; ctx.fillStyle = "#000"; ctx.beginPath(); ctx.ellipse(this.x, w.floor + s, 10 * s, 1.6 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(img, Math.round(this.x - 10 * s), Math.round(w.floor - 9 * s), 20 * s, 9 * s); ctx.restore();
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
      this.shelves = []; this.cakes = []; this.purrOn = opts.purrOn ?? true; this.meowOn = opts.meowOn ?? true; this.nightMode = opts.nightMode || "auto";
      this.pointer = { x: -1e4, y: -1e4, seen: false }; this.drag = null; this.onHover = opts.onHover || (() => {});
      this.floorInset = opts.floorInset ?? 6; this.audio = null; this.last = performance.now();
      this.resize(); addEventListener("resize", () => this.resize());
      this.bindInput();
      requestAnimationFrame((t) => this.frame(t));
    }
    resize() { this.W = innerWidth; this.H = innerHeight; this.canvas.width = this.W; this.canvas.height = this.H; this.canvas.style.width = this.W + "px"; this.canvas.style.height = this.H + "px"; this.floor = this.H - this.floorInset; }
    spot() { return rnd(this.W * 0.15, this.W * 0.85); }
    addCat(coat, profile) {
      coat = profile ? profile.coat : coat && COATS[coat] ? coat : COAT_KEYS[Math.floor(Math.random() * COAT_KEYS.length)];
      const c = new Cat(this, coat, this.spot());
      if (profile) { c.profile = profile; if (window.CatLife) { c.mods = window.CatLife.mods(profile); c.size = window.CatLife.size(profile.xp); } }
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
    feed() { if (!this.bowl) this.bowl = new Bowl(this, this.spot()); this.bowl.click(); }
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
    addShelf() { if (this.shelves.length >= 3) this.shelves.shift(); this.shelves.push(new Shelf(this, this.spot(), this.floor - rnd(110, 170) * this.toyScale)); }
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
      this.shelves = []; this.cakes = [];
      this.boxes.forEach((b) => { if (b.occupant) b.occupant.hopOut(); }); this.boxes = [];
    }
    burst(x, y, kind, color, n = 1, o = {}) {
      for (let i = 0; i < n; i++) this.parts.push({ x: x + rnd(-8, 8) * this.scale, y, vx: rnd(-30, 30), vy: o.rise ? -28 : rnd(-90, -40), life: kind === "z" ? 2.2 : 1.1, age: 0, kind, color });
    }
    // a soft synthesised meow: a buzzy voice with a little vibrato, shaped by three "mouth" formants
    // sliding from "mee" through "aa" to "ow", plus a breath of air. Kittens are higher and shorter.
    meow(cat) {
      if (!this.meowOn) return;
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
      for (let i = this.cats.length - 1; i >= 0; i--) if (this.cats[i].hit(x, y)) return { cat: this.cats[i] };
      for (let i = this.boxes.length - 1; i >= 0; i--) if (this.boxes[i].hit(x, y)) return { toy: this.boxes[i] };
      if (this.bowl && this.bowl.hit(x, y)) return { toy: this.bowl };
      if (this.catnip && this.catnip.hit(x, y)) return { toy: this.catnip };
      if (this.bed && this.bed.hit(x, y)) return { toy: this.bed };
      if (this.post && this.post.hit(x, y)) return { toy: this.post };
      for (const c of this.cakes) if (c.hit(x, y)) return { toy: c };
      for (let i = this.shelves.length - 1; i >= 0; i--) if (this.shelves[i].hit(x, y)) return { toy: this.shelves[i] };
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
        pos(e); const d = this.drag;
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
      for (const t of [this.wand, this.butterfly, this.catnip, this.bed, this.post, ...this.shelves, ...this.cakes]) if (t) t.update(dt);
      this.cats.forEach((c) => c.update(dt));
      if (this.isNight()) this.renderNight(ctx, now);
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
      if (this.wand) this.wand.render(ctx);
      if (this.laser && this.pointer.seen) this.renderLaser(ctx, now);
      this.renderParticles(ctx, dt);
      requestAnimationFrame((t) => this.frame(t));
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

  window.DesktopCat = { World, COATS, COAT_KEYS, SCALE_MIN: 1, SCALE_MAX: 6, portrait, WARDROBE };
})();
