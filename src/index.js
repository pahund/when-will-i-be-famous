import GestureHandler from "famous/components/GestureHandler";
import createDOMElement from "./createDOMElement";
import addCar from "./addCar";
import delay from "./delay";
import scene from "./scene";
import getCoords from "./getCoords";
import Mover from "./components/Mover";
import settings from "./settings";
import calculator from "./calculator";
import viewportSizeF from "./getViewportSize";

const container = scene.addChild(),
    gestures = new GestureHandler(container),
    viewportSize = viewportSizeF();

createDOMElement(container);

for (let i = 0; i < settings.numberOfThumbnails; i++) {
    delay((i * 30) + (Math.random() * 100), addCar)(container, i);
}
gestures.on("drag", function (data) {
    const currentY = getCoords(container).y,
        gallerySize = calculator.getGallerySize(),
        maxY = 0,
        minY = (gallerySize.h * -1) + viewportSize.h;
    let newY = currentY + (data.status === "end" ? data.centerVelocity.y : data.centerDelta.y);
    if (newY > maxY) {
        newY = maxY;
    }
    if (newY < minY) {
        newY = minY;
    }
    if (data.status === "end") {
        const mover = new Mover(container, { x: null, y: newY });
        mover.start();
        return;
    }
    container.setPosition(null, newY);
});

