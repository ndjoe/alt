(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Alt = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var globalSymbolRegistryList = {};

// Aliases & Helpers
var make = Object.create;
var defProps = Object.defineProperties;
var defProp = Object.defineProperty;
var defValue = function (value) {
  var opts = arguments[1] === undefined ? {} : arguments[1];
  return {
    value: value,
    configurable: !!opts.c,
    writable: !!opts.w,
    enumerable: !!opts.e
  };
};
var isSymbol = function (symbol) {
  return symbol && symbol[xSymbol.toStringTag] === "Symbol";
};

var supportsAccessors = undefined;
try {
  var x = defProp({}, "y", { get: function () {
      return 1;
    } });
  supportsAccessors = x.y === 1;
} catch (e) {
  supportsAccessors = false;
}

var id = {};
var uid = function (desc) {
  desc = String(desc);
  var x = "";
  var i = 0;
  while (id[desc + x]) {
    x = i += 1;
  }
  id[desc + x] = 1;

  var tag = "Symbol(" + desc + "" + x + ")";

  /* istanbul ignore else */
  if (supportsAccessors) {
    // Make the symbols hidden to pre-es6 code
    defProp(Object.prototype, tag, {
      get: undefined,
      set: function (value) {
        defProp(this, tag, defValue(value, { c: true, w: true }));
      },
      configurable: true,
      enumerable: false
    });
  }

  return tag;
};

// The base symbol
var SymbolProto = make(null);

// 19.4.1.1
function xSymbol(descString) {
  if (this instanceof xSymbol) {
    throw new TypeError("Symbol is not a constructor");
  }

  descString = descString === undefined ? "" : String(descString);

  var tag = uid(descString);

  /* istanbul ignore next */
  if (!supportsAccessors) {
    return tag;
  }

  return make(SymbolProto, {
    __description__: defValue(descString),
    __tag__: defValue(tag)
  });
}

defProps(xSymbol, {
  // 19.4.2.1
  "for": defValue(function (key) {
    var stringKey = String(key);

    if (globalSymbolRegistryList[stringKey]) {
      return globalSymbolRegistryList[stringKey];
    }

    var symbol = xSymbol(stringKey);
    globalSymbolRegistryList[stringKey] = symbol;

    return symbol;
  }),

  // 19.4.2.5
  keyFor: defValue(function (sym) {
    if (!isSymbol(sym)) {
      throw new TypeError("" + sym + " is not a symbol");
    }

    for (var key in globalSymbolRegistryList) {
      if (globalSymbolRegistryList[key] === sym) {
        return globalSymbolRegistryList[key].__description__;
      }
    }
  })
});

// 6.1.5.1
defProps(xSymbol, {
  hasInstance: defValue(xSymbol("hasInstance")),
  isConcatSpreadable: defValue(xSymbol("isConcatSpreadable")),
  iterator: defValue(xSymbol("iterator")),
  match: defValue(xSymbol("match")),
  replace: defValue(xSymbol("replace")),
  search: defValue(xSymbol("search")),
  species: defValue(xSymbol("species")),
  split: defValue(xSymbol("split")),
  toPrimitive: defValue(xSymbol("toPrimitive")),
  toStringTag: defValue(xSymbol("toStringTag")),
  unscopables: defValue(xSymbol("unscopables"))
});

// 19.4.3
defProps(SymbolProto, {
  constructor: defValue(xSymbol),

  // 19.4.3.2
  toString: defValue(function () {
    return this.__tag__;
  }),

  // 19.4.3.3
  valueOf: defValue(function () {
    return "Symbol(" + this.__description__ + ")";
  })
});

// 19.4.3.5
/* istanbul ignore else */
if (supportsAccessors) {
  defProp(SymbolProto, xSymbol.toStringTag, defValue("Symbol", { c: true }));
}

module.exports = typeof Symbol === "function" ? Symbol : xSymbol;


},{}],2:[function(require,module,exports){
'use strict';

/**
 * Representation of a single EventEmitter function.
 *
 * @param {Function} fn Event handler to be called.
 * @param {Mixed} context Context for function execution.
 * @param {Boolean} once Only emit once
 * @api private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Minimal EventEmitter interface that is molded against the Node.js
 * EventEmitter interface.
 *
 * @constructor
 * @api public
 */
function EventEmitter() { /* Nothing to set */ }

/**
 * Holds the assigned EventEmitters by name.
 *
 * @type {Object}
 * @private
 */
EventEmitter.prototype._events = undefined;

/**
 * Return a list of assigned event listeners.
 *
 * @param {String} event The events that should be listed.
 * @returns {Array}
 * @api public
 */
EventEmitter.prototype.listeners = function listeners(event) {
  if (!this._events || !this._events[event]) return [];
  if (this._events[event].fn) return [this._events[event].fn];

  for (var i = 0, l = this._events[event].length, ee = new Array(l); i < l; i++) {
    ee[i] = this._events[event][i].fn;
  }

  return ee;
};

/**
 * Emit an event to all registered event listeners.
 *
 * @param {String} event The name of the event.
 * @returns {Boolean} Indication if we've emitted an event.
 * @api public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  if (!this._events || !this._events[event]) return false;

  var listeners = this._events[event]
    , len = arguments.length
    , args
    , i;

  if ('function' === typeof listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Register a new EventListener for the given event.
 *
 * @param {String} event Name of the event.
 * @param {Functon} fn Callback function.
 * @param {Mixed} context The context of the function.
 * @api public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  var listener = new EE(fn, context || this);

  if (!this._events) this._events = {};
  if (!this._events[event]) this._events[event] = listener;
  else {
    if (!this._events[event].fn) this._events[event].push(listener);
    else this._events[event] = [
      this._events[event], listener
    ];
  }

  return this;
};

/**
 * Add an EventListener that's only called once.
 *
 * @param {String} event Name of the event.
 * @param {Function} fn Callback function.
 * @param {Mixed} context The context of the function.
 * @api public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  var listener = new EE(fn, context || this, true);

  if (!this._events) this._events = {};
  if (!this._events[event]) this._events[event] = listener;
  else {
    if (!this._events[event].fn) this._events[event].push(listener);
    else this._events[event] = [
      this._events[event], listener
    ];
  }

  return this;
};

/**
 * Remove event listeners.
 *
 * @param {String} event The event we want to remove.
 * @param {Function} fn The listener that we need to find.
 * @param {Boolean} once Only remove once listeners.
 * @api public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, once) {
  if (!this._events || !this._events[event]) return this;

  var listeners = this._events[event]
    , events = [];

  if (fn) {
    if (listeners.fn && (listeners.fn !== fn || (once && !listeners.once))) {
      events.push(listeners);
    }
    if (!listeners.fn) for (var i = 0, length = listeners.length; i < length; i++) {
      if (listeners[i].fn !== fn || (once && !listeners[i].once)) {
        events.push(listeners[i]);
      }
    }
  }

  //
  // Reset the array, or remove it completely if we have no more listeners.
  //
  if (events.length) {
    this._events[event] = events.length === 1 ? events[0] : events;
  } else {
    delete this._events[event];
  }

  return this;
};

/**
 * Remove all listeners or only the listeners for the specified event.
 *
 * @param {String} event The event want to remove all listeners for.
 * @api public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  if (!this._events) return this;

  if (event) delete this._events[event];
  else this._events = {};

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// This function doesn't apply anymore.
//
EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
  return this;
};

//
// Expose the module.
//
EventEmitter.EventEmitter = EventEmitter;
EventEmitter.EventEmitter2 = EventEmitter;
EventEmitter.EventEmitter3 = EventEmitter;

//
// Expose the module.
//
module.exports = EventEmitter;

},{}],3:[function(require,module,exports){
/**
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

module.exports.Dispatcher = require('./lib/Dispatcher')

},{"./lib/Dispatcher":4}],4:[function(require,module,exports){
/*
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Dispatcher
 * @typechecks
 */

"use strict";

var invariant = require('./invariant');

var _lastID = 1;
var _prefix = 'ID_';

/**
 * Dispatcher is used to broadcast payloads to registered callbacks. This is
 * different from generic pub-sub systems in two ways:
 *
 *   1) Callbacks are not subscribed to particular events. Every payload is
 *      dispatched to every registered callback.
 *   2) Callbacks can be deferred in whole or part until other callbacks have
 *      been executed.
 *
 * For example, consider this hypothetical flight destination form, which
 * selects a default city when a country is selected:
 *
 *   var flightDispatcher = new Dispatcher();
 *
 *   // Keeps track of which country is selected
 *   var CountryStore = {country: null};
 *
 *   // Keeps track of which city is selected
 *   var CityStore = {city: null};
 *
 *   // Keeps track of the base flight price of the selected city
 *   var FlightPriceStore = {price: null}
 *
 * When a user changes the selected city, we dispatch the payload:
 *
 *   flightDispatcher.dispatch({
 *     actionType: 'city-update',
 *     selectedCity: 'paris'
 *   });
 *
 * This payload is digested by `CityStore`:
 *
 *   flightDispatcher.register(function(payload) {
 *     if (payload.actionType === 'city-update') {
 *       CityStore.city = payload.selectedCity;
 *     }
 *   });
 *
 * When the user selects a country, we dispatch the payload:
 *
 *   flightDispatcher.dispatch({
 *     actionType: 'country-update',
 *     selectedCountry: 'australia'
 *   });
 *
 * This payload is digested by both stores:
 *
 *    CountryStore.dispatchToken = flightDispatcher.register(function(payload) {
 *     if (payload.actionType === 'country-update') {
 *       CountryStore.country = payload.selectedCountry;
 *     }
 *   });
 *
 * When the callback to update `CountryStore` is registered, we save a reference
 * to the returned token. Using this token with `waitFor()`, we can guarantee
 * that `CountryStore` is updated before the callback that updates `CityStore`
 * needs to query its data.
 *
 *   CityStore.dispatchToken = flightDispatcher.register(function(payload) {
 *     if (payload.actionType === 'country-update') {
 *       // `CountryStore.country` may not be updated.
 *       flightDispatcher.waitFor([CountryStore.dispatchToken]);
 *       // `CountryStore.country` is now guaranteed to be updated.
 *
 *       // Select the default city for the new country
 *       CityStore.city = getDefaultCityForCountry(CountryStore.country);
 *     }
 *   });
 *
 * The usage of `waitFor()` can be chained, for example:
 *
 *   FlightPriceStore.dispatchToken =
 *     flightDispatcher.register(function(payload) {
 *       switch (payload.actionType) {
 *         case 'country-update':
 *           flightDispatcher.waitFor([CityStore.dispatchToken]);
 *           FlightPriceStore.price =
 *             getFlightPriceStore(CountryStore.country, CityStore.city);
 *           break;
 *
 *         case 'city-update':
 *           FlightPriceStore.price =
 *             FlightPriceStore(CountryStore.country, CityStore.city);
 *           break;
 *     }
 *   });
 *
 * The `country-update` payload will be guaranteed to invoke the stores'
 * registered callbacks in order: `CountryStore`, `CityStore`, then
 * `FlightPriceStore`.
 */

  function Dispatcher() {
    this.$Dispatcher_callbacks = {};
    this.$Dispatcher_isPending = {};
    this.$Dispatcher_isHandled = {};
    this.$Dispatcher_isDispatching = false;
    this.$Dispatcher_pendingPayload = null;
  }

  /**
   * Registers a callback to be invoked with every dispatched payload. Returns
   * a token that can be used with `waitFor()`.
   *
   * @param {function} callback
   * @return {string}
   */
  Dispatcher.prototype.register=function(callback) {
    var id = _prefix + _lastID++;
    this.$Dispatcher_callbacks[id] = callback;
    return id;
  };

  /**
   * Removes a callback based on its token.
   *
   * @param {string} id
   */
  Dispatcher.prototype.unregister=function(id) {
    invariant(
      this.$Dispatcher_callbacks[id],
      'Dispatcher.unregister(...): `%s` does not map to a registered callback.',
      id
    );
    delete this.$Dispatcher_callbacks[id];
  };

  /**
   * Waits for the callbacks specified to be invoked before continuing execution
   * of the current callback. This method should only be used by a callback in
   * response to a dispatched payload.
   *
   * @param {array<string>} ids
   */
  Dispatcher.prototype.waitFor=function(ids) {
    invariant(
      this.$Dispatcher_isDispatching,
      'Dispatcher.waitFor(...): Must be invoked while dispatching.'
    );
    for (var ii = 0; ii < ids.length; ii++) {
      var id = ids[ii];
      if (this.$Dispatcher_isPending[id]) {
        invariant(
          this.$Dispatcher_isHandled[id],
          'Dispatcher.waitFor(...): Circular dependency detected while ' +
          'waiting for `%s`.',
          id
        );
        continue;
      }
      invariant(
        this.$Dispatcher_callbacks[id],
        'Dispatcher.waitFor(...): `%s` does not map to a registered callback.',
        id
      );
      this.$Dispatcher_invokeCallback(id);
    }
  };

  /**
   * Dispatches a payload to all registered callbacks.
   *
   * @param {object} payload
   */
  Dispatcher.prototype.dispatch=function(payload) {
    invariant(
      !this.$Dispatcher_isDispatching,
      'Dispatch.dispatch(...): Cannot dispatch in the middle of a dispatch.'
    );
    this.$Dispatcher_startDispatching(payload);
    try {
      for (var id in this.$Dispatcher_callbacks) {
        if (this.$Dispatcher_isPending[id]) {
          continue;
        }
        this.$Dispatcher_invokeCallback(id);
      }
    } finally {
      this.$Dispatcher_stopDispatching();
    }
  };

  /**
   * Is this Dispatcher currently dispatching.
   *
   * @return {boolean}
   */
  Dispatcher.prototype.isDispatching=function() {
    return this.$Dispatcher_isDispatching;
  };

  /**
   * Call the callback stored with the given id. Also do some internal
   * bookkeeping.
   *
   * @param {string} id
   * @internal
   */
  Dispatcher.prototype.$Dispatcher_invokeCallback=function(id) {
    this.$Dispatcher_isPending[id] = true;
    this.$Dispatcher_callbacks[id](this.$Dispatcher_pendingPayload);
    this.$Dispatcher_isHandled[id] = true;
  };

  /**
   * Set up bookkeeping needed when dispatching.
   *
   * @param {object} payload
   * @internal
   */
  Dispatcher.prototype.$Dispatcher_startDispatching=function(payload) {
    for (var id in this.$Dispatcher_callbacks) {
      this.$Dispatcher_isPending[id] = false;
      this.$Dispatcher_isHandled[id] = false;
    }
    this.$Dispatcher_pendingPayload = payload;
    this.$Dispatcher_isDispatching = true;
  };

  /**
   * Clear bookkeeping used for dispatching.
   *
   * @internal
   */
  Dispatcher.prototype.$Dispatcher_stopDispatching=function() {
    this.$Dispatcher_pendingPayload = null;
    this.$Dispatcher_isDispatching = false;
  };


module.exports = Dispatcher;

},{"./invariant":5}],5:[function(require,module,exports){
/**
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule invariant
 */

"use strict";

/**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf-style format (only %s is supported) and arguments
 * to provide information about what broke and what you were
 * expecting.
 *
 * The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 */

var invariant = function(condition, format, a, b, c, d, e, f) {
  if (false) {
    if (format === undefined) {
      throw new Error('invariant requires an error message argument');
    }
  }

  if (!condition) {
    var error;
    if (format === undefined) {
      error = new Error(
        'Minified exception occurred; use the non-minified dev environment ' +
        'for the full error message and additional helpful warnings.'
      );
    } else {
      var args = [a, b, c, d, e, f];
      var argIndex = 0;
      error = new Error(
        'Invariant Violation: ' +
        format.replace(/%s/g, function() { return args[argIndex++]; })
      );
    }

    error.framesToPop = 1; // we don't care about invariant's own frame
    throw error;
  }
};

module.exports = invariant;

},{}],6:[function(require,module,exports){
'use strict';

function ToObject(val) {
	if (val == null) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

module.exports = Object.assign || function (target, source) {
	var from;
	var keys;
	var to = ToObject(target);

	for (var s = 1; s < arguments.length; s++) {
		from = arguments[s];
		keys = Object.keys(Object(from));

		for (var i = 0; i < keys.length; i++) {
			to[keys[i]] = from[keys[i]];
		}
	}

	return to;
};

},{}],7:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var _symbolsSymbols = require("./symbols/symbols");

var ACTION_HANDLER = _symbolsSymbols.ACTION_HANDLER;
var ACTION_UID = _symbolsSymbols.ACTION_UID;

var AltAction = (function () {
  function AltAction(alt, name, action, actions) {
    _classCallCheck(this, AltAction);

    this[ACTION_UID] = name;
    this[ACTION_HANDLER] = action.bind(this);
    this.actions = actions;
    this.alt = alt;
  }

  _createClass(AltAction, {
    dispatch: {
      value: function dispatch(data) {
        this.alt.dispatch(this[ACTION_UID], data);
      }
    }
  });

  return AltAction;
})();

module.exports = AltAction;

},{"./symbols/symbols":9}],8:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var EventEmitter = _interopRequire(require("eventemitter3"));

var assign = _interopRequire(require("object-assign"));

var Symbol = _interopRequire(require("es-symbol"));

var _utilsWarnings = require("./utils/warnings");

var warn = _utilsWarnings.warn;
var deprecatedBeforeAfterEachWarning = _utilsWarnings.deprecatedBeforeAfterEachWarning;

var _symbolsSymbols = require("./symbols/symbols");

var ALL_LISTENERS = _symbolsSymbols.ALL_LISTENERS;
var LIFECYCLE = _symbolsSymbols.LIFECYCLE;
var LISTENERS = _symbolsSymbols.LISTENERS;
var PUBLIC_METHODS = _symbolsSymbols.PUBLIC_METHODS;
var STATE_CHANGED = _symbolsSymbols.STATE_CHANGED;
var STATE_CONTAINER = _symbolsSymbols.STATE_CONTAINER;

// alt container
var ALT = Symbol();
// event emitter instance
var EE = Symbol();

var AltStore = (function () {
  function AltStore(alt, model, state, StoreModel) {
    var _this = this;

    _classCallCheck(this, AltStore);

    this[ALT] = alt;
    this[EE] = new EventEmitter();
    this[LIFECYCLE] = {};
    this[STATE_CHANGED] = false;
    this[STATE_CONTAINER] = state || model;

    this.boundListeners = model[ALL_LISTENERS];
    this.StoreModel = StoreModel;
    if (typeof this.StoreModel === "object") {
      this.StoreModel.state = assign({}, StoreModel.state);
    }

    assign(this[LIFECYCLE], model[LIFECYCLE]);
    assign(this, model[PUBLIC_METHODS]);

    // Register dispatcher
    this.dispatchToken = alt.dispatcher.register(function (payload) {
      if (model[LIFECYCLE].beforeEach) {
        model[LIFECYCLE].beforeEach(payload.action.toString(), payload.data, _this[STATE_CONTAINER]);
      } else if (typeof model.beforeEach === "function") {
        deprecatedBeforeAfterEachWarning();
        model.beforeEach(payload.action.toString(), payload.data, _this[STATE_CONTAINER]);
      }

      if (model[LISTENERS][payload.action]) {
        var result = false;

        try {
          result = model[LISTENERS][payload.action](payload.data);
        } catch (e) {
          if (_this[LIFECYCLE].error) {
            _this[LIFECYCLE].error(e, payload.action.toString(), payload.data, _this[STATE_CONTAINER]);
          } else {
            throw e;
          }
        }

        if (result !== false || _this[STATE_CHANGED]) {
          _this.emitChange();
        }

        _this[STATE_CHANGED] = false;
      }

      if (model[LIFECYCLE].afterEach) {
        model[LIFECYCLE].afterEach(payload.action.toString(), payload.data, _this[STATE_CONTAINER]);
      } else if (typeof model.afterEach === "function") {
        deprecatedBeforeAfterEachWarning();
        model.afterEach(payload.action.toString(), payload.data, _this[STATE_CONTAINER]);
      }
    });

    if (this[LIFECYCLE].init) {
      this[LIFECYCLE].init();
    }
  }

  _createClass(AltStore, {
    getEventEmitter: {
      value: function getEventEmitter() {
        return this[EE];
      }
    },
    emitChange: {
      value: function emitChange() {
        this[EE].emit("change", this[STATE_CONTAINER]);
      }
    },
    listen: {
      value: function listen(cb) {
        var _this = this;

        this[EE].on("change", cb);
        return function () {
          return _this.unlisten(cb);
        };
      }
    },
    unlisten: {
      value: function unlisten(cb) {
        if (this[LIFECYCLE].unlisten) {
          this[LIFECYCLE].unlisten();
        }
        this[EE].removeListener("change", cb);
      }
    },
    getState: {
      value: function getState() {
        return this[ALT].getState(this[STATE_CONTAINER]);
      }
    }
  });

  return AltStore;
})();

module.exports = AltStore;

},{"./symbols/symbols":9,"./utils/warnings":16,"es-symbol":1,"eventemitter3":2,"object-assign":6}],9:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});

var Symbol = _interopRequire(require("es-symbol"));

// action creator handler
var ACTION_HANDLER = Symbol();

exports.ACTION_HANDLER = ACTION_HANDLER;
// the action's uid symbol for listening
var ACTION_KEY = Symbol();

exports.ACTION_KEY = ACTION_KEY;
// the action's name
var ACTION_UID = Symbol();

exports.ACTION_UID = ACTION_UID;
// store all of a store's listeners
var ALL_LISTENERS = Symbol();

exports.ALL_LISTENERS = ALL_LISTENERS;
// initial snapshot
var INIT_SNAPSHOT = Symbol();

exports.INIT_SNAPSHOT = INIT_SNAPSHOT;
// last snapshot
var LAST_SNAPSHOT = Symbol();

exports.LAST_SNAPSHOT = LAST_SNAPSHOT;
// all lifecycle listeners
var LIFECYCLE = Symbol();

exports.LIFECYCLE = LIFECYCLE;
// store action listeners
var LISTENERS = Symbol();

exports.LISTENERS = LISTENERS;
// public methods
var PUBLIC_METHODS = Symbol();

exports.PUBLIC_METHODS = PUBLIC_METHODS;
// boolean if state has changed for emitting change event
var STATE_CHANGED = Symbol();

exports.STATE_CHANGED = STATE_CHANGED;
// contains all state
var STATE_CONTAINER = Symbol();
exports.STATE_CONTAINER = STATE_CONTAINER;

},{"es-symbol":1}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _symbolsSymbols = require("../symbols/symbols");

var ACTION_KEY = _symbolsSymbols.ACTION_KEY;
var ALL_LISTENERS = _symbolsSymbols.ALL_LISTENERS;
var LIFECYCLE = _symbolsSymbols.LIFECYCLE;
var LISTENERS = _symbolsSymbols.LISTENERS;
var PUBLIC_METHODS = _symbolsSymbols.PUBLIC_METHODS;
var StoreMixinEssentials = {
  waitFor: function waitFor(sources) {
    if (!sources) {
      throw new ReferenceError("Dispatch tokens not provided");
    }

    if (arguments.length === 1) {
      sources = Array.isArray(sources) ? sources : [sources];
    } else {
      sources = Array.prototype.slice.call(arguments);
    }

    var tokens = sources.map(function (source) {
      return source.dispatchToken || source;
    });

    this.dispatcher.waitFor(tokens);
  },

  exportPublicMethods: function exportPublicMethods(methods) {
    var _this = this;

    Object.keys(methods).forEach(function (methodName) {
      if (typeof methods[methodName] !== "function") {
        throw new TypeError("exportPublicMethods expects a function");
      }

      _this[PUBLIC_METHODS][methodName] = methods[methodName];
    });
  },

  emitChange: function emitChange() {
    this.getInstance().emitChange();
  }
};

exports.StoreMixinEssentials = StoreMixinEssentials;
var StoreMixinListeners = {
  on: function on(lifecycleEvent, handler) {
    this[LIFECYCLE][lifecycleEvent] = handler.bind(this);
  },

  bindAction: function bindAction(symbol, handler) {
    if (!symbol) {
      throw new ReferenceError("Invalid action reference passed in");
    }
    if (typeof handler !== "function") {
      throw new TypeError("bindAction expects a function");
    }

    if (handler.length > 1) {
      throw new TypeError("Action handler in store " + this._storeName + " for " + ("" + (symbol[ACTION_KEY] || symbol).toString() + " was defined with 2 ") + "parameters. Only a single parameter is passed through the " + "dispatcher, did you mean to pass in an Object instead?");
    }

    // You can pass in the constant or the function itself
    var key = symbol[ACTION_KEY] ? symbol[ACTION_KEY] : symbol;
    this[LISTENERS][key] = handler.bind(this);
    this[ALL_LISTENERS].push(Symbol.keyFor(key));
  },

  bindActions: function bindActions(actions) {
    var _this = this;

    Object.keys(actions).forEach(function (action) {
      var symbol = actions[action];
      var matchFirstCharacter = /./;
      var assumedEventHandler = action.replace(matchFirstCharacter, function (x) {
        return "on" + x[0].toUpperCase();
      });
      var handler = null;

      if (_this[action] && _this[assumedEventHandler]) {
        // If you have both action and onAction
        throw new ReferenceError("You have multiple action handlers bound to an action: " + ("" + action + " and " + assumedEventHandler));
      } else if (_this[action]) {
        // action
        handler = _this[action];
      } else if (_this[assumedEventHandler]) {
        // onAction
        handler = _this[assumedEventHandler];
      }

      if (handler) {
        _this.bindAction(symbol, handler);
      }
    });
  },

  bindListeners: function bindListeners(obj) {
    var _this = this;

    Object.keys(obj).forEach(function (methodName) {
      var symbol = obj[methodName];
      var listener = _this[methodName];

      if (!listener) {
        throw new ReferenceError("" + methodName + " defined but does not exist in " + _this._storeName);
      }

      if (Array.isArray(symbol)) {
        symbol.forEach(function (action) {
          _this.bindAction(action, listener);
        });
      } else {
        _this.bindAction(symbol, listener);
      }
    });
  }

};
exports.StoreMixinListeners = StoreMixinListeners;

},{"../symbols/symbols":9}],11:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _applyConstructor = function (Constructor, args) { var instance = Object.create(Constructor.prototype); var result = Constructor.apply(instance, args); return result != null && (typeof result == "object" || typeof result == "function") ? result : instance; };

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

exports.createStoreFromObject = createStoreFromObject;
exports.createStoreFromClass = createStoreFromClass;
Object.defineProperty(exports, "__esModule", {
  value: true
});

var assign = _interopRequire(require("object-assign"));

var AltStore = _interopRequire(require("../AltStore"));

var _StoreMixins = require("./StoreMixins");

var StoreMixinListeners = _StoreMixins.StoreMixinListeners;
var StoreMixinEssentials = _StoreMixins.StoreMixinEssentials;

var getInternalMethods = _interopRequire(require("./getInternalMethods"));

var _symbolsSymbols = require("../symbols/symbols");

var ALL_LISTENERS = _symbolsSymbols.ALL_LISTENERS;
var LIFECYCLE = _symbolsSymbols.LIFECYCLE;
var LISTENERS = _symbolsSymbols.LISTENERS;
var PUBLIC_METHODS = _symbolsSymbols.PUBLIC_METHODS;
var STATE_CHANGED = _symbolsSymbols.STATE_CHANGED;
var STATE_CONTAINER = _symbolsSymbols.STATE_CONTAINER;

function doSetState(store, storeInstance, state) {
  if (!state) {
    return;
  }

  if (!store.alt.dispatcher.isDispatching()) {
    throw new Error("You can only use setState while dispatching");
  }

  var nextState = typeof state === "function" ? state(storeInstance[STATE_CONTAINER]) : state;

  storeInstance[STATE_CONTAINER] = store.alt.setState(storeInstance[STATE_CONTAINER], nextState);
  storeInstance[STATE_CHANGED] = true;
}

function createStoreFromObject(alt, StoreModel, key) {
  var storeInstance = undefined;

  var StoreProto = {};
  StoreProto[ALL_LISTENERS] = [];
  StoreProto[LIFECYCLE] = {};
  StoreProto[LISTENERS] = {};

  assign(StoreProto, {
    _storeName: key,
    alt: alt,
    dispatcher: alt.dispatcher,
    getInstance: function getInstance() {
      return storeInstance;
    },
    setState: function setState(nextState) {
      doSetState(this, storeInstance, nextState);
    }
  }, StoreMixinListeners, StoreMixinEssentials, StoreModel);

  // bind the store listeners
  /* istanbul ignore else */
  if (StoreProto.bindListeners) {
    StoreMixinListeners.bindListeners.call(StoreProto, StoreProto.bindListeners);
  }

  // bind the lifecycle events
  /* istanbul ignore else */
  if (StoreProto.lifecycle) {
    Object.keys(StoreProto.lifecycle).forEach(function (event) {
      StoreMixinListeners.on.call(StoreProto, event, StoreProto.lifecycle[event]);
    });
  }

  // create the instance and assign the public methods to the instance
  storeInstance = assign(new AltStore(alt, StoreProto, StoreProto.state, StoreModel), StoreProto.publicMethods);

  return storeInstance;
}

function createStoreFromClass(alt, StoreModel, key) {
  for (var _len = arguments.length, argsForClass = Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
    argsForClass[_key - 3] = arguments[_key];
  }

  var storeInstance = undefined;

  // Creating a class here so we don't overload the provided store's
  // prototype with the mixin behaviour and I'm extending from StoreModel
  // so we can inherit any extensions from the provided store.

  var Store = (function (_StoreModel) {
    function Store() {
      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      _classCallCheck(this, Store);

      _get(Object.getPrototypeOf(Store.prototype), "constructor", this).apply(this, args);
    }

    _inherits(Store, _StoreModel);

    return Store;
  })(StoreModel);

  assign(Store.prototype, StoreMixinListeners, StoreMixinEssentials, {
    _storeName: key,
    alt: alt,
    dispatcher: alt.dispatcher,
    getInstance: function getInstance() {
      return storeInstance;
    },
    setState: function setState(nextState) {
      doSetState(this, storeInstance, nextState);
    }
  });

  Store.prototype[ALL_LISTENERS] = [];
  Store.prototype[LIFECYCLE] = {};
  Store.prototype[LISTENERS] = {};
  Store.prototype[PUBLIC_METHODS] = {};

  var store = _applyConstructor(Store, argsForClass);

  storeInstance = assign(new AltStore(alt, store, typeof alt._stateKey === "string" ? store[alt._stateKey] : null, StoreModel), getInternalMethods(StoreModel));

  return storeInstance;
}

},{"../AltStore":8,"../symbols/symbols":9,"./StoreMixins":10,"./getInternalMethods":13,"object-assign":6}],12:[function(require,module,exports){
"use strict";

module.exports = formatAsConstant;

function formatAsConstant(name) {
  return name.replace(/[a-z]([A-Z])/g, function (i) {
    return "" + i[0] + "_" + i[1].toLowerCase();
  }).toUpperCase();
}

},{}],13:[function(require,module,exports){
"use strict";

module.exports = getInternalMethods;
/* istanbul ignore next */
function NoopClass() {}

var builtIns = Object.getOwnPropertyNames(NoopClass);
var builtInProto = Object.getOwnPropertyNames(NoopClass.prototype);

function getInternalMethods(obj, isProto) {
  var excluded = isProto ? builtInProto : builtIns;
  return Object.getOwnPropertyNames(obj).reduce(function (value, m) {
    if (excluded.indexOf(m) !== -1) {
      return value;
    }

    value[m] = obj[m];
    return value;
  }, {});
}

},{}],14:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

exports.setAppState = setAppState;
exports.snapshot = snapshot;
exports.saveInitialSnapshot = saveInitialSnapshot;
exports.filterSnapshots = filterSnapshots;
Object.defineProperty(exports, "__esModule", {
  value: true
});

var assign = _interopRequire(require("object-assign"));

var _symbolsSymbols = require("../symbols/symbols");

var INIT_SNAPSHOT = _symbolsSymbols.INIT_SNAPSHOT;
var LAST_SNAPSHOT = _symbolsSymbols.LAST_SNAPSHOT;
var LIFECYCLE = _symbolsSymbols.LIFECYCLE;
var STATE_CONTAINER = _symbolsSymbols.STATE_CONTAINER;

function setAppState(instance, data, onStore) {
  var obj = instance.deserialize(data);
  Object.keys(obj).forEach(function (key) {
    var store = instance.stores[key];
    if (store) {
      if (store[LIFECYCLE].deserialize) {
        obj[key] = store[LIFECYCLE].deserialize(obj[key]) || obj[key];
      }
      assign(store[STATE_CONTAINER], obj[key]);
      onStore(store);
    }
  });
}

function snapshot(instance) {
  for (var _len = arguments.length, storeNames = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    storeNames[_key - 1] = arguments[_key];
  }

  var stores = storeNames.length ? storeNames : Object.keys(instance.stores);
  return stores.reduce(function (obj, key) {
    var store = instance.stores[key];
    if (store[LIFECYCLE].snapshot) {
      store[LIFECYCLE].snapshot();
    }
    var customSnapshot = store[LIFECYCLE].serialize && store[LIFECYCLE].serialize();
    obj[key] = customSnapshot ? customSnapshot : store.getState();
    return obj;
  }, {});
}

function saveInitialSnapshot(instance, key) {
  var state = instance.stores[key][STATE_CONTAINER];
  var initial = instance.deserialize(instance[INIT_SNAPSHOT]);
  initial[key] = state;
  instance[INIT_SNAPSHOT] = instance.serialize(initial);
  instance[LAST_SNAPSHOT] = instance[INIT_SNAPSHOT];
}

function filterSnapshots(instance, serializedSnapshot, storeNames) {
  var stores = instance.deserialize(serializedSnapshot);
  var storesToReset = storeNames.reduce(function (obj, name) {
    if (!stores[name]) {
      throw new ReferenceError("" + name + " is not a valid store");
    }
    obj[name] = stores[name];
    return obj;
  }, {});
  return instance.serialize(storesToReset);
}

},{"../symbols/symbols":9,"object-assign":6}],15:[function(require,module,exports){
"use strict";

module.exports = uid;

function uid(container, name) {
  var count = 0;
  var key = name;
  while (Object.hasOwnProperty.call(container, key)) {
    key = name + String(++count);
  }
  return key;
}

},{}],16:[function(require,module,exports){
"use strict";

exports.warn = warn;
exports.deprecatedBeforeAfterEachWarning = deprecatedBeforeAfterEachWarning;
Object.defineProperty(exports, "__esModule", {
  value: true
});

function warn(msg) {
  /* istanbul ignore else */
  if (typeof console !== "undefined") {
    console.warn(new ReferenceError(msg));
  }
}

function deprecatedBeforeAfterEachWarning() {
  warn("beforeEach/afterEach functions on the store are deprecated " + "use beforeEach/afterEach as a lifecycle method instead");
}

},{}],17:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _applyConstructor = function (Constructor, args) { var instance = Object.create(Constructor.prototype); var result = Constructor.apply(instance, args); return result != null && (typeof result == "object" || typeof result == "function") ? result : instance; };

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var AltAction = _interopRequire(require("./AltAction"));

var Symbol = _interopRequire(require("es-symbol"));

var assign = _interopRequire(require("object-assign"));

var formatAsConstant = _interopRequire(require("./utils/formatAsConstant"));

var getInternalMethods = _interopRequire(require("./utils/getInternalMethods"));

var uid = _interopRequire(require("./utils/uid"));

var Dispatcher = require("flux").Dispatcher;

var warn = require("./utils/warnings").warn;

var _utilsCreateStore = require("./utils/createStore");

var createStoreFromObject = _utilsCreateStore.createStoreFromObject;
var createStoreFromClass = _utilsCreateStore.createStoreFromClass;

var _symbolsSymbols = require("./symbols/symbols");

var ACTION_HANDLER = _symbolsSymbols.ACTION_HANDLER;
var ACTION_KEY = _symbolsSymbols.ACTION_KEY;
var INIT_SNAPSHOT = _symbolsSymbols.INIT_SNAPSHOT;
var LAST_SNAPSHOT = _symbolsSymbols.LAST_SNAPSHOT;
var LIFECYCLE = _symbolsSymbols.LIFECYCLE;

var _utilsStateFunctions = require("./utils/stateFunctions");

var filterSnapshots = _utilsStateFunctions.filterSnapshots;
var saveInitialSnapshot = _utilsStateFunctions.saveInitialSnapshot;
var setAppState = _utilsStateFunctions.setAppState;
var snapshot = _utilsStateFunctions.snapshot;

var GlobalActionsNameRegistry = {};

var Alt = (function () {
  function Alt() {
    var config = arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Alt);

    this.serialize = config.serialize || JSON.stringify;
    this.deserialize = config.deserialize || JSON.parse;
    this.setState = config.setState || assign;
    this.getState = config.getState || function (state) {
      return Object.keys(state).reduce(function (obj, key) {
        obj[key] = state[key];
        return obj;
      }, {});
    };
    this.dispatcher = config.dispatcher || new Dispatcher();
    this.actions = {};
    this.stores = {};
    this._stateKey = config.stateKey;
    this[LAST_SNAPSHOT] = this[INIT_SNAPSHOT] = "{}";
  }

  _createClass(Alt, {
    dispatch: {
      value: function dispatch(action, data) {
        this.dispatcher.dispatch({ action: action, data: data });
      }
    },
    createUnsavedStore: {
      value: function createUnsavedStore(StoreModel) {
        for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          args[_key - 1] = arguments[_key];
        }

        var key = StoreModel.displayName || "";
        return typeof StoreModel === "object" ? createStoreFromObject(this, StoreModel, key) : createStoreFromClass.apply(undefined, [this, StoreModel, key].concat(args));
      }
    },
    createStore: {
      value: function createStore(StoreModel, iden) {
        for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
          args[_key - 2] = arguments[_key];
        }

        var key = iden || StoreModel.name || StoreModel.displayName || "";

        if (this.stores[key] || !key) {
          if (this.stores[key]) {
            warn("A store named " + key + " already exists, double check your store " + "names or pass in your own custom identifier for each store");
          } else {
            warn("Store name was not specified");
          }

          key = uid(this.stores, key);
        }

        var storeInstance = typeof StoreModel === "object" ? createStoreFromObject(this, StoreModel, key) : createStoreFromClass.apply(undefined, [this, StoreModel, key].concat(args));

        this.stores[key] = storeInstance;
        saveInitialSnapshot(this, key);

        return storeInstance;
      }
    },
    generateActions: {
      value: function generateActions() {
        for (var _len = arguments.length, actionNames = Array(_len), _key = 0; _key < _len; _key++) {
          actionNames[_key] = arguments[_key];
        }

        return this.createActions(function () {
          this.generateActions.apply(this, actionNames);
        });
      }
    },
    createAction: {
      value: function createAction(name, implementation, obj) {
        var actionId = uid(GlobalActionsNameRegistry, name);
        GlobalActionsNameRegistry[actionId] = 1;
        var actionName = Symbol["for"](actionId);

        // Wrap the action so we can provide a dispatch method
        var newAction = new AltAction(this, actionName, implementation, obj);

        var action = newAction[ACTION_HANDLER];
        action.defer = function () {
          for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }

          setTimeout(function () {
            newAction[ACTION_HANDLER].apply(null, args);
          });
        };
        action[ACTION_KEY] = actionName;
        return action;
      }
    },
    createActions: {
      value: function createActions(ActionsClass) {
        var _this = this;

        for (var _len = arguments.length, argsForConstructor = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
          argsForConstructor[_key - 2] = arguments[_key];
        }

        var exportObj = arguments[1] === undefined ? {} : arguments[1];

        var actions = {};
        var key = ActionsClass.name || ActionsClass.displayName || "";

        if (typeof ActionsClass === "function") {
          (function () {
            assign(actions, getInternalMethods(ActionsClass.prototype, true));

            var ActionsGenerator = (function (_ActionsClass) {
              function ActionsGenerator() {
                for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                  args[_key2] = arguments[_key2];
                }

                _classCallCheck(this, ActionsGenerator);

                _get(Object.getPrototypeOf(ActionsGenerator.prototype), "constructor", this).apply(this, args);
              }

              _inherits(ActionsGenerator, _ActionsClass);

              _createClass(ActionsGenerator, {
                generateActions: {
                  value: function generateActions() {
                    for (var _len2 = arguments.length, actionNames = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                      actionNames[_key2] = arguments[_key2];
                    }

                    actionNames.forEach(function (actionName) {
                      // This is a function so we can later bind this to AltAction
                      actions[actionName] = function (x) {
                        for (var _len3 = arguments.length, a = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
                          a[_key3 - 1] = arguments[_key3];
                        }

                        this.dispatch(a.length ? [x].concat(a) : x);
                      };
                    });
                  }
                }
              });

              return ActionsGenerator;
            })(ActionsClass);

            assign(actions, _applyConstructor(ActionsGenerator, argsForConstructor));
          })();
        } else {
          assign(actions, ActionsClass);
        }

        return Object.keys(actions).reduce(function (obj, action) {
          obj[action] = _this.createAction("" + key + "#" + action, actions[action], obj);
          var constant = formatAsConstant(action);
          obj[constant] = obj[action][ACTION_KEY];
          return obj;
        }, exportObj);
      }
    },
    takeSnapshot: {
      value: function takeSnapshot() {
        for (var _len = arguments.length, storeNames = Array(_len), _key = 0; _key < _len; _key++) {
          storeNames[_key] = arguments[_key];
        }

        var state = snapshot.apply(undefined, [this].concat(storeNames));
        this[LAST_SNAPSHOT] = this.serialize(assign(this.deserialize(this[LAST_SNAPSHOT]), state));
        return this.serialize(state);
      }
    },
    rollback: {
      value: function rollback() {
        setAppState(this, this[LAST_SNAPSHOT], function (store) {
          if (store[LIFECYCLE].rollback) {
            store[LIFECYCLE].rollback();
          }
          store.emitChange();
        });
      }
    },
    recycle: {
      value: function recycle() {
        for (var _len = arguments.length, storeNames = Array(_len), _key = 0; _key < _len; _key++) {
          storeNames[_key] = arguments[_key];
        }

        var initialSnapshot = storeNames.length ? filterSnapshots(this, this[INIT_SNAPSHOT], storeNames) : this[INIT_SNAPSHOT];

        setAppState(this, initialSnapshot, function (store) {
          if (store[LIFECYCLE].init) {
            store[LIFECYCLE].init();
          }
          store.emitChange();
        });
      }
    },
    flush: {
      value: function flush() {
        var state = this.serialize(snapshot(this));
        this.recycle();
        return state;
      }
    },
    bootstrap: {
      value: function bootstrap(data) {
        setAppState(this, data, function (store) {
          if (store[LIFECYCLE].bootstrap) {
            store[LIFECYCLE].bootstrap();
          }
          store.emitChange();
        });
      }
    },
    addActions: {

      // Instance type methods for injecting alt into your application as context

      value: function addActions(name, ActionsClass) {
        for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
          args[_key - 2] = arguments[_key];
        }

        this.actions[name] = Array.isArray(ActionsClass) ? this.generateActions.apply(this, ActionsClass) : this.createActions.apply(this, [ActionsClass].concat(args));
      }
    },
    addStore: {
      value: function addStore(name, StoreModel) {
        for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
          args[_key - 2] = arguments[_key];
        }

        this.createStore.apply(this, [StoreModel, name].concat(args));
      }
    },
    getActions: {
      value: function getActions(name) {
        return this.actions[name];
      }
    },
    getStore: {
      value: function getStore(name) {
        return this.stores[name];
      }
    }
  });

  return Alt;
})();

module.exports = Alt;

},{"./AltAction":7,"./symbols/symbols":9,"./utils/createStore":11,"./utils/formatAsConstant":12,"./utils/getInternalMethods":13,"./utils/stateFunctions":14,"./utils/uid":15,"./utils/warnings":16,"es-symbol":1,"flux":3,"object-assign":6}]},{},[17])(17)
});