/**
 * Zoomer.js
 *
 * Grows a thumbnail to show it in large version.
 * This component listens to click events
 * Then the node it is attached to grows and looks big and pretty
 *
 * @author <a href="mailto:pahund@team.mobile.de">Patrick Hund</a>
 * @since 14 Sep 2015
 */
import Transitionable from "famous/transitions/Transitionable";
import getSize from "../getSize";
import getCoords from "../getCoords";

class Zoomer {
    constructor(
            node,
            targetSize = {w: 500, h: 375},
            targetPosition = {x: 10, y: 10},
            duration = 100
            ) {
        this.targetSize = targetSize;
        this.targetPosition = targetPosition;
        this.duration = duration;
        this.startSize = getSize(node);
        this.startPosition = getCoords(node);
        this.node = node;
        this.id = node.addComponent(this);
        this.start();
    }

    start() {
        this.node.requestUpdate(this.id);
        this.transition = {
            w: new Transitionable(this.startSize.w).to(this.targetSize.w),
            h: new Transitionable(this.startSize.h).to(this.targetSize.h),
            x: new Transitionable(this.startPosition.x).to(this.targetPosition.x),
            y: new Transitionable(this.startPosition.y).to(this.targetPosition.y)
        };
    }

    onUpdate() {
        this.node.setAbsoluteSize(this.transition.w.get(), this.transition.h.get());
        this.node.setPosition(this.transition.x.get(), this.transition.y.get(), 1); // TODO: z-position

        if (this.transition.w.isActive() || this.transition.h.isActive() ||
                this.transition.x.isActive() || this.transition.y.isActive()) {
            this.node.requestUpdate(this.id);
            return;
        }

        this.node.removeComponent(this);
    }

    static addTo(node, targetSize, targetPosition, duration) {
        return new Zoomer(node, targetSize, targetPosition, duration);
    }
}

export default Zoomer;
