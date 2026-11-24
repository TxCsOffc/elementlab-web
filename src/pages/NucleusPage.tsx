import {useMemo} from 'react';
import {Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, XAxis, YAxis} from 'recharts';
import {VStack, HStack, StackItem} from '@astryxdesign/core/Stack';
import {Grid} from '@astryxdesign/core/Grid';
import {Card} from '@astryxdesign/core/Card';
import {Text} from '@astryxdesign/core/Text';
import {Badge} from '@astryxdesign/core/Badge';
import {Selector} from '@astryxdesign/core/Selector';
import {AtomIcon} from '../components/icons';
import {PageHeader, Note, Section, Stat} from '../components/ui';
import {useChartColors} from '../components/charts';
import {Legend} from '../components/Legend';
import RangeBars from '../components/RangeBars';
import {useStore} from '../store';
import {ELEMENTS, element, atomDiameterNm} from '../lib/elements';
import {ISOTOPES, CHIP_NOTES, SIZES, ENERGIES, DOMAIN_TITLE, stability, neutrons, upQuarks, downQuarks, nucleusRadiusFm, type Domain} from '../lib/nuclear';
import {num, sci} from '../lib/fmt';
import {t} from '../i18n';

const DOMAIN_TOKEN: Record<Domain, string> = {nuclear: '--color-data-categorical-purple', chem: '--color-data-categorical-teal', chip: '--color-data-categorical-blue'};

/** Схема ядра: протоны и нейтроны, упакованные спиралью Ферма */
function NucleusSketch({p, n}: {p: number; n: number}) {
  const total = Math.min(p + n, 300), R = 90;
  const r = Math.max(3, R / (Math.sqrt(total) * 1.05)), golden = Math.PI * (3 - Math.sqrt(5)), frac = p / (p + n);
  const balls = Array.from({length: total}, (_, i) => {
    const rr = R * Math.sqrt((i + 0.5) / total) - r * 0.3, th = i * golden;
    return {x: 100 + rr * Math.cos(th), y: 100 + rr * Math.sin(th), proton: Math.floor((i + 1) * frac) > Math.floor(i * frac)};
  }).reverse();
  return (
    <svg viewBox="0 0 200 200" width="100%" role="img" aria-label={t('Ядро: {0} протонов и {1} нейтронов', p, n)} style={{maxWidth: 280}}>
      {balls.map((b, i) => <circle key={i} cx={b.x} cy={b.y} r={r} style={{fill: b.proton ? 'var(--color-data-categorical-red)' : 'var(--color-data-gray-3)', stroke: 'var(--color-background-card)', strokeWidth: 0.6}} />)}
    </svg>
  );
}

export default function NucleusPage() {
  const s = useStore();
  const e = element(s.selected > 0 ? s.selected : 14) ?? element(14)!;
  const n = neutrons(e);
  const [stText, stTone] = stability(e.z);
  const ratio = ((atomDiameterNm(e) ?? 0.2) * 1e-9) / (2 * nucleusRadiusFm(e) * 1e-15);
  const iso = ISOTOPES[e.z];
  const c = useChartColors();
  const options = useMemo(() => ELEMENTS.map((x) => ({value: String(x.z), label: `${x.z} · ${x.symbol} — ${x.name}`})), []);
  return (
    <VStack gap={6}>
      <PageHeader icon={AtomIcon} title={t('Ядро и кварки')} subtitle={t('Из чего состоит атом глубже электронов и где это на самом деле влияет на чипы.')} />
      <Note status="warning" title={t('Дадут ли кварки точность «нанометрам»? Нет — и вот почему')}
        text={t('Кварки заперты внутри протонов и нейтронов размером ~10⁻¹⁵ м, а транзистор — ~10⁻⁹ м: в миллион раз больше. Чтобы хоть как-то изменить состояние кварков, нужны сотни миллионов электронвольт, а в чипе энергии порядка 1 эВ. Для транзистора ядро — просто точечный заряд с массой и спином. Точность наших чисел ограничивают приближённые формулы для электронов; улучшать нужно их: расчёты из первых принципов (DFT, NEGF) и эксперимент.')} />
      <Grid columns={{minWidth: 440, max: 2, repeat: 'fit'}} gap={4}>
        <Section title={t('Лестница размеров, метры')}>
          <RangeBars rows={SIZES.map((x) => ({name: x.name, from: 1e-20, to: x.value, color: DOMAIN_TOKEN[x.d]}))} domain={[1e-20, 1e-6]} ticks={[1e-18, 1e-15, 1e-12, 1e-9]} xLabel={t('Размер, м')} showValue />
          <Text type="supporting" color="secondary">{t('Между ядром и атомом — пропасть в 100 000 раз. Транзистор ещё в 10–100 раз больше атома.')}</Text>
        </Section>
        <Section title={t('Лестница энергий, электронвольты')}>
          <RangeBars rows={ENERGIES.map((x) => ({name: x.name, from: 0.01, to: x.value, color: DOMAIN_TOKEN[x.d]}))} domain={[0.01, 1e10]} ticks={[0.01, 1, 100, 1e4, 1e6, 1e8]} xLabel={t('Энергия, эВ')} showValue />
          <Text type="supporting" color="secondary">{t('Всё, что делает транзистор, укладывается в 0,03–100 эВ. Ядерный мир начинается с миллионов эВ — его «чувствуют» только альфа-частицы и нейтроны.')}</Text>
        </Section>
      </Grid>
      <Legend items={(Object.keys(DOMAIN_TITLE) as Domain[]).map((d) => [DOMAIN_TITLE[d], `var(${DOMAIN_TOKEN[d]})`])} />

      <Section title={t('Ядро элемента')}>
        <HStack gap={6} vAlign="start" wrap="wrap">
          <VStack gap={3}>
            <Selector label={t('Элемент')} value={String(e.z)} onChange={(v) => v && s.setSelected(Number(v))} options={options} hasSearch />
            <NucleusSketch p={e.z} n={n} />
            <Legend items={[[t('протон'), 'var(--color-data-categorical-red)'], [t('нейтрон'), 'var(--color-data-gray-3)']]} />
          </VStack>
          <StackItem size="fill">
            <VStack gap={4}>
              <HStack gap={5} wrap="wrap">
                <Stat label={t('Протонов')} value={e.z} />
                <Stat label={t('Нейтронов (≈)')} value={n} />
                <Stat label={t('Электронов')} value={e.z} />
                <Stat label={t('Кварков u / d')} value={`${upQuarks(e)} / ${downQuarks(e)}`} />
                <Stat label={t('Радиус ядра')} value={num(nucleusRadiusFm(e), 1) + t(' фм')} />
                <Stat label={t('Атом больше ядра в')} value={sci(ratio, 1) + t(' раз')} />
              </HStack>
              <HStack gap={2} wrap="wrap">
                <Badge variant={stTone} label={stText} />
                <Badge label={t('протон = u + u + d · нейтрон = u + d + d')} />
              </HStack>
              <Text color="secondary">{t('Масса протона лишь на ~1 % состоит из масс кварков — остальное энергия глюонного поля, которое их удерживает. Поэтому «состояние кварков» во всех атомах одно и то же и не меняется ни нагревом, ни давлением, ни током.')}</Text>
              {iso ? (
                <Card padding={0} variant="transparent">
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={iso.map((i) => ({name: String(i.a) + (i.spin === '0' ? '' : t(' · спин {0}', i.spin)), pct: i.percent, spin: i.spin}))} margin={{top: 20, right: 10, bottom: 4, left: 0}}>
                      <CartesianGrid stroke={c.grid} strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" stroke={c.axis} tick={{fill: c.axis, fontSize: 11}} />
                      <YAxis domain={[0, 115]} ticks={[0, 25, 50, 75, 100]} stroke={c.axis} tick={{fill: c.axis, fontSize: 11}} tickFormatter={(v) => v + ' %'} />
                      <Bar dataKey="pct" radius={4} isAnimationActive={false}>
                        {iso.map((i) => <Cell key={i.a} fill={c.tok(i.spin === '0' ? '--color-data-categorical-teal' : '--color-data-categorical-purple')} />)}
                        <LabelList dataKey="pct" position="top" formatter={(v: unknown) => num(Number(v), Number(v) < 1 ? 3 : 1) + ' %'} style={{fill: c.axis, fontSize: 10}} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              ) : <Text type="supporting" color="secondary">{t('Подробные данные об изотопах включены для элементов, важных для чипов: B, C, N, O, Si, P, Cu, Ga, Ge, As, Mo, Ru, In, Hf, W, Pb, Th, U.')}</Text>}
              {CHIP_NOTES[e.z] && <Note status="success" title={t('Значение для чипов')} text={CHIP_NOTES[e.z]} />}
            </VStack>
          </StackItem>
        </HStack>
      </Section>

      <Section title={t('Где ядро реально влияет на чипы')}>
        <Grid columns={{minWidth: 280, max: 3, repeat: 'fit'}} gap={3}>
          {([
            [t('Сбои от альфа-частиц'), t('U, Th и ²¹⁰Po в корпусе и припое излучают альфа-частицы 4–5 МэВ. Частица рождает в кремнии облако зарядов и переворачивает бит. Чем меньше транзистор, тем меньше заряд хранит бит — тем опаснее.')],
            [t('Космические лучи'), t('Нейтроны и мюоны из атмосферы постоянно бьют по чипам. В серверах и автомобилях нужны коды коррекции ошибок (ECC) и «закалённые» ячейки памяти.')],
            [t('Бор-10 и нейтроны'), t('¹⁰B ловит тепловой нейтрон и выстреливает альфа-частицей. Поэтому из чипов убрали стекло BPSG.')],
            [t('Изотопная инженерия'), t('²⁸Si без ядерных спинов — для кубитов. ¹²C-алмаз — для отвода тепла. Изотопно-чистый Si проводит тепло примерно на 10 % лучше.')],
            [t('Нейтронное легирование'), t('Реактор превращает часть ³⁰Si в ³¹P прямо в слитке — фосфор распределяется идеально равномерно. Так делают кремний для мощных силовых приборов.')],
            [t('Транзистор из одного атома'), t('Один атом ³¹P, поставленный иглой туннельного микроскопа (2012). Его ядерный спин — готовый кубит. Предел миниатюризации — атом, а не кварк.')],
          ] as [string, string][]).map(([t, d]) => (
            <Card key={t} padding={4} variant="muted">
              <VStack gap={1.5}><Text weight="semibold" color="accent">{t}</Text><Text type="supporting" color="secondary">{d}</Text></VStack>
            </Card>
          ))}
        </Grid>
      </Section>
    </VStack>
  );
}
