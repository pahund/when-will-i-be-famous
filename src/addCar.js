import viewportSizeF from "./getViewportSize";
import DOMElement from "famous/dom-renderables/DOMElement";
import scene from "./scene";
import calculator from "./calculator";
import loadImage from "./loadImage";

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
            startY = Math.floor(viewportSize.h / thumbnailSize.h) * thumbnailSize.h,
            increment = thumbnailSize.h / 4;

        let moveComponent,
            mover;

        new DOMElement(car, { tagName: "img" })
            .setAttribute("src", getPath(index));

        car
            .setSizeMode("absolute", "absolute", "absolute")
            .setAbsoluteSize(thumbnailSize.w, thumbnailSize.h);

        if (startY < pixelCoords.y) {
            car.setPosition(pixelCoords.x, pixelCoords.y);
            return () => {};
        }

        car.setPosition(pixelCoords.x, startY);

        moveComponent = {
            onUpdate: () => {
                const x = car.getPosition()[0],
                    y = car.getPosition()[1];
                if (y > pixelCoords.y) {
                    car.setPosition(x, y - increment);
                    car.requestUpdateOnNextTick(mover);
                    return;
                }
                car.removeComponent(moveComponent);
            }
        };

        mover = car.addComponent(moveComponent);

        car.requestUpdate(mover);
    };
}

function error(index) {
    return () => {
        throw new Error("loading image " + getPath(index) + " failed");
    };
}

function addCar(index) {
    load(index).then(add(index)).catch(error(index));
}

export default addCar;
