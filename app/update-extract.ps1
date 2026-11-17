param([Parameter(Mandatory=$true)][string]$Archive,[Parameter(Mandatory=$true)][string]$Destination,[Parameter(Mandatory=$true)][string]$Manifest)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$spec=Get-Content -LiteralPath $Manifest -Raw | ConvertFrom-Json
$allowed=@{}
foreach($file in $spec.files){$allowed[$file.path]=$file}
$zip=[IO.Compression.ZipFile]::OpenRead($Archive)
try {
 $seen=@{}
 foreach($entry in $zip.Entries){
  $name=$entry.FullName
  if(-not $allowed.ContainsKey($name) -or $seen.ContainsKey($name) -or $entry.Length -ne $allowed[$name].size -or (($entry.ExternalAttributes -shr 16) -band 0xF000) -eq 0xA000){throw 'Unexpected archive entry'}
  $seen[$name]=$true
 }
 if($seen.Count -ne $allowed.Count){throw 'Incomplete archive'}
 New-Item -ItemType Directory -Path $Destination | Out-Null
 $base=[IO.Path]::GetFullPath($Destination)+[IO.Path]::DirectorySeparatorChar
 foreach($entry in $zip.Entries){
  $target=[IO.Path]::GetFullPath((Join-Path $Destination $entry.FullName))
  if(-not $target.StartsWith($base,[StringComparison]::OrdinalIgnoreCase)){throw 'Unsafe archive path'}
  [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($target)) | Out-Null
  [IO.Compression.ZipFileExtensions]::ExtractToFile($entry,$target,$false)
 }
}finally{$zip.Dispose()}
