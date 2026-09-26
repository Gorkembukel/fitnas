// Özet sekmesi: Panel | Takvim | Egzersiz.
import {S} from '../durum.js';
import {addMetric} from '../eylemler.js';
import {painAt,painStatus} from '../mantik/agri.js';
import {monthAgg} from '../mantik/analiz.js';
import {currentChain,doneMap,doneSetsOn,oneoffIds,oneoffTarget,oneoffsOn,phaseOf,plannedOn,plannedSets,schedChangesOn,streak,target,weekNo} from '../mantik/program.js';
import {bestOf} from '../mantik/rekor.js';
import {M_ORDER,PAIN_AMBER,PAIN_AREAS,PAIN_LVL,PHASE,SINFO,S_ORDER,kDayNames,kGrpOrder,kKinds,kMonths,kSessions} from '../sabitler.js';
import {U} from '../ui/durum-ui.js';
import {barHtml,exTags,noteBox,sec,statTile} from '../ui/html.js';
import {closeOverlay,openDialog,openSheet,overlay} from '../ui/overlay.js';
import {addMonths,dOnly,dayKey,daysSince,dm,dt,esc,fmt,monthStart,sameDay,weekday} from '../yardimcilar.js';

/* ══════════════ ÖZET (Panel / Takvim / Egzersiz) ══════════════ */
export function renderProgress(){
  let h=`<div style="height:8px"></div><div class="seg">
    <button class="${U.progMode===0?'on':''}" data-act="progmode" data-v="0">📊 Panel</button>
    <button class="${U.progMode===1?'on':''}" data-act="progmode" data-v="1">📆 Takvim</button>
    <button class="${U.progMode===2?'on':''}" data-act="progmode" data-v="2">📈 Egzersiz</button></div><div style="height:8px"></div>`;
  h+=U.progMode===0?renderPanel():U.progMode===1?renderCalendar():renderExProgress();
  return h;
}
export function renderPanel(){
  if(!U.panelMonth)U.panelMonth=monthStart(new Date());
  const y=U.panelMonth.getFullYear(),mo=U.panelMonth.getMonth();
  const A=monthAgg(y,mo),prev=addMonths(U.panelMonth,-1),P=monthAgg(prev.getFullYear(),prev.getMonth());
  const adh=A.plan?Math.round(A.done*100/A.plan):0,padh=P.plan?Math.round(P.done*100/P.plan):0;
  const sysCov=S_ORDER.filter(s=>A.sl[s]>0).length,musCov=M_ORDER.filter(m=>A.ml[m]>0).length;
  const delta=(a,b,suf='')=>{if(b===0&&a===0)return '';const d=a-b;const c=d>=0?'var(--green)':'var(--red)';return ` <span style="color:${c};font-size:11px">${d>=0?'▲':'▼'}${fmt(Math.abs(d))}${suf}</span>`;}
  let h=`<div class="card tight"><div style="display:flex;align-items:center">
     <button class="iconbtn" data-act="panelprev">‹</button>
     <div style="flex:1;text-align:center;font-weight:600">${kMonths[mo]} ${y}</div>
     <button class="iconbtn" data-act="panelnext">›</button></div></div>`;
  h+=sec('Nicelik','Bu ay ne kadar çalıştın');
  h+=`<div class="stats">${statTile('Antrenman günü',A.daysTrained)}${statTile('Toplam set',A.sets)}${statTile('Farklı egzersiz',A.ex)}</div>`;
  const unitOrder=['tekrar','sn','dk'],repsTxt=unitOrder.filter(u=>A.repsByUnit[u]).map(u=>`${fmt(A.repsByUnit[u])} ${u}`).join(' · ')||'—';
  h+=`<div class="stats" style="margin-top:8px">${statTile('Toplam tekrar/sn',repsTxt)}${statTile('Seri (gün)',currentChain())}${statTile('Uyum',adh+'%')}</div>`;
  h+=sec('Nitelik','Nasıl geçti');
  h+=`<div class="card tight">
    <div class="mrow"><div style="flex:1">Plana uyum</div><div style="font-weight:600">${adh}%${delta(adh,padh,'%')}</div></div>
    <div class="mrow"><div style="flex:1">Ortalama RPE (efor)</div><div style="font-weight:600">${A.avgRpe?A.avgRpe.toFixed(1):'—'}${A.avgRpe&&P.avgRpe?delta(+A.avgRpe.toFixed(1),+P.avgRpe.toFixed(1)):''}</div></div>
    <div class="mrow"><div style="flex:1">Sistem kapsamı</div><div style="font-weight:600">${sysCov}/8</div></div>
    <div class="mrow"><div style="flex:1">Kas grubu kapsamı</div><div style="font-weight:600">${musCov}/14</div></div>
    <div class="mrow" style="border:none"><div style="flex:1">Önceki aya göre set</div><div style="font-weight:600">${A.sets}${delta(A.sets,P.sets)}</div></div></div>`;
  h+=sec('Sistem uyaranı','Bu ay her sisteme kaç ağırlıklı set geldi');
  const maxS=Math.max(1,...Object.values(A.sl));
  for(const s of S_ORDER){h+=`<div class="mrow"><div class="ml" style="width:120px">${SINFO[s].icon} ${esc(SINFO[s].label)}</div><div style="flex:1">${barHtml(A.sl[s]/maxS,{color:SINFO[s].color,cls:'md',bg:'var(--surfhi)'})}</div><div class="mv">${fmt(A.sl[s])}</div></div>`;}
  h+=sec('Kalıp dengesi','Bu ay set sayısı');
  const pm=k=>{let n=0;for(const l of A.logs){const e=S.ex(l.e);if(e&&e.pattern.includes(k))n++;}return n;};
  for(const p of [['İtme','itme','Çekme','çekme'],['Diz baskın','Diz baskın','Kalça baskın','Kalça baskın']]){
    const a=pm(p[1]),b=pm(p[3]);const low=a>0&&b<a*S.cfg.balanceRatio?p[2]:(b>0&&a<b*S.cfg.balanceRatio?p[0]:null);
    h+=noteBox(`${p[0]} ${a} · ${p[2]} ${b}${low?'  →  '+low+' geride':''}`,{color:low?'var(--orange)':'var(--green)',icon:low?'⚖️':'✓'});}
  if(A.sets===0)h+=noteBox('Bu ay henüz kayıt yok.',{icon:'📭'});
  return h;
}
export function renderCalendar(){
  if(!U.calMonth)U.calMonth=monthStart(new Date());
  const y=U.calMonth.getFullYear(),mo=U.calMonth.getMonth();
  const first=new Date(y,mo,1),lead=weekday(first)-1,dim=new Date(y,mo+1,0).getDate(),today=new Date();
  let mplan=0,mdone=0;for(let dn=1;dn<=dim;dn++){const dd=new Date(y,mo,dn);if(dd>dOnly(today))break;const p=plannedSets(dd);mplan+=p;mdone+=Math.min(p,doneSetsOn(dd));}
  const adh=mplan?Math.round(mdone*100/mplan):0;
  let h=`<div class="card tight"><div style="display:flex;align-items:center">
     <button class="iconbtn" data-act="calprev">‹</button>
     <div style="flex:1;text-align:center;font-weight:600">${kMonths[mo]} ${y}</div>
     <button class="iconbtn" data-act="calnext">›</button></div></div>`;
  h+=`<div class="stats"><div class="stat"><div class="l">Zincir</div><div class="v">${currentChain()} <span style="font-size:13px">🔥</span></div></div>${statTile('Ay uyumu',adh+'%')}${statTile('Bu ay gün',new Set(S.logs.filter(l=>{const d=dt(l);return d.getFullYear()===y&&d.getMonth()===mo;}).map(l=>dayKey(dt(l)))).size)}</div>`;
  h+=`<div style="height:10px"></div><div class="cal">`+['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'].map(w=>`<div class="wh">${w}</div>`).join('');
  for(let i=0;i<lead;i++)h+=`<div class="cell empty"></div>`;
  for(let dn=1;dn<=dim;dn++){
    const date=new Date(y,mo,dn),pre=dOnly(date)<S.start,ph=phaseOf(date);
    const planned=plannedSets(date),done=doneSetsOn(date),isToday=sameDay(date,today);
    const ch=schedChangesOn(date),hasAdd=ch.some(c=>c.op==='add'),hasRem=ch.some(c=>c.op==='remove');
    const hasExtra=oneoffIds(dayKey(date)).length>0;
    const pd=painDay(date);
    const fresh=ch.some(c=>daysSince(c.t)<=3);
    const bg=ph!==null?`background:color-mix(in srgb,${PHASE[ph].c} 16%,transparent);box-shadow:inset 3px 0 0 ${PHASE[ph].c};`:'';
    const fill=planned>0?Math.min(1,done/planned):(done>0?1:0);
    h+=`<div class="cell${pre?' pre':''}${isToday?' today':''}" style="${bg}" data-act="dayopen" data-date="${dayKey(date)}">
      <div class="dn">${dn}</div>
      ${(planned>0||done>0)?`<div class="frac">${done}/${planned}</div>`:''}
      ${planned>0&&done>=planned?'<div class="chk">✓</div>':''}
      ${(planned>0||done>0)?`<div class="dot"><i style="width:${fill*100}%"></i></div>`:''}
      ${hasExtra?'<span class="mk extra"></span>':''}
      ${hasAdd?`<span class="mk add${fresh?' fresh':''}"></span>`:''}
      ${hasRem?`<span class="mk rem${fresh?' fresh':''}"></span>`:''}
      ${pd.skip?`<span class="mk pain" style="background:var(--red);color:var(--red)"></span>`:pd.half?`<span class="mk pain" style="background:${PAIN_AMBER};color:${PAIN_AMBER}"></span>`:''}</div>`;
  }
  h+=`</div>`;
  h+=`<div class="card tight" style="margin-top:12px"><div class="subhdr" style="padding-top:0">Renkler ve işaretler</div>
    <div class="lgd">${PHASE.map(p=>`<span><span class="sw" style="background:color-mix(in srgb,${p.c} 55%,transparent)"></span>${p.t}</span>`).join('')}</div>
    <div class="lgd" style="margin-top:8px"><span><span class="d" style="background:var(--green)"></span>eklendi</span><span><span class="d" style="background:var(--red)"></span>çıkarıldı</span><span><span class="d" style="background:#8e6cf0"></span>ekstra</span><span><span class="d" style="background:${PAIN_AMBER}"></span>ağrı: yarım</span><span><span class="d" style="background:var(--red)"></span>ağrı: atlandı</span></div></div>`;
  return h;
}
export function painDay(date){let half=false,skip=false;for(const e of plannedOn(date)){const m=painStatus(e,date).mode;if(m==='skip')skip=true;else if(m==='half')half=true;}
  for(const a of S.painAction)if(a.d===dayKey(date)){if(a.mode==='skip')skip=true;else if(a.mode==='half')half=true;}return {half,skip};}
export function openDay(key){
  const date=new Date(key+'T12:00:00'),ph=phaseOf(date),wd=weekday(date);
  const planned=plannedOn(date),dmap=doneMap(date),ch=schedChangesOn(date);
  const offs=oneoffsOn(key),offIds=new Set(offs.map(e=>e.id));
  const doneExtra=Object.keys(dmap).filter(id=>!planned.some(e=>e.id===id)&&!offIds.has(id));
  const dayLogs=S.logs.filter(l=>sameDay(dt(l),date));
  const avg=dayLogs.length?(dayLogs.reduce((a,l)=>a+l.r,0)/dayLogs.length).toFixed(1):null;
  let rows='';
  for(const e of planned){const t=target(e,date),got=dmap[e.id]||0,ok=got>=t.sets,ps=painStatus(e,date);
    const pl=ps.mode==='skip'?`<span class="badge" style="background:color-mix(in srgb,var(--red) 20%,transparent);color:var(--red)">ağrı: atlandı</span>`:ps.mode==='half'?`<span class="badge" style="background:color-mix(in srgb,${PAIN_AMBER} 22%,transparent);color:${PAIN_AMBER}">ağrı: yarım</span>`:'';
    rows+=`<div class="row"><div style="flex:1">${esc(e.name)} ${pl} <span class="muted tiny">${got}/${t.sets}×${fmt(t.v)} ${esc(e.unit)}</span></div><div style="color:${ok?'var(--green)':got>0?'var(--orange)':'var(--onvar)'};font-weight:700">${ok?'✓':got>0?'◑':'○'}</div></div>`;}
  for(const e of offs){const t=oneoffTarget(e,date),got=dmap[e.id]||0,ok=got>=t.sets;
    rows+=`<div class="row"><div style="flex:1">${esc(e.name)} <span class="badge" style="background:color-mix(in srgb,#8e6cf0 20%,transparent);color:#8e6cf0">ekstra</span> <span class="muted tiny">${got}/${t.sets}×${fmt(t.v)} ${esc(e.unit)}</span></div><div style="color:${ok?'var(--green)':got>0?'var(--orange)':'var(--onvar)'};font-weight:700">${ok?'✓':got>0?'◑':'○'}</div></div>`;}
  for(const id of doneExtra){const e=S.ex(id);if(!e)continue;rows+=`<div class="row"><div style="flex:1">${esc(e.name)} <span class="muted tiny">${dmap[id]} set · plan dışı</span></div><div style="color:var(--primary)">＋</div></div>`;}
  let chTxt='';
  const adds=ch.filter(c=>c.op==='add'),rems=ch.filter(c=>c.op==='remove');
  const nm=id=>S.ex(id)?S.ex(id).name:'—';
  if(adds.length)chTxt+=noteBox('Bu gün programa eklendi: '+[...new Set(adds.map(c=>nm(c.e)))].join(', '),{color:'var(--green)',icon:'＋'});
  if(rems.length)chTxt+=noteBox('Bu gün programdan çıkarıldı: '+[...new Set(rems.map(c=>nm(c.e)))].join(', '),{color:'var(--red)',icon:'－'});
  const painActs=S.painAction.filter(a=>a.d===key);
  if(painActs.length)chTxt+=noteBox('Elle ağrı ayarı: '+painActs.map(a=>`${nm(a.e)} (${a.mode==='skip'?'atla':a.mode==='half'?'yarım':'normal'})`).join(', '),{color:PAIN_AMBER,icon:'🩹'});
  const painState=PAIN_AREAS.filter(a=>painAt(a.sys,date)>0).map(a=>`${a.label}: ${PAIN_LVL[painAt(a.sys,date)].t}`);
  if(painState.length)chTxt+=noteBox('O günkü ağrı durumu — '+painState.join(' · '),{color:PAIN_AMBER,icon:'🩹'});
  openSheet(`<div class="dsheet"><div style="display:flex;align-items:center;gap:8px">
     <div class="title-lg" style="flex:1">${date.getDate()} ${kMonths[date.getMonth()]}, ${kDayNames[wd-1]}</div>
     ${ph!==null?`<span class="dpill" style="background:color-mix(in srgb,${PHASE[ph].c} 20%,transparent);color:${PHASE[ph].c}">${PHASE[ph].t}</span>`:'<span class="dpill" style="background:var(--surfhi);color:var(--onvar)">program öncesi</span>'}</div>
     <div class="muted small" style="margin-top:4px">${esc(kSessions[wd])}${avg?' · ort. RPE '+avg:''}</div>
     <div style="height:10px"></div>${chTxt}
     ${rows||'<div class="muted small">Bu gün için planlı egzersiz yok.</div>'}</div>`);
}
export function renderExProgress(){
  const today=dOnly(new Date());
  const ws=new Date(today.getTime()-(weekday(today)-1)*86400000);
  const weekSets=S.logs.filter(l=>dOnly(dt(l))>=ws).length;
  let h=`<div class="stats">${statTile('Program haftası',weekNo(today))}${statTile('Bu hafta set',weekSets)}${statTile('Seri (gün)',streak())}</div>`;
  h+=sec('Vücut ölçümleri','Kilo, bel çevresi ve nabzı buradan takip et. Egzersiz maksimumları için Rekor sekmesi.');
  h+=metricsCard();
  h+=sec('Egzersiz ilerlemesi','Son 4 hafta set sayısı ve son 7 gün uyumu');
  const list=S.all().filter(e=>S.active.has(e.id)).sort((a,b)=>(kGrpOrder[a.grp]??9)-(kGrpOrder[b.grp]??9));
  for(const e of list)h+=exProgress(e,today,ws);
  return h;
}
export function metricsCard(){
  let rows='';const kinds=[...new Set([...S.metrics.map(m=>m.k)])];
  for(const k of kinds){const ms=S.metrics.filter(m=>m.k===k);if(!ms.length)continue;
    const last=ms[ms.length-1],first=ms[0],d=last.v-first.v;
    const right=ms.length>1?`${d>=0?'+':''}${fmt(d)} (${ms.length} ölçüm)`:dm(new Date(last.t));
    rows+=`<div class="mrow"><div style="flex:1;font-size:13.5px">${esc(k)}</div><div style="font-weight:600">${fmt(last.v)}</div><div style="width:96px;text-align:right;font-size:12px;color:var(--onvar)">${esc(right)}</div></div>`;}
  return `<div class="card tight">${rows||'<div class="muted small">Henüz ölçüm yok. Kilo ve bel çevresi haftalık ortalama olarak tek ölçümden daha anlamlı.</div>'}<div style="margin-top:6px"><button class="text" data-act="metric">＋ Ölçüm ekle</button></div></div>`;
}
export function exProgress(e,today,ws){
  const counts=[];for(let i=0;i<4;i++){const s=new Date(ws.getTime()-7*(3-i)*86400000);const en=new Date(s.getTime()+7*86400000);
    counts.push(S.logs.filter(l=>l.e===e.id&&dOnly(dt(l))>=s&&dOnly(dt(l))<en).length);}
  const mx=Math.max(0,...counts),best=bestOf(e.id);
  let expected=0;for(let i=0;i<7;i++){const d=new Date(today.getTime()-i*86400000);if(e.days.includes(weekday(d))){const t=target(e,d);expected+=t?t.sets:0;}}
  const from=Date.now()-7*86400000,recent=S.logs.filter(l=>l.e===e.id&&l.t>from);
  const done=recent.length,pct=expected===0?0:Math.round(done*100/expected);
  const avgRpe=recent.length?recent.reduce((a,l)=>a+l.r,0)/recent.length:null;
  let msg,col;
  if(expected===0){msg='Bu hafta planda yok.';col='var(--onvar)';}
  else if(pct>=90&&avgRpe!==null&&avgRpe<=6){msg='Hedefi rahat tamamlıyorsun. Bir sonraki hafta hedefine geçmeye hazırsın.';col='var(--green)';}
  else if(avgRpe!==null&&avgRpe>=9){msg='Ortalama efor çok yüksek. Hacmi düşürmeyi düşün.';col='var(--orange)';}
  else if(pct<60){msg='Uyum düşük. Yeni bir şey ekleme, mevcut hedefi tamamla.';col='var(--orange)';}
  else{msg='Yolundasın. Aynı hedefle devam.';col='var(--primary)';}
  let bars='';for(let i=0;i<4;i++){const hgt=3+28*(mx===0?0:counts[i]/mx);
    bars+=`<div class="b"><div style="font-size:10.5px">${counts[i]}</div><div class="col" style="height:${hgt}px;opacity:${i===3?1:.43}"></div><div class="tiny muted" style="font-size:10px">${i===3?'bu':'-'+(3-i)+'h'}</div></div>`;}
  return `<div class="card tight"><div style="display:flex;align-items:flex-start;gap:8px">
    <div style="flex:1"><div style="font-weight:600;font-size:15px">${esc(e.name)}</div>
      <div class="muted" style="font-size:12.5px;margin-top:2px">Son 7 gün: ${done}/${expected} set (${pct}%)${avgRpe!==null?' · ort. RPE '+avgRpe.toFixed(1):''}${best!==null?' · en iyi '+fmt(best)+' '+esc(e.unit):''}</div></div>
    <div class="bars">${bars}</div></div>
    <div style="margin-top:8px">${exTags(e)}</div>
    <div style="margin-top:8px;font-size:13px;color:${col};font-weight:500">${esc(msg)}</div></div>`;
}
/* ── metric dialog ── */
export function openMetric(){
  const opts=kKinds.map(k=>`<option value="${esc(k)}">${esc(k)}</option>`).join('');
  openDialog(`<div class="title-md" style="margin-bottom:14px">Ölçüm ekle</div><select id="mk">${opts}</select>
    <div style="height:12px"></div><label class="fld">Değer</label><input type="number" inputmode="decimal" id="mv">
    <div class="errmsg" id="merr" style="display:none">Bir sayı gir</div>
    <div style="display:flex;justify-content:flex-end;gap:6px;margin-top:18px"><button class="text" data-close>Vazgeç</button><button class="fill" id="msave">Kaydet</button></div>`);
  overlay.querySelector('#msave').onclick=()=>{const v=parseFloat(overlay.querySelector('#mv').value.replace(',','.'));
    if(isNaN(v)){overlay.querySelector('#merr').style.display='block';return;}addMetric(overlay.querySelector('#mk').value,v);closeOverlay();};
}
