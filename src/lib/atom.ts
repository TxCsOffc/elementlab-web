// Электронная конфигурация: правило Клечковского (aufbau) + известные исключения
import {t} from '../i18n';

export interface Subshell { n: number; l: 's' | 'p' | 'd' | 'f'; count: number }

const ORDER: [number, Subshell['l']][] = [
  [1, 's'], [2, 's'], [2, 'p'], [3, 's'], [3, 'p'], [4, 's'], [3, 'd'], [4, 'p'], [5, 's'], [4, 'd'], [5, 'p'], [6, 's'],
  [4, 'f'], [5, 'd'], [6, 'p'], [7, 's'], [5, 'f'], [6, 'd'], [7, 'p'],
];
export const CAP: Record<Subshell['l'], number> = {s: 2, p: 6, d: 10, f: 14};

/** Отклонения от правила Клечковского: подоболочка → изменение числа электронов */
const EXCEPTIONS: Record<number, Record<string, number>> = {
  24: {'4s': -1, '3d': 1}, 29: {'4s': -1, '3d': 1},
  41: {'5s': -1, '4d': 1}, 42: {'5s': -1, '4d': 1}, 44: {'5s': -1, '4d': 1}, 45: {'5s': -1, '4d': 1}, 46: {'5s': -2, '4d': 2}, 47: {'5s': -1, '4d': 1},
  57: {'4f': -1, '5d': 1}, 58: {'4f': -1, '5d': 1}, 64: {'4f': -1, '5d': 1},
  78: {'6s': -1, '5d': 1}, 79: {'6s': -1, '5d': 1},
  89: {'5f': -1, '6d': 1}, 90: {'5f': -2, '6d': 2}, 91: {'5f': -1, '6d': 1}, 92: {'5f': -1, '6d': 1}, 93: {'5f': -1, '6d': 1}, 96: {'5f': -1, '6d': 1},
  103: {'6d': -1, '7p': 1},
};

export const isException = (z: number) => z in EXCEPTIONS;
export const isPredicted = (z: number) => z > 103;

export function configuration(z: number): Subshell[] {
  let left = z;
  const out: Subshell[] = [];
  for (const [n, l] of ORDER) {
    if (left <= 0) break;
    const c = Math.min(CAP[l], left);
    out.push({n, l, count: c});
    left -= c;
  }
  const ex = EXCEPTIONS[z];
  if (ex) for (const [key, d] of Object.entries(ex)) {
    const n = Number(key[0]), l = key[1] as Subshell['l'];
    const s = out.find((x) => x.n === n && x.l === l);
    if (s) s.count += d; else out.push({n, l, count: d});
  }
  return out.filter((s) => s.count > 0).sort((a, b) => a.n - b.n || 'spdf'.indexOf(a.l) - 'spdf'.indexOf(b.l));
}

const SUP: Record<string, string> = {'0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'};
const sup = (n: number) => String(n).split('').map((c) => SUP[c]).join('');
const fmtSub = (s: Subshell) => `${s.n}${s.l}${sup(s.count)}`;

const NOBLE: [number, string][] = [[86, 'Rn'], [54, 'Xe'], [36, 'Kr'], [18, 'Ar'], [10, 'Ne'], [2, 'He']];

export function fullConfig(z: number) { return configuration(z).map(fmtSub).join(' '); }

/** Короткая запись через остов благородного газа: [Ar] 3d¹⁰ 4s¹ */
export function shortConfig(z: number) {
  const core = NOBLE.find(([nz]) => nz < z);
  if (!core) return fullConfig(z);
  const coreSet = configuration(core[0]);
  const rest = configuration(z).map((s) => {
    const c = coreSet.find((x) => x.n === s.n && x.l === s.l);
    return {...s, count: s.count - (c?.count ?? 0)};
  }).filter((s) => s.count > 0);
  return `[${core[1]}] ` + rest.map(fmtSub).join(' ');
}

/** Электроны по оболочкам (модель Бора): K, L, M, N, O, P, Q */
export function shells(z: number) {
  const arr = [0, 0, 0, 0, 0, 0, 0];
  for (const s of configuration(z)) arr[s.n - 1] += s.count;
  return arr.filter((_, i) => arr.slice(i).some((x) => x > 0));
}

export const SHELL_NAMES = ['K', 'L', 'M', 'N', 'O', 'P', 'Q'];

/** Валентные подоболочки: внешняя s/p и незаполненные d/f */
export function valenceSubshells(z: number) {
  const cfg = configuration(z);
  const maxN = Math.max(...cfg.map((s) => s.n));
  const hasOuterP = cfg.some((s) => s.n === maxN && s.l === 'p');
  return cfg.filter((s) => s.n === maxN || (!hasOuterP && s.l === 'd' && s.n === maxN - 1) || (!hasOuterP && s.l === 'f' && s.n === maxN - 2 && s.count < 14));
}

/** Заполнение клеточек по правилу Хунда: сначала по одному, потом пары */
export function boxes(s: Subshell): (0 | 1 | 2)[] {
  const k = CAP[s.l] / 2;
  return Array.from({length: k}, (_, i) => (s.count >= k + i + 1 ? 2 : s.count > i ? 1 : 0));
}

/** Роль элемента как легирующей примеси в кремнии */
export function dopantRole(z: number): string | undefined {
  if ([5, 13, 31, 49].includes(z)) return t('В кремнии — акцептор (p-тип): у него 3 внешних электрона, на один меньше, чем у Si, и в решётке остаётся «дырка», которая проводит ток. Бор — главная p-примесь в чипах.');
  if ([15, 33, 51].includes(z)) return t('В кремнии — донор (n-тип): у него 5 внешних электронов, один лишний становится свободным носителем тока. Фосфор и мышьяк — главные n-примеси в чипах.');
  if (z === 14) return t('4 внешних электрона: каждый атом кремния делит их с 4 соседями — получается прочная решётка алмаза. Ровно 4 — поэтому чистый кремний почти не проводит, а одна примесь на миллион атомов меняет всё.');
  if (z === 32) return t('Как кремний, 4 внешних электрона, но связи слабее — запрещённая зона меньше (0,66 эВ), а дырки подвижнее.');
  if (z === 6) return t('4 внешних электрона, как у кремния, но атом меньше: алмаз — изолятор с рекордной теплопроводностью, графен — проводник без запрещённой зоны.');
  return undefined;
}
