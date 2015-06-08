import getViewportSize from "./getViewportSize";
import settings from "./settings";

const viewportSize = getViewportSize();

function getColumns() {
    return Math.floor(viewportSize.w / settings.targetThumbnailWidth);
}

function getRows() {
    return Math.ceil(settings.numberOfThumbnails / getColumns());
}

function getThumbnailSize() {
    const w = viewportSize.w / getColumns(),
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

function getPixelCoords(index) {
    const gridCoords = getGridCoords(index),
        thumbnailSize = getThumbnailSize(),
        x = gridCoords.col * thumbnailSize.w,
        y = gridCoords.row * thumbnailSize.h;

    return { x, y };
}

export default {
    getColumns,
    getRows,
    getThumbnailSize,
    getGridCoords,
    getPixelCoords,
    getGallerySize
};

