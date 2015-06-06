"use strict";

var addCar = require("./addCar"),
    delay = require("./delay"),
    i;

for (i = 0; i < 100; i++) {
    delay((i * 30) + (Math.random() * 100), addCar)(i);
}

