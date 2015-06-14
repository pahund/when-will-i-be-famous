import createDOMElement from "../createDOMElement";
import viewportSizeF from "../getViewportSize";
import ResizeListener from "../components/ResizeListener";

class ScrollBox {
    constructor(parent) {
        const { w, h } = viewportSizeF();
        let outerElement;

        this.node = parent.addChild();
        outerElement = createDOMElement(this.node);
        this.node
            .setSizeMode("absolute", "absolute", "absolute")
            .setAbsoluteSize(w, h)
            .setPosition(0, 0);
        ResizeListener.addTo(this.node, (newW, newH) => this.node.setAbsoluteSize(newW, newH));
        outerElement
            .setProperty("overflow-y", "scroll")
            .setProperty("overflow-x", "hidden")
            .setProperty("-webkit-overflow-scrolling", "touch");
    }

    reflow() {
        const { w, h } = viewportSizeF();
        this.node.setAbsoluteSize(w, h);
    }

    static add(parent) {
        return new ScrollBox(parent);
    }
}

export default ScrollBox;
