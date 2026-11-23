import {useDeferredValue, useMemo, useState} from 'react';
import {CartesianGrid, ReferenceArea, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis} from 'recharts';
import {VStack, HStack} from '@astryxdesign/core/Stack';
import {Grid} from '@astryxdesign/core/Grid';
import {Text} from '@astryxdesign/core/Text';
import {Heading} from '@astryxdesign/core/Heading';
import {Badge} from '@astryxdesign/core/Badge';
import {Slider} from '@astryxdesign/core/Slider';
import {Switch} from '@astryxdesign/core/Switch';
import {Selector} from '@astryxdesign/core/Selector';
import {SegmentedControl, SegmentedControlItem} from '@astryxdesign/core/SegmentedControl';
import {Table, type TableColumn} from '@astryxdesign/core/Table';
import {Banner} from '@astryxdesign/core/Banner';
import {WrenchScrewdriverIcon} from '../components/icons';
import {PageHeader, Note, Section, Stat, LEVEL_BADGE, trlBadge} from '../components/ui';
import {useChartColors} from '../components/charts';
import {Legend} from '../components/Legend';
import {
  ARCHS, CHANNELS, METALS, PATTERNING, DEFAULT_PARAMS, REALISM_TITLE, evaluate, metalElement, normalize, rankKey, realism, reference, searchAll, valueCost,
  type ProcessParams, type ProcessResult,
} from '../lib/tech';
import {num, sci} from '../lib/fmt';

const LEVEL_TOKEN = ['--color-data-categorical-green', '--color-data-yellow-4', '--color-data-categorical-red'];

function RealismChecks({r}: {r: ProcessResult}) {
  return (
    <Grid columns={{minWidth: 260, max: 3, repeat: 'fit'}} gap={2}>
      {r.checks.map((c) => (
        <Banner key={c.name} status={c.level === 0 ? 'success' : c.level === 1 ? 'warning' : 'error'} title={`${c.name}: ${c.value}`} description={c.note} collapsible={false} />
      ))}
    </Grid>
  );
}

export default function ProcessPage() {
  const [params, setParams] = useState<ProcessParams>(DEFAULT_PARAMS);
  const [target, setTarget] = useState(1);
  const [minTRL, setMinTRL] = useState(4);
  const [cfg, setCfg] = useState({litho: 'hna', arch: 'cfet', channel: 'MoS2', metal: '44', backside: true});
  const dParams = useDeferredValue(params);
  const results = useMemo(() => searchAll(dParams), [dParams]);
  const filtered = useMemo(() => results.filter((r) => r.node <= target && r.trl >= minTRL).sort((a, b) => rankKey(a) - rankKey(b)), [results, target, minTRL]);
  const best = filtered[0];
  const mature = results.filter((r) => r.node <= target && r.trl >= 7 && realism(r) === 0).sort((a, b) => valueCost(a) - valueCost(b))[0];
  const matureBest = results.filter((r) => r.trl >= 7 && realism(r) === 0).sort((a, b) => a.node - b.node)[0];
  const set = (k: keyof ProcessParams, v: number | boolean) => setParams({...params, [k]: v});
  const c = useChartColors();

  const manual = normalize(evaluate({
    litho: PATTERNING.find((x) => x.id === cfg.litho)!, arch: ARCHS.find((x) => x.id === cfg.arch)!,
    channel: CHANNELS.find((x) => x.id === cfg.channel)!, metal: METALS.find((x) => String(x.z) === cfg.metal)!, backside: cfg.backside,
  }, params), reference(params));

  const scatter = [0, 1, 2].map((lvl) => results.filter((r) => realism(r) === lvl && valueCost(r) < 8 && r.node < 3).map((r) => ({node: r.node, cost: valueCost(r)})));

  type PRow = ProcessResult & {i: number} & Record<string, unknown>;
  const columns: TableColumn<PRow>[] = [
    {key: 'i', header: '#', renderCell: (r) => <Text weight="bold" color={r.i === 0 ? 'accent' : 'secondary'}>{r.i + 1}</Text>},
    {key: 'l', header: 'Литография', renderCell: (r) => <Text type="supporting">{r.cfg.litho.name}</Text>},
    {key: 'a', header: 'Архитектура', renderCell: (r) => <Text type="supporting">{r.cfg.arch.name}</Text>},
    {key: 'c', header: 'Канал', renderCell: (r) => <Text type="supporting">{r.cfg.channel.name}</Text>},
    {key: 'm', header: 'Провода', renderCell: (r) => <Text type="supporting" weight="semibold">{metalElement(r.cfg.metal).symbol}{r.cfg.backside ? ' · снизу' : ''}</Text>},
    {key: 'n', header: 'Узел', renderCell: (r) => <Text weight="semibold" hasTabularNumbers>{num(r.node, 2)} нм</Text>},
    {key: 'p', header: 'Цена', renderCell: (r) => <Text hasTabularNumbers>×{num(r.costPerTr, 2)}</Text>},
    {key: 's', header: 'Скорость', renderCell: (r) => <Text hasTabularNumbers>×{num(r.perf, 2)}</Text>},
    {key: 'v', header: 'Итог', renderCell: (r) => <Badge variant={valueCost(r) < 1 ? 'success' : 'warning'} label={'×' + num(valueCost(r), 2)} />},
    {key: 'y', header: 'Выход', renderCell: (r) => <Text hasTabularNumbers>{num(r.yield * 100, 0)} %</Text>},
    {key: 't', header: 'Зрелость', renderCell: (r) => <Badge variant={trlBadge(r.trl)} label={'TRL ' + r.trl} />},
    {key: 'r', header: 'Реализм', renderCell: (r) => <Badge variant={LEVEL_BADGE[realism(r)]} label={REALISM_TITLE[realism(r)]} />},
  ];

  return (
    <VStack gap={6}>
      <PageHeader icon={WrenchScrewdriverIcon} title="Поиск техпроцесса меньше 1 нм" subtitle="Перебор литографии × архитектуры × материала канала × металла × питания. Каждый вариант проходит 6 проверок реализма." />
      <Grid columns={{minWidth: 420, max: 2, repeat: 'fit'}} gap={4}>
        <Section title="Лучший найденный вариант">
          {best ? <>
            <HStack gap={3} vAlign="center" wrap="wrap">
              <Heading level={1} type="display-3">≈ {num(best.node, 2)} нм</Heading>
              <Badge variant={LEVEL_BADGE[realism(best)]} label={REALISM_TITLE[realism(best)]} />
              <Badge variant={trlBadge(best.trl)} label={'TRL ' + best.trl} />
            </HStack>
            <VStack gap={1}>
              {([['Литография', best.cfg.litho.name], ['Архитектура', best.cfg.arch.name], ['Канал', best.cfg.channel.name],
                ['Провода', metalElement(best.cfg.metal).name], ['Питание', best.cfg.backside ? 'с обратной стороны' : 'сверху']] as [string, string][]).map(([k, v]) => (
                <HStack key={k} gap={3}><Text color="secondary">{k}</Text><Text weight="semibold">{v}</Text></HStack>
              ))}
            </VStack>
            <HStack gap={5} wrap="wrap">
              <Stat label="Цена транзистора" value={'×' + num(best.costPerTr, 2)} />
              <Stat label="Скорость" value={'×' + num(best.perf, 2)} />
              <Stat label="Итоговая цена" value={'×' + num(valueCost(best), 2)} tone="accent" />
              <Stat label="Выход" value={num(best.yield * 100, 0) + ' %'} />
            </HStack>
            {best.checks.filter((x) => x.level > 0).map((x) => <Text key={x.name} type="supporting" color="secondary">⚠ {x.name}: {x.note}</Text>)}
            {mature ? <Badge variant="success" label={`На готовых технологиях: ${mature.cfg.litho.name} + ${mature.cfg.arch.name} — ≈ ${num(mature.node, 2)} нм`} />
              : matureBest && <Text type="supporting" color="secondary">На готовых и полностью реалистичных технологиях цель недостижима: лучшее ≈ {num(matureBest.node, 2)} нм ({matureBest.cfg.litho.name} + {matureBest.cfg.arch.name}).</Text>}
          </> : <Text color="secondary">Нет вариантов с такими условиями. Ослабьте цель или требование к зрелости.</Text>}
        </Section>
        <Section title="Все варианты: плотность против итоговой цены">
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart margin={{top: 10, right: 16, bottom: 22, left: 8}}>
              <CartesianGrid stroke={c.grid} strokeDasharray="3 3" />
              <XAxis dataKey="node" type="number" domain={[0, 3]} stroke={c.axis} tick={{fill: c.axis, fontSize: 11}} label={{value: 'Маркетинговый узел, нм (левее — плотнее)', position: 'insideBottom', offset: -12, fill: c.axis, fontSize: 11}} />
              <YAxis dataKey="cost" type="number" scale="log" domain={[0.1, 8]} ticks={[0.1, 0.25, 0.5, 1, 2, 4, 8]} tickFormatter={(v) => '×' + num(v, 2)} stroke={c.axis} tick={{fill: c.axis, fontSize: 11}} />
              <ReferenceArea x1={0} x2={target} y1={0.1} y2={1} fill={c.good} fillOpacity={0.08} />
              <ReferenceLine x={target} stroke={c.neutral} strokeDasharray="5 4" />
              <ReferenceLine y={1} stroke={c.neutral} label={{value: 'эталон «2 нм»', position: 'insideTopRight', fill: c.axis, fontSize: 10}} />
              <Tooltip contentStyle={{background: c.surface, borderColor: c.grid, borderRadius: 8, color: c.text}} formatter={(v) => num(Number(v), 2)} />
              {scatter.map((d, lvl) => <Scatter key={lvl} data={d} fill={c.tok(LEVEL_TOKEN[lvl])} fillOpacity={0.65} shape="circle" isAnimationActive={false} legendType="none" r={2} />)}
              {best && <Scatter data={[{node: best.node, cost: valueCost(best)}]} fill={c.tok('--color-accent')} shape="star" />}
            </ScatterChart>
          </ResponsiveContainer>
          <Legend items={[['реалистично', `var(${LEVEL_TOKEN[0]})`], ['на грани', `var(${LEVEL_TOKEN[1]})`], ['фантастика', `var(${LEVEL_TOKEN[2]})`], ['лучший', 'var(--color-accent)']]} />
        </Section>
      </Grid>

      <Section title="Условия поиска">
        <Grid columns={{minWidth: 220, max: 3, repeat: 'fit'}} gap={4}>
          <SegmentedControl label="Литография" value={params.potential ? 'p' : 't'} onChange={(v) => set('potential', v === 'p')}>
            <SegmentedControlItem value="t" label="сегодня" />
            <SegmentedControlItem value="p" label="потенциал ~2032" />
          </SegmentedControl>
          <Slider label="Цель, нм" value={target} min={0.3} max={2} step={0.01} valueDisplay="text" formatValue={(v: number) => '≤ ' + num(v, 2)} onChange={(v: number) => setTarget(v as number)} />
          <Slider label="Минимальная зрелость (TRL)" value={minTRL} min={1} max={9} step={1} valueDisplay="text" onChange={(v: number) => setMinTRL(v as number)} />
          <Slider label="Спейсер, нм" value={params.spacer} min={2} max={10} step={0.1} valueDisplay="text" formatValue={(v: number) => num(v, 1)} onChange={(v: number) => set('spacer', v as number)} />
          <Slider label="Изолятор затвора (EOT), нм" value={params.eot} min={0.3} max={1.2} step={0.01} valueDisplay="text" formatValue={(v: number) => num(v, 2)} onChange={(v: number) => set('eot', v as number)} />
          <Slider label="Макс. сопротивление провода, Ом/мкм" value={params.rMax} min={300} max={5000} step={50} valueDisplay="text" onChange={(v: number) => set('rMax', v as number)} />
        </Grid>
        <Switch label="Скрывать фантастику (варианты, нарушающие физику или надёжность)" value={params.realisticOnly} onChange={(v) => set('realisticOnly', v)} />
      </Section>

      <Section title="Топ-12 по итоговой цене">
        <Table data={filtered.slice(0, 12).map((r, i) => ({...r, i}) as PRow)} columns={columns} idKey={(r) => `${r.cfg.litho.id}-${r.cfg.arch.id}-${r.cfg.channel.id}-${r.cfg.metal.z}-${r.cfg.backside}`} density="compact" />
      </Section>

      <Section title="Соберите свой вариант">
        <Grid columns={{minWidth: 200, max: 5, repeat: 'fit'}} gap={3}>
          <Selector label="Литография" value={cfg.litho} onChange={(v) => v && setCfg({...cfg, litho: v})} options={PATTERNING.map((x) => ({value: x.id, label: x.name}))} />
          <Selector label="Архитектура" value={cfg.arch} onChange={(v) => v && setCfg({...cfg, arch: v})} options={ARCHS.map((x) => ({value: x.id, label: x.name}))} />
          <Selector label="Канал" value={cfg.channel} onChange={(v) => v && setCfg({...cfg, channel: v})} options={CHANNELS.map((x) => ({value: x.id, label: x.name}))} />
          <Selector label="Металл проводов" value={cfg.metal} onChange={(v) => v && setCfg({...cfg, metal: v})} options={METALS.map((x) => ({value: String(x.z), label: `${metalElement(x).symbol} · ${metalElement(x).name}`}))} />
          <Switch label="Питание с обратной стороны" value={cfg.backside} onChange={(v) => setCfg({...cfg, backside: v})} />
        </Grid>
        {manual.issues.length ? <Banner status="error" title="Невозможно" description={manual.issues.join('; ')} collapsible={false} /> : <>
          <HStack gap={5} wrap="wrap">
            <VStack gap={0.5}><Text type="supporting" color="secondary">Вердикт</Text><Badge variant={LEVEL_BADGE[realism(manual)]} label={REALISM_TITLE[realism(manual)]} /></VStack>
            <Stat label="Узел" value={'≈ ' + num(manual.node, 2) + ' нм'} />
            <Stat label="Затвор" value={num(manual.lg, 1) + ' нм'} />
            <Stat label="Шаг затворов" value={num(manual.cpp, 1) + ' нм'} />
            <Stat label="Шаг металла" value={num(manual.mmp, 1) + ' нм'} />
            <Stat label="Выход годных" value={sci(manual.yield * 100, 1) + ' %'} />
            <Stat label="Цена транзистора" value={'×' + sci(manual.costPerTr, 2)} />
            <Stat label="Скорость" value={'×' + sci(manual.perf, 2)} />
          </HStack>
          <RealismChecks r={manual} />
          <Text type="supporting" color="secondary">Шаг затворов ограничивает: {manual.cppLimit}; шаг металла: {manual.mmpLimit}.</Text>
        </>}
      </Section>

      <Note title="Как считается" text="«Нм» — маркетинговые: 2 нм × √(площадь ячейки / площадь эталона «2 нм» класса: шаг затворов 45 нм × шаг металла 21 нм × 6 дорожек). Цена транзистора = цена пластины / (плотность × выход годных). Скорость учитывает тепло, контакт, ёмкость спейсера и провода. Итоговая цена = цена ÷ скорость; всё относительно эталона (EUV, GAA, кремний, медь) = 1. Пороги проверок — оценки, а не результаты моделирования." />
    </VStack>
  );
}
