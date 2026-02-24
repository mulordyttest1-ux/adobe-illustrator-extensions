const { E2ERunner } = require('../../shared/testing/E2ERunner.cjs');

// Mặc định CEP Panel thứ 2 thường chạy ở cổng 9098 hoặc 8098 (tùy file .debug)
// Sửa lại port cho trùng khớp với cấu hình của Sếp.
const runner = new E2ERunner({ port: 9098, projectName: 'Symbol CEP' });

// --- TEST 1: Khởi động --- 
runner.addTest(
    'Kiểm tra UI đã load thành công chưa',
    `
        (function() {
            // Cập nhật đoạn code này dựa theo cấu trúc HTML của symbol-cep
            // Ví dụ: return document.getElementById('app') !== null;
            return true;
        })()
    `,
    async (result) => {
        if (!result) {
            throw new Error(`UI failed to load`);
        }
    }
);

// Thêm các Edge Cases (Kịch bản đoán lỗi) cho Sếp vào đây...

runner.run();
