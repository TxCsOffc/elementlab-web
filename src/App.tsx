import {AppShell} from '@astryxdesign/core/AppShell';
import {SideNav, SideNavHeading, SideNavItem, SideNavSection} from '@astryxdesign/core/SideNav';
import {TopNav} from '@astryxdesign/core/TopNav';
import {Text} from '@astryxdesign/core/Text';
import {Icon} from '@astryxdesign/core/Icon';
import {
  PlayCircleIcon, Squares2X2Icon, ChartBarIcon, SparklesIcon, AtomIcon, CpuChipIcon, ShareIcon,
  SunIcon, WrenchScrewdriverIcon, BookOpenIcon, InformationCircleIcon, BeakerIcon, ClockIcon,
} from './components/icons';
import {lazy, Suspense} from 'react';
import {Spinner} from '@astryxdesign/core/Spinner';
import {StoreProvider, useStore, type PageId} from './store';
const SimsPage = lazy(() => import('./pages/SimsPage'));
const AtomPage = lazy(() => import('./pages/AtomPage'));
const PropertyMapPage = lazy(() => import('./pages/PropertyMapPage'));
const MoorePage = lazy(() => import('./pages/MoorePage'));
const TablePage = lazy(() => import('./pages/TablePage'));
const PhasePage = lazy(() => import('./pages/PhasePage'));
const StatesPage = lazy(() => import('./pages/StatesPage'));
const NucleusPage = lazy(() => import('./pages/NucleusPage'));
const ChannelPage = lazy(() => import('./pages/ChannelPage'));
const WiresPage = lazy(() => import('./pages/WiresPage'));
const LithoPage = lazy(() => import('./pages/LithoPage'));
const ProcessPage = lazy(() => import('./pages/ProcessPage'));
const GlossaryPage = lazy(() => import('./pages/GlossaryPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));

import {ExplainButton} from './components/ui';
import {HStack} from '@astryxdesign/core/Stack';
import {SegmentedControl, SegmentedControlItem} from '@astryxdesign/core/SegmentedControl';
import {lang, setLang} from './i18n';
import {PAGE_EXPLAIN} from './lib/glossary';
import {t} from './i18n';

export const PAGES: {id: PageId; title: string; icon: typeof PlayCircleIcon; section: string}[] = [
  {id: 'sims', title: t('Симуляции'), icon: PlayCircleIcon, section: t('Наглядно')},
  {id: 'table', title: t('Таблица элементов'), icon: Squares2X2Icon, section: t('Материалы')},
  {id: 'atom', title: t('Строение атома'), icon: AtomIcon, section: t('Материалы')},
  {id: 'propmap', title: t('Карта свойств'), icon: ChartBarIcon, section: t('Материалы')},
  {id: 'phase', title: t('Фазовые диаграммы'), icon: ChartBarIcon, section: t('Материалы')},
  {id: 'states', title: t('Состояния вещества'), icon: SparklesIcon, section: t('Материалы')},
  {id: 'nucleus', title: t('Ядро и кварки'), icon: AtomIcon, section: t('Материалы')},
  {id: 'channel', title: t('Канал транзистора'), icon: CpuChipIcon, section: t('Транзистор')},
  {id: 'wires', title: t('Межсоединения'), icon: ShareIcon, section: t('Транзистор')},
  {id: 'litho', title: t('Литография'), icon: SunIcon, section: t('Производство')},
  {id: 'process', title: t('Поиск техпроцесса'), icon: WrenchScrewdriverIcon, section: t('Производство')},
  {id: 'moore', title: t('Закон Мура'), icon: ClockIcon, section: t('Производство')},
  {id: 'glossary', title: t('Словарь простыми словами'), icon: BookOpenIcon, section: t('Справка')},
  {id: 'about', title: t('Модели и источники'), icon: InformationCircleIcon, section: t('Справка')},
];

const SECTIONS = [t('Наглядно'), t('Материалы'), t('Транзистор'), t('Производство'), t('Справка')];

function Page() {
  const {page} = useStore();
  switch (page) {
    case 'table': return <TablePage />;
    case 'atom': return <AtomPage />;
    case 'propmap': return <PropertyMapPage />;
    case 'moore': return <MoorePage />;
    case 'phase': return <PhasePage />;
    case 'states': return <StatesPage />;
    case 'nucleus': return <NucleusPage />;
    case 'channel': return <ChannelPage />;
    case 'wires': return <WiresPage />;
    case 'litho': return <LithoPage />;
    case 'process': return <ProcessPage />;
    case 'glossary': return <GlossaryPage />;
    case 'about': return <AboutPage />;
    default: return <SimsPage />;
  }
}

function Shell() {
  const {page, go} = useStore();
  const current = PAGES.find((p) => p.id === page) ?? PAGES[0];
  return (
    <AppShell
      contentPadding={6}
      topNav={
        <TopNav
          heading={<Text weight="semibold">{current.title}</Text>}
          endContent={
            <HStack gap={3} vAlign="center">
              <SegmentedControl label="Language / Язык" value={lang} onChange={(v) => setLang(v as 'ru' | 'en')} size="sm">
                <SegmentedControlItem value="ru" label="RU" />
                <SegmentedControlItem value="en" label="EN" />
              </SegmentedControl>
              <ExplainButton title={current.title} text={PAGE_EXPLAIN[current.id] ?? ''} />
            </HStack>
          }
        />
      }
      sideNav={
        <SideNav header={<SideNavHeading heading="ElementLab" subheading={t('материалы для чипов')} icon={<Icon icon={BeakerIcon} size="md" color="accent" />} />}>
          {SECTIONS.map((s) => (
            <SideNavSection key={s} title={s}>
              {PAGES.filter((p) => p.section === s).map((p) => (
                <SideNavItem key={p.id} label={p.title} icon={p.icon} isSelected={p.id === page}
                  href={'#/' + p.id} onClick={(e) => { e.preventDefault(); go(p.id); }} />
              ))}
            </SideNavSection>
          ))}
        </SideNav>
      }>
      <Suspense fallback={<Spinner />}>
        <Page />
      </Suspense>
    </AppShell>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
