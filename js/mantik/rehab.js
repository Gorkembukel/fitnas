// Rehabilitasyon mantığı: yalnızca S.rehab üzerinde çalışır.
// Ana programın S.logs / S.all() / S.active / sysRecovery / painStatus hiçbirine dokunmaz ve onlardan okunmaz.
import {S} from '../durum.js';
import {target} from './program.js';
import {dOnly,dayKey,dt,sameDay,weekday} from '../yardimcilar.js';

/* ── katalog ── */
export function rehabAll(){return S.rehab.exercises;}
export function rehabEx(id){return S.rehab.exercises.find(e=>e.id===id);}
/* ── bugün / plan ── */
export function rehabTodayList(d){const wd=weekday(d);
  return S.rehab.exercises.filter(e=>S.rehab.active.has(e.id)&&e.days.includes(wd)&&target(e,d)!==null);}
/* ── sorgular ── */
export function rehabCountOn(id,d){return S.rehab.logs.filter(l=>l.e===id&&sameDay(dt(l),d)).length;}
export function rehabDoneMap(d){const m={};for(const l of S.rehab.logs)if(sameDay(dt(l),d))m[l.e]=(m[l.e]||0)+1;return m;}
export function rehabStreak(){let d=dOnly(new Date());const days=new Set(S.rehab.logs.map(l=>dayKey(dt(l))));
  if(!days.has(dayKey(d)))d=new Date(d.getTime()-86400000);let n=0;while(days.has(dayKey(d))){n++;d=new Date(d.getTime()-86400000);}return n;}
export function rehabWeeklyCounts(e,ws){const counts=[];for(let i=0;i<4;i++){const s=new Date(ws.getTime()-7*(3-i)*86400000);const en=new Date(s.getTime()+7*86400000);
  counts.push(S.rehab.logs.filter(l=>l.e===e.id&&dOnly(dt(l))>=s&&dOnly(dt(l))<en).length);}return counts;}
