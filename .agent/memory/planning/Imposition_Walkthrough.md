# Walkthrough: Module Bình Trang (Imposition) - Tab 2

> **Completed:** 2026-01-16
> **Status:** ✅ All Phases Complete & Wired

## 1. Tổng quan Thành phẩm

Module Bình Bài (Imposition) đã được xây dựng hoàn chỉnh với 3 Phases:

| Phase | Mô tả | Files |
|-------|-------|-------|
| **1** | Pre-flight & Symbol Core | 3 Domain + 3 Adapters + 2 UseCases |
| **2** | Layout Engine & Calculator | 6 Domain + 2 Adapters |
| **3** | UI Integration | Controller + Pipeline Orchestrator |

## 2. Cấu trúc Module

```
src/Modules/Imposition/
├── Domain/
│   ├── ColorProcessor.js      # Convert màu 100K
│   ├── ImageProcessor.js      # Rasterize detection
│   ├── SymbolFactory.js       # SmartBounds calculation
│   ├── YieldCalculator.js     # 2-way yield calculation
│   ├── MarginCalculator.js    # 5-layer margin system
│   ├── ContentScaler.js       # Proportional/Stretch scaling
│   ├── LayoutGenerator.js     # H2H, StepRepeat, Rotate90
│   ├── SmartMarkDrawer.js     # Asymmetric crop marks
│   └── ConfigRepository.js    # Preset schema
├── Adapters/
│   ├── AIColorAdapter.js      # Color conversion in AI
│   ├── AISymbolAdapter.js     # Symbol creation
│   ├── AIRasterAdapter.js     # Rasterize items
│   ├── AILayoutAdapter.js     # Artboard & Symbol placement
│   └── AIMarkAdapter.js       # Draw marks
├── UseCases/
│   ├── PreflightUseCase.js    # Orchestrate Pre-flight
│   └── CreateSymbolUseCase.js # Symbol L1→L2
└── index.jsx                  # Module entry + runFullPipeline()
```

## 3. Tính năng Chính

- ✅ **Pre-flight First**: Xử lý màu 100K + Rasterize ngay đầu tiên
- ✅ **Symbol lồng 3 cấp**: L1 (Content) → L2 (Container+SmartBounds) → L3 (Plate)
- ✅ **2 chế độ tính toán**: Fit to Grid / Fit to Product
- ✅ **Hệ thống 5 lớp lề**: Binding, Perf (+2mm), Handwriting, Padding, Bleed
- ✅ **3 biến thể Layout**: Step&Repeat, Head-to-Head, Rotated 90°
- ✅ **Smart Marks**: Đối xứng lệch (Left=Solid, Right=Dot)
- ✅ **Cleanup**: Tự động xóa Artboard gốc

## 4. Cách Sử dụng

1. Mở file trong Illustrator
2. Chọn đối tượng cần bình bài
3. Chạy `Run_App.js`
4. Chuyển sang Tab "**Bình Bài**"
5. Nhập thông số (Plate size, Grid, Margins...)
6. Nhấn "**▶ BẮT ĐẦU BÌNH BÀI**"

## 5. Files Đã Thay đổi

- [Config.js](file:///i:/My%20Drive/script%20ho%20tro%20adobe%20illustrator/Config.js) - Thêm module "imposition"
- [Run_App.js](file:///i:/My%20Drive/script%20ho%20tro%20adobe%20illustrator/Run_App.js) - Load module & register controller
- [ImpositionController.js](file:///i:/My%20Drive/script%20ho%20tro%20adobe%20illustrator/src/Infrastructure/UI/ImpositionController.js) - UI Tab 2
