/**
 * ThumbsUp.js
 *
 * @author <a href="mailto:pahund@team.mobile.de">Patrick Hund</a>
 * @since 15 Sep 2015
 */

import loadImage from "../loadImage";
import Image from "./Image";

const path = "./images/thumbs-up.svg",
    size = { w: 366, h: 395 },
    position = { x: 10, y: 10, z: 1000 };


class ThumbsUp extends Image {
    constructor(parent) {
        super(parent, path, size, position);
    }

    static addTo(container) {
        return loadImage(path)
            .then(() => new ThumbsUp(container))
            .catch(event => {
                console.error("Error adding thumbs up icon", event);
                throw new Error("Error adding thumbs up icon: " + event.message, event);
            });
    }
}

export default ThumbsUp;
