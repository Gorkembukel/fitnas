// Tema tercihi (sistem / açık / koyu).
export function themePref(){try{return localStorage.getItem('theme')||'system';}catch(e){return 'system';}}
export function themeLabel(){return {system:'Sistem',light:'Açık',dark:'Koyu'}[themePref()];}
export function applyTheme(){const t=themePref();if(t==='system')document.documentElement.removeAttribute('data-theme');else document.documentElement.setAttribute('data-theme',t);}
export function cycleTheme(){const o=['system','light','dark'];const n=o[(o.indexOf(themePref())+1)%3];try{localStorage.setItem('theme',n);}catch(e){}applyTheme();}
