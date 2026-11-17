@echo off
setlocal
chcp 65001 >nul
title Clarity Beta 1.0
set "CLARITY_ROOT=%~dp0"
cd /d "%CLARITY_ROOT%"
for /f "delims=" %%L in ('powershell.exe -NoLogo -NoProfile -Command "if([Globalization.CultureInfo]::CurrentUICulture.TwoLetterISOLanguageName -eq 'tr'){'tr'}else{'en'}"') do set "CLARITY_SYSTEM_LANGUAGE=%%L"
set "NODE_BIN="
if exist "%CLARITY_ROOT%runtime\node\node.exe" call :CHECK_NODE "%CLARITY_ROOT%runtime\node\node.exe"
if not defined NODE_BIN if exist "%CLARITY_ROOT%runtime\node.exe" call :CHECK_NODE "%CLARITY_ROOT%runtime\node.exe"
if not defined NODE_BIN for /f "delims=" %%N in ('where node.exe 2^>nul') do if not defined NODE_BIN call :CHECK_NODE "%%N"
if not defined NODE_BIN call :INSTALL_NODE
if not defined NODE_BIN goto :FAILED
:RUN
powershell.exe -NoLogo -NoProfile -Command "$ErrorActionPreference='Stop'; $area=Join-Path $env:CLARITY_ROOT 'runtime\updates'; $journal=Join-Path $area 'transaction.json'; if(Test-Path -LiteralPath $journal){$state=Get-Content -LiteralPath $journal -Raw|ConvertFrom-Json; if($state.id -notmatch '^[a-z0-9-]+$'){throw 'Invalid update recovery journal'}; $job=[IO.Path]::GetFullPath((Join-Path $area $state.id)); $safe=[IO.Path]::GetFullPath($area)+[IO.Path]::DirectorySeparatorChar; if(-not $job.StartsWith($safe,[StringComparison]::OrdinalIgnoreCase)){throw 'Invalid recovery path'}; $backup=Join-Path $job 'backup-app'; $target=Join-Path $env:CLARITY_ROOT 'app'; if(Test-Path -LiteralPath $backup){if(Test-Path -LiteralPath $target){Move-Item -LiteralPath $target -Destination (Join-Path $job ('failed-app-'+[Guid]::NewGuid().ToString('N')))}; Move-Item -LiteralPath $backup -Destination $target; Write-Host '[UPDATE] Interrupted update restored.' -ForegroundColor Yellow}else{if($state.phase -ne 'prepared'){throw 'Update backup missing'}}; Move-Item -LiteralPath $journal -Destination (Join-Path $job 'recovered.json')}"
if errorlevel 1 goto :FAILED
if not exist "%CLARITY_ROOT%app\updater.mjs" goto :LAUNCH
"%NODE_BIN%" "%CLARITY_ROOT%app\updater.mjs" %*
if errorlevel 44 goto :FAILED
if errorlevel 43 goto :RUN
:LAUNCH
"%NODE_BIN%" "%CLARITY_ROOT%app\launcher.mjs" %*
set "CLARITY_RESULT=%ERRORLEVEL%"
if "%CLARITY_RESULT%"=="42" goto :NEED_NPM
if not "%CLARITY_RESULT%"=="0" goto :FAILED
exit /b 0
:NEED_NPM
call :INSTALL_NODE
if errorlevel 1 goto :FAILED
goto :RUN
:CHECK_NODE
"%~1" -e "process.exit(Number(process.versions.node.split('.')[0]) >= 24 ? 0 : 1)" >nul 2>&1
if not errorlevel 1 set "NODE_BIN=%~1"
exit /b 0
:INSTALL_NODE
powershell.exe -NoLogo -NoProfile -Command "Write-Host 'Clarity Beta 1.0' -ForegroundColor Cyan; Write-Host 'Portable Node.js + npm setup is required. No admin rights or system changes.' -ForegroundColor Yellow"
choice /c YN /n /m "Download the official Node.js runtime into the runtime folder? [Y/N]: "
if errorlevel 2 exit /b 1
powershell.exe -NoLogo -NoProfile -Command "$ErrorActionPreference='Stop'; [Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; $arch=if(($env:PROCESSOR_ARCHITECTURE -eq 'ARM64') -or ($env:PROCESSOR_ARCHITEW6432 -eq 'ARM64')){'arm64'}else{'x64'}; $name='node-v24.17.0-win-'+$arch+'.zip'; $base='https://nodejs.org/dist/v24.17.0/'; $temp=Join-Path ([IO.Path]::GetTempPath()) ('clarity-node-'+[Guid]::NewGuid().ToString('N')); New-Item -ItemType Directory -Path $temp | Out-Null; try { Write-Host ('Downloading '+$name) -ForegroundColor Cyan; $zip=Join-Path $temp $name; Invoke-WebRequest ($base+$name) -OutFile $zip -UseBasicParsing; $sums=(Invoke-WebRequest ($base+'SHASUMS256.txt') -UseBasicParsing).Content; $line=($sums -split '\r?\n' | Where-Object {$_ -match [regex]::Escape($name)+'$'} | Select-Object -First 1); if(-not $line){throw 'Official checksum missing'}; $expected=($line -split '\s+')[0]; if((Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash -ne $expected){throw 'Node.js checksum mismatch'}; Write-Host 'SHA-256 verified. Extracting...' -ForegroundColor Green; Expand-Archive -LiteralPath $zip -DestinationPath $temp; $destination=[IO.Path]::GetFullPath((Join-Path $env:CLARITY_ROOT 'runtime\node')); $allowed=[IO.Path]::GetFullPath((Join-Path $env:CLARITY_ROOT 'runtime'))+[IO.Path]::DirectorySeparatorChar; if(-not $destination.StartsWith($allowed,[StringComparison]::OrdinalIgnoreCase)){throw 'Invalid runtime path'}; New-Item -ItemType Directory -Path $destination -Force | Out-Null; Copy-Item -Path (Join-Path $temp ('node-v24.17.0-win-'+$arch+'\*')) -Destination $destination -Recurse -Force; Write-Host 'Node.js and npm are ready.' -ForegroundColor Green } finally { $safe=[IO.Path]::GetFullPath($temp); $tempRoot=[IO.Path]::GetFullPath([IO.Path]::GetTempPath()); if($safe.StartsWith($tempRoot,[StringComparison]::OrdinalIgnoreCase) -and ([IO.Path]::GetFileName($safe)).StartsWith('clarity-node-')){Remove-Item -LiteralPath $safe -Recurse -Force} }"
if errorlevel 1 exit /b 1
set "NODE_BIN=%CLARITY_ROOT%runtime\node\node.exe"
exit /b 0
:FAILED
powershell.exe -NoLogo -NoProfile -Command "Write-Host 'Clarity could not start. Review the messages above.' -ForegroundColor Red"
pause
exit /b 1
