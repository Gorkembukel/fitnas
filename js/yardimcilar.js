// Saf yardımcılar: tarih, biçimlendirme, HTML kaçışı. Hiçbir modüle bağımlı değildir.
/* ══════════════ YARDIMCILAR ══════════════ */
export const pad=n=>String(n).padStart(2,'0');
export const dOnly=d=>new Date(d.getFullYear(),d.getMonth(),d.getDate());
export const weekday=d=>((d.getDay()+6)%7)+1;
export const diffDays=(a,b)=>Math.round((dOnly(a)-dOnly(b))/86400000);
export const dayKey=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
export const dm=d=>`${d.getDate()}.${pad(d.getMonth()+1)}`;
export const fmt=v=>Number.isInteger(v)?String(v):v.toFixed(1);
export const sameDay=(a,b)=>a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
export const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const daysSince=ts=>Math.floor((Date.now()-ts)/86400000);
export const dt=l=>new Date(l.t);
export function monthStart(d){return new Date(d.getFullYear(),d.getMonth(),1);}
export function addMonths(d,k){return new Date(d.getFullYear(),d.getMonth()+k,1);}
