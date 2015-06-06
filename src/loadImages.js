import loadImage from "./loadImage";

function *loadImages(...paths) {
    let i;
    for (i = 0; i < paths.length; i++) {
        yield loadImage(paths[i]);
    }
}

export default loadImages;
