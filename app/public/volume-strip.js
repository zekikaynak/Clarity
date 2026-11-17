import {dateFormat,timeFormat,dateTimeFormat,monthFormat} from './date-format.js';
import {locale,language} from './i18n.js';
import {loading} from '/loading.js';
import {isIndex} from '/instruments.js';
const KEY='clarity.volume-height.v2';
const SCALE_KEY='clarity.volume-scale.v1';
const periods={'1':'1m','5':'5m','15':'15m','60':'1h','240':'4h','1D':'1d','D':'1d','1W':'1w','W':'1w'};
export function volumeHeight(value){const n=Number(value);return Number.isFinite(n)&&n>=64&&n<=360?n:144;}
export function volumeBarRects(rows,width,height,scale='log'){
 const volumes=rows.map(row=>Number.isFinite(+row.volume)&&+row.volume>0?+row.volume:0),max=Math.max(0,...volumes),plotHeight=height-18;
 if(!rows.length||max<=0||width<=0||plotHeight<=4)return [];
 const step=width/rows.length,linear=scale==='linear',peak=linear?max:Math.log1p(max);
 return rows.flatMap((row,index)=>{const volume=volumes[index];if(!volume)return [];const ratio=(linear?volume:Math.log1p(volume))/peak,barHeight=Math.min(plotHeight-4,Math.max(8,ratio*(plotHeight-4)));return [{index,x:index*step+1,y:plotHeight-barHeight,width:Math.max(1,step-2),height:barHeight}];});
}
export function volumeBarAt(rects,x,y){return rects.find(bar=>x>=bar.x&&x<bar.x+bar.width&&y>=bar.y&&y<bar.y+bar.height)?.index??-1;}
export function volumeDetails(row,symbol,period,now=Date.now()){
 const numeric=value=>value!=null&&value!==''&&Number.isFinite(Number(value))?Number(value):null;
 const open=numeric(row.open),close=numeric(row.close),start=row.time*1000;
 const match=/^(\d+)([mhdwM])$/.exec(period);let end=null;
 if(match){const n=Number(match[1]),unit=match[2];if(unit==='M'){const date=new Date(start);date.setUTCMonth(date.getUTCMonth()+n);end=+date;}else end=start+n*({m:60000,h:3600000,d:86400000,w:604800000}[unit]);}
 return {symbol,period,start,end,open,high:numeric(row.high),low:numeric(row.low),close,volume:numeric(row.volume),change:open>0&&close!=null?(close/open-1)*100:null,closed:end==null?null:now>=end};
}
export function mountVolumeStrip(shell){
 const handle=document.createElement('div');handle.className='volume-divider';handle.tabIndex=0;handle.setAttribute('role','separator');handle.setAttribute('aria-label','Hacim Alanının Yüksekliği');handle.setAttribute('aria-orientation','horizontal');handle.setAttribute('aria-valuemin','64');handle.setAttribute('aria-valuemax','360');
 const panel=document.createElement('section');panel.className='volume-strip';panel.title='Seçili periyodun son mumları. Üst grafiğin geçmişe kaydırılmasından bağımsızdır.';panel.setAttribute('aria-label','Son Mumların İşlem Hacmi');
 panel.innerHTML='<div class="volume-strip-head"><span>Yakın Dönem Hacmi <b></b></span><div class="volume-strip-tools"><select aria-label="Hacim Ölçeği"><option value="log">Logaritmik</option><option value="linear">Doğrusal</option></select><span class="volume-scale-info" title="Logaritmik ölçek büyük hacim farklarını sıkıştırarak küçük çubukları okunabilir kılar. Doğrusal ölçek ham hacim oranlarını gösterir. Pozitif çubuklar görünürlük için en az 8 px çizilir; detaylardaki tüm hacimler gerçek değerlerdir.">ⓘ</span><small></small></div></div><canvas tabindex="0" role="button" aria-label="Hacim Çubuğunu Seçip Mum Detaylarını Aç"></canvas><div class="volume-strip-status"></div>';
 shell.append(handle,panel);
 const popup=document.createElement('div');popup.className='volume-candle-popup';popup.setAttribute('popover','auto');popup.setAttribute('role','dialog');popup.setAttribute('aria-label','Mum Detayları');document.body.append(popup);
 const shield=document.createElement('div');shield.className='volume-popup-shield';shield.setAttribute('popover','manual');shield.setAttribute('aria-hidden','true');document.body.append(shield);
 const canvas=panel.querySelector('canvas'),ctx=canvas.getContext('2d'),label=panel.querySelector('b'),note=panel.querySelector('small'),status=panel.querySelector('.volume-strip-status');
 const saved=localStorage.getItem(KEY),legacy=localStorage.getItem('clarity.volume-height');
 let volumeScale=localStorage.getItem(SCALE_KEY)==='linear'?'linear':'log';
 const scaleSelect=panel.querySelector('select');scaleSelect.value=volumeScale;scaleSelect.onchange=()=>{volumeScale=scaleSelect.value==='linear'?'linear':'log';localStorage.setItem(SCALE_KEY,volumeScale);hover=-1;draw();};
 let size=volumeHeight(saved??(Number(legacy)===96?null:legacy)),symbol,period,rows=[],socket,retry,refresh,version=0,disposed=false,hover=-1,pointerInside=false,drag=null,live=false,selectedTime=null,historyReady=false;
 const visibleRows=()=>historyReady?rows.slice(-Math.min(240,Math.max(24,Math.floor(canvas.clientWidth/12)))):[];
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const number=n=>n==null?'—':n.toLocaleString(locale,{maximumFractionDigits:8});
 const stamp=t=>dateTimeFormat(t);
 function updatePopup(){
  if(selectedTime==null)return;
  const row=rows.find(x=>x.time===selectedTime);if(!row)return;
  const d=volumeDetails(row,symbol,period),tone=d.change==null?'':d.change>=0?'up':'down';
  popup.setAttribute('data-direction',tone||'neutral');
  const html=`<div class="volume-popup-head"><strong>Mum Detayları</strong><button type="button" aria-label="Mum Detaylarını Kapat">×</button></div><div class="volume-popup-pair">${escape(symbol.replace(/USDT$/,' - USDT'))} <span>${escape(period)}</span></div><div class="volume-popup-time">${stamp(d.start)}${d.end?' → '+stamp(d.end):''}<small class="${d.closed===false?'candle-open':'candle-closed'}">İstanbul Saati · ${d.closed==null?'Durum Bilinmiyor':d.closed?'Kapanmış Mum':'Açık Mum · Güncelleniyor'}</small></div><dl><div class="candle-open-price"><dt>Açılış</dt><dd>${number(d.open)} USDT</dd></div><div class="candle-high"><dt>En Yüksek</dt><dd>${number(d.high)} USDT</dd></div><div class="candle-low"><dt>En Düşük</dt><dd>${number(d.low)} USDT</dd></div><div class="candle-close ${tone}"><dt>Kapanış${d.closed===false?' / Anlık':''}</dt><dd>${number(d.close)} USDT</dd></div><div class="candle-change ${tone}"><dt>Değişim</dt><dd class="${tone}">${d.change==null?'—':(d.change>0?'+':'')+d.change.toLocaleString(locale,{maximumFractionDigits:2})+'%'}</dd></div><div class="candle-volume"><dt>Hacim</dt><dd>${number(d.volume)} ${escape(symbol.replace(/USDT$/,''))}</dd></div></dl>`;
  if(popup.innerHTML!==html)popup.innerHTML=html;
 }
 function closePopup(){if(popup.matches(':popover-open'))popup.hidePopover();if(shield.matches(':popover-open'))shield.hidePopover();selectedTime=null;hover=-1;canvas.style.cursor='default';if(document.activeElement===canvas)canvas.blur();draw();}
 function openPopup(row,x,y){if(!row)return;selectedTime=row.time;updatePopup();shield.showPopover();popup.showPopover();const r=popup.getBoundingClientRect();popup.style.left=Math.max(10,Math.min(innerWidth-r.width-10,x+12))+'px';popup.style.top=Math.max(10,Math.min(innerHeight-r.height-10,y-r.height-12))+'px';}
 shield.onclick=closePopup;
 const escapePopup=e=>{if(e.key==='Escape'&&popup.matches(':popover-open')){e.preventDefault();closePopup();}};
 document.addEventListener('keydown',escapePopup,true);
 popup.onclick=e=>{if(e.target.closest('button'))closePopup();};
 popup.ontoggle=e=>{if(e.newState==='closed')closePopup();};
 const applyHeight=()=>{shell.style.setProperty('--volume-height',size+'px');handle.setAttribute('aria-valuenow',String(size));};applyHeight();
 const resize=new ResizeObserver(draw);resize.observe(panel);
 function draw(){
  const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;
  const dpr=devicePixelRatio||1;canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,r.width,r.height);
  if(!historyReady||!rows.length)return;
  const visible=visibleRows();
  for(const bar of volumeBarRects(visible,r.width,r.height,volumeScale)){const i=bar.index,x=visible[i];ctx.fillStyle=x.close>=x.open?'#42b9a7':'#dc7888';ctx.globalAlpha=pointerInside?(hover===i?1:0.68):0.92;ctx.fillRect(bar.x,bar.y,bar.width,bar.height);}ctx.globalAlpha=1;
  const stamp=t=>dateTimeFormat(t*1000,{year:false});
  ctx.fillStyle='#7f98b9';ctx.font='10px Segoe UI';ctx.textAlign='left';ctx.fillText(stamp(visible[0].time),2,r.height-3);ctx.textAlign='right';ctx.fillText(stamp(visible.at(-1).time),r.width-2,r.height-3);
  const selected=visible[Math.min(visible.length-1,hover<0?visible.length-1:hover)];
  label.textContent=selected.volume.toLocaleString(locale,{maximumFractionDigits:2})+' '+symbol.replace(/USDT$/,'');
  note.textContent=language==='en'?(live?'● Live':'Latest Data')+' · '+period+' · Last '+visible.length+' Candles':(live?'● Canlı':'Son Veri')+' · '+period+' · Son '+visible.length+' Mum';
  if(hover>=0)note.textContent=stamp(selected.time)+' · '+period;
  updatePopup();
 }
 function stop(){socket?.close();socket=null;clearTimeout(retry);clearInterval(refresh);live=false;}
 async function history(v){const started=Date.now();try{const response=await fetch('/api/candles?symbol='+encodeURIComponent(symbol)+'&interval='+period);if(!response.ok)throw Error();const r=await response.json();if(v!==version||disposed)return;const incoming=r.data?.candles;if(!incoming?.length)throw Error();const latest=rows.at(-1);rows=incoming;if(latest&&latest.receivedAt>=started&&latest.time>=rows.at(-1).time){if(latest.time===rows.at(-1).time)rows[rows.length-1]=latest;else rows.push(latest);}historyReady=true;canvas.hidden=false;status.replaceChildren();draw();}catch{if(v===version&&!disposed){status.textContent=historyReady?'Hacim Bağlantısı Yenileniyor':'Hacim Verisi Alınamadı';}}}
 function connect(v){
  if(v!==version||disposed)return;
  const ws=new WebSocket('wss://data-stream.binance.vision/ws/'+symbol.toLowerCase()+'@kline_'+period);socket=ws;
  ws.onmessage=e=>{if(v!==version||disposed)return;try{const k=JSON.parse(e.data).k;if(!k)return;const row={time:k.t/1000,open:+k.o,high:+k.h,low:+k.l,close:+k.c,volume:+k.v,receivedAt:Date.now()};const i=rows.findIndex(x=>x.time===row.time);if(i>=0)rows[i]=row;else if(!rows.length||row.time>rows.at(-1).time)rows.push(row);rows=rows.slice(-500);live=true;if(historyReady){status.replaceChildren();draw();}}catch{}};
  ws.onerror=()=>ws.close();ws.onclose=()=>{if(v!==version||disposed)return;live=false;draw();retry=setTimeout(()=>connect(v),5000);};
 }
 function setInstrument(nextSymbol,interval){
  const nextPeriod=periods[interval]||interval;
  if(nextSymbol===symbol&&nextPeriod===period)return;
  const v=++version;closePopup();stop();symbol=nextSymbol;period=nextPeriod;rows=[];hover=-1;historyReady=false;canvas.hidden=true;label.textContent='';note.textContent='';
  if(isIndex(symbol)){panel.hidden=true;handle.hidden=true;shell.classList.add('volume-unavailable');return;}
  shell.classList.remove('volume-unavailable');panel.hidden=false;handle.hidden=false;
  if(!['1m','3m','5m','15m','30m','1h','2h','4h','6h','8h','12h','1d','3d','1w','1M'].includes(period)){status.textContent='Bu Periyotta Hacim Verisi Yok';draw();return;}
  status.innerHTML=loading('Hacim Yükleniyor',{compact:true});draw();history(v);connect(v);refresh=setInterval(()=>history(v),15000);
 }
 handle.onpointerdown=e=>{if(e.button!==0)return;drag={y:e.clientY,size};handle.setPointerCapture(e.pointerId);e.preventDefault();};
 handle.onpointermove=e=>{if(!drag)return;size=Math.round(Math.max(64,Math.min(360,shell.clientHeight*.45,drag.size+drag.y-e.clientY)));applyHeight();};
 const finish=()=>{if(drag){drag=null;localStorage.setItem(KEY,String(size));}};handle.onpointerup=finish;handle.onpointercancel=finish;
 handle.onkeydown=e=>{if(!['ArrowUp','ArrowDown','Home','End'].includes(e.key))return;e.preventDefault();size=e.key==='Home'?144:e.key==='End'?360:Math.max(64,Math.min(360,size+(e.key==='ArrowUp'?8:-8)));applyHeight();localStorage.setItem(KEY,String(size));};
 panel.onpointerenter=()=>{pointerInside=true;draw();};
 panel.onpointerleave=()=>{pointerInside=false;hover=-1;canvas.style.cursor='default';draw();};
 const hit=e=>{const r=canvas.getBoundingClientRect();return volumeBarAt(volumeBarRects(visibleRows(),r.width,r.height,volumeScale),e.clientX-r.left,e.clientY-r.top);};
 canvas.onpointermove=e=>{hover=hit(e);canvas.style.cursor=hover<0?'default':'pointer';draw();};canvas.onpointerleave=()=>{hover=-1;canvas.style.cursor='default';draw();};
 canvas.onclick=e=>{const i=hit(e);if(i<0){closePopup();return;}openPopup(visibleRows()[i],e.clientX,e.clientY);draw();};
 canvas.onkeydown=e=>{const list=visibleRows();if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();hover=Math.max(0,Math.min(list.length-1,(hover<0?list.length-1:hover)+(e.key==='ArrowLeft'?-1:1)));draw();}if(e.key==='Enter'||e.key===' '){e.preventDefault();const r=canvas.getBoundingClientRect();openPopup(list[hover<0?list.length-1:hover],r.left+r.width/2,r.top);}};
 return {setInstrument,remove(){disposed=true;version++;stop();resize.disconnect();document.removeEventListener('keydown',escapePopup,true);shield.remove();popup.remove();handle.remove();panel.remove();}};
}
