import { useState } from 'react';
import { useSite } from '../context';
import { eur, NIGHTS, PRICES, ROOMS, type Nights, type ProductId, type RoomId } from '../data/prices';

/**
 * Draft family inquiry calculator. Not mounted on the published site yet.
 * One room per inquiry; child/extra-bed occupancy must be confirmed by the hotel.
 */
export function FamilyInquiryCalculator() {
  const { lang } = useSite();
  const bg = lang === 'bg';
  const [product, setProduct] = useState<ProductId | 'dinner'>('package');
  const [nights, setNights] = useState<Nights>(1);
  const [room, setRoom] = useState<RoomId>('classic');
  const [adults, setAdults] = useState(2);
  const [underTwo, setUnderTwo] = useState(0);
  const [children, setChildren] = useState(0);

  // One or two adults only have an unambiguous tariff in the published price tables.
  // Never quote a family/extra-bed price without confirmed occupancy conditions.
  const hotelPrice = adults === 1 && children === 0 && underTwo === 0
    ? PRICES[product === 'dinner' ? 'package' : product][room].single[nights - 1]
    : adults === 2 && children === 0 && underTwo === 0
      ? 2 * PRICES[product === 'dinner' ? 'package' : product][room].double[nights - 1]
      : null;
  const total = product === 'dinner' ? adults * 220 + children * 132 : hotelPrice;
  const needsConfirmation = product !== 'dinner' && total === null;
  const label = (ru: string, bulgarian: string) => bg ? bulgarian : ru;

  return (
    <div className="calc" aria-label={label('Калькулятор заявки', 'Калкулатор за запитване')}>
      <div className="calc__controls">
        <h3>{label('Рассчитайте стоимость', 'Изчислете цената')}</h3>
        <fieldset>
          <legend>{label('Предложение', 'Оферта')}</legend>
          <div className="seg seg--wide">
            <button type="button" aria-pressed={product === 'accommodation'} onClick={() => setProduct('accommodation')}>{label('Проживание', 'Нощувки')}</button>
            <button type="button" aria-pressed={product === 'package'} onClick={() => setProduct('package')}>{label('Пакет с ужином', 'Пакет с вечеря')}</button>
            <button type="button" aria-pressed={product === 'dinner'} onClick={() => setProduct('dinner')}>{label('Только ужин', 'Само вечеря')}</button>
          </div>
        </fieldset>
        {product !== 'dinner' && <>
          <fieldset>
            <legend>{label('Ночей', 'Нощувки')}</legend>
            <div className="seg">{NIGHTS.map(n => <button key={n} type="button" aria-pressed={nights === n} onClick={() => setNights(n)}>{n}</button>)}</div>
          </fieldset>
          <fieldset>
            <legend>{label('Категория номера', 'Категория стая')}</legend>
            <div className="seg">{ROOMS.map(r => <button key={r} type="button" aria-pressed={room === r} onClick={() => setRoom(r)}>{r === 'lux' ? 'Lux' : r === 'classic' ? 'Classic' : 'Comfort'}</button>)}</div>
          </fieldset>
        </>}
        <fieldset>
          <legend>{label('Гости', 'Гости')}</legend>
          {([
            [label('Взрослые (12+)', 'Възрастни (12+)'), adults, setAdults, 1],
            [label('Дети до 2 лет', 'Деца под 2 г.'), underTwo, setUnderTwo, 0],
            [label('Дети от 2 до 11 лет', 'Деца от 2 до 11 г.'), children, setChildren, 0],
          ] as const).map(([name, count, setter, min]) => (
            <div key={name} className="row2">
              <span>{name}</span>
              <div className="seg">
                <button type="button" disabled={count <= min} onClick={() => setter(count - 1)} aria-label={name + ' −'}>−</button>
                <output>{count}</output>
                <button type="button" disabled={count >= 10} onClick={() => setter(count + 1)} aria-label={name + ' +'}>+</button>
              </div>
            </div>
          ))}
        </fieldset>
      </div>
      <div className="calc__result" role="status" aria-live="polite">
        <h3>{label('Предварительная стоимость', 'Ориентировъчна цена')}</h3>
        <strong className="calc__price">{needsConfirmation ? label('Уточняется', 'Подлежи на уточнение') : eur(total!)}</strong>
        <p className="note">{needsConfirmation
          ? label('Размещение детей и дополнительные места подтверждаются отдельно.', 'Настаняването на деца и допълнителните легла се потвърждават отделно.')
          : label('Заявка не подтверждает наличие мест и не является бронированием.', 'Запитването не потвърждава наличност и не представлява резервация.')}</p>
      </div>
    </div>
  );
}
