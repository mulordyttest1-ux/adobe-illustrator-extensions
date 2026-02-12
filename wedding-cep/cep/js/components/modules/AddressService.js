/**
 * AddressService.js
 * Chuyên trách xử lý Autocomplete cho địa chỉ.
 */
import { SchemaUtils } from '../../logic/schema/SchemaUtils.js';
import { AddressAutocomplete } from '../../logic/ux/AddressAutocomplete.js';

export class AddressService {
    /**
     * Bind Address Autocomplete (Dropdown Mode)
     */
    /* eslint-disable max-lines-per-function */
    static bind(input, key, changeCallback, container = null, schema = null) {
        // Validation via Schema (Explicit)
        if (typeof SchemaUtils !== 'undefined') {
            const type = SchemaUtils.getType(key, schema);
            if (type !== 'address') return;
        } else {
            // Fallback (Implicit)
            if (!key.includes('diachi') && !key.includes('address')) return;
        }

        let currentFocus = -1;

        const closeAllLists = (elmnt) => {
            const x = document.getElementsByClassName("autocomplete-list");
            for (let i = 0; i < x.length; i++) {
                if (elmnt !== x[i] && elmnt !== input) {
                    x[i].parentNode.removeChild(x[i]);
                }
            }
        };

        const addActive = (x) => {
            if (!x) return;
            removeActive(x);
            if (currentFocus >= x.length) currentFocus = 0;
            if (currentFocus < 0) currentFocus = (x.length - 1);
            x[currentFocus].classList.add("autocomplete-active");
            x[currentFocus].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        };

        const removeActive = (x) => {
            for (let i = 0; i < x.length; i++) {
                x[i].classList.remove("autocomplete-active");
            }
        };

        const performSearch = (val) => {
            // [FIX 1] Chặn hiển thị nếu người dùng đã Tab sang ô khác
            // Nếu input hiện tại không còn được focus nữa thì hủy tìm kiếm
            if (document.activeElement !== input) {
                closeAllLists();
                return;
            }

            if (!val || typeof AddressAutocomplete === 'undefined' || !AddressAutocomplete.isReady) return;

            const parts = val.split(/[-,\n]/);
            const lastPart = parts[parts.length - 1].trim();

            if (lastPart.length < 2) {
                closeAllLists();
                return;
            }

            const matches = AddressAutocomplete.search(lastPart);
            if (matches.length === 0) {
                closeAllLists();
                return;
            }

            currentFocus = -1; // Reset focus khi có kết quả mới

            // Tạo list container...
            const listContainer = document.createElement("div");
            listContainer.className = "autocomplete-list";

            const rect = input.getBoundingClientRect();
            listContainer.style.cssText = `
                position: fixed; 
                left: ${rect.left}px; 
                top: ${rect.bottom}px; 
                width: ${rect.width}px; 
                z-index: 2147483647; 
                background: #fff; 
                border: 1px solid #ccc; 
                max-height: 300px; 
                overflow-y: auto; 
                box-shadow: 0 4px 10px rgba(0,0,0,0.2);
            `;

            matches.forEach((match) => {
                const itemDiv = document.createElement("div");
                itemDiv.className = "autocomplete-item";

                const fullAddress = AddressAutocomplete.format(match, false);
                const highlightHtml = fullAddress.replace(new RegExp(`(${lastPart})`, 'gi'), "<strong>$1</strong>");
                itemDiv.innerHTML = highlightHtml;

                itemDiv.style.cssText = "padding: 6px 8px; cursor: pointer; border-bottom: 1px solid #f0f0f0; font-size: 11px; color: #333;";

                itemDiv.addEventListener("click", () => {
                    const prefix = val.substring(0, val.lastIndexOf(lastPart)).trim();

                    let separator = "";
                    if (prefix) {
                        if (prefix.endsWith(",") || prefix.endsWith("-")) {
                            separator = " ";
                        } else {
                            separator = " - ";
                        }
                    }

                    const finalString = prefix + separator + fullAddress;

                    input.value = finalString;
                    if (changeCallback) changeCallback(key, finalString);
                    closeAllLists();

                    const oldBg = input.style.backgroundColor;
                    input.style.backgroundColor = "#d1e7dd";
                    setTimeout(() => input.style.backgroundColor = oldBg || '', 300);
                });

                listContainer.appendChild(itemDiv);
            });
            document.body.appendChild(listContainer);
        };

        const debouncedSearch = DomFactory.debounce((val) => performSearch(val), 300);

        input.addEventListener("input", (_e) => {
            // Không đóng list ngay tại đây để tránh nhấp nháy
            // closeAllLists(); 
            debouncedSearch(input.value);
        });

        input.addEventListener("keydown", (e) => {
            const list = document.getElementsByClassName("autocomplete-list");

            // Nếu list chưa hiện thì thôi
            if (!list.length) {
                if (e.key === "Tab") {
                    // Đảm bảo đóng hết nếu có tàn dư
                    closeAllLists();
                }
                return;
            }

            const items = list[0].getElementsByTagName("div");

            if (e.key === "ArrowDown") {
                currentFocus++;
                addActive(items);
            } else if (e.key === "ArrowUp") {
                currentFocus--;
                addActive(items);
            } else if (e.key === "Enter") {
                if (currentFocus > -1 && items) {
                    e.preventDefault();
                    items[currentFocus].click();
                }
            }
            // [FIX 2] Xử lý phím TAB
            else if (e.key === "Tab") {
                if (currentFocus > -1 && items) {
                    // Trường hợp 1: Người dùng đã dùng mũi tên chọn 1 dòng -> Tab sẽ chọn dòng đó (như Enter)
                    e.preventDefault();
                    items[currentFocus].click();
                } else {
                    // Trường hợp 2: Người dùng đang gõ và muốn chuyển ô -> Đóng list NGAY LẬP TỨC
                    closeAllLists();
                    // QUAN TRỌNG: KHÔNG gọi e.preventDefault() để hành vi Tab mặc định (nhảy ô) được diễn ra
                }
            } else if (e.key === "Escape") {
                closeAllLists();
            }
        });
        // [MỚI - SIMPLE FIX] Khi mất focus (Tab đi chỗ khác), đóng list sau 200ms
        // Delay 200ms để nếu người dùng click chuột vào item thì sự kiện click kịp chạy trước khi list biến mất
        input.addEventListener("blur", () => {
            setTimeout(() => {
                closeAllLists();
            }, 200);
        });
        // Đóng list khi click ra ngoài
        document.addEventListener("click", (e) => { if (e.target !== input) closeAllLists(); });

        // Đóng list khi scroll container cha (nếu có)
        if (container) container.addEventListener("scroll", () => closeAllLists(), true);
    }
}

