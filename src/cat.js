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
  const M = { EMPTY: 0, BODY: 1, FAR: 2, BELLY: 3, ACCENT: 4, ACCENT2: 5, EYE: 6, NOSE: 7, EAR: 8, CLOSED: 9, TONGUE: 10, PUPIL: 11, FORCE_BELLY: 12 };

  class Raster {
    constructor(w = SW, h = SH) { this.w = w; this.h = h; this.m = new Uint8Array(w * h); this.part = new Uint8Array(w * h); }
    clear() { this.m.fill(0); this.part.fill(0); }
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
  const PART = { NONE: 0, HEAD: 1, BODY: 2, LEG: 3, TAIL: 4, EAR: 5, CHEST: 6 };

  // ---------------------------------------------------------------- body parts
  function headSide(R, cx, cy, o = {}) {
    // ears first so the head overlaps their base
    R.tri(cx - 4.5, cy - 2.5, cx - 2.5, cy - 8.5, cx - 0.2, cy - 3.5, M.BODY, PART.EAR);
    R.tri(cx - 0.5, cy - 3.6, cx + 2.2, cy - 8.8, cx + 4, cy - 2.6, M.BODY, PART.EAR);
    R.put(cx - 2.5, cy - 5.5, M.EAR, PART.EAR); R.put(cx + 1.8, cy - 5.8, M.EAR, PART.EAR); R.put(cx + 1.8, cy - 4.8, M.EAR, PART.EAR);
    R.ellipse(cx, cy, 5.8, 5.2, M.BODY, PART.HEAD);
    R.ellipse(cx + 4.2, cy + 1.6, 2.8, 2.2, M.BELLY, PART.HEAD);        // muzzle
    R.put(cx + 6.4, cy + 0.4, M.NOSE, PART.HEAD);
    const ex = cx + 2.2, ey = cy - 1;
    if (o.eyes === "closed") { R.put(ex - 1, ey + 1, M.CLOSED); R.put(ex, ey + 1, M.CLOSED); R.put(ex + 1, ey + 1, M.CLOSED); }
    else if (o.eyes === "happy") { R.put(ex - 1, ey + 1, M.CLOSED); R.put(ex, ey, M.CLOSED); R.put(ex + 1, ey + 1, M.CLOSED); }
    else if (o.eyes === "blink") { R.put(ex, ey + 1, M.CLOSED); R.put(ex + 1, ey + 1, M.CLOSED); }
    else {
      const lk = o.look || { x: 0.5, y: 0 };
      const px = lk.x < -0.3 ? ex : ex + 1, rows = lk.y < -0.4 ? [ey] : lk.y > 0.4 ? [ey + 1] : [ey, ey + 1];
      for (const yy of [ey, ey + 1]) for (const xx of [ex, ex + 1]) R.put(xx, yy, xx === px && rows.includes(yy) ? M.PUPIL : M.EYE);
    }
    if (o.tongue) R.put(cx + 5.6, cy + 3.4, M.TONGUE);
    if (o.yawn) {                                    // wide-open mouth
      R.put(cx + 3, cy + 2.6, M.PUPIL); R.put(cx + 4, cy + 2.6, M.PUPIL); R.put(cx + 5, cy + 2.6, M.PUPIL);
      R.put(cx + 3, cy + 3.6, M.TONGUE); R.put(cx + 4, cy + 3.6, M.TONGUE); R.put(cx + 5, cy + 3.6, M.PUPIL);
      R.put(cx + 4, cy + 4.6, M.BELLY, PART.HEAD); R.put(cx + 3, cy + 4.6, M.BELLY, PART.HEAD);
    }
  }
  function headFront(R, cx, cy, o = {}) {
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
    zoom(R, a) { POSES.run(R, a); },
    boop(R, a) { POSES.sit(R, { ...a, eyes: "happy" }); },
    inbox(R, a) { POSES.sit(R, { ...a, eyes: a.peekEyes }); },
    hunt(R, a) { POSES.crouch(R, a); },
  };

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

  function shade(R, P, out) {
    const d = out.data; d.fill(0);
    const tone = (m) => P[m] || P[M.BODY];
    for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) {
      const i = y * SW + x; let m = R.m[i]; if (!m) continue;
      let rgb;
      if (m === M.EYE) rgb = P.eye; else if (m === M.PUPIL) rgb = P.pupil; else if (m === M.NOSE) rgb = P.nose;
      else if (m === M.EAR) rgb = P.ear; else if (m === M.CLOSED) rgb = P.closed; else if (m === M.TONGUE) rgb = P.tongue;
      else {
        const far = m === M.FAR;
        let mm = m === M.FORCE_BELLY ? M.BELLY : patternMaterial(P, far ? M.BODY : m, R.part[i], x, y);
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

  class Cat {
    constructor(world, coat, x) {
      this.world = world; this.coat = coat; this.P = buildPalette(coat);
      this.x = x; this.y = 0; this.vx = 0; this.vy = 0; this.facing = Math.random() < 0.5 ? 1 : -1;
      this.R = new Raster(); this.canvas = document.createElement("canvas"); this.canvas.width = SW; this.canvas.height = SH;
      this.ctx = this.canvas.getContext("2d"); this.img = this.ctx.createImageData(SW, SH);
      this.t = rnd(0, 10); this.phase = 0; this.blinkT = rnd(2, 5); this.blink = false;
      this.boopCool = rnd(5, 15); this.fightCool = rnd(20, 40); this.peek = 0; this.peekTo = 0; this.fed = -1; this.look = null;
      this.set("sit", rnd(1, 3));
    }
    get s() { return this.world.scale; }
    set(state, dur = 3, extra = {}) {
      if (this.state === "inbox" && state !== "inbox" && this.box) { this.box.occupant = null; this.box = null; }
      this.state = state; this.stateT = 0; this.dur = dur; Object.assign(this, extra);
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
      const wt = { walk: 3, sit: 2, groom: 1.5, sleep: 1.1, roll: 1, zoom: 0.45 };
      const y = w.yarn;
      if (y) { if (y.held) wt.dangle = 6; else if (Math.abs(y.x - this.x) < w.W * 0.7) wt.yarn = 5; }
      if (w.mouse && w.mouse.running()) wt.mouse = 6;
      if (w.bowl && w.bowl.food > 0.05 && this.fed !== w.bowl.refill) wt.bowl = 9;
      const box = w.boxes.find((b) => !b.occupant && !b.held && !b.claimed);
      if (box) wt.box = 2.4;
      const foe = this.fightCool <= 0 && w.cats.find((o) => o !== this && o.fightCool <= 0 && ["walk", "sit", "groom", "roll"].includes(o.state) && Math.abs(o.x - this.x) < 260 * this.s / 3 * 3);
      if (foe) wt.fight = 1.4;
      if (wt.yarn || wt.mouse || wt.dangle) { wt.sleep = 0.2; wt.walk = 1.5; wt.fight = 0; }
      const n = pick(wt);
      if (n === "walk") { const m = SW * this.s; this.set("walk", 12, { target: clamp(this.x + rnd(-420, 420), m, w.W - m) }); }
      else if (n === "sit") this.set("sit", rnd(3, 8));
      else if (n === "groom") this.set("groom", rnd(3, 6));
      else if (n === "sleep") this.set("knead", rnd(2.5, 4));
      else if (n === "fight") {
        const d = rnd(4, 6.5);
        this.fightCool = foe.fightCool = rnd(40, 80);
        this.set("spar", d, { foe, act: "stance", actT: rnd(0.2, 0.6) }); foe.set("spar", d, { foe: this, act: "stance", actT: rnd(0.3, 0.8) });
        w.burst((this.x + foe.x) / 2, this.y - 30 * this.s, "spark", "#f7e48c", 1);
      }
      else if (n === "roll") this.set("roll", rnd(3, 5.5));
      else if (n === "zoom") this.set("zoom", rnd(2.4, 4), { target: this.x < w.W / 2 ? w.W - SW * this.s : SW * this.s, laps: 0 });
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
      }
      return null;
    }

    // ------------------------------------------------ physics + behaviour
    update(dt) {
      const w = this.world, s = this.s, floor = w.floor;
      this.t += dt; this.stateT += dt; this.boopCool -= dt; this.fightCool -= dt;
      this.blinkT -= dt; if (this.blinkT <= 0) { this.blink = !this.blink; this.blinkT = this.blink ? 0.14 : rnd(2, 6); }
      if (w.laser && !["chase", "leap", "stand", "held", "fall", "hunt"].includes(this.state)) this.think();

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
          if (Math.abs(dx) < 12 * s) { this.laps++; const m = SW * s; this.target = this.facing > 0 ? m : w.W - m; if (this.laps >= 2 || this.stateT > this.dur) this.set("sit", rnd(2, 4)); }
          break;
        }
        case "chase": this.updateChase(dt); break;
        case "hunt": {                                    // crouched, bottom wiggling, about to pounce
          const tx = this.goal === "laser" ? w.pointer.x : this.goal === "mouse" && w.mouse ? w.mouse.x + w.mouse.dir * w.mouse.speed * 0.4 : w.yarn ? w.yarn.x : this.x;
          this.facing = Math.sign(tx - this.x) || this.facing;
          if (this.stateT > this.dur) {
            const air = 0.42; this.vx = clamp((tx - this.x) / air, -320 * s / 3 * 3, 320 * s / 3 * 3); this.vy = -G * air / 2;
            this.set("leap", 3);
          }
          break;
        }
        case "leap": {
          this.vy += G * dt; this.x += this.vx * dt; this.y += this.vy * dt;
          this.paws((tx, ty) => this.contact(tx, ty));
          if (this.y >= floor) {
            this.y = floor; this.vy = 0; w.burst(this.x, floor, "dust", "rgba(140,120,100,.7)", 3);
            if (this.goalX() != null && Math.random() < 0.8) this.set("chase", this.goal === "laser" ? 30 : 6);
            else this.set("sit", 2.5);
          }
          break;
        }
        case "stand": {                                   // up on hind legs under a dangling toy
          const tx = this.goal === "laser" ? w.pointer.x : w.yarn ? w.yarn.x : this.x;
          this.facing = Math.sign(tx - this.x) || this.facing;
          this.x += clamp(tx - this.facing * 8 * s - this.x, -40 * s * dt, 40 * s * dt);
          this.paws((px, py) => this.contact(px, py));
          if (this.goalX() == null) { this.set("sit", 2); break; }
          if (this.stateT > this.dur) this.set("chase", this.goal === "laser" ? 30 : 8);
          break;
        }
        case "bat": {
          const y = w.yarn;
          if (y && !this.swatted && this.stateT > 0.18 && Math.abs(y.x - this.x) < 26 * s) {
            this.swatted = true; y.vx += this.facing * rnd(260, 520); y.vy -= rnd(160, 380); y.spin += this.facing * 8;
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
          this.vy += 1700 * dt; this.x += this.vx * dt; this.y += this.vy * dt; this.vx *= 0.995;
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
          if (this.stateT > this.dur) this.set("stretch", 1.4);
          break;
        }
        case "stretch": if (this.stateT > this.dur) this.set("yawn", 1.1); break;
        case "yawn": if (this.stateT > this.dur) this.set("sit", rnd(1.5, 3), { eyes: null }); break;
        default:
          if (this.stateT > this.dur) this.think();
      }
      const m = SW * s / 2; this.x = clamp(this.x, m, w.W - m);
      if (!["held", "fall", "leap", "inbox"].includes(this.state) && !(this.state === "spar" && this.vy)) this.y = floor;
      this.watchPointer(dt);
    }

    updateChase(dt) {
      const w = this.world, s = this.s, floor = w.floor;
      const tx = this.goalX();
      if (tx == null) { if (this.boxRef && this.boxRef.claimed === this) this.boxRef.claimed = null; this.set("sit", 1.5); return; }
      const dx = tx - this.x, g = this.goal;
      const reach = { yarn: 16, dangle: 9, mouse: 46, laser: 22, bowl: 3, box: 4 }[g] * s;
      if (Math.abs(dx) > reach) {
        this.facing = Math.sign(dx);
        const sp = (g === "bowl" || g === "box") ? 60 : g === "laser" ? 135 : 95;
        this.x += this.facing * Math.min(sp * s * dt, Math.abs(dx)); this.phase = (this.phase + dt * (sp > 70 ? 2.6 : 1.8)) % 1;
      } else {
        if (g === "yarn") {
          const y = w.yarn;
          if (y.y > floor - 30 * s) { if (Math.abs(y.vx) < 220 && Math.random() < 0.55) this.set("hunt", rnd(0.5, 1.1)); else this.set("bat", 0.7, { swatted: false }); }
        } else if (g === "mouse") this.set("hunt", rnd(0.25, 0.6));
        else if (g === "dangle" || g === "laser") {
          const ty = g === "laser" ? w.pointer.y : w.yarn.y, h = floor - ty;
          if (g === "laser" && h < 34 * s) this.set("hunt", rnd(0.2, 0.5));
          else if (h < 46 * s) this.set("stand", rnd(0.9, 1.6));
          else if (h < 150 * s && Math.random() < 0.035) { this.vx = this.facing * 20; this.vy = -Math.sqrt(2 * G * Math.min(h - 8 * s, 120 * s)); this.set("leap", 3); }
          else this.set("stand", 0.6);
        } else if (g === "bowl") { this.facing = Math.sign(w.bowl.x - this.x) || this.facing; this.set("eat", rnd(4, 7)); }
        else if (g === "box") {
          const b = this.boxRef; b.claimed = null;
          if (!b.occupant) { b.occupant = this; this.box = b; this.x = b.x; this.set("inbox", rnd(8, 22), { peek: 1, peekTo: 0, peekT: rnd(1, 2), box: b }); w.burst(b.x, floor - 22 * s, "note", "#b08d57", 1); }
          else this.think();
        }
      }
      if (g !== "laser" && this.state === "chase" && this.stateT > this.dur) this.think();
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
        y.vx += this.facing * rnd(220, 420); y.vy -= rnd(150, 320); y.spin += this.facing * 10; w.burst(y.x, y.y, "spark", "#f7e48c", 2);
      }
      const m = w.mouse;
      if (m && !m.held && Math.abs(m.x - px) < 14 * s && Math.abs(m.y - 4 * s - py) < 22 * s && m.airT <= 0) { m.kick(this.facing); w.burst(m.x, m.y - 6 * s, "spark", "#f7e48c", 3); }
      if (w.laser && Math.hypot(w.pointer.x - px, w.pointer.y - py) < 12 * s && Math.random() < 0.06) w.burst(w.pointer.x, w.pointer.y, "spark", "#ff5a5a", 1);
      if (this.touchedRecently) this.touchedRecently = Math.max(0, this.touchedRecently - 1 / 60) || 0;
    }
    // turn the head (and if needed the whole cat) towards the mouse pointer
    watchPointer(dt) {
      const w = this.world, s = this.s, p = w.pointer;
      const dx = p.x - this.x, dy = p.y - (this.y - 26 * s);
      const near = p.seen && !w.laser && Math.abs(dx) < 75 * s && p.y < w.floor + 4 && p.y > w.floor - 120 * s;
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
    tryBoop() {
      if (this.boopCool > 0) return;
      for (const o of this.world.cats) {
        if (o === this || o.boopCool > 0 || !["walk", "sit"].includes(o.state)) continue;
        const dx = o.x - this.x;
        if (Math.abs(dx) < 22 * this.s && Math.sign(dx) === this.facing) {
          this.facing = Math.sign(dx); o.facing = -this.facing;
          this.set("boop", 1.6); o.set("boop", 1.6); this.boopCool = o.boopCool = rnd(25, 45);
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
        case "chase": return (this.goal === "bowl" || this.goal === "box") ? "walk" : "run";
        case "spar": return (this.vy || this.y < this.world.floor) ? "leap" : this.act === "swipe" ? "swipe" : "spar";
        case "flee": case "pursue": return "run";
        case "happy": return "sit";
        default: return this.state in POSES ? this.state : "sit";
      }
    }

    render(ctx) {
      const R = this.R; R.clear();
      const a = { t: this.t, st: this.stateT, phase: this.phase, blink: this.blink, eyes: this.state === "happy" ? "happy" : this.eyes, peekEyes: null, look: this.look };
      POSES[this.pose()](R, a);
      shade(R, this.P, this.img);
      this.ctx.putImageData(this.img, 0, 0);
      const s = this.s, w = this.world, inbox = this.state === "inbox";
      const lift = Math.max(0, w.floor - this.y);
      if (!inbox) {
        ctx.save(); ctx.globalAlpha = Math.max(0.08, 0.28 - lift / 900); ctx.fillStyle = "#000";
        ctx.beginPath(); ctx.ellipse(this.x, w.floor + s, 13 * s * (1 - Math.min(lift, 300) / 600), 2.2 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      const dy = inbox ? Math.round((4 + this.peek * 14) * s) : 0;
      if (inbox) { ctx.beginPath(); ctx.rect(0, 0, w.W, this.y - 6 * s); ctx.clip(); }
      ctx.translate(Math.round(this.x), Math.round(this.y - GROUND * s + dy));
      if (this.facing < 0) ctx.scale(-1, 1);
      ctx.drawImage(this.canvas, Math.round(-SW * s / 2), 0, SW * s, SH * s);
      ctx.restore();
    }

    pet() {
      const w = this.world, s = this.s;
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
    get r() { return 7 * this.world.scale; }
    hit(px, py) { return Math.hypot(px - this.x, py - this.y) < Math.max(22, this.r * 2.2); }
    grab() { this.held = true; this.len = 46 * this.world.scale; this.cats("dangle"); }
    release() { this.held = false; this.vx = clamp(this.vx, -1600, 1600); this.vy = clamp(this.vy, -1600, 1600); this.cats("yarn"); }
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
      const w = this.world, s = w.scale, g = this.ctx, c = hex(this.color), L = lighten(c, 0.3), D = darken(c, 0.35), O = darken(c, 0.6);
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
    hit(px, py) { const s = this.world.scale; return Math.abs(px - this.x) < 11 * s && py > this.y - 12 * s && py < this.y + 3 * s; }
    grab() { this.held = true; }
    release() { this.held = false; this.airT = 1; }
    click() { this.wound = 25; this.speed = 110; this.world.burst(this.x, this.y - 12 * this.world.scale, "note", "#b08d57", 1); this.world.cats.forEach((c) => { if (!["sleep", "held", "fall", "inbox", "eat"].includes(c.state)) c.set("chase", 10, { goal: "mouse" }); }); }
    kick(dir) { this.vx = dir * rnd(180, 320); this.vy = -rnd(320, 520); this.airT = 1; this.dir = dir; this.wound = Math.max(this.wound, 8); this.speed = 170; }
    update(dt) {
      const w = this.world, s = w.scale, floor = w.floor;
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
      const w = this.world, s = w.scale, R = this.sp.R; R.clear();
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
    hit(px, py) { const s = this.world.scale; return Math.abs(px - this.x) < 16 * s && py > this.y - 22 * s && py < this.y + 2; }
    grab() { this.held = true; }
    release() { this.held = false; }
    click() { if (this.occupant) this.occupant.hopOut(); }
    update(dt) {
      const w = this.world;
      if (this.held) { this.x += (clamp(w.pointer.x, 16 * w.scale, w.W - 16 * w.scale) - this.x) * Math.min(1, dt * 14); this.y = Math.min(w.floor, w.pointer.y + 16 * w.scale); }
      else this.y += (w.floor - this.y) * Math.min(1, dt * 12);
    }
    render(ctx) {
      const w = this.world, s = w.scale, R = this.sp.R; R.clear();
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
    hit(px, py) { const s = this.world.scale; return Math.abs(px - this.x) < 12 * s && py > this.world.floor - 12 * s && py < this.world.floor + 2; }
    grab() { this.held = true; }
    release() { this.held = false; }
    click() {
      this.food = 1; this.refill++; this.world.burst(this.x, this.world.floor - 14 * this.world.scale, "note", "#b08d57", 2);
      this.world.cats.forEach((c) => { if (!["held", "fall", "inbox"].includes(c.state)) c.set("chase", 10, { goal: "bowl" }); });
    }
    update(dt) { const w = this.world; if (this.held) this.x += (clamp(w.pointer.x, 12 * w.scale, w.W - 12 * w.scale) - this.x) * Math.min(1, dt * 14); }
    render(ctx) {
      const w = this.world, s = w.scale, R = this.sp.R; R.clear();
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

  // ---------------------------------------------------------------- pixel glyphs for particles
  const GLYPH = {
    heart: ["01100110", "11111111", "11111111", "01111110", "00111100", "00011000"],
    z: ["11111", "00010", "00100", "01000", "11111"],
    spark: ["00100", "00100", "11011", "00100", "00100"],
    dust: ["0110", "1111", "0110"],
    note: ["00110", "00101", "00100", "11100", "11100"],
    crumb: ["11", "11"],
  };

  class World {
    constructor(canvas, opts = {}) {
      World.current = this;                         // handy for poking at the cats from the devtools console
      this.canvas = canvas; this.ctx = canvas.getContext("2d");
      this.scale = opts.scale || 3; this.cats = []; this.yarn = null; this.mouse = null; this.boxes = []; this.bowl = null; this.laser = false; this.parts = [];
      this.pointer = { x: -1e4, y: -1e4, seen: false }; this.drag = null; this.onHover = opts.onHover || (() => {});
      this.floorInset = opts.floorInset ?? 6; this.audio = null; this.last = performance.now();
      this.resize(); addEventListener("resize", () => this.resize());
      this.bindInput();
      requestAnimationFrame((t) => this.frame(t));
    }
    resize() { this.W = innerWidth; this.H = innerHeight; this.canvas.width = this.W; this.canvas.height = this.H; this.canvas.style.width = this.W + "px"; this.canvas.style.height = this.H + "px"; this.floor = this.H - this.floorInset; }
    spot() { return rnd(this.W * 0.15, this.W * 0.85); }
    addCat(coat) {
      coat = coat && COATS[coat] ? coat : COAT_KEYS[Math.floor(Math.random() * COAT_KEYS.length)];
      const c = new Cat(this, coat, this.spot()); c.y = -60; c.set("fall", 5); c.vx = 0; this.cats.push(c); return c;
    }
    removeCat() { const c = this.cats.pop(); if (c && c.box) c.box.occupant = null; }
    throwYarn(x, y) {
      this.yarn = new Yarn(this, x ?? this.spot(), y ?? this.floor - 260);
      this.yarn.vy = -200; this.yarn.vx = rnd(-360, 360); this.yarn.cats("yarn");
    }
    addMouse() { this.mouse = new WindupMouse(this, this.spot()); this.mouse.click(); }
    addBox() { if (this.boxes.length >= 3) this.boxes.shift(); const b = new Box(this, this.spot()); b.y = this.floor - 200; this.boxes.push(b); }
    feed() { if (!this.bowl) this.bowl = new Bowl(this, this.spot()); this.bowl.click(); }
    setLaser(on) { this.laser = on ?? !this.laser; if (!this.laser) this.cats.forEach((c) => { if (c.goal === "laser") c.set("sit", 2, { goal: null }); }); return this.laser; }
    clearToys() {
      this.yarn = null; this.mouse = null; this.bowl = null; this.setLaser(false);
      this.boxes.forEach((b) => { if (b.occupant) b.occupant.hopOut(); }); this.boxes = [];
    }
    burst(x, y, kind, color, n = 1, o = {}) {
      for (let i = 0; i < n; i++) this.parts.push({ x: x + rnd(-8, 8) * this.scale, y, vx: rnd(-30, 30), vy: o.rise ? -28 : rnd(-90, -40), life: kind === "z" ? 2.2 : 1.1, age: 0, kind, color });
    }
    purr() {
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
      for (let i = this.cats.length - 1; i >= 0; i--) if (this.cats[i].hit(x, y)) return { cat: this.cats[i] };
      for (let i = this.boxes.length - 1; i >= 0; i--) if (this.boxes[i].hit(x, y)) return { toy: this.boxes[i] };
      if (this.bowl && this.bowl.hit(x, y)) return { toy: this.bowl };
      return null;
    }
    bindInput() {
      const pos = (e) => { this.pointer.x = e.clientX; this.pointer.y = e.clientY; this.pointer.seen = true; this.pointer.movedAt = performance.now(); };
      addEventListener("pointermove", (e) => {
        pos(e); const d = this.drag;
        if (d && !d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 6) {
          d.moved = true;
          if (d.cat) d.cat.set("held", 1e9);
          if (d.toy && d.toy !== this.yarn) d.toy.grab();
        }
        this.onHover(!!d || !!this.hitTest(e.clientX, e.clientY));
      });
      addEventListener("pointerdown", (e) => {
        pos(e); const h = this.hitTest(e.clientX, e.clientY); if (!h) return;
        this.drag = { ...h, sx: e.clientX, sy: e.clientY, moved: false };
        if (h.toy === this.yarn) this.yarn.grab();               // the yarn sticks to the pointer straight away
        try { e.target.setPointerCapture?.(e.pointerId); } catch {}
      });
      addEventListener("pointerup", (e) => {
        pos(e); const d = this.drag; this.drag = null; if (!d) return;
        if (d.cat) { if (!d.moved) d.cat.pet(); else { d.cat.set("fall", 5); d.cat.vx = rnd(-60, 60); d.cat.vy = 0; } }
        if (d.toy) {
          if (d.toy === this.yarn) { if (d.moved) d.toy.release(); else { d.toy.held = false; d.toy.click(); } }
          else if (d.moved) d.toy.release(); else d.toy.click();
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
      this.cats.forEach((c) => c.update(dt));
      if (this.bowl) this.bowl.render(ctx);
      this.boxes.forEach((b) => { if (b.occupant) b.occupant.render(ctx); b.render(ctx); });
      if (this.mouse) this.mouse.render(ctx);
      if (this.yarn && !this.yarn.held) this.yarn.render(ctx);
      [...this.cats].filter((c) => c.state !== "inbox").sort((a, b) => (a.state === "held") - (b.state === "held")).forEach((c) => c.render(ctx));
      if (this.yarn && this.yarn.held) this.yarn.render(ctx);
      if (this.laser && this.pointer.seen) this.renderLaser(ctx, now);
      this.renderParticles(ctx, dt);
      requestAnimationFrame((t) => this.frame(t));
    }
    renderLaser(ctx, now) {
      const s = this.scale, p = this.pointer, j = Math.sin(now / 37) * 0.6;
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
        p.x += p.vx * dt; p.y += p.vy * dt; if (p.kind !== "z") p.vy += 60 * dt; else p.x += Math.sin(p.age * 3) * 0.6;
        const g = GLYPH[p.kind]; ctx.globalAlpha = 1 - p.age / p.life; ctx.fillStyle = p.color;
        const sc = p.kind === "z" ? s * (0.6 + p.age * 0.35) : s;
        for (let y = 0; y < g.length; y++) for (let x = 0; x < g[y].length; x++) if (g[y][x] === "1") ctx.fillRect(Math.round(p.x + x * sc), Math.round(p.y + y * sc), Math.ceil(sc), Math.ceil(sc));
      }
      ctx.globalAlpha = 1;
    }
  }

  window.DesktopCat = { World, COATS, COAT_KEYS, SCALE_MIN: 1, SCALE_MAX: 6 };
})();
