/**
 * @module lofty/lang/pluginhost
 * @author terence.wangt
 * @date 20130701
 * */
 
define( 'lofty/lang/pluginhost', ['lofty/lang/class'], function(Class){
	'use strict';
    
	var PluginHost = Class({
				
		/**
         * 在宿主组件中插入插件
         *
         * @method install
         * @param P {Function | Object |Array} 可以是插件类，或是一个对象{plg:PluginClass, cfg:{}}
         *        							   接受参数为数组的情况，这样可以同时插入多个插件
         * @param config (Optional) 插件的配置项
         * @return {Base} 返回宿主对象的应用
         */
        install: function(Plugin, config) {
		
            var i, ln, name;
			this._plugins || (this._plugins = {});

            if (isArray(Plugin)) {
                for (i = 0, ln = Plugin.length; i < ln; i++) {
                    this.install(Plugin[i]);
                }
            } else {
                if (Plugin && !isFunction(Plugin)) {
                    config = Plugin.cfg;
                    Plugin = Plugin.plg;
                }

                if (Plugin && Plugin.Name) {
                    name = Plugin.Name;
        
                    config = config || {};
                    config.host = this;
			
                    if (this.hasPlugin(name)) {
                        // 更新配置
                        if (this[name].set) {
                            this[name].set(config);
                        }
                    } else {
                        // 创建插件实例
                        this[name] = new Plugin(config);
                        this._plugins[name] = Plugin;
                    }
                }
            }
            return this;
        },

        /**
         * 插件卸载函数 
         *
         * @method uninstall
         * @param {String | Function} Plugin 要卸载插件的对象。 若参数为空，则卸载所有插件
         * @return {Base} 返回宿主组件的引用
         * @chainable
         */
        uninstall: function(Plugin) {
			
			if (!this._plugins) return this;
			 
            var name = Plugin, 
                plugins = this._plugins;
            
            if (Plugin) {
                if (isFunction(Plugin)) {
                    name = Plugin.Name;
                    if (name && (!plugins[name] || plugins[name] !== Plugin)) {
                        name = null;
                    }
                }
        
                if (name) {
                    if (this[name]) {
                        if (this[name].destroy) {
                            this[name].destroy();
                        }
                        delete this[name];
                    }
                    if (plugins[name]) {
                        delete plugins[name];
                    }
                }
            } else {
                for (name in this._plugins) {
                    if (this._plugins.hasOwnProperty(name)) {
                        this.uninstall(name);
                    }
                }
            }
            return this;
        },

        /**
         * 检查插件是否已经在宿主组件中存在
         *
         * @method hasPlugin
         * @param {String} name 插件的Name属性
         * @return {Plugin} 存在则返回plugin实例，否则undefined
         */
        hasPlugin : function(name) {
			
			if (!this._plugins) return false;
			
            return (this._plugins[name] && this[name]);
        }
		
	});
	
	
	var toString = {}.toString,
        isFunction = function( it ){
            return toString.call( it ) === '[object Function]';
        },
		isArray = Array.isArray || function(it) {
			return toString.call(it) === '[object Array]'
		};
		
	return PluginHost;

} );
