import {CartesianGrid, LabelList, Legend as RLegend, Line, LineChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis} from 'recharts';
import {VStack} from '@astryxdesign/core/Stack';
import {Grid} from '@astryxdesign/core/Grid';
import {Text} from '@astryxdesign/core/Text';
import {ClockIcon} from '../components/icons';
import {PageHeader, Note, Section, Stat} from '../components/ui';
import {useChartColors} from '../components/charts';
import {num, sci} from '../lib/fmt';
import {t} from '../i18n';

// Число транзисторов в известных чипах (публичные данные производителей)
const CHIPS: [number, string, number, string][] = [
  [1971, 'Intel 4004', 2.3e3, '10 µm'],
  [1974, 'Intel 8080', 4.5e3, '6 µm'],
  [1978, 'Intel 8086', 2.9e4, '3 µm'],
  [1982, 'Intel 80286', 1.34e5, '1.5 µm'],
  [1985, 'Intel 80386', 2.75e5, '1.5 µm'],
  [1989, 'Intel 80486', 1.18e6, '1 µm'],
  [1993, 'Pentium', 3.1e6, '0.8 µm'],
  [1997, 'Pentium II', 7.5e6, '350 nm'],
  [2000, 'Pentium 4', 4.2e7, '180 nm'],
  [2006, 'Core 2 Duo', 2.91e8, '65 nm'],
  [2008, 'Core i7 (Nehalem)', 7.31e8, '45 nm'],
  [2012, 'Core i7 (Ivy Bridge)', 1.4e9, '22 nm'],
  [2017, 'Apple A11', 4.3e9, '10 nm'],
  [2020, 'Apple M1', 1.6e10, '5 nm'],
  [2022, 'Apple M1 Ultra', 1.14e11, '5 nm'],
  [2022, 'NVIDIA H100', 8e10, '4N'],
  [2023, 'Apple M3 Max', 9.2e10, '3 nm'],
  [2024, 'NVIDIA B200', 2.08e11, '4NP'],
];

// Название узла и реальный шаг затворов (CPP), нм — приближённые публичные данные
const NODES: [number, number, number][] = [
  [2006, 65, 220], [2008, 45, 160], [2010, 32, 112.5], [2012, 22, 90], [2014, 14, 70],
  [2018, 7, 57], [2020, 5, 51], [2022, 3, 48], [2025, 2, 45],
];

export default function MoorePage() {
  const c = useChartColors();
  const axis = {stroke: c.axis, tick: {fill: c.axis, fontSize: 11}};
  const tip = {contentStyle: {background: c.surface, borderColor: c.grid, borderRadius: 8, color: c.text}};
  const doubling = Math.log(2) / (Math.log(CHIPS[CHIPS.length - 1][2] / CHIPS[0][2]) / (CHIPS[CHIPS.length - 1][0] - CHIPS[0][0]));
  const trend = [1971, 1980, 1990, 2000, 2010, 2020, 2026].map((y) => ({year: y, trend: CHIPS[0][2] * 2 ** ((y - 1971) / doubling)}));
  return (
    <VStack gap={6}>
      <PageHeader icon={ClockIcon} title={t('Закон Мура')} subtitle={t('Как число транзисторов росло 50 лет подряд — и почему «нанометры» в названиях перестали означать размер.')} />
      <Grid columns={{minWidth: 200, max: 4, repeat: 'fit'}} gap={4}>
        <Section title={t('1971')}><Stat label="Intel 4004" value={t('{0} транзисторов', num(2300, 0))} /></Section>
        <Section title={t('2024')}><Stat label="NVIDIA B200" value={t('{0} млрд транзисторов', 208)} /></Section>
        <Section title={t('Рост')}><Stat label={t('за 53 года')} value={'×' + sci(2.08e11 / 2300, 0)} tone="accent" /></Section>
        <Section title={t('Удвоение')}><Stat label={t('в среднем каждые')} value={t('{0} года', num(doubling, 1))} /></Section>
      </Grid>
      <Section title={t('Транзисторов в одном чипе')}>
        <ResponsiveContainer width="100%" height={420}>
          <ScatterChart margin={{top: 20, right: 30, bottom: 30, left: 20}}>
            <CartesianGrid stroke={c.grid} strokeDasharray="3 3" />
            <XAxis dataKey="year" type="number" domain={[1968, 2027]} {...axis} label={{value: t('Год'), position: 'insideBottom', offset: -16, fill: c.axis, fontSize: 12}} />
            <YAxis dataKey="n" type="number" scale="log" domain={[1e3, 1e12]} ticks={[1e3, 1e5, 1e7, 1e9, 1e11]} tickFormatter={(v) => sci(v, 0)} width={60} {...axis} />
            <Tooltip {...tip} formatter={(v, k) => (k === 'n' ? sci(Number(v), 2) : String(v))} />
            <Scatter data={trend.map((p) => ({year: p.year, n: p.trend}))} line={{stroke: c.neutral, strokeDasharray: '6 4'}} shape={() => <g />} isAnimationActive={false} legendType="none" />
            <Scatter data={CHIPS.map(([year, name, n, node]) => ({year, n, name, node}))} fill={c.series(0)} isAnimationActive={false}>
              <LabelList dataKey="name" position="top" style={{fill: c.axis, fontSize: 10}} />
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <Text type="supporting" color="secondary">{t('Пунктир — удвоение каждые {0} года. Логарифмическая шкала: каждое деление — в 100 раз больше. Последние годы рост держится за счёт больших и составных кристаллов (чиплетов), а не только уменьшения транзисторов.', num(doubling, 1))}</Text>
      </Section>
      <Section title={t('«Нанометры» в названии против реального шага затворов')}>
        <ResponsiveContainer width="100%" height={380}>
          <LineChart data={NODES.map(([year, name, cpp]) => ({year, name, cpp, label: `«${name} nm»`}))} margin={{top: 20, right: 30, bottom: 30, left: 20}}>
            <CartesianGrid stroke={c.grid} strokeDasharray="3 3" />
            <XAxis dataKey="year" type="number" domain={[2005, 2026]} {...axis} label={{value: t('Год'), position: 'insideBottom', offset: -16, fill: c.axis, fontSize: 12}} />
            <YAxis scale="log" domain={[1, 300]} ticks={[1, 3, 10, 30, 100, 300]} {...axis} width={50} label={{value: t('нм'), angle: -90, position: 'insideLeft', fill: c.axis}} />
            <Tooltip {...tip} />
            <RLegend wrapperStyle={{fontSize: 12, paddingTop: 20}} />
            <Line dataKey="name" name={t('Название узла, нм')} stroke={c.series(1)} strokeWidth={2.5} isAnimationActive={false}>
              <LabelList dataKey="label" position="bottom" style={{fill: c.axis, fontSize: 10}} />
            </Line>
            <Line dataKey="cpp" name={t('Реальный шаг затворов (CPP), нм')} stroke={c.series(0)} strokeWidth={2.5} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
        <Text type="supporting" color="secondary">{t('До ~2010 года название примерно совпадало с длиной затвора. Потом транзисторы стали трёхмерными, и плотность росла иначе — а имена продолжили уменьшать по традиции. У «2 нм» чипа шаг затворов ≈ 45 нм, то есть в 20 раз больше названия. Данные о шаге — приблизительные.')}</Text>
      </Section>
      <Note title={t('Что дальше')} text={t('Плотность растёт уже не столько за счёт уменьшения, сколько за счёт новой архитектуры: GAA, питание с обратной стороны, транзисторы друг над другом (CFET) и 3D-сборка кристаллов. Посмотрите, что из этого реально, на странице «Поиск техпроцесса».')} />
    </VStack>
  );
}
