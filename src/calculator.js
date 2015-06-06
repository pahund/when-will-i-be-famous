"use strict";

var viewportSizeF = require("./getViewportSize"),
    settings = require("./settings"),

    viewportSize = viewportSizeF();

function getColumns() {
    return Math.floor(viewportSize.w / settings.targetThumbnailWidth);
}

function getThumbnailSize() {
    var w = viewportSize.w / getColumns(),
        h = w * settings.thumbnailAspectRatio;

    return {
        w: w,
        h: h
    };
}

function getGridCoords(index) {
    var cols = getColumns(),
        col = index % cols,
        row = Math.floor(index / cols);

    return {
        row: row,
        col: col
    };
}

function getPixelCoords(index) {
    var gridCoords = getGridCoords(index),
        thumbnailSize = getThumbnailSize(),
        x = gridCoords.col * thumbnailSize.w,
        y = gridCoords.row * thumbnailSize.h;

    return {
        x: x,
        y: y
    };
}

module.exports = {
    getColumns: getColumns,
    getThumbnailSize: getThumbnailSize,
    getGridCoords: getGridCoords,
    getPixelCoords: getPixelCoords
};

