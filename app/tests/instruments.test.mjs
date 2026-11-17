import test from 'node:test';
import assert from 'node:assert/strict';
import {indices,isIndex,indexInstrument,chartSymbol,streamSymbol} from '../public/instruments.js';
test('index charts use CRYPTOCAP while coins retain Binance routing',()=>{
 for(const x of indices){assert.equal(isIndex(x.symbol),true);assert.equal(chartSymbol(x.symbol),x.symbol);assert.equal(streamSymbol(x.symbol),'BTCUSDT');}
 assert.equal(chartSymbol('ETHUSDT'),'BINANCE:ETHUSDT');
 assert.equal(streamSymbol('ETHUSDT'),'ETHUSDT');
 assert.equal(isIndex('BTCUSDT'),false);
});
test('dominance and cap instruments keep their distinct units and identities',()=>{
 assert.equal(indexInstrument('CRYPTOCAP:BTC.D').kind,'dominance');
 assert.equal(indexInstrument('CRYPTOCAP:OTHERS.D').kind,'dominance');
 assert.equal(indexInstrument('CRYPTOCAP:OTHERS').kind,'cap');
 assert.equal(indexInstrument('CRYPTOCAP:TOTAL3').kind,'cap');
 assert.equal(new Set(indices.map(x=>x.symbol)).size,indices.length);
});
