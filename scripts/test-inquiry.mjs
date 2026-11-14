// Offline tests for functions/api/inquiry.ts with mocked Turnstile and Brevo (nothing is ever sent).
// Usage: npm run test:inquiry
import * as esbuild from 'esbuild';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

await esbuild.build({ entryPoints: ['functions/api/inquiry.ts'], bundle: true, format: 'esm', platform: 'neutral', outfile: '.build/inquiry.mjs', logLevel: 'error' });
const fn = await import(pathToFileURL(process.cwd() + '/.build/inquiry.mjs').href);

const ENV = { BREVO_API_KEY: 'test-brevo-key', BREVO_SENDER_EMAIL: 'sender@example.test', FORM_RECIPIENT_EMAIL: 'inbox@example.test', TURNSTILE_SECRET_KEY: 'test-secret' };
let calls = [], tsOk = true, brevoStatus = 201;
globalThis.fetch = async (url, init) => {
  calls.push({ url: String(url), init });
  if (String(url).includes('turnstile')) return new Response(JSON.stringify({ success: tsOk }), { status: 200 });
  if (String(url).includes('brevo')) return new Response('{}', { status: brevoStatus });
  throw new Error('unexpected fetch ' + url);
};
const logs = []; for (const k of ['log', 'error', 'warn', 'info']) console[k] = (...a) => logs.push(a.join(' '));

let ipN = 0;
const body = (o = {}) => ({ name: 'Ivan Petrov', email: 'ivan@example.com', phone: '+359 88 123 4567', comment: 'Hello', consent: true, pageLang: 'ru',
  submissionId: 'sub-' + Math.random().toString(36).slice(2) + '-xx', turnstileToken: 'tok', website: '', ...o });
const post = (b, { env = ENV, ip = '10.0.0.' + ++ipN, origin = 'https://site.test', headers = {} } = {}) =>
  fn.onRequestPost({ env: { ...env }, request: new Request('https://site.test/api/inquiry', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin, 'CF-Connecting-IP': ip, ...headers }, body: typeof b === 'string' ? b : JSON.stringify(b) }) });
const brevoCalls = () => calls.filter((c) => c.url.includes('brevo'));
let passed = 0; const ok = (name) => { passed++; process.stdout.write(`  ✓ ${name}\n`); };
const reset = () => { calls = []; tsOk = true; brevoStatus = 201; };

reset(); assert.equal((await fn.onRequest()).status, 405); ok('non-POST → 405');
reset(); assert.equal((await post(body(), { origin: 'https://evil.test' })).status, 403); ok('foreign Origin → 403');
reset(); { const r = await post(body(), { env: { ...ENV, BREVO_API_KEY: undefined } }); assert.equal(r.status, 503); assert.equal(calls.length, 0); } ok('missing env → 503, nothing sent');
reset(); assert.equal((await post(body(), { env: { ...ENV, TURNSTILE_SECRET_KEY: '' } })).status, 503); ok('missing Turnstile secret → 503');

for (const [label, b, field] of [
  ['bad JSON', '{oops', undefined], ['bad email', body({ email: 'not-an-email' }), 'email'], ['short name', body({ name: 'A' }), 'name'],
  ['no consent', body({ consent: false }), 'consent'], ['bad phone', body({ phone: 'abc' }), 'phone'], ['empty phone (required)', body({ phone: '' }), 'phone'],
  ['too short phone', body({ phone: '123' }), 'phone'], ['bad lang', body({ pageLang: 'en' }), 'pageLang'], ['no token', body({ turnstileToken: '' }), 'turnstileToken'],
  ['honeypot', body({ website: 'http://spam' }), 'website'], ['bad submissionId', body({ submissionId: 'x' }), 'submissionId'],
]) { reset(); const r = await post(b); assert.equal(r.status, 400, label); if (field) assert.equal((await r.json()).field, field, label); assert.equal(calls.length, 0, label + ' must not call external APIs'); }
ok('11 invalid inputs → 400, no external call');
reset(); assert.equal((await post(body({ comment: '' }))).status, 200); ok('comment is optional');
reset(); assert.equal((await post('x'.repeat(21000))).status, 413); ok('oversized body → 413');
reset(); assert.equal((await post(JSON.stringify(body()), { headers: { 'Content-Type': 'text/plain' } })).status, 415); ok('wrong content type → 415');

reset(); tsOk = false; { const r = await post(body()); assert.equal(r.status, 403); assert.equal(brevoCalls().length, 0); } ok('Turnstile failure → 403, no e-mail');
reset(); {
  const r = await post(body({ name: '<script>alert(1)</script> Ivan\r\nBcc: x@y.z', comment: '<b>hi</b>', offer: 'package', price: '1 €' }));
  assert.equal(r.status, 200); assert.deepEqual(await r.json(), { ok: true });
  const b = brevoCalls(); assert.equal(b.length, 1);
  const sent = JSON.parse(b[0].init.body);
  assert.equal(b[0].init.headers['api-key'], 'test-brevo-key');
  assert.equal(sent.sender.email, 'sender@example.test'); assert.equal(sent.to[0].email, 'inbox@example.test'); assert.equal(sent.replyTo.email, 'ivan@example.com');
  assert.ok(!/[\r\n]/.test(sent.subject), 'subject has no line breaks');
  assert.ok(sent.htmlContent.includes('&lt;script&gt;') && !sent.htmlContent.includes('<script>'), 'html escaped');
  assert.ok(sent.htmlContent.includes('&lt;b&gt;hi&lt;/b&gt;'));
  for (const must of ['Русский', 'Дата и время', 'Ivan', 'ivan@example.com', '+359 88 123 4567', '<b>hi</b>']) assert.ok(sent.textContent.includes(must), 'email contains ' + must);
  assert.ok(!sent.textContent.includes('Рассчитанная цена') && !sent.textContent.includes('1 €'), 'no price data accepted from the browser');
} ok('success: Brevo payload, sender/recipient/Reply-To, escaping, only the 4 fields used');
reset(); { const r = await post(body({ pageLang: 'bg' })); assert.equal(r.status, 200); assert.ok(JSON.parse(brevoCalls()[0].init.body).textContent.includes('Болгарский (/bg/)')); } ok('BG page language is reported in the e-mail');

reset(); { const id = 'dup-0001-aaaa'; assert.equal((await post(body({ submissionId: id }), { ip: '9.9.9.9' })).status, 200); const r2 = await post(body({ submissionId: id }), { ip: '9.9.9.8' }); assert.equal(r2.status, 200); assert.equal((await r2.json()).duplicate, true); assert.equal(brevoCalls().length, 1); } ok('duplicate submissionId → one e-mail only');
reset(); { const ip = '7.7.7.7'; const codes = []; for (let i = 0; i < 7; i++) codes.push((await post(body(), { ip })).status); assert.deepEqual(codes, [200, 200, 200, 200, 200, 429, 429]); } ok('rate limit: 5/hour per IP, then 429');
reset(); brevoStatus = 500; { const id = 'fail-0001-bbbb'; const r = await post(body({ submissionId: id })); assert.equal(r.status, 502); brevoStatus = 201; assert.equal((await post(body({ submissionId: id }))).status, 200); } ok('Brevo error → 502, retry with same id allowed');

assert.ok(!logs.some((l) => /ivan|petrov|example\.com|\+359|Hello|<b>/i.test(l)), 'logs: ' + logs.join(' | ')); ok('logs contain no personal data (' + logs.length + ' log lines)');
process.stdout.write(`\n${passed} test groups passed\n`);
