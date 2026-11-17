export function heatmapSymbols(html){
 const coins=[...new Set([...String(html).matchAll(/href=["']\/liquidation-heatmap\/([A-Z0-9]{1,25})["']/g)].map(x=>x[1]))];
 if(!coins.length)throw Error('Haritanın varlık listesi alınamadı');
 return coins.map(baseAsset=>({baseAsset,symbol:baseAsset+'USDT'})).sort((a,b)=>a.baseAsset==='BTC'?-1:b.baseAsset==='BTC'?1:a.baseAsset.localeCompare(b.baseAsset));
}
export function decodeLiquidationHeatmap(d){
 const {cols,rows,cap,t0,dt,y0,ratio}=d;
 if(d.error||!d.db||!Number.isInteger(cols)||!Number.isInteger(rows)||cols<1||rows<1||cols*rows>250000||!(cap>0&&dt>0&&y0>0&&ratio>1))throw Error('Ücretsiz harita kaynağı geçerli veri sağlamadı');
 const bytes=Buffer.from(d.cells||'','base64');if(bytes.length!==cols*rows)throw Error('Harita hücreleri eksik');
 const points=[];for(let x=0;x<cols;x++)for(let y=0;y<rows;y++){const v=bytes[x*rows+y];if(v)points.push([x,y,cap*(v/255)**2]);}
 return {source:'Swolecharts · Açık Erişim',symbol:d.coin,model:d.version,measuredAt:d.as_of,price:d.price,priceStale:!!d.price_stale,times:Array.from({length:cols},(_,i)=>t0+i*dt),prices:Array.from({length:rows},(_,i)=>y0*ratio**i),points};
}
export function normalizeCalendarEvent(x){
 const date=x.time||x.date,country=x.currency||x.country;
 if(!x.title||!Number.isFinite(Date.parse(date)))return null;
 return {id:x.id||`${country}:${x.title}:${date}`,title:String(x.title),country,date:new Date(date).toISOString(),impact:String(x.impact||'low').toLowerCase(),previous:x.previous??'',forecast:x.forecast??'',actual:x.actual??'',status:x.status||'scheduled',movedFrom:x.moved_from||'',actualSupported:true};
}
