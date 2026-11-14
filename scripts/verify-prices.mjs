// Cross-checks src/data/prices.ts against the numbers printed in official_offer_2027.pdf.
// Usage: node scripts/verify-prices.mjs path/to/official_offer_2027.pdf   (needs `pdftotext` from poppler)
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const pdf = process.argv[2];
if (!pdf) { console.error('usage: node scripts/verify-prices.mjs <pdf>'); process.exit(2); }
const text = execFileSync('pdftotext', ['-layout', pdf, '-'], { encoding: 'utf8' });
const pages = text.split('\f');
const src = readFileSync('src/data/prices.ts', 'utf8');
const grab = (block) => {
  const m = src.match(new RegExp(block + ': \\{([\\s\\S]*?)\\n  \\},'))[1];
  return [...m.matchAll(/(classic|comfort|lux): \{ double: \[([^\]]+)\], single: \[([^\]]+)\] \}/g)]
    .map(([, r, d, s]) => [r, d.split(',').map(Number), s.split(',').map(Number)]);
};
const euro = (s) => [...s.matchAll(/(\d{1,3}),(\d{2}) €/g)].map((m) => Number(m[1] + '.' + m[2]));
const check = (name, page, table) => {
  const nums = euro(page).filter((n) => n !== 220 && n !== 132 && n !== 0);
  const rows = []; // PDF reading order: per night -> [dClassic,sClassic,dComfort,sComfort,dLux,sLux]
  const fromPdf = nums.slice(0, 24);
  for (let n = 0; n < 4; n++) rows.push(fromPdf.slice(n * 6, n * 6 + 6));
  let bad = 0;
  for (let n = 0; n < 4; n++) {
    const code = [];
    for (const [, d, s] of table) code.push(d[n], s[n]);
    code.forEach((v, i) => { if (v !== rows[n][i]) { bad++; console.log(`  MISMATCH ${name} night ${n + 1} col ${i}: code=${v} pdf=${rows[n][i]}`); } });
  }
  console.log(`${name}: ${24 - bad}/24 cells match`);
  return bad;
};
const pkgPage = pages.find((p) => p.includes('Новогодишен пакет') && p.includes('280,90'));
const accPage = pages.find((p) => p.includes('Настаняване') && p.includes('71,65'));
const bad = check('package', pkgPage, grab('package')) + check('accommodation', accPage, grab('accommodation'));
console.log('dinner 220,00 / child 132,00 present in PDF:', text.includes('220,00 €') && text.includes('132,00 €'));
process.exit(bad ? 1 : 0);
