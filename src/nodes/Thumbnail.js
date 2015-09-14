import calculator from "../calculator";
import loadImage from "../loadImage";
import Mover from "../components/Mover";
import Image from "./Image";
import Scaler from "../components/Scaler";

const getPath = Symbol("get path"),
    getStartCoords = Symbol("get start coordinates"),
    getTargetCoords = Symbol("get target coordinates"),
    getSize = Symbol("get size"),
    handleClick = Symbol("handle click"),
    handleScroll = Symbol("handle scroll"),
    handleResize = Symbol("handle resize");

class Thumbnail extends Image {
    constructor(parent, path, index) {
        super(parent, path, Thumbnail[getSize](), Thumbnail[getStartCoords](index));
        this.mover = Mover.addTo(this, Thumbnail[getTargetCoords](index)).start();
        this.scaler = {
            stop: () => {}
        };
        this.zoomed = false;
        this.index = index;
        this.addUIEvent("click");
    }

    static addTo(container, index) {
        const path = Thumbnail[getPath](index);
        return loadImage(path)
            .then(() => new Thumbnail(container, path, index))
            .catch(error => {
                throw new Error("Error adding thumbnail " + path + ": " + error.message);
            });
    }

    onReceive(event) {
        switch (event) {
            case "click":
                this[handleClick]();
                break;
            case "VIEWPORT_RESIZE":
                this[handleResize]();
                break;
            default:
        }
    }

    ////////// PRIVATE METHODS //////////

    [handleClick]() {
        this.zoomed = true;
        this.scaler.stop();
        this.mover.stop();
        this.scaler = Scaler.addTo(this, calculator.getZoomDimensions()).start();
        this.mover = Mover.addTo(this, calculator.getZoomCoords()).start();
    }

    [handleResize]() {
        this.scaler.stop();
        this.mover.stop();
        if (this.zoomed) {
            this.scaler = Scaler.addTo(this, calculator.getZoomDimensions()).start();
            this.mover = Mover.addTo(this, calculator.getZoomCoords()).start();
        } else {
            this.scaler = Scaler.addTo(this, Thumbnail[getSize]()).start();
            this.mover = Mover.addTo(this, Thumbnail[getTargetCoords](this.index)).start();
        }
    }

    [handleScroll]() {
        if (this.zoomed) {
            this.mover.stop();
            this.mover = Mover.addTo(this, calculator.getZoomCoords()).start();
        }
    }

    static [getSize]() {
        return calculator.getThumbnailSize();
    }

    static [getStartCoords](index) {
        return {
            x: calculator.isOddRow(index) ? Thumbnail[getSize]().w * -1 : calculator.getGallerySize().w,
            y: Thumbnail[getTargetCoords](index).y,
            z: 0
        };
    }

    static [getTargetCoords](index) { return calculator.getPixelCoords(index); }

    static [getPath](index) {
        return "./images/car" + ("000" + (index + 1)).slice(-3) + ".jpg";
    }
}

export default Thumbnail;
