/**
 * @module lofty/lang/attribute
 * @from modify from arale
 * @author terence.wangt
 * @date 20130702
 * */

define( 'lofty/lang/attribute', ['lofty/lang/class'], function(Class){
   'use strict';
	
	var Attribute = Class({
			
		/**
         * 属性初始化函数。当属性发生变化时，会自动触发相关事件
         *
         * @method initOptions
         * @param {Object} config 属性信息
         */
		initOptions: function(config) {
			
			var options = this.options = {};
			
			mergeInheritedAttrs(options, this);
			
			if (config) {
				mergeConfig(options, config);
			}
			
			setSetterAttrs(this, options, config);
		},

		/**
         * 获取属性
         *
         * @method get
         * @param {String} key 属性名称
         */
		get: function(key) {
			var option = this.options[key] || {};
			var val = option.value;
			return option.getter ? option.getter.call(this, val, key) : val;
		},

		/**
         * 设置属性
         *
         * @method set
         * @param {String|Object} key 属性名称，当key为Object时，可以同时设置多个属性，
						   如：set({ "key1": val1, "key2": val2 }, options)
	     * @param {String} val 属性值
		 * @param {String} options 可以设置{silent:true}来阻止change事件
         */
		set: function(key, val, options) {
		
			var attrs = {};

			// set("key", val, options)
			if (isString(key)) {
			  attrs[key] = val;
			}
			// set({ "key": val, "key2": val2 }, options)
			else {
			  attrs = key;
			  options = val;
			}

			options || (options = {});
			var silent = options.silent;
			var override = options.override;

			var now = this.options;
			var changed = this.__changedAttrs || (this.__changedAttrs = {});
		
			for (key in attrs) {
				if (!attrs.hasOwnProperty(key)) continue;

				var attr = now[key] || (now[key] = {});
				val = attrs[key];

				if (attr.readOnly) {
					throw new Error('This attribute is readOnly: ' + key);
				}

				// invoke setter
				if (attr.setter) {
					val = attr.setter.call(this, val, key);
				}

				// 获取设置前的 prev 值
				var prev = this.get(key);

				// 获取需要设置的 val 值
				// 如果设置了 override 为 true，表示要强制覆盖，就不去 merge 了
				// 都为对象时，做 merge 操作，以保留 prev 上没有覆盖的值
				if (!override && isPlainObject(prev) && isPlainObject(val)) {
					val = merge(merge({}, prev), val);
				}

				// set finally
				now[key].value = val;

				// invoke change event
				// 初始化时对 set 的调用，不触发任何事件
				if (!this.__initializingAttrs && !isEqual(prev, val)) {
					if (silent) {
						changed[key] = [val, prev];
					}
					else {
					  this.trigger(key + 'Changed' , val, prev, key);
					}
				}
			}
			return this;
	    },

		/**
         * change函数，主动调用此函数可触发"change"事件
         *
         * @method change
		 * @return {Object} 对象自身
         */
		change: function() {
			var changed = this.__changedAttrs;

			if (changed) {
				for (var key in changed) {
					if (changed.hasOwnProperty(key)) {
					var args = changed[key];
					this.trigger(key + 'Changed', args[0], args[1], key);
					}
				}
				delete this.__changedAttrs;
			}
			return this;
		}
		
	});
	
	// Private functions
	// -------

	var toString = Object.prototype.toString;
	var hasOwn = Object.prototype.hasOwnProperty;

	  /**
	   * Detect the JScript [[DontEnum]] bug:
	   * In IE < 9 an objects own properties, shadowing non-enumerable ones, are
	   * made non-enumerable as well.
	   * https://github.com/bestiejs/lodash/blob/7520066fc916e205ef84cb97fbfe630d7c154158/lodash.js#L134-L144
	   */
	  /** Detect if own properties are iterated after inherited properties (IE < 9) */
	  var iteratesOwnLast;
	  (function() {
		var props = [];
		function Ctor() { this.x = 1; }
		Ctor.prototype = { 'valueOf': 1, 'y': 1 };
		for (var prop in new Ctor()) { props.push(prop); }
		iteratesOwnLast = props[0] !== 'x';
	  }());

	var isArray = Array.isArray || function(val) {
		return toString.call(val) === '[object Array]';
	};

	function isString(val) {
		return toString.call(val) === '[object String]';
	}

	function isWindow(o) {
		return o != null && o == o.window;
	}
	
	// Thanks to Jquery source code
	function isPlainObject(o) {
		// Must be an Object.
		// Because of IE, we also have to check the presence of the constructor
		// property. Make sure that DOM nodes and window objects don't
		// pass through, as well
		if (!o || toString.call(o) !== "[object Object]" ||
			o.nodeType || isWindow(o)) {
			return false;
		}

		try {
		  // Not own constructor property must be Object
		  if (o.constructor &&
			  !hasOwn.call(o, "constructor") &&
			  !hasOwn.call(o.constructor.prototype, "isPrototypeOf")) {
			return false;
		  }
		} catch (e) {
		  // IE8,9 Will throw exceptions on certain host objects #9897
		  return false;
		}

		var key;

		// Support: IE<9
		// Handle iteration over inherited properties before own properties.
		// http://bugs.jquery.com/ticket/12199
		if (iteratesOwnLast) {
		  for (key in o) {
			return hasOwn.call(o, key);
		  }
		}

		// Own properties are enumerated firstly, so to speed up,
		// if last one is own, then all properties are own.
		for (key in o) {}

		return key === undefined || hasOwn.call(o, key);
	}

	function isEmptyObject(o) {
		if (!(o && toString.call(o) === "[object Object]")) {
			return false;
		}

		for (var p in o) {
			if (o.hasOwnProperty(p)) return false;
		}
		return true;
	}

	function merge(receiver, supplier) {
  
		var key, value;

		for (key in supplier) {
		  if (supplier.hasOwnProperty(key)) {
			value = supplier[key];

			// 只 clone 数组和 plain object，其他的保持不变
			if (isArray(value)) {
			  value = value.slice();
			}
			else if (isPlainObject(value)) {
			  var prev = receiver[key];
			  isPlainObject(prev) || (prev = {});

			  value = merge(prev, value);
			}
			receiver[key] = value;
		  }
		}

		return receiver;
	}

	var keys = Object.keys;

	if (!keys) {
		keys = function(o) {
		  var result = [];

		  for (var name in o) {
			if (o.hasOwnProperty(name)) {
			  result.push(name);
			}
		  }
		  return result;
		};
	}

	function mergeInheritedAttrs(options, instance) {
	
		var inherited = [];
		var proto = instance.constructor.prototype;

		while (proto) {
			// 不要拿到 prototype 上的
			if (!proto.hasOwnProperty('options')) {
				proto.options = {};
			}

			// 为空时不添加
			if (!isEmptyObject(proto.options)) {
				inherited.unshift(proto.options);
			}

			// 向上回溯一级
			proto = proto.constructor.superclass;
		}

		// Merge and clone default values to instance.
		for (var i = 0, len = inherited.length; i < len; i++) {
			merge(options, normalize(inherited[i]));
		}
	}

	function mergeConfig(options, config) {
		merge(options, normalize(config, true));
	}

	function setSetterAttrs(host, options, config) {
		var opt = { silent: true };
		host.__initializingAttrs = true;

		for (var key in config) {
		  if (config.hasOwnProperty(key)) {
			if (options[key].setter) {
			  host.set(key, options[key].value, opt);
			}
		  }
		}
		delete host.__initializingAttrs;
	}


	var ATTR_SPECIAL_KEYS = ['value', 'getter', 'setter', 'readOnly'];

	// normalize `options` to
	//
	//   {
	//      value: 'xx',
	//      getter: fn,
	//      setter: fn,
	//      readOnly: boolean
	//   }
	//
	function normalize(options, isUserValue) {
		var newAttrs = {};

		for (var key in options) {
		  var option = options[key];

		  if (!isUserValue &&
			  isPlainObject(option) &&
			  hasOwnProperties(option, ATTR_SPECIAL_KEYS)) {
			newAttrs[key] = option;
			continue;
		  }

		  newAttrs[key] = {
			value: option
		  };
		}

		return newAttrs;
	}

	function hasOwnProperties(object, properties) {
		for (var i = 0, len = properties.length; i < len; i++) {
		  if (object.hasOwnProperty(properties[i])) {
			return true;
		  }
		}
		return false;
	}


	// 对于 options 的 value 来说，以下值都认为是空值： null, undefined, '', [], {}
	function isEmptyAttrValue(o) {
		return o == null || // null, undefined
			(isString(o) || isArray(o)) && o.length === 0 || // '', []
			isEmptyObject(o); // {}
	}

	// 判断属性值 a 和 b 是否相等，注意仅适用于属性值的判断，非普适的 === 或 == 判断。
	function isEqual(a, b) {
		if (a === b) return true;

		if (isEmptyAttrValue(a) && isEmptyAttrValue(b)) return true;

		// Compare `[[Class]]` names.
		var className = toString.call(a);
		if (className != toString.call(b)) return false;

		switch (className) {

		  // Strings, numbers, dates, and booleans are compared by value.
		  case '[object String]':
			// Primitives and their corresponding object wrappers are
			// equivalent; thus, `"5"` is equivalent to `new String("5")`.
			return a == String(b);

		  case '[object Number]':
			// `NaN`s are equivalent, but non-reflexive. An `equal`
			// comparison is performed for other numeric values.
			return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);

		  case '[object Date]':
		  case '[object Boolean]':
			// Coerce dates and booleans to numeric primitive values.
			// Dates are compared by their millisecond representations.
			// Note that invalid dates with millisecond representations
			// of `NaN` are not equivalent.
			return +a == +b;

		  // RegExps are compared by their source patterns and flags.
		  case '[object RegExp]':
			return a.source == b.source &&
				a.global == b.global &&
				a.multiline == b.multiline &&
				a.ignoreCase == b.ignoreCase;

		  // 简单判断数组包含的 primitive 值是否相等
		  case '[object Array]':
			var aString = a.toString();
			var bString = b.toString();

			// 只要包含非 primitive 值，为了稳妥起见，都返回 false
			return aString.indexOf('[object') === -1 &&
				bString.indexOf('[object') === -1 &&
				aString === bString;
		}

		if (typeof a != 'object' || typeof b != 'object') return false;

		// 简单判断两个对象是否相等，只判断第一层
		if (isPlainObject(a) && isPlainObject(b)) {

		  // 键值不相等，立刻返回 false
		  if (!isEqual(keys(a), keys(b))) {
			return false;
		  }

		  // 键相同，但有值不等，立刻返回 false
		  for (var p in a) {
			if (a[p] !== b[p]) return false;
		  }

		  return true;
		}

		// 其他情况返回 false, 以避免误判导致 change 事件没发生
		return false;
	}
	
	return Attribute;

});
