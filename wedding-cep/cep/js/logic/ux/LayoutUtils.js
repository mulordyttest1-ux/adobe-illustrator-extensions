/**
 * MODULE: LayoutUtils
 * LAYER: L2 Core Utilities
 * PURPOSE: Pure stateless utilities for spatial calculations and layout sorting.
 * DEPENDENCIES: None
 */

export const LayoutUtils = {
    /**
     * Sorts an array of text frames using a 2D approach:
     * Primary Sort: Top to Bottom (Y-axis descending)
     * Secondary Sort: Left to Right (X-axis ascending)
     * 
     * Handles floating point precision issues by grouping items that are
     * roughly on the same horizontal line.
     * 
     * @param {Array} frames - Array of frame objects containing {top, left}
     * @param {number} yTolerance - Tolerance for considering items on the same line (default 3.0 points to account for human error aligning boxes)
     * @returns {Array} A new sorted array of frames
     */
    sortFrames(frames, yTolerance = 3.0) {
        if (!frames || !Array.isArray(frames)) return [];

        return [...frames].sort((a, b) => {
            const aTop = parseFloat(a.top) || 0;
            const bTop = parseFloat(b.top) || 0;

            // If they are roughly on the same vertical line (Y-axis)
            if (Math.abs(aTop - bTop) <= yTolerance) {
                const aLeft = parseFloat(a.left) || 0;
                const bLeft = parseFloat(b.left) || 0;
                // Secondary sort: Left to right
                return aLeft - bLeft;
            }

            // Primary sort: Top to bottom (in Illustrator, higher top value means physically higher on canvas)
            // So we want descending order to process from top of the page down
            return bTop - aTop;
        });
    }
};
