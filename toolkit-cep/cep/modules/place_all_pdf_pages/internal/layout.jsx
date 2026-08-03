if (!$.global.__TOOLKIT_PLACE_ALL_PDF_PAGES__) {
    throw new Error("Place All Pages namespace was not initialized.");
}

var PlaceAllPdfPages = $.global.__TOOLKIT_PLACE_ALL_PDF_PAGES__;

PlaceAllPdfPages.getExistingArtboardUnion = function (doc) {
    var union = null;
    var index;
    var rect;

    for (index = 0; index < doc.artboards.length; index += 1) {
        rect = doc.artboards[index].artboardRect;
        if (!union) {
            union = [rect[0], rect[1], rect[2], rect[3]];
        } else {
            union[0] = Math.min(union[0], rect[0]);
            union[1] = Math.max(union[1], rect[1]);
            union[2] = Math.max(union[2], rect[2]);
            union[3] = Math.min(union[3], rect[3]);
        }
    }

    return union || [0, 0, 0, 0];
};

PlaceAllPdfPages.getColumnCount = function (pageCount) {
    return Math.max(1, Math.ceil(Math.sqrt(pageCount)));
};

PlaceAllPdfPages.buildPlacements = function (doc, pages) {
    var existingUnion = PlaceAllPdfPages.getExistingArtboardUnion(doc);
    var columnCount = PlaceAllPdfPages.getColumnCount(pages.length);
    var rowCount = Math.ceil(pages.length / columnCount);
    var columnWidths = [];
    var rowHeights = [];
    var placements = [];
    var index;
    var row;
    var column;
    var left;
    var top;
    var rowTop;
    var rowHeight;
    var columnWidth;
    var page;

    for (index = 0; index < columnCount; index += 1) {
        columnWidths[index] = 0;
    }
    for (index = 0; index < rowCount; index += 1) {
        rowHeights[index] = 0;
    }

    for (index = 0; index < pages.length; index += 1) {
        page = pages[index];
        row = Math.floor(index / columnCount);
        column = index % columnCount;
        columnWidths[column] = Math.max(columnWidths[column], page.widthPt);
        rowHeights[row] = Math.max(rowHeights[row], page.heightPt);
    }

    rowTop = existingUnion[3] - PlaceAllPdfPages.artboardGap;
    for (row = 0; row < rowCount; row += 1) {
        left = existingUnion[0];
        rowHeight = rowHeights[row];
        top = rowTop;

        for (column = 0; column < columnCount; column += 1) {
            index = row * columnCount + column;
            if (index >= pages.length) {
                break;
            }

            page = pages[index];
            columnWidth = columnWidths[column];
            placements.push({
                page: page,
                rect: [
                    left,
                    top,
                    left + page.widthPt,
                    top - page.heightPt
                ],
                contentRect: [
                    left,
                    top,
                    left + page.widthPt,
                    top - page.heightPt
                ]
            });

            left += columnWidth + PlaceAllPdfPages.artboardGap;
        }

        rowTop -= rowHeight + PlaceAllPdfPages.artboardGap;
    }

    return {
        placements: placements,
        existingUnion: existingUnion,
        columnCount: columnCount,
        rowCount: rowCount
    };
};
