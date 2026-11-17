import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import {spawn,spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createInterface} from 'node:readline/promises';
import {release} from './public/release.js';
const app=path.dirname(fileURLToPath(import.meta.url)),root=path.dirname(app),require=createRequire(import.meta.url);
const tr=(process.env.CLARITY_SYSTEM_LANGUAGE||Intl.DateTimeFormat().resolvedOptions().locale).toLowerCase().startsWith('tr');
const t=(a,b)=>tr?a:b,ansi=process.stdout.isTTY&&!process.env.NO_COLOR;
const color=(code,s)=>ansi?`\x1b[${code}m${s}\x1b[0m`:s;
const line=(kind,message)=>console.log(color(kind==='OK'?'32':kind==='WARN'?'33':kind==='ERROR'?'31':'36',`[${kind}] `)+message);
export function dependencyState(base=app){
 const lock=JSON.parse(fs.readFileSync(path.join(base,'package-lock.json'),'utf8'));
 return ['cheerio','echarts','fast-xml-parser','ws'].map(name=>{try{const pkg=JSON.parse(fs.readFileSync(path.join(base,'node_modules',name,'package.json'),'utf8'));return {name,ok:pkg.version===lock.packages['node_modules/'+name]?.version};}catch{return {name,ok:false};}});
}
function npmPath(){const own=path.join(path.dirname(process.execPath),'npm.cmd');if(fs.existsSync(own))return own;const result=spawnSync('where.exe',['npm.cmd'],{encoding:'utf8',windowsHide:true});return result.status===0?result.stdout.trim().split(/\r?\n/)[0]:null;}
async function ask(question){if(!process.stdin.isTTY)return false;const input=createInterface({input:process.stdin,output:process.stdout});try{return /^(y|yes|e|evet)$/i.test((await input.question(question)).trim());}finally{input.close();}}
async function health(port){try{const r=await fetch(`http://127.0.0.1:${port}/api/health`,{signal:AbortSignal.timeout(650)});if(!r.ok)return null;return await r.json();}catch{return null;}}
async function portFree(port){return new Promise(resolve=>{const test=net.createServer();test.once('error',()=>resolve(false));test.listen(port,'127.0.0.1',()=>test.close(()=>resolve(true)));});}
function openBrowser(url){if(process.argv.includes('--no-browser'))return;const opener=spawn(process.env.ComSpec||'cmd.exe',['/d','/s','/c',`start "" "${url}"`],{stdio:'ignore',windowsHide:true,detached:true});opener.on('error',()=>line('WARN',t('Tarayıcıyı elle açıp yukarıdaki adresi kullanın.','Open the browser manually using the URL above.')));opener.unref();}
function addresses(port){console.log('\n'+color('1;36',release.label));console.log('  '+color('32',`http://127.0.0.1:${port}`));console.log('  '+color('36',`http://localhost:${port}`));console.log(color('33','  '+t('Geliştirme aşamasında · Bağlantı yalnızca bu bilgisayara açıktır.','Under development · The server is accessible only on this computer.'))+'\n');}
export async function main(){
 console.log('\n'+color('1;36','  ╭────────────────────────────────────╮\n  │         Clarity Beta 1.0           │\n  │         Market Intelligence        │\n  ╰────────────────────────────────────╯')+'\n');
 if(Number(process.versions.node.split('.')[0])<24)throw Error(t('Node.js 24 veya daha yeni bir sürüm gerekiyor.','Node.js 24 or later is required.'));
 line('OK','Node.js '+process.versions.node);
 let deps=dependencyState();deps.forEach(x=>line(x.ok?'OK':'WARN',x.name+' · '+t(x.ok?'Hazır':'Eksik veya farklı sürüm',x.ok?'Ready':'Missing or mismatched version')));
 if(deps.some(x=>!x.ok)){
  const npm=npmPath();if(!npm){line('WARN',t('Paket kurulumu için npm gerekiyor. Taşınabilir Node.js kurulumu teklif edilecek.','npm is needed to install packages. The portable Node.js setup will be offered.'));return 42;}
  if(process.argv.includes('--check'))return 2;
  if(!await ask(t('Eksik paketler kilitli sürümlerle kurulsun mu? [E/H]: ','Install the missing packages at their locked versions? [Y/N]: ')))return 2;
  const result=spawnSync(process.env.ComSpec||'cmd.exe',['/d','/s','/c',`""${npm}" ci --omit=dev --ignore-scripts"`],{cwd:app,stdio:'inherit',env:{...process.env,PATH:path.dirname(process.execPath)+path.delimiter+process.env.PATH}});
  if(result.status!==0)throw Error(t('Paket kurulumu tamamlanamadı. İnternet bağlantısını kontrol edin.','Package installation failed. Check your internet connection.'));
  deps=dependencyState();if(deps.some(x=>!x.ok))throw Error(t('Paket doğrulaması başarısız.','Dependency verification failed.'));
  line('OK',t('Gerekli paketler hazır.','Required packages are ready.'));
 }
 if(process.argv.includes('--check')){line('OK',t('Başlangıç kontrolü tamamlandı.','Startup checks complete.'));return 0;}
 for(let p=3080;p<3100;p++){const existing=await health(p);if(existing?.app==='Clarity'&&existing.version===release.version){line('OK',t('Clarity zaten çalışıyor.','Clarity is already running.'));addresses(p);openBrowser(`http://127.0.0.1:${p}`);if(process.stdin.isTTY){const input=createInterface({input:process.stdin,output:process.stdout});try{await input.question(t('Bu pencereyi kapatmak için Enter.','Press Enter to close this window.'));}finally{input.close();}}return 0;}}
 // Browser storage is tied to the origin. Never silently move a user's workspace to another port.
 const port=3080;if(!await portFree(port))throw Error(t('3080 bağlantı noktası kullanımda. Açık Clarity penceresini kapatıp tekrar deneyin. Verilerinizin adresi değiştirilmeyecek.','Port 3080 is in use. Close the running Clarity console and try again. Your workspace address will not be changed.'));
 const dataDir=path.join(process.env.LOCALAPPDATA||os.homedir(),'Clarity','data');
 line('INFO',t('Clarity sunucusu başlatılıyor…','Starting the Clarity server…'));
 const child=spawn(process.execPath,[path.join(app,'server.mjs')],{cwd:app,stdio:'inherit',env:{...process.env,PORT:String(port),CLARITY_DATA_DIR:dataDir,CLARITY_SYSTEM_LANGUAGE:tr?'tr':'en'}});
 let stopped=false,exitCode=null;const stop=()=>{stopped=true;if(child.exitCode===null)child.kill();};
 process.once('SIGINT',stop);process.once('SIGTERM',stop);process.once('exit',stop);
 const exited=new Promise(resolve=>{child.once('exit',code=>{exitCode=code;resolve(code??1);});child.once('error',error=>{line('ERROR',error.message);exitCode=1;resolve(1);});});
 try{
  let ready=false;const deadline=Date.now()+45000;
  while(Date.now()<deadline&&!stopped){if(exitCode!==null)break;const h=await health(port);if(h?.app==='Clarity'&&h.version===release.version){ready=true;break;}await new Promise(r=>setTimeout(r,250));}
  if(!ready){stop();throw Error(t('Sunucu açılamadı. Yukarıdaki hata iletisini kontrol edin.','The server did not start. Check the error message above.'));}
  line('OK',t('Sunucu hazır. Tarayıcı açılıyor.','Server ready. Opening your browser.'));addresses(port);line('INFO',t('Bu pencere açık kalsın. Durdurmak için Ctrl+C kullanın.','Keep this window open. Press Ctrl+C to stop.'));openBrowser(`http://127.0.0.1:${port}`);
  const code=await exited;return stopped?0:code;
 }finally{stop();process.removeListener('SIGINT',stop);process.removeListener('SIGTERM',stop);process.removeListener('exit',stop);}
}
if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url){main().then(code=>{process.exitCode=code;}).catch(error=>{line('ERROR',error.message);process.exitCode=1;});}
