/**
 * Example: ES3 Array Helpers
 * 
 * PURPOSE:
 * Implement map/filter/reduce cho ExtendScript ES3 (không có native support)
 * 
 * WHEN TO USE:
 * - Khi cần map/filter/reduce trong .jsx files
 * - Khi làm việc với arrays trong ExtendScript
 * 
 * HEXAGONAL LAYER: Utilities (cross-cutting)
 * DEPENDENCIES: None
 * 
 * @example
 * var arr = [1, 2, 3, 4, 5];
 * var doubled = ArrayHelpers.map(arr, function(x) { return x * 2; });
 * // → [2, 4, 6, 8, 10]
 */

var ArrayHelpers = (function () {

    /**
     * Map - Transform each element
     * @param {Array} arr - Source array
     * @param {Function} fn - Transform function (element, index) => newElement
     * @returns {Array} New array with transformed elements
     */
    function map(arr, fn) {
        var result = [];
        for (var i = 0; i < arr.length; i++) {
            result.push(fn(arr[i], i));
        }
        return result;
    }

    /**
     * Filter - Keep elements matching condition
     * @param {Array} arr - Source array
     * @param {Function} fn - Predicate function (element, index) => boolean
     * @returns {Array} New array with filtered elements
     */
    function filter(arr, fn) {
        var result = [];
        for (var i = 0; i < arr.length; i++) {
            if (fn(arr[i], i)) {
                result.push(arr[i]);
            }
        }
        return result;
    }

    /**
     * Reduce - Accumulate to single value
     * @param {Array} arr - Source array
     * @param {Function} fn - Reducer function (accumulator, element, index) => newAccumulator
     * @param {*} initialValue - Starting value
     * @returns {*} Final accumulated value
     */
    function reduce(arr, fn, initialValue) {
        var accumulator = initialValue;
        for (var i = 0; i < arr.length; i++) {
            accumulator = fn(accumulator, arr[i], i);
        }
        return accumulator;
    }

    /**
     * Find - Get first element matching condition
     * @param {Array} arr - Source array
     * @param {Function} fn - Predicate function (element, index) => boolean
     * @returns {*} First matching element or null
     */
    function find(arr, fn) {
        for (var i = 0; i < arr.length; i++) {
            if (fn(arr[i], i)) {
                return arr[i];
            }
        }
        return null;
    }

    /**
     * Some - Check if any element matches condition
     * @param {Array} arr - Source array
     * @param {Function} fn - Predicate function (element, index) => boolean
     * @returns {boolean} True if at least one matches
     */
    function some(arr, fn) {
        for (var i = 0; i < arr.length; i++) {
            if (fn(arr[i], i)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Every - Check if all elements match condition
     * @param {Array} arr - Source array
     * @param {Function} fn - Predicate function (element, index) => boolean
     * @returns {boolean} True if all match
     */
    function every(arr, fn) {
        for (var i = 0; i < arr.length; i++) {
            if (!fn(arr[i], i)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Unique - Remove duplicates
     * @param {Array} arr - Source array
     * @returns {Array} Array without duplicates
     */
    function unique(arr) {
        var result = [];
        var seen = {};
        for (var i = 0; i < arr.length; i++) {
            var item = arr[i];
            var key = String(item); // Convert to string for object key
            if (!seen[key]) {
                result.push(item);
                seen[key] = true;
            }
        }
        return result;
    }

    /**
     * Flatten - Flatten nested array one level
     * @param {Array} arr - Array of arrays
     * @returns {Array} Flattened array
     */
    function flatten(arr) {
        var result = [];
        for (var i = 0; i < arr.length; i++) {
            var item = arr[i];
            if (item.constructor === Array) {
                for (var j = 0; j < item.length; j++) {
                    result.push(item[j]);
                }
            } else {
                result.push(item);
            }
        }
        return result;
    }

    // Public API
    return {
        map: map,
        filter: filter,
        reduce: reduce,
        find: find,
        some: some,
        every: every,
        unique: unique,
        flatten: flatten
    };
})();

// === USAGE EXAMPLES (Remove khi copy vào production) === //
/*
$.writeln("=== Example 1: Map ===");
var numbers = [1, 2, 3, 4, 5];
var doubled = ArrayHelpers.map(numbers, function(x) { return x * 2; });
$.writeln(doubled.join(", ")); // "2, 4, 6, 8, 10"

$.writeln("\n=== Example 2: Filter ===");
var evens = ArrayHelpers.filter(numbers, function(x) { return x % 2 === 0; });
$.writeln(evens.join(", ")); // "2, 4"

$.writeln("\n=== Example 3: Reduce ===");
var sum = ArrayHelpers.reduce(numbers, function(acc, x) { return acc + x; }, 0);
$.writeln("Sum: " + sum); // "Sum: 15"

$.writeln("\n=== Example 4: Find ===");
var frames = [
    {name: "pos1.ten", contents: "John"},
    {name: "pos2.ten", contents: "Mary"},
    {name: "date", contents: "2024"}
];
var found = ArrayHelpers.find(frames, function(f) { return f.name === "pos2.ten"; });
$.writeln("Found: " + found.contents); // "Mary"

$.writeln("\n=== Example 5: Unique ===");
var tags = ["red", "blue", "red", "green", "blue"];
var uniqueTags = ArrayHelpers.unique(tags);
$.writeln(uniqueTags.join(", ")); // "red, blue, green"
*/
