function getSize(node) {
    const sizeArray = node.getSize();
    return {
        w: sizeArray[0],
        h: sizeArray[1]
    };
}

export default getSize;
