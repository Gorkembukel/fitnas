// Headless doğrulama: js/ modüllerini sahte DOM ile Node'da gerçekten yükler ve test eder.
// Kullanım:  node .claude/skills/dogrula/verify.mjs
// Çıkış kodu: 0 = hepsi geçti, 1 = en az bir kontrol başarısız.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { codeText } from './lexer.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '../../..');
const JS = path.join(ROOT, 'js');
const SELF = fileURLToPath(import.meta.url);

let fails = 0, passes = 0;
const ok = (name) => { passes++; console.log('  ✓ ' + name); };
const bad = (name, err) => { fails++; console.log('  ✗ ' + name + '\n      ' + String(err && err.stack || err).split('\n').slice(0, 4).join('\n      ')); };
const check = (name, fn) => { try { const r = fn(); if (r === false) bad(name, 'false döndü'); else ok(name); } catch (e) { bad(name, e); } };
const H = 3600000, now = Date.now();

// ── Test verisi ──
function realisticLogs() {
  const ids = ['push', 'squat', 'wallsit', 'chin', 'run', 'rope', 'row1', 'deadbug'];
  const logs = [];
  for (let d = 20; d >= 0; d--) for (const [i, e] of ids.entries()) if ((d + i) % 3 === 0)
    for (let s = 0; s < 3; s++) logs.push({ e, t: now - d * 24 * H - s * H, v: 5 + s, r: 5 + ((d + s) % 5) });
  return logs.sort((a, b) => a.t - b.t);
}
const legacyCustom = { id: 'c_eski', def: { name: 'Eski özel', note: '', pattern: 'Özel', unit: 'tekrar', days: [1, 3, 5], rpe: 6,
  impact: false, halfRec: false, step: 0, tempo: '', recovery: '', muscles: { gogus: 1 }, systems: { kas: 1, tendon: 0.5 },
  targets: [{ sets: 3, v: 5 }, { sets: 3, v: 6 }, { sets: 3, v: 7 }, { sets: 2, v: 5 }] } };

const SCENARIOS = [
  ['Boş (ilk açılış)', {}],
  ['Gerçekçi veri (log + ağrı + ayar)', { antrenman_takip_v2: JSON.stringify({
    start: new Date(now - 40 * 24 * H).toISOString(), active: ['push', 'squat', 'wallsit', 'chin', 'run', 'rope', 'row1', 'deadbug'],
    logs: realisticLogs(), metrics: [{ k: 'Kilo (kg)', v: 80, t: now - 5 * 24 * H }], signals: {}, overrides: {}, maxes: [],
    testInterval: 28, schedLog: [], oneoff: [], pain: { tendonKol: 2, tendonDiz: 3 },
    painLog: [{ s: 'tendonKol', level: 2, t: now - 2 * H }, { s: 'tendonDiz', level: 3, t: now - H }], painAction: [],
    cfg: { overloadMult: 1.2 }, custom: [] }) }],
  ['Eski taksonomi (v2, kas/tendon anahtarları)', { antrenman_takip_v2: JSON.stringify({
    start: new Date(now - 10 * 24 * H).toISOString(), active: ['push', 'chin', 'c_eski'],
    logs: [{ e: 'chin', t: now - 5 * H, v: 1, r: 8 }, { e: 'c_eski', t: now - 3 * H, v: 5, r: 7 }],
    overrides: { chin: { ...legacyCustom.def, name: 'Chin-up', systems: { sinir: 1, kas: 1, tendon: 0.5 } } },
    custom: [legacyCustom], cfg: { recovery: { kas: 40, tendon: 80 } } }) }],
  ['Eski format (antrenman_takip_v1)', { antrenman_takip_v1: JSON.stringify({
    start: new Date(now - 60 * 24 * H).toISOString(), active: ['push', 'v1ozel'],
    logs: [{ e: 'push', t: now - 2 * H, v: 6, r: 5 }, { e: 'v1ozel', t: now - H, v: 4, r: 6 }],
    custom: [{ id: 'v1ozel', name: 'V1 özel', m: ['gogus'], s: ['kas', 'tendon'], sets: 3, v: 4, unit: 'tekrar', days: [1, 2, 3, 4, 5, 6, 7], rpe: 6 }] }) }],
  ['Bilinmeyen anahtarlar (guard testi)', { antrenman_takip_v2: JSON.stringify({
    active: ['push', 'c_x'], logs: [{ e: 'c_x', t: now - H, v: 3, r: 6 }],
    overrides: { push: { ...legacyCustom.def, name: 'Şınav', muscles: { yokKas: 1, gogus: 1 }, systems: { yokSistem: 1, sinir: 1 } } },
    custom: [{ id: 'c_x', def: { ...legacyCustom.def, name: 'X', muscles: { yokKas: 1 }, systems: { yokSistem: 1 } } }] }) }],
];

// ════════ Alt süreç: tek senaryo ════════
const argIdx = process.argv.indexOf('--senaryo');
if (argIdx > 0) {
  const [label, storage] = SCENARIOS[+process.argv[argIdx + 1]];
  console.log(`\n[${label}]`);
  installDom(storage);
  const imp = p => import(pathToFileURL(path.join(JS, p)).href);
  try { await imp('main.js'); ok('açılış: main.js (applyTheme → load → render → cloudInit)'); }
  catch (e) { bad('açılış: main.js (applyTheme → load → render → cloudInit)', e); report(); }
  const { S, serialize, applyState } = await imp('durum.js');
  const { CFG_DEFAULT, S_ORDER } = await imp('sabitler.js');
  const { sysRecovery, sysThreshold } = await imp('mantik/toparlanma.js');
  const { target } = await imp('mantik/program.js');
  const { painStatus } = await imp('mantik/agri.js');
  const { PAGES, TABS, render } = await imp('ui/render.js');
  const { U } = await imp('ui/durum-ui.js');

  const MODES = { 1: ['balMode', [0, 1]], 2: ['progMode', [0, 1, 2]], 4: ['libMode', [0, 1, 2]] }; // sekme → alt segment
  for (let t = 0; t < PAGES.length; t++) {
    const [key, modes] = MODES[t] || [null, [0]];
    for (const m of modes) check(`render ${TABS[t]}${key ? ' #' + m : ''}`, () => {
      U.tab = t; U.balMode = U.progMode = U.libMode = 0; if (key) U[key] = m;
      const h = PAGES[t](); if (typeof h !== 'string' || !h.length) throw new Error('boş/string olmayan HTML');
      if (/undefined|NaN/.test(h.replace(/<[^>]*>/g, ''))) throw new Error('görünür metinde "undefined"/"NaN" var');
      render();
    });
  }
  check('serialize → applyState round-trip', () => {
    const a = JSON.parse(JSON.stringify(serialize())); applyState(a);
    const b = JSON.parse(JSON.stringify(serialize())); delete a.updatedAt; delete b.updatedAt;
    const sa = JSON.stringify(a), sb = JSON.stringify(b);
    if (sa !== sb) throw new Error('round-trip farklı: ' + sa.slice(0, 120) + ' … vs … ' + sb.slice(0, 120));
  });
  check('cfg tüm CFG_DEFAULT anahtarlarını içeriyor', () => {
    const miss = Object.keys(CFG_DEFAULT).filter(k => !(k in S.cfg)); if (miss.length) throw new Error('eksik: ' + miss);
  });
  check('sysRecovery sonlu ve ≥0, eşik >0 (tüm sistemler)', () => {
    for (const s of S_ORDER) {
      const r = sysRecovery(s), th = sysThreshold(s);
      if (!Number.isFinite(r) || r < 0) throw new Error(`${s}: sysRecovery=${r}`);
      if (!Number.isFinite(th) || th <= 0) throw new Error(`${s}: sysThreshold=${th}`);
    }
  });
  check('target / painStatus tüm aktif egzersizlerde', () => {
    const d = new Date();
    for (const id of S.active) { const e = S.ex(id); if (!e) continue;
      const tg = target(e, d); if (tg && [tg.sets, tg.v].some(x => !Number.isFinite(x))) throw new Error(`${id}: target=${JSON.stringify(tg)}`);
      const ps = painStatus(e, d); if (!ps || !['normal', 'half', 'skip', 'flag'].includes(ps.mode)) throw new Error(`${id}: painStatus=${JSON.stringify(ps)}`);
    }
  });
  const { openOneoffPicker } = await imp('sayfalar/program.js');
  const { addOneoff, removeOneoff } = await imp('eylemler.js');
  const { oneoffIds } = await imp('mantik/program.js');
  const { dayKey, dOnly } = await imp('yardimcilar.js');
  const { overlay, closeOverlay } = await imp('ui/overlay.js');
  check('bugüne özel egzersiz: picker açılır, ekle/kaldır çalışır', () => {
    openOneoffPicker();
    if (!overlay.innerHTML.includes('Bugüne özel egzersiz')) throw new Error('sheet açılmadı');
    const key = dayKey(dOnly(new Date())), e = S.all().find(x => !oneoffIds(key).includes(x.id));
    addOneoff(e.id, key); if (!oneoffIds(key).includes(e.id)) throw new Error('eklenmedi');
    openOneoffPicker(); U.tab = 0; render();
    removeOneoff(e.id, key); if (oneoffIds(key).includes(e.id)) throw new Error('kaldırılmadı');
    closeOverlay();
  });
  if (label.startsWith('Eski taksonomi')) check('v2 migrasyonu: kas/tendon anahtarları kalmadı', () => {
    const left = [];
    for (const id in S.overrides) for (const k of ['kas', 'tendon']) if (S.overrides[id]?.systems?.[k] != null) left.push(`override:${id}.${k}`);
    for (const c of S.custom) for (const k of ['kas', 'tendon']) if (c.systems?.[k] != null) left.push(`custom:${c.id}.${k}`);
    if (left.length) throw new Error('kalan: ' + left.join(', '));
  });
  report();
}

function report() { console.log(`@@SONUC ${passes} ${fails}`); process.exit(fails ? 1 : 0); }

// ── Sahte DOM: her özelliğe/çağrıya tolerans gösteren eleman ──
function makeEl(id) {
  const store = { id, innerHTML: '', textContent: '', value: '', scrollTop: 0, style: {}, dataset: {}, children: [], checked: false, disabled: false };
  const classes = new Set();
  store.classList = { add: (...c) => c.forEach(x => classes.add(x)), remove: (...c) => c.forEach(x => classes.delete(x)),
    contains: c => classes.has(c), toggle: (c, f) => { const on = f ?? !classes.has(c); on ? classes.add(c) : classes.delete(c); return on; } };
  return new Proxy(store, {
    get(t, k) {
      if (k in t) return t[k];
      if (k === 'querySelector' || k === 'closest') return () => makeEl();
      if (k === 'querySelectorAll' || k === 'getElementsByClassName' || k === 'getElementsByTagName') return () => [];
      if (k === 'getAttribute') return () => null;
      if (typeof k === 'symbol') return undefined;
      return () => {}; // addEventListener, setAttribute, removeAttribute, appendChild, focus, ...
    },
    set(t, k, v) { t[k] = v; return true; },
  });
}
function installDom(storage) {
  const els = {}, ls = new Map(Object.entries(storage || {}));
  const g = globalThis;
  const def = (k, v) => Object.defineProperty(g, k, { value: v, configurable: true, writable: true });
  def('localStorage', { getItem: k => ls.has(k) ? ls.get(k) : null, setItem: (k, v) => ls.set(k, String(v)), removeItem: k => ls.delete(k), clear: () => ls.clear() });
  def('document', { getElementById: id => els[id] || (els[id] = makeEl(id)), body: makeEl('body'), documentElement: makeEl('html'), head: makeEl('head'),
    createElement: () => makeEl(), querySelector: () => makeEl(), querySelectorAll: () => [], addEventListener: () => {} });
  def('window', g);
  def('navigator', { userAgent: 'node', vibrate: () => {} });
  def('location', { href: 'http://localhost/', hash: '', reload: () => {} });
  def('matchMedia', () => ({ matches: false, addEventListener: () => {}, addListener: () => {} }));
  def('alert', () => {}); def('confirm', () => true);
}

// ════════ Ana süreç ════════
// 1) Statik kontroller: sözdizimi, eksik import, import'a atama, index.html referansları
console.log('\n[Statik]');
const files = []; (function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : p.endsWith('.js') && files.push(p); } })(JS);
const exportsOf = {}, srcOf = {};
for (const f of files) { const s = fs.readFileSync(f, 'utf8'); srcOf[f] = s;
  exportsOf[f] = [...s.matchAll(/^export\s+(?:function\s+([\w$]+)|(?:const|let)\s+([\s\S]*?)(?:;|$))/gm)]
    .flatMap(m => m[1] ? [m[1]] : [...m[2].matchAll(/(?:^|,)\s*([A-Za-z_$][\w$]*)\s*=/g)].map(x => x[1])); }
const owner = {}; for (const f in exportsOf) for (const n of exportsOf[f]) (owner[n] ||= []).push(f);
check('export adları benzersiz', () => { const d = Object.entries(owner).filter(([, v]) => v.length > 1); if (d.length) throw new Error(d.map(([n, v]) => n + ': ' + v.map(x => path.relative(ROOT, x)).join(' + ')).join('; ')); });
const esc = n => n.replace(/\$/g, '\\$');
let missing = [], reassigned = [], lexErr = [];
for (const f of files) {
  const s = srcOf[f], rel = path.relative(ROOT, f).replace(/\\/g, '/');
  const imported = new Set([...s.matchAll(/^import\s*\{([^}]*)\}/gm)].flatMap(m => m[1].split(',').map(x => x.trim()).filter(Boolean)));
  let code; try { code = codeText(s.replace(/^import .*$/gm, '')); } catch (e) { lexErr.push(rel + ': ' + e.message); continue; }
  const own = new Set(exportsOf[f]);
  for (const n in owner) if (!own.has(n) && !imported.has(n)) {
    // Yerel tanım (parametre/let/const/function) varsa gölgeleme olabilir; yalnızca yerelde hiç tanımlanmayanları raporla
    // Önünde tek '.' varsa property erişimidir (obj.x); '...' (spread) ise gerçek kullanımdır
    const used = new RegExp('(?<![\\w$])(?:(?<=\\.\\.\\.)|(?<!\\.))' + esc(n) + '(?![\\w$])(?!\\s*:)').test(code);
    const localDecl = new RegExp('(?:\\b(?:const|let|var|function)\\s+|[(,{]\\s*)' + esc(n) + '\\b').test(code);
    if (used && !localDecl) missing.push(`${rel}: ${n} (${path.relative(ROOT, owner[n][0]).replace(/\\/g, '/')})`);
  }
  for (const n of imported) if (new RegExp('(?<![\\w$.])' + esc(n) + '\\s*(?:[-+*/%]?=(?!=)|\\+\\+|--)').test(code)) reassigned.push(`${rel}: ${n}`);
}
check('tokenizer tüm dosyaları okuyabildi', () => { if (lexErr.length) throw new Error(lexErr.join('\n')); });
check('kullanılıp import edilmemiş ad yok', () => { if (missing.length) throw new Error(missing.join('\n      ')); });
check("import edilen bağlamaya atama yok (paylaşılan UI durumu için U.x kullan)", () => { if (reassigned.length) throw new Error(reassigned.join('\n      ')); });
check('index.html: css ve main.js referansları mevcut', () => {
  const h = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  for (const [re, p] of [[/href="(css\/[^"]+)"/g], [/src="(js\/[^"]+)"/g]]) for (const m of h.matchAll(re)) if (!fs.existsSync(path.join(ROOT, m[1]))) throw new Error('eksik dosya: ' + m[1]);
  if (!/type="module"\s+src="js\/main\.js"/.test(h)) throw new Error('<script type="module" src="js/main.js"> yok');
});
check('import yolları dosya adlarıyla birebir aynı (büyük/küçük harf; GitHub Pages duyarlıdır)', () => {
  const exact = p => { const rel = path.relative(ROOT, p).split(path.sep); let d = ROOT;
    for (const seg of rel) { if (!fs.readdirSync(d).includes(seg)) return false; d = path.join(d, seg); } return true; };
  const bad = [];
  for (const f of files) for (const m of srcOf[f].matchAll(/^import\s[^'"]*['"]([^'"]+)['"]/gm)) {
    const t = path.resolve(path.dirname(f), m[1]); if (!exact(t)) bad.push(`${path.relative(ROOT, f)} → ${m[1]}`); }
  if (bad.length) throw new Error(bad.join('\n      '));
});
check('yaprak modüller import etmiyor (sabitler, yardimcilar, firebase-ayar, ui/durum-ui)', () => {
  for (const p of ['sabitler.js', 'yardimcilar.js', 'firebase-ayar.js', 'ui/durum-ui.js']) if (/^import /m.test(srcOf[path.join(JS, p)] || '')) throw new Error(p + ' import içeriyor (döngüsel yükleme riski)');
});

// 2) Senaryolar: her biri ayrı süreçte (modüller tekil olduğundan temiz durum için)
for (let i = 0; i < SCENARIOS.length; i++) {
  const r = spawnSync(process.execPath, [SELF, '--senaryo', String(i)], { encoding: 'utf8' });
  const out = (r.stdout || '') + (r.stderr ? '\n' + r.stderr : '');
  const m = out.match(/@@SONUC (\d+) (\d+)/);
  process.stdout.write(out.replace(/@@SONUC.*\n?/, '').replace(/\n+$/, '') + '\n');
  if (m) { passes += +m[1]; fails += +m[2]; } else { fails++; console.log('  ✗ senaryo süreci çöktü (çıkış ' + r.status + ')'); }
}
console.log(`\nSONUÇ: ${passes} geçti, ${fails} başarısız`);
process.exit(fails ? 1 : 0);
