import loadImage from "../loadImage";
import Image from "./Image";

const logoPath = "./images/mobilede-logo.svg",
    logoSize = { w: 182, h: 57 },
    logoPosition = { x: 10, y: 10, z: 10 };

class Logo extends Image {
    constructor(parent) {
        super(parent, logoPath, logoSize, logoPosition);
    }

    static add(container) {
        return loadImage(logoPath)
            .then(() => new Logo(container))
            .catch(error => {
                throw new Error("Error adding logo " + logoPath + ": " + error.message);
            });
    }
}

export default Logo;
