/*
 * 阿里旺旺 - 主客版
 * @author terence.wangt 2013.08.29
 * @coauthor lihao.ylh 2014.03.31
 */

define( 'lofty/alicn/alitalk/1.0/alitalk', ['jquery'],  function($){

	'use strict';

	var WANGWANG_URL = 'http://wangwang.m.1688.com/index.htm',
		Alitalk = {
			defaults: {
				cls: {									// 不同状态下旺旺图标的class name
					base: 'alitalk',
					on: 'alitalk-on',
					off: 'alitalk-off'
				},
				attr: 'alitalk',						// 组件信息所在的标签（默认会先判断data-前缀）
				siteID: 'cnalichn'						// 旺旺所在的站点，
		},
		
		 /**
		 * 初始化alitalk的静态方法
		 * @param {object} opts 配置参数， 触发元素传入trigger：$支持的所有标识
		 */
		init: function(options){
			
			var elem = options.trigger, attr;
			
			if (!elem.length) return;

			attr = options && options.attr || this.defaults.attr;

			options = $.extend({}, this.defaults, elem.data(attr), options);

			Wing.navigator.wangwang.isUserLogin({
				id: options.id,
				siteID: options.siteID
			}, function(data) {
				var data = data.data;
				elem.addClass(options.cls.base);
				if (data.loginstatus === 1) {
					elem.addClass(options.cls.on);
				} else {
					elem.addClass(options.cls.off);
				}
            });

			elem.bind($.os.supportsTouch ? 'tap' : 'click', function() {
				var selfData = Wing.navigator.login.getLoginInfo();
				var loginId = selfData.data.nick;

				window.location.href = WANGWANG_URL 
					+ '?id=' + loginId
				 	+ '&siteid=' + options.siteID 
				 	+ '&clientid=' + options.id
			});
		}
	};

	return Alitalk;
	
});