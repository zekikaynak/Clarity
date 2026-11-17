import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isCryptoAsset,isStableAsset,stableLast} from '../public/asset-policy.js';
test('equity tokens are excluded without discarding genuine crypto symbols ending in B',()=>{
 for(const symbol of ['NVDABUSDT','SOXLBUSDT','TSLABUSDT','AAPLBUSDT','QQQB'])assert.equal(isCryptoAsset(symbol),false,symbol);
 for(const symbol of ['BNBUSDT','TRBUSDT','DGBUSDT','BTCUSDT','CRYPTOCAP:BTC.D'])assert.equal(isCryptoAsset(symbol),true,symbol);
 assert.equal(isCryptoAsset({symbol:'NEWSTOCKBUSTD',tags:['bStocks']}),false);
 assert.equal(isCryptoAsset({baseAsset:'NEWB',assetName:'New Equity (bStocks)'}),false);
});
test('stablecoins sort after crypto regardless of their trading volume',()=>{
 const rows=[{symbol:'USDCUSDT',quoteVolume:100000},{symbol:'BTCUSDT',quoteVolume:2},{symbol:'USD1USDT',quoteVolume:20000},{symbol:'ETHUSDT',quoteVolume:1}];
 const sorted=rows.sort((a,b)=>stableLast(a,b)||b.quoteVolume-a.quoteVolume);
 assert.deepEqual(sorted.map(x=>x.symbol),['BTCUSDT','ETHUSDT','USDCUSDT','USD1USDT']);
 assert.equal(isStableAsset('USDT'),true);
 assert.equal(isStableAsset({symbol:'NEWUSDUSDT',tags:['stablecoin']}),true);
});
