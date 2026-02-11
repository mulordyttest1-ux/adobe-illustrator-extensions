/**
 * Example: Name Processor - Parse và Split Tên
 * 
 * PURPOSE:
 * Xử lý tên người trong thiệp cưới: parse fullname thành components (họ, tên đệm, tên)
 * 
 * WHEN TO USE:
 * - Khi cần split tên người từ input "Nguyễn Văn A" → họ="Nguyễn", lot="Văn", ten="A"
 * - Khi cần extract initials (chữ cái đầu tên)
 * - Khi process tên cho Wedding data packet
 * 
 * HEXAGONAL LAYER: Domain (Pure business logic)
 * DEPENDENCIES: None
 * 
 * @example
 * var processor = NameProcessor();
 * var result = processor.parse("Nguyễn Văn An", 0);
 * // → { ten: "An", lot: "Văn", ho_dau: "Nguyễn", dau: "A" }
 */

function NameProcessor() {
    /**
     * Parse một tên đầy đủ thành components
     * 
     * @param {string} fullName - Tên đầy đủ (e.g. "Nguyễn Văn An")
     * @param {number} idx - Index: 0 = lấy từ cuối, 1-5 = lấy từ vị trí chỉ định
     * @returns {object} {ten, lot, ho_dau, dau}
     * 
     * LOGIC:
     * - idx = 0: Lấy từ CUỐI cùng làm "tên"
     * - idx > 0: Lấy từ thứ idx-1 làm "tên"
     * - "lot" = từ TRƯỚC tên
     * - "ho_dau" = từ ĐẦU TIÊN
     * - "dau" = chữ cái đầu của tên
     */
    function parse(fullName, idx) {
        var result = { ten: "", lot: "", ho_dau: "", dau: "" };

        // Validate input
        if (!fullName || fullName === "") return result;

        // Parse index
        var pIdx = parseInt(idx);
        if (isNaN(pIdx)) pIdx = 0;

        // Split by whitespace
        var words = fullName.split(/\s+/);
        if (words.length === 0) return result;

        // Calculate pointer position
        var pointer = 0;
        if (pIdx === 0) {
            // idx=0 means LAST word
            pointer = words.length - 1;
        } else {
            // idx>0 means position idx-1
            pointer = pIdx - 1;
        }

        // Clamp pointer to valid range
        if (pointer < 0) pointer = 0;
        if (pointer >= words.length) pointer = words.length - 1;

        // Extract components
        result.ten = words[pointer] || "";
        result.lot = (pointer > 0) ? words[pointer - 1] : "";
        result.ho_dau = words[0] || "";
        result.dau = result.ten ? result.ten.charAt(0).toUpperCase() : "";

        return result;
    }

    /**
     * Process tên hàng loạt trong packet
     * Tìm các key có pattern "*_split_idx" và split corresponding name
     * 
     * @param {object} packet - Data packet with names
     * @returns {object} Enriched packet với .ten, .lot, .ho_dau, .dau fields
     * 
     * EXAMPLE packet input:
     * {
     *   "pos1.ong": "Nguyễn Văn A",
     *   "pos1.ong_split_idx": "0"
     * }
     * 
     * EXAMPLE packet output (adds):
     * {
     *   "pos1.ong.ten": "A",
     *   "pos1.ong.lot": "Văn",
     *   "pos1.ong.ho_dau": "Nguyễn",
     *   "pos1.ong.dau": "A"
     * }
     */
    function enrichSplitNames(packet) {
        // Find all keys ending with "_split_idx"
        var keysToSplit = [];
        for (var key in packet) {
            if (Object.prototype.hasOwnProperty.call(packet, key)) {
                if (key.indexOf("_split_idx") !== -1) {
                    keysToSplit.push(key);
                }
            }
        }

        // Process each split key
        for (var i = 0; i < keysToSplit.length; i++) {
            try {
                var idxKey = keysToSplit[i];
                var baseKey = idxKey.replace("_split_idx", "");

                if (packet.hasOwnProperty(baseKey)) {
                    var fullName = packet[baseKey];
                    var idx = packet[idxKey];
                    var nameParts = parse(fullName, idx);

                    // Add components to packet
                    packet[baseKey + ".ten"] = nameParts.ten;
                    packet[baseKey + ".lot"] = nameParts.lot;
                    packet[baseKey + ".ho_dau"] = nameParts.ho_dau;
                    packet[baseKey + ".dau"] = nameParts.dau;
                }
            } catch (e) {
                // Skip errors silently
            }
        }

        return packet;
    }

    // Public API
    return {
        parse: parse,
        enrichSplitNames: enrichSplitNames
    };
}

// === USAGE EXAMPLES (Remove khi copy vào production) === //
/*
$.writeln("=== Example 1: Parse simple name ===");
var proc = NameProcessor();
var result1 = proc.parse("Nguyễn Văn An", 0);
$.writeln("Input: Nguyễn Văn An, idx=0");
$.writeln("Output: " + result1.ten + " | " + result1.lot + " | " + result1.ho_dau);
// → "An | Văn | Nguyễn"

$.writeln("\n=== Example 2: Parse with specific index ===");
var result2 = proc.parse("Nguyễn Văn Minh An", 2);
$.writeln("Input: Nguyễn Văn Minh An, idx=2");
$.writeln("Output: " + result2.ten + " | " + result2.lot + " | " + result2.ho_dau);
// → "Văn | Nguyễn | Nguyễn" (index 2 = word at position 1)

$.writeln("\n=== Example 3: Enrich packet ===");
var packet = {
    "pos1.ong": "Trần Văn Bình",
    "pos1.ong_split_idx": "0",
    "pos1.ba": "Nguyễn Thị Hoa",
    "pos1.ba_split_idx": "0"
};
var enriched = proc.enrichSplitNames(packet);
$.writeln("pos1.ong.ten = " + enriched["pos1.ong.ten"]); // "Bình"
$.writeln("pos1.ba.ten = " + enriched["pos1.ba.ten"]);   // "Hoa"
*/
