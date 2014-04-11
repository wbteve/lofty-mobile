/**
 * @module lofty/ui/template/tplhandler
 * @author chuanpeng.qchp
 * @date 20130806
 * 用来解析ui组件中的模板，此方法不是通用的方法
 */

define('lofty/util/template/1.0/tplhandler',['util/template/1.0', 'jquery'],function(Template, $){
	var tplHandler = {
		process:function(tplData){
			//用户自定义的模板变量
			var extendTplData = this.get('extendTplData');	
			
			if(!extendTplData && !tplData){
				return;
			}
			var data = $.extend(true, {}, tplData, extendTplData);
			var tplStr = this.get('tpl');
			var render = Template.compile(tplStr);
			var html = render(data);
			this.set('tpl',html);
			
		}
	};
	
	return tplHandler;
});