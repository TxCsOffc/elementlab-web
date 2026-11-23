import {element} from './elements';
import {num, sci} from './fmt';

// ── Материалы канала ──
export interface ChannelMaterial {
  id: string; name: string; eg: number; mEff: number; mobility: number; eps: number; thickness: number; contact: number;
  is2D: boolean; lowTempOK: boolean; trl: number; risk: number; costAdd: number; rc0: number; lt: number; note: string;
}

export const CHANNELS: ChannelMaterial[] = [
  {id: 'Si', name: 'Кремний (Si)', eg: 1.12, mEff: 0.19, mobility: 300, eps: 11.7, thickness: 5, contact: 18, is2D: false, lowTempOK: false, trl: 9, risk: 0, costAdd: 0, rc0: 60, lt: 8,
    note: 'Основа индустрии. Тоньше ~3–4 нм подвижность резко падает (рассеяние на шероховатости).'},
  {id: 'Ge', name: 'Германий (Ge)', eg: 0.66, mEff: 0.08, mobility: 600, eps: 16, thickness: 5, contact: 18, is2D: false, lowTempOK: false, trl: 6, risk: 0.1, costAdd: 0.05, rc0: 100, lt: 8,
    note: 'Быстрые дырки, но лёгкая масса → туннелирование исток-сток при коротком затворе.'},
  {id: 'InGaAs', name: 'InGaAs', eg: 0.75, mEff: 0.041, mobility: 2000, eps: 13.9, thickness: 5, contact: 16, is2D: false, lowTempOK: false, trl: 6, risk: 0.3, costAdd: 0.25, rc0: 80, lt: 10,
    note: 'Огромная подвижность, но очень лёгкие электроны — плохо выключается на коротком канале.'},
  {id: 'MoS2', name: 'MoS₂ (монослой)', eg: 1.8, mEff: 0.48, mobility: 120, eps: 6.4, thickness: 0.65, contact: 10, is2D: true, lowTempOK: true, trl: 5, risk: 0.5, costAdd: 0.2, rc0: 120, lt: 15,
    note: 'Канал толщиной в 3 атома. Тяжёлые электроны подавляют туннелирование. Затвор 1 нм показан в 2016 г. (Desai et al., Science).'},
  {id: 'WSe2', name: 'WSe₂ (монослой)', eg: 1.65, mEff: 0.33, mobility: 150, eps: 7.3, thickness: 0.7, contact: 10, is2D: true, lowTempOK: true, trl: 4, risk: 0.55, costAdd: 0.22, rc0: 500, lt: 20,
    note: 'Кандидат на p-канал для 2D CMOS. Проблема — контакты с низким сопротивлением.'},
  {id: 'WS2', name: 'WS₂ (монослой)', eg: 2.0, mEff: 0.28, mobility: 100, eps: 6.4, thickness: 0.62, contact: 10, is2D: true, lowTempOK: true, trl: 4, risk: 0.55, costAdd: 0.22, rc0: 300, lt: 15,
    note: 'Широкая зона, хорошо выключается.'},
  {id: 'Bi2O2Se', name: 'Bi₂O₂Se', eg: 0.8, mEff: 0.14, mobility: 300, eps: 21, thickness: 1.2, contact: 10, is2D: true, lowTempOK: true, trl: 3, risk: 0.65, costAdd: 0.3, rc0: 300, lt: 15,
    note: '2D-полупроводник с собственным high-k оксидом (Bi₂SeO₅). Лабораторная стадия.'},
  {id: 'CNT', name: 'Углеродные нанотрубки', eg: 0.65, mEff: 0.07, mobility: 3000, eps: 3, thickness: 1.2, contact: 10, is2D: true, lowTempOK: true, trl: 4, risk: 0.75, costAdd: 0.3, rc0: 150, lt: 10,
    note: 'Отличный транспорт, но нужна чистота > 99,9999 % полупроводниковых трубок и плотная выкладка.'},
  {id: 'BP', name: 'Чёрный фосфор', eg: 0.6, mEff: 0.15, mobility: 600, eps: 8.3, thickness: 2, contact: 10, is2D: true, lowTempOK: true, trl: 3, risk: 0.9, costAdd: 0.35, rc0: 300, lt: 15,
    note: 'Деградирует на воздухе за часы — нужна идеальная инкапсуляция.'},
  {id: 'Gr', name: 'Графен', eg: 0, mEff: 0, mobility: 10000, eps: 3, thickness: 0.34, contact: 10, is2D: true, lowTempOK: true, trl: 4, risk: 0.9, costAdd: 0.2, rc0: 1000, lt: 20,
    note: 'Нет запрещённой зоны → логический транзистор не выключается. Годится для межсоединений/контактов.'},
];

// ── Архитектуры ──
export interface DeviceArch { id: string; name: string; k: number; stack: number; tracks: number; costAdd: number; risk: number; trl: number; needsLowTemp: boolean; bulkOnly: boolean; note: string }
export const ARCHS: DeviceArch[] = [
  {id: 'fin', name: 'FinFET', k: 2, stack: 1, tracks: 6, costAdd: 0, risk: 0, trl: 9, needsLowTemp: false, bulkOnly: true, note: 'Затвор с трёх сторон. До «3 нм» поколения.'},
  {id: 'gaa', name: 'GAA-нанолисты', k: 2.6, stack: 1, tracks: 5, costAdd: 0.1, risk: 0.05, trl: 9, needsLowTemp: false, bulkOnly: false, note: 'Затвор со всех сторон. «2 нм» класс (2025–2026).'},
  {id: 'fork', name: 'Forksheet', k: 2.6, stack: 1, tracks: 4.5, costAdd: 0.15, risk: 0.15, trl: 6, needsLowTemp: false, bulkOnly: false, note: 'n и p разделены тонкой стенкой — меньше зазор.'},
  {id: 'cfet', name: 'CFET (n над p)', k: 2.6, stack: 2, tracks: 4, costAdd: 0.3, risk: 0.35, trl: 5, needsLowTemp: false, bulkOnly: false, note: 'Два транзистора друг над другом — площадь ×0,5.'},
  {id: 'm3d', name: '3D: 4 яруса 2D', k: 2.6, stack: 4, tracks: 4, costAdd: 0.9, risk: 0.6, trl: 3, needsLowTemp: true, bulkOnly: false, note: 'Монолитные ярусы. Каждый ярус ≤ 450 °C, иначе портится нижний.'},
];

// ── Металлы межсоединений ──
export interface WireMetal { z: number; rho0: number; lambda: number; barrier: number; trl: number; risk: number; note: string }
export const METALS: WireMetal[] = [
  {z: 29, rho0: 1.68, lambda: 39.9, barrier: 2, trl: 9, risk: 0, note: 'Нужен барьер TaN/Ta — он съедает сечение узких линий.'},
  {z: 47, rho0: 1.59, lambda: 53.3, barrier: 2, trl: 4, risk: 0.3, note: 'Лучший объёмный проводник, но большой пробег и диффузия.'},
  {z: 13, rho0: 2.65, lambda: 18.9, barrier: 0.5, trl: 5, risk: 0.4, note: 'Дешёвый и неплох на узких линиях, но быстро разрушается электромиграцией (Tпл всего 660 °C).'},
  {z: 74, rho0: 5.28, lambda: 15.5, barrier: 1, trl: 9, risk: 0, note: 'Контакты/локальные линии.'},
  {z: 42, rho0: 5.34, lambda: 11.2, barrier: 0, trl: 7, risk: 0, note: 'Без барьера, дешевле рутения.'},
  {z: 27, rho0: 6.2, lambda: 11.8, barrier: 0.5, trl: 9, risk: 0, note: 'Используется в M0/M1 с 10 нм.'},
  {z: 44, rho0: 7.6, lambda: 6.6, barrier: 0, trl: 7, risk: 0, note: 'Короткий пробег + без барьера → выигрывает у Cu на узких линиях. Очень редкий.'},
  {z: 45, rho0: 4.7, lambda: 6.9, barrier: 0, trl: 4, risk: 0.1, note: 'Лучший по ρ·λ, но редчайший и дорогой.'},
  {z: 77, rho0: 5.1, lambda: 7.1, barrier: 0, trl: 4, risk: 0.1, note: 'Отличный ρ·λ, редкий.'},
  {z: 28, rho0: 6.93, lambda: 5.9, barrier: 0.5, trl: 4, risk: 0.2, note: 'Короткий пробег, но магнитный и реакционноспособный.'},
];
export const metalElement = (m: WireMetal) => element(m.z)!;

function msFactor(a: number) {
  if (a > 5) return 3 * (1 / (4 * a) - 1 / (5 * a * a) + 1 / (6 * a ** 3) - 1 / (7 * a ** 4));
  return 3 * (1 / 3 - a / 2 + a * a - a ** 3 * Math.log(1 + 1 / a));
}

/** Эффективное удельное сопротивление, мкОм·см (Майадас–Шацкес + Фукс–Зондхаймер) */
export function wireRho(m: WireMetal, w: number, h: number) {
  const wc = w - 2 * m.barrier, hc = h - m.barrier;
  if (wc <= 0.5 || hc <= 0.5) return Infinity;
  const alpha = (m.lambda / wc) * (0.4 / 0.6);
  return m.rho0 / Math.max(1e-6, msFactor(alpha)) + m.rho0 * 0.375 * m.lambda * (1 / wc + 1 / hc);
}

/** Сопротивление линии, Ом/мкм */
export function wireR(m: WireMetal, w: number, aspect: number) {
  const h = w * aspect, wc = w - 2 * m.barrier, hc = h - m.barrier;
  if (wc <= 0.5 || hc <= 0.5) return Infinity;
  return (wireRho(m, w, h) * 1e4) / (wc * hc);
}

export function minWidth(m: WireMetal, limit: number, aspect: number) {
  for (let w = 2; w < 200; w += 0.25) if (wireR(m, w, aspect) <= limit) return w;
  return 200;
}

// ── Физика канала ──
export const barrier = (m: ChannelMaterial) => Math.min(0.5 * m.eg, 0.5);
export const tunneling = (m: ChannelMaterial, L: number) => (m.eg <= 0 ? 1 : Math.exp(-7.68 * Math.sqrt(m.mEff * barrier(m)) * L));
export const lambdaLen = (m: ChannelMaterial, t: number, eot: number, k: number) => Math.sqrt((m.eps * t * eot) / (k * 3.9));
export function ss(L: number, lam: number) { const d = 1 - 2 * Math.exp(-L / (2 * lam)); return d <= 0.05 ? 1200 : 60 / d; }
export const lMinSS = (lam: number, ssMax: number) => -2 * lam * Math.log((1 - 60 / ssMax) / 2);
export const lMinTun = (m: ChannelMaterial, target: number) => (m.eg <= 0 ? Infinity : -Math.log(target) / (7.68 * Math.sqrt(m.mEff * barrier(m))));

export function gateLimit(m: ChannelMaterial, t: number, eot: number, k: number, ssMax: number, leak: number) {
  const lSS = lMinSS(lambdaLen(m, t, eot, k), ssMax), lTun = lMinTun(m, leak);
  return {lSS, lTun, lMin: Math.max(lSS, lTun, 1), by: lSS >= lTun ? 'электростатика (SS)' : 'туннелирование исток-сток'};
}

// ── Литография ──
export interface Patterning {
  id: string; name: string; family: string; pitchToday: number; pitchPotential: number; cost: number; defect: number; trl: number;
  wph: number; tool: string; year: number; potential: number; players: string; principle: string; pros: string[]; cons: string[];
}

export const PATTERNING: Patterning[] = [
  {id: 'hna', name: 'High-NA EUV 0,55', family: 'EUV-оптика', pitchToday: 16, pitchPotential: 14, cost: 5.5, defect: 0.15, trl: 7, wph: 175, tool: '≈ $380 млн', year: 2027, potential: 5,
    players: 'ASML EXE:5000/5200 · Intel 14A · imec · TSMC, Samsung (оценивают)',
    principle: 'Тот же свет 13,5 нм, но апертура 0,55 вместо 0,33: разрешение лучше в 1,7 раза. Анаморфная оптика уменьшает рисунок в 8× по одной оси и в 4× по другой.',
    pros: ['Шаг 16 нм за одну экспозицию', 'Заменяет двойную EUV-экспозицию: меньше шагов и ошибок совмещения', 'Сканеры уже стоят на фабриках'],
    cons: ['Сканер ≈ $380 млн', 'Поле вдвое меньше → большие кристаллы нужно сшивать', 'Малая глубина резкости → резист тоньше 30 нм']},
  {id: 'dsaeuv', name: 'EUV + самосборка (DSA)', family: 'Самосборка', pitchToday: 18, pitchPotential: 12, cost: 4, defect: 0.3, trl: 5, wph: 220, tool: 'EUV-сканер + трек для полимера', year: 2029, potential: 5,
    players: 'imec · Merck (EMD Electronics) · Brewer Science · Tokyo Electron',
    principle: 'EUV печатает грубый направляющий рисунок, а блок-сополимер при отжиге сам раскладывается в идеально ровные линии. Шаг делится в 2–3 раза, края выпрямляются.',
    pros: ['Плотность почти даром: полимер и отжиг вместо второй экспозиции', 'Исправляет шероховатость EUV → можно снизить дозу', 'Шаг 12 нм достижим с high-χ полимерами'],
    cons: ['Дефектов пока больше нормы (цель — меньше 0,01 на см²)', 'Только регулярные рисунки: линии и отверстия', 'Нужны новые полимеры и контроль отжига']},
  {id: 'fel', name: 'EUV на лазере на свободных электронах', family: 'Новый источник', pitchToday: 16, pitchPotential: 13, cost: 3.8, defect: 0.1, trl: 3, wph: 300, tool: 'ускоритель ≈ $1 млрд на 10–20 сканеров (оценка)', year: 2030, potential: 4,
    players: 'xLight (США) · KEK (Япония) · исследования ASML',
    principle: 'Вместо вспышек оловянной плазмы свет излучает пучок электронов в ускорителе. Мощность — киловатты на сканер против ~0,6 кВт сейчас.',
    pros: ['В разы больше света → выше производительность и дешевле слой', 'Высокая доза убирает случайные дефекты (стохастику)', 'Нет оловянного мусора на зеркалах'],
    cons: ['Ускоритель размером с цех — одна точка отказа на всю фабрику', 'Пока только прототипы и проекты', 'Нужна новая инфраструктура вывода пучка']},
  {id: 'nil', name: 'Наноимпринт (NIL)', family: 'Без оптики', pitchToday: 28, pitchPotential: 20, cost: 1.2, defect: 0.45, trl: 6, wph: 80, tool: '≈ в 10 раз дешевле EUV', year: 2026, potential: 4,
    players: 'Canon FPA-1200NZ2C · Kioxia (3D NAND) · Dai Nippon Printing (шаблоны)',
    principle: 'Кварцевый штамп с готовым рисунком вдавливают в жидкий резист и засвечивают УФ. Разрешение задаёт шаблон, а не длина волны света.',
    pros: ['Сканер и энергопотребление ≈ в 10 раз меньше, чем у EUV', 'Линии 14 нм уже показаны', 'Линии и переходы можно отпечатать за один шаг'],
    cons: ['Контактный процесс: каждая частица — дефект', 'Шаблон изнашивается', 'Совмещение ≈ 2 нм, а логике нужно ≈ 1 нм → пока в основном для памяти']},
  {id: 'hnasadp', name: 'High-NA EUV + спейсеры (SADP)', family: 'EUV-оптика', pitchToday: 12, pitchPotential: 10, cost: 8.5, defect: 0.25, trl: 4, wph: 175, tool: '≈ $380 млн + оборудование осаждения', year: 2031, potential: 4,
    players: 'дорожная карта imec для поколений A7–A5',
    principle: 'High-NA печатает линии с шагом ~22–24 нм, на их стенках осаждают спейсеры и убирают «сердечник» — шаг делится пополам.',
    pros: ['Шаг 10–12 нм без новых сканеров', 'Спейсерные процессы хорошо отработаны'], cons: ['Дорого: High-NA плюс дополнительные шаги', 'Жёсткие допуски на ошибку краёв (EPE)']},
  {id: 'euvsadp', name: 'EUV 0,33 + двойное формирование', family: 'EUV-оптика', pitchToday: 21, pitchPotential: 18, cost: 6, defect: 0.15, trl: 9, wph: 220, tool: '≈ $200 млн', year: 2022, potential: 3,
    players: 'TSMC N3/N2 · Samsung SF3/SF2 · Intel 18A',
    principle: 'Две экспозиции EUV или EUV плюс спейсеры делят шаг пополам.',
    pros: ['Работает в массовом производстве прямо сейчас'], cons: ['Удваивает стоимость критических слоёв', 'Ошибки совмещения между проходами']},
  {id: 'euv', name: 'EUV 0,33 NA', family: 'EUV-оптика', pitchToday: 28, pitchPotential: 24, cost: 3.5, defect: 0.1, trl: 9, wph: 220, tool: '≈ $200 млн', year: 2019, potential: 3,
    players: 'ASML NXE:3800E · TSMC · Samsung · Intel · SK hynix',
    principle: 'Свет 13,5 нм от капель олова, испаряемых лазером. Вместо линз зеркала, всё работает в вакууме.',
    pros: ['Одна экспозиция там, где DUV нужно 3–4', 'Отлаженная экосистема масок и резистов'], cons: ['Стохастика: при малой дозе случайные обрывы и мостики', 'Мало мощности источника → дорогая доза']},
  {id: 'dsaduv', name: 'DUV + самосборка (high-χ)', family: 'Самосборка', pitchToday: 16, pitchPotential: 12, cost: 1.6, defect: 0.55, trl: 4, wph: 295, tool: 'DUV-сканер ≈ $80 млн + трек', year: 2031, potential: 3,
    players: 'исследования: imec, MIT, KAIST, институты КНР',
    principle: 'Старый DUV-сканер печатает направляющие с шагом ~80 нм, а полимер с высоким χ делит его в 5–6 раз.',
    pros: ['Самый дешёвый путь к шагу меньше 20 нм', 'Не нужен EUV — важно при санкциях'], cons: ['Высокая дефектность', 'Большая кратность деления → любая ошибка направляющей размножается']},
  {id: 'duvsaqp', name: 'DUV 193i + SAQP', family: 'DUV-оптика', pitchToday: 30, pitchPotential: 26, cost: 3, defect: 0.15, trl: 9, wph: 295, tool: '≈ $80 млн', year: 2017, potential: 2,
    players: 'ASML NXT:2100i · Nikon · SMIC (класс 7–5 нм без EUV)',
    principle: 'Свет 193 нм в воде: одна экспозиция даёт шаг ~80 нм, затем спейсеры дважды делят его пополам.',
    pros: ['Зрелые и доступные сканеры', 'Нет зависимости от EUV'], cons: ['Десятки дополнительных шагов', 'Ошибка краёв накапливается — дальше ~26 нм почти не идёт']},
];

export const EXCLUDED: [string, string][] = [
  ['STM-литография атомов', 'Атомная точность (транзистор из одного атома, 2012), но одно устройство пишется часами. Для массового производства в миллиарды раз медленнее.'],
  ['Многолучевой e-beam на пластинах', 'Отлично подходит для масок (IMS Nanofabrication), но для пластины в сотни раз медленнее оптики.'],
  ['BEUV 6,7 нм', 'Короче волна, но нет зеркал и резистов с нужной отражательной способностью и чувствительностью.'],
  ['Рентгеновская и ионно-проекционная', 'Закрыты в 2000-х: проблемы масок и источников, EUV оказался практичнее.'],
  ['Интерференционная литография', 'Даёт только периодические решётки без произвольного рисунка — годится как помощник, не как основа.'],
];

export const BOOSTERS: [string, string][] = [
  ['Металлоксидные и сухие резисты', 'Inpria (JSR), Lam Research: поглощают EUV в разы лучше полимеров → меньше доза, выше производительность и точность.'],
  ['Селективное осаждение (ASD)', 'Материал растёт только на нужной поверхности: переходы сами совмещаются с линиями, ошибок краёв меньше.'],
  ['Атомно-слоевое травление (ALE)', 'Снимает материал по одному атомному слою — точный размер без «перетрава».'],
  ['Криволинейные маски (ILT)', 'Маски с плавными формами, рассчитанные на GPU: лучше окно процесса для той же оптики.'],
];

// ── Поиск техпроцесса ──
export interface ProcessParams { spacer: number; eot: number; ssMax: number; leak: number; rMax: number; aspect: number; layers: number; potential: boolean; realisticOnly: boolean }
export const DEFAULT_PARAMS: ProcessParams = {spacer: 5, eot: 0.6, ssMax: 75, leak: 1e-5, rMax: 1500, aspect: 2, layers: 12, potential: false, realisticOnly: true};

export interface Check { name: string; value: string; level: 0 | 1 | 2; note: string }
export interface ProcessConfig { litho: Patterning; arch: DeviceArch; channel: ChannelMaterial; metal: WireMetal; backside: boolean }
export interface ProcessResult {
  cfg: ProcessConfig; lg: number; cpp: number; mmp: number; cppLimit: string; mmpLimit: string; node: number; density: number;
  yield: number; costPerTr: number; perf: number; trl: number; issues: string[]; checks: Check[];
}
export const realism = (r: ProcessResult) => Math.max(0, ...r.checks.map((c) => c.level)) as 0 | 1 | 2;
export const valueCost = (r: ProcessResult) => r.costPerTr / Math.max(r.perf, 0.02);
export const rankKey = (r: ProcessResult) => valueCost(r) * (1 + 0.04 * r.checks.filter((c) => c.level > 0).length);
export const REALISM_TITLE = ['реалистично', 'на грани', 'фантастика'];

const REF_AREA = 45 * 21 * 6;
const VDD = 0.7;

export function evaluate(c: ProcessConfig, p: ProcessParams, wCache?: Map<number, number>): ProcessResult {
  const issues: string[] = [];
  if (c.channel.eg <= 0) issues.push('канал без запрещённой зоны не выключается');
  if (c.arch.bulkOnly && c.channel.is2D) issues.push('FinFET требует объёмный канал');
  if (c.arch.needsLowTemp && !c.channel.lowTempOK) issues.push('многоярусной 3D нужен канал, выращиваемый ≤ 450 °C');

  const t = c.channel.is2D ? c.channel.thickness : c.arch.id === 'fin' ? 6 : c.channel.thickness;
  const lim = gateLimit(c.channel, t, p.eot, c.arch.k, p.ssMax, p.leak);
  const lg = isFinite(lim.lMin) ? lim.lMin : 100;
  const device = lg + 2 * p.spacer + c.channel.contact;
  const lp = p.potential ? c.litho.pitchPotential : c.litho.pitchToday;
  const cpp = Math.max(lp, device);
  const wMin = wCache?.get(c.metal.z) ?? minWidth(c.metal, p.rMax, p.aspect);
  const mmp = Math.max(lp, 2 * wMin);
  const tracks = c.arch.tracks - (c.backside ? 0.5 : 0);
  const area = (cpp * mmp * tracks) / c.arch.stack;
  const node = 2 * Math.sqrt(area / REF_AREA), density = REF_AREA / area;

  const checks: Check[] = [];
  const gateLeak = 10 ** (Math.max(0, 0.6 - p.eot) / 0.1);
  const eotL = p.eot >= 0.6 ? 0 : p.eot >= 0.5 ? 1 : 2;
  checks.push({name: 'Изолятор затвора', value: 'EOT ' + num(p.eot, 2) + ' нм', level: eotL,
    note: eotL === 0 ? 'В пределах лучших high-k диэлектриков (HfO₂).' : 'Ток сквозь изолятор ×' + sci(gateLeak, 0) + ' от нормы. ' + (eotL === 2 ? 'Материалов с такой EOT без огромной утечки не существует.' : 'Это уровень лабораторных рекордов.')});
  const field = (VDD / p.spacer) * 10, capF = 1 + 0.6 * Math.max(0, 5 / p.spacer - 1);
  const spL = p.spacer >= 4.5 ? 0 : p.spacer >= 3.5 ? 1 : 2;
  checks.push({name: 'Спейсер затвор–контакт', value: num(p.spacer, 1) + ' нм · ' + num(field, 1) + ' МВ/см', level: spL,
    note: spL === 0 ? 'Нормальная изоляция и ёмкость.' : 'Паразитная ёмкость ×' + num(capF, 2) + ', ' + (spL === 2 ? 'изоляция пробьётся за срок службы.' : 'надёжность на пределе.')});
  const rc = c.channel.rc0 / Math.tanh(c.channel.contact / c.channel.lt);
  const rcL = rc <= 150 ? 0 : rc <= 400 ? 1 : 2;
  checks.push({name: 'Контакт к каналу', value: num(rc, 0) + ' Ом·мкм', level: rcL,
    note: rcL === 0 ? 'Контакт не тормозит транзистор.' : `Контакт длиной ${num(c.channel.contact, 0)} нм короче длины переноса тока (${num(c.channel.lt, 0)} нм): ` + (rcL === 2 ? 'большая часть напряжения теряется на контакте.' : 'заметная потеря тока.')});
  const rW = wireR(c.metal, mmp / 2, p.aspect);
  const wL = rW <= 1500 ? 0 : rW <= 3000 ? 1 : 2;
  checks.push({name: 'Провода M0', value: num(rW, 0) + ' Ом/мкм', level: wL,
    note: wL === 0 ? 'Задержка сигнала в норме.' : 'Сигнал тормозит в проводах в ' + num(rW / 1000, 1) + ' раза сильнее эталона' + (wL === 2 ? ' — чип потеряет частоту.' : '.')});
  const thermal = Math.sqrt(density) * (1 + 0.35 * (c.arch.stack - 1)) * (c.backside ? 1.05 : 1) * Math.min(1 + 0.05 * (gateLeak - 1), 50);
  const thL = thermal <= 2 ? 0 : thermal <= 4.5 ? 1 : 2;
  checks.push({name: 'Отвод тепла', value: '×' + num(thermal, 1) + ' от «2 нм»', level: thL,
    note: thL === 0 ? 'Охлаждение справится.' : thL === 1 ? 'Частоту придётся снизить примерно до ' + num(Math.min(1, 2 / thermal) * 100, 0) + ' %.' : 'Нижние ярусы перегреются: тепло некуда отводить.'});
  const ab = metalElement(c.metal).abundance ?? 1;
  const mL = ab < 0.01 && c.metal.trl < 7 ? 1 : 0;
  checks.push({name: 'Металл', value: metalElement(c.metal).name, level: mL,
    note: mL === 0 ? 'Поставки не ограничивают.' : 'Редчайший металл (' + sci(ab, 1) + ' ppm в коре): цена и поставки — риск.'});

  const perf = (Math.min(1, 2 / thermal) / (1 + rc / 300) / capF) / (1 + rW / 3000);
  const tierMul = c.arch.id === 'm3d' ? c.arch.stack : c.arch.id === 'cfet' ? 1.3 : 1;
  const yld = Math.exp(-((1.2 * c.litho.defect + c.channel.risk) * tierMul + c.arch.risk + c.metal.risk));
  const layers = p.layers * (c.arch.id === 'm3d' ? 1 + 0.6 * (c.arch.stack - 1) : 1);
  const wafer = (10 + layers * c.litho.cost) * (1 + c.arch.costAdd + c.channel.costAdd + (c.backside ? 0.08 : 0));
  return {cfg: c, lg, cpp, mmp, node, density, yield: yld, costPerTr: wafer / (density * yld), perf,
    cppLimit: lp >= device ? 'литография' : 'затвор + спейсеры + контакт', mmpLimit: lp >= 2 * wMin ? 'литография' : 'сопротивление металла',
    trl: Math.min(c.litho.trl, c.arch.trl, c.channel.trl, c.metal.trl), issues, checks};
}

export function reference(p: ProcessParams) {
  return evaluate({litho: PATTERNING.find((x) => x.id === 'euv')!, arch: ARCHS[1], channel: CHANNELS[0], metal: METALS[0], backside: false},
    {...DEFAULT_PARAMS, layers: p.layers});
}

export function normalize(r: ProcessResult, ref: ProcessResult): ProcessResult {
  return {...r, costPerTr: r.costPerTr / ref.costPerTr, perf: r.perf / ref.perf};
}

export function searchAll(p: ProcessParams): ProcessResult[] {
  const cache = new Map(METALS.map((m) => [m.z, minWidth(m, p.rMax, p.aspect)]));
  const ref = reference(p);
  const out: ProcessResult[] = [];
  for (const litho of PATTERNING) for (const arch of ARCHS) for (const channel of CHANNELS) for (const metal of METALS) for (const backside of [false, true]) {
    const r = evaluate({litho, arch, channel, metal, backside}, p, cache);
    if (r.issues.length) continue;
    if (p.realisticOnly && realism(r) >= 2) continue;
    out.push(normalize(r, ref));
  }
  return out;
}
