"use strict";

// Famous dependencies
var DOMElement = require("famous/dom-renderables/DOMElement"),
    FamousEngine = require("famous/core/FamousEngine"),
    addCar = require("./addCar"),
    delay = require("./delay");

// Boilerplate code to make your life easier
FamousEngine.init();

var scene = FamousEngine.createScene();

for (var i = 0; i < 100; i++) {
    delay((i * 30) + (Math.random() * 100), addCar)(scene, i);
}

