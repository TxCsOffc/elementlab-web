import {useState} from 'react';
import {VStack, HStack} from '@astryxdesign/core/Stack';
import {Grid} from '@astryxdesign/core/Grid';
import {Text} from '@astryxdesign/core/Text';
import {Badge} from '@astryxdesign/core/Badge';
import {Slider} from '@astryxdesign/core/Slider';
import {ToggleButton} from '@astryxdesign/core/ToggleButton';
import {Table, type TableColumn} from '@astryxdesign/core/Table';
import {ShareIcon} from '../components/icons';
import {PageHeader, Section, trlBadge} from '../components/ui';
import {MultiLine} from '../components/charts';
import {METALS, metalElement, wireR, wireRho, type WireMetal} from '../lib/tech';
import {num, sci} from '../lib/fmt';
import {t} from '../i18n';

export default function WiresPage() {
  const [aspect, setAspect] = useState(2);
  const [sel, setSel] = useState<number[]>([29, 44, 42, 27, 74, 45]);
  const metals = METALS.filter((m) => sel.includes(m.z));
  const ws = Array.from({length: 73}, (_, k) => 4 + k * 0.5);
  const rho = metals.map((m) => ({name: metalElement(m).symbol, points: ws.map((w) => [w, wireRho(m, w, w * aspect)] as [number, number]).filter((p) => isFinite(p[1]) && p[1] < 200)}));
  const res = metals.map((m) => ({name: metalElement(m).symbol, points: ws.map((w) => [w, wireR(m, w, aspect)] as [number, number]).filter((p) => isFinite(p[1]) && p[1] < 1e5)}));
  const rows = [...METALS].sort((a, b) => wireR(a, 8, aspect) - wireR(b, 8, aspect));
  type MRow = WireMetal & Record<string, unknown>;
  const columns: TableColumn<MRow>[] = [
    {key: 'm', header: t('Металл'), renderCell: (m) => <Text weight="semibold">{metalElement(m).symbol} · {metalElement(m).name}</Text>},
    {key: 'r8', header: t('R при 8 нм, Ом/мкм'), renderCell: (m) => <Text weight="semibold" hasTabularNumbers>{num(wireR(m, 8, aspect), 0)}</Text>},
    {key: 'r12', header: t('R при 12 нм'), renderCell: (m) => <Text hasTabularNumbers>{num(wireR(m, 12, aspect), 0)}</Text>},
    {key: 'l', header: t('Пробег λ'), renderCell: (m) => <Text hasTabularNumbers>{num(m.lambda, 1)} {t('нм')}</Text>},
    {key: 'b', header: t('Барьер'), renderCell: (m) => m.barrier === 0 ? <Badge variant="success" label={t('не нужен')} /> : <Text>{num(m.barrier, 1)} {t('нм')}</Text>},
    {key: 'ab', header: t('Доступность'), renderCell: (m) => { const a = metalElement(m).abundance ?? 0; return <Badge variant={a >= 10 ? 'success' : a >= 0.5 ? 'warning' : 'error'} label={a >= 10 ? t('много') : a >= 0.5 ? t('умеренно') : t('дефицит · ') + sci(a, 1) + ' ppm'} />; }},
    {key: 'trl', header: t('Зрелость'), renderCell: (m) => <Badge variant={trlBadge(m.trl)} label={'TRL ' + m.trl} />},
    {key: 'n', header: t('Комментарий'), renderCell: (m) => <Text type="supporting" color="secondary">{m.note}</Text>},
  ];
  return (
    <VStack gap={6}>
      <PageHeader icon={ShareIcon} title={t('Межсоединения')} subtitle={t('Миллиарды транзисторов связаны проводами шириной в десяток нанометров. Чем тоньше провод, тем сильнее он греется и тормозит сигнал.')} />
      <Section title={t('Металлы для сравнения')}>
        <HStack gap={2} wrap="wrap" vAlign="center">
          {METALS.map((m) => (
            <ToggleButton key={m.z} label={metalElement(m).symbol} isPressed={sel.includes(m.z)}
              onPressedChange={(on) => setSel(on ? [...sel, m.z] : sel.filter((z) => z !== m.z))} />
          ))}
        </HStack>
        <Slider label={t('Высота провода / ширина')} value={aspect} min={1} max={3} step={0.1} valueDisplay="text" formatValue={(v: number) => num(v, 1)} onChange={(v: number) => setAspect(v as number)} />
      </Section>
      <Grid columns={{minWidth: 420, max: 2, repeat: 'fit'}} gap={4}>
        <Section title={t('Удельное сопротивление металла в узком проводе')}>
          <MultiLine series={rho} xLabel={t('Ширина провода, нм')} yDomain={[1, 200]} logY yFormat={(v) => num(v, 0)} />
          <Text type="supporting" color="secondary">{t('В толстом проводе медь лучше всех. В узком электроны бьются о стенки: у меди длинный свободный пробег (≈ 40 нм), поэтому она теряет больше.')}</Text>
        </Section>
        <Section title={t('Сопротивление провода, Ом на мкм длины')}>
          <MultiLine series={res} xLabel={t('Ширина провода, нм')} yDomain={[10, 1e5]} logY yFormat={(v) => num(v, 0)} />
          <Text type="supporting" color="secondary">{t('С учётом барьера: меди нужен слой ≈ 2 нм с каждой стороны, чтобы не отравить кремний. В проводе шириной 8 нм он съедает половину сечения.')}</Text>
        </Section>
      </Grid>
      <Section title={t('Рейтинг при ширине 8 нм')}>
        <Table data={rows as MRow[]} columns={columns} idKey="z" density="compact" />
      </Section>
    </VStack>
  );
}
