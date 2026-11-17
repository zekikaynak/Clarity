import test from 'node:test';
import assert from 'node:assert/strict';
import {formatPair,titleCase} from '../public/format.js';
test('pairs keep a visible separator for every supported quote',()=>{
 for(const [raw,expected] of [['BTCUSDT','BTC - USDT'],['ETHUSDT','ETH - USDT'],['PEPEUSDT','PEPE - USDT'],['ETHBTC','ETH - BTC'],['BTC - USDT','BTC - USDT']])assert.equal(formatPair(raw),expected);
});
test('Turkish headings capitalize each word and preserve finance acronyms',()=>{
 assert.equal(titleCase('canlı terminal'),'Canlı Terminal');
 assert.equal(titleCase('genel bakış'),'Genel Bakış');
 assert.equal(titleCase('ETF ve RSI göstergeleri'),'ETF Ve RSI Göstergeleri');
 assert.equal(titleCase('FUNDING'),'Funding');
});
