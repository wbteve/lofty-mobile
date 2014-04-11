
define("lofty/util/history/1.0/history", ['jquery','lofty/lang/class','lofty/lang/base'], 
	
	function($, Class, Base){
		
		'use strict';
			
		var History = Class( Base, {

			init:function (options){
				
				// history is a singleton
				if(singleton) return;
				
				Base.prototype.init.call(this, options || {});
				
				this.handlers = [];
				 
				bindAll(this, 'checkUrl');

				// Ensure that `History` can be used outside of the browser.
				if (typeof window !== 'undefined') {
					this.location = window.location;
					this.history = window.history;
				}
			},
			
			// The default interval to poll for hash changes, if necessary, is
			// twenty times a second.
			interval: 50,

			// Gets the true hash value. Cannot use location.hash directly due to bug
			// in Firefox where location.hash will always be decoded.
			getHash: function(window) {
				var match = (window || this).location.href.match(/#(.*)$/);
				return match ? match[1] : '';
			},

			// Get the cross-browser normalized URL fragment, either from the URL,
			// the hash, or the override.
			getFragment: function(fragment, forcePushState) {
				if (fragment == null) {
					if (this._hasPushState || !this._wantsHashChange || forcePushState) {
						fragment = this.location.pathname;
						var root = this.root.replace(trailingSlash, '');
						if (!fragment.indexOf(root)) fragment = fragment.slice(root.length);
						
					} else {
						fragment = this.getHash();
					}
				}
				return fragment.replace(routeStripper, '');
			},

			// Start the hash change handling, returning `true` if the current URL matches
			// an existing route, and `false` otherwise.
			start: function(options) {
				if (bStarted) return;
				bStarted = true;

				// Figure out the initial configuration. Do we need an iframe?
				// Is pushState desired ... is it available?
				this.options          = $.extend({root: '/'}, this.options, options);
				this.root             = this.options.root;
				this._wantsHashChange = this.options.hashChange !== false;
				this._wantsPushState  = !!this.options.pushState;
				this._hasPushState    = !!(this.options.pushState && this.history && this.history.pushState);
				var fragment          = this.getFragment();
				var docMode           = document.documentMode;
				var oldIE             = (isExplorer.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7));

				// Normalize root to always include a leading and trailing slash.
				this.root = ('/' + this.root + '/').replace(rootStripper, '/');

				if (oldIE && this._wantsHashChange) {
					this.iframe = $('<iframe src="javascript:0" tabindex="-1" />').hide().appendTo('body')[0].contentWindow;
					this.navigate(fragment);
				}

				// Depending on whether we're using pushState or hashes, and whether
				// 'onhashchange' is supported, determine how we check the URL state.
				if (this._hasPushState) {
					$(window).bind('popstate', this.checkUrl);
				} else if (this._wantsHashChange && ('onhashchange' in window) && !oldIE) {
					$(window).bind('hashchange', this.checkUrl);
				} else if (this._wantsHashChange) {
					this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
				}

				// Determine if we need to change the base url, for a pushState link
				// opened by a non-pushState browser.
				this.fragment = fragment;
				var loc = this.location;
				var atRoot = loc.pathname.replace(/[^\/]$/, '$&/') === this.root;

				// Transition from hashChange to pushState or vice versa if both are
				// requested.
				if (this._wantsHashChange && this._wantsPushState) {

					// If we've started off with a route from a `pushState`-enabled
					// browser, but we're currently in a browser that doesn't support it...
					if (!this._hasPushState && !atRoot) {
						this.fragment = this.getFragment(null, true);
						this.location.replace(this.root + this.location.search + '#' + this.fragment);
						// Return immediately as browser will do redirect to new url
						return true;

						// Or if we've started out with a hash-based route, but we're currently
						// in a browser where it could be `pushState`-based instead...
					} else if (this._hasPushState && atRoot && loc.hash) {
							this.fragment = this.getHash().replace(routeStripper, '');
							this.history.replaceState({}, document.title, this.root + this.fragment + loc.search);
					}
				}

			  if (!this.options.silent) return this.loadUrl();
			},

			// Disable Backbone.history, perhaps temporarily. Not useful in a real app,
			// but possibly useful for unit testing Routers.
			stop: function() {
				$(window).unbind('popstate', this.checkUrl).unbind('hashchange', this.checkUrl);
				clearInterval(this._checkUrlInterval);
				bStarted = false;
			},

			// Add a route to be tested when the fragment changes. Routes added later
			// may override previous routes.
			route: function(route, callback) {
				this.handlers.unshift({route: route, callback: callback});
			},

			// Checks the current URL to see if it has changed, and if it has,
			// calls `loadUrl`, normalizing across the hidden iframe.
			checkUrl: function(e) {
				var current = this.getFragment();
				if (current === this.fragment && this.iframe) {
					current = this.getFragment(this.getHash(this.iframe));
				}
				if (current === this.fragment) return false;
				if (this.iframe) this.navigate(current);
				this.loadUrl();
			},

			// Attempt to load the current URL fragment. If a route succeeds with a
			// match, returns `true`. If no defined routes matches the fragment,
			// returns `false`.
			loadUrl: function(fragment) {
			  fragment = this.fragment = this.getFragment(fragment);
			  return any(this.handlers, function(handler) {
				if (handler.route.test(fragment)) {
				  handler.callback(fragment);
				  return true;
				}
			  });
			},

			// Save a fragment into the hash history, or replace the URL state if the
			// 'replace' option is passed. You are responsible for properly URL-encoding
			// the fragment in advance.
			//
			// The options object can contain `trigger: true` if you wish to have the
			// route callback be fired (not usually desirable), or `replace: true`, if
			// you wish to modify the current URL without adding an entry to the history.
			navigate: function(fragment, options) {
				if (!bStarted) return false;
				if (!options || options === true) options = {trigger: !!options};

				var url = this.root + (fragment = this.getFragment(fragment || ''));

				// Strip the fragment of the query and hash for matching.
				fragment = fragment.replace(pathStripper, '');

				if (this.fragment === fragment) return;
				this.fragment = fragment;

				// Don't include a trailing slash on the root.
				if (fragment === '' && url !== '/') url = url.slice(0, -1);

				// If pushState is available, we use it to set the fragment as a real URL.
				if (this._hasPushState) {
					this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

				// If hash changes haven't been explicitly disabled, update the hash
				// fragment to store history.
				} else if (this._wantsHashChange) {
					this._updateHash(this.location, fragment, options.replace);
					if (this.iframe && (fragment !== this.getFragment(this.getHash(this.iframe)))) {
					// Opening and closing the iframe tricks IE7 and earlier to push a
					// history entry on hash-tag change.  When replace is true, we don't
					// want this.
					if(!options.replace) this.iframe.document.open().close();
					this._updateHash(this.iframe.location, fragment, options.replace);
				}

			  // If you've told us that you explicitly don't want fallback hashchange-
			  // based history, then `navigate` becomes a page refresh.
			  } else {
					return this.location.assign(url);
			  }
			  if (options.trigger) return this.loadUrl(fragment);
			},

			// Update the hash location, either replacing the current entry, or adding
			// a new one to the browser history.
			_updateHash: function(location, fragment, replace) {
			  if (replace) {
				var href = location.href.replace(/(javascript:|#).*$/, '');
				location.replace(href + '#' + fragment);
			  } else {
				// Some browsers require that `hash` contains a leading #.
				location.hash = '#' + fragment;
			  }
			}
		});
		
		// Cached regex for stripping a leading hash/slash and trailing space.
		var routeStripper = /^[#\/]|\s+$/g;

		// Cached regex for stripping leading and trailing slashes.
		var rootStripper = /^\/+|\/+$/g;

		// Cached regex for detecting MSIE.
		var isExplorer = /msie [\w.]+/;

		// Cached regex for removing a trailing slash.
		var trailingSlash = /\/$/;

		// Cached regex for stripping urls of hash and query.
		var pathStripper = /[?#].*$/;

		// Has the history handling already been started?
		var bStarted = false;
		
		var nativeBind = Function.prototype.bind;
		var nativeForEach = Array.prototype.forEach;
		var nativeSome = Array.prototype.some;
		
		var array = [];
		var breaker = {};
		var slice = array.slice;
		  
		var toString = Object.prototype.toString,
		isFunction = function(val) {
			return toString.call(val) === '[object Function]';
		};
		
		// Bind all of an object's methods to that object. Useful for ensuring that
		// all callbacks defined on an object belong to it.
		var bindAll = function(obj) {
			var funcs = slice.call(arguments, 1);
			if (funcs.length === 0) throw new Error("bindAll must be passed function names");
			each(funcs, function(f) { 
				obj[f] = bind(obj[f], obj); 
			});
			return obj;
		};
		
		// Create a function bound to a given object (assigning `this`, and arguments,
		// optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
		// available.
		var bind = function(func, context) {
			var args, bound;
			if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
			if (!isFunction(func)) throw new TypeError;
			args = slice.call(arguments, 2);
			return bound = function() {
				if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
				ctor.prototype = func.prototype;
				var self = new ctor;
				ctor.prototype = null;
				var result = func.apply(self, args.concat(slice.call(arguments)));
				if (Object(result) === result) return result;
				return self;
			};
		};

		// The cornerstone, an `each` implementation, aka `forEach`.
		// Handles objects with the built-in `forEach`, arrays, and raw objects.
		// Delegates to **ECMAScript 5**'s native `forEach` if available.
		var each = function(obj, iterator, context) {
			if (obj == null) return;
			if (nativeForEach && obj.forEach === nativeForEach) {
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
		
		// Keep the identity function around for default iterators.
		var identity = function(value) {
			return value;
		};
  
		// Determine if at least one element in the object matches a truth test.
		// Delegates to **ECMAScript 5**'s native `some` if available.
		// Aliased as `any`.
		var any = function(obj, iterator, context) {
			iterator || (iterator = identity);
			var result = false;
			if (obj == null) return result;
			if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
			each(obj, function(value, index, list) {
				if (result || (result = iterator.call(context, value, index, list))) return breaker;
			});
			return !!result;
		};
		  
		// Retrieve the names of an object's properties.
		// Delegates to **ECMAScript 5**'s native `Object.keys`
		var getKeys = Object.keys || function(obj) {
			if (obj !== Object(obj)) throw new TypeError('Invalid object');
			var keys = [];
			for (var key in obj) if ( hasOwnProperty.call(obj, key) ) keys.push(key);
			return keys;
		};
		
		var singleton = new History;
		
		return singleton;
	}
)