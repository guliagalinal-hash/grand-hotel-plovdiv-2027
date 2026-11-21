import { useCallback, useRef, useState, type MouseEvent } from 'react';
import { useSite } from '../context';
import { config } from '../config';
import { GALA_DINNER, eur } from '../data/prices';
import { ROOMS, SPA, DINING, INTERIORS, PLOVDIV, PLOVDIV_PHOTO } from '../data/images';
import { Gallery, Lightbox } from './Gallery';
import { Pic } from './Pic';

export function RoomsSection() {
  const { t } = useSite();
  return (
    <section className="sec sec--light" id="rooms">
      <div className="wrap">
        <div className="sec__head"><h2>{t.rooms.title}</h2><p className="lead">{t.rooms.lead}</p></div>
        <Gallery items={ROOMS} label={t.rooms.title} captions={false} />
      </div>
    </section>
  );
}

export function SpaSection() {
  const { t, lang, base } = useSite();
  const s = t.spa;
  const [open, setOpen] = useState<number | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const close = useCallback(() => { setOpen(null); opener.current?.focus(); }, []);
  const show = (i: number) => (e: MouseEvent<HTMLElement>) => { opener.current = e.currentTarget; setOpen(i); };
  const [pool, ...thumbs] = SPA;
  return (
    <section className="sec sec--dark" id="spa">
      <div className="wrap spa">
        <div className="spa__text">
          <h2>{s.title}</h2>
          <p className="lead">{s.lead}</p>
          <h3>{s.listTitle}</h3>
          <ul className="chips">{s.list.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
        <div className="spa__mosaic">
          <button type="button" className="spa__main" aria-label={`${t.gallery.open}: ${pool[lang]}`} onClick={show(0)}>
            <img src={base + pool.src} alt="" width={pool.w} height={pool.h} decoding="async" />
            <span>{pool[lang]}</span>
          </button>
          <div className="spa__thumbs">
            {thumbs.map((it, i) => (
              <button type="button" key={it.src} aria-label={`${t.gallery.open}: ${it[lang]}`} onClick={show(i + 1)}>
                <img src={base + it.src} alt="" width={it.w} height={it.h} decoding="async" />
                <span>{it[lang]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      {open !== null && <Lightbox items={SPA} index={open} setIndex={setOpen} onClose={close} />}
    </section>
  );
}

export function DiningSection() {
  const { t } = useSite();
  const d = t.dining;
  return (
    <section className="sec sec--tint" id="dining">
      <div className="wrap">
        <div className="sec__head"><h2>{d.title}</h2><p className="lead">{d.lead}</p></div>
        <h3 className="gal__title">{d.g1}</h3>
        <Gallery items={DINING} label={d.g1} />
        <h3 className="gal__title">{d.g2}</h3>
        <Gallery items={INTERIORS} label={d.g2} />
      </div>
    </section>
  );
}

export function PlovdivSection() {
  const { t } = useSite();
  const p = t.plovdiv;
  return (
    <section className="sec sec--light" id="plovdiv">
      <div className="wrap plovdiv">
        <figure className="plovdiv__fig">
          <Pic img={PLOVDIV} className="arch-img" sizes="(max-width:1000px) 100vw, 55vw" />
        </figure>
        <div>
          <h2>{p.title}</h2>
          <p className="lead">{p.lead}</p>
          <ul className="pl-items">{p.items.map((it) => <li key={it.t}><h3>{it.t}</h3><p>{it.p}</p></li>)}</ul>
          <figure className="plovdiv__photo"><Pic img={PLOVDIV_PHOTO} sizes="(max-width:1000px) 100vw, 40vw" /></figure>
        </div>
      </div>
    </section>
  );
}

export function DinnerSection() {
  const { t } = useSite();
  const d = t.dinner;
  return (
    <section className="sec sec--tint" id="dinner">
      <div className="wrap dinner">
        <div>
          <h2>{d.title}</h2>
          <p className="lead">{d.lead}</p>
          <dl className="cover">
            <div><dt>{d.adult}</dt><dd>{eur(GALA_DINNER.adult)} <small>{d.per}</small></dd></div>
            <div><dt>{d.child}</dt><dd>{eur(GALA_DINNER.child2to11)} <small>{d.per}</small></dd></div>
            <div><dt>{d.infant}</dt><dd>{d.free}</dd></div>
            <div><dt>{d.teen}</dt><dd>{d.teenVal}</dd></div>
          </dl>
          <a className="btn btn--lg" href="#offer-calculator">{d.cta}</a>
        </div>
        <aside className="diff">
          <h3>{d.diffTitle}</h3>
          <ul>{d.diff.map((x) => <li key={x}>{x}</li>)}</ul>
        </aside>
      </div>
    </section>
  );
}

export function TermsSection() {
  const { t } = useSite();
  const m = t.terms;
  return (
    <section className="sec sec--light" id="terms">
      <div className="wrap">
        <div className="sec__head"><h2>{m.title}</h2></div>
        <div className="terms">
          <div><h3>{m.payTitle}</h3><ul>{m.pay.map((x) => <li key={x}>{x}</li>)}</ul></div>
          <div>
            <h3>{m.kidsTitle}</h3><ul>{m.kids.map((x) => <li key={x}>{x}</li>)}</ul>
            <h3 className="mt">{m.availTitle}</h3><p>{m.avail}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ContactCard({ id }: { id?: string }) {
  const { t } = useSite();
  const c = t.contact;
  const k = config.contact;
  return (
    <div className="contact" id={id}>
      <h3>{c.title}</h3>
      <ul className="contact__list">
        <li><span>{c.phone}</span><a href={`tel:${k.phoneRaw}`}>{k.phoneDisplay}</a></li>
        <li><span>{c.viber}</span><a href={`viber://chat?number=${encodeURIComponent(k.phoneRaw)}`}>{k.phoneDisplay}</a></li>
        <li><span>Telegram</span><a href={k.telegramUrl} target="_blank" rel="noopener noreferrer">@globacheva</a></li>
        <li><span>{c.email}</span><a href={`mailto:${k.email}`}>{k.email}</a></li>
      </ul>
      <div className="contact__btns">
        <a className="btn contact__call" href={`tel:${k.phoneRaw}`}>{c.call}</a>
        <a className="btn btn--outline" href={`mailto:${k.email}`}>{c.mailBtn}</a>
      </div>
    </div>
  );
}

export function Footer() {
  const { t, lang } = useSite();
  const s = config.seller;
  const k = config.contact;
  const c = t.contact;
  const f = t.footer;
  const rows: [string, string | null][] = [[f.seller, s.name], [f.address, s.address], [f.reg, s.registrationNo], [f.lic, s.licenseInfo]];
  const filled = rows.filter(([, v]) => v);
  return (
    <footer className="foot" id="contacts">
      <div className="wrap foot__in">
        <h2 className="foot__h">{f.title}</h2>
        <p className="foot__disc">{f.disclosure}</p>
        <div className="foot__cols foot__cols--map">
          <div className="foot__seller">
            <p className="foot__sub">{c.title}</p>
            <p><span>{c.phone}:</span> <a href={`tel:${k.phoneRaw}`}>{k.phoneDisplay}</a></p>
            <p><span>{c.viber}:</span> <a href={`viber://chat?number=${encodeURIComponent(k.phoneRaw)}`}>{k.phoneDisplay}</a></p>
            <p><span>Telegram:</span> <a href={k.telegramUrl} target="_blank" rel="noopener noreferrer">@globacheva</a></p>
            <p><span>{c.email}:</span> <a href={`mailto:${k.email}`}>{k.email}</a></p>
          </div>
          <div className="foot__map">
            <p className="foot__sub">{t.nav.plovdiv}: Grand Hotel Plovdiv</p>
            <iframe
              title={t.nav.plovdiv + ': Grand Hotel Plovdiv'}
              src="https://www.google.com/maps?q=Grand%20Hotel%20Plovdiv%2C%20Bulgaria&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <a href="https://www.google.com/maps/search/?api=1&query=Grand%20Hotel%20Plovdiv%2C%20Bulgaria" target="_blank" rel="noopener noreferrer">{lang === 'bg' ? 'Отвори в Google Maps' : 'Открыть в Google Картах'}</a>
          </div>
        </div>
        {(filled.length > 0 || s.privacyUrl) && (
          <div className="foot__legal">
            <p className="foot__sub">{f.legal}</p>
            {filled.map(([kk, v]) => <p key={kk}><span>{kk}:</span> {v}</p>)}
            {s.privacyUrl && <p><a href={s.privacyUrl} target="_blank" rel="noopener noreferrer">{f.privacy}</a></p>}
          </div>
        )}
      </div>
    </footer>
  );
}
