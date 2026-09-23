// Egzersiz editörü.
import {S} from '../durum.js';
import {removeCustom,resetExercise,saveExercise} from '../eylemler.js';
import {kCatalog} from '../katalog.js';
import {autoTargets,detectAuto} from '../mantik/program.js';
import {exRecovery} from '../mantik/toparlanma.js';
import {MINFO,M_ORDER,SINFO,S_ORDER,kDayShort} from '../sabitler.js';
import {sec} from './html.js';
import {closeOverlay,openSheet,overlay} from './overlay.js';
import {esc,fmt} from '../yardimcilar.js';

/* ── egzersiz editörü ── */
export function openEditor(id){
  const base=id?S.ex(id):null,isCat=base&&!base.custom;
  const st={unit:base?base.unit:'tekrar',rpe:base?base.rpe:5,impact:base?base.impact:false,halfRec:base?base.halfRec:false,
    days:new Set(base?base.days:[]),prim:new Set(base?Object.keys(base.muscles).filter(k=>base.muscles[k]>=1):[]),
    aux:new Set(base?Object.keys(base.muscles).filter(k=>base.muscles[k]<1):[]),
    primS:new Set(base?Object.keys(base.systems).filter(k=>base.systems[k]>=1):[]),
    auxS:new Set(base?Object.keys(base.systems).filter(k=>base.systems[k]<1):[])};
  const tg=base?base.targets.map(t=>({sets:t.sets,v:t.v})):[{sets:3,v:10}];while(tg.length<4)tg.push({sets:tg[0].sets,v:tg[0].v});
  const flat=tg.every(t=>t.sets===tg[0].sets&&t.v===tg[0].v);
  const auto=flat?null:detectAuto(tg);
  const tmode={m:flat?'flat':auto?'auto':'manual'};
  const aI=auto?auto.inc:(st.unit==='tekrar'?1:5),aP=auto?auto.pct:70,aB=auto?auto.base:tg[0].v,aS=auto?auto.sets:tg[0].sets;
  const patterns=[...new Set(kCatalog.map(e=>e.pattern))];
  const chip=(items,set,attr,aux)=>items.map(([v,l])=>`<button type="button" class="chip ${aux?'aux ':''}${set.has(v)?'sel':''}" ${attr}="${v}">${l}</button>`).join('');
  const mItems=M_ORDER.map(m=>[m,esc(MINFO[m].label)]),sItems=S_ORDER.map(s=>[s,SINFO[s].icon+' '+esc(SINFO[s].label)]),dItems=[1,2,3,4,5,6,7].map(i=>[i,kDayShort[i-1]]);
  openSheet(`<div class="title-lg">${id?(isCat?'Egzersizi düzenle':'Özel egzersiz'):'Yeni egzersiz'}</div>
    <div style="height:12px"></div>
    <label class="fld">Ad</label><input type="text" id="ename" value="${base?esc(base.name):''}">
    <div style="height:12px"></div>
    <label class="fld">Kalıp (Denge'deki kalıp analizi bunu kullanır)</label>
    <input type="text" id="epat" list="patlist" value="${base?esc(base.pattern):''}" placeholder="ör. Yatay itme, Dikey çekme">
    <datalist id="patlist">${patterns.map(p=>`<option value="${esc(p)}">`).join('')}</datalist>
    <div style="height:12px"></div>
    <label class="fld">Birim</label>
    <div class="seg" id="eunit"><button type="button" class="${st.unit==='tekrar'?'on':''}" data-u="tekrar">tekrar</button><button type="button" class="${st.unit==='sn'?'on':''}" data-u="sn">sn</button><button type="button" class="${st.unit==='dk'?'on':''}" data-u="dk">dk</button></div>
    ${sec('Set ve tekrar')}
    <div class="seg" id="etmode"><button type="button" class="${tmode.m==='flat'?'on':''}" data-tm="flat">Sabit</button><button type="button" class="${tmode.m==='auto'?'on':''}" data-tm="auto">Otomatik</button><button type="button" class="${tmode.m==='manual'?'on':''}" data-tm="manual">Elle</button></div>
    <div id="pflat" style="display:${tmode.m==='flat'?'block':'none'};margin-top:10px">
      <div style="display:flex;gap:12px"><div style="flex:1"><label class="fld">Set</label><input type="number" id="ss" value="${tg[0].sets}"></div>
        <div style="flex:1"><label class="fld" id="svl">Değer (${esc(st.unit)})</label><input type="number" id="sv" value="${fmt(tg[0].v)}"></div></div>
    </div>
    <div id="pauto" style="display:${tmode.m==='auto'?'block':'none'};margin-top:10px">
      <div class="muted tiny" style="margin-bottom:8px">Başlangıç haftasını gir; 2. ve 3. hafta artar, deload düşer. Grease the Groove: küçük artış, düşük efor.</div>
      <div style="display:flex;gap:12px"><div style="flex:1"><label class="fld">Set</label><input type="number" id="asets" value="${aS}"></div>
        <div style="flex:1"><label class="fld" id="abl">Başlangıç (${esc(st.unit)})</label><input type="number" id="abase" value="${fmt(aB)}"></div></div>
      <div style="display:flex;gap:12px;margin-top:10px"><div style="flex:1"><label class="fld">Haftalık artış (+)</label><input type="number" id="ainc" value="${fmt(aI)}"></div>
        <div style="flex:1"><label class="fld">Deload yükü (%)</label><input type="number" id="apct" value="${aP}"></div></div>
      <div id="aprev" class="muted small" style="margin-top:10px"></div>
    </div>
    <div id="pmanual" style="display:${tmode.m==='manual'?'block':'none'};margin-top:10px">
      <div class="grid4"><div></div><div class="gh">Set</div><div class="gh">Değer</div>
        <div class="gh">Hafta 1</div><input type="number" id="ts0" value="${tg[0].sets}"><input type="number" id="tv0" value="${fmt(tg[0].v)}">
        <div class="gh">Hafta 2</div><input type="number" id="ts1" value="${tg[1].sets}"><input type="number" id="tv1" value="${fmt(tg[1].v)}">
        <div class="gh">Hafta 3</div><input type="number" id="ts2" value="${tg[2].sets}"><input type="number" id="tv2" value="${fmt(tg[2].v)}">
        <div class="gh">Deload</div><input type="number" id="ts3" value="${tg[3].sets}"><input type="number" id="tv3" value="${fmt(tg[3].v)}"></div>
      <div class="muted tiny" style="margin-top:6px">Bir haftada set = 0 girersen o hafta egzersiz gösterilmez.</div>
    </div>
    <div style="height:12px"></div>
    <label class="fld">Döngü artışı (her 4 haftada değere eklenir)</label><input type="number" id="estep" value="${base?fmt(base.step):0}">
    ${sec('Günler')}<div class="chipwrap" id="edays">${chip(dItems,st.days,'data-cd')}</div>
    ${sec('Ana kas grupları','Ağırlık 1 · Denge ve boşluk analizini besler')}<div class="chipwrap" id="eprim">${chip(mItems,st.prim,'data-m')}</div>
    ${sec('Yardımcı kas grupları','Ağırlık 0,5')}<div class="chipwrap" id="eaux">${chip(mItems,st.aux,'data-m',true)}</div>
    ${sec('Ana sistemler','Ağırlık 1 · toparlanma bunlara göre sayılır')}<div class="chipwrap" id="eprims">${chip(sItems,st.primS,'data-s')}</div>
    ${sec('Yardımcı sistemler','Ağırlık 0,5')}<div class="chipwrap" id="eauxs">${chip(sItems,st.auxS,'data-s',true)}</div>
    ${sec('Diğer')}
    <div class="swrow"><label class="sw"><input type="checkbox" id="eimp" ${st.impact?'checked':''}><span class="tr"></span><span class="kn"></span></label><div>Darbeli (tendon/kemik/reaktif toparlanmasını hesaba katar)</div></div>
    <div class="swrow"><label class="sw"><input type="checkbox" id="ehalf" ${st.halfRec?'checked':''}><span class="tr"></span><span class="kn"></span></label><div>Çar/Paz günleri yarım hacim</div></div>
    <div style="height:8px"></div><div id="erh">Varsayılan zorluk (RPE): ${st.rpe}</div>
    <input type="range" min="1" max="10" step="1" value="${st.rpe}" id="erpe">
    <div style="height:10px"></div><label class="fld">Tempo (sn, opsiyonel) — ör. 3-1-1-0 (iniş-bekle-çıkış-bekle). Tekrar birimli egzersizlerde 🎵 metronom açar.</label>
    <input type="text" id="etempo" inputmode="numeric" value="${base?esc(base.tempo||''):''}" placeholder="3-1-1-0">
    <div style="height:10px"></div><label class="fld">İyileşme süresi (saat, opsiyonel) — boş bırakırsan ana sistemlerinin en uzunundan türetilir</label>
    <input type="number" id="erecovery" inputmode="decimal" value="${base?esc(base.recovery||''):''}" placeholder="${base?exRecovery(base):48}">
    <div style="height:8px"></div><label class="fld">Not (opsiyonel)</label><textarea id="enote">${base?esc(base.note):''}</textarea>
    <div class="errmsg" id="eerr" style="display:none"></div>
    <div style="height:12px"></div><button class="fill block" id="esave">${id?'Kaydet':'Programa ekle'}</button>
    ${isCat&&S.overrides[id]?`<div style="text-align:center;margin-top:6px"><button class="text" id="ereset">Varsayılana döndür</button></div>`:''}
    ${base&&base.custom?`<div style="text-align:center;margin-top:6px"><button class="text" id="edel" style="color:var(--red)">Egzersizi sil</button></div>`:''}`);
  // wiring
  overlay.querySelector('#eunit').onclick=ev=>{const b=ev.target.closest('[data-u]');if(!b)return;st.unit=b.dataset.u;
    overlay.querySelectorAll('#eunit button').forEach(x=>x.classList.toggle('on',x===b));
    const sv=overlay.querySelector('#svl');if(sv)sv.textContent=`Değer (${st.unit})`;
    const ab=overlay.querySelector('#abl');if(ab)ab.textContent=`Başlangıç (${st.unit})`;};
  const num=el=>parseFloat((overlay.querySelector(el).value||'').replace(',','.'));
  const autoPrev=()=>{const s=parseInt(overlay.querySelector('#asets').value,10),b=num('#abase'),i=num('#ainc'),p=num('#apct');
    const pv=overlay.querySelector('#aprev');if(!pv)return;
    if(isNaN(s)||isNaN(b)||isNaN(i)||isNaN(p)){pv.textContent='Önizleme için alanları doldur.';return;}
    const t=autoTargets(s,b,i,p);pv.innerHTML='Önizleme → '+t.map((x,k)=>`<b>${['H1','H2','H3','Deload'][k]}</b> ${x.sets}×${fmt(x.v)}`).join(' · ');};
  overlay.querySelector('#etmode').onclick=ev=>{const b=ev.target.closest('[data-tm]');if(!b)return;tmode.m=b.dataset.tm;
    overlay.querySelectorAll('#etmode button').forEach(x=>x.classList.toggle('on',x===b));
    overlay.querySelector('#pflat').style.display=tmode.m==='flat'?'block':'none';
    overlay.querySelector('#pauto').style.display=tmode.m==='auto'?'block':'none';
    overlay.querySelector('#pmanual').style.display=tmode.m==='manual'?'block':'none';
    if(tmode.m==='auto')autoPrev();};
  ['#asets','#abase','#ainc','#apct'].forEach(s=>{const el=overlay.querySelector(s);if(el)el.oninput=autoPrev;});
  autoPrev();
  const grp=(sel,set,ds)=>overlay.querySelectorAll(sel+' [data-'+ds+']').forEach(b=>b.onclick=()=>{const raw=b.dataset[ds];const v=ds==='cd'?+raw:raw;if(set.has(v))set.delete(v);else set.add(v);b.classList.toggle('sel');});
  grp('#edays',st.days,'cd');grp('#eprim',st.prim,'m');grp('#eaux',st.aux,'m');grp('#eprims',st.primS,'s');grp('#eauxs',st.auxS,'s');
  overlay.querySelector('#erpe').oninput=ev=>{st.rpe=+ev.target.value;overlay.querySelector('#erh').textContent=`Varsayılan zorluk (RPE): ${st.rpe}`;};
  overlay.querySelector('#esave').onclick=()=>{
    const err=overlay.querySelector('#eerr'),name=overlay.querySelector('#ename').value.trim();
    let targets;
    if(tmode.m==='flat'){const s=parseInt(overlay.querySelector('#ss').value,10),v=num('#sv');
      if(!name||isNaN(s)||s<1||isNaN(v)||v<=0){err.textContent='Ad, set ve değer alanlarını doldur.';err.style.display='block';return;}
      targets=[{sets:s,v},{sets:s,v},{sets:s,v},{sets:s,v}];}
    else if(tmode.m==='auto'){const s=parseInt(overlay.querySelector('#asets').value,10),b=num('#abase'),i=num('#ainc'),p=num('#apct');
      if(!name||isNaN(s)||s<1||isNaN(b)||b<=0||isNaN(i)||isNaN(p)){err.textContent='Ad ve otomatik ilerleme alanlarını doldur.';err.style.display='block';return;}
      targets=autoTargets(s,b,i,p);}
    else{targets=[];for(let i=0;i<4;i++){const s=parseInt(overlay.querySelector('#ts'+i).value,10),v=num('#tv'+i);
      if(isNaN(s)||s<0||isNaN(v)||v<0){err.textContent='Tüm hafta değerlerini doldur (set 0 = o hafta yok).';err.style.display='block';return;}targets.push({sets:s,v});}
      if(!name){err.textContent='Ad gir.';err.style.display='block';return;}
      if(targets.every(t=>t.sets===0)){err.textContent='En az bir haftada set > 0 olmalı.';err.style.display='block';return;}}
    if(!st.prim.size){err.textContent='En az bir ana kas grubu seç.';err.style.display='block';return;}
    if(!st.primS.size){err.textContent='En az bir ana sistem seç.';err.style.display='block';return;}
    if(!st.days.size){err.textContent='En az bir gün seç.';err.style.display='block';return;}
    const muscles={},systems={};
    for(const m of st.prim)muscles[m]=1;for(const m of st.aux)if(!muscles[m])muscles[m]=.5;
    for(const s of st.primS)systems[s]=1;for(const s of st.auxS)if(!systems[s])systems[s]=.5;
    const def={name,pattern:overlay.querySelector('#epat').value.trim()||'Özel',unit:st.unit,days:[...st.days].sort((a,b)=>a-b),
      rpe:st.rpe,impact:overlay.querySelector('#eimp').checked,halfRec:overlay.querySelector('#ehalf').checked,
      step:isNaN(num('#estep'))?0:num('#estep'),muscles,systems,targets,note:overlay.querySelector('#enote').value.trim(),
      tempo:(overlay.querySelector('#etempo').value||'').replace(/[^0-9-]/g,'').replace(/-+/g,'-').replace(/^-|-$/g,''),
      recovery:(function(){const rv=parseFloat((overlay.querySelector('#erecovery').value||'').replace(',','.'));return isNaN(rv)||rv<=0?'':rv;})()};
    saveExercise(id,def);closeOverlay();};
  const rb=overlay.querySelector('#ereset');if(rb)rb.onclick=()=>{resetExercise(id);closeOverlay();};
  const db=overlay.querySelector('#edel');if(db)db.onclick=()=>{if(confirm('Bu özel egzersiz silinsin mi?')){removeCustom(id);closeOverlay();}};
}
