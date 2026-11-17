export const ETF_ASSETS=['btc','eth','sol','xrp','hype'];
export function normalizeETFFundHistory(raw,asset,summary){
 if(!Array.isArray(raw?.days)||!raw.days.length)throw Error('ETF fon akış serisi alınamadı');
 const value=x=>x==null||x===''||!Number.isFinite(+x)?null:+x;
 const rows=raw.days.filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x.date)).map(x=>{const total=value(x.totalUsdM),fundFlows=(x.funds||[]).filter(f=>/^[A-Z0-9.-]{1,12}$/.test(f.ticker)).map(f=>({ticker:f.ticker,total:value(f.netFlowUsdM)}));return {date:x.date,total,values:[total],complete:total!==null&&fundFlows.length>0&&fundFlows.every(f=>f.total!==null),fundFlows};}).sort((a,b)=>a.date.localeCompare(b.date));
 if(!rows.length)throw Error('ETF ölçüm tarihi alınamadı');
 const published=summary?.assets?.find(x=>x.symbol===(asset==='hype'?'HYP':asset.toUpperCase()));if(published&&published.netFlowUsdM!=null&&Number.isFinite(+published.netFlowUsdM)){const row=rows.find(x=>x.date===(published.date||summary.referenceDate));if(row){row.fundsComplete=row.fundFlows.every(f=>f.total!==null);row.total=+published.netFlowUsdM;row.values=[row.total];row.complete=true;}}
 return {asset,source:'cryptoetf-fund-flows',funds:rows.at(-1).fundFlows.map(x=>x.ticker),rows,measuredAt:Date.parse(rows.at(-1).date+'T00:00:00Z')};
}
const amount=value=>value==null||value===''||!Number.isFinite(+value)?null:+value/1e6;
export function normalizeETFFlows(raw,asset){
 if(!Array.isArray(raw?.data)||!raw.data.length)throw Error('Günlük ETF akış serisi alınamadı');
 const dates=new Map();
 for(const x of raw.data){
  if(!Number.isFinite(+x.timestamp)||+x.timestamp<=0)continue;
  const date=new Date(+x.timestamp*1000).toISOString().slice(0,10),total=amount(x.flow_usd);
  if(dates.has(date))continue;
  const fundFlows=(x.etfs||[]).filter(f=>/^[A-Z0-9.-]{1,12}$/.test(f.ticker)).map(f=>({ticker:f.ticker,total:amount(f.flow_usd)}));
  dates.set(date,{date,total,values:[total],complete:x.settled===true&&total!==null,fundFlows});
 }
 const rows=[...dates.values()].sort((a,b)=>a.date.localeCompare(b.date)).slice(-90);
 if(!rows.length)throw Error('Geçerli ETF ölçüm tarihi bulunamadı');
 return {asset,source:'usd-etf-history',funds:rows.at(-1).fundFlows.map(x=>x.ticker),rows,measuredAt:Date.parse(rows.at(-1).date+'T00:00:00Z')};
}
export function buildETFReport(results){
 const date=results.flatMap(x=>x.data?.rows.filter(r=>r.complete).map(r=>r.date)||[]).sort().at(-1)||null;
 const assets=ETF_ASSETS.map(asset=>{
  const result=results.find(x=>x.asset===asset),row=result?.data?.rows.find(x=>x.date===date);
  return {asset,date,amount:row?.complete?row.total:null,complete:!!row?.complete,lastAvailableDate:result?.data?.rows.filter(x=>x.complete).at(-1)?.date||null,error:result?.error||null,stale:!!result?.stale};
 });
 const count=assets.filter(x=>x.complete).length;
 return {date,assets,count,complete:count===ETF_ASSETS.length,total:count?assets.reduce((sum,x)=>sum+(x.complete?x.amount:0),0):null,unit:'USD millions',measuredAt:date?Date.parse(date+'T00:00:00Z'):null};
}
