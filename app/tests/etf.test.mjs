import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeETFFlows,normalizeETFFundHistory,buildETFReport,ETF_ASSETS} from '../etf-data.mjs';
import {etfDate,etfAmount as amount} from '../public/etf-format.js';
const etfAmount=n=>amount(n,'tr');
test('ETF amounts use unambiguous English financial units',()=>{assert.equal(amount(-430.2,'en'),'−430.2 million USD');assert.equal(amount(0,'en'),'0 USD');assert.equal(amount(null,'en'),'Awaiting Publication');});
test('ETF dates display day.month.year and amounts retain zero and missing values',()=>{
 assert.equal(etfDate('2026-11-04','tr'),'04.11.2026');
 assert.equal(etfDate('2026-01-09T12:30:00Z','tr'),'09.01.2026');
 assert.equal(etfAmount(0),'0 dolar');assert.equal(etfAmount(null),'Yayın Bekleniyor');
 assert.equal(etfAmount(-.8),'−800 bin dolar');assert.equal(etfAmount(-430.2),'−430,2 milyon dolar');
});
test('daily flows normalize USD to millions and distinguish unsettled zero from published zero',()=>{
 const data=normalizeETFFlows({data:[{timestamp:1793923200,flow_usd:null,settled:false},{timestamp:1793836800,flow_usd:0,settled:true},{timestamp:1793750400,flow_usd:-800000,settled:true,etfs:[{ticker:'BSOL',flow_usd:-800000}]}]},'sol');
 assert.deepEqual(data.rows.map(x=>[x.total,x.complete]),[[-.8,true],[0,true],[null,false]]);
 assert.equal(data.rows[0].fundFlows[0].total,-.8);
});
test('five-asset report sums the same date and never includes another day or treats missing as zero',()=>{
 const results=ETF_ASSETS.map((asset,i)=>({asset,data:{rows:[{date:i===4?'2026-11-04':'2026-11-05',total:[-430.2,-99.9,-.8,0,-3][i],complete:true}]}}));
 const partial=buildETFReport(results);assert.equal(partial.date,'2026-11-05');assert.equal(partial.count,4);assert.equal(partial.complete,false);assert.equal(partial.assets[4].amount,null);assert.ok(Math.abs(partial.total+530.9)<.00001);
 results[4].data.rows[0].date='2026-11-05';const full=buildETFReport(results);assert.equal(full.complete,true);assert.ok(Math.abs(full.total+533.9)<.00001);assert.equal(full.assets[3].amount,0);
});
test('backup fund flow units stay in millions and missing fund reports stay incomplete',()=>{
 const data=normalizeETFFundHistory({days:[{date:'2026-11-05',totalUsdM:0,funds:[{ticker:'XRP',netFlowUsdM:0}]},{date:'2026-11-06',totalUsdM:0,funds:[{ticker:'XRP',netFlowUsdM:null}]}]},'xrp');
 assert.equal(data.rows[0].complete,true);assert.equal(data.rows[1].complete,false);assert.equal(data.rows[1].fundFlows[0].total,null);
 const sol=normalizeETFFundHistory({days:[{date:'2026-11-06',totalUsdM:-24.2,funds:[{ticker:'BSOL',netFlowUsdM:-24.2}]}]},'sol');assert.equal(sol.rows[0].total,-24.2);
});
test('explicitly published asset aggregate is distinct from a pending individual fund breakdown',()=>{
 const raw={days:[{date:'2026-11-06',totalUsdM:-24.2,funds:[{ticker:'BSOL',netFlowUsdM:null}]}]};
 const data=normalizeETFFundHistory(raw,'sol',{referenceDate:'2026-11-06',assets:[{symbol:'SOL',date:'2026-11-06',netFlowUsdM:-24.2}]});
 assert.equal(data.rows[0].complete,true);assert.equal(data.rows[0].fundsComplete,false);assert.equal(data.rows[0].fundFlows[0].total,null);assert.equal(data.rows[0].total,-24.2);
});
