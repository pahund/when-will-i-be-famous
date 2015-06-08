import createDOMElement from "../createDOMElement";
import loadImage from "../loadImage";

const logoPath = "./images/mobilede-logo.svg",
    logoSize = { w: 182, h: 57 },
    logoPosition = [ 10, 10, 10 ],
    loadLogoImage = Symbol("load thumbnail image"),
    createInstance = Symbol("create instance"),
    throwError = Symbol("throw error");

class Logo {
    constructor(parent) {
        const node = parent.addChild();
        createDOMElement(node, { tagName: "img" })
            .setAttribute("src", logoPath);

        node
            .setSizeMode("absolute", "absolute", "absolute")
            .setAbsoluteSize(logoSize.w, logoSize.h)
            .setPosition(...logoPosition);
    }

    static add(container) {
        return Logo[loadLogoImage]()
            .then(Logo[createInstance](container))
            .catch(Logo[throwError]);
    }

    ////////// PRIVATE METHODS //////////

    static [throwError](e) {
        throw new Error("something went wrong: " + e.message);
    }

    static [loadLogoImage]() {
        return loadImage(logoPath);
    }

    static [createInstance](parent) {
        return () => {
            return new Logo(parent);
        };
    }
}

export default Logo;
