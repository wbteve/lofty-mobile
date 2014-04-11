// Platform: android
// 1.0.0-dev
/*
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at
 
     http://www.apache.org/licenses/LICENSE-2.0
 
 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
*/
;(function() {
var WING_JS_BUILD_LABEL = '1.0.0-dev';
// file: src/scripts/require.js

/*jshint -W079 */
/*jshint -W020 */

var require,
    define;

(function () {
    var modules = {},
    // Stack of moduleIds currently being built.
        requireStack = [],
    // Map of module ID -> index into requireStack of modules currently being built.
        inProgressModules = {},
        SEPARATOR = ".";



    function build(module) {
        var factory = module.factory,
            localRequire = function (id) {
                var resultantId = id;
                //Its a relative path, so lop off the last portion and add the id (minus "./")
                if (id.charAt(0) === ".") {
                    resultantId = module.id.slice(0, module.id.lastIndexOf(SEPARATOR)) + SEPARATOR + id.slice(2);
                }
                return require(resultantId);
            };
        module.exports = {};
        delete module.factory;
        factory(localRequire, module.exports, module);
        return module.exports;
    }

    require = function (id) {
        if (!modules[id]) {
            throw "module " + id + " not found";
        } else if (id in inProgressModules) {
            var cycle = requireStack.slice(inProgressModules[id]).join('->') + '->' + id;
            throw "Cycle in require graph: " + cycle;
        }
        if (modules[id].factory) {
            try {
                inProgressModules[id] = requireStack.length;
                requireStack.push(id);
                return build(modules[id]);
            } finally {
                delete inProgressModules[id];
                requireStack.pop();
            }
        }
        return modules[id].exports;
    };

    define = function (id, factory) {
        if (modules[id]) {
            throw "module " + id + " already defined";
        }

        modules[id] = {
            id: id,
            factory: factory
        };
    };

    define.remove = function (id) {
        delete modules[id];
    };

    define.moduleMap = modules;
})();

//Export for use in node
if (typeof module === "object" && typeof require === "function") {
    module.exports.require = require;
    module.exports.define = define;
}

// file: src/wing.js
define("wing", function(require, exports, module) {

var channel = require('wing/channel');
var platform = require('wing/platform');

/**
 * Intercept calls to addEventListener + removeEventListener and handle
 * deviceready, resume, and pause events.
 */
var m_document_addEventListener = document.addEventListener;
var m_document_removeEventListener = document.removeEventListener;
var m_window_addEventListener = window.addEventListener;
var m_window_removeEventListener = window.removeEventListener;

/**
 * Houses custom event handlers to intercept on document + window event
 * listeners.
 */
var documentEventHandlers = {}, windowEventHandlers = {};

document.addEventListener = function(evt, handler, capture) {
    var e = evt.toLowerCase();
    if (typeof documentEventHandlers[e] != 'undefined') {
        documentEventHandlers[e].subscribe(handler);
    } else {
        m_document_addEventListener.call(document, evt, handler, capture);
    }
};

window.addEventListener = function(evt, handler, capture) {
    var e = evt.toLowerCase();
    if (typeof windowEventHandlers[e] != 'undefined') {
        windowEventHandlers[e].subscribe(handler);
    } else {
        m_window_addEventListener.call(window, evt, handler, capture);
    }
};

document.removeEventListener = function(evt, handler, capture) {
    var e = evt.toLowerCase();
    // If unsubscribing from an event that is handled by a plugin
    if (typeof documentEventHandlers[e] != "undefined") {
        documentEventHandlers[e].unsubscribe(handler);
    } else {
        m_document_removeEventListener.call(document, evt, handler, capture);
    }
};

window.removeEventListener = function(evt, handler, capture) {
    var e = evt.toLowerCase();
    // If unsubscribing from an event that is handled by a plugin
    if (typeof windowEventHandlers[e] != "undefined") {
        windowEventHandlers[e].unsubscribe(handler);
    } else {
        m_window_removeEventListener.call(window, evt, handler, capture);
    }
};

function createEvent(type, data) {
    var event = document.createEvent('Events');
    event.initEvent(type, false, false);
    if (data) {
        for ( var i in data) {
            if (data.hasOwnProperty(i)) {
                event[i] = data[i];
            }
        }
    }
    return event;
}

var wing = {
    define : define,
    require : require,
    version : "1.0.0",
    platformId : platform.id,
    navigator : {},
    /**
     * Methods to add/remove your own addEventListener hijacking on document +
     * window.
     */
    addWindowEventHandler : function(event) {
        return (windowEventHandlers[event] = channel.create(event));
    },
    addStickyDocumentEventHandler : function(event) {
        return (documentEventHandlers[event] = channel.createSticky(event));
    },
    addDocumentEventHandler : function(event) {
        return (documentEventHandlers[event] = channel.create(event));
    },
    removeWindowEventHandler : function(event) {
        delete windowEventHandlers[event];
    },
    removeDocumentEventHandler : function(event) {
        delete documentEventHandlers[event];
    },
    /**
     * Retrieve original event handlers that were replaced by wing
     *
     * @return object
     */
    getOriginalHandlers : function() {
        return {
            'document' : {
                'addEventListener' : m_document_addEventListener,
                'removeEventListener' : m_document_removeEventListener
            },
            'window' : {
                'addEventListener' : m_window_addEventListener,
                'removeEventListener' : m_window_removeEventListener
            }
        };
    },
    /**
     * Method to fire event from native code bNoDetach is required for events
     * which cause an exception which needs to be caught in native code
     */
    fireDocumentEvent : function(type, data, bNoDetach) {
        var evt = createEvent(type, data);
        if (typeof documentEventHandlers[type] != 'undefined') {
            if (bNoDetach) {
                documentEventHandlers[type].fire(evt);
            } else {
                setTimeout(function() {
                    // Fire deviceready on listeners that were registered before
                    // wing.js was loaded.
                    if (type == 'deviceready') {
                        document.dispatchEvent(evt);
                    }
                    documentEventHandlers[type].fire(evt);
                }, 0);
            }
        } else {
            document.dispatchEvent(evt);
        }
    },
    fireWindowEvent : function(type, data) {
        var evt = createEvent(type, data);
        if (typeof windowEventHandlers[type] != 'undefined') {
            setTimeout(function() {
                windowEventHandlers[type].fire(evt);
            }, 0);
        } else {
            window.dispatchEvent(evt);
        }
    },

    addNavigator : function(apiName, fun) {
        wing.navigator[apiName] = fun;
    },

    /**
     * Plugin callback mechanism.
     */
    // Randomize the starting callbackId to avoid collisions after refreshing or
    // navigating.
    // This way, it's very unlikely that any new callback would get the same
    // callbackId as an old callback.
    addConstructor : function(func) {
        channel.onWingReady.subscribe(function() {
            try {
                func();
            } catch (e) {
                console.log("Failed to run constructor: " + e);
            }
        });
    }
};

module.exports = wing;

});

// file: src/common/base64.js
define("wing/base64", function(require, exports, module) {

var base64 = exports;

base64.fromArrayBuffer = function(arrayBuffer) {
    var array = new Uint8Array(arrayBuffer);
    return uint8ToBase64(array);
};

//------------------------------------------------------------------------------

/* This code is based on the performance tests at http://jsperf.com/b64tests
 * This 12-bit-at-a-time algorithm was the best performing version on all
 * platforms tested.
 */

var b64_6bit = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var b64_12bit;

var b64_12bitTable = function() {
    b64_12bit = [];
    for (var i=0; i<64; i++) {
        for (var j=0; j<64; j++) {
            b64_12bit[i*64+j] = b64_6bit[i] + b64_6bit[j];
        }
    }
    b64_12bitTable = function() { return b64_12bit; };
    return b64_12bit;
};

function uint8ToBase64(rawData) {
    var numBytes = rawData.byteLength;
    var output="";
    var segment;
    var table = b64_12bitTable();
    for (var i=0;i<numBytes-2;i+=3) {
        segment = (rawData[i] << 16) + (rawData[i+1] << 8) + rawData[i+2];
        output += table[segment >> 12];
        output += table[segment & 0xfff];
    }
    if (numBytes - i == 2) {
        segment = (rawData[i] << 16) + (rawData[i+1] << 8);
        output += table[segment >> 12];
        output += b64_6bit[(segment & 0xfff) >> 6];
        output += '=';
    } else if (numBytes - i == 1) {
        segment = (rawData[i] << 16);
        output += table[segment >> 12];
        output += '==';
    }
    return output;
}

});

// file: src/common/channel.js
define("wing/channel", function(require, exports, module) {

var utils = require('wing/utils'),
    nextGuid = 1;

/**
 * Custom pub-sub "channel" that can have functions subscribed to it
 * This object is used to define and control firing of events for
 * wing initialization, as well as for custom events thereafter.
 *
 * The order of events during page load and wing startup is as follows:
 *
 * onDOMContentLoaded*         Internal event that is received when the web page is loaded and parsed.
 * onNativeReady*              Internal event that indicates the wing native side is ready.
 * onWingReady*             Internal event fired when all wing JavaScript objects have been created.
 * onDeviceReady*              User event fired to indicate that wing is ready
 * onResume                    User event fired to indicate a start/resume lifecycle event
 * onPause                     User event fired to indicate a pause lifecycle event
 * onDestroy*                  Internal event fired when app is being destroyed (User should use window.onunload event, not this one).
 *
 * The events marked with an * are sticky. Once they have fired, they will stay in the fired state.
 * All listeners that subscribe after the event is fired will be executed right away.
 *
 * The only wing events that user code should register for are:
 *      deviceready           wing native code is initialized and wing APIs can be called from JavaScript
 *      pause                 App has moved to background
 *      resume                App has returned to foreground
 *
 * Listeners can be registered as:
 *      document.addEventListener("deviceready", myDeviceReadyListener, false);
 *      document.addEventListener("resume", myResumeListener, false);
 *      document.addEventListener("pause", myPauseListener, false);
 *
 * The DOM lifecycle events should be used for saving and restoring state
 *      window.onload
 *      window.onunload
 *
 */

/**
 * Channel
 * @constructor
 * @param type  String the channel name
 */
var Channel = function(type, sticky) {
    this.type = type;
    // Map of guid -> function.
    this.handlers = {};
    // 0 = Non-sticky, 1 = Sticky non-fired, 2 = Sticky fired.
    this.state = sticky ? 1 : 0;
    // Used in sticky mode to remember args passed to fire().
    this.fireArgs = null;
    // Used by onHasSubscribersChange to know if there are any listeners.
    this.numHandlers = 0;
    // Function that is called when the first listener is subscribed, or when
    // the last listener is unsubscribed.
    this.onHasSubscribersChange = null;
},
    channel = {
        /**
         * Calls the provided function only after all of the channels specified
         * have been fired. All channels must be sticky channels.
         */
        join: function(h, c) {
            var len = c.length,
                i = len,
                f = function() {
                    if (!(--i)) h();
                };
            for (var j=0; j<len; j++) {
                if (c[j].state === 0) {
                    throw Error('Can only use join with sticky channels.');
                }
                c[j].subscribe(f);
            }
            if (!len) h();
        },
        create: function(type) {
            return channel[type] = new Channel(type, false);
        },
        createSticky: function(type) {
            return channel[type] = new Channel(type, true);
        },

        /**
         * wing Channels that must fire before "deviceready" is fired.
         */
        deviceReadyChannelsArray: [],
        deviceReadyChannelsMap: {},

        /**
         * Indicate that a feature needs to be initialized before it is ready to be used.
         * This holds up wing's "deviceready" event until the feature has been initialized
         * and wing.initComplete(feature) is called.
         *
         * @param feature {String}     The unique feature name
         */
        waitForInitialization: function(feature) {
            if (feature) {
                var c = channel[feature] || this.createSticky(feature);
                this.deviceReadyChannelsMap[feature] = c;
                this.deviceReadyChannelsArray.push(c);
            }
        },

        /**
         * Indicate that initialization code has completed and the feature is ready to be used.
         *
         * @param feature {String}     The unique feature name
         */
        initializationComplete: function(feature) {
            var c = this.deviceReadyChannelsMap[feature];
            if (c) {
                c.fire();
            }
        }
    };

function forceFunction(f) {
    if (typeof f != 'function') throw "Function required as first argument!";
}

/**
 * Subscribes the given function to the channel. Any time that
 * Channel.fire is called so too will the function.
 * Optionally specify an execution context for the function
 * and a guid that can be used to stop subscribing to the channel.
 * Returns the guid.
 */
Channel.prototype.subscribe = function(f, c) {
    // need a function to call
    forceFunction(f);
    if (this.state == 2) {
        f.apply(c || this, this.fireArgs);
        return;
    }

    var func = f,
        guid = f.observer_guid;
    if (typeof c == "object") { func = utils.close(c, f); }

    if (!guid) {
        // first time any channel has seen this subscriber
        guid = '' + nextGuid++;
    }
    func.observer_guid = guid;
    f.observer_guid = guid;

    // Don't add the same handler more than once.
    if (!this.handlers[guid]) {
        this.handlers[guid] = func;
        this.numHandlers++;
        if (this.numHandlers == 1) {
            this.onHasSubscribersChange && this.onHasSubscribersChange();
        }
    }
};

/**
 * Unsubscribes the function with the given guid from the channel.
 */
Channel.prototype.unsubscribe = function(f) {
    // need a function to unsubscribe
    forceFunction(f);

    var guid = f.observer_guid,
        handler = this.handlers[guid];
    if (handler) {
        delete this.handlers[guid];
        this.numHandlers--;
        if (this.numHandlers === 0) {
            this.onHasSubscribersChange && this.onHasSubscribersChange();
        }
    }
};

/**
 * Calls all functions subscribed to this channel.
 */
Channel.prototype.fire = function(e) {
    var fail = false,
        fireArgs = Array.prototype.slice.call(arguments);
    // Apply stickiness.
    if (this.state == 1) {
        this.state = 2;
        this.fireArgs = fireArgs;
    }
    if (this.numHandlers) {
        // Copy the values first so that it is safe to modify it from within
        // callbacks.
        var toCall = [];
        for (var item in this.handlers) {
            toCall.push(this.handlers[item]);
        }
        for (var i = 0; i < toCall.length; ++i) {
            toCall[i].apply(this, fireArgs);
        }
        if (this.state == 2 && this.numHandlers) {
            this.numHandlers = 0;
            this.handlers = {};
            this.onHasSubscribersChange && this.onHasSubscribersChange();
        }
    }
};


// defining them here so they are ready super fast!
// DOM event that is received when the web page is loaded and parsed.
channel.createSticky('onDOMContentLoaded');

// Event to indicate the wing native side is ready.
channel.createSticky('onNativeReady');

// Event to indicate that all wing JavaScript objects have been created
// and it's time to run plugin constructors.
channel.createSticky('onWingReady');

// Event to indicate that all automatically loaded JS plugins are loaded and ready.
channel.createSticky('onPluginsReady');

// Event to indicate that wing is ready
channel.createSticky('onDeviceReady');

// Event to indicate a resume lifecycle event
channel.create('onResume');

// Event to indicate a pause lifecycle event
channel.create('onPause');

// Event to indicate a destroy lifecycle event
channel.createSticky('onDestroy');

// Channels that must fire before "deviceready" is fired.
channel.waitForInitialization('onWingReady');
channel.waitForInitialization('onDOMContentLoaded');

module.exports = channel;

});

// file: src/android/exec.js
define("wing/exec", function(require, exports, module) {

var wing = require('wing'), utils = require('wing/utils'), base64 = require('wing/base64');
// typeCode 执行类型 0:同步线程 1：异步线程 2：ui线程 3:监听线程

var ids = 100000;

var callbackStatus = {
    NO_RESULT : 0,
    OK : 1,
    CLASS_NOT_FOUND_EXCEPTION : 2,
    ILLEGAL_ACCESS_EXCEPTION : 3,
    INSTANTIATION_EXCEPTION : 4,
    MALFORMED_URL_EXCEPTION : 5,
    IO_EXCEPTION : 6,
    INVALID_ACTION : 7,
    JSON_EXCEPTION : 8,
    ERROR : 9
};

var callbackHandler = {};

var keepHandler = {};


window._wingClient = {
    call : function(id, data) {
        callbackHandler[id](data);
        if (!keepHandler[id]) {
            delete callbackHandler[id];
        }
    },
    getCallback : function(success, error) {
        return null;
    },
    getID : function() {
        ids++;
        return ids;
    },
    getHtml:function(){
        var html = document.getElementsByTagName('html')[0].innerHTML;

        exec(0,"product",["getHtml",html]);

    }
};

var exec = function(typeCode, action, args, success, error) {

    var id = window._wingClient.getID();
    var params = args;
    // 如果参数不是数组，则采用json转化为字符串
    if (args && !utils.isArray(args)) {
        params = [ JSON.stringify(args) ];
    }

    if (typeCode === 0) {
        return eval("(" + window._wingNative.syncHandler(action, params) + ")");
    }
    if (typeCode === 1 || typeCode === 3) {
        if (typeCode === 3) {
            keepHandler[id] = {};
        }
        callbackHandler[id] = function(result) {

            if (success && result && result.success) {
                success(result);
            } else if (error) {
                if (!result) {
                    error({
                        "errorCode" : 0,
                        "message" : "no result"
                    });
                } else {
                    error(result);
                }
            }
        };
        return window._wingNative.asyncHandler(id, action, params);
    }

    if (typeCode === 2) {

        callbackHandler[id] = function(result) {
            if (!result) {
                error({
                    "errorCode" : 0,
                    "message" : "no result"
                });
            } else {
                if (success) {
                    success(result);
                }
            }
        };
        return window._wingNative.uiHandler(id, action, params);
    }

};

module.exports = exec;

});

// file: src/common/init.js
define("wing/init", function(require, exports, module) {

var channel = require('wing/channel');
var wing = require('wing');
var platform = require('wing/platform');

var exec = require('wing/exec');

var utils = require('wing/utils');


var platformInitChannelsArray = [ channel.onNativeReady, channel.onPluginsReady ];

function logUnfiredChannels(arr) {
    for ( var i = 0; i < arr.length; ++i) {
        if (arr[i].state != 2) {
        //    console.log('Channel not fired: ' + arr[i].type);
        }
    }
}

window.setTimeout(function() {
    if (channel.onDeviceReady.state != 2) {
        //console.log('deviceready has not fired after 5 seconds.');
        logUnfiredChannels(platformInitChannelsArray);
        logUnfiredChannels(channel.deviceReadyChannelsArray);
    }
}, 5000);

if (window.console) {
    window.console = {
        log : function(msg) {
            var d = msg;
            if (utils.typeName(msg) == "Object") {
                d = JSON.stringify(msg);
            }
            exec(2, "product", [ "log", d ]);
        },
        error : function(msg) {
            var d = msg;
            if (utils.typeName(msg) == "Object") {
                d = JSON.stringify(msg);
            }
            exec(2, "product", [ "log", d ]);
        }
    };
}
if (!window.console.warn) {
    window.console.warn = function(msg) {
        this.log("warn: " + msg);
    };
}

// Register pause, resume and deviceready channels as events on document.
channel.onPause = wing.addDocumentEventHandler('pause');
channel.onResume = wing.addDocumentEventHandler('resume');
channel.onDeviceReady = wing.addStickyDocumentEventHandler('deviceready');

// Listen for DOMContentLoaded and notify our channel subscribers.
if (document.readyState == 'complete' || document.readyState == 'interactive') {
    channel.onDOMContentLoaded.fire();
} else {
    document.addEventListener('DOMContentLoaded', function() {
        channel.onDOMContentLoaded.fire();
    }, false);
}

// _nativeReady is global variable that the native side can set
// to signify that the native code is ready. It is a global since
// it may be called before any wing JS is ready.
if (window._nativeReady) {
    channel.onNativeReady.fire();
}

// Call the platform-specific initialization.
platform.bootstrap && platform.bootstrap();

/**
 * Create all wing objects once native side is ready.
 */
channel.join(function() {

    platform.initialize && platform.initialize();

    // Fire event to notify that all objects are created
    channel.onWingReady.fire();

    // Fire onDeviceReady event once page has fully loaded, all
    // constructors have run and wing info has been received from native
    // side.
    channel.join(function() {
        require('wing').fireDocumentEvent('deviceready');
    }, channel.deviceReadyChannelsArray);

}, platformInitChannelsArray);


});

// file: src/android/platform.js
define("wing/platform", function(require, exports, module) {

module.exports = {
    id: 'android',
    bootstrap: function() {
        var channel = require('wing/channel'),
            wing = require('wing'),
            exec = require('wing/exec');

        // Tell the native code that a page change has occurred.
       // exec(null, null, 'PluginManager', 'startup', []);
        // Tell the JS that the native side is ready.
        channel.onNativeReady.fire();
        require('wing/plugin/android/product');
        require('wing/plugin/android/load');
        require('wing/plugin/android/shake');
        require('wing/plugin/android/popupwindow');
        require('wing/plugin/android/huoyan');
        require('wing/plugin/android/dataservice');
        require('wing/plugin/android/share');
        require('wing/plugin/android/loading');
        require('wing/plugin/android/back');
        require('wing/plugin/android/tooltip');
        require('wing/plugin/android/keyboard');
        require('wing/plugin/android/rewrite');
        require('wing/plugin/android/ui');
        require('wing/plugin/android/blowsensor');
        require('wing/plugin/android/storage');
        require('wing/plugin/android/post');

        require('wing/plugin/android/debug');

    }
};

});

// file: src/android/plugin/android/back.js
define("wing/plugin/android/back", function(require, exports, module) {

var exec = require('wing/exec'), wing = require('wing');


var back = {
    listener : function(callback) {
        exec(3, "keyboard", [ "listener" ], function(result){
            if(result&&result.data&&result.data.status){
                callback();
            }

        });
    },
    go : function() {
        exec(0, "keyboard", [ "go" ]);
    }

};

wing.addNavigator("back", back);

module.exports = back;

});

// file: src/android/plugin/android/blowsensor.js
define("wing/plugin/android/blowsensor", function(require, exports, module) {

var exec = require('wing/exec'), wing = require('wing');

var channel = require('wing/channel');

channel.create('onBlowsensor');
channel.onBlowsensor = wing.addDocumentEventHandler('blowsensor');

var f;


var blowsensor = {
    open : function(func) {
        f = func;
        exec(1, "blowsensor", [ "start" ], function(result) {
            channel.onBlowsensor.subscribe(f);
        });
    },
    stop : function() {
        exec(0, "blowsensor", [ "stop" ]);
        if(f){
            channel.onBlowsensor.unsubscribe(f);
        }
    }

};

wing.addNavigator("blowsensor", blowsensor);

module.exports = blowsensor;

});

// file: src/android/plugin/android/dataservice.js
define("wing/plugin/android/dataservice", function(require, exports, module) {

var exec = require('wing/exec'), wing = require('wing');

var dataservice = {};

dataservice.syncCall = function(url, parameter, success, error) {
    if (url.indexOf("http://") == -1) {
        url = "http://" + url;
    }
    var result = exec(0, "dataservice", [ url, parameter ]);
    if (success && result && result.success) {
        success(JSON.parse(result.data));
    } else if (error) {
        if (!result) {
            error({
                "errorCode" : 0,
                "message" : "no result"
            });
        } else {
            error(result);
        }
    }
};
dataservice.asyncCall = function(url, parameter, success, error) {
    if (url.indexOf("http://") == -1) {
        url = "http://" + url;
    }
    exec(1, "dataservice", [ url, parameter ], function(result){
        success(JSON.parse(result.data));
    }, error);
};

wing.addNavigator("dataservice", dataservice);

module.exports = dataservice;

});

// file: src/android/plugin/android/debug.js
define("wing/plugin/android/debug", function(require, exports, module) {

var exec = require('wing/exec'), wing = require('wing');

var debug = {

    get : function() {
        return exec(0, "debug", [ "get" ]);
    },
    mock : function(ip) {
        exec(1, "debug", [ "mock", ip ], function(data) {
            alert('Mock环境设置成功!');
        });
    },
    mid : function(id) {
        exec(1, "debug", [ "mid", id ], function(data) {
            alert('memberId设置成功!');
        });
    },
    enableWeinre : function() {
        exec(0, "debug", [ "enableWeinre" ]);
    },
    getNick : function(id) {
        return exec(0, "debug", [ "getnick" ]);
    },
    logout : function(id) {
        return exec(0, "debug", [ "logout" ]);
    },
    getMTOP : function() {
        return exec(0, "debug", [ "getMTOP" ]);
    },
    initMTOP : function(env, appKey, appSecret) {
        exec(1, "debug", [ "initMTOP", env, appKey, appSecret ], function(data) {
            alert('初始化成功!');
            return true;
        });
    }

};

wing.addNavigator("debug", debug);

module.exports = debug;

});

// file: src/android/plugin/android/huoyan.js
define("wing/plugin/android/huoyan", function(require, exports, module) {

var exec = require('wing/exec'), wing = require('wing');


var huoyan = function(){
    exec(2, "huoyan", []);
};

wing.addNavigator("huoyan", huoyan);

module.exports = huoyan;

});

// file: src/android/plugin/android/keyboard.js
define("wing/plugin/android/keyboard", function(require, exports, module) {

var exec = require('wing/exec'), wing = require('wing');

var keyboard = {
    enter : function(type, callback) {

        exec(3, "keyboard", [ "enter", type ], function(result) {
            if (!result) {
                return;
            }
            if (result.data && result.data.code == type) {
                callback(type);
            }

        });
    },
    hide : function() {
        exec(2, "keyboard", [ "hide" ]);
    }

};

wing.addNavigator("keyboard", keyboard);

module.exports = keyboard;

});

// file: src/android/plugin/android/load.js
define("wing/plugin/android/load", function(require, exports, module) {

var exec = require('wing/exec'), wing = require('wing');

// 0:震动 vibrator；1：音乐 music
// {"type":1,"musicPath":""}


wing.addNavigator("getRealURL", function(url){
    if(url.indexOf("http://")==-1){
        url = "http://"+url;
    }
    var result = exec(0,"loader",[url]);
    return result.data.url;
});

wing.addNavigator("load", function(url,success,error){


});

module.exports = {};

});

// file: src/android/plugin/android/loading.js
define("wing/plugin/android/loading", function(require, exports, module) {

var exec = require('wing/exec'), wing = require('wing');

/**
 * Wing.navigator.loading.show();
 *
 */

var loading = {

    show : function() {
        exec(2, "loading", [ "show" ]);
    },
    hide : function() {
        exec(2, "loading", [ "hide" ]);
    }

};

wing.addNavigator("loading", loading);

module.exports = loading;

});

// file: src/android/plugin/android/popupwindow.js
define("wing/plugin/android/popupwindow", function(require, exports, module) {

var exec = require('wing/exec'), wing = require('wing');

/**
 * {
 *  "确定":function(index){
 *
 *  }
 * }
 *
 *
 */

var popupWindow = function(params){
    var index = 0,tags= [];


    for(var i in params){
        tags.push(i);
        index++;
    }

    exec(2, "popupWindow", tags, function(data) {
        params[data]();
    });

};

wing.addNavigator("popupWindow", popupWindow);

module.exports = popupWindow;

});

// file: src/android/plugin/android/post.js
define("wing/plugin/android/post", function(require, exports, module) {

var exec = require('wing/exec'), wing = require('wing');

var post = function (url, data) {
    exec(2, "rewrite", ['URL', url, JSON.stringify(data)]);
};

wing.addNavigator("post", post);

module.exports = post;

});

// file: src/android/plugin/android/product.js
define("wing/plugin/android/product", function(require, exports, module) {

var exec = require('wing/exec'), wing = require('wing');

var product = {
    /**
     * Clear the resource cache.
     */
    clearCache : function() {
        exec(1, "product", [ "clearCache" ]);
    },

    /**
     * Load the url into the webview or into new browser instance.
     *
     * @param url
     *            The URL to load
     * @param props
     *            Properties that can be passed in to the activity: wait: int =>
     *            wait msec before loading URL loadingDialog: "Title,Message" =>
     *            display a native loading dialog loadUrlTimeoutValue: int =>
     *            time in msec to wait before triggering a timeout error
     *            clearHistory: boolean => clear webview history (default=false)
     *            openExternal: boolean => open in a new browser (default=false)
     *
     * Example: navigator.app.loadUrl("http://server/myapp/index.html",
     * {wait:2000, loadingDialog:"Wait,Loading App", loadUrlTimeoutValue:
     * 60000});
     */
    loadUrl : function(url, props) {
        exec(1, "product", [ "loadUrl", url ]);
    },

    /**
     * Clear web history in this web view. Instead of BACK button loading the
     * previous web page, it will exit the app.
     */
    clearHistory : function() {
        exec(0, "product", [ "clearHistory" ]);
    },

    /**
     * Go to previous page displayed. This is the same as pressing the
     * backbutton on Android device.
     */
    backHistory : function() {
        exec(0, "product", [ "backHistory" ]);
    }

};

wing.addNavigator("product", product);

module.exports = product;

});

// file: src/android/plugin/android/rewrite.js
define("wing/plugin/android/rewrite", function(require, exports, module) {

var exec = require('wing/exec'), wing = require('wing');

/**
 * {
 *  "确定":function(index){
 *
 *  }
 * }
 *
 */

var rewrite = function(type, url, data){

    exec(2, "rewrite", [type, url, data]);

};

wing.addNavigator("rewrite", rewrite);

module.exports = rewrite;

});

// file: src/android/plugin/android/shake.js
define("wing/plugin/android/shake", function(require, exports, module) {

var exec = require('wing/exec'), wing = require('wing');

// 0:震动 vibrator
// 1:音乐 music
// 2:静默 silent
// params={"type":1,"musicPath":""}

var shake = {
    open : function(params, func) {
        exec(3, "shake", [ "start" ], function(result) {
            if (result && result.data && result.data.callback == "onShake") {
                if (!params.type || params.type === 0) {
                    var rsv = exec(0, "shake", [ "vibrator" ]);
                    if (func) {
                        func(rsv);
                    }
                }

                if (params.type === 1) {
                    var rsm = exec(0, "shake", [ "music", params.musicPath ]);
                    if (func) {
                        func(rsm);
                    }
                }

                if (params.type === 2) {
                    var rss = exec(0, "shake", [ "silent" ]);
                    if (func) {
                        func(rss);
                    }
                }
            }
        });
    },
    stop : function() {
        exec(0, "shake", [ "stop" ]);
    }

};

wing.addNavigator("shake", shake);

module.exports = shake;

});

// file: src/android/plugin/android/share.js
define("wing/plugin/android/share", function(require, exports, module) {

var exec = require('wing/exec'), wing = require('wing');

/**
 * {
 *  "确定":function(index){
 *
 *  }
 * }
 * Wing.navigator.share("title","content","imgUrl","link",function(successMsg){},function(errorMsg){});
 *
 */

var share = function(title,content,imgUrl,link,success,err){

    exec(2, "share", [title,content,imgUrl,link], success,err);

};

wing.addNavigator("share", share);

module.exports = share;

});

// file: src/android/plugin/android/storage.js
define("wing/plugin/android/storage", function(require, exports, module) {

var exec = require('wing/exec'), wing = require('wing');

var storage = {
    get : function(key){
        if (typeof key !== 'string') {
            console.error("storage.get() error: Argument key should be a string!");
            return null;
        }
        var prdName = "butterfly";
        if (window.Wing && window.Wing.config && typeof window.Wing.config.productName === 'string') {
            prdName =  window.Wing.config.productName;
        }
        var result = exec(0, "storage", ["get", prdName, key]);
        if (result && result.success === true && result.data && typeof result.data === "string") {
            return JSON.parse(result.data);
        } else {
            return null;
        }
    },

    put : function(key, value, expire){
        if (typeof key !== 'string') {
            console.error("storage.put() error: Argument key should be a string!");
            return false;
        }
        if (arguments.length < 2) {
            console.error("storage.put() error: At least 2 arguments should be set!");
            return false;
        }
        if (typeof value === 'undefined' || value === null) {
            console.error("storage.put() error: Argument value should be set as a valid Javascript object!");
            return false;
        }
        if (arguments.length >= 3 && typeof expire !== 'number') {
            console.error("storage.put() error: Argument expire should be a number or not set!");
            return false;
        }

        var prdName = "butterfly";
        if (window.Wing && window.Wing.config && typeof window.Wing.config.productName === 'string') {
            prdName =  window.Wing.config.productName;
        }

        var result = exec(0, "storage", ["put", prdName, key, JSON.stringify(value), expire ? expire.toString() : '0']);

        if (result && result.success) {
            return result.success;
        } else {
            return false;
        }
    },

    putWithCheck : function(key, oldValue, newValue, expire){
        if (typeof key !== 'string') {
            console.error("storage.putWithCheck() error: Argument key should be a string!");
            return false;
        }
        if (arguments.length < 3) {
            console.error("storage.putWithCheck() error: At least 3 arguments should be set!");
            return false;
        }
        if (typeof oldValue === 'undefined') {
            console.error("storage.putWithCheck() error: Argument oldValue should be set as a valid Javascript object or null!");
            return false;
        }
        if (typeof newValue === 'undefined' || newValue === null) {
            console.error("storage.putWithCheck() error: Argument newValue should be set as a valid Javascript object!");
            return false;
        }
        if (arguments.length >= 4 && typeof expire !== 'number') {
            console.error("storage.putWithCheck() error: Argument expire should be a number or not set!");
            return false;
        }

        var prdName = "butterfly";
        if (window.Wing && window.Wing.config && typeof window.Wing.config.productName === 'string') {
            prdName =  window.Wing.config.productName;
        }

        var result = exec(0, "storage", ["putWithCheck", prdName, key, oldValue ? JSON.stringify(oldValue) : null, JSON.stringify(newValue), expire ? expire.toString() : '0']);

        if (result && result.success) {
            return result.success;
        } else {
            return false;
        }
    },

    remove : function(key){
        if (typeof key !== 'string') {
            console.error("storage.remove() error: Argument key should be a string!");
            return false;
        }
        var prdName = "butterfly";
        if (window.Wing && window.Wing.config && typeof window.Wing.config.productName === 'string') {
            prdName =  window.Wing.config.productName;
        }
        var result = exec(0, "storage", ["remove", prdName, key]);
        if (result && result.success) {
            return result.success;
        } else {
            return false;
        }
    },

    removeWithCheck : function (key, oldValue) {
        if (typeof key !== 'string') {
            console.error("storage.removeWithCheck() error: Argument key should be a string!");
            return false;
        }
        if (arguments.length < 2) {
            console.error("storage.removeWithCheck() error: At least 2 arguments should be set!");
            return false;
        }
        if (typeof oldValue === 'undefined' || oldValue === null) {
            console.error("storage.removeWithCheck() error: Argument oldValue should be set as a valid Javascript object!");
            return false;
        }
        var prdName = "butterfly";
        if (window.Wing && window.Wing.config && typeof window.Wing.config.productName === 'string') {
            prdName =  window.Wing.config.productName;
        }
        var result = exec(0, "storage", ["removeWithCheck", prdName, key, oldValue]);
        if (result && result.success) {
            return result.success;
        } else {
            return false;
        }
    }

};

wing.addNavigator("storage", storage);

module.exports = storage;

});

// file: src/android/plugin/android/tooltip.js
define("wing/plugin/android/tooltip", function(require, exports, module) {

var exec = require('wing/exec'), wing = require('wing');

/**
 * {
 *  "确定":function(index){
 *
 *  }
 * }
 *
 */

var tooltip = function(title){

    exec(2, "tooltip", [title]);

};

wing.addNavigator("tooltip", tooltip);

module.exports = tooltip;

});

// file: src/android/plugin/android/ui.js
define("wing/plugin/android/ui", function(require, exports, module) {

var exec = require('wing/exec'), wing = require('wing');

/**
 *
 */

var ui = {

    callback : function(layoutId, fun, arg) {
        exec(2, "ui",["callback",layoutId,fun, arg]);
    }

};

wing.addNavigator("ui", ui);

module.exports = ui;

});

// file: src/common/urlutil.js
define("wing/urlutil", function(require, exports, module) {


/**
 * For already absolute URLs, returns what is passed in.
 * For relative URLs, converts them to absolute ones.
 */
exports.makeAbsolute = function makeAbsolute(url) {
    var anchorEl = document.createElement('a');
    anchorEl.href = url;
    return anchorEl.href;
};


});

// file: src/common/utils.js
define("wing/utils", function(require, exports, module) {

var utils = exports;

/**
 * Defines a property getter / setter for obj[key].
 */
utils.defineGetterSetter = function(obj, key, getFunc, opt_setFunc) {
    if (Object.defineProperty) {
        var desc = {
            get: getFunc,
            configurable: true
        };
        if (opt_setFunc) {
            desc.set = opt_setFunc;
        }
        Object.defineProperty(obj, key, desc);
    } else {
        obj.__defineGetter__(key, getFunc);
        if (opt_setFunc) {
            obj.__defineSetter__(key, opt_setFunc);
        }
    }
};

/**
 * Defines a property getter for obj[key].
 */
utils.defineGetter = utils.defineGetterSetter;

utils.arrayIndexOf = function(a, item) {
    if (a.indexOf) {
        return a.indexOf(item);
    }
    var len = a.length;
    for (var i = 0; i < len; ++i) {
        if (a[i] == item) {
            return i;
        }
    }
    return -1;
};

/**
 * Returns whether the item was found in the array.
 */
utils.arrayRemove = function(a, item) {
    var index = utils.arrayIndexOf(a, item);
    if (index != -1) {
        a.splice(index, 1);
    }
    return index != -1;
};

utils.typeName = function(val) {
    return Object.prototype.toString.call(val).slice(8, -1);
};

/**
 * Returns an indication of whether the argument is an array or not
 */
utils.isArray = function(a) {
    return utils.typeName(a) == 'Array';
};

/**
 * Returns an indication of whether the argument is a Date or not
 */
utils.isDate = function(d) {
    return utils.typeName(d) == 'Date';
};

/**
 * Does a deep clone of the object.
 */
utils.clone = function(obj) {
    if(!obj || typeof obj == 'function' || utils.isDate(obj) || typeof obj != 'object') {
        return obj;
    }

    var retVal, i;

    if(utils.isArray(obj)){
        retVal = [];
        for(i = 0; i < obj.length; ++i){
            retVal.push(utils.clone(obj[i]));
        }
        return retVal;
    }

    retVal = {};
    for(i in obj){
        if(!(i in retVal) || retVal[i] != obj[i]) {
            retVal[i] = utils.clone(obj[i]);
        }
    }
    return retVal;
};

/**
 * Returns a wrapped version of the function
 */
utils.close = function(context, func, params) {
    if (typeof params == 'undefined') {
        return function() {
            return func.apply(context, arguments);
        };
    } else {
        return function() {
            return func.apply(context, params);
        };
    }
};

/**
 * Create a UUID
 */
utils.createUUID = function() {
    return UUIDcreatePart(4) + '-' +
        UUIDcreatePart(2) + '-' +
        UUIDcreatePart(2) + '-' +
        UUIDcreatePart(2) + '-' +
        UUIDcreatePart(6);
};

/**
 * Extends a child object from a parent object using classical inheritance
 * pattern.
 */
utils.extend = (function() {
    // proxy used to establish prototype chain
    var F = function() {};
    // extend Child from Parent
    return function(Child, Parent) {
        F.prototype = Parent.prototype;
        Child.prototype = new F();
        Child.__super__ = Parent.prototype;
        Child.prototype.constructor = Child;
    };
}());

/**
 * Alerts a message in any available way: alert or console.log.
 */
utils.alert = function(msg) {
    if (window.alert) {
        window.alert(msg);
    } else if (console && console.log) {
        console.log(msg);
    }
};


//------------------------------------------------------------------------------
function UUIDcreatePart(length) {
    var uuidpart = "";
    for (var i=0; i<length; i++) {
        var uuidchar = parseInt((Math.random() * 256), 10).toString(16);
        if (uuidchar.length == 1) {
            uuidchar = "0" + uuidchar;
        }
        uuidpart += uuidchar;
    }
    return uuidpart;
}


});

window.Wing = require('wing');
// file: src/scripts/bootstrap.js



require('wing/init');

//${jsbridge}
})();