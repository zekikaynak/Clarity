import {release} from './release.js';
import {english} from './translations.js';
export function resolveLanguage(system='tr',saved='auto'){if(['tr','en'].includes(saved))return saved;return String(system).toLowerCase().startsWith('tr')?'tr':'en';}
function preferred(){let saved='auto';try{saved=localStorage.getItem('clarity.language')||'auto';}catch{}return resolveLanguage((typeof document!=='undefined'&&document.documentElement.dataset.systemLanguage)|| (typeof navigator!=='undefined'?(navigator.languages?.[0]||navigator.language):'tr'),saved);}
export const language=preferred();
export const locale=language==='tr'?'tr-TR':'en-US';
const normalize=s=>String(s).normalize('NFC').replace(/\s+/g,' ').trim().toLocaleLowerCase('tr-TR');
const dictionary=new Map(Object.entries(english).map(([a,b])=>[normalize(a),b]));
const fragments=Object.entries(english).filter(([a])=>a.length>=2).sort((a,b)=>b[0].length-a[0].length);
const pattern=new RegExp(fragments.map(([a])=>a.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'giu');
export function translate(value){
 const text=String(value??'');if(language!=='en'||!text.trim())return text;
 const exact=dictionary.get(normalize(text));if(exact)return text.replace(text.trim(),exact);
 return text.replace(pattern,(match,offset,whole)=>{const before=whole[offset-1]||'',after=whole[offset+match.length]||'';if(/[\p{L}\p{N}]/u.test(before)&&/[\p{L}\p{N}]/u.test(match[0])||/[\p{L}\p{N}]/u.test(after)&&/[\p{L}\p{N}]/u.test(match.at(-1)))return match;return dictionary.get(normalize(match))||match;});
}
export function englishHeading(text){return String(text).replace(/[\p{L}][\p{L}\p{N}]*/gu,word=>{const keep=['DeFi','TradingView','Clarity','Hyperliquid'].find(x=>x.toLowerCase()===word.toLowerCase());if(keep)return keep;if(word===word.toUpperCase()&&word.length<=6)return word;return word[0].toUpperCase()+word.slice(1).toLowerCase();});}
export function initLanguage(){
 document.documentElement.lang=language;document.title=release.label+' · Market Intelligence';
 const select=document.querySelector('#language-select');try{select.value=localStorage.getItem('clarity.language')||'auto';}catch{}
 select.addEventListener('change',()=>{try{select.value==='auto'?localStorage.removeItem('clarity.language'):localStorage.setItem('clarity.language',select.value);}catch{}location.reload();});
 if(language!=='en')return;
 const applied=new WeakMap(),attrs=['aria-label','title','placeholder','data-label'];
 function apply(root){
  if(root.nodeType===3){const parent=root.parentElement;if(!parent||parent.closest('script,style,svg,[data-no-translate],.news-item h3,.calendar-original,.ribbon-headline'))return;const current=root.textContent;if(applied.get(root)===current)return;let next=translate(current);if(parent.matches('h1,h2,.tool b,.eyebrow,.section-label>span'))next=englishHeading(next);applied.set(root,next);if(next!==current)root.textContent=next;return;}
  if(root.nodeType!==1||root.matches('script,style,svg,[data-no-translate]'))return;
  for(const name of attrs){if(root.hasAttribute(name)){const text=root.getAttribute(name),next=translate(text);if(text!==next)root.setAttribute(name,next);}}
  for(const child of root.childNodes)apply(child);
 }
 const pending=new Set();let scheduled=false;
 const observer=new MutationObserver(records=>{for(const r of records){if(r.type==='characterData')pending.add(r.target);else if(r.type==='attributes')pending.add(r.target);else for(const n of r.addedNodes)pending.add(n);}if(!scheduled){scheduled=true;requestAnimationFrame(()=>{scheduled=false;for(const n of pending)if(n.isConnected)apply(n);pending.clear();});}});
 apply(document.body);observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:attrs});
}

export function localizedChart(chart){
 const original=chart.setOption.bind(chart);
 const localize=value=>{if(typeof value==='string')return translate(value);if(Array.isArray(value))return value.map(localize);if(typeof value==='function')return function(...args){const result=value.apply(this,args);return typeof result==='string'?translate(result):result;};if(value&&typeof value==='object'){const out={};for(const [key,item]of Object.entries(value))out[key]=localize(item);return out;}return value;};
 chart.setOption=(options,...args)=>original(language==='en'?localize(options):options,...args);return chart;
}
