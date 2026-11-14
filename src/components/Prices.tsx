import { useState } from 'react';
import { useSite, useCalc } from '../context';
import { eur, NIGHTS, OCCS, PRICES, ROOMS, type ProductId, type RoomId } from '../data/prices';

const ROOM_LABEL: Record<RoomId, string> = { classic: 'Classic', comfort: 'Comfort', lux: 'Lux' };

export function Offers() {
  const { t } = useSite();
  const c = useCalc();
  const o = t.offers;
  const [open, setOpen] = useState(false);
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
            const sel = c.product === p;
            return (
              <article key={p} className={`offer offer--${p}` + (sel ? ' is-selected' : '')}>
                <h3>{copy.title}</h3>
                <p className="offer__price">{copy.price}</p>
                <p className="offer__per">{copy.per}</p>
                <p className={'banner ' + (p === 'package' ? 'banner--yes' : 'banner--no')}>{copy.flag}</p>
                <p className="offer__desc">{copy.desc}</p>
                <button type="button" className="btn btn--outline" aria-pressed={sel} onClick={() => c.setProduct(p)}>{sel ? o.picked : o.pick}</button>
              </article>
            );
          })}
          <article className="offer offer--dinner">
            <h3>{o.C.title}</h3>
            <p className="offer__price">{o.C.price}</p>
            <p className="offer__per">{o.C.per}</p>
            <p className="offer__desc">{o.C.desc}</p>
            <a className="btn btn--outline" href="#dinner">{o.C.link}</a>
          </article>
        </div>

        <Calculator open={open} onToggle={() => setOpen(!open)} />
        <AllPrices open={open} />
      </div>
    </section>
  );
}

function Calculator({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const { t } = useSite();
  const c = useCalc();
  const k = t.calc;
  const product = c.product;
  const price = PRICES[product][c.room][c.occ][c.nights - 1];
  const incl = product === 'accommodation' ? k.includesA : k.includesB;
  const occLabel = c.occ === 'double' ? k.occDouble : k.occSingle;
  return (
    <div className={'calc calc--' + product} aria-labelledby="calc-h">
      <div className="calc__controls">
        <h3 id="calc-h">{k.title}</h3>
        <fieldset>
          <legend>{k.product}</legend>
          <div className="seg seg--wide">
            <button type="button" aria-pressed={product === 'accommodation'} onClick={() => c.setProduct('accommodation')}>{t.offers.A.title}</button>
            <button type="button" aria-pressed={product === 'package'} onClick={() => c.setProduct('package')}>{t.offers.B.title}</button>
          </div>
        </fieldset>
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
          <div className="seg seg--wide">{OCCS.map((o) => <button key={o} type="button" aria-pressed={c.occ === o} onClick={() => c.setOcc(o)}>{o === 'double' ? k.occDouble : k.occSingle}</button>)}</div>
        </fieldset>
      </div>

      <div className="calc__result">
        <div role="status" aria-live="polite">
          <span className="calc__ctx">{k.resultLabel}: {c.nights} {k.nightsWord(c.nights)}, {ROOM_LABEL[c.room]}, {occLabel}</span>
          <strong className="calc__price" data-testid="price">{eur(price)}</strong>
          <span className="calc__per">{c.occ === 'double' ? k.perPerson : k.perSingle}</span>
          <p className={'banner ' + (product === 'package' ? 'banner--yes' : 'banner--no')}>{product === 'package' ? k.flagB : k.flagA}</p>
        </div>
        <h4>{k.includes}</h4>
        <ul className="ticks ticks--dark">{incl.map((x) => <li key={x}>{x}</li>)}</ul>
        {product === 'accommodation' && <p className="note">{k.moreA}</p>}
        <div className="calc__btns">
          <button type="button" className="btn btn--lg btn--toggle" aria-expanded={open} aria-controls="all-prices" onClick={onToggle}>
            {k.showAll}<span className="chev" aria-hidden="true" />
          </button>
          <a className="btn btn--outline" href="#apply">{k.request}</a>
        </div>
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
