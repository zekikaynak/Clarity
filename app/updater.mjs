import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {release} from './public/release.js';
const app=path.dirname(fileURLToPath(import.meta.url)),root=path.dirname(app);
const tr=(process.env.CLARITY_SYSTEM_LANGUAGE||'tr').startsWith('tr');
const say=(a,b)=>console.log('[UPDATE] '+(tr?a:b));
export const sha256=data=>crypto.createHash('sha256').update(data).digest('hex');
export function compareVersions(a,b){
 const parse=v=>{const m=/^v?(\d+)\.(\d+)\.(\d+)(?:-(beta|rc)\.(\d+))?$/.exec(v);if(!m)throw Error('Invalid release version');return [+m[1],+m[2],+m[3],m[4]?m[4]==='beta'?0:1:2,+(m[5]||0)];};
 const x=parse(a),y=parse(b);for(let i=0;i<x.length;i++)if(x[i]!==y[i])return x[i]>y[i]?1:-1;return 0;
}
export function managedPath(value){
 if(typeof value!=='string'||value.length>230||value.includes('\\')||!/^app\/[A-Za-z0-9@_.+\-/]+$/.test(value))return false;
 const pieces=value.split('/');if(pieces.some(x=>!x||x==='.'||x==='..'||/[. ]$/.test(x)||/^(con|prn|aux|nul|com\d|lpt\d)(\.|$)/i.test(x)))return false;
 if(pieces.some(x=>['data','logs','cache','coverage','.git','.env','.npmrc'].includes(x.toLowerCase())))return false;
 return value.startsWith('app/public/')||value.startsWith('app/node_modules/')||/^app\/[a-z0-9-]+\.(mjs|ps1)$/.test(value)||['app/package.json','app/package-lock.json','app/update-config.json'].includes(value);
}
export function validateManifest(m){
 if(m?.schema!==1||typeof m.version!=='string'||!/^[a-f0-9]{64}$/.test(m.archiveSha256)||!Array.isArray(m.files)||!m.files.length||m.files.length>20000)throw Error('Invalid update manifest');
 compareVersions(m.version,m.version);const seen=new Set();let size=0;
 for(const f of m.files){const key=f.path?.toLowerCase();if(!managedPath(f.path)||seen.has(key)||!/^[a-f0-9]{64}$/.test(f.sha256)||!Number.isSafeInteger(f.size)||f.size<0)throw Error('Unsafe update file');seen.add(key);size+=f.size;}
 if(size>500*1024*1024||!seen.has('app/server.mjs')||!seen.has('app/public/release.js')||!seen.has('app/package.json')||!seen.has('app/launcher.mjs'))throw Error('Incomplete update');return m;
}
function inside(base,target){const rel=path.relative(base,target);if(!rel||rel.startsWith('..')||path.isAbsolute(rel))throw Error('Unsafe update location');}
function noLinks(base){if(fs.lstatSync(base).isSymbolicLink())throw Error('Linked installation directory');for(const e of fs.readdirSync(base,{withFileTypes:true})){const p=path.join(base,e.name);if(e.isSymbolicLink())throw Error('Linked installation file: '+e.name);if(e.isDirectory())noLinks(p);}}
export function verifyPayload(payload,m){validateManifest(m);for(const f of m.files){const p=path.resolve(payload,f.path);inside(payload,p);const stat=fs.lstatSync(p);if(!stat.isFile()||stat.isSymbolicLink()||stat.size!==f.size||sha256(fs.readFileSync(p))!==f.sha256)throw Error('Update file verification failed: '+f.path);}}
function writeJSON(file,data){const temp=file+'.tmp';fs.writeFileSync(temp,JSON.stringify(data,null,2));fs.renameSync(temp,file);}
export function recoverUpdate(installRoot){
 const area=path.join(installRoot,'runtime','updates'),journal=path.join(area,'transaction.json');if(!fs.existsSync(journal))return false;
 const state=JSON.parse(fs.readFileSync(journal,'utf8'));if(!/^[a-z0-9-]+$/.test(state.id))throw Error('Invalid recovery journal');const job=path.join(area,state.id),backup=path.join(job,'backup-app'),target=path.join(installRoot,'app');inside(area,job);
 if(fs.existsSync(backup)){if(fs.existsSync(target))fs.renameSync(target,path.join(job,'failed-app-'+Date.now()));fs.renameSync(backup,target);}else if(state.phase!=='prepared')throw Error('Update backup missing; manual recovery required');
 fs.renameSync(journal,path.join(job,'recovered.json'));return true;
}
export function applyPayload(installRoot,payload,m,{smokeCheck=()=>true,beforeCommit=()=>{}}={}){
 verifyPayload(payload,m);const target=path.join(installRoot,'app'),area=path.join(installRoot,'runtime','updates');noLinks(target);fs.mkdirSync(area,{recursive:true});noLinks(area);
 if(fs.existsSync(path.join(area,'transaction.json')))throw Error('Pending update recovery required');
 const id=Date.now()+'-'+crypto.randomBytes(5).toString('hex'),job=path.join(area,id),next=path.join(job,'next-app'),backup=path.join(job,'backup-app'),journal=path.join(area,'transaction.json');inside(installRoot,job);fs.mkdirSync(job);
 // Overlay onto a copy: unlisted files, .env and local data are retained byte-for-byte.
 fs.cpSync(target,next,{recursive:true});for(const f of m.files){const dest=path.join(next,f.path.slice(4));inside(next,dest);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(payload,f.path),dest);}
 if(!smokeCheck(next))throw Error('Staged application check failed');beforeCommit();writeJSON(journal,{id,phase:'prepared'});
 try{fs.renameSync(target,backup);writeJSON(journal,{id,phase:'swapped'});fs.renameSync(next,target);if(!smokeCheck(target))throw Error('Installed application check failed');fs.renameSync(journal,path.join(job,'committed.json'));return {backup,version:m.version};}
 catch(error){recoverUpdate(installRoot);throw error;}
}
const headers={'User-Agent':'Clarity-Updater/1.0','Accept':'application/vnd.github+json'};
async function json(url){const r=await fetch(url,{headers,signal:AbortSignal.timeout(9000)});if(r.status===404)return null;if(!r.ok)throw Error('GitHub HTTP '+r.status);return r.json();}
export function releaseAssetURL(url,repository,tag){const u=new URL(url),prefix=`/${repository}/releases/download/${encodeURIComponent(tag)}/`;if(u.protocol!=='https:'||u.host!=='github.com'||!u.pathname.startsWith(prefix)||u.username||u.password||u.search||u.hash)throw Error('Unexpected release asset URL');return u.href;}
async function assetBytes(asset,repository,tag,max){releaseAssetURL(asset.browser_download_url,repository,tag);if(asset.size>max)throw Error('Update asset too large');const r=await fetch(asset.browser_download_url,{signal:AbortSignal.timeout(120000)});if(!r.ok)throw Error('Asset HTTP '+r.status);const chunks=[];let length=0;for await(const chunk of r.body){length+=chunk.length;if(length>max)throw Error('Update asset too large');chunks.push(chunk);}const data=Buffer.concat(chunks);if(asset.digest&&asset.digest!=='sha256:'+sha256(data))throw Error('GitHub asset checksum mismatch');return data;}
export async function checkUpdates(){
 const config=JSON.parse(fs.readFileSync(path.join(app,'update-config.json'),'utf8'));if(!config.enabled||process.argv.includes('--skip-update'))return false;
 if(!/^[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+$/.test(config.repository))throw Error('Invalid repository');
 say('GitHub güncellemeleri kontrol ediliyor…','Checking GitHub releases…');const list=await json(`https://api.github.com/repos/${config.repository}/releases?per_page=30`);if(!list){say('Henüz yayınlanmış güncelleme yok.','No published update yet.');return false;}
 const candidates=list.filter(r=>!r.draft&&(config.channel==='beta'||!r.prerelease)).filter(r=>{try{return compareVersions(r.tag_name,release.version)>0;}catch{return false;}}).sort((a,b)=>compareVersions(b.tag_name,a.tag_name));
 const latest=candidates[0];if(!latest){say('Clarity güncel.','Clarity is up to date.');return false;}
 for(let port=3080;port<3100;port++){try{const r=await fetch(`http://127.0.0.1:${port}/api/health`,{signal:AbortSignal.timeout(200)});const h=await r.json();if(h.app==='Clarity'){say('Yeni sürüm var. Açık Clarity penceresini kapatıp BAT dosyasını yeniden açın; çalışan oturuma dokunulmadı.','Update available. Close the running Clarity console and reopen the BAT; the active session was left untouched.');return false;}}catch{}}
 const manifestAsset=latest.assets.find(a=>a.name==='clarity-update.json'),archiveAsset=latest.assets.find(a=>a.name==='clarity-update.zip');if(!manifestAsset||!archiveAsset)throw Error('Release update assets missing');
 const m=validateManifest(JSON.parse((await assetBytes(manifestAsset,config.repository,latest.tag_name,4*1024*1024)).toString()));if(compareVersions(m.version,latest.tag_name)!==0)throw Error('Release version mismatch');
 say('Yeni sürüm indiriliyor: '+m.version,'Downloading update: '+m.version);const zip=await assetBytes(archiveAsset,config.repository,latest.tag_name,100*1024*1024);if(sha256(zip)!==m.archiveSha256)throw Error('Update archive checksum mismatch');
 const stage=path.join(root,'runtime','updates','download-'+crypto.randomBytes(8).toString('hex'));fs.mkdirSync(stage,{recursive:true});const archive=path.join(stage,'update.zip'),payload=path.join(stage,'payload');fs.writeFileSync(archive,zip);fs.writeFileSync(path.join(stage,'manifest.json'),JSON.stringify(m));
 const extractCode='& {\n'+fs.readFileSync(path.join(app,'update-extract.ps1'),'utf8')+'\n} -Archive $env:CLARITY_UPDATE_ZIP -Destination $env:CLARITY_UPDATE_PAYLOAD -Manifest $env:CLARITY_UPDATE_MANIFEST';
 const extracted=spawnSync('powershell.exe',['-NoProfile','-Command',extractCode],{stdio:'inherit',windowsHide:true,env:{...process.env,CLARITY_UPDATE_ZIP:archive,CLARITY_UPDATE_PAYLOAD:payload,CLARITY_UPDATE_MANIFEST:path.join(stage,'manifest.json')}});if(extracted.status!==0)throw Error('Update extraction failed');
 const smokeCheck=base=>{for(const name of ['launcher.mjs','server.mjs','updater.mjs'])if(spawnSync(process.execPath,['--check',path.join(base,name)],{windowsHide:true}).status!==0)return false;try{return JSON.parse(fs.readFileSync(path.join(base,'package.json'))).version===m.version;}catch{return false;}};
 applyPayload(root,payload,m,{smokeCheck});say('Güncellendi. Kişisel veriler korunarak yeniden başlatılıyor.','Updated. Restarting with personal data preserved.');return true;
}
export async function main(){try{if(recoverUpdate(root))say('Yarım kalan güncelleme geri alındı.','Interrupted update rolled back.');if(process.argv.includes('--check'))return 0;return await checkUpdates()?43:0;}catch(error){if(fs.existsSync(path.join(root,'runtime','updates','transaction.json'))){console.error('[UPDATE] Recovery required: '+error.message);return 44;}say('Güncelleme uygulanamadı; mevcut sürümle devam ediliyor. '+error.message,'Update unavailable; continuing with the installed version. '+error.message);return 0;}}
if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url)main().then(code=>process.exitCode=code);
