import { useState } from 'react';
import { useSite } from '../context';
import { config } from '../config';
import { HERO, LOBBY, type Img } from '../data/images';
import { Pic } from './Pic';

export function Header() {
  const { t, lang } = useSite();
  const [open, setOpen] = useState(false);
  const links: [string, string][] = [
    ['#program', t.nav.program], ['#prices', t.nav.prices], ['#rooms', t.nav.rooms],
    ['#spa', t.nav.spa], ['#dining', t.nav.dining], ['#plovdiv', t.nav.plovdiv], ['#terms', t.nav.terms],
    ['#contacts', lang === 'bg' ? 'Контакти' : 'Контакты'],
  ];
  return (
    <header className="hdr">
      <div className="wrap hdr__in">
        <a className="brand" href="#top" onClick={() => setOpen(false)}>1001 Stories <span>· 2027</span></a>
        <nav id="nav" className={'nav' + (open ? ' is-open' : '')} aria-label="Main">
          {links.map(([h, l]) => <a key={h} href={h} onClick={() => setOpen(false)}>{l}</a>)}
        </nav>
        <div className="hdr__right">
          <a className="hdr__contact" href={`tel:${config.contact.phoneRaw}`} aria-label="Phone">☎</a>
          <a className="hdr__contact" href={`viber://chat?number=${encodeURIComponent(config.contact.phoneRaw)}`} aria-label="Viber">Viber</a>
          <a className="hdr__contact" href={config.contact.telegramUrl} target="_blank" rel="noopener noreferrer" aria-label="Telegram">TG</a>
          <button type="button" className="btn btn--sm hdr__cta" onClick={() => window.dispatchEvent(new Event('open-inquiry'))}>{lang === 'bg' ? 'Запитване' : 'Забронировать'}</button>
          <button type="button" className="burger" aria-expanded={open} aria-controls="nav" aria-label={t.nav.menu} onClick={() => setOpen(!open)}>
            <span /><span /><span />
          </button>
        </div>
      </div>
    </header>
  );
}

export function Hero() {
  const { t, lang } = useSite();
  const h = t.hero;
  return (
    <section className="hero" id="top">
      <Pic img={HERO} className="hero__img" sizes="100vw" eager />
      <div className="hero__shade" aria-hidden="true" />
      <div className="wrap hero__in">
        <p className="eyebrow">{h.eyebrow}</p>
        <h1>{lang === 'bg' ? 'Нова година 2027 в Пловдив' : 'Новый год 2027 в Пловдиве'}</h1>
        <p className="hero__hotel">Grand Hotel Plovdiv 5★</p>
        <p className="hero__theme">{h.theme}</p>
        <p className="hero__dates">{h.dates}</p>
        <p className="hero__description">{lang === 'bg' ? 'Празнична почивка с новогодишна програма и гала вечеря или без тях.' : 'Праздничный отдых с новогодней программой и гала-ужином или без них.'}</p>
        <div className="hero__starting-prices" aria-label={lang === 'bg' ? 'Два алтернативни варианта' : 'Два варианта на выбор'}>
          <p>{lang === 'bg' ? 'Вариант 1: Нощувка без гала вечеря — от 71,65 €' : 'Вариант 1: Проживание без гала-ужина — от 71,65 €'}</p>
          <p>{lang === 'bg' ? 'Вариант 2: Новогодишен пакет с гала вечеря — от 280,90 €' : 'Вариант 2: Новогодний пакет с гала-ужином — от 280,90 €'}</p>
        </div>
        <div className="hero__actions"><a className="btn btn--lg" href="#prices">{h.cta}</a><button type="button" className="btn btn--lg btn--outline" onClick={() => window.dispatchEvent(new Event('open-inquiry'))}>{lang === 'bg' ? 'Изпратете запитване' : 'Забронировать'}</button></div>
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
