import {VStack, HStack} from '@astryxdesign/core/Stack';
import {Grid} from '@astryxdesign/core/Grid';
import {Text} from '@astryxdesign/core/Text';
import {Heading} from '@astryxdesign/core/Heading';
import {Badge} from '@astryxdesign/core/Badge';
import {ClickableCard} from '@astryxdesign/core/ClickableCard';
import {Section, Stat, Note} from './ui';
import {useStore} from '../store';
import {element, CATEGORY_COLOR} from '../lib/elements';
import {atomCount, molarMass, BOND_SIMPLE, BOND_TITLE, type Compound} from '../lib/compounds';
import {num, sci, temp} from '../lib/fmt';
import {t} from '../i18n';

export default function CompoundCards({c}: {c: Compound}) {
  const s = useStore();
  const mm = molarMass(c);
  const shares = c.parts.map(([z, n]) => ({e: element(z)!, n, share: (element(z)!.mass * n) / mm}));
  let x = 0;
  return (
    <Grid columns={{minWidth: 360, max: 2, repeat: 'fit'}} gap={4}>
      <Section title={t('Из чего состоит')}>
        <HStack gap={2} wrap="wrap" vAlign="center">
          {shares.map(({e, n}) => (
            <ClickableCard key={e.z} label={t('Открыть {0}', e.name)} padding={3} variant="muted" onClick={() => s.go('table', e.z)}>
              <VStack gap={0} hAlign="center">
                <Heading level={3}>{e.symbol}</Heading>
                <Text type="supporting" color="secondary">× {n}</Text>
              </VStack>
            </ClickableCard>
          ))}
          <VStack gap={0.5}>
            <Text type="supporting" color="secondary">{atomCount(c)} {t('атомов в формуле')}</Text>
            <Text type="large" weight="semibold">{num(mm, 2)} {t('г/моль')}</Text>
          </VStack>
        </HStack>
        <svg width="100%" height="26" role="img" aria-label={t('Доля массы каждого элемента')}>
          {shares.map(({e, share}) => {
            const r = <g key={e.z}>
              <rect x={`${x * 100}%`} y={0} width={`${share * 100}%`} height={26} style={{fill: CATEGORY_COLOR[e.category]}} />
              {share > 0.1 && <text x={`${(x + share / 2) * 100}%`} y={17} textAnchor="middle" style={{fill: 'white', fontSize: 'var(--text-supporting-size, 12px)', fontWeight: 600}}>{e.symbol} {num(share * 100, 1)} %</text>}
            </g>;
            x += share;
            return r;
          })}
        </svg>
        <Text type="supporting" color="secondary">{t('Доля массы каждого элемента.')} {BOND_SIMPLE[c.bond]}</Text>
      </Section>
      <Section title={t('Свойства и роль')}>
        <HStack gap={5} wrap="wrap">
          {c.melt !== undefined && <Stat label={t('Плавление')} value={temp(c.melt)} />}
          {c.boil !== undefined && <Stat label={c.boilNote ? t('Возгонка') : t('Кипение')} value={temp(c.boil)} />}
          {c.density !== undefined && <Stat label={t('Плотность')} value={sci(c.density, 2) + t(' г/см³')} />}
          {c.bandGap !== undefined && <Stat label={t('Запрещённая зона')} value={num(c.bandGap, 2) + t(' эВ')} />}
          {c.epsilon !== undefined && <Stat label={t('Диэлектр. прониц.')} value={num(c.epsilon, 1)} />}
          <Stat label={t('Связь')} value={BOND_TITLE[c.bond]} />
        </HStack>
        {c.boilNote && <Badge variant="warning" label={c.boilNote} />}
        <Text type="supporting" color="secondary">{t('Структура:')} {c.structure}</Text>
        <Note status={c.chipRole === false ? 'info' : 'success'} title={c.chipRole === false ? t('Где встречается') : t('Зачем это в производстве чипов')} text={c.use} />
      </Section>
    </Grid>
  );
}
