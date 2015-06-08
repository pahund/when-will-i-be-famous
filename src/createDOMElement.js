import DOMElement from "famous/dom-renderables/DOMElement";

function createDOMElement(node, options) {
    return new DOMElement(node, options);
}

export default createDOMElement;
