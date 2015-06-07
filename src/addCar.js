import viewportSizeF from "./getViewportSize";
import DOMElement from "famous/dom-renderables/DOMElement";
import scene from "./scene";
import calculator from "./calculator";
import loadImage from "./loadImage";
import moving from "./components/moving";

const viewportSize = viewportSizeF();

function getPath(index) {
    return "./images/car" + ("000" + (index + 1)).slice(-3) + ".jpg";
}

function load(index) {
    return loadImage(getPath(index));
}

function add(index) {
    return () => {
        const car = scene.addChild(),
            thumbnailSize = calculator.getThumbnailSize(),
            pixelCoords = calculator.getPixelCoords(index),
            startY = Math.floor(viewportSize.h / thumbnailSize.h) * thumbnailSize.h;
            //increment = thumbnailSize.h / 4 * -1,

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
        car.addComponent(moving(car, pixelCoords));





        //car.addComponent(moving(car, pixelCoords, { x: 0, y: increment }));
    };
}

function error(error) {
    throw new Error("something went wrong: " + error.message);
}

function addCar(index) {
    load(index).then(add(index)).catch(error);
}

export default addCar;
