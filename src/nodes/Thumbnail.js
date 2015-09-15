import loadImage from "../loadImage";
import Image from "./Image";
import getSize from "../getSize";
import getCoords from "../getCoords";

const getPath = Symbol("get path");

class Thumbnail extends Image {
    constructor(parent, path, index) {
        //super(parent, path, getSize(parent), getCoords(parent));
        super(parent, path, getSize(parent), { x: 0, y: 0, z: 0 });
        this.index = index;
    }

    static addTo(container, index) {
        const path = Thumbnail[getPath](index);
        return loadImage(path)
            .then(() => new Thumbnail(container, path, index))
            .catch(error => {
                throw new Error("Error adding thumbnail " + path + ": " + error.message);
            });
    }

    ////////// PRIVATE METHODS //////////

    static [getPath](index) {
        return "./images/car" + ("000" + (index + 1)).slice(-3) + ".jpg";
    }
}

export default Thumbnail;
