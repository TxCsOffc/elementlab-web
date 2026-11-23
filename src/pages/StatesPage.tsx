import {useState} from 'react';
import {VStack, HStack} from '@astryxdesign/core/Stack';
import {Grid} from '@astryxdesign/core/Grid';
import {Card} from '@astryxdesign/core/Card';
import {Text} from '@astryxdesign/core/Text';
import {Heading} from '@astryxdesign/core/Heading';
import {Badge} from '@astryxdesign/core/Badge';
import {SegmentedControl, SegmentedControlItem} from '@astryxdesign/core/SegmentedControl';
import {SparklesIcon} from '../components/icons';
import {PageHeader, Note, Section} from '../components/ui';
import {Legend} from '../components/Legend';
import RangeBars from '../components/RangeBars';
import {MATTER, PRECISION, RELEVANCE, relevanceOf, type Relevance} from '../lib/exotic';
import {num, sci} from '../lib/fmt';

const tr = (t: number) => (t < 1 || t > 1e5 ? sci(t, 0) : num(t, 0)) + ' K';

export default function StatesPage() {
  const [filter, setFilter] = useState<Relevance | 'all'>('all');
  const shown = MATTER.filter((s) => filter === 'all' || s.relevance === filter);
  return (
    <VStack gap={6}>
      <PageHeader icon={SparklesIcon} title="Состояния вещества" subtitle="22 состояния — от твёрдого тела до кварк-глюонной плазмы, включая квантовые и «не атомные». Для каждого указано, как оно связано с чипами и точными измерениями." />
      <Grid columns={{minWidth: 360, max: 2, repeat: 'fit'}} gap={4}>
        <Note title="Сколько всего состояний?" text="Единого числа нет. В школе называют 3–4, в физике — десятки: всё зависит от того, что считать отдельным состоянием. Здесь собраны 22 главных, подтверждённых экспериментом." />
        <Note status="warning" title="Дают ли они сверхточность?" text="Да, но точность измерений, а не размер транзисторов. Холодные атомы задают время с погрешностью 10⁻¹⁸, квантовый эффект Холла и эффект Джозефсона — ом и вольт с погрешностью 10⁻¹⁰. От этих эталонов калибруются приборы фабрик. Сам транзистор делают меньше плазма, сверхкритический CO₂, аморфные плёнки и самосборка полимеров." />
      </Grid>
      <Section title="Где по температуре живёт каждое состояние">
        <RangeBars rows={MATTER.map((s) => ({name: s.name, from: s.tMin, to: s.tMax, color: relevanceOf(s.relevance).token}))}
          domain={[1e-10, 1e14]} ticks={[1e-9, 1e-6, 1e-3, 1, 1e3, 1e6, 1e9, 1e12]} xLabel="Температура, K (каждое деление — в 1000 раз)"
          band={{from: 233, to: 398, label: 'чип'}} />
        <Legend items={RELEVANCE.map((r) => [r.title, `var(${r.token})`])} />
        <Text type="supporting" color="secondary">Зелёная полоса — рабочие температуры чипа (−40…+125 °C). Обычный транзистор может использовать только то, что её пересекает; квантовым компьютерам нужен глубокий холод.</Text>
      </Section>
      <Section title="Каталог" end={
        <SegmentedControl label="Фильтр" value={filter} onChange={(v) => setFilter(v as Relevance | 'all')} size="sm">
          <SegmentedControlItem value="all" label="Все" />
          {RELEVANCE.map((r) => <SegmentedControlItem key={r.id} value={r.id} label={r.title} />)}
        </SegmentedControl>}>
        <Grid columns={{minWidth: 300, max: 3, repeat: 'fit'}} gap={3}>
          {shown.map((s) => {
            const rel = relevanceOf(s.relevance);
            return (
              <Card key={s.id} padding={4} variant="muted">
                <VStack gap={2}>
                  <VStack gap={0.5}>
                    <Heading level={4}>{s.name}</Heading>
                    <Text type="supporting" color="secondary">{s.group}</Text>
                  </VStack>
                  <HStack gap={1.5} wrap="wrap">
                    <Badge variant={rel.badge} label={rel.title} />
                    {s.precision && <Badge variant="yellow" label={s.precision} />}
                  </HStack>
                  <Text>{s.what}</Text>
                  <Text type="supporting" color={s.relevance === 'none' ? 'secondary' : 'accent'}>{s.chip}</Text>
                  <HStack hAlign="between" gap={2}>
                    <VStack gap={0}><Text type="supporting" color="secondary">Температуры</Text><Text type="supporting" weight="semibold" hasTabularNumbers>{tr(s.tMin)} … {tr(s.tMax)}</Text></VStack>
                    <VStack gap={0} hAlign="end"><Text type="supporting" color="secondary">Открыто</Text><Text type="supporting" weight="semibold" justify="end">{s.year}</Text></VStack>
                  </HStack>
                  <Text type="supporting" color="secondary">Пример: {s.example}</Text>
                </VStack>
              </Card>
            );
          })}
        </Grid>
      </Section>
      <Section title="Самые точные измерения человечества и требования фабрики">
        <RangeBars rows={[...PRECISION].sort((a, b) => a.value - b.value).map((p) => ({name: p.name, from: 1e-20, to: p.value, color: p.kind === 'quantum' ? '--color-data-yellow-4' : '--color-data-categorical-blue'}))}
          domain={[1e-20, 1]} ticks={[1e-19, 1e-15, 1e-11, 1e-7, 1e-3]} xLabel="Относительная погрешность (левее — точнее)" showValue />
        <Legend items={[['квантовое состояние вещества', 'var(--color-data-yellow-4)'], ['требование фабрики', 'var(--color-data-categorical-blue)']]} />
        <Text type="supporting" color="secondary">Фабрике нужно совмещать слои с точностью ~3·10⁻⁹. Лазерные интерферометры сканеров калибруются по частоте, которую задают атомные часы, так что запас у эталонов — миллиард раз.</Text>
      </Section>
    </VStack>
  );
}
