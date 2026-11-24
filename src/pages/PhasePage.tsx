import {useMemo} from 'react';
import {VStack, HStack} from '@astryxdesign/core/Stack';
import {Grid} from '@astryxdesign/core/Grid';
import {Card} from '@astryxdesign/core/Card';
import {Heading} from '@astryxdesign/core/Heading';
import {Text} from '@astryxdesign/core/Text';
import {Badge} from '@astryxdesign/core/Badge';
import {Selector} from '@astryxdesign/core/Selector';
import {SegmentedControl, SegmentedControlItem} from '@astryxdesign/core/SegmentedControl';
import {EmptyState} from '@astryxdesign/core/EmptyState';
import {ChartBarIcon} from '../components/icons';
import {PageHeader, Note, Section, Stat} from '../components/ui';
import {Legend} from '../components/Legend';
import PhaseCanvas from '../components/PhaseCanvas';
import CompoundCards from '../components/CompoundCards';
import {useStore} from '../store';
import {ELEMENTS, element, CATEGORY_TITLE} from '../lib/elements';
import {COMPOUNDS, compound, BOND_TITLE} from '../lib/compounds';
import {modelFor, phaseAt, temperatureForVapor, PHASE_TITLE, ALL_PHASES, phaseColor, type PhaseModel} from '../lib/phase';
import {pressure, temp, tempBoth} from '../lib/fmt';
import {t} from '../i18n';

export function substanceName(id: number) {
  if (id <= 0) { const c = compound(id); return c ? `${c.name} (${c.formula})` : '—'; }
  return element(id)?.name ?? '—';
}

function PhaseFacts({m}: {m: PhaseModel}) {
  const s = useStore();
  const ph = phaseAt(m, s.tempK, s.pressure);
  const p1 = temperatureForVapor(m, 1 / 101325), p1m = temperatureForVapor(m, 1e-3 / 101325);
  return (
    <Grid columns={{minWidth: 240, max: 4, repeat: 'fit'}} gap={4}>
      <Section title={t('Маркер условий')}>
        <Stat label={t('Температура')} value={tempBoth(s.tempK)} />
        <Stat label={t('Давление')} value={pressure(s.pressure)} />
        <Stat label={t('Состояние')} value={PHASE_TITLE[ph]} tone="accent" />
      </Section>
      <Section title={t('Тройная точка')}>
        {m.heliumLike ? <Text color="secondary">{t('У гелия её нет: твёрдым он становится только под давлением выше 25 атм, даже у абсолютного нуля.')}</Text> : <>
          <Stat label={t('Температура')} value={tempBoth(m.tt)} />
          <Stat label={t('Давление')} value={pressure(m.pt)} />
          <Badge variant={m.tripleKnown ? 'success' : 'warning'} label={m.tripleKnown ? t('справочное значение') : t('оценка модели')} />
        </>}
      </Section>
      <Section title={t('Критическая точка')}>
        <Stat label={t('Температура')} value={tempBoth(m.tc)} />
        <Stat label={t('Давление')} value={pressure(m.pc)} />
        <Badge variant={m.criticalKnown ? 'success' : 'warning'} label={m.criticalKnown ? t('справочное значение') : t('грубая оценка')} />
      </Section>
      <Section title={t('Важно для техпроцесса')}>
        <Stat label={t('Испаряется заметно (пар 1 Па) при')} value={p1 ? temp(p1) : '—'} />
        <Stat label={t('«Пылит» в вакууме (1 мПа) при')} value={p1m ? temp(p1m) : '—'} />
        {m.sublimesAtOneAtm && <Badge variant="warning" label={t('при 1 атм возгоняется, минуя жидкость')} />}
        {m.anomalous && <Badge variant="warning" label={t('сжимается при плавлении, как лёд')} />}
      </Section>
    </Grid>
  );
}

export default function PhasePage() {
  const s = useStore();
  const id = s.selected;
  const model = modelFor(id);
  const comp = id <= 0 ? compound(id) : undefined;
  const el = id > 0 ? element(id) : undefined;

  const options = useMemo(() => [
    {type: 'section' as const, title: t('Соединения — из нескольких элементов'), options: COMPOUNDS.map((c) => ({value: String(c.id), label: `${c.formula} — ${c.name}`}))},
    {type: 'section' as const, title: t('Элементы'), options: ELEMENTS.filter((e) => modelFor(e.z)).map((e) => ({value: String(e.z), label: `${e.symbol} — ${e.name}`, description: `Z = ${e.z}`}))},
  ], []);

  return (
    <VStack gap={6}>
      <PageHeader icon={ChartBarIcon} title={t('Фазовые диаграммы')} subtitle={t('Карта состояний вещества: при какой температуре и каком давлении оно твёрдое, жидкое, газ или плазма.')} />
      <HStack gap={4} vAlign="end" wrap="wrap">
        <Selector label={t('Вещество')} options={options} value={String(id)} onChange={(v) => v && s.setSelected(Number(v))} hasSearch searchPlaceholder={t('Элемент или соединение')} />
        <SegmentedControl label={t('Единицы температуры')} value={s.celsius ? 'c' : 'k'} onChange={(v) => s.setCelsius(v === 'c')}>
          <SegmentedControlItem value="c" label="°C" />
          <SegmentedControlItem value="k" label="K" />
        </SegmentedControl>
      </HStack>

      <HStack gap={4} vAlign="center" wrap="wrap">
        <Card variant={comp ? 'teal' : 'blue'} padding={4}>
          <Heading level={2}>{comp?.formula ?? el?.symbol ?? '?'}</Heading>
        </Card>
        <VStack gap={1.5}>
          <Heading level={2}>{comp?.name ?? el?.name ?? '—'}</Heading>
          <HStack gap={2} wrap="wrap">
            {el && <Badge variant="blue" label={CATEGORY_TITLE[el.category]} />}
            {el && <Badge label={`Z = ${el.z}`} />}
            {comp && <Badge variant="teal" label={t('соединение · связь ') + BOND_TITLE[comp.bond]} />}
            {model && <Badge variant="info" label={t('при 25 °C и 1 атм — ') + PHASE_TITLE[phaseAt(model, 298.15, 1)].toLowerCase()} />}
          </HStack>
        </VStack>
      </HStack>

      {model ? <>
        <Card padding={4}>
          <VStack gap={3}>
            <Legend items={ALL_PHASES.map((p) => [PHASE_TITLE[p], phaseColor(p)])} />
            <PhaseCanvas model={model} modelKey={id} height={520} />
          </VStack>
        </Card>
        <Note text={t('Каждая точка — сочетание температуры (по горизонтали) и давления (по вертикали, каждое деление — в 10 раз больше). Цвет — состояние вещества. Белые линии — границы, где две фазы сосуществуют. В тройной точке встречаются все три фазы; правее критической точки жидкость и газ неразличимы; при очень высокой температуре газ становится плазмой. Наведите курсор на карту, щелчок ставит маркер условий процесса.')} />
      </> : comp ? (
        <Note status="warning" title={t('Фазовой диаграммы нет')} text={comp.noDiagram ?? t('Недостаточно данных.')} />
      ) : (
        <EmptyState title={t('Нет экспериментальных данных')} description={t('Для этого элемента не измерены температуры плавления и кипения.')} />
      )}

      {comp && <CompoundCards c={comp} />}
      {model && <PhaseFacts m={model} />}
    </VStack>
  );
}
