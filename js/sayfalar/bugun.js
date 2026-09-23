// Bugün sekmesi.
import {S} from '../durum.js';
import {addLog} from '../eylemler.js';
import {effSets,painActionOf,painNow,painStatus} from '../mantik/agri.js';
import {countOn,oneoffTarget,oneoffsOn,spreadPlan,spreadTime,target,todayList,weekNo} from '../mantik/program.js';
import {PAIN_AMBER,PAIN_AREAS,PAIN_LVL,kDayNames,kSessions} from '../sabitler.js';
import {U} from '../ui/durum-ui.js';
import {openEditor} from '../ui/editor.js';
import {barHtml,exTags,noteBox,sec} from '../ui/html.js';
import {closeOverlay,openSheet,overlay} from '../ui/overlay.js';
import {openMetro,openTimer} from '../ui/zamanlayici.js';
import {dOnly,dayKey,dt,esc,fmt,sameDay,weekday} from '../yardimcilar.js';

/* ══════════════ BUGÜN ══════════════ */
export function renderToday(){
  const today=dOnly(new Date()),wk=weekNo(today),idx=(wk-1)%4,list=todayList(today);
  const offs=oneoffsOn(dayKey(today)).filter(e=>!list.some(x=>x.id===e.id));
  let done=0,tot=0;for(const e of list){const es=effSets(e,today);tot+=es;done+=Math.min(es,countOn(e.id,today));}
  for(const e of offs){const es=effSets(e,today);tot+=es;done+=Math.min(es,countOn(e.id,today));}
  let h=`<div class="card"><div class="title-lg">${esc(kDayNames[weekday(today)-1])}: ${esc(kSessions[weekday(today)])}</div>
    <div class="muted" style="margin-top:4px">Hafta ${wk} · ${idx===3?'deload haftası (yük %30-40 az)':'yükleme haftası '+(idx+1)+'/3'}</div>
    <div style="margin-top:14px">${barHtml(tot===0?0:done/tot)}</div>
    <div class="small" style="margin-top:6px">${done} / ${tot} set tamamlandı</div></div>`;
  if(wk>=4)h+=noteBox('Blok 1 bitmek üzere. Program → Öneriler sekmesinde Blok 2 adaylarını kontrol et. Bir döngü bitince hedefler otomatik artar.',{icon:'🚩'});
  h+=painBanner(today);
  if(list.length||offs.length)h+=`<button class="out block" data-act="spread" style="margin-bottom:10px">${U.spreadOn?'✓ Güne yayılmış sıra açık — normal görünüme dön':'🕐 Güne yayılmış sırayı göster'}</button>`;
  if(list.length===0&&offs.length===0)h+=noteBox('Bugün için aktif egzersiz yok. Program sekmesinden egzersiz ekleyebilir ya da aşağıdan bugüne özel bir hareket ekleyebilirsin.');
  if(U.spreadOn&&(list.length||offs.length))h+=spreadView(today);
  else{
    let lastGrp=null;for(const e of list){if(e.grp!==lastGrp){h+=sec(e.grp);lastGrp=e.grp;}h+=exTile(e,today);}
    if(offs.length){h+=sec('Ekstra (bugüne özel)','Sadece bugün için eklendi, programı değiştirmez');for(const e of offs)h+=exTile(e,today,{t:oneoffTarget(e,today),oneoff:true});}
  }
  h+=`<div style="text-align:center;margin-top:6px"><button class="text" data-act="addoneoff">＋ Bugüne özel egzersiz ekle</button></div>`;
  const hasToday=S.logs.some(l=>sameDay(dt(l),today))||S.painAction.some(x=>x.d===dayKey(today));
  if(hasToday)h+=`<div style="text-align:center;margin-top:6px"><button class="text" data-act="resettoday" style="color:var(--red)">↺ Bugünü sıfırla</button></div>`;
  return h;
}
export function spreadView(today){
  const seq=spreadPlan(today),n=seq.length;
  if(!n)return noteBox('Bugün için kalan set yok — hepsi tamamlandı. 🎉',{color:'var(--green)',icon:'✓'});
  const now=new Date();let startH=now.getHours()+now.getMinutes()/60;if(startH>23.5)startH=23.5;
  let endH=Math.max(startH+0.5,22);if(endH>23.9)endH=23.9;
  let h=noteBox('Kalan setler, şu andan itibaren gün içine dağıtıldı. Aynı kas/sistem arka arkaya gelmez; RPE yükseldikçe daha çok ara bırakılır. Ağrı nedeniyle yarım/pasif olanlar buna göre alınır. Saatler öneridir.',{icon:'🕐'});
  h+=`<div class="card tight"><div class="tl">`;
  for(let i=0;i<n;i++){const it=seq[i],e=it.e;
    h+=`<div class="tlrow" data-act="addset" data-id="${e.id}">
      <div class="t">${spreadTime(i,n,startH,endH)}</div>
      <div class="b"><div style="font-weight:600;font-size:14px">${esc(e.name)}${it.extra?' <span class="badge">ekstra</span>':''}${it.half?' <span class="badge" style="background:color-mix(in srgb,'+PAIN_AMBER+' 22%,transparent);color:'+PAIN_AMBER+'">yarım (ağrı)</span>':''}</div>
        <div class="muted tiny">set ${it.setNo}/${it.total} · ${fmt(it.v)} ${esc(e.unit)} · RPE ${e.rpe}</div>
        <div class="tags" style="margin-top:4px">${exTags(e)}</div></div>
      <div class="k">○</div></div>`;}
  h+=`</div></div>`;
  return h;
}
export function painBanner(today){
  const act=PAIN_AREAS.filter(a=>painNow(a.sys)>0);
  if(!act.length)return '';
  const maxLvl=Math.max(...act.map(a=>painNow(a.sys)));
  const col=maxLvl>=S.cfg.painSkipLevel?'var(--red)':PAIN_AMBER;
  const parts=act.map(a=>`${a.label}: ${PAIN_LVL[painNow(a.sys)].t}`);
  return noteBox(`Aktif ağrı — ${parts.join(' · ')}. Etkilenen hareketler aşağıda işaretlendi (orta = yarım yük, şiddetli = atlandı). Dereceyi Denge → Durum'dan güncelle.`,{color:col,icon:'🩹'});
}
export function exTile(e,day,opts){
  const base=(opts&&opts.t)?opts.t:target(e,day),done=countOn(e.id,day),ps=painStatus(e,day);
  let shown=base.sets,badge='',accent='';
  if(ps.mode==='skip'){accent='var(--red)';badge=`<span class="badge" style="background:color-mix(in srgb,var(--red) 20%,transparent);color:var(--red)">ağrı — atlandı${ps.source==='manual'?' (elle)':''}</span>`;}
  else if(ps.mode==='half'){shown=Math.max(1,Math.ceil(base.sets/2));accent=PAIN_AMBER;badge=`<span class="badge" style="background:color-mix(in srgb,${PAIN_AMBER} 22%,transparent);color:${PAIN_AMBER}">yarım yük (ağrı)${ps.source==='manual'?' · elle':''}</span>`;}
  else if(ps.mode==='flag'){accent='var(--orange)';badge=`<span class="badge" style="background:color-mix(in srgb,var(--orange) 20%,transparent);color:var(--orange)">dikkat (ağrı)</span>`;}
  else if(ps.source==='manual'){badge=`<span class="badge">ağrı: normal (elle)</span>`;}
  const complete=shown>0&&done>=shown;
  const cardStyle='padding:12px 8px 12px 16px;'+(accent?`box-shadow:inset 4px 0 0 ${accent};`:'')+(ps.mode==='skip'?'opacity:.6;':'');
  return `<div class="card extile" style="${cardStyle}">
    <div class="head"><div style="flex:1" data-act="log" data-id="${e.id}"><div class="name">${esc(e.name)}${opts&&opts.oneoff?' <span class="badge">ekstra</span>':''}</div>
      <div class="muted small">${shown} set × ${fmt(base.v)} ${esc(e.unit)}${shown!==base.sets?` <span style="color:${PAIN_AMBER}">(tam ${base.sets})</span>`:''}</div>${badge?'<div style="margin-top:4px">'+badge+'</div>':''}</div>
      <button class="iconbtn" data-act="painmenu" data-id="${e.id}" style="width:34px;height:40px;font-size:15px" title="Ağrı: yarım/atla">🩹</button>
      ${e.unit==='sn'?`<button class="iconbtn" data-act="timer" data-id="${e.id}" style="width:34px;height:40px;font-size:16px" title="Zamanlayıcı">▶</button>`:''}
      ${e.unit==='tekrar'&&e.tempo?`<button class="iconbtn" data-act="metro" data-id="${e.id}" style="width:34px;height:40px;font-size:16px" title="Metronom">🎵</button>`:''}
      ${done>0?`<button class="iconbtn" data-act="undoset" data-id="${e.id}" style="width:34px;height:40px;font-size:17px" title="Son seti geri al">↶</button>`:''}
      <button class="iconsq" data-act="addset" data-id="${e.id}" title="Set ekle">${complete?'✓':'+'}</button>
      ${opts&&opts.oneoff?`<button class="iconbtn" data-act="rmoneoff" data-id="${e.id}" style="width:30px;height:40px;font-size:16px" title="Bugünden kaldır">×</button>`:''}</div>
    <div style="display:flex;align-items:center;gap:10px;margin:8px 8px 0 0">
      <div style="flex:1">${barHtml(Math.min(1,shown?done/shown:0),{cls:'md',color:accent||undefined})}</div>
      <div class="small" style="font-weight:500">${done}/${shown}</div></div>
    <div style="margin:8px 8px 0 0" data-act="log" data-id="${e.id}">${exTags(e)}</div>
    ${e.note?`<div class="muted" style="font-size:12.5px;margin-top:6px" data-act="log" data-id="${e.id}">${esc(e.note)}</div>`:''}</div>`;
}
export function openPainMenu(e){
  const key=dayKey(dOnly(new Date())),man=painActionOf(e.id,key),ps=painStatus(e,dOnly(new Date()));
  const sysInfo=ps.source==='system'&&ps.mode!=='normal'?`Sistem durumu bu hareketi bugün "${ps.mode==='skip'?'atla':ps.mode==='half'?'yarım yük':'dikkat'}" olarak işaretledi. Buradan elle değiştirebilirsin (yalnızca bugün).`:'Bu hareketi ağrı nedeniyle yalnızca bugün için ayarla.';
  const opt=(mode,label,desc)=>`<button class="chip ${man===mode?'sel':''}" data-act="setpain" data-id="${e.id}" data-mode="${mode}" style="display:block;width:100%;text-align:left;margin-bottom:8px;padding:12px"><div style="font-weight:600">${label}</div><div class="muted tiny">${desc}</div></button>`;
  openSheet(`<div class="title-lg">${esc(e.name)}</div>
    <div class="muted small" style="margin:8px 0 12px">${sysInfo}</div>
    ${opt('normal','Normal','Tam yük — sistem ağrısı olsa bile bugün normal yap')}
    ${opt('half','Yarım yük (ağrı)','Bugünkü set sayısı yarıya iner')}
    ${opt('skip','Bugün atla (ağrı)','Pasif — listede kalır ama önerilmez')}
    ${man?`<div style="text-align:center;margin-top:4px"><button class="text" data-act="setpain" data-id="${e.id}" data-mode="clear" style="color:var(--red)">Elle ayarı kaldır</button></div>`:''}`);
}
/* ── log sheet ── */
export function openLog(e,v0){
  let v=v0,r=e.rpe;
  const stepFor=()=>e.unit==='tekrar'?1:e.unit==='sn'?5:(v>=30?5:1);
  const hint=x=>x<=3?'Çok kolay, ısınma seviyesi':x===4||x===5?'Rahat, 5+ tekrar kalıyor':x===6?'Yaklaşık 4 tekrar kalıyor':x===7?'Yaklaşık 3 tekrar kalıyor':x===8?'Yaklaşık 2 tekrar kalıyor':x===9?'Yaklaşık 1 tekrar kalıyor':'Maksimum efor';
  openSheet(`<div class="title-lg">${esc(e.name)}</div><div style="margin-top:8px">${exTags(e)}</div>
    <div style="display:flex;align-items:center;justify-content:center;gap:24px;margin-top:18px">
      <button class="roundbtn" id="lminus">−</button><div style="font-size:30px;font-weight:500;min-width:120px;text-align:center" id="lval">${fmt(v)} ${esc(e.unit)}</div><button class="roundbtn" id="lplus">＋</button></div>
    <div style="margin-top:14px" id="lhint">Zorluk (RPE): ${r} · ${hint(r)}</div>
    <input type="range" min="1" max="10" step="1" value="${r}" id="lrpe" style="margin-top:6px">
    <div style="margin-top:8px"><button class="fill block" id="lsave">✓ Seti kaydet</button></div>
    ${e.unit==='sn'?`<div style="margin-top:8px"><button class="tonal block" id="ltimer">▶ Zamanlayıcıyı başlat (${fmt(v)} sn)</button></div>`:''}
    ${e.unit==='tekrar'&&e.tempo?`<div style="margin-top:8px"><button class="tonal block" id="lmetro">🎵 Metronom (tempo ${esc(e.tempo)} · ${fmt(v)} tekrar)</button></div>`:''}
    <div style="text-align:center;margin-top:4px"><button class="text" id="ledit">✎ Bu egzersizi düzenle</button></div>`);
  const val=overlay.querySelector('#lval'),hnt=overlay.querySelector('#lhint'),upd=()=>val.textContent=`${fmt(v)} ${e.unit}`;
  overlay.querySelector('#lminus').onclick=()=>{v=Math.max(0,v-stepFor());upd();const lt=overlay.querySelector('#ltimer');if(lt)lt.textContent=`▶ Zamanlayıcıyı başlat (${fmt(v)} sn)`;const lm=overlay.querySelector('#lmetro');if(lm)lm.textContent=`🎵 Metronom (tempo ${e.tempo} · ${fmt(v)} tekrar)`;};
  overlay.querySelector('#lplus').onclick=()=>{v=v+stepFor();upd();const lt=overlay.querySelector('#ltimer');if(lt)lt.textContent=`▶ Zamanlayıcıyı başlat (${fmt(v)} sn)`;const lm=overlay.querySelector('#lmetro');if(lm)lm.textContent=`🎵 Metronom (tempo ${e.tempo} · ${fmt(v)} tekrar)`;};
  overlay.querySelector('#lrpe').oninput=ev=>{r=+ev.target.value;hnt.textContent=`Zorluk (RPE): ${r} · ${hint(r)}`;};
  overlay.querySelector('#lsave').onclick=()=>{addLog(e.id,v,r);closeOverlay();};
  const lt=overlay.querySelector('#ltimer');if(lt)lt.onclick=()=>{openTimer(e,v);};
  const lmt=overlay.querySelector('#lmetro');if(lmt)lmt.onclick=()=>{openMetro(e,v);};
  overlay.querySelector('#ledit').onclick=()=>{closeOverlay();openEditor(e.id);};
}
