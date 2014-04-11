/**
 * @module lofty/lang/aop
 * @from butterfly/lang/aspect
 * @date 20130628
 * */
  
define('lofty/lang/aop', function() {

    'use strict';
		
	var Aop = function() {
		this._list = [];
		this.isAttached = true;
	};
	
	Aop.prototype = {

		before: function(target, pointcut, fn, context) {
			intercept(this, target, pointcut, function(o) {
				var scope = context || o.target,
				    ret = fn.call(scope, o);
					if( !ret ) return;
					o.args = isArray(ret) ? ret : o.args;

				return o.method.apply(o.target, o.args);
			});
			return this;
		},

		after: function(target, pointcut, fn, context) {
			intercept(this, target, pointcut, function(o) {
				o.result = o.method.apply(o.target, o.args);
				var scope = context || o.target, 
					result = fn.call(scope, o);
					
				return result === undefined ? o.result : result;
			});
			return this;
		},

		detach: function() {
			var list = this._list,
				i = list.length;

			while (i--) {
				var o = list[i];
				o.target[o.name] = o.original;
			}

			this.isAttached = false;
			return this;
		}
	};

	// private functions
	var intercept = function(self, target, pointcut, fn) {
		target = target || window;

		if (typeof pointcut === 'string') {
			pointcut = [pointcut];
		}

		if (isArray(pointcut)) {
			for (var i = 0, c = pointcut.length; i < c; i++) {
				interceptItem(self, target, pointcut[i], fn);
			}
		} else if (pointcut.test) {
			for (var k in target) {
				if (pointcut.test(k) && typeof target[k] === 'function') {
					interceptItem(self, target, k, fn);
				}
			}
		}
	};

	var interceptItem = function(self, target, name, fn) {
		var original = target[name];
		if (typeof original !== 'function') {
			throw new Error('target method not exist: ' + name);
		}

		var method = function() {
			var args = [].slice.call(arguments, 0);
			return fn({
				target: target,
				name: name,
				args: args,
				method: original
			});
		};

		self._list.push({
			target: target,
			name: name,
			original: original,
			method: method
		});

		if (self.isAttached) {
			target[name] = method;
		}
	};


	// utility
	var toString = Object.prototype.toString,
		isArray = function(o) {
			return toString.apply(o) === '[object Array]'; 
		};


	// static
	(function() {

		var create = function(method) {
			Aop[method] = function(target, pointcut, fn, context) {
				var o = new this();
				return o[method](target, pointcut, fn, context);
			};
		};

		var methods = ['before', 'after'];
		for (var i = 0, c = methods.length; i < c; i++) {
			create(methods[i]);
		}
		
	})();

	return Aop;

});
