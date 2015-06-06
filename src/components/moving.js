function moving(targetCoords, delta) {
    function isFinished(x, y) {
        const yFinished = delta.y === 0 || (delta.y < 0 && y <= targetCoords.y) || (delta.y > 0 && y >= targetCoords.y),
            xFinished = delta.x === 0 || (delta.x < 0 && x <= targetCoords.x) || (delta.x > 0 && x >= targetCoords.x);

        return yFinished && xFinished;
    }

    return {
        onMount(node) {
            this.id = node.addComponent(this);
            node.requestUpdate(this.id);
            this.node = node;
        },
        onUpdate() {
            const x = this.node.getPosition()[0],
                y = this.node.getPosition()[1];
            if (!isFinished(x, y)) {
                this.node.setPosition(x + delta.x, y + delta.y);
                this.node.requestUpdateOnNextTick(this.id);
                return;
            }
            this.node.removeComponent(this.id);
        }
    };
}

export default function () {
    return moving.bind(...arguments)();
}
