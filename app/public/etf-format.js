import {dateOnlyFormat} from './date-format.js';
import {locale,language} from './i18n.js';
export const etfAssets=[['btc','Bitcoin'],['eth','Ethereum'],['sol','Solana'],['xrp','XRP'],['hype','Hyperliquid']];
export function etfDate(value,lang=language){return dateOnlyFormat(value,{lang});}
export function etfAmount(millions,lang=language){
 const en=lang==='en';
 if(millions==null||!Number.isFinite(+millions))return en?'Awaiting Publication':'Yayın Bekleniyor';
 const n=+millions;if(n===0)return en?'0 USD':'0 dolar';
 const magnitude=Math.abs(n),value=magnitude>=1000?magnitude/1000:magnitude>=1?magnitude:magnitude>=.001?magnitude*1000:magnitude*1e6;
 const unit=en?(magnitude>=1000?'billion':magnitude>=1?'million':magnitude>=.001?'thousand':''):(magnitude>=1000?'milyar':magnitude>=1?'milyon':magnitude>=.001?'bin':'');
 return `${n<0?'−':'+'}${value.toLocaleString(en?'en-GB':'tr-TR',{maximumFractionDigits:2})}${unit?' '+unit:''} ${en?'USD':'dolar'}`;
}
