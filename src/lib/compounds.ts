import {element} from './elements';
import {t} from '../i18n';

export type Bond = 'molecular' | 'ionic' | 'covalent' | 'metallic';
export const BOND_TITLE: Record<Bond, string> = {molecular: t('молекулярное'), ionic: t('ионное'), covalent: t('ковалентная сетка'), metallic: t('металлическое')};
export const BOND_SIMPLE: Record<Bond, string> = {
  molecular: t('Отдельные молекулы, слабо притягиваются друг к другу — поэтому легко испаряются.'),
  ionic: t('Плюс- и минус-ионы держатся электрическим притяжением — твёрдое и тугоплавкое.'),
  covalent: t('Все атомы связаны общими электронами в одну огромную сетку — очень прочно.'),
  metallic: t('Ионы в «море» общих электронов — проводит ток.'),
};

export interface Compound {
  id: number; formula: string; name: string; parts: [number, number][]; bond: Bond;
  melt?: number; boil?: number; boilNote?: string; density?: number; bandGap?: number; epsilon?: number;
  structure: string; use: string; triple?: [number, number]; critical?: [number, number]; noDiagram?: string; chipRole?: boolean;
}

export const COMPOUNDS: Compound[] = [
  {id: 0, formula: 'H₂O', name: t('Вода'), parts: [[1, 2], [8, 1]], bond: 'molecular', melt: 273.15, boil: 373.124, density: 1, bandGap: 6.9, epsilon: 80,
    structure: t('угловая молекула; лёд — гексагональная решётка'), use: t('Сверхчистая вода промывает пластины на каждом шаге; в DUV-иммерсии вода под линзой повышает разрешение в 1,44 раза.'), triple: [273.16, 0.00604], critical: [647.096, 217.75]},
  {id: -1, formula: 'CO₂', name: t('Углекислый газ'), parts: [[6, 1], [8, 2]], bond: 'molecular', melt: 216.58, boil: 194.7, boilNote: t('при 1 атм не плавится, а возгоняется («сухой лёд»)'), density: 0.001977,
    structure: t('линейная молекула O=C=O'), use: t('Сверхкритический CO₂ сушит тонкие линии резиста, не давая им слипнуться; «сухой лёд» сдувает частицы с пластин.'), triple: [216.58, 5.117], critical: [304.13, 72.8]},
  {id: -2, formula: 'NH₃', name: t('Аммиак'), parts: [[7, 1], [1, 3]], bond: 'molecular', melt: 195.4, boil: 239.8, density: 0.000769,
    structure: t('молекула-пирамида'), use: t('Источник азота для роста нитрида галлия (GaN) и нитрида кремния (Si₃N₄).'), triple: [195.4, 0.06], critical: [405.4, 111.3]},
  {id: -3, formula: 'CH₄', name: t('Метан'), parts: [[6, 1], [1, 4]], bond: 'molecular', melt: 90.69, boil: 111.66, density: 0.000717,
    structure: t('молекула-тетраэдр'), use: t('Источник углерода для роста графена и алмазных плёнок.'), triple: [90.69, 0.1159], critical: [190.56, 45.4]},
  {id: -4, formula: 'SiH₄', name: t('Силан'), parts: [[14, 1], [1, 4]], bond: 'molecular', melt: 88.5, boil: 161, density: 0.00144,
    structure: t('молекула-тетраэдр'), use: t('Главный газ для осаждения кремния и SiO₂. Сам вспыхивает на воздухе.'), critical: [269.7, 47.8]},
  {id: -5, formula: 'NF₃', name: t('Трифторид азота'), parts: [[7, 1], [9, 3]], bond: 'molecular', melt: 66.4, boil: 144.1, density: 0.00313,
    structure: t('молекула-пирамида'), use: t('Чистка камер осаждения фтором. Сильнейший парниковый газ — фабрики его улавливают.'), critical: [234, 44.7]},
  {id: -6, formula: 'SF₆', name: t('Гексафторид серы'), parts: [[16, 1], [9, 6]], bond: 'molecular', melt: 223.5, boil: 209.3, boilNote: t('при 1 атм возгоняется'), density: 0.00617,
    structure: t('молекула-октаэдр'), use: t('Плазменное травление глубоких канавок в кремнии (Bosch-процесс), изолятор в высоковольтной технике.'), triple: [223.5, 2.24], critical: [318.7, 37.1]},
  {id: -7, formula: 'WF₆', name: t('Гексафторид вольфрама'), parts: [[74, 1], [9, 6]], bond: 'molecular', melt: 275, boil: 290, density: 0.0129,
    structure: t('молекула-октаэдр'), use: t('Газ для осаждения вольфрамовых контактов (CVD-W) — каждый транзистор подключён через вольфрам.')},
  {id: -8, formula: 'SiO₂', name: t('Диоксид кремния'), parts: [[14, 1], [8, 2]], bond: 'covalent', melt: 1986, boil: 3220, density: 2.65, bandGap: 9, epsilon: 3.9,
    structure: t('кварц или аморфное стекло'), use: t('Изолятор затвора до 2007 г.; сейчас — изоляция между транзисторами и проводами.')},
  {id: -9, formula: 'HfO₂', name: t('Оксид гафния'), parts: [[72, 1], [8, 2]], bond: 'ionic', melt: 3031, boil: 5673, density: 9.68, bandGap: 5.7, epsilon: 25,
    structure: t('моноклинный кристалл; в чипе — аморфная плёнка'), use: t('High-k изолятор затвора всех современных чипов (с Intel 45 нм, 2007). В 6 раз «сильнее» SiO₂ по ёмкости.')},
  {id: -10, formula: 'Al₂O₃', name: t('Оксид алюминия (сапфир)'), parts: [[13, 2], [8, 3]], bond: 'ionic', melt: 2345, boil: 3250, density: 3.95, bandGap: 8.8, epsilon: 9,
    structure: t('корунд'), use: t('Изолятор, осаждаемый по одному атомному слою (ALD); сапфировые подложки для светодиодов.')},
  {id: -11, formula: 'Si₃N₄', name: t('Нитрид кремния'), parts: [[14, 3], [7, 4]], bond: 'covalent', melt: 2173, boilNote: t('разлагается около 1900 °C'), density: 3.17, bandGap: 5.3, epsilon: 7.5,
    structure: t('гексагональная сетка'), use: t('Спейсеры вокруг затвора, твёрдые маски, защитное покрытие чипа.'), noDiagram: t('Не кипит, а разлагается на кремний и азот — обычной фазовой диаграммы нет.')},
  {id: -12, formula: 'GaAs', name: t('Арсенид галлия'), parts: [[31, 1], [33, 1]], bond: 'covalent', melt: 1511, boilNote: t('при нагреве теряет мышьяк'), density: 5.32, bandGap: 1.42, epsilon: 12.9,
    structure: t('цинковая обманка'), use: t('Быстрые транзисторы для радиосвязи 5G, лазеры, солнечные батареи спутников.'), noDiagram: t('При нагреве мышьяк улетает раньше кипения — диаграмма многокомпонентная.')},
  {id: -13, formula: 'GaN', name: t('Нитрид галлия'), parts: [[31, 1], [7, 1]], bond: 'covalent', boilNote: t('при 1 атм разлагается около 900 °C; плавится только под огромным давлением азота'), density: 6.15, bandGap: 3.4, epsilon: 9.5,
    structure: t('вюрцит'), use: t('Быстрые зарядки, силовые транзисторы, синие светодиоды (Нобелевская премия 2014).'), noDiagram: t('Разлагается раньше плавления — нужна многокомпонентная диаграмма Ga–N.')},
  {id: -14, formula: 'SiC', name: t('Карбид кремния'), parts: [[14, 1], [6, 1]], bond: 'covalent', boilNote: t('возгоняется около 2700 °C'), density: 3.21, bandGap: 3.26, epsilon: 9.7,
    structure: t('политипы 4H, 6H, 3C'), use: t('Силовая электроника электромобилей и зарядных станций: держит высокое напряжение и жар.'), noDiagram: t('Возгоняется с разложением — однокомпонентной диаграммы нет.')},
  {id: -15, formula: 'MoS₂', name: t('Дисульфид молибдена'), parts: [[42, 1], [16, 2]], bond: 'covalent', melt: 2648, boilNote: t('при нагреве на воздухе окисляется'), density: 5.06, bandGap: 1.8, epsilon: 6.4,
    structure: t('слоистый: листы толщиной в 3 атома'), use: t('Кандидат в канал 2D-транзистора. Запрещённая зона 1,8 эВ — у монослоя.'), noDiagram: t('Нет надёжных данных о кипении — диаграмма не строится.')},
  {id: -16, formula: 'TiN', name: t('Нитрид титана'), parts: [[22, 1], [7, 1]], bond: 'metallic', melt: 3203, density: 5.22,
    structure: t('как у поваренной соли'), use: t('Металл затвора и барьер под вольфрамом. Золотистый цвет — у свёрл и украшений тоже TiN.'), noDiagram: t('Нет данных о кипении — диаграмма не строится.')},
  {id: -17, formula: 'NaCl', name: t('Поваренная соль'), parts: [[11, 1], [17, 1]], bond: 'ionic', melt: 1074, boil: 1738, density: 2.17, bandGap: 8.5, epsilon: 5.9,
    structure: t('кубическая решётка: Na⁺ и Cl⁻ через один'), use: t('Не для чипов: классический пример ионного кристалла. Натрий — злейший загрязнитель транзисторов.'), chipRole: false},
  {id: -18, formula: 'C₂H₅OH', name: t('Этиловый спирт'), parts: [[6, 2], [1, 6], [8, 1]], bond: 'molecular', melt: 159, boil: 351.4, density: 0.789, epsilon: 24.5,
    structure: t('молекула'), use: t('Бытовое вещество; изопропиловый спирт — его «родственник» — сушит пластины.'), triple: [150, 4.3e-9], critical: [514, 60.6], chipRole: false},
];

export const compound = (id: number) => COMPOUNDS.find((c) => c.id === id);
export const molarMass = (c: Compound) => c.parts.reduce((s, [z, n]) => s + (element(z)?.mass ?? 0) * n, 0);
export const atomCount = (c: Compound) => c.parts.reduce((s, [, n]) => s + n, 0);
export const containing = (z: number) => COMPOUNDS.filter((c) => c.parts.some(([pz]) => pz === z));
