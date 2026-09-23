// Headless doğrulama: index.html içindeki inline <script>'i sahte DOM ile Node vm'de çalıştırır.
// Kullanım:  node .claude/skills/dogrula/verify.mjs [index.html yolu]
// Çıkış kodu: 0 = hepsi geçti, 1 = en az bir kontrol başarısız.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = process.argv[2] || path.resolve(here, '../../../index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

// Inline (src'siz) script bloklarını al
const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
if (!scripts.length) { console.error('✗ Inline <script> bulunamadı'); process.exit(1); }
const code = scripts.join('\n;\n');

let fails = 0, passes = 0;
const ok = (name) => { passes++; console.log('  ✓ ' + name); };
const bad = (name, err) => { fails++; console.log('  ✗ ' + name + '\n      ' + String(err && err.stack || err).split('\n').slice(0, 4).join('\n      ')); };
const check = (name, fn) => { try { const r = fn(); if (r === false) bad(name, 'false döndü'); else ok(name); } catch (e) { bad(name, e); } };

// 1) Sözdizimi
console.log('\n[1] Sözdizimi');
try { new vm.Script(code, { filename: 'index.html<script>' }); ok('script derleniyor'); }
catch (e) { bad('script derleniyor', e); console.log(`\nSONUÇ: ${passes} geçti, ${fails} başarısız`); process.exit(1); }

// Uygulamanın let/const'larına dışarıdan erişim için aynı script'in sonuna eklenen köprü
const EXPORT = `
;globalThis.__T={S,serialize,applyState,mergeCfg,migrateV1,load,render,PAGES,TABS,CFG_DEFAULT,
  sysRecovery,sysThreshold,painStatus,target,S_ORDER,M_ORDER,SINFO,MINFO,
  setTab:v=>{tab=v},setModes:(b,p,l)=>{balMode=b;progMode=p;libMode=l}};`;

// ── Sahte DOM: her özelliğe/çağrıya tolerans gösteren eleman ──
function makeEl(id) {
  const store = { id, innerHTML: '', textContent: '', value: '', scrollTop: 0, style: {}, dataset: {},
    children: [], checked: false, disabled: false };
  const classes = new Set();
  store.classList = { add: (...c) => c.forEach(x => classes.add(x)), remove: (...c) => c.forEach(x => classes.delete(x)),
    contains: c => classes.has(c), toggle: (c, f) => { const on = f ?? !classes.has(c); on ? classes.add(c) : classes.delete(c); return on; } };
  const noop = () => {};
  return new Proxy(store, {
    get(t, k) {
      if (k in t) return t[k];
      if (k === 'querySelector' || k === 'closest') return () => makeEl();
      if (k === 'querySelectorAll' || k === 'getElementsByClassName' || k === 'getElementsByTagName') return () => [];
      if (k === 'getBoundingClientRect') return () => ({ top: 0, left: 0, width: 0, height: 0, right: 0, bottom: 0 });
      if (k === 'getAttribute') return () => null;
      if (typeof k === 'symbol') return undefined;
      return noop; // addEventListener, setAttribute, appendChild, focus, remove, ...
    },
    set(t, k, v) { t[k] = v; return true; },
  });
}

function makeContext(storage) {
  const els = {};
  const byId = id => els[id] || (els[id] = makeEl(id));
  const ls = new Map(Object.entries(storage || {}));
  const localStorage = { getItem: k => ls.has(k) ? ls.get(k) : null, setItem: (k, v) => ls.set(k, String(v)),
    removeItem: k => ls.delete(k), clear: () => ls.clear() };
  const document = { getElementById: byId, body: makeEl('body'), documentElement: makeEl('html'),
    createElement: () => makeEl(), querySelector: () => makeEl(), querySelectorAll: () => [],
    addEventListener: () => {}, head: makeEl('head') };
  const ctx = { document, localStorage, console, setTimeout: () => 0, clearTimeout: () => {},
    setInterval: () => 0, clearInterval: () => {}, requestAnimationFrame: () => 0,
    navigator: { userAgent: 'node', vibrate: () => {} }, location: { href: 'http://localhost/', hash: '' },
    matchMedia: () => ({ matches: false, addEventListener: () => {}, addListener: () => {} }), alert: () => {}, confirm: () => true };
  ctx.window = ctx; ctx.self = ctx;
  vm.createContext(ctx);
  return { ctx, ls, els };
}

function boot(label, storage) {
  const { ctx, ls, els } = makeContext(storage);
  new vm.Script(code + EXPORT, { filename: 'index.html<script>' }).runInContext(ctx);
  return { T: ctx.__T, ls, els, label };
}

// ── Test verisi ──
const H = 3600000, now = Date.now();
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

// Her sekme + alt segment
const MODES = { 1: [0, 1], 2: [0, 1, 2], 4: [0, 1, 2] }; // tab → segment indeksleri

for (const [label, storage] of SCENARIOS) {
  console.log(`\n[${label}]`);
  let env;
  try { env = boot(label, storage); ok('açılış: applyTheme → load → render → cloudInit'); }
  catch (e) { bad('açılış: applyTheme → load → render → cloudInit', e); continue; }
  const { T } = env;

  for (let t = 0; t < T.PAGES.length; t++) {
    for (const m of (MODES[t] || [0])) {
      check(`render ${T.TABS[t]}${MODES[t] ? ' #' + m : ''}`, () => {
        T.setTab(t); T.setModes(t === 1 ? m : 0, t === 2 ? m : 0, t === 4 ? m : 0);
        const h = T.PAGES[t](); if (typeof h !== 'string' || !h.length) throw new Error('boş/string olmayan HTML');
        if (/undefined|NaN/.test(h.replace(/<[^>]*>/g, ''))) throw new Error('görünür metinde "undefined"/"NaN" var');
        T.render();
      });
    }
  }

  check('serialize → applyState round-trip', () => {
    const a = JSON.parse(JSON.stringify(T.serialize())); T.applyState(a);
    const b = JSON.parse(JSON.stringify(T.serialize())); delete a.updatedAt; delete b.updatedAt;
    const sa = JSON.stringify(a), sb = JSON.stringify(b);
    if (sa !== sb) throw new Error('round-trip farklı: ' + sa.slice(0, 120) + ' … vs … ' + sb.slice(0, 120));
  });

  check('cfg tüm CFG_DEFAULT anahtarlarını içeriyor', () => {
    const miss = Object.keys(T.CFG_DEFAULT).filter(k => !(k in T.S.cfg)); if (miss.length) throw new Error('eksik: ' + miss);
  });

  check('sysRecovery sonlu ve ≥0, eşik >0 (tüm sistemler)', () => {
    for (const s of T.S_ORDER) {
      const r = T.sysRecovery(s), th = T.sysThreshold(s);
      if (!Number.isFinite(r) || r < 0) throw new Error(`${s}: sysRecovery=${r}`);
      if (!Number.isFinite(th) || th <= 0) throw new Error(`${s}: sysThreshold=${th}`);
      const ready = Math.max(0, Math.min(1, 1 - r / th)); if (!(ready >= 0 && ready <= 1)) throw new Error(`${s}: readiness=${ready}`);
    }
  });

  check('target / painStatus tüm aktif egzersizlerde', () => {
    const d = new Date();
    for (const id of T.S.active) { const e = T.S.ex(id); if (!e) continue;
      const tg = T.target(e, d); if (tg && typeof tg === 'object' && [tg.sets, tg.v].some(x => x != null && !Number.isFinite(x))) throw new Error(`${id}: target=${JSON.stringify(tg)}`);
      const ps = T.painStatus(e, d); if (!ps || !['normal', 'half', 'skip'].includes(ps.mode)) throw new Error(`${id}: painStatus=${JSON.stringify(ps)}`);
    }
  });

  if (label.startsWith('Eski taksonomi')) check('v2 migrasyonu: kas/tendon anahtarları kalmadı', () => {
    const left = [];
    for (const id in T.S.overrides) for (const k of ['kas', 'tendon']) if (T.S.overrides[id]?.systems?.[k] != null) left.push(`override:${id}.${k}`);
    for (const c of T.S.custom) for (const k of ['kas', 'tendon']) if (c.systems?.[k] != null) left.push(`custom:${c.id}.${k}`);
    if (left.length) throw new Error('kalan: ' + left.join(', '));
  });
}

console.log(`\nSONUÇ: ${passes} geçti, ${fails} başarısız`);
process.exit(fails ? 1 : 0);
