/**
 * actionsheet
 * base:popup
 * User: jianping.shenjp
 * Date: 14-1-5
 * Time: 下午6:46
 */
define('lofty/ui/actionsheet/1.0/actionsheet', ['lofty/lang/class', 'fui/popup/1.0','jquery'], function(Class, Popup, $) {
    'use strict';

    var ActionSheet = Class ( Popup, {
        show:function(){
            Popup.prototype.show.apply(this);
            this.set('body-overflow',$('body').css('overflow'));
            //设置body的overflow的设置，防止出现滚动条
            $('body').css('overflow','hidden');
        },
        hide:function(){
            this.constructor.superclass.hide.apply(this);
            $('body').css('overflow',this.get('body-overflow'));
        },
        position:function(config){
            var top=this.get('y'),
                left=this.get('x'),
                win=$(window),
                contentLyr=this.get('contentLyr'),
                content=this.get('el'),
                centerTop=(win.height()-content.height()),
                centerLeft=0;

            centerTop=centerTop > 0 ? centerTop : 0;
            //设置content的宽度为100%
            content.width(win.width());

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
        }
    });

    return ActionSheet;
});