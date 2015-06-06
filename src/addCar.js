"use strict";

var viewportSizeF = require("./getViewportSize"),
    DOMElement = require("famous/dom-renderables/DOMElement"),

    viewportSize = viewportSizeF(),
    targetThumnailWidth = 240,

    thumbnailWidth,
    thumbnailHeight,
    columns;

module.exports = function (scene, index) {
    var car = scene.addChild(),

        moveComponent,
        mover,
        row,
        targetY,
        startY,
        increment,
        column,
        x;

    columns = Math.floor(viewportSize.w / targetThumnailWidth);
    thumbnailWidth = viewportSize.w / columns;
    thumbnailHeight = thumbnailWidth * 0.75;
    column = index % columns;
    row = Math.floor(index / columns);
    x = column * thumbnailWidth;
    targetY = row * thumbnailHeight;
    startY = Math.floor(viewportSize.h / thumbnailHeight) * thumbnailHeight;
    increment = thumbnailHeight / 4;

    new DOMElement(car, { tagName: "img" })
        .setAttribute("src", "./images/car" + ("000" + (index + 1)).slice(-3) + ".jpg");

    car
        .setSizeMode("absolute", "absolute", "absolute")
        .setAbsoluteSize(thumbnailWidth, thumbnailHeight);

    if (startY < targetY) {
        car.setPosition(x, targetY);
        return;
    }

    car.setPosition(x, startY);

    moveComponent = {
        onUpdate: function () {
            var x = car.getPosition()[0],
                y = car.getPosition()[1];
            if (y > targetY) {
                car.setPosition(x, y - increment);
                car.requestUpdateOnNextTick(mover);
                return;
            }
            car.removeComponent(moveComponent);
        }
    };

    mover = car.addComponent(moveComponent);

    car.requestUpdate(mover);
};

