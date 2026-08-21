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

// JSON.parse 静默丢掉重复键（后写覆盖前写），所以解析出来的对象里【看不出】问题：
// 改到被忽略的那一份，表现是「我明明改了却没反应」。真出现过 —— 6 个文件各带
// 两处重复，而这个脚本一路报 ALL CLEAN。文件是一行一个键值对，跟着 { } 记一层
// 作用域就够抓，不必为此拉一个 JSON 分词器进来。
const dupKeys = (l) => {
  const dups = [], stack = [new Set()];
  for (const raw of fs.readFileSync(`src/i18n/${l}.json`, 'utf8').split('\n')) {
    const line = raw.trim();
    const m = line.match(/^"([^"]+)"\s*:/);
    if (m) {
      const top = stack[stack.length - 1];
      if (top.has(m[1])) dups.push(m[1]);
      top.add(m[1]);
    }
    if (line.endsWith('{')) stack.push(new Set());
    else if (line.startsWith('}')) stack.pop();
  }
  return dups;
};

let issues = 0;
for (const l of langs) {
  const dups = dupKeys(l);
  if (dups.length) {
    issues++;
    console.log(`== ${l} ==`);
    console.log('  duplicate keys (后写覆盖前写，前一份是死代码):', dups.join(', '));
  }
}
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
