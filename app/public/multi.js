import {mountTradingView} from '/tradingview-engine.js';
let resources=[];
export function disposeMulti(){for(const r of resources)r.remove();resources=[];}
export async function renderMulti({view,panel}){const symbols=['BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT'];view.innerHTML='<div class="multi-grid">'+symbols.map((s,i)=>panel('Grafik '+String(i+1).padStart(2,'0'),`<div id="multi-chart-${i}" class="tv-chart-shell multi-chart"></div>`)).join('')+'</div>';symbols.forEach((symbol,i)=>resources.push(mountTradingView(view.querySelector('#multi-chart-'+i),{symbol,interval:'15m',allowSymbolChange:true})));}
