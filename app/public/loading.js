const escapeText=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function loading(label='Veriler Yükleniyor',{compact=false}={}){
 return `<div class="clarity-loader${compact?' loader-compact':''}" role="status" aria-live="polite" aria-label="${escapeText(label)}"><svg class="loader-logo" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path class="loader-outer" d="M30 9a15 15 0 1 0 0 22" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/><path class="loader-inner" d="M26 14a8.2 8.2 0 1 0 0 12" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/></svg><span class="loader-copy">${escapeText(label)}</span><span class="loader-line" aria-hidden="true"><i></i></span></div>`;
}
