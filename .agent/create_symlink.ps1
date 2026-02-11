$source = "i:\My Drive\script ho tro adobe illustrator\cep"
$destDir = "$env:APPDATA\Adobe\CEP\extensions"
$destLink = Join-Path $destDir "com.dinhson.weddingscripter.panel"

# Ensure destination directory exists
if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    Write-Output "Created directory: $destDir"
}

# Remove existing link if it exists
if (Test-Path $destLink) {
    Remove-Item $destLink -Force -Recurse
    Write-Output "Removed existing link/folder at: $destLink"
}

# Create Junction
New-Item -ItemType Junction -Path $destLink -Target $source
Write-Output "Created Junction: $destLink -> $source"
