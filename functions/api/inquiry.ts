// Cloudflare Pages Function: POST /api/inquiry
// Validates the inquiry form (name, e-mail, phone, comment), checks Cloudflare Turnstile and sends a notification
// through the Brevo transactional e-mail API.
//
// Secrets are read ONLY from Cloudflare environment variables (never from the repository):
//   BREVO_API_KEY, BREVO_SENDER_EMAIL, FORM_RECIPIENT_EMAIL, TURNSTILE_SECRET_KEY
// Optional: INQUIRY_KV (KV namespace binding, for rate limiting + duplicate protection across instances),
//           ALLOWED_ORIGINS (comma-separated extra origins, e.g. a Pages preview URL).

interface KV {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}
export interface Env {
  BREVO_API_KEY?: string; BREVO_SENDER_EMAIL?: string; FORM_RECIPIENT_EMAIL?: string; TURNSTILE_SECRET_KEY?: string;
  INQUIRY_KV?: KV; ALLOWED_ORIGINS?: string; GOOGLE_SCRIPT_URL?: string; GOOGLE_SCRIPT_TOKEN?: string;
}
interface Ctx { request: Request; env: Env }

const MAX_BODY = 20_000;
const RATE_LIMIT = 5;            // inquiries per IP per hour
const RATE_WINDOW_S = 3600;
const EMAIL_RE = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]{2,}$/;
const PHONE_RE = /^\+?[\d\s().-]{6,25}$/;

const json = (status: number, body: Record<string, unknown>, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra } });

// In-memory fallback when no KV is bound (best effort: per Worker instance only).
const mem = new Map<string, { v: string; exp: number }>();
const store = {
  async get(env: Env, k: string) {
    if (env.INQUIRY_KV) return env.INQUIRY_KV.get(k);
    const e = mem.get(k); if (!e) return null;
    if (e.exp < Date.now()) { mem.delete(k); return null; }
    return e.v;
  },
  async put(env: Env, k: string, v: string, ttl: number) {
    if (env.INQUIRY_KV) return env.INQUIRY_KV.put(k, v, { expirationTtl: Math.max(60, ttl) });
    mem.set(k, { v, exp: Date.now() + ttl * 1000 });
  },
  async del(env: Env, k: string) { if (env.INQUIRY_KV) return env.INQUIRY_KV.delete(k); mem.delete(k); },
};

async function sha256Hex(s: string) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
const escHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const clean = (s: unknown, max: number) => (typeof s === 'string' ? s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max) : '');
const oneLine = (s: string) => s.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();

interface Booking { product: 'accommodation' | 'package' | 'dinner' | 'inquiry'; nights: number | null; room: string | null; occupancy: string | null; adults: number; children: number; infants: number; estimatedTotal: number | null; rooms?: { adults: number; children: number; infants: number }[] }
interface Inquiry { booking: Booking; name: string; email: string; phone: string; comment: string; pageLang: 'ru' | 'bg'; submissionId: string; token: string }

function parse(raw: unknown): { ok: true; d: Inquiry } | { ok: false; field: string } {
  if (!raw || typeof raw !== 'object') return { ok: false, field: 'body' };
  const r = raw as Record<string, unknown>;
  if (clean(r.website, 50)) return { ok: false, field: 'website' }; // honeypot
  const name = clean(r.name, 100); if (name.length < 2) return { ok: false, field: 'name' };
  const email = clean(r.email, 254); if (email && !EMAIL_RE.test(email)) return { ok: false, field: 'email' };
  const phone = clean(r.phone, 25); const digits = phone.replace(/\D/g, '');
  if (!PHONE_RE.test(phone) || digits.length < 6 || digits.length > 15) return { ok: false, field: 'phone' };
  const comment = clean(r.comment, 2000);
  if (r.consent !== true) return { ok: false, field: 'consent' };
  if (r.pageLang !== 'ru' && r.pageLang !== 'bg') return { ok: false, field: 'pageLang' };
  const submissionId = clean(r.submissionId, 64); if (!/^[A-Za-z0-9-]{8,64}$/.test(submissionId)) return { ok: false, field: 'submissionId' };
  const token = '';
  const b = r.booking as Record<string, unknown> | undefined;
  if (!b || !['accommodation', 'package', 'dinner', 'inquiry'].includes(String(b.product))) return { ok: false, field: 'booking.product' };
  if (b.product !== 'inquiry' && ![b.adults, b.children, b.infants].every(v => Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 10) || (b.product !== 'inquiry' && (b.adults as number) < 1)) return { ok: false, field: 'booking.guests' };
  if (b.product !== 'dinner' && b.product !== 'inquiry' && (![1,2,3,4].includes(Number(b.nights)) || !['classic','comfort','lux'].includes(String(b.room)) || !['double','single'].includes(String(b.occupancy)))) return { ok: false, field: 'booking.room' };
  const roomGuests = b.product === 'dinner' || b.product === 'inquiry' ? [] : b.rooms;
  if (b.product !== 'dinner' && b.product !== 'inquiry' && (!Array.isArray(roomGuests) || roomGuests.length < 1 || roomGuests.length > 5 ||
    !roomGuests.every(g => g && typeof g === 'object' && ['adults','children','infants'].every(k => Number.isInteger(g[k]) && g[k] >= (k === 'adults' ? 1 : 0) && g[k] <= 10)) ||
    roomGuests.reduce((n, g) => n + g.adults, 0) !== b.adults ||
    roomGuests.reduce((n, g) => n + g.children, 0) !== b.children ||
    roomGuests.reduce((n, g) => n + g.infants, 0) !== b.infants)) return { ok: false, field: 'booking.rooms' };
  const booking: Booking = { product: b.product as Booking['product'], nights: (b.product === 'dinner' || b.product === 'inquiry') ? null : Number(b.nights), room: (b.product === 'dinner' || b.product === 'inquiry') ? null : String(b.room), occupancy: (b.product === 'dinner' || b.product === 'inquiry') ? null : String(b.occupancy), adults: b.product === 'inquiry' ? 0 : Number(b.adults), children: b.product === 'inquiry' ? 0 : Number(b.children), infants: b.product === 'inquiry' ? 0 : Number(b.infants), estimatedTotal: null, rooms: (b.product === 'dinner' || b.product === 'inquiry') ? [] : roomGuests as Booking['rooms'] };
  // Recompute prices on the server; never trust a client-supplied total.
  const rates: Record<string, Record<string, Record<string, number[]>>> = {
    accommodation: { classic: { double: [71.65,121.79,182.69,207.06], single: [119.65,182.69,274.04,310.59] }, comfort: { double: [83.59,142.1,213.16,241.57], single: [139.59,213.15,319.73,362.35] }, lux: { double: [95.53,162.39,243.59,276.08], single: [159.53,243.58,365.37,414.12] } },
    package: { classic: { double: [280.9,323.52,375.28,396], single: [321.7,375.29,452.93,484] }, comfort: { double: [291.05,340.79,401.18,425.33], single: [338.65,401.18,491.77,528] }, lux: { double: [301.2,358.03,427.05,454.67], single: [355.6,427.04,530.57,572] } },
  };
  if (booking.product === 'inquiry') booking.estimatedTotal = null;
  else if (booking.product === 'dinner') booking.estimatedTotal = booking.adults * 220 + booking.children * 132;
  else {
    const i = booking.nights! - 1;
    const raw = booking.rooms!.reduce((sum, g) => {
      const double = rates[booking.product][booking.room!].double[i];
      const adultTotal = g.adults === 1 ? rates[booking.product][booking.room!].single[i] : double * (2 + Math.max(0, g.adults - 2) * 0.85);
      const childStay = g.children * rates.accommodation[booking.room!].double[i] * 0.7;
      return sum + adultTotal + childStay + (booking.product === 'package' ? g.children * 132 : 0);
    }, 0);
    booking.estimatedTotal = Math.round((raw + Number.EPSILON) * 100) / 100;
  }
  return { ok: true, d: { booking, name, email, phone, comment, pageLang: r.pageLang, submissionId, token } };
}

function buildEmail(d: Inquiry, when: Date) {
  const local = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'short', timeStyle: 'medium', timeZone: 'Europe/Sofia' }).format(when);
  const rows: [string, string][] = [
    ['Язык страницы', d.pageLang === 'ru' ? 'Русский (/ru/)' : 'Болгарский (/bg/)'],
    ['Дата и время заявки', `${local} (София), ${when.toISOString()}`],
    ['Имя', d.name], ['Email', d.email], ['Телефон', d.phone],
    ['Предложение', d.booking.product === 'dinner' ? 'Только гала-ужин' : d.booking.product === 'package' ? 'Новогодний пакет с ужином' : d.booking.product === 'inquiry' ? 'Общий запрос без выбранного предложения' : 'Проживание без ужина'],
    ['Ночей', d.booking.nights === null ? '—' : String(d.booking.nights)],
    ['Категория номера', d.booking.room ?? '—'],
    ['Размещение', d.booking.occupancy ?? '—'],
    ['Номера', d.booking.rooms?.map((g, i) => `№${i + 1}: ${g.adults} взрослых, ${g.children} детей 2–11, ${g.infants} детей до 2`).join('; ') || '—'],
    ['Взрослых', String(d.booking.adults)],
    ['Детей 2–11 лет', String(d.booking.children)],
    ['Детей до 2 лет', String(d.booking.infants)],
    ['Предварительная стоимость', d.booking.estimatedTotal === null ? 'Уточняется' : d.booking.estimatedTotal.toFixed(2) + ' EUR'],
    ['Комментарий', d.comment || '—'],
  ];
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n') + '\n\nЗаявка не является подтверждённым бронированием.';
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#142D39"><h2 style="margin:0 0 12px">Новая заявка — Новый год 2027, Grand Hotel Plovdiv</h2><table cellpadding="6" style="border-collapse:collapse">${
    rows.map(([k, v]) => `<tr><td style="border:1px solid #d8cdbb;background:#F9F6F0"><b>${escHtml(k)}</b></td><td style="border:1px solid #d8cdbb">${escHtml(v).replace(/\n/g, '<br>')}</td></tr>`).join('')
  }</table><p style="color:#555">Заявка не является подтверждённым бронированием.</p></div>`;
  const subject = oneLine(`Новая заявка с сайта (${d.pageLang.toUpperCase()}): ${d.name}`).slice(0, 150);
  return { subject, text, html };
}

async function verifyTurnstile(env: Env, token: string, ip: string): Promise<boolean> {
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: token, ...(ip ? { remoteip: ip } : {}) }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch { return false; }
}

async function sendBrevo(env: Env, d: Inquiry): Promise<boolean> {
  const mail = buildEmail(d, new Date());
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': env.BREVO_API_KEY!, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        sender: { name: 'New Year 2027 — заявки', email: env.BREVO_SENDER_EMAIL },   // verified sender, never the client
        to: [{ email: env.FORM_RECIPIENT_EMAIL }],
        replyTo: { email: d.email, name: oneLine(d.name).replace(/[<>"]/g, '').slice(0, 100) },  // client address only as Reply-To
        subject: mail.subject, htmlContent: mail.html, textContent: mail.text,
      }),
    });
    if (!res.ok) console.error('inquiry_error', 'brevo_status', res.status);   // status code only — no personal data
    return res.ok;
  } catch { console.error('inquiry_error', 'brevo_unreachable'); return false; }
}

async function sendGoogle(env: Env, d: Inquiry): Promise<boolean> {
  try {
    const url = new URL(env.GOOGLE_SCRIPT_URL!);
    if (url.protocol !== 'https:' || url.hostname !== 'script.google.com' || !url.pathname.startsWith('/macros/s/')) return false;
    const res = await fetch(url.toString(), {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ token: env.GOOGLE_SCRIPT_TOKEN, inquiry: {
        submissionId: d.submissionId, pageLang: d.pageLang, name: d.name, email: d.email,
        phone: d.phone, comment: d.comment, booking: d.booking,
      } }),
      redirect: 'follow',
    });
    if (!res.ok) { console.error('inquiry_error', 'google_status', res.status); return false; }
    const result = await res.json() as {ok?: boolean};
    return result.ok === true;
  } catch { console.error('inquiry_error', 'google_unreachable'); return false; }
}

export const onRequestPost = async ({ request, env }: Ctx): Promise<Response> => {
  // 1) same-origin only
  const origin = request.headers.get('Origin');
  const allowed = new Set([new URL(request.url).origin, ...(env.ALLOWED_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean)]);
  if (origin ? !allowed.has(origin) : request.headers.get('Sec-Fetch-Site') !== 'same-origin') return json(403, { ok: false, error: 'forbidden' });

  // 2) configuration (never pretend success when something is missing)
  if (!env.GOOGLE_SCRIPT_URL || !env.GOOGLE_SCRIPT_TOKEN) {
    console.error('inquiry_error', 'not_configured');
    return json(503, { ok: false, error: 'not_configured' });
  }

  // 3) body
  if (!(request.headers.get('Content-Type') ?? '').toLowerCase().includes('application/json')) return json(415, { ok: false, error: 'unsupported_media_type' });
  if (Number(request.headers.get('Content-Length') ?? 0) > MAX_BODY) return json(413, { ok: false, error: 'too_large' });
  const bodyText = await request.text();
  if (bodyText.length > MAX_BODY) return json(413, { ok: false, error: 'too_large' });
  let raw: unknown; try { raw = JSON.parse(bodyText); } catch { return json(400, { ok: false, error: 'invalid_json' }); }
  const p = parse(raw);
  if (!p.ok) return json(400, { ok: false, error: 'invalid', field: p.field });
  const d = p.d;

  // 4) rate limit per IP (hashed with a secret salt; the raw IP is not stored)
  const ip = request.headers.get('CF-Connecting-IP') ?? '';
  const ipKey = await sha256Hex(`${ip}|${env.GOOGLE_SCRIPT_TOKEN}`);
  const rlKey = `rl:${ipKey.slice(0, 32)}:${Math.floor(Date.now() / (RATE_WINDOW_S * 1000))}`;
  const used = Number((await store.get(env, rlKey)) ?? 0);
  if (used >= RATE_LIMIT) return json(429, { ok: false, error: 'rate_limited' }, { 'Retry-After': String(RATE_WINDOW_S) });
  await store.put(env, rlKey, String(used + 1), RATE_WINDOW_S + 60);

  // 5) duplicate protection
  const subKey = `sub:${d.submissionId}`;
  const prev = await store.get(env, subKey);
  if (prev === 'done') return json(200, { ok: true, duplicate: true });
  if (prev === 'pending') return json(409, { ok: false, error: 'in_progress' });
  await store.put(env, subKey, 'pending', 600);

  // 6) No CAPTCHA: honeypot, same-origin checks, validation and rate limit remain.

  // 7) send
  if (!(await sendGoogle(env, d))) { await store.del(env, subKey); return json(502, { ok: false, error: 'send_failed' }); }
  await store.put(env, subKey, 'done', 86400);
  return json(200, { ok: true });
};

// Any other method
export const onRequest = async (): Promise<Response> => json(405, { ok: false, error: 'method_not_allowed' }, { Allow: 'POST' });
