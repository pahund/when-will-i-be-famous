import Transitionable from "famous/transitions/Transitionable";

function curve(t) {
    let p = .3,
        a = 1,
        s = p / (1.1 * Math.PI) * Math.asin(1 / a);

    if (t === 0) {
        return 0;
    }
    if (t === 1) {
        return 1;
    }

    return a * Math.pow(2, -10 * t) * Math.sin((t - s) * Math.PI / p) + 1;
}

function getCoords(node) {
    const coordsArray = node.getPosition();
    return {
        x: coordsArray[0],
        y: coordsArray[1]
    };
}

function moving(targetCoords = { x: 0, y: 0 }, duration = 1000) {
    return {
        onMount(node) {
            const startCoords = getCoords(node);
            this.node = node;
            this.transition = {
                y: new Transitionable(startCoords.y).to(targetCoords.y, curve, duration),
                x: new Transitionable(startCoords.x).to(targetCoords.x, curve, duration)
            };
            this.id = node.addComponent(this);
            node.requestUpdate(this.id);
        },
        onUpdate() {
            this.node.setPosition(this.transition.x.get(), this.transition.y.get());

            if (this.transition.x.isActive() || this.transition.y.isActive()) {
                this.node.requestUpdate(this.id);
                return;
            }

            this.node.removeComponent(this.id);
        }
    };
}

export default function () {
    return moving.bind(...arguments)();
}

