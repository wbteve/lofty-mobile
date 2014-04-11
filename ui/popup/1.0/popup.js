/**
 * popup
 * User: jianping.shenjp
 * Date: 14-1-5
 * Time: 下午6:46
 */
define( 'lofty/ui/popup/1.0/popup', ['lofty/lang/class', 'fui/widget/1.0','jquery'], function(Class, Widget, $) {
    'use strict';

    var Popup = Class ( Widget, {
        options: {
            zindex:1688,
            isModal:false,
            maskAttr:{},
            beforeOpen:function(popup){
                return true;
            },
            beforeClose:function(popup){
            },
            contentSuccess:function(popup){
            },
            afterOpen: function(popup) {

            }
        },

        _create:function (){
            var contentLyr = this._crateContentLyr();
            this.set("contentLyr",contentLyr);

            var content = this.get('el');
            content.show();
            //重新设置内容的宽度，将百分比宽度计算成px的
            //content.width(content.width());	// bugfix by terence.wangt
            contentLyr.append(content);
            this.get("contentSuccess").apply(this,[this.get("el")]);
        },

        //设置外框的默认属性
        _crateContentLyr : function(){
            var contentLyr = $('<div></div>');
            contentLyr.addClass("fui-popup");
            contentLyr.css({
                display: 'none',
                position: 'fixed',
                'z-index':this.get('zindex')
            });
            contentLyr.appendTo('body');
            return contentLyr;
        },

        //锁屏
        _modal:function(config){
            //modal的默认属性
            var maskConfig={
                    maskColor:'#000',
                    maskOpacity:"0.3"
                },
                maskElment=this.get('maskElment');

            //合并自定义配置和默认配置
            $.extend(true, maskConfig, config);
            //如果用于遮罩的元素不存在则创建该元素，并初始化其基本style属性；如果存在则使用已经存在的元素
            if(!maskElment){
                maskElment=$('<div></div>');
                maskElment.css({
                    'position':'fixed',
                    'top' : '0px',
                    'left' : '0px',
                    'display':'none'
                });
                //把创建出来的元素添加到body中
                maskElment.appendTo('body');

                //把当前为udefined的maskElment元素设置为刚创建出来的maskElment元素
                this.set('maskElment',maskElment);
            };
            maskElment.width("100%");
            maskElment.height("100%");

            //设置用户配置的属性
            maskElment.css({
                'z-index':this.get('zindex')-1,
                'background':maskConfig.maskColor,
                'display':'block',
                opacity:maskConfig.maskOpacity
            });
            maskElment.show();

            //阻止默认事件
            maskElment.off('touchstart',_predf);
            maskElment.off('touchend',_predf);
            //属性选择事件
            maskElment.off('selectstart',_predf);
            maskElment.on('touchstart',_predf);
            maskElment.on('touchend',_predf);
            maskElment.on('selectstart',_predf);
        },

        //解锁
        _unModal:function(){

            var maskElment=this.get('maskElment');
            if(!!maskElment){
                maskElment.hide();
                //解除阻止默认
                maskElment.off('touchstart',_predf);
                maskElment.off('touchend',_predf);
                maskElment.off('selectstart',_predf);
            }
        },

        show:function(){
            if(this.get("isShow")){
                return;
            }
            if(!this.get("beforeOpen").apply(this,[this.get("el")])){
                return;
            }
            var contentLyr = this.get("contentLyr");
            var that=this,
                timers=this.get('timers');

            //注册buttons事件
            this._removeBtnEvt();
            this._addBtnEvt();

            if(this.get('isModal')===true){
                this._modal(this.get('maskAttr'));
            }

            contentLyr.show();
            this.position();//设置dialog的位置

            if(this.get("afterOpen")){
                this.get("afterOpen").apply(this,[this.get("el")]);
            }
            //注册timers回调
            if(timers!==undefined){
                (function(){
                    for(var i=0 ;i<timers.length;i++){
                        (function(i){
                            var timer=timers[i];
                            setTimeout(function(){
                                timer.callback.call(that,that.get("el"),timer.paramObj);
                            },timer.time);
                        })(i)
                    }
                })();
            }

            //设置展示状态
            this.set("isShow",true);
            $(window).on('orientationchange.popup', function() {
                setTimeout(function(){
                    self.resize();
                },300);
            });
        },

        hide:function(){
            if(!this.get("isShow")){
                return;
            }
            this.get("beforeClose").apply(this,[this.get("el")]);
            var contentLyr=this.get('contentLyr');

            contentLyr.hide();
            this._unModal();
            this.set("isShow",false);

            //移出buttons事件
            this._removeBtnEvt();
            $(window).off('orientationchange.popup');
        },

        position:function(config){
            var top=this.get('y'),
                left=this.get('x'),
                win=$(window),
                contentLyr=this.get('contentLyr'),
                content=this.get('el'),
                centerTop=(win.height()-content.height())/2,
                centerLeft=(win.width()-content.width())/2;

            centerTop=centerTop>0?centerTop:0;
            centerLeft=centerLeft>0?centerLeft:0;

            if(!!config){
                top = (typeof config.y) != "undefined"?config.y:top;
                left = (typeof config.x) != "undefined"?config.x:left;
                this.set('y',top);
                this.set('x',left);
            };

            (typeof top) != "undefined"?
                contentLyr.css({'top': top}):
                contentLyr.css({'top': centerTop+'px'});
            (typeof left) != "undefined"?
                contentLyr.css({'left': left}):
                contentLyr.css({'left': centerLeft +'px'});
        },

        _addBtnEvt:function(){
            var content=this.get('el'),
                buttons=this.get('buttons'),
                that = this;
            if(buttons!==undefined){
                (function(){
                    for(var i=0 ;i<buttons.length;i++){
                        (function(i){
                            var button=buttons[i];
                            content.on(buttons[i].event,buttons[i].selector,function(event){
                                _predf(event);
                                button.callback.call(that,that.get("el"),button.paramObj);
                            });
                        })(i)
                    }
                })();
            }
        },

        _removeBtnEvt:function(){
            var content=this.get('el'),
                buttons=this.get('buttons');
            if(buttons!==undefined){
                (function(){
                    for(var i=0 ;i<buttons.length;i++){
                        (function(i){
                            var button=buttons[i];
                            content.off(buttons[i].event,buttons[i].selector);
                        })(i)
                    }
                })();
            }
        },

        //组件默认事件
        events:{
            'window':{
                'resize.popup': 'resize'
            }
        },

        resize:function(e){
            this.position();
        },

        winScrollTop:function(){
            return window.pageYOffset;
        }
    });

    return Popup;

    //===================下面为内部私有方法=================//
    //阻止默认行为
    function _predf(e){
        e.preventDefault();
    };
});