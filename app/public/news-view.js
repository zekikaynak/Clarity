import {language,translate} from './i18n.js';
import {importanceMeter} from './economic-calendar.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const newsEndpoint=language==='tr'?'news?lang=tr':'news';
export function newsHeadlines(item,{lang=language}={}){const original=String(item.title||''),tr=lang==='tr'&&item.titleTr&&item.titleTr!==original?item.titleTr:null;return `<span class="news-headlines" data-no-translate>${tr?`<strong class="news-translated" lang="tr" title="Otomatik Türkçe Çeviri">${esc(tr)}</strong><small class="news-original" lang="en">${esc(original)}</small>`:`<strong class="news-original-title">${esc(original)}</strong>${lang==='tr'&&!item.titleTr?'<small class="news-translation-pending">Türkçe Çeviri Alınamadı</small>':''}`}</span>`;}
export function newsImportance(title,{compact=false}={}){return `<span class="news-importance${compact?' news-importance-compact':''}">${importanceMeter(title)}</span>`;}
