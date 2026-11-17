import {newsHeadlines,newsImportance,newsEndpoint} from './news-view.js';
import {dateFormat,timeFormat,dateTimeFormat,monthFormat} from './date-format.js';
import {translate,locale} from './i18n.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createNewsRibbon({element}){
 let items=[],index=0,timer,refresh;
 function show(){
  const x=items[index];
  element.className='news-ribbon';
  element.innerHTML=`<a class="ribbon-label" href="#news"><i></i>${translate('SON HABERLER')}</a>${x?`<a class="ribbon-headline" href="${esc(x.url)}" target="_blank" rel="noreferrer" data-no-translate>${newsHeadlines(x)}<time>${timeFormat(x.date)}</time></a>${newsImportance(x.title,{compact:true})}<div class="ribbon-controls"><button data-news-prev aria-label="${translate('Önceki Haber')}">‹</button><span>${index+1} / ${items.length}</span><button data-news-next aria-label="${translate('Sonraki Haber')}">›</button></div>`:`<a class="ribbon-headline" href="#news">${translate('Haber Akışı Yükleniyor…')}</a>`}`;
  element.querySelector('[data-news-prev]')?.addEventListener('click',()=>step(-1));element.querySelector('[data-news-next]')?.addEventListener('click',()=>step(1));
 }
 function step(delta){if(items.length){index=(index+delta+items.length)%items.length;show();}}
 async function load(){try{const r=await fetch('/api/'+newsEndpoint);if(!r.ok)throw Error();const d=await r.json();const next=(d.data?.items||[]).filter(x=>/^https?:\/\//.test(x.url)&&x.title).slice(0,15);if(next.length){items=next;index=Math.min(index,items.length-1);show();}else if(!items.length)unavailable();}catch{if(!items.length)unavailable();}}
 function unavailable(){element.innerHTML=`<a class="ribbon-label" href="#news">${translate('HABER AKIŞI')}</a><a class="ribbon-headline" href="#news">${translate('Haber Kaynaklarına Şu Anda Ulaşılamıyor')} ↗</a>`;}
 return {start(){show();load();refresh=setInterval(load,180000);timer=setInterval(()=>{if(!element.matches(':hover')&&!element.contains(document.activeElement)&&!document.hidden)step(1);},12000);},dispose(){clearInterval(timer);clearInterval(refresh);}};
}
