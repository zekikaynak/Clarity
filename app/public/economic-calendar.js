import {dateFormat,timeFormat,dateTimeFormat,monthFormat} from './date-format.js';
import {language} from './i18n.js';
import {locale} from './i18n.js';
import {turkishEvent} from './calendar-turkish.js';
import {calendarEvents,cryptoImportance,istanbulDate} from './market-context.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function importanceBadge(title,impact='',country='USD'){const x=cryptoImportance(title,impact,country);return `<span class="importance importance-${x.level}" title="Kripto piyasası için konu önemi. Fiyat yönünü veya kesin etkiyi göstermez."><i></i>${x.label}</span>`;}
export function importanceMeter(title,impact='',country='USD'){
 const x=cryptoImportance(title,impact,country),position={high:92,medium:50,low:8}[x.level];
 return `<span class="importance-meter importance-${x.level}" role="img" aria-label="${x.label}" title="Kripto İçin ${x.label} · Kırmızı: yüksek önem, yeşil: düşük önem. Fiyat yönü göstermez."><span class="importance-scale"><i style="left:${position}%"></i></span><span>${x.label}</span></span>`;
}
const time=value=>timeFormat(value);
const date=value=>dateFormat(value);
export async function loadCalendarSummary({api,target}){if(!target)return;try{const r=await api('calendar');if(!target.isConnected)return;const all=calendarEvents(r.data.events),now=Date.now(),today=all.filter(x=>istanbulDate(x.date)===istanbulDate(now)),pending=today.filter(x=>Date.parse(x.date)>now),next=all.find(x=>Date.parse(x.date)>now);target.innerHTML=`<button class="calendar-summary-link" data-route="macro"><div class="calendar-summary-heading"><span>Bugün <b>${today.length}</b> Küresel Veri Ve Olay</span><span>↗</span></div><p>${today.length?`${pending.length} yayın kaldı · ${today.filter(x=>x.importance.level==='high').length} yüksek önem taşıyan veri`:'Bugün küresel takvimde planlı veri görünmüyor.'}</p>${(pending.length?pending.slice(0,2):next?[next]:[]).map(x=>`<div class="calendar-preview-event"><time>${istanbulDate(x.date)===istanbulDate(now)?time(x.date):date(x.date)+' · '+time(x.date)}</time><span>${esc((language==='en'?x.title:turkishEvent(x.title)))}</span>${importanceMeter(x.title,x.impact,x.country)}</div>`).join('')}<small>İstanbul Saati · Küresel Kripto Takvimi</small></button>`;}catch{if(target.isConnected)target.innerHTML='<div class="empty">Ekonomik Takvim Şu Anda Alınamadı. <a href="#macro">Detaylar ↗</a></div>';}}
const regions={USD:'ABD',JPY:'Japonya',EUR:'Euro Bölgesi',CNY:'Çin',GBP:'Birleşik Krallık',CAD:'Kanada',AUD:'Avustralya',CHF:'İsviçre',NZD:'Yeni Zelanda'};
const present=x=>x!==null&&x!==undefined&&String(x).trim()!=='';
export function calendarResult(event,now=Date.now()){
 if(present(event.actual)){const impact=calendarCryptoImpact(event),labels={positive:['Kripto: Olası Destek','Crypto: Potential Support'],negative:['Kripto: Olası Baskı','Crypto: Potential Pressure'],neutral:['Kripto: Nötr Sürpriz','Crypto: No Surprise'],uncertain:['Kripto: Etki Belirsiz','Crypto: Impact Uncertain']};return `<span class="calendar-result calendar-result-${impact.tone}" title="${esc(impact.reason)}"><span class="calendar-number calendar-actual">${esc(event.actual)}</span>${resultComparison(event.actual,event.forecast)}<span class="calendar-crypto-impact">${labels[impact.tone][language==='en'?1:0]}</span></span>`;}
 if(/speech|meeting|conference|statement|minutes|report|summary of opinions|auction/i.test(event.title)&&!present(event.forecast)&&!present(event.previous))return `<span class="calendar-pending">${Date.parse(event.date)>now?'Etkinlik Bekleniyor':'Sayısal Sonuç Yok'}</span>`;
 return `<span class="calendar-pending">${Date.parse(event.date)>now?'Henüz Açıklanmadı':event.actualSupported===false?'Sonuç Kaynakta Yok':'Sonuç Alınamadı'}</span>`;
}
const parseResult=v=>{const m=String(v??'').replace(/,/g,'').trim().match(/^([+-]?\d+(?:\.\d+)?)\s*([%KMBT]?)$/i);return m?{value:+m[1],unit:m[2].toUpperCase()}:null;};
export function calendarCryptoImpact(event){
 const text=(tr,en)=>language==='en'?en:tr;
 const uncertain=()=>({tone:'uncertain',reason:text('Bu sonuçtan kripto yönü güvenilir biçimde çıkarılamıyor.','Crypto direction cannot be reliably inferred from this result.')});
 const a=parseResult(event.actual),f=parseResult(event.forecast);if(!a||!f||a.unit!==f.unit)return uncertain();
 if(a.value===f.value)return {tone:'neutral',reason:text('Beklentiyle aynı: sayısal sürpriz yok. Bu, fiyatın değişmeyeceği anlamına gelmez.','Matches forecast: no numerical surprise. Prices may still move.')};
 if(event.country!=='USD')return uncertain();
 const title=event.title||'',higher=a.value>f.value;
 const inflation=/\bcpi\b|\bppi\b|\bpce\b|consumer price|producer price|personal consumption expenditures.*price|import price|export price|inflation rate/i.test(title);
 const rates=/interest rate decision|fed.*rate decision|federal funds rate/i.test(title);
 const jobs=/non.?farm.*(?:payroll|employment)|adp.*employment|average hourly earnings/i.test(title);
 const claims=/unemployment rate|initial jobless claims|continuing jobless claims/i.test(title);
 const growth=/\bgdp\b|gross domestic product|retail sales|industrial production/i.test(title);
 if(!inflation&&!rates&&!jobs&&!claims&&!growth)return uncertain();
 // A policy/liquidity-channel heuristic, not an observed or guaranteed price reaction.
 // Severe weakness/deflation can trigger risk-off instead of an easing rally.
 if((inflation||growth||jobs)&&(a.value<0||f.value<0))return uncertain();
 if(claims&&Math.abs(a.value-f.value)>Math.max(Math.abs(f.value)*.15,a.unit==='%'?.3:0))return uncertain();
 const pressure=claims?!higher:higher;
 return {tone:pressure?'negative':'positive',reason:text('Koşullu ABD para politikası/likidite modeli: '+(pressure?'daha sıkı politika beklentisi kriptoyu baskılayabilir.':'gevşeme beklentisi kriptoyu destekleyebilir.')+' Resesyon, diğer veriler ve fiyatlama tepkiyi tersine çevirebilir; kesin tahmin değildir.','Conditional US policy/liquidity model: '+(pressure?'tighter-policy expectations may pressure crypto.':'easing expectations may support crypto.')+' Recession risk, other releases and prior pricing can reverse the reaction; this is not a prediction.')};
}
export function calendarResultTone(event){return calendarCryptoImpact(event).tone;}
export function resultComparison(actual,forecast){
 const a=parseResult(actual),f=parseResult(forecast);
 if(!a||!f||a.unit!==f.unit)return '';
 return `<small class="calendar-surprise ${a.value>f.value?'above':a.value<f.value?'below':'equal'}">${a.value>f.value?'Beklentinin Üstünde':a.value<f.value?'Beklentinin Altında':'Beklentiyle Aynı'}</small>`;
}
export async function loadCalendarDetail({api,target,table}){if(!target)return;try{const r=await api('calendar');if(!target.isConnected)return;const all=calendarEvents(r.data.events);target.innerHTML=`<div class="calendar-guide">ABD, Japonya, Euro Bölgesi, Çin ve diğer büyük ekonomiler · İstanbul saati · Önümüzdeki 7 gün ve uygulamanın kaydettiği son sonuçlar. <b>Kripto İçin Önem</b>, olayın olası piyasa ilgisidir; fiyat yönü tahmini değildir. Sonuçlar ücretsiz kaynakta yayımlandıkça, yaklaşık 15 dakikalık yenilemeyle gelir.${r.stale||r.data.stale?' <b>Bağlantı yenilenemedi; son kayıt gösteriliyor.</b>':''}${r.data.actualSupported===false?' <b>Yedek kaynak yalnızca takvim sağlıyor; açıklanan sonuçları sağlamıyor.</b>':''}</div><div class="calendar-filters"><label>Bölge <select id="calendar-region"><option value="all">Tüm Bölgeler</option>${Object.entries(regions).map(([id,name])=>`<option value="${id}">${name}</option>`).join('')}</select></label><label>Kripto İçin Önem <select id="calendar-importance"><option value="all">Tüm Önem Seviyeleri</option><option value="high">Yüksek Önem</option><option value="medium">Orta Önem</option><option value="low">Düşük Önem</option></select></label><span>Önceki <i class="previous-key"></i> Beklenti <i class="forecast-key"></i> Açıklanan <i class="actual-key"></i></span></div><div id="calendar-rows"></div>`;
 const draw=()=>{const region=target.querySelector('#calendar-region').value,importance=target.querySelector('#calendar-importance').value,rows=all.filter(x=>(region==='all'||x.country===region)&&(importance==='all'||x.importance.level===importance));target.querySelector('#calendar-rows').innerHTML=rows.length?`<div class="global-calendar">`+table(['TARİH / İSTANBUL','BÖLGE','OLAY','KRİPTO İÇİN ÖNEM','ÖNCEKİ','BEKLENTİ','AÇIKLANAN'],rows.map(x=>`<tr><td>${date(x.date)}<small>${time(x.date)}${x.status==='tentative'?' · Saat Kesin Değil':''}</small></td><td><span class="calendar-region">${esc(regions[x.country]||x.country)}</span><small>${esc(x.country)}</small></td><td class="calendar-event-title"><strong>${esc((language==='en'?x.title:turkishEvent(x.title)))}</strong>${language==='en'?'':`<small class="calendar-original">${esc(x.title)}</small>`}${x.status==='moved'?'<small class="calendar-rescheduled">Tarih Güncellendi</small>':''}</td><td>${importanceMeter(x.title,x.impact,x.country)}</td><td><span class="calendar-number calendar-previous">${present(x.previous)?esc(x.previous):'—'}</span></td><td><span class="calendar-number calendar-forecast">${present(x.forecast)?esc(x.forecast):'—'}</span></td><td>${calendarResult(x)}</td></tr>`))+`</div>`:'<div class="empty">Seçilen filtrelerde kayıt bulunmuyor.</div>';};draw();target.querySelector('#calendar-region').onchange=draw;target.querySelector('#calendar-importance').onchange=draw;
 }catch{if(target.isConnected)target.innerHTML='<div class="empty">Takvim Verisi Alınamadı. Yenile İle Tekrar Deneyebilirsin.</div>';}}
