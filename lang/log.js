/**
 * @module lofty/lang/log
 * @author qijun.weiqj
 * @build 20131018
 * */

 
/**
 * Simple log support
 *
 * create new log instance
 *
 * var log = new Log(type)
 * 
 * log.log(msg, level)
 * log.error(msg)
 * log.warn(msg)
 * log.info(msg)
 * log.debug(msg)
 * 
 * log.LEVEL
 * log.level
 * log.isEnabled
 *
 * use global log direct
 *
 * log(msg, level)
 * log.error(msg)
 * log.warn(msg)
 * log.info(msg)
 * log.debug(msg)
 */
define('lofty/lang/log', ['jquery'], function($) {

'use strict'


var LEVEL = { none: 0, error: 1, warn: 2, info: 3, debug: 4 };
var level = (function() {
	var search = window.location.search,
		level = (/\bdebug-log-level=(\w+)\b/.exec(search) || {})[1] || 'error';
	return LEVEL[level];
})();


var exports = function(type) {
	if (window === this) {
		exports.log.apply(exports, arguments);
		return exports;
	} else {
		return new Log(type);
	}
};


/**
 * can be overrided by other module
 */
exports.handler = window.console ? function(msg, level, type) {
	var fn = console[level] ? console[level] : console.log,
		args = $.isArray(msg) ? msg.slice(0) : [msg];
	type && args.unshift('[' + type  + ']');

	try {
		fn.apply(window.console, args);
	} catch (e) {}

} : function() {};


/**
 * `Class` Log
 */
var Log = function(type) {
	this.type = type || 'Anonymous';
};


var proto = Log.prototype = {
	LEVEL: LEVEL,
	level: level,

	isEnabled: function(level) {
		level = typeof level === 'string' ? LEVEL[level] : level;
		return level <= this.level;	
	},

	log: function(msg, level) {
		level = level || 'info';
		if (this.isEnabled(level)) {
			exports.handler(msg, level, this.type);
		}
		return this;
	}
};


var slice = [].slice;
$.each(LEVEL, function(level) {
	proto[level] = function() {
		return this.log(slice.call(arguments, 0), level);
	};
});
//~Log


$.extend(exports, proto);



/**
 * filter support
 */
(function() {

var search = window.location.search,
	filter = (/\bdebug-log-filter=([^&]+)/.exec(search) || {})[1];

if (!filter) {
	return;
}


var handler = exports.handler;
exports.handler = function(message, level, name) {
	if (name && name.indexOf(filter) !== -1 ||
			message && message.toString().indexOf(filter) !== -1) {
		handler(message, level, name)
	}
};

		
})();
//~


/**
 * console support
 */
(function() {

var body = null,
	list = [],
	search = window.location.search,
	logConsole = /\bdebug-log-console\b/.test(search);


if (!logConsole) {
	return;
}


var globalEval = function( data ) {
	if ( data && $.trim( data ) ) {
		( window.execScript || function( data ) {
			window[ "eval" ].call( window, data );
		} )( data );
	}
};
	
var prepare = function() {
	var html = [
		'<div class="debug-container">',
			'<button class="clear"></button>',
			'<p><textarea class="editor"></textarea><button class="go">Go</button></p>',
			'<div class="body"></div>',
		'</div>'
		].join('');


	var panel = $(html).appendTo('body'),
		clear = $('button.clear', panel),
		editor = $('textarea.editor', panel),
		go = $('button.go', panel),
		body = $('div.body', panel);

	clear.on('click', function(e) {
		body.empty();	
	});

	go.on('click', function() {
		var value = $.trim(editor.val());
		value && globalEval(value);
	});

	$.each(list, function(index, message) {
		body.append(message);
	});	
};

prepare();


var handler = exports.handler;
exports.handler = function(message, level, name) {
	var node = $('<p class="debug debug-' + level + '"></p>');
	node.text((name ? '[' + name + '] ' : '') + message);
	if (body) {
		body.append(node);
	} else {
		list.push(node);
	}
};


})();
//~


return exports;


});