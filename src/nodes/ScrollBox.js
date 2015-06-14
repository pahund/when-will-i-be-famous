import Node from "famous/core/Node";
import createDOMElement from "../createDOMElement";
import viewportSizeF from "../getViewportSize";
import ResizeListener from "../components/ResizeListener";

class ScrollBox extends Node {
    constructor(parent) {
        super();
        const { w, h } = viewportSizeF();
        let outerElement;

        parent.addChild(this);
        outerElement = createDOMElement(this);
        super.setSizeMode("absolute", "absolute", "absolute")
            .setAbsoluteSize(w, h)
            .setPosition(0, 0);
        ResizeListener.addTo(this, (newW, newH) => super.setAbsoluteSize(newW, newH));
        outerElement
            .setProperty("overflow-y", "scroll")
            .setProperty("overflow-x", "hidden")
            .setProperty("-webkit-overflow-scrolling", "touch");
    }

    static addTo(parent) {
        return new ScrollBox(parent);
    }
}

export default ScrollBox;
