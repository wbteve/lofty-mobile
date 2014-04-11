/**
 * @module mlofty/ui/widget 组件基类，所有的UI组件继承于此类
 * @extends Base
 * @class Widget
 * @author terence.wangt
 * @date 20130630
 * */

define('lofty/ui/widget/1.0/widget', ['lofty/lang/class', 'lofty/lang/base','jquery'], 

	function( Class, Base, $){
	'use strict';
		var Widget = Class( Base, {
			/**
			 * 默认配置项
			 */
			options: {
				/**
				 * 模板字符串。
				 * 如果是已经渲染的html元素，则提供渲染html容器节点的选择器
				 * @type {String}
				 */	
				tpl:'<div></div>',
				
				/**
				 * @type {Json Object}
				 * 用户自定义的渲染模板所需数据
				 */
				extendTplData:null,

				/**
				 * 组件父节点，默认是document.body
				 * @type {String}
				 */				
				container: {
					value: 'body',
					getter: function(s) {
						if (isString(s)) {
							s = $(s);
						}
						return s;
					}
				},
				/**
				 * 组件根节点
				 * @type {Node}
				 */
				el: {
					getter: function(s) {
						if (isString(s)) {
							s = $(s);
						}
						return s;
					}
				}
			},
			
			/**
			 * 组件内事件集中在events变量中定义(也可通过bindEvent动态添加事件)
			 * @format:
			 * events:{
			 *    '':{mouseover: function(e){}},									//绑定到组件自身上
			 *    '#myWidget':{mouseover: function(e){}},							//组件内部事件
			 *    '.fui-title':{click:'onShowTitle', mouseover:'onHoverTitle'},		//组件内部事件
			 *    'document':{click: docClickCall},									//组件需要监听外部document的事件
			 *    'window':{mousedown: function(e){}}								//组件需要监听外部window的事件
			 *  }
			 */
			events: null,
			
			/**
			 * @description 入口函数，通常情况下，派生的组件不需要重写此函数。
			 */
			init: function( config) {

				//初始化options				
				this.mixOptions(['tpl', 'events']);
						
				//调用基类的构造函数，初始化属性及plugin等
				Base.prototype.init.call(this, config || {});
		
				//判断组件的渲染方式，并获取组件根节点
				this.buildElement();
				
				//初始化组件事件
				this.bindEvent();
		
				//子类组件的具体实现	
				this._create();
			},

			/**
			 * 销毁组件（destroy）时候调用
			 * @protected
			 */
			destroy: function() {
			
				this.unbindEvent();
				
				//调用基类的析构函数
				Base.prototype.destroy.call(this);
			},
		
			/**
			 * 子类组件的入口函数，需要子类自己实现
			 * @public
			 */
			_create: function(node){
				
			},
			
			/**
			 * 子类组件可根据需要选择性实现该方法
			 * @public
			 */
			render: function(parent) {
							
				if(parent){
					this.set('container', parent);
				}
				var element = this.get('el');
				var container = this.get('container');
				if (container && !isRendered(element[0])) {
					element.appendTo(container);
				}
				return this;
			},
		
			/**
			 * 注册代理事件函数
			 * @param  {Object} events 事件对象
			 * @public
			 * 
			 * @useage: 组件使用者可以直接使用该函数为组件添加Dom事件，格式为：
			 * 			widget.bindEvent( {'.fui-text':{mouseover:function(e){}}} )
			 */
			 
			bindEvent: function(events) {
				
				events = events || this.get('events');
				for (var selector in events) {
					var es = events[selector];
					for (var type in es) {
						
						var selector = parseSelector(selector, this);
						var event = parseSelector(type, this) + '.events-' + this.wId;
						(function(handler, self) {
							var callback = function(e) {
								if (isFunction(handler)) {
									handler.call(self, e);
								} else {
									self[handler](e);
								}
							}
							
							var element = self.get('el');
							if (selector === "") {
								element.on(event, callback);
							} 
							else if(selector === "document"){
								$(document).on(event, callback);
							}
							else if(selector === "window"){
								$(window).on(event, callback);
							}
							else {
								element.on(event, selector, callback);
							}

						})(es[type], this);
					}
				}
				return this;
			},
		
			
			/**
			 * 移除代理事件
			 * @param  {String} events 事件对象，格式{'.fui-text':{mouseover:'onCallback'}}
			 * @descrpition 若events为空，则移除所有事件
			 */
			 
			unbindEvent: function(events) {
				
				if (!events) {
					var event = '.events-' + this.wId;
					removeEvent(this, event);
					
				}else{
					for (var selector in events) {
						var es = events[selector];
						var selector = parseSelector(selector, this);
						for (var type in es) {
							var event = parseSelector(type, this) + '.events-' + this.wId;
							removeEvent(this, event, selector);
						}
					}
				}
				return this;
			},

			/**
			 * @description el是组件自身的dom根节点。支持动态渲染、静态渲染、标签自动渲染三种模式
			 * 静态渲染：组件config中配置的tpl为页面上某个节点的id或className，如tpl:'#domId'，组件将基于节点中的dom结构创建。
			 * 动态渲染：组件config中配置的tpl为模板字符串(js中的tpl变量或是自定义模板字符串)，则组件渲染时将使用模板中的内容创建。
			 * renderType：{String} static | dynamic | autoRender
			 */		
			buildElement: function() {
				
				var node, 
					renderType = 'dynamic',
					tpl = this.get('tpl');
					
				this.wId = Guid();

				if (isString(tpl)) {
					// 组件的Dom节点存在于页面上
					if (tpl.charAt(0) === '.' || tpl.charAt(0) === '#' || tpl === 'body') {
						node = $(tpl);
					}
				}else{
					node = tpl;
				}
				
				if(node && node.length>0) {
					//如果是script节点，则直接取html
					if(node[0].nodeName.toUpperCase() == 'SCRIPT') {
						tpl = node.html();
						this.set('tpl', tpl);
					} else {
						renderType = 'static';
					}
				}				
				this.set('renderType', renderType);	
				
				//静态渲染，从html节点渲染
				if( renderType ===  "static"){
					this.set('el', node);
				}
				//动态渲染，从template渲染
				else{
				
					var el = $(this.get('el'));
					this.handleTpl();
					
					if ((!el || el.length === 0)) {
					
						var elId = this.wId;
						var tpl = $(this.get('tpl'));					
						if (tpl.length > 1) {
                            tpl = $('<div id="' + elId + '"></div>').append(tpl);
                        } else {
                            elId = tpl.attr('id') || this.wId;
                            tpl.attr('id', elId);
                        }
						this.set('el', tpl);
					}else{	
						//理论上只有标签渲染才会走此逻辑，否则请提bug给我
						var container = this.get('container');
						container.append($(this.get('tpl')));
					}
				}
				if (!this.get('el')) {
					throw new Error('element is empty!');
				}
			},
			
			/**
			 * 混入属性到this.options中
			 * @param  {Array} attrs 要混入到options中的属性数组
			 */	
			mixOptions:function(attrs){
				
				for(var key in attrs){
					var attr = attrs[key];
					if(this[attr] && this.options){
						this.options[attr] = this[attr];
					}
				}
			},
			/**
			 * @description
			 * 模板解析函数，基类的默认实现，子类实现时可覆盖
			 * 处理完的tplStr必须回填 this.set('tpl', tplstr);
			 */
			handleTpl: function(){				

			}
		});
		
		
		// private functions
		
		var toString = {}.toString,
			isFunction = function( it ){
				return toString.call( it ) === '[object Function]';
			},
			isString = function( str ){
				return 'string' === typeof str;
			};
		
		var widgetCount = 0;
		function Guid() {
			return 'fui_widget_' + widgetCount++;
		};
	  
		function removeEvent(widget, event, selector){

			if( selector === 'document'){
				$(document).off(event);
			}
			else if( selector === 'window'){
				$(window).off(event);
			}
			else{
				var element = widget.get('el');
				element.off(event, selector);
			}
		};

		function isRendered(element) {
		
			var doc = document.documentElement;
			if($.contains){
				return $.contains(doc, element);
			}else{
				return !!(doc.compareDocumentPosition(element) & 16);
			}
		};
		
		function parseSelector(selector, widget){
			
			return selector.replace(/{([^}]+)}/g, function(m, name) {
				var parts = name.split('.');
				var point = widget, part;

				while (part = parts.shift()) {
					if (point === widget.options) {
					  point = widget.get(part);
					} else {
					  point = point[part];
					}
				}  
				if (isString(point)) {
					return point;
				}
				return '';
			});
		};
		
		return Widget;
});
