export function fundingMeaning(rate){
 if(rate==null||!Number.isFinite(+rate))return {payer:null,receiver:null,label:'Fonlama Verisi Alınamadı'};
 return +rate>0?{payer:'Long',receiver:'Short',label:'Long Öder → Short Alır'}:+rate<0?{payer:'Short',receiver:'Long',label:'Short Öder → Long Alır'}:{payer:null,receiver:null,label:'Bu Oranda Fonlama Ödemesi Yok'};
}
export function intervalMillis(interval){if(/^\d+m$/.test(String(interval)))return parseInt(interval)*60000;const s=String(interval).toUpperCase();if(/^\d+$/.test(s))return +s*60000;const m=s.match(/^(\d*)([SHDW])$/);if(!m)return null;return +(m[1]||1)*({S:1000,M:60000,H:3600000,D:86400000,W:604800000}[m[2]]);}
export function closingTime(now,interval){if(/^(\d*)M$/.test(String(interval))){const d=new Date(now),step=+(String(interval).slice(0,-1)||1),months=d.getUTCFullYear()*12+d.getUTCMonth(),next=(Math.floor(months/step)+1)*step;return Date.UTC(Math.floor(next/12),next%12,1);}const step=intervalMillis(interval);if(!step)return null;const origin=/W$/.test(String(interval).toUpperCase())?Date.UTC(1970,0,5):0;return origin+(Math.floor((now-origin)/step)+1)*step;}
export function countdown(ms){const seconds=Math.max(0,Math.ceil(ms/1000)),h=Math.floor(seconds/3600),m=Math.floor(seconds%3600/60),s=seconds%60;return [h,m,s].map(x=>String(x).padStart(2,'0')).join(':');}
export function cryptoImportance(title,sourceImpact='',country='USD'){
 const text=String(title).toLowerCase();
 const critical=/\b(fomc|cpi|pce|non.farm|payroll|fed rate|interest rate decision|rate decision|consumer price index|producer price index|federal funds|unemployment rate|average hourly earnings|inflation|sec approv|etf approv|hack|exploit|bankrupt|war|tüfe|enflasyon|faiz kararı|tarım dışı)\b/i;
 const medium=/\b(fed|powell|boj|boe|ecb|ueda|lagarde|employment|unemployment|jobless|job openings|jolts|sanctions|tariff|election|gdp|pmi|retail sales|jobs|etf|treasury|regulat|sec|cftc|stablecoin|işsizlik|büyüme)\b/i;
 if(critical.test(text)||/\b(boj|ecb|boe|rbnz|rba|snb|boc|bank of japan|bank of england)\b.*\b(rate|decision|policy|statement|outlook|summary of opinions)\b/i.test(text))return {level:'high',label:'Yüksek Önem'};
 if(medium.test(text)||String(sourceImpact).toLowerCase()==='high')return {level:'medium',label:'Orta Önem'};
 return {level:'low',label:'Düşük Önem'};
}
export const istanbulDate=date=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(date));
export function calendarEvents(events){return events.filter(x=>['USD','EUR','JPY','CNY','GBP','CAD','AUD','CHF','NZD'].includes(x.country)&&!['holiday','non-economic'].includes(String(x.impact).toLowerCase())&&Number.isFinite(Date.parse(x.date))).map(x=>({...x,importance:cryptoImportance(x.title,x.impact,x.country)})).sort((a,b)=>Date.parse(a.date)-Date.parse(b.date));}
