import calculator from "../calculator";
import loadImage from "../loadImage";
import Mover from "../components/Mover";
import Image from "./Image";

const getPath = Symbol("get path");

class Thumbnail extends Image {
    constructor(parent, path, size, startCoords, targetCoords) {
        super(parent, path, size, startCoords);
        const mover = new Mover(this.node, targetCoords);
        mover.start();
    }

    static add(container, index) {
        const path = Thumbnail[getPath](index),
            thumbnailSize = calculator.getThumbnailSize(),
            targetCoords = calculator.getPixelCoords(index),
            startCoords = {
                x: calculator.isOddRow(index) ? thumbnailSize.w * -1 : calculator.getGallerySize().w,
                y: targetCoords.y
            };

        return loadImage(path)
            .then(() => new Thumbnail(container, path, thumbnailSize, startCoords, targetCoords))
            .catch(error => {
                throw new Error("Error adding thumbnail " + path + ": " + error.message);
            });
    }

    ////////// PRIVATE METHODS //////////

    static [getPath](index) {
        return "./images/car" + ("000" + (index + 1)).slice(-3) + ".jpg";
    }
}

export default Thumbnail;
