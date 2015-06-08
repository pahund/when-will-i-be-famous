import Transitionable from "famous/transitions/Transitionable";
import getCoords from "../getCoords";

const customCurve = Symbol("custom curve");

class Mover {
    constructor(node, targetCoords = { x: 0, y: 0 }, duration = 1000, curve = Mover[customCurve]) {
        this.targetCoords = targetCoords;
        this.duration = duration;
        this.startCoords = getCoords(node);
        this.node = node;
        this.id = node.addComponent(this);
        this.curve = curve;
    }

    start() {
        this.node.requestUpdate(this.id);
        this.transition = {
            y: new Transitionable(this.startCoords.y).to(this.targetCoords.y, this.curve, this.duration),
            x: new Transitionable(this.startCoords.x).to(this.targetCoords.x, this.curve, this.duration)
        };
    }

    onUpdate() {
        this.node.setPosition(this.transition.x.get(), this.transition.y.get());

        if (this.transition.x.isActive() || this.transition.y.isActive()) {
            this.node.requestUpdate(this.id);
        }
    }

    ////////// PRIVATE METHODS //////////

    static [customCurve](t) {
        let p = .3,
            a = 1,
            s = p / (1.1 * Math.PI) * Math.asin(1 / a);

        if (t === 0) {
            return 0;
        }
        if (t === 1) {
            return 1;
        }

        return a * Math.pow(5, -10 * t) * Math.sin((t - s) * Math.PI / p) + 1;
    }
}

export default Mover;

