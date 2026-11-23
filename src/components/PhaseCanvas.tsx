import {useMemo, useRef, useState} from 'react';
import {Card} from '@astryxdesign/core/Card';
import {useCanvas} from './useCanvas';
import {useTok} from './ui';
import {useStore} from '../store';
import {
  autoRange, gasBoundary, phaseAt, pSub, pVap, tMelt, PHASE_TITLE, PHASE_TOKEN, PHASE_COMPACT, PHASE_SHORT,
  type DiagramRange, type Phase, type PhaseModel,
} from '../lib/phase';
import {decadeLabel, num, pressure, tempBoth} from '../lib/fmt';

export function parseColor(c: string): [number, number, number] {
  const s = c.trim();
  if (s.startsWith('#')) {
    const h = s.length === 4 ? s.slice(1).split('').map((x) => x + x).join('') : s.slice(1, 7);
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  const m = s.match(/[\d.]+/g);
  return m ? [Number(m[0]), Number(m[1]), Number(m[2])] : [128, 128, 128];
}

function niceStep(span: number, target = 9) {
  const raw = span / target, mag = 10 ** Math.floor(Math.log10(raw));
  for (const k of [1, 2, 2.5, 5, 10]) if (k * mag >= raw) return k * mag;
  return 10 * mag;
}

interface Fill { img: HTMLCanvasElement; labels: {phase: Phase; x: number; y: number; room: number}[] }

function renderFill(m: PhaseModel, r: DiagramRange, colors: Record<Phase, [number, number, number]>): Fill {
  const W = 640, H = 390;
  const img = document.createElement('canvas');
  img.width = W; img.height = H;
  const ctx = img.getContext('2d')!;
  const data = ctx.createImageData(W, H);
  const band = 0.1 * m.tc, violet = colors.supercritical;
  for (let j = 0; j < H; j++) {
    const fy = (j + 0.5) / H, lp = r.logPMax - fy * (r.logPMax - r.logPMin), p = 10 ** lp;
    for (let i = 0; i < W; i++) {
      const t = r.tMin + ((i + 0.5) / W) * (r.tMax - r.tMin);
      const ph = phaseAt(m, t, p);
      let [cr, cg, cb] = colors[ph];
      if ((ph === 'liquid' || ph === 'gas') && t > m.tc - band) {
        const k = 0.55 * Math.min(1, (t - (m.tc - band)) / band) * Math.exp(-Math.abs(lp - Math.log10(m.pc)) * 1.6);
        cr += (violet[0] - cr) * k; cg += (violet[1] - cg) * k; cb += (violet[2] - cb) * k;
      } else if (ph === 'supercritical') {
        const base = colors[lp > Math.log10(m.pc) + 0.4 ? 'liquid' : 'gas'];
        const k = 0.35 * (1 - Math.min(1, (t - m.tc) / (band * 1.6)));
        cr += (base[0] - cr) * k; cg += (base[1] - cg) * k; cb += (base[2] - cb) * k;
      }
      const shade = 0.88 + 0.14 * (1 - fy), o = (j * W + i) * 4;
      data.data[o] = cr * shade; data.data[o + 1] = cg * shade; data.data[o + 2] = cb * shade; data.data[o + 3] = 255;
    }
  }
  ctx.putImageData(data, 0, 0);

  // где подписать фазы: самая «глубокая» клетка каждой фазы
  const gw = 72, gh = 44, ph: Phase[] = [], d: number[] = [];
  for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {
    const lp = r.logPMax - ((j + 0.5) / gh) * (r.logPMax - r.logPMin);
    ph.push(phaseAt(m, r.tMin + ((i + 0.5) / gw) * (r.tMax - r.tMin), 10 ** lp));
  }
  for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {
    const k = j * gw + i, p = ph[k];
    d[k] = i === 0 || j === 0 || i === gw - 1 || j === gh - 1 || ph[k - 1] !== p || ph[k + 1] !== p || ph[k - gw] !== p || ph[k + gw] !== p ? 1 : 1e4;
  }
  for (let j = 1; j < gh; j++) for (let i = 1; i < gw; i++) { const k = j * gw + i; d[k] = Math.min(d[k], d[k - 1] + 1, d[k - gw] + 1); }
  for (let j = gh - 2; j >= 0; j--) for (let i = gw - 2; i >= 0; i--) { const k = j * gw + i; d[k] = Math.min(d[k], d[k + 1] + 1, d[k + gw] + 1); }
  const best = new Map<Phase, number>();
  ph.forEach((p, k) => { const b = best.get(p); if (b === undefined || d[k] > d[b]) best.set(p, k); });
  const labels = [...best.entries()].filter(([, k]) => d[k] >= 2)
    .map(([phase, k]) => ({phase, x: ((k % gw) + 0.5) / gw, y: (Math.floor(k / gw) + 0.5) / gh, room: d[k]}));
  return {img, labels};
}

export default function PhaseCanvas({model, compact = false, height = 500}: {model: PhaseModel; modelKey?: number; compact?: boolean; height?: number}) {
  const {tok, mode} = useTok();
  const store = useStore();
  const [hover, setHover] = useState<[number, number] | null>(null);
  const plotRef = useRef({x: 0, y: 0, w: 1, h: 1});
  const range = useMemo(() => autoRange(model), [model]);
  const colors = useMemo(() => Object.fromEntries((Object.keys(PHASE_TOKEN) as Phase[]).map((p) => [p, parseColor(tok(PHASE_TOKEN[p]))])) as Record<Phase, [number, number, number]>,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode]);
  const fill = useMemo(() => renderFill(model, range, colors), [model, range, colors]);

  const ref = useCanvas((ctx, w, h) => {
    const left = compact ? 52 : 86, bottom = compact ? 26 : 56;
    const plot = {x: left, y: compact ? 6 : 10, w: Math.max(10, w - left - (compact ? 8 : 18)), h: Math.max(10, h - bottom - (compact ? 6 : 10))};
    plotRef.current = plot;
    const r = range;
    const X = (t: number) => plot.x + ((t - r.tMin) / (r.tMax - r.tMin)) * plot.w;
    const Y = (p: number) => plot.y + ((r.logPMax - Math.log10(p)) / (r.logPMax - r.logPMin)) * plot.h;
    const textSecondary = tok('--color-text-secondary');
    const font = (size: number, weight = 500) => `${weight} ${size}px ${tok('--font-family-body') || 'system-ui'}`;

    ctx.save();
    ctx.beginPath(); ctx.roundRect(plot.x, plot.y, plot.w, plot.h, compact ? 6 : 10); ctx.clip();
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(fill.img, plot.x, plot.y, plot.w, plot.h);

    // сетка
    const decades = r.logPMax - r.logPMin;
    const every = compact ? (decades > 12 ? 3 : 2) : decades > 14 ? 2 : 1;
    const off = store.celsius ? 273.15 : 0;
    const tStep = niceStep(r.tMax - r.tMin, compact ? 5 : 9);
    ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.lineWidth = 0.7; ctx.beginPath();
    for (let e = Math.ceil(r.logPMin); e <= r.logPMax; e += every) { ctx.moveTo(plot.x, Y(10 ** e)); ctx.lineTo(plot.x + plot.w, Y(10 ** e)); }
    for (let v = Math.ceil((r.tMin - off) / tStep) * tStep; v <= r.tMax - off; v += tStep) { ctx.moveTo(X(v + off), plot.y); ctx.lineTo(X(v + off), plot.y + plot.h); }
    ctx.stroke();

    // линии равновесия
    ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = compact ? 1.4 : 2.2;
    const N = 260;
    const line = (f: (k: number) => [number, number]) => { ctx.beginPath(); for (let k = 0; k <= N; k++) { const [x, y] = f(k); if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke(); };
    if (!model.heliumLike) line((k) => { const t = r.tMin + ((model.tt - r.tMin) * k) / N; return [X(t), Y(Math.max(pSub(model, t), 1e-300))]; });
    const t0 = model.heliumLike ? Math.max(r.tMin, model.tt) : model.tt;
    line((k) => { const t = t0 + ((model.tc - t0) * k) / N; return [X(t), Y(pVap(model, t))]; });
    const lpS = Math.log10(model.heliumLike ? 25 : model.pt);
    if (r.logPMax > lpS) line((k) => { const p = 10 ** (lpS + ((r.logPMax - lpS) * k) / N); return [X(tMelt(model, p)), Y(p)]; });
    ctx.setLineDash([5, 4]); ctx.lineWidth = compact ? 1 : 1.4; ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath(); ctx.moveTo(X(model.tc), Y(model.pc)); ctx.lineTo(plot.x + plot.w, Y(model.pc));
    ctx.moveTo(X(model.tc), Y(model.pc)); ctx.lineTo(X(model.tc), plot.y); ctx.stroke(); ctx.setLineDash([]);

    // 1 атм
    if (!compact && r.logPMin < 0) {
      ctx.setLineDash([2, 3]); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(plot.x, Y(1)); ctx.lineTo(plot.x + plot.w, Y(1)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.font = font(11, 600); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
      ctx.fillText('1 атм — обычное давление', plot.x + 8, Y(1) - 3);
    }

    // подписи фаз
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const l of fill.labels) {
      if (compact && l.room < 3) continue;
      let text = compact ? PHASE_SHORT[l.phase].toUpperCase() : l.room < 8 ? PHASE_COMPACT[l.phase] : PHASE_TITLE[l.phase].toUpperCase();
      const size = compact ? 9 : l.room >= 9 ? 17 : l.room >= 4 ? 14 : 11;
      let tw = text.length * size * 0.68;
      if (!compact && tw > plot.w * 0.45) { text = PHASE_COMPACT[l.phase]; tw = text.length * size * 0.68; }
      const x = Math.max(plot.x + tw / 2 + 8, Math.min(plot.x + plot.w - tw / 2 - 8, plot.x + l.x * plot.w));
      ctx.font = font(size, 800); ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 3; ctx.fillStyle = 'white';
      ctx.fillText(text, x, plot.y + l.y * plot.h);
      ctx.shadowBlur = 0;
    }
    ctx.restore();

    // точки
    const dot = (t: number, p: number, label: string) => {
      if (t < r.tMin || t > r.tMax || Math.log10(p) < r.logPMin || Math.log10(p) > r.logPMax) return;
      const rad = compact ? 3.5 : 5.5;
      ctx.beginPath(); ctx.arc(X(t), Y(p), rad, 0, 7); ctx.fillStyle = 'white'; ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1; ctx.stroke();
      if (!compact) { ctx.font = font(11, 700); ctx.fillStyle = 'white'; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 2; ctx.fillText(label, X(t) + 9, Y(p) + 2); ctx.shadowBlur = 0; }
    };
    if (!model.heliumLike) dot(model.tt, model.pt, 'тройная точка');
    dot(model.tc, model.pc, 'критическая точка');

    // маркер условий
    const tm = store.tempK, pm = store.pressure;
    if (tm >= r.tMin && tm <= r.tMax && Math.log10(pm) >= r.logPMin && Math.log10(pm) <= r.logPMax) {
      const rad = compact ? 5 : 8;
      ctx.beginPath(); ctx.arc(X(tm), Y(pm), rad + 3, 0, 7); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill();
      ctx.beginPath(); ctx.arc(X(tm), Y(pm), rad, 0, 7); ctx.fillStyle = tok('--color-accent'); ctx.fill();
      ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke();
    }

    // оси
    ctx.fillStyle = textSecondary; ctx.font = font(compact ? 9 : 11.5);
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (let e = Math.ceil(r.logPMin); e <= r.logPMax; e += every) ctx.fillText(decadeLabel(e), plot.x - 7, Y(10 ** e));
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let v = Math.ceil((r.tMin - off) / tStep) * tStep; v <= r.tMax - off; v += tStep) {
      ctx.fillText(num(Math.abs(v) < tStep * 1e-6 ? 0 : v, tStep < 1 ? 1 : 0) + (store.celsius ? '°' : ''), X(v + off), plot.y + plot.h + 6);
    }
    if (!compact) {
      ctx.font = font(12.5, 600);
      ctx.fillText(store.celsius ? 'Температура, °C' : 'Температура, K', plot.x + plot.w / 2, plot.y + plot.h + 32);
      ctx.save(); ctx.translate(16, plot.y + plot.h / 2); ctx.rotate(-Math.PI / 2); ctx.textBaseline = 'middle';
      ctx.fillText('Давление, атмосфер (логарифмическая шкала)', 0, 0); ctx.restore();
    }

    // подсказка при наведении
    if (hover && !compact) {
      const [hx, hy] = hover;
      const t = r.tMin + ((hx - plot.x) / plot.w) * (r.tMax - r.tMin);
      const p = 10 ** (r.logPMax - ((hy - plot.y) / plot.h) * (r.logPMax - r.logPMin));
      const ph = phaseAt(model, t, p);
      const lines = [PHASE_TITLE[ph], tempBoth(t), pressure(p), 'щелчок — поставить маркер'];
      const bw = 210, bh = 84, bx = Math.min(hx + 16, plot.x + plot.w - bw), by = Math.max(hy - bh - 8, plot.y);
      ctx.fillStyle = tok('--color-background-card'); ctx.strokeStyle = tok('--color-border');
      ctx.shadowColor = 'rgba(0,0,0,0.2)'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 10); ctx.fill(); ctx.shadowBlur = 0; ctx.stroke();
      ctx.beginPath(); ctx.arc(bx + 16, by + 18, 5, 0, 7); ctx.fillStyle = tok(PHASE_TOKEN[ph]); ctx.fill();
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillStyle = tok('--color-text-primary'); ctx.font = font(13, 700); ctx.fillText(lines[0], bx + 28, by + 18);
      ctx.font = font(11.5); ctx.fillText(lines[1], bx + 12, by + 38); ctx.fillText(lines[2], bx + 12, by + 55);
      ctx.fillStyle = textSecondary; ctx.font = font(10); ctx.fillText(lines[3], bx + 12, by + 72);
    }
  }, [fill, range, store.tempK, store.pressure, store.celsius, hover, compact, mode]);

  const toTP = (x: number, y: number): [number, number] | null => {
    const p = plotRef.current;
    if (x < p.x || x > p.x + p.w || y < p.y || y > p.y + p.h) return null;
    return [range.tMin + ((x - p.x) / p.w) * (range.tMax - range.tMin), 10 ** (range.logPMax - ((y - p.y) / p.h) * (range.logPMax - range.logPMin))];
  };

  return (
    <Card padding={0} height={height} variant="transparent">
      <canvas
        ref={ref}
        style={{width: '100%', height: '100%', cursor: compact ? 'default' : 'crosshair', display: 'block'}}
        aria-label={`Фазовая диаграмма: ${model.name}`}
        onMouseMove={(e) => { if (compact) return; const b = e.currentTarget.getBoundingClientRect(); const x = e.clientX - b.left, y = e.clientY - b.top; setHover(toTP(x, y) ? [x, y] : null); }}
        onMouseLeave={() => setHover(null)}
        onClick={(e) => { const b = e.currentTarget.getBoundingClientRect(); const tp = toTP(e.clientX - b.left, e.clientY - b.top); if (tp) { store.setTempK(tp[0]); store.setPressure(tp[1]); } }}
      />
    </Card>
  );
}

export {gasBoundary};
