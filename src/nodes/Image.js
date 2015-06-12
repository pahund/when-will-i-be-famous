import createDOMElement from "../createDOMElement";

class Image {
    constructor(parent, path, { w = 100, h = 100 }, { x = 0, y = 0, z = 0 }) {
        this.node = parent.addChild();
        createDOMElement(this.node, { tagName: "img" })
            .setAttribute("src", path);

        this.node
            .setSizeMode("absolute", "absolute", "absolute")
            .setAbsoluteSize(w, h)
            .setPosition(x, y, z);
    }
}

export default Image;
