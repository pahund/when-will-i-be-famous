import GestureHandler from "famous/components/GestureHandler";
import createDOMElement from "./createDOMElement";
import getCoords from "./getCoords";
import Mover from "./components/Mover";
import calculator from "./calculator";
import viewportSizeF from "./getViewportSize";

function addContainer(parent) {
    const container = parent.addChild(),
        gestures = new GestureHandler(container),
        viewportSize = viewportSizeF();

    createDOMElement(container);

    gestures.on("drag", function (data) {
        const currentY = getCoords(container).y,
            gallerySize = calculator.getGallerySize(),
            maxY = 0,
            minY = (gallerySize.h * -1) + viewportSize.h;
        let newY = currentY + (data.status === "end" ? data.centerVelocity.y / 2 : data.centerDelta.y);
        if (newY > maxY) {
            newY = maxY;
        }
        if (newY < minY) {
            newY = minY;
        }
        if (data.status === "end") {
            const mover = new Mover(container, { x: null, y: newY }, 500, "easeOut");
            mover.start();
            return;
        }
        container.setPosition(null, newY);
    });

    return container;
}

export default addContainer;
