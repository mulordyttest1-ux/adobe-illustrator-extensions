# Config: Map Source Path -> Destination Folder Name
$extensions = @{
    "C:\Projects\adobe-illustrator-extensions\wedding-cep\cep" = "com.dinhson.weddingscripter.panel.dev"
    "C:\Projects\adobe-illustrator-extensions\symbol-cep\cep"  = "com.dinhson.imposition.panel.dev"
}

$destDir = "$env:APPDATA\Adobe\CEP\extensions"

# Ensure destination directory exists
if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    Write-Output "Created CEP extensions directory: $destDir"
}

foreach ($source in $extensions.Keys) {
    $folderName = $extensions[$source]
    $destLink = Join-Path $destDir $folderName
    
    Write-Output "Processing: $folderName"
    
    # Check source existence
    if (-not (Test-Path $source)) {
        Write-Error "CRITICAL: Source directory not found: $source"
        continue
    }

    # Remove existing link if it exists
    if (Test-Path $destLink) {
        Remove-Item $destLink -Force -Recurse
        Write-Output "   Removed existing link/folder"
    }

    # Create Junction
    try {
        New-Item -ItemType Junction -Path $destLink -Target $source | Out-Null
        Write-Output "   ✅ Created Junction: $folderName -> Local Source"
    } catch {
        Write-Error "   ❌ Failed to create junction. Ensure you are running as Administrator."
        Write-Error "   Error: $_"
    }
    Write-Output "--------------------------------"
}

Write-Output "Done! Restart Adobe Illustrator to see 'Wedding Scripter (Dev)' and 'Imposition Panel (Dev)'."
