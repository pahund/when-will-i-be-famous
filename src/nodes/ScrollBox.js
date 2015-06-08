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
        this.gallerySize = calculator.getGallerySize();
        this.node = parent.addChild();

        gestures = new GestureHandler(this.node);

        createDOMElement(this.node);
        this.node
            .setSizeMode("absolute", "absolute", "absolute")
            .setAbsoluteSize(this.gallerySize.w, this.gallerySize.h)
            .setPosition(0, 0);

        gestures.on("drag", this[handleDrag].bind(this));
    }

    static add(parent) {
        return new ScrollBox(parent).node;
    }

    ////////// PRIVATE METHODS //////////

    [handleDrag]({ status, centerVelocity: { y: velocity }, centerDelta: { y: delta } }) {
        const currentY = getCoords(this.node).y,
            maxY = 0,
            minY = (this.gallerySize.h * -1) + this.viewportSize.h;
        let newY = currentY + (status === "end" && Math.abs(delta) > 10 ? velocity / 2 : delta);
        if (newY > maxY) {
            newY = maxY;
        }
        if (newY < minY) {
            newY = minY;
        }
        if (status === "end" && Math.abs(delta) > 10) {
            const mover = new Mover(this.node, { x: null, y: newY }, 500, "easeOut");
            mover.start();
            return;
        }
        this.node.setPosition(null, newY);
    }

}

export default ScrollBox;
