import {language} from './i18n.js';
export function connectionState({reachable=true,sources=null,stream='connecting',lastTrade=0,now=Date.now()}={}){
 if(!reachable||stream==='disconnected')return 'offline';
 if(sources===null||!Object.keys(sources).length||stream!=='live'||(lastTrade&&now-lastTrade>12000))return 'waiting';
 return Object.values(sources).some(source=>!source.ok)?'partial':'healthy';
}
export function mountConnectionIndicator({api,getStream,getLastTrade}){
 const button=document.querySelector('#source-button');let sources=null,reachable=true,previous='';
 button.querySelector('.source-button-label>span').textContent=language==='en'?'Connection Status':'Bağlantı Durumu';
 const descriptions={healthy:['Bağlantılar Sağlıklı','Connections Healthy'],partial:['Bazı Veri Kaynaklarına Erişilemiyor','Some Data Sources Are Unavailable'],waiting:['Bağlantılar Kontrol Ediliyor · Veri Bekleniyor','Checking Connections · Waiting For Data'],offline:['Bağlantı Kesildi · Yeniden Deneniyor','Disconnected · Reconnecting']};
 function refresh(){const state=connectionState({reachable,sources,stream:getStream(),lastTrade:getLastTrade()});if(state===previous)return;previous=state;button.dataset.state=state;const description=descriptions[state][language==='tr'?0:1];button.title=description;button.setAttribute('aria-label',(language==='tr'?'Bağlantı Durumu':'Connection Status')+' · '+description);}
 async function check(){try{const result=await api('status');sources=result.data.sources;reachable=true;}catch{reachable=false;}refresh();}
 check();setInterval(check,30000);return {refresh};
}
