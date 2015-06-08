import GestureHandler from "famous/components/GestureHandler";
import createDOMElement from "../createDOMElement";
import getCoords from "../getCoords";
import Mover from "../components/Mover";
import calculator from "../calculator";
import viewportSizeF from "../getViewportSize";

class ScrollBox {
    constructor(parent) {
        const viewportSize = viewportSizeF();
        let gestures;

        this.node = parent.addChild();
        gestures = new GestureHandler(this.node);

        createDOMElement(this.node);

        gestures.on("drag", (data) => {
            const currentY = getCoords(this.node).y,
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
                const mover = new Mover(this.node, { x: null, y: newY }, 500, "easeOut");
                mover.start();
                return;
            }
            this.node.setPosition(null, newY);
        });
    }

    static add(parent) {
        return new ScrollBox(parent).node;
    }
}

export default ScrollBox;
