import {icon} from './icons.js';
export function renderNavigation(nav,active){
 document.querySelector('#nav').innerHTML=nav.map(([id,,name,badge],i)=>`${i===10?'<div class="nav-section">TAKİP VE YÖNETİM</div>':''}<button data-route="${id}" aria-label="${name}" title="${name}" class="${active===id?'active':''}"><span class="icon">${icon(id)}</span><span>${name}</span>${badge?`<small>${badge}</small>`:''}</button>`).join('');
}
