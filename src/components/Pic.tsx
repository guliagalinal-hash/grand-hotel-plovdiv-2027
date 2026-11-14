import { useSite } from '../context';
import type { Img } from '../data/images';

/** <img> with the page's asset prefix, intrinsic size (no layout shift) and optional 800px variant. */
export function Pic({ img, className, sizes, eager, alt }: { img: Img; className?: string; sizes?: string; eager?: boolean; alt?: string }) {
  const { base, lang } = useSite();
  const text = alt ?? img[lang];
  return (
    <img
      className={className}
      src={base + img.src}
      srcSet={img.src800 ? `${base + img.src800} 800w, ${base + img.src} ${img.w}w` : undefined}
      sizes={img.src800 ? sizes : undefined}
      alt={text}
      width={img.w}
      height={img.h}
      loading={eager ? undefined : 'lazy'}
      decoding={eager ? undefined : 'async'}
      fetchPriority={eager ? 'high' : undefined}
    />
  );
}
