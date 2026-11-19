// Non-PII analytics events shared by RU and BG landing pages.
// Google tag is installed in index.html; no client IDs or customer contact data are sent.
type AnalyticsParams = Record<string, string | number | boolean>;
declare global {
  interface Window { dataLayer?: unknown[] }
}
export function trackEvent(name: string, params: AnalyticsParams = {}): void {
  if (typeof window === 'undefined') return;
  const language = document.documentElement.lang === 'bg' ? 'bg' : 'ru';
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, page_language: language, ...params });
}

// Capture intent to contact; opening an external app does not prove a completed call or email.
// The current "Viber" labels link to tel: on the site: they are phone intents, NOT Viber events.
export function installContactTracking(): () => void {
  function onClick(event: MouseEvent) {
    const node = event.target;
    if (!(node instanceof Element)) return;
    const anchor = node.closest('a[href]');
    if (!(anchor instanceof HTMLAnchorElement)) return;
    const href = anchor.getAttribute('href') || '';
    if (href.startsWith('tel:')) trackEvent('contact_phone_click', { contact_channel: 'phone' });
    else if (href.startsWith('mailto:')) trackEvent('contact_email_click', { contact_channel: 'email' });
    else if (href.startsWith('viber:') || href.startsWith('viber://')) trackEvent('contact_viber_click', { contact_channel: 'viber' });
    else if (href === '#offer-calculator') trackEvent('offer_calculator_click');
    else if (href === '#apply') trackEvent('inquiry_section_click');
  }
  document.addEventListener('click', onClick);
  return () => document.removeEventListener('click', onClick);
}
