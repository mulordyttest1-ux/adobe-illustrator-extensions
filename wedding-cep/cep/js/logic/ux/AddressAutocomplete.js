/* global Fuse */
/**
 * AddressAutocomplete.js - Fuzzy search cho địa chỉ Việt Nam
 * 
 * Sử dụng Fuse.js để tìm kiếm địa chỉ theo alias hoặc tên đầy đủ.
 * 
 * Usage:
 *   await AddressAutocomplete.init();
 *   const match = AddressAutocomplete.search('ekdl');
 *   const formatted = AddressAutocomplete.format(match, true); // suffix mode
 */
export class AddressAutocomplete {
    /**
     * Khởi tạo Fuse.js với dữ liệu địa chỉ
     * @returns {Promise<void>}
     */
    static async init() {
        if (this.isReady) return;

        try {
            // 1. Get extension path and normalize it
            const cs = new CSInterface();
            let extPath = cs.getSystemPath(CSInterface.EXTENSION);

            // Normalize: remove file:// prefix
            if (extPath.startsWith('file:///')) {
                extPath = extPath.substring(8);
            } else if (extPath.startsWith('file://')) {
                extPath = extPath.substring(7);
            }
            // Windows: /C:/ -> C:/
            if (/^\/[a-zA-Z]:/.test(extPath)) {
                extPath = extPath.substring(1);
            }

            const dataPath = extPath + '/data/vn_address_custom.json';


            // 2. Load using CEP FS API (most reliable in CEP)
            const result = window.cep.fs.readFile(dataPath);
            if (result.err !== 0) {
                throw new Error(`CEP FS Error ${result.err} at: ${dataPath}`);
            }
            this.data = JSON.parse(result.data);

            // 3. Initialize Fuse
            this.fuse = new Fuse(this.data, {
                keys: [
                    { name: 'a', weight: 0.5 },  // Alias
                    { name: 's', weight: 0.3 },  // Search string
                    { name: 'c', weight: 0.2 }   // Full name
                ],
                threshold: 0.4,
                distance: 100,
                includeScore: true,
                minMatchCharLength: 2,
                ignoreLocation: true
            });

            this.isReady = true;

        } catch {

        }
    }

    /**
     * Tìm kiếm địa chỉ (Updated for Dropdown)
     * @param {string} query - Từ khóa
     * @returns {Array} - Danh sách kết quả (Top 5)
     */
    static search(query) {
        if (!this.fuse || !query) return [];

        const normalizedQuery = query.toLowerCase().trim();
        // Tìm kiếm
        const results = this.fuse.search(normalizedQuery);

        // Lấy top 5 kết quả tốt nhất
        return results.slice(0, 15).map(r => r.item);
    }

    /**
     * Format kết quả theo mode
     * @param {Object} match - Kết quả từ search()
     * @param {boolean} useSuffix - true = dấu phẩy, false = gạch ngang
     * @returns {string|null}
     */
    static format(match, useSuffix = false) {
        if (!match) return null;

        return useSuffix
            ? `${match.c}, ${match.p}`    // "Phường Tân Lập, Tỉnh Đắk Lắk"
            : `${match.c} - ${match.p}`;  // "Phường Tân Lập - Tỉnh Đắk Lắk"
    }
}

// Static properties initialization
AddressAutocomplete.fuse = null;
AddressAutocomplete.data = [];
AddressAutocomplete.isReady = false;

