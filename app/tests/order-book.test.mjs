import {test} from 'node:test';
import assert from 'node:assert/strict';
import {largestBookLevels} from '../public/order-book.js';
test('large waiting levels rank by quote value, retaining the largest from both sides',()=>{
 const book={bids:[['100','100'],['1000','20']],asks:[['999','1'],['101','200']]};
 const before=JSON.stringify(book),levels=largestBookLevels(book,1);
 assert.deepEqual(levels.map(x=>[x.side,x.value]),[['sell',20200],['buy',20000]]);
 assert.equal(JSON.stringify(book),before);
});
test('large levels exclude invalid and removed quantities without starving one side',()=>{
 const bids=Array.from({length:10},(_,i)=>[100+i,10000]);
 const levels=largestBookLevels({bids:[...bids,['100','0'],['bad','1']],asks:[['100','2'],['100','-1'],['Infinity','2']]});
 assert.equal(levels.filter(x=>x.side==='buy').length,5);
 assert.equal(levels.filter(x=>x.side==='sell').length,1);
 assert.equal(levels.at(-1).value,200);
 assert.deepEqual(largestBookLevels(null),[]);
});
