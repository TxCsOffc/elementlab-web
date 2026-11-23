import {AppShell} from '@astryxdesign/core/AppShell';
import {SideNav, SideNavHeading, SideNavItem, SideNavSection} from '@astryxdesign/core/SideNav';
import {TopNav} from '@astryxdesign/core/TopNav';
import {Text} from '@astryxdesign/core/Text';
import {Icon} from '@astryxdesign/core/Icon';
import {
  PlayCircleIcon, Squares2X2Icon, ChartBarIcon, SparklesIcon, AtomIcon, CpuChipIcon, ShareIcon,
  SunIcon, WrenchScrewdriverIcon, BookOpenIcon, InformationCircleIcon, BeakerIcon,
} from './components/icons';
import {lazy, Suspense} from 'react';
import {Spinner} from '@astryxdesign/core/Spinner';
import {StoreProvider, useStore, type PageId} from './store';
const SimsPage = lazy(() => import('./pages/SimsPage'));
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
import {PAGE_EXPLAIN} from './lib/glossary';

export const PAGES: {id: PageId; title: string; icon: typeof PlayCircleIcon; section: string}[] = [
  {id: 'sims', title: 'Симуляции', icon: PlayCircleIcon, section: 'Наглядно'},
  {id: 'table', title: 'Таблица элементов', icon: Squares2X2Icon, section: 'Материалы'},
  {id: 'phase', title: 'Фазовые диаграммы', icon: ChartBarIcon, section: 'Материалы'},
  {id: 'states', title: 'Состояния вещества', icon: SparklesIcon, section: 'Материалы'},
  {id: 'nucleus', title: 'Ядро и кварки', icon: AtomIcon, section: 'Материалы'},
  {id: 'channel', title: 'Канал транзистора', icon: CpuChipIcon, section: 'Транзистор'},
  {id: 'wires', title: 'Межсоединения', icon: ShareIcon, section: 'Транзистор'},
  {id: 'litho', title: 'Литография', icon: SunIcon, section: 'Производство'},
  {id: 'process', title: 'Поиск техпроцесса', icon: WrenchScrewdriverIcon, section: 'Производство'},
  {id: 'glossary', title: 'Словарь простыми словами', icon: BookOpenIcon, section: 'Справка'},
  {id: 'about', title: 'Модели и источники', icon: InformationCircleIcon, section: 'Справка'},
];

const SECTIONS = ['Наглядно', 'Материалы', 'Транзистор', 'Производство', 'Справка'];

function Page() {
  const {page} = useStore();
  switch (page) {
    case 'table': return <TablePage />;
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
          endContent={<ExplainButton title={current.title} text={PAGE_EXPLAIN[current.id] ?? ''} />}
        />
      }
      sideNav={
        <SideNav header={<SideNavHeading heading="ElementLab" subheading="материалы для чипов" icon={<Icon icon={BeakerIcon} size="md" color="accent" />} />}>
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
