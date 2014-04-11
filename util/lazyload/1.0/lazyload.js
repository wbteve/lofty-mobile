/**
 * @module lofty/util/lazyload
 * @author chuanpeng.qchp
 * @date 20140110
 * 
 */
  
define( 'lofty/util/lazyload/1.0/lazyload', ['lofty/lang/class', 
													 'lofty/lang/base', 
													 'jquery'], 
	function(Class, Base,$){
	'use strict';
	var IMGSRCNAME = 'data-lazyload-src', 
		TEXTAREACLASSNAME = 'lazyload-textarea';
	var DataLazyload = Class( Base,{
		options: {
			scroller:null,
			container: {
				getter: function(s) {
					if ('string' === typeof s) {
						s = $(s);
					}
					return s;
				}
			},
			autoLoad:true,
			threshold:200
		},
		
		init:function (config){
			//this.options = $.extend(true, {},this.options);
			Base.prototype.init.call(this, config || {});
			if(!this.get('scroller')){
				this.scrollerRoot = 'body';
			} else{
				this.scrollerRoot = this.get('scroller').getContainer();
			}
			if(!this.get('container')){
				this.set('container',this.scrollerRoot);
			}
			if(this.get('autoLoad')){
				bindExposureEvent.call(this);
			}
		},
		collectResouce:function(container){
			collect.call(this,container);
			this.start();
		},
		pause:function(){
			this.isPaused = true;
		},
		isPause:function(){
			return !!this.isPaused;
		},
		start:function(){
			this.isPaused = false;
			this.completed = false;
			bindExposureEvent.call(this);
		},
		addCallBack:function(selector,callback){
			if(callback === undefined && $.isPlainObject(selector)){
				for(var each in selector){
					if($.isFunction(selector[each])){
						this.addCallBack(each,selector[each]);
					}
				}
				return;
			}
			if(!this.callBackSource){
				this.callBackSource = {};
			}
			if(this.callBackSource[selector]){
				this.callBackSource[selector].push(callback);
			} else{
				this.callBackSource[selector] = [callback];
			}
		}
	});
	
	function collect(container){
		if(!this.imgs){
			this.imgs = [];
		}
		if(!this.textareas){
			this.textareas = [];
		}
		
		for(var i=0,j=container.length;i<j;i++){
			
			
			if($(container[i]).hasClass(TEXTAREACLASSNAME)){
				this.textareas.push(container[i])
			}else {
				//先缓存具有回调方法的元素
				cachecallbackEls.call(this,container[i]);
				try{
					if($(container[i]).attr(IMGSRCNAME)){
						this.imgs.push(container[i]);
					} 
				} catch(e){
				}
				
				var tempImgs = $('img[' + IMGSRCNAME + ']', $(container[i]));
				for(var tmpImgI = 0,imgLen = tempImgs.length;tmpImgI<imgLen;tmpImgI++){
					this.imgs.push(tempImgs[tmpImgI]);
				}
				var tempAreas = $('.' + TEXTAREACLASSNAME, $(container[i]));
				for(var tmpAreaI = 0,areaLen = tempAreas.length;tmpAreaI<areaLen;tmpAreaI++){
					this.textareas.push(tempAreas[tmpAreaI]);
				}
			}
		}
	}
	
	function loadExposedSource(){
		this.rootOutTopH = parseInt($(this.scrollerRoot).css('borderTopWidth')) + parseInt($(this.scrollerRoot).css('paddingTop')),
		this.rootOutBottomH = parseInt($(this.scrollerRoot).css('borderBottomWidth')) + parseInt($(this.scrollerRoot).css('paddingBottom')),
		this.rootH = parseInt($(this.scrollerRoot).css('height')),
		this.rootOffsetTop = $(this.scrollerRoot).offset().top;
		loadTextarea.call(this);
		loadImg.call(this);
		exposeCallBack.call(this)
		if((!this.callbackEls || this.callbackEls.length===0) && 
		    (!this.textareas || this.textareas.length === 0) && 
			(!this.imgs || this.imgs.length ===0)){
			this.completed = true;
		}
	}
	function exposeCallBack(){
		if(!this.callbackEls) return;
		for(var i=0;i<this.callbackEls.length;){
			if(hasExposed.call(this,this.callbackEls[i].element)){
				var callbacks = this.callbackEls[i].callBacks;
				for(var m=0,n=callbacks.length;m<n;m++){
					callbacks[m](this.callbackEls[i].element);
				}
				this.callbackEls.splice(i, 1);
			} else{
				i++;
			}
		}
	}
	function cachecallbackEls(container){
		if(!this.callBackSource){
			return;
		}
		if(!this.callbackEls){
			this.callbackEls = [];
		}
		for(var selector in this.callBackSource){
			if($(selector).index(container) !== -1){
				addCallbackTo.call(this,container,selector)
			}
			var sons = $(selector,$(container));
			for(var i=0,len=sons.length;i<len;i++ ){
				addCallbackTo.call(this,sons[i],selector);
			}
		}
	}
	function addCallbackTo(el,selector){
		for(var i=0,j=this.callbackEls.length;i<j;i++){
			if(this.callbackEls[i].element === el){
				for(var m=0,n=this.callBackSource[selector].length;m<n;m++){
					this.callbackEls[i].callBacks.push(this.callBackSource[selector][m]);
				}
				return;
			}
		}
		this.callbackEls.push({
			element:el,
			callBacks:this.callBackSource[selector].slice(0)
		});
	}
	function hasExposed(item){
		var threshold = this.get('threshold'), 
		   itemOffsetTop = $(item).offset().top,
		   itemHeight = $(item).height();
		if(this.get('scroller')){
			if (
						(itemOffsetTop - threshold <=  this.rootOffsetTop + this.rootH - this.rootOutBottomH) 
					&&  (itemOffsetTop + itemHeight + threshold > this.rootOffsetTop +  this.rootOutTopH )
			) {
				return true;
			}
			return false;
			
		}else{
		 
			var currentScrollTop, 
				viewportHeight = $(window).height();
			if (typeof window.pageYOffset != 'undefined') { 
				currentScrollTop = window.pageYOffset; 
			} 
			else if (typeof document.compatMode != 'undefined' && document.compatMode != 'BackCompat') { 
				currentScrollTop = document.documentElement.scrollTop; 
			}
			else if (typeof document.body != 'undefined') { 
				currentScrollTop = document.body.scrollTop; 
			} 
			if (
						(itemOffsetTop - threshold <=  currentScrollTop + viewportHeight) 
					&&  (itemOffsetTop + itemHeight + threshold > currentScrollTop )
			) {
				return true;
			}
			return false;
		}
			
	}

	function loadTextarea(){
		for(var i = 0;i<this.textareas.length;){
			if(hasExposed.call(this,this.textareas[i])){
				var html = $(this.textareas[i]).val();
				var $elements = $(html);
				$elements.insertBefore($(this.textareas[i]));
				$(this.textareas[i]).remove();
				this.textareas.splice(i, 1);
				collect.call(this,$elements);
			}else{
				i++;
			}
			
		}
	}
	function loadImg(){
		for(var i = 0;i<this.imgs.length;){
			if(hasExposed.call(this,this.imgs[i])){
				var src,el = $(this.imgs[i]);
				src = el.attr(IMGSRCNAME);
				if (src) {
					el.attr('src', src);
					el.removeAttr(IMGSRCNAME);
				}
				this.imgs.splice(i, 1);
			} else{
				i++;
			}
		}
	}

	function bindExposureEvent(){
		//绑定滚动事件
		if(!this.hasInit){
			collect.call(this,this.get('container'));
			this.hasInit = true;
		}
		loadExposedSource.call(this);
		if(this.hasBindEvent){ 
			return;
		}
		var self = this;
		if(this.get('scroller')){
			this.get('scroller').on("scrollMove",function(e){
				if(self.scrollTimeoutId){
					clearTimeout(self.scrollTimeoutId);
				}
				self.scrollTimeoutId = setTimeout(function(){
					if(!self.isPaused && !self.completed){
						loadExposedSource.call(self);
					}
				},50)
				
			});
			this.get('scroller').on("scrollEnd",function(){
				if(!self.isPaused && !self.completed){
					loadExposedSource.call(self);
				}
			});
		} else {
			$(window).on('scroll',function(){
				if(self.scrollTimeoutId){
					clearTimeout(self.scrollTimeoutId);
				}
				self.scrollTimeoutId = setTimeout(function(){
					if(!self.isPaused && !self.completed){
						loadExposedSource.call(self);
					}
				},50)
			})
		}
		
		
		
		
		this.hasBindEvent = true;
	}
	return DataLazyload;
  
  });
  
    	