import {useMemo, useState} from 'react';
import {CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis} from 'recharts';
import {VStack, HStack} from '@astryxdesign/core/Stack';
import {Card} from '@astryxdesign/core/Card';
import {Text} from '@astryxdesign/core/Text';
import {Button} from '@astryxdesign/core/Button';
import {Selector} from '@astryxdesign/core/Selector';
import {Switch} from '@astryxdesign/core/Switch';
import {ChartBarIcon} from '../components/icons';
import {PageHeader, Note, Section} from '../components/ui';
import {useChartColors} from '../components/charts';
import {Legend} from '../components/Legend';
import {useStore} from '../store';
import {ELEMENTS, CATEGORY_COLOR, CATEGORY_TITLE, type Category, type Element} from '../lib/elements';
import {IONIZATION, SC_TC} from '../lib/exotic';
import {num, sci} from '../lib/fmt';
import {t} from '../i18n';

interface Prop { id: string; label: string; unit: string; log: boolean; get: (e: Element) => number | undefined }

const PROPS: Prop[] = [
  {id: 'z', label: t('Атомный номер'), unit: '', log: false, get: (e) => e.z},
  {id: 'mass', label: t('Атомная масса'), unit: t('а.е.м.'), log: false, get: (e) => e.mass},
  {id: 'melt', label: t('Температура плавления'), unit: 'K', log: false, get: (e) => e.melt},
  {id: 'boil', label: t('Температура кипения'), unit: 'K', log: false, get: (e) => e.boil},
  {id: 'density', label: t('Плотность'), unit: t('г/см³'), log: true, get: (e) => e.density},
  {id: 'en', label: t('Электроотрицательность'), unit: '', log: false, get: (e) => e.en},
  {id: 'radius', label: t('Ковалентный радиус'), unit: t('пм'), log: false, get: (e) => e.radius},
  {id: 'ion', label: t('Энергия ионизации'), unit: t('эВ'), log: false, get: (e) => IONIZATION[e.z]},
  {id: 'abundance', label: t('Содержание в земной коре'), unit: 'ppm', log: true, get: (e) => e.abundance},
  {id: 'tc', label: t('Температура сверхпроводимости'), unit: 'K', log: true, get: (e) => SC_TC[e.z]},
];

const PRESETS: [string, string, string][] = [
  [t('Периодичность радиуса'), 'z', 'radius'],
  [t('Энергия ионизации по номеру'), 'z', 'ion'],
  [t('Тугоплавкость и плотность'), 'density', 'melt'],
  [t('Цена и доступность'), 'abundance', 'melt'],
];

function csv() {
  const head = ['Z', 'symbol', 'name', 'mass_u', 'category', 'melt_K', 'boil_K', 'density_g_cm3', 'electronegativity', 'covalent_radius_pm', 'crust_ppm', 'ionization_eV', 'superconducting_Tc_K'];
  const rows = ELEMENTS.map((e) => [e.z, e.symbol, e.name, e.mass, e.category, e.melt, e.boil, e.density, e.en, e.radius, e.abundance, IONIZATION[e.z], SC_TC[e.z]]
    .map((v) => (v === undefined ? '' : typeof v === 'string' && v.includes(',') ? `"${v}"` : String(v))).join(','));
  const blob = new Blob(['﻿' + [head.join(','), ...rows].join('\n')], {type: 'text/csv;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'elementlab-elements.csv'; a.click();
  URL.revokeObjectURL(a.href);
}

export default function PropertyMapPage() {
  const s = useStore();
  const c = useChartColors();
  const [xId, setX] = useState('z');
  const [yId, setY] = useState('ion');
  const [labels, setLabels] = useState(true);
  const X = PROPS.find((p) => p.id === xId)!, Y = PROPS.find((p) => p.id === yId)!;
  const series = useMemo(() => (Object.keys(CATEGORY_TITLE) as Category[]).map((cat) => ({
    cat, data: ELEMENTS.filter((e) => e.category === cat).map((e) => ({x: X.get(e), y: Y.get(e), z: e.z, sym: e.symbol, name: e.name}))
      .filter((p) => p.x !== undefined && p.y !== undefined && (!X.log || p.x > 0) && (!Y.log || p.y > 0)),
  })).filter((sr) => sr.data.length), [X, Y]);
  const count = series.reduce((n, sr) => n + sr.data.length, 0);
  const fmt = (p: Prop) => (v: number) => (p.log ? sci(v, 0) : num(v, v < 10 ? 1 : 0));
  const opts = PROPS.map((p) => ({value: p.id, label: p.label + (p.unit ? `, ${p.unit}` : '')}));
  const axis = {stroke: c.axis, tick: {fill: c.axis, fontSize: 11}};

  return (
    <VStack gap={6}>
      <PageHeader icon={ChartBarIcon} title={t('Карта свойств')} subtitle={t('Любые два свойства всех элементов на одном графике. Так видны закономерности периодической таблицы — и выбиваются исключения.')} />
      <HStack gap={3} vAlign="end" wrap="wrap">
        <Selector label={t('Ось X')} value={xId} onChange={(v) => v && setX(v)} options={opts} />
        <Selector label={t('Ось Y')} value={yId} onChange={(v) => v && setY(v)} options={opts} />
        <Switch label={t('Подписи')} value={labels} onChange={setLabels} />
        <Button label={t('Скачать все данные (CSV)')} onClick={csv} />
      </HStack>
      <HStack gap={2} wrap="wrap" vAlign="center">
        <Text type="supporting" color="secondary">{t('Готовые сравнения:')}</Text>
        {PRESETS.map(([name, x, y]) => <Button key={name} label={name} size="sm" variant={x === xId && y === yId ? 'primary' : 'secondary'} onClick={() => { setX(x); setY(y); }} />)}
      </HStack>
      <Card padding={4}>
        <VStack gap={3}>
          <ResponsiveContainer width="100%" height={560}>
            <ScatterChart margin={{top: 16, right: 24, bottom: 30, left: 16}}>
              <CartesianGrid stroke={c.grid} strokeDasharray="3 3" />
              <XAxis dataKey="x" type="number" name={X.label} scale={X.log ? 'log' : 'linear'} domain={['auto', 'auto']} tickFormatter={fmt(X)} {...axis}
                label={{value: X.label + (X.unit ? `, ${X.unit}` : ''), position: 'insideBottom', offset: -16, fill: c.axis, fontSize: 12}} />
              <YAxis dataKey="y" type="number" name={Y.label} scale={Y.log ? 'log' : 'linear'} domain={['auto', 'auto']} tickFormatter={fmt(Y)} width={70} {...axis}
                label={{value: Y.label + (Y.unit ? `, ${Y.unit}` : ''), angle: -90, position: 'insideLeft', fill: c.axis, fontSize: 12}} />
              <Tooltip cursor={{strokeDasharray: '3 3'}} content={({payload}) => {
                const p = payload?.[0]?.payload as {sym: string; name: string; x: number; y: number} | undefined;
                if (!p) return null;
                return (
                  <Card padding={3} elevation="med">
                    <VStack gap={0.5}>
                      <Text weight="semibold">{p.sym} — {p.name}</Text>
                      <Text type="supporting">{X.label}: {fmt(X)(p.x)} {X.unit}</Text>
                      <Text type="supporting">{Y.label}: {fmt(Y)(p.y)} {Y.unit}</Text>
                    </VStack>
                  </Card>
                );
              }} />
              {series.map((sr) => (
                <Scatter key={sr.cat} name={CATEGORY_TITLE[sr.cat]} data={sr.data} isAnimationActive={false}
                  onClick={(d) => s.go('table', (d as unknown as {z: number}).z)}
                  shape={(props: unknown) => {
                    const {cx = 0, cy = 0, payload} = props as {cx?: number; cy?: number; payload: {sym: string; z: number}};
                    const sel = payload.z === s.selected;
                    return (
                      <g style={{cursor: 'pointer'}}>
                        <circle cx={cx} cy={cy} r={labels ? 10 : 5} style={{fill: CATEGORY_COLOR[sr.cat], stroke: sel ? 'var(--color-text-primary)' : 'none', strokeWidth: 2}} />
                        {labels && <text x={cx} y={cy + 3.5} textAnchor="middle" style={{fill: 'white', fontSize: 9, fontWeight: 700}}>{payload.sym}</text>}
                      </g>
                    );
                  }} />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
          <Legend items={(Object.keys(CATEGORY_TITLE) as Category[]).map((k) => [CATEGORY_TITLE[k], CATEGORY_COLOR[k]])} />
          <Text type="supporting" color="secondary">{t('На графике {0} элементов из 118 — у остальных нет данных для выбранных свойств. Щелчок по точке открывает элемент в таблице.', count)}</Text>
        </VStack>
      </Card>
      <Section title={t('Что искать')}>
        <Text>• {t('Атомный номер → радиус: пила. Внутри периода атомы сжимаются (растёт заряд ядра), а с новым периодом резко вырастают — щелочные металлы самые большие.')}</Text>
        <Text>• {t('Атомный номер → энергия ионизации: зеркальная пила. Пики — благородные газы (заполненные оболочки), провалы — щелочные металлы.')}</Text>
        <Text>• {t('Плотность → плавление: в правом верхнем углу тугоплавкие металлы (W, Re, Os, Ta) — кандидаты для контактов и межсоединений.')}</Text>
        <Text>• {t('Доступность → плавление: идеальный материал для массового чипа — справа (много в коре) и достаточно тугоплавкий.')}</Text>
      </Section>
      <Note title={t('Для исследователей')} text={t('Кнопка «Скачать все данные (CSV)» выгружает таблицу всех 118 элементов: масса, температуры фазовых переходов, плотность, электроотрицательность, радиус, содержание в коре, энергия ионизации и температура сверхпроводимости. Источники — на странице «Модели и источники».')} />
    </VStack>
  );
}
