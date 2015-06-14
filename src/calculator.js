import getViewportSize from "./getViewportSize";
import settings from "./settings";

function getColumns() {
    return Math.floor(getViewportSize().w / settings.targetThumbnailWidth);
}

function getRows() {
    return Math.ceil(settings.numberOfThumbnails / getColumns());
}

function getThumbnailSize() {
    const w = getViewportSize().w / getColumns(),
        h = w * settings.thumbnailAspectRatio;
    return { w, h };
}

function getGallerySize() {
    const thumbnailSize = getThumbnailSize(),
        w = getColumns() * thumbnailSize.w,
        h = getRows() * thumbnailSize.h;
    return { w, h };
}

function getGridCoords(index) {
    const cols = getColumns(),
        col = index % cols,
        row = Math.floor(index / cols);

    return { row, col };
}

function getRow(index) {
    const { row } = getGridCoords(index);
    return row;
}

function getColumn(index) {
    const { column } = getGridCoords(index);
    return column;
}

function getPixelCoords(index) {
    const gridCoords = getGridCoords(index),
        thumbnailSize = getThumbnailSize(),
        x = gridCoords.col * thumbnailSize.w,
        y = gridCoords.row * thumbnailSize.h;

    return { x, y };
}

function isOddRow(index) {
    return getRow(index) % 2 !== 0;
}

function isEvenRow(index) {
    return !isOddRow(index);
}

function isOddColumn(index) {
    return getColumn(index) % 2 !== 0;
}

function isEvenColumn(index) {
    return !isOddColumn(index);
}

export default {
    isOddRow,
    isOddColumn,
    isEvenRow,
    isEvenColumn,
    getColumn,
    getColumns,
    getRow,
    getRows,
    getThumbnailSize,
    getGridCoords,
    getPixelCoords,
    getGallerySize
};

