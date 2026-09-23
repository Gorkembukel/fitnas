// Ağrı / durum: bölge ağrısının egzersizlere etkisi (yarım / atla / dikkat).
import {S} from '../durum.js';
import {target} from './program.js';
import {dOnly,dayKey,sameDay} from '../yardimcilar.js';

/* ── ağrı / durum ── */
export function painNow(s){return S.pain[s]||0;}
export function painAt(s,X){const evs=S.painLog.filter(z=>z.s===s).sort((a,b)=>a.t-b.t);if(!evs.length)return 0;const Xend=dOnly(X).getTime()+86400000-1;let last=0;for(const z of evs){if(z.t<=Xend)last=z.level;else break;}return last;}
export function painActionOf(id,key){const a=S.painAction.find(x=>x.e===id&&x.d===key);return a?a.mode:null;}
export function painStatus(e,date){
  const key=dayKey(date),man=painActionOf(e.id,key);
  if(man==='skip')return {mode:'skip',source:'manual'};
  if(man==='half')return {mode:'half',source:'manual'};
  if(man==='normal')return {mode:'normal',source:'manual'};
  const today=sameDay(date,new Date());let lvl=0;
  for(const s in e.systems)if(e.systems[s]>=1){const pl=today?painNow(s):painAt(s,date);if(pl>lvl)lvl=pl;}
  const C=S.cfg;
  if(lvl>=C.painSkipLevel)return {mode:'skip',source:'system',level:lvl};
  if(lvl>=C.painHalfLevel)return {mode:'half',source:'system',level:lvl};
  if(lvl>=1)return {mode:'flag',source:'system',level:lvl};
  return {mode:'normal'};
}
export function effSets(e,date){const t=target(e,date);if(!t)return 0;const ps=painStatus(e,date);if(ps.mode==='skip')return 0;if(ps.mode==='half')return Math.max(1,Math.ceil(t.sets/2));return t.sets;}
export function painExercises(sys){return S.all().filter(e=>S.active.has(e.id)&&(e.systems[sys]||0)>=1);}
