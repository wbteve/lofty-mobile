/**
 * @module lofty/ui/tabs/tabs
 * @author 
 * @date 20130630
 * 
 */

/*!!cmd:compress=true*/
/*!!cmd:jsCompressOpt=["--disable-optimizations"]*/
 
define('lofty/ui/tabs/1.0/tabs', ['lofty/lang/class', 'lofty/ui/widget/1.0/widget', 'lofty/util/template/1.0/tplhandler', 'jquery'], 

	function( Class, Widget, TplHandler, $){
		
		var Tabs = Class( Widget, {
			/**
			 * 属性的默认配置
			 */
			options: {
				myOptions: true,                // 组件的某个属性
				classPrefix:'fui-tabs'			// 每个 UI 组件都需要支持classPrefix属性。注意后续方法中节点选择器需要处理classPrefix
			},
			
			/**
			 * 组件内部事件集中在events变量中定义(也可通过bindEvent动态添加事件) 
			 * 其中的{options.XXX}会由widget基类自动替代为option中指定的属性（或用户覆盖的属性）
			*/
			events:{
				'{options.titleSelector} a': {
					'click':function(e){e.preventDefault();}
				},
				'{options.classPrefix}-ul a': {
					'click':'onTabsHeadClicked'
				},
			},
			
			/** 
			 * @methed UI 组件的入口函数，在调用_create（）方法前，基类Widget.js中已完成的任务：
			 * 1、属性初始化
			 * 2、组件创建方式的判断
			 * 3、组件内事件绑定
			 */
			_create: function() {
				
				
				//如果希望组件实例化的时候就把组件直接渲染到Dom上，则在 _create()函数中调用render方。
				//如果希望组件实例化时不修改dom，则_create()函数中不要调用该方法，由组件使用者创建实例后自己决定调用时机。
				this.render();
			},
			
			/** 
			 * @description  基类widget中已经有render函数的默认实现，子类可根据实际需要选择性覆盖
			 * @methed render方法完成将组件的Dom节点渲染到页面上的任务 (修改Dom节点)。
			 * @note 与Dom节点操作无关的其它函数，如事件处理、模板渲染等，请不要放在这个函数中。
			 * 
			 */
			render:function(){
				
			},
			
			/** 
			 * @methed 覆盖基类实现，用于处理template模板
			 * @description 
			 */
			handleTpl:function(){
				
				var data = {};
				data.classPrefix = this.get('classPrefix');
				data.children  = this.get('children') || [];
				TplHandler.process.call(this,data);
			},
						
			/**
			 * 定义模板变量  注意：变量名必须是tpl
			 * 注意：组件中一定要通过  this.get('tpl')，或者 this.set('tpl', newVal)的方式使用tpl，
			 * 	     不允许使用this.tpl。 因为widget.js中会对tpl进行一定的处理
			 */
			tpl: [
			  '<div class="<%= classPrefix %>">',
				'<div class="fui-t">',
					'<ul class="<%= classPrefix %>-ul">',
						'<% for ( var i = 0; i < children.length; i++ ) { %>',
							'<li class="<%= classPrefix %>-t"><a href="#"><%= children[i].label%></a></li>',
						'<% } %>',
					'</ul>',
				'</div>',
				'<div class="fui-d">',  
					'<% for ( var i = 0; i < children.length; i++ ) { %>',
						'<div class="<%= classPrefix %>-b"><%=children[i].content%></div>',
					'<% } %>',
				'</div>',
			'</div>'
			].join(''),
			
			
			/**
			 * @examples 回调示例函数
			 * @description events 中定义的回调函数，widget基类会完成事件的自动注册。
			 */
			onTabsHeadClicked:function(){
				
			},
					
			end:0
		});
		
		////////////////////////////////////////////////////////////////////////////////////////////
		// 私有方法定义区
		// 下面定义的是一些组件的私有方法 （不希望暴露接口给外部，也不允许外部通过AOP的方式重写）
		
		/**
		 * @useage  如果组件的公用方法调用这些私有方法，若私有方法中无需this对象，则直接调用：privateFunc();
		 * @useage  如果组件的公用方法调用这些私有方法，若私有方法需要使用this对象，则调用：privateFunc.call(this);
		 */
		function privateFunc() {
			return;
		}
	
			
		return Tabs;
});
