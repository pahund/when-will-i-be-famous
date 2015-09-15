import calculator from "../calculator";
import loadImage from "../loadImage";
import Mover from "../components/Mover";
import Image from "./Image";
import Scaler from "../components/Scaler";
import Dispatch from "famous/core/Dispatch";
import ThumbsUp from "./ThumbsUp";

const getPath = Symbol("get path"),
    getStartCoords = Symbol("get start coordinates"),
    getTargetCoords = Symbol("get target coordinates"),
    getSize = Symbol("get size"),
    zoomIn = Symbol("zoom in"),
    zoomOut = Symbol("zoom out"),
    handleScroll = Symbol("handle scroll"),
    handleResize = Symbol("handle resize");

class Thumbnail extends Image {
    constructor(parent, path, index) {
        super(parent, path, Thumbnail[getSize](), Thumbnail[getStartCoords](index));
        this.mover = Mover.addTo(this, Thumbnail[getTargetCoords](index)).start();
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

    ////////// PRIVATE METHODS //////////

    static [getPath](index) {
        return "./images/car" + ("000" + (index + 1)).slice(-3) + ".jpg";
    }
}

export default Thumbnail;
