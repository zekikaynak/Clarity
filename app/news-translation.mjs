import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
const normalize=s=>String(s??'').replace(/\s+/g,' ').trim();
const brands=['Lighter','Hyperliquid','Polymarket','Uniswap','Aave','Ethena','OpenSea','Chainlink','Bitget','Coinbase','Binance'];
export function prepareNewsTitle(title){return String(title).replace(/\b(is|are|was|were) short (copper|gold|silver|bitcoin|ether|ethereum|BTC|ETH|stocks|bonds)\b/gi,'$1 holding a short position in $2').replace(/\b(Fed|Federal Reserve) Governor\b/gi,'Federal Reserve Board member').replace(/\bshort position\b/gi,'ZXQSHORTPOSITIONZXQ').replace(/\bwithdrawal controls\b/gi,'controls over customer fund withdrawals').replace(new RegExp('\\b('+brands.join('|')+')\\b','g'),name=>'ZXQBRAND'+brands.indexOf(name)+'ZXQ');}
export function restoreNewsBrands(title){return String(title).replace(/ZXQSHORTPOSITIONZXQ/gi,'kısa pozisyon').replace(/ZXQ\s*BRAND\s*(\d+)\s*ZXQ/gi,(all,n)=>brands[+n]||all);}
export async function translateNewsBatch(titles){
 const url=new URL('https://translate.googleapis.com/translate_a/single');
 for(const [key,value]of Object.entries({client:'gtx',sl:'auto',tl:'tr',dt:'t',q:titles.map(prepareNewsTitle).join('\n')}))url.searchParams.set(key,value);
 const response=await fetch(url,{signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error('Çeviri servisine erişilemiyor');const data=await response.json();
 const lines=(data[0]||[]).map(x=>x[0]||'').join('').split('\n').map(x=>normalize(restoreNewsBrands(x)));
 if(lines.length!==titles.length||lines.some(x=>!x))throw Error('Çeviri yanıtı başlıklarla eşleşmedi');return lines;
}
export function createNewsTranslator({translateBatch=translateNewsBatch,now=()=>Date.now(),file=path.join(process.env.CLARITY_DATA_DIR||path.join(process.env.LOCALAPPDATA||os.homedir(),'Clarity','data'),'news-translations.json')}={}){
 const entries=new Map();let initialized;
 async function init(){if(!initialized)initialized=(async()=>{try{if(file)for(const x of JSON.parse(await fs.readFile(file,'utf8')))if(x?.schema===3&&x?.title&&x?.translation&&now()-x.at<7*86400000)entries.set(x.title,x);}catch{}})();return initialized;}
 function available(items){return items.map(x=>({...x,titleTr:entries.get(normalize(x.title))?.translation||null}));}
 async function translateTitles(items){
  await init();const titles=[...new Set(items.map(x=>normalize(x.title)).filter(Boolean))],missing=titles.filter(x=>!entries.has(x));
  const groups=[];let group=[],length=0;for(const title of missing){if(group.length&&(length+title.length>2800)){groups.push(group);group=[];length=0;}group.push(title);length+=title.length+1;}if(group.length)groups.push(group);
  let failed=false;
  for(let i=0;i<groups.length;i+=2){await Promise.all(groups.slice(i,i+2).map(async batch=>{try{const translated=await translateBatch(batch);if(translated.length!==batch.length)throw Error('Çeviri sayısı eşleşmedi');batch.forEach((title,j)=>{const translation=normalize(translated[j]);if(!translation)throw Error('Boş çeviri');entries.set(title,{title,translation,at:now(),schema:3});});}catch{failed=true;}}));}
  if(missing.length&&file){try{await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,JSON.stringify([...entries.values()].slice(-400)));}catch{}}
  if(failed)throw Error('Bazı haber başlıkları Türkçeye çevrilemedi; otomatik yeniden denenecek');return available(items);
 }
 return {translateTitles,available};
}
