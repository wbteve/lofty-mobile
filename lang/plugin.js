/**
 * @module lofty/lang/plugin
 * @author terence.wangt
 * @date 20130701
 * */
  
define( 'lofty/lang/plugin', ['lofty/lang/class', 
									 'lofty/lang/base',
									 'lofty/lang/aop'], 
    function( Class, Base, Aop){
	'use strict';
    
	var Plugin = Class( Base, {
		
        /**
         * 保存事件监听函数 或是 AOP 切入函数的数组对象。
         */
        _handles: null,

        /**
         * 初始化函数
         *
         * @method init
         * @param {Object} config 插件配置参数键值对
         */
        init : function(config) {
            this._handles = [];
			Base.prototype.init.apply(this, arguments);
			
			this.setUp(config);
        },

        /**
         * 插件销毁函数
         * 移除所有的事件监听函数或是AOP切入函数
         * @method destructor
         */
        destroy: function() {
            if (this._handles) {
                for (var i = 0, l = this._handles.length; i < l; i++) {
                   this._handles[i] && this._handles[i].detach && this._handles[i].detach();
                }
            }
        },
		
		/**
         * 在宿主对象的方法 "之前" 插入插件的函数，插件的函数将先执行。
		 * 若插入的函数 return false，则宿主对象的方法将不再执行。 相当于覆盖宿主对象的方法
         *
         * @method beforeHost
         *
         * @param strMethod {String} 宿主对象上的某个方法名称
         * @param fn {Function} 要插入先执行的方法，将在strMethod之前执行，若fn返回false，则strMethod将不会被继续执行。
         * @param context {Object} optional 要插入方法的执行域
         * @return handle {EventHandle} 返回AOP事件句柄
         */
        beforeHost: function(strMethod, fn, context) {
            var host = this.get("host"), handle;

            if (strMethod in host) { // method
				handle = Aop.before(this.get("host"), strMethod, fn, context || this);
				this._handles.push(handle);
            }
            return handle;
        },
		
        /**
         * 在宿主对象的方法 "之后" 插入插件的函数，宿主对象的方法将先执行。
         *
         * @method afterHost
         *
         * @param strMethod {String} 宿主对象上的某个方法名称
         * @param fn {Function} 要插入执行的方法，将在strMethod之后执行
         * @param context {Object} optional 要插入方法的执行域
         * @return handle {EventHandle} 返回AOP事件句柄
         */
        afterHost: function(strMethod, fn, context) {
            var host = this.get("host"), handle;

            if (strMethod in host) { // method
				handle = Aop.after(this.get("host"), strMethod, fn, context || this);
				this._handles.push(handle);
            } 
            return handle;
        },

        /**
         * 监听宿主对象的自定义事件
         *
         * 插件卸载时，监听事件也将被销毁
         * 
         * @method onHostEvent
         * @param {String | Object} event 事件名称
         * @param {Function} fn 监听回调函数
         * @param {Object} context 监听回调函数的执行域，默认为plugin实例自身
         * @return handle {EventHandle} 返回detach事件句柄
         */
        onHostEvent : function(event, fn, context) {
            var handle = this.get("host").on(event, fn, context || this);
            this._handles.push(handle);
            return handle;
        },
		
		/**
         *  plugin子类的初始化入口函数，由子类自己实现 
         */
        setUp:function(config) {
           
        }
		
	});
	
	/**
     *
     * @property Name
     * @type String     ！！！ 这个属性在每个plugin实现时需要自定义，并且不能重复 ！！！
     * @static
     */
    Plugin.Name = 'plugin';
	
	
	return Plugin;

} );
