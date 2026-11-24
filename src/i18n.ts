// Двуязычность: исходные строки на русском, перевод — в словаре EN (src/en.ts).
// Язык выбирается один раз при загрузке страницы; переключение сохраняет выбор и перезагружает страницу.
import {EN} from './en';

export type Lang = 'ru' | 'en';

function detect(): Lang {
  try {
    const q = new URLSearchParams(window.location.search).get('lang');
    if (q === 'ru' || q === 'en') { localStorage.setItem('elementlab-lang', q); return q; }
    const saved = localStorage.getItem('elementlab-lang');
    if (saved === 'ru' || saved === 'en') return saved;
  } catch { /* приватный режим */ }
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'ru';
  return /^(ru|uk|be|kk|uz)/i.test(nav) ? 'ru' : 'en';
}

export const lang: Lang = detect();
if (typeof document !== 'undefined') document.documentElement.lang = lang;

const missing = new Set<string>();

/** Перевод строки; {0}, {1}… подставляются из args */
export function t(ru: string, ...args: (string | number)[]): string {
  let s = ru;
  if (lang === 'en') {
    const en = EN[ru];
    if (en === undefined) { if (import.meta.env.DEV && !missing.has(ru)) { missing.add(ru); console.warn('[i18n] нет перевода:', ru); } }
    else s = en;
  }
  return args.length ? s.replace(/\{(\d+)\}/g, (_, i) => String(args[Number(i)])) : s;
}

export function setLang(l: Lang) {
  try { localStorage.setItem('elementlab-lang', l); } catch { /* ignore */ }
  const url = new URL(window.location.href);
  url.searchParams.set('lang', l);
  window.location.replace(url.toString());
}
