# Generate-Context.ps1
# Script gộp TOÀN BỘ mã nguồn dự án CEP-First thành 1 file text để gửi cho AI Agent
# Mục tiêu: Đảm bảo AI nắm bắt 100% cấu trúc mới sau khi xóa folder src/

$OutputFile = "FULL_PROJECT_CONTEXT.txt"
$RootPath = $PSScriptRoot

# 1. Các loại file quan trọng cần lấy nội dung
$Extensions = @(".js", ".jsx", ".html", ".css", ".xml", ".json", ".md", ".txt", ".csv")

# 2. Các thư mục và file BẮT BUỘC BỎ QUA (Để tránh file quá nặng hoặc lặp dữ liệu)
$ExcludePatterns = @(

    $OutputFile      # Tránh tự quét chính nó
)

# Xóa file cũ để làm mới hoàn toàn
if (Test-Path $OutputFile) { Remove-Item $OutputFile -Force }

$Global:FileCount = 0

Function Add-FileContent {
    param ($FilePath)
    
    # Lấy đường dẫn tương đối để AI biết file nằm ở đâu
    $RelativePath = $FilePath.Substring($RootPath.Length)
    
    # Header phân cách cực kỳ rõ ràng cho AI
    $Header = "`n" + ("=" * 80) + "`n" +
              "FILE: $RelativePath`n" +
              "SIZE: $((Get-Item $FilePath).Length) bytes`n" +
              ("=" * 80) + "`n"

    Add-Content -Path $OutputFile -Value $Header -Encoding UTF8
    
    # Đọc nội dung file
    try {
        # Sử dụng -Raw để giữ nguyên định dạng xuống dòng của file gốc
        $Content = Get-Content $FilePath -Raw -Encoding UTF8
        Add-Content -Path $OutputFile -Value $Content -Encoding UTF8
        $Global:FileCount++
        Write-Host "✅ Đã thêm: $RelativePath" -ForegroundColor Cyan
    } catch {
        Write-Host "❌ Lỗi đọc file: $RelativePath" -ForegroundColor Red
    }
}

Write-Host "🚀 ĐANG QUÉT TOÀN BỘ DỰ ÁN (CEP-FIRST MODE)..." -ForegroundColor Green

# 3. Quét đệ quy từ thư mục gốc
Get-ChildItem -Path $RootPath -Recurse -File | ForEach-Object {
    $File = $_
    $Ext = $File.Extension.ToLower()
    $FullPath = $File.FullName
    
    # Kiểm tra phần mở rộng file có nằm trong danh sách cho phép không
    if ($Extensions -contains $Ext) {
        
        # Kiểm tra xem file có nằm trong danh sách bị loại trừ không
        $ShouldExclude = $false
        foreach ($pattern in $ExcludePatterns) {
            if ($FullPath -match [regex]::Escape($pattern)) {
                $ShouldExclude = $true
                break
            }
        }
        
        if (-not $ShouldExclude) {
            Add-FileContent $FullPath
        }
    }
}

Write-Host "`n" + ("-" * 30)
Write-Host "📊 TỔNG KẾT SNAPSHOT:" -ForegroundColor Green
Write-Host " - Tổng số file đã đóng gói: $Global:FileCount"
Write-Host " - File kết quả: $OutputFile"
Write-Host " - Vị trí: $RootPath"
Write-Host "`n👉 HÀNH ĐỘNG TIẾP THEO: Hãy gửi file $OutputFile này cho AI Agent." -ForegroundColor Yellow