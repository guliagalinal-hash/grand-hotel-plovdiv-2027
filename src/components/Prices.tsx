import { useState } from 'react';
import { useSite, useCalc } from '../context';
import { eur, NIGHTS, OCCS, PRICES, ROOMS, totalPrice, type ProductId, type RoomId } from '../data/prices';

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
  const guests = c.rooms.reduce((a, x) => ({ adults: a.adults + x.adults, children: a.children + x.children, infants: a.infants + x.infants }), { adults: 0, children: 0, infants: 0 });
  const visibleSubtotal = totalPrice(c.product, c.room, c.nights, c.rooms, dinner);
  const needsConfirmation = !dinner && c.rooms.some(x => x.adults > 2);
  const childStay = guests.children * PRICES.accommodation[c.room].double[c.nights - 1] * 0.7;
  const childGala = c.product === 'package' ? guests.children * 132 : 0;
  const changeRoom = (index: number, key: 'adults' | 'children' | 'infants', delta: number) => {
    c.setRooms(c.rooms.map((g, i) => i === index ? { ...g, [key]: Math.max(key === 'adults' ? 1 : 0, Math.min(10, g[key] + delta)) } : g));
  };
  const product = c.product;
  const incl = product === 'accommodation' ? k.includesA : k.includesB;
  
  

  const guestLabel = label(`${guests.adults} взрослых, ${guests.children} детей 2–11 лет, ${guests.infants} детей до 2 лет`, `${guests.adults} възрастни, ${guests.children} деца 2–11 г., ${guests.infants} деца под 2 г.`);
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
        </>}
        <fieldset><legend>{label('Гости', 'Гости')}</legend>
          {!dinner && <div className="row2"><span>{label('Номеров', 'Стаи')}</span><div className="seg"><button type="button" disabled={c.rooms.length <= 1} onClick={() => c.setRooms(c.rooms.slice(0, -1))}>−</button><output>{c.rooms.length}</output><button type="button" disabled={c.rooms.length >= 5} onClick={() => c.setRooms([...c.rooms, { adults: 1, children: 0, infants: 0 }])}>+</button></div></div>}
          {c.rooms.map((g, i) => <div key={i}>
            {!dinner && c.rooms.length > 1 && <strong>{label('Номер', 'Стая')} {i + 1}</strong>}
            {([
              [label('Взрослые (12+)', 'Възрастни (12+)'), 'adults', g.adults, 1],
              [label('Дети 2–11 лет', 'Деца 2–11 г.'), 'children', g.children, 0],
              [label('Дети до 2 лет', 'Деца под 2 г.'), 'infants', g.infants, 0],
            ] as const).map(([name, key, value, min]) => <div key={key} className="row2"><span>{name}</span><div className="seg"><button type="button" disabled={value <= min} onClick={() => changeRoom(i, key, -1)}>−</button><output>{value}</output><button type="button" disabled={value >= 10} onClick={() => changeRoom(i, key, 1)}>+</button></div></div>)}
          </div>)}
        </fieldset>
        <button type="button" className="btn calc__view-result" onClick={() => document.getElementById("calculator-result")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" })}>{label("Посмотреть стоимость ↓", "Виж цената ↓")}</button>
      </div>

      <div className="calc__result" id={compact ? undefined : "calculator-result"}>
        <div role="status" aria-live="polite">
          <span className="calc__ctx">{dinner ? label('Гала-ужин 31 декабря', 'Гала вечеря на 31 декември') : `${k.resultLabel}: ${c.nights} ${k.nightsWord(c.nights)}, ${ROOM_LABEL[c.room]}, ${c.rooms.length} ${label('ном.', 'стаи')}; ${guestLabel}`}</span>
          <strong className="calc__price" data-testid="price">{eur(visibleSubtotal)}</strong>
          <span className="calc__per">{needsConfirmation ? label("Предварительная сумма, размещение требует подтверждения", "Предварителна сума, настаняването подлежи на потвърждение") : label(`Итого за ${guestLabel}`, `Общо за ${guestLabel}`)}</span>
          {!dinner && <p className="note">{label('Тариф рассчитывается по составу гостей в каждом номере.', 'Цената се изчислява според гостите във всяка стая.')}</p>}
          {!dinner && guests.children > 0 && <p className="note">{label(`Дети 2–11 лет: проживание 70% от тарифа места в двухместном номере (${eur(childStay)})${product === "package" ? ` + гала-ужин ${eur(childGala)}` : ""}.`, `Деца 2–11 г.: нощувка 70% от цената на легло в двойна стая (${eur(childStay)})${product === "package" ? ` + гала вечеря ${eur(childGala)}` : ""}.`)}</p>}
          {!dinner && guests.infants > 0 && <p className="note">{label('Дети до 2 лет бесплатно. Возможность размещения подтверждается отелем.', 'Деца под 2 години безплатно. Настаняването се потвърждава от хотела.')}</p>}
          {needsConfirmation && <p className="note">{label('Стоимость дополнительных взрослых и условия размещения подтвердит отель. Вы можете отправить заявку сейчас.', 'Цената за допълнителни възрастни и условията за настаняване ще бъдат потвърдени от хотела. Можете да изпратите запитване сега.')}</p>}
          {!dinner && <p className={'banner ' + (product === 'package' ? 'banner--yes' : 'banner--no')}>{product === 'package' ? k.flagB : k.flagA}</p>}
        </div>
        {!dinner && <><h4>{k.includes}</h4>
        <ul className="ticks ticks--dark">{incl.map((x) => <li key={x}>{x}</li>)}</ul>
        {product === 'accommodation' && <p className="note">{k.moreA}</p>}</>}
        {!compact && <div className="calc__btns">
          <button type="button" className="btn btn--lg btn--toggle" aria-expanded={open} aria-controls="all-prices" onClick={onToggle}>
            {k.showAll}<span className="chev" aria-hidden="true" />
          </button>
          <a className="btn btn--outline" href="#apply">{label("Отправить заявку", "Изпрати запитване")}</a>
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
                  return <td key={r + o}>{eur(PRICES[product][r][o][n - 1])}</td>;
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
