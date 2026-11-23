import {CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import {useTok} from './ui';
import {sci, num} from '../lib/fmt';

export const SERIES_TOKENS = [
  '--color-data-categorical-blue', '--color-data-categorical-orange', '--color-data-categorical-green', '--color-data-categorical-purple',
  '--color-data-categorical-pink', '--color-data-categorical-cyan', '--color-data-categorical-red', '--color-data-categorical-teal',
  '--color-data-categorical-brown', '--color-data-categorical-indigo',
];

export function useChartColors() {
  const {tok} = useTok();
  return {
    series: (i: number) => tok(SERIES_TOKENS[i % SERIES_TOKENS.length]),
    axis: tok('--color-text-secondary'),
    grid: tok('--color-border'),
    neutral: tok('--color-data-neutral'),
    good: tok('--color-data-categorical-green'),
    surface: tok('--color-background-card'),
    text: tok('--color-text-primary'),
    tok,
  };
}

function niceTicks(xs: number[]) {
  if (!xs.length) return undefined;
  const lo = xs[0], hi = xs[xs.length - 1], span = hi - lo;
  const step = span > 40 ? 10 : span > 16 ? 5 : span > 8 ? 2 : 1;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(v);
  return out;
}

export interface Series { name: string; points: [number, number][] }

/** Линейный график нескольких серий; logY — логарифмическая ось Y */
export function MultiLine({series, xLabel, yDomain, logY, height = 320, refs = [], yFormat}: {
  series: Series[]; xLabel: string; yDomain: [number, number]; logY?: boolean; height?: number;
  refs?: {y: number; label: string; good?: boolean}[]; yFormat?: (v: number) => string;
}) {
  const c = useChartColors();
  const xs = [...new Set(series.flatMap((s) => s.points.map((p) => p[0])))].sort((a, b) => a - b);
  const data = xs.map((x) => {
    const row: Record<string, number> = {x};
    for (const s of series) { const p = s.points.find((q) => q[0] === x); if (p) row[s.name] = p[1]; }
    return row;
  });
  const fmt = yFormat ?? ((v: number) => (logY ? sci(v, 0) : num(v, 0)));
  const ticks = logY ? Array.from({length: Math.round(Math.log10(yDomain[1]) - Math.log10(yDomain[0])) + 1}, (_, k) => 10 ** (Math.log10(yDomain[0]) + k)) : undefined;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{top: 10, right: 16, bottom: 30, left: 8}}>
        <CartesianGrid stroke={c.grid} strokeDasharray="3 3" />
        <XAxis dataKey="x" type="number" domain={['dataMin', 'dataMax']} allowDecimals={false} ticks={niceTicks(xs)} stroke={c.axis} tick={{fill: c.axis, fontSize: 11}}
          label={{value: xLabel, position: 'insideBottom', offset: -10, fill: c.axis, fontSize: 11}} />
        <YAxis scale={logY ? 'log' : 'linear'} domain={yDomain} allowDataOverflow ticks={ticks?.filter((_, k, a) => a.length < 8 || k % 2 === 0)}
          tickFormatter={fmt} stroke={c.axis} tick={{fill: c.axis, fontSize: 11}} width={64} />
        <Tooltip formatter={(v) => fmt(Number(v))} labelFormatter={(l) => `${xLabel}: ${num(Number(l), 2)}`}
          contentStyle={{background: c.surface, borderColor: c.grid, borderRadius: 8, color: c.text}} />
        <Legend verticalAlign="bottom" wrapperStyle={{fontSize: 12, paddingTop: 28}} />
        {refs.map((r) => <ReferenceLine key={r.label} y={r.y} stroke={r.good ? c.good : c.neutral} strokeDasharray={r.good ? undefined : '5 4'}
          label={{value: r.label, position: 'insideTopRight', fill: r.good ? c.good : c.axis, fontSize: 10}} />)}
        {series.map((s, i) => <Line key={s.name} dataKey={s.name} stroke={c.series(i)} strokeWidth={2} dot={false} isAnimationActive={false} connectNulls />)}
      </LineChart>
    </ResponsiveContainer>
  );
}
