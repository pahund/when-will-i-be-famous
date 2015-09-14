function getCoords(node) {
    const coordsArray = node.getPosition();
    return {
        x: coordsArray[0],
        y: coordsArray[1],
        z: coordsArray[2]
    };
}

export default getCoords;
