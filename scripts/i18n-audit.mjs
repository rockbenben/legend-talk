// R2 audit: key parity across all languages vs en + interpolation placeholder consistency.
import fs from 'node:fs';

const langs = ['en','zh','zh-Hant','ja','ko','es','pt','fr','de','it','ru','ar','tr','hi','id','vi','th','bn'];
const load = (l) => JSON.parse(fs.readFileSync(`src/i18n/${l}.json`, 'utf8'));
const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) =>
  typeof v === 'object' && !Array.isArray(v) ? flat(v, p + k + '.') : [[p + k, v]]);

// Plural-suffix keys (_one/_few/_many/…) are language-specific by design —
// CLDR plural categories differ per language, so they're excluded from parity.
const isPlural = (k) => /_(zero|one|two|few|many|other)$/.test(k);
const en = Object.fromEntries(flat(load('en')).filter(([k]) => !isPlural(k)));
const enKeys = new Set(Object.keys(en));
const ph = (s) => typeof s === 'string' ? [...s.matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1]).sort().join(',') : '';

let issues = 0;
for (const l of langs.slice(1)) {
  const j = Object.fromEntries(flat(load(l)).filter(([k]) => !isPlural(k)));
  const keys = new Set(Object.keys(j));
  const missing = [...enKeys].filter(k => !keys.has(k));
  const extra = [...keys].filter(k => !enKeys.has(k));
  const phMismatch = [...enKeys].filter(k => keys.has(k) && ph(en[k]) !== ph(j[k]) && typeof en[k] === 'string');
  if (missing.length || extra.length || phMismatch.length) {
    issues++;
    console.log(`== ${l} ==`);
    if (missing.length) console.log('  missing:', missing.length <= 12 ? missing.join(', ') : missing.length + ' keys: ' + missing.slice(0, 12).join(', ') + ' …');
    if (extra.length) console.log('  extra:', extra.slice(0, 12).join(', '));
    if (phMismatch.length) for (const k of phMismatch.slice(0, 10)) console.log(`  placeholder ${k}: en[${ph(en[k])}] vs ${l}[${ph(j[k])}]`);
  }
}
console.log(issues === 0 ? 'ALL CLEAN' : `${issues} languages with issues`);
