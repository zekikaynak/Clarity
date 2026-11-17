import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createDirectProviders} from '../providers.mjs';
test('direct ETF flow converts USD to millions and preserves missing days',async()=>{
 const requested=[];const provider=createDirectProviders({remote:async url=>{requested.push(url);return [[Date.UTC(2026,10,1),2500000],[Date.UTC(2026,10,2),-3000000],[Date.UTC(2026,10,3),null]];},cached:async(_key,_ttl,fn)=>({data:await fn()})});
 const result=await provider.etfFlows('btc');assert.equal(result.rows[0].total,2.5);assert.equal(result.rows[1].total,-3);assert.equal(result.rows[2].total,null);assert.equal(result.rows[2].complete,false);assert.ok(requested.some(x=>new URL(x).hostname==='charts.bgeometrics.com'));
});
test('runtime no longer calls the intermediary dashboard',()=>{for(const file of ['server.mjs','providers.mjs','public/app.js','public/reference.js','public/index.html']){const content=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');assert.equal(/coinmuhendisi|Coin Mühendisi/i.test(content),false,file);}});
test('unavailable ETF AUM is not reported as zero dollars',async()=>{
 const provider=createDirectProviders({remote:async url=>url.includes('nasdaq')?{data:{summaryData:{AUM:{value:'N/A'}}}}:{chart:{result:[{meta:{longName:'Test ETF',regularMarketPrice:10,regularMarketVolume:20,regularMarketTime:1793923200,previousClose:10}}]}},cached:async(_key,_ttl,fn)=>({data:await fn()})});
 const result=await provider.reference('etfbtc');assert.ok(result.props.pageData.data.length>0);assert.ok(result.props.pageData.data.every(x=>x.aum===null));
});
