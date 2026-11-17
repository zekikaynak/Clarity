// Publisher tool: creates immutable per-file update assets. No user data is packaged.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {managedPath,sha256} from './updater.mjs';
import {release} from './public/release.js';
const app=path.dirname(fileURLToPath(import.meta.url)),root=path.dirname(app),out=path.resolve(process.argv[2]||path.join(root,'runtime','release-assets'));
fs.mkdirSync(out,{recursive:true});const files=[];
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name),relative=path.relative(root,file).split(path.sep).join('/');if(entry.isSymbolicLink())continue;if(entry.isDirectory()){if(['data','logs','cache','coverage','.git'].includes(entry.name))continue;walk(file);}else if(managedPath(relative)){const data=fs.readFileSync(file);files.push({path:relative,size:data.length,sha256:sha256(data)});}}}
walk(app);files.sort((a,b)=>a.path.localeCompare(b.path));const manifestFile=path.join(out,'clarity-update.json'),zipFile=path.join(out,'clarity-update.zip');fs.writeFileSync(manifestFile,JSON.stringify({schema:1,version:release.version,archiveSha256:'0'.repeat(64),files},null,2));
const code=`$ErrorActionPreference='Stop';Add-Type -AssemblyName System.IO.Compression;Add-Type -AssemblyName System.IO.Compression.FileSystem;$spec=Get-Content -LiteralPath $env:CLARITY_PACK_MANIFEST -Raw|ConvertFrom-Json;$zip=[IO.Compression.ZipFile]::Open($env:CLARITY_PACK_ZIP,[IO.Compression.ZipArchiveMode]::Create);try{foreach($file in $spec.files){[IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip,(Join-Path $env:CLARITY_PACK_ROOT $file.path),$file.path,[IO.Compression.CompressionLevel]::Optimal)|Out-Null}}finally{$zip.Dispose()}`;
if(fs.existsSync(zipFile))throw Error('Output ZIP already exists. Choose a new output directory.');
const result=spawnSync('powershell.exe',['-NoProfile','-Command',code],{stdio:'inherit',windowsHide:true,env:{...process.env,CLARITY_PACK_MANIFEST:manifestFile,CLARITY_PACK_ZIP:zipFile,CLARITY_PACK_ROOT:root}});if(result.status!==0)throw Error('Release packaging failed');
const manifest=JSON.parse(fs.readFileSync(manifestFile));manifest.archiveSha256=sha256(fs.readFileSync(zipFile));fs.writeFileSync(manifestFile,JSON.stringify(manifest,null,2));console.log(`Clarity ${release.version}: ${files.length} files\n${zipFile}\n${manifestFile}`);
