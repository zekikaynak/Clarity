import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {normalizeCalendarEvent} from './free-data.mjs';
export function createCalendarProvider({remote}){
 const dataDir=process.env.CLARITY_DATA_DIR||path.join(process.env.LOCALAPPDATA||os.homedir(),'Clarity','data');const file=path.join(dataDir,'calendar-history.json');let rows=new Map(),ready=false;
 async function get(){
  if(!ready){try{for(const x of JSON.parse(await fs.readFile(file,'utf8')))rows.set(x.id,x);}catch{}ready=true;}
  try{
   const d=await remote('https://showmytrades.com/api/public/calendar/v1?days=7&impact=all');
   if(!Array.isArray(d.events))throw Error('Takvim verisi okunamadı');
   const normalized=d.events.map(normalizeCalendarEvent).filter(Boolean),ids=new Set(normalized.map(x=>x.id)),from=Date.parse(d.from),to=Date.parse(d.to);
   for(const [id,x]of rows)if(Date.parse(x.date)>=from&&Date.parse(x.date)<=to&&!ids.has(id)&&Date.parse(x.date)>Date.now())rows.delete(id);
   for(const x of normalized){const old=rows.get(x.id);rows.set(x.id,{...old,...x,actual:x.actual===''?(old?.actual??''):x.actual});}
   for(const [id,x]of rows)if(Date.parse(x.date)<Date.now()-14*86400000)rows.delete(id);
   await fs.mkdir(dataDir,{recursive:true});await fs.writeFile(file,JSON.stringify([...rows.values()]));
   return {source:'ShowMyTrades · Ücretsiz Açık Erişim',events:[...rows.values()],generatedAt:d.generated_at,actualSupported:true,refreshMinutes:15};
  }catch(error){
   if(rows.size)return {source:'Yerel Takvim Kaydı',events:[...rows.values()],stale:true,actualSupported:true,error:'Takvim bağlantısı şu anda yenilenemedi'};
   const events=await remote('https://nfs.faireconomy.media/ff_calendar_thisweek.json');
   return {source:'Açık Haftalık Takvim · Yedek',events:events.map(x=>({...x,actual:null,actualSupported:false})),actualSupported:false};
  }
 }
 // Keep released results while the app is running, even away from the calendar page.
 const timer=setInterval(()=>get().catch(()=>{}),900000);timer.unref();get().catch(()=>{});
 return {get};
}
