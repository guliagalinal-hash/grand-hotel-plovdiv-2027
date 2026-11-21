import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useSite, useCalc } from '../context';
import { eur, totalPrice } from '../data/prices';
import { PRICES } from '../data/prices';
import { config } from '../config';
import { trackEvent } from '../analytics';

interface Values { name: string; email: string; phone: string; comment: string; consent: boolean; website: string }
type Errors = Partial<Record<keyof Values | 'turnstile', string>>;
type Status = 'idle' | 'sending' | 'ok' | 'fail' | 'limit';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const isPhone = (v: string) => /^\+?[\d\s().-]+$/.test(v) && v.replace(/\D/g, '').length >= 6 && v.replace(/\D/g, '').length <= 15;

interface TurnstileApi { render: (el: HTMLElement, o: Record<string, unknown>) => string; reset: (id?: string) => void }
declare global { interface Window { turnstile?: TurnstileApi } }

export function LeadForm() {
  const { t, lang } = useSite();
  const c = useCalc();
  const f = t.form;
  const bg = lang === 'bg';
  const label = (ru: string, bulgarian: string) => bg ? bulgarian : ru;
  const guests = c.rooms.reduce((a, g) => ({ adults: a.adults + g.adults, children: a.children + g.children, infants: a.infants + g.infants }), { adults: 0, children: 0, infants: 0 });
  const calculatedTotal = totalPrice(c.product, c.room, c.nights, c.rooms, c.dinnerOnly);
  const placementNeedsCheck = !c.dinnerOnly && c.rooms.some(g => g.adults > 2);
  const offerName = c.dinnerOnly ? label('Только гала-ужин', 'Само гала вечеря') : c.product === 'package' ? label('Проживание с гала-ужином', 'Нощувки с гала вечеря') : label('Проживание без гала-ужина', 'Нощувки без гала вечеря');
  const [isOpen, setIsOpen] = useState(false);
  const [fromCalculator, setFromCalculator] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const [v, setV] = useState<Values>({ name: '', email: '', phone: '', comment: '', consent: false, website: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>('idle');
  const [token, setToken] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const tsBox = useRef<HTMLDivElement>(null);
  const tsId = useRef<string | undefined>(undefined);
  const submissionId = useRef('');
  const siteKey = config.turnstileSiteKey;
  const set = <K extends keyof Values>(k: K, val: Values[K]) => setV((p) => ({ ...p, [k]: val }));

  useEffect(() => {
    const open = (e: Event) => {
      openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setFromCalculator(e.type === 'open-calculator-inquiry');
      setIsOpen(true);
      trackEvent('inquiry_form_open', { source: e.type === 'open-calculator-inquiry' ? 'calculator' : 'general' });
    };
    window.addEventListener('open-inquiry', open);
    window.addEventListener('open-calculator-inquiry', open);
    return () => { window.removeEventListener('open-inquiry', open); window.removeEventListener('open-calculator-inquiry', open); };
  }, []);
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
      if (e.key !== 'Tab') return;
      const nodes = Array.from(document.querySelectorAll<HTMLElement>('.inquiry-dialog button:not([disabled]), .inquiry-dialog input:not([disabled]), .inquiry-dialog a[href]')).filter(x => x.offsetParent !== null);
      if (!nodes.length) return;
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = previous; document.removeEventListener('keydown', onKey); openerRef.current?.focus(); };
  }, [isOpen]);

  // Cloudflare Turnstile (optional; not required for inquiry submission)
  useEffect(() => {
    if (!siteKey || !tsBox.current) return;
    const render = () => {
      if (!window.turnstile || !tsBox.current || tsId.current) return;
      tsId.current = window.turnstile.render(tsBox.current, {
        sitekey: siteKey, language: lang, callback: (tk: string) => setToken(tk),
        'expired-callback': () => setToken(''), 'error-callback': () => setToken(''),
      });
    };
    if (window.turnstile) render();
    else {
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.async = true; s.defer = true; s.onload = render;
      document.head.appendChild(s);
    }
  }, [siteKey, lang]);

  function validate(): Errors {
    const e: Errors = {};
    if (!v.name.trim()) e.name = f.errRequired;
    if (v.email.trim() && !EMAIL.test(v.email.trim())) e.email = f.errEmail;
    if (!v.phone.trim()) e.phone = f.errRequired; else if (!isPhone(v.phone.trim())) e.phone = f.errPhone;
    if (!v.consent) e.consent = f.errConsent;

    return e;
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (v.website) return; // honeypot: bots only
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      setStatus('idle');
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    // Submit to the configured Cloudflare Function; only its confirmed success counts.

    if (!submissionId.current) submissionId.current = crypto.randomUUID();
    setStatus('sending');
    try {
      const estimatedTotal = placementNeedsCheck ? null : Math.round(calculatedTotal * 100) / 100;
      const payload = {
        booking: !fromCalculator ? { product: 'inquiry', nights: null, room: null, occupancy: null, rooms: [], adults: 0, children: 0, infants: 0, estimatedTotal: null } : { product: c.dinnerOnly ? 'dinner' : c.product, nights: c.dinnerOnly ? null : c.nights, room: c.dinnerOnly ? null : c.room, occupancy: c.dinnerOnly ? null : (c.rooms.length === 1 && c.rooms[0].adults === 1 ? 'single' : 'double'), rooms: c.dinnerOnly ? [] : c.rooms, adults: guests.adults, children: guests.children, infants: guests.infants, estimatedTotal },
        name: v.name.trim(), email: v.email.trim(), phone: v.phone.trim(), comment: v.comment.trim(),
        consent: true, pageLang: lang, submissionId: submissionId.current, turnstileToken: token, website: v.website,
      };
      const res = await fetch(config.formEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => null) as { ok?: boolean } | null;
      if (res.ok && data?.ok === true) {
        trackEvent('inquiry_submit_success', { offer_type: !fromCalculator ? 'general' : c.dinnerOnly ? 'dinner' : c.product });
        setStatus('ok'); return;
      }
      setStatus(res.status === 429 ? 'limit' : 'fail');
    } catch { setStatus('fail'); }
    // Turnstile tokens are single-use: ask for a fresh one before a retry.
    setToken(''); if (tsId.current) window.turnstile?.reset(tsId.current);
  }

  const common = (k: keyof Values) => ({ 'aria-invalid': errors[k] ? true : undefined, 'aria-describedby': errors[k] ? `err-${k}` : undefined });
  const Err = ({ k }: { k: keyof Errors }) => (errors[k] ? <span className="err" id={`err-${k}`}>{errors[k]}</span> : null);

  if (!isOpen) return null;
  return (
    <div className="inquiry-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}>
    <section className="sec sec--dark inquiry-dialog" id="apply" role="dialog" aria-modal="true" aria-label={f.title}>
      <button ref={closeRef} type="button" className="inquiry-close" aria-label={bg ? 'Затвори' : 'Закрыть'} onClick={() => setIsOpen(false)}>×</button>
      <div className="wrap apply">
        <div>
          <h2>{f.title}</h2>
          <p className="lead">{f.lead}</p>
          
        </div>
        <form ref={formRef} onSubmit={onSubmit} noValidate>
          {fromCalculator && <div className="booking-summary" aria-live="polite">
            <h3>{label('Ваш выбор', 'Вашият избор')}</h3>
            <p><strong>{offerName}</strong></p>
            {!c.dinnerOnly && <p>{c.nights} {label('ноч.', 'нощ.')}, {c.room === 'classic' ? 'Classic' : c.room === 'comfort' ? 'Comfort' : 'Lux'}, {c.rooms.length} {label('ном.', 'стаи')}</p>}
            <p>{label('Взрослые', 'Възрастни')}: {guests.adults} · {label('Дети 2–11 лет', 'Деца 2–11 г.')}: {guests.children} · {label('Дети до 2 лет', 'Деца под 2 г.')}: {guests.infants}</p>
            {!c.dinnerOnly && c.rooms.length > 1 && <p>{c.rooms.map((g, i) => `${label('Номер', 'Стая')} ${i + 1}: ${g.adults} + ${g.children} + ${g.infants}`).join(' · ')}</p>}
            <strong className="booking-summary__price">{eur(calculatedTotal)}</strong>
            {placementNeedsCheck && <p className="booking-summary__note">{label('Предварительная сумма. Условия размещения и доплата за дополнительные места подтверждаются отелем.', 'Предварителна сума. Настаняването и доплащането за допълнителни легла се потвърждават от хотела.')}</p>}
            <a className="booking-summary__edit" href="#offer-calculator" onClick={() => setIsOpen(false)}>{label('Изменить параметры расчёта', 'Промени параметрите на изчислението')}</a>
          </div>}
          {Object.keys(errors).length > 0 && <p className="err err--sum" role="alert">{f.errSummary}</p>}
          <label className="field">{f.name}
            <input type="text" autoComplete="name" value={v.name} onChange={(e) => set('name', e.target.value)} {...common('name')} /><Err k="name" />
          </label>
          <div className="row2">
            <label className="field">{f.email} <small>({f.commentOpt})</small>
              <input type="email" autoComplete="email" value={v.email} onChange={(e) => set('email', e.target.value)} {...common('email')} /><Err k="email" />
            </label>
            <label className="field">{f.phone}
              <input type="tel" autoComplete="tel" value={v.phone} onChange={(e) => set('phone', e.target.value)} {...common('phone')} /><Err k="phone" />
            </label>
          </div>
          
          <label className="hp" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={v.website} onChange={(e) => set('website', e.target.value)} /></label>
          <label className="check">
            <input type="checkbox" checked={v.consent} onChange={(e) => set('consent', e.target.checked)} {...common('consent')} />
            <span>{f.consent}{' '}
              {config.seller.privacyUrl && <a href={config.seller.privacyUrl} target="_blank" rel="noopener noreferrer">{f.privacy}</a>}
            </span>
          </label>
          <Err k="consent" />
          {siteKey && <div ref={tsBox} className="turnstile" />}
          <Err k="turnstile" />
          <button className="btn btn--lg btn--block" type="submit" disabled={status === 'sending' || status === 'ok'}>{status === 'sending' ? f.sending : f.submit}</button>
          <div className="status" role="status" aria-live="polite">
            {status === 'ok' && <p className="msg msg--ok">{f.sentOk}</p>}
            {status === 'fail' && <p className="msg msg--warn">{f.sentFail}</p>}
            {status === 'limit' && <p className="msg msg--warn">{f.sentLimit}</p>}
          </div>
        </form>
      </div>
    </section>
    </div>
  );
}
