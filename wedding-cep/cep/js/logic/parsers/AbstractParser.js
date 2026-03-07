/**
 * AbstractParser.js
 * Interface chung cho mọi Parser trong Pipeline SchemaInjector
 */
export class AbstractParser {
    /**
     * @param {Object} context
     * @param {string} context.originalText
     * @param {string} context.targetType 'tiec', 'le', 'nhap'
     * @param {string} context.hostSide 'nha_trai', 'nha_gai', ''
     * @param {Array<number[]>} context.consumedRanges [[start, end]]
     * @returns {Array<Object>} [{ start, end, val }] Mảng các điểm thay thế
     */
    // eslint-disable-next-line no-unused-vars
    parse(context) {
        throw new Error('Parser must implement parse() method');
    }

    /**
     * Hàm tiện ích (Helper) để check xem khoảng [s, e] đã bị Parser trước đó lấy mất chưa.
     */
    isConsumed(s, e, consumedRanges) {
        return consumedRanges.some(([cs, ce]) => s < ce && e > cs);
    }
}
