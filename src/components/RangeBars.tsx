import {Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';
import {useChartColors} from './charts';
import {sci} from '../lib/fmt';

export interface RangeRow { name: string; from: number; to: number; color: string }

/** Горизонтальные полосы на логарифмической оси X (диапазоны и «лестницы») */
export default function RangeBars({rows, domain, xLabel, ticks, band, showValue, height}: {
  rows: RangeRow[]; domain: [number, number]; xLabel: string; ticks: number[];
  band?: {from: number; to: number; label: string}; showValue?: boolean; height?: number;
}) {
  const c = useChartColors();
  const data = rows.map((r) => ({...r, range: [r.from, r.to]}));
  return (
    <ResponsiveContainer width="100%" height={height ?? rows.length * 30 + 60}>
      <BarChart data={data} layout="vertical" margin={{top: 16, right: showValue ? 70 : 20, bottom: 22, left: 8}} barCategoryGap={6}>
        <CartesianGrid stroke={c.grid} strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" scale="log" domain={domain} ticks={ticks} allowDataOverflow tickFormatter={(v) => sci(v, 0)}
          stroke={c.axis} tick={{fill: c.axis, fontSize: 11}} label={{value: xLabel, position: 'insideBottom', offset: -12, fill: c.axis, fontSize: 11}} />
        <YAxis type="category" dataKey="name" width={230} stroke={c.axis} tick={{fill: c.text, fontSize: 12}} />
        {band && <ReferenceArea x1={band.from} x2={band.to} fill={c.good} fillOpacity={0.18}
          label={{value: band.label, position: 'top', fill: c.good, fontSize: 11, fontWeight: 700}} />}
        <Tooltip cursor={{fill: c.grid, fillOpacity: 0.3}} contentStyle={{background: c.surface, borderColor: c.grid, borderRadius: 8, color: c.text}}
          formatter={(v) => { const [a, b] = v as unknown as [number, number]; return showValue ? sci(b, 2) : `${sci(a, 1)} … ${sci(b, 1)}`; }} />
        <Bar dataKey="range" radius={4} isAnimationActive={false}>
          {data.map((d) => <Cell key={d.name} fill={c.tok(d.color)} />)}
          {showValue && <LabelList dataKey="to" position="right" formatter={(v: unknown) => sci(Number(v), 1)} style={{fill: c.axis, fontSize: 11}} />}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
