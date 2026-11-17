import { useState } from 'react';
import { useSite } from '../context';
import { HERO, LOBBY, type Img } from '../data/images';
import { Pic } from './Pic';

export function Header() {
  const { t, lang } = useSite();
  const [open, setOpen] = useState(false);
  const links: [string, string][] = [
    ['#program', t.nav.program], ['#prices', t.nav.prices], ['#rooms', t.nav.rooms],
    ['#spa', t.nav.spa], ['#dining', t.nav.dining], ['#plovdiv', t.nav.plovdiv], ['#terms', t.nav.terms],
    ['#contact', lang === 'bg' ? 'Контакти' : 'Контакты'],
  ];
  return (
    <header className="hdr">
      <div className="wrap hdr__in">
        <a className="brand" href="#top" onClick={() => setOpen(false)}>1001 Stories <span>· 2027</span></a>
        <nav id="nav" className={'nav' + (open ? ' is-open' : '')} aria-label="Main">
          {links.map(([h, l]) => <a key={h} href={h} onClick={() => setOpen(false)}>{l}</a>)}
        </nav>
        <div className="hdr__right">
          <a className="btn btn--sm hdr__cta" href="#offer-calculator">{t.cta}</a>
          <button type="button" className="burger" aria-expanded={open} aria-controls="nav" aria-label={t.nav.menu} onClick={() => setOpen(!open)}>
            <span /><span /><span />
          </button>
        </div>
      </div>
    </header>
  );
}

export function Hero() {
  const { t } = useSite();
  const h = t.hero;
  return (
    <section className="hero" id="top">
      <Pic img={HERO} className="hero__img" sizes="100vw" eager />
      <div className="hero__shade" aria-hidden="true" />
      <div className="wrap hero__in">
        <p className="eyebrow">{h.eyebrow}</p>
        <h1>{h.title.split('5★')[0]}<span className="five">5★</span></h1>
        <p className="hero__theme">{h.theme}</p>
        <p className="hero__dates">{h.dates}</p>
        <div className="hero__prices">
          <p>{h.a.pre}<strong>{h.a.price}</strong>{h.a.post} <em className="hero__sub">{h.a.sub}</em></p>
          <p>{h.b.pre}<strong>{h.b.price}</strong>{h.b.post}</p>
        </div>
        <a className="btn btn--lg" href="#prices">{h.cta}</a>
      </div>
    </section>
  );
}

export function Advantages() {
  const { t } = useSite();
  const a = t.adv;
  return (
    <section className="sec sec--light" id="why">
      <div className="wrap adv">
        <div>
          <h2>{a.title}</h2>
          <p className="lead">{a.lead}</p>
          <ul className="adv__list">
            {a.items.map((it) => <li key={it.t}><h3>{it.t}</h3><p>{it.p}</p></li>)}
          </ul>
        </div>
        <figure className="adv__fig">
          <Pic img={LOBBY as Img} sizes="(max-width:1000px) 100vw, 45vw" />
        </figure>
      </div>
    </section>
  );
}

export function Program() {
  const { t } = useSite();
  const p = t.program;
  return (
    <section className="sec sec--dark" id="program">
      <div className="wrap program">
        <div className="program__text">
          <p className="eyebrow">{p.eyebrow}</p>
          <h2>{p.title}</h2>
          <p className="program__sub">{p.sub}</p>
          <p className="banner banner--big">{p.banner}</p>
          <p className="program__ask">{p.ask}</p>
          <h3>{p.listTitle}</h3>
          <ul className="ticks">{p.list.map((x) => <li key={x}>{x}</li>)}</ul>
        </div>
        <figure className="program__fig">
          <Pic img={HERO} className="arch-img" sizes="(max-width:1000px) 100vw, 40vw" />
        </figure>
      </div>
    </section>
  );
}
