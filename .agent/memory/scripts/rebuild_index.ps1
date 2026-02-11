<# 
.SYNOPSIS
    Compiles 'QUICK_REFERENCE.md' from 'SKILL.md' files (Active Sync)
.DESCRIPTION
    Permissive State Machine Version - Ignores Emojis/BOMs
#>

$ErrorActionPreference = "Stop"
$ScriptDir = $PSScriptRoot
$MemoryRoot = Join-Path $ScriptDir ".."
$SkillsDir = Join-Path $MemoryRoot "skills"
$QuickRefPath = Join-Path $MemoryRoot "QUICK_REFERENCE.md"

Write-Host "🤖 STARTING AUTO-COMPILER (Resilient Mode)..." -ForegroundColor Cyan

# --- 1. Header Template ---
$header = @"
# 🚀 QUICK REFERENCE (Auto-Compiled)

> **Mục đích:** Context nhanh cho Agent (~2K tokens).
> **Source:** Được compile tự động từ các file `SKILL.md`. KHÔNG sửa file này thủ công.
> **Last Build:** $(Get-Date -Format "yyyy-MM-dd HH:mm")

---

## 📍 PROJECT OVERVIEW
| Key | Value |
|-----|-------|
| **Project** | Wedding Scripter |
| **Stack** | ES3 (Host) + ES6+ (CEP) |
| **Architecture** | Hexagonal |

---

## 🔥 EXTRACTED SKILLS (TL;DR)
"@

$contentList = @($header)
$processedCount = 0

# --- 2. Scan & Extract ---
Get-ChildItem -Path $SkillsDir -Directory | ForEach-Object {
    $dirName = $_.Name
    $skillFile = Join-Path $_.FullName "SKILL.md"

    if (Test-Path $skillFile) {
        # Force Read as Single String then Split to handle Line Endings better
        $allText = [System.IO.File]::ReadAllText($skillFile, [System.Text.Encoding]::UTF8)
        $lines = $allText -split "\r?\n"
        
        $isCapturing = $false
        $buffer = @()
        $foundSection = $false

        foreach ($line in $lines) {
            $trimLine = $line.Trim()

            # Start Condition: Contains "##" AND "TL;DR" (Ignore emoji)
            if ($trimLine -match "##.*TL;DR") {
                $isCapturing = $true
                $foundSection = $true
                continue
            }

            # Stop Condition: Next Section (--- or ##)
            if ($isCapturing -and ($trimLine -match "^---" -or $trimLine -match "^##\s+")) {
                $isCapturing = $false
                break
            }

            # Capture Logic
            if ($isCapturing) {
                if ($buffer.Count -eq 0 -and [string]::IsNullOrWhiteSpace($trimLine)) { continue }
                $buffer += $line # Keep original formatting
            }
        }

        if ($foundSection -and $buffer.Count -gt 0) {
            $tldrBody = $buffer -join "`n"
            $section = "### [$dirName](skills/$dirName/SKILL.md)`n$tldrBody`n"
            $contentList += $section
            $processedCount++
            Write-Host "   [+] Added: $dirName" -ForegroundColor Green
        }
        else {
            Write-Host "   [-] Skipped: $dirName (No TL;DR found)" -ForegroundColor DarkGray
        }
    }
}

# --- 3. Footer ---
$footer = @"
---

## 🔄 WORKFLOWS
| Workflow | Link |
|----------|------|
"@

# Scan Workflows
$WorkflowsDir = Join-Path $MemoryRoot "workflows"
Get-ChildItem -Path $WorkflowsDir -Filter "*.md" | ForEach-Object {
    # Relative path fix for workflows
    $row = "| $($_.BaseName) | [View](workflows/$($_.Name)) |"
    $footer += "`n$row"
}

$contentList += $footer

# --- 4. Write Output ---
$finalContent = $contentList -join "`n`n"
# Write using .NET to ensure UTF8 without BOM if preferred, or standard Set-Content
[System.IO.File]::WriteAllText($QuickRefPath, $finalContent, [System.Text.Encoding]::UTF8)

Write-Host ""
Write-Host "✅ COMPILE COMPLETE: $processedCount skills processed." -ForegroundColor Cyan
Write-Host "   Saved to: $QuickRefPath"
