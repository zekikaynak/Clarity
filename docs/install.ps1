param(
    [string]$InstallPath = (Join-Path $env:LOCALAPPDATA 'Programs\Clarity'),
    [switch]$NoLaunch
)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$tr = [Globalization.CultureInfo]::CurrentUICulture.TwoLetterISOLanguageName -eq 'tr'
function Say($en, $turkish) { if ($tr) { Write-Host $turkish -ForegroundColor Cyan } else { Write-Host $en -ForegroundColor Cyan } }
$target = [IO.Path]::GetFullPath($InstallPath)
$launcher = Join-Path $target 'Start Clarity.bat'
if (Test-Path -LiteralPath $target) {
    if ((Test-Path -LiteralPath $launcher -PathType Leaf) -and (Test-Path -LiteralPath (Join-Path $target 'app\updater.mjs') -PathType Leaf)) {
        Say 'Existing Clarity found. The launcher will check for updates; your files are preserved.' 'Clarity zaten kurulu. Baslatici guncellemeleri kontrol edecek; dosyalariniz korunur.'
        if (-not $NoLaunch) { Start-Process -FilePath $launcher -WorkingDirectory $target }
        return
    }
    throw "Destination already exists. No files were changed. Choose another -InstallPath: $target"
}
$stage = Join-Path ([IO.Path]::GetTempPath()) ('clarity-install-' + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $stage | Out-Null
try {
    Say 'Checking official Clarity releases...' 'Resmi Clarity surumleri kontrol ediliyor...'
    $headers = @{ 'User-Agent' = 'Clarity-Windows-Installer'; Accept = 'application/vnd.github+json' }
    $releases = Invoke-RestMethod -Uri 'https://api.github.com/repos/zekikaynak/Clarity/releases?per_page=100' -Headers $headers
    $release = $releases | Where-Object { -not $_.draft -and $_.tag_name -match '^v\d+\.\d+\.\d+(?:-(?:beta|rc)\.\d+)?$' -and ($_.assets.name -contains 'Clarity-Beta-1.0-Windows.zip') } | Sort-Object published_at -Descending | Select-Object -First 1
    if (-not $release) { throw 'No Windows release is available.' }
    $asset = $release.assets | Where-Object name -eq 'Clarity-Beta-1.0-Windows.zip' | Select-Object -First 1
    $url = [Uri]$asset.browser_download_url
    $prefix = '/zekikaynak/Clarity/releases/download/' + [Uri]::EscapeDataString($release.tag_name) + '/'
    if ($url.Scheme -ne 'https' -or $url.Host -ne 'github.com' -or -not $url.AbsolutePath.StartsWith($prefix) -or $url.Query -or $url.Fragment) { throw 'Unexpected download URL.' }
    if ($asset.size -le 0 -or $asset.size -gt 524288000 -or $asset.digest -notmatch '^sha256:[a-f0-9]{64}$') { throw 'Release integrity information is missing or invalid.' }
    Say ('Downloading ' + $release.tag_name + '...') ($release.tag_name + ' indiriliyor...')
    $zipPath = Join-Path $stage 'release.zip'
    Invoke-WebRequest -UseBasicParsing -Uri ($url.AbsoluteUri + '?asset_id=' + $asset.id) -OutFile $zipPath -Headers $headers
    if ((Get-Item -LiteralPath $zipPath).Length -ne $asset.size -or ('sha256:' + (Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash.ToLowerInvariant()) -ne $asset.digest) { throw 'Package checksum mismatch.' }
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $archive = [IO.Compression.ZipFile]::OpenRead($zipPath)
    $payload = Join-Path $stage 'payload'
    $base = [IO.Path]::GetFullPath($payload) + [IO.Path]::DirectorySeparatorChar
    try {
        $seen = @{}; [long]$size = 0
        foreach ($entry in $archive.Entries) {
            $name = $entry.FullName.Replace('\','/')
            if ($name -notmatch '^(app/|docs/|runtime/|Start Clarity\.bat$)' -or $name -match '(^|/)\.\.?(/|$)|:|^/' -or (($entry.ExternalAttributes -shr 16) -band 61440) -eq 40960) { throw 'Unsafe package entry.' }
            $resolved = [IO.Path]::GetFullPath((Join-Path $payload $name))
            if (-not $resolved.StartsWith($base, [StringComparison]::OrdinalIgnoreCase) -or $seen.ContainsKey($resolved)) { throw 'Unsafe or duplicate package path.' }
            $seen[$resolved] = $true; $size += $entry.Length
            if ($size -gt 1073741824) { throw 'Expanded package is too large.' }
        }
    } finally { $archive.Dispose() }
    [IO.Compression.ZipFile]::ExtractToDirectory($zipPath, $payload)
    foreach ($file in @('Start Clarity.bat','app\launcher.mjs','app\updater.mjs','app\public\release.js','runtime\node.exe')) {
        if (-not (Test-Path -LiteralPath (Join-Path $payload $file) -PathType Leaf)) { throw "Incomplete package: $file" }
    }
    New-Item -ItemType Directory -Path (Split-Path -Parent $target) -Force | Out-Null
    if (Test-Path -LiteralPath $target) { throw 'Destination appeared during installation. Nothing was overwritten.' }
    Move-Item -LiteralPath $payload -Destination $target
    Say ('Clarity installed: ' + $target) ('Clarity kuruldu: ' + $target)
    if (-not $NoLaunch) { Start-Process -FilePath $launcher -WorkingDirectory $target }
} finally {
    if (Test-Path -LiteralPath $stage) { Remove-Item -LiteralPath $stage -Recurse -Force }
}
