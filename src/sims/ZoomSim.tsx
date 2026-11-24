import {useRef, useState} from 'react';
import {VStack, HStack} from '@astryxdesign/core/Stack';
import {Grid} from '@astryxdesign/core/Grid';
import {Card} from '@astryxdesign/core/Card';
import {Button} from '@astryxdesign/core/Button';
import {Slider} from '@astryxdesign/core/Slider';
import {Note, Section, Stat, useTok} from '../components/ui';
import {useCanvas} from '../components/useCanvas';
import {sci, num} from '../lib/fmt';
import {t} from '../i18n';

const LOG_MAX = -1.6;    // поле зрения 2,5 см
const LOG_MIN = -14.7;   // 2 фм — протон целиком в кадре

/** Плавное окно видимости слоя по размеру его детали в пикселях */
function windowAlpha(px: number, lo: number, hi: number) {
  const a = Math.min(1, Math.max(0, (px - lo) / lo));
  const b = Math.min(1, Math.max(0, (hi - px) / (hi * 0.6)));
  return a * b;
}

function prettyLength(m: number) {
  const units: [number, string][] = [[1e-2, t('см')], [1e-3, t('мм')], [1e-6, t('мкм')], [1e-9, t('нм')], [1e-12, t('пм')], [1e-15, t('фм')]];
  for (const [u, name] of units) if (m >= u) return `${num(m / u, m / u < 10 ? 1 : 0)} ${name}`;
  return `${sci(m / 1e-15, 1)} ${t('фм')}`;
}

const LAYERS = [
  {id: 'die', name: t('Кристалл процессора'), note: t('Кусочек кремния ~1 см: ядра, кэш, графика. На нём 10–100 миллиардов транзисторов.')},
  {id: 'blocks', name: t('Функциональные блоки'), note: t('Блоки памяти и логики — как кварталы города.')},
  {id: 'cells', name: t('Ряды стандартных ячеек'), note: t('Логические элементы (И, ИЛИ, триггеры) стоят рядами высотой ~0,17 мкм.')},
  {id: 'fet', name: t('Транзисторы'), note: t('Вертикальные полосы — затворы с шагом 48 нм, горизонтальные — каналы. Пересечение — транзистор.')},
  {id: 'atoms', name: t('Атомы кремния'), note: t('Кристаллическая решётка: соседние атомы в 0,235 нм друг от друга. В затворе ~50 атомов в ряд.')},
  {id: 'cloud', name: t('Один атом'), note: t('Электронное облако ~0,2 нм. Почти весь атом — пустота; в центре крошечное ядро.')},
  {id: 'nucleus', name: t('Ядро кремния-28'), note: t('14 протонов и 14 нейтронов в шаре ~7 фм — в 30 000 раз меньше атома.')},
  {id: 'proton', name: t('Протон и кварки'), note: t('Три кварка (u, u, d), связанные глюонами. Размер самих кварков не найден (< 10⁻¹⁹ м) — точки нарисованы условно.')},
];

const START = (() => { const z = Number(new URLSearchParams(window.location.search).get('zoom')); return z && z < LOG_MAX && z > LOG_MIN ? z : -2.3; })();

export default function ZoomSim() {
  const [logW, setLogW] = useState(START);
  const [playing, setPlaying] = useState(false);
  const live = useRef({logW: START, dir: -1, last: 0});
  const [layer, setLayer] = useState(LAYERS[0]);
  const {tok} = useTok();

  const ref = useCanvas((ctx, w, h, time) => {
    const st = live.current;
    if (playing) {
      const dt = st.last ? Math.min(0.05, (time - st.last) / 1000) : 0;
      st.logW += st.dir * dt * 0.55;
      if (st.logW < LOG_MIN) { st.logW = LOG_MIN; st.dir = 1; }
      if (st.logW > LOG_MAX) { st.logW = LOG_MAX; st.dir = -1; }
      if (Math.round(time / 120) % 2 === 0) setLogW(st.logW);
    } else st.logW = logW;
    st.last = time;

    const W = 10 ** st.logW, k = w / W, cx = w / 2, cy = h / 2;
    ctx.fillStyle = 'rgb(10,12,18)'; ctx.fillRect(0, 0, w, h);
    const alphas: Record<string, number> = {};
    const blue = tok('--color-data-categorical-blue'), teal = tok('--color-data-categorical-teal'), orange = tok('--color-data-categorical-orange');
    const purple = tok('--color-data-categorical-purple'), red = tok('--color-data-categorical-red'), gray = tok('--color-data-gray-3'), green = tok('--color-data-categorical-green');

    // 1. кристалл (не повторяется)
    const die = 1e-2 * k;
    alphas.die = windowAlpha(die, 25, w * 8);
    if (alphas.die > 0) {
      ctx.globalAlpha = alphas.die;
      ctx.fillStyle = 'rgb(40,48,64)'; ctx.fillRect(cx - die / 2, cy - die / 2, die, die);
      const blocks: [number, number, number, number, string][] = [[0.04, 0.04, 0.44, 0.44, blue], [0.52, 0.04, 0.44, 0.44, blue], [0.04, 0.52, 0.44, 0.2, teal], [0.52, 0.52, 0.44, 0.2, purple], [0.04, 0.76, 0.92, 0.2, orange]];
      for (const [x, y, bw, bh, c] of blocks) { ctx.fillStyle = c; ctx.globalAlpha = alphas.die * 0.55; ctx.fillRect(cx - die / 2 + x * die, cy - die / 2 + y * die, bw * die, bh * die); }
      ctx.globalAlpha = 1;
    }
    // повторяющийся узор с шагом p (м); draw(x, y, pPx) — одна ячейка
    const tile = (p: number, alpha: number, draw: (x: number, y: number, s: number) => void) => {
      if (alpha <= 0) return;
      const s = p * k, nx = Math.ceil(w / s / 2) + 1, ny = Math.ceil(h / s / 2) + 1;
      if (nx * ny > 6000) return;
      ctx.globalAlpha = alpha;
      for (let i = -nx; i <= nx; i++) for (let j = -ny; j <= ny; j++) draw(cx + i * s, cy + j * s, s);
      ctx.globalAlpha = 1;
    };
    // 2. блоки
    const pb = 4e-4;
    alphas.blocks = windowAlpha(pb * k, 20, w * 2.5) * (1 - alphas.die * 0.5);
    tile(pb, alphas.blocks, (x, y, s) => {
      const hsh = Math.abs(Math.sin(x * 12.9898 + y * 78.233)) % 1;
      ctx.fillStyle = hsh < 0.33 ? blue : hsh < 0.66 ? teal : purple;
      ctx.globalAlpha = alphas.blocks * 0.5; ctx.fillRect(x - s / 2 + s * 0.05, y - s / 2 + s * 0.05, s * 0.9, s * 0.9);
    });
    // 3. ряды ячеек
    const pc = 1.7e-7;
    alphas.cells = windowAlpha(pc * k, 5, w * 1.2);
    tile(pc, alphas.cells, (x, y, s) => {
      ctx.fillStyle = gray; ctx.globalAlpha = alphas.cells * 0.35; ctx.fillRect(x - s / 2, y - s / 2 + s * 0.02, s, s * 0.96);
      ctx.fillStyle = 'rgb(10,12,18)'; ctx.fillRect(x - s / 2 + s * 0.98, y - s / 2, s * 0.04, s);
    });
    // 4. транзисторы: затворы 48 нм, каналы 28 нм
    const pg = 4.8e-8, pf = 2.8e-8;
    alphas.fet = windowAlpha(pg * k, 6, w * 1.5);
    if (alphas.fet > 0) {
      ctx.globalAlpha = alphas.fet;
      const sf = pf * k, sg = pg * k;
      ctx.fillStyle = teal;
      for (let j = -Math.ceil(h / sf); j <= Math.ceil(h / sf); j++) ctx.fillRect(0, cy + j * sf - sf * 0.12, w, sf * 0.24);
      ctx.fillStyle = orange;
      for (let i = -Math.ceil(w / sg); i <= Math.ceil(w / sg); i++) ctx.fillRect(cx + i * sg - sg * 0.17, 0, sg * 0.34, h);
      ctx.globalAlpha = 1;
    }
    // 5. атомы: квадратная проекция решётки Si с шагом 0,384 нм
    const pa = 3.84e-10;
    alphas.atoms = windowAlpha(pa * k, 5, w * 0.9);
    tile(pa, alphas.atoms, (x, y, s) => {
      ctx.fillStyle = blue; ctx.beginPath(); ctx.arc(x, y, s * 0.29, 0, 7); ctx.fill();
      ctx.strokeStyle = gray; ctx.lineWidth = Math.max(1, s * 0.05); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + s / 2, y + s / 2); ctx.stroke();
    });
    // 6. электронное облако одного атома
    const ra = 1.1e-10 * k;
    alphas.cloud = windowAlpha(ra, 60, w * 15);
    if (alphas.cloud > 0) {
      ctx.globalAlpha = alphas.cloud;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, ra * 1.6);
      g.addColorStop(0, 'rgba(120,170,255,0.55)'); g.addColorStop(0.6, 'rgba(80,120,255,0.18)'); g.addColorStop(1, 'rgba(80,120,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, ra * 1.6, 0, 7); ctx.fill();
      for (let i = 0; i < 14; i++) {
        const a = i * 2.39996 + time / 1500 * (1 + (i % 3)), rr = ra * (0.35 + 0.9 * ((i * 0.618) % 1));
        ctx.fillStyle = 'rgba(200,220,255,0.9)'; ctx.beginPath(); ctx.arc(cx + rr * Math.cos(a), cy + rr * Math.sin(a), 2.2, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    // 7. ядро: 28 нуклонов
    const rn = 3.6e-15 * k;
    alphas.nucleus = windowAlpha(rn, 12, w * 6);
    const pt = 0.84e-15 * k;
    if (rn > 0.6) {
      ctx.globalAlpha = Math.max(alphas.nucleus, alphas.cloud > 0 ? 1 : 0);
      if (rn < 4) { ctx.fillStyle = red; ctx.beginPath(); ctx.arc(cx, cy, Math.max(1.5, rn), 0, 7); ctx.fill(); }
      else {
        const balls: [number, number, boolean][] = [];
        for (let i = 0; i < 28; i++) { const r = rn * 0.82 * Math.sqrt((i + 0.5) / 28), a = i * 2.39996; balls.push([cx + r * Math.cos(a), cy + r * Math.sin(a), i % 2 === 0]); }
        balls.reverse().forEach(([x, y, p]) => {
          if (Math.hypot(x - cx, y - cy) < 1e-6 && alphas.proton > 0) return;
          const g = ctx.createRadialGradient(x - pt * 0.3, y - pt * 0.3, 0, x, y, pt * 1.2);
          g.addColorStop(0, 'white'); g.addColorStop(1, p ? red : gray);
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, pt, 0, 7); ctx.fill();
        });
      }
      ctx.globalAlpha = 1;
    }
    // 8. протон в центре и три кварка
    alphas.proton = windowAlpha(pt, 50, 1e9);
    if (alphas.proton > 0) {
      ctx.globalAlpha = alphas.proton;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, pt);
      g.addColorStop(0, 'rgba(255,120,120,0.35)'); g.addColorStop(1, 'rgba(255,80,80,0.05)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, pt, 0, 7); ctx.fill();
      const q: [string, string][] = [['u', red], ['u', green], ['d', blue]];
      const pos = q.map((_, i) => { const a = i * 2.094 + time / 900; return [cx + pt * 0.45 * Math.cos(a), cy + pt * 0.45 * Math.sin(a)] as [number, number]; });
      ctx.strokeStyle = 'rgba(255,220,120,0.6)'; ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const [x1, y1] = pos[i], [x2, y2] = pos[(i + 1) % 3];
        ctx.beginPath();
        for (let s = 0; s <= 20; s++) { const f = s / 20, x = x1 + (x2 - x1) * f, y = y1 + (y2 - y1) * f, wv = Math.sin(f * 12 * Math.PI + time / 120) * pt * 0.03; ctx.lineTo(x - (y2 - y1) / Math.hypot(x2 - x1, y2 - y1) * wv, y + (x2 - x1) / Math.hypot(x2 - x1, y2 - y1) * wv); }
        ctx.stroke();
      }
      q.forEach(([lbl, c], i) => {
        ctx.fillStyle = c; ctx.beginPath(); ctx.arc(pos[i][0], pos[i][1], Math.max(6, Math.min(pt * 0.06, 26)), 0, 7); ctx.fill();
        ctx.fillStyle = 'white'; ctx.font = `700 ${Math.max(10, Math.min(pt * 0.05, 22))}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(lbl, pos[i][0], pos[i][1]);
      });
      ctx.globalAlpha = 1;
    }
    // масштабная линейка
    const target = W / 5, pow = 10 ** Math.floor(Math.log10(target)), barM = [5, 2, 1].map((m) => m * pow).find((v) => v <= target) ?? pow;
    const barPx = barM * k;
    ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(20, h - 24); ctx.lineTo(20 + barPx, h - 24); ctx.moveTo(20, h - 30); ctx.lineTo(20, h - 18); ctx.moveTo(20 + barPx, h - 30); ctx.lineTo(20 + barPx, h - 18); ctx.stroke();
    ctx.fillStyle = 'white'; ctx.font = '600 12px system-ui'; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText(prettyLength(barM), 20, h - 34);

    const best = LAYERS.reduce((a, b) => ((alphas[b.id] ?? 0) > (alphas[a.id] ?? 0) ? b : a), LAYERS[0]);
    if (best.id !== layer.id && Math.round(time / 200) % 2 === 0) setLayer(best);
  }, [playing, logW, layer], true);

  const W = 10 ** logW;
  return (
    <VStack gap={4}>
      <Card padding={4}>
        <VStack gap={3}>
          <Card padding={0} height={520} variant="transparent"><canvas ref={ref} style={{width: '100%', height: '100%', display: 'block'}} aria-label={t('Зум от чипа до кварка')} /></Card>
          <HStack gap={6} wrap="wrap">
            <Stat label={t('Сейчас видно')} value={layer.name} tone="accent" />
            <Stat label={t('Ширина поля зрения')} value={prettyLength(W)} />
            <Stat label={t('Приближение от начала')} value={'×' + sci(10 ** (LOG_MAX - logW), 0)} />
          </HStack>
        </VStack>
      </Card>
      <Grid columns={{minWidth: 320, max: 3, repeat: 'fit'}} gap={4}>
        <Section title={t('Управление')}>
          <Slider label={t('Масштаб (вправо — глубже)')} value={-logW} min={-LOG_MAX} max={-LOG_MIN} step={0.01} valueDisplay="none"
            onChange={(v: number) => { setPlaying(false); setLogW(-v); }} />
          <HStack gap={2}>
            <Button label={playing ? t('Остановить') : t('Автополёт')} variant="primary" onClick={() => { live.current.logW = logW; setPlaying(!playing); }} />
            <Button label={t('К началу')} onClick={() => { setPlaying(false); setLogW(-2.3); }} />
          </HStack>
        </Section>
        <Note title={layer.name} text={layer.note} />
        <Note status="success" title={t('Масштаб в цифрах')} text={t('От кристалла до протона — 13 порядков. Если протон увеличить до горошины, кристалл процессора вытянется на 30 миллионов километров — в 80 раз дальше, чем до Луны. Все размеры на экране настоящие, кроме кварков.')} />
      </Grid>
    </VStack>
  );
}
