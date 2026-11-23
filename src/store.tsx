import {createContext, useContext, useEffect, useState, type ReactNode} from 'react';

export type PageId = 'sims' | 'table' | 'phase' | 'states' | 'nucleus' | 'channel' | 'wires' | 'litho' | 'process' | 'glossary' | 'about';

interface Store {
  page: PageId; setPage: (p: PageId) => void;
  selected: number; setSelected: (id: number) => void;
  tempK: number; setTempK: (t: number) => void;
  pressure: number; setPressure: (p: number) => void;
  celsius: boolean; setCelsius: (c: boolean) => void;
  go: (p: PageId, id?: number) => void;
}

const Ctx = createContext<Store | null>(null);

function readHash(): [PageId, number | undefined] {
  const [, p, id] = window.location.hash.split('/');
  return [(p as PageId) || 'sims', id !== undefined && id !== '' ? Number(id) : undefined];
}

export function StoreProvider({children}: {children: ReactNode}) {
  const [h0, id0] = readHash();
  const [page, setPageState] = useState<PageId>(h0);
  const [selected, setSelected] = useState(id0 ?? 14);
  const [tempK, setTempK] = useState(298.15);
  const [pressure, setPressure] = useState(1);
  const [celsius, setCelsius] = useState(true);

  useEffect(() => {
    const onHash = () => { const [p, id] = readHash(); setPageState(p); if (id !== undefined) setSelected(id); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = (p: PageId, id?: number) => {
    const next = id ?? (p === 'phase' || p === 'table' || p === 'nucleus' ? selected : undefined);
    window.location.hash = '/' + p + (next !== undefined ? '/' + next : '');
    setPageState(p);
    if (id !== undefined) setSelected(id);
    window.scrollTo?.(0, 0);
  };

  return (
    <Ctx.Provider value={{page, setPage: (p) => go(p), selected, setSelected: (id) => { setSelected(id); if (page === 'phase' || page === 'table' || page === 'nucleus') history.replaceState(null, '', '#/' + page + '/' + id); },
      tempK, setTempK, pressure, setPressure, celsius, setCelsius, go}}>
      {children}
    </Ctx.Provider>
  );
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('StoreProvider missing');
  return s;
}
