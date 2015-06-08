import viewportSizeF from "./getViewportSize";
import DOMElement from "famous/dom-renderables/DOMElement";
import calculator from "./calculator";
import loadImage from "./loadImage";
import Mover from "./components/Mover";

const viewportSize = viewportSizeF();

function getPath(index) {
    return "./images/car" + ("000" + (index + 1)).slice(-3) + ".jpg";
}

function load(index) {
    return loadImage(getPath(index));
}

function add(parent, index) {
    return () => {
        const car = parent.addChild(),
            thumbnailSize = calculator.getThumbnailSize(),
            pixelCoords = calculator.getPixelCoords(index),
            startY = Math.floor(viewportSize.h / thumbnailSize.h) * thumbnailSize.h;

        let mover;
        // gestures;

        new DOMElement(car, { tagName: "img" })
            .setAttribute("src", getPath(index));

        car
            .setSizeMode("absolute", "absolute", "absolute")
            .setAbsoluteSize(thumbnailSize.w, thumbnailSize.h);

        if (startY < pixelCoords.y) {
            car.setPosition(pixelCoords.x, pixelCoords.y);
            return () => {};
        }

        car.setPosition(thumbnailSize.w * -1, startY);

        mover = new Mover(car, pixelCoords);
        mover.start();
    };
}

function error(e) {
    throw new Error("something went wrong: " + e.message);
}

function addCar(container, index) {
    load(index).then(add(container, index)).catch(error);
}

export default addCar;
