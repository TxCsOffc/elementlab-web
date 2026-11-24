import type {ComponentType, ReactNode, SVGProps} from 'react';
import {useTheme} from '@astryxdesign/core/theme';
import {VStack, HStack} from '@astryxdesign/core/Stack';
import {Heading} from '@astryxdesign/core/Heading';
import {Text} from '@astryxdesign/core/Text';
import {Card} from '@astryxdesign/core/Card';
import {Icon} from '@astryxdesign/core/Icon';
import {Banner} from '@astryxdesign/core/Banner';
import {InfoTip} from '@astryxdesign/core/InfoTip';
import {Popover} from '@astryxdesign/core/Popover';
import {Button} from '@astryxdesign/core/Button';
import {Badge} from '@astryxdesign/core/Badge';
import {forCard} from '../lib/glossary';
import {t} from '../i18n';

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

/** Значение токена темы для canvas и графиков */
export function useTok() {
  const {token, mode} = useTheme();
  return {tok: (name: string) => token(name), mode};
}

export function PageHeader({icon, title, subtitle}: {icon: IconType; title: string; subtitle: string}) {
  return (
    <HStack gap={4} vAlign="center">
      <Card variant="blue" padding={3}>
        <Icon icon={icon} size="lg" color="accent" />
      </Card>
      <VStack gap={1}>
        <Heading level={1}>{title}</Heading>
        <Text color="secondary">{subtitle}</Text>
      </VStack>
    </HStack>
  );
}

export function Note({title = t('Как читать'), text, status = 'info'}: {title?: string; text: ReactNode; status?: 'info' | 'warning' | 'success' | 'error'}) {
  return <Banner status={status} title={title} description={text} collapsible={false} />;
}

export function Stat({label, value, tone}: {label: string; value: ReactNode; tone?: 'success' | 'warning' | 'error' | 'accent'}) {
  const color = tone === 'accent' ? 'accent' : undefined;
  return (
    <VStack gap={0.5}>
      <Text type="supporting" color="secondary">{label}</Text>
      {tone && tone !== 'accent' ? <Badge variant={tone} label={value} /> : <Text type="large" weight="semibold" color={color} hasTabularNumbers>{value}</Text>}
    </VStack>
  );
}

/** Карточка с заголовком; если для заголовка есть объяснение в словаре — значок «i» */
export function Section({title, icon, children, end}: {title: string; icon?: IconType; children: ReactNode; end?: ReactNode}) {
  const g = forCard(title);
  return (
    <Card padding={4}>
      <VStack gap={3}>
        <HStack gap={2} vAlign="center" hAlign="between">
          <HStack gap={2} vAlign="center">
            {icon && <Icon icon={icon} size="sm" color="accent" />}
            <Heading level={3}>{title}</Heading>
            {g && <InfoTip label={g[0]} content={<VStack gap={1}><Text weight="semibold">{g[0]}</Text><Text>{g[1]}</Text></VStack>} />}
          </HStack>
          {end}
        </HStack>
        {children}
      </VStack>
    </Card>
  );
}

export function ExplainButton({title, text}: {title: string; text: string}) {
  return (
    <Popover label={title} placement="below" alignment="end" width={380} padding={4}
      content={<VStack gap={2}><Text weight="semibold" color="accent">{title}</Text><Text>{text}</Text></VStack>}>
      <Button label={t('Объясни просто')} variant="primary" size="sm" />
    </Popover>
  );
}

export const LEVEL_BADGE: ('success' | 'warning' | 'error')[] = ['success', 'warning', 'error'];
export const trlBadge = (trl: number): 'success' | 'warning' | 'error' => (trl >= 7 ? 'success' : trl >= 5 ? 'warning' : 'error');
