import {useState} from 'react';
import {CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis} from 'recharts';
import {VStack, HStack} from '@astryxdesign/core/Stack';
import {Grid} from '@astryxdesign/core/Grid';
import {Text} from '@astryxdesign/core/Text';
import {Heading} from '@astryxdesign/core/Heading';
import {Badge} from '@astryxdesign/core/Badge';
import {ClickableCard} from '@astryxdesign/core/ClickableCard';
import {SegmentedControl, SegmentedControlItem} from '@astryxdesign/core/SegmentedControl';
import {SunIcon} from '../components/icons';
import {PageHeader, Section, Stat, trlBadge} from '../components/ui';
import {useChartColors} from '../components/charts';
import {Legend} from '../components/Legend';
import {PATTERNING, BOOSTERS, EXCLUDED, type Patterning} from '../lib/tech';
import {num} from '../lib/fmt';

const POT_TOKEN: Record<number, string> = {5: '--color-data-categorical-green', 4: '--color-data-categorical-blue', 3: '--color-data-yellow-4', 2: '--color-data-categorical-red'};

function Dot(props: {cx?: number; cy?: number; payload?: {n: number; size: number; pot: number; id: string}; selected: string; tok: (n: string) => string}) {
  const {cx = 0, cy = 0, payload, selected, tok} = props;
  if (!payload) return null;
  const r = payload.size;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={tok(POT_TOKEN[payload.pot] ?? POT_TOKEN[2])} stroke={payload.id === selected ? tok('--color-text-primary') : 'none'} strokeWidth={2} />
      <text x={cx} y={cy + 4} textAnchor="middle" fill="white" fontWeight={800} fontSize={Math.max(10, r * 0.9)}>{payload.n}</text>
    </g>
  );
}

export default function LithoPage() {
  const [potential, setPotential] = useState(false);
  const [selected, setSelected] = useState('hna');
  const c = useChartColors();
  const data = PATTERNING.map((m, i) => ({n: i + 1, id: m.id, name: m.name, pitch: potential ? m.pitchPotential : m.pitchToday, cost: m.cost, year: m.year, today: m.pitchToday, size: 9 + m.wph / 30, pot: m.potential}));
  const axis = {stroke: c.axis, tick: {fill: c.axis, fontSize: 11}};
  const tooltip = <Tooltip cursor={false} contentStyle={{background: c.surface, borderColor: c.grid, borderRadius: 8, color: c.text}}
    formatter={(v, k) => [String(v), String(k)]} labelFormatter={() => ''} />;
  const shape = (p: object) => <Dot {...(p as object)} selected={selected} tok={c.tok} />;

  return (
    <VStack gap={6}>
      <PageHeader icon={SunIcon} title="Литография с реальным потенциалом" subtitle="Литография рисует на кремнии линии будущих транзисторов и проводов. От её шага зависит плотность чипа, от стоимости слоя — цена." />
      <Grid columns={{minWidth: 440, max: 2, repeat: 'fit'}} gap={4}>
        <Section title="Шаг против стоимости слоя" end={
          <SegmentedControl label="Горизонт" value={potential ? 'p' : 't'} onChange={(v) => setPotential(v === 'p')} size="sm">
            <SegmentedControlItem value="t" label="Сегодня" />
            <SegmentedControlItem value="p" label="Потенциал ~2032" />
          </SegmentedControl>}>
          <ResponsiveContainer width="100%" height={340}>
            <ScatterChart margin={{top: 16, right: 16, bottom: 22, left: 8}}>
              <CartesianGrid stroke={c.grid} strokeDasharray="3 3" />
              <XAxis dataKey="pitch" type="number" name="Шаг, нм" domain={[8, 32]} {...axis} label={{value: 'Минимальный шаг линий, нм (меньше — плотнее)', position: 'insideBottom', offset: -12, fill: c.axis, fontSize: 11}} />
              <YAxis dataKey="cost" type="number" name="Цена слоя" scale="log" domain={[0.8, 12]} ticks={[1, 2, 4, 8]} tickFormatter={(v) => '×' + num(v, 1)} {...axis} />
              <ZAxis dataKey="n" name="№" />
              {tooltip}
              <Scatter data={data} shape={shape} isAnimationActive onClick={(d) => setSelected((d as unknown as {id: string}).id)} />
            </ScatterChart>
          </ResponsiveContainer>
          <Text type="supporting" color="secondary">Идеал — левый нижний угол: мелкий шаг и дешёвый слой. Размер круга — производительность, цвет — потенциал. Номера совпадают на обоих графиках и в списке.</Text>
        </Section>
        <Section title="Дорожная карта шага линий">
          <ResponsiveContainer width="100%" height={340}>
            <ScatterChart margin={{top: 16, right: 16, bottom: 22, left: 8}}>
              <CartesianGrid stroke={c.grid} strokeDasharray="3 3" />
              <XAxis dataKey="year" type="number" name="Год" domain={[2015, 2034]} ticks={[2016, 2020, 2024, 2028, 2032]} {...axis} label={{value: 'Год начала массового производства (факт или оценка)', position: 'insideBottom', offset: -12, fill: c.axis, fontSize: 11}} />
              <YAxis dataKey="today" type="number" name="Шаг, нм" domain={[8, 32]} {...axis} />
              {tooltip}
              <Scatter data={data.map((d) => ({...d, size: 12}))} shape={shape} onClick={(d) => setSelected((d as unknown as {id: string}).id)} />
            </ScatterChart>
          </ResponsiveContainer>
          <Legend items={[['потенциал 5', `var(${POT_TOKEN[5]})`], ['потенциал 4', `var(${POT_TOKEN[4]})`], ['потенциал 3', `var(${POT_TOKEN[3]})`], ['потенциал 2', `var(${POT_TOKEN[2]})`]]} />
        </Section>
      </Grid>

      <Section title="Методы">
        <Grid columns={{minWidth: 420, max: 2, repeat: 'fit'}} gap={3}>
          {PATTERNING.map((m, i) => <MethodCard key={m.id} m={m} n={i + 1} isOpen={m.id === selected} onOpen={() => setSelected(m.id)} />)}
        </Grid>
      </Section>

      <Grid columns={{minWidth: 420, max: 2, repeat: 'fit'}} gap={4}>
        <Section title="Усилители: сами не печатают, но делают печать лучше">
          {BOOSTERS.map(([t, d]) => <VStack key={t} gap={0.5}><Text weight="semibold">{t}</Text><Text type="supporting" color="secondary">{d}</Text></VStack>)}
        </Section>
        <Section title="Без потенциала для массового производства">
          {EXCLUDED.map(([t, d]) => <VStack key={t} gap={0.5}><Text weight="semibold">{t}</Text><Text type="supporting" color="secondary">{d}</Text></VStack>)}
        </Section>
      </Grid>
    </VStack>
  );
}

function MethodCard({m, n, isOpen, onOpen}: {m: Patterning; n: number; isOpen: boolean; onOpen: () => void}) {
  return (
    <ClickableCard label={`${m.name}: подробнее`} onClick={onOpen} padding={4} variant={isOpen ? 'blue' : 'default'}>
      <VStack gap={3}>
        <HStack hAlign="between" vAlign="start" gap={2}>
          <VStack gap={1}>
            <Heading level={4}>{n}. {m.name}</Heading>
            <HStack gap={1.5} wrap="wrap">
              <Badge variant="teal" label={m.family} />
              <Badge variant={m.year <= 2026 ? 'success' : 'warning'} label={m.year <= 2026 ? `в производстве с ${m.year}` : `ожидается ≈ ${m.year}`} />
              <Badge variant={m.potential >= 5 ? 'success' : m.potential >= 4 ? 'info' : m.potential >= 3 ? 'warning' : 'error'} label={'потенциал ' + '●'.repeat(m.potential) + '○'.repeat(5 - m.potential)} />
            </HStack>
          </VStack>
        </HStack>
        <HStack gap={5} wrap="wrap">
          <Stat label="Шаг: сейчас → потенциал" value={`${m.pitchToday} → ${m.pitchPotential} нм`} />
          <Stat label="Цена слоя" value={'×' + num(m.cost, 1)} />
          <Stat label="Пластин/ч" value={m.wph} />
          <VStack gap={0.5}><Text type="supporting" color="secondary">Зрелость</Text><Badge variant={trlBadge(m.trl)} label={'TRL ' + m.trl} /></VStack>
        </HStack>
        <Text>{m.principle}</Text>
        {isOpen ? (
          <VStack gap={1}>
            {m.pros.map((p) => <Text key={p} type="supporting">✓ {p}</Text>)}
            {m.cons.map((p) => <Text key={p} type="supporting" color="secondary">⚠ {p}</Text>)}
            <Text type="supporting" color="secondary">Оборудование: {m.tool}</Text>
            <Text type="supporting" color="secondary">Кто: {m.players}</Text>
          </VStack>
        ) : <Text type="supporting" color="accent">Нажмите, чтобы увидеть плюсы, минусы и компании</Text>}
      </VStack>
    </ClickableCard>
  );
}
