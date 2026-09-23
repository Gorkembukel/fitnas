// Ortak HTML parçaları (etiket, not kutusu, çubuk, istatistik kutusu).
import {MINFO,SINFO} from '../sabitler.js';
import {esc} from '../yardimcilar.js';

/* ══════════════ HTML PARÇALARI ══════════════ */
export function tag(text,color,icon){return `<span class="tag" style="color:${color};background:color-mix(in srgb,${color} 15%,transparent)">${icon?`<span class="em">${icon}</span>`:''}${esc(text)}</span>`;}
export function exTags(e){let s='<div class="tags">';for(const m in e.muscles)if(e.muscles[m]>=1&&MINFO[m])s+=tag(MINFO[m].label,'var(--onvar)');
  for(const sy in e.systems)if(e.systems[sy]>=1&&SINFO[sy])s+=tag(SINFO[sy].label,SINFO[sy].color,SINFO[sy].icon);return s+'</div>';}
export function sec(t,sub){return `<div class="sec"><div class="t">${esc(t)}</div>${sub?`<div class="s">${esc(sub)}</div>`:''}</div>`;}
export function noteBox(t,{color,icon}={}){const c=color||'var(--primary)';return `<div class="note" style="color:${c};background:color-mix(in srgb,${c} 14%,transparent)"><span class="em">${icon||'ℹ️'}</span><div style="color:var(--onsurf)">${esc(t)}</div></div>`;}
export function barHtml(val,{color,cls='',bg}={}){const pct=Math.max(0,Math.min(1,val))*100;return `<div class="bar ${cls}" ${bg?`style="background:${bg}"`:''}><i style="width:${pct}%${color?`;background:${color}`:''}"></i></div>`;}
export function statTile(l,v){return `<div class="stat"><div class="l">${esc(l)}</div><div class="v">${v}</div></div>`;}
