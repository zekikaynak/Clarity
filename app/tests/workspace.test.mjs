import test from 'node:test';
import assert from 'node:assert/strict';
import {fundingMeaning,closingTime,countdown,cryptoImportance,calendarEvents,istanbulDate} from '../public/market-context.js';
import {normalizeWatchlists,watchSymbols,toggleWatchSymbol,removeWatchGroup} from '../public/watch-state.js';
test('funding explains payment direction without claiming a long/short population',()=>{
 assert.equal(fundingMeaning(.0001).payer,'Long');assert.equal(fundingMeaning(-.0001).payer,'Short');
 assert.equal(fundingMeaning(0).payer,null);assert.equal(fundingMeaning(null).label,'Fonlama Verisi Alınamadı');
});
test('candle countdown uses UTC boundaries, including 4h, daily, weekly and monthly',()=>{
 const now=Date.UTC(2026,10,7,14,30,0);
 assert.equal(closingTime(now,'240'),Date.UTC(2026,10,7,16));
 assert.equal(closingTime(now,'4h'),Date.UTC(2026,10,7,16));
 assert.equal(closingTime(now,'1D'),Date.UTC(2026,10,8));
 assert.equal(closingTime(now,'1W'),Date.UTC(2026,10,9));
 assert.equal(closingTime(now,'1M'),Date.UTC(2026,11,1));
 assert.equal(closingTime(now,'1m'),now+60000);
 assert.equal(countdown(90000),'00:01:30');
});
test('watchlist migration preserves existing assets and separates groups without duplicates',()=>{
 const state=normalizeWatchlists(null,['BTCUSDT','ETHUSDT','BTCUSDT']);assert.deepEqual(watchSymbols(state),['BTCUSDT','ETHUSDT']);
 state.lists.push({id:'indices',name:'Dominanslar',color:'#b49cf0',symbols:[]});
 toggleWatchSymbol(state,'indices','CRYPTOCAP:USDT.D');assert.ok(watchSymbols(state).includes('CRYPTOCAP:USDT.D'));
 toggleWatchSymbol(state,'indices','CRYPTOCAP:USDT.D');assert.equal(state.lists[1].symbols.length,0);
 toggleWatchSymbol(state,'indices','CRYPTOCAP:BTC.D');removeWatchGroup(state,'indices');assert.deepEqual(watchSymbols(state),['BTCUSDT','ETHUSDT','CRYPTOCAP:BTC.D']);
});
test('watchlist labels and colors normalize safely while collapsing is preserved',()=>{
 const state=normalizeWatchlists({lists:[{id:'safe',name:'Dominanslar',color:'bad',collapsed:true,symbols:['CRYPTOCAP:BTC.D','bad<script>','BTCUSDT']}]});
 assert.equal(state.lists[0].color,'#86b5ff');assert.equal(state.lists[0].collapsed,true);assert.deepEqual(state.lists[0].symbols,['CRYPTOCAP:BTC.D','BTCUSDT']);
});
test('calendar uses Istanbul date and crypto topic priority, without predicting direction',()=>{
 assert.equal(istanbulDate(Date.UTC(2026,10,6,22)),'2026-11-07');
 assert.equal(cryptoImportance('US CPI inflation').level,'high');assert.equal(cryptoImportance('ETF flows update').level,'medium');
 assert.equal(calendarEvents([{country:'USD',impact:'High',title:'CPI',date:'2026-11-07T10:00:00Z'},{country:'JPY',impact:'High',title:'BOJ Rate Decision',date:'2026-11-07T10:00:00Z'}]).length,2);
});

import {decodeLiquidationHeatmap,normalizeCalendarEvent} from '../free-data.mjs';
import {calendarResult,resultComparison} from '../public/economic-calendar.js';
test('free liquidation heatmap decodes column-major quantized USD without inventing empty cells',()=>{
 const input={db:true,error:false,cols:2,rows:2,cap:100,t0:1000,dt:5000,y0:10,ratio:1.1,cells:Buffer.from([255,0,128,255]).toString('base64')};
 const d=decodeLiquidationHeatmap(input);assert.deepEqual(d.times,[1000,6000]);assert.deepEqual(d.prices,[10,11]);assert.equal(d.points.length,3);assert.deepEqual(d.points[0],[0,0,100]);assert.ok(Math.abs(d.points[1][2]-25.196)<.001);
 assert.throws(()=>decodeLiquidationHeatmap({...input,cells:'AA=='}));assert.throws(()=>decodeLiquidationHeatmap({...input,error:true}));
});
test('global calendar retains numeric zero, avoids fabricated results and labels neutral numeric surprises',()=>{
 const e=normalizeCalendarEvent({currency:'JPY',time:'2026-11-07T09:00:00Z',title:'BOJ Rate Decision',impact:'high',actual:0,forecast:'0.25%'});
 assert.equal(e.actual,0);assert.equal(cryptoImportance(e.title,e.impact,e.country).level,'high');assert.match(calendarResult(e),/>0</);
 assert.match(calendarResult({...e,actual:'',date:'2020-01-01'}),/Sonuç Alınamadı/);assert.match(calendarResult({...e,actual:'',date:'2099-01-01'}),/Henüz Açıklanmadı/);
 assert.match(resultComparison('0.5%','0.25%'),/Beklentinin Üstünde/);assert.equal(resultComparison('5M','5%'),'');assert.equal(normalizeCalendarEvent({title:'x',time:'bad'}),null);
});

import {turkishEvent} from '../public/calendar-turkish.js';
test('calendar Turkish names preserve periodicity, institutions and original meaning',()=>{
 assert.equal(turkishEvent('Consumer Price Index ex Food & Energy YoY'),'Gıda Ve Enerji Hariç Tüketici Fiyat Endeksi (Yıllık)');
 assert.equal(turkishEvent('BoJ Summary of Opinions'),'Japonya Merkez Bankası Görüş Özeti');
 assert.equal(turkishEvent("ECB's President Lagarde speech"),'Avrupa Merkez Bankası · Başkan Lagarde Konuşması');
 assert.equal(turkishEvent('3-Month Bill Auction'),'3 Aylık Hazine Bonosu İhalesi');
 assert.match(turkishEvent('Trade Balance s.a. (DE)'),/Arındırılmış.*Almanya/);
});

import {heatmapSymbols} from '../free-data.mjs';
import {importanceMeter} from '../public/economic-calendar.js';
test('heatmap catalog comes from provider coverage, accepts new supported assets and rejects unrelated links',()=>{
 const rows=heatmapSymbols(`<a href="/liquidation-heatmap/ADA">ADA</a><a href='/liquidation-heatmap/Q'>Q</a><a href="/liquidation-heatmap/ADA">Again</a><a href="/other/FAKE">Other</a>`);
 assert.deepEqual(rows.map(x=>x.symbol),['ADAUSDT','QUSDT']);assert.throws(()=>heatmapSymbols('no catalog'));
});
test('calendar importance stays horizontal with high at red and low at green',()=>{
 const high=importanceMeter('FOMC Rate Decision','High'),low=importanceMeter('Foreign Reserves','Low');
 assert.match(high,/left:92%/);assert.match(low,/left:8%/);assert.doesNotMatch(high,/style="top:/);
});
