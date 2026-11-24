import {useState} from 'react';
import {VStack} from '@astryxdesign/core/Stack';
import {Grid} from '@astryxdesign/core/Grid';
import {Text} from '@astryxdesign/core/Text';
import {Badge} from '@astryxdesign/core/Badge';
import {Slider} from '@astryxdesign/core/Slider';
import {Selector} from '@astryxdesign/core/Selector';
import {Table, type TableColumn} from '@astryxdesign/core/Table';
import {CpuChipIcon} from '../components/icons';
import {PageHeader, Note, Section, trlBadge} from '../components/ui';
import {MultiLine} from '../components/charts';
import {ARCHS, CHANNELS, gateLimit, lambdaLen, ss, tunneling, type ChannelMaterial} from '../lib/tech';
import {num, sup} from '../lib/fmt';
import {t} from '../i18n';

type Row = {m: ChannelMaterial; lMin?: number; by?: string; lSS?: number; lTun?: number} & Record<string, unknown>;

export default function ChannelPage() {
  const [eot, setEot] = useState(0.6);
  const [ssMax, setSsMax] = useState(75);
  const [leakExp, setLeakExp] = useState(-5);
  const [archId, setArchId] = useState('gaa');
  const [bulkT, setBulkT] = useState(5);
  const arch = ARCHS.find((a) => a.id === archId)!;
  const target = 10 ** leakExp;
  const mats = CHANNELS.filter((m) => m.eg > 0);
  const th = (m: ChannelMaterial) => (m.is2D ? m.thickness : bulkT);

  const rows: Row[] = CHANNELS.map((m) => {
    if (m.eg <= 0) return {m};
    const l = gateLimit(m, th(m), eot, arch.k, ssMax, target);
    return {m, lMin: l.lMin, by: l.by, lSS: l.lSS, lTun: l.lTun};
  }).sort((a, b) => (a.lMin ?? 1e9) - (b.lMin ?? 1e9));

  const columns: TableColumn<Row>[] = [
    {key: 'name', header: t('Материал'), renderCell: (r) => <Text weight="semibold">{r.m.name}</Text>},
    {key: 'lmin', header: t('Затвор мин.'), renderCell: (r) => r.lMin === undefined ? <Badge variant="error" label={t('не выключается')} /> :
      <Badge variant={r.lMin < 5 ? 'success' : r.lMin < 10 ? 'warning' : 'error'} label={num(r.lMin, 1) + t(' нм')} />},
    {key: 'by', header: t('Что ограничивает'), renderCell: (r) => <Text type="supporting">{r.by ?? t('нет запрещённой зоны')}</Text>},
    {key: 'trl', header: t('Зрелость'), renderCell: (r) => <Badge variant={trlBadge(r.m.trl)} label={'TRL ' + r.m.trl} />},
    {key: 'note', header: t('Комментарий'), renderCell: (r) => <Text type="supporting" color="secondary">{r.m.note}</Text>},
  ];

  const Ls = Array.from({length: 57}, (_, k) => 1 + k * 0.25);
  const tunSeries = mats.map((m) => ({name: m.name, points: Ls.map((L) => [L, Math.max(1e-12, tunneling(m, L))] as [number, number])}));
  const Ls2 = Array.from({length: 77}, (_, k) => 1 + k * 0.25);
  const ssSeries = mats.map((m) => { const lam = lambdaLen(m, th(m), eot, arch.k); return {name: m.name, points: Ls2.map((L) => [L, ss(L, lam)] as [number, number]).filter((p) => p[1] <= 160)}; });

  return (
    <VStack gap={6}>
      <PageHeader icon={CpuChipIcon} title={t('Канал транзистора')} subtitle={t('Насколько коротким может быть затвор, чтобы транзистор всё ещё надёжно выключался. Мешают два предела: затвор теряет контроль над каналом, а электроны туннелируют сквозь закрытый канал.')} />
      <Section title={t('Условия')}>
        <Grid columns={{minWidth: 220, max: 5, repeat: 'fit'}} gap={4}>
          <Selector label={t('Архитектура')} value={archId} onChange={(v) => v && setArchId(v)} options={ARCHS.map((a) => ({value: a.id, label: a.name, description: a.note}))} />
          <Slider label={t('Толщина изолятора затвора (EOT), нм')} value={eot} min={0.3} max={1.2} step={0.01} valueDisplay="text" formatValue={(v: number) => num(v, 2)} onChange={(v: number) => setEot(v as number)} />
          <Slider label={t('Толщина канала Si/Ge/InGaAs, нм')} value={bulkT} min={2} max={10} step={0.1} valueDisplay="text" formatValue={(v: number) => num(v, 1)} onChange={(v: number) => setBulkT(v as number)} />
          <Slider label={t('Допустимый SS, мВ/дек')} value={ssMax} min={65} max={100} step={1} valueDisplay="text" onChange={(v: number) => setSsMax(v as number)} />
          <Slider label={t('Допустимая утечка туннелем')} value={leakExp} min={-8} max={-3} step={1} valueDisplay="text" formatValue={(v: number) => '10' + sup(v)} onChange={(v: number) => setLeakExp(v as number)} />
        </Grid>
      </Section>
      <Section title={t('Минимальная длина затвора')}>
        <Table data={rows} columns={columns} idKey={(r) => r.m.id} density="compact" />
      </Section>
      <Grid columns={{minWidth: 420, max: 2, repeat: 'fit'}} gap={4}>
        <Section title={t('Утечка туннелем исток → сток')}>
          <MultiLine series={tunSeries} xLabel={t('Длина затвора, нм')} yDomain={[1e-12, 1]} logY refs={[{y: target, label: t('допустимая утечка')}]} />
          <Text type="supporting" color="secondary">{t('Чем короче затвор, тем легче электрону «просочиться» сквозь закрытый канал. Тяжёлые электроны (MoS₂, WS₂) просачиваются хуже.')}</Text>
        </Section>
        <Section title={t('Качество выключения (SS)')}>
          <MultiLine series={ssSeries} xLabel={t('Длина затвора, нм')} yDomain={[55, 160]} refs={[{y: ssMax, label: t('допустимый SS')}, {y: 60, label: t('идеал 60 мВ/дек'), good: true}]} />
          <Text type="supporting" color="secondary">{t('60 мВ/дек — физический идеал при комнатной температуре. На коротком затворе сток «перебивает» затвор и SS растёт. Тонкий 2D-канал держится дольше.')}</Text>
        </Section>
      </Grid>
      <Note status="success" title={t('Вывод')} text={t('Главные рычаги физики — тяжёлая эффективная масса электрона и канал толщиной в несколько атомов. Поэтому 2D-полупроводники (MoS₂, WSe₂, WS₂) позволяют затвор ≈ 3–4 нм, а кремний ≈ 9–10 нм. Но затвор — лишь часть шага транзистора: спейсеры и контакт занимают больше места.')} />
    </VStack>
  );
}
