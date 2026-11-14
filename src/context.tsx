import { createContext, useContext, useState, type ReactNode } from 'react';
import { content, type Dict, type Lang } from './content';
import type { OccId, ProductId, RoomId, Nights } from './data/prices';

/** Site-wide context: language (fixed per page), asset prefix and the shared price selection. */
interface Site { lang: Lang; t: Dict; base: string }
const SiteCtx = createContext<Site | null>(null);

interface Calc {
  product: ProductId; setProduct: (p: ProductId) => void;
  nights: Nights; setNights: (n: Nights) => void;
  room: RoomId; setRoom: (r: RoomId) => void;
  occ: OccId; setOcc: (o: OccId) => void;
}
const CalcCtx = createContext<Calc | null>(null);

export function SiteProvider({ lang, base, children }: { lang: Lang; base: string; children: ReactNode }) {
  const [product, setProduct] = useState<ProductId>('accommodation');
  const [nights, setNights] = useState<Nights>(1);
  const [room, setRoom] = useState<RoomId>('classic');
  const [occ, setOcc] = useState<OccId>('double');
  return (
    <SiteCtx.Provider value={{ lang, t: content[lang], base }}>
      <CalcCtx.Provider value={{ product, setProduct, nights, setNights, room, setRoom, occ, setOcc }}>
        {children}
      </CalcCtx.Provider>
    </SiteCtx.Provider>
  );
}
export function useSite(): Site {
  const c = useContext(SiteCtx);
  if (!c) throw new Error('useSite outside SiteProvider');
  return c;
}
export function useCalc(): Calc {
  const c = useContext(CalcCtx);
  if (!c) throw new Error('useCalc outside SiteProvider');
  return c;
}
