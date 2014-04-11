/**
 * Scroller
 * User: lihao.ylh/65936
 * Date: 2014/1/13
 * Time: 下午6:46
 */
define('lofty/ui/scroller/1.0/scroller', ['lofty/gallery/iscroll/iscroll-base', 'lofty/lang/class', 'lofty/lang/base', 'lofty/gallery/appframework/af'],
	function(iScrollBase, Class, Base, $){
		var Scroller = Class(Base, {
			init: function(opts) {

				var that = this, pullDownFlag = false, pullUpFlag = false;
				
				this.container = $(opts.container)[0];

				// 没有指定container直接返回
				if (!this.container) {
					return;
				}
				
				this.topGapThreshold = opts.topGapThreshold || 5;
				this.topSelector = opts.topSelector;
				this.bottomGapThreshold = opts.bottomGapThreshold || 5;
				this.bottomSelector = opts.bottomSelector;
				this.topSelectorHeight = $(this.topSelector).length ? $(this.topSelector).outerHeight() : 0;

				// 截获构造函数中传入的事件，换成用on的方式来绑定。
				this._bindEvent(opts);
				opts = extend(opts, {
					topOffset: opts.topOffset || that.topSelectorHeight,
					onBeforeScrollStart: function(e) {
						that.trigger('beforeScrollStart', e);
					},
					onScrollStart: function() {
						that.trigger('scrollStart');
					},
					onBeforeScrollMove: function(e) {
						// 开始滚动前的事件回调
						// 默认是阻止浏览器默认行为
						e.preventDefault();
						that.trigger('beforeScrollMove');
					},
					onScrollMove: function(e) {
						that.trigger('scrollMove', e);

						if (that.topSelectorHeight > 0) {
							
							// 判断是否需要触发pullDownChange事件
							if (!pullDownFlag && that.iScroller.y > that.topGapThreshold) {
								pullDownFlag = true;
								that.trigger('pullDownChange');
								that.iScroller.minScrollY = 0;
							}
							// 判断是否需要触发pullDownRestore事件
							if (pullDownFlag && that.iScroller.y <= that.topGapThreshold) {
								pullDownFlag = false;
								that.trigger('pullDownRestore');
								that.iScroller.minScrollY = -that.topSelectorHeight;
							}
						}

						//bottomSelectorHeight = $(that.bottomSelector).outerHeight();
						// 判断是否需要触发pullUpChange事件
						// 注：当that.iScroller.maxScrollY > 0时，内容区极短，故做如下分支判断
						if (!pullUpFlag && (that.iScroller.maxScrollY < 0 ? (that.iScroller.y < (that.iScroller.maxScrollY - that.bottomGapThreshold)) : (that.iScroller.y < that.iScroller.minScrollY))) {
                            pullUpFlag = true;
                            that.trigger('pullUpChange');
                        }
                        // 判断是否需要触发pullUpRestore事件
                        if (pullUpFlag && (that.iScroller.maxScrollY < 0 ? (that.iScroller.y >= (that.iScroller.maxScrollY - that.bottomGapThreshold)) : (that.iScroller.y >= that.iScroller.minScrollY))) {
                            pullUpFlag = false;
                            that.trigger('pullUpRestore');
                        } 

					},
					onBeforeScrollEnd: function() {
						that.trigger('beforeScrollEnd');
					},
					onScrollEnd: function() {
						that.trigger('scrollEnd');
						if (pullDownFlag) {
							that.trigger('pullToRefresh');
						}
						if (pullUpFlag) {
							that.trigger('infiniteScroll');
						}
					},
					onTouchEnd: function() {
						that.trigger('touchEnd');
					},
					onRefresh: function() {
						that.trigger('refresh');
						// 每次调用refresh事件时都需要重置标志位
						pullDownFlag = false;
						pullUpFlag = false;
					},
					onDestroy: function() {
						that.trigger('destroy');
					},
					onZoomStart: function() {
						that.trigger('zoomStart');
					},
					onZoom: function() {
						that.trigger('zoom');
					},
					onZoomEnd: function() {
						that.trigger('zoomEnd');
					}
				});
				this.iScroller = new iScrollBase(this.container, opts);

				// 代理原iScroll的方法
				this._delegateMethods();
			},
			_bindEvent: function(opts) {

				var originalEvents = [
					'beforeScrollStart',
					'scrollStart',
					'beforeScrollMove',
					'scrollMove',
					'beforeScrollEnd',
					'scrollEnd',
					'touchEnd',
					'refresh',
					'destroy',
					'zoomStart',
					'zoom',
					'zoomEnd'
				], customEvents = [
					'pullDownChange',
					'pullDownRestore',
					'pullUpChange',
					'pullUpRestore',
					'pullToRefresh',
					'infiniteScroll'
				], allEvents = originalEvents.concat(customEvents);

				// 将事件监听的方式改成用on方式监听
				for (var i=0,leni=allEvents.length; i<leni; i++) {
					var oldOnEvent = opts['on' + capitalize(allEvents[i])];
					if (oldOnEvent) {
						this.on(allEvents[i], oldOnEvent);
					}
				}
				
			},
			_delegateMethods: function() {
				var delegatedMethods = [
					'destory', 
					'refresh', 
					'scrollTo',
					'scrollToElement',
					'scrollToPage',
					'disable',
					'enable',
					'stop',
					'zoom',
					'isReady'
				];
				for (var i=0,leni=delegatedMethods.length; i<leni; i++) {
					this[delegatedMethods[i]] = (function(i) {
						return function() {
							this.iScroller[delegatedMethods[i]].apply(this.iScroller, arguments);
						}
					})(i)
				}
			},
			get: function(key) {
				return this.iScroller[key];
			},
			set: function(key, value) {
				this.iScroller[key] = value;
			},
			getContainer: function() {
				return this.container;
			}
		})

		/**
		 * 简易合并函数，将后边的对象合入前边的对象
		 * @param  {[type]} dest [description]
		 * @param  {[type]} src  [description]
		 * @return {[type]}      [description]
		 */
		function extend(dest, src) {
			var ret = {};
			for (var prop in dest) {
				ret[prop] = dest[prop];
			}
			for (var prop in src) {
				ret[prop] = src[prop];
			}
			return ret;
		}

		/**
		 * 首字母大写
		 * @param  {[type]} str [description]
		 * @return {[type]}     [description]
		 */
		function capitalize(str) {
			if (!str) {
				return str;
			}
			return str[0].toUpperCase() + str.substr(1);
		}

		return Scroller;
	});