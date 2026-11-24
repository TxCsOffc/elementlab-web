// Упрощённая термодинамическая модель фазовой диаграммы P–T (перенос из Swift-версии).
// Кипение — кусочный Клаузиус–Клапейрон через известные точки, возгонка — Клаузиус–Клапейрон
// с ΔHвозг = ΔHисп + ΔHпл, плавление — Симон–Глатцель, плазма — уравнение Саха, сверхтекучесть He — λ-линия.
import {element, isMetal, type Element} from './elements';
import {IONIZATION} from './exotic';
import {compound} from './compounds';
import {t} from '../i18n';

export type Phase = 'solid' | 'liquid' | 'gas' | 'supercritical' | 'plasma' | 'superfluid' | 'unknown';

export const PHASE_TITLE: Record<Phase, string> = {
  solid: t('Твёрдое'), liquid: t('Жидкость'), gas: t('Газ'), supercritical: t('Сверхкритический флюид'),
  plasma: t('Плазма'), superfluid: t('Сверхтекучая жидкость'), unknown: t('Нет данных'),
};
export const PHASE_SHORT: Record<Phase, string> = {
  solid: t('тв'), liquid: t('ж'), gas: t('газ'), supercritical: t('скф'), plasma: t('плазма'), superfluid: t('св.тек'), unknown: '?',
};
export const PHASE_COMPACT: Record<Phase, string> = {
  solid: t('ТВЁРДОЕ'), liquid: t('ЖИДКОСТЬ'), gas: t('ГАЗ'), supercritical: t('СВЕРХКРИТ.'), plasma: t('ПЛАЗМА'), superfluid: t('СВЕРХТЕК.'), unknown: '?',
};
/** Токены палитры данных для фаз */
export const PHASE_TOKEN: Record<Phase, string> = {
  solid: '--color-data-categorical-blue', liquid: '--color-data-categorical-teal', gas: '--color-data-categorical-orange',
  supercritical: '--color-data-categorical-purple', plasma: '--color-data-categorical-pink', superfluid: '--color-data-shamrock-3',
  unknown: '--color-data-neutral',
};
export const phaseColor = (p: Phase) => `var(${PHASE_TOKEN[p]})`;
export const ALL_PHASES: Phase[] = ['solid', 'liquid', 'gas', 'supercritical', 'plasma', 'superfluid'];

interface Anomalous { slope: number; turnP: number }

export const R = 8.314462618;

export interface PhaseModel {
  name: string;
  tt: number; pt: number; tc: number; pc: number;
  anchors: [number, number][];      // (1/T, lnP) по возрастанию T
  hs: number;
  simonA: number; simonC: number;
  anomalous?: Anomalous;
  heliumLike: boolean;
  tripleKnown: boolean; criticalKnown: boolean;
  sublimesAtOneAtm: boolean;
  ionization?: number;
}

export function pVap(m: PhaseModel, t: number) {
  const x = 1 / t, a = m.anchors;
  let i = 0;
  if (x >= a[0][0]) i = 0;
  else if (x <= a[a.length - 1][0]) i = a.length - 2;
  else while (i < a.length - 2 && x < a[i + 1][0]) i++;
  const [x0, y0] = a[i], [x1, y1] = a[i + 1];
  return Math.exp(y0 + ((y1 - y0) / (x1 - x0)) * (x - x0));
}

export const pSub = (m: PhaseModel, t: number) => m.pt * Math.exp(-(m.hs / R) * (1 / t - 1 / m.tt));

export function gasBoundary(m: PhaseModel, t: number) {
  if (m.heliumLike) return pVap(m, t);
  return t < m.tt ? pSub(m, t) : pVap(m, Math.min(t, m.tc));
}

export function tMelt(m: PhaseModel, p: number) {
  if (m.heliumLike) return Math.pow(1 + Math.max(0, p - 25) / 16.45, 1 / 1.555);
  if (p <= m.pt) return m.tt;
  const a = m.anomalous;
  if (a) {
    if (p <= a.turnP) return m.tt + a.slope * (p - m.pt);
    const t0 = m.tt + a.slope * (a.turnP - m.pt);
    return t0 * Math.pow(1 + (p - a.turnP) / m.simonA, 1 / m.simonC);
  }
  return m.tt * Math.pow(1 + (p - m.pt) / m.simonA, 1 / m.simonC);
}

export function isPlasma(m: PhaseModel, t: number, p: number) {
  if (!m.ionization || t <= 2000) return false;
  const kT = 8.617333e-5 * t;
  const lnS = Math.log(2.415e21) + 1.5 * Math.log(t) - m.ionization / kT;
  const lnN = Math.log((p * 101325) / (1.380649e-23 * t));
  return lnS - lnN > Math.log(0.5);
}

export const lambdaT = (p: number) => Math.max(1.6, 2.1768 - 0.0141 * (Math.max(p, 0.05) - 0.05));

function basePhase(m: PhaseModel, t: number, p: number): Phase {
  if (m.heliumLike) {
    if (p >= 25 && t < tMelt(m, p)) return 'solid';
    if (t >= m.tc) return p >= m.pc ? 'supercritical' : 'gas';
    return p > pVap(m, t) ? 'liquid' : 'gas';
  }
  if (t < m.tt) {
    if (p <= pSub(m, t)) return 'gas';
    return t < tMelt(m, p) ? 'solid' : 'liquid';
  }
  if (t < tMelt(m, p)) return 'solid';
  if (t < m.tc) return p > pVap(m, t) ? 'liquid' : 'gas';
  return p >= m.pc ? 'supercritical' : 'gas';
}

export function phaseAt(m: PhaseModel, t: number, p: number): Phase {
  const b = basePhase(m, t, p);
  if ((b === 'gas' || b === 'supercritical') && isPlasma(m, t, p)) return 'plasma';
  if (b === 'liquid' && m.heliumLike && t < lambdaT(p)) return 'superfluid';
  return b;
}

/** Температура, при которой давление насыщенного пара равно p (атм) */
export function temperatureForVapor(m: PhaseModel, p: number) {
  let lo = Math.max(0.5, m.tt * 0.02), hi = m.tc;
  if (p >= m.pc || gasBoundary(m, lo) > p) return undefined;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (gasBoundary(m, mid) < p) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

// ── Построение ──

const TRIPLE: Record<number, [number, number]> = {
  1: [13.8033, 0.0695], 6: [4600, 107], 7: [63.151, 0.1236], 8: [54.361, 0.0015], 10: [24.5561, 0.427],
  17: [172.22, 0.0137], 18: [83.8058, 0.68], 33: [1090, 35.8], 35: [265.9, 0.0576], 36: [115.775, 0.722],
  53: [386.65, 0.119], 54: [161.405, 0.805], 80: [234.3156, 1.65e-9],
};
const CRITICAL: Record<number, [number, number]> = {
  1: [32.94, 12.7], 2: [5.195, 2.245], 3: [3223, 661], 7: [126.2, 33.5], 8: [154.58, 50], 9: [144.4, 51.5],
  10: [44.4, 26.2], 11: [2573, 345], 15: [994, 42.6], 16: [1314, 204], 17: [416.9, 78.9], 18: [150.87, 48.3],
  19: [2223, 158], 34: [1766, 268], 35: [588, 102], 36: [209.4, 54.3], 37: [2093, 158], 53: [819, 115],
  54: [289.7, 57.6], 55: [1938, 92.8], 80: [1750, 1697], 86: [377, 62],
};
const ANOMALOUS: Record<number, Anomalous> = {
  14: {slope: -0.0059, turnP: 1e5}, 32: {slope: -0.003, turnP: 1e5}, 31: {slope: -0.0022, turnP: 1.2e4},
  83: {slope: -0.005, turnP: 1.7e4}, 51: {slope: -0.0005, turnP: 5e4},
};

export interface PhaseInput {
  name: string; tm: number; tb: number;
  triple?: [number, number]; crit?: [number, number];
  dSvap?: number; dSfus?: number; tcFactor?: number; simonA?: number; simonC?: number;
  anomalous?: Anomalous; helium?: boolean; ionization?: number;
}

export function buildModel(i: PhaseInput): PhaseModel {
  const {tm, tb, triple, crit} = i;
  const dSvap = i.dSvap ?? 88, dSfus = i.dSfus ?? 1.3 * R, tcFactor = i.tcFactor ?? 1.55;
  const simonA = i.simonA ?? 6e4, simonC = i.simonC ?? 3;
  const hf = dSfus * (triple?.[0] ?? tm);
  const base = {name: i.name, simonA, simonC, anomalous: i.anomalous, ionization: i.ionization};

  if (triple && tb < triple[0]) {
    const hs = (R * Math.log(triple[1])) / (1 / tb - 1 / triple[0]);
    const hv = Math.max(hs - hf, 0.4 * hs);
    let tc = crit?.[0] ?? triple[0] * 1.5;
    let pc = crit?.[1] ?? triple[1] * Math.exp(-(hv / R) * (1 / tc - 1 / triple[0]));
    if (!crit && pc > 5000) { pc = 5000; tc = 1 / (1 / triple[0] - (Math.log(pc / triple[1]) * R) / hv); }
    return {...base, tt: triple[0], pt: triple[1], tc, pc, hs, anchors: [[1 / triple[0], Math.log(triple[1])], [1 / tc, Math.log(pc)]],
      heliumLike: false, tripleKnown: true, criticalKnown: !!crit, sublimesAtOneAtm: true};
  }

  let pts: [number, number][] = [[tb, 1]];
  if (triple) pts.push(triple);
  if (crit) pts.push(crit);
  pts.sort((a, b) => a[0] - b[0]);
  let hvDefault = dSvap * tb;
  if (pts.length >= 2) hvDefault = (R * Math.log(pts[1][1] / pts[0][1])) / (1 / pts[0][0] - 1 / pts[1][0]);
  const extrap = (a: [number, number], t: number, hv: number) => a[1] * Math.exp(-(hv / R) * (1 / t - 1 / a[0]));

  const tt = triple?.[0] ?? Math.min(tm, tb * 0.999);
  if (!triple) pts.unshift([tt, extrap(pts[0], tt, hvDefault)]);
  if (!crit) {
    const last = pts[pts.length - 1];
    let hvLast = hvDefault;
    if (pts.length >= 2) { const a = pts[pts.length - 2]; hvLast = (R * Math.log(last[1] / a[1])) / (1 / a[0] - 1 / last[0]); }
    const hvUse = hvLast > 0 ? hvLast : hvDefault;
    let tc = tb * tcFactor, pc = extrap(last, tc, hvUse);
    if (pc > 5000) { pc = 5000; tc = 1 / (1 / last[0] - (Math.log(pc / last[1]) * R) / hvUse); }
    pts.push([tc, pc]);
  }
  pts = pts.sort((a, b) => a[0] - b[0]);
  const [first, second] = pts;
  const hvLow = (R * Math.log(second[1] / first[1])) / (1 / first[0] - 1 / second[0]);
  const c = pts[pts.length - 1];
  return {...base, tt: first[0], pt: first[1], tc: c[0], pc: c[1], hs: (hvLow > 0 ? hvLow : hvDefault) + hf,
    anchors: pts.map(([t, p]) => [1 / t, Math.log(p)] as [number, number]),
    heliumLike: !!i.helium, tripleKnown: !!triple, criticalKnown: !!crit, sublimesAtOneAtm: false};
}

function fromElement(e: Element): PhaseModel | undefined {
  if (e.melt === undefined || e.boil === undefined) return undefined;
  const c = e.category, metal = isMetal(c);
  const inp: PhaseInput = {name: e.name, tm: e.melt, tb: e.boil, triple: TRIPLE[e.z], crit: CRITICAL[e.z],
    dSvap: metal ? 100 : 88,
    dSfus: e.z === 6 || c === 'metalloid' ? 3.5 * R : c === 'noble' ? 1.7 * R : 1.3 * R,
    tcFactor: metal ? 2.2 : c === 'metalloid' ? 1.9 : 1.55,
    anomalous: ANOMALOUS[e.z], helium: e.z === 2, ionization: IONIZATION[e.z]};
  if (c === 'noble' || [1, 7, 8, 9, 17].includes(e.z)) { inp.simonA = 3000; inp.simonC = 1.6; }
  if (c === 'alkali') { inp.simonA = 1.5e4; inp.simonC = 2; }
  return buildModel(inp);
}

const WATER: PhaseModel = (() => {
  const pts: [number, number][] = [[273.16, 0.00604], [373.124, 1], [647.096, 217.75]];
  const hv0 = (R * Math.log(1 / 0.00604)) / (1 / 273.16 - 1 / 373.124);
  return {name: t('Вода'), tt: 273.16, pt: 0.00604, tc: 647.096, pc: 217.75, anchors: pts.map(([t, p]) => [1 / t, Math.log(p)] as [number, number]),
    hs: hv0 + 6010, simonA: 10700, simonC: 3, anomalous: {slope: -0.0105, turnP: 2100}, heliumLike: false,
    tripleKnown: true, criticalKnown: true, sublimesAtOneAtm: false, ionization: 12.62};
})();

const cache = new Map<number, PhaseModel | undefined>();

/** Модель по id: Z > 0 — элемент, 0 — вода, < 0 — соединение */
export function modelFor(id: number): PhaseModel | undefined {
  if (id === 0) return WATER;
  if (cache.has(id)) return cache.get(id);
  let m: PhaseModel | undefined;
  if (id > 0) { const e = element(id); m = e && fromElement(e); }
  else {
    const c = compound(id);
    if (c && !c.noDiagram && c.melt !== undefined && c.boil !== undefined) {
      const inp: PhaseInput = {name: c.name, tm: c.melt, tb: c.boil, triple: c.triple, crit: c.critical};
      if (c.bond === 'molecular') Object.assign(inp, {dSvap: 88, dSfus: 3.5 * R, tcFactor: 1.55, simonA: 3000, simonC: 1.8});
      else if (c.bond === 'metallic') Object.assign(inp, {dSvap: 100, dSfus: 1.3 * R, tcFactor: 2.2});
      else Object.assign(inp, {dSvap: 100, dSfus: 3 * R, tcFactor: 1.9});
      m = buildModel(inp);
    }
  }
  cache.set(id, m);
  return m;
}

export interface DiagramRange { tMin: number; tMax: number; logPMin: number; logPMax: number }

export function autoRange(m: PhaseModel): DiagramRange {
  const tMin = Math.max(0.3, m.tt * (m.heliumLike ? 0.1 : 0.15));
  const tMax = Math.max(m.tc * 1.3, m.tt * 1.6);
  const lo = Math.floor(Math.log10(Math.max(m.pt, 1e-30))) - 3;
  return {tMin, tMax, logPMin: Math.min(-5, Math.max(-14, lo)), logPMax: 6};
}
