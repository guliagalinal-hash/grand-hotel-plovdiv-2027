import { useState } from 'react';
import { useSite, useCalc } from '../context';
import { eur, NIGHTS, OCCS, PRICES, ROOMS, type ProductId, type RoomId } from '../data/prices';

const ROOM_LABEL: Record<RoomId, string> = { classic: 'Classic', comfort: 'Comfort', lux: 'Lux' };

export function Offers() {
  const { t } = useSite();
  const c = useCalc();
  const o = t.offers;
  const [open, setOpen] = useState(false);
  const goToCalculator = () => {
    const el = document.getElementById('offer-calculator');
    if (!el) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduceMotion ? 'instant' : 'smooth', block: 'start' });
  };
  return (
    <section className="sec sec--light" id="prices">
      <div className="wrap">
        <div className="sec__head">
          <h2>{o.title}</h2>
          <p className="lead">{o.lead}</p>
        </div>

        <div className="offers">
          {(['accommodation', 'package'] as const).map((p) => {
            const copy = p === 'accommodation' ? o.A : o.B;
            const sel = !c.dinnerOnly && c.product === p;
            return (
              <article key={p} className={`offer offer--${p}` + (sel ? ' is-selected' : '')}>
                <h3>{copy.title}</h3>
                <p className="offer__price">{copy.price}</p>
                <p className="offer__per">{copy.per}</p>
                <p className={'banner ' + (p === 'package' ? 'banner--yes' : 'banner--no')}>{copy.flag}</p>
                <p className="offer__desc">{copy.desc}</p>
                <button type="button" className="btn btn--outline" aria-pressed={sel} onClick={() => { c.setDinnerOnly(false); c.setProduct(p); goToCalculator(); }}>{sel ? o.picked : o.pick}</button>
              </article>
            );
          })}
          <article className={"offer offer--dinner" + (c.dinnerOnly ? " is-selected" : "")}>
            <h3>{o.C.title}</h3>
            <p className="offer__price">{o.C.price}</p>
            <p className="offer__per">{o.C.per}</p>
            <p className="offer__desc">{o.C.desc}</p>
            <button type="button" className="btn btn--outline" aria-pressed={c.dinnerOnly} onClick={() => { c.setDinnerOnly(true); goToCalculator(); }}>{c.dinnerOnly ? o.picked : o.pick}</button>
          </article>
        </div>

        <div id="offer-calculator" style={{ scrollMarginTop: '110px' }}>
          <Calculator open={open} onToggle={() => setOpen(!open)} />
        </div>
        <AllPrices open={open} />
      </div>
    </section>
  );
}

export function Calculator({ open = false, onToggle, compact = false }: { open?: boolean; onToggle?: () => void; compact?: boolean }) {
  const { t, lang } = useSite();
  const c = useCalc();
  const k = t.calc;
  const bg = lang === 'bg';
  const label = (ru: string, bulgarian: string) => bg ? bulgarian : ru;
  const dinner = c.dinnerOnly;
  const basePrice = PRICES[c.product][c.room][c.occ][c.nights - 1];
  const familyPrice = dinner ? c.adults * 220 + c.children * 132 : (c.children || c.infants || c.adults > 2 || (c.adults === 2 && c.occ === 'single') || (c.adults === 1 && c.occ === 'double') ? null : (c.occ === 'double' ? basePrice * 2 : basePrice));
  const adjust = (value: number, delta: number, setter: (n: number) => void, min: number) => setter(Math.max(min, Math.min(10, value + delta)));
  const product = c.product;
  const incl = product === 'accommodation' ? k.includesA : k.includesB;
  const occLabel = c.occ === 'double' ? label('Двухместный номер', 'Двойна стая') : label('Одноместное размещение', 'Единично настаняване');
  const perPerson = !dinner && c.occ === 'double' ? eur(PRICES[product][c.room].double[c.nights - 1]) : null;
  const oneBedOnly = !dinner && c.occ === 'double' && c.adults === 1 && c.children === 0 && c.infants === 0;
  const guestLabel = label(`${c.adults} взрослых, ${c.children} детей 2–11 лет, ${c.infants} детей до 2 лет`, `${c.adults} възрастни, ${c.children} деца 2–11 г., ${c.infants} деца под 2 г.`);
  return (
    <div className={'calc calc--' + product} aria-labelledby={compact ? "calc-h-lower" : "calc-h-upper"}>
      <div className="calc__controls">
        <h3 id={compact ? "calc-h-lower" : "calc-h-upper"}>{k.title}</h3>
        <fieldset><legend>{label('Выберите один из трёх вариантов', 'Изберете една от трите оферти')}</legend>
          <div className="seg seg--wide">
            <button type="button" aria-pressed={!dinner && product === 'accommodation'} onClick={() => { c.setDinnerOnly(false); c.setProduct('accommodation'); }}>{label('Проживание без гала-ужина', 'Нощувки без гала вечеря')}</button>
            <button type="button" aria-pressed={!dinner && product === 'package'} onClick={() => { c.setDinnerOnly(false); c.setProduct('package'); }}>{label('Проживание с гала-ужином', 'Нощувки с гала вечеря')}</button>
            <button type="button" aria-pressed={dinner} onClick={() => c.setDinnerOnly(true)}>{label('Только гала-ужин', 'Само гала вечеря')}</button>
          </div>
        </fieldset>
        {!dinner && <>
        <fieldset>
          <legend>{k.nights}</legend>
          <div className="seg">{NIGHTS.map((n) => <button key={n} type="button" aria-pressed={c.nights === n} onClick={() => c.setNights(n)}>{n}</button>)}</div>
        </fieldset>
        <fieldset>
          <legend>{k.room}</legend>
          <div className="seg">{ROOMS.map((r) => <button key={r} type="button" aria-pressed={c.room === r} onClick={() => c.setRoom(r)}>{ROOM_LABEL[r]}</button>)}</div>
        </fieldset>
        <fieldset>
          <legend>{k.occ}</legend>
          <div className="seg seg--wide">{OCCS.map((o) => <button key={o} type="button" aria-pressed={c.occ === o} onClick={() => c.setOcc(o)}>{o === 'double' ? label('Двухместный номер', 'Двойна стая') : label('Одноместное размещение', 'Единично настаняване')}</button>)}</div>
        </fieldset>
        </>}
        <fieldset><legend>{label('Гости', 'Гости')}</legend>{([
          [label('Взрослые (12+)', 'Възрастни (12+)'), c.adults, c.setAdults, 1],
          [label('Дети 2–11 лет', 'Деца 2–11 г.'), c.children, c.setChildren, 0],
          [label('Дети до 2 лет', 'Деца под 2 г.'), c.infants, c.setInfants, 0],
        ] as const).map(([name, value, setter, min]) => <div key={name} className="row2"><span>{name}</span><div className="seg"><button type="button" disabled={value <= min} onClick={() => adjust(value, -1, setter, min)}>−</button><output>{value}</output><button type="button" disabled={value >= 10} onClick={() => adjust(value, 1, setter, min)}>+</button></div></div>)}</fieldset>
      </div>

      <div className="calc__result">
        <div role="status" aria-live="polite">
          <span className="calc__ctx">{dinner ? label('Гала-ужин 31 декабря', 'Гала вечеря на 31 декември') : `${k.resultLabel}: ${c.nights} ${k.nightsWord(c.nights)}, ${ROOM_LABEL[c.room]}, ${occLabel}; ${guestLabel}`}</span>
          <strong className="calc__price" data-testid="price">{familyPrice === null ? (oneBedOnly ? perPerson : label('Стоимость уточняется', 'Цената се уточнява')) : eur(familyPrice)}</strong>
          <span className="calc__per">{familyPrice === null ? (oneBedOnly ? label('Цена за одно место в двухместном номере; размещение одного гостя требует подтверждения', 'Цена за едно легло в двойна стая; настаняването на един гост подлежи на потвърждение') : label('Итог зависит от состава гостей и условий размещения', 'Крайната цена зависи от броя гости и условията за настаняване')) : label(`Итого за ${guestLabel}`, `Общо за ${guestLabel}`)}</span>
          {perPerson && !dinner && !oneBedOnly && <p className="note">{label(`Тариф за 1 человека при двухместном размещении: ${perPerson}. Итог для двух взрослых: ${eur(PRICES[product][c.room].double[c.nights - 1] * 2)}.`, `Цена на човек в двойна стая: ${perPerson}. Общо за двама възрастни: ${eur(PRICES[product][c.room].double[c.nights - 1] * 2)}.`)}</p>}
          {!dinner && <p className={'banner ' + (product === 'package' ? 'banner--yes' : 'banner--no')}>{product === 'package' ? k.flagB : k.flagA}</p>}
          {familyPrice === null && <p className="note">{label('Размещение детей и дополнительные места уточняются при подтверждении заявки.', 'Настаняването на деца и допълнителните легла се уточняват при потвърждаване на запитването.')}</p>}
        </div>
        {!dinner && <><h4>{k.includes}</h4>
        <ul className="ticks ticks--dark">{incl.map((x) => <li key={x}>{x}</li>)}</ul>
        {product === 'accommodation' && <p className="note">{k.moreA}</p>}</>}
        {!compact && <div className="calc__btns">
          <button type="button" className="btn btn--lg btn--toggle" aria-expanded={open} aria-controls="all-prices" onClick={onToggle}>
            {k.showAll}<span className="chev" aria-hidden="true" />
          </button>
          <a className="btn btn--outline" href="#apply">{k.request}</a>
        </div>}
      </div>
    </div>
  );
}

function PriceTable({ product, caption }: { product: ProductId; caption: string }) {
  const { t } = useSite();
  const c = useCalc();
  const k = t.tables;
  return (
    <div className={'ptable ptable--' + product}>
      <h3>{caption}</h3>
      <p className="scrollhint">{k.scrollHint}</p>
      <div className="tablewrap" tabIndex={0} role="region" aria-label={caption}>
        <table>
          <caption>{caption}</caption>
          <thead>
            <tr>
              <th scope="col" rowSpan={2}>{k.nights}</th>
              {ROOMS.map((r) => <th key={r} scope="colgroup" colSpan={2}>{ROOM_LABEL[r]}</th>)}
            </tr>
            <tr>
              {ROOMS.flatMap((r) => OCCS.map((o) => <th key={r + o} scope="col" className="sub">{o === 'double' ? k.colDouble : k.colSingle}</th>))}
            </tr>
          </thead>
          <tbody>
            {NIGHTS.map((n) => (
              <tr key={n}>
                <th scope="row">{k.nightsShort(n)}</th>
                {ROOMS.flatMap((r) => OCCS.map((o) => {
                  const sel = c.product === product && c.nights === n && c.room === r && c.occ === o;
                  return <td key={r + o} className={sel ? 'sel' : ''}>{eur(PRICES[product][r][o][n - 1])}</td>;
                }))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Full price tables: collapsed by default, smooth expand/collapse (button in the calculator). */
function AllPrices({ open }: { open: boolean }) {
  const { t } = useSite();
  const k = t.tables;
  return (
    <div id="all-prices" className={'collapse' + (open ? ' is-open' : '')} inert={!open}>
      <div className="collapse__in">
        <div className="allprices">
          <p className="allprices__lead">{k.lead}</p>
          <div className="ptables">
            <PriceTable product="accommodation" caption={k.capA} />
            <PriceTable product="package" caption={k.capB} />
          </div>
          <p className="small">{k.period}</p>
        </div>
      </div>
    </div>
  );
}
