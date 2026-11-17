import fs from 'node:fs';
import {previewCount} from '../public/overview-layout.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createSourceCache} from '../source-cache.mjs';
import {createNewsTranslator,prepareNewsTitle,restoreNewsBrands} from '../news-translation.mjs';
import {dateOnlyFormat,dateFormat,timeFormat,dateTimeFormat,monthFormat} from '../public/date-format.js';
import {fearState} from '../public/sentiment.js';
import {newsHeadlines,newsImportance} from '../public/news-view.js';
test('dates use Turkish day-month-year and English month-day-year without shifting a trading date',()=>{
 assert.equal(dateOnlyFormat('2026-11-04',{lang:'tr'}),'04.11.2026');assert.equal(dateOnlyFormat('2026-11-04',{lang:'en'}),'11/04/2026');assert.equal(dateOnlyFormat('2026-01-09T00:00:00Z',{lang:'en'}),'01/09/2026');assert.equal(dateOnlyFormat('2026-02-30',{lang:'tr'}),'—');assert.equal(dateFormat(null,{lang:'en'}),'—');assert.equal(monthFormat('2026-11',{lang:'en'}),'November 2026');
});
test('the same instant uses Turkish 24-hour time and English AM/PM in the declared Istanbul time zone',()=>{
 const instant='2026-11-04T18:05:00Z';assert.equal(timeFormat(instant,{lang:'tr'}),'21:05');assert.equal(timeFormat(instant,{lang:'en'}),'09:05 PM');assert.equal(dateTimeFormat(instant,{lang:'en'}),'11/04/2026 · 09:05 PM');
});
test('fear state is unknown without data, extreme fear at 12, and changes at real thresholds',()=>{
 assert.deepEqual(fearState(12),{zone:'extreme-fear',label:'Aşırı Korku'});assert.equal(fearState(null).zone,'unavailable');assert.equal(fearState(25).zone,'fear');assert.equal(fearState(45).zone,'neutral');assert.equal(fearState(55).zone,'greed');assert.equal(fearState(75).zone,'extreme-greed');assert.equal(fearState(101).zone,'unavailable');
});
test('failed sources observe backoff, retry without a page request, and clear failure metadata on recovery',async()=>{
 let now=1000,calls=0,offline=true;const c=createSourceCache({now:()=>now});const fn=async()=>{calls++;if(offline)throw Error('offline');return {price:10};};
 await assert.rejects(c.cached('prices',600000,fn),/offline/);assert.equal(c.diagnostics.get('prices').nextRetry,31000);await assert.rejects(c.cached('prices',600000,fn));assert.equal(calls,1);await c.retryFailed();assert.equal(calls,1);
 now=31000;offline=false;await c.retryFailed();assert.equal(calls,2);assert.equal(c.diagnostics.get('prices').ok,true);assert.equal(c.diagnostics.get('prices').nextRetry,null);assert.deepEqual((await c.cached('prices',600000,fn)).data,{price:10});
});
test('stale data keeps its original timestamp and manual retry bypasses backoff',async()=>{
 let now=1000,value=5,offline=false;const c=createSourceCache({now:()=>now});const fn=async()=>{if(offline)throw Error('offline');return value;};await c.cached('x',10,fn);now=2000;offline=true;const stale=await c.cached('x',10,fn);assert.equal(stale.stale,true);assert.equal(stale.fetchedAt,1000);assert.equal(stale.data,5);
 offline=false;value=8;await c.retryFailed({force:true});assert.equal((await c.cached('x',10000,fn)).data,8);assert.equal(c.diagnostics.get('x').failures,0);
});
test('simultaneous requests coalesce into one real provider call',async()=>{
 const c=createSourceCache();let calls=0;const fn=async()=>{calls++;await new Promise(r=>setImmediate(r));return 10;};await Promise.all([c.cached('x',1000,fn),c.cached('x',1000,fn)]);assert.equal(calls,1);
});
test('automatic headline translation preserves the original, escapes rendered output, and reuses translations',async()=>{
 let calls=0;const translator=createNewsTranslator({file:null,translateBatch:async titles=>{calls++;return titles.map(()=>'<b>Bitcoin Yükseldi</b>');}});const originals=[{title:'Bitcoin rises',url:'https://example.com/story'}];const translated=await translator.translateTitles(originals);assert.equal(translated[0].title,'Bitcoin rises');assert.equal(translated[0].titleTr,'<b>Bitcoin Yükseldi</b>');await translator.translateTitles(originals);assert.equal(calls,1);
 const tr=newsHeadlines(translated[0],{lang:'tr'});assert.match(tr,/&lt;b&gt;Bitcoin/);assert.match(tr,/Bitcoin rises/);assert.doesNotMatch(tr,/<b>Bitcoin/);assert.doesNotMatch(newsHeadlines(translated[0],{lang:'en'}),/news-translated/);
});
test('translation failure never invents a Turkish title and remains retryable',async()=>{
 let offline=true;const translator=createNewsTranslator({file:null,translateBatch:async()=>{if(offline)throw Error('offline');return ['Türkçe Başlık'];}});const items=[{title:'English headline'}];await assert.rejects(translator.translateTitles(items));assert.equal(translator.available(items)[0].titleTr,null);assert.match(newsHeadlines(translator.available(items)[0],{lang:'tr'}),/Türkçe Çeviri Alınamadı/);offline=false;assert.equal((await translator.translateTitles(items))[0].titleTr,'Türkçe Başlık');
});
test('news importance uses the actual calendar impact graphic, including its marker',()=>{
 const graphic=newsImportance('Exchange hack discovered');assert.match(graphic,/importance-scale/);assert.match(graphic,/importance-high/);assert.match(graphic,/left:92%/);
});

test('translation preserves protocol names and distinguishes a short position from a physical shortage',()=>{assert.match(prepareNewsTitle('Lighter incident'),/ZXQBRAND0ZXQ/);assert.match(prepareNewsTitle('He is short copper'),/holding a ZXQSHORTPOSITIONZXQ in copper/);assert.equal(restoreNewsBrands('ZXQBRAND0ZXQ olayı'),'Lighter olayı');});

test('overview fits real headline heights instead of leaving a fixed empty column',()=>{assert.equal(previewCount([100,100,100,100,100,100],450),4);assert.equal(previewCount([100,100,100,100],900),4);assert.equal(previewCount([100,100,100,100],50),1);assert.equal(previewCount([],1000),0);});

test('ETF runtime uses the public source without repeatedly calling the subscription endpoint',()=>{const source=fs.readFileSync(new URL('../providers.mjs',import.meta.url),'utf8');assert.doesNotMatch(source,/api\.asksurf\.ai|etf-source-/);assert.match(source,/return await fallbackETFFlows\(asset\)/);});
