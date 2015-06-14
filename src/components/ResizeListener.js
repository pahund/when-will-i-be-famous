class ResizeListener {
    constructor(node, updatef) {
        this.node = node;
        this.id = node.addComponent(this);
        this.updatef = updatef;
    }
    onReceive(event, { w, h }) {
        if (event === "VIEWPORT_RESIZE") {
            this.updatef(w, h);
        }
    }
    static addTo(node, updatef) {
        return new ResizeListener(node, updatef);
    }
}

export default ResizeListener;
