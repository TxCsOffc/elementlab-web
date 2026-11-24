import {t} from '../i18n';
import {lang} from '../i18n';

const LOCALE = lang === 'en' ? 'en-US' : 'ru-RU';
const nf = (d: number) => new Intl.NumberFormat(LOCALE, {maximumFractionDigits: d});

export const num = (x: number, digits = 2) => nf(Math.max(0, digits)).format(x);

const SUP: Record<string, string> = {'0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻'};
export const sup = (n: number) => String(n).split('').map((c) => SUP[c] ?? c).join('');

export function sci(x: number, digits = 1): string {
  if (!isFinite(x) || x <= 0) return x === 0 ? '0' : '—';
  const e = Math.floor(Math.log10(x));
  if (e >= -2 && e <= 5) return num(x, Math.max(0, digits + 1 - e));
  const m = num(x / 10 ** e, digits);
  return (m === '1' ? '' : m + '·') + '10' + sup(e);
}

export const pressure = (atm: number) => sci(atm, 2) + t(' атм');
export const temp = (k: number, celsius = true) =>
  celsius ? num(k - 273.15, k < 100 ? 2 : 0) + ' °C' : num(k, k < 100 ? 2 : 0) + ' K';
export const tempBoth = (k: number) => num(k - 273.15, k < 100 ? 2 : 0) + ' °C · ' + num(k, k < 100 ? 2 : 0) + ' K';

export function decadeLabel(e: number): string {
  if (e >= 0 && e <= 6) return nf(0).format(10 ** e);
  if (e < 0 && e >= -3) return (lang === 'en' ? '0.' : '0,') + '0'.repeat(-e - 1) + '1';
  return '10' + sup(e);
}
