// Sabit taksonomi (kas/sistem), gün/ay adları, ağrı seviyeleri, analiz ayarlarının varsayılanları.
// Hiçbir modüle bağımlı değildir (import eklemeyin: döngüsel yüklemede kCatalog/S hazır olmaz).
/* ══════════════ SABİTLER ══════════════ */
export const M_ORDER=['gogus','omuz','triseps','lat','ustSirt','biseps','onkol','kuadriseps','hamstring','gluteus','baldir','core','coreRot','kalcaYan'];
export const S_ORDER=['sinir','kasItme','kasCekme','kasBacak','kasGovde','tendonKol','tendonItme','tendonDiz','tendonAsil','tendonKalca','kemik','mobilite','reaktif','aerobik','anaerobik'];
export const MINFO={
  gogus:{label:'Göğüs',region:'Üst vücut: itme'},omuz:{label:'Omuz',region:'Üst vücut: itme'},triseps:{label:'Triseps',region:'Üst vücut: itme'},
  lat:{label:'Sırt (lat)',region:'Üst vücut: çekme'},ustSirt:{label:'Üst sırt / arka omuz',region:'Üst vücut: çekme'},biseps:{label:'Biseps',region:'Üst vücut: çekme'},onkol:{label:'Ön kol / kavrama',region:'Üst vücut: çekme'},
  kuadriseps:{label:'Kuadriseps',region:'Alt vücut'},hamstring:{label:'Hamstring',region:'Alt vücut'},gluteus:{label:'Glüte',region:'Alt vücut'},baldir:{label:'Baldır / Aşil',region:'Alt vücut'},kalcaYan:{label:'Kalça yan / adduktör',region:'Alt vücut'},
  core:{label:'Core (bastırma)',region:'Gövde'},coreRot:{label:'Core (rotasyon / yan)',region:'Gövde'},
};
export const SINFO={
  sinir:{label:'Sinir sistemi',desc:'Koordinasyon, motor ünite devşirme, hız',hours:48,color:'#8e6cf0',icon:'⚡'},
  kasItme:{label:'İtme kasları',desc:'Göğüs, omuz, triseps (kesit/kuvvet)',hours:48,color:'#4a90e2',icon:'🏋️'},
  kasCekme:{label:'Çekme kasları',desc:'Sırt, biseps, ön kol (kesit/kuvvet)',hours:48,color:'#5a86d8',icon:'🏋️'},
  kasBacak:{label:'Bacak kasları',desc:'Kuadriseps, hamstring, glüte, baldır',hours:48,color:'#4178c8',icon:'🏋️'},
  kasGovde:{label:'Gövde kasları',desc:'Core, rotasyon, karın',hours:48,color:'#6a96e2',icon:'🏋️'},
  kas:{label:'Kas (genel)',desc:'Eski genel kas etiketi',hours:48,color:'#4a90e2',icon:'🏋️'},
  tendonKol:{label:'Dirsek/ön kol tendonu',desc:'Çekiş, asılma, kavrama (yavaş uyum)',hours:72,color:'#26a69a',icon:'🔗'},
  tendonItme:{label:'İtme tendonu (omuz/dirsek)',desc:'Şınav, duvar itme, itme yükü (yavaş uyum)',hours:72,color:'#2f9e93',icon:'🔗'},
  tendonDiz:{label:'Diz/patellar tendon',desc:'Squat, duvar oturuşu, çömelme (yavaş uyum)',hours:72,color:'#3d8f7a',icon:'🔗'},
  tendonAsil:{label:'Aşil/baldır tendonu',desc:'Koşu, ip, sıçrama (yavaş uyum)',hours:72,color:'#1f8f8f',icon:'🔗'},
  tendonKalca:{label:'Kalça/leğen bağ dokusu',desc:'Kalça menteşesi, hamstring bağı (yavaş uyum)',hours:72,color:'#3aa07a',icon:'🔗'},
  tendon:{label:'Tendon / bağ (genel)',desc:'Eski genel tendon etiketi',hours:72,color:'#26a69a',icon:'🔗'},
  kemik:{label:'Kemik',desc:'Darbe ve yük uyaranı (yavaş uyum)',hours:72,color:'#a1887f',icon:'🦴'},
  mobilite:{label:'Mobilite',desc:'Aktif ve pasif hareket açıklığı',hours:24,color:'#ec6a9c',icon:'🧘'},
  reaktif:{label:'Reaktif güç',desc:'Germe-kısalma döngüsü, çeviklik',hours:72,color:'#ffa726',icon:'↕️'},
  aerobik:{label:'Aerobik',desc:'Mitokondri, yağ oksidasyonu, taban',hours:24,color:'#66bb6a',icon:'❤️'},
  anaerobik:{label:'Anaerobik',desc:'Yüksek şiddetli tekrar kapasitesi',hours:48,color:'#ef5350',icon:'🔥'},
};
export const kDayNames=['Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi','Pazar'];
export const kDayShort=['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];
export const kSessions={1:'Kuvvet A',2:'Koşu günü',3:'Toparlanma ve yoga',4:'Kuvvet B: tendon',5:'İp ve gölge boks',6:'Uzun Zone 2',7:'Toparlanma ve yoga'};
export const kGrpOrder={'Seans':0,'Baz blok':1,'Çekme':2,'Özel':3};
export const kAreas=['Dirsek','Omuz','Bilek','Diz','Aşil','Bel'];
export const PAIN_AREAS=[
  {sys:'tendonKol',label:'Dirsek / ön kol'},
  {sys:'tendonItme',label:'Omuz / itme'},
  {sys:'tendonDiz',label:'Diz'},
  {sys:'tendonAsil',label:'Aşil / baldır'},
  {sys:'tendonKalca',label:'Kalça / bel'}
];
export const PAIN_LVL=[{t:'Yok',c:'var(--green)'},{t:'Hafif',c:'var(--orange)'},{t:'Orta',c:'#e8892b'},{t:'Şiddetli',c:'var(--red)'}];
export const PAIN_AMBER='#e8892b';
export const TENDONS=['tendonKol','tendonItme','tendonDiz','tendonAsil','tendonKalca'];
export const KAS=['kasItme','kasCekme','kasBacak','kasGovde'];
export const SYS_GROUPS=[{label:'Kaslar',icon:'🏋️',color:'#4a90e2',members:KAS,sub:'İtme · çekme · bacak · gövde'},{label:'Tendonlar / bağ',icon:'🔗',color:'#26a69a',members:TENDONS,sub:'Dirsek · itme · diz · Aşil · kalça'}];
export const GROUP_MEMBERS=[].concat(KAS,TENDONS);
export const kAreaEx={'Dirsek':['chin','pullNeg','pullup','hang','row1'],'Omuz':['push','wallpush','wallhard','shadow','archer','clap'],'Bilek':['push','wallpush','wallhard','archer','clap'],'Diz':['squat','wallsit','bulgar','run','pogo'],'Aşil':['run','rope','pogo'],'Bel':['rdl1','row1','deadbug','carry']};
export const kKinds=['Kilo (kg)','Bel çevresi (cm)','Dinlenik nabız (bpm)'];
export const kIntervals=[7,14,21,28,42,56];
export const kMonths=['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
export const PHASE=[{t:'Hafta 1',c:'#3aa0a0'},{t:'Hafta 2',c:'#3a76d8'},{t:'Hafta 3',c:'#6a4ee0'},{t:'Deload',c:'#c9820b'}];
export const CFG_DEFAULT={
  recovery:{sinir:48,kasItme:48,kasCekme:48,kasBacak:48,kasGovde:48,tendonKol:72,tendonItme:72,tendonDiz:72,tendonAsil:72,tendonKalca:72,kemik:72,mobilite:24,reaktif:72,aerobik:24,anaerobik:48},
  openBelow:1, lowBelow:8, window:7,
  gapOpen:2, gapLow:1, gapAux:false, balanceRatio:0.5,
  rpe:{f8:1,f7:0.75,f6:0.5,f5:0.35,f0:0.2}, impactFactor:0.75, lookbackHours:96, overloadMult:1, setContrib:0.5,
  halfDays:[3,7], gtgRpe:5, spaceMinHours:24,
  painHalfLevel:2, painSkipLevel:3, painStrain:[0,12,24,48],
  calibAuxShare:0.5
};
export function mergeCfg(s){s=s||{};return {
  recovery:Object.assign({},CFG_DEFAULT.recovery,s.recovery||{}),
  openBelow:s.openBelow??CFG_DEFAULT.openBelow, lowBelow:s.lowBelow??CFG_DEFAULT.lowBelow, window:s.window??CFG_DEFAULT.window,
  gapOpen:s.gapOpen??CFG_DEFAULT.gapOpen, gapLow:s.gapLow??CFG_DEFAULT.gapLow, gapAux:s.gapAux??CFG_DEFAULT.gapAux, balanceRatio:s.balanceRatio??CFG_DEFAULT.balanceRatio,
  rpe:Object.assign({},CFG_DEFAULT.rpe,s.rpe||{}), impactFactor:s.impactFactor??CFG_DEFAULT.impactFactor, lookbackHours:s.lookbackHours??CFG_DEFAULT.lookbackHours, overloadMult:s.overloadMult??CFG_DEFAULT.overloadMult, setContrib:s.setContrib??CFG_DEFAULT.setContrib,
  halfDays:Array.isArray(s.halfDays)?s.halfDays.slice():CFG_DEFAULT.halfDays.slice(), gtgRpe:s.gtgRpe??CFG_DEFAULT.gtgRpe, spaceMinHours:s.spaceMinHours??CFG_DEFAULT.spaceMinHours,
  painHalfLevel:s.painHalfLevel??CFG_DEFAULT.painHalfLevel, painSkipLevel:s.painSkipLevel??CFG_DEFAULT.painSkipLevel, painStrain:Array.isArray(s.painStrain)?s.painStrain.slice():CFG_DEFAULT.painStrain.slice(),
  calibAuxShare:s.calibAuxShare??CFG_DEFAULT.calibAuxShare
};}
export const all7=[1,2,3,4,5,6,7];
