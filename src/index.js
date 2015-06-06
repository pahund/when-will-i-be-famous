"use strict";

var FamousEngine = require("famous/core/FamousEngine"),
    addCar = require("./addCar"),
    delay = require("./delay"),
    scene,
    i;

FamousEngine.init();

scene = FamousEngine.createScene();

for (i = 0; i < 100; i++) {
    delay((i * 30) + (Math.random() * 100), addCar)(scene, i);
}

