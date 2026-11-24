import {useState} from 'react';
import {VStack, HStack, StackItem} from '@astryxdesign/core/Stack';
import {Grid} from '@astryxdesign/core/Grid';
import {Card} from '@astryxdesign/core/Card';
import {Heading} from '@astryxdesign/core/Heading';
import {Text} from '@astryxdesign/core/Text';
import {Badge} from '@astryxdesign/core/Badge';
import {Button} from '@astryxdesign/core/Button';
import {Slider} from '@astryxdesign/core/Slider';
import {SegmentedControl, SegmentedControlItem} from '@astryxdesign/core/SegmentedControl';
import {Squares2X2Icon} from '../components/icons';
import {PageHeader, Section, Stat} from '../components/ui';
import {Legend} from '../components/Legend';
import PhaseCanvas from '../components/PhaseCanvas';
import {useStore} from '../store';
import {ELEMENTS, element, gridPos, CATEGORY_COLOR, CATEGORY_TITLE, atomDiameterNm, type Element, type Category} from '../lib/elements';
import {modelFor, phaseAt, gasBoundary, phaseColor, PHASE_SHORT, PHASE_TITLE, ALL_PHASES} from '../lib/phase';
import {SC_TC, SC_USE, BEC, FERMI, SUPERSOLID, SUPERFLUID, CLOCKS, FAB_PLASMA} from '../lib/exotic';
import {containing} from '../lib/compounds';
import {neutrons, upQuarks, downQuarks, stability} from '../lib/nuclear';
import {num, pressure, sci, temp, tempBoth} from '../lib/fmt';
import {t} from '../i18n';

type Mode = 'phase' | 'category' | 'abundance' | 'melting' | 'sc' | 'quantum';
const MODES: [Mode, string][] = [['phase', t('Состояние')], ['category', t('Группы')], ['abundance', t('Доступность')], ['melting', t('Тугоплавкость')], ['sc', t('Сверхпроводимость')], ['quantum', t('Квантовые')]];

const PRESETS: [string, number, number][] = [
  [t('Комната'), 298.15, 1], [t('ALD · 300 °C · 1 торр'), 573.15, 1 / 760], [t('Предел BEOL · 400 °C'), 673.15, 1],
  [t('Рост 2D · 800 °C · 10 торр'), 1073.15, 10 / 760], [t('Эпитаксия Si · 650 °C'), 923.15, 0.02], [t('Напыление · 1500 °C · вакуум'), 1773.15, 1e-9],
];

const ramp = (name: string, f: number) => `var(--color-data-${name}-${Math.max(1, Math.min(5, 1 + Math.round(f * 4)))})`;
const darkText = 'var(--color-data-gray-5)';

function cellStyle(e: Element, mode: Mode, tK: number, p: number): {fill: string; sub: string; dark?: boolean} {
  switch (mode) {
    case 'phase': {
      const m = modelFor(e.z);
      if (!m) return {fill: phaseColor('unknown'), sub: '?'};
      const ph = phaseAt(m, tK, p);
      return {fill: phaseColor(ph), sub: PHASE_SHORT[ph]};
    }
    case 'category': return {fill: CATEGORY_COLOR[e.category], sub: e.name};
    case 'abundance': {
      if (e.abundance === undefined) return {fill: 'var(--color-data-gray-2)', sub: '—', dark: true};
      const f = Math.max(0, Math.min(1, (Math.log10(e.abundance) + 6) / 11.7));
      return {fill: ramp('orange', f), sub: sci(e.abundance, 1), dark: f < 0.4};
    }
    case 'melting': {
      if (e.melt === undefined) return {fill: 'var(--color-data-gray-2)', sub: '—', dark: true};
      const f = Math.max(0, Math.min(1, (Math.log10(e.melt) - 1) / (Math.log10(3700) - 1)));
      return {fill: ramp('red', f), sub: num(e.melt - 273.15, 0) + '°', dark: f < 0.4};
    }
    case 'sc': {
      const tc = SC_TC[e.z];
      if (tc === undefined) return {fill: 'var(--color-data-gray-2)', sub: '—', dark: true};
      const f = Math.max(0, Math.min(1, (Math.log10(tc) + 4) / 5));
      return {fill: ramp('blue', 0.25 + 0.75 * f), sub: (tc < 0.01 ? sci(tc, 0) : num(tc, tc < 1 ? 2 : 1)) + ' K'};
    }
    case 'quantum': {
      const clock = !!CLOCKS[e.z], cond = !!(BEC[e.z] || SUPERFLUID[e.z] || FERMI[e.z]);
      const tags = [clock && t('часы'), BEC[e.z] && t('БЭК'), SUPERFLUID[e.z] && t('св.тек')].filter(Boolean).join('+');
      if (clock && cond) return {fill: 'var(--color-data-categorical-orange)', sub: tags};
      if (clock) return {fill: 'var(--color-data-yellow-4)', sub: tags};
      if (cond) return {fill: 'var(--color-data-categorical-cyan)', sub: tags || t('ферми')};
      return {fill: 'var(--color-data-gray-2)', sub: '—', dark: true};
    }
  }
}

function PeriodicSvg({mode, hover, setHover}: {mode: Mode; hover: number | null; setHover: (z: number | null) => void}) {
  const s = useStore();
  const C = 10, G = 0.7; // условные единицы viewBox
  const W = 18 * C + 17 * G, H = 9.4 * C + 9 * G;
  return (
    <svg viewBox={`-1 -1 ${W + 2} ${H + 2}`} width="100%" role="img" aria-label={t('Периодическая таблица')} style={{display: 'block', overflow: 'visible'}}>
      {[['57–71', 5], ['89–103', 6]].map(([label, r]) => (
        <g key={label as string} transform={`translate(${2 * (C + G)}, ${(r as number) * (C + G)})`}>
          <rect width={C} height={C} rx={1.4} style={{fill: 'none', stroke: 'var(--color-border)', strokeDasharray: '1 1', strokeWidth: 0.2}} />
          <text x={C / 2} y={C / 2 + 0.6} textAnchor="middle" style={{fontSize: 1.8, fill: 'var(--color-text-secondary)'}}>{label}</text>
        </g>
      ))}
      {ELEMENTS.map((e) => {
        const [col, row] = gridPos(e.z);
        const st = cellStyle(e, mode, s.tempK, s.pressure);
        const sel = s.selected === e.z, hov = hover === e.z;
        const textFill = st.dark ? darkText : 'white';
        return (
          <g key={e.z} transform={`translate(${(col - 1) * (C + G) + C / 2}, ${row * (C + G) + C / 2}) scale(${hov ? 1.12 : 1})`}
            style={{cursor: 'pointer', transition: 'transform 120ms'}}
            onMouseEnter={() => setHover(e.z)} onMouseLeave={() => setHover(null)}
            onClick={() => s.setSelected(e.z)} onDoubleClick={() => s.go('phase', e.z)}
            role="button" aria-label={`${e.name}, ${st.sub}`}>
            <rect x={-C / 2} y={-C / 2} width={C} height={C} rx={1.6} style={{fill: st.fill, stroke: sel ? 'var(--color-text-primary)' : 'none', strokeWidth: 0.5}} />
            <text x={-C / 2 + 0.8} y={-C / 2 + 2.1} style={{fontSize: 1.6, fill: textFill, opacity: 0.85}}>{e.z}</text>
            <text x={0} y={0.9} textAnchor="middle" style={{fontSize: 3.6, fontWeight: 700, fill: textFill}}>{e.symbol}</text>
            <text x={0} y={3.6} textAnchor="middle" style={{fontSize: 1.45, fill: textFill}} textLength={st.sub.length > 9 ? C - 1.2 : undefined} lengthAdjust="spacingAndGlyphs">{st.sub}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Detail({z}: {z: number}) {
  const s = useStore();
  const e = element(z);
  if (!e) return <Text color="secondary">{t('Выберите элемент')}</Text>;
  const m = modelFor(e.z);
  const ph = m ? phaseAt(m, s.tempK, s.pressure) : undefined;
  const pv = m ? gasBoundary(m, s.tempK) : 0;
  const pa = pv * 101325;
  const vol = pa < 1e-7 ? t('Практически не испаряется — не загрязняет вакуумную камеру.') : pa < 1e-2 ? t('Слабо летуч: при долгом нагреве в вакууме понемногу испаряется.') : pa < 100 ? t('Заметно летуч — годится для напыления испарением, но опасен как загрязнитель.') : t('Сильно летуч или газ при этих условиях.');
  const exotic: string[] = [];
  if (SC_TC[z] !== undefined) exotic.push(t('Сверхпроводник ниже {0} K.', SC_TC[z] < 0.01 ? sci(SC_TC[z], 1) : num(SC_TC[z], 2)) + (SC_USE[z] ? ' ' + SC_USE[z] : ''));
  if (SUPERFLUID[z]) exotic.push(SUPERFLUID[z]);
  if (BEC[z]) exotic.push(t('Конденсат Бозе–Эйнштейна: {0}, {1}.', BEC[z][1], BEC[z][0]));
  if (FERMI[z]) exotic.push(t('Фермионный конденсат: {0}.', FERMI[z]));
  if (SUPERSOLID[z]) exotic.push(t('Сверхтвёрдое тело: {0}.', SUPERSOLID[z]));
  if (CLOCKS[z]) exotic.push(CLOCKS[z]);
  if (FAB_PLASMA[z]) exotic.push(FAB_PLASMA[z]);
  const comps = containing(z);
  const d = atomDiameterNm(e);
  const [stText, stTone] = stability(z);
  return (
    <VStack gap={4}>
      <HStack gap={3} vAlign="center">
        <svg width="72" height="72" aria-hidden>
          <rect width="72" height="72" rx="14" style={{fill: CATEGORY_COLOR[e.category as Category]}} />
          <text x="36" y="22" textAnchor="middle" style={{fill: 'white', fontSize: 'var(--text-supporting-size)', fontWeight: 600}}>{e.z}</text>
          <text x="36" y="52" textAnchor="middle" style={{fill: 'white', fontSize: 'var(--text-heading-2-size)', fontWeight: 700}}>{e.symbol}</text>
        </svg>
        <VStack gap={1}>
          <Heading level={2}>{e.name}</Heading>
          <Badge label={CATEGORY_TITLE[e.category]} variant="blue" />
          <Text type="supporting" color="secondary">{num(e.mass, 3)} {t('а.е.м.')}</Text>
        </VStack>
      </HStack>
      {m && ph && (
        <Section title={t('При выбранных условиях')}>
          <Stat label={t('Состояние')} value={PHASE_TITLE[ph]} tone="accent" />
          <Stat label={t('Давление насыщенного пара')} value={pressure(pv)} />
          <Text type="supporting" color="secondary">{vol}</Text>
          <PhaseCanvas model={m} modelKey={z} compact height={190} />
          <Button label={t('Открыть фазовую диаграмму')} variant="primary" onClick={() => s.go('phase', z)} />
        </Section>
      )}
      {exotic.length > 0 && (
        <Section title={t('Особые состояния и применения')}>
          {exotic.map((t) => <Text key={t}>• {t}</Text>)}
        </Section>
      )}
      {comps.length > 0 && (
        <Section title={t('Входит в состав')}>
          <HStack gap={2} wrap="wrap">
            {comps.map((c) => <Button key={c.id} label={`${c.formula} · ${c.name}`} size="sm" variant="secondary" onClick={() => s.go('phase', c.id)} />)}
          </HStack>
        </Section>
      )}
      <Section title={t('Ядро')}>
        <HStack gap={4} wrap="wrap">
          <Stat label={t('Протонов')} value={e.z} />
          <Stat label={t('Нейтронов')} value={'≈ ' + neutrons(e)} />
          <Stat label={t('Кварков u/d')} value={`${upQuarks(e)}/${downQuarks(e)}`} />
        </HStack>
        <Badge variant={stTone} label={stText} />
        <Button label={t('Подробнее о ядре')} variant="ghost" size="sm" onClick={() => s.go('nucleus', z)} />
      </Section>
      <Section title={t('Свойства')}>
        <VStack gap={1.5}>
          {([[t('Плавление'), e.melt !== undefined ? temp(e.melt) : undefined], [e.z === 6 || e.z === 33 ? t('Возгонка') : t('Кипение'), e.boil !== undefined ? temp(e.boil) : undefined],
            [t('Плотность'), e.density !== undefined ? num(e.density, 4) + t(' г/см³') : undefined], [t('Электроотриц.'), e.en !== undefined ? num(e.en, 2) : undefined],
            [t('Радиус атома'), e.radius !== undefined ? num(e.radius, 0) + t(' пм') : undefined], [t('В земной коре'), e.abundance !== undefined ? sci(e.abundance, 2) + ' ppm' : undefined]] as [string, string | undefined][])
            .map(([k, v]) => (
              <HStack key={k} hAlign="between" gap={2}>
                <Text type="supporting" color="secondary">{k}</Text>
                <Text type="supporting" weight="medium" hasTabularNumbers>{v ?? t('нет данных')}</Text>
              </HStack>
            ))}
        </VStack>
      </Section>
      {d && (
        <Section title={t('Насколько это мало')}>
          <HStack gap={5}>
            <Stat label={t('Диаметр атома')} value={num(d, 3) + t(' нм')} />
            <Stat label={t('Атомов в 1 нм')} value={'≈ ' + num(1 / d, 1)} />
          </HStack>
          <Text type="supporting" color="secondary">{t('«1 нм» в названии техпроцесса — маркетинг: шаг затворов у таких чипов ≈ 40–45 нм, то есть ≈')} {Math.round(42 / d)} {t('атомов')} {e.symbol} {t('в ряд.')}</Text>
        </Section>
      )}
    </VStack>
  );
}

export default function TablePage() {
  const s = useStore();
  const [mode, setMode] = useState<Mode>('phase');
  const [hover, setHover] = useState<number | null>(null);

  const legend: [string, string][] = mode === 'phase' ? [...ALL_PHASES.map((p) => [PHASE_TITLE[p], phaseColor(p)] as [string, string]), [t('нет данных'), phaseColor('unknown')]]
    : mode === 'category' ? (Object.keys(CATEGORY_TITLE) as Category[]).map((c) => [CATEGORY_TITLE[c], CATEGORY_COLOR[c]])
    : mode === 'quantum' ? [[t('атомные часы'), 'var(--color-data-yellow-4)'], [t('конденсаты / сверхтекучесть'), 'var(--color-data-categorical-cyan)'], [t('и то и другое'), 'var(--color-data-categorical-orange)']]
    : mode === 'abundance' ? [1, 3, 5].map((k) => [k === 1 ? t('редкий') : k === 3 ? t('средне') : t('распространённый'), `var(--color-data-orange-${k})`])
    : mode === 'melting' ? [1, 3, 5].map((k) => [k === 1 ? t('легкоплавкий') : k === 3 ? t('средне') : t('тугоплавкий'), `var(--color-data-red-${k})`])
    : [2, 4, 5].map((k) => [k === 2 ? 'T_c ≈ 0,001 K' : k === 4 ? '≈ 1 K' : '≈ 10 K', `var(--color-data-blue-${k})`]);

  const note: Record<Mode, string> = {
    phase: '',
    category: '',
    abundance: t('Сколько элемента в земной коре (ppm по массе). Массовое производство дёшево масштабируется на распространённых элементах: Si, Al, Ti, Mo — да; Ru, Rh, Ir, Te — дефицит.'),
    melting: t('Температура плавления при 1 атм. Чем тугоплавче металл проводника, тем медленнее его разрушает электромиграция.'),
    sc: t('Элементы, которые при обычном давлении становятся сверхпроводниками. Рекорд среди элементов — ниобий (9,25 K); он, алюминий и тантал — основа сверхпроводящих кубитов.'),
    quantum: t('Атомы, из которых получены конденсаты Бозе–Эйнштейна, и атомы самых точных часов (Cs задаёт секунду, Sr, Yb и ион Al⁺ дают ~10⁻¹⁸).'),
  };

  return (
    <VStack gap={6}>
      <PageHeader icon={Squares2X2Icon} title={t('118 элементов')} subtitle={t('Задайте температуру и давление — таблица покажет, в каком состоянии каждый элемент. Двойной щелчок открывает фазовую диаграмму.')} />
      <Grid columns={{minWidth: 340, max: 2, repeat: 'fit'}} gap={4}>
        <Card padding={4}>
          <VStack gap={2}>
            <Text type="supporting" color="secondary">{t('Температура')}</Text>
            <Heading level={2}>{tempBoth(s.tempK)}</Heading>
            <Slider label={t('Температура')} isLabelHidden value={s.tempK} min={1} max={6500} step={1} onChange={(v: number) => s.setTempK(v as number)} formatValue={(v: number) => temp(v)} />
          </VStack>
        </Card>
        <Card padding={4}>
          <VStack gap={2}>
            <Text type="supporting" color="secondary">{t('Давление')}</Text>
            <Heading level={2}>{pressure(s.pressure)}</Heading>
            <Slider label={t('Давление (логарифм)')} isLabelHidden value={Math.log10(s.pressure)} min={-12} max={6} step={0.05} onChange={(v: number) => s.setPressure(10 ** (v as number))} formatValue={(v: number) => pressure(10 ** v)} />
          </VStack>
        </Card>
      </Grid>
      <HStack gap={2} wrap="wrap" vAlign="center">
        <Text type="supporting" color="secondary">{t('Условия процессов:')}</Text>
        {PRESETS.map(([name, t, p]) => <Button key={name} label={name} size="sm" variant="secondary" onClick={() => { s.setTempK(t); s.setPressure(p); }} />)}
      </HStack>

      <HStack gap={6} vAlign="start" wrap="wrap">
        <StackItem size="fill">
        <VStack gap={4}>
          <SegmentedControl label={t('Раскраска таблицы')} value={mode} onChange={(v) => setMode(v as Mode)} size="sm">
            {MODES.map(([id, t]) => <SegmentedControlItem key={id} value={id} label={t} />)}
          </SegmentedControl>
          <PeriodicSvg mode={mode} hover={hover} setHover={setHover} />
          <Legend items={legend} />
          {note[mode] && <Text type="supporting" color="secondary">{note[mode]}</Text>}
        </VStack>
        </StackItem>
        <Card padding={4} width={360}>
          <Detail z={hover ?? (s.selected > 0 ? s.selected : 14)} />
        </Card>
      </HStack>
    </VStack>
  );
}
