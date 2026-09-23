// Program mantığı: haftalık hedef, döngü, takvim planı, bugüne özel, güne yayma, seri.
import {S} from '../durum.js';
import {effSets,painStatus} from './agri.js';
import {kGrpOrder} from '../sabitler.js';
import {dOnly,dayKey,diffDays,dt,pad,sameDay,weekday} from '../yardimcilar.js';

/* ── program mantığı ── */
export function weekNo(d){return Math.floor(Math.max(0,diffDays(d,S.start))/7)+1;}
export function target(e,d){
  if(!e.targets.length)return null;
  const w=weekNo(d), t=e.targets[(w-1)%e.targets.length];
  if(t.sets===0)return null;
  const cycle=Math.floor((w-1)/4);
  let v=t.v+e.step*cycle, sets=t.sets, wd=weekday(d);
  if(e.halfRec&&S.cfg.halfDays.includes(wd))sets=Math.max(1,Math.ceil(sets/2));
  return {sets,v};
}
export const catIndex=e=>S.all().indexOf(e);
export function autoTargets(sets,base,inc,pct){const dl=Math.max(1,Math.round(base*pct/100));
  return [{sets,v:base},{sets,v:base+inc},{sets,v:base+2*inc},{sets,v:dl}];}
export function detectAuto(tg){if(tg.length<4)return null;const s=tg[0].sets;if(s<1||!tg.every(t=>t.sets===s))return null;
  const inc=tg[1].v-tg[0].v;if(inc<0||tg[2].v-tg[1].v!==inc)return null;const base=tg[0].v;if(base<=0||tg[3].v>base)return null;
  return {sets:s,base,inc,pct:Math.round(tg[3].v/base*100)};}
export function weekDate(week,wd){const b=new Date(S.start.getTime()+(week-1)*7*86400000);const off=(wd-weekday(b)+7)%7;return dOnly(new Date(b.getTime()+off*86400000));}
export function todayList(d){const wd=weekday(d);
  const l=S.all().filter(e=>S.active.has(e.id)&&e.days.includes(wd)&&target(e,d)!==null);
  l.sort((a,b)=>{const c=(kGrpOrder[a.grp]??9)-(kGrpOrder[b.grp]??9);return c!==0?c:catIndex(a)-catIndex(b);});return l;}
/* ── sorgular ── */
export function countOn(id,d){return S.logs.filter(l=>l.e===id&&sameDay(dt(l),d)).length;}
export function streak(){let d=dOnly(new Date());const days=new Set(S.logs.map(l=>dayKey(dt(l))));
  if(!days.has(dayKey(d)))d=new Date(d.getTime()-86400000);let n=0;while(days.has(dayKey(d))){n++;d=new Date(d.getTime()-86400000);}return n;}
/* ── takvim / plan (tarihe duyarlı) ── */
export function scheduledAt(e,wd,X){
  const evs=S.schedLog.filter(z=>z.e===e.id&&z.d===wd).sort((a,b)=>a.t-b.t);
  if(!evs.length)return e.days.includes(wd);
  const Xend=dOnly(X).getTime()+86400000-1;let last=null;
  for(const z of evs){if(z.t<=Xend)last=z;else break;}
  if(last)return last.op==='add';
  return evs[0].op==='remove';
}
export function phaseOf(X){if(dOnly(X)<S.start)return null;return (weekNo(X)-1)%4;}
export function plannedOn(X){if(dOnly(X)<S.start)return [];const wd=weekday(X);
  return S.all().filter(e=>S.active.has(e.id)&&scheduledAt(e,wd,X)&&target(e,X)!==null);}
export function plannedSets(X){let s=0;for(const e of plannedOn(X)){const t=target(e,X);s+=t?t.sets:0;}return s;}
export function doneSetsOn(X){return S.logs.filter(l=>sameDay(dt(l),X)).length;}
export function doneMap(X){const m={};for(const l of S.logs)if(sameDay(dt(l),X))m[l.e]=(m[l.e]||0)+1;return m;}
export function schedChangesOn(X){return S.schedLog.filter(z=>sameDay(new Date(z.t),X));}
/* ── bugüne özel (oneoff) ── */
export function oneoffIds(key){return S.oneoff.filter(o=>o.d===key).map(o=>o.e);}
export function oneoffsOn(key){return oneoffIds(key).map(id=>S.ex(id)).filter(Boolean);}
export function oneoffTarget(e,day){return target(e,day)||{sets:(e.targets[0]?e.targets[0].sets:3),v:(e.targets[0]?e.targets[0].v:10)};}
/* ── gün içine yayma (spread) ── */
export function spreadPlan(today){
  const rem=[];
  for(const e of todayList(today)){const es=effSets(e,today);const t=target(e,today);const half=painStatus(e,today).mode==='half';const left=es-countOn(e.id,today);if(left>0)rem.push({e,total:es,left,v:t.v,extra:false,half});}
  for(const e of oneoffsOn(dayKey(today))){if(todayList(today).some(x=>x.id===e.id))continue;const es=effSets(e,today);const t=oneoffTarget(e,today);const half=painStatus(e,today).mode==='half';const left=es-countOn(e.id,today);if(left>0)rem.push({e,total:es,left,v:t.v,extra:true,half});}
  const seq=[],recM={},recS={};let idx=0;const total=rem.reduce((a,r)=>a+r.left,0);
  while(seq.length<total){
    let best=null,bs=-1e9;
    for(const r of rem){if(r.left<=0)continue;let s=r.left*0.6;
      if(seq.length&&seq[seq.length-1].e.id===r.e.id)s-=100;
      const cd=Math.max(2,Math.round(r.e.rpe/2));
      for(const m in r.e.muscles)if(r.e.muscles[m]>=1&&recM[m]!=null){const g=idx-recM[m];if(g<cd)s-=(cd-g)*4;}
      for(const sy in r.e.systems)if(r.e.systems[sy]>=1&&recS[sy]!=null){const g=idx-recS[sy];if(g<cd)s-=(cd-g)*4;}
      if(s>bs){bs=s;best=r;}}
    if(!best)break;best.left--;
    seq.push({e:best.e,setNo:best.total-best.left,total:best.total,v:best.v,extra:best.extra,half:best.half});
    for(const m in best.e.muscles)if(best.e.muscles[m]>=1)recM[m]=idx;
    for(const sy in best.e.systems)if(best.e.systems[sy]>=1)recS[sy]=idx;
    idx++;}
  return seq;
}
export function spreadTime(i,n,startH,endH){const h=n<=1?startH:startH+i*(endH-startH)/(n-1);let hh=Math.floor(h),mm=Math.round((h-hh)*60);if(mm>=60){hh++;mm-=60;}return pad(Math.min(23,hh))+':'+pad(mm);}
export function currentChain(){let d=dOnly(new Date()),n=0,first=true;
  while(d>=S.start){const p=plannedSets(d),done=doneSetsOn(d);
    if(p===0){}else if(done>0){n++;}else{if(!first)break;}
    first=false;d=new Date(d.getTime()-86400000);}
  return n;}
