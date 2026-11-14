import { useCallback, useEffect, useRef, useState } from 'react';
import { useSite } from '../context';
import type { Img } from '../data/images';

/** Horizontal scroll-snap gallery (3 / 2 / ~1 photos per row) with a keyboard-accessible lightbox. */
export function Gallery({ items, label, captions = true }: { items: Img[]; label: string; captions?: boolean }) {
  const { t, lang, base } = useSite();
  const g = t.gallery;
  const [open, setOpen] = useState<number | null>(null);
  const track = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const scrollBy = (dir: number) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.9, behavior: 'smooth' });
  const close = useCallback(() => { setOpen(null); opener.current?.focus(); }, []);
  return (
    <div className="gal">
      <button type="button" className="gal__nav gal__nav--prev" aria-label={g.prev} onClick={() => scrollBy(-1)}>‹</button>
      <div className="gal__track" ref={track} role="list" aria-label={`${label}. ${g.track}`}>
        {items.map((it, i) => (
          <button key={it.src} role="listitem" type="button" className="gal__item" aria-label={`${g.open}: ${it[lang]}`}
            onClick={(e) => { opener.current = e.currentTarget; setOpen(i); }}>
            <img src={base + it.src} alt={it[lang]} loading="lazy" decoding="async" width={it.w} height={it.h} />
            {captions && <span>{it[lang]}</span>}
          </button>
        ))}
      </div>
      <button type="button" className="gal__nav gal__nav--next" aria-label={g.next} onClick={() => scrollBy(1)}>›</button>
      {open !== null && <Lightbox items={items} index={open} setIndex={setOpen} onClose={close} captions={captions} />}
    </div>
  );
}

export function Lightbox({ items, index, setIndex, onClose, captions = true }: { items: Img[]; index: number; setIndex: (i: number) => void; onClose: () => void; captions?: boolean }) {
  const { t, lang, base } = useSite();
  const g = t.gallery;
  const box = useRef<HTMLDivElement>(null);
  const startX = useRef<number | null>(null);
  const n = items.length;
  const go = useCallback((d: number) => setIndex((index + d + n) % n), [index, n, setIndex]);
  const it = items[index];

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    box.current?.querySelector<HTMLElement>('.lb__close')?.focus();
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'Tab' && box.current) {
        const f = Array.from(box.current.querySelectorAll<HTMLElement>('button'));
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [go, onClose]);

  return (
    <div className="lb" role="dialog" aria-modal="true" aria-label={it[lang]} ref={box}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onPointerDown={(e) => { startX.current = e.clientX; }}
      onPointerUp={(e) => {
        if (startX.current === null) return;
        const dx = e.clientX - startX.current; startX.current = null;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      }}>
      <button type="button" className="lb__close" aria-label={g.close} onClick={onClose}>×</button>
      <button type="button" className="lb__nav lb__nav--prev" aria-label={g.prev} onClick={() => go(-1)}>‹</button>
      <figure>
        <img src={base + it.src} alt={it[lang]} width={it.w} height={it.h} />
        <figcaption>{captions && <>{it[lang]} </>}<span>{index + 1} {g.of} {n}</span></figcaption>
      </figure>
      <button type="button" className="lb__nav lb__nav--next" aria-label={g.next} onClick={() => go(1)}>›</button>
    </div>
  );
}
