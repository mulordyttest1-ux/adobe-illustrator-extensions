$regKeys = Get-ChildItem "HKCU:\Software\Adobe" -ErrorAction SilentlyContinue | Where-Object {$_.Name -match "CSXS"}
if ($regKeys) {
    foreach ($key in $regKeys) {
        $ver = $key.Name.Split('\')[-1]
        $val = (Get-ItemProperty -Path $key.PSPath -Name "PlayerDebugMode" -ErrorAction SilentlyContinue).PlayerDebugMode
        Write-Output "Registry $ver : $val"
    }
} else {
    Write-Output "No CSXS Registry keys found."
}

$extPath = "$env:APPDATA\Adobe\CEP\extensions\com.dinhson.weddingscripter.panel"
if (Test-Path $extPath) {
    $item = Get-Item $extPath
    $target = $item.Target
    Write-Output "Symlink FOUND: $target"
} else {
    Write-Output "Symlink MISSING at $extPath"
}
