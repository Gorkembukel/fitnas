# CONTEXT: "Antrenman Takip" — a single-file workout-tracking web app

You are working on an existing web application. Read this entire brief before making changes.

## What it is
A personal strength/GtG (Grease-the-Groove) workout tracker. It is ONE self-contained
`index.html` file: vanilla JS (no framework, no build step), inline CSS, Material-3-ish
dark/light UI in Turkish. It runs offline from localStorage and optionally syncs to the
user's own Firebase (Auth + Firestore). It is hosted as a static page (GitHub Pages).
All UI text and comments are in TURKISH. Keep that.

## Hard constraints (do not break these)
- Single file only. No external build tooling. Libraries only via <script> CDN if truly needed.
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
- Rendering is string-templated: `render()` sets `#content.innerHTML = PAGES[tab]()`. Events use
  delegation via `data-act`/`data-id` on a single body click handler; sheets/dialogs use `openSheet`
  /`openDialog`/`closeOverlay`. Follow these patterns; don't introduce a framework.

## Style / behavior rules
- Turkish everywhere. Amber (#e8892b) = "attention/caution", red = "stop/skip/overload",
  green = ready — keep this colour semantics consistent.
- Minimal formatting, keep the existing visual language and helper functions
  (barHtml, tag, noteBox, sec, statTile, exTags, esc, etc.). Reuse them.

## Kod haritası (index.html — satırlar kayabilir, Grep ile bul)
| Ne | Yaklaşık satır |
|---|---|
| Firebase CDN script'leri | 7–9 |
| Inline `<script>` başı, `EMBEDDED_FB_CONFIG` | 164–181 |
| `M_ORDER`, `S_ORDER`, `MINFO`, `SINFO` | 183–209 |
| `PAIN_AREAS`, `TENDONS`, `KAS`, `SYS_GROUPS` | 215–227 |
| `CFG_DEFAULT`, `mergeCfg`, `recHours` | 233–249 |
| `E()`, `kCatalog` | 254–286 |
| Yardımcılar (`esc`, `dayKey`, `fmt`…) | 289–299 |
| `KEY`, `S`, `effective`, `serialize`, `migrateTendon`, `applyState`, `load`, `migrateV1`, `save` | 302–362 |
| Firebase / `Cloud` | 365–435 |
| `target` | ~438 |
| `rpeFactor`, `exRecovery`, `sysThreshold`, `sysRecovery` | 500–513 |
| Ağrı: `painNow`, `setPain`, `painAt`, `painStatus` | 515–535 |
| UI helper'ları (`tag`, `exTags`, `sec`, `noteBox`, `barHtml`) | 596–601 |
| `renderToday` / `renderBalance` / `renderProgress` / `renderMax` / `renderLibrary` | 664 / 750 / 844 / 1014 / 1045 |
| `TABS`, `PAGES`, `render` | 1181–1191 |
| `openSheet`, `openDialog`, `closeOverlay` | 1195–1197 |
| Body click delegasyonu (`data-act`) | ~1542 |
| Başlat: `applyTheme();load();render();cloudInit();` | ~1599 |

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
| `/dogrula` | Her değişiklikten sonra, commit'ten önce (headless test) |
| `/yeni-alan` | Kalıcı yeni bir state alanı ya da `S.cfg` ayarı eklerken |
| `/taksonomi` | Kas/sistem anahtarı eklerken, yeniden adlandırırken ya da bölerken |
