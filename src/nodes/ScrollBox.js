import createDOMElement from "../createDOMElement";
import viewportSizeF from "../getViewportSize";

class ScrollBox {
    constructor(parent) {
        const viewportSize = viewportSizeF();
        let outerElement;

        this.node = parent.addChild();
        outerElement = createDOMElement(this.node);
        this.node
            .setSizeMode("absolute", "absolute", "absolute")
            .setAbsoluteSize(viewportSize.w, viewportSize.h)
            .setPosition(0, 0);
        outerElement
            .setProperty("overflow-y", "scroll")
            .setProperty("overflow-x", "hidden")
            .setProperty("-webkit-overflow-scrolling", "touch");
    }

    static add(parent) {
        return new ScrollBox(parent).node;
    }
}

export default ScrollBox;
