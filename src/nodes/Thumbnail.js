import calculator from "../calculator";
import loadImage from "../loadImage";
import Mover from "../components/Mover";
import Image from "./Image";
import ResizeListener from "../components/ResizeListener";
import Scaler from "../components/Scaler";
import Zoomer from "../components/Zoomer";

const getPath = Symbol("get path"),
    getStartCoords = Symbol("get start coordinates"),
    getTargetCoords = Symbol("get target coordinates"),
    getSize = Symbol("get size");

class Thumbnail extends Image {
    constructor(parent, path, index) {
        super(parent, path, Thumbnail[getSize](), Thumbnail[getStartCoords](index));
        this.mover = Mover.addTo(this, Thumbnail[getTargetCoords](index)).start();
        this.scaler = {
            stop: () => {}
        };
        ResizeListener.addTo(this, () => {
            this.scaler = Scaler.addTo(this, Thumbnail[getSize]()).start();
            this.mover = Mover.addTo(this, Thumbnail[getTargetCoords](index)).start();
        });
        this.addUIEvent("click");
        this.onReceive = (event, payload) => {
            if (event === "click") {
                this.scaler.stop();
                this.mover.stop();
                Zoomer.addTo(this);
            }
        };
    }

    static addTo(container, index) {
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

    static [getTargetCoords](index) { return calculator.getPixelCoords(index); }
    static [getPath](index) {
        return "./images/car" + ("000" + (index + 1)).slice(-3) + ".jpg";
    }
}

export default Thumbnail;
