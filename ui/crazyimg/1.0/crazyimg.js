/**
 * @module crazyimg
 * @author shanshan.hongss 
 * @date 20131205
 * @usefor 对图片根据drp和网络进行适配
 */

define('lofty/ui/crazyimg/1.0/crazyimg', ['jquery','lofty/lang/class'], function($, Class){
    'use strict';
    var DATA_ORIGINAL_IMAGE = 'origimg',   //原始图片自定义属性名
        DATA_RESPONSIVE_RULE = 'imgrule',  //在img标签上的图片响应式规则自定义属性名；标签上的规则优先级最高
        networkStatus, responsiveNsCallback = {};  //当值为null时，说明无需适配网络；
    
    var CrazyImg = Class({
        options:{
            container:$(document),
            atAttr:'src',  //将适配后的图片URL设置在哪个标签属性值上
            rule: {   //默认规则，HTML代码中还有另一套书写格式
                dpr: {'1':1, '2':2}, //dpr 表示 device pixel ratio，数字表示与基数尺寸的倍数
                ns: {'2g':1},  //ns 表示 network speed；2g|3g|wifi(都用小写字母)，数字表示与基数尺寸的倍数;网络规则优先级高于dpr规则
                reg: /(\.((\d+)x(\d+)|search)){0,1}.jpg$/,  //获取图片宽度、高度的正则表达式；此表达式只适用中文站的图片格式
                replaceImg: null  //替换时需要执行的函数；当正则表达式改变时，一般情况下需要传入此函数
            },
            eachAfter: null,   //每张图片属性设置后
            complete: null   //所有图片属性设置后
        },
        init: function( opts ){
            opts = $.extend(true, {}, this.options, opts);
            
            var container = getElem(opts.container),
                self = this,
                images = $('img[data-'+DATA_ORIGINAL_IMAGE+']', container),
                random = Math.floor(Math.random() * 10000);  //每个实例都会有一个唯一的随机数
            
            images.each(function(i, img){
                var imgEl = $(this),
                    origImg = imgEl.data(DATA_ORIGINAL_IMAGE),
                    imgRule = imgEl.data(DATA_RESPONSIVE_RULE), 
                    rule = $.extend(true, {}, opts.rule, imgRule);
                
                if (networkStatus===null){
                    responsiveDpr(imgEl, origImg, rule, opts.atAttr);
                    
                    if (opts.eachAfter && $.isFunction(opts.eachAfter)){
                        opts.eachAfter.call(self, imgEl, i, rule);
                    }
                } else if (typeof networkStatus==='undefined'){
                    if (!responsiveNsCallback['nsc_'+random]){
                        responsiveNsCallback['nsc_'+random] = {};
                        responsiveNsCallback['nsc_'+random]['fn'] = [];
                        responsiveNsCallback['nsc_'+random]['self'] = self;
                        responsiveNsCallback['nsc_'+random]['opts'] = opts;
                    }
                    responsiveNsCallback['nsc_'+random]['fn'][i] = function(){
                        responsiveNs(imgEl, origImg, rule, opts.atAttr);
                        
                        if (opts.eachAfter && $.isFunction(opts.eachAfter)){
                            opts.eachAfter.call(this, imgEl, i, rule);
                        }
                    };
                } else {
                    responsiveNs(imgEl, origImg, rule, opts.atAttr);
                }
            });
            
            if (typeof networkStatus!=='undefined' && opts.complete && $.isFunction(opts.complete)){
                opts.complete.call(this, container);
            }
        },
        
        end:0
    });
    
    //适配网络
    function responsiveNs(imgEl, origImg, rule, atAttr){
        var nsRule = getNetworkRule(rule);
        if (nsRule){
            var imgSrc = getImageUrl(origImg, nsRule, rule.reg, rule.replaceImg);
            imgEl.attr(atAttr, imgSrc);
        } else {
            responsiveDpr(imgEl, origImg, rule, atAttr);
        }
    }
    //适配DPR
    function responsiveDpr(imgEl, origImg, rule, atAttr){
        var dprRule = getDprRule(rule),
            imgSrc = getImageUrl(origImg, dprRule, rule.reg, rule.replaceImg);
        
        imgEl.attr(atAttr, imgSrc);
    }
    
    function getDprRule(rule){
        var dpr = getDpr(), 
            dprRule = rule.dpr, imgRule;
        
        if (dprRule[dpr]===null || typeof dprRule[dpr]==='undefined'){
            var arrRdpr = [], curDpr;
            for (var p in dprRule){
                arrRdpr.push(p);
            }
            arrRdpr.sort(function(a, b){
                return Number(b)-Number(a);
            });
            if (arrRdpr[0]<dpr){
                curDpr = arrRdpr[0];
            } else {
                var result, l=arrRdpr.length;
                for (var i=0; i<l; i++){
                    if (arrRdpr[i]<dpr){
                        result = arrRdpr[i-1];
                        break;
                    }
                }
                if (!result){
                    result = arrRdpr[l];
                }
                curDpr = result;
            }
            imgRule = dprRule[curDpr];
        } else {
            imgRule = dprRule[dpr];
        }
        return imgRule;
    }
    
    function getNetworkRule(rule){
        var nsRule = rule.ns;
        return nsRule[networkStatus];
    }
    function getImageUrl(origImg, imgRule, reg, replaceImg){
        return origImg.replace(reg, function(a, b, c, width, e, height, g){
            if (replaceImg && typeof replaceImg==='function'){
                return replaceImg.call(this, arguments);
            } else {
                //如果是数字就基于初始图片的宽度进行计算(乘法)
                if ($.isNumeric(imgRule)){
                    var rule = Number(imgRule),
                        width = arguments[3],
                        height = arguments[4];
                    //.search.jpg 实际高宽为 150x150
                    if (arguments[2]==='search'){
                        width = 150;
                        height = 150;
                    } 
                    if (width && height) {
                        var rule = Number(imgRule),
                            newW = Number(width) * rule,
                            newH = Number(height) * rule;
                        return '.'+String(newW)+'x'+String(newH)+'.jpg';
                    } else {
                        lofty.log('提供的1x图片必须指定高和宽！', 'warn');
                    }
                } else if(imgRule===''){
                    return '.jpg';
                } else {
                    return '.'+imgRule+'.jpg';
                }
            }
        });
    }
    
    function getDpr(){
        var dpr = 1;
        if(window.devicePixelRatio !== undefined) {
			dpr = window.devicePixelRatio;
		} else if (window.matchMedia !== undefined) {
			for (var i = 1; i <= 2; i += 0.5) {
				if (window.matchMedia('(min-resolution: ' + i + 'dppx)').matches) {
					dpr = i;
				}
			}
		}
        getDpr = function(){
            return dpr;
        }
        return dpr;
    }
    
    
    //获取网络状态立即执行，无需在调用的时候执行
    ;(function getNetworkStatus(){
        if (window.WindVane_Native && window.WindVane_Native.callMethod){
            window.alibaba.call("UINavigation","getNetWorkStatus"," ", function success(param){
                for ( var pre in responsiveNsCallback){
                    networkStatus = param.status.toLowerCase();
                    
                    if (responsiveNsCallback[pre]['fn'].length){
                        
                        for (var i=0, l=responsiveNsCallback[pre]['fn'].length; i<l; i++){
                            responsiveNsCallback[pre]['fn'][i].call(responsiveNsCallback[pre]['self']);
                        }
                        
                        if (responsiveNsCallback[pre]['opts'].complete && $.isFunction(responsiveNsCallback[pre]['opts'].complete)){
                            responsiveNsCallback[pre]['opts'].complete.call(responsiveNsCallback[pre]['self'], responsiveNsCallback[pre]['opts'].container);
                        }
                    }
                }
                
                
            });
        } else {
            networkStatus = null;
        }
    })();
    
    function getElem( elem ){
        if (typeof elem==='string'){
            return $(elem);
        }
        return elem;
    }
    
    return CrazyImg;
});