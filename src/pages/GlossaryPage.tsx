import {useState} from 'react';
import {VStack} from '@astryxdesign/core/Stack';
import {Grid} from '@astryxdesign/core/Grid';
import {Card} from '@astryxdesign/core/Card';
import {Text} from '@astryxdesign/core/Text';
import {Heading} from '@astryxdesign/core/Heading';
import {TextInput} from '@astryxdesign/core/TextInput';
import {EmptyState} from '@astryxdesign/core/EmptyState';
import {BookOpenIcon, MagnifyingGlassIcon} from '../components/icons';
import {PageHeader} from '../components/ui';
import {TERMS} from '../lib/glossary';
import {t} from '../i18n';

export default function GlossaryPage() {
  const [q, setQ] = useState('');
  const items = TERMS.filter(([t, d]) => !q || t.toLowerCase().includes(q.toLowerCase()) || d.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a[0].localeCompare(b[0], 'ru'));
  return (
    <VStack gap={6}>
      <PageHeader icon={BookOpenIcon} title={t('Словарь простыми словами')} subtitle={t('Все сложные термины — коротко и на примерах из жизни. Значок «i» у заголовков карточек открывает эти же объяснения.')} />
      <TextInput label={t('Найти термин')} type="search" value={q} onChange={setQ} startIcon={MagnifyingGlassIcon} placeholder={t('Например: плазма')} />
      {items.length ? (
        <Grid columns={{minWidth: 320, max: 2, repeat: 'fit'}} gap={3}>
          {items.map(([t, d]) => (
            <Card key={t} padding={4}>
              <VStack gap={1.5}><Heading level={4} color="accent">{t}</Heading><Text>{d}</Text></VStack>
            </Card>
          ))}
        </Grid>
      ) : <EmptyState title={t('Ничего не найдено')} description={t('Попробуйте другое слово.')} />}
    </VStack>
  );
}
