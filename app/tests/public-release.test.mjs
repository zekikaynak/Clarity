import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {resolveLanguage,localizedChart,language,englishHeading} from '../public/i18n.js';
import {english} from '../public/translations.js';
test('language follows the operating language unless the user overrides it',()=>{
 assert.equal(resolveLanguage('tr-TR'),'tr');assert.equal(resolveLanguage('en-US'),'en');assert.equal(resolveLanguage('de-DE'),'en');assert.equal(resolveLanguage('tr-TR','en'),'en');assert.equal(resolveLanguage('en-US','tr'),'tr');assert.equal(resolveLanguage('en-GB','auto'),'en');
});
test('public release has explicit search scope and no inert header actions',()=>{
 const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');const js=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
 assert.match(html,/data-search-tab="pages"/);assert.match(html,/data-search-tab="assets"/);assert.doesNotMatch(html,/id="compact"|avatar small|Kişisel|Yalnızca Bu Bilgisayarda|PİYASA AKIŞI/);assert.match(js,/searchTab==='pages'/);assert.match(js,/newsRibbon.start/);
});
test('English strings cover public branding and core market actions',()=>{
 for(const key of ['Genel Bakış','Canlı Terminal','Coinler','Bekleyen Büyük Emirler','Clarity İçinde Ara','Long Öder → Short Alır'])assert.ok(Object.keys(english).some(k=>k.toLocaleLowerCase('tr-TR')===key.toLocaleLowerCase('tr-TR')),key);
});
test('chart localization preserves numerical values and callback context',()=>{
 let received;const chart={setOption(o){received=o;return 'ok';}};localizedChart(chart);chart.setOption({name:'Yakın Dönem Hacmi',data:[1,2,3],formatter(v){return this.prefix+v;}});assert.deepEqual(received.data,[1,2,3]);assert.equal(received.formatter.call({prefix:'BTC '},5),'BTC 5');assert.equal(received.name,language==='en'?'Recent Volume':'Yakın Dönem Hacmi');
});

test('English headings preserve acronyms and capitalize each word',()=>{assert.equal(englishHeading('The entire market'),'The Entire Market');assert.equal(englishHeading('ETF flow report and DeFi'),'ETF Flow Report And DeFi');});
