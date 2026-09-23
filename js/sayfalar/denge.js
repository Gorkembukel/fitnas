// Denge sekmesi: Analiz | Durum.
import {S} from '../durum.js';
import {painExercises,painNow} from '../mantik/agri.js';
import {gapScore,muscleLoad,patternSets,status,systemLoad} from '../mantik/analiz.js';
import {sysRecovery,sysThreshold} from '../mantik/toparlanma.js';
import {MINFO,M_ORDER,PAIN_AREAS,PAIN_LVL,SINFO,SYS_GROUPS,S_ORDER} from '../sabitler.js';
import {U} from '../ui/durum-ui.js';
import {barHtml,noteBox,sec,tag} from '../ui/html.js';
import {openSheet} from '../ui/overlay.js';
import {esc,fmt} from '../yardimcilar.js';

/* ══════════════ DENGE ══════════════ */
export function renderBalance(){
  let h=`<div style="height:8px"></div><div class="seg">
    <button class="${U.balMode===0?'on':''}" data-act="balmode" data-v="0">🎯 Analiz</button>
    <button class="${U.balMode===1?'on':''}" data-act="balmode" data-v="1">🩹 Durum</button></div><div style="height:8px"></div>`;
  return h+(U.balMode===0?renderBalanceAnaliz():renderStatus());
}
export function renderStatus(){
  let h=sec('Ağrı / durum','Ağrıyan bölgeyi derecelendir. Seçtiğin an o sistemi yükleyen hareketler Bugün’de otomatik ayarlanır: orta = yarım yük, şiddetli = pasif. Ayar sen değiştirene kadar kalır.');
  for(const a of PAIN_AREAS){const lvl=painNow(a.sys),affected=painExercises(a.sys);
    let seg='';for(let i=0;i<4;i++)seg+=`<button class="chip ${lvl===i?'sel':''}" data-act="setpainlvl" data-sys="${a.sys}" data-lvl="${i}" style="flex:1;justify-content:center;color:${lvl===i?'':PAIN_LVL[i].c}">${PAIN_LVL[i].t}</button>`;
    const eff=lvl>=S.cfg.painSkipLevel?'bu hareketler bugün pasif':lvl>=S.cfg.painHalfLevel?'bu hareketler bugün yarım yük':lvl>=1?'dikkat işaretli (yük değişmez)':'';
    h+=`<div class="card tight">
      <div style="display:flex;align-items:center;gap:8px"><div style="flex:1;font-weight:600">${esc(a.label)}</div>
        ${lvl>0?`<span class="dpill" style="background:color-mix(in srgb,${PAIN_LVL[lvl].c} 20%,transparent);color:${PAIN_LVL[lvl].c}">${PAIN_LVL[lvl].t}</span>`:''}</div>
      <div class="muted tiny" style="margin:4px 0 8px">${esc(SINFO[a.sys].label)} · yükleyen: ${affected.length?affected.map(e=>esc(e.name)).join(', '):'—'}</div>
      <div style="display:flex;gap:6px">${seg}</div>
      ${eff?`<div class="tiny" style="margin-top:8px;color:${PAIN_LVL[lvl].c}">→ ${eff}${affected.length&&lvl>=S.cfg.painHalfLevel?': '+affected.map(e=>e.name).join(', '):''}</div>`:''}</div>`;}
  const anyPain=PAIN_AREAS.some(a=>painNow(a.sys)>0);
  if(anyPain)h+=noteBox('Ağrı, ilgili sistemin toparlanma yüküne de eklenir (Analiz sekmesinde daha uzun “yükte” görünür). Geçince dereceyi Yok’a çek.',{icon:'ℹ️'});
  h+=`<div class="muted" style="font-size:12px;line-height:1.45;margin-top:6px">Eşikler ve ağrı penaltıları Ayarlar → Analiz ve kurallar → Ağrı bölümünden değiştirilebilir. Tek bir hareketi bugünlük ayrıca ayarlamak için Bugün’deki 🩹 düğmesini kullan.</div>`;
  return h;
}
export function openGroupDetail(gi){
  const G=SYS_GROUPS[gi];let rows='';
  for(const s of G.members){const slv=systemLoad(S.cfg.window)[s]||0;const st=status(slv);const rec=sysRecovery(s),thr=sysThreshold(s),over=rec>thr;const pl=painNow(s);
    rows+=`<div class="card tight" style="margin-bottom:8px${over?';box-shadow:inset 4px 0 0 var(--red)':''}">
      <div style="display:flex;align-items:center;gap:10px"><div style="font-size:20px">${G.icon}</div>
        <div style="flex:1"><div style="font-weight:600">${esc(SINFO[s].label)}</div>
          <div class="muted tiny">aşırı yük sınırı ${Math.round(thr)} sa${pl>0?` · ağrı: ${PAIN_LVL[pl].t}`:''}</div>
          <div style="margin-top:6px">${barHtml(thr?rec/thr:0,{color:over?'var(--red)':G.color,cls:'md',bg:'var(--surfhi)'})}</div></div>
        <div style="text-align:right;min-width:74px"><div style="font-size:12px;color:${st.c};font-weight:500">${fmt(slv)} · ${st.t}</div>
          <div style="margin-top:4px;display:flex;justify-content:flex-end">${rec<1?tag('Hazır','var(--green)'):over?tag('~'+Math.round(rec)+' sa yük · aşırı','var(--red)','🔴'):tag('~'+Math.round(rec)+' sa yük','var(--orange)','⏳')}</div></div></div>
      ${over?`<div class="muted small" style="margin-top:8px;color:var(--red)">Birikmiş iyileşme, aşırı yük sınırını aştı — bu bölgeyi dinlendir.</div>`:''}</div>`;}
  openSheet(`<div class="title-lg">${G.icon} ${esc(G.label)} — detay</div>
    <div class="muted small" style="margin:8px 0 12px">Her bölge ayrı ayrı: uyaran, birikmiş iyileşme yükü ve eşiği. Özet kart bunların ortalamasını gösterir.</div>
    ${rows}`);
}
export function renderBalanceAnaliz(){
  const W=S.cfg.window,ml=muscleLoad(W),sl=systemLoad(W);
  const maxM=Math.max(1,...Object.values(ml)),maxS=Math.max(1,...Object.values(sl));
  const regions=[];for(const m of M_ORDER)if(!regions.includes(MINFO[m].region))regions.push(MINFO[m].region);
  let h=sec('Kas grupları',`Son ${W} gün · ağırlıklı set (ana kas 1, yardımcı 0,5)`);
  for(const r of regions){h+=`<div class="subhdr">${esc(r)}</div>`;
    for(const m of M_ORDER)if(MINFO[m].region===r){const st=status(ml[m]);
      h+=`<div class="mrow"><div class="ml">${esc(MINFO[m].label)}</div><div style="flex:1">${barHtml(ml[m]/maxM,{color:st.c,bg:'var(--surfhi)'})}</div><div class="mv" style="color:${st.c}">${fmt(ml[m])} · ${st.t}</div></div>`;}}
  h+=sec('Kalıp dengesi',`Son ${W} gün · set sayısı`);
  const pairs=[['İtme','itme','Çekme','çekme'],['Diz baskın','Diz baskın','Kalça baskın','Kalça baskın'],['Dikey çekme','Dikey çekme','Yatay çekme','Yatay çekme']];
  const rr=S.cfg.balanceRatio;
  for(const p of pairs){const a=patternSets(p[1],W),b=patternSets(p[3],W);const low=a>0&&b<a*rr?p[2]:(b>0&&a<b*rr?p[0]:null);
    h+=noteBox(`${p[0]} ${a} set · ${p[2]} ${b} set${low?'  →  '+low+' geride':''}`,{color:low?'var(--orange)':'var(--green)',icon:low?'⚖️':'✓'});}
  h+=sec('Sistemler',`Uyaran (son ${W} gün) · birikmiş iyileşme yükü ve toparlanma`);
  h+=noteBox('Buradaki saat sabit bir geri sayım değil: birikmiş iyileşme yükü yaptığın set sayısı ve RPE’ye göre büyür, zamanla azalır. “Aşırı yük sınırı” süresi dolunca otomatik toparlanmış olmazsın — o sistemi yükleyen her yeni set, ne kadar geçerse geçsin yükü tekrar artırır.',{icon:'ℹ️'});
  const doneGroup={};
  for(const s of S_ORDER){
    const gi=SYS_GROUPS.findIndex(g=>g.members.includes(s));
    if(gi>=0){
      if(doneGroup[gi])continue;doneGroup[gi]=true;const G=SYS_GROUPS[gi],mem=G.members;
      const slA=mem.reduce((a,t)=>a+sl[t],0)/mem.length;
      const recA=mem.reduce((a,t)=>a+sysRecovery(t),0)/mem.length;
      const thrA=mem.reduce((a,t)=>a+sysThreshold(t),0)/mem.length;
      const st=status(slA);let top=mem[0];for(const t of mem)if(sysRecovery(t)>sysRecovery(top))top=t;
      const topRec=sysRecovery(top),topThr=sysThreshold(top),topOver=topRec>topThr;
      const rtag=recA<1?tag('Hazır','var(--green)'):topOver?tag('~'+Math.round(recA)+' sa yük · detayda aşım','var(--red)','🔴'):tag('~'+Math.round(recA)+' sa yük','var(--orange)','⏳');
      h+=`<div class="card tight" data-act="groupdetail" data-g="${gi}" style="cursor:pointer"><div style="display:flex;align-items:center;gap:12px"><div style="font-size:22px">${G.icon}</div>
        <div style="flex:1"><div style="font-weight:600">${esc(G.label)} <span class="muted tiny">(${mem.length} bölge ortalaması)</span></div><div class="muted tiny">${esc(G.sub)} · aşırı yük sınırı ${Math.round(thrA)} sa</div>
          <div style="margin-top:6px">${barHtml(thrA?recA/thrA:0,{color:topOver?'var(--red)':G.color,cls:'md',bg:'var(--surfhi)'})}</div></div>
        <div style="text-align:right;min-width:76px"><div style="font-size:12px;color:${st.c};font-weight:500">${fmt(slA)} · ${st.t}</div>
          <div style="margin-top:4px;display:flex;justify-content:flex-end">${rtag}</div></div>
        <div style="font-size:18px;color:var(--onvar);margin-left:2px">›</div></div>
        <div class="muted small" style="margin-top:8px;color:${topOver?'var(--red)':'var(--onvar)'}">${topOver?'⚠ ':''}Detayda en yüksek: ${esc(SINFO[top].label)} — ${Math.round(topRec)} sa${topOver?` (aşırı yük sınırı ${Math.round(topThr)} sa aşıldı)`:''}. Tıkla → bölgeleri ayrı gör.</div></div>`;
      continue;
    }
    const st=status(sl[s]);const rec=sysRecovery(s),thr=sysThreshold(s);
    const over=rec>thr;const rtag=rec<1?tag('Hazır','var(--green)'):over?tag('~'+Math.round(rec)+' sa yük · aşırı','var(--red)','🔴'):tag('~'+Math.round(rec)+' sa yük','var(--orange)','⏳');
    h+=`<div class="card tight"><div style="display:flex;align-items:center;gap:12px"><div style="font-size:22px">${SINFO[s].icon}</div>
      <div style="flex:1"><div style="font-weight:600">${esc(SINFO[s].label)}</div><div class="muted tiny">${esc(SINFO[s].desc)} · aşırı yük sınırı ${Math.round(thr)} sa</div>
        <div style="margin-top:6px">${barHtml(thr?rec/thr:0,{color:over?'var(--red)':SINFO[s].color,cls:'md',bg:'var(--surfhi)'})}</div></div>
      <div style="text-align:right;min-width:76px"><div style="font-size:12px;color:${st.c};font-weight:500">${fmt(sl[s])} · ${st.t}</div>
        <div style="margin-top:4px;display:flex;justify-content:flex-end">${rtag}</div></div></div>
      ${over?`<div class="muted small" style="margin-top:8px;color:var(--red)">Birikmiş iyileşme (${Math.round(rec)} sa) aşırı yük sınırını (${Math.round(thr)} sa) aştı — bu sistemi bugün dinlendir.</div>`:''}</div>`;}
  h+=sec('Bugün için öneri');
  const ready=S_ORDER.filter(s=>sysRecovery(s)<sysThreshold(s)).sort((a,b)=>sl[a]-sl[b]);
  const focus=ready.filter(s=>sl[s]<S.cfg.lowBelow&&sysRecovery(s)<1).slice(0,2);
  const over=S_ORDER.filter(s=>sysRecovery(s)>sysThreshold(s));
  if(over.length)h+=noteBox(`${over.map(s=>SINFO[s].label).join(', ')} eşiği aştı — bu sistem(ler)i bugün dinlendir.`,{color:'var(--red)',icon:'🔴'});
  if(focus.length===0)h+=noteBox('Tam toparlanmış ve haftalık uyaranı düşük sistem yok. Planı takip et.',{color:'var(--green)',icon:'✓'});
  else h+=noteBox(`${focus.map(s=>SINFO[s].label).join(' ve ')} tam toparlanmış ve haftalık uyaranı düşük. Bugün bunlara ağırlık verebilirsin.`,{icon:'💡'});
  const cands=S.all().filter(e=>!S.active.has(e.id)&&(e.block!==null||e.custom)).sort((a,b)=>gapScore(b,ml,sl)-gapScore(a,ml,sl));
  if(cands.length&&gapScore(cands[0],ml,sl)>0)h+=noteBox(`Boşluğu en çok kapatacak aday: ${cands.slice(0,2).map(e=>e.name).join(', ')}. Detay Program sekmesinde.`,{icon:'🧭'});
  h+=`<div class="muted" style="font-size:12px;line-height:1.45;margin-top:6px">Birikmiş iyileşme: her egzersizin kendi iyileşme süresinden (editörde ayarlanır; boşsa sistemlerinden türetilir) gelen kalan süreler, egzersiz-gün başına bir kez toplanır ve RPE ile ölçeklenir. Bir sistemin toplamı eşiğini (${'{'}sistem saati × çarpan${'}'}) aşınca aşırı yüklenme uyarısı çıkar. Eşikler, saatler, RPE çarpanları ve aşırı-yüklenme çarpanı Ayarlar → Analiz ve kurallar'dan değiştirilebilir. Tahmindir, kendi hissinle oku.</div>`;
  return h;
}
