"use strict";

module.exports = function delay(ms, func) {
    return function () {
        var args = Array.prototype.slice.call(arguments);
        window.setTimeout(function () {
            func.apply(null, args);
        }, ms);
    };
};
