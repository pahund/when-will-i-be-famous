/**
 * Car.js
 *
 * @author <a href="mailto:pahund@team.mobile.de">Patrick Hund</a>
 * @since 15 Sep 2015
 */

import calculator from "../calculator";
import Mover from "../components/Mover";
import Node from "famous/core/Node";
import Dispatch from "famous/core/Dispatch";
import Scaler from "../components/Scaler";
import ThumbsUp from "./ThumbsUp";
import Thumbnail from "./Thumbnail";
import createDOMElement from "../createDOMElement";

const getStartCoords = Symbol("get start coordinates"),
    getTargetCoords = Symbol("get target coordinates"),
    getSize = Symbol("get size"),
    zoomIn = Symbol("zoom in"),
    zoomOut = Symbol("zoom out"),
    handleScroll = Symbol("handle scroll"),
    handleResize = Symbol("handle resize");

class Car extends Node {
    constructor(parent, index) {
        super();
        const size = Car[getSize](),
            startCoords = Car[getStartCoords](index);
        this.index = index;
        this.zoomed = false;
        parent.addChild(this);
        super.setSizeMode("absolute", "absolute", "absolute")
            .setAbsoluteSize(size.w, size.h)
            .setPosition(startCoords.x, startCoords.y, startCoords.z);
        Thumbnail.addTo(this, this.index).then(() => this.start());
    }

    start() {
        this.mover = Mover.addTo(this, Car[getTargetCoords](this.index)).start();
        this.scaler = {
            stop: () => {}
        };
        this.addUIEvent("click");
         //DELETE THIS
        createDOMElement(this, {}).
            setAttribute("style", "background: tomato;");
         //TO THIS

    }

    onReceive(event) {
        switch (event) {
            case "click":
                if (!this.zoomed) {
                    this[zoomIn]();
                } else {
                    this[zoomOut]();
                }
                break;
            case "VIEWPORT_RESIZE":
                this[handleResize]();
                break;
            case "ZOOMED_IN":
                if (this.zoomed) {
                    this[zoomOut]();
                }
                break;
            default:
        }
    }

   static addTo(container, index) {
       return new Car(container, index);
   }

    ////////// PRIVATE METHODS //////////

    [zoomIn]() {
        Dispatch.dispatch("body", "ZOOMED_IN", this.index);
        this.zoomed = true;
        this.scaler.stop();
        this.mover.stop();
        console.log("[PH_LOG] calculator.getZoomDimensions(): ", calculator.getZoomDimensions()); // PH_TODO: REMOVE
        console.log("[PH_LOG] calculator.getZoomCoords(): ", calculator.getZoomCoords()); // PH_TODO: REMOVE
        this.scaler = Scaler.addTo(this, calculator.getZoomDimensions()).start();
        this.mover = Mover.addTo(this, calculator.getZoomCoords()).start();
        ThumbsUp.addTo(this).then(thumbsUp => this.thumbsUp = thumbsUp);
    }

    [zoomOut]() {
        this.zoomed = false;
        this.scaler.stop();
        this.mover.stop();
        this.scaler = Scaler.addTo(this, calculator.getThumbnailSize()).start();
        this.mover = Mover.addTo(this, Car[getTargetCoords](this.index)).start();
    }

    [handleResize]() {
        this.scaler.stop();
        this.mover.stop();
        if (this.zoomed) {
            this.scaler = Scaler.addTo(this, calculator.getZoomDimensions()).start();
            this.mover = Mover.addTo(this, calculator.getZoomCoords()).start();
        } else {
            this.scaler = Scaler.addTo(this, Car[getSize]()).start();
            this.mover = Mover.addTo(this, Car[getTargetCoords](this.index)).start();
        }
    }

    [handleScroll]() {
        if (this.zoomed) {
            this.mover.stop();
            this.mover = Mover.addTo(this, calculator.getZoomCoords()).start();
        }
    }

    static [getSize]() {
        return calculator.getThumbnailSize();
    }

    static [getStartCoords](index) {
        return {
            x: calculator.isOddRow(index) ? Car[getSize]().w * -1 : calculator.getGallerySize().w,
            y: Car[getTargetCoords](index).y,
            z: 0
        };
    }

    static [getTargetCoords](index) { return calculator.getPixelCoords(index); }
}

export default Car;
