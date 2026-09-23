// Rekor (max) sorguları ve ön koşul kontrolü.
import {S} from '../durum.js';
import {daysSince} from '../yardimcilar.js';

/* ── max / rekor ── */
export function maxHistory(id){return S.maxes.filter(m=>m.e===id).sort((a,b)=>a.t-b.t);}
export function lastMax(id){const h=maxHistory(id);return h.length?h[h.length-1]:null;}
export function maxDue(id){const lm=lastMax(id);return lm?daysSince(lm.t)>=S.testInterval:true;}
export function bestOf(id){let b=null;for(const l of S.logs)if(l.e===id&&(b===null||l.v>b))b=l.v;
  for(const m of S.maxes)if(m.e===id&&(b===null||m.v>b))b=m.v;return b;}
export function prereqMet(e){if(!e.prereqId)return null;const b=bestOf(e.prereqId);return b!==null&&b>=e.prereqValue;}
