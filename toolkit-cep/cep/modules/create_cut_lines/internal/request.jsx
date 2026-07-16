if (!$.global.__TOOLKIT_CUT_LINES__) {
    throw new Error("Cut Lines namespace was not initialized.");
}

var CutLines = $.global.__TOOLKIT_CUT_LINES__;

CutLines.throwError = function (errorCode, message) {
    var error = new Error(message);
    error.code = errorCode;
    throw error;
};

CutLines.normalizeStrategy = function (value) {
    var normalized = CutLines.trimString(value).toLowerCase();

    if (normalized === "1" || normalized === "contour" || normalized === "cutcontour") {
        return "contour";
    }
    if (normalized === "2" || normalized === "sline" || normalized === "s-line" || normalized === "dieline") {
        return "sline";
    }

    CutLines.throwError("CUT_LINES_INVALID_STRATEGY", "Cut Lines strategy must be Contour or S-Line.");
};

CutLines.parseGridInput = function (value) {
    var normalized = CutLines.trimString(value).toLowerCase().replace(/\s+/g, "");
    var parts = normalized.split("x");
    var cols;
    var rows;

    if (parts.length !== 2) {
        CutLines.throwError("CUT_LINES_INVALID_GRID", "Grid must be entered as cols x rows, for example 10x10.");
    }

    cols = parseInt(parts[0], 10);
    rows = parseInt(parts[1], 10);

    if (isNaN(cols) || isNaN(rows) || cols <= 0 || rows <= 0) {
        CutLines.throwError("CUT_LINES_INVALID_GRID", "Grid must contain positive column and row counts.");
    }

    return {
        cols: cols,
        rows: rows
    };
};

CutLines.parseExtendMm = function (value) {
    var parsed = parseFloat(CutLines.trimString(value).replace(",", "."));

    if (isNaN(parsed) || parsed < 0) {
        CutLines.throwError("CUT_LINES_INVALID_EXTEND", "Extend must be a number >= 0.");
    }

    return parsed;
};

CutLines.resolveRequest = function (payload) {
    var response;
    var strategy;
    var gridInput;
    var extendInput;

    if (payload && typeof payload.strategy !== "undefined") {
        strategy = CutLines.normalizeStrategy(payload.strategy);
    } else {
        response = prompt(
            "Cut Lines strategy:\n1 = Contour\n2 = S-Line",
            "1"
        );

        if (response === null) {
            return null;
        }

        strategy = CutLines.normalizeStrategy(response);
    }

    if (strategy === "contour") {
        return {
            strategy: strategy,
            grid: null,
            extendMm: null
        };
    }

    if (payload && typeof payload.gridInput !== "undefined") {
        gridInput = payload.gridInput;
    } else {
        gridInput = prompt("Nhap so cot x so dong (vi du: 10x10)", "10x10");
        if (gridInput === null) {
            return null;
        }
    }

    if (payload && typeof payload.extendMm !== "undefined") {
        extendInput = payload.extendMm;
    } else {
        extendInput = prompt("Extend (mm):", "3");
        if (extendInput === null) {
            return null;
        }
    }

    return {
        strategy: strategy,
        grid: CutLines.parseGridInput(gridInput),
        extendMm: CutLines.parseExtendMm(extendInput)
    };
};
