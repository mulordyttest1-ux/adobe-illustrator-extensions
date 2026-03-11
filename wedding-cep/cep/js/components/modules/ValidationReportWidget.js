export class ValidationReportWidget {
    static show(report, bridge) {
        // Build UI container
        const id = 'postflight-report-widget';
        let container = document.getElementById(id);
        if (!container) {
            container = document.createElement('div');
            container.id = id;
            container.className = 'postflight-widget fade-in';
            document.body.appendChild(container);

            this._injectCSS();
        }

        const { errors = [], warnings = [] } = report;
        const total = errors.length + warnings.length;

        if (total === 0) {
            // Dismiss automatically if all good
            container.innerHTML = `<div class="p-success">✅ Tiêm thành công! Không có rác/lỗi.</div>`;
            setTimeout(() => this.close(), 3000);
            return;
        }

        let html = `
            <div class="p-header">
                <h3>⚠️ Báo Cáo Hậu Kiểm</h3>
                <button id="p-close-btn" class="p-btn-close">✖</button>
            </div>
            <div class="p-body">
                <p>Phát hiện <b>${total}</b> vấn đề trên Layout:</p>
                <ul class="p-list">
        `;

        [...errors, ...warnings].forEach(item => {
            const icon = item.type === 'error' ? '🔴' : '🟡';
            const actionText = item.id ? `<button class="p-btn-action" data-id="${item.id}">Sửa</button>` : '';
            html += `
                <li>
                    <span>${icon} ${item.message}</span>
                    ${actionText}
                </li>
            `;
        });

        html += `
                </ul>
            </div>
        `;

        container.innerHTML = html;

        // Bind events
        const btnClose = document.getElementById('p-close-btn');
        if (btnClose) {
            btnClose.addEventListener('click', () => this.close());
        }

        const actionBtns = container.querySelectorAll('.p-btn-action');
        actionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const frameId = e.target.getAttribute('data-id');
                if (frameId && bridge) {
                    bridge.selectFramesById([frameId]);
                }
            });
        });
    }

    static close() {
        const container = document.getElementById('postflight-report-widget');
        if (container) {
            container.remove();
        }
    }

    static _injectCSS() {
        if (document.getElementById('postflight-css')) return;
        const style = document.createElement('style');
        style.id = 'postflight-css';
        style.innerHTML = `
            .postflight-widget {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 350px;
                background: var(--bg, #252526);
                border: 1px solid var(--border-light, #454545);
                border-radius: 6px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.5);
                z-index: 9999;
                font-family: var(--font-stack, Arial, sans-serif);
                color: var(--text, #fff);
                display: flex;
                flex-direction: column;
            }
            .postflight-widget .p-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 15px;
                border-bottom: 1px solid var(--border-light, #454545);
                background: rgba(255, 255, 255, 0.05);
            }
            .postflight-widget .p-header h3 {
                margin: 0;
                font-size: 14px;
                font-weight: 600;
            }
            .postflight-widget .p-btn-close {
                background: none; border: none; color: #aaa; cursor: pointer;
            }
            .postflight-widget .p-btn-close:hover { color: #fff; }
            .postflight-widget .p-body {
                padding: 15px;
                max-height: 250px;
                overflow-y: auto;
            }
            .postflight-widget .p-body p { margin-top: 0; font-size: 13px; color: #ccc;}
            .postflight-widget .p-list {
                list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px;
            }
            .postflight-widget .p-list li {
                font-size: 12px;
                padding: 8px;
                background: rgba(0,0,0,0.2);
                border-radius: 4px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 5px;
            }
            .postflight-widget .p-btn-action {
                background: var(--accent, #0078d4);
                color: white; border: none; border-radius: 3px; padding: 3px 8px; cursor: pointer; font-size: 11px;
            }
            .postflight-widget .p-btn-action:hover { background: var(--accent-hover, #106ebe); }
            .postflight-widget .p-success {
                padding: 15px; font-size: 13px; color: #4CAF50; text-align: center;
            }
            .fade-in { animation: fadeIn 0.3s ease-out; }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        `;
        document.head.appendChild(style);
    }
}
