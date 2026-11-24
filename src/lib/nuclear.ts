// Ядро: изотопы и значение для чипов (перенос из Swift-версии)
import type {Element} from './elements';
import {t} from '../i18n';

export interface Isotope { a: number; percent: number; spin: string }

export const ISOTOPES: Record<number, Isotope[]> = {
  5: [{a: 10, percent: 19.9, spin: '3'}, {a: 11, percent: 80.1, spin: '3/2'}],
  6: [{a: 12, percent: 98.93, spin: '0'}, {a: 13, percent: 1.07, spin: '1/2'}],
  7: [{a: 14, percent: 99.636, spin: '1'}, {a: 15, percent: 0.364, spin: '1/2'}],
  8: [{a: 16, percent: 99.757, spin: '0'}, {a: 17, percent: 0.038, spin: '5/2'}, {a: 18, percent: 0.205, spin: '0'}],
  14: [{a: 28, percent: 92.23, spin: '0'}, {a: 29, percent: 4.68, spin: '1/2'}, {a: 30, percent: 3.09, spin: '0'}],
  15: [{a: 31, percent: 100, spin: '1/2'}],
  29: [{a: 63, percent: 69.15, spin: '3/2'}, {a: 65, percent: 30.85, spin: '3/2'}],
  31: [{a: 69, percent: 60.11, spin: '3/2'}, {a: 71, percent: 39.89, spin: '3/2'}],
  32: [{a: 70, percent: 20.5, spin: '0'}, {a: 72, percent: 27.4, spin: '0'}, {a: 73, percent: 7.76, spin: '9/2'}, {a: 74, percent: 36.5, spin: '0'}, {a: 76, percent: 7.75, spin: '0'}],
  33: [{a: 75, percent: 100, spin: '3/2'}],
  42: [{a: 92, percent: 14.53, spin: '0'}, {a: 94, percent: 9.15, spin: '0'}, {a: 95, percent: 15.84, spin: '5/2'}, {a: 96, percent: 16.67, spin: '0'}, {a: 97, percent: 9.60, spin: '5/2'}, {a: 98, percent: 24.39, spin: '0'}, {a: 100, percent: 9.82, spin: '0'}],
  44: [{a: 96, percent: 5.54, spin: '0'}, {a: 98, percent: 1.87, spin: '0'}, {a: 99, percent: 12.76, spin: '5/2'}, {a: 100, percent: 12.60, spin: '0'}, {a: 101, percent: 17.06, spin: '5/2'}, {a: 102, percent: 31.55, spin: '0'}, {a: 104, percent: 18.62, spin: '0'}],
  49: [{a: 113, percent: 4.29, spin: '9/2'}, {a: 115, percent: 95.71, spin: '9/2'}],
  72: [{a: 174, percent: 0.16, spin: '0'}, {a: 176, percent: 5.26, spin: '0'}, {a: 177, percent: 18.60, spin: '7/2'}, {a: 178, percent: 27.28, spin: '0'}, {a: 179, percent: 13.62, spin: '9/2'}, {a: 180, percent: 35.08, spin: '0'}],
  74: [{a: 180, percent: 0.12, spin: '0'}, {a: 182, percent: 26.50, spin: '0'}, {a: 183, percent: 14.31, spin: '1/2'}, {a: 184, percent: 30.64, spin: '0'}, {a: 186, percent: 28.43, spin: '0'}],
  82: [{a: 204, percent: 1.4, spin: '0'}, {a: 206, percent: 24.1, spin: '0'}, {a: 207, percent: 22.1, spin: '1/2'}, {a: 208, percent: 52.4, spin: '0'}],
  90: [{a: 232, percent: 100, spin: '0'}],
  92: [{a: 234, percent: 0.0054, spin: '0'}, {a: 235, percent: 0.72, spin: '7/2'}, {a: 238, percent: 99.27, spin: '0'}],
};

export const CHIP_NOTES: Record<number, string> = {
  5: t('¹⁰B захватывает тепловые нейтроны и распадается на ⁷Li и альфа-частицу 1,47 МэВ — она переворачивает биты памяти. Из-за этого из чипов убрали стекло BPSG; для легирования можно брать обогащённый ¹¹B.'),
  6: t('Алмаз из чистого ¹²C проводит тепло примерно в 1,5 раза лучше природного — кандидат на теплоотвод для многоярусных чипов.'),
  14: t('Кремний-28 без ядерных спинов (обогащение до 99,99 %) даёт рекордное время жизни спиновых кубитов. Нейтронное легирование: облучение превращает ³⁰Si в ³¹P — так получают сверходнородный кремний для силовых приборов.'),
  15: t('Ядро ³¹P со спином 1/2 — основа транзистора из одного атома (2012) и проекта кремниевого квантового компьютера Кейна.'),
  31: t('У всех изотопов Ga и As есть ядерные спины — поэтому спиновые кубиты в GaAs «шумят», а в очищенном Si нет.'),
  32: t('Германий без ⁷³Ge (спин 9/2) нужен для дырочных спиновых кубитов в Ge.'),
  33: t('Единственный изотоп ⁷⁵As со спином 3/2: ядерный «шум» в GaAs-кубитах.'),
  72: t('HfO₂ — изолятор затвора всех современных чипов. ¹⁷⁴Hf формально радиоактивен (T½ ≈ 7·10¹⁵ лет), но это ничтожно мало.'),
  82: t('Природный свинец содержит ²¹⁰Pb → ²¹⁰Po, который излучает альфа-частицы 5,3 МэВ. Для припоев нужен «низкоальфовый» свинец, иначе сбои памяти.'),
  90: t('Следы тория в корпусах, наполнителях и металлах излучают альфа-частицы; производители держат их на уровне долей ppb.'),
  92: t('Следы урана в материалах корпуса — источник альфа-частиц и сбоев памяти. Норма — меньше ~1 ppb.'),
  49: t('¹¹⁵In слабо радиоактивен (T½ ≈ 4·10¹⁴ лет) — для чипов несущественно.'),
};

export const isRadioactive = (z: number) => z === 43 || z === 61 || z >= 84;
export function stability(z: number): [string, 'success' | 'error'] {
  if (z === 83) return [t('практически стабилен (T½ ≈ 2·10¹⁹ лет)'), 'success'];
  if (isRadioactive(z)) return [t('радиоактивен — стабильных изотопов нет'), 'error'];
  return [t('есть стабильные изотопы'), 'success'];
}
export const neutrons = (e: Element) => Math.max(0, Math.round(e.mass) - e.z);
export const upQuarks = (e: Element) => 2 * e.z + neutrons(e);
export const downQuarks = (e: Element) => e.z + 2 * neutrons(e);
export const nucleusRadiusFm = (e: Element) => 1.2 * Math.cbrt(Math.round(e.mass));

export type Domain = 'nuclear' | 'chem' | 'chip';
export const DOMAIN_TITLE: Record<Domain, string> = {nuclear: t('Кварки и ядро'), chem: t('Электроны и химия'), chip: t('Транзистор')};

export const SIZES: {name: string; value: number; d: Domain}[] = [
  {name: t('Кварк (< 10⁻¹⁹ м)'), value: 1e-19, d: 'nuclear'},
  {name: t('Протон'), value: 0.84e-15, d: 'nuclear'},
  {name: t('Ядро кремния-28'), value: 3.6e-15, d: 'nuclear'},
  {name: t('Ядро урана-238'), value: 7.4e-15, d: 'nuclear'},
  {name: t('Атом кремния'), value: 2.2e-10, d: 'chem'},
  {name: t('Ячейка кристалла Si'), value: 5.43e-10, d: 'chem'},
  {name: t('Монослой MoS₂'), value: 6.5e-10, d: 'chem'},
  {name: t('Затвор 2D-транзистора'), value: 3e-9, d: 'chip'},
  {name: t('Длина волны EUV'), value: 1.35e-8, d: 'chip'},
  {name: t('Шаг затворов «2 нм» чипа'), value: 4.5e-8, d: 'chip'},
  {name: t('Длина волны DUV'), value: 1.93e-7, d: 'chip'},
];

export const ENERGIES: {name: string; value: number; d: Domain}[] = [
  {name: t('Тепло при 25 °C (kT)'), value: 0.0257, d: 'chem'},
  {name: t('Питание транзистора'), value: 0.7, d: 'chip'},
  {name: t('Запрещённая зона Si'), value: 1.12, d: 'chem'},
  {name: t('Связь Si–Si'), value: 2.3, d: 'chem'},
  {name: t('Фотон EUV'), value: 92, d: 'chip'},
  {name: t('Альфа-частица ²¹⁰Po'), value: 5.3e6, d: 'nuclear'},
  {name: t('Связь нуклона в ядре Si'), value: 8.45e6, d: 'nuclear'},
  {name: t('Удержание кварков (КХД)'), value: 2.5e8, d: 'nuclear'},
  {name: t('Масса протона'), value: 9.38e8, d: 'nuclear'},
];
