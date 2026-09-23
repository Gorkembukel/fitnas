// Rekor sekmesi.
import {S} from '../durum.js';
import {addMax,setMaxRecovery,setTestInterval} from '../eylemler.js';
import {calibSuggest,lastMax,maxDue,maxHistory,pendingCalib} from '../mantik/rekor.js';
import {SINFO,kIntervals} from '../sabitler.js';
import {noteBox,sec} from '../ui/html.js';
import {closeOverlay,openDialog,openSheet,overlay} from '../ui/overlay.js';
import {dOnly,dayKey,daysSince,dm,esc,fmt} from '../yardimcilar.js';

/* ══════════════ REKOR (MAX) ══════════════ */
export function renderMax(){
  const withHist=S.all().filter(e=>maxHistory(e.id).length>0);
  const due=withHist.filter(e=>maxDue(e.id));
  let h=`<div style="height:8px"></div>
    <div class="card tight"><div style="display:flex;align-items:center;gap:12px"><div style="font-size:22px">🗓️</div>
      <div style="flex:1"><div style="font-weight:600">Test aralığı: her ${S.testInterval} gün</div>
        <div class="muted small">${withHist.length} egzersiz takip ediliyor · ${due.length} tanesi test zamanı</div></div>
      <button class="text" data-act="interval">Değiştir</button></div></div>
    <button class="fill block" data-act="addmax">＋ Rekor / max testi gir</button>`;
  const pending=pendingCalib();
  if(pending.length){h+=sec('Kalibrasyon bekleyen testler','Bu testten sonra tam toparlanana kadar geçen süreyi gir; sistemin toparlanma sabiti için öneri hesaplanır');
    for(const m of pending){const e=S.ex(m.e);if(!e)continue;
      h+=`<div class="card tight"><div style="display:flex;align-items:center;gap:10px">
        <div style="flex:1"><div style="font-weight:600">${esc(e.name)}</div><div class="muted tiny">${dm(new Date(m.t))} · ${fmt(m.v)} ${esc(e.unit)}</div></div>
        <button class="out" data-act="calibopen" data-id="${e.id}" data-t="${m.t}">Toparlanma süresini gir</button></div></div>`;}}
  if(due.length){h+=sec('Test zamanı geldi','Bu egzersizlerde son testin üzerinden yeterince zaman geçti');for(const e of due)h+=maxCard(e,true);}
  h+=sec(withHist.length?'Takip edilen rekorlar':'Rekorlar');
  if(!withHist.length)h+=noteBox('Henüz rekor girilmedi. Yukarıdaki düğmeyle bir egzersiz seç ve maksimum değerini kaydet. Girdiğin her rekor Sıradaki sekmesindeki kriterleri de günceller.',{icon:'🏅'});
  for(const e of withHist.filter(e=>!maxDue(e.id)))h+=maxCard(e,false);
  return h;
}
export function maxCard(e,isDue){
  const hist=maxHistory(e.id),last=hist[hist.length-1],prev=hist.length>1?hist[hist.length-2]:null;
  const d=prev?last.v-prev.v:null,since=daysSince(last.t),mx=Math.max(...hist.map(m=>m.v));
  let mini='';for(const m of hist.slice(-6)){const hgt=6+28*(mx===0?0:m.v/mx);mini+=`<div class="mb" style="height:${hgt}px;opacity:${m===last?1:.5}"></div>`;}
  return `<div class="card tight">
    <div style="display:flex;align-items:center;gap:8px"><div style="flex:1;font-weight:600;font-size:15px">${esc(e.name)}</div>${isDue?'<span class="badge due">test zamanı</span>':''}</div>
    <div style="display:flex;align-items:flex-end;gap:10px;margin-top:6px">
      <div style="font-size:28px;font-weight:600">${fmt(last.v)}<span style="font-size:14px;font-weight:400"> ${esc(e.unit)}</span></div>
      ${d!==null?`<div style="color:${d>=0?'var(--green)':'var(--red)'};font-size:13px;padding-bottom:6px;font-weight:600">${d>=0?'▲':'▼'} ${fmt(Math.abs(d))}</div>`:''}
      <div class="spacer"></div><div class="mini">${mini}</div></div>
    <div class="muted small" style="margin-top:6px">Son test: ${dm(new Date(last.t))} · ${since} gün önce · ${hist.length} kayıt</div>
    <div style="text-align:right;margin-top:8px"><button class="${isDue?'fill':'out'}" data-act="retest" data-id="${e.id}">Yeniden test et</button></div></div>`;
}
/* ── max sheet ── */
export function openMax(fixedId){
  const list=S.all();let cur=fixedId||list[0].id,e=S.ex(cur);
  const stepFor=x=>e.unit==='tekrar'?1:e.unit==='sn'?5:(x>=30?5:1);
  const lm=lastMax(cur);let v=lm?lm.v:(e.targets[0]?e.targets[0].v:1),dateStr=dayKey(dOnly(new Date()));
  const picker=fixedId?'':`<label class="fld">Egzersiz</label><select id="mex">${list.map(x=>`<option value="${x.id}" ${x.id===cur?'selected':''}>${esc(x.name)}</option>`).join('')}</select><div style="height:12px"></div>`;
  openSheet(`<div class="title-lg">${fixedId?esc(e.name)+' — yeni test':'Rekor / max gir'}</div><div style="height:10px"></div>${picker}
    <label class="fld">Maksimum değer</label>
    <div style="display:flex;align-items:center;justify-content:center;gap:24px;margin:6px 0 12px">
      <button class="roundbtn" id="mmin">−</button><div style="font-size:28px;font-weight:500;min-width:120px;text-align:center" id="mvalv">${fmt(v)} ${esc(e.unit)}</div><button class="roundbtn" id="mpl">＋</button></div>
    <label class="fld">Tarih</label><input type="date" id="mdate" value="${dateStr}">
    <div style="height:12px"></div><button class="fill block" id="msv">✓ Kaydet</button>`);
  const upd=()=>overlay.querySelector('#mvalv').textContent=`${fmt(v)} ${e.unit}`;
  overlay.querySelector('#mmin').onclick=()=>{v=Math.max(0,v-stepFor(v));upd();};
  overlay.querySelector('#mpl').onclick=()=>{v=v+stepFor(v);upd();};
  const sel=overlay.querySelector('#mex');
  if(sel)sel.onchange=()=>{cur=sel.value;e=S.ex(cur);const l=lastMax(cur);v=l?l.v:(e.targets[0]?e.targets[0].v:1);upd();};
  overlay.querySelector('#mdate').onchange=ev=>{if(ev.target.value)dateStr=ev.target.value;};
  overlay.querySelector('#msv').onclick=()=>{addMax(cur,v,new Date(dateStr+'T12:00:00').getTime());closeOverlay();};
}
/* ── kalibrasyon sheet'leri ── */
export function openCalibInput(id,t){
  const e=S.ex(id),m=S.maxes.find(x=>x.e===id&&x.t===t);if(!e||!m)return;
  let h=m.recH!=null?m.recH:48;
  openSheet(`<div class="title-lg">${esc(e.name)} — toparlanma süresi</div>
    <div class="muted small" style="margin:8px 0 12px">${dm(new Date(m.t))} tarihindeki maksimum testten (RPE10 kabul edilir) sonra, bu hareketi tekrar tam güçle yapabilecek kadar toparlanana dek kaç saat geçti?</div>
    <div style="display:flex;align-items:center;justify-content:center;gap:24px;margin:6px 0 16px">
      <button class="roundbtn" id="chmin">−</button><div style="font-size:28px;font-weight:500;min-width:110px;text-align:center" id="chv">${h} sa</div><button class="roundbtn" id="chpl">＋</button></div>
    <button class="fill block" id="chsv">✓ Kaydet ve öneriyi gör</button>`);
  const upd=()=>overlay.querySelector('#chv').textContent=`${h} sa`;
  overlay.querySelector('#chmin').onclick=()=>{h=Math.max(1,h-6);upd();};
  overlay.querySelector('#chpl').onclick=()=>{h=h+6;upd();};
  overlay.querySelector('#chsv').onclick=()=>{setMaxRecovery(id,t,h);openCalibSuggest(id,t);};
}
export function openCalibSuggest(id,t){
  const e=S.ex(id),m=S.maxes.find(x=>x.e===id&&x.t===t);if(!e||!m||m.recH==null)return;
  const sug=calibSuggest(e,m.recH);
  let rows='';for(const r of sug){const s1=Math.round(r.suggest);
    rows+=`<div class="card tight"><div style="display:flex;align-items:center;gap:10px">
      <div style="font-size:20px">${SINFO[r.s].icon}</div>
      <div style="flex:1"><div style="font-weight:600">${esc(SINFO[r.s].label)}</div>
        <div class="muted tiny">şu an ${Math.round(r.cur)} sa${r.w<1?' · yardımcı sistem':''}</div></div>
      <button class="out" data-act="calibapply" data-s="${r.s}" data-v="${s1}">${s1} sa uygula</button></div></div>`;}
  openSheet(`<div class="title-lg">${esc(e.name)} — kalibrasyon önerisi</div>
    <div class="muted small" style="margin:8px 0 12px">${m.recH} saatlik gerçek toparlanmana göre, bu hareketi yükleyen sistemler için önerilen toparlanma süreleri. İstediğini uygula, ayarlar hemen değişir.</div>
    ${rows}
    <button class="text block" data-close style="margin-top:8px">Kapat</button>`);
}
export function openInterval(){
  openDialog(`<div class="title-md" style="margin-bottom:12px">Max test aralığı</div>
    <div class="muted small" style="margin-bottom:12px">Bir rekorun üzerinden bu kadar gün geçince "test zamanı" uyarısı çıkar.</div>
    <div class="chipwrap">${kIntervals.map(o=>`<button class="chip ${S.testInterval===o?'sel':''}" data-int="${o}">${o} gün</button>`).join('')}</div>
    <div style="text-align:right;margin-top:16px"><button class="text" data-close>Kapat</button></div>`);
  overlay.querySelectorAll('[data-int]').forEach(b=>b.onclick=()=>{setTestInterval(+b.dataset.int);closeOverlay();});
}
