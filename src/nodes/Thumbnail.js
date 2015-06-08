//import viewportSizeF from "../getViewportSize";
import DOMElement from "famous/dom-renderables/DOMElement";
import calculator from "../calculator";
import loadImage from "../loadImage";
import Mover from "../components/Mover";

const loadThumbnailImage = Symbol("load thumbnail image"),
    getPath = Symbol("get path"),
    createInstance = Symbol("create instance"),
    throwError = Symbol("throw error");

class Thumbnail {
    constructor(parent, index) {
        const car = parent.addChild(),
            thumbnailSize = calculator.getThumbnailSize(),
            pixelCoords = calculator.getPixelCoords(index),
            startX = thumbnailSize.w * -1;

        let mover;

        new DOMElement(car, { tagName: "img" })
            .setAttribute("src", Thumbnail[getPath](index));

        car
            .setSizeMode("absolute", "absolute", "absolute")
            .setAbsoluteSize(thumbnailSize.w, thumbnailSize.h);

        car.setPosition(startX, pixelCoords.y);

        mover = new Mover(car, pixelCoords);
        mover.start();

    }

    static add(container, index) {
        return Thumbnail[loadThumbnailImage](index)
            .then(Thumbnail[createInstance](container, index))
            .catch(Thumbnail[throwError]);
    }

    ////////// PRIVATE METHODS //////////

    static [throwError](e) {
        throw new Error("something went wrong: " + e.message);
    }

    static [getPath](index) {
        return "./images/car" + ("000" + (index + 1)).slice(-3) + ".jpg";
    }

    static [loadThumbnailImage](index) {
        return loadImage(Thumbnail[getPath](index));
    }

    static [createInstance](parent, index) {
        return () => {
            return new Thumbnail(parent, index);
        };
    }
}

export default Thumbnail;
