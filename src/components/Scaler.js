import Transitionable from "famous/transitions/Transitionable";
import getSize from "../getSize";

class Scaler {
    constructor(node, targetSize = { w: 120, h: 80 }, duration = 100) {
        this.targetSize = targetSize;
        this.duration = duration;
        this.startSize = getSize(node);
        this.node = node;
        this.id = node.addComponent(this);
    }

    start() {
        this.node.requestUpdate(this.id);
        this.transition = {
            w: new Transitionable(this.startSize.w).to(this.targetSize.w, "easeOut", this.duration),
            h: new Transitionable(this.startSize.h).to(this.targetSize.h, "easeOut", this.duration)
        };
    }

    onUpdate() {
        this.node.setAbsoluteSize(this.transition.w.get(), this.transition.h.get());

        if (this.transition.w.isActive() || this.transition.h.isActive()) {
            this.node.requestUpdate(this.id);
            return;
        }

        this.node.removeComponent(this);
    }

    static addTo(node, targetSize, duration) {
        return new Scaler(node, targetSize, duration);
    }

}

export default Scaler;

