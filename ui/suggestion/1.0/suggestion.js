define( 'lofty/ui/suggestion/1.0/suggestion', ['lofty/lang/class', 'lofty/lang/base','fui/autocomplete/1.0','jquery'], 

function(Class, Base, Autocomplete,$) {
	'use strict';
	
	var Suggestion = Class(Base,{
		defaultOptions:{
			api:"http:\/\/suggest.1688.com\/bin\/suggest", //获取数据API
			param:{}, //需要传入接口的参数
			dataSource:handleAjax,
			filter:filterData,
			beforeRequest:function(){},
			renderList:renderList,
			queryName:'q',
			minLength:0,
			end:0
		},
		/**
		 * 组件内部事件集中在events变量中定义(也可通过bindEvent动态添加事件) 
		 * 其中的{options.classPrefix}会由widget基类自动替代为option中指定的className
		*/
		events:{},
		/**
		 * 入口函数
		 * @param  {object} 配置参数，传入的参数将覆盖默认配置}
		 * @descrpition 根据传入参数，调用AutoComplete组件生成实例
		 */
		init: function(config){
			var self = this;
			this.options = $.extend(true, {}, this.defaultOptions, config);
			this.suggestion = new Autocomplete(this.options);

			//绑定事件
			this.on('dataReady',function(data){
				self.suggestion.trigger('dataReady',data);
			});
			this.suggestion.on('select',function(o){
				self.trigger('select',o);
			});
		},
		hide:function(){
			this.suggestion.hide();
		},
		resetPosition:function(){
			this.suggestion.resetPosition();
			return this;
		},
		
		end:0
	});
	/**
	 * 获取异步数据
	 * @descrpition 调用异步接口，获取数据
	 */
	function handleAjax () {
		if(this.get('beforeRequest')() === false){
			return;
		}
		var self =this,
			api = this.get('api'),
			param = this.get('param'),
			value = $(this.get('target')).val();
		
		param[this.get('queryName')] = value;
		param.encode = 'utf8';
		$.ajax({
			url:api,
            dataType: 'jsonp',
            cache: false,
            data: param,
			success:function(o){
				if(o.result){
					self.trigger("dataReady",o.result)
				}
			}
        });
	};
	/**
	 * 数据干预
	 * @descrpition 如果数据不符合默认格式，可以用此方法转换数据
	 */

	function filterData(dataList,query){
		var _dataArr = [];

		if(typeof dataList === 'undefined' || dataList.length===0){
			return dataList;
		}
		for (var i = 0; i < dataList.length; i++) {
			var _dataItem = dataList[i],
				_dataObj = {};
			_dataObj.label = replaceStr(_dataItem[0],query);
			_dataObj.desc = _dataItem[1];
			_dataArr.push(_dataObj);
		};
		return _dataArr;

	};
	function renderList(){
		if(this.dataList.length === 0){
			this.get('el').hide();
			this.get('el').html('');
			delete this.dataList;
			return;
		}
		var itemCls = this.get('itemClass');
		var clsPrefix = this.get('classPrefix');
		var itemList = [];
		itemList.push('<ul>');
		
		for(var i=0,j=this.dataList.length;i<j;i++){
			if(i===0){
				itemList.push('<li class="' + clsPrefix + '-first-item ' + itemCls + ' fd-clr">');
			}
			else{
				itemList.push('<li class="' + itemCls + ' fd-clr">');
			}
			itemList.push('<span class="fd-left '+ clsPrefix +'-item-left">' + rederReplaceStr(this.dataList[i].label,this.queryValue) + '</span>');
			if(this.dataList[i].desc){
				itemList.push('<span class="fd-right '+ clsPrefix +'-item-right">约' + this.dataList[i].desc + '个宝贝</span>');
			}
			
			
			itemList.push('</li>');
		}
		itemList.push('</ul>');
		var html = itemList.join('');
		this.get('el').html(html);
	}
	function rederReplaceStr (str,query) {
		if(str.indexOf(query).length!==-1){
			str = str.replace(query,'<b>' + query + '</b>');
		}
		return str;
	}
	function replaceStr (str,query) {
		var s = '_'+query+'%';
		if(str.indexOf(s).length!==-1){
			str = str.replace(s,query);
		}
		return str;
	}
	return Suggestion;
});