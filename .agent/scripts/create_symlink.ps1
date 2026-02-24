# Config: Map Source Path -> Destination Folder Name (Relative to Script Location)
# Usage: Run this script from ANY location, it resolves paths relative to itself.

$scriptRoot = $PSScriptRoot
$repoRoot = Resolve-Path "$scriptRoot\..\.."

Write-Output "📂 Repo Root: $repoRoot"

$extensions = @{
    "$repoRoot\wedding-cep\cep" = "com.dinhson.weddingscripter.panel.dev"
    "$repoRoot\symbol-cep\cep"  = "com.dinhson.imposition.panel.dev"
}

$destDir = "$env:APPDATA\Adobe\CEP\extensions"

# Ensure destination directory exists
if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    Write-Output "✅ Created CEP extensions directory: $destDir"
}

foreach ($sourceKey in $extensions.Keys) {
    $folderName = $extensions[$sourceKey]
    $sourcePath = Resolve-Path $sourceKey -ErrorAction SilentlyContinue
    
    if (-not $sourcePath) {
        Write-Error "❌ CRITICAL: Source directory not found: $sourceKey"
        continue
    }

    $destLink = Join-Path $destDir $folderName
    
    Write-Output "🔗 Processing: $folderName"
    Write-Output "   Source: $sourcePath"
    Write-Output "   Target: $destLink"

    # Remove existing link if it exists
    if (Test-Path $destLink) {
        Remove-Item $destLink -Force -Recurse
        Write-Output "   🗑️  Removed existing link/folder"
    }

    # Create Junction
    try {
        New-Item -ItemType Junction -Path $destLink -Target $sourcePath | Out-Null
        Write-Output "   ✅ Created Junction Successfully"
    }
    catch {
        Write-Error "   ❌ Failed to create junction. Ensure you are running as Administrator."
        Write-Error "   Error: $_"
    }
    Write-Output "--------------------------------"
}

Write-Output "🚀 Done! Restart Adobe Illustrator to see extensions."
