# CONTEXT: "Antrenman Takip" — a modular, build-free workout-tracking web app

You are working on an existing web application. Read this entire brief before making changes.

## What it is
A personal strength/GtG (Grease-the-Groove) workout tracker. Static site: `index.html` (markup
only) + `css/app.css` + native ES modules under `js/` — vanilla JS, no framework, NO build step,
Material-3-ish dark/light UI in Turkish. It runs offline from localStorage and optionally syncs
to the user's own Firebase (Auth + Firestore). Hosted on GitHub Pages from `main`.
All UI text and comments are in TURKISH. Keep that.

## Hard constraints (do not break these)
- No build tooling, no npm dependencies for the app, no framework. Native `import`/`export` only;
  libraries only via <script> CDN if truly needed (Firebase compat scripts are loaded that way).
- Modules are split by responsibility, function-based (no classes). Put new code in the module
  that owns that responsibility (see "Modül haritası"); create a new module only for a genuinely
  new responsibility.
- ES module rules that bite:
  - An imported binding can't be reassigned. Cross-module mutable UI state lives in
    `U` (`js/ui/durum-ui.js`): use `U.tab`, `U.balMode`, … — never a top-level `let` that other
    modules assign.
  - Leaf modules (`sabitler.js`, `yardimcilar.js`, `firebase-ayar.js`, `ui/durum-ui.js`) must NOT
    import anything: `kCatalog` and `S` are built at load time from them, and an import cycle
    through a leaf causes a TDZ error ("Cannot access X before initialization").
  - Every name you use from another module must be imported; `/dogrula` statically checks this.
  - Relative import paths must match file names exactly (GitHub Pages is case-sensitive, Windows isn't).
- Opening `index.html` via `file://` does NOT work (modules need http). Run locally with
  `npx serve .` or `python -m http.server`.
- Everything must keep working with NO network (localStorage is the source of truth; Firebase
  is an optional layer on top).
- Persistence contract: a `serialize()` builds one JSON object of all state; `applyState(d)`
  loads it; `mergeCfg(saved)` fills config defaults. ANY new persisted field MUST be added to
  all of: the `S` state object, `serialize()`, `applyState()`, `migrateV1()`/reset, and it then
  auto-syncs to Firebase. Forgetting one corrupts save/sync. → use skill `/yeni-alan`.
- Backwards compatibility: users have saved data. When you rename/split a taxonomy key (systems,
  muscles), you MUST (a) guard every SINFO/MINFO lookup so an unknown key can't crash rendering,
  (b) add a migration in `applyState` that rewrites old keys in `S.overrides` and `S.custom`,
  and (c) keep a legacy fallback entry. A crash in `render()` shows only the header — nothing else.
  → use skill `/taksonomi`.
- Test after every change → run skill `/dogrula`.

## Core domain model
- Exercises: a fixed built-in catalog `kCatalog` (each built via `E(id,name,{...})`), plus
  user `S.custom`. Users can EDIT any exercise; edits to a built-in are stored as a partial
  override in `S.overrides[id]`. `S.reindex()` builds `S._idx` = effective exercises
  (`effective(base)` merges overrides). `S.all()` / `S.ex(id)` read effective exercises.
- An exercise has: muscles{group:weight}, systems{system:weight} (weight 1 = primary,
  0.5 = auxiliary), 4-week `targets` [{sets,v}] with per-cycle `step`, days[], unit
  ('tekrar'|'sn'|'dk'), rpe, impact, halfRec, tempo (e.g. "3-1-0-1"), recovery (hours), note.
- Taxonomy is FIXED and curator-defined (users assign from it, can't invent new systems):
  - Muscles: 14 groups (MINFO / M_ORDER).
  - Systems (SINFO / S_ORDER): sinir (CNS), 4 muscle sub-systems (kasItme/kasCekme/kasBacak/
    kasGovde), 5 tendon sub-systems (tendonKol/tendonItme/tendonDiz/tendonAsil/tendonKalca),
    kemik, mobilite, reaktif, aerobik, anaerobik. (Legacy 'kas'/'tendon' keys still exist as
    hidden fallbacks + are migrated on load by `migrateTendon()`.)
- Logs: `S.logs` = [{e,t,v,r}] (exercise id, timestamp, value, RPE). This is the training record.

## Key computed logic (deterministic, no ML)
- `target(e,date)`: prescribed sets/value for that date (4-week loading/deload cycle + step +
  halfRec halves volume on configured days).
- Program is a repeating weekly template = active exercises × their `days`. `S.schedLog` records
  dated add/remove so a newly added exercise only counts "from that day on" (see `scheduledAt`).
- Recovery model (the heart of it): `sysRecovery(system)` = sum over recent (exercise,day) groups
  of `exRecovery(e) × systemWeight × rpeFactor(rpe) × setContrib × nSets − hoursElapsed`, plus a
  pain penalty. It is a *fatigue debt in hours*; it erodes with time. `sysThreshold(s)` =
  recovery-hours × overloadMult. Readiness = clamp(1 − debt/threshold, 0..1): full/green = ready,
  empty/red = rest. Over threshold = overload → the exercises that PRIMARY-load that system get an
  amber "rest" flag on the Today page.
- `painStatus(e,date)`: user rates pain 0–3 per region on the "Durum" page (writes `S.pain`,
  history in `S.painLog`). Level ≥ painHalfLevel → half load, ≥ painSkipLevel → passive/skip.
  Per-exercise manual daily override lives in `S.painAction` (today only). Amber = attention/half,
  red = skipped.
- Other analytics: muscle/pattern balance, gap-scoring for "next exercise" suggestions, monthly
  dashboard, calendar with cycle-phase colors and pain/schedule markers.
- EVERYTHING analytical is configurable: `S.cfg` (recovery hours per system, load thresholds,
  analysis window, RPE→recovery factors, setContrib, overloadMult, balance ratio, pain thresholds
  & strain, half-volume days, etc.), edited in Settings → "Analiz ve kurallar". `CFG_DEFAULT` holds
  defaults; every consumer reads from `S.cfg` with fallback. New tunable constants go here, never
  hard-coded.

## UI structure (bottom nav, 5 tabs)
Bugün (Today: tiles, log a set, per-second timer for 'sn' exercises, tempo metronome via Web Audio,
undo-one-set, day-spread view, one-off exercises, pain/overload flags) · Denge (Balance: [Analiz |
Durum] segments — muscle/pattern/system readiness + pain rating) · Özet (Overview: [Panel | Takvim |
Egzersiz]) · Rekor (PR tracking with retest intervals) · Program (Weekly editor | Suggestions |
All exercises + full exercise editor).
- Rendering is string-templated: `render()` sets `#content.innerHTML = PAGES[U.tab]()`. Events use
  delegation via `data-act`/`data-id` on a single body click handler; sheets/dialogs use `openSheet`
  /`openDialog`/`closeOverlay`. Follow these patterns; don't introduce a framework.

## Style / behavior rules
- Turkish everywhere. Amber (#e8892b) = "attention/caution", red = "stop/skip/overload",
  green = ready — keep this colour semantics consistent.
- Minimal formatting, keep the existing visual language and helper functions
  (barHtml, tag, noteBox, sec, statTile, exTags, esc, etc.). Reuse them.

## Modül haritası
```
index.html              iskelet: header, #content, #nav, #overlay, #toast + Firebase CDN + <script type="module" src="js/main.js">
css/app.css             tüm stiller (renk token'ları :root'ta, koyu tema @media + [data-theme])
js/
  main.js               giriş: olaylar'ı bağla → applyTheme → load → render → cloudInit
  firebase-ayar.js      EMBEDDED_FB_CONFIG (ortak Firebase projesi buraya yapıştırılır), HAS_EMBEDDED   [yaprak]
  sabitler.js           M_ORDER, S_ORDER, MINFO, SINFO, PAIN_*, SYS_GROUPS, gün/ay adları, PHASE, CFG_DEFAULT, mergeCfg, all7   [yaprak]
  yardimcilar.js        tarih/biçim: pad, dOnly, weekday, dayKey, fmt, esc, dt, monthStart, addMonths…   [yaprak]
  katalog.js            E(), T(), kCatalog
  durum.js              KEY, S, effective, defOf, serialize, migrateTendon, applyState, load, migrateV1, save, changed
  eylemler.js           durumu değiştirenler: addLog, undoLast, saveExercise, resetAll, setPain, setCfg… (→ changed())
  bulut.js              Cloud, cloudInit/Subscribe/Push/Auth, fbErr, renderIfSettings
  mantik/
    program.js          weekNo, target, todayList, scheduledAt, plannedOn, oneoff*, spreadPlan, streak, currentChain
    toparlanma.js       recHours, rpeFactor, exRecovery, sysThreshold, sysRecovery
    agri.js             painNow, painAt, painStatus, effSets, painExercises
    rekor.js            maxHistory, lastMax, maxDue, bestOf, prereqMet
    analiz.js           status, muscleLoad, systemLoad, patternSets, gapScore, monthAgg
  ui/
    durum-ui.js         U = paylaşılan UI durumu (tab, segment modları, filtreler, timerInt, cloudOpen)   [yaprak]
    html.js             tag, exTags, sec, noteBox, barHtml, statTile
    overlay.js          overlay, openSheet, openDialog, closeOverlay, showToast
    render.js           TABS, PAGES, render
    zamanlayici.js      openTimer, openMetro, beep (Web Audio)
    editor.js           openEditor (egzersiz editörü)
    ayarlar.js          openSettings, openConfig ("Analiz ve kurallar")
    bulut-ekrani.js     openCloud, cloudStatusText
    tema.js             applyTheme, cycleTheme
  sayfalar/             her sekme: render* + o sekmenin sheet'leri
    bugun.js  denge.js  ozet.js  rekor.js  program.js
  olaylar.js            body click delegasyonu (data-act/data-nav) → ilgili fonksiyon
```
Bağımlılık yönü: sabitler/yardimcilar → katalog → durum → mantik/* → ui/* → sayfalar/* → olaylar → main.
Döngüsel import'lar (ör. durum.changed → ui/render) sadece fonksiyon içinde kullanıldığı için sorunsuzdur;
modülün üst seviyesinde başka modülün `const`'unu kullanmak döngüde TDZ hatası verir.

localStorage anahtarları: `antrenman_takip_v2` (güncel), `antrenman_takip_v1` (eski, `migrateV1`), `fb_config`.

## Git kuralları
- Herhangi bir değişikliğe başlamadan önce mevcut durumu commit'le ve push'la.
- Sonra yeni bir branch aç (git checkout -b ozellik-adi) ve tüm işi orada yap.
- Asla main/master branch'inde doğrudan değişiklik yapma.
- Asla force push (git push -f) kullanma.
- Branch'leri benim onayım olmadan birleştirme (merge).

Not: Site GitHub Pages'ten `main` üzerinden yayınlanıyor, yani `main`'e merge = canlıya çıkış.
Bir işe başlarken `/ozellik-baslat` skill'ini kullan.

## Skill'ler (`.claude/skills/`)
| Skill | Ne zaman |
|---|---|
| `/ozellik-baslat` | Her yeni iş/özellik başında (git akışı) |
| `/dogrula` | Her değişiklikten sonra, commit'ten önce (statik import kontrolü + headless test) |
| `/yeni-alan` | Kalıcı yeni bir state alanı ya da `S.cfg` ayarı eklerken |
| `/taksonomi` | Kas/sistem anahtarı eklerken, yeniden adlandırırken ya da bölerken |
