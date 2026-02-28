const { E2ERunner } = require('../../shared/testing/E2ERunner.cjs');

// Mặc định CEP Panel Symbol chạy ở cổng 9098
const runner = new E2ERunner({ port: 9098, projectName: 'Symbol CEP' });

// --- TEST 1: Khởi động --- 
runner.addTest(
    'Kiểm tra UI Command Palette đã render đúng',
    `
        (function() {
            const input = document.getElementById('action-search');
            const list = document.getElementById('action-list');
            return input !== null && list !== null;
        })()
    `,
    async (result) => {
        if (!result) throw new Error(`UI failed to load (Command Palette not found)`);
    }
);

// --- TEST 2: Fuzzy Search ---
runner.addTest(
    'Kiểm tra Fuzzy Search lọc đúng kết quả',
    `
        (function() {
            return new Promise((resolve) => {
                const input = document.getElementById('action-search');
                // Simulate typing 'a4'
                input.value = 'a4';
                input.dispatchEvent(new Event('input', { bubbles: true }));
                
                setTimeout(() => {
                    const items = document.querySelectorAll('.dropdown-item');
                    // We should have some results, and they should contain 'a4' or 'A4' (or fuzzy match it)
                    resolve(items.length > 0);
                }, 100);
            });
        })()
    `,
    async (result) => {
        if (!result) throw new Error(`Fuzzy search failed to filter items`);
    }
);

// --- TEST 3: Keyboard Navigation & Enter ---
runner.addTest(
    'Kiểm tra Keyboard Navigation (Arrow keys)',
    `
        (function() {
            return new Promise((resolve) => {
                const input = document.getElementById('action-search');
                
                // Clear input to get full list
                input.value = '';
                input.dispatchEvent(new Event('input', { bubbles: true }));
                
                setTimeout(() => {
                    // Simulate ArrowDown
                    const eDown = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
                    input.dispatchEvent(eDown);
                    
                    setTimeout(() => {
                        const items = document.querySelectorAll('.dropdown-item');
                        if (items.length < 2) return resolve(false);
                        
                        // Check if second item has the selected background style or '▶' prefix
                        const secondItemText = items[1].textContent;
                        resolve(secondItemText.includes('▶'));
                    }, 50);
                }, 50);
            });
        })()
    `,
    async (result) => {
        if (!result) throw new Error(`Keyboard navigation (ArrowDown) did not highlight the next item`);
    }
);

runner.run();
