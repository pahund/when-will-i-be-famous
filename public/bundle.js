(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * Camera is a component that is responsible for sending information to the renderer about where
 * the camera is in the scene.  This allows the user to set the type of projection, the focal depth,
 * and other properties to adjust the way the scenes are rendered.
 *
 * @class Camera
 *
 * @param {Node} node to which the instance of Camera will be a component of
 */
function Camera(node) {
    this._node = node;
    this._projectionType = Camera.ORTHOGRAPHIC_PROJECTION;
    this._focalDepth = 0;
    this._near = 0;
    this._far = 0;
    this._requestingUpdate = false;
    this._id = node.addComponent(this);
    this._viewTransform = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    this._viewDirty = false;
    this._perspectiveDirty = false;
    this.setFlat();
}

Camera.FRUSTUM_PROJECTION = 0;
Camera.PINHOLE_PROJECTION = 1;
Camera.ORTHOGRAPHIC_PROJECTION = 2;

/**
 * @method
 *
 * @return {String} Name of the component
 */
Camera.prototype.toString = function toString() {
    return 'Camera';
};

/**
 * Gets object containing serialized data for the component
 *
 * @method
 *
 * @return {Object} the state of the component
 */
Camera.prototype.getValue = function getValue() {
    return {
        component: this.toString(),
        projectionType: this._projectionType,
        focalDepth: this._focalDepth,
        near: this._near,
        far: this._far
    };
};

/**
 * Set the components state based on some serialized data
 *
 * @method
 *
 * @param {Object} state an object defining what the state of the component should be
 *
 * @return {Boolean} status of the set
 */
Camera.prototype.setValue = function setValue(state) {
    if (this.toString() === state.component) {
        this.set(state.projectionType, state.focalDepth, state.near, state.far);
        return true;
    }
    return false;
};

/**
 * Set the internals of the component
 *
 * @method
 *
 * @param {Number} type an id corresponding to the type of projection to use
 * @param {Number} depth the depth for the pinhole projection model
 * @param {Number} near the distance of the near clipping plane for a frustum projection
 * @param {Number} far the distance of the far clipping plane for a frustum projection
 *
 * @return {Boolean} status of the set
 */
Camera.prototype.set = function set(type, depth, near, far) {
    if (!this._requestingUpdate) {
        this._node.requestUpdate(this._id);
        this._requestingUpdate = true;
    }
    this._projectionType = type;
    this._focalDepth = depth;
    this._near = near;
    this._far = far;
};

/**
 * Set the camera depth for a pinhole projection model
 *
 * @method
 *
 * @param {Number} depth the distance between the Camera and the origin
 *
 * @return {Camera} this
 */
Camera.prototype.setDepth = function setDepth(depth) {
    if (!this._requestingUpdate) {
        this._node.requestUpdate(this._id);
        this._requestingUpdate = true;
    }
    this._perspectiveDirty = true;
    this._projectionType = Camera.PINHOLE_PROJECTION;
    this._focalDepth = depth;
    this._near = 0;
    this._far = 0;

    return this;
};

/**
 * Gets object containing serialized data for the component
 *
 * @method
 *
 * @param {Number} near distance from the near clipping plane to the camera
 * @param {Number} far distance from the far clipping plane to the camera
 *
 * @return {Camera} this
 */
Camera.prototype.setFrustum = function setFrustum(near, far) {
    if (!this._requestingUpdate) {
        this._node.requestUpdate(this._id);
        this._requestingUpdate = true;
    }

    this._perspectiveDirty = true;
    this._projectionType = Camera.FRUSTUM_PROJECTION;
    this._focalDepth = 0;
    this._near = near;
    this._far = far;

    return this;
};

/**
 * Set the Camera to have orthographic projection
 *
 * @method
 *
 * @return {Camera} this
 */
Camera.prototype.setFlat = function setFlat() {
    if (!this._requestingUpdate) {
        this._node.requestUpdate(this._id);
        this._requestingUpdate = true;
    }

    this._perspectiveDirty = true;
    this._projectionType = Camera.ORTHOGRAPHIC_PROJECTION;
    this._focalDepth = 0;
    this._near = 0;
    this._far = 0;

    return this;
};

/**
 * When the node this component is attached to updates, the Camera will
 * send new camera information to the Compositor to update the rendering
 * of the scene.
 *
 * @method
 *
 * @return {undefined} undefined
 */
Camera.prototype.onUpdate = function onUpdate() {
    this._requestingUpdate = false;

    var path = this._node.getLocation();

    this._node
        .sendDrawCommand('WITH')
        .sendDrawCommand(path);

    if (this._perspectiveDirty) {
        this._perspectiveDirty = false;

        switch (this._projectionType) {
            case Camera.FRUSTUM_PROJECTION:
                this._node.sendDrawCommand('FRUSTUM_PROJECTION');
                this._node.sendDrawCommand(this._near);
                this._node.sendDrawCommand(this._far);
                break;
            case Camera.PINHOLE_PROJECTION:
                this._node.sendDrawCommand('PINHOLE_PROJECTION');
                this._node.sendDrawCommand(this._focalDepth);
                break;
            case Camera.ORTHOGRAPHIC_PROJECTION:
                this._node.sendDrawCommand('ORTHOGRAPHIC_PROJECTION');
                break;
        }
    }

    if (this._viewDirty) {
        this._viewDirty = false;

        this._node.sendDrawCommand('CHANGE_VIEW_TRANSFORM');
        this._node.sendDrawCommand(this._viewTransform[0]);
        this._node.sendDrawCommand(this._viewTransform[1]);
        this._node.sendDrawCommand(this._viewTransform[2]);
        this._node.sendDrawCommand(this._viewTransform[3]);

        this._node.sendDrawCommand(this._viewTransform[4]);
        this._node.sendDrawCommand(this._viewTransform[5]);
        this._node.sendDrawCommand(this._viewTransform[6]);
        this._node.sendDrawCommand(this._viewTransform[7]);

        this._node.sendDrawCommand(this._viewTransform[8]);
        this._node.sendDrawCommand(this._viewTransform[9]);
        this._node.sendDrawCommand(this._viewTransform[10]);
        this._node.sendDrawCommand(this._viewTransform[11]);

        this._node.sendDrawCommand(this._viewTransform[12]);
        this._node.sendDrawCommand(this._viewTransform[13]);
        this._node.sendDrawCommand(this._viewTransform[14]);
        this._node.sendDrawCommand(this._viewTransform[15]);
    }
};

/**
 * When the transform of the node this component is attached to
 * changes, have the Camera update its projection matrix and
 * if needed, flag to node to update.
 *
 * @method
 *
 * @param {Array} transform an array denoting the transform matrix of the node
 *
 * @return {Camera} this
 */
Camera.prototype.onTransformChange = function onTransformChange(transform) {
    var a = transform;
    this._viewDirty = true;

    if (!this._requestingUpdate) {
        this._node.requestUpdate(this._id);
        this._requestingUpdate = true;
    }

    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
    a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
    a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
    a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

    b00 = a00 * a11 - a01 * a10,
    b01 = a00 * a12 - a02 * a10,
    b02 = a00 * a13 - a03 * a10,
    b03 = a01 * a12 - a02 * a11,
    b04 = a01 * a13 - a03 * a11,
    b05 = a02 * a13 - a03 * a12,
    b06 = a20 * a31 - a21 * a30,
    b07 = a20 * a32 - a22 * a30,
    b08 = a20 * a33 - a23 * a30,
    b09 = a21 * a32 - a22 * a31,
    b10 = a21 * a33 - a23 * a31,
    b11 = a22 * a33 - a23 * a32,

    det = 1/(b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06);

    this._viewTransform[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    this._viewTransform[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    this._viewTransform[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    this._viewTransform[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    this._viewTransform[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    this._viewTransform[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    this._viewTransform[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    this._viewTransform[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    this._viewTransform[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    this._viewTransform[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    this._viewTransform[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    this._viewTransform[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    this._viewTransform[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    this._viewTransform[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    this._viewTransform[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    this._viewTransform[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
};

module.exports = Camera;

},{}],2:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * Channels are being used for interacting with the UI Thread when running in
 * a Web Worker or with the UIManager/ Compositor when running in single
 * threaded mode (no Web Worker).
 *
 * @class Channel
 * @constructor
 */
function Channel() {
    if (typeof self !== 'undefined' && self.window !== self) {
        this._enterWorkerMode();
    }
}


/**
 * Called during construction. Subscribes for `message` event and routes all
 * future `sendMessage` messages to the Main Thread ("UI Thread").
 *
 * Primarily used for testing.
 *
 * @method
 *
 * @return {undefined} undefined
 */
Channel.prototype._enterWorkerMode = function _enterWorkerMode() {
    this._workerMode = true;
    var _this = this;
    self.addEventListener('message', function onmessage(ev) {
        _this.onMessage(ev.data);
    });
};

/**
 * Meant to be overridden by `Famous`.
 * Assigned method will be invoked for every received message.
 *
 * @type {Function}
 * @override
 *
 * @return {undefined} undefined
 */
Channel.prototype.onMessage = null;

/**
 * Sends a message to the UIManager.
 *
 * @param  {Any}    message Arbitrary message object.
 *
 * @return {undefined} undefined
 */
Channel.prototype.sendMessage = function sendMessage (message) {
    if (this._workerMode) {
        self.postMessage(message);
    }
    else {
        this.onmessage(message);
    }
};

/**
 * Meant to be overriden by the UIManager when running in the UI Thread.
 * Used for preserving API compatibility with Web Workers.
 * When running in Web Worker mode, this property won't be mutated.
 *
 * Assigned method will be invoked for every message posted by `famous-core`.
 *
 * @type {Function}
 * @override
 */
Channel.prototype.onmessage = null;

/**
 * Sends a message to the manager of this channel (the `Famous` singleton) by
 * invoking `onMessage`.
 * Used for preserving API compatibility with Web Workers.
 *
 * @private
 * @alias onMessage
 *
 * @param {Any} message a message to send over the channel
 *
 * @return {undefined} undefined
 */
Channel.prototype.postMessage = function postMessage(message) {
    return this.onMessage(message);
};

module.exports = Channel;

},{}],3:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * Equivalent of an Engine in the Worker Thread. Used to synchronize and manage
 * time across different Threads.
 *
 * @class  Clock
 * @constructor
 * @private
 */
function Clock () {
    this._time = 0;
    this._frame = 0;
    this._timerQueue = [];
    this._updatingIndex = 0;

    this._scale = 1;
    this._scaledTime = this._time;
}

/**
 * Sets the scale at which the clock time is passing.
 * Useful for slow-motion or fast-forward effects.
 *
 * `1` means no time scaling ("realtime"),
 * `2` means the clock time is passing twice as fast,
 * `0.5` means the clock time is passing two times slower than the "actual"
 * time at which the Clock is being updated via `.step`.
 *
 * Initally the clock time is not being scaled (factor `1`).
 *
 * @method  setScale
 * @chainable
 *
 * @param {Number} scale    The scale at which the clock time is passing.
 *
 * @return {Clock} this
 */
Clock.prototype.setScale = function setScale (scale) {
    this._scale = scale;
    return this;
};

/**
 * @method  getScale
 *
 * @return {Number} scale    The scale at which the clock time is passing.
 */
Clock.prototype.getScale = function getScale () {
    return this._scale;
};

/**
 * Updates the internal clock time.
 *
 * @method  step
 * @chainable
 *
 * @param  {Number} time high resolution timestamp used for invoking the
 *                       `update` method on all registered objects
 * @return {Clock}       this
 */
Clock.prototype.step = function step (time) {
    this._frame++;

    this._scaledTime = this._scaledTime + (time - this._time)*this._scale;
    this._time = time;

    for (var i = 0; i < this._timerQueue.length; i++) {
        if (this._timerQueue[i](this._scaledTime)) {
            this._timerQueue.splice(i, 1);
        }
    }
    return this;
};

/**
 * Returns the internal clock time.
 *
 * @method  now
 *
 * @return  {Number} time high resolution timestamp used for invoking the
 *                       `update` method on all registered objects
 */
Clock.prototype.now = function now () {
    return this._scaledTime;
};

/**
 * Returns the internal clock time.
 *
 * @method  getTime
 * @deprecated Use #now instead
 *
 * @return  {Number} time high resolution timestamp used for invoking the
 *                       `update` method on all registered objects
 */
Clock.prototype.getTime = Clock.prototype.now;

/**
 * Returns the number of frames elapsed so far.
 *
 * @method getFrame
 *
 * @return {Number} frames
 */
Clock.prototype.getFrame = function getFrame () {
    return this._frame;
};

/**
 * Wraps a function to be invoked after a certain amount of time.
 * After a set duration has passed, it executes the function and
 * removes it as a listener to 'prerender'.
 *
 * @method setTimeout
 *
 * @param {Function} callback function to be run after a specified duration
 * @param {Number} delay milliseconds from now to execute the function
 *
 * @return {Function} timer function used for Clock#clearTimer
 */
Clock.prototype.setTimeout = function (callback, delay) {
    var params = Array.prototype.slice.call(arguments, 2);
    var startedAt = this._time;
    var timer = function(time) {
        if (time - startedAt >= delay) {
            callback.apply(null, params);
            return true;
        }
        return false;
    };
    this._timerQueue.push(timer);
    return timer;
};


/**
 * Wraps a function to be invoked after a certain amount of time.
 *  After a set duration has passed, it executes the function and
 *  resets the execution time.
 *
 * @method setInterval
 *
 * @param {Function} callback function to be run after a specified duration
 * @param {Number} delay interval to execute function in milliseconds
 *
 * @return {Function} timer function used for Clock#clearTimer
 */
Clock.prototype.setInterval = function setInterval(callback, delay) {
    var params = Array.prototype.slice.call(arguments, 2);
    var startedAt = this._time;
    var timer = function(time) {
        if (time - startedAt >= delay) {
            callback.apply(null, params);
            startedAt = time;
        }
        return false;
    };
    this._timerQueue.push(timer);
    return timer;
};

/**
 * Removes previously via `Clock#setTimeout` or `Clock#setInterval`
 * registered callback function
 *
 * @method clearTimer
 * @chainable
 *
 * @param  {Function} timer  previously by `Clock#setTimeout` or
 *                              `Clock#setInterval` returned callback function
 * @return {Clock}              this
 */
Clock.prototype.clearTimer = function (timer) {
    var index = this._timerQueue.indexOf(timer);
    if (index !== -1) {
        this._timerQueue.splice(index, 1);
    }
    return this;
};

module.exports = Clock;


},{}],4:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/*jshint -W079 */

'use strict';

// TODO: Dispatch should be generalized so that it can work on any Node
// not just Contexts.

var Event = require('./Event');

/**
 * The Dispatch class is used to propogate events down the
 * scene graph.
 *
 * @class Dispatch
 * @param {Scene} context The context on which it operates
 * @constructor
 */
function Dispatch (context) {

    if (!context) throw new Error('Dispatch needs to be instantiated on a node');

    this._context = context; // A reference to the context
                             // on which the dispatcher
                             // operates

    this._queue = []; // The queue is used for two purposes
                      // 1. It is used to list indicies in the
                      //    Nodes path which are then used to lookup
                      //    a node in the scene graph.
                      // 2. It is used to assist dispatching
                      //    such that it is possible to do a breadth first
                      //    traversal of the scene graph.
}

/**
 * lookupNode takes a path and returns the node at the location specified
 * by the path, if one exists. If not, it returns undefined.
 *
 * @param {String} location The location of the node specified by its path
 *
 * @return {Node | undefined} The node at the requested path
 */
Dispatch.prototype.lookupNode = function lookupNode (location) {
    if (!location) throw new Error('lookupNode must be called with a path');

    var path = this._queue;

    _splitTo(location, path);

    if (path[0] !== this._context.getSelector()) return void 0;

    var children = this._context.getChildren();
    var child;
    var i = 1;
    path[0] = this._context;

    while (i < path.length) {
        child = children[path[i]];
        path[i] = child;
        if (child) children = child.getChildren();
        else return void 0;
        i++;
    }

    return child;
};

/**
 * dispatch takes an event name and a payload and dispatches it to the
 * entire scene graph below the node that the dispatcher is on. The nodes
 * receive the events in a breadth first traversal, meaning that parents
 * have the opportunity to react to the event before children.
 *
 * @param {String} event name of the event
 * @param {Any} payload the event payload
 *
 * @return {undefined} undefined
 */
Dispatch.prototype.dispatch = function dispatch (event, payload) {
    if (!event) throw new Error('dispatch requires an event name as it\'s first argument');

    var queue = this._queue;
    var item;
    var i;
    var len;
    var children;

    queue.length = 0;
    queue.push(this._context);

    while (queue.length) {
        item = queue.shift();
        if (item.onReceive) item.onReceive(event, payload);
        children = item.getChildren();
        for (i = 0, len = children.length ; i < len ; i++) queue.push(children[i]);
    }
};

/**
 * dispatchUIevent takes a path, an event name, and a payload and dispatches them in
 * a manner anologous to DOM bubbling. It first traverses down to the node specified at
 * the path. That node receives the event first, and then every ancestor receives the event
 * until the context.
 *
 * @param {String} path the path of the node
 * @param {String} event the event name
 * @param {Any} payload the payload
 *
 * @return {undefined} undefined
 */
Dispatch.prototype.dispatchUIEvent = function dispatchUIEvent (path, event, payload) {
    if (!path) throw new Error('dispatchUIEvent needs a valid path to dispatch to');
    if (!event) throw new Error('dispatchUIEvent needs an event name as its second argument');

    var queue = this._queue;
    var node;

    Event.call(payload);
    payload.node = this.lookupNode(path); // After this call, the path is loaded into the queue
                                          // (lookUp node doesn't clear the queue after the lookup)

    while (queue.length) {
        node = queue.pop(); // pop nodes off of the queue to move up the ancestor chain.
        if (node.onReceive) node.onReceive(event, payload);
        if (payload.propagationStopped) break;
    }
};

/**
 * _splitTo is a private method which takes a path and splits it at every '/'
 * pushing the result into the supplied array. This is a destructive change.
 *
 * @private
 * @param {String} string the specified path
 * @param {Array} target the array to which the result should be written
 *
 * @return {Array} the target after having been written to
 */
function _splitTo (string, target) {
    target.length = 0; // clears the array first.
    var last = 0;
    var i;
    var len = string.length;

    for (i = 0 ; i < len ; i++) {
        if (string[i] === '/') {
            target.push(string.substring(last, i));
            last = i + 1;
        }
    }

    if (i - last > 0) target.push(string.substring(last, i));

    return target;
}

module.exports = Dispatch;

},{"./Event":5}],5:[function(require,module,exports){
/**
 * The MIT License (MIT)
 * 
 * Copyright (c) 2015 Famous Industries Inc.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * The Event class adds the stopPropagation functionality
 * to the UIEvents within the scene graph.
 *
 * @constructor Event
 */
function Event () {
    this.propagationStopped = false;
    this.stopPropagation = stopPropagation;
}

/**
 * stopPropagation ends the bubbling of the event in the
 * scene graph.
 *
 * @method stopPropagation
 *
 * @return {undefined} undefined
 */
function stopPropagation () {
    this.propagationStopped = true;
}

module.exports = Event;


},{}],6:[function(require,module,exports){
/**
 * The MIT License (MIT)
 * 
 * Copyright (c) 2015 Famous Industries Inc.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var Clock = require('./Clock');
var Scene = require('./Scene');
var Channel = require('./Channel');
var UIManager = require('../renderers/UIManager');
var Compositor = require('../renderers/Compositor');
var RequestAnimationFrameLoop = require('../render-loops/RequestAnimationFrameLoop');

var ENGINE_START = ['ENGINE', 'START'];
var ENGINE_STOP = ['ENGINE', 'STOP'];
var TIME_UPDATE = ['TIME', null];

/**
 * Famous has two responsibilities, one to act as the highest level
 * updater and another to send messages over to the renderers. It is
 * a singleton.
 *
 * @class FamousEngine
 * @constructor
 */
function FamousEngine() {
    var _this = this;

    this._updateQueue = []; // The updateQueue is a place where nodes
                            // can place themselves in order to be
                            // updated on the frame.

    this._nextUpdateQueue = []; // the nextUpdateQueue is used to queue
                                // updates for the next tick.
                                // this prevents infinite loops where during
                                // an update a node continuously puts itself
                                // back in the update queue.

    this._scenes = {}; // a hash of all of the scenes's that the FamousEngine
                         // is responsible for.

    this._messages = TIME_UPDATE;   // a queue of all of the draw commands to
                                    // send to the the renderers this frame.

    this._inUpdate = false; // when the famous is updating this is true.
                            // all requests for updates will get put in the
                            // nextUpdateQueue

    this._clock = new Clock(); // a clock to keep track of time for the scene
                               // graph.

    this._channel = new Channel();
    this._channel.onMessage = function (message) {
        _this.handleMessage(message);
    };
}


/**
 * An init script that initializes the FamousEngine with options
 * or default parameters.
 *
 * @method
 *
 * @param {Object} options a set of options containing a compositor and a render loop
 *
 * @return {FamousEngine} this
 */
FamousEngine.prototype.init = function init(options) {
    this.compositor = options && options.compositor || new Compositor();
    this.renderLoop = options && options.renderLoop || new RequestAnimationFrameLoop();
    this.uiManager = new UIManager(this.getChannel(), this.compositor, this.renderLoop);
    return this;
};

/**
 * Sets the channel that the engine will use to communicate to
 * the renderers.
 *
 * @method
 *
 * @param {Channel} channel     The channel to be used for communicating with
 *                              the `UIManager`/ `Compositor`.
 *
 * @return {FamousEngine} this
 */
FamousEngine.prototype.setChannel = function setChannel(channel) {
    this._channel = channel;
    return this;
};

/**
 * Returns the channel that the engine is currently using
 * to communicate with the renderers.
 *
 * @method
 *
 * @return {Channel} channel    The channel to be used for communicating with
 *                              the `UIManager`/ `Compositor`.
 */
FamousEngine.prototype.getChannel = function getChannel () {
    return this._channel;
};

/**
 * _update is the body of the update loop. The frame consists of
 * pulling in appending the nextUpdateQueue to the currentUpdate queue
 * then moving through the updateQueue and calling onUpdate with the current
 * time on all nodes. While _update is called _inUpdate is set to true and
 * all requests to be placed in the update queue will be forwarded to the
 * nextUpdateQueue.
 *
 * @method
 *
 * @return {undefined} undefined
 */
FamousEngine.prototype._update = function _update () {
    this._inUpdate = true;
    var time = this._clock.now();
    var nextQueue = this._nextUpdateQueue;
    var queue = this._updateQueue;
    var item;

    this._messages[1] = time;

    while (nextQueue.length) queue.unshift(nextQueue.pop());

    while (queue.length) {
        item = queue.shift();
        if (item && item.onUpdate) item.onUpdate(time);
    }

    this._inUpdate = false;
};

/**
 * requestUpdates takes a class that has an onUpdate method and puts it
 * into the updateQueue to be updated at the next frame.
 * If FamousEngine is currently in an update, requestUpdate
 * passes its argument to requestUpdateOnNextTick.
 *
 * @method
 *
 * @param {Object} requester an object with an onUpdate method
 *
 * @return {undefined} undefined
 */
FamousEngine.prototype.requestUpdate = function requestUpdate (requester) {
    if (!requester)
        throw new Error(
            'requestUpdate must be called with a class to be updated'
        );

    if (this._inUpdate) this.requestUpdateOnNextTick(requester);
    else this._updateQueue.push(requester);
};

/**
 * requestUpdateOnNextTick is requests an update on the next frame.
 * If FamousEngine is not currently in an update than it is functionally equivalent
 * to requestUpdate. This method should be used to prevent infinite loops where
 * a class is updated on the frame but needs to be updated again next frame.
 *
 * @method
 *
 * @param {Object} requester an object with an onUpdate method
 *
 * @return {undefined} undefined
 */
FamousEngine.prototype.requestUpdateOnNextTick = function requestUpdateOnNextTick (requester) {
    this._nextUpdateQueue.push(requester);
};

/**
 * postMessage sends a message queue into FamousEngine to be processed.
 * These messages will be interpreted and sent into the scene graph
 * as events if necessary.
 *
 * @method
 *
 * @param {Array} messages an array of commands.
 *
 * @return {FamousEngine} this
 */
FamousEngine.prototype.handleMessage = function handleMessage (messages) {
    if (!messages)
        throw new Error(
            'onMessage must be called with an array of messages'
        );

    var command;

    while (messages.length > 0) {
        command = messages.shift();
        switch (command) {
            case 'WITH':
                this.handleWith(messages);
                break;
            case 'FRAME':
                this.handleFrame(messages);
                break;
            default:
                throw new Error('received unknown command: ' + command);
        }
    }
    return this;
};

/**
 * handleWith is a method that takes an array of messages following the
 * WITH command. It'll then issue the next commands to the path specified
 * by the WITH command.
 *
 * @method
 *
 * @param {Array} messages array of messages.
 *
 * @return {FamousEngine} this
 */
FamousEngine.prototype.handleWith = function handleWith (messages) {
    var path = messages.shift();
    var command = messages.shift();

    switch (command) {
        case 'TRIGGER': // the TRIGGER command sends a UIEvent to the specified path
            var type = messages.shift();
            var ev = messages.shift();

            this.getContext(path).getDispatch().dispatchUIEvent(path, type, ev);
            break;
        default:
            throw new Error('received unknown command: ' + command);
    }
    return this;
};

/**
 * handleFrame is called when the renderers issue a FRAME command to
 * FamousEngine. FamousEngine will then step updating the scene graph to the current time.
 *
 * @method
 *
 * @param {Array} messages array of messages.
 *
 * @return {FamousEngine} this
 */
FamousEngine.prototype.handleFrame = function handleFrame (messages) {
    if (!messages) throw new Error('handleFrame must be called with an array of messages');
    if (!messages.length) throw new Error('FRAME must be sent with a time');

    this.step(messages.shift());
    return this;
};

/**
 * step updates the clock and the scene graph and then sends the draw commands
 * that accumulated in the update to the renderers.
 *
 * @method
 *
 * @param {Number} time current engine time
 *
 * @return {FamousEngine} this
 */
FamousEngine.prototype.step = function step (time) {
    if (time == null) throw new Error('step must be called with a time');

    this._clock.step(time);
    this._update();

    if (this._messages.length) {
        this._channel.sendMessage(this._messages);
        this._messages.length = 2;
    }

    return this;
};

/**
 * returns the context of a particular path. The context is looked up by the selector
 * portion of the path and is listed from the start of the string to the first
 * '/'.
 *
 * @method
 *
 * @param {String} selector the path to look up the context for.
 *
 * @return {Context | Undefined} the context if found, else undefined.
 */
FamousEngine.prototype.getContext = function getContext (selector) {
    if (!selector) throw new Error('getContext must be called with a selector');

    var index = selector.indexOf('/');
    selector = index === -1 ? selector : selector.substring(0, index);

    return this._scenes[selector];
};

/**
 * returns the instance of clock within famous.
 *
 * @method
 *
 * @return {Clock} FamousEngine's clock
 */
FamousEngine.prototype.getClock = function getClock () {
    return this._clock;
};

/**
 * queues a message to be transfered to the renderers.
 *
 * @method
 *
 * @param {Any} command Draw Command
 *
 * @return {FamousEngine} this
 */
FamousEngine.prototype.message = function message (command) {
    this._messages.push(command);
    return this;
};

/**
 * Creates a scene under which a scene graph could be built.
 *
 * @method
 *
 * @param {String} selector a dom selector for where the scene should be placed
 *
 * @return {Scene} a new instance of Scene.
 */
FamousEngine.prototype.createScene = function createScene (selector) {
    selector = selector || 'body';

    if (this._scenes[selector]) this._scenes[selector].dismount();
    this._scenes[selector] = new Scene(selector, this);
    return this._scenes[selector];
};

/**
 * Starts the engine running in the Main-Thread.
 * This effects **every** updateable managed by the Engine.
 *
 * @method
 *
 * @return {FamousEngine} this
 */
FamousEngine.prototype.startEngine = function startEngine () {
    this._channel.sendMessage(ENGINE_START);
    return this;
};

/**
 * Stops the engine running in the Main-Thread.
 * This effects **every** updateable managed by the Engine.
 *
 * @method
 *
 * @return {FamousEngine} this
 */
FamousEngine.prototype.stopEngine = function stopEngine () {
    this._channel.sendMessage(ENGINE_STOP);
    return this;
};

module.exports = new FamousEngine();

},{"../render-loops/RequestAnimationFrameLoop":31,"../renderers/Compositor":32,"../renderers/UIManager":34,"./Channel":2,"./Clock":3,"./Scene":8}],7:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/*jshint -W079 */

'use strict';

var Transform = require('./Transform');
var Size = require('./Size');

var TRANSFORM_PROCESSOR = new Transform();
var SIZE_PROCESSOR = new Size();

var IDENT = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
];

var ONES = [1, 1, 1];
var QUAT = [0, 0, 0, 1];

/**
 * Nodes define hierarchy and geometrical transformations. They can be moved
 * (translated), scaled and rotated.
 *
 * A Node is either mounted or unmounted. Unmounted nodes are detached from the
 * scene graph. Unmounted nodes have no parent node, while each mounted node has
 * exactly one parent. Nodes have an arbitary number of children, which can be
 * dynamically added using {@link Node#addChild}.
 *
 * Each Node has an arbitrary number of `components`. Those components can
 * send `draw` commands to the renderer or mutate the node itself, in which case
 * they define behavior in the most explicit way. Components that send `draw`
 * commands are considered `renderables`. From the node's perspective, there is
 * no distinction between nodes that send draw commands and nodes that define
 * behavior.
 *
 * Because of the fact that Nodes themself are very unopinioted (they don't
 * "render" to anything), they are often being subclassed in order to add e.g.
 * components at initialization to them. Because of this flexibility, they might
 * as well have been called `Entities`.
 *
 * @example
 * // create three detached (unmounted) nodes
 * var parent = new Node();
 * var child1 = new Node();
 * var child2 = new Node();
 *
 * // build an unmounted subtree (parent is still detached)
 * parent.addChild(child1);
 * parent.addChild(child2);
 *
 * // mount parent by adding it to the context
 * var context = Famous.createContext("body");
 * context.addChild(parent);
 *
 * @class Node
 * @constructor
 */
function Node () {
    this._calculatedValues = {
        transform: new Float32Array(IDENT),
        size: new Float32Array(3)
    };

    this._requestingUpdate = false;
    this._inUpdate = false;

    this._updateQueue = [];
    this._nextUpdateQueue = [];

    this._freedComponentIndicies = [];
    this._components = [];

    this._freedChildIndicies = [];
    this._children = [];

    this._parent = null;
    this._globalUpdater = null;

    this._lastEulerX = 0;
    this._lastEulerY = 0;
    this._lastEulerZ = 0;
    this._lastEuler = false;

    this.value = new Node.Spec();
}

Node.RELATIVE_SIZE = Size.RELATIVE;
Node.ABSOLUTE_SIZE = Size.ABSOLUTE;
Node.RENDER_SIZE = Size.RENDER;
Node.DEFAULT_SIZE = Size.DEFAULT;

/**
 * A Node spec holds the "data" associated with a Node.
 *
 * @class Spec
 * @constructor
 *
 * @property {String} location path to the node (e.g. "body/0/1")
 * @property {Object} showState
 * @property {Boolean} showState.mounted
 * @property {Boolean} showState.shown
 * @property {Number} showState.opacity
 * @property {Object} offsets
 * @property {Float32Array.<Number>} offsets.mountPoint
 * @property {Float32Array.<Number>} offsets.align
 * @property {Float32Array.<Number>} offsets.origin
 * @property {Object} vectors
 * @property {Float32Array.<Number>} vectors.position
 * @property {Float32Array.<Number>} vectors.rotation
 * @property {Float32Array.<Number>} vectors.scale
 * @property {Object} size
 * @property {Float32Array.<Number>} size.sizeMode
 * @property {Float32Array.<Number>} size.proportional
 * @property {Float32Array.<Number>} size.differential
 * @property {Float32Array.<Number>} size.absolute
 * @property {Float32Array.<Number>} size.render
 */
Node.Spec = function Spec () {
    this.location = null;
    this.showState = {
        mounted: false,
        shown: false,
        opacity: 1
    };
    this.offsets = {
        mountPoint: new Float32Array(3),
        align: new Float32Array(3),
        origin: new Float32Array(3)
    };
    this.vectors = {
        position: new Float32Array(3),
        rotation: new Float32Array(QUAT),
        scale: new Float32Array(ONES)
    };
    this.size = {
        sizeMode: new Float32Array([Size.RELATIVE, Size.RELATIVE, Size.RELATIVE]),
        proportional: new Float32Array(ONES),
        differential: new Float32Array(3),
        absolute: new Float32Array(3),
        render: new Float32Array(3)
    };
    this.UIEvents = [];
};

/**
 * Determine the node's location in the scene graph hierarchy.
 * A location of `body/0/1` can be interpreted as the following scene graph
 * hierarchy (ignoring siblings of ancestors and additional child nodes):
 *
 * `Context:body` -> `Node:0` -> `Node:1`, where `Node:1` is the node the
 * `getLocation` method has been invoked on.
 *
 * @method getLocation
 *
 * @return {String} location (path), e.g. `body/0/1`
 */
Node.prototype.getLocation = function getLocation () {
    return this.value.location;
};

/**
 * @alias getId
 *
 * @return {String} the path of the Node
 */
Node.prototype.getId = Node.prototype.getLocation;

/**
 * Globally dispatches the event using the Scene's Dispatch. All nodes will
 * receive the dispatched event.
 *
 * @method emit
 *
 * @param  {String} event   Event type.
 * @param  {Object} payload Event object to be dispatched.
 *
 * @return {Node} this
 */
Node.prototype.emit = function emit (event, payload) {
    var current = this;

    while (current !== current.getParent()) {
        current = current.getParent();
    }

    current.getDispatch().dispatch(event, payload);
    return this;
};

// THIS WILL BE DEPRECATED
Node.prototype.sendDrawCommand = function sendDrawCommand (message) {
    this._globalUpdater.message(message);
    return this;
};

/**
 * Recursively serializes the Node, including all previously added components.
 *
 * @method getValue
 *
 * @return {Object}     Serialized representation of the node, including
 *                      components.
 */
Node.prototype.getValue = function getValue () {
    var numberOfChildren = this._children.length;
    var numberOfComponents = this._components.length;
    var i = 0;

    var value = {
        location: this.value.location,
        spec: this.value,
        components: new Array(numberOfComponents),
        children: new Array(numberOfChildren)
    };

    for (; i < numberOfChildren ; i++)
        if (this._children[i] && this._children[i].getValue)
            value.children[i] = this._children[i].getValue();

    for (i = 0 ; i < numberOfComponents ; i++)
        if (this._components[i] && this._components[i].getValue)
            value.components[i] = this._components[i].getValue();

    return value;
};

/**
 * Similar to {@link Node#getValue}, but returns the actual "computed" value. E.g.
 * a proportional size of 0.5 might resolve into a "computed" size of 200px
 * (assuming the parent has a width of 400px).
 *
 * @method getComputedValue
 *
 * @return {Object}     Serialized representation of the node, including
 *                      children, excluding components.
 */
Node.prototype.getComputedValue = function getComputedValue () {
    var numberOfChildren = this._children.length;

    var value = {
        location: this.value.location,
        computedValues: this._calculatedValues,
        children: new Array(numberOfChildren)
    };

    for (var i = 0 ; i < numberOfChildren ; i++)
        value.children[i] = this._children[i].getComputedValue();

    return value;
};

/**
 * Retrieves all children of the current node.
 *
 * @method getChildren
 *
 * @return {Array.<Node>}   An array of children.
 */
Node.prototype.getChildren = function getChildren () {
    return this._children;
};

/**
 * Retrieves the parent of the current node. Unmounted nodes do not have a
 * parent node.
 *
 * @method getParent
 *
 * @return {Node}       Parent node.
 */
Node.prototype.getParent = function getParent () {
    return this._parent;
};

/**
 * Schedules the {@link Node#update} function of the node to be invoked on the
 * next frame (if no update during this frame has been scheduled already).
 * If the node is currently being updated (which means one of the requesters
 * invoked requestsUpdate while being updated itself), an update will be
 * scheduled on the next frame.
 *
 * @method requestUpdate
 *
 * @param  {Object} requester   If the requester has an `onUpdate` method, it
 *                              will be invoked during the next update phase of
 *                              the node.
 *
 * @return {Node} this
 */
Node.prototype.requestUpdate = function requestUpdate (requester) {
    if (this._inUpdate || !this.isMounted())
        return this.requestUpdateOnNextTick(requester);
    this._updateQueue.push(requester);
    if (!this._requestingUpdate) this._requestUpdate();
    return this;
};

/**
 * Schedules an update on the next tick. Similarily to
 * {@link Node#requestUpdate}, `requestUpdateOnNextTick` schedules the node's
 * `onUpdate` function to be invoked on the frame after the next invocation on
 * the node's onUpdate function.
 *
 * @method requestUpdateOnNextTick
 *
 * @param  {Object} requester   If the requester has an `onUpdate` method, it
 *                              will be invoked during the next update phase of
 *                              the node.
 *
 * @return {Node} this
 */
Node.prototype.requestUpdateOnNextTick = function requestUpdateOnNextTick (requester) {
    this._nextUpdateQueue.push(requester);
    return this;
};

/**
 * Get the object responsible for updating this node.
 *
 * @method
 *
 * @return {Object} The global updater.
 */
Node.prototype.getUpdater = function getUpdater () {
    return this._globalUpdater;
};

/**
 * Checks if the node is mounted. Unmounted nodes are detached from the scene
 * graph.
 *
 * @method isMounted
 *
 * @return {Boolean}    Boolean indicating whether the node is mounted or not.
 */
Node.prototype.isMounted = function isMounted () {
    return this.value.showState.mounted;
};

/**
 * Checks if the node is visible ("shown").
 *
 * @method isShown
 *
 * @return {Boolean}    Boolean indicating whether the node is visible
 *                      ("shown") or not.
 */
Node.prototype.isShown = function isShown () {
    return this.value.showState.shown;
};

/**
 * Determines the node's relative opacity.
 * The opacity needs to be within [0, 1], where 0 indicates a completely
 * transparent, therefore invisible node, whereas an opacity of 1 means the
 * node is completely solid.
 *
 * @method getOpacity
 *
 * @return {Number}         Relative opacity of the node.
 */
Node.prototype.getOpacity = function getOpacity () {
    return this.value.showState.opacity;
};

/**
 * Determines the node's previously set mount point.
 *
 * @method getMountPoint
 *
 * @return {Float32Array}   An array representing the mount point.
 */
Node.prototype.getMountPoint = function getMountPoint () {
    return this.value.offsets.mountPoint;
};

/**
 * Determines the node's previously set align.
 *
 * @method getAlign
 *
 * @return {Float32Array}   An array representing the align.
 */
Node.prototype.getAlign = function getAlign () {
    return this.value.offsets.align;
};

/**
 * Determines the node's previously set origin.
 *
 * @method getOrigin
 *
 * @return {Float32Array}   An array representing the origin.
 */
Node.prototype.getOrigin = function getOrigin () {
    return this.value.offsets.origin;
};

/**
 * Determines the node's previously set position.
 *
 * @method getPosition
 *
 * @return {Float32Array}   An array representing the position.
 */
Node.prototype.getPosition = function getPosition () {
    return this.value.vectors.position;
};

/**
 * Returns the node's current rotation
 *
 * @method getRotation
 *
 * @return {Float32Array} an array of four values, showing the rotation as a quaternion
 */
Node.prototype.getRotation = function getRotation () {
    return this.value.vectors.rotation;
};

/**
 * Returns the scale of the node
 *
 * @method
 *
 * @return {Float32Array} an array showing the current scale vector
 */
Node.prototype.getScale = function getScale () {
    return this.value.vectors.scale;
};

/**
 * Returns the current size mode of the node
 *
 * @method
 *
 * @return {Float32Array} an array of numbers showing the current size mode
 */
Node.prototype.getSizeMode = function getSizeMode () {
    return this.value.size.sizeMode;
};

/**
 * Returns the current proportional size
 *
 * @method
 *
 * @return {Float32Array} a vector 3 showing the current proportional size
 */
Node.prototype.getProportionalSize = function getProportionalSize () {
    return this.value.size.proportional;
};

/**
 * Returns the differential size of the node
 *
 * @method
 *
 * @return {Float32Array} a vector 3 showing the current differential size
 */
Node.prototype.getDifferentialSize = function getDifferentialSize () {
    return this.value.size.differential;
};

/**
 * Returns the absolute size of the node
 *
 * @method
 *
 * @return {Float32Array} a vector 3 showing the current absolute size of the node
 */
Node.prototype.getAbsoluteSize = function getAbsoluteSize () {
    return this.value.size.absolute;
};

/**
 * Returns the current Render Size of the node. Note that the render size
 * is asynchronous (will always be one frame behind) and needs to be explicitely
 * calculated by setting the proper size mode.
 *
 * @method
 *
 * @return {Float32Array} a vector 3 showing the current render size
 */
Node.prototype.getRenderSize = function getRenderSize () {
    return this.value.size.render;
};

/**
 * Returns the external size of the node
 *
 * @method
 *
 * @return {Float32Array} a vector 3 of the final calculated side of the node
 */
Node.prototype.getSize = function getSize () {
    return this._calculatedValues.size;
};

/**
 * Returns the current world transform of the node
 *
 * @method
 *
 * @return {Float32Array} a 16 value transform
 */
Node.prototype.getTransform = function getTransform () {
    return this._calculatedValues.transform;
};

/**
 * Get the list of the UI Events that are currently associated with this node
 *
 * @method
 *
 * @return {Array} an array of strings representing the current subscribed UI event of this node
 */
Node.prototype.getUIEvents = function getUIEvents () {
    return this.value.UIEvents;
};

/**
 * Adds a new child to this node. If this method is called with no argument it will
 * create a new node, however it can also be called with an existing node which it will
 * append to the node that this method is being called on. Returns the new or passed in node.
 *
 * @method
 *
 * @param {Node | void} child the node to appended or no node to create a new node.
 *
 * @return {Node} the appended node.
 */
Node.prototype.addChild = function addChild (child) {
    var index = child ? this._children.indexOf(child) : -1;
    child = child ? child : new Node();

    if (index === -1) {
        index = this._freedChildIndicies.length ? this._freedChildIndicies.pop() : this._children.length;
        this._children[index] = child;

        if (this.isMounted() && child.onMount) {
            var myId = this.getId();
            var childId = myId + '/' + index;
            child.onMount(this, childId);
        }

    }

    return child;
};

/**
 * Removes a child node from another node. The passed in node must be
 * a child of the node that this method is called upon.
 *
 * @method
 *
 * @param {Node} child node to be removed
 *
 * @return {Boolean} whether or not the node was successfully removed
 */
Node.prototype.removeChild = function removeChild (child) {
    var index = this._children.indexOf(child);
    var added = index !== -1;
    if (added) {
        this._freedChildIndicies.push(index);

        this._children[index] = null;

        if (this.isMounted() && child.onDismount)
            child.onDismount();
    }
    return added;
};

/**
 * Each component can only be added once per node.
 *
 * @method addComponent
 *
 * @param {Object} component    A component to be added.
 * @return {Number} index       The index at which the component has been
 *                              registered. Indices aren't necessarily
 *                              consecutive.
 */
Node.prototype.addComponent = function addComponent (component) {
    var index = this._components.indexOf(component);
    if (index === -1) {
        index = this._freedComponentIndicies.length ? this._freedComponentIndicies.pop() : this._components.length;
        this._components[index] = component;

        if (this.isMounted() && component.onMount)
            component.onMount(this, index);

        if (this.isShown() && component.onShow)
            component.onShow();
    }

    return index;
};

/**
 * @method  getComponent
 *
 * @param  {Number} index   Index at which the component has been registered
 *                          (using `Node#addComponent`).
 * @return {*}              The component registered at the passed in index (if
 *                          any).
 */
Node.prototype.getComponent = function getComponent (index) {
    return this._components[index];
};

/**
 * Removes a previously via {@link Node#addComponent} added component.
 *
 * @method removeComponent
 *
 * @param  {Object} component   An component that has previously been added
 *                              using {@link Node#addComponent}.
 *
 * @return {Node} this
 */
Node.prototype.removeComponent = function removeComponent (component) {
    var index = this._components.indexOf(component);
    if (index !== -1) {
        this._freedComponentIndicies.push(index);
        if (this.isShown() && component.onHide)
            component.onHide();

        if (this.isMounted() && component.onDismount)
            component.onDismount();

        this._components[index] = null;
    }
    return component;
};

/**
 * Subscribes a node to a UI Event. All components on the node
 * will have the opportunity to begin listening to that event
 * and alerting the scene graph.
 *
 * @method
 *
 * @param {String} eventName the name of the event
 *
 * @return {undefined} undefined
 */
Node.prototype.addUIEvent = function addUIEvent (eventName) {
    var UIEvents = this.getUIEvents();
    var components = this._components;
    var component;

    var added = UIEvents.indexOf(eventName) !== -1;
    if (!added) {
        UIEvents.push(eventName);
        for (var i = 0, len = components.length ; i < len ; i++) {
            component = components[i];
            if (component && component.onAddUIEvent) component.onAddUIEvent(eventName);
        }
    }
};

/**
 * Private method for the Node to request an update for itself.
 *
 * @method
 * @private
 *
 * @param {Boolean} force whether or not to force the update
 *
 * @return {undefined} undefined
 */
Node.prototype._requestUpdate = function _requestUpdate (force) {
    if (force || (!this._requestingUpdate && this._globalUpdater)) {
        this._globalUpdater.requestUpdate(this);
        this._requestingUpdate = true;
    }
};

/**
 * Private method to set an optional value in an array, and
 * request an update if this changes the value of the array.
 *
 * @method
 *
 * @param {Array} vec the array to insert the value into
 * @param {Number} index the index at which to insert the value
 * @param {Any} val the value to potentially insert (if not null or undefined)
 *
 * @return {Boolean} whether or not a new value was inserted.
 */
Node.prototype._vecOptionalSet = function _vecOptionalSet (vec, index, val) {
    if (val != null && vec[index] !== val) {
        vec[index] = val;
        if (!this._requestingUpdate) this._requestUpdate();
        return true;
    }
    return false;
};

/**
 * Shows the node, which is to say, calls onShow on all of the
 * node's components. Renderable components can then issue the
 * draw commands necessary to be shown.
 *
 * @method
 *
 * @return {Node} this
 */
Node.prototype.show = function show () {
    var i = 0;
    var items = this._components;
    var len = items.length;
    var item;

    this.value.showState.shown = true;

    for (; i < len ; i++) {
        item = items[i];
        if (item && item.onShow) item.onShow();
    }

    i = 0;
    items = this._children;
    len = items.length;

    for (; i < len ; i++) {
        item = items[i];
        if (item && item.onParentShow) item.onParentShow();
    }
    return this;
};

/**
 * Hides the node, which is to say, calls onHide on all of the
 * node's components. Renderable components can then issue
 * the draw commands necessary to be hidden
 *
 * @method
 *
 * @return {Node} this
 */
Node.prototype.hide = function hide () {
    var i = 0;
    var items = this._components;
    var len = items.length;
    var item;

    this.value.showState.shown = false;

    for (; i < len ; i++) {
        item = items[i];
        if (item && item.onHide) item.onHide();
    }

    i = 0;
    items = this._children;
    len = items.length;

    for (; i < len ; i++) {
        item = items[i];
        if (item && item.onParentHide) item.onParentHide();
    }
    return this;
};

/**
 * Sets the align value of the node. Will call onAlignChange
 * on all of the Node's components.
 *
 * @method
 *
 * @param {Number} x Align value in the x dimension.
 * @param {Number} y Align value in the y dimension.
 * @param {Number} z Align value in the z dimension.
 *
 * @return {Node} this
 */
Node.prototype.setAlign = function setAlign (x, y, z) {
    var vec3 = this.value.offsets.align;
    var propogate = false;

    propogate = this._vecOptionalSet(vec3, 0, x) || propogate;
    propogate = this._vecOptionalSet(vec3, 1, y) || propogate;
    if (z != null) propogate = this._vecOptionalSet(vec3, 2, (z - 0.5)) || propogate;

    if (propogate) {
        var i = 0;
        var list = this._components;
        var len = list.length;
        var item;
        x = vec3[0];
        y = vec3[1];
        z = vec3[2];
        for (; i < len ; i++) {
            item = list[i];
            if (item && item.onAlignChange) item.onAlignChange(x, y, z);
        }
    }
    return this;
};

/**
 * Sets the mount point value of the node. Will call onMountPointChange
 * on all of the node's components.
 *
 * @method
 *
 * @param {Number} x MountPoint value in x dimension
 * @param {Number} y MountPoint value in y dimension
 * @param {Number} z MountPoint value in z dimension
 *
 * @return {Node} this
 */
Node.prototype.setMountPoint = function setMountPoint (x, y, z) {
    var vec3 = this.value.offsets.mountPoint;
    var propogate = false;

    propogate = this._vecOptionalSet(vec3, 0, x) || propogate;
    propogate = this._vecOptionalSet(vec3, 1, y) || propogate;
    if (z != null) propogate = this._vecOptionalSet(vec3, 2, (z - 0.5)) || propogate;

    if (propogate) {
        var i = 0;
        var list = this._components;
        var len = list.length;
        var item;
        x = vec3[0];
        y = vec3[1];
        z = vec3[2];
        for (; i < len ; i++) {
            item = list[i];
            if (item && item.onMountPointChange) item.onMountPointChange(x, y, z);
        }
    }
    return this;
};

/**
 * Sets the origin value of the node. Will call onOriginChange
 * on all of the node's components.
 *
 * @method
 *
 * @param {Number} x Origin value in x dimension
 * @param {Number} y Origin value in y dimension
 * @param {Number} z Origin value in z dimension
 *
 * @return {Node} this
 */
Node.prototype.setOrigin = function setOrigin (x, y, z) {
    var vec3 = this.value.offsets.origin;
    var propogate = false;

    propogate = this._vecOptionalSet(vec3, 0, x) || propogate;
    propogate = this._vecOptionalSet(vec3, 1, y) || propogate;
    if (z != null) propogate = this._vecOptionalSet(vec3, 2, (z - 0.5)) || propogate;

    if (propogate) {
        var i = 0;
        var list = this._components;
        var len = list.length;
        var item;
        x = vec3[0];
        y = vec3[1];
        z = vec3[2];
        for (; i < len ; i++) {
            item = list[i];
            if (item && item.onOriginChange) item.onOriginChange(x, y, z);
        }
    }
    return this;
};

/**
 * Sets the position of the node. Will call onPositionChange
 * on all of the node's components.
 *
 * @method
 *
 * @param {Number} x Position in x
 * @param {Number} y Position in y
 * @param {Number} z Position in z
 *
 * @return {Node} this
 */
Node.prototype.setPosition = function setPosition (x, y, z) {
    var vec3 = this.value.vectors.position;
    var propogate = false;

    propogate = this._vecOptionalSet(vec3, 0, x) || propogate;
    propogate = this._vecOptionalSet(vec3, 1, y) || propogate;
    propogate = this._vecOptionalSet(vec3, 2, z) || propogate;

    if (propogate) {
        var i = 0;
        var list = this._components;
        var len = list.length;
        var item;
        x = vec3[0];
        y = vec3[1];
        z = vec3[2];
        for (; i < len ; i++) {
            item = list[i];
            if (item && item.onPositionChange) item.onPositionChange(x, y, z);
        }
    }

    return this;
};

/**
 * Sets the rotation of the node. Will call onRotationChange
 * on all of the node's components. This method takes either
 * Euler angles or a quaternion. If the fourth argument is undefined
 * Euler angles are assumed.
 *
 * @method
 *
 * @param {Number} x Either the rotation around the x axis or the magnitude in x of the axis of rotation.
 * @param {Number} y Either the rotation around the y axis or the magnitude in y of the axis of rotation.
 * @param {Number} z Either the rotation around the z axis or the magnitude in z of the axis of rotation.
 * @param {Number|undefined} w the amount of rotation around the axis of rotation, if a quaternion is specified.
 *
 * @return {Node} this
 */
Node.prototype.setRotation = function setRotation (x, y, z, w) {
    var quat = this.value.vectors.rotation;
    var propogate = false;
    var qx, qy, qz, qw;

    if (w != null) {
        qx = x;
        qy = y;
        qz = z;
        qw = w;
        this._lastEulerX = null;
        this._lastEulerY = null;
        this._lastEulerZ = null;
        this._lastEuler = false;
    }
    else {
        if (x == null || y == null || z == null) {
            if (this._lastEuler) {
                x = x == null ? this._lastEulerX : x;
                y = y == null ? this._lastEulerY : y;
                z = z == null ? this._lastEulerZ : z;
            }
            else {
                var sp = -2 * (quat[1] * quat[2] - quat[3] * quat[0]);

                if (Math.abs(sp) > 0.99999) {
                    y = y == null ? Math.PI * 0.5 * sp : y;
                    x = x == null ? Math.atan2(-quat[0] * quat[2] + quat[3] * quat[1], 0.5 - quat[1] * quat[1] - quat[2] * quat[2]) : x;
                    z = z == null ? 0 : z;
                }
                else {
                    y = y == null ? Math.asin(sp) : y;
                    x = x == null ? Math.atan2(quat[0] * quat[2] + quat[3] * quat[1], 0.5 - quat[0] * quat[0] - quat[1] * quat[1]) : x;
                    z = z == null ? Math.atan2(quat[0] * quat[1] + quat[3] * quat[2], 0.5 - quat[0] * quat[0] - quat[2] * quat[2]) : z;
                }
            }
        }

        var hx = x * 0.5;
        var hy = y * 0.5;
        var hz = z * 0.5;

        var sx = Math.sin(hx);
        var sy = Math.sin(hy);
        var sz = Math.sin(hz);
        var cx = Math.cos(hx);
        var cy = Math.cos(hy);
        var cz = Math.cos(hz);

        var sysz = sy * sz;
        var cysz = cy * sz;
        var sycz = sy * cz;
        var cycz = cy * cz;

        qx = sx * cycz + cx * sysz;
        qy = cx * sycz - sx * cysz;
        qz = cx * cysz + sx * sycz;
        qw = cx * cycz - sx * sysz;

        this._lastEuler = true;
        this._lastEulerX = x;
        this._lastEulerY = y;
        this._lastEulerZ = z;
    }

    propogate = this._vecOptionalSet(quat, 0, qx) || propogate;
    propogate = this._vecOptionalSet(quat, 1, qy) || propogate;
    propogate = this._vecOptionalSet(quat, 2, qz) || propogate;
    propogate = this._vecOptionalSet(quat, 3, qw) || propogate;

    if (propogate) {
        var i = 0;
        var list = this._components;
        var len = list.length;
        var item;
        x = quat[0];
        y = quat[1];
        z = quat[2];
        w = quat[3];
        for (; i < len ; i++) {
            item = list[i];
            if (item && item.onRotationChange) item.onRotationChange(x, y, z, w);
        }
    }
    return this;
};

/**
 * Sets the scale of the node. The default value is 1 in all dimensions.
 * The node's components will have onScaleChanged called on them.
 *
 * @method
 *
 * @param {Number} x Scale value in x
 * @param {Number} y Scale value in y
 * @param {Number} z Scale value in z
 *
 * @return {Node} this
 */
Node.prototype.setScale = function setScale (x, y, z) {
    var vec3 = this.value.vectors.scale;
    var propogate = false;

    propogate = this._vecOptionalSet(vec3, 0, x) || propogate;
    propogate = this._vecOptionalSet(vec3, 1, y) || propogate;
    propogate = this._vecOptionalSet(vec3, 2, z) || propogate;

    if (propogate) {
        var i = 0;
        var list = this._components;
        var len = list.length;
        var item;
        x = vec3[0];
        y = vec3[1];
        z = vec3[2];
        for (; i < len ; i++) {
            item = list[i];
            if (item && item.onScaleChange) item.onScaleChange(x, y, z);
        }
    }
    return this;
};

/**
 * Sets the value of the opacity of this node. All of the node's
 * components will have onOpacityChange called on them/
 *
 * @method
 *
 * @param {Number} val Value of the opacity. 1 is the default.
 *
 * @return {Node} this
 */
Node.prototype.setOpacity = function setOpacity (val) {
    if (val !== this.value.showState.opacity) {
        this.value.showState.opacity = val;
        if (!this._requestingUpdate) this._requestUpdate();

        var i = 0;
        var list = this._components;
        var len = list.length;
        var item;
        for (; i < len ; i++) {
            item = list[i];
            if (item && item.onOpacityChange) item.onOpacityChange(val);
        }
    }
    return this;
};

/**
 * Sets the size mode being used for determining the node's final width, height
 * and depth.
 * Size modes are a way to define the way the node's size is being calculated.
 * Size modes are enums set on the {@link Size} constructor (and aliased on
 * the Node).
 *
 * @example
 * node.setSizeMode(Node.RELATIVE_SIZE, Node.ABSOLUTE_SIZE, Node.ABSOLUTE_SIZE);
 * // Instead of null, any proportional height or depth can be passed in, since
 * // it would be ignored in any case.
 * node.setProportionalSize(0.5, null, null);
 * node.setAbsoluteSize(null, 100, 200);
 *
 * @method setSizeMode
 *
 * @param {SizeMode} x    The size mode being used for determining the size in
 *                        x direction ("width").
 * @param {SizeMode} y    The size mode being used for determining the size in
 *                        y direction ("height").
 * @param {SizeMode} z    The size mode being used for determining the size in
 *                        z direction ("depth").
 *
 * @return {Node} this
 */
Node.prototype.setSizeMode = function setSizeMode (x, y, z) {
    var vec3 = this.value.size.sizeMode;
    var propogate = false;

    if (x != null) propogate = this._resolveSizeMode(vec3, 0, x) || propogate;
    if (y != null) propogate = this._resolveSizeMode(vec3, 1, y) || propogate;
    if (z != null) propogate = this._resolveSizeMode(vec3, 2, z) || propogate;

    if (propogate) {
        var i = 0;
        var list = this._components;
        var len = list.length;
        var item;
        x = vec3[0];
        y = vec3[1];
        z = vec3[2];
        for (; i < len ; i++) {
            item = list[i];
            if (item && item.onSizeModeChange) item.onSizeModeChange(x, y, z);
        }
    }
    return this;
};

/**
 * A protected method that resolves string representations of size mode
 * to numeric values and applies them.
 *
 * @method
 *
 * @param {Array} vec the array to write size mode to
 * @param {Number} index the index to write to in the array
 * @param {String|Number} val the value to write
 *
 * @return {Bool} whether or not the sizemode has been changed for this index.
 */
Node.prototype._resolveSizeMode = function _resolveSizeMode (vec, index, val) {
    if (val.constructor === String) {
        switch (val.toLowerCase()) {
            case 'relative':
            case 'default':
                return this._vecOptionalSet(vec, index, 0);
            case 'absolute':
                return this._vecOptionalSet(vec, index, 1);
            case 'render':
                return this._vecOptionalSet(vec, index, 2);
            default: throw new Error('unknown size mode: ' + val);
        }
    }
    else return this._vecOptionalSet(vec, index, val);
};

/**
 * A proportional size defines the node's dimensions relative to its parents
 * final size.
 * Proportional sizes need to be within the range of [0, 1].
 *
 * @method setProportionalSize
 *
 * @param {Number} x    x-Size in pixels ("width").
 * @param {Number} y    y-Size in pixels ("height").
 * @param {Number} z    z-Size in pixels ("depth").
 *
 * @return {Node} this
 */
Node.prototype.setProportionalSize = function setProportionalSize (x, y, z) {
    var vec3 = this.value.size.proportional;
    var propogate = false;

    propogate = this._vecOptionalSet(vec3, 0, x) || propogate;
    propogate = this._vecOptionalSet(vec3, 1, y) || propogate;
    propogate = this._vecOptionalSet(vec3, 2, z) || propogate;

    if (propogate) {
        var i = 0;
        var list = this._components;
        var len = list.length;
        var item;
        x = vec3[0];
        y = vec3[1];
        z = vec3[2];
        for (; i < len ; i++) {
            item = list[i];
            if (item && item.onProportionalSizeChange) item.onProportionalSizeChange(x, y, z);
        }
    }
    return this;
};

/**
 * Differential sizing can be used to add or subtract an absolute size from an
 * otherwise proportionally sized node.
 * E.g. a differential width of `-10` and a proportional width of `0.5` is
 * being interpreted as setting the node's size to 50% of its parent's width
 * *minus* 10 pixels.
 *
 * @method setDifferentialSize
 *
 * @param {Number} x    x-Size to be added to the relatively sized node in
 *                      pixels ("width").
 * @param {Number} y    y-Size to be added to the relatively sized node in
 *                      pixels ("height").
 * @param {Number} z    z-Size to be added to the relatively sized node in
 *                      pixels ("depth").
 *
 * @return {Node} this
 */
Node.prototype.setDifferentialSize = function setDifferentialSize (x, y, z) {
    var vec3 = this.value.size.differential;
    var propogate = false;

    propogate = this._vecOptionalSet(vec3, 0, x) || propogate;
    propogate = this._vecOptionalSet(vec3, 1, y) || propogate;
    propogate = this._vecOptionalSet(vec3, 2, z) || propogate;

    if (propogate) {
        var i = 0;
        var list = this._components;
        var len = list.length;
        var item;
        x = vec3[0];
        y = vec3[1];
        z = vec3[2];
        for (; i < len ; i++) {
            item = list[i];
            if (item && item.onDifferentialSizeChange) item.onDifferentialSizeChange(x, y, z);
        }
    }
    return this;
};

/**
 * Sets the node's size in pixels, independent of its parent.
 *
 * @method setAbsoluteSize
 *
 * @param {Number} x    x-Size in pixels ("width").
 * @param {Number} y    y-Size in pixels ("height").
 * @param {Number} z    z-Size in pixels ("depth").
 *
 * @return {Node} this
 */
Node.prototype.setAbsoluteSize = function setAbsoluteSize (x, y, z) {
    var vec3 = this.value.size.absolute;
    var propogate = false;

    propogate = this._vecOptionalSet(vec3, 0, x) || propogate;
    propogate = this._vecOptionalSet(vec3, 1, y) || propogate;
    propogate = this._vecOptionalSet(vec3, 2, z) || propogate;

    if (propogate) {
        var i = 0;
        var list = this._components;
        var len = list.length;
        var item;
        x = vec3[0];
        y = vec3[1];
        z = vec3[2];
        for (; i < len ; i++) {
            item = list[i];
            if (item && item.onAbsoluteSizeChange) item.onAbsoluteSizeChange(x, y, z);
        }
    }
    return this;
};

/**
 * Private method for alerting all components and children that
 * this node's transform has changed.
 *
 * @method
 *
 * @param {Float32Array} transform The transform that has changed
 *
 * @return {undefined} undefined
 */
Node.prototype._transformChanged = function _transformChanged (transform) {
    var i = 0;
    var items = this._components;
    var len = items.length;
    var item;

    for (; i < len ; i++) {
        item = items[i];
        if (item && item.onTransformChange) item.onTransformChange(transform);
    }

    i = 0;
    items = this._children;
    len = items.length;

    for (; i < len ; i++) {
        item = items[i];
        if (item && item.onParentTransformChange) item.onParentTransformChange(transform);
    }
};

/**
 * Private method for alerting all components and children that
 * this node's size has changed.
 *
 * @method
 *
 * @param {Float32Array} size the size that has changed
 *
 * @return {undefined} undefined
 */
Node.prototype._sizeChanged = function _sizeChanged (size) {
    var i = 0;
    var items = this._components;
    var len = items.length;
    var item;

    for (; i < len ; i++) {
        item = items[i];
        if (item && item.onSizeChange) item.onSizeChange(size);
    }

    i = 0;
    items = this._children;
    len = items.length;

    for (; i < len ; i++) {
        item = items[i];
        if (item && item.onParentSizeChange) item.onParentSizeChange(size);
    }
};

/**
 * Method for getting the current frame. Will be deprecated.
 *
 * @method
 *
 * @return {Number} current frame
 */
Node.prototype.getFrame = function getFrame () {
    return this._globalUpdater.getFrame();
};

/**
 * returns an array of the components currently attached to this
 * node.
 *
 * @method getComponents
 *
 * @return {Array} list of components.
 */
Node.prototype.getComponents = function getComponents () {
    return this._components;
};

/**
 * Enters the node's update phase while updating its own spec and updating its components.
 *
 * @method update
 *
 * @param  {Number} time    high-resolution timestamp, usually retrieved using
 *                          requestAnimationFrame
 *
 * @return {Node} this
 */
Node.prototype.update = function update (time){
    this._inUpdate = true;
    var nextQueue = this._nextUpdateQueue;
    var queue = this._updateQueue;
    var item;

    while (nextQueue.length) queue.unshift(nextQueue.pop());

    while (queue.length) {
        item = this._components[queue.shift()];
        if (item && item.onUpdate) item.onUpdate(time);
    }

    var mySize = this.getSize();
    var myTransform = this.getTransform();
    var parent = this.getParent();
    var parentSize = parent.getSize();
    var parentTransform = parent.getTransform();
    var sizeChanged = SIZE_PROCESSOR.fromSpecWithParent(parentSize, this, mySize);

    var transformChanged = TRANSFORM_PROCESSOR.fromSpecWithParent(parentTransform, this.value, mySize, parentSize, myTransform);
    if (transformChanged) this._transformChanged(myTransform);
    if (sizeChanged) this._sizeChanged(mySize);

    this._inUpdate = false;
    this._requestingUpdate = false;

    if (!this.isMounted()) {
        // last update
        this._parent = null;
        this.value.location = null;
        this._globalUpdater = null;
    }
    else if (this._nextUpdateQueue.length) {
        this._globalUpdater.requestUpdateOnNextTick(this);
        this._requestingUpdate = true;
    }
    return this;
};

/**
 * Mounts the node and therefore its subtree by setting it as a child of the
 * passed in parent.
 *
 * @method mount
 *
 * @param  {Node} parent    parent node
 * @param  {String} myId    path to node (e.g. `body/0/1`)
 *
 * @return {Node} this
 */
Node.prototype.mount = function mount (parent, myId) {
    if (this.isMounted()) return this;
    var i = 0;
    var list = this._components;
    var len = list.length;
    var item;

    this._parent = parent;
    this._globalUpdater = parent.getUpdater();
    this.value.location = myId;
    this.value.showState.mounted = true;

    for (; i < len ; i++) {
        item = list[i];
        if (item && item.onMount) item.onMount(this, i);
    }

    i = 0;
    list = this._children;
    len = list.length;
    for (; i < len ; i++) {
        item = list[i];
        if (item && item.onParentMount) item.onParentMount(this, myId, i);
    }

    if (!this._requestingUpdate) this._requestUpdate(true);
    return this;
};

/**
 * Dismounts (detaches) the node from the scene graph by removing it as a
 * child of its parent.
 *
 * @method
 *
 * @return {Node} this
 */
Node.prototype.dismount = function dismount () {
    if (!this.isMounted()) return this;
    var i = 0;
    var list = this._components;
    var len = list.length;
    var item;

    this.value.showState.mounted = false;

    this._parent.removeChild(this);

    for (; i < len ; i++) {
        item = list[i];
        if (item && item.onDismount) item.onDismount();
    }

    i = 0;
    list = this._children;
    len = list.length;
    for (; i < len ; i++) {
        item = list[i];
        if (item && item.onParentDismount) item.onParentDismount();
    }

    if (!this._requestingUpdate) this._requestUpdate();
    return this;
};

/**
 * Function to be invoked by the parent as soon as the parent is
 * being mounted.
 *
 * @method onParentMount
 *
 * @param  {Node} parent        The parent node.
 * @param  {String} parentId    The parent id (path to parent).
 * @param  {Number} index       Id the node should be mounted to.
 *
 * @return {Node} this
 */
Node.prototype.onParentMount = function onParentMount (parent, parentId, index) {
    return this.mount(parent, parentId + '/' + index);
};

/**
 * Function to be invoked by the parent as soon as the parent is being
 * unmounted.
 *
 * @method onParentDismount
 *
 * @return {Node} this
 */
Node.prototype.onParentDismount = function onParentDismount () {
    return this.dismount();
};

/**
 * Method to be called in order to dispatch an event to the node and all its
 * components. Note that this doesn't recurse the subtree.
 *
 * @method receive
 *
 * @param  {String} type   The event type (e.g. "click").
 * @param  {Object} ev     The event payload object to be dispatched.
 *
 * @return {Node} this
 */
Node.prototype.receive = function receive (type, ev) {
    var i = 0;
    var list = this._components;
    var len = list.length;
    var item;
    for (; i < len ; i++) {
        item = list[i];
        if (item && item.onReceive) item.onReceive(type, ev);
    }
    return this;
};


/**
 * Private method to avoid accidentally passing arguments
 * to update events.
 *
 * @method
 *
 * @return {undefined} undefined
 */
Node.prototype._requestUpdateWithoutArgs = function _requestUpdateWithoutArgs () {
    if (!this._requestingUpdate) this._requestUpdate();
};

/**
 * A method to execute logic on update. Defaults to the
 * node's .update method.
 *
 * @method
 *
 * @param {Number} current time
 *
 * @return {undefined} undefined
 */
Node.prototype.onUpdate = Node.prototype.update;

/**
 * A method to execute logic when a parent node is shown. Delegates
 * to Node.show.
 *
 * @method
 *
 * @return {Node} this
 */
Node.prototype.onParentShow = Node.prototype.show;

/**
 * A method to execute logic when the parent is hidden. Delegates
 * to Node.hide.
 *
 * @method
 *
 * @return {Node} this
 */
Node.prototype.onParentHide = Node.prototype.hide;

/**
 * A method to execute logic when the parent transform changes.
 * Delegates to Node._requestUpdateWithoutArgs.
 *
 * @method
 *
 * @return {undefined} undefined
 */
Node.prototype.onParentTransformChange = Node.prototype._requestUpdateWithoutArgs;

/**
 * A method to execute logic when the parent size changes.
 * Delegates to Node._requestUpdateWIthoutArgs.
 *
 * @method
 *
 * @return {undefined} undefined
 */
Node.prototype.onParentSizeChange = Node.prototype._requestUpdateWithoutArgs;

/**
 * A method to execute logic when the node something wants
 * to show the node. Delegates to Node.show.
 *
 * @method
 *
 * @return {Node} this
 */
Node.prototype.onShow = Node.prototype.show;

/**
 * A method to execute logic when something wants to hide this
 * node. Delegates to Node.hide.
 *
 * @method
 *
 * @return {Node} this
 */
Node.prototype.onHide = Node.prototype.hide;

/**
 * A method which can execute logic when this node is added to
 * to the scene graph. Delegates to mount.
 *
 * @method
 *
 * @return {Node} this
 */
Node.prototype.onMount = Node.prototype.mount;

/**
 * A method which can execute logic when this node is removed from
 * the scene graph. Delegates to Node.dismount.
 *
 * @method
 *
 * @return {Node} this
 */
Node.prototype.onDismount = Node.prototype.dismount;

/**
 * A method which can execute logic when this node receives
 * an event from the scene graph. Delegates to Node.receive.
 *
 * @method
 *
 * @param {String} event name
 * @param {Object} payload
 *
 * @return {undefined} undefined
 */
Node.prototype.onReceive = Node.prototype.receive;

module.exports = Node;

},{"./Size":9,"./Transform":10}],8:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/*jshint -W079 */

'use strict';

var Dispatch = require('./Dispatch');
var Node = require('./Node');
var Size = require('./Size');

/**
 * Scene is the bottom of the scene graph. It is its own
 * parent and provides the global updater to the scene graph.
 *
 * @class Scene
 * @constructor
 *
 * @param {String} selector a string which is a dom selector
 *                 signifying which dom element the context
 *                 should be set upon
 * @param {Famous} updater a class which conforms to Famous' interface
 *                 it needs to be able to send methods to
 *                 the renderers and update nodes in the scene graph
 */
function Scene (selector, updater) {
    if (!selector) throw new Error('Scene needs to be created with a DOM selector');
    if (!updater) throw new Error('Scene needs to be created with a class like Famous');

    Node.call(this);         // Scene inherits from node

    this._updater = updater; // The updater that will both
                             // send messages to the renderers
                             // and update dirty nodes

    this._dispatch = new Dispatch(this); // instantiates a dispatcher
                                         // to send events to the scene
                                         // graph below this context

    this._selector = selector; // reference to the DOM selector
                               // that represents the element
                               // in the dom that this context
                               // inhabits

    this.onMount(this, selector); // Mount the context to itself
                                  // (it is its own parent)

    this._updater                  // message a request for the dom
        .message('NEED_SIZE_FOR')  // size of the context so that
        .message(selector);        // the scene graph has a total size

    this.show(); // the context begins shown (it's already present in the dom)

}

// Scene inherits from node
Scene.prototype = Object.create(Node.prototype);
Scene.prototype.constructor = Scene;

/**
 * Scene getUpdater function returns the passed in updater
 *
 * @return {Famous} the updater for this Scene
 */
Scene.prototype.getUpdater = function getUpdater () {
    return this._updater;
};

/**
 * Returns the selector that the context was instantiated with
 *
 * @return {String} dom selector
 */
Scene.prototype.getSelector = function getSelector () {
    return this._selector;
};

/**
 * Returns the dispatcher of the context. Used to send events
 * to the nodes in the scene graph.
 *
 * @return {Dispatch} the Scene's Dispatch
 */
Scene.prototype.getDispatch = function getDispatch () {
    return this._dispatch;
};

/**
 * Receives an event. If the event is 'CONTEXT_RESIZE' it sets the size of the scene
 * graph to the payload, which must be an array of numbers of at least
 * length three representing the pixel size in 3 dimensions.
 *
 * @param {String} event the name of the event being received
 * @param {*} payload the object being sent
 *
 * @return {undefined} undefined
 */
Scene.prototype.onReceive = function onReceive (event, payload) {
    // TODO: In the future the dom element that the context is attached to
    // should have a representation as a component. It would be render sized
    // and the context would receive its size the same way that any render size
    // component receives its size.
    if (event === 'CONTEXT_RESIZE') {

        if (payload.length < 2)
            throw new Error(
                    'CONTEXT_RESIZE\'s payload needs to be at least a pair' +
                    ' of pixel sizes'
            );

        this.setSizeMode(Size.ABSOLUTE, Size.ABSOLUTE, Size.ABSOLUTE);
        this.setAbsoluteSize(payload[0],
                             payload[1],
                             payload[2] ? payload[2] : 0);

    }
};

module.exports = Scene;


},{"./Dispatch":4,"./Node":7,"./Size":9}],9:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * The Size class is responsible for processing Size from a node
 * @constructor Size
 */
function Size () {
    this._size = new Float32Array(3);
}

// an enumeration of the different types of size modes
Size.RELATIVE = 0;
Size.ABSOLUTE = 1;
Size.RENDER = 2;
Size.DEFAULT = Size.RELATIVE;

/**
 * fromSpecWithParent takes the parent node's size, the target node's spec,
 * and a target array to write to. Using the node's size mode it calculates
 * a final size for the node from the node's spec. Returns whether or not
 * the final size has changed from its last value.
 *
 * @param {Array} parentSize parent node's calculated size
 * @param {Node.Spec} node the target node's spec
 * @param {Array} target an array to write the result to
 *
 * @return {Boolean} true if the size of the node has changed.
 */
Size.prototype.fromSpecWithParent = function fromSpecWithParent (parentSize, node, target) {
    var spec = node.getValue().spec;
    var components = node.getComponents();
    var mode = spec.size.sizeMode;
    var prev;
    var changed = false;
    var len = components.length;
    var j;
    for (var i = 0 ; i < 3 ; i++) {
        switch (mode[i]) {
            case Size.RELATIVE:
                prev = target[i];
                target[i] = parentSize[i] * spec.size.proportional[i] + spec.size.differential[i];
                break;
            case Size.ABSOLUTE:
                prev = target[i];
                target[i] = spec.size.absolute[i];
                break;
            case Size.RENDER:
                var candidate;
                var component;
                for (j = 0; j < len ; j++) {
                    component = components[j];
                    if (component && component.getRenderSize) {
                        candidate = component.getRenderSize()[i];
                        prev = target[i];
                        target[i] = target[i] < candidate || target[i] === 0 ? candidate : target[i];
                    }
                }
                break;
        }
        changed = changed || prev !== target[i];
    }
    return changed;
};

module.exports = Size;

},{}],10:[function(require,module,exports){
/**
 * The MIT License (MIT)
 * 
 * Copyright (c) 2015 Famous Industries Inc.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * The transform class is responsible for calculating the transform of a particular
 * node from the data on the node and its parent
 *
 * @constructor Transform
 */
function Transform () {
    this._matrix = new Float32Array(16);
}

/**
 * Returns the last calculated transform
 *
 * @return {Array} a transform
 */
Transform.prototype.get = function get () {
    return this._matrix;
};

/**
 * Uses the parent transform, the node's spec, the node's size, and the parent's size
 * to calculate a final transform for the node. Returns true if the transform has changed.
 *
 * @param {Array} parentMatrix the parent matrix
 * @param {Node.Spec} spec the target node's spec
 * @param {Array} mySize the size of the node
 * @param {Array} parentSize the size of the parent
 * @param {Array} target the target array to write the resulting transform to
 *
 * @return {Boolean} whether or not the transform changed
 */
Transform.prototype.fromSpecWithParent = function fromSpecWithParent (parentMatrix, spec, mySize, parentSize, target) {
    target = target ? target : this._matrix;

    // local cache of everything
    var t00         = target[0];
    var t01         = target[1];
    var t02         = target[2];
    var t10         = target[4];
    var t11         = target[5];
    var t12         = target[6];
    var t20         = target[8];
    var t21         = target[9];
    var t22         = target[10];
    var t30         = target[12];
    var t31         = target[13];
    var t32         = target[14];
    var p00         = parentMatrix[0];
    var p01         = parentMatrix[1];
    var p02         = parentMatrix[2];
    var p10         = parentMatrix[4];
    var p11         = parentMatrix[5];
    var p12         = parentMatrix[6];
    var p20         = parentMatrix[8];
    var p21         = parentMatrix[9];
    var p22         = parentMatrix[10];
    var p30         = parentMatrix[12];
    var p31         = parentMatrix[13];
    var p32         = parentMatrix[14];
    var posX        = spec.vectors.position[0];
    var posY        = spec.vectors.position[1];
    var posZ        = spec.vectors.position[2];
    var rotX        = spec.vectors.rotation[0];
    var rotY        = spec.vectors.rotation[1];
    var rotZ        = spec.vectors.rotation[2];
    var rotW        = spec.vectors.rotation[3];
    var scaleX      = spec.vectors.scale[0];
    var scaleY      = spec.vectors.scale[1];
    var scaleZ      = spec.vectors.scale[2];
    var alignX      = spec.offsets.align[0] * parentSize[0];
    var alignY      = spec.offsets.align[1] * parentSize[1];
    var alignZ      = spec.offsets.align[2] * parentSize[2];
    var mountPointX = spec.offsets.mountPoint[0] * mySize[0];
    var mountPointY = spec.offsets.mountPoint[1] * mySize[1];
    var mountPointZ = spec.offsets.mountPoint[2] * mySize[2];
    var originX     = spec.offsets.origin[0] * mySize[0];
    var originY     = spec.offsets.origin[1] * mySize[1];
    var originZ     = spec.offsets.origin[2] * mySize[2];

    var wx = rotW * rotX;
    var wy = rotW * rotY;
    var wz = rotW * rotZ;
    var xx = rotX * rotX;
    var yy = rotY * rotY;
    var zz = rotZ * rotZ;
    var xy = rotX * rotY;
    var xz = rotX * rotZ;
    var yz = rotY * rotZ;

    var rs0 = (1 - 2 * (yy + zz)) * scaleX;
    var rs1 = (2 * (xy + wz)) * scaleX;
    var rs2 = (2 * (xz - wy)) * scaleX;
    var rs3 = (2 * (xy - wz)) * scaleY;
    var rs4 = (1 - 2 * (xx + zz)) * scaleY;
    var rs5 = (2 * (yz + wx)) * scaleY;
    var rs6 = (2 * (xz + wy)) * scaleZ;
    var rs7 = (2 * (yz - wx)) * scaleZ;
    var rs8 = (1 - 2 * (xx + yy)) * scaleZ;

    var tx = alignX + posX - mountPointX + originX - (rs0 * originX + rs3 * originY + rs6 * originZ);
    var ty = alignY + posY - mountPointY + originY - (rs1 * originX + rs4 * originY + rs7 * originZ);
    var tz = alignZ + posZ - mountPointZ + originZ - (rs2 * originX + rs5 * originY + rs8 * originZ);

    target[0] = p00 * rs0 + p10 * rs1 + p20 * rs2;
    target[1] = p01 * rs0 + p11 * rs1 + p21 * rs2;
    target[2] = p02 * rs0 + p12 * rs1 + p22 * rs2;
    target[3] = 0;
    target[4] = p00 * rs3 + p10 * rs4 + p20 * rs5;
    target[5] = p01 * rs3 + p11 * rs4 + p21 * rs5;
    target[6] = p02 * rs3 + p12 * rs4 + p22 * rs5;
    target[7] = 0;
    target[8] = p00 * rs6 + p10 * rs7 + p20 * rs8;
    target[9] = p01 * rs6 + p11 * rs7 + p21 * rs8;
    target[10] = p02 * rs6 + p12 * rs7 + p22 * rs8;
    target[11] = 0;
    target[12] = p00 * tx + p10 * ty + p20 * tz + p30;
    target[13] = p01 * tx + p11 * ty + p21 * tz + p31;
    target[14] = p02 * tx + p12 * ty + p22 * tz + p32;
    target[15] = 1;

    return t00 !== target[0] ||
        t01 !== target[1] ||
        t02 !== target[2] ||
        t10 !== target[4] ||
        t11 !== target[5] ||
        t12 !== target[6] ||
        t20 !== target[8] ||
        t21 !== target[9] ||
        t22 !== target[10] ||
        t30 !== target[12] ||
        t31 !== target[13] ||
        t32 !== target[14];

};

module.exports = Transform;

},{}],11:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var CallbackStore = require('../utilities/CallbackStore');

var RENDER_SIZE = 2;

/**
 * A DOMElement is a component that can be added to a Node with the
 * purpose of sending draw commands to the renderer. Renderables send draw commands
 * to through their Nodes to the Compositor where they are acted upon.
 *
 * @class DOMElement
 *
 * @param {Node} node                   The Node to which the `DOMElement`
 *                                      renderable should be attached to.
 * @param {Object} options              Initial options used for instantiating
 *                                      the Node.
 * @param {Object} options.properties   CSS properties that should be added to
 *                                      the actual DOMElement on the initial draw.
 * @param {Object} options.attributes   Element attributes that should be added to
 *                                      the actual DOMElement.
 * @param {String} options.id           String to be applied as 'id' of the actual
 *                                      DOMElement.
 * @param {String} options.content      String to be applied as the content of the
 *                                      actual DOMElement.
 * @param {Boolean} options.cutout      Specifies the presence of a 'cutout' in the
 *                                      WebGL canvas over this element which allows
 *                                      for DOM and WebGL layering.  On by default.
 */
function DOMElement(node, options) {
    if (!node) throw new Error('DOMElement must be instantiated on a node');

    this._node = node;

    this._requestingUpdate = false;
    this._renderSized = false;
    this._requestRenderSize = false;

    this._changeQueue = [];

    this._UIEvents = node.getUIEvents().slice(0);
    this._classes = ['famous-dom-element'];
    this._requestingEventListeners = [];
    this._styles = {};

    this.setProperty('display', node.isShown() ? 'none' : 'block');
    this.onOpacityChange(node.getOpacity());

    this._attributes = {};
    this._content = '';

    this._tagName = options && options.tagName ? options.tagName : 'div';
    this._id = node.addComponent(this);

    this._renderSize = [0, 0, 0];

    this._callbacks = new CallbackStore();

    if (!options) return;

    var i;
    var key;

    if (options.classes)
        for (i = 0; i < options.classes.length; i++)
            this.addClass(options.classes[i]);

    if (options.attributes)
        for (key in options.attributes)
            this.setAttribute(key, options.attributes[key]);

    if (options.properties)
        for (key in options.properties)
            this.setProperty(key, options.properties[key]);

    if (options.id) this.setId(options.id);
    if (options.content) this.setContent(options.content);
    if (options.cutout === false) this.setCutoutState(options.cutout);
}

/**
 * Serializes the state of the DOMElement.
 *
 * @method
 *
 * @return {Object} serialized interal state
 */
DOMElement.prototype.getValue = function getValue() {
    return {
        classes: this._classes,
        styles: this._styles,
        attributes: this._attributes,
        content: this._content,
        id: this._attributes.id,
        tagName: this._tagName
    };
};

/**
 * Method to be invoked by the node as soon as an update occurs. This allows
 * the DOMElement renderable to dynamically react to state changes on the Node.
 *
 * This flushes the internal draw command queue by sending individual commands
 * to the node using `sendDrawCommand`.
 *
 * @method
 *
 * @return {undefined} undefined
 */
DOMElement.prototype.onUpdate = function onUpdate() {
    var node = this._node;
    var queue = this._changeQueue;
    var len = queue.length;

    if (len && node) {
        node.sendDrawCommand('WITH');
        node.sendDrawCommand(node.getLocation());

        while (len--) node.sendDrawCommand(queue.shift());
        if (this._requestRenderSize) {
            node.sendDrawCommand('DOM_RENDER_SIZE');
            node.sendDrawCommand(node.getLocation());
            this._requestRenderSize = false;
        }

    }

    this._requestingUpdate = false;
};

/**
 * Method to be invoked by the Node as soon as the node (or any of its
 * ancestors) is being mounted.
 *
 * @method onMount
 *
 * @param {Node} node      Parent node to which the component should be added.
 * @param {String} id      Path at which the component (or node) is being
 *                          attached. The path is being set on the actual
 *                          DOMElement as a `data-fa-path`-attribute.
 *
 * @return {undefined} undefined
 */
DOMElement.prototype.onMount = function onMount(node, id) {
    this._node = node;
    this._id = id;
    this._UIEvents = node.getUIEvents().slice(0);
    this.draw();
    this.setAttribute('data-fa-path', node.getLocation());
};

/**
 * Method to be invoked by the Node as soon as the node is being dismounted
 * either directly or by dismounting one of its ancestors.
 *
 * @method
 *
 * @return {undefined} undefined
 */
DOMElement.prototype.onDismount = function onDismount() {
    this.setProperty('display', 'none');
    this.setAttribute('data-fa-path', '');
    this._initialized = false;
};

/**
 * Method to be invoked by the node as soon as the DOMElement is being shown.
 * This results into the DOMElement setting the `display` property to `block`
 * and therefore visually showing the corresponding DOMElement (again).
 *
 * @method
 *
 * @return {undefined} undefined
 */
DOMElement.prototype.onShow = function onShow() {
    this.setProperty('display', 'block');
};

/**
 * Method to be invoked by the node as soon as the DOMElement is being hidden.
 * This results into the DOMElement setting the `display` property to `none`
 * and therefore visually hiding the corresponding DOMElement (again).
 *
 * @method
 *
 * @return {undefined} undefined
 */
DOMElement.prototype.onHide = function onHide() {
    this.setProperty('display', 'none');
};

/**
 * Enables or disables WebGL 'cutout' for this element, which affects
 * how the element is layered with WebGL objects in the scene.  This is designed
 * mainly as a way to acheive
 *
 * @method
 *
 * @param {Boolean} usesCutout  The presence of a WebGL 'cutout' for this element.
 *
 * @return {undefined} undefined
 */
DOMElement.prototype.setCutoutState = function setCutoutState(usesCutout) {
    this._changeQueue.push('GL_CUTOUT_STATE', usesCutout);

    if (this._initialized) this._requestUpdate();
};

/**
 * Method to be invoked by the node as soon as the transform matrix associated
 * with the node changes. The DOMElement will react to transform changes by sending
 * `CHANGE_TRANSFORM` commands to the `DOMRenderer`.
 *
 * @method
 *
 * @param {Float32Array} transform The final transform matrix
 *
 * @return {undefined} undefined
 */
DOMElement.prototype.onTransformChange = function onTransformChange (transform) {
    this._changeQueue.push('CHANGE_TRANSFORM');
    for (var i = 0, len = transform.length ; i < len ; i++)
        this._changeQueue.push(transform[i]);

    this.onUpdate();
};

/**
 * Method to be invoked by the node as soon as its computed size changes.
 *
 * @method
 *
 * @param {Float32Array} size Size of the Node in pixels
 *
 * @return {DOMElement} this
 */
DOMElement.prototype.onSizeChange = function onSizeChange(size) {
    var sizeMode = this._node.getSizeMode();
    var sizedX = sizeMode[0] !== RENDER_SIZE;
    var sizedY = sizeMode[1] !== RENDER_SIZE;
    if (this._initialized)
        this._changeQueue.push('CHANGE_SIZE',
            sizedX ? size[0] : sizedX,
            sizedY ? size[1] : sizedY);

    if (!this._requestingUpdate) this._requestUpdate();
    return this;
};

/**
 * Method to be invoked by the node as soon as its opacity changes
 *
 * @method
 *
 * @param {Number} opacity The new opacity, as a scalar from 0 to 1
 *
 * @return {DOMElement} this
 */
DOMElement.prototype.onOpacityChange = function onOpacityChange(opacity) {
    return this.setProperty('opacity', opacity);
};

/**
 * Method to be invoked by the node as soon as a new UIEvent is being added.
 * This results into an `ADD_EVENT_LISTENER` command being sent.
 *
 * @param {String} UIEvent UIEvent to be subscribed to (e.g. `click`)
 *
 * @return {undefined} undefined
 */
DOMElement.prototype.onAddUIEvent = function onAddUIEvent(UIEvent) {
    if (this._UIEvents.indexOf(UIEvent) === -1) {
        this._subscribe(UIEvent);
        this._UIEvents.push(UIEvent);
    }
    else if (this._inDraw) {
        this._subscribe(UIEvent);
    }
    return this;
};

/**
 * Appends an `ADD_EVENT_LISTENER` command to the command queue.
 *
 * @method
 * @private
 *
 * @param {String} UIEvent Event type (e.g. `click`)
 *
 * @return {undefined} undefined
 */
DOMElement.prototype._subscribe = function _subscribe (UIEvent) {
    if (this._initialized) {
        this._changeQueue.push('SUBSCRIBE', UIEvent, true);
    }
    if (!this._requestingUpdate) this._requestUpdate();
};

/**
 * Method to be invoked by the node as soon as the underlying size mode
 * changes. This results into the size being fetched from the node in
 * order to update the actual, rendered size.
 *
 * @method
 *
 * @param {Number} x the sizing mode in use for determining size in the x direction
 * @param {Number} y the sizing mode in use for determining size in the y direction
 * @param {Number} z the sizing mode in use for determining size in the z direction
 *
 * @return {undefined} undefined
 */
DOMElement.prototype.onSizeModeChange = function onSizeModeChange(x, y, z) {
    if (x === RENDER_SIZE || y === RENDER_SIZE || z === RENDER_SIZE) {
        this._renderSized = true;
        this._requestRenderSize = true;
    }
    this.onSizeChange(this._node.getSize());
};

/**
 * Method to be retrieve the rendered size of the DOM element that is
 * drawn for this node.
 *
 * @method
 *
 * @return {Array} size of the rendered DOM element in pixels
 */
DOMElement.prototype.getRenderSize = function getRenderSize() {
    return this._renderSize;
};

/**
 * Method to have the component request an update from its Node
 *
 * @method
 * @private
 *
 * @return {undefined} undefined
 */
DOMElement.prototype._requestUpdate = function _requestUpdate() {
    if (!this._requestingUpdate) {
        this._node.requestUpdate(this._id);
        this._requestingUpdate = true;
    }
};

/**
 * Initializes the DOMElement by sending the `INIT_DOM` command. This creates
 * or reallocates a new Element in the actual DOM hierarchy.
 *
 * @method
 *
 * @return {undefined} undefined
 */
DOMElement.prototype.init = function init() {
    this._changeQueue.push('INIT_DOM', this._tagName);
    this._initialized = true;
    this.onTransformChange(this._node.getTransform());
    this.onSizeChange(this._node.getSize());
    if (!this._requestingUpdate) this._requestUpdate();
};

/**
 * Sets the id attribute of the DOMElement.
 *
 * @method
 *
 * @param {String} id New id to be set
 *
 * @return {DOMElement} this
 */
DOMElement.prototype.setId = function setId (id) {
    this.setAttribute('id', id);
    return this;
};

/**
 * Adds a new class to the internal class list of the underlying Element in the
 * DOM.
 *
 * @method
 *
 * @param {String} value New class name to be added
 *
 * @return {DOMElement} this
 */
DOMElement.prototype.addClass = function addClass (value) {
    if (this._classes.indexOf(value) < 0) {
        if (this._initialized) this._changeQueue.push('ADD_CLASS', value);
        this._classes.push(value);
        if (!this._requestingUpdate) this._requestUpdate();
        if (this._renderSized) this._requestRenderSize = true;
        return this;
    }

    if (this._inDraw) {
        if (this._initialized) this._changeQueue.push('ADD_CLASS', value);
        if (!this._requestingUpdate) this._requestUpdate();
    }
    return this;
};

/**
 * Removes a class from the DOMElement's classList.
 *
 * @method
 *
 * @param {String} value Class name to be removed
 *
 * @return {DOMElement} this
 */
DOMElement.prototype.removeClass = function removeClass (value) {
    var index = this._classes.indexOf(value);

    if (index < 0) return this;

    this._changeQueue.push('REMOVE_CLASS', value);

    this._classes.splice(index, 1);

    if (!this._requestingUpdate) this._requestUpdate();
    return this;
};


/**
 * Checks if the DOMElement has the passed in class.
 *
 * @method
 *
 * @param {String} value The class name
 *
 * @return {Boolean} Boolean value indicating whether the passed in class name is in the DOMElement's class list.
 */
DOMElement.prototype.hasClass = function hasClass (value) {
    return this._classes.indexOf(value) !== -1;
};

/**
 * Sets an attribute of the DOMElement.
 *
 * @method
 *
 * @param {String} name Attribute key (e.g. `src`)
 * @param {String} value Attribute value (e.g. `http://famo.us`)
 *
 * @return {DOMElement} this
 */
DOMElement.prototype.setAttribute = function setAttribute (name, value) {
    if (this._attributes[name] !== value || this._inDraw) {
        this._attributes[name] = value;
        if (this._initialized) this._changeQueue.push('CHANGE_ATTRIBUTE', name, value);
        if (!this._requestUpdate) this._requestUpdate();
    }

    return this;
};

/**
 * Sets a CSS property
 *
 * @chainable
 *
 * @param {String} name  Name of the CSS rule (e.g. `background-color`)
 * @param {String} value Value of CSS property (e.g. `red`)
 *
 * @return {DOMElement} this
 */
DOMElement.prototype.setProperty = function setProperty (name, value) {
    if (this._styles[name] !== value || this._inDraw) {
        this._styles[name] = value;
        if (this._initialized) this._changeQueue.push('CHANGE_PROPERTY', name, value);
        if (!this._requestingUpdate) this._requestUpdate();
        if (this._renderSized) this._requestRenderSize = true;
    }

    return this;
};

/**
 * Sets the content of the DOMElement. This is using `innerHTML`, escaping user
 * generated content is therefore essential for security purposes.
 *
 * @method
 *
 * @param {String} content Content to be set using `.innerHTML = ...`
 *
 * @return {DOMElement} this
 */
DOMElement.prototype.setContent = function setContent (content) {
    if (this._content !== content || this._inDraw) {
        this._content = content;
        if (this._initialized) this._changeQueue.push('CHANGE_CONTENT', content);
        if (!this._requestingUpdate) this._requestUpdate();
        if (this._renderSized) this._requestRenderSize = true;
    }

    return this;
};

/**
 * Subscribes to a DOMElement using.
 *
 * @method on
 *
 * @param {String} event       The event type (e.g. `click`).
 * @param {Function} listener  Handler function for the specified event type
 *                              in which the payload event object will be
 *                              passed into.
 *
 * @return {Function} A function to call if you want to remove the callback
 */
DOMElement.prototype.on = function on (event, listener) {
    return this._callbacks.on(event, listener);
};

/**
 * Function to be invoked by the Node whenever an event is being received.
 * There are two different ways to subscribe for those events:
 *
 * 1. By overriding the onReceive method (and possibly using `switch` in order
 *     to differentiate between the different event types).
 * 2. By using DOMElement and using the built-in CallbackStore.
 *
 * @method
 *
 * @param {String} event Event type (e.g. `click`)
 * @param {Object} payload Event object.
 *
 * @return {undefined} undefined
 */
DOMElement.prototype.onReceive = function onReceive (event, payload) {
    if (event === 'resize') {
        this._renderSize[0] = payload.val[0];
        this._renderSize[1] = payload.val[1];
        if (!this._requestingUpdate) this._requestUpdate();
    }
    this._callbacks.trigger(event, payload);
};

/**
 * The draw function is being used in order to allow mutating the DOMElement
 * before actually mounting the corresponding node.
 *
 * @method
 * @private
 *
 * @return {undefined} undefined
 */
DOMElement.prototype.draw = function draw() {
    var key;
    var i;
    var len;

    this._inDraw = true;

    this.init();

    for (i = 0, len = this._classes.length ; i < len ; i++)
        this.addClass(this._classes[i]);

    if (this._content) this.setContent(this._content);

    for (key in this._styles)
        if (this._styles[key])
            this.setProperty(key, this._styles[key]);

    for (key in this._attributes)
        if (this._attributes[key])
            this.setAttribute(key, this._attributes[key]);

    for (i = 0, len = this._UIEvents.length ; i < len ; i++)
        this.onAddUIEvent(this._UIEvents[i]);

    this._inDraw = false;
};

module.exports = DOMElement;

},{"../utilities/CallbackStore":36}],12:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var ElementCache = require('./ElementCache');
var math = require('./Math');
var vendorPrefix = require('../utilities/vendorPrefix');
var eventMap = require('./events/EventMap');

var TRANSFORM = null;

/**
 * DOMRenderer is a class responsible for adding elements
 * to the DOM and writing to those elements.
 * There is a DOMRenderer per context, represented as an
 * element and a selector. It is instantiated in the
 * context class.
 *
 * @class DOMRenderer
 *
 * @param {HTMLElement} element an element.
 * @param {String} selector the selector of the element.
 * @param {Compositor} compositor the compositor controlling the renderer
 */
function DOMRenderer (element, selector, compositor) {
    var _this = this;

    element.classList.add('famous-dom-renderer');

    TRANSFORM = TRANSFORM || vendorPrefix('transform');
    this._compositor = compositor; // a reference to the compositor

    this._target = null; // a register for holding the current
                         // element that the Renderer is operating
                         // upon

    this._parent = null; // a register for holding the parent
                         // of the target

    this._path = null; // a register for holding the path of the target
                       // this register must be set first, and then
                       // children, target, and parent are all looked
                       // up from that.

    this._children = []; // a register for holding the children of the
                         // current target.

    this._root = new ElementCache(element, selector); // the root
                                                      // of the dom tree that this
                                                      // renderer is responsible
                                                      // for

    this._boundTriggerEvent = function (ev) {
        return _this._triggerEvent(ev);
    };

    this._selector = selector;

    this._elements = {};

    this._elements[selector] = this._root;

    this.perspectiveTransform = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    this._VPtransform = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

    this._size = [null, null];
}


/**
 * Attaches an EventListener to the element associated with the passed in path.
 * Prevents the default browser action on all subsequent events if
 * `preventDefault` is truthy.
 * All incoming events will be forwarded to the compositor by invoking the
 * `sendEvent` method.
 * Delegates events if possible by attaching the event listener to the context.
 *
 * @method
 *
 * @param {String} type DOM event type (e.g. click, mouseover).
 * @param {Boolean} preventDefault Whether or not the default browser action should be prevented.
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype.subscribe = function subscribe(type, preventDefault) {
    // TODO preventDefault should be a separate command
    this._assertTargetLoaded();

    this._target.preventDefault[type] = preventDefault;
    this._target.subscribe[type] = true;

    if (
        !this._target.listeners[type] && !this._root.listeners[type]
    ) {
        var target = eventMap[type][1] ? this._root : this._target;
        target.listeners[type] = this._boundTriggerEvent;
        target.element.addEventListener(type, this._boundTriggerEvent);
    }
};

/**
 * Function to be added using `addEventListener` to the corresponding
 * DOMElement.
 *
 * @method
 * @private
 *
 * @param {Event} ev DOM Event payload
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype._triggerEvent = function _triggerEvent(ev) {
    // Use ev.path, which is an array of Elements (polyfilled if needed).
    var evPath = ev.path ? ev.path : _getPath(ev);
    // First element in the path is the element on which the event has actually
    // been emitted.
    for (var i = 0; i < evPath.length; i++) {
        // Skip nodes that don't have a dataset property or data-fa-path
        // attribute.
        if (!evPath[i].dataset) continue;
        var path = evPath[i].dataset.faPath;
        if (!path) continue;

        // Stop further event propogation and path traversal as soon as the
        // first ElementCache subscribing for the emitted event has been found.
        if (this._elements[path] && this._elements[path].subscribe[ev.type]) {
            ev.stopPropagation();

            // Optionally preventDefault. This needs forther consideration and
            // should be optional. Eventually this should be a separate command/
            // method.
            if (this._elements[path].preventDefault[ev.type]) {
                ev.preventDefault();
            }

            var NormalizedEventConstructor = eventMap[ev.type][0];

            // Finally send the event to the Worker Thread through the
            // compositor.
            this._compositor.sendEvent(path, ev.type, new NormalizedEventConstructor(ev));

            break;
        }
    }
};


/**
 * getSizeOf gets the dom size of a particular DOM element.  This is
 * needed for render sizing in the scene graph.
 *
 * @method
 *
 * @param {String} path path of the Node in the scene graph
 *
 * @return {Array} a vec3 of the offset size of the dom element
 */
DOMRenderer.prototype.getSizeOf = function getSizeOf(path) {
    var element = this._elements[path];
    if (!element) return null;

    var res = {val: element.size};
    this._compositor.sendEvent(path, 'resize', res);
    return res;
};

function _getPath(ev) {
    // TODO move into _triggerEvent, avoid object allocation
    var path = [];
    var node = ev.target;
    while (node !== document.body) {
        path.push(node);
        node = node.parentNode;
    }
    return path;
}


/**
 * Determines the size of the context by querying the DOM for `offsetWidth` and
 * `offsetHeight`.
 *
 * @method
 *
 * @return {Array} Offset size.
 */
DOMRenderer.prototype.getSize = function getSize() {
    this._size[0] = this._root.element.offsetWidth;
    this._size[1] = this._root.element.offsetHeight;
    return this._size;
};

DOMRenderer.prototype._getSize = DOMRenderer.prototype.getSize;


/**
 * Executes the retrieved draw commands. Draw commands only refer to the
 * cross-browser normalized `transform` property.
 *
 * @method
 *
 * @param {Object} renderState description
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype.draw = function draw(renderState) {
    if (renderState.perspectiveDirty) {
        this.perspectiveDirty = true;

        this.perspectiveTransform[0] = renderState.perspectiveTransform[0];
        this.perspectiveTransform[1] = renderState.perspectiveTransform[1];
        this.perspectiveTransform[2] = renderState.perspectiveTransform[2];
        this.perspectiveTransform[3] = renderState.perspectiveTransform[3];

        this.perspectiveTransform[4] = renderState.perspectiveTransform[4];
        this.perspectiveTransform[5] = renderState.perspectiveTransform[5];
        this.perspectiveTransform[6] = renderState.perspectiveTransform[6];
        this.perspectiveTransform[7] = renderState.perspectiveTransform[7];

        this.perspectiveTransform[8] = renderState.perspectiveTransform[8];
        this.perspectiveTransform[9] = renderState.perspectiveTransform[9];
        this.perspectiveTransform[10] = renderState.perspectiveTransform[10];
        this.perspectiveTransform[11] = renderState.perspectiveTransform[11];

        this.perspectiveTransform[12] = renderState.perspectiveTransform[12];
        this.perspectiveTransform[13] = renderState.perspectiveTransform[13];
        this.perspectiveTransform[14] = renderState.perspectiveTransform[14];
        this.perspectiveTransform[15] = renderState.perspectiveTransform[15];
    }

    if (renderState.viewDirty || renderState.perspectiveDirty) {
        math.multiply(this._VPtransform, this.perspectiveTransform, renderState.viewTransform);
        this._root.element.style[TRANSFORM] = this._stringifyMatrix(this._VPtransform);
    }
};


/**
 * Internal helper function used for ensuring that a path is currently loaded.
 *
 * @method
 * @private
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype._assertPathLoaded = function _asserPathLoaded() {
    if (!this._path) throw new Error('path not loaded');
};

/**
 * Internal helper function used for ensuring that a parent is currently loaded.
 *
 * @method
 * @private
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype._assertParentLoaded = function _assertParentLoaded() {
    if (!this._parent) throw new Error('parent not loaded');
};

/**
 * Internal helper function used for ensuring that children are currently
 * loaded.
 *
 * @method
 * @private
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype._assertChildrenLoaded = function _assertChildrenLoaded() {
    if (!this._children) throw new Error('children not loaded');
};

/**
 * Internal helper function used for ensuring that a target is currently loaded.
 *
 * @method  _assertTargetLoaded
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype._assertTargetLoaded = function _assertTargetLoaded() {
    if (!this._target) throw new Error('No target loaded');
};

/**
 * Finds and sets the parent of the currently loaded element (path).
 *
 * @method
 * @private
 *
 * @return {ElementCache} Parent element.
 */
DOMRenderer.prototype.findParent = function findParent () {
    this._assertPathLoaded();

    var path = this._path;
    var parent;

    while (!parent && path.length) {
        path = path.substring(0, path.lastIndexOf('/'));
        parent = this._elements[path];
    }
    this._parent = parent;
    return parent;
};


/**
 * Finds all children of the currently loaded element.
 *
 * @method
 * @private
 *
 * @param {Array} array Output-Array used for writing to (subsequently appending children)
 *
 * @return {Array} array of children elements
 */
DOMRenderer.prototype.findChildren = function findChildren(array) {
    // TODO: Optimize me.
    this._assertPathLoaded();

    var path = this._path + '/';
    var keys = Object.keys(this._elements);
    var i = 0;
    var len;
    array = array ? array : this._children;

    this._children.length = 0;

    while (i < keys.length) {
        if (keys[i].indexOf(path) === -1 || keys[i] === path) keys.splice(i, 1);
        else i++;
    }
    var currentPath;
    var j = 0;
    for (i = 0 ; i < keys.length ; i++) {
        currentPath = keys[i];
        for (j = 0 ; j < keys.length ; j++) {
            if (i !== j && keys[j].indexOf(currentPath) !== -1) {
                keys.splice(j, 1);
                i--;
            }
        }
    }
    for (i = 0, len = keys.length ; i < len ; i++)
        array[i] = this._elements[keys[i]];

    return array;
};


/**
 * Used for determining the target loaded under the current path.
 *
 * @method
 *
 * @return {ElementCache|undefined} Element loaded under defined path.
 */
DOMRenderer.prototype.findTarget = function findTarget() {
    this._target = this._elements[this._path];
    return this._target;
};


/**
 * Loads the passed in path.
 *
 * @method
 *
 * @param {String} path Path to be loaded
 *
 * @return {String} Loaded path
 */
DOMRenderer.prototype.loadPath = function loadPath (path) {
    this._path = path;
    return this._path;
};


/**
 * Inserts a DOMElement at the currently loaded path, assuming no target is
 * loaded. Only one DOMElement can be associated with each path.
 *
 * @method
 *
 * @param {String} tagName Tag name (capitalization will be normalized).
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype.insertEl = function insertEl (tagName) {
    if (!this._target ||
        this._target.element.tagName.toLowerCase() !== tagName.toLowerCase()) {

        this.findParent();
        this.findChildren();

        this._assertParentLoaded();
        this._assertChildrenLoaded();

        if (this._target) this._parent.element.removeChild(this._target.element);

        this._target = new ElementCache(document.createElement(tagName), this._path);
        this._parent.element.appendChild(this._target.element);
        this._elements[this._path] = this._target;

        for (var i = 0, len = this._children.length ; i < len ; i++) {
            this._target.element.appendChild(this._children[i].element);
        }
    }
};


/**
 * Sets a property on the currently loaded target.
 *
 * @method
 *
 * @param {String} name Property name (e.g. background, color, font)
 * @param {String} value Proprty value (e.g. black, 20px)
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype.setProperty = function setProperty (name, value) {
    this._assertTargetLoaded();
    this._target.element.style[name] = value;
};


/**
 * Sets the size of the currently loaded target.
 * Removes any explicit sizing constraints when passed in `false`
 * ("true-sizing").
 *
 * @method
 *
 * @param {Number|false} width   Width to be set.
 * @param {Number|false} height  Height to be set.
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype.setSize = function setSize (width, height) {
    this._assertTargetLoaded();

    this.setWidth(width);
    this.setHeight(height);
};

/**
 * Sets the width of the currently loaded target.
 * Removes any explicit sizing constraints when passed in `false`
 * ("true-sizing").
 *
 * @method
 *
 * @param {Number|false} width Width to be set.
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype.setWidth = function setWidth(width) {
    this._assertTargetLoaded();

    var contentWrapper = this._target.content;

    if (width === false) {
        this._target.explicitWidth = true;
        if (contentWrapper) contentWrapper.style.width = '';
        width = contentWrapper ? contentWrapper.offsetWidth : 0;
        this._target.element.style.width = width + 'px';
    }
    else {
        this._target.explicitWidth = false;
        if (contentWrapper) contentWrapper.style.width = width + 'px';
        this._target.element.style.width = width + 'px';
    }

    this._target.size[0] = width;
};

/**
 * Sets the height of the currently loaded target.
 * Removes any explicit sizing constraints when passed in `false`
 * ("true-sizing").
 *
 * @method
 *
 * @param {Number|false} height Height to be set.
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype.setHeight = function setHeight(height) {
    this._assertTargetLoaded();

    var contentWrapper = this._target.content;

    if (height === false) {
        this._target.explicitHeight = true;
        if (contentWrapper) contentWrapper.style.height = '';
        height = contentWrapper ? contentWrapper.offsetHeight : 0;
        this._target.element.style.height = height + 'px';
    }
    else {
        this._target.explicitHeight = false;
        if (contentWrapper) contentWrapper.style.height = height + 'px';
        this._target.element.style.height = height + 'px';
    }

    this._target.size[1] = height;
};

/**
 * Sets an attribute on the currently loaded target.
 *
 * @method
 *
 * @param {String} name Attribute name (e.g. href)
 * @param {String} value Attribute value (e.g. http://famous.org)
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype.setAttribute = function setAttribute(name, value) {
    this._assertTargetLoaded();
    this._target.element.setAttribute(name, value);
};

/**
 * Sets the `innerHTML` content of the currently loaded target.
 *
 * @method
 *
 * @param {String} content Content to be set as `innerHTML`
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype.setContent = function setContent(content) {
    this._assertTargetLoaded();
    this.findChildren();

    if (!this._target.content) {
        this._target.content = document.createElement('div');
        this._target.content.classList.add('famous-dom-element-content');
        this._target.element.insertBefore(
            this._target.content,
            this._target.element.firstChild
        );
    }
    this._target.content.innerHTML = content;

    this.setSize(
        this._target.explicitWidth ? false : this._target.size[0],
        this._target.explicitHeight ? false : this._target.size[1]
    );
};


/**
 * Sets the passed in transform matrix (world space). Inverts the parent's world
 * transform.
 *
 * @method
 *
 * @param {Float32Array} transform The transform for the loaded DOM Element in world space
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype.setMatrix = function setMatrix(transform) {
    // TODO Don't multiply matrics in the first place.
    this._assertTargetLoaded();
    this.findParent();
    var worldTransform = this._target.worldTransform;
    var changed = false;

    var i;
    var len;

    if (transform)
        for (i = 0, len = 16 ; i < len ; i++) {
            changed = changed ? changed : worldTransform[i] === transform[i];
            worldTransform[i] = transform[i];
        }
    else changed = true;

    if (changed) {
        math.invert(this._target.invertedParent, this._parent.worldTransform);
        math.multiply(this._target.finalTransform, this._target.invertedParent, worldTransform);

        // TODO: this is a temporary fix for draw commands
        // coming in out of order
        var children = this.findChildren([]);
        var previousPath = this._path;
        var previousTarget = this._target;
        for (i = 0, len = children.length ; i < len ; i++) {
            this._target = children[i];
            this._path = this._target.path;
            this.setMatrix();
        }
        this._path = previousPath;
        this._target = previousTarget;
    }

    this._target.element.style[TRANSFORM] = this._stringifyMatrix(this._target.finalTransform);
};


/**
 * Adds a class to the classList associated with the currently loaded target.
 *
 * @method
 *
 * @param {String} domClass Class name to be added to the current target.
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype.addClass = function addClass(domClass) {
    this._assertTargetLoaded();
    this._target.element.classList.add(domClass);
};


/**
 * Removes a class from the classList associated with the currently loaded
 * target.
 *
 * @method
 *
 * @param {String} domClass Class name to be removed from currently loaded target.
 *
 * @return {undefined} undefined
 */
DOMRenderer.prototype.removeClass = function removeClass(domClass) {
    this._assertTargetLoaded();
    this._target.element.classList.remove(domClass);
};


/**
 * Stringifies the passed in matrix for setting the `transform` property.
 *
 * @method  _stringifyMatrix
 * @private
 *
 * @param {Array} m    Matrix as an array or array-like object.
 * @return {String}     Stringified matrix as `matrix3d`-property.
 */
DOMRenderer.prototype._stringifyMatrix = function _stringifyMatrix(m) {
    var r = 'matrix3d(';

    r += (m[0] < 0.000001 && m[0] > -0.000001) ? '0,' : m[0] + ',';
    r += (m[1] < 0.000001 && m[1] > -0.000001) ? '0,' : m[1] + ',';
    r += (m[2] < 0.000001 && m[2] > -0.000001) ? '0,' : m[2] + ',';
    r += (m[3] < 0.000001 && m[3] > -0.000001) ? '0,' : m[3] + ',';
    r += (m[4] < 0.000001 && m[4] > -0.000001) ? '0,' : m[4] + ',';
    r += (m[5] < 0.000001 && m[5] > -0.000001) ? '0,' : m[5] + ',';
    r += (m[6] < 0.000001 && m[6] > -0.000001) ? '0,' : m[6] + ',';
    r += (m[7] < 0.000001 && m[7] > -0.000001) ? '0,' : m[7] + ',';
    r += (m[8] < 0.000001 && m[8] > -0.000001) ? '0,' : m[8] + ',';
    r += (m[9] < 0.000001 && m[9] > -0.000001) ? '0,' : m[9] + ',';
    r += (m[10] < 0.000001 && m[10] > -0.000001) ? '0,' : m[10] + ',';
    r += (m[11] < 0.000001 && m[11] > -0.000001) ? '0,' : m[11] + ',';
    r += (m[12] < 0.000001 && m[12] > -0.000001) ? '0,' : m[12] + ',';
    r += (m[13] < 0.000001 && m[13] > -0.000001) ? '0,' : m[13] + ',';
    r += (m[14] < 0.000001 && m[14] > -0.000001) ? '0,' : m[14] + ',';

    r += m[15] + ')';
    return r;
};

module.exports = DOMRenderer;

},{"../utilities/vendorPrefix":39,"./ElementCache":13,"./Math":14,"./events/EventMap":17}],13:[function(require,module,exports){
/**
 * The MIT License (MIT)
 * 
 * Copyright (c) 2015 Famous Industries Inc.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

// Transform identity matrix. 
var ident = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
];

/**
 * ElementCache is being used for keeping track of an element's DOM Element,
 * path, world transform, inverted parent, final transform (as being used for
 * setting the actual `transform`-property) and post render size (final size as
 * being rendered to the DOM).
 * 
 * @class ElementCache
 *  
 * @param {Element} element DOMElement
 * @param {String} path Path used for uniquely identifying the location in the scene graph.
 */ 
function ElementCache (element, path) {
    this.element = element;
    this.path = path;
    this.content = null;
    this.size = new Int16Array(3);
    this.explicitHeight = false;
    this.explicitWidth = false;
    this.worldTransform = new Float32Array(ident);
    this.invertedParent = new Float32Array(ident);
    this.finalTransform = new Float32Array(ident);
    this.postRenderSize = new Float32Array(2);
    this.listeners = {};
    this.preventDefault = {};
    this.subscribe = {};
}

module.exports = ElementCache;

},{}],14:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * A method for inverting a transform matrix
 *
 * @method
 *
 * @param {Array} out array to store the return of the inversion
 * @param {Array} a transform matrix to inverse
 *
 * @return {Array} out
 *   output array that is storing the transform matrix
 */
function invert (out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32,

        // Calculate the determinant
        det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    if (!det) {
        return null;
    }
    det = 1.0 / det;

    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

    return out;
}

/**
 * A method for multiplying two matricies
 *
 * @method
 *
 * @param {Array} out array to store the return of the multiplication
 * @param {Array} a transform matrix to multiply
 * @param {Array} b transform matrix to multiply
 *
 * @return {Array} out
 *   output array that is storing the transform matrix
 */
function multiply (out, a, b) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

        b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3],
        b4 = b[4], b5 = b[5], b6 = b[6], b7 = b[7],
        b8 = b[8], b9 = b[9], b10 = b[10], b11 = b[11],
        b12 = b[12], b13 = b[13], b14 = b[14], b15 = b[15];

    var changed = false;
    var out0, out1, out2, out3;

    out0 = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out1 = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out2 = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out3 = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    changed = changed ?
              changed : out0 === out[0] ||
                        out1 === out[1] ||
                        out2 === out[2] ||
                        out3 === out[3];

    out[0] = out0;
    out[1] = out1;
    out[2] = out2;
    out[3] = out3;

    b0 = b4; b1 = b5; b2 = b6; b3 = b7;
    out0 = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out1 = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out2 = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out3 = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    changed = changed ?
              changed : out0 === out[4] ||
                        out1 === out[5] ||
                        out2 === out[6] ||
                        out3 === out[7];

    out[4] = out0;
    out[5] = out1;
    out[6] = out2;
    out[7] = out3;

    b0 = b8; b1 = b9; b2 = b10; b3 = b11;
    out0 = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out1 = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out2 = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out3 = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    changed = changed ?
              changed : out0 === out[8] ||
                        out1 === out[9] ||
                        out2 === out[10] ||
                        out3 === out[11];

    out[8] = out0;
    out[9] = out1;
    out[10] = out2;
    out[11] = out3;

    b0 = b12; b1 = b13; b2 = b14; b3 = b15;
    out0 = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out1 = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out2 = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out3 = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    changed = changed ?
              changed : out0 === out[12] ||
                        out1 === out[13] ||
                        out2 === out[14] ||
                        out3 === out[15];

    out[12] = out0;
    out[13] = out1;
    out[14] = out2;
    out[15] = out3;

    return out;
}

module.exports = {
    multiply: multiply,
    invert: invert
};

},{}],15:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var UIEvent = require('./UIEvent');

/**
 * See [UI Events (formerly DOM Level 3 Events)](http://www.w3.org/TR/2015/WD-uievents-20150428/#events-compositionevents).
 *
 * @class CompositionEvent
 * @augments UIEvent
 *
 * @param {Event} ev The native DOM event.
 */
function CompositionEvent(ev) {
    // [Constructor(DOMString typeArg, optional CompositionEventInit compositionEventInitDict)]
    // interface CompositionEvent : UIEvent {
    //     readonly    attribute DOMString data;
    // };

    UIEvent.call(this, ev);

    /**
     * @name CompositionEvent#data
     * @type String
     */
    this.data = ev.data;
}

CompositionEvent.prototype = Object.create(UIEvent.prototype);
CompositionEvent.prototype.constructor = CompositionEvent;

/**
 * Return the name of the event type
 *
 * @method
 *
 * @return {String} Name of the event type
 */
CompositionEvent.prototype.toString = function toString () {
    return 'CompositionEvent';
};

module.exports = CompositionEvent;

},{"./UIEvent":23}],16:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * The Event class is being used in order to normalize native DOM events.
 * Events need to be normalized in order to be serialized through the structured
 * cloning algorithm used by the `postMessage` method (Web Workers).
 *
 * Wrapping DOM events also has the advantage of providing a consistent
 * interface for interacting with DOM events across browsers by copying over a
 * subset of the exposed properties that is guaranteed to be consistent across
 * browsers.
 *
 * See [UI Events (formerly DOM Level 3 Events)](http://www.w3.org/TR/2015/WD-uievents-20150428/#interface-Event).
 *
 * @class Event
 *
 * @param {Event} ev The native DOM event.
 */
function Event(ev) {
    // [Constructor(DOMString type, optional EventInit eventInitDict),
    //  Exposed=Window,Worker]
    // interface Event {
    //   readonly attribute DOMString type;
    //   readonly attribute EventTarget? target;
    //   readonly attribute EventTarget? currentTarget;

    //   const unsigned short NONE = 0;
    //   const unsigned short CAPTURING_PHASE = 1;
    //   const unsigned short AT_TARGET = 2;
    //   const unsigned short BUBBLING_PHASE = 3;
    //   readonly attribute unsigned short eventPhase;

    //   void stopPropagation();
    //   void stopImmediatePropagation();

    //   readonly attribute boolean bubbles;
    //   readonly attribute boolean cancelable;
    //   void preventDefault();
    //   readonly attribute boolean defaultPrevented;

    //   [Unforgeable] readonly attribute boolean isTrusted;
    //   readonly attribute DOMTimeStamp timeStamp;

    //   void initEvent(DOMString type, boolean bubbles, boolean cancelable);
    // };

    /**
     * @name Event#type
     * @type String
     */
    this.type = ev.type;

    /**
     * @name Event#defaultPrevented
     * @type Boolean
     */
    this.defaultPrevented = ev.defaultPrevented;

    /**
     * @name Event#timeStamp
     * @type Number
     */
    this.timeStamp = ev.timeStamp;


    /**
     * Used for exposing the current target's value.
     *
     * @name Event#value
     * @type String
     */
    var targetConstructor = ev.target.constructor;
    // TODO Support HTMLKeygenElement
    if (
        targetConstructor === HTMLInputElement ||
        targetConstructor === HTMLTextAreaElement ||
        targetConstructor === HTMLSelectElement
    ) {
        this.value = ev.target.value;
    }
}

/**
 * Return the name of the event type
 *
 * @method
 *
 * @return {String} Name of the event type
 */
Event.prototype.toString = function toString () {
    return 'Event';
};

module.exports = Event;

},{}],17:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var CompositionEvent = require('./CompositionEvent');
var Event = require('./Event');
var FocusEvent = require('./FocusEvent');
var InputEvent = require('./InputEvent');
var KeyboardEvent = require('./KeyboardEvent');
var MouseEvent = require('./MouseEvent');
var TouchEvent = require('./TouchEvent');
var UIEvent = require('./UIEvent');
var WheelEvent = require('./WheelEvent');

/**
 * A mapping of DOM events to the corresponding handlers
 *
 * @name EventMap
 * @type Object
 */
var EventMap = {
    change                         : [Event, true],
    submit                         : [Event, true],

    // UI Events (http://www.w3.org/TR/uievents/)
    abort                          : [Event, false],
    beforeinput                    : [InputEvent, true],
    blur                           : [FocusEvent, false],
    click                          : [MouseEvent, true],
    compositionend                 : [CompositionEvent, true],
    compositionstart               : [CompositionEvent, true],
    compositionupdate              : [CompositionEvent, true],
    dblclick                       : [MouseEvent, true],
    focus                          : [FocusEvent, false],
    focusin                        : [FocusEvent, true],
    focusout                       : [FocusEvent, true],
    input                          : [InputEvent, true],
    keydown                        : [KeyboardEvent, true],
    keyup                          : [KeyboardEvent, true],
    load                           : [Event, false],
    mousedown                      : [MouseEvent, true],
    mouseenter                     : [MouseEvent, false],
    mouseleave                     : [MouseEvent, false],

    // bubbles, but will be triggered very frequently
    mousemove                      : [MouseEvent, false],

    mouseout                       : [MouseEvent, true],
    mouseover                      : [MouseEvent, true],
    mouseup                        : [MouseEvent, true],
    resize                         : [UIEvent, false],

    // might bubble
    scroll                         : [UIEvent, false],

    select                         : [Event, true],
    unload                         : [Event, false],
    wheel                          : [WheelEvent, true],

    // Touch Events Extension (http://www.w3.org/TR/touch-events-extensions/)
    touchcancel                    : [TouchEvent, true],
    touchend                       : [TouchEvent, true],
    touchmove                      : [TouchEvent, true],
    touchstart                     : [TouchEvent, true]
};

module.exports = EventMap;

},{"./CompositionEvent":15,"./Event":16,"./FocusEvent":18,"./InputEvent":19,"./KeyboardEvent":20,"./MouseEvent":21,"./TouchEvent":22,"./UIEvent":23,"./WheelEvent":24}],18:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var UIEvent = require('./UIEvent');

/**
 * See [UI Events (formerly DOM Level 3 Events)](http://www.w3.org/TR/2015/WD-uievents-20150428/#events-focusevent).
 *
 * @class FocusEvent
 * @augments UIEvent
 *
 * @param {Event} ev The native DOM event.
 */
function FocusEvent(ev) {
    // [Constructor(DOMString typeArg, optional FocusEventInit focusEventInitDict)]
    // interface FocusEvent : UIEvent {
    //     readonly    attribute EventTarget? relatedTarget;
    // };

    UIEvent.call(this, ev);
}

FocusEvent.prototype = Object.create(UIEvent.prototype);
FocusEvent.prototype.constructor = FocusEvent;

/**
 * Return the name of the event type
 *
 * @method
 *
 * @return {String} Name of the event type
 */
FocusEvent.prototype.toString = function toString () {
    return 'FocusEvent';
};

module.exports = FocusEvent;

},{"./UIEvent":23}],19:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var UIEvent = require('./UIEvent');

/**
 * See [Input Events](http://w3c.github.io/editing-explainer/input-events.html#idl-def-InputEvent).
 *
 * @class InputEvent
 * @augments UIEvent
 *
 * @param {Event} ev The native DOM event.
 */
function InputEvent(ev) {
    // [Constructor(DOMString typeArg, optional InputEventInit inputEventInitDict)]
    // interface InputEvent : UIEvent {
    //     readonly    attribute DOMString inputType;
    //     readonly    attribute DOMString data;
    //     readonly    attribute boolean   isComposing;
    //     readonly    attribute Range     targetRange;
    // };

    UIEvent.call(this, ev);

    /**
     * @name    InputEvent#inputType
     * @type    String
     */
    this.inputType = ev.inputType;

    /**
     * @name    InputEvent#data
     * @type    String
     */
    this.data = ev.data;

    /**
     * @name    InputEvent#isComposing
     * @type    Boolean
     */
    this.isComposing = ev.isComposing;

    /**
     * **Limited browser support**.
     *
     * @name    InputEvent#targetRange
     * @type    Boolean
     */
    this.targetRange = ev.targetRange;
}

InputEvent.prototype = Object.create(UIEvent.prototype);
InputEvent.prototype.constructor = InputEvent;

/**
 * Return the name of the event type
 *
 * @method
 *
 * @return {String} Name of the event type
 */
InputEvent.prototype.toString = function toString () {
    return 'InputEvent';
};

module.exports = InputEvent;

},{"./UIEvent":23}],20:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var UIEvent = require('./UIEvent');

/**
 * See [UI Events (formerly DOM Level 3 Events)](http://www.w3.org/TR/2015/WD-uievents-20150428/#events-keyboardevents).
 *
 * @class KeyboardEvent
 * @augments UIEvent
 *
 * @param {Event} ev The native DOM event.
 */
function KeyboardEvent(ev) {
    // [Constructor(DOMString typeArg, optional KeyboardEventInit keyboardEventInitDict)]
    // interface KeyboardEvent : UIEvent {
    //     // KeyLocationCode
    //     const unsigned long DOM_KEY_LOCATION_STANDARD = 0x00;
    //     const unsigned long DOM_KEY_LOCATION_LEFT = 0x01;
    //     const unsigned long DOM_KEY_LOCATION_RIGHT = 0x02;
    //     const unsigned long DOM_KEY_LOCATION_NUMPAD = 0x03;
    //     readonly    attribute DOMString     key;
    //     readonly    attribute DOMString     code;
    //     readonly    attribute unsigned long location;
    //     readonly    attribute boolean       ctrlKey;
    //     readonly    attribute boolean       shiftKey;
    //     readonly    attribute boolean       altKey;
    //     readonly    attribute boolean       metaKey;
    //     readonly    attribute boolean       repeat;
    //     readonly    attribute boolean       isComposing;
    //     boolean getModifierState (DOMString keyArg);
    // };

    UIEvent.call(this, ev);

    /**
     * @name KeyboardEvent#DOM_KEY_LOCATION_STANDARD
     * @type Number
     */
    this.DOM_KEY_LOCATION_STANDARD = 0x00;

    /**
     * @name KeyboardEvent#DOM_KEY_LOCATION_LEFT
     * @type Number
     */
    this.DOM_KEY_LOCATION_LEFT = 0x01;

    /**
     * @name KeyboardEvent#DOM_KEY_LOCATION_RIGHT
     * @type Number
     */
    this.DOM_KEY_LOCATION_RIGHT = 0x02;

    /**
     * @name KeyboardEvent#DOM_KEY_LOCATION_NUMPAD
     * @type Number
     */
    this.DOM_KEY_LOCATION_NUMPAD = 0x03;

    /**
     * @name KeyboardEvent#key
     * @type String
     */
    this.key = ev.key;

    /**
     * @name KeyboardEvent#code
     * @type String
     */
    this.code = ev.code;

    /**
     * @name KeyboardEvent#location
     * @type Number
     */
    this.location = ev.location;

    /**
     * @name KeyboardEvent#ctrlKey
     * @type Boolean
     */
    this.ctrlKey = ev.ctrlKey;

    /**
     * @name KeyboardEvent#shiftKey
     * @type Boolean
     */
    this.shiftKey = ev.shiftKey;

    /**
     * @name KeyboardEvent#altKey
     * @type Boolean
     */
    this.altKey = ev.altKey;

    /**
     * @name KeyboardEvent#metaKey
     * @type Boolean
     */
    this.metaKey = ev.metaKey;

    /**
     * @name KeyboardEvent#repeat
     * @type Boolean
     */
    this.repeat = ev.repeat;

    /**
     * @name KeyboardEvent#isComposing
     * @type Boolean
     */
    this.isComposing = ev.isComposing;

    /**
     * @name KeyboardEvent#keyCode
     * @type String
     * @deprecated
     */
    this.keyCode = ev.keyCode;
}

KeyboardEvent.prototype = Object.create(UIEvent.prototype);
KeyboardEvent.prototype.constructor = KeyboardEvent;

/**
 * Return the name of the event type
 *
 * @method
 *
 * @return {String} Name of the event type
 */
KeyboardEvent.prototype.toString = function toString () {
    return 'KeyboardEvent';
};

module.exports = KeyboardEvent;

},{"./UIEvent":23}],21:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var UIEvent = require('./UIEvent');

/**
 * See [UI Events (formerly DOM Level 3 Events)](http://www.w3.org/TR/2015/WD-uievents-20150428/#events-mouseevents).
 *
 * @class KeyboardEvent
 * @augments UIEvent
 *
 * @param {Event} ev The native DOM event.
 */
function MouseEvent(ev) {
    // [Constructor(DOMString typeArg, optional MouseEventInit mouseEventInitDict)]
    // interface MouseEvent : UIEvent {
    //     readonly    attribute long           screenX;
    //     readonly    attribute long           screenY;
    //     readonly    attribute long           clientX;
    //     readonly    attribute long           clientY;
    //     readonly    attribute boolean        ctrlKey;
    //     readonly    attribute boolean        shiftKey;
    //     readonly    attribute boolean        altKey;
    //     readonly    attribute boolean        metaKey;
    //     readonly    attribute short          button;
    //     readonly    attribute EventTarget?   relatedTarget;
    //     // Introduced in this specification
    //     readonly    attribute unsigned short buttons;
    //     boolean getModifierState (DOMString keyArg);
    // };

    UIEvent.call(this, ev);

    /**
     * @name MouseEvent#screenX
     * @type Number
     */
    this.screenX = ev.screenX;

    /**
     * @name MouseEvent#screenY
     * @type Number
     */
    this.screenY = ev.screenY;

    /**
     * @name MouseEvent#clientX
     * @type Number
     */
    this.clientX = ev.clientX;

    /**
     * @name MouseEvent#clientY
     * @type Number
     */
    this.clientY = ev.clientY;

    /**
     * @name MouseEvent#ctrlKey
     * @type Boolean
     */
    this.ctrlKey = ev.ctrlKey;

    /**
     * @name MouseEvent#shiftKey
     * @type Boolean
     */
    this.shiftKey = ev.shiftKey;

    /**
     * @name MouseEvent#altKey
     * @type Boolean
     */
    this.altKey = ev.altKey;

    /**
     * @name MouseEvent#metaKey
     * @type Boolean
     */
    this.metaKey = ev.metaKey;

    /**
     * @type MouseEvent#button
     * @type Number
     */
    this.button = ev.button;

    /**
     * @type MouseEvent#buttons
     * @type Number
     */
    this.buttons = ev.buttons;

    /**
     * @type MouseEvent#pageX
     * @type Number
     */
    this.pageX = ev.pageX;

    /**
     * @type MouseEvent#pageY
     * @type Number
     */
    this.pageY = ev.pageY;

    /**
     * @type MouseEvent#x
     * @type Number
     */
    this.x = ev.x;

    /**
     * @type MouseEvent#y
     * @type Number
     */
    this.y = ev.y;

    /**
     * @type MouseEvent#offsetX
     * @type Number
     */
    this.offsetX = ev.offsetX;

    /**
     * @type MouseEvent#offsetY
     * @type Number
     */
    this.offsetY = ev.offsetY;
}

MouseEvent.prototype = Object.create(UIEvent.prototype);
MouseEvent.prototype.constructor = MouseEvent;

/**
 * Return the name of the event type
 *
 * @method
 *
 * @return {String} Name of the event type
 */
MouseEvent.prototype.toString = function toString () {
    return 'MouseEvent';
};

module.exports = MouseEvent;

},{"./UIEvent":23}],22:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var UIEvent = require('./UIEvent');

var EMPTY_ARRAY = [];

/**
 * See [Touch Interface](http://www.w3.org/TR/2013/REC-touch-events-20131010/#touch-interface).
 *
 * @class Touch
 * @private
 *
 * @param {Touch} touch The native Touch object.
 */
function Touch(touch) {
    // interface Touch {
    //     readonly    attribute long        identifier;
    //     readonly    attribute EventTarget target;
    //     readonly    attribute double      screenX;
    //     readonly    attribute double      screenY;
    //     readonly    attribute double      clientX;
    //     readonly    attribute double      clientY;
    //     readonly    attribute double      pageX;
    //     readonly    attribute double      pageY;
    // };

    /**
     * @name Touch#identifier
     * @type Number
     */
    this.identifier = touch.identifier;

    /**
     * @name Touch#screenX
     * @type Number
     */
    this.screenX = touch.screenX;

    /**
     * @name Touch#screenY
     * @type Number
     */
    this.screenY = touch.screenY;

    /**
     * @name Touch#clientX
     * @type Number
     */
    this.clientX = touch.clientX;

    /**
     * @name Touch#clientY
     * @type Number
     */
    this.clientY = touch.clientY;

    /**
     * @name Touch#pageX
     * @type Number
     */
    this.pageX = touch.pageX;

    /**
     * @name Touch#pageY
     * @type Number
     */
    this.pageY = touch.pageY;
}


/**
 * Normalizes the browser's native TouchList by converting it into an array of
 * normalized Touch objects.
 *
 * @method  cloneTouchList
 * @private
 *
 * @param  {TouchList} touchList    The native TouchList array.
 * @return {Array.<Touch>}          An array of normalized Touch objects.
 */
function cloneTouchList(touchList) {
    if (!touchList) return EMPTY_ARRAY;
    // interface TouchList {
    //     readonly    attribute unsigned long length;
    //     getter Touch? item (unsigned long index);
    // };

    var touchListArray = [];
    for (var i = 0; i < touchList.length; i++) {
        touchListArray[i] = new Touch(touchList[i]);
    }
    return touchListArray;
}

/**
 * See [Touch Event Interface](http://www.w3.org/TR/2013/REC-touch-events-20131010/#touchevent-interface).
 *
 * @class TouchEvent
 * @augments UIEvent
 *
 * @param {Event} ev The native DOM event.
 */
function TouchEvent(ev) {
    // interface TouchEvent : UIEvent {
    //     readonly    attribute TouchList touches;
    //     readonly    attribute TouchList targetTouches;
    //     readonly    attribute TouchList changedTouches;
    //     readonly    attribute boolean   altKey;
    //     readonly    attribute boolean   metaKey;
    //     readonly    attribute boolean   ctrlKey;
    //     readonly    attribute boolean   shiftKey;
    // };
    UIEvent.call(this, ev);

    /**
     * @name TouchEvent#touches
     * @type Array.<Touch>
     */
    this.touches = cloneTouchList(ev.touches);

    /**
     * @name TouchEvent#targetTouches
     * @type Array.<Touch>
     */
    this.targetTouches = cloneTouchList(ev.targetTouches);

    /**
     * @name TouchEvent#changedTouches
     * @type TouchList
     */
    this.changedTouches = cloneTouchList(ev.changedTouches);

    /**
     * @name TouchEvent#altKey
     * @type Boolean
     */
    this.altKey = ev.altKey;

    /**
     * @name TouchEvent#metaKey
     * @type Boolean
     */
    this.metaKey = ev.metaKey;

    /**
     * @name TouchEvent#ctrlKey
     * @type Boolean
     */
    this.ctrlKey = ev.ctrlKey;

    /**
     * @name TouchEvent#shiftKey
     * @type Boolean
     */
    this.shiftKey = ev.shiftKey;
}

TouchEvent.prototype = Object.create(UIEvent.prototype);
TouchEvent.prototype.constructor = TouchEvent;

/**
 * Return the name of the event type
 *
 * @method
 *
 * @return {String} Name of the event type
 */
TouchEvent.prototype.toString = function toString () {
    return 'TouchEvent';
};

module.exports = TouchEvent;

},{"./UIEvent":23}],23:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var Event = require('./Event');

/**
 * See [UI Events (formerly DOM Level 3 Events)](http://www.w3.org/TR/2015/WD-uievents-20150428).
 *
 * @class UIEvent
 * @augments Event
 *
 * @param  {Event} ev   The native DOM event.
 */
function UIEvent(ev) {
    // [Constructor(DOMString type, optional UIEventInit eventInitDict)]
    // interface UIEvent : Event {
    //     readonly    attribute Window? view;
    //     readonly    attribute long    detail;
    // };
    Event.call(this, ev);

    /**
     * @name UIEvent#detail
     * @type Number
     */
    this.detail = ev.detail;
}

UIEvent.prototype = Object.create(Event.prototype);
UIEvent.prototype.constructor = UIEvent;

/**
 * Return the name of the event type
 *
 * @method
 *
 * @return {String} Name of the event type
 */
UIEvent.prototype.toString = function toString () {
    return 'UIEvent';
};

module.exports = UIEvent;

},{"./Event":16}],24:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var MouseEvent = require('./MouseEvent');

/**
 * See [UI Events (formerly DOM Level 3 Events)](http://www.w3.org/TR/2015/WD-uievents-20150428/#events-wheelevents).
 *
 * @class WheelEvent
 * @augments UIEvent
 *
 * @param {Event} ev The native DOM event.
 */
function WheelEvent(ev) {
    // [Constructor(DOMString typeArg, optional WheelEventInit wheelEventInitDict)]
    // interface WheelEvent : MouseEvent {
    //     // DeltaModeCode
    //     const unsigned long DOM_DELTA_PIXEL = 0x00;
    //     const unsigned long DOM_DELTA_LINE = 0x01;
    //     const unsigned long DOM_DELTA_PAGE = 0x02;
    //     readonly    attribute double        deltaX;
    //     readonly    attribute double        deltaY;
    //     readonly    attribute double        deltaZ;
    //     readonly    attribute unsigned long deltaMode;
    // };

    MouseEvent.call(this, ev);

    /**
     * @name WheelEvent#DOM_DELTA_PIXEL
     * @type Number
     */
    this.DOM_DELTA_PIXEL = 0x00;

    /**
     * @name WheelEvent#DOM_DELTA_LINE
     * @type Number
     */
    this.DOM_DELTA_LINE = 0x01;

    /**
     * @name WheelEvent#DOM_DELTA_PAGE
     * @type Number
     */
    this.DOM_DELTA_PAGE = 0x02;

    /**
     * @name WheelEvent#deltaX
     * @type Number
     */
    this.deltaX = ev.deltaX;

    /**
     * @name WheelEvent#deltaY
     * @type Number
     */
    this.deltaY = ev.deltaY;

    /**
     * @name WheelEvent#deltaZ
     * @type Number
     */
    this.deltaZ = ev.deltaZ;

    /**
     * @name WheelEvent#deltaMode
     * @type Number
     */
    this.deltaMode = ev.deltaMode;
}

WheelEvent.prototype = Object.create(MouseEvent.prototype);
WheelEvent.prototype.constructor = WheelEvent;

/**
 * Return the name of the event type
 *
 * @method
 *
 * @return {String} Name of the event type
 */
WheelEvent.prototype.toString = function toString () {
    return 'WheelEvent';
};

module.exports = WheelEvent;

},{"./MouseEvent":21}],25:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * A two-dimensional vector.
 *
 * @class Vec2
 *
 * @param {Number} x The x component.
 * @param {Number} y The y component.
 */
var Vec2 = function(x, y) {
    if (x instanceof Array || x instanceof Float32Array) {
        this.x = x[0] || 0;
        this.y = x[1] || 0;
    }
    else {
        this.x = x || 0;
        this.y = y || 0;
    }
};

/**
 * Set the components of the current Vec2.
 *
 * @method
 *
 * @param {Number} x The x component.
 * @param {Number} y The y component.
 *
 * @return {Vec2} this
 */
Vec2.prototype.set = function set(x, y) {
    if (x != null) this.x = x;
    if (y != null) this.y = y;
    return this;
};

/**
 * Add the input v to the current Vec2.
 *
 * @method
 *
 * @param {Vec2} v The Vec2 to add.
 *
 * @return {Vec2} this
 */
Vec2.prototype.add = function add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
};

/**
 * Subtract the input v from the current Vec2.
 *
 * @method
 *
 * @param {Vec2} v The Vec2 to subtract.
 *
 * @return {Vec2} this
 */
Vec2.prototype.subtract = function subtract(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
};

/**
 * Scale the current Vec2 by a scalar or Vec2.
 *
 * @method
 *
 * @param {Number|Vec2} s The Number or vec2 by which to scale.
 *
 * @return {Vec2} this
 */
Vec2.prototype.scale = function scale(s) {
    if (s instanceof Vec2) {
        this.x *= s.x;
        this.y *= s.y;
    }
    else {
        this.x *= s;
        this.y *= s;
    }
    return this;
};

/**
 * Rotate the Vec2 counter-clockwise by theta about the z-axis.
 *
 * @method
 *
 * @param {Number} theta Angle by which to rotate.
 *
 * @return {Vec2} this
 */
Vec2.prototype.rotate = function(theta) {
    var x = this.x;
    var y = this.y;

    var cosTheta = Math.cos(theta);
    var sinTheta = Math.sin(theta);

    this.x = x * cosTheta - y * sinTheta;
    this.y = x * sinTheta + y * cosTheta;

    return this;
};

/**
 * The dot product of of the current Vec2 with the input Vec2.
 *
 * @method
 *
 * @param {Number} v The other Vec2.
 *
 * @return {Vec2} this
 */
Vec2.prototype.dot = function(v) {
    return this.x * v.x + this.y * v.y;
};

/**
 * The cross product of of the current Vec2 with the input Vec2.
 *
 * @method
 *
 * @param {Number} v The other Vec2.
 *
 * @return {Vec2} this
 */
Vec2.prototype.cross = function(v) {
    return this.x * v.y - this.y * v.x;
};

/**
 * Preserve the magnitude but invert the orientation of the current Vec2.
 *
 * @method
 *
 * @return {Vec2} this
 */
Vec2.prototype.invert = function invert() {
    this.x *= -1;
    this.y *= -1;
    return this;
};

/**
 * Apply a function component-wise to the current Vec2.
 *
 * @method
 *
 * @param {Function} fn Function to apply.
 *
 * @return {Vec2} this
 */
Vec2.prototype.map = function map(fn) {
    this.x = fn(this.x);
    this.y = fn(this.y);
    return this;
};

/**
 * Get the magnitude of the current Vec2.
 *
 * @method
 *
 * @return {Number} the length of the vector
 */
Vec2.prototype.length = function length() {
    var x = this.x;
    var y = this.y;

    return Math.sqrt(x * x + y * y);
};

/**
 * Copy the input onto the current Vec2.
 *
 * @method
 *
 * @param {Vec2} v Vec2 to copy
 *
 * @return {Vec2} this
 */
Vec2.prototype.copy = function copy(v) {
    this.x = v.x;
    this.y = v.y;
    return this;
};

/**
 * Reset the current Vec2.
 *
 * @method
 *
 * @return {Vec2} this
 */
Vec2.prototype.clear = function clear() {
    this.x = 0;
    this.y = 0;
    return this;
};

/**
 * Check whether the magnitude of the current Vec2 is exactly 0.
 *
 * @method
 *
 * @return {Boolean} whether or not the length is 0
 */
Vec2.prototype.isZero = function isZero() {
    if (this.x !== 0 || this.y !== 0) return false;
    else return true;
};

/**
 * The array form of the current Vec2.
 *
 * @method
 *
 * @return {Array} the Vec to as an array
 */
Vec2.prototype.toArray = function toArray() {
    return [this.x, this.y];
};

/**
 * Normalize the input Vec2.
 *
 * @method
 *
 * @param {Vec2} v The reference Vec2.
 * @param {Vec2} output Vec2 in which to place the result.
 *
 * @return {Vec2} The normalized Vec2.
 */
Vec2.normalize = function normalize(v, output) {
    var x = v.x;
    var y = v.y;

    var length = Math.sqrt(x * x + y * y) || 1;
    length = 1 / length;
    output.x = v.x * length;
    output.y = v.y * length;

    return output;
};

/**
 * Clone the input Vec2.
 *
 * @method
 *
 * @param {Vec2} v The Vec2 to clone.
 *
 * @return {Vec2} The cloned Vec2.
 */
Vec2.clone = function clone(v) {
    return new Vec2(v.x, v.y);
};

/**
 * Add the input Vec2's.
 *
 * @method
 *
 * @param {Vec2} v1 The left Vec2.
 * @param {Vec2} v2 The right Vec2.
 * @param {Vec2} output Vec2 in which to place the result.
 *
 * @return {Vec2} The result of the addition.
 */
Vec2.add = function add(v1, v2, output) {
    output.x = v1.x + v2.x;
    output.y = v1.y + v2.y;

    return output;
};

/**
 * Subtract the second Vec2 from the first.
 *
 * @method
 *
 * @param {Vec2} v1 The left Vec2.
 * @param {Vec2} v2 The right Vec2.
 * @param {Vec2} output Vec2 in which to place the result.
 *
 * @return {Vec2} The result of the subtraction.
 */
Vec2.subtract = function subtract(v1, v2, output) {
    output.x = v1.x - v2.x;
    output.y = v1.y - v2.y;
    return output;
};

/**
 * Scale the input Vec2.
 *
 * @method
 *
 * @param {Vec2} v The reference Vec2.
 * @param {Number} s Number to scale by.
 * @param {Vec2} output Vec2 in which to place the result.
 *
 * @return {Vec2} The result of the scaling.
 */
Vec2.scale = function scale(v, s, output) {
    output.x = v.x * s;
    output.y = v.y * s;
    return output;
};

/**
 * The dot product of the input Vec2's.
 *
 * @method
 *
 * @param {Vec2} v1 The left Vec2.
 * @param {Vec2} v2 The right Vec2.
 *
 * @return {Number} The dot product.
 */
Vec2.dot = function dot(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y;
};

/**
 * The cross product of the input Vec2's.
 *
 * @method
 *
 * @param {Number} v1 The left Vec2.
 * @param {Number} v2 The right Vec2.
 *
 * @return {Number} The z-component of the cross product.
 */
Vec2.cross = function(v1,v2) {
    return v1.x * v2.y - v1.y * v2.x;
};

module.exports = Vec2;

},{}],26:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * A three-dimensional vector.
 *
 * @class Vec3
 *
 * @param {Number} x The x component.
 * @param {Number} y The y component.
 * @param {Number} z The z component.
 */
var Vec3 = function(x ,y, z){
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
};

/**
 * Set the components of the current Vec3.
 *
 * @method
 *
 * @param {Number} x The x component.
 * @param {Number} y The y component.
 * @param {Number} z The z component.
 *
 * @return {Vec3} this
 */
Vec3.prototype.set = function set(x, y, z) {
    if (x != null) this.x = x;
    if (y != null) this.y = y;
    if (z != null) this.z = z;

    return this;
};

/**
 * Add the input v to the current Vec3.
 *
 * @method
 *
 * @param {Vec3} v The Vec3 to add.
 *
 * @return {Vec3} this
 */
Vec3.prototype.add = function add(v) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;

    return this;
};

/**
 * Subtract the input v from the current Vec3.
 *
 * @method
 *
 * @param {Vec3} v The Vec3 to subtract.
 *
 * @return {Vec3} this
 */
Vec3.prototype.subtract = function subtract(v) {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;

    return this;
};

/**
 * Rotate the current Vec3 by theta clockwise about the x axis.
 *
 * @method
 *
 * @param {Number} theta Angle by which to rotate.
 *
 * @return {Vec3} this
 */
Vec3.prototype.rotateX = function rotateX(theta) {
    var y = this.y;
    var z = this.z;

    var cosTheta = Math.cos(theta);
    var sinTheta = Math.sin(theta);

    this.y = y * cosTheta - z * sinTheta;
    this.z = y * sinTheta + z * cosTheta;

    return this;
};

/**
 * Rotate the current Vec3 by theta clockwise about the y axis.
 *
 * @method
 *
 * @param {Number} theta Angle by which to rotate.
 *
 * @return {Vec3} this
 */
Vec3.prototype.rotateY = function rotateY(theta) {
    var x = this.x;
    var z = this.z;

    var cosTheta = Math.cos(theta);
    var sinTheta = Math.sin(theta);

    this.x = z * sinTheta + x * cosTheta;
    this.z = z * cosTheta - x * sinTheta;

    return this;
};

/**
 * Rotate the current Vec3 by theta clockwise about the z axis.
 *
 * @method
 *
 * @param {Number} theta Angle by which to rotate.
 *
 * @return {Vec3} this
 */
Vec3.prototype.rotateZ = function rotateZ(theta) {
    var x = this.x;
    var y = this.y;

    var cosTheta = Math.cos(theta);
    var sinTheta = Math.sin(theta);

    this.x = x * cosTheta - y * sinTheta;
    this.y = x * sinTheta + y * cosTheta;

    return this;
};

/**
 * The dot product of the current Vec3 with input Vec3 v.
 *
 * @method
 *
 * @param {Vec3} v The other Vec3.
 *
 * @return {Vec3} this
 */
Vec3.prototype.dot = function dot(v) {
    return this.x*v.x + this.y*v.y + this.z*v.z;
};

/**
 * The dot product of the current Vec3 with input Vec3 v.
 * Stores the result in the current Vec3.
 *
 * @method cross
 *
 * @param {Vec3} v The other Vec3
 *
 * @return {Vec3} this
 */
Vec3.prototype.cross = function cross(v) {
    var x = this.x;
    var y = this.y;
    var z = this.z;

    var vx = v.x;
    var vy = v.y;
    var vz = v.z;

    this.x = y * vz - z * vy;
    this.y = z * vx - x * vz;
    this.z = x * vy - y * vx;
    return this;
};

/**
 * Scale the current Vec3 by a scalar.
 *
 * @method
 *
 * @param {Number} s The Number by which to scale
 *
 * @return {Vec3} this
 */
Vec3.prototype.scale = function scale(s) {
    this.x *= s;
    this.y *= s;
    this.z *= s;

    return this;
};

/**
 * Preserve the magnitude but invert the orientation of the current Vec3.
 *
 * @method
 *
 * @return {Vec3} this
 */
Vec3.prototype.invert = function invert() {
    this.x = -this.x;
    this.y = -this.y;
    this.z = -this.z;

    return this;
};

/**
 * Apply a function component-wise to the current Vec3.
 *
 * @method
 *
 * @param {Function} fn Function to apply.
 *
 * @return {Vec3} this
 */
Vec3.prototype.map = function map(fn) {
    this.x = fn(this.x);
    this.y = fn(this.y);
    this.z = fn(this.z);

    return this;
};

/**
 * The magnitude of the current Vec3.
 *
 * @method
 *
 * @return {Number} the magnitude of the Vec3
 */
Vec3.prototype.length = function length() {
    var x = this.x;
    var y = this.y;
    var z = this.z;

    return Math.sqrt(x * x + y * y + z * z);
};

/**
 * The magnitude squared of the current Vec3.
 *
 * @method
 *
 * @return {Number} magnitude of the Vec3 squared
 */
Vec3.prototype.lengthSq = function lengthSq() {
    var x = this.x;
    var y = this.y;
    var z = this.z;

    return x * x + y * y + z * z;
};

/**
 * Copy the input onto the current Vec3.
 *
 * @method
 *
 * @param {Vec3} v Vec3 to copy
 *
 * @return {Vec3} this
 */
Vec3.prototype.copy = function copy(v) {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    return this;
};

/**
 * Reset the current Vec3.
 *
 * @method
 *
 * @return {Vec3} this
 */
Vec3.prototype.clear = function clear() {
    this.x = 0;
    this.y = 0;
    this.z = 0;
    return this;
};

/**
 * Check whether the magnitude of the current Vec3 is exactly 0.
 *
 * @method
 *
 * @return {Boolean} whether or not the magnitude is zero
 */
Vec3.prototype.isZero = function isZero() {
    return this.x === 0 && this.y === 0 && this.z === 0;
};

/**
 * The array form of the current Vec3.
 *
 * @method
 *
 * @return {Array} a three element array representing the components of the Vec3
 */
Vec3.prototype.toArray = function toArray() {
    return [this.x, this.y, this.z];
};

/**
 * Preserve the orientation but change the length of the current Vec3 to 1.
 *
 * @method
 *
 * @return {Vec3} this
 */
Vec3.prototype.normalize = function normalize() {
    var x = this.x;
    var y = this.y;
    var z = this.z;

    var len = Math.sqrt(x * x + y * y + z * z) || 1;
    len = 1 / len;

    this.x *= len;
    this.y *= len;
    this.z *= len;
    return this;
};

/**
 * Apply the rotation corresponding to the input (unit) Quaternion
 * to the current Vec3.
 *
 * @method
 *
 * @param {Quaternion} q Unit Quaternion representing the rotation to apply
 *
 * @return {Vec3} this
 */
Vec3.prototype.applyRotation = function applyRotation(q) {
    var cw = q.w;
    var cx = -q.x;
    var cy = -q.y;
    var cz = -q.z;

    var vx = this.x;
    var vy = this.y;
    var vz = this.z;

    var tw = -cx * vx - cy * vy - cz * vz;
    var tx = vx * cw + vy * cz - cy * vz;
    var ty = vy * cw + cx * vz - vx * cz;
    var tz = vz * cw + vx * cy - cx * vy;

    var w = cw;
    var x = -cx;
    var y = -cy;
    var z = -cz;

    this.x = tx * w + x * tw + y * tz - ty * z;
    this.y = ty * w + y * tw + tx * z - x * tz;
    this.z = tz * w + z * tw + x * ty - tx * y;
    return this;
};

/**
 * Apply the input Mat33 the the current Vec3.
 *
 * @method
 *
 * @param {Mat33} matrix Mat33 to apply
 *
 * @return {Vec3} this
 */
Vec3.prototype.applyMatrix = function applyMatrix(matrix) {
    var M = matrix.get();

    var x = this.x;
    var y = this.y;
    var z = this.z;

    this.x = M[0]*x + M[1]*y + M[2]*z;
    this.y = M[3]*x + M[4]*y + M[5]*z;
    this.z = M[6]*x + M[7]*y + M[8]*z;
    return this;
};

/**
 * Normalize the input Vec3.
 *
 * @method
 *
 * @param {Vec3} v The reference Vec3.
 * @param {Vec3} output Vec3 in which to place the result.
 *
 * @return {Vec3} The normalize Vec3.
 */
Vec3.normalize = function normalize(v, output) {
    var x = v.x;
    var y = v.y;
    var z = v.z;

    var length = Math.sqrt(x * x + y * y + z * z) || 1;
    length = 1 / length;

    output.x = x * length;
    output.y = y * length;
    output.z = z * length;
    return output;
};

/**
 * Apply a rotation to the input Vec3.
 *
 * @method
 *
 * @param {Vec3} v The reference Vec3.
 * @param {Quaternion} q Unit Quaternion representing the rotation to apply.
 * @param {Vec3} output Vec3 in which to place the result.
 *
 * @return {Vec3} The rotated version of the input Vec3.
 */
Vec3.applyRotation = function applyRotation(v, q, output) {
    var cw = q.w;
    var cx = -q.x;
    var cy = -q.y;
    var cz = -q.z;

    var vx = v.x;
    var vy = v.y;
    var vz = v.z;

    var tw = -cx * vx - cy * vy - cz * vz;
    var tx = vx * cw + vy * cz - cy * vz;
    var ty = vy * cw + cx * vz - vx * cz;
    var tz = vz * cw + vx * cy - cx * vy;

    var w = cw;
    var x = -cx;
    var y = -cy;
    var z = -cz;

    output.x = tx * w + x * tw + y * tz - ty * z;
    output.y = ty * w + y * tw + tx * z - x * tz;
    output.z = tz * w + z * tw + x * ty - tx * y;
    return output;
};

/**
 * Clone the input Vec3.
 *
 * @method
 *
 * @param {Vec3} v The Vec3 to clone.
 *
 * @return {Vec3} The cloned Vec3.
 */
Vec3.clone = function clone(v) {
    return new Vec3(v.x, v.y, v.z);
};

/**
 * Add the input Vec3's.
 *
 * @method
 *
 * @param {Vec3} v1 The left Vec3.
 * @param {Vec3} v2 The right Vec3.
 * @param {Vec3} output Vec3 in which to place the result.
 *
 * @return {Vec3} The result of the addition.
 */
Vec3.add = function add(v1, v2, output) {
    output.x = v1.x + v2.x;
    output.y = v1.y + v2.y;
    output.z = v1.z + v2.z;
    return output;
};

/**
 * Subtract the second Vec3 from the first.
 *
 * @method
 *
 * @param {Vec3} v1 The left Vec3.
 * @param {Vec3} v2 The right Vec3.
 * @param {Vec3} output Vec3 in which to place the result.
 *
 * @return {Vec3} The result of the subtraction.
 */
Vec3.subtract = function subtract(v1, v2, output) {
    output.x = v1.x - v2.x;
    output.y = v1.y - v2.y;
    output.z = v1.z - v2.z;
    return output;
};

/**
 * Scale the input Vec3.
 *
 * @method
 *
 * @param {Vec3} v The reference Vec3.
 * @param {Number} s Number to scale by.
 * @param {Vec3} output Vec3 in which to place the result.
 *
 * @return {Vec3} The result of the scaling.
 */
Vec3.scale = function scale(v, s, output) {
    output.x = v.x * s;
    output.y = v.y * s;
    output.z = v.z * s;
    return output;
};

/**
 * The dot product of the input Vec3's.
 *
 * @method
 *
 * @param {Vec3} v1 The left Vec3.
 * @param {Vec3} v2 The right Vec3.
 *
 * @return {Number} The dot product.
 */
Vec3.dot = function dot(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
};

/**
 * The (right-handed) cross product of the input Vec3's.
 * v1 x v2.
 *
 * @method
 *
 * @param {Vec3} v1 The left Vec3.
 * @param {Vec3} v2 The right Vec3.
 * @param {Vec3} output Vec3 in which to place the result.
 *
 * @return {Object} the object the result of the cross product was placed into
 */
Vec3.cross = function cross(v1, v2, output) {
    var x1 = v1.x;
    var y1 = v1.y;
    var z1 = v1.z;
    var x2 = v2.x;
    var y2 = v2.y;
    var z2 = v2.z;

    output.x = y1 * z2 - z1 * y2;
    output.y = z1 * x2 - x1 * z2;
    output.z = x1 * y2 - y1 * x2;
    return output;
};

/**
 * The projection of v1 onto v2.
 *
 * @method
 *
 * @param {Vec3} v1 The left Vec3.
 * @param {Vec3} v2 The right Vec3.
 * @param {Vec3} output Vec3 in which to place the result.
 *
 * @return {Object} the object the result of the cross product was placed into 
 */
Vec3.project = function project(v1, v2, output) {
    var x1 = v1.x;
    var y1 = v1.y;
    var z1 = v1.z;
    var x2 = v2.x;
    var y2 = v2.y;
    var z2 = v2.z;

    var scale = x1 * x2 + y1 * y2 + z1 * z2;
    scale /= x2 * x2 + y2 * y2 + z2 * z2;

    output.x = x2 * scale;
    output.y = y2 * scale;
    output.z = z2 * scale;

    return output;
};

module.exports = Vec3;

},{}],27:[function(require,module,exports){
module.exports = noop

function noop() {
  throw new Error(
      'You should bundle your code ' +
      'using `glslify` as a transform.'
  )
}

},{}],28:[function(require,module,exports){
module.exports = programify

function programify(vertex, fragment, uniforms, attributes) {
  return {
    vertex: vertex, 
    fragment: fragment,
    uniforms: uniforms, 
    attributes: attributes
  };
}

},{}],29:[function(require,module,exports){
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
// MIT license

'use strict';

var lastTime = 0;
var vendors = ['ms', 'moz', 'webkit', 'o'];

var rAF, cAF;

if (typeof window === 'object') {
    rAF = window.requestAnimationFrame;
    cAF = window.cancelAnimationFrame || window.cancelRequestAnimationFrame;
    for (var x = 0; x < vendors.length && !rAF; ++x) {
        rAF = window[vendors[x] + 'RequestAnimationFrame'];
        cAF = window[vendors[x] + 'CancelRequestAnimationFrame'] ||
              window[vendors[x] + 'CancelAnimationFrame'];
    }

    if (rAF && !cAF) {
        // cAF not supported.
        // Fall back to setInterval for now (very rare).
        rAF = null;
    }
}

if (!rAF) {
    var now = Date.now ? Date.now : function () {
        return new Date().getTime();
    };

    rAF = function(callback) {
        var currTime = now();
        var timeToCall = Math.max(0, 16 - (currTime - lastTime));
        var id = setTimeout(function () {
            callback(currTime + timeToCall);
        }, timeToCall);
        lastTime = currTime + timeToCall;
        return id;
    };

    cAF = function (id) {
        clearTimeout(id);
    };
}

var animationFrame = {
    /**
     * Cross browser version of [requestAnimationFrame]{@link https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame}.
     *
     * Used by Engine in order to establish a render loop.
     *
     * If no (vendor prefixed version of) `requestAnimationFrame` is available,
     * `setTimeout` will be used in order to emulate a render loop running at
     * approximately 60 frames per second.
     *
     * @method  requestAnimationFrame
     *
     * @param   {Function}  callback function to be invoked on the next frame.
     * @return  {Number}    requestId to be used to cancel the request using
     *                      {@link cancelAnimationFrame}.
     */
    requestAnimationFrame: rAF,

    /**
     * Cross browser version of [cancelAnimationFrame]{@link https://developer.mozilla.org/en-US/docs/Web/API/window/cancelAnimationFrame}.
     *
     * Cancels a previously using [requestAnimationFrame]{@link animationFrame#requestAnimationFrame}
     * scheduled request.
     *
     * Used for immediately stopping the render loop within the Engine.
     *
     * @method  cancelAnimationFrame
     *
     * @param   {Number}    requestId of the scheduled callback function
     *                      returned by [requestAnimationFrame]{@link animationFrame#requestAnimationFrame}.
     */
    cancelAnimationFrame: cAF
};

module.exports = animationFrame;

},{}],30:[function(require,module,exports){
/**
 * The MIT License (MIT)
 * 
 * Copyright (c) 2015 Famous Industries Inc.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

module.exports = {
    requestAnimationFrame: require('./animationFrame').requestAnimationFrame,
    cancelAnimationFrame: require('./animationFrame').cancelAnimationFrame
};

},{"./animationFrame":29}],31:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var polyfills = require('../polyfills');
var rAF = polyfills.requestAnimationFrame;
var cAF = polyfills.cancelAnimationFrame;

/**
 * Boolean constant indicating whether the RequestAnimationFrameLoop has access
 * to the document. The document is being used in order to subscribe for
 * visibilitychange events used for normalizing the RequestAnimationFrameLoop
 * time when e.g. when switching tabs.
 *
 * @constant
 * @type {Boolean}
 */
var DOCUMENT_ACCESS = typeof document !== 'undefined';

if (DOCUMENT_ACCESS) {
    var VENDOR_HIDDEN, VENDOR_VISIBILITY_CHANGE;

    // Opera 12.10 and Firefox 18 and later support
    if (typeof document.hidden !== 'undefined') {
        VENDOR_HIDDEN = 'hidden';
        VENDOR_VISIBILITY_CHANGE = 'visibilitychange';
    }
    else if (typeof document.mozHidden !== 'undefined') {
        VENDOR_HIDDEN = 'mozHidden';
        VENDOR_VISIBILITY_CHANGE = 'mozvisibilitychange';
    }
    else if (typeof document.msHidden !== 'undefined') {
        VENDOR_HIDDEN = 'msHidden';
        VENDOR_VISIBILITY_CHANGE = 'msvisibilitychange';
    }
    else if (typeof document.webkitHidden !== 'undefined') {
        VENDOR_HIDDEN = 'webkitHidden';
        VENDOR_VISIBILITY_CHANGE = 'webkitvisibilitychange';
    }
}

/**
 * RequestAnimationFrameLoop class used for updating objects on a frame-by-frame.
 * Synchronizes the `update` method invocations to the refresh rate of the
 * screen. Manages the `requestAnimationFrame`-loop by normalizing the passed in
 * timestamp when switching tabs.
 *
 * @class RequestAnimationFrameLoop
 */
function RequestAnimationFrameLoop() {
    var _this = this;

    // References to objects to be updated on next frame.
    this._updates = [];

    this._looper = function(time) {
        _this.loop(time);
    };
    this._time = 0;
    this._stoppedAt = 0;
    this._sleep = 0;

    // Indicates whether the engine should be restarted when the tab/ window is
    // being focused again (visibility change).
    this._startOnVisibilityChange = true;

    // requestId as returned by requestAnimationFrame function;
    this._rAF = null;

    this._sleepDiff = true;

    // The engine is being started on instantiation.
    // TODO(alexanderGugel)
    this.start();

    // The RequestAnimationFrameLoop supports running in a non-browser
    // environment (e.g. Worker).
    if (DOCUMENT_ACCESS) {
        document.addEventListener(VENDOR_VISIBILITY_CHANGE, function() {
            _this._onVisibilityChange();
        });
    }
}

/**
 * Handle the switching of tabs.
 *
 * @method
 * @private
 *
 * @return {undefined} undefined
 */
RequestAnimationFrameLoop.prototype._onVisibilityChange = function _onVisibilityChange() {
    if (document[VENDOR_HIDDEN]) {
        this._onUnfocus();
    }
    else {
        this._onFocus();
    }
};

/**
 * Internal helper function to be invoked as soon as the window/ tab is being
 * focused after a visibiltiy change.
 *
 * @method
 * @private
 *
 * @return {undefined} undefined
 */
RequestAnimationFrameLoop.prototype._onFocus = function _onFocus() {
    if (this._startOnVisibilityChange) {
        this._start();
    }
};

/**
 * Internal helper function to be invoked as soon as the window/ tab is being
 * unfocused (hidden) after a visibiltiy change.
 *
 * @method  _onFocus
 * @private
 *
 * @return {undefined} undefined
 */
RequestAnimationFrameLoop.prototype._onUnfocus = function _onUnfocus() {
    this._stop();
};

/**
 * Starts the RequestAnimationFrameLoop. When switching to a differnt tab/
 * window (changing the visibiltiy), the engine will be retarted when switching
 * back to a visible state.
 *
 * @method
 *
 * @return {RequestAnimationFrameLoop} this
 */
RequestAnimationFrameLoop.prototype.start = function start() {
    if (!this._running) {
        this._startOnVisibilityChange = true;
        this._start();
    }
    return this;
};

/**
 * Internal version of RequestAnimationFrameLoop's start function, not affecting
 * behavior on visibilty change.
 *
 * @method
 * @private
*
 * @return {undefined} undefined
 */
RequestAnimationFrameLoop.prototype._start = function _start() {
    this._running = true;
    this._sleepDiff = true;
    this._rAF = rAF(this._looper);
};

/**
 * Stops the RequestAnimationFrameLoop.
 *
 * @method
 * @private
 *
 * @return {RequestAnimationFrameLoop} this
 */
RequestAnimationFrameLoop.prototype.stop = function stop() {
    if (this._running) {
        this._startOnVisibilityChange = false;
        this._stop();
    }
    return this;
};

/**
 * Internal version of RequestAnimationFrameLoop's stop function, not affecting
 * behavior on visibilty change.
 *
 * @method
 * @private
 *
 * @return {undefined} undefined
 */
RequestAnimationFrameLoop.prototype._stop = function _stop() {
    this._running = false;
    this._stoppedAt = this._time;

    // Bug in old versions of Fx. Explicitly cancel.
    cAF(this._rAF);
};

/**
 * Determines whether the RequestAnimationFrameLoop is currently running or not.
 *
 * @method
 *
 * @return {Boolean} boolean value indicating whether the
 * RequestAnimationFrameLoop is currently running or not
 */
RequestAnimationFrameLoop.prototype.isRunning = function isRunning() {
    return this._running;
};

/**
 * Updates all registered objects.
 *
 * @method
 *
 * @param {Number} time high resolution timstamp used for invoking the `update`
 * method on all registered objects
 *
 * @return {RequestAnimationFrameLoop} this
 */
RequestAnimationFrameLoop.prototype.step = function step (time) {
    this._time = time;
    if (this._sleepDiff) {
        this._sleep += time - this._stoppedAt;
        this._sleepDiff = false;
    }

    // The same timetamp will be emitted immediately before and after visibility
    // change.
    var normalizedTime = time - this._sleep;
    for (var i = 0, len = this._updates.length ; i < len ; i++) {
        this._updates[i].update(normalizedTime);
    }
    return this;
};

/**
 * Method being called by `requestAnimationFrame` on every paint. Indirectly
 * recursive by scheduling a future invocation of itself on the next paint.
 *
 * @method
 *
 * @param {Number} time high resolution timstamp used for invoking the `update`
 * method on all registered objects
 * @return {RequestAnimationFrameLoop} this
 */
RequestAnimationFrameLoop.prototype.loop = function loop(time) {
    this.step(time);
    this._rAF = rAF(this._looper);
    return this;
};

/**
 * Registeres an updateable object which `update` method should be invoked on
 * every paint, starting on the next paint (assuming the
 * RequestAnimationFrameLoop is running).
 *
 * @method
 *
 * @param {Object} updateable object to be updated
 * @param {Function} updateable.update update function to be called on the
 * registered object
 *
 * @return {RequestAnimationFrameLoop} this
 */
RequestAnimationFrameLoop.prototype.update = function update(updateable) {
    if (this._updates.indexOf(updateable) === -1) {
        this._updates.push(updateable);
    }
    return this;
};

/**
 * Deregisters an updateable object previously registered using `update` to be
 * no longer updated.
 *
 * @method
 *
 * @param {Object} updateable updateable object previously registered using
 * `update`
 *
 * @return {RequestAnimationFrameLoop} this
 */
RequestAnimationFrameLoop.prototype.noLongerUpdate = function noLongerUpdate(updateable) {
    var index = this._updates.indexOf(updateable);
    if (index > -1) {
        this._updates.splice(index, 1);
    }
    return this;
};

module.exports = RequestAnimationFrameLoop;

},{"../polyfills":30}],32:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var Context = require('./Context');
var injectCSS = require('./inject-css');

/**
 * Instantiates a new Compositor.
 * The Compositor receives draw commands frm the UIManager and routes the to the
 * respective context objects.
 *
 * Upon creation, it injects a stylesheet used for styling the individual
 * renderers used in the context objects.
 *
 * @class Compositor
 * @constructor
 * @return {undefined} undefined
 */
function Compositor() {
    injectCSS();

    this._contexts = {};
    this._outCommands = [];
    this._inCommands = [];
    this._time = null;

    this._resized = false;

    var _this = this;
    window.addEventListener('resize', function() {
        _this._resized = true;
    });
}

/**
 * Retrieves the time being used by the internal clock managed by
 * `FamousEngine`.
 *
 * The time is being passed into core by the Engine through the UIManager.
 * Since core has the ability to scale the time, the time needs to be passed
 * back to the rendering system.
 *
 * @method
 *
 * @return {Number} time The clock time used in core.
 */
Compositor.prototype.getTime = function getTime() {
    return this._time;
};

/**
 * Schedules an event to be sent the next time the out command queue is being
 * flushed.
 *
 * @method
 * @private
 *
 * @param  {String} path Render path to the node the event should be triggered
 * on (*targeted event*)
 * @param  {String} ev Event type
 * @param  {Object} payload Event object (serializable using structured cloning
 * algorithm)
 *
 * @return {undefined} undefined
 */
Compositor.prototype.sendEvent = function sendEvent(path, ev, payload) {
    this._outCommands.push('WITH', path, 'TRIGGER', ev, payload);
};

/**
 * Internal helper method used for notifying externally
 * resized contexts (e.g. by resizing the browser window).
 *
 * @method
 * @private
 *
 * @param  {String} selector render path to the node (context) that should be
 * resized
 * @param  {Array} size new context size
 *
 * @return {undefined} undefined
 */
Compositor.prototype.sendResize = function sendResize (selector, size) {
    this.sendEvent(selector, 'CONTEXT_RESIZE', size);
};

/**
 * Internal helper method used by `drawCommands`.
 * Subsequent commands are being associated with the node defined the the path
 * following the `WITH` command.
 *
 * @method
 * @private
 *
 * @param  {Number} iterator position index within the commands queue
 * @param  {Array} commands remaining message queue received, used to
 * shift single messages from
 *
 * @return {undefined} undefined
 */
Compositor.prototype.handleWith = function handleWith (iterator, commands) {
    var path = commands[iterator];
    var pathArr = path.split('/');
    var context = this.getOrSetContext(pathArr.shift());
    return context.receive(path, commands, iterator);
};

/**
 * Retrieves the top-level Context associated with the passed in document
 * query selector. If no such Context exists, a new one will be instantiated.
 *
 * @method
 * @private
 *
 * @param  {String} selector document query selector used for retrieving the
 * DOM node the VirtualElement should be attached to
 *
 * @return {Context} context
 */
Compositor.prototype.getOrSetContext = function getOrSetContext(selector) {
    if (this._contexts[selector]) {
        return this._contexts[selector];
    }
    else {
        var context = new Context(selector, this);
        this._contexts[selector] = context;
        return context;
    }
};

/**
 * Internal helper method used by `drawCommands`.
 *
 * @method
 * @private
 *
 * @param  {Number} iterator position index within the command queue
 * @param  {Array} commands remaining message queue received, used to
 * shift single messages
 *
 * @return {undefined} undefined
 */
Compositor.prototype.giveSizeFor = function giveSizeFor(iterator, commands) {
    var selector = commands[iterator];
    var size = this.getOrSetContext(selector).getRootSize();
    this.sendResize(selector, size);
};

/**
 * Processes the previously via `receiveCommands` updated incoming "in"
 * command queue.
 * Called by UIManager on a frame by frame basis.
 *
 * @method
 *
 * @return {Array} outCommands set of commands to be sent back
 */
Compositor.prototype.drawCommands = function drawCommands() {
    var commands = this._inCommands;
    var localIterator = 0;
    var command = commands[localIterator];
    while (command) {
        switch (command) {
            case 'TIME':
                this._time = commands[++localIterator];
                break;
            case 'WITH':
                localIterator = this.handleWith(++localIterator, commands);
                break;
            case 'NEED_SIZE_FOR':
                this.giveSizeFor(++localIterator, commands);
                break;
        }
        command = commands[++localIterator];
    }

    // TODO: Switch to associative arrays here...

    for (var key in this._contexts) {
        this._contexts[key].draw();
    }

    if (this._resized) {
        this.updateSize();
    }

    return this._outCommands;
};


/**
 * Updates the size of all previously registered context objects.
 * This results into CONTEXT_RESIZE events being sent and the root elements
 * used by the individual renderers being resized to the the DOMRenderer's root
 * size.
 *
 * @method
 *
 * @return {undefined} undefined
 */
Compositor.prototype.updateSize = function updateSize() {
    for (var selector in this._contexts) {
        this._contexts[selector].updateSize();
    }
};

/**
 * Used by ThreadManager to update the internal queue of incoming commands.
 * Receiving commands does not immediately start the rendering process.
 *
 * @method
 *
 * @param  {Array} commands command queue to be processed by the compositor's
 * `drawCommands` method
 *
 * @return {undefined} undefined
 */
Compositor.prototype.receiveCommands = function receiveCommands(commands) {
    var len = commands.length;
    for (var i = 0; i < len; i++) {
        this._inCommands.push(commands[i]);
    }
};

/**
 * Flushes the queue of outgoing "out" commands.
 * Called by ThreadManager.
 *
 * @method
 *
 * @return {undefined} undefined
 */
Compositor.prototype.clearCommands = function clearCommands() {
    this._inCommands.length = 0;
    this._outCommands.length = 0;
    this._resized = false;
};

module.exports = Compositor;

},{"./Context":33,"./inject-css":35}],33:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var WebGLRenderer = require('../webgl-renderers/WebGLRenderer');
var Camera = require('../components/Camera');
var DOMRenderer = require('../dom-renderers/DOMRenderer');

/**
 * Context is a render layer with its own WebGLRenderer and DOMRenderer.
 * It is the interface between the Compositor which receives commands
 * and the renderers that interpret them. It also relays information to
 * the renderers about resizing.
 *
 * The DOMElement at the given query selector is used as the root. A
 * new DOMElement is appended to this root element, and used as the
 * parent element for all Famous DOM rendering at this context. A
 * canvas is added and used for all WebGL rendering at this context.
 *
 * @class Context
 * @constructor
 *
 * @param {String} selector Query selector used to locate root element of
 * context layer.
 * @param {Compositor} compositor Compositor reference to pass down to
 * WebGLRenderer.
 *
 * @return {undefined} undefined
 */
function Context(selector, compositor) {
    this._compositor = compositor;
    this._rootEl = document.querySelector(selector);

    this._selector = selector;

    // Create DOM element to be used as root for all famous DOM
    // rendering and append element to the root element.

    var DOMLayerEl = document.createElement('div');
    this._rootEl.appendChild(DOMLayerEl);

    // Instantiate renderers

    this.DOMRenderer = new DOMRenderer(DOMLayerEl, selector, compositor);
    this.WebGLRenderer = null;
    this.canvas = null;

    // State holders

    this._renderState = {
        projectionType: Camera.ORTHOGRAPHIC_PROJECTION,
        perspectiveTransform: new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
        viewTransform: new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
        viewDirty: false,
        perspectiveDirty: false
    };

    this._size = [];
    this._children = {};
    this._elementHash = {};

    this._meshTransform = [];
    this._meshSize = [0, 0, 0];
}

/**
 * Queries DOMRenderer size and updates canvas size. Relays size information to
 * WebGLRenderer.
 *
 * @return {Context} this
 */
Context.prototype.updateSize = function () {
    var newSize = this.DOMRenderer.getSize();
    this._compositor.sendResize(this._selector, newSize);

    if (this.canvas && this.WebGLRenderer) {
        this.WebGLRenderer.updateSize(newSize);
    }

    return this;
};

/**
 * Draw function called after all commands have been handled for current frame.
 * Issues draw commands to all renderers with current renderState.
 *
 * @method
 *
 * @return {undefined} undefined
 */
Context.prototype.draw = function draw() {
    this.DOMRenderer.draw(this._renderState);
    if (this.WebGLRenderer) this.WebGLRenderer.draw(this._renderState);

    if (this._renderState.perspectiveDirty) this._renderState.perspectiveDirty = false;
    if (this._renderState.viewDirty) this._renderState.viewDirty = false;
};

/**
 * Gets the size of the parent element of the DOMRenderer for this context.
 *
 * @method
 *
 * @return {undefined} undefined
 */
Context.prototype.getRootSize = function getRootSize() {
    return this.DOMRenderer.getSize();
};

/**
 * Handles initialization of WebGLRenderer when necessary, including creation
 * of the canvas element and instantiation of the renderer. Also updates size
 * to pass size information to the renderer.
 *
 * @method
 *
 * @return {undefined} undefined
 */
Context.prototype.initWebGL = function initWebGL() {
    this.canvas = document.createElement('canvas');
    this._rootEl.appendChild(this.canvas);
    this.WebGLRenderer = new WebGLRenderer(this.canvas, this._compositor);
    this.updateSize();
};

/**
 * Handles delegation of commands to renderers of this context.
 *
 * @method
 *
 * @param {String} path String used as identifier of a given node in the
 * scene graph.
 * @param {Array} commands List of all commands from this frame.
 * @param {Number} iterator Number indicating progress through the command
 * queue.
 *
 * @return {Number} iterator indicating progress through the command queue.
 */
Context.prototype.receive = function receive(path, commands, iterator) {
    var localIterator = iterator;

    var command = commands[++localIterator];
    this.DOMRenderer.loadPath(path);
    this.DOMRenderer.findTarget();
    while (command) {

        switch (command) {
            case 'INIT_DOM':
                this.DOMRenderer.insertEl(commands[++localIterator]);
                break;

            case 'DOM_RENDER_SIZE':
                this.DOMRenderer.getSizeOf(commands[++localIterator]);
                break;

            case 'CHANGE_TRANSFORM':
                for (var i = 0 ; i < 16 ; i++) this._meshTransform[i] = commands[++localIterator];

                this.DOMRenderer.setMatrix(this._meshTransform);

                if (this.WebGLRenderer)
                    this.WebGLRenderer.setCutoutUniform(path, 'u_transform', this._meshTransform);

                break;

            case 'CHANGE_SIZE':
                var width = commands[++localIterator];
                var height = commands[++localIterator];

                this.DOMRenderer.setSize(width, height);
                if (this.WebGLRenderer) {
                    this._meshSize[0] = width;
                    this._meshSize[1] = height;
                    this.WebGLRenderer.setCutoutUniform(path, 'u_size', this._meshSize);
                }
                break;

            case 'CHANGE_PROPERTY':
                if (this.WebGLRenderer) this.WebGLRenderer.getOrSetCutout(path);
                this.DOMRenderer.setProperty(commands[++localIterator], commands[++localIterator]);
                break;

            case 'CHANGE_CONTENT':
                if (this.WebGLRenderer) this.WebGLRenderer.getOrSetCutout(path);
                this.DOMRenderer.setContent(commands[++localIterator]);
                break;

            case 'CHANGE_ATTRIBUTE':
                if (this.WebGLRenderer) this.WebGLRenderer.getOrSetCutout(path);
                this.DOMRenderer.setAttribute(commands[++localIterator], commands[++localIterator]);
                break;

            case 'ADD_CLASS':
                if (this.WebGLRenderer) this.WebGLRenderer.getOrSetCutout(path);
                this.DOMRenderer.addClass(commands[++localIterator]);
                break;

            case 'REMOVE_CLASS':
                if (this.WebGLRenderer) this.WebGLRenderer.getOrSetCutout(path);
                this.DOMRenderer.removeClass(commands[++localIterator]);
                break;

            case 'SUBSCRIBE':
                if (this.WebGLRenderer) this.WebGLRenderer.getOrSetCutout(path);
                this.DOMRenderer.subscribe(commands[++localIterator], commands[++localIterator]);
                break;

            case 'GL_SET_DRAW_OPTIONS':
                if (!this.WebGLRenderer) this.initWebGL();
                this.WebGLRenderer.setMeshOptions(path, commands[++localIterator]);
                break;

            case 'GL_AMBIENT_LIGHT':
                if (!this.WebGLRenderer) this.initWebGL();
                this.WebGLRenderer.setAmbientLightColor(
                    path,
                    commands[++localIterator],
                    commands[++localIterator],
                    commands[++localIterator]
                );
                break;

            case 'GL_LIGHT_POSITION':
                if (!this.WebGLRenderer) this.initWebGL();
                this.WebGLRenderer.setLightPosition(
                    path,
                    commands[++localIterator],
                    commands[++localIterator],
                    commands[++localIterator]
                );
                break;

            case 'GL_LIGHT_COLOR':
                if (!this.WebGLRenderer) this.initWebGL();
                this.WebGLRenderer.setLightColor(
                    path,
                    commands[++localIterator],
                    commands[++localIterator],
                    commands[++localIterator]
                );
                break;

            case 'MATERIAL_INPUT':
                if (!this.WebGLRenderer) this.initWebGL();
                this.WebGLRenderer.handleMaterialInput(
                    path,
                    commands[++localIterator],
                    commands[++localIterator]
                );
                break;

            case 'GL_SET_GEOMETRY':
                if (!this.WebGLRenderer) this.initWebGL();
                this.WebGLRenderer.setGeometry(
                    path,
                    commands[++localIterator],
                    commands[++localIterator],
                    commands[++localIterator]
                );
                break;

            case 'GL_UNIFORMS':
                if (!this.WebGLRenderer) this.initWebGL();
                this.WebGLRenderer.setMeshUniform(
                    path,
                    commands[++localIterator],
                    commands[++localIterator]
                );
                break;

            case 'GL_BUFFER_DATA':
                if (!this.WebGLRenderer) this.initWebGL();
                this.WebGLRenderer.bufferData(
                    path,
                    commands[++localIterator],
                    commands[++localIterator],
                    commands[++localIterator],
                    commands[++localIterator],
                    commands[++localIterator]
                );
                break;

            case 'GL_CUTOUT_STATE':
                if (!this.WebGLRenderer) this.initWebGL();
                this.WebGLRenderer.setCutoutState(path, commands[++localIterator]);
                break;

            case 'GL_MESH_VISIBILITY':
                if (!this.WebGLRenderer) this.initWebGL();
                this.WebGLRenderer.setMeshVisibility(path, commands[++localIterator]);
                break;

            case 'GL_REMOVE_MESH':
                if (!this.WebGLRenderer) this.initWebGL();
                this.WebGLRenderer.removeMesh(path);
                break;

            case 'PINHOLE_PROJECTION':
                this._renderState.projectionType = Camera.PINHOLE_PROJECTION;
                this._renderState.perspectiveTransform[11] = -1 / commands[++localIterator];

                this._renderState.perspectiveDirty = true;
                break;

            case 'ORTHOGRAPHIC_PROJECTION':
                this._renderState.projectionType = Camera.ORTHOGRAPHIC_PROJECTION;
                this._renderState.perspectiveTransform[11] = 0;

                this._renderState.perspectiveDirty = true;
                break;

            case 'CHANGE_VIEW_TRANSFORM':
                this._renderState.viewTransform[0] = commands[++localIterator];
                this._renderState.viewTransform[1] = commands[++localIterator];
                this._renderState.viewTransform[2] = commands[++localIterator];
                this._renderState.viewTransform[3] = commands[++localIterator];

                this._renderState.viewTransform[4] = commands[++localIterator];
                this._renderState.viewTransform[5] = commands[++localIterator];
                this._renderState.viewTransform[6] = commands[++localIterator];
                this._renderState.viewTransform[7] = commands[++localIterator];

                this._renderState.viewTransform[8] = commands[++localIterator];
                this._renderState.viewTransform[9] = commands[++localIterator];
                this._renderState.viewTransform[10] = commands[++localIterator];
                this._renderState.viewTransform[11] = commands[++localIterator];

                this._renderState.viewTransform[12] = commands[++localIterator];
                this._renderState.viewTransform[13] = commands[++localIterator];
                this._renderState.viewTransform[14] = commands[++localIterator];
                this._renderState.viewTransform[15] = commands[++localIterator];

                this._renderState.viewDirty = true;
                break;

            case 'WITH': return localIterator - 1;
        }

        command = commands[++localIterator];
    }

    return localIterator;
};

module.exports = Context;

},{"../components/Camera":1,"../dom-renderers/DOMRenderer":12,"../webgl-renderers/WebGLRenderer":49}],34:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * The UIManager is being updated by an Engine by consecutively calling its
 * `update` method. It can either manage a real Web-Worker or the global
 * FamousEngine core singleton.
 *
 * @example
 * var compositor = new Compositor();
 * var engine = new Engine();
 *
 * // Using a Web Worker
 * var worker = new Worker('worker.bundle.js');
 * var threadmanger = new UIManager(worker, compositor, engine);
 *
 * // Without using a Web Worker
 * var threadmanger = new UIManager(Famous, compositor, engine);
 *
 * @class  UIManager
 * @constructor
 *
 * @param {Famous|Worker} thread The thread being used to receive messages
 * from and post messages to. Expected to expose a WebWorker-like API, which
 * means providing a way to listen for updates by setting its `onmessage`
 * property and sending updates using `postMessage`.
 * @param {Compositor} compositor an instance of Compositor used to extract
 * enqueued draw commands from to be sent to the thread.
 * @param {RenderLoop} renderLoop an instance of Engine used for executing
 * the `ENGINE` commands on.
 */
function UIManager (thread, compositor, renderLoop) {
    this._thread = thread;
    this._compositor = compositor;
    this._renderLoop = renderLoop;

    this._renderLoop.update(this);

    var _this = this;
    this._thread.onmessage = function (ev) {
        var message = ev.data ? ev.data : ev;
        if (message[0] === 'ENGINE') {
            switch (message[1]) {
                case 'START':
                    _this._renderLoop.start();
                    break;
                case 'STOP':
                    _this._renderLoop.stop();
                    break;
                default:
                    console.error(
                        'Unknown ENGINE command "' + message[1] + '"'
                    );
                    break;
            }
        }
        else {
            _this._compositor.receiveCommands(message);
        }
    };
    this._thread.onerror = function (error) {
        console.error(error);
    };
}

/**
 * Returns the thread being used by the UIManager.
 * This could either be an an actual web worker or a `FamousEngine` singleton.
 *
 * @method
 *
 * @return {Worker|FamousEngine} Either a web worker or a `FamousEngine` singleton.
 */
UIManager.prototype.getThread = function getThread() {
    return this._thread;
};

/**
 * Returns the compositor being used by this UIManager.
 *
 * @method
 *
 * @return {Compositor} The compositor used by the UIManager.
 */
UIManager.prototype.getCompositor = function getCompositor() {
    return this._compositor;
};

/**
 * Returns the engine being used by this UIManager.
 *
 * @method
 *
 * @return {Engine} The engine used by the UIManager.
 */
UIManager.prototype.getEngine = function getEngine() {
    return this._renderLoop;
};

/**
 * Update method being invoked by the Engine on every `requestAnimationFrame`.
 * Used for updating the notion of time within the managed thread by sending
 * a FRAME command and sending messages to
 *
 * @method
 *
 * @param  {Number} time unix timestamp to be passed down to the worker as a
 * FRAME command
 * @return {undefined} undefined
 */
UIManager.prototype.update = function update (time) {
    this._thread.postMessage(['FRAME', time]);
    var threadMessages = this._compositor.drawCommands();
    this._thread.postMessage(threadMessages);
    this._compositor.clearCommands();
};

module.exports = UIManager;

},{}],35:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var css = '.famous-dom-renderer {' +
    'width:100%;' +
    'height:100%;' +
    'transform-style:preserve-3d;' +
    '-webkit-transform-style:preserve-3d;' +
'}' +

'.famous-dom-element {' +
    '-webkit-transform-origin:0% 0%;' +
    'transform-origin:0% 0%;' +
    '-webkit-backface-visibility:visible;' +
    'backface-visibility:visible;' +
    '-webkit-transform-style:preserve-3d;' +
    'transform-style:preserve-3d;' +
    '-webkit-tap-highlight-color:transparent;' +
    'pointer-events:auto;' +
    'z-index:1;' +
'}' +

'.famous-dom-element-content,' +
'.famous-dom-element {' +
    'position:absolute;' +
    'box-sizing:border-box;' +
    '-moz-box-sizing:border-box;' +
    '-webkit-box-sizing:border-box;' +
'}' +

'.famous-webgl-renderer {' +
    '-webkit-transform:translateZ(1000000px);' +  /* TODO: Fix when Safari Fixes*/
    'transform:translateZ(1000000px);' +
    'pointer-events:none;' +
    'position:absolute;' +
    'z-index:1;' +
    'top:0;' +
    'width:100%;' +
    'height:100%;' +
'}';

var INJECTED = typeof document === 'undefined';

function injectCSS() {
    if (INJECTED) return;
    INJECTED = true;
    if (document.createStyleSheet) {
        var sheet = document.createStyleSheet();
        sheet.cssText = css;
    }
    else {
        var head = document.getElementsByTagName('head')[0];
        var style = document.createElement('style');

        if (style.styleSheet) {
            style.styleSheet.cssText = css;
        }
        else {
            style.appendChild(document.createTextNode(css));
        }

        (head ? head : document.documentElement).appendChild(style);
    }
}

module.exports = injectCSS;

},{}],36:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * A lightweight, featureless EventEmitter.
 *
 * @class CallbackStore
 * @constructor
 */
function CallbackStore () {
    this._events = {};
}

/**
 * Adds a listener for the specified event (= key).
 *
 * @method on
 * @chainable
 *
 * @param  {String}   key       The event type (e.g. `click`).
 * @param  {Function} callback  A callback function to be invoked whenever `key`
 *                              event is being triggered.
 * @return {Function} destroy   A function to call if you want to remove the
 *                              callback.
 */
CallbackStore.prototype.on = function on (key, callback) {
    if (!this._events[key]) this._events[key] = [];
    var callbackList = this._events[key];
    callbackList.push(callback);
    return function () {
        callbackList.splice(callbackList.indexOf(callback), 1);
    };
};

/**
 * Removes a previously added event listener.
 *
 * @method off
 * @chainable
 *
 * @param  {String} key         The event type from which the callback function
 *                              should be removed.
 * @param  {Function} callback  The callback function to be removed from the
 *                              listeners for key.
 * @return {CallbackStore} this
 */
CallbackStore.prototype.off = function off (key, callback) {
    var events = this._events[key];
    if (events) events.splice(events.indexOf(callback), 1);
    return this;
};

/**
 * Invokes all the previously for this key registered callbacks.
 *
 * @method trigger
 * @chainable
 *
 * @param  {String}        key      The event type.
 * @param  {Object}        payload  The event payload (event object).
 * @return {CallbackStore} this
 */
CallbackStore.prototype.trigger = function trigger (key, payload) {
    var events = this._events[key];
    if (events) {
        var i = 0;
        var len = events.length;
        for (; i < len ; i++) events[i](payload);
    }
    return this;
};

module.exports = CallbackStore;

},{}],37:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * Deep clone an object.
 *
 * @method  clone
 *
 * @param {Object} b       Object to be cloned.
 * @return {Object} a      Cloned object (deep equality).
 */
var clone = function clone(b) {
    var a;
    if (typeof b === 'object') {
        a = (b instanceof Array) ? [] : {};
        for (var key in b) {
            if (typeof b[key] === 'object' && b[key] !== null) {
                if (b[key] instanceof Array) {
                    a[key] = new Array(b[key].length);
                    for (var i = 0; i < b[key].length; i++) {
                        a[key][i] = clone(b[key][i]);
                    }
                }
                else {
                  a[key] = clone(b[key]);
                }
            }
            else {
                a[key] = b[key];
            }
        }
    }
    else {
        a = b;
    }
    return a;
};

module.exports = clone;

},{}],38:[function(require,module,exports){
'use strict';

/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/**
 * Takes an object containing keys and values and returns an object
 * comprising two "associate" arrays, one with the keys and the other
 * with the values.
 *
 * @method keyValuesToArrays
 *
 * @param {Object} obj                      Objects where to extract keys and values
 *                                          from.
 * @return {Object}         result
 *         {Array.<String>} result.keys     Keys of `result`, as returned by
 *                                          `Object.keys()`
 *         {Array}          result.values   Values of passed in object.
 */
module.exports = function keyValuesToArrays(obj) {
    var keysArray = [], valuesArray = [];
    var i = 0;
    for(var key in obj) {
        if (obj.hasOwnProperty(key)) {
            keysArray[i] = key;
            valuesArray[i] = obj[key];
            i++;
        }
    }
    return {
        keys: keysArray,
        values: valuesArray
    };
};

},{}],39:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var PREFIXES = ['', '-ms-', '-webkit-', '-moz-', '-o-'];

/**
 * A helper function used for determining the vendor prefixed version of the
 * passed in CSS property.
 *
 * Vendor checks are being conducted in the following order:
 *
 * 1. (no prefix)
 * 2. `-mz-`
 * 3. `-webkit-`
 * 4. `-moz-`
 * 5. `-o-`
 *
 * @method vendorPrefix
 *
 * @param {String} property     CSS property (no camelCase), e.g.
 *                              `border-radius`.
 * @return {String} prefixed    Vendor prefixed version of passed in CSS
 *                              property (e.g. `-webkit-border-radius`).
 */
function vendorPrefix(property) {
    for (var i = 0; i < PREFIXES.length; i++) {
        var prefixed = PREFIXES[i] + property;
        if (document.documentElement.style[prefixed] === '') {
            return prefixed;
        }
    }
    return property;
}

module.exports = vendorPrefix;

},{}],40:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var GeometryIds = 0;

/**
 * Geometry is a component that defines and manages data
 * (vertex data and attributes) that is used to draw to WebGL.
 *
 * @class Geometry
 * @constructor
 *
 * @param {Object} options instantiation options
 * @return {undefined} undefined
 */
function Geometry(options) {
    this.options = options || {};
    this.DEFAULT_BUFFER_SIZE = 3;

    this.spec = {
        id: GeometryIds++,
        dynamic: false,
        type: this.options.type || 'TRIANGLES',
        bufferNames: [],
        bufferValues: [],
        bufferSpacings: [],
        invalidations: []
    };

    if (this.options.buffers) {
        var len = this.options.buffers.length;
        for (var i = 0; i < len;) {
            this.spec.bufferNames.push(this.options.buffers[i].name);
            this.spec.bufferValues.push(this.options.buffers[i].data);
            this.spec.bufferSpacings.push(this.options.buffers[i].size || this.DEFAULT_BUFFER_SIZE);
            this.spec.invalidations.push(i++);
        }
    }
}

module.exports = Geometry;

},{}],41:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var Vec3 = require('../math/Vec3');
var Vec2 = require('../math/Vec2');

var outputs = [
    new Vec3(),
    new Vec3(),
    new Vec3(),
    new Vec2(),
    new Vec2()
];

/**
 * A helper object used to calculate buffers for complicated geometries.
 * Tailored for the WebGLRenderer, used by most primitives.
 *
 * @static
 * @class GeometryHelper
 * @return {undefined} undefined
 */
var GeometryHelper = {};

/**
 * A function that iterates through vertical and horizontal slices
 * based on input detail, and generates vertices and indices for each
 * subdivision.
 *
 * @static
 * @method
 *
 * @param  {Number} detailX Amount of slices to iterate through.
 * @param  {Number} detailY Amount of stacks to iterate through.
 * @param  {Function} func Function used to generate vertex positions at each point.
 * @param  {Boolean} wrap Optional parameter (default: Pi) for setting a custom wrap range
 *
 * @return {Object} Object containing generated vertices and indices.
 */
GeometryHelper.generateParametric = function generateParametric(detailX, detailY, func, wrap) {
    var vertices = [];
    var i;
    var theta;
    var phi;
    var j;

    // We can wrap around slightly more than once for uv coordinates to look correct.

    var Xrange = wrap ? Math.PI + (Math.PI / (detailX - 1)) : Math.PI;
    var out = [];

    for (i = 0; i < detailX + 1; i++) {
        theta = i * Xrange / detailX;
        for (j = 0; j < detailY; j++) {
            phi = j * 2.0 * Xrange / detailY;
            func(theta, phi, out);
            vertices.push(out[0], out[1], out[2]);
        }
    }

    var indices = [],
        v = 0,
        next;
    for (i = 0; i < detailX; i++) {
        for (j = 0; j < detailY; j++) {
            next = (j + 1) % detailY;
            indices.push(v + j, v + j + detailY, v + next);
            indices.push(v + next, v + j + detailY, v + next + detailY);
        }
        v += detailY;
    }

    return {
        vertices: vertices,
        indices: indices
    };
};

/**
 * Calculates normals belonging to each face of a geometry.
 * Assumes clockwise declaration of vertices.
 *
 * @static
 * @method
 *
 * @param {Array} vertices Vertices of all points on the geometry.
 * @param {Array} indices Indices declaring faces of geometry.
 * @param {Array} out Array to be filled and returned.
 *
 * @return {Array} Calculated face normals.
 */
GeometryHelper.computeNormals = function computeNormals(vertices, indices, out) {
    var normals = out || [];
    var indexOne;
    var indexTwo;
    var indexThree;
    var normal;
    var j;
    var len = indices.length / 3;
    var i;
    var x;
    var y;
    var z;
    var length;

    for (i = 0; i < len; i++) {
        indexTwo = indices[i*3 + 0] * 3;
        indexOne = indices[i*3 + 1] * 3;
        indexThree = indices[i*3 + 2] * 3;

        outputs[0].set(vertices[indexOne], vertices[indexOne + 1], vertices[indexOne + 2]);
        outputs[1].set(vertices[indexTwo], vertices[indexTwo + 1], vertices[indexTwo + 2]);
        outputs[2].set(vertices[indexThree], vertices[indexThree + 1], vertices[indexThree + 2]);

        normal = outputs[2].subtract(outputs[0]).cross(outputs[1].subtract(outputs[0])).normalize();

        normals[indexOne + 0] = (normals[indexOne + 0] || 0) + normal.x;
        normals[indexOne + 1] = (normals[indexOne + 1] || 0) + normal.y;
        normals[indexOne + 2] = (normals[indexOne + 2] || 0) + normal.z;

        normals[indexTwo + 0] = (normals[indexTwo + 0] || 0) + normal.x;
        normals[indexTwo + 1] = (normals[indexTwo + 1] || 0) + normal.y;
        normals[indexTwo + 2] = (normals[indexTwo + 2] || 0) + normal.z;

        normals[indexThree + 0] = (normals[indexThree + 0] || 0) + normal.x;
        normals[indexThree + 1] = (normals[indexThree + 1] || 0) + normal.y;
        normals[indexThree + 2] = (normals[indexThree + 2] || 0) + normal.z;
    }

    for (i = 0; i < normals.length; i += 3) {
        x = normals[i];
        y = normals[i+1];
        z = normals[i+2];
        length = Math.sqrt(x * x + y * y + z * z);
        for(j = 0; j< 3; j++) {
            normals[i+j] /= length;
        }
    }

    return normals;
};

/**
 * Divides all inserted triangles into four sub-triangles. Alters the
 * passed in arrays.
 *
 * @static
 * @method
 *
 * @param {Array} indices Indices declaring faces of geometry
 * @param {Array} vertices Vertices of all points on the geometry
 * @param {Array} textureCoords Texture coordinates of all points on the geometry
 * @return {undefined} undefined
 */
GeometryHelper.subdivide = function subdivide(indices, vertices, textureCoords) {
    var triangleIndex = indices.length / 3;
    var face;
    var i;
    var j;
    var k;
    var pos;
    var tex;

    while (triangleIndex--) {
        face = indices.slice(triangleIndex * 3, triangleIndex * 3 + 3);

        pos = face.map(function(vertIndex) {
            return new Vec3(vertices[vertIndex * 3], vertices[vertIndex * 3 + 1], vertices[vertIndex * 3 + 2]);
        });
        vertices.push.apply(vertices, Vec3.scale(Vec3.add(pos[0], pos[1], outputs[0]), 0.5, outputs[1]).toArray());
        vertices.push.apply(vertices, Vec3.scale(Vec3.add(pos[1], pos[2], outputs[0]), 0.5, outputs[1]).toArray());
        vertices.push.apply(vertices, Vec3.scale(Vec3.add(pos[0], pos[2], outputs[0]), 0.5, outputs[1]).toArray());

        if (textureCoords) {
            tex = face.map(function(vertIndex) {
                return new Vec2(textureCoords[vertIndex * 2], textureCoords[vertIndex * 2 + 1]);
            });
            textureCoords.push.apply(textureCoords, Vec2.scale(Vec2.add(tex[0], tex[1], outputs[3]), 0.5, outputs[4]).toArray());
            textureCoords.push.apply(textureCoords, Vec2.scale(Vec2.add(tex[1], tex[2], outputs[3]), 0.5, outputs[4]).toArray());
            textureCoords.push.apply(textureCoords, Vec2.scale(Vec2.add(tex[0], tex[2], outputs[3]), 0.5, outputs[4]).toArray());
        }

        i = vertices.length - 3;
        j = i + 1;
        k = i + 2;

        indices.push(i, j, k);
        indices.push(face[0], i, k);
        indices.push(i, face[1], j);
        indices[triangleIndex] = k;
        indices[triangleIndex + 1] = j;
        indices[triangleIndex + 2] = face[2];
    }
};

/**
 * Creates duplicate of vertices that are shared between faces.
 * Alters the input vertex and index arrays.
 *
 * @static
 * @method
 *
 * @param {Array} vertices Vertices of all points on the geometry
 * @param {Array} indices Indices declaring faces of geometry
 * @return {undefined} undefined
 */
GeometryHelper.getUniqueFaces = function getUniqueFaces(vertices, indices) {
    var triangleIndex = indices.length / 3,
        registered = [],
        index;

    while (triangleIndex--) {
        for (var i = 0; i < 3; i++) {

            index = indices[triangleIndex * 3 + i];

            if (registered[index]) {
                vertices.push(vertices[index * 3], vertices[index * 3 + 1], vertices[index * 3 + 2]);
                indices[triangleIndex * 3 + i] = vertices.length / 3 - 1;
            }
            else {
                registered[index] = true;
            }
        }
    }
};

/**
 * Divides all inserted triangles into four sub-triangles while maintaining
 * a radius of one. Alters the passed in arrays.
 *
 * @static
 * @method
 *
 * @param {Array} vertices Vertices of all points on the geometry
 * @param {Array} indices Indices declaring faces of geometry
 * @return {undefined} undefined
 */
GeometryHelper.subdivideSpheroid = function subdivideSpheroid(vertices, indices) {
    var triangleIndex = indices.length / 3,
        abc,
        face,
        i, j, k;

    while (triangleIndex--) {
        face = indices.slice(triangleIndex * 3, triangleIndex * 3 + 3);
        abc = face.map(function(vertIndex) {
            return new Vec3(vertices[vertIndex * 3], vertices[vertIndex * 3 + 1], vertices[vertIndex * 3 + 2]);
        });

        vertices.push.apply(vertices, Vec3.normalize(Vec3.add(abc[0], abc[1], outputs[0]), outputs[1]).toArray());
        vertices.push.apply(vertices, Vec3.normalize(Vec3.add(abc[1], abc[2], outputs[0]), outputs[1]).toArray());
        vertices.push.apply(vertices, Vec3.normalize(Vec3.add(abc[0], abc[2], outputs[0]), outputs[1]).toArray());

        i = vertices.length / 3 - 3;
        j = i + 1;
        k = i + 2;

        indices.push(i, j, k);
        indices.push(face[0], i, k);
        indices.push(i, face[1], j);
        indices[triangleIndex * 3] = k;
        indices[triangleIndex * 3 + 1] = j;
        indices[triangleIndex * 3 + 2] = face[2];
    }
};

/**
 * Divides all inserted triangles into four sub-triangles while maintaining
 * a radius of one. Alters the passed in arrays.
 *
 * @static
 * @method
 *
 * @param {Array} vertices Vertices of all points on the geometry
 * @param {Array} out Optional array to be filled with resulting normals.
 *
 * @return {Array} New list of calculated normals.
 */
GeometryHelper.getSpheroidNormals = function getSpheroidNormals(vertices, out) {
    out = out || [];
    var length = vertices.length / 3;
    var normalized;

    for (var i = 0; i < length; i++) {
        normalized = new Vec3(
            vertices[i * 3 + 0],
            vertices[i * 3 + 1],
            vertices[i * 3 + 2]
        ).normalize().toArray();

        out[i * 3 + 0] = normalized[0];
        out[i * 3 + 1] = normalized[1];
        out[i * 3 + 2] = normalized[2];
    }

    return out;
};

/**
 * Calculates texture coordinates for spheroid primitives based on
 * input vertices.
 *
 * @static
 * @method
 *
 * @param {Array} vertices Vertices of all points on the geometry
 * @param {Array} out Optional array to be filled with resulting texture coordinates.
 *
 * @return {Array} New list of calculated texture coordinates
 */
GeometryHelper.getSpheroidUV = function getSpheroidUV(vertices, out) {
    out = out || [];
    var length = vertices.length / 3;
    var vertex;

    var uv = [];

    for(var i = 0; i < length; i++) {
        vertex = outputs[0].set(
            vertices[i * 3],
            vertices[i * 3 + 1],
            vertices[i * 3 + 2]
        )
        .normalize()
        .toArray();

        uv[0] = this.getAzimuth(vertex) * 0.5 / Math.PI + 0.5;
        uv[1] = this.getAltitude(vertex) / Math.PI + 0.5;

        out.push.apply(out, uv);
    }

    return out;
};

/**
 * Iterates through and normalizes a list of vertices.
 *
 * @static
 * @method
 *
 * @param {Array} vertices Vertices of all points on the geometry
 * @param {Array} out Optional array to be filled with resulting normalized vectors.
 *
 * @return {Array} New list of normalized vertices
 */
GeometryHelper.normalizeAll = function normalizeAll(vertices, out) {
    out = out || [];
    var len = vertices.length / 3;

    for (var i = 0; i < len; i++) {
        Array.prototype.push.apply(out, new Vec3(vertices[i * 3], vertices[i * 3 + 1], vertices[i * 3 + 2]).normalize().toArray());
    }

    return out;
};

/**
 * Normalizes a set of vertices to model space.
 *
 * @static
 * @method
 *
 * @param {Array} vertices Vertices of all points on the geometry
 * @param {Array} out Optional array to be filled with model space position vectors.
 *
 * @return {Array} Output vertices.
 */
GeometryHelper.normalizeVertices = function normalizeVertices(vertices, out) {
    out = out || [];
    var len = vertices.length / 3;
    var vectors = [];
    var minX;
    var maxX;
    var minY;
    var maxY;
    var minZ;
    var maxZ;
    var v;
    var i;

    for (i = 0; i < len; i++) {
        v = vectors[i] = new Vec3(
            vertices[i * 3],
            vertices[i * 3 + 1],
            vertices[i * 3 + 2]
        );

        if (minX == null || v.x < minX) minX = v.x;
        if (maxX == null || v.x > maxX) maxX = v.x;

        if (minY == null || v.y < minY) minY = v.y;
        if (maxY == null || v.y > maxY) maxY = v.y;

        if (minZ == null || v.z < minZ) minZ = v.z;
        if (maxZ == null || v.z > maxZ) maxZ = v.z;
    }

    var translation = new Vec3(
        getTranslationFactor(maxX, minX),
        getTranslationFactor(maxY, minY),
        getTranslationFactor(maxZ, minZ)
    );

    var scale = Math.min(
        getScaleFactor(maxX + translation.x, minX + translation.x),
        getScaleFactor(maxY + translation.y, minY + translation.y),
        getScaleFactor(maxZ + translation.z, minZ + translation.z)
    );

    for (i = 0; i < vectors.length; i++) {
        out.push.apply(out, vectors[i].add(translation).scale(scale).toArray());
    }

    return out;
};

/**
 * Determines translation amount for a given axis to normalize model coordinates.
 *
 * @method
 * @private
 *
 * @param {Number} max Maximum position value of given axis on the model.
 * @param {Number} min Minimum position value of given axis on the model.
 *
 * @return {Number} Number by which the given axis should be translated for all vertices.
 */
function getTranslationFactor(max, min) {
    return -(min + (max - min) / 2);
}

/**
 * Determines scale amount for a given axis to normalize model coordinates.
 *
 * @method
 * @private
 *
 * @param {Number} max Maximum scale value of given axis on the model.
 * @param {Number} min Minimum scale value of given axis on the model.
 *
 * @return {Number} Number by which the given axis should be scaled for all vertices.
 */
function getScaleFactor(max, min) {
    return 1 / ((max - min) / 2);
}

/**
 * Finds the azimuth, or angle above the XY plane, of a given vector.
 *
 * @static
 * @method
 *
 * @param {Array} v Vertex to retreive azimuth from.
 *
 * @return {Number} Azimuth value in radians.
 */
GeometryHelper.getAzimuth = function azimuth(v) {
    return Math.atan2(v[2], -v[0]);
};

/**
 * Finds the altitude, or angle above the XZ plane, of a given vector.
 *
 * @static
 * @method
 *
 * @param {Array} v Vertex to retreive altitude from.
 *
 * @return {Number} Altitude value in radians.
 */
GeometryHelper.getAltitude = function altitude(v) {
    return Math.atan2(-v[1], Math.sqrt((v[0] * v[0]) + (v[2] * v[2])));
};

/**
 * Converts a list of indices from 'triangle' to 'line' format.
 *
 * @static
 * @method
 *
 * @param {Array} indices Indices of all faces on the geometry
 * @param {Array} out Indices of all faces on the geometry
 *
 * @return {Array} New list of line-formatted indices
 */
GeometryHelper.trianglesToLines = function triangleToLines(indices, out) {
    var numVectors = indices.length / 3;
    out = out || [];
    var i;

    for (i = 0; i < numVectors; i++) {
        out.push(indices[i * 3 + 0], indices[i * 3 + 1]);
        out.push(indices[i * 3 + 1], indices[i * 3 + 2]);
        out.push(indices[i * 3 + 2], indices[i * 3 + 0]);
    }

    return out;
};

/**
 * Adds a reverse order triangle for every triangle in the mesh. Adds extra vertices
 * and indices to input arrays.
 *
 * @static
 * @method
 *
 * @param {Array} vertices X, Y, Z positions of all vertices in the geometry
 * @param {Array} indices Indices of all faces on the geometry
 * @return {undefined} undefined
 */
GeometryHelper.addBackfaceTriangles = function addBackfaceTriangles(vertices, indices) {
    var nFaces = indices.length / 3;

    var maxIndex = 0;
    var i = indices.length;
    while (i--) if (indices[i] > maxIndex) maxIndex = indices[i];

    maxIndex++;

    for (i = 0; i < nFaces; i++) {
        var indexOne = indices[i * 3],
            indexTwo = indices[i * 3 + 1],
            indexThree = indices[i * 3 + 2];

        indices.push(indexOne + maxIndex, indexThree + maxIndex, indexTwo + maxIndex);
    }

    // Iterating instead of .slice() here to avoid max call stack issue.

    var nVerts = vertices.length;
    for (i = 0; i < nVerts; i++) {
        vertices.push(vertices[i]);
    }
};

module.exports = GeometryHelper;

},{"../math/Vec2":25,"../math/Vec3":26}],42:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var Geometry = require('../Geometry');
var GeometryHelper = require('../GeometryHelper');

/**
 * This function returns a new static geometry, which is passed
 * custom buffer data.
 *
 * @class Plane
 * @constructor
 *
 * @param {Object} options Parameters that alter the
 * vertex buffers of the generated geometry.
 *
 * @return {Object} constructed geometry
 */
function Plane(options) {
    options = options || {};
    var detailX = options.detailX || options.detail || 1;
    var detailY = options.detailY || options.detail || 1;

    var vertices      = [];
    var textureCoords = [];
    var normals       = [];
    var indices       = [];

    var i;

    for (var y = 0; y <= detailY; y++) {
        var t = y / detailY;
        for (var x = 0; x <= detailX; x++) {
            var s = x / detailX;
            vertices.push(2. * (s - .5), 2 * (t - .5), 0);
            textureCoords.push(s, 1 - t);
            if (x < detailX && y < detailY) {
                i = x + y * (detailX + 1);
                indices.push(i, i + 1, i + detailX + 1);
                indices.push(i + detailX + 1, i + 1, i + detailX + 2);
            }
        }
    }

    if (options.backface !== false) {
        GeometryHelper.addBackfaceTriangles(vertices, indices);

        // duplicate texture coordinates as well

        var len = textureCoords.length;
        for (i = 0; i < len; i++) textureCoords.push(textureCoords[i]);
    }

    normals = GeometryHelper.computeNormals(vertices, indices);

    return new Geometry({
        buffers: [
            { name: 'a_pos', data: vertices },
            { name: 'a_texCoord', data: textureCoords, size: 2 },
            { name: 'a_normals', data: normals },
            { name: 'indices', data: indices, size: 1 }
        ]
    });
}

module.exports = Plane;

},{"../Geometry":40,"../GeometryHelper":41}],43:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * Buffer is a private class that wraps the vertex data that defines
 * the the points of the triangles that webgl draws. Each buffer
 * maps to one attribute of a mesh.
 *
 * @class Buffer
 * @constructor
 *
 * @param {Number} target The bind target of the buffer to update: ARRAY_BUFFER or ELEMENT_ARRAY_BUFFER
 * @param {Object} type Array type to be used in calls to gl.bufferData.
 * @param {WebGLContext} gl The WebGL context that the buffer is hosted by.
 *
 * @return {undefined} undefined
 */
function Buffer(target, type, gl) {
    this.buffer = null;
    this.target = target;
    this.type = type;
    this.data = [];
    this.gl = gl;
}

/**
 * Creates a WebGL buffer if one does not yet exist and binds the buffer to
 * to the context. Runs bufferData with appropriate data.
 *
 * @method
 *
 * @return {undefined} undefined
 */
Buffer.prototype.subData = function subData() {
    var gl = this.gl;
    var data = [];

    // to prevent against maximum call-stack issue.
    for (var i = 0, chunk = 10000; i < this.data.length; i += chunk)
        data = Array.prototype.concat.apply(data, this.data.slice(i, i + chunk));

    this.buffer = this.buffer || gl.createBuffer();
    gl.bindBuffer(this.target, this.buffer);
    gl.bufferData(this.target, new this.type(data), gl.STATIC_DRAW);
};

module.exports = Buffer;

},{}],44:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var INDICES = 'indices';

var Buffer = require('./Buffer');

/**
 * BufferRegistry is a class that manages allocation of buffers to
 * input geometries.
 *
 * @class BufferRegistry
 * @constructor
 *
 * @param {WebGLContext} context WebGL drawing context to be passed to buffers.
 *
 * @return {undefined} undefined
 */
function BufferRegistry(context) {
    this.gl = context;

    this.registry = {};
    this._dynamicBuffers = [];
    this._staticBuffers = [];

    this._arrayBufferMax = 30000;
    this._elementBufferMax = 30000;
}

/**
 * Binds and fills all the vertex data into webgl buffers.  Will reuse buffers if
 * possible.  Populates registry with the name of the buffer, the WebGL buffer
 * object, spacing of the attribute, the attribute's offset within the buffer,
 * and finally the length of the buffer.  This information is later accessed by
 * the root to draw the buffers.
 *
 * @method
 *
 * @param {Number} geometryId Id of the geometry instance that holds the buffers.
 * @param {String} name Key of the input buffer in the geometry.
 * @param {Array} value Flat array containing input data for buffer.
 * @param {Number} spacing The spacing, or itemSize, of the input buffer.
 * @param {Boolean} dynamic Boolean denoting whether a geometry is dynamic or static.
 *
 * @return {undefined} undefined
 */
BufferRegistry.prototype.allocate = function allocate(geometryId, name, value, spacing, dynamic) {
    var vertexBuffers = this.registry[geometryId] || (this.registry[geometryId] = { keys: [], values: [], spacing: [], offset: [], length: [] });

    var j = vertexBuffers.keys.indexOf(name);
    var isIndex = name === INDICES;
    var bufferFound = false;
    var newOffset;
    var offset = 0;
    var length;
    var buffer;
    var k;

    if (j === -1) {
        j = vertexBuffers.keys.length;
        length = isIndex ? value.length : Math.floor(value.length / spacing);

        if (!dynamic) {

            // Use a previously created buffer if available.

            for (k = 0; k < this._staticBuffers.length; k++) {

                if (isIndex === this._staticBuffers[k].isIndex) {
                    newOffset = this._staticBuffers[k].offset + value.length;
                    if ((!isIndex && newOffset < this._arrayBufferMax) || (isIndex && newOffset < this._elementBufferMax)) {
                        buffer = this._staticBuffers[k].buffer;
                        offset = this._staticBuffers[k].offset;
                        this._staticBuffers[k].offset += value.length;
                        bufferFound = true;
                        break;
                    }
                }
            }

            // Create a new static buffer in none were found.

            if (!bufferFound) {
                buffer = new Buffer(
                    isIndex ? this.gl.ELEMENT_ARRAY_BUFFER : this.gl.ARRAY_BUFFER,
                    isIndex ? Uint16Array : Float32Array,
                    this.gl
                );

                this._staticBuffers.push({ buffer: buffer, offset: value.length, isIndex: isIndex });
            }
        }
        else {

            // For dynamic geometries, always create new buffer.

            buffer = new Buffer(
                isIndex ? this.gl.ELEMENT_ARRAY_BUFFER : this.gl.ARRAY_BUFFER,
                isIndex ? Uint16Array : Float32Array,
                this.gl
            );

            this._dynamicBuffers.push({ buffer: buffer, offset: value.length, isIndex: isIndex });
        }

        // Update the registry for the spec with buffer information.

        vertexBuffers.keys.push(name);
        vertexBuffers.values.push(buffer);
        vertexBuffers.spacing.push(spacing);
        vertexBuffers.offset.push(offset);
        vertexBuffers.length.push(length);
    }

    var len = value.length;
    for (k = 0; k < len; k++) {
        vertexBuffers.values[j].data[offset + k] = value[k];
    }
    vertexBuffers.values[j].subData();
};

module.exports = BufferRegistry;

},{"./Buffer":43}],45:[function(require,module,exports){
'use strict';

/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/**
 * Takes the original rendering contexts' compiler function
 * and augments it with added functionality for parsing and
 * displaying errors.
 *
 * @method
 *
 * @returns {Function} Augmented function
 */
module.exports = function Debug() {
    return _augmentFunction(
        this.gl.compileShader,
        function(shader) {
            if (!this.getShaderParameter(shader, this.COMPILE_STATUS)) {
                var errors = this.getShaderInfoLog(shader);
                var source = this.getShaderSource(shader);
                _processErrors(errors, source);
            }
        }
    );
};

// Takes a function, keeps the reference and replaces it by a closure that
// executes the original function and the provided callback.
function _augmentFunction(func, callback) {
    return function() {
        var res = func.apply(this, arguments);
        callback.apply(this, arguments);
        return res;
    };
}

// Parses errors and failed source code from shaders in order
// to build displayable error blocks.
// Inspired by Jaume Sanchez Elias.
function _processErrors(errors, source) {

    var css = 'body,html{background:#e3e3e3;font-family:monaco,monospace;font-size:14px;line-height:1.7em}' +
              '#shaderReport{left:0;top:0;right:0;box-sizing:border-box;position:absolute;z-index:1000;color:' +
              '#222;padding:15px;white-space:normal;list-style-type:none;margin:50px auto;max-width:1200px}' +
              '#shaderReport li{background-color:#fff;margin:13px 0;box-shadow:0 1px 2px rgba(0,0,0,.15);' +
              'padding:20px 30px;border-radius:2px;border-left:20px solid #e01111}span{color:#e01111;' +
              'text-decoration:underline;font-weight:700}#shaderReport li p{padding:0;margin:0}' +
              '#shaderReport li:nth-child(even){background-color:#f4f4f4}' +
              '#shaderReport li p:first-child{margin-bottom:10px;color:#666}';

    var el = document.createElement('style');
    document.getElementsByTagName('head')[0].appendChild(el);
    el.textContent = css;

    var report = document.createElement('ul');
    report.setAttribute('id', 'shaderReport');
    document.body.appendChild(report);

    var re = /ERROR: [\d]+:([\d]+): (.+)/gmi;
    var lines = source.split('\n');

    var m;
    while ((m = re.exec(errors)) != null) {
        if (m.index === re.lastIndex) re.lastIndex++;
        var li = document.createElement('li');
        var code = '<p><span>ERROR</span> "' + m[2] + '" in line ' + m[1] + '</p>';
        code += '<p><b>' + lines[m[1] - 1].replace(/^[ \t]+/g, '') + '</b></p>';
        li.innerHTML = code;
        report.appendChild(li);
    }
}

},{}],46:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var clone = require('../utilities/clone');
var keyValueToArrays = require('../utilities/keyValueToArrays');

var vertexWrapper = require('../webgl-shaders').vertex;
var fragmentWrapper = require('../webgl-shaders').fragment;
var Debug = require('./Debug');

var VERTEX_SHADER = 35633;
var FRAGMENT_SHADER = 35632;
var identityMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

var header = 'precision mediump float;\n';

var TYPES = {
    undefined: 'float ',
    1: 'float ',
    2: 'vec2 ',
    3: 'vec3 ',
    4: 'vec4 ',
    16: 'mat4 '
};

var inputTypes = {
    u_baseColor: 'vec4',
    u_normals: 'vert',
    u_glossiness: 'vec4',
    u_positionOffset: 'vert'
};

var masks =  {
    vert: 1,
    vec3: 2,
    vec4: 4,
    float: 8
};

/**
 * Uniform keys and values
 */
var uniforms = keyValueToArrays({
    u_perspective: identityMatrix,
    u_view: identityMatrix,
    u_resolution: [0, 0, 0],
    u_transform: identityMatrix,
    u_size: [1, 1, 1],
    u_time: 0,
    u_opacity: 1,
    u_metalness: 0,
    u_glossiness: [0, 0, 0, 0],
    u_baseColor: [1, 1, 1, 1],
    u_normals: [1, 1, 1],
    u_positionOffset: [0, 0, 0],
    u_lightPosition: identityMatrix,
    u_lightColor: identityMatrix,
    u_ambientLight: [0, 0, 0],
    u_flatShading: 0,
    u_numLights: 0
});

/**
 * Attributes keys and values
 */
var attributes = keyValueToArrays({
    a_pos: [0, 0, 0],
    a_texCoord: [0, 0],
    a_normals: [0, 0, 0]
});

/**
 * Varyings keys and values
 */
var varyings = keyValueToArrays({
    v_textureCoordinate: [0, 0],
    v_normal: [0, 0, 0],
    v_position: [0, 0, 0],
    v_eyeVector: [0, 0, 0]
});

/**
 * A class that handles interactions with the WebGL shader program
 * used by a specific context.  It manages creation of the shader program
 * and the attached vertex and fragment shaders.  It is also in charge of
 * passing all uniforms to the WebGLContext.
 *
 * @class Program
 * @constructor
 *
 * @param {WebGL_Context} gl Context to be used to create the shader program
 * @param {Object} options Program options
 *
 * @return {undefined} undefined
 */
function Program(gl, options) {
    this.gl = gl;
    this.textureSlots = 1;
    this.options = options || {};

    this.registeredMaterials = {};
    this.flaggedUniforms = [];
    this.cachedUniforms  = {};
    this.uniformTypes = [];

    this.definitionVec4 = [];
    this.definitionVec3 = [];
    this.definitionFloat = [];
    this.applicationVec3 = [];
    this.applicationVec4 = [];
    this.applicationFloat = [];
    this.applicationVert = [];
    this.definitionVert = [];

    this.resetProgram();
}

/**
 * Determines whether a material has already been registered to
 * the shader program.
 *
 * @method
 *
 * @param {String} name Name of target input of material.
 * @param {Object} material Compiled material object being verified.
 *
 * @return {Program} this Current program.
 */
Program.prototype.registerMaterial = function registerMaterial(name, material) {
    var compiled = material;
    var type = inputTypes[name];
    var mask = masks[type];

    if ((this.registeredMaterials[material._id] & mask) === mask) return this;

    var k;

    for (k in compiled.uniforms) {
        if (uniforms.keys.indexOf(k) === -1) {
            uniforms.keys.push(k);
            uniforms.values.push(compiled.uniforms[k]);
        }
    }

    for (k in compiled.varyings) {
        if (varyings.keys.indexOf(k) === -1) {
            varyings.keys.push(k);
            varyings.values.push(compiled.varyings[k]);
        }
    }

    for (k in compiled.attributes) {
        if (attributes.keys.indexOf(k) === -1) {
            attributes.keys.push(k);
            attributes.values.push(compiled.attributes[k]);
        }
    }

    this.registeredMaterials[material._id] |= mask;

    if (type === 'float') {
        this.definitionFloat.push(material.defines);
        this.definitionFloat.push('float fa_' + material._id + '() {\n '  + compiled.glsl + ' \n}');
        this.applicationFloat.push('if (int(abs(ID)) == ' + material._id + ') return fa_' + material._id  + '();');
    }

    if (type === 'vec3') {
        this.definitionVec3.push(material.defines);
        this.definitionVec3.push('vec3 fa_' + material._id + '() {\n '  + compiled.glsl + ' \n}');
        this.applicationVec3.push('if (int(abs(ID.x)) == ' + material._id + ') return fa_' + material._id + '();');
    }

    if (type === 'vec4') {
        this.definitionVec4.push(material.defines);
        this.definitionVec4.push('vec4 fa_' + material._id + '() {\n '  + compiled.glsl + ' \n}');
        this.applicationVec4.push('if (int(abs(ID.x)) == ' + material._id + ') return fa_' + material._id + '();');
    }

    if (type === 'vert') {
        this.definitionVert.push(material.defines);
        this.definitionVert.push('vec3 fa_' + material._id + '() {\n '  + compiled.glsl + ' \n}');
        this.applicationVert.push('if (int(abs(ID.x)) == ' + material._id + ') return fa_' + material._id + '();');
    }

    return this.resetProgram();
};

/**
 * Clears all cached uniforms and attribute locations.  Assembles
 * new fragment and vertex shaders and based on material from
 * currently registered materials.  Attaches said shaders to new
 * shader program and upon success links program to the WebGL
 * context.
 *
 * @method
 *
 * @return {Program} Current program.
 */
Program.prototype.resetProgram = function resetProgram() {
    var vertexHeader = [header];
    var fragmentHeader = [header];

    var fragmentSource;
    var vertexSource;
    var program;
    var name;
    var value;
    var i;

    this.uniformLocations   = [];
    this.attributeLocations = {};

    this.uniformTypes = {};

    this.attributeNames = clone(attributes.keys);
    this.attributeValues = clone(attributes.values);

    this.varyingNames = clone(varyings.keys);
    this.varyingValues = clone(varyings.values);

    this.uniformNames = clone(uniforms.keys);
    this.uniformValues = clone(uniforms.values);

    this.flaggedUniforms = [];
    this.cachedUniforms = {};

    fragmentHeader.push('uniform sampler2D u_textures[7];\n');

    if (this.applicationVert.length) {
        vertexHeader.push('uniform sampler2D u_textures[7];\n');
    }

    for(i = 0; i < this.uniformNames.length; i++) {
        name = this.uniformNames[i];
        value = this.uniformValues[i];
        vertexHeader.push('uniform ' + TYPES[value.length] + name + ';\n');
        fragmentHeader.push('uniform ' + TYPES[value.length] + name + ';\n');
    }

    for(i = 0; i < this.attributeNames.length; i++) {
        name = this.attributeNames[i];
        value = this.attributeValues[i];
        vertexHeader.push('attribute ' + TYPES[value.length] + name + ';\n');
    }

    for(i = 0; i < this.varyingNames.length; i++) {
        name = this.varyingNames[i];
        value = this.varyingValues[i];
        vertexHeader.push('varying ' + TYPES[value.length]  + name + ';\n');
        fragmentHeader.push('varying ' + TYPES[value.length] + name + ';\n');
    }

    vertexSource = vertexHeader.join('') + vertexWrapper
        .replace('#vert_definitions', this.definitionVert.join('\n'))
        .replace('#vert_applications', this.applicationVert.join('\n'));

    fragmentSource = fragmentHeader.join('') + fragmentWrapper
        .replace('#vec3_definitions', this.definitionVec3.join('\n'))
        .replace('#vec3_applications', this.applicationVec3.join('\n'))
        .replace('#vec4_definitions', this.definitionVec4.join('\n'))
        .replace('#vec4_applications', this.applicationVec4.join('\n'))
        .replace('#float_definitions', this.definitionFloat.join('\n'))
        .replace('#float_applications', this.applicationFloat.join('\n'));

    program = this.gl.createProgram();

    this.gl.attachShader(
        program,
        this.compileShader(this.gl.createShader(VERTEX_SHADER), vertexSource)
    );

    this.gl.attachShader(
        program,
        this.compileShader(this.gl.createShader(FRAGMENT_SHADER), fragmentSource)
    );

    this.gl.linkProgram(program);

    if (! this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
        console.error('link error: ' + this.gl.getProgramInfoLog(program));
        this.program = null;
    }
    else {
        this.program = program;
        this.gl.useProgram(this.program);
    }

    this.setUniforms(this.uniformNames, this.uniformValues);

    var textureLocation = this.gl.getUniformLocation(this.program, 'u_textures[0]');
    this.gl.uniform1iv(textureLocation, [0, 1, 2, 3, 4, 5, 6]);

    return this;
};

/**
 * Compares the value of the input uniform value against
 * the cached value stored on the Program class.  Updates and
 * creates new entries in the cache when necessary.
 *
 * @method
 * @param {String} targetName Key of uniform spec being evaluated.
 * @param {Number|Array} value Value of uniform spec being evaluated.
 *
 * @return {Boolean} boolean Indicating whether the uniform being set is cached.
 */
Program.prototype.uniformIsCached = function(targetName, value) {
    if(this.cachedUniforms[targetName] == null) {
        if (value.length) {
            this.cachedUniforms[targetName] = new Float32Array(value);
        }
        else {
            this.cachedUniforms[targetName] = value;
        }
        return false;
    }
    else if (value.length) {
        var i = value.length;
        while (i--) {
            if(value[i] !== this.cachedUniforms[targetName][i]) {
                i = value.length;
                while(i--) this.cachedUniforms[targetName][i] = value[i];
                return false;
            }
        }
    }

    else if (this.cachedUniforms[targetName] !== value) {
        this.cachedUniforms[targetName] = value;
        return false;
    }

    return true;
};

/**
 * Handles all passing of uniforms to WebGL drawing context.  This
 * function will find the uniform location and then, based on
 * a type inferred from the javascript value of the uniform, it will call
 * the appropriate function to pass the uniform to WebGL.  Finally,
 * setUniforms will iterate through the passed in shaderChunks (if any)
 * and set the appropriate uniforms to specify which chunks to use.
 *
 * @method
 * @param {Array} uniformNames Array containing the keys of all uniforms to be set.
 * @param {Array} uniformValue Array containing the values of all uniforms to be set.
 *
 * @return {Program} Current program.
 */
Program.prototype.setUniforms = function (uniformNames, uniformValue) {
    var gl = this.gl;
    var location;
    var value;
    var name;
    var len;
    var i;

    if (!this.program) return this;

    len = uniformNames.length;
    for (i = 0; i < len; i++) {
        name = uniformNames[i];
        value = uniformValue[i];

        // Retreive the cached location of the uniform,
        // requesting a new location from the WebGL context
        // if it does not yet exist.

        location = this.uniformLocations[name];

        if (location === null) continue;
        if (location === undefined) {
            location = gl.getUniformLocation(this.program, name);
            this.uniformLocations[name] = location;
        }

        // Check if the value is already set for the
        // given uniform.

        if (this.uniformIsCached(name, value)) continue;

        // Determine the correct function and pass the uniform
        // value to WebGL.

        if (!this.uniformTypes[name]) {
            this.uniformTypes[name] = this.getUniformTypeFromValue(value);
        }

        // Call uniform setter function on WebGL context with correct value

        switch (this.uniformTypes[name]) {
            case 'uniform4fv':  gl.uniform4fv(location, value); break;
            case 'uniform3fv':  gl.uniform3fv(location, value); break;
            case 'uniform2fv':  gl.uniform2fv(location, value); break;
            case 'uniform1fv':  gl.uniform1fv(location, value); break;
            case 'uniform1f' :  gl.uniform1f(location, value); break;
            case 'uniformMatrix3fv': gl.uniformMatrix3fv(location, false, value); break;
            case 'uniformMatrix4fv': gl.uniformMatrix4fv(location, false, value); break;
        }
    }

    return this;
};

/**
 * Infers uniform setter function to be called on the WebGL context, based
 * on an input value.
 *
 * @method
 *
 * @param {Number|Array} value Value from which uniform type is inferred.
 *
 * @return {String} Name of uniform function for given value.
 */
Program.prototype.getUniformTypeFromValue = function getUniformTypeFromValue(value) {
    if (Array.isArray(value) || value instanceof Float32Array) {
        switch (value.length) {
            case 1:  return 'uniform1fv';
            case 2:  return 'uniform2fv';
            case 3:  return 'uniform3fv';
            case 4:  return 'uniform4fv';
            case 9:  return 'uniformMatrix3fv';
            case 16: return 'uniformMatrix4fv';
        }
    }
    else if (!isNaN(parseFloat(value)) && isFinite(value)) {
        return 'uniform1f';
    }

    throw 'cant load uniform "' + name + '" with value:' + JSON.stringify(value);
};

/**
 * Adds shader source to shader and compiles the input shader.  Checks
 * compile status and logs error if necessary.
 *
 * @method
 *
 * @param {Object} shader Program to be compiled.
 * @param {String} source Source to be used in the shader.
 *
 * @return {Object} Compiled shader.
 */
Program.prototype.compileShader = function compileShader(shader, source) {
    var i = 1;

    if (this.options.debug) {
        this.gl.compileShader = Debug.call(this);
    }

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
        console.error('compile error: ' + this.gl.getShaderInfoLog(shader));
        console.error('1: ' + source.replace(/\n/g, function () {
            return '\n' + (i+=1) + ': ';
        }));
    }

    return shader;
};

module.exports = Program;

},{"../utilities/clone":37,"../utilities/keyValueToArrays":38,"../webgl-shaders":53,"./Debug":45}],47:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

/**
 * Texture is a private class that stores image data
 * to be accessed from a shader or used as a render target.
 *
 * @class Texture
 * @constructor
 *
 * @param {GL} gl GL
 * @param {Object} options Options
 *
 * @return {undefined} undefined
 */
function Texture(gl, options) {
    options = options || {};
    this.id = gl.createTexture();
    this.width = options.width || 0;
    this.height = options.height || 0;
    this.mipmap = options.mipmap;
    this.format = options.format || 'RGBA';
    this.type = options.type || 'UNSIGNED_BYTE';
    this.gl = gl;

    this.bind();

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, options.flipYWebgl || false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, options.premultiplyAlphaWebgl || false);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl[options.magFilter] || gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl[options.minFilter] || gl.NEAREST);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl[options.wrapS] || gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl[options.wrapT] || gl.CLAMP_TO_EDGE);
}

/**
 * Binds this texture as the selected target.
 *
 * @method
 * @return {Object} Current texture instance.
 */
Texture.prototype.bind = function bind() {
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.id);
    return this;
};

/**
 * Erases the texture data in the given texture slot.
 *
 * @method
 * @return {Object} Current texture instance.
 */
Texture.prototype.unbind = function unbind() {
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    return this;
};

/**
 * Replaces the image data in the texture with the given image.
 *
 * @method
 *
 * @param {Image}   img     The image object to upload pixel data from.
 * @return {Object}         Current texture instance.
 */
Texture.prototype.setImage = function setImage(img) {
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl[this.format], this.gl[this.format], this.gl[this.type], img);
    if (this.mipmap) this.gl.generateMipmap(this.gl.TEXTURE_2D);
    return this;
};

/**
 * Replaces the image data in the texture with an array of arbitrary data.
 *
 * @method
 *
 * @param {Array}   input   Array to be set as data to texture.
 * @return {Object}         Current texture instance.
 */
Texture.prototype.setArray = function setArray(input) {
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl[this.format], this.width, this.height, 0, this.gl[this.format], this.gl[this.type], input);
    return this;
};

/**
 * Dumps the rgb-pixel contents of a texture into an array for debugging purposes
 *
 * @method
 *
 * @param {Number} x        x-offset between texture coordinates and snapshot
 * @param {Number} y        y-offset between texture coordinates and snapshot
 * @param {Number} width    x-depth of the snapshot
 * @param {Number} height   y-depth of the snapshot
 *
 * @return {Array}          An array of the pixels contained in the snapshot.
 */
Texture.prototype.readBack = function readBack(x, y, width, height) {
    var gl = this.gl;
    var pixels;
    x = x || 0;
    y = y || 0;
    width = width || this.width;
    height = height || this.height;
    var fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.id, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE) {
        pixels = new Uint8Array(width * height * 4);
        gl.readPixels(x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    }
    return pixels;
};

module.exports = Texture;

},{}],48:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
'use strict';

var Texture = require('./Texture');
var createCheckerboard = require('./createCheckerboard');

/**
 * Handles loading, binding, and resampling of textures for WebGLRenderer.
 *
 * @class TextureManager
 * @constructor
 *
 * @param {WebGL_Context} gl Context used to create and bind textures.
 *
 * @return {undefined} undefined
 */
function TextureManager(gl) {
    this.registry = [];
    this._needsResample = [];

    this._activeTexture = 0;
    this._boundTexture = null;

    this._checkerboard = createCheckerboard();

    this.gl = gl;
}

/**
 * Update function used by WebGLRenderer to queue resamples on
 * registered textures.
 *
 * @method
 *
 * @param {Number}      time    Time in milliseconds according to the compositor.
 * @return {undefined}          undefined
 */
TextureManager.prototype.update = function update(time) {
    var registryLength = this.registry.length;

    for (var i = 1; i < registryLength; i++) {
        var texture = this.registry[i];

        if (texture && texture.isLoaded && texture.resampleRate) {
            if (!texture.lastResample || time - texture.lastResample > texture.resampleRate) {
                if (!this._needsResample[texture.id]) {
                    this._needsResample[texture.id] = true;
                    texture.lastResample = time;
                }
            }
        }
    }
};

/**
 * Creates a spec and creates a texture based on given texture data.
 * Handles loading assets if necessary.
 *
 * @method
 *
 * @param {Object}  input   Object containing texture id, texture data
 *                          and options used to draw texture.
 * @param {Number}  slot    Texture slot to bind generated texture to.
 * @return {undefined}      undefined
 */
TextureManager.prototype.register = function register(input, slot) {
    var _this = this;

    var source = input.data;
    var textureId = input.id;
    var options = input.options || {};
    var texture = this.registry[textureId];
    var spec;

    if (!texture) {

        texture = new Texture(this.gl, options);
        texture.setImage(this._checkerboard);

        // Add texture to registry

        spec = this.registry[textureId] = {
            resampleRate: options.resampleRate || null,
            lastResample: null,
            isLoaded: false,
            texture: texture,
            source: source,
            id: textureId,
            slot: slot
        };

        // Handle array

        if (Array.isArray(source) || source instanceof Uint8Array || source instanceof Float32Array) {
            this.bindTexture(textureId);
            texture.setArray(source);
            spec.isLoaded = true;
        }

        // Handle video

        else if (window && source instanceof window.HTMLVideoElement) {
            source.addEventListener('loadeddata', function() {
                _this.bindTexture(textureId);
                texture.setImage(source);

                spec.isLoaded = true;
                spec.source = source;
            });
        }

        // Handle image url

        else if (typeof source === 'string') {
            loadImage(source, function (img) {
                _this.bindTexture(textureId);
                texture.setImage(img);

                spec.isLoaded = true;
                spec.source = img;
            });
        }
    }

    return textureId;
};

/**
 * Loads an image from a string or Image object and executes a callback function.
 *
 * @method
 * @private
 *
 * @param {Object|String} input The input image data to load as an asset.
 * @param {Function} callback The callback function to be fired when the image has finished loading.
 *
 * @return {Object} Image object being loaded.
 */
function loadImage (input, callback) {
    var image = (typeof input === 'string' ? new Image() : input) || {};
        image.crossOrigin = 'anonymous';

    if (!image.src) image.src = input;
    if (!image.complete) {
        image.onload = function () {
            callback(image);
        };
    }
    else {
        callback(image);
    }

    return image;
}

/**
 * Sets active texture slot and binds target texture.  Also handles
 * resampling when necessary.
 *
 * @method
 *
 * @param {Number} id Identifier used to retreive texture spec
 *
 * @return {undefined} undefined
 */
TextureManager.prototype.bindTexture = function bindTexture(id) {
    var spec = this.registry[id];

    if (this._activeTexture !== spec.slot) {
        this.gl.activeTexture(this.gl.TEXTURE0 + spec.slot);
        this._activeTexture = spec.slot;
    }

    if (this._boundTexture !== id) {
        this._boundTexture = id;
        spec.texture.bind();
    }

    if (this._needsResample[spec.id]) {

        // TODO: Account for resampling of arrays.

        spec.texture.setImage(spec.source);
        this._needsResample[spec.id] = false;
    }
};

module.exports = TextureManager;

},{"./Texture":47,"./createCheckerboard":51}],49:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

var Program = require('./Program');
var BufferRegistry = require('./BufferRegistry');
var Plane = require('../webgl-geometries/primitives/Plane');
var sorter = require('./radixSort');
var keyValueToArrays = require('../utilities/keyValueToArrays');
var TextureManager = require('./TextureManager');
var compileMaterial = require('./compileMaterial');

var identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

var globalUniforms = keyValueToArrays({
    'u_numLights': 0,
    'u_ambientLight': new Array(3),
    'u_lightPosition': new Array(3),
    'u_lightColor': new Array(3),
    'u_perspective': new Array(16),
    'u_time': 0,
    'u_view': new Array(16)
});

/**
 * WebGLRenderer is a private class that manages all interactions with the WebGL
 * API. Each frame it receives commands from the compositor and updates its
 * registries accordingly. Subsequently, the draw function is called and the
 * WebGLRenderer issues draw calls for all meshes in its registry.
 *
 * @class WebGLRenderer
 * @constructor
 *
 * @param {Element} canvas The DOM element that GL will paint itself onto.
 * @param {Compositor} compositor Compositor used for querying the time from.
 *
 * @return {undefined} undefined
 */
function WebGLRenderer(canvas, compositor) {
    canvas.classList.add('famous-webgl-renderer');

    this.canvas = canvas;
    this.compositor = compositor;

    var gl = this.gl = this.getWebGLContext(this.canvas);

    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.polygonOffset(0.1, 0.1);
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.depthFunc(gl.LEQUAL);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    this.meshRegistry = {};
    this.meshRegistryKeys = [];

    this.cutoutRegistry = {};

    this.cutoutRegistryKeys = [];

    /**
     * Lights
     */
    this.numLights = 0;
    this.ambientLightColor = [0, 0, 0];
    this.lightRegistry = {};
    this.lightRegistryKeys = [];
    this.lightPositions = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    this.lightColors = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    this.textureManager = new TextureManager(gl);
    this.texCache = {};
    this.bufferRegistry = new BufferRegistry(gl);
    this.program = new Program(gl, { debug: true });

    this.state = {
        boundArrayBuffer: null,
        boundElementBuffer: null,
        lastDrawn: null,
        enabledAttributes: {},
        enabledAttributesKeys: []
    };

    this.resolutionName = ['u_resolution'];
    this.resolutionValues = [];

    this.cachedSize = [];

    /*
    The projectionTransform has some constant components, i.e. the z scale, and the x and y translation.

    The z scale keeps the final z position of any vertex within the clip's domain by scaling it by an
    arbitrarily small coefficient. This has the advantage of being a useful default in the event of the
    user forgoing a near and far plane, an alien convention in dom space as in DOM overlapping is
    conducted via painter's algorithm.

    The x and y translation transforms the world space origin to the top left corner of the screen.

    The final component (this.projectionTransform[15]) is initialized as 1 because certain projection models,
    e.g. the WC3 specified model, keep the XY plane as the projection hyperplane.
    */
    this.projectionTransform = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, -0.000001, 0, -1, 1, 0, 1];

    // TODO: remove this hack

    var cutout = this.cutoutGeometry = new Plane();

    this.bufferRegistry.allocate(cutout.spec.id, 'a_pos', cutout.spec.bufferValues[0], 3);
    this.bufferRegistry.allocate(cutout.spec.id, 'a_texCoord', cutout.spec.bufferValues[1], 2);
    this.bufferRegistry.allocate(cutout.spec.id, 'a_normals', cutout.spec.bufferValues[2], 3);
    this.bufferRegistry.allocate(cutout.spec.id, 'indices', cutout.spec.bufferValues[3], 1);
}

/**
 * Attempts to retreive the WebGLRenderer context using several
 * accessors. For browser compatability. Throws on error.
 *
 * @method
 *
 * @param {Object} canvas Canvas element from which the context is retreived
 *
 * @return {Object} WebGLContext of canvas element
 */
WebGLRenderer.prototype.getWebGLContext = function getWebGLContext(canvas) {
    var names = ['webgl', 'experimental-webgl', 'webkit-3d', 'moz-webgl'];
    var context = null;
    for (var i = 0; i < names.length; i++) {
        try {
            context = canvas.getContext(names[i]);
        }
        catch (error) {
            var msg = 'Error creating WebGL context: ' + error.prototype.toString();
            console.error(msg);
        }
        if (context) {
            break;
        }
    }
    return context ? context : false;
};

/**
 * Adds a new base spec to the light registry at a given path.
 *
 * @method
 *
 * @param {String} path Path used as id of new light in lightRegistry
 *
 * @return {Object} Newly created light spec
 */
WebGLRenderer.prototype.createLight = function createLight(path) {
    this.numLights++;
    this.lightRegistryKeys.push(path);
    this.lightRegistry[path] = {
        color: [0, 0, 0],
        position: [0, 0, 0]
    };
    return this.lightRegistry[path];
};

/**
 * Adds a new base spec to the mesh registry at a given path.
 *
 * @method
 *
 * @param {String} path Path used as id of new mesh in meshRegistry.
 *
 * @return {Object} Newly created mesh spec.
 */
WebGLRenderer.prototype.createMesh = function createMesh(path) {
    this.meshRegistryKeys.push(path);

    var uniforms = keyValueToArrays({
        u_opacity: 1,
        u_transform: identity,
        u_size: [0, 0, 0],
        u_baseColor: [0.5, 0.5, 0.5, 1],
        u_positionOffset: [0, 0, 0],
        u_normals: [0, 0, 0],
        u_flatShading: 0,
        u_glossiness: [0, 0, 0, 0]
    });
    this.meshRegistry[path] = {
        depth: null,
        uniformKeys: uniforms.keys,
        uniformValues: uniforms.values,
        buffers: {},
        geometry: null,
        drawType: null,
        textures: [],
        visible: true
    };
    return this.meshRegistry[path];
};

/**
 * Sets flag on indicating whether to do skip draw phase for
 * cutout mesh at given path.
 *
 * @method
 *
 * @param {String} path Path used as id of target cutout mesh.
 * @param {Boolean} usesCutout Indicates the presence of a cutout mesh
 *
 * @return {undefined} undefined
 */
WebGLRenderer.prototype.setCutoutState = function setCutoutState(path, usesCutout) {
    var cutout = this.getOrSetCutout(path);

    cutout.visible = usesCutout;
};

/**
 * Creates or retreives cutout
 *
 * @method
 *
 * @param {String} path Path used as id of target cutout mesh.
 *
 * @return {Object} Newly created cutout spec.
 */
WebGLRenderer.prototype.getOrSetCutout = function getOrSetCutout(path) {
    if (this.cutoutRegistry[path]) {
        return this.cutoutRegistry[path];
    }
    else {
        var uniforms = keyValueToArrays({
            u_opacity: 0,
            u_transform: identity.slice(),
            u_size: [0, 0, 0],
            u_origin: [0, 0, 0],
            u_baseColor: [0, 0, 0, 1]
        });

        this.cutoutRegistryKeys.push(path);

        this.cutoutRegistry[path] = {
            uniformKeys: uniforms.keys,
            uniformValues: uniforms.values,
            geometry: this.cutoutGeometry.spec.id,
            drawType: this.cutoutGeometry.spec.type,
            visible: true
        };

        return this.cutoutRegistry[path];
    }
};

/**
 * Sets flag on indicating whether to do skip draw phase for
 * mesh at given path.
 *
 * @method
 * @param {String} path Path used as id of target mesh.
 * @param {Boolean} visibility Indicates the visibility of target mesh.
 *
 * @return {undefined} undefined
 */
WebGLRenderer.prototype.setMeshVisibility = function setMeshVisibility(path, visibility) {
    var mesh = this.meshRegistry[path] || this.createMesh(path);

    mesh.visible = visibility;
};

/**
 * Deletes a mesh from the meshRegistry.
 *
 * @method
 * @param {String} path Path used as id of target mesh.
 *
 * @return {undefined} undefined
 */
WebGLRenderer.prototype.removeMesh = function removeMesh(path) {
    var keyLocation = this.meshRegistryKeys.indexOf(path);
    this.meshRegistryKeys.splice(keyLocation, 1);
    this.meshRegistry[path] = null;
};

/**
 * Creates or retreives cutout
 *
 * @method
 * @param {String} path Path used as id of cutout in cutout registry.
 * @param {String} uniformName Identifier used to upload value
 * @param {Array} uniformValue Value of uniform data
 *
 * @return {undefined} undefined
 */
WebGLRenderer.prototype.setCutoutUniform = function setCutoutUniform(path, uniformName, uniformValue) {
    var cutout = this.getOrSetCutout(path);

    var index = cutout.uniformKeys.indexOf(uniformName);

    if (Array.isArray(uniformValue)) {
        for (var i = 0, len = uniformValue.length; i < len; i++) {
            cutout.uniformValues[index][i] = uniformValue[i];
        }
    }
    else {
        cutout.uniformValues[index] = uniformValue;
    }
};

/**
 * Edits the options field on a mesh
 *
 * @method
 * @param {String} path Path used as id of target mesh
 * @param {Object} options Map of draw options for mesh
 *
 * @return {undefined} undefined
**/
WebGLRenderer.prototype.setMeshOptions = function(path, options) {
    var mesh = this.meshRegistry[path] || this.createMesh(path);

    mesh.options = options;
    return this;
};

/**
 * Changes the color of the fixed intensity lighting in the scene
 *
 * @method
 *
 * @param {String} path Path used as id of light
 * @param {Number} r red channel
 * @param {Number} g green channel
 * @param {Number} b blue channel
 *
 * @return {undefined} undefined
**/
WebGLRenderer.prototype.setAmbientLightColor = function setAmbientLightColor(path, r, g, b) {
    this.ambientLightColor[0] = r;
    this.ambientLightColor[1] = g;
    this.ambientLightColor[2] = b;
    return this;
};

/**
 * Changes the location of the light in the scene
 *
 * @method
 *
 * @param {String} path Path used as id of light
 * @param {Number} x x position
 * @param {Number} y y position
 * @param {Number} z z position
 *
 * @return {undefined} undefined
**/
WebGLRenderer.prototype.setLightPosition = function setLightPosition(path, x, y, z) {
    var light = this.lightRegistry[path] || this.createLight(path);

    light.position[0] = x;
    light.position[1] = y;
    light.position[2] = z;
    return this;
};

/**
 * Changes the color of a dynamic intensity lighting in the scene
 *
 * @method
 *
 * @param {String} path Path used as id of light in light Registry.
 * @param {Number} r red channel
 * @param {Number} g green channel
 * @param {Number} b blue channel
 *
 * @return {undefined} undefined
**/
WebGLRenderer.prototype.setLightColor = function setLightColor(path, r, g, b) {
    var light = this.lightRegistry[path] || this.createLight(path);

    light.color[0] = r;
    light.color[1] = g;
    light.color[2] = b;
    return this;
};

/**
 * Compiles material spec into program shader
 *
 * @method
 *
 * @param {String} path Path used as id of cutout in cutout registry.
 * @param {String} name Name that the rendering input the material is bound to
 * @param {Object} material Material spec
 *
 * @return {undefined} undefined
**/
WebGLRenderer.prototype.handleMaterialInput = function handleMaterialInput(path, name, material) {
    var mesh = this.meshRegistry[path] || this.createMesh(path);
    material = compileMaterial(material, mesh.textures.length);

    // Set uniforms to enable texture!

    mesh.uniformValues[mesh.uniformKeys.indexOf(name)][0] = -material._id;

    // Register textures!

    var i = material.textures.length;
    while (i--) {
        mesh.textures.push(
            this.textureManager.register(material.textures[i], mesh.textures.length + i)
        );
    }

    // Register material!

    this.program.registerMaterial(name, material);

    return this.updateSize();
};

/**
 * Changes the geometry data of a mesh
 *
 * @method
 *
 * @param {String} path Path used as id of cutout in cutout registry.
 * @param {Object} geometry Geometry object containing vertex data to be drawn
 * @param {Number} drawType Primitive identifier
 * @param {Boolean} dynamic Whether geometry is dynamic
 *
 * @return {undefined} undefined
**/
WebGLRenderer.prototype.setGeometry = function setGeometry(path, geometry, drawType, dynamic) {
    var mesh = this.meshRegistry[path] || this.createMesh(path);

    mesh.geometry = geometry;
    mesh.drawType = drawType;
    mesh.dynamic = dynamic;

    return this;
};

/**
 * Uploads a new value for the uniform data when the mesh is being drawn
 *
 * @method
 *
 * @param {String} path Path used as id of mesh in mesh registry
 * @param {String} uniformName Identifier used to upload value
 * @param {Array} uniformValue Value of uniform data
 *
 * @return {undefined} undefined
**/
WebGLRenderer.prototype.setMeshUniform = function setMeshUniform(path, uniformName, uniformValue) {
    var mesh = this.meshRegistry[path] || this.createMesh(path);

    var index = mesh.uniformKeys.indexOf(uniformName);

    if (index === -1) {
        mesh.uniformKeys.push(uniformName);
        mesh.uniformValues.push(uniformValue);
    }
    else {
        mesh.uniformValues[index] = uniformValue;
    }
};

/**
 * Triggers the 'draw' phase of the WebGLRenderer. Iterates through registries
 * to set uniforms, set attributes and issue draw commands for renderables.
 *
 * @method
 *
 * @param {String} path Path used as id of mesh in mesh registry
 * @param {Number} geometryId Id of geometry in geometry registry
 * @param {String} bufferName Attribute location name
 * @param {Array} bufferValue Vertex data
 * @param {Number} bufferSpacing The dimensions of the vertex
 * @param {Boolean} isDynamic Whether geometry is dynamic
 *
 * @return {undefined} undefined
 */
WebGLRenderer.prototype.bufferData = function bufferData(path, geometryId, bufferName, bufferValue, bufferSpacing, isDynamic) {
    this.bufferRegistry.allocate(geometryId, bufferName, bufferValue, bufferSpacing, isDynamic);

    return this;
};

/**
 * Triggers the 'draw' phase of the WebGLRenderer. Iterates through registries
 * to set uniforms, set attributes and issue draw commands for renderables.
 *
 * @method
 *
 * @param {Object} renderState Parameters provided by the compositor, that affect the rendering of all renderables.
 *
 * @return {undefined} undefined
 */
WebGLRenderer.prototype.draw = function draw(renderState) {
    var time = this.compositor.getTime();

    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.textureManager.update(time);

    this.meshRegistryKeys = sorter(this.meshRegistryKeys, this.meshRegistry);

    this.setGlobalUniforms(renderState);
    this.drawCutouts();
    this.drawMeshes();
};

/**
 * Iterates through and draws all registered meshes. This includes
 * binding textures, handling draw options, setting mesh uniforms
 * and drawing mesh buffers.
 *
 * @method
 *
 * @return {undefined} undefined
 */
WebGLRenderer.prototype.drawMeshes = function drawMeshes() {
    var gl = this.gl;
    var buffers;
    var mesh;

    for(var i = 0; i < this.meshRegistryKeys.length; i++) {
        mesh = this.meshRegistry[this.meshRegistryKeys[i]];
        buffers = this.bufferRegistry.registry[mesh.geometry];

        if (!mesh.visible) continue;

        if (mesh.uniformValues[0] < 1) {
            gl.depthMask(false);
            gl.enable(gl.BLEND);
        }
        else {
            gl.depthMask(true);
            gl.disable(gl.BLEND);
        }

        if (!buffers) continue;

        var j = mesh.textures.length;
        while (j--) this.textureManager.bindTexture(mesh.textures[j]);

        if (mesh.options) this.handleOptions(mesh.options, mesh);

        this.program.setUniforms(mesh.uniformKeys, mesh.uniformValues);
        this.drawBuffers(buffers, mesh.drawType, mesh.geometry);

        if (mesh.options) this.resetOptions(mesh.options);
    }
};

/**
 * Iterates through and draws all registered cutout meshes. Blending
 * is disabled, cutout uniforms are set and finally buffers are drawn.
 *
 * @method
 *
 * @return {undefined} undefined
 */
WebGLRenderer.prototype.drawCutouts = function drawCutouts() {
    var cutout;
    var buffers;
    var len = this.cutoutRegistryKeys.length;

    if (len) {
        this.gl.enable(this.gl.BLEND);
        this.gl.depthMask(true);
    }

    for (var i = 0; i < len; i++) {
        cutout = this.cutoutRegistry[this.cutoutRegistryKeys[i]];
        buffers = this.bufferRegistry.registry[cutout.geometry];

        if (!cutout.visible) continue;

        this.program.setUniforms(cutout.uniformKeys, cutout.uniformValues);
        this.drawBuffers(buffers, cutout.drawType, cutout.geometry);
    }
};

/**
 * Sets uniforms to be shared by all meshes.
 *
 * @method
 *
 * @param {Object} renderState Draw state options passed down from compositor.
 *
 * @return {undefined} undefined
 */
WebGLRenderer.prototype.setGlobalUniforms = function setGlobalUniforms(renderState) {
    var light;
    var stride;

    for (var i = 0, len = this.lightRegistryKeys.length; i < len; i++) {
        light = this.lightRegistry[this.lightRegistryKeys[i]];
        stride = i * 4;

        // Build the light positions' 4x4 matrix

        this.lightPositions[0 + stride] = light.position[0];
        this.lightPositions[1 + stride] = light.position[1];
        this.lightPositions[2 + stride] = light.position[2];

        // Build the light colors' 4x4 matrix

        this.lightColors[0 + stride] = light.color[0];
        this.lightColors[1 + stride] = light.color[1];
        this.lightColors[2 + stride] = light.color[2];
    }

    globalUniforms.values[0] = this.numLights;
    globalUniforms.values[1] = this.ambientLightColor;
    globalUniforms.values[2] = this.lightPositions;
    globalUniforms.values[3] = this.lightColors;

    /*
     * Set time and projection uniforms
     * projecting world space into a 2d plane representation of the canvas.
     * The x and y scale (this.projectionTransform[0] and this.projectionTransform[5] respectively)
     * convert the projected geometry back into clipspace.
     * The perpective divide (this.projectionTransform[11]), adds the z value of the point
     * multiplied by the perspective divide to the w value of the point. In the process
     * of converting from homogenous coordinates to NDC (normalized device coordinates)
     * the x and y values of the point are divided by w, which implements perspective.
     */
    this.projectionTransform[0] = 1 / (this.cachedSize[0] * 0.5);
    this.projectionTransform[5] = -1 / (this.cachedSize[1] * 0.5);
    this.projectionTransform[11] = renderState.perspectiveTransform[11];

    globalUniforms.values[4] = this.projectionTransform;
    globalUniforms.values[5] = this.compositor.getTime() * 0.001;
    globalUniforms.values[6] = renderState.viewTransform;

    this.program.setUniforms(globalUniforms.keys, globalUniforms.values);
};

/**
 * Loads the buffers and issues the draw command for a geometry.
 *
 * @method
 *
 * @param {Object} vertexBuffers All buffers used to draw the geometry.
 * @param {Number} mode Enumerator defining what primitive to draw
 * @param {Number} id ID of geometry being drawn.
 *
 * @return {undefined} undefined
 */
WebGLRenderer.prototype.drawBuffers = function drawBuffers(vertexBuffers, mode, id) {
    var gl = this.gl;
    var length = 0;
    var attribute;
    var location;
    var spacing;
    var offset;
    var buffer;
    var iter;
    var j;
    var i;

    iter = vertexBuffers.keys.length;
    for (i = 0; i < iter; i++) {
        attribute = vertexBuffers.keys[i];

        // Do not set vertexAttribPointer if index buffer.

        if (attribute === 'indices') {
            j = i; continue;
        }

        // Retreive the attribute location and make sure it is enabled.

        location = this.program.attributeLocations[attribute];

        if (location === -1) continue;
        if (location === undefined) {
            location = gl.getAttribLocation(this.program.program, attribute);
            this.program.attributeLocations[attribute] = location;
            if (location === -1) continue;
        }

        if (!this.state.enabledAttributes[attribute]) {
            gl.enableVertexAttribArray(location);
            this.state.enabledAttributes[attribute] = true;
            this.state.enabledAttributesKeys.push(attribute);
        }

        // Retreive buffer information used to set attribute pointer.

        buffer = vertexBuffers.values[i];
        spacing = vertexBuffers.spacing[i];
        offset = vertexBuffers.offset[i];
        length = vertexBuffers.length[i];

        // Skip bindBuffer if buffer is currently bound.

        if (this.state.boundArrayBuffer !== buffer) {
            gl.bindBuffer(buffer.target, buffer.buffer);
            this.state.boundArrayBuffer = buffer;
        }

        if (this.state.lastDrawn !== id) {
            gl.vertexAttribPointer(location, spacing, gl.FLOAT, gl.FALSE, 0, 4 * offset);
        }
    }

    // Disable any attributes that not currently being used.

    var len = this.state.enabledAttributesKeys.length;
    for (i = 0; i < len; i++) {
        var key = this.state.enabledAttributesKeys[i];
        if (this.state.enabledAttributes[key] && vertexBuffers.keys.indexOf(key) === -1) {
            gl.disableVertexAttribArray(this.program.attributeLocations[key]);
            this.state.enabledAttributes[key] = false;
        }
    }

    if (length) {

        // If index buffer, use drawElements.

        if (j !== undefined) {
            buffer = vertexBuffers.values[j];
            offset = vertexBuffers.offset[j];
            spacing = vertexBuffers.spacing[j];
            length = vertexBuffers.length[j];

            // Skip bindBuffer if buffer is currently bound.

            if (this.state.boundElementBuffer !== buffer) {
                gl.bindBuffer(buffer.target, buffer.buffer);
                this.state.boundElementBuffer = buffer;
            }

            gl.drawElements(gl[mode], length, gl.UNSIGNED_SHORT, 2 * offset);
        }
        else {
            gl.drawArrays(gl[mode], 0, length);
        }
    }

    this.state.lastDrawn = id;
};

/**
 * Updates the width and height of parent canvas, sets the viewport size on
 * the WebGL context and updates the resolution uniform for the shader program.
 * Size is retreived from the container object of the renderer.
 *
 * @method
 *
 * @param {Array} size width, height and depth of canvas
 *
 * @return {undefined} undefined
 */
WebGLRenderer.prototype.updateSize = function updateSize(size) {
    if (size) {
        var pixelRatio = window.devicePixelRatio || 1;
        var displayWidth = ~~(size[0] * pixelRatio);
        var displayHeight = ~~(size[1] * pixelRatio);
        this.canvas.width = displayWidth;
        this.canvas.height = displayHeight;
        this.gl.viewport(0, 0, displayWidth, displayHeight);

        this.cachedSize[0] = size[0];
        this.cachedSize[1] = size[1];
        this.cachedSize[2] = (size[0] > size[1]) ? size[0] : size[1];
        this.resolutionValues[0] = this.cachedSize;
    }

    this.program.setUniforms(this.resolutionName, this.resolutionValues);

    return this;
};

/**
 * Updates the state of the WebGL drawing context based on custom parameters
 * defined on a mesh.
 *
 * @method
 *
 * @param {Object} options Draw state options to be set to the context.
 * @param {Mesh} mesh Associated Mesh
 *
 * @return {undefined} undefined
 */
WebGLRenderer.prototype.handleOptions = function handleOptions(options, mesh) {
    var gl = this.gl;
    if (!options) return;

    if (options.side === 'double') {
        this.gl.cullFace(this.gl.FRONT);
        this.drawBuffers(this.bufferRegistry.registry[mesh.geometry], mesh.drawType, mesh.geometry);
        this.gl.cullFace(this.gl.BACK);
    }

    if (options.blending) gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    if (options.side === 'back') gl.cullFace(gl.FRONT);
};

/**
 * Resets the state of the WebGL drawing context to default values.
 *
 * @method
 *
 * @param {Object} options Draw state options to be set to the context.
 *
 * @return {undefined} undefined
 */
WebGLRenderer.prototype.resetOptions = function resetOptions(options) {
    var gl = this.gl;
    if (!options) return;
    if (options.blending) gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    if (options.side === 'back') gl.cullFace(gl.BACK);
};

module.exports = WebGLRenderer;

},{"../utilities/keyValueToArrays":38,"../webgl-geometries/primitives/Plane":42,"./BufferRegistry":44,"./Program":46,"./TextureManager":48,"./compileMaterial":50,"./radixSort":52}],50:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
'use strict';

var types = {
    1: 'float ',
    2: 'vec2 ',
    3: 'vec3 ',
    4: 'vec4 '
};

/**
 * Traverses material to create a string of glsl code to be applied in
 * the vertex or fragment shader.
 *
 * @method
 * @protected
 *
 * @param {Object} material Material to be compiled.
 * @param {Number} textureSlot Next available texture slot for Mesh.
 *
 * @return {undefined} undefined
 */
function compileMaterial(material, textureSlot) {
    var glsl = '';
    var uniforms = {};
    var varyings = {};
    var attributes = {};
    var defines = [];
    var textures = [];

    _traverse(material, function (node, depth) {
        if (! node.chunk) return;

        var type = types[_getOutputLength(node)];
        var label = _makeLabel(node);
        var output = _processGLSL(node.chunk.glsl, node.inputs, textures.length + textureSlot);

        glsl += type + label + ' = ' + output + '\n ';

        if (node.uniforms) _extend(uniforms, node.uniforms);
        if (node.varyings) _extend(varyings, node.varyings);
        if (node.attributes) _extend(attributes, node.attributes);
        if (node.chunk.defines) defines.push(node.chunk.defines);
        if (node.texture) textures.push(node.texture);
    });

    return {
        _id: material._id,
        glsl: glsl + 'return ' + _makeLabel(material) + ';',
        defines: defines.join('\n'),
        uniforms: uniforms,
        varyings: varyings,
        attributes: attributes,
        textures: textures
    };
}

// Recursively iterates over a material's inputs, invoking a given callback
// with the current material
function _traverse(material, callback) {
	var inputs = material.inputs;
    var len = inputs && inputs.length;
    var idx = -1;

    while (++idx < len) _traverse(inputs[idx], callback);

    callback(material);

    return material;
}

// Helper function used to infer length of the output
// from a given material node.
function _getOutputLength(node) {

    // Handle constant values

    if (typeof node === 'number') return 1;
    if (Array.isArray(node)) return node.length;

    // Handle materials

    var output = node.chunk.output;
    if (typeof output === 'number') return output;

    // Handle polymorphic output

    var key = node.inputs.map(function recurse(node) {
        return _getOutputLength(node);
    }).join(',');

    return output[key];
}

// Helper function to run replace inputs and texture tags with
// correct glsl.
function _processGLSL(str, inputs, textureSlot) {
    return str
        .replace(/%\d/g, function (s) {
            return _makeLabel(inputs[s[1]-1]);
        })
        .replace(/\$TEXTURE/, 'u_textures[' + textureSlot + ']');
}

// Helper function used to create glsl definition of the
// input material node.
function _makeLabel (n) {
    if (Array.isArray(n)) return _arrayToVec(n);
    if (typeof n === 'object') return 'fa_' + (n._id);
    else return n.toFixed(6);
}

// Helper to copy the properties of an object onto another object.
function _extend (a, b) {
	for (var k in b) a[k] = b[k];
}

// Helper to create glsl vector representation of a javascript array.
function _arrayToVec(array) {
    var len = array.length;
    return 'vec' + len + '(' + array.join(',')  + ')';
}

module.exports = compileMaterial;

},{}],51:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

'use strict';

// Generates a checkerboard pattern to be used as a placeholder texture while an
// image loads over the network.
function createCheckerBoard() {
    var context = document.createElement('canvas').getContext('2d');
    context.canvas.width = context.canvas.height = 128;
    for (var y = 0; y < context.canvas.height; y += 16) {
        for (var x = 0; x < context.canvas.width; x += 16) {
            context.fillStyle = (x ^ y) & 16 ? '#FFF' : '#DDD';
            context.fillRect(x, y, 16, 16);
        }
    }

    return context.canvas;
}

module.exports = createCheckerBoard;

},{}],52:[function(require,module,exports){
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 Famous Industries Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
'use strict';

var radixBits = 11,
    maxRadix = 1 << (radixBits),
    radixMask = maxRadix - 1,
    buckets = new Array(maxRadix * Math.ceil(64 / radixBits)),
    msbMask = 1 << ((32 - 1) % radixBits),
    lastMask = (msbMask << 1) - 1,
    passCount = ((32 / radixBits) + 0.999999999999999) | 0,
    maxOffset = maxRadix * (passCount - 1),
    normalizer = Math.pow(20, 6);

var buffer = new ArrayBuffer(4);
var floatView = new Float32Array(buffer, 0, 1);
var intView = new Int32Array(buffer, 0, 1);

// comparator pulls relevant sorting keys out of mesh
function comp(list, registry, i) {
    var key = list[i];
    var item = registry[key];
    return (item.depth ? item.depth : registry[key].uniformValues[1][14]) + normalizer;
}

//mutator function records mesh's place in previous pass
function mutator(list, registry, i, value) {
    var key = list[i];
    registry[key].depth = intToFloat(value) - normalizer;
    return key;
}

//clean function removes mutator function's record
function clean(list, registry, i) {
    registry[list[i]].depth = null;
}

//converts a javascript float to a 32bit integer using an array buffer
//of size one
function floatToInt(k) {
    floatView[0] = k;
    return intView[0];
}
//converts a 32 bit integer to a regular javascript float using an array buffer
//of size one
function intToFloat(k) {
    intView[0] = k;
    return floatView[0];
}

//sorts a list of mesh IDs according to their z-depth
function radixSort(list, registry) {
    var pass = 0;
    var out = [];

    var i, j, k, n, div, offset, swap, id, sum, tsum, size;

    passCount = ((32 / radixBits) + 0.999999999999999) | 0;

    for (i = 0, n = maxRadix * passCount; i < n; i++) buckets[i] = 0;

    for (i = 0, n = list.length; i < n; i++) {
        div = floatToInt(comp(list, registry, i));
        div ^= div >> 31 | 0x80000000;
        for (j = 0, k = 0; j < maxOffset; j += maxRadix, k += radixBits) {
            buckets[j + (div >>> k & radixMask)]++;
        }
        buckets[j + (div >>> k & lastMask)]++;
    }

    for (j = 0; j <= maxOffset; j += maxRadix) {
        for (id = j, sum = 0; id < j + maxRadix; id++) {
            tsum = buckets[id] + sum;
            buckets[id] = sum - 1;
            sum = tsum;
        }
    }
    if (--passCount) {
        for (i = 0, n = list.length; i < n; i++) {
            div = floatToInt(comp(list, registry, i));
            out[++buckets[div & radixMask]] = mutator(list, registry, i, div ^= div >> 31 | 0x80000000);
        }
        
        swap = out;
        out = list;
        list = swap;
        while (++pass < passCount) {
            for (i = 0, n = list.length, offset = pass * maxRadix, size = pass * radixBits; i < n; i++) {
                div = floatToInt(comp(list, registry, i));
                out[++buckets[offset + (div >>> size & radixMask)]] = list[i];
            }

            swap = out;
            out = list;
            list = swap;
        }
    }

    for (i = 0, n = list.length, offset = pass * maxRadix, size = pass * radixBits; i < n; i++) {
        div = floatToInt(comp(list, registry, i));
        out[++buckets[offset + (div >>> size & lastMask)]] = mutator(list, registry, i, div ^ (~div >> 31 | 0x80000000));
        clean(list, registry, i);
    }

    return out;
}

module.exports = radixSort;

},{}],53:[function(require,module,exports){
"use strict";
var glslify = require("glslify");
var shaders = require("glslify/simple-adapter.js")("\n#define GLSLIFY 1\n\nmat3 a_x_getNormalMatrix(in mat4 t) {\n  mat3 matNorm;\n  mat4 a = t;\n  float a00 = a[0][0], a01 = a[0][1], a02 = a[0][2], a03 = a[0][3], a10 = a[1][0], a11 = a[1][1], a12 = a[1][2], a13 = a[1][3], a20 = a[2][0], a21 = a[2][1], a22 = a[2][2], a23 = a[2][3], a30 = a[3][0], a31 = a[3][1], a32 = a[3][2], a33 = a[3][3], b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11, b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12, b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30, b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32, det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;\n  det = 1.0 / det;\n  matNorm[0][0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;\n  matNorm[0][1] = (a12 * b08 - a10 * b11 - a13 * b07) * det;\n  matNorm[0][2] = (a10 * b10 - a11 * b08 + a13 * b06) * det;\n  matNorm[1][0] = (a02 * b10 - a01 * b11 - a03 * b09) * det;\n  matNorm[1][1] = (a00 * b11 - a02 * b08 + a03 * b07) * det;\n  matNorm[1][2] = (a01 * b08 - a00 * b10 - a03 * b06) * det;\n  matNorm[2][0] = (a31 * b05 - a32 * b04 + a33 * b03) * det;\n  matNorm[2][1] = (a32 * b02 - a30 * b05 - a33 * b01) * det;\n  matNorm[2][2] = (a30 * b04 - a31 * b02 + a33 * b00) * det;\n  return matNorm;\n}\nfloat b_x_inverse(float m) {\n  return 1.0 / m;\n}\nmat2 b_x_inverse(mat2 m) {\n  return mat2(m[1][1], -m[0][1], -m[1][0], m[0][0]) / (m[0][0] * m[1][1] - m[0][1] * m[1][0]);\n}\nmat3 b_x_inverse(mat3 m) {\n  float a00 = m[0][0], a01 = m[0][1], a02 = m[0][2];\n  float a10 = m[1][0], a11 = m[1][1], a12 = m[1][2];\n  float a20 = m[2][0], a21 = m[2][1], a22 = m[2][2];\n  float b01 = a22 * a11 - a12 * a21;\n  float b11 = -a22 * a10 + a12 * a20;\n  float b21 = a21 * a10 - a11 * a20;\n  float det = a00 * b01 + a01 * b11 + a02 * b21;\n  return mat3(b01, (-a22 * a01 + a02 * a21), (a12 * a01 - a02 * a11), b11, (a22 * a00 - a02 * a20), (-a12 * a00 + a02 * a10), b21, (-a21 * a00 + a01 * a20), (a11 * a00 - a01 * a10)) / det;\n}\nmat4 b_x_inverse(mat4 m) {\n  float a00 = m[0][0], a01 = m[0][1], a02 = m[0][2], a03 = m[0][3], a10 = m[1][0], a11 = m[1][1], a12 = m[1][2], a13 = m[1][3], a20 = m[2][0], a21 = m[2][1], a22 = m[2][2], a23 = m[2][3], a30 = m[3][0], a31 = m[3][1], a32 = m[3][2], a33 = m[3][3], b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11, b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12, b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30, b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32, det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;\n  return mat4(a11 * b11 - a12 * b10 + a13 * b09, a02 * b10 - a01 * b11 - a03 * b09, a31 * b05 - a32 * b04 + a33 * b03, a22 * b04 - a21 * b05 - a23 * b03, a12 * b08 - a10 * b11 - a13 * b07, a00 * b11 - a02 * b08 + a03 * b07, a32 * b02 - a30 * b05 - a33 * b01, a20 * b05 - a22 * b02 + a23 * b01, a10 * b10 - a11 * b08 + a13 * b06, a01 * b08 - a00 * b10 - a03 * b06, a30 * b04 - a31 * b02 + a33 * b00, a21 * b02 - a20 * b04 - a23 * b00, a11 * b07 - a10 * b09 - a12 * b06, a00 * b09 - a01 * b07 + a02 * b06, a31 * b01 - a30 * b03 - a32 * b00, a20 * b03 - a21 * b01 + a22 * b00) / det;\n}\nfloat c_x_transpose(float m) {\n  return m;\n}\nmat2 c_x_transpose(mat2 m) {\n  return mat2(m[0][0], m[1][0], m[0][1], m[1][1]);\n}\nmat3 c_x_transpose(mat3 m) {\n  return mat3(m[0][0], m[1][0], m[2][0], m[0][1], m[1][1], m[2][1], m[0][2], m[1][2], m[2][2]);\n}\nmat4 c_x_transpose(mat4 m) {\n  return mat4(m[0][0], m[1][0], m[2][0], m[3][0], m[0][1], m[1][1], m[2][1], m[3][1], m[0][2], m[1][2], m[2][2], m[3][2], m[0][3], m[1][3], m[2][3], m[3][3]);\n}\nvec4 applyTransform(vec4 pos) {\n  mat4 MVMatrix = u_view * u_transform;\n  pos.x += 1.0;\n  pos.y -= 1.0;\n  pos.xyz *= u_size * 0.5;\n  pos.y *= -1.0;\n  v_position = (MVMatrix * pos).xyz;\n  v_eyeVector = (u_resolution * 0.5) - v_position;\n  pos = u_perspective * MVMatrix * pos;\n  return pos;\n}\n#vert_definitions\n\nvec3 calculateOffset(vec3 ID) {\n  \n  #vert_applications\n  return vec3(0.0);\n}\nvoid main() {\n  v_textureCoordinate = a_texCoord;\n  vec3 invertedNormals = a_normals + (u_normals.x < 0.0 ? calculateOffset(u_normals) * 2.0 - 1.0 : vec3(0.0));\n  invertedNormals.y *= -1.0;\n  v_normal = c_x_transpose(mat3(b_x_inverse(u_transform))) * invertedNormals;\n  vec3 offsetPos = a_pos + calculateOffset(u_positionOffset);\n  gl_Position = applyTransform(vec4(offsetPos, 1.0));\n}", "\n#define GLSLIFY 1\n\n#float_definitions\n\nfloat a_x_applyMaterial(float ID) {\n  \n  #float_applications\n  return 1.;\n}\n#vec3_definitions\n\nvec3 a_x_applyMaterial(vec3 ID) {\n  \n  #vec3_applications\n  return vec3(0);\n}\n#vec4_definitions\n\nvec4 a_x_applyMaterial(vec4 ID) {\n  \n  #vec4_applications\n  return vec4(0);\n}\nvec4 b_x_applyLight(in vec4 baseColor, in vec3 normal, in vec4 glossiness) {\n  int numLights = int(u_numLights);\n  vec3 ambientColor = u_ambientLight * baseColor.rgb;\n  vec3 eyeVector = normalize(v_eyeVector);\n  vec3 diffuse = vec3(0.0);\n  bool hasGlossiness = glossiness.a > 0.0;\n  bool hasSpecularColor = length(glossiness.rgb) > 0.0;\n  for(int i = 0; i < 4; i++) {\n    if(i >= numLights)\n      break;\n    vec3 lightDirection = normalize(u_lightPosition[i].xyz - v_position);\n    float lambertian = max(dot(lightDirection, normal), 0.0);\n    if(lambertian > 0.0) {\n      diffuse += u_lightColor[i].rgb * baseColor.rgb * lambertian;\n      if(hasGlossiness) {\n        vec3 halfVector = normalize(lightDirection + eyeVector);\n        float specularWeight = pow(max(dot(halfVector, normal), 0.0), glossiness.a);\n        vec3 specularColor = hasSpecularColor ? glossiness.rgb : u_lightColor[i].rgb;\n        diffuse += specularColor * specularWeight * lambertian;\n      }\n    }\n  }\n  return vec4(ambientColor + diffuse, baseColor.a);\n}\nvoid main() {\n  vec4 material = u_baseColor.r >= 0.0 ? u_baseColor : a_x_applyMaterial(u_baseColor);\n  bool lightsEnabled = (u_flatShading == 0.0) && (u_numLights > 0.0 || length(u_ambientLight) > 0.0);\n  vec3 normal = normalize(v_normal);\n  vec4 glossiness = u_glossiness.x < 0.0 ? a_x_applyMaterial(u_glossiness) : u_glossiness;\n  vec4 color = lightsEnabled ? b_x_applyLight(material, normalize(v_normal), glossiness) : material;\n  gl_FragColor = color;\n  gl_FragColor.a *= u_opacity;\n}", [], []);
module.exports = shaders;
},{"glslify":27,"glslify/simple-adapter.js":28}],54:[function(require,module,exports){
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

    new DOMElement(car, { tagName: "img" }).setAttribute("src", "./images/car" + ("000" + (index + 1)).slice(-3) + ".jpg");

    car.setSizeMode("absolute", "absolute", "absolute").setAbsoluteSize(thumbnailSize.w, thumbnailSize.h);

    if (startY < pixelCoords.y) {
        car.setPosition(pixelCoords.x, pixelCoords.y);
        return;
    }

    car.setPosition(pixelCoords.x, startY);

    moveComponent = {
        onUpdate: function onUpdate() {
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

},{"./calculator":55,"./getViewportSize":57,"./scene":58,"./settings":59,"famous/dom-renderables/DOMElement":11}],55:[function(require,module,exports){
"use strict";

var viewportSizeF = require("./getViewportSize"),
    settings = require("./settings"),
    viewportSize = viewportSizeF();

function getColumns() {
    return Math.floor(viewportSize.w / settings.targetThumbnailWidth);
}

function getThumbnailSize() {
    var w = viewportSize.w / getColumns(),
        h = w * settings.thumbnailAspectRatio;

    return {
        w: w,
        h: h
    };
}

function getGridCoords(index) {
    var cols = getColumns(),
        col = index % cols,
        row = Math.floor(index / cols);

    return {
        row: row,
        col: col
    };
}

function getPixelCoords(index) {
    var gridCoords = getGridCoords(index),
        thumbnailSize = getThumbnailSize(),
        x = gridCoords.col * thumbnailSize.w,
        y = gridCoords.row * thumbnailSize.h;

    return {
        x: x,
        y: y
    };
}

module.exports = {
    getColumns: getColumns,
    getThumbnailSize: getThumbnailSize,
    getGridCoords: getGridCoords,
    getPixelCoords: getPixelCoords
};

},{"./getViewportSize":57,"./settings":59}],56:[function(require,module,exports){
"use strict";

module.exports = function delay(ms, func) {
    return function () {
        var args = Array.prototype.slice.call(arguments);
        window.setTimeout(function () {
            func.apply(null, args);
        }, ms);
    };
};

},{}],57:[function(require,module,exports){
"use strict";

module.exports = function () {
    if (typeof document.documentElement.clientWidth === "undefined") {
        throw new Error("unsupported browser");
    }
    return {
        w: document.documentElement.clientWidth,
        h: document.documentElement.clientHeight
    };
};

},{}],58:[function(require,module,exports){
"use strict";

var FamousEngine = require("famous/core/FamousEngine");

FamousEngine.init();

module.exports = FamousEngine.createScene();

},{"famous/core/FamousEngine":6}],59:[function(require,module,exports){
"use strict";

module.exports = {
    targetThumbnailWidth: 240,
    thumbnailAspectRatio: 0.75
};

},{}],60:[function(require,module,exports){
"use strict";

var addCar = require("./addCar"),
    delay = require("./delay"),
    i;

for (i = 0; i < 100; i++) {
    delay(i * 30 + Math.random() * 100, addCar)(i);
}

},{"./addCar":54,"./delay":56}]},{},[60])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL2NvbXBvbmVudHMvQ2FtZXJhLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy9jb3JlL0NoYW5uZWwuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL2NvcmUvQ2xvY2suanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL2NvcmUvRGlzcGF0Y2guanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL2NvcmUvRXZlbnQuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL2NvcmUvRmFtb3VzRW5naW5lLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy9jb3JlL05vZGUuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL2NvcmUvU2NlbmUuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL2NvcmUvU2l6ZS5qcyIsIm5vZGVfbW9kdWxlcy9mYW1vdXMvY29yZS9UcmFuc2Zvcm0uanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL2RvbS1yZW5kZXJhYmxlcy9ET01FbGVtZW50LmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy9kb20tcmVuZGVyZXJzL0RPTVJlbmRlcmVyLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy9kb20tcmVuZGVyZXJzL0VsZW1lbnRDYWNoZS5qcyIsIm5vZGVfbW9kdWxlcy9mYW1vdXMvZG9tLXJlbmRlcmVycy9NYXRoLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy9kb20tcmVuZGVyZXJzL2V2ZW50cy9Db21wb3NpdGlvbkV2ZW50LmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy9kb20tcmVuZGVyZXJzL2V2ZW50cy9FdmVudC5qcyIsIm5vZGVfbW9kdWxlcy9mYW1vdXMvZG9tLXJlbmRlcmVycy9ldmVudHMvRXZlbnRNYXAuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL2RvbS1yZW5kZXJlcnMvZXZlbnRzL0ZvY3VzRXZlbnQuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL2RvbS1yZW5kZXJlcnMvZXZlbnRzL0lucHV0RXZlbnQuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL2RvbS1yZW5kZXJlcnMvZXZlbnRzL0tleWJvYXJkRXZlbnQuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL2RvbS1yZW5kZXJlcnMvZXZlbnRzL01vdXNlRXZlbnQuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL2RvbS1yZW5kZXJlcnMvZXZlbnRzL1RvdWNoRXZlbnQuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL2RvbS1yZW5kZXJlcnMvZXZlbnRzL1VJRXZlbnQuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL2RvbS1yZW5kZXJlcnMvZXZlbnRzL1doZWVsRXZlbnQuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL21hdGgvVmVjMi5qcyIsIm5vZGVfbW9kdWxlcy9mYW1vdXMvbWF0aC9WZWMzLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy9ub2RlX21vZHVsZXMvZ2xzbGlmeS9icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy9ub2RlX21vZHVsZXMvZ2xzbGlmeS9zaW1wbGUtYWRhcHRlci5qcyIsIm5vZGVfbW9kdWxlcy9mYW1vdXMvcG9seWZpbGxzL2FuaW1hdGlvbkZyYW1lLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy9wb2x5ZmlsbHMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL3JlbmRlci1sb29wcy9SZXF1ZXN0QW5pbWF0aW9uRnJhbWVMb29wLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy9yZW5kZXJlcnMvQ29tcG9zaXRvci5qcyIsIm5vZGVfbW9kdWxlcy9mYW1vdXMvcmVuZGVyZXJzL0NvbnRleHQuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL3JlbmRlcmVycy9VSU1hbmFnZXIuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL3JlbmRlcmVycy9pbmplY3QtY3NzLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy91dGlsaXRpZXMvQ2FsbGJhY2tTdG9yZS5qcyIsIm5vZGVfbW9kdWxlcy9mYW1vdXMvdXRpbGl0aWVzL2Nsb25lLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy91dGlsaXRpZXMva2V5VmFsdWVUb0FycmF5cy5qcyIsIm5vZGVfbW9kdWxlcy9mYW1vdXMvdXRpbGl0aWVzL3ZlbmRvclByZWZpeC5qcyIsIm5vZGVfbW9kdWxlcy9mYW1vdXMvd2ViZ2wtZ2VvbWV0cmllcy9HZW9tZXRyeS5qcyIsIm5vZGVfbW9kdWxlcy9mYW1vdXMvd2ViZ2wtZ2VvbWV0cmllcy9HZW9tZXRyeUhlbHBlci5qcyIsIm5vZGVfbW9kdWxlcy9mYW1vdXMvd2ViZ2wtZ2VvbWV0cmllcy9wcmltaXRpdmVzL1BsYW5lLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy93ZWJnbC1yZW5kZXJlcnMvQnVmZmVyLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy93ZWJnbC1yZW5kZXJlcnMvQnVmZmVyUmVnaXN0cnkuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL3dlYmdsLXJlbmRlcmVycy9EZWJ1Zy5qcyIsIm5vZGVfbW9kdWxlcy9mYW1vdXMvd2ViZ2wtcmVuZGVyZXJzL1Byb2dyYW0uanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL3dlYmdsLXJlbmRlcmVycy9UZXh0dXJlLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy93ZWJnbC1yZW5kZXJlcnMvVGV4dHVyZU1hbmFnZXIuanMiLCJub2RlX21vZHVsZXMvZmFtb3VzL3dlYmdsLXJlbmRlcmVycy9XZWJHTFJlbmRlcmVyLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy93ZWJnbC1yZW5kZXJlcnMvY29tcGlsZU1hdGVyaWFsLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy93ZWJnbC1yZW5kZXJlcnMvY3JlYXRlQ2hlY2tlcmJvYXJkLmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy93ZWJnbC1yZW5kZXJlcnMvcmFkaXhTb3J0LmpzIiwibm9kZV9tb2R1bGVzL2ZhbW91cy93ZWJnbC1zaGFkZXJzL2luZGV4LmpzIiwiL1VzZXJzL3BhaHVuZC9naXQvd2hlbi13aWxsLWktYmUtZmFtb3VzL3NyYy9hZGRDYXIuanMiLCIvVXNlcnMvcGFodW5kL2dpdC93aGVuLXdpbGwtaS1iZS1mYW1vdXMvc3JjL2NhbGN1bGF0b3IuanMiLCIvVXNlcnMvcGFodW5kL2dpdC93aGVuLXdpbGwtaS1iZS1mYW1vdXMvc3JjL2RlbGF5LmpzIiwiL1VzZXJzL3BhaHVuZC9naXQvd2hlbi13aWxsLWktYmUtZmFtb3VzL3NyYy9nZXRWaWV3cG9ydFNpemUuanMiLCIvVXNlcnMvcGFodW5kL2dpdC93aGVuLXdpbGwtaS1iZS1mYW1vdXMvc3JjL3NjZW5lLmpzIiwiL1VzZXJzL3BhaHVuZC9naXQvd2hlbi13aWxsLWktYmUtZmFtb3VzL3NyYy9zZXR0aW5ncy5qcyIsIi9Vc2Vycy9wYWh1bmQvZ2l0L3doZW4td2lsbC1pLWJlLWZhbW91cy9zcmMvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdlRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaE5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuWUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzb0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMWxCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDalhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0VEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0UUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvV0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDampCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0ZUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbE5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2MEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pJQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQSxZQUFZLENBQUM7O0FBRWIsSUFBSSxhQUFhLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixDQUFDO0lBQzVDLFVBQVUsR0FBRyxPQUFPLENBQUMsbUNBQW1DLENBQUM7SUFDekQsUUFBUSxHQUFHLE9BQU8sQ0FBQyxZQUFZLENBQUM7SUFDaEMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUM7SUFDMUIsVUFBVSxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUM7SUFFcEMsWUFBWSxHQUFHLGFBQWEsRUFBRSxDQUFDOztBQUVuQyxNQUFNLENBQUMsT0FBTyxHQUFHLFVBQVUsS0FBSyxFQUFFO0FBQzlCLFFBQUksR0FBRyxHQUFHLEtBQUssQ0FBQyxRQUFRLEVBQUU7UUFDdEIsYUFBYSxHQUFHLFVBQVUsQ0FBQyxnQkFBZ0IsRUFBRTtRQUM3QyxXQUFXLEdBQUcsVUFBVSxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUM7UUFDOUMsTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUMsR0FBRyxhQUFhLENBQUMsQ0FBQyxDQUFDLEdBQUcsYUFBYSxDQUFDLENBQUM7UUFDdkUsU0FBUyxHQUFHLGFBQWEsQ0FBQyxDQUFDLEdBQUcsQ0FBQztRQUUvQixhQUFhO1FBQ2IsS0FBSyxDQUFDOztBQUVWLFFBQUksVUFBVSxDQUFDLEdBQUcsRUFBRSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUNsQyxZQUFZLENBQUMsS0FBSyxFQUFFLGNBQWMsR0FBRyxDQUFDLEtBQUssSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFBLENBQUMsQ0FBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQzs7QUFFcEYsT0FBRyxDQUNFLFdBQVcsQ0FBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLFVBQVUsQ0FBQyxDQUMvQyxlQUFlLENBQUMsYUFBYSxDQUFDLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUM7O0FBRXZELFFBQUksTUFBTSxHQUFHLFdBQVcsQ0FBQyxDQUFDLEVBQUU7QUFDeEIsV0FBRyxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM5QyxlQUFPO0tBQ1Y7O0FBRUQsT0FBRyxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDOztBQUV2QyxpQkFBYSxHQUFHO0FBQ1osZ0JBQVEsRUFBRSxvQkFBWTtBQUNsQixnQkFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDeEIsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM3QixnQkFBSSxDQUFDLEdBQUcsV0FBVyxDQUFDLENBQUMsRUFBRTtBQUNuQixtQkFBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxDQUFDO0FBQ2xDLG1CQUFHLENBQUMsdUJBQXVCLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDbkMsdUJBQU87YUFDVjtBQUNELGVBQUcsQ0FBQyxlQUFlLENBQUMsYUFBYSxDQUFDLENBQUM7U0FDdEM7S0FDSixDQUFDOztBQUVGLFNBQUssR0FBRyxHQUFHLENBQUMsWUFBWSxDQUFDLGFBQWEsQ0FBQyxDQUFDOztBQUV4QyxPQUFHLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO0NBQzVCLENBQUM7OztBQ2xERixZQUFZLENBQUM7O0FBRWIsSUFBSSxhQUFhLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixDQUFDO0lBQzVDLFFBQVEsR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDO0lBRWhDLFlBQVksR0FBRyxhQUFhLEVBQUUsQ0FBQzs7QUFFbkMsU0FBUyxVQUFVLEdBQUc7QUFDbEIsV0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFDLG9CQUFvQixDQUFDLENBQUM7Q0FDckU7O0FBRUQsU0FBUyxnQkFBZ0IsR0FBRztBQUN4QixRQUFJLENBQUMsR0FBRyxZQUFZLENBQUMsQ0FBQyxHQUFHLFVBQVUsRUFBRTtRQUNqQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxvQkFBb0IsQ0FBQzs7QUFFMUMsV0FBTztBQUNILFNBQUMsRUFBRSxDQUFDO0FBQ0osU0FBQyxFQUFFLENBQUM7S0FDUCxDQUFDO0NBQ0w7O0FBRUQsU0FBUyxhQUFhLENBQUMsS0FBSyxFQUFFO0FBQzFCLFFBQUksSUFBSSxHQUFHLFVBQVUsRUFBRTtRQUNuQixHQUFHLEdBQUcsS0FBSyxHQUFHLElBQUk7UUFDbEIsR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxDQUFDOztBQUVuQyxXQUFPO0FBQ0gsV0FBRyxFQUFFLEdBQUc7QUFDUixXQUFHLEVBQUUsR0FBRztLQUNYLENBQUM7Q0FDTDs7QUFFRCxTQUFTLGNBQWMsQ0FBQyxLQUFLLEVBQUU7QUFDM0IsUUFBSSxVQUFVLEdBQUcsYUFBYSxDQUFDLEtBQUssQ0FBQztRQUNqQyxhQUFhLEdBQUcsZ0JBQWdCLEVBQUU7UUFDbEMsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEdBQUcsYUFBYSxDQUFDLENBQUM7UUFDcEMsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEdBQUcsYUFBYSxDQUFDLENBQUMsQ0FBQzs7QUFFekMsV0FBTztBQUNILFNBQUMsRUFBRSxDQUFDO0FBQ0osU0FBQyxFQUFFLENBQUM7S0FDUCxDQUFDO0NBQ0w7O0FBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRztBQUNiLGNBQVUsRUFBRSxVQUFVO0FBQ3RCLG9CQUFnQixFQUFFLGdCQUFnQjtBQUNsQyxpQkFBYSxFQUFFLGFBQWE7QUFDNUIsa0JBQWMsRUFBRSxjQUFjO0NBQ2pDLENBQUM7OztBQ2pERixZQUFZLENBQUM7O0FBRWIsTUFBTSxDQUFDLE9BQU8sR0FBRyxTQUFTLEtBQUssQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFO0FBQ3RDLFdBQU8sWUFBWTtBQUNmLFlBQUksSUFBSSxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNqRCxjQUFNLENBQUMsVUFBVSxDQUFDLFlBQVk7QUFDMUIsZ0JBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1NBQzFCLEVBQUUsRUFBRSxDQUFDLENBQUM7S0FDVixDQUFDO0NBQ0wsQ0FBQzs7O0FDVEYsWUFBWSxDQUFDOztBQUViLE1BQU0sQ0FBQyxPQUFPLEdBQUcsWUFBWTtBQUN6QixRQUFJLE9BQU8sUUFBUSxDQUFDLGVBQWUsQ0FBQyxXQUFXLEFBQUMsS0FBSyxXQUFXLEVBQUU7QUFDOUQsY0FBTSxJQUFJLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO0tBQzFDO0FBQ0QsV0FBTztBQUNILFNBQUMsRUFBRSxRQUFRLENBQUMsZUFBZSxDQUFDLFdBQVc7QUFDdkMsU0FBQyxFQUFFLFFBQVEsQ0FBQyxlQUFlLENBQUMsWUFBWTtLQUMzQyxDQUFDO0NBQ0wsQ0FBQzs7O0FDVkYsWUFBWSxDQUFDOztBQUViLElBQUksWUFBWSxHQUFHLE9BQU8sQ0FBQywwQkFBMEIsQ0FBQyxDQUFDOztBQUV2RCxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUM7O0FBRXBCLE1BQU0sQ0FBQyxPQUFPLEdBQUcsWUFBWSxDQUFDLFdBQVcsRUFBRSxDQUFDOzs7QUNONUMsWUFBWSxDQUFDOztBQUViLE1BQU0sQ0FBQyxPQUFPLEdBQUc7QUFDYix3QkFBb0IsRUFBRSxHQUFHO0FBQ3pCLHdCQUFvQixFQUFFLElBQUk7Q0FDN0IsQ0FBQzs7O0FDTEYsWUFBWSxDQUFDOztBQUViLElBQUksTUFBTSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUM7SUFDNUIsS0FBSyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUM7SUFDMUIsQ0FBQyxDQUFDOztBQUVOLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQ3RCLFNBQUssQ0FBQyxBQUFDLENBQUMsR0FBRyxFQUFFLEdBQUssSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLEdBQUcsQUFBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ3REIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBDYW1lcmEgaXMgYSBjb21wb25lbnQgdGhhdCBpcyByZXNwb25zaWJsZSBmb3Igc2VuZGluZyBpbmZvcm1hdGlvbiB0byB0aGUgcmVuZGVyZXIgYWJvdXQgd2hlcmVcbiAqIHRoZSBjYW1lcmEgaXMgaW4gdGhlIHNjZW5lLiAgVGhpcyBhbGxvd3MgdGhlIHVzZXIgdG8gc2V0IHRoZSB0eXBlIG9mIHByb2plY3Rpb24sIHRoZSBmb2NhbCBkZXB0aCxcbiAqIGFuZCBvdGhlciBwcm9wZXJ0aWVzIHRvIGFkanVzdCB0aGUgd2F5IHRoZSBzY2VuZXMgYXJlIHJlbmRlcmVkLlxuICpcbiAqIEBjbGFzcyBDYW1lcmFcbiAqXG4gKiBAcGFyYW0ge05vZGV9IG5vZGUgdG8gd2hpY2ggdGhlIGluc3RhbmNlIG9mIENhbWVyYSB3aWxsIGJlIGEgY29tcG9uZW50IG9mXG4gKi9cbmZ1bmN0aW9uIENhbWVyYShub2RlKSB7XG4gICAgdGhpcy5fbm9kZSA9IG5vZGU7XG4gICAgdGhpcy5fcHJvamVjdGlvblR5cGUgPSBDYW1lcmEuT1JUSE9HUkFQSElDX1BST0pFQ1RJT047XG4gICAgdGhpcy5fZm9jYWxEZXB0aCA9IDA7XG4gICAgdGhpcy5fbmVhciA9IDA7XG4gICAgdGhpcy5fZmFyID0gMDtcbiAgICB0aGlzLl9yZXF1ZXN0aW5nVXBkYXRlID0gZmFsc2U7XG4gICAgdGhpcy5faWQgPSBub2RlLmFkZENvbXBvbmVudCh0aGlzKTtcbiAgICB0aGlzLl92aWV3VHJhbnNmb3JtID0gbmV3IEZsb2F0MzJBcnJheShbMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMV0pO1xuICAgIHRoaXMuX3ZpZXdEaXJ0eSA9IGZhbHNlO1xuICAgIHRoaXMuX3BlcnNwZWN0aXZlRGlydHkgPSBmYWxzZTtcbiAgICB0aGlzLnNldEZsYXQoKTtcbn1cblxuQ2FtZXJhLkZSVVNUVU1fUFJPSkVDVElPTiA9IDA7XG5DYW1lcmEuUElOSE9MRV9QUk9KRUNUSU9OID0gMTtcbkNhbWVyYS5PUlRIT0dSQVBISUNfUFJPSkVDVElPTiA9IDI7XG5cbi8qKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge1N0cmluZ30gTmFtZSBvZiB0aGUgY29tcG9uZW50XG4gKi9cbkNhbWVyYS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZygpIHtcbiAgICByZXR1cm4gJ0NhbWVyYSc7XG59O1xuXG4vKipcbiAqIEdldHMgb2JqZWN0IGNvbnRhaW5pbmcgc2VyaWFsaXplZCBkYXRhIGZvciB0aGUgY29tcG9uZW50XG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge09iamVjdH0gdGhlIHN0YXRlIG9mIHRoZSBjb21wb25lbnRcbiAqL1xuQ2FtZXJhLnByb3RvdHlwZS5nZXRWYWx1ZSA9IGZ1bmN0aW9uIGdldFZhbHVlKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIGNvbXBvbmVudDogdGhpcy50b1N0cmluZygpLFxuICAgICAgICBwcm9qZWN0aW9uVHlwZTogdGhpcy5fcHJvamVjdGlvblR5cGUsXG4gICAgICAgIGZvY2FsRGVwdGg6IHRoaXMuX2ZvY2FsRGVwdGgsXG4gICAgICAgIG5lYXI6IHRoaXMuX25lYXIsXG4gICAgICAgIGZhcjogdGhpcy5fZmFyXG4gICAgfTtcbn07XG5cbi8qKlxuICogU2V0IHRoZSBjb21wb25lbnRzIHN0YXRlIGJhc2VkIG9uIHNvbWUgc2VyaWFsaXplZCBkYXRhXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBzdGF0ZSBhbiBvYmplY3QgZGVmaW5pbmcgd2hhdCB0aGUgc3RhdGUgb2YgdGhlIGNvbXBvbmVudCBzaG91bGQgYmVcbiAqXG4gKiBAcmV0dXJuIHtCb29sZWFufSBzdGF0dXMgb2YgdGhlIHNldFxuICovXG5DYW1lcmEucHJvdG90eXBlLnNldFZhbHVlID0gZnVuY3Rpb24gc2V0VmFsdWUoc3RhdGUpIHtcbiAgICBpZiAodGhpcy50b1N0cmluZygpID09PSBzdGF0ZS5jb21wb25lbnQpIHtcbiAgICAgICAgdGhpcy5zZXQoc3RhdGUucHJvamVjdGlvblR5cGUsIHN0YXRlLmZvY2FsRGVwdGgsIHN0YXRlLm5lYXIsIHN0YXRlLmZhcik7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59O1xuXG4vKipcbiAqIFNldCB0aGUgaW50ZXJuYWxzIG9mIHRoZSBjb21wb25lbnRcbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHR5cGUgYW4gaWQgY29ycmVzcG9uZGluZyB0byB0aGUgdHlwZSBvZiBwcm9qZWN0aW9uIHRvIHVzZVxuICogQHBhcmFtIHtOdW1iZXJ9IGRlcHRoIHRoZSBkZXB0aCBmb3IgdGhlIHBpbmhvbGUgcHJvamVjdGlvbiBtb2RlbFxuICogQHBhcmFtIHtOdW1iZXJ9IG5lYXIgdGhlIGRpc3RhbmNlIG9mIHRoZSBuZWFyIGNsaXBwaW5nIHBsYW5lIGZvciBhIGZydXN0dW0gcHJvamVjdGlvblxuICogQHBhcmFtIHtOdW1iZXJ9IGZhciB0aGUgZGlzdGFuY2Ugb2YgdGhlIGZhciBjbGlwcGluZyBwbGFuZSBmb3IgYSBmcnVzdHVtIHByb2plY3Rpb25cbiAqXG4gKiBAcmV0dXJuIHtCb29sZWFufSBzdGF0dXMgb2YgdGhlIHNldFxuICovXG5DYW1lcmEucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIHNldCh0eXBlLCBkZXB0aCwgbmVhciwgZmFyKSB7XG4gICAgaWYgKCF0aGlzLl9yZXF1ZXN0aW5nVXBkYXRlKSB7XG4gICAgICAgIHRoaXMuX25vZGUucmVxdWVzdFVwZGF0ZSh0aGlzLl9pZCk7XG4gICAgICAgIHRoaXMuX3JlcXVlc3RpbmdVcGRhdGUgPSB0cnVlO1xuICAgIH1cbiAgICB0aGlzLl9wcm9qZWN0aW9uVHlwZSA9IHR5cGU7XG4gICAgdGhpcy5fZm9jYWxEZXB0aCA9IGRlcHRoO1xuICAgIHRoaXMuX25lYXIgPSBuZWFyO1xuICAgIHRoaXMuX2ZhciA9IGZhcjtcbn07XG5cbi8qKlxuICogU2V0IHRoZSBjYW1lcmEgZGVwdGggZm9yIGEgcGluaG9sZSBwcm9qZWN0aW9uIG1vZGVsXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBkZXB0aCB0aGUgZGlzdGFuY2UgYmV0d2VlbiB0aGUgQ2FtZXJhIGFuZCB0aGUgb3JpZ2luXG4gKlxuICogQHJldHVybiB7Q2FtZXJhfSB0aGlzXG4gKi9cbkNhbWVyYS5wcm90b3R5cGUuc2V0RGVwdGggPSBmdW5jdGlvbiBzZXREZXB0aChkZXB0aCkge1xuICAgIGlmICghdGhpcy5fcmVxdWVzdGluZ1VwZGF0ZSkge1xuICAgICAgICB0aGlzLl9ub2RlLnJlcXVlc3RVcGRhdGUodGhpcy5faWQpO1xuICAgICAgICB0aGlzLl9yZXF1ZXN0aW5nVXBkYXRlID0gdHJ1ZTtcbiAgICB9XG4gICAgdGhpcy5fcGVyc3BlY3RpdmVEaXJ0eSA9IHRydWU7XG4gICAgdGhpcy5fcHJvamVjdGlvblR5cGUgPSBDYW1lcmEuUElOSE9MRV9QUk9KRUNUSU9OO1xuICAgIHRoaXMuX2ZvY2FsRGVwdGggPSBkZXB0aDtcbiAgICB0aGlzLl9uZWFyID0gMDtcbiAgICB0aGlzLl9mYXIgPSAwO1xuXG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEdldHMgb2JqZWN0IGNvbnRhaW5pbmcgc2VyaWFsaXplZCBkYXRhIGZvciB0aGUgY29tcG9uZW50XG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBuZWFyIGRpc3RhbmNlIGZyb20gdGhlIG5lYXIgY2xpcHBpbmcgcGxhbmUgdG8gdGhlIGNhbWVyYVxuICogQHBhcmFtIHtOdW1iZXJ9IGZhciBkaXN0YW5jZSBmcm9tIHRoZSBmYXIgY2xpcHBpbmcgcGxhbmUgdG8gdGhlIGNhbWVyYVxuICpcbiAqIEByZXR1cm4ge0NhbWVyYX0gdGhpc1xuICovXG5DYW1lcmEucHJvdG90eXBlLnNldEZydXN0dW0gPSBmdW5jdGlvbiBzZXRGcnVzdHVtKG5lYXIsIGZhcikge1xuICAgIGlmICghdGhpcy5fcmVxdWVzdGluZ1VwZGF0ZSkge1xuICAgICAgICB0aGlzLl9ub2RlLnJlcXVlc3RVcGRhdGUodGhpcy5faWQpO1xuICAgICAgICB0aGlzLl9yZXF1ZXN0aW5nVXBkYXRlID0gdHJ1ZTtcbiAgICB9XG5cbiAgICB0aGlzLl9wZXJzcGVjdGl2ZURpcnR5ID0gdHJ1ZTtcbiAgICB0aGlzLl9wcm9qZWN0aW9uVHlwZSA9IENhbWVyYS5GUlVTVFVNX1BST0pFQ1RJT047XG4gICAgdGhpcy5fZm9jYWxEZXB0aCA9IDA7XG4gICAgdGhpcy5fbmVhciA9IG5lYXI7XG4gICAgdGhpcy5fZmFyID0gZmFyO1xuXG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFNldCB0aGUgQ2FtZXJhIHRvIGhhdmUgb3J0aG9ncmFwaGljIHByb2plY3Rpb25cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7Q2FtZXJhfSB0aGlzXG4gKi9cbkNhbWVyYS5wcm90b3R5cGUuc2V0RmxhdCA9IGZ1bmN0aW9uIHNldEZsYXQoKSB7XG4gICAgaWYgKCF0aGlzLl9yZXF1ZXN0aW5nVXBkYXRlKSB7XG4gICAgICAgIHRoaXMuX25vZGUucmVxdWVzdFVwZGF0ZSh0aGlzLl9pZCk7XG4gICAgICAgIHRoaXMuX3JlcXVlc3RpbmdVcGRhdGUgPSB0cnVlO1xuICAgIH1cblxuICAgIHRoaXMuX3BlcnNwZWN0aXZlRGlydHkgPSB0cnVlO1xuICAgIHRoaXMuX3Byb2plY3Rpb25UeXBlID0gQ2FtZXJhLk9SVEhPR1JBUEhJQ19QUk9KRUNUSU9OO1xuICAgIHRoaXMuX2ZvY2FsRGVwdGggPSAwO1xuICAgIHRoaXMuX25lYXIgPSAwO1xuICAgIHRoaXMuX2ZhciA9IDA7XG5cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogV2hlbiB0aGUgbm9kZSB0aGlzIGNvbXBvbmVudCBpcyBhdHRhY2hlZCB0byB1cGRhdGVzLCB0aGUgQ2FtZXJhIHdpbGxcbiAqIHNlbmQgbmV3IGNhbWVyYSBpbmZvcm1hdGlvbiB0byB0aGUgQ29tcG9zaXRvciB0byB1cGRhdGUgdGhlIHJlbmRlcmluZ1xuICogb2YgdGhlIHNjZW5lLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5DYW1lcmEucHJvdG90eXBlLm9uVXBkYXRlID0gZnVuY3Rpb24gb25VcGRhdGUoKSB7XG4gICAgdGhpcy5fcmVxdWVzdGluZ1VwZGF0ZSA9IGZhbHNlO1xuXG4gICAgdmFyIHBhdGggPSB0aGlzLl9ub2RlLmdldExvY2F0aW9uKCk7XG5cbiAgICB0aGlzLl9ub2RlXG4gICAgICAgIC5zZW5kRHJhd0NvbW1hbmQoJ1dJVEgnKVxuICAgICAgICAuc2VuZERyYXdDb21tYW5kKHBhdGgpO1xuXG4gICAgaWYgKHRoaXMuX3BlcnNwZWN0aXZlRGlydHkpIHtcbiAgICAgICAgdGhpcy5fcGVyc3BlY3RpdmVEaXJ0eSA9IGZhbHNlO1xuXG4gICAgICAgIHN3aXRjaCAodGhpcy5fcHJvamVjdGlvblR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgQ2FtZXJhLkZSVVNUVU1fUFJPSkVDVElPTjpcbiAgICAgICAgICAgICAgICB0aGlzLl9ub2RlLnNlbmREcmF3Q29tbWFuZCgnRlJVU1RVTV9QUk9KRUNUSU9OJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5fbm9kZS5zZW5kRHJhd0NvbW1hbmQodGhpcy5fbmVhcik7XG4gICAgICAgICAgICAgICAgdGhpcy5fbm9kZS5zZW5kRHJhd0NvbW1hbmQodGhpcy5fZmFyKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgQ2FtZXJhLlBJTkhPTEVfUFJPSkVDVElPTjpcbiAgICAgICAgICAgICAgICB0aGlzLl9ub2RlLnNlbmREcmF3Q29tbWFuZCgnUElOSE9MRV9QUk9KRUNUSU9OJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5fbm9kZS5zZW5kRHJhd0NvbW1hbmQodGhpcy5fZm9jYWxEZXB0aCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIENhbWVyYS5PUlRIT0dSQVBISUNfUFJPSkVDVElPTjpcbiAgICAgICAgICAgICAgICB0aGlzLl9ub2RlLnNlbmREcmF3Q29tbWFuZCgnT1JUSE9HUkFQSElDX1BST0pFQ1RJT04nKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0aGlzLl92aWV3RGlydHkpIHtcbiAgICAgICAgdGhpcy5fdmlld0RpcnR5ID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5fbm9kZS5zZW5kRHJhd0NvbW1hbmQoJ0NIQU5HRV9WSUVXX1RSQU5TRk9STScpO1xuICAgICAgICB0aGlzLl9ub2RlLnNlbmREcmF3Q29tbWFuZCh0aGlzLl92aWV3VHJhbnNmb3JtWzBdKTtcbiAgICAgICAgdGhpcy5fbm9kZS5zZW5kRHJhd0NvbW1hbmQodGhpcy5fdmlld1RyYW5zZm9ybVsxXSk7XG4gICAgICAgIHRoaXMuX25vZGUuc2VuZERyYXdDb21tYW5kKHRoaXMuX3ZpZXdUcmFuc2Zvcm1bMl0pO1xuICAgICAgICB0aGlzLl9ub2RlLnNlbmREcmF3Q29tbWFuZCh0aGlzLl92aWV3VHJhbnNmb3JtWzNdKTtcblxuICAgICAgICB0aGlzLl9ub2RlLnNlbmREcmF3Q29tbWFuZCh0aGlzLl92aWV3VHJhbnNmb3JtWzRdKTtcbiAgICAgICAgdGhpcy5fbm9kZS5zZW5kRHJhd0NvbW1hbmQodGhpcy5fdmlld1RyYW5zZm9ybVs1XSk7XG4gICAgICAgIHRoaXMuX25vZGUuc2VuZERyYXdDb21tYW5kKHRoaXMuX3ZpZXdUcmFuc2Zvcm1bNl0pO1xuICAgICAgICB0aGlzLl9ub2RlLnNlbmREcmF3Q29tbWFuZCh0aGlzLl92aWV3VHJhbnNmb3JtWzddKTtcblxuICAgICAgICB0aGlzLl9ub2RlLnNlbmREcmF3Q29tbWFuZCh0aGlzLl92aWV3VHJhbnNmb3JtWzhdKTtcbiAgICAgICAgdGhpcy5fbm9kZS5zZW5kRHJhd0NvbW1hbmQodGhpcy5fdmlld1RyYW5zZm9ybVs5XSk7XG4gICAgICAgIHRoaXMuX25vZGUuc2VuZERyYXdDb21tYW5kKHRoaXMuX3ZpZXdUcmFuc2Zvcm1bMTBdKTtcbiAgICAgICAgdGhpcy5fbm9kZS5zZW5kRHJhd0NvbW1hbmQodGhpcy5fdmlld1RyYW5zZm9ybVsxMV0pO1xuXG4gICAgICAgIHRoaXMuX25vZGUuc2VuZERyYXdDb21tYW5kKHRoaXMuX3ZpZXdUcmFuc2Zvcm1bMTJdKTtcbiAgICAgICAgdGhpcy5fbm9kZS5zZW5kRHJhd0NvbW1hbmQodGhpcy5fdmlld1RyYW5zZm9ybVsxM10pO1xuICAgICAgICB0aGlzLl9ub2RlLnNlbmREcmF3Q29tbWFuZCh0aGlzLl92aWV3VHJhbnNmb3JtWzE0XSk7XG4gICAgICAgIHRoaXMuX25vZGUuc2VuZERyYXdDb21tYW5kKHRoaXMuX3ZpZXdUcmFuc2Zvcm1bMTVdKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIFdoZW4gdGhlIHRyYW5zZm9ybSBvZiB0aGUgbm9kZSB0aGlzIGNvbXBvbmVudCBpcyBhdHRhY2hlZCB0b1xuICogY2hhbmdlcywgaGF2ZSB0aGUgQ2FtZXJhIHVwZGF0ZSBpdHMgcHJvamVjdGlvbiBtYXRyaXggYW5kXG4gKiBpZiBuZWVkZWQsIGZsYWcgdG8gbm9kZSB0byB1cGRhdGUuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IHRyYW5zZm9ybSBhbiBhcnJheSBkZW5vdGluZyB0aGUgdHJhbnNmb3JtIG1hdHJpeCBvZiB0aGUgbm9kZVxuICpcbiAqIEByZXR1cm4ge0NhbWVyYX0gdGhpc1xuICovXG5DYW1lcmEucHJvdG90eXBlLm9uVHJhbnNmb3JtQ2hhbmdlID0gZnVuY3Rpb24gb25UcmFuc2Zvcm1DaGFuZ2UodHJhbnNmb3JtKSB7XG4gICAgdmFyIGEgPSB0cmFuc2Zvcm07XG4gICAgdGhpcy5fdmlld0RpcnR5ID0gdHJ1ZTtcblxuICAgIGlmICghdGhpcy5fcmVxdWVzdGluZ1VwZGF0ZSkge1xuICAgICAgICB0aGlzLl9ub2RlLnJlcXVlc3RVcGRhdGUodGhpcy5faWQpO1xuICAgICAgICB0aGlzLl9yZXF1ZXN0aW5nVXBkYXRlID0gdHJ1ZTtcbiAgICB9XG5cbiAgICB2YXIgYTAwID0gYVswXSwgYTAxID0gYVsxXSwgYTAyID0gYVsyXSwgYTAzID0gYVszXSxcbiAgICBhMTAgPSBhWzRdLCBhMTEgPSBhWzVdLCBhMTIgPSBhWzZdLCBhMTMgPSBhWzddLFxuICAgIGEyMCA9IGFbOF0sIGEyMSA9IGFbOV0sIGEyMiA9IGFbMTBdLCBhMjMgPSBhWzExXSxcbiAgICBhMzAgPSBhWzEyXSwgYTMxID0gYVsxM10sIGEzMiA9IGFbMTRdLCBhMzMgPSBhWzE1XSxcblxuICAgIGIwMCA9IGEwMCAqIGExMSAtIGEwMSAqIGExMCxcbiAgICBiMDEgPSBhMDAgKiBhMTIgLSBhMDIgKiBhMTAsXG4gICAgYjAyID0gYTAwICogYTEzIC0gYTAzICogYTEwLFxuICAgIGIwMyA9IGEwMSAqIGExMiAtIGEwMiAqIGExMSxcbiAgICBiMDQgPSBhMDEgKiBhMTMgLSBhMDMgKiBhMTEsXG4gICAgYjA1ID0gYTAyICogYTEzIC0gYTAzICogYTEyLFxuICAgIGIwNiA9IGEyMCAqIGEzMSAtIGEyMSAqIGEzMCxcbiAgICBiMDcgPSBhMjAgKiBhMzIgLSBhMjIgKiBhMzAsXG4gICAgYjA4ID0gYTIwICogYTMzIC0gYTIzICogYTMwLFxuICAgIGIwOSA9IGEyMSAqIGEzMiAtIGEyMiAqIGEzMSxcbiAgICBiMTAgPSBhMjEgKiBhMzMgLSBhMjMgKiBhMzEsXG4gICAgYjExID0gYTIyICogYTMzIC0gYTIzICogYTMyLFxuXG4gICAgZGV0ID0gMS8oYjAwICogYjExIC0gYjAxICogYjEwICsgYjAyICogYjA5ICsgYjAzICogYjA4IC0gYjA0ICogYjA3ICsgYjA1ICogYjA2KTtcblxuICAgIHRoaXMuX3ZpZXdUcmFuc2Zvcm1bMF0gPSAoYTExICogYjExIC0gYTEyICogYjEwICsgYTEzICogYjA5KSAqIGRldDtcbiAgICB0aGlzLl92aWV3VHJhbnNmb3JtWzFdID0gKGEwMiAqIGIxMCAtIGEwMSAqIGIxMSAtIGEwMyAqIGIwOSkgKiBkZXQ7XG4gICAgdGhpcy5fdmlld1RyYW5zZm9ybVsyXSA9IChhMzEgKiBiMDUgLSBhMzIgKiBiMDQgKyBhMzMgKiBiMDMpICogZGV0O1xuICAgIHRoaXMuX3ZpZXdUcmFuc2Zvcm1bM10gPSAoYTIyICogYjA0IC0gYTIxICogYjA1IC0gYTIzICogYjAzKSAqIGRldDtcbiAgICB0aGlzLl92aWV3VHJhbnNmb3JtWzRdID0gKGExMiAqIGIwOCAtIGExMCAqIGIxMSAtIGExMyAqIGIwNykgKiBkZXQ7XG4gICAgdGhpcy5fdmlld1RyYW5zZm9ybVs1XSA9IChhMDAgKiBiMTEgLSBhMDIgKiBiMDggKyBhMDMgKiBiMDcpICogZGV0O1xuICAgIHRoaXMuX3ZpZXdUcmFuc2Zvcm1bNl0gPSAoYTMyICogYjAyIC0gYTMwICogYjA1IC0gYTMzICogYjAxKSAqIGRldDtcbiAgICB0aGlzLl92aWV3VHJhbnNmb3JtWzddID0gKGEyMCAqIGIwNSAtIGEyMiAqIGIwMiArIGEyMyAqIGIwMSkgKiBkZXQ7XG4gICAgdGhpcy5fdmlld1RyYW5zZm9ybVs4XSA9IChhMTAgKiBiMTAgLSBhMTEgKiBiMDggKyBhMTMgKiBiMDYpICogZGV0O1xuICAgIHRoaXMuX3ZpZXdUcmFuc2Zvcm1bOV0gPSAoYTAxICogYjA4IC0gYTAwICogYjEwIC0gYTAzICogYjA2KSAqIGRldDtcbiAgICB0aGlzLl92aWV3VHJhbnNmb3JtWzEwXSA9IChhMzAgKiBiMDQgLSBhMzEgKiBiMDIgKyBhMzMgKiBiMDApICogZGV0O1xuICAgIHRoaXMuX3ZpZXdUcmFuc2Zvcm1bMTFdID0gKGEyMSAqIGIwMiAtIGEyMCAqIGIwNCAtIGEyMyAqIGIwMCkgKiBkZXQ7XG4gICAgdGhpcy5fdmlld1RyYW5zZm9ybVsxMl0gPSAoYTExICogYjA3IC0gYTEwICogYjA5IC0gYTEyICogYjA2KSAqIGRldDtcbiAgICB0aGlzLl92aWV3VHJhbnNmb3JtWzEzXSA9IChhMDAgKiBiMDkgLSBhMDEgKiBiMDcgKyBhMDIgKiBiMDYpICogZGV0O1xuICAgIHRoaXMuX3ZpZXdUcmFuc2Zvcm1bMTRdID0gKGEzMSAqIGIwMSAtIGEzMCAqIGIwMyAtIGEzMiAqIGIwMCkgKiBkZXQ7XG4gICAgdGhpcy5fdmlld1RyYW5zZm9ybVsxNV0gPSAoYTIwICogYjAzIC0gYTIxICogYjAxICsgYTIyICogYjAwKSAqIGRldDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ2FtZXJhO1xuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIENoYW5uZWxzIGFyZSBiZWluZyB1c2VkIGZvciBpbnRlcmFjdGluZyB3aXRoIHRoZSBVSSBUaHJlYWQgd2hlbiBydW5uaW5nIGluXG4gKiBhIFdlYiBXb3JrZXIgb3Igd2l0aCB0aGUgVUlNYW5hZ2VyLyBDb21wb3NpdG9yIHdoZW4gcnVubmluZyBpbiBzaW5nbGVcbiAqIHRocmVhZGVkIG1vZGUgKG5vIFdlYiBXb3JrZXIpLlxuICpcbiAqIEBjbGFzcyBDaGFubmVsXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gQ2hhbm5lbCgpIHtcbiAgICBpZiAodHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnICYmIHNlbGYud2luZG93ICE9PSBzZWxmKSB7XG4gICAgICAgIHRoaXMuX2VudGVyV29ya2VyTW9kZSgpO1xuICAgIH1cbn1cblxuXG4vKipcbiAqIENhbGxlZCBkdXJpbmcgY29uc3RydWN0aW9uLiBTdWJzY3JpYmVzIGZvciBgbWVzc2FnZWAgZXZlbnQgYW5kIHJvdXRlcyBhbGxcbiAqIGZ1dHVyZSBgc2VuZE1lc3NhZ2VgIG1lc3NhZ2VzIHRvIHRoZSBNYWluIFRocmVhZCAoXCJVSSBUaHJlYWRcIikuXG4gKlxuICogUHJpbWFyaWx5IHVzZWQgZm9yIHRlc3RpbmcuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkNoYW5uZWwucHJvdG90eXBlLl9lbnRlcldvcmtlck1vZGUgPSBmdW5jdGlvbiBfZW50ZXJXb3JrZXJNb2RlKCkge1xuICAgIHRoaXMuX3dvcmtlck1vZGUgPSB0cnVlO1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgc2VsZi5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24gb25tZXNzYWdlKGV2KSB7XG4gICAgICAgIF90aGlzLm9uTWVzc2FnZShldi5kYXRhKTtcbiAgICB9KTtcbn07XG5cbi8qKlxuICogTWVhbnQgdG8gYmUgb3ZlcnJpZGRlbiBieSBgRmFtb3VzYC5cbiAqIEFzc2lnbmVkIG1ldGhvZCB3aWxsIGJlIGludm9rZWQgZm9yIGV2ZXJ5IHJlY2VpdmVkIG1lc3NhZ2UuXG4gKlxuICogQHR5cGUge0Z1bmN0aW9ufVxuICogQG92ZXJyaWRlXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuQ2hhbm5lbC5wcm90b3R5cGUub25NZXNzYWdlID0gbnVsbDtcblxuLyoqXG4gKiBTZW5kcyBhIG1lc3NhZ2UgdG8gdGhlIFVJTWFuYWdlci5cbiAqXG4gKiBAcGFyYW0gIHtBbnl9ICAgIG1lc3NhZ2UgQXJiaXRyYXJ5IG1lc3NhZ2Ugb2JqZWN0LlxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkNoYW5uZWwucHJvdG90eXBlLnNlbmRNZXNzYWdlID0gZnVuY3Rpb24gc2VuZE1lc3NhZ2UgKG1lc3NhZ2UpIHtcbiAgICBpZiAodGhpcy5fd29ya2VyTW9kZSkge1xuICAgICAgICBzZWxmLnBvc3RNZXNzYWdlKG1lc3NhZ2UpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdGhpcy5vbm1lc3NhZ2UobWVzc2FnZSk7XG4gICAgfVxufTtcblxuLyoqXG4gKiBNZWFudCB0byBiZSBvdmVycmlkZW4gYnkgdGhlIFVJTWFuYWdlciB3aGVuIHJ1bm5pbmcgaW4gdGhlIFVJIFRocmVhZC5cbiAqIFVzZWQgZm9yIHByZXNlcnZpbmcgQVBJIGNvbXBhdGliaWxpdHkgd2l0aCBXZWIgV29ya2Vycy5cbiAqIFdoZW4gcnVubmluZyBpbiBXZWIgV29ya2VyIG1vZGUsIHRoaXMgcHJvcGVydHkgd29uJ3QgYmUgbXV0YXRlZC5cbiAqXG4gKiBBc3NpZ25lZCBtZXRob2Qgd2lsbCBiZSBpbnZva2VkIGZvciBldmVyeSBtZXNzYWdlIHBvc3RlZCBieSBgZmFtb3VzLWNvcmVgLlxuICpcbiAqIEB0eXBlIHtGdW5jdGlvbn1cbiAqIEBvdmVycmlkZVxuICovXG5DaGFubmVsLnByb3RvdHlwZS5vbm1lc3NhZ2UgPSBudWxsO1xuXG4vKipcbiAqIFNlbmRzIGEgbWVzc2FnZSB0byB0aGUgbWFuYWdlciBvZiB0aGlzIGNoYW5uZWwgKHRoZSBgRmFtb3VzYCBzaW5nbGV0b24pIGJ5XG4gKiBpbnZva2luZyBgb25NZXNzYWdlYC5cbiAqIFVzZWQgZm9yIHByZXNlcnZpbmcgQVBJIGNvbXBhdGliaWxpdHkgd2l0aCBXZWIgV29ya2Vycy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQGFsaWFzIG9uTWVzc2FnZVxuICpcbiAqIEBwYXJhbSB7QW55fSBtZXNzYWdlIGEgbWVzc2FnZSB0byBzZW5kIG92ZXIgdGhlIGNoYW5uZWxcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5DaGFubmVsLnByb3RvdHlwZS5wb3N0TWVzc2FnZSA9IGZ1bmN0aW9uIHBvc3RNZXNzYWdlKG1lc3NhZ2UpIHtcbiAgICByZXR1cm4gdGhpcy5vbk1lc3NhZ2UobWVzc2FnZSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENoYW5uZWw7XG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBGYW1vdXMgSW5kdXN0cmllcyBJbmMuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogRXF1aXZhbGVudCBvZiBhbiBFbmdpbmUgaW4gdGhlIFdvcmtlciBUaHJlYWQuIFVzZWQgdG8gc3luY2hyb25pemUgYW5kIG1hbmFnZVxuICogdGltZSBhY3Jvc3MgZGlmZmVyZW50IFRocmVhZHMuXG4gKlxuICogQGNsYXNzICBDbG9ja1xuICogQGNvbnN0cnVjdG9yXG4gKiBAcHJpdmF0ZVxuICovXG5mdW5jdGlvbiBDbG9jayAoKSB7XG4gICAgdGhpcy5fdGltZSA9IDA7XG4gICAgdGhpcy5fZnJhbWUgPSAwO1xuICAgIHRoaXMuX3RpbWVyUXVldWUgPSBbXTtcbiAgICB0aGlzLl91cGRhdGluZ0luZGV4ID0gMDtcblxuICAgIHRoaXMuX3NjYWxlID0gMTtcbiAgICB0aGlzLl9zY2FsZWRUaW1lID0gdGhpcy5fdGltZTtcbn1cblxuLyoqXG4gKiBTZXRzIHRoZSBzY2FsZSBhdCB3aGljaCB0aGUgY2xvY2sgdGltZSBpcyBwYXNzaW5nLlxuICogVXNlZnVsIGZvciBzbG93LW1vdGlvbiBvciBmYXN0LWZvcndhcmQgZWZmZWN0cy5cbiAqXG4gKiBgMWAgbWVhbnMgbm8gdGltZSBzY2FsaW5nIChcInJlYWx0aW1lXCIpLFxuICogYDJgIG1lYW5zIHRoZSBjbG9jayB0aW1lIGlzIHBhc3NpbmcgdHdpY2UgYXMgZmFzdCxcbiAqIGAwLjVgIG1lYW5zIHRoZSBjbG9jayB0aW1lIGlzIHBhc3NpbmcgdHdvIHRpbWVzIHNsb3dlciB0aGFuIHRoZSBcImFjdHVhbFwiXG4gKiB0aW1lIGF0IHdoaWNoIHRoZSBDbG9jayBpcyBiZWluZyB1cGRhdGVkIHZpYSBgLnN0ZXBgLlxuICpcbiAqIEluaXRhbGx5IHRoZSBjbG9jayB0aW1lIGlzIG5vdCBiZWluZyBzY2FsZWQgKGZhY3RvciBgMWApLlxuICpcbiAqIEBtZXRob2QgIHNldFNjYWxlXG4gKiBAY2hhaW5hYmxlXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHNjYWxlICAgIFRoZSBzY2FsZSBhdCB3aGljaCB0aGUgY2xvY2sgdGltZSBpcyBwYXNzaW5nLlxuICpcbiAqIEByZXR1cm4ge0Nsb2NrfSB0aGlzXG4gKi9cbkNsb2NrLnByb3RvdHlwZS5zZXRTY2FsZSA9IGZ1bmN0aW9uIHNldFNjYWxlIChzY2FsZSkge1xuICAgIHRoaXMuX3NjYWxlID0gc2NhbGU7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEBtZXRob2QgIGdldFNjYWxlXG4gKlxuICogQHJldHVybiB7TnVtYmVyfSBzY2FsZSAgICBUaGUgc2NhbGUgYXQgd2hpY2ggdGhlIGNsb2NrIHRpbWUgaXMgcGFzc2luZy5cbiAqL1xuQ2xvY2sucHJvdG90eXBlLmdldFNjYWxlID0gZnVuY3Rpb24gZ2V0U2NhbGUgKCkge1xuICAgIHJldHVybiB0aGlzLl9zY2FsZTtcbn07XG5cbi8qKlxuICogVXBkYXRlcyB0aGUgaW50ZXJuYWwgY2xvY2sgdGltZS5cbiAqXG4gKiBAbWV0aG9kICBzdGVwXG4gKiBAY2hhaW5hYmxlXG4gKlxuICogQHBhcmFtICB7TnVtYmVyfSB0aW1lIGhpZ2ggcmVzb2x1dGlvbiB0aW1lc3RhbXAgdXNlZCBmb3IgaW52b2tpbmcgdGhlXG4gKiAgICAgICAgICAgICAgICAgICAgICAgYHVwZGF0ZWAgbWV0aG9kIG9uIGFsbCByZWdpc3RlcmVkIG9iamVjdHNcbiAqIEByZXR1cm4ge0Nsb2NrfSAgICAgICB0aGlzXG4gKi9cbkNsb2NrLnByb3RvdHlwZS5zdGVwID0gZnVuY3Rpb24gc3RlcCAodGltZSkge1xuICAgIHRoaXMuX2ZyYW1lKys7XG5cbiAgICB0aGlzLl9zY2FsZWRUaW1lID0gdGhpcy5fc2NhbGVkVGltZSArICh0aW1lIC0gdGhpcy5fdGltZSkqdGhpcy5fc2NhbGU7XG4gICAgdGhpcy5fdGltZSA9IHRpbWU7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX3RpbWVyUXVldWUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHRoaXMuX3RpbWVyUXVldWVbaV0odGhpcy5fc2NhbGVkVGltZSkpIHtcbiAgICAgICAgICAgIHRoaXMuX3RpbWVyUXVldWUuc3BsaWNlKGksIDEpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBpbnRlcm5hbCBjbG9jayB0aW1lLlxuICpcbiAqIEBtZXRob2QgIG5vd1xuICpcbiAqIEByZXR1cm4gIHtOdW1iZXJ9IHRpbWUgaGlnaCByZXNvbHV0aW9uIHRpbWVzdGFtcCB1c2VkIGZvciBpbnZva2luZyB0aGVcbiAqICAgICAgICAgICAgICAgICAgICAgICBgdXBkYXRlYCBtZXRob2Qgb24gYWxsIHJlZ2lzdGVyZWQgb2JqZWN0c1xuICovXG5DbG9jay5wcm90b3R5cGUubm93ID0gZnVuY3Rpb24gbm93ICgpIHtcbiAgICByZXR1cm4gdGhpcy5fc2NhbGVkVGltZTtcbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgaW50ZXJuYWwgY2xvY2sgdGltZS5cbiAqXG4gKiBAbWV0aG9kICBnZXRUaW1lXG4gKiBAZGVwcmVjYXRlZCBVc2UgI25vdyBpbnN0ZWFkXG4gKlxuICogQHJldHVybiAge051bWJlcn0gdGltZSBoaWdoIHJlc29sdXRpb24gdGltZXN0YW1wIHVzZWQgZm9yIGludm9raW5nIHRoZVxuICogICAgICAgICAgICAgICAgICAgICAgIGB1cGRhdGVgIG1ldGhvZCBvbiBhbGwgcmVnaXN0ZXJlZCBvYmplY3RzXG4gKi9cbkNsb2NrLnByb3RvdHlwZS5nZXRUaW1lID0gQ2xvY2sucHJvdG90eXBlLm5vdztcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBudW1iZXIgb2YgZnJhbWVzIGVsYXBzZWQgc28gZmFyLlxuICpcbiAqIEBtZXRob2QgZ2V0RnJhbWVcbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IGZyYW1lc1xuICovXG5DbG9jay5wcm90b3R5cGUuZ2V0RnJhbWUgPSBmdW5jdGlvbiBnZXRGcmFtZSAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2ZyYW1lO1xufTtcblxuLyoqXG4gKiBXcmFwcyBhIGZ1bmN0aW9uIHRvIGJlIGludm9rZWQgYWZ0ZXIgYSBjZXJ0YWluIGFtb3VudCBvZiB0aW1lLlxuICogQWZ0ZXIgYSBzZXQgZHVyYXRpb24gaGFzIHBhc3NlZCwgaXQgZXhlY3V0ZXMgdGhlIGZ1bmN0aW9uIGFuZFxuICogcmVtb3ZlcyBpdCBhcyBhIGxpc3RlbmVyIHRvICdwcmVyZW5kZXInLlxuICpcbiAqIEBtZXRob2Qgc2V0VGltZW91dFxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGJlIHJ1biBhZnRlciBhIHNwZWNpZmllZCBkdXJhdGlvblxuICogQHBhcmFtIHtOdW1iZXJ9IGRlbGF5IG1pbGxpc2Vjb25kcyBmcm9tIG5vdyB0byBleGVjdXRlIHRoZSBmdW5jdGlvblxuICpcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufSB0aW1lciBmdW5jdGlvbiB1c2VkIGZvciBDbG9jayNjbGVhclRpbWVyXG4gKi9cbkNsb2NrLnByb3RvdHlwZS5zZXRUaW1lb3V0ID0gZnVuY3Rpb24gKGNhbGxiYWNrLCBkZWxheSkge1xuICAgIHZhciBwYXJhbXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICAgIHZhciBzdGFydGVkQXQgPSB0aGlzLl90aW1lO1xuICAgIHZhciB0aW1lciA9IGZ1bmN0aW9uKHRpbWUpIHtcbiAgICAgICAgaWYgKHRpbWUgLSBzdGFydGVkQXQgPj0gZGVsYXkpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KG51bGwsIHBhcmFtcyk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcbiAgICB0aGlzLl90aW1lclF1ZXVlLnB1c2godGltZXIpO1xuICAgIHJldHVybiB0aW1lcjtcbn07XG5cblxuLyoqXG4gKiBXcmFwcyBhIGZ1bmN0aW9uIHRvIGJlIGludm9rZWQgYWZ0ZXIgYSBjZXJ0YWluIGFtb3VudCBvZiB0aW1lLlxuICogIEFmdGVyIGEgc2V0IGR1cmF0aW9uIGhhcyBwYXNzZWQsIGl0IGV4ZWN1dGVzIHRoZSBmdW5jdGlvbiBhbmRcbiAqICByZXNldHMgdGhlIGV4ZWN1dGlvbiB0aW1lLlxuICpcbiAqIEBtZXRob2Qgc2V0SW50ZXJ2YWxcbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBmdW5jdGlvbiB0byBiZSBydW4gYWZ0ZXIgYSBzcGVjaWZpZWQgZHVyYXRpb25cbiAqIEBwYXJhbSB7TnVtYmVyfSBkZWxheSBpbnRlcnZhbCB0byBleGVjdXRlIGZ1bmN0aW9uIGluIG1pbGxpc2Vjb25kc1xuICpcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufSB0aW1lciBmdW5jdGlvbiB1c2VkIGZvciBDbG9jayNjbGVhclRpbWVyXG4gKi9cbkNsb2NrLnByb3RvdHlwZS5zZXRJbnRlcnZhbCA9IGZ1bmN0aW9uIHNldEludGVydmFsKGNhbGxiYWNrLCBkZWxheSkge1xuICAgIHZhciBwYXJhbXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpO1xuICAgIHZhciBzdGFydGVkQXQgPSB0aGlzLl90aW1lO1xuICAgIHZhciB0aW1lciA9IGZ1bmN0aW9uKHRpbWUpIHtcbiAgICAgICAgaWYgKHRpbWUgLSBzdGFydGVkQXQgPj0gZGVsYXkpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrLmFwcGx5KG51bGwsIHBhcmFtcyk7XG4gICAgICAgICAgICBzdGFydGVkQXQgPSB0aW1lO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xuICAgIHRoaXMuX3RpbWVyUXVldWUucHVzaCh0aW1lcik7XG4gICAgcmV0dXJuIHRpbWVyO1xufTtcblxuLyoqXG4gKiBSZW1vdmVzIHByZXZpb3VzbHkgdmlhIGBDbG9jayNzZXRUaW1lb3V0YCBvciBgQ2xvY2sjc2V0SW50ZXJ2YWxgXG4gKiByZWdpc3RlcmVkIGNhbGxiYWNrIGZ1bmN0aW9uXG4gKlxuICogQG1ldGhvZCBjbGVhclRpbWVyXG4gKiBAY2hhaW5hYmxlXG4gKlxuICogQHBhcmFtICB7RnVuY3Rpb259IHRpbWVyICBwcmV2aW91c2x5IGJ5IGBDbG9jayNzZXRUaW1lb3V0YCBvclxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICBgQ2xvY2sjc2V0SW50ZXJ2YWxgIHJldHVybmVkIGNhbGxiYWNrIGZ1bmN0aW9uXG4gKiBAcmV0dXJuIHtDbG9ja30gICAgICAgICAgICAgIHRoaXNcbiAqL1xuQ2xvY2sucHJvdG90eXBlLmNsZWFyVGltZXIgPSBmdW5jdGlvbiAodGltZXIpIHtcbiAgICB2YXIgaW5kZXggPSB0aGlzLl90aW1lclF1ZXVlLmluZGV4T2YodGltZXIpO1xuICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgdGhpcy5fdGltZXJRdWV1ZS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ2xvY2s7XG5cbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbi8qanNoaW50IC1XMDc5ICovXG5cbid1c2Ugc3RyaWN0JztcblxuLy8gVE9ETzogRGlzcGF0Y2ggc2hvdWxkIGJlIGdlbmVyYWxpemVkIHNvIHRoYXQgaXQgY2FuIHdvcmsgb24gYW55IE5vZGVcbi8vIG5vdCBqdXN0IENvbnRleHRzLlxuXG52YXIgRXZlbnQgPSByZXF1aXJlKCcuL0V2ZW50Jyk7XG5cbi8qKlxuICogVGhlIERpc3BhdGNoIGNsYXNzIGlzIHVzZWQgdG8gcHJvcG9nYXRlIGV2ZW50cyBkb3duIHRoZVxuICogc2NlbmUgZ3JhcGguXG4gKlxuICogQGNsYXNzIERpc3BhdGNoXG4gKiBAcGFyYW0ge1NjZW5lfSBjb250ZXh0IFRoZSBjb250ZXh0IG9uIHdoaWNoIGl0IG9wZXJhdGVzXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gRGlzcGF0Y2ggKGNvbnRleHQpIHtcblxuICAgIGlmICghY29udGV4dCkgdGhyb3cgbmV3IEVycm9yKCdEaXNwYXRjaCBuZWVkcyB0byBiZSBpbnN0YW50aWF0ZWQgb24gYSBub2RlJyk7XG5cbiAgICB0aGlzLl9jb250ZXh0ID0gY29udGV4dDsgLy8gQSByZWZlcmVuY2UgdG8gdGhlIGNvbnRleHRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gb24gd2hpY2ggdGhlIGRpc3BhdGNoZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gb3BlcmF0ZXNcblxuICAgIHRoaXMuX3F1ZXVlID0gW107IC8vIFRoZSBxdWV1ZSBpcyB1c2VkIGZvciB0d28gcHVycG9zZXNcbiAgICAgICAgICAgICAgICAgICAgICAvLyAxLiBJdCBpcyB1c2VkIHRvIGxpc3QgaW5kaWNpZXMgaW4gdGhlXG4gICAgICAgICAgICAgICAgICAgICAgLy8gICAgTm9kZXMgcGF0aCB3aGljaCBhcmUgdGhlbiB1c2VkIHRvIGxvb2t1cFxuICAgICAgICAgICAgICAgICAgICAgIC8vICAgIGEgbm9kZSBpbiB0aGUgc2NlbmUgZ3JhcGguXG4gICAgICAgICAgICAgICAgICAgICAgLy8gMi4gSXQgaXMgdXNlZCB0byBhc3Npc3QgZGlzcGF0Y2hpbmdcbiAgICAgICAgICAgICAgICAgICAgICAvLyAgICBzdWNoIHRoYXQgaXQgaXMgcG9zc2libGUgdG8gZG8gYSBicmVhZHRoIGZpcnN0XG4gICAgICAgICAgICAgICAgICAgICAgLy8gICAgdHJhdmVyc2FsIG9mIHRoZSBzY2VuZSBncmFwaC5cbn1cblxuLyoqXG4gKiBsb29rdXBOb2RlIHRha2VzIGEgcGF0aCBhbmQgcmV0dXJucyB0aGUgbm9kZSBhdCB0aGUgbG9jYXRpb24gc3BlY2lmaWVkXG4gKiBieSB0aGUgcGF0aCwgaWYgb25lIGV4aXN0cy4gSWYgbm90LCBpdCByZXR1cm5zIHVuZGVmaW5lZC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbG9jYXRpb24gVGhlIGxvY2F0aW9uIG9mIHRoZSBub2RlIHNwZWNpZmllZCBieSBpdHMgcGF0aFxuICpcbiAqIEByZXR1cm4ge05vZGUgfCB1bmRlZmluZWR9IFRoZSBub2RlIGF0IHRoZSByZXF1ZXN0ZWQgcGF0aFxuICovXG5EaXNwYXRjaC5wcm90b3R5cGUubG9va3VwTm9kZSA9IGZ1bmN0aW9uIGxvb2t1cE5vZGUgKGxvY2F0aW9uKSB7XG4gICAgaWYgKCFsb2NhdGlvbikgdGhyb3cgbmV3IEVycm9yKCdsb29rdXBOb2RlIG11c3QgYmUgY2FsbGVkIHdpdGggYSBwYXRoJyk7XG5cbiAgICB2YXIgcGF0aCA9IHRoaXMuX3F1ZXVlO1xuXG4gICAgX3NwbGl0VG8obG9jYXRpb24sIHBhdGgpO1xuXG4gICAgaWYgKHBhdGhbMF0gIT09IHRoaXMuX2NvbnRleHQuZ2V0U2VsZWN0b3IoKSkgcmV0dXJuIHZvaWQgMDtcblxuICAgIHZhciBjaGlsZHJlbiA9IHRoaXMuX2NvbnRleHQuZ2V0Q2hpbGRyZW4oKTtcbiAgICB2YXIgY2hpbGQ7XG4gICAgdmFyIGkgPSAxO1xuICAgIHBhdGhbMF0gPSB0aGlzLl9jb250ZXh0O1xuXG4gICAgd2hpbGUgKGkgPCBwYXRoLmxlbmd0aCkge1xuICAgICAgICBjaGlsZCA9IGNoaWxkcmVuW3BhdGhbaV1dO1xuICAgICAgICBwYXRoW2ldID0gY2hpbGQ7XG4gICAgICAgIGlmIChjaGlsZCkgY2hpbGRyZW4gPSBjaGlsZC5nZXRDaGlsZHJlbigpO1xuICAgICAgICBlbHNlIHJldHVybiB2b2lkIDA7XG4gICAgICAgIGkrKztcbiAgICB9XG5cbiAgICByZXR1cm4gY2hpbGQ7XG59O1xuXG4vKipcbiAqIGRpc3BhdGNoIHRha2VzIGFuIGV2ZW50IG5hbWUgYW5kIGEgcGF5bG9hZCBhbmQgZGlzcGF0Y2hlcyBpdCB0byB0aGVcbiAqIGVudGlyZSBzY2VuZSBncmFwaCBiZWxvdyB0aGUgbm9kZSB0aGF0IHRoZSBkaXNwYXRjaGVyIGlzIG9uLiBUaGUgbm9kZXNcbiAqIHJlY2VpdmUgdGhlIGV2ZW50cyBpbiBhIGJyZWFkdGggZmlyc3QgdHJhdmVyc2FsLCBtZWFuaW5nIHRoYXQgcGFyZW50c1xuICogaGF2ZSB0aGUgb3Bwb3J0dW5pdHkgdG8gcmVhY3QgdG8gdGhlIGV2ZW50IGJlZm9yZSBjaGlsZHJlbi5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgbmFtZSBvZiB0aGUgZXZlbnRcbiAqIEBwYXJhbSB7QW55fSBwYXlsb2FkIHRoZSBldmVudCBwYXlsb2FkXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuRGlzcGF0Y2gucHJvdG90eXBlLmRpc3BhdGNoID0gZnVuY3Rpb24gZGlzcGF0Y2ggKGV2ZW50LCBwYXlsb2FkKSB7XG4gICAgaWYgKCFldmVudCkgdGhyb3cgbmV3IEVycm9yKCdkaXNwYXRjaCByZXF1aXJlcyBhbiBldmVudCBuYW1lIGFzIGl0XFwncyBmaXJzdCBhcmd1bWVudCcpO1xuXG4gICAgdmFyIHF1ZXVlID0gdGhpcy5fcXVldWU7XG4gICAgdmFyIGl0ZW07XG4gICAgdmFyIGk7XG4gICAgdmFyIGxlbjtcbiAgICB2YXIgY2hpbGRyZW47XG5cbiAgICBxdWV1ZS5sZW5ndGggPSAwO1xuICAgIHF1ZXVlLnB1c2godGhpcy5fY29udGV4dCk7XG5cbiAgICB3aGlsZSAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGl0ZW0gPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICBpZiAoaXRlbS5vblJlY2VpdmUpIGl0ZW0ub25SZWNlaXZlKGV2ZW50LCBwYXlsb2FkKTtcbiAgICAgICAgY2hpbGRyZW4gPSBpdGVtLmdldENoaWxkcmVuKCk7XG4gICAgICAgIGZvciAoaSA9IDAsIGxlbiA9IGNoaWxkcmVuLmxlbmd0aCA7IGkgPCBsZW4gOyBpKyspIHF1ZXVlLnB1c2goY2hpbGRyZW5baV0pO1xuICAgIH1cbn07XG5cbi8qKlxuICogZGlzcGF0Y2hVSWV2ZW50IHRha2VzIGEgcGF0aCwgYW4gZXZlbnQgbmFtZSwgYW5kIGEgcGF5bG9hZCBhbmQgZGlzcGF0Y2hlcyB0aGVtIGluXG4gKiBhIG1hbm5lciBhbm9sb2dvdXMgdG8gRE9NIGJ1YmJsaW5nLiBJdCBmaXJzdCB0cmF2ZXJzZXMgZG93biB0byB0aGUgbm9kZSBzcGVjaWZpZWQgYXRcbiAqIHRoZSBwYXRoLiBUaGF0IG5vZGUgcmVjZWl2ZXMgdGhlIGV2ZW50IGZpcnN0LCBhbmQgdGhlbiBldmVyeSBhbmNlc3RvciByZWNlaXZlcyB0aGUgZXZlbnRcbiAqIHVudGlsIHRoZSBjb250ZXh0LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIHRoZSBwYXRoIG9mIHRoZSBub2RlXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgdGhlIGV2ZW50IG5hbWVcbiAqIEBwYXJhbSB7QW55fSBwYXlsb2FkIHRoZSBwYXlsb2FkXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuRGlzcGF0Y2gucHJvdG90eXBlLmRpc3BhdGNoVUlFdmVudCA9IGZ1bmN0aW9uIGRpc3BhdGNoVUlFdmVudCAocGF0aCwgZXZlbnQsIHBheWxvYWQpIHtcbiAgICBpZiAoIXBhdGgpIHRocm93IG5ldyBFcnJvcignZGlzcGF0Y2hVSUV2ZW50IG5lZWRzIGEgdmFsaWQgcGF0aCB0byBkaXNwYXRjaCB0bycpO1xuICAgIGlmICghZXZlbnQpIHRocm93IG5ldyBFcnJvcignZGlzcGF0Y2hVSUV2ZW50IG5lZWRzIGFuIGV2ZW50IG5hbWUgYXMgaXRzIHNlY29uZCBhcmd1bWVudCcpO1xuXG4gICAgdmFyIHF1ZXVlID0gdGhpcy5fcXVldWU7XG4gICAgdmFyIG5vZGU7XG5cbiAgICBFdmVudC5jYWxsKHBheWxvYWQpO1xuICAgIHBheWxvYWQubm9kZSA9IHRoaXMubG9va3VwTm9kZShwYXRoKTsgLy8gQWZ0ZXIgdGhpcyBjYWxsLCB0aGUgcGF0aCBpcyBsb2FkZWQgaW50byB0aGUgcXVldWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIChsb29rVXAgbm9kZSBkb2Vzbid0IGNsZWFyIHRoZSBxdWV1ZSBhZnRlciB0aGUgbG9va3VwKVxuXG4gICAgd2hpbGUgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBub2RlID0gcXVldWUucG9wKCk7IC8vIHBvcCBub2RlcyBvZmYgb2YgdGhlIHF1ZXVlIHRvIG1vdmUgdXAgdGhlIGFuY2VzdG9yIGNoYWluLlxuICAgICAgICBpZiAobm9kZS5vblJlY2VpdmUpIG5vZGUub25SZWNlaXZlKGV2ZW50LCBwYXlsb2FkKTtcbiAgICAgICAgaWYgKHBheWxvYWQucHJvcGFnYXRpb25TdG9wcGVkKSBicmVhaztcbiAgICB9XG59O1xuXG4vKipcbiAqIF9zcGxpdFRvIGlzIGEgcHJpdmF0ZSBtZXRob2Qgd2hpY2ggdGFrZXMgYSBwYXRoIGFuZCBzcGxpdHMgaXQgYXQgZXZlcnkgJy8nXG4gKiBwdXNoaW5nIHRoZSByZXN1bHQgaW50byB0aGUgc3VwcGxpZWQgYXJyYXkuIFRoaXMgaXMgYSBkZXN0cnVjdGl2ZSBjaGFuZ2UuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJpbmcgdGhlIHNwZWNpZmllZCBwYXRoXG4gKiBAcGFyYW0ge0FycmF5fSB0YXJnZXQgdGhlIGFycmF5IHRvIHdoaWNoIHRoZSByZXN1bHQgc2hvdWxkIGJlIHdyaXR0ZW5cbiAqXG4gKiBAcmV0dXJuIHtBcnJheX0gdGhlIHRhcmdldCBhZnRlciBoYXZpbmcgYmVlbiB3cml0dGVuIHRvXG4gKi9cbmZ1bmN0aW9uIF9zcGxpdFRvIChzdHJpbmcsIHRhcmdldCkge1xuICAgIHRhcmdldC5sZW5ndGggPSAwOyAvLyBjbGVhcnMgdGhlIGFycmF5IGZpcnN0LlxuICAgIHZhciBsYXN0ID0gMDtcbiAgICB2YXIgaTtcbiAgICB2YXIgbGVuID0gc3RyaW5nLmxlbmd0aDtcblxuICAgIGZvciAoaSA9IDAgOyBpIDwgbGVuIDsgaSsrKSB7XG4gICAgICAgIGlmIChzdHJpbmdbaV0gPT09ICcvJykge1xuICAgICAgICAgICAgdGFyZ2V0LnB1c2goc3RyaW5nLnN1YnN0cmluZyhsYXN0LCBpKSk7XG4gICAgICAgICAgICBsYXN0ID0gaSArIDE7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoaSAtIGxhc3QgPiAwKSB0YXJnZXQucHVzaChzdHJpbmcuc3Vic3RyaW5nKGxhc3QsIGkpKTtcblxuICAgIHJldHVybiB0YXJnZXQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gRGlzcGF0Y2g7XG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICogXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICogXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKiBcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqIFxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIFRoZSBFdmVudCBjbGFzcyBhZGRzIHRoZSBzdG9wUHJvcGFnYXRpb24gZnVuY3Rpb25hbGl0eVxuICogdG8gdGhlIFVJRXZlbnRzIHdpdGhpbiB0aGUgc2NlbmUgZ3JhcGguXG4gKlxuICogQGNvbnN0cnVjdG9yIEV2ZW50XG4gKi9cbmZ1bmN0aW9uIEV2ZW50ICgpIHtcbiAgICB0aGlzLnByb3BhZ2F0aW9uU3RvcHBlZCA9IGZhbHNlO1xuICAgIHRoaXMuc3RvcFByb3BhZ2F0aW9uID0gc3RvcFByb3BhZ2F0aW9uO1xufVxuXG4vKipcbiAqIHN0b3BQcm9wYWdhdGlvbiBlbmRzIHRoZSBidWJibGluZyBvZiB0aGUgZXZlbnQgaW4gdGhlXG4gKiBzY2VuZSBncmFwaC5cbiAqXG4gKiBAbWV0aG9kIHN0b3BQcm9wYWdhdGlvblxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbmZ1bmN0aW9uIHN0b3BQcm9wYWdhdGlvbiAoKSB7XG4gICAgdGhpcy5wcm9wYWdhdGlvblN0b3BwZWQgPSB0cnVlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEV2ZW50O1xuXG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICogXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICogXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKiBcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqIFxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQ2xvY2sgPSByZXF1aXJlKCcuL0Nsb2NrJyk7XG52YXIgU2NlbmUgPSByZXF1aXJlKCcuL1NjZW5lJyk7XG52YXIgQ2hhbm5lbCA9IHJlcXVpcmUoJy4vQ2hhbm5lbCcpO1xudmFyIFVJTWFuYWdlciA9IHJlcXVpcmUoJy4uL3JlbmRlcmVycy9VSU1hbmFnZXInKTtcbnZhciBDb21wb3NpdG9yID0gcmVxdWlyZSgnLi4vcmVuZGVyZXJzL0NvbXBvc2l0b3InKTtcbnZhciBSZXF1ZXN0QW5pbWF0aW9uRnJhbWVMb29wID0gcmVxdWlyZSgnLi4vcmVuZGVyLWxvb3BzL1JlcXVlc3RBbmltYXRpb25GcmFtZUxvb3AnKTtcblxudmFyIEVOR0lORV9TVEFSVCA9IFsnRU5HSU5FJywgJ1NUQVJUJ107XG52YXIgRU5HSU5FX1NUT1AgPSBbJ0VOR0lORScsICdTVE9QJ107XG52YXIgVElNRV9VUERBVEUgPSBbJ1RJTUUnLCBudWxsXTtcblxuLyoqXG4gKiBGYW1vdXMgaGFzIHR3byByZXNwb25zaWJpbGl0aWVzLCBvbmUgdG8gYWN0IGFzIHRoZSBoaWdoZXN0IGxldmVsXG4gKiB1cGRhdGVyIGFuZCBhbm90aGVyIHRvIHNlbmQgbWVzc2FnZXMgb3ZlciB0byB0aGUgcmVuZGVyZXJzLiBJdCBpc1xuICogYSBzaW5nbGV0b24uXG4gKlxuICogQGNsYXNzIEZhbW91c0VuZ2luZVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIEZhbW91c0VuZ2luZSgpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgdGhpcy5fdXBkYXRlUXVldWUgPSBbXTsgLy8gVGhlIHVwZGF0ZVF1ZXVlIGlzIGEgcGxhY2Ugd2hlcmUgbm9kZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjYW4gcGxhY2UgdGhlbXNlbHZlcyBpbiBvcmRlciB0byBiZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHVwZGF0ZWQgb24gdGhlIGZyYW1lLlxuXG4gICAgdGhpcy5fbmV4dFVwZGF0ZVF1ZXVlID0gW107IC8vIHRoZSBuZXh0VXBkYXRlUXVldWUgaXMgdXNlZCB0byBxdWV1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB1cGRhdGVzIGZvciB0aGUgbmV4dCB0aWNrLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGlzIHByZXZlbnRzIGluZmluaXRlIGxvb3BzIHdoZXJlIGR1cmluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBhbiB1cGRhdGUgYSBub2RlIGNvbnRpbnVvdXNseSBwdXRzIGl0c2VsZlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBiYWNrIGluIHRoZSB1cGRhdGUgcXVldWUuXG5cbiAgICB0aGlzLl9zY2VuZXMgPSB7fTsgLy8gYSBoYXNoIG9mIGFsbCBvZiB0aGUgc2NlbmVzJ3MgdGhhdCB0aGUgRmFtb3VzRW5naW5lXG4gICAgICAgICAgICAgICAgICAgICAgICAgLy8gaXMgcmVzcG9uc2libGUgZm9yLlxuXG4gICAgdGhpcy5fbWVzc2FnZXMgPSBUSU1FX1VQREFURTsgICAvLyBhIHF1ZXVlIG9mIGFsbCBvZiB0aGUgZHJhdyBjb21tYW5kcyB0b1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2VuZCB0byB0aGUgdGhlIHJlbmRlcmVycyB0aGlzIGZyYW1lLlxuXG4gICAgdGhpcy5faW5VcGRhdGUgPSBmYWxzZTsgLy8gd2hlbiB0aGUgZmFtb3VzIGlzIHVwZGF0aW5nIHRoaXMgaXMgdHJ1ZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBhbGwgcmVxdWVzdHMgZm9yIHVwZGF0ZXMgd2lsbCBnZXQgcHV0IGluIHRoZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5leHRVcGRhdGVRdWV1ZVxuXG4gICAgdGhpcy5fY2xvY2sgPSBuZXcgQ2xvY2soKTsgLy8gYSBjbG9jayB0byBrZWVwIHRyYWNrIG9mIHRpbWUgZm9yIHRoZSBzY2VuZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGdyYXBoLlxuXG4gICAgdGhpcy5fY2hhbm5lbCA9IG5ldyBDaGFubmVsKCk7XG4gICAgdGhpcy5fY2hhbm5lbC5vbk1lc3NhZ2UgPSBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgICAgICBfdGhpcy5oYW5kbGVNZXNzYWdlKG1lc3NhZ2UpO1xuICAgIH07XG59XG5cblxuLyoqXG4gKiBBbiBpbml0IHNjcmlwdCB0aGF0IGluaXRpYWxpemVzIHRoZSBGYW1vdXNFbmdpbmUgd2l0aCBvcHRpb25zXG4gKiBvciBkZWZhdWx0IHBhcmFtZXRlcnMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIGEgc2V0IG9mIG9wdGlvbnMgY29udGFpbmluZyBhIGNvbXBvc2l0b3IgYW5kIGEgcmVuZGVyIGxvb3BcbiAqXG4gKiBAcmV0dXJuIHtGYW1vdXNFbmdpbmV9IHRoaXNcbiAqL1xuRmFtb3VzRW5naW5lLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gaW5pdChvcHRpb25zKSB7XG4gICAgdGhpcy5jb21wb3NpdG9yID0gb3B0aW9ucyAmJiBvcHRpb25zLmNvbXBvc2l0b3IgfHwgbmV3IENvbXBvc2l0b3IoKTtcbiAgICB0aGlzLnJlbmRlckxvb3AgPSBvcHRpb25zICYmIG9wdGlvbnMucmVuZGVyTG9vcCB8fCBuZXcgUmVxdWVzdEFuaW1hdGlvbkZyYW1lTG9vcCgpO1xuICAgIHRoaXMudWlNYW5hZ2VyID0gbmV3IFVJTWFuYWdlcih0aGlzLmdldENoYW5uZWwoKSwgdGhpcy5jb21wb3NpdG9yLCB0aGlzLnJlbmRlckxvb3ApO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTZXRzIHRoZSBjaGFubmVsIHRoYXQgdGhlIGVuZ2luZSB3aWxsIHVzZSB0byBjb21tdW5pY2F0ZSB0b1xuICogdGhlIHJlbmRlcmVycy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtDaGFubmVsfSBjaGFubmVsICAgICBUaGUgY2hhbm5lbCB0byBiZSB1c2VkIGZvciBjb21tdW5pY2F0aW5nIHdpdGhcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlIGBVSU1hbmFnZXJgLyBgQ29tcG9zaXRvcmAuXG4gKlxuICogQHJldHVybiB7RmFtb3VzRW5naW5lfSB0aGlzXG4gKi9cbkZhbW91c0VuZ2luZS5wcm90b3R5cGUuc2V0Q2hhbm5lbCA9IGZ1bmN0aW9uIHNldENoYW5uZWwoY2hhbm5lbCkge1xuICAgIHRoaXMuX2NoYW5uZWwgPSBjaGFubmVsO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBjaGFubmVsIHRoYXQgdGhlIGVuZ2luZSBpcyBjdXJyZW50bHkgdXNpbmdcbiAqIHRvIGNvbW11bmljYXRlIHdpdGggdGhlIHJlbmRlcmVycy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7Q2hhbm5lbH0gY2hhbm5lbCAgICBUaGUgY2hhbm5lbCB0byBiZSB1c2VkIGZvciBjb21tdW5pY2F0aW5nIHdpdGhcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlIGBVSU1hbmFnZXJgLyBgQ29tcG9zaXRvcmAuXG4gKi9cbkZhbW91c0VuZ2luZS5wcm90b3R5cGUuZ2V0Q2hhbm5lbCA9IGZ1bmN0aW9uIGdldENoYW5uZWwgKCkge1xuICAgIHJldHVybiB0aGlzLl9jaGFubmVsO1xufTtcblxuLyoqXG4gKiBfdXBkYXRlIGlzIHRoZSBib2R5IG9mIHRoZSB1cGRhdGUgbG9vcC4gVGhlIGZyYW1lIGNvbnNpc3RzIG9mXG4gKiBwdWxsaW5nIGluIGFwcGVuZGluZyB0aGUgbmV4dFVwZGF0ZVF1ZXVlIHRvIHRoZSBjdXJyZW50VXBkYXRlIHF1ZXVlXG4gKiB0aGVuIG1vdmluZyB0aHJvdWdoIHRoZSB1cGRhdGVRdWV1ZSBhbmQgY2FsbGluZyBvblVwZGF0ZSB3aXRoIHRoZSBjdXJyZW50XG4gKiB0aW1lIG9uIGFsbCBub2Rlcy4gV2hpbGUgX3VwZGF0ZSBpcyBjYWxsZWQgX2luVXBkYXRlIGlzIHNldCB0byB0cnVlIGFuZFxuICogYWxsIHJlcXVlc3RzIHRvIGJlIHBsYWNlZCBpbiB0aGUgdXBkYXRlIHF1ZXVlIHdpbGwgYmUgZm9yd2FyZGVkIHRvIHRoZVxuICogbmV4dFVwZGF0ZVF1ZXVlLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5GYW1vdXNFbmdpbmUucHJvdG90eXBlLl91cGRhdGUgPSBmdW5jdGlvbiBfdXBkYXRlICgpIHtcbiAgICB0aGlzLl9pblVwZGF0ZSA9IHRydWU7XG4gICAgdmFyIHRpbWUgPSB0aGlzLl9jbG9jay5ub3coKTtcbiAgICB2YXIgbmV4dFF1ZXVlID0gdGhpcy5fbmV4dFVwZGF0ZVF1ZXVlO1xuICAgIHZhciBxdWV1ZSA9IHRoaXMuX3VwZGF0ZVF1ZXVlO1xuICAgIHZhciBpdGVtO1xuXG4gICAgdGhpcy5fbWVzc2FnZXNbMV0gPSB0aW1lO1xuXG4gICAgd2hpbGUgKG5leHRRdWV1ZS5sZW5ndGgpIHF1ZXVlLnVuc2hpZnQobmV4dFF1ZXVlLnBvcCgpKTtcblxuICAgIHdoaWxlIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgaXRlbSA9IHF1ZXVlLnNoaWZ0KCk7XG4gICAgICAgIGlmIChpdGVtICYmIGl0ZW0ub25VcGRhdGUpIGl0ZW0ub25VcGRhdGUodGltZSk7XG4gICAgfVxuXG4gICAgdGhpcy5faW5VcGRhdGUgPSBmYWxzZTtcbn07XG5cbi8qKlxuICogcmVxdWVzdFVwZGF0ZXMgdGFrZXMgYSBjbGFzcyB0aGF0IGhhcyBhbiBvblVwZGF0ZSBtZXRob2QgYW5kIHB1dHMgaXRcbiAqIGludG8gdGhlIHVwZGF0ZVF1ZXVlIHRvIGJlIHVwZGF0ZWQgYXQgdGhlIG5leHQgZnJhbWUuXG4gKiBJZiBGYW1vdXNFbmdpbmUgaXMgY3VycmVudGx5IGluIGFuIHVwZGF0ZSwgcmVxdWVzdFVwZGF0ZVxuICogcGFzc2VzIGl0cyBhcmd1bWVudCB0byByZXF1ZXN0VXBkYXRlT25OZXh0VGljay5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHJlcXVlc3RlciBhbiBvYmplY3Qgd2l0aCBhbiBvblVwZGF0ZSBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5GYW1vdXNFbmdpbmUucHJvdG90eXBlLnJlcXVlc3RVcGRhdGUgPSBmdW5jdGlvbiByZXF1ZXN0VXBkYXRlIChyZXF1ZXN0ZXIpIHtcbiAgICBpZiAoIXJlcXVlc3RlcilcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgJ3JlcXVlc3RVcGRhdGUgbXVzdCBiZSBjYWxsZWQgd2l0aCBhIGNsYXNzIHRvIGJlIHVwZGF0ZWQnXG4gICAgICAgICk7XG5cbiAgICBpZiAodGhpcy5faW5VcGRhdGUpIHRoaXMucmVxdWVzdFVwZGF0ZU9uTmV4dFRpY2socmVxdWVzdGVyKTtcbiAgICBlbHNlIHRoaXMuX3VwZGF0ZVF1ZXVlLnB1c2gocmVxdWVzdGVyKTtcbn07XG5cbi8qKlxuICogcmVxdWVzdFVwZGF0ZU9uTmV4dFRpY2sgaXMgcmVxdWVzdHMgYW4gdXBkYXRlIG9uIHRoZSBuZXh0IGZyYW1lLlxuICogSWYgRmFtb3VzRW5naW5lIGlzIG5vdCBjdXJyZW50bHkgaW4gYW4gdXBkYXRlIHRoYW4gaXQgaXMgZnVuY3Rpb25hbGx5IGVxdWl2YWxlbnRcbiAqIHRvIHJlcXVlc3RVcGRhdGUuIFRoaXMgbWV0aG9kIHNob3VsZCBiZSB1c2VkIHRvIHByZXZlbnQgaW5maW5pdGUgbG9vcHMgd2hlcmVcbiAqIGEgY2xhc3MgaXMgdXBkYXRlZCBvbiB0aGUgZnJhbWUgYnV0IG5lZWRzIHRvIGJlIHVwZGF0ZWQgYWdhaW4gbmV4dCBmcmFtZS5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHJlcXVlc3RlciBhbiBvYmplY3Qgd2l0aCBhbiBvblVwZGF0ZSBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5GYW1vdXNFbmdpbmUucHJvdG90eXBlLnJlcXVlc3RVcGRhdGVPbk5leHRUaWNrID0gZnVuY3Rpb24gcmVxdWVzdFVwZGF0ZU9uTmV4dFRpY2sgKHJlcXVlc3Rlcikge1xuICAgIHRoaXMuX25leHRVcGRhdGVRdWV1ZS5wdXNoKHJlcXVlc3Rlcik7XG59O1xuXG4vKipcbiAqIHBvc3RNZXNzYWdlIHNlbmRzIGEgbWVzc2FnZSBxdWV1ZSBpbnRvIEZhbW91c0VuZ2luZSB0byBiZSBwcm9jZXNzZWQuXG4gKiBUaGVzZSBtZXNzYWdlcyB3aWxsIGJlIGludGVycHJldGVkIGFuZCBzZW50IGludG8gdGhlIHNjZW5lIGdyYXBoXG4gKiBhcyBldmVudHMgaWYgbmVjZXNzYXJ5LlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge0FycmF5fSBtZXNzYWdlcyBhbiBhcnJheSBvZiBjb21tYW5kcy5cbiAqXG4gKiBAcmV0dXJuIHtGYW1vdXNFbmdpbmV9IHRoaXNcbiAqL1xuRmFtb3VzRW5naW5lLnByb3RvdHlwZS5oYW5kbGVNZXNzYWdlID0gZnVuY3Rpb24gaGFuZGxlTWVzc2FnZSAobWVzc2FnZXMpIHtcbiAgICBpZiAoIW1lc3NhZ2VzKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAnb25NZXNzYWdlIG11c3QgYmUgY2FsbGVkIHdpdGggYW4gYXJyYXkgb2YgbWVzc2FnZXMnXG4gICAgICAgICk7XG5cbiAgICB2YXIgY29tbWFuZDtcblxuICAgIHdoaWxlIChtZXNzYWdlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGNvbW1hbmQgPSBtZXNzYWdlcy5zaGlmdCgpO1xuICAgICAgICBzd2l0Y2ggKGNvbW1hbmQpIHtcbiAgICAgICAgICAgIGNhc2UgJ1dJVEgnOlxuICAgICAgICAgICAgICAgIHRoaXMuaGFuZGxlV2l0aChtZXNzYWdlcyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdGUkFNRSc6XG4gICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVGcmFtZShtZXNzYWdlcyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigncmVjZWl2ZWQgdW5rbm93biBjb21tYW5kOiAnICsgY29tbWFuZCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIGhhbmRsZVdpdGggaXMgYSBtZXRob2QgdGhhdCB0YWtlcyBhbiBhcnJheSBvZiBtZXNzYWdlcyBmb2xsb3dpbmcgdGhlXG4gKiBXSVRIIGNvbW1hbmQuIEl0J2xsIHRoZW4gaXNzdWUgdGhlIG5leHQgY29tbWFuZHMgdG8gdGhlIHBhdGggc3BlY2lmaWVkXG4gKiBieSB0aGUgV0lUSCBjb21tYW5kLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge0FycmF5fSBtZXNzYWdlcyBhcnJheSBvZiBtZXNzYWdlcy5cbiAqXG4gKiBAcmV0dXJuIHtGYW1vdXNFbmdpbmV9IHRoaXNcbiAqL1xuRmFtb3VzRW5naW5lLnByb3RvdHlwZS5oYW5kbGVXaXRoID0gZnVuY3Rpb24gaGFuZGxlV2l0aCAobWVzc2FnZXMpIHtcbiAgICB2YXIgcGF0aCA9IG1lc3NhZ2VzLnNoaWZ0KCk7XG4gICAgdmFyIGNvbW1hbmQgPSBtZXNzYWdlcy5zaGlmdCgpO1xuXG4gICAgc3dpdGNoIChjb21tYW5kKSB7XG4gICAgICAgIGNhc2UgJ1RSSUdHRVInOiAvLyB0aGUgVFJJR0dFUiBjb21tYW5kIHNlbmRzIGEgVUlFdmVudCB0byB0aGUgc3BlY2lmaWVkIHBhdGhcbiAgICAgICAgICAgIHZhciB0eXBlID0gbWVzc2FnZXMuc2hpZnQoKTtcbiAgICAgICAgICAgIHZhciBldiA9IG1lc3NhZ2VzLnNoaWZ0KCk7XG5cbiAgICAgICAgICAgIHRoaXMuZ2V0Q29udGV4dChwYXRoKS5nZXREaXNwYXRjaCgpLmRpc3BhdGNoVUlFdmVudChwYXRoLCB0eXBlLCBldik7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigncmVjZWl2ZWQgdW5rbm93biBjb21tYW5kOiAnICsgY29tbWFuZCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBoYW5kbGVGcmFtZSBpcyBjYWxsZWQgd2hlbiB0aGUgcmVuZGVyZXJzIGlzc3VlIGEgRlJBTUUgY29tbWFuZCB0b1xuICogRmFtb3VzRW5naW5lLiBGYW1vdXNFbmdpbmUgd2lsbCB0aGVuIHN0ZXAgdXBkYXRpbmcgdGhlIHNjZW5lIGdyYXBoIHRvIHRoZSBjdXJyZW50IHRpbWUuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IG1lc3NhZ2VzIGFycmF5IG9mIG1lc3NhZ2VzLlxuICpcbiAqIEByZXR1cm4ge0ZhbW91c0VuZ2luZX0gdGhpc1xuICovXG5GYW1vdXNFbmdpbmUucHJvdG90eXBlLmhhbmRsZUZyYW1lID0gZnVuY3Rpb24gaGFuZGxlRnJhbWUgKG1lc3NhZ2VzKSB7XG4gICAgaWYgKCFtZXNzYWdlcykgdGhyb3cgbmV3IEVycm9yKCdoYW5kbGVGcmFtZSBtdXN0IGJlIGNhbGxlZCB3aXRoIGFuIGFycmF5IG9mIG1lc3NhZ2VzJyk7XG4gICAgaWYgKCFtZXNzYWdlcy5sZW5ndGgpIHRocm93IG5ldyBFcnJvcignRlJBTUUgbXVzdCBiZSBzZW50IHdpdGggYSB0aW1lJyk7XG5cbiAgICB0aGlzLnN0ZXAobWVzc2FnZXMuc2hpZnQoKSk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIHN0ZXAgdXBkYXRlcyB0aGUgY2xvY2sgYW5kIHRoZSBzY2VuZSBncmFwaCBhbmQgdGhlbiBzZW5kcyB0aGUgZHJhdyBjb21tYW5kc1xuICogdGhhdCBhY2N1bXVsYXRlZCBpbiB0aGUgdXBkYXRlIHRvIHRoZSByZW5kZXJlcnMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB0aW1lIGN1cnJlbnQgZW5naW5lIHRpbWVcbiAqXG4gKiBAcmV0dXJuIHtGYW1vdXNFbmdpbmV9IHRoaXNcbiAqL1xuRmFtb3VzRW5naW5lLnByb3RvdHlwZS5zdGVwID0gZnVuY3Rpb24gc3RlcCAodGltZSkge1xuICAgIGlmICh0aW1lID09IG51bGwpIHRocm93IG5ldyBFcnJvcignc3RlcCBtdXN0IGJlIGNhbGxlZCB3aXRoIGEgdGltZScpO1xuXG4gICAgdGhpcy5fY2xvY2suc3RlcCh0aW1lKTtcbiAgICB0aGlzLl91cGRhdGUoKTtcblxuICAgIGlmICh0aGlzLl9tZXNzYWdlcy5sZW5ndGgpIHtcbiAgICAgICAgdGhpcy5fY2hhbm5lbC5zZW5kTWVzc2FnZSh0aGlzLl9tZXNzYWdlcyk7XG4gICAgICAgIHRoaXMuX21lc3NhZ2VzLmxlbmd0aCA9IDI7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIHJldHVybnMgdGhlIGNvbnRleHQgb2YgYSBwYXJ0aWN1bGFyIHBhdGguIFRoZSBjb250ZXh0IGlzIGxvb2tlZCB1cCBieSB0aGUgc2VsZWN0b3JcbiAqIHBvcnRpb24gb2YgdGhlIHBhdGggYW5kIGlzIGxpc3RlZCBmcm9tIHRoZSBzdGFydCBvZiB0aGUgc3RyaW5nIHRvIHRoZSBmaXJzdFxuICogJy8nLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc2VsZWN0b3IgdGhlIHBhdGggdG8gbG9vayB1cCB0aGUgY29udGV4dCBmb3IuXG4gKlxuICogQHJldHVybiB7Q29udGV4dCB8IFVuZGVmaW5lZH0gdGhlIGNvbnRleHQgaWYgZm91bmQsIGVsc2UgdW5kZWZpbmVkLlxuICovXG5GYW1vdXNFbmdpbmUucHJvdG90eXBlLmdldENvbnRleHQgPSBmdW5jdGlvbiBnZXRDb250ZXh0IChzZWxlY3Rvcikge1xuICAgIGlmICghc2VsZWN0b3IpIHRocm93IG5ldyBFcnJvcignZ2V0Q29udGV4dCBtdXN0IGJlIGNhbGxlZCB3aXRoIGEgc2VsZWN0b3InKTtcblxuICAgIHZhciBpbmRleCA9IHNlbGVjdG9yLmluZGV4T2YoJy8nKTtcbiAgICBzZWxlY3RvciA9IGluZGV4ID09PSAtMSA/IHNlbGVjdG9yIDogc2VsZWN0b3Iuc3Vic3RyaW5nKDAsIGluZGV4KTtcblxuICAgIHJldHVybiB0aGlzLl9zY2VuZXNbc2VsZWN0b3JdO1xufTtcblxuLyoqXG4gKiByZXR1cm5zIHRoZSBpbnN0YW5jZSBvZiBjbG9jayB3aXRoaW4gZmFtb3VzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtDbG9ja30gRmFtb3VzRW5naW5lJ3MgY2xvY2tcbiAqL1xuRmFtb3VzRW5naW5lLnByb3RvdHlwZS5nZXRDbG9jayA9IGZ1bmN0aW9uIGdldENsb2NrICgpIHtcbiAgICByZXR1cm4gdGhpcy5fY2xvY2s7XG59O1xuXG4vKipcbiAqIHF1ZXVlcyBhIG1lc3NhZ2UgdG8gYmUgdHJhbnNmZXJlZCB0byB0aGUgcmVuZGVyZXJzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge0FueX0gY29tbWFuZCBEcmF3IENvbW1hbmRcbiAqXG4gKiBAcmV0dXJuIHtGYW1vdXNFbmdpbmV9IHRoaXNcbiAqL1xuRmFtb3VzRW5naW5lLnByb3RvdHlwZS5tZXNzYWdlID0gZnVuY3Rpb24gbWVzc2FnZSAoY29tbWFuZCkge1xuICAgIHRoaXMuX21lc3NhZ2VzLnB1c2goY29tbWFuZCk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBzY2VuZSB1bmRlciB3aGljaCBhIHNjZW5lIGdyYXBoIGNvdWxkIGJlIGJ1aWx0LlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gc2VsZWN0b3IgYSBkb20gc2VsZWN0b3IgZm9yIHdoZXJlIHRoZSBzY2VuZSBzaG91bGQgYmUgcGxhY2VkXG4gKlxuICogQHJldHVybiB7U2NlbmV9IGEgbmV3IGluc3RhbmNlIG9mIFNjZW5lLlxuICovXG5GYW1vdXNFbmdpbmUucHJvdG90eXBlLmNyZWF0ZVNjZW5lID0gZnVuY3Rpb24gY3JlYXRlU2NlbmUgKHNlbGVjdG9yKSB7XG4gICAgc2VsZWN0b3IgPSBzZWxlY3RvciB8fCAnYm9keSc7XG5cbiAgICBpZiAodGhpcy5fc2NlbmVzW3NlbGVjdG9yXSkgdGhpcy5fc2NlbmVzW3NlbGVjdG9yXS5kaXNtb3VudCgpO1xuICAgIHRoaXMuX3NjZW5lc1tzZWxlY3Rvcl0gPSBuZXcgU2NlbmUoc2VsZWN0b3IsIHRoaXMpO1xuICAgIHJldHVybiB0aGlzLl9zY2VuZXNbc2VsZWN0b3JdO1xufTtcblxuLyoqXG4gKiBTdGFydHMgdGhlIGVuZ2luZSBydW5uaW5nIGluIHRoZSBNYWluLVRocmVhZC5cbiAqIFRoaXMgZWZmZWN0cyAqKmV2ZXJ5KiogdXBkYXRlYWJsZSBtYW5hZ2VkIGJ5IHRoZSBFbmdpbmUuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge0ZhbW91c0VuZ2luZX0gdGhpc1xuICovXG5GYW1vdXNFbmdpbmUucHJvdG90eXBlLnN0YXJ0RW5naW5lID0gZnVuY3Rpb24gc3RhcnRFbmdpbmUgKCkge1xuICAgIHRoaXMuX2NoYW5uZWwuc2VuZE1lc3NhZ2UoRU5HSU5FX1NUQVJUKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU3RvcHMgdGhlIGVuZ2luZSBydW5uaW5nIGluIHRoZSBNYWluLVRocmVhZC5cbiAqIFRoaXMgZWZmZWN0cyAqKmV2ZXJ5KiogdXBkYXRlYWJsZSBtYW5hZ2VkIGJ5IHRoZSBFbmdpbmUuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge0ZhbW91c0VuZ2luZX0gdGhpc1xuICovXG5GYW1vdXNFbmdpbmUucHJvdG90eXBlLnN0b3BFbmdpbmUgPSBmdW5jdGlvbiBzdG9wRW5naW5lICgpIHtcbiAgICB0aGlzLl9jaGFubmVsLnNlbmRNZXNzYWdlKEVOR0lORV9TVE9QKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gbmV3IEZhbW91c0VuZ2luZSgpO1xuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuLypqc2hpbnQgLVcwNzkgKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgVHJhbnNmb3JtID0gcmVxdWlyZSgnLi9UcmFuc2Zvcm0nKTtcbnZhciBTaXplID0gcmVxdWlyZSgnLi9TaXplJyk7XG5cbnZhciBUUkFOU0ZPUk1fUFJPQ0VTU09SID0gbmV3IFRyYW5zZm9ybSgpO1xudmFyIFNJWkVfUFJPQ0VTU09SID0gbmV3IFNpemUoKTtcblxudmFyIElERU5UID0gW1xuICAgIDEsIDAsIDAsIDAsXG4gICAgMCwgMSwgMCwgMCxcbiAgICAwLCAwLCAxLCAwLFxuICAgIDAsIDAsIDAsIDFcbl07XG5cbnZhciBPTkVTID0gWzEsIDEsIDFdO1xudmFyIFFVQVQgPSBbMCwgMCwgMCwgMV07XG5cbi8qKlxuICogTm9kZXMgZGVmaW5lIGhpZXJhcmNoeSBhbmQgZ2VvbWV0cmljYWwgdHJhbnNmb3JtYXRpb25zLiBUaGV5IGNhbiBiZSBtb3ZlZFxuICogKHRyYW5zbGF0ZWQpLCBzY2FsZWQgYW5kIHJvdGF0ZWQuXG4gKlxuICogQSBOb2RlIGlzIGVpdGhlciBtb3VudGVkIG9yIHVubW91bnRlZC4gVW5tb3VudGVkIG5vZGVzIGFyZSBkZXRhY2hlZCBmcm9tIHRoZVxuICogc2NlbmUgZ3JhcGguIFVubW91bnRlZCBub2RlcyBoYXZlIG5vIHBhcmVudCBub2RlLCB3aGlsZSBlYWNoIG1vdW50ZWQgbm9kZSBoYXNcbiAqIGV4YWN0bHkgb25lIHBhcmVudC4gTm9kZXMgaGF2ZSBhbiBhcmJpdGFyeSBudW1iZXIgb2YgY2hpbGRyZW4sIHdoaWNoIGNhbiBiZVxuICogZHluYW1pY2FsbHkgYWRkZWQgdXNpbmcge0BsaW5rIE5vZGUjYWRkQ2hpbGR9LlxuICpcbiAqIEVhY2ggTm9kZSBoYXMgYW4gYXJiaXRyYXJ5IG51bWJlciBvZiBgY29tcG9uZW50c2AuIFRob3NlIGNvbXBvbmVudHMgY2FuXG4gKiBzZW5kIGBkcmF3YCBjb21tYW5kcyB0byB0aGUgcmVuZGVyZXIgb3IgbXV0YXRlIHRoZSBub2RlIGl0c2VsZiwgaW4gd2hpY2ggY2FzZVxuICogdGhleSBkZWZpbmUgYmVoYXZpb3IgaW4gdGhlIG1vc3QgZXhwbGljaXQgd2F5LiBDb21wb25lbnRzIHRoYXQgc2VuZCBgZHJhd2BcbiAqIGNvbW1hbmRzIGFyZSBjb25zaWRlcmVkIGByZW5kZXJhYmxlc2AuIEZyb20gdGhlIG5vZGUncyBwZXJzcGVjdGl2ZSwgdGhlcmUgaXNcbiAqIG5vIGRpc3RpbmN0aW9uIGJldHdlZW4gbm9kZXMgdGhhdCBzZW5kIGRyYXcgY29tbWFuZHMgYW5kIG5vZGVzIHRoYXQgZGVmaW5lXG4gKiBiZWhhdmlvci5cbiAqXG4gKiBCZWNhdXNlIG9mIHRoZSBmYWN0IHRoYXQgTm9kZXMgdGhlbXNlbGYgYXJlIHZlcnkgdW5vcGluaW90ZWQgKHRoZXkgZG9uJ3RcbiAqIFwicmVuZGVyXCIgdG8gYW55dGhpbmcpLCB0aGV5IGFyZSBvZnRlbiBiZWluZyBzdWJjbGFzc2VkIGluIG9yZGVyIHRvIGFkZCBlLmcuXG4gKiBjb21wb25lbnRzIGF0IGluaXRpYWxpemF0aW9uIHRvIHRoZW0uIEJlY2F1c2Ugb2YgdGhpcyBmbGV4aWJpbGl0eSwgdGhleSBtaWdodFxuICogYXMgd2VsbCBoYXZlIGJlZW4gY2FsbGVkIGBFbnRpdGllc2AuXG4gKlxuICogQGV4YW1wbGVcbiAqIC8vIGNyZWF0ZSB0aHJlZSBkZXRhY2hlZCAodW5tb3VudGVkKSBub2Rlc1xuICogdmFyIHBhcmVudCA9IG5ldyBOb2RlKCk7XG4gKiB2YXIgY2hpbGQxID0gbmV3IE5vZGUoKTtcbiAqIHZhciBjaGlsZDIgPSBuZXcgTm9kZSgpO1xuICpcbiAqIC8vIGJ1aWxkIGFuIHVubW91bnRlZCBzdWJ0cmVlIChwYXJlbnQgaXMgc3RpbGwgZGV0YWNoZWQpXG4gKiBwYXJlbnQuYWRkQ2hpbGQoY2hpbGQxKTtcbiAqIHBhcmVudC5hZGRDaGlsZChjaGlsZDIpO1xuICpcbiAqIC8vIG1vdW50IHBhcmVudCBieSBhZGRpbmcgaXQgdG8gdGhlIGNvbnRleHRcbiAqIHZhciBjb250ZXh0ID0gRmFtb3VzLmNyZWF0ZUNvbnRleHQoXCJib2R5XCIpO1xuICogY29udGV4dC5hZGRDaGlsZChwYXJlbnQpO1xuICpcbiAqIEBjbGFzcyBOb2RlXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gTm9kZSAoKSB7XG4gICAgdGhpcy5fY2FsY3VsYXRlZFZhbHVlcyA9IHtcbiAgICAgICAgdHJhbnNmb3JtOiBuZXcgRmxvYXQzMkFycmF5KElERU5UKSxcbiAgICAgICAgc2l6ZTogbmV3IEZsb2F0MzJBcnJheSgzKVxuICAgIH07XG5cbiAgICB0aGlzLl9yZXF1ZXN0aW5nVXBkYXRlID0gZmFsc2U7XG4gICAgdGhpcy5faW5VcGRhdGUgPSBmYWxzZTtcblxuICAgIHRoaXMuX3VwZGF0ZVF1ZXVlID0gW107XG4gICAgdGhpcy5fbmV4dFVwZGF0ZVF1ZXVlID0gW107XG5cbiAgICB0aGlzLl9mcmVlZENvbXBvbmVudEluZGljaWVzID0gW107XG4gICAgdGhpcy5fY29tcG9uZW50cyA9IFtdO1xuXG4gICAgdGhpcy5fZnJlZWRDaGlsZEluZGljaWVzID0gW107XG4gICAgdGhpcy5fY2hpbGRyZW4gPSBbXTtcblxuICAgIHRoaXMuX3BhcmVudCA9IG51bGw7XG4gICAgdGhpcy5fZ2xvYmFsVXBkYXRlciA9IG51bGw7XG5cbiAgICB0aGlzLl9sYXN0RXVsZXJYID0gMDtcbiAgICB0aGlzLl9sYXN0RXVsZXJZID0gMDtcbiAgICB0aGlzLl9sYXN0RXVsZXJaID0gMDtcbiAgICB0aGlzLl9sYXN0RXVsZXIgPSBmYWxzZTtcblxuICAgIHRoaXMudmFsdWUgPSBuZXcgTm9kZS5TcGVjKCk7XG59XG5cbk5vZGUuUkVMQVRJVkVfU0laRSA9IFNpemUuUkVMQVRJVkU7XG5Ob2RlLkFCU09MVVRFX1NJWkUgPSBTaXplLkFCU09MVVRFO1xuTm9kZS5SRU5ERVJfU0laRSA9IFNpemUuUkVOREVSO1xuTm9kZS5ERUZBVUxUX1NJWkUgPSBTaXplLkRFRkFVTFQ7XG5cbi8qKlxuICogQSBOb2RlIHNwZWMgaG9sZHMgdGhlIFwiZGF0YVwiIGFzc29jaWF0ZWQgd2l0aCBhIE5vZGUuXG4gKlxuICogQGNsYXNzIFNwZWNcbiAqIEBjb25zdHJ1Y3RvclxuICpcbiAqIEBwcm9wZXJ0eSB7U3RyaW5nfSBsb2NhdGlvbiBwYXRoIHRvIHRoZSBub2RlIChlLmcuIFwiYm9keS8wLzFcIilcbiAqIEBwcm9wZXJ0eSB7T2JqZWN0fSBzaG93U3RhdGVcbiAqIEBwcm9wZXJ0eSB7Qm9vbGVhbn0gc2hvd1N0YXRlLm1vdW50ZWRcbiAqIEBwcm9wZXJ0eSB7Qm9vbGVhbn0gc2hvd1N0YXRlLnNob3duXG4gKiBAcHJvcGVydHkge051bWJlcn0gc2hvd1N0YXRlLm9wYWNpdHlcbiAqIEBwcm9wZXJ0eSB7T2JqZWN0fSBvZmZzZXRzXG4gKiBAcHJvcGVydHkge0Zsb2F0MzJBcnJheS48TnVtYmVyPn0gb2Zmc2V0cy5tb3VudFBvaW50XG4gKiBAcHJvcGVydHkge0Zsb2F0MzJBcnJheS48TnVtYmVyPn0gb2Zmc2V0cy5hbGlnblxuICogQHByb3BlcnR5IHtGbG9hdDMyQXJyYXkuPE51bWJlcj59IG9mZnNldHMub3JpZ2luXG4gKiBAcHJvcGVydHkge09iamVjdH0gdmVjdG9yc1xuICogQHByb3BlcnR5IHtGbG9hdDMyQXJyYXkuPE51bWJlcj59IHZlY3RvcnMucG9zaXRpb25cbiAqIEBwcm9wZXJ0eSB7RmxvYXQzMkFycmF5LjxOdW1iZXI+fSB2ZWN0b3JzLnJvdGF0aW9uXG4gKiBAcHJvcGVydHkge0Zsb2F0MzJBcnJheS48TnVtYmVyPn0gdmVjdG9ycy5zY2FsZVxuICogQHByb3BlcnR5IHtPYmplY3R9IHNpemVcbiAqIEBwcm9wZXJ0eSB7RmxvYXQzMkFycmF5LjxOdW1iZXI+fSBzaXplLnNpemVNb2RlXG4gKiBAcHJvcGVydHkge0Zsb2F0MzJBcnJheS48TnVtYmVyPn0gc2l6ZS5wcm9wb3J0aW9uYWxcbiAqIEBwcm9wZXJ0eSB7RmxvYXQzMkFycmF5LjxOdW1iZXI+fSBzaXplLmRpZmZlcmVudGlhbFxuICogQHByb3BlcnR5IHtGbG9hdDMyQXJyYXkuPE51bWJlcj59IHNpemUuYWJzb2x1dGVcbiAqIEBwcm9wZXJ0eSB7RmxvYXQzMkFycmF5LjxOdW1iZXI+fSBzaXplLnJlbmRlclxuICovXG5Ob2RlLlNwZWMgPSBmdW5jdGlvbiBTcGVjICgpIHtcbiAgICB0aGlzLmxvY2F0aW9uID0gbnVsbDtcbiAgICB0aGlzLnNob3dTdGF0ZSA9IHtcbiAgICAgICAgbW91bnRlZDogZmFsc2UsXG4gICAgICAgIHNob3duOiBmYWxzZSxcbiAgICAgICAgb3BhY2l0eTogMVxuICAgIH07XG4gICAgdGhpcy5vZmZzZXRzID0ge1xuICAgICAgICBtb3VudFBvaW50OiBuZXcgRmxvYXQzMkFycmF5KDMpLFxuICAgICAgICBhbGlnbjogbmV3IEZsb2F0MzJBcnJheSgzKSxcbiAgICAgICAgb3JpZ2luOiBuZXcgRmxvYXQzMkFycmF5KDMpXG4gICAgfTtcbiAgICB0aGlzLnZlY3RvcnMgPSB7XG4gICAgICAgIHBvc2l0aW9uOiBuZXcgRmxvYXQzMkFycmF5KDMpLFxuICAgICAgICByb3RhdGlvbjogbmV3IEZsb2F0MzJBcnJheShRVUFUKSxcbiAgICAgICAgc2NhbGU6IG5ldyBGbG9hdDMyQXJyYXkoT05FUylcbiAgICB9O1xuICAgIHRoaXMuc2l6ZSA9IHtcbiAgICAgICAgc2l6ZU1vZGU6IG5ldyBGbG9hdDMyQXJyYXkoW1NpemUuUkVMQVRJVkUsIFNpemUuUkVMQVRJVkUsIFNpemUuUkVMQVRJVkVdKSxcbiAgICAgICAgcHJvcG9ydGlvbmFsOiBuZXcgRmxvYXQzMkFycmF5KE9ORVMpLFxuICAgICAgICBkaWZmZXJlbnRpYWw6IG5ldyBGbG9hdDMyQXJyYXkoMyksXG4gICAgICAgIGFic29sdXRlOiBuZXcgRmxvYXQzMkFycmF5KDMpLFxuICAgICAgICByZW5kZXI6IG5ldyBGbG9hdDMyQXJyYXkoMylcbiAgICB9O1xuICAgIHRoaXMuVUlFdmVudHMgPSBbXTtcbn07XG5cbi8qKlxuICogRGV0ZXJtaW5lIHRoZSBub2RlJ3MgbG9jYXRpb24gaW4gdGhlIHNjZW5lIGdyYXBoIGhpZXJhcmNoeS5cbiAqIEEgbG9jYXRpb24gb2YgYGJvZHkvMC8xYCBjYW4gYmUgaW50ZXJwcmV0ZWQgYXMgdGhlIGZvbGxvd2luZyBzY2VuZSBncmFwaFxuICogaGllcmFyY2h5IChpZ25vcmluZyBzaWJsaW5ncyBvZiBhbmNlc3RvcnMgYW5kIGFkZGl0aW9uYWwgY2hpbGQgbm9kZXMpOlxuICpcbiAqIGBDb250ZXh0OmJvZHlgIC0+IGBOb2RlOjBgIC0+IGBOb2RlOjFgLCB3aGVyZSBgTm9kZToxYCBpcyB0aGUgbm9kZSB0aGVcbiAqIGBnZXRMb2NhdGlvbmAgbWV0aG9kIGhhcyBiZWVuIGludm9rZWQgb24uXG4gKlxuICogQG1ldGhvZCBnZXRMb2NhdGlvblxuICpcbiAqIEByZXR1cm4ge1N0cmluZ30gbG9jYXRpb24gKHBhdGgpLCBlLmcuIGBib2R5LzAvMWBcbiAqL1xuTm9kZS5wcm90b3R5cGUuZ2V0TG9jYXRpb24gPSBmdW5jdGlvbiBnZXRMb2NhdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMudmFsdWUubG9jYXRpb247XG59O1xuXG4vKipcbiAqIEBhbGlhcyBnZXRJZFxuICpcbiAqIEByZXR1cm4ge1N0cmluZ30gdGhlIHBhdGggb2YgdGhlIE5vZGVcbiAqL1xuTm9kZS5wcm90b3R5cGUuZ2V0SWQgPSBOb2RlLnByb3RvdHlwZS5nZXRMb2NhdGlvbjtcblxuLyoqXG4gKiBHbG9iYWxseSBkaXNwYXRjaGVzIHRoZSBldmVudCB1c2luZyB0aGUgU2NlbmUncyBEaXNwYXRjaC4gQWxsIG5vZGVzIHdpbGxcbiAqIHJlY2VpdmUgdGhlIGRpc3BhdGNoZWQgZXZlbnQuXG4gKlxuICogQG1ldGhvZCBlbWl0XG4gKlxuICogQHBhcmFtICB7U3RyaW5nfSBldmVudCAgIEV2ZW50IHR5cGUuXG4gKiBAcGFyYW0gIHtPYmplY3R9IHBheWxvYWQgRXZlbnQgb2JqZWN0IHRvIGJlIGRpc3BhdGNoZWQuXG4gKlxuICogQHJldHVybiB7Tm9kZX0gdGhpc1xuICovXG5Ob2RlLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24gZW1pdCAoZXZlbnQsIHBheWxvYWQpIHtcbiAgICB2YXIgY3VycmVudCA9IHRoaXM7XG5cbiAgICB3aGlsZSAoY3VycmVudCAhPT0gY3VycmVudC5nZXRQYXJlbnQoKSkge1xuICAgICAgICBjdXJyZW50ID0gY3VycmVudC5nZXRQYXJlbnQoKTtcbiAgICB9XG5cbiAgICBjdXJyZW50LmdldERpc3BhdGNoKCkuZGlzcGF0Y2goZXZlbnQsIHBheWxvYWQpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLy8gVEhJUyBXSUxMIEJFIERFUFJFQ0FURURcbk5vZGUucHJvdG90eXBlLnNlbmREcmF3Q29tbWFuZCA9IGZ1bmN0aW9uIHNlbmREcmF3Q29tbWFuZCAobWVzc2FnZSkge1xuICAgIHRoaXMuX2dsb2JhbFVwZGF0ZXIubWVzc2FnZShtZXNzYWdlKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVjdXJzaXZlbHkgc2VyaWFsaXplcyB0aGUgTm9kZSwgaW5jbHVkaW5nIGFsbCBwcmV2aW91c2x5IGFkZGVkIGNvbXBvbmVudHMuXG4gKlxuICogQG1ldGhvZCBnZXRWYWx1ZVxuICpcbiAqIEByZXR1cm4ge09iamVjdH0gICAgIFNlcmlhbGl6ZWQgcmVwcmVzZW50YXRpb24gb2YgdGhlIG5vZGUsIGluY2x1ZGluZ1xuICogICAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50cy5cbiAqL1xuTm9kZS5wcm90b3R5cGUuZ2V0VmFsdWUgPSBmdW5jdGlvbiBnZXRWYWx1ZSAoKSB7XG4gICAgdmFyIG51bWJlck9mQ2hpbGRyZW4gPSB0aGlzLl9jaGlsZHJlbi5sZW5ndGg7XG4gICAgdmFyIG51bWJlck9mQ29tcG9uZW50cyA9IHRoaXMuX2NvbXBvbmVudHMubGVuZ3RoO1xuICAgIHZhciBpID0gMDtcblxuICAgIHZhciB2YWx1ZSA9IHtcbiAgICAgICAgbG9jYXRpb246IHRoaXMudmFsdWUubG9jYXRpb24sXG4gICAgICAgIHNwZWM6IHRoaXMudmFsdWUsXG4gICAgICAgIGNvbXBvbmVudHM6IG5ldyBBcnJheShudW1iZXJPZkNvbXBvbmVudHMpLFxuICAgICAgICBjaGlsZHJlbjogbmV3IEFycmF5KG51bWJlck9mQ2hpbGRyZW4pXG4gICAgfTtcblxuICAgIGZvciAoOyBpIDwgbnVtYmVyT2ZDaGlsZHJlbiA7IGkrKylcbiAgICAgICAgaWYgKHRoaXMuX2NoaWxkcmVuW2ldICYmIHRoaXMuX2NoaWxkcmVuW2ldLmdldFZhbHVlKVxuICAgICAgICAgICAgdmFsdWUuY2hpbGRyZW5baV0gPSB0aGlzLl9jaGlsZHJlbltpXS5nZXRWYWx1ZSgpO1xuXG4gICAgZm9yIChpID0gMCA7IGkgPCBudW1iZXJPZkNvbXBvbmVudHMgOyBpKyspXG4gICAgICAgIGlmICh0aGlzLl9jb21wb25lbnRzW2ldICYmIHRoaXMuX2NvbXBvbmVudHNbaV0uZ2V0VmFsdWUpXG4gICAgICAgICAgICB2YWx1ZS5jb21wb25lbnRzW2ldID0gdGhpcy5fY29tcG9uZW50c1tpXS5nZXRWYWx1ZSgpO1xuXG4gICAgcmV0dXJuIHZhbHVlO1xufTtcblxuLyoqXG4gKiBTaW1pbGFyIHRvIHtAbGluayBOb2RlI2dldFZhbHVlfSwgYnV0IHJldHVybnMgdGhlIGFjdHVhbCBcImNvbXB1dGVkXCIgdmFsdWUuIEUuZy5cbiAqIGEgcHJvcG9ydGlvbmFsIHNpemUgb2YgMC41IG1pZ2h0IHJlc29sdmUgaW50byBhIFwiY29tcHV0ZWRcIiBzaXplIG9mIDIwMHB4XG4gKiAoYXNzdW1pbmcgdGhlIHBhcmVudCBoYXMgYSB3aWR0aCBvZiA0MDBweCkuXG4gKlxuICogQG1ldGhvZCBnZXRDb21wdXRlZFZhbHVlXG4gKlxuICogQHJldHVybiB7T2JqZWN0fSAgICAgU2VyaWFsaXplZCByZXByZXNlbnRhdGlvbiBvZiB0aGUgbm9kZSwgaW5jbHVkaW5nXG4gKiAgICAgICAgICAgICAgICAgICAgICBjaGlsZHJlbiwgZXhjbHVkaW5nIGNvbXBvbmVudHMuXG4gKi9cbk5vZGUucHJvdG90eXBlLmdldENvbXB1dGVkVmFsdWUgPSBmdW5jdGlvbiBnZXRDb21wdXRlZFZhbHVlICgpIHtcbiAgICB2YXIgbnVtYmVyT2ZDaGlsZHJlbiA9IHRoaXMuX2NoaWxkcmVuLmxlbmd0aDtcblxuICAgIHZhciB2YWx1ZSA9IHtcbiAgICAgICAgbG9jYXRpb246IHRoaXMudmFsdWUubG9jYXRpb24sXG4gICAgICAgIGNvbXB1dGVkVmFsdWVzOiB0aGlzLl9jYWxjdWxhdGVkVmFsdWVzLFxuICAgICAgICBjaGlsZHJlbjogbmV3IEFycmF5KG51bWJlck9mQ2hpbGRyZW4pXG4gICAgfTtcblxuICAgIGZvciAodmFyIGkgPSAwIDsgaSA8IG51bWJlck9mQ2hpbGRyZW4gOyBpKyspXG4gICAgICAgIHZhbHVlLmNoaWxkcmVuW2ldID0gdGhpcy5fY2hpbGRyZW5baV0uZ2V0Q29tcHV0ZWRWYWx1ZSgpO1xuXG4gICAgcmV0dXJuIHZhbHVlO1xufTtcblxuLyoqXG4gKiBSZXRyaWV2ZXMgYWxsIGNoaWxkcmVuIG9mIHRoZSBjdXJyZW50IG5vZGUuXG4gKlxuICogQG1ldGhvZCBnZXRDaGlsZHJlblxuICpcbiAqIEByZXR1cm4ge0FycmF5LjxOb2RlPn0gICBBbiBhcnJheSBvZiBjaGlsZHJlbi5cbiAqL1xuTm9kZS5wcm90b3R5cGUuZ2V0Q2hpbGRyZW4gPSBmdW5jdGlvbiBnZXRDaGlsZHJlbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NoaWxkcmVuO1xufTtcblxuLyoqXG4gKiBSZXRyaWV2ZXMgdGhlIHBhcmVudCBvZiB0aGUgY3VycmVudCBub2RlLiBVbm1vdW50ZWQgbm9kZXMgZG8gbm90IGhhdmUgYVxuICogcGFyZW50IG5vZGUuXG4gKlxuICogQG1ldGhvZCBnZXRQYXJlbnRcbiAqXG4gKiBAcmV0dXJuIHtOb2RlfSAgICAgICBQYXJlbnQgbm9kZS5cbiAqL1xuTm9kZS5wcm90b3R5cGUuZ2V0UGFyZW50ID0gZnVuY3Rpb24gZ2V0UGFyZW50ICgpIHtcbiAgICByZXR1cm4gdGhpcy5fcGFyZW50O1xufTtcblxuLyoqXG4gKiBTY2hlZHVsZXMgdGhlIHtAbGluayBOb2RlI3VwZGF0ZX0gZnVuY3Rpb24gb2YgdGhlIG5vZGUgdG8gYmUgaW52b2tlZCBvbiB0aGVcbiAqIG5leHQgZnJhbWUgKGlmIG5vIHVwZGF0ZSBkdXJpbmcgdGhpcyBmcmFtZSBoYXMgYmVlbiBzY2hlZHVsZWQgYWxyZWFkeSkuXG4gKiBJZiB0aGUgbm9kZSBpcyBjdXJyZW50bHkgYmVpbmcgdXBkYXRlZCAod2hpY2ggbWVhbnMgb25lIG9mIHRoZSByZXF1ZXN0ZXJzXG4gKiBpbnZva2VkIHJlcXVlc3RzVXBkYXRlIHdoaWxlIGJlaW5nIHVwZGF0ZWQgaXRzZWxmKSwgYW4gdXBkYXRlIHdpbGwgYmVcbiAqIHNjaGVkdWxlZCBvbiB0aGUgbmV4dCBmcmFtZS5cbiAqXG4gKiBAbWV0aG9kIHJlcXVlc3RVcGRhdGVcbiAqXG4gKiBAcGFyYW0gIHtPYmplY3R9IHJlcXVlc3RlciAgIElmIHRoZSByZXF1ZXN0ZXIgaGFzIGFuIGBvblVwZGF0ZWAgbWV0aG9kLCBpdFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWxsIGJlIGludm9rZWQgZHVyaW5nIHRoZSBuZXh0IHVwZGF0ZSBwaGFzZSBvZlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGUgbm9kZS5cbiAqXG4gKiBAcmV0dXJuIHtOb2RlfSB0aGlzXG4gKi9cbk5vZGUucHJvdG90eXBlLnJlcXVlc3RVcGRhdGUgPSBmdW5jdGlvbiByZXF1ZXN0VXBkYXRlIChyZXF1ZXN0ZXIpIHtcbiAgICBpZiAodGhpcy5faW5VcGRhdGUgfHwgIXRoaXMuaXNNb3VudGVkKCkpXG4gICAgICAgIHJldHVybiB0aGlzLnJlcXVlc3RVcGRhdGVPbk5leHRUaWNrKHJlcXVlc3Rlcik7XG4gICAgdGhpcy5fdXBkYXRlUXVldWUucHVzaChyZXF1ZXN0ZXIpO1xuICAgIGlmICghdGhpcy5fcmVxdWVzdGluZ1VwZGF0ZSkgdGhpcy5fcmVxdWVzdFVwZGF0ZSgpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTY2hlZHVsZXMgYW4gdXBkYXRlIG9uIHRoZSBuZXh0IHRpY2suIFNpbWlsYXJpbHkgdG9cbiAqIHtAbGluayBOb2RlI3JlcXVlc3RVcGRhdGV9LCBgcmVxdWVzdFVwZGF0ZU9uTmV4dFRpY2tgIHNjaGVkdWxlcyB0aGUgbm9kZSdzXG4gKiBgb25VcGRhdGVgIGZ1bmN0aW9uIHRvIGJlIGludm9rZWQgb24gdGhlIGZyYW1lIGFmdGVyIHRoZSBuZXh0IGludm9jYXRpb24gb25cbiAqIHRoZSBub2RlJ3Mgb25VcGRhdGUgZnVuY3Rpb24uXG4gKlxuICogQG1ldGhvZCByZXF1ZXN0VXBkYXRlT25OZXh0VGlja1xuICpcbiAqIEBwYXJhbSAge09iamVjdH0gcmVxdWVzdGVyICAgSWYgdGhlIHJlcXVlc3RlciBoYXMgYW4gYG9uVXBkYXRlYCBtZXRob2QsIGl0XG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpbGwgYmUgaW52b2tlZCBkdXJpbmcgdGhlIG5leHQgdXBkYXRlIHBoYXNlIG9mXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZSBub2RlLlxuICpcbiAqIEByZXR1cm4ge05vZGV9IHRoaXNcbiAqL1xuTm9kZS5wcm90b3R5cGUucmVxdWVzdFVwZGF0ZU9uTmV4dFRpY2sgPSBmdW5jdGlvbiByZXF1ZXN0VXBkYXRlT25OZXh0VGljayAocmVxdWVzdGVyKSB7XG4gICAgdGhpcy5fbmV4dFVwZGF0ZVF1ZXVlLnB1c2gocmVxdWVzdGVyKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogR2V0IHRoZSBvYmplY3QgcmVzcG9uc2libGUgZm9yIHVwZGF0aW5nIHRoaXMgbm9kZS5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7T2JqZWN0fSBUaGUgZ2xvYmFsIHVwZGF0ZXIuXG4gKi9cbk5vZGUucHJvdG90eXBlLmdldFVwZGF0ZXIgPSBmdW5jdGlvbiBnZXRVcGRhdGVyICgpIHtcbiAgICByZXR1cm4gdGhpcy5fZ2xvYmFsVXBkYXRlcjtcbn07XG5cbi8qKlxuICogQ2hlY2tzIGlmIHRoZSBub2RlIGlzIG1vdW50ZWQuIFVubW91bnRlZCBub2RlcyBhcmUgZGV0YWNoZWQgZnJvbSB0aGUgc2NlbmVcbiAqIGdyYXBoLlxuICpcbiAqIEBtZXRob2QgaXNNb3VudGVkXG4gKlxuICogQHJldHVybiB7Qm9vbGVhbn0gICAgQm9vbGVhbiBpbmRpY2F0aW5nIHdoZXRoZXIgdGhlIG5vZGUgaXMgbW91bnRlZCBvciBub3QuXG4gKi9cbk5vZGUucHJvdG90eXBlLmlzTW91bnRlZCA9IGZ1bmN0aW9uIGlzTW91bnRlZCAoKSB7XG4gICAgcmV0dXJuIHRoaXMudmFsdWUuc2hvd1N0YXRlLm1vdW50ZWQ7XG59O1xuXG4vKipcbiAqIENoZWNrcyBpZiB0aGUgbm9kZSBpcyB2aXNpYmxlIChcInNob3duXCIpLlxuICpcbiAqIEBtZXRob2QgaXNTaG93blxuICpcbiAqIEByZXR1cm4ge0Jvb2xlYW59ICAgIEJvb2xlYW4gaW5kaWNhdGluZyB3aGV0aGVyIHRoZSBub2RlIGlzIHZpc2libGVcbiAqICAgICAgICAgICAgICAgICAgICAgIChcInNob3duXCIpIG9yIG5vdC5cbiAqL1xuTm9kZS5wcm90b3R5cGUuaXNTaG93biA9IGZ1bmN0aW9uIGlzU2hvd24gKCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlLnNob3dTdGF0ZS5zaG93bjtcbn07XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB0aGUgbm9kZSdzIHJlbGF0aXZlIG9wYWNpdHkuXG4gKiBUaGUgb3BhY2l0eSBuZWVkcyB0byBiZSB3aXRoaW4gWzAsIDFdLCB3aGVyZSAwIGluZGljYXRlcyBhIGNvbXBsZXRlbHlcbiAqIHRyYW5zcGFyZW50LCB0aGVyZWZvcmUgaW52aXNpYmxlIG5vZGUsIHdoZXJlYXMgYW4gb3BhY2l0eSBvZiAxIG1lYW5zIHRoZVxuICogbm9kZSBpcyBjb21wbGV0ZWx5IHNvbGlkLlxuICpcbiAqIEBtZXRob2QgZ2V0T3BhY2l0eVxuICpcbiAqIEByZXR1cm4ge051bWJlcn0gICAgICAgICBSZWxhdGl2ZSBvcGFjaXR5IG9mIHRoZSBub2RlLlxuICovXG5Ob2RlLnByb3RvdHlwZS5nZXRPcGFjaXR5ID0gZnVuY3Rpb24gZ2V0T3BhY2l0eSAoKSB7XG4gICAgcmV0dXJuIHRoaXMudmFsdWUuc2hvd1N0YXRlLm9wYWNpdHk7XG59O1xuXG4vKipcbiAqIERldGVybWluZXMgdGhlIG5vZGUncyBwcmV2aW91c2x5IHNldCBtb3VudCBwb2ludC5cbiAqXG4gKiBAbWV0aG9kIGdldE1vdW50UG9pbnRcbiAqXG4gKiBAcmV0dXJuIHtGbG9hdDMyQXJyYXl9ICAgQW4gYXJyYXkgcmVwcmVzZW50aW5nIHRoZSBtb3VudCBwb2ludC5cbiAqL1xuTm9kZS5wcm90b3R5cGUuZ2V0TW91bnRQb2ludCA9IGZ1bmN0aW9uIGdldE1vdW50UG9pbnQgKCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlLm9mZnNldHMubW91bnRQb2ludDtcbn07XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB0aGUgbm9kZSdzIHByZXZpb3VzbHkgc2V0IGFsaWduLlxuICpcbiAqIEBtZXRob2QgZ2V0QWxpZ25cbiAqXG4gKiBAcmV0dXJuIHtGbG9hdDMyQXJyYXl9ICAgQW4gYXJyYXkgcmVwcmVzZW50aW5nIHRoZSBhbGlnbi5cbiAqL1xuTm9kZS5wcm90b3R5cGUuZ2V0QWxpZ24gPSBmdW5jdGlvbiBnZXRBbGlnbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMudmFsdWUub2Zmc2V0cy5hbGlnbjtcbn07XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB0aGUgbm9kZSdzIHByZXZpb3VzbHkgc2V0IG9yaWdpbi5cbiAqXG4gKiBAbWV0aG9kIGdldE9yaWdpblxuICpcbiAqIEByZXR1cm4ge0Zsb2F0MzJBcnJheX0gICBBbiBhcnJheSByZXByZXNlbnRpbmcgdGhlIG9yaWdpbi5cbiAqL1xuTm9kZS5wcm90b3R5cGUuZ2V0T3JpZ2luID0gZnVuY3Rpb24gZ2V0T3JpZ2luICgpIHtcbiAgICByZXR1cm4gdGhpcy52YWx1ZS5vZmZzZXRzLm9yaWdpbjtcbn07XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB0aGUgbm9kZSdzIHByZXZpb3VzbHkgc2V0IHBvc2l0aW9uLlxuICpcbiAqIEBtZXRob2QgZ2V0UG9zaXRpb25cbiAqXG4gKiBAcmV0dXJuIHtGbG9hdDMyQXJyYXl9ICAgQW4gYXJyYXkgcmVwcmVzZW50aW5nIHRoZSBwb3NpdGlvbi5cbiAqL1xuTm9kZS5wcm90b3R5cGUuZ2V0UG9zaXRpb24gPSBmdW5jdGlvbiBnZXRQb3NpdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMudmFsdWUudmVjdG9ycy5wb3NpdGlvbjtcbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgbm9kZSdzIGN1cnJlbnQgcm90YXRpb25cbiAqXG4gKiBAbWV0aG9kIGdldFJvdGF0aW9uXG4gKlxuICogQHJldHVybiB7RmxvYXQzMkFycmF5fSBhbiBhcnJheSBvZiBmb3VyIHZhbHVlcywgc2hvd2luZyB0aGUgcm90YXRpb24gYXMgYSBxdWF0ZXJuaW9uXG4gKi9cbk5vZGUucHJvdG90eXBlLmdldFJvdGF0aW9uID0gZnVuY3Rpb24gZ2V0Um90YXRpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlLnZlY3RvcnMucm90YXRpb247XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIHNjYWxlIG9mIHRoZSBub2RlXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge0Zsb2F0MzJBcnJheX0gYW4gYXJyYXkgc2hvd2luZyB0aGUgY3VycmVudCBzY2FsZSB2ZWN0b3JcbiAqL1xuTm9kZS5wcm90b3R5cGUuZ2V0U2NhbGUgPSBmdW5jdGlvbiBnZXRTY2FsZSAoKSB7XG4gICAgcmV0dXJuIHRoaXMudmFsdWUudmVjdG9ycy5zY2FsZTtcbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgY3VycmVudCBzaXplIG1vZGUgb2YgdGhlIG5vZGVcbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7RmxvYXQzMkFycmF5fSBhbiBhcnJheSBvZiBudW1iZXJzIHNob3dpbmcgdGhlIGN1cnJlbnQgc2l6ZSBtb2RlXG4gKi9cbk5vZGUucHJvdG90eXBlLmdldFNpemVNb2RlID0gZnVuY3Rpb24gZ2V0U2l6ZU1vZGUgKCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlLnNpemUuc2l6ZU1vZGU7XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIGN1cnJlbnQgcHJvcG9ydGlvbmFsIHNpemVcbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7RmxvYXQzMkFycmF5fSBhIHZlY3RvciAzIHNob3dpbmcgdGhlIGN1cnJlbnQgcHJvcG9ydGlvbmFsIHNpemVcbiAqL1xuTm9kZS5wcm90b3R5cGUuZ2V0UHJvcG9ydGlvbmFsU2l6ZSA9IGZ1bmN0aW9uIGdldFByb3BvcnRpb25hbFNpemUgKCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlLnNpemUucHJvcG9ydGlvbmFsO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBkaWZmZXJlbnRpYWwgc2l6ZSBvZiB0aGUgbm9kZVxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtGbG9hdDMyQXJyYXl9IGEgdmVjdG9yIDMgc2hvd2luZyB0aGUgY3VycmVudCBkaWZmZXJlbnRpYWwgc2l6ZVxuICovXG5Ob2RlLnByb3RvdHlwZS5nZXREaWZmZXJlbnRpYWxTaXplID0gZnVuY3Rpb24gZ2V0RGlmZmVyZW50aWFsU2l6ZSAoKSB7XG4gICAgcmV0dXJuIHRoaXMudmFsdWUuc2l6ZS5kaWZmZXJlbnRpYWw7XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIGFic29sdXRlIHNpemUgb2YgdGhlIG5vZGVcbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7RmxvYXQzMkFycmF5fSBhIHZlY3RvciAzIHNob3dpbmcgdGhlIGN1cnJlbnQgYWJzb2x1dGUgc2l6ZSBvZiB0aGUgbm9kZVxuICovXG5Ob2RlLnByb3RvdHlwZS5nZXRBYnNvbHV0ZVNpemUgPSBmdW5jdGlvbiBnZXRBYnNvbHV0ZVNpemUgKCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlLnNpemUuYWJzb2x1dGU7XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIGN1cnJlbnQgUmVuZGVyIFNpemUgb2YgdGhlIG5vZGUuIE5vdGUgdGhhdCB0aGUgcmVuZGVyIHNpemVcbiAqIGlzIGFzeW5jaHJvbm91cyAod2lsbCBhbHdheXMgYmUgb25lIGZyYW1lIGJlaGluZCkgYW5kIG5lZWRzIHRvIGJlIGV4cGxpY2l0ZWx5XG4gKiBjYWxjdWxhdGVkIGJ5IHNldHRpbmcgdGhlIHByb3BlciBzaXplIG1vZGUuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge0Zsb2F0MzJBcnJheX0gYSB2ZWN0b3IgMyBzaG93aW5nIHRoZSBjdXJyZW50IHJlbmRlciBzaXplXG4gKi9cbk5vZGUucHJvdG90eXBlLmdldFJlbmRlclNpemUgPSBmdW5jdGlvbiBnZXRSZW5kZXJTaXplICgpIHtcbiAgICByZXR1cm4gdGhpcy52YWx1ZS5zaXplLnJlbmRlcjtcbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgZXh0ZXJuYWwgc2l6ZSBvZiB0aGUgbm9kZVxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtGbG9hdDMyQXJyYXl9IGEgdmVjdG9yIDMgb2YgdGhlIGZpbmFsIGNhbGN1bGF0ZWQgc2lkZSBvZiB0aGUgbm9kZVxuICovXG5Ob2RlLnByb3RvdHlwZS5nZXRTaXplID0gZnVuY3Rpb24gZ2V0U2l6ZSAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NhbGN1bGF0ZWRWYWx1ZXMuc2l6ZTtcbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgY3VycmVudCB3b3JsZCB0cmFuc2Zvcm0gb2YgdGhlIG5vZGVcbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7RmxvYXQzMkFycmF5fSBhIDE2IHZhbHVlIHRyYW5zZm9ybVxuICovXG5Ob2RlLnByb3RvdHlwZS5nZXRUcmFuc2Zvcm0gPSBmdW5jdGlvbiBnZXRUcmFuc2Zvcm0gKCkge1xuICAgIHJldHVybiB0aGlzLl9jYWxjdWxhdGVkVmFsdWVzLnRyYW5zZm9ybTtcbn07XG5cbi8qKlxuICogR2V0IHRoZSBsaXN0IG9mIHRoZSBVSSBFdmVudHMgdGhhdCBhcmUgY3VycmVudGx5IGFzc29jaWF0ZWQgd2l0aCB0aGlzIG5vZGVcbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7QXJyYXl9IGFuIGFycmF5IG9mIHN0cmluZ3MgcmVwcmVzZW50aW5nIHRoZSBjdXJyZW50IHN1YnNjcmliZWQgVUkgZXZlbnQgb2YgdGhpcyBub2RlXG4gKi9cbk5vZGUucHJvdG90eXBlLmdldFVJRXZlbnRzID0gZnVuY3Rpb24gZ2V0VUlFdmVudHMgKCkge1xuICAgIHJldHVybiB0aGlzLnZhbHVlLlVJRXZlbnRzO1xufTtcblxuLyoqXG4gKiBBZGRzIGEgbmV3IGNoaWxkIHRvIHRoaXMgbm9kZS4gSWYgdGhpcyBtZXRob2QgaXMgY2FsbGVkIHdpdGggbm8gYXJndW1lbnQgaXQgd2lsbFxuICogY3JlYXRlIGEgbmV3IG5vZGUsIGhvd2V2ZXIgaXQgY2FuIGFsc28gYmUgY2FsbGVkIHdpdGggYW4gZXhpc3Rpbmcgbm9kZSB3aGljaCBpdCB3aWxsXG4gKiBhcHBlbmQgdG8gdGhlIG5vZGUgdGhhdCB0aGlzIG1ldGhvZCBpcyBiZWluZyBjYWxsZWQgb24uIFJldHVybnMgdGhlIG5ldyBvciBwYXNzZWQgaW4gbm9kZS5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtOb2RlIHwgdm9pZH0gY2hpbGQgdGhlIG5vZGUgdG8gYXBwZW5kZWQgb3Igbm8gbm9kZSB0byBjcmVhdGUgYSBuZXcgbm9kZS5cbiAqXG4gKiBAcmV0dXJuIHtOb2RlfSB0aGUgYXBwZW5kZWQgbm9kZS5cbiAqL1xuTm9kZS5wcm90b3R5cGUuYWRkQ2hpbGQgPSBmdW5jdGlvbiBhZGRDaGlsZCAoY2hpbGQpIHtcbiAgICB2YXIgaW5kZXggPSBjaGlsZCA/IHRoaXMuX2NoaWxkcmVuLmluZGV4T2YoY2hpbGQpIDogLTE7XG4gICAgY2hpbGQgPSBjaGlsZCA/IGNoaWxkIDogbmV3IE5vZGUoKTtcblxuICAgIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICAgICAgaW5kZXggPSB0aGlzLl9mcmVlZENoaWxkSW5kaWNpZXMubGVuZ3RoID8gdGhpcy5fZnJlZWRDaGlsZEluZGljaWVzLnBvcCgpIDogdGhpcy5fY2hpbGRyZW4ubGVuZ3RoO1xuICAgICAgICB0aGlzLl9jaGlsZHJlbltpbmRleF0gPSBjaGlsZDtcblxuICAgICAgICBpZiAodGhpcy5pc01vdW50ZWQoKSAmJiBjaGlsZC5vbk1vdW50KSB7XG4gICAgICAgICAgICB2YXIgbXlJZCA9IHRoaXMuZ2V0SWQoKTtcbiAgICAgICAgICAgIHZhciBjaGlsZElkID0gbXlJZCArICcvJyArIGluZGV4O1xuICAgICAgICAgICAgY2hpbGQub25Nb3VudCh0aGlzLCBjaGlsZElkKTtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgcmV0dXJuIGNoaWxkO1xufTtcblxuLyoqXG4gKiBSZW1vdmVzIGEgY2hpbGQgbm9kZSBmcm9tIGFub3RoZXIgbm9kZS4gVGhlIHBhc3NlZCBpbiBub2RlIG11c3QgYmVcbiAqIGEgY2hpbGQgb2YgdGhlIG5vZGUgdGhhdCB0aGlzIG1ldGhvZCBpcyBjYWxsZWQgdXBvbi5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtOb2RlfSBjaGlsZCBub2RlIHRvIGJlIHJlbW92ZWRcbiAqXG4gKiBAcmV0dXJuIHtCb29sZWFufSB3aGV0aGVyIG9yIG5vdCB0aGUgbm9kZSB3YXMgc3VjY2Vzc2Z1bGx5IHJlbW92ZWRcbiAqL1xuTm9kZS5wcm90b3R5cGUucmVtb3ZlQ2hpbGQgPSBmdW5jdGlvbiByZW1vdmVDaGlsZCAoY2hpbGQpIHtcbiAgICB2YXIgaW5kZXggPSB0aGlzLl9jaGlsZHJlbi5pbmRleE9mKGNoaWxkKTtcbiAgICB2YXIgYWRkZWQgPSBpbmRleCAhPT0gLTE7XG4gICAgaWYgKGFkZGVkKSB7XG4gICAgICAgIHRoaXMuX2ZyZWVkQ2hpbGRJbmRpY2llcy5wdXNoKGluZGV4KTtcblxuICAgICAgICB0aGlzLl9jaGlsZHJlbltpbmRleF0gPSBudWxsO1xuXG4gICAgICAgIGlmICh0aGlzLmlzTW91bnRlZCgpICYmIGNoaWxkLm9uRGlzbW91bnQpXG4gICAgICAgICAgICBjaGlsZC5vbkRpc21vdW50KCk7XG4gICAgfVxuICAgIHJldHVybiBhZGRlZDtcbn07XG5cbi8qKlxuICogRWFjaCBjb21wb25lbnQgY2FuIG9ubHkgYmUgYWRkZWQgb25jZSBwZXIgbm9kZS5cbiAqXG4gKiBAbWV0aG9kIGFkZENvbXBvbmVudFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBjb21wb25lbnQgICAgQSBjb21wb25lbnQgdG8gYmUgYWRkZWQuXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IGluZGV4ICAgICAgIFRoZSBpbmRleCBhdCB3aGljaCB0aGUgY29tcG9uZW50IGhhcyBiZWVuXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZ2lzdGVyZWQuIEluZGljZXMgYXJlbid0IG5lY2Vzc2FyaWx5XG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNlY3V0aXZlLlxuICovXG5Ob2RlLnByb3RvdHlwZS5hZGRDb21wb25lbnQgPSBmdW5jdGlvbiBhZGRDb21wb25lbnQgKGNvbXBvbmVudCkge1xuICAgIHZhciBpbmRleCA9IHRoaXMuX2NvbXBvbmVudHMuaW5kZXhPZihjb21wb25lbnQpO1xuICAgIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICAgICAgaW5kZXggPSB0aGlzLl9mcmVlZENvbXBvbmVudEluZGljaWVzLmxlbmd0aCA/IHRoaXMuX2ZyZWVkQ29tcG9uZW50SW5kaWNpZXMucG9wKCkgOiB0aGlzLl9jb21wb25lbnRzLmxlbmd0aDtcbiAgICAgICAgdGhpcy5fY29tcG9uZW50c1tpbmRleF0gPSBjb21wb25lbnQ7XG5cbiAgICAgICAgaWYgKHRoaXMuaXNNb3VudGVkKCkgJiYgY29tcG9uZW50Lm9uTW91bnQpXG4gICAgICAgICAgICBjb21wb25lbnQub25Nb3VudCh0aGlzLCBpbmRleCk7XG5cbiAgICAgICAgaWYgKHRoaXMuaXNTaG93bigpICYmIGNvbXBvbmVudC5vblNob3cpXG4gICAgICAgICAgICBjb21wb25lbnQub25TaG93KCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGluZGV4O1xufTtcblxuLyoqXG4gKiBAbWV0aG9kICBnZXRDb21wb25lbnRcbiAqXG4gKiBAcGFyYW0gIHtOdW1iZXJ9IGluZGV4ICAgSW5kZXggYXQgd2hpY2ggdGhlIGNvbXBvbmVudCBoYXMgYmVlbiByZWdpc3RlcmVkXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgKHVzaW5nIGBOb2RlI2FkZENvbXBvbmVudGApLlxuICogQHJldHVybiB7Kn0gICAgICAgICAgICAgIFRoZSBjb21wb25lbnQgcmVnaXN0ZXJlZCBhdCB0aGUgcGFzc2VkIGluIGluZGV4IChpZlxuICogICAgICAgICAgICAgICAgICAgICAgICAgIGFueSkuXG4gKi9cbk5vZGUucHJvdG90eXBlLmdldENvbXBvbmVudCA9IGZ1bmN0aW9uIGdldENvbXBvbmVudCAoaW5kZXgpIHtcbiAgICByZXR1cm4gdGhpcy5fY29tcG9uZW50c1tpbmRleF07XG59O1xuXG4vKipcbiAqIFJlbW92ZXMgYSBwcmV2aW91c2x5IHZpYSB7QGxpbmsgTm9kZSNhZGRDb21wb25lbnR9IGFkZGVkIGNvbXBvbmVudC5cbiAqXG4gKiBAbWV0aG9kIHJlbW92ZUNvbXBvbmVudFxuICpcbiAqIEBwYXJhbSAge09iamVjdH0gY29tcG9uZW50ICAgQW4gY29tcG9uZW50IHRoYXQgaGFzIHByZXZpb3VzbHkgYmVlbiBhZGRlZFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2luZyB7QGxpbmsgTm9kZSNhZGRDb21wb25lbnR9LlxuICpcbiAqIEByZXR1cm4ge05vZGV9IHRoaXNcbiAqL1xuTm9kZS5wcm90b3R5cGUucmVtb3ZlQ29tcG9uZW50ID0gZnVuY3Rpb24gcmVtb3ZlQ29tcG9uZW50IChjb21wb25lbnQpIHtcbiAgICB2YXIgaW5kZXggPSB0aGlzLl9jb21wb25lbnRzLmluZGV4T2YoY29tcG9uZW50KTtcbiAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICAgIHRoaXMuX2ZyZWVkQ29tcG9uZW50SW5kaWNpZXMucHVzaChpbmRleCk7XG4gICAgICAgIGlmICh0aGlzLmlzU2hvd24oKSAmJiBjb21wb25lbnQub25IaWRlKVxuICAgICAgICAgICAgY29tcG9uZW50Lm9uSGlkZSgpO1xuXG4gICAgICAgIGlmICh0aGlzLmlzTW91bnRlZCgpICYmIGNvbXBvbmVudC5vbkRpc21vdW50KVxuICAgICAgICAgICAgY29tcG9uZW50Lm9uRGlzbW91bnQoKTtcblxuICAgICAgICB0aGlzLl9jb21wb25lbnRzW2luZGV4XSA9IG51bGw7XG4gICAgfVxuICAgIHJldHVybiBjb21wb25lbnQ7XG59O1xuXG4vKipcbiAqIFN1YnNjcmliZXMgYSBub2RlIHRvIGEgVUkgRXZlbnQuIEFsbCBjb21wb25lbnRzIG9uIHRoZSBub2RlXG4gKiB3aWxsIGhhdmUgdGhlIG9wcG9ydHVuaXR5IHRvIGJlZ2luIGxpc3RlbmluZyB0byB0aGF0IGV2ZW50XG4gKiBhbmQgYWxlcnRpbmcgdGhlIHNjZW5lIGdyYXBoLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnROYW1lIHRoZSBuYW1lIG9mIHRoZSBldmVudFxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbk5vZGUucHJvdG90eXBlLmFkZFVJRXZlbnQgPSBmdW5jdGlvbiBhZGRVSUV2ZW50IChldmVudE5hbWUpIHtcbiAgICB2YXIgVUlFdmVudHMgPSB0aGlzLmdldFVJRXZlbnRzKCk7XG4gICAgdmFyIGNvbXBvbmVudHMgPSB0aGlzLl9jb21wb25lbnRzO1xuICAgIHZhciBjb21wb25lbnQ7XG5cbiAgICB2YXIgYWRkZWQgPSBVSUV2ZW50cy5pbmRleE9mKGV2ZW50TmFtZSkgIT09IC0xO1xuICAgIGlmICghYWRkZWQpIHtcbiAgICAgICAgVUlFdmVudHMucHVzaChldmVudE5hbWUpO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gY29tcG9uZW50cy5sZW5ndGggOyBpIDwgbGVuIDsgaSsrKSB7XG4gICAgICAgICAgICBjb21wb25lbnQgPSBjb21wb25lbnRzW2ldO1xuICAgICAgICAgICAgaWYgKGNvbXBvbmVudCAmJiBjb21wb25lbnQub25BZGRVSUV2ZW50KSBjb21wb25lbnQub25BZGRVSUV2ZW50KGV2ZW50TmFtZSk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG4vKipcbiAqIFByaXZhdGUgbWV0aG9kIGZvciB0aGUgTm9kZSB0byByZXF1ZXN0IGFuIHVwZGF0ZSBmb3IgaXRzZWxmLlxuICpcbiAqIEBtZXRob2RcbiAqIEBwcml2YXRlXG4gKlxuICogQHBhcmFtIHtCb29sZWFufSBmb3JjZSB3aGV0aGVyIG9yIG5vdCB0byBmb3JjZSB0aGUgdXBkYXRlXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuTm9kZS5wcm90b3R5cGUuX3JlcXVlc3RVcGRhdGUgPSBmdW5jdGlvbiBfcmVxdWVzdFVwZGF0ZSAoZm9yY2UpIHtcbiAgICBpZiAoZm9yY2UgfHwgKCF0aGlzLl9yZXF1ZXN0aW5nVXBkYXRlICYmIHRoaXMuX2dsb2JhbFVwZGF0ZXIpKSB7XG4gICAgICAgIHRoaXMuX2dsb2JhbFVwZGF0ZXIucmVxdWVzdFVwZGF0ZSh0aGlzKTtcbiAgICAgICAgdGhpcy5fcmVxdWVzdGluZ1VwZGF0ZSA9IHRydWU7XG4gICAgfVxufTtcblxuLyoqXG4gKiBQcml2YXRlIG1ldGhvZCB0byBzZXQgYW4gb3B0aW9uYWwgdmFsdWUgaW4gYW4gYXJyYXksIGFuZFxuICogcmVxdWVzdCBhbiB1cGRhdGUgaWYgdGhpcyBjaGFuZ2VzIHRoZSB2YWx1ZSBvZiB0aGUgYXJyYXkuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IHZlYyB0aGUgYXJyYXkgdG8gaW5zZXJ0IHRoZSB2YWx1ZSBpbnRvXG4gKiBAcGFyYW0ge051bWJlcn0gaW5kZXggdGhlIGluZGV4IGF0IHdoaWNoIHRvIGluc2VydCB0aGUgdmFsdWVcbiAqIEBwYXJhbSB7QW55fSB2YWwgdGhlIHZhbHVlIHRvIHBvdGVudGlhbGx5IGluc2VydCAoaWYgbm90IG51bGwgb3IgdW5kZWZpbmVkKVxuICpcbiAqIEByZXR1cm4ge0Jvb2xlYW59IHdoZXRoZXIgb3Igbm90IGEgbmV3IHZhbHVlIHdhcyBpbnNlcnRlZC5cbiAqL1xuTm9kZS5wcm90b3R5cGUuX3ZlY09wdGlvbmFsU2V0ID0gZnVuY3Rpb24gX3ZlY09wdGlvbmFsU2V0ICh2ZWMsIGluZGV4LCB2YWwpIHtcbiAgICBpZiAodmFsICE9IG51bGwgJiYgdmVjW2luZGV4XSAhPT0gdmFsKSB7XG4gICAgICAgIHZlY1tpbmRleF0gPSB2YWw7XG4gICAgICAgIGlmICghdGhpcy5fcmVxdWVzdGluZ1VwZGF0ZSkgdGhpcy5fcmVxdWVzdFVwZGF0ZSgpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufTtcblxuLyoqXG4gKiBTaG93cyB0aGUgbm9kZSwgd2hpY2ggaXMgdG8gc2F5LCBjYWxscyBvblNob3cgb24gYWxsIG9mIHRoZVxuICogbm9kZSdzIGNvbXBvbmVudHMuIFJlbmRlcmFibGUgY29tcG9uZW50cyBjYW4gdGhlbiBpc3N1ZSB0aGVcbiAqIGRyYXcgY29tbWFuZHMgbmVjZXNzYXJ5IHRvIGJlIHNob3duLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtOb2RlfSB0aGlzXG4gKi9cbk5vZGUucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbiBzaG93ICgpIHtcbiAgICB2YXIgaSA9IDA7XG4gICAgdmFyIGl0ZW1zID0gdGhpcy5fY29tcG9uZW50cztcbiAgICB2YXIgbGVuID0gaXRlbXMubGVuZ3RoO1xuICAgIHZhciBpdGVtO1xuXG4gICAgdGhpcy52YWx1ZS5zaG93U3RhdGUuc2hvd24gPSB0cnVlO1xuXG4gICAgZm9yICg7IGkgPCBsZW4gOyBpKyspIHtcbiAgICAgICAgaXRlbSA9IGl0ZW1zW2ldO1xuICAgICAgICBpZiAoaXRlbSAmJiBpdGVtLm9uU2hvdykgaXRlbS5vblNob3coKTtcbiAgICB9XG5cbiAgICBpID0gMDtcbiAgICBpdGVtcyA9IHRoaXMuX2NoaWxkcmVuO1xuICAgIGxlbiA9IGl0ZW1zLmxlbmd0aDtcblxuICAgIGZvciAoOyBpIDwgbGVuIDsgaSsrKSB7XG4gICAgICAgIGl0ZW0gPSBpdGVtc1tpXTtcbiAgICAgICAgaWYgKGl0ZW0gJiYgaXRlbS5vblBhcmVudFNob3cpIGl0ZW0ub25QYXJlbnRTaG93KCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBIaWRlcyB0aGUgbm9kZSwgd2hpY2ggaXMgdG8gc2F5LCBjYWxscyBvbkhpZGUgb24gYWxsIG9mIHRoZVxuICogbm9kZSdzIGNvbXBvbmVudHMuIFJlbmRlcmFibGUgY29tcG9uZW50cyBjYW4gdGhlbiBpc3N1ZVxuICogdGhlIGRyYXcgY29tbWFuZHMgbmVjZXNzYXJ5IHRvIGJlIGhpZGRlblxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtOb2RlfSB0aGlzXG4gKi9cbk5vZGUucHJvdG90eXBlLmhpZGUgPSBmdW5jdGlvbiBoaWRlICgpIHtcbiAgICB2YXIgaSA9IDA7XG4gICAgdmFyIGl0ZW1zID0gdGhpcy5fY29tcG9uZW50cztcbiAgICB2YXIgbGVuID0gaXRlbXMubGVuZ3RoO1xuICAgIHZhciBpdGVtO1xuXG4gICAgdGhpcy52YWx1ZS5zaG93U3RhdGUuc2hvd24gPSBmYWxzZTtcblxuICAgIGZvciAoOyBpIDwgbGVuIDsgaSsrKSB7XG4gICAgICAgIGl0ZW0gPSBpdGVtc1tpXTtcbiAgICAgICAgaWYgKGl0ZW0gJiYgaXRlbS5vbkhpZGUpIGl0ZW0ub25IaWRlKCk7XG4gICAgfVxuXG4gICAgaSA9IDA7XG4gICAgaXRlbXMgPSB0aGlzLl9jaGlsZHJlbjtcbiAgICBsZW4gPSBpdGVtcy5sZW5ndGg7XG5cbiAgICBmb3IgKDsgaSA8IGxlbiA7IGkrKykge1xuICAgICAgICBpdGVtID0gaXRlbXNbaV07XG4gICAgICAgIGlmIChpdGVtICYmIGl0ZW0ub25QYXJlbnRIaWRlKSBpdGVtLm9uUGFyZW50SGlkZSgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU2V0cyB0aGUgYWxpZ24gdmFsdWUgb2YgdGhlIG5vZGUuIFdpbGwgY2FsbCBvbkFsaWduQ2hhbmdlXG4gKiBvbiBhbGwgb2YgdGhlIE5vZGUncyBjb21wb25lbnRzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0geCBBbGlnbiB2YWx1ZSBpbiB0aGUgeCBkaW1lbnNpb24uXG4gKiBAcGFyYW0ge051bWJlcn0geSBBbGlnbiB2YWx1ZSBpbiB0aGUgeSBkaW1lbnNpb24uXG4gKiBAcGFyYW0ge051bWJlcn0geiBBbGlnbiB2YWx1ZSBpbiB0aGUgeiBkaW1lbnNpb24uXG4gKlxuICogQHJldHVybiB7Tm9kZX0gdGhpc1xuICovXG5Ob2RlLnByb3RvdHlwZS5zZXRBbGlnbiA9IGZ1bmN0aW9uIHNldEFsaWduICh4LCB5LCB6KSB7XG4gICAgdmFyIHZlYzMgPSB0aGlzLnZhbHVlLm9mZnNldHMuYWxpZ247XG4gICAgdmFyIHByb3BvZ2F0ZSA9IGZhbHNlO1xuXG4gICAgcHJvcG9nYXRlID0gdGhpcy5fdmVjT3B0aW9uYWxTZXQodmVjMywgMCwgeCkgfHwgcHJvcG9nYXRlO1xuICAgIHByb3BvZ2F0ZSA9IHRoaXMuX3ZlY09wdGlvbmFsU2V0KHZlYzMsIDEsIHkpIHx8IHByb3BvZ2F0ZTtcbiAgICBpZiAoeiAhPSBudWxsKSBwcm9wb2dhdGUgPSB0aGlzLl92ZWNPcHRpb25hbFNldCh2ZWMzLCAyLCAoeiAtIDAuNSkpIHx8IHByb3BvZ2F0ZTtcblxuICAgIGlmIChwcm9wb2dhdGUpIHtcbiAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICB2YXIgbGlzdCA9IHRoaXMuX2NvbXBvbmVudHM7XG4gICAgICAgIHZhciBsZW4gPSBsaXN0Lmxlbmd0aDtcbiAgICAgICAgdmFyIGl0ZW07XG4gICAgICAgIHggPSB2ZWMzWzBdO1xuICAgICAgICB5ID0gdmVjM1sxXTtcbiAgICAgICAgeiA9IHZlYzNbMl07XG4gICAgICAgIGZvciAoOyBpIDwgbGVuIDsgaSsrKSB7XG4gICAgICAgICAgICBpdGVtID0gbGlzdFtpXTtcbiAgICAgICAgICAgIGlmIChpdGVtICYmIGl0ZW0ub25BbGlnbkNoYW5nZSkgaXRlbS5vbkFsaWduQ2hhbmdlKHgsIHksIHopO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTZXRzIHRoZSBtb3VudCBwb2ludCB2YWx1ZSBvZiB0aGUgbm9kZS4gV2lsbCBjYWxsIG9uTW91bnRQb2ludENoYW5nZVxuICogb24gYWxsIG9mIHRoZSBub2RlJ3MgY29tcG9uZW50cy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHggTW91bnRQb2ludCB2YWx1ZSBpbiB4IGRpbWVuc2lvblxuICogQHBhcmFtIHtOdW1iZXJ9IHkgTW91bnRQb2ludCB2YWx1ZSBpbiB5IGRpbWVuc2lvblxuICogQHBhcmFtIHtOdW1iZXJ9IHogTW91bnRQb2ludCB2YWx1ZSBpbiB6IGRpbWVuc2lvblxuICpcbiAqIEByZXR1cm4ge05vZGV9IHRoaXNcbiAqL1xuTm9kZS5wcm90b3R5cGUuc2V0TW91bnRQb2ludCA9IGZ1bmN0aW9uIHNldE1vdW50UG9pbnQgKHgsIHksIHopIHtcbiAgICB2YXIgdmVjMyA9IHRoaXMudmFsdWUub2Zmc2V0cy5tb3VudFBvaW50O1xuICAgIHZhciBwcm9wb2dhdGUgPSBmYWxzZTtcblxuICAgIHByb3BvZ2F0ZSA9IHRoaXMuX3ZlY09wdGlvbmFsU2V0KHZlYzMsIDAsIHgpIHx8IHByb3BvZ2F0ZTtcbiAgICBwcm9wb2dhdGUgPSB0aGlzLl92ZWNPcHRpb25hbFNldCh2ZWMzLCAxLCB5KSB8fCBwcm9wb2dhdGU7XG4gICAgaWYgKHogIT0gbnVsbCkgcHJvcG9nYXRlID0gdGhpcy5fdmVjT3B0aW9uYWxTZXQodmVjMywgMiwgKHogLSAwLjUpKSB8fCBwcm9wb2dhdGU7XG5cbiAgICBpZiAocHJvcG9nYXRlKSB7XG4gICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgdmFyIGxpc3QgPSB0aGlzLl9jb21wb25lbnRzO1xuICAgICAgICB2YXIgbGVuID0gbGlzdC5sZW5ndGg7XG4gICAgICAgIHZhciBpdGVtO1xuICAgICAgICB4ID0gdmVjM1swXTtcbiAgICAgICAgeSA9IHZlYzNbMV07XG4gICAgICAgIHogPSB2ZWMzWzJdO1xuICAgICAgICBmb3IgKDsgaSA8IGxlbiA7IGkrKykge1xuICAgICAgICAgICAgaXRlbSA9IGxpc3RbaV07XG4gICAgICAgICAgICBpZiAoaXRlbSAmJiBpdGVtLm9uTW91bnRQb2ludENoYW5nZSkgaXRlbS5vbk1vdW50UG9pbnRDaGFuZ2UoeCwgeSwgeik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFNldHMgdGhlIG9yaWdpbiB2YWx1ZSBvZiB0aGUgbm9kZS4gV2lsbCBjYWxsIG9uT3JpZ2luQ2hhbmdlXG4gKiBvbiBhbGwgb2YgdGhlIG5vZGUncyBjb21wb25lbnRzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0geCBPcmlnaW4gdmFsdWUgaW4geCBkaW1lbnNpb25cbiAqIEBwYXJhbSB7TnVtYmVyfSB5IE9yaWdpbiB2YWx1ZSBpbiB5IGRpbWVuc2lvblxuICogQHBhcmFtIHtOdW1iZXJ9IHogT3JpZ2luIHZhbHVlIGluIHogZGltZW5zaW9uXG4gKlxuICogQHJldHVybiB7Tm9kZX0gdGhpc1xuICovXG5Ob2RlLnByb3RvdHlwZS5zZXRPcmlnaW4gPSBmdW5jdGlvbiBzZXRPcmlnaW4gKHgsIHksIHopIHtcbiAgICB2YXIgdmVjMyA9IHRoaXMudmFsdWUub2Zmc2V0cy5vcmlnaW47XG4gICAgdmFyIHByb3BvZ2F0ZSA9IGZhbHNlO1xuXG4gICAgcHJvcG9nYXRlID0gdGhpcy5fdmVjT3B0aW9uYWxTZXQodmVjMywgMCwgeCkgfHwgcHJvcG9nYXRlO1xuICAgIHByb3BvZ2F0ZSA9IHRoaXMuX3ZlY09wdGlvbmFsU2V0KHZlYzMsIDEsIHkpIHx8IHByb3BvZ2F0ZTtcbiAgICBpZiAoeiAhPSBudWxsKSBwcm9wb2dhdGUgPSB0aGlzLl92ZWNPcHRpb25hbFNldCh2ZWMzLCAyLCAoeiAtIDAuNSkpIHx8IHByb3BvZ2F0ZTtcblxuICAgIGlmIChwcm9wb2dhdGUpIHtcbiAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICB2YXIgbGlzdCA9IHRoaXMuX2NvbXBvbmVudHM7XG4gICAgICAgIHZhciBsZW4gPSBsaXN0Lmxlbmd0aDtcbiAgICAgICAgdmFyIGl0ZW07XG4gICAgICAgIHggPSB2ZWMzWzBdO1xuICAgICAgICB5ID0gdmVjM1sxXTtcbiAgICAgICAgeiA9IHZlYzNbMl07XG4gICAgICAgIGZvciAoOyBpIDwgbGVuIDsgaSsrKSB7XG4gICAgICAgICAgICBpdGVtID0gbGlzdFtpXTtcbiAgICAgICAgICAgIGlmIChpdGVtICYmIGl0ZW0ub25PcmlnaW5DaGFuZ2UpIGl0ZW0ub25PcmlnaW5DaGFuZ2UoeCwgeSwgeik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFNldHMgdGhlIHBvc2l0aW9uIG9mIHRoZSBub2RlLiBXaWxsIGNhbGwgb25Qb3NpdGlvbkNoYW5nZVxuICogb24gYWxsIG9mIHRoZSBub2RlJ3MgY29tcG9uZW50cy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHggUG9zaXRpb24gaW4geFxuICogQHBhcmFtIHtOdW1iZXJ9IHkgUG9zaXRpb24gaW4geVxuICogQHBhcmFtIHtOdW1iZXJ9IHogUG9zaXRpb24gaW4gelxuICpcbiAqIEByZXR1cm4ge05vZGV9IHRoaXNcbiAqL1xuTm9kZS5wcm90b3R5cGUuc2V0UG9zaXRpb24gPSBmdW5jdGlvbiBzZXRQb3NpdGlvbiAoeCwgeSwgeikge1xuICAgIHZhciB2ZWMzID0gdGhpcy52YWx1ZS52ZWN0b3JzLnBvc2l0aW9uO1xuICAgIHZhciBwcm9wb2dhdGUgPSBmYWxzZTtcblxuICAgIHByb3BvZ2F0ZSA9IHRoaXMuX3ZlY09wdGlvbmFsU2V0KHZlYzMsIDAsIHgpIHx8IHByb3BvZ2F0ZTtcbiAgICBwcm9wb2dhdGUgPSB0aGlzLl92ZWNPcHRpb25hbFNldCh2ZWMzLCAxLCB5KSB8fCBwcm9wb2dhdGU7XG4gICAgcHJvcG9nYXRlID0gdGhpcy5fdmVjT3B0aW9uYWxTZXQodmVjMywgMiwgeikgfHwgcHJvcG9nYXRlO1xuXG4gICAgaWYgKHByb3BvZ2F0ZSkge1xuICAgICAgICB2YXIgaSA9IDA7XG4gICAgICAgIHZhciBsaXN0ID0gdGhpcy5fY29tcG9uZW50cztcbiAgICAgICAgdmFyIGxlbiA9IGxpc3QubGVuZ3RoO1xuICAgICAgICB2YXIgaXRlbTtcbiAgICAgICAgeCA9IHZlYzNbMF07XG4gICAgICAgIHkgPSB2ZWMzWzFdO1xuICAgICAgICB6ID0gdmVjM1syXTtcbiAgICAgICAgZm9yICg7IGkgPCBsZW4gOyBpKyspIHtcbiAgICAgICAgICAgIGl0ZW0gPSBsaXN0W2ldO1xuICAgICAgICAgICAgaWYgKGl0ZW0gJiYgaXRlbS5vblBvc2l0aW9uQ2hhbmdlKSBpdGVtLm9uUG9zaXRpb25DaGFuZ2UoeCwgeSwgeik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU2V0cyB0aGUgcm90YXRpb24gb2YgdGhlIG5vZGUuIFdpbGwgY2FsbCBvblJvdGF0aW9uQ2hhbmdlXG4gKiBvbiBhbGwgb2YgdGhlIG5vZGUncyBjb21wb25lbnRzLiBUaGlzIG1ldGhvZCB0YWtlcyBlaXRoZXJcbiAqIEV1bGVyIGFuZ2xlcyBvciBhIHF1YXRlcm5pb24uIElmIHRoZSBmb3VydGggYXJndW1lbnQgaXMgdW5kZWZpbmVkXG4gKiBFdWxlciBhbmdsZXMgYXJlIGFzc3VtZWQuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB4IEVpdGhlciB0aGUgcm90YXRpb24gYXJvdW5kIHRoZSB4IGF4aXMgb3IgdGhlIG1hZ25pdHVkZSBpbiB4IG9mIHRoZSBheGlzIG9mIHJvdGF0aW9uLlxuICogQHBhcmFtIHtOdW1iZXJ9IHkgRWl0aGVyIHRoZSByb3RhdGlvbiBhcm91bmQgdGhlIHkgYXhpcyBvciB0aGUgbWFnbml0dWRlIGluIHkgb2YgdGhlIGF4aXMgb2Ygcm90YXRpb24uXG4gKiBAcGFyYW0ge051bWJlcn0geiBFaXRoZXIgdGhlIHJvdGF0aW9uIGFyb3VuZCB0aGUgeiBheGlzIG9yIHRoZSBtYWduaXR1ZGUgaW4geiBvZiB0aGUgYXhpcyBvZiByb3RhdGlvbi5cbiAqIEBwYXJhbSB7TnVtYmVyfHVuZGVmaW5lZH0gdyB0aGUgYW1vdW50IG9mIHJvdGF0aW9uIGFyb3VuZCB0aGUgYXhpcyBvZiByb3RhdGlvbiwgaWYgYSBxdWF0ZXJuaW9uIGlzIHNwZWNpZmllZC5cbiAqXG4gKiBAcmV0dXJuIHtOb2RlfSB0aGlzXG4gKi9cbk5vZGUucHJvdG90eXBlLnNldFJvdGF0aW9uID0gZnVuY3Rpb24gc2V0Um90YXRpb24gKHgsIHksIHosIHcpIHtcbiAgICB2YXIgcXVhdCA9IHRoaXMudmFsdWUudmVjdG9ycy5yb3RhdGlvbjtcbiAgICB2YXIgcHJvcG9nYXRlID0gZmFsc2U7XG4gICAgdmFyIHF4LCBxeSwgcXosIHF3O1xuXG4gICAgaWYgKHcgIT0gbnVsbCkge1xuICAgICAgICBxeCA9IHg7XG4gICAgICAgIHF5ID0geTtcbiAgICAgICAgcXogPSB6O1xuICAgICAgICBxdyA9IHc7XG4gICAgICAgIHRoaXMuX2xhc3RFdWxlclggPSBudWxsO1xuICAgICAgICB0aGlzLl9sYXN0RXVsZXJZID0gbnVsbDtcbiAgICAgICAgdGhpcy5fbGFzdEV1bGVyWiA9IG51bGw7XG4gICAgICAgIHRoaXMuX2xhc3RFdWxlciA9IGZhbHNlO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgaWYgKHggPT0gbnVsbCB8fCB5ID09IG51bGwgfHwgeiA9PSBudWxsKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fbGFzdEV1bGVyKSB7XG4gICAgICAgICAgICAgICAgeCA9IHggPT0gbnVsbCA/IHRoaXMuX2xhc3RFdWxlclggOiB4O1xuICAgICAgICAgICAgICAgIHkgPSB5ID09IG51bGwgPyB0aGlzLl9sYXN0RXVsZXJZIDogeTtcbiAgICAgICAgICAgICAgICB6ID0geiA9PSBudWxsID8gdGhpcy5fbGFzdEV1bGVyWiA6IHo7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgc3AgPSAtMiAqIChxdWF0WzFdICogcXVhdFsyXSAtIHF1YXRbM10gKiBxdWF0WzBdKTtcblxuICAgICAgICAgICAgICAgIGlmIChNYXRoLmFicyhzcCkgPiAwLjk5OTk5KSB7XG4gICAgICAgICAgICAgICAgICAgIHkgPSB5ID09IG51bGwgPyBNYXRoLlBJICogMC41ICogc3AgOiB5O1xuICAgICAgICAgICAgICAgICAgICB4ID0geCA9PSBudWxsID8gTWF0aC5hdGFuMigtcXVhdFswXSAqIHF1YXRbMl0gKyBxdWF0WzNdICogcXVhdFsxXSwgMC41IC0gcXVhdFsxXSAqIHF1YXRbMV0gLSBxdWF0WzJdICogcXVhdFsyXSkgOiB4O1xuICAgICAgICAgICAgICAgICAgICB6ID0geiA9PSBudWxsID8gMCA6IHo7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB5ID0geSA9PSBudWxsID8gTWF0aC5hc2luKHNwKSA6IHk7XG4gICAgICAgICAgICAgICAgICAgIHggPSB4ID09IG51bGwgPyBNYXRoLmF0YW4yKHF1YXRbMF0gKiBxdWF0WzJdICsgcXVhdFszXSAqIHF1YXRbMV0sIDAuNSAtIHF1YXRbMF0gKiBxdWF0WzBdIC0gcXVhdFsxXSAqIHF1YXRbMV0pIDogeDtcbiAgICAgICAgICAgICAgICAgICAgeiA9IHogPT0gbnVsbCA/IE1hdGguYXRhbjIocXVhdFswXSAqIHF1YXRbMV0gKyBxdWF0WzNdICogcXVhdFsyXSwgMC41IC0gcXVhdFswXSAqIHF1YXRbMF0gLSBxdWF0WzJdICogcXVhdFsyXSkgOiB6O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBoeCA9IHggKiAwLjU7XG4gICAgICAgIHZhciBoeSA9IHkgKiAwLjU7XG4gICAgICAgIHZhciBoeiA9IHogKiAwLjU7XG5cbiAgICAgICAgdmFyIHN4ID0gTWF0aC5zaW4oaHgpO1xuICAgICAgICB2YXIgc3kgPSBNYXRoLnNpbihoeSk7XG4gICAgICAgIHZhciBzeiA9IE1hdGguc2luKGh6KTtcbiAgICAgICAgdmFyIGN4ID0gTWF0aC5jb3MoaHgpO1xuICAgICAgICB2YXIgY3kgPSBNYXRoLmNvcyhoeSk7XG4gICAgICAgIHZhciBjeiA9IE1hdGguY29zKGh6KTtcblxuICAgICAgICB2YXIgc3lzeiA9IHN5ICogc3o7XG4gICAgICAgIHZhciBjeXN6ID0gY3kgKiBzejtcbiAgICAgICAgdmFyIHN5Y3ogPSBzeSAqIGN6O1xuICAgICAgICB2YXIgY3ljeiA9IGN5ICogY3o7XG5cbiAgICAgICAgcXggPSBzeCAqIGN5Y3ogKyBjeCAqIHN5c3o7XG4gICAgICAgIHF5ID0gY3ggKiBzeWN6IC0gc3ggKiBjeXN6O1xuICAgICAgICBxeiA9IGN4ICogY3lzeiArIHN4ICogc3ljejtcbiAgICAgICAgcXcgPSBjeCAqIGN5Y3ogLSBzeCAqIHN5c3o7XG5cbiAgICAgICAgdGhpcy5fbGFzdEV1bGVyID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5fbGFzdEV1bGVyWCA9IHg7XG4gICAgICAgIHRoaXMuX2xhc3RFdWxlclkgPSB5O1xuICAgICAgICB0aGlzLl9sYXN0RXVsZXJaID0gejtcbiAgICB9XG5cbiAgICBwcm9wb2dhdGUgPSB0aGlzLl92ZWNPcHRpb25hbFNldChxdWF0LCAwLCBxeCkgfHwgcHJvcG9nYXRlO1xuICAgIHByb3BvZ2F0ZSA9IHRoaXMuX3ZlY09wdGlvbmFsU2V0KHF1YXQsIDEsIHF5KSB8fCBwcm9wb2dhdGU7XG4gICAgcHJvcG9nYXRlID0gdGhpcy5fdmVjT3B0aW9uYWxTZXQocXVhdCwgMiwgcXopIHx8IHByb3BvZ2F0ZTtcbiAgICBwcm9wb2dhdGUgPSB0aGlzLl92ZWNPcHRpb25hbFNldChxdWF0LCAzLCBxdykgfHwgcHJvcG9nYXRlO1xuXG4gICAgaWYgKHByb3BvZ2F0ZSkge1xuICAgICAgICB2YXIgaSA9IDA7XG4gICAgICAgIHZhciBsaXN0ID0gdGhpcy5fY29tcG9uZW50cztcbiAgICAgICAgdmFyIGxlbiA9IGxpc3QubGVuZ3RoO1xuICAgICAgICB2YXIgaXRlbTtcbiAgICAgICAgeCA9IHF1YXRbMF07XG4gICAgICAgIHkgPSBxdWF0WzFdO1xuICAgICAgICB6ID0gcXVhdFsyXTtcbiAgICAgICAgdyA9IHF1YXRbM107XG4gICAgICAgIGZvciAoOyBpIDwgbGVuIDsgaSsrKSB7XG4gICAgICAgICAgICBpdGVtID0gbGlzdFtpXTtcbiAgICAgICAgICAgIGlmIChpdGVtICYmIGl0ZW0ub25Sb3RhdGlvbkNoYW5nZSkgaXRlbS5vblJvdGF0aW9uQ2hhbmdlKHgsIHksIHosIHcpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTZXRzIHRoZSBzY2FsZSBvZiB0aGUgbm9kZS4gVGhlIGRlZmF1bHQgdmFsdWUgaXMgMSBpbiBhbGwgZGltZW5zaW9ucy5cbiAqIFRoZSBub2RlJ3MgY29tcG9uZW50cyB3aWxsIGhhdmUgb25TY2FsZUNoYW5nZWQgY2FsbGVkIG9uIHRoZW0uXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB4IFNjYWxlIHZhbHVlIGluIHhcbiAqIEBwYXJhbSB7TnVtYmVyfSB5IFNjYWxlIHZhbHVlIGluIHlcbiAqIEBwYXJhbSB7TnVtYmVyfSB6IFNjYWxlIHZhbHVlIGluIHpcbiAqXG4gKiBAcmV0dXJuIHtOb2RlfSB0aGlzXG4gKi9cbk5vZGUucHJvdG90eXBlLnNldFNjYWxlID0gZnVuY3Rpb24gc2V0U2NhbGUgKHgsIHksIHopIHtcbiAgICB2YXIgdmVjMyA9IHRoaXMudmFsdWUudmVjdG9ycy5zY2FsZTtcbiAgICB2YXIgcHJvcG9nYXRlID0gZmFsc2U7XG5cbiAgICBwcm9wb2dhdGUgPSB0aGlzLl92ZWNPcHRpb25hbFNldCh2ZWMzLCAwLCB4KSB8fCBwcm9wb2dhdGU7XG4gICAgcHJvcG9nYXRlID0gdGhpcy5fdmVjT3B0aW9uYWxTZXQodmVjMywgMSwgeSkgfHwgcHJvcG9nYXRlO1xuICAgIHByb3BvZ2F0ZSA9IHRoaXMuX3ZlY09wdGlvbmFsU2V0KHZlYzMsIDIsIHopIHx8IHByb3BvZ2F0ZTtcblxuICAgIGlmIChwcm9wb2dhdGUpIHtcbiAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICB2YXIgbGlzdCA9IHRoaXMuX2NvbXBvbmVudHM7XG4gICAgICAgIHZhciBsZW4gPSBsaXN0Lmxlbmd0aDtcbiAgICAgICAgdmFyIGl0ZW07XG4gICAgICAgIHggPSB2ZWMzWzBdO1xuICAgICAgICB5ID0gdmVjM1sxXTtcbiAgICAgICAgeiA9IHZlYzNbMl07XG4gICAgICAgIGZvciAoOyBpIDwgbGVuIDsgaSsrKSB7XG4gICAgICAgICAgICBpdGVtID0gbGlzdFtpXTtcbiAgICAgICAgICAgIGlmIChpdGVtICYmIGl0ZW0ub25TY2FsZUNoYW5nZSkgaXRlbS5vblNjYWxlQ2hhbmdlKHgsIHksIHopO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTZXRzIHRoZSB2YWx1ZSBvZiB0aGUgb3BhY2l0eSBvZiB0aGlzIG5vZGUuIEFsbCBvZiB0aGUgbm9kZSdzXG4gKiBjb21wb25lbnRzIHdpbGwgaGF2ZSBvbk9wYWNpdHlDaGFuZ2UgY2FsbGVkIG9uIHRoZW0vXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB2YWwgVmFsdWUgb2YgdGhlIG9wYWNpdHkuIDEgaXMgdGhlIGRlZmF1bHQuXG4gKlxuICogQHJldHVybiB7Tm9kZX0gdGhpc1xuICovXG5Ob2RlLnByb3RvdHlwZS5zZXRPcGFjaXR5ID0gZnVuY3Rpb24gc2V0T3BhY2l0eSAodmFsKSB7XG4gICAgaWYgKHZhbCAhPT0gdGhpcy52YWx1ZS5zaG93U3RhdGUub3BhY2l0eSkge1xuICAgICAgICB0aGlzLnZhbHVlLnNob3dTdGF0ZS5vcGFjaXR5ID0gdmFsO1xuICAgICAgICBpZiAoIXRoaXMuX3JlcXVlc3RpbmdVcGRhdGUpIHRoaXMuX3JlcXVlc3RVcGRhdGUoKTtcblxuICAgICAgICB2YXIgaSA9IDA7XG4gICAgICAgIHZhciBsaXN0ID0gdGhpcy5fY29tcG9uZW50cztcbiAgICAgICAgdmFyIGxlbiA9IGxpc3QubGVuZ3RoO1xuICAgICAgICB2YXIgaXRlbTtcbiAgICAgICAgZm9yICg7IGkgPCBsZW4gOyBpKyspIHtcbiAgICAgICAgICAgIGl0ZW0gPSBsaXN0W2ldO1xuICAgICAgICAgICAgaWYgKGl0ZW0gJiYgaXRlbS5vbk9wYWNpdHlDaGFuZ2UpIGl0ZW0ub25PcGFjaXR5Q2hhbmdlKHZhbCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFNldHMgdGhlIHNpemUgbW9kZSBiZWluZyB1c2VkIGZvciBkZXRlcm1pbmluZyB0aGUgbm9kZSdzIGZpbmFsIHdpZHRoLCBoZWlnaHRcbiAqIGFuZCBkZXB0aC5cbiAqIFNpemUgbW9kZXMgYXJlIGEgd2F5IHRvIGRlZmluZSB0aGUgd2F5IHRoZSBub2RlJ3Mgc2l6ZSBpcyBiZWluZyBjYWxjdWxhdGVkLlxuICogU2l6ZSBtb2RlcyBhcmUgZW51bXMgc2V0IG9uIHRoZSB7QGxpbmsgU2l6ZX0gY29uc3RydWN0b3IgKGFuZCBhbGlhc2VkIG9uXG4gKiB0aGUgTm9kZSkuXG4gKlxuICogQGV4YW1wbGVcbiAqIG5vZGUuc2V0U2l6ZU1vZGUoTm9kZS5SRUxBVElWRV9TSVpFLCBOb2RlLkFCU09MVVRFX1NJWkUsIE5vZGUuQUJTT0xVVEVfU0laRSk7XG4gKiAvLyBJbnN0ZWFkIG9mIG51bGwsIGFueSBwcm9wb3J0aW9uYWwgaGVpZ2h0IG9yIGRlcHRoIGNhbiBiZSBwYXNzZWQgaW4sIHNpbmNlXG4gKiAvLyBpdCB3b3VsZCBiZSBpZ25vcmVkIGluIGFueSBjYXNlLlxuICogbm9kZS5zZXRQcm9wb3J0aW9uYWxTaXplKDAuNSwgbnVsbCwgbnVsbCk7XG4gKiBub2RlLnNldEFic29sdXRlU2l6ZShudWxsLCAxMDAsIDIwMCk7XG4gKlxuICogQG1ldGhvZCBzZXRTaXplTW9kZVxuICpcbiAqIEBwYXJhbSB7U2l6ZU1vZGV9IHggICAgVGhlIHNpemUgbW9kZSBiZWluZyB1c2VkIGZvciBkZXRlcm1pbmluZyB0aGUgc2l6ZSBpblxuICogICAgICAgICAgICAgICAgICAgICAgICB4IGRpcmVjdGlvbiAoXCJ3aWR0aFwiKS5cbiAqIEBwYXJhbSB7U2l6ZU1vZGV9IHkgICAgVGhlIHNpemUgbW9kZSBiZWluZyB1c2VkIGZvciBkZXRlcm1pbmluZyB0aGUgc2l6ZSBpblxuICogICAgICAgICAgICAgICAgICAgICAgICB5IGRpcmVjdGlvbiAoXCJoZWlnaHRcIikuXG4gKiBAcGFyYW0ge1NpemVNb2RlfSB6ICAgIFRoZSBzaXplIG1vZGUgYmVpbmcgdXNlZCBmb3IgZGV0ZXJtaW5pbmcgdGhlIHNpemUgaW5cbiAqICAgICAgICAgICAgICAgICAgICAgICAgeiBkaXJlY3Rpb24gKFwiZGVwdGhcIikuXG4gKlxuICogQHJldHVybiB7Tm9kZX0gdGhpc1xuICovXG5Ob2RlLnByb3RvdHlwZS5zZXRTaXplTW9kZSA9IGZ1bmN0aW9uIHNldFNpemVNb2RlICh4LCB5LCB6KSB7XG4gICAgdmFyIHZlYzMgPSB0aGlzLnZhbHVlLnNpemUuc2l6ZU1vZGU7XG4gICAgdmFyIHByb3BvZ2F0ZSA9IGZhbHNlO1xuXG4gICAgaWYgKHggIT0gbnVsbCkgcHJvcG9nYXRlID0gdGhpcy5fcmVzb2x2ZVNpemVNb2RlKHZlYzMsIDAsIHgpIHx8IHByb3BvZ2F0ZTtcbiAgICBpZiAoeSAhPSBudWxsKSBwcm9wb2dhdGUgPSB0aGlzLl9yZXNvbHZlU2l6ZU1vZGUodmVjMywgMSwgeSkgfHwgcHJvcG9nYXRlO1xuICAgIGlmICh6ICE9IG51bGwpIHByb3BvZ2F0ZSA9IHRoaXMuX3Jlc29sdmVTaXplTW9kZSh2ZWMzLCAyLCB6KSB8fCBwcm9wb2dhdGU7XG5cbiAgICBpZiAocHJvcG9nYXRlKSB7XG4gICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgdmFyIGxpc3QgPSB0aGlzLl9jb21wb25lbnRzO1xuICAgICAgICB2YXIgbGVuID0gbGlzdC5sZW5ndGg7XG4gICAgICAgIHZhciBpdGVtO1xuICAgICAgICB4ID0gdmVjM1swXTtcbiAgICAgICAgeSA9IHZlYzNbMV07XG4gICAgICAgIHogPSB2ZWMzWzJdO1xuICAgICAgICBmb3IgKDsgaSA8IGxlbiA7IGkrKykge1xuICAgICAgICAgICAgaXRlbSA9IGxpc3RbaV07XG4gICAgICAgICAgICBpZiAoaXRlbSAmJiBpdGVtLm9uU2l6ZU1vZGVDaGFuZ2UpIGl0ZW0ub25TaXplTW9kZUNoYW5nZSh4LCB5LCB6KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQSBwcm90ZWN0ZWQgbWV0aG9kIHRoYXQgcmVzb2x2ZXMgc3RyaW5nIHJlcHJlc2VudGF0aW9ucyBvZiBzaXplIG1vZGVcbiAqIHRvIG51bWVyaWMgdmFsdWVzIGFuZCBhcHBsaWVzIHRoZW0uXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IHZlYyB0aGUgYXJyYXkgdG8gd3JpdGUgc2l6ZSBtb2RlIHRvXG4gKiBAcGFyYW0ge051bWJlcn0gaW5kZXggdGhlIGluZGV4IHRvIHdyaXRlIHRvIGluIHRoZSBhcnJheVxuICogQHBhcmFtIHtTdHJpbmd8TnVtYmVyfSB2YWwgdGhlIHZhbHVlIHRvIHdyaXRlXG4gKlxuICogQHJldHVybiB7Qm9vbH0gd2hldGhlciBvciBub3QgdGhlIHNpemVtb2RlIGhhcyBiZWVuIGNoYW5nZWQgZm9yIHRoaXMgaW5kZXguXG4gKi9cbk5vZGUucHJvdG90eXBlLl9yZXNvbHZlU2l6ZU1vZGUgPSBmdW5jdGlvbiBfcmVzb2x2ZVNpemVNb2RlICh2ZWMsIGluZGV4LCB2YWwpIHtcbiAgICBpZiAodmFsLmNvbnN0cnVjdG9yID09PSBTdHJpbmcpIHtcbiAgICAgICAgc3dpdGNoICh2YWwudG9Mb3dlckNhc2UoKSkge1xuICAgICAgICAgICAgY2FzZSAncmVsYXRpdmUnOlxuICAgICAgICAgICAgY2FzZSAnZGVmYXVsdCc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3ZlY09wdGlvbmFsU2V0KHZlYywgaW5kZXgsIDApO1xuICAgICAgICAgICAgY2FzZSAnYWJzb2x1dGUnOlxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl92ZWNPcHRpb25hbFNldCh2ZWMsIGluZGV4LCAxKTtcbiAgICAgICAgICAgIGNhc2UgJ3JlbmRlcic6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3ZlY09wdGlvbmFsU2V0KHZlYywgaW5kZXgsIDIpO1xuICAgICAgICAgICAgZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKCd1bmtub3duIHNpemUgbW9kZTogJyArIHZhbCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSByZXR1cm4gdGhpcy5fdmVjT3B0aW9uYWxTZXQodmVjLCBpbmRleCwgdmFsKTtcbn07XG5cbi8qKlxuICogQSBwcm9wb3J0aW9uYWwgc2l6ZSBkZWZpbmVzIHRoZSBub2RlJ3MgZGltZW5zaW9ucyByZWxhdGl2ZSB0byBpdHMgcGFyZW50c1xuICogZmluYWwgc2l6ZS5cbiAqIFByb3BvcnRpb25hbCBzaXplcyBuZWVkIHRvIGJlIHdpdGhpbiB0aGUgcmFuZ2Ugb2YgWzAsIDFdLlxuICpcbiAqIEBtZXRob2Qgc2V0UHJvcG9ydGlvbmFsU2l6ZVxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB4ICAgIHgtU2l6ZSBpbiBwaXhlbHMgKFwid2lkdGhcIikuXG4gKiBAcGFyYW0ge051bWJlcn0geSAgICB5LVNpemUgaW4gcGl4ZWxzIChcImhlaWdodFwiKS5cbiAqIEBwYXJhbSB7TnVtYmVyfSB6ICAgIHotU2l6ZSBpbiBwaXhlbHMgKFwiZGVwdGhcIikuXG4gKlxuICogQHJldHVybiB7Tm9kZX0gdGhpc1xuICovXG5Ob2RlLnByb3RvdHlwZS5zZXRQcm9wb3J0aW9uYWxTaXplID0gZnVuY3Rpb24gc2V0UHJvcG9ydGlvbmFsU2l6ZSAoeCwgeSwgeikge1xuICAgIHZhciB2ZWMzID0gdGhpcy52YWx1ZS5zaXplLnByb3BvcnRpb25hbDtcbiAgICB2YXIgcHJvcG9nYXRlID0gZmFsc2U7XG5cbiAgICBwcm9wb2dhdGUgPSB0aGlzLl92ZWNPcHRpb25hbFNldCh2ZWMzLCAwLCB4KSB8fCBwcm9wb2dhdGU7XG4gICAgcHJvcG9nYXRlID0gdGhpcy5fdmVjT3B0aW9uYWxTZXQodmVjMywgMSwgeSkgfHwgcHJvcG9nYXRlO1xuICAgIHByb3BvZ2F0ZSA9IHRoaXMuX3ZlY09wdGlvbmFsU2V0KHZlYzMsIDIsIHopIHx8IHByb3BvZ2F0ZTtcblxuICAgIGlmIChwcm9wb2dhdGUpIHtcbiAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICB2YXIgbGlzdCA9IHRoaXMuX2NvbXBvbmVudHM7XG4gICAgICAgIHZhciBsZW4gPSBsaXN0Lmxlbmd0aDtcbiAgICAgICAgdmFyIGl0ZW07XG4gICAgICAgIHggPSB2ZWMzWzBdO1xuICAgICAgICB5ID0gdmVjM1sxXTtcbiAgICAgICAgeiA9IHZlYzNbMl07XG4gICAgICAgIGZvciAoOyBpIDwgbGVuIDsgaSsrKSB7XG4gICAgICAgICAgICBpdGVtID0gbGlzdFtpXTtcbiAgICAgICAgICAgIGlmIChpdGVtICYmIGl0ZW0ub25Qcm9wb3J0aW9uYWxTaXplQ2hhbmdlKSBpdGVtLm9uUHJvcG9ydGlvbmFsU2l6ZUNoYW5nZSh4LCB5LCB6KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogRGlmZmVyZW50aWFsIHNpemluZyBjYW4gYmUgdXNlZCB0byBhZGQgb3Igc3VidHJhY3QgYW4gYWJzb2x1dGUgc2l6ZSBmcm9tIGFuXG4gKiBvdGhlcndpc2UgcHJvcG9ydGlvbmFsbHkgc2l6ZWQgbm9kZS5cbiAqIEUuZy4gYSBkaWZmZXJlbnRpYWwgd2lkdGggb2YgYC0xMGAgYW5kIGEgcHJvcG9ydGlvbmFsIHdpZHRoIG9mIGAwLjVgIGlzXG4gKiBiZWluZyBpbnRlcnByZXRlZCBhcyBzZXR0aW5nIHRoZSBub2RlJ3Mgc2l6ZSB0byA1MCUgb2YgaXRzIHBhcmVudCdzIHdpZHRoXG4gKiAqbWludXMqIDEwIHBpeGVscy5cbiAqXG4gKiBAbWV0aG9kIHNldERpZmZlcmVudGlhbFNpemVcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0geCAgICB4LVNpemUgdG8gYmUgYWRkZWQgdG8gdGhlIHJlbGF0aXZlbHkgc2l6ZWQgbm9kZSBpblxuICogICAgICAgICAgICAgICAgICAgICAgcGl4ZWxzIChcIndpZHRoXCIpLlxuICogQHBhcmFtIHtOdW1iZXJ9IHkgICAgeS1TaXplIHRvIGJlIGFkZGVkIHRvIHRoZSByZWxhdGl2ZWx5IHNpemVkIG5vZGUgaW5cbiAqICAgICAgICAgICAgICAgICAgICAgIHBpeGVscyAoXCJoZWlnaHRcIikuXG4gKiBAcGFyYW0ge051bWJlcn0geiAgICB6LVNpemUgdG8gYmUgYWRkZWQgdG8gdGhlIHJlbGF0aXZlbHkgc2l6ZWQgbm9kZSBpblxuICogICAgICAgICAgICAgICAgICAgICAgcGl4ZWxzIChcImRlcHRoXCIpLlxuICpcbiAqIEByZXR1cm4ge05vZGV9IHRoaXNcbiAqL1xuTm9kZS5wcm90b3R5cGUuc2V0RGlmZmVyZW50aWFsU2l6ZSA9IGZ1bmN0aW9uIHNldERpZmZlcmVudGlhbFNpemUgKHgsIHksIHopIHtcbiAgICB2YXIgdmVjMyA9IHRoaXMudmFsdWUuc2l6ZS5kaWZmZXJlbnRpYWw7XG4gICAgdmFyIHByb3BvZ2F0ZSA9IGZhbHNlO1xuXG4gICAgcHJvcG9nYXRlID0gdGhpcy5fdmVjT3B0aW9uYWxTZXQodmVjMywgMCwgeCkgfHwgcHJvcG9nYXRlO1xuICAgIHByb3BvZ2F0ZSA9IHRoaXMuX3ZlY09wdGlvbmFsU2V0KHZlYzMsIDEsIHkpIHx8IHByb3BvZ2F0ZTtcbiAgICBwcm9wb2dhdGUgPSB0aGlzLl92ZWNPcHRpb25hbFNldCh2ZWMzLCAyLCB6KSB8fCBwcm9wb2dhdGU7XG5cbiAgICBpZiAocHJvcG9nYXRlKSB7XG4gICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgdmFyIGxpc3QgPSB0aGlzLl9jb21wb25lbnRzO1xuICAgICAgICB2YXIgbGVuID0gbGlzdC5sZW5ndGg7XG4gICAgICAgIHZhciBpdGVtO1xuICAgICAgICB4ID0gdmVjM1swXTtcbiAgICAgICAgeSA9IHZlYzNbMV07XG4gICAgICAgIHogPSB2ZWMzWzJdO1xuICAgICAgICBmb3IgKDsgaSA8IGxlbiA7IGkrKykge1xuICAgICAgICAgICAgaXRlbSA9IGxpc3RbaV07XG4gICAgICAgICAgICBpZiAoaXRlbSAmJiBpdGVtLm9uRGlmZmVyZW50aWFsU2l6ZUNoYW5nZSkgaXRlbS5vbkRpZmZlcmVudGlhbFNpemVDaGFuZ2UoeCwgeSwgeik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFNldHMgdGhlIG5vZGUncyBzaXplIGluIHBpeGVscywgaW5kZXBlbmRlbnQgb2YgaXRzIHBhcmVudC5cbiAqXG4gKiBAbWV0aG9kIHNldEFic29sdXRlU2l6ZVxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB4ICAgIHgtU2l6ZSBpbiBwaXhlbHMgKFwid2lkdGhcIikuXG4gKiBAcGFyYW0ge051bWJlcn0geSAgICB5LVNpemUgaW4gcGl4ZWxzIChcImhlaWdodFwiKS5cbiAqIEBwYXJhbSB7TnVtYmVyfSB6ICAgIHotU2l6ZSBpbiBwaXhlbHMgKFwiZGVwdGhcIikuXG4gKlxuICogQHJldHVybiB7Tm9kZX0gdGhpc1xuICovXG5Ob2RlLnByb3RvdHlwZS5zZXRBYnNvbHV0ZVNpemUgPSBmdW5jdGlvbiBzZXRBYnNvbHV0ZVNpemUgKHgsIHksIHopIHtcbiAgICB2YXIgdmVjMyA9IHRoaXMudmFsdWUuc2l6ZS5hYnNvbHV0ZTtcbiAgICB2YXIgcHJvcG9nYXRlID0gZmFsc2U7XG5cbiAgICBwcm9wb2dhdGUgPSB0aGlzLl92ZWNPcHRpb25hbFNldCh2ZWMzLCAwLCB4KSB8fCBwcm9wb2dhdGU7XG4gICAgcHJvcG9nYXRlID0gdGhpcy5fdmVjT3B0aW9uYWxTZXQodmVjMywgMSwgeSkgfHwgcHJvcG9nYXRlO1xuICAgIHByb3BvZ2F0ZSA9IHRoaXMuX3ZlY09wdGlvbmFsU2V0KHZlYzMsIDIsIHopIHx8IHByb3BvZ2F0ZTtcblxuICAgIGlmIChwcm9wb2dhdGUpIHtcbiAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICB2YXIgbGlzdCA9IHRoaXMuX2NvbXBvbmVudHM7XG4gICAgICAgIHZhciBsZW4gPSBsaXN0Lmxlbmd0aDtcbiAgICAgICAgdmFyIGl0ZW07XG4gICAgICAgIHggPSB2ZWMzWzBdO1xuICAgICAgICB5ID0gdmVjM1sxXTtcbiAgICAgICAgeiA9IHZlYzNbMl07XG4gICAgICAgIGZvciAoOyBpIDwgbGVuIDsgaSsrKSB7XG4gICAgICAgICAgICBpdGVtID0gbGlzdFtpXTtcbiAgICAgICAgICAgIGlmIChpdGVtICYmIGl0ZW0ub25BYnNvbHV0ZVNpemVDaGFuZ2UpIGl0ZW0ub25BYnNvbHV0ZVNpemVDaGFuZ2UoeCwgeSwgeik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFByaXZhdGUgbWV0aG9kIGZvciBhbGVydGluZyBhbGwgY29tcG9uZW50cyBhbmQgY2hpbGRyZW4gdGhhdFxuICogdGhpcyBub2RlJ3MgdHJhbnNmb3JtIGhhcyBjaGFuZ2VkLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge0Zsb2F0MzJBcnJheX0gdHJhbnNmb3JtIFRoZSB0cmFuc2Zvcm0gdGhhdCBoYXMgY2hhbmdlZFxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbk5vZGUucHJvdG90eXBlLl90cmFuc2Zvcm1DaGFuZ2VkID0gZnVuY3Rpb24gX3RyYW5zZm9ybUNoYW5nZWQgKHRyYW5zZm9ybSkge1xuICAgIHZhciBpID0gMDtcbiAgICB2YXIgaXRlbXMgPSB0aGlzLl9jb21wb25lbnRzO1xuICAgIHZhciBsZW4gPSBpdGVtcy5sZW5ndGg7XG4gICAgdmFyIGl0ZW07XG5cbiAgICBmb3IgKDsgaSA8IGxlbiA7IGkrKykge1xuICAgICAgICBpdGVtID0gaXRlbXNbaV07XG4gICAgICAgIGlmIChpdGVtICYmIGl0ZW0ub25UcmFuc2Zvcm1DaGFuZ2UpIGl0ZW0ub25UcmFuc2Zvcm1DaGFuZ2UodHJhbnNmb3JtKTtcbiAgICB9XG5cbiAgICBpID0gMDtcbiAgICBpdGVtcyA9IHRoaXMuX2NoaWxkcmVuO1xuICAgIGxlbiA9IGl0ZW1zLmxlbmd0aDtcblxuICAgIGZvciAoOyBpIDwgbGVuIDsgaSsrKSB7XG4gICAgICAgIGl0ZW0gPSBpdGVtc1tpXTtcbiAgICAgICAgaWYgKGl0ZW0gJiYgaXRlbS5vblBhcmVudFRyYW5zZm9ybUNoYW5nZSkgaXRlbS5vblBhcmVudFRyYW5zZm9ybUNoYW5nZSh0cmFuc2Zvcm0pO1xuICAgIH1cbn07XG5cbi8qKlxuICogUHJpdmF0ZSBtZXRob2QgZm9yIGFsZXJ0aW5nIGFsbCBjb21wb25lbnRzIGFuZCBjaGlsZHJlbiB0aGF0XG4gKiB0aGlzIG5vZGUncyBzaXplIGhhcyBjaGFuZ2VkLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge0Zsb2F0MzJBcnJheX0gc2l6ZSB0aGUgc2l6ZSB0aGF0IGhhcyBjaGFuZ2VkXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuTm9kZS5wcm90b3R5cGUuX3NpemVDaGFuZ2VkID0gZnVuY3Rpb24gX3NpemVDaGFuZ2VkIChzaXplKSB7XG4gICAgdmFyIGkgPSAwO1xuICAgIHZhciBpdGVtcyA9IHRoaXMuX2NvbXBvbmVudHM7XG4gICAgdmFyIGxlbiA9IGl0ZW1zLmxlbmd0aDtcbiAgICB2YXIgaXRlbTtcblxuICAgIGZvciAoOyBpIDwgbGVuIDsgaSsrKSB7XG4gICAgICAgIGl0ZW0gPSBpdGVtc1tpXTtcbiAgICAgICAgaWYgKGl0ZW0gJiYgaXRlbS5vblNpemVDaGFuZ2UpIGl0ZW0ub25TaXplQ2hhbmdlKHNpemUpO1xuICAgIH1cblxuICAgIGkgPSAwO1xuICAgIGl0ZW1zID0gdGhpcy5fY2hpbGRyZW47XG4gICAgbGVuID0gaXRlbXMubGVuZ3RoO1xuXG4gICAgZm9yICg7IGkgPCBsZW4gOyBpKyspIHtcbiAgICAgICAgaXRlbSA9IGl0ZW1zW2ldO1xuICAgICAgICBpZiAoaXRlbSAmJiBpdGVtLm9uUGFyZW50U2l6ZUNoYW5nZSkgaXRlbS5vblBhcmVudFNpemVDaGFuZ2Uoc2l6ZSk7XG4gICAgfVxufTtcblxuLyoqXG4gKiBNZXRob2QgZm9yIGdldHRpbmcgdGhlIGN1cnJlbnQgZnJhbWUuIFdpbGwgYmUgZGVwcmVjYXRlZC5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7TnVtYmVyfSBjdXJyZW50IGZyYW1lXG4gKi9cbk5vZGUucHJvdG90eXBlLmdldEZyYW1lID0gZnVuY3Rpb24gZ2V0RnJhbWUgKCkge1xuICAgIHJldHVybiB0aGlzLl9nbG9iYWxVcGRhdGVyLmdldEZyYW1lKCk7XG59O1xuXG4vKipcbiAqIHJldHVybnMgYW4gYXJyYXkgb2YgdGhlIGNvbXBvbmVudHMgY3VycmVudGx5IGF0dGFjaGVkIHRvIHRoaXNcbiAqIG5vZGUuXG4gKlxuICogQG1ldGhvZCBnZXRDb21wb25lbnRzXG4gKlxuICogQHJldHVybiB7QXJyYXl9IGxpc3Qgb2YgY29tcG9uZW50cy5cbiAqL1xuTm9kZS5wcm90b3R5cGUuZ2V0Q29tcG9uZW50cyA9IGZ1bmN0aW9uIGdldENvbXBvbmVudHMgKCkge1xuICAgIHJldHVybiB0aGlzLl9jb21wb25lbnRzO1xufTtcblxuLyoqXG4gKiBFbnRlcnMgdGhlIG5vZGUncyB1cGRhdGUgcGhhc2Ugd2hpbGUgdXBkYXRpbmcgaXRzIG93biBzcGVjIGFuZCB1cGRhdGluZyBpdHMgY29tcG9uZW50cy5cbiAqXG4gKiBAbWV0aG9kIHVwZGF0ZVxuICpcbiAqIEBwYXJhbSAge051bWJlcn0gdGltZSAgICBoaWdoLXJlc29sdXRpb24gdGltZXN0YW1wLCB1c3VhbGx5IHJldHJpZXZlZCB1c2luZ1xuICogICAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZVxuICpcbiAqIEByZXR1cm4ge05vZGV9IHRoaXNcbiAqL1xuTm9kZS5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24gdXBkYXRlICh0aW1lKXtcbiAgICB0aGlzLl9pblVwZGF0ZSA9IHRydWU7XG4gICAgdmFyIG5leHRRdWV1ZSA9IHRoaXMuX25leHRVcGRhdGVRdWV1ZTtcbiAgICB2YXIgcXVldWUgPSB0aGlzLl91cGRhdGVRdWV1ZTtcbiAgICB2YXIgaXRlbTtcblxuICAgIHdoaWxlIChuZXh0UXVldWUubGVuZ3RoKSBxdWV1ZS51bnNoaWZ0KG5leHRRdWV1ZS5wb3AoKSk7XG5cbiAgICB3aGlsZSAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGl0ZW0gPSB0aGlzLl9jb21wb25lbnRzW3F1ZXVlLnNoaWZ0KCldO1xuICAgICAgICBpZiAoaXRlbSAmJiBpdGVtLm9uVXBkYXRlKSBpdGVtLm9uVXBkYXRlKHRpbWUpO1xuICAgIH1cblxuICAgIHZhciBteVNpemUgPSB0aGlzLmdldFNpemUoKTtcbiAgICB2YXIgbXlUcmFuc2Zvcm0gPSB0aGlzLmdldFRyYW5zZm9ybSgpO1xuICAgIHZhciBwYXJlbnQgPSB0aGlzLmdldFBhcmVudCgpO1xuICAgIHZhciBwYXJlbnRTaXplID0gcGFyZW50LmdldFNpemUoKTtcbiAgICB2YXIgcGFyZW50VHJhbnNmb3JtID0gcGFyZW50LmdldFRyYW5zZm9ybSgpO1xuICAgIHZhciBzaXplQ2hhbmdlZCA9IFNJWkVfUFJPQ0VTU09SLmZyb21TcGVjV2l0aFBhcmVudChwYXJlbnRTaXplLCB0aGlzLCBteVNpemUpO1xuXG4gICAgdmFyIHRyYW5zZm9ybUNoYW5nZWQgPSBUUkFOU0ZPUk1fUFJPQ0VTU09SLmZyb21TcGVjV2l0aFBhcmVudChwYXJlbnRUcmFuc2Zvcm0sIHRoaXMudmFsdWUsIG15U2l6ZSwgcGFyZW50U2l6ZSwgbXlUcmFuc2Zvcm0pO1xuICAgIGlmICh0cmFuc2Zvcm1DaGFuZ2VkKSB0aGlzLl90cmFuc2Zvcm1DaGFuZ2VkKG15VHJhbnNmb3JtKTtcbiAgICBpZiAoc2l6ZUNoYW5nZWQpIHRoaXMuX3NpemVDaGFuZ2VkKG15U2l6ZSk7XG5cbiAgICB0aGlzLl9pblVwZGF0ZSA9IGZhbHNlO1xuICAgIHRoaXMuX3JlcXVlc3RpbmdVcGRhdGUgPSBmYWxzZTtcblxuICAgIGlmICghdGhpcy5pc01vdW50ZWQoKSkge1xuICAgICAgICAvLyBsYXN0IHVwZGF0ZVxuICAgICAgICB0aGlzLl9wYXJlbnQgPSBudWxsO1xuICAgICAgICB0aGlzLnZhbHVlLmxvY2F0aW9uID0gbnVsbDtcbiAgICAgICAgdGhpcy5fZ2xvYmFsVXBkYXRlciA9IG51bGw7XG4gICAgfVxuICAgIGVsc2UgaWYgKHRoaXMuX25leHRVcGRhdGVRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgdGhpcy5fZ2xvYmFsVXBkYXRlci5yZXF1ZXN0VXBkYXRlT25OZXh0VGljayh0aGlzKTtcbiAgICAgICAgdGhpcy5fcmVxdWVzdGluZ1VwZGF0ZSA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBNb3VudHMgdGhlIG5vZGUgYW5kIHRoZXJlZm9yZSBpdHMgc3VidHJlZSBieSBzZXR0aW5nIGl0IGFzIGEgY2hpbGQgb2YgdGhlXG4gKiBwYXNzZWQgaW4gcGFyZW50LlxuICpcbiAqIEBtZXRob2QgbW91bnRcbiAqXG4gKiBAcGFyYW0gIHtOb2RlfSBwYXJlbnQgICAgcGFyZW50IG5vZGVcbiAqIEBwYXJhbSAge1N0cmluZ30gbXlJZCAgICBwYXRoIHRvIG5vZGUgKGUuZy4gYGJvZHkvMC8xYClcbiAqXG4gKiBAcmV0dXJuIHtOb2RlfSB0aGlzXG4gKi9cbk5vZGUucHJvdG90eXBlLm1vdW50ID0gZnVuY3Rpb24gbW91bnQgKHBhcmVudCwgbXlJZCkge1xuICAgIGlmICh0aGlzLmlzTW91bnRlZCgpKSByZXR1cm4gdGhpcztcbiAgICB2YXIgaSA9IDA7XG4gICAgdmFyIGxpc3QgPSB0aGlzLl9jb21wb25lbnRzO1xuICAgIHZhciBsZW4gPSBsaXN0Lmxlbmd0aDtcbiAgICB2YXIgaXRlbTtcblxuICAgIHRoaXMuX3BhcmVudCA9IHBhcmVudDtcbiAgICB0aGlzLl9nbG9iYWxVcGRhdGVyID0gcGFyZW50LmdldFVwZGF0ZXIoKTtcbiAgICB0aGlzLnZhbHVlLmxvY2F0aW9uID0gbXlJZDtcbiAgICB0aGlzLnZhbHVlLnNob3dTdGF0ZS5tb3VudGVkID0gdHJ1ZTtcblxuICAgIGZvciAoOyBpIDwgbGVuIDsgaSsrKSB7XG4gICAgICAgIGl0ZW0gPSBsaXN0W2ldO1xuICAgICAgICBpZiAoaXRlbSAmJiBpdGVtLm9uTW91bnQpIGl0ZW0ub25Nb3VudCh0aGlzLCBpKTtcbiAgICB9XG5cbiAgICBpID0gMDtcbiAgICBsaXN0ID0gdGhpcy5fY2hpbGRyZW47XG4gICAgbGVuID0gbGlzdC5sZW5ndGg7XG4gICAgZm9yICg7IGkgPCBsZW4gOyBpKyspIHtcbiAgICAgICAgaXRlbSA9IGxpc3RbaV07XG4gICAgICAgIGlmIChpdGVtICYmIGl0ZW0ub25QYXJlbnRNb3VudCkgaXRlbS5vblBhcmVudE1vdW50KHRoaXMsIG15SWQsIGkpO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5fcmVxdWVzdGluZ1VwZGF0ZSkgdGhpcy5fcmVxdWVzdFVwZGF0ZSh0cnVlKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogRGlzbW91bnRzIChkZXRhY2hlcykgdGhlIG5vZGUgZnJvbSB0aGUgc2NlbmUgZ3JhcGggYnkgcmVtb3ZpbmcgaXQgYXMgYVxuICogY2hpbGQgb2YgaXRzIHBhcmVudC5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7Tm9kZX0gdGhpc1xuICovXG5Ob2RlLnByb3RvdHlwZS5kaXNtb3VudCA9IGZ1bmN0aW9uIGRpc21vdW50ICgpIHtcbiAgICBpZiAoIXRoaXMuaXNNb3VudGVkKCkpIHJldHVybiB0aGlzO1xuICAgIHZhciBpID0gMDtcbiAgICB2YXIgbGlzdCA9IHRoaXMuX2NvbXBvbmVudHM7XG4gICAgdmFyIGxlbiA9IGxpc3QubGVuZ3RoO1xuICAgIHZhciBpdGVtO1xuXG4gICAgdGhpcy52YWx1ZS5zaG93U3RhdGUubW91bnRlZCA9IGZhbHNlO1xuXG4gICAgdGhpcy5fcGFyZW50LnJlbW92ZUNoaWxkKHRoaXMpO1xuXG4gICAgZm9yICg7IGkgPCBsZW4gOyBpKyspIHtcbiAgICAgICAgaXRlbSA9IGxpc3RbaV07XG4gICAgICAgIGlmIChpdGVtICYmIGl0ZW0ub25EaXNtb3VudCkgaXRlbS5vbkRpc21vdW50KCk7XG4gICAgfVxuXG4gICAgaSA9IDA7XG4gICAgbGlzdCA9IHRoaXMuX2NoaWxkcmVuO1xuICAgIGxlbiA9IGxpc3QubGVuZ3RoO1xuICAgIGZvciAoOyBpIDwgbGVuIDsgaSsrKSB7XG4gICAgICAgIGl0ZW0gPSBsaXN0W2ldO1xuICAgICAgICBpZiAoaXRlbSAmJiBpdGVtLm9uUGFyZW50RGlzbW91bnQpIGl0ZW0ub25QYXJlbnREaXNtb3VudCgpO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5fcmVxdWVzdGluZ1VwZGF0ZSkgdGhpcy5fcmVxdWVzdFVwZGF0ZSgpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBiZSBpbnZva2VkIGJ5IHRoZSBwYXJlbnQgYXMgc29vbiBhcyB0aGUgcGFyZW50IGlzXG4gKiBiZWluZyBtb3VudGVkLlxuICpcbiAqIEBtZXRob2Qgb25QYXJlbnRNb3VudFxuICpcbiAqIEBwYXJhbSAge05vZGV9IHBhcmVudCAgICAgICAgVGhlIHBhcmVudCBub2RlLlxuICogQHBhcmFtICB7U3RyaW5nfSBwYXJlbnRJZCAgICBUaGUgcGFyZW50IGlkIChwYXRoIHRvIHBhcmVudCkuXG4gKiBAcGFyYW0gIHtOdW1iZXJ9IGluZGV4ICAgICAgIElkIHRoZSBub2RlIHNob3VsZCBiZSBtb3VudGVkIHRvLlxuICpcbiAqIEByZXR1cm4ge05vZGV9IHRoaXNcbiAqL1xuTm9kZS5wcm90b3R5cGUub25QYXJlbnRNb3VudCA9IGZ1bmN0aW9uIG9uUGFyZW50TW91bnQgKHBhcmVudCwgcGFyZW50SWQsIGluZGV4KSB7XG4gICAgcmV0dXJuIHRoaXMubW91bnQocGFyZW50LCBwYXJlbnRJZCArICcvJyArIGluZGV4KTtcbn07XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gYmUgaW52b2tlZCBieSB0aGUgcGFyZW50IGFzIHNvb24gYXMgdGhlIHBhcmVudCBpcyBiZWluZ1xuICogdW5tb3VudGVkLlxuICpcbiAqIEBtZXRob2Qgb25QYXJlbnREaXNtb3VudFxuICpcbiAqIEByZXR1cm4ge05vZGV9IHRoaXNcbiAqL1xuTm9kZS5wcm90b3R5cGUub25QYXJlbnREaXNtb3VudCA9IGZ1bmN0aW9uIG9uUGFyZW50RGlzbW91bnQgKCkge1xuICAgIHJldHVybiB0aGlzLmRpc21vdW50KCk7XG59O1xuXG4vKipcbiAqIE1ldGhvZCB0byBiZSBjYWxsZWQgaW4gb3JkZXIgdG8gZGlzcGF0Y2ggYW4gZXZlbnQgdG8gdGhlIG5vZGUgYW5kIGFsbCBpdHNcbiAqIGNvbXBvbmVudHMuIE5vdGUgdGhhdCB0aGlzIGRvZXNuJ3QgcmVjdXJzZSB0aGUgc3VidHJlZS5cbiAqXG4gKiBAbWV0aG9kIHJlY2VpdmVcbiAqXG4gKiBAcGFyYW0gIHtTdHJpbmd9IHR5cGUgICBUaGUgZXZlbnQgdHlwZSAoZS5nLiBcImNsaWNrXCIpLlxuICogQHBhcmFtICB7T2JqZWN0fSBldiAgICAgVGhlIGV2ZW50IHBheWxvYWQgb2JqZWN0IHRvIGJlIGRpc3BhdGNoZWQuXG4gKlxuICogQHJldHVybiB7Tm9kZX0gdGhpc1xuICovXG5Ob2RlLnByb3RvdHlwZS5yZWNlaXZlID0gZnVuY3Rpb24gcmVjZWl2ZSAodHlwZSwgZXYpIHtcbiAgICB2YXIgaSA9IDA7XG4gICAgdmFyIGxpc3QgPSB0aGlzLl9jb21wb25lbnRzO1xuICAgIHZhciBsZW4gPSBsaXN0Lmxlbmd0aDtcbiAgICB2YXIgaXRlbTtcbiAgICBmb3IgKDsgaSA8IGxlbiA7IGkrKykge1xuICAgICAgICBpdGVtID0gbGlzdFtpXTtcbiAgICAgICAgaWYgKGl0ZW0gJiYgaXRlbS5vblJlY2VpdmUpIGl0ZW0ub25SZWNlaXZlKHR5cGUsIGV2KTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5cbi8qKlxuICogUHJpdmF0ZSBtZXRob2QgdG8gYXZvaWQgYWNjaWRlbnRhbGx5IHBhc3NpbmcgYXJndW1lbnRzXG4gKiB0byB1cGRhdGUgZXZlbnRzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5Ob2RlLnByb3RvdHlwZS5fcmVxdWVzdFVwZGF0ZVdpdGhvdXRBcmdzID0gZnVuY3Rpb24gX3JlcXVlc3RVcGRhdGVXaXRob3V0QXJncyAoKSB7XG4gICAgaWYgKCF0aGlzLl9yZXF1ZXN0aW5nVXBkYXRlKSB0aGlzLl9yZXF1ZXN0VXBkYXRlKCk7XG59O1xuXG4vKipcbiAqIEEgbWV0aG9kIHRvIGV4ZWN1dGUgbG9naWMgb24gdXBkYXRlLiBEZWZhdWx0cyB0byB0aGVcbiAqIG5vZGUncyAudXBkYXRlIG1ldGhvZC5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IGN1cnJlbnQgdGltZVxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbk5vZGUucHJvdG90eXBlLm9uVXBkYXRlID0gTm9kZS5wcm90b3R5cGUudXBkYXRlO1xuXG4vKipcbiAqIEEgbWV0aG9kIHRvIGV4ZWN1dGUgbG9naWMgd2hlbiBhIHBhcmVudCBub2RlIGlzIHNob3duLiBEZWxlZ2F0ZXNcbiAqIHRvIE5vZGUuc2hvdy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7Tm9kZX0gdGhpc1xuICovXG5Ob2RlLnByb3RvdHlwZS5vblBhcmVudFNob3cgPSBOb2RlLnByb3RvdHlwZS5zaG93O1xuXG4vKipcbiAqIEEgbWV0aG9kIHRvIGV4ZWN1dGUgbG9naWMgd2hlbiB0aGUgcGFyZW50IGlzIGhpZGRlbi4gRGVsZWdhdGVzXG4gKiB0byBOb2RlLmhpZGUuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge05vZGV9IHRoaXNcbiAqL1xuTm9kZS5wcm90b3R5cGUub25QYXJlbnRIaWRlID0gTm9kZS5wcm90b3R5cGUuaGlkZTtcblxuLyoqXG4gKiBBIG1ldGhvZCB0byBleGVjdXRlIGxvZ2ljIHdoZW4gdGhlIHBhcmVudCB0cmFuc2Zvcm0gY2hhbmdlcy5cbiAqIERlbGVnYXRlcyB0byBOb2RlLl9yZXF1ZXN0VXBkYXRlV2l0aG91dEFyZ3MuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbk5vZGUucHJvdG90eXBlLm9uUGFyZW50VHJhbnNmb3JtQ2hhbmdlID0gTm9kZS5wcm90b3R5cGUuX3JlcXVlc3RVcGRhdGVXaXRob3V0QXJncztcblxuLyoqXG4gKiBBIG1ldGhvZCB0byBleGVjdXRlIGxvZ2ljIHdoZW4gdGhlIHBhcmVudCBzaXplIGNoYW5nZXMuXG4gKiBEZWxlZ2F0ZXMgdG8gTm9kZS5fcmVxdWVzdFVwZGF0ZVdJdGhvdXRBcmdzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5Ob2RlLnByb3RvdHlwZS5vblBhcmVudFNpemVDaGFuZ2UgPSBOb2RlLnByb3RvdHlwZS5fcmVxdWVzdFVwZGF0ZVdpdGhvdXRBcmdzO1xuXG4vKipcbiAqIEEgbWV0aG9kIHRvIGV4ZWN1dGUgbG9naWMgd2hlbiB0aGUgbm9kZSBzb21ldGhpbmcgd2FudHNcbiAqIHRvIHNob3cgdGhlIG5vZGUuIERlbGVnYXRlcyB0byBOb2RlLnNob3cuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge05vZGV9IHRoaXNcbiAqL1xuTm9kZS5wcm90b3R5cGUub25TaG93ID0gTm9kZS5wcm90b3R5cGUuc2hvdztcblxuLyoqXG4gKiBBIG1ldGhvZCB0byBleGVjdXRlIGxvZ2ljIHdoZW4gc29tZXRoaW5nIHdhbnRzIHRvIGhpZGUgdGhpc1xuICogbm9kZS4gRGVsZWdhdGVzIHRvIE5vZGUuaGlkZS5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7Tm9kZX0gdGhpc1xuICovXG5Ob2RlLnByb3RvdHlwZS5vbkhpZGUgPSBOb2RlLnByb3RvdHlwZS5oaWRlO1xuXG4vKipcbiAqIEEgbWV0aG9kIHdoaWNoIGNhbiBleGVjdXRlIGxvZ2ljIHdoZW4gdGhpcyBub2RlIGlzIGFkZGVkIHRvXG4gKiB0byB0aGUgc2NlbmUgZ3JhcGguIERlbGVnYXRlcyB0byBtb3VudC5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7Tm9kZX0gdGhpc1xuICovXG5Ob2RlLnByb3RvdHlwZS5vbk1vdW50ID0gTm9kZS5wcm90b3R5cGUubW91bnQ7XG5cbi8qKlxuICogQSBtZXRob2Qgd2hpY2ggY2FuIGV4ZWN1dGUgbG9naWMgd2hlbiB0aGlzIG5vZGUgaXMgcmVtb3ZlZCBmcm9tXG4gKiB0aGUgc2NlbmUgZ3JhcGguIERlbGVnYXRlcyB0byBOb2RlLmRpc21vdW50LlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtOb2RlfSB0aGlzXG4gKi9cbk5vZGUucHJvdG90eXBlLm9uRGlzbW91bnQgPSBOb2RlLnByb3RvdHlwZS5kaXNtb3VudDtcblxuLyoqXG4gKiBBIG1ldGhvZCB3aGljaCBjYW4gZXhlY3V0ZSBsb2dpYyB3aGVuIHRoaXMgbm9kZSByZWNlaXZlc1xuICogYW4gZXZlbnQgZnJvbSB0aGUgc2NlbmUgZ3JhcGguIERlbGVnYXRlcyB0byBOb2RlLnJlY2VpdmUuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBuYW1lXG4gKiBAcGFyYW0ge09iamVjdH0gcGF5bG9hZFxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbk5vZGUucHJvdG90eXBlLm9uUmVjZWl2ZSA9IE5vZGUucHJvdG90eXBlLnJlY2VpdmU7XG5cbm1vZHVsZS5leHBvcnRzID0gTm9kZTtcbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbi8qanNoaW50IC1XMDc5ICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIERpc3BhdGNoID0gcmVxdWlyZSgnLi9EaXNwYXRjaCcpO1xudmFyIE5vZGUgPSByZXF1aXJlKCcuL05vZGUnKTtcbnZhciBTaXplID0gcmVxdWlyZSgnLi9TaXplJyk7XG5cbi8qKlxuICogU2NlbmUgaXMgdGhlIGJvdHRvbSBvZiB0aGUgc2NlbmUgZ3JhcGguIEl0IGlzIGl0cyBvd25cbiAqIHBhcmVudCBhbmQgcHJvdmlkZXMgdGhlIGdsb2JhbCB1cGRhdGVyIHRvIHRoZSBzY2VuZSBncmFwaC5cbiAqXG4gKiBAY2xhc3MgU2NlbmVcbiAqIEBjb25zdHJ1Y3RvclxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzZWxlY3RvciBhIHN0cmluZyB3aGljaCBpcyBhIGRvbSBzZWxlY3RvclxuICogICAgICAgICAgICAgICAgIHNpZ25pZnlpbmcgd2hpY2ggZG9tIGVsZW1lbnQgdGhlIGNvbnRleHRcbiAqICAgICAgICAgICAgICAgICBzaG91bGQgYmUgc2V0IHVwb25cbiAqIEBwYXJhbSB7RmFtb3VzfSB1cGRhdGVyIGEgY2xhc3Mgd2hpY2ggY29uZm9ybXMgdG8gRmFtb3VzJyBpbnRlcmZhY2VcbiAqICAgICAgICAgICAgICAgICBpdCBuZWVkcyB0byBiZSBhYmxlIHRvIHNlbmQgbWV0aG9kcyB0b1xuICogICAgICAgICAgICAgICAgIHRoZSByZW5kZXJlcnMgYW5kIHVwZGF0ZSBub2RlcyBpbiB0aGUgc2NlbmUgZ3JhcGhcbiAqL1xuZnVuY3Rpb24gU2NlbmUgKHNlbGVjdG9yLCB1cGRhdGVyKSB7XG4gICAgaWYgKCFzZWxlY3RvcikgdGhyb3cgbmV3IEVycm9yKCdTY2VuZSBuZWVkcyB0byBiZSBjcmVhdGVkIHdpdGggYSBET00gc2VsZWN0b3InKTtcbiAgICBpZiAoIXVwZGF0ZXIpIHRocm93IG5ldyBFcnJvcignU2NlbmUgbmVlZHMgdG8gYmUgY3JlYXRlZCB3aXRoIGEgY2xhc3MgbGlrZSBGYW1vdXMnKTtcblxuICAgIE5vZGUuY2FsbCh0aGlzKTsgICAgICAgICAvLyBTY2VuZSBpbmhlcml0cyBmcm9tIG5vZGVcblxuICAgIHRoaXMuX3VwZGF0ZXIgPSB1cGRhdGVyOyAvLyBUaGUgdXBkYXRlciB0aGF0IHdpbGwgYm90aFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBzZW5kIG1lc3NhZ2VzIHRvIHRoZSByZW5kZXJlcnNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYW5kIHVwZGF0ZSBkaXJ0eSBub2Rlc1xuXG4gICAgdGhpcy5fZGlzcGF0Y2ggPSBuZXcgRGlzcGF0Y2godGhpcyk7IC8vIGluc3RhbnRpYXRlcyBhIGRpc3BhdGNoZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdG8gc2VuZCBldmVudHMgdG8gdGhlIHNjZW5lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGdyYXBoIGJlbG93IHRoaXMgY29udGV4dFxuXG4gICAgdGhpcy5fc2VsZWN0b3IgPSBzZWxlY3RvcjsgLy8gcmVmZXJlbmNlIHRvIHRoZSBET00gc2VsZWN0b3JcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGF0IHJlcHJlc2VudHMgdGhlIGVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpbiB0aGUgZG9tIHRoYXQgdGhpcyBjb250ZXh0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaW5oYWJpdHNcblxuICAgIHRoaXMub25Nb3VudCh0aGlzLCBzZWxlY3Rvcik7IC8vIE1vdW50IHRoZSBjb250ZXh0IHRvIGl0c2VsZlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIChpdCBpcyBpdHMgb3duIHBhcmVudClcblxuICAgIHRoaXMuX3VwZGF0ZXIgICAgICAgICAgICAgICAgICAvLyBtZXNzYWdlIGEgcmVxdWVzdCBmb3IgdGhlIGRvbVxuICAgICAgICAubWVzc2FnZSgnTkVFRF9TSVpFX0ZPUicpICAvLyBzaXplIG9mIHRoZSBjb250ZXh0IHNvIHRoYXRcbiAgICAgICAgLm1lc3NhZ2Uoc2VsZWN0b3IpOyAgICAgICAgLy8gdGhlIHNjZW5lIGdyYXBoIGhhcyBhIHRvdGFsIHNpemVcblxuICAgIHRoaXMuc2hvdygpOyAvLyB0aGUgY29udGV4dCBiZWdpbnMgc2hvd24gKGl0J3MgYWxyZWFkeSBwcmVzZW50IGluIHRoZSBkb20pXG5cbn1cblxuLy8gU2NlbmUgaW5oZXJpdHMgZnJvbSBub2RlXG5TY2VuZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKE5vZGUucHJvdG90eXBlKTtcblNjZW5lLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFNjZW5lO1xuXG4vKipcbiAqIFNjZW5lIGdldFVwZGF0ZXIgZnVuY3Rpb24gcmV0dXJucyB0aGUgcGFzc2VkIGluIHVwZGF0ZXJcbiAqXG4gKiBAcmV0dXJuIHtGYW1vdXN9IHRoZSB1cGRhdGVyIGZvciB0aGlzIFNjZW5lXG4gKi9cblNjZW5lLnByb3RvdHlwZS5nZXRVcGRhdGVyID0gZnVuY3Rpb24gZ2V0VXBkYXRlciAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3VwZGF0ZXI7XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIHNlbGVjdG9yIHRoYXQgdGhlIGNvbnRleHQgd2FzIGluc3RhbnRpYXRlZCB3aXRoXG4gKlxuICogQHJldHVybiB7U3RyaW5nfSBkb20gc2VsZWN0b3JcbiAqL1xuU2NlbmUucHJvdG90eXBlLmdldFNlbGVjdG9yID0gZnVuY3Rpb24gZ2V0U2VsZWN0b3IgKCkge1xuICAgIHJldHVybiB0aGlzLl9zZWxlY3Rvcjtcbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgZGlzcGF0Y2hlciBvZiB0aGUgY29udGV4dC4gVXNlZCB0byBzZW5kIGV2ZW50c1xuICogdG8gdGhlIG5vZGVzIGluIHRoZSBzY2VuZSBncmFwaC5cbiAqXG4gKiBAcmV0dXJuIHtEaXNwYXRjaH0gdGhlIFNjZW5lJ3MgRGlzcGF0Y2hcbiAqL1xuU2NlbmUucHJvdG90eXBlLmdldERpc3BhdGNoID0gZnVuY3Rpb24gZ2V0RGlzcGF0Y2ggKCkge1xuICAgIHJldHVybiB0aGlzLl9kaXNwYXRjaDtcbn07XG5cbi8qKlxuICogUmVjZWl2ZXMgYW4gZXZlbnQuIElmIHRoZSBldmVudCBpcyAnQ09OVEVYVF9SRVNJWkUnIGl0IHNldHMgdGhlIHNpemUgb2YgdGhlIHNjZW5lXG4gKiBncmFwaCB0byB0aGUgcGF5bG9hZCwgd2hpY2ggbXVzdCBiZSBhbiBhcnJheSBvZiBudW1iZXJzIG9mIGF0IGxlYXN0XG4gKiBsZW5ndGggdGhyZWUgcmVwcmVzZW50aW5nIHRoZSBwaXhlbCBzaXplIGluIDMgZGltZW5zaW9ucy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgdGhlIG5hbWUgb2YgdGhlIGV2ZW50IGJlaW5nIHJlY2VpdmVkXG4gKiBAcGFyYW0geyp9IHBheWxvYWQgdGhlIG9iamVjdCBiZWluZyBzZW50XG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuU2NlbmUucHJvdG90eXBlLm9uUmVjZWl2ZSA9IGZ1bmN0aW9uIG9uUmVjZWl2ZSAoZXZlbnQsIHBheWxvYWQpIHtcbiAgICAvLyBUT0RPOiBJbiB0aGUgZnV0dXJlIHRoZSBkb20gZWxlbWVudCB0aGF0IHRoZSBjb250ZXh0IGlzIGF0dGFjaGVkIHRvXG4gICAgLy8gc2hvdWxkIGhhdmUgYSByZXByZXNlbnRhdGlvbiBhcyBhIGNvbXBvbmVudC4gSXQgd291bGQgYmUgcmVuZGVyIHNpemVkXG4gICAgLy8gYW5kIHRoZSBjb250ZXh0IHdvdWxkIHJlY2VpdmUgaXRzIHNpemUgdGhlIHNhbWUgd2F5IHRoYXQgYW55IHJlbmRlciBzaXplXG4gICAgLy8gY29tcG9uZW50IHJlY2VpdmVzIGl0cyBzaXplLlxuICAgIGlmIChldmVudCA9PT0gJ0NPTlRFWFRfUkVTSVpFJykge1xuXG4gICAgICAgIGlmIChwYXlsb2FkLmxlbmd0aCA8IDIpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICdDT05URVhUX1JFU0laRVxcJ3MgcGF5bG9hZCBuZWVkcyB0byBiZSBhdCBsZWFzdCBhIHBhaXInICtcbiAgICAgICAgICAgICAgICAgICAgJyBvZiBwaXhlbCBzaXplcydcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgdGhpcy5zZXRTaXplTW9kZShTaXplLkFCU09MVVRFLCBTaXplLkFCU09MVVRFLCBTaXplLkFCU09MVVRFKTtcbiAgICAgICAgdGhpcy5zZXRBYnNvbHV0ZVNpemUocGF5bG9hZFswXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF5bG9hZFsxXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGF5bG9hZFsyXSA/IHBheWxvYWRbMl0gOiAwKTtcblxuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gU2NlbmU7XG5cbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBUaGUgU2l6ZSBjbGFzcyBpcyByZXNwb25zaWJsZSBmb3IgcHJvY2Vzc2luZyBTaXplIGZyb20gYSBub2RlXG4gKiBAY29uc3RydWN0b3IgU2l6ZVxuICovXG5mdW5jdGlvbiBTaXplICgpIHtcbiAgICB0aGlzLl9zaXplID0gbmV3IEZsb2F0MzJBcnJheSgzKTtcbn1cblxuLy8gYW4gZW51bWVyYXRpb24gb2YgdGhlIGRpZmZlcmVudCB0eXBlcyBvZiBzaXplIG1vZGVzXG5TaXplLlJFTEFUSVZFID0gMDtcblNpemUuQUJTT0xVVEUgPSAxO1xuU2l6ZS5SRU5ERVIgPSAyO1xuU2l6ZS5ERUZBVUxUID0gU2l6ZS5SRUxBVElWRTtcblxuLyoqXG4gKiBmcm9tU3BlY1dpdGhQYXJlbnQgdGFrZXMgdGhlIHBhcmVudCBub2RlJ3Mgc2l6ZSwgdGhlIHRhcmdldCBub2RlJ3Mgc3BlYyxcbiAqIGFuZCBhIHRhcmdldCBhcnJheSB0byB3cml0ZSB0by4gVXNpbmcgdGhlIG5vZGUncyBzaXplIG1vZGUgaXQgY2FsY3VsYXRlc1xuICogYSBmaW5hbCBzaXplIGZvciB0aGUgbm9kZSBmcm9tIHRoZSBub2RlJ3Mgc3BlYy4gUmV0dXJucyB3aGV0aGVyIG9yIG5vdFxuICogdGhlIGZpbmFsIHNpemUgaGFzIGNoYW5nZWQgZnJvbSBpdHMgbGFzdCB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0ge0FycmF5fSBwYXJlbnRTaXplIHBhcmVudCBub2RlJ3MgY2FsY3VsYXRlZCBzaXplXG4gKiBAcGFyYW0ge05vZGUuU3BlY30gbm9kZSB0aGUgdGFyZ2V0IG5vZGUncyBzcGVjXG4gKiBAcGFyYW0ge0FycmF5fSB0YXJnZXQgYW4gYXJyYXkgdG8gd3JpdGUgdGhlIHJlc3VsdCB0b1xuICpcbiAqIEByZXR1cm4ge0Jvb2xlYW59IHRydWUgaWYgdGhlIHNpemUgb2YgdGhlIG5vZGUgaGFzIGNoYW5nZWQuXG4gKi9cblNpemUucHJvdG90eXBlLmZyb21TcGVjV2l0aFBhcmVudCA9IGZ1bmN0aW9uIGZyb21TcGVjV2l0aFBhcmVudCAocGFyZW50U2l6ZSwgbm9kZSwgdGFyZ2V0KSB7XG4gICAgdmFyIHNwZWMgPSBub2RlLmdldFZhbHVlKCkuc3BlYztcbiAgICB2YXIgY29tcG9uZW50cyA9IG5vZGUuZ2V0Q29tcG9uZW50cygpO1xuICAgIHZhciBtb2RlID0gc3BlYy5zaXplLnNpemVNb2RlO1xuICAgIHZhciBwcmV2O1xuICAgIHZhciBjaGFuZ2VkID0gZmFsc2U7XG4gICAgdmFyIGxlbiA9IGNvbXBvbmVudHMubGVuZ3RoO1xuICAgIHZhciBqO1xuICAgIGZvciAodmFyIGkgPSAwIDsgaSA8IDMgOyBpKyspIHtcbiAgICAgICAgc3dpdGNoIChtb2RlW2ldKSB7XG4gICAgICAgICAgICBjYXNlIFNpemUuUkVMQVRJVkU6XG4gICAgICAgICAgICAgICAgcHJldiA9IHRhcmdldFtpXTtcbiAgICAgICAgICAgICAgICB0YXJnZXRbaV0gPSBwYXJlbnRTaXplW2ldICogc3BlYy5zaXplLnByb3BvcnRpb25hbFtpXSArIHNwZWMuc2l6ZS5kaWZmZXJlbnRpYWxbaV07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFNpemUuQUJTT0xVVEU6XG4gICAgICAgICAgICAgICAgcHJldiA9IHRhcmdldFtpXTtcbiAgICAgICAgICAgICAgICB0YXJnZXRbaV0gPSBzcGVjLnNpemUuYWJzb2x1dGVbaV07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFNpemUuUkVOREVSOlxuICAgICAgICAgICAgICAgIHZhciBjYW5kaWRhdGU7XG4gICAgICAgICAgICAgICAgdmFyIGNvbXBvbmVudDtcbiAgICAgICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgbGVuIDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudCA9IGNvbXBvbmVudHNbal07XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb21wb25lbnQgJiYgY29tcG9uZW50LmdldFJlbmRlclNpemUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbmRpZGF0ZSA9IGNvbXBvbmVudC5nZXRSZW5kZXJTaXplKClbaV07XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2ID0gdGFyZ2V0W2ldO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0W2ldID0gdGFyZ2V0W2ldIDwgY2FuZGlkYXRlIHx8IHRhcmdldFtpXSA9PT0gMCA/IGNhbmRpZGF0ZSA6IHRhcmdldFtpXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjaGFuZ2VkID0gY2hhbmdlZCB8fCBwcmV2ICE9PSB0YXJnZXRbaV07XG4gICAgfVxuICAgIHJldHVybiBjaGFuZ2VkO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTaXplO1xuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqIFxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqIFxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICogXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKiBcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBUaGUgdHJhbnNmb3JtIGNsYXNzIGlzIHJlc3BvbnNpYmxlIGZvciBjYWxjdWxhdGluZyB0aGUgdHJhbnNmb3JtIG9mIGEgcGFydGljdWxhclxuICogbm9kZSBmcm9tIHRoZSBkYXRhIG9uIHRoZSBub2RlIGFuZCBpdHMgcGFyZW50XG4gKlxuICogQGNvbnN0cnVjdG9yIFRyYW5zZm9ybVxuICovXG5mdW5jdGlvbiBUcmFuc2Zvcm0gKCkge1xuICAgIHRoaXMuX21hdHJpeCA9IG5ldyBGbG9hdDMyQXJyYXkoMTYpO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGxhc3QgY2FsY3VsYXRlZCB0cmFuc2Zvcm1cbiAqXG4gKiBAcmV0dXJuIHtBcnJheX0gYSB0cmFuc2Zvcm1cbiAqL1xuVHJhbnNmb3JtLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiBnZXQgKCkge1xuICAgIHJldHVybiB0aGlzLl9tYXRyaXg7XG59O1xuXG4vKipcbiAqIFVzZXMgdGhlIHBhcmVudCB0cmFuc2Zvcm0sIHRoZSBub2RlJ3Mgc3BlYywgdGhlIG5vZGUncyBzaXplLCBhbmQgdGhlIHBhcmVudCdzIHNpemVcbiAqIHRvIGNhbGN1bGF0ZSBhIGZpbmFsIHRyYW5zZm9ybSBmb3IgdGhlIG5vZGUuIFJldHVybnMgdHJ1ZSBpZiB0aGUgdHJhbnNmb3JtIGhhcyBjaGFuZ2VkLlxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IHBhcmVudE1hdHJpeCB0aGUgcGFyZW50IG1hdHJpeFxuICogQHBhcmFtIHtOb2RlLlNwZWN9IHNwZWMgdGhlIHRhcmdldCBub2RlJ3Mgc3BlY1xuICogQHBhcmFtIHtBcnJheX0gbXlTaXplIHRoZSBzaXplIG9mIHRoZSBub2RlXG4gKiBAcGFyYW0ge0FycmF5fSBwYXJlbnRTaXplIHRoZSBzaXplIG9mIHRoZSBwYXJlbnRcbiAqIEBwYXJhbSB7QXJyYXl9IHRhcmdldCB0aGUgdGFyZ2V0IGFycmF5IHRvIHdyaXRlIHRoZSByZXN1bHRpbmcgdHJhbnNmb3JtIHRvXG4gKlxuICogQHJldHVybiB7Qm9vbGVhbn0gd2hldGhlciBvciBub3QgdGhlIHRyYW5zZm9ybSBjaGFuZ2VkXG4gKi9cblRyYW5zZm9ybS5wcm90b3R5cGUuZnJvbVNwZWNXaXRoUGFyZW50ID0gZnVuY3Rpb24gZnJvbVNwZWNXaXRoUGFyZW50IChwYXJlbnRNYXRyaXgsIHNwZWMsIG15U2l6ZSwgcGFyZW50U2l6ZSwgdGFyZ2V0KSB7XG4gICAgdGFyZ2V0ID0gdGFyZ2V0ID8gdGFyZ2V0IDogdGhpcy5fbWF0cml4O1xuXG4gICAgLy8gbG9jYWwgY2FjaGUgb2YgZXZlcnl0aGluZ1xuICAgIHZhciB0MDAgICAgICAgICA9IHRhcmdldFswXTtcbiAgICB2YXIgdDAxICAgICAgICAgPSB0YXJnZXRbMV07XG4gICAgdmFyIHQwMiAgICAgICAgID0gdGFyZ2V0WzJdO1xuICAgIHZhciB0MTAgICAgICAgICA9IHRhcmdldFs0XTtcbiAgICB2YXIgdDExICAgICAgICAgPSB0YXJnZXRbNV07XG4gICAgdmFyIHQxMiAgICAgICAgID0gdGFyZ2V0WzZdO1xuICAgIHZhciB0MjAgICAgICAgICA9IHRhcmdldFs4XTtcbiAgICB2YXIgdDIxICAgICAgICAgPSB0YXJnZXRbOV07XG4gICAgdmFyIHQyMiAgICAgICAgID0gdGFyZ2V0WzEwXTtcbiAgICB2YXIgdDMwICAgICAgICAgPSB0YXJnZXRbMTJdO1xuICAgIHZhciB0MzEgICAgICAgICA9IHRhcmdldFsxM107XG4gICAgdmFyIHQzMiAgICAgICAgID0gdGFyZ2V0WzE0XTtcbiAgICB2YXIgcDAwICAgICAgICAgPSBwYXJlbnRNYXRyaXhbMF07XG4gICAgdmFyIHAwMSAgICAgICAgID0gcGFyZW50TWF0cml4WzFdO1xuICAgIHZhciBwMDIgICAgICAgICA9IHBhcmVudE1hdHJpeFsyXTtcbiAgICB2YXIgcDEwICAgICAgICAgPSBwYXJlbnRNYXRyaXhbNF07XG4gICAgdmFyIHAxMSAgICAgICAgID0gcGFyZW50TWF0cml4WzVdO1xuICAgIHZhciBwMTIgICAgICAgICA9IHBhcmVudE1hdHJpeFs2XTtcbiAgICB2YXIgcDIwICAgICAgICAgPSBwYXJlbnRNYXRyaXhbOF07XG4gICAgdmFyIHAyMSAgICAgICAgID0gcGFyZW50TWF0cml4WzldO1xuICAgIHZhciBwMjIgICAgICAgICA9IHBhcmVudE1hdHJpeFsxMF07XG4gICAgdmFyIHAzMCAgICAgICAgID0gcGFyZW50TWF0cml4WzEyXTtcbiAgICB2YXIgcDMxICAgICAgICAgPSBwYXJlbnRNYXRyaXhbMTNdO1xuICAgIHZhciBwMzIgICAgICAgICA9IHBhcmVudE1hdHJpeFsxNF07XG4gICAgdmFyIHBvc1ggICAgICAgID0gc3BlYy52ZWN0b3JzLnBvc2l0aW9uWzBdO1xuICAgIHZhciBwb3NZICAgICAgICA9IHNwZWMudmVjdG9ycy5wb3NpdGlvblsxXTtcbiAgICB2YXIgcG9zWiAgICAgICAgPSBzcGVjLnZlY3RvcnMucG9zaXRpb25bMl07XG4gICAgdmFyIHJvdFggICAgICAgID0gc3BlYy52ZWN0b3JzLnJvdGF0aW9uWzBdO1xuICAgIHZhciByb3RZICAgICAgICA9IHNwZWMudmVjdG9ycy5yb3RhdGlvblsxXTtcbiAgICB2YXIgcm90WiAgICAgICAgPSBzcGVjLnZlY3RvcnMucm90YXRpb25bMl07XG4gICAgdmFyIHJvdFcgICAgICAgID0gc3BlYy52ZWN0b3JzLnJvdGF0aW9uWzNdO1xuICAgIHZhciBzY2FsZVggICAgICA9IHNwZWMudmVjdG9ycy5zY2FsZVswXTtcbiAgICB2YXIgc2NhbGVZICAgICAgPSBzcGVjLnZlY3RvcnMuc2NhbGVbMV07XG4gICAgdmFyIHNjYWxlWiAgICAgID0gc3BlYy52ZWN0b3JzLnNjYWxlWzJdO1xuICAgIHZhciBhbGlnblggICAgICA9IHNwZWMub2Zmc2V0cy5hbGlnblswXSAqIHBhcmVudFNpemVbMF07XG4gICAgdmFyIGFsaWduWSAgICAgID0gc3BlYy5vZmZzZXRzLmFsaWduWzFdICogcGFyZW50U2l6ZVsxXTtcbiAgICB2YXIgYWxpZ25aICAgICAgPSBzcGVjLm9mZnNldHMuYWxpZ25bMl0gKiBwYXJlbnRTaXplWzJdO1xuICAgIHZhciBtb3VudFBvaW50WCA9IHNwZWMub2Zmc2V0cy5tb3VudFBvaW50WzBdICogbXlTaXplWzBdO1xuICAgIHZhciBtb3VudFBvaW50WSA9IHNwZWMub2Zmc2V0cy5tb3VudFBvaW50WzFdICogbXlTaXplWzFdO1xuICAgIHZhciBtb3VudFBvaW50WiA9IHNwZWMub2Zmc2V0cy5tb3VudFBvaW50WzJdICogbXlTaXplWzJdO1xuICAgIHZhciBvcmlnaW5YICAgICA9IHNwZWMub2Zmc2V0cy5vcmlnaW5bMF0gKiBteVNpemVbMF07XG4gICAgdmFyIG9yaWdpblkgICAgID0gc3BlYy5vZmZzZXRzLm9yaWdpblsxXSAqIG15U2l6ZVsxXTtcbiAgICB2YXIgb3JpZ2luWiAgICAgPSBzcGVjLm9mZnNldHMub3JpZ2luWzJdICogbXlTaXplWzJdO1xuXG4gICAgdmFyIHd4ID0gcm90VyAqIHJvdFg7XG4gICAgdmFyIHd5ID0gcm90VyAqIHJvdFk7XG4gICAgdmFyIHd6ID0gcm90VyAqIHJvdFo7XG4gICAgdmFyIHh4ID0gcm90WCAqIHJvdFg7XG4gICAgdmFyIHl5ID0gcm90WSAqIHJvdFk7XG4gICAgdmFyIHp6ID0gcm90WiAqIHJvdFo7XG4gICAgdmFyIHh5ID0gcm90WCAqIHJvdFk7XG4gICAgdmFyIHh6ID0gcm90WCAqIHJvdFo7XG4gICAgdmFyIHl6ID0gcm90WSAqIHJvdFo7XG5cbiAgICB2YXIgcnMwID0gKDEgLSAyICogKHl5ICsgenopKSAqIHNjYWxlWDtcbiAgICB2YXIgcnMxID0gKDIgKiAoeHkgKyB3eikpICogc2NhbGVYO1xuICAgIHZhciByczIgPSAoMiAqICh4eiAtIHd5KSkgKiBzY2FsZVg7XG4gICAgdmFyIHJzMyA9ICgyICogKHh5IC0gd3opKSAqIHNjYWxlWTtcbiAgICB2YXIgcnM0ID0gKDEgLSAyICogKHh4ICsgenopKSAqIHNjYWxlWTtcbiAgICB2YXIgcnM1ID0gKDIgKiAoeXogKyB3eCkpICogc2NhbGVZO1xuICAgIHZhciByczYgPSAoMiAqICh4eiArIHd5KSkgKiBzY2FsZVo7XG4gICAgdmFyIHJzNyA9ICgyICogKHl6IC0gd3gpKSAqIHNjYWxlWjtcbiAgICB2YXIgcnM4ID0gKDEgLSAyICogKHh4ICsgeXkpKSAqIHNjYWxlWjtcblxuICAgIHZhciB0eCA9IGFsaWduWCArIHBvc1ggLSBtb3VudFBvaW50WCArIG9yaWdpblggLSAocnMwICogb3JpZ2luWCArIHJzMyAqIG9yaWdpblkgKyByczYgKiBvcmlnaW5aKTtcbiAgICB2YXIgdHkgPSBhbGlnblkgKyBwb3NZIC0gbW91bnRQb2ludFkgKyBvcmlnaW5ZIC0gKHJzMSAqIG9yaWdpblggKyByczQgKiBvcmlnaW5ZICsgcnM3ICogb3JpZ2luWik7XG4gICAgdmFyIHR6ID0gYWxpZ25aICsgcG9zWiAtIG1vdW50UG9pbnRaICsgb3JpZ2luWiAtIChyczIgKiBvcmlnaW5YICsgcnM1ICogb3JpZ2luWSArIHJzOCAqIG9yaWdpblopO1xuXG4gICAgdGFyZ2V0WzBdID0gcDAwICogcnMwICsgcDEwICogcnMxICsgcDIwICogcnMyO1xuICAgIHRhcmdldFsxXSA9IHAwMSAqIHJzMCArIHAxMSAqIHJzMSArIHAyMSAqIHJzMjtcbiAgICB0YXJnZXRbMl0gPSBwMDIgKiByczAgKyBwMTIgKiByczEgKyBwMjIgKiByczI7XG4gICAgdGFyZ2V0WzNdID0gMDtcbiAgICB0YXJnZXRbNF0gPSBwMDAgKiByczMgKyBwMTAgKiByczQgKyBwMjAgKiByczU7XG4gICAgdGFyZ2V0WzVdID0gcDAxICogcnMzICsgcDExICogcnM0ICsgcDIxICogcnM1O1xuICAgIHRhcmdldFs2XSA9IHAwMiAqIHJzMyArIHAxMiAqIHJzNCArIHAyMiAqIHJzNTtcbiAgICB0YXJnZXRbN10gPSAwO1xuICAgIHRhcmdldFs4XSA9IHAwMCAqIHJzNiArIHAxMCAqIHJzNyArIHAyMCAqIHJzODtcbiAgICB0YXJnZXRbOV0gPSBwMDEgKiByczYgKyBwMTEgKiByczcgKyBwMjEgKiByczg7XG4gICAgdGFyZ2V0WzEwXSA9IHAwMiAqIHJzNiArIHAxMiAqIHJzNyArIHAyMiAqIHJzODtcbiAgICB0YXJnZXRbMTFdID0gMDtcbiAgICB0YXJnZXRbMTJdID0gcDAwICogdHggKyBwMTAgKiB0eSArIHAyMCAqIHR6ICsgcDMwO1xuICAgIHRhcmdldFsxM10gPSBwMDEgKiB0eCArIHAxMSAqIHR5ICsgcDIxICogdHogKyBwMzE7XG4gICAgdGFyZ2V0WzE0XSA9IHAwMiAqIHR4ICsgcDEyICogdHkgKyBwMjIgKiB0eiArIHAzMjtcbiAgICB0YXJnZXRbMTVdID0gMTtcblxuICAgIHJldHVybiB0MDAgIT09IHRhcmdldFswXSB8fFxuICAgICAgICB0MDEgIT09IHRhcmdldFsxXSB8fFxuICAgICAgICB0MDIgIT09IHRhcmdldFsyXSB8fFxuICAgICAgICB0MTAgIT09IHRhcmdldFs0XSB8fFxuICAgICAgICB0MTEgIT09IHRhcmdldFs1XSB8fFxuICAgICAgICB0MTIgIT09IHRhcmdldFs2XSB8fFxuICAgICAgICB0MjAgIT09IHRhcmdldFs4XSB8fFxuICAgICAgICB0MjEgIT09IHRhcmdldFs5XSB8fFxuICAgICAgICB0MjIgIT09IHRhcmdldFsxMF0gfHxcbiAgICAgICAgdDMwICE9PSB0YXJnZXRbMTJdIHx8XG4gICAgICAgIHQzMSAhPT0gdGFyZ2V0WzEzXSB8fFxuICAgICAgICB0MzIgIT09IHRhcmdldFsxNF07XG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVHJhbnNmb3JtO1xuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQ2FsbGJhY2tTdG9yZSA9IHJlcXVpcmUoJy4uL3V0aWxpdGllcy9DYWxsYmFja1N0b3JlJyk7XG5cbnZhciBSRU5ERVJfU0laRSA9IDI7XG5cbi8qKlxuICogQSBET01FbGVtZW50IGlzIGEgY29tcG9uZW50IHRoYXQgY2FuIGJlIGFkZGVkIHRvIGEgTm9kZSB3aXRoIHRoZVxuICogcHVycG9zZSBvZiBzZW5kaW5nIGRyYXcgY29tbWFuZHMgdG8gdGhlIHJlbmRlcmVyLiBSZW5kZXJhYmxlcyBzZW5kIGRyYXcgY29tbWFuZHNcbiAqIHRvIHRocm91Z2ggdGhlaXIgTm9kZXMgdG8gdGhlIENvbXBvc2l0b3Igd2hlcmUgdGhleSBhcmUgYWN0ZWQgdXBvbi5cbiAqXG4gKiBAY2xhc3MgRE9NRWxlbWVudFxuICpcbiAqIEBwYXJhbSB7Tm9kZX0gbm9kZSAgICAgICAgICAgICAgICAgICBUaGUgTm9kZSB0byB3aGljaCB0aGUgYERPTUVsZW1lbnRgXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVuZGVyYWJsZSBzaG91bGQgYmUgYXR0YWNoZWQgdG8uXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAgICAgICAgICAgICAgSW5pdGlhbCBvcHRpb25zIHVzZWQgZm9yIGluc3RhbnRpYXRpbmdcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGUgTm9kZS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zLnByb3BlcnRpZXMgICBDU1MgcHJvcGVydGllcyB0aGF0IHNob3VsZCBiZSBhZGRlZCB0b1xuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZSBhY3R1YWwgRE9NRWxlbWVudCBvbiB0aGUgaW5pdGlhbCBkcmF3LlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMuYXR0cmlidXRlcyAgIEVsZW1lbnQgYXR0cmlidXRlcyB0aGF0IHNob3VsZCBiZSBhZGRlZCB0b1xuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoZSBhY3R1YWwgRE9NRWxlbWVudC5cbiAqIEBwYXJhbSB7U3RyaW5nfSBvcHRpb25zLmlkICAgICAgICAgICBTdHJpbmcgdG8gYmUgYXBwbGllZCBhcyAnaWQnIG9mIHRoZSBhY3R1YWxcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBET01FbGVtZW50LlxuICogQHBhcmFtIHtTdHJpbmd9IG9wdGlvbnMuY29udGVudCAgICAgIFN0cmluZyB0byBiZSBhcHBsaWVkIGFzIHRoZSBjb250ZW50IG9mIHRoZVxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdHVhbCBET01FbGVtZW50LlxuICogQHBhcmFtIHtCb29sZWFufSBvcHRpb25zLmN1dG91dCAgICAgIFNwZWNpZmllcyB0aGUgcHJlc2VuY2Ugb2YgYSAnY3V0b3V0JyBpbiB0aGVcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBXZWJHTCBjYW52YXMgb3ZlciB0aGlzIGVsZW1lbnQgd2hpY2ggYWxsb3dzXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIERPTSBhbmQgV2ViR0wgbGF5ZXJpbmcuICBPbiBieSBkZWZhdWx0LlxuICovXG5mdW5jdGlvbiBET01FbGVtZW50KG5vZGUsIG9wdGlvbnMpIHtcbiAgICBpZiAoIW5vZGUpIHRocm93IG5ldyBFcnJvcignRE9NRWxlbWVudCBtdXN0IGJlIGluc3RhbnRpYXRlZCBvbiBhIG5vZGUnKTtcblxuICAgIHRoaXMuX25vZGUgPSBub2RlO1xuXG4gICAgdGhpcy5fcmVxdWVzdGluZ1VwZGF0ZSA9IGZhbHNlO1xuICAgIHRoaXMuX3JlbmRlclNpemVkID0gZmFsc2U7XG4gICAgdGhpcy5fcmVxdWVzdFJlbmRlclNpemUgPSBmYWxzZTtcblxuICAgIHRoaXMuX2NoYW5nZVF1ZXVlID0gW107XG5cbiAgICB0aGlzLl9VSUV2ZW50cyA9IG5vZGUuZ2V0VUlFdmVudHMoKS5zbGljZSgwKTtcbiAgICB0aGlzLl9jbGFzc2VzID0gWydmYW1vdXMtZG9tLWVsZW1lbnQnXTtcbiAgICB0aGlzLl9yZXF1ZXN0aW5nRXZlbnRMaXN0ZW5lcnMgPSBbXTtcbiAgICB0aGlzLl9zdHlsZXMgPSB7fTtcblxuICAgIHRoaXMuc2V0UHJvcGVydHkoJ2Rpc3BsYXknLCBub2RlLmlzU2hvd24oKSA/ICdub25lJyA6ICdibG9jaycpO1xuICAgIHRoaXMub25PcGFjaXR5Q2hhbmdlKG5vZGUuZ2V0T3BhY2l0eSgpKTtcblxuICAgIHRoaXMuX2F0dHJpYnV0ZXMgPSB7fTtcbiAgICB0aGlzLl9jb250ZW50ID0gJyc7XG5cbiAgICB0aGlzLl90YWdOYW1lID0gb3B0aW9ucyAmJiBvcHRpb25zLnRhZ05hbWUgPyBvcHRpb25zLnRhZ05hbWUgOiAnZGl2JztcbiAgICB0aGlzLl9pZCA9IG5vZGUuYWRkQ29tcG9uZW50KHRoaXMpO1xuXG4gICAgdGhpcy5fcmVuZGVyU2l6ZSA9IFswLCAwLCAwXTtcblxuICAgIHRoaXMuX2NhbGxiYWNrcyA9IG5ldyBDYWxsYmFja1N0b3JlKCk7XG5cbiAgICBpZiAoIW9wdGlvbnMpIHJldHVybjtcblxuICAgIHZhciBpO1xuICAgIHZhciBrZXk7XG5cbiAgICBpZiAob3B0aW9ucy5jbGFzc2VzKVxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgb3B0aW9ucy5jbGFzc2VzLmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAgdGhpcy5hZGRDbGFzcyhvcHRpb25zLmNsYXNzZXNbaV0pO1xuXG4gICAgaWYgKG9wdGlvbnMuYXR0cmlidXRlcylcbiAgICAgICAgZm9yIChrZXkgaW4gb3B0aW9ucy5hdHRyaWJ1dGVzKVxuICAgICAgICAgICAgdGhpcy5zZXRBdHRyaWJ1dGUoa2V5LCBvcHRpb25zLmF0dHJpYnV0ZXNba2V5XSk7XG5cbiAgICBpZiAob3B0aW9ucy5wcm9wZXJ0aWVzKVxuICAgICAgICBmb3IgKGtleSBpbiBvcHRpb25zLnByb3BlcnRpZXMpXG4gICAgICAgICAgICB0aGlzLnNldFByb3BlcnR5KGtleSwgb3B0aW9ucy5wcm9wZXJ0aWVzW2tleV0pO1xuXG4gICAgaWYgKG9wdGlvbnMuaWQpIHRoaXMuc2V0SWQob3B0aW9ucy5pZCk7XG4gICAgaWYgKG9wdGlvbnMuY29udGVudCkgdGhpcy5zZXRDb250ZW50KG9wdGlvbnMuY29udGVudCk7XG4gICAgaWYgKG9wdGlvbnMuY3V0b3V0ID09PSBmYWxzZSkgdGhpcy5zZXRDdXRvdXRTdGF0ZShvcHRpb25zLmN1dG91dCk7XG59XG5cbi8qKlxuICogU2VyaWFsaXplcyB0aGUgc3RhdGUgb2YgdGhlIERPTUVsZW1lbnQuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge09iamVjdH0gc2VyaWFsaXplZCBpbnRlcmFsIHN0YXRlXG4gKi9cbkRPTUVsZW1lbnQucHJvdG90eXBlLmdldFZhbHVlID0gZnVuY3Rpb24gZ2V0VmFsdWUoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgY2xhc3NlczogdGhpcy5fY2xhc3NlcyxcbiAgICAgICAgc3R5bGVzOiB0aGlzLl9zdHlsZXMsXG4gICAgICAgIGF0dHJpYnV0ZXM6IHRoaXMuX2F0dHJpYnV0ZXMsXG4gICAgICAgIGNvbnRlbnQ6IHRoaXMuX2NvbnRlbnQsXG4gICAgICAgIGlkOiB0aGlzLl9hdHRyaWJ1dGVzLmlkLFxuICAgICAgICB0YWdOYW1lOiB0aGlzLl90YWdOYW1lXG4gICAgfTtcbn07XG5cbi8qKlxuICogTWV0aG9kIHRvIGJlIGludm9rZWQgYnkgdGhlIG5vZGUgYXMgc29vbiBhcyBhbiB1cGRhdGUgb2NjdXJzLiBUaGlzIGFsbG93c1xuICogdGhlIERPTUVsZW1lbnQgcmVuZGVyYWJsZSB0byBkeW5hbWljYWxseSByZWFjdCB0byBzdGF0ZSBjaGFuZ2VzIG9uIHRoZSBOb2RlLlxuICpcbiAqIFRoaXMgZmx1c2hlcyB0aGUgaW50ZXJuYWwgZHJhdyBjb21tYW5kIHF1ZXVlIGJ5IHNlbmRpbmcgaW5kaXZpZHVhbCBjb21tYW5kc1xuICogdG8gdGhlIG5vZGUgdXNpbmcgYHNlbmREcmF3Q29tbWFuZGAuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkRPTUVsZW1lbnQucHJvdG90eXBlLm9uVXBkYXRlID0gZnVuY3Rpb24gb25VcGRhdGUoKSB7XG4gICAgdmFyIG5vZGUgPSB0aGlzLl9ub2RlO1xuICAgIHZhciBxdWV1ZSA9IHRoaXMuX2NoYW5nZVF1ZXVlO1xuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG5cbiAgICBpZiAobGVuICYmIG5vZGUpIHtcbiAgICAgICAgbm9kZS5zZW5kRHJhd0NvbW1hbmQoJ1dJVEgnKTtcbiAgICAgICAgbm9kZS5zZW5kRHJhd0NvbW1hbmQobm9kZS5nZXRMb2NhdGlvbigpKTtcblxuICAgICAgICB3aGlsZSAobGVuLS0pIG5vZGUuc2VuZERyYXdDb21tYW5kKHF1ZXVlLnNoaWZ0KCkpO1xuICAgICAgICBpZiAodGhpcy5fcmVxdWVzdFJlbmRlclNpemUpIHtcbiAgICAgICAgICAgIG5vZGUuc2VuZERyYXdDb21tYW5kKCdET01fUkVOREVSX1NJWkUnKTtcbiAgICAgICAgICAgIG5vZGUuc2VuZERyYXdDb21tYW5kKG5vZGUuZ2V0TG9jYXRpb24oKSk7XG4gICAgICAgICAgICB0aGlzLl9yZXF1ZXN0UmVuZGVyU2l6ZSA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICB0aGlzLl9yZXF1ZXN0aW5nVXBkYXRlID0gZmFsc2U7XG59O1xuXG4vKipcbiAqIE1ldGhvZCB0byBiZSBpbnZva2VkIGJ5IHRoZSBOb2RlIGFzIHNvb24gYXMgdGhlIG5vZGUgKG9yIGFueSBvZiBpdHNcbiAqIGFuY2VzdG9ycykgaXMgYmVpbmcgbW91bnRlZC5cbiAqXG4gKiBAbWV0aG9kIG9uTW91bnRcbiAqXG4gKiBAcGFyYW0ge05vZGV9IG5vZGUgICAgICBQYXJlbnQgbm9kZSB0byB3aGljaCB0aGUgY29tcG9uZW50IHNob3VsZCBiZSBhZGRlZC5cbiAqIEBwYXJhbSB7U3RyaW5nfSBpZCAgICAgIFBhdGggYXQgd2hpY2ggdGhlIGNvbXBvbmVudCAob3Igbm9kZSkgaXMgYmVpbmdcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICBhdHRhY2hlZC4gVGhlIHBhdGggaXMgYmVpbmcgc2V0IG9uIHRoZSBhY3R1YWxcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICBET01FbGVtZW50IGFzIGEgYGRhdGEtZmEtcGF0aGAtYXR0cmlidXRlLlxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkRPTUVsZW1lbnQucHJvdG90eXBlLm9uTW91bnQgPSBmdW5jdGlvbiBvbk1vdW50KG5vZGUsIGlkKSB7XG4gICAgdGhpcy5fbm9kZSA9IG5vZGU7XG4gICAgdGhpcy5faWQgPSBpZDtcbiAgICB0aGlzLl9VSUV2ZW50cyA9IG5vZGUuZ2V0VUlFdmVudHMoKS5zbGljZSgwKTtcbiAgICB0aGlzLmRyYXcoKTtcbiAgICB0aGlzLnNldEF0dHJpYnV0ZSgnZGF0YS1mYS1wYXRoJywgbm9kZS5nZXRMb2NhdGlvbigpKTtcbn07XG5cbi8qKlxuICogTWV0aG9kIHRvIGJlIGludm9rZWQgYnkgdGhlIE5vZGUgYXMgc29vbiBhcyB0aGUgbm9kZSBpcyBiZWluZyBkaXNtb3VudGVkXG4gKiBlaXRoZXIgZGlyZWN0bHkgb3IgYnkgZGlzbW91bnRpbmcgb25lIG9mIGl0cyBhbmNlc3RvcnMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkRPTUVsZW1lbnQucHJvdG90eXBlLm9uRGlzbW91bnQgPSBmdW5jdGlvbiBvbkRpc21vdW50KCkge1xuICAgIHRoaXMuc2V0UHJvcGVydHkoJ2Rpc3BsYXknLCAnbm9uZScpO1xuICAgIHRoaXMuc2V0QXR0cmlidXRlKCdkYXRhLWZhLXBhdGgnLCAnJyk7XG4gICAgdGhpcy5faW5pdGlhbGl6ZWQgPSBmYWxzZTtcbn07XG5cbi8qKlxuICogTWV0aG9kIHRvIGJlIGludm9rZWQgYnkgdGhlIG5vZGUgYXMgc29vbiBhcyB0aGUgRE9NRWxlbWVudCBpcyBiZWluZyBzaG93bi5cbiAqIFRoaXMgcmVzdWx0cyBpbnRvIHRoZSBET01FbGVtZW50IHNldHRpbmcgdGhlIGBkaXNwbGF5YCBwcm9wZXJ0eSB0byBgYmxvY2tgXG4gKiBhbmQgdGhlcmVmb3JlIHZpc3VhbGx5IHNob3dpbmcgdGhlIGNvcnJlc3BvbmRpbmcgRE9NRWxlbWVudCAoYWdhaW4pLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5ET01FbGVtZW50LnByb3RvdHlwZS5vblNob3cgPSBmdW5jdGlvbiBvblNob3coKSB7XG4gICAgdGhpcy5zZXRQcm9wZXJ0eSgnZGlzcGxheScsICdibG9jaycpO1xufTtcblxuLyoqXG4gKiBNZXRob2QgdG8gYmUgaW52b2tlZCBieSB0aGUgbm9kZSBhcyBzb29uIGFzIHRoZSBET01FbGVtZW50IGlzIGJlaW5nIGhpZGRlbi5cbiAqIFRoaXMgcmVzdWx0cyBpbnRvIHRoZSBET01FbGVtZW50IHNldHRpbmcgdGhlIGBkaXNwbGF5YCBwcm9wZXJ0eSB0byBgbm9uZWBcbiAqIGFuZCB0aGVyZWZvcmUgdmlzdWFsbHkgaGlkaW5nIHRoZSBjb3JyZXNwb25kaW5nIERPTUVsZW1lbnQgKGFnYWluKS5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuRE9NRWxlbWVudC5wcm90b3R5cGUub25IaWRlID0gZnVuY3Rpb24gb25IaWRlKCkge1xuICAgIHRoaXMuc2V0UHJvcGVydHkoJ2Rpc3BsYXknLCAnbm9uZScpO1xufTtcblxuLyoqXG4gKiBFbmFibGVzIG9yIGRpc2FibGVzIFdlYkdMICdjdXRvdXQnIGZvciB0aGlzIGVsZW1lbnQsIHdoaWNoIGFmZmVjdHNcbiAqIGhvdyB0aGUgZWxlbWVudCBpcyBsYXllcmVkIHdpdGggV2ViR0wgb2JqZWN0cyBpbiB0aGUgc2NlbmUuICBUaGlzIGlzIGRlc2lnbmVkXG4gKiBtYWlubHkgYXMgYSB3YXkgdG8gYWNoZWl2ZVxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge0Jvb2xlYW59IHVzZXNDdXRvdXQgIFRoZSBwcmVzZW5jZSBvZiBhIFdlYkdMICdjdXRvdXQnIGZvciB0aGlzIGVsZW1lbnQuXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuRE9NRWxlbWVudC5wcm90b3R5cGUuc2V0Q3V0b3V0U3RhdGUgPSBmdW5jdGlvbiBzZXRDdXRvdXRTdGF0ZSh1c2VzQ3V0b3V0KSB7XG4gICAgdGhpcy5fY2hhbmdlUXVldWUucHVzaCgnR0xfQ1VUT1VUX1NUQVRFJywgdXNlc0N1dG91dCk7XG5cbiAgICBpZiAodGhpcy5faW5pdGlhbGl6ZWQpIHRoaXMuX3JlcXVlc3RVcGRhdGUoKTtcbn07XG5cbi8qKlxuICogTWV0aG9kIHRvIGJlIGludm9rZWQgYnkgdGhlIG5vZGUgYXMgc29vbiBhcyB0aGUgdHJhbnNmb3JtIG1hdHJpeCBhc3NvY2lhdGVkXG4gKiB3aXRoIHRoZSBub2RlIGNoYW5nZXMuIFRoZSBET01FbGVtZW50IHdpbGwgcmVhY3QgdG8gdHJhbnNmb3JtIGNoYW5nZXMgYnkgc2VuZGluZ1xuICogYENIQU5HRV9UUkFOU0ZPUk1gIGNvbW1hbmRzIHRvIHRoZSBgRE9NUmVuZGVyZXJgLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge0Zsb2F0MzJBcnJheX0gdHJhbnNmb3JtIFRoZSBmaW5hbCB0cmFuc2Zvcm0gbWF0cml4XG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuRE9NRWxlbWVudC5wcm90b3R5cGUub25UcmFuc2Zvcm1DaGFuZ2UgPSBmdW5jdGlvbiBvblRyYW5zZm9ybUNoYW5nZSAodHJhbnNmb3JtKSB7XG4gICAgdGhpcy5fY2hhbmdlUXVldWUucHVzaCgnQ0hBTkdFX1RSQU5TRk9STScpO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0cmFuc2Zvcm0ubGVuZ3RoIDsgaSA8IGxlbiA7IGkrKylcbiAgICAgICAgdGhpcy5fY2hhbmdlUXVldWUucHVzaCh0cmFuc2Zvcm1baV0pO1xuXG4gICAgdGhpcy5vblVwZGF0ZSgpO1xufTtcblxuLyoqXG4gKiBNZXRob2QgdG8gYmUgaW52b2tlZCBieSB0aGUgbm9kZSBhcyBzb29uIGFzIGl0cyBjb21wdXRlZCBzaXplIGNoYW5nZXMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7RmxvYXQzMkFycmF5fSBzaXplIFNpemUgb2YgdGhlIE5vZGUgaW4gcGl4ZWxzXG4gKlxuICogQHJldHVybiB7RE9NRWxlbWVudH0gdGhpc1xuICovXG5ET01FbGVtZW50LnByb3RvdHlwZS5vblNpemVDaGFuZ2UgPSBmdW5jdGlvbiBvblNpemVDaGFuZ2Uoc2l6ZSkge1xuICAgIHZhciBzaXplTW9kZSA9IHRoaXMuX25vZGUuZ2V0U2l6ZU1vZGUoKTtcbiAgICB2YXIgc2l6ZWRYID0gc2l6ZU1vZGVbMF0gIT09IFJFTkRFUl9TSVpFO1xuICAgIHZhciBzaXplZFkgPSBzaXplTW9kZVsxXSAhPT0gUkVOREVSX1NJWkU7XG4gICAgaWYgKHRoaXMuX2luaXRpYWxpemVkKVxuICAgICAgICB0aGlzLl9jaGFuZ2VRdWV1ZS5wdXNoKCdDSEFOR0VfU0laRScsXG4gICAgICAgICAgICBzaXplZFggPyBzaXplWzBdIDogc2l6ZWRYLFxuICAgICAgICAgICAgc2l6ZWRZID8gc2l6ZVsxXSA6IHNpemVkWSk7XG5cbiAgICBpZiAoIXRoaXMuX3JlcXVlc3RpbmdVcGRhdGUpIHRoaXMuX3JlcXVlc3RVcGRhdGUoKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogTWV0aG9kIHRvIGJlIGludm9rZWQgYnkgdGhlIG5vZGUgYXMgc29vbiBhcyBpdHMgb3BhY2l0eSBjaGFuZ2VzXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBvcGFjaXR5IFRoZSBuZXcgb3BhY2l0eSwgYXMgYSBzY2FsYXIgZnJvbSAwIHRvIDFcbiAqXG4gKiBAcmV0dXJuIHtET01FbGVtZW50fSB0aGlzXG4gKi9cbkRPTUVsZW1lbnQucHJvdG90eXBlLm9uT3BhY2l0eUNoYW5nZSA9IGZ1bmN0aW9uIG9uT3BhY2l0eUNoYW5nZShvcGFjaXR5KSB7XG4gICAgcmV0dXJuIHRoaXMuc2V0UHJvcGVydHkoJ29wYWNpdHknLCBvcGFjaXR5KTtcbn07XG5cbi8qKlxuICogTWV0aG9kIHRvIGJlIGludm9rZWQgYnkgdGhlIG5vZGUgYXMgc29vbiBhcyBhIG5ldyBVSUV2ZW50IGlzIGJlaW5nIGFkZGVkLlxuICogVGhpcyByZXN1bHRzIGludG8gYW4gYEFERF9FVkVOVF9MSVNURU5FUmAgY29tbWFuZCBiZWluZyBzZW50LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBVSUV2ZW50IFVJRXZlbnQgdG8gYmUgc3Vic2NyaWJlZCB0byAoZS5nLiBgY2xpY2tgKVxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkRPTUVsZW1lbnQucHJvdG90eXBlLm9uQWRkVUlFdmVudCA9IGZ1bmN0aW9uIG9uQWRkVUlFdmVudChVSUV2ZW50KSB7XG4gICAgaWYgKHRoaXMuX1VJRXZlbnRzLmluZGV4T2YoVUlFdmVudCkgPT09IC0xKSB7XG4gICAgICAgIHRoaXMuX3N1YnNjcmliZShVSUV2ZW50KTtcbiAgICAgICAgdGhpcy5fVUlFdmVudHMucHVzaChVSUV2ZW50KTtcbiAgICB9XG4gICAgZWxzZSBpZiAodGhpcy5faW5EcmF3KSB7XG4gICAgICAgIHRoaXMuX3N1YnNjcmliZShVSUV2ZW50KTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFwcGVuZHMgYW4gYEFERF9FVkVOVF9MSVNURU5FUmAgY29tbWFuZCB0byB0aGUgY29tbWFuZCBxdWV1ZS5cbiAqXG4gKiBAbWV0aG9kXG4gKiBAcHJpdmF0ZVxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBVSUV2ZW50IEV2ZW50IHR5cGUgKGUuZy4gYGNsaWNrYClcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5ET01FbGVtZW50LnByb3RvdHlwZS5fc3Vic2NyaWJlID0gZnVuY3Rpb24gX3N1YnNjcmliZSAoVUlFdmVudCkge1xuICAgIGlmICh0aGlzLl9pbml0aWFsaXplZCkge1xuICAgICAgICB0aGlzLl9jaGFuZ2VRdWV1ZS5wdXNoKCdTVUJTQ1JJQkUnLCBVSUV2ZW50LCB0cnVlKTtcbiAgICB9XG4gICAgaWYgKCF0aGlzLl9yZXF1ZXN0aW5nVXBkYXRlKSB0aGlzLl9yZXF1ZXN0VXBkYXRlKCk7XG59O1xuXG4vKipcbiAqIE1ldGhvZCB0byBiZSBpbnZva2VkIGJ5IHRoZSBub2RlIGFzIHNvb24gYXMgdGhlIHVuZGVybHlpbmcgc2l6ZSBtb2RlXG4gKiBjaGFuZ2VzLiBUaGlzIHJlc3VsdHMgaW50byB0aGUgc2l6ZSBiZWluZyBmZXRjaGVkIGZyb20gdGhlIG5vZGUgaW5cbiAqIG9yZGVyIHRvIHVwZGF0ZSB0aGUgYWN0dWFsLCByZW5kZXJlZCBzaXplLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0geCB0aGUgc2l6aW5nIG1vZGUgaW4gdXNlIGZvciBkZXRlcm1pbmluZyBzaXplIGluIHRoZSB4IGRpcmVjdGlvblxuICogQHBhcmFtIHtOdW1iZXJ9IHkgdGhlIHNpemluZyBtb2RlIGluIHVzZSBmb3IgZGV0ZXJtaW5pbmcgc2l6ZSBpbiB0aGUgeSBkaXJlY3Rpb25cbiAqIEBwYXJhbSB7TnVtYmVyfSB6IHRoZSBzaXppbmcgbW9kZSBpbiB1c2UgZm9yIGRldGVybWluaW5nIHNpemUgaW4gdGhlIHogZGlyZWN0aW9uXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuRE9NRWxlbWVudC5wcm90b3R5cGUub25TaXplTW9kZUNoYW5nZSA9IGZ1bmN0aW9uIG9uU2l6ZU1vZGVDaGFuZ2UoeCwgeSwgeikge1xuICAgIGlmICh4ID09PSBSRU5ERVJfU0laRSB8fCB5ID09PSBSRU5ERVJfU0laRSB8fCB6ID09PSBSRU5ERVJfU0laRSkge1xuICAgICAgICB0aGlzLl9yZW5kZXJTaXplZCA9IHRydWU7XG4gICAgICAgIHRoaXMuX3JlcXVlc3RSZW5kZXJTaXplID0gdHJ1ZTtcbiAgICB9XG4gICAgdGhpcy5vblNpemVDaGFuZ2UodGhpcy5fbm9kZS5nZXRTaXplKCkpO1xufTtcblxuLyoqXG4gKiBNZXRob2QgdG8gYmUgcmV0cmlldmUgdGhlIHJlbmRlcmVkIHNpemUgb2YgdGhlIERPTSBlbGVtZW50IHRoYXQgaXNcbiAqIGRyYXduIGZvciB0aGlzIG5vZGUuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge0FycmF5fSBzaXplIG9mIHRoZSByZW5kZXJlZCBET00gZWxlbWVudCBpbiBwaXhlbHNcbiAqL1xuRE9NRWxlbWVudC5wcm90b3R5cGUuZ2V0UmVuZGVyU2l6ZSA9IGZ1bmN0aW9uIGdldFJlbmRlclNpemUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3JlbmRlclNpemU7XG59O1xuXG4vKipcbiAqIE1ldGhvZCB0byBoYXZlIHRoZSBjb21wb25lbnQgcmVxdWVzdCBhbiB1cGRhdGUgZnJvbSBpdHMgTm9kZVxuICpcbiAqIEBtZXRob2RcbiAqIEBwcml2YXRlXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuRE9NRWxlbWVudC5wcm90b3R5cGUuX3JlcXVlc3RVcGRhdGUgPSBmdW5jdGlvbiBfcmVxdWVzdFVwZGF0ZSgpIHtcbiAgICBpZiAoIXRoaXMuX3JlcXVlc3RpbmdVcGRhdGUpIHtcbiAgICAgICAgdGhpcy5fbm9kZS5yZXF1ZXN0VXBkYXRlKHRoaXMuX2lkKTtcbiAgICAgICAgdGhpcy5fcmVxdWVzdGluZ1VwZGF0ZSA9IHRydWU7XG4gICAgfVxufTtcblxuLyoqXG4gKiBJbml0aWFsaXplcyB0aGUgRE9NRWxlbWVudCBieSBzZW5kaW5nIHRoZSBgSU5JVF9ET01gIGNvbW1hbmQuIFRoaXMgY3JlYXRlc1xuICogb3IgcmVhbGxvY2F0ZXMgYSBuZXcgRWxlbWVudCBpbiB0aGUgYWN0dWFsIERPTSBoaWVyYXJjaHkuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkRPTUVsZW1lbnQucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbiBpbml0KCkge1xuICAgIHRoaXMuX2NoYW5nZVF1ZXVlLnB1c2goJ0lOSVRfRE9NJywgdGhpcy5fdGFnTmFtZSk7XG4gICAgdGhpcy5faW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgIHRoaXMub25UcmFuc2Zvcm1DaGFuZ2UodGhpcy5fbm9kZS5nZXRUcmFuc2Zvcm0oKSk7XG4gICAgdGhpcy5vblNpemVDaGFuZ2UodGhpcy5fbm9kZS5nZXRTaXplKCkpO1xuICAgIGlmICghdGhpcy5fcmVxdWVzdGluZ1VwZGF0ZSkgdGhpcy5fcmVxdWVzdFVwZGF0ZSgpO1xufTtcblxuLyoqXG4gKiBTZXRzIHRoZSBpZCBhdHRyaWJ1dGUgb2YgdGhlIERPTUVsZW1lbnQuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBpZCBOZXcgaWQgdG8gYmUgc2V0XG4gKlxuICogQHJldHVybiB7RE9NRWxlbWVudH0gdGhpc1xuICovXG5ET01FbGVtZW50LnByb3RvdHlwZS5zZXRJZCA9IGZ1bmN0aW9uIHNldElkIChpZCkge1xuICAgIHRoaXMuc2V0QXR0cmlidXRlKCdpZCcsIGlkKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQWRkcyBhIG5ldyBjbGFzcyB0byB0aGUgaW50ZXJuYWwgY2xhc3MgbGlzdCBvZiB0aGUgdW5kZXJseWluZyBFbGVtZW50IGluIHRoZVxuICogRE9NLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdmFsdWUgTmV3IGNsYXNzIG5hbWUgdG8gYmUgYWRkZWRcbiAqXG4gKiBAcmV0dXJuIHtET01FbGVtZW50fSB0aGlzXG4gKi9cbkRPTUVsZW1lbnQucHJvdG90eXBlLmFkZENsYXNzID0gZnVuY3Rpb24gYWRkQ2xhc3MgKHZhbHVlKSB7XG4gICAgaWYgKHRoaXMuX2NsYXNzZXMuaW5kZXhPZih2YWx1ZSkgPCAwKSB7XG4gICAgICAgIGlmICh0aGlzLl9pbml0aWFsaXplZCkgdGhpcy5fY2hhbmdlUXVldWUucHVzaCgnQUREX0NMQVNTJywgdmFsdWUpO1xuICAgICAgICB0aGlzLl9jbGFzc2VzLnB1c2godmFsdWUpO1xuICAgICAgICBpZiAoIXRoaXMuX3JlcXVlc3RpbmdVcGRhdGUpIHRoaXMuX3JlcXVlc3RVcGRhdGUoKTtcbiAgICAgICAgaWYgKHRoaXMuX3JlbmRlclNpemVkKSB0aGlzLl9yZXF1ZXN0UmVuZGVyU2l6ZSA9IHRydWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9pbkRyYXcpIHtcbiAgICAgICAgaWYgKHRoaXMuX2luaXRpYWxpemVkKSB0aGlzLl9jaGFuZ2VRdWV1ZS5wdXNoKCdBRERfQ0xBU1MnLCB2YWx1ZSk7XG4gICAgICAgIGlmICghdGhpcy5fcmVxdWVzdGluZ1VwZGF0ZSkgdGhpcy5fcmVxdWVzdFVwZGF0ZSgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVtb3ZlcyBhIGNsYXNzIGZyb20gdGhlIERPTUVsZW1lbnQncyBjbGFzc0xpc3QuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB2YWx1ZSBDbGFzcyBuYW1lIHRvIGJlIHJlbW92ZWRcbiAqXG4gKiBAcmV0dXJuIHtET01FbGVtZW50fSB0aGlzXG4gKi9cbkRPTUVsZW1lbnQucHJvdG90eXBlLnJlbW92ZUNsYXNzID0gZnVuY3Rpb24gcmVtb3ZlQ2xhc3MgKHZhbHVlKSB7XG4gICAgdmFyIGluZGV4ID0gdGhpcy5fY2xhc3Nlcy5pbmRleE9mKHZhbHVlKTtcblxuICAgIGlmIChpbmRleCA8IDApIHJldHVybiB0aGlzO1xuXG4gICAgdGhpcy5fY2hhbmdlUXVldWUucHVzaCgnUkVNT1ZFX0NMQVNTJywgdmFsdWUpO1xuXG4gICAgdGhpcy5fY2xhc3Nlcy5zcGxpY2UoaW5kZXgsIDEpO1xuXG4gICAgaWYgKCF0aGlzLl9yZXF1ZXN0aW5nVXBkYXRlKSB0aGlzLl9yZXF1ZXN0VXBkYXRlKCk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5cbi8qKlxuICogQ2hlY2tzIGlmIHRoZSBET01FbGVtZW50IGhhcyB0aGUgcGFzc2VkIGluIGNsYXNzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdmFsdWUgVGhlIGNsYXNzIG5hbWVcbiAqXG4gKiBAcmV0dXJuIHtCb29sZWFufSBCb29sZWFuIHZhbHVlIGluZGljYXRpbmcgd2hldGhlciB0aGUgcGFzc2VkIGluIGNsYXNzIG5hbWUgaXMgaW4gdGhlIERPTUVsZW1lbnQncyBjbGFzcyBsaXN0LlxuICovXG5ET01FbGVtZW50LnByb3RvdHlwZS5oYXNDbGFzcyA9IGZ1bmN0aW9uIGhhc0NsYXNzICh2YWx1ZSkge1xuICAgIHJldHVybiB0aGlzLl9jbGFzc2VzLmluZGV4T2YodmFsdWUpICE9PSAtMTtcbn07XG5cbi8qKlxuICogU2V0cyBhbiBhdHRyaWJ1dGUgb2YgdGhlIERPTUVsZW1lbnQuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIEF0dHJpYnV0ZSBrZXkgKGUuZy4gYHNyY2ApXG4gKiBAcGFyYW0ge1N0cmluZ30gdmFsdWUgQXR0cmlidXRlIHZhbHVlIChlLmcuIGBodHRwOi8vZmFtby51c2ApXG4gKlxuICogQHJldHVybiB7RE9NRWxlbWVudH0gdGhpc1xuICovXG5ET01FbGVtZW50LnByb3RvdHlwZS5zZXRBdHRyaWJ1dGUgPSBmdW5jdGlvbiBzZXRBdHRyaWJ1dGUgKG5hbWUsIHZhbHVlKSB7XG4gICAgaWYgKHRoaXMuX2F0dHJpYnV0ZXNbbmFtZV0gIT09IHZhbHVlIHx8IHRoaXMuX2luRHJhdykge1xuICAgICAgICB0aGlzLl9hdHRyaWJ1dGVzW25hbWVdID0gdmFsdWU7XG4gICAgICAgIGlmICh0aGlzLl9pbml0aWFsaXplZCkgdGhpcy5fY2hhbmdlUXVldWUucHVzaCgnQ0hBTkdFX0FUVFJJQlVURScsIG5hbWUsIHZhbHVlKTtcbiAgICAgICAgaWYgKCF0aGlzLl9yZXF1ZXN0VXBkYXRlKSB0aGlzLl9yZXF1ZXN0VXBkYXRlKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFNldHMgYSBDU1MgcHJvcGVydHlcbiAqXG4gKiBAY2hhaW5hYmxlXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgIE5hbWUgb2YgdGhlIENTUyBydWxlIChlLmcuIGBiYWNrZ3JvdW5kLWNvbG9yYClcbiAqIEBwYXJhbSB7U3RyaW5nfSB2YWx1ZSBWYWx1ZSBvZiBDU1MgcHJvcGVydHkgKGUuZy4gYHJlZGApXG4gKlxuICogQHJldHVybiB7RE9NRWxlbWVudH0gdGhpc1xuICovXG5ET01FbGVtZW50LnByb3RvdHlwZS5zZXRQcm9wZXJ0eSA9IGZ1bmN0aW9uIHNldFByb3BlcnR5IChuYW1lLCB2YWx1ZSkge1xuICAgIGlmICh0aGlzLl9zdHlsZXNbbmFtZV0gIT09IHZhbHVlIHx8IHRoaXMuX2luRHJhdykge1xuICAgICAgICB0aGlzLl9zdHlsZXNbbmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgaWYgKHRoaXMuX2luaXRpYWxpemVkKSB0aGlzLl9jaGFuZ2VRdWV1ZS5wdXNoKCdDSEFOR0VfUFJPUEVSVFknLCBuYW1lLCB2YWx1ZSk7XG4gICAgICAgIGlmICghdGhpcy5fcmVxdWVzdGluZ1VwZGF0ZSkgdGhpcy5fcmVxdWVzdFVwZGF0ZSgpO1xuICAgICAgICBpZiAodGhpcy5fcmVuZGVyU2l6ZWQpIHRoaXMuX3JlcXVlc3RSZW5kZXJTaXplID0gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU2V0cyB0aGUgY29udGVudCBvZiB0aGUgRE9NRWxlbWVudC4gVGhpcyBpcyB1c2luZyBgaW5uZXJIVE1MYCwgZXNjYXBpbmcgdXNlclxuICogZ2VuZXJhdGVkIGNvbnRlbnQgaXMgdGhlcmVmb3JlIGVzc2VudGlhbCBmb3Igc2VjdXJpdHkgcHVycG9zZXMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBjb250ZW50IENvbnRlbnQgdG8gYmUgc2V0IHVzaW5nIGAuaW5uZXJIVE1MID0gLi4uYFxuICpcbiAqIEByZXR1cm4ge0RPTUVsZW1lbnR9IHRoaXNcbiAqL1xuRE9NRWxlbWVudC5wcm90b3R5cGUuc2V0Q29udGVudCA9IGZ1bmN0aW9uIHNldENvbnRlbnQgKGNvbnRlbnQpIHtcbiAgICBpZiAodGhpcy5fY29udGVudCAhPT0gY29udGVudCB8fCB0aGlzLl9pbkRyYXcpIHtcbiAgICAgICAgdGhpcy5fY29udGVudCA9IGNvbnRlbnQ7XG4gICAgICAgIGlmICh0aGlzLl9pbml0aWFsaXplZCkgdGhpcy5fY2hhbmdlUXVldWUucHVzaCgnQ0hBTkdFX0NPTlRFTlQnLCBjb250ZW50KTtcbiAgICAgICAgaWYgKCF0aGlzLl9yZXF1ZXN0aW5nVXBkYXRlKSB0aGlzLl9yZXF1ZXN0VXBkYXRlKCk7XG4gICAgICAgIGlmICh0aGlzLl9yZW5kZXJTaXplZCkgdGhpcy5fcmVxdWVzdFJlbmRlclNpemUgPSB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTdWJzY3JpYmVzIHRvIGEgRE9NRWxlbWVudCB1c2luZy5cbiAqXG4gKiBAbWV0aG9kIG9uXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50ICAgICAgIFRoZSBldmVudCB0eXBlIChlLmcuIGBjbGlja2ApLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgIEhhbmRsZXIgZnVuY3Rpb24gZm9yIHRoZSBzcGVjaWZpZWQgZXZlbnQgdHlwZVxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbiB3aGljaCB0aGUgcGF5bG9hZCBldmVudCBvYmplY3Qgd2lsbCBiZVxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXNzZWQgaW50by5cbiAqXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gQSBmdW5jdGlvbiB0byBjYWxsIGlmIHlvdSB3YW50IHRvIHJlbW92ZSB0aGUgY2FsbGJhY2tcbiAqL1xuRE9NRWxlbWVudC5wcm90b3R5cGUub24gPSBmdW5jdGlvbiBvbiAoZXZlbnQsIGxpc3RlbmVyKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NhbGxiYWNrcy5vbihldmVudCwgbGlzdGVuZXIpO1xufTtcblxuLyoqXG4gKiBGdW5jdGlvbiB0byBiZSBpbnZva2VkIGJ5IHRoZSBOb2RlIHdoZW5ldmVyIGFuIGV2ZW50IGlzIGJlaW5nIHJlY2VpdmVkLlxuICogVGhlcmUgYXJlIHR3byBkaWZmZXJlbnQgd2F5cyB0byBzdWJzY3JpYmUgZm9yIHRob3NlIGV2ZW50czpcbiAqXG4gKiAxLiBCeSBvdmVycmlkaW5nIHRoZSBvblJlY2VpdmUgbWV0aG9kIChhbmQgcG9zc2libHkgdXNpbmcgYHN3aXRjaGAgaW4gb3JkZXJcbiAqICAgICB0byBkaWZmZXJlbnRpYXRlIGJldHdlZW4gdGhlIGRpZmZlcmVudCBldmVudCB0eXBlcykuXG4gKiAyLiBCeSB1c2luZyBET01FbGVtZW50IGFuZCB1c2luZyB0aGUgYnVpbHQtaW4gQ2FsbGJhY2tTdG9yZS5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IEV2ZW50IHR5cGUgKGUuZy4gYGNsaWNrYClcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYXlsb2FkIEV2ZW50IG9iamVjdC5cbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5ET01FbGVtZW50LnByb3RvdHlwZS5vblJlY2VpdmUgPSBmdW5jdGlvbiBvblJlY2VpdmUgKGV2ZW50LCBwYXlsb2FkKSB7XG4gICAgaWYgKGV2ZW50ID09PSAncmVzaXplJykge1xuICAgICAgICB0aGlzLl9yZW5kZXJTaXplWzBdID0gcGF5bG9hZC52YWxbMF07XG4gICAgICAgIHRoaXMuX3JlbmRlclNpemVbMV0gPSBwYXlsb2FkLnZhbFsxXTtcbiAgICAgICAgaWYgKCF0aGlzLl9yZXF1ZXN0aW5nVXBkYXRlKSB0aGlzLl9yZXF1ZXN0VXBkYXRlKCk7XG4gICAgfVxuICAgIHRoaXMuX2NhbGxiYWNrcy50cmlnZ2VyKGV2ZW50LCBwYXlsb2FkKTtcbn07XG5cbi8qKlxuICogVGhlIGRyYXcgZnVuY3Rpb24gaXMgYmVpbmcgdXNlZCBpbiBvcmRlciB0byBhbGxvdyBtdXRhdGluZyB0aGUgRE9NRWxlbWVudFxuICogYmVmb3JlIGFjdHVhbGx5IG1vdW50aW5nIHRoZSBjb3JyZXNwb25kaW5nIG5vZGUuXG4gKlxuICogQG1ldGhvZFxuICogQHByaXZhdGVcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5ET01FbGVtZW50LnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24gZHJhdygpIHtcbiAgICB2YXIga2V5O1xuICAgIHZhciBpO1xuICAgIHZhciBsZW47XG5cbiAgICB0aGlzLl9pbkRyYXcgPSB0cnVlO1xuXG4gICAgdGhpcy5pbml0KCk7XG5cbiAgICBmb3IgKGkgPSAwLCBsZW4gPSB0aGlzLl9jbGFzc2VzLmxlbmd0aCA7IGkgPCBsZW4gOyBpKyspXG4gICAgICAgIHRoaXMuYWRkQ2xhc3ModGhpcy5fY2xhc3Nlc1tpXSk7XG5cbiAgICBpZiAodGhpcy5fY29udGVudCkgdGhpcy5zZXRDb250ZW50KHRoaXMuX2NvbnRlbnQpO1xuXG4gICAgZm9yIChrZXkgaW4gdGhpcy5fc3R5bGVzKVxuICAgICAgICBpZiAodGhpcy5fc3R5bGVzW2tleV0pXG4gICAgICAgICAgICB0aGlzLnNldFByb3BlcnR5KGtleSwgdGhpcy5fc3R5bGVzW2tleV0pO1xuXG4gICAgZm9yIChrZXkgaW4gdGhpcy5fYXR0cmlidXRlcylcbiAgICAgICAgaWYgKHRoaXMuX2F0dHJpYnV0ZXNba2V5XSlcbiAgICAgICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKGtleSwgdGhpcy5fYXR0cmlidXRlc1trZXldKTtcblxuICAgIGZvciAoaSA9IDAsIGxlbiA9IHRoaXMuX1VJRXZlbnRzLmxlbmd0aCA7IGkgPCBsZW4gOyBpKyspXG4gICAgICAgIHRoaXMub25BZGRVSUV2ZW50KHRoaXMuX1VJRXZlbnRzW2ldKTtcblxuICAgIHRoaXMuX2luRHJhdyA9IGZhbHNlO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBET01FbGVtZW50O1xuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgRWxlbWVudENhY2hlID0gcmVxdWlyZSgnLi9FbGVtZW50Q2FjaGUnKTtcbnZhciBtYXRoID0gcmVxdWlyZSgnLi9NYXRoJyk7XG52YXIgdmVuZG9yUHJlZml4ID0gcmVxdWlyZSgnLi4vdXRpbGl0aWVzL3ZlbmRvclByZWZpeCcpO1xudmFyIGV2ZW50TWFwID0gcmVxdWlyZSgnLi9ldmVudHMvRXZlbnRNYXAnKTtcblxudmFyIFRSQU5TRk9STSA9IG51bGw7XG5cbi8qKlxuICogRE9NUmVuZGVyZXIgaXMgYSBjbGFzcyByZXNwb25zaWJsZSBmb3IgYWRkaW5nIGVsZW1lbnRzXG4gKiB0byB0aGUgRE9NIGFuZCB3cml0aW5nIHRvIHRob3NlIGVsZW1lbnRzLlxuICogVGhlcmUgaXMgYSBET01SZW5kZXJlciBwZXIgY29udGV4dCwgcmVwcmVzZW50ZWQgYXMgYW5cbiAqIGVsZW1lbnQgYW5kIGEgc2VsZWN0b3IuIEl0IGlzIGluc3RhbnRpYXRlZCBpbiB0aGVcbiAqIGNvbnRleHQgY2xhc3MuXG4gKlxuICogQGNsYXNzIERPTVJlbmRlcmVyXG4gKlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gZWxlbWVudCBhbiBlbGVtZW50LlxuICogQHBhcmFtIHtTdHJpbmd9IHNlbGVjdG9yIHRoZSBzZWxlY3RvciBvZiB0aGUgZWxlbWVudC5cbiAqIEBwYXJhbSB7Q29tcG9zaXRvcn0gY29tcG9zaXRvciB0aGUgY29tcG9zaXRvciBjb250cm9sbGluZyB0aGUgcmVuZGVyZXJcbiAqL1xuZnVuY3Rpb24gRE9NUmVuZGVyZXIgKGVsZW1lbnQsIHNlbGVjdG9yLCBjb21wb3NpdG9yKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnZmFtb3VzLWRvbS1yZW5kZXJlcicpO1xuXG4gICAgVFJBTlNGT1JNID0gVFJBTlNGT1JNIHx8IHZlbmRvclByZWZpeCgndHJhbnNmb3JtJyk7XG4gICAgdGhpcy5fY29tcG9zaXRvciA9IGNvbXBvc2l0b3I7IC8vIGEgcmVmZXJlbmNlIHRvIHRoZSBjb21wb3NpdG9yXG5cbiAgICB0aGlzLl90YXJnZXQgPSBudWxsOyAvLyBhIHJlZ2lzdGVyIGZvciBob2xkaW5nIHRoZSBjdXJyZW50XG4gICAgICAgICAgICAgICAgICAgICAgICAgLy8gZWxlbWVudCB0aGF0IHRoZSBSZW5kZXJlciBpcyBvcGVyYXRpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgICAvLyB1cG9uXG5cbiAgICB0aGlzLl9wYXJlbnQgPSBudWxsOyAvLyBhIHJlZ2lzdGVyIGZvciBob2xkaW5nIHRoZSBwYXJlbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAvLyBvZiB0aGUgdGFyZ2V0XG5cbiAgICB0aGlzLl9wYXRoID0gbnVsbDsgLy8gYSByZWdpc3RlciBmb3IgaG9sZGluZyB0aGUgcGF0aCBvZiB0aGUgdGFyZ2V0XG4gICAgICAgICAgICAgICAgICAgICAgIC8vIHRoaXMgcmVnaXN0ZXIgbXVzdCBiZSBzZXQgZmlyc3QsIGFuZCB0aGVuXG4gICAgICAgICAgICAgICAgICAgICAgIC8vIGNoaWxkcmVuLCB0YXJnZXQsIGFuZCBwYXJlbnQgYXJlIGFsbCBsb29rZWRcbiAgICAgICAgICAgICAgICAgICAgICAgLy8gdXAgZnJvbSB0aGF0LlxuXG4gICAgdGhpcy5fY2hpbGRyZW4gPSBbXTsgLy8gYSByZWdpc3RlciBmb3IgaG9sZGluZyB0aGUgY2hpbGRyZW4gb2YgdGhlXG4gICAgICAgICAgICAgICAgICAgICAgICAgLy8gY3VycmVudCB0YXJnZXQuXG5cbiAgICB0aGlzLl9yb290ID0gbmV3IEVsZW1lbnRDYWNoZShlbGVtZW50LCBzZWxlY3Rvcik7IC8vIHRoZSByb290XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBvZiB0aGUgZG9tIHRyZWUgdGhhdCB0aGlzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyByZW5kZXJlciBpcyByZXNwb25zaWJsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZm9yXG5cbiAgICB0aGlzLl9ib3VuZFRyaWdnZXJFdmVudCA9IGZ1bmN0aW9uIChldikge1xuICAgICAgICByZXR1cm4gX3RoaXMuX3RyaWdnZXJFdmVudChldik7XG4gICAgfTtcblxuICAgIHRoaXMuX3NlbGVjdG9yID0gc2VsZWN0b3I7XG5cbiAgICB0aGlzLl9lbGVtZW50cyA9IHt9O1xuXG4gICAgdGhpcy5fZWxlbWVudHNbc2VsZWN0b3JdID0gdGhpcy5fcm9vdDtcblxuICAgIHRoaXMucGVyc3BlY3RpdmVUcmFuc2Zvcm0gPSBuZXcgRmxvYXQzMkFycmF5KFsxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxXSk7XG4gICAgdGhpcy5fVlB0cmFuc2Zvcm0gPSBuZXcgRmxvYXQzMkFycmF5KFsxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxXSk7XG5cbiAgICB0aGlzLl9zaXplID0gW251bGwsIG51bGxdO1xufVxuXG5cbi8qKlxuICogQXR0YWNoZXMgYW4gRXZlbnRMaXN0ZW5lciB0byB0aGUgZWxlbWVudCBhc3NvY2lhdGVkIHdpdGggdGhlIHBhc3NlZCBpbiBwYXRoLlxuICogUHJldmVudHMgdGhlIGRlZmF1bHQgYnJvd3NlciBhY3Rpb24gb24gYWxsIHN1YnNlcXVlbnQgZXZlbnRzIGlmXG4gKiBgcHJldmVudERlZmF1bHRgIGlzIHRydXRoeS5cbiAqIEFsbCBpbmNvbWluZyBldmVudHMgd2lsbCBiZSBmb3J3YXJkZWQgdG8gdGhlIGNvbXBvc2l0b3IgYnkgaW52b2tpbmcgdGhlXG4gKiBgc2VuZEV2ZW50YCBtZXRob2QuXG4gKiBEZWxlZ2F0ZXMgZXZlbnRzIGlmIHBvc3NpYmxlIGJ5IGF0dGFjaGluZyB0aGUgZXZlbnQgbGlzdGVuZXIgdG8gdGhlIGNvbnRleHQuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlIERPTSBldmVudCB0eXBlIChlLmcuIGNsaWNrLCBtb3VzZW92ZXIpLlxuICogQHBhcmFtIHtCb29sZWFufSBwcmV2ZW50RGVmYXVsdCBXaGV0aGVyIG9yIG5vdCB0aGUgZGVmYXVsdCBicm93c2VyIGFjdGlvbiBzaG91bGQgYmUgcHJldmVudGVkLlxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkRPTVJlbmRlcmVyLnByb3RvdHlwZS5zdWJzY3JpYmUgPSBmdW5jdGlvbiBzdWJzY3JpYmUodHlwZSwgcHJldmVudERlZmF1bHQpIHtcbiAgICAvLyBUT0RPIHByZXZlbnREZWZhdWx0IHNob3VsZCBiZSBhIHNlcGFyYXRlIGNvbW1hbmRcbiAgICB0aGlzLl9hc3NlcnRUYXJnZXRMb2FkZWQoKTtcblxuICAgIHRoaXMuX3RhcmdldC5wcmV2ZW50RGVmYXVsdFt0eXBlXSA9IHByZXZlbnREZWZhdWx0O1xuICAgIHRoaXMuX3RhcmdldC5zdWJzY3JpYmVbdHlwZV0gPSB0cnVlO1xuXG4gICAgaWYgKFxuICAgICAgICAhdGhpcy5fdGFyZ2V0Lmxpc3RlbmVyc1t0eXBlXSAmJiAhdGhpcy5fcm9vdC5saXN0ZW5lcnNbdHlwZV1cbiAgICApIHtcbiAgICAgICAgdmFyIHRhcmdldCA9IGV2ZW50TWFwW3R5cGVdWzFdID8gdGhpcy5fcm9vdCA6IHRoaXMuX3RhcmdldDtcbiAgICAgICAgdGFyZ2V0Lmxpc3RlbmVyc1t0eXBlXSA9IHRoaXMuX2JvdW5kVHJpZ2dlckV2ZW50O1xuICAgICAgICB0YXJnZXQuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKHR5cGUsIHRoaXMuX2JvdW5kVHJpZ2dlckV2ZW50KTtcbiAgICB9XG59O1xuXG4vKipcbiAqIEZ1bmN0aW9uIHRvIGJlIGFkZGVkIHVzaW5nIGBhZGRFdmVudExpc3RlbmVyYCB0byB0aGUgY29ycmVzcG9uZGluZ1xuICogRE9NRWxlbWVudC5cbiAqXG4gKiBAbWV0aG9kXG4gKiBAcHJpdmF0ZVxuICpcbiAqIEBwYXJhbSB7RXZlbnR9IGV2IERPTSBFdmVudCBwYXlsb2FkXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuRE9NUmVuZGVyZXIucHJvdG90eXBlLl90cmlnZ2VyRXZlbnQgPSBmdW5jdGlvbiBfdHJpZ2dlckV2ZW50KGV2KSB7XG4gICAgLy8gVXNlIGV2LnBhdGgsIHdoaWNoIGlzIGFuIGFycmF5IG9mIEVsZW1lbnRzIChwb2x5ZmlsbGVkIGlmIG5lZWRlZCkuXG4gICAgdmFyIGV2UGF0aCA9IGV2LnBhdGggPyBldi5wYXRoIDogX2dldFBhdGgoZXYpO1xuICAgIC8vIEZpcnN0IGVsZW1lbnQgaW4gdGhlIHBhdGggaXMgdGhlIGVsZW1lbnQgb24gd2hpY2ggdGhlIGV2ZW50IGhhcyBhY3R1YWxseVxuICAgIC8vIGJlZW4gZW1pdHRlZC5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGV2UGF0aC5sZW5ndGg7IGkrKykge1xuICAgICAgICAvLyBTa2lwIG5vZGVzIHRoYXQgZG9uJ3QgaGF2ZSBhIGRhdGFzZXQgcHJvcGVydHkgb3IgZGF0YS1mYS1wYXRoXG4gICAgICAgIC8vIGF0dHJpYnV0ZS5cbiAgICAgICAgaWYgKCFldlBhdGhbaV0uZGF0YXNldCkgY29udGludWU7XG4gICAgICAgIHZhciBwYXRoID0gZXZQYXRoW2ldLmRhdGFzZXQuZmFQYXRoO1xuICAgICAgICBpZiAoIXBhdGgpIGNvbnRpbnVlO1xuXG4gICAgICAgIC8vIFN0b3AgZnVydGhlciBldmVudCBwcm9wb2dhdGlvbiBhbmQgcGF0aCB0cmF2ZXJzYWwgYXMgc29vbiBhcyB0aGVcbiAgICAgICAgLy8gZmlyc3QgRWxlbWVudENhY2hlIHN1YnNjcmliaW5nIGZvciB0aGUgZW1pdHRlZCBldmVudCBoYXMgYmVlbiBmb3VuZC5cbiAgICAgICAgaWYgKHRoaXMuX2VsZW1lbnRzW3BhdGhdICYmIHRoaXMuX2VsZW1lbnRzW3BhdGhdLnN1YnNjcmliZVtldi50eXBlXSkge1xuICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG5cbiAgICAgICAgICAgIC8vIE9wdGlvbmFsbHkgcHJldmVudERlZmF1bHQuIFRoaXMgbmVlZHMgZm9ydGhlciBjb25zaWRlcmF0aW9uIGFuZFxuICAgICAgICAgICAgLy8gc2hvdWxkIGJlIG9wdGlvbmFsLiBFdmVudHVhbGx5IHRoaXMgc2hvdWxkIGJlIGEgc2VwYXJhdGUgY29tbWFuZC9cbiAgICAgICAgICAgIC8vIG1ldGhvZC5cbiAgICAgICAgICAgIGlmICh0aGlzLl9lbGVtZW50c1twYXRoXS5wcmV2ZW50RGVmYXVsdFtldi50eXBlXSkge1xuICAgICAgICAgICAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBOb3JtYWxpemVkRXZlbnRDb25zdHJ1Y3RvciA9IGV2ZW50TWFwW2V2LnR5cGVdWzBdO1xuXG4gICAgICAgICAgICAvLyBGaW5hbGx5IHNlbmQgdGhlIGV2ZW50IHRvIHRoZSBXb3JrZXIgVGhyZWFkIHRocm91Z2ggdGhlXG4gICAgICAgICAgICAvLyBjb21wb3NpdG9yLlxuICAgICAgICAgICAgdGhpcy5fY29tcG9zaXRvci5zZW5kRXZlbnQocGF0aCwgZXYudHlwZSwgbmV3IE5vcm1hbGl6ZWRFdmVudENvbnN0cnVjdG9yKGV2KSk7XG5cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuXG4vKipcbiAqIGdldFNpemVPZiBnZXRzIHRoZSBkb20gc2l6ZSBvZiBhIHBhcnRpY3VsYXIgRE9NIGVsZW1lbnQuICBUaGlzIGlzXG4gKiBuZWVkZWQgZm9yIHJlbmRlciBzaXppbmcgaW4gdGhlIHNjZW5lIGdyYXBoLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gcGF0aCBwYXRoIG9mIHRoZSBOb2RlIGluIHRoZSBzY2VuZSBncmFwaFxuICpcbiAqIEByZXR1cm4ge0FycmF5fSBhIHZlYzMgb2YgdGhlIG9mZnNldCBzaXplIG9mIHRoZSBkb20gZWxlbWVudFxuICovXG5ET01SZW5kZXJlci5wcm90b3R5cGUuZ2V0U2l6ZU9mID0gZnVuY3Rpb24gZ2V0U2l6ZU9mKHBhdGgpIHtcbiAgICB2YXIgZWxlbWVudCA9IHRoaXMuX2VsZW1lbnRzW3BhdGhdO1xuICAgIGlmICghZWxlbWVudCkgcmV0dXJuIG51bGw7XG5cbiAgICB2YXIgcmVzID0ge3ZhbDogZWxlbWVudC5zaXplfTtcbiAgICB0aGlzLl9jb21wb3NpdG9yLnNlbmRFdmVudChwYXRoLCAncmVzaXplJywgcmVzKTtcbiAgICByZXR1cm4gcmVzO1xufTtcblxuZnVuY3Rpb24gX2dldFBhdGgoZXYpIHtcbiAgICAvLyBUT0RPIG1vdmUgaW50byBfdHJpZ2dlckV2ZW50LCBhdm9pZCBvYmplY3QgYWxsb2NhdGlvblxuICAgIHZhciBwYXRoID0gW107XG4gICAgdmFyIG5vZGUgPSBldi50YXJnZXQ7XG4gICAgd2hpbGUgKG5vZGUgIT09IGRvY3VtZW50LmJvZHkpIHtcbiAgICAgICAgcGF0aC5wdXNoKG5vZGUpO1xuICAgICAgICBub2RlID0gbm9kZS5wYXJlbnROb2RlO1xuICAgIH1cbiAgICByZXR1cm4gcGF0aDtcbn1cblxuXG4vKipcbiAqIERldGVybWluZXMgdGhlIHNpemUgb2YgdGhlIGNvbnRleHQgYnkgcXVlcnlpbmcgdGhlIERPTSBmb3IgYG9mZnNldFdpZHRoYCBhbmRcbiAqIGBvZmZzZXRIZWlnaHRgLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtBcnJheX0gT2Zmc2V0IHNpemUuXG4gKi9cbkRPTVJlbmRlcmVyLnByb3RvdHlwZS5nZXRTaXplID0gZnVuY3Rpb24gZ2V0U2l6ZSgpIHtcbiAgICB0aGlzLl9zaXplWzBdID0gdGhpcy5fcm9vdC5lbGVtZW50Lm9mZnNldFdpZHRoO1xuICAgIHRoaXMuX3NpemVbMV0gPSB0aGlzLl9yb290LmVsZW1lbnQub2Zmc2V0SGVpZ2h0O1xuICAgIHJldHVybiB0aGlzLl9zaXplO1xufTtcblxuRE9NUmVuZGVyZXIucHJvdG90eXBlLl9nZXRTaXplID0gRE9NUmVuZGVyZXIucHJvdG90eXBlLmdldFNpemU7XG5cblxuLyoqXG4gKiBFeGVjdXRlcyB0aGUgcmV0cmlldmVkIGRyYXcgY29tbWFuZHMuIERyYXcgY29tbWFuZHMgb25seSByZWZlciB0byB0aGVcbiAqIGNyb3NzLWJyb3dzZXIgbm9ybWFsaXplZCBgdHJhbnNmb3JtYCBwcm9wZXJ0eS5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHJlbmRlclN0YXRlIGRlc2NyaXB0aW9uXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuRE9NUmVuZGVyZXIucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbiBkcmF3KHJlbmRlclN0YXRlKSB7XG4gICAgaWYgKHJlbmRlclN0YXRlLnBlcnNwZWN0aXZlRGlydHkpIHtcbiAgICAgICAgdGhpcy5wZXJzcGVjdGl2ZURpcnR5ID0gdHJ1ZTtcblxuICAgICAgICB0aGlzLnBlcnNwZWN0aXZlVHJhbnNmb3JtWzBdID0gcmVuZGVyU3RhdGUucGVyc3BlY3RpdmVUcmFuc2Zvcm1bMF07XG4gICAgICAgIHRoaXMucGVyc3BlY3RpdmVUcmFuc2Zvcm1bMV0gPSByZW5kZXJTdGF0ZS5wZXJzcGVjdGl2ZVRyYW5zZm9ybVsxXTtcbiAgICAgICAgdGhpcy5wZXJzcGVjdGl2ZVRyYW5zZm9ybVsyXSA9IHJlbmRlclN0YXRlLnBlcnNwZWN0aXZlVHJhbnNmb3JtWzJdO1xuICAgICAgICB0aGlzLnBlcnNwZWN0aXZlVHJhbnNmb3JtWzNdID0gcmVuZGVyU3RhdGUucGVyc3BlY3RpdmVUcmFuc2Zvcm1bM107XG5cbiAgICAgICAgdGhpcy5wZXJzcGVjdGl2ZVRyYW5zZm9ybVs0XSA9IHJlbmRlclN0YXRlLnBlcnNwZWN0aXZlVHJhbnNmb3JtWzRdO1xuICAgICAgICB0aGlzLnBlcnNwZWN0aXZlVHJhbnNmb3JtWzVdID0gcmVuZGVyU3RhdGUucGVyc3BlY3RpdmVUcmFuc2Zvcm1bNV07XG4gICAgICAgIHRoaXMucGVyc3BlY3RpdmVUcmFuc2Zvcm1bNl0gPSByZW5kZXJTdGF0ZS5wZXJzcGVjdGl2ZVRyYW5zZm9ybVs2XTtcbiAgICAgICAgdGhpcy5wZXJzcGVjdGl2ZVRyYW5zZm9ybVs3XSA9IHJlbmRlclN0YXRlLnBlcnNwZWN0aXZlVHJhbnNmb3JtWzddO1xuXG4gICAgICAgIHRoaXMucGVyc3BlY3RpdmVUcmFuc2Zvcm1bOF0gPSByZW5kZXJTdGF0ZS5wZXJzcGVjdGl2ZVRyYW5zZm9ybVs4XTtcbiAgICAgICAgdGhpcy5wZXJzcGVjdGl2ZVRyYW5zZm9ybVs5XSA9IHJlbmRlclN0YXRlLnBlcnNwZWN0aXZlVHJhbnNmb3JtWzldO1xuICAgICAgICB0aGlzLnBlcnNwZWN0aXZlVHJhbnNmb3JtWzEwXSA9IHJlbmRlclN0YXRlLnBlcnNwZWN0aXZlVHJhbnNmb3JtWzEwXTtcbiAgICAgICAgdGhpcy5wZXJzcGVjdGl2ZVRyYW5zZm9ybVsxMV0gPSByZW5kZXJTdGF0ZS5wZXJzcGVjdGl2ZVRyYW5zZm9ybVsxMV07XG5cbiAgICAgICAgdGhpcy5wZXJzcGVjdGl2ZVRyYW5zZm9ybVsxMl0gPSByZW5kZXJTdGF0ZS5wZXJzcGVjdGl2ZVRyYW5zZm9ybVsxMl07XG4gICAgICAgIHRoaXMucGVyc3BlY3RpdmVUcmFuc2Zvcm1bMTNdID0gcmVuZGVyU3RhdGUucGVyc3BlY3RpdmVUcmFuc2Zvcm1bMTNdO1xuICAgICAgICB0aGlzLnBlcnNwZWN0aXZlVHJhbnNmb3JtWzE0XSA9IHJlbmRlclN0YXRlLnBlcnNwZWN0aXZlVHJhbnNmb3JtWzE0XTtcbiAgICAgICAgdGhpcy5wZXJzcGVjdGl2ZVRyYW5zZm9ybVsxNV0gPSByZW5kZXJTdGF0ZS5wZXJzcGVjdGl2ZVRyYW5zZm9ybVsxNV07XG4gICAgfVxuXG4gICAgaWYgKHJlbmRlclN0YXRlLnZpZXdEaXJ0eSB8fCByZW5kZXJTdGF0ZS5wZXJzcGVjdGl2ZURpcnR5KSB7XG4gICAgICAgIG1hdGgubXVsdGlwbHkodGhpcy5fVlB0cmFuc2Zvcm0sIHRoaXMucGVyc3BlY3RpdmVUcmFuc2Zvcm0sIHJlbmRlclN0YXRlLnZpZXdUcmFuc2Zvcm0pO1xuICAgICAgICB0aGlzLl9yb290LmVsZW1lbnQuc3R5bGVbVFJBTlNGT1JNXSA9IHRoaXMuX3N0cmluZ2lmeU1hdHJpeCh0aGlzLl9WUHRyYW5zZm9ybSk7XG4gICAgfVxufTtcblxuXG4vKipcbiAqIEludGVybmFsIGhlbHBlciBmdW5jdGlvbiB1c2VkIGZvciBlbnN1cmluZyB0aGF0IGEgcGF0aCBpcyBjdXJyZW50bHkgbG9hZGVkLlxuICpcbiAqIEBtZXRob2RcbiAqIEBwcml2YXRlXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuRE9NUmVuZGVyZXIucHJvdG90eXBlLl9hc3NlcnRQYXRoTG9hZGVkID0gZnVuY3Rpb24gX2Fzc2VyUGF0aExvYWRlZCgpIHtcbiAgICBpZiAoIXRoaXMuX3BhdGgpIHRocm93IG5ldyBFcnJvcigncGF0aCBub3QgbG9hZGVkJyk7XG59O1xuXG4vKipcbiAqIEludGVybmFsIGhlbHBlciBmdW5jdGlvbiB1c2VkIGZvciBlbnN1cmluZyB0aGF0IGEgcGFyZW50IGlzIGN1cnJlbnRseSBsb2FkZWQuXG4gKlxuICogQG1ldGhvZFxuICogQHByaXZhdGVcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5ET01SZW5kZXJlci5wcm90b3R5cGUuX2Fzc2VydFBhcmVudExvYWRlZCA9IGZ1bmN0aW9uIF9hc3NlcnRQYXJlbnRMb2FkZWQoKSB7XG4gICAgaWYgKCF0aGlzLl9wYXJlbnQpIHRocm93IG5ldyBFcnJvcigncGFyZW50IG5vdCBsb2FkZWQnKTtcbn07XG5cbi8qKlxuICogSW50ZXJuYWwgaGVscGVyIGZ1bmN0aW9uIHVzZWQgZm9yIGVuc3VyaW5nIHRoYXQgY2hpbGRyZW4gYXJlIGN1cnJlbnRseVxuICogbG9hZGVkLlxuICpcbiAqIEBtZXRob2RcbiAqIEBwcml2YXRlXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuRE9NUmVuZGVyZXIucHJvdG90eXBlLl9hc3NlcnRDaGlsZHJlbkxvYWRlZCA9IGZ1bmN0aW9uIF9hc3NlcnRDaGlsZHJlbkxvYWRlZCgpIHtcbiAgICBpZiAoIXRoaXMuX2NoaWxkcmVuKSB0aHJvdyBuZXcgRXJyb3IoJ2NoaWxkcmVuIG5vdCBsb2FkZWQnKTtcbn07XG5cbi8qKlxuICogSW50ZXJuYWwgaGVscGVyIGZ1bmN0aW9uIHVzZWQgZm9yIGVuc3VyaW5nIHRoYXQgYSB0YXJnZXQgaXMgY3VycmVudGx5IGxvYWRlZC5cbiAqXG4gKiBAbWV0aG9kICBfYXNzZXJ0VGFyZ2V0TG9hZGVkXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuRE9NUmVuZGVyZXIucHJvdG90eXBlLl9hc3NlcnRUYXJnZXRMb2FkZWQgPSBmdW5jdGlvbiBfYXNzZXJ0VGFyZ2V0TG9hZGVkKCkge1xuICAgIGlmICghdGhpcy5fdGFyZ2V0KSB0aHJvdyBuZXcgRXJyb3IoJ05vIHRhcmdldCBsb2FkZWQnKTtcbn07XG5cbi8qKlxuICogRmluZHMgYW5kIHNldHMgdGhlIHBhcmVudCBvZiB0aGUgY3VycmVudGx5IGxvYWRlZCBlbGVtZW50IChwYXRoKS5cbiAqXG4gKiBAbWV0aG9kXG4gKiBAcHJpdmF0ZVxuICpcbiAqIEByZXR1cm4ge0VsZW1lbnRDYWNoZX0gUGFyZW50IGVsZW1lbnQuXG4gKi9cbkRPTVJlbmRlcmVyLnByb3RvdHlwZS5maW5kUGFyZW50ID0gZnVuY3Rpb24gZmluZFBhcmVudCAoKSB7XG4gICAgdGhpcy5fYXNzZXJ0UGF0aExvYWRlZCgpO1xuXG4gICAgdmFyIHBhdGggPSB0aGlzLl9wYXRoO1xuICAgIHZhciBwYXJlbnQ7XG5cbiAgICB3aGlsZSAoIXBhcmVudCAmJiBwYXRoLmxlbmd0aCkge1xuICAgICAgICBwYXRoID0gcGF0aC5zdWJzdHJpbmcoMCwgcGF0aC5sYXN0SW5kZXhPZignLycpKTtcbiAgICAgICAgcGFyZW50ID0gdGhpcy5fZWxlbWVudHNbcGF0aF07XG4gICAgfVxuICAgIHRoaXMuX3BhcmVudCA9IHBhcmVudDtcbiAgICByZXR1cm4gcGFyZW50O1xufTtcblxuXG4vKipcbiAqIEZpbmRzIGFsbCBjaGlsZHJlbiBvZiB0aGUgY3VycmVudGx5IGxvYWRlZCBlbGVtZW50LlxuICpcbiAqIEBtZXRob2RcbiAqIEBwcml2YXRlXG4gKlxuICogQHBhcmFtIHtBcnJheX0gYXJyYXkgT3V0cHV0LUFycmF5IHVzZWQgZm9yIHdyaXRpbmcgdG8gKHN1YnNlcXVlbnRseSBhcHBlbmRpbmcgY2hpbGRyZW4pXG4gKlxuICogQHJldHVybiB7QXJyYXl9IGFycmF5IG9mIGNoaWxkcmVuIGVsZW1lbnRzXG4gKi9cbkRPTVJlbmRlcmVyLnByb3RvdHlwZS5maW5kQ2hpbGRyZW4gPSBmdW5jdGlvbiBmaW5kQ2hpbGRyZW4oYXJyYXkpIHtcbiAgICAvLyBUT0RPOiBPcHRpbWl6ZSBtZS5cbiAgICB0aGlzLl9hc3NlcnRQYXRoTG9hZGVkKCk7XG5cbiAgICB2YXIgcGF0aCA9IHRoaXMuX3BhdGggKyAnLyc7XG4gICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyh0aGlzLl9lbGVtZW50cyk7XG4gICAgdmFyIGkgPSAwO1xuICAgIHZhciBsZW47XG4gICAgYXJyYXkgPSBhcnJheSA/IGFycmF5IDogdGhpcy5fY2hpbGRyZW47XG5cbiAgICB0aGlzLl9jaGlsZHJlbi5sZW5ndGggPSAwO1xuXG4gICAgd2hpbGUgKGkgPCBrZXlzLmxlbmd0aCkge1xuICAgICAgICBpZiAoa2V5c1tpXS5pbmRleE9mKHBhdGgpID09PSAtMSB8fCBrZXlzW2ldID09PSBwYXRoKSBrZXlzLnNwbGljZShpLCAxKTtcbiAgICAgICAgZWxzZSBpKys7XG4gICAgfVxuICAgIHZhciBjdXJyZW50UGF0aDtcbiAgICB2YXIgaiA9IDA7XG4gICAgZm9yIChpID0gMCA7IGkgPCBrZXlzLmxlbmd0aCA7IGkrKykge1xuICAgICAgICBjdXJyZW50UGF0aCA9IGtleXNbaV07XG4gICAgICAgIGZvciAoaiA9IDAgOyBqIDwga2V5cy5sZW5ndGggOyBqKyspIHtcbiAgICAgICAgICAgIGlmIChpICE9PSBqICYmIGtleXNbal0uaW5kZXhPZihjdXJyZW50UGF0aCkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAga2V5cy5zcGxpY2UoaiwgMSk7XG4gICAgICAgICAgICAgICAgaS0tO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGZvciAoaSA9IDAsIGxlbiA9IGtleXMubGVuZ3RoIDsgaSA8IGxlbiA7IGkrKylcbiAgICAgICAgYXJyYXlbaV0gPSB0aGlzLl9lbGVtZW50c1trZXlzW2ldXTtcblxuICAgIHJldHVybiBhcnJheTtcbn07XG5cblxuLyoqXG4gKiBVc2VkIGZvciBkZXRlcm1pbmluZyB0aGUgdGFyZ2V0IGxvYWRlZCB1bmRlciB0aGUgY3VycmVudCBwYXRoLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtFbGVtZW50Q2FjaGV8dW5kZWZpbmVkfSBFbGVtZW50IGxvYWRlZCB1bmRlciBkZWZpbmVkIHBhdGguXG4gKi9cbkRPTVJlbmRlcmVyLnByb3RvdHlwZS5maW5kVGFyZ2V0ID0gZnVuY3Rpb24gZmluZFRhcmdldCgpIHtcbiAgICB0aGlzLl90YXJnZXQgPSB0aGlzLl9lbGVtZW50c1t0aGlzLl9wYXRoXTtcbiAgICByZXR1cm4gdGhpcy5fdGFyZ2V0O1xufTtcblxuXG4vKipcbiAqIExvYWRzIHRoZSBwYXNzZWQgaW4gcGF0aC5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHBhdGggUGF0aCB0byBiZSBsb2FkZWRcbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9IExvYWRlZCBwYXRoXG4gKi9cbkRPTVJlbmRlcmVyLnByb3RvdHlwZS5sb2FkUGF0aCA9IGZ1bmN0aW9uIGxvYWRQYXRoIChwYXRoKSB7XG4gICAgdGhpcy5fcGF0aCA9IHBhdGg7XG4gICAgcmV0dXJuIHRoaXMuX3BhdGg7XG59O1xuXG5cbi8qKlxuICogSW5zZXJ0cyBhIERPTUVsZW1lbnQgYXQgdGhlIGN1cnJlbnRseSBsb2FkZWQgcGF0aCwgYXNzdW1pbmcgbm8gdGFyZ2V0IGlzXG4gKiBsb2FkZWQuIE9ubHkgb25lIERPTUVsZW1lbnQgY2FuIGJlIGFzc29jaWF0ZWQgd2l0aCBlYWNoIHBhdGguXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB0YWdOYW1lIFRhZyBuYW1lIChjYXBpdGFsaXphdGlvbiB3aWxsIGJlIG5vcm1hbGl6ZWQpLlxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkRPTVJlbmRlcmVyLnByb3RvdHlwZS5pbnNlcnRFbCA9IGZ1bmN0aW9uIGluc2VydEVsICh0YWdOYW1lKSB7XG4gICAgaWYgKCF0aGlzLl90YXJnZXQgfHxcbiAgICAgICAgdGhpcy5fdGFyZ2V0LmVsZW1lbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpICE9PSB0YWdOYW1lLnRvTG93ZXJDYXNlKCkpIHtcblxuICAgICAgICB0aGlzLmZpbmRQYXJlbnQoKTtcbiAgICAgICAgdGhpcy5maW5kQ2hpbGRyZW4oKTtcblxuICAgICAgICB0aGlzLl9hc3NlcnRQYXJlbnRMb2FkZWQoKTtcbiAgICAgICAgdGhpcy5fYXNzZXJ0Q2hpbGRyZW5Mb2FkZWQoKTtcblxuICAgICAgICBpZiAodGhpcy5fdGFyZ2V0KSB0aGlzLl9wYXJlbnQuZWxlbWVudC5yZW1vdmVDaGlsZCh0aGlzLl90YXJnZXQuZWxlbWVudCk7XG5cbiAgICAgICAgdGhpcy5fdGFyZ2V0ID0gbmV3IEVsZW1lbnRDYWNoZShkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZ05hbWUpLCB0aGlzLl9wYXRoKTtcbiAgICAgICAgdGhpcy5fcGFyZW50LmVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5fdGFyZ2V0LmVsZW1lbnQpO1xuICAgICAgICB0aGlzLl9lbGVtZW50c1t0aGlzLl9wYXRoXSA9IHRoaXMuX3RhcmdldDtcblxuICAgICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdGhpcy5fY2hpbGRyZW4ubGVuZ3RoIDsgaSA8IGxlbiA7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5fdGFyZ2V0LmVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5fY2hpbGRyZW5baV0uZWxlbWVudCk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5cbi8qKlxuICogU2V0cyBhIHByb3BlcnR5IG9uIHRoZSBjdXJyZW50bHkgbG9hZGVkIHRhcmdldC5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgUHJvcGVydHkgbmFtZSAoZS5nLiBiYWNrZ3JvdW5kLCBjb2xvciwgZm9udClcbiAqIEBwYXJhbSB7U3RyaW5nfSB2YWx1ZSBQcm9wcnR5IHZhbHVlIChlLmcuIGJsYWNrLCAyMHB4KVxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkRPTVJlbmRlcmVyLnByb3RvdHlwZS5zZXRQcm9wZXJ0eSA9IGZ1bmN0aW9uIHNldFByb3BlcnR5IChuYW1lLCB2YWx1ZSkge1xuICAgIHRoaXMuX2Fzc2VydFRhcmdldExvYWRlZCgpO1xuICAgIHRoaXMuX3RhcmdldC5lbGVtZW50LnN0eWxlW25hbWVdID0gdmFsdWU7XG59O1xuXG5cbi8qKlxuICogU2V0cyB0aGUgc2l6ZSBvZiB0aGUgY3VycmVudGx5IGxvYWRlZCB0YXJnZXQuXG4gKiBSZW1vdmVzIGFueSBleHBsaWNpdCBzaXppbmcgY29uc3RyYWludHMgd2hlbiBwYXNzZWQgaW4gYGZhbHNlYFxuICogKFwidHJ1ZS1zaXppbmdcIikuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfGZhbHNlfSB3aWR0aCAgIFdpZHRoIHRvIGJlIHNldC5cbiAqIEBwYXJhbSB7TnVtYmVyfGZhbHNlfSBoZWlnaHQgIEhlaWdodCB0byBiZSBzZXQuXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuRE9NUmVuZGVyZXIucHJvdG90eXBlLnNldFNpemUgPSBmdW5jdGlvbiBzZXRTaXplICh3aWR0aCwgaGVpZ2h0KSB7XG4gICAgdGhpcy5fYXNzZXJ0VGFyZ2V0TG9hZGVkKCk7XG5cbiAgICB0aGlzLnNldFdpZHRoKHdpZHRoKTtcbiAgICB0aGlzLnNldEhlaWdodChoZWlnaHQpO1xufTtcblxuLyoqXG4gKiBTZXRzIHRoZSB3aWR0aCBvZiB0aGUgY3VycmVudGx5IGxvYWRlZCB0YXJnZXQuXG4gKiBSZW1vdmVzIGFueSBleHBsaWNpdCBzaXppbmcgY29uc3RyYWludHMgd2hlbiBwYXNzZWQgaW4gYGZhbHNlYFxuICogKFwidHJ1ZS1zaXppbmdcIikuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfGZhbHNlfSB3aWR0aCBXaWR0aCB0byBiZSBzZXQuXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuRE9NUmVuZGVyZXIucHJvdG90eXBlLnNldFdpZHRoID0gZnVuY3Rpb24gc2V0V2lkdGgod2lkdGgpIHtcbiAgICB0aGlzLl9hc3NlcnRUYXJnZXRMb2FkZWQoKTtcblxuICAgIHZhciBjb250ZW50V3JhcHBlciA9IHRoaXMuX3RhcmdldC5jb250ZW50O1xuXG4gICAgaWYgKHdpZHRoID09PSBmYWxzZSkge1xuICAgICAgICB0aGlzLl90YXJnZXQuZXhwbGljaXRXaWR0aCA9IHRydWU7XG4gICAgICAgIGlmIChjb250ZW50V3JhcHBlcikgY29udGVudFdyYXBwZXIuc3R5bGUud2lkdGggPSAnJztcbiAgICAgICAgd2lkdGggPSBjb250ZW50V3JhcHBlciA/IGNvbnRlbnRXcmFwcGVyLm9mZnNldFdpZHRoIDogMDtcbiAgICAgICAgdGhpcy5fdGFyZ2V0LmVsZW1lbnQuc3R5bGUud2lkdGggPSB3aWR0aCArICdweCc7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB0aGlzLl90YXJnZXQuZXhwbGljaXRXaWR0aCA9IGZhbHNlO1xuICAgICAgICBpZiAoY29udGVudFdyYXBwZXIpIGNvbnRlbnRXcmFwcGVyLnN0eWxlLndpZHRoID0gd2lkdGggKyAncHgnO1xuICAgICAgICB0aGlzLl90YXJnZXQuZWxlbWVudC5zdHlsZS53aWR0aCA9IHdpZHRoICsgJ3B4JztcbiAgICB9XG5cbiAgICB0aGlzLl90YXJnZXQuc2l6ZVswXSA9IHdpZHRoO1xufTtcblxuLyoqXG4gKiBTZXRzIHRoZSBoZWlnaHQgb2YgdGhlIGN1cnJlbnRseSBsb2FkZWQgdGFyZ2V0LlxuICogUmVtb3ZlcyBhbnkgZXhwbGljaXQgc2l6aW5nIGNvbnN0cmFpbnRzIHdoZW4gcGFzc2VkIGluIGBmYWxzZWBcbiAqIChcInRydWUtc2l6aW5nXCIpLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge051bWJlcnxmYWxzZX0gaGVpZ2h0IEhlaWdodCB0byBiZSBzZXQuXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuRE9NUmVuZGVyZXIucHJvdG90eXBlLnNldEhlaWdodCA9IGZ1bmN0aW9uIHNldEhlaWdodChoZWlnaHQpIHtcbiAgICB0aGlzLl9hc3NlcnRUYXJnZXRMb2FkZWQoKTtcblxuICAgIHZhciBjb250ZW50V3JhcHBlciA9IHRoaXMuX3RhcmdldC5jb250ZW50O1xuXG4gICAgaWYgKGhlaWdodCA9PT0gZmFsc2UpIHtcbiAgICAgICAgdGhpcy5fdGFyZ2V0LmV4cGxpY2l0SGVpZ2h0ID0gdHJ1ZTtcbiAgICAgICAgaWYgKGNvbnRlbnRXcmFwcGVyKSBjb250ZW50V3JhcHBlci5zdHlsZS5oZWlnaHQgPSAnJztcbiAgICAgICAgaGVpZ2h0ID0gY29udGVudFdyYXBwZXIgPyBjb250ZW50V3JhcHBlci5vZmZzZXRIZWlnaHQgOiAwO1xuICAgICAgICB0aGlzLl90YXJnZXQuZWxlbWVudC5zdHlsZS5oZWlnaHQgPSBoZWlnaHQgKyAncHgnO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdGhpcy5fdGFyZ2V0LmV4cGxpY2l0SGVpZ2h0ID0gZmFsc2U7XG4gICAgICAgIGlmIChjb250ZW50V3JhcHBlcikgY29udGVudFdyYXBwZXIuc3R5bGUuaGVpZ2h0ID0gaGVpZ2h0ICsgJ3B4JztcbiAgICAgICAgdGhpcy5fdGFyZ2V0LmVsZW1lbnQuc3R5bGUuaGVpZ2h0ID0gaGVpZ2h0ICsgJ3B4JztcbiAgICB9XG5cbiAgICB0aGlzLl90YXJnZXQuc2l6ZVsxXSA9IGhlaWdodDtcbn07XG5cbi8qKlxuICogU2V0cyBhbiBhdHRyaWJ1dGUgb24gdGhlIGN1cnJlbnRseSBsb2FkZWQgdGFyZ2V0LlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBBdHRyaWJ1dGUgbmFtZSAoZS5nLiBocmVmKVxuICogQHBhcmFtIHtTdHJpbmd9IHZhbHVlIEF0dHJpYnV0ZSB2YWx1ZSAoZS5nLiBodHRwOi8vZmFtb3VzLm9yZylcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5ET01SZW5kZXJlci5wcm90b3R5cGUuc2V0QXR0cmlidXRlID0gZnVuY3Rpb24gc2V0QXR0cmlidXRlKG5hbWUsIHZhbHVlKSB7XG4gICAgdGhpcy5fYXNzZXJ0VGFyZ2V0TG9hZGVkKCk7XG4gICAgdGhpcy5fdGFyZ2V0LmVsZW1lbnQuc2V0QXR0cmlidXRlKG5hbWUsIHZhbHVlKTtcbn07XG5cbi8qKlxuICogU2V0cyB0aGUgYGlubmVySFRNTGAgY29udGVudCBvZiB0aGUgY3VycmVudGx5IGxvYWRlZCB0YXJnZXQuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBjb250ZW50IENvbnRlbnQgdG8gYmUgc2V0IGFzIGBpbm5lckhUTUxgXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuRE9NUmVuZGVyZXIucHJvdG90eXBlLnNldENvbnRlbnQgPSBmdW5jdGlvbiBzZXRDb250ZW50KGNvbnRlbnQpIHtcbiAgICB0aGlzLl9hc3NlcnRUYXJnZXRMb2FkZWQoKTtcbiAgICB0aGlzLmZpbmRDaGlsZHJlbigpO1xuXG4gICAgaWYgKCF0aGlzLl90YXJnZXQuY29udGVudCkge1xuICAgICAgICB0aGlzLl90YXJnZXQuY29udGVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICB0aGlzLl90YXJnZXQuY29udGVudC5jbGFzc0xpc3QuYWRkKCdmYW1vdXMtZG9tLWVsZW1lbnQtY29udGVudCcpO1xuICAgICAgICB0aGlzLl90YXJnZXQuZWxlbWVudC5pbnNlcnRCZWZvcmUoXG4gICAgICAgICAgICB0aGlzLl90YXJnZXQuY29udGVudCxcbiAgICAgICAgICAgIHRoaXMuX3RhcmdldC5lbGVtZW50LmZpcnN0Q2hpbGRcbiAgICAgICAgKTtcbiAgICB9XG4gICAgdGhpcy5fdGFyZ2V0LmNvbnRlbnQuaW5uZXJIVE1MID0gY29udGVudDtcblxuICAgIHRoaXMuc2V0U2l6ZShcbiAgICAgICAgdGhpcy5fdGFyZ2V0LmV4cGxpY2l0V2lkdGggPyBmYWxzZSA6IHRoaXMuX3RhcmdldC5zaXplWzBdLFxuICAgICAgICB0aGlzLl90YXJnZXQuZXhwbGljaXRIZWlnaHQgPyBmYWxzZSA6IHRoaXMuX3RhcmdldC5zaXplWzFdXG4gICAgKTtcbn07XG5cblxuLyoqXG4gKiBTZXRzIHRoZSBwYXNzZWQgaW4gdHJhbnNmb3JtIG1hdHJpeCAod29ybGQgc3BhY2UpLiBJbnZlcnRzIHRoZSBwYXJlbnQncyB3b3JsZFxuICogdHJhbnNmb3JtLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge0Zsb2F0MzJBcnJheX0gdHJhbnNmb3JtIFRoZSB0cmFuc2Zvcm0gZm9yIHRoZSBsb2FkZWQgRE9NIEVsZW1lbnQgaW4gd29ybGQgc3BhY2VcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5ET01SZW5kZXJlci5wcm90b3R5cGUuc2V0TWF0cml4ID0gZnVuY3Rpb24gc2V0TWF0cml4KHRyYW5zZm9ybSkge1xuICAgIC8vIFRPRE8gRG9uJ3QgbXVsdGlwbHkgbWF0cmljcyBpbiB0aGUgZmlyc3QgcGxhY2UuXG4gICAgdGhpcy5fYXNzZXJ0VGFyZ2V0TG9hZGVkKCk7XG4gICAgdGhpcy5maW5kUGFyZW50KCk7XG4gICAgdmFyIHdvcmxkVHJhbnNmb3JtID0gdGhpcy5fdGFyZ2V0LndvcmxkVHJhbnNmb3JtO1xuICAgIHZhciBjaGFuZ2VkID0gZmFsc2U7XG5cbiAgICB2YXIgaTtcbiAgICB2YXIgbGVuO1xuXG4gICAgaWYgKHRyYW5zZm9ybSlcbiAgICAgICAgZm9yIChpID0gMCwgbGVuID0gMTYgOyBpIDwgbGVuIDsgaSsrKSB7XG4gICAgICAgICAgICBjaGFuZ2VkID0gY2hhbmdlZCA/IGNoYW5nZWQgOiB3b3JsZFRyYW5zZm9ybVtpXSA9PT0gdHJhbnNmb3JtW2ldO1xuICAgICAgICAgICAgd29ybGRUcmFuc2Zvcm1baV0gPSB0cmFuc2Zvcm1baV07XG4gICAgICAgIH1cbiAgICBlbHNlIGNoYW5nZWQgPSB0cnVlO1xuXG4gICAgaWYgKGNoYW5nZWQpIHtcbiAgICAgICAgbWF0aC5pbnZlcnQodGhpcy5fdGFyZ2V0LmludmVydGVkUGFyZW50LCB0aGlzLl9wYXJlbnQud29ybGRUcmFuc2Zvcm0pO1xuICAgICAgICBtYXRoLm11bHRpcGx5KHRoaXMuX3RhcmdldC5maW5hbFRyYW5zZm9ybSwgdGhpcy5fdGFyZ2V0LmludmVydGVkUGFyZW50LCB3b3JsZFRyYW5zZm9ybSk7XG5cbiAgICAgICAgLy8gVE9ETzogdGhpcyBpcyBhIHRlbXBvcmFyeSBmaXggZm9yIGRyYXcgY29tbWFuZHNcbiAgICAgICAgLy8gY29taW5nIGluIG91dCBvZiBvcmRlclxuICAgICAgICB2YXIgY2hpbGRyZW4gPSB0aGlzLmZpbmRDaGlsZHJlbihbXSk7XG4gICAgICAgIHZhciBwcmV2aW91c1BhdGggPSB0aGlzLl9wYXRoO1xuICAgICAgICB2YXIgcHJldmlvdXNUYXJnZXQgPSB0aGlzLl90YXJnZXQ7XG4gICAgICAgIGZvciAoaSA9IDAsIGxlbiA9IGNoaWxkcmVuLmxlbmd0aCA7IGkgPCBsZW4gOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuX3RhcmdldCA9IGNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgdGhpcy5fcGF0aCA9IHRoaXMuX3RhcmdldC5wYXRoO1xuICAgICAgICAgICAgdGhpcy5zZXRNYXRyaXgoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9wYXRoID0gcHJldmlvdXNQYXRoO1xuICAgICAgICB0aGlzLl90YXJnZXQgPSBwcmV2aW91c1RhcmdldDtcbiAgICB9XG5cbiAgICB0aGlzLl90YXJnZXQuZWxlbWVudC5zdHlsZVtUUkFOU0ZPUk1dID0gdGhpcy5fc3RyaW5naWZ5TWF0cml4KHRoaXMuX3RhcmdldC5maW5hbFRyYW5zZm9ybSk7XG59O1xuXG5cbi8qKlxuICogQWRkcyBhIGNsYXNzIHRvIHRoZSBjbGFzc0xpc3QgYXNzb2NpYXRlZCB3aXRoIHRoZSBjdXJyZW50bHkgbG9hZGVkIHRhcmdldC5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGRvbUNsYXNzIENsYXNzIG5hbWUgdG8gYmUgYWRkZWQgdG8gdGhlIGN1cnJlbnQgdGFyZ2V0LlxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkRPTVJlbmRlcmVyLnByb3RvdHlwZS5hZGRDbGFzcyA9IGZ1bmN0aW9uIGFkZENsYXNzKGRvbUNsYXNzKSB7XG4gICAgdGhpcy5fYXNzZXJ0VGFyZ2V0TG9hZGVkKCk7XG4gICAgdGhpcy5fdGFyZ2V0LmVsZW1lbnQuY2xhc3NMaXN0LmFkZChkb21DbGFzcyk7XG59O1xuXG5cbi8qKlxuICogUmVtb3ZlcyBhIGNsYXNzIGZyb20gdGhlIGNsYXNzTGlzdCBhc3NvY2lhdGVkIHdpdGggdGhlIGN1cnJlbnRseSBsb2FkZWRcbiAqIHRhcmdldC5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGRvbUNsYXNzIENsYXNzIG5hbWUgdG8gYmUgcmVtb3ZlZCBmcm9tIGN1cnJlbnRseSBsb2FkZWQgdGFyZ2V0LlxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkRPTVJlbmRlcmVyLnByb3RvdHlwZS5yZW1vdmVDbGFzcyA9IGZ1bmN0aW9uIHJlbW92ZUNsYXNzKGRvbUNsYXNzKSB7XG4gICAgdGhpcy5fYXNzZXJ0VGFyZ2V0TG9hZGVkKCk7XG4gICAgdGhpcy5fdGFyZ2V0LmVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShkb21DbGFzcyk7XG59O1xuXG5cbi8qKlxuICogU3RyaW5naWZpZXMgdGhlIHBhc3NlZCBpbiBtYXRyaXggZm9yIHNldHRpbmcgdGhlIGB0cmFuc2Zvcm1gIHByb3BlcnR5LlxuICpcbiAqIEBtZXRob2QgIF9zdHJpbmdpZnlNYXRyaXhcbiAqIEBwcml2YXRlXG4gKlxuICogQHBhcmFtIHtBcnJheX0gbSAgICBNYXRyaXggYXMgYW4gYXJyYXkgb3IgYXJyYXktbGlrZSBvYmplY3QuXG4gKiBAcmV0dXJuIHtTdHJpbmd9ICAgICBTdHJpbmdpZmllZCBtYXRyaXggYXMgYG1hdHJpeDNkYC1wcm9wZXJ0eS5cbiAqL1xuRE9NUmVuZGVyZXIucHJvdG90eXBlLl9zdHJpbmdpZnlNYXRyaXggPSBmdW5jdGlvbiBfc3RyaW5naWZ5TWF0cml4KG0pIHtcbiAgICB2YXIgciA9ICdtYXRyaXgzZCgnO1xuXG4gICAgciArPSAobVswXSA8IDAuMDAwMDAxICYmIG1bMF0gPiAtMC4wMDAwMDEpID8gJzAsJyA6IG1bMF0gKyAnLCc7XG4gICAgciArPSAobVsxXSA8IDAuMDAwMDAxICYmIG1bMV0gPiAtMC4wMDAwMDEpID8gJzAsJyA6IG1bMV0gKyAnLCc7XG4gICAgciArPSAobVsyXSA8IDAuMDAwMDAxICYmIG1bMl0gPiAtMC4wMDAwMDEpID8gJzAsJyA6IG1bMl0gKyAnLCc7XG4gICAgciArPSAobVszXSA8IDAuMDAwMDAxICYmIG1bM10gPiAtMC4wMDAwMDEpID8gJzAsJyA6IG1bM10gKyAnLCc7XG4gICAgciArPSAobVs0XSA8IDAuMDAwMDAxICYmIG1bNF0gPiAtMC4wMDAwMDEpID8gJzAsJyA6IG1bNF0gKyAnLCc7XG4gICAgciArPSAobVs1XSA8IDAuMDAwMDAxICYmIG1bNV0gPiAtMC4wMDAwMDEpID8gJzAsJyA6IG1bNV0gKyAnLCc7XG4gICAgciArPSAobVs2XSA8IDAuMDAwMDAxICYmIG1bNl0gPiAtMC4wMDAwMDEpID8gJzAsJyA6IG1bNl0gKyAnLCc7XG4gICAgciArPSAobVs3XSA8IDAuMDAwMDAxICYmIG1bN10gPiAtMC4wMDAwMDEpID8gJzAsJyA6IG1bN10gKyAnLCc7XG4gICAgciArPSAobVs4XSA8IDAuMDAwMDAxICYmIG1bOF0gPiAtMC4wMDAwMDEpID8gJzAsJyA6IG1bOF0gKyAnLCc7XG4gICAgciArPSAobVs5XSA8IDAuMDAwMDAxICYmIG1bOV0gPiAtMC4wMDAwMDEpID8gJzAsJyA6IG1bOV0gKyAnLCc7XG4gICAgciArPSAobVsxMF0gPCAwLjAwMDAwMSAmJiBtWzEwXSA+IC0wLjAwMDAwMSkgPyAnMCwnIDogbVsxMF0gKyAnLCc7XG4gICAgciArPSAobVsxMV0gPCAwLjAwMDAwMSAmJiBtWzExXSA+IC0wLjAwMDAwMSkgPyAnMCwnIDogbVsxMV0gKyAnLCc7XG4gICAgciArPSAobVsxMl0gPCAwLjAwMDAwMSAmJiBtWzEyXSA+IC0wLjAwMDAwMSkgPyAnMCwnIDogbVsxMl0gKyAnLCc7XG4gICAgciArPSAobVsxM10gPCAwLjAwMDAwMSAmJiBtWzEzXSA+IC0wLjAwMDAwMSkgPyAnMCwnIDogbVsxM10gKyAnLCc7XG4gICAgciArPSAobVsxNF0gPCAwLjAwMDAwMSAmJiBtWzE0XSA+IC0wLjAwMDAwMSkgPyAnMCwnIDogbVsxNF0gKyAnLCc7XG5cbiAgICByICs9IG1bMTVdICsgJyknO1xuICAgIHJldHVybiByO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBET01SZW5kZXJlcjtcbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKiBcbiAqIENvcHlyaWdodCAoYykgMjAxNSBGYW1vdXMgSW5kdXN0cmllcyBJbmMuXG4gKiBcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqIFxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICogXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8vIFRyYW5zZm9ybSBpZGVudGl0eSBtYXRyaXguIFxudmFyIGlkZW50ID0gW1xuICAgIDEsIDAsIDAsIDAsXG4gICAgMCwgMSwgMCwgMCxcbiAgICAwLCAwLCAxLCAwLFxuICAgIDAsIDAsIDAsIDFcbl07XG5cbi8qKlxuICogRWxlbWVudENhY2hlIGlzIGJlaW5nIHVzZWQgZm9yIGtlZXBpbmcgdHJhY2sgb2YgYW4gZWxlbWVudCdzIERPTSBFbGVtZW50LFxuICogcGF0aCwgd29ybGQgdHJhbnNmb3JtLCBpbnZlcnRlZCBwYXJlbnQsIGZpbmFsIHRyYW5zZm9ybSAoYXMgYmVpbmcgdXNlZCBmb3JcbiAqIHNldHRpbmcgdGhlIGFjdHVhbCBgdHJhbnNmb3JtYC1wcm9wZXJ0eSkgYW5kIHBvc3QgcmVuZGVyIHNpemUgKGZpbmFsIHNpemUgYXNcbiAqIGJlaW5nIHJlbmRlcmVkIHRvIHRoZSBET00pLlxuICogXG4gKiBAY2xhc3MgRWxlbWVudENhY2hlXG4gKiAgXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsZW1lbnQgRE9NRWxlbWVudFxuICogQHBhcmFtIHtTdHJpbmd9IHBhdGggUGF0aCB1c2VkIGZvciB1bmlxdWVseSBpZGVudGlmeWluZyB0aGUgbG9jYXRpb24gaW4gdGhlIHNjZW5lIGdyYXBoLlxuICovIFxuZnVuY3Rpb24gRWxlbWVudENhY2hlIChlbGVtZW50LCBwYXRoKSB7XG4gICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLnBhdGggPSBwYXRoO1xuICAgIHRoaXMuY29udGVudCA9IG51bGw7XG4gICAgdGhpcy5zaXplID0gbmV3IEludDE2QXJyYXkoMyk7XG4gICAgdGhpcy5leHBsaWNpdEhlaWdodCA9IGZhbHNlO1xuICAgIHRoaXMuZXhwbGljaXRXaWR0aCA9IGZhbHNlO1xuICAgIHRoaXMud29ybGRUcmFuc2Zvcm0gPSBuZXcgRmxvYXQzMkFycmF5KGlkZW50KTtcbiAgICB0aGlzLmludmVydGVkUGFyZW50ID0gbmV3IEZsb2F0MzJBcnJheShpZGVudCk7XG4gICAgdGhpcy5maW5hbFRyYW5zZm9ybSA9IG5ldyBGbG9hdDMyQXJyYXkoaWRlbnQpO1xuICAgIHRoaXMucG9zdFJlbmRlclNpemUgPSBuZXcgRmxvYXQzMkFycmF5KDIpO1xuICAgIHRoaXMubGlzdGVuZXJzID0ge307XG4gICAgdGhpcy5wcmV2ZW50RGVmYXVsdCA9IHt9O1xuICAgIHRoaXMuc3Vic2NyaWJlID0ge307XG59XG5cbm1vZHVsZS5leHBvcnRzID0gRWxlbWVudENhY2hlO1xuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEEgbWV0aG9kIGZvciBpbnZlcnRpbmcgYSB0cmFuc2Zvcm0gbWF0cml4XG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IG91dCBhcnJheSB0byBzdG9yZSB0aGUgcmV0dXJuIG9mIHRoZSBpbnZlcnNpb25cbiAqIEBwYXJhbSB7QXJyYXl9IGEgdHJhbnNmb3JtIG1hdHJpeCB0byBpbnZlcnNlXG4gKlxuICogQHJldHVybiB7QXJyYXl9IG91dFxuICogICBvdXRwdXQgYXJyYXkgdGhhdCBpcyBzdG9yaW5nIHRoZSB0cmFuc2Zvcm0gbWF0cml4XG4gKi9cbmZ1bmN0aW9uIGludmVydCAob3V0LCBhKSB7XG4gICAgdmFyIGEwMCA9IGFbMF0sIGEwMSA9IGFbMV0sIGEwMiA9IGFbMl0sIGEwMyA9IGFbM10sXG4gICAgICAgIGExMCA9IGFbNF0sIGExMSA9IGFbNV0sIGExMiA9IGFbNl0sIGExMyA9IGFbN10sXG4gICAgICAgIGEyMCA9IGFbOF0sIGEyMSA9IGFbOV0sIGEyMiA9IGFbMTBdLCBhMjMgPSBhWzExXSxcbiAgICAgICAgYTMwID0gYVsxMl0sIGEzMSA9IGFbMTNdLCBhMzIgPSBhWzE0XSwgYTMzID0gYVsxNV0sXG5cbiAgICAgICAgYjAwID0gYTAwICogYTExIC0gYTAxICogYTEwLFxuICAgICAgICBiMDEgPSBhMDAgKiBhMTIgLSBhMDIgKiBhMTAsXG4gICAgICAgIGIwMiA9IGEwMCAqIGExMyAtIGEwMyAqIGExMCxcbiAgICAgICAgYjAzID0gYTAxICogYTEyIC0gYTAyICogYTExLFxuICAgICAgICBiMDQgPSBhMDEgKiBhMTMgLSBhMDMgKiBhMTEsXG4gICAgICAgIGIwNSA9IGEwMiAqIGExMyAtIGEwMyAqIGExMixcbiAgICAgICAgYjA2ID0gYTIwICogYTMxIC0gYTIxICogYTMwLFxuICAgICAgICBiMDcgPSBhMjAgKiBhMzIgLSBhMjIgKiBhMzAsXG4gICAgICAgIGIwOCA9IGEyMCAqIGEzMyAtIGEyMyAqIGEzMCxcbiAgICAgICAgYjA5ID0gYTIxICogYTMyIC0gYTIyICogYTMxLFxuICAgICAgICBiMTAgPSBhMjEgKiBhMzMgLSBhMjMgKiBhMzEsXG4gICAgICAgIGIxMSA9IGEyMiAqIGEzMyAtIGEyMyAqIGEzMixcblxuICAgICAgICAvLyBDYWxjdWxhdGUgdGhlIGRldGVybWluYW50XG4gICAgICAgIGRldCA9IGIwMCAqIGIxMSAtIGIwMSAqIGIxMCArIGIwMiAqIGIwOSArIGIwMyAqIGIwOCAtIGIwNCAqIGIwNyArIGIwNSAqIGIwNjtcblxuICAgIGlmICghZGV0KSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBkZXQgPSAxLjAgLyBkZXQ7XG5cbiAgICBvdXRbMF0gPSAoYTExICogYjExIC0gYTEyICogYjEwICsgYTEzICogYjA5KSAqIGRldDtcbiAgICBvdXRbMV0gPSAoYTAyICogYjEwIC0gYTAxICogYjExIC0gYTAzICogYjA5KSAqIGRldDtcbiAgICBvdXRbMl0gPSAoYTMxICogYjA1IC0gYTMyICogYjA0ICsgYTMzICogYjAzKSAqIGRldDtcbiAgICBvdXRbM10gPSAoYTIyICogYjA0IC0gYTIxICogYjA1IC0gYTIzICogYjAzKSAqIGRldDtcbiAgICBvdXRbNF0gPSAoYTEyICogYjA4IC0gYTEwICogYjExIC0gYTEzICogYjA3KSAqIGRldDtcbiAgICBvdXRbNV0gPSAoYTAwICogYjExIC0gYTAyICogYjA4ICsgYTAzICogYjA3KSAqIGRldDtcbiAgICBvdXRbNl0gPSAoYTMyICogYjAyIC0gYTMwICogYjA1IC0gYTMzICogYjAxKSAqIGRldDtcbiAgICBvdXRbN10gPSAoYTIwICogYjA1IC0gYTIyICogYjAyICsgYTIzICogYjAxKSAqIGRldDtcbiAgICBvdXRbOF0gPSAoYTEwICogYjEwIC0gYTExICogYjA4ICsgYTEzICogYjA2KSAqIGRldDtcbiAgICBvdXRbOV0gPSAoYTAxICogYjA4IC0gYTAwICogYjEwIC0gYTAzICogYjA2KSAqIGRldDtcbiAgICBvdXRbMTBdID0gKGEzMCAqIGIwNCAtIGEzMSAqIGIwMiArIGEzMyAqIGIwMCkgKiBkZXQ7XG4gICAgb3V0WzExXSA9IChhMjEgKiBiMDIgLSBhMjAgKiBiMDQgLSBhMjMgKiBiMDApICogZGV0O1xuICAgIG91dFsxMl0gPSAoYTExICogYjA3IC0gYTEwICogYjA5IC0gYTEyICogYjA2KSAqIGRldDtcbiAgICBvdXRbMTNdID0gKGEwMCAqIGIwOSAtIGEwMSAqIGIwNyArIGEwMiAqIGIwNikgKiBkZXQ7XG4gICAgb3V0WzE0XSA9IChhMzEgKiBiMDEgLSBhMzAgKiBiMDMgLSBhMzIgKiBiMDApICogZGV0O1xuICAgIG91dFsxNV0gPSAoYTIwICogYjAzIC0gYTIxICogYjAxICsgYTIyICogYjAwKSAqIGRldDtcblxuICAgIHJldHVybiBvdXQ7XG59XG5cbi8qKlxuICogQSBtZXRob2QgZm9yIG11bHRpcGx5aW5nIHR3byBtYXRyaWNpZXNcbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtBcnJheX0gb3V0IGFycmF5IHRvIHN0b3JlIHRoZSByZXR1cm4gb2YgdGhlIG11bHRpcGxpY2F0aW9uXG4gKiBAcGFyYW0ge0FycmF5fSBhIHRyYW5zZm9ybSBtYXRyaXggdG8gbXVsdGlwbHlcbiAqIEBwYXJhbSB7QXJyYXl9IGIgdHJhbnNmb3JtIG1hdHJpeCB0byBtdWx0aXBseVxuICpcbiAqIEByZXR1cm4ge0FycmF5fSBvdXRcbiAqICAgb3V0cHV0IGFycmF5IHRoYXQgaXMgc3RvcmluZyB0aGUgdHJhbnNmb3JtIG1hdHJpeFxuICovXG5mdW5jdGlvbiBtdWx0aXBseSAob3V0LCBhLCBiKSB7XG4gICAgdmFyIGEwMCA9IGFbMF0sIGEwMSA9IGFbMV0sIGEwMiA9IGFbMl0sIGEwMyA9IGFbM10sXG4gICAgICAgIGExMCA9IGFbNF0sIGExMSA9IGFbNV0sIGExMiA9IGFbNl0sIGExMyA9IGFbN10sXG4gICAgICAgIGEyMCA9IGFbOF0sIGEyMSA9IGFbOV0sIGEyMiA9IGFbMTBdLCBhMjMgPSBhWzExXSxcbiAgICAgICAgYTMwID0gYVsxMl0sIGEzMSA9IGFbMTNdLCBhMzIgPSBhWzE0XSwgYTMzID0gYVsxNV0sXG5cbiAgICAgICAgYjAgPSBiWzBdLCBiMSA9IGJbMV0sIGIyID0gYlsyXSwgYjMgPSBiWzNdLFxuICAgICAgICBiNCA9IGJbNF0sIGI1ID0gYls1XSwgYjYgPSBiWzZdLCBiNyA9IGJbN10sXG4gICAgICAgIGI4ID0gYls4XSwgYjkgPSBiWzldLCBiMTAgPSBiWzEwXSwgYjExID0gYlsxMV0sXG4gICAgICAgIGIxMiA9IGJbMTJdLCBiMTMgPSBiWzEzXSwgYjE0ID0gYlsxNF0sIGIxNSA9IGJbMTVdO1xuXG4gICAgdmFyIGNoYW5nZWQgPSBmYWxzZTtcbiAgICB2YXIgb3V0MCwgb3V0MSwgb3V0Miwgb3V0MztcblxuICAgIG91dDAgPSBiMCphMDAgKyBiMSphMTAgKyBiMiphMjAgKyBiMyphMzA7XG4gICAgb3V0MSA9IGIwKmEwMSArIGIxKmExMSArIGIyKmEyMSArIGIzKmEzMTtcbiAgICBvdXQyID0gYjAqYTAyICsgYjEqYTEyICsgYjIqYTIyICsgYjMqYTMyO1xuICAgIG91dDMgPSBiMCphMDMgKyBiMSphMTMgKyBiMiphMjMgKyBiMyphMzM7XG5cbiAgICBjaGFuZ2VkID0gY2hhbmdlZCA/XG4gICAgICAgICAgICAgIGNoYW5nZWQgOiBvdXQwID09PSBvdXRbMF0gfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dDEgPT09IG91dFsxXSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0MiA9PT0gb3V0WzJdIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXQzID09PSBvdXRbM107XG5cbiAgICBvdXRbMF0gPSBvdXQwO1xuICAgIG91dFsxXSA9IG91dDE7XG4gICAgb3V0WzJdID0gb3V0MjtcbiAgICBvdXRbM10gPSBvdXQzO1xuXG4gICAgYjAgPSBiNDsgYjEgPSBiNTsgYjIgPSBiNjsgYjMgPSBiNztcbiAgICBvdXQwID0gYjAqYTAwICsgYjEqYTEwICsgYjIqYTIwICsgYjMqYTMwO1xuICAgIG91dDEgPSBiMCphMDEgKyBiMSphMTEgKyBiMiphMjEgKyBiMyphMzE7XG4gICAgb3V0MiA9IGIwKmEwMiArIGIxKmExMiArIGIyKmEyMiArIGIzKmEzMjtcbiAgICBvdXQzID0gYjAqYTAzICsgYjEqYTEzICsgYjIqYTIzICsgYjMqYTMzO1xuXG4gICAgY2hhbmdlZCA9IGNoYW5nZWQgP1xuICAgICAgICAgICAgICBjaGFuZ2VkIDogb3V0MCA9PT0gb3V0WzRdIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXQxID09PSBvdXRbNV0gfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dDIgPT09IG91dFs2XSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0MyA9PT0gb3V0WzddO1xuXG4gICAgb3V0WzRdID0gb3V0MDtcbiAgICBvdXRbNV0gPSBvdXQxO1xuICAgIG91dFs2XSA9IG91dDI7XG4gICAgb3V0WzddID0gb3V0MztcblxuICAgIGIwID0gYjg7IGIxID0gYjk7IGIyID0gYjEwOyBiMyA9IGIxMTtcbiAgICBvdXQwID0gYjAqYTAwICsgYjEqYTEwICsgYjIqYTIwICsgYjMqYTMwO1xuICAgIG91dDEgPSBiMCphMDEgKyBiMSphMTEgKyBiMiphMjEgKyBiMyphMzE7XG4gICAgb3V0MiA9IGIwKmEwMiArIGIxKmExMiArIGIyKmEyMiArIGIzKmEzMjtcbiAgICBvdXQzID0gYjAqYTAzICsgYjEqYTEzICsgYjIqYTIzICsgYjMqYTMzO1xuXG4gICAgY2hhbmdlZCA9IGNoYW5nZWQgP1xuICAgICAgICAgICAgICBjaGFuZ2VkIDogb3V0MCA9PT0gb3V0WzhdIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXQxID09PSBvdXRbOV0gfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dDIgPT09IG91dFsxMF0gfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dDMgPT09IG91dFsxMV07XG5cbiAgICBvdXRbOF0gPSBvdXQwO1xuICAgIG91dFs5XSA9IG91dDE7XG4gICAgb3V0WzEwXSA9IG91dDI7XG4gICAgb3V0WzExXSA9IG91dDM7XG5cbiAgICBiMCA9IGIxMjsgYjEgPSBiMTM7IGIyID0gYjE0OyBiMyA9IGIxNTtcbiAgICBvdXQwID0gYjAqYTAwICsgYjEqYTEwICsgYjIqYTIwICsgYjMqYTMwO1xuICAgIG91dDEgPSBiMCphMDEgKyBiMSphMTEgKyBiMiphMjEgKyBiMyphMzE7XG4gICAgb3V0MiA9IGIwKmEwMiArIGIxKmExMiArIGIyKmEyMiArIGIzKmEzMjtcbiAgICBvdXQzID0gYjAqYTAzICsgYjEqYTEzICsgYjIqYTIzICsgYjMqYTMzO1xuXG4gICAgY2hhbmdlZCA9IGNoYW5nZWQgP1xuICAgICAgICAgICAgICBjaGFuZ2VkIDogb3V0MCA9PT0gb3V0WzEyXSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0MSA9PT0gb3V0WzEzXSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0MiA9PT0gb3V0WzE0XSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0MyA9PT0gb3V0WzE1XTtcblxuICAgIG91dFsxMl0gPSBvdXQwO1xuICAgIG91dFsxM10gPSBvdXQxO1xuICAgIG91dFsxNF0gPSBvdXQyO1xuICAgIG91dFsxNV0gPSBvdXQzO1xuXG4gICAgcmV0dXJuIG91dDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbXVsdGlwbHk6IG11bHRpcGx5LFxuICAgIGludmVydDogaW52ZXJ0XG59O1xuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgVUlFdmVudCA9IHJlcXVpcmUoJy4vVUlFdmVudCcpO1xuXG4vKipcbiAqIFNlZSBbVUkgRXZlbnRzIChmb3JtZXJseSBET00gTGV2ZWwgMyBFdmVudHMpXShodHRwOi8vd3d3LnczLm9yZy9UUi8yMDE1L1dELXVpZXZlbnRzLTIwMTUwNDI4LyNldmVudHMtY29tcG9zaXRpb25ldmVudHMpLlxuICpcbiAqIEBjbGFzcyBDb21wb3NpdGlvbkV2ZW50XG4gKiBAYXVnbWVudHMgVUlFdmVudFxuICpcbiAqIEBwYXJhbSB7RXZlbnR9IGV2IFRoZSBuYXRpdmUgRE9NIGV2ZW50LlxuICovXG5mdW5jdGlvbiBDb21wb3NpdGlvbkV2ZW50KGV2KSB7XG4gICAgLy8gW0NvbnN0cnVjdG9yKERPTVN0cmluZyB0eXBlQXJnLCBvcHRpb25hbCBDb21wb3NpdGlvbkV2ZW50SW5pdCBjb21wb3NpdGlvbkV2ZW50SW5pdERpY3QpXVxuICAgIC8vIGludGVyZmFjZSBDb21wb3NpdGlvbkV2ZW50IDogVUlFdmVudCB7XG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSBET01TdHJpbmcgZGF0YTtcbiAgICAvLyB9O1xuXG4gICAgVUlFdmVudC5jYWxsKHRoaXMsIGV2KTtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIENvbXBvc2l0aW9uRXZlbnQjZGF0YVxuICAgICAqIEB0eXBlIFN0cmluZ1xuICAgICAqL1xuICAgIHRoaXMuZGF0YSA9IGV2LmRhdGE7XG59XG5cbkNvbXBvc2l0aW9uRXZlbnQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShVSUV2ZW50LnByb3RvdHlwZSk7XG5Db21wb3NpdGlvbkV2ZW50LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IENvbXBvc2l0aW9uRXZlbnQ7XG5cbi8qKlxuICogUmV0dXJuIHRoZSBuYW1lIG9mIHRoZSBldmVudCB0eXBlXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge1N0cmluZ30gTmFtZSBvZiB0aGUgZXZlbnQgdHlwZVxuICovXG5Db21wb3NpdGlvbkV2ZW50LnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nICgpIHtcbiAgICByZXR1cm4gJ0NvbXBvc2l0aW9uRXZlbnQnO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb21wb3NpdGlvbkV2ZW50O1xuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIFRoZSBFdmVudCBjbGFzcyBpcyBiZWluZyB1c2VkIGluIG9yZGVyIHRvIG5vcm1hbGl6ZSBuYXRpdmUgRE9NIGV2ZW50cy5cbiAqIEV2ZW50cyBuZWVkIHRvIGJlIG5vcm1hbGl6ZWQgaW4gb3JkZXIgdG8gYmUgc2VyaWFsaXplZCB0aHJvdWdoIHRoZSBzdHJ1Y3R1cmVkXG4gKiBjbG9uaW5nIGFsZ29yaXRobSB1c2VkIGJ5IHRoZSBgcG9zdE1lc3NhZ2VgIG1ldGhvZCAoV2ViIFdvcmtlcnMpLlxuICpcbiAqIFdyYXBwaW5nIERPTSBldmVudHMgYWxzbyBoYXMgdGhlIGFkdmFudGFnZSBvZiBwcm92aWRpbmcgYSBjb25zaXN0ZW50XG4gKiBpbnRlcmZhY2UgZm9yIGludGVyYWN0aW5nIHdpdGggRE9NIGV2ZW50cyBhY3Jvc3MgYnJvd3NlcnMgYnkgY29weWluZyBvdmVyIGFcbiAqIHN1YnNldCBvZiB0aGUgZXhwb3NlZCBwcm9wZXJ0aWVzIHRoYXQgaXMgZ3VhcmFudGVlZCB0byBiZSBjb25zaXN0ZW50IGFjcm9zc1xuICogYnJvd3NlcnMuXG4gKlxuICogU2VlIFtVSSBFdmVudHMgKGZvcm1lcmx5IERPTSBMZXZlbCAzIEV2ZW50cyldKGh0dHA6Ly93d3cudzMub3JnL1RSLzIwMTUvV0QtdWlldmVudHMtMjAxNTA0MjgvI2ludGVyZmFjZS1FdmVudCkuXG4gKlxuICogQGNsYXNzIEV2ZW50XG4gKlxuICogQHBhcmFtIHtFdmVudH0gZXYgVGhlIG5hdGl2ZSBET00gZXZlbnQuXG4gKi9cbmZ1bmN0aW9uIEV2ZW50KGV2KSB7XG4gICAgLy8gW0NvbnN0cnVjdG9yKERPTVN0cmluZyB0eXBlLCBvcHRpb25hbCBFdmVudEluaXQgZXZlbnRJbml0RGljdCksXG4gICAgLy8gIEV4cG9zZWQ9V2luZG93LFdvcmtlcl1cbiAgICAvLyBpbnRlcmZhY2UgRXZlbnQge1xuICAgIC8vICAgcmVhZG9ubHkgYXR0cmlidXRlIERPTVN0cmluZyB0eXBlO1xuICAgIC8vICAgcmVhZG9ubHkgYXR0cmlidXRlIEV2ZW50VGFyZ2V0PyB0YXJnZXQ7XG4gICAgLy8gICByZWFkb25seSBhdHRyaWJ1dGUgRXZlbnRUYXJnZXQ/IGN1cnJlbnRUYXJnZXQ7XG5cbiAgICAvLyAgIGNvbnN0IHVuc2lnbmVkIHNob3J0IE5PTkUgPSAwO1xuICAgIC8vICAgY29uc3QgdW5zaWduZWQgc2hvcnQgQ0FQVFVSSU5HX1BIQVNFID0gMTtcbiAgICAvLyAgIGNvbnN0IHVuc2lnbmVkIHNob3J0IEFUX1RBUkdFVCA9IDI7XG4gICAgLy8gICBjb25zdCB1bnNpZ25lZCBzaG9ydCBCVUJCTElOR19QSEFTRSA9IDM7XG4gICAgLy8gICByZWFkb25seSBhdHRyaWJ1dGUgdW5zaWduZWQgc2hvcnQgZXZlbnRQaGFzZTtcblxuICAgIC8vICAgdm9pZCBzdG9wUHJvcGFnYXRpb24oKTtcbiAgICAvLyAgIHZvaWQgc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG5cbiAgICAvLyAgIHJlYWRvbmx5IGF0dHJpYnV0ZSBib29sZWFuIGJ1YmJsZXM7XG4gICAgLy8gICByZWFkb25seSBhdHRyaWJ1dGUgYm9vbGVhbiBjYW5jZWxhYmxlO1xuICAgIC8vICAgdm9pZCBwcmV2ZW50RGVmYXVsdCgpO1xuICAgIC8vICAgcmVhZG9ubHkgYXR0cmlidXRlIGJvb2xlYW4gZGVmYXVsdFByZXZlbnRlZDtcblxuICAgIC8vICAgW1VuZm9yZ2VhYmxlXSByZWFkb25seSBhdHRyaWJ1dGUgYm9vbGVhbiBpc1RydXN0ZWQ7XG4gICAgLy8gICByZWFkb25seSBhdHRyaWJ1dGUgRE9NVGltZVN0YW1wIHRpbWVTdGFtcDtcblxuICAgIC8vICAgdm9pZCBpbml0RXZlbnQoRE9NU3RyaW5nIHR5cGUsIGJvb2xlYW4gYnViYmxlcywgYm9vbGVhbiBjYW5jZWxhYmxlKTtcbiAgICAvLyB9O1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgRXZlbnQjdHlwZVxuICAgICAqIEB0eXBlIFN0cmluZ1xuICAgICAqL1xuICAgIHRoaXMudHlwZSA9IGV2LnR5cGU7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBFdmVudCNkZWZhdWx0UHJldmVudGVkXG4gICAgICogQHR5cGUgQm9vbGVhblxuICAgICAqL1xuICAgIHRoaXMuZGVmYXVsdFByZXZlbnRlZCA9IGV2LmRlZmF1bHRQcmV2ZW50ZWQ7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBFdmVudCN0aW1lU3RhbXBcbiAgICAgKiBAdHlwZSBOdW1iZXJcbiAgICAgKi9cbiAgICB0aGlzLnRpbWVTdGFtcCA9IGV2LnRpbWVTdGFtcDtcblxuXG4gICAgLyoqXG4gICAgICogVXNlZCBmb3IgZXhwb3NpbmcgdGhlIGN1cnJlbnQgdGFyZ2V0J3MgdmFsdWUuXG4gICAgICpcbiAgICAgKiBAbmFtZSBFdmVudCN2YWx1ZVxuICAgICAqIEB0eXBlIFN0cmluZ1xuICAgICAqL1xuICAgIHZhciB0YXJnZXRDb25zdHJ1Y3RvciA9IGV2LnRhcmdldC5jb25zdHJ1Y3RvcjtcbiAgICAvLyBUT0RPIFN1cHBvcnQgSFRNTEtleWdlbkVsZW1lbnRcbiAgICBpZiAoXG4gICAgICAgIHRhcmdldENvbnN0cnVjdG9yID09PSBIVE1MSW5wdXRFbGVtZW50IHx8XG4gICAgICAgIHRhcmdldENvbnN0cnVjdG9yID09PSBIVE1MVGV4dEFyZWFFbGVtZW50IHx8XG4gICAgICAgIHRhcmdldENvbnN0cnVjdG9yID09PSBIVE1MU2VsZWN0RWxlbWVudFxuICAgICkge1xuICAgICAgICB0aGlzLnZhbHVlID0gZXYudGFyZ2V0LnZhbHVlO1xuICAgIH1cbn1cblxuLyoqXG4gKiBSZXR1cm4gdGhlIG5hbWUgb2YgdGhlIGV2ZW50IHR5cGVcbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7U3RyaW5nfSBOYW1lIG9mIHRoZSBldmVudCB0eXBlXG4gKi9cbkV2ZW50LnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nICgpIHtcbiAgICByZXR1cm4gJ0V2ZW50Jztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRXZlbnQ7XG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBGYW1vdXMgSW5kdXN0cmllcyBJbmMuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBDb21wb3NpdGlvbkV2ZW50ID0gcmVxdWlyZSgnLi9Db21wb3NpdGlvbkV2ZW50Jyk7XG52YXIgRXZlbnQgPSByZXF1aXJlKCcuL0V2ZW50Jyk7XG52YXIgRm9jdXNFdmVudCA9IHJlcXVpcmUoJy4vRm9jdXNFdmVudCcpO1xudmFyIElucHV0RXZlbnQgPSByZXF1aXJlKCcuL0lucHV0RXZlbnQnKTtcbnZhciBLZXlib2FyZEV2ZW50ID0gcmVxdWlyZSgnLi9LZXlib2FyZEV2ZW50Jyk7XG52YXIgTW91c2VFdmVudCA9IHJlcXVpcmUoJy4vTW91c2VFdmVudCcpO1xudmFyIFRvdWNoRXZlbnQgPSByZXF1aXJlKCcuL1RvdWNoRXZlbnQnKTtcbnZhciBVSUV2ZW50ID0gcmVxdWlyZSgnLi9VSUV2ZW50Jyk7XG52YXIgV2hlZWxFdmVudCA9IHJlcXVpcmUoJy4vV2hlZWxFdmVudCcpO1xuXG4vKipcbiAqIEEgbWFwcGluZyBvZiBET00gZXZlbnRzIHRvIHRoZSBjb3JyZXNwb25kaW5nIGhhbmRsZXJzXG4gKlxuICogQG5hbWUgRXZlbnRNYXBcbiAqIEB0eXBlIE9iamVjdFxuICovXG52YXIgRXZlbnRNYXAgPSB7XG4gICAgY2hhbmdlICAgICAgICAgICAgICAgICAgICAgICAgIDogW0V2ZW50LCB0cnVlXSxcbiAgICBzdWJtaXQgICAgICAgICAgICAgICAgICAgICAgICAgOiBbRXZlbnQsIHRydWVdLFxuXG4gICAgLy8gVUkgRXZlbnRzIChodHRwOi8vd3d3LnczLm9yZy9UUi91aWV2ZW50cy8pXG4gICAgYWJvcnQgICAgICAgICAgICAgICAgICAgICAgICAgIDogW0V2ZW50LCBmYWxzZV0sXG4gICAgYmVmb3JlaW5wdXQgICAgICAgICAgICAgICAgICAgIDogW0lucHV0RXZlbnQsIHRydWVdLFxuICAgIGJsdXIgICAgICAgICAgICAgICAgICAgICAgICAgICA6IFtGb2N1c0V2ZW50LCBmYWxzZV0sXG4gICAgY2xpY2sgICAgICAgICAgICAgICAgICAgICAgICAgIDogW01vdXNlRXZlbnQsIHRydWVdLFxuICAgIGNvbXBvc2l0aW9uZW5kICAgICAgICAgICAgICAgICA6IFtDb21wb3NpdGlvbkV2ZW50LCB0cnVlXSxcbiAgICBjb21wb3NpdGlvbnN0YXJ0ICAgICAgICAgICAgICAgOiBbQ29tcG9zaXRpb25FdmVudCwgdHJ1ZV0sXG4gICAgY29tcG9zaXRpb251cGRhdGUgICAgICAgICAgICAgIDogW0NvbXBvc2l0aW9uRXZlbnQsIHRydWVdLFxuICAgIGRibGNsaWNrICAgICAgICAgICAgICAgICAgICAgICA6IFtNb3VzZUV2ZW50LCB0cnVlXSxcbiAgICBmb2N1cyAgICAgICAgICAgICAgICAgICAgICAgICAgOiBbRm9jdXNFdmVudCwgZmFsc2VdLFxuICAgIGZvY3VzaW4gICAgICAgICAgICAgICAgICAgICAgICA6IFtGb2N1c0V2ZW50LCB0cnVlXSxcbiAgICBmb2N1c291dCAgICAgICAgICAgICAgICAgICAgICAgOiBbRm9jdXNFdmVudCwgdHJ1ZV0sXG4gICAgaW5wdXQgICAgICAgICAgICAgICAgICAgICAgICAgIDogW0lucHV0RXZlbnQsIHRydWVdLFxuICAgIGtleWRvd24gICAgICAgICAgICAgICAgICAgICAgICA6IFtLZXlib2FyZEV2ZW50LCB0cnVlXSxcbiAgICBrZXl1cCAgICAgICAgICAgICAgICAgICAgICAgICAgOiBbS2V5Ym9hcmRFdmVudCwgdHJ1ZV0sXG4gICAgbG9hZCAgICAgICAgICAgICAgICAgICAgICAgICAgIDogW0V2ZW50LCBmYWxzZV0sXG4gICAgbW91c2Vkb3duICAgICAgICAgICAgICAgICAgICAgIDogW01vdXNlRXZlbnQsIHRydWVdLFxuICAgIG1vdXNlZW50ZXIgICAgICAgICAgICAgICAgICAgICA6IFtNb3VzZUV2ZW50LCBmYWxzZV0sXG4gICAgbW91c2VsZWF2ZSAgICAgICAgICAgICAgICAgICAgIDogW01vdXNlRXZlbnQsIGZhbHNlXSxcblxuICAgIC8vIGJ1YmJsZXMsIGJ1dCB3aWxsIGJlIHRyaWdnZXJlZCB2ZXJ5IGZyZXF1ZW50bHlcbiAgICBtb3VzZW1vdmUgICAgICAgICAgICAgICAgICAgICAgOiBbTW91c2VFdmVudCwgZmFsc2VdLFxuXG4gICAgbW91c2VvdXQgICAgICAgICAgICAgICAgICAgICAgIDogW01vdXNlRXZlbnQsIHRydWVdLFxuICAgIG1vdXNlb3ZlciAgICAgICAgICAgICAgICAgICAgICA6IFtNb3VzZUV2ZW50LCB0cnVlXSxcbiAgICBtb3VzZXVwICAgICAgICAgICAgICAgICAgICAgICAgOiBbTW91c2VFdmVudCwgdHJ1ZV0sXG4gICAgcmVzaXplICAgICAgICAgICAgICAgICAgICAgICAgIDogW1VJRXZlbnQsIGZhbHNlXSxcblxuICAgIC8vIG1pZ2h0IGJ1YmJsZVxuICAgIHNjcm9sbCAgICAgICAgICAgICAgICAgICAgICAgICA6IFtVSUV2ZW50LCBmYWxzZV0sXG5cbiAgICBzZWxlY3QgICAgICAgICAgICAgICAgICAgICAgICAgOiBbRXZlbnQsIHRydWVdLFxuICAgIHVubG9hZCAgICAgICAgICAgICAgICAgICAgICAgICA6IFtFdmVudCwgZmFsc2VdLFxuICAgIHdoZWVsICAgICAgICAgICAgICAgICAgICAgICAgICA6IFtXaGVlbEV2ZW50LCB0cnVlXSxcblxuICAgIC8vIFRvdWNoIEV2ZW50cyBFeHRlbnNpb24gKGh0dHA6Ly93d3cudzMub3JnL1RSL3RvdWNoLWV2ZW50cy1leHRlbnNpb25zLylcbiAgICB0b3VjaGNhbmNlbCAgICAgICAgICAgICAgICAgICAgOiBbVG91Y2hFdmVudCwgdHJ1ZV0sXG4gICAgdG91Y2hlbmQgICAgICAgICAgICAgICAgICAgICAgIDogW1RvdWNoRXZlbnQsIHRydWVdLFxuICAgIHRvdWNobW92ZSAgICAgICAgICAgICAgICAgICAgICA6IFtUb3VjaEV2ZW50LCB0cnVlXSxcbiAgICB0b3VjaHN0YXJ0ICAgICAgICAgICAgICAgICAgICAgOiBbVG91Y2hFdmVudCwgdHJ1ZV1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRNYXA7XG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBGYW1vdXMgSW5kdXN0cmllcyBJbmMuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBVSUV2ZW50ID0gcmVxdWlyZSgnLi9VSUV2ZW50Jyk7XG5cbi8qKlxuICogU2VlIFtVSSBFdmVudHMgKGZvcm1lcmx5IERPTSBMZXZlbCAzIEV2ZW50cyldKGh0dHA6Ly93d3cudzMub3JnL1RSLzIwMTUvV0QtdWlldmVudHMtMjAxNTA0MjgvI2V2ZW50cy1mb2N1c2V2ZW50KS5cbiAqXG4gKiBAY2xhc3MgRm9jdXNFdmVudFxuICogQGF1Z21lbnRzIFVJRXZlbnRcbiAqXG4gKiBAcGFyYW0ge0V2ZW50fSBldiBUaGUgbmF0aXZlIERPTSBldmVudC5cbiAqL1xuZnVuY3Rpb24gRm9jdXNFdmVudChldikge1xuICAgIC8vIFtDb25zdHJ1Y3RvcihET01TdHJpbmcgdHlwZUFyZywgb3B0aW9uYWwgRm9jdXNFdmVudEluaXQgZm9jdXNFdmVudEluaXREaWN0KV1cbiAgICAvLyBpbnRlcmZhY2UgRm9jdXNFdmVudCA6IFVJRXZlbnQge1xuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgRXZlbnRUYXJnZXQ/IHJlbGF0ZWRUYXJnZXQ7XG4gICAgLy8gfTtcblxuICAgIFVJRXZlbnQuY2FsbCh0aGlzLCBldik7XG59XG5cbkZvY3VzRXZlbnQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShVSUV2ZW50LnByb3RvdHlwZSk7XG5Gb2N1c0V2ZW50LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEZvY3VzRXZlbnQ7XG5cbi8qKlxuICogUmV0dXJuIHRoZSBuYW1lIG9mIHRoZSBldmVudCB0eXBlXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge1N0cmluZ30gTmFtZSBvZiB0aGUgZXZlbnQgdHlwZVxuICovXG5Gb2N1c0V2ZW50LnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nICgpIHtcbiAgICByZXR1cm4gJ0ZvY3VzRXZlbnQnO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBGb2N1c0V2ZW50O1xuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgVUlFdmVudCA9IHJlcXVpcmUoJy4vVUlFdmVudCcpO1xuXG4vKipcbiAqIFNlZSBbSW5wdXQgRXZlbnRzXShodHRwOi8vdzNjLmdpdGh1Yi5pby9lZGl0aW5nLWV4cGxhaW5lci9pbnB1dC1ldmVudHMuaHRtbCNpZGwtZGVmLUlucHV0RXZlbnQpLlxuICpcbiAqIEBjbGFzcyBJbnB1dEV2ZW50XG4gKiBAYXVnbWVudHMgVUlFdmVudFxuICpcbiAqIEBwYXJhbSB7RXZlbnR9IGV2IFRoZSBuYXRpdmUgRE9NIGV2ZW50LlxuICovXG5mdW5jdGlvbiBJbnB1dEV2ZW50KGV2KSB7XG4gICAgLy8gW0NvbnN0cnVjdG9yKERPTVN0cmluZyB0eXBlQXJnLCBvcHRpb25hbCBJbnB1dEV2ZW50SW5pdCBpbnB1dEV2ZW50SW5pdERpY3QpXVxuICAgIC8vIGludGVyZmFjZSBJbnB1dEV2ZW50IDogVUlFdmVudCB7XG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSBET01TdHJpbmcgaW5wdXRUeXBlO1xuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgRE9NU3RyaW5nIGRhdGE7XG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSBib29sZWFuICAgaXNDb21wb3Npbmc7XG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSBSYW5nZSAgICAgdGFyZ2V0UmFuZ2U7XG4gICAgLy8gfTtcblxuICAgIFVJRXZlbnQuY2FsbCh0aGlzLCBldik7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSAgICBJbnB1dEV2ZW50I2lucHV0VHlwZVxuICAgICAqIEB0eXBlICAgIFN0cmluZ1xuICAgICAqL1xuICAgIHRoaXMuaW5wdXRUeXBlID0gZXYuaW5wdXRUeXBlO1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgICAgSW5wdXRFdmVudCNkYXRhXG4gICAgICogQHR5cGUgICAgU3RyaW5nXG4gICAgICovXG4gICAgdGhpcy5kYXRhID0gZXYuZGF0YTtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lICAgIElucHV0RXZlbnQjaXNDb21wb3NpbmdcbiAgICAgKiBAdHlwZSAgICBCb29sZWFuXG4gICAgICovXG4gICAgdGhpcy5pc0NvbXBvc2luZyA9IGV2LmlzQ29tcG9zaW5nO1xuXG4gICAgLyoqXG4gICAgICogKipMaW1pdGVkIGJyb3dzZXIgc3VwcG9ydCoqLlxuICAgICAqXG4gICAgICogQG5hbWUgICAgSW5wdXRFdmVudCN0YXJnZXRSYW5nZVxuICAgICAqIEB0eXBlICAgIEJvb2xlYW5cbiAgICAgKi9cbiAgICB0aGlzLnRhcmdldFJhbmdlID0gZXYudGFyZ2V0UmFuZ2U7XG59XG5cbklucHV0RXZlbnQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShVSUV2ZW50LnByb3RvdHlwZSk7XG5JbnB1dEV2ZW50LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IElucHV0RXZlbnQ7XG5cbi8qKlxuICogUmV0dXJuIHRoZSBuYW1lIG9mIHRoZSBldmVudCB0eXBlXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge1N0cmluZ30gTmFtZSBvZiB0aGUgZXZlbnQgdHlwZVxuICovXG5JbnB1dEV2ZW50LnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nICgpIHtcbiAgICByZXR1cm4gJ0lucHV0RXZlbnQnO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBJbnB1dEV2ZW50O1xuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgVUlFdmVudCA9IHJlcXVpcmUoJy4vVUlFdmVudCcpO1xuXG4vKipcbiAqIFNlZSBbVUkgRXZlbnRzIChmb3JtZXJseSBET00gTGV2ZWwgMyBFdmVudHMpXShodHRwOi8vd3d3LnczLm9yZy9UUi8yMDE1L1dELXVpZXZlbnRzLTIwMTUwNDI4LyNldmVudHMta2V5Ym9hcmRldmVudHMpLlxuICpcbiAqIEBjbGFzcyBLZXlib2FyZEV2ZW50XG4gKiBAYXVnbWVudHMgVUlFdmVudFxuICpcbiAqIEBwYXJhbSB7RXZlbnR9IGV2IFRoZSBuYXRpdmUgRE9NIGV2ZW50LlxuICovXG5mdW5jdGlvbiBLZXlib2FyZEV2ZW50KGV2KSB7XG4gICAgLy8gW0NvbnN0cnVjdG9yKERPTVN0cmluZyB0eXBlQXJnLCBvcHRpb25hbCBLZXlib2FyZEV2ZW50SW5pdCBrZXlib2FyZEV2ZW50SW5pdERpY3QpXVxuICAgIC8vIGludGVyZmFjZSBLZXlib2FyZEV2ZW50IDogVUlFdmVudCB7XG4gICAgLy8gICAgIC8vIEtleUxvY2F0aW9uQ29kZVxuICAgIC8vICAgICBjb25zdCB1bnNpZ25lZCBsb25nIERPTV9LRVlfTE9DQVRJT05fU1RBTkRBUkQgPSAweDAwO1xuICAgIC8vICAgICBjb25zdCB1bnNpZ25lZCBsb25nIERPTV9LRVlfTE9DQVRJT05fTEVGVCA9IDB4MDE7XG4gICAgLy8gICAgIGNvbnN0IHVuc2lnbmVkIGxvbmcgRE9NX0tFWV9MT0NBVElPTl9SSUdIVCA9IDB4MDI7XG4gICAgLy8gICAgIGNvbnN0IHVuc2lnbmVkIGxvbmcgRE9NX0tFWV9MT0NBVElPTl9OVU1QQUQgPSAweDAzO1xuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgRE9NU3RyaW5nICAgICBrZXk7XG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSBET01TdHJpbmcgICAgIGNvZGU7XG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSB1bnNpZ25lZCBsb25nIGxvY2F0aW9uO1xuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgYm9vbGVhbiAgICAgICBjdHJsS2V5O1xuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgYm9vbGVhbiAgICAgICBzaGlmdEtleTtcbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIGJvb2xlYW4gICAgICAgYWx0S2V5O1xuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgYm9vbGVhbiAgICAgICBtZXRhS2V5O1xuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgYm9vbGVhbiAgICAgICByZXBlYXQ7XG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSBib29sZWFuICAgICAgIGlzQ29tcG9zaW5nO1xuICAgIC8vICAgICBib29sZWFuIGdldE1vZGlmaWVyU3RhdGUgKERPTVN0cmluZyBrZXlBcmcpO1xuICAgIC8vIH07XG5cbiAgICBVSUV2ZW50LmNhbGwodGhpcywgZXYpO1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgS2V5Ym9hcmRFdmVudCNET01fS0VZX0xPQ0FUSU9OX1NUQU5EQVJEXG4gICAgICogQHR5cGUgTnVtYmVyXG4gICAgICovXG4gICAgdGhpcy5ET01fS0VZX0xPQ0FUSU9OX1NUQU5EQVJEID0gMHgwMDtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIEtleWJvYXJkRXZlbnQjRE9NX0tFWV9MT0NBVElPTl9MRUZUXG4gICAgICogQHR5cGUgTnVtYmVyXG4gICAgICovXG4gICAgdGhpcy5ET01fS0VZX0xPQ0FUSU9OX0xFRlQgPSAweDAxO1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgS2V5Ym9hcmRFdmVudCNET01fS0VZX0xPQ0FUSU9OX1JJR0hUXG4gICAgICogQHR5cGUgTnVtYmVyXG4gICAgICovXG4gICAgdGhpcy5ET01fS0VZX0xPQ0FUSU9OX1JJR0hUID0gMHgwMjtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIEtleWJvYXJkRXZlbnQjRE9NX0tFWV9MT0NBVElPTl9OVU1QQURcbiAgICAgKiBAdHlwZSBOdW1iZXJcbiAgICAgKi9cbiAgICB0aGlzLkRPTV9LRVlfTE9DQVRJT05fTlVNUEFEID0gMHgwMztcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIEtleWJvYXJkRXZlbnQja2V5XG4gICAgICogQHR5cGUgU3RyaW5nXG4gICAgICovXG4gICAgdGhpcy5rZXkgPSBldi5rZXk7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBLZXlib2FyZEV2ZW50I2NvZGVcbiAgICAgKiBAdHlwZSBTdHJpbmdcbiAgICAgKi9cbiAgICB0aGlzLmNvZGUgPSBldi5jb2RlO1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgS2V5Ym9hcmRFdmVudCNsb2NhdGlvblxuICAgICAqIEB0eXBlIE51bWJlclxuICAgICAqL1xuICAgIHRoaXMubG9jYXRpb24gPSBldi5sb2NhdGlvbjtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIEtleWJvYXJkRXZlbnQjY3RybEtleVxuICAgICAqIEB0eXBlIEJvb2xlYW5cbiAgICAgKi9cbiAgICB0aGlzLmN0cmxLZXkgPSBldi5jdHJsS2V5O1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgS2V5Ym9hcmRFdmVudCNzaGlmdEtleVxuICAgICAqIEB0eXBlIEJvb2xlYW5cbiAgICAgKi9cbiAgICB0aGlzLnNoaWZ0S2V5ID0gZXYuc2hpZnRLZXk7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBLZXlib2FyZEV2ZW50I2FsdEtleVxuICAgICAqIEB0eXBlIEJvb2xlYW5cbiAgICAgKi9cbiAgICB0aGlzLmFsdEtleSA9IGV2LmFsdEtleTtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIEtleWJvYXJkRXZlbnQjbWV0YUtleVxuICAgICAqIEB0eXBlIEJvb2xlYW5cbiAgICAgKi9cbiAgICB0aGlzLm1ldGFLZXkgPSBldi5tZXRhS2V5O1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgS2V5Ym9hcmRFdmVudCNyZXBlYXRcbiAgICAgKiBAdHlwZSBCb29sZWFuXG4gICAgICovXG4gICAgdGhpcy5yZXBlYXQgPSBldi5yZXBlYXQ7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBLZXlib2FyZEV2ZW50I2lzQ29tcG9zaW5nXG4gICAgICogQHR5cGUgQm9vbGVhblxuICAgICAqL1xuICAgIHRoaXMuaXNDb21wb3NpbmcgPSBldi5pc0NvbXBvc2luZztcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIEtleWJvYXJkRXZlbnQja2V5Q29kZVxuICAgICAqIEB0eXBlIFN0cmluZ1xuICAgICAqIEBkZXByZWNhdGVkXG4gICAgICovXG4gICAgdGhpcy5rZXlDb2RlID0gZXYua2V5Q29kZTtcbn1cblxuS2V5Ym9hcmRFdmVudC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFVJRXZlbnQucHJvdG90eXBlKTtcbktleWJvYXJkRXZlbnQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gS2V5Ym9hcmRFdmVudDtcblxuLyoqXG4gKiBSZXR1cm4gdGhlIG5hbWUgb2YgdGhlIGV2ZW50IHR5cGVcbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7U3RyaW5nfSBOYW1lIG9mIHRoZSBldmVudCB0eXBlXG4gKi9cbktleWJvYXJkRXZlbnQucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gdG9TdHJpbmcgKCkge1xuICAgIHJldHVybiAnS2V5Ym9hcmRFdmVudCc7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEtleWJvYXJkRXZlbnQ7XG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBGYW1vdXMgSW5kdXN0cmllcyBJbmMuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBVSUV2ZW50ID0gcmVxdWlyZSgnLi9VSUV2ZW50Jyk7XG5cbi8qKlxuICogU2VlIFtVSSBFdmVudHMgKGZvcm1lcmx5IERPTSBMZXZlbCAzIEV2ZW50cyldKGh0dHA6Ly93d3cudzMub3JnL1RSLzIwMTUvV0QtdWlldmVudHMtMjAxNTA0MjgvI2V2ZW50cy1tb3VzZWV2ZW50cykuXG4gKlxuICogQGNsYXNzIEtleWJvYXJkRXZlbnRcbiAqIEBhdWdtZW50cyBVSUV2ZW50XG4gKlxuICogQHBhcmFtIHtFdmVudH0gZXYgVGhlIG5hdGl2ZSBET00gZXZlbnQuXG4gKi9cbmZ1bmN0aW9uIE1vdXNlRXZlbnQoZXYpIHtcbiAgICAvLyBbQ29uc3RydWN0b3IoRE9NU3RyaW5nIHR5cGVBcmcsIG9wdGlvbmFsIE1vdXNlRXZlbnRJbml0IG1vdXNlRXZlbnRJbml0RGljdCldXG4gICAgLy8gaW50ZXJmYWNlIE1vdXNlRXZlbnQgOiBVSUV2ZW50IHtcbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIGxvbmcgICAgICAgICAgIHNjcmVlblg7XG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSBsb25nICAgICAgICAgICBzY3JlZW5ZO1xuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgbG9uZyAgICAgICAgICAgY2xpZW50WDtcbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIGxvbmcgICAgICAgICAgIGNsaWVudFk7XG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSBib29sZWFuICAgICAgICBjdHJsS2V5O1xuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgYm9vbGVhbiAgICAgICAgc2hpZnRLZXk7XG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSBib29sZWFuICAgICAgICBhbHRLZXk7XG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSBib29sZWFuICAgICAgICBtZXRhS2V5O1xuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgc2hvcnQgICAgICAgICAgYnV0dG9uO1xuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgRXZlbnRUYXJnZXQ/ICAgcmVsYXRlZFRhcmdldDtcbiAgICAvLyAgICAgLy8gSW50cm9kdWNlZCBpbiB0aGlzIHNwZWNpZmljYXRpb25cbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIHVuc2lnbmVkIHNob3J0IGJ1dHRvbnM7XG4gICAgLy8gICAgIGJvb2xlYW4gZ2V0TW9kaWZpZXJTdGF0ZSAoRE9NU3RyaW5nIGtleUFyZyk7XG4gICAgLy8gfTtcblxuICAgIFVJRXZlbnQuY2FsbCh0aGlzLCBldik7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBNb3VzZUV2ZW50I3NjcmVlblhcbiAgICAgKiBAdHlwZSBOdW1iZXJcbiAgICAgKi9cbiAgICB0aGlzLnNjcmVlblggPSBldi5zY3JlZW5YO1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgTW91c2VFdmVudCNzY3JlZW5ZXG4gICAgICogQHR5cGUgTnVtYmVyXG4gICAgICovXG4gICAgdGhpcy5zY3JlZW5ZID0gZXYuc2NyZWVuWTtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIE1vdXNlRXZlbnQjY2xpZW50WFxuICAgICAqIEB0eXBlIE51bWJlclxuICAgICAqL1xuICAgIHRoaXMuY2xpZW50WCA9IGV2LmNsaWVudFg7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBNb3VzZUV2ZW50I2NsaWVudFlcbiAgICAgKiBAdHlwZSBOdW1iZXJcbiAgICAgKi9cbiAgICB0aGlzLmNsaWVudFkgPSBldi5jbGllbnRZO1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgTW91c2VFdmVudCNjdHJsS2V5XG4gICAgICogQHR5cGUgQm9vbGVhblxuICAgICAqL1xuICAgIHRoaXMuY3RybEtleSA9IGV2LmN0cmxLZXk7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBNb3VzZUV2ZW50I3NoaWZ0S2V5XG4gICAgICogQHR5cGUgQm9vbGVhblxuICAgICAqL1xuICAgIHRoaXMuc2hpZnRLZXkgPSBldi5zaGlmdEtleTtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIE1vdXNlRXZlbnQjYWx0S2V5XG4gICAgICogQHR5cGUgQm9vbGVhblxuICAgICAqL1xuICAgIHRoaXMuYWx0S2V5ID0gZXYuYWx0S2V5O1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgTW91c2VFdmVudCNtZXRhS2V5XG4gICAgICogQHR5cGUgQm9vbGVhblxuICAgICAqL1xuICAgIHRoaXMubWV0YUtleSA9IGV2Lm1ldGFLZXk7XG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSBNb3VzZUV2ZW50I2J1dHRvblxuICAgICAqIEB0eXBlIE51bWJlclxuICAgICAqL1xuICAgIHRoaXMuYnV0dG9uID0gZXYuYnV0dG9uO1xuXG4gICAgLyoqXG4gICAgICogQHR5cGUgTW91c2VFdmVudCNidXR0b25zXG4gICAgICogQHR5cGUgTnVtYmVyXG4gICAgICovXG4gICAgdGhpcy5idXR0b25zID0gZXYuYnV0dG9ucztcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIE1vdXNlRXZlbnQjcGFnZVhcbiAgICAgKiBAdHlwZSBOdW1iZXJcbiAgICAgKi9cbiAgICB0aGlzLnBhZ2VYID0gZXYucGFnZVg7XG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSBNb3VzZUV2ZW50I3BhZ2VZXG4gICAgICogQHR5cGUgTnVtYmVyXG4gICAgICovXG4gICAgdGhpcy5wYWdlWSA9IGV2LnBhZ2VZO1xuXG4gICAgLyoqXG4gICAgICogQHR5cGUgTW91c2VFdmVudCN4XG4gICAgICogQHR5cGUgTnVtYmVyXG4gICAgICovXG4gICAgdGhpcy54ID0gZXYueDtcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIE1vdXNlRXZlbnQjeVxuICAgICAqIEB0eXBlIE51bWJlclxuICAgICAqL1xuICAgIHRoaXMueSA9IGV2Lnk7XG5cbiAgICAvKipcbiAgICAgKiBAdHlwZSBNb3VzZUV2ZW50I29mZnNldFhcbiAgICAgKiBAdHlwZSBOdW1iZXJcbiAgICAgKi9cbiAgICB0aGlzLm9mZnNldFggPSBldi5vZmZzZXRYO1xuXG4gICAgLyoqXG4gICAgICogQHR5cGUgTW91c2VFdmVudCNvZmZzZXRZXG4gICAgICogQHR5cGUgTnVtYmVyXG4gICAgICovXG4gICAgdGhpcy5vZmZzZXRZID0gZXYub2Zmc2V0WTtcbn1cblxuTW91c2VFdmVudC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFVJRXZlbnQucHJvdG90eXBlKTtcbk1vdXNlRXZlbnQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gTW91c2VFdmVudDtcblxuLyoqXG4gKiBSZXR1cm4gdGhlIG5hbWUgb2YgdGhlIGV2ZW50IHR5cGVcbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7U3RyaW5nfSBOYW1lIG9mIHRoZSBldmVudCB0eXBlXG4gKi9cbk1vdXNlRXZlbnQucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gdG9TdHJpbmcgKCkge1xuICAgIHJldHVybiAnTW91c2VFdmVudCc7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1vdXNlRXZlbnQ7XG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBGYW1vdXMgSW5kdXN0cmllcyBJbmMuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBVSUV2ZW50ID0gcmVxdWlyZSgnLi9VSUV2ZW50Jyk7XG5cbnZhciBFTVBUWV9BUlJBWSA9IFtdO1xuXG4vKipcbiAqIFNlZSBbVG91Y2ggSW50ZXJmYWNlXShodHRwOi8vd3d3LnczLm9yZy9UUi8yMDEzL1JFQy10b3VjaC1ldmVudHMtMjAxMzEwMTAvI3RvdWNoLWludGVyZmFjZSkuXG4gKlxuICogQGNsYXNzIFRvdWNoXG4gKiBAcHJpdmF0ZVxuICpcbiAqIEBwYXJhbSB7VG91Y2h9IHRvdWNoIFRoZSBuYXRpdmUgVG91Y2ggb2JqZWN0LlxuICovXG5mdW5jdGlvbiBUb3VjaCh0b3VjaCkge1xuICAgIC8vIGludGVyZmFjZSBUb3VjaCB7XG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSBsb25nICAgICAgICBpZGVudGlmaWVyO1xuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgRXZlbnRUYXJnZXQgdGFyZ2V0O1xuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgZG91YmxlICAgICAgc2NyZWVuWDtcbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIGRvdWJsZSAgICAgIHNjcmVlblk7XG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSBkb3VibGUgICAgICBjbGllbnRYO1xuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgZG91YmxlICAgICAgY2xpZW50WTtcbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIGRvdWJsZSAgICAgIHBhZ2VYO1xuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgZG91YmxlICAgICAgcGFnZVk7XG4gICAgLy8gfTtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIFRvdWNoI2lkZW50aWZpZXJcbiAgICAgKiBAdHlwZSBOdW1iZXJcbiAgICAgKi9cbiAgICB0aGlzLmlkZW50aWZpZXIgPSB0b3VjaC5pZGVudGlmaWVyO1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgVG91Y2gjc2NyZWVuWFxuICAgICAqIEB0eXBlIE51bWJlclxuICAgICAqL1xuICAgIHRoaXMuc2NyZWVuWCA9IHRvdWNoLnNjcmVlblg7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBUb3VjaCNzY3JlZW5ZXG4gICAgICogQHR5cGUgTnVtYmVyXG4gICAgICovXG4gICAgdGhpcy5zY3JlZW5ZID0gdG91Y2guc2NyZWVuWTtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIFRvdWNoI2NsaWVudFhcbiAgICAgKiBAdHlwZSBOdW1iZXJcbiAgICAgKi9cbiAgICB0aGlzLmNsaWVudFggPSB0b3VjaC5jbGllbnRYO1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgVG91Y2gjY2xpZW50WVxuICAgICAqIEB0eXBlIE51bWJlclxuICAgICAqL1xuICAgIHRoaXMuY2xpZW50WSA9IHRvdWNoLmNsaWVudFk7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBUb3VjaCNwYWdlWFxuICAgICAqIEB0eXBlIE51bWJlclxuICAgICAqL1xuICAgIHRoaXMucGFnZVggPSB0b3VjaC5wYWdlWDtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIFRvdWNoI3BhZ2VZXG4gICAgICogQHR5cGUgTnVtYmVyXG4gICAgICovXG4gICAgdGhpcy5wYWdlWSA9IHRvdWNoLnBhZ2VZO1xufVxuXG5cbi8qKlxuICogTm9ybWFsaXplcyB0aGUgYnJvd3NlcidzIG5hdGl2ZSBUb3VjaExpc3QgYnkgY29udmVydGluZyBpdCBpbnRvIGFuIGFycmF5IG9mXG4gKiBub3JtYWxpemVkIFRvdWNoIG9iamVjdHMuXG4gKlxuICogQG1ldGhvZCAgY2xvbmVUb3VjaExpc3RcbiAqIEBwcml2YXRlXG4gKlxuICogQHBhcmFtICB7VG91Y2hMaXN0fSB0b3VjaExpc3QgICAgVGhlIG5hdGl2ZSBUb3VjaExpc3QgYXJyYXkuXG4gKiBAcmV0dXJuIHtBcnJheS48VG91Y2g+fSAgICAgICAgICBBbiBhcnJheSBvZiBub3JtYWxpemVkIFRvdWNoIG9iamVjdHMuXG4gKi9cbmZ1bmN0aW9uIGNsb25lVG91Y2hMaXN0KHRvdWNoTGlzdCkge1xuICAgIGlmICghdG91Y2hMaXN0KSByZXR1cm4gRU1QVFlfQVJSQVk7XG4gICAgLy8gaW50ZXJmYWNlIFRvdWNoTGlzdCB7XG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSB1bnNpZ25lZCBsb25nIGxlbmd0aDtcbiAgICAvLyAgICAgZ2V0dGVyIFRvdWNoPyBpdGVtICh1bnNpZ25lZCBsb25nIGluZGV4KTtcbiAgICAvLyB9O1xuXG4gICAgdmFyIHRvdWNoTGlzdEFycmF5ID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0b3VjaExpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdG91Y2hMaXN0QXJyYXlbaV0gPSBuZXcgVG91Y2godG91Y2hMaXN0W2ldKTtcbiAgICB9XG4gICAgcmV0dXJuIHRvdWNoTGlzdEFycmF5O1xufVxuXG4vKipcbiAqIFNlZSBbVG91Y2ggRXZlbnQgSW50ZXJmYWNlXShodHRwOi8vd3d3LnczLm9yZy9UUi8yMDEzL1JFQy10b3VjaC1ldmVudHMtMjAxMzEwMTAvI3RvdWNoZXZlbnQtaW50ZXJmYWNlKS5cbiAqXG4gKiBAY2xhc3MgVG91Y2hFdmVudFxuICogQGF1Z21lbnRzIFVJRXZlbnRcbiAqXG4gKiBAcGFyYW0ge0V2ZW50fSBldiBUaGUgbmF0aXZlIERPTSBldmVudC5cbiAqL1xuZnVuY3Rpb24gVG91Y2hFdmVudChldikge1xuICAgIC8vIGludGVyZmFjZSBUb3VjaEV2ZW50IDogVUlFdmVudCB7XG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSBUb3VjaExpc3QgdG91Y2hlcztcbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIFRvdWNoTGlzdCB0YXJnZXRUb3VjaGVzO1xuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgVG91Y2hMaXN0IGNoYW5nZWRUb3VjaGVzO1xuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgYm9vbGVhbiAgIGFsdEtleTtcbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIGJvb2xlYW4gICBtZXRhS2V5O1xuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgYm9vbGVhbiAgIGN0cmxLZXk7XG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSBib29sZWFuICAgc2hpZnRLZXk7XG4gICAgLy8gfTtcbiAgICBVSUV2ZW50LmNhbGwodGhpcywgZXYpO1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgVG91Y2hFdmVudCN0b3VjaGVzXG4gICAgICogQHR5cGUgQXJyYXkuPFRvdWNoPlxuICAgICAqL1xuICAgIHRoaXMudG91Y2hlcyA9IGNsb25lVG91Y2hMaXN0KGV2LnRvdWNoZXMpO1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgVG91Y2hFdmVudCN0YXJnZXRUb3VjaGVzXG4gICAgICogQHR5cGUgQXJyYXkuPFRvdWNoPlxuICAgICAqL1xuICAgIHRoaXMudGFyZ2V0VG91Y2hlcyA9IGNsb25lVG91Y2hMaXN0KGV2LnRhcmdldFRvdWNoZXMpO1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgVG91Y2hFdmVudCNjaGFuZ2VkVG91Y2hlc1xuICAgICAqIEB0eXBlIFRvdWNoTGlzdFxuICAgICAqL1xuICAgIHRoaXMuY2hhbmdlZFRvdWNoZXMgPSBjbG9uZVRvdWNoTGlzdChldi5jaGFuZ2VkVG91Y2hlcyk7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBUb3VjaEV2ZW50I2FsdEtleVxuICAgICAqIEB0eXBlIEJvb2xlYW5cbiAgICAgKi9cbiAgICB0aGlzLmFsdEtleSA9IGV2LmFsdEtleTtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIFRvdWNoRXZlbnQjbWV0YUtleVxuICAgICAqIEB0eXBlIEJvb2xlYW5cbiAgICAgKi9cbiAgICB0aGlzLm1ldGFLZXkgPSBldi5tZXRhS2V5O1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgVG91Y2hFdmVudCNjdHJsS2V5XG4gICAgICogQHR5cGUgQm9vbGVhblxuICAgICAqL1xuICAgIHRoaXMuY3RybEtleSA9IGV2LmN0cmxLZXk7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBUb3VjaEV2ZW50I3NoaWZ0S2V5XG4gICAgICogQHR5cGUgQm9vbGVhblxuICAgICAqL1xuICAgIHRoaXMuc2hpZnRLZXkgPSBldi5zaGlmdEtleTtcbn1cblxuVG91Y2hFdmVudC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFVJRXZlbnQucHJvdG90eXBlKTtcblRvdWNoRXZlbnQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gVG91Y2hFdmVudDtcblxuLyoqXG4gKiBSZXR1cm4gdGhlIG5hbWUgb2YgdGhlIGV2ZW50IHR5cGVcbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7U3RyaW5nfSBOYW1lIG9mIHRoZSBldmVudCB0eXBlXG4gKi9cblRvdWNoRXZlbnQucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gdG9TdHJpbmcgKCkge1xuICAgIHJldHVybiAnVG91Y2hFdmVudCc7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRvdWNoRXZlbnQ7XG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBGYW1vdXMgSW5kdXN0cmllcyBJbmMuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBFdmVudCA9IHJlcXVpcmUoJy4vRXZlbnQnKTtcblxuLyoqXG4gKiBTZWUgW1VJIEV2ZW50cyAoZm9ybWVybHkgRE9NIExldmVsIDMgRXZlbnRzKV0oaHR0cDovL3d3dy53My5vcmcvVFIvMjAxNS9XRC11aWV2ZW50cy0yMDE1MDQyOCkuXG4gKlxuICogQGNsYXNzIFVJRXZlbnRcbiAqIEBhdWdtZW50cyBFdmVudFxuICpcbiAqIEBwYXJhbSAge0V2ZW50fSBldiAgIFRoZSBuYXRpdmUgRE9NIGV2ZW50LlxuICovXG5mdW5jdGlvbiBVSUV2ZW50KGV2KSB7XG4gICAgLy8gW0NvbnN0cnVjdG9yKERPTVN0cmluZyB0eXBlLCBvcHRpb25hbCBVSUV2ZW50SW5pdCBldmVudEluaXREaWN0KV1cbiAgICAvLyBpbnRlcmZhY2UgVUlFdmVudCA6IEV2ZW50IHtcbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIFdpbmRvdz8gdmlldztcbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIGxvbmcgICAgZGV0YWlsO1xuICAgIC8vIH07XG4gICAgRXZlbnQuY2FsbCh0aGlzLCBldik7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBVSUV2ZW50I2RldGFpbFxuICAgICAqIEB0eXBlIE51bWJlclxuICAgICAqL1xuICAgIHRoaXMuZGV0YWlsID0gZXYuZGV0YWlsO1xufVxuXG5VSUV2ZW50LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRXZlbnQucHJvdG90eXBlKTtcblVJRXZlbnQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gVUlFdmVudDtcblxuLyoqXG4gKiBSZXR1cm4gdGhlIG5hbWUgb2YgdGhlIGV2ZW50IHR5cGVcbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7U3RyaW5nfSBOYW1lIG9mIHRoZSBldmVudCB0eXBlXG4gKi9cblVJRXZlbnQucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gdG9TdHJpbmcgKCkge1xuICAgIHJldHVybiAnVUlFdmVudCc7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFVJRXZlbnQ7XG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBGYW1vdXMgSW5kdXN0cmllcyBJbmMuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBNb3VzZUV2ZW50ID0gcmVxdWlyZSgnLi9Nb3VzZUV2ZW50Jyk7XG5cbi8qKlxuICogU2VlIFtVSSBFdmVudHMgKGZvcm1lcmx5IERPTSBMZXZlbCAzIEV2ZW50cyldKGh0dHA6Ly93d3cudzMub3JnL1RSLzIwMTUvV0QtdWlldmVudHMtMjAxNTA0MjgvI2V2ZW50cy13aGVlbGV2ZW50cykuXG4gKlxuICogQGNsYXNzIFdoZWVsRXZlbnRcbiAqIEBhdWdtZW50cyBVSUV2ZW50XG4gKlxuICogQHBhcmFtIHtFdmVudH0gZXYgVGhlIG5hdGl2ZSBET00gZXZlbnQuXG4gKi9cbmZ1bmN0aW9uIFdoZWVsRXZlbnQoZXYpIHtcbiAgICAvLyBbQ29uc3RydWN0b3IoRE9NU3RyaW5nIHR5cGVBcmcsIG9wdGlvbmFsIFdoZWVsRXZlbnRJbml0IHdoZWVsRXZlbnRJbml0RGljdCldXG4gICAgLy8gaW50ZXJmYWNlIFdoZWVsRXZlbnQgOiBNb3VzZUV2ZW50IHtcbiAgICAvLyAgICAgLy8gRGVsdGFNb2RlQ29kZVxuICAgIC8vICAgICBjb25zdCB1bnNpZ25lZCBsb25nIERPTV9ERUxUQV9QSVhFTCA9IDB4MDA7XG4gICAgLy8gICAgIGNvbnN0IHVuc2lnbmVkIGxvbmcgRE9NX0RFTFRBX0xJTkUgPSAweDAxO1xuICAgIC8vICAgICBjb25zdCB1bnNpZ25lZCBsb25nIERPTV9ERUxUQV9QQUdFID0gMHgwMjtcbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIGRvdWJsZSAgICAgICAgZGVsdGFYO1xuICAgIC8vICAgICByZWFkb25seSAgICBhdHRyaWJ1dGUgZG91YmxlICAgICAgICBkZWx0YVk7XG4gICAgLy8gICAgIHJlYWRvbmx5ICAgIGF0dHJpYnV0ZSBkb3VibGUgICAgICAgIGRlbHRhWjtcbiAgICAvLyAgICAgcmVhZG9ubHkgICAgYXR0cmlidXRlIHVuc2lnbmVkIGxvbmcgZGVsdGFNb2RlO1xuICAgIC8vIH07XG5cbiAgICBNb3VzZUV2ZW50LmNhbGwodGhpcywgZXYpO1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgV2hlZWxFdmVudCNET01fREVMVEFfUElYRUxcbiAgICAgKiBAdHlwZSBOdW1iZXJcbiAgICAgKi9cbiAgICB0aGlzLkRPTV9ERUxUQV9QSVhFTCA9IDB4MDA7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBXaGVlbEV2ZW50I0RPTV9ERUxUQV9MSU5FXG4gICAgICogQHR5cGUgTnVtYmVyXG4gICAgICovXG4gICAgdGhpcy5ET01fREVMVEFfTElORSA9IDB4MDE7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBXaGVlbEV2ZW50I0RPTV9ERUxUQV9QQUdFXG4gICAgICogQHR5cGUgTnVtYmVyXG4gICAgICovXG4gICAgdGhpcy5ET01fREVMVEFfUEFHRSA9IDB4MDI7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBXaGVlbEV2ZW50I2RlbHRhWFxuICAgICAqIEB0eXBlIE51bWJlclxuICAgICAqL1xuICAgIHRoaXMuZGVsdGFYID0gZXYuZGVsdGFYO1xuXG4gICAgLyoqXG4gICAgICogQG5hbWUgV2hlZWxFdmVudCNkZWx0YVlcbiAgICAgKiBAdHlwZSBOdW1iZXJcbiAgICAgKi9cbiAgICB0aGlzLmRlbHRhWSA9IGV2LmRlbHRhWTtcblxuICAgIC8qKlxuICAgICAqIEBuYW1lIFdoZWVsRXZlbnQjZGVsdGFaXG4gICAgICogQHR5cGUgTnVtYmVyXG4gICAgICovXG4gICAgdGhpcy5kZWx0YVogPSBldi5kZWx0YVo7XG5cbiAgICAvKipcbiAgICAgKiBAbmFtZSBXaGVlbEV2ZW50I2RlbHRhTW9kZVxuICAgICAqIEB0eXBlIE51bWJlclxuICAgICAqL1xuICAgIHRoaXMuZGVsdGFNb2RlID0gZXYuZGVsdGFNb2RlO1xufVxuXG5XaGVlbEV2ZW50LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoTW91c2VFdmVudC5wcm90b3R5cGUpO1xuV2hlZWxFdmVudC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBXaGVlbEV2ZW50O1xuXG4vKipcbiAqIFJldHVybiB0aGUgbmFtZSBvZiB0aGUgZXZlbnQgdHlwZVxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtTdHJpbmd9IE5hbWUgb2YgdGhlIGV2ZW50IHR5cGVcbiAqL1xuV2hlZWxFdmVudC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZyAoKSB7XG4gICAgcmV0dXJuICdXaGVlbEV2ZW50Jztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gV2hlZWxFdmVudDtcbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBBIHR3by1kaW1lbnNpb25hbCB2ZWN0b3IuXG4gKlxuICogQGNsYXNzIFZlYzJcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0geCBUaGUgeCBjb21wb25lbnQuXG4gKiBAcGFyYW0ge051bWJlcn0geSBUaGUgeSBjb21wb25lbnQuXG4gKi9cbnZhciBWZWMyID0gZnVuY3Rpb24oeCwgeSkge1xuICAgIGlmICh4IGluc3RhbmNlb2YgQXJyYXkgfHwgeCBpbnN0YW5jZW9mIEZsb2F0MzJBcnJheSkge1xuICAgICAgICB0aGlzLnggPSB4WzBdIHx8IDA7XG4gICAgICAgIHRoaXMueSA9IHhbMV0gfHwgMDtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHRoaXMueCA9IHggfHwgMDtcbiAgICAgICAgdGhpcy55ID0geSB8fCAwO1xuICAgIH1cbn07XG5cbi8qKlxuICogU2V0IHRoZSBjb21wb25lbnRzIG9mIHRoZSBjdXJyZW50IFZlYzIuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB4IFRoZSB4IGNvbXBvbmVudC5cbiAqIEBwYXJhbSB7TnVtYmVyfSB5IFRoZSB5IGNvbXBvbmVudC5cbiAqXG4gKiBAcmV0dXJuIHtWZWMyfSB0aGlzXG4gKi9cblZlYzIucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIHNldCh4LCB5KSB7XG4gICAgaWYgKHggIT0gbnVsbCkgdGhpcy54ID0geDtcbiAgICBpZiAoeSAhPSBudWxsKSB0aGlzLnkgPSB5O1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBBZGQgdGhlIGlucHV0IHYgdG8gdGhlIGN1cnJlbnQgVmVjMi5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtWZWMyfSB2IFRoZSBWZWMyIHRvIGFkZC5cbiAqXG4gKiBAcmV0dXJuIHtWZWMyfSB0aGlzXG4gKi9cblZlYzIucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uIGFkZCh2KSB7XG4gICAgdGhpcy54ICs9IHYueDtcbiAgICB0aGlzLnkgKz0gdi55O1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTdWJ0cmFjdCB0aGUgaW5wdXQgdiBmcm9tIHRoZSBjdXJyZW50IFZlYzIuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7VmVjMn0gdiBUaGUgVmVjMiB0byBzdWJ0cmFjdC5cbiAqXG4gKiBAcmV0dXJuIHtWZWMyfSB0aGlzXG4gKi9cblZlYzIucHJvdG90eXBlLnN1YnRyYWN0ID0gZnVuY3Rpb24gc3VidHJhY3Qodikge1xuICAgIHRoaXMueCAtPSB2Lng7XG4gICAgdGhpcy55IC09IHYueTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogU2NhbGUgdGhlIGN1cnJlbnQgVmVjMiBieSBhIHNjYWxhciBvciBWZWMyLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge051bWJlcnxWZWMyfSBzIFRoZSBOdW1iZXIgb3IgdmVjMiBieSB3aGljaCB0byBzY2FsZS5cbiAqXG4gKiBAcmV0dXJuIHtWZWMyfSB0aGlzXG4gKi9cblZlYzIucHJvdG90eXBlLnNjYWxlID0gZnVuY3Rpb24gc2NhbGUocykge1xuICAgIGlmIChzIGluc3RhbmNlb2YgVmVjMikge1xuICAgICAgICB0aGlzLnggKj0gcy54O1xuICAgICAgICB0aGlzLnkgKj0gcy55O1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdGhpcy54ICo9IHM7XG4gICAgICAgIHRoaXMueSAqPSBzO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUm90YXRlIHRoZSBWZWMyIGNvdW50ZXItY2xvY2t3aXNlIGJ5IHRoZXRhIGFib3V0IHRoZSB6LWF4aXMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB0aGV0YSBBbmdsZSBieSB3aGljaCB0byByb3RhdGUuXG4gKlxuICogQHJldHVybiB7VmVjMn0gdGhpc1xuICovXG5WZWMyLnByb3RvdHlwZS5yb3RhdGUgPSBmdW5jdGlvbih0aGV0YSkge1xuICAgIHZhciB4ID0gdGhpcy54O1xuICAgIHZhciB5ID0gdGhpcy55O1xuXG4gICAgdmFyIGNvc1RoZXRhID0gTWF0aC5jb3ModGhldGEpO1xuICAgIHZhciBzaW5UaGV0YSA9IE1hdGguc2luKHRoZXRhKTtcblxuICAgIHRoaXMueCA9IHggKiBjb3NUaGV0YSAtIHkgKiBzaW5UaGV0YTtcbiAgICB0aGlzLnkgPSB4ICogc2luVGhldGEgKyB5ICogY29zVGhldGE7XG5cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogVGhlIGRvdCBwcm9kdWN0IG9mIG9mIHRoZSBjdXJyZW50IFZlYzIgd2l0aCB0aGUgaW5wdXQgVmVjMi5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHYgVGhlIG90aGVyIFZlYzIuXG4gKlxuICogQHJldHVybiB7VmVjMn0gdGhpc1xuICovXG5WZWMyLnByb3RvdHlwZS5kb3QgPSBmdW5jdGlvbih2KSB7XG4gICAgcmV0dXJuIHRoaXMueCAqIHYueCArIHRoaXMueSAqIHYueTtcbn07XG5cbi8qKlxuICogVGhlIGNyb3NzIHByb2R1Y3Qgb2Ygb2YgdGhlIGN1cnJlbnQgVmVjMiB3aXRoIHRoZSBpbnB1dCBWZWMyLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gdiBUaGUgb3RoZXIgVmVjMi5cbiAqXG4gKiBAcmV0dXJuIHtWZWMyfSB0aGlzXG4gKi9cblZlYzIucHJvdG90eXBlLmNyb3NzID0gZnVuY3Rpb24odikge1xuICAgIHJldHVybiB0aGlzLnggKiB2LnkgLSB0aGlzLnkgKiB2Lng7XG59O1xuXG4vKipcbiAqIFByZXNlcnZlIHRoZSBtYWduaXR1ZGUgYnV0IGludmVydCB0aGUgb3JpZW50YXRpb24gb2YgdGhlIGN1cnJlbnQgVmVjMi5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7VmVjMn0gdGhpc1xuICovXG5WZWMyLnByb3RvdHlwZS5pbnZlcnQgPSBmdW5jdGlvbiBpbnZlcnQoKSB7XG4gICAgdGhpcy54ICo9IC0xO1xuICAgIHRoaXMueSAqPSAtMTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQXBwbHkgYSBmdW5jdGlvbiBjb21wb25lbnQtd2lzZSB0byB0aGUgY3VycmVudCBWZWMyLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBGdW5jdGlvbiB0byBhcHBseS5cbiAqXG4gKiBAcmV0dXJuIHtWZWMyfSB0aGlzXG4gKi9cblZlYzIucHJvdG90eXBlLm1hcCA9IGZ1bmN0aW9uIG1hcChmbikge1xuICAgIHRoaXMueCA9IGZuKHRoaXMueCk7XG4gICAgdGhpcy55ID0gZm4odGhpcy55KTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogR2V0IHRoZSBtYWduaXR1ZGUgb2YgdGhlIGN1cnJlbnQgVmVjMi5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7TnVtYmVyfSB0aGUgbGVuZ3RoIG9mIHRoZSB2ZWN0b3JcbiAqL1xuVmVjMi5wcm90b3R5cGUubGVuZ3RoID0gZnVuY3Rpb24gbGVuZ3RoKCkge1xuICAgIHZhciB4ID0gdGhpcy54O1xuICAgIHZhciB5ID0gdGhpcy55O1xuXG4gICAgcmV0dXJuIE1hdGguc3FydCh4ICogeCArIHkgKiB5KTtcbn07XG5cbi8qKlxuICogQ29weSB0aGUgaW5wdXQgb250byB0aGUgY3VycmVudCBWZWMyLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1ZlYzJ9IHYgVmVjMiB0byBjb3B5XG4gKlxuICogQHJldHVybiB7VmVjMn0gdGhpc1xuICovXG5WZWMyLnByb3RvdHlwZS5jb3B5ID0gZnVuY3Rpb24gY29weSh2KSB7XG4gICAgdGhpcy54ID0gdi54O1xuICAgIHRoaXMueSA9IHYueTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVzZXQgdGhlIGN1cnJlbnQgVmVjMi5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7VmVjMn0gdGhpc1xuICovXG5WZWMyLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uIGNsZWFyKCkge1xuICAgIHRoaXMueCA9IDA7XG4gICAgdGhpcy55ID0gMDtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciB0aGUgbWFnbml0dWRlIG9mIHRoZSBjdXJyZW50IFZlYzIgaXMgZXhhY3RseSAwLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtCb29sZWFufSB3aGV0aGVyIG9yIG5vdCB0aGUgbGVuZ3RoIGlzIDBcbiAqL1xuVmVjMi5wcm90b3R5cGUuaXNaZXJvID0gZnVuY3Rpb24gaXNaZXJvKCkge1xuICAgIGlmICh0aGlzLnggIT09IDAgfHwgdGhpcy55ICE9PSAwKSByZXR1cm4gZmFsc2U7XG4gICAgZWxzZSByZXR1cm4gdHJ1ZTtcbn07XG5cbi8qKlxuICogVGhlIGFycmF5IGZvcm0gb2YgdGhlIGN1cnJlbnQgVmVjMi5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7QXJyYXl9IHRoZSBWZWMgdG8gYXMgYW4gYXJyYXlcbiAqL1xuVmVjMi5wcm90b3R5cGUudG9BcnJheSA9IGZ1bmN0aW9uIHRvQXJyYXkoKSB7XG4gICAgcmV0dXJuIFt0aGlzLngsIHRoaXMueV07XG59O1xuXG4vKipcbiAqIE5vcm1hbGl6ZSB0aGUgaW5wdXQgVmVjMi5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtWZWMyfSB2IFRoZSByZWZlcmVuY2UgVmVjMi5cbiAqIEBwYXJhbSB7VmVjMn0gb3V0cHV0IFZlYzIgaW4gd2hpY2ggdG8gcGxhY2UgdGhlIHJlc3VsdC5cbiAqXG4gKiBAcmV0dXJuIHtWZWMyfSBUaGUgbm9ybWFsaXplZCBWZWMyLlxuICovXG5WZWMyLm5vcm1hbGl6ZSA9IGZ1bmN0aW9uIG5vcm1hbGl6ZSh2LCBvdXRwdXQpIHtcbiAgICB2YXIgeCA9IHYueDtcbiAgICB2YXIgeSA9IHYueTtcblxuICAgIHZhciBsZW5ndGggPSBNYXRoLnNxcnQoeCAqIHggKyB5ICogeSkgfHwgMTtcbiAgICBsZW5ndGggPSAxIC8gbGVuZ3RoO1xuICAgIG91dHB1dC54ID0gdi54ICogbGVuZ3RoO1xuICAgIG91dHB1dC55ID0gdi55ICogbGVuZ3RoO1xuXG4gICAgcmV0dXJuIG91dHB1dDtcbn07XG5cbi8qKlxuICogQ2xvbmUgdGhlIGlucHV0IFZlYzIuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7VmVjMn0gdiBUaGUgVmVjMiB0byBjbG9uZS5cbiAqXG4gKiBAcmV0dXJuIHtWZWMyfSBUaGUgY2xvbmVkIFZlYzIuXG4gKi9cblZlYzIuY2xvbmUgPSBmdW5jdGlvbiBjbG9uZSh2KSB7XG4gICAgcmV0dXJuIG5ldyBWZWMyKHYueCwgdi55KTtcbn07XG5cbi8qKlxuICogQWRkIHRoZSBpbnB1dCBWZWMyJ3MuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7VmVjMn0gdjEgVGhlIGxlZnQgVmVjMi5cbiAqIEBwYXJhbSB7VmVjMn0gdjIgVGhlIHJpZ2h0IFZlYzIuXG4gKiBAcGFyYW0ge1ZlYzJ9IG91dHB1dCBWZWMyIGluIHdoaWNoIHRvIHBsYWNlIHRoZSByZXN1bHQuXG4gKlxuICogQHJldHVybiB7VmVjMn0gVGhlIHJlc3VsdCBvZiB0aGUgYWRkaXRpb24uXG4gKi9cblZlYzIuYWRkID0gZnVuY3Rpb24gYWRkKHYxLCB2Miwgb3V0cHV0KSB7XG4gICAgb3V0cHV0LnggPSB2MS54ICsgdjIueDtcbiAgICBvdXRwdXQueSA9IHYxLnkgKyB2Mi55O1xuXG4gICAgcmV0dXJuIG91dHB1dDtcbn07XG5cbi8qKlxuICogU3VidHJhY3QgdGhlIHNlY29uZCBWZWMyIGZyb20gdGhlIGZpcnN0LlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1ZlYzJ9IHYxIFRoZSBsZWZ0IFZlYzIuXG4gKiBAcGFyYW0ge1ZlYzJ9IHYyIFRoZSByaWdodCBWZWMyLlxuICogQHBhcmFtIHtWZWMyfSBvdXRwdXQgVmVjMiBpbiB3aGljaCB0byBwbGFjZSB0aGUgcmVzdWx0LlxuICpcbiAqIEByZXR1cm4ge1ZlYzJ9IFRoZSByZXN1bHQgb2YgdGhlIHN1YnRyYWN0aW9uLlxuICovXG5WZWMyLnN1YnRyYWN0ID0gZnVuY3Rpb24gc3VidHJhY3QodjEsIHYyLCBvdXRwdXQpIHtcbiAgICBvdXRwdXQueCA9IHYxLnggLSB2Mi54O1xuICAgIG91dHB1dC55ID0gdjEueSAtIHYyLnk7XG4gICAgcmV0dXJuIG91dHB1dDtcbn07XG5cbi8qKlxuICogU2NhbGUgdGhlIGlucHV0IFZlYzIuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7VmVjMn0gdiBUaGUgcmVmZXJlbmNlIFZlYzIuXG4gKiBAcGFyYW0ge051bWJlcn0gcyBOdW1iZXIgdG8gc2NhbGUgYnkuXG4gKiBAcGFyYW0ge1ZlYzJ9IG91dHB1dCBWZWMyIGluIHdoaWNoIHRvIHBsYWNlIHRoZSByZXN1bHQuXG4gKlxuICogQHJldHVybiB7VmVjMn0gVGhlIHJlc3VsdCBvZiB0aGUgc2NhbGluZy5cbiAqL1xuVmVjMi5zY2FsZSA9IGZ1bmN0aW9uIHNjYWxlKHYsIHMsIG91dHB1dCkge1xuICAgIG91dHB1dC54ID0gdi54ICogcztcbiAgICBvdXRwdXQueSA9IHYueSAqIHM7XG4gICAgcmV0dXJuIG91dHB1dDtcbn07XG5cbi8qKlxuICogVGhlIGRvdCBwcm9kdWN0IG9mIHRoZSBpbnB1dCBWZWMyJ3MuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7VmVjMn0gdjEgVGhlIGxlZnQgVmVjMi5cbiAqIEBwYXJhbSB7VmVjMn0gdjIgVGhlIHJpZ2h0IFZlYzIuXG4gKlxuICogQHJldHVybiB7TnVtYmVyfSBUaGUgZG90IHByb2R1Y3QuXG4gKi9cblZlYzIuZG90ID0gZnVuY3Rpb24gZG90KHYxLCB2Mikge1xuICAgIHJldHVybiB2MS54ICogdjIueCArIHYxLnkgKiB2Mi55O1xufTtcblxuLyoqXG4gKiBUaGUgY3Jvc3MgcHJvZHVjdCBvZiB0aGUgaW5wdXQgVmVjMidzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gdjEgVGhlIGxlZnQgVmVjMi5cbiAqIEBwYXJhbSB7TnVtYmVyfSB2MiBUaGUgcmlnaHQgVmVjMi5cbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IFRoZSB6LWNvbXBvbmVudCBvZiB0aGUgY3Jvc3MgcHJvZHVjdC5cbiAqL1xuVmVjMi5jcm9zcyA9IGZ1bmN0aW9uKHYxLHYyKSB7XG4gICAgcmV0dXJuIHYxLnggKiB2Mi55IC0gdjEueSAqIHYyLng7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFZlYzI7XG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBGYW1vdXMgSW5kdXN0cmllcyBJbmMuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQSB0aHJlZS1kaW1lbnNpb25hbCB2ZWN0b3IuXG4gKlxuICogQGNsYXNzIFZlYzNcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0geCBUaGUgeCBjb21wb25lbnQuXG4gKiBAcGFyYW0ge051bWJlcn0geSBUaGUgeSBjb21wb25lbnQuXG4gKiBAcGFyYW0ge051bWJlcn0geiBUaGUgeiBjb21wb25lbnQuXG4gKi9cbnZhciBWZWMzID0gZnVuY3Rpb24oeCAseSwgeil7XG4gICAgdGhpcy54ID0geCB8fCAwO1xuICAgIHRoaXMueSA9IHkgfHwgMDtcbiAgICB0aGlzLnogPSB6IHx8IDA7XG59O1xuXG4vKipcbiAqIFNldCB0aGUgY29tcG9uZW50cyBvZiB0aGUgY3VycmVudCBWZWMzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0geCBUaGUgeCBjb21wb25lbnQuXG4gKiBAcGFyYW0ge051bWJlcn0geSBUaGUgeSBjb21wb25lbnQuXG4gKiBAcGFyYW0ge051bWJlcn0geiBUaGUgeiBjb21wb25lbnQuXG4gKlxuICogQHJldHVybiB7VmVjM30gdGhpc1xuICovXG5WZWMzLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiBzZXQoeCwgeSwgeikge1xuICAgIGlmICh4ICE9IG51bGwpIHRoaXMueCA9IHg7XG4gICAgaWYgKHkgIT0gbnVsbCkgdGhpcy55ID0geTtcbiAgICBpZiAoeiAhPSBudWxsKSB0aGlzLnogPSB6O1xuXG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFkZCB0aGUgaW5wdXQgdiB0byB0aGUgY3VycmVudCBWZWMzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1ZlYzN9IHYgVGhlIFZlYzMgdG8gYWRkLlxuICpcbiAqIEByZXR1cm4ge1ZlYzN9IHRoaXNcbiAqL1xuVmVjMy5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gYWRkKHYpIHtcbiAgICB0aGlzLnggKz0gdi54O1xuICAgIHRoaXMueSArPSB2Lnk7XG4gICAgdGhpcy56ICs9IHYuejtcblxuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBTdWJ0cmFjdCB0aGUgaW5wdXQgdiBmcm9tIHRoZSBjdXJyZW50IFZlYzMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7VmVjM30gdiBUaGUgVmVjMyB0byBzdWJ0cmFjdC5cbiAqXG4gKiBAcmV0dXJuIHtWZWMzfSB0aGlzXG4gKi9cblZlYzMucHJvdG90eXBlLnN1YnRyYWN0ID0gZnVuY3Rpb24gc3VidHJhY3Qodikge1xuICAgIHRoaXMueCAtPSB2Lng7XG4gICAgdGhpcy55IC09IHYueTtcbiAgICB0aGlzLnogLT0gdi56O1xuXG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJvdGF0ZSB0aGUgY3VycmVudCBWZWMzIGJ5IHRoZXRhIGNsb2Nrd2lzZSBhYm91dCB0aGUgeCBheGlzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gdGhldGEgQW5nbGUgYnkgd2hpY2ggdG8gcm90YXRlLlxuICpcbiAqIEByZXR1cm4ge1ZlYzN9IHRoaXNcbiAqL1xuVmVjMy5wcm90b3R5cGUucm90YXRlWCA9IGZ1bmN0aW9uIHJvdGF0ZVgodGhldGEpIHtcbiAgICB2YXIgeSA9IHRoaXMueTtcbiAgICB2YXIgeiA9IHRoaXMuejtcblxuICAgIHZhciBjb3NUaGV0YSA9IE1hdGguY29zKHRoZXRhKTtcbiAgICB2YXIgc2luVGhldGEgPSBNYXRoLnNpbih0aGV0YSk7XG5cbiAgICB0aGlzLnkgPSB5ICogY29zVGhldGEgLSB6ICogc2luVGhldGE7XG4gICAgdGhpcy56ID0geSAqIHNpblRoZXRhICsgeiAqIGNvc1RoZXRhO1xuXG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJvdGF0ZSB0aGUgY3VycmVudCBWZWMzIGJ5IHRoZXRhIGNsb2Nrd2lzZSBhYm91dCB0aGUgeSBheGlzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gdGhldGEgQW5nbGUgYnkgd2hpY2ggdG8gcm90YXRlLlxuICpcbiAqIEByZXR1cm4ge1ZlYzN9IHRoaXNcbiAqL1xuVmVjMy5wcm90b3R5cGUucm90YXRlWSA9IGZ1bmN0aW9uIHJvdGF0ZVkodGhldGEpIHtcbiAgICB2YXIgeCA9IHRoaXMueDtcbiAgICB2YXIgeiA9IHRoaXMuejtcblxuICAgIHZhciBjb3NUaGV0YSA9IE1hdGguY29zKHRoZXRhKTtcbiAgICB2YXIgc2luVGhldGEgPSBNYXRoLnNpbih0aGV0YSk7XG5cbiAgICB0aGlzLnggPSB6ICogc2luVGhldGEgKyB4ICogY29zVGhldGE7XG4gICAgdGhpcy56ID0geiAqIGNvc1RoZXRhIC0geCAqIHNpblRoZXRhO1xuXG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJvdGF0ZSB0aGUgY3VycmVudCBWZWMzIGJ5IHRoZXRhIGNsb2Nrd2lzZSBhYm91dCB0aGUgeiBheGlzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gdGhldGEgQW5nbGUgYnkgd2hpY2ggdG8gcm90YXRlLlxuICpcbiAqIEByZXR1cm4ge1ZlYzN9IHRoaXNcbiAqL1xuVmVjMy5wcm90b3R5cGUucm90YXRlWiA9IGZ1bmN0aW9uIHJvdGF0ZVoodGhldGEpIHtcbiAgICB2YXIgeCA9IHRoaXMueDtcbiAgICB2YXIgeSA9IHRoaXMueTtcblxuICAgIHZhciBjb3NUaGV0YSA9IE1hdGguY29zKHRoZXRhKTtcbiAgICB2YXIgc2luVGhldGEgPSBNYXRoLnNpbih0aGV0YSk7XG5cbiAgICB0aGlzLnggPSB4ICogY29zVGhldGEgLSB5ICogc2luVGhldGE7XG4gICAgdGhpcy55ID0geCAqIHNpblRoZXRhICsgeSAqIGNvc1RoZXRhO1xuXG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFRoZSBkb3QgcHJvZHVjdCBvZiB0aGUgY3VycmVudCBWZWMzIHdpdGggaW5wdXQgVmVjMyB2LlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1ZlYzN9IHYgVGhlIG90aGVyIFZlYzMuXG4gKlxuICogQHJldHVybiB7VmVjM30gdGhpc1xuICovXG5WZWMzLnByb3RvdHlwZS5kb3QgPSBmdW5jdGlvbiBkb3Qodikge1xuICAgIHJldHVybiB0aGlzLngqdi54ICsgdGhpcy55KnYueSArIHRoaXMueip2Lno7XG59O1xuXG4vKipcbiAqIFRoZSBkb3QgcHJvZHVjdCBvZiB0aGUgY3VycmVudCBWZWMzIHdpdGggaW5wdXQgVmVjMyB2LlxuICogU3RvcmVzIHRoZSByZXN1bHQgaW4gdGhlIGN1cnJlbnQgVmVjMy5cbiAqXG4gKiBAbWV0aG9kIGNyb3NzXG4gKlxuICogQHBhcmFtIHtWZWMzfSB2IFRoZSBvdGhlciBWZWMzXG4gKlxuICogQHJldHVybiB7VmVjM30gdGhpc1xuICovXG5WZWMzLnByb3RvdHlwZS5jcm9zcyA9IGZ1bmN0aW9uIGNyb3NzKHYpIHtcbiAgICB2YXIgeCA9IHRoaXMueDtcbiAgICB2YXIgeSA9IHRoaXMueTtcbiAgICB2YXIgeiA9IHRoaXMuejtcblxuICAgIHZhciB2eCA9IHYueDtcbiAgICB2YXIgdnkgPSB2Lnk7XG4gICAgdmFyIHZ6ID0gdi56O1xuXG4gICAgdGhpcy54ID0geSAqIHZ6IC0geiAqIHZ5O1xuICAgIHRoaXMueSA9IHogKiB2eCAtIHggKiB2ejtcbiAgICB0aGlzLnogPSB4ICogdnkgLSB5ICogdng7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFNjYWxlIHRoZSBjdXJyZW50IFZlYzMgYnkgYSBzY2FsYXIuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBzIFRoZSBOdW1iZXIgYnkgd2hpY2ggdG8gc2NhbGVcbiAqXG4gKiBAcmV0dXJuIHtWZWMzfSB0aGlzXG4gKi9cblZlYzMucHJvdG90eXBlLnNjYWxlID0gZnVuY3Rpb24gc2NhbGUocykge1xuICAgIHRoaXMueCAqPSBzO1xuICAgIHRoaXMueSAqPSBzO1xuICAgIHRoaXMueiAqPSBzO1xuXG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFByZXNlcnZlIHRoZSBtYWduaXR1ZGUgYnV0IGludmVydCB0aGUgb3JpZW50YXRpb24gb2YgdGhlIGN1cnJlbnQgVmVjMy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7VmVjM30gdGhpc1xuICovXG5WZWMzLnByb3RvdHlwZS5pbnZlcnQgPSBmdW5jdGlvbiBpbnZlcnQoKSB7XG4gICAgdGhpcy54ID0gLXRoaXMueDtcbiAgICB0aGlzLnkgPSAtdGhpcy55O1xuICAgIHRoaXMueiA9IC10aGlzLno7XG5cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQXBwbHkgYSBmdW5jdGlvbiBjb21wb25lbnQtd2lzZSB0byB0aGUgY3VycmVudCBWZWMzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiBGdW5jdGlvbiB0byBhcHBseS5cbiAqXG4gKiBAcmV0dXJuIHtWZWMzfSB0aGlzXG4gKi9cblZlYzMucHJvdG90eXBlLm1hcCA9IGZ1bmN0aW9uIG1hcChmbikge1xuICAgIHRoaXMueCA9IGZuKHRoaXMueCk7XG4gICAgdGhpcy55ID0gZm4odGhpcy55KTtcbiAgICB0aGlzLnogPSBmbih0aGlzLnopO1xuXG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFRoZSBtYWduaXR1ZGUgb2YgdGhlIGN1cnJlbnQgVmVjMy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7TnVtYmVyfSB0aGUgbWFnbml0dWRlIG9mIHRoZSBWZWMzXG4gKi9cblZlYzMucHJvdG90eXBlLmxlbmd0aCA9IGZ1bmN0aW9uIGxlbmd0aCgpIHtcbiAgICB2YXIgeCA9IHRoaXMueDtcbiAgICB2YXIgeSA9IHRoaXMueTtcbiAgICB2YXIgeiA9IHRoaXMuejtcblxuICAgIHJldHVybiBNYXRoLnNxcnQoeCAqIHggKyB5ICogeSArIHogKiB6KTtcbn07XG5cbi8qKlxuICogVGhlIG1hZ25pdHVkZSBzcXVhcmVkIG9mIHRoZSBjdXJyZW50IFZlYzMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge051bWJlcn0gbWFnbml0dWRlIG9mIHRoZSBWZWMzIHNxdWFyZWRcbiAqL1xuVmVjMy5wcm90b3R5cGUubGVuZ3RoU3EgPSBmdW5jdGlvbiBsZW5ndGhTcSgpIHtcbiAgICB2YXIgeCA9IHRoaXMueDtcbiAgICB2YXIgeSA9IHRoaXMueTtcbiAgICB2YXIgeiA9IHRoaXMuejtcblxuICAgIHJldHVybiB4ICogeCArIHkgKiB5ICsgeiAqIHo7XG59O1xuXG4vKipcbiAqIENvcHkgdGhlIGlucHV0IG9udG8gdGhlIGN1cnJlbnQgVmVjMy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtWZWMzfSB2IFZlYzMgdG8gY29weVxuICpcbiAqIEByZXR1cm4ge1ZlYzN9IHRoaXNcbiAqL1xuVmVjMy5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uIGNvcHkodikge1xuICAgIHRoaXMueCA9IHYueDtcbiAgICB0aGlzLnkgPSB2Lnk7XG4gICAgdGhpcy56ID0gdi56O1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZXNldCB0aGUgY3VycmVudCBWZWMzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtWZWMzfSB0aGlzXG4gKi9cblZlYzMucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24gY2xlYXIoKSB7XG4gICAgdGhpcy54ID0gMDtcbiAgICB0aGlzLnkgPSAwO1xuICAgIHRoaXMueiA9IDA7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgdGhlIG1hZ25pdHVkZSBvZiB0aGUgY3VycmVudCBWZWMzIGlzIGV4YWN0bHkgMC5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7Qm9vbGVhbn0gd2hldGhlciBvciBub3QgdGhlIG1hZ25pdHVkZSBpcyB6ZXJvXG4gKi9cblZlYzMucHJvdG90eXBlLmlzWmVybyA9IGZ1bmN0aW9uIGlzWmVybygpIHtcbiAgICByZXR1cm4gdGhpcy54ID09PSAwICYmIHRoaXMueSA9PT0gMCAmJiB0aGlzLnogPT09IDA7XG59O1xuXG4vKipcbiAqIFRoZSBhcnJheSBmb3JtIG9mIHRoZSBjdXJyZW50IFZlYzMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge0FycmF5fSBhIHRocmVlIGVsZW1lbnQgYXJyYXkgcmVwcmVzZW50aW5nIHRoZSBjb21wb25lbnRzIG9mIHRoZSBWZWMzXG4gKi9cblZlYzMucHJvdG90eXBlLnRvQXJyYXkgPSBmdW5jdGlvbiB0b0FycmF5KCkge1xuICAgIHJldHVybiBbdGhpcy54LCB0aGlzLnksIHRoaXMuel07XG59O1xuXG4vKipcbiAqIFByZXNlcnZlIHRoZSBvcmllbnRhdGlvbiBidXQgY2hhbmdlIHRoZSBsZW5ndGggb2YgdGhlIGN1cnJlbnQgVmVjMyB0byAxLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtWZWMzfSB0aGlzXG4gKi9cblZlYzMucHJvdG90eXBlLm5vcm1hbGl6ZSA9IGZ1bmN0aW9uIG5vcm1hbGl6ZSgpIHtcbiAgICB2YXIgeCA9IHRoaXMueDtcbiAgICB2YXIgeSA9IHRoaXMueTtcbiAgICB2YXIgeiA9IHRoaXMuejtcblxuICAgIHZhciBsZW4gPSBNYXRoLnNxcnQoeCAqIHggKyB5ICogeSArIHogKiB6KSB8fCAxO1xuICAgIGxlbiA9IDEgLyBsZW47XG5cbiAgICB0aGlzLnggKj0gbGVuO1xuICAgIHRoaXMueSAqPSBsZW47XG4gICAgdGhpcy56ICo9IGxlbjtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQXBwbHkgdGhlIHJvdGF0aW9uIGNvcnJlc3BvbmRpbmcgdG8gdGhlIGlucHV0ICh1bml0KSBRdWF0ZXJuaW9uXG4gKiB0byB0aGUgY3VycmVudCBWZWMzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1F1YXRlcm5pb259IHEgVW5pdCBRdWF0ZXJuaW9uIHJlcHJlc2VudGluZyB0aGUgcm90YXRpb24gdG8gYXBwbHlcbiAqXG4gKiBAcmV0dXJuIHtWZWMzfSB0aGlzXG4gKi9cblZlYzMucHJvdG90eXBlLmFwcGx5Um90YXRpb24gPSBmdW5jdGlvbiBhcHBseVJvdGF0aW9uKHEpIHtcbiAgICB2YXIgY3cgPSBxLnc7XG4gICAgdmFyIGN4ID0gLXEueDtcbiAgICB2YXIgY3kgPSAtcS55O1xuICAgIHZhciBjeiA9IC1xLno7XG5cbiAgICB2YXIgdnggPSB0aGlzLng7XG4gICAgdmFyIHZ5ID0gdGhpcy55O1xuICAgIHZhciB2eiA9IHRoaXMuejtcblxuICAgIHZhciB0dyA9IC1jeCAqIHZ4IC0gY3kgKiB2eSAtIGN6ICogdno7XG4gICAgdmFyIHR4ID0gdnggKiBjdyArIHZ5ICogY3ogLSBjeSAqIHZ6O1xuICAgIHZhciB0eSA9IHZ5ICogY3cgKyBjeCAqIHZ6IC0gdnggKiBjejtcbiAgICB2YXIgdHogPSB2eiAqIGN3ICsgdnggKiBjeSAtIGN4ICogdnk7XG5cbiAgICB2YXIgdyA9IGN3O1xuICAgIHZhciB4ID0gLWN4O1xuICAgIHZhciB5ID0gLWN5O1xuICAgIHZhciB6ID0gLWN6O1xuXG4gICAgdGhpcy54ID0gdHggKiB3ICsgeCAqIHR3ICsgeSAqIHR6IC0gdHkgKiB6O1xuICAgIHRoaXMueSA9IHR5ICogdyArIHkgKiB0dyArIHR4ICogeiAtIHggKiB0ejtcbiAgICB0aGlzLnogPSB0eiAqIHcgKyB6ICogdHcgKyB4ICogdHkgLSB0eCAqIHk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFwcGx5IHRoZSBpbnB1dCBNYXQzMyB0aGUgdGhlIGN1cnJlbnQgVmVjMy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtNYXQzM30gbWF0cml4IE1hdDMzIHRvIGFwcGx5XG4gKlxuICogQHJldHVybiB7VmVjM30gdGhpc1xuICovXG5WZWMzLnByb3RvdHlwZS5hcHBseU1hdHJpeCA9IGZ1bmN0aW9uIGFwcGx5TWF0cml4KG1hdHJpeCkge1xuICAgIHZhciBNID0gbWF0cml4LmdldCgpO1xuXG4gICAgdmFyIHggPSB0aGlzLng7XG4gICAgdmFyIHkgPSB0aGlzLnk7XG4gICAgdmFyIHogPSB0aGlzLno7XG5cbiAgICB0aGlzLnggPSBNWzBdKnggKyBNWzFdKnkgKyBNWzJdKno7XG4gICAgdGhpcy55ID0gTVszXSp4ICsgTVs0XSp5ICsgTVs1XSp6O1xuICAgIHRoaXMueiA9IE1bNl0qeCArIE1bN10qeSArIE1bOF0qejtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogTm9ybWFsaXplIHRoZSBpbnB1dCBWZWMzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1ZlYzN9IHYgVGhlIHJlZmVyZW5jZSBWZWMzLlxuICogQHBhcmFtIHtWZWMzfSBvdXRwdXQgVmVjMyBpbiB3aGljaCB0byBwbGFjZSB0aGUgcmVzdWx0LlxuICpcbiAqIEByZXR1cm4ge1ZlYzN9IFRoZSBub3JtYWxpemUgVmVjMy5cbiAqL1xuVmVjMy5ub3JtYWxpemUgPSBmdW5jdGlvbiBub3JtYWxpemUodiwgb3V0cHV0KSB7XG4gICAgdmFyIHggPSB2Lng7XG4gICAgdmFyIHkgPSB2Lnk7XG4gICAgdmFyIHogPSB2Lno7XG5cbiAgICB2YXIgbGVuZ3RoID0gTWF0aC5zcXJ0KHggKiB4ICsgeSAqIHkgKyB6ICogeikgfHwgMTtcbiAgICBsZW5ndGggPSAxIC8gbGVuZ3RoO1xuXG4gICAgb3V0cHV0LnggPSB4ICogbGVuZ3RoO1xuICAgIG91dHB1dC55ID0geSAqIGxlbmd0aDtcbiAgICBvdXRwdXQueiA9IHogKiBsZW5ndGg7XG4gICAgcmV0dXJuIG91dHB1dDtcbn07XG5cbi8qKlxuICogQXBwbHkgYSByb3RhdGlvbiB0byB0aGUgaW5wdXQgVmVjMy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtWZWMzfSB2IFRoZSByZWZlcmVuY2UgVmVjMy5cbiAqIEBwYXJhbSB7UXVhdGVybmlvbn0gcSBVbml0IFF1YXRlcm5pb24gcmVwcmVzZW50aW5nIHRoZSByb3RhdGlvbiB0byBhcHBseS5cbiAqIEBwYXJhbSB7VmVjM30gb3V0cHV0IFZlYzMgaW4gd2hpY2ggdG8gcGxhY2UgdGhlIHJlc3VsdC5cbiAqXG4gKiBAcmV0dXJuIHtWZWMzfSBUaGUgcm90YXRlZCB2ZXJzaW9uIG9mIHRoZSBpbnB1dCBWZWMzLlxuICovXG5WZWMzLmFwcGx5Um90YXRpb24gPSBmdW5jdGlvbiBhcHBseVJvdGF0aW9uKHYsIHEsIG91dHB1dCkge1xuICAgIHZhciBjdyA9IHEudztcbiAgICB2YXIgY3ggPSAtcS54O1xuICAgIHZhciBjeSA9IC1xLnk7XG4gICAgdmFyIGN6ID0gLXEuejtcblxuICAgIHZhciB2eCA9IHYueDtcbiAgICB2YXIgdnkgPSB2Lnk7XG4gICAgdmFyIHZ6ID0gdi56O1xuXG4gICAgdmFyIHR3ID0gLWN4ICogdnggLSBjeSAqIHZ5IC0gY3ogKiB2ejtcbiAgICB2YXIgdHggPSB2eCAqIGN3ICsgdnkgKiBjeiAtIGN5ICogdno7XG4gICAgdmFyIHR5ID0gdnkgKiBjdyArIGN4ICogdnogLSB2eCAqIGN6O1xuICAgIHZhciB0eiA9IHZ6ICogY3cgKyB2eCAqIGN5IC0gY3ggKiB2eTtcblxuICAgIHZhciB3ID0gY3c7XG4gICAgdmFyIHggPSAtY3g7XG4gICAgdmFyIHkgPSAtY3k7XG4gICAgdmFyIHogPSAtY3o7XG5cbiAgICBvdXRwdXQueCA9IHR4ICogdyArIHggKiB0dyArIHkgKiB0eiAtIHR5ICogejtcbiAgICBvdXRwdXQueSA9IHR5ICogdyArIHkgKiB0dyArIHR4ICogeiAtIHggKiB0ejtcbiAgICBvdXRwdXQueiA9IHR6ICogdyArIHogKiB0dyArIHggKiB0eSAtIHR4ICogeTtcbiAgICByZXR1cm4gb3V0cHV0O1xufTtcblxuLyoqXG4gKiBDbG9uZSB0aGUgaW5wdXQgVmVjMy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtWZWMzfSB2IFRoZSBWZWMzIHRvIGNsb25lLlxuICpcbiAqIEByZXR1cm4ge1ZlYzN9IFRoZSBjbG9uZWQgVmVjMy5cbiAqL1xuVmVjMy5jbG9uZSA9IGZ1bmN0aW9uIGNsb25lKHYpIHtcbiAgICByZXR1cm4gbmV3IFZlYzModi54LCB2LnksIHYueik7XG59O1xuXG4vKipcbiAqIEFkZCB0aGUgaW5wdXQgVmVjMydzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1ZlYzN9IHYxIFRoZSBsZWZ0IFZlYzMuXG4gKiBAcGFyYW0ge1ZlYzN9IHYyIFRoZSByaWdodCBWZWMzLlxuICogQHBhcmFtIHtWZWMzfSBvdXRwdXQgVmVjMyBpbiB3aGljaCB0byBwbGFjZSB0aGUgcmVzdWx0LlxuICpcbiAqIEByZXR1cm4ge1ZlYzN9IFRoZSByZXN1bHQgb2YgdGhlIGFkZGl0aW9uLlxuICovXG5WZWMzLmFkZCA9IGZ1bmN0aW9uIGFkZCh2MSwgdjIsIG91dHB1dCkge1xuICAgIG91dHB1dC54ID0gdjEueCArIHYyLng7XG4gICAgb3V0cHV0LnkgPSB2MS55ICsgdjIueTtcbiAgICBvdXRwdXQueiA9IHYxLnogKyB2Mi56O1xuICAgIHJldHVybiBvdXRwdXQ7XG59O1xuXG4vKipcbiAqIFN1YnRyYWN0IHRoZSBzZWNvbmQgVmVjMyBmcm9tIHRoZSBmaXJzdC5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtWZWMzfSB2MSBUaGUgbGVmdCBWZWMzLlxuICogQHBhcmFtIHtWZWMzfSB2MiBUaGUgcmlnaHQgVmVjMy5cbiAqIEBwYXJhbSB7VmVjM30gb3V0cHV0IFZlYzMgaW4gd2hpY2ggdG8gcGxhY2UgdGhlIHJlc3VsdC5cbiAqXG4gKiBAcmV0dXJuIHtWZWMzfSBUaGUgcmVzdWx0IG9mIHRoZSBzdWJ0cmFjdGlvbi5cbiAqL1xuVmVjMy5zdWJ0cmFjdCA9IGZ1bmN0aW9uIHN1YnRyYWN0KHYxLCB2Miwgb3V0cHV0KSB7XG4gICAgb3V0cHV0LnggPSB2MS54IC0gdjIueDtcbiAgICBvdXRwdXQueSA9IHYxLnkgLSB2Mi55O1xuICAgIG91dHB1dC56ID0gdjEueiAtIHYyLno7XG4gICAgcmV0dXJuIG91dHB1dDtcbn07XG5cbi8qKlxuICogU2NhbGUgdGhlIGlucHV0IFZlYzMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7VmVjM30gdiBUaGUgcmVmZXJlbmNlIFZlYzMuXG4gKiBAcGFyYW0ge051bWJlcn0gcyBOdW1iZXIgdG8gc2NhbGUgYnkuXG4gKiBAcGFyYW0ge1ZlYzN9IG91dHB1dCBWZWMzIGluIHdoaWNoIHRvIHBsYWNlIHRoZSByZXN1bHQuXG4gKlxuICogQHJldHVybiB7VmVjM30gVGhlIHJlc3VsdCBvZiB0aGUgc2NhbGluZy5cbiAqL1xuVmVjMy5zY2FsZSA9IGZ1bmN0aW9uIHNjYWxlKHYsIHMsIG91dHB1dCkge1xuICAgIG91dHB1dC54ID0gdi54ICogcztcbiAgICBvdXRwdXQueSA9IHYueSAqIHM7XG4gICAgb3V0cHV0LnogPSB2LnogKiBzO1xuICAgIHJldHVybiBvdXRwdXQ7XG59O1xuXG4vKipcbiAqIFRoZSBkb3QgcHJvZHVjdCBvZiB0aGUgaW5wdXQgVmVjMydzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1ZlYzN9IHYxIFRoZSBsZWZ0IFZlYzMuXG4gKiBAcGFyYW0ge1ZlYzN9IHYyIFRoZSByaWdodCBWZWMzLlxuICpcbiAqIEByZXR1cm4ge051bWJlcn0gVGhlIGRvdCBwcm9kdWN0LlxuICovXG5WZWMzLmRvdCA9IGZ1bmN0aW9uIGRvdCh2MSwgdjIpIHtcbiAgICByZXR1cm4gdjEueCAqIHYyLnggKyB2MS55ICogdjIueSArIHYxLnogKiB2Mi56O1xufTtcblxuLyoqXG4gKiBUaGUgKHJpZ2h0LWhhbmRlZCkgY3Jvc3MgcHJvZHVjdCBvZiB0aGUgaW5wdXQgVmVjMydzLlxuICogdjEgeCB2Mi5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtWZWMzfSB2MSBUaGUgbGVmdCBWZWMzLlxuICogQHBhcmFtIHtWZWMzfSB2MiBUaGUgcmlnaHQgVmVjMy5cbiAqIEBwYXJhbSB7VmVjM30gb3V0cHV0IFZlYzMgaW4gd2hpY2ggdG8gcGxhY2UgdGhlIHJlc3VsdC5cbiAqXG4gKiBAcmV0dXJuIHtPYmplY3R9IHRoZSBvYmplY3QgdGhlIHJlc3VsdCBvZiB0aGUgY3Jvc3MgcHJvZHVjdCB3YXMgcGxhY2VkIGludG9cbiAqL1xuVmVjMy5jcm9zcyA9IGZ1bmN0aW9uIGNyb3NzKHYxLCB2Miwgb3V0cHV0KSB7XG4gICAgdmFyIHgxID0gdjEueDtcbiAgICB2YXIgeTEgPSB2MS55O1xuICAgIHZhciB6MSA9IHYxLno7XG4gICAgdmFyIHgyID0gdjIueDtcbiAgICB2YXIgeTIgPSB2Mi55O1xuICAgIHZhciB6MiA9IHYyLno7XG5cbiAgICBvdXRwdXQueCA9IHkxICogejIgLSB6MSAqIHkyO1xuICAgIG91dHB1dC55ID0gejEgKiB4MiAtIHgxICogejI7XG4gICAgb3V0cHV0LnogPSB4MSAqIHkyIC0geTEgKiB4MjtcbiAgICByZXR1cm4gb3V0cHV0O1xufTtcblxuLyoqXG4gKiBUaGUgcHJvamVjdGlvbiBvZiB2MSBvbnRvIHYyLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1ZlYzN9IHYxIFRoZSBsZWZ0IFZlYzMuXG4gKiBAcGFyYW0ge1ZlYzN9IHYyIFRoZSByaWdodCBWZWMzLlxuICogQHBhcmFtIHtWZWMzfSBvdXRwdXQgVmVjMyBpbiB3aGljaCB0byBwbGFjZSB0aGUgcmVzdWx0LlxuICpcbiAqIEByZXR1cm4ge09iamVjdH0gdGhlIG9iamVjdCB0aGUgcmVzdWx0IG9mIHRoZSBjcm9zcyBwcm9kdWN0IHdhcyBwbGFjZWQgaW50byBcbiAqL1xuVmVjMy5wcm9qZWN0ID0gZnVuY3Rpb24gcHJvamVjdCh2MSwgdjIsIG91dHB1dCkge1xuICAgIHZhciB4MSA9IHYxLng7XG4gICAgdmFyIHkxID0gdjEueTtcbiAgICB2YXIgejEgPSB2MS56O1xuICAgIHZhciB4MiA9IHYyLng7XG4gICAgdmFyIHkyID0gdjIueTtcbiAgICB2YXIgejIgPSB2Mi56O1xuXG4gICAgdmFyIHNjYWxlID0geDEgKiB4MiArIHkxICogeTIgKyB6MSAqIHoyO1xuICAgIHNjYWxlIC89IHgyICogeDIgKyB5MiAqIHkyICsgejIgKiB6MjtcblxuICAgIG91dHB1dC54ID0geDIgKiBzY2FsZTtcbiAgICBvdXRwdXQueSA9IHkyICogc2NhbGU7XG4gICAgb3V0cHV0LnogPSB6MiAqIHNjYWxlO1xuXG4gICAgcmV0dXJuIG91dHB1dDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVmVjMztcbiIsIm1vZHVsZS5leHBvcnRzID0gbm9vcFxuXG5mdW5jdGlvbiBub29wKCkge1xuICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAnWW91IHNob3VsZCBidW5kbGUgeW91ciBjb2RlICcgK1xuICAgICAgJ3VzaW5nIGBnbHNsaWZ5YCBhcyBhIHRyYW5zZm9ybS4nXG4gIClcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gcHJvZ3JhbWlmeVxuXG5mdW5jdGlvbiBwcm9ncmFtaWZ5KHZlcnRleCwgZnJhZ21lbnQsIHVuaWZvcm1zLCBhdHRyaWJ1dGVzKSB7XG4gIHJldHVybiB7XG4gICAgdmVydGV4OiB2ZXJ0ZXgsIFxuICAgIGZyYWdtZW50OiBmcmFnbWVudCxcbiAgICB1bmlmb3JtczogdW5pZm9ybXMsIFxuICAgIGF0dHJpYnV0ZXM6IGF0dHJpYnV0ZXNcbiAgfTtcbn1cbiIsIi8vIGh0dHA6Ly9wYXVsaXJpc2guY29tLzIwMTEvcmVxdWVzdGFuaW1hdGlvbmZyYW1lLWZvci1zbWFydC1hbmltYXRpbmcvXG4vLyBodHRwOi8vbXkub3BlcmEuY29tL2Vtb2xsZXIvYmxvZy8yMDExLzEyLzIwL3JlcXVlc3RhbmltYXRpb25mcmFtZS1mb3Itc21hcnQtZXItYW5pbWF0aW5nXG4vLyByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgcG9seWZpbGwgYnkgRXJpayBNw7ZsbGVyLiBmaXhlcyBmcm9tIFBhdWwgSXJpc2ggYW5kIFRpbm8gWmlqZGVsXG4vLyBNSVQgbGljZW5zZVxuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBsYXN0VGltZSA9IDA7XG52YXIgdmVuZG9ycyA9IFsnbXMnLCAnbW96JywgJ3dlYmtpdCcsICdvJ107XG5cbnZhciByQUYsIGNBRjtcblxuaWYgKHR5cGVvZiB3aW5kb3cgPT09ICdvYmplY3QnKSB7XG4gICAgckFGID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZTtcbiAgICBjQUYgPSB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgfHwgd2luZG93LmNhbmNlbFJlcXVlc3RBbmltYXRpb25GcmFtZTtcbiAgICBmb3IgKHZhciB4ID0gMDsgeCA8IHZlbmRvcnMubGVuZ3RoICYmICFyQUY7ICsreCkge1xuICAgICAgICByQUYgPSB3aW5kb3dbdmVuZG9yc1t4XSArICdSZXF1ZXN0QW5pbWF0aW9uRnJhbWUnXTtcbiAgICAgICAgY0FGID0gd2luZG93W3ZlbmRvcnNbeF0gKyAnQ2FuY2VsUmVxdWVzdEFuaW1hdGlvbkZyYW1lJ10gfHxcbiAgICAgICAgICAgICAgd2luZG93W3ZlbmRvcnNbeF0gKyAnQ2FuY2VsQW5pbWF0aW9uRnJhbWUnXTtcbiAgICB9XG5cbiAgICBpZiAockFGICYmICFjQUYpIHtcbiAgICAgICAgLy8gY0FGIG5vdCBzdXBwb3J0ZWQuXG4gICAgICAgIC8vIEZhbGwgYmFjayB0byBzZXRJbnRlcnZhbCBmb3Igbm93ICh2ZXJ5IHJhcmUpLlxuICAgICAgICByQUYgPSBudWxsO1xuICAgIH1cbn1cblxuaWYgKCFyQUYpIHtcbiAgICB2YXIgbm93ID0gRGF0ZS5ub3cgPyBEYXRlLm5vdyA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgIH07XG5cbiAgICByQUYgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICB2YXIgY3VyclRpbWUgPSBub3coKTtcbiAgICAgICAgdmFyIHRpbWVUb0NhbGwgPSBNYXRoLm1heCgwLCAxNiAtIChjdXJyVGltZSAtIGxhc3RUaW1lKSk7XG4gICAgICAgIHZhciBpZCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2FsbGJhY2soY3VyclRpbWUgKyB0aW1lVG9DYWxsKTtcbiAgICAgICAgfSwgdGltZVRvQ2FsbCk7XG4gICAgICAgIGxhc3RUaW1lID0gY3VyclRpbWUgKyB0aW1lVG9DYWxsO1xuICAgICAgICByZXR1cm4gaWQ7XG4gICAgfTtcblxuICAgIGNBRiA9IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICBjbGVhclRpbWVvdXQoaWQpO1xuICAgIH07XG59XG5cbnZhciBhbmltYXRpb25GcmFtZSA9IHtcbiAgICAvKipcbiAgICAgKiBDcm9zcyBicm93c2VyIHZlcnNpb24gb2YgW3JlcXVlc3RBbmltYXRpb25GcmFtZV17QGxpbmsgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL3dpbmRvdy9yZXF1ZXN0QW5pbWF0aW9uRnJhbWV9LlxuICAgICAqXG4gICAgICogVXNlZCBieSBFbmdpbmUgaW4gb3JkZXIgdG8gZXN0YWJsaXNoIGEgcmVuZGVyIGxvb3AuXG4gICAgICpcbiAgICAgKiBJZiBubyAodmVuZG9yIHByZWZpeGVkIHZlcnNpb24gb2YpIGByZXF1ZXN0QW5pbWF0aW9uRnJhbWVgIGlzIGF2YWlsYWJsZSxcbiAgICAgKiBgc2V0VGltZW91dGAgd2lsbCBiZSB1c2VkIGluIG9yZGVyIHRvIGVtdWxhdGUgYSByZW5kZXIgbG9vcCBydW5uaW5nIGF0XG4gICAgICogYXBwcm94aW1hdGVseSA2MCBmcmFtZXMgcGVyIHNlY29uZC5cbiAgICAgKlxuICAgICAqIEBtZXRob2QgIHJlcXVlc3RBbmltYXRpb25GcmFtZVxuICAgICAqXG4gICAgICogQHBhcmFtICAge0Z1bmN0aW9ufSAgY2FsbGJhY2sgZnVuY3Rpb24gdG8gYmUgaW52b2tlZCBvbiB0aGUgbmV4dCBmcmFtZS5cbiAgICAgKiBAcmV0dXJuICB7TnVtYmVyfSAgICByZXF1ZXN0SWQgdG8gYmUgdXNlZCB0byBjYW5jZWwgdGhlIHJlcXVlc3QgdXNpbmdcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICB7QGxpbmsgY2FuY2VsQW5pbWF0aW9uRnJhbWV9LlxuICAgICAqL1xuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZTogckFGLFxuXG4gICAgLyoqXG4gICAgICogQ3Jvc3MgYnJvd3NlciB2ZXJzaW9uIG9mIFtjYW5jZWxBbmltYXRpb25GcmFtZV17QGxpbmsgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL3dpbmRvdy9jYW5jZWxBbmltYXRpb25GcmFtZX0uXG4gICAgICpcbiAgICAgKiBDYW5jZWxzIGEgcHJldmlvdXNseSB1c2luZyBbcmVxdWVzdEFuaW1hdGlvbkZyYW1lXXtAbGluayBhbmltYXRpb25GcmFtZSNyZXF1ZXN0QW5pbWF0aW9uRnJhbWV9XG4gICAgICogc2NoZWR1bGVkIHJlcXVlc3QuXG4gICAgICpcbiAgICAgKiBVc2VkIGZvciBpbW1lZGlhdGVseSBzdG9wcGluZyB0aGUgcmVuZGVyIGxvb3Agd2l0aGluIHRoZSBFbmdpbmUuXG4gICAgICpcbiAgICAgKiBAbWV0aG9kICBjYW5jZWxBbmltYXRpb25GcmFtZVxuICAgICAqXG4gICAgICogQHBhcmFtICAge051bWJlcn0gICAgcmVxdWVzdElkIG9mIHRoZSBzY2hlZHVsZWQgY2FsbGJhY2sgZnVuY3Rpb25cbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICByZXR1cm5lZCBieSBbcmVxdWVzdEFuaW1hdGlvbkZyYW1lXXtAbGluayBhbmltYXRpb25GcmFtZSNyZXF1ZXN0QW5pbWF0aW9uRnJhbWV9LlxuICAgICAqL1xuICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lOiBjQUZcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gYW5pbWF0aW9uRnJhbWU7XG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICogXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICogXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKiBcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqIFxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWU6IHJlcXVpcmUoJy4vYW5pbWF0aW9uRnJhbWUnKS5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUsXG4gICAgY2FuY2VsQW5pbWF0aW9uRnJhbWU6IHJlcXVpcmUoJy4vYW5pbWF0aW9uRnJhbWUnKS5jYW5jZWxBbmltYXRpb25GcmFtZVxufTtcbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIHBvbHlmaWxscyA9IHJlcXVpcmUoJy4uL3BvbHlmaWxscycpO1xudmFyIHJBRiA9IHBvbHlmaWxscy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWU7XG52YXIgY0FGID0gcG9seWZpbGxzLmNhbmNlbEFuaW1hdGlvbkZyYW1lO1xuXG4vKipcbiAqIEJvb2xlYW4gY29uc3RhbnQgaW5kaWNhdGluZyB3aGV0aGVyIHRoZSBSZXF1ZXN0QW5pbWF0aW9uRnJhbWVMb29wIGhhcyBhY2Nlc3NcbiAqIHRvIHRoZSBkb2N1bWVudC4gVGhlIGRvY3VtZW50IGlzIGJlaW5nIHVzZWQgaW4gb3JkZXIgdG8gc3Vic2NyaWJlIGZvclxuICogdmlzaWJpbGl0eWNoYW5nZSBldmVudHMgdXNlZCBmb3Igbm9ybWFsaXppbmcgdGhlIFJlcXVlc3RBbmltYXRpb25GcmFtZUxvb3BcbiAqIHRpbWUgd2hlbiBlLmcuIHdoZW4gc3dpdGNoaW5nIHRhYnMuXG4gKlxuICogQGNvbnN0YW50XG4gKiBAdHlwZSB7Qm9vbGVhbn1cbiAqL1xudmFyIERPQ1VNRU5UX0FDQ0VTUyA9IHR5cGVvZiBkb2N1bWVudCAhPT0gJ3VuZGVmaW5lZCc7XG5cbmlmIChET0NVTUVOVF9BQ0NFU1MpIHtcbiAgICB2YXIgVkVORE9SX0hJRERFTiwgVkVORE9SX1ZJU0lCSUxJVFlfQ0hBTkdFO1xuXG4gICAgLy8gT3BlcmEgMTIuMTAgYW5kIEZpcmVmb3ggMTggYW5kIGxhdGVyIHN1cHBvcnRcbiAgICBpZiAodHlwZW9mIGRvY3VtZW50LmhpZGRlbiAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgVkVORE9SX0hJRERFTiA9ICdoaWRkZW4nO1xuICAgICAgICBWRU5ET1JfVklTSUJJTElUWV9DSEFOR0UgPSAndmlzaWJpbGl0eWNoYW5nZSc7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBkb2N1bWVudC5tb3pIaWRkZW4gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIFZFTkRPUl9ISURERU4gPSAnbW96SGlkZGVuJztcbiAgICAgICAgVkVORE9SX1ZJU0lCSUxJVFlfQ0hBTkdFID0gJ21venZpc2liaWxpdHljaGFuZ2UnO1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgZG9jdW1lbnQubXNIaWRkZW4gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIFZFTkRPUl9ISURERU4gPSAnbXNIaWRkZW4nO1xuICAgICAgICBWRU5ET1JfVklTSUJJTElUWV9DSEFOR0UgPSAnbXN2aXNpYmlsaXR5Y2hhbmdlJztcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIGRvY3VtZW50LndlYmtpdEhpZGRlbiAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgVkVORE9SX0hJRERFTiA9ICd3ZWJraXRIaWRkZW4nO1xuICAgICAgICBWRU5ET1JfVklTSUJJTElUWV9DSEFOR0UgPSAnd2Via2l0dmlzaWJpbGl0eWNoYW5nZSc7XG4gICAgfVxufVxuXG4vKipcbiAqIFJlcXVlc3RBbmltYXRpb25GcmFtZUxvb3AgY2xhc3MgdXNlZCBmb3IgdXBkYXRpbmcgb2JqZWN0cyBvbiBhIGZyYW1lLWJ5LWZyYW1lLlxuICogU3luY2hyb25pemVzIHRoZSBgdXBkYXRlYCBtZXRob2QgaW52b2NhdGlvbnMgdG8gdGhlIHJlZnJlc2ggcmF0ZSBvZiB0aGVcbiAqIHNjcmVlbi4gTWFuYWdlcyB0aGUgYHJlcXVlc3RBbmltYXRpb25GcmFtZWAtbG9vcCBieSBub3JtYWxpemluZyB0aGUgcGFzc2VkIGluXG4gKiB0aW1lc3RhbXAgd2hlbiBzd2l0Y2hpbmcgdGFicy5cbiAqXG4gKiBAY2xhc3MgUmVxdWVzdEFuaW1hdGlvbkZyYW1lTG9vcFxuICovXG5mdW5jdGlvbiBSZXF1ZXN0QW5pbWF0aW9uRnJhbWVMb29wKCkge1xuICAgIHZhciBfdGhpcyA9IHRoaXM7XG5cbiAgICAvLyBSZWZlcmVuY2VzIHRvIG9iamVjdHMgdG8gYmUgdXBkYXRlZCBvbiBuZXh0IGZyYW1lLlxuICAgIHRoaXMuX3VwZGF0ZXMgPSBbXTtcblxuICAgIHRoaXMuX2xvb3BlciA9IGZ1bmN0aW9uKHRpbWUpIHtcbiAgICAgICAgX3RoaXMubG9vcCh0aW1lKTtcbiAgICB9O1xuICAgIHRoaXMuX3RpbWUgPSAwO1xuICAgIHRoaXMuX3N0b3BwZWRBdCA9IDA7XG4gICAgdGhpcy5fc2xlZXAgPSAwO1xuXG4gICAgLy8gSW5kaWNhdGVzIHdoZXRoZXIgdGhlIGVuZ2luZSBzaG91bGQgYmUgcmVzdGFydGVkIHdoZW4gdGhlIHRhYi8gd2luZG93IGlzXG4gICAgLy8gYmVpbmcgZm9jdXNlZCBhZ2FpbiAodmlzaWJpbGl0eSBjaGFuZ2UpLlxuICAgIHRoaXMuX3N0YXJ0T25WaXNpYmlsaXR5Q2hhbmdlID0gdHJ1ZTtcblxuICAgIC8vIHJlcXVlc3RJZCBhcyByZXR1cm5lZCBieSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgZnVuY3Rpb247XG4gICAgdGhpcy5fckFGID0gbnVsbDtcblxuICAgIHRoaXMuX3NsZWVwRGlmZiA9IHRydWU7XG5cbiAgICAvLyBUaGUgZW5naW5lIGlzIGJlaW5nIHN0YXJ0ZWQgb24gaW5zdGFudGlhdGlvbi5cbiAgICAvLyBUT0RPKGFsZXhhbmRlckd1Z2VsKVxuICAgIHRoaXMuc3RhcnQoKTtcblxuICAgIC8vIFRoZSBSZXF1ZXN0QW5pbWF0aW9uRnJhbWVMb29wIHN1cHBvcnRzIHJ1bm5pbmcgaW4gYSBub24tYnJvd3NlclxuICAgIC8vIGVudmlyb25tZW50IChlLmcuIFdvcmtlcikuXG4gICAgaWYgKERPQ1VNRU5UX0FDQ0VTUykge1xuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFZFTkRPUl9WSVNJQklMSVRZX0NIQU5HRSwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBfdGhpcy5fb25WaXNpYmlsaXR5Q2hhbmdlKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuLyoqXG4gKiBIYW5kbGUgdGhlIHN3aXRjaGluZyBvZiB0YWJzLlxuICpcbiAqIEBtZXRob2RcbiAqIEBwcml2YXRlXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuUmVxdWVzdEFuaW1hdGlvbkZyYW1lTG9vcC5wcm90b3R5cGUuX29uVmlzaWJpbGl0eUNoYW5nZSA9IGZ1bmN0aW9uIF9vblZpc2liaWxpdHlDaGFuZ2UoKSB7XG4gICAgaWYgKGRvY3VtZW50W1ZFTkRPUl9ISURERU5dKSB7XG4gICAgICAgIHRoaXMuX29uVW5mb2N1cygpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdGhpcy5fb25Gb2N1cygpO1xuICAgIH1cbn07XG5cbi8qKlxuICogSW50ZXJuYWwgaGVscGVyIGZ1bmN0aW9uIHRvIGJlIGludm9rZWQgYXMgc29vbiBhcyB0aGUgd2luZG93LyB0YWIgaXMgYmVpbmdcbiAqIGZvY3VzZWQgYWZ0ZXIgYSB2aXNpYmlsdGl5IGNoYW5nZS5cbiAqXG4gKiBAbWV0aG9kXG4gKiBAcHJpdmF0ZVxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cblJlcXVlc3RBbmltYXRpb25GcmFtZUxvb3AucHJvdG90eXBlLl9vbkZvY3VzID0gZnVuY3Rpb24gX29uRm9jdXMoKSB7XG4gICAgaWYgKHRoaXMuX3N0YXJ0T25WaXNpYmlsaXR5Q2hhbmdlKSB7XG4gICAgICAgIHRoaXMuX3N0YXJ0KCk7XG4gICAgfVxufTtcblxuLyoqXG4gKiBJbnRlcm5hbCBoZWxwZXIgZnVuY3Rpb24gdG8gYmUgaW52b2tlZCBhcyBzb29uIGFzIHRoZSB3aW5kb3cvIHRhYiBpcyBiZWluZ1xuICogdW5mb2N1c2VkIChoaWRkZW4pIGFmdGVyIGEgdmlzaWJpbHRpeSBjaGFuZ2UuXG4gKlxuICogQG1ldGhvZCAgX29uRm9jdXNcbiAqIEBwcml2YXRlXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuUmVxdWVzdEFuaW1hdGlvbkZyYW1lTG9vcC5wcm90b3R5cGUuX29uVW5mb2N1cyA9IGZ1bmN0aW9uIF9vblVuZm9jdXMoKSB7XG4gICAgdGhpcy5fc3RvcCgpO1xufTtcblxuLyoqXG4gKiBTdGFydHMgdGhlIFJlcXVlc3RBbmltYXRpb25GcmFtZUxvb3AuIFdoZW4gc3dpdGNoaW5nIHRvIGEgZGlmZmVybnQgdGFiL1xuICogd2luZG93IChjaGFuZ2luZyB0aGUgdmlzaWJpbHRpeSksIHRoZSBlbmdpbmUgd2lsbCBiZSByZXRhcnRlZCB3aGVuIHN3aXRjaGluZ1xuICogYmFjayB0byBhIHZpc2libGUgc3RhdGUuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge1JlcXVlc3RBbmltYXRpb25GcmFtZUxvb3B9IHRoaXNcbiAqL1xuUmVxdWVzdEFuaW1hdGlvbkZyYW1lTG9vcC5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbiBzdGFydCgpIHtcbiAgICBpZiAoIXRoaXMuX3J1bm5pbmcpIHtcbiAgICAgICAgdGhpcy5fc3RhcnRPblZpc2liaWxpdHlDaGFuZ2UgPSB0cnVlO1xuICAgICAgICB0aGlzLl9zdGFydCgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogSW50ZXJuYWwgdmVyc2lvbiBvZiBSZXF1ZXN0QW5pbWF0aW9uRnJhbWVMb29wJ3Mgc3RhcnQgZnVuY3Rpb24sIG5vdCBhZmZlY3RpbmdcbiAqIGJlaGF2aW9yIG9uIHZpc2liaWx0eSBjaGFuZ2UuXG4gKlxuICogQG1ldGhvZFxuICogQHByaXZhdGVcbipcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cblJlcXVlc3RBbmltYXRpb25GcmFtZUxvb3AucHJvdG90eXBlLl9zdGFydCA9IGZ1bmN0aW9uIF9zdGFydCgpIHtcbiAgICB0aGlzLl9ydW5uaW5nID0gdHJ1ZTtcbiAgICB0aGlzLl9zbGVlcERpZmYgPSB0cnVlO1xuICAgIHRoaXMuX3JBRiA9IHJBRih0aGlzLl9sb29wZXIpO1xufTtcblxuLyoqXG4gKiBTdG9wcyB0aGUgUmVxdWVzdEFuaW1hdGlvbkZyYW1lTG9vcC5cbiAqXG4gKiBAbWV0aG9kXG4gKiBAcHJpdmF0ZVxuICpcbiAqIEByZXR1cm4ge1JlcXVlc3RBbmltYXRpb25GcmFtZUxvb3B9IHRoaXNcbiAqL1xuUmVxdWVzdEFuaW1hdGlvbkZyYW1lTG9vcC5wcm90b3R5cGUuc3RvcCA9IGZ1bmN0aW9uIHN0b3AoKSB7XG4gICAgaWYgKHRoaXMuX3J1bm5pbmcpIHtcbiAgICAgICAgdGhpcy5fc3RhcnRPblZpc2liaWxpdHlDaGFuZ2UgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fc3RvcCgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogSW50ZXJuYWwgdmVyc2lvbiBvZiBSZXF1ZXN0QW5pbWF0aW9uRnJhbWVMb29wJ3Mgc3RvcCBmdW5jdGlvbiwgbm90IGFmZmVjdGluZ1xuICogYmVoYXZpb3Igb24gdmlzaWJpbHR5IGNoYW5nZS5cbiAqXG4gKiBAbWV0aG9kXG4gKiBAcHJpdmF0ZVxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cblJlcXVlc3RBbmltYXRpb25GcmFtZUxvb3AucHJvdG90eXBlLl9zdG9wID0gZnVuY3Rpb24gX3N0b3AoKSB7XG4gICAgdGhpcy5fcnVubmluZyA9IGZhbHNlO1xuICAgIHRoaXMuX3N0b3BwZWRBdCA9IHRoaXMuX3RpbWU7XG5cbiAgICAvLyBCdWcgaW4gb2xkIHZlcnNpb25zIG9mIEZ4LiBFeHBsaWNpdGx5IGNhbmNlbC5cbiAgICBjQUYodGhpcy5fckFGKTtcbn07XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGV0aGVyIHRoZSBSZXF1ZXN0QW5pbWF0aW9uRnJhbWVMb29wIGlzIGN1cnJlbnRseSBydW5uaW5nIG9yIG5vdC5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7Qm9vbGVhbn0gYm9vbGVhbiB2YWx1ZSBpbmRpY2F0aW5nIHdoZXRoZXIgdGhlXG4gKiBSZXF1ZXN0QW5pbWF0aW9uRnJhbWVMb29wIGlzIGN1cnJlbnRseSBydW5uaW5nIG9yIG5vdFxuICovXG5SZXF1ZXN0QW5pbWF0aW9uRnJhbWVMb29wLnByb3RvdHlwZS5pc1J1bm5pbmcgPSBmdW5jdGlvbiBpc1J1bm5pbmcoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3J1bm5pbmc7XG59O1xuXG4vKipcbiAqIFVwZGF0ZXMgYWxsIHJlZ2lzdGVyZWQgb2JqZWN0cy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHRpbWUgaGlnaCByZXNvbHV0aW9uIHRpbXN0YW1wIHVzZWQgZm9yIGludm9raW5nIHRoZSBgdXBkYXRlYFxuICogbWV0aG9kIG9uIGFsbCByZWdpc3RlcmVkIG9iamVjdHNcbiAqXG4gKiBAcmV0dXJuIHtSZXF1ZXN0QW5pbWF0aW9uRnJhbWVMb29wfSB0aGlzXG4gKi9cblJlcXVlc3RBbmltYXRpb25GcmFtZUxvb3AucHJvdG90eXBlLnN0ZXAgPSBmdW5jdGlvbiBzdGVwICh0aW1lKSB7XG4gICAgdGhpcy5fdGltZSA9IHRpbWU7XG4gICAgaWYgKHRoaXMuX3NsZWVwRGlmZikge1xuICAgICAgICB0aGlzLl9zbGVlcCArPSB0aW1lIC0gdGhpcy5fc3RvcHBlZEF0O1xuICAgICAgICB0aGlzLl9zbGVlcERpZmYgPSBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBUaGUgc2FtZSB0aW1ldGFtcCB3aWxsIGJlIGVtaXR0ZWQgaW1tZWRpYXRlbHkgYmVmb3JlIGFuZCBhZnRlciB2aXNpYmlsaXR5XG4gICAgLy8gY2hhbmdlLlxuICAgIHZhciBub3JtYWxpemVkVGltZSA9IHRpbWUgLSB0aGlzLl9zbGVlcDtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gdGhpcy5fdXBkYXRlcy5sZW5ndGggOyBpIDwgbGVuIDsgaSsrKSB7XG4gICAgICAgIHRoaXMuX3VwZGF0ZXNbaV0udXBkYXRlKG5vcm1hbGl6ZWRUaW1lKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIE1ldGhvZCBiZWluZyBjYWxsZWQgYnkgYHJlcXVlc3RBbmltYXRpb25GcmFtZWAgb24gZXZlcnkgcGFpbnQuIEluZGlyZWN0bHlcbiAqIHJlY3Vyc2l2ZSBieSBzY2hlZHVsaW5nIGEgZnV0dXJlIGludm9jYXRpb24gb2YgaXRzZWxmIG9uIHRoZSBuZXh0IHBhaW50LlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gdGltZSBoaWdoIHJlc29sdXRpb24gdGltc3RhbXAgdXNlZCBmb3IgaW52b2tpbmcgdGhlIGB1cGRhdGVgXG4gKiBtZXRob2Qgb24gYWxsIHJlZ2lzdGVyZWQgb2JqZWN0c1xuICogQHJldHVybiB7UmVxdWVzdEFuaW1hdGlvbkZyYW1lTG9vcH0gdGhpc1xuICovXG5SZXF1ZXN0QW5pbWF0aW9uRnJhbWVMb29wLnByb3RvdHlwZS5sb29wID0gZnVuY3Rpb24gbG9vcCh0aW1lKSB7XG4gICAgdGhpcy5zdGVwKHRpbWUpO1xuICAgIHRoaXMuX3JBRiA9IHJBRih0aGlzLl9sb29wZXIpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBSZWdpc3RlcmVzIGFuIHVwZGF0ZWFibGUgb2JqZWN0IHdoaWNoIGB1cGRhdGVgIG1ldGhvZCBzaG91bGQgYmUgaW52b2tlZCBvblxuICogZXZlcnkgcGFpbnQsIHN0YXJ0aW5nIG9uIHRoZSBuZXh0IHBhaW50IChhc3N1bWluZyB0aGVcbiAqIFJlcXVlc3RBbmltYXRpb25GcmFtZUxvb3AgaXMgcnVubmluZykuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSB1cGRhdGVhYmxlIG9iamVjdCB0byBiZSB1cGRhdGVkXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSB1cGRhdGVhYmxlLnVwZGF0ZSB1cGRhdGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIG9uIHRoZVxuICogcmVnaXN0ZXJlZCBvYmplY3RcbiAqXG4gKiBAcmV0dXJuIHtSZXF1ZXN0QW5pbWF0aW9uRnJhbWVMb29wfSB0aGlzXG4gKi9cblJlcXVlc3RBbmltYXRpb25GcmFtZUxvb3AucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uIHVwZGF0ZSh1cGRhdGVhYmxlKSB7XG4gICAgaWYgKHRoaXMuX3VwZGF0ZXMuaW5kZXhPZih1cGRhdGVhYmxlKSA9PT0gLTEpIHtcbiAgICAgICAgdGhpcy5fdXBkYXRlcy5wdXNoKHVwZGF0ZWFibGUpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogRGVyZWdpc3RlcnMgYW4gdXBkYXRlYWJsZSBvYmplY3QgcHJldmlvdXNseSByZWdpc3RlcmVkIHVzaW5nIGB1cGRhdGVgIHRvIGJlXG4gKiBubyBsb25nZXIgdXBkYXRlZC5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHVwZGF0ZWFibGUgdXBkYXRlYWJsZSBvYmplY3QgcHJldmlvdXNseSByZWdpc3RlcmVkIHVzaW5nXG4gKiBgdXBkYXRlYFxuICpcbiAqIEByZXR1cm4ge1JlcXVlc3RBbmltYXRpb25GcmFtZUxvb3B9IHRoaXNcbiAqL1xuUmVxdWVzdEFuaW1hdGlvbkZyYW1lTG9vcC5wcm90b3R5cGUubm9Mb25nZXJVcGRhdGUgPSBmdW5jdGlvbiBub0xvbmdlclVwZGF0ZSh1cGRhdGVhYmxlKSB7XG4gICAgdmFyIGluZGV4ID0gdGhpcy5fdXBkYXRlcy5pbmRleE9mKHVwZGF0ZWFibGUpO1xuICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgIHRoaXMuX3VwZGF0ZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlcXVlc3RBbmltYXRpb25GcmFtZUxvb3A7XG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBGYW1vdXMgSW5kdXN0cmllcyBJbmMuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBDb250ZXh0ID0gcmVxdWlyZSgnLi9Db250ZXh0Jyk7XG52YXIgaW5qZWN0Q1NTID0gcmVxdWlyZSgnLi9pbmplY3QtY3NzJyk7XG5cbi8qKlxuICogSW5zdGFudGlhdGVzIGEgbmV3IENvbXBvc2l0b3IuXG4gKiBUaGUgQ29tcG9zaXRvciByZWNlaXZlcyBkcmF3IGNvbW1hbmRzIGZybSB0aGUgVUlNYW5hZ2VyIGFuZCByb3V0ZXMgdGhlIHRvIHRoZVxuICogcmVzcGVjdGl2ZSBjb250ZXh0IG9iamVjdHMuXG4gKlxuICogVXBvbiBjcmVhdGlvbiwgaXQgaW5qZWN0cyBhIHN0eWxlc2hlZXQgdXNlZCBmb3Igc3R5bGluZyB0aGUgaW5kaXZpZHVhbFxuICogcmVuZGVyZXJzIHVzZWQgaW4gdGhlIGNvbnRleHQgb2JqZWN0cy5cbiAqXG4gKiBAY2xhc3MgQ29tcG9zaXRvclxuICogQGNvbnN0cnVjdG9yXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5mdW5jdGlvbiBDb21wb3NpdG9yKCkge1xuICAgIGluamVjdENTUygpO1xuXG4gICAgdGhpcy5fY29udGV4dHMgPSB7fTtcbiAgICB0aGlzLl9vdXRDb21tYW5kcyA9IFtdO1xuICAgIHRoaXMuX2luQ29tbWFuZHMgPSBbXTtcbiAgICB0aGlzLl90aW1lID0gbnVsbDtcblxuICAgIHRoaXMuX3Jlc2l6ZWQgPSBmYWxzZTtcblxuICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICBfdGhpcy5fcmVzaXplZCA9IHRydWU7XG4gICAgfSk7XG59XG5cbi8qKlxuICogUmV0cmlldmVzIHRoZSB0aW1lIGJlaW5nIHVzZWQgYnkgdGhlIGludGVybmFsIGNsb2NrIG1hbmFnZWQgYnlcbiAqIGBGYW1vdXNFbmdpbmVgLlxuICpcbiAqIFRoZSB0aW1lIGlzIGJlaW5nIHBhc3NlZCBpbnRvIGNvcmUgYnkgdGhlIEVuZ2luZSB0aHJvdWdoIHRoZSBVSU1hbmFnZXIuXG4gKiBTaW5jZSBjb3JlIGhhcyB0aGUgYWJpbGl0eSB0byBzY2FsZSB0aGUgdGltZSwgdGhlIHRpbWUgbmVlZHMgdG8gYmUgcGFzc2VkXG4gKiBiYWNrIHRvIHRoZSByZW5kZXJpbmcgc3lzdGVtLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IHRpbWUgVGhlIGNsb2NrIHRpbWUgdXNlZCBpbiBjb3JlLlxuICovXG5Db21wb3NpdG9yLnByb3RvdHlwZS5nZXRUaW1lID0gZnVuY3Rpb24gZ2V0VGltZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fdGltZTtcbn07XG5cbi8qKlxuICogU2NoZWR1bGVzIGFuIGV2ZW50IHRvIGJlIHNlbnQgdGhlIG5leHQgdGltZSB0aGUgb3V0IGNvbW1hbmQgcXVldWUgaXMgYmVpbmdcbiAqIGZsdXNoZWQuXG4gKlxuICogQG1ldGhvZFxuICogQHByaXZhdGVcbiAqXG4gKiBAcGFyYW0gIHtTdHJpbmd9IHBhdGggUmVuZGVyIHBhdGggdG8gdGhlIG5vZGUgdGhlIGV2ZW50IHNob3VsZCBiZSB0cmlnZ2VyZWRcbiAqIG9uICgqdGFyZ2V0ZWQgZXZlbnQqKVxuICogQHBhcmFtICB7U3RyaW5nfSBldiBFdmVudCB0eXBlXG4gKiBAcGFyYW0gIHtPYmplY3R9IHBheWxvYWQgRXZlbnQgb2JqZWN0IChzZXJpYWxpemFibGUgdXNpbmcgc3RydWN0dXJlZCBjbG9uaW5nXG4gKiBhbGdvcml0aG0pXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuQ29tcG9zaXRvci5wcm90b3R5cGUuc2VuZEV2ZW50ID0gZnVuY3Rpb24gc2VuZEV2ZW50KHBhdGgsIGV2LCBwYXlsb2FkKSB7XG4gICAgdGhpcy5fb3V0Q29tbWFuZHMucHVzaCgnV0lUSCcsIHBhdGgsICdUUklHR0VSJywgZXYsIHBheWxvYWQpO1xufTtcblxuLyoqXG4gKiBJbnRlcm5hbCBoZWxwZXIgbWV0aG9kIHVzZWQgZm9yIG5vdGlmeWluZyBleHRlcm5hbGx5XG4gKiByZXNpemVkIGNvbnRleHRzIChlLmcuIGJ5IHJlc2l6aW5nIHRoZSBicm93c2VyIHdpbmRvdykuXG4gKlxuICogQG1ldGhvZFxuICogQHByaXZhdGVcbiAqXG4gKiBAcGFyYW0gIHtTdHJpbmd9IHNlbGVjdG9yIHJlbmRlciBwYXRoIHRvIHRoZSBub2RlIChjb250ZXh0KSB0aGF0IHNob3VsZCBiZVxuICogcmVzaXplZFxuICogQHBhcmFtICB7QXJyYXl9IHNpemUgbmV3IGNvbnRleHQgc2l6ZVxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkNvbXBvc2l0b3IucHJvdG90eXBlLnNlbmRSZXNpemUgPSBmdW5jdGlvbiBzZW5kUmVzaXplIChzZWxlY3Rvciwgc2l6ZSkge1xuICAgIHRoaXMuc2VuZEV2ZW50KHNlbGVjdG9yLCAnQ09OVEVYVF9SRVNJWkUnLCBzaXplKTtcbn07XG5cbi8qKlxuICogSW50ZXJuYWwgaGVscGVyIG1ldGhvZCB1c2VkIGJ5IGBkcmF3Q29tbWFuZHNgLlxuICogU3Vic2VxdWVudCBjb21tYW5kcyBhcmUgYmVpbmcgYXNzb2NpYXRlZCB3aXRoIHRoZSBub2RlIGRlZmluZWQgdGhlIHRoZSBwYXRoXG4gKiBmb2xsb3dpbmcgdGhlIGBXSVRIYCBjb21tYW5kLlxuICpcbiAqIEBtZXRob2RcbiAqIEBwcml2YXRlXG4gKlxuICogQHBhcmFtICB7TnVtYmVyfSBpdGVyYXRvciBwb3NpdGlvbiBpbmRleCB3aXRoaW4gdGhlIGNvbW1hbmRzIHF1ZXVlXG4gKiBAcGFyYW0gIHtBcnJheX0gY29tbWFuZHMgcmVtYWluaW5nIG1lc3NhZ2UgcXVldWUgcmVjZWl2ZWQsIHVzZWQgdG9cbiAqIHNoaWZ0IHNpbmdsZSBtZXNzYWdlcyBmcm9tXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuQ29tcG9zaXRvci5wcm90b3R5cGUuaGFuZGxlV2l0aCA9IGZ1bmN0aW9uIGhhbmRsZVdpdGggKGl0ZXJhdG9yLCBjb21tYW5kcykge1xuICAgIHZhciBwYXRoID0gY29tbWFuZHNbaXRlcmF0b3JdO1xuICAgIHZhciBwYXRoQXJyID0gcGF0aC5zcGxpdCgnLycpO1xuICAgIHZhciBjb250ZXh0ID0gdGhpcy5nZXRPclNldENvbnRleHQocGF0aEFyci5zaGlmdCgpKTtcbiAgICByZXR1cm4gY29udGV4dC5yZWNlaXZlKHBhdGgsIGNvbW1hbmRzLCBpdGVyYXRvcik7XG59O1xuXG4vKipcbiAqIFJldHJpZXZlcyB0aGUgdG9wLWxldmVsIENvbnRleHQgYXNzb2NpYXRlZCB3aXRoIHRoZSBwYXNzZWQgaW4gZG9jdW1lbnRcbiAqIHF1ZXJ5IHNlbGVjdG9yLiBJZiBubyBzdWNoIENvbnRleHQgZXhpc3RzLCBhIG5ldyBvbmUgd2lsbCBiZSBpbnN0YW50aWF0ZWQuXG4gKlxuICogQG1ldGhvZFxuICogQHByaXZhdGVcbiAqXG4gKiBAcGFyYW0gIHtTdHJpbmd9IHNlbGVjdG9yIGRvY3VtZW50IHF1ZXJ5IHNlbGVjdG9yIHVzZWQgZm9yIHJldHJpZXZpbmcgdGhlXG4gKiBET00gbm9kZSB0aGUgVmlydHVhbEVsZW1lbnQgc2hvdWxkIGJlIGF0dGFjaGVkIHRvXG4gKlxuICogQHJldHVybiB7Q29udGV4dH0gY29udGV4dFxuICovXG5Db21wb3NpdG9yLnByb3RvdHlwZS5nZXRPclNldENvbnRleHQgPSBmdW5jdGlvbiBnZXRPclNldENvbnRleHQoc2VsZWN0b3IpIHtcbiAgICBpZiAodGhpcy5fY29udGV4dHNbc2VsZWN0b3JdKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jb250ZXh0c1tzZWxlY3Rvcl07XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB2YXIgY29udGV4dCA9IG5ldyBDb250ZXh0KHNlbGVjdG9yLCB0aGlzKTtcbiAgICAgICAgdGhpcy5fY29udGV4dHNbc2VsZWN0b3JdID0gY29udGV4dDtcbiAgICAgICAgcmV0dXJuIGNvbnRleHQ7XG4gICAgfVxufTtcblxuLyoqXG4gKiBJbnRlcm5hbCBoZWxwZXIgbWV0aG9kIHVzZWQgYnkgYGRyYXdDb21tYW5kc2AuXG4gKlxuICogQG1ldGhvZFxuICogQHByaXZhdGVcbiAqXG4gKiBAcGFyYW0gIHtOdW1iZXJ9IGl0ZXJhdG9yIHBvc2l0aW9uIGluZGV4IHdpdGhpbiB0aGUgY29tbWFuZCBxdWV1ZVxuICogQHBhcmFtICB7QXJyYXl9IGNvbW1hbmRzIHJlbWFpbmluZyBtZXNzYWdlIHF1ZXVlIHJlY2VpdmVkLCB1c2VkIHRvXG4gKiBzaGlmdCBzaW5nbGUgbWVzc2FnZXNcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5Db21wb3NpdG9yLnByb3RvdHlwZS5naXZlU2l6ZUZvciA9IGZ1bmN0aW9uIGdpdmVTaXplRm9yKGl0ZXJhdG9yLCBjb21tYW5kcykge1xuICAgIHZhciBzZWxlY3RvciA9IGNvbW1hbmRzW2l0ZXJhdG9yXTtcbiAgICB2YXIgc2l6ZSA9IHRoaXMuZ2V0T3JTZXRDb250ZXh0KHNlbGVjdG9yKS5nZXRSb290U2l6ZSgpO1xuICAgIHRoaXMuc2VuZFJlc2l6ZShzZWxlY3Rvciwgc2l6ZSk7XG59O1xuXG4vKipcbiAqIFByb2Nlc3NlcyB0aGUgcHJldmlvdXNseSB2aWEgYHJlY2VpdmVDb21tYW5kc2AgdXBkYXRlZCBpbmNvbWluZyBcImluXCJcbiAqIGNvbW1hbmQgcXVldWUuXG4gKiBDYWxsZWQgYnkgVUlNYW5hZ2VyIG9uIGEgZnJhbWUgYnkgZnJhbWUgYmFzaXMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge0FycmF5fSBvdXRDb21tYW5kcyBzZXQgb2YgY29tbWFuZHMgdG8gYmUgc2VudCBiYWNrXG4gKi9cbkNvbXBvc2l0b3IucHJvdG90eXBlLmRyYXdDb21tYW5kcyA9IGZ1bmN0aW9uIGRyYXdDb21tYW5kcygpIHtcbiAgICB2YXIgY29tbWFuZHMgPSB0aGlzLl9pbkNvbW1hbmRzO1xuICAgIHZhciBsb2NhbEl0ZXJhdG9yID0gMDtcbiAgICB2YXIgY29tbWFuZCA9IGNvbW1hbmRzW2xvY2FsSXRlcmF0b3JdO1xuICAgIHdoaWxlIChjb21tYW5kKSB7XG4gICAgICAgIHN3aXRjaCAoY29tbWFuZCkge1xuICAgICAgICAgICAgY2FzZSAnVElNRSc6XG4gICAgICAgICAgICAgICAgdGhpcy5fdGltZSA9IGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdXSVRIJzpcbiAgICAgICAgICAgICAgICBsb2NhbEl0ZXJhdG9yID0gdGhpcy5oYW5kbGVXaXRoKCsrbG9jYWxJdGVyYXRvciwgY29tbWFuZHMpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnTkVFRF9TSVpFX0ZPUic6XG4gICAgICAgICAgICAgICAgdGhpcy5naXZlU2l6ZUZvcigrK2xvY2FsSXRlcmF0b3IsIGNvbW1hbmRzKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjb21tYW5kID0gY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXTtcbiAgICB9XG5cbiAgICAvLyBUT0RPOiBTd2l0Y2ggdG8gYXNzb2NpYXRpdmUgYXJyYXlzIGhlcmUuLi5cblxuICAgIGZvciAodmFyIGtleSBpbiB0aGlzLl9jb250ZXh0cykge1xuICAgICAgICB0aGlzLl9jb250ZXh0c1trZXldLmRyYXcoKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fcmVzaXplZCkge1xuICAgICAgICB0aGlzLnVwZGF0ZVNpemUoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5fb3V0Q29tbWFuZHM7XG59O1xuXG5cbi8qKlxuICogVXBkYXRlcyB0aGUgc2l6ZSBvZiBhbGwgcHJldmlvdXNseSByZWdpc3RlcmVkIGNvbnRleHQgb2JqZWN0cy5cbiAqIFRoaXMgcmVzdWx0cyBpbnRvIENPTlRFWFRfUkVTSVpFIGV2ZW50cyBiZWluZyBzZW50IGFuZCB0aGUgcm9vdCBlbGVtZW50c1xuICogdXNlZCBieSB0aGUgaW5kaXZpZHVhbCByZW5kZXJlcnMgYmVpbmcgcmVzaXplZCB0byB0aGUgdGhlIERPTVJlbmRlcmVyJ3Mgcm9vdFxuICogc2l6ZS5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuQ29tcG9zaXRvci5wcm90b3R5cGUudXBkYXRlU2l6ZSA9IGZ1bmN0aW9uIHVwZGF0ZVNpemUoKSB7XG4gICAgZm9yICh2YXIgc2VsZWN0b3IgaW4gdGhpcy5fY29udGV4dHMpIHtcbiAgICAgICAgdGhpcy5fY29udGV4dHNbc2VsZWN0b3JdLnVwZGF0ZVNpemUoKTtcbiAgICB9XG59O1xuXG4vKipcbiAqIFVzZWQgYnkgVGhyZWFkTWFuYWdlciB0byB1cGRhdGUgdGhlIGludGVybmFsIHF1ZXVlIG9mIGluY29taW5nIGNvbW1hbmRzLlxuICogUmVjZWl2aW5nIGNvbW1hbmRzIGRvZXMgbm90IGltbWVkaWF0ZWx5IHN0YXJ0IHRoZSByZW5kZXJpbmcgcHJvY2Vzcy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtICB7QXJyYXl9IGNvbW1hbmRzIGNvbW1hbmQgcXVldWUgdG8gYmUgcHJvY2Vzc2VkIGJ5IHRoZSBjb21wb3NpdG9yJ3NcbiAqIGBkcmF3Q29tbWFuZHNgIG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkNvbXBvc2l0b3IucHJvdG90eXBlLnJlY2VpdmVDb21tYW5kcyA9IGZ1bmN0aW9uIHJlY2VpdmVDb21tYW5kcyhjb21tYW5kcykge1xuICAgIHZhciBsZW4gPSBjb21tYW5kcy5sZW5ndGg7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICB0aGlzLl9pbkNvbW1hbmRzLnB1c2goY29tbWFuZHNbaV0pO1xuICAgIH1cbn07XG5cbi8qKlxuICogRmx1c2hlcyB0aGUgcXVldWUgb2Ygb3V0Z29pbmcgXCJvdXRcIiBjb21tYW5kcy5cbiAqIENhbGxlZCBieSBUaHJlYWRNYW5hZ2VyLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5Db21wb3NpdG9yLnByb3RvdHlwZS5jbGVhckNvbW1hbmRzID0gZnVuY3Rpb24gY2xlYXJDb21tYW5kcygpIHtcbiAgICB0aGlzLl9pbkNvbW1hbmRzLmxlbmd0aCA9IDA7XG4gICAgdGhpcy5fb3V0Q29tbWFuZHMubGVuZ3RoID0gMDtcbiAgICB0aGlzLl9yZXNpemVkID0gZmFsc2U7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENvbXBvc2l0b3I7XG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBGYW1vdXMgSW5kdXN0cmllcyBJbmMuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBXZWJHTFJlbmRlcmVyID0gcmVxdWlyZSgnLi4vd2ViZ2wtcmVuZGVyZXJzL1dlYkdMUmVuZGVyZXInKTtcbnZhciBDYW1lcmEgPSByZXF1aXJlKCcuLi9jb21wb25lbnRzL0NhbWVyYScpO1xudmFyIERPTVJlbmRlcmVyID0gcmVxdWlyZSgnLi4vZG9tLXJlbmRlcmVycy9ET01SZW5kZXJlcicpO1xuXG4vKipcbiAqIENvbnRleHQgaXMgYSByZW5kZXIgbGF5ZXIgd2l0aCBpdHMgb3duIFdlYkdMUmVuZGVyZXIgYW5kIERPTVJlbmRlcmVyLlxuICogSXQgaXMgdGhlIGludGVyZmFjZSBiZXR3ZWVuIHRoZSBDb21wb3NpdG9yIHdoaWNoIHJlY2VpdmVzIGNvbW1hbmRzXG4gKiBhbmQgdGhlIHJlbmRlcmVycyB0aGF0IGludGVycHJldCB0aGVtLiBJdCBhbHNvIHJlbGF5cyBpbmZvcm1hdGlvbiB0b1xuICogdGhlIHJlbmRlcmVycyBhYm91dCByZXNpemluZy5cbiAqXG4gKiBUaGUgRE9NRWxlbWVudCBhdCB0aGUgZ2l2ZW4gcXVlcnkgc2VsZWN0b3IgaXMgdXNlZCBhcyB0aGUgcm9vdC4gQVxuICogbmV3IERPTUVsZW1lbnQgaXMgYXBwZW5kZWQgdG8gdGhpcyByb290IGVsZW1lbnQsIGFuZCB1c2VkIGFzIHRoZVxuICogcGFyZW50IGVsZW1lbnQgZm9yIGFsbCBGYW1vdXMgRE9NIHJlbmRlcmluZyBhdCB0aGlzIGNvbnRleHQuIEFcbiAqIGNhbnZhcyBpcyBhZGRlZCBhbmQgdXNlZCBmb3IgYWxsIFdlYkdMIHJlbmRlcmluZyBhdCB0aGlzIGNvbnRleHQuXG4gKlxuICogQGNsYXNzIENvbnRleHRcbiAqIEBjb25zdHJ1Y3RvclxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzZWxlY3RvciBRdWVyeSBzZWxlY3RvciB1c2VkIHRvIGxvY2F0ZSByb290IGVsZW1lbnQgb2ZcbiAqIGNvbnRleHQgbGF5ZXIuXG4gKiBAcGFyYW0ge0NvbXBvc2l0b3J9IGNvbXBvc2l0b3IgQ29tcG9zaXRvciByZWZlcmVuY2UgdG8gcGFzcyBkb3duIHRvXG4gKiBXZWJHTFJlbmRlcmVyLlxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbmZ1bmN0aW9uIENvbnRleHQoc2VsZWN0b3IsIGNvbXBvc2l0b3IpIHtcbiAgICB0aGlzLl9jb21wb3NpdG9yID0gY29tcG9zaXRvcjtcbiAgICB0aGlzLl9yb290RWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKTtcblxuICAgIHRoaXMuX3NlbGVjdG9yID0gc2VsZWN0b3I7XG5cbiAgICAvLyBDcmVhdGUgRE9NIGVsZW1lbnQgdG8gYmUgdXNlZCBhcyByb290IGZvciBhbGwgZmFtb3VzIERPTVxuICAgIC8vIHJlbmRlcmluZyBhbmQgYXBwZW5kIGVsZW1lbnQgdG8gdGhlIHJvb3QgZWxlbWVudC5cblxuICAgIHZhciBET01MYXllckVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5fcm9vdEVsLmFwcGVuZENoaWxkKERPTUxheWVyRWwpO1xuXG4gICAgLy8gSW5zdGFudGlhdGUgcmVuZGVyZXJzXG5cbiAgICB0aGlzLkRPTVJlbmRlcmVyID0gbmV3IERPTVJlbmRlcmVyKERPTUxheWVyRWwsIHNlbGVjdG9yLCBjb21wb3NpdG9yKTtcbiAgICB0aGlzLldlYkdMUmVuZGVyZXIgPSBudWxsO1xuICAgIHRoaXMuY2FudmFzID0gbnVsbDtcblxuICAgIC8vIFN0YXRlIGhvbGRlcnNcblxuICAgIHRoaXMuX3JlbmRlclN0YXRlID0ge1xuICAgICAgICBwcm9qZWN0aW9uVHlwZTogQ2FtZXJhLk9SVEhPR1JBUEhJQ19QUk9KRUNUSU9OLFxuICAgICAgICBwZXJzcGVjdGl2ZVRyYW5zZm9ybTogbmV3IEZsb2F0MzJBcnJheShbMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMV0pLFxuICAgICAgICB2aWV3VHJhbnNmb3JtOiBuZXcgRmxvYXQzMkFycmF5KFsxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxXSksXG4gICAgICAgIHZpZXdEaXJ0eTogZmFsc2UsXG4gICAgICAgIHBlcnNwZWN0aXZlRGlydHk6IGZhbHNlXG4gICAgfTtcblxuICAgIHRoaXMuX3NpemUgPSBbXTtcbiAgICB0aGlzLl9jaGlsZHJlbiA9IHt9O1xuICAgIHRoaXMuX2VsZW1lbnRIYXNoID0ge307XG5cbiAgICB0aGlzLl9tZXNoVHJhbnNmb3JtID0gW107XG4gICAgdGhpcy5fbWVzaFNpemUgPSBbMCwgMCwgMF07XG59XG5cbi8qKlxuICogUXVlcmllcyBET01SZW5kZXJlciBzaXplIGFuZCB1cGRhdGVzIGNhbnZhcyBzaXplLiBSZWxheXMgc2l6ZSBpbmZvcm1hdGlvbiB0b1xuICogV2ViR0xSZW5kZXJlci5cbiAqXG4gKiBAcmV0dXJuIHtDb250ZXh0fSB0aGlzXG4gKi9cbkNvbnRleHQucHJvdG90eXBlLnVwZGF0ZVNpemUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG5ld1NpemUgPSB0aGlzLkRPTVJlbmRlcmVyLmdldFNpemUoKTtcbiAgICB0aGlzLl9jb21wb3NpdG9yLnNlbmRSZXNpemUodGhpcy5fc2VsZWN0b3IsIG5ld1NpemUpO1xuXG4gICAgaWYgKHRoaXMuY2FudmFzICYmIHRoaXMuV2ViR0xSZW5kZXJlcikge1xuICAgICAgICB0aGlzLldlYkdMUmVuZGVyZXIudXBkYXRlU2l6ZShuZXdTaXplKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogRHJhdyBmdW5jdGlvbiBjYWxsZWQgYWZ0ZXIgYWxsIGNvbW1hbmRzIGhhdmUgYmVlbiBoYW5kbGVkIGZvciBjdXJyZW50IGZyYW1lLlxuICogSXNzdWVzIGRyYXcgY29tbWFuZHMgdG8gYWxsIHJlbmRlcmVycyB3aXRoIGN1cnJlbnQgcmVuZGVyU3RhdGUuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkNvbnRleHQucHJvdG90eXBlLmRyYXcgPSBmdW5jdGlvbiBkcmF3KCkge1xuICAgIHRoaXMuRE9NUmVuZGVyZXIuZHJhdyh0aGlzLl9yZW5kZXJTdGF0ZSk7XG4gICAgaWYgKHRoaXMuV2ViR0xSZW5kZXJlcikgdGhpcy5XZWJHTFJlbmRlcmVyLmRyYXcodGhpcy5fcmVuZGVyU3RhdGUpO1xuXG4gICAgaWYgKHRoaXMuX3JlbmRlclN0YXRlLnBlcnNwZWN0aXZlRGlydHkpIHRoaXMuX3JlbmRlclN0YXRlLnBlcnNwZWN0aXZlRGlydHkgPSBmYWxzZTtcbiAgICBpZiAodGhpcy5fcmVuZGVyU3RhdGUudmlld0RpcnR5KSB0aGlzLl9yZW5kZXJTdGF0ZS52aWV3RGlydHkgPSBmYWxzZTtcbn07XG5cbi8qKlxuICogR2V0cyB0aGUgc2l6ZSBvZiB0aGUgcGFyZW50IGVsZW1lbnQgb2YgdGhlIERPTVJlbmRlcmVyIGZvciB0aGlzIGNvbnRleHQuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkNvbnRleHQucHJvdG90eXBlLmdldFJvb3RTaXplID0gZnVuY3Rpb24gZ2V0Um9vdFNpemUoKSB7XG4gICAgcmV0dXJuIHRoaXMuRE9NUmVuZGVyZXIuZ2V0U2l6ZSgpO1xufTtcblxuLyoqXG4gKiBIYW5kbGVzIGluaXRpYWxpemF0aW9uIG9mIFdlYkdMUmVuZGVyZXIgd2hlbiBuZWNlc3NhcnksIGluY2x1ZGluZyBjcmVhdGlvblxuICogb2YgdGhlIGNhbnZhcyBlbGVtZW50IGFuZCBpbnN0YW50aWF0aW9uIG9mIHRoZSByZW5kZXJlci4gQWxzbyB1cGRhdGVzIHNpemVcbiAqIHRvIHBhc3Mgc2l6ZSBpbmZvcm1hdGlvbiB0byB0aGUgcmVuZGVyZXIuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkNvbnRleHQucHJvdG90eXBlLmluaXRXZWJHTCA9IGZ1bmN0aW9uIGluaXRXZWJHTCgpIHtcbiAgICB0aGlzLmNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgIHRoaXMuX3Jvb3RFbC5hcHBlbmRDaGlsZCh0aGlzLmNhbnZhcyk7XG4gICAgdGhpcy5XZWJHTFJlbmRlcmVyID0gbmV3IFdlYkdMUmVuZGVyZXIodGhpcy5jYW52YXMsIHRoaXMuX2NvbXBvc2l0b3IpO1xuICAgIHRoaXMudXBkYXRlU2l6ZSgpO1xufTtcblxuLyoqXG4gKiBIYW5kbGVzIGRlbGVnYXRpb24gb2YgY29tbWFuZHMgdG8gcmVuZGVyZXJzIG9mIHRoaXMgY29udGV4dC5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHBhdGggU3RyaW5nIHVzZWQgYXMgaWRlbnRpZmllciBvZiBhIGdpdmVuIG5vZGUgaW4gdGhlXG4gKiBzY2VuZSBncmFwaC5cbiAqIEBwYXJhbSB7QXJyYXl9IGNvbW1hbmRzIExpc3Qgb2YgYWxsIGNvbW1hbmRzIGZyb20gdGhpcyBmcmFtZS5cbiAqIEBwYXJhbSB7TnVtYmVyfSBpdGVyYXRvciBOdW1iZXIgaW5kaWNhdGluZyBwcm9ncmVzcyB0aHJvdWdoIHRoZSBjb21tYW5kXG4gKiBxdWV1ZS5cbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IGl0ZXJhdG9yIGluZGljYXRpbmcgcHJvZ3Jlc3MgdGhyb3VnaCB0aGUgY29tbWFuZCBxdWV1ZS5cbiAqL1xuQ29udGV4dC5wcm90b3R5cGUucmVjZWl2ZSA9IGZ1bmN0aW9uIHJlY2VpdmUocGF0aCwgY29tbWFuZHMsIGl0ZXJhdG9yKSB7XG4gICAgdmFyIGxvY2FsSXRlcmF0b3IgPSBpdGVyYXRvcjtcblxuICAgIHZhciBjb21tYW5kID0gY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXTtcbiAgICB0aGlzLkRPTVJlbmRlcmVyLmxvYWRQYXRoKHBhdGgpO1xuICAgIHRoaXMuRE9NUmVuZGVyZXIuZmluZFRhcmdldCgpO1xuICAgIHdoaWxlIChjb21tYW5kKSB7XG5cbiAgICAgICAgc3dpdGNoIChjb21tYW5kKSB7XG4gICAgICAgICAgICBjYXNlICdJTklUX0RPTSc6XG4gICAgICAgICAgICAgICAgdGhpcy5ET01SZW5kZXJlci5pbnNlcnRFbChjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdKTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnRE9NX1JFTkRFUl9TSVpFJzpcbiAgICAgICAgICAgICAgICB0aGlzLkRPTVJlbmRlcmVyLmdldFNpemVPZihjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdKTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnQ0hBTkdFX1RSQU5TRk9STSc6XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAgOyBpIDwgMTYgOyBpKyspIHRoaXMuX21lc2hUcmFuc2Zvcm1baV0gPSBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5ET01SZW5kZXJlci5zZXRNYXRyaXgodGhpcy5fbWVzaFRyYW5zZm9ybSk7XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5XZWJHTFJlbmRlcmVyKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLldlYkdMUmVuZGVyZXIuc2V0Q3V0b3V0VW5pZm9ybShwYXRoLCAndV90cmFuc2Zvcm0nLCB0aGlzLl9tZXNoVHJhbnNmb3JtKTtcblxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdDSEFOR0VfU0laRSc6XG4gICAgICAgICAgICAgICAgdmFyIHdpZHRoID0gY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXTtcbiAgICAgICAgICAgICAgICB2YXIgaGVpZ2h0ID0gY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXTtcblxuICAgICAgICAgICAgICAgIHRoaXMuRE9NUmVuZGVyZXIuc2V0U2l6ZSh3aWR0aCwgaGVpZ2h0KTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5XZWJHTFJlbmRlcmVyKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX21lc2hTaXplWzBdID0gd2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX21lc2hTaXplWzFdID0gaGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICB0aGlzLldlYkdMUmVuZGVyZXIuc2V0Q3V0b3V0VW5pZm9ybShwYXRoLCAndV9zaXplJywgdGhpcy5fbWVzaFNpemUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnQ0hBTkdFX1BST1BFUlRZJzpcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5XZWJHTFJlbmRlcmVyKSB0aGlzLldlYkdMUmVuZGVyZXIuZ2V0T3JTZXRDdXRvdXQocGF0aCk7XG4gICAgICAgICAgICAgICAgdGhpcy5ET01SZW5kZXJlci5zZXRQcm9wZXJ0eShjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdLCBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdKTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnQ0hBTkdFX0NPTlRFTlQnOlxuICAgICAgICAgICAgICAgIGlmICh0aGlzLldlYkdMUmVuZGVyZXIpIHRoaXMuV2ViR0xSZW5kZXJlci5nZXRPclNldEN1dG91dChwYXRoKTtcbiAgICAgICAgICAgICAgICB0aGlzLkRPTVJlbmRlcmVyLnNldENvbnRlbnQoY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ0NIQU5HRV9BVFRSSUJVVEUnOlxuICAgICAgICAgICAgICAgIGlmICh0aGlzLldlYkdMUmVuZGVyZXIpIHRoaXMuV2ViR0xSZW5kZXJlci5nZXRPclNldEN1dG91dChwYXRoKTtcbiAgICAgICAgICAgICAgICB0aGlzLkRPTVJlbmRlcmVyLnNldEF0dHJpYnV0ZShjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdLCBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdKTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnQUREX0NMQVNTJzpcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5XZWJHTFJlbmRlcmVyKSB0aGlzLldlYkdMUmVuZGVyZXIuZ2V0T3JTZXRDdXRvdXQocGF0aCk7XG4gICAgICAgICAgICAgICAgdGhpcy5ET01SZW5kZXJlci5hZGRDbGFzcyhjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdKTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnUkVNT1ZFX0NMQVNTJzpcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5XZWJHTFJlbmRlcmVyKSB0aGlzLldlYkdMUmVuZGVyZXIuZ2V0T3JTZXRDdXRvdXQocGF0aCk7XG4gICAgICAgICAgICAgICAgdGhpcy5ET01SZW5kZXJlci5yZW1vdmVDbGFzcyhjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdKTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnU1VCU0NSSUJFJzpcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5XZWJHTFJlbmRlcmVyKSB0aGlzLldlYkdMUmVuZGVyZXIuZ2V0T3JTZXRDdXRvdXQocGF0aCk7XG4gICAgICAgICAgICAgICAgdGhpcy5ET01SZW5kZXJlci5zdWJzY3JpYmUoY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXSwgY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ0dMX1NFVF9EUkFXX09QVElPTlMnOlxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5XZWJHTFJlbmRlcmVyKSB0aGlzLmluaXRXZWJHTCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuV2ViR0xSZW5kZXJlci5zZXRNZXNoT3B0aW9ucyhwYXRoLCBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdKTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnR0xfQU1CSUVOVF9MSUdIVCc6XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLldlYkdMUmVuZGVyZXIpIHRoaXMuaW5pdFdlYkdMKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5XZWJHTFJlbmRlcmVyLnNldEFtYmllbnRMaWdodENvbG9yKFxuICAgICAgICAgICAgICAgICAgICBwYXRoLFxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdLFxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdLFxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnR0xfTElHSFRfUE9TSVRJT04nOlxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5XZWJHTFJlbmRlcmVyKSB0aGlzLmluaXRXZWJHTCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuV2ViR0xSZW5kZXJlci5zZXRMaWdodFBvc2l0aW9uKFxuICAgICAgICAgICAgICAgICAgICBwYXRoLFxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdLFxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdLFxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnR0xfTElHSFRfQ09MT1InOlxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5XZWJHTFJlbmRlcmVyKSB0aGlzLmluaXRXZWJHTCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuV2ViR0xSZW5kZXJlci5zZXRMaWdodENvbG9yKFxuICAgICAgICAgICAgICAgICAgICBwYXRoLFxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdLFxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdLFxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnTUFURVJJQUxfSU5QVVQnOlxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5XZWJHTFJlbmRlcmVyKSB0aGlzLmluaXRXZWJHTCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuV2ViR0xSZW5kZXJlci5oYW5kbGVNYXRlcmlhbElucHV0KFxuICAgICAgICAgICAgICAgICAgICBwYXRoLFxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdLFxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnR0xfU0VUX0dFT01FVFJZJzpcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuV2ViR0xSZW5kZXJlcikgdGhpcy5pbml0V2ViR0woKTtcbiAgICAgICAgICAgICAgICB0aGlzLldlYkdMUmVuZGVyZXIuc2V0R2VvbWV0cnkoXG4gICAgICAgICAgICAgICAgICAgIHBhdGgsXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl0sXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl0sXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdHTF9VTklGT1JNUyc6XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLldlYkdMUmVuZGVyZXIpIHRoaXMuaW5pdFdlYkdMKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5XZWJHTFJlbmRlcmVyLnNldE1lc2hVbmlmb3JtKFxuICAgICAgICAgICAgICAgICAgICBwYXRoLFxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdLFxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnR0xfQlVGRkVSX0RBVEEnOlxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5XZWJHTFJlbmRlcmVyKSB0aGlzLmluaXRXZWJHTCgpO1xuICAgICAgICAgICAgICAgIHRoaXMuV2ViR0xSZW5kZXJlci5idWZmZXJEYXRhKFxuICAgICAgICAgICAgICAgICAgICBwYXRoLFxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdLFxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdLFxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdLFxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdLFxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnR0xfQ1VUT1VUX1NUQVRFJzpcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuV2ViR0xSZW5kZXJlcikgdGhpcy5pbml0V2ViR0woKTtcbiAgICAgICAgICAgICAgICB0aGlzLldlYkdMUmVuZGVyZXIuc2V0Q3V0b3V0U3RhdGUocGF0aCwgY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ0dMX01FU0hfVklTSUJJTElUWSc6XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLldlYkdMUmVuZGVyZXIpIHRoaXMuaW5pdFdlYkdMKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5XZWJHTFJlbmRlcmVyLnNldE1lc2hWaXNpYmlsaXR5KHBhdGgsIGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdHTF9SRU1PVkVfTUVTSCc6XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLldlYkdMUmVuZGVyZXIpIHRoaXMuaW5pdFdlYkdMKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5XZWJHTFJlbmRlcmVyLnJlbW92ZU1lc2gocGF0aCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ1BJTkhPTEVfUFJPSkVDVElPTic6XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVuZGVyU3RhdGUucHJvamVjdGlvblR5cGUgPSBDYW1lcmEuUElOSE9MRV9QUk9KRUNUSU9OO1xuICAgICAgICAgICAgICAgIHRoaXMuX3JlbmRlclN0YXRlLnBlcnNwZWN0aXZlVHJhbnNmb3JtWzExXSA9IC0xIC8gY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXTtcblxuICAgICAgICAgICAgICAgIHRoaXMuX3JlbmRlclN0YXRlLnBlcnNwZWN0aXZlRGlydHkgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdPUlRIT0dSQVBISUNfUFJPSkVDVElPTic6XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVuZGVyU3RhdGUucHJvamVjdGlvblR5cGUgPSBDYW1lcmEuT1JUSE9HUkFQSElDX1BST0pFQ1RJT047XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVuZGVyU3RhdGUucGVyc3BlY3RpdmVUcmFuc2Zvcm1bMTFdID0gMDtcblxuICAgICAgICAgICAgICAgIHRoaXMuX3JlbmRlclN0YXRlLnBlcnNwZWN0aXZlRGlydHkgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdDSEFOR0VfVklFV19UUkFOU0ZPUk0nOlxuICAgICAgICAgICAgICAgIHRoaXMuX3JlbmRlclN0YXRlLnZpZXdUcmFuc2Zvcm1bMF0gPSBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdO1xuICAgICAgICAgICAgICAgIHRoaXMuX3JlbmRlclN0YXRlLnZpZXdUcmFuc2Zvcm1bMV0gPSBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdO1xuICAgICAgICAgICAgICAgIHRoaXMuX3JlbmRlclN0YXRlLnZpZXdUcmFuc2Zvcm1bMl0gPSBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdO1xuICAgICAgICAgICAgICAgIHRoaXMuX3JlbmRlclN0YXRlLnZpZXdUcmFuc2Zvcm1bM10gPSBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fcmVuZGVyU3RhdGUudmlld1RyYW5zZm9ybVs0XSA9IGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl07XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVuZGVyU3RhdGUudmlld1RyYW5zZm9ybVs1XSA9IGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl07XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVuZGVyU3RhdGUudmlld1RyYW5zZm9ybVs2XSA9IGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl07XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVuZGVyU3RhdGUudmlld1RyYW5zZm9ybVs3XSA9IGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl07XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9yZW5kZXJTdGF0ZS52aWV3VHJhbnNmb3JtWzhdID0gY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXTtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZW5kZXJTdGF0ZS52aWV3VHJhbnNmb3JtWzldID0gY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXTtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZW5kZXJTdGF0ZS52aWV3VHJhbnNmb3JtWzEwXSA9IGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl07XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVuZGVyU3RhdGUudmlld1RyYW5zZm9ybVsxMV0gPSBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fcmVuZGVyU3RhdGUudmlld1RyYW5zZm9ybVsxMl0gPSBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdO1xuICAgICAgICAgICAgICAgIHRoaXMuX3JlbmRlclN0YXRlLnZpZXdUcmFuc2Zvcm1bMTNdID0gY29tbWFuZHNbKytsb2NhbEl0ZXJhdG9yXTtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZW5kZXJTdGF0ZS52aWV3VHJhbnNmb3JtWzE0XSA9IGNvbW1hbmRzWysrbG9jYWxJdGVyYXRvcl07XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVuZGVyU3RhdGUudmlld1RyYW5zZm9ybVsxNV0gPSBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fcmVuZGVyU3RhdGUudmlld0RpcnR5ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnV0lUSCc6IHJldHVybiBsb2NhbEl0ZXJhdG9yIC0gMTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbW1hbmQgPSBjb21tYW5kc1srK2xvY2FsSXRlcmF0b3JdO1xuICAgIH1cblxuICAgIHJldHVybiBsb2NhbEl0ZXJhdG9yO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb250ZXh0O1xuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIFRoZSBVSU1hbmFnZXIgaXMgYmVpbmcgdXBkYXRlZCBieSBhbiBFbmdpbmUgYnkgY29uc2VjdXRpdmVseSBjYWxsaW5nIGl0c1xuICogYHVwZGF0ZWAgbWV0aG9kLiBJdCBjYW4gZWl0aGVyIG1hbmFnZSBhIHJlYWwgV2ViLVdvcmtlciBvciB0aGUgZ2xvYmFsXG4gKiBGYW1vdXNFbmdpbmUgY29yZSBzaW5nbGV0b24uXG4gKlxuICogQGV4YW1wbGVcbiAqIHZhciBjb21wb3NpdG9yID0gbmV3IENvbXBvc2l0b3IoKTtcbiAqIHZhciBlbmdpbmUgPSBuZXcgRW5naW5lKCk7XG4gKlxuICogLy8gVXNpbmcgYSBXZWIgV29ya2VyXG4gKiB2YXIgd29ya2VyID0gbmV3IFdvcmtlcignd29ya2VyLmJ1bmRsZS5qcycpO1xuICogdmFyIHRocmVhZG1hbmdlciA9IG5ldyBVSU1hbmFnZXIod29ya2VyLCBjb21wb3NpdG9yLCBlbmdpbmUpO1xuICpcbiAqIC8vIFdpdGhvdXQgdXNpbmcgYSBXZWIgV29ya2VyXG4gKiB2YXIgdGhyZWFkbWFuZ2VyID0gbmV3IFVJTWFuYWdlcihGYW1vdXMsIGNvbXBvc2l0b3IsIGVuZ2luZSk7XG4gKlxuICogQGNsYXNzICBVSU1hbmFnZXJcbiAqIEBjb25zdHJ1Y3RvclxuICpcbiAqIEBwYXJhbSB7RmFtb3VzfFdvcmtlcn0gdGhyZWFkIFRoZSB0aHJlYWQgYmVpbmcgdXNlZCB0byByZWNlaXZlIG1lc3NhZ2VzXG4gKiBmcm9tIGFuZCBwb3N0IG1lc3NhZ2VzIHRvLiBFeHBlY3RlZCB0byBleHBvc2UgYSBXZWJXb3JrZXItbGlrZSBBUEksIHdoaWNoXG4gKiBtZWFucyBwcm92aWRpbmcgYSB3YXkgdG8gbGlzdGVuIGZvciB1cGRhdGVzIGJ5IHNldHRpbmcgaXRzIGBvbm1lc3NhZ2VgXG4gKiBwcm9wZXJ0eSBhbmQgc2VuZGluZyB1cGRhdGVzIHVzaW5nIGBwb3N0TWVzc2FnZWAuXG4gKiBAcGFyYW0ge0NvbXBvc2l0b3J9IGNvbXBvc2l0b3IgYW4gaW5zdGFuY2Ugb2YgQ29tcG9zaXRvciB1c2VkIHRvIGV4dHJhY3RcbiAqIGVucXVldWVkIGRyYXcgY29tbWFuZHMgZnJvbSB0byBiZSBzZW50IHRvIHRoZSB0aHJlYWQuXG4gKiBAcGFyYW0ge1JlbmRlckxvb3B9IHJlbmRlckxvb3AgYW4gaW5zdGFuY2Ugb2YgRW5naW5lIHVzZWQgZm9yIGV4ZWN1dGluZ1xuICogdGhlIGBFTkdJTkVgIGNvbW1hbmRzIG9uLlxuICovXG5mdW5jdGlvbiBVSU1hbmFnZXIgKHRocmVhZCwgY29tcG9zaXRvciwgcmVuZGVyTG9vcCkge1xuICAgIHRoaXMuX3RocmVhZCA9IHRocmVhZDtcbiAgICB0aGlzLl9jb21wb3NpdG9yID0gY29tcG9zaXRvcjtcbiAgICB0aGlzLl9yZW5kZXJMb29wID0gcmVuZGVyTG9vcDtcblxuICAgIHRoaXMuX3JlbmRlckxvb3AudXBkYXRlKHRoaXMpO1xuXG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICB0aGlzLl90aHJlYWQub25tZXNzYWdlID0gZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgIHZhciBtZXNzYWdlID0gZXYuZGF0YSA/IGV2LmRhdGEgOiBldjtcbiAgICAgICAgaWYgKG1lc3NhZ2VbMF0gPT09ICdFTkdJTkUnKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKG1lc3NhZ2VbMV0pIHtcbiAgICAgICAgICAgICAgICBjYXNlICdTVEFSVCc6XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLl9yZW5kZXJMb29wLnN0YXJ0KCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ1NUT1AnOlxuICAgICAgICAgICAgICAgICAgICBfdGhpcy5fcmVuZGVyTG9vcC5zdG9wKCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgICAnVW5rbm93biBFTkdJTkUgY29tbWFuZCBcIicgKyBtZXNzYWdlWzFdICsgJ1wiJ1xuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIF90aGlzLl9jb21wb3NpdG9yLnJlY2VpdmVDb21tYW5kcyhtZXNzYWdlKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgdGhpcy5fdGhyZWFkLm9uZXJyb3IgPSBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgfTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSB0aHJlYWQgYmVpbmcgdXNlZCBieSB0aGUgVUlNYW5hZ2VyLlxuICogVGhpcyBjb3VsZCBlaXRoZXIgYmUgYW4gYW4gYWN0dWFsIHdlYiB3b3JrZXIgb3IgYSBgRmFtb3VzRW5naW5lYCBzaW5nbGV0b24uXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm4ge1dvcmtlcnxGYW1vdXNFbmdpbmV9IEVpdGhlciBhIHdlYiB3b3JrZXIgb3IgYSBgRmFtb3VzRW5naW5lYCBzaW5nbGV0b24uXG4gKi9cblVJTWFuYWdlci5wcm90b3R5cGUuZ2V0VGhyZWFkID0gZnVuY3Rpb24gZ2V0VGhyZWFkKCkge1xuICAgIHJldHVybiB0aGlzLl90aHJlYWQ7XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIGNvbXBvc2l0b3IgYmVpbmcgdXNlZCBieSB0aGlzIFVJTWFuYWdlci5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7Q29tcG9zaXRvcn0gVGhlIGNvbXBvc2l0b3IgdXNlZCBieSB0aGUgVUlNYW5hZ2VyLlxuICovXG5VSU1hbmFnZXIucHJvdG90eXBlLmdldENvbXBvc2l0b3IgPSBmdW5jdGlvbiBnZXRDb21wb3NpdG9yKCkge1xuICAgIHJldHVybiB0aGlzLl9jb21wb3NpdG9yO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBlbmdpbmUgYmVpbmcgdXNlZCBieSB0aGlzIFVJTWFuYWdlci5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7RW5naW5lfSBUaGUgZW5naW5lIHVzZWQgYnkgdGhlIFVJTWFuYWdlci5cbiAqL1xuVUlNYW5hZ2VyLnByb3RvdHlwZS5nZXRFbmdpbmUgPSBmdW5jdGlvbiBnZXRFbmdpbmUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3JlbmRlckxvb3A7XG59O1xuXG4vKipcbiAqIFVwZGF0ZSBtZXRob2QgYmVpbmcgaW52b2tlZCBieSB0aGUgRW5naW5lIG9uIGV2ZXJ5IGByZXF1ZXN0QW5pbWF0aW9uRnJhbWVgLlxuICogVXNlZCBmb3IgdXBkYXRpbmcgdGhlIG5vdGlvbiBvZiB0aW1lIHdpdGhpbiB0aGUgbWFuYWdlZCB0aHJlYWQgYnkgc2VuZGluZ1xuICogYSBGUkFNRSBjb21tYW5kIGFuZCBzZW5kaW5nIG1lc3NhZ2VzIHRvXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSAge051bWJlcn0gdGltZSB1bml4IHRpbWVzdGFtcCB0byBiZSBwYXNzZWQgZG93biB0byB0aGUgd29ya2VyIGFzIGFcbiAqIEZSQU1FIGNvbW1hbmRcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cblVJTWFuYWdlci5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24gdXBkYXRlICh0aW1lKSB7XG4gICAgdGhpcy5fdGhyZWFkLnBvc3RNZXNzYWdlKFsnRlJBTUUnLCB0aW1lXSk7XG4gICAgdmFyIHRocmVhZE1lc3NhZ2VzID0gdGhpcy5fY29tcG9zaXRvci5kcmF3Q29tbWFuZHMoKTtcbiAgICB0aGlzLl90aHJlYWQucG9zdE1lc3NhZ2UodGhyZWFkTWVzc2FnZXMpO1xuICAgIHRoaXMuX2NvbXBvc2l0b3IuY2xlYXJDb21tYW5kcygpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBVSU1hbmFnZXI7XG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBGYW1vdXMgSW5kdXN0cmllcyBJbmMuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBjc3MgPSAnLmZhbW91cy1kb20tcmVuZGVyZXIgeycgK1xuICAgICd3aWR0aDoxMDAlOycgK1xuICAgICdoZWlnaHQ6MTAwJTsnICtcbiAgICAndHJhbnNmb3JtLXN0eWxlOnByZXNlcnZlLTNkOycgK1xuICAgICctd2Via2l0LXRyYW5zZm9ybS1zdHlsZTpwcmVzZXJ2ZS0zZDsnICtcbid9JyArXG5cbicuZmFtb3VzLWRvbS1lbGVtZW50IHsnICtcbiAgICAnLXdlYmtpdC10cmFuc2Zvcm0tb3JpZ2luOjAlIDAlOycgK1xuICAgICd0cmFuc2Zvcm0tb3JpZ2luOjAlIDAlOycgK1xuICAgICctd2Via2l0LWJhY2tmYWNlLXZpc2liaWxpdHk6dmlzaWJsZTsnICtcbiAgICAnYmFja2ZhY2UtdmlzaWJpbGl0eTp2aXNpYmxlOycgK1xuICAgICctd2Via2l0LXRyYW5zZm9ybS1zdHlsZTpwcmVzZXJ2ZS0zZDsnICtcbiAgICAndHJhbnNmb3JtLXN0eWxlOnByZXNlcnZlLTNkOycgK1xuICAgICctd2Via2l0LXRhcC1oaWdobGlnaHQtY29sb3I6dHJhbnNwYXJlbnQ7JyArXG4gICAgJ3BvaW50ZXItZXZlbnRzOmF1dG87JyArXG4gICAgJ3otaW5kZXg6MTsnICtcbid9JyArXG5cbicuZmFtb3VzLWRvbS1lbGVtZW50LWNvbnRlbnQsJyArXG4nLmZhbW91cy1kb20tZWxlbWVudCB7JyArXG4gICAgJ3Bvc2l0aW9uOmFic29sdXRlOycgK1xuICAgICdib3gtc2l6aW5nOmJvcmRlci1ib3g7JyArXG4gICAgJy1tb3otYm94LXNpemluZzpib3JkZXItYm94OycgK1xuICAgICctd2Via2l0LWJveC1zaXppbmc6Ym9yZGVyLWJveDsnICtcbid9JyArXG5cbicuZmFtb3VzLXdlYmdsLXJlbmRlcmVyIHsnICtcbiAgICAnLXdlYmtpdC10cmFuc2Zvcm06dHJhbnNsYXRlWigxMDAwMDAwcHgpOycgKyAgLyogVE9ETzogRml4IHdoZW4gU2FmYXJpIEZpeGVzKi9cbiAgICAndHJhbnNmb3JtOnRyYW5zbGF0ZVooMTAwMDAwMHB4KTsnICtcbiAgICAncG9pbnRlci1ldmVudHM6bm9uZTsnICtcbiAgICAncG9zaXRpb246YWJzb2x1dGU7JyArXG4gICAgJ3otaW5kZXg6MTsnICtcbiAgICAndG9wOjA7JyArXG4gICAgJ3dpZHRoOjEwMCU7JyArXG4gICAgJ2hlaWdodDoxMDAlOycgK1xuJ30nO1xuXG52YXIgSU5KRUNURUQgPSB0eXBlb2YgZG9jdW1lbnQgPT09ICd1bmRlZmluZWQnO1xuXG5mdW5jdGlvbiBpbmplY3RDU1MoKSB7XG4gICAgaWYgKElOSkVDVEVEKSByZXR1cm47XG4gICAgSU5KRUNURUQgPSB0cnVlO1xuICAgIGlmIChkb2N1bWVudC5jcmVhdGVTdHlsZVNoZWV0KSB7XG4gICAgICAgIHZhciBzaGVldCA9IGRvY3VtZW50LmNyZWF0ZVN0eWxlU2hlZXQoKTtcbiAgICAgICAgc2hlZXQuY3NzVGV4dCA9IGNzcztcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHZhciBoZWFkID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXTtcbiAgICAgICAgdmFyIHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcblxuICAgICAgICBpZiAoc3R5bGUuc3R5bGVTaGVldCkge1xuICAgICAgICAgICAgc3R5bGUuc3R5bGVTaGVldC5jc3NUZXh0ID0gY3NzO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgc3R5bGUuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoY3NzKSk7XG4gICAgICAgIH1cblxuICAgICAgICAoaGVhZCA/IGhlYWQgOiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQpLmFwcGVuZENoaWxkKHN0eWxlKTtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaW5qZWN0Q1NTO1xuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEEgbGlnaHR3ZWlnaHQsIGZlYXR1cmVsZXNzIEV2ZW50RW1pdHRlci5cbiAqXG4gKiBAY2xhc3MgQ2FsbGJhY2tTdG9yZVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIENhbGxiYWNrU3RvcmUgKCkge1xuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xufVxuXG4vKipcbiAqIEFkZHMgYSBsaXN0ZW5lciBmb3IgdGhlIHNwZWNpZmllZCBldmVudCAoPSBrZXkpLlxuICpcbiAqIEBtZXRob2Qgb25cbiAqIEBjaGFpbmFibGVcbiAqXG4gKiBAcGFyYW0gIHtTdHJpbmd9ICAga2V5ICAgICAgIFRoZSBldmVudCB0eXBlIChlLmcuIGBjbGlja2ApLlxuICogQHBhcmFtICB7RnVuY3Rpb259IGNhbGxiYWNrICBBIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGJlIGludm9rZWQgd2hlbmV2ZXIgYGtleWBcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQgaXMgYmVpbmcgdHJpZ2dlcmVkLlxuICogQHJldHVybiB7RnVuY3Rpb259IGRlc3Ryb3kgICBBIGZ1bmN0aW9uIHRvIGNhbGwgaWYgeW91IHdhbnQgdG8gcmVtb3ZlIHRoZVxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjay5cbiAqL1xuQ2FsbGJhY2tTdG9yZS5wcm90b3R5cGUub24gPSBmdW5jdGlvbiBvbiAoa2V5LCBjYWxsYmFjaykge1xuICAgIGlmICghdGhpcy5fZXZlbnRzW2tleV0pIHRoaXMuX2V2ZW50c1trZXldID0gW107XG4gICAgdmFyIGNhbGxiYWNrTGlzdCA9IHRoaXMuX2V2ZW50c1trZXldO1xuICAgIGNhbGxiYWNrTGlzdC5wdXNoKGNhbGxiYWNrKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICBjYWxsYmFja0xpc3Quc3BsaWNlKGNhbGxiYWNrTGlzdC5pbmRleE9mKGNhbGxiYWNrKSwgMSk7XG4gICAgfTtcbn07XG5cbi8qKlxuICogUmVtb3ZlcyBhIHByZXZpb3VzbHkgYWRkZWQgZXZlbnQgbGlzdGVuZXIuXG4gKlxuICogQG1ldGhvZCBvZmZcbiAqIEBjaGFpbmFibGVcbiAqXG4gKiBAcGFyYW0gIHtTdHJpbmd9IGtleSAgICAgICAgIFRoZSBldmVudCB0eXBlIGZyb20gd2hpY2ggdGhlIGNhbGxiYWNrIGZ1bmN0aW9uXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNob3VsZCBiZSByZW1vdmVkLlxuICogQHBhcmFtICB7RnVuY3Rpb259IGNhbGxiYWNrICBUaGUgY2FsbGJhY2sgZnVuY3Rpb24gdG8gYmUgcmVtb3ZlZCBmcm9tIHRoZVxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcnMgZm9yIGtleS5cbiAqIEByZXR1cm4ge0NhbGxiYWNrU3RvcmV9IHRoaXNcbiAqL1xuQ2FsbGJhY2tTdG9yZS5wcm90b3R5cGUub2ZmID0gZnVuY3Rpb24gb2ZmIChrZXksIGNhbGxiYWNrKSB7XG4gICAgdmFyIGV2ZW50cyA9IHRoaXMuX2V2ZW50c1trZXldO1xuICAgIGlmIChldmVudHMpIGV2ZW50cy5zcGxpY2UoZXZlbnRzLmluZGV4T2YoY2FsbGJhY2spLCAxKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogSW52b2tlcyBhbGwgdGhlIHByZXZpb3VzbHkgZm9yIHRoaXMga2V5IHJlZ2lzdGVyZWQgY2FsbGJhY2tzLlxuICpcbiAqIEBtZXRob2QgdHJpZ2dlclxuICogQGNoYWluYWJsZVxuICpcbiAqIEBwYXJhbSAge1N0cmluZ30gICAgICAgIGtleSAgICAgIFRoZSBldmVudCB0eXBlLlxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgICAgcGF5bG9hZCAgVGhlIGV2ZW50IHBheWxvYWQgKGV2ZW50IG9iamVjdCkuXG4gKiBAcmV0dXJuIHtDYWxsYmFja1N0b3JlfSB0aGlzXG4gKi9cbkNhbGxiYWNrU3RvcmUucHJvdG90eXBlLnRyaWdnZXIgPSBmdW5jdGlvbiB0cmlnZ2VyIChrZXksIHBheWxvYWQpIHtcbiAgICB2YXIgZXZlbnRzID0gdGhpcy5fZXZlbnRzW2tleV07XG4gICAgaWYgKGV2ZW50cykge1xuICAgICAgICB2YXIgaSA9IDA7XG4gICAgICAgIHZhciBsZW4gPSBldmVudHMubGVuZ3RoO1xuICAgICAgICBmb3IgKDsgaSA8IGxlbiA7IGkrKykgZXZlbnRzW2ldKHBheWxvYWQpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ2FsbGJhY2tTdG9yZTtcbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiBEZWVwIGNsb25lIGFuIG9iamVjdC5cbiAqXG4gKiBAbWV0aG9kICBjbG9uZVxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBiICAgICAgIE9iamVjdCB0byBiZSBjbG9uZWQuXG4gKiBAcmV0dXJuIHtPYmplY3R9IGEgICAgICBDbG9uZWQgb2JqZWN0IChkZWVwIGVxdWFsaXR5KS5cbiAqL1xudmFyIGNsb25lID0gZnVuY3Rpb24gY2xvbmUoYikge1xuICAgIHZhciBhO1xuICAgIGlmICh0eXBlb2YgYiA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgYSA9IChiIGluc3RhbmNlb2YgQXJyYXkpID8gW10gOiB7fTtcbiAgICAgICAgZm9yICh2YXIga2V5IGluIGIpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgYltrZXldID09PSAnb2JqZWN0JyAmJiBiW2tleV0gIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBpZiAoYltrZXldIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgICAgICAgICAgYVtrZXldID0gbmV3IEFycmF5KGJba2V5XS5sZW5ndGgpO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGJba2V5XS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgYVtrZXldW2ldID0gY2xvbmUoYltrZXldW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIGFba2V5XSA9IGNsb25lKGJba2V5XSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgYVtrZXldID0gYltrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBhID0gYjtcbiAgICB9XG4gICAgcmV0dXJuIGE7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsb25lO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBGYW1vdXMgSW5kdXN0cmllcyBJbmMuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4vKipcbiAqIFRha2VzIGFuIG9iamVjdCBjb250YWluaW5nIGtleXMgYW5kIHZhbHVlcyBhbmQgcmV0dXJucyBhbiBvYmplY3RcbiAqIGNvbXByaXNpbmcgdHdvIFwiYXNzb2NpYXRlXCIgYXJyYXlzLCBvbmUgd2l0aCB0aGUga2V5cyBhbmQgdGhlIG90aGVyXG4gKiB3aXRoIHRoZSB2YWx1ZXMuXG4gKlxuICogQG1ldGhvZCBrZXlWYWx1ZXNUb0FycmF5c1xuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogICAgICAgICAgICAgICAgICAgICAgT2JqZWN0cyB3aGVyZSB0byBleHRyYWN0IGtleXMgYW5kIHZhbHVlc1xuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcm9tLlxuICogQHJldHVybiB7T2JqZWN0fSAgICAgICAgIHJlc3VsdFxuICogICAgICAgICB7QXJyYXkuPFN0cmluZz59IHJlc3VsdC5rZXlzICAgICBLZXlzIG9mIGByZXN1bHRgLCBhcyByZXR1cm5lZCBieVxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBgT2JqZWN0LmtleXMoKWBcbiAqICAgICAgICAge0FycmF5fSAgICAgICAgICByZXN1bHQudmFsdWVzICAgVmFsdWVzIG9mIHBhc3NlZCBpbiBvYmplY3QuXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ga2V5VmFsdWVzVG9BcnJheXMob2JqKSB7XG4gICAgdmFyIGtleXNBcnJheSA9IFtdLCB2YWx1ZXNBcnJheSA9IFtdO1xuICAgIHZhciBpID0gMDtcbiAgICBmb3IodmFyIGtleSBpbiBvYmopIHtcbiAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICBrZXlzQXJyYXlbaV0gPSBrZXk7XG4gICAgICAgICAgICB2YWx1ZXNBcnJheVtpXSA9IG9ialtrZXldO1xuICAgICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIGtleXM6IGtleXNBcnJheSxcbiAgICAgICAgdmFsdWVzOiB2YWx1ZXNBcnJheVxuICAgIH07XG59O1xuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgUFJFRklYRVMgPSBbJycsICctbXMtJywgJy13ZWJraXQtJywgJy1tb3otJywgJy1vLSddO1xuXG4vKipcbiAqIEEgaGVscGVyIGZ1bmN0aW9uIHVzZWQgZm9yIGRldGVybWluaW5nIHRoZSB2ZW5kb3IgcHJlZml4ZWQgdmVyc2lvbiBvZiB0aGVcbiAqIHBhc3NlZCBpbiBDU1MgcHJvcGVydHkuXG4gKlxuICogVmVuZG9yIGNoZWNrcyBhcmUgYmVpbmcgY29uZHVjdGVkIGluIHRoZSBmb2xsb3dpbmcgb3JkZXI6XG4gKlxuICogMS4gKG5vIHByZWZpeClcbiAqIDIuIGAtbXotYFxuICogMy4gYC13ZWJraXQtYFxuICogNC4gYC1tb3otYFxuICogNS4gYC1vLWBcbiAqXG4gKiBAbWV0aG9kIHZlbmRvclByZWZpeFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBwcm9wZXJ0eSAgICAgQ1NTIHByb3BlcnR5IChubyBjYW1lbENhc2UpLCBlLmcuXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGBib3JkZXItcmFkaXVzYC5cbiAqIEByZXR1cm4ge1N0cmluZ30gcHJlZml4ZWQgICAgVmVuZG9yIHByZWZpeGVkIHZlcnNpb24gb2YgcGFzc2VkIGluIENTU1xuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eSAoZS5nLiBgLXdlYmtpdC1ib3JkZXItcmFkaXVzYCkuXG4gKi9cbmZ1bmN0aW9uIHZlbmRvclByZWZpeChwcm9wZXJ0eSkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgUFJFRklYRVMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHByZWZpeGVkID0gUFJFRklYRVNbaV0gKyBwcm9wZXJ0eTtcbiAgICAgICAgaWYgKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZVtwcmVmaXhlZF0gPT09ICcnKSB7XG4gICAgICAgICAgICByZXR1cm4gcHJlZml4ZWQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHByb3BlcnR5O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHZlbmRvclByZWZpeDtcbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIEdlb21ldHJ5SWRzID0gMDtcblxuLyoqXG4gKiBHZW9tZXRyeSBpcyBhIGNvbXBvbmVudCB0aGF0IGRlZmluZXMgYW5kIG1hbmFnZXMgZGF0YVxuICogKHZlcnRleCBkYXRhIGFuZCBhdHRyaWJ1dGVzKSB0aGF0IGlzIHVzZWQgdG8gZHJhdyB0byBXZWJHTC5cbiAqXG4gKiBAY2xhc3MgR2VvbWV0cnlcbiAqIEBjb25zdHJ1Y3RvclxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIGluc3RhbnRpYXRpb24gb3B0aW9uc1xuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuZnVuY3Rpb24gR2VvbWV0cnkob3B0aW9ucykge1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgdGhpcy5ERUZBVUxUX0JVRkZFUl9TSVpFID0gMztcblxuICAgIHRoaXMuc3BlYyA9IHtcbiAgICAgICAgaWQ6IEdlb21ldHJ5SWRzKyssXG4gICAgICAgIGR5bmFtaWM6IGZhbHNlLFxuICAgICAgICB0eXBlOiB0aGlzLm9wdGlvbnMudHlwZSB8fCAnVFJJQU5HTEVTJyxcbiAgICAgICAgYnVmZmVyTmFtZXM6IFtdLFxuICAgICAgICBidWZmZXJWYWx1ZXM6IFtdLFxuICAgICAgICBidWZmZXJTcGFjaW5nczogW10sXG4gICAgICAgIGludmFsaWRhdGlvbnM6IFtdXG4gICAgfTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMuYnVmZmVycykge1xuICAgICAgICB2YXIgbGVuID0gdGhpcy5vcHRpb25zLmJ1ZmZlcnMubGVuZ3RoO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjspIHtcbiAgICAgICAgICAgIHRoaXMuc3BlYy5idWZmZXJOYW1lcy5wdXNoKHRoaXMub3B0aW9ucy5idWZmZXJzW2ldLm5hbWUpO1xuICAgICAgICAgICAgdGhpcy5zcGVjLmJ1ZmZlclZhbHVlcy5wdXNoKHRoaXMub3B0aW9ucy5idWZmZXJzW2ldLmRhdGEpO1xuICAgICAgICAgICAgdGhpcy5zcGVjLmJ1ZmZlclNwYWNpbmdzLnB1c2godGhpcy5vcHRpb25zLmJ1ZmZlcnNbaV0uc2l6ZSB8fCB0aGlzLkRFRkFVTFRfQlVGRkVSX1NJWkUpO1xuICAgICAgICAgICAgdGhpcy5zcGVjLmludmFsaWRhdGlvbnMucHVzaChpKyspO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEdlb21ldHJ5O1xuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgVmVjMyA9IHJlcXVpcmUoJy4uL21hdGgvVmVjMycpO1xudmFyIFZlYzIgPSByZXF1aXJlKCcuLi9tYXRoL1ZlYzInKTtcblxudmFyIG91dHB1dHMgPSBbXG4gICAgbmV3IFZlYzMoKSxcbiAgICBuZXcgVmVjMygpLFxuICAgIG5ldyBWZWMzKCksXG4gICAgbmV3IFZlYzIoKSxcbiAgICBuZXcgVmVjMigpXG5dO1xuXG4vKipcbiAqIEEgaGVscGVyIG9iamVjdCB1c2VkIHRvIGNhbGN1bGF0ZSBidWZmZXJzIGZvciBjb21wbGljYXRlZCBnZW9tZXRyaWVzLlxuICogVGFpbG9yZWQgZm9yIHRoZSBXZWJHTFJlbmRlcmVyLCB1c2VkIGJ5IG1vc3QgcHJpbWl0aXZlcy5cbiAqXG4gKiBAc3RhdGljXG4gKiBAY2xhc3MgR2VvbWV0cnlIZWxwZXJcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbnZhciBHZW9tZXRyeUhlbHBlciA9IHt9O1xuXG4vKipcbiAqIEEgZnVuY3Rpb24gdGhhdCBpdGVyYXRlcyB0aHJvdWdoIHZlcnRpY2FsIGFuZCBob3Jpem9udGFsIHNsaWNlc1xuICogYmFzZWQgb24gaW5wdXQgZGV0YWlsLCBhbmQgZ2VuZXJhdGVzIHZlcnRpY2VzIGFuZCBpbmRpY2VzIGZvciBlYWNoXG4gKiBzdWJkaXZpc2lvbi5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtICB7TnVtYmVyfSBkZXRhaWxYIEFtb3VudCBvZiBzbGljZXMgdG8gaXRlcmF0ZSB0aHJvdWdoLlxuICogQHBhcmFtICB7TnVtYmVyfSBkZXRhaWxZIEFtb3VudCBvZiBzdGFja3MgdG8gaXRlcmF0ZSB0aHJvdWdoLlxuICogQHBhcmFtICB7RnVuY3Rpb259IGZ1bmMgRnVuY3Rpb24gdXNlZCB0byBnZW5lcmF0ZSB2ZXJ0ZXggcG9zaXRpb25zIGF0IGVhY2ggcG9pbnQuXG4gKiBAcGFyYW0gIHtCb29sZWFufSB3cmFwIE9wdGlvbmFsIHBhcmFtZXRlciAoZGVmYXVsdDogUGkpIGZvciBzZXR0aW5nIGEgY3VzdG9tIHdyYXAgcmFuZ2VcbiAqXG4gKiBAcmV0dXJuIHtPYmplY3R9IE9iamVjdCBjb250YWluaW5nIGdlbmVyYXRlZCB2ZXJ0aWNlcyBhbmQgaW5kaWNlcy5cbiAqL1xuR2VvbWV0cnlIZWxwZXIuZ2VuZXJhdGVQYXJhbWV0cmljID0gZnVuY3Rpb24gZ2VuZXJhdGVQYXJhbWV0cmljKGRldGFpbFgsIGRldGFpbFksIGZ1bmMsIHdyYXApIHtcbiAgICB2YXIgdmVydGljZXMgPSBbXTtcbiAgICB2YXIgaTtcbiAgICB2YXIgdGhldGE7XG4gICAgdmFyIHBoaTtcbiAgICB2YXIgajtcblxuICAgIC8vIFdlIGNhbiB3cmFwIGFyb3VuZCBzbGlnaHRseSBtb3JlIHRoYW4gb25jZSBmb3IgdXYgY29vcmRpbmF0ZXMgdG8gbG9vayBjb3JyZWN0LlxuXG4gICAgdmFyIFhyYW5nZSA9IHdyYXAgPyBNYXRoLlBJICsgKE1hdGguUEkgLyAoZGV0YWlsWCAtIDEpKSA6IE1hdGguUEk7XG4gICAgdmFyIG91dCA9IFtdO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IGRldGFpbFggKyAxOyBpKyspIHtcbiAgICAgICAgdGhldGEgPSBpICogWHJhbmdlIC8gZGV0YWlsWDtcbiAgICAgICAgZm9yIChqID0gMDsgaiA8IGRldGFpbFk7IGorKykge1xuICAgICAgICAgICAgcGhpID0gaiAqIDIuMCAqIFhyYW5nZSAvIGRldGFpbFk7XG4gICAgICAgICAgICBmdW5jKHRoZXRhLCBwaGksIG91dCk7XG4gICAgICAgICAgICB2ZXJ0aWNlcy5wdXNoKG91dFswXSwgb3V0WzFdLCBvdXRbMl0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIGluZGljZXMgPSBbXSxcbiAgICAgICAgdiA9IDAsXG4gICAgICAgIG5leHQ7XG4gICAgZm9yIChpID0gMDsgaSA8IGRldGFpbFg7IGkrKykge1xuICAgICAgICBmb3IgKGogPSAwOyBqIDwgZGV0YWlsWTsgaisrKSB7XG4gICAgICAgICAgICBuZXh0ID0gKGogKyAxKSAlIGRldGFpbFk7XG4gICAgICAgICAgICBpbmRpY2VzLnB1c2godiArIGosIHYgKyBqICsgZGV0YWlsWSwgdiArIG5leHQpO1xuICAgICAgICAgICAgaW5kaWNlcy5wdXNoKHYgKyBuZXh0LCB2ICsgaiArIGRldGFpbFksIHYgKyBuZXh0ICsgZGV0YWlsWSk7XG4gICAgICAgIH1cbiAgICAgICAgdiArPSBkZXRhaWxZO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIHZlcnRpY2VzOiB2ZXJ0aWNlcyxcbiAgICAgICAgaW5kaWNlczogaW5kaWNlc1xuICAgIH07XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgbm9ybWFscyBiZWxvbmdpbmcgdG8gZWFjaCBmYWNlIG9mIGEgZ2VvbWV0cnkuXG4gKiBBc3N1bWVzIGNsb2Nrd2lzZSBkZWNsYXJhdGlvbiBvZiB2ZXJ0aWNlcy5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtBcnJheX0gdmVydGljZXMgVmVydGljZXMgb2YgYWxsIHBvaW50cyBvbiB0aGUgZ2VvbWV0cnkuXG4gKiBAcGFyYW0ge0FycmF5fSBpbmRpY2VzIEluZGljZXMgZGVjbGFyaW5nIGZhY2VzIG9mIGdlb21ldHJ5LlxuICogQHBhcmFtIHtBcnJheX0gb3V0IEFycmF5IHRvIGJlIGZpbGxlZCBhbmQgcmV0dXJuZWQuXG4gKlxuICogQHJldHVybiB7QXJyYXl9IENhbGN1bGF0ZWQgZmFjZSBub3JtYWxzLlxuICovXG5HZW9tZXRyeUhlbHBlci5jb21wdXRlTm9ybWFscyA9IGZ1bmN0aW9uIGNvbXB1dGVOb3JtYWxzKHZlcnRpY2VzLCBpbmRpY2VzLCBvdXQpIHtcbiAgICB2YXIgbm9ybWFscyA9IG91dCB8fCBbXTtcbiAgICB2YXIgaW5kZXhPbmU7XG4gICAgdmFyIGluZGV4VHdvO1xuICAgIHZhciBpbmRleFRocmVlO1xuICAgIHZhciBub3JtYWw7XG4gICAgdmFyIGo7XG4gICAgdmFyIGxlbiA9IGluZGljZXMubGVuZ3RoIC8gMztcbiAgICB2YXIgaTtcbiAgICB2YXIgeDtcbiAgICB2YXIgeTtcbiAgICB2YXIgejtcbiAgICB2YXIgbGVuZ3RoO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIGluZGV4VHdvID0gaW5kaWNlc1tpKjMgKyAwXSAqIDM7XG4gICAgICAgIGluZGV4T25lID0gaW5kaWNlc1tpKjMgKyAxXSAqIDM7XG4gICAgICAgIGluZGV4VGhyZWUgPSBpbmRpY2VzW2kqMyArIDJdICogMztcblxuICAgICAgICBvdXRwdXRzWzBdLnNldCh2ZXJ0aWNlc1tpbmRleE9uZV0sIHZlcnRpY2VzW2luZGV4T25lICsgMV0sIHZlcnRpY2VzW2luZGV4T25lICsgMl0pO1xuICAgICAgICBvdXRwdXRzWzFdLnNldCh2ZXJ0aWNlc1tpbmRleFR3b10sIHZlcnRpY2VzW2luZGV4VHdvICsgMV0sIHZlcnRpY2VzW2luZGV4VHdvICsgMl0pO1xuICAgICAgICBvdXRwdXRzWzJdLnNldCh2ZXJ0aWNlc1tpbmRleFRocmVlXSwgdmVydGljZXNbaW5kZXhUaHJlZSArIDFdLCB2ZXJ0aWNlc1tpbmRleFRocmVlICsgMl0pO1xuXG4gICAgICAgIG5vcm1hbCA9IG91dHB1dHNbMl0uc3VidHJhY3Qob3V0cHV0c1swXSkuY3Jvc3Mob3V0cHV0c1sxXS5zdWJ0cmFjdChvdXRwdXRzWzBdKSkubm9ybWFsaXplKCk7XG5cbiAgICAgICAgbm9ybWFsc1tpbmRleE9uZSArIDBdID0gKG5vcm1hbHNbaW5kZXhPbmUgKyAwXSB8fCAwKSArIG5vcm1hbC54O1xuICAgICAgICBub3JtYWxzW2luZGV4T25lICsgMV0gPSAobm9ybWFsc1tpbmRleE9uZSArIDFdIHx8IDApICsgbm9ybWFsLnk7XG4gICAgICAgIG5vcm1hbHNbaW5kZXhPbmUgKyAyXSA9IChub3JtYWxzW2luZGV4T25lICsgMl0gfHwgMCkgKyBub3JtYWwuejtcblxuICAgICAgICBub3JtYWxzW2luZGV4VHdvICsgMF0gPSAobm9ybWFsc1tpbmRleFR3byArIDBdIHx8IDApICsgbm9ybWFsLng7XG4gICAgICAgIG5vcm1hbHNbaW5kZXhUd28gKyAxXSA9IChub3JtYWxzW2luZGV4VHdvICsgMV0gfHwgMCkgKyBub3JtYWwueTtcbiAgICAgICAgbm9ybWFsc1tpbmRleFR3byArIDJdID0gKG5vcm1hbHNbaW5kZXhUd28gKyAyXSB8fCAwKSArIG5vcm1hbC56O1xuXG4gICAgICAgIG5vcm1hbHNbaW5kZXhUaHJlZSArIDBdID0gKG5vcm1hbHNbaW5kZXhUaHJlZSArIDBdIHx8IDApICsgbm9ybWFsLng7XG4gICAgICAgIG5vcm1hbHNbaW5kZXhUaHJlZSArIDFdID0gKG5vcm1hbHNbaW5kZXhUaHJlZSArIDFdIHx8IDApICsgbm9ybWFsLnk7XG4gICAgICAgIG5vcm1hbHNbaW5kZXhUaHJlZSArIDJdID0gKG5vcm1hbHNbaW5kZXhUaHJlZSArIDJdIHx8IDApICsgbm9ybWFsLno7XG4gICAgfVxuXG4gICAgZm9yIChpID0gMDsgaSA8IG5vcm1hbHMubGVuZ3RoOyBpICs9IDMpIHtcbiAgICAgICAgeCA9IG5vcm1hbHNbaV07XG4gICAgICAgIHkgPSBub3JtYWxzW2krMV07XG4gICAgICAgIHogPSBub3JtYWxzW2krMl07XG4gICAgICAgIGxlbmd0aCA9IE1hdGguc3FydCh4ICogeCArIHkgKiB5ICsgeiAqIHopO1xuICAgICAgICBmb3IoaiA9IDA7IGo8IDM7IGorKykge1xuICAgICAgICAgICAgbm9ybWFsc1tpK2pdIC89IGxlbmd0aDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBub3JtYWxzO1xufTtcblxuLyoqXG4gKiBEaXZpZGVzIGFsbCBpbnNlcnRlZCB0cmlhbmdsZXMgaW50byBmb3VyIHN1Yi10cmlhbmdsZXMuIEFsdGVycyB0aGVcbiAqIHBhc3NlZCBpbiBhcnJheXMuXG4gKlxuICogQHN0YXRpY1xuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IGluZGljZXMgSW5kaWNlcyBkZWNsYXJpbmcgZmFjZXMgb2YgZ2VvbWV0cnlcbiAqIEBwYXJhbSB7QXJyYXl9IHZlcnRpY2VzIFZlcnRpY2VzIG9mIGFsbCBwb2ludHMgb24gdGhlIGdlb21ldHJ5XG4gKiBAcGFyYW0ge0FycmF5fSB0ZXh0dXJlQ29vcmRzIFRleHR1cmUgY29vcmRpbmF0ZXMgb2YgYWxsIHBvaW50cyBvbiB0aGUgZ2VvbWV0cnlcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkdlb21ldHJ5SGVscGVyLnN1YmRpdmlkZSA9IGZ1bmN0aW9uIHN1YmRpdmlkZShpbmRpY2VzLCB2ZXJ0aWNlcywgdGV4dHVyZUNvb3Jkcykge1xuICAgIHZhciB0cmlhbmdsZUluZGV4ID0gaW5kaWNlcy5sZW5ndGggLyAzO1xuICAgIHZhciBmYWNlO1xuICAgIHZhciBpO1xuICAgIHZhciBqO1xuICAgIHZhciBrO1xuICAgIHZhciBwb3M7XG4gICAgdmFyIHRleDtcblxuICAgIHdoaWxlICh0cmlhbmdsZUluZGV4LS0pIHtcbiAgICAgICAgZmFjZSA9IGluZGljZXMuc2xpY2UodHJpYW5nbGVJbmRleCAqIDMsIHRyaWFuZ2xlSW5kZXggKiAzICsgMyk7XG5cbiAgICAgICAgcG9zID0gZmFjZS5tYXAoZnVuY3Rpb24odmVydEluZGV4KSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFZlYzModmVydGljZXNbdmVydEluZGV4ICogM10sIHZlcnRpY2VzW3ZlcnRJbmRleCAqIDMgKyAxXSwgdmVydGljZXNbdmVydEluZGV4ICogMyArIDJdKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHZlcnRpY2VzLnB1c2guYXBwbHkodmVydGljZXMsIFZlYzMuc2NhbGUoVmVjMy5hZGQocG9zWzBdLCBwb3NbMV0sIG91dHB1dHNbMF0pLCAwLjUsIG91dHB1dHNbMV0pLnRvQXJyYXkoKSk7XG4gICAgICAgIHZlcnRpY2VzLnB1c2guYXBwbHkodmVydGljZXMsIFZlYzMuc2NhbGUoVmVjMy5hZGQocG9zWzFdLCBwb3NbMl0sIG91dHB1dHNbMF0pLCAwLjUsIG91dHB1dHNbMV0pLnRvQXJyYXkoKSk7XG4gICAgICAgIHZlcnRpY2VzLnB1c2guYXBwbHkodmVydGljZXMsIFZlYzMuc2NhbGUoVmVjMy5hZGQocG9zWzBdLCBwb3NbMl0sIG91dHB1dHNbMF0pLCAwLjUsIG91dHB1dHNbMV0pLnRvQXJyYXkoKSk7XG5cbiAgICAgICAgaWYgKHRleHR1cmVDb29yZHMpIHtcbiAgICAgICAgICAgIHRleCA9IGZhY2UubWFwKGZ1bmN0aW9uKHZlcnRJbmRleCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVmVjMih0ZXh0dXJlQ29vcmRzW3ZlcnRJbmRleCAqIDJdLCB0ZXh0dXJlQ29vcmRzW3ZlcnRJbmRleCAqIDIgKyAxXSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRleHR1cmVDb29yZHMucHVzaC5hcHBseSh0ZXh0dXJlQ29vcmRzLCBWZWMyLnNjYWxlKFZlYzIuYWRkKHRleFswXSwgdGV4WzFdLCBvdXRwdXRzWzNdKSwgMC41LCBvdXRwdXRzWzRdKS50b0FycmF5KCkpO1xuICAgICAgICAgICAgdGV4dHVyZUNvb3Jkcy5wdXNoLmFwcGx5KHRleHR1cmVDb29yZHMsIFZlYzIuc2NhbGUoVmVjMi5hZGQodGV4WzFdLCB0ZXhbMl0sIG91dHB1dHNbM10pLCAwLjUsIG91dHB1dHNbNF0pLnRvQXJyYXkoKSk7XG4gICAgICAgICAgICB0ZXh0dXJlQ29vcmRzLnB1c2guYXBwbHkodGV4dHVyZUNvb3JkcywgVmVjMi5zY2FsZShWZWMyLmFkZCh0ZXhbMF0sIHRleFsyXSwgb3V0cHV0c1szXSksIDAuNSwgb3V0cHV0c1s0XSkudG9BcnJheSgpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGkgPSB2ZXJ0aWNlcy5sZW5ndGggLSAzO1xuICAgICAgICBqID0gaSArIDE7XG4gICAgICAgIGsgPSBpICsgMjtcblxuICAgICAgICBpbmRpY2VzLnB1c2goaSwgaiwgayk7XG4gICAgICAgIGluZGljZXMucHVzaChmYWNlWzBdLCBpLCBrKTtcbiAgICAgICAgaW5kaWNlcy5wdXNoKGksIGZhY2VbMV0sIGopO1xuICAgICAgICBpbmRpY2VzW3RyaWFuZ2xlSW5kZXhdID0gaztcbiAgICAgICAgaW5kaWNlc1t0cmlhbmdsZUluZGV4ICsgMV0gPSBqO1xuICAgICAgICBpbmRpY2VzW3RyaWFuZ2xlSW5kZXggKyAyXSA9IGZhY2VbMl07XG4gICAgfVxufTtcblxuLyoqXG4gKiBDcmVhdGVzIGR1cGxpY2F0ZSBvZiB2ZXJ0aWNlcyB0aGF0IGFyZSBzaGFyZWQgYmV0d2VlbiBmYWNlcy5cbiAqIEFsdGVycyB0aGUgaW5wdXQgdmVydGV4IGFuZCBpbmRleCBhcnJheXMuXG4gKlxuICogQHN0YXRpY1xuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IHZlcnRpY2VzIFZlcnRpY2VzIG9mIGFsbCBwb2ludHMgb24gdGhlIGdlb21ldHJ5XG4gKiBAcGFyYW0ge0FycmF5fSBpbmRpY2VzIEluZGljZXMgZGVjbGFyaW5nIGZhY2VzIG9mIGdlb21ldHJ5XG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5HZW9tZXRyeUhlbHBlci5nZXRVbmlxdWVGYWNlcyA9IGZ1bmN0aW9uIGdldFVuaXF1ZUZhY2VzKHZlcnRpY2VzLCBpbmRpY2VzKSB7XG4gICAgdmFyIHRyaWFuZ2xlSW5kZXggPSBpbmRpY2VzLmxlbmd0aCAvIDMsXG4gICAgICAgIHJlZ2lzdGVyZWQgPSBbXSxcbiAgICAgICAgaW5kZXg7XG5cbiAgICB3aGlsZSAodHJpYW5nbGVJbmRleC0tKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMzsgaSsrKSB7XG5cbiAgICAgICAgICAgIGluZGV4ID0gaW5kaWNlc1t0cmlhbmdsZUluZGV4ICogMyArIGldO1xuXG4gICAgICAgICAgICBpZiAocmVnaXN0ZXJlZFtpbmRleF0pIHtcbiAgICAgICAgICAgICAgICB2ZXJ0aWNlcy5wdXNoKHZlcnRpY2VzW2luZGV4ICogM10sIHZlcnRpY2VzW2luZGV4ICogMyArIDFdLCB2ZXJ0aWNlc1tpbmRleCAqIDMgKyAyXSk7XG4gICAgICAgICAgICAgICAgaW5kaWNlc1t0cmlhbmdsZUluZGV4ICogMyArIGldID0gdmVydGljZXMubGVuZ3RoIC8gMyAtIDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZWdpc3RlcmVkW2luZGV4XSA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG4vKipcbiAqIERpdmlkZXMgYWxsIGluc2VydGVkIHRyaWFuZ2xlcyBpbnRvIGZvdXIgc3ViLXRyaWFuZ2xlcyB3aGlsZSBtYWludGFpbmluZ1xuICogYSByYWRpdXMgb2Ygb25lLiBBbHRlcnMgdGhlIHBhc3NlZCBpbiBhcnJheXMuXG4gKlxuICogQHN0YXRpY1xuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IHZlcnRpY2VzIFZlcnRpY2VzIG9mIGFsbCBwb2ludHMgb24gdGhlIGdlb21ldHJ5XG4gKiBAcGFyYW0ge0FycmF5fSBpbmRpY2VzIEluZGljZXMgZGVjbGFyaW5nIGZhY2VzIG9mIGdlb21ldHJ5XG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5HZW9tZXRyeUhlbHBlci5zdWJkaXZpZGVTcGhlcm9pZCA9IGZ1bmN0aW9uIHN1YmRpdmlkZVNwaGVyb2lkKHZlcnRpY2VzLCBpbmRpY2VzKSB7XG4gICAgdmFyIHRyaWFuZ2xlSW5kZXggPSBpbmRpY2VzLmxlbmd0aCAvIDMsXG4gICAgICAgIGFiYyxcbiAgICAgICAgZmFjZSxcbiAgICAgICAgaSwgaiwgaztcblxuICAgIHdoaWxlICh0cmlhbmdsZUluZGV4LS0pIHtcbiAgICAgICAgZmFjZSA9IGluZGljZXMuc2xpY2UodHJpYW5nbGVJbmRleCAqIDMsIHRyaWFuZ2xlSW5kZXggKiAzICsgMyk7XG4gICAgICAgIGFiYyA9IGZhY2UubWFwKGZ1bmN0aW9uKHZlcnRJbmRleCkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBWZWMzKHZlcnRpY2VzW3ZlcnRJbmRleCAqIDNdLCB2ZXJ0aWNlc1t2ZXJ0SW5kZXggKiAzICsgMV0sIHZlcnRpY2VzW3ZlcnRJbmRleCAqIDMgKyAyXSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZlcnRpY2VzLnB1c2guYXBwbHkodmVydGljZXMsIFZlYzMubm9ybWFsaXplKFZlYzMuYWRkKGFiY1swXSwgYWJjWzFdLCBvdXRwdXRzWzBdKSwgb3V0cHV0c1sxXSkudG9BcnJheSgpKTtcbiAgICAgICAgdmVydGljZXMucHVzaC5hcHBseSh2ZXJ0aWNlcywgVmVjMy5ub3JtYWxpemUoVmVjMy5hZGQoYWJjWzFdLCBhYmNbMl0sIG91dHB1dHNbMF0pLCBvdXRwdXRzWzFdKS50b0FycmF5KCkpO1xuICAgICAgICB2ZXJ0aWNlcy5wdXNoLmFwcGx5KHZlcnRpY2VzLCBWZWMzLm5vcm1hbGl6ZShWZWMzLmFkZChhYmNbMF0sIGFiY1syXSwgb3V0cHV0c1swXSksIG91dHB1dHNbMV0pLnRvQXJyYXkoKSk7XG5cbiAgICAgICAgaSA9IHZlcnRpY2VzLmxlbmd0aCAvIDMgLSAzO1xuICAgICAgICBqID0gaSArIDE7XG4gICAgICAgIGsgPSBpICsgMjtcblxuICAgICAgICBpbmRpY2VzLnB1c2goaSwgaiwgayk7XG4gICAgICAgIGluZGljZXMucHVzaChmYWNlWzBdLCBpLCBrKTtcbiAgICAgICAgaW5kaWNlcy5wdXNoKGksIGZhY2VbMV0sIGopO1xuICAgICAgICBpbmRpY2VzW3RyaWFuZ2xlSW5kZXggKiAzXSA9IGs7XG4gICAgICAgIGluZGljZXNbdHJpYW5nbGVJbmRleCAqIDMgKyAxXSA9IGo7XG4gICAgICAgIGluZGljZXNbdHJpYW5nbGVJbmRleCAqIDMgKyAyXSA9IGZhY2VbMl07XG4gICAgfVxufTtcblxuLyoqXG4gKiBEaXZpZGVzIGFsbCBpbnNlcnRlZCB0cmlhbmdsZXMgaW50byBmb3VyIHN1Yi10cmlhbmdsZXMgd2hpbGUgbWFpbnRhaW5pbmdcbiAqIGEgcmFkaXVzIG9mIG9uZS4gQWx0ZXJzIHRoZSBwYXNzZWQgaW4gYXJyYXlzLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge0FycmF5fSB2ZXJ0aWNlcyBWZXJ0aWNlcyBvZiBhbGwgcG9pbnRzIG9uIHRoZSBnZW9tZXRyeVxuICogQHBhcmFtIHtBcnJheX0gb3V0IE9wdGlvbmFsIGFycmF5IHRvIGJlIGZpbGxlZCB3aXRoIHJlc3VsdGluZyBub3JtYWxzLlxuICpcbiAqIEByZXR1cm4ge0FycmF5fSBOZXcgbGlzdCBvZiBjYWxjdWxhdGVkIG5vcm1hbHMuXG4gKi9cbkdlb21ldHJ5SGVscGVyLmdldFNwaGVyb2lkTm9ybWFscyA9IGZ1bmN0aW9uIGdldFNwaGVyb2lkTm9ybWFscyh2ZXJ0aWNlcywgb3V0KSB7XG4gICAgb3V0ID0gb3V0IHx8IFtdO1xuICAgIHZhciBsZW5ndGggPSB2ZXJ0aWNlcy5sZW5ndGggLyAzO1xuICAgIHZhciBub3JtYWxpemVkO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBub3JtYWxpemVkID0gbmV3IFZlYzMoXG4gICAgICAgICAgICB2ZXJ0aWNlc1tpICogMyArIDBdLFxuICAgICAgICAgICAgdmVydGljZXNbaSAqIDMgKyAxXSxcbiAgICAgICAgICAgIHZlcnRpY2VzW2kgKiAzICsgMl1cbiAgICAgICAgKS5ub3JtYWxpemUoKS50b0FycmF5KCk7XG5cbiAgICAgICAgb3V0W2kgKiAzICsgMF0gPSBub3JtYWxpemVkWzBdO1xuICAgICAgICBvdXRbaSAqIDMgKyAxXSA9IG5vcm1hbGl6ZWRbMV07XG4gICAgICAgIG91dFtpICogMyArIDJdID0gbm9ybWFsaXplZFsyXTtcbiAgICB9XG5cbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRleHR1cmUgY29vcmRpbmF0ZXMgZm9yIHNwaGVyb2lkIHByaW1pdGl2ZXMgYmFzZWQgb25cbiAqIGlucHV0IHZlcnRpY2VzLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge0FycmF5fSB2ZXJ0aWNlcyBWZXJ0aWNlcyBvZiBhbGwgcG9pbnRzIG9uIHRoZSBnZW9tZXRyeVxuICogQHBhcmFtIHtBcnJheX0gb3V0IE9wdGlvbmFsIGFycmF5IHRvIGJlIGZpbGxlZCB3aXRoIHJlc3VsdGluZyB0ZXh0dXJlIGNvb3JkaW5hdGVzLlxuICpcbiAqIEByZXR1cm4ge0FycmF5fSBOZXcgbGlzdCBvZiBjYWxjdWxhdGVkIHRleHR1cmUgY29vcmRpbmF0ZXNcbiAqL1xuR2VvbWV0cnlIZWxwZXIuZ2V0U3BoZXJvaWRVViA9IGZ1bmN0aW9uIGdldFNwaGVyb2lkVVYodmVydGljZXMsIG91dCkge1xuICAgIG91dCA9IG91dCB8fCBbXTtcbiAgICB2YXIgbGVuZ3RoID0gdmVydGljZXMubGVuZ3RoIC8gMztcbiAgICB2YXIgdmVydGV4O1xuXG4gICAgdmFyIHV2ID0gW107XG5cbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmVydGV4ID0gb3V0cHV0c1swXS5zZXQoXG4gICAgICAgICAgICB2ZXJ0aWNlc1tpICogM10sXG4gICAgICAgICAgICB2ZXJ0aWNlc1tpICogMyArIDFdLFxuICAgICAgICAgICAgdmVydGljZXNbaSAqIDMgKyAyXVxuICAgICAgICApXG4gICAgICAgIC5ub3JtYWxpemUoKVxuICAgICAgICAudG9BcnJheSgpO1xuXG4gICAgICAgIHV2WzBdID0gdGhpcy5nZXRBemltdXRoKHZlcnRleCkgKiAwLjUgLyBNYXRoLlBJICsgMC41O1xuICAgICAgICB1dlsxXSA9IHRoaXMuZ2V0QWx0aXR1ZGUodmVydGV4KSAvIE1hdGguUEkgKyAwLjU7XG5cbiAgICAgICAgb3V0LnB1c2guYXBwbHkob3V0LCB1dik7XG4gICAgfVxuXG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogSXRlcmF0ZXMgdGhyb3VnaCBhbmQgbm9ybWFsaXplcyBhIGxpc3Qgb2YgdmVydGljZXMuXG4gKlxuICogQHN0YXRpY1xuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IHZlcnRpY2VzIFZlcnRpY2VzIG9mIGFsbCBwb2ludHMgb24gdGhlIGdlb21ldHJ5XG4gKiBAcGFyYW0ge0FycmF5fSBvdXQgT3B0aW9uYWwgYXJyYXkgdG8gYmUgZmlsbGVkIHdpdGggcmVzdWx0aW5nIG5vcm1hbGl6ZWQgdmVjdG9ycy5cbiAqXG4gKiBAcmV0dXJuIHtBcnJheX0gTmV3IGxpc3Qgb2Ygbm9ybWFsaXplZCB2ZXJ0aWNlc1xuICovXG5HZW9tZXRyeUhlbHBlci5ub3JtYWxpemVBbGwgPSBmdW5jdGlvbiBub3JtYWxpemVBbGwodmVydGljZXMsIG91dCkge1xuICAgIG91dCA9IG91dCB8fCBbXTtcbiAgICB2YXIgbGVuID0gdmVydGljZXMubGVuZ3RoIC8gMztcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgQXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkob3V0LCBuZXcgVmVjMyh2ZXJ0aWNlc1tpICogM10sIHZlcnRpY2VzW2kgKiAzICsgMV0sIHZlcnRpY2VzW2kgKiAzICsgMl0pLm5vcm1hbGl6ZSgpLnRvQXJyYXkoKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogTm9ybWFsaXplcyBhIHNldCBvZiB2ZXJ0aWNlcyB0byBtb2RlbCBzcGFjZS5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtBcnJheX0gdmVydGljZXMgVmVydGljZXMgb2YgYWxsIHBvaW50cyBvbiB0aGUgZ2VvbWV0cnlcbiAqIEBwYXJhbSB7QXJyYXl9IG91dCBPcHRpb25hbCBhcnJheSB0byBiZSBmaWxsZWQgd2l0aCBtb2RlbCBzcGFjZSBwb3NpdGlvbiB2ZWN0b3JzLlxuICpcbiAqIEByZXR1cm4ge0FycmF5fSBPdXRwdXQgdmVydGljZXMuXG4gKi9cbkdlb21ldHJ5SGVscGVyLm5vcm1hbGl6ZVZlcnRpY2VzID0gZnVuY3Rpb24gbm9ybWFsaXplVmVydGljZXModmVydGljZXMsIG91dCkge1xuICAgIG91dCA9IG91dCB8fCBbXTtcbiAgICB2YXIgbGVuID0gdmVydGljZXMubGVuZ3RoIC8gMztcbiAgICB2YXIgdmVjdG9ycyA9IFtdO1xuICAgIHZhciBtaW5YO1xuICAgIHZhciBtYXhYO1xuICAgIHZhciBtaW5ZO1xuICAgIHZhciBtYXhZO1xuICAgIHZhciBtaW5aO1xuICAgIHZhciBtYXhaO1xuICAgIHZhciB2O1xuICAgIHZhciBpO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIHYgPSB2ZWN0b3JzW2ldID0gbmV3IFZlYzMoXG4gICAgICAgICAgICB2ZXJ0aWNlc1tpICogM10sXG4gICAgICAgICAgICB2ZXJ0aWNlc1tpICogMyArIDFdLFxuICAgICAgICAgICAgdmVydGljZXNbaSAqIDMgKyAyXVxuICAgICAgICApO1xuXG4gICAgICAgIGlmIChtaW5YID09IG51bGwgfHwgdi54IDwgbWluWCkgbWluWCA9IHYueDtcbiAgICAgICAgaWYgKG1heFggPT0gbnVsbCB8fCB2LnggPiBtYXhYKSBtYXhYID0gdi54O1xuXG4gICAgICAgIGlmIChtaW5ZID09IG51bGwgfHwgdi55IDwgbWluWSkgbWluWSA9IHYueTtcbiAgICAgICAgaWYgKG1heFkgPT0gbnVsbCB8fCB2LnkgPiBtYXhZKSBtYXhZID0gdi55O1xuXG4gICAgICAgIGlmIChtaW5aID09IG51bGwgfHwgdi56IDwgbWluWikgbWluWiA9IHYuejtcbiAgICAgICAgaWYgKG1heFogPT0gbnVsbCB8fCB2LnogPiBtYXhaKSBtYXhaID0gdi56O1xuICAgIH1cblxuICAgIHZhciB0cmFuc2xhdGlvbiA9IG5ldyBWZWMzKFxuICAgICAgICBnZXRUcmFuc2xhdGlvbkZhY3RvcihtYXhYLCBtaW5YKSxcbiAgICAgICAgZ2V0VHJhbnNsYXRpb25GYWN0b3IobWF4WSwgbWluWSksXG4gICAgICAgIGdldFRyYW5zbGF0aW9uRmFjdG9yKG1heFosIG1pblopXG4gICAgKTtcblxuICAgIHZhciBzY2FsZSA9IE1hdGgubWluKFxuICAgICAgICBnZXRTY2FsZUZhY3RvcihtYXhYICsgdHJhbnNsYXRpb24ueCwgbWluWCArIHRyYW5zbGF0aW9uLngpLFxuICAgICAgICBnZXRTY2FsZUZhY3RvcihtYXhZICsgdHJhbnNsYXRpb24ueSwgbWluWSArIHRyYW5zbGF0aW9uLnkpLFxuICAgICAgICBnZXRTY2FsZUZhY3RvcihtYXhaICsgdHJhbnNsYXRpb24ueiwgbWluWiArIHRyYW5zbGF0aW9uLnopXG4gICAgKTtcblxuICAgIGZvciAoaSA9IDA7IGkgPCB2ZWN0b3JzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIG91dC5wdXNoLmFwcGx5KG91dCwgdmVjdG9yc1tpXS5hZGQodHJhbnNsYXRpb24pLnNjYWxlKHNjYWxlKS50b0FycmF5KCkpO1xuICAgIH1cblxuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIERldGVybWluZXMgdHJhbnNsYXRpb24gYW1vdW50IGZvciBhIGdpdmVuIGF4aXMgdG8gbm9ybWFsaXplIG1vZGVsIGNvb3JkaW5hdGVzLlxuICpcbiAqIEBtZXRob2RcbiAqIEBwcml2YXRlXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IG1heCBNYXhpbXVtIHBvc2l0aW9uIHZhbHVlIG9mIGdpdmVuIGF4aXMgb24gdGhlIG1vZGVsLlxuICogQHBhcmFtIHtOdW1iZXJ9IG1pbiBNaW5pbXVtIHBvc2l0aW9uIHZhbHVlIG9mIGdpdmVuIGF4aXMgb24gdGhlIG1vZGVsLlxuICpcbiAqIEByZXR1cm4ge051bWJlcn0gTnVtYmVyIGJ5IHdoaWNoIHRoZSBnaXZlbiBheGlzIHNob3VsZCBiZSB0cmFuc2xhdGVkIGZvciBhbGwgdmVydGljZXMuXG4gKi9cbmZ1bmN0aW9uIGdldFRyYW5zbGF0aW9uRmFjdG9yKG1heCwgbWluKSB7XG4gICAgcmV0dXJuIC0obWluICsgKG1heCAtIG1pbikgLyAyKTtcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIHNjYWxlIGFtb3VudCBmb3IgYSBnaXZlbiBheGlzIHRvIG5vcm1hbGl6ZSBtb2RlbCBjb29yZGluYXRlcy5cbiAqXG4gKiBAbWV0aG9kXG4gKiBAcHJpdmF0ZVxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBtYXggTWF4aW11bSBzY2FsZSB2YWx1ZSBvZiBnaXZlbiBheGlzIG9uIHRoZSBtb2RlbC5cbiAqIEBwYXJhbSB7TnVtYmVyfSBtaW4gTWluaW11bSBzY2FsZSB2YWx1ZSBvZiBnaXZlbiBheGlzIG9uIHRoZSBtb2RlbC5cbiAqXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IE51bWJlciBieSB3aGljaCB0aGUgZ2l2ZW4gYXhpcyBzaG91bGQgYmUgc2NhbGVkIGZvciBhbGwgdmVydGljZXMuXG4gKi9cbmZ1bmN0aW9uIGdldFNjYWxlRmFjdG9yKG1heCwgbWluKSB7XG4gICAgcmV0dXJuIDEgLyAoKG1heCAtIG1pbikgLyAyKTtcbn1cblxuLyoqXG4gKiBGaW5kcyB0aGUgYXppbXV0aCwgb3IgYW5nbGUgYWJvdmUgdGhlIFhZIHBsYW5lLCBvZiBhIGdpdmVuIHZlY3Rvci5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtBcnJheX0gdiBWZXJ0ZXggdG8gcmV0cmVpdmUgYXppbXV0aCBmcm9tLlxuICpcbiAqIEByZXR1cm4ge051bWJlcn0gQXppbXV0aCB2YWx1ZSBpbiByYWRpYW5zLlxuICovXG5HZW9tZXRyeUhlbHBlci5nZXRBemltdXRoID0gZnVuY3Rpb24gYXppbXV0aCh2KSB7XG4gICAgcmV0dXJuIE1hdGguYXRhbjIodlsyXSwgLXZbMF0pO1xufTtcblxuLyoqXG4gKiBGaW5kcyB0aGUgYWx0aXR1ZGUsIG9yIGFuZ2xlIGFib3ZlIHRoZSBYWiBwbGFuZSwgb2YgYSBnaXZlbiB2ZWN0b3IuXG4gKlxuICogQHN0YXRpY1xuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IHYgVmVydGV4IHRvIHJldHJlaXZlIGFsdGl0dWRlIGZyb20uXG4gKlxuICogQHJldHVybiB7TnVtYmVyfSBBbHRpdHVkZSB2YWx1ZSBpbiByYWRpYW5zLlxuICovXG5HZW9tZXRyeUhlbHBlci5nZXRBbHRpdHVkZSA9IGZ1bmN0aW9uIGFsdGl0dWRlKHYpIHtcbiAgICByZXR1cm4gTWF0aC5hdGFuMigtdlsxXSwgTWF0aC5zcXJ0KCh2WzBdICogdlswXSkgKyAodlsyXSAqIHZbMl0pKSk7XG59O1xuXG4vKipcbiAqIENvbnZlcnRzIGEgbGlzdCBvZiBpbmRpY2VzIGZyb20gJ3RyaWFuZ2xlJyB0byAnbGluZScgZm9ybWF0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge0FycmF5fSBpbmRpY2VzIEluZGljZXMgb2YgYWxsIGZhY2VzIG9uIHRoZSBnZW9tZXRyeVxuICogQHBhcmFtIHtBcnJheX0gb3V0IEluZGljZXMgb2YgYWxsIGZhY2VzIG9uIHRoZSBnZW9tZXRyeVxuICpcbiAqIEByZXR1cm4ge0FycmF5fSBOZXcgbGlzdCBvZiBsaW5lLWZvcm1hdHRlZCBpbmRpY2VzXG4gKi9cbkdlb21ldHJ5SGVscGVyLnRyaWFuZ2xlc1RvTGluZXMgPSBmdW5jdGlvbiB0cmlhbmdsZVRvTGluZXMoaW5kaWNlcywgb3V0KSB7XG4gICAgdmFyIG51bVZlY3RvcnMgPSBpbmRpY2VzLmxlbmd0aCAvIDM7XG4gICAgb3V0ID0gb3V0IHx8IFtdO1xuICAgIHZhciBpO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IG51bVZlY3RvcnM7IGkrKykge1xuICAgICAgICBvdXQucHVzaChpbmRpY2VzW2kgKiAzICsgMF0sIGluZGljZXNbaSAqIDMgKyAxXSk7XG4gICAgICAgIG91dC5wdXNoKGluZGljZXNbaSAqIDMgKyAxXSwgaW5kaWNlc1tpICogMyArIDJdKTtcbiAgICAgICAgb3V0LnB1c2goaW5kaWNlc1tpICogMyArIDJdLCBpbmRpY2VzW2kgKiAzICsgMF0pO1xuICAgIH1cblxuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEFkZHMgYSByZXZlcnNlIG9yZGVyIHRyaWFuZ2xlIGZvciBldmVyeSB0cmlhbmdsZSBpbiB0aGUgbWVzaC4gQWRkcyBleHRyYSB2ZXJ0aWNlc1xuICogYW5kIGluZGljZXMgdG8gaW5wdXQgYXJyYXlzLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge0FycmF5fSB2ZXJ0aWNlcyBYLCBZLCBaIHBvc2l0aW9ucyBvZiBhbGwgdmVydGljZXMgaW4gdGhlIGdlb21ldHJ5XG4gKiBAcGFyYW0ge0FycmF5fSBpbmRpY2VzIEluZGljZXMgb2YgYWxsIGZhY2VzIG9uIHRoZSBnZW9tZXRyeVxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuR2VvbWV0cnlIZWxwZXIuYWRkQmFja2ZhY2VUcmlhbmdsZXMgPSBmdW5jdGlvbiBhZGRCYWNrZmFjZVRyaWFuZ2xlcyh2ZXJ0aWNlcywgaW5kaWNlcykge1xuICAgIHZhciBuRmFjZXMgPSBpbmRpY2VzLmxlbmd0aCAvIDM7XG5cbiAgICB2YXIgbWF4SW5kZXggPSAwO1xuICAgIHZhciBpID0gaW5kaWNlcy5sZW5ndGg7XG4gICAgd2hpbGUgKGktLSkgaWYgKGluZGljZXNbaV0gPiBtYXhJbmRleCkgbWF4SW5kZXggPSBpbmRpY2VzW2ldO1xuXG4gICAgbWF4SW5kZXgrKztcblxuICAgIGZvciAoaSA9IDA7IGkgPCBuRmFjZXM7IGkrKykge1xuICAgICAgICB2YXIgaW5kZXhPbmUgPSBpbmRpY2VzW2kgKiAzXSxcbiAgICAgICAgICAgIGluZGV4VHdvID0gaW5kaWNlc1tpICogMyArIDFdLFxuICAgICAgICAgICAgaW5kZXhUaHJlZSA9IGluZGljZXNbaSAqIDMgKyAyXTtcblxuICAgICAgICBpbmRpY2VzLnB1c2goaW5kZXhPbmUgKyBtYXhJbmRleCwgaW5kZXhUaHJlZSArIG1heEluZGV4LCBpbmRleFR3byArIG1heEluZGV4KTtcbiAgICB9XG5cbiAgICAvLyBJdGVyYXRpbmcgaW5zdGVhZCBvZiAuc2xpY2UoKSBoZXJlIHRvIGF2b2lkIG1heCBjYWxsIHN0YWNrIGlzc3VlLlxuXG4gICAgdmFyIG5WZXJ0cyA9IHZlcnRpY2VzLmxlbmd0aDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgblZlcnRzOyBpKyspIHtcbiAgICAgICAgdmVydGljZXMucHVzaCh2ZXJ0aWNlc1tpXSk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBHZW9tZXRyeUhlbHBlcjtcbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIEdlb21ldHJ5ID0gcmVxdWlyZSgnLi4vR2VvbWV0cnknKTtcbnZhciBHZW9tZXRyeUhlbHBlciA9IHJlcXVpcmUoJy4uL0dlb21ldHJ5SGVscGVyJyk7XG5cbi8qKlxuICogVGhpcyBmdW5jdGlvbiByZXR1cm5zIGEgbmV3IHN0YXRpYyBnZW9tZXRyeSwgd2hpY2ggaXMgcGFzc2VkXG4gKiBjdXN0b20gYnVmZmVyIGRhdGEuXG4gKlxuICogQGNsYXNzIFBsYW5lXG4gKiBAY29uc3RydWN0b3JcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBQYXJhbWV0ZXJzIHRoYXQgYWx0ZXIgdGhlXG4gKiB2ZXJ0ZXggYnVmZmVycyBvZiB0aGUgZ2VuZXJhdGVkIGdlb21ldHJ5LlxuICpcbiAqIEByZXR1cm4ge09iamVjdH0gY29uc3RydWN0ZWQgZ2VvbWV0cnlcbiAqL1xuZnVuY3Rpb24gUGxhbmUob3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIHZhciBkZXRhaWxYID0gb3B0aW9ucy5kZXRhaWxYIHx8IG9wdGlvbnMuZGV0YWlsIHx8IDE7XG4gICAgdmFyIGRldGFpbFkgPSBvcHRpb25zLmRldGFpbFkgfHwgb3B0aW9ucy5kZXRhaWwgfHwgMTtcblxuICAgIHZhciB2ZXJ0aWNlcyAgICAgID0gW107XG4gICAgdmFyIHRleHR1cmVDb29yZHMgPSBbXTtcbiAgICB2YXIgbm9ybWFscyAgICAgICA9IFtdO1xuICAgIHZhciBpbmRpY2VzICAgICAgID0gW107XG5cbiAgICB2YXIgaTtcblxuICAgIGZvciAodmFyIHkgPSAwOyB5IDw9IGRldGFpbFk7IHkrKykge1xuICAgICAgICB2YXIgdCA9IHkgLyBkZXRhaWxZO1xuICAgICAgICBmb3IgKHZhciB4ID0gMDsgeCA8PSBkZXRhaWxYOyB4KyspIHtcbiAgICAgICAgICAgIHZhciBzID0geCAvIGRldGFpbFg7XG4gICAgICAgICAgICB2ZXJ0aWNlcy5wdXNoKDIuICogKHMgLSAuNSksIDIgKiAodCAtIC41KSwgMCk7XG4gICAgICAgICAgICB0ZXh0dXJlQ29vcmRzLnB1c2gocywgMSAtIHQpO1xuICAgICAgICAgICAgaWYgKHggPCBkZXRhaWxYICYmIHkgPCBkZXRhaWxZKSB7XG4gICAgICAgICAgICAgICAgaSA9IHggKyB5ICogKGRldGFpbFggKyAxKTtcbiAgICAgICAgICAgICAgICBpbmRpY2VzLnB1c2goaSwgaSArIDEsIGkgKyBkZXRhaWxYICsgMSk7XG4gICAgICAgICAgICAgICAgaW5kaWNlcy5wdXNoKGkgKyBkZXRhaWxYICsgMSwgaSArIDEsIGkgKyBkZXRhaWxYICsgMik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAob3B0aW9ucy5iYWNrZmFjZSAhPT0gZmFsc2UpIHtcbiAgICAgICAgR2VvbWV0cnlIZWxwZXIuYWRkQmFja2ZhY2VUcmlhbmdsZXModmVydGljZXMsIGluZGljZXMpO1xuXG4gICAgICAgIC8vIGR1cGxpY2F0ZSB0ZXh0dXJlIGNvb3JkaW5hdGVzIGFzIHdlbGxcblxuICAgICAgICB2YXIgbGVuID0gdGV4dHVyZUNvb3Jkcy5sZW5ndGg7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykgdGV4dHVyZUNvb3Jkcy5wdXNoKHRleHR1cmVDb29yZHNbaV0pO1xuICAgIH1cblxuICAgIG5vcm1hbHMgPSBHZW9tZXRyeUhlbHBlci5jb21wdXRlTm9ybWFscyh2ZXJ0aWNlcywgaW5kaWNlcyk7XG5cbiAgICByZXR1cm4gbmV3IEdlb21ldHJ5KHtcbiAgICAgICAgYnVmZmVyczogW1xuICAgICAgICAgICAgeyBuYW1lOiAnYV9wb3MnLCBkYXRhOiB2ZXJ0aWNlcyB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnYV90ZXhDb29yZCcsIGRhdGE6IHRleHR1cmVDb29yZHMsIHNpemU6IDIgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ2Ffbm9ybWFscycsIGRhdGE6IG5vcm1hbHMgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ2luZGljZXMnLCBkYXRhOiBpbmRpY2VzLCBzaXplOiAxIH1cbiAgICAgICAgXVxuICAgIH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFBsYW5lO1xuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEJ1ZmZlciBpcyBhIHByaXZhdGUgY2xhc3MgdGhhdCB3cmFwcyB0aGUgdmVydGV4IGRhdGEgdGhhdCBkZWZpbmVzXG4gKiB0aGUgdGhlIHBvaW50cyBvZiB0aGUgdHJpYW5nbGVzIHRoYXQgd2ViZ2wgZHJhd3MuIEVhY2ggYnVmZmVyXG4gKiBtYXBzIHRvIG9uZSBhdHRyaWJ1dGUgb2YgYSBtZXNoLlxuICpcbiAqIEBjbGFzcyBCdWZmZXJcbiAqIEBjb25zdHJ1Y3RvclxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSB0YXJnZXQgVGhlIGJpbmQgdGFyZ2V0IG9mIHRoZSBidWZmZXIgdG8gdXBkYXRlOiBBUlJBWV9CVUZGRVIgb3IgRUxFTUVOVF9BUlJBWV9CVUZGRVJcbiAqIEBwYXJhbSB7T2JqZWN0fSB0eXBlIEFycmF5IHR5cGUgdG8gYmUgdXNlZCBpbiBjYWxscyB0byBnbC5idWZmZXJEYXRhLlxuICogQHBhcmFtIHtXZWJHTENvbnRleHR9IGdsIFRoZSBXZWJHTCBjb250ZXh0IHRoYXQgdGhlIGJ1ZmZlciBpcyBob3N0ZWQgYnkuXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuZnVuY3Rpb24gQnVmZmVyKHRhcmdldCwgdHlwZSwgZ2wpIHtcbiAgICB0aGlzLmJ1ZmZlciA9IG51bGw7XG4gICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XG4gICAgdGhpcy50eXBlID0gdHlwZTtcbiAgICB0aGlzLmRhdGEgPSBbXTtcbiAgICB0aGlzLmdsID0gZ2w7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFdlYkdMIGJ1ZmZlciBpZiBvbmUgZG9lcyBub3QgeWV0IGV4aXN0IGFuZCBiaW5kcyB0aGUgYnVmZmVyIHRvXG4gKiB0byB0aGUgY29udGV4dC4gUnVucyBidWZmZXJEYXRhIHdpdGggYXBwcm9wcmlhdGUgZGF0YS5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuQnVmZmVyLnByb3RvdHlwZS5zdWJEYXRhID0gZnVuY3Rpb24gc3ViRGF0YSgpIHtcbiAgICB2YXIgZ2wgPSB0aGlzLmdsO1xuICAgIHZhciBkYXRhID0gW107XG5cbiAgICAvLyB0byBwcmV2ZW50IGFnYWluc3QgbWF4aW11bSBjYWxsLXN0YWNrIGlzc3VlLlxuICAgIGZvciAodmFyIGkgPSAwLCBjaHVuayA9IDEwMDAwOyBpIDwgdGhpcy5kYXRhLmxlbmd0aDsgaSArPSBjaHVuaylcbiAgICAgICAgZGF0YSA9IEFycmF5LnByb3RvdHlwZS5jb25jYXQuYXBwbHkoZGF0YSwgdGhpcy5kYXRhLnNsaWNlKGksIGkgKyBjaHVuaykpO1xuXG4gICAgdGhpcy5idWZmZXIgPSB0aGlzLmJ1ZmZlciB8fCBnbC5jcmVhdGVCdWZmZXIoKTtcbiAgICBnbC5iaW5kQnVmZmVyKHRoaXMudGFyZ2V0LCB0aGlzLmJ1ZmZlcik7XG4gICAgZ2wuYnVmZmVyRGF0YSh0aGlzLnRhcmdldCwgbmV3IHRoaXMudHlwZShkYXRhKSwgZ2wuU1RBVElDX0RSQVcpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBCdWZmZXI7XG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBGYW1vdXMgSW5kdXN0cmllcyBJbmMuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBJTkRJQ0VTID0gJ2luZGljZXMnO1xuXG52YXIgQnVmZmVyID0gcmVxdWlyZSgnLi9CdWZmZXInKTtcblxuLyoqXG4gKiBCdWZmZXJSZWdpc3RyeSBpcyBhIGNsYXNzIHRoYXQgbWFuYWdlcyBhbGxvY2F0aW9uIG9mIGJ1ZmZlcnMgdG9cbiAqIGlucHV0IGdlb21ldHJpZXMuXG4gKlxuICogQGNsYXNzIEJ1ZmZlclJlZ2lzdHJ5XG4gKiBAY29uc3RydWN0b3JcbiAqXG4gKiBAcGFyYW0ge1dlYkdMQ29udGV4dH0gY29udGV4dCBXZWJHTCBkcmF3aW5nIGNvbnRleHQgdG8gYmUgcGFzc2VkIHRvIGJ1ZmZlcnMuXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuZnVuY3Rpb24gQnVmZmVyUmVnaXN0cnkoY29udGV4dCkge1xuICAgIHRoaXMuZ2wgPSBjb250ZXh0O1xuXG4gICAgdGhpcy5yZWdpc3RyeSA9IHt9O1xuICAgIHRoaXMuX2R5bmFtaWNCdWZmZXJzID0gW107XG4gICAgdGhpcy5fc3RhdGljQnVmZmVycyA9IFtdO1xuXG4gICAgdGhpcy5fYXJyYXlCdWZmZXJNYXggPSAzMDAwMDtcbiAgICB0aGlzLl9lbGVtZW50QnVmZmVyTWF4ID0gMzAwMDA7XG59XG5cbi8qKlxuICogQmluZHMgYW5kIGZpbGxzIGFsbCB0aGUgdmVydGV4IGRhdGEgaW50byB3ZWJnbCBidWZmZXJzLiAgV2lsbCByZXVzZSBidWZmZXJzIGlmXG4gKiBwb3NzaWJsZS4gIFBvcHVsYXRlcyByZWdpc3RyeSB3aXRoIHRoZSBuYW1lIG9mIHRoZSBidWZmZXIsIHRoZSBXZWJHTCBidWZmZXJcbiAqIG9iamVjdCwgc3BhY2luZyBvZiB0aGUgYXR0cmlidXRlLCB0aGUgYXR0cmlidXRlJ3Mgb2Zmc2V0IHdpdGhpbiB0aGUgYnVmZmVyLFxuICogYW5kIGZpbmFsbHkgdGhlIGxlbmd0aCBvZiB0aGUgYnVmZmVyLiAgVGhpcyBpbmZvcm1hdGlvbiBpcyBsYXRlciBhY2Nlc3NlZCBieVxuICogdGhlIHJvb3QgdG8gZHJhdyB0aGUgYnVmZmVycy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IGdlb21ldHJ5SWQgSWQgb2YgdGhlIGdlb21ldHJ5IGluc3RhbmNlIHRoYXQgaG9sZHMgdGhlIGJ1ZmZlcnMuXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBLZXkgb2YgdGhlIGlucHV0IGJ1ZmZlciBpbiB0aGUgZ2VvbWV0cnkuXG4gKiBAcGFyYW0ge0FycmF5fSB2YWx1ZSBGbGF0IGFycmF5IGNvbnRhaW5pbmcgaW5wdXQgZGF0YSBmb3IgYnVmZmVyLlxuICogQHBhcmFtIHtOdW1iZXJ9IHNwYWNpbmcgVGhlIHNwYWNpbmcsIG9yIGl0ZW1TaXplLCBvZiB0aGUgaW5wdXQgYnVmZmVyLlxuICogQHBhcmFtIHtCb29sZWFufSBkeW5hbWljIEJvb2xlYW4gZGVub3Rpbmcgd2hldGhlciBhIGdlb21ldHJ5IGlzIGR5bmFtaWMgb3Igc3RhdGljLlxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbkJ1ZmZlclJlZ2lzdHJ5LnByb3RvdHlwZS5hbGxvY2F0ZSA9IGZ1bmN0aW9uIGFsbG9jYXRlKGdlb21ldHJ5SWQsIG5hbWUsIHZhbHVlLCBzcGFjaW5nLCBkeW5hbWljKSB7XG4gICAgdmFyIHZlcnRleEJ1ZmZlcnMgPSB0aGlzLnJlZ2lzdHJ5W2dlb21ldHJ5SWRdIHx8ICh0aGlzLnJlZ2lzdHJ5W2dlb21ldHJ5SWRdID0geyBrZXlzOiBbXSwgdmFsdWVzOiBbXSwgc3BhY2luZzogW10sIG9mZnNldDogW10sIGxlbmd0aDogW10gfSk7XG5cbiAgICB2YXIgaiA9IHZlcnRleEJ1ZmZlcnMua2V5cy5pbmRleE9mKG5hbWUpO1xuICAgIHZhciBpc0luZGV4ID0gbmFtZSA9PT0gSU5ESUNFUztcbiAgICB2YXIgYnVmZmVyRm91bmQgPSBmYWxzZTtcbiAgICB2YXIgbmV3T2Zmc2V0O1xuICAgIHZhciBvZmZzZXQgPSAwO1xuICAgIHZhciBsZW5ndGg7XG4gICAgdmFyIGJ1ZmZlcjtcbiAgICB2YXIgaztcblxuICAgIGlmIChqID09PSAtMSkge1xuICAgICAgICBqID0gdmVydGV4QnVmZmVycy5rZXlzLmxlbmd0aDtcbiAgICAgICAgbGVuZ3RoID0gaXNJbmRleCA/IHZhbHVlLmxlbmd0aCA6IE1hdGguZmxvb3IodmFsdWUubGVuZ3RoIC8gc3BhY2luZyk7XG5cbiAgICAgICAgaWYgKCFkeW5hbWljKSB7XG5cbiAgICAgICAgICAgIC8vIFVzZSBhIHByZXZpb3VzbHkgY3JlYXRlZCBidWZmZXIgaWYgYXZhaWxhYmxlLlxuXG4gICAgICAgICAgICBmb3IgKGsgPSAwOyBrIDwgdGhpcy5fc3RhdGljQnVmZmVycy5sZW5ndGg7IGsrKykge1xuXG4gICAgICAgICAgICAgICAgaWYgKGlzSW5kZXggPT09IHRoaXMuX3N0YXRpY0J1ZmZlcnNba10uaXNJbmRleCkge1xuICAgICAgICAgICAgICAgICAgICBuZXdPZmZzZXQgPSB0aGlzLl9zdGF0aWNCdWZmZXJzW2tdLm9mZnNldCArIHZhbHVlLmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCghaXNJbmRleCAmJiBuZXdPZmZzZXQgPCB0aGlzLl9hcnJheUJ1ZmZlck1heCkgfHwgKGlzSW5kZXggJiYgbmV3T2Zmc2V0IDwgdGhpcy5fZWxlbWVudEJ1ZmZlck1heCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1ZmZlciA9IHRoaXMuX3N0YXRpY0J1ZmZlcnNba10uYnVmZmVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ID0gdGhpcy5fc3RhdGljQnVmZmVyc1trXS5vZmZzZXQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9zdGF0aWNCdWZmZXJzW2tdLm9mZnNldCArPSB2YWx1ZS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICBidWZmZXJGb3VuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQ3JlYXRlIGEgbmV3IHN0YXRpYyBidWZmZXIgaW4gbm9uZSB3ZXJlIGZvdW5kLlxuXG4gICAgICAgICAgICBpZiAoIWJ1ZmZlckZvdW5kKSB7XG4gICAgICAgICAgICAgICAgYnVmZmVyID0gbmV3IEJ1ZmZlcihcbiAgICAgICAgICAgICAgICAgICAgaXNJbmRleCA/IHRoaXMuZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIgOiB0aGlzLmdsLkFSUkFZX0JVRkZFUixcbiAgICAgICAgICAgICAgICAgICAgaXNJbmRleCA/IFVpbnQxNkFycmF5IDogRmxvYXQzMkFycmF5LFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmdsXG4gICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuX3N0YXRpY0J1ZmZlcnMucHVzaCh7IGJ1ZmZlcjogYnVmZmVyLCBvZmZzZXQ6IHZhbHVlLmxlbmd0aCwgaXNJbmRleDogaXNJbmRleCB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcblxuICAgICAgICAgICAgLy8gRm9yIGR5bmFtaWMgZ2VvbWV0cmllcywgYWx3YXlzIGNyZWF0ZSBuZXcgYnVmZmVyLlxuXG4gICAgICAgICAgICBidWZmZXIgPSBuZXcgQnVmZmVyKFxuICAgICAgICAgICAgICAgIGlzSW5kZXggPyB0aGlzLmdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSIDogdGhpcy5nbC5BUlJBWV9CVUZGRVIsXG4gICAgICAgICAgICAgICAgaXNJbmRleCA/IFVpbnQxNkFycmF5IDogRmxvYXQzMkFycmF5LFxuICAgICAgICAgICAgICAgIHRoaXMuZ2xcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHRoaXMuX2R5bmFtaWNCdWZmZXJzLnB1c2goeyBidWZmZXI6IGJ1ZmZlciwgb2Zmc2V0OiB2YWx1ZS5sZW5ndGgsIGlzSW5kZXg6IGlzSW5kZXggfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBVcGRhdGUgdGhlIHJlZ2lzdHJ5IGZvciB0aGUgc3BlYyB3aXRoIGJ1ZmZlciBpbmZvcm1hdGlvbi5cblxuICAgICAgICB2ZXJ0ZXhCdWZmZXJzLmtleXMucHVzaChuYW1lKTtcbiAgICAgICAgdmVydGV4QnVmZmVycy52YWx1ZXMucHVzaChidWZmZXIpO1xuICAgICAgICB2ZXJ0ZXhCdWZmZXJzLnNwYWNpbmcucHVzaChzcGFjaW5nKTtcbiAgICAgICAgdmVydGV4QnVmZmVycy5vZmZzZXQucHVzaChvZmZzZXQpO1xuICAgICAgICB2ZXJ0ZXhCdWZmZXJzLmxlbmd0aC5wdXNoKGxlbmd0aCk7XG4gICAgfVxuXG4gICAgdmFyIGxlbiA9IHZhbHVlLmxlbmd0aDtcbiAgICBmb3IgKGsgPSAwOyBrIDwgbGVuOyBrKyspIHtcbiAgICAgICAgdmVydGV4QnVmZmVycy52YWx1ZXNbal0uZGF0YVtvZmZzZXQgKyBrXSA9IHZhbHVlW2tdO1xuICAgIH1cbiAgICB2ZXJ0ZXhCdWZmZXJzLnZhbHVlc1tqXS5zdWJEYXRhKCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJ1ZmZlclJlZ2lzdHJ5O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBGYW1vdXMgSW5kdXN0cmllcyBJbmMuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4vKipcbiAqIFRha2VzIHRoZSBvcmlnaW5hbCByZW5kZXJpbmcgY29udGV4dHMnIGNvbXBpbGVyIGZ1bmN0aW9uXG4gKiBhbmQgYXVnbWVudHMgaXQgd2l0aCBhZGRlZCBmdW5jdGlvbmFsaXR5IGZvciBwYXJzaW5nIGFuZFxuICogZGlzcGxheWluZyBlcnJvcnMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gQXVnbWVudGVkIGZ1bmN0aW9uXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gRGVidWcoKSB7XG4gICAgcmV0dXJuIF9hdWdtZW50RnVuY3Rpb24oXG4gICAgICAgIHRoaXMuZ2wuY29tcGlsZVNoYWRlcixcbiAgICAgICAgZnVuY3Rpb24oc2hhZGVyKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuZ2V0U2hhZGVyUGFyYW1ldGVyKHNoYWRlciwgdGhpcy5DT01QSUxFX1NUQVRVUykpIHtcbiAgICAgICAgICAgICAgICB2YXIgZXJyb3JzID0gdGhpcy5nZXRTaGFkZXJJbmZvTG9nKHNoYWRlcik7XG4gICAgICAgICAgICAgICAgdmFyIHNvdXJjZSA9IHRoaXMuZ2V0U2hhZGVyU291cmNlKHNoYWRlcik7XG4gICAgICAgICAgICAgICAgX3Byb2Nlc3NFcnJvcnMoZXJyb3JzLCBzb3VyY2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgKTtcbn07XG5cbi8vIFRha2VzIGEgZnVuY3Rpb24sIGtlZXBzIHRoZSByZWZlcmVuY2UgYW5kIHJlcGxhY2VzIGl0IGJ5IGEgY2xvc3VyZSB0aGF0XG4vLyBleGVjdXRlcyB0aGUgb3JpZ2luYWwgZnVuY3Rpb24gYW5kIHRoZSBwcm92aWRlZCBjYWxsYmFjay5cbmZ1bmN0aW9uIF9hdWdtZW50RnVuY3Rpb24oZnVuYywgY2FsbGJhY2spIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciByZXMgPSBmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIGNhbGxiYWNrLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfTtcbn1cblxuLy8gUGFyc2VzIGVycm9ycyBhbmQgZmFpbGVkIHNvdXJjZSBjb2RlIGZyb20gc2hhZGVycyBpbiBvcmRlclxuLy8gdG8gYnVpbGQgZGlzcGxheWFibGUgZXJyb3IgYmxvY2tzLlxuLy8gSW5zcGlyZWQgYnkgSmF1bWUgU2FuY2hleiBFbGlhcy5cbmZ1bmN0aW9uIF9wcm9jZXNzRXJyb3JzKGVycm9ycywgc291cmNlKSB7XG5cbiAgICB2YXIgY3NzID0gJ2JvZHksaHRtbHtiYWNrZ3JvdW5kOiNlM2UzZTM7Zm9udC1mYW1pbHk6bW9uYWNvLG1vbm9zcGFjZTtmb250LXNpemU6MTRweDtsaW5lLWhlaWdodDoxLjdlbX0nICtcbiAgICAgICAgICAgICAgJyNzaGFkZXJSZXBvcnR7bGVmdDowO3RvcDowO3JpZ2h0OjA7Ym94LXNpemluZzpib3JkZXItYm94O3Bvc2l0aW9uOmFic29sdXRlO3otaW5kZXg6MTAwMDtjb2xvcjonICtcbiAgICAgICAgICAgICAgJyMyMjI7cGFkZGluZzoxNXB4O3doaXRlLXNwYWNlOm5vcm1hbDtsaXN0LXN0eWxlLXR5cGU6bm9uZTttYXJnaW46NTBweCBhdXRvO21heC13aWR0aDoxMjAwcHh9JyArXG4gICAgICAgICAgICAgICcjc2hhZGVyUmVwb3J0IGxpe2JhY2tncm91bmQtY29sb3I6I2ZmZjttYXJnaW46MTNweCAwO2JveC1zaGFkb3c6MCAxcHggMnB4IHJnYmEoMCwwLDAsLjE1KTsnICtcbiAgICAgICAgICAgICAgJ3BhZGRpbmc6MjBweCAzMHB4O2JvcmRlci1yYWRpdXM6MnB4O2JvcmRlci1sZWZ0OjIwcHggc29saWQgI2UwMTExMX1zcGFue2NvbG9yOiNlMDExMTE7JyArXG4gICAgICAgICAgICAgICd0ZXh0LWRlY29yYXRpb246dW5kZXJsaW5lO2ZvbnQtd2VpZ2h0OjcwMH0jc2hhZGVyUmVwb3J0IGxpIHB7cGFkZGluZzowO21hcmdpbjowfScgK1xuICAgICAgICAgICAgICAnI3NoYWRlclJlcG9ydCBsaTpudGgtY2hpbGQoZXZlbil7YmFja2dyb3VuZC1jb2xvcjojZjRmNGY0fScgK1xuICAgICAgICAgICAgICAnI3NoYWRlclJlcG9ydCBsaSBwOmZpcnN0LWNoaWxke21hcmdpbi1ib3R0b206MTBweDtjb2xvcjojNjY2fSc7XG5cbiAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0uYXBwZW5kQ2hpbGQoZWwpO1xuICAgIGVsLnRleHRDb250ZW50ID0gY3NzO1xuXG4gICAgdmFyIHJlcG9ydCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3VsJyk7XG4gICAgcmVwb3J0LnNldEF0dHJpYnV0ZSgnaWQnLCAnc2hhZGVyUmVwb3J0Jyk7XG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChyZXBvcnQpO1xuXG4gICAgdmFyIHJlID0gL0VSUk9SOiBbXFxkXSs6KFtcXGRdKyk6ICguKykvZ21pO1xuICAgIHZhciBsaW5lcyA9IHNvdXJjZS5zcGxpdCgnXFxuJyk7XG5cbiAgICB2YXIgbTtcbiAgICB3aGlsZSAoKG0gPSByZS5leGVjKGVycm9ycykpICE9IG51bGwpIHtcbiAgICAgICAgaWYgKG0uaW5kZXggPT09IHJlLmxhc3RJbmRleCkgcmUubGFzdEluZGV4Kys7XG4gICAgICAgIHZhciBsaSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG4gICAgICAgIHZhciBjb2RlID0gJzxwPjxzcGFuPkVSUk9SPC9zcGFuPiBcIicgKyBtWzJdICsgJ1wiIGluIGxpbmUgJyArIG1bMV0gKyAnPC9wPic7XG4gICAgICAgIGNvZGUgKz0gJzxwPjxiPicgKyBsaW5lc1ttWzFdIC0gMV0ucmVwbGFjZSgvXlsgXFx0XSsvZywgJycpICsgJzwvYj48L3A+JztcbiAgICAgICAgbGkuaW5uZXJIVE1MID0gY29kZTtcbiAgICAgICAgcmVwb3J0LmFwcGVuZENoaWxkKGxpKTtcbiAgICB9XG59XG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBGYW1vdXMgSW5kdXN0cmllcyBJbmMuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBjbG9uZSA9IHJlcXVpcmUoJy4uL3V0aWxpdGllcy9jbG9uZScpO1xudmFyIGtleVZhbHVlVG9BcnJheXMgPSByZXF1aXJlKCcuLi91dGlsaXRpZXMva2V5VmFsdWVUb0FycmF5cycpO1xuXG52YXIgdmVydGV4V3JhcHBlciA9IHJlcXVpcmUoJy4uL3dlYmdsLXNoYWRlcnMnKS52ZXJ0ZXg7XG52YXIgZnJhZ21lbnRXcmFwcGVyID0gcmVxdWlyZSgnLi4vd2ViZ2wtc2hhZGVycycpLmZyYWdtZW50O1xudmFyIERlYnVnID0gcmVxdWlyZSgnLi9EZWJ1ZycpO1xuXG52YXIgVkVSVEVYX1NIQURFUiA9IDM1NjMzO1xudmFyIEZSQUdNRU5UX1NIQURFUiA9IDM1NjMyO1xudmFyIGlkZW50aXR5TWF0cml4ID0gWzEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDFdO1xuXG52YXIgaGVhZGVyID0gJ3ByZWNpc2lvbiBtZWRpdW1wIGZsb2F0O1xcbic7XG5cbnZhciBUWVBFUyA9IHtcbiAgICB1bmRlZmluZWQ6ICdmbG9hdCAnLFxuICAgIDE6ICdmbG9hdCAnLFxuICAgIDI6ICd2ZWMyICcsXG4gICAgMzogJ3ZlYzMgJyxcbiAgICA0OiAndmVjNCAnLFxuICAgIDE2OiAnbWF0NCAnXG59O1xuXG52YXIgaW5wdXRUeXBlcyA9IHtcbiAgICB1X2Jhc2VDb2xvcjogJ3ZlYzQnLFxuICAgIHVfbm9ybWFsczogJ3ZlcnQnLFxuICAgIHVfZ2xvc3NpbmVzczogJ3ZlYzQnLFxuICAgIHVfcG9zaXRpb25PZmZzZXQ6ICd2ZXJ0J1xufTtcblxudmFyIG1hc2tzID0gIHtcbiAgICB2ZXJ0OiAxLFxuICAgIHZlYzM6IDIsXG4gICAgdmVjNDogNCxcbiAgICBmbG9hdDogOFxufTtcblxuLyoqXG4gKiBVbmlmb3JtIGtleXMgYW5kIHZhbHVlc1xuICovXG52YXIgdW5pZm9ybXMgPSBrZXlWYWx1ZVRvQXJyYXlzKHtcbiAgICB1X3BlcnNwZWN0aXZlOiBpZGVudGl0eU1hdHJpeCxcbiAgICB1X3ZpZXc6IGlkZW50aXR5TWF0cml4LFxuICAgIHVfcmVzb2x1dGlvbjogWzAsIDAsIDBdLFxuICAgIHVfdHJhbnNmb3JtOiBpZGVudGl0eU1hdHJpeCxcbiAgICB1X3NpemU6IFsxLCAxLCAxXSxcbiAgICB1X3RpbWU6IDAsXG4gICAgdV9vcGFjaXR5OiAxLFxuICAgIHVfbWV0YWxuZXNzOiAwLFxuICAgIHVfZ2xvc3NpbmVzczogWzAsIDAsIDAsIDBdLFxuICAgIHVfYmFzZUNvbG9yOiBbMSwgMSwgMSwgMV0sXG4gICAgdV9ub3JtYWxzOiBbMSwgMSwgMV0sXG4gICAgdV9wb3NpdGlvbk9mZnNldDogWzAsIDAsIDBdLFxuICAgIHVfbGlnaHRQb3NpdGlvbjogaWRlbnRpdHlNYXRyaXgsXG4gICAgdV9saWdodENvbG9yOiBpZGVudGl0eU1hdHJpeCxcbiAgICB1X2FtYmllbnRMaWdodDogWzAsIDAsIDBdLFxuICAgIHVfZmxhdFNoYWRpbmc6IDAsXG4gICAgdV9udW1MaWdodHM6IDBcbn0pO1xuXG4vKipcbiAqIEF0dHJpYnV0ZXMga2V5cyBhbmQgdmFsdWVzXG4gKi9cbnZhciBhdHRyaWJ1dGVzID0ga2V5VmFsdWVUb0FycmF5cyh7XG4gICAgYV9wb3M6IFswLCAwLCAwXSxcbiAgICBhX3RleENvb3JkOiBbMCwgMF0sXG4gICAgYV9ub3JtYWxzOiBbMCwgMCwgMF1cbn0pO1xuXG4vKipcbiAqIFZhcnlpbmdzIGtleXMgYW5kIHZhbHVlc1xuICovXG52YXIgdmFyeWluZ3MgPSBrZXlWYWx1ZVRvQXJyYXlzKHtcbiAgICB2X3RleHR1cmVDb29yZGluYXRlOiBbMCwgMF0sXG4gICAgdl9ub3JtYWw6IFswLCAwLCAwXSxcbiAgICB2X3Bvc2l0aW9uOiBbMCwgMCwgMF0sXG4gICAgdl9leWVWZWN0b3I6IFswLCAwLCAwXVxufSk7XG5cbi8qKlxuICogQSBjbGFzcyB0aGF0IGhhbmRsZXMgaW50ZXJhY3Rpb25zIHdpdGggdGhlIFdlYkdMIHNoYWRlciBwcm9ncmFtXG4gKiB1c2VkIGJ5IGEgc3BlY2lmaWMgY29udGV4dC4gIEl0IG1hbmFnZXMgY3JlYXRpb24gb2YgdGhlIHNoYWRlciBwcm9ncmFtXG4gKiBhbmQgdGhlIGF0dGFjaGVkIHZlcnRleCBhbmQgZnJhZ21lbnQgc2hhZGVycy4gIEl0IGlzIGFsc28gaW4gY2hhcmdlIG9mXG4gKiBwYXNzaW5nIGFsbCB1bmlmb3JtcyB0byB0aGUgV2ViR0xDb250ZXh0LlxuICpcbiAqIEBjbGFzcyBQcm9ncmFtXG4gKiBAY29uc3RydWN0b3JcbiAqXG4gKiBAcGFyYW0ge1dlYkdMX0NvbnRleHR9IGdsIENvbnRleHQgdG8gYmUgdXNlZCB0byBjcmVhdGUgdGhlIHNoYWRlciBwcm9ncmFtXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBQcm9ncmFtIG9wdGlvbnNcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5mdW5jdGlvbiBQcm9ncmFtKGdsLCBvcHRpb25zKSB7XG4gICAgdGhpcy5nbCA9IGdsO1xuICAgIHRoaXMudGV4dHVyZVNsb3RzID0gMTtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgdGhpcy5yZWdpc3RlcmVkTWF0ZXJpYWxzID0ge307XG4gICAgdGhpcy5mbGFnZ2VkVW5pZm9ybXMgPSBbXTtcbiAgICB0aGlzLmNhY2hlZFVuaWZvcm1zICA9IHt9O1xuICAgIHRoaXMudW5pZm9ybVR5cGVzID0gW107XG5cbiAgICB0aGlzLmRlZmluaXRpb25WZWM0ID0gW107XG4gICAgdGhpcy5kZWZpbml0aW9uVmVjMyA9IFtdO1xuICAgIHRoaXMuZGVmaW5pdGlvbkZsb2F0ID0gW107XG4gICAgdGhpcy5hcHBsaWNhdGlvblZlYzMgPSBbXTtcbiAgICB0aGlzLmFwcGxpY2F0aW9uVmVjNCA9IFtdO1xuICAgIHRoaXMuYXBwbGljYXRpb25GbG9hdCA9IFtdO1xuICAgIHRoaXMuYXBwbGljYXRpb25WZXJ0ID0gW107XG4gICAgdGhpcy5kZWZpbml0aW9uVmVydCA9IFtdO1xuXG4gICAgdGhpcy5yZXNldFByb2dyYW0oKTtcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIHdoZXRoZXIgYSBtYXRlcmlhbCBoYXMgYWxyZWFkeSBiZWVuIHJlZ2lzdGVyZWQgdG9cbiAqIHRoZSBzaGFkZXIgcHJvZ3JhbS5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgTmFtZSBvZiB0YXJnZXQgaW5wdXQgb2YgbWF0ZXJpYWwuXG4gKiBAcGFyYW0ge09iamVjdH0gbWF0ZXJpYWwgQ29tcGlsZWQgbWF0ZXJpYWwgb2JqZWN0IGJlaW5nIHZlcmlmaWVkLlxuICpcbiAqIEByZXR1cm4ge1Byb2dyYW19IHRoaXMgQ3VycmVudCBwcm9ncmFtLlxuICovXG5Qcm9ncmFtLnByb3RvdHlwZS5yZWdpc3Rlck1hdGVyaWFsID0gZnVuY3Rpb24gcmVnaXN0ZXJNYXRlcmlhbChuYW1lLCBtYXRlcmlhbCkge1xuICAgIHZhciBjb21waWxlZCA9IG1hdGVyaWFsO1xuICAgIHZhciB0eXBlID0gaW5wdXRUeXBlc1tuYW1lXTtcbiAgICB2YXIgbWFzayA9IG1hc2tzW3R5cGVdO1xuXG4gICAgaWYgKCh0aGlzLnJlZ2lzdGVyZWRNYXRlcmlhbHNbbWF0ZXJpYWwuX2lkXSAmIG1hc2spID09PSBtYXNrKSByZXR1cm4gdGhpcztcblxuICAgIHZhciBrO1xuXG4gICAgZm9yIChrIGluIGNvbXBpbGVkLnVuaWZvcm1zKSB7XG4gICAgICAgIGlmICh1bmlmb3Jtcy5rZXlzLmluZGV4T2YoaykgPT09IC0xKSB7XG4gICAgICAgICAgICB1bmlmb3Jtcy5rZXlzLnB1c2goayk7XG4gICAgICAgICAgICB1bmlmb3Jtcy52YWx1ZXMucHVzaChjb21waWxlZC51bmlmb3Jtc1trXSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGsgaW4gY29tcGlsZWQudmFyeWluZ3MpIHtcbiAgICAgICAgaWYgKHZhcnlpbmdzLmtleXMuaW5kZXhPZihrKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIHZhcnlpbmdzLmtleXMucHVzaChrKTtcbiAgICAgICAgICAgIHZhcnlpbmdzLnZhbHVlcy5wdXNoKGNvbXBpbGVkLnZhcnlpbmdzW2tdKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZvciAoayBpbiBjb21waWxlZC5hdHRyaWJ1dGVzKSB7XG4gICAgICAgIGlmIChhdHRyaWJ1dGVzLmtleXMuaW5kZXhPZihrKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIGF0dHJpYnV0ZXMua2V5cy5wdXNoKGspO1xuICAgICAgICAgICAgYXR0cmlidXRlcy52YWx1ZXMucHVzaChjb21waWxlZC5hdHRyaWJ1dGVzW2tdKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMucmVnaXN0ZXJlZE1hdGVyaWFsc1ttYXRlcmlhbC5faWRdIHw9IG1hc2s7XG5cbiAgICBpZiAodHlwZSA9PT0gJ2Zsb2F0Jykge1xuICAgICAgICB0aGlzLmRlZmluaXRpb25GbG9hdC5wdXNoKG1hdGVyaWFsLmRlZmluZXMpO1xuICAgICAgICB0aGlzLmRlZmluaXRpb25GbG9hdC5wdXNoKCdmbG9hdCBmYV8nICsgbWF0ZXJpYWwuX2lkICsgJygpIHtcXG4gJyAgKyBjb21waWxlZC5nbHNsICsgJyBcXG59Jyk7XG4gICAgICAgIHRoaXMuYXBwbGljYXRpb25GbG9hdC5wdXNoKCdpZiAoaW50KGFicyhJRCkpID09ICcgKyBtYXRlcmlhbC5faWQgKyAnKSByZXR1cm4gZmFfJyArIG1hdGVyaWFsLl9pZCAgKyAnKCk7Jyk7XG4gICAgfVxuXG4gICAgaWYgKHR5cGUgPT09ICd2ZWMzJykge1xuICAgICAgICB0aGlzLmRlZmluaXRpb25WZWMzLnB1c2gobWF0ZXJpYWwuZGVmaW5lcyk7XG4gICAgICAgIHRoaXMuZGVmaW5pdGlvblZlYzMucHVzaCgndmVjMyBmYV8nICsgbWF0ZXJpYWwuX2lkICsgJygpIHtcXG4gJyAgKyBjb21waWxlZC5nbHNsICsgJyBcXG59Jyk7XG4gICAgICAgIHRoaXMuYXBwbGljYXRpb25WZWMzLnB1c2goJ2lmIChpbnQoYWJzKElELngpKSA9PSAnICsgbWF0ZXJpYWwuX2lkICsgJykgcmV0dXJuIGZhXycgKyBtYXRlcmlhbC5faWQgKyAnKCk7Jyk7XG4gICAgfVxuXG4gICAgaWYgKHR5cGUgPT09ICd2ZWM0Jykge1xuICAgICAgICB0aGlzLmRlZmluaXRpb25WZWM0LnB1c2gobWF0ZXJpYWwuZGVmaW5lcyk7XG4gICAgICAgIHRoaXMuZGVmaW5pdGlvblZlYzQucHVzaCgndmVjNCBmYV8nICsgbWF0ZXJpYWwuX2lkICsgJygpIHtcXG4gJyAgKyBjb21waWxlZC5nbHNsICsgJyBcXG59Jyk7XG4gICAgICAgIHRoaXMuYXBwbGljYXRpb25WZWM0LnB1c2goJ2lmIChpbnQoYWJzKElELngpKSA9PSAnICsgbWF0ZXJpYWwuX2lkICsgJykgcmV0dXJuIGZhXycgKyBtYXRlcmlhbC5faWQgKyAnKCk7Jyk7XG4gICAgfVxuXG4gICAgaWYgKHR5cGUgPT09ICd2ZXJ0Jykge1xuICAgICAgICB0aGlzLmRlZmluaXRpb25WZXJ0LnB1c2gobWF0ZXJpYWwuZGVmaW5lcyk7XG4gICAgICAgIHRoaXMuZGVmaW5pdGlvblZlcnQucHVzaCgndmVjMyBmYV8nICsgbWF0ZXJpYWwuX2lkICsgJygpIHtcXG4gJyAgKyBjb21waWxlZC5nbHNsICsgJyBcXG59Jyk7XG4gICAgICAgIHRoaXMuYXBwbGljYXRpb25WZXJ0LnB1c2goJ2lmIChpbnQoYWJzKElELngpKSA9PSAnICsgbWF0ZXJpYWwuX2lkICsgJykgcmV0dXJuIGZhXycgKyBtYXRlcmlhbC5faWQgKyAnKCk7Jyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMucmVzZXRQcm9ncmFtKCk7XG59O1xuXG4vKipcbiAqIENsZWFycyBhbGwgY2FjaGVkIHVuaWZvcm1zIGFuZCBhdHRyaWJ1dGUgbG9jYXRpb25zLiAgQXNzZW1ibGVzXG4gKiBuZXcgZnJhZ21lbnQgYW5kIHZlcnRleCBzaGFkZXJzIGFuZCBiYXNlZCBvbiBtYXRlcmlhbCBmcm9tXG4gKiBjdXJyZW50bHkgcmVnaXN0ZXJlZCBtYXRlcmlhbHMuICBBdHRhY2hlcyBzYWlkIHNoYWRlcnMgdG8gbmV3XG4gKiBzaGFkZXIgcHJvZ3JhbSBhbmQgdXBvbiBzdWNjZXNzIGxpbmtzIHByb2dyYW0gdG8gdGhlIFdlYkdMXG4gKiBjb250ZXh0LlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHtQcm9ncmFtfSBDdXJyZW50IHByb2dyYW0uXG4gKi9cblByb2dyYW0ucHJvdG90eXBlLnJlc2V0UHJvZ3JhbSA9IGZ1bmN0aW9uIHJlc2V0UHJvZ3JhbSgpIHtcbiAgICB2YXIgdmVydGV4SGVhZGVyID0gW2hlYWRlcl07XG4gICAgdmFyIGZyYWdtZW50SGVhZGVyID0gW2hlYWRlcl07XG5cbiAgICB2YXIgZnJhZ21lbnRTb3VyY2U7XG4gICAgdmFyIHZlcnRleFNvdXJjZTtcbiAgICB2YXIgcHJvZ3JhbTtcbiAgICB2YXIgbmFtZTtcbiAgICB2YXIgdmFsdWU7XG4gICAgdmFyIGk7XG5cbiAgICB0aGlzLnVuaWZvcm1Mb2NhdGlvbnMgICA9IFtdO1xuICAgIHRoaXMuYXR0cmlidXRlTG9jYXRpb25zID0ge307XG5cbiAgICB0aGlzLnVuaWZvcm1UeXBlcyA9IHt9O1xuXG4gICAgdGhpcy5hdHRyaWJ1dGVOYW1lcyA9IGNsb25lKGF0dHJpYnV0ZXMua2V5cyk7XG4gICAgdGhpcy5hdHRyaWJ1dGVWYWx1ZXMgPSBjbG9uZShhdHRyaWJ1dGVzLnZhbHVlcyk7XG5cbiAgICB0aGlzLnZhcnlpbmdOYW1lcyA9IGNsb25lKHZhcnlpbmdzLmtleXMpO1xuICAgIHRoaXMudmFyeWluZ1ZhbHVlcyA9IGNsb25lKHZhcnlpbmdzLnZhbHVlcyk7XG5cbiAgICB0aGlzLnVuaWZvcm1OYW1lcyA9IGNsb25lKHVuaWZvcm1zLmtleXMpO1xuICAgIHRoaXMudW5pZm9ybVZhbHVlcyA9IGNsb25lKHVuaWZvcm1zLnZhbHVlcyk7XG5cbiAgICB0aGlzLmZsYWdnZWRVbmlmb3JtcyA9IFtdO1xuICAgIHRoaXMuY2FjaGVkVW5pZm9ybXMgPSB7fTtcblxuICAgIGZyYWdtZW50SGVhZGVyLnB1c2goJ3VuaWZvcm0gc2FtcGxlcjJEIHVfdGV4dHVyZXNbN107XFxuJyk7XG5cbiAgICBpZiAodGhpcy5hcHBsaWNhdGlvblZlcnQubGVuZ3RoKSB7XG4gICAgICAgIHZlcnRleEhlYWRlci5wdXNoKCd1bmlmb3JtIHNhbXBsZXIyRCB1X3RleHR1cmVzWzddO1xcbicpO1xuICAgIH1cblxuICAgIGZvcihpID0gMDsgaSA8IHRoaXMudW5pZm9ybU5hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIG5hbWUgPSB0aGlzLnVuaWZvcm1OYW1lc1tpXTtcbiAgICAgICAgdmFsdWUgPSB0aGlzLnVuaWZvcm1WYWx1ZXNbaV07XG4gICAgICAgIHZlcnRleEhlYWRlci5wdXNoKCd1bmlmb3JtICcgKyBUWVBFU1t2YWx1ZS5sZW5ndGhdICsgbmFtZSArICc7XFxuJyk7XG4gICAgICAgIGZyYWdtZW50SGVhZGVyLnB1c2goJ3VuaWZvcm0gJyArIFRZUEVTW3ZhbHVlLmxlbmd0aF0gKyBuYW1lICsgJztcXG4nKTtcbiAgICB9XG5cbiAgICBmb3IoaSA9IDA7IGkgPCB0aGlzLmF0dHJpYnV0ZU5hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIG5hbWUgPSB0aGlzLmF0dHJpYnV0ZU5hbWVzW2ldO1xuICAgICAgICB2YWx1ZSA9IHRoaXMuYXR0cmlidXRlVmFsdWVzW2ldO1xuICAgICAgICB2ZXJ0ZXhIZWFkZXIucHVzaCgnYXR0cmlidXRlICcgKyBUWVBFU1t2YWx1ZS5sZW5ndGhdICsgbmFtZSArICc7XFxuJyk7XG4gICAgfVxuXG4gICAgZm9yKGkgPSAwOyBpIDwgdGhpcy52YXJ5aW5nTmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbmFtZSA9IHRoaXMudmFyeWluZ05hbWVzW2ldO1xuICAgICAgICB2YWx1ZSA9IHRoaXMudmFyeWluZ1ZhbHVlc1tpXTtcbiAgICAgICAgdmVydGV4SGVhZGVyLnB1c2goJ3ZhcnlpbmcgJyArIFRZUEVTW3ZhbHVlLmxlbmd0aF0gICsgbmFtZSArICc7XFxuJyk7XG4gICAgICAgIGZyYWdtZW50SGVhZGVyLnB1c2goJ3ZhcnlpbmcgJyArIFRZUEVTW3ZhbHVlLmxlbmd0aF0gKyBuYW1lICsgJztcXG4nKTtcbiAgICB9XG5cbiAgICB2ZXJ0ZXhTb3VyY2UgPSB2ZXJ0ZXhIZWFkZXIuam9pbignJykgKyB2ZXJ0ZXhXcmFwcGVyXG4gICAgICAgIC5yZXBsYWNlKCcjdmVydF9kZWZpbml0aW9ucycsIHRoaXMuZGVmaW5pdGlvblZlcnQuam9pbignXFxuJykpXG4gICAgICAgIC5yZXBsYWNlKCcjdmVydF9hcHBsaWNhdGlvbnMnLCB0aGlzLmFwcGxpY2F0aW9uVmVydC5qb2luKCdcXG4nKSk7XG5cbiAgICBmcmFnbWVudFNvdXJjZSA9IGZyYWdtZW50SGVhZGVyLmpvaW4oJycpICsgZnJhZ21lbnRXcmFwcGVyXG4gICAgICAgIC5yZXBsYWNlKCcjdmVjM19kZWZpbml0aW9ucycsIHRoaXMuZGVmaW5pdGlvblZlYzMuam9pbignXFxuJykpXG4gICAgICAgIC5yZXBsYWNlKCcjdmVjM19hcHBsaWNhdGlvbnMnLCB0aGlzLmFwcGxpY2F0aW9uVmVjMy5qb2luKCdcXG4nKSlcbiAgICAgICAgLnJlcGxhY2UoJyN2ZWM0X2RlZmluaXRpb25zJywgdGhpcy5kZWZpbml0aW9uVmVjNC5qb2luKCdcXG4nKSlcbiAgICAgICAgLnJlcGxhY2UoJyN2ZWM0X2FwcGxpY2F0aW9ucycsIHRoaXMuYXBwbGljYXRpb25WZWM0LmpvaW4oJ1xcbicpKVxuICAgICAgICAucmVwbGFjZSgnI2Zsb2F0X2RlZmluaXRpb25zJywgdGhpcy5kZWZpbml0aW9uRmxvYXQuam9pbignXFxuJykpXG4gICAgICAgIC5yZXBsYWNlKCcjZmxvYXRfYXBwbGljYXRpb25zJywgdGhpcy5hcHBsaWNhdGlvbkZsb2F0LmpvaW4oJ1xcbicpKTtcblxuICAgIHByb2dyYW0gPSB0aGlzLmdsLmNyZWF0ZVByb2dyYW0oKTtcblxuICAgIHRoaXMuZ2wuYXR0YWNoU2hhZGVyKFxuICAgICAgICBwcm9ncmFtLFxuICAgICAgICB0aGlzLmNvbXBpbGVTaGFkZXIodGhpcy5nbC5jcmVhdGVTaGFkZXIoVkVSVEVYX1NIQURFUiksIHZlcnRleFNvdXJjZSlcbiAgICApO1xuXG4gICAgdGhpcy5nbC5hdHRhY2hTaGFkZXIoXG4gICAgICAgIHByb2dyYW0sXG4gICAgICAgIHRoaXMuY29tcGlsZVNoYWRlcih0aGlzLmdsLmNyZWF0ZVNoYWRlcihGUkFHTUVOVF9TSEFERVIpLCBmcmFnbWVudFNvdXJjZSlcbiAgICApO1xuXG4gICAgdGhpcy5nbC5saW5rUHJvZ3JhbShwcm9ncmFtKTtcblxuICAgIGlmICghIHRoaXMuZ2wuZ2V0UHJvZ3JhbVBhcmFtZXRlcihwcm9ncmFtLCB0aGlzLmdsLkxJTktfU1RBVFVTKSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdsaW5rIGVycm9yOiAnICsgdGhpcy5nbC5nZXRQcm9ncmFtSW5mb0xvZyhwcm9ncmFtKSk7XG4gICAgICAgIHRoaXMucHJvZ3JhbSA9IG51bGw7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB0aGlzLnByb2dyYW0gPSBwcm9ncmFtO1xuICAgICAgICB0aGlzLmdsLnVzZVByb2dyYW0odGhpcy5wcm9ncmFtKTtcbiAgICB9XG5cbiAgICB0aGlzLnNldFVuaWZvcm1zKHRoaXMudW5pZm9ybU5hbWVzLCB0aGlzLnVuaWZvcm1WYWx1ZXMpO1xuXG4gICAgdmFyIHRleHR1cmVMb2NhdGlvbiA9IHRoaXMuZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHRoaXMucHJvZ3JhbSwgJ3VfdGV4dHVyZXNbMF0nKTtcbiAgICB0aGlzLmdsLnVuaWZvcm0xaXYodGV4dHVyZUxvY2F0aW9uLCBbMCwgMSwgMiwgMywgNCwgNSwgNl0pO1xuXG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIENvbXBhcmVzIHRoZSB2YWx1ZSBvZiB0aGUgaW5wdXQgdW5pZm9ybSB2YWx1ZSBhZ2FpbnN0XG4gKiB0aGUgY2FjaGVkIHZhbHVlIHN0b3JlZCBvbiB0aGUgUHJvZ3JhbSBjbGFzcy4gIFVwZGF0ZXMgYW5kXG4gKiBjcmVhdGVzIG5ldyBlbnRyaWVzIGluIHRoZSBjYWNoZSB3aGVuIG5lY2Vzc2FyeS5cbiAqXG4gKiBAbWV0aG9kXG4gKiBAcGFyYW0ge1N0cmluZ30gdGFyZ2V0TmFtZSBLZXkgb2YgdW5pZm9ybSBzcGVjIGJlaW5nIGV2YWx1YXRlZC5cbiAqIEBwYXJhbSB7TnVtYmVyfEFycmF5fSB2YWx1ZSBWYWx1ZSBvZiB1bmlmb3JtIHNwZWMgYmVpbmcgZXZhbHVhdGVkLlxuICpcbiAqIEByZXR1cm4ge0Jvb2xlYW59IGJvb2xlYW4gSW5kaWNhdGluZyB3aGV0aGVyIHRoZSB1bmlmb3JtIGJlaW5nIHNldCBpcyBjYWNoZWQuXG4gKi9cblByb2dyYW0ucHJvdG90eXBlLnVuaWZvcm1Jc0NhY2hlZCA9IGZ1bmN0aW9uKHRhcmdldE5hbWUsIHZhbHVlKSB7XG4gICAgaWYodGhpcy5jYWNoZWRVbmlmb3Jtc1t0YXJnZXROYW1lXSA9PSBudWxsKSB7XG4gICAgICAgIGlmICh2YWx1ZS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRoaXMuY2FjaGVkVW5pZm9ybXNbdGFyZ2V0TmFtZV0gPSBuZXcgRmxvYXQzMkFycmF5KHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuY2FjaGVkVW5pZm9ybXNbdGFyZ2V0TmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGVsc2UgaWYgKHZhbHVlLmxlbmd0aCkge1xuICAgICAgICB2YXIgaSA9IHZhbHVlLmxlbmd0aDtcbiAgICAgICAgd2hpbGUgKGktLSkge1xuICAgICAgICAgICAgaWYodmFsdWVbaV0gIT09IHRoaXMuY2FjaGVkVW5pZm9ybXNbdGFyZ2V0TmFtZV1baV0pIHtcbiAgICAgICAgICAgICAgICBpID0gdmFsdWUubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHdoaWxlKGktLSkgdGhpcy5jYWNoZWRVbmlmb3Jtc1t0YXJnZXROYW1lXVtpXSA9IHZhbHVlW2ldO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGVsc2UgaWYgKHRoaXMuY2FjaGVkVW5pZm9ybXNbdGFyZ2V0TmFtZV0gIT09IHZhbHVlKSB7XG4gICAgICAgIHRoaXMuY2FjaGVkVW5pZm9ybXNbdGFyZ2V0TmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xufTtcblxuLyoqXG4gKiBIYW5kbGVzIGFsbCBwYXNzaW5nIG9mIHVuaWZvcm1zIHRvIFdlYkdMIGRyYXdpbmcgY29udGV4dC4gIFRoaXNcbiAqIGZ1bmN0aW9uIHdpbGwgZmluZCB0aGUgdW5pZm9ybSBsb2NhdGlvbiBhbmQgdGhlbiwgYmFzZWQgb25cbiAqIGEgdHlwZSBpbmZlcnJlZCBmcm9tIHRoZSBqYXZhc2NyaXB0IHZhbHVlIG9mIHRoZSB1bmlmb3JtLCBpdCB3aWxsIGNhbGxcbiAqIHRoZSBhcHByb3ByaWF0ZSBmdW5jdGlvbiB0byBwYXNzIHRoZSB1bmlmb3JtIHRvIFdlYkdMLiAgRmluYWxseSxcbiAqIHNldFVuaWZvcm1zIHdpbGwgaXRlcmF0ZSB0aHJvdWdoIHRoZSBwYXNzZWQgaW4gc2hhZGVyQ2h1bmtzIChpZiBhbnkpXG4gKiBhbmQgc2V0IHRoZSBhcHByb3ByaWF0ZSB1bmlmb3JtcyB0byBzcGVjaWZ5IHdoaWNoIGNodW5rcyB0byB1c2UuXG4gKlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtBcnJheX0gdW5pZm9ybU5hbWVzIEFycmF5IGNvbnRhaW5pbmcgdGhlIGtleXMgb2YgYWxsIHVuaWZvcm1zIHRvIGJlIHNldC5cbiAqIEBwYXJhbSB7QXJyYXl9IHVuaWZvcm1WYWx1ZSBBcnJheSBjb250YWluaW5nIHRoZSB2YWx1ZXMgb2YgYWxsIHVuaWZvcm1zIHRvIGJlIHNldC5cbiAqXG4gKiBAcmV0dXJuIHtQcm9ncmFtfSBDdXJyZW50IHByb2dyYW0uXG4gKi9cblByb2dyYW0ucHJvdG90eXBlLnNldFVuaWZvcm1zID0gZnVuY3Rpb24gKHVuaWZvcm1OYW1lcywgdW5pZm9ybVZhbHVlKSB7XG4gICAgdmFyIGdsID0gdGhpcy5nbDtcbiAgICB2YXIgbG9jYXRpb247XG4gICAgdmFyIHZhbHVlO1xuICAgIHZhciBuYW1lO1xuICAgIHZhciBsZW47XG4gICAgdmFyIGk7XG5cbiAgICBpZiAoIXRoaXMucHJvZ3JhbSkgcmV0dXJuIHRoaXM7XG5cbiAgICBsZW4gPSB1bmlmb3JtTmFtZXMubGVuZ3RoO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBuYW1lID0gdW5pZm9ybU5hbWVzW2ldO1xuICAgICAgICB2YWx1ZSA9IHVuaWZvcm1WYWx1ZVtpXTtcblxuICAgICAgICAvLyBSZXRyZWl2ZSB0aGUgY2FjaGVkIGxvY2F0aW9uIG9mIHRoZSB1bmlmb3JtLFxuICAgICAgICAvLyByZXF1ZXN0aW5nIGEgbmV3IGxvY2F0aW9uIGZyb20gdGhlIFdlYkdMIGNvbnRleHRcbiAgICAgICAgLy8gaWYgaXQgZG9lcyBub3QgeWV0IGV4aXN0LlxuXG4gICAgICAgIGxvY2F0aW9uID0gdGhpcy51bmlmb3JtTG9jYXRpb25zW25hbWVdO1xuXG4gICAgICAgIGlmIChsb2NhdGlvbiA9PT0gbnVsbCkgY29udGludWU7XG4gICAgICAgIGlmIChsb2NhdGlvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBsb2NhdGlvbiA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbih0aGlzLnByb2dyYW0sIG5hbWUpO1xuICAgICAgICAgICAgdGhpcy51bmlmb3JtTG9jYXRpb25zW25hbWVdID0gbG9jYXRpb247XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDaGVjayBpZiB0aGUgdmFsdWUgaXMgYWxyZWFkeSBzZXQgZm9yIHRoZVxuICAgICAgICAvLyBnaXZlbiB1bmlmb3JtLlxuXG4gICAgICAgIGlmICh0aGlzLnVuaWZvcm1Jc0NhY2hlZChuYW1lLCB2YWx1ZSkpIGNvbnRpbnVlO1xuXG4gICAgICAgIC8vIERldGVybWluZSB0aGUgY29ycmVjdCBmdW5jdGlvbiBhbmQgcGFzcyB0aGUgdW5pZm9ybVxuICAgICAgICAvLyB2YWx1ZSB0byBXZWJHTC5cblxuICAgICAgICBpZiAoIXRoaXMudW5pZm9ybVR5cGVzW25hbWVdKSB7XG4gICAgICAgICAgICB0aGlzLnVuaWZvcm1UeXBlc1tuYW1lXSA9IHRoaXMuZ2V0VW5pZm9ybVR5cGVGcm9tVmFsdWUodmFsdWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2FsbCB1bmlmb3JtIHNldHRlciBmdW5jdGlvbiBvbiBXZWJHTCBjb250ZXh0IHdpdGggY29ycmVjdCB2YWx1ZVxuXG4gICAgICAgIHN3aXRjaCAodGhpcy51bmlmb3JtVHlwZXNbbmFtZV0pIHtcbiAgICAgICAgICAgIGNhc2UgJ3VuaWZvcm00ZnYnOiAgZ2wudW5pZm9ybTRmdihsb2NhdGlvbiwgdmFsdWUpOyBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3VuaWZvcm0zZnYnOiAgZ2wudW5pZm9ybTNmdihsb2NhdGlvbiwgdmFsdWUpOyBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3VuaWZvcm0yZnYnOiAgZ2wudW5pZm9ybTJmdihsb2NhdGlvbiwgdmFsdWUpOyBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3VuaWZvcm0xZnYnOiAgZ2wudW5pZm9ybTFmdihsb2NhdGlvbiwgdmFsdWUpOyBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3VuaWZvcm0xZicgOiAgZ2wudW5pZm9ybTFmKGxvY2F0aW9uLCB2YWx1ZSk7IGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAndW5pZm9ybU1hdHJpeDNmdic6IGdsLnVuaWZvcm1NYXRyaXgzZnYobG9jYXRpb24sIGZhbHNlLCB2YWx1ZSk7IGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAndW5pZm9ybU1hdHJpeDRmdic6IGdsLnVuaWZvcm1NYXRyaXg0ZnYobG9jYXRpb24sIGZhbHNlLCB2YWx1ZSk7IGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEluZmVycyB1bmlmb3JtIHNldHRlciBmdW5jdGlvbiB0byBiZSBjYWxsZWQgb24gdGhlIFdlYkdMIGNvbnRleHQsIGJhc2VkXG4gKiBvbiBhbiBpbnB1dCB2YWx1ZS5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ8QXJyYXl9IHZhbHVlIFZhbHVlIGZyb20gd2hpY2ggdW5pZm9ybSB0eXBlIGlzIGluZmVycmVkLlxuICpcbiAqIEByZXR1cm4ge1N0cmluZ30gTmFtZSBvZiB1bmlmb3JtIGZ1bmN0aW9uIGZvciBnaXZlbiB2YWx1ZS5cbiAqL1xuUHJvZ3JhbS5wcm90b3R5cGUuZ2V0VW5pZm9ybVR5cGVGcm9tVmFsdWUgPSBmdW5jdGlvbiBnZXRVbmlmb3JtVHlwZUZyb21WYWx1ZSh2YWx1ZSkge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSB8fCB2YWx1ZSBpbnN0YW5jZW9mIEZsb2F0MzJBcnJheSkge1xuICAgICAgICBzd2l0Y2ggKHZhbHVlLmxlbmd0aCkge1xuICAgICAgICAgICAgY2FzZSAxOiAgcmV0dXJuICd1bmlmb3JtMWZ2JztcbiAgICAgICAgICAgIGNhc2UgMjogIHJldHVybiAndW5pZm9ybTJmdic7XG4gICAgICAgICAgICBjYXNlIDM6ICByZXR1cm4gJ3VuaWZvcm0zZnYnO1xuICAgICAgICAgICAgY2FzZSA0OiAgcmV0dXJuICd1bmlmb3JtNGZ2JztcbiAgICAgICAgICAgIGNhc2UgOTogIHJldHVybiAndW5pZm9ybU1hdHJpeDNmdic7XG4gICAgICAgICAgICBjYXNlIDE2OiByZXR1cm4gJ3VuaWZvcm1NYXRyaXg0ZnYnO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKCFpc05hTihwYXJzZUZsb2F0KHZhbHVlKSkgJiYgaXNGaW5pdGUodmFsdWUpKSB7XG4gICAgICAgIHJldHVybiAndW5pZm9ybTFmJztcbiAgICB9XG5cbiAgICB0aHJvdyAnY2FudCBsb2FkIHVuaWZvcm0gXCInICsgbmFtZSArICdcIiB3aXRoIHZhbHVlOicgKyBKU09OLnN0cmluZ2lmeSh2YWx1ZSk7XG59O1xuXG4vKipcbiAqIEFkZHMgc2hhZGVyIHNvdXJjZSB0byBzaGFkZXIgYW5kIGNvbXBpbGVzIHRoZSBpbnB1dCBzaGFkZXIuICBDaGVja3NcbiAqIGNvbXBpbGUgc3RhdHVzIGFuZCBsb2dzIGVycm9yIGlmIG5lY2Vzc2FyeS5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHNoYWRlciBQcm9ncmFtIHRvIGJlIGNvbXBpbGVkLlxuICogQHBhcmFtIHtTdHJpbmd9IHNvdXJjZSBTb3VyY2UgdG8gYmUgdXNlZCBpbiB0aGUgc2hhZGVyLlxuICpcbiAqIEByZXR1cm4ge09iamVjdH0gQ29tcGlsZWQgc2hhZGVyLlxuICovXG5Qcm9ncmFtLnByb3RvdHlwZS5jb21waWxlU2hhZGVyID0gZnVuY3Rpb24gY29tcGlsZVNoYWRlcihzaGFkZXIsIHNvdXJjZSkge1xuICAgIHZhciBpID0gMTtcblxuICAgIGlmICh0aGlzLm9wdGlvbnMuZGVidWcpIHtcbiAgICAgICAgdGhpcy5nbC5jb21waWxlU2hhZGVyID0gRGVidWcuY2FsbCh0aGlzKTtcbiAgICB9XG5cbiAgICB0aGlzLmdsLnNoYWRlclNvdXJjZShzaGFkZXIsIHNvdXJjZSk7XG4gICAgdGhpcy5nbC5jb21waWxlU2hhZGVyKHNoYWRlcik7XG4gICAgaWYgKCF0aGlzLmdsLmdldFNoYWRlclBhcmFtZXRlcihzaGFkZXIsIHRoaXMuZ2wuQ09NUElMRV9TVEFUVVMpKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ2NvbXBpbGUgZXJyb3I6ICcgKyB0aGlzLmdsLmdldFNoYWRlckluZm9Mb2coc2hhZGVyKSk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJzE6ICcgKyBzb3VyY2UucmVwbGFjZSgvXFxuL2csIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAnXFxuJyArIChpKz0xKSArICc6ICc7XG4gICAgICAgIH0pKTtcbiAgICB9XG5cbiAgICByZXR1cm4gc2hhZGVyO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBQcm9ncmFtO1xuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIFRleHR1cmUgaXMgYSBwcml2YXRlIGNsYXNzIHRoYXQgc3RvcmVzIGltYWdlIGRhdGFcbiAqIHRvIGJlIGFjY2Vzc2VkIGZyb20gYSBzaGFkZXIgb3IgdXNlZCBhcyBhIHJlbmRlciB0YXJnZXQuXG4gKlxuICogQGNsYXNzIFRleHR1cmVcbiAqIEBjb25zdHJ1Y3RvclxuICpcbiAqIEBwYXJhbSB7R0x9IGdsIEdMXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBPcHRpb25zXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuZnVuY3Rpb24gVGV4dHVyZShnbCwgb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIHRoaXMuaWQgPSBnbC5jcmVhdGVUZXh0dXJlKCk7XG4gICAgdGhpcy53aWR0aCA9IG9wdGlvbnMud2lkdGggfHwgMDtcbiAgICB0aGlzLmhlaWdodCA9IG9wdGlvbnMuaGVpZ2h0IHx8IDA7XG4gICAgdGhpcy5taXBtYXAgPSBvcHRpb25zLm1pcG1hcDtcbiAgICB0aGlzLmZvcm1hdCA9IG9wdGlvbnMuZm9ybWF0IHx8ICdSR0JBJztcbiAgICB0aGlzLnR5cGUgPSBvcHRpb25zLnR5cGUgfHwgJ1VOU0lHTkVEX0JZVEUnO1xuICAgIHRoaXMuZ2wgPSBnbDtcblxuICAgIHRoaXMuYmluZCgpO1xuXG4gICAgZ2wucGl4ZWxTdG9yZWkoZ2wuVU5QQUNLX0ZMSVBfWV9XRUJHTCwgb3B0aW9ucy5mbGlwWVdlYmdsIHx8IGZhbHNlKTtcbiAgICBnbC5waXhlbFN0b3JlaShnbC5VTlBBQ0tfUFJFTVVMVElQTFlfQUxQSEFfV0VCR0wsIG9wdGlvbnMucHJlbXVsdGlwbHlBbHBoYVdlYmdsIHx8IGZhbHNlKTtcblxuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9NQUdfRklMVEVSLCBnbFtvcHRpb25zLm1hZ0ZpbHRlcl0gfHwgZ2wuTkVBUkVTVCk7XG4gICAgZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01JTl9GSUxURVIsIGdsW29wdGlvbnMubWluRmlsdGVyXSB8fCBnbC5ORUFSRVNUKTtcblxuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1MsIGdsW29wdGlvbnMud3JhcFNdIHx8IGdsLkNMQU1QX1RPX0VER0UpO1xuICAgIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1QsIGdsW29wdGlvbnMud3JhcFRdIHx8IGdsLkNMQU1QX1RPX0VER0UpO1xufVxuXG4vKipcbiAqIEJpbmRzIHRoaXMgdGV4dHVyZSBhcyB0aGUgc2VsZWN0ZWQgdGFyZ2V0LlxuICpcbiAqIEBtZXRob2RcbiAqIEByZXR1cm4ge09iamVjdH0gQ3VycmVudCB0ZXh0dXJlIGluc3RhbmNlLlxuICovXG5UZXh0dXJlLnByb3RvdHlwZS5iaW5kID0gZnVuY3Rpb24gYmluZCgpIHtcbiAgICB0aGlzLmdsLmJpbmRUZXh0dXJlKHRoaXMuZ2wuVEVYVFVSRV8yRCwgdGhpcy5pZCk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEVyYXNlcyB0aGUgdGV4dHVyZSBkYXRhIGluIHRoZSBnaXZlbiB0ZXh0dXJlIHNsb3QuXG4gKlxuICogQG1ldGhvZFxuICogQHJldHVybiB7T2JqZWN0fSBDdXJyZW50IHRleHR1cmUgaW5zdGFuY2UuXG4gKi9cblRleHR1cmUucHJvdG90eXBlLnVuYmluZCA9IGZ1bmN0aW9uIHVuYmluZCgpIHtcbiAgICB0aGlzLmdsLmJpbmRUZXh0dXJlKHRoaXMuZ2wuVEVYVFVSRV8yRCwgbnVsbCk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlcGxhY2VzIHRoZSBpbWFnZSBkYXRhIGluIHRoZSB0ZXh0dXJlIHdpdGggdGhlIGdpdmVuIGltYWdlLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge0ltYWdlfSAgIGltZyAgICAgVGhlIGltYWdlIG9iamVjdCB0byB1cGxvYWQgcGl4ZWwgZGF0YSBmcm9tLlxuICogQHJldHVybiB7T2JqZWN0fSAgICAgICAgIEN1cnJlbnQgdGV4dHVyZSBpbnN0YW5jZS5cbiAqL1xuVGV4dHVyZS5wcm90b3R5cGUuc2V0SW1hZ2UgPSBmdW5jdGlvbiBzZXRJbWFnZShpbWcpIHtcbiAgICB0aGlzLmdsLnRleEltYWdlMkQodGhpcy5nbC5URVhUVVJFXzJELCAwLCB0aGlzLmdsW3RoaXMuZm9ybWF0XSwgdGhpcy5nbFt0aGlzLmZvcm1hdF0sIHRoaXMuZ2xbdGhpcy50eXBlXSwgaW1nKTtcbiAgICBpZiAodGhpcy5taXBtYXApIHRoaXMuZ2wuZ2VuZXJhdGVNaXBtYXAodGhpcy5nbC5URVhUVVJFXzJEKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVwbGFjZXMgdGhlIGltYWdlIGRhdGEgaW4gdGhlIHRleHR1cmUgd2l0aCBhbiBhcnJheSBvZiBhcmJpdHJhcnkgZGF0YS5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtBcnJheX0gICBpbnB1dCAgIEFycmF5IHRvIGJlIHNldCBhcyBkYXRhIHRvIHRleHR1cmUuXG4gKiBAcmV0dXJuIHtPYmplY3R9ICAgICAgICAgQ3VycmVudCB0ZXh0dXJlIGluc3RhbmNlLlxuICovXG5UZXh0dXJlLnByb3RvdHlwZS5zZXRBcnJheSA9IGZ1bmN0aW9uIHNldEFycmF5KGlucHV0KSB7XG4gICAgdGhpcy5nbC50ZXhJbWFnZTJEKHRoaXMuZ2wuVEVYVFVSRV8yRCwgMCwgdGhpcy5nbFt0aGlzLmZvcm1hdF0sIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0LCAwLCB0aGlzLmdsW3RoaXMuZm9ybWF0XSwgdGhpcy5nbFt0aGlzLnR5cGVdLCBpbnB1dCk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIER1bXBzIHRoZSByZ2ItcGl4ZWwgY29udGVudHMgb2YgYSB0ZXh0dXJlIGludG8gYW4gYXJyYXkgZm9yIGRlYnVnZ2luZyBwdXJwb3Nlc1xuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0geCAgICAgICAgeC1vZmZzZXQgYmV0d2VlbiB0ZXh0dXJlIGNvb3JkaW5hdGVzIGFuZCBzbmFwc2hvdFxuICogQHBhcmFtIHtOdW1iZXJ9IHkgICAgICAgIHktb2Zmc2V0IGJldHdlZW4gdGV4dHVyZSBjb29yZGluYXRlcyBhbmQgc25hcHNob3RcbiAqIEBwYXJhbSB7TnVtYmVyfSB3aWR0aCAgICB4LWRlcHRoIG9mIHRoZSBzbmFwc2hvdFxuICogQHBhcmFtIHtOdW1iZXJ9IGhlaWdodCAgIHktZGVwdGggb2YgdGhlIHNuYXBzaG90XG4gKlxuICogQHJldHVybiB7QXJyYXl9ICAgICAgICAgIEFuIGFycmF5IG9mIHRoZSBwaXhlbHMgY29udGFpbmVkIGluIHRoZSBzbmFwc2hvdC5cbiAqL1xuVGV4dHVyZS5wcm90b3R5cGUucmVhZEJhY2sgPSBmdW5jdGlvbiByZWFkQmFjayh4LCB5LCB3aWR0aCwgaGVpZ2h0KSB7XG4gICAgdmFyIGdsID0gdGhpcy5nbDtcbiAgICB2YXIgcGl4ZWxzO1xuICAgIHggPSB4IHx8IDA7XG4gICAgeSA9IHkgfHwgMDtcbiAgICB3aWR0aCA9IHdpZHRoIHx8IHRoaXMud2lkdGg7XG4gICAgaGVpZ2h0ID0gaGVpZ2h0IHx8IHRoaXMuaGVpZ2h0O1xuICAgIHZhciBmYiA9IGdsLmNyZWF0ZUZyYW1lYnVmZmVyKCk7XG4gICAgZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCBmYik7XG4gICAgZ2wuZnJhbWVidWZmZXJUZXh0dXJlMkQoZ2wuRlJBTUVCVUZGRVIsIGdsLkNPTE9SX0FUVEFDSE1FTlQwLCBnbC5URVhUVVJFXzJELCB0aGlzLmlkLCAwKTtcbiAgICBpZiAoZ2wuY2hlY2tGcmFtZWJ1ZmZlclN0YXR1cyhnbC5GUkFNRUJVRkZFUikgPT09IGdsLkZSQU1FQlVGRkVSX0NPTVBMRVRFKSB7XG4gICAgICAgIHBpeGVscyA9IG5ldyBVaW50OEFycmF5KHdpZHRoICogaGVpZ2h0ICogNCk7XG4gICAgICAgIGdsLnJlYWRQaXhlbHMoeCwgeSwgd2lkdGgsIGhlaWdodCwgZ2wuUkdCQSwgZ2wuVU5TSUdORURfQllURSwgcGl4ZWxzKTtcbiAgICB9XG4gICAgcmV0dXJuIHBpeGVscztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVGV4dHVyZTtcbiIsIi8qKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE1IEZhbW91cyBJbmR1c3RyaWVzIEluYy5cbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbiAqIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuICogVEhFIFNPRlRXQVJFLlxuICovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBUZXh0dXJlID0gcmVxdWlyZSgnLi9UZXh0dXJlJyk7XG52YXIgY3JlYXRlQ2hlY2tlcmJvYXJkID0gcmVxdWlyZSgnLi9jcmVhdGVDaGVja2VyYm9hcmQnKTtcblxuLyoqXG4gKiBIYW5kbGVzIGxvYWRpbmcsIGJpbmRpbmcsIGFuZCByZXNhbXBsaW5nIG9mIHRleHR1cmVzIGZvciBXZWJHTFJlbmRlcmVyLlxuICpcbiAqIEBjbGFzcyBUZXh0dXJlTWFuYWdlclxuICogQGNvbnN0cnVjdG9yXG4gKlxuICogQHBhcmFtIHtXZWJHTF9Db250ZXh0fSBnbCBDb250ZXh0IHVzZWQgdG8gY3JlYXRlIGFuZCBiaW5kIHRleHR1cmVzLlxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbmZ1bmN0aW9uIFRleHR1cmVNYW5hZ2VyKGdsKSB7XG4gICAgdGhpcy5yZWdpc3RyeSA9IFtdO1xuICAgIHRoaXMuX25lZWRzUmVzYW1wbGUgPSBbXTtcblxuICAgIHRoaXMuX2FjdGl2ZVRleHR1cmUgPSAwO1xuICAgIHRoaXMuX2JvdW5kVGV4dHVyZSA9IG51bGw7XG5cbiAgICB0aGlzLl9jaGVja2VyYm9hcmQgPSBjcmVhdGVDaGVja2VyYm9hcmQoKTtcblxuICAgIHRoaXMuZ2wgPSBnbDtcbn1cblxuLyoqXG4gKiBVcGRhdGUgZnVuY3Rpb24gdXNlZCBieSBXZWJHTFJlbmRlcmVyIHRvIHF1ZXVlIHJlc2FtcGxlcyBvblxuICogcmVnaXN0ZXJlZCB0ZXh0dXJlcy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9ICAgICAgdGltZSAgICBUaW1lIGluIG1pbGxpc2Vjb25kcyBhY2NvcmRpbmcgdG8gdGhlIGNvbXBvc2l0b3IuXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9ICAgICAgICAgIHVuZGVmaW5lZFxuICovXG5UZXh0dXJlTWFuYWdlci5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24gdXBkYXRlKHRpbWUpIHtcbiAgICB2YXIgcmVnaXN0cnlMZW5ndGggPSB0aGlzLnJlZ2lzdHJ5Lmxlbmd0aDtcblxuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgcmVnaXN0cnlMZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgdGV4dHVyZSA9IHRoaXMucmVnaXN0cnlbaV07XG5cbiAgICAgICAgaWYgKHRleHR1cmUgJiYgdGV4dHVyZS5pc0xvYWRlZCAmJiB0ZXh0dXJlLnJlc2FtcGxlUmF0ZSkge1xuICAgICAgICAgICAgaWYgKCF0ZXh0dXJlLmxhc3RSZXNhbXBsZSB8fCB0aW1lIC0gdGV4dHVyZS5sYXN0UmVzYW1wbGUgPiB0ZXh0dXJlLnJlc2FtcGxlUmF0ZSkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5fbmVlZHNSZXNhbXBsZVt0ZXh0dXJlLmlkXSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9uZWVkc1Jlc2FtcGxlW3RleHR1cmUuaWRdID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgdGV4dHVyZS5sYXN0UmVzYW1wbGUgPSB0aW1lO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIHNwZWMgYW5kIGNyZWF0ZXMgYSB0ZXh0dXJlIGJhc2VkIG9uIGdpdmVuIHRleHR1cmUgZGF0YS5cbiAqIEhhbmRsZXMgbG9hZGluZyBhc3NldHMgaWYgbmVjZXNzYXJ5LlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gIGlucHV0ICAgT2JqZWN0IGNvbnRhaW5pbmcgdGV4dHVyZSBpZCwgdGV4dHVyZSBkYXRhXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgYW5kIG9wdGlvbnMgdXNlZCB0byBkcmF3IHRleHR1cmUuXG4gKiBAcGFyYW0ge051bWJlcn0gIHNsb3QgICAgVGV4dHVyZSBzbG90IHRvIGJpbmQgZ2VuZXJhdGVkIHRleHR1cmUgdG8uXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9ICAgICAgdW5kZWZpbmVkXG4gKi9cblRleHR1cmVNYW5hZ2VyLnByb3RvdHlwZS5yZWdpc3RlciA9IGZ1bmN0aW9uIHJlZ2lzdGVyKGlucHV0LCBzbG90KSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIHZhciBzb3VyY2UgPSBpbnB1dC5kYXRhO1xuICAgIHZhciB0ZXh0dXJlSWQgPSBpbnB1dC5pZDtcbiAgICB2YXIgb3B0aW9ucyA9IGlucHV0Lm9wdGlvbnMgfHwge307XG4gICAgdmFyIHRleHR1cmUgPSB0aGlzLnJlZ2lzdHJ5W3RleHR1cmVJZF07XG4gICAgdmFyIHNwZWM7XG5cbiAgICBpZiAoIXRleHR1cmUpIHtcblxuICAgICAgICB0ZXh0dXJlID0gbmV3IFRleHR1cmUodGhpcy5nbCwgb3B0aW9ucyk7XG4gICAgICAgIHRleHR1cmUuc2V0SW1hZ2UodGhpcy5fY2hlY2tlcmJvYXJkKTtcblxuICAgICAgICAvLyBBZGQgdGV4dHVyZSB0byByZWdpc3RyeVxuXG4gICAgICAgIHNwZWMgPSB0aGlzLnJlZ2lzdHJ5W3RleHR1cmVJZF0gPSB7XG4gICAgICAgICAgICByZXNhbXBsZVJhdGU6IG9wdGlvbnMucmVzYW1wbGVSYXRlIHx8IG51bGwsXG4gICAgICAgICAgICBsYXN0UmVzYW1wbGU6IG51bGwsXG4gICAgICAgICAgICBpc0xvYWRlZDogZmFsc2UsXG4gICAgICAgICAgICB0ZXh0dXJlOiB0ZXh0dXJlLFxuICAgICAgICAgICAgc291cmNlOiBzb3VyY2UsXG4gICAgICAgICAgICBpZDogdGV4dHVyZUlkLFxuICAgICAgICAgICAgc2xvdDogc2xvdFxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIEhhbmRsZSBhcnJheVxuXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHNvdXJjZSkgfHwgc291cmNlIGluc3RhbmNlb2YgVWludDhBcnJheSB8fCBzb3VyY2UgaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkpIHtcbiAgICAgICAgICAgIHRoaXMuYmluZFRleHR1cmUodGV4dHVyZUlkKTtcbiAgICAgICAgICAgIHRleHR1cmUuc2V0QXJyYXkoc291cmNlKTtcbiAgICAgICAgICAgIHNwZWMuaXNMb2FkZWQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSGFuZGxlIHZpZGVvXG5cbiAgICAgICAgZWxzZSBpZiAod2luZG93ICYmIHNvdXJjZSBpbnN0YW5jZW9mIHdpbmRvdy5IVE1MVmlkZW9FbGVtZW50KSB7XG4gICAgICAgICAgICBzb3VyY2UuYWRkRXZlbnRMaXN0ZW5lcignbG9hZGVkZGF0YScsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIF90aGlzLmJpbmRUZXh0dXJlKHRleHR1cmVJZCk7XG4gICAgICAgICAgICAgICAgdGV4dHVyZS5zZXRJbWFnZShzb3VyY2UpO1xuXG4gICAgICAgICAgICAgICAgc3BlYy5pc0xvYWRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgc3BlYy5zb3VyY2UgPSBzb3VyY2U7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEhhbmRsZSBpbWFnZSB1cmxcblxuICAgICAgICBlbHNlIGlmICh0eXBlb2Ygc291cmNlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgbG9hZEltYWdlKHNvdXJjZSwgZnVuY3Rpb24gKGltZykge1xuICAgICAgICAgICAgICAgIF90aGlzLmJpbmRUZXh0dXJlKHRleHR1cmVJZCk7XG4gICAgICAgICAgICAgICAgdGV4dHVyZS5zZXRJbWFnZShpbWcpO1xuXG4gICAgICAgICAgICAgICAgc3BlYy5pc0xvYWRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgc3BlYy5zb3VyY2UgPSBpbWc7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0ZXh0dXJlSWQ7XG59O1xuXG4vKipcbiAqIExvYWRzIGFuIGltYWdlIGZyb20gYSBzdHJpbmcgb3IgSW1hZ2Ugb2JqZWN0IGFuZCBleGVjdXRlcyBhIGNhbGxiYWNrIGZ1bmN0aW9uLlxuICpcbiAqIEBtZXRob2RcbiAqIEBwcml2YXRlXG4gKlxuICogQHBhcmFtIHtPYmplY3R8U3RyaW5nfSBpbnB1dCBUaGUgaW5wdXQgaW1hZ2UgZGF0YSB0byBsb2FkIGFzIGFuIGFzc2V0LlxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgVGhlIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGJlIGZpcmVkIHdoZW4gdGhlIGltYWdlIGhhcyBmaW5pc2hlZCBsb2FkaW5nLlxuICpcbiAqIEByZXR1cm4ge09iamVjdH0gSW1hZ2Ugb2JqZWN0IGJlaW5nIGxvYWRlZC5cbiAqL1xuZnVuY3Rpb24gbG9hZEltYWdlIChpbnB1dCwgY2FsbGJhY2spIHtcbiAgICB2YXIgaW1hZ2UgPSAodHlwZW9mIGlucHV0ID09PSAnc3RyaW5nJyA/IG5ldyBJbWFnZSgpIDogaW5wdXQpIHx8IHt9O1xuICAgICAgICBpbWFnZS5jcm9zc09yaWdpbiA9ICdhbm9ueW1vdXMnO1xuXG4gICAgaWYgKCFpbWFnZS5zcmMpIGltYWdlLnNyYyA9IGlucHV0O1xuICAgIGlmICghaW1hZ2UuY29tcGxldGUpIHtcbiAgICAgICAgaW1hZ2Uub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY2FsbGJhY2soaW1hZ2UpO1xuICAgICAgICB9O1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgY2FsbGJhY2soaW1hZ2UpO1xuICAgIH1cblxuICAgIHJldHVybiBpbWFnZTtcbn1cblxuLyoqXG4gKiBTZXRzIGFjdGl2ZSB0ZXh0dXJlIHNsb3QgYW5kIGJpbmRzIHRhcmdldCB0ZXh0dXJlLiAgQWxzbyBoYW5kbGVzXG4gKiByZXNhbXBsaW5nIHdoZW4gbmVjZXNzYXJ5LlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gaWQgSWRlbnRpZmllciB1c2VkIHRvIHJldHJlaXZlIHRleHR1cmUgc3BlY1xuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cblRleHR1cmVNYW5hZ2VyLnByb3RvdHlwZS5iaW5kVGV4dHVyZSA9IGZ1bmN0aW9uIGJpbmRUZXh0dXJlKGlkKSB7XG4gICAgdmFyIHNwZWMgPSB0aGlzLnJlZ2lzdHJ5W2lkXTtcblxuICAgIGlmICh0aGlzLl9hY3RpdmVUZXh0dXJlICE9PSBzcGVjLnNsb3QpIHtcbiAgICAgICAgdGhpcy5nbC5hY3RpdmVUZXh0dXJlKHRoaXMuZ2wuVEVYVFVSRTAgKyBzcGVjLnNsb3QpO1xuICAgICAgICB0aGlzLl9hY3RpdmVUZXh0dXJlID0gc3BlYy5zbG90O1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9ib3VuZFRleHR1cmUgIT09IGlkKSB7XG4gICAgICAgIHRoaXMuX2JvdW5kVGV4dHVyZSA9IGlkO1xuICAgICAgICBzcGVjLnRleHR1cmUuYmluZCgpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9uZWVkc1Jlc2FtcGxlW3NwZWMuaWRdKSB7XG5cbiAgICAgICAgLy8gVE9ETzogQWNjb3VudCBmb3IgcmVzYW1wbGluZyBvZiBhcnJheXMuXG5cbiAgICAgICAgc3BlYy50ZXh0dXJlLnNldEltYWdlKHNwZWMuc291cmNlKTtcbiAgICAgICAgdGhpcy5fbmVlZHNSZXNhbXBsZVtzcGVjLmlkXSA9IGZhbHNlO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVGV4dHVyZU1hbmFnZXI7XG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBGYW1vdXMgSW5kdXN0cmllcyBJbmMuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBQcm9ncmFtID0gcmVxdWlyZSgnLi9Qcm9ncmFtJyk7XG52YXIgQnVmZmVyUmVnaXN0cnkgPSByZXF1aXJlKCcuL0J1ZmZlclJlZ2lzdHJ5Jyk7XG52YXIgUGxhbmUgPSByZXF1aXJlKCcuLi93ZWJnbC1nZW9tZXRyaWVzL3ByaW1pdGl2ZXMvUGxhbmUnKTtcbnZhciBzb3J0ZXIgPSByZXF1aXJlKCcuL3JhZGl4U29ydCcpO1xudmFyIGtleVZhbHVlVG9BcnJheXMgPSByZXF1aXJlKCcuLi91dGlsaXRpZXMva2V5VmFsdWVUb0FycmF5cycpO1xudmFyIFRleHR1cmVNYW5hZ2VyID0gcmVxdWlyZSgnLi9UZXh0dXJlTWFuYWdlcicpO1xudmFyIGNvbXBpbGVNYXRlcmlhbCA9IHJlcXVpcmUoJy4vY29tcGlsZU1hdGVyaWFsJyk7XG5cbnZhciBpZGVudGl0eSA9IFsxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxXTtcblxudmFyIGdsb2JhbFVuaWZvcm1zID0ga2V5VmFsdWVUb0FycmF5cyh7XG4gICAgJ3VfbnVtTGlnaHRzJzogMCxcbiAgICAndV9hbWJpZW50TGlnaHQnOiBuZXcgQXJyYXkoMyksXG4gICAgJ3VfbGlnaHRQb3NpdGlvbic6IG5ldyBBcnJheSgzKSxcbiAgICAndV9saWdodENvbG9yJzogbmV3IEFycmF5KDMpLFxuICAgICd1X3BlcnNwZWN0aXZlJzogbmV3IEFycmF5KDE2KSxcbiAgICAndV90aW1lJzogMCxcbiAgICAndV92aWV3JzogbmV3IEFycmF5KDE2KVxufSk7XG5cbi8qKlxuICogV2ViR0xSZW5kZXJlciBpcyBhIHByaXZhdGUgY2xhc3MgdGhhdCBtYW5hZ2VzIGFsbCBpbnRlcmFjdGlvbnMgd2l0aCB0aGUgV2ViR0xcbiAqIEFQSS4gRWFjaCBmcmFtZSBpdCByZWNlaXZlcyBjb21tYW5kcyBmcm9tIHRoZSBjb21wb3NpdG9yIGFuZCB1cGRhdGVzIGl0c1xuICogcmVnaXN0cmllcyBhY2NvcmRpbmdseS4gU3Vic2VxdWVudGx5LCB0aGUgZHJhdyBmdW5jdGlvbiBpcyBjYWxsZWQgYW5kIHRoZVxuICogV2ViR0xSZW5kZXJlciBpc3N1ZXMgZHJhdyBjYWxscyBmb3IgYWxsIG1lc2hlcyBpbiBpdHMgcmVnaXN0cnkuXG4gKlxuICogQGNsYXNzIFdlYkdMUmVuZGVyZXJcbiAqIEBjb25zdHJ1Y3RvclxuICpcbiAqIEBwYXJhbSB7RWxlbWVudH0gY2FudmFzIFRoZSBET00gZWxlbWVudCB0aGF0IEdMIHdpbGwgcGFpbnQgaXRzZWxmIG9udG8uXG4gKiBAcGFyYW0ge0NvbXBvc2l0b3J9IGNvbXBvc2l0b3IgQ29tcG9zaXRvciB1c2VkIGZvciBxdWVyeWluZyB0aGUgdGltZSBmcm9tLlxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbmZ1bmN0aW9uIFdlYkdMUmVuZGVyZXIoY2FudmFzLCBjb21wb3NpdG9yKSB7XG4gICAgY2FudmFzLmNsYXNzTGlzdC5hZGQoJ2ZhbW91cy13ZWJnbC1yZW5kZXJlcicpO1xuXG4gICAgdGhpcy5jYW52YXMgPSBjYW52YXM7XG4gICAgdGhpcy5jb21wb3NpdG9yID0gY29tcG9zaXRvcjtcblxuICAgIHZhciBnbCA9IHRoaXMuZ2wgPSB0aGlzLmdldFdlYkdMQ29udGV4dCh0aGlzLmNhbnZhcyk7XG5cbiAgICBnbC5jbGVhckNvbG9yKDAuMCwgMC4wLCAwLjAsIDAuMCk7XG4gICAgZ2wucG9seWdvbk9mZnNldCgwLjEsIDAuMSk7XG4gICAgZ2wuZW5hYmxlKGdsLlBPTFlHT05fT0ZGU0VUX0ZJTEwpO1xuICAgIGdsLmVuYWJsZShnbC5ERVBUSF9URVNUKTtcbiAgICBnbC5lbmFibGUoZ2wuQkxFTkQpO1xuICAgIGdsLmRlcHRoRnVuYyhnbC5MRVFVQUwpO1xuICAgIGdsLmJsZW5kRnVuYyhnbC5TUkNfQUxQSEEsIGdsLk9ORV9NSU5VU19TUkNfQUxQSEEpO1xuICAgIGdsLmVuYWJsZShnbC5DVUxMX0ZBQ0UpO1xuICAgIGdsLmN1bGxGYWNlKGdsLkJBQ0spO1xuXG4gICAgdGhpcy5tZXNoUmVnaXN0cnkgPSB7fTtcbiAgICB0aGlzLm1lc2hSZWdpc3RyeUtleXMgPSBbXTtcblxuICAgIHRoaXMuY3V0b3V0UmVnaXN0cnkgPSB7fTtcblxuICAgIHRoaXMuY3V0b3V0UmVnaXN0cnlLZXlzID0gW107XG5cbiAgICAvKipcbiAgICAgKiBMaWdodHNcbiAgICAgKi9cbiAgICB0aGlzLm51bUxpZ2h0cyA9IDA7XG4gICAgdGhpcy5hbWJpZW50TGlnaHRDb2xvciA9IFswLCAwLCAwXTtcbiAgICB0aGlzLmxpZ2h0UmVnaXN0cnkgPSB7fTtcbiAgICB0aGlzLmxpZ2h0UmVnaXN0cnlLZXlzID0gW107XG4gICAgdGhpcy5saWdodFBvc2l0aW9ucyA9IFswLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCAwXTtcbiAgICB0aGlzLmxpZ2h0Q29sb3JzID0gWzAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDBdO1xuXG4gICAgdGhpcy50ZXh0dXJlTWFuYWdlciA9IG5ldyBUZXh0dXJlTWFuYWdlcihnbCk7XG4gICAgdGhpcy50ZXhDYWNoZSA9IHt9O1xuICAgIHRoaXMuYnVmZmVyUmVnaXN0cnkgPSBuZXcgQnVmZmVyUmVnaXN0cnkoZ2wpO1xuICAgIHRoaXMucHJvZ3JhbSA9IG5ldyBQcm9ncmFtKGdsLCB7IGRlYnVnOiB0cnVlIH0pO1xuXG4gICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgICAgYm91bmRBcnJheUJ1ZmZlcjogbnVsbCxcbiAgICAgICAgYm91bmRFbGVtZW50QnVmZmVyOiBudWxsLFxuICAgICAgICBsYXN0RHJhd246IG51bGwsXG4gICAgICAgIGVuYWJsZWRBdHRyaWJ1dGVzOiB7fSxcbiAgICAgICAgZW5hYmxlZEF0dHJpYnV0ZXNLZXlzOiBbXVxuICAgIH07XG5cbiAgICB0aGlzLnJlc29sdXRpb25OYW1lID0gWyd1X3Jlc29sdXRpb24nXTtcbiAgICB0aGlzLnJlc29sdXRpb25WYWx1ZXMgPSBbXTtcblxuICAgIHRoaXMuY2FjaGVkU2l6ZSA9IFtdO1xuXG4gICAgLypcbiAgICBUaGUgcHJvamVjdGlvblRyYW5zZm9ybSBoYXMgc29tZSBjb25zdGFudCBjb21wb25lbnRzLCBpLmUuIHRoZSB6IHNjYWxlLCBhbmQgdGhlIHggYW5kIHkgdHJhbnNsYXRpb24uXG5cbiAgICBUaGUgeiBzY2FsZSBrZWVwcyB0aGUgZmluYWwgeiBwb3NpdGlvbiBvZiBhbnkgdmVydGV4IHdpdGhpbiB0aGUgY2xpcCdzIGRvbWFpbiBieSBzY2FsaW5nIGl0IGJ5IGFuXG4gICAgYXJiaXRyYXJpbHkgc21hbGwgY29lZmZpY2llbnQuIFRoaXMgaGFzIHRoZSBhZHZhbnRhZ2Ugb2YgYmVpbmcgYSB1c2VmdWwgZGVmYXVsdCBpbiB0aGUgZXZlbnQgb2YgdGhlXG4gICAgdXNlciBmb3Jnb2luZyBhIG5lYXIgYW5kIGZhciBwbGFuZSwgYW4gYWxpZW4gY29udmVudGlvbiBpbiBkb20gc3BhY2UgYXMgaW4gRE9NIG92ZXJsYXBwaW5nIGlzXG4gICAgY29uZHVjdGVkIHZpYSBwYWludGVyJ3MgYWxnb3JpdGhtLlxuXG4gICAgVGhlIHggYW5kIHkgdHJhbnNsYXRpb24gdHJhbnNmb3JtcyB0aGUgd29ybGQgc3BhY2Ugb3JpZ2luIHRvIHRoZSB0b3AgbGVmdCBjb3JuZXIgb2YgdGhlIHNjcmVlbi5cblxuICAgIFRoZSBmaW5hbCBjb21wb25lbnQgKHRoaXMucHJvamVjdGlvblRyYW5zZm9ybVsxNV0pIGlzIGluaXRpYWxpemVkIGFzIDEgYmVjYXVzZSBjZXJ0YWluIHByb2plY3Rpb24gbW9kZWxzLFxuICAgIGUuZy4gdGhlIFdDMyBzcGVjaWZpZWQgbW9kZWwsIGtlZXAgdGhlIFhZIHBsYW5lIGFzIHRoZSBwcm9qZWN0aW9uIGh5cGVycGxhbmUuXG4gICAgKi9cbiAgICB0aGlzLnByb2plY3Rpb25UcmFuc2Zvcm0gPSBbMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgLTAuMDAwMDAxLCAwLCAtMSwgMSwgMCwgMV07XG5cbiAgICAvLyBUT0RPOiByZW1vdmUgdGhpcyBoYWNrXG5cbiAgICB2YXIgY3V0b3V0ID0gdGhpcy5jdXRvdXRHZW9tZXRyeSA9IG5ldyBQbGFuZSgpO1xuXG4gICAgdGhpcy5idWZmZXJSZWdpc3RyeS5hbGxvY2F0ZShjdXRvdXQuc3BlYy5pZCwgJ2FfcG9zJywgY3V0b3V0LnNwZWMuYnVmZmVyVmFsdWVzWzBdLCAzKTtcbiAgICB0aGlzLmJ1ZmZlclJlZ2lzdHJ5LmFsbG9jYXRlKGN1dG91dC5zcGVjLmlkLCAnYV90ZXhDb29yZCcsIGN1dG91dC5zcGVjLmJ1ZmZlclZhbHVlc1sxXSwgMik7XG4gICAgdGhpcy5idWZmZXJSZWdpc3RyeS5hbGxvY2F0ZShjdXRvdXQuc3BlYy5pZCwgJ2Ffbm9ybWFscycsIGN1dG91dC5zcGVjLmJ1ZmZlclZhbHVlc1syXSwgMyk7XG4gICAgdGhpcy5idWZmZXJSZWdpc3RyeS5hbGxvY2F0ZShjdXRvdXQuc3BlYy5pZCwgJ2luZGljZXMnLCBjdXRvdXQuc3BlYy5idWZmZXJWYWx1ZXNbM10sIDEpO1xufVxuXG4vKipcbiAqIEF0dGVtcHRzIHRvIHJldHJlaXZlIHRoZSBXZWJHTFJlbmRlcmVyIGNvbnRleHQgdXNpbmcgc2V2ZXJhbFxuICogYWNjZXNzb3JzLiBGb3IgYnJvd3NlciBjb21wYXRhYmlsaXR5LiBUaHJvd3Mgb24gZXJyb3IuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBjYW52YXMgQ2FudmFzIGVsZW1lbnQgZnJvbSB3aGljaCB0aGUgY29udGV4dCBpcyByZXRyZWl2ZWRcbiAqXG4gKiBAcmV0dXJuIHtPYmplY3R9IFdlYkdMQ29udGV4dCBvZiBjYW52YXMgZWxlbWVudFxuICovXG5XZWJHTFJlbmRlcmVyLnByb3RvdHlwZS5nZXRXZWJHTENvbnRleHQgPSBmdW5jdGlvbiBnZXRXZWJHTENvbnRleHQoY2FudmFzKSB7XG4gICAgdmFyIG5hbWVzID0gWyd3ZWJnbCcsICdleHBlcmltZW50YWwtd2ViZ2wnLCAnd2Via2l0LTNkJywgJ21vei13ZWJnbCddO1xuICAgIHZhciBjb250ZXh0ID0gbnVsbDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQobmFtZXNbaV0pO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgdmFyIG1zZyA9ICdFcnJvciBjcmVhdGluZyBXZWJHTCBjb250ZXh0OiAnICsgZXJyb3IucHJvdG90eXBlLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKG1zZyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvbnRleHQpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBjb250ZXh0ID8gY29udGV4dCA6IGZhbHNlO1xufTtcblxuLyoqXG4gKiBBZGRzIGEgbmV3IGJhc2Ugc3BlYyB0byB0aGUgbGlnaHQgcmVnaXN0cnkgYXQgYSBnaXZlbiBwYXRoLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gcGF0aCBQYXRoIHVzZWQgYXMgaWQgb2YgbmV3IGxpZ2h0IGluIGxpZ2h0UmVnaXN0cnlcbiAqXG4gKiBAcmV0dXJuIHtPYmplY3R9IE5ld2x5IGNyZWF0ZWQgbGlnaHQgc3BlY1xuICovXG5XZWJHTFJlbmRlcmVyLnByb3RvdHlwZS5jcmVhdGVMaWdodCA9IGZ1bmN0aW9uIGNyZWF0ZUxpZ2h0KHBhdGgpIHtcbiAgICB0aGlzLm51bUxpZ2h0cysrO1xuICAgIHRoaXMubGlnaHRSZWdpc3RyeUtleXMucHVzaChwYXRoKTtcbiAgICB0aGlzLmxpZ2h0UmVnaXN0cnlbcGF0aF0gPSB7XG4gICAgICAgIGNvbG9yOiBbMCwgMCwgMF0sXG4gICAgICAgIHBvc2l0aW9uOiBbMCwgMCwgMF1cbiAgICB9O1xuICAgIHJldHVybiB0aGlzLmxpZ2h0UmVnaXN0cnlbcGF0aF07XG59O1xuXG4vKipcbiAqIEFkZHMgYSBuZXcgYmFzZSBzcGVjIHRvIHRoZSBtZXNoIHJlZ2lzdHJ5IGF0IGEgZ2l2ZW4gcGF0aC5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHBhdGggUGF0aCB1c2VkIGFzIGlkIG9mIG5ldyBtZXNoIGluIG1lc2hSZWdpc3RyeS5cbiAqXG4gKiBAcmV0dXJuIHtPYmplY3R9IE5ld2x5IGNyZWF0ZWQgbWVzaCBzcGVjLlxuICovXG5XZWJHTFJlbmRlcmVyLnByb3RvdHlwZS5jcmVhdGVNZXNoID0gZnVuY3Rpb24gY3JlYXRlTWVzaChwYXRoKSB7XG4gICAgdGhpcy5tZXNoUmVnaXN0cnlLZXlzLnB1c2gocGF0aCk7XG5cbiAgICB2YXIgdW5pZm9ybXMgPSBrZXlWYWx1ZVRvQXJyYXlzKHtcbiAgICAgICAgdV9vcGFjaXR5OiAxLFxuICAgICAgICB1X3RyYW5zZm9ybTogaWRlbnRpdHksXG4gICAgICAgIHVfc2l6ZTogWzAsIDAsIDBdLFxuICAgICAgICB1X2Jhc2VDb2xvcjogWzAuNSwgMC41LCAwLjUsIDFdLFxuICAgICAgICB1X3Bvc2l0aW9uT2Zmc2V0OiBbMCwgMCwgMF0sXG4gICAgICAgIHVfbm9ybWFsczogWzAsIDAsIDBdLFxuICAgICAgICB1X2ZsYXRTaGFkaW5nOiAwLFxuICAgICAgICB1X2dsb3NzaW5lc3M6IFswLCAwLCAwLCAwXVxuICAgIH0pO1xuICAgIHRoaXMubWVzaFJlZ2lzdHJ5W3BhdGhdID0ge1xuICAgICAgICBkZXB0aDogbnVsbCxcbiAgICAgICAgdW5pZm9ybUtleXM6IHVuaWZvcm1zLmtleXMsXG4gICAgICAgIHVuaWZvcm1WYWx1ZXM6IHVuaWZvcm1zLnZhbHVlcyxcbiAgICAgICAgYnVmZmVyczoge30sXG4gICAgICAgIGdlb21ldHJ5OiBudWxsLFxuICAgICAgICBkcmF3VHlwZTogbnVsbCxcbiAgICAgICAgdGV4dHVyZXM6IFtdLFxuICAgICAgICB2aXNpYmxlOiB0cnVlXG4gICAgfTtcbiAgICByZXR1cm4gdGhpcy5tZXNoUmVnaXN0cnlbcGF0aF07XG59O1xuXG4vKipcbiAqIFNldHMgZmxhZyBvbiBpbmRpY2F0aW5nIHdoZXRoZXIgdG8gZG8gc2tpcCBkcmF3IHBoYXNlIGZvclxuICogY3V0b3V0IG1lc2ggYXQgZ2l2ZW4gcGF0aC5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHBhdGggUGF0aCB1c2VkIGFzIGlkIG9mIHRhcmdldCBjdXRvdXQgbWVzaC5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gdXNlc0N1dG91dCBJbmRpY2F0ZXMgdGhlIHByZXNlbmNlIG9mIGEgY3V0b3V0IG1lc2hcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5XZWJHTFJlbmRlcmVyLnByb3RvdHlwZS5zZXRDdXRvdXRTdGF0ZSA9IGZ1bmN0aW9uIHNldEN1dG91dFN0YXRlKHBhdGgsIHVzZXNDdXRvdXQpIHtcbiAgICB2YXIgY3V0b3V0ID0gdGhpcy5nZXRPclNldEN1dG91dChwYXRoKTtcblxuICAgIGN1dG91dC52aXNpYmxlID0gdXNlc0N1dG91dDtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBvciByZXRyZWl2ZXMgY3V0b3V0XG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIFBhdGggdXNlZCBhcyBpZCBvZiB0YXJnZXQgY3V0b3V0IG1lc2guXG4gKlxuICogQHJldHVybiB7T2JqZWN0fSBOZXdseSBjcmVhdGVkIGN1dG91dCBzcGVjLlxuICovXG5XZWJHTFJlbmRlcmVyLnByb3RvdHlwZS5nZXRPclNldEN1dG91dCA9IGZ1bmN0aW9uIGdldE9yU2V0Q3V0b3V0KHBhdGgpIHtcbiAgICBpZiAodGhpcy5jdXRvdXRSZWdpc3RyeVtwYXRoXSkge1xuICAgICAgICByZXR1cm4gdGhpcy5jdXRvdXRSZWdpc3RyeVtwYXRoXTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHZhciB1bmlmb3JtcyA9IGtleVZhbHVlVG9BcnJheXMoe1xuICAgICAgICAgICAgdV9vcGFjaXR5OiAwLFxuICAgICAgICAgICAgdV90cmFuc2Zvcm06IGlkZW50aXR5LnNsaWNlKCksXG4gICAgICAgICAgICB1X3NpemU6IFswLCAwLCAwXSxcbiAgICAgICAgICAgIHVfb3JpZ2luOiBbMCwgMCwgMF0sXG4gICAgICAgICAgICB1X2Jhc2VDb2xvcjogWzAsIDAsIDAsIDFdXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuY3V0b3V0UmVnaXN0cnlLZXlzLnB1c2gocGF0aCk7XG5cbiAgICAgICAgdGhpcy5jdXRvdXRSZWdpc3RyeVtwYXRoXSA9IHtcbiAgICAgICAgICAgIHVuaWZvcm1LZXlzOiB1bmlmb3Jtcy5rZXlzLFxuICAgICAgICAgICAgdW5pZm9ybVZhbHVlczogdW5pZm9ybXMudmFsdWVzLFxuICAgICAgICAgICAgZ2VvbWV0cnk6IHRoaXMuY3V0b3V0R2VvbWV0cnkuc3BlYy5pZCxcbiAgICAgICAgICAgIGRyYXdUeXBlOiB0aGlzLmN1dG91dEdlb21ldHJ5LnNwZWMudHlwZSxcbiAgICAgICAgICAgIHZpc2libGU6IHRydWVcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gdGhpcy5jdXRvdXRSZWdpc3RyeVtwYXRoXTtcbiAgICB9XG59O1xuXG4vKipcbiAqIFNldHMgZmxhZyBvbiBpbmRpY2F0aW5nIHdoZXRoZXIgdG8gZG8gc2tpcCBkcmF3IHBoYXNlIGZvclxuICogbWVzaCBhdCBnaXZlbiBwYXRoLlxuICpcbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIFBhdGggdXNlZCBhcyBpZCBvZiB0YXJnZXQgbWVzaC5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gdmlzaWJpbGl0eSBJbmRpY2F0ZXMgdGhlIHZpc2liaWxpdHkgb2YgdGFyZ2V0IG1lc2guXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuV2ViR0xSZW5kZXJlci5wcm90b3R5cGUuc2V0TWVzaFZpc2liaWxpdHkgPSBmdW5jdGlvbiBzZXRNZXNoVmlzaWJpbGl0eShwYXRoLCB2aXNpYmlsaXR5KSB7XG4gICAgdmFyIG1lc2ggPSB0aGlzLm1lc2hSZWdpc3RyeVtwYXRoXSB8fCB0aGlzLmNyZWF0ZU1lc2gocGF0aCk7XG5cbiAgICBtZXNoLnZpc2libGUgPSB2aXNpYmlsaXR5O1xufTtcblxuLyoqXG4gKiBEZWxldGVzIGEgbWVzaCBmcm9tIHRoZSBtZXNoUmVnaXN0cnkuXG4gKlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtTdHJpbmd9IHBhdGggUGF0aCB1c2VkIGFzIGlkIG9mIHRhcmdldCBtZXNoLlxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbldlYkdMUmVuZGVyZXIucHJvdG90eXBlLnJlbW92ZU1lc2ggPSBmdW5jdGlvbiByZW1vdmVNZXNoKHBhdGgpIHtcbiAgICB2YXIga2V5TG9jYXRpb24gPSB0aGlzLm1lc2hSZWdpc3RyeUtleXMuaW5kZXhPZihwYXRoKTtcbiAgICB0aGlzLm1lc2hSZWdpc3RyeUtleXMuc3BsaWNlKGtleUxvY2F0aW9uLCAxKTtcbiAgICB0aGlzLm1lc2hSZWdpc3RyeVtwYXRoXSA9IG51bGw7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgb3IgcmV0cmVpdmVzIGN1dG91dFxuICpcbiAqIEBtZXRob2RcbiAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIFBhdGggdXNlZCBhcyBpZCBvZiBjdXRvdXQgaW4gY3V0b3V0IHJlZ2lzdHJ5LlxuICogQHBhcmFtIHtTdHJpbmd9IHVuaWZvcm1OYW1lIElkZW50aWZpZXIgdXNlZCB0byB1cGxvYWQgdmFsdWVcbiAqIEBwYXJhbSB7QXJyYXl9IHVuaWZvcm1WYWx1ZSBWYWx1ZSBvZiB1bmlmb3JtIGRhdGFcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5XZWJHTFJlbmRlcmVyLnByb3RvdHlwZS5zZXRDdXRvdXRVbmlmb3JtID0gZnVuY3Rpb24gc2V0Q3V0b3V0VW5pZm9ybShwYXRoLCB1bmlmb3JtTmFtZSwgdW5pZm9ybVZhbHVlKSB7XG4gICAgdmFyIGN1dG91dCA9IHRoaXMuZ2V0T3JTZXRDdXRvdXQocGF0aCk7XG5cbiAgICB2YXIgaW5kZXggPSBjdXRvdXQudW5pZm9ybUtleXMuaW5kZXhPZih1bmlmb3JtTmFtZSk7XG5cbiAgICBpZiAoQXJyYXkuaXNBcnJheSh1bmlmb3JtVmFsdWUpKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB1bmlmb3JtVmFsdWUubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIGN1dG91dC51bmlmb3JtVmFsdWVzW2luZGV4XVtpXSA9IHVuaWZvcm1WYWx1ZVtpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgY3V0b3V0LnVuaWZvcm1WYWx1ZXNbaW5kZXhdID0gdW5pZm9ybVZhbHVlO1xuICAgIH1cbn07XG5cbi8qKlxuICogRWRpdHMgdGhlIG9wdGlvbnMgZmllbGQgb24gYSBtZXNoXG4gKlxuICogQG1ldGhvZFxuICogQHBhcmFtIHtTdHJpbmd9IHBhdGggUGF0aCB1c2VkIGFzIGlkIG9mIHRhcmdldCBtZXNoXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBNYXAgb2YgZHJhdyBvcHRpb25zIGZvciBtZXNoXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbioqL1xuV2ViR0xSZW5kZXJlci5wcm90b3R5cGUuc2V0TWVzaE9wdGlvbnMgPSBmdW5jdGlvbihwYXRoLCBvcHRpb25zKSB7XG4gICAgdmFyIG1lc2ggPSB0aGlzLm1lc2hSZWdpc3RyeVtwYXRoXSB8fCB0aGlzLmNyZWF0ZU1lc2gocGF0aCk7XG5cbiAgICBtZXNoLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBDaGFuZ2VzIHRoZSBjb2xvciBvZiB0aGUgZml4ZWQgaW50ZW5zaXR5IGxpZ2h0aW5nIGluIHRoZSBzY2VuZVxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gcGF0aCBQYXRoIHVzZWQgYXMgaWQgb2YgbGlnaHRcbiAqIEBwYXJhbSB7TnVtYmVyfSByIHJlZCBjaGFubmVsXG4gKiBAcGFyYW0ge051bWJlcn0gZyBncmVlbiBjaGFubmVsXG4gKiBAcGFyYW0ge051bWJlcn0gYiBibHVlIGNoYW5uZWxcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuKiovXG5XZWJHTFJlbmRlcmVyLnByb3RvdHlwZS5zZXRBbWJpZW50TGlnaHRDb2xvciA9IGZ1bmN0aW9uIHNldEFtYmllbnRMaWdodENvbG9yKHBhdGgsIHIsIGcsIGIpIHtcbiAgICB0aGlzLmFtYmllbnRMaWdodENvbG9yWzBdID0gcjtcbiAgICB0aGlzLmFtYmllbnRMaWdodENvbG9yWzFdID0gZztcbiAgICB0aGlzLmFtYmllbnRMaWdodENvbG9yWzJdID0gYjtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQ2hhbmdlcyB0aGUgbG9jYXRpb24gb2YgdGhlIGxpZ2h0IGluIHRoZSBzY2VuZVxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gcGF0aCBQYXRoIHVzZWQgYXMgaWQgb2YgbGlnaHRcbiAqIEBwYXJhbSB7TnVtYmVyfSB4IHggcG9zaXRpb25cbiAqIEBwYXJhbSB7TnVtYmVyfSB5IHkgcG9zaXRpb25cbiAqIEBwYXJhbSB7TnVtYmVyfSB6IHogcG9zaXRpb25cbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuKiovXG5XZWJHTFJlbmRlcmVyLnByb3RvdHlwZS5zZXRMaWdodFBvc2l0aW9uID0gZnVuY3Rpb24gc2V0TGlnaHRQb3NpdGlvbihwYXRoLCB4LCB5LCB6KSB7XG4gICAgdmFyIGxpZ2h0ID0gdGhpcy5saWdodFJlZ2lzdHJ5W3BhdGhdIHx8IHRoaXMuY3JlYXRlTGlnaHQocGF0aCk7XG5cbiAgICBsaWdodC5wb3NpdGlvblswXSA9IHg7XG4gICAgbGlnaHQucG9zaXRpb25bMV0gPSB5O1xuICAgIGxpZ2h0LnBvc2l0aW9uWzJdID0gejtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogQ2hhbmdlcyB0aGUgY29sb3Igb2YgYSBkeW5hbWljIGludGVuc2l0eSBsaWdodGluZyBpbiB0aGUgc2NlbmVcbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHBhdGggUGF0aCB1c2VkIGFzIGlkIG9mIGxpZ2h0IGluIGxpZ2h0IFJlZ2lzdHJ5LlxuICogQHBhcmFtIHtOdW1iZXJ9IHIgcmVkIGNoYW5uZWxcbiAqIEBwYXJhbSB7TnVtYmVyfSBnIGdyZWVuIGNoYW5uZWxcbiAqIEBwYXJhbSB7TnVtYmVyfSBiIGJsdWUgY2hhbm5lbFxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4qKi9cbldlYkdMUmVuZGVyZXIucHJvdG90eXBlLnNldExpZ2h0Q29sb3IgPSBmdW5jdGlvbiBzZXRMaWdodENvbG9yKHBhdGgsIHIsIGcsIGIpIHtcbiAgICB2YXIgbGlnaHQgPSB0aGlzLmxpZ2h0UmVnaXN0cnlbcGF0aF0gfHwgdGhpcy5jcmVhdGVMaWdodChwYXRoKTtcblxuICAgIGxpZ2h0LmNvbG9yWzBdID0gcjtcbiAgICBsaWdodC5jb2xvclsxXSA9IGc7XG4gICAgbGlnaHQuY29sb3JbMl0gPSBiO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBDb21waWxlcyBtYXRlcmlhbCBzcGVjIGludG8gcHJvZ3JhbSBzaGFkZXJcbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHBhdGggUGF0aCB1c2VkIGFzIGlkIG9mIGN1dG91dCBpbiBjdXRvdXQgcmVnaXN0cnkuXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBOYW1lIHRoYXQgdGhlIHJlbmRlcmluZyBpbnB1dCB0aGUgbWF0ZXJpYWwgaXMgYm91bmQgdG9cbiAqIEBwYXJhbSB7T2JqZWN0fSBtYXRlcmlhbCBNYXRlcmlhbCBzcGVjXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbioqL1xuV2ViR0xSZW5kZXJlci5wcm90b3R5cGUuaGFuZGxlTWF0ZXJpYWxJbnB1dCA9IGZ1bmN0aW9uIGhhbmRsZU1hdGVyaWFsSW5wdXQocGF0aCwgbmFtZSwgbWF0ZXJpYWwpIHtcbiAgICB2YXIgbWVzaCA9IHRoaXMubWVzaFJlZ2lzdHJ5W3BhdGhdIHx8IHRoaXMuY3JlYXRlTWVzaChwYXRoKTtcbiAgICBtYXRlcmlhbCA9IGNvbXBpbGVNYXRlcmlhbChtYXRlcmlhbCwgbWVzaC50ZXh0dXJlcy5sZW5ndGgpO1xuXG4gICAgLy8gU2V0IHVuaWZvcm1zIHRvIGVuYWJsZSB0ZXh0dXJlIVxuXG4gICAgbWVzaC51bmlmb3JtVmFsdWVzW21lc2gudW5pZm9ybUtleXMuaW5kZXhPZihuYW1lKV1bMF0gPSAtbWF0ZXJpYWwuX2lkO1xuXG4gICAgLy8gUmVnaXN0ZXIgdGV4dHVyZXMhXG5cbiAgICB2YXIgaSA9IG1hdGVyaWFsLnRleHR1cmVzLmxlbmd0aDtcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgIG1lc2gudGV4dHVyZXMucHVzaChcbiAgICAgICAgICAgIHRoaXMudGV4dHVyZU1hbmFnZXIucmVnaXN0ZXIobWF0ZXJpYWwudGV4dHVyZXNbaV0sIG1lc2gudGV4dHVyZXMubGVuZ3RoICsgaSlcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBSZWdpc3RlciBtYXRlcmlhbCFcblxuICAgIHRoaXMucHJvZ3JhbS5yZWdpc3Rlck1hdGVyaWFsKG5hbWUsIG1hdGVyaWFsKTtcblxuICAgIHJldHVybiB0aGlzLnVwZGF0ZVNpemUoKTtcbn07XG5cbi8qKlxuICogQ2hhbmdlcyB0aGUgZ2VvbWV0cnkgZGF0YSBvZiBhIG1lc2hcbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHBhdGggUGF0aCB1c2VkIGFzIGlkIG9mIGN1dG91dCBpbiBjdXRvdXQgcmVnaXN0cnkuXG4gKiBAcGFyYW0ge09iamVjdH0gZ2VvbWV0cnkgR2VvbWV0cnkgb2JqZWN0IGNvbnRhaW5pbmcgdmVydGV4IGRhdGEgdG8gYmUgZHJhd25cbiAqIEBwYXJhbSB7TnVtYmVyfSBkcmF3VHlwZSBQcmltaXRpdmUgaWRlbnRpZmllclxuICogQHBhcmFtIHtCb29sZWFufSBkeW5hbWljIFdoZXRoZXIgZ2VvbWV0cnkgaXMgZHluYW1pY1xuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4qKi9cbldlYkdMUmVuZGVyZXIucHJvdG90eXBlLnNldEdlb21ldHJ5ID0gZnVuY3Rpb24gc2V0R2VvbWV0cnkocGF0aCwgZ2VvbWV0cnksIGRyYXdUeXBlLCBkeW5hbWljKSB7XG4gICAgdmFyIG1lc2ggPSB0aGlzLm1lc2hSZWdpc3RyeVtwYXRoXSB8fCB0aGlzLmNyZWF0ZU1lc2gocGF0aCk7XG5cbiAgICBtZXNoLmdlb21ldHJ5ID0gZ2VvbWV0cnk7XG4gICAgbWVzaC5kcmF3VHlwZSA9IGRyYXdUeXBlO1xuICAgIG1lc2guZHluYW1pYyA9IGR5bmFtaWM7XG5cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogVXBsb2FkcyBhIG5ldyB2YWx1ZSBmb3IgdGhlIHVuaWZvcm0gZGF0YSB3aGVuIHRoZSBtZXNoIGlzIGJlaW5nIGRyYXduXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIFBhdGggdXNlZCBhcyBpZCBvZiBtZXNoIGluIG1lc2ggcmVnaXN0cnlcbiAqIEBwYXJhbSB7U3RyaW5nfSB1bmlmb3JtTmFtZSBJZGVudGlmaWVyIHVzZWQgdG8gdXBsb2FkIHZhbHVlXG4gKiBAcGFyYW0ge0FycmF5fSB1bmlmb3JtVmFsdWUgVmFsdWUgb2YgdW5pZm9ybSBkYXRhXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbioqL1xuV2ViR0xSZW5kZXJlci5wcm90b3R5cGUuc2V0TWVzaFVuaWZvcm0gPSBmdW5jdGlvbiBzZXRNZXNoVW5pZm9ybShwYXRoLCB1bmlmb3JtTmFtZSwgdW5pZm9ybVZhbHVlKSB7XG4gICAgdmFyIG1lc2ggPSB0aGlzLm1lc2hSZWdpc3RyeVtwYXRoXSB8fCB0aGlzLmNyZWF0ZU1lc2gocGF0aCk7XG5cbiAgICB2YXIgaW5kZXggPSBtZXNoLnVuaWZvcm1LZXlzLmluZGV4T2YodW5pZm9ybU5hbWUpO1xuXG4gICAgaWYgKGluZGV4ID09PSAtMSkge1xuICAgICAgICBtZXNoLnVuaWZvcm1LZXlzLnB1c2godW5pZm9ybU5hbWUpO1xuICAgICAgICBtZXNoLnVuaWZvcm1WYWx1ZXMucHVzaCh1bmlmb3JtVmFsdWUpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgbWVzaC51bmlmb3JtVmFsdWVzW2luZGV4XSA9IHVuaWZvcm1WYWx1ZTtcbiAgICB9XG59O1xuXG4vKipcbiAqIFRyaWdnZXJzIHRoZSAnZHJhdycgcGhhc2Ugb2YgdGhlIFdlYkdMUmVuZGVyZXIuIEl0ZXJhdGVzIHRocm91Z2ggcmVnaXN0cmllc1xuICogdG8gc2V0IHVuaWZvcm1zLCBzZXQgYXR0cmlidXRlcyBhbmQgaXNzdWUgZHJhdyBjb21tYW5kcyBmb3IgcmVuZGVyYWJsZXMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIFBhdGggdXNlZCBhcyBpZCBvZiBtZXNoIGluIG1lc2ggcmVnaXN0cnlcbiAqIEBwYXJhbSB7TnVtYmVyfSBnZW9tZXRyeUlkIElkIG9mIGdlb21ldHJ5IGluIGdlb21ldHJ5IHJlZ2lzdHJ5XG4gKiBAcGFyYW0ge1N0cmluZ30gYnVmZmVyTmFtZSBBdHRyaWJ1dGUgbG9jYXRpb24gbmFtZVxuICogQHBhcmFtIHtBcnJheX0gYnVmZmVyVmFsdWUgVmVydGV4IGRhdGFcbiAqIEBwYXJhbSB7TnVtYmVyfSBidWZmZXJTcGFjaW5nIFRoZSBkaW1lbnNpb25zIG9mIHRoZSB2ZXJ0ZXhcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gaXNEeW5hbWljIFdoZXRoZXIgZ2VvbWV0cnkgaXMgZHluYW1pY1xuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbldlYkdMUmVuZGVyZXIucHJvdG90eXBlLmJ1ZmZlckRhdGEgPSBmdW5jdGlvbiBidWZmZXJEYXRhKHBhdGgsIGdlb21ldHJ5SWQsIGJ1ZmZlck5hbWUsIGJ1ZmZlclZhbHVlLCBidWZmZXJTcGFjaW5nLCBpc0R5bmFtaWMpIHtcbiAgICB0aGlzLmJ1ZmZlclJlZ2lzdHJ5LmFsbG9jYXRlKGdlb21ldHJ5SWQsIGJ1ZmZlck5hbWUsIGJ1ZmZlclZhbHVlLCBidWZmZXJTcGFjaW5nLCBpc0R5bmFtaWMpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFRyaWdnZXJzIHRoZSAnZHJhdycgcGhhc2Ugb2YgdGhlIFdlYkdMUmVuZGVyZXIuIEl0ZXJhdGVzIHRocm91Z2ggcmVnaXN0cmllc1xuICogdG8gc2V0IHVuaWZvcm1zLCBzZXQgYXR0cmlidXRlcyBhbmQgaXNzdWUgZHJhdyBjb21tYW5kcyBmb3IgcmVuZGVyYWJsZXMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSByZW5kZXJTdGF0ZSBQYXJhbWV0ZXJzIHByb3ZpZGVkIGJ5IHRoZSBjb21wb3NpdG9yLCB0aGF0IGFmZmVjdCB0aGUgcmVuZGVyaW5nIG9mIGFsbCByZW5kZXJhYmxlcy5cbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5XZWJHTFJlbmRlcmVyLnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24gZHJhdyhyZW5kZXJTdGF0ZSkge1xuICAgIHZhciB0aW1lID0gdGhpcy5jb21wb3NpdG9yLmdldFRpbWUoKTtcblxuICAgIHRoaXMuZ2wuY2xlYXIodGhpcy5nbC5DT0xPUl9CVUZGRVJfQklUIHwgdGhpcy5nbC5ERVBUSF9CVUZGRVJfQklUKTtcbiAgICB0aGlzLnRleHR1cmVNYW5hZ2VyLnVwZGF0ZSh0aW1lKTtcblxuICAgIHRoaXMubWVzaFJlZ2lzdHJ5S2V5cyA9IHNvcnRlcih0aGlzLm1lc2hSZWdpc3RyeUtleXMsIHRoaXMubWVzaFJlZ2lzdHJ5KTtcblxuICAgIHRoaXMuc2V0R2xvYmFsVW5pZm9ybXMocmVuZGVyU3RhdGUpO1xuICAgIHRoaXMuZHJhd0N1dG91dHMoKTtcbiAgICB0aGlzLmRyYXdNZXNoZXMoKTtcbn07XG5cbi8qKlxuICogSXRlcmF0ZXMgdGhyb3VnaCBhbmQgZHJhd3MgYWxsIHJlZ2lzdGVyZWQgbWVzaGVzLiBUaGlzIGluY2x1ZGVzXG4gKiBiaW5kaW5nIHRleHR1cmVzLCBoYW5kbGluZyBkcmF3IG9wdGlvbnMsIHNldHRpbmcgbWVzaCB1bmlmb3Jtc1xuICogYW5kIGRyYXdpbmcgbWVzaCBidWZmZXJzLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5XZWJHTFJlbmRlcmVyLnByb3RvdHlwZS5kcmF3TWVzaGVzID0gZnVuY3Rpb24gZHJhd01lc2hlcygpIHtcbiAgICB2YXIgZ2wgPSB0aGlzLmdsO1xuICAgIHZhciBidWZmZXJzO1xuICAgIHZhciBtZXNoO1xuXG4gICAgZm9yKHZhciBpID0gMDsgaSA8IHRoaXMubWVzaFJlZ2lzdHJ5S2V5cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBtZXNoID0gdGhpcy5tZXNoUmVnaXN0cnlbdGhpcy5tZXNoUmVnaXN0cnlLZXlzW2ldXTtcbiAgICAgICAgYnVmZmVycyA9IHRoaXMuYnVmZmVyUmVnaXN0cnkucmVnaXN0cnlbbWVzaC5nZW9tZXRyeV07XG5cbiAgICAgICAgaWYgKCFtZXNoLnZpc2libGUpIGNvbnRpbnVlO1xuXG4gICAgICAgIGlmIChtZXNoLnVuaWZvcm1WYWx1ZXNbMF0gPCAxKSB7XG4gICAgICAgICAgICBnbC5kZXB0aE1hc2soZmFsc2UpO1xuICAgICAgICAgICAgZ2wuZW5hYmxlKGdsLkJMRU5EKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGdsLmRlcHRoTWFzayh0cnVlKTtcbiAgICAgICAgICAgIGdsLmRpc2FibGUoZ2wuQkxFTkQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFidWZmZXJzKSBjb250aW51ZTtcblxuICAgICAgICB2YXIgaiA9IG1lc2gudGV4dHVyZXMubGVuZ3RoO1xuICAgICAgICB3aGlsZSAoai0tKSB0aGlzLnRleHR1cmVNYW5hZ2VyLmJpbmRUZXh0dXJlKG1lc2gudGV4dHVyZXNbal0pO1xuXG4gICAgICAgIGlmIChtZXNoLm9wdGlvbnMpIHRoaXMuaGFuZGxlT3B0aW9ucyhtZXNoLm9wdGlvbnMsIG1lc2gpO1xuXG4gICAgICAgIHRoaXMucHJvZ3JhbS5zZXRVbmlmb3JtcyhtZXNoLnVuaWZvcm1LZXlzLCBtZXNoLnVuaWZvcm1WYWx1ZXMpO1xuICAgICAgICB0aGlzLmRyYXdCdWZmZXJzKGJ1ZmZlcnMsIG1lc2guZHJhd1R5cGUsIG1lc2guZ2VvbWV0cnkpO1xuXG4gICAgICAgIGlmIChtZXNoLm9wdGlvbnMpIHRoaXMucmVzZXRPcHRpb25zKG1lc2gub3B0aW9ucyk7XG4gICAgfVxufTtcblxuLyoqXG4gKiBJdGVyYXRlcyB0aHJvdWdoIGFuZCBkcmF3cyBhbGwgcmVnaXN0ZXJlZCBjdXRvdXQgbWVzaGVzLiBCbGVuZGluZ1xuICogaXMgZGlzYWJsZWQsIGN1dG91dCB1bmlmb3JtcyBhcmUgc2V0IGFuZCBmaW5hbGx5IGJ1ZmZlcnMgYXJlIGRyYXduLlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5XZWJHTFJlbmRlcmVyLnByb3RvdHlwZS5kcmF3Q3V0b3V0cyA9IGZ1bmN0aW9uIGRyYXdDdXRvdXRzKCkge1xuICAgIHZhciBjdXRvdXQ7XG4gICAgdmFyIGJ1ZmZlcnM7XG4gICAgdmFyIGxlbiA9IHRoaXMuY3V0b3V0UmVnaXN0cnlLZXlzLmxlbmd0aDtcblxuICAgIGlmIChsZW4pIHtcbiAgICAgICAgdGhpcy5nbC5lbmFibGUodGhpcy5nbC5CTEVORCk7XG4gICAgICAgIHRoaXMuZ2wuZGVwdGhNYXNrKHRydWUpO1xuICAgIH1cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgY3V0b3V0ID0gdGhpcy5jdXRvdXRSZWdpc3RyeVt0aGlzLmN1dG91dFJlZ2lzdHJ5S2V5c1tpXV07XG4gICAgICAgIGJ1ZmZlcnMgPSB0aGlzLmJ1ZmZlclJlZ2lzdHJ5LnJlZ2lzdHJ5W2N1dG91dC5nZW9tZXRyeV07XG5cbiAgICAgICAgaWYgKCFjdXRvdXQudmlzaWJsZSkgY29udGludWU7XG5cbiAgICAgICAgdGhpcy5wcm9ncmFtLnNldFVuaWZvcm1zKGN1dG91dC51bmlmb3JtS2V5cywgY3V0b3V0LnVuaWZvcm1WYWx1ZXMpO1xuICAgICAgICB0aGlzLmRyYXdCdWZmZXJzKGJ1ZmZlcnMsIGN1dG91dC5kcmF3VHlwZSwgY3V0b3V0Lmdlb21ldHJ5KTtcbiAgICB9XG59O1xuXG4vKipcbiAqIFNldHMgdW5pZm9ybXMgdG8gYmUgc2hhcmVkIGJ5IGFsbCBtZXNoZXMuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSByZW5kZXJTdGF0ZSBEcmF3IHN0YXRlIG9wdGlvbnMgcGFzc2VkIGRvd24gZnJvbSBjb21wb3NpdG9yLlxuICpcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH0gdW5kZWZpbmVkXG4gKi9cbldlYkdMUmVuZGVyZXIucHJvdG90eXBlLnNldEdsb2JhbFVuaWZvcm1zID0gZnVuY3Rpb24gc2V0R2xvYmFsVW5pZm9ybXMocmVuZGVyU3RhdGUpIHtcbiAgICB2YXIgbGlnaHQ7XG4gICAgdmFyIHN0cmlkZTtcblxuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLmxpZ2h0UmVnaXN0cnlLZXlzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIGxpZ2h0ID0gdGhpcy5saWdodFJlZ2lzdHJ5W3RoaXMubGlnaHRSZWdpc3RyeUtleXNbaV1dO1xuICAgICAgICBzdHJpZGUgPSBpICogNDtcblxuICAgICAgICAvLyBCdWlsZCB0aGUgbGlnaHQgcG9zaXRpb25zJyA0eDQgbWF0cml4XG5cbiAgICAgICAgdGhpcy5saWdodFBvc2l0aW9uc1swICsgc3RyaWRlXSA9IGxpZ2h0LnBvc2l0aW9uWzBdO1xuICAgICAgICB0aGlzLmxpZ2h0UG9zaXRpb25zWzEgKyBzdHJpZGVdID0gbGlnaHQucG9zaXRpb25bMV07XG4gICAgICAgIHRoaXMubGlnaHRQb3NpdGlvbnNbMiArIHN0cmlkZV0gPSBsaWdodC5wb3NpdGlvblsyXTtcblxuICAgICAgICAvLyBCdWlsZCB0aGUgbGlnaHQgY29sb3JzJyA0eDQgbWF0cml4XG5cbiAgICAgICAgdGhpcy5saWdodENvbG9yc1swICsgc3RyaWRlXSA9IGxpZ2h0LmNvbG9yWzBdO1xuICAgICAgICB0aGlzLmxpZ2h0Q29sb3JzWzEgKyBzdHJpZGVdID0gbGlnaHQuY29sb3JbMV07XG4gICAgICAgIHRoaXMubGlnaHRDb2xvcnNbMiArIHN0cmlkZV0gPSBsaWdodC5jb2xvclsyXTtcbiAgICB9XG5cbiAgICBnbG9iYWxVbmlmb3Jtcy52YWx1ZXNbMF0gPSB0aGlzLm51bUxpZ2h0cztcbiAgICBnbG9iYWxVbmlmb3Jtcy52YWx1ZXNbMV0gPSB0aGlzLmFtYmllbnRMaWdodENvbG9yO1xuICAgIGdsb2JhbFVuaWZvcm1zLnZhbHVlc1syXSA9IHRoaXMubGlnaHRQb3NpdGlvbnM7XG4gICAgZ2xvYmFsVW5pZm9ybXMudmFsdWVzWzNdID0gdGhpcy5saWdodENvbG9ycztcblxuICAgIC8qXG4gICAgICogU2V0IHRpbWUgYW5kIHByb2plY3Rpb24gdW5pZm9ybXNcbiAgICAgKiBwcm9qZWN0aW5nIHdvcmxkIHNwYWNlIGludG8gYSAyZCBwbGFuZSByZXByZXNlbnRhdGlvbiBvZiB0aGUgY2FudmFzLlxuICAgICAqIFRoZSB4IGFuZCB5IHNjYWxlICh0aGlzLnByb2plY3Rpb25UcmFuc2Zvcm1bMF0gYW5kIHRoaXMucHJvamVjdGlvblRyYW5zZm9ybVs1XSByZXNwZWN0aXZlbHkpXG4gICAgICogY29udmVydCB0aGUgcHJvamVjdGVkIGdlb21ldHJ5IGJhY2sgaW50byBjbGlwc3BhY2UuXG4gICAgICogVGhlIHBlcnBlY3RpdmUgZGl2aWRlICh0aGlzLnByb2plY3Rpb25UcmFuc2Zvcm1bMTFdKSwgYWRkcyB0aGUgeiB2YWx1ZSBvZiB0aGUgcG9pbnRcbiAgICAgKiBtdWx0aXBsaWVkIGJ5IHRoZSBwZXJzcGVjdGl2ZSBkaXZpZGUgdG8gdGhlIHcgdmFsdWUgb2YgdGhlIHBvaW50LiBJbiB0aGUgcHJvY2Vzc1xuICAgICAqIG9mIGNvbnZlcnRpbmcgZnJvbSBob21vZ2Vub3VzIGNvb3JkaW5hdGVzIHRvIE5EQyAobm9ybWFsaXplZCBkZXZpY2UgY29vcmRpbmF0ZXMpXG4gICAgICogdGhlIHggYW5kIHkgdmFsdWVzIG9mIHRoZSBwb2ludCBhcmUgZGl2aWRlZCBieSB3LCB3aGljaCBpbXBsZW1lbnRzIHBlcnNwZWN0aXZlLlxuICAgICAqL1xuICAgIHRoaXMucHJvamVjdGlvblRyYW5zZm9ybVswXSA9IDEgLyAodGhpcy5jYWNoZWRTaXplWzBdICogMC41KTtcbiAgICB0aGlzLnByb2plY3Rpb25UcmFuc2Zvcm1bNV0gPSAtMSAvICh0aGlzLmNhY2hlZFNpemVbMV0gKiAwLjUpO1xuICAgIHRoaXMucHJvamVjdGlvblRyYW5zZm9ybVsxMV0gPSByZW5kZXJTdGF0ZS5wZXJzcGVjdGl2ZVRyYW5zZm9ybVsxMV07XG5cbiAgICBnbG9iYWxVbmlmb3Jtcy52YWx1ZXNbNF0gPSB0aGlzLnByb2plY3Rpb25UcmFuc2Zvcm07XG4gICAgZ2xvYmFsVW5pZm9ybXMudmFsdWVzWzVdID0gdGhpcy5jb21wb3NpdG9yLmdldFRpbWUoKSAqIDAuMDAxO1xuICAgIGdsb2JhbFVuaWZvcm1zLnZhbHVlc1s2XSA9IHJlbmRlclN0YXRlLnZpZXdUcmFuc2Zvcm07XG5cbiAgICB0aGlzLnByb2dyYW0uc2V0VW5pZm9ybXMoZ2xvYmFsVW5pZm9ybXMua2V5cywgZ2xvYmFsVW5pZm9ybXMudmFsdWVzKTtcbn07XG5cbi8qKlxuICogTG9hZHMgdGhlIGJ1ZmZlcnMgYW5kIGlzc3VlcyB0aGUgZHJhdyBjb21tYW5kIGZvciBhIGdlb21ldHJ5LlxuICpcbiAqIEBtZXRob2RcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gdmVydGV4QnVmZmVycyBBbGwgYnVmZmVycyB1c2VkIHRvIGRyYXcgdGhlIGdlb21ldHJ5LlxuICogQHBhcmFtIHtOdW1iZXJ9IG1vZGUgRW51bWVyYXRvciBkZWZpbmluZyB3aGF0IHByaW1pdGl2ZSB0byBkcmF3XG4gKiBAcGFyYW0ge051bWJlcn0gaWQgSUQgb2YgZ2VvbWV0cnkgYmVpbmcgZHJhd24uXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuV2ViR0xSZW5kZXJlci5wcm90b3R5cGUuZHJhd0J1ZmZlcnMgPSBmdW5jdGlvbiBkcmF3QnVmZmVycyh2ZXJ0ZXhCdWZmZXJzLCBtb2RlLCBpZCkge1xuICAgIHZhciBnbCA9IHRoaXMuZ2w7XG4gICAgdmFyIGxlbmd0aCA9IDA7XG4gICAgdmFyIGF0dHJpYnV0ZTtcbiAgICB2YXIgbG9jYXRpb247XG4gICAgdmFyIHNwYWNpbmc7XG4gICAgdmFyIG9mZnNldDtcbiAgICB2YXIgYnVmZmVyO1xuICAgIHZhciBpdGVyO1xuICAgIHZhciBqO1xuICAgIHZhciBpO1xuXG4gICAgaXRlciA9IHZlcnRleEJ1ZmZlcnMua2V5cy5sZW5ndGg7XG4gICAgZm9yIChpID0gMDsgaSA8IGl0ZXI7IGkrKykge1xuICAgICAgICBhdHRyaWJ1dGUgPSB2ZXJ0ZXhCdWZmZXJzLmtleXNbaV07XG5cbiAgICAgICAgLy8gRG8gbm90IHNldCB2ZXJ0ZXhBdHRyaWJQb2ludGVyIGlmIGluZGV4IGJ1ZmZlci5cblxuICAgICAgICBpZiAoYXR0cmlidXRlID09PSAnaW5kaWNlcycpIHtcbiAgICAgICAgICAgIGogPSBpOyBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJldHJlaXZlIHRoZSBhdHRyaWJ1dGUgbG9jYXRpb24gYW5kIG1ha2Ugc3VyZSBpdCBpcyBlbmFibGVkLlxuXG4gICAgICAgIGxvY2F0aW9uID0gdGhpcy5wcm9ncmFtLmF0dHJpYnV0ZUxvY2F0aW9uc1thdHRyaWJ1dGVdO1xuXG4gICAgICAgIGlmIChsb2NhdGlvbiA9PT0gLTEpIGNvbnRpbnVlO1xuICAgICAgICBpZiAobG9jYXRpb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgbG9jYXRpb24gPSBnbC5nZXRBdHRyaWJMb2NhdGlvbih0aGlzLnByb2dyYW0ucHJvZ3JhbSwgYXR0cmlidXRlKTtcbiAgICAgICAgICAgIHRoaXMucHJvZ3JhbS5hdHRyaWJ1dGVMb2NhdGlvbnNbYXR0cmlidXRlXSA9IGxvY2F0aW9uO1xuICAgICAgICAgICAgaWYgKGxvY2F0aW9uID09PSAtMSkgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRoaXMuc3RhdGUuZW5hYmxlZEF0dHJpYnV0ZXNbYXR0cmlidXRlXSkge1xuICAgICAgICAgICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkobG9jYXRpb24pO1xuICAgICAgICAgICAgdGhpcy5zdGF0ZS5lbmFibGVkQXR0cmlidXRlc1thdHRyaWJ1dGVdID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuZW5hYmxlZEF0dHJpYnV0ZXNLZXlzLnB1c2goYXR0cmlidXRlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJldHJlaXZlIGJ1ZmZlciBpbmZvcm1hdGlvbiB1c2VkIHRvIHNldCBhdHRyaWJ1dGUgcG9pbnRlci5cblxuICAgICAgICBidWZmZXIgPSB2ZXJ0ZXhCdWZmZXJzLnZhbHVlc1tpXTtcbiAgICAgICAgc3BhY2luZyA9IHZlcnRleEJ1ZmZlcnMuc3BhY2luZ1tpXTtcbiAgICAgICAgb2Zmc2V0ID0gdmVydGV4QnVmZmVycy5vZmZzZXRbaV07XG4gICAgICAgIGxlbmd0aCA9IHZlcnRleEJ1ZmZlcnMubGVuZ3RoW2ldO1xuXG4gICAgICAgIC8vIFNraXAgYmluZEJ1ZmZlciBpZiBidWZmZXIgaXMgY3VycmVudGx5IGJvdW5kLlxuXG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmJvdW5kQXJyYXlCdWZmZXIgIT09IGJ1ZmZlcikge1xuICAgICAgICAgICAgZ2wuYmluZEJ1ZmZlcihidWZmZXIudGFyZ2V0LCBidWZmZXIuYnVmZmVyKTtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuYm91bmRBcnJheUJ1ZmZlciA9IGJ1ZmZlcjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnN0YXRlLmxhc3REcmF3biAhPT0gaWQpIHtcbiAgICAgICAgICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIobG9jYXRpb24sIHNwYWNpbmcsIGdsLkZMT0FULCBnbC5GQUxTRSwgMCwgNCAqIG9mZnNldCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBEaXNhYmxlIGFueSBhdHRyaWJ1dGVzIHRoYXQgbm90IGN1cnJlbnRseSBiZWluZyB1c2VkLlxuXG4gICAgdmFyIGxlbiA9IHRoaXMuc3RhdGUuZW5hYmxlZEF0dHJpYnV0ZXNLZXlzLmxlbmd0aDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgdmFyIGtleSA9IHRoaXMuc3RhdGUuZW5hYmxlZEF0dHJpYnV0ZXNLZXlzW2ldO1xuICAgICAgICBpZiAodGhpcy5zdGF0ZS5lbmFibGVkQXR0cmlidXRlc1trZXldICYmIHZlcnRleEJ1ZmZlcnMua2V5cy5pbmRleE9mKGtleSkgPT09IC0xKSB7XG4gICAgICAgICAgICBnbC5kaXNhYmxlVmVydGV4QXR0cmliQXJyYXkodGhpcy5wcm9ncmFtLmF0dHJpYnV0ZUxvY2F0aW9uc1trZXldKTtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUuZW5hYmxlZEF0dHJpYnV0ZXNba2V5XSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGxlbmd0aCkge1xuXG4gICAgICAgIC8vIElmIGluZGV4IGJ1ZmZlciwgdXNlIGRyYXdFbGVtZW50cy5cblxuICAgICAgICBpZiAoaiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBidWZmZXIgPSB2ZXJ0ZXhCdWZmZXJzLnZhbHVlc1tqXTtcbiAgICAgICAgICAgIG9mZnNldCA9IHZlcnRleEJ1ZmZlcnMub2Zmc2V0W2pdO1xuICAgICAgICAgICAgc3BhY2luZyA9IHZlcnRleEJ1ZmZlcnMuc3BhY2luZ1tqXTtcbiAgICAgICAgICAgIGxlbmd0aCA9IHZlcnRleEJ1ZmZlcnMubGVuZ3RoW2pdO1xuXG4gICAgICAgICAgICAvLyBTa2lwIGJpbmRCdWZmZXIgaWYgYnVmZmVyIGlzIGN1cnJlbnRseSBib3VuZC5cblxuICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUuYm91bmRFbGVtZW50QnVmZmVyICE9PSBidWZmZXIpIHtcbiAgICAgICAgICAgICAgICBnbC5iaW5kQnVmZmVyKGJ1ZmZlci50YXJnZXQsIGJ1ZmZlci5idWZmZXIpO1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUuYm91bmRFbGVtZW50QnVmZmVyID0gYnVmZmVyO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBnbC5kcmF3RWxlbWVudHMoZ2xbbW9kZV0sIGxlbmd0aCwgZ2wuVU5TSUdORURfU0hPUlQsIDIgKiBvZmZzZXQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZ2wuZHJhd0FycmF5cyhnbFttb2RlXSwgMCwgbGVuZ3RoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuc3RhdGUubGFzdERyYXduID0gaWQ7XG59O1xuXG4vKipcbiAqIFVwZGF0ZXMgdGhlIHdpZHRoIGFuZCBoZWlnaHQgb2YgcGFyZW50IGNhbnZhcywgc2V0cyB0aGUgdmlld3BvcnQgc2l6ZSBvblxuICogdGhlIFdlYkdMIGNvbnRleHQgYW5kIHVwZGF0ZXMgdGhlIHJlc29sdXRpb24gdW5pZm9ybSBmb3IgdGhlIHNoYWRlciBwcm9ncmFtLlxuICogU2l6ZSBpcyByZXRyZWl2ZWQgZnJvbSB0aGUgY29udGFpbmVyIG9iamVjdCBvZiB0aGUgcmVuZGVyZXIuXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IHNpemUgd2lkdGgsIGhlaWdodCBhbmQgZGVwdGggb2YgY2FudmFzXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuV2ViR0xSZW5kZXJlci5wcm90b3R5cGUudXBkYXRlU2l6ZSA9IGZ1bmN0aW9uIHVwZGF0ZVNpemUoc2l6ZSkge1xuICAgIGlmIChzaXplKSB7XG4gICAgICAgIHZhciBwaXhlbFJhdGlvID0gd2luZG93LmRldmljZVBpeGVsUmF0aW8gfHwgMTtcbiAgICAgICAgdmFyIGRpc3BsYXlXaWR0aCA9IH5+KHNpemVbMF0gKiBwaXhlbFJhdGlvKTtcbiAgICAgICAgdmFyIGRpc3BsYXlIZWlnaHQgPSB+fihzaXplWzFdICogcGl4ZWxSYXRpbyk7XG4gICAgICAgIHRoaXMuY2FudmFzLndpZHRoID0gZGlzcGxheVdpZHRoO1xuICAgICAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSBkaXNwbGF5SGVpZ2h0O1xuICAgICAgICB0aGlzLmdsLnZpZXdwb3J0KDAsIDAsIGRpc3BsYXlXaWR0aCwgZGlzcGxheUhlaWdodCk7XG5cbiAgICAgICAgdGhpcy5jYWNoZWRTaXplWzBdID0gc2l6ZVswXTtcbiAgICAgICAgdGhpcy5jYWNoZWRTaXplWzFdID0gc2l6ZVsxXTtcbiAgICAgICAgdGhpcy5jYWNoZWRTaXplWzJdID0gKHNpemVbMF0gPiBzaXplWzFdKSA/IHNpemVbMF0gOiBzaXplWzFdO1xuICAgICAgICB0aGlzLnJlc29sdXRpb25WYWx1ZXNbMF0gPSB0aGlzLmNhY2hlZFNpemU7XG4gICAgfVxuXG4gICAgdGhpcy5wcm9ncmFtLnNldFVuaWZvcm1zKHRoaXMucmVzb2x1dGlvbk5hbWUsIHRoaXMucmVzb2x1dGlvblZhbHVlcyk7XG5cbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogVXBkYXRlcyB0aGUgc3RhdGUgb2YgdGhlIFdlYkdMIGRyYXdpbmcgY29udGV4dCBiYXNlZCBvbiBjdXN0b20gcGFyYW1ldGVyc1xuICogZGVmaW5lZCBvbiBhIG1lc2guXG4gKlxuICogQG1ldGhvZFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIERyYXcgc3RhdGUgb3B0aW9ucyB0byBiZSBzZXQgdG8gdGhlIGNvbnRleHQuXG4gKiBAcGFyYW0ge01lc2h9IG1lc2ggQXNzb2NpYXRlZCBNZXNoXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuV2ViR0xSZW5kZXJlci5wcm90b3R5cGUuaGFuZGxlT3B0aW9ucyA9IGZ1bmN0aW9uIGhhbmRsZU9wdGlvbnMob3B0aW9ucywgbWVzaCkge1xuICAgIHZhciBnbCA9IHRoaXMuZ2w7XG4gICAgaWYgKCFvcHRpb25zKSByZXR1cm47XG5cbiAgICBpZiAob3B0aW9ucy5zaWRlID09PSAnZG91YmxlJykge1xuICAgICAgICB0aGlzLmdsLmN1bGxGYWNlKHRoaXMuZ2wuRlJPTlQpO1xuICAgICAgICB0aGlzLmRyYXdCdWZmZXJzKHRoaXMuYnVmZmVyUmVnaXN0cnkucmVnaXN0cnlbbWVzaC5nZW9tZXRyeV0sIG1lc2guZHJhd1R5cGUsIG1lc2guZ2VvbWV0cnkpO1xuICAgICAgICB0aGlzLmdsLmN1bGxGYWNlKHRoaXMuZ2wuQkFDSyk7XG4gICAgfVxuXG4gICAgaWYgKG9wdGlvbnMuYmxlbmRpbmcpIGdsLmJsZW5kRnVuYyhnbC5TUkNfQUxQSEEsIGdsLk9ORSk7XG4gICAgaWYgKG9wdGlvbnMuc2lkZSA9PT0gJ2JhY2snKSBnbC5jdWxsRmFjZShnbC5GUk9OVCk7XG59O1xuXG4vKipcbiAqIFJlc2V0cyB0aGUgc3RhdGUgb2YgdGhlIFdlYkdMIGRyYXdpbmcgY29udGV4dCB0byBkZWZhdWx0IHZhbHVlcy5cbiAqXG4gKiBAbWV0aG9kXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgRHJhdyBzdGF0ZSBvcHRpb25zIHRvIGJlIHNldCB0byB0aGUgY29udGV4dC5cbiAqXG4gKiBAcmV0dXJuIHt1bmRlZmluZWR9IHVuZGVmaW5lZFxuICovXG5XZWJHTFJlbmRlcmVyLnByb3RvdHlwZS5yZXNldE9wdGlvbnMgPSBmdW5jdGlvbiByZXNldE9wdGlvbnMob3B0aW9ucykge1xuICAgIHZhciBnbCA9IHRoaXMuZ2w7XG4gICAgaWYgKCFvcHRpb25zKSByZXR1cm47XG4gICAgaWYgKG9wdGlvbnMuYmxlbmRpbmcpIGdsLmJsZW5kRnVuYyhnbC5TUkNfQUxQSEEsIGdsLk9ORV9NSU5VU19TUkNfQUxQSEEpO1xuICAgIGlmIChvcHRpb25zLnNpZGUgPT09ICdiYWNrJykgZ2wuY3VsbEZhY2UoZ2wuQkFDSyk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFdlYkdMUmVuZGVyZXI7XG4iLCIvKipcbiAqIFRoZSBNSVQgTGljZW5zZSAoTUlUKVxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNSBGYW1vdXMgSW5kdXN0cmllcyBJbmMuXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4gKiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cbiAqIFRIRSBTT0ZUV0FSRS5cbiAqL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgdHlwZXMgPSB7XG4gICAgMTogJ2Zsb2F0ICcsXG4gICAgMjogJ3ZlYzIgJyxcbiAgICAzOiAndmVjMyAnLFxuICAgIDQ6ICd2ZWM0ICdcbn07XG5cbi8qKlxuICogVHJhdmVyc2VzIG1hdGVyaWFsIHRvIGNyZWF0ZSBhIHN0cmluZyBvZiBnbHNsIGNvZGUgdG8gYmUgYXBwbGllZCBpblxuICogdGhlIHZlcnRleCBvciBmcmFnbWVudCBzaGFkZXIuXG4gKlxuICogQG1ldGhvZFxuICogQHByb3RlY3RlZFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBtYXRlcmlhbCBNYXRlcmlhbCB0byBiZSBjb21waWxlZC5cbiAqIEBwYXJhbSB7TnVtYmVyfSB0ZXh0dXJlU2xvdCBOZXh0IGF2YWlsYWJsZSB0ZXh0dXJlIHNsb3QgZm9yIE1lc2guXG4gKlxuICogQHJldHVybiB7dW5kZWZpbmVkfSB1bmRlZmluZWRcbiAqL1xuZnVuY3Rpb24gY29tcGlsZU1hdGVyaWFsKG1hdGVyaWFsLCB0ZXh0dXJlU2xvdCkge1xuICAgIHZhciBnbHNsID0gJyc7XG4gICAgdmFyIHVuaWZvcm1zID0ge307XG4gICAgdmFyIHZhcnlpbmdzID0ge307XG4gICAgdmFyIGF0dHJpYnV0ZXMgPSB7fTtcbiAgICB2YXIgZGVmaW5lcyA9IFtdO1xuICAgIHZhciB0ZXh0dXJlcyA9IFtdO1xuXG4gICAgX3RyYXZlcnNlKG1hdGVyaWFsLCBmdW5jdGlvbiAobm9kZSwgZGVwdGgpIHtcbiAgICAgICAgaWYgKCEgbm9kZS5jaHVuaykgcmV0dXJuO1xuXG4gICAgICAgIHZhciB0eXBlID0gdHlwZXNbX2dldE91dHB1dExlbmd0aChub2RlKV07XG4gICAgICAgIHZhciBsYWJlbCA9IF9tYWtlTGFiZWwobm9kZSk7XG4gICAgICAgIHZhciBvdXRwdXQgPSBfcHJvY2Vzc0dMU0wobm9kZS5jaHVuay5nbHNsLCBub2RlLmlucHV0cywgdGV4dHVyZXMubGVuZ3RoICsgdGV4dHVyZVNsb3QpO1xuXG4gICAgICAgIGdsc2wgKz0gdHlwZSArIGxhYmVsICsgJyA9ICcgKyBvdXRwdXQgKyAnXFxuICc7XG5cbiAgICAgICAgaWYgKG5vZGUudW5pZm9ybXMpIF9leHRlbmQodW5pZm9ybXMsIG5vZGUudW5pZm9ybXMpO1xuICAgICAgICBpZiAobm9kZS52YXJ5aW5ncykgX2V4dGVuZCh2YXJ5aW5ncywgbm9kZS52YXJ5aW5ncyk7XG4gICAgICAgIGlmIChub2RlLmF0dHJpYnV0ZXMpIF9leHRlbmQoYXR0cmlidXRlcywgbm9kZS5hdHRyaWJ1dGVzKTtcbiAgICAgICAgaWYgKG5vZGUuY2h1bmsuZGVmaW5lcykgZGVmaW5lcy5wdXNoKG5vZGUuY2h1bmsuZGVmaW5lcyk7XG4gICAgICAgIGlmIChub2RlLnRleHR1cmUpIHRleHR1cmVzLnB1c2gobm9kZS50ZXh0dXJlKTtcbiAgICB9KTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIF9pZDogbWF0ZXJpYWwuX2lkLFxuICAgICAgICBnbHNsOiBnbHNsICsgJ3JldHVybiAnICsgX21ha2VMYWJlbChtYXRlcmlhbCkgKyAnOycsXG4gICAgICAgIGRlZmluZXM6IGRlZmluZXMuam9pbignXFxuJyksXG4gICAgICAgIHVuaWZvcm1zOiB1bmlmb3JtcyxcbiAgICAgICAgdmFyeWluZ3M6IHZhcnlpbmdzLFxuICAgICAgICBhdHRyaWJ1dGVzOiBhdHRyaWJ1dGVzLFxuICAgICAgICB0ZXh0dXJlczogdGV4dHVyZXNcbiAgICB9O1xufVxuXG4vLyBSZWN1cnNpdmVseSBpdGVyYXRlcyBvdmVyIGEgbWF0ZXJpYWwncyBpbnB1dHMsIGludm9raW5nIGEgZ2l2ZW4gY2FsbGJhY2tcbi8vIHdpdGggdGhlIGN1cnJlbnQgbWF0ZXJpYWxcbmZ1bmN0aW9uIF90cmF2ZXJzZShtYXRlcmlhbCwgY2FsbGJhY2spIHtcblx0dmFyIGlucHV0cyA9IG1hdGVyaWFsLmlucHV0cztcbiAgICB2YXIgbGVuID0gaW5wdXRzICYmIGlucHV0cy5sZW5ndGg7XG4gICAgdmFyIGlkeCA9IC0xO1xuXG4gICAgd2hpbGUgKCsraWR4IDwgbGVuKSBfdHJhdmVyc2UoaW5wdXRzW2lkeF0sIGNhbGxiYWNrKTtcblxuICAgIGNhbGxiYWNrKG1hdGVyaWFsKTtcblxuICAgIHJldHVybiBtYXRlcmlhbDtcbn1cblxuLy8gSGVscGVyIGZ1bmN0aW9uIHVzZWQgdG8gaW5mZXIgbGVuZ3RoIG9mIHRoZSBvdXRwdXRcbi8vIGZyb20gYSBnaXZlbiBtYXRlcmlhbCBub2RlLlxuZnVuY3Rpb24gX2dldE91dHB1dExlbmd0aChub2RlKSB7XG5cbiAgICAvLyBIYW5kbGUgY29uc3RhbnQgdmFsdWVzXG5cbiAgICBpZiAodHlwZW9mIG5vZGUgPT09ICdudW1iZXInKSByZXR1cm4gMTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShub2RlKSkgcmV0dXJuIG5vZGUubGVuZ3RoO1xuXG4gICAgLy8gSGFuZGxlIG1hdGVyaWFsc1xuXG4gICAgdmFyIG91dHB1dCA9IG5vZGUuY2h1bmsub3V0cHV0O1xuICAgIGlmICh0eXBlb2Ygb3V0cHV0ID09PSAnbnVtYmVyJykgcmV0dXJuIG91dHB1dDtcblxuICAgIC8vIEhhbmRsZSBwb2x5bW9ycGhpYyBvdXRwdXRcblxuICAgIHZhciBrZXkgPSBub2RlLmlucHV0cy5tYXAoZnVuY3Rpb24gcmVjdXJzZShub2RlKSB7XG4gICAgICAgIHJldHVybiBfZ2V0T3V0cHV0TGVuZ3RoKG5vZGUpO1xuICAgIH0pLmpvaW4oJywnKTtcblxuICAgIHJldHVybiBvdXRwdXRba2V5XTtcbn1cblxuLy8gSGVscGVyIGZ1bmN0aW9uIHRvIHJ1biByZXBsYWNlIGlucHV0cyBhbmQgdGV4dHVyZSB0YWdzIHdpdGhcbi8vIGNvcnJlY3QgZ2xzbC5cbmZ1bmN0aW9uIF9wcm9jZXNzR0xTTChzdHIsIGlucHV0cywgdGV4dHVyZVNsb3QpIHtcbiAgICByZXR1cm4gc3RyXG4gICAgICAgIC5yZXBsYWNlKC8lXFxkL2csIGZ1bmN0aW9uIChzKSB7XG4gICAgICAgICAgICByZXR1cm4gX21ha2VMYWJlbChpbnB1dHNbc1sxXS0xXSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5yZXBsYWNlKC9cXCRURVhUVVJFLywgJ3VfdGV4dHVyZXNbJyArIHRleHR1cmVTbG90ICsgJ10nKTtcbn1cblxuLy8gSGVscGVyIGZ1bmN0aW9uIHVzZWQgdG8gY3JlYXRlIGdsc2wgZGVmaW5pdGlvbiBvZiB0aGVcbi8vIGlucHV0IG1hdGVyaWFsIG5vZGUuXG5mdW5jdGlvbiBfbWFrZUxhYmVsIChuKSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkobikpIHJldHVybiBfYXJyYXlUb1ZlYyhuKTtcbiAgICBpZiAodHlwZW9mIG4gPT09ICdvYmplY3QnKSByZXR1cm4gJ2ZhXycgKyAobi5faWQpO1xuICAgIGVsc2UgcmV0dXJuIG4udG9GaXhlZCg2KTtcbn1cblxuLy8gSGVscGVyIHRvIGNvcHkgdGhlIHByb3BlcnRpZXMgb2YgYW4gb2JqZWN0IG9udG8gYW5vdGhlciBvYmplY3QuXG5mdW5jdGlvbiBfZXh0ZW5kIChhLCBiKSB7XG5cdGZvciAodmFyIGsgaW4gYikgYVtrXSA9IGJba107XG59XG5cbi8vIEhlbHBlciB0byBjcmVhdGUgZ2xzbCB2ZWN0b3IgcmVwcmVzZW50YXRpb24gb2YgYSBqYXZhc2NyaXB0IGFycmF5LlxuZnVuY3Rpb24gX2FycmF5VG9WZWMoYXJyYXkpIHtcbiAgICB2YXIgbGVuID0gYXJyYXkubGVuZ3RoO1xuICAgIHJldHVybiAndmVjJyArIGxlbiArICcoJyArIGFycmF5LmpvaW4oJywnKSAgKyAnKSc7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY29tcGlsZU1hdGVyaWFsO1xuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vLyBHZW5lcmF0ZXMgYSBjaGVja2VyYm9hcmQgcGF0dGVybiB0byBiZSB1c2VkIGFzIGEgcGxhY2Vob2xkZXIgdGV4dHVyZSB3aGlsZSBhblxuLy8gaW1hZ2UgbG9hZHMgb3ZlciB0aGUgbmV0d29yay5cbmZ1bmN0aW9uIGNyZWF0ZUNoZWNrZXJCb2FyZCgpIHtcbiAgICB2YXIgY29udGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpLmdldENvbnRleHQoJzJkJyk7XG4gICAgY29udGV4dC5jYW52YXMud2lkdGggPSBjb250ZXh0LmNhbnZhcy5oZWlnaHQgPSAxMjg7XG4gICAgZm9yICh2YXIgeSA9IDA7IHkgPCBjb250ZXh0LmNhbnZhcy5oZWlnaHQ7IHkgKz0gMTYpIHtcbiAgICAgICAgZm9yICh2YXIgeCA9IDA7IHggPCBjb250ZXh0LmNhbnZhcy53aWR0aDsgeCArPSAxNikge1xuICAgICAgICAgICAgY29udGV4dC5maWxsU3R5bGUgPSAoeCBeIHkpICYgMTYgPyAnI0ZGRicgOiAnI0RERCc7XG4gICAgICAgICAgICBjb250ZXh0LmZpbGxSZWN0KHgsIHksIDE2LCAxNik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gY29udGV4dC5jYW52YXM7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY3JlYXRlQ2hlY2tlckJvYXJkO1xuIiwiLyoqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTUgRmFtb3VzIEluZHVzdHJpZXMgSW5jLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuICogYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG4gKiBUSEUgU09GVFdBUkUuXG4gKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIHJhZGl4Qml0cyA9IDExLFxuICAgIG1heFJhZGl4ID0gMSA8PCAocmFkaXhCaXRzKSxcbiAgICByYWRpeE1hc2sgPSBtYXhSYWRpeCAtIDEsXG4gICAgYnVja2V0cyA9IG5ldyBBcnJheShtYXhSYWRpeCAqIE1hdGguY2VpbCg2NCAvIHJhZGl4Qml0cykpLFxuICAgIG1zYk1hc2sgPSAxIDw8ICgoMzIgLSAxKSAlIHJhZGl4Qml0cyksXG4gICAgbGFzdE1hc2sgPSAobXNiTWFzayA8PCAxKSAtIDEsXG4gICAgcGFzc0NvdW50ID0gKCgzMiAvIHJhZGl4Qml0cykgKyAwLjk5OTk5OTk5OTk5OTk5OSkgfCAwLFxuICAgIG1heE9mZnNldCA9IG1heFJhZGl4ICogKHBhc3NDb3VudCAtIDEpLFxuICAgIG5vcm1hbGl6ZXIgPSBNYXRoLnBvdygyMCwgNik7XG5cbnZhciBidWZmZXIgPSBuZXcgQXJyYXlCdWZmZXIoNCk7XG52YXIgZmxvYXRWaWV3ID0gbmV3IEZsb2F0MzJBcnJheShidWZmZXIsIDAsIDEpO1xudmFyIGludFZpZXcgPSBuZXcgSW50MzJBcnJheShidWZmZXIsIDAsIDEpO1xuXG4vLyBjb21wYXJhdG9yIHB1bGxzIHJlbGV2YW50IHNvcnRpbmcga2V5cyBvdXQgb2YgbWVzaFxuZnVuY3Rpb24gY29tcChsaXN0LCByZWdpc3RyeSwgaSkge1xuICAgIHZhciBrZXkgPSBsaXN0W2ldO1xuICAgIHZhciBpdGVtID0gcmVnaXN0cnlba2V5XTtcbiAgICByZXR1cm4gKGl0ZW0uZGVwdGggPyBpdGVtLmRlcHRoIDogcmVnaXN0cnlba2V5XS51bmlmb3JtVmFsdWVzWzFdWzE0XSkgKyBub3JtYWxpemVyO1xufVxuXG4vL211dGF0b3IgZnVuY3Rpb24gcmVjb3JkcyBtZXNoJ3MgcGxhY2UgaW4gcHJldmlvdXMgcGFzc1xuZnVuY3Rpb24gbXV0YXRvcihsaXN0LCByZWdpc3RyeSwgaSwgdmFsdWUpIHtcbiAgICB2YXIga2V5ID0gbGlzdFtpXTtcbiAgICByZWdpc3RyeVtrZXldLmRlcHRoID0gaW50VG9GbG9hdCh2YWx1ZSkgLSBub3JtYWxpemVyO1xuICAgIHJldHVybiBrZXk7XG59XG5cbi8vY2xlYW4gZnVuY3Rpb24gcmVtb3ZlcyBtdXRhdG9yIGZ1bmN0aW9uJ3MgcmVjb3JkXG5mdW5jdGlvbiBjbGVhbihsaXN0LCByZWdpc3RyeSwgaSkge1xuICAgIHJlZ2lzdHJ5W2xpc3RbaV1dLmRlcHRoID0gbnVsbDtcbn1cblxuLy9jb252ZXJ0cyBhIGphdmFzY3JpcHQgZmxvYXQgdG8gYSAzMmJpdCBpbnRlZ2VyIHVzaW5nIGFuIGFycmF5IGJ1ZmZlclxuLy9vZiBzaXplIG9uZVxuZnVuY3Rpb24gZmxvYXRUb0ludChrKSB7XG4gICAgZmxvYXRWaWV3WzBdID0gaztcbiAgICByZXR1cm4gaW50Vmlld1swXTtcbn1cbi8vY29udmVydHMgYSAzMiBiaXQgaW50ZWdlciB0byBhIHJlZ3VsYXIgamF2YXNjcmlwdCBmbG9hdCB1c2luZyBhbiBhcnJheSBidWZmZXJcbi8vb2Ygc2l6ZSBvbmVcbmZ1bmN0aW9uIGludFRvRmxvYXQoaykge1xuICAgIGludFZpZXdbMF0gPSBrO1xuICAgIHJldHVybiBmbG9hdFZpZXdbMF07XG59XG5cbi8vc29ydHMgYSBsaXN0IG9mIG1lc2ggSURzIGFjY29yZGluZyB0byB0aGVpciB6LWRlcHRoXG5mdW5jdGlvbiByYWRpeFNvcnQobGlzdCwgcmVnaXN0cnkpIHtcbiAgICB2YXIgcGFzcyA9IDA7XG4gICAgdmFyIG91dCA9IFtdO1xuXG4gICAgdmFyIGksIGosIGssIG4sIGRpdiwgb2Zmc2V0LCBzd2FwLCBpZCwgc3VtLCB0c3VtLCBzaXplO1xuXG4gICAgcGFzc0NvdW50ID0gKCgzMiAvIHJhZGl4Qml0cykgKyAwLjk5OTk5OTk5OTk5OTk5OSkgfCAwO1xuXG4gICAgZm9yIChpID0gMCwgbiA9IG1heFJhZGl4ICogcGFzc0NvdW50OyBpIDwgbjsgaSsrKSBidWNrZXRzW2ldID0gMDtcblxuICAgIGZvciAoaSA9IDAsIG4gPSBsaXN0Lmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICBkaXYgPSBmbG9hdFRvSW50KGNvbXAobGlzdCwgcmVnaXN0cnksIGkpKTtcbiAgICAgICAgZGl2IF49IGRpdiA+PiAzMSB8IDB4ODAwMDAwMDA7XG4gICAgICAgIGZvciAoaiA9IDAsIGsgPSAwOyBqIDwgbWF4T2Zmc2V0OyBqICs9IG1heFJhZGl4LCBrICs9IHJhZGl4Qml0cykge1xuICAgICAgICAgICAgYnVja2V0c1tqICsgKGRpdiA+Pj4gayAmIHJhZGl4TWFzayldKys7XG4gICAgICAgIH1cbiAgICAgICAgYnVja2V0c1tqICsgKGRpdiA+Pj4gayAmIGxhc3RNYXNrKV0rKztcbiAgICB9XG5cbiAgICBmb3IgKGogPSAwOyBqIDw9IG1heE9mZnNldDsgaiArPSBtYXhSYWRpeCkge1xuICAgICAgICBmb3IgKGlkID0gaiwgc3VtID0gMDsgaWQgPCBqICsgbWF4UmFkaXg7IGlkKyspIHtcbiAgICAgICAgICAgIHRzdW0gPSBidWNrZXRzW2lkXSArIHN1bTtcbiAgICAgICAgICAgIGJ1Y2tldHNbaWRdID0gc3VtIC0gMTtcbiAgICAgICAgICAgIHN1bSA9IHRzdW07XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKC0tcGFzc0NvdW50KSB7XG4gICAgICAgIGZvciAoaSA9IDAsIG4gPSBsaXN0Lmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgZGl2ID0gZmxvYXRUb0ludChjb21wKGxpc3QsIHJlZ2lzdHJ5LCBpKSk7XG4gICAgICAgICAgICBvdXRbKytidWNrZXRzW2RpdiAmIHJhZGl4TWFza11dID0gbXV0YXRvcihsaXN0LCByZWdpc3RyeSwgaSwgZGl2IF49IGRpdiA+PiAzMSB8IDB4ODAwMDAwMDApO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBzd2FwID0gb3V0O1xuICAgICAgICBvdXQgPSBsaXN0O1xuICAgICAgICBsaXN0ID0gc3dhcDtcbiAgICAgICAgd2hpbGUgKCsrcGFzcyA8IHBhc3NDb3VudCkge1xuICAgICAgICAgICAgZm9yIChpID0gMCwgbiA9IGxpc3QubGVuZ3RoLCBvZmZzZXQgPSBwYXNzICogbWF4UmFkaXgsIHNpemUgPSBwYXNzICogcmFkaXhCaXRzOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgZGl2ID0gZmxvYXRUb0ludChjb21wKGxpc3QsIHJlZ2lzdHJ5LCBpKSk7XG4gICAgICAgICAgICAgICAgb3V0WysrYnVja2V0c1tvZmZzZXQgKyAoZGl2ID4+PiBzaXplICYgcmFkaXhNYXNrKV1dID0gbGlzdFtpXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc3dhcCA9IG91dDtcbiAgICAgICAgICAgIG91dCA9IGxpc3Q7XG4gICAgICAgICAgICBsaXN0ID0gc3dhcDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZvciAoaSA9IDAsIG4gPSBsaXN0Lmxlbmd0aCwgb2Zmc2V0ID0gcGFzcyAqIG1heFJhZGl4LCBzaXplID0gcGFzcyAqIHJhZGl4Qml0czsgaSA8IG47IGkrKykge1xuICAgICAgICBkaXYgPSBmbG9hdFRvSW50KGNvbXAobGlzdCwgcmVnaXN0cnksIGkpKTtcbiAgICAgICAgb3V0WysrYnVja2V0c1tvZmZzZXQgKyAoZGl2ID4+PiBzaXplICYgbGFzdE1hc2spXV0gPSBtdXRhdG9yKGxpc3QsIHJlZ2lzdHJ5LCBpLCBkaXYgXiAofmRpdiA+PiAzMSB8IDB4ODAwMDAwMDApKTtcbiAgICAgICAgY2xlYW4obGlzdCwgcmVnaXN0cnksIGkpO1xuICAgIH1cblxuICAgIHJldHVybiBvdXQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcmFkaXhTb3J0O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgZ2xzbGlmeSA9IHJlcXVpcmUoXCJnbHNsaWZ5XCIpO1xudmFyIHNoYWRlcnMgPSByZXF1aXJlKFwiZ2xzbGlmeS9zaW1wbGUtYWRhcHRlci5qc1wiKShcIlxcbiNkZWZpbmUgR0xTTElGWSAxXFxuXFxubWF0MyBhX3hfZ2V0Tm9ybWFsTWF0cml4KGluIG1hdDQgdCkge1xcbiAgbWF0MyBtYXROb3JtO1xcbiAgbWF0NCBhID0gdDtcXG4gIGZsb2F0IGEwMCA9IGFbMF1bMF0sIGEwMSA9IGFbMF1bMV0sIGEwMiA9IGFbMF1bMl0sIGEwMyA9IGFbMF1bM10sIGExMCA9IGFbMV1bMF0sIGExMSA9IGFbMV1bMV0sIGExMiA9IGFbMV1bMl0sIGExMyA9IGFbMV1bM10sIGEyMCA9IGFbMl1bMF0sIGEyMSA9IGFbMl1bMV0sIGEyMiA9IGFbMl1bMl0sIGEyMyA9IGFbMl1bM10sIGEzMCA9IGFbM11bMF0sIGEzMSA9IGFbM11bMV0sIGEzMiA9IGFbM11bMl0sIGEzMyA9IGFbM11bM10sIGIwMCA9IGEwMCAqIGExMSAtIGEwMSAqIGExMCwgYjAxID0gYTAwICogYTEyIC0gYTAyICogYTEwLCBiMDIgPSBhMDAgKiBhMTMgLSBhMDMgKiBhMTAsIGIwMyA9IGEwMSAqIGExMiAtIGEwMiAqIGExMSwgYjA0ID0gYTAxICogYTEzIC0gYTAzICogYTExLCBiMDUgPSBhMDIgKiBhMTMgLSBhMDMgKiBhMTIsIGIwNiA9IGEyMCAqIGEzMSAtIGEyMSAqIGEzMCwgYjA3ID0gYTIwICogYTMyIC0gYTIyICogYTMwLCBiMDggPSBhMjAgKiBhMzMgLSBhMjMgKiBhMzAsIGIwOSA9IGEyMSAqIGEzMiAtIGEyMiAqIGEzMSwgYjEwID0gYTIxICogYTMzIC0gYTIzICogYTMxLCBiMTEgPSBhMjIgKiBhMzMgLSBhMjMgKiBhMzIsIGRldCA9IGIwMCAqIGIxMSAtIGIwMSAqIGIxMCArIGIwMiAqIGIwOSArIGIwMyAqIGIwOCAtIGIwNCAqIGIwNyArIGIwNSAqIGIwNjtcXG4gIGRldCA9IDEuMCAvIGRldDtcXG4gIG1hdE5vcm1bMF1bMF0gPSAoYTExICogYjExIC0gYTEyICogYjEwICsgYTEzICogYjA5KSAqIGRldDtcXG4gIG1hdE5vcm1bMF1bMV0gPSAoYTEyICogYjA4IC0gYTEwICogYjExIC0gYTEzICogYjA3KSAqIGRldDtcXG4gIG1hdE5vcm1bMF1bMl0gPSAoYTEwICogYjEwIC0gYTExICogYjA4ICsgYTEzICogYjA2KSAqIGRldDtcXG4gIG1hdE5vcm1bMV1bMF0gPSAoYTAyICogYjEwIC0gYTAxICogYjExIC0gYTAzICogYjA5KSAqIGRldDtcXG4gIG1hdE5vcm1bMV1bMV0gPSAoYTAwICogYjExIC0gYTAyICogYjA4ICsgYTAzICogYjA3KSAqIGRldDtcXG4gIG1hdE5vcm1bMV1bMl0gPSAoYTAxICogYjA4IC0gYTAwICogYjEwIC0gYTAzICogYjA2KSAqIGRldDtcXG4gIG1hdE5vcm1bMl1bMF0gPSAoYTMxICogYjA1IC0gYTMyICogYjA0ICsgYTMzICogYjAzKSAqIGRldDtcXG4gIG1hdE5vcm1bMl1bMV0gPSAoYTMyICogYjAyIC0gYTMwICogYjA1IC0gYTMzICogYjAxKSAqIGRldDtcXG4gIG1hdE5vcm1bMl1bMl0gPSAoYTMwICogYjA0IC0gYTMxICogYjAyICsgYTMzICogYjAwKSAqIGRldDtcXG4gIHJldHVybiBtYXROb3JtO1xcbn1cXG5mbG9hdCBiX3hfaW52ZXJzZShmbG9hdCBtKSB7XFxuICByZXR1cm4gMS4wIC8gbTtcXG59XFxubWF0MiBiX3hfaW52ZXJzZShtYXQyIG0pIHtcXG4gIHJldHVybiBtYXQyKG1bMV1bMV0sIC1tWzBdWzFdLCAtbVsxXVswXSwgbVswXVswXSkgLyAobVswXVswXSAqIG1bMV1bMV0gLSBtWzBdWzFdICogbVsxXVswXSk7XFxufVxcbm1hdDMgYl94X2ludmVyc2UobWF0MyBtKSB7XFxuICBmbG9hdCBhMDAgPSBtWzBdWzBdLCBhMDEgPSBtWzBdWzFdLCBhMDIgPSBtWzBdWzJdO1xcbiAgZmxvYXQgYTEwID0gbVsxXVswXSwgYTExID0gbVsxXVsxXSwgYTEyID0gbVsxXVsyXTtcXG4gIGZsb2F0IGEyMCA9IG1bMl1bMF0sIGEyMSA9IG1bMl1bMV0sIGEyMiA9IG1bMl1bMl07XFxuICBmbG9hdCBiMDEgPSBhMjIgKiBhMTEgLSBhMTIgKiBhMjE7XFxuICBmbG9hdCBiMTEgPSAtYTIyICogYTEwICsgYTEyICogYTIwO1xcbiAgZmxvYXQgYjIxID0gYTIxICogYTEwIC0gYTExICogYTIwO1xcbiAgZmxvYXQgZGV0ID0gYTAwICogYjAxICsgYTAxICogYjExICsgYTAyICogYjIxO1xcbiAgcmV0dXJuIG1hdDMoYjAxLCAoLWEyMiAqIGEwMSArIGEwMiAqIGEyMSksIChhMTIgKiBhMDEgLSBhMDIgKiBhMTEpLCBiMTEsIChhMjIgKiBhMDAgLSBhMDIgKiBhMjApLCAoLWExMiAqIGEwMCArIGEwMiAqIGExMCksIGIyMSwgKC1hMjEgKiBhMDAgKyBhMDEgKiBhMjApLCAoYTExICogYTAwIC0gYTAxICogYTEwKSkgLyBkZXQ7XFxufVxcbm1hdDQgYl94X2ludmVyc2UobWF0NCBtKSB7XFxuICBmbG9hdCBhMDAgPSBtWzBdWzBdLCBhMDEgPSBtWzBdWzFdLCBhMDIgPSBtWzBdWzJdLCBhMDMgPSBtWzBdWzNdLCBhMTAgPSBtWzFdWzBdLCBhMTEgPSBtWzFdWzFdLCBhMTIgPSBtWzFdWzJdLCBhMTMgPSBtWzFdWzNdLCBhMjAgPSBtWzJdWzBdLCBhMjEgPSBtWzJdWzFdLCBhMjIgPSBtWzJdWzJdLCBhMjMgPSBtWzJdWzNdLCBhMzAgPSBtWzNdWzBdLCBhMzEgPSBtWzNdWzFdLCBhMzIgPSBtWzNdWzJdLCBhMzMgPSBtWzNdWzNdLCBiMDAgPSBhMDAgKiBhMTEgLSBhMDEgKiBhMTAsIGIwMSA9IGEwMCAqIGExMiAtIGEwMiAqIGExMCwgYjAyID0gYTAwICogYTEzIC0gYTAzICogYTEwLCBiMDMgPSBhMDEgKiBhMTIgLSBhMDIgKiBhMTEsIGIwNCA9IGEwMSAqIGExMyAtIGEwMyAqIGExMSwgYjA1ID0gYTAyICogYTEzIC0gYTAzICogYTEyLCBiMDYgPSBhMjAgKiBhMzEgLSBhMjEgKiBhMzAsIGIwNyA9IGEyMCAqIGEzMiAtIGEyMiAqIGEzMCwgYjA4ID0gYTIwICogYTMzIC0gYTIzICogYTMwLCBiMDkgPSBhMjEgKiBhMzIgLSBhMjIgKiBhMzEsIGIxMCA9IGEyMSAqIGEzMyAtIGEyMyAqIGEzMSwgYjExID0gYTIyICogYTMzIC0gYTIzICogYTMyLCBkZXQgPSBiMDAgKiBiMTEgLSBiMDEgKiBiMTAgKyBiMDIgKiBiMDkgKyBiMDMgKiBiMDggLSBiMDQgKiBiMDcgKyBiMDUgKiBiMDY7XFxuICByZXR1cm4gbWF0NChhMTEgKiBiMTEgLSBhMTIgKiBiMTAgKyBhMTMgKiBiMDksIGEwMiAqIGIxMCAtIGEwMSAqIGIxMSAtIGEwMyAqIGIwOSwgYTMxICogYjA1IC0gYTMyICogYjA0ICsgYTMzICogYjAzLCBhMjIgKiBiMDQgLSBhMjEgKiBiMDUgLSBhMjMgKiBiMDMsIGExMiAqIGIwOCAtIGExMCAqIGIxMSAtIGExMyAqIGIwNywgYTAwICogYjExIC0gYTAyICogYjA4ICsgYTAzICogYjA3LCBhMzIgKiBiMDIgLSBhMzAgKiBiMDUgLSBhMzMgKiBiMDEsIGEyMCAqIGIwNSAtIGEyMiAqIGIwMiArIGEyMyAqIGIwMSwgYTEwICogYjEwIC0gYTExICogYjA4ICsgYTEzICogYjA2LCBhMDEgKiBiMDggLSBhMDAgKiBiMTAgLSBhMDMgKiBiMDYsIGEzMCAqIGIwNCAtIGEzMSAqIGIwMiArIGEzMyAqIGIwMCwgYTIxICogYjAyIC0gYTIwICogYjA0IC0gYTIzICogYjAwLCBhMTEgKiBiMDcgLSBhMTAgKiBiMDkgLSBhMTIgKiBiMDYsIGEwMCAqIGIwOSAtIGEwMSAqIGIwNyArIGEwMiAqIGIwNiwgYTMxICogYjAxIC0gYTMwICogYjAzIC0gYTMyICogYjAwLCBhMjAgKiBiMDMgLSBhMjEgKiBiMDEgKyBhMjIgKiBiMDApIC8gZGV0O1xcbn1cXG5mbG9hdCBjX3hfdHJhbnNwb3NlKGZsb2F0IG0pIHtcXG4gIHJldHVybiBtO1xcbn1cXG5tYXQyIGNfeF90cmFuc3Bvc2UobWF0MiBtKSB7XFxuICByZXR1cm4gbWF0MihtWzBdWzBdLCBtWzFdWzBdLCBtWzBdWzFdLCBtWzFdWzFdKTtcXG59XFxubWF0MyBjX3hfdHJhbnNwb3NlKG1hdDMgbSkge1xcbiAgcmV0dXJuIG1hdDMobVswXVswXSwgbVsxXVswXSwgbVsyXVswXSwgbVswXVsxXSwgbVsxXVsxXSwgbVsyXVsxXSwgbVswXVsyXSwgbVsxXVsyXSwgbVsyXVsyXSk7XFxufVxcbm1hdDQgY194X3RyYW5zcG9zZShtYXQ0IG0pIHtcXG4gIHJldHVybiBtYXQ0KG1bMF1bMF0sIG1bMV1bMF0sIG1bMl1bMF0sIG1bM11bMF0sIG1bMF1bMV0sIG1bMV1bMV0sIG1bMl1bMV0sIG1bM11bMV0sIG1bMF1bMl0sIG1bMV1bMl0sIG1bMl1bMl0sIG1bM11bMl0sIG1bMF1bM10sIG1bMV1bM10sIG1bMl1bM10sIG1bM11bM10pO1xcbn1cXG52ZWM0IGFwcGx5VHJhbnNmb3JtKHZlYzQgcG9zKSB7XFxuICBtYXQ0IE1WTWF0cml4ID0gdV92aWV3ICogdV90cmFuc2Zvcm07XFxuICBwb3MueCArPSAxLjA7XFxuICBwb3MueSAtPSAxLjA7XFxuICBwb3MueHl6ICo9IHVfc2l6ZSAqIDAuNTtcXG4gIHBvcy55ICo9IC0xLjA7XFxuICB2X3Bvc2l0aW9uID0gKE1WTWF0cml4ICogcG9zKS54eXo7XFxuICB2X2V5ZVZlY3RvciA9ICh1X3Jlc29sdXRpb24gKiAwLjUpIC0gdl9wb3NpdGlvbjtcXG4gIHBvcyA9IHVfcGVyc3BlY3RpdmUgKiBNVk1hdHJpeCAqIHBvcztcXG4gIHJldHVybiBwb3M7XFxufVxcbiN2ZXJ0X2RlZmluaXRpb25zXFxuXFxudmVjMyBjYWxjdWxhdGVPZmZzZXQodmVjMyBJRCkge1xcbiAgXFxuICAjdmVydF9hcHBsaWNhdGlvbnNcXG4gIHJldHVybiB2ZWMzKDAuMCk7XFxufVxcbnZvaWQgbWFpbigpIHtcXG4gIHZfdGV4dHVyZUNvb3JkaW5hdGUgPSBhX3RleENvb3JkO1xcbiAgdmVjMyBpbnZlcnRlZE5vcm1hbHMgPSBhX25vcm1hbHMgKyAodV9ub3JtYWxzLnggPCAwLjAgPyBjYWxjdWxhdGVPZmZzZXQodV9ub3JtYWxzKSAqIDIuMCAtIDEuMCA6IHZlYzMoMC4wKSk7XFxuICBpbnZlcnRlZE5vcm1hbHMueSAqPSAtMS4wO1xcbiAgdl9ub3JtYWwgPSBjX3hfdHJhbnNwb3NlKG1hdDMoYl94X2ludmVyc2UodV90cmFuc2Zvcm0pKSkgKiBpbnZlcnRlZE5vcm1hbHM7XFxuICB2ZWMzIG9mZnNldFBvcyA9IGFfcG9zICsgY2FsY3VsYXRlT2Zmc2V0KHVfcG9zaXRpb25PZmZzZXQpO1xcbiAgZ2xfUG9zaXRpb24gPSBhcHBseVRyYW5zZm9ybSh2ZWM0KG9mZnNldFBvcywgMS4wKSk7XFxufVwiLCBcIlxcbiNkZWZpbmUgR0xTTElGWSAxXFxuXFxuI2Zsb2F0X2RlZmluaXRpb25zXFxuXFxuZmxvYXQgYV94X2FwcGx5TWF0ZXJpYWwoZmxvYXQgSUQpIHtcXG4gIFxcbiAgI2Zsb2F0X2FwcGxpY2F0aW9uc1xcbiAgcmV0dXJuIDEuO1xcbn1cXG4jdmVjM19kZWZpbml0aW9uc1xcblxcbnZlYzMgYV94X2FwcGx5TWF0ZXJpYWwodmVjMyBJRCkge1xcbiAgXFxuICAjdmVjM19hcHBsaWNhdGlvbnNcXG4gIHJldHVybiB2ZWMzKDApO1xcbn1cXG4jdmVjNF9kZWZpbml0aW9uc1xcblxcbnZlYzQgYV94X2FwcGx5TWF0ZXJpYWwodmVjNCBJRCkge1xcbiAgXFxuICAjdmVjNF9hcHBsaWNhdGlvbnNcXG4gIHJldHVybiB2ZWM0KDApO1xcbn1cXG52ZWM0IGJfeF9hcHBseUxpZ2h0KGluIHZlYzQgYmFzZUNvbG9yLCBpbiB2ZWMzIG5vcm1hbCwgaW4gdmVjNCBnbG9zc2luZXNzKSB7XFxuICBpbnQgbnVtTGlnaHRzID0gaW50KHVfbnVtTGlnaHRzKTtcXG4gIHZlYzMgYW1iaWVudENvbG9yID0gdV9hbWJpZW50TGlnaHQgKiBiYXNlQ29sb3IucmdiO1xcbiAgdmVjMyBleWVWZWN0b3IgPSBub3JtYWxpemUodl9leWVWZWN0b3IpO1xcbiAgdmVjMyBkaWZmdXNlID0gdmVjMygwLjApO1xcbiAgYm9vbCBoYXNHbG9zc2luZXNzID0gZ2xvc3NpbmVzcy5hID4gMC4wO1xcbiAgYm9vbCBoYXNTcGVjdWxhckNvbG9yID0gbGVuZ3RoKGdsb3NzaW5lc3MucmdiKSA+IDAuMDtcXG4gIGZvcihpbnQgaSA9IDA7IGkgPCA0OyBpKyspIHtcXG4gICAgaWYoaSA+PSBudW1MaWdodHMpXFxuICAgICAgYnJlYWs7XFxuICAgIHZlYzMgbGlnaHREaXJlY3Rpb24gPSBub3JtYWxpemUodV9saWdodFBvc2l0aW9uW2ldLnh5eiAtIHZfcG9zaXRpb24pO1xcbiAgICBmbG9hdCBsYW1iZXJ0aWFuID0gbWF4KGRvdChsaWdodERpcmVjdGlvbiwgbm9ybWFsKSwgMC4wKTtcXG4gICAgaWYobGFtYmVydGlhbiA+IDAuMCkge1xcbiAgICAgIGRpZmZ1c2UgKz0gdV9saWdodENvbG9yW2ldLnJnYiAqIGJhc2VDb2xvci5yZ2IgKiBsYW1iZXJ0aWFuO1xcbiAgICAgIGlmKGhhc0dsb3NzaW5lc3MpIHtcXG4gICAgICAgIHZlYzMgaGFsZlZlY3RvciA9IG5vcm1hbGl6ZShsaWdodERpcmVjdGlvbiArIGV5ZVZlY3Rvcik7XFxuICAgICAgICBmbG9hdCBzcGVjdWxhcldlaWdodCA9IHBvdyhtYXgoZG90KGhhbGZWZWN0b3IsIG5vcm1hbCksIDAuMCksIGdsb3NzaW5lc3MuYSk7XFxuICAgICAgICB2ZWMzIHNwZWN1bGFyQ29sb3IgPSBoYXNTcGVjdWxhckNvbG9yID8gZ2xvc3NpbmVzcy5yZ2IgOiB1X2xpZ2h0Q29sb3JbaV0ucmdiO1xcbiAgICAgICAgZGlmZnVzZSArPSBzcGVjdWxhckNvbG9yICogc3BlY3VsYXJXZWlnaHQgKiBsYW1iZXJ0aWFuO1xcbiAgICAgIH1cXG4gICAgfVxcbiAgfVxcbiAgcmV0dXJuIHZlYzQoYW1iaWVudENvbG9yICsgZGlmZnVzZSwgYmFzZUNvbG9yLmEpO1xcbn1cXG52b2lkIG1haW4oKSB7XFxuICB2ZWM0IG1hdGVyaWFsID0gdV9iYXNlQ29sb3IuciA+PSAwLjAgPyB1X2Jhc2VDb2xvciA6IGFfeF9hcHBseU1hdGVyaWFsKHVfYmFzZUNvbG9yKTtcXG4gIGJvb2wgbGlnaHRzRW5hYmxlZCA9ICh1X2ZsYXRTaGFkaW5nID09IDAuMCkgJiYgKHVfbnVtTGlnaHRzID4gMC4wIHx8IGxlbmd0aCh1X2FtYmllbnRMaWdodCkgPiAwLjApO1xcbiAgdmVjMyBub3JtYWwgPSBub3JtYWxpemUodl9ub3JtYWwpO1xcbiAgdmVjNCBnbG9zc2luZXNzID0gdV9nbG9zc2luZXNzLnggPCAwLjAgPyBhX3hfYXBwbHlNYXRlcmlhbCh1X2dsb3NzaW5lc3MpIDogdV9nbG9zc2luZXNzO1xcbiAgdmVjNCBjb2xvciA9IGxpZ2h0c0VuYWJsZWQgPyBiX3hfYXBwbHlMaWdodChtYXRlcmlhbCwgbm9ybWFsaXplKHZfbm9ybWFsKSwgZ2xvc3NpbmVzcykgOiBtYXRlcmlhbDtcXG4gIGdsX0ZyYWdDb2xvciA9IGNvbG9yO1xcbiAgZ2xfRnJhZ0NvbG9yLmEgKj0gdV9vcGFjaXR5O1xcbn1cIiwgW10sIFtdKTtcbm1vZHVsZS5leHBvcnRzID0gc2hhZGVyczsiLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIHZpZXdwb3J0U2l6ZUYgPSByZXF1aXJlKFwiLi9nZXRWaWV3cG9ydFNpemVcIiksXG4gICAgRE9NRWxlbWVudCA9IHJlcXVpcmUoXCJmYW1vdXMvZG9tLXJlbmRlcmFibGVzL0RPTUVsZW1lbnRcIiksXG4gICAgc2V0dGluZ3MgPSByZXF1aXJlKFwiLi9zZXR0aW5nc1wiKSxcbiAgICBzY2VuZSA9IHJlcXVpcmUoXCIuL3NjZW5lXCIpLFxuICAgIGNhbGN1bGF0b3IgPSByZXF1aXJlKFwiLi9jYWxjdWxhdG9yXCIpLFxuXG4gICAgdmlld3BvcnRTaXplID0gdmlld3BvcnRTaXplRigpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChpbmRleCkge1xuICAgIHZhciBjYXIgPSBzY2VuZS5hZGRDaGlsZCgpLFxuICAgICAgICB0aHVtYm5haWxTaXplID0gY2FsY3VsYXRvci5nZXRUaHVtYm5haWxTaXplKCksXG4gICAgICAgIHBpeGVsQ29vcmRzID0gY2FsY3VsYXRvci5nZXRQaXhlbENvb3JkcyhpbmRleCksXG4gICAgICAgIHN0YXJ0WSA9IE1hdGguZmxvb3Iodmlld3BvcnRTaXplLmggLyB0aHVtYm5haWxTaXplLmgpICogdGh1bWJuYWlsU2l6ZS5oLFxuICAgICAgICBpbmNyZW1lbnQgPSB0aHVtYm5haWxTaXplLmggLyA0LFxuXG4gICAgICAgIG1vdmVDb21wb25lbnQsXG4gICAgICAgIG1vdmVyO1xuXG4gICAgbmV3IERPTUVsZW1lbnQoY2FyLCB7IHRhZ05hbWU6IFwiaW1nXCIgfSlcbiAgICAgICAgLnNldEF0dHJpYnV0ZShcInNyY1wiLCBcIi4vaW1hZ2VzL2NhclwiICsgKFwiMDAwXCIgKyAoaW5kZXggKyAxKSkuc2xpY2UoLTMpICsgXCIuanBnXCIpO1xuXG4gICAgY2FyXG4gICAgICAgIC5zZXRTaXplTW9kZShcImFic29sdXRlXCIsIFwiYWJzb2x1dGVcIiwgXCJhYnNvbHV0ZVwiKVxuICAgICAgICAuc2V0QWJzb2x1dGVTaXplKHRodW1ibmFpbFNpemUudywgdGh1bWJuYWlsU2l6ZS5oKTtcblxuICAgIGlmIChzdGFydFkgPCBwaXhlbENvb3Jkcy55KSB7XG4gICAgICAgIGNhci5zZXRQb3NpdGlvbihwaXhlbENvb3Jkcy54LCBwaXhlbENvb3Jkcy55KTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNhci5zZXRQb3NpdGlvbihwaXhlbENvb3Jkcy54LCBzdGFydFkpO1xuXG4gICAgbW92ZUNvbXBvbmVudCA9IHtcbiAgICAgICAgb25VcGRhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB4ID0gY2FyLmdldFBvc2l0aW9uKClbMF0sXG4gICAgICAgICAgICAgICAgeSA9IGNhci5nZXRQb3NpdGlvbigpWzFdO1xuICAgICAgICAgICAgaWYgKHkgPiBwaXhlbENvb3Jkcy55KSB7XG4gICAgICAgICAgICAgICAgY2FyLnNldFBvc2l0aW9uKHgsIHkgLSBpbmNyZW1lbnQpO1xuICAgICAgICAgICAgICAgIGNhci5yZXF1ZXN0VXBkYXRlT25OZXh0VGljayhtb3Zlcik7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FyLnJlbW92ZUNvbXBvbmVudChtb3ZlQ29tcG9uZW50KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBtb3ZlciA9IGNhci5hZGRDb21wb25lbnQobW92ZUNvbXBvbmVudCk7XG5cbiAgICBjYXIucmVxdWVzdFVwZGF0ZShtb3Zlcik7XG59O1xuXG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIHZpZXdwb3J0U2l6ZUYgPSByZXF1aXJlKFwiLi9nZXRWaWV3cG9ydFNpemVcIiksXG4gICAgc2V0dGluZ3MgPSByZXF1aXJlKFwiLi9zZXR0aW5nc1wiKSxcblxuICAgIHZpZXdwb3J0U2l6ZSA9IHZpZXdwb3J0U2l6ZUYoKTtcblxuZnVuY3Rpb24gZ2V0Q29sdW1ucygpIHtcbiAgICByZXR1cm4gTWF0aC5mbG9vcih2aWV3cG9ydFNpemUudyAvIHNldHRpbmdzLnRhcmdldFRodW1ibmFpbFdpZHRoKTtcbn1cblxuZnVuY3Rpb24gZ2V0VGh1bWJuYWlsU2l6ZSgpIHtcbiAgICB2YXIgdyA9IHZpZXdwb3J0U2l6ZS53IC8gZ2V0Q29sdW1ucygpLFxuICAgICAgICBoID0gdyAqIHNldHRpbmdzLnRodW1ibmFpbEFzcGVjdFJhdGlvO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgdzogdyxcbiAgICAgICAgaDogaFxuICAgIH07XG59XG5cbmZ1bmN0aW9uIGdldEdyaWRDb29yZHMoaW5kZXgpIHtcbiAgICB2YXIgY29scyA9IGdldENvbHVtbnMoKSxcbiAgICAgICAgY29sID0gaW5kZXggJSBjb2xzLFxuICAgICAgICByb3cgPSBNYXRoLmZsb29yKGluZGV4IC8gY29scyk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICByb3c6IHJvdyxcbiAgICAgICAgY29sOiBjb2xcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBnZXRQaXhlbENvb3JkcyhpbmRleCkge1xuICAgIHZhciBncmlkQ29vcmRzID0gZ2V0R3JpZENvb3JkcyhpbmRleCksXG4gICAgICAgIHRodW1ibmFpbFNpemUgPSBnZXRUaHVtYm5haWxTaXplKCksXG4gICAgICAgIHggPSBncmlkQ29vcmRzLmNvbCAqIHRodW1ibmFpbFNpemUudyxcbiAgICAgICAgeSA9IGdyaWRDb29yZHMucm93ICogdGh1bWJuYWlsU2l6ZS5oO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgeDogeCxcbiAgICAgICAgeTogeVxuICAgIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGdldENvbHVtbnM6IGdldENvbHVtbnMsXG4gICAgZ2V0VGh1bWJuYWlsU2l6ZTogZ2V0VGh1bWJuYWlsU2l6ZSxcbiAgICBnZXRHcmlkQ29vcmRzOiBnZXRHcmlkQ29vcmRzLFxuICAgIGdldFBpeGVsQ29vcmRzOiBnZXRQaXhlbENvb3Jkc1xufTtcblxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZGVsYXkobXMsIGZ1bmMpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGZ1bmMuYXBwbHkobnVsbCwgYXJncyk7XG4gICAgICAgIH0sIG1zKTtcbiAgICB9O1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodHlwZW9mKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRXaWR0aCkgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwidW5zdXBwb3J0ZWQgYnJvd3NlclwiKTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdzogZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoLFxuICAgICAgICBoOiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0XG4gICAgfTtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIEZhbW91c0VuZ2luZSA9IHJlcXVpcmUoXCJmYW1vdXMvY29yZS9GYW1vdXNFbmdpbmVcIik7XG5cbkZhbW91c0VuZ2luZS5pbml0KCk7XG5cbm1vZHVsZS5leHBvcnRzID0gRmFtb3VzRW5naW5lLmNyZWF0ZVNjZW5lKCk7XG4iLCJcInVzZSBzdHJpY3RcIjtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgdGFyZ2V0VGh1bWJuYWlsV2lkdGg6IDI0MCxcbiAgICB0aHVtYm5haWxBc3BlY3RSYXRpbzogMC43NVxufTtcblxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBhZGRDYXIgPSByZXF1aXJlKFwiLi9hZGRDYXJcIiksXG4gICAgZGVsYXkgPSByZXF1aXJlKFwiLi9kZWxheVwiKSxcbiAgICBpO1xuXG5mb3IgKGkgPSAwOyBpIDwgMTAwOyBpKyspIHtcbiAgICBkZWxheSgoaSAqIDMwKSArIChNYXRoLnJhbmRvbSgpICogMTAwKSwgYWRkQ2FyKShpKTtcbn1cblxuXG5cbiJdfQ==
