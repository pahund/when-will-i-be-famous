import calculator from "../calculator";
import loadImage from "../loadImage";
import Mover from "../components/Mover";
import Image from "./Image";
import ResizeListener from "../components/ResizeListener";
import Scaler from "../components/Scaler";

const getPath = Symbol("get path"),
    getStartCoords = Symbol("get start coordinates"),
    getTargetCoords = Symbol("get target coordinates"),
    getSize = Symbol("get size");

class Thumbnail extends Image {
    constructor(parent, path, index) {
        super(parent, path, Thumbnail[getSize](), Thumbnail[getStartCoords](index));
        Mover.addTo(this.node, Thumbnail[getTargetCoords](index)).start();
        ResizeListener.addTo(this.node, () => {
            Scaler.addTo(this.node, Thumbnail[getSize]()).start();
            Mover.addTo(this.node, Thumbnail[getTargetCoords](index)).start();
        });
    }

    static add(container, index) {
        const path = Thumbnail[getPath](index);
        return loadImage(path)
            .then(() => new Thumbnail(container, path, index))
            .catch(error => {
                throw new Error("Error adding thumbnail " + path + ": " + error.message);
            });
    }

    ////////// PRIVATE METHODS //////////

    static [getSize]() {
        return calculator.getThumbnailSize();
    }

    static [getStartCoords](index) {
        return {
            x: calculator.isOddRow(index) ? Thumbnail[getSize]().w * -1 : calculator.getGallerySize().w,
            y: Thumbnail[getTargetCoords](index).y
        };
    }

    static [getTargetCoords](index) {
        return calculator.getPixelCoords(index);
    }

    static [getPath](index) {
        return "./images/car" + ("000" + (index + 1)).slice(-3) + ".jpg";
    }
}

export default Thumbnail;
