function getViewportSize() {
    if (typeof document.documentElement.clientWidth === "undefined") {
        throw new Error("unsupported browser");
    }
    return {
        w: document.documentElement.clientWidth,
        h: document.documentElement.clientHeight
    };
}

export default getViewportSize;
