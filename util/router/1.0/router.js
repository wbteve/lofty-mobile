define("lofty/util/router/1.0/router", ['jquery','lofty/lang/class','lofty/lang/base',"util/history/1.0"], 

  function($, Class, Base, History){
	
	'use strict';
	
	var Router = Class( Base, {
	
		init:function (options){
			
			options = $.extend({history: true}, options);
			
			$.extend(this, options);

			Base.prototype.init.call(this, options);
			
			if (this.get("routes")) {
				this.routes = this.get("routes");
			}
			
			this._bindRoutes();
			
			if (this.get("history")) {
				History.start();
			}
		},
		
		route: function(route, name, callback) {
		
			if (!isRegExp(route)) route = this._routeToRegExp(route);
			if (isFunction(name)) {
				callback = name;
				name = '';
			}
			if (!callback) callback = this[name];
			var router = this;
			History.route(route, function(fragment) {
				var args = router._extractParameters(route, fragment);
				callback && callback.apply(router, args);
				router.trigger.apply(router, ['route:' + name].concat(args));
				router.trigger('route', name, args);
				History.trigger('route', router, name, args);
			});
			return this;
		},

		// Simple proxy to `history` to save a fragment into the history.
		navigate: function(fragment, options) {
			History.navigate(fragment, options);
			return this;
		},

		
		
		// Bind all defined routes to `history`. We have to reverse the
		// order of the routes here to support behavior where the most general
		// routes can be defined at the bottom of the route map.
		_bindRoutes: function() {
			if (!this.routes) return;
			this.routes = result(this, 'routes');
			var route, routes = getKeys(this.routes);
			while ((route = routes.pop()) != null) {
				this.route(route, this.routes[route]);
			}
		},

		// Convert a route string into a regular expression, suitable for matching
		// against the current location hash.
		_routeToRegExp: function(route) {
		  route = route.replace(escapeRegExp, '\\$&')
					   .replace(optionalParam, '(?:$1)?')
					   .replace(namedParam, function(match, optional) {
						 return optional ? match : '([^\/]+)';
					   })
					   .replace(splatParam, '(.*?)');
		  return new RegExp('^' + route + '$');
		},

		// Given a route, and a URL fragment that it matches, return the array of
		// extracted decoded parameters. Empty or unmatched parameters will be
		// treated as `null` to normalize cross-browser behavior.
		_extractParameters: function(route, fragment) {
			var params = route.exec(fragment).slice(1);
			return map(params, function(param) {
				return param ? decodeURIComponent(param) : null;
			});
		}
		
	});
	 
	
	// Cached regular expressions for matching named param parts and splatted
	// parts of route strings.
	var optionalParam = /\((.*?)\)/g;
	var namedParam    = /(\(\?)?:\w+/g;
	var splatParam    = /\*\w+/g;
	var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;

	var toString = Object.prototype.toString,
		isFunction = function(val) {
			return toString.call(val) === '[object Function]';
		},
		isRegExp = function(val) {
			return toString.call(val) === '[object RegExp]';
		}
	
	var nativeMap = Array.prototype.map,
		map = function(obj, iterator, context) {
			var results = [];
			if (obj == null) return results;
			if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
			each(obj, function(value, index, list) {
				results.push(iterator.call(context, value, index, list));
			});
			return results;
	};
	
	// If the value of the named `property` is a function then invoke it with the
	// `object` as context; otherwise, return it.
	var result = function(object, property) {
		if (object == null) return void 0;
		var value = object[property];
		return isFunction(value) ? value.call(object) : value;
	};
	
	// Retrieve the names of an object's properties.
	// Delegates to **ECMAScript 5**'s native `Object.keys`
	var getKeys = Object.keys || function(obj) {
		if (obj !== Object(obj)) throw new TypeError('Invalid object');
		var keys = [];
		for (var key in obj) if ( hasOwnProperty.call(obj, key) ) keys.push(key);
		return keys;
	};
	
	// The cornerstone, an `each` implementation, aka `forEach`.
	// Handles objects with the built-in `forEach`, arrays, and raw objects.
	// Delegates to **ECMAScript 5**'s native `forEach` if available.
	var each = function(obj, iterator, context) {
		if (obj == null) return;
		if (Array.prototype.forEach && obj.forEach === Array.prototype.forEach) {
			obj.forEach(iterator, context);
		} else if (obj.length === +obj.length) {
			for (var i = 0, length = obj.length; i < length; i++) {
				if (iterator.call(context, obj[i], i, obj) === breaker) return;
			}
		} else {
			var keys = getKeys(obj);
			for (var i = 0, length = keys.length; i < length; i++) {
				if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
			}
		}
	};
		
	return Router;
});