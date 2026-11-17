import {chartComponentURL} from './chart-language.js';
import {language} from './i18n.js';
import {mountVolumeStrip} from '/volume-strip.js';
import {chartSymbol,isIndex,indexInstrument} from '/instruments.js';
// Official component reflects native interval changes as public attributes.
// This observer only reads state; candles and drawings are not modified.
const intervals={'1m':'1','5m':'5','15m':'15','1h':'60','4h':'240','1d':'1D','1w':'1W'};
let retained=null;
function attachRetained(entry,container){
 entry.slot=container;entry.shell.hidden=false;
 entry.resize.observe(container);entry.resize.observe(container.closest('.chart-panel')||container);entry.resize.observe(document.body);entry.position();
}
function hideRetained(entry){
 entry.resize.disconnect();entry.slot=null;entry.shell.hidden=true;
}
export function mountTradingView(container,{symbol='BTCUSDT',interval='15m',allowSymbolChange=false,onInterval=()=>{},preserve=false}={}){
 if(preserve&&retained){
  // Change only the instrument through the component's public bridge. Recreating
  // the iframe here would discard the user's shared price/volume pane split.
  if(retained.symbol!==symbol){
   retained.symbol=symbol;
   retained.chart.setAttribute('symbol',chartSymbol(symbol));
   retained.chart.setAttribute('aria-label',`${indexInstrument(symbol)?.code||symbol.replace(/USDT$/,' - USDT')} Canlı Grafik`);
   retained.volume.setInstrument(symbol,retained.chart.getAttribute('interval'));
  }
  container.replaceChildren();retained.callback=onInterval;attachRetained(retained,container);
  onInterval(retained.chart.getAttribute('interval'));container.dataset.chartEngine='tradingview-component';
  const cached=retained;return {remove(){hideRetained(cached);}};
 }
 container.replaceChildren();let disposed=false;
 const shell=document.createElement('div');shell.className='tradingview-widget-container clarity-chart-stack';
 const widget=document.createElement('div');widget.className='tradingview-widget-container__widget';
 const chart=document.createElement('tv-advanced-chart');chart.className='clarity-native-chart';
 // Keep the user's native chart preferences across reloads as well as route changes.
 // Volume has its own pane so its bars cannot cover price candles.
 const attrs={locale:language,theme:'dark',symbol:chartSymbol(symbol),interval:intervals[interval]||interval,timezone:'Europe/Istanbul','chart-type':'candles','show-drawing-toolbar':'','show-date-ranges':'','hide-volume':'','store-settings':''};
 if(allowSymbolChange)attrs['allow-symbol-change']='';
 if(preserve)attrs.studies='[]';

 for(const [key,value] of Object.entries(attrs))chart.setAttribute(key,value);
 chart.setAttribute('aria-label',`${indexInstrument(symbol)?.code||symbol.replace(/USDT$/,' - USDT')} Canlı Grafik`);
 const surface=document.createElement('div');surface.className='tradingview-chart-surface';surface.append(chart);widget.append(surface);const tone=document.createElement('div');tone.className='chart-toolbar-tone';tone.setAttribute('aria-hidden','true');shell.append(widget,tone);container.append(shell);
 const volume=mountVolumeStrip(shell);
 const entry={symbol,shell,chart,volume,callback:onInterval,destroy(){disposed=true;volume.remove();observer.disconnect();this.resize?.disconnect();window.removeEventListener('scroll',this.position,true);window.removeEventListener('resize',this.position);document.removeEventListener('fullscreenchange',this.position);shell.remove();}};
 if(preserve){
  // Keep the iframe in one connected DOM location. Moving an iframe reloads it in
  // browsers without state-preserving DOM moves and loses the native pane layout.
  shell.classList.add('retained-chart');document.body.append(shell);
  entry.position=()=>{
   if(!entry.slot?.isConnected)return;
   const r=entry.slot.getBoundingClientRect();
   Object.assign(shell.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});
  };
  entry.resize=new ResizeObserver(entry.position);
  window.addEventListener('scroll',entry.position,true);window.addEventListener('resize',entry.position);
  document.addEventListener('fullscreenchange',entry.position);
  attachRetained(entry,container);
 }
 let previous='';const read=()=>{if(disposed)return;const value=chart.getAttribute('interval');if(allowSymbolChange){const nativeSymbol=chart.getAttribute('symbol')?.split(':').at(-1);if(/^[A-Z0-9]+USDT$/.test(nativeSymbol)&&nativeSymbol!==entry.symbol){entry.symbol=nativeSymbol;volume.setInstrument(nativeSymbol,value);}}if(value&&value!==previous){previous=value;volume.setInstrument(entry.symbol,value);entry.callback(value);}};
 const observer=new MutationObserver(read);observer.observe(chart,{attributes:true,attributeFilter:['interval','symbol']});read();
 if(!document.querySelector('#clarity-tv-component')){const script=document.createElement('script');script.id='clarity-tv-component';script.type='module';script.src=chartComponentURL(language);script.onerror=()=>{if(!disposed)widget.textContent='Grafik Bağlantısı Kurulamadı. İnternet Bağlantısını Kontrol Et.';};document.head.append(script);}
 container.dataset.chartEngine='tradingview-component';
 if(preserve)retained=entry;
 return {remove(){if(preserve)hideRetained(entry);else entry.destroy();}};
}
