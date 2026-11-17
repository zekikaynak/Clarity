import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('volume starts compact and retains one height through instruments and a fresh mount',async()=>{
 const source=(await readFile(new URL('../public/volume-strip.js',import.meta.url),'utf8')).replace(/^import .*;\r?\n/gm,'').replaceAll('export ','');
 const storage=new Map(),created=[],streams=[];
 class Element{
  children=[];attributes=new Map();style={setProperty(){}};classList={add(){},remove(){}};
  constructor(){this.parts=new Map();this.clientHeight=800;}
  append(...nodes){this.children.push(...nodes);}
  setAttribute(k,v){this.attributes.set(k,v);}
  getAttribute(k){return this.attributes.get(k);}
  querySelector(k){if(!this.parts.has(k))this.parts.set(k,new Element());return this.parts.get(k);}
  getContext(){return {};}
  getBoundingClientRect(){return {width:0,height:0};}
  replaceChildren(){} remove(){} matches(){return false;}
 }
 const factory=new Function('document','localStorage','ResizeObserver','WebSocket','fetch','setInterval','clearInterval','setTimeout','clearTimeout','isIndex','loading',source+';return mountVolumeStrip;');
 const mount=factory({body:new Element(),addEventListener(){},removeEventListener(){},createElement(){const e=new Element();created.push(e);return e;}},{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},class{observe(){}disconnect(){}},class{constructor(){streams.push(this);}close(){}},async()=>({ok:true,json:async()=>({data:{candles:[{time:1,open:100,close:101,volume:1},{time:2,open:101,close:102,volume:2}]}})}),()=>1,()=>{},()=>1,()=>{},s=>s==='BTC.D',()=>'<span>Yükleniyor</span>');
 const first=mount(new Element()),divider=created[0];
 assert.equal(divider.getAttribute('aria-valuenow'),'144');
 divider.onkeydown({key:'ArrowUp',preventDefault(){}});
 assert.equal(divider.getAttribute('aria-valuenow'),'152');
 first.setInstrument('BTCUSDT','240');
 const canvas=created[1].querySelector('canvas');
 assert.equal(canvas.hidden,true);
 streams[0].onmessage({data:JSON.stringify({k:{t:2000,o:'101',h:'103',l:'100',c:'102',v:'2'}})});
 assert.equal(canvas.hidden,true,'a live candle must not paint a full-width block before history arrives');
 first.setInstrument('ETHUSDT','240');
 first.setInstrument('BTC.D','1D');
 first.setInstrument('SOLUSDT','15');
 await new Promise(setImmediate);
 assert.equal(canvas.hidden,false,'history makes the populated chart visible');
 assert.equal(divider.getAttribute('aria-valuenow'),'152');
 first.remove();
 const offset=created.length,second=mount(new Element());
 assert.equal(created[offset].getAttribute('aria-valuenow'),'152');
 second.remove();
});


test('candle detail keeps OHLC, separates open candles and does not invent missing prices',async()=>{
 const source=(await readFile(new URL('../public/volume-strip.js',import.meta.url),'utf8')).replace(/^import .*;\r?\n/gm,'').replaceAll('export ','');
 const details=new Function(source+';return volumeDetails;')();
 const start=Date.parse('2026-11-17T12:00:00Z');
 const row={time:start/1000,open:100,high:112,low:98,close:110,volume:12.5};
 const open=details(row,'BTCUSDT','4h',start+60000);
 assert.equal(open.closed,false);assert.equal(open.end,start+4*3600000);
 assert.equal(open.high,112);assert.equal(open.low,98);assert.equal(open.volume,12.5);
 assert.ok(Math.abs(open.change-10)<1e-10);
 assert.equal(details(row,'BTCUSDT','4h',open.end).closed,true);
 const missing=details({time:start/1000,open:null,close:110,volume:0},'BTCUSDT','5m',start);
 assert.equal(missing.change,null);assert.equal(missing.high,null);assert.equal(missing.low,null);assert.equal(missing.volume,0);
 const month=Date.parse('2026-11-01T00:00:00Z');
 assert.equal(details({...row,time:month/1000},'BTCUSDT','1M',month).end,Date.parse('2026-12-01T00:00:00Z'));
});


test('volume hit testing selects only painted bars, excluding gaps, empty height, dates and zero volume',async()=>{
 const source=(await readFile(new URL('../public/volume-strip.js',import.meta.url),'utf8')).replace(/^import .*;\r?\n/gm,'').replaceAll('export ','');
 const {rects,at}=new Function(source+';return {rects:volumeBarRects,at:volumeBarAt};')();
 const bars=rects([{volume:10},{volume:5},{volume:0}],30,100);
 assert.equal(bars.length,2);
 assert.equal(at(bars,4,20),0);
 assert.equal(at(bars,14,20),-1,'empty space above a shorter bar');
 assert.equal(at(bars,14,60),1);
 assert.equal(at(bars,9.5,80),-1,'gap between bars');
 assert.equal(at(bars,4,90),-1,'date label zone');
 assert.equal(at(bars,24,80),-1,'zero volume has no painted bar');
 assert.deepEqual(rects([{volume:0}],30,100),[]);
});

test('an outlier no longer flattens ordinary volume bars and hit targets remain painted bars',async()=>{
 const source=(await readFile(new URL('../public/volume-strip.js',import.meta.url),'utf8')).replace(/^import .*;\r?\n/gm,'').replaceAll('export ','');
 const {rects,at}=new Function(source+';return {rects:volumeBarRects,at:volumeBarAt};')();
 const rows=[{volume:1000000},{volume:10},{volume:20},{volume:0}],before=JSON.stringify(rows),log=rects(rows,48,144),linear=rects(rows,48,144,'linear');
 assert.ok(log[1].height>linear[1].height*2);assert.ok(log.every(x=>x.height>=8&&x.width>=8));assert.equal(log.length,3);assert.equal(JSON.stringify(rows),before,'real data is unchanged');
 const bar=log[1];assert.equal(at(log,bar.x+bar.width/2,bar.y+bar.height/2),1);assert.equal(at(log,bar.x+bar.width/2,bar.y-1),-1);
});
