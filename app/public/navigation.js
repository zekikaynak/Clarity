import {language} from './i18n.js';
import {icon} from './icons.js';
const mainRoutes=['overview','terminal','markets','heatmap','etf','news','macro'];
let more;
window.addEventListener('resize',()=>{if(more?.matches(':popover-open'))more.hidePopover();});
export function renderNavigation(nav,active){
 more?.remove();more=null;
 const item=([id,,name,badge])=>`<button data-route="${id}" aria-label="${name}" title="${name}" class="${active===id?'active':''}"><span class="icon">${icon(id)}</span><span>${name}</span>${badge?`<small>${badge}</small>`:''}</button>`;
 const primary=nav.filter(x=>mainRoutes.includes(x[0])),secondary=nav.filter(x=>!mainRoutes.includes(x[0]));
 const secondaryActive=secondary.some(x=>x[0]===active),label=language==='tr'?'Diğer Araçlar':'More Tools';
 const host=document.querySelector('#nav');host.innerHTML=primary.map(item).join('')+`<button type="button" id="nav-more" aria-haspopup="dialog" aria-expanded="false" aria-label="${label}" title="${label}" class="nav-more ${secondaryActive?'active':''}"><span class="icon">${icon('tools')}</span><span>${label}</span><small>↗</small></button>`;
 host.querySelector('#nav-more').onclick=()=>{
  if(!more){more=document.createElement('div');more.popover='auto';more.className='nav-more-panel';more.setAttribute('role','dialog');more.setAttribute('aria-label',label);more.innerHTML=`<div class="nav-more-heading"><div><small>CLARITY</small><strong>${label}</strong></div><button type="button" class="nav-more-close" aria-label="${language==='tr'?'Kapat':'Close'}">✕</button></div><div class="nav-more-grid">${secondary.map(item).join('')}</div>`;document.body.append(more);more.querySelector('.nav-more-close').onclick=()=>more.hidePopover();more.addEventListener('toggle',()=>host.querySelector('#nav-more')?.setAttribute('aria-expanded',String(more?.matches(':popover-open')||false)));}
  if(more.matches(':popover-open'))more.hidePopover();else{more.showPopover();const r=host.querySelector('#nav-more').getBoundingClientRect(),width=Math.min(460,innerWidth-24),left=innerWidth<=650?12:Math.min(r.right+14,innerWidth-width-12);Object.assign(more.style,{width:width+'px',left:left+'px',top:Math.max(12,Math.min(r.top,innerHeight-more.offsetHeight-12))+'px'});}
 };
}
