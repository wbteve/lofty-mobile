/**
 * @module fui/ui/autocomplete
 * @from 
 * @author chuanpeng.qchp
 * @date 20140106
 * */ 
 
define( 'lofty/ui/autocomplete/1.0/autocomplete', 
	  ['lofty/lang/class',
	   'fui/widget/1.0',
	   'util/tplhandler/1.0',
	   'jquery'], 
function( Class,Widget,TplHandler,$){
	'use strict';
    var Autocomplete = Class(Widget,{
		options:{
			target:"",
			dLeft:0,    //向左微调，当为负数时表示向右微调
			dTop:0,     //向上微调，当为负数时表示向下微调
			minLength:1, //触发采集数据时，target中字符数的最短长度
			filter:null,//对数据集进行过滤显示在下拉框中，对于异步请求数据的情况，一般设置filter为null或空字符串
			renderList:renderList,
			dataSource:null,   //可以是数组||function 与下拉列表中的数据
			classPrefix:"fui-autocomplete",
			itemClass:"fui-autocomplete-item"
		},
		events:{
			'.{options.itemClass}': {
				'click':onItemClick
			}
		},
		/**
		 * widget子类的入口函数，需要根据组件逻辑实现
		 * node为组件的父容器
		*/
		_create: function(){
			bindTargetEvent.call(this);
			this.render();
			var self = this;
			this.on("dataReady",function(){
				onDataReady.apply(self,arguments);
			});
		},
		handleTpl:function(){
			var data = {};
			data.classPrefix = this.get('classPrefix');
			TplHandler.process.call(this,data);
		},
		hide:function(){
			this.get('el').hide();
		},
		resetPosition:function(){
			var target = this.get('target');
			var tY = $(target).offset().top,
				tH = $(target).height(),tW;
			setPosition.call(this,0,tY + tH);
			return this;
		},
		tpl:[
			'<div class="<%= classPrefix %>">',
			'</div>'
		].join(''),
		end:0
		
	});
	function onDataReady(dataList){
		var minLen = this.get('minLength'),
			target = this.get('target');
		if($(target).val().length < minLen){
			return;
		}
		var clsPrefix = this.get('classPrefix');
		var filter = this.get('filter');
		if(filter){
			// 进行过滤
			dataList = filter.call(this, dataList, this.queryValue);
		}
		this.dataList = dataList;
		//重置宽度和位置
		if(this.get('el').css('display') === 'none'){
			this.resetPosition();
			this.get('el').show();
		}
		this.get('renderList').call(this);
	}
	function bindTargetEvent(){
		var target = this.get('target');
		var prefix = this.get('classPrefix');
		var self = this;
		$(target).on('input.' + prefix + 'target',function(e){
			targetValueChange.call(self,e);
		});
	}
	function unbindTargetEvent(){
		var target = this.get('target');
		var prefix = this.get('classPrefix');
		$(target).off('input.' + prefix + 'target');
	}
	function setPosition(x,y){
		var dl = this.get('dLeft'),dt = this.get('dTop');
		var left = x - dl,top = y - dt;
		this.get('el').css({
			'top':top,
			'left':left
		});
	}
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
				itemList.push('<li class="' + clsPrefix + '-first-item ' + itemCls + '">');
			}
			else{
				itemList.push('<li class="' + itemCls + '">');
			}
			itemList.push(this.dataList[i].label);
			itemList.push('</li>');
		}
		itemList.push('</ul>');
		var html = itemList.join('');
		this.get('el').html(html);
	}
	function onItemClick(e){
		var itemCls = this.get('itemClass');
		var target = this.get('target');
		var idx = this.get('el').find('.' + itemCls).index(e.currentTarget);
		$(target).val(this.dataList[idx].label);
		this.get('el').hide();
		this.get('el').html('');
		this.trigger("select",idx,this.dataList[idx]);
	}
	
	function targetValueChange(e){
		var minLen = this.get('minLength');
		if($(e.currentTarget).val().length >= minLen){
			this.queryValue = $(e.currentTarget).val();
			showItemList.call(this);
		}
		else{
			this.get('el').html('');
			this.get('el').hide();
		}
	}
	function showItemList(){
		var dataSource = this.get('dataSource');
		var dataList;
		if(isArray(dataSource)){
			dataList = dataSource;
		}else if(isFunction(dataSource)){
			dataList = dataSource.call(this);
		}
		if(dataList)
		{
			this.trigger("dataReady",dataList);
		}
	}
	
	
	var toString = {}.toString,
		isFunction = function( o ){
			return toString.call( o ) === '[object Function]';
		},
		isString = function( o ){
			return 'string' === typeof o;
		},
		isArray = function( o ){
			return toString.call( o ) === '[object Array]';
		},
		isObject = function(o){
			return toString.call( o ) === '[object Object]';
			
		};
	return Autocomplete;
} );
