/**
 * 倒计时组件
 * @module lofty/ui/timer
 * @author daniel.xud
 * @date 2013-09-11
 * @version  1.0
 * @dependence lofty/alicn/now/1.0/now：获取服务器时间
 * @modify shanshan.hongss for mobile - 改用css3Animate
 */

define('lofty/ui/timer/1.0/timer', ['lofty/lang/class', 'lofty/ui/widget/1.0/widget', 'lofty/alicn/now/1.0/now', 'jquery'], function(Class, Widget, Now, $) {
	'use strict';

	var TMAP = ['year', 'month', 'day', 'hour', 'minute', 'second'],
		FMAP = {
			year: 'yyyy',
			month: 'MM',
			day: 'dd',
			hour: 'hh',
			minute: 'mm',
			second: 'ss'
		};

	var Timer = Class(Widget, {
		/**
		 * 默认配置
		 */
		options: {
			format: 'y-M-d hh:mm:ss', 		// 设置时间的显示格式，双字母会在一位数时补0
			to: new Date(), 				// 结束时间，可用数组 [Date, Date, ...]
			stopEventName: 'stop', 			// 结束后触发的事件名，可用数组	[String, String, ...]
			useServerTime: false, 			// 是否使用服务器时间
			step: 1, 						// 跳动频率（单位秒）
			animate: false, 				// 是否动画显示（动画显示需要配合样式文件）
			fixInterval: false,				// 是否做跑偏修正（每60秒修正一次）
			autoStart: true 				// 是否自动开始
		},

		/**
		 * 初始化
		 */
		_create: function() {
			var self = this,
				container = self.get('el'),
				to = self.get('to'),
				tmp = '<dl><dd></dd></dl>';
            
			// 缓存每个dom节点
			$.each(TMAP, function(i, item) {
				var placeholder = $('.' + item, container);
				if (placeholder.length) {
					self['ph' + item] = placeholder;
					if (self.get('animate')) {
					    placeholder.html(item === 'year' ? tmp : (tmp + tmp));
					    self['ph' + item] = placeholder.children();
					}
				}
			});

			// 设置属性
			// 是否有多阶段
			self.multiStage = $.isArray(to) ? to.length : false;
			// 结束时间
			self.endTime = self.multiStage ? to[0] : to;
			// 当前阶段
			self.currentStage = self.multiStage ? 1 : false;
			// 跑偏修复时间间隔
			self.fixInterval = self.get('fixInterval') ? 60 : false;
            
			self.on('timeReady', function() {
                self._setEndDiff();
				// 时间是否准备好
				self.timeReady = true;
				if (self.get('autoStart')) {
                    self._start();
				}
			});

			self._setServerDiff();
		},

		/**
		 * 开始倒计时
		 */
		_start: function() {
			this._interval();
			return this;
		},

		/**
		 * 对外方法：设置开始时间
		 * 此方法主要用来调试，在console中直接执行，更改当前时间
		 * @param {Date||String} date 需要设置的新时间
		 */
		setStartTime: function(date) {
			var self = this,
				t;

			if (date.constructor === Date) {
				t = date;
			}else if(date.constructor === String){
				t = new Date(date);
			}else{
				return;
			}

			self.debugTime = t;
			self.stop()._setEndDiff()._start();
			return self;
		},

		/**
		 * 对外方法：开始倒计时
		 */
		start: function() {
			var self = this;

			if (self.timeReady) {
				// 如果时间已经准备好，直接开始
				self._start();
			} else {
				// 否则等时间准备好再开始
				self.on('timeReady', function() {
					self._start();
				});
			}
			return self;
		},

		/**
		 * 对外方法：结束倒计时
		 */
		stop: function() {
			var self = this,
				stopEventName = self.get('stopEventName');

			if (self.timer) {
				clearTimeout(self.timer);
				delete self.timer;
				if (self.multiStage && self.currentStage < self.multiStage) {
					// 有多阶段并且还没有执行完，进入下一个倒计时
					// 触发此次倒计时结束事件
					self.trigger(stopEventName[self.currentStage - 1]);
					// 设置下一个时间
					self.endTime = self.get('to')[self.currentStage++];
					self._setEndDiff()._start();
				} else if (self.multiStage) {
					// 有多阶段并且已执行完
					self.trigger(stopEventName[self.currentStage - 1]);
				} else {
					self.trigger(stopEventName);
				}
			}
			return self;
		},

		/**
		 * 设置开始到结束的时间差
		 */
		_setEndDiff: function() {
			var self = this,
				t = self.debugTime || new Date();	// 开始时间，若有debug，以debug优先

			t.setTime(t.getTime() + self.serverDiff);
			self.diff = new Date(self.endTime - t);
			return self;
		},

		/**
		 * 设置客户端时间与服务器时间的差值
		 */
		_setServerDiff: function() {
			var self = this;
			if(self.get('useServerTime') && Now){
                Now.now(function(time){
                    self.serverDiff = time ? time - (new Date()).getTime() : 0;
					self.trigger('timeReady');
				});
			}else{
				self.serverDiff = 0;
				self.trigger('timeReady');
			}
			
			return self;
		},

		/**
		 * 计时器
		 */
		_interval: function() {
			var self = this,
				diff = self.diff;

			if (diff < 0) {
				self.stop();
				return;
			}

            var diffMap = self._getDiffMap();
            
			if (self.get('animate')) {
				$.each(TMAP, function(i, item) {
					var preVal = self[item] || 0,
						val = diffMap[item];
					if (self['ph' + item] && preVal !== val) {
						//animate
						self._animate(self['ph' + item], preVal, val);
						self[item] = val;
					}
				});
			} else {
				$.each(TMAP, function(i, item) {
					var val = diffMap[item];
                    
                    if (self['ph' + item] && self[item] !== val) {
						self['ph' + item].html((val < 10 && self.get('format').indexOf(FMAP[item]) > -1) ? '0' + val : val);
						self[item] = val;
					}
				});
			}

			// 重置时间差
			self.diff = new Date(self.diff - 1000 * self.get('step'));
			// 跑偏修复
			if (self.fixInterval && diffMap.second % self.fixInterval === 0) {
				self._setEndDiff();
			}

			// 继续调用计时器，考虑到一些计算成本，将延迟设置为990ms
			self.timer = setTimeout(function() {
				self._interval.call(self);
			}, 990 * self.get('step'));
		},
        /**
         * 获取时间差值对象  add by hongss
         * @return {Object} {second:xxx,minute:xxx,...} 如果显示处只有到day，则会把后面的月跟年都会折算成天
         */
        _getDiffMap: function(){
            var self = this,
                diff = this.diff,
                diffMap = {};
            
            for (var i=TMAP.length-1; i>=0; i--){
                if (self['ph'+TMAP[i]] && self['ph'+TMAP[i]][0]){
                    switch (TMAP[i]){
                        case 'second':
                            diffMap[TMAP[i]] = diff.getUTCSeconds();
                            break;
                        case 'minute':
                            diffMap[TMAP[i]] = diff.getUTCMinutes();
                            break;
                        case 'hour':
                            diffMap[TMAP[i]] = diff.getUTCHours();
                            break;
                        case 'day':
                            diffMap[TMAP[i]] = diff.getUTCDate() - 1;
                            break;
                        case 'month':
                            diffMap[TMAP[i]] = diff.getUTCMonth();
                            break;
                        case 'year':
                            diffMap[TMAP[i]] = diff.getFullYear() - 1970;
                            break;
                    }
                } else {
                    switch (TMAP[i+1]){  //Date.parse(diff)
                        case 'second':
                            diffMap[TMAP[i+1]] = Date.parse(diff)/1000;
                            break;
                        case 'minute':
                            diffMap[TMAP[i+1]] = Math.floor(Date.parse(diff)/(1000*60));
                            break;
                        case 'hour':
                            diffMap[TMAP[i+1]] = Math.floor(Date.parse(diff)/(1000*60*60));
                            break;
                        case 'day':
                            diffMap[TMAP[i+1]] = Math.floor(Date.parse(diff)/(1000*60*60*24));
                            break;
                        case 'month':
                            diffMap[TMAP[i+1]] = diff.getUTCMonth()+((diff.getFullYear()-1970)*24);
                            break;
                        case 'year':
                            diffMap[TMAP[i+1]] = diff.getFullYear() - 1970;
                            break;
                    }
                    break;
                }
            }
            return diffMap;
        },
		/**
         * 动画执行函数
         * @param {Object} dds dd容器
         * @param {Object} pre 之前的值
         * @param {Object} now 之后的值
         */
        _animate: function(dls, pre, now){
            var self = this,
            	len = dls.length, 
            	i = 0, 
            	p, n;
            pre = _strFix(pre, len);
            now = _strFix(now, len);
            for (; i < len; i++) {
                p = pre.charAt(i);
                n = now.charAt(i);
                if (p !== n) {
                    var dl = $(dls[i]), di = dl.children(), dd = $('<dd>').addClass('num' + n),
                        dlHeight = dl.height();
                    //dl.append(dd);
                    /*di.animate({
                        marginTop: '-' + di.height() + 'px'
                    }, 800, function(){
                        $(this).remove();
                    });*/
                    
                    di.css3Animate({
						y: '-' + dlHeight*n + 'px',
						time: 800,
						complete: function() {
							
						}
					});
                }
            }
        }

	});

	return Timer;

	/**
     * 对不足长度的字符串，补0
     * @param {Object} len
     */
    function _strFix(str, len){
        str = str + '';
        var i = len - str.length;
        while (i) {
            str = '0' + str;
            i--;
        }
        return str;
    }
});