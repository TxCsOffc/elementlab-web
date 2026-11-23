// Физика симуляций (перенос из Swift-версии)

// ── 1. Молекулярная динамика: потенциал Леннард-Джонса, термостат Берендсена ──
export class ParticleSim {
  n = 144;
  x = new Float64Array(144); y = new Float64Array(144);
  vx = new Float64Array(144); vy = new Float64Array(144);
  ax = new Float64Array(144); ay = new Float64Array(144);
  coord = new Int32Array(144);
  seeds = Array.from({length: 144}, () => Math.random());
  box = 16; targetT = 0.3; measuredT = 0.3;

  constructor() { this.reset(16); }

  reset(box: number) {
    this.box = box;
    const side = Math.ceil(Math.sqrt(this.n)), a = 1.12, off = (box - (side - 1) * a) / 2;
    for (let i = 0; i < this.n; i++) {
      const r = Math.floor(i / side), c = i % side;
      this.x[i] = off + c * a + (r % 2 ? a / 2 : 0); this.y[i] = off + r * a * 0.866 + 1;
      this.vx[i] = Math.random() - 0.5; this.vy[i] = Math.random() - 0.5;
    }
    this.forces();
  }

  setBox(b: number) {
    if (Math.abs(b - this.box) < 1e-6) return;
    const k = b / this.box;
    for (let i = 0; i < this.n; i++) { this.x[i] *= k; this.y[i] *= k; }
    this.box = b;
  }

  forces() {
    const {n, x, y, ax, ay, coord} = this;
    ax.fill(0); ay.fill(0); coord.fill(0);
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const dx = x[i] - x[j], dy = y[i] - y[j];
      let r2 = dx * dx + dy * dy;
      if (r2 > 6.25) continue;
      if (r2 < 1.96) { coord[i]++; coord[j]++; }
      r2 = Math.max(r2, 0.64);
      const inv2 = 1 / r2, inv6 = inv2 * inv2 * inv2, f = 24 * inv2 * inv6 * (2 * inv6 - 1);
      ax[i] += dx * f; ay[i] += dy * f; ax[j] -= dx * f; ay[j] -= dy * f;
    }
  }

  step(dt: number) {
    const {n, x, y, vx, vy, ax, ay, box} = this;
    for (let i = 0; i < n; i++) {
      vx[i] += ax[i] * dt / 2; vy[i] += ay[i] * dt / 2;
      x[i] += vx[i] * dt; y[i] += vy[i] * dt;
      if (x[i] < 0.5) { x[i] = 0.5; vx[i] = Math.abs(vx[i]); }
      if (x[i] > box - 0.5) { x[i] = box - 0.5; vx[i] = -Math.abs(vx[i]); }
      if (y[i] < 0.5) { y[i] = 0.5; vy[i] = Math.abs(vy[i]); }
      if (y[i] > box - 0.5) { y[i] = box - 0.5; vy[i] = -Math.abs(vy[i]); }
    }
    this.forces();
    let ke = 0;
    for (let i = 0; i < n; i++) { vx[i] += ax[i] * dt / 2; vy[i] += ay[i] * dt / 2; ke += (vx[i] ** 2 + vy[i] ** 2) / 2; }
    this.measuredT = ke / n;
    const lam = Math.sqrt(Math.max(0.85, Math.min(1.15, 1 + (dt / 0.4) * (this.targetT / Math.max(this.measuredT, 1e-4) - 1))));
    for (let i = 0; i < n; i++) { vx[i] *= lam; vy[i] *= lam; }
  }

  get density() { return this.n / (this.box * this.box); }
  get ionized() { return Math.max(0, Math.min(1, (this.targetT - 2.2) / 1.6)); }

  state(): [string, 'solid' | 'liquid' | 'gas' | 'supercritical' | 'plasma'] {
    if (this.ionized > 0.3) return ['плазма (показана условно)', 'plasma'];
    let solid = 0, dense = 0;
    for (const c of this.coord) { if (c >= 5) solid++; if (c >= 3) dense++; }
    const sf = solid / this.n, df = dense / this.n, t = this.targetT;
    if (t < 0.42 && sf > 0.55) return ['твёрдое — кристалл', 'solid'];
    if (t < 0.42 && df > 0.25) return ['кристаллики + пар', 'solid'];
    if (t > 0.53 && this.density > 0.3) return ['сверхкритический флюид', 'supercritical'];
    if (df > 0.6) return ['жидкость', 'liquid'];
    if (df > 0.2) return ['капли жидкости + пар', 'liquid'];
    return ['газ', 'gas'];
  }
}

// ── 2. Туннелирование: уравнение Шрёдингера, схема Кранка–Николсон ──
export class TunnelSim {
  n = 1000; dx = 0.1; hbar = 0.6582; dt = 0.02;
  re = new Float64Array(1000); im = new Float64Array(1000); v = new Float64Array(1000);
  time = 0; absL = 0; absR = 0;
  mass = 0.19; energy = 0.3; height = 0.5; width = 1.5; start = 50;
  // рабочие массивы
  private rr = new Float64Array(1000); private ri = new Float64Array(1000);
  private cr = new Float64Array(1000); private ci = new Float64Array(1000);
  private dr = new Float64Array(1000); private di = new Float64Array(1000);

  constructor() { this.reset(); }
  get a() { return 0.0381 / this.mass; }

  reset() {
    this.time = 0; this.absL = 0; this.absR = 0;
    const k0 = Math.sqrt(this.energy / this.a), x0 = 30, s = 3;
    let norm = 0;
    for (let j = 0; j < this.n; j++) {
      const x = j * this.dx, env = Math.exp(-((x - x0) ** 2) / (4 * s * s));
      this.re[j] = env * Math.cos(k0 * x); this.im[j] = env * Math.sin(k0 * x);
      norm += env * env;
      this.v[j] = x >= this.start && x < this.start + this.width ? this.height : 0;
    }
    norm = Math.sqrt(norm * this.dx);
    for (let j = 0; j < this.n; j++) { this.re[j] /= norm; this.im[j] /= norm; }
  }

  step() {
    const {n, re, im, v, rr, ri, cr, ci, dr, di} = this;
    const A = this.a / (this.dx * this.dx), beta = this.dt / (2 * this.hbar);
    // rhs = (1 − iβH)ψ
    for (let j = 0; j < n; j++) {
      const lr = j > 0 ? re[j - 1] : 0, li = j > 0 ? im[j - 1] : 0, rre = j < n - 1 ? re[j + 1] : 0, rim = j < n - 1 ? im[j + 1] : 0;
      const hr = re[j] * (2 * A + v[j]) - (lr + rre) * A, hi = im[j] * (2 * A + v[j]) - (li + rim) * A;
      rr[j] = re[j] + beta * hi; ri[j] = im[j] - beta * hr;
    }
    // (1 + iβH)ψ' = rhs, прогонка; off = −iβA
    const oR = 0, oI = -beta * A;
    for (let j = 0; j < n; j++) {
      let mR = 1, mI = beta * (2 * A + v[j]);
      let bR = rr[j], bI = ri[j];
      if (j > 0) {
        mR -= oR * cr[j - 1] - oI * ci[j - 1]; mI -= oR * ci[j - 1] + oI * cr[j - 1];
        bR -= oR * dr[j - 1] - oI * di[j - 1]; bI -= oR * di[j - 1] + oI * dr[j - 1];
      }
      const den = mR * mR + mI * mI;
      cr[j] = (oR * mR + oI * mI) / den; ci[j] = (oI * mR - oR * mI) / den;
      dr[j] = (bR * mR + bI * mI) / den; di[j] = (bI * mR - bR * mI) / den;
    }
    re[n - 1] = dr[n - 1]; im[n - 1] = di[n - 1];
    for (let j = n - 2; j >= 0; j--) {
      re[j] = dr[j] - (cr[j] * re[j + 1] - ci[j] * im[j + 1]);
      im[j] = di[j] - (cr[j] * im[j + 1] + ci[j] * re[j + 1]);
    }
    const edge = 80;
    for (let k = 0; k < edge; k++) {
      const f = 1 - 0.015 * ((edge - k) / edge) ** 2;
      for (const idx of [k, n - 1 - k]) {
        const lost = (re[idx] ** 2 + im[idx] ** 2) * (1 - f * f) * this.dx;
        if (idx === k) this.absL += lost; else this.absR += lost;
        re[idx] *= f; im[idx] *= f;
      }
    }
    this.time += this.dt;
  }

  get finished() { return this.absL + this.absR > 0.12 || this.time > 160; }

  get transmitted() {
    let s = 0;
    for (let j = Math.floor((this.start + this.width) / this.dx); j < this.n; j++) s += this.re[j] ** 2 + this.im[j] ** 2;
    return s * this.dx + this.absR;
  }

  get exact() {
    const V = this.height, E = this.energy, w = this.width, a = this.a;
    if (Math.abs(E - V) < 1e-6) return 1 / (1 + (V * w * w) / (4 * a));
    if (E < V) { const s = Math.sinh(Math.sqrt((V - E) / a) * w); return 1 / (1 + (V * V * s * s) / (4 * E * (V - E))); }
    const s = Math.sin(Math.sqrt((E - V) / a) * w); return 1 / (1 + (V * V * s * s) / (4 * E * (E - V)));
  }

  get wkb() { return this.energy >= this.height ? 1 : Math.exp(-2 * Math.sqrt((this.height - this.energy) / this.a) * this.width); }
}

// ── 3. Литография: изображение решётки 1:1 через объектив (когерентно / диполь) ──
export interface LithoSource { id: string; name: string; lambda: number; na: number }
export const LITHO_SOURCES: LithoSource[] = [
  {id: 'dry', name: 'DUV 193 нм, сухая (NA 0,93)', lambda: 193, na: 0.93},
  {id: 'imm', name: 'DUV 193 нм, иммерсия (NA 1,35)', lambda: 193, na: 1.35},
  {id: 'euv', name: 'EUV 13,5 нм (NA 0,33)', lambda: 13.5, na: 0.33},
  {id: 'hna', name: 'High-NA EUV (NA 0,55)', lambda: 13.5, na: 0.55},
  {id: 'hyper', name: 'Hyper-NA EUV (NA 0,75)', lambda: 13.5, na: 0.75},
];

const coef = (m: number) => (m === 0 ? 0.5 : Math.sin((Math.PI * m) / 2) / (Math.PI * m));

export function lithoPoles(src: LithoSource, pitch: number, offAxis: boolean) {
  if (!offAxis) return [0];
  const s = Math.min(src.lambda / (2 * pitch), 0.9 * src.na);
  return [s, -s];
}

export function lithoOrders(src: LithoSource, pitch: number, s: number) {
  const out: number[] = [];
  for (let m = -6; m <= 6; m++) if (Math.abs((m * src.lambda) / pitch + s) <= src.na) out.push(m);
  return out;
}

export function lithoIntensity(src: LithoSource, pitch: number, offAxis: boolean, x: number) {
  const poles = lithoPoles(src, pitch, offAxis);
  let sum = 0;
  for (const s of poles) {
    let r = 0, i = 0;
    for (const m of lithoOrders(src, pitch, s)) { const ph = (2 * Math.PI * m * x) / pitch; r += coef(m) * Math.cos(ph); i += coef(m) * Math.sin(ph); }
    sum += r * r + i * i;
  }
  return sum / poles.length;
}

// ── 4. Конденсат Бозе–Эйнштейна ──
export class BECSim {
  n = 600;
  ux = new Float64Array(600); uy = new Float64Array(600);
  wx = new Float64Array(600); wy = new Float64Array(600);
  rank = Array.from({length: 600}, () => Math.random());
  constructor() {
    const g = () => Math.sqrt(-2 * Math.log(Math.random() + 1e-12)) * Math.cos(2 * Math.PI * Math.random());
    for (let i = 0; i < this.n; i++) { this.ux[i] = g(); this.uy[i] = g(); this.wx[i] = g(); this.wy[i] = g(); }
  }
  jiggle(t: number) {
    const k = 0.06 * Math.min(1.5, t + 0.05), s = Math.sqrt(2 * k) * 1.2;
    for (let i = 0; i < this.n; i++) {
      this.ux[i] = this.ux[i] * (1 - k) + (Math.random() * 2 - 1) * s;
      this.uy[i] = this.uy[i] * (1 - k) + (Math.random() * 2 - 1) * s;
    }
  }
}
