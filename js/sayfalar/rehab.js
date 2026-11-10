// Rehab sekmesi: Bugün | İlerleme. Ana programdan tamamen izole (bkz. mantik/rehab.js).
import {S} from '../durum.js';
import {addRehabLog,removeRehabExercise,saveRehabExercise,undoLastRehabLog} from '../eylemler.js';
import {target} from '../mantik/program.js';
import {rehabAll,rehabCountOn,rehabEx,rehabStreak,rehabTodayList,rehabWeeklyCounts} from '../mantik/rehab.js';
import {MINFO,M_ORDER,SINFO,S_ORDER,kDayShort} from '../sabitler.js';
import {U} from '../ui/durum-ui.js';
import {barHtml,exTags,noteBox,sec,statTile} from '../ui/html.js';
import {closeOverlay,openSheet,overlay} from '../ui/overlay.js';
import {openMetro,openTimer} from '../ui/zamanlayici.js';
import {dOnly,esc,fmt,weekday} from '../yardimcilar.js';

/* ══════════════ REHAB ══════════════ */
export function renderRehab(){
  let h=`<div class="rehab-scope"><div style="height:8px"></div><div class="seg">
    <button class="${U.rehabMode===0?'on':''}" data-act="rehabmode" data-v="0">📅 Bugün</button>
    <button class="${U.rehabMode===1?'on':''}" data-act="rehabmode" data-v="1">📈 İlerleme</button></div><div style="height:8px"></div>`;
  h+=U.rehabMode===0?rehabToday():rehabProgress();
  h+=`<div style="text-align:center;margin-top:6px"><button class="text" data-act="rehabadd">＋ Rehab egzersizi ekle</button></div></div>`;
  return h;
}
function rehabToday(){
  const today=dOnly(new Date()),list=rehabTodayList(today);
  if(!list.length&&!rehabAll().length)return noteBox('Henüz rehab egzersizi yok. Aşağıdan bir egzersiz ekleyerek başla.',{icon:'🩹'});
  if(!list.length)return noteBox('Bugün için planlı rehab egzersizi yok.',{icon:'🩹'});
  let h='';for(const e of list)h+=rehabTile(e,today);
  return h;
}
function rehabTile(e,day){
  const t=target(e,day);if(!t)return '';
  const done=rehabCountOn(e.id,day),complete=t.sets>0&&done>=t.sets;
  return `<div class="card extile" style="padding:12px 8px 12px 16px">
    <div class="head"><div style="flex:1" data-act="rehablog" data-id="${e.id}"><div class="name">${esc(e.name)}</div>
      <div class="muted small">${t.sets} set × ${fmt(t.v)} ${esc(e.unit)}</div></div>
      ${e.unit==='sn'?`<button class="iconbtn" data-act="rehabtimer" data-id="${e.id}" style="width:34px;height:40px;font-size:16px" title="Zamanlayıcı">▶</button>`:''}
      ${e.unit==='tekrar'&&e.tempo?`<button class="iconbtn" data-act="rehabmetro" data-id="${e.id}" style="width:34px;height:40px;font-size:16px" title="Metronom">🎵</button>`:''}
      ${done>0?`<button class="iconbtn" data-act="rehabundo" data-id="${e.id}" style="width:34px;height:40px;font-size:17px" title="Son seti geri al">↶</button>`:''}
      <button class="iconsq" data-act="rehabaddset" data-id="${e.id}" title="Set ekle">${complete?'✓':'+'}</button>
      <button class="iconbtn" data-act="rehabedit" data-id="${e.id}" style="width:30px;height:40px;font-size:15px" title="Düzenle">✎</button></div>
    <div style="display:flex;align-items:center;gap:10px;margin:8px 8px 0 0">
      <div style="flex:1">${barHtml(Math.min(1,t.sets?done/t.sets:0),{cls:'md'})}</div>
      <div class="small" style="font-weight:500">${done}/${t.sets}</div></div>
    <div style="margin:8px 8px 0 0" data-act="rehablog" data-id="${e.id}">${exTags(e)}</div>
    ${e.note?`<div class="muted" style="font-size:12.5px;margin-top:6px" data-act="rehablog" data-id="${e.id}">${esc(e.note)}</div>`:''}</div>`;
}
function rehabProgress(){
  const today=dOnly(new Date()),ws=new Date(today.getTime()-(weekday(today)-1)*86400000);
  const list=rehabAll();
  let h=`<div class="stats">${statTile('Rehab egzersizi',list.length)}${statTile('Seri (gün)',rehabStreak())}</div>`;
  if(!list.length)return h+noteBox('Henüz rehab egzersizi eklenmedi.',{icon:'🩹'});
  h+=sec('Rehab ilerlemesi','Son 4 hafta set sayısı');
  for(const e of list)h+=rehabExCard(e,ws);
  return h;
}
function rehabExCard(e,ws){
  const counts=rehabWeeklyCounts(e,ws),mx=Math.max(0,...counts);
  let bars='';for(let i=0;i<4;i++){const hgt=3+28*(mx===0?0:counts[i]/mx);
    bars+=`<div class="b"><div style="font-size:10.5px">${counts[i]}</div><div class="col" style="height:${hgt}px;opacity:${i===3?1:.43}"></div><div class="tiny muted" style="font-size:10px">${i===3?'bu':'-'+(3-i)+'h'}</div></div>`;}
  return `<div class="card tight"><div style="display:flex;align-items:flex-start;gap:8px">
    <div style="flex:1"><div style="font-weight:600;font-size:15px">${esc(e.name)}</div>
      <div class="muted" style="font-size:12.5px;margin-top:2px">${S.rehab.active.has(e.id)?'aktif':'pasif'} · ${e.days.map(d=>kDayShort[d-1]).join(' ')}</div></div>
    <div class="bars">${bars}</div></div>
    <div style="margin-top:8px">${exTags(e)}</div>
    <div style="margin-top:8px"><button class="text" data-act="rehabtoggle" data-id="${e.id}">${S.rehab.active.has(e.id)?'Pasife al':'Aktif et'}</button>
      <button class="text" data-act="rehabedit" data-id="${e.id}">Düzenle</button></div></div>`;
}
/* ── günlük kayıt sheet ── */
export function openRehabLog(e,v0){
  let v=v0,r=e.rpe;
  const stepFor=()=>e.unit==='tekrar'?1:e.unit==='sn'?5:(v>=30?5:1);
  openSheet(`<div class="title-lg">${esc(e.name)}</div><div style="margin-top:8px">${exTags(e)}</div>
    <div style="display:flex;align-items:center;justify-content:center;gap:24px;margin-top:18px">
      <button class="roundbtn" id="rlminus">−</button><div style="font-size:30px;font-weight:500;min-width:120px;text-align:center" id="rlval">${fmt(v)} ${esc(e.unit)}</div><button class="roundbtn" id="rlplus">＋</button></div>
    <div style="margin-top:14px" id="rlhint">Zorluk (RPE): ${r}</div>
    <input type="range" min="1" max="10" step="1" value="${r}" id="rlrpe" style="margin-top:6px">
    <div style="margin-top:8px"><button class="fill block" id="rlsave">✓ Seti kaydet</button></div>
    ${e.unit==='sn'?`<div style="margin-top:8px"><button class="tonal block" id="rltimer">▶ Zamanlayıcıyı başlat (${fmt(v)} sn)</button></div>`:''}
    ${e.unit==='tekrar'&&e.tempo?`<div style="margin-top:8px"><button class="tonal block" id="rlmetro">🎵 Metronom (tempo ${esc(e.tempo)} · ${fmt(v)} tekrar)</button></div>`:''}`);
  const val=overlay.querySelector('#rlval'),upd=()=>val.textContent=`${fmt(v)} ${e.unit}`;
  overlay.querySelector('#rlminus').onclick=()=>{v=Math.max(0,v-stepFor());upd();};
  overlay.querySelector('#rlplus').onclick=()=>{v=v+stepFor();upd();};
  overlay.querySelector('#rlrpe').oninput=ev=>{r=+ev.target.value;overlay.querySelector('#rlhint').textContent=`Zorluk (RPE): ${r}`;};
  overlay.querySelector('#rlsave').onclick=()=>{addRehabLog(e.id,v,r);closeOverlay();};
  const lt=overlay.querySelector('#rltimer');if(lt)lt.onclick=()=>openTimer(e,v,addRehabLog,undoLastRehabLog);
  const lm=overlay.querySelector('#rlmetro');if(lm)lm.onclick=()=>openMetro(e,v,addRehabLog,undoLastRehabLog);
}
/* ── egzersiz ekle/düzenle sheet ── */
export function openRehabEditor(id){
  const base=id?rehabEx(id):null;
  const st={unit:base?base.unit:'tekrar',rpe:base?base.rpe:5,days:new Set(base?base.days:[]),
    muscles:new Set(base?Object.keys(base.muscles||{}):[]),systems:new Set(base?Object.keys(base.systems||{}):[])};
  const dItems=[1,2,3,4,5,6,7].map(i=>[i,kDayShort[i-1]]);
  const mItems=M_ORDER.map(m=>[m,esc(MINFO[m].label)]),sItems=S_ORDER.map(s=>[s,SINFO[s].icon+' '+esc(SINFO[s].label)]);
  const chip=(items,set,attr)=>items.map(([v,l])=>`<button type="button" class="chip ${set.has(v)?'sel':''}" ${attr}="${v}">${l}</button>`).join('');
  openSheet(`<div class="title-lg">${id?'Rehab egzersizini düzenle':'Yeni rehab egzersizi'}</div>
    <div style="height:12px"></div>
    <label class="fld">Ad</label><input type="text" id="rename" value="${base?esc(base.name):''}">
    <div style="height:12px"></div>
    <label class="fld">Birim</label>
    <div class="seg" id="reunit"><button type="button" class="${st.unit==='tekrar'?'on':''}" data-u="tekrar">tekrar</button><button type="button" class="${st.unit==='sn'?'on':''}" data-u="sn">sn</button><button type="button" class="${st.unit==='dk'?'on':''}" data-u="dk">dk</button></div>
    <div style="height:12px"></div>
    <div style="display:flex;gap:12px"><div style="flex:1"><label class="fld">Set</label><input type="number" id="rsets" value="${base?base.targets[0].sets:3}"></div>
      <div style="flex:1"><label class="fld" id="rsvl">Değer (${esc(st.unit)})</label><input type="number" id="rsv" value="${base?fmt(base.targets[0].v):10}"></div></div>
    <div style="height:10px"></div><label class="fld">Döngü artışı (her 4 haftada değere eklenir, opsiyonel)</label><input type="number" id="rstep" value="${base?fmt(base.step):0}">
    ${sec('Günler')}<div class="chipwrap" id="redays">${chip(dItems,st.days,'data-cd')}</div>
    ${sec('Kas grubu (opsiyonel, sadece gösterim)')}<div class="chipwrap" id="remus">${chip(mItems,st.muscles,'data-m')}</div>
    ${sec('Sistem (opsiyonel, sadece gösterim)')}<div class="chipwrap" id="resys">${chip(sItems,st.systems,'data-s')}</div>
    <div style="height:8px"></div><div id="rerh">Varsayılan zorluk (RPE): ${st.rpe}</div>
    <input type="range" min="1" max="10" step="1" value="${st.rpe}" id="rerpe">
    <div style="height:10px"></div><label class="fld">Tempo (sn, opsiyonel) — ör. 3-1-1-0</label>
    <input type="text" id="retempo" inputmode="numeric" value="${base?esc(base.tempo||''):''}" placeholder="3-1-1-0">
    <div style="height:10px"></div><label class="fld">Not (opsiyonel)</label><textarea id="renote">${base?esc(base.note):''}</textarea>
    <div class="errmsg" id="reerr" style="display:none"></div>
    <div style="height:12px"></div><button class="fill block" id="resave">${id?'Kaydet':'Ekle'}</button>
    ${id?`<div style="text-align:center;margin-top:6px"><button class="text" id="redel" style="color:var(--red)">Rehab egzersizini sil</button></div>`:''}`);
  overlay.querySelector('#reunit').onclick=ev=>{const b=ev.target.closest('[data-u]');if(!b)return;st.unit=b.dataset.u;
    overlay.querySelectorAll('#reunit button').forEach(x=>x.classList.toggle('on',x===b));
    overlay.querySelector('#rsvl').textContent=`Değer (${st.unit})`;};
  const grp=(sel,set,ds)=>overlay.querySelectorAll(sel+' [data-'+ds+']').forEach(b=>b.onclick=()=>{const raw=b.dataset[ds];const v=ds==='cd'?+raw:raw;if(set.has(v))set.delete(v);else set.add(v);b.classList.toggle('sel');});
  grp('#redays',st.days,'cd');grp('#remus',st.muscles,'m');grp('#resys',st.systems,'s');
  overlay.querySelector('#rerpe').oninput=ev=>{st.rpe=+ev.target.value;overlay.querySelector('#rerh').textContent=`Varsayılan zorluk (RPE): ${st.rpe}`;};
  overlay.querySelector('#resave').onclick=()=>{
    const err=overlay.querySelector('#reerr'),name=overlay.querySelector('#rename').value.trim();
    const num=el=>parseFloat((overlay.querySelector(el).value||'').replace(',','.'));
    const s=parseInt(overlay.querySelector('#rsets').value,10),v=num('#rsv');
    if(!name){err.textContent='Ad gir.';err.style.display='block';return;}
    if(isNaN(s)||s<1||isNaN(v)||v<=0){err.textContent='Set ve değer alanlarını doldur.';err.style.display='block';return;}
    if(!st.days.size){err.textContent='En az bir gün seç.';err.style.display='block';return;}
    const muscles={},systems={};for(const m of st.muscles)muscles[m]=1;for(const sy of st.systems)systems[sy]=1;
    const def={name,unit:st.unit,days:[...st.days].sort((a,b)=>a-b),targets:[{sets:s,v},{sets:s,v},{sets:s,v},{sets:s,v}],
      step:isNaN(num('#rstep'))?0:num('#rstep'),rpe:st.rpe,muscles,systems,note:overlay.querySelector('#renote').value.trim(),
      tempo:(overlay.querySelector('#retempo').value||'').replace(/[^0-9-]/g,'').replace(/-+/g,'-').replace(/^-|-$/g,'')};
    saveRehabExercise(id,def);closeOverlay();};
  const db=overlay.querySelector('#redel');if(db)db.onclick=()=>{if(confirm('Bu rehab egzersizi silinsin mi?')){removeRehabExercise(id);closeOverlay();}};
}
