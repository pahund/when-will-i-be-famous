import Node from "famous/core/Node";
import createDOMElement from "../createDOMElement";

class Image extends Node {
    constructor(parent, path, { w = 100, h = 100 }, { x = 0, y = 0, z = 0 }) {
        super();
        parent.addChild(this);
        createDOMElement(this, { tagName: "img" })
            .setAttribute("src", path);

        super.setSizeMode("absolute", "absolute", "absolute")
            .setAbsoluteSize(w, h)
            .setPosition(x, y, z);
    }
}

export default Image;
