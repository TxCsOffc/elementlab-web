import {useMemo} from 'react';
import {VStack, HStack} from '@astryxdesign/core/Stack';
import {Grid} from '@astryxdesign/core/Grid';
import {Card} from '@astryxdesign/core/Card';
import {Text} from '@astryxdesign/core/Text';
import {Heading} from '@astryxdesign/core/Heading';
import {Badge} from '@astryxdesign/core/Badge';
import {Selector} from '@astryxdesign/core/Selector';
import {Button} from '@astryxdesign/core/Button';
import {AtomIcon} from '../components/icons';
import {PageHeader, Note, Section, Stat, useTok} from '../components/ui';
import {useCanvas} from '../components/useCanvas';
import {useStore} from '../store';
import {ELEMENTS, element, CATEGORY_TITLE} from '../lib/elements';
import {IONIZATION} from '../lib/exotic';
import {boxes, configuration, dopantRole, fullConfig, isException, isPredicted, shells, shortConfig, valenceSubshells, SHELL_NAMES} from '../lib/atom';
import {num} from '../lib/fmt';
import {t} from '../i18n';

const SUB_TOKEN: Record<string, string> = {s: '--color-data-categorical-blue', p: '--color-data-categorical-orange', d: '--color-data-categorical-green', f: '--color-data-categorical-purple'};

function BohrCanvas({z}: {z: number}) {
  const {tok} = useTok();
  const sh = useMemo(() => shells(z), [z]);
  const ref = useCanvas((ctx, w, h, time) => {
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2 - 16;
    const step = R / (sh.length + 0.6);
    // ядро
    const g = ctx.createRadialGradient(cx - 4, cy - 4, 1, cx, cy, step * 0.55);
    g.addColorStop(0, 'white'); g.addColorStop(1, tok('--color-data-categorical-red'));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, step * 0.5, 0, 7); ctx.fill();
    ctx.fillStyle = 'white'; ctx.font = `700 ${Math.max(10, step * 0.32)}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`+${z}`, cx, cy);
    sh.forEach((count, i) => {
      const r = step * (i + 1.1);
      ctx.strokeStyle = tok('--color-border'); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke();
      const speed = 0.9 / (i + 1);
      for (let k = 0; k < count; k++) {
        const a = (k / count) * Math.PI * 2 + (time / 1000) * speed;
        ctx.fillStyle = tok(i === sh.length - 1 ? '--color-data-categorical-orange' : '--color-data-categorical-blue');
        ctx.beginPath(); ctx.arc(cx + r * Math.cos(a), cy + r * Math.sin(a), Math.max(2.5, Math.min(5, step * 0.12)), 0, 7); ctx.fill();
      }
      ctx.fillStyle = tok('--color-text-secondary'); ctx.font = '600 11px system-ui';
      ctx.fillText(`${SHELL_NAMES[i]} · ${count}`, cx + r * Math.cos(-0.9), cy + r * Math.sin(-0.9) - 8);
    });
  }, [z, sh], true);
  return <Card padding={0} height={420} variant="transparent"><canvas ref={ref} style={{width: '100%', height: '100%', display: 'block'}} aria-label={t('Модель атома: электроны на оболочках')} /></Card>;
}

function OrbitalBoxes({z}: {z: number}) {
  const subs = valenceSubshells(z);
  const cell = 34;
  return (
    <VStack gap={2}>
      {subs.map((s) => {
        const b = boxes(s);
        return (
          <HStack key={`${s.n}${s.l}`} gap={3} vAlign="center">
            <Text weight="semibold" hasTabularNumbers>{s.n}{s.l}</Text>
            <svg width={b.length * (cell + 4)} height={cell + 4} role="img" aria-label={`${s.n}${s.l}: ${s.count}`}>
              {b.map((v, i) => (
                <g key={i} transform={`translate(${i * (cell + 4) + 2}, 2)`}>
                  <rect width={cell} height={cell} rx={5} style={{fill: 'var(--color-background-muted)', stroke: `var(${SUB_TOKEN[s.l]})`, strokeWidth: 1.5}} />
                  {v >= 1 && <text x={cell * 0.33} y={cell * 0.7} textAnchor="middle" style={{fill: `var(${SUB_TOKEN[s.l]})`, fontSize: cell * 0.6, fontWeight: 700}}>↑</text>}
                  {v === 2 && <text x={cell * 0.67} y={cell * 0.7} textAnchor="middle" style={{fill: `var(${SUB_TOKEN[s.l]})`, fontSize: cell * 0.6, fontWeight: 700}}>↓</text>}
                </g>
              ))}
            </svg>
            <Text type="supporting" color="secondary">{s.count} / {b.length * 2}</Text>
          </HStack>
        );
      })}
      <Text type="supporting" color="secondary">{t('Каждая клеточка — орбиталь, в ней не больше двух электронов с противоположными спинами (↑↓). По правилу Хунда электроны сначала занимают клеточки по одному.')}</Text>
    </VStack>
  );
}

export default function AtomPage() {
  const s = useStore();
  const e = element(s.selected > 0 ? s.selected : 14) ?? element(14)!;
  const z = e.z;
  const cfg = configuration(z);
  const sh = shells(z);
  const options = useMemo(() => ELEMENTS.map((x) => ({value: String(x.z), label: `${x.z} · ${x.symbol} — ${x.name}`})), []);
  const dop = dopantRole(z);
  const ie = IONIZATION[z];
  const outer = sh[sh.length - 1];
  return (
    <VStack gap={6}>
      <PageHeader icon={AtomIcon} title={t('Строение атома')} subtitle={t('Как электроны рассажены по оболочкам и орбиталям — именно это определяет, как элемент ведёт себя в химии и в чипе.')} />
      <HStack gap={3} vAlign="end" wrap="wrap">
        <Selector label={t('Элемент')} value={String(z)} onChange={(v) => v && s.setSelected(Number(v))} options={options} hasSearch />
        {[14, 15, 5, 29, 24, 79, 26, 2].map((q) => <Button key={q} label={element(q)!.symbol} size="sm" variant={q === z ? 'primary' : 'secondary'} onClick={() => s.setSelected(q)} />)}
      </HStack>
      <Grid columns={{minWidth: 420, max: 2, repeat: 'fit'}} gap={4}>
        <Card padding={4}><BohrCanvas z={z} /></Card>
        <Card padding={4}>
          <VStack gap={4}>
            <VStack gap={1}>
              <Heading level={2}>{e.name}</Heading>
              <HStack gap={2} wrap="wrap">
                <Badge variant="blue" label={CATEGORY_TITLE[e.category]} />
                <Badge label={`Z = ${z}`} />
                {isException(z) && <Badge variant="warning" label={t('исключение из правила Клечковского')} />}
                {isPredicted(z) && <Badge variant="neutral" label={t('конфигурация предсказана теорией')} />}
              </HStack>
            </VStack>
            <Stat label={t('Короткая запись')} value={shortConfig(z)} tone="accent" />
            <VStack gap={0.5}>
              <Text type="supporting" color="secondary">{t('Полная запись')}</Text>
              <Text type="code">{fullConfig(z)}</Text>
            </VStack>
            <HStack gap={5} wrap="wrap">
              <Stat label={t('Оболочек')} value={sh.length} />
              <Stat label={t('Во внешней оболочке')} value={outer} />
              {ie !== undefined && <Stat label={t('Энергия ионизации')} value={num(ie, 2) + t(' эВ')} />}
            </HStack>
            <Text type="supporting" color="secondary">{t('Электроны по оболочкам')}: {sh.map((c, i) => `${SHELL_NAMES[i]} ${c}`).join(' · ')}</Text>
          </VStack>
        </Card>
      </Grid>
      <Grid columns={{minWidth: 380, max: 2, repeat: 'fit'}} gap={4}>
        <Section title={t('Внешние орбитали')}>
          <OrbitalBoxes z={z} />
        </Section>
        <Section title={t('Подоболочки')}>
          <svg width="100%" height={cfg.length * 26 + 4} role="img" aria-label={t('Заполнение подоболочек')}>
            {cfg.map((c, i) => {
              const cap = {s: 2, p: 6, d: 10, f: 14}[c.l];
              return (
                <g key={`${c.n}${c.l}`} transform={`translate(0, ${i * 26 + 2})`}>
                  <text x={0} y={16} style={{fill: 'var(--color-text-primary)', fontSize: 'var(--text-body-size)', fontWeight: 600}}>{c.n}{c.l}</text>
                  <rect x={40} y={4} width="70%" height={16} rx={4} style={{fill: 'var(--color-background-muted)'}} />
                  <rect x={40} y={4} width={`${(c.count / cap) * 70}%`} height={16} rx={4} style={{fill: `var(${SUB_TOKEN[c.l]})`}} />
                  <text x="85%" y={16} style={{fill: 'var(--color-text-secondary)', fontSize: 'var(--text-supporting-size)'}}>{c.count} / {cap}</text>
                </g>
              );
            })}
          </svg>
        </Section>
      </Grid>
      {dop && <Note status="success" title={t('Что это значит для чипов')} text={dop} />}
      <Note text={t('Электроны заполняют уровни снизу вверх: 1s, 2s, 2p, 3s, 3p, 4s, 3d… (правило Клечковского). У некоторых элементов выгоднее «перескочить»: у меди 3d¹⁰ 4s¹ вместо 3d⁹ 4s², потому что полностью заполненная d-оболочка устойчивее. Химию и электрические свойства определяют внешние электроны.')} />
    </VStack>
  );
}
