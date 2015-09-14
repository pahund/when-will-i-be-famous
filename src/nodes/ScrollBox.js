import Node from "famous/core/Node";
import viewportSizeF from "../getViewportSize";
import ResizeListener from "../components/ResizeListener";

class ScrollBox extends Node {
    constructor(parent) {
        super();
        const { w, h } = viewportSizeF();

        parent.addChild(this);
        super.setSizeMode("absolute", "absolute", "absolute")
            .setAbsoluteSize(w, h)
            .setPosition(0, 0);
        ResizeListener.addTo(this, (newW, newH) => super.setAbsoluteSize(newW, newH));
    }

    static addTo(parent) {
        return new ScrollBox(parent);
    }
}

export default ScrollBox;
