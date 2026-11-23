import {useMemo, useRef, useState} from 'react';
import {VStack, HStack} from '@astryxdesign/core/Stack';
import {Grid} from '@astryxdesign/core/Grid';
import {Card} from '@astryxdesign/core/Card';
import {Text} from '@astryxdesign/core/Text';
import {Button} from '@astryxdesign/core/Button';
import {Slider} from '@astryxdesign/core/Slider';
import {Switch} from '@astryxdesign/core/Switch';
import {Selector} from '@astryxdesign/core/Selector';
import {SegmentedControl, SegmentedControlItem} from '@astryxdesign/core/SegmentedControl';
import {PlayCircleIcon} from '../components/icons';
import {PageHeader, Note, Section, Stat, useTok} from '../components/ui';
import {useCanvas} from '../components/useCanvas';
import {ParticleSim, TunnelSim, BECSim, LITHO_SOURCES, lithoIntensity, lithoPoles} from '../sims/models';
import {PHASE_TOKEN} from '../lib/phase';
import {num, sci} from '../lib/fmt';

type Kind = 'particles' | 'tunneling' | 'litho' | 'bec';
const KINDS: [Kind, string][] = [['particles', 'Частицы: от кристалла до плазмы'], ['tunneling', 'Туннелирование электрона'], ['litho', 'Почему литографии нужен короткий свет'], ['bec', 'Конденсат Бозе–Эйнштейна']];

const DARK = 'rgb(12,14,20)';

function SimLayout({canvas, side, stats}: {canvas: React.ReactNode; side: React.ReactNode; stats: React.ReactNode}) {
  return (
    <VStack gap={4}>
      <Card padding={4}>
        <VStack gap={3}>
          {canvas}
          <HStack gap={6} wrap="wrap">{stats}</HStack>
        </VStack>
      </Card>
      <Grid columns={{minWidth: 320, max: 3, repeat: 'fit'}} gap={4}>{side}</Grid>
    </VStack>
  );
}

function Particles() {
  const sim = useMemo(() => new ParticleSim(), []);
  const [temp, setTemp] = useState(0.3);
  const [box, setBox] = useState(16);
  const [paused, setPaused] = useState(false);
  const [state, setState] = useState(sim.state());
  const tick = useRef(0);
  const {tok} = useTok();
  const ref = useCanvas((ctx, w, h, time) => {
    sim.targetT = temp; sim.setBox(box);
    if (!paused) for (let k = 0; k < 7; k++) sim.step(0.004);
    if (++tick.current % 15 === 0) setState(sim.state());
    ctx.fillStyle = DARK; ctx.fillRect(0, 0, w, h);
    const s = Math.min(w, h) / sim.box, ox = (w - sim.box * s) / 2, oy = (h - sim.box * s) / 2;
    const P = (i: number): [number, number] => [ox + sim.x[i] * s, h - (oy + sim.y[i] * s)];
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.strokeRect(ox, oy, sim.box * s, sim.box * s);
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath();
    for (let i = 0; i < sim.n; i++) for (let j = i + 1; j < sim.n; j++) {
      if ((sim.x[i] - sim.x[j]) ** 2 + (sim.y[i] - sim.y[j]) ** 2 < 1.44) { const a = P(i), b = P(j); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
    }
    ctx.stroke();
    const ion = sim.ionized, plasma = tok(PHASE_TOKEN.plasma);
    for (let i = 0; i < sim.n; i++) {
      const speed = Math.min(1, Math.hypot(sim.vx[i], sim.vy[i]) / 3);
      const [px, py] = P(i), isIon = sim.seeds[i] < ion, r = (isIon ? 0.32 : 0.45) * s;
      const g = ctx.createRadialGradient(px - r * 0.3, py - r * 0.3, 0, px, py, r * 1.3);
      g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(1, isIon ? plasma : `hsl(${(0.62 - 0.55 * speed) * 360}, 75%, 58%)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, r, 0, 7); ctx.fill();
      if (isIon) {
        const a = (time / 1000) * (3 + 4 * sim.seeds[i]) + sim.seeds[i] * 40, d = s * (0.9 + 1.6 * sim.seeds[(i + 7) % sim.n]);
        ctx.fillStyle = 'gold'; ctx.beginPath(); ctx.arc(px + Math.cos(a) * d, py + Math.sin(a * 1.3) * d, 2.2, 0, 7); ctx.fill();
      }
    }
  }, [temp, box, paused], true);
  return (
    <SimLayout
      canvas={<Card padding={0} height={520} variant="transparent"><canvas ref={ref} style={{width: '100%', height: '100%', display: 'block'}} aria-label="Симуляция 144 атомов" /></Card>}
      stats={<>
        <Stat label="Что сейчас" value={state[0]} tone="accent" />
        <Stat label="Если это аргон" value={`${num(temp * 119.8, 0)} K · ${num(temp * 119.8 - 273.15, 0)} °C`} />
        <Stat label="Плотность (для аргона)" value={num(sim.density * 1.68, 2) + ' г/см³'} />
      </>}
      side={<>
        <Section title="Управление">
          <Slider label="Температура, ε/k" value={temp} min={0.05} max={4} step={0.01} onChange={(v: number) => setTemp(v as number)} valueDisplay="text" formatValue={(v: number) => num(v, 2)} />
          <Slider label="Размер коробки (меньше — сильнее сжато), σ" value={box} min={13} max={40} step={0.5} onChange={(v: number) => setBox(v as number)} valueDisplay="text" formatValue={(v: number) => num(v, 0)} />
          <HStack gap={2}>
            <Button label={paused ? 'Продолжить' : 'Пауза'} onClick={() => setPaused(!paused)} />
            <Button label="Снова в кристалл" onClick={() => { sim.reset(box); setTemp(0.15); }} />
          </HStack>
        </Section>
        <Note text="Каждый шарик — атом. Они притягиваются на расстоянии и отталкиваются вплотную (потенциал Леннард-Джонса — так ведут себя аргон, криптон, ксенон). Холодно — атомы выстраиваются в шестиугольную решётку. Теплее — решётка тает. Ещё теплее — разлетаются в газ. Линии — соседи, цвет — скорость." />
        <Note status="success" title="При чём тут чипы" text="Так же рассчитывают реальные процессы на фабрике — рост плёнок, травление, плавление кремния лазером. Это называется молекулярной динамикой. Плазма здесь нарисована условно: реальные атомы аргона ионизируются при ~10 000 K." />
      </>}
    />
  );
}

function Tunneling() {
  const sim = useMemo(() => new TunnelSim(), []);
  const [mass, setMass] = useState('0.19');
  const [energy, setEnergy] = useState(0.3);
  const [height, setHeight] = useState(0.5);
  const [width, setWidth] = useState(1.5);
  const [running, setRunning] = useState(true);
  const [stats, setStats] = useState({time: 0, trans: 0});
  const tick = useRef(0);
  const {tok} = useTok();
  const restart = (m = mass, e = energy, h = height, w = width) => {
    Object.assign(sim, {mass: Number(m), energy: e, height: h, width: w});
    sim.reset(); setRunning(true);
  };
  const ref = useCanvas((ctx, w, h) => {
    if (running && !sim.finished) for (let k = 0; k < 14; k++) sim.step();
    if (++tick.current % 10 === 0) setStats({time: sim.time, trans: sim.transmitted});
    ctx.fillStyle = DARK; ctx.fillRect(0, 0, w, h);
    const base = h - 40, xs = w / (sim.n * sim.dx), vS = (h - 80) / 1.1;
    const bx = sim.start * xs, bw = Math.max(2, sim.width * xs), bh = sim.height * vS;
    ctx.fillStyle = tok('--color-data-categorical-orange'); ctx.globalAlpha = 0.6; ctx.fillRect(bx, base - bh, bw, bh); ctx.globalAlpha = 1;
    ctx.font = '600 11px system-ui'; ctx.textAlign = 'center'; ctx.fillStyle = tok('--color-data-orange-3');
    ctx.fillText(`стенка ${num(sim.height, 2)} эВ`, bx + bw / 2, base - bh - 8);
    const ey = base - sim.energy * vS;
    ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.moveTo(0, ey); ctx.lineTo(w, ey); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.textAlign = 'left'; ctx.fillText('энергия электрона', 12, ey - 6);
    const maxP = 0.14, ph = h - 90;
    ctx.beginPath(); ctx.moveTo(0, base);
    for (let j = 0; j < sim.n; j += 2) ctx.lineTo(j * sim.dx * xs, base - Math.min(1, (sim.re[j] ** 2 + sim.im[j] ** 2) / maxP) * ph);
    ctx.lineTo(w, base); ctx.closePath();
    const g = ctx.createLinearGradient(0, 0, 0, base); g.addColorStop(0, tok('--color-data-categorical-teal')); g.addColorStop(1, tok('--color-data-categorical-indigo'));
    ctx.fillStyle = g; ctx.globalAlpha = 0.85; ctx.fill(); ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath();
    for (let j = 0; j < sim.n; j += 2) { const x = j * sim.dx * xs, y = base - ph * 0.5 - (sim.re[j] / Math.sqrt(maxP)) * ph * 0.18; if (j) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.moveTo(0, base); ctx.lineTo(w, base); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '10px system-ui'; ctx.textAlign = 'center';
    for (let nm = 10; nm < 100; nm += 10) ctx.fillText(`${nm} нм`, nm * xs, base + 14);
    ctx.fillStyle = tok('--color-data-categorical-teal'); ctx.font = '600 11px system-ui'; ctx.textAlign = 'left';
    ctx.fillText('вероятность найти электрон', 12, 18);
  }, [running], true);
  return (
    <SimLayout
      canvas={<Card padding={0} height={440} variant="transparent"><canvas ref={ref} style={{width: '100%', height: '100%', display: 'block'}} aria-label="Волна электрона и стенка" /></Card>}
      stats={<>
        <Stat label="Время" value={num(stats.time, 0) + ' фс'} />
        <Stat label="Прошло сквозь стенку" value={sci(Math.max(stats.trans, 1e-12) * 100, 2) + ' %'} tone="accent" />
        <Stat label="Точная формула" value={sci(sim.exact * 100, 2) + ' %'} />
        <Stat label="Грубая оценка (ВКБ)" value={sci(sim.wkb * 100, 2) + ' %'} />
      </>}
      side={<>
        <Section title="Управление">
          <SegmentedControl label="Материал" value={mass} onChange={(v) => { setMass(v); restart(v); }} layout="fill" size="sm">
            <SegmentedControlItem value="0.041" label="InGaAs · 0,041" />
            <SegmentedControlItem value="0.19" label="Кремний · 0,19" />
            <SegmentedControlItem value="0.48" label="MoS₂ · 0,48" />
          </SegmentedControl>
          <Slider label="Ширина стенки (затвора), нм" value={width} min={0.3} max={4} step={0.1} valueDisplay="text" formatValue={(v: number) => num(v, 1)} onChange={(v: number) => setWidth(v as number)} onChangeEnd={(v: number) => restart(mass, energy, height, v as number)} />
          <Slider label="Высота стенки, эВ" value={height} min={0.1} max={1} step={0.01} valueDisplay="text" formatValue={(v: number) => num(v, 2)} onChange={(v: number) => setHeight(v as number)} onChangeEnd={(v: number) => restart(mass, energy, v as number)} />
          <Slider label="Энергия электрона, эВ" value={energy} min={0.05} max={0.9} step={0.01} valueDisplay="text" formatValue={(v: number) => num(v, 2)} onChange={(v: number) => setEnergy(v as number)} onChangeEnd={(v: number) => restart(mass, v as number)} />
          <HStack gap={2}>
            <Button label="Запустить заново" variant="primary" onClick={() => restart()} />
            <Button label={running ? 'Пауза' : 'Дальше'} onClick={() => setRunning(!running)} />
          </HStack>
        </Section>
        <Note text="Электрон в квантовом мире — это волна. Налетая на стенку, большая часть отражается, но маленький «хвост» просачивается насквозь — это туннелирование. Программа решает уравнение Шрёдингера на 1000 точках; результат совпадает с точной формулой для прямоугольной стенки." />
        <Note status="success" title="При чём тут чипы" text="Стенка — это закрытый короткий затвор транзистора. Тоньше 2 нм — и заметная часть электронов пролетает насквозь: транзистор не выключается. С MoS₂ тяжёлые электроны просачиваются хуже — поэтому 2D-материалы позволяют затвор короче." />
      </>}
    />
  );
}

function Litho() {
  const [srcId, setSrcId] = useState('euv');
  const [pitch, setPitch] = useState(40);
  const [offAxis, setOffAxis] = useState(true);
  const {tok} = useTok();
  const src = LITHO_SOURCES.find((s) => s.id === srcId)!;
  const threshold = 0.3;
  const samples = useMemo(() => Array.from({length: 241}, (_, k) => { const x = (k / 240) * 3 * pitch; return [x, lithoIntensity(src, pitch, offAxis, x)] as [number, number]; }), [src, pitch, offAxis]);
  const imax = Math.max(...samples.map((s) => s[1])), imin = Math.min(...samples.map((s) => s[1]));
  const contrast = imax + imin > 0 ? (imax - imin) / (imax + imin) : 0;
  const prints = imax > threshold && imin < threshold && contrast > 0.15;
  const minPitch = src.lambda / ((offAxis ? 2 : 1) * src.na);
  const ref = useCanvas((ctx, w, h) => {
    ctx.fillStyle = DARK; ctx.fillRect(0, 0, w, h);
    const pupilW = 170, pw = w - pupilW - 30, x0 = 16, span = 3 * pitch, X = (x: number) => x0 + (x / span) * pw;
    const label = (t: string, x: number, y: number, c = 'rgba(255,255,255,0.7)') => { ctx.fillStyle = c; ctx.font = '600 11px system-ui'; ctx.textAlign = 'left'; ctx.fillText(t, x, y); };
    label('маска', x0, 18);
    for (let k = 0; k < 3; k++) {
      const s = k * pitch;
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(X(s), 28, X(s + pitch / 4) - X(s), 30); ctx.fillRect(X(s + (3 * pitch) / 4), 28, X(s + pitch) - X(s + (3 * pitch) / 4), 30);
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(X(s + pitch / 4), 28, X(s + (3 * pitch) / 4) - X(s + pitch / 4), 30);
    }
    const top = 90, bottom = h - 120, im = Math.max(imax, 0.3), Y = (i: number) => bottom - (i / im) * (bottom - top);
    label('свет на пластине', x0, top - 10, tok('--color-data-categorical-teal'));
    ctx.beginPath(); samples.forEach(([x, i], k) => (k ? ctx.lineTo(X(x), Y(i)) : ctx.moveTo(X(x), Y(i))));
    const curve = new Path2D(); samples.forEach(([x, i], k) => (k ? curve.lineTo(X(x), Y(i)) : curve.moveTo(X(x), Y(i))));
    ctx.lineTo(X(span), bottom); ctx.lineTo(X(0), bottom); ctx.closePath();
    const g = ctx.createLinearGradient(0, top, 0, bottom); g.addColorStop(0, tok('--color-data-categorical-purple')); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.globalAlpha = 0.7; ctx.fill(); ctx.globalAlpha = 1;
    ctx.strokeStyle = tok('--color-data-categorical-teal'); ctx.lineWidth = 2; ctx.stroke(curve); ctx.lineWidth = 1;
    ctx.setLineDash([5, 4]); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.moveTo(X(0), Y(threshold)); ctx.lineTo(X(span), Y(threshold)); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '10px system-ui'; ctx.textAlign = 'right'; ctx.fillText('порог резиста', X(span) - 4, Y(threshold) - 6);
    const ry = h - 80;
    label('напечатано на кремнии', x0, ry - 10, tok('--color-data-categorical-green'));
    ctx.fillStyle = 'rgb(60,64,80)'; ctx.fillRect(X(0), ry, X(span) - X(0), 34);
    ctx.fillStyle = tok('--color-data-categorical-green');
    let run: number | null = null;
    for (const [x, i] of [...samples, [span + 1, 0] as [number, number]]) {
      if (i > threshold) { if (run === null) run = x; } else if (run !== null) { ctx.fillRect(X(run), ry, X(Math.min(x, span)) - X(run), 34); run = null; }
    }
    const pc = {x: w - pupilW / 2 - 14, y: h / 2 - 10}, pr = 70, scale = pr / src.na;
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.textAlign = 'center'; ctx.font = '600 11px system-ui'; ctx.fillText('объектив (NA)', pc.x, pc.y - pr - 20);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(pc.x, pc.y, pr, 0, 7); ctx.stroke(); ctx.lineWidth = 1;
    const poles = lithoPoles(src, pitch, offAxis);
    poles.forEach((s, pi) => {
      for (let m = -6; m <= 6; m++) {
        const f = (m * src.lambda) / pitch + s, x = pc.x + f * scale;
        if (Math.abs(x - pc.x) > pr + 22) continue;
        ctx.fillStyle = Math.abs(f) <= src.na ? tok('--color-data-categorical-green') : tok('--color-data-categorical-red');
        ctx.beginPath(); ctx.arc(x, pc.y + (poles.length > 1 ? (pi ? 14 : -14) : 0), m === 0 ? 6 : 4.5, 0, 7); ctx.fill();
      }
    });
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '10px system-ui'; ctx.fillText('зелёные лучи пойманы,', pc.x, pc.y + pr + 22); ctx.fillText('красные потеряны', pc.x, pc.y + pr + 36);
  }, [samples, src, pitch, offAxis]);
  return (
    <SimLayout
      canvas={<Card padding={0} height={440} variant="transparent"><canvas ref={ref} style={{width: '100%', height: '100%', display: 'block'}} aria-label="Маска, свет и напечатанный рисунок" /></Card>}
      stats={<>
        <Stat label="Шаг" value={num(pitch, 0) + ' нм'} />
        <Stat label="Предел этого сканера" value={num(minPitch, 1) + ' нм'} />
        <Stat label="Контраст" value={num(contrast * 100, 0) + ' %'} tone={contrast > 0.4 ? 'success' : contrast > 0.15 ? 'warning' : 'error'} />
        <Stat label="Результат" value={prints ? 'рисунок напечатан' : 'линии слились'} tone={prints ? 'success' : 'error'} />
      </>}
      side={<>
        <Section title="Управление">
          <Selector label="Сканер" value={srcId} onChange={(v) => v && setSrcId(v)} options={LITHO_SOURCES.map((s) => ({value: s.id, label: s.name}))} />
          <Slider label="Шаг линий на маске, нм" value={pitch} min={8} max={200} step={1} valueDisplay="text" onChange={(v: number) => setPitch(v as number)} />
          <Switch label="Внеосевое освещение (диполь)" value={offAxis} onChange={setOffAxis} />
        </Section>
        <Note text="Свет, проходя через решётку маски, расходится на «лучи-порядки» под углами, которые зависят от шага. Объектив ловит только лучи в пределах своей апертуры NA (круг справа). Если пойман только центральный луч, рисунок пропадает. Чем короче волна и больше NA, тем мельче шаг можно напечатать." />
        <Note status="success" title="Формула" text="Минимальный шаг ≈ λ / NA при обычном освещении и λ / (2·NA) при внеосевом. Для EUV 0,33: 13,5 / 0,66 ≈ 20 нм; для High-NA: 13,5 / 1,1 ≈ 12 нм — дальше нужны другие хитрости." />
      </>}
    />
  );
}

function BEC() {
  const sim = useMemo(() => new BECSim(), []);
  const [t, setT] = useState(0.7);
  const {tok} = useTok();
  const f = Math.max(0, 1 - t ** 3);
  const ref = useCanvas((ctx, w, h, time) => {
    sim.jiggle(t);
    ctx.fillStyle = DARK; ctx.fillRect(0, 0, w, h);
    const c = {x: w / 2, y: h / 2 - 40}, r0 = Math.min(w, h) * 0.42;
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    for (let k = 1; k <= 4; k++) { ctx.beginPath(); ctx.ellipse(c.x, c.y, (r0 * k) / 4, (r0 * k * 0.6) / 4, 0, 0, 7); ctx.stroke(); }
    const thermal = 0.1 + 0.3 * Math.sqrt(Math.max(t, 0.02)), cond = 0.035 * (1 + 0.08 * Math.sin(time / 333));
    const hist = new Array(80).fill(0);
    const cCol = tok('--color-data-categorical-teal'), tCol = tok('--color-data-categorical-indigo');
    for (let i = 0; i < sim.n; i++) {
      const inC = sim.rank[i] < f, s = inC ? cond : thermal;
      const px = inC ? sim.wx[i] : sim.ux[i], py = inC ? sim.wy[i] : sim.uy[i];
      ctx.globalAlpha = inC ? 0.55 : 0.8; ctx.fillStyle = inC ? cCol : tCol;
      ctx.beginPath(); ctx.arc(c.x + px * s * r0, c.y + py * s * r0 * 0.6, inC ? 3.2 : 2.2, 0, 7); ctx.fill();
      const bin = Math.floor(((px * s + 1) / 2) * 80); if (bin >= 0 && bin < 80) hist[bin]++;
    }
    ctx.globalAlpha = 1;
    const base = h - 16, hg = 80, mx = Math.max(...hist, 1);
    ctx.beginPath(); ctx.moveTo(c.x - r0, base);
    hist.forEach((v, k) => ctx.lineTo(c.x - r0 + (k / 79) * 2 * r0, base - (v / mx) * hg));
    ctx.lineTo(c.x + r0, base); ctx.closePath();
    ctx.fillStyle = cCol; ctx.globalAlpha = 0.6; ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '10.5px system-ui'; ctx.textAlign = 'left';
    ctx.fillText('сколько атомов в каждой точке', c.x - r0, base - hg - 8);
  }, [t], true);
  return (
    <SimLayout
      canvas={<Card padding={0} height={440} variant="transparent"><canvas ref={ref} style={{width: '100%', height: '100%', display: 'block'}} aria-label="Облако атомов рубидия" /></Card>}
      stats={<>
        <Stat label="Температура" value={num(t * 170, 0) + ' нК'} />
        <Stat label="Атомов в конденсате" value={num(f * 100, 0) + ' %'} tone="accent" />
        <Stat label="Состояние" value={f > 0.95 ? 'почти чистый конденсат' : f > 0 ? 'конденсат + тепловое облако' : 'обычный холодный газ'} />
      </>}
      side={<>
        <Section title="Управление">
          <Slider label="Температура (ниже 170 нК — конденсация)" value={t} min={0} max={2} step={0.01} valueDisplay="text" formatValue={(v: number) => num(v * 170, 0) + ' нК'} onChange={(v: number) => setT(v as number)} />
        </Section>
        <Note text="Выше критической температуры атомы — обычный газ: каждый летает сам по себе. Ниже атомы «сваливаются» в одно общее квантовое состояние и сжимаются в плотное ядро в центре, которое ведёт себя как одна волна. Доля конденсата растёт как 1 − (T/Tc)³. Так выглядел знаменитый опыт 1995 года." />
        <Note status="success" title="При чём тут чипы" text="Холодные атомы — основа самых точных часов (погрешность 10⁻¹⁸) и сверхчувствительных датчиков. От атомных часов ведётся отсчёт частот, по которым калибруют лазерные измерители в литографических сканерах." />
      </>}
    />
  );
}

export default function SimsPage() {
  const [kind, setKind] = useState<Kind>('particles');
  return (
    <VStack gap={6}>
      <PageHeader icon={PlayCircleIcon} title="Симуляции" subtitle="Живые модели: двигайте ползунки и смотрите, как работает физика, на которой стоят чипы." />
      <SegmentedControl label="Симуляция" value={kind} onChange={(v) => setKind(v as Kind)}>
        {KINDS.map(([id, t]) => <SegmentedControlItem key={id} value={id} label={t} />)}
      </SegmentedControl>
      {kind === 'particles' && <Particles />}
      {kind === 'tunneling' && <Tunneling />}
      {kind === 'litho' && <Litho />}
      {kind === 'bec' && <BEC />}
      <Text type="supporting" color="secondary">Все симуляции считаются прямо в браузере.</Text>
    </VStack>
  );
}
