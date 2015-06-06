"use strict";

var viewportSizeF = require("./getViewportSize"),
    DOMElement = require("famous/dom-renderables/DOMElement"),
    settings = require("./settings"),
    scene = require("./scene"),
    calculator = require("./calculator"),

    viewportSize = viewportSizeF();

module.exports = function (index) {
    var car = scene.addChild(),
        thumbnailSize = calculator.getThumbnailSize(),
        pixelCoords = calculator.getPixelCoords(index),
        startY = Math.floor(viewportSize.h / thumbnailSize.h) * thumbnailSize.h,
        increment = thumbnailSize.h / 4,

        moveComponent,
        mover;

    new DOMElement(car, { tagName: "img" })
        .setAttribute("src", "./images/car" + ("000" + (index + 1)).slice(-3) + ".jpg");

    car
        .setSizeMode("absolute", "absolute", "absolute")
        .setAbsoluteSize(thumbnailSize.w, thumbnailSize.h);

    if (startY < pixelCoords.y) {
        car.setPosition(pixelCoords.x, pixelCoords.y);
        return;
    }

    car.setPosition(pixelCoords.x, startY);

    moveComponent = {
        onUpdate: function () {
            var x = car.getPosition()[0],
                y = car.getPosition()[1];
            if (y > pixelCoords.y) {
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

