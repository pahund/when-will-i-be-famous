import GestureHandler from "famous/components/GestureHandler";
import createDOMElement from "../createDOMElement";
import getCoords from "../getCoords";
import Mover from "../components/Mover";
import calculator from "../calculator";
import viewportSizeF from "../getViewportSize";

const handleDrag = Symbol("handle drag");

class ScrollBox {
    constructor(parent) {
        let gestures;

        this.viewportSize = viewportSizeF();
        this.node = parent.addChild();

        gestures = new GestureHandler(this.node);

        createDOMElement(this.node);

        gestures.on("drag", this[handleDrag].bind(this));
    }

    static add(parent) {
        return new ScrollBox(parent).node;
    }

    ////////// PRIVATE METHODS //////////

    [handleDrag]({ status, centerVelocity, centerDelta }) {
        const currentY = getCoords(this.node).y,
            gallerySize = calculator.getGallerySize(),
            maxY = 0,
            minY = (gallerySize.h * -1) + this.viewportSize.h;
        let newY = currentY + (status === "end" ? centerVelocity.y / 2 : centerDelta.y);
        if (newY > maxY) {
            newY = maxY;
        }
        if (newY < minY) {
            newY = minY;
        }
        if (status === "end") {
            const mover = new Mover(this.node, { x: null, y: newY }, 500, "easeOut");
            mover.start();
            return;
        }
        this.node.setPosition(null, newY);
    }
}

export default ScrollBox;
