export function rsi(values, period=14) {
  if(values.length<=period) return null;
  let gain=0,loss=0;
  for(let i=1;i<=period;i++){const d=values[i]-values[i-1];gain+=Math.max(d,0);loss+=Math.max(-d,0);}
  gain/=period;loss/=period;
  for(let i=period+1;i<values.length;i++){const d=values[i]-values[i-1];gain=(gain*(period-1)+Math.max(d,0))/period;loss=(loss*(period-1)+Math.max(-d,0))/period;}
  return gain===0&&loss===0?50:loss===0?100:100-100/(1+gain/loss);
}
export function aggregateTrade(candles, trade, seconds) {
  const anchor=seconds===604800?345600:0;
  const time=Math.floor((trade.time/1000-anchor)/seconds)*seconds+anchor, last=candles.at(-1);
  if(last&&time<last.time)return null;
  if(last?.time===time){last.high=Math.max(last.high,trade.price);last.low=Math.min(last.low,trade.price);last.close=trade.price;last.volume+=trade.qty;return last;}
  const candle={time,open:trade.price,high:trade.price,low:trade.price,close:trade.price,volume:trade.qty};candles.push(candle);return candle;
}
export function flowNumber(s){s=s.replace(/[,\s]/g,'');if(s==='-'||s==='')return null;return Number(s.replace(/\((.*?)\)/,'-$1'));}
export function technical(candles){
 const closes=candles.map(x=>x.close),ema=(values,n)=>{const out=[];let current;for(let i=0;i<values.length;i++){if(i===n-1)current=values.slice(0,n).reduce((a,b)=>a+b,0)/n;else if(i>=n)current=values[i]*2/(n+1)+current*(1-2/(n+1));out.push(i>=n-1?current:null);}return out;};
 const e20=ema(closes,20),e12=ema(closes,12),e26=ema(closes,26);let sum=0,pv=0,vol=0,day=-1;const sma=[],upper=[],lower=[],vwap=[],ema20=[];
 candles.forEach((c,i)=>{sum+=c.close;if(i>=20)sum-=closes[i-20];if(i>=19){const mean=sum/20,deviation=Math.sqrt(closes.slice(i-19,i+1).reduce((a,v)=>a+(v-mean)**2,0)/20);sma.push({time:c.time,value:mean});upper.push({time:c.time,value:mean+2*deviation});lower.push({time:c.time,value:mean-2*deviation});}if(e20[i]!=null)ema20.push({time:c.time,value:e20[i]});const d=Math.floor(c.time/86400);if(d!==day){day=d;pv=0;vol=0;}pv+=(c.high+c.low+c.close)/3*c.volume;vol+=c.volume;if(vol>0)vwap.push({time:c.time,value:pv/vol});});
 const macd=e26.flatMap((v,i)=>v===null?[]:[{time:candles[i].time,value:e12[i]-v}]),signal=ema(macd.map(x=>x.value),9).at(-1);
 return {sma,ema:ema20,upper,lower,vwap,rsi:rsi(closes),macd:macd.at(-1)?.value??null,signal:signal??null};
}
