function loadImage(path) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => window.setTimeout(resolve, 100);
        image.onabort = reject;
        image.onerror = reject;
        image.src = path;
    });
}

export default loadImage;
