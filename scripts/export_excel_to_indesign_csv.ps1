<# 
Exports Excel workbooks to CSV files for Adobe InDesign Data Merge.

Output:
- UTF-8 with BOM, so Vietnamese/Unicode text is read reliably.
- CSV is written next to the source workbook as <name>_indesign.csv.

Examples:
  powershell -ExecutionPolicy Bypass -File .\scripts\export_excel_to_indesign_csv.ps1 -Path "C:\Jobs\names.xlsx"
  powershell -ExecutionPolicy Bypass -File .\scripts\export_excel_to_indesign_csv.ps1 -Path "\\server\share\job-folder"
  powershell -ExecutionPolicy Bypass -File .\scripts\export_excel_to_indesign_csv.ps1 -Path "C:\Jobs\names.xlsx" -SheetName "Data"
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string] $Path,

    [int] $SheetIndex = 1,

    [string] $SheetName = '',

    [string] $OutputSuffix = '_indesign',

    [switch] $AllSheets
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Assert-ExcelPath {
    param([System.IO.FileInfo] $File)

    $allowedExtensions = @('.xls', '.xlsx', '.xlsm')
    if ($File.Name.StartsWith('~$')) {
        return $false
    }

    return $allowedExtensions -contains $File.Extension.ToLowerInvariant()
}

function Get-ExcelTargets {
    param([string] $InputPath)

    if (-not (Test-Path -LiteralPath $InputPath)) {
        throw "Input path does not exist: $InputPath"
    }

    $item = Get-Item -LiteralPath $InputPath
    if ($item.PSIsContainer) {
        $targets = @(Get-ChildItem -LiteralPath $item.FullName -File |
            Where-Object { Assert-ExcelPath $_ } |
            Sort-Object Name)

        if (-not $targets -or $targets.Count -eq 0) {
            throw "No Excel files found in: $($item.FullName)"
        }

        return @($targets)
    }

    if (-not (Assert-ExcelPath $item)) {
        throw "Input file is not a supported Excel workbook: $($item.FullName)"
    }

    return @($item)
}

function Convert-ToCsvCell {
    param([object] $Value)

    if ($null -eq $Value) {
        return ''
    }

    $text = [string] $Value
    $text = $text -replace "`r`n", ' '
    $text = $text -replace "`r", ' '
    $text = $text -replace "`n", ' '

    if ($text.Contains('"')) {
        $text = $text.Replace('"', '""')
    }

    if ($text.Contains(',') -or $text.Contains('"')) {
        return '"' + $text + '"'
    }

    return $text
}

function Get-SafeSheetToken {
    param([string] $Name)

    $safe = ($Name -replace '[\\/:*?"<>|]', '_').Trim()
    if (-not $safe) {
        return 'sheet'
    }

    return $safe
}

function Get-OutputPath {
    param(
        [System.IO.FileInfo] $File,
        [object] $Worksheet,
        [bool] $UseSheetName
    )

    $sheetToken = ''
    if ($UseSheetName) {
        $sheetToken = '_' + (Get-SafeSheetToken ([string] $Worksheet.Name))
    }

    return Join-Path $File.DirectoryName ($File.BaseName + $sheetToken + $OutputSuffix + '.csv')
}

function Get-WorksheetList {
    param([object] $Workbook)

    if ($AllSheets) {
        $list = New-Object System.Collections.ArrayList
        for ($i = 1; $i -le $Workbook.Worksheets.Count; $i += 1) {
            [void] $list.Add($Workbook.Worksheets.Item($i))
        }
        return @($list)
    }

    if ($SheetName.Trim()) {
        return @($Workbook.Worksheets.Item($SheetName))
    }

    if ($SheetIndex -lt 1 -or $SheetIndex -gt $Workbook.Worksheets.Count) {
        throw "SheetIndex $SheetIndex is outside workbook sheet count $($Workbook.Worksheets.Count)."
    }

    return @($Workbook.Worksheets.Item($SheetIndex))
}

function Export-WorksheetToCsv {
    param(
        [System.IO.FileInfo] $File,
        [object] $Worksheet,
        [bool] $UseSheetName
    )

    $usedRange = $Worksheet.UsedRange
    $startRow = [int] $usedRange.Row
    $startCol = [int] $usedRange.Column
    $rowCount = [int] $usedRange.Rows.Count
    $colCount = [int] $usedRange.Columns.Count
    $endRow = $startRow + $rowCount - 1
    $endCol = $startCol + $colCount - 1
    $outputPath = Get-OutputPath -File $File -Worksheet $Worksheet -UseSheetName $UseSheetName
    $encoding = New-Object System.Text.UTF8Encoding($true)
    $writer = New-Object System.IO.StreamWriter($outputPath, $false, $encoding)
    $writtenRows = 0

    try {
        for ($row = $startRow; $row -le $endRow; $row += 1) {
            $cells = New-Object System.Collections.ArrayList
            $hasValue = $false

            for ($col = $startCol; $col -le $endCol; $col += 1) {
                $cellText = [string] $Worksheet.Cells.Item($row, $col).Text
                if ($cellText.Trim()) {
                    $hasValue = $true
                }
                [void] $cells.Add((Convert-ToCsvCell $cellText))
            }

            if ($hasValue) {
                $writer.WriteLine(($cells -join ','))
                $writtenRows += 1
            }
        }
    } finally {
        $writer.Close()
    }

    if ($writtenRows -eq 0) {
        throw "Worksheet '$($Worksheet.Name)' has no data."
    }

    [pscustomobject] @{
        Source = $File.FullName
        Sheet = [string] $Worksheet.Name
        Output = $outputPath
        Rows = $writtenRows
        Columns = $colCount
    }
}

$targets = Get-ExcelTargets $Path
$excel = $null
$results = New-Object System.Collections.ArrayList

try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false

    foreach ($file in $targets) {
        $workbook = $null
        try {
            $workbook = $excel.Workbooks.Open($file.FullName, 0, $true)
            $worksheets = Get-WorksheetList $workbook
            $useSheetName = [bool] ($AllSheets -or $SheetName.Trim())

            foreach ($worksheet in $worksheets) {
                [void] $results.Add((Export-WorksheetToCsv -File $file -Worksheet $worksheet -UseSheetName $useSheetName))
            }
        } finally {
            if ($workbook) {
                $workbook.Close($false)
                [void] [System.Runtime.InteropServices.Marshal]::ReleaseComObject($workbook)
            }
        }
    }
} finally {
    if ($excel) {
        $excel.Quit()
        [void] [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel)
    }
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}

$results | Format-Table Source, Sheet, Output, Rows, Columns -AutoSize
