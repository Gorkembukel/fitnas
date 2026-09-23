// Program sekmesi: Haftalık | Öneriler | Egzersizler.
import {S} from '../durum.js';
import {gapScore,muscleLoad,status,systemLoad} from '../mantik/analiz.js';
import {target,weekDate} from '../mantik/program.js';
import {bestOf,prereqMet} from '../mantik/rekor.js';
import {recHours} from '../mantik/toparlanma.js';
import {MINFO,M_ORDER,SINFO,S_ORDER,kDayNames,kDayShort,kGrpOrder,kSessions} from '../sabitler.js';
import {U} from '../ui/durum-ui.js';
import {exTags,noteBox,sec,tag} from '../ui/html.js';
import {openSheet} from '../ui/overlay.js';
import {dOnly,dayKey,esc,fmt} from '../yardimcilar.js';

/* ══════════════ PROGRAM ══════════════ */
export function renderLibrary(){
  let h=`<div style="height:8px"></div><div class="seg">
    <button class="${U.libMode===0?'on':''}" data-act="libmode" data-v="0">🗓️ Haftalık</button>
    <button class="${U.libMode===1?'on':''}" data-act="libmode" data-v="1">🧭 Öneriler</button>
    <button class="${U.libMode===2?'on':''}" data-act="libmode" data-v="2">≣ Egzersizler</button></div><div style="height:8px"></div>`;
  h+=U.libMode===0?libWeekly():U.libMode===1?libNext():libBrowse();return h;
}
export function daySystems(exs,d){const set=[];for(const e of exs){const t=target(e,weekDate(1,d));if(!t)continue;for(const s in e.systems)if(e.systems[s]>=1&&!set.includes(s))set.push(s);}return set;}
export function libWeekly(){
  let h=sec('Haftalık program','Bir egzersizi eklediğin/çıkardığın gün, tekrar eden haftalık şablona işlenir ve Bugün, Denge, İlerleme ile eşitlenir.');
  h+=programAdvice();
  for(let d=1;d<=7;d++){
    const exs=S.all().filter(e=>S.active.has(e.id)&&e.days.includes(d)&&target(e,weekDate(1,d))!==null);
    let sets=0;for(const e of exs){const t=target(e,weekDate(1,d));sets+=t?t.sets:0;}
    const sys=daySystems(exs,d);
    h+=`<div class="card tight">
      <div style="display:flex;align-items:center;gap:8px">
        <div style="flex:1"><div style="font-weight:600">${kDayNames[d-1]} <span class="muted tiny">· ${esc(kSessions[d])}</span></div>
          <div class="muted tiny">${exs.length} egzersiz · ${sets} set</div></div>
        <button class="text" data-act="addday" data-d="${d}">＋ Ekle</button></div>`;
    if(exs.length)for(const e of exs){const t=target(e,weekDate(1,d));
      h+=`<div class="mrow"><div style="flex:1;font-size:13.5px">${esc(e.name)} <span class="muted tiny">${t.sets}×${fmt(t.v)} ${esc(e.unit)}</span></div>
        <button class="iconbtn" data-act="rmday" data-id="${e.id}" data-d="${d}" style="width:30px;height:30px;font-size:17px" title="Bu günden çıkar">×</button></div>`;}
    else h+=`<div class="muted small" style="padding:6px 2px">Boş gün — toparlanma veya hafif hareket.</div>`;
    if(sys.length)h+=`<div class="tags" style="margin-top:6px">${sys.map(s=>tag(SINFO[s].label,SINFO[s].color,SINFO[s].icon)).join('')}</div>`;
    h+=`</div>`;
  }
  return h;
}
export function programAdvice(){
  const sched={};for(let d=1;d<=7;d++)sched[d]=S.all().filter(e=>S.active.has(e.id)&&e.days.includes(d)&&target(e,weekDate(1,d))!==null);
  const notes=[];
  for(const s of S_ORDER){const need=recHours(s);if(need<=S.cfg.spaceMinHours)continue;
    const days=[];for(let d=1;d<=7;d++)if(sched[d].some(e=>(e.systems[s]||0)>=1))days.push(d);
    if(days.length<2)continue;
    let minGap=7;for(let i=0;i<days.length;i++){let g=(days[(i+1)%days.length]-days[i]+7)%7;if(g===0)g=7;if(g<minGap)minGap=g;}
    if(minGap*24<need)notes.push({c:'var(--orange)',i:'⚠️',t:`${SINFO[s].label} ${days.map(x=>kDayShort[x-1]).join(', ')} günlerinde ana uyaran alıyor; toparlanması ~${need} saat. Aralarında en az ${Math.ceil(need/24)} gün bırak.`});
  }
  const rr=S.cfg.balanceRatio;
  const psets=k=>{let n=0;for(let d=1;d<=7;d++)for(const e of sched[d])if(e.pattern.includes(k)){const t=target(e,weekDate(1,d));n+=t?t.sets:0;}return n;};
  for(const p of [['İtme','itme','Çekme','çekme'],['Diz baskın','Diz baskın','Kalça baskın','Kalça baskın'],['Dikey çekme','Dikey çekme','Yatay çekme','Yatay çekme']]){
    const a=psets(p[1]),b=psets(p[3]);
    if(a>0&&b<a*rr)notes.push({c:'var(--orange)',i:'⚖️',t:`${p[0]} ${a} set · ${p[2]} ${b} set — ${p[2]} geride, dengele.`});
    else if(b>0&&a<b*rr)notes.push({c:'var(--orange)',i:'⚖️',t:`${p[2]} ${b} set · ${p[0]} ${a} set — ${p[0]} geride, dengele.`});
  }
  const wm={};for(const m of M_ORDER)wm[m]=0;
  for(let d=1;d<=7;d++)for(const e of sched[d]){const t=target(e,weekDate(1,d)),mult=t?t.sets:0;for(const m in e.muscles)wm[m]+=e.muscles[m]*mult;}
  const untr=M_ORDER.filter(m=>wm[m]===0);
  if(untr.length)notes.push({c:'var(--onvar)',i:'○',t:`Bu hafta hiç çalışmayan kas grupları: ${untr.map(m=>MINFO[m].label).join(', ')}.`});
  const gtg=S.all().filter(e=>S.active.has(e.id)&&e.rpe<=S.cfg.gtgRpe&&e.unit==='tekrar'&&e.days.length>=1&&e.days.length<=2);
  if(gtg.length)notes.push({c:'var(--primary)',i:'💡',t:`GtG mantığıyla daha sık, düşük eforla yayabileceğin egzersizler: ${gtg.map(e=>e.name).join(', ')}. Haftada 4-7 güne dağıtmak bunlarda ilerlemeyi hızlandırır.`});
  const hard=S.all().filter(e=>S.active.has(e.id)&&e.rpe>=8);
  for(const e of hard){const ds=e.days.filter(d=>target(e,weekDate(1,d))!==null).sort((a,b)=>a-b);
    let adj=false;for(let i=0;i<ds.length;i++){let g=(ds[(i+1)%ds.length]-ds[i]+7)%7;if(g===1)adj=true;}
    if(adj){notes.push({c:'var(--orange)',i:'🔥',t:`${e.name} yüksek eforlu (RPE ${e.rpe}) ve ardışık günlerde. Araya en az bir gün dinlenme koy.`});break;}
  }
  if(!notes.length)notes.push({c:'var(--green)',i:'✓',t:'Program dengeli: sistem toparlanmaları, kalıp dengesi ve kas dağılımı uygun görünüyor.'});
  let h='';for(const n of notes)h+=noteBox(n.t,{color:n.c,icon:n.i});
  return h;
}
export function openDayPicker(d){
  const avail=S.all().filter(e=>!e.days.includes(d)).sort((a,b)=>{const c=(S.active.has(b.id)?1:0)-(S.active.has(a.id)?1:0);return c!==0?c:(kGrpOrder[a.grp]??9)-(kGrpOrder[b.grp]??9);});
  let list='';for(const e of avail)list+=`<button class="chip" data-act="pickday" data-id="${e.id}" data-d="${d}" style="display:block;width:100%;text-align:left;margin-bottom:6px">${S.active.has(e.id)?'':'＋ '}${esc(e.name)} <span class="muted tiny">· ${esc(e.pattern)}</span></button>`;
  openSheet(`<div class="title-lg">${kDayNames[d-1]} — egzersiz ekle</div>
    <div class="muted small" style="margin:8px 0 12px">Seçtiğin egzersiz bu güne eklenir (gerekirse programa alınır). Tekrar eden her hafta için geçerlidir.</div>
    ${list||'<div class="muted small">Tüm egzersizler bu güne ekli.</div>'}
    <div style="height:8px"></div><button class="text block" data-act="addcustom">＋ Yeni egzersiz oluştur</button>`);
}
export function openOneoffPicker(){
  const key=dayKey(dOnly(new Date())),today=dOnly(new Date());
  const shown=new Set([...todayList(today).map(e=>e.id),...oneoffIds(key)]);
  const avail=S.all().filter(e=>!shown.has(e.id)).sort((a,b)=>{const c=(S.active.has(b.id)?1:0)-(S.active.has(a.id)?1:0);return c!==0?c:(kGrpOrder[a.grp]??9)-(kGrpOrder[b.grp]??9);});
  let list='';for(const e of avail)list+=`<button class="chip" data-act="pickoneoff" data-id="${e.id}" style="display:block;width:100%;text-align:left;margin-bottom:6px">＋ ${esc(e.name)} <span class="muted tiny">· ${esc(e.pattern)}</span></button>`;
  openSheet(`<div class="title-lg">Bugüne özel egzersiz</div>
    <div class="muted small" style="margin:8px 0 12px">Yalnızca bugün için eklenir; haftalık programı değiştirmez. Takvimde bu gün “ekstra” olarak işaretlenir. Yaptığın setler normal şekilde tüm analizlere ve dengeye sayılır.</div>
    ${list||'<div class="muted small">Eklenebilecek başka egzersiz yok. Yeni bir tane oluşturabilirsin.</div>'}
    <div style="height:8px"></div><button class="text block" data-act="addcustom">＋ Yeni egzersiz oluştur</button>`);
}
export function libNext(){
  const W=S.cfg.window,ml=muscleLoad(W),sl=systemLoad(W);
  const cands=S.all().filter(e=>!S.active.has(e.id)&&(e.block!==null||e.custom)).sort((a,b)=>{
    const ma=prereqMet(a)===false?0:1,mb=prereqMet(b)===false?0:1;if(ma!==mb)return mb-ma;return gapScore(b,ml,sl)-gapScore(a,ml,sl);});
  let h=sec('Başlayabileceğin egzersizler','Önce kriteri sağlayanlar, sonra açık bıraktığın alanı en çok kapatanlar. Programdan çıkardığın özel egzersizler de burada, boşluğuna göre sıralanır.');
  if(!cands.length)h+=noteBox('Şu an aday yok. Tüm egzersizler sekmesinden yeni bir egzersiz oluşturabilir; oradaki bir egzersizi programdan çıkarırsan boşluğuna göre burada önerilir.');
  const LB=S.cfg.lowBelow;
  for(const e of cands){const met=prereqMet(e),hasCrit=!!(e.prereqId||e.prereqText);let gaps='';
    for(const m in e.muscles)if(e.muscles[m]>=1&&ml[m]<LB)gaps+=tag(`${MINFO[m].label}: ${status(ml[m]).t.toLowerCase()}`,'var(--red)');
    for(const s in e.systems)if(e.systems[s]>=1&&sl[s]<LB)gaps+=tag(`${SINFO[s].label}: ${status(sl[s]).t.toLowerCase()}`,'var(--red)');
    const best=e.prereqId?bestOf(e.prereqId):null;const micon=!hasCrit?'➕':met===true?'✅':met===false?'🔒':'❔';
    const critExtra=met===false?`\nŞu an en iyi: ${best===null?'kayıt yok':fmt(best)}, hedef ${fmt(e.prereqValue)}`:'';
    const critLine=hasCrit?`Kriter: ${esc(e.prereqText+critExtra)}`:'Kriteri yok — boşluğuna uyduğunda önerilir, istediğin zaman ekleyebilirsin.';
    h+=`<div class="card tight"><div style="display:flex;align-items:center;gap:8px"><div style="flex:1;font-size:16px;font-weight:600">${esc(e.name)}</div>${e.block?tag(e.block,'var(--primary)'):tag('Özel','var(--onvar)')}</div>
      <div class="muted" style="font-size:12.5px;margin-top:2px">${esc(e.pattern)}</div>
      <div style="margin-top:8px">${exTags(e)}</div>
      ${e.fills?`<div style="margin-top:8px;font-size:13px">Kapattığı boşluk: ${esc(e.fills)}</div>`:''}
      ${gaps?`<div class="tags" style="margin-top:6px">${gaps}</div>`:'<div class="tags" style="margin-top:6px">'+tag('şu an belirgin boşluk kapatmıyor','var(--onvar)')+'</div>'}
      <div style="display:flex;gap:8px;margin-top:8px;align-items:flex-start"><div style="font-size:18px;line-height:1.2">${micon}</div>
        <div style="flex:1;font-size:13px;line-height:1.35;white-space:pre-line">${critLine}</div></div>
      ${e.note?`<div class="muted" style="font-size:12.5px;margin-top:6px">${esc(e.note)}</div>`:''}
      <div class="muted" style="font-size:12.5px;margin-top:4px">Önerilen günler: ${e.days.length?e.days.map(d=>kDayShort[d-1]).join(', '):'—'}</div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px">
        <button class="text" data-act="edit" data-id="${e.id}">✎ Düzenle</button>
        ${met===false?`<button class="out" data-act="toggle" data-id="${e.id}">Yine de ekle</button>`:`<button class="fill" data-act="toggle" data-id="${e.id}">Programa ekle</button>`}</div></div>`;}
  return h;
}
export function libBrowse(){
  const list=S.all().filter(e=>(U.filterS===null||(e.systems[U.filterS]||0)>0)&&(U.filterM===null||(e.muscles[U.filterM]||0)>0));
  let sc=`<button class="chip ${U.filterS===null?'sel':''}" data-act="fs" data-v="">Tümü</button>`;
  for(const s of S_ORDER)sc+=`<button class="chip ${U.filterS===s?'sel':''}" data-act="fs" data-v="${s}">${SINFO[s].icon} ${esc(SINFO[s].label)}</button>`;
  let mc=`<button class="chip ${U.filterM===null?'sel':''}" data-act="fm" data-v="">Tümü</button>`;
  for(const m of M_ORDER)mc+=`<button class="chip ${U.filterM===m?'sel':''}" data-act="fm" data-v="${m}">${esc(MINFO[m].label)}</button>`;
  let h=sec('Sisteme göre')+`<div class="chiprow">${sc}</div>`+sec('Kas grubuna göre')+`<div class="chiprow">${mc}</div>`;
  h+=`<div style="height:10px"></div><button class="tonal block" data-act="addcustom">＋ Yeni egzersiz oluştur</button><div style="height:10px"></div>`;
  if(!list.length)h+=noteBox('Bu filtreye uyan egzersiz yok.');
  for(const e of list){
    const aux=[...Object.keys(e.muscles).filter(k=>e.muscles[k]<1).map(k=>MINFO[k].label),...Object.keys(e.systems).filter(k=>e.systems[k]<1).map(k=>SINFO[k].label)].join(', ');
    const t0=e.targets[0];
    h+=`<details class="ex"><summary><div style="display:flex;align-items:center;gap:8px"><div style="flex:1">
        <div style="font-weight:600;font-size:15px">${esc(e.name)}</div>
        <div class="muted" style="font-size:12.5px;margin-top:2px">${esc(e.pattern)}${t0?' · '+t0.sets+'×'+fmt(t0.v)+' '+esc(e.unit):''}${S.active.has(e.id)?' · programda':''}</div></div>
        ${S.overrides[e.id]?'<span class="badge">düzenlendi</span>':''}${e.custom?'<span class="badge">özel</span>':''}</div></summary>
      <div class="body">${exTags(e)}
        ${aux?`<div style="font-size:12.5px;margin-top:8px">Yardımcı: ${esc(aux)}</div>`:''}
        ${e.targets.length?`<div style="font-size:12.5px;margin-top:4px">Günler: ${e.days.map(d=>kDayShort[d-1]).join(', ')||'—'} · RPE ${e.rpe}${e.impact?' · darbe':''}</div>`:''}
        ${e.note?`<div style="font-size:12.5px;margin-top:4px">${esc(e.note)}</div>`:''}
        <div style="display:flex;align-items:center;gap:8px;margin-top:12px">
          <button class="out" data-act="edit" data-id="${e.id}">✎ Düzenle</button>
          ${S.overrides[e.id]?`<button class="text" data-act="resetex" data-id="${e.id}">Sıfırla</button>`:''}
          <div class="spacer"></div>
          ${e.custom?`<button class="iconbtn" data-act="delcustom" data-id="${e.id}" title="Sil">🗑️</button>`:''}
          <label class="sw"><input type="checkbox" ${S.active.has(e.id)?'checked':''} data-act="toggle-sw" data-id="${e.id}"><span class="tr"></span><span class="kn"></span></label>
        </div></div></details>`;}
  return h;
}
