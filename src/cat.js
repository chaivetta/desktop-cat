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
    constructor() { this.m = new Uint8Array(SW * SH); this.part = new Uint8Array(SW * SH); }
    clear() { this.m.fill(0); this.part.fill(0); }
    put(x, y, mat, part = 0) {
      x |= 0; y |= 0;
      if (x < 0 || y < 0 || x >= SW || y >= SH) return;
      const i = y * SW + x; this.m[i] = mat; this.part[i] = part;
    }
    get(x, y) { return (x < 0 || y < 0 || x >= SW || y >= SH) ? 0 : this.m[y * SW + x]; }
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
    else { R.put(ex, ey, M.EYE); R.put(ex, ey + 1, M.EYE); R.put(ex + 1, ey, M.PUPIL); R.put(ex + 1, ey + 1, M.PUPIL); }
    if (o.tongue) R.put(cx + 5.6, cy + 3.4, M.TONGUE);
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
      headSide(R, 29, 14, { eyes: a.eyes || (a.blink ? "blink" : null) });
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

  // ---------------------------------------------------------------- pixel glyphs for particles
  const GLYPH = {
    heart: ["01100110", "11111111", "11111111", "01111110", "00111100", "00011000"],
    z: ["11111", "00010", "00100", "01000", "11111"],
    spark: ["00100", "00100", "11011", "00100", "00100"],
    dust: ["0110", "1111", "0110"],
    note: ["00110", "00101", "00100", "11100", "11100"],
  };

  // ---------------------------------------------------------------- the world
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (weights) => { let s = 0; for (const k in weights) s += weights[k]; let r = Math.random() * s; for (const k in weights) { r -= weights[k]; if (r <= 0) return k; } return Object.keys(weights)[0]; };

  class Cat {
    constructor(world, coat, x) {
      this.world = world; this.coat = coat; this.P = buildPalette(coat);
      this.x = x; this.y = 0; this.vx = 0; this.vy = 0; this.facing = Math.random() < 0.5 ? 1 : -1;
      this.R = new Raster(); this.canvas = document.createElement("canvas"); this.canvas.width = SW; this.canvas.height = SH;
      this.ctx = this.canvas.getContext("2d"); this.img = this.ctx.createImageData(SW, SH);
      this.t = rnd(0, 10); this.phase = 0; this.blinkT = rnd(2, 5); this.blink = false;
      this.set("sit", rnd(1, 3));
    }
    get s() { return this.world.scale; }
    set(state, dur = 3, extra = {}) { this.state = state; this.stateT = 0; this.dur = dur; Object.assign(this, extra); }
    bounds() { const s = this.s; return { x: this.x - SW * s / 2, y: this.y - GROUND * s, w: SW * s, h: (GROUND + 2) * s }; }
    hit(px, py) { const b = this.bounds(); return px >= b.x + 6 * this.s && px <= b.x + b.w - 6 * this.s && py >= b.y + 4 * this.s && py <= b.y + b.h; }

    think() {
      const w = this.world, y = w.yarn;
      const nearYarn = y && Math.abs(y.x - this.x) < w.W * 0.6 && !y.held;
      const weights = { walk: 3, sit: 2, groom: 1.6, sleep: 1.1, roll: 1 };
      if (nearYarn) { weights.chase = 6; weights.sleep = 0.3; }
      const next = pick(weights);
      if (next === "walk") {
        const m = SW * this.s;
        this.target = Math.max(m, Math.min(w.W - m, this.x + rnd(-420, 420)));
        this.set("walk", 12);
      } else if (next === "sit") this.set("sit", rnd(3, 8));
      else if (next === "groom") this.set("groom", rnd(3, 6));
      else if (next === "sleep") this.set("sleep", rnd(12, 30));
      else if (next === "roll") this.set("roll", rnd(3, 5.5));
      else if (next === "chase") this.set("chase", 8);
    }

    update(dt) {
      const w = this.world, s = this.s, floor = w.floor;
      this.t += dt; this.stateT += dt;
      // blinking
      this.blinkT -= dt; if (this.blinkT <= 0) { this.blink = !this.blink; this.blinkT = this.blink ? 0.14 : rnd(2, 6); }

      switch (this.state) {
        case "walk": {
          const dx = this.target - this.x, sp = 34 * s;
          if (Math.abs(dx) < 4) { this.think(); break; }
          this.facing = Math.sign(dx); this.x += this.facing * sp * dt; this.phase = (this.phase + dt * 1.4) % 1;
          if (this.stateT > this.dur) this.think();
          break;
        }
        case "chase": {
          const y = w.yarn; if (!y || y.held) { this.set("sit", 2); break; }
          const dx = y.x - this.x; this.facing = Math.sign(dx) || this.facing;
          const reach = 16 * s;
          if (Math.abs(dx) < reach && y.y > floor - 30 * s) {
            if (Math.abs(y.vx) < 220 && Math.random() < 0.55) this.set("crouch", rnd(0.5, 1.1));
            else this.set("bat", 0.7, { swatted: false });
          } else {
            this.x += this.facing * 95 * s * dt; this.phase = (this.phase + dt * 2.6) % 1;
          }
          if (this.stateT > this.dur) this.set("sit", 2);
          break;
        }
        case "crouch": {
          const y = w.yarn; if (y) this.facing = Math.sign(y.x - this.x) || this.facing;
          if (this.stateT > this.dur) { this.vy = -330 * s / 3; this.vx = this.facing * 160 * s / 3; this.set("leap", 2); }
          break;
        }
        case "leap": {
          this.vy += 1500 * dt; this.x += this.vx * dt; this.y += this.vy * dt;
          const y = w.yarn;
          if (y && !y.held && Math.abs(y.x - this.x) < 18 * s && Math.abs(y.y - (this.y - 10 * s)) < 22 * s) {
            y.vx += this.facing * rnd(250, 480); y.vy -= rnd(120, 300); w.burst(y.x, y.y, "spark", "#f7e48c", 3);
          }
          if (this.y >= floor) { this.y = floor; this.vy = 0; w.burst(this.x, floor, "dust", "rgba(140,120,100,.7)", 3); this.set(Math.random() < 0.6 ? "chase" : "sit", Math.random() < 0.6 ? 6 : 2.5); }
          break;
        }
        case "bat": {
          const y = w.yarn;
          if (y && !this.swatted && this.stateT > 0.18 && Math.abs(y.x - this.x) < 26 * s) {
            this.swatted = true; y.vx += this.facing * rnd(260, 520); y.vy -= rnd(160, 380); y.spin += this.facing * 8;
            w.burst(y.x, y.y, "spark", "#f7e48c", 2);
          }
          if (this.stateT > this.dur) this.set("chase", 6);
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
          if (this.stateT > this.dur) this.set("sit", rnd(2, 4), { eyes: null });
          break;
        }
        default:
          if (this.stateT > this.dur) this.think();
      }
      // keep inside the screen
      const m = SW * s / 2; this.x = Math.max(m, Math.min(w.W - m, this.x));
      if (this.state !== "held" && this.state !== "fall" && this.state !== "leap") this.y = floor;
    }

    pose() {
      switch (this.state) {
        case "walk": return "walk";
        case "chase": return "run";
        case "happy": return "sit";
        default: return this.state in POSES ? this.state : "sit";
      }
    }

    render(ctx) {
      const R = this.R; R.clear();
      const a = { t: this.t, phase: this.phase, blink: this.blink, eyes: this.state === "happy" ? "happy" : this.eyes };
      POSES[this.pose()](R, a);
      shade(R, this.P, this.img);
      this.ctx.putImageData(this.img, 0, 0);
      const s = this.s, b = this.bounds();
      // soft contact shadow
      const lift = Math.max(0, this.world.floor - this.y);
      ctx.save();
      ctx.globalAlpha = Math.max(0.08, 0.28 - lift / 900);
      ctx.fillStyle = "#000";
      ctx.beginPath(); ctx.ellipse(this.x, this.world.floor + s, 13 * s * (1 - Math.min(lift, 300) / 600), 2.2 * s, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.translate(Math.round(this.x), Math.round(b.y));
      if (this.facing < 0) ctx.scale(-1, 1);
      ctx.drawImage(this.canvas, Math.round(-SW * s / 2), 0, SW * s, SH * s);
      ctx.restore();
    }

    pet() {
      if (this.state === "sleep") { this.set("sit", 1.5, { eyes: "blink" }); this.world.burst(this.x, this.y - 30 * this.s, "note", "#b08d57", 1); return; }
      this.set("happy", 2.6, { eyes: null });
      this.world.burst(this.x, this.y - 34 * this.s, "heart", "#e2557a", 3);
      this.world.purr();
    }
  }

  class Yarn {
    constructor(world, x, y) {
      this.world = world; this.x = x; this.y = y; this.vx = rnd(-200, 200); this.vy = 0; this.rot = 0; this.spin = 0;
      this.held = false; this.trail = []; this.color = ["#c8453c", "#3c7ac8", "#3ca068", "#c89a3c", "#8a4ac8"][Math.floor(Math.random() * 5)];
      this.canvas = document.createElement("canvas"); this.canvas.width = this.canvas.height = 15; this.ctx = this.canvas.getContext("2d");
    }
    get r() { return 7 * this.world.scale; }
    hit(px, py) { return Math.hypot(px - this.x, py - this.y) < this.r * 1.6; }
    update(dt) {
      const w = this.world, floor = w.floor - this.r;
      if (this.held) {
        const nx = w.pointer.x, ny = w.pointer.y;
        this.vx = (nx - this.x) / Math.max(dt, 1 / 120); this.vy = (ny - this.y) / Math.max(dt, 1 / 120);
        this.x = nx; this.y = ny;
      } else {
        this.vy += 1800 * dt; this.x += this.vx * dt; this.y += this.vy * dt;
        if (this.y > floor) { this.y = floor; if (Math.abs(this.vy) > 90) this.vy *= -0.45; else this.vy = 0; this.vx *= Math.pow(0.18, dt); }
        if (this.x < this.r) { this.x = this.r; this.vx = Math.abs(this.vx) * 0.6; }
        if (this.x > w.W - this.r) { this.x = w.W - this.r; this.vx = -Math.abs(this.vx) * 0.6; }
        if (this.y < this.r) { this.y = this.r; this.vy = Math.abs(this.vy) * 0.4; }
      }
      this.rot += (this.vx / this.r) * dt + this.spin * dt; this.spin *= Math.pow(0.2, dt);
      this.trail.push([this.x, this.y + this.r * 0.6]); if (this.trail.length > 26) this.trail.shift();
    }
    render(ctx) {
      const s = this.world.scale, g = this.ctx, c = hex(this.color), L = lighten(c, 0.3), D = darken(c, 0.35), O = darken(c, 0.6);
      g.clearRect(0, 0, 15, 15);
      const img = g.createImageData(15, 15), d = img.data;
      for (let y = 0; y < 15; y++) for (let x = 0; x < 15; x++) {
        const dx = x - 7, dy = y - 7, r = Math.hypot(dx, dy); if (r > 7.2) continue;
        let col;
        if (r > 6.3) col = O;
        else {
          const a = Math.atan2(dy, dx) + this.rot, band = Math.floor((dx * Math.cos(this.rot) + dy * Math.sin(this.rot) + 20) / 2) % 2;
          col = band ? c : D;
          if (dy < -3 && dx < 1) col = L;
          if (Math.sin(a * 3) > 0.92) col = L;
        }
        const o = (y * 15 + x) * 4; d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255;
      }
      g.putImageData(img, 0, 0);
      // loose thread
      ctx.save(); ctx.strokeStyle = this.color; ctx.lineWidth = Math.max(2, s * 0.9); ctx.lineCap = "round"; ctx.globalAlpha = 0.85;
      ctx.beginPath(); this.trail.forEach(([x, y], i) => { const wob = Math.sin(i * 0.9) * s; i ? ctx.lineTo(x + wob, Math.min(y + wob, this.world.floor)) : ctx.moveTo(x, y); }); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = "#000"; ctx.beginPath();
      ctx.ellipse(this.x, this.world.floor + s, this.r * 1.1, 2 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(this.canvas, Math.round(this.x - 7.5 * s), Math.round(this.y - 7.5 * s), 15 * s, 15 * s); ctx.restore();
    }
  }

  class World {
    constructor(canvas, opts = {}) {
      this.canvas = canvas; this.ctx = canvas.getContext("2d");
      this.scale = opts.scale || 3; this.cats = []; this.yarn = null; this.parts = [];
      this.pointer = { x: -1e4, y: -1e4, down: false }; this.drag = null; this.onHover = opts.onHover || (() => {});
      this.floorInset = opts.floorInset ?? 6; this.audio = null; this.last = performance.now();
      this.resize(); addEventListener("resize", () => this.resize());
      this.bindInput();
      requestAnimationFrame((t) => this.frame(t));
    }
    resize() {
      const dpr = 1; this.W = innerWidth; this.H = innerHeight;
      this.canvas.width = this.W * dpr; this.canvas.height = this.H * dpr;
      this.canvas.style.width = this.W + "px"; this.canvas.style.height = this.H + "px";
      this.floor = this.H - this.floorInset;
    }
    addCat(coat) {
      coat = coat && COATS[coat] ? coat : COAT_KEYS[Math.floor(Math.random() * COAT_KEYS.length)];
      const c = new Cat(this, coat, rnd(this.W * 0.2, this.W * 0.8)); c.y = -60; c.set("fall", 5); c.vx = 0; this.cats.push(c); return c;
    }
    removeCat() { this.cats.pop(); }
    throwYarn(x, y) {
      this.yarn = new Yarn(this, x ?? rnd(this.W * 0.2, this.W * 0.8), y ?? this.floor - 260);
      this.yarn.vy = -200; this.yarn.vx = rnd(-360, 360);
      this.cats.forEach((c) => { if (c.state !== "held" && c.state !== "sleep") c.set("chase", 8); });
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
      if (this.yarn && this.yarn.hit(x, y)) return { yarn: this.yarn };
      for (let i = this.cats.length - 1; i >= 0; i--) if (this.cats[i].hit(x, y)) return { cat: this.cats[i] };
      return null;
    }
    bindInput() {
      const pos = (e) => { this.pointer.x = e.clientX; this.pointer.y = e.clientY; };
      addEventListener("pointermove", (e) => {
        pos(e);
        if (this.drag && !this.drag.moved && Math.hypot(e.clientX - this.drag.sx, e.clientY - this.drag.sy) > 6) {
          this.drag.moved = true;
          if (this.drag.cat) { this.drag.cat.set("held", 1e9); }
          if (this.drag.yarn) { this.drag.yarn.held = true; }
        }
        this.onHover(!!this.drag || !!this.hitTest(e.clientX, e.clientY));
      });
      addEventListener("pointerdown", (e) => {
        pos(e); const h = this.hitTest(e.clientX, e.clientY); if (!h) return;
        this.drag = { ...h, sx: e.clientX, sy: e.clientY, moved: false, hist: [] };
        try { e.target.setPointerCapture?.(e.pointerId); } catch {}
      });
      addEventListener("pointerup", (e) => {
        pos(e); const d = this.drag; this.drag = null; if (!d) return;
        if (d.cat) {
          if (!d.moved) d.cat.pet();
          else { d.cat.set("fall", 5); d.cat.vx = rnd(-60, 60); d.cat.vy = 0; }
        }
        if (d.yarn) {
          if (d.moved) { d.yarn.held = false; d.yarn.vx = Math.max(-1600, Math.min(1600, d.yarn.vx)); d.yarn.vy = Math.max(-1600, Math.min(1600, d.yarn.vy)); this.cats.forEach((c) => { if (c.state !== "sleep") c.set("chase", 8); }); }
          else { d.yarn.vy = -420; d.yarn.vx = rnd(-300, 300); }
        }
        this.onHover(!!this.hitTest(e.clientX, e.clientY));
      });
      addEventListener("blur", () => { if (this.drag) { if (this.drag.cat) this.drag.cat.set("fall", 5); if (this.drag.yarn) this.drag.yarn.held = false; this.drag = null; } });
    }
    frame(now) {
      const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
      const ctx = this.ctx; ctx.clearRect(0, 0, this.W, this.H);
      if (this.yarn) this.yarn.update(dt);
      this.cats.forEach((c) => c.update(dt));
      // cats far apart look nicer: draw back-to-front by state (held on top)
      const order = [...this.cats].sort((a, b) => (a.state === "held") - (b.state === "held"));
      if (this.yarn) this.yarn.render(ctx);
      order.forEach((c) => c.render(ctx));
      this.renderParticles(ctx, dt);
      requestAnimationFrame((t) => this.frame(t));
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

  window.DesktopCat = { World, COATS, COAT_KEYS };
})();
