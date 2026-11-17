import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rsi,aggregateTrade,flowNumber} from '../lib.mjs';
test('every trade changes the open candle and a new interval creates a candle',()=>{
 const rows=[];aggregateTrade(rows,{time:120001,price:100,qty:2},60);aggregateTrade(rows,{time:120002,price:103,qty:1},60);aggregateTrade(rows,{time:179000,price:98,qty:3},60);
 assert.deepEqual(rows,[{time:120,open:100,high:103,low:98,close:98,volume:6}]);aggregateTrade(rows,{time:180000,price:101,qty:4},60);assert.equal(rows.length,2);assert.equal(rows[1].open,101);
});
test('late packets never overwrite newer candles',()=>{const rows=[{time:180,open:1,high:1,low:1,close:1,volume:1}];assert.equal(aggregateTrade(rows,{time:179000,price:2,qty:1},60),null);assert.equal(rows[0].close,1);});
test('weekly candles align to exchange Monday UTC',()=>{const rows=[];aggregateTrade(rows,{time:Date.parse('2026-11-06T12:00:00Z'),price:1,qty:1},604800);assert.equal(new Date(rows[0].time*1000).toISOString(),'2026-11-02T00:00:00.000Z');});
test('RSI handles flat, rising and falling markets without NaN',()=>{assert.equal(rsi(Array(30).fill(50)),50);assert.equal(rsi(Array.from({length:30},(_,i)=>i)),100);assert.equal(rsi(Array.from({length:30},(_,i)=>30-i)),0);assert.equal(rsi([1,2,3]),null);});
test('ETF blank cells stay missing; negative parentheses stay negative',()=>{assert.equal(flowNumber('-'),null);assert.equal(flowNumber(''),null);assert.equal(flowNumber('(430.2)'),-430.2);assert.equal(flowNumber('1,119.9'),1119.9);assert.equal(flowNumber('0.0'),0);});
